"""Build the EVA astronaut atlas for the expedition scene (Site A).

Sources (Sprite AI, 4x, transparent, facing right):
  art/menu_crew_walk/frame-*.png   the orange crew member's walk (the last frame repeats the first)
  art/eva_walker/hop_atlas.png     his low-gravity hop: 8 frames of 256x256 in a 3x3 sheet
Both are shrunk to game pixels, then the head is replaced by a hand-drawn EVA helmet (white dome,
gold visor, grey neck ring), and every frame is brightened a little and outlined like the crew.

Atlas (8x4 grid of 40x64 cells, like the crew walkers):
  row 0  walk loop facing right (7 frames)    row 1  the same facing left
  row 2  hop facing right (8 frames)          row 3  the same facing left
Every frame is centred on its head (x=20). The walk stands on y=62; the hop keeps its own up-and-down
motion, placed so its standing frame lines up with the walk.
Usage: python eva_walker.py [preview.gif]
"""
import glob
import math
import os
import sys

import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from crew_walkers import CELL_H, CELL_W, BASE_Y, pop, shrink, write_meta  # noqa: E402

OUT = os.path.join(HERE, '..', 'assets', 'textures', 'eva_walker.png')
HOP = os.path.join(HERE, 'eva_walker', 'hop_atlas.png')
WALK = os.path.join(HERE, 'menu_crew_walk')
HEAD_ROWS = 11      # rows of a frame from the top of the head down to the chin
# One hop for the preview, as (hop frame, ms); src/ui/evaWalker.ts uses the same. The sheet's own order
# (stand, half crouch, take-off, three tucks, two crouches) has no wind-up and tucks while still
# rising, so it is replayed as a jump: half crouch, crouch, take off, tuck, float at the top, tuck
# coming down, land in the crouch, half crouch, stand. HOP_AIR: the steps off the ground (inclusive); HOP_LIFT: extra float
# at the top (screen px); HOP_DRIFT: how far one hop carries him.
# (frame, ms, sink): sink lowers the coming-down tuck to the ground, as the in-between pose going into
# and getting out of the crouch.
HOP_SEQ = [(1, 140, 0), (5, 140, 8), (7, 240, 0), (2, 150, 0), (3, 260, 0), (4, 460, 0), (5, 300, 0), (6, 300, 0), (5, 160, 8), (1, 180, 0)]
HOP_AIR = (3, 6)
# Sheet frames with his feet on the ground: standing (0), half crouch (1), crouches (6, 7).
HOP_GROUNDED = (0, 1, 6, 7)
HOP_LIFT = 7
HOP_DRIFT = 45

# The helmet, facing right: O outline, W white, L light shade, S shadow, V visor, v visor shade,
# h visor glint, G neck ring.
HELMET = [
    '....OOOO....',
    '..OOWWWWOO..',
    '.OWWWWWWWWO.',
    '.OWWWWWWVVVO',
    'OWWWWWWVVhVO',
    'OWWWWWWVVVVO',
    'OLWWWWWVVvVO',
    'OLWWWWWVvvvO',
    'OLLWWWWWVvvO',
    '.OLLLLWWWWO.',
    '..OSSSSSSO..',
    '..OGGGGGGO..',
]
# Muted and warm, shaded like the suit, so the helmet does not outshine the rest of him (the frame is
# brightened a little afterwards, with the crew's pop()).
COLOURS = {
    'O': (22, 18, 28), 'W': (178, 170, 168), 'L': (146, 136, 138), 'S': (104, 94, 104),
    'V': (178, 112, 40), 'v': (116, 66, 28), 'h': (214, 170, 110), 'G': (84, 80, 92),
}


def helmet(frame):
    """Replace the head (hair and face) with the helmet, centred on where the head was."""
    a = np.asarray(frame).copy()
    ys, xs = np.nonzero(a[..., 3])
    top = ys.min()
    cols = np.nonzero(a[top:top + 6, :, 3].any(0))[0]
    cx = (cols.min() + cols.max()) / 2
    a[top:top + HEAD_ROWS - 1, int(cx) - 7:int(cx) + 7] = 0
    x0 = int(round(cx - len(HELMET[0]) / 2 + 0.5))
    y0 = top - 1
    for j, row in enumerate(HELMET):
        for i, ch in enumerate(row):
            if ch != '.' and 0 <= y0 + j < a.shape[0] and 0 <= x0 + i < a.shape[1]:
                a[y0 + j, x0 + i] = (*COLOURS[ch], 255)
    return Image.fromarray(a)


