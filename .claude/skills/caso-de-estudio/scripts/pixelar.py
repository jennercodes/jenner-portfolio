"""Pixela cajas de una imagen y la guarda (JPEG q85 para fotos, PNG para interfaz).

Uso: python3 pixelar.py entrada salida [x1,y1,x2,y2 ...]
"""

import sys

from PIL import Image


def pixelar(im, caja, factor=10):
    region = im.crop(caja)
    w, h = region.size
    chica = region.resize((max(1, w // factor), max(1, h // factor)), Image.BILINEAR)
    im.paste(chica.resize((w, h), Image.NEAREST), caja)


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    entrada, salida, *cajas = sys.argv[1:]
    im = Image.open(entrada).convert("RGB")
    for c in cajas:
        pixelar(im, tuple(int(v) for v in c.split(",")))
    if salida.lower().endswith((".jpg", ".jpeg")):
        im.save(salida, quality=85, optimize=True, progressive=True)
    else:
        im.save(salida)
    print(f"ok {salida} ({len(cajas)} cajas)")


if __name__ == "__main__":
    main()
