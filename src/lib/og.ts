/*
 * Imágenes para compartir (og:image) en build: satori dibuja el SVG, sharp lo pasa a PNG.
 * Estilo Blueprint: fondo casi negro, retícula de 32 px y brillo azul arriba.
 * Con `image`, el texto ocupa la columna izquierda y la captura va a la derecha
 * en una ventana de navegador que sale por el borde.
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
  /** Ruta de una captura del proyecto (PNG/JPG/WebP) */
  image?: string;
};

const SHOT = { left: 640, top: 112, width: 640, height: 420, bar: 36 };

/** La captura recortada desde arriba, como data URI para satori */
async function shot(path: string): Promise<string> {
  const height = SHOT.height - SHOT.bar;
  const jpg = await sharp(path)
    .resize({ width: SHOT.width * 2, height: height * 2, fit: 'cover', position: 'top' })
    .jpeg({ quality: 82 })
    .toBuffer();
  return `data:image/jpeg;base64,${jpg.toString('base64')}`;
}

function browser(src: string): Node {
  const dot = (color: string) =>
    h('div', { width: 12, height: 12, borderRadius: 6, backgroundColor: color });
  return h(
    'div',
    {
      position: 'absolute',
      left: SHOT.left,
      top: SHOT.top,
      width: SHOT.width,
      height: SHOT.height,
      display: 'flex',
      flexDirection: 'column',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.14)',
      backgroundColor: '#18181b',
      boxShadow: '0 0 80px rgba(61,123,240,0.35)',
    },
    h(
      'div',
      {
        height: SHOT.bar,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingLeft: 16,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      },
      dot('#3f3f46'),
      dot('#3f3f46'),
      dot('#3f3f46'),
    ),
    {
      type: 'img',
      props: {
        src,
        width: SHOT.width,
        height: SHOT.height - SHOT.bar,
        style: { objectFit: 'cover' },
      },
    },
  );
}

export async function renderOg({ eyebrow, title, subtitle, image }: OgContent): Promise<Buffer> {
  const narrow = Boolean(image);
  const titleSize = narrow
    ? title.length > 14
      ? 60
      : 76
    : title.length > 34
      ? 64
      : title.length > 22
        ? 80
        : 96;
  const textWidth = narrow ? 520 : 1000;

  const tree = h(
    'div',
    {
      width: '100%',
      height: '100%',
      position: 'relative',
      // Sin esto el padding se suma al alto y el pie queda fuera de los 630 px
      boxSizing: 'border-box',
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
      { display: 'flex', flexDirection: 'column', gap: narrow ? 20 : 24, maxWidth: textWidth },
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
          maxWidth: textWidth,
        },
        title,
      ),
      ...(subtitle
        ? [
            h(
              'div',
              {
                fontSize: narrow ? 26 : 32,
                color: '#a1a1aa',
                lineHeight: 1.35,
                maxWidth: narrow ? textWidth : 940,
              },
              subtitle,
            ),
          ]
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
      // satori no dibuja dos textos sueltos en un contenedor flex: cada uno en su div
      h('div', {}, 'Jenner Acosta · Senior Frontend Engineer'),
      ...(narrow ? [] : [h('div', {}, 'Lima, Perú')]),
    ),
    ...(image ? [browser(await shot(image))] : []),
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: await loadFonts(),
  });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
