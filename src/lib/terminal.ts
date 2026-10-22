/*
 * Terminal interactiva de la portada.
 * Todo lo que escribe el visitante se pinta con textContent: nunca HTML.
 */

import { enterTerminal } from './mode';

interface TerminalData {
  author: string;
  role: string;
  secondaryRole: string;
  location: string;
  email: string;
  whatsapp: string;
  socials: readonly { label: string; url: string }[];
  principles: readonly string[];
  talks: readonly {
    title: string;
    event: string;
    date: string;
    url?: string;
    linkLabel?: string;
  }[];
  proyectos: {
    id: string;
    title: string;
    summary: string;
    role: string;
    period: string;
    stack: string[];
  }[];
}

type Tone = 'accent' | 'muted' | 'dim' | 'fg';
type Part = string | { text: string; tone?: Tone; href?: string; external?: boolean };

const TONES: Record<Tone, string> = {
  accent: 'text-blue-400',
  muted: 'text-gray-400',
  dim: 'text-gray-500',
  fg: 'text-gray-50',
};
const LINK = 'text-blue-400 underline underline-offset-[3px] hover:text-blue-300';
const INDENT = '   ';

const PAGES: Record<string, string> = {
  inicio: '/',
  home: '/',
  '~': '/',
  proyectos: '/proyectos',
  'sobre-mi': '/sobre-mi',
  about: '/sobre-mi',
};

const COMMANDS = [
  'help',
  'whoami',
  'proyectos',
  'cat',
  'open',
  'principios',
  'charlas',
  'contacto',
  'history',
  'clear',
  'terminal',
] as const;

