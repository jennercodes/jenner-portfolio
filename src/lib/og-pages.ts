/*
 * Las imágenes para compartir de cada página (og:image): las genera src/pages/og/[...slug].png.ts
 * y las enlaza Base.astro. La URL lleva un hash de la imagen (?v=), así cada cambio es una URL
 * nueva y ni Cloudflare ni las redes sociales muestran la versión anterior.
 */

import { createHash } from 'node:crypto';
import type { ImageMetadata } from 'astro';
import { site } from '../data/site';
import { type OgContent, renderOg } from './og';
import { formatPeriod, getProyectos } from './proyectos';

export type OgPage = { slug: string; og: OgContent };

/** Ruta en disco de una imagen del contenido (Astro la expone como `fsPath`, no enumerable) */
function fsPath(img: ImageMetadata | undefined): string | undefined {
  const path = (img as (ImageMetadata & { fsPath?: string }) | undefined)?.fsPath;
  return typeof path === 'string' ? path : undefined;
}

/** Una imagen por página: /og/index.png, /og/proyectos.png, /og/proyectos/<id>.png… */
export async function getOgPages(): Promise<OgPage[]> {
  const proyectos = await getProyectos();
  const pages: OgPage[] = [
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
    {
      slug: 'privacidad',
      og: {
        eyebrow: 'Datos y cookies',
        title: 'Privacidad',
        subtitle: 'Analítica solo si aceptas. Sin formularios, cuentas ni publicidad.',
      },
    },
    ...proyectos.map((p) => ({
      slug: `proyectos/${p.id}`,
      og: {
        eyebrow: `Caso de estudio · ${formatPeriod(p.data)}`,
        title: p.data.title,
        subtitle: p.data.summary,
        image: fsPath(p.data.cover ?? p.data.gallery[0]?.src),
      },
    })),
  ];
  return pages;
}

// Cada imagen se dibuja una sola vez por build: la usan la ruta (el PNG) y Base (el hash)
const rendered = new Map<string, Promise<Buffer>>();

export function renderOgPage(page: OgPage): Promise<Buffer> {
  let png = rendered.get(page.slug);
  if (!png) {
    png = renderOg(page.og);
    rendered.set(page.slug, png);
  }
  return png;
}

/** Hash corto del PNG para la URL (?v=). En dev no se calcula: cada página la redibujaría */
export async function ogVersion(slug: string): Promise<string | undefined> {
  if (import.meta.env.DEV) return undefined;
  const page = (await getOgPages()).find((p) => p.slug === slug);
  if (!page) return undefined;
  const png = await renderOgPage(page);
  return createHash('sha256').update(png).digest('hex').slice(0, 10);
}
