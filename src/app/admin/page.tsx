import type { Metadata } from "next";
import AdminPanel from "@/components/admin/AdminPanel";
import { requireAdminPage } from "@/lib/auth";
import { hoyAR } from "@/lib/date";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Relato } from "@/lib/types";

export const metadata: Metadata = { title: "Admin — Un Gol de Closs", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await requireAdminPage();
  const { data, error } = await supabaseAdmin()
    .from("relatos")
    .select("*")
    .order("created_at", { ascending: false })
    .returns<Relato[]>();

  if (error) {
    return <p className="p-6 text-error">Error cargando relatos: {error.message}</p>;
  }

  const relatos = (data ?? []).map((r) => ({ ...r, start_seconds: Number(r.start_seconds) }));
  return <AdminPanel relatos={relatos} email={user.email ?? ""} hoy={hoyAR()} />;
}
