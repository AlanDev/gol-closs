import Modal from "@/components/ui/Modal";
import { rachaVigente } from "@/lib/storage";
import type { Stats } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  stats: Stats;
  numeroHoy: number | null;
  /** Intento en que se ganó hoy (1-6), para resaltarlo. */
  intentoGanadorHoy: number | null;
}

export default function StatsModal({ open, onClose, stats, numeroHoy, intentoGanadorHoy }: Props) {
  const porcentaje = stats.jugados ? Math.round((stats.ganados / stats.jugados) * 100) : 0;
  const racha = numeroHoy === null ? stats.rachaActual : rachaVigente(stats, numeroHoy);
  const max = Math.max(1, ...stats.distribucion);

  return (
    <Modal open={open} onClose={onClose} title="Estadísticas">
      <div className="grid grid-cols-4 gap-2 text-center">
        <Cifra valor={stats.jugados} label="Jugados" />
        <Cifra valor={`${porcentaje}%`} label="Victorias" />
        <Cifra valor={racha} label="Racha" />
        <Cifra valor={stats.rachaMaxima} label="Racha máx." />
      </div>

      <h3 className="mt-6 mb-3 font-display text-sm font-semibold uppercase tracking-widest text-tenue">
        Aciertos por intento
      </h3>
      <div className="space-y-1.5">
        {stats.distribucion.map((n, i) => {
          const hoy = intentoGanadorHoy === i + 1;
          return (
            <div key={i} className="flex items-center gap-2">
              <span className="w-4 text-right font-display text-sm text-tenue">{i + 1}</span>
              <div className="flex-1">
                <div
                  className={`flex h-6 min-w-7 items-center justify-end rounded-sm px-2 font-display text-sm font-semibold ${
                    hoy ? "bg-cesped text-noche" : "bg-panel-2 text-texto/80"
                  }`}
                  style={{ width: `${Math.max(8, (n / max) * 100)}%` }}
                >
                  {n}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}

function Cifra({ valor, label }: { valor: number | string; label: string }) {
  return (
    <div className="rounded-lg border border-linea bg-panel-2 px-1 py-3">
      <div className="font-display text-3xl font-bold leading-none">{valor}</div>
      <div className="mt-1.5 text-[11px] uppercase tracking-wide text-tenue">{label}</div>
    </div>
  );
}
