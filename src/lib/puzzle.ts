import "server-only";
import { audioBucket, supabaseAdmin } from "./supabase/admin";
import { hoyAR, numeroPuzzle } from "./date";
import { esCategoria, type Categoria } from "./constants";
import type { PuzzleSource, Relato } from "./types";

export class PuzzleError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export interface PuzzleDelDia {
  categoria: Categoria;
  fecha: string;
  numero: number;
  relato: Relato;
}

/** Valida el parámetro de categoría o lanza 400. */
export function parsearCategoria(v: unknown): Categoria {
  if (!esCategoria(v)) throw new PuzzleError("Categoría inválida", 400);
  return v;
}

/** Puzzle de hoy de una categoría (lo asigna automáticamente si no existe). Solo servidor. */
export async function getPuzzleDeHoy(categoria: Categoria): Promise<PuzzleDelDia> {
  const fecha = hoyAR();
  const numero = numeroPuzzle(fecha);
  const db = supabaseAdmin();

  const { data: relatoId, error } = await db.rpc("ensure_daily_puzzle", {
    p_fecha: fecha,
    p_categoria: categoria,
    p_numero: numero,
  });
  if (error) throw new PuzzleError(`No se pudo obtener el puzzle: ${error.message}`, 500);
  if (!relatoId) throw new PuzzleError("Todavía no hay relatos cargados en esta categoría", 404);

  const { data: relato, error: e2 } = await db.from("relatos").select("*").eq("id", relatoId).single<Relato>();
  if (e2 || !relato) throw new PuzzleError("Relato del día no encontrado", 500);

  return { categoria, fecha, numero, relato: { ...relato, start_seconds: Number(relato.start_seconds) } };
}

/** Fuente reproducible del relato. Para "file" genera una signed URL de corta duración. */
export async function fuenteDeRelato(relato: Relato, expiresIn = 300): Promise<PuzzleSource> {
  const start = Number(relato.start_seconds) || 0;
  if (relato.source_type === "youtube") {
    if (!relato.youtube_id) throw new PuzzleError("Relato sin youtube_id", 500);
    return { type: "youtube", videoId: relato.youtube_id, start };
  }
  if (!relato.audio_path) throw new PuzzleError("Relato sin audio", 500);
  const { data, error } = await supabaseAdmin().storage.from(audioBucket()).createSignedUrl(relato.audio_path, expiresIn);
  if (error || !data) throw new PuzzleError(`No se pudo firmar el audio: ${error?.message}`, 500);
  return { type: "file", url: data.signedUrl, start };
}

export function mismoEquipo(a: string, b: string): boolean {
  const n = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
  return n(a) === n(b);
}

export function respuestaError(e: unknown) {
  const status = e instanceof PuzzleError ? e.status : 500;
  const message = e instanceof Error ? e.message : "Error inesperado";
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}
