// Cargo Preparation with Mission Prep's packing interaction, drawn in the flight UI
// style (frames, buttons, palette and piece rendering match cargoScreen.ts).
//
// - Drag an item from the inventory onto the bay, or click it and then click a cell.
// - The held item is centred on the cell under the pointer and kept inside the bay.
// - Click a packed item to take it out; drag a packed item to move it.
// - R or right-click rotates; Esc puts the held item back.
// - The red preview always comes with words ("Slot taken", "No more in stock").
// - Supply meters show how many sols food, water and O₂ last with the packed cargo.
//
// It uses the same data as cargoScreen.ts (CARGO_ITEMS, CargoPlacement, stock limits),
// so the launch, the manifest and the survival loop are unchanged.
import { Interactable, type Color, type Entity, type InputState } from 'esengine';
import { makeAbsBox } from './theme';
import type { CargoItemId, MissionSetupInput, ResourcePool } from '../contracts/gameContract';
import {
    CARGO_BY_ID, CARGO_COLUMNS, CARGO_ITEMS, CARGO_ROWS, occupiedCells, packedInventory, placementProblem, rotatedCells,
    type CargoPlacement, type Rotation,
} from '../data/cargo';
import { INSTRUMENTS } from '../data/expeditions';
import { FOOD_PER_CREW_PER_SOL, OXYGEN_PER_SOL, WATER_PER_CREW_PER_SOL } from '../data/supplyRates';
import { type FlightUi } from './flightUi';
import { play } from './feedback';
import { burst } from './fx';
import { easeOutBack, makeMotion } from './motion';

const CARGO_COLORS: Record<CargoItemId, number> = {
    windSampler: 0xd39e55, repairKits: 0xcc745e, batteryPacks: 0xe1bd65, medkits: 0xcf7c8c,
    seedPods: 0x8db079, extraRations: 0xba9a6e, waterCanisters: 0x75a7c7, oxygenTanks: 0x69bbb5,
    radDetector: 0xc9b25a, iceDrill: 0x8fb6d6,
};
const DRAG_THRESHOLD_PX = 6;

/** Inventory tabs, like Mission Prep's shelf: mission gear, supplies, power, tools. */
const INVENTORY_TABS = ['Mission', 'Supplies', 'Power', 'Tools'] as const;
type InventoryTab = typeof INVENTORY_TABS[number];
const TAB_OF: Partial<Record<CargoItemId, InventoryTab>> = {
    windSampler: 'Mission', radDetector: 'Mission', iceDrill: 'Mission',
    seedPods: 'Supplies', extraRations: 'Supplies', waterCanisters: 'Supplies', oxygenTanks: 'Supplies',
    batteryPacks: 'Power',
    repairKits: 'Tools', medkits: 'Tools',
};
const PIECE = 76;
const STEP = 84;
/** Inventory row: the shape preview's box and its mini cells (three cells fit across or down). */
const SHAPE_BOX = 52;
const SHAPE_CELL = 16;
const SHAPE_GAP = 2;
const SHAPE_STEP = SHAPE_CELL + SHAPE_GAP;
const SHAPE_X = 262;
const TAG_X = 192;

function cargoColor(item: CargoItemId, strength: number): Color {
    const shade = CARGO_COLORS[item];
    return { r: ((shade >> 16) & 255) / 255 * strength, g: ((shade >> 8) & 255) / 255 * strength, b: (shade & 255) / 255 * strength, a: 1 };
}

interface Held {
    item: CargoItemId;
    rotation: Rotation;
    /** A packed piece being moved; restored on cancel. */
    from?: CargoPlacement;
}

/** Top-left cell for a held piece centred on (hx, hy), pushed back inside the bay. */
export function centredAnchor(item: CargoItemId, rotation: Rotation, hx: number, hy: number): { x: number; y: number } {
    const cells = rotatedCells(item, rotation);
    const w = Math.max(...cells.map(([x]) => x)) + 1;
    const h = Math.max(...cells.map(([, y]) => y)) + 1;
    const clamp = (v: number, hi: number) => Math.max(0, Math.min(hi, v));
    return { x: clamp(hx - Math.floor((w - 1) / 2), CARGO_COLUMNS - w), y: clamp(hy - Math.floor((h - 1) / 2), CARGO_ROWS - h) };
}

