"""Mission Prep pixel art: item sprites, UI icons and the two crater maps.

Provenance: every pixel here is drawn by this script (Pillow primitives on a
fixed 16x16 grid, maps from seeded value noise quantised to the design.md
palette). No external or generated imagery. Re-run to regenerate:

    python -I scripts/art/prep_sprites.py

Outputs go to assets/textures/prep/ with .png.meta files (filterMode nearest,
so Estella scales them without smoothing). Draw at integer scales only.
"""
from __future__ import annotations

import json
import math
import sys
import uuid
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "textures" / "prep"

# design.md section 3 tokens + a few material colours for item art.
P = {
    "ink9": "#1E1D30", "ink8": "#212031", "ink7": "#323149", "ink6": "#36354B",
    "edge5": "#555064", "edge3": "#777185",
    "cream": "#E8DCDD", "cream2": "#BDB1BC", "muted": "#918898", "white": "#F3ECEA",
    "amber": "#EEB166", "amber3": "#F8C574",
    "mars6": "#A25754", "mars5": "#D0685A", "rust": "#573548",
    "cyan8": "#145360", "cyan": "#65CCD0",
    "green": "#87B77A", "green2": "#4F7F4A", "red": "#D96C6C", "red2": "#8E3B45",
    "blue": "#4FA3E0", "blue2": "#2F6FA8", "yellow": "#F2D24B",
    "brown": "#8C5A3C", "brown2": "#5E3B28", "steel": "#A7A3B3",
}


def rgba(name: str, a: int = 255) -> tuple[int, int, int, int]:
    h = P[name].lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def canvas(size: int = 16) -> tuple[Image.Image, ImageDraw.ImageDraw]:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    return img, ImageDraw.Draw(img)


def box(d, x0, y0, x1, y1, fill, outline="ink9"):
    d.rectangle([x0, y0, x1, y1], fill=rgba(fill), outline=rgba(outline) if outline else None)


def px(d, pts, col):
    for x, y in pts:
        d.point((x, y), fill=rgba(col))


# ---------------------------------------------------------------- items (16x16)
def food_crate():
    img, d = canvas()
    box(d, 1, 4, 14, 14, "brown")
    d.line([(2, 9), (13, 9)], fill=rgba("brown2"))
    d.line([(7, 5), (7, 13)], fill=rgba("brown2"))
    box(d, 4, 1, 11, 4, "green2")  # leaf label on lid
    px(d, [(6, 2), (7, 2), (8, 3)], "green")
    return img


def water_tank():
    img, d = canvas()
    box(d, 3, 2, 12, 15, "blue")
    box(d, 6, 0, 9, 2, "steel")
    d.line([(4, 4), (4, 13)], fill=rgba("cyan"))
    box(d, 5, 7, 10, 10, "blue2", None)
    px(d, [(7, 8), (8, 8), (7, 9)], "white")
    return img


def o2_canister():
    img, d = canvas()
    box(d, 4, 2, 11, 15, "white")
    box(d, 6, 0, 9, 2, "steel")
    box(d, 4, 6, 11, 10, "cyan8")
    px(d, [(6, 7), (6, 8), (6, 9), (7, 7), (7, 9), (8, 7), (8, 8), (8, 9)], "cyan")  # O
    px(d, [(10, 9)], "cyan")
    d.line([(5, 3), (5, 14)], fill=rgba("cream2"))
    return img


def rations():
    img, d = canvas()
    box(d, 2, 3, 13, 14, "steel")
    d.line([(2, 5), (13, 5)], fill=rgba("ink9"))
    box(d, 5, 8, 10, 11, "amber")
    px(d, [(3, 4), (12, 4)], "white")
    return img


def seed_pod():
    img, d = canvas()
    box(d, 3, 9, 12, 15, "brown")
    d.line([(4, 10), (11, 10)], fill=rgba("brown2"))
    d.line([(7, 3), (7, 9)], fill=rgba("green2"))
    d.polygon([(7, 4), (3, 2), (2, 5), (6, 6)], fill=rgba("green"), outline=rgba("ink9"))
    d.polygon([(8, 5), (12, 3), (13, 6), (9, 7)], fill=rgba("green"), outline=rgba("ink9"))
    return img


