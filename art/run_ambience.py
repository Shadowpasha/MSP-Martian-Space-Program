"""Ambience layers for the expedition backgrounds (tharsis_station.png, tharsis_site.png).

Same approach as the main menu (menu_glow.py, menu_sky.py): every layer is cut from the painting
itself, so each glow has the exact shape of what glows and the clouds keep their colours.
For each scene <s> (station, site) it writes assets/textures/run_<s>_<layer>.png (640x360):
  sky_clear  the sky behind the clouds above the sun (only the cloud pixels, filled with sky)
  clouds     the clouds above the sun alone, with clear margins (the game sways them)
  front      what is not sky in the cloud band (window bars), drawn over the moving clouds
  <glow>     bright pixels of one thing (lamps, plants, dome, vents...), lifted towards white
Usage: python run_ambience.py
"""
import json
import os
import uuid
from PIL import Image
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
TEXTURES = os.path.join(HERE, '..', 'assets', 'textures')


def save(name: str, rgba: np.ndarray) -> None:
    path = os.path.join(TEXTURES, name)
    Image.fromarray(rgba.clip(0, 255).astype(np.uint8), 'RGBA').save(path)
    if not os.path.exists(path + '.meta'):
        with open(path + '.meta', 'w') as f:
            json.dump({'uuid': str(uuid.uuid4()), 'version': '2.0', 'type': 'texture', 'importer': {
                'maxSize': 2048, 'filterMode': 'nearest', 'wrapMode': 'clamp', 'mipmaps': False, 'premultiplyAlpha': False,
                'sliceBorder': {'left': 0, 'right': 0, 'top': 0, 'bottom': 0}}}, f, indent=2)


def box_mask(shape, x0, y0, x1, y1):
    m = np.zeros(shape, bool)
    m[y0:y1, x0:x1] = True
    return m


