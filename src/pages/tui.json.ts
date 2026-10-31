import { getImage } from 'astro:assets';
import type { APIRoute, ImageMetadata } from 'astro';
import { rawContent } from '../data/privacidad.md';
import { about, nav, principles, site, talks } from '../data/site';
import { formatPeriod, getProyectos } from '../lib/proyectos';
import type { TuiData, TuiImage } from '../lib/tui/types';

/** Imágenes de los casos, por ruta: las del markdown se resuelven con esto */
const assets = import.meta.glob<ImageMetadata>('/src/assets/proyectos/**/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
});

async function image(src: ImageMetadata, alt: string): Promise<TuiImage> {
  const [img, thumb] = await Promise.all([
    getImage({ src, format: 'webp', width: Math.min(src.width, 2400) }),
    getImage({ src, format: 'webp', width: Math.min(src.width, 480) }),
  ]);
  return {
    src: img.src,
    thumb: thumb.src,
    width: Number(img.attributes.width),
    height: Number(img.attributes.height),
    alt,
  };
}

/** Datos del modo terminal: se piden solo al activarlo (src/lib/tui) */
export const GET: APIRoute = async () => {
  const proyectos = await Promise.all(
    (await getProyectos()).map(async (p) => {
      // Las imágenes del texto y de la galería, en una sola lista: el markdown las cita por índice
      const images: TuiImage[] = [];
      let body = p.body ?? '';
      for (const m of body.matchAll(/!\[([^\]]*)\]\(\.\.\/\.\.\/assets\/([^)]+)\)/g)) {
        const src = assets[`/src/assets/${m[2]}`];
        if (!src) continue;
        body = body.replace(m[0], `![${m[1]}](#img-${images.length})`);
        images.push(await image(src, m[1]));
      }
      const gallery: number[] = [];
      for (const g of p.data.gallery) {
        gallery.push(images.length);
        images.push(await image(g.src, g.alt));
      }
      return {
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
        body,
        images,
        gallery,
      };
    }),
  );

  return Response.json({
    site,
    nav,
    principles,
    talks,
    about,
    proyectos,
    privacidad: rawContent(),
  } satisfies TuiData);
};
