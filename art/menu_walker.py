"""Build the main menu walker atlas (8x4 grid of 40x64 frames, 640-space pixels).

Sources:
  art/menu_crew_upload.png    the painted crew member's back view, cut from the menu painting
                              (native size). Its 4x copy on a 256x256 canvas,
                              menu_crew_upload_256.png, was the reference uploaded to Sprite AI.
  art/menu_crew_walk/*.png    Sprite AI's walk animation from that reference: transparent
                              256x256 frames drawn at 4x, facing right. Frame 1 is standing
                              side-on; the last frame repeats it, so the loop skips it.

Atlas:
  row 0  cells 0-6   walk loop facing right       row 1  cells 8-14  the same facing left
  row 2  cell 16     back view (at the console)   cell 17 side standing right, 18 side standing left
Every frame is aligned by its head centre (x) and feet (baseline).
Usage: python menu_walker.py [preview.gif]
"""
import glob
import os
import sys
from PIL import Image
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'assets', 'textures', 'menu_walker.png')
CELL_W, CELL_H = 40, 64
HEAD_X, BASE_Y = 20, 62   # where the head centre and the feet land inside a frame
SOURCE_SCALE = 4          # Sprite AI frames are drawn at 4x the painting's pixels


def place(sprite: Image.Image) -> Image.Image:
    """Put a native-size sprite into a cell, head centre at HEAD_X and feet on BASE_Y."""
    a = np.asarray(sprite)[..., 3] > 0
    ys, xs = np.nonzero(a)
    top, bottom = ys.min(), ys.max()
    head = np.nonzero(a[top:top + max(2, (bottom - top) // 6)])[1]
    hx = head.mean()
    cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
    cell.alpha_composite(sprite, (int(round(HEAD_X - hx)), int(BASE_Y - bottom)))
    return cell


def shrink(frame: Image.Image) -> Image.Image:
    """4x pixel art back to painting pixels: average each 4x4 block, keep alpha crisp."""
    w, h = frame.width // SOURCE_SCALE, frame.height // SOURCE_SCALE
    rgba = np.asarray(frame.convert('RGBA')).astype(np.float32)
    alpha = rgba[..., 3:] / 255
    premult = np.dstack([rgba[..., :3] * alpha, alpha * 255]).clip(0, 255).astype(np.uint8)
    small = np.asarray(Image.fromarray(premult, 'RGBA').resize((w, h), Image.BOX)).astype(np.float32)
    a = small[..., 3] / 255
    colour = small[..., :3] / np.maximum(a[..., None], 1e-3)
    return Image.fromarray(np.dstack([colour.clip(0, 255), (a > 0.5) * 255]).astype(np.uint8), 'RGBA')


walk = [shrink(Image.open(path)) for path in sorted(glob.glob(os.path.join(HERE, 'menu_crew_walk', 'frame-*.png')),
                                                       key=lambda p: int(p.rsplit('-', 1)[1].split('.')[0]))]
loop = walk[:-1]
back = Image.open(os.path.join(HERE, 'menu_crew_upload.png')).convert('RGBA')

atlas = Image.new('RGBA', (CELL_W * 8, CELL_H * 4), (0, 0, 0, 0))
for i, frame in enumerate(loop[:8]):
    cell = place(frame)
    atlas.paste(cell, (i * CELL_W, 0))
    atlas.paste(cell.transpose(Image.FLIP_LEFT_RIGHT), (i * CELL_W, CELL_H))
atlas.paste(place(back), (0, CELL_H * 2))
side = place(walk[0])
atlas.paste(side, (CELL_W, CELL_H * 2))
atlas.paste(side.transpose(Image.FLIP_LEFT_RIGHT), (CELL_W * 2, CELL_H * 2))
atlas.save(OUT)
print('walk loop frames', len(loop), '->', os.path.normpath(OUT))

if len(sys.argv) > 1:
    # Preview at game size (2x) over the deck: back view, then a few walk loops.
    bg = Image.open(os.path.join(HERE, '..', 'assets', 'textures', 'menu_station_empty.png')).convert('RGBA')
    deck = bg.crop((330, 199, 410, 263))
    frames, durations = [], []
    sequence = [(16, 900), (17, 300)] + [(i, 100) for i in range(len(loop))] * 4 + [(17, 300), (16, 900)]
    for cell_index, ms in sequence:
        cx, cy = (cell_index % 8) * CELL_W, (cell_index // 8) * CELL_H
        shot = deck.copy()
        shot.alpha_composite(atlas.crop((cx, cy, cx + CELL_W, cy + CELL_H)), (20, 0))
        frames.append(shot.resize((shot.width * 4, shot.height * 4), Image.NEAREST).convert('P', palette=Image.ADAPTIVE))
        durations.append(ms)
    frames[0].save(sys.argv[1], save_all=True, append_images=frames[1:], duration=durations, loop=0)
