// Verifica un caso de estudio en el sitio local. Uso: node verificar.mjs http://localhost:4321 <id>
import { chromium } from 'playwright';

const [base, id] = process.argv.slice(2);
if (!base || !id) {
  console.error('Uso: node verificar.mjs <base-url> <id-del-proyecto>');
  process.exit(1);
}

const hallazgos = [];
const b = await chromium.launch();

async function pagina(opts) {
  const ctx = await b.newContext({ ...opts, reducedMotion: opts.reducedMotion ?? 'no-preference' });
  await ctx.addInitScript(() => localStorage.setItem('consent', 'denied'));
  const p = await ctx.newPage();
  const errores = [];
  p.on('pageerror', (e) => errores.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errores.push(m.text().slice(0, 160)));
  return { ctx, p, errores };
}

// 1. Reglas del audit de Astro, justo al cargar (como corre en la barra de desarrollo)
{
  const { ctx, p, errores } = await pagina({ viewport: { width: 1600, height: 900 } });
  await p.goto(`${base}/proyectos/${id}`, { waitUntil: 'load' });
  await p.waitForTimeout(150);
  const audit = await p.evaluate(() => {
    const top = (el) => {
      let y = 0;
      for (let e = el; e; e = e.offsetParent) y += e.offsetTop;
      return y;
    };
    const sinNombre = [...document.querySelectorAll('a,h1,h2,h3,h4,h5,h6')]
      .filter((el) => {
        if (el.innerText?.trim() || el.getAttribute('aria-label')?.trim()) return false;
        if ([...el.querySelectorAll('img')].some((i) => i.alt?.trim())) return false;
        if ([...el.querySelectorAll('svg title')].some((t) => t.textContent.trim())) return false;
        return true;
      })
      .map((el) => `${el.tagName} sin nombre accesible: ${el.outerHTML.slice(0, 80)}`);
    const loading = [...document.querySelectorAll('img')]
      .filter((i) => {
        const y = top(i);
        const l = i.getAttribute('loading');
        return (l === 'lazy' && y < innerHeight) || ((!l || l === 'eager') && y >= innerHeight);
      })
      .map((i) => `img con loading mejorable (y=${top(i)}): ${i.alt.slice(0, 50)}`);
    const pie = !!document.querySelector('footer') && !!document.querySelector('[data-tui]');
    return { sinNombre, loading, pie };
  });
  hallazgos.push(...audit.sinNombre);
  for (const l of audit.loading) console.log(`aviso: ${l}`);
  if (!audit.pie)
    hallazgos.push(
      'la página no tiene <footer> o [data-tui]: ¿un comentario abierto se tragó el resto?',
    );
  await p.waitForTimeout(2500);
  hallazgos.push(...errores.map((e) => `consola (escritorio): ${e}`));
  await ctx.close();
}

// 2. Móvil: sin desborde horizontal
{
  const { ctx, p, errores } = await pagina({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    reducedMotion: 'reduce',
  });
  await p.goto(`${base}/proyectos/${id}`, { waitUntil: 'networkidle' });
  const ancho = await p.evaluate(() => document.documentElement.scrollWidth);
  if (ancho > 390) hallazgos.push(`móvil: la página mide ${ancho}px de ancho (debe ser 390)`);
  hallazgos.push(...errores.map((e) => `consola (móvil): ${e}`));
  await ctx.close();
}

// 3. Modo terminal: el caso abre con su diagrama y sus capturas, y el visor funciona
{
  const { ctx, p, errores } = await pagina({
    viewport: { width: 1280, height: 900 },
    reducedMotion: 'reduce',
  });
  await p.goto(`${base}/?modo=terminal`, { waitUntil: 'load' });
  const input = p.locator('.tui-input');
  await input.waitFor({ timeout: 30000 });
  await p.waitForTimeout(500);
  await input.fill(`/proyectos ${id}`);
  await p.keyboard.press('Escape');
  await input.fill(`/proyectos ${id}`);
  await input.press('Enter');
  await p.waitForTimeout(1200);
  const texto = await p.locator('[data-tui]').innerText();
  if (!texto.includes(`Read(proyectos/${id}.md)`))
    hallazgos.push(`terminal: /proyectos ${id} no abre el caso`);
  const pre = await p.locator('.tui-line:has(.tui-pre)').count();
  const imgs = await p.locator('a.tui-link[data-href^="img:"]').count();
  console.log(`terminal: ${pre} líneas de diagrama, ${imgs} enlaces de imagen`);
  if (texto.includes('<figure') || texto.includes('<svg'))
    hallazgos.push('terminal: se ve HTML crudo de una figura');
  if (imgs) {
    await p.locator('a.tui-link[data-href^="img:"]').first().click();
    await p.waitForTimeout(1000);
    if (!(await p.locator('.pswp--open').count()))
      hallazgos.push('terminal: el visor de imágenes no abre');
  }
  hallazgos.push(...errores.map((e) => `consola (terminal): ${e}`));
  await ctx.close();
}

await b.close();
if (hallazgos.length) {
  console.log(`\n${hallazgos.length} hallazgos:\n- ${hallazgos.join('\n- ')}`);
  process.exit(1);
}
console.log('\nsin hallazgos');
