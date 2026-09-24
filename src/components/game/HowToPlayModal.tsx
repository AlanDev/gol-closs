import Modal from "@/components/ui/Modal";
import { DURACIONES } from "@/lib/constants";

export default function HowToPlayModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Cómo jugar">
      <div className="space-y-4 text-[15px] leading-relaxed text-texto/90">
        <p>
          Cada día hay un <strong className="text-texto">relato de gol de Mariano Closs</strong> en cada categoría:{" "}
          <strong className="text-texto">Europa, Sudamérica y Selecciones</strong>. Escuchá el fragmento y adiviná de
          qué gol se trata.
        </p>
        <ul className="space-y-2.5">
          <li className="flex gap-3">
            <span className="mt-0.5 font-display text-cesped">▶</span>
            <span>
              Tenés <strong>6 intentos</strong>. El fragmento arranca siempre en el mismo punto y se alarga con cada
              intento: {DURACIONES.map((d) => `${d}s`).join(", ")}.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 font-display text-cesped">▶</span>
            <span>Buscá el gol en la lista y elegilo. Solo valen respuestas de la lista.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-0.5 font-display text-cesped">▶</span>
            <span>
              <strong>Saltar</strong> gasta un intento y desbloquea más relato.
            </span>
          </li>
        </ul>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <Leyenda color="bg-cesped" texto="Correcto" />
          <Leyenda color="bg-cerca" texto="Cerca: acertaste el equipo" />
          <Leyenda color="bg-error" texto="Incorrecto" />
          <Leyenda color="bg-tenue/60" texto="Saltado" />
        </div>
        <p className="text-sm text-tenue">Los tres relatos se renuevan a la medianoche (hora de Buenos Aires).</p>
        <button
          onClick={onClose}
          className="h-12 w-full rounded-lg bg-cesped font-display text-lg font-bold uppercase tracking-wide text-noche hover:brightness-110"
        >
          ¡A jugar!
        </button>
      </div>
    </Modal>
  );
}

function Leyenda({ color, texto }: { color: string; texto: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-linea bg-panel-2 px-2.5 py-2">
      <span className={`size-3 shrink-0 rounded-sm ${color}`} />
      <span>{texto}</span>
    </div>
  );
}
