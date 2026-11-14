// Pack the Rocket: a pixel-grid cargo bay (design.md §7.4 "Cargo / equipment").
// Drag from the shelf, or click to pick up and click a slot; click a packed item to
// take it out. Held items centre on the pointer and stay inside the bay. Amber preview = fits,
// red preview + message = doesn't. The inspector shows how long each supply lasts
// with this crew and what still blocks launch.
import type { Color, Entity } from 'esengine';
import { getItem, ITEMS } from '../data/items';
import { MARS_BASE, MOON_BASE } from '../data/missions';
import type { ItemCategory, ItemDef } from '../data/types';
import { checklist, launchMinSols, supplyForecasts, type Level } from '../logic/checklist';
import { crewOnBoard, heldAnchor, launchStatus, type PrepState } from '../logic/flow';
import { shapeCells } from '../logic/rocketGrid';
import { MAPS, iconPath, itemSpritePath } from '../ui/assets';
import type { Ui } from '../ui/kit';
import { LAYOUT, T, TYPE } from '../ui/tokens';
import type { ScreenHandle } from './missionSelect';
import { buildShell, type ShellActions } from './shell';

export interface PackActions extends ShellActions {
    shelfPress(itemId: string): void;
    cellPress(x: number, y: number): void;
    hover(x: number, y: number): void;
    /** The pointer left cell (x, y). */
    hoverOut(x: number, y: number): void;
    tab(tab: ItemCategory): void;
    rotate(): void;
    empty(): void;
    launch(): void;
}

const CELL = 66;
const TABS: { id: ItemCategory; label: string }[] = [
    { id: 'mission', label: 'Mission' },
    { id: 'supplies', label: 'Supplies' },
    { id: 'power', label: 'Power' },
    { id: 'tools', label: 'Tools' },
];
const RES_NAME: Record<string, string> = { food: 'Food', water: 'Water', oxygen: '% O₂', energy: 'Power', res: 'Materials' };
const CARGO_NAME: Record<string, string> = {
    repairKits: 'repair kit', medkits: 'medkit', batteryPacks: 'battery', seedPods: 'seed pod',
    extraRations: 'ration pack', windSampler: 'mission hardware',
};

function catTint(c: ItemCategory): Color {
    return c === 'mission' ? T.catMission : c === 'supplies' ? T.catSupplies : c === 'power' ? T.catPower : T.catTools;
}

export function effectText(def: ItemDef): string {
    const parts: string[] = [];
    for (const [k, v] of Object.entries(def.resources ?? {})) parts.push(k === 'oxygen' ? `+${v}${RES_NAME[k]}` : `+${v} ${RES_NAME[k]}`);
    for (const [k, v] of Object.entries(def.cargo ?? {})) parts.push(k === 'windSampler' ? 'Mission goal' : `+${v} ${CARGO_NAME[k]}`);
    return parts.join(', ');
}

