import { fuenteDeRelato, getPuzzleDeHoy, parsearCategoria, respuestaError } from "@/lib/puzzle";
import type { TodayResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

/** GET /api/puzzle/today?cat=europa → número + fuente de audio. Nunca incluye datos del gol. */
export async function GET(req: Request) {
  try {
    const categoria = parsearCategoria(new URL(req.url).searchParams.get("cat"));
    const { numero, fecha, relato } = await getPuzzleDeHoy(categoria);
    const source = await fuenteDeRelato(relato, 300);
    const body: TodayResponse = { categoria, numero, fecha, source };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return respuestaError(e);
  }
}
