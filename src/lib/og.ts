/*
 * Imágenes para compartir (og:image) en build: satori dibuja el SVG, sharp lo pasa a PNG.
 * Estilo Blueprint: fondo casi negro, retícula de 32 px y brillo azul arriba.
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const font = (pkg: string, file: string) =>
  readFile(join(process.cwd(), 'node_modules/@fontsource', pkg, 'files', file));

let fonts: Promise<Parameters<typeof satori>[1]['fonts']> | undefined;

function loadFonts() {
  fonts ??= Promise.all([
    font('space-grotesk', 'space-grotesk-latin-400-normal.woff'),
    font('space-grotesk', 'space-grotesk-latin-600-normal.woff'),
    font('jetbrains-mono', 'jetbrains-mono-latin-400-normal.woff'),
  ]).then(([regular, semibold, mono]) => [
    { name: 'Space Grotesk', data: regular, weight: 400, style: 'normal' },
    { name: 'Space Grotesk', data: semibold, weight: 600, style: 'normal' },
    { name: 'JetBrains Mono', data: mono, weight: 400, style: 'normal' },
  ]);
  return fonts;
}

type Node = { type: string; props: Record<string, unknown> };

const h = (type: string, style: Record<string, unknown>, ...children: (Node | string)[]): Node => ({
  type,
  props: { style, children: children.length === 1 ? children[0] : children },
});

export type OgContent = {
  /** Línea mono en mayúsculas sobre el título */
  eyebrow: string;
  title: string;
  subtitle?: string;
};

export async function renderOg({ eyebrow, title, subtitle }: OgContent): Promise<Buffer> {
  const titleSize = title.length > 34 ? 64 : title.length > 22 ? 80 : 96;

  const tree = h(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '64px 72px',
      backgroundColor: '#09090b',
      backgroundImage:
        'radial-gradient(ellipse 70% 90% at 50% 0%, rgba(61,123,240,0.45) 0%, rgba(9,9,11,0) 75%), linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
      backgroundSize: '1200px 630px, 32px 32px, 32px 32px',
      color: '#fafafa',
      fontFamily: 'Space Grotesk',
    },
    h(
      'div',
      {
        display: 'flex',
        alignItems: 'baseline',
        fontSize: 34,
        fontWeight: 600,
        letterSpacing: '-0.02em',
      },
      'jenner',
      h('span', { fontFamily: 'JetBrains Mono', fontWeight: 400, color: '#5b9bff' }, '.codes'),
    ),
    h(
      'div',
      { display: 'flex', flexDirection: 'column', gap: 24 },
      h(
        'div',
        {
          fontFamily: 'JetBrains Mono',
          fontSize: 22,
          letterSpacing: '0.16em',
          color: '#a1a1aa',
          textTransform: 'uppercase',
        },
        eyebrow,
      ),
      h(
        'div',
        {
          fontSize: titleSize,
          fontWeight: 600,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          maxWidth: 1000,
        },
        title,
      ),
      ...(subtitle
        ? [h('div', { fontSize: 32, color: '#a1a1aa', lineHeight: 1.35, maxWidth: 940 }, subtitle)]
        : []),
    ),
    h(
      'div',
      {
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: 'JetBrains Mono',
        fontSize: 22,
        color: '#71717a',
      },
      'Jenner Acosta · Senior Frontend Engineer',
      'Lima, Perú',
    ),
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: await loadFonts(),
  });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
