"use client";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createAudioSource, type AudioSource } from "@/lib/audio";
import {
  DURACION_REVELACION,
  DURACION_TOTAL,
  DURACIONES,
  infoCategoria,
  MAX_INTENTOS,
  type Categoria,
} from "@/lib/constants";
import {
  cargarPartida,
  cargarStats,
  guardarPartida,
  marcarAyudaVista,
  registrarResultado,
  statsVacias,
  textoCompartir,
  yaVioAyuda,
} from "@/lib/storage";
import { etiquetaRelato } from "@/lib/text";
import type {
  Attempt,
  GameState,
  GuessResponse,
  RelatoOpcion,
  RevealResponse,
  Stats,
  TodayResponse,
} from "@/lib/types";
import { IconHelp, IconMic, IconPlay, IconSpinner, IconStats, IconStop } from "@/components/ui/Icons";
import AttemptList from "./AttemptList";
import CategoryTabs from "./CategoryTabs";
import GuessInput from "./GuessInput";
import HowToPlayModal from "./HowToPlayModal";
import ProgressBar from "./ProgressBar";
import ResultModal from "./ResultModal";
import StatsModal from "./StatsModal";

type ModalId = "ayuda" | "stats" | "resultado" | null;

/** Tapar siempre el video de YouTube: solo se escucha el relato. */
const OCULTAR_VIDEO = process.env.NEXT_PUBLIC_OCULTAR_VIDEO !== "false";

async function leerJson<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(body.error ?? `Error ${res.status}`), { status: res.status });
  return body as T;
}

