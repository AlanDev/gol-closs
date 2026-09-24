import { MAX_INTENTOS } from "@/lib/constants";
import type { Attempt } from "@/lib/types";

const ESTILOS = {
  vacio: "border-linea bg-panel/40",
  actual: "border-cesped/60 bg-panel/60",
  saltado: "border-linea bg-panel-2 text-tenue",
  incorrecto: "border-error/60 bg-error/10",
  cerca: "border-cerca/70 bg-cerca/10",
  correcto: "border-cesped bg-cesped/15",
} as const;

function Marcador({ tipo }: { tipo: keyof typeof ESTILOS }) {
  const color =
    tipo === "correcto"
      ? "bg-cesped"
      : tipo === "cerca"
        ? "bg-cerca"
        : tipo === "incorrecto"
          ? "bg-error"
          : tipo === "saltado"
            ? "bg-tenue/60"
            : "bg-linea";
  return <span className={`h-full w-1.5 shrink-0 rounded-l-[5px] ${color}`} aria-hidden />;
}

export default function AttemptList({ attempts, activo }: { attempts: Attempt[]; activo: boolean }) {
  return (
    <ol className="flex flex-col gap-1.5" aria-label="Intentos">
      {Array.from({ length: MAX_INTENTOS }, (_, i) => {
        const a = attempts[i];
        const esActual = activo && i === attempts.length;
        const tipo: keyof typeof ESTILOS = !a ? (esActual ? "actual" : "vacio") : a.kind === "saltado" ? "saltado" : a.result;

        return (
          <li
            key={i}
            className={`flex h-11 items-stretch overflow-hidden rounded-md border text-sm ${ESTILOS[tipo]}`}
          >
            <Marcador tipo={tipo} />
            <div className="flex min-w-0 flex-1 items-center gap-2 px-3">
              {a?.kind === "saltado" && <span className="font-display uppercase tracking-wider">Saltado</span>}
              {a?.kind === "respuesta" && (
                <>
                  <span className="truncate">{a.label}</span>
                  {a.result === "cerca" && (
                    <span className="ml-auto shrink-0 rounded bg-cerca px-1.5 py-0.5 font-display text-[11px] font-semibold uppercase text-noche">
                      Equipo ✓
                    </span>
                  )}
                  {a.result === "correcto" && (
                    <span className="ml-auto shrink-0 font-display text-xs font-semibold uppercase text-cesped">Gol</span>
                  )}
                </>
              )}
              {!a && <span className="font-display text-xs tracking-widest text-linea">{i + 1}</span>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
