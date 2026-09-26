"use server";
import { headers } from "next/headers";
import { esEmailAdmin } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface LoginState {
  ok: boolean;
  mensaje: string;
}

export async function enviarLinkMagico(_prev: LoginState | null, form: FormData): Promise<LoginState> {
  const email = String(form.get("email") ?? "").trim();
  const generico: LoginState = {
    ok: true,
    mensaje: "Si el email está autorizado, te llegó un link para entrar. Revisá tu bandeja.",
  };

  // No revelamos si el email es el del admin.
  if (!esEmailAdmin(email)) return generico;

  const h = await headers();
  // Normalizamos: un espacio o una "/" final hacen que Supabase rechace el redirect.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  const origin = siteUrl || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=/admin`,
      // El usuario admin se crea a mano en Supabase: nadie más puede registrarse.
      shouldCreateUser: false,
    },
  });
  if (error) return { ok: false, mensaje: `No se pudo enviar el link: ${error.message}` };
  return generico;
}

export async function cerrarSesion() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
}
