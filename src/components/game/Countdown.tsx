"use client";
import { useEffect, useState } from "react";
import { proximoPuzzle } from "@/lib/date";

const pad = (n: number) => String(n).padStart(2, "0");

export default function Countdown() {
  // Se calcula recién en el cliente: la hora del servidor no coincide (hidratación).
  const [objetivo, setObjetivo] = useState<number | null>(null);
  const [ahora, setAhora] = useState(0);

  useEffect(() => {
    setObjetivo(proximoPuzzle().getTime());
    setAhora(Date.now());
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  if (objetivo === null) {
    return <span className="font-display text-3xl font-bold tabular-nums tracking-wider text-linea">--:--:--</span>;
  }

  const restante = Math.max(0, objetivo - ahora);
  if (restante === 0) {
    return (
      <button
        onClick={() => location.reload()}
        className="font-display text-2xl font-bold uppercase tracking-wide text-cesped underline-offset-4 hover:underline"
      >
        ¡Nuevo relato! Jugar →
      </button>
    );
  }

  const s = Math.floor(restante / 1000);
  return (
    <span className="font-display text-3xl font-bold tabular-nums tracking-wider">
      {pad(Math.floor(s / 3600))}:{pad(Math.floor((s % 3600) / 60))}:{pad(s % 60)}
    </span>
  );
}