def cell(frame, dx, dy):
    c = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
    c.alpha_composite(frame, (dx, dy))
    return pop(c)


def anchor(frame):
    """Offset that puts this frame's head centre at x=20 and its feet on BASE_Y."""
    a = np.asarray(frame)[..., 3] > 0
    ys, xs = np.nonzero(a)
    cols = np.nonzero(a[ys.min():ys.min() + 6].any(0))[0]
    return int(round(CELL_W / 2 - (cols.min() + cols.max()) / 2)), int(BASE_Y - ys.max())


def main():
    paths = sorted(glob.glob(os.path.join(WALK, 'frame-*.png')), key=lambda p: int(p.rsplit('-', 1)[1].split('.')[0]))
    walk = [helmet(shrink(Image.open(p).convert('RGBA'))) for p in paths][:-1]
    sheet = Image.open(HOP).convert('RGBA')
    hop = [helmet(shrink(sheet.crop(((i % 3) * 256, (i // 3) * 256, (i % 3) * 256 + 256, (i // 3) * 256 + 256)))) for i in range(8)]

    atlas = Image.new('RGBA', (CELL_W * 8, CELL_H * 4), (0, 0, 0, 0))
    for i, f in enumerate(walk):
        c = cell(f, *anchor(f))
        atlas.paste(c, (i * CELL_W, 0))
        atlas.paste(c.transpose(Image.FLIP_LEFT_RIGHT), (i * CELL_W, CELL_H))
    # The hop rises and lands within its frames: keep that (one vertical offset, from the standing
    # first frame), but centre every frame on its head so it hops in place; the game moves him along.
    # Frames with his feet on the ground stand exactly on the ground line; the airborne ones keep
    # their own height above it (measured from the standing first frame).
    _, dy = anchor(hop[0])
    for i, f in enumerate(hop):
        ax, ay = anchor(f)
        c = cell(f, ax, ay if i in HOP_GROUNDED else dy)
        atlas.paste(c, (i * CELL_W, CELL_H * 2))
        atlas.paste(c.transpose(Image.FLIP_LEFT_RIGHT), (i * CELL_W, CELL_H * 3))
    atlas.save(OUT)
    write_meta(OUT)
    print('eva walker ->', os.path.normpath(OUT))

    if len(sys.argv) > 1:
        # Preview at game size (2x) on Site A beside the rover: hops, pauses, a turn, hops back.
        site = Image.open(os.path.join(HERE, '..', 'assets', 'textures', 'tharsis_site.png')).convert('RGBA')
        site = site.resize((site.width * 2, site.height * 2), Image.NEAREST).crop((560, 300, 920, 520))
        C = lambda col, row: atlas.crop((col * CELL_W, row * CELL_H, col * CELL_W + CELL_W, row * CELL_H + CELL_H)).resize((80, 128), Image.NEAREST)
        frames, durations, x = [], [], 40.0
        # Like the game: hop, stand about, hop, turn round, stand, hop back.
        air_steps = HOP_AIR[1] - HOP_AIR[0] + 1
        hop_right = [(2, frame, ms, step, sink) for step, (frame, ms, sink) in enumerate(HOP_SEQ)]
        hop_left = [(3, frame, ms, step, sink) for step, (frame, ms, sink) in enumerate(HOP_SEQ)]
        stand = lambda row, ms: [(row, 0, ms, -1, 0)]
        for row, col, ms, step, sink in hop_right + stand(2, 4000) + hop_right + stand(2, 2500) + stand(3, 3000) + hop_left + hop_left + stand(3, 3000):
            shot = site.copy()
            lift = -sink
            if HOP_AIR[0] <= step <= HOP_AIR[1]:
                along = (step - HOP_AIR[0] + 0.5) / air_steps
                x += (HOP_DRIFT if row == 2 else -HOP_DRIFT) / air_steps
                lift = round(math.sin(math.pi * along) * HOP_LIFT)
            shot.alpha_composite(C(col, row), (int(x) - 40, 190 - 124 - lift))
            frames.append(shot.convert('P', palette=Image.ADAPTIVE))
            durations.append(ms)
        frames[0].save(sys.argv[1], save_all=True, append_images=frames[1:], duration=durations, loop=0)


if __name__ == '__main__':
    main()