export default function Game({ categoria }: { categoria: Categoria }) {
  const [puzzle, setPuzzle] = useState<TodayResponse | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [opciones, setOpciones] = useState<RelatoOpcion[]>([]);
  const [game, setGame] = useState<GameState | null>(null);
  const [stats, setStats] = useState<Stats>(statsVacias);
  const [reveal, setReveal] = useState<RevealResponse | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);

  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const [modal, setModal] = useState<ModalId>(null);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const sourceRef = useRef<AudioSource | null>(null);
  const ytRef = useRef<HTMLDivElement>(null);

  const avisar = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 2200);
  }, []);

  // ---------- Carga inicial ----------
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [today, catalogo] = await Promise.all([
          fetch(`/api/puzzle/today?cat=${categoria}`, { cache: "no-store" }).then((r) => leerJson<TodayResponse>(r)),
          fetch(`/api/relatos?cat=${categoria}`).then((r) => leerJson<RelatoOpcion[]>(r)),
        ]);
        if (cancelado) return;
        const partida = cargarPartida(categoria, today.numero);
        setPuzzle(today);
        setOpciones(catalogo);
        setGame(partida);
        setStats(cargarStats(categoria));
        if (partida.status !== "jugando") setModal("resultado");
        else if (!yaVioAyuda()) setModal("ayuda");
      } catch (e) {
        if (!cancelado) setErrorCarga(e instanceof Error ? e.message : "Error al cargar");
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [categoria]);

  // ---------- Fuente de audio (precarga antes de habilitar play) ----------
  useEffect(() => {
    if (!puzzle) return;
    let src: AudioSource;
    try {
      src = createAudioSource(puzzle.source, ytRef.current);
    } catch (e) {
      setAudioError(e instanceof Error ? e.message : "Error de audio");
      return;
    }
    sourceRef.current = src;
    setAudioReady(false);
    setAudioError(null);
    src.load().then(
      () => sourceRef.current === src && setAudioReady(true),
      (e: Error) => sourceRef.current === src && setAudioError(e.message),
    );
    return () => {
      src.destroy();
      if (sourceRef.current === src) sourceRef.current = null;
    };
  }, [puzzle]);

  // ---------- Revelación al terminar ----------
  const terminado = !!game && game.status !== "jugando";
  useEffect(() => {
    if (!game || game.status === "jugando" || reveal) return;
    const intentos = game.attempts.map((a) => (a.kind === "saltado" ? "skip" : a.relatoId)).join(",");
    let cancelado = false;
    fetch(`/api/puzzle/reveal?cat=${game.categoria}&numero=${game.numero}&intentos=${intentos}`, { cache: "no-store" })
      .then((r) => leerJson<RevealResponse>(r))
      .then((r) => !cancelado && setReveal(r))
      .catch((e: Error & { status?: number }) => {
        if (cancelado) return;
        if (e.status === 409) location.reload();
        else setRevealError(e.message);
      });
    return () => {
      cancelado = true;
    };
  }, [game, reveal]);

  // ---------- Reproducción ----------
  const indice = game?.attempts.length ?? 0;
  const desbloqueado = DURACIONES[Math.min(indice, MAX_INTENTOS - 1)];
  const duracion = terminado ? DURACION_REVELACION : desbloqueado;

  const detener = useCallback(() => sourceRef.current?.stop(), []);

  const togglePlay = () => {
    const src = sourceRef.current;
    if (!src || !audioReady) return;
    if (playing) {
      src.stop();
      return;
    }
    setPlaying(true);
    setElapsed(0);
    // Sin awaits antes de play(): los navegadores móviles exigen el gesto del usuario.
    src.play({
      duration: duracion,
      onProgress: setElapsed,
      onEnd: () => {
        setPlaying(false);
        setElapsed(0);
      },
    });
  };

  // ---------- Intentos ----------
  const registrar = (attempt: Attempt) => {
    if (!game || game.status !== "jugando") return;
    const attempts = [...game.attempts, attempt];
    const gano = attempt.kind === "respuesta" && attempt.result === "correcto";
    const status = gano ? "ganado" : attempts.length >= MAX_INTENTOS ? "perdido" : "jugando";
    // Saltar mientras suena: sigue corriendo hasta la nueva duración, sin volver al inicio.
    if (attempt.kind === "saltado" && status === "jugando" && playing) {
      sourceRef.current?.extend(DURACIONES[attempts.length]);
    } else {
      detener();
    }
    const next: GameState = { ...game, attempts, status };
    setGame(next);
    guardarPartida(next);
    if (status !== "jugando") {
      setStats(registrarResultado(next.categoria, next.numero, gano, attempts.length));
      setTimeout(() => setModal("resultado"), 700);
    }
  };

  const adivinar = async (r: RelatoOpcion) => {
    if (!game || enviando) return;
    setEnviando(true);
    try {
      const res = await fetch("/api/puzzle/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoria: game.categoria,
          relatoId: r.id,
          intento: game.attempts.length + 1,
          numero: game.numero,
        }),
      });
      if (res.status === 409) {
        location.reload();
        return;
      }
      const j = await leerJson<GuessResponse>(res);
      registrar({
        kind: "respuesta",
        relatoId: r.id,
        label: etiquetaRelato(r),
        result: j.correcto ? "correcto" : j.cerca ? "cerca" : "incorrecto",
      });
    } catch (e) {
      avisar(e instanceof Error ? e.message : "No se pudo enviar");
    } finally {
      setEnviando(false);
    }
  };

  const saltar = () => registrar({ kind: "saltado" });

  const compartir = async () => {
    if (!game) return;
    const texto = textoCompartir(game.categoria, game.numero, game.attempts);
    try {
      await navigator.clipboard.writeText(texto);
      avisar("¡Copiado al portapapeles!");
    } catch {
      avisar("No se pudo copiar");
    }
  };

  const excluidos = useMemo(
    () => new Set(game?.attempts.flatMap((a) => (a.kind === "respuesta" ? [a.relatoId] : [])) ?? []),
    [game],
  );

  const cerrarModal = useCallback(() => {
    setModal((m) => {
      if (m === "ayuda") marcarAyudaVista();
      return null;
    });
  }, []);

  const skipLabel =
    indice >= MAX_INTENTOS - 1 ? "Me rindo" : `Saltar (+${DURACIONES[indice + 1] - DURACIONES[indice]}s)`;

  // ---------- Render ----------
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 pb-6">
      <header className="flex items-center justify-between pt-4 pb-3">
        <button
          onClick={() => setModal("ayuda")}
          aria-label="Cómo jugar"
          className="grid size-11 place-items-center rounded-full text-tenue hover:bg-panel hover:text-texto"
        >
          <IconHelp />
        </button>
        <h1>
          <Link href="/" aria-label="Inicio">
            <Logo mic className="text-[1.75rem] sm:text-4xl" />
          </Link>
        </h1>
        <button
          onClick={() => setModal("stats")}
          aria-label="Estadísticas"
          className="grid size-11 place-items-center rounded-full text-tenue hover:bg-panel hover:text-texto"
        >
          <IconStats />
        </button>
      </header>

      <CategoryTabs actual={categoria} version={game?.status} />

      {/* Zócalo de transmisión */}
      <div className="mb-4 flex items-stretch overflow-hidden rounded-sm border border-linea bg-panel font-display text-sm uppercase tracking-widest">
        <span className="flex items-center gap-1.5 bg-error px-2.5 font-semibold text-white">
          <span className="animate-en-vivo size-1.5 rounded-full bg-white" />
          En vivo
        </span>
        <span className="zocalo flex items-center px-3 pr-6 font-bold">
          {infoCategoria(categoria).nombre} #{puzzle?.numero ?? "—"}
        </span>
        <span className="ml-auto flex items-center px-3 text-tenue">
          {game ? `Intento ${Math.min(indice + 1, MAX_INTENTOS)}/${MAX_INTENTOS}` : ""}
        </span>
      </div>

      {errorCarga ? (
        <div className="mt-10 rounded-lg border border-error/50 bg-error/10 p-5 text-center">
          <p className="font-display text-xl uppercase">Se cortó la transmisión</p>
          <p className="mt-2 text-sm text-tenue">{errorCarga}</p>
          <button onClick={() => location.reload()} className="mt-4 rounded-md bg-panel-2 px-4 py-2 text-sm">
            Reintentar
          </button>
        </div>
      ) : !game || !puzzle ? (
        <div className="grid flex-1 place-items-center text-cesped">
          <IconSpinner />
        </div>
      ) : (
        <main className="flex flex-1 flex-col gap-5">
          <AttemptList attempts={game.attempts} activo={!terminado} />

          {puzzle.source.type === "youtube" && (
            <div className="relative mx-auto aspect-video w-44 overflow-hidden rounded-md border border-linea bg-black">
              <div ref={ytRef} className="size-full" />
              {/* Tapa el video siempre, también al terminar: el resultado se muestra en el
                  pop-up, no en el video. No se usa display:none porque algunos navegadores
                  pausan iframes ocultos. */}
              {OCULTAR_VIDEO && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 bg-panel text-tenue">
                  <IconMic className="size-6 text-cesped" />
                  <span className="font-display text-xs uppercase tracking-widest">
                    {terminado ? "Relato completo" : "Solo relato"}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="mt-auto flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={togglePlay}
                disabled={!audioReady}
                aria-label={playing ? "Detener" : "Reproducir fragmento"}
                className="relative grid size-16 shrink-0 place-items-center rounded-full bg-cesped text-noche shadow-[0_0_30px_-4px] shadow-cesped/60 transition hover:brightness-110 active:scale-95 disabled:bg-panel-2 disabled:text-tenue disabled:shadow-none"
              >
                {!audioReady && !audioError ? (
                  <IconSpinner className="size-7" />
                ) : playing ? (
                  <IconStop className="size-7" />
                ) : (
                  <IconPlay className="ml-1 size-8" />
                )}
              </button>
              <div className="flex-1">
                {terminado ? (
                  <ProgressBar total={DURACION_REVELACION} unlocked={DURACION_REVELACION} elapsed={elapsed} />
                ) : (
                  <ProgressBar total={DURACION_TOTAL} unlocked={desbloqueado} elapsed={elapsed} marks={DURACIONES} />
                )}
              </div>
            </div>
            {audioError && <p className="text-center text-sm text-error">Audio no disponible: {audioError}</p>}

            {terminado ? (
              <button
                onClick={() => setModal("resultado")}
                className="h-13 w-full rounded-lg bg-zocalo font-display text-xl font-bold uppercase tracking-wide text-noche hover:brightness-110"
              >
                Ver resultado
              </button>
            ) : (
              <GuessInput
                opciones={opciones}
                excluidos={excluidos}
                disabled={enviando}
                skipLabel={skipLabel}
                onGuess={adivinar}
                onSkip={saltar}
              />
            )}
          </div>
        </main>
      )}

      <HowToPlayModal open={modal === "ayuda"} onClose={cerrarModal} />
      <StatsModal
        open={modal === "stats"}
        onClose={cerrarModal}
        stats={stats}
        numeroHoy={puzzle?.numero ?? null}
        intentoGanadorHoy={game?.status === "ganado" ? game.attempts.length : null}
      />
      {game && (
        <ResultModal
          open={modal === "resultado"}
          onClose={cerrarModal}
          game={game}
          reveal={reveal}
          revealError={revealError}
          audioReady={audioReady}
          playing={playing}
          elapsed={elapsed}
          onTogglePlay={togglePlay}
          onShare={compartir}
          categoria={categoria}
        />
      )}

      {toast && (
        <div
          role="status"
          className="animate-aparecer fixed top-20 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-texto px-4 py-2 font-semibold text-noche shadow-xl"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
