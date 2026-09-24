import { fuenteDeRelato, getPuzzleDeHoy, parsearCategoria, respuestaError } from "@/lib/puzzle";
import { MAX_INTENTOS } from "@/lib/constants";
import { esUuid } from "@/lib/text";
import type { RevealResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Datos del gol. El cliente debe mandar su partida terminada:
 *   ?cat=selecciones&numero=42&intentos=skip,<uuid>,<uuid>
 * Validación básica: o contiene el relato correcto, o son 6 intentos.
 */
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const numero = Number(params.get("numero"));
  const intentos = (params.get("intentos") ?? "").split(",").filter(Boolean);

  if (intentos.length === 0 || intentos.length > MAX_INTENTOS) {
    return Response.json({ error: "Partida inválida" }, { status: 400 });
  }
  if (!intentos.every((i) => i === "skip" || esUuid(i))) {
    return Response.json({ error: "Partida inválida" }, { status: 400 });
  }

  try {
    const { numero: numeroHoy, relato } = await getPuzzleDeHoy(parsearCategoria(params.get("cat")));
    if (numero !== numeroHoy) {
      return Response.json({ error: "El puzzle cambió, recargá la página" }, { status: 409 });
    }

    const indiceCorrecto = intentos.indexOf(relato.id);
    const gano = indiceCorrecto === intentos.length - 1;
    const perdio = indiceCorrecto === -1 && intentos.length === MAX_INTENTOS;
    if (!gano && !perdio) {
      return Response.json({ error: "La partida todavía no terminó" }, { status: 403 });
    }

    const body: RevealResponse = {
      numero: numeroHoy,
      relato: {
        id: relato.id,
        categoria: relato.categoria,
        jugador: relato.jugador,
        equipo: relato.equipo,
        rival: relato.rival,
        competicion: relato.competicion,
        anio: relato.anio,
      },
      source: await fuenteDeRelato(relato, 600),
    };
    return Response.json(body, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return respuestaError(e);
  }
}
