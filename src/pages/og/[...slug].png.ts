import type { APIRoute, GetStaticPaths } from 'astro';
import { site } from '../../data/site';
import { type OgContent, renderOg } from '../../lib/og';
import { formatPeriod, getProyectos } from '../../lib/proyectos';

/** Una imagen por página: /og/index.png, /og/proyectos.png, /og/proyectos/<id>.png… (Base.astro) */
export const getStaticPaths = (async () => {
  const proyectos = await getProyectos();
  const pages: { slug: string; og: OgContent }[] = [
    {
      slug: 'index',
      og: {
        eyebrow: site.location,
        title: site.author,
        subtitle: `${site.role} · ${site.secondaryRole}`,
      },
    },
    {
      slug: 'proyectos',
      og: {
        eyebrow: `${proyectos.length} proyectos`,
        title: 'Proyectos',
        subtitle:
          'E-commerce multi-marca, plataformas educativas, hosting y webs para marcas y artistas.',
      },
    },
    {
      slug: 'sobre-mi',
      og: {
        eyebrow: 'Sobre mí',
        title: site.author,
        subtitle: 'De docente de tecnología a Senior Frontend Engineer.',
      },
    },
    ...proyectos.map((p) => ({
      slug: `proyectos/${p.id}`,
      og: {
        eyebrow: `Caso de estudio · ${formatPeriod(p.data)}`,
        title: p.data.title,
        subtitle: p.data.summary,
      },
    })),
  ];
  return pages.map(({ slug, og }) => ({ params: { slug }, props: og }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOg(props as OgContent);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
