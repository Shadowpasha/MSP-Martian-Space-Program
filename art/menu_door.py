"""The sliding door for the main menu's upper-deck doorway.

Writes (assets/textures):
  menu_door_left.png / menu_door_right.png  the two steel halves at painting size, shaped to the
                                            doorway (cut top corners), shaded like the frame.
  menu_glow_door_frame.png                  the painting's door frame and walls around the opening,
                                            drawn over the halves so they slide into the jambs.
Usage: python menu_door.py [preview.png]
"""
import json
import os
import sys
import uuid
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
TEXTURES = os.path.join(HERE, '..', 'assets', 'textures')
painting = Image.open(os.path.join(TEXTURES, 'menu_station_empty.png')).convert('RGBA')

# The opening (painting pixels), traced from the frame's dark inner edge: straight jambs, the
# top corners cut at 45 degrees (5 px on the left, 6 on the right).
X0, X1, Y0, Y1 = 584, 624, 200, 259
OPENING = [(X0 + 5, Y0), (X1 - 6, Y0), (X1, Y0 + 6), (X1, Y1), (X0, Y1), (X0, Y0 + 5)]
W, H = X1 - X0, Y1 - Y0
HALF = W // 2 + 1                    # each half overlaps the centre by a pixel

# Warm steel, matched to the frame's beige.
LIGHT, MID, SHADE, DARK, LINE = (204, 176, 134), (170, 143, 108), (136, 112, 86), (96, 76, 62), (44, 33, 30)
GLASS, GLASS_HI = (60, 160, 182), (150, 226, 236)


def meta(path: str) -> None:
    if os.path.exists(path + '.meta'):
        return
    with open(path + '.meta', 'w') as f:
        json.dump({'uuid': str(uuid.uuid4()), 'version': '2.0', 'type': 'texture', 'importer': {
            'maxSize': 2048, 'filterMode': 'nearest', 'wrapMode': 'clamp', 'mipmaps': False, 'premultiplyAlpha': False,
            'sliceBorder': {'left': 0, 'right': 0, 'top': 0, 'bottom': 0}}}, f, indent=2)


def left_half() -> Image.Image:
    """The left half; the right half is its mirror. Its right edge is the meeting seam."""
    door = Image.new('RGBA', (HALF, H), MID + (255,))
    d = ImageDraw.Draw(door)
    d.rectangle([0, 0, 2, H - 1], fill=LIGHT + (255,))            # lit edge (light from the upper left)
    d.rectangle([HALF - 4, 0, HALF - 2, H - 1], fill=SHADE + (255,))
    d.line([HALF - 1, 0, HALF - 1, H - 1], fill=LINE + (255,))     # the seam where the halves meet
    for y in (25, 41):                                             # two pressed ribs
        d.line([1, y, HALF - 2, y], fill=DARK + (255,))
        d.line([1, y + 1, HALF - 2, y + 1], fill=LIGHT + (255,))
    d.rectangle([5, 12, HALF - 6, 19], fill=LINE + (255,))        # window slit
    d.rectangle([6, 13, HALF - 7, 18], fill=GLASS + (255,))
    d.line([6, 13, HALF - 8, 13], fill=GLASS_HI + (255,))
    d.rectangle([3, 47, HALF - 4, 53], fill=DARK + (255,))        # kick plate with hazard stripes
    for x in range(3, HALF - 3, 4):
        d.line([x, 53, x + 3, 47], fill=(214, 168, 52, 255), width=2)
    for x, y in ((4, 4), (HALF - 5, 4), (4, H - 4), (HALF - 5, H - 4)):
        d.point((x, y), fill=LIGHT + (255,))                       # rivets
    d.line([0, H - 1, HALF - 1, H - 1], fill=DARK + (255,))
    # Cut the top-left corner to the doorway's shape.
    mask = Image.new('L', door.size, 0)
    ImageDraw.Draw(mask).polygon([(x - X0, y - Y0) for x, y in OPENING], fill=255)
    door.putalpha(mask)
    return door


left = left_half()
right = left_half().transpose(Image.FLIP_LEFT_RIGHT)
# Re-cut the right half with the opening's own right-hand corner (it is not a mirror of the left).
mask = Image.new('L', right.size, 0)
ImageDraw.Draw(mask).polygon([(x - (X1 - HALF), y - Y0) for x, y in OPENING], fill=255)
right.putalpha(Image.composite(mask, Image.new('L', right.size, 0), Image.new('L', right.size, 255)))
right = Image.composite(right, Image.new('RGBA', right.size, (0, 0, 0, 0)), mask)
for name, image in (('menu_door_left.png', left), ('menu_door_right.png', right)):
    path = os.path.join(TEXTURES, name)
    image.save(path)
    meta(path)

# The frame around the opening (and the wall the halves slide into), with the opening cut out.
frame = Image.new('RGBA', painting.size, (0, 0, 0, 0))
box = (X0 - HALF - 2, Y0 - 10, 640, Y1 + 4)
frame.paste(painting.crop(box), box[:2])
hole = Image.new('L', painting.size, 255)
ImageDraw.Draw(hole).polygon(OPENING, fill=0)
alpha = Image.new('L', painting.size, 0)
alpha.paste(hole.crop(box), box[:2])
frame.putalpha(alpha)
path = os.path.join(TEXTURES, 'menu_glow_door_frame.png')
frame.save(path)
meta(path)

if len(sys.argv) > 1:
    rail = Image.open(os.path.join(TEXTURES, 'menu_glow_door_rail.png'))
    shots = []
    for openness in (0, 0.5, 1):
        shot = painting.copy()
        shift = round((HALF - 1) * openness)
        shot.alpha_composite(left, (X0 - shift, Y0))
        shot.alpha_composite(right, (X1 - HALF + shift, Y0))
        shot.alpha_composite(frame)
        shot.alpha_composite(rail)
        shots.append(shot.crop((560, 180, 640, 268)).resize((240, 264), Image.NEAREST))
    out = Image.new('RGBA', (720, 264))
    for i, s in enumerate(shots):
        out.paste(s, (i * 240, 0))
    out.save(sys.argv[1])
