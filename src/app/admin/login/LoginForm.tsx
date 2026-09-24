"use client";
import { useActionState } from "react";
import { enviarLinkMagico, type LoginState } from "./actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState | null, FormData>(enviarLinkMagico, null);

  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="text-sm text-tenue" htmlFor="email">
        Email del admin
      </label>
      <input
        id="email"
        name="email"
        type="email"
        required
        autoComplete="email"
        className="h-12 rounded-lg border border-linea bg-panel px-4 outline-none focus:border-cesped"
      />
      <button
        disabled={pending}
        className="h-12 rounded-lg bg-cesped font-display text-lg font-bold uppercase tracking-wide text-noche disabled:opacity-50"
      >
        {pending ? "Enviando…" : "Enviarme link de acceso"}
      </button>
      {state && <p className={`text-sm ${state.ok ? "text-cesped" : "text-error"}`}>{state.mensaje}</p>}
    </form>
  );
}
