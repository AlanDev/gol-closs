import type { AudioSource, PlayOptions } from "./types";

/**
 * Audio desde una URL (signed URL de Supabase Storage o blob local).
 * Descarga el archivo completo a un Blob para que la precarga sea real y la
 * reproducción no dependa de que la signed URL siga vigente.
 */
export class FileAudioSource implements AudioSource {
  readonly kind = "file" as const;
  private audio: HTMLAudioElement;
  private objectUrl: string | null = null;
  private raf = 0;
  private current: PlayOptions | null = null;
  private destroyed = false;

  constructor(
    private url: string,
    private start = 0,
  ) {
    this.audio = new Audio();
    this.audio.preload = "auto";
  }

  async load(): Promise<void> {
    let src = this.url;
    if (!src.startsWith("blob:")) {
      const res = await fetch(this.url);
      if (!res.ok) throw new Error(`No se pudo descargar el audio (${res.status})`);
      const blob = await res.blob();
      if (this.destroyed) return;
      this.objectUrl = URL.createObjectURL(blob);
      src = this.objectUrl;
    }
    this.audio.src = src;
    await new Promise<void>((resolve, reject) => {
      const ok = () => {
        cleanup();
        resolve();
      };
      const fail = () => {
        cleanup();
        reject(new Error("No se pudo decodificar el audio"));
      };
      const cleanup = () => {
        this.audio.removeEventListener("loadedmetadata", ok);
        this.audio.removeEventListener("error", fail);
      };
      // El blob ya está completo en memoria: con los metadatos alcanza
      // (iOS no dispara canplaythrough sin un gesto del usuario).
      this.audio.addEventListener("loadedmetadata", ok);
      this.audio.addEventListener("error", fail);
      this.audio.load();
    });
  }

  play(opts: PlayOptions): void {
    this.stop();
    this.current = opts;
    const { start } = this;
    const end = start + opts.duration;
    this.audio.currentTime = start;

    const tick = () => {
      const t = this.audio.currentTime;
      if (t >= end || this.audio.ended) {
        opts.onProgress?.(opts.duration);
        this.stop();
        return;
      }
      opts.onProgress?.(Math.max(0, t - start));
      this.raf = requestAnimationFrame(tick);
    };

    this.audio.play().then(
      () => {
        if (this.current === opts) this.raf = requestAnimationFrame(tick);
      },
      () => this.stop(),
    );
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (!this.audio.paused) this.audio.pause();
    const cur = this.current;
    this.current = null;
    cur?.onEnd?.();
  }

  setStart(start: number): void {
    this.start = Math.max(0, start);
  }

  getDuration(): number {
    return Number.isFinite(this.audio.duration) ? this.audio.duration : 0;
  }

  destroy(): void {
    this.destroyed = true;
    this.stop();
    this.audio.removeAttribute("src");
    this.audio.load();
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
  }
}
