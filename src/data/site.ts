export const site = {
  name: 'jenner.codes',
  url: 'https://jenner.codes',
  author: 'Jenner Acosta',
  fullName: 'C. Jenner Acosta Díaz',
  role: 'Senior Frontend Engineer @ Delosi',
  secondaryRole: 'Hostbox Founder',
  location: 'Lima, Perú',
  description:
    'Jenner Acosta, Senior Frontend Engineer en Delosi y fundador de Hostbox. E-commerce, plataformas multi-marca y webs para artistas desde Lima, Perú.',
  email: 'projects@jenner.codes',
  /** Usuario de WhatsApp (sin número público) */
  whatsapp: 'jenner.codes',
  socials: [
    { label: 'GitHub', url: 'https://github.com/jennercodes' },
    { label: 'LinkedIn', url: 'https://www.linkedin.com/in/cjenneracostadiaz' },
    { label: 'Instagram', url: 'https://www.instagram.com/jenner.codes' },
    { label: 'YouTube', url: 'https://www.youtube.com/@jenneracostadiaz' },
  ],
} as const;

export const nav = [
  { label: 'Proyectos', href: '/proyectos' },
  { label: 'Charlas', href: '/#charlas' },
  { label: 'Sobre mí', href: '/sobre-mi' },
] as const;

/** Principios con las palabras de Jenner (docs/identity/11-como-pienso.md) */
export const principles = [
  'Entender antes de hacer.',
  'UX primero; sin arquitectura no sirve.',
  'Cero código comentado en el repo.',
] as const;

export interface Talk {
  id: string;
  title: string;
  event: string;
  date: string;
  role: string;
  url?: string;
  linkLabel?: string;
}

/** De la más reciente a la más antigua */
export const talks: readonly Talk[] = [
  {
    id: 'github-community-day-2026',
    title: 'Del commit al deploy: flujos de trabajo modernos con GitHub y Claude',
    event: 'GitHub Community Day Perú',
    date: '2026-06-06',
    role: 'Speaker',
    url: '/charlas/del-commit-al-deploy.html',
    linkLabel: 'Slides',
  },
  {
    id: 'gdg-open-lima-2026',
    title: 'Cómo gestionar múltiples marcas sin perder la cabeza',
    event: 'GDG Open Lima',
    date: '2026-03-27',
    role: 'Speaker',
    url: 'https://github.com/jennercodes/frontend-architecture',
    linkLabel: 'Código de la demo',
  },
];

/** Sobre mí: lo usan la página y el modo terminal */
export const about = {
  paragraphs: [
    'Soy Jenner. Empecé enseñando tecnología en colegios de Ventanilla, después vinieron la comunicación audiovisual, el diseño, las primeras tiendas online y, poco a poco, el código. Hoy soy Senior Frontend Engineer en Delosi y sigo estudiando Ingeniería de Software.',
    'Creo que la mejor forma de aprender es practicando, malogrando y aprendiendo de ello. Y siempre entender antes de hacer. Me tomó un buen tiempo entender cómo funcionaban las librerías de UI de Airbnb, pero no aprendí cómo funcionan: aprendí cómo debo pensar antes de hacer algo. Desde entonces, pasar de un framework a otro, o del frontend al backend, se me hace mucho más sencillo.',
    'Los clientes tienen ideas grandes, y lo entiendo, pero al final siempre quieren soluciones simples y efectivas. Soy más feliz si pueden crecer con lo que construyo que enviándoles un presupuesto difícil de pagar por un software difícil de usar. Algunos crecieron tanto que se fueron con una agencia. Me dolió, pero hoy me alegra que lleguen a ese nivel.',
    'La vida fue dura y aprender es duro, pero todo eso es para tener un futuro tranquilo. Amo a mi familia, y por ellos trabajo como trabajo.',
  ],
  /* Trayectoria: docs/identity/02-trayectoria.md (LinkedIn) */
  trayectoria: [
    { periodo: '2025 — hoy', rol: 'Senior Frontend Engineer', lugar: 'Delosi' },
    { periodo: '2024 — 2025', rol: 'Frontend Engineer · Tech Lead', lugar: 'DB Target · Skolerom' },
    { periodo: '2022 — 2024', rol: 'WordPress Developer', lugar: 'DB Target · Skolerom' },
    { periodo: '2020 — hoy', rol: 'Hostbox Founder', lugar: 'Hostbox' },
    { periodo: '2019 — 2022', rol: 'Frontend Developer', lugar: 'Makkre · Finitrip' },
    { periodo: '2016 — 2020', rol: 'Diseño web y TIC', lugar: 'A&M Cars · RVG · Samishop' },
    { periodo: '2014 — 2015', rol: 'Docente de tecnología', lugar: 'Ventanilla, Callao' },
  ],
  formacion: [
    { periodo: '2022 — 2027', titulo: 'Ingeniería de Software', lugar: 'UTP' },
    { periodo: '2014 — 2018', titulo: 'Comunicación Audiovisual', lugar: 'Instituto SISE' },
    { periodo: '2011 — 2014', titulo: 'Técnico en Sistemas', lugar: 'Unicenter' },
  ],
} as const;
