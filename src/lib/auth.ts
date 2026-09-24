import "server-only";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "./supabase/server";

export function esEmailAdmin(email: string | null | undefined): boolean {
  const admin = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return !!admin && !!email && email.trim().toLowerCase() === admin;
}

/** Devuelve el usuario admin o null. Usa getUser() (valida el JWT contra Supabase). */
export async function getAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user && esEmailAdmin(user.email) ? user : null;
}

/** Para páginas: redirige al login si no es admin. */
export async function requireAdminPage() {
  const user = await getAdmin();
  if (!user) redirect("/admin/login");
  return user;
}

/** Para server actions: lanza si no es admin. */
export async function requireAdminAction() {
  const user = await getAdmin();
  if (!user) throw new Error("No autorizado");
  return user;
}
