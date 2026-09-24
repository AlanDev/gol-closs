import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Game from "@/components/game/Game";
import { CATEGORIAS, esCategoria, infoCategoria } from "@/lib/constants";

type Params = Promise<{ categoria: string }>;

export const dynamicParams = false;

export function generateStaticParams() {
  return CATEGORIAS.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { categoria } = await params;
  if (!esCategoria(categoria)) return {};
  const info = infoCategoria(categoria);
  return {
    title: `${info.nombre} — Un Gol de Closs`,
    description: `Un relato de Mariano Closs por día de la ${info.bajada}. Seis intentos para adivinar el gol.`,
  };
}

export default async function CategoriaPage({ params }: { params: Params }) {
  const { categoria } = await params;
  if (!esCategoria(categoria)) notFound();
  // key: al cambiar de categoría se remonta el juego (audio, estado) desde cero.
  return <Game key={categoria} categoria={categoria} />;
}
