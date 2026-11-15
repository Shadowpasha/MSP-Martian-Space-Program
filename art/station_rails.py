"""Cut the yellow safety railings out of the station cutaway into a front layer.

The crew walk about the station floor (src/ui/stationCrew.ts); this layer is drawn over them, so
they pass behind the railings at the ends of each room instead of over them.

A railing is a run of saturated yellow/amber pixels on the floor band (rows 262-292) that stands
tall (posts); the dashed floor marking and other yellow bits are flat and are left out. Each kept
railing takes its one-pixel dark outline with it.

Writes assets/textures/run_station_rails.png (640x360, transparent except the railings).
Usage: python station_rails.py [preview.png]
"""
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from crew_walkers import write_meta  # noqa: E402

TEXTURE = os.path.join(HERE, '..', 'assets', 'textures', 'tharsis_station.png')
OUT = os.path.join(HERE, '..', 'assets', 'textures', 'run_station_rails.png')
BAND = (262, 293)       # painting rows that hold the railings
MIN_HEIGHT = 18         # a railing (with its posts) is at least this tall

im = np.asarray(Image.open(TEXTURE).convert('RGB')).astype(int)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
# Railing paint, from the lit top (252,220,57) down to the shaded posts (108,70,22): warm, very
# little blue. The lit floor next to it has more blue (133,97,91) or is too dark (87,45,29).
yellow = (r > 95) & (b < 45) & (r - b > 70) & (g > 0.35 * r)
band = np.zeros_like(yellow)
band[BAND[0]:BAND[1]] = True
# The bottom of the orange crates in Storage touches the last railing: not a railing.
band[BAND[0]:270, 578:596] = False
yellow &= band

labels, count = ndimage.label(yellow, structure=np.ones((3, 3)))
keep = np.zeros_like(yellow)
for index, box in enumerate(ndimage.find_objects(labels), start=1):
    if box[0].stop - box[0].start >= MIN_HEIGHT:
        keep |= labels == index
# The dark outline right around each railing.
grown = ndimage.binary_dilation(keep, structure=np.ones((3, 3))) & band
lum = r * 0.3 + g * 0.59 + b * 0.11
mask = keep | (grown & (lum < 90))

out = np.zeros((*im.shape[:2], 4), np.uint8)
out[..., :3] = im
out[..., 3] = mask * 255
Image.fromarray(out).save(OUT)
write_meta(OUT)
print('rails', int(mask.sum()), 'pixels ->', os.path.normpath(OUT))

if len(sys.argv) > 1:
    view = Image.new('RGBA', (640, 360), (20, 20, 40, 255))
    view.alpha_composite(Image.fromarray(out))
    view.crop((0, 240, 640, 300)).resize((1280, 120), Image.NEAREST).save(sys.argv[1])
