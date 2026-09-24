"use server";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/auth";
import { esCategoria, type Categoria } from "@/lib/constants";
import { esFechaValida, numeroPuzzle } from "@/lib/date";
import { audioBucket, supabaseAdmin } from "@/lib/supabase/admin";
import { esUuid } from "@/lib/text";
import type { Relato, SourceType } from "@/lib/types";

type Resultado<T = undefined> = { ok: true; data: T } | { ok: false; error: string };

const ok = <T,>(data: T): Resultado<T> => ({ ok: true, data });
const fallo = (error: string): Resultado<never> => ({ ok: false, error });

// ---------------------------------------------------------------------
// Relatos
// ---------------------------------------------------------------------

export interface RelatoInput {
  id?: string;
  categoria: Categoria;
  jugador: string;
  equipo: string;
  rival: string;
  competicion: string;
  anio: number;
  source_type: SourceType;
  audio_path: string | null;
  youtube_id: string | null;
  start_seconds: number;
  activo: boolean;
}

/** Acepta un ID de YouTube o una URL (watch, youtu.be, shorts, embed). */
function extraerYoutubeId(v: string): string | null {
  const s = v.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export async function guardarRelato(input: RelatoInput): Promise<Resultado<Relato>> {
  await requireAdminAction();

  const txt = (s: unknown) => (typeof s === "string" ? s.trim() : "");
  const fila = {
    categoria: input.categoria,
    jugador: txt(input.jugador),
    equipo: txt(input.equipo),
    rival: txt(input.rival),
    competicion: txt(input.competicion),
    anio: Math.trunc(Number(input.anio)),
    source_type: input.source_type,
    audio_path: input.source_type === "file" ? input.audio_path || null : null,
    youtube_id: input.source_type === "youtube" ? extraerYoutubeId(input.youtube_id ?? "") : null,
    start_seconds: Math.max(0, Math.round(Number(input.start_seconds) * 10) / 10 || 0),
    activo: !!input.activo,
  };

  if (!esCategoria(fila.categoria)) return fallo("Categoría inválida");
  if (!fila.jugador || !fila.equipo || !fila.rival || !fila.competicion) return fallo("Completá todos los campos");
  if (!(fila.anio >= 1900 && fila.anio <= 2100)) return fallo("Año inválido");
  if (fila.source_type !== "file" && fila.source_type !== "youtube") return fallo("Tipo de fuente inválido");
  if (fila.source_type === "file" && !fila.audio_path) return fallo("Subí un archivo de audio");
  if (fila.source_type === "youtube" && !fila.youtube_id) return fallo("ID o URL de YouTube inválido");

  const db = supabaseAdmin();

  if (input.id) {
    if (!esUuid(input.id)) return fallo("ID inválido");
    const { data: anterior } = await db.from("relatos").select("audio_path, categoria").eq("id", input.id).single();
    if (anterior && anterior.categoria !== fila.categoria) {
      const { count } = await db
        .from("puzzles_diarios")
        .select("fecha", { count: "exact", head: true })
        .eq("relato_id", input.id);
      if (count) return fallo("No se puede cambiar la categoría de un relato que ya está asignado a fechas.");
    }
    const { data, error } = await db.from("relatos").update(fila).eq("id", input.id).select("*").single<Relato>();
    if (error) return fallo(error.message);
    // Borra el audio reemplazado para no dejar huérfanos.
    if (anterior?.audio_path && anterior.audio_path !== fila.audio_path) {
      await db.storage.from(audioBucket()).remove([anterior.audio_path]);
    }
    revalidatePath("/admin");
    return ok(data);
  }

  const { data, error } = await db.from("relatos").insert(fila).select("*").single<Relato>();
  if (error) return fallo(error.message);
  revalidatePath("/admin");
  return ok(data);
}

export async function eliminarRelato(id: string): Promise<Resultado> {
  await requireAdminAction();
  if (!esUuid(id)) return fallo("ID inválido");
  const db = supabaseAdmin();

  const { count } = await db.from("puzzles_diarios").select("fecha", { count: "exact", head: true }).eq("relato_id", id);
  if (count) {
    return fallo(`Este relato está asignado a ${count} fecha(s). Desactivalo en lugar de borrarlo.`);
  }

  const { data: relato } = await db.from("relatos").select("audio_path").eq("id", id).single();
  const { error } = await db.from("relatos").delete().eq("id", id);
  if (error) return fallo(error.message);
  if (relato?.audio_path) await db.storage.from(audioBucket()).remove([relato.audio_path]);

  revalidatePath("/admin");
  return ok(undefined);
}

export async function cambiarActivo(id: string, activo: boolean): Promise<Resultado> {
  await requireAdminAction();
  if (!esUuid(id)) return fallo("ID inválido");
  const { error } = await supabaseAdmin().from("relatos").update({ activo }).eq("id", id);
  if (error) return fallo(error.message);
  revalidatePath("/admin");
  return ok(undefined);
}

// ---------------------------------------------------------------------
// Audio (Storage)
// ---------------------------------------------------------------------

const EXTENSIONES = new Set(["mp3", "m4a", "aac", "ogg", "oga", "opus", "wav", "webm"]);

/**
 * URL firmada para que el navegador suba el archivo directo a Storage
 * (evita el límite de tamaño de body de las funciones de Vercel).
 * El nombre es un UUID para que la URL no delate la respuesta.
 */
export async function crearUrlDeSubida(nombreArchivo: string): Promise<Resultado<{ bucket: string; path: string; token: string }>> {
  await requireAdminAction();
  const ext = nombreArchivo.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTENSIONES.has(ext)) return fallo("Formato no soportado (usá mp3, m4a, ogg, wav…)");
  const path = `audio/${randomUUID()}.${ext}`;
  const { data, error } = await supabaseAdmin().storage.from(audioBucket()).createSignedUploadUrl(path);
  if (error || !data) return fallo(error?.message ?? "No se pudo crear la subida");
  return ok({ bucket: audioBucket(), path: data.path, token: data.token });
}