def power_cell():
    img, d = canvas()
    box(d, 1, 4, 13, 12, "green2")
    box(d, 13, 6, 15, 10, "steel")
    for i in range(3):
        box(d, 3 + i * 3, 6, 4 + i * 3, 10, "green", None)
    return img


def battery_pack():
    img, d = canvas()
    box(d, 1, 3, 14, 13, "ink7")
    box(d, 4, 1, 6, 3, "steel")
    box(d, 9, 1, 11, 3, "steel")
    d.polygon([(9, 4), (5, 9), (8, 9), (6, 12), (11, 7), (8, 7), (10, 4)], fill=rgba("yellow"))
    return img


def repair_kit():
    img, d = canvas()
    box(d, 1, 6, 14, 14, "mars5")
    box(d, 5, 3, 10, 6, "ink7")
    box(d, 6, 4, 9, 6, "ink9", None)
    d.line([(1, 9), (14, 9)], fill=rgba("ink9"))
    box(d, 6, 8, 9, 10, "amber")
    return img


def medkit():
    img, d = canvas()
    box(d, 1, 3, 14, 14, "white")
    box(d, 6, 1, 9, 3, "steel")
    box(d, 6, 5, 9, 12, "red", None)
    box(d, 4, 7, 11, 10, "red", None)
    return img


def materials():
    img, d = canvas()
    box(d, 1, 5, 14, 14, "edge3")
    for y in (7, 10, 13):
        d.line([(2, y), (13, y)], fill=rgba("steel"))
    box(d, 3, 1, 12, 5, "steel")
    d.line([(4, 3), (11, 3)], fill=rgba("edge5"))
    return img


def weather_sensor():
    img, d = canvas()
    d.line([(7, 4), (7, 15)], fill=rgba("steel"))
    d.line([(8, 4), (8, 15)], fill=rgba("edge3"))
    d.line([(2, 4), (13, 4)], fill=rgba("cream"))
    for cx in (2, 13):
        d.ellipse([cx - 2, 2, cx + 1, 5], fill=rgba("cyan"), outline=rgba("ink9"))
    box(d, 5, 8, 10, 11, "ink7")
    px(d, [(6, 9), (9, 9)], "cyan")
    box(d, 4, 14, 11, 15, "edge5", None)
    return img


def ice_drill():
    img, d = canvas()
    box(d, 5, 0, 10, 4, "ink7")
    px(d, [(7, 2), (8, 2)], "amber")
    d.line([(7, 5), (7, 13)], fill=rgba("steel"))
    d.line([(8, 5), (8, 13)], fill=rgba("edge3"))
    for y in (6, 9, 12):
        px(d, [(6, y), (9, y + 1)], "cream")
    box(d, 5, 13, 10, 15, "cyan", None)
    px(d, [(6, 14), (8, 14)], "white")
    return img


ITEMS = {
    "item_food_crate_16": food_crate, "item_water_tank_16": water_tank,
    "item_o2_canister_16": o2_canister, "item_rations_16": rations,
    "item_seed_pod_16": seed_pod, "item_power_cell_16": power_cell,
    "item_battery_pack_16": battery_pack, "item_repair_kit_16": repair_kit,
    "item_medkit_16": medkit, "item_materials_16": materials,
    "item_weather_sensor_16": weather_sensor, "item_ice_drill_16": ice_drill,
}


# ---------------------------------------------------------------- icons (16x16)
def ic_food():
    img, d = canvas()
    d.polygon([(3, 13), (4, 6), (9, 2), (13, 3), (12, 9), (6, 13)], fill=rgba("green"), outline=rgba("ink9"))
    d.line([(4, 12), (11, 4)], fill=rgba("green2"))
    return img


