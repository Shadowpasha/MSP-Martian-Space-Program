"""Build the main menu cat's atlas from Last Tick's "Animated Pixel Kittens" free pack.

The pack (https://last-tick.itch.io/animated-pixel-kittens-cats-32x32) may be used in games but
not redistributed as files, so only this derived atlas is committed. Point the script at
"cat 1.png" from the pack (32x32 cells, one animation per row).

Atlas: 8 x 8 grid of 32x32 cells (256x256), one animation per row:
  0 walk right (8)        1 walk left (8)
  2 sit, looking around (6)   3 wash (8)   4 yawn (8)
  5 meow (3), then sleep curled left (2) and right (2)
Usage: python menu_cat.py "<path to cat 1.png>"
"""
import json
import os
import sys
import uuid
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'textures', 'menu_cat.png')
sheet = Image.open(sys.argv[1]).convert('RGBA')
CELL = 32


def cells(row: int, count: int) -> list:
    return [sheet.crop((c * CELL, row * CELL, (c + 1) * CELL, (row + 1) * CELL)) for c in range(count)]


# Sheet rows (from the pack's animation list).
LAYOUT = [
    cells(6, 8),                            # walk right
    cells(7, 8),                            # walk left
    cells(0, 6),                            # rest: sit, looking around
    cells(36, 8),                           # wash (sit)
    cells(32, 8),                           # yawn (sit)
    cells(28, 3) + cells(12, 2) + cells(13, 2),  # meow (sit), sleep 1 (l), sleep 1 (r)
]
atlas = Image.new('RGBA', (CELL * 8, CELL * 8), (0, 0, 0, 0))
for row, frames in enumerate(LAYOUT):
    for col, frame in enumerate(frames):
        atlas.paste(frame, (col * CELL, row * CELL))


def station_light(img: Image.Image) -> Image.Image:
    """Shade the flat grey cat like the painting: a gradient map from the painting's navy-plum
    shadows to warm grey-beige, plus a soft lamp-coloured rim on top edges (light from above)."""
    import numpy as np
    a = np.asarray(img).astype(np.float32)
    rgb, alpha = a[..., :3], a[..., 3]
    lum = (rgb @ np.array([0.299, 0.587, 0.114])) / 255
    lum = np.clip((lum - lum[alpha > 0].min()) / max(1e-3, np.ptp(lum[alpha > 0])), 0, 1) if (alpha > 0).any() else lum
    stops = np.array([[30, 24, 38], [64, 54, 72], [112, 96, 104], [168, 146, 132]], np.float32)
    pos = lum * (len(stops) - 1)
    lo = np.floor(pos).astype(int).clip(0, len(stops) - 2)
    t = (pos - lo)[..., None]
    shaded = stops[lo] * (1 - t) + stops[lo + 1] * t
    # Rim light: opaque pixels with open air above them catch the lamps.
    solid = alpha > 0
    top = solid & ~np.vstack([np.zeros((1, solid.shape[1]), bool), solid[:-1]])
    lamp = np.array([236, 176, 118], np.float32)
    shaded[top] = shaded[top] * 0.55 + lamp * 0.45
    out = np.dstack([shaded, alpha]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')


atlas = station_light(atlas)
atlas.save(OUT)
if not os.path.exists(OUT + '.meta'):
    with open(OUT + '.meta', 'w') as f:
        json.dump({'uuid': str(uuid.uuid4()), 'version': '2.0', 'type': 'texture', 'importer': {
            'maxSize': 2048, 'filterMode': 'nearest', 'wrapMode': 'clamp', 'mipmaps': False, 'premultiplyAlpha': False,
            'sliceBorder': {'left': 0, 'right': 0, 'top': 0, 'bottom': 0}}}, f, indent=2)
print('wrote', os.path.normpath(OUT))
