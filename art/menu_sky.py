"""Sky layers for the main menu window, cut from the painting.

Writes (assets/textures):
  menu_glow_sky_clear.png   the sky behind the clouds above the sun: only the cloud pixels, filled with
                            the surrounding sky colour (everything else stays the painting's own)
  menu_sky_clouds.png       the painting's cloud streaks alone, as a strip that tiles horizontally
  menu_glow_window_front.png  everything in the window band that is not sky (bars, wall, mountains,
                              dish, dome, ground): drawn over the moving clouds, stars and shuttle
Usage: python menu_sky.py [preview.png]
"""
import json
import os
import sys
import uuid
from PIL import Image
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
TEXTURES = os.path.join(HERE, '..', 'assets', 'textures')
paint = Image.open(os.path.join(TEXTURES, 'menu_station_empty.png')).convert('RGB')
a = np.asarray(paint).astype(np.float32)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
H, W = r.shape

# The window band: from under the top frame down past the ground, across the whole window.
BX0, BY0, BX1, BY1 = 165, 28, 640, 152
band = np.zeros((H, W), bool)
band[BY0:BY1, BX0:BX1] = True

# Only the sky above the sun moves: the sun's top edge is the limit, so nothing near the
# horizon (the distant mountains) is touched.
warm = band & (r > 135) & (r - b > 45)
sun_all = warm & (r > 225) & (g > 150)
sun_all[:, :450] = False          # the sun sits around x 460-510; ignore bright pixels elsewhere
sun_all[:, 520:] = False
sun_all[:50] = False
SKY_BOTTOM = int(np.nonzero(sun_all.any(1))[0].min())
sky = warm & (np.arange(H)[:, None] < SKY_BOTTOM)
sun = sky & (r > 225) & (g > 150)

# Clear sky: a heavy blur of the sky pixels only (normalised), which melts the streaks away.
def blur(img: np.ndarray, radius: int) -> np.ndarray:
    """Box blur via cumulative sums (rows, then columns)."""
    out = img.astype(np.float64)
    for axis in (0, 1):
        pad = [(0, 0), (0, 0)]
        pad[axis] = (radius + 1, radius)
        c = np.cumsum(np.pad(out, pad, mode='edge'), axis=axis)
        hi = np.take(c, range(2 * radius + 1, c.shape[axis]), axis=axis)
        lo = np.take(c, range(0, c.shape[axis] - 2 * radius - 1), axis=axis)
        out = (hi - lo) / (2 * radius + 1)
    return out.astype(np.float32)
# Clear sky, row by row: the median of the sky pixels in a wide window around each pixel. Clouds
# are thin streaks, so the median skips them and gives the sky colour behind.
WINDOW = 40
clear = a.copy()
for y in range(BY0, SKY_BOTTOM):
    xs = np.nonzero(sky[y])[0]
    if not len(xs):
        continue
    row = a[y, xs]
    for i, x in enumerate(xs):
        near = (xs >= x - WINDOW) & (xs <= x + WINDOW)
        clear[y, x] = np.median(row[near], axis=0)
clear[sun] = a[sun]


def grow(mask: np.ndarray, n: int) -> np.ndarray:
    return blur(mask.astype(np.float32), n) > 1e-3
diff = np.abs(a - clear).sum(-1)
inner_sky = ~grow(~sky, 1)
rough = inner_sky & ~grow(sun, 3) & (diff > 12)


def clean(mask: np.ndarray) -> np.ndarray:
    """Keep only clear cloud streaks: close 1-pixel gaps along rows, keep runs of 3+ pixels,
    then drop any streak smaller than 8 pixels (8-connected)."""
    m = mask.copy()
    m[:, 1:-1] |= mask[:, :-2] & mask[:, 2:] & sky[:, 1:-1]          # close 1-px gaps in a row
    keep = np.zeros_like(m)
    for y in range(m.shape[0]):
        x = 0
        row = m[y]
        while x < len(row):
            if row[x]:
                end = x
                while end < len(row) and row[end]:
                    end += 1
                if end - x >= 3:
                    keep[y, x:end] = True
                x = end
            else:
                x += 1
    seen = np.zeros_like(keep)
    out = np.zeros_like(keep)
    for y0, x0 in zip(*np.nonzero(keep)):
        if seen[y0, x0]:
            continue
        stack, blob = [(y0, x0)], []
        seen[y0, x0] = True
        while stack:
            y, x = stack.pop()
            blob.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = y + dy, x + dx
                    if 0 <= ny < keep.shape[0] and 0 <= nx < keep.shape[1] and keep[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
        if len(blob) >= 8:
            for y, x in blob:
                out[y, x] = True
    return out


cloud = clean(rough)


def save(name: str, rgba: np.ndarray) -> None:
    path = os.path.join(TEXTURES, name)
    Image.fromarray(rgba.clip(0, 255).astype(np.uint8), 'RGBA').save(path)
    if not os.path.exists(path + '.meta'):
        with open(path + '.meta', 'w') as f:
            json.dump({'uuid': str(uuid.uuid4()), 'version': '2.0', 'type': 'texture', 'importer': {
                'maxSize': 2048, 'filterMode': 'nearest', 'wrapMode': 'clamp', 'mipmaps': False, 'premultiplyAlpha': False,
                'sliceBorder': {'left': 0, 'right': 0, 'top': 0, 'bottom': 0}}}, f, indent=2)


# Where a cloud sat, fill with the clear sky; everywhere else the painting stays as it is.
save('menu_glow_sky_clear.png', np.dstack([clear, rough * 255.0]))
save('menu_glow_window_front.png', np.dstack([a, (band & ~sky) * 255.0]))


# The cloud strip: the band's sky rows, clouds only. It is drawn twice side by side and scrolls.
y0, y1 = BY0, SKY_BOTTOM
strip = np.zeros((y1 - y0, BX1 - BX0, 4), np.float32)
strip[..., :3] = a[y0:y1, BX0:BX1]
strip[..., 3] = cloud[y0:y1, BX0:BX1] * 255.0
# Clear margins at both ends, so the clouds can sway a few pixels without crossing the window's edges.
strip[:, :6, 3] = 0
strip[:, -6:, 3] = 0
save('menu_sky_clouds.png', strip)
print('sky above y', SKY_BOTTOM, int(sky.sum()), 'clouds', int(cloud.sum()), 'strip', strip.shape[1], 'x', strip.shape[0])

if len(sys.argv) > 1:
    shot = paint.convert('RGBA')
    shot.alpha_composite(Image.open(os.path.join(TEXTURES, 'menu_glow_sky_clear.png')))
    clear_only = shot.copy()
    clouds = Image.open(os.path.join(TEXTURES, 'menu_sky_clouds.png'))
    shot.alpha_composite(clouds, (BX0 + 4, y0))
    shot.alpha_composite(Image.open(os.path.join(TEXTURES, 'menu_glow_window_front.png')))
    out = Image.new('RGB', (960, 320))
    out.paste(clear_only.crop((160, 0, 640, 80)).resize((960, 160), Image.NEAREST), (0, 0))
    out.paste(shot.crop((160, 0, 640, 80)).convert('RGB').resize((960, 160), Image.NEAREST), (0, 160))
    out.save(sys.argv[1])
