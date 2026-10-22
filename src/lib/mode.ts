/*
 * Modo normal ↔ modo terminal.
 * El script inline de Base.astro aplica el modo guardado antes de pintar;
 * aquí se cambia en caliente.
 */

const KEY = 'mode';

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
    window.location.reload();
  } else {
    window.location.assign(target.pathname + target.hash);
  }
}
