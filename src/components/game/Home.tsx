"use client";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { CATEGORIAS, MAX_INTENTOS } from "@/lib/constants";
import Countdown from "./Countdown";
import { useEstadoCategorias, type EstadoCategoria } from "./useEstadoCategorias";

const COLOR: Record<string, string> = {
  correcto: "bg-cesped",
  cerca: "bg-cerca",
  incorrecto: "bg-error",
  saltado: "bg-tenue/50",
};

function Estado({ e }: { e: EstadoCategoria | undefined }) {
  if (!e) return <span className="h-5" />;
  if (e.status === "sin-jugar") {
    return <span className="font-display text-sm uppercase tracking-widest text-cesped">Jugar →</span>;
  }
  const a = e.partida?.attempts ?? [];
  return (
    <span className="flex items-center gap-2">
      <span className="flex gap-1">
        {Array.from({ length: MAX_INTENTOS }, (_, i) => {
          const x = a[i];
          const c = !x ? "bg-linea" : x.kind === "saltado" ? COLOR.saltado : COLOR[x.result];
          return <span key={i} className={`h-2 w-4 rounded-[2px] ${c}`} />;
        })}
      </span>
      <span
        className={`font-display text-sm uppercase tracking-wider ${
          e.status === "ganado" ? "text-cesped" : e.status === "perdido" ? "text-error" : "text-zocalo"
        }`}
      >
        {e.status === "ganado" ? "Gol" : e.status === "perdido" ? "Afuera" : "Seguir"}
      </span>
    </span>
  );
}

export default function Home() {
  const estado = useEstadoCategorias();
  const todasTerminadas =
    !!estado && CATEGORIAS.every((c) => estado[c.slug].status === "ganado" || estado[c.slug].status === "perdido");

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pt-10 pb-8">
      <header className="flex flex-col items-center text-center">
        <h1>
          <Logo mic className="text-[2.6rem] sm:text-5xl" />
        </h1>
        <p className="zocalo mt-2 px-3 pr-6 font-display text-sm font-bold uppercase tracking-[0.2em]">
          Adiviná el gol por el relato
        </p>
        <p className="mt-4 max-w-xs text-[15px] text-tenue">
          Tres categorías, un relato de Mariano Closs por cada una, todos los días.
        </p>
      </header>

      <main className="mt-8 flex flex-col gap-3">
        {CATEGORIAS.map((c, i) => (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            className="group relative overflow-hidden rounded-xl border border-linea bg-panel p-5 transition hover:border-cesped/70 active:scale-[0.99]"
          >
            {/* Franja de césped */}
            <span className="absolute inset-y-0 left-0 w-1.5 bg-cesped/70 transition group-hover:bg-cesped" />
            <span className="flex items-baseline justify-between gap-3">
              <span className="font-display text-3xl font-bold uppercase tracking-tight">{c.nombre}</span>
              <span className="font-display text-sm tabular-nums text-linea">0{i + 1}</span>
            </span>
            <span className="mt-0.5 block text-sm text-tenue">{c.bajada}</span>
            <span className="mt-4 flex h-5 items-center">
              <Estado e={estado?.[c.slug]} />
            </span>
          </Link>
        ))}
      </main>

      <footer className="mt-auto flex flex-col items-center gap-1 pt-10 text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-tenue">
          {todasTerminadas ? "¡Jugaste todo! Nuevos relatos en" : "Nuevos relatos en"}
        </span>
        <Countdown />
      </footer>
    </div>
  );
}
