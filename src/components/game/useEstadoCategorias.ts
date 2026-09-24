"use client";
import { useEffect, useState } from "react";
import { CATEGORIAS, type Categoria } from "@/lib/constants";
import { hoyAR, numeroPuzzle } from "@/lib/date";
import { ultimaPartida } from "@/lib/storage";
import type { GameState, GameStatus } from "@/lib/types";

export type EstadoCategoria = { status: GameStatus | "sin-jugar"; partida: GameState | null };

/**
 * Estado de hoy de cada categoría según localStorage. Se lee después del
 * montaje para no desincronizar la hidratación. `version` fuerza una relectura.
 */
export function useEstadoCategorias(version?: unknown): Record<Categoria, EstadoCategoria> | null {
  const [estado, setEstado] = useState<Record<Categoria, EstadoCategoria> | null>(null);

  useEffect(() => {
    const numeroHoy = numeroPuzzle(hoyAR());
    const out = {} as Record<Categoria, EstadoCategoria>;
    for (const c of CATEGORIAS) {
      const p = ultimaPartida(c.slug);
      const deHoy = p && p.numero === numeroHoy ? p : null;
      out[c.slug] = {
        partida: deHoy,
        status: !deHoy ? "sin-jugar" : deHoy.attempts.length === 0 ? "sin-jugar" : deHoy.status,
      };
    }
    setEstado(out);
  }, [version]);

  return estado;
}
