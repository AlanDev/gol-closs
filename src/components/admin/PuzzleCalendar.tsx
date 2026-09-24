"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { asignarPuzzle, listarPuzzles, quitarPuzzle, type PuzzleAsignado } from "@/app/admin/actions";
import { CATEGORIAS, type Categoria } from "@/lib/constants";
import { numeroPuzzle } from "@/lib/date";
import type { Relato } from "@/lib/types";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function PuzzleCalendar({ relatos, hoy }: { relatos: Relato[]; hoy: string }) {
  const [anio, setAnio] = useState(() => Number(hoy.slice(0, 4)));
  const [mes, setMes] = useState(() => Number(hoy.slice(5, 7)) - 1);
  const [categoria, setCategoria] = useState<Categoria>("europa");
  const [puzzles, setPuzzles] = useState<Map<string, PuzzleAsignado>>(new Map());
  const [seleccion, setSeleccion] = useState<string | null>(null);
  const [relatoElegido, setRelatoElegido] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const porId = useMemo(() => new Map(relatos.map((r) => [r.id, r])), [relatos]);
  const diasEnMes = new Date(Date.UTC(anio, mes + 1, 0)).getUTCDate();
  // Lunes = 0
  const offset = (new Date(Date.UTC(anio, mes, 1)).getUTCDay() + 6) % 7;

  const cargar = useCallback(async () => {
    setCargando(true);
    const r = await listarPuzzles(iso(anio, mes, 1), iso(anio, mes, diasEnMes), categoria);
    setCargando(false);
    if (!r.ok) return setError(r.error);
    setPuzzles(new Map(r.data.map((p) => [p.fecha, p])));
  }, [anio, mes, diasEnMes, categoria]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const moverMes = (delta: number) => {
    const d = new Date(Date.UTC(anio, mes + delta, 1));
    setAnio(d.getUTCFullYear());
    setMes(d.getUTCMonth());
    setSeleccion(null);
  };

  const elegirDia = (fecha: string) => {
    setSeleccion(fecha);
    setRelatoElegido(puzzles.get(fecha)?.relato_id ?? "");
    setError(null);
  };

  const guardar = async () => {
    if (!seleccion || !relatoElegido) return;
    if (seleccion <= hoy && !confirm("Cambiar el relato de hoy o de un día pasado afecta a quienes ya jugaron. ¿Seguir?")) return;
    const r = await asignarPuzzle(seleccion, categoria, relatoElegido);
    if (!r.ok) return setError(r.error);
    setPuzzles((m) => new Map(m).set(r.data.fecha, r.data));
  };

  const quitar = async () => {
    if (!seleccion) return;
    const r = await quitarPuzzle(seleccion, categoria);
    if (!r.ok) return setError(r.error);
    setPuzzles((m) => {
      const n = new Map(m);
      n.delete(seleccion);
      return n;
    });
    setRelatoElegido("");
  };

  const activos = relatos.filter((r) => r.activo && r.categoria === categoria);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <section>
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-lg border border-linea bg-panel p-1">
          {CATEGORIAS.map((c) => (
            <button
              key={c.slug}
              onClick={() => {
                setCategoria(c.slug);
                setSeleccion(null);
              }}
              className={`h-9 rounded-md font-display uppercase tracking-wide ${
                c.slug === categoria ? "bg-cesped font-bold text-noche" : "text-tenue hover:text-texto"
              }`}
            >
              {c.nombre}
            </button>
          ))}
        </div>
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => moverMes(-1)} className="rounded-md border border-linea px-3 py-1.5" aria-label="Mes anterior">
            ←
          </button>
          <h2 className="font-display text-2xl uppercase">
            {MESES[mes]} {anio} {cargando && <span className="text-sm text-tenue">…</span>}
          </h2>
          <button onClick={() => moverMes(1)} className="rounded-md border border-linea px-3 py-1.5" aria-label="Mes siguiente">
            →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-tenue">
          {DIAS.map((d) => (
            <div key={d} className="py-1 font-display uppercase">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }, (_, i) => (
            <div key={`v${i}`} />
          ))}
          {Array.from({ length: diasEnMes }, (_, i) => {
            const fecha = iso(anio, mes, i + 1);
            const p = puzzles.get(fecha);
            const r = p ? porId.get(p.relato_id) : undefined;
            const esHoy = fecha === hoy;
            const sel = fecha === seleccion;
            return (
              <button
                key={fecha}
                onClick={() => elegirDia(fecha)}
                className={`flex min-h-20 flex-col items-start rounded-md border p-1.5 text-left text-xs transition ${
                  sel ? "border-cesped bg-cesped/10" : esHoy ? "border-zocalo" : "border-linea bg-panel hover:border-tenue"
                } ${fecha < hoy ? "opacity-60" : ""}`}
              >
                <span className="flex w-full justify-between font-display text-sm">
                  <span>{i + 1}</span>
                  <span className="text-tenue">#{numeroPuzzle(fecha)}</span>
                </span>
                {r ? (
                  <span className="mt-1 line-clamp-2 leading-tight text-texto/90">{r.jugador}</span>
                ) : p ? (
                  <span className="mt-1 text-error">?</span>
                ) : (
                  <span className="mt-1 text-tenue/60">auto</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-tenue">
          Los días sin asignar (“auto”) reciben un relato activo no usado recientemente la primera vez que alguien entra.
        </p>
      </section>

      <aside className="rounded-lg border border-linea bg-panel p-4">
        {seleccion ? (
          <div className="space-y-3">
            <h3 className="font-display text-xl uppercase">
              {seleccion} <span className="text-tenue">#{numeroPuzzle(seleccion)}</span>
            </h3>
            <select
              value={relatoElegido}
              onChange={(e) => setRelatoElegido(e.target.value)}
              className="h-11 w-full rounded-lg border border-linea bg-panel-2 px-2"
            >
              <option value="">— Elegí un relato —</option>
              {activos.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.jugador} — {r.equipo} vs {r.rival} ({r.anio})
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={guardar}
                disabled={!relatoElegido}
                className="h-10 flex-1 rounded-lg bg-cesped font-display font-bold uppercase text-noche disabled:opacity-40"
              >
                Asignar
              </button>
              {puzzles.has(seleccion) && (
                <button onClick={quitar} className="h-10 rounded-lg border border-linea px-3 text-error">
                  Quitar
                </button>
              )}
            </div>
            {error && <p className="text-sm text-error">{error}</p>}
          </div>
        ) : (
          <p className="text-sm text-tenue">Elegí un día del calendario para asignarle un relato.</p>
        )}
      </aside>
    </div>
  );
}
