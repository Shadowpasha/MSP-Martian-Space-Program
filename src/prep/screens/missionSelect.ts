// Mission Select (Crater Map direction): pick a site on the crater map. The
// selected site's route steps out from the base — the trip length is the reason
// for every crate packed later.
import type { Entity } from 'esengine';
import { HAZARD_INFO, MARS_BASE, MOON_BASE } from '../data/missions';
import { getItem } from '../data/items';
import type { PrepState } from '../logic/flow';
import type { MissionOffer } from '../logic/roll';
import { MAPS, iconPath, itemSpritePath } from '../ui/assets';
import type { Ui } from '../ui/kit';
import { LAYOUT, T, TYPE } from '../ui/tokens';
import { buildShell, type ShellActions } from './shell';

export interface MissionActions extends ShellActions {
    focus(index: number): void;
    choose(): void;
}

export interface ScreenHandle {
    /** Called every frame with a monotonic time in ms (route animation). */
    tick?(nowMs: number): void;
    refreshPreview?(): void;
}

const MAP_W = 640;
const MAP_H = 360;
const ROLE_NAME: Record<string, string> = { engineer: 'Engineer', botanist: 'Botanist', pilot: 'Pilot', medic: 'Medic' };

export function planetLabel(o: MissionOffer): string {
    return o.mission.planet === 'moon' ? 'MOON' : 'MARS';
}

export function buildMissionSelect(ui: Ui, root: Entity, s: PrepState, act: MissionActions): ScreenHandle {
    const focused = s.offers[s.focused]!;
    const moon = focused.mission.planet === 'moon';
    buildShell(ui, root, s, {
        title: moon ? 'Lunar South Pole' : 'Jezero Crater, Mars',
        subtitle: 'Sol 1 · Pick your mission. Each is based on real NASA work.',
        icon: 'ui_icon_mission_16',
    }, act);

    // ---- Map -------------------------------------------------------------
    const m = LAYOUT.main;
    const mapPanel = ui.panel(root, m.x, m.y, m.w, 392, { fill: T.ink800 });
    const mx = 16;
    const my = 14;
    ui.image(mapPanel, mx, my, MAP_W, MAP_H, moon ? MAPS.moon : MAPS.mars);

    const toPx = (p: { x: number; y: number }) => ({ x: mx + Math.round(p.x * MAP_W), y: my + Math.round(p.y * MAP_H) });
    const base = toPx(moon ? MOON_BASE.map : MARS_BASE.map);

    // Route dots (revealed step by step in tick()).
    const target = toPx(focused.site.map);
    const dist = Math.hypot(target.x - base.x, target.y - base.y);
    const steps = Math.max(2, Math.floor(dist / 14));
    const dots: Entity[] = [];
    for (let i = 1; i < steps; i++) {
        const t = i / steps;
        const x = Math.round(base.x + (target.x - base.x) * t) - 3;
        const y = Math.round(base.y + (target.y - base.y) * t) - 3;
        const outline = ui.box(mapPanel, x - 1, y - 1, 8, 8, T.ink900);
        ui.box(outline, 1, 1, 6, 6, i % 2 ? T.amber400 : T.cyan400);
        dots.push(outline);
        ui.setVisible(outline, false);
    }

    // Base marker.
    ui.image(mapPanel, base.x - 16, base.y - 16, 32, 32, iconPath('ui_icon_base_16'));
    chip(ui, mapPanel, base.x - 30, base.y + 18, 60, 'BASE', T.cyan400);

    // Pins for offers on the planet shown.
    s.offers.forEach((o, i) => {
        if (o.mission.planet !== focused.mission.planet) return;
        const p = toPx(o.site.map);
        const sel = i === s.focused;
        ui.hotspot(mapPanel, p.x - 20, p.y - 34, 40, 40, T.clear, { click: () => act.focus(i) });
        ui.image(mapPanel, p.x - 16, p.y - 32, 32, 32, iconPath('ui_icon_mission_16'), {
            tint: sel ? { r: 1, g: 1, b: 1, a: 1 } : { r: 0.75, g: 0.72, b: 0.78, a: 1 },
        });
        const w = Math.max(96, o.site.name.length * 8 + 20);
        chip(ui, mapPanel, Math.min(MAP_W + mx - w, Math.max(mx, p.x - w / 2)), p.y + 4, w, o.site.name, sel ? T.amber400 : T.textPrimary);
    });

    // Route summary pinned to the map's top-left (never collides with pins).
    const routeText = `Base to ${focused.site.name}: ${focused.site.distanceMP} move points · ${focused.travelSolsOneWay} sol${focused.travelSolsOneWay === 1 ? '' : 's'} each way`;
    const routeChip = chip(ui, mapPanel, mx + 8, my + 8, Math.min(MAP_W - 16, routeText.length * 8 + 24), routeText, T.cyan400);
    ui.setVisible(routeChip, false);

    chip(ui, mapPanel, mx + MAP_W - 336, my + MAP_H - 32, 328, 'Map drawn for MSP · positions approximate', T.textSecondary);

    // ---- Mission cards ---------------------------------------------------
    const cardY = m.y + 404;
    const cardW = Math.floor((m.w - 24) / 3);
    s.offers.forEach((o, i) => missionCard(ui, root, m.x + i * (cardW + 12), cardY, cardW, m.h - 404, o, i === s.focused, () => act.focus(i)));
    ui.brackets(root, m.x + s.focused * (cardW + 12), cardY, cardW, m.h - 404);

    // ---- Inspector -------------------------------------------------------
    inspector(ui, root, focused, act);

    // Signature move: reveal the route dot by dot (stepped, ~180 ms), then the label.
    const start = nowMs();
    return {
        tick(now) {
            const shown = Math.min(dots.length, Math.floor((now - start) / (180 / Math.max(1, dots.length))));
            for (let i = 0; i < dots.length; i++) ui.setVisible(dots[i]!, i < shown);
            ui.setVisible(routeChip, shown >= dots.length);
        },
    };
}

