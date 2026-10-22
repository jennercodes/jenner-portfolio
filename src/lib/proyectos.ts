import { type CollectionEntry, getCollection } from 'astro:content';

export type Proyecto = CollectionEntry<'proyectos'>;

export async function getProyectos(): Promise<Proyecto[]> {
  const all = await getCollection('proyectos');
  return all.sort((a, b) => a.data.order - b.data.order);
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
