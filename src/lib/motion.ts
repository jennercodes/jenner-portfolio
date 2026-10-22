/*
 * Movimiento del modo normal con GSAP. Se declara en el marcado con atributos:
 *   data-split       título que entra letra por letra
 *   data-scramble    texto mono que se descifra
 *   data-hero-item   piezas de la intro, en orden
 *   data-cross       cruces de plano (Crosshairs.astro)
 *   data-hero        brillo que sigue al mouse + parallax de la retícula
 *   data-reveal      aparece al entrar en pantalla
 *   data-stagger     sus hijos aparecen en cascada
 *   data-magnetic    se acerca al puntero
 *   .bg-glow         el brillo de la tarjeta sigue al puntero
 * Sin prefers-reduced-motion: no-preference no se anima nada.
 */

import { gsap } from 'gsap';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText, ScrambleTextPlugin);

type Cleanup = () => void;

function on<K extends keyof HTMLElementEventMap>(
  el: HTMLElement,
  type: K,
  fn: (event: HTMLElementEventMap[K]) => void,
  cleanups: Cleanup[],
): void {
  el.addEventListener(type, fn);
  cleanups.push(() => el.removeEventListener(type, fn));
}

const all = <T extends Element = HTMLElement>(selector: string) => [
  ...document.querySelectorAll<T>(selector),
];

/** Posición del puntero dentro del elemento, en % */
function pointer(el: HTMLElement, event: PointerEvent): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return {
    x: ((event.clientX - r.left) / r.width) * 100,
    y: ((event.clientY - r.top) / r.height) * 100,
  };
}

function intro(): void {
  const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  for (const el of all('[data-split]')) {
    const split = SplitText.create(el, { type: 'words,chars', mask: 'words' });
    gsap.set(el, { autoAlpha: 1 });
    tl.from(split.chars, { yPercent: 110, duration: 1, stagger: 0.03 }, 0);
  }

  tl.from(all('[data-hero-item]'), { autoAlpha: 0, y: 18, duration: 0.8, stagger: 0.09 }, 0.25);

  for (const el of all('[data-scramble]')) {
    tl.to(
      el,
      { duration: 1.1, scrambleText: { text: '{original}', chars: '01<>/_{}', speed: 0.5 } },
      0.35,
    );
  }

  tl.from(
    all('[data-cross]'),
    { autoAlpha: 0, rotate: -135, scale: 0, duration: 0.9, stagger: 0.07, ease: 'back.out(2)' },
    0.45,
  );
}

function hero(cleanups: Cleanup[], fine: boolean): void {
  for (const el of all('[data-hero]')) {
    gsap.set(el, { '--mx': '50%', '--my': '0%', '--grid-y': '0px' });

    // Parallax: la retícula baja más lento que el contenido
    gsap.to(el, {
      '--grid-y': '140px',
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
    });
    const content = el.querySelector('section');
    if (content) {
      gsap.to(content, {
        y: 90,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true },
      });
    }

    if (!fine) continue;
    on(
      el,
      'pointermove',
      (event) => {
        const { x, y } = pointer(el, event);
        gsap.to(el, {
          '--mx': `${x}%`,
          '--my': `${y - 30}%`,
          duration: 0.9,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      },
      cleanups,
    );
    on(
      el,
      'pointerleave',
      () =>
        gsap.to(el, {
          '--mx': '50%',
          '--my': '0%',
          duration: 1.2,
          ease: 'power3.out',
          overwrite: 'auto',
        }),
      cleanups,
    );
  }
}

function reveals(): void {
  for (const el of all('[data-reveal]')) {
    gsap.from(el, {
      autoAlpha: 0,
      y: 36,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    });
  }

  for (const list of all('[data-stagger]')) {
    const items = [...list.children] as HTMLElement[];
    gsap.set(items, { autoAlpha: 0, y: 22 });
    ScrollTrigger.batch(items, {
      start: 'top 94%',
      once: true,
      onEnter: (batch) =>
        gsap.to(batch, {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.07,
          ease: 'power3.out',
          overwrite: true,
        }),
    });
  }
}

function magnetic(cleanups: Cleanup[]): void {
  for (const el of all('[data-magnetic]')) {
    const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
    on(
      el,
      'pointermove',
      (event) => {
        const r = el.getBoundingClientRect();
        xTo((event.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((event.clientY - (r.top + r.height / 2)) * 0.4);
      },
      cleanups,
    );
    on(
      el,
      'pointerleave',
      () => {
        gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)', overwrite: true });
      },
      cleanups,
    );
  }
}

function glowCards(cleanups: Cleanup[]): void {
  for (const el of all('.bg-glow')) {
    gsap.set(el, { '--gx': '100%', '--gy': '0%' });
    on(
      el,
      'pointermove',
      (event) => {
        const { x, y } = pointer(el, event);
        gsap.to(el, {
          '--gx': `${x}%`,
          '--gy': `${y}%`,
          duration: 0.6,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      },
      cleanups,
    );
    on(
      el,
      'pointerleave',
      () =>
        gsap.to(el, {
          '--gx': '100%',
          '--gy': '0%',
          duration: 1,
          ease: 'power3.out',
          overwrite: 'auto',
        }),
      cleanups,
    );
  }
}

export function initMotion(): void {
  const mm = gsap.matchMedia();

  mm.add(
    { motion: '(prefers-reduced-motion: no-preference)', fine: '(pointer: fine)' },
    (context) => {
      const { motion, fine } = context.conditions as { motion: boolean; fine: boolean };
      if (!motion) return;
      const cleanups: Cleanup[] = [];
      intro();
      hero(cleanups, fine);
      reveals();
      if (fine) {
        magnetic(cleanups);
        glowCards(cleanups);
      }
      return () => {
        for (const fn of cleanups) fn();
      };
    },
  );

  // Los estados iniciales ya están puestos en línea: el CSS antiparpadeo sobra
  document.documentElement.classList.remove('motion');
}
