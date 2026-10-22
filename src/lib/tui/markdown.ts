/*
 * Tokenizador mínimo de markdown para la TUI: lo justo para los casos y los buffers.
 * Encabezados, listas, citas, frontmatter, **negrita**, `código` y [enlaces](url).
 * Los marcadores (**, `, []()) no se muestran.
 */

import type { Line, Token } from './types';

const INLINE = /\*\*(.+?)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

function inline(text: string, base: Omit<Token, 'text'> = {}): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  for (const m of text.matchAll(INLINE)) {
    const index = m.index ?? 0;
    if (index > last) tokens.push({ ...base, text: text.slice(last, index) });
    if (m[1] !== undefined) tokens.push({ ...base, text: m[1], tone: 'fg', bold: true });
    else if (m[2] !== undefined) tokens.push({ ...base, text: m[2], tone: 'code' });
    else tokens.push({ text: m[3], href: m[4] });
    last = index + m[0].length;
  }
  if (last < text.length) tokens.push({ ...base, text: text.slice(last) });
  return tokens;
}

export function parseMarkdown(source: string): Line[] {
  const lines: Line[] = [];
  const raw = source.replace(/\r\n/g, '\n').replace(/\n+$/, '').split('\n');
  let inFrontmatter = raw[0] === '---';

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