export function buildPackRocket(ui: Ui, root: Entity, s: PrepState, act: PackActions): ScreenHandle {
    const offer = s.chosen!;
    buildShell(ui, root, s, {
        title: 'Pack the Rocket',
        subtitle: 'Drag items into the bay, or click an item and then a slot.',
        icon: 'ui_icon_pack_16',
    }, act);
    const m = LAYOUT.main;

    // ---- Cargo bay -------------------------------------------------------
    const bay = ui.panel(root, m.x, m.y, m.w, 356, { fill: T.ink800 });
    const grid = s.grid;
    const used = grid.usedCells();
    const total = grid.cols * grid.rows;
    ui.panelHeader(bay, 0, 0, m.w - 4, 'Rocket cargo bay', { text: `${used} / ${total} slots`, color: used === total ? T.amber400 : T.textSecondary });

    const held = s.held ? getItem(s.held.itemId) : null;
    const status = held
        ? `${held.name} in hand: put it in a slot. R rotates, Esc cancels.`
        : s.message || offer.mission.lesson;
    ui.text(bay, 16, 34, m.w - 36, 34, status, {
        size: TYPE.meta, font: 'bold', wrap: true,
        color: s.messageLevel === 'warn' && !held ? T.red400 : held ? T.amber300 : T.textSecondary,
    });

    const gx = 20;
    const gy = 76;
    const gridFrame = ui.box(bay, gx - 4, gy - 4, grid.cols * CELL + 6, grid.rows * CELL + 6, T.ink900, false);
    const overlays: Entity[][] = [];
    for (let y = 0; y < grid.rows; y++) {
        overlays.push([]);
        for (let x = 0; x < grid.cols; x++) {
            const uid = grid.at(x, y);
            const item = uid ? grid.items.find((i) => i.uid === uid)! : null;
            const fill = item ? catTint(getItem(item.itemId).category) : T.ink600;
            const cell = ui.hotspot(gridFrame, 4 + x * CELL, 4 + y * CELL, CELL - 4, CELL - 4, fill, {
                press: () => act.cellPress(x, y),
                hoverEnter: () => act.hover(x, y),
                hoverExit: () => act.hoverOut(x, y),
            }, `Cell_${x}_${y}`);
            if (!item) {
                // Beveled empty slot: lit top/left, shadowed bottom/right.
                ui.box(cell, 0, 0, CELL - 4, 2, T.edge500);
                ui.box(cell, 0, 0, 2, CELL - 4, T.edge500);
                ui.box(cell, 0, CELL - 6, CELL - 4, 2, T.ink800);
                ui.box(cell, CELL - 6, 0, 2, CELL - 4, T.ink800);
            }
            overlays[y]!.push(ui.box(cell, 0, 0, CELL - 4, CELL - 4, T.clear));
        }
    }
    // Each packed item reads as ONE object: its footprint cells are joined (gaps
    // filled, including the centre of 2×2 blocks) and its sprite sits at the centroid.
    for (const it of grid.items) {
        const def = getItem(it.itemId);
        const tint = catTint(def.category);
        const cells = grid.footprint(it.itemId, it.x, it.y, it.rotation);
        const has = (cx: number, cy: number) => cells.some((c) => c.x === cx && c.y === cy);
        for (const c of cells) {
            const px0 = 4 + c.x * CELL;
            const py0 = 4 + c.y * CELL;
            if (has(c.x + 1, c.y)) ui.box(gridFrame, px0 + CELL - 4, py0, 4, CELL - 4, tint);
            if (has(c.x, c.y + 1)) ui.box(gridFrame, px0, py0 + CELL - 4, CELL - 4, 4, tint);
            if (has(c.x + 1, c.y) && has(c.x, c.y + 1) && has(c.x + 1, c.y + 1)) ui.box(gridFrame, px0 + CELL - 4, py0 + CELL - 4, 4, 4, tint);
        }
        const size = cells.length >= 3 ? 64 : 48;
        const ccx = cells.reduce((a, c) => a + c.x, 0) / cells.length;
        const ccy = cells.reduce((a, c) => a + c.y, 0) / cells.length;
        ui.image(gridFrame, Math.round(4 + ccx * CELL + (CELL - 4 - size) / 2), Math.round(4 + ccy * CELL + (CELL - 4 - size) / 2), size, size, itemSpritePath(def.sprite));
    }

    // Bay controls.
    const cx = gx + grid.cols * CELL + 24;
    const cw = m.w - 4 - cx - 20;
    ui.button(bay, cx, gy, cw, 48, 'Rotate', () => act.rotate(), {
        variant: 'secondary', icon: iconPath('ui_icon_rotate_16'), disabled: !s.held, size: 18, name: 'BtnRotate',
    });
    ui.text(bay, cx, gy + 52, cw, 20, 'R key or right-click', { size: TYPE.label, color: T.textSecondary, align: 'center' });
    ui.button(bay, cx, gy + 84, cw, 48, 'Empty Rocket', () => act.empty(), {
        variant: 'secondary', disabled: grid.items.length === 0, size: 18,
    });
    const segW = Math.floor(cw / 14);
    for (let i = 0; i < 14; i++) {
        const on = i < Math.round((used / total) * 14);
        ui.box(bay, cx + i * segW, gy + 150, segW - 2, 14, on ? T.cyan400 : T.ink600);
    }
    ui.text(bay, cx, gy + 172, cw, 48, used === total
        ? 'Rocket full. Click an item to take it out.'
        : grid.items.length > 0 ? 'Click a packed item to take it out.' : 'More crew means more crates to pack.',
    { size: TYPE.label, color: T.textSecondary, wrap: true });
    if (s.keyboard) {
        ui.text(bay, cx, gy + 220, cw, 50, held ? 'Arrows move · Enter packs' : 'Arrows pick · Enter takes · Q/E tabs · X unpacks',
            { size: TYPE.label, color: T.amber300, wrap: true });
    }

    // ---- Shelf -----------------------------------------------------------
    const shelfY = m.y + 368;
    const shelf = ui.panel(root, m.x, shelfY, m.w, m.h - 368, { fill: T.ink800 });
    TABS.forEach((t, i) => {
        ui.button(shelf, 12 + i * 158, 10, 150, 40, t.label, () => act.tab(t.id), {
            variant: s.shelfTab === t.id ? 'tabActive' : 'tab', size: 17, name: `Tab_${t.id}`,
        });
    });
    const items = ITEMS.filter((i) => i.category === s.shelfTab);
    const tileW = Math.floor((m.w - 4 - 24 - 4 * 8) / 5);
    items.forEach((def, i) => {
        const inHand = s.held?.itemId === def.id;
        const needed = offer.mission.hardware.some((h) => h.itemId === def.id);
        const x = 12 + i * (tileW + 8);
        const frame = ui.hotspot(shelf, x, 60, tileW, 152, inHand || needed ? T.amber400 : T.edge500, {
            press: () => act.shelfPress(def.id),
        }, `Shelf_${def.id}`);
        if (inHand || (s.keyboard && i === s.kbShelf && !s.held)) ui.brackets(shelf, x, 60, tileW, 152);
        const bw = inHand ? 3 : 2;
        const p = ui.box(frame, bw, bw, tileW - bw * 2, 152 - bw * 2, inHand ? T.ink700 : T.ink900);
        const iw = tileW - bw * 2;
        if (needed) {
            const tag = ui.box(p, 0, 0, iw, 18, T.amber400);
            ui.text(tag, 0, 0, iw, 18, 'NEEDED', { size: 11, font: 'bold', align: 'center', color: T.ink900 });
        }
        ui.image(p, Math.round((iw - 48) / 2), needed ? 20 : 8, 48, 48, itemSpritePath(def.sprite));
        ui.text(p, 4, 66, iw - 8, 34, def.name, { size: 13, font: 'bold', align: 'center', wrap: true });
        const n = shapeCells(def.shape).length;
        ui.text(p, 4, 98, iw - 8, 18, `${n} slot${n === 1 ? '' : 's'}`, { size: TYPE.label, color: T.textSecondary, align: 'center' });
        ui.text(p, 4, 116, iw - 8, 30, effectText(def), { size: TYPE.label, color: T.green400, align: 'center', wrap: true, font: 'bold' });
    });

    inspector(ui, root, s, act);

    return {
        refreshPreview() {
            for (const row of overlays) for (const ov of row) ui.setColor(ov, T.clear);
            const h = s.hover;
            if (!h) return;
            if (s.held) {
                const a = heldAnchor(s, h.x, h.y);
                const fits = grid.canPlace(s.held.itemId, a.x, a.y, s.held.rotation);
                for (const c of grid.footprint(s.held.itemId, a.x, a.y, s.held.rotation)) {
                    const ov = overlays[c.y]?.[c.x];
                    if (ov) ui.setColor(ov, fits ? T.previewOk : T.previewBad);
                }
            } else if (grid.at(h.x, h.y)) {
                const uid = grid.at(h.x, h.y);
                const it = grid.items.find((i) => i.uid === uid)!;
                for (const c of grid.footprint(it.itemId, it.x, it.y, it.rotation)) {
                    ui.setColor(overlays[c.y]![c.x]!, { ...T.amber400, a: 0.25 });
                }
            } else if (s.keyboard) {
                ui.setColor(overlays[h.y]![h.x]!, { ...T.amber400, a: 0.18 });
            }
        },
    };
}