export async function urlDePrevisualizacion(path: string): Promise<Resultado<string>> {
  await requireAdminAction();
  const { data, error } = await supabaseAdmin().storage.from(audioBucket()).createSignedUrl(path, 600);
  if (error || !data) return fallo(error?.message ?? "No se pudo firmar");
  return ok(data.signedUrl);
}

// ---------------------------------------------------------------------
// Calendario
// ---------------------------------------------------------------------

export interface PuzzleAsignado {
  fecha: string;
  categoria: Categoria;
  numero: number;
  relato_id: string;
}

export async function listarPuzzles(
  desde: string,
  hasta: string,
  categoria: Categoria,
): Promise<Resultado<PuzzleAsignado[]>> {
  await requireAdminAction();
  if (!esFechaValida(desde) || !esFechaValida(hasta) || !esCategoria(categoria)) return fallo("Rango inválido");
  const { data, error } = await supabaseAdmin()
    .from("puzzles_diarios")
    .select("fecha, categoria, numero, relato_id")
    .eq("categoria", categoria)
    .gte("fecha", desde)
    .lte("fecha", hasta)
    .order("fecha");
  if (error) return fallo(error.message);
  return ok(data as PuzzleAsignado[]);
}

export async function asignarPuzzle(
  fecha: string,
  categoria: Categoria,
  relatoId: string,
): Promise<Resultado<PuzzleAsignado>> {
  await requireAdminAction();
  if (!esFechaValida(fecha) || !esCategoria(categoria) || !esUuid(relatoId)) return fallo("Datos inválidos");
  const fila: PuzzleAsignado = { fecha, categoria, numero: numeroPuzzle(fecha), relato_id: relatoId };
  // El trigger de la base rechaza relatos de otra categoría.
  const { error } = await supabaseAdmin().from("puzzles_diarios").upsert(fila, { onConflict: "fecha,categoria" });
  if (error) return fallo(error.message);
  return ok(fila);
}

export async function quitarPuzzle(fecha: string, categoria: Categoria): Promise<Resultado> {
  await requireAdminAction();
  if (!esFechaValida(fecha) || !esCategoria(categoria)) return fallo("Datos inválidos");
  const { error } = await supabaseAdmin()
    .from("puzzles_diarios")
    .delete()
    .eq("fecha", fecha)
    .eq("categoria", categoria);
  if (error) return fallo(error.message);
  return ok(undefined);
}
