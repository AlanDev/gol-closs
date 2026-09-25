import { MIN_LETRAS_BUSQUEDA } from "./constants";
import type { RelatoOpcion } from "./types";

/** Minúsculas y sin tildes, para búsquedas y comparaciones. */
export function normalizar(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** "Jugador — Equipo vs Rival (Competición, Año)" */
export function etiquetaRelato(r: RelatoOpcion): string {
  return `${r.jugador} — ${r.equipo} vs ${r.rival} (${r.competicion}, ${r.anio})`;
}

export function esUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}

/** Separa en palabras normalizadas ("Di María" → ["di", "maria"]). */
function palabrasDe(s: string): string[] {
  return normalizar(s).split(/[^\p{L}\p{N}]+/u).filter(Boolean);
}

/** Cantidad de letras/números escritos (sin contar espacios ni signos). */
export function letrasEscritas(consulta: string): number {
  return palabrasDe(consulta).join("").length;
}

/**
 * Filtra opciones para el autocompletado, a propósito exigente:
 * - Nada hasta escribir MIN_LETRAS_BUSQUEDA letras.
 * - Busca solo por el nombre del jugador (no por equipo, rival, competición ni año).
 * - Cada palabra escrita tiene que ser el comienzo de una palabra del nombre
 *   ("ben" encuentra "Benzema"; "ema" no).
 */
export function buscarRelatos(opciones: RelatoOpcion[], consulta: string, excluir: Set<string>, limite = 8) {
  const buscadas = palabrasDe(consulta);
  if (buscadas.join("").length < MIN_LETRAS_BUSQUEDA) return [];
  const out: RelatoOpcion[] = [];
  for (const r of opciones) {
    if (excluir.has(r.id)) continue;
    const delJugador = palabrasDe(r.jugador);
    if (buscadas.every((b) => delJugador.some((p) => p.startsWith(b)))) {
      out.push(r);
      if (out.length >= limite) break;
    }
  }
  return out;
}
