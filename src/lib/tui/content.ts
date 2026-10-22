/*
 * El contenido del sitio como archivos markdown para el modo terminal.
 * Pasan por el mismo tokenizador que los casos de estudio.
 */

import { parseMarkdown } from './markdown';
import type { Doc, Line, TuiData } from './types';

export type Proyecto = TuiData['proyectos'][number];

export const HOME = 'README.md';

/** Minúsculas y sin tildes, para comparar lo que escribe el visitante */
export function normalize(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function readme(data: TuiData): string {
  const { site, principles, proyectos } = data;
  return [
    `# ${site.author}`,
    '',
    `${site.role} · ${site.secondaryRole}`,
    `\`${site.location}\``,
    '',
    '## Principios',
    '',
    ...principles.map((p) => `- ${p}`),
    '',
    '## Trabajo seleccionado',
    '',
    ...proyectos
      .filter((p) => p.featured)
      .map((p) => `- [${p.title}](proyectos/${p.id}.md) — ${p.summary}`),
  ].join('\n');
}

function proyecto(p: Proyecto): string {
  const meta = [
    '---',
    `title: ${p.title}`,
    `role: ${p.role}`,
    p.client && `client: ${p.client}`,
    `period: ${p.period}`,
    `stack: [${p.stack.join(', ')}]`,
    p.url && `url: [${p.url.replace(/^https?:\/\//, '')}](${p.url})`,
    p.personal && 'personal: true',
    '---',
  ].filter(Boolean);
  return [...meta, '', `# ${p.title}`, '', `> ${p.summary}`, '', p.body.trim()].join('\n');
}

function sobreMi(data: TuiData): string {
  const { about } = data;
  return [
    '# Sobre mí',
    '',
    ...about.paragraphs.flatMap((p) => [p, '']),
    '## Trayectoria',
    '',
    ...about.trayectoria.map((t) => `- \`${t.periodo}\` **${t.rol}** · ${t.lugar}`),
    '',
    '## Formación',
    '',
    ...about.formacion.map((f) => `- \`${f.periodo}\` **${f.titulo}** · ${f.lugar}`),
  ].join('\n');
}

function charlas(data: TuiData): string {
  const fmt = new Intl.DateTimeFormat('es-PE', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  return [
    '# Charlas',
    '',
    ...data.talks.flatMap((t) => [
      `## ${t.title}`,
      '',
      `- \`${t.event} · ${fmt.format(new Date(t.date))}\``,
      `- ${t.role}`,
      `- [${t.linkLabel}](${t.url})`,
      '',
    ]),
  ].join('\n');
}

function contacto(data: TuiData): string {
  const { site } = data;
  return [
    '# Contacto',
    '',
    '¿Tienes un proyecto en mente? Cuéntame la idea, por grande que sea.',
    '',
    `- email     [${site.email}](mailto:${site.email})`,
    `- whatsapp  \`${site.whatsapp}\``,
    ...site.socials.map(
      (s) =>
        `- ${s.label.toLowerCase().padEnd(9, ' ')} [${s.url.replace(/^https?:\/\/(www\.)?/, '')}](${s.url})`,
    ),
  ].join('\n');
}

export function createDocs(data: TuiData): Map<string, Doc> {
  const docs = new Map<string, Doc>();
  const add = (path: string, url: string, markdown: string) =>
    docs.set(path, { path, url, lines: parseMarkdown(markdown) });

  add(HOME, '/', readme(data));
  for (const p of data.proyectos) add(`proyectos/${p.id}.md`, `/proyectos/${p.id}`, proyecto(p));
  add('sobre-mi.md', '/sobre-mi', sobreMi(data));
  add('charlas.md', '/#charlas', charlas(data));
  add('contacto.md', '/#contacto', contacto(data));
  return docs;
}

/** Archivo que corresponde a una URL del sitio (al entrar al modo terminal) */
export function docForUrl(docs: Map<string, Doc>, url: string): Doc | undefined {
  const clean = url.replace(/\.html$/, '').replace(/(.)\/$/, '$1');
  for (const doc of docs.values()) if (doc.url === clean) return doc;
  return undefined;
}

/** Acepta "delosi", "delosi.md", "proyectos/delosi", "./sobre-mi"… */
export function resolveDoc(docs: Map<string, Doc>, input: string): Doc | undefined {
  const p = input
    .trim()
    .replace(/^@/, '')
    .replace(/^~\/?(jenner\.codes\/?)?/, '')
    .replace(/^\.?\//, '');
  return [p, `${p}.md`, `proyectos/${p}`, `proyectos/${p}.md`]
    .map((c) => docs.get(c))
    .find(Boolean);
}

/** Lista de proyectos como respuesta: título enlazado, periodo y resumen */
export function projectList(proyectos: Proyecto[]): Line[] {
  const width = Math.max(...proyectos.map((p) => p.title.length)) + 3;
  return proyectos.map((p) => [
    { text: p.title, href: `proyectos/${p.id}.md` },
    { text: ' '.repeat(width - p.title.length) },
    { text: p.period.padEnd(13, ' '), tone: 'dim' },
    { text: p.summary, tone: 'muted' },
  ]);
}