def ellipse(shape, cx, cy, rx, ry):
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    return (((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2 <= 1) & (yy <= cy)


def clean_streaks(mask: np.ndarray, sky: np.ndarray) -> np.ndarray:
    """Keep clear cloud streaks: close 1-px gaps in rows, keep runs of 3+, drop blobs under 8 px."""
    m = mask.copy()
    m[:, 1:-1] |= mask[:, :-2] & mask[:, 2:] & sky[:, 1:-1]
    keep = np.zeros_like(m)
    for y in range(m.shape[0]):
        row, x = m[y], 0
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
    seen, out = np.zeros_like(keep), np.zeros_like(keep)
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


def build(scene: str, source: str, band, sun_box, glows) -> None:
    a = np.asarray(Image.open(os.path.join(TEXTURES, source)).convert('RGB')).astype(np.float32)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    shape = r.shape
    bx0, by0, bx1 = band
    # The sun's top edge limits the cloud band, so nothing near the horizon is touched.
    sun = box_mask(shape, *sun_box) & (r > 225) & (g > 150)
    sun_top = int(np.nonzero(sun.any(1))[0].min())
    band_mask = box_mask(shape, bx0, by0, bx1, sun_top)
    sky = band_mask & (r > 110) & (r - b > 25)
    # Sky colour behind the clouds, row by row: a wide median of the sky pixels skips the streaks.
    clear = a.copy()
    for y in range(by0, sun_top):
        xs = np.nonzero(sky[y])[0]
        row = a[y, xs]
        for x in xs:
            near = (xs >= x - 40) & (xs <= x + 40)
            clear[y, x] = np.median(row[near], axis=0)
    diff = np.abs(a - clear).sum(-1)
    inner = sky.copy()
    inner[:, 1:] &= sky[:, :-1]
    inner[:, :-1] &= sky[:, 1:]
    rough = inner & (diff > 12)
    cloud = clean_streaks(rough, sky)
    save(f'run_{scene}_sky_clear.png', np.dstack([clear, rough * 255.0]))
    strip = np.dstack([a, cloud * 255.0])[by0:sun_top, bx0:bx1].copy()
    strip[:, :6, 3] = 0
    strip[:, -6:, 3] = 0
    save(f'run_{scene}_clouds.png', strip)
    save(f'run_{scene}_front.png', np.dstack([a, (band_mask & ~sky) * 255.0]))
    print(scene, 'cloud band', (bx0, by0, bx1, sun_top), 'clouds', int(cloud.sum()))

    colours = {
        'cream': (r > 225) & (g > 205) & (b > 150),
        'hot': (r > 190) & (g > 100) & (b < 120) & (r - b > 90),
        'bright': (r > 225) & (g > 190),
        'lamp': (r > 230) & (g > 170) & (b < 170) & (r - b > 70),      # warm headlights and roof lamps, not white paint
        'leaf': (g > 170) & (g > r + 10) & (b < 140),
        'violet': (b > 110) & (b > g + 25) & (r > 70),
        'cyan': (b > 170) & (g > 150) & (r < 140),
    }
    lifted = a + (255 - a) * 0.45
    for name, (colour, area) in glows.items():
        mask = colours[colour] & (ellipse(shape, *area[1:]) if area[0] == 'ellipse' else box_mask(shape, *area[1:]))
        save(f'run_{scene}_{name}.png', np.dstack([lifted, mask * 255.0]))
        print(' ', name, int(mask.sum()), 'px')


build('station', 'tharsis_station.png', band=(5, 30, 635), sun_box=(480, 40, 545, 90), glows={
    'dome': ('violet', ('ellipse', 420, 112, 25, 18)),
    'grow': ('cream', ('box', 340, 165, 420, 250)),
    'leaves': ('leaf', ('box', 340, 165, 420, 245)),
    'lamps': ('cream', ('box', 0, 140, 640, 172)),
    'wall_lamps': ('hot', ('box', 150, 182, 495, 202)),
    'screens': ('cyan', ('box', 245, 220, 480, 245)),
    'vents': ('hot', ('box', 100, 314, 615, 338)),
})
build('site', 'tharsis_site.png', band=(0, 0, 640), sun_box=(455, 25, 525, 80), glows={
    'dome': ('violet', ('ellipse', 105, 122, 14, 8)),
    'rover_lights': ('lamp', ('box', 450, 198, 497, 216)),
    'rover_roof': ('lamp', ('box', 418, 160, 470, 176)),
    'beacon': ('bright', ('box', 563, 178, 588, 202)),
})


# ---- Moving parts (copies the game moves) ----
def parts() -> None:
    st = np.asarray(Image.open(os.path.join(TEXTURES, 'tharsis_station.png')).convert('RGB')).astype(np.float32)
    shape = st.shape[:2]
    # Crane above the rover: the trolley block clamped on the beam (rows 171-185) and, below it,
    # only the chain's and hook's own lit pixels (the wall behind is as dark as their outline, so
    # dark pixels are left out and the wall never moves). The fill covers the painted crane with
    # the beam and wall from just left of it, so the crane can travel along the beam.
    X0, X1, TOP, CLAMP, HOOK1 = 86, 96, 171, 186, 203
    r, g, b = st[..., 0], st[..., 1], st[..., 2]
    lit = st.max(-1) >= 70
    crane = np.zeros(shape, bool)
    crane[TOP:CLAMP, X0:X1] = True
    crane[CLAMP:HOOK1, X0:X1] = lit[CLAMP:HOOK1, X0:X1]
    # A one-pixel dark rim around the chain and hook brings back their outline and links; over the
    # plain dark wall that rim is invisible when it moves.
    links = crane[CLAMP:HOOK1, X0:X1].copy()
    rim = links.copy()
    rim[1:] |= links[:-1]
    rim[:-1] |= links[1:]
    rim[:, 1:] |= links[:, :-1]
    rim[:, :-1] |= links[:, 1:]
    crane[CLAMP:HOOK1, X0:X1] = rim
    save('run_station_crane.png', np.dstack([st, crane * 255.0]))
    # For the pick-up: the crane split at the hook (rows 195-202 hang on a chain the game can
    # lengthen) - the trolley with the top of the chain, and the hook on its own.
    HOOK_TOP = 195
    upper = crane.copy()
    upper[HOOK_TOP:] = False
    lower = crane.copy()
    lower[:HOOK_TOP] = False
    save('run_station_trolley.png', np.dstack([st, upper * 255.0]))
    save('run_station_hook.png', np.dstack([st, lower * 255.0]))
    # Things the crane lifts off the bay rover. Each is saved as its own small texture
    # (run_station_<name>.png, its box's size) and a gap layer (run_station_<name>_hole.png) that
    # shows what is behind it once it is lifted.
    def item(name, x0, y0, x1, y1, keep, behind):
        region = st[y0:y1, x0:x1]
        mask = keep[y0:y1, x0:x1].copy()
        # Fill each row between its outermost kept pixels, so nothing inside the item is see-through.
        for y in range(mask.shape[0]):
            xs = np.nonzero(mask[y])[0]
            if len(xs):
                mask[y, xs.min():xs.max() + 1] = True
        save(f'run_station_{name}.png', np.dstack([region, mask * 255.0]))
        gap = np.zeros(shape, bool)
        gap[y0:y1, x0:x1] = mask
        save(f'run_station_{name}_hole.png', np.dstack([behind, gap * 255.0]))
    not_wall = ~((st.max(-1) < 75) & (st[..., 2] >= st[..., 0] - 5))
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]]
    # The roof light bar with its rack (x 75-109, rows 213-220); behind it, the wall from just above.
    behind = st.copy()
    behind[213:221, 75:110] = st[205:213, 75:110]
    item('bar', 75, 213, 110, 221, not_wall, behind)
    # The antenna (x 66-69, rows 204-221); behind it, the wall from just to its right.
    behind = st.copy()
    behind[204:222, 66:70] = st[204:222, 71:75]
    item('antenna', 66, 204, 70, 222, not_wall, behind)
    # The front wheel's whole tyre (x 76-100, rows 247-269: an ellipse centred 88,258; the hub sits
    # left of centre in this view); behind it, the dark under the rover, with the floor along the bottom.
    wheel = (((xx - 88) / 12.5) ** 2 + ((yy - 258) / 11.5) ** 2 <= 1) & (yy <= 269)
    behind = st.copy()
    behind[246:270, 75:102] = (24, 21, 28)
    floor = st[265:270, 68:75]                                  # the floor between the two wheels
    behind[265:270, 75:102] = np.tile(floor, (1, 4, 1))[:, :27]
    item('wheel', 75, 246, 102, 270, wheel, behind)
    fill = st.copy()
    fill[TOP:HOOK1 + 1, X0:X1 + 1] = st[TOP:HOOK1 + 1, X0 - 11:X1 - 10]
    hole = np.zeros(shape, bool)
    hole[TOP:HOOK1 + 1, X0:X1 + 1] = True
    save('run_station_crane_hole.png', np.dstack([fill, hole * 255.0]))
    # The two left lockers' doors, each as its own small texture (the game squeezes them as they swing).
    for i, (x0, x1) in enumerate(((500, 516), (516, 531))):
        door = np.dstack([st[204:266, x0:x1], np.full((62, x1 - x0), 255.0)])
        save(f'run_station_locker{i + 1}.png', door)

    site = np.asarray(Image.open(os.path.join(TEXTURES, 'tharsis_site.png')).convert('RGB')).astype(np.float32)
    # The rover at Site A, cut along its own dark pixel-art outline: the background is flooded in
    # from the edges of a box around it, through anything that is not outline-dark, and stops at
    # the outline. A traced polygon (shrunk) keeps the flood out of the body where the outline has
    # gaps, and the rows below the tyres are left out so its ground shadow does not shake.
    from PIL import ImageDraw
    bx0, by0, bx1, by1 = 352, 136, 504, 248
    poly = Image.new('L', (site.shape[1], site.shape[0]), 0)
    ImageDraw.Draw(poly).polygon([(375, 175), (397, 170), (420, 164), (468, 164), (471, 172), (488, 191), (496, 202),
                                  (498, 222), (497, 247), (362, 247), (359, 222), (361, 195)], fill=255)
    inside = np.asarray(poly) > 0
    core = inside.copy()
    for _ in range(3):  # shrink the polygon by 3 px: the flood may not enter this core
        core[1:-1, 1:-1] &= core[:-2, 1:-1] & core[2:, 1:-1] & core[1:-1, :-2] & core[1:-1, 2:]
    dark = site.max(-1) < 72
    passable = ~dark & ~core
    flooded = np.zeros(site.shape[:2], bool)
    stack = [(y, x) for y in range(by0, by1) for x in (bx0, bx1 - 1)] + [(y, x) for x in range(bx0, bx1) for y in (by0, by1 - 1)]
    stack = [(y, x) for y, x in stack if passable[y, x]]
    for y, x in stack:
        flooded[y, x] = True
    while stack:
        y, x = stack.pop()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if by0 <= ny < by1 and bx0 <= nx < bx1 and passable[ny, nx] and not flooded[ny, nx]:
                flooded[ny, nx] = True
                stack.append((ny, nx))
    rover = np.zeros(site.shape[:2], bool)
    rover[by0:by1, bx0:bx1] = ~flooded[by0:by1, bx0:bx1]
    # Dark ground (shadow, rocks) touching the box edges is not rover: keep only what lies inside the
    # polygon grown by 2 px, plus the antenna.
    grown = inside.copy()
    for _ in range(2):
        grown[1:-1, 1:-1] |= grown[:-2, 1:-1] | grown[2:, 1:-1] | grown[1:-1, :-2] | grown[1:-1, 2:]
    rover &= grown
    rover[140:170, 401:408] |= dark[140:170, 401:408] | (site[140:170, 401:408].max(-1) > 150)
    # Below the chassis there are only tyres and hubs (dark or grey): drop the warm ground between them.
    # Around the roof, drop the purple-pink sky the outline did not close off.
    tone = site.max(-1) - site.min(-1)
    rover[230:by1] &= dark[230:by1] | (tone[230:by1] < 55)
    sky = (site[..., 2] > site[..., 1] + 15) & (site[..., 0] > 120)
    rover[by0:178] &= ~sky[by0:178]
    # The sunlit wheel hubs are warm too: put them back as discs around each wheel centre.
    yy, xx = np.mgrid[0:site.shape[0], 0:site.shape[1]]
    for wx, wy in ((375, 232), (425, 232), (484, 232)):
        rover |= ((xx - wx) ** 2 + (yy - wy) ** 2 <= 11 ** 2) & grown
    # The idle shake moves only the body: the tyres (discs around each wheel centre) and everything
    # below the chassis stay put, so the wheels and the shadow stay planted on the ground.
    # Tyre centres and radii measured from the painting's dark tyre pixels; the undercarriage
    # (below row 218) stays put with them.
    tyres = np.zeros(site.shape[:2], bool)
    for wx, wy, wr in ((380, 226, 22), (433, 228, 22), (481, 232, 19)):
        tyres |= (xx - wx) ** 2 + (yy - wy) ** 2 <= wr ** 2
    body = rover & ~tyres
    body[218:] = False
    # Purple-pink sky and terrain left at the edges (behind the rear and beside the roof rack):
    # flood them from outside the body, so the sky reflected in the windows stays.
    purple = (site[..., 2] > site[..., 1] + 12) & (site.max(-1) > 80)
    edge = np.zeros_like(body)
    stack = [(y, x) for y in range(140, 218) for x in range(352, 504) if body[y, x] and purple[y, x] and
             (not body[y - 1, x] or not body[y + 1, x] or not body[y, x - 1] or not body[y, x + 1])]
    for y, x in stack:
        edge[y, x] = True
    while stack:
        y, x = stack.pop()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if body[ny, nx] and purple[ny, nx] and not edge[ny, nx]:
                edge[ny, nx] = True
                stack.append((ny, nx))
    body &= ~edge
    # The front bumper (plate, tow hooks, skid plate) belongs to the body: add it back where the
    # front tyre's disc and the undercarriage line had cut it, but not the tyre tread beside it.
    body[210:218, 456:487] |= rover[210:218, 456:487]
    body[218:222, 462:487] |= rover[218:222, 462:487]      # its dark lower edge, narrower than the plate
    body[210:213, 487:494] |= rover[210:213, 487:494]      # its right corner (the tyre tread below stays)
    body[222:] = False                                      # below that: axle and undercarriage, which stay put
    # The whole bumper under the headlights, skid plate included: x 450-487, rows 209-229, rounded
    # corners, the same bottom edge on both sides (the tyre is left of it, the wheel right of it).
    bar = Image.new('L', (site.shape[1], site.shape[0]), 0)
    ImageDraw.Draw(bar).rounded_rectangle([450, 209, 487, 229], radius=4, fill=255)
    body |= np.asarray(bar) > 0
    # Over the front-left wheel, the line between body and wheel follows the dark wheel-well shadow
    # exactly: the dark area is filled out from inside the well, and in each column everything above
    # its top is rover, everything from it down is wheel. Up to the bumper's left edge.
    darkish = site.max(-1) < 70
    well = np.zeros_like(darkish)
    WX0, WX1, WY0, WY1 = 398, 450, 205, 236      # from the back wheel to the bumper: the sill and the arch
    # Seeds: every dark pixel along the bottom of the area (the tyres and the shadow under the rover),
    # so each dark region reaching down to the wheels is followed.
    stack = [(WY1 - 1, x) for x in range(WX0, WX1) if darkish[WY1 - 1, x]] + [(214, 433)] * bool(darkish[214, 433])
    for y, x in stack:
        well[y, x] = True
    while stack:
        y, x = stack.pop()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if WY0 <= ny < WY1 and WX0 <= nx < WX1 and darkish[ny, nx] and not well[ny, nx]:
                well[ny, nx] = True
                stack.append((ny, nx))
    for x in range(WX0, WX1):
        ys = np.nonzero(well[:, x])[0]
        top = int(ys.min()) if len(ys) else 224
        body[195:top, x] |= rover[195:top, x]
        body[top:, x] = False
    body[213:224, 488:] = False                      # the wheel, below the right headlight
    # The skid plate hanging under the bumper (dark, with a yellow handle), in its own tapered shape.
    skid = Image.new('L', (site.shape[1], site.shape[0]), 0)
    ImageDraw.Draw(skid).polygon([(463, 222), (488, 222), (485, 229), (466, 229)], fill=255)
    body |= np.asarray(skid) > 0
    # The roof light bar, with its dark outline, and the right side mirror; and one more pixel
    # along the windshield pillar (not the sky beside it).
    body[165:175, 422:466] |= ~purple[165:175, 422:466]
    body[188:198, 485:493] |= ~purple[188:198, 485:493]
    near = body.copy()
    near[:, 1:] |= body[:, :-1]
    near[1:] |= body[:-1]
    body[170:202, 462:497] |= near[170:202, 462:497] & ~purple[170:202, 462:497]
    # The whole car moves: the body above, plus the wheels and the undercarriage, cleaned up.
    # Wheels: clean ellipses measured from each tyre's dark outer edge (the tyres look slightly
    # taller than wide from this angle), stopping at the ground line. No colour rules at the rim,
    # so the edge is round and smooth.
    wheels = np.zeros(site.shape[:2], bool)
    for wx, wy, rx, ry in ((376, 227, 19, 21), (432, 228, 20, 21), (485, 231, 16, 18)):
        wheels |= ((xx - wx) / rx) ** 2 + ((yy - wy) / ry) ** 2 <= 1
    wheels[249:] = False
    # The anemometer's orange tripod leg crosses in front of the front tyre: it stays put.
    leg = (site[..., 0] > 170) & (site[..., 1] < 130) & (site[..., 2] < 90)
    wheels[218:249, 486:502] &= ~leg[218:249, 486:502]
    # Undercarriage: the dark parts between the wheels, down to the axles.
    under = np.zeros_like(wheels)
    under[214:240, 395:475] = darkish[214:240, 395:475]
    whole = body | wheels | under
    # Keep only the main connected piece (drops loose specks), then fill small holes inside it.
    seen = np.zeros_like(whole)
    best = []
    for y0, x0 in zip(*np.nonzero(whole)):
        if seen[y0, x0]:
            continue
        stack, blob = [(y0, x0)], []
        seen[y0, x0] = True
        while stack:
            y, x = stack.pop()
            blob.append((y, x))
            for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if whole[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        if len(blob) > len(best):
            best = blob
    whole = np.zeros_like(whole)
    for y, x in best:
        whole[y, x] = True
    for _ in range(2):
        n = whole[:-2, 1:-1].astype(int) + whole[2:, 1:-1] + whole[1:-1, :-2] + whole[1:-1, 2:]
        whole[1:-1, 1:-1] |= n >= 3
    # The final cut comes from a segmentation model (rembg's ISNet, run once on the rover upscaled
    # 6x, enclosed holes filled): art/run_site_rover_mask.png. The hand-built cut above is the
    # fallback if that mask is missing.
    model_mask = os.path.join(HERE, 'run_site_rover_mask.png')
    if os.path.exists(model_mask):
        whole = np.asarray(Image.open(model_mask).convert('L')) > 127
    save('run_site_rover.png', np.dstack([site, whole * 255.0]))
    # The anemometer's cups and arms, so the game can spin its own: the painted ones are covered
    # by the terrain from just above them (the mast and hub, x 509-516, stay), and one cup is cut
    # out as a small sprite.
    CX0, CX1, CY0, CY1, HUB0, HUB1 = 487, 537, 127, 143, 509, 517
    fill = site.copy()
    fill[CY0:CY1, CX0:CX1] = site[CY0 - 16:CY1 - 16, CX0:CX1]
    cover = np.zeros(site.shape[:2], bool)
    cover[CY0:CY1, CX0:CX1] = True
    cover[CY0:CY1, HUB0:HUB1] = False
    save('run_site_cups_hole.png', np.dstack([fill, cover * 255.0]))
    cup = site[CY0:CY1, 488:502]
    cmx, cmn = cup.max(-1), cup.min(-1)
    solid = ((cmx > 150) & (cmx - cmn < 70)) | (cmx < 70)
    shape_ = np.zeros(solid.shape, bool)
    for y in range(solid.shape[0]):
        xs = np.nonzero(solid[y])[0]
        if len(xs) >= 2:
            shape_[y, xs.min():xs.max() + 1] = True
    save('run_site_cup.png', np.dstack([cup, shape_ * 255.0]))
    print('crane', int(crane.sum()), 'rover', int(rover.sum()))


parts()
