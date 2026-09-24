interface Props {
  /** Segundos totales representados por la barra. */
  total: number;
  /** Segundos desbloqueados. */
  unlocked: number;
  /** Segundos reproducidos. */
  elapsed: number;
  /** Límites de cada segmento (ej. [1,2,4,7,11,16]). */
  marks?: readonly number[];
}

const fmt = (s: number) => `0:${String(Math.floor(s)).padStart(2, "0")}`;

export default function ProgressBar({ total, unlocked, elapsed, marks = [] }: Props) {
  const pct = (s: number) => `${Math.min(100, Math.max(0, (s / total) * 100))}%`;

  return (
    <div>
      <div
        className="relative h-4 overflow-hidden rounded-[3px] bg-panel-2 ring-1 ring-linea"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.floor(elapsed)}
        aria-label="Progreso del fragmento"
      >
        {/* Porción desbloqueada */}
        <div className="absolute inset-y-0 left-0 bg-cesped/20" style={{ width: pct(unlocked) }} />
        {/* Reproducción */}
        <div className="absolute inset-y-0 left-0 bg-cesped" style={{ width: pct(elapsed) }} />
        {/* Divisiones de segmentos */}
        {marks
          .filter((m) => m < total)
          .map((m) => (
            <div
              key={m}
              className={`absolute inset-y-0 w-[2px] -translate-x-1/2 ${m === unlocked ? "bg-zocalo" : "bg-noche/80"}`}
              style={{ left: pct(m) }}
            />
          ))}
      </div>
      <div className="mt-1.5 flex justify-between font-display text-sm tabular-nums tracking-wide text-tenue">
        <span>{fmt(elapsed)}</span>
        <span>{fmt(total)}</span>
      </div>
    </div>
  );
}
