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

/** Filtra opciones: todas las palabras de la consulta deben aparecer en la etiqueta. */
export function buscarRelatos(opciones: RelatoOpcion[], consulta: string, excluir: Set<string>, limite = 8) {
  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  if (palabras.length === 0) return [];
  const out: RelatoOpcion[] = [];
  for (const r of opciones) {
    if (excluir.has(r.id)) continue;
    const texto = normalizar(etiquetaRelato(r));
    if (palabras.every((p) => texto.includes(p))) {
      out.push(r);
      if (out.length >= limite) break;
    }
  }
  return out;
}
