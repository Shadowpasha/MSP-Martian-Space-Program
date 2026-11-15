"""Build the six crew walker atlases from the shared menu walk cycle.

Each crew member reuses the walk in art/menu_crew_walk/ (Sprite AI, 4x, facing right):
  - the orange suit is recoloured to their outfit by brightness band,
  - the head is replaced with theirs, cut from art/crew_v2/fullbody_source.webp
    (six full-body sprites on magenta, in CREW order) and scaled by HEAD_SCALE,
  - a 3x3 role patch is drawn on the upper arm,
  - then each frame is brightened a little and given a dark one-pixel outline (pop) so it reads
    against the station painting.
Idle is the standing frame with a one-pixel breathing bob on the upper body.

Atlas per member (8x4 grid of 40x64 cells, like menu_walker.png):
  row 0  walk loop facing right (7 frames)    row 1  the same facing left
  row 2  idle facing right (6 frames)         row 3  the same facing left
Feet sit on y=62, head centre near x=20.

Usage: python crew_walkers.py [outdir]   (default: assets/textures, with nearest-filter .meta files)
"""
import colorsys
import glob
import json
import os
import sys
import uuid

import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.join(HERE, '..')
WALK = os.path.join(HERE, 'menu_crew_walk')
SHEET = os.path.join(HERE, 'crew_v2', 'fullbody_source.webp')
OUTDIR = sys.argv[1] if len(sys.argv) > 1 else os.path.join(REPO, 'assets', 'textures')

H4 = 214            # walker height in the 4x walk frames
HEAD_ROWS = 31      # walker rows that are head, cleared before the new head goes on
HEAD_CUT = 35       # rows of the scaled crew sprite taken as head
HEAD_SCALE = 0.8
CELL_W, CELL_H, BASE_Y = 40, 64, 62

CREAM = [(62, 46, 58), (101, 79, 83), (146, 121, 107), (189, 166, 140), (221, 205, 178), (240, 229, 206)]
RUST = [(40, 14, 20), (70, 22, 26), (100, 32, 30), (128, 42, 34), (152, 54, 40), (182, 76, 52)]
NAVY = [(10, 10, 22), (18, 20, 36), (26, 30, 50), (34, 40, 64), (46, 52, 82), (66, 74, 106)]
ORANGE = None       # keep the walker's own orange

# patch: 3x3 native pixels, '.' = leave the suit
CREW = [
    dict(role='engineer', suit=ORANGE, stripe=None,
         patch=['NWN', 'NNN', 'WNW'], colours={'N': (34, 36, 62), 'W': (236, 222, 196)}),
    dict(role='botanist', suit=CREAM, stripe=[(84, 140, 64), (84, 140, 64)],
         patch=['.G.', 'GLG', '.G.'], colours={'G': (74, 120, 48), 'L': (150, 190, 90)}),
    dict(role='pilot', suit=RUST, stripe=None,
         patch=['.Y.', 'YYY', '...'], colours={'Y': (236, 182, 60)}),
    dict(role='medic', suit=CREAM, stripe=None,
         patch=['.R.', 'RRR', '.R.'], colours={'R': (200, 30, 30)}),
    dict(role='scientist', suit=CREAM, stripe=None,
         patch=['BBB', 'BCB', 'BBB'], colours={'B': (46, 70, 150), 'C': (150, 200, 240)}),
    dict(role='captain', suit=NAVY, stripe=None,
         patch=['Y.Y', '.Y.', '...'], colours={'Y': (236, 176, 60)}),
]


def shrink(frame):
    """4x pixel art back to 1x: average 4x4 blocks, keep alpha crisp (same as menu_walker.py)."""
    w, h = frame.width // 4, frame.height // 4
    rgba = np.asarray(frame.convert('RGBA')).astype(np.float32)
    alpha = rgba[..., 3:] / 255
    pre = np.dstack([rgba[..., :3] * alpha, alpha * 255]).clip(0, 255).astype(np.uint8)
    small = np.asarray(Image.fromarray(pre, 'RGBA').resize((w, h), Image.BOX)).astype(np.float32)
    a = small[..., 3] / 255
    col = small[..., :3] / np.maximum(a[..., None], 1e-3)
    return Image.fromarray(np.dstack([col.clip(0, 255), (a > 0.5) * 255]).astype(np.uint8), 'RGBA')


