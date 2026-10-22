import type { about, nav, principles, site, talks } from '../../data/site';

/** Lo que sirve /tui.json (src/pages/tui.json.ts) */
export interface TuiData {
  site: typeof site;
  nav: typeof nav;
  principles: typeof principles;
  talks: typeof talks;
  about: typeof about;
  proyectos: {
    id: string;
    title: string;
    role: string;
    client?: string;
    period: string;
    summary: string;
    stack: string[];
    featured: boolean;
    personal: boolean;
    url?: string;
    body: string;
  }[];
}

export type Tone = 'fg' | 'muted' | 'dim' | 'accent' | 'strong' | 'code' | 'prop';

export interface Token {
  text: string;
  tone?: Tone;
  bold?: boolean;
  /** Ruta de un archivo (interno), page:/url (sale al modo normal) o URL absoluta (externo) */
  href?: string;
}

export type Line = Token[];

/** Un "archivo" del sitio: se abre con @ruta o con los comandos */
export interface Doc {
  /** README.md, proyectos/delosi.md, sobre-mi.md… */
  path: string;
  /** Página real equivalente, a donde lleva /exit */
  url: string;
  lines: Line[];
}
