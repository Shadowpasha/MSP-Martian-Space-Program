"""Glow layers for the main menu ambience, cut from the painting itself.

Each layer is a 640x360 transparent PNG holding only the painting's own bright pixels in one
area (a vent grille, the lamps, the grow lights, the brightest leaves), lifted
towards white. The game fades these in and out over the painting, so a glow always has the
exact shape of the thing that glows.
Usage: python menu_glow.py   (writes assets/textures/menu_glow_*.png)
"""
import json
import os
import uuid
from PIL import Image
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
TEXTURES = os.path.join(HERE, '..', 'assets', 'textures')
a = np.asarray(Image.open(os.path.join(TEXTURES, 'menu_station_empty.png')).convert('RGB')).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]

hot = (r > 190) & (g > 100) & (b < 120) & (r - b > 90)          # orange vent fire and lamp light
cream = (r > 225) & (g > 205) & (b > 150)                         # grow-light tubes and lamp cores
leaf = (g > 170) & (g > r + 10) & (b < 140)                       # sunlit leaves

LAYERS = {
    'vent_a': (hot, (395, 295, 440, 332)),
    'vent_b': (hot, (585, 310, 620, 347)),
    'lamps': (hot | cream, (190, 288, 500, 312)),
    'grow': (cream, (200, 185, 300, 240)),
    'leaves': (leaf, (200, 192, 298, 252)),
}


def outline(x0: int, y0: int, x1: int, y1: int) -> np.ndarray:
    """A machine's silhouette: everything in the box that is not the dark navy wall, filled row by row."""
    mx = np.maximum(np.maximum(r, g), b)
    machine = ~(((b > r + 8) & (mx < 110)) | (mx < 35))
    out = np.zeros_like(machine)
    for y in range(y0, y1):
        xs = np.nonzero(machine[y, x0:x1])[0]
        if len(xs):
            out[y, x0 + xs.min():x0 + xs.max() + 1] = True
    return out


# Not glows: exact copies the game moves or draws over other things.
# - generator: the generator's body, which hums (moves a pixel) in bursts.
# - generator_hole: its silhouette in the bay's dark wall colour, under the moving copy, so the
#   painted generator never shows through as a double edge.
# - door_rail: the yellow railing in front of the upper-deck doorway, drawn over the sliding door.
gen_box = (171, 310, 270, 346)
gen = outline(*gen_box)
rail = (r > 170) & (g > 130) & (b < 90)
# - deck_rail: the yellow railings along the front of the upper deck, drawn over the cat.
SOLID = {'generator': (gen, gen_box, None), 'generator_hole': (gen, gen_box, (24, 27, 42)), 'door_rail': (rail, (578, 236, 632, 262), None),
         'deck_rail': (rail, (165, 232, 578, 270), None)}

jobs = [(name, mask, box, 0.45, None) for name, (mask, box) in LAYERS.items()]
jobs += [(name, mask, box, 0.0, fill) for name, (mask, box, fill) in SOLID.items()]
for name, mask, (x0, y0, x1, y1), lift, fill in jobs:
    keep = np.zeros_like(mask)
    keep[y0:y1, x0:x1] = mask[y0:y1, x0:x1]
    lifted = np.broadcast_to(np.array(fill, dtype=np.float32), a.shape) if fill else a + (255 - a) * lift
    out = np.dstack([lifted, keep * 255]).clip(0, 255).astype(np.uint8)
    path = os.path.join(TEXTURES, f'menu_glow_{name}.png')
    Image.fromarray(out, 'RGBA').save(path)
    if not os.path.exists(path + '.meta'):
        meta = {'uuid': str(uuid.uuid4()), 'version': '2.0', 'type': 'texture', 'importer': {
            'maxSize': 2048, 'filterMode': 'nearest', 'wrapMode': 'clamp', 'mipmaps': False, 'premultiplyAlpha': False,
            'sliceBorder': {'left': 0, 'right': 0, 'top': 0, 'bottom': 0}}}
        with open(path + '.meta', 'w') as f:
            json.dump(meta, f, indent=2)
    ys, xs = np.nonzero(keep)
    print(name, int(keep.sum()), 'px', (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())) if len(xs) else None)
