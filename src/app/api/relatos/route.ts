import { esCategoria } from "@/lib/constants";
import { supabasePublic } from "@/lib/supabase/public";
import type { RelatoOpcion } from "@/lib/types";

// Catálogo de una categoría para el autocompletado. Usa el rol anon: RLS +
// grants por columna garantizan que solo salgan relatos activos y sin audio/start.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const cat = new URL(req.url).searchParams.get("cat");
  if (!esCategoria(cat)) return Response.json({ error: "Categoría inválida" }, { status: 400 });

  const { data, error } = await supabasePublic()
    .from("relatos")
    .select("id, categoria, jugador, equipo, rival, competicion, anio")
    .eq("categoria", cat)
    .order("jugador", { ascending: true })
    .returns<RelatoOpcion[]>();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? [], {
    // Cacheado en el CDN de Vercel 5 minutos.
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
  });
}