function nowMs(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

/** A small label plate on the map (dark backing keeps it readable over terrain). */
function chip(ui: Ui, parent: Entity, x: number, y: number, w: number, text: string, color: typeof T.textPrimary): Entity {
    const bg = ui.box(parent, x, y, w, 24, { ...T.ink900, a: 0.88 });
    ui.text(bg, 6, 0, w - 12, 24, text, { size: TYPE.meta, color, font: 'bold', align: 'center' });
    return bg;
}

function missionCard(ui: Ui, root: Entity, x: number, y: number, w: number, h: number,
    o: MissionOffer, selected: boolean, focus: () => void): void {
    const frame = ui.hotspot(root, x, y, w, h, selected ? T.amber400 : T.edge500, { click: focus }, `MissionCard_${o.mission.id}`);
    const bw = selected ? 3 : 2;
    const p = ui.box(frame, bw, bw, w - bw * 2, h - bw * 2, selected ? T.ink700 : T.ink800);
    const iw = w - bw * 2;

    // Title, then where it is; difficulty as pips plus the word (never colour alone).
    ui.text(p, 12, 10, iw - 24, 28, o.mission.title, { font: 'display', size: TYPE.name });
    ui.text(p, 12, 38, iw - 24, 20, `${o.site.name} · ${o.mission.planet === 'moon' ? 'Moon' : 'Mars'}`, { size: TYPE.meta, color: T.textSecondary });
    for (let d = 0; d < 3; d++) {
        const on = d < o.mission.difficulty;
        const pip = ui.box(p, 12 + d * 14, 69, 10, 10, on ? T.amber400 : T.edge500);
        if (!on) ui.box(pip, 2, 2, 6, 6, selected ? T.ink700 : T.ink800);
    }
    ui.text(p, 58, 62, 120, 22, ['Easy', 'Medium', 'Hard'][o.mission.difficulty - 1]!, { size: TYPE.meta, font: 'bold', color: T.textPrimary });

    // Forecast / hazard line.
    const hz = o.forecast;
    if (hz) {
        ui.image(p, 12, 96, 16, 16, iconPath(`hz_${hz}_16`));
        ui.text(p, 34, 94, iw - 46, 20, `${HAZARD_INFO[hz]!.name} likely`, { size: TYPE.meta, color: T.amber400, font: 'bold' });
    } else {
        ui.text(p, 12, 94, iw - 24, 20, 'Clear forecast', { size: TYPE.meta, color: T.textSecondary });
    }

    // Hardware + deadline.
    const hw = o.mission.hardware[0];
    if (hw) {
        ui.image(p, 12, 122, 32, 32, itemSpritePath(getItem(hw.itemId).sprite));
        ui.text(p, 52, 122, iw - 64, 32, getItem(hw.itemId).name, { size: TYPE.meta });
    }
    ui.text(p, 12, h - bw * 2 - 30, iw - 24, 22, `Due by Sol ${o.deadlineSol}`, { size: TYPE.meta, font: 'bold', color: T.textPrimary });
}

function inspector(ui: Ui, root: Entity, o: MissionOffer, act: MissionActions): void {
    const r = LAYOUT.inspector;
    const p = ui.panel(root, r.x, r.y, r.w, r.h, { fill: T.ink800 });
    const w = r.w - 36;
    let y = 16;
    ui.text(p, 16, y, w, 30, o.mission.title, { font: 'display', size: 24 });
    y += 30;
    ui.text(p, 16, y, w, 20, `${o.site.name} · ${o.site.coords}`, { size: TYPE.meta, color: T.textSecondary });
    y += 28;
    ui.text(p, 16, y, w, 80, o.mission.briefing, { wrap: true, size: 14 });
    y += 84;

    // Label column + a value that wraps inside the panel (never one long fixed line).
    const crewHint = o.mission.recommendedRoles.map((x) => ROLE_NAME[x] ?? x).join(', ');
    const rows: [string, string, string][] = [
        ['ui_icon_mission_16', 'Goal', o.mission.objective],
        ['ui_icon_launch_16', 'Due', `Sol ${o.deadlineSol} · ${o.travelSolsOneWay} sols driving`],
        ['ui_icon_crew_16', 'Crew', `2 to 4, best: ${crewHint}`],
    ];
    const valueX = 92;
    const valueW = w + 8 - valueX;
    for (const [icon, label, value] of rows) {
        ui.image(p, 16, y + 2, 16, 16, iconPath(icon));
        ui.text(p, 38, y, 52, 20, label, { size: TYPE.meta, color: T.textSecondary, font: 'bold' });
        ui.text(p, valueX, y + 1, valueW, 36, value, { size: TYPE.meta, wrap: true, valign: 'top' });
        y += 38;
    }
    y += 4;

    // Real NASA mission box: heading sized to its own length, the box fills the
    // space down to the button, the source sits at its bottom.
    const heading = `Real NASA: ${o.mission.realBasis.mission}`;
    const headLines = Math.max(1, Math.ceil(heading.length / 26));
    const headH = headLines * 20;
    const boxH = r.h - 82 - y;
    const box = ui.panel(p, 12, y, w + 8, boxH, { fill: T.ink900, border: T.edge500, bg: T.ink800 });
    ui.text(box, 12, 8, w - 16, headH, heading, { font: 'display', size: 15, color: T.amber300, wrap: true, valign: 'top' });
    ui.text(box, 12, 12 + headH, w - 16, boxH - headH - 52, o.mission.realBasis.fact, { wrap: true, size: TYPE.meta, color: T.textPrimary });
    ui.text(box, 12, boxH - 34, w - 16, 30, `Source: ${o.mission.realBasis.sources[0]?.label ?? ''}`, {
        wrap: true, size: 11, color: T.textSecondary,
    });

    ui.button(p, 12, r.h - 70, w + 8, 54, 'Choose Crew', () => act.choose(), {
        variant: 'primary', icon: iconPath('ui_icon_crew_16'), size: 20, name: 'BtnChooseCrew',
    });
}
