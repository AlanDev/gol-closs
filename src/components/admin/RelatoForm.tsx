"use client";
import { useEffect, useMemo, useState } from "react";
import { crearUrlDeSubida, guardarRelato, urlDePrevisualizacion, type RelatoInput } from "@/app/admin/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { CATEGORIAS, type Categoria } from "@/lib/constants";
import type { Relato, SourceType } from "@/lib/types";
import FragmentPreview, { type PreviewSource } from "./FragmentPreview";

interface Props {
  relato: Relato | null;
  categoriaInicial: Categoria;
  onDone: () => void;
  onCancel: () => void;
}

function youtubeIdDe(v: string): string | null {
  const s = v.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  return s.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([\w-]{11})/)?.[1] ?? null;
}

export default function RelatoForm({ relato, categoriaInicial, onDone, onCancel }: Props) {
  const [form, setForm] = useState<RelatoInput>(() => ({
    id: relato?.id,
    categoria: relato?.categoria ?? categoriaInicial,
    jugador: relato?.jugador ?? "",
    equipo: relato?.equipo ?? "",
    rival: relato?.rival ?? "",
    competicion: relato?.competicion ?? "",
    anio: relato?.anio ?? new Date().getFullYear(),
    source_type: relato?.source_type ?? "file",
    audio_path: relato?.audio_path ?? null,
    youtube_id: relato?.youtube_id ?? "",
    start_seconds: relato?.start_seconds ?? 0,
    activo: relato?.activo ?? true,
  }));
  const [archivo, setArchivo] = useState<File | null>(null);
  const [urlLocal, setUrlLocal] = useState<string | null>(null);
  const [urlRemota, setUrlRemota] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof RelatoInput>(k: K, v: RelatoInput[K]) => setForm((f) => ({ ...f, [k]: v }));

  // Blob local del archivo elegido (preview instantánea, antes de subir).
  useEffect(() => {
    if (!archivo) return setUrlLocal(null);
    const u = URL.createObjectURL(archivo);
    setUrlLocal(u);
    return () => URL.revokeObjectURL(u);
  }, [archivo]);

  // Audio ya subido: pedimos una signed URL para previsualizar.
  useEffect(() => {
    if (form.source_type !== "file" || !form.audio_path || archivo) return;
    let cancelado = false;
    urlDePrevisualizacion(form.audio_path).then((r) => {
      if (cancelado) return;
      if (r.ok) setUrlRemota(r.data);
      else setError(`Preview: ${r.error}`);
    });
    return () => {
      cancelado = true;
    };
  }, [form.source_type, form.audio_path, archivo]);

  const ytId = youtubeIdDe(form.youtube_id ?? "");
  const preview: PreviewSource = useMemo(() => {
    if (form.source_type === "youtube") return ytId ? { type: "youtube", videoId: ytId } : null;
    const url = urlLocal ?? urlRemota;
    return url ? { type: "file", url } : null;
  }, [form.source_type, ytId, urlLocal, urlRemota]);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      let audio_path = form.audio_path;
      if (form.source_type === "file" && archivo) {
        const firma = await crearUrlDeSubida(archivo.name);
        if (!firma.ok) throw new Error(firma.error);
        const { error: upErr } = await createSupabaseBrowserClient()
          .storage.from(firma.data.bucket)
          .uploadToSignedUrl(firma.data.path, firma.data.token, archivo, { contentType: archivo.type || undefined });
        if (upErr) throw new Error(`Subida: ${upErr.message}`);
        audio_path = firma.data.path;
      }
      const r = await guardarRelato({ ...form, audio_path });
      if (!r.ok) throw new Error(r.error);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setGuardando(false);
    }
  };

  const campo = "h-11 w-full rounded-lg border border-linea bg-panel px-3 outline-none focus:border-cesped";

  return (
    <form onSubmit={guardar} className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <h2 className="font-display text-2xl uppercase">{relato ? "Editar relato" : "Nuevo relato"}</h2>

        <Campo label="Categoría">
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIAS.map((c) => (
              <button
                key={c.slug}
                type="button"
                onClick={() => set("categoria", c.slug)}
                className={`h-11 rounded-lg border font-display uppercase tracking-wide ${
                  form.categoria === c.slug ? "border-cesped bg-cesped/15" : "border-linea text-tenue"
                }`}
              >
                {c.nombre}
              </button>
            ))}
          </div>
        </Campo>

        <Campo label="Jugador">
          <input className={campo} value={form.jugador} onChange={(e) => set("jugador", e.target.value)} required />
        </Campo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Equipo">
            <input className={campo} value={form.equipo} onChange={(e) => set("equipo", e.target.value)} required />
          </Campo>
          <Campo label="Rival">
            <input className={campo} value={form.rival} onChange={(e) => set("rival", e.target.value)} required />
          </Campo>
        </div>
        <div className="grid grid-cols-[1fr_7rem] gap-3">
          <Campo label="Competición">
            <input
              className={campo}
              value={form.competicion}
              onChange={(e) => set("competicion", e.target.value)}
              required
            />
          </Campo>
          <Campo label="Año">
            <input
              className={campo}
              type="number"
              min={1900}
              max={2100}
              value={form.anio}
              onChange={(e) => set("anio", Number(e.target.value))}
              required
            />
          </Campo>
        </div>

        <Campo label="Fuente">
          <div className="grid grid-cols-2 gap-2">
            {(["file", "youtube"] as SourceType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => set("source_type", t)}
                className={`h-11 rounded-lg border font-display uppercase tracking-wide ${
                  form.source_type === t ? "border-cesped bg-cesped/15" : "border-linea text-tenue"
                }`}
              >
                {t === "file" ? "Archivo de audio" : "YouTube"}
              </button>
            ))}
          </div>
        </Campo>

        {form.source_type === "file" ? (
          <Campo label={form.audio_path && !archivo ? "Reemplazar audio (opcional)" : "Archivo de audio"}>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-tenue file:mr-3 file:rounded-md file:border-0 file:bg-panel-2 file:px-3 file:py-2 file:text-texto"
            />
            {form.audio_path && !archivo && <p className="mt-1 truncate text-xs text-tenue">Actual: {form.audio_path}</p>}
          </Campo>
        ) : (
          <Campo label="ID o URL de YouTube">
            <input
              className={campo}
              value={form.youtube_id ?? ""}
              onChange={(e) => set("youtube_id", e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
            />
            {form.youtube_id && !ytId && <p className="mt-1 text-xs text-error">No reconozco ese ID/URL.</p>}
          </Campo>
        )}

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.activo} onChange={(e) => set("activo", e.target.checked)} />
          Activo (aparece en el autocompletado y puede salir sorteado)
        </label>
      </div>

      <div className="space-y-4">
        <h3 className="font-display text-xl uppercase text-tenue">Previsualización</h3>
        <FragmentPreview
          source={preview}
          start={form.start_seconds}
          onStartChange={(s) => set("start_seconds", Math.round(s * 10) / 10)}
        />

        {error && <p className="rounded-md border border-error/50 bg-error/10 px-3 py-2 text-sm">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="h-12 flex-1 rounded-lg border border-linea font-display uppercase tracking-wide"
          >
            Cancelar
          </button>
          <button
            disabled={guardando}
            className="h-12 flex-1 rounded-lg bg-cesped font-display font-bold uppercase tracking-wide text-noche disabled:opacity-50"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-sm text-tenue">{label}</div>
      {children}
    </div>
  );
}