def crew_sprites():
    """The six full-body sprites, left to right, keyed off the magenta with the fringe cleaned."""
    src = np.asarray(Image.open(SHEET).convert('RGB')).astype(int)
    r, g, b = src[..., 0], src[..., 1], src[..., 2]
    key = (r > 170) & (g < 110) & (b > 120) & (r - g > 110)
    lab, _ = ndimage.label(ndimage.binary_closing(~key, iterations=3))
    boxes = [s for i, s in enumerate(ndimage.find_objects(lab)) if (lab[s] == i + 1).sum() > 5000]
    boxes.sort(key=lambda s: s[1].start)
    assert len(boxes) == 6, f'expected 6 figures, found {len(boxes)}'
    spill = np.minimum(r, b) - g
    alpha = np.where(key | (spill > 70), 0, 255)
    tint = spill > 8
    rr = np.where(tint, g + (r - g) // 4, r)
    bb = np.where(tint, g + (b - g) // 4, b)
    rgba = np.dstack([rr, g, bb, alpha]).clip(0, 255).astype(np.uint8)
    out = []
    for s in boxes:
        im = Image.fromarray(rgba[s])
        out.append(im.crop(im.getbbox()))
    return out


def head_of(sprite):
    """Cut the head (and hair) from a full-body sprite at walker scale, then apply HEAD_SCALE."""
    hs = sprite.resize((round(sprite.width * H4 / sprite.height), H4), Image.LANCZOS)
    a = np.asarray(hs).copy()
    a[..., 3] = np.where(a[..., 3] > 128, 255, 0)
    head = a[:HEAD_CUT].copy()
    cols = np.nonzero(head[:12, :, 3].any(0))[0]
    x0, x1 = cols.min(), cols.max()
    head[:, :max(0, x0 - 3), 3] = 0          # backpack on the left
    head[:, x1 + 3:, 3] = 0
    head[26:, :x0 + 2, 3] = 0                # collar scraps behind the neck
    img = Image.fromarray(head)
    img = img.crop(img.getbbox())
    full_h = img.height
    img = img.resize((round(img.width * HEAD_SCALE), round(img.height * HEAD_SCALE)), Image.LANCZOS)
    ha = np.asarray(img).copy()
    ha[..., 3] = np.where(ha[..., 3] > 128, 255, 0)
    hx = np.nonzero(ha[:10, :, 3].any(0))[0]
    return Image.fromarray(ha), (hx.min() + hx.max()) / 2, full_h - img.height


def remapper(member):
    suit, stripe = member['suit'], member['stripe']

    def remap(c):
        h, s, v = colorsys.rgb_to_hsv(*(np.array(c) / 255))
        hue = h * 360
        if s > 0.6 and 40 <= hue <= 60:          # yellow leg stripe
            if stripe:
                return stripe[1] if v > 0.99 and c[1] > 200 else stripe[0]
            if suit is None:
                return c
            return suit[5]
        if s > 0.6 and (hue < 40 or hue > 350):  # orange suit, by brightness band
            if suit is None or v < 0.12:
                return c
            for i, edge in enumerate([0.25, 0.4, 0.6, 0.8, 0.9]):
                if v < edge:
                    return suit[i]
            return suit[5]
        return c
    return remap


def build(member, sprite, walk4):
    head, head_cx, head_drop = head_of(sprite)
    remap = remapper(member)
    frames = []
    for src in walk4:
        im = np.asarray(src).copy()
        cache = {}
        ys, xs = np.nonzero(im[..., 3])
        for y, x in zip(ys, xs):
            c = tuple(int(v) for v in im[y, x, :3])
            if c not in cache:
                cache[c] = np.clip(remap(c), 0, 255)
            im[y, x, :3] = cache[c]
        top = ys.min()
        cols = np.nonzero(im[top:top + 12, :, 3].any(0))[0]
        cx = (cols.min() + cols.max()) / 2
        im[:top + HEAD_ROWS, :, 3] = 0
        frame = Image.fromarray(im)
        frame.alpha_composite(head, (int(round(cx - head_cx + 3)), int(top - 2 + head_drop)))
        d = np.asarray(frame).copy()
        px, py = int(round(cx - 6)), top + 52
        for j, row in enumerate(member['patch']):
            for i, ch in enumerate(row):
                if ch != '.':
                    d[py + 4 * j:py + 4 * j + 4, px + 4 * i:px + 4 * i + 4] = (*member['colours'][ch], 255)
        frames.append(shrink(Image.fromarray(d)))
    return frames


def idle_from(stand):
    sa = np.asarray(stand)
    ys = np.nonzero(sa[..., 3].any(1))[0]
    waist = ys.min() + (ys.max() - ys.min()) * 45 // 100
    out = []
    for off in [0, 0, 1, 1, 1, 0]:
        d = sa.copy()
        if off:
            up = sa[:waist].copy()
            d[:waist] = 0
            m = up[..., 3] > 0
            d[off:waist + off][m] = up[m]
        out.append(Image.fromarray(d))
    return out


OUTLINE = (12, 8, 22, 255)


def pop(cell):
    """Make a sprite read against the busy station: a little brighter and more saturated, with a
    one-pixel dark outline around the silhouette."""
    from PIL import ImageEnhance
    a = np.asarray(cell).copy()
    rgb = Image.fromarray(a[..., :3])
    rgb = ImageEnhance.Color(ImageEnhance.Brightness(rgb).enhance(1.18)).enhance(1.2)
    a[..., :3] = np.asarray(rgb)
    m = a[..., 3] > 0
    ring = m.copy()
    ring[1:] |= m[:-1]
    ring[:-1] |= m[1:]
    ring[:, 1:] |= m[:, :-1]
    ring[:, :-1] |= m[:, 1:]
    a[ring & ~m] = OUTLINE
    return Image.fromarray(a)


def place(frame, ref_box):
    """Into a 40x64 cell: feet on BASE_Y, head centre at x=20 (same anchor for every frame)."""
    cell = Image.new('RGBA', (CELL_W, CELL_H), (0, 0, 0, 0))
    cell.alpha_composite(frame, (int(CELL_W / 2 - ref_box[0]), int(BASE_Y - ref_box[1])))
    return pop(cell)


def write_meta(path):
    """Texture settings like art/export.mjs: nearest filter, clamp, keep an existing uuid."""
    target = path + '.meta'
    previous = {}
    if os.path.exists(target):
        with open(target, encoding='utf8') as f:
            previous = json.load(f)
    settings = {
        'uuid': previous.get('uuid', str(uuid.uuid4())), 'version': '2.0', 'type': 'texture',
        'importer': {'maxSize': 2048, 'filterMode': 'nearest', 'wrapMode': 'clamp', 'mipmaps': False,
                     'premultiplyAlpha': False, 'sliceBorder': {'left': 0, 'right': 0, 'top': 0, 'bottom': 0}},
    }
    with open(target, 'w', encoding='utf8', newline='\n') as f:
        f.write(json.dumps(settings, indent=2) + '\n')


def main():
    os.makedirs(OUTDIR, exist_ok=True)
    paths = sorted(glob.glob(os.path.join(WALK, 'frame-*.png')), key=lambda p: int(p.rsplit('-', 1)[1].split('.')[0]))
    walk4 = [Image.open(p).convert('RGBA') for p in paths]
    sprites = crew_sprites()
    # one anchor for all frames: head centre and feet of the standing frame
    stand = shrink(walk4[0])
    sa = np.asarray(stand)[..., 3] > 0
    ys, xs = np.nonzero(sa)
    head_x = np.nonzero(sa[ys.min():ys.min() + 6].any(0))[0].mean()
    anchor = (head_x, ys.max())
    sheets = {}
    for member, sprite in zip(CREW, sprites):
        frames = build(member, sprite, walk4)
        loop, idle = frames[:-1], idle_from(frames[0])
        atlas = Image.new('RGBA', (CELL_W * 8, CELL_H * 4), (0, 0, 0, 0))
        for row, seq in ((0, loop), (2, idle)):
            for i, f in enumerate(seq):
                cell = place(f, anchor)
                atlas.paste(cell, (i * CELL_W, row * CELL_H))
                atlas.paste(cell.transpose(Image.FLIP_LEFT_RIGHT), (i * CELL_W, (row + 1) * CELL_H))
        path = os.path.join(OUTDIR, f"crew_walk_{member['role']}.png")
        atlas.save(path)
        write_meta(path)
        sheets[member['role']] = atlas
        print(member['role'], '->', os.path.normpath(path))
    return sheets


if __name__ == '__main__':
    main()
