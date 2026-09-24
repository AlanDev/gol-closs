/** Duración (segundos) del fragmento en cada intento. */
export const DURACIONES = [1, 2, 4, 7, 11, 16] as const;
export const MAX_INTENTOS = DURACIONES.length;
export const DURACION_TOTAL = DURACIONES[DURACIONES.length - 1];
/** Duración de la reproducción al revelar. */
export const DURACION_REVELACION = 30;

export const TIMEZONE = "America/Argentina/Buenos_Aires";

export const CATEGORIAS = [
  { slug: "europa", nombre: "Europa", bajada: "Champions, LaLiga, Premier, Serie A y más" },
  { slug: "sudamerica", nombre: "Sudamérica", bajada: "Libertadores, Sudamericana, ligas locales y más" },
  { slug: "selecciones", nombre: "Selecciones", bajada: "Mundiales, Copa América, Eurocopa y Eliminatorias" },
] as const;

export type Categoria = (typeof CATEGORIAS)[number]["slug"];

export function esCategoria(v: unknown): v is Categoria {
  return CATEGORIAS.some((c) => c.slug === v);
}

export function infoCategoria(slug: Categoria) {
  return CATEGORIAS.find((c) => c.slug === slug)!;
}
