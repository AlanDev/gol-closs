"use client";
import { useEffect, useRef, useState } from "react";
import { FileAudioSource, YouTubeAudioSource, type AudioSource } from "@/lib/audio";
import { DURACION_REVELACION, DURACIONES } from "@/lib/constants";
import ProgressBar from "@/components/game/ProgressBar";
import { IconPlay, IconSpinner, IconStop } from "@/components/ui/Icons";

export type PreviewSource = { type: "file"; url: string } | { type: "youtube"; videoId: string } | null;

interface Props {
  source: PreviewSource;
  start: number;
  onStartChange: (s: number) => void;
}

const OPCIONES_DURACION = [...DURACIONES, DURACION_REVELACION];

export default function FragmentPreview({ source, start, onStartChange }: Props) {
  const ytRef = useRef<HTMLDivElement>(null);
  const srcRef = useRef<AudioSource | null>(null);
  const [listo, setListo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duracionMedio, setDuracionMedio] = useState(0);
  const [duracion, setDuracion] = useState<number>(DURACIONES[DURACIONES.length - 1]);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  // Recrea la fuente solo cuando cambia el medio (no el start).
  const clave = source ? (source.type === "file" ? source.url : source.videoId) : null;
  const startRef = useRef(start);
  startRef.current = start;

  useEffect(() => {
    setListo(false);
    setError(null);
    setDuracionMedio(0);
    if (!source) return;
    const src: AudioSource =
      source.type === "file"
        ? new FileAudioSource(source.url, startRef.current)
        : new YouTubeAudioSource(ytRef.current!, source.videoId, startRef.current);
    srcRef.current = src;
    src.load().then(
      () => {
        if (srcRef.current !== src) return;
        setListo(true);
        setDuracionMedio(src.getDuration());
      },
      (e: Error) => srcRef.current === src && setError(e.message),
    );
    return () => {
      src.destroy();
      if (srcRef.current === src) srcRef.current = null;
    };
  }, [clave]);

  useEffect(() => {
    srcRef.current?.stop();
    srcRef.current?.setStart(start);
  }, [start]);

  const toggle = () => {
    const src = srcRef.current;
    if (!src || !listo) return;
    if (playing) return src.stop();
    setPlaying(true);
    src.play({
      duration: duracion,
      onProgress: setElapsed,
      onEnd: () => {
        setPlaying(false);
        setElapsed(0);
      },
    });
  };

  if (!source) {
    return <p className="rounded-lg border border-dashed border-linea p-4 text-sm text-tenue">Cargá un audio o video para previsualizar.</p>;
  }

  const max = Math.max(0, duracionMedio - 1);

  return (
    <div className="space-y-4 rounded-lg border border-linea bg-panel-2 p-4">
      {source.type === "youtube" && (
        <div className="aspect-video w-56 overflow-hidden rounded-md bg-black">
          <div ref={ytRef} className="size-full" />
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between text-sm">
          <label htmlFor="start" className="text-tenue">
            Inicio del fragmento
          </label>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => onStartChange(Math.max(0, +(start - 0.1).toFixed(1)))} className="rounded border border-linea px-2">
              −
            </button>
            <input
              type="number"
              step={0.1}
              min={0}
              value={start}
              onChange={(e) => onStartChange(Math.max(0, Number(e.target.value) || 0))}
              className="w-20 rounded border border-linea bg-panel px-2 py-0.5 text-right tabular-nums"
            />
            <span className="text-tenue">s</span>
            <button type="button" onClick={() => onStartChange(+(start + 0.1).toFixed(1))} className="rounded border border-linea px-2">
              +
            </button>
          </div>
        </div>
        <input
          id="start"
          type="range"
          min={0}
          max={max || 60}
          step={0.1}
          value={start}
          disabled={!listo}
          onChange={(e) => onStartChange(Number(e.target.value))}
          className="w-full"
        />
        {listo && duracionMedio > 0 && start + DURACION_REVELACION > duracionMedio && (
          <p className="mt-1 text-xs text-cerca">
            Ojo: con este inicio no alcanzan los {DURACION_REVELACION}s de la revelación (el medio dura {duracionMedio.toFixed(1)}s).
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {OPCIONES_DURACION.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDuracion(d)}
            className={`rounded-md px-3 py-1 font-display text-sm ${
              d === duracion ? "bg-cesped text-noche" : "border border-linea text-tenue hover:text-texto"
            }`}
          >
            {d}s
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggle}
          disabled={!listo}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-cesped text-noche disabled:bg-panel disabled:text-tenue"
        >
          {!listo && !error ? <IconSpinner className="size-5" /> : playing ? <IconStop className="size-5" /> : <IconPlay className="ml-0.5 size-6" />}
        </button>
        <div className="flex-1">
          <ProgressBar
            total={duracion}
            unlocked={duracion}
            elapsed={elapsed}
            marks={duracion <= 16 ? DURACIONES.filter((m) => m <= duracion) : []}
          />
        </div>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