def ic_water():
    img, d = canvas()
    d.polygon([(8, 1), (13, 9), (11, 13), (8, 14), (5, 13), (3, 9)], fill=rgba("blue"), outline=rgba("ink9"))
    px(d, [(6, 8), (6, 9), (7, 11)], "white")
    return img


def ic_o2():
    return o2_canister()


def ic_power():
    img, d = canvas()
    d.polygon([(10, 1), (3, 9), (7, 9), (5, 15), (13, 6), (9, 6), (11, 1)], fill=rgba("yellow"), outline=rgba("ink9"))
    return img


def ic_res():
    img, d = canvas()
    box(d, 2, 4, 13, 13, "amber")
    d.line([(2, 4), (13, 13)], fill=rgba("brown2"))
    d.line([(13, 4), (2, 13)], fill=rgba("brown2"))
    return img


def ic_check():
    img, d = canvas()
    box(d, 1, 1, 14, 14, "green2")
    d.line([(4, 8), (6, 10)], fill=rgba("white"), width=2)
    d.line([(6, 10), (11, 4)], fill=rgba("white"), width=2)
    return img


def ic_cross():
    img, d = canvas()
    box(d, 1, 1, 14, 14, "red2")
    d.line([(4, 4), (11, 11)], fill=rgba("white"), width=2)
    d.line([(11, 4), (4, 11)], fill=rgba("white"), width=2)
    return img


def ic_warn():
    img, d = canvas()
    d.polygon([(8, 1), (15, 14), (1, 14)], fill=rgba("amber"), outline=rgba("ink9"))
    box(d, 7, 5, 8, 10, "ink9", None)
    box(d, 7, 12, 8, 12, "ink9", None)
    return img


def ic_mission():  # map pin
    img, d = canvas()
    d.ellipse([3, 1, 12, 10], fill=rgba("amber"), outline=rgba("ink9"))
    d.polygon([(4, 8), (11, 8), (8, 15)], fill=rgba("amber"), outline=rgba("ink9"))
    box(d, 6, 4, 9, 7, "ink9", None)
    return img


def ic_crew():
    img, d = canvas()
    for cx, col in ((4, "cream2"), (12, "cream2"), (8, "cream")):
        d.ellipse([cx - 2, 3 if cx == 8 else 5, cx + 1, 6 if cx == 8 else 8], fill=rgba(col), outline=rgba("ink9"))
        d.rectangle([cx - 3, 8 if cx == 8 else 10, cx + 2, 14], fill=rgba(col), outline=rgba("ink9"))
    return img


def ic_pack():
    return food_crate()


def ic_launch():
    img, d = canvas()
    d.polygon([(8, 0), (11, 4), (11, 11), (5, 11), (5, 4)], fill=rgba("white"), outline=rgba("ink9"))
    box(d, 7, 4, 8, 6, "cyan", None)
    d.polygon([(5, 8), (2, 12), (5, 12)], fill=rgba("mars5"), outline=rgba("ink9"))
    d.polygon([(11, 8), (14, 12), (11, 12)], fill=rgba("mars5"), outline=rgba("ink9"))
    d.polygon([(6, 12), (10, 12), (8, 15)], fill=rgba("amber"))
    return img


def ic_base():
    img, d = canvas()
    d.chord([2, 4, 13, 15], 180, 360, fill=rgba("cyan"), outline=rgba("ink9"))
    box(d, 1, 10, 14, 13, "white")
    box(d, 6, 10, 9, 13, "ink7", None)
    return img


def ic_lock():
    img, d = canvas()
    d.arc([4, 1, 11, 9], 180, 360, fill=rgba("cream2"), width=2)
    d.line([(4, 5), (4, 7)], fill=rgba("cream2"), width=2)
    d.line([(11, 5), (11, 7)], fill=rgba("cream2"), width=2)
    box(d, 2, 7, 13, 14, "edge3")
    box(d, 7, 9, 8, 12, "ink9", None)
    return img


def ic_rotate():
    img, d = canvas()
    d.arc([2, 2, 13, 13], 200, 470, fill=rgba("cream"), width=2)
    d.polygon([(1, 4), (6, 4), (3, 8)], fill=rgba("cream"))
    return img