export interface SupplyLasts {
    key: 'food' | 'water' | 'oxygen';
    label: string;
    /** Whole sols the supply lasts: starting stock + packed items, at the main loop's daily use. */
    lasts: number;
    deadline: number;
    ok: boolean;
}

/** Shared by the packer and the launch summary so both always show the same numbers. */
export function supplyLasts(setup: MissionSetupInput, placements: readonly CargoPlacement[]): SupplyLasts[] {
    const crew = setup.crew.length || 4;
    const deadline = setup.missionGoal.deadlineSol;
    return (['food', 'water', 'oxygen'] as const).map((key) => {
        let amount = setup.startingResources[key];
        for (const piece of placements) amount += CARGO_BY_ID[piece.item].resources?.[key] ?? 0;
        const perSol = key === 'food' ? crew * FOOD_PER_CREW_PER_SOL : key === 'water' ? crew * WATER_PER_CREW_PER_SOL : OXYGEN_PER_SOL;
        const lasts = Math.floor(amount / perSol);
        return { key, label: key === 'oxygen' ? 'O₂' : key[0]!.toUpperCase() + key.slice(1), lasts, deadline, ok: lasts >= deadline };
    });
}

/** Plain-language reason for the red preview (placementProblem's words, shortened for kids). */
function shortProblem(problem: string): string {
    if (problem.startsWith('Another item')) return 'Slot taken: try another spot or rotate (R).';
    if (problem.startsWith('No more')) return 'No more of this item in stock.';
    if (problem.includes('outside')) return 'It does not fit there. Rotate it (R).';
    return problem;
}