export function createTerminal(root: HTMLElement): void {
  const output = root.querySelector<HTMLElement>('[data-output]');
  const form = root.querySelector<HTMLFormElement>('[data-form]');
  const input = root.querySelector<HTMLInputElement>('[data-input]');
  const dataEl = root.querySelector<HTMLScriptElement>('[data-terminal-data]');
  if (!output || !form || !input || !dataEl) return;

  const data = JSON.parse(dataEl.textContent ?? '{}') as TerminalData;
  const projectIds = data.proyectos.map((p) => p.id);
  const socials = Object.fromEntries(data.socials.map((s) => [s.label.toLowerCase(), s.url]));
  const history: string[] = [];
  let cursor = -1;

  // Activar el modo interactivo
  root.querySelector('[data-static-cursor]')?.remove();
  root.querySelector('[data-hint]')?.removeAttribute('hidden');
  form.hidden = false;
  root.querySelector<HTMLElement>('[data-chips]')?.removeAttribute('hidden');

  // ── Salida ────────────────────────────────────────────────

  function print(...parts: Part[]): void {
    const line = document.createElement('span');
    line.className = 'text-gray-400';
    for (const part of parts) {
      if (typeof part === 'string') {
        line.append(part);
        continue;
      }
      const el = document.createElement(part.href ? 'a' : 'span');
      el.textContent = part.text;
      if (part.href && el instanceof HTMLAnchorElement) {
        el.href = part.href;
        el.className = LINK;
        if (part.external) {
          el.target = '_blank';
          el.rel = 'noopener noreferrer';
        }
      } else if (part.tone) {
        el.className = TONES[part.tone];
      }
      line.append(el);
    }
    output?.append(line);
  }

  function echo(command: string): void {
    const line = document.createElement('span');
    const prompt = document.createElement('span');
    prompt.className = TONES.accent;
    prompt.textContent = '$';
    line.append(prompt, `  ${command}`);
    output?.append(line);
  }

  function scrollToEnd(): void {
    if (output) output.scrollTop = output.scrollHeight;
  }

  function go(url: string, label: string, external = false): void {
    print(INDENT, { text: `Abriendo ${label}…`, tone: 'dim' });
    if (external) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.setTimeout(() => window.location.assign(url), 350);
    }
  }

  // ── Comandos ──────────────────────────────────────────────

  const run: Record<string, (args: string[]) => void> = {
    help() {
      const rows: [string, string][] = [
        ['whoami', 'quién soy'],
        ['proyectos', 'lista de proyectos'],
        ['cat <proyecto>', 'resumen de un proyecto'],
        ['open <destino>', 'abre un proyecto, página o red'],
        ['principios', 'cómo trabajo'],
        ['charlas', 'charlas y conferencias'],
        ['contacto', 'cómo escribirme'],
        ['history', 'comandos usados'],
        ['terminal', 'todo el sitio en modo terminal'],
        ['clear', 'limpia la pantalla'],
      ];
      for (const [cmd, desc] of rows) {
        print(INDENT, { text: cmd.padEnd(16, ' '), tone: 'fg' }, { text: desc, tone: 'dim' });
      }
      print(INDENT, { text: 'Tab autocompleta · ↑ ↓ historial', tone: 'dim' });
    },

    whoami() {
      print(INDENT, { text: data.author, tone: 'fg' });
      print(INDENT, data.role);
      print(INDENT, data.secondaryRole);
      print(INDENT, { text: data.location, tone: 'dim' });
    },

    proyectos() {
      const width = Math.max(...projectIds.map((id) => id.length)) + 2;
      for (const p of data.proyectos) {
        print(INDENT, { text: p.id, href: `/proyectos/${p.id}` }, ' '.repeat(width - p.id.length), {
          text: p.summary,
          tone: 'dim',
        });
      }
      print(INDENT, { text: 'Prueba: cat delosi', tone: 'dim' });
    },

    cat(args) {
      const target = (args[0] ?? '').replace(/\.md$/, '').replace(/^proyectos\//, '');
      if (!target) {
        print(INDENT, 'uso: cat <proyecto>');
        return;
      }
      if (target === 'principios') {
        run.principios([]);
        return;
      }
      const p = data.proyectos.find((x) => x.id === target);
      if (!p) {
        print(INDENT, `cat: ${target}: no existe. Escribe proyectos para ver la lista.`);
        return;
      }
      print(INDENT, { text: p.title, tone: 'fg' });
      print(INDENT, { text: `${p.role} · ${p.period}`, tone: 'dim' });
      print(INDENT, p.summary);
      print(INDENT, { text: p.stack.join(' · '), tone: 'dim' });
      print(INDENT, '→ ', { text: `open ${p.id}`, href: `/proyectos/${p.id}` });
    },

    open(args) {
      const target = (args[0] ?? '')
        .toLowerCase()
        .replace(/^\//, '')
        .replace(/^proyectos\//, '');
      if (!target) {
        print(INDENT, 'uso: open <proyecto | proyectos | sobre-mi | github | linkedin…>');
        return;
      }
      if (projectIds.includes(target)) {
        go(`/proyectos/${target}`, `proyectos/${target}`);
      } else if (target in PAGES) {
        go(PAGES[target], target);
      } else if (target in socials) {
        go(socials[target], target, true);
      } else {
        print(INDENT, `open: ${target}: no encontrado.`);
      }
    },

    principios() {
      for (const p of data.principles) {
        print(INDENT, { text: '✓', tone: 'dim' }, `  ${p}`);
      }
    },

    charlas() {
      for (const t of data.talks) {
        const date = new Intl.DateTimeFormat('es-PE', {
          month: 'long',
          year: 'numeric',
          timeZone: 'UTC',
        }).format(new Date(t.date));
        print(INDENT, { text: t.title, tone: 'fg' });
        print(
          INDENT,
          { text: `${t.event} · ${date}`, tone: 'dim' },
          ...(t.url
            ? [' · ', { text: t.linkLabel ?? 'Recursos', href: t.url, external: true }]
            : []),
        );
      }
    },

    contacto() {
      print(INDENT, 'email    ', { text: data.email, href: `mailto:${data.email}` });
      print(INDENT, 'whatsapp ', data.whatsapp);
    },

    history() {
      history.forEach((h, i) => {
        print(INDENT, { text: String(i + 1).padStart(3, ' '), tone: 'dim' }, `  ${h}`);
      });
    },

    clear() {
      output?.replaceChildren();
    },

    echo(args) {
      print(INDENT, args.join(' '));
    },

    pwd() {
      print(INDENT, '~/jenner.codes');
    },

    date() {
      print(
        INDENT,
        new Date().toLocaleString('es-PE', {
          timeZone: 'America/Lima',
          dateStyle: 'full',
          timeStyle: 'short',
        }),
      );
    },

    sudo() {
      print(INDENT, 'Permiso denegado. Pero puedes escribirme: contacto');
    },

    rm(args) {
      if (args.join(' ').includes('comentado')) {
        print(
          INDENT,
          { text: '✓', tone: 'accent' },
          '  Código comentado eliminado. El repo respira mejor.',
        );
      } else {
        print(INDENT, 'rm: aquí no se borra nada… salvo el código comentado.');
      }
    },

    terminal() {
      print(INDENT, { text: 'Abriendo ~/jenner.codes en modo terminal…', tone: 'dim' });
      window.setTimeout(() => enterTerminal(), 250);
    },

    exit() {
      print(INDENT, 'No hay salida. Mejor escribe contacto y hablamos.');
    },
  };

  const ALIASES: Record<string, string> = {
    ayuda: 'help',
    '?': 'help',
    ls: 'proyectos',
    proyecto: 'cat',
    cd: 'open',
    about: 'whoami',
    contact: 'contacto',
    cls: 'clear',
    tui: 'terminal',
    vim: 'terminal',
  };

  function execute(raw: string): void {
    const line = raw.trim();
    echo(line);
    if (!line) return;

    history.push(line);
    cursor = -1;

    const [first, ...args] = line.split(/\s+/);
    const name = ALIASES[first.toLowerCase()] ?? first.toLowerCase();
    const command = run[name];

    if (command) {
      command(args);
    } else {
      print(INDENT, `comando no encontrado: ${first}`);
      print(INDENT, { text: 'Escribe help para ver los comandos.', tone: 'dim' });
    }
    scrollToEnd();
  }

  // ── Autocompletado ────────────────────────────────────────

  function complete(): void {
    const value = input?.value ?? '';
    const [cmd, arg] = value.split(/\s+/, 2);
    const completingArg = value.includes(' ');
    const pool = completingArg
      ? cmd === 'open' || cmd === 'cd'
        ? [...projectIds, ...Object.keys(PAGES), ...Object.keys(socials)]
        : cmd === 'cat'
          ? [...projectIds, 'principios.md']
          : []
      : [...COMMANDS];
    const prefix = (completingArg ? arg : cmd) ?? '';
    const matches = pool.filter((c) => c.startsWith(prefix.toLowerCase()));

    if (matches.length === 1 && input) {
      input.value = completingArg ? `${cmd} ${matches[0]}` : `${matches[0]} `;
    } else if (matches.length > 1) {
      echo(value);
      print(INDENT, { text: matches.join('   '), tone: 'dim' });
      scrollToEnd();
    }
  }

  // ── Eventos ───────────────────────────────────────────────

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    execute(input.value);
    input.value = '';
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Tab' && input.value.trim()) {
      event.preventDefault();
      complete();
    } else if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault();
      cursor = cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1);
      input.value = history[cursor];
    } else if (event.key === 'ArrowDown' && cursor >= 0) {
      event.preventDefault();
      cursor = cursor + 1 < history.length ? cursor + 1 : -1;
      input.value = cursor < 0 ? '' : history[cursor];
    } else if (event.key === 'l' && event.ctrlKey) {
      event.preventDefault();
      run.clear([]);
    }
  });

  // Clic en la salida → foco en el prompt (sin robar una selección de texto ni un enlace)
  output.addEventListener('click', (event) => {
    if ((event.target as HTMLElement).closest('a')) return;
    if (window.getSelection()?.toString()) return;
    input.focus({ preventScroll: true });
  });

  for (const chip of root.querySelectorAll<HTMLButtonElement>('[data-chip]')) {
    chip.addEventListener('click', () => execute(chip.dataset.chip ?? ''));
  }
}
