"""Erase the standing crew member from the 640x360 menu painting.

Each row of the hole is filled by tiling a narrow strip of the same row from beside the
figure: the wall above the desk from the left, the desk, screens and floor from the right.
Those surfaces run horizontally, so a row-wise tile continues them without a smear.
Usage: python clean_plate.py <menu_station.png> <out.png> <preview.png>
"""
import sys
from PIL import Image

src, out, preview = sys.argv[1:4]
im = Image.open(src).convert('RGBA')
px = im.load()
orig = im.copy().load()
X0, X1, Y0, Y1 = 342, 369, 206, 265   # hole, inclusive-exclusive
SPLIT = 231                           # rows above: wall (tile from the left); below: desk and floor (from the right)
STRIP = 6
for y in range(Y0, Y1):
    if y < 220:
        strip = [orig[344 + i, y] for i in range(STRIP)]  # plain wall beside the head, above the pipe's reach
    elif y < SPLIT:
        strip = [orig[338 + i % 4, y] for i in range(STRIP)]  # wall left of the shoulders
    else:
        strip = [px[X1 + i, y] for i in range(STRIP)]
    for x in range(X0, X1):
        px[x, y] = strip[(x - X0) % STRIP] if y >= SPLIT else strip[(x - X0) % STRIP]
im.save(out)
im.convert('RGB').crop((300, 195, 420, 275)).resize((480, 320), Image.NEAREST).save(preview)