const LEVEL_ICON: Record<Level, string> = { ok: 'ui_icon_check_16', warn: 'ui_icon_warn_16', bad: 'ui_icon_cross_16' };
const LEVEL_COLOR: Record<Level, Color> = { ok: T.green400, warn: T.amber400, bad: T.red400 };

function inspector(ui: Ui, root: Entity, s: PrepState, act: PackActions): void {
    const r = LAYOUT.inspector;
    const p = ui.panel(root, r.x, r.y, r.w, r.h, { fill: T.ink800 });
    const offer = s.chosen!;
    const crew = crewOnBoard(s);
    const w = r.w - 36;

    // Mini route map (the Mission Select signature, at 1× scale).
    const moon = offer.mission.planet === 'moon';
    const mapW = w + 8;
    const mapH = 112;
    const base = moon ? MOON_BASE.map : MARS_BASE.map;
    const site = offer.site.map;
    const midX = ((base.x + site.x) / 2) * 320;
    const midY = ((base.y + site.y) / 2) * 180;
    const ox = Math.max(0, Math.min(320 - mapW, Math.round(midX - mapW / 2)));
    const oy = Math.max(0, Math.min(180 - mapH, Math.round(midY - mapH / 2)));
    const frame = ui.box(p, 12, 12, mapW, mapH, T.ink900);
    ui.image(frame, 0, 0, mapW, mapH, moon ? MAPS.moon : MAPS.mars, {
        uvOffset: { x: ox / 320, y: oy / 180 }, uvScale: { x: mapW / 320, y: mapH / 180 },
    });
    const bx = base.x * 320 - ox;
    const by = base.y * 180 - oy;
    const sx = site.x * 320 - ox;
    const sy = site.y * 180 - oy;
    const steps = Math.max(2, Math.floor(Math.hypot(sx - bx, sy - by) / 8));
    for (let i = 1; i < steps; i++) {
        const x = Math.round(bx + ((sx - bx) * i) / steps);
        const y = Math.round(by + ((sy - by) * i) / steps);
        if (x > 1 && y > 1 && x < mapW - 5 && y < mapH - 5) ui.box(frame, x - 2, y - 2, 4, 4, i % 2 ? T.amber400 : T.cyan400);
    }
    const clampIn = (v: number, max: number) => Math.max(0, Math.min(max - 16, Math.round(v - 8)));
    ui.image(frame, clampIn(bx, mapW), clampIn(by, mapH), 16, 16, iconPath('ui_icon_base_16'));
    ui.image(frame, clampIn(sx, mapW), clampIn(sy - 6, mapH), 16, 16, iconPath('ui_icon_mission_16'));
    ui.text(p, 14, 128, mapW - 4, 20, `Due Sol ${offer.deadlineSol} · ${offer.travelSolsOneWay} sols each way`, {
        size: TYPE.label, color: T.textSecondary, font: 'bold',
    });

    // Supplies on arrival: how long each lasts with this crew (same threshold as the checklist).
    const minSols = launchMinSols(offer);
    let y = 154;
    ui.panelHeader(p, 0, y, r.w - 4, `Supplies for ${crew.length} crew`);
    y += 34;
    ui.text(p, 16, y, w, 18, `Launch needs ${minSols}+ sols. Grow the rest.`, { size: 11, color: T.textSecondary });
    y += 20;
    for (const f of supplyForecasts(offer, s.grid, crew.length)) {
        const icon = f.key === 'oxygen' ? 'ui_icon_o2_16' : f.key === 'energy' ? 'ui_icon_power_16' : `ui_icon_${f.key}_16`;
        ui.image(p, 16, y + 4, 16, 16, iconPath(icon));
        ui.text(p, 38, y, 58, 24, f.label, { size: TYPE.meta, font: 'bold' });
        const segs = 10;
        const filled = Math.min(segs, Math.round((f.lastsSols / Math.max(1, f.missionSols)) * segs));
        const tick = Math.round((f.minSols / Math.max(1, f.missionSols)) * segs);
        for (let i = 0; i < segs; i++) ui.box(p, 96 + i * 9, y + 7, 7, 10, i < filled ? LEVEL_COLOR[f.level] : T.ink600);
        ui.box(p, 96 + tick * 9 - 2, y + 4, 1, 16, T.textPrimary);
        const days = f.full ? 'whole trip' : `${f.estimate ? '~' : ''}${f.lastsSols} sols`;
        ui.text(p, 190, y, w - 200, 24, days, { size: TYPE.meta, color: LEVEL_COLOR[f.level], font: 'bold', align: 'right' });
        ui.image(p, r.w - 40, y + 4, 16, 16, iconPath(LEVEL_ICON[f.level]));
        y += 25;
    }

    // Launch checklist (supplies are shown by the meters above, with the same threshold).
    y += 6;
    ui.panelHeader(p, 0, y, r.w - 4, 'Before launch');
    y += 34;
    for (const row of checklist(offer, s.grid, crew)) {
        if (row.id.startsWith('supply_')) continue;
        ui.image(p, 16, y + 4, 16, 16, iconPath(row.met ? 'ui_icon_check_16' : 'ui_icon_cross_16'));
        ui.text(p, 38, y, w - 96, 24, row.label, { size: TYPE.meta, color: row.met ? T.textPrimary : T.textSecondary });
        const count = row.id === 'crew' ? `${row.have} crew` : `${row.have}/${row.need}`;
        ui.text(p, r.w - 100, y, 76, 24, count, {
            size: TYPE.meta, font: 'bold', align: 'right', color: row.met ? T.green400 : T.red400,
        });
        y += 24;
    }

    const st = launchStatus(s);
    const where = offer.mission.planet === 'moon' ? 'the Moon' : 'Mars';
    ui.button(p, 12, r.h - 70, w + 8, 54, st.ok ? `Launch to ${where}` : (st.blocker ?? 'Not ready'), () => act.launch(), {
        variant: 'primary', disabled: !st.ok, icon: iconPath('ui_icon_launch_16'), size: st.ok ? 20 : 17, name: 'BtnLaunch',
    });
}