export function showCargoPacker(
    ui: FlightUi, setup: MissionSetupInput, draft: CargoPlacement[], onChange: (placements: CargoPlacement[]) => void,
    launchProblem: (placements: CargoPlacement[]) => string | null, onLaunch: () => void,
): (input: InputState) => boolean {
    const { root, palette: p } = ui;
    const motion = makeMotion(ui.world, ui.reducedMotion);
    const bay = ui.frame(root, [248, 108, 576, 596]);
    const inventory = ui.frame(root, [840, 108, 424, 596]);
    ui.label(bay, [20, 12, 332, 40], 'Cargo Bay', { display: true, size: 28 });
    const usage = ui.label(bay, [340, 12, 196, 40], '', { size: 15, color: p.amber, center: true });
    // One line of guidance above the grid: what to do next, what is in hand, or why a spot is red.
    const status = ui.label(bay, [20, 54, 528, 32], '', { size: 15, wrap: true });
    const grid = ui.frame(bay, [20, 92, 528, 348], p.ink);

    let placements = draft;
    let nextId = Math.max(0, ...draft.map(item => item.id)) + 1;
    let held: Held | null = null;
    let hover: { x: number; y: number } | null = null;
    /** Where the pointer was when the press that picked something up happened. */
    let drag: { x: number; y: number } | null = null;
    /** Pointer position from the previous frame: the press point (input arrives before UI events). */
    let lastMouse = { x: 0, y: 0 };
    let feedback = '';
    let error = false;

    const cells = Array.from({ length: CARGO_COLUMNS * CARGO_ROWS }, (_, index) => {
        const x = index % CARGO_COLUMNS;
        const y = Math.floor(index / CARGO_COLUMNS);
        // onClick only acts for keyboard (Enter); pointer input goes through 'press' below.
        const button = ui.button(grid, [12 + x * STEP, 8 + y * STEP, PIECE, PIECE], () => {
            if (ui.hasKeyboardFocus(button.entity)) pressCell(x, y, true);
        }, { tone: 'tile', still: true });
        return { button, x, y };
    });
    const rotate = ui.button(bay, [20, 460, 164, 44], rotateHeld, { label: 'Rotate (R)' });
    const empty = ui.button(bay, [196, 460, 164, 44], emptyBay, { label: 'Empty Bay' });
    const cancel = ui.button(bay, [372, 460, 176, 44], cancelHeld, { label: 'Put Back (Esc)' });
    ui.label(bay, [20, 516, 528, 28], 'Click a packed item to take it out. Drag it to move it.', { size: 14, color: p.muted });

    // ---- Inventory: tabbed by kind, so items are quick to find ----
    ui.label(inventory, [16, 12, 384, 36], 'Inventory', { display: true, size: 28 });
    const required = setup.missionGoal.requiredEquipment ?? {};
    const tabOf = (id: CargoItemId): InventoryTab => TAB_OF[id] ?? 'Supplies';
    let tab: InventoryTab = INVENTORY_TABS.find(t => CARGO_ITEMS.some(item => tabOf(item.id) === t && (required[item.id] ?? 0) > 0)) ?? 'Mission';
    const tabs = INVENTORY_TABS.map((name, index) => {
        const button = ui.button(inventory, [16 + index * 97, 50, 92, 36], () => { tab = name; refresh(); }, { label: name });
        // Amber marker: this tab still holds required equipment that is not packed yet.
        const marker = ui.box(button.entity, [84, 2, 6, 6], p.amber);
        return { name, button, marker };
    });
    const ROW = 70;
    // Each mission's own instrument shows; the other missions' instruments stay out of the list.
    const offered = CARGO_ITEMS.filter(item => !INSTRUMENTS.includes(item.id) || (required[item.id] ?? 0) > 0);
    const items = offered.map((item) => {
        const slot = offered.filter(other => tabOf(other.id) === tabOf(item.id)).indexOf(item);
        const button = ui.button(inventory, [16, 94 + slot * ROW, 384, ROW - 6], () => {
            if (ui.hasKeyboardFocus(button.entity)) pick(item.id, true);
        }, { quiet: true });
        ui.icon(button.entity, 10, 12, 32, item.id, p.amber);
        ui.label(button.entity, [54, 4, 136, 26], item.name, { display: true, size: 18, fit: 13 });
        ui.label(button.entity, [54, 28, 204, 34], item.effect, { size: 13, fit: 11, color: p.secondary, wrap: true, top: true });
        const need = required[item.id] ?? 0;
        // NEEDED turns into PACKED once enough of the item is in the bay.
        const tag = need > 0 ? ui.box(button.entity, [TAG_X, 8, 64, 20], p.amber) : null;
        const tagText = tag ? ui.label(tag, [0, 0, 64, 20], 'NEEDED', { size: 11, color: p.ink, center: true }) : null;
        // The item's footprint, so its shape is known before it is picked up. While it is in
        // hand it turns with the held rotation.
        const shape = ui.box(button.entity, [SHAPE_X, 6, SHAPE_BOX, SHAPE_BOX]);
        const stock = ui.label(button.entity, [320, 0, 60, ROW - 6], '', { size: 13, color: p.amber, center: true });
        ui.on(button.entity, 'press', () => pick(item.id, false));
        return { item, button, stock, need, tag, tagText, shape, shapeLayer: null as Entity | null, shapeRotation: -1 };
    });

    /** Draws an item's cells, centred in its inventory row's shape box. */
    function drawShape(row: typeof items[number], rotation: Rotation): void {
        if (row.shapeRotation === rotation) return;
        if (row.shapeLayer !== null) ui.world.despawn(row.shapeLayer);
        row.shapeRotation = rotation;
        const layer = ui.box(row.shape, [0, 0, SHAPE_BOX, SHAPE_BOX]);
        row.shapeLayer = layer;
        const footprint = rotatedCells(row.item.id, rotation);
        const w = Math.max(...footprint.map(([x]) => x)) + 1;
        const h = Math.max(...footprint.map(([, y]) => y)) + 1;
        const ox = Math.round((SHAPE_BOX - (w * SHAPE_STEP - SHAPE_GAP)) / 2);
        const oy = Math.round((SHAPE_BOX - (h * SHAPE_STEP - SHAPE_GAP)) / 2);
        const fill = cargoColor(row.item.id, 0.6);
        const edge = cargoColor(row.item.id, 0.95);
        for (const [x, y] of footprint) {
            ui.box(layer, [ox + x * SHAPE_STEP, oy + y * SHAPE_STEP, SHAPE_CELL, SHAPE_CELL], edge);
            ui.box(layer, [ox + x * SHAPE_STEP + 2, oy + y * SHAPE_STEP + 2, SHAPE_CELL - 4, SHAPE_CELL - 4], fill);
        }
    }

    // ---- Supply meters: how long each supply lasts with what is packed ----
    const meterTop = 388;
    ui.label(inventory, [16, meterTop, 384, 22], `Will supplies last ${setup.missionGoal.deadlineSol} sols for ${setup.crew.length || 4} crew?`, {
        size: 13, color: p.secondary,
    });
    const meterKeys: (keyof ResourcePool)[] = ['food', 'water', 'oxygen'];
    const meters = meterKeys.map((key, index) => {
        const y = meterTop + 24 + index * 24;
        ui.icon(inventory, 16, y + 1, 20, key as 'food' | 'water' | 'oxygen', p.amber);
        ui.label(inventory, [44, y, 70, 22], key === 'oxygen' ? 'O₂' : key[0]!.toUpperCase() + key.slice(1), { size: 14 });
        const segs = Array.from({ length: 12 }, (_, i) => ui.box(inventory, [116 + i * 13, y + 6, 11, 10], p.well));
        const days = ui.label(inventory, [276, y, 124, 22], '', { size: 13, center: true });
        // `shown` steps towards `target` one segment at a time, so the meter visibly fills or drains.
        return { key, segs, days, shown: 0, target: 0, tone: p.good };
    });

    // The checklist: which NEEDED items are still missing, or that everything is ready.
    const validation = ui.label(inventory, [16, 484, 384, 36], '', { size: 14, wrap: true });
    const launch = ui.button(inventory, [16, 528, 384, 48], () => { if (!held) onLaunch(); }, { label: 'Review & Launch', tone: 'primary' });

    const piecesLayer = ui.box(grid, [0, 0, 520, 340]);
    let pieces = ui.box(piecesLayer, [0, 0, 520, 340]);
    /** The placements the pieces layer was last drawn from; it is only rebuilt when they change. */
    let drawn: CargoPlacement[] | null = null;
    /** The piece that was just packed or moved: it drops into its cells with a small bounce. */
    let dropId: number | null = null;
    /** Set while the dropped piece is drawn, so its landing gets a sound and a dust puff. */
    let landed = false;
    /** How many NEEDED items were missing last time, so finishing the list can be celebrated once. */
    let stillMissing = -1;
    /** Which NEEDED tags were already PACKED, so only a fresh change hops. */
    const wasPacked = new Map<CargoItemId, boolean>();
    const guides = ui.box(grid, [0, 0, 520, 340]);
    const markers = cells.map(cell => ({
        ...cell,
        ghost: ui.box(guides, [12 + cell.x * STEP, 8 + cell.y * STEP, PIECE, PIECE], p.transparent),
        focus: ui.box(guides, [12 + cell.x * STEP + PIECE - 12, 8 + cell.y * STEP + 4, 8, 8], p.transparent),
    }));

    // Pieces are drawn across the 8-px gaps between cells, but the gaps themselves are not
    // buttons. These invisible strips cover them. With an item in hand, a press on a gap
    // places it where the outline shows. Otherwise it acts on the packed piece that covers
    // the gap (and does nothing over an empty gap).
    const pieceAt = (x: number, y: number) => placements.find(piece => occupiedCells(piece).some(([px, py]) => px === x && py === y));
    const gapHit = (bounds: readonly [number, number, number, number], a: readonly [number, number], b: readonly [number, number]) => {
        const hit = makeAbsBox(ui.world, grid, ...bounds, undefined, false);
        ui.world.insert(hit, Interactable, { enabled: true, blockRaycast: true, raycastTarget: true });
        ui.on(hit, 'press', () => {
            if (held) { pressCell(hover?.x ?? a[0], hover?.y ?? a[1], false); return; }
            const piece = pieceAt(a[0], a[1]);
            if (piece && piece === pieceAt(b[0], b[1])) pressCell(a[0], a[1], false);
        });
        ui.on(hit, 'hover_enter', () => { hover = { x: a[0], y: a[1] }; preview(); });
        // Leaving a gap for the bay's edge clears the outline, so no outline shows where a click would miss.
        ui.on(hit, 'hover_exit', () => {
            if (hover && hover.x === a[0] && hover.y === a[1]) { hover = null; preview(); }
        });
    };
    for (let y = 0; y < CARGO_ROWS; y++) {
        for (let x = 0; x < CARGO_COLUMNS; x++) {
            if (x + 1 < CARGO_COLUMNS) gapHit([12 + x * STEP + PIECE, 8 + y * STEP, STEP - PIECE, PIECE], [x, y], [x + 1, y]);
            if (y + 1 < CARGO_ROWS) gapHit([12 + x * STEP, 8 + y * STEP + PIECE, PIECE, STEP - PIECE], [x, y], [x, y + 1]);
            if (x + 1 < CARGO_COLUMNS && y + 1 < CARGO_ROWS) {
                gapHit([12 + x * STEP + PIECE, 8 + y * STEP + PIECE, STEP - PIECE, STEP - PIECE], [x, y], [x + 1, y + 1]);
            }
        }
    }

    for (const cell of markers) {
        ui.on(cell.button.entity, 'press', () => pressCell(cell.x, cell.y, false));
        ui.on(cell.button.entity, 'hover_enter', () => { hover = { x: cell.x, y: cell.y }; preview(); });
        ui.on(cell.button.entity, 'hover_exit', () => {
            if (hover && hover.x === cell.x && hover.y === cell.y) { hover = null; preview(); }
        });
        ui.on(cell.button.entity, 'focus', () => {
            if (!ui.hasKeyboardFocus(cell.button.entity)) return;
            ui.fill(cell.focus, p.white);
            hover = { x: cell.x, y: cell.y };
            preview();
        });
        ui.on(cell.button.entity, 'blur', () => ui.fill(cell.focus, p.transparent));
    }

    // ---- Actions ----
    function pick(item: CargoItemId, keyboard: boolean): void {
        cancelHeld();
        const left = CARGO_BY_ID[item].stock - packedInventory(placements)[item];
        if (left <= 0) {
            say(`No more ${CARGO_BY_ID[item].name} in stock.`, true);
            return;
        }
        held = { item, rotation: 0 };
        if (!keyboard) drag = { ...lastMouse };
        say(`${CARGO_BY_ID[item].name} in hand. Drop it in the bay, or click a cell.`, false);
    }

    function pressCell(x: number, y: number, keyboard: boolean): void {
        if (held) { placeAt(x, y); return; }
        const hit = placements.find(piece => occupiedCells(piece).some(([px, py]) => px === x && py === y));
        if (!hit) return;
        // Lift it out; a click (no drag) on release means "take it out of the rocket".
        commit(placements.filter(piece => piece.id !== hit.id));
        held = { item: hit.item, rotation: hit.rotation, from: hit };
        if (keyboard) { held = null; play('blip', 0.8); say(`${CARGO_BY_ID[hit.item].name} returned to inventory.`, false); return; }
        drag = { ...lastMouse };
        say(`Moving ${CARGO_BY_ID[hit.item].name}: drop it in a new spot.`, false);
    }

    function placeAt(hx: number, hy: number): boolean {
        if (!held) return false;
        const { x, y } = centredAnchor(held.item, held.rotation, hx, hy);
        const id = held.from?.id ?? nextId;
        const next: CargoPlacement = { id, item: held.item, x, y, rotation: held.rotation };
        const problem = placementProblem(placements, next);
        if (problem) { say(shortProblem(problem), true); return false; }
        dropId = id;
        commit([...placements, next]);
        if (!held.from) nextId++;
        const name = CARGO_BY_ID[held.item].name;
        const moved = Boolean(held.from);
        // Keep the same item in hand while stock lasts, so packing several is quick.
        const stockLeft = CARGO_BY_ID[held.item].stock - packedInventory(placements)[held.item];
        held = !moved && stockLeft > 0 && drag === null ? { item: held.item, rotation: held.rotation } : null;
        say(`${name} ${moved ? 'moved' : 'packed'}.`, false);
        return true;
    }

    function rotateHeld(): void {
        if (!held) return;
        held.rotation = ((held.rotation + 1) % 4) as Rotation;
        say(`Rotated to ${held.rotation * 90}°.`, false);
    }

    function cancelHeld(): void {
        if (!held) return;
        if (held.from) commit([...placements, held.from]);
        held = null;
        drag = null;
        say('', false);
    }

    function emptyBay(): void {
        held = null;
        commit([]);
        say('Cargo bay emptied.', false);
    }

    function commit(next: CargoPlacement[]): void {
        placements = next;
        onChange(placements);
    }

    function say(text: string, isError: boolean): void {
        if (isError) play('buzz');
        feedback = text;
        error = isError;
        refresh();
    }

    // ---- Drawing ----
    function preview(): void {
        for (const cell of markers) ui.fill(cell.ghost, p.transparent);
        if (!hover) {
            // Off the grid with something in hand: say what to do with it, not the last red reason.
            if (held) {
                ui.setText(status, `${CARGO_BY_ID[held.item].name} in hand. Drop it in the bay, or click a cell.`);
                ui.textColor(status, p.text);
            }
            return;
        }
        if (held) {
            const { x, y } = centredAnchor(held.item, held.rotation, hover.x, hover.y);
            const next = { id: held.from?.id ?? nextId, item: held.item, x, y, rotation: held.rotation };
            const bad = Boolean(placementProblem(placements, next));
            const footprint = occupiedCells(next);
            for (const cell of markers) {
                if (footprint.some(([fx, fy]) => fx === cell.x && fy === cell.y)) ui.fill(cell.ghost, { ...(bad ? p.bad : p.cyan), a: bad ? 0.4 : 0.26 });
            }
            ui.setText(status, bad ? shortProblem(placementProblem(placements, next)!) : `${CARGO_BY_ID[held.item].name} fits here.`);
            ui.textColor(status, bad ? p.bad : p.secondary);
        } else {
            const hit = placements.find(piece => occupiedCells(piece).some(([px, py]) => px === hover!.x && py === hover!.y));
            if (!hit) return;
            for (const [fx, fy] of occupiedCells(hit)) {
                const m = markers.find(cell => cell.x === fx && cell.y === fy);
                if (m) ui.fill(m.ghost, { ...p.hover, a: 0.18 });
            }
        }
    }

    function refresh(): void {
        const rebuild = drawn !== placements;
        if (rebuild) {
            ui.world.despawn(pieces);
            pieces = ui.box(piecesLayer, [0, 0, 520, 340]);
            drawn = placements;
        }
        let occupied = 0;
        for (const piece of placements) {
            const footprint = occupiedCells(piece);
            occupied += footprint.length;
            if (!rebuild) continue;
            // Each piece gets its own layer so it can move on its own.
            const layer = ui.box(pieces, [0, 0, 520, 340]);
            if (piece.id === dropId) {
                motion.enter(layer, 0, 0, { dy: -14, duration: 280, ease: easeOutBack });
                dropId = null;
                landed = true;
            }
            const base = cargoColor(piece.item, 0.44);
            const outline = cargoColor(piece.item, 0.91);
            const detail = cargoColor(piece.item, 0.55);
            const contains = (x: number, y: number) => footprint.some(([cx, cy]) => cx === x && cy === y);
            for (const [x, y] of footprint) {
                const left = 12 + x * STEP;
                const top = 8 + y * STEP;
                const right = contains(x + 1, y);
                const down = contains(x, y + 1);
                ui.box(layer, [left, top, PIECE + (right ? 8 : 0), PIECE + (down ? 8 : 0)], base);
                if (right && down && contains(x + 1, y + 1)) ui.box(layer, [left + PIECE, top + PIECE, 8, 8], base);
                if (!contains(x - 1, y)) ui.box(layer, [left, top, 4, PIECE + (down ? 8 : 0)], outline);
                if (!contains(x, y - 1)) ui.box(layer, [left, top, PIECE + (right ? 8 : 0), 4], outline);
                if (!right) ui.box(layer, [left + PIECE - 4, top, 4, PIECE + (down ? 8 : 0)], outline);
                if (!down) ui.box(layer, [left, top + PIECE - 4, PIECE + (right ? 8 : 0), 4], outline);
                if (right && down && !contains(x + 1, y + 1)) {
                    ui.box(layer, [left + PIECE, top + PIECE - 4, 8, 4], outline);
                    ui.box(layer, [left + PIECE - 4, top + PIECE, 4, 8], outline);
                }
                ui.box(layer, [left + 12, top + 12, 4, 4], detail);
                ui.box(layer, [left + 60, top + 60, 4, 4], detail);
            }
            const cx = footprint.reduce((a, [x]) => a + x, 0) / footprint.length;
            const px = Math.round(12 + cx * STEP + PIECE / 2);
            const [labelX, labelY] = [...footprint].sort(([ax, ay], [bx, by]) => ay - by || ax - bx)[0]!;
            let labelWidth = PIECE;
            while (contains(labelX + Math.round(labelWidth / STEP), labelY)) labelWidth += STEP;
            // The item's icon sits above its short name, so packed pieces read the same as the inventory.
            const labelLeft = 12 + labelX * STEP;
            ui.icon(layer, Math.round(labelLeft + labelWidth / 2 - 16), 8 + labelY * STEP + 8, 32, piece.item, p.white);
            ui.label(layer, [labelLeft + 4, 8 + labelY * STEP + 42, labelWidth - 8, 26], CARGO_BY_ID[piece.item].shortName,
                { display: true, size: 15, fit: 11, center: true, color: p.white });
            if (landed) {
                // It lands with a thud and a little puff of dust at its feet.
                landed = false;
                play('thunk');
                const bottom = Math.round(8 + Math.max(...footprint.map(([, fy]) => fy)) * STEP + PIECE);
                motion.after(200, () => burst(ui, motion, grid, px, bottom - 6, {
                    colors: [p.secondary, p.muted], count: 8, speed: 0.09, gravity: 0.0002, life: 420, size: 3, upward: true,
                }));
            }
        }

        const counts = packedInventory(placements);
        for (const row of items) {
            const { item, button, stock, need, tag, tagText } = row;
            drawShape(row, held?.item === item.id ? held.rotation : 0);
            const left = item.stock - counts[item.id];
            ui.setText(stock, `${left} left`);
            ui.textColor(stock, left === 0 ? p.muted : p.amber);
            ui.fill(button.surface, held?.item === item.id ? p.teal : p.raised);
            ui.show(button.entity, tabOf(item.id) === tab);
            if (tag && tagText) {
                const done = counts[item.id] >= need;
                ui.fill(tag, done ? p.good : p.amber);
                ui.setText(tagText, done ? 'PACKED' : 'NEEDED');
                if (done && wasPacked.get(item.id) === false) { motion.hop(tag, TAG_X, 8, 6); play('chime'); }
                wasPacked.set(item.id, done);
            }
        }
        const missing = CARGO_ITEMS.filter(item => counts[item.id] < (required[item.id] ?? 0));
        if (missing.length === 0 && stillMissing > 0) motion.after(300, () => play('success'));
        stillMissing = missing.length;
        for (const t of tabs) {
            const active = t.name === tab;
            ui.fill(t.button.surface, active ? p.amber : p.raised);
            ui.textColor(t.button.text, active ? p.ink : p.text);
            ui.show(t.marker, !active && missing.some(item => tabOf(item.id) === t.name));
        }
        ui.setText(usage, `${occupied} / ${CARGO_COLUMNS * CARGO_ROWS} cells used`);
        const nextStep = missing.length
            ? 'First pack the NEEDED items. Drag one into the bay, or click it and then a cell.'
            : 'Needed items packed. Add supplies, then Review & Launch.';
        ui.setText(status, feedback || nextStep);
        ui.textColor(status, error ? p.bad : feedback ? p.text : p.secondary);

        // Meters: starting stock + what packed items will add, against daily use in the main loop.
        const lastsBy = supplyLasts(setup, placements);
        for (const meter of meters) {
            const { lasts, deadline, ok } = lastsBy.find(entry => entry.key === meter.key)!;
            meter.target = Math.min(meter.segs.length, Math.round((lasts / deadline) * meter.segs.length));
            meter.tone = ok ? p.good : p.amber;
            if (motion.reducedMotion) meter.shown = meter.target;
            paintMeter(meter);
            ui.setText(meter.days, ok ? 'whole trip ✓' : `${lasts} of ${deadline} sols`);
            ui.textColor(meter.days, ok ? p.good : p.amber);
        }

        const problem = held ? 'Place or put back the item in hand first.' : launchProblem(placements);
        const checklist = missing.length
            ? `Still needed: ${missing.map(item => `${item.name} × ${(required[item.id] ?? 0) - counts[item.id]}`).join(', ')}`
            : problem ?? 'Everything needed is packed. Ready to review.';
        ui.setText(validation, checklist);
        ui.textColor(validation, missing.length ? p.amber : problem ? p.bad : p.good);
        ui.fill(launch.surface, problem ? p.well : p.amber);
        ui.textColor(launch.text, problem ? p.secondary : p.ink);
        launch.setDisabled(Boolean(problem));
        rotate.setDisabled(!held);
        cancel.setDisabled(!held);
        empty.setDisabled(placements.length === 0);
        preview();
    }
    function paintMeter(meter: typeof meters[number]): void {
        meter.segs.forEach((seg, i) => ui.fill(seg, i < meter.shown ? meter.tone : p.well));
    }
    let lastMeterStep = 0;
    function stepMeters(): void {
        const time = Date.now();
        if (time - lastMeterStep < 45) return;
        lastMeterStep = time;
        for (const meter of meters) {
            if (meter.shown === meter.target) continue;
            meter.shown += meter.shown < meter.target ? 1 : -1;
            paintMeter(meter);
        }
    }

    refresh();

    // Per-frame input. Returns true when it used Escape, so the page does not navigate away.
    return input => {
        motion.tick();
        stepMeters();
        if (input.isKeyPressed('KeyR') || input.isMouseButtonPressed(2)) rotateHeld();
        if (drag && input.isMouseButtonReleased(0)) {
            const moved = Math.hypot(input.mouseX - drag.x, input.mouseY - drag.y) > DRAG_THRESHOLD_PX;
            drag = null;
            if (held && held.from && !moved) {
                // A click on a packed item: it goes back to the inventory.
                const name = CARGO_BY_ID[held.item].name;
                held = null;
                play('blip', 0.8);
                say(`${name} returned to inventory.`, false);
            } else if (held && moved) {
                if (!hover || !placeAt(hover.x, hover.y)) {
                    if (!hover) cancelHeld();
                    else { const reason = feedback; cancelHeld(); say(reason, true); }
                } else {
                    held = null;
                    refresh();
                }
            }
        }
        lastMouse = { x: input.mouseX, y: input.mouseY };
        if (input.isKeyPressed('Escape') && held) {
            cancelHeld();
            return true;
        }
        return false;
    };
}
