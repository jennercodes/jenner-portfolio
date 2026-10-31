# Scripts del flujo de caso de estudio

Playwright no es dependencia del repo: se instala aparte, en el scratchpad de la sesión.

```bash
export PATH=~/.nvm/versions/node/v24.22.1/bin:$PATH        # node no está en el PATH por defecto
T=<scratchpad>/shots-tool && mkdir -p $T && cd $T
npm init -y >/dev/null && npm i playwright@1.63.0           # usa el Chromium ya descargado (chromium-1248)
cp <repo>/.claude/skills/caso-de-estudio/scripts/*.mjs .     # los .mjs importan playwright desde aquí
```

| Script | Para qué |
|---|---|
| `capturas.mjs` | Lista las secciones de una página o captura secciones concretas, con difuminado opcional |
| `pixelar.py` | Pixela cajas de una imagen (firmas, avatares) y convierte a JPEG/PNG |
| `verificar.mjs` | Audit de Astro, desborde en móvil y modo terminal de un caso |

## capturas.mjs

```bash
node capturas.mjs --listar https://sitio.com/pagina            # secciones (h1–h3) con su altura
node capturas.mjs https://sitio.com/pagina salida.png          # el primer pantallazo
node capturas.mjs https://sitio.com/pagina salida.png --y 1380 # desde una altura (px)
node capturas.mjs https://sitio.com/pagina salida.png --y 3300 \
  --difuminar 'region:380,120,1440,900'                        # difumina el texto dentro de x1,y1,x2,y2 (px de la vista)
node capturas.mjs https://sitio.com/pagina salida.png --difuminar 'texto:Adelaida Sánchez|Nota final'
node capturas.mjs https://sitio.com/pagina salida.png --movil  # 390×844
```

## pixelar.py

```bash
python3 pixelar.py entrada.jpg salida.png 336,600,508,684 16,328,130,414   # cajas x1,y1,x2,y2
python3 pixelar.py entrada.png salida.jpg                                    # solo convertir (JPEG q85)
```

## verificar.mjs

```bash
node verificar.mjs http://localhost:4321 trazzo
```

Imprime los hallazgos y sale con código 1 si hay alguno.

## Lighthouse

```bash
pnpm astro preview --port 4322
CHROME_PATH=$(ls -d ~/Library/Caches/ms-playwright/chromium-1248/chrome-mac-arm64/*.app)/Contents/MacOS/* \
  npx -y lighthouse@12.8.2 http://localhost:4322/proyectos/<id> [--preset=desktop] --quiet \
  --chrome-flags="--headless=new" --only-categories=seo,accessibility,best-practices,performance \
  --output=json --output-path=lh.json
pnpm astro preview stop --port 4322
```