def ic_up():
    img, d = canvas()
    box(d, 1, 1, 14, 14, "green2")
    d.polygon([(8, 3), (12, 8), (9, 8), (9, 12), (6, 12), (6, 8), (3, 8)], fill=rgba("white"))
    return img


def ic_down():
    img, d = canvas()
    box(d, 1, 1, 14, 14, "red2")
    d.polygon([(8, 12), (12, 7), (9, 7), (9, 3), (6, 3), (6, 7), (3, 7)], fill=rgba("white"))
    return img


def hz_dust():
    img, d = canvas()
    for i, y in enumerate((3, 7, 11)):
        d.arc([1 + i, y - 2, 14 - i, y + 4], 200, 340, fill=rgba("mars5"), width=2)
    return img


def hz_flare():
    img, d = canvas()
    d.ellipse([4, 4, 11, 11], fill=rgba("amber"), outline=rgba("ink9"))
    for a in range(0, 360, 45):
        r = math.radians(a)
        d.line([(8 + 5 * math.cos(r), 8 + 5 * math.sin(r)), (8 + 7 * math.cos(r), 8 + 7 * math.sin(r))], fill=rgba("yellow"), width=2)
    return img


def hz_cold():
    img, d = canvas()
    for a in (0, 60, 120):
        r = math.radians(a)
        d.line([(8 - 7 * math.cos(r), 8 - 7 * math.sin(r)), (8 + 7 * math.cos(r), 8 + 7 * math.sin(r))], fill=rgba("cyan"), width=2)
    return img


def ic_play():
    img, d = canvas()
    d.polygon([(4, 2), (13, 8), (4, 14)], fill=rgba("cream"), outline=rgba("ink9"))
    return img


def ic_upgrade():
    img, d = canvas()
    d.polygon([(8, 1), (14, 7), (10, 7), (10, 14), (6, 14), (6, 7), (2, 7)], fill=rgba("cream"), outline=rgba("ink9"))
    return img


def ic_gear():
    img, d = canvas()
    for a in range(0, 360, 45):
        r = math.radians(a)
        cx, cy = 8 + 5.5 * math.cos(r), 8 + 5.5 * math.sin(r)
        d.rectangle([cx - 1.5, cy - 1.5, cx + 1.5, cy + 1.5], fill=rgba("cream"))
    d.ellipse([3, 3, 12, 12], fill=rgba("cream"), outline=rgba("ink9"))
    d.ellipse([6, 6, 9, 9], fill=rgba("ink9"))
    return img


def ic_quit():
    img, d = canvas()
    d.arc([2, 3, 13, 14], 300, 600, fill=rgba("cream"), width=2)
    d.line([(7, 1), (7, 8)], fill=rgba("cream"), width=2)
    return img


def hz_terrain():
    img, d = canvas()
    d.polygon([(1, 14), (5, 6), (9, 14)], fill=rgba("mars6"), outline=rgba("ink9"))
    d.polygon([(6, 14), (11, 3), (15, 14)], fill=rgba("mars5"), outline=rgba("ink9"))
    return img


def hz_panels():
    img, d = canvas()
    d.polygon([(1, 12), (4, 4), (15, 4), (12, 12)], fill=rgba("blue2"), outline=rgba("ink9"))
    d.line([(8, 4), (6, 12)], fill=rgba("ink9"))
    px(d, [(5, 6), (9, 8), (11, 5), (4, 10), (12, 9)], "mars5")
    d.line([(7, 12), (7, 15)], fill=rgba("steel"))
    return img


def hz_failure():
    img, d = canvas()
    d.line([(3, 13), (10, 6)], fill=rgba("steel"), width=3)
    d.ellipse([8, 1, 14, 7], outline=rgba("steel"), width=2)
    box(d, 11, 2, 14, 4, "ink9", None)
    px(d, [(2, 2), (3, 3), (5, 2)], "amber")
    return img


