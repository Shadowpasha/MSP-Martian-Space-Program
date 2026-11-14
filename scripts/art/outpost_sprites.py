"""Outpost (main survival loop) pixel art: HUD icons, station buttons, cargo, badges,
banners, event cards, Moon interior backdrop.

Provenance: every pixel is drawn here with Pillow primitives on small logical canvases
(16 / 24 / 128x72 / 240x70 / 640x360) in the design.md palette (P from prep_sprites),
then exported with an integer nearest-neighbour upscale. Existing 16 px Mission Prep
sprites are reused (integer upscale) rather than redrawn. No external imagery.

Never overwrites: a target that already exists (and was not written earlier in this
run) is skipped and reported.  Re-run:

    python -I scripts/art/outpost_sprites.py

Skipped by design (the main-loop owner already has placeholders in assets/textures):
crew portraits, A.R.I.E.S. robot, Mars interior backdrop.
"""
from __future__ import annotations

import json
import math
import sys
import uuid
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).parent))
import prep_sprites as ps  # noqa: E402
from prep_sprites import P, rgba, canvas, box, px  # noqa: E402

ROOT = ps.ROOT
OUT = ROOT / "assets" / "textures" / "outpost"
REVIEW = ROOT / ".impeccable" / "review"
FONT = ps.FONT_DISPLAY

SKIPPED: list[str] = []
WRITTEN: set[Path] = set()


def hexrgba(h, a=255):
    h = h.lstrip("#")
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), a)


def up(img, k):
    return img.resize((img.width * k, img.height * k), Image.NEAREST)


def meta_for(path: Path) -> dict:
    rel = path.relative_to(ROOT).as_posix()
    return {
        "uuid": str(uuid.uuid5(uuid.NAMESPACE_URL, "msp-outpost/" + rel)),
        "version": "2.0", "type": "texture",
        "importer": {"maxSize": 2048, "filterMode": "nearest", "wrapMode": "clamp",
                     "premultiplyAlpha": False,
                     "sliceBorder": {"left": 0, "right": 0, "top": 0, "bottom": 0}},
    }


def save(img, path: Path) -> bool:
    if path.exists() and path not in WRITTEN:
        SKIPPED.append(f"skipped, exists: {path}")
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)
    meta = path.with_name(path.name + ".meta")
    if not meta.exists() or path in WRITTEN:
        meta.write_text(json.dumps(meta_for(path), indent=2) + "\n")
    WRITTEN.add(path)
    return True


def font(size, wght=700):
    f = ImageFont.truetype(str(FONT), size)
    try:
        f.set_variation_by_axes([wght])
    except Exception:
        pass
    return f


def text(d, xy, s, f, fill, anchor="la"):
    d.fontmode = "1"
    d.text(xy, s, font=f, fill=fill, anchor=anchor)


REGISTRY: dict[str, list] = {}


def emit(group, sub, name, logical, k, origin):
    final = up(logical, k) if k > 1 else logical
    ok = save(final, OUT / sub / f"{name}.png")
    if ok:
        REGISTRY.setdefault(group, []).append((f"{sub}/{name}.png", final, logical.size, origin))


# ============================================================ HUD icons (16 -> 32)
def hud_radiation():
    img, d = canvas()
    d.ellipse([1, 1, 14, 14], fill=rgba("yellow"), outline=rgba("ink9"))
    for a0 in (-90, 30, 150):
        d.pieslice([2, 2, 13, 13], a0 - 30, a0 + 30, fill=rgba("ink9"))
    d.ellipse([6, 6, 9, 9], fill=rgba("yellow"), outline=rgba("ink9"))
    px(d, [(7, 7), (8, 8)], "ink9")
    return img


def hud_morale():
    img, d = canvas()
    d.ellipse([1, 1, 14, 14], fill=rgba("amber3"), outline=rgba("ink9"))
    box(d, 4, 5, 5, 7, "ink9", None)
    box(d, 10, 5, 11, 7, "ink9", None)
    px(d, [(4, 9), (5, 10), (6, 11), (7, 11), (8, 11), (9, 11), (10, 10), (11, 9)], "ink9")
    px(d, [(3, 3), (4, 2)], "white")
    return img


def hud_clear():
    img, d = canvas()
    for a in range(0, 360, 45):
        r = math.radians(a)
        d.line([(7.5 + 5 * math.cos(r), 7.5 + 5 * math.sin(r)), (7.5 + 7 * math.cos(r), 7.5 + 7 * math.sin(r))], fill=rgba("yellow"), width=1)
    d.ellipse([3, 3, 12, 12], fill=rgba("amber3"), outline=rgba("ink9"))
    px(d, [(5, 5), (6, 5), (5, 6)], "white")
    return img


def hud_haze():
    img, d = canvas()
    d.ellipse([3, 1, 12, 10], fill=rgba("amber"), outline=rgba("ink9"))
    px(d, [(5, 3), (6, 3)], "white")
    for y, col, x0, x1 in ((7, "mars6", 0, 15), (10, "mars5", 1, 14), (13, "mars6", 0, 15)):
        d.rectangle([x0, y, x1, y + 1], fill=rgba(col))
    return img


# (fn, origin)
HUD = {
    "hud_energy_32": (ps.ic_power, "reused ui_icon_power_16 x2"),
    "hud_food_32": (ps.ic_food, "reused ui_icon_food_16 x2"),
    "hud_water_32": (ps.ic_water, "reused ui_icon_water_16 x2"),
    "hud_oxygen_32": (ps.ic_o2, "reused ui_icon_o2_16 x2"),
    "hud_res_32": (ps.ic_res, "reused ui_icon_res_16 x2"),
    "hud_radiation_32": (hud_radiation, "created"),
    "hud_morale_32": (hud_morale, "created"),
    "hud_weather_clear_32": (hud_clear, "created"),
    "hud_weather_cold_snap_32": (ps.hz_cold, "reused hz_cold_snap_16 x2"),
    "hud_weather_dust_haze_32": (hud_haze, "created"),
    "hud_weather_dust_storm_32": (ps.hz_dust, "reused hz_dust_storm_16 x2"),
    "hud_weather_solar_flare_32": (ps.hz_flare, "reused hz_solar_flare_16 x2"),
}


