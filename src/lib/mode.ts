/*
 * Modo normal ↔ modo terminal.
 * El script inline de Base.astro aplica el modo guardado antes de pintar;
 * aquí se cambia en caliente.
 */

const KEY = 'mode';
/** Ancla pendiente tras salir con recarga (sessionStorage) */
const ANCHOR_KEY = 'mode-exit-anchor';

export function isTerminal(): boolean {
  return document.documentElement.dataset.mode === 'terminal';
}

export async function enterTerminal(): Promise<void> {
  try {
    localStorage.setItem(KEY, 'terminal');
  } catch {}
  document.documentElement.dataset.mode = 'terminal';
  const { mountTui } = await import('./tui');
  await mountTui();
}

/** Sale a la página equivalente al buffer abierto. Recarga para que el modo normal arranque limpio. */
export function exitTerminal(url: string): void {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  const target = new URL(url, window.location.href);
  if (target.pathname === window.location.pathname) {
    history.replaceState(null, '', target.pathname + target.hash);
    // Al recargar, el navegador restaura el scroll del modo terminal en vez de ir al ancla
    try {
      if (target.hash) sessionStorage.setItem(ANCHOR_KEY, target.hash);
    } catch {}
    window.location.reload();
  } else {
    window.location.assign(target.pathname + target.hash);
  }
}

/** Tras salir con recarga a la misma página, va al ancla que quedó pendiente */
export function scrollToExitAnchor(): void {
  let hash: string | null = null;
  try {
    hash = sessionStorage.getItem(ANCHOR_KEY);
    sessionStorage.removeItem(ANCHOR_KEY);
  } catch {}
  if (!hash) return;
  const target = document.getElementById(hash.slice(1));
  if (!target) return;
  // Sin esto, el navegador vuelve a poner el scroll del modo terminal al terminar de cargar
  history.scrollRestoration = 'manual';
  const go = () => target.scrollIntoView();
  go();
  if (document.readyState === 'complete') requestAnimationFrame(go);
  else window.addEventListener('load', () => requestAnimationFrame(go), { once: true });
}
