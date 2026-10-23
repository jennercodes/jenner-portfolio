/*
 * Modo terminal estilo agente de código: una conversación con comandos /,
 * archivos @ y preguntas en texto libre. No hay IA: las preguntas se
 * resuelven con palabras clave sobre el contenido del sitio.
 */

import {
  createDocs,
  docForUrl,
  HOME,
  normalize,
  type Proyecto,
  projectList,
  resolveDoc,
} from './content';
import { el, type HrefFor, isExternal, renderLine, type Shell } from './render';
import type { Doc, Line, TuiData } from './types';

type Block =
  | { kind: 'text'; lines: Line[] }
  | { kind: 'read'; doc: Doc }
  | { kind: 'error'; text: string };

interface Reply {
  /** Verbo del spinner mientras "piensa" */
  verb: string;
  blocks: Block[];
}

interface Command {
  name: string;
  args?: string;
  desc: string;
  run: (arg: string) => Reply;
}

interface Item {
  label: string;
  desc: string;
  /** Texto que queda en el input al elegirlo */
  value: string;
  /** Se envía al elegirlo con Enter o clic */
  submit: boolean;
}

export interface ChatOptions {
  shell: Shell;
  data: TuiData;
  reduced: boolean;
  /** Animación de entrada de cada bloque nuevo */
  animate: (node: HTMLElement) => void;
  onQuit: (url: string) => void;
}

const GLYPHS = ['·', '✢', '✳', '✶', '✻', '✽'];

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hasWord = (q: string, key: string) =>
  new RegExp(`(^|[^a-z0-9])${escapeRe(key)}([^a-z0-9]|$)`).test(q);

/** Una línea con un comando clicable y su descripción */
const cmdLine = (cmd: string, desc: string, width = 22): Line => [
  { text: cmd, href: `cmd:${cmd}` },
  { text: ' '.repeat(Math.max(2, width - cmd.length)) },
  { text: desc, tone: 'dim' },
];

