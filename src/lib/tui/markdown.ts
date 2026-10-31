/*
 * Tokenizador mínimo de markdown para la TUI: lo justo para los casos y los buffers.
 * Encabezados, listas, citas, frontmatter, bloques de código, imágenes, figuras, **negrita**,
 * `código` y [enlaces](url). Los marcadores (**, `, ```, []()) no se muestran.
 */

import type { Line, Token } from './types';

const INLINE = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

function inline(text: string, base: Omit<Token, 'text'> = {}): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const index = m.index ?? 0;
    if (index > last) tokens.push({ ...base, text: text.slice(last, index) });
    // La negrita puede envolver un enlace: **[texto](url)**
    if (m[1] !== undefined) tokens.push(...inline(m[1], { ...base, tone: 'fg', bold: true }));
    else if (m[2] !== undefined) tokens.push({ ...base, text: m[2], tone: 'code' });
    else tokens.push({ text: m[3], href: m[4] });
    last = index + m[0].length;
  }
  if (last < text.length) tokens.push({ ...base, text: text.slice(last) });
  return tokens;
}

/** `path`: el archivo, para que las imágenes (#img-N) enlacen a img:<path>#N */
export function parseMarkdown(source: string, path = ''): Line[] {
  const lines: Line[] = [];
  const raw = source.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
  let inFrontmatter = raw[0] === '---';
  let inFence = false;
  let inFigure = false;
  let inAscii = false;

  raw.forEach((text, i) => {
    if (inFrontmatter) {
      if (text === '---') {
        lines.push([{ text, tone: 'dim' }]);
        if (i > 0) inFrontmatter = false;
        return;
      }
      const colon = text.indexOf(':');
      lines.push(
        colon > 0
          ? [
              { text: text.slice(0, colon), tone: 'prop' },
              { text: ':', tone: 'dim' },
              ...inline(text.slice(colon + 1), { tone: 'muted' }),
            ]
          : [{ text, tone: 'muted' }],
      );
      return;
    }

    // Figura en HTML (diagramas): la terminal muestra su pie y la versión en texto
    // que viene dentro de un comentario <!--tui … --> (invisible en la web)
    if (text.startsWith('<figure')) inFigure = true;
    if (inFigure) {
      if (inAscii) {
        if (text.startsWith('-->')) inAscii = false;
        else lines.push([{ text, tone: 'pre' }]);
        return;
      }
      if (text.startsWith('<!--tui')) {
        inAscii = true;
        return;
      }
      const caption = text.match(/<figcaption>(.*)<\/figcaption>/);
      if (caption) lines.push([{ text: `◇ ${caption[1]}`, tone: 'fg', bold: true }], []);
      if (text.startsWith('</figure>')) inFigure = false;
      return;
    }

    if (text.startsWith('```')) {
      inFence = !inFence;
      return;
    }
    if (inFence) {
      lines.push([{ text: `  ${text}`, tone: 'code' }]);
      return;
    }

    // Una imagen sola en su línea: enlace que la abre en el visor (img:<archivo>#<índice>)
    const image = text.match(/^!\[([^\]]*)\]\(([^)]*)\)$/);
    if (image) {
      const index = image[2].match(/^#img-(\d+)$/)?.[1];
      lines.push(
        index !== undefined && path
          ? [
              { text: '▣ ', tone: 'accent' },
              { text: image[1], href: `img:${path}#${index}` },
            ]
          : [{ text: `▣ ${image[1]}`, tone: 'dim' }],
      );
      return;
    }

    const heading = text.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      lines.push([
        { text: `${heading[1]} `, tone: 'accent' },
        ...inline(heading[2], { tone: heading[1].length === 1 ? 'strong' : 'fg', bold: true }),
      ]);
      return;
    }

    const item = text.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (item) {
      lines.push([
        { text: `${item[1]}${item[2]} `, tone: 'accent' },
        ...inline(item[3], { tone: 'muted' }),
      ]);
      return;
    }

    if (text.startsWith('>')) {
      lines.push([
        { text: '│ ', tone: 'accent' },
        ...inline(text.replace(/^>\s?/, ''), { tone: 'dim' }),
      ]);
      return;
    }

    if (text.startsWith('"')) {
      lines.push([{ text, tone: 'dim' }]);
      return;
    }

    lines.push(text ? inline(text, { tone: 'muted' }) : []);
  });

  return lines;
}
