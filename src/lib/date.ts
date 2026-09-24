import { TIMEZONE } from "./constants";

const DAY_MS = 86_400_000;

/** Fecha actual (YYYY-MM-DD) en Buenos Aires. */
export function hoyAR(now: Date = new Date()): string {
  // en-CA formatea como YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function fechaAUtc(fecha: string): number {
  const [y, m, d] = fecha.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function launchDate(): string {
  return process.env.NEXT_PUBLIC_LAUNCH_DATE || "2026-01-01";
}

/** Número de puzzle: días desde el lanzamiento + 1. Único por fecha. */
export function numeroPuzzle(fecha: string): number {
  return Math.round((fechaAUtc(fecha) - fechaAUtc(launchDate())) / DAY_MS) + 1;
}

export function sumarDias(fecha: string, dias: number): string {
  return new Date(fechaAUtc(fecha) + dias * DAY_MS).toISOString().slice(0, 10);
}

/**
 * Instante del próximo puzzle (medianoche de Buenos Aires).
 * Argentina usa UTC-3 fijo (sin horario de verano desde 2009).
 */
export function proximoPuzzle(now: Date = new Date()): Date {
  const manana = sumarDias(hoyAR(now), 1);
  return new Date(`${manana}T00:00:00-03:00`);
}

export function esFechaValida(fecha: unknown): fecha is string {
  return typeof fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(fechaAUtc(fecha));
}