def hz_comms():
    img, d = canvas()
    d.line([(8, 6), (8, 15)], fill=rgba("steel"), width=2)
    d.arc([3, 1, 13, 11], 200, 340, fill=rgba("cream2"), width=1)
    d.arc([5, 3, 11, 9], 200, 340, fill=rgba("cream2"), width=1)
    d.line([(2, 14), (14, 2)], fill=rgba("red"), width=2)
    return img


ICONS = {
    "ui_icon_food_16": ic_food, "ui_icon_water_16": ic_water, "ui_icon_o2_16": ic_o2,
    "ui_icon_power_16": ic_power, "ui_icon_res_16": ic_res,
    "ui_icon_check_16": ic_check, "ui_icon_cross_16": ic_cross, "ui_icon_warn_16": ic_warn,
    "ui_icon_mission_16": ic_mission, "ui_icon_crew_16": ic_crew, "ui_icon_pack_16": ic_pack,
    "ui_icon_launch_16": ic_launch, "ui_icon_base_16": ic_base, "ui_icon_lock_16": ic_lock,
    "ui_icon_rotate_16": ic_rotate, "ui_icon_up_16": ic_up, "ui_icon_down_16": ic_down,
    "ui_icon_play_16": ic_play, "ui_icon_upgrade_16": ic_upgrade,
    "ui_icon_gear_16": ic_gear, "ui_icon_quit_16": ic_quit,
    "hz_dust_storm_16": hz_dust, "hz_solar_flare_16": hz_flare, "hz_cold_snap_16": hz_cold,
    "hz_rough_terrain_16": hz_terrain, "hz_dust_on_panels_16": hz_panels,
    "hz_equipment_failure_16": hz_failure, "hz_comms_blackout_16": hz_comms,
}


# ---------------------------------------------------------------- maps (320x180)
def value_noise(w, h, cell, seed):
    rng = np.random.default_rng(seed)
    gw, gh = w // cell + 2, h // cell + 2
    g = rng.random((gh, gw))
    ys, xs = np.mgrid[0:h, 0:w] / cell
    x0, y0 = xs.astype(int), ys.astype(int)
    fx, fy = xs - x0, ys - y0
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a = g[y0, x0] * (1 - fx) + g[y0, x0 + 1] * fx
    b = g[y0 + 1, x0] * (1 - fx) + g[y0 + 1, x0 + 1] * fx
    return a * (1 - fy) + b * fy


def quantise(field, cols):
    idx = np.clip((field * len(cols)).astype(int), 0, len(cols) - 1)
    lut = np.array([rgba(c)[:3] for c in cols], dtype=np.uint8)
    return lut[idx]


def crater(field, cx, cy, r, depth=0.35, rim=0.18):
    h, w = field.shape
    ys, xs = np.mgrid[0:h, 0:w]
    dist = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2) / r
    field -= np.where(dist < 1, depth * (1 - dist ** 2), 0)
    field += np.where((dist >= 0.85) & (dist < 1.15), rim * (1 - np.abs(dist - 1) / 0.15), 0)


def lit(height: np.ndarray, albedo: np.ndarray, k: float) -> np.ndarray:
    """Light from the upper-left (design.md key light): slope shading + albedo, 0..1."""
    hp = np.pad(height, 1, mode="edge")
    slope = hp[2:, 2:] - hp[:-2, :-2]  # rising toward the lower-right = facing the light
    v = 0.5 + k * slope + 0.35 * (albedo - albedo.mean())
    return np.clip(v, 0, 0.999)


