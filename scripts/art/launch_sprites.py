"""Pixel sprites for the launch intro: a rocket, two flame frames, and Earth / Mars / Moon discs.

Drawn in code with the same palette and .meta helper as prep_sprites.py (filterMode nearest),
at 1x; the game shows them at integer scales. Run from the repo root:

    python -I scripts/art/launch_sprites.py

Writes to assets/textures/launch/. Existing files are overwritten: this script is their source.
"""
from __future__ import annotations

import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw

sys.path.insert(0, str(Path(__file__).resolve().parent))
from prep_sprites import ROOT, rgba, save  # noqa: E402

OUT = ROOT / "assets" / "textures" / "launch"


def rocket() -> Image.Image:
    """24 x 48, nose up: cream body, red nose and fins, a cyan porthole, a steel nozzle."""
    img = Image.new("RGBA", (24, 48), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    # Body: a rounded column, lit from the upper left.
    for y in range(8, 38):
        half = 6 if y > 11 else 6 - (11 - y)
        d.line([(12 - half, y), (11 + half, y)], fill=rgba("cream"))
        d.point((12 - half, y), fill=rgba("white"))
        d.point((11 + half, y), fill=rgba("cream2"))
        d.point((10 + half, y), fill=rgba("cream2"))
    # Nose cone.
    for y in range(0, 12):
        half = max(0, round(y * 0.55))
        if half:
            d.line([(12 - half, y), (11 + half, y)], fill=rgba("red"))
            d.point((11 + half, y), fill=rgba("red2"))
    d.point((11, 0), fill=rgba("red")); d.point((12, 0), fill=rgba("red2"))
    # A band and a porthole.
    d.line([(6, 14), (17, 14)], fill=rgba("red2"))
    d.ellipse([8, 18, 15, 25], fill=rgba("ink7"), outline=rgba("steel"))
    d.rectangle([10, 20, 13, 23], fill=rgba("cyan"))
    d.point((10, 20), fill=rgba("white"))
    # Panel lines.
    d.line([(6, 30), (17, 30)], fill=rgba("cream2"))
    # Fins.
    for i in range(8):
        d.line([(5 - i // 2, 30 + i), (6, 30 + i)], fill=rgba("red"))
        d.line([(17, 30 + i), (18 + i // 2, 30 + i)], fill=rgba("red2"))
    d.rectangle([1, 38, 6, 40], fill=rgba("red2"))
    d.rectangle([17, 38, 22, 40], fill=rgba("red2"))
    # Nozzle.
    d.rectangle([8, 38, 15, 41], fill=rgba("steel"))
    d.rectangle([9, 42, 14, 44], fill=rgba("edge3"))
    d.line([(8, 38), (15, 38)], fill=rgba("edge5"))
    return img


def flame(frame: int) -> Image.Image:
    """12 x 16 exhaust flame; two frames that flicker."""
    img = Image.new("RGBA", (12, 16), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    length = 15 if frame == 0 else 12
    for y in range(length):
        t = y / length
        half = max(1, round(5 * (1 - t) ** 0.7 + (0.6 if (y + frame) % 3 == 0 else 0)))
        d.line([(6 - half, y), (5 + half, y)], fill=rgba("amber"))
        inner = max(0, half - 2)
        if inner:
            d.line([(6 - inner, y), (5 + inner, y)], fill=rgba("yellow"))
        if y < length * 0.45 and inner > 1:
            d.line([(6 - inner + 1, y), (5 + inner - 1, y)], fill=rgba("white"))
    return img


def planet(kind: str) -> Image.Image:
    """64 x 64 disc, lit from the upper left, with a dark rim on the lower right."""
    size = 64
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    base = {"earth": "blue2", "mars": "mars6", "moon": "steel"}[kind]
    light = {"earth": "blue", "mars": "mars5", "moon": "cream2"}[kind]
    dark = {"earth": "ink7", "mars": "rust", "moon": "edge5"}[kind]
    c = (size - 1) / 2
    r = size / 2 - 1
    for y in range(size):
        for x in range(size):
            dx, dy = x - c, y - c
            dist = math.hypot(dx, dy)
            if dist > r:
                continue
            lit = (-dx - dy) / (2 * r)
            col = light if lit > 0.18 else dark if (dist > r - 3 and lit < -0.05) else base
            img.putpixel((x, y), rgba(col))
    d = ImageDraw.Draw(img)

    def blob(cx, cy, rx, ry, col):
        for y in range(int(cy - ry), int(cy + ry) + 1):
            for x in range(int(cx - rx), int(cx + rx) + 1):
                if ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 and 0 <= x < size and 0 <= y < size and img.getpixel((x, y))[3]:
                    img.putpixel((x, y), rgba(col))

    if kind == "earth":
        for cx, cy, rx, ry in ((22, 20, 9, 7), (40, 30, 8, 11), (26, 42, 7, 6), (46, 48, 5, 4)):
            blob(cx, cy, rx, ry, "green2")
            blob(cx - 2, cy - 2, rx * 0.5, ry * 0.5, "green")
        for cx, cy, rx in ((16, 30, 7), (36, 14, 9), (44, 40, 6)):
            blob(cx, cy, rx, 1.5, "white")
    elif kind == "mars":
        for cx, cy, rr in ((24, 30, 4), (40, 22, 3), (36, 44, 5), (18, 44, 2), (46, 36, 2)):
            blob(cx, cy, rr, rr, "rust")
            blob(cx - 1, cy - 1, rr * 0.5, rr * 0.5, "mars6")
        blob(32, 4, 10, 3, "white")
        blob(30, 32, 16, 2, "mars6")
    else:
        for cx, cy, rr in ((22, 24, 5), (40, 20, 3), (36, 42, 6), (18, 42, 3), (48, 34, 2), (28, 12, 2)):
            blob(cx, cy, rr, rr, "edge3")
            blob(cx - 1, cy - 1, rr * 0.55, rr * 0.55, "muted")
    return img


def main() -> int:
    save(rocket(), OUT / "launch_rocket_24x48.png")
    save(flame(0), OUT / "launch_flame_a_12x16.png")
    save(flame(1), OUT / "launch_flame_b_12x16.png")
    for kind in ("earth", "mars", "moon"):
        save(planet(kind), OUT / f"launch_planet_{kind}_64.png")
    # A preview sheet for review (not used by the game).
    sheet = Image.new("RGBA", (24 * 6 + 12 * 6 + 64 * 3 * 3 + 40, 64 * 3), rgba("ink9"))
    x = 0
    for img in (rocket(), flame(0), flame(1)):
        big = img.resize((img.width * 3, img.height * 3), Image.NEAREST)
        sheet.paste(big, (x, 0), big)
        x += big.width + 8
    for kind in ("earth", "mars", "moon"):
        big = planet(kind).resize((192, 192), Image.NEAREST)
        sheet.paste(big, (x, 0), big)
        x += 200
    sheet.save(ROOT / ".impeccable" / "review" / "launch_sprites.png")
    print("wrote", OUT)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
