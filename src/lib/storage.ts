"use client";
import { infoCategoria, MAX_INTENTOS, type Categoria } from "./constants";
import type { Attempt, GameState, Stats } from "./types";

// Partida y estadísticas separadas por categoría.
const keyGame = (c: Categoria) => `ungoldecloss:${c}:partida`;
const keyStats = (c: Categoria) => `ungoldecloss:${c}:stats`;
const KEY_VISTO_AYUDA = "ungoldecloss:ayuda-vista";

function leer<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function escribir(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Modo privado / cuota llena: el juego sigue funcionando sin persistir.
  }
}

// ---------- Partida del día ----------

export function cargarPartida(categoria: Categoria, numero: number): GameState {
  const g = leer<GameState>(keyGame(categoria));
  if (g && g.numero === numero && Array.isArray(g.attempts)) return { ...g, categoria };
  return { categoria, numero, attempts: [], status: "jugando" };
}

/** Partida guardada de la categoría, sin importar el día (para la portada). */
export function ultimaPartida(categoria: Categoria): GameState | null {
  return leer<GameState>(keyGame(categoria));
}

export function guardarPartida(g: GameState) {
  escribir(keyGame(g.categoria), g);
}

// ---------- Estadísticas ----------

export function statsVacias(): Stats {
  return {
    jugados: 0,
    ganados: 0,
    rachaActual: 0,
    rachaMaxima: 0,
    distribucion: Array(MAX_INTENTOS).fill(0),
    ultimoJugado: null,
    ultimoGanado: null,
  };
}

export function cargarStats(categoria: Categoria): Stats {
  const s = leer<Stats>(keyStats(categoria));
  if (!s) return statsVacias();
  return { ...statsVacias(), ...s };
}

/** Registra el resultado una sola vez por puzzle. */
export function registrarResultado(categoria: Categoria, numero: number, gano: boolean, intentos: number): Stats {
  const s = cargarStats(categoria);
  if (s.ultimoJugado === numero) return s;

  s.jugados += 1;
  if (gano) {
    s.ganados += 1;
    s.distribucion[intentos - 1] = (s.distribucion[intentos - 1] ?? 0) + 1;
    s.rachaActual = s.ultimoGanado === numero - 1 ? s.rachaActual + 1 : 1;
    s.rachaMaxima = Math.max(s.rachaMaxima, s.rachaActual);
    s.ultimoGanado = numero;
  } else {
    s.rachaActual = 0;
  }
  s.ultimoJugado = numero;
  escribir(keyStats(categoria), s);
  return s;
}

/** La racha se corta si el jugador salteó días. */
export function rachaVigente(s: Stats, numeroHoy: number): number {
  if (s.ultimoGanado === null) return 0;
  return s.ultimoGanado >= numeroHoy - 1 ? s.rachaActual : 0;
}

// ---------- Ayuda ----------

export function yaVioAyuda(): boolean {
  return leer<boolean>(KEY_VISTO_AYUDA) === true;
}

export function marcarAyudaVista() {
  escribir(KEY_VISTO_AYUDA, true);
}

// ---------- Compartir ----------

const EMOJI: Record<string, string> = {
  correcto: "🟩",
  cerca: "🟨",
  incorrecto: "🟥",
  saltado: "⬛",
  vacio: "⬜",
};

export function textoCompartir(categoria: Categoria, numero: number, attempts: Attempt[]): string {
  const cuadros = Array.from({ length: MAX_INTENTOS }, (_, i) => {
    const a = attempts[i];
    if (!a) return EMOJI.vacio;
    return a.kind === "saltado" ? EMOJI.saltado : EMOJI[a.result];
  }).join("");
  return `Un Gol de Closs · ${infoCategoria(categoria).nombre} #${numero} 🎙️\n${cuadros}`;
}
