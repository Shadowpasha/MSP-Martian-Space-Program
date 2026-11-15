"""Paint the orange crew member out of the Instrument Lab in the station cutaway.

The station screen now has the real crew walking about (src/ui/stationCrew.ts), so the painted
astronaut at the lab console goes. His outline (painting px) is a few boxes; the wall behind him is
tiled from the clean wall beside him row by row (keeping the panel seam), the desk's left end and
the floor are carried on from just right of him.

Writes assets/textures/tharsis_station.png, and the same pixels into art/tharsis_station_source.png
(so art/export.mjs, which samples the source nearest-neighbour, gives the same result).
Run it on the original painting only (git has it): it reads the astronaut's surroundings from it.
"""
import os

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
TEXTURE = os.path.join(HERE, '..', 'assets', 'textures', 'tharsis_station.png')
SOURCE = os.path.join(HERE, 'tharsis_station_source.png')

BOXES = [(236, 221, 246, 231), (230, 228, 248, 261), (243, 231, 253, 243), (233, 256, 249, 270)]  # x0, y0, x1, y1 (exclusive)
DESK_X, DESK_TOP, FLOOR_Y = 246, 243, 266

im = np.asarray(Image.open(TEXTURE).convert('RGB')).copy()
mask = np.zeros(im.shape[:2], bool)
for x0, y0, x1, y1 in BOXES:
    mask[y0:y1, x0:x1] = True
mask[1:] |= mask[:-1].copy()
mask[:, 1:] |= mask[:, :-1].copy()  # one pixel of outline, down and right
mask[:, :229] = False                # never touch the tripod leg
mask[:, 253:] = False                # or the monitor's edge

ys, xs = np.nonzero(mask)
out = im.copy()
for y, x in zip(ys, xs):
    if y >= FLOOR_Y:
        src = (y, x + 22)                                  # floor
    elif x >= DESK_X and y >= DESK_TOP:
        src = (y, x + 8 if y < DESK_TOP + 4 else x + 6)    # desk top, then the recess under it
    elif y >= 250:
        # Low wall: the tripod leg crowds the clean strip here, so repeat the wall already filled above.
        out[y, x] = out[y - 10, x]
        continue
    else:
        # Wall: the clean strip right of the tripod leg on this row (the leg runs from (216, 238) to (229, 266)).
        left = 220 if y < 238 else int(216 + (y - 238) * 13 / 28) + 3
        width = 229 - left + 1
        src = (y, left + (x - left) % width)
    out[y, x] = im[src]

Image.fromarray(out).save(TEXTURE)

# The full-resolution source: every source pixel whose nearest 640x360 pixel changed takes the new value.
source = np.asarray(Image.open(SOURCE).convert('RGB')).copy()
sh, sw = source.shape[:2]
th, tw = im.shape[:2]
y0, y1 = ys.min(), ys.max() + 1
x0, x1 = xs.min(), xs.max() + 1
for sy in range(int(y0 * sh / th) - 2, int(y1 * sh / th) + 3):
    for sx in range(int(x0 * sw / tw) - 2, int(x1 * sw / tw) + 3):
        ty, tx = min(th - 1, sy * th // sh), min(tw - 1, sx * tw // sw)
        if mask[ty, tx]:
            source[sy, sx] = out[ty, tx]
Image.fromarray(source).save(SOURCE)
print('erased', int(mask.sum()), 'pixels')