def mars_map():
    w, h = 320, 180
    ys, xs = np.mgrid[0:h, 0:w]
    height = 0.10 * value_noise(w, h, 20, 7) + 0.04 * value_noise(w, h, 5, 8)
    # Jezero: one big crater whose rim arcs through the upper-left corner.
    crater(height, 205, 110, 175, depth=0.10, rim=0.35)
    rng = np.random.default_rng(3)
    for _ in range(12):
        crater(height, rng.integers(10, w - 10), rng.integers(10, h - 10), rng.integers(3, 9), depth=0.18, rim=0.12)
    crater(height, 96, 54, 13, depth=0.25, rim=0.18)  # Belva
    # Albedo: the delta fan in the west is lighter sediment with layered bands.
    fan = np.clip(1 - np.sqrt(((xs - 30) / 130.0) ** 2 + ((ys - 80) / 75.0) ** 2), 0, 1)
    albedo = 0.6 * value_noise(w, h, 30, 9) + 0.9 * fan * (0.7 + 0.3 * (np.sin(xs / 4.0 + ys / 9.0) > 0))
    v = lit(height, albedo, 9.0)
    return Image.fromarray(quantise(v, ["rust", "mars6", "mars6", "mars5", "mars5", "amber"]), "RGB")


def moon_map():
    w, h = 320, 180
    height = 0.10 * value_noise(w, h, 18, 21) + 0.04 * value_noise(w, h, 5, 22)
    rng = np.random.default_rng(5)
    for _ in range(18):
        crater(height, rng.integers(0, w), rng.integers(0, h), rng.integers(4, 16), depth=0.2, rim=0.14)
    crater(height, 64, 58, 34, depth=0.5, rim=0.22)    # Cabeus
    crater(height, 224, 122, 26, depth=0.5, rim=0.22)  # Shackleton
    albedo = value_noise(w, h, 26, 23)
    v = lit(height, albedo, 8.0)
    # Permanently shadowed floors: force the darkest tone inside the two polar craters.
    ys, xs = np.mgrid[0:h, 0:w]
    for cx, cy, r in ((64, 58, 26), (224, 122, 20)):
        v = np.where((xs - cx) ** 2 + (ys - cy) ** 2 < r * r, np.minimum(v, 0.05), v)
    return Image.fromarray(quantise(v, ["ink9", "ink8", "ink7", "ink6", "edge5", "edge3"]), "RGB")


# ---------------------------------------------------------------- logo + backdrop
FONT_DISPLAY = ROOT / "assets" / "fonts" / "PixelifySans.ttf"


def logo():
    """MSP: lockup after the mockups: heavy slanted letters with a dark outline, an orange
    arc behind, and MARS / STATION / PROGRAM stacked. Drawn at 1x (116x40), shown at 2x."""
    from PIL import ImageFilter, ImageFont
    w, h = 116, 40
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.arc([1, 1, 70, 38], 195, 335, fill=rgba("mars5"), width=1)
    d.point((66, 5), fill=rgba("amber3"))
    big = ImageFont.truetype(str(FONT_DISPLAY), 22)
    try:
        big.set_variation_by_axes([700])
    except Exception:
        pass
    mask = Image.new("L", (w, h), 0)
    md = ImageDraw.Draw(mask)
    md.fontmode = "1"
    # stroke_width=1 in the fill colour fattens the strokes into a heavy weight.
    md.text((4, 7), "MSP:", font=big, fill=255)
    mask = mask.transform(mask.size, Image.AFFINE, (1, 0.24, -5, 0, 1, 0), resample=Image.NEAREST)
    mask = mask.point(lambda v: 255 if v > 127 else 0)
    outline = mask.filter(ImageFilter.MaxFilter(5))
    img.paste(Image.new("RGBA", (w, h), rgba("ink9")), (0, 0), outline)
    img.paste(Image.new("RGBA", (w, h), rgba("white")), (0, 0), mask)
    small = ImageFont.truetype(str(FONT_DISPLAY), 8)
    d = ImageDraw.Draw(img)
    d.fontmode = "1"
    for i, word in enumerate(("MARS", "STATION", "PROGRAM")):
        d.text((74, 7 + i * 9), word, font=small, fill=rgba("cream"))
    return img


