import type { APIRoute, GetStaticPaths } from 'astro';
import { getOgPages, type OgPage, renderOgPage } from '../../lib/og-pages';

/** Una imagen por página (src/lib/og-pages.ts) */
export const getStaticPaths = (async () =>
  (await getOgPages()).map((page) => ({
    params: { slug: page.slug },
    props: page,
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgPage(props as OgPage);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
