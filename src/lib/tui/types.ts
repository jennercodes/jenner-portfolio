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
    /** Imágenes del texto y de la galería; el markdown las cita como #img-<índice> */
    images: TuiImage[];
    /** Índices de `images` que forman la galería */
    gallery: number[];
  }[];
  /** Markdown de /privacidad (src/data/privacidad.md) */
  privacidad: string;
}

/** Imagen ya optimizada en el build, lista para PhotoSwipe */
export interface TuiImage {
  src: string;
  /** Miniatura de 480 px para la vista previa al pasar el mouse */
  thumb: string;
  width: number;
  height: number;
  alt: string;
}

/** `pre`: texto que no se parte (diagramas en texto) */
export type Tone = 'fg' | 'muted' | 'dim' | 'accent' | 'strong' | 'code' | 'prop' | 'pre';

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
  /** Imágenes que citan sus enlaces img:<ruta>#<índice> */
  images?: TuiImage[];
}