# ============================================================ station (16 -> 48)
def st_rover():
    img, d = canvas()
    box(d, 2, 6, 13, 10, "steel")
    box(d, 8, 3, 12, 6, "white")
    box(d, 9, 4, 11, 5, "cyan", None)
    d.line([(4, 2), (4, 6)], fill=rgba("edge3"))
    px(d, [(3, 1), (5, 1)], "amber")
    d.line([(2, 8), (13, 8)], fill=rgba("edge3"))
    for cx in (4, 11):
        d.ellipse([cx - 2, 10, cx + 2, 14], fill=rgba("ink7"), outline=rgba("ink9"))
        px(d, [(cx, 12)], "steel")
    px(d, [(13, 7)], "amber")
    return img


def st_plants():
    img, d = canvas()
    box(d, 1, 10, 14, 14, "brown")
    d.line([(2, 12), (13, 12)], fill=rgba("brown2"))
    for x in (3, 7, 11):
        d.line([(x, 10), (x, 6)], fill=rgba("green2"))
        d.polygon([(x, 7), (x - 2, 4), (x - 3, 6), (x - 1, 8)], fill=rgba("green"), outline=rgba("ink9"))
        d.polygon([(x, 6), (x + 2, 3), (x + 3, 5), (x + 1, 7)], fill=rgba("green"), outline=rgba("ink9"))
    px(d, [(2, 1), (8, 1), (13, 1)], "amber3")
    return img


def st_sensors():
    img, d = canvas()
    d.line([(7, 7), (7, 14)], fill=rgba("steel"), width=2)
    box(d, 4, 13, 11, 15, "edge5")
    d.chord([2, 3, 11, 11], 20, 200, fill=rgba("cream"), outline=rgba("ink9"))
    px(d, [(8, 5)], "amber")
    d.arc([8, 0, 15, 7], 280, 80, fill=rgba("cyan"), width=1)
    d.arc([10, 1, 15, 6], 280, 80, fill=rgba("cyan"), width=1)
    return img


def st_cargo():
    img, d = canvas()
    box(d, 1, 7, 14, 14, "brown")
    d.line([(2, 10), (13, 10)], fill=rgba("brown2"))
    d.polygon([(1, 7), (14, 7), (15, 3), (3, 2)], fill=rgba("amber"), outline=rgba("ink9"))
    box(d, 6, 11, 9, 13, "amber3", None)
    return img


STATION = {"station_rover_bay_48": st_rover, "station_plants_48": st_plants,
           "station_sensors_48": st_sensors, "station_cargo_box_48": st_cargo}
CARGO = {
    "cargo_repair_kit_48": (ps.repair_kit, "reused item_repair_kit_16 x3"),
    "cargo_medkit_48": (ps.medkit, "reused item_medkit_16 x3"),
    "cargo_battery_pack_48": (ps.battery_pack, "reused item_battery_pack_16 x3"),
    "cargo_seed_pod_48": (ps.seed_pod, "reused item_seed_pod_16 x3"),
    "cargo_extra_rations_48": (ps.rations, "reused item_rations_16 x3"),
    "cargo_wind_sampler_48": (ps.weather_sensor, "reused item_weather_sensor_16 x3"),
}


