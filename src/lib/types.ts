import type { Categoria } from "./constants";

export type SourceType = "file" | "youtube";

/** Lo único que el cliente conoce de un relato antes de terminar la partida. */
export interface RelatoOpcion {
  id: string;
  categoria: Categoria;
  jugador: string;
  equipo: string;
  rival: string;
  competicion: string;
  anio: number;
}

/** Fila completa (solo servidor / admin). */
export interface Relato extends RelatoOpcion {
  source_type: SourceType;
  audio_path: string | null;
  youtube_id: string | null;
  start_seconds: number;
  activo: boolean;
  created_at: string;
}

export type PuzzleSource =
  | { type: "file"; url: string; start: number }
  | { type: "youtube"; videoId: string; start: number };

export interface TodayResponse {
  categoria: Categoria;
  numero: number;
  fecha: string;
  source: PuzzleSource;
}

export interface GuessResponse {
  correcto: boolean;
  cerca: boolean;
}

export interface RevealResponse {
  numero: number;
  relato: RelatoOpcion;
  source: PuzzleSource;
}

export type GuessResult = "incorrecto" | "cerca" | "correcto";

export type Attempt =
  | { kind: "saltado" }
  | { kind: "respuesta"; relatoId: string; label: string; result: GuessResult };

export type GameStatus = "jugando" | "ganado" | "perdido";

export interface GameState {
  categoria: Categoria;
  numero: number;
  attempts: Attempt[];
  status: GameStatus;
}

export interface Stats {
  jugados: number;
  ganados: number;
  rachaActual: number;
  rachaMaxima: number;
  /** distribucion[i] = victorias en el intento i+1 */
  distribucion: number[];
  ultimoJugado: number | null;
  ultimoGanado: number | null;
}
