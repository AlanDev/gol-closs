import type { AudioSource, PlayOptions } from "./types";

// Tipos mínimos de la YouTube IFrame API (evita depender de @types/youtube).
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  mute(): void;
  unMute(): void;
  destroy(): void;
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      width?: number | string;
      height?: number | string;
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: () => void;
        onStateChange?: (e: { data: number }) => void;
        onError?: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number; CUED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    s.async = true;
    s.onerror = () => {
      apiPromise = null;
      reject(new Error("No se pudo cargar YouTube"));
    };
    document.head.appendChild(s);
  });
  return apiPromise;
}

/**
 * Reproductor de YouTube visible en tamaño reducido. Arranca en `start` y
 * pausa al cumplirse la duración (medido con getCurrentTime en cada frame).
 */
export class YouTubeAudioSource implements AudioSource {
  readonly kind = "youtube" as const;
  private player: YTPlayer | null = null;
  private yt: YTNamespace | null = null;
  private raf = 0;
  private current: PlayOptions | null = null;
  private playingSince = 0;
  private mount: HTMLDivElement | null = null;

  constructor(
    private container: HTMLElement,
    private videoId: string,
    private start = 0,
  ) {}

  async load(): Promise<void> {
    const YT = await loadYouTubeApi();
    this.yt = YT;
    // La API reemplaza el nodo por un iframe: usamos un hijo propio.
    this.mount = document.createElement("div");
    this.container.appendChild(this.mount);

    await new Promise<void>((resolve, reject) => {
      this.player = new YT.Player(this.mount!, {
        width: "100%",
        height: "100%",
        videoId: this.videoId,
        playerVars: {
          start: Math.floor(this.start),
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: () => resolve(),
          onError: (e) => reject(new Error(`Error de YouTube (${e.data})`)),
          onStateChange: (e) => this.onStateChange(e.data),
        },
      });
    });
    // Posiciona en el inicio para que el primer play arranque rápido.
    this.player!.seekTo(this.start, true);
    this.player!.pauseVideo();
  }

  private onStateChange(state: number) {
    if (!this.yt || !this.current) return;
    if (state === this.yt.PlayerState.PLAYING && !this.raf) {
      this.playingSince = performance.now();
      this.tick();
    }
    if (state === this.yt.PlayerState.ENDED) this.stop();
  }

  private tick = () => {
    const opts = this.current;
    if (!opts || !this.player) return;
    const elapsed = this.player.getCurrentTime() - this.start;
    // Justo después del seek getCurrentTime puede devolver la posición vieja.
    const settling = performance.now() - this.playingSince < 300;
    if (!settling || (elapsed >= -0.5 && elapsed <= opts.duration + 0.5)) {
      if (elapsed >= opts.duration) {
        opts.onProgress?.(opts.duration);
        this.stop();
        return;
      }
      opts.onProgress?.(Math.max(0, elapsed));
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  play(opts: PlayOptions): void {
    if (!this.player) return;
    this.stop();
    this.current = opts;
    this.player.seekTo(this.start, true);
    this.player.playVideo();
  }

  stop(): void {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
    const cur = this.current;
    this.current = null;
    if (this.player) {
      this.player.pauseVideo();
      if (cur) this.player.seekTo(this.start, true);
    }
    cur?.onEnd?.();
  }

  setStart(start: number): void {
    this.start = Math.max(0, start);
    if (this.player && !this.current) this.player.seekTo(this.start, true);
  }

  getDuration(): number {
    return this.player?.getDuration() ?? 0;
  }

  destroy(): void {
    this.stop();
    this.player?.destroy();
    this.player = null;
    this.mount?.remove();
  }
}