# ============================================================ badges (24 native)
def badge(border, glyph):
    img = Image.new("RGBA", (24, 24), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.polygon([(2, 0), (21, 0), (23, 2), (23, 21), (21, 23), (2, 23), (0, 21), (0, 2)], fill=rgba("ink9"))
    d.polygon([(3, 1), (20, 1), (22, 3), (22, 20), (20, 22), (3, 22), (1, 20), (1, 3)], fill=rgba(border))
    d.polygon([(3, 2), (20, 2), (21, 3), (21, 20), (20, 21), (3, 21), (2, 20), (2, 3)], fill=rgba("ink6"))
    glyph(d)
    return img


def line2(d, a, b, col, w=2):
    d.line([a, b], fill=rgba(col), width=w)


def g_eng(d):
    line2(d, (6, 17), (17, 6), "ink9", 4)
    line2(d, (17, 17), (6, 6), "ink9", 4)
    line2(d, (6, 17), (17, 6), "cream", 2)
    line2(d, (17, 17), (6, 6), "steel", 2)
    box(d, 14, 4, 19, 8, "cream", "ink9")
    d.ellipse([3, 3, 9, 9], fill=rgba("steel"), outline=rgba("ink9"))
    box(d, 5, 3, 7, 5, "ink6", None)


def g_bio(d):
    d.polygon([(5, 18), (6, 9), (13, 4), (19, 5), (18, 13), (10, 18)], fill=rgba("green"), outline=rgba("ink9"))
    d.line([(6, 18), (16, 7)], fill=rgba("green2"), width=1)
    d.line([(4, 20), (8, 16)], fill=rgba("cream"), width=1)
    px(d, [(10, 8), (12, 6)], "white")


def g_nav(d):
    d.ellipse([4, 4, 19, 19], fill=rgba("ink7"), outline=rgba("cream"))
    d.polygon([(11, 5), (14, 11), (11, 12), (9, 11)], fill=rgba("amber"))
    d.polygon([(11, 18), (14, 12), (11, 11), (9, 12)], fill=rgba("cream"))
    px(d, [(11, 11), (12, 11)], "ink9")
    px(d, [(3, 11), (20, 11), (11, 3), (11, 20)], "cream")


def g_med(d):
    box(d, 9, 4, 14, 19, "cream", "ink9")
    box(d, 4, 9, 19, 14, "cream", "ink9")
    box(d, 10, 5, 13, 18, "red", None)
    box(d, 5, 10, 18, 13, "red", None)


def g_sci(d):
    d.polygon([(9, 3), (14, 3), (14, 9), (19, 19), (4, 19), (9, 9)], fill=rgba("ink7"), outline=rgba("cream"))
    d.polygon([(7, 14), (16, 14), (18, 18), (5, 18)], fill=rgba("cyan"))
    px(d, [(10, 11), (13, 16), (9, 16)], "white")
    d.line([(8, 3), (15, 3)], fill=rgba("cream"), width=1)


def g_goal(d):
    box(d, 5, 4, 6, 20, "cream", "ink9")
    d.polygon([(7, 4), (19, 7), (7, 12)], fill=rgba("amber"), outline=rgba("ink9"))
    box(d, 3, 19, 9, 20, "edge3", None)


def g_sensor(d):
    d.line([(11, 10), (11, 19)], fill=rgba("steel"), width=2)
    box(d, 7, 19, 15, 20, "edge3", None)
    d.chord([5, 6, 15, 14], 20, 200, fill=rgba("cream"), outline=rgba("ink9"))
    d.arc([11, 3, 20, 12], 280, 80, fill=rgba("cyan"), width=1)
    d.arc([14, 5, 20, 10], 280, 80, fill=rgba("cyan"), width=1)


def g_rover(d):
    box(d, 3, 9, 18, 15, "steel")
    box(d, 11, 5, 17, 9, "white")
    box(d, 13, 6, 16, 8, "cyan", None)
    d.line([(6, 4), (6, 9)], fill=rgba("cream"))
    for cx in (6, 15):
        d.ellipse([cx - 3, 14, cx + 3, 20], fill=rgba("ink7"), outline=rgba("cream"))


def g_supplies(d):
    box(d, 4, 8, 19, 19, "brown", "ink9")
    d.line([(5, 13), (18, 13)], fill=rgba("brown2"))
    d.polygon([(4, 8), (19, 8), (20, 4), (5, 3)], fill=rgba("amber"), outline=rgba("ink9"))
    box(d, 9, 14, 14, 17, "amber3", None)


def g_crew(d):
    d.ellipse([6, 3, 14, 11], fill=rgba("cream"), outline=rgba("ink9"))
    box(d, 8, 6, 12, 8, "cyan8", None)
    d.polygon([(3, 20), (4, 13), (8, 11), (12, 11), (16, 13), (17, 20)], fill=rgba("cream"), outline=rgba("ink9"))
    box(d, 17, 11, 18, 17, "green", None)
    box(d, 15, 13, 20, 14, "green", None)


BADGES = {
    "badge_cat_eng_24": ("amber", g_eng), "badge_cat_bio_24": ("green", g_bio),
    "badge_cat_nav_24": ("cyan", g_nav), "badge_cat_med_24": ("red", g_med),
    "badge_cat_sci_24": ("blue", g_sci), "badge_cat_goal_24": ("amber3", g_goal),
    "badge_check_prep_sensor_24": ("cyan", g_sensor), "badge_check_prep_rover_24": ("mars5", g_rover),
    "badge_check_prep_supplies_24": ("amber", g_supplies), "badge_check_assign_crew_24": ("green", g_crew),
}


# ============================================================ banners (240x70 -> 480x140)
def banner(kicker, word, accent, icon_fn, big=20):
    w, h = 240, 70
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    def frame(inset, col):
        c = 6 + inset
        pts = [(inset + c, inset), (w - 1 - inset - c, inset), (w - 1 - inset, inset + c), (w - 1 - inset, h - 1 - inset - c),
               (w - 1 - inset - c, h - 1 - inset), (inset + c, h - 1 - inset), (inset, h - 1 - inset - c), (inset, inset + c)]
        d.polygon(pts, fill=rgba(col))

    frame(0, "ink9")
    frame(1, accent)
    frame(3, "ink8")
    frame(4, "ink7")
    frame(6, "ink8")
    for x in range(26, w - 26, 8):
        d.polygon([(x, 8), (x + 4, 8), (x + 2, 11), (x - 2, 11)], fill=rgba(accent))
        d.polygon([(x, h - 9), (x + 4, h - 9), (x + 2, h - 12), (x - 2, h - 12)], fill=rgba(accent))
    ic = icon_fn()
    img.alpha_composite(ic, (16, 27))
    img.alpha_composite(ic, (w - 32, 27))
    kf, bf = font(10), font(big)
    d.fontmode = "1"
    cx = w // 2
    d.text((cx + 1, 21), kicker, font=kf, fill=rgba("ink9"), anchor="ma")
    d.text((cx, 20), kicker, font=kf, fill=rgba("cream2"), anchor="ma")
    for dx, dy in ((2, 2), (1, 2), (2, 1)):
        d.text((cx + dx, 31 + dy), word, font=bf, fill=rgba("ink9"), anchor="ma")
    d.text((cx, 31), word, font=bf, fill=rgba(accent), anchor="ma")
    return img


# ============================================================ Moon interior (640x360 -> 1280x720)
def person(d, x, feet, suit="white", hat=None):
    y = feet - 13
    d.rectangle([x + 1, y + 8, x + 2, feet], fill=rgba("edge5"))
    d.rectangle([x + 4, y + 8, x + 5, feet], fill=rgba("edge5"))
    d.rectangle([x, y + 4, x + 6, y + 9], fill=rgba(suit), outline=rgba("ink9"))
    d.rectangle([x + 1, y + 5, x + 5, y + 6], fill=rgba("amber" if suit == "white" else "white"))
    d.rectangle([x + 1, y, x + 5, y + 4], fill=rgba("white"), outline=rgba("ink9"))
    d.rectangle([x + 2, y + 1, x + 4, y + 3], fill=rgba("cyan8"))
    if hat:
        d.rectangle([x + 1, y - 1, x + 5, y], fill=rgba(hat))


def interior_moon():
    W, H = 640, 360
    img = Image.new("RGBA", (W, H), rgba("ink8"))
    d = ImageDraw.Draw(img)
    rng = np.random.default_rng(11)
    wx0, wx1, wy0, wy1 = 36, 604, 34, 176
    d.rectangle([wx0, wy0, wx1, wy1], fill=rgba("ink9"))
    for _ in range(70):
        d.point((int(rng.integers(wx0, wx1)), int(rng.integers(wy0, 130))), fill=rgba("cream2" if rng.random() < .3 else "edge5"))
    d.ellipse([390, 52, 424, 86], fill=rgba("blue2"), outline=rgba("ink9"))   # Earth
    d.polygon([(398, 60), (408, 58), (412, 66), (402, 70)], fill=rgba("green2"))
    d.pieslice([390, 52, 424, 86], 300, 120, fill=rgba("blue"))
    for base, amp, col, seed in ((140, 22, "ink6", 1), (156, 14, "edge5", 2)):
        r2 = np.random.default_rng(seed)
        pts = [(wx0, wy1)]
        y = base
        for x in range(wx0, wx1 + 12, 12):
            y = int(np.clip(y + r2.integers(-7, 8), base - amp, base + amp // 2))
            pts.append((x, y))
        pts.append((wx1, wy1))
        d.polygon(pts, fill=rgba(col))
    d.rectangle([wx0, 164, wx1, wy1], fill=rgba("edge3"))
    for cx, cy, rx in ((120, 170, 18), (330, 172, 26), (560, 169, 14)):
        d.ellipse([cx - rx, cy - 3, cx + rx, cy + 3], fill=rgba("edge5"), outline=rgba("ink6"))
    for x in (230, 250, 270):
        d.polygon([(x, 164), (x + 4, 152), (x + 24, 152), (x + 20, 164)], fill=rgba("blue2"), outline=rgba("ink9"))
        d.line([(x + 12, 152), (x + 10, 164)], fill=rgba("ink9"))
    d.chord([440, 130, 520, 190], 180, 360, fill=rgba("cream2"), outline=rgba("ink9"))
    for dx in (-24, -8, 8, 24):
        d.line([(480 + dx, 160), (480 + dx // 2, 133)], fill=rgba("cyan8"))
    d.line([(450, 148), (510, 148)], fill=rgba("cyan8"))
    box(d, 520, 146, 580, 164, "steel")
    box(d, 524, 150, 540, 156, "ink7", None)
    d.line([(160, 164), (160, 118)], fill=rgba("cream2"), width=2)
    px(d, [(160, 115)], "red")
    d.line([(100, 164), (100, 140)], fill=rgba("cream2"), width=2)
    d.chord([88, 128, 114, 146], 160, 340, fill=rgba("white"), outline=rgba("ink9"))
    for x0 in (150, 290, 430, 570):
        d.polygon([(x0, wy0), (x0 + 16, wy0), (x0 - 4, wy1), (x0 - 24, wy1)], fill=rgba("ink7"), outline=rgba("ink9"))
        d.line([(x0 + 2, wy0), (x0 - 18, wy1)], fill=rgba("edge5"))
    d.rectangle([0, 0, W, 33], fill=rgba("ink7"))
    d.line([(0, 33), (W, 33)], fill=rgba("ink9"), width=2)
    d.line([(0, 31), (W, 31)], fill=rgba("edge5"))
    for y in (5, 11):
        d.line([(0, y), (W, y)], fill=rgba("ink6"), width=2)
    for x in (60, 230, 400, 570):
        box(d, x, 17, x + 40, 23, "amber3", "ink9")
        d.line([(x + 3, 19), (x + 37, 19)], fill=rgba("white"))
    for x0, x1 in ((0, 35), (605, W)):
        d.rectangle([x0, 34, x1, 232], fill=rgba("ink7"))
    d.line([(35, 34), (35, 232)], fill=rgba("ink9"), width=2)
    d.line([(605, 34), (605, 232)], fill=rgba("ink9"), width=2)
    d.rectangle([0, 176, W, 186], fill=rgba("ink6"), outline=rgba("ink9"))
    d.line([(0, 178), (W, 178)], fill=rgba("edge5"))
    for x in range(10, W, 22):
        d.line([(x, 176), (x, 186)], fill=rgba("ink9"))
    d.rectangle([0, 187, W, 236], fill=rgba("ink8"))
    for x in range(0, W, 110):
        d.rectangle([x + 100, 187, x + 108, 236], fill=rgba("ink7"))
    for x in (90, 215, 340, 465, 585):
        box(d, x, 190, x + 26, 193, "amber", None)
    box(d, 24, 196, 98, 236, "ink7")
    for y in (200, 212, 224):
        d.rectangle([28, y, 94, y + 8], fill=rgba("green2"))
        for x in range(30, 92, 5):
            d.point((x, y + 1), fill=rgba("green"))
            d.point((x + 2, y + 3), fill=rgba("green"))
        d.line([(28, y + 9), (94, y + 9)], fill=rgba("cyan"))
    box(d, 130, 198, 240, 234, "cyan8", "edge5")
    for i, ww in enumerate((46, 38, 24, 34, 42)):
        y = 203 + i * 6
        box(d, 150, y, 150 + ww, y + 2, "cyan", None)
        d.point((142, y + 1), fill=rgba("cream"))
    d.line([(134, 226), (146, 218), (154, 224), (166, 214)], fill=rgba("cyan"))
    box(d, 330, 198, 420, 234, "ink7", "edge5")
    box(d, 336, 202, 380, 205, "cream2", None)
    for i in range(4):
        y = 210 + i * 6
        box(d, 338, y, 370, y + 1, "edge3", None)
        box(d, 404, y - 1, 408, y + 3, "ink9", "edge3")
    box(d, 470, 198, 600, 234, "ink7")
    box(d, 560, 202, 596, 222, "cyan8", "edge5")
    d.line([(566, 216), (572, 208), (578, 214), (590, 206)], fill=rgba("cyan"))
    for x in range(476, 520, 8):
        box(d, x, 204, x + 4, 212, ("blue", "amber", "cream2", "green")[(x // 8) % 4], "ink9")
    person(d, 270, 236, "white")
    person(d, 300, 236, "amber")
    person(d, 520, 236, "white")
    box(d, 505, 224, 545, 228, "edge5", "ink9")
    d.rectangle([0, 236, W, 250], fill=rgba("ink6"), outline=rgba("ink9"))
    d.line([(0, 238), (W, 238)], fill=rgba("edge5"))
    for x in range(0, W, 24):
        d.polygon([(x, 244), (x + 8, 244), (x + 12, 249), (x + 4, 249)], fill=rgba("brown"))
    d.line([(0, 217), (W, 217)], fill=rgba("brown"), width=2)
    for x in range(8, W, 56):
        d.line([(x, 217), (x, 236)], fill=rgba("brown2"), width=2)
    d.rectangle([0, 251, W, 340], fill=rgba("ink9"))
    for y, col in ((262, "rust"), (270, "edge5")):
        d.line([(0, y), (W, y)], fill=rgba(col), width=4)
    for x in (140, 300, 450):
        d.line([(x, 251), (x, 340)], fill=rgba("edge5"), width=5)
        d.line([(x - 1, 251), (x - 1, 340)], fill=rgba("edge3"))
    d.rounded_rectangle([160, 290, 196, 340], radius=6, fill=rgba("cream2"), outline=rgba("ink9"))
    d.line([(166, 296), (166, 336)], fill=rgba("white"))
    text(d, (178, 306), "O2", font(10), rgba("cyan8"), "ma")
    d.rectangle([160, 328, 196, 334], fill=rgba("amber"))
    box(d, 220, 296, 290, 340, "ink7", "ink9")
    d.polygon([(254, 304), (246, 320), (254, 320), (250, 334), (266, 314), (258, 314), (262, 304)], fill=rgba("yellow"))
    box(d, 270, 300, 284, 312, "cyan8", None)
    for x in range(222, 290, 10):
        d.polygon([(x, 334), (x + 5, 334), (x + 8, 340), (x + 3, 340)], fill=rgba("amber"))
    for (x, y, w_, h_, col) in ((330, 316, 30, 24, "brown"), (360, 322, 26, 18, "edge3"), (338, 296, 26, 20, "edge3"),
                                (392, 296, 60, 6, "ink7"), (396, 300, 4, 40, "ink7"), (444, 300, 4, 40, "ink7")):
        box(d, x, y, x + w_, y + h_, col)
    for (x, y) in ((402, 322), (424, 322), (404, 304)):
        box(d, x, y, x + 20, y + 16, "brown", "ink9")
        d.line([(x, y + 8), (x + 20, y + 8)], fill=rgba("brown2"))
    box(d, 500, 290, 556, 340, "ink6", "ink9")
    box(d, 510, 298, 546, 310, "amber", "ink9")
    px(d, [(512, 300)], "white")
    for x in (590, 612):
        d.line([(x, 252), (x, 340)], fill=rgba("amber"), width=2)
    for y in range(256, 340, 8):
        d.line([(590, y), (612, y)], fill=rgba("brown"))
    person(d, 100, 340, "amber", "amber3")
    person(d, 470, 340, "amber", "amber3")
    box(d, 478, 326, 490, 334, "brown", "ink9")
    d.rectangle([0, 340, W, H], fill=rgba("ink7"))
    d.line([(0, 340), (W, 340)], fill=rgba("edge5"), width=2)
    for x in range(0, W, 32):
        d.line([(x, 341), (x - 8, H)], fill=rgba("ink6"))
    rgb = img.convert("RGB")
    low = Image.blend(rgb, Image.new("RGB", (W, H), hexrgba(P["ink9"])[:3]), 0.34)  # low contrast: UI sits on top
    return low.convert("RGBA")


# ============================================================ event cards (128x72 -> 256x144)
W_, H_ = 128, 72


def sky(d, h, cols):
    n = len(cols)
    for i, c in enumerate(cols):
        d.rectangle([0, i * h // n, W_, (i + 1) * h // n], fill=rgba(c))


def card_base(sky_cols, horizon, ground_cols=("rust", "mars6")):
    img = Image.new("RGBA", (W_, H_), rgba("ink8"))
    d = ImageDraw.Draw(img)
    sky(d, horizon, sky_cols)
    d.rectangle([0, horizon, W_, H_], fill=rgba(ground_cols[0]))
    d.rectangle([0, horizon, W_, horizon + 1], fill=rgba(ground_cols[1]))
    return img, d


def dome(d, cx, base, r, col="edge3"):
    d.chord([cx - r, base - r, cx + r, base + r], 180, 360, fill=rgba(col), outline=rgba("ink9"))
    d.line([(cx, base - r), (cx, base)], fill=rgba("cyan8"))
    d.line([(cx - r // 2, base - int(r * .85)), (cx - r // 2, base)], fill=rgba("cyan8"))
    d.line([(cx + r // 2, base - int(r * .85)), (cx + r // 2, base)], fill=rgba("cyan8"))
    box(d, cx - r - 2, base, cx + r + 2, base + 3, "steel")


def astro(d, x, y, suit="white"):
    d.rectangle([x + 1, y + 9, x + 2, y + 13], fill=rgba("edge5"))
    d.rectangle([x + 4, y + 9, x + 5, y + 13], fill=rgba("edge5"))
    d.rectangle([x - 1, y + 5, x, y + 9], fill=rgba("edge3"))
    d.rectangle([x, y + 4, x + 6, y + 9], fill=rgba(suit), outline=rgba("ink9"))
    d.rectangle([x + 1, y + 6, x + 5, y + 7], fill=rgba("amber"))
    d.rectangle([x + 1, y, x + 5, y + 4], fill=rgba("white"), outline=rgba("ink9"))
    d.rectangle([x + 2, y + 1, x + 5, y + 3], fill=rgba("cyan8"))
    d.point((x + 2, y + 1), fill=rgba("cyan"))


def paste_icon(img, fn, x, y):
    img.alpha_composite(fn(), (x, y))


def ev_landing():
    img, d = card_base(("ink8", "rust", "rust", "mars6", "mars5"), 46)
    for x, y in ((10, 6), (40, 12), (98, 8), (115, 18), (70, 4)):
        d.point((x, y), fill=rgba("cream2"))
    d.polygon([(56, 22), (72, 22), (78, 42), (50, 42)], fill=rgba("white"), outline=rgba("ink9"))
    d.polygon([(60, 12), (68, 12), (72, 22), (56, 22)], fill=rgba("cream2"), outline=rgba("ink9"))
    box(d, 60, 27, 68, 32, "cyan8")
    px(d, [(61, 28), (62, 28)], "cyan")
    for x0, x1 in ((52, 44), (76, 84), (64, 64)):
        d.line([(x0, 42), (x1, 54)], fill=rgba("edge3"), width=2)
    for x in (40, 80, 60):
        box(d, x, 54, x + 8, 55, "steel", None)
    astro(d, 96, 44)
    box(d, 104, 49, 109, 56, "cream", "ink9")
    d.line([(106, 51), (108, 51)], fill=rgba("edge5"))
    d.line([(106, 53), (108, 53)], fill=rgba("edge5"))
    paste_icon(img, ps.ic_check, 108, 6)
    return img


def ev_dusty_panels():
    img, d = card_base(("rust", "mars6", "mars5", "mars5"), 42)
    rng = np.random.default_rng(5)
    for x in (8, 46, 84):
        d.polygon([(x, 62), (x + 8, 30), (x + 36, 30), (x + 36 - 8, 62)], fill=rgba("blue2"), outline=rgba("ink9"))
        for k in (1, 2):
            d.line([(x + 8 + k * 9, 30), (x + k * 9, 62)], fill=rgba("ink9"))
        d.line([(x + 4, 46), (x + 32, 46)], fill=rgba("ink9"))
        d.line([(x + 18, 62), (x + 18, 68)], fill=rgba("steel"), width=2)
    for _ in range(46):
        x, y = int(rng.integers(8, 118)), int(rng.integers(30, 62))
        d.rectangle([x, y, x + int(rng.integers(1, 4)), y + 1], fill=rgba("mars5" if rng.random() < .6 else "amber"))
    d.arc([60, 6, 118, 26], 190, 350, fill=rgba("amber"), width=2)
    d.arc([70, 12, 126, 30], 200, 340, fill=rgba("mars5"), width=2)
    paste_icon(img, ps.ic_down, 6, 6)
    return img


def ev_cloudy_tanks():
    img = Image.new("RGBA", (W_, H_), rgba("ink8"))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 56, W_, H_], fill=rgba("ink7"))
    d.line([(0, 56), (W_, 56)], fill=rgba("edge5"))
    box(d, 40, 4, 88, 8, "ink7", "ink9")
    box(d, 46, 8, 82, 10, "amber3", None)
    rng = np.random.default_rng(6)
    for i, x in enumerate((8, 48, 88)):
        d.line([(x + 16, 12), (x + 16, 6)], fill=rgba("edge5"))
        d.rounded_rectangle([x, 14, x + 32, 62], radius=5, fill=rgba("ink9"), outline=rgba("edge3"))
        d.rectangle([x + 2, 26, x + 30, 60], fill=rgba(("green2", "brown2", "green2")[i]))
        for _ in range(26):
            cx, cy = int(rng.integers(x + 3, x + 29)), int(rng.integers(27, 59))
            d.rectangle([cx, cy, cx + 2, cy + 1], fill=rgba("cream2" if rng.random() < .5 else "brown"))
        d.line([(x + 5, 18), (x + 5, 58)], fill=rgba("white"))
        d.line([(x + 16, 26), (x + 16, 18)], fill=rgba("green2"))
        d.polygon([(x + 16, 20), (x + 11, 15), (x + 14, 24)], fill=rgba("green"))
        d.polygon([(x + 17, 19), (x + 23, 15), (x + 19, 24)], fill=rgba("green"))
        box(d, x - 2, 62, x + 34, 66, "edge5")
    paste_icon(img, ps.ic_warn, 108, 4)
    return img


def ev_sandstorm():
    img, d = card_base(("mars6", "mars5", "mars5", "amber"), 52, ("rust", "mars6"))
    for i, (col, top) in enumerate((("rust", 4), ("mars6", 14), ("mars5", 26))):
        pts = [(0, 56)]
        for x in range(0, W_ + 8, 8):
            pts.append((x, int(top + 10 * math.sin(x / 11 + i * 2) + x * 0.08)))
        pts.append((W_, 56))
        d.polygon(pts, fill=rgba(col))
    for i in range(5):
        d.arc([10 + i * 18, 8 + i * 6, 50 + i * 18, 30 + i * 6], 180, 330, fill=rgba("amber"), width=1)
    dome(d, 36, 60, 14)
    box(d, 70, 52, 96, 60, "steel", "ink9")
    d.line([(90, 52), (90, 40)], fill=rgba("edge3"))
    px(d, [(90, 39)], "red")
    paste_icon(img, ps.ic_warn, 108, 4)
    return img


def ev_pinhole():
    img = Image.new("RGBA", (W_, H_), rgba("ink7"))
    d = ImageDraw.Draw(img)
    for x in range(0, W_, 32):
        d.line([(x, 0), (x, H_)], fill=rgba("ink9"), width=2)
        d.line([(x + 2, 0), (x + 2, H_)], fill=rgba("edge5"))
    for y in (0, 36):
        d.line([(0, y), (W_, y)], fill=rgba("ink9"), width=2)
        d.line([(0, y + 2), (W_, y + 2)], fill=rgba("edge5"))
    for x in range(4, W_, 32):
        for y in (6, 30, 42, 66):
            d.rectangle([x, y, x + 2, y + 2], fill=rgba("edge3"), outline=rgba("ink9"))
    d.ellipse([46, 14, 82, 50], fill=rgba("ink6"), outline=rgba("cream"), width=2)
    d.arc([48, 16, 80, 48], 190, 260, fill=rgba("white"), width=1)
    d.line([(78, 46), (92, 60)], fill=rgba("cream"), width=3)
    d.ellipse([61, 29, 66, 34], fill=rgba("ink9"), outline=rgba("edge3"))
    px(d, [(63, 31)], "red2")
    for x, y in ((67, 28), (70, 25), (73, 22), (76, 20), (72, 28), (75, 26), (100, 12), (108, 18), (114, 10)):
        d.point((x, y), fill=rgba("cyan"))
    paste_icon(img, ps.ic_warn, 8, 8)
    return img


def ev_flare():
    img = Image.new("RGBA", (W_, H_), rgba("ink9"))
    d = ImageDraw.Draw(img)
    rng = np.random.default_rng(8)
    for _ in range(30):
        d.point((int(rng.integers(0, W_)), int(rng.integers(0, 44))), fill=rgba("edge5"))
    d.ellipse([-30, -30, 32, 32], fill=rgba("red2"))
    d.ellipse([-26, -26, 26, 26], fill=rgba("mars5"))
    d.ellipse([-22, -22, 20, 20], fill=rgba("amber"))
    d.ellipse([-18, -18, 14, 14], fill=rgba("yellow"))
    d.arc([10, -30, 90, 40], 20, 100, fill=rgba("red"), width=3)
    d.arc([14, -24, 76, 30], 25, 95, fill=rgba("amber"), width=2)
    for a in (10, 25, 40, 55, 70):
        r = math.radians(a)
        d.line([(30 * math.cos(r), 30 * math.sin(r)), (60 * math.cos(r), 60 * math.sin(r))], fill=rgba("amber3"), width=1)
    d.rectangle([0, 56, W_, H_], fill=rgba("ink7"))
    d.line([(0, 56), (W_, 56)], fill=rgba("edge5"))
    dome(d, 92, 58, 18)
    d.line([(60, 58), (60, 44)], fill=rgba("edge3"))
    d.chord([54, 38, 66, 48], 160, 340, fill=rgba("cream2"), outline=rgba("ink9"))
    box(d, 70, 4, 124, 18, "red2", "ink9")
    paste_icon(img, ps.ic_warn, 74, 3)
    for i in range(4):
        d.rectangle([94 + i * 7, 9, 98 + i * 7, 13], fill=rgba("red" if i % 2 == 0 else "ink9"))
    return img


def ev_probe():
    img = Image.new("RGBA", (W_, H_), rgba("ink9"))
    d = ImageDraw.Draw(img)
    rng = np.random.default_rng(9)
    for _ in range(40):
        d.point((int(rng.integers(0, W_)), int(rng.integers(0, 48))), fill=rgba("edge5" if rng.random() < .7 else "cream2"))
    d.rectangle([0, 52, W_, H_], fill=rgba("rust"))
    d.polygon([(0, 52), (20, 44), (48, 52)], fill=rgba("mars6"))
    d.polygon([(70, 52), (96, 42), (128, 52)], fill=rgba("mars6"))
    cx, cy = 64, 24
    for sx in (-1, 1):
        x0 = cx + sx * 8
        d.polygon([(x0, cy - 4), (x0 + sx * 18, cy - 5), (x0 + sx * 18, cy + 5), (x0, cy + 4)], fill=rgba("blue2"), outline=rgba("ink9"))
        d.line([(x0 + sx * 9, cy - 4), (x0 + sx * 9, cy + 4)], fill=rgba("ink9"))
    box(d, cx - 7, cy - 6, cx + 7, cy + 6, "steel", "ink9")
    box(d, cx - 3, cy - 3, cx + 3, cy + 3, "ink7", None)
    px(d, [(cx, cy)], "red")
    d.line([(cx, cy - 6), (cx, cy - 12)], fill=rgba("edge3"))
    d.chord([cx - 5, cy - 16, cx + 5, cy - 8], 180, 360, fill=rgba("cream"), outline=rgba("ink9"))
    for r in (16, 24, 32):
        d.arc([cx - r, cy - r, cx + r, cy + r], 30, 150, fill=rgba("cyan" if r < 30 else "cyan8"), width=1)
    d.line([(24, 52), (24, 44)], fill=rgba("edge3"), width=2)
    d.chord([18, 38, 30, 48], 160, 340, fill=rgba("cream2"), outline=rgba("ink9"))
    text(d, (110, 4), "?", font(24), rgba("amber"), "ma")
    return img


def ev_pipe():
    img = Image.new("RGBA", (W_, H_), rgba("ink8"))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 58, W_, H_], fill=rgba("ink7"))
    d.line([(0, 58), (W_, 58)], fill=rgba("edge5"))
    for x in range(0, W_, 16):
        d.line([(x, 0), (x, 58)], fill=rgba("ink9"))
    d.rectangle([0, 22, W_, 44], fill=rgba("edge5"), outline=rgba("ink9"))
    d.line([(0, 24), (W_, 24)], fill=rgba("steel"))
    d.rectangle([0, 28, W_, 40], fill=rgba("ink9"))
    d.rectangle([0, 29, 56, 39], fill=rgba("blue2"))
    d.line([(0, 31), (56, 31)], fill=rgba("blue"))
    d.polygon([(56, 28), (66, 31), (74, 29), (82, 33), (76, 40), (62, 40), (56, 39)], fill=rgba("brown"), outline=rgba("brown2"))
    px(d, [(62, 33), (68, 36), (72, 32), (66, 38)], "brown2")
    for x in (48, 90):
        box(d, x, 19, x + 6, 47, "edge3", "ink9")
    for x, y in ((50, 49), (50, 55), (52, 52)):
        d.point((x, y), fill=rgba("blue"))
    d.polygon([(100, 62), (116, 52), (120, 56), (104, 66)], fill=rgba("steel"), outline=rgba("ink9"))
    d.ellipse([112, 48, 122, 58], outline=rgba("steel"), width=2)
    paste_icon(img, ps.ic_warn, 8, 4)
    return img


def ev_movie():
    img = Image.new("RGBA", (W_, H_), rgba("ink8"))
    d = ImageDraw.Draw(img)
    d.rectangle([0, 58, W_, H_], fill=rgba("ink7"))
    box(d, 24, 6, 104, 46, "ink9", "edge5")
    d.rectangle([27, 9, 101, 43], fill=rgba("cyan8"))
    for y in range(11, 43, 4):
        d.line([(28, y), (100, y)], fill=hexrgba("#0F4450"))
    d.polygon([(56, 17), (74, 26), (56, 35)], fill=rgba("cyan"), outline=rgba("white"))
    for y in range(8, 44, 7):
        box(d, 108, y, 111, y + 3, "edge5", None)
        box(d, 18, y, 21, y + 3, "edge5", None)
    for cx in (34, 94):
        d.ellipse([cx - 8, 46, cx + 8, 62], fill=rgba("white"), outline=rgba("ink9"))
        d.rectangle([cx - 11, 56, cx + 11, H_], fill=rgba("cream2"), outline=rgba("ink9"))
        d.rectangle([cx - 8, 62, cx + 8, H_], fill=rgba("mars5"))
    d.polygon([(52, 60), (78, 60), (74, 72), (56, 72)], fill=rgba("red"), outline=rgba("ink9"))
    for x, y in ((56, 54), (60, 52), (64, 54), (68, 52), (72, 54), (62, 50), (70, 50)):
        d.rectangle([x, y, x + 2, y + 2], fill=rgba("white" if (x + y) % 2 else "amber3"))
    box(d, 62, 62, 68, 70, "white", None)
    box(d, 4, 4, 12, 7, "amber3", None)
    return img


def ev_ice():
    img, d = card_base(("rust", "mars6", "mars5", "mars5"), 40)
    d.polygon([(0, 40), (30, 30), (60, 40)], fill=rgba("mars6"))
    d.polygon([(80, 40), (110, 28), (128, 40)], fill=rgba("mars6"))
    d.ellipse([40, 46, 100, 66], fill=rgba("cyan8"))
    for pts, col in (([(56, 62), (62, 38), (68, 62)], "cyan"), ([(64, 62), (74, 30), (82, 62)], "white"),
                     ([(76, 62), (84, 42), (92, 62)], "cyan"), ([(48, 62), (52, 48), (58, 62)], "cyan8")):
        d.polygon(pts, fill=rgba(col), outline=rgba("ink9"))
    d.line([(74, 32), (74, 60)], fill=rgba("cyan"))
    px(d, [(62, 40), (80, 44), (70, 28)], "white")
    for x, y in ((46, 36), (96, 36), (58, 24)):
        for dx, dy, c in ((0, 0, "white"), (-1, 0, "cyan"), (1, 0, "cyan"), (0, -1, "cyan"), (0, 1, "cyan")):
            d.point((x + dx, y + dy), fill=rgba(c))
    box(d, 8, 52, 30, 58, "steel", "ink9")
    box(d, 20, 48, 28, 52, "white", "ink9")
    for cx in (12, 26):
        d.ellipse([cx - 3, 56, cx + 3, 62], fill=rgba("ink7"), outline=rgba("ink9"))
    d.line([(14, 44), (14, 52)], fill=rgba("edge3"))
    d.line([(104, 44), (104, 60)], fill=rgba("cream"))
    d.polygon([(105, 44), (116, 47), (105, 51)], fill=rgba("amber"), outline=rgba("ink9"))
    return img


EVENTS = {
    "event_landing_checkup_256x144": ev_landing, "event_dusty_solar_panels_256x144": ev_dusty_panels,
    "event_cloudy_plant_tanks_256x144": ev_cloudy_tanks, "event_giant_sandstorm_incoming_256x144": ev_sandstorm,
    "event_tiny_hull_pinhole_256x144": ev_pinhole, "event_solar_flare_alert_256x144": ev_flare,
    "event_mystery_probe_ping_256x144": ev_probe, "event_clogged_water_pipe_256x144": ev_pipe,
    "event_movie_snack_night_256x144": ev_movie, "event_ice_found_nearby_256x144": ev_ice,
}


# ============================================================ contact sheets
def sheet(group, cols, cell, scale=1, labels=True):
    items = REGISTRY.get(group)
    if not items:
        return
    pad, lab = 8, (12 if labels else 0)
    rows = (len(items) + cols - 1) // cols
    cw, ch = cell[0] * scale + pad * 2, cell[1] * scale + pad * 2 + lab
    s = Image.new("RGBA", (cols * cw, rows * ch), rgba("ink9"))
    sd = ImageDraw.Draw(s)
    for i, (rel, im, _, _o) in enumerate(items):
        x, y = (i % cols) * cw + pad, (i // cols) * ch + pad
        im2 = up(im, scale) if scale > 1 else im
        sd.rectangle([x - 1, y - 1, x + im2.width, y + im2.height], outline=rgba("ink7"))
        s.alpha_composite(im2.convert("RGBA"), (x, y))
        if labels:
            sd.text((x, y + im2.height + 2), Path(rel).stem[:int(cw / 6)], fill=rgba("cream2"))
    REVIEW.mkdir(parents=True, exist_ok=True)
    s.save(REVIEW / f"outpost_{group}.png")


def main() -> int:
    for n, (fn, origin) in HUD.items():
        emit("hud", "hud", n, fn(), 2, origin)
    for n, fn in STATION.items():
        emit("station", "station", n, fn(), 3, "created")
    for n, (fn, origin) in CARGO.items():
        emit("cargo", "cargo", n, fn(), 3, origin)
    for n, (col, g) in BADGES.items():
        emit("badges", "badges", n, badge(col, g), 1, "created (24 native)")
    emit("banners", "banners", "ui_banner_mission_accomplished_480x140",
         banner("MISSION", "ACCOMPLISHED", "amber", ps.ic_check, 20), 2, "created")
    emit("banners", "banners", "ui_banner_mission_failed_480x140",
         banner("MISSION", "FAILED", "red", ps.ic_warn, 26), 2, "created")
    for n, fn in EVENTS.items():
        emit("events", "events", n, fn(), 2, "created")
    emit("backdrops", "backdrops", "env_outpost_interior_moon_1280x720", interior_moon(), 2, "created")

    sheet("hud", 6, (32, 32), 2)
    sheet("station", 4, (48, 48), 2)
    sheet("cargo", 6, (48, 48), 2)
    sheet("badges", 5, (24, 24), 3)
    sheet("banners", 1, (480, 140), 1)
    sheet("events", 3, (256, 144), 1)
    sheet("backdrops", 1, (1280, 720), 1, labels=False)
    print({k: len(v) for k, v in REGISTRY.items()})
    for s in SKIPPED:
        print(s)
    return 0


if __name__ == "__main__":
    sys.exit(main())
