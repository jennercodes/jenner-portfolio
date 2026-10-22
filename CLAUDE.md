# CLAUDE.md

Sitio personal de Jenner Acosta → https://jenner.codes. Español, estático.

## Comandos

```bash
pnpm dev        # localhost:4321
pnpm build      # dist/ + sitemap
pnpm preview    # sirve dist/ en segundo plano (astro preview stop | status | logs)
pnpm check      # astro check (tipos)
pnpm lint       # Biome; lint:fix escribe
```

Sin tests. Antes de dar algo por terminado: `pnpm lint && pnpm check && pnpm build`.

## Stack

Astro 7 (estático, `build.format: 'file'`, `trailingSlash: 'never'`) · Tailwind v4 vía `@tailwindcss/vite` · fuentes auto-hospedadas con la Fonts API de Astro (`astro.config.mjs`) · Biome · pnpm · TypeScript 5.9 (no 7: `@astrojs/check` no lo soporta).

## Dónde vive cada cosa

| Qué | Dónde |
|---|---|
| Datos del sitio, nav, principios, charlas, Sobre mí | `src/data/site.ts` |
| Terminal interactiva (comandos, autocompletado, historial) | `src/lib/terminal.ts` + `src/components/Terminal.astro` |
| Cambio de modo normal ↔ terminal | `src/lib/mode.ts` + `src/components/ModeToggle.astro` + script del head en `Base.astro` |
| Modo terminal (conversación: `/comandos`, `@archivos`, preguntas por palabras clave) | `src/lib/tui/` · datos en `/tui.json` (`src/pages/tui.json.ts`) |
| Animaciones GSAP del modo normal (atributos `data-*`) | `src/lib/motion.ts` |
| Casos de estudio | `src/content/proyectos/*.md` (schema en `src/content.config.ts`) |
| Tokens de color, degradados, `prose-case` | `src/styles/global.css` |
| Layout + SEO + JSON-LD | `src/layouts/Base.astro` |

`featured: true` → aparece en "Trabajo seleccionado" de la portada. `personal: true` → etiqueta "Proyecto personal". Sin `end` → "— hoy".

## Identidad (no romper)

La investigación y las decisiones de marca están en `docs/identity/` (fuera de git: contiene información interna de clientes). Leer `08-sintesis-identidad.md`, `05-voz-y-contenido.md` y `11-como-pienso.md` antes de escribir copy.

- **Tono**: la voz real de Jenner, directa y honesta. Nada de slogans ni palabras de CV ("apasionado", "innovador").
- **Persona**: portada, casos y listados sin "yo" (frases impersonales, solo hechos). Primera persona solo en Sobre mí y en contacto.
- **Portada**: solo nombre y rol ("Senior Frontend Engineer @ Delosi · Hostbox Founder"). Sin lema.
- **Visual v0.2**: Space Grotesk + JetBrains Mono; grises Zinc + un acento azul (`blue-400` en oscuro, `blue-600` en claro). Degradados Blueprint (hero), Glow (tarjetas) y Signal (solo detalles). Sin símbolo por ahora.
- **Tema**: sigue al sistema por defecto; `ThemeToggle` lo fija en claro u oscuro (`data-theme`). Usar los tokens semánticos (`bg`, `surface`, `fg`, `muted`, `line`, `accent`…), nunca hex sueltos en componentes. La terminal y el modo terminal son oscuros en ambos temas.
- Cifras y datos de los casos: solo los confirmados por Jenner. No inventar métricas.

## Dos modos

- **Normal**: el sitio estático + GSAP (`src/lib/motion.ts`). Los efectos se declaran en el marcado: `data-split`, `data-scramble`, `data-hero-item`, `data-reveal`, `data-stagger`, `data-magnetic`, `data-hero`, `data-cross`. Todo respeta `prefers-reduced-motion`; sin JS el contenido se ve igual.
- **Terminal**: el sitio como una conversación en la terminal, al estilo de un agente de código. Menú al escribir `/` (comandos) y `@` (archivos); el texto libre se resuelve con palabras clave, sin IA. Se activa con el botón `>_`, el comando `terminal` de la portada o `?modo=terminal`; se recuerda en `localStorage.mode` y se sale con `/exit`. Contenido nuevo del sitio → agregarlo también a `src/lib/tui/content.ts` (y a las palabras clave de `chat.ts` si aplica).