def backdrop():
    """Sidebar backdrop (136x360, shown at 2x): plum sky, rust ridges, dish, astronaut on a cliff.
    Kept low-contrast so the nav buttons on top stay the brightest thing."""
    w, h = 136, 360
    img = Image.new("RGBA", (w, h), rgba("ink9"))
    d = ImageDraw.Draw(img)
    # Stepped sky bands warming toward the horizon.
    bands = ["ink9", "ink8", "rust", "rust", "mars6"]
    for i, col in enumerate(bands):
        y0 = 150 + i * 26
        d.rectangle([0, y0, w, h], fill=rgba(col))
    rng = np.random.default_rng(4)
    # Far ridge, near ridge.
    for base, amp, col, seed in ((268, 18, "mars6", 1), (300, 26, "rust", 2), (322, 14, "ink8", 3)):
        r2 = np.random.default_rng(seed)
        pts = [(0, h)]
        y = base
        for x in range(0, w + 8, 8):
            y = int(np.clip(y + r2.integers(-amp // 3, amp // 3 + 1), base - amp, base + amp // 2))
            pts.append((x, y))
        pts.append((w, h))
        d.polygon(pts, fill=rgba(col))
    # Cliff at bottom-left with an astronaut looking out.
    d.polygon([(0, 330), (30, 320), (44, 326), (52, 360), (0, 360)], fill=rgba("ink9"))
    d.rectangle([22, 306, 27, 319], fill=rgba("white"))       # suit
    d.rectangle([21, 300, 28, 306], fill=rgba("white"))       # helmet
    d.rectangle([24, 302, 28, 304], fill=rgba("amber"))       # visor
    d.rectangle([19, 307, 21, 315], fill=rgba("edge3"))       # pack
    # Dish and a small dome on the far ridge.
    d.line([(100, 262), (100, 276)], fill=rgba("edge3"))
    d.chord([90, 250, 112, 266], 160, 340, fill=rgba("edge3"), outline=rgba("ink9"))
    d.chord([66, 266, 86, 284], 180, 360, fill=rgba("edge5"), outline=rgba("ink9"))
    # A few stars, sparse.
    for _ in range(18):
        x, y = int(rng.integers(0, w)), int(rng.integers(0, 140))
        d.point((x, y), fill=rgba("edge5"))
    return img


# ---------------------------------------------------------------- output
def meta_for(path: Path) -> dict:
    rel = path.relative_to(ROOT).as_posix()
    return {
        "uuid": str(uuid.uuid5(uuid.NAMESPACE_URL, "msp-prep/" + rel)),
        "version": "2.0",
        "type": "texture",
        "importer": {
            "maxSize": 2048, "filterMode": "nearest", "wrapMode": "clamp", "premultiplyAlpha": False,
            "sliceBorder": {"left": 0, "right": 0, "top": 0, "bottom": 0},
        },
    }


def save(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)
    path.with_name(path.name + ".meta").write_text(json.dumps(meta_for(path), indent=2) + "\n")


def main() -> int:
    for name, fn in ITEMS.items():
        save(fn(), OUT / "items" / f"{name}.png")
    for name, fn in ICONS.items():
        save(fn(), OUT / "icons" / f"{name}.png")
    save(mars_map(), OUT / "maps" / "map_jezero_320x180.png")
    save(moon_map(), OUT / "maps" / "map_lunar_south_pole_320x180.png")
    save(logo(), OUT / "ui" / "ui_logo_msp_116x40.png")
    save(backdrop(), OUT / "ui" / "env_mars_backdrop_sidebar_136x360.png")
    # Contact sheet for review (not shipped; under .impeccable/review).
    sheet = Image.new("RGBA", (16 * 12 * 4, 16 * 3 * 4), rgba("ink8"))
    allimgs = [fn() for fn in ITEMS.values()] + [fn() for fn in ICONS.values()]
    for i, im in enumerate(allimgs):
        sheet.paste(im.resize((64, 64), Image.NEAREST), ((i % 12) * 64, (i // 12) * 64), im.resize((64, 64), Image.NEAREST))
    review = ROOT / ".impeccable" / "review"
    review.mkdir(parents=True, exist_ok=True)
    sheet.save(review / "prep_sprite_sheet.png")
    print(f"wrote {len(ITEMS)} items, {len(ICONS)} icons, 2 maps")
    return 0


if __name__ == "__main__":
    sys.exit(main())
