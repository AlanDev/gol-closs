import type { PuzzleSource } from "../types";
import { FileAudioSource } from "./file-source";
import { YouTubeAudioSource } from "./youtube-source";
import type { AudioSource } from "./types";

export type { AudioSource, PlayOptions } from "./types";
export { FileAudioSource, YouTubeAudioSource };

/** Crea la fuente adecuada. `youtubeContainer` es obligatorio para YouTube. */
export function createAudioSource(source: PuzzleSource, youtubeContainer: HTMLElement | null): AudioSource {
  if (source.type === "youtube") {
    if (!youtubeContainer) throw new Error("Falta el contenedor del reproductor de YouTube");
    return new YouTubeAudioSource(youtubeContainer, source.videoId, source.start);
  }
  return new FileAudioSource(source.url, source.start);
}
