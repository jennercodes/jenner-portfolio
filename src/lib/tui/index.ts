/*
 * Modo terminal: el sitio como una conversación en la terminal (src/lib/tui/chat.ts).
 * Se carga con import() solo cuando el modo está activo (src/lib/mode.ts).
 */

import { gsap } from 'gsap';
import { exitTerminal } from '../mode';
import { createChat } from './chat';
import { buildShell } from './render';
import type { TuiData } from './types';

let mounted = false;

export async function mountTui(): Promise<void> {
  const root = document.querySelector<HTMLElement>('[data-tui]');
  if (!root || mounted) return;
  mounted = true;

  let data: TuiData;
  try {
    const res = await fetch('/tui.json');
    data = await res.json();
  } catch {
    root.textContent = 'No se pudo cargar jenner.codes. Recarga la página.';
    return;
  }

  // El modo terminal es oscuro en ambos temas
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    meta.content = '#09090b';
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shell = buildShell(root);

  const chat = createChat({
    shell,
    data,
    reduced,
    animate(node) {
      if (reduced) return;
      gsap.from(node, {
        autoAlpha: 0,
        y: 8,
        duration: 0.35,
        ease: 'power3.out',
        clearProps: 'all',
      });
    },
    onQuit(url) {
      if (reduced) {
        exitTerminal(url);
        return;
      }
      gsap.to(root, {
        autoAlpha: 0,
        y: 12,
        duration: 0.25,
        ease: 'power2.in',
        onComplete: () => exitTerminal(url),
      });
    },
  });

  if (!reduced) {
    gsap.from(shell.root.querySelector('.tui-dock'), {
      y: 24,
      autoAlpha: 0,
      duration: 0.5,
      ease: 'power3.out',
    });
  }
  chat.start();
}
