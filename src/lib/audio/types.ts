export interface PlayOptions {
  /** Segundos a reproducir desde `start`. */
  duration: number;
  /** Llamado en cada frame con los segundos transcurridos desde `start`. */
  onProgress?: (elapsed: number) => void;
  /** Llamado al cortar (por duración cumplida o por stop()). */
  onEnd?: () => void;
}

/**
 * Fuente de audio reproducible por fragmentos.
 * Siempre arranca en `start` y corta exactamente al cumplir `duration`.
 */
export interface AudioSource {
  readonly kind: "file" | "youtube";
  /** Precarga. Resuelve cuando se puede reproducir sin espera. */
  load(): Promise<void>;
  /**
   * Debe llamarse de forma sincrónica dentro del gesto del usuario (click)
   * para que los navegadores móviles permitan el play.
   */
  play(opts: PlayOptions): void;
  stop(): void;
  /**
   * Alarga la reproducción en curso hasta `duration` segundos desde `start`,
   * sin cortarla ni volver al inicio. No hace nada si no está sonando.
   */
  extend(duration: number): void;
  setStart(start: number): void;
  /** Duración total del medio (0 si todavía no se conoce). */
  getDuration(): number;
  destroy(): void;
}