export function createChat({ shell, data, reduced, animate, onQuit }: ChatOptions) {
  const { log, input, menu, form } = shell;
  const docs = createDocs(data);
  const history: string[] = [];
  let historyIndex = -1;
  let items: Item[] = [];
  let selected = 0;
  let menuDismissed = false;
  let busy = false;
  let lastUrl = window.location.pathname.replace(/\.html$/, '') + window.location.hash;

  // ── Índices para entender preguntas ─────────────────────

  const STOP = new Set(['visual', 'tool', 'los', 'las', 'online', 'music']);
  /** Nombres que no están en el título del proyecto */
  const PROJECT_ALIASES: Record<string, string[]> = {
    rockass: ['rabanes', 'mirlos', 'chicas dulces', 'rom label'],
    profix: ['phonetool', 'phone tool'],
  };
  const projectKeys = data.proyectos.map((p) => ({
    p,
    keys: [
      ...(PROJECT_ALIASES[p.id] ?? []),
      ...p.id.split('-'),
      ...normalize(p.title)
        .split(/[^a-z0-9]+/)
        .filter((w) => w.length > 3),
    ].filter((k) => !STOP.has(k)),
  }));

  const stack = [...new Set(data.proyectos.flatMap((p) => p.stack))].sort((a, b) =>
    a.localeCompare(b),
  );
  const stackKeys = stack.map((item) => {
    const n = normalize(item);
    const first = n.split(/[\s.]/)[0];
    const useFirst = first.length > 3 && !['github', 'google'].includes(first);
    return { item, keys: [n, n.replace(/\./g, ''), ...(useFirst ? [first] : [])] };
  });

  const usesStack = (p: Proyecto, item: string) =>
    p.stack.some((s) => normalize(s) === normalize(item));

  // ── Respuestas ──────────────────────────────────────────

  const text = (verb: string, ...lines: Line[]): Reply => ({
    verb,
    blocks: [{ kind: 'text', lines }],
  });
  const read = (doc: Doc): Reply => ({ verb: 'Leyendo', blocks: [{ kind: 'read', doc }] });
  const error = (message: string, ...lines: Line[]): Reply => ({
    verb: 'Pensando',
    blocks: [
      { kind: 'error', text: message },
      ...(lines.length ? [{ kind: 'text' as const, lines }] : []),
    ],
  });
  const doc = (path: string) => docs.get(path) ?? (docs.get(HOME) as Doc);

  function listProjects(list: Proyecto[], title: string): Reply {
    return text(
      'Buscando',
      [{ text: title, tone: 'fg' }],
      [],
      ...projectList(list),
      [],
      [{ text: 'Clic en un proyecto para leerlo, o escribe @ y su nombre.', tone: 'dim' }],
    );
  }

  function byStack(arg: string): Reply {
    if (!arg) {
      return text(
        'Buscando',
        [{ text: 'Stack usado en los proyectos', tone: 'fg' }],
        [],
        ...stack.map((item) => {
          const n = data.proyectos.filter((p) => usesStack(p, item)).length;
          return [
            { text: item, href: `cmd:/stack ${item}` },
            { text: ` ${'·'.repeat(Math.max(2, 26 - item.length))} ${n}`, tone: 'dim' as const },
          ];
        }),
      );
    }
    const found = stackKeys.find(
      ({ item, keys }) => normalize(item) === normalize(arg) || keys.includes(normalize(arg)),
    );
    if (!found) {
      return error(`No hay proyectos con «${arg}».`, [
        { text: 'Prueba ', tone: 'dim' },
        { text: '/stack', href: 'cmd:/stack' },
        { text: ' para ver todo el stack.', tone: 'dim' },
      ]);
    }
    const list = data.proyectos.filter((p) => usesStack(p, found.item));
    return listProjects(
      list,
      `${list.length} ${list.length === 1 ? 'proyecto usa' : 'proyectos usan'} ${found.item}`,
    );
  }

  const COMMANDS: Command[] = [
    {
      name: 'help',
      desc: 'qué se puede hacer aquí',
      run: () =>
        text(
          'Pensando',
          [{ text: 'Comandos', tone: 'fg' }],
          [],
          ...COMMANDS.filter((c) => c.name !== 'help').map((c) =>
            cmdLine(`/${c.name}${c.args ? ` ${c.args}` : ''}`, c.desc),
          ),
          [],
          [{ text: 'También', tone: 'fg' }],
          [],
          [
            { text: '@archivo', tone: 'code' },
            { text: '              abre un archivo: ', tone: 'dim' },
            { text: '@proyectos/hostbox.md', href: 'cmd:@proyectos/hostbox.md' },
          ],
          [
            { text: 'texto libre', tone: 'code' },
            { text: '           ', tone: 'dim' },
            { text: '¿qué proyectos usan Next.js?', href: 'cmd:¿qué proyectos usan Next.js?' },
          ],
          [],
          [
            {
              text: 'Sin IA: entiende comandos y palabras clave sobre el contenido del sitio.',
              tone: 'dim',
            },
          ],
        ),
    },
    {
      name: 'proyectos',
      desc: 'todos los proyectos',
      run: () => listProjects(data.proyectos, `${data.proyectos.length} proyectos`),
    },
    {
      name: 'proyecto',
      args: '<nombre>',
      desc: 'lee un caso de estudio',
      run: (arg) => {
        const found = arg && resolveDoc(docs, `proyectos/${normalize(arg)}`);
        if (found) return read(found);
        return arg
          ? error(`No existe el proyecto «${arg}».`, ...projectList(data.proyectos))
          : listProjects(data.proyectos, 'Elige un proyecto');
      },
    },
    { name: 'stack', args: '[tecnología]', desc: 'proyectos por tecnología', run: byStack },
    { name: 'sobre-mi', desc: 'historia y trayectoria', run: () => read(doc('sobre-mi.md')) },
    { name: 'charlas', desc: 'charlas y conferencias', run: () => read(doc('charlas.md')) },
    { name: 'contacto', desc: 'email, WhatsApp y redes', run: () => read(doc('contacto.md')) },
    {
      name: 'principios',
      desc: 'cómo se trabaja',
      run: () =>
        text(
          'Pensando',
          ...data.principles.map((p): Line => [{ text: '✓  ', tone: 'accent' }, { text: p }]),
        ),
    },
    { name: 'readme', desc: 'resumen del sitio', run: () => read(doc(HOME)) },
    { name: 'clear', desc: 'limpia la conversación', run: () => ({ verb: '', blocks: [] }) },
    { name: 'exit', desc: 'vuelve al modo normal', run: () => ({ verb: '', blocks: [] }) },
  ];

  const ALIASES: Record<string, string> = {
    ayuda: 'help',
    '?': 'help',
    projects: 'proyectos',
    ls: 'proyectos',
    about: 'sobre-mi',
    whoami: 'sobre-mi',
    contact: 'contacto',
    talks: 'charlas',
    cls: 'clear',
    salir: 'exit',
    quit: 'exit',
    q: 'exit',
  };

  function runCommand(name: string, arg = ''): Reply {
    const command = COMMANDS.find((c) => c.name === name);
    return command ? command.run(arg) : error(`Comando desconocido: /${name}`);
  }

  function answer(raw: string): Reply {
    const q = normalize(raw)
      .replace(/[¿?¡!,;:]/g, ' ')
      .trim();
    const qDots = q.replace(/\./g, '');

    const project = projectKeys.find(({ keys }) => keys.some((k) => hasWord(q, k)));
    if (project) return read(doc(`proyectos/${project.p.id}.md`));

    const tech = stackKeys.find(({ keys }) => keys.some((k) => hasWord(q, k) || hasWord(qDots, k)));
    if (tech) return byStack(tech.item);

    const intents: [RegExp, () => Reply][] = [
      [
        /^(hola|buenas|hey|hi|hello|que tal|saludos)/,
        () =>
          text(
            'Pensando',
            [{ text: 'Hola. Aquí está todo jenner.codes en modo terminal.' }],
            [],
            cmdLine('/proyectos', 'empezar por el trabajo'),
            cmdLine('/sobre-mi', 'la historia'),
            cmdLine('/contacto', 'escribir directamente'),
          ),
      ],
      [
        /gracias|thanks/,
        () =>
          text('Pensando', [
            { text: 'De nada. ' },
            { text: '/contacto', href: 'cmd:/contacto' },
            { text: ' para seguir la conversación.', tone: 'dim' },
          ]),
      ],
      [
        /contact|email|correo|mail|whatsapp|escrib|contrat|hablar|presupuesto|cotiz|cobr|precio|costo|tarifa|llamar|redes|github|linkedin|instagram|youtube/,
        () => read(doc('contacto.md')),
      ],
      [/charla|conferencia|talk|speaker|ponencia|evento|gdg/, () => read(doc('charlas.md'))],
      [
        /principio|como trabaja|forma de trabajar|filosofia|valores|metodo/,
        () => runCommand('principios'),
      ],
      [/stack|tecnolog|herramienta|lenguaje|framework/, () => byStack('')],
      [
        /quien|sobre ti|sobre el|sobre mi|historia|experiencia|trayectoria|estudi|formacion|carrera|about|edad|donde/,
        () => read(doc('sobre-mi.md')),
      ],
      [
        /proyecto|trabajo|portafolio|portfolio|cliente|hecho|caso/,
        () => listProjects(data.proyectos, `${data.proyectos.length} proyectos`),
      ],
      [/ayuda|help|como funciona|que puedo|comandos/, () => runCommand('help')],
    ];
    for (const [re, reply] of intents) if (re.test(q)) return reply();

    return error(
      'No hay una respuesta para eso. Este modo entiende comandos y palabras clave, sin IA.',
      [{ text: 'Prueba con:', tone: 'dim' }],
      cmdLine('/proyectos', 'todos los proyectos'),
      cmdLine('/stack', 'proyectos por tecnología'),
      cmdLine('/contacto', 'cómo escribir'),
      cmdLine('/help', 'todo lo demás'),
    );
  }

  function route(raw: string): Reply | 'clear' | 'exit' {
    if (raw.startsWith('/')) {
      const [name = '', ...rest] = raw.slice(1).split(/\s+/);
      const key = ALIASES[name.toLowerCase()] ?? name.toLowerCase();
      if (key === 'clear') return 'clear';
      if (key === 'exit') return 'exit';
      const command = COMMANDS.find((c) => c.name === key);
      if (command) return command.run(rest.join(' '));
      return error(`Comando desconocido: /${name}`, [
        { text: 'Escribe ', tone: 'dim' },
        { text: '/', tone: 'code' },
        { text: ' para ver la lista, o ', tone: 'dim' },
        { text: '/help', href: 'cmd:/help' },
      ]);
    }
    if (raw.startsWith('@')) {
      const found = resolveDoc(docs, raw.split(/\s+/)[0]);
      return found ? read(found) : error(`No existe el archivo ${raw.split(/\s+/)[0]}`);
    }
    return answer(raw);
  }

  // ── Render ──────────────────────────────────────────────

  const hrefFor: HrefFor = (href) => {
    if (href.startsWith('cmd:')) return '#';
    if (href.startsWith('page:')) return href.slice(5);
    if (isExternal(href)) return href;
    return docs.get(href)?.url ?? '#';
  };

  function lines(list: Line[], className: string): HTMLElement {
    const box = el('div', className);
    for (const line of list) box.append(renderLine(line, hrefFor));
    return box;
  }

  function renderBlock(block: Block): HTMLElement {
    const node = el('div', 'tui-block');
    const dot = el('span', 'tui-dot', '⏺');
    dot.setAttribute('aria-hidden', 'true');

    if (block.kind === 'error') {
      node.classList.add('tui-block-error');
      node.append(dot, lines([[{ text: block.text }]], 'tui-body'));
      return node;
    }

    if (block.kind === 'text') {
      node.append(dot, lines(block.lines, 'tui-body'));
      return node;
    }

    const { doc } = block;
    const body = el('div', 'tui-body');
    body.append(
      renderLine(
        [
          { text: 'Read', tone: 'fg', bold: true },
          { text: '(' },
          { text: doc.path, tone: 'fg' },
          { text: ')' },
        ],
        hrefFor,
      ),
      renderLine(
        [
          { text: '⎿  ', tone: 'dim' },
          { text: `${doc.lines.length} líneas`, tone: 'dim' },
        ],
        hrefFor,
      ),
      lines(doc.lines, 'tui-file'),
      renderLine(
        [
          { text: '→ ', tone: 'dim' },
          { text: `ver ${doc.url} en modo normal`, href: `page:${doc.url}` },
        ],
        hrefFor,
      ),
    );
    node.append(dot, body);
    return node;
  }

  function welcome(): void {
    const box = el('div', 'tui-welcome');
    const title = el('div', 'tui-welcome-title');
    title.append(
      el('span', 'tui-accent', '✻ '),
      'Bienvenido a ',
      el('span', 'tui-fg tui-bold', 'jenner.codes'),
    );
    box.append(
      title,
      lines(
        [
          [
            { text: '/help', href: 'cmd:/help' },
            { text: ' para ver los comandos', tone: 'dim' },
          ],
          [],
          [{ text: `cwd: ~/jenner.codes · ${data.site.role}`, tone: 'dim' }],
        ],
        'tui-welcome-body',
      ),
    );

    const tips = lines(
      [
        [{ text: 'Para empezar:', tone: 'muted' }],
        [],
        [
          { text: '1. Escribe ', tone: 'dim' },
          { text: '/', tone: 'code' },
          { text: ' para ver los comandos', tone: 'dim' },
        ],
        [
          { text: '2. Escribe ', tone: 'dim' },
          { text: '@', tone: 'code' },
          { text: ' para abrir un archivo', tone: 'dim' },
        ],
        [
          { text: '3. Pregunta, por ejemplo: ', tone: 'dim' },
          { text: '¿qué proyectos usan Next.js?', href: 'cmd:¿qué proyectos usan Next.js?' },
        ],
        [
          { text: '4. ', tone: 'dim' },
          { text: '/exit', href: 'cmd:/exit' },
          { text: ' vuelve al modo normal', tone: 'dim' },
        ],
      ],
      'tui-tips',
    );
    log.append(box, tips);
    animate(box);
    animate(tips);
  }

  function scrollTo(node: HTMLElement): void {
    const max = log.scrollHeight - log.clientHeight;
    log.scrollTop = Math.min(node.offsetTop - 16, max);
  }

  async function think(verb: string): Promise<void> {
    if (reduced || !verb) return;
    const node = el('div', 'tui-spinner');
    const glyph = el('span', 'tui-accent', GLYPHS[0]);
    node.append(glyph, ` ${verb}…`);
    log.append(node);
    log.scrollTop = log.scrollHeight;
    let i = 0;
    const timer = window.setInterval(() => {
      i = (i + 1) % GLYPHS.length;
      glyph.textContent = GLYPHS[i];
    }, 110);
    await new Promise((r) => window.setTimeout(r, 380 + Math.random() * 320));
    window.clearInterval(timer);
    node.remove();
  }

  async function submit(raw: string): Promise<void> {
    const value = raw.trim();
    if (!value || busy) return;
    busy = true;
    history.push(value);
    historyIndex = -1;
    input.value = '';
    closeMenu();

    const result = route(value);
    if (result === 'exit') {
      onQuit(lastUrl);
      return;
    }
    if (result === 'clear') {
      log.replaceChildren();
      welcome();
      busy = false;
      return;
    }

    const echo = el('div', 'tui-user');
    echo.append(el('span', 'tui-caret', '>'), ` ${value}`);
    log.append(echo);
    log.scrollTop = log.scrollHeight;

    await think(result.verb);
    for (const block of result.blocks) {
      const node = renderBlock(block);
      log.append(node);
      animate(node);
      if (block.kind === 'read') {
        lastUrl = block.doc.url;
        window.history.replaceState(window.history.state, '', block.doc.url);
      }
    }
    scrollTo(echo);
    busy = false;
    input.focus({ preventScroll: true });
  }

  // ── Menú de / y @ ───────────────────────────────────────

  function suggestions(value: string): Item[] {
    const at = value.match(/(^|\s)@(\S*)$/);
    if (at) {
      const term = normalize(at[2]);
      const head = value.slice(0, value.length - at[2].length - 1);
      const onlyFile = !value.slice(0, at.index).trim();
      return [...docs.values()]
        .filter((d) => normalize(d.path).includes(term))
        .map((d) => ({
          label: `@${d.path}`,
          desc: `${d.lines.length} líneas`,
          value: `${head}@${d.path}${onlyFile ? '' : ' '}`,
          submit: onlyFile,
        }));
    }

    if (!value.startsWith('/')) return [];
    const space = value.indexOf(' ');
    if (space < 0) {
      const term = value.slice(1).toLowerCase();
      const starts = COMMANDS.filter((c) => c.name.startsWith(term));
      const contains = COMMANDS.filter((c) => !c.name.startsWith(term) && c.name.includes(term));
      return [...starts, ...contains].map((c) => ({
        label: `/${c.name}${c.args ? ` ${c.args}` : ''}`,
        desc: c.desc,
        value: c.args ? `/${c.name} ` : `/${c.name}`,
        submit: !c.args || c.args.startsWith('['),
      }));
    }

    const name = value.slice(1, space).toLowerCase();
    const term = normalize(value.slice(space + 1));
    if (name === 'proyecto') {
      return data.proyectos
        .filter((p) => p.id.includes(term) || normalize(p.title).includes(term))
        .map((p) => ({ label: p.id, desc: p.summary, value: `/proyecto ${p.id}`, submit: true }));
    }
    if (name === 'stack') {
      return stack
        .filter((s) => normalize(s).includes(term))
        .map((s) => ({
          label: s,
          desc: `${data.proyectos.filter((p) => usesStack(p, s)).length} proyectos`,
          value: `/stack ${s}`,
          submit: true,
        }));
    }
    return [];
  }

  function renderMenu(): void {
    menu.replaceChildren();
    items.forEach((item, i) => {
      const li = el('li', 'tui-option');
      li.id = `tui-option-${i}`;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === selected));
      li.append(
        el('span', 'tui-option-label', item.label),
        el('span', 'tui-option-desc', item.desc),
      );
      li.addEventListener('mousedown', (event) => {
        event.preventDefault();
        accept(item);
      });
      menu.append(li);
    });
    const open = items.length > 0;
    menu.hidden = !open;
    input.setAttribute('aria-expanded', String(open));
    if (open) {
      input.setAttribute('aria-activedescendant', `tui-option-${selected}`);
      menu.children[selected]?.scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function refreshMenu(): void {
    items = menuDismissed ? [] : suggestions(input.value).slice(0, 12);
    selected = Math.min(selected, Math.max(0, items.length - 1));
    renderMenu();
  }

  function closeMenu(): void {
    items = [];
    selected = 0;
    renderMenu();
  }

  function accept(item: Item): void {
    input.value = item.value;
    menuDismissed = false;
    selected = 0;
    if (item.submit) {
      void submit(item.value);
    } else {
      refreshMenu();
      input.focus();
    }
  }

  // ── Eventos ─────────────────────────────────────────────

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    void submit(input.value);
  });

  input.addEventListener('input', () => {
    menuDismissed = false;
    selected = 0;
    historyIndex = -1;
    refreshMenu();
  });

  input.addEventListener('keydown', (event) => {
    const open = items.length > 0;
    if (open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      selected = (selected + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      renderMenu();
    } else if (open && (event.key === 'Enter' || event.key === 'Tab')) {
      event.preventDefault();
      const item = items[selected];
      if (event.key === 'Tab') {
        input.value = item.value;
        selected = 0;
        refreshMenu();
      } else {
        accept(item);
      }
    } else if (event.key === 'Escape') {
      event.preventDefault();
      if (open) {
        menuDismissed = true;
        closeMenu();
      } else {
        input.value = '';
      }
    } else if (!open && (event.key === 'ArrowUp' || event.key === 'ArrowDown') && history.length) {
      event.preventDefault();
      if (event.key === 'ArrowUp')
        historyIndex = historyIndex < 0 ? history.length - 1 : Math.max(0, historyIndex - 1);
      else
        historyIndex =
          historyIndex < 0 || historyIndex + 1 >= history.length ? -1 : historyIndex + 1;
      input.value = historyIndex < 0 ? '' : history[historyIndex];
    } else if (event.ctrlKey && event.key === 'l') {
      event.preventDefault();
      void submit('/clear');
    } else if (event.ctrlKey && event.key === 'c' && input.selectionStart === input.selectionEnd) {
      input.value = '';
      closeMenu();
    }
  });

  input.addEventListener('blur', () => window.setTimeout(closeMenu, 120));

  log.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    const link = target.closest<HTMLAnchorElement>('a.tui-link');
    if (link?.dataset.href) {
      const href = link.dataset.href;
      if (isExternal(href)) return;
      event.preventDefault();
      if (href.startsWith('cmd:')) void submit(href.slice(4));
      else if (href.startsWith('page:')) onQuit(href.slice(5));
      else void submit(`@${href}`);
      return;
    }
    if (!window.getSelection()?.toString()) input.focus({ preventScroll: true });
  });

  shell.exit.addEventListener('click', () => onQuit(lastUrl));

  return {
    start(): void {
      welcome();
      // Si se entra desde una página concreta, se abre su archivo
      const here = docForUrl(docs, lastUrl);
      if (here && here.path !== HOME) void submit(`@${here.path}`);
      input.focus({ preventScroll: true });
    },
  };
}
