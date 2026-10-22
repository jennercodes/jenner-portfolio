import type { APIRoute } from 'astro';
import { about, nav, principles, site, talks } from '../data/site';
import { formatPeriod, getProyectos } from '../lib/proyectos';
import type { TuiData } from '../lib/tui/types';

/** Datos del modo terminal: se piden solo al activarlo (src/lib/tui) */
export const GET: APIRoute = async () => {
  const proyectos = (await getProyectos()).map((p) => ({
    id: p.id,
    title: p.data.title,
    role: p.data.role,
    client: p.data.client,
    period: formatPeriod(p.data),
    summary: p.data.summary,
    stack: p.data.stack,
    featured: p.data.featured,
    personal: p.data.personal,
    url: p.data.url,
    body: p.body ?? '',
  }));

  return Response.json({ site, nav, principles, talks, about, proyectos } satisfies TuiData);
};
