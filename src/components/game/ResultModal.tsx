"use client";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import { IconPlay, IconSpinner, IconStop } from "@/components/ui/Icons";
import { CATEGORIAS, DURACION_REVELACION, MAX_INTENTOS, type Categoria } from "@/lib/constants";
import type { GameState, RevealResponse } from "@/lib/types";
import Countdown from "./Countdown";
import ProgressBar from "./ProgressBar";

interface Props {
  open: boolean;
  onClose: () => void;
  game: GameState;
  reveal: RevealResponse | null;
  revealError: string | null;
  audioReady: boolean;
  playing: boolean;
  elapsed: number;
  onTogglePlay: () => void;
  onShare: () => void;
  categoria: Categoria;
}

const COLOR: Record<string, string> = {
  correcto: "bg-cesped",
  cerca: "bg-cerca",
  incorrecto: "bg-error",
  saltado: "bg-tenue/50",
};

export default function ResultModal(p: Props) {
  const gano = p.game.status === "ganado";
  const intentos = p.game.attempts.length;

  return (
    <Modal open={p.open} onClose={p.onClose} title={gano ? "¡Gol!" : "Final del partido"}>
      <p className="mb-4 text-center text-[15px] text-texto/85">
        {gano
          ? intentos === 1
            ? "¡Al primer segundo! Sos un relator más."
            : `Lo sacaste en ${intentos} intentos.`
          : "Esta vez no salió. Mañana hay revancha."}
      </p>

      {/* Tarjeta del gol, estilo zócalo de transmisión */}
      <div className="overflow-hidden rounded-lg border border-linea bg-panel-2">
        {p.reveal ? (
          <>
            <div className="zocalo px-4 py-1.5 pr-8 font-display text-xs font-bold uppercase tracking-[0.2em]">
              {CATEGORIAS.find((c) => c.slug === p.categoria)?.nombre} #{p.game.numero} · el gol
            </div>
            <div className="px-4 pt-3 pb-4">
              <div className="font-display text-3xl font-bold uppercase leading-tight">{p.reveal.relato.jugador}</div>
              <div className="mt-1 text-lg">
                {p.reveal.relato.equipo} <span className="text-tenue">vs</span> {p.reveal.relato.rival}
              </div>
              <div className="text-sm text-tenue">
                {p.reveal.relato.competicion} · {p.reveal.relato.anio}
              </div>
            </div>
          </>
        ) : (
          <div className="flex h-32 items-center justify-center text-tenue">
            {p.revealError ?? <IconSpinner className="size-6" />}
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-linea px-4 py-3">
          <button
            onClick={p.onTogglePlay}
            disabled={!p.audioReady}
            aria-label={p.playing ? "Detener" : "Escuchar relato completo"}
            className="grid size-12 shrink-0 place-items-center rounded-full bg-cesped text-noche transition hover:brightness-110 disabled:opacity-40"
          >
            {p.playing ? <IconStop className="size-5" /> : <IconPlay className="ml-0.5 size-6" />}
          </button>
          <div className="flex-1">
            <ProgressBar total={DURACION_REVELACION} unlocked={DURACION_REVELACION} elapsed={p.elapsed} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex justify-center gap-1.5" aria-label="Resumen de intentos">
        {Array.from({ length: MAX_INTENTOS }, (_, i) => {
          const a = p.game.attempts[i];
          const c = !a ? "bg-linea" : a.kind === "saltado" ? COLOR.saltado : COLOR[a.result];
          return <span key={i} className={`h-3 w-8 rounded-sm ${c}`} />;
        })}
      </div>

      <div className="mt-6 flex flex-col items-center gap-1 border-t border-linea pt-5">
        <span className="text-xs uppercase tracking-[0.2em] text-tenue">Próximo relato en</span>
        <Countdown />
      </div>

      <button
        onClick={p.onShare}
        className="mt-5 h-13 w-full rounded-lg bg-cesped font-display text-xl font-bold uppercase tracking-wide text-noche transition hover:brightness-110 active:scale-[0.98]"
      >
        Compartir
      </button>

      <div className="mt-5 border-t border-linea pt-4">
        <p className="mb-2 text-center text-xs uppercase tracking-[0.2em] text-tenue">Seguí jugando</p>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIAS.filter((c) => c.slug !== p.categoria).map((c) => (
            <Link
              key={c.slug}
              href={`/${c.slug}`}
              className="flex h-11 items-center justify-center rounded-lg border border-linea bg-panel-2 font-display uppercase tracking-wide hover:border-cesped"
            >
              {c.nombre} →
            </Link>
          ))}
        </div>
      </div>
    </Modal>
  );
}
