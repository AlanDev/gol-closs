"use client";
import Logo from "@/components/ui/Logo";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { cambiarActivo, eliminarRelato } from "@/app/admin/actions";
import { cerrarSesion } from "@/app/admin/login/actions";
import { CATEGORIAS, infoCategoria, type Categoria } from "@/lib/constants";
import type { Relato } from "@/lib/types";
import PuzzleCalendar from "./PuzzleCalendar";
import RelatoForm from "./RelatoForm";

interface Props {
  relatos: Relato[];
  email: string;
  hoy: string;
}

type Tab = "relatos" | "calendario";

export default function AdminPanel({ relatos, email, hoy }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("relatos");
  const [editando, setEditando] = useState<Relato | "nuevo" | null>(null);
  const [filtro, setFiltro] = useState("");
  const [categoria, setCategoria] = useState<Categoria | "todas">("todas");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const visibles = relatos.filter(
    (r) =>
      (categoria === "todas" || r.categoria === categoria) &&
      `${r.jugador} ${r.equipo} ${r.rival} ${r.competicion} ${r.anio}`.toLowerCase().includes(filtro.toLowerCase()),
  );

  const accion = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      setError(null);
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Error");
      router.refresh();
    });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center gap-3">
        <h1>
          <Logo className="text-3xl" />
        </h1>
        <span className="zocalo px-3 pr-6 font-display text-sm font-bold uppercase tracking-widest">Admin</span>
        <div className="ml-auto flex items-center gap-3 text-sm text-tenue">
          <span className="hidden sm:inline">{email}</span>
          <button
            onClick={async () => {
              await cerrarSesion();
              router.push("/admin/login");
            }}
            className="rounded-md border border-linea px-3 py-1.5 hover:text-texto"
          >
            Salir
          </button>
        </div>
      </header>

      <nav className="mb-6 flex gap-1 border-b border-linea">
        {(["relatos", "calendario"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2.5 font-display text-lg uppercase tracking-wide ${
              tab === t ? "border-cesped text-texto" : "border-transparent text-tenue hover:text-texto"
            }`}
          >
            {t === "relatos" ? `Relatos (${relatos.length})` : "Calendario"}
          </button>
        ))}
      </nav>

      {error && (
        <p className="mb-4 rounded-md border border-error/50 bg-error/10 px-3 py-2 text-sm">{error}</p>
      )}

      {tab === "relatos" ? (
        editando ? (
          <RelatoForm
            relato={editando === "nuevo" ? null : editando}
            categoriaInicial={categoria === "todas" ? "europa" : categoria}
            onDone={() => {
              setEditando(null);
              router.refresh();
            }}
            onCancel={() => setEditando(null)}
          />
        ) : (
          <section>
            <div className="mb-3 flex flex-wrap gap-1.5">
              {(["todas", ...CATEGORIAS.map((c) => c.slug)] as const).map((c) => {
                const n = c === "todas" ? relatos.length : relatos.filter((r) => r.categoria === c).length;
                return (
                  <button
                    key={c}
                    onClick={() => setCategoria(c)}
                    className={`rounded-md px-3 py-1.5 font-display text-sm uppercase tracking-wide ${
                      categoria === c ? "bg-cesped text-noche" : "border border-linea text-tenue hover:text-texto"
                    }`}
                  >
                    {c === "todas" ? "Todas" : infoCategoria(c).nombre} ({n})
                  </button>
                );
              })}
            </div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <input
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Filtrar…"
                className="h-11 flex-1 rounded-lg border border-linea bg-panel px-3 outline-none focus:border-cesped"
              />
              <button
                onClick={() => setEditando("nuevo")}
                className="h-11 rounded-lg bg-cesped px-5 font-display font-bold uppercase tracking-wide text-noche"
              >
                + Nuevo relato
              </button>
            </div>

            <ul className={`divide-y divide-linea rounded-lg border border-linea bg-panel ${pending ? "opacity-60" : ""}`}>
              {visibles.length === 0 && <li className="p-6 text-center text-tenue">No hay relatos.</li>}
              {visibles.map((r) => (
                <li key={r.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.jugador}</span>
                      <span className="rounded bg-zocalo/15 px-1.5 py-0.5 text-[10px] font-bold uppercase text-zocalo">
                        {infoCategoria(r.categoria).nombre}
                      </span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          r.source_type === "youtube" ? "bg-error/20 text-error" : "bg-cesped/15 text-cesped"
                        }`}
                      >
                        {r.source_type === "youtube" ? "YouTube" : "Audio"}
                      </span>
                      {!r.activo && (
                        <span className="rounded bg-panel-2 px-1.5 py-0.5 text-[10px] font-bold uppercase text-tenue">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <div className="truncate text-sm text-tenue">
                      {r.equipo} vs {r.rival} · {r.competicion} {r.anio} · inicio {r.start_seconds}s
                    </div>
                  </div>
                  <div className="flex gap-2 text-sm">
                    <button
                      onClick={() => setEditando(r)}
                      className="rounded-md border border-linea px-3 py-1.5 hover:border-cesped"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => accion(() => cambiarActivo(r.id, !r.activo))}
                      className="rounded-md border border-linea px-3 py-1.5 hover:border-zocalo"
                    >
                      {r.activo ? "Desactivar" : "Activar"}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Borrar el relato de ${r.jugador}? No se puede deshacer.`)) {
                          accion(() => eliminarRelato(r.id));
                        }
                      }}
                      className="rounded-md border border-linea px-3 py-1.5 text-error hover:border-error"
                    >
                      Borrar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )
      ) : (
        <PuzzleCalendar relatos={relatos} hoy={hoy} />
      )}
    </div>
  );
}
