---
name: caso-de-estudio
description: Enriquece y publica un caso de estudio de jenner.codes (src/content/proyectos/*.md) de punta a punta — investigar el repo y el sitio del proyecto, entrevistar a Jenner, tomar y sanear capturas, escribir el caso con diagrama de arquitectura, dejarlo al mismo nivel en el modo terminal, verificar SEO/OG/accesibilidad y publicarlo. Usar cuando Jenner pida mejorar, enriquecer, revisar o publicar un proyecto o caso de estudio, quitarle el `hidden` a uno, o "hacer lo mismo que con Profix/Trazzo".
---

# Caso de estudio de jenner.codes

Flujo probado con Profix y Trazzo. Los casos sin revisar llevan `hidden: true` y no se publican en ningún lado; este flujo deja uno listo para quitarle el flag.

Antes de empezar: leer `CLAUDE.md` (tono, persona, visual) y los casos ya publicados (`profix.md`, `trazzo.md`) como referencia de nivel y estructura. **No repetir** en un caso nuevo lo que ya cuenta otro (p. ej. sesión compartida por cookie y caché por webhook ya están en Profix: en otro caso, una línea).

## 1. Investigar (solo lectura)

- **Repo:** `~/Projects/<proyecto>` o `gh repo list jennercodes`. Leer `CLAUDE.md`, `README`, `ROADMAP`, `docs/`. Historia: `git log --reverse | head`, commits por año, `git shortlog -sn` (¿hubo equipo?), tags/releases, áreas de `feat(...)`.
- **Sitio en producción:** recorrer las páginas **completas**, no solo el héroe (`node <scripts>/capturas.mjs --listar <url>` lista las secciones con su altura). Lo que vale está en las secciones interiores.
- **CMS/conectores:** si hay un MCP del proyecto, consultarlo solo para leer.
- Buscar **lo distintivo**: la decisión técnica con historia, lo que costó, lo que se rompe si se hace mal.

## 2. Entrevistar (AskUserQuestion, 3–4 preguntas por ronda)

Preguntas que siempre hicieron falta:
- **Eje del caso** (ofrecer 2–3 ángulos encontrados en la investigación).
- **Cronología** si git y el caso no cuadran (p. ej. WordPress antes, plataforma después).
- **Equipo y créditos**: ¿solo?, ¿diseño de quién? (el diseño ajeno se acredita).
- **Cifras publicables**: nunca publicar una cifra no confirmada; ofrecer "ninguna sin revisar".
- **Antes del sistema**: cómo se hacía (da el arranque del caso).
- **Lo más difícil / de lo que está orgulloso** (multiSelect).
- **IA**: ¿parte del método, solo funcionalidad o no mencionarla?
- **Capturas con sesión**: ¿hay sesión en Chrome, cuenta de prueba, o solo lo público?

## 3. Datos sensibles (revisar antes de escribir y antes de cada captura)

Nunca publicar:
- Hosts de staging/pruebas, proveedores e infraestructura interna (Coolify, Tailscale, buckets, prefijos privados, reglas WAF, nombres de variables de entorno).
- Vulnerabilidades del cliente, aunque ya estén corregidas.
- **Firmas** escaneadas (pixelar), datos de alumnos/usuarios reales (nombres, notas, iniciales, avatares, códigos de certificado), correos y teléfonos de terceros.
- Contenido de pago del cliente legible a tamaño completo (mostrar la interfaz, no el material).
- Credenciales: nunca pedirlas ni escribirlas; usar la sesión que Jenner ya tenga abierta en Chrome.

Difuminar o pixelar se nota a propósito: mejor que inventar datos de reemplazo.

## 4. Capturas

- Playwright en el scratchpad (no es dependencia del repo): ver `scripts/README.md`. Con sesión: Claude in Chrome (`save_to_disk`), y la parte pública mejor sin sesión.
- 1440×900 a 2×; móvil 390×844 solo si aporta.
- **Elegir producto, no héroes**: grillas, precios, flujos, editores, estados. Las portadas con foto y título valen una vez (la primera de la galería).
- Sanear: `scripts/pixelar.py` (cajas en px) o desenfocar en el DOM antes de capturar (`capturas.mjs --difuminar`).
- Formato: fotos → JPEG q85; interfaz → PNG. La carpeta de un caso ronda 2–3 MB.
- Destino: `src/assets/proyectos/<id>/`.

## 5. Escribir el caso

- **Tono** (`CLAUDE.md`): impersonal, directo, sin slogans ni palabras de CV, frases cortas con tensión ("Escribir lo nuevo era la parte fácil…"). Nada de cifras sin confirmar.
- **Estructura**: intro (qué es, cifras confirmadas, etapas) → secciones `##` con la historia técnica → cierre en lo que aporta (soporte, medición…).
- **Diagrama de arquitectura** (SVG en línea, mismas clases `dg-*` de `global.css`, ver los de `profix.md`/`trazzo.md`): navegador → apps → API (módulos en chips, la cola en acento) → servicios; una línea discontinua de acento para el flujo clave y su leyenda. viewBox ~480 de ancho.
  - Dentro del `<figure>`, después del `<figcaption>`, la versión para la terminal en `<!--tui … -->` (≤ 44 columnas para que quepa en móvil).
  - **Ninguna línea en blanco dentro del `<figure>`**: cierra el bloque HTML y el comentario se traga el resto de la página. El build falla si pasa (`assertFigures` en `src/lib/proyectos.ts`).
- Bloques de código (` ```txt `) para flujos paso a paso.
- Imágenes en el texto: 1–2, con `alt` descriptivo.

Frontmatter:
- `summary`: una línea con la idea del caso (sale en la tarjeta, la OG y la descripción SEO).
- `stack`, `url`, `featured` si va a la portada.
- `cover`: la captura de la imagen OG (la más representativa del trabajo).
- `gallery`: **número par** (grilla de 2 columnas), la portada primero; `alt` descriptivos.
- Quitar `hidden: true` solo cuando Jenner apruebe.

## 6. Modo terminal (mismo nivel que la web)

`/tui.json` toma el mismo `.md`: el diagrama sale de `<!--tui-->`, las imágenes del texto y la galería quedan como enlaces `▣` con vista previa al pasar el mouse y visor PhotoSwipe. Si el caso tiene un nombre que no está en el título, sumarlo a `PROJECT_ALIASES` en `src/lib/tui/chat.ts`.

## 7. Verificar

1. `pnpm lint && pnpm check && pnpm build`.
2. `node <scripts>/verificar.mjs http://localhost:4321 <id>`: reglas del audit de Astro (enlaces/encabezados sin nombre, `loading` de imágenes), desborde en móvil, terminal (`/proyectos <id>`, diagrama, enlaces de imagen, visor) y errores de consola.
3. Mirar la OG: `dist/og/proyectos/<id>.png` (texto a la izquierda, captura a la derecha).
4. Lighthouse móvil y escritorio sobre `pnpm astro preview` (ver `scripts/README.md`): objetivo 100 en SEO, accesibilidad y buenas prácticas.
5. Revisar en claro, oscuro y móvil.

Si el dev server muestra datos viejos tras tocar `content.config.ts` o da `504 Outdated Optimize Dep`: `pnpm astro dev stop && rm -rf node_modules/.vite node_modules/.astro/data-store.json .astro/data-store.json && pnpm astro dev --force`.

## 8. Publicar (solo con el OK explícito de Jenner)

- Commit en `main` (convencional, en inglés) y `git push`; Coolify despliega solo (~75 s).
- Verificar en producción: la página responde y tiene `<footer>`, `/tui.json` trae el caso, los ocultos dan 404.
- La URL de la OG lleva `?v=<hash>` (`src/lib/og-pages.ts`): no hace falta purgar Cloudflare. Para refrescar la vista previa en redes: Post Inspector de LinkedIn o Sharing Debugger de Facebook.
