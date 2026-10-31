import { type CollectionEntry, getCollection } from 'astro:content';

export type Proyecto = CollectionEntry<'proyectos'>;

/** Proyectos publicados (sin los `hidden`), en orden. Todo el sitio pasa por aquí */
export async function getProyectos(): Promise<Proyecto[]> {
  const all = await getCollection('proyectos', (p) => !p.data.hidden);
  for (const p of all) assertFigures(p);
  return all.sort((a, b) => a.data.order - b.data.order);
}

/**
 * Una línea en blanco dentro de un <figure> cierra el bloque HTML del markdown: el resto
 * se procesa como texto, el `-->` del diagrama para la terminal se vuelve `–>` y el
 * comentario queda abierto, tragándose el resto de la página. Mejor que falle el build.
 */
function assertFigures(p: Proyecto): void {
  for (const figure of (p.body ?? '').matchAll(/<figure[\s\S]*?<\/figure>/g)) {
    if (/\n\s*\n/.test(figure[0])) {
      throw new Error(`${p.id}.md: un <figure> tiene una línea en blanco (ver assertFigures)`);
    }
  }
}

export async function getDestacados(): Promise<Proyecto[]> {
  return (await getProyectos()).filter((p) => p.data.featured);
}

/** "2025 — hoy", "2022 — 2025" o "2026" */
export function formatPeriod({ start, end }: { start: number; end?: number }): string {
  if (end === undefined) {
    return start === new Date().getFullYear() ? `${start}` : `${start} — hoy`;
  }
  return start === end ? `${start}` : `${start} — ${end}`;
}
