// Capturas de un sitio para un caso de estudio. Uso: ver README.md
import { chromium } from 'playwright';

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const listar = args.includes('--listar');
const movil = args.includes('--movil');
// Opciones con valor: lo que les sigue no es posicional
const conValor = new Set(['--y', '--difuminar']);
const [url, salida] = args.filter((a, i) => !a.startsWith('--') && !conValor.has(args[i - 1]));
const y = Number(flag('--y') ?? 0);
const difuminar = flag('--difuminar');

if (!url || (!listar && !salida)) {
  console.error(
    'Uso: node capturas.mjs [--listar] <url> [salida.png] [--y px] [--difuminar ...] [--movil]',
  );
  process.exit(1);
}

const b = await chromium.launch();
const ctx = await b.newContext(
  movil
    ? {
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      }
    : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 },
);
const p = await ctx.newPage();
await p.goto(url, { waitUntil: 'networkidle' }).catch(() => {});

// Banner de cookies del sitio, si lo hay
const cookies = p
  .getByRole('button', { name: /rechazar|solo necesarias|aceptar|entendido/i })
  .first();
if (await cookies.count()) await cookies.click().catch(() => {});

// Recorre la página para que carguen imágenes diferidas y animaciones de entrada
await p.evaluate(async () => {
  for (let top = 0; top < document.body.scrollHeight; top += 500) {
    scrollTo(0, top);
    await new Promise((r) => setTimeout(r, 120));
  }
});

if (listar) {
  await p.evaluate(() => scrollTo(0, 0));
  await p.waitForTimeout(300);
  const secciones = await p.evaluate(() =>
    [...document.querySelectorAll('h1,h2,h3')].map(
      (h) =>
        `${Math.round(h.getBoundingClientRect().top + scrollY)}\t${h.innerText.trim().replace(/\s+/g, ' ').slice(0, 70)}`,
    ),
  );
  console.log(
    `alto: ${await p.evaluate(() => document.body.scrollHeight)} px\n${secciones.join('\n')}`,
  );
  await b.close();
  process.exit(0);
}

await p.evaluate((top) => scrollTo(0, top), y);
await p.waitForTimeout(1200);

if (difuminar) {
  const n = await p.evaluate((spec) => {
    const [tipo, valor] = [spec.slice(0, spec.indexOf(':')), spec.slice(spec.indexOf(':') + 1)];
    let c = 0;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textos = tipo === 'texto' ? valor.split('|') : [];
    const [x1, y1, x2, y2] = tipo === 'region' ? valor.split(',').map(Number) : [];
    for (let node = w.nextNode(); node; node = w.nextNode()) {
      const t = node.textContent.trim();
      if (!t) continue;
      const el = node.parentElement;
      const r = el.getBoundingClientRect();
      const hit =
        tipo === 'texto'
          ? textos.some((x) => t.includes(x))
          : r.left >= x1 && r.top >= y1 && r.right <= x2 && r.bottom <= y2;
      if (hit) {
        el.style.filter = 'blur(8px)';
        c++;
      }
    }
    return c;
  }, difuminar);
  console.log(`difuminados: ${n}`);
}

await p.screenshot({ path: salida });
console.log(`ok ${salida}`);
await b.close();
