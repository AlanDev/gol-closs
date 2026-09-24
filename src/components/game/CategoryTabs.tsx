"use client";
import Link from "next/link";
import { CATEGORIAS, type Categoria } from "@/lib/constants";
import { useEstadoCategorias, type EstadoCategoria } from "./useEstadoCategorias";

function Indicador({ e }: { e: EstadoCategoria | undefined }) {
  if (!e || e.status === "sin-jugar") return null;
  if (e.status === "ganado") return <span className="text-cesped" aria-label="ganado">✓</span>;
  if (e.status === "perdido") return <span className="text-error" aria-label="perdido">✕</span>;
  return <span className="size-1.5 rounded-full bg-zocalo" aria-label="en juego" />;
}

export default function CategoryTabs({ actual, version }: { actual: Categoria; version?: unknown }) {
  const estado = useEstadoCategorias(version);

  return (
    <nav className="mb-3 grid grid-cols-3 gap-1 rounded-lg border border-linea bg-panel p-1" aria-label="Categorías">
      {CATEGORIAS.map((c) => {
        const activa = c.slug === actual;
        return (
          <Link
            key={c.slug}
            href={`/${c.slug}`}
            aria-current={activa ? "page" : undefined}
            className={`flex h-9 items-center justify-center gap-1.5 rounded-md font-display text-sm uppercase tracking-wide transition ${
              activa ? "bg-cesped text-noche font-bold" : "text-tenue hover:bg-panel-2 hover:text-texto"
            }`}
          >
            {c.nombre}
            {!activa && <Indicador e={estado?.[c.slug]} />}
          </Link>
        );
      })}
    </nav>
  );
}
