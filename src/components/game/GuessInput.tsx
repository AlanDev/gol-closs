"use client";
import { useId, useMemo, useRef, useState } from "react";
import { buscarRelatos, etiquetaRelato } from "@/lib/text";
import type { RelatoOpcion } from "@/lib/types";

interface Props {
  opciones: RelatoOpcion[];
  excluidos: Set<string>;
  disabled: boolean;
  skipLabel: string;
  onGuess: (r: RelatoOpcion) => void;
  onSkip: () => void;
}

export default function GuessInput({ opciones, excluidos, disabled, skipLabel, onGuess, onSkip }: Props) {
  const [consulta, setConsulta] = useState("");
  const [elegido, setElegido] = useState<RelatoOpcion | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [resaltado, setResaltado] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const resultados = useMemo(
    () => (elegido ? [] : buscarRelatos(opciones, consulta, excluidos)),
    [opciones, consulta, excluidos, elegido],
  );
  const mostrarLista = abierto && resultados.length > 0;

  const elegir = (r: RelatoOpcion) => {
    setElegido(r);
    setConsulta(etiquetaRelato(r));
    setAbierto(false);
  };

  const enviar = () => {
    if (!elegido || disabled) return;
    onGuess(elegido);
    setElegido(null);
    setConsulta("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && resultados.length) {
      e.preventDefault();
      setAbierto(true);
      setResaltado((i) => (i + 1) % resultados.length);
    } else if (e.key === "ArrowUp" && resultados.length) {
      e.preventDefault();
      setResaltado((i) => (i - 1 + resultados.length) % resultados.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (mostrarLista && resultados[resaltado]) elegir(resultados[resaltado]);
      else enviar();
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative">
        {mostrarLista && (
          <ul
            id={listId}
            role="listbox"
            className="absolute inset-x-0 bottom-full z-20 mb-2 max-h-72 overflow-y-auto rounded-lg border border-linea bg-panel-2 py-1 shadow-2xl"
          >
            {resultados.map((r, i) => (
              <li
                key={r.id}
                role="option"
                aria-selected={i === resaltado}
                // mousedown para que no se pierda el foco antes del click
                onMouseDown={(e) => {
                  e.preventDefault();
                  elegir(r);
                }}
                onMouseEnter={() => setResaltado(i)}
                className={`cursor-pointer px-3 py-2.5 text-sm leading-snug ${
                  i === resaltado ? "bg-cesped/15 text-texto" : "text-texto/85"
                }`}
              >
                <span className="font-semibold">{r.jugador}</span>
                <span className="text-tenue">
                  {" "}
                  — {r.equipo} vs {r.rival} ({r.competicion}, {r.anio})
                </span>
              </li>
            ))}
          </ul>
        )}
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={mostrarLista}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label="Buscá el gol"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          placeholder="Buscá jugador, equipo, rival…"
          value={consulta}
          onChange={(e) => {
            setConsulta(e.target.value);
            setElegido(null);
            setAbierto(true);
            setResaltado(0);
          }}
          onFocus={() => setAbierto(true)}
          onBlur={() => setAbierto(false)}
          onKeyDown={onKeyDown}
          className={`h-13 w-full rounded-lg border bg-panel px-4 text-base outline-none transition placeholder:text-tenue/70 disabled:opacity-50 ${
            elegido ? "border-cesped" : "border-linea focus:border-cesped/70"
          }`}
        />
        {consulta && !disabled && (
          <button
            type="button"
            aria-label="Borrar"
            onClick={() => {
              setConsulta("");
              setElegido(null);
              inputRef.current?.focus();
            }}
            className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-tenue hover:text-texto"
          >
            ×
          </button>
        )}
      </div>
      {consulta && !elegido && !mostrarLista && !disabled && (
        <p className="-mt-1 text-xs text-tenue">Elegí una opción de la lista para responder.</p>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onSkip}
          disabled={disabled}
          className="h-13 rounded-lg border border-linea bg-panel-2 font-display text-lg font-semibold uppercase tracking-wide text-texto/90 transition hover:border-tenue active:scale-[0.98] disabled:opacity-50"
        >
          {skipLabel}
        </button>
        <button
          type="button"
          onClick={enviar}
          disabled={!elegido || disabled}
          className="h-13 rounded-lg bg-cesped font-display text-lg font-bold uppercase tracking-wide text-noche transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-cesped/25 disabled:text-noche/60"
        >
          Adivinar
        </button>
      </div>
    </div>
  );
}
