import { getPuzzleDeHoy, mismoEquipo, parsearCategoria, respuestaError } from "@/lib/puzzle";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MAX_INTENTOS } from "@/lib/constants";
import { esUuid } from "@/lib/text";
import type { GuessResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { relatoId?: unknown; intento?: unknown; numero?: unknown; categoria?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { relatoId, intento, numero } = body;
  if (!esUuid(relatoId)) return Response.json({ error: "relatoId inválido" }, { status: 400 });
  if (typeof intento !== "number" || !Number.isInteger(intento) || intento < 1 || intento > MAX_INTENTOS) {
    return Response.json({ error: "intento inválido" }, { status: 400 });
  }

  try {
    const puzzle = await getPuzzleDeHoy(parsearCategoria(body.categoria));
    // Si el cliente quedó abierto después de medianoche, que recargue.
    if (numero !== undefined && numero !== puzzle.numero) {
      return Response.json({ error: "El puzzle cambió, recargá la página" }, { status: 409 });
    }

    const correcto = relatoId === puzzle.relato.id;
    let cerca = false;
    if (!correcto) {
      const { data: elegido } = await supabaseAdmin()
        .from("relatos")
        .select("equipo")
        .eq("id", relatoId)
        .eq("categoria", puzzle.categoria)
        .eq("activo", true)
        .maybeSingle<{ equipo: string }>();
      if (!elegido) return Response.json({ error: "Relato inexistente" }, { status: 400 });
      cerca = mismoEquipo(elegido.equipo, puzzle.relato.equipo);
    }

    const res: GuessResponse = { correcto, cerca };
    return Response.json(res, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return respuestaError(e);
  }
}
