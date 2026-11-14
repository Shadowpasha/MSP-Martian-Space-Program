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
import { Interactable, type Color, type InputState } from 'esengine';
import { makeAbsBox } from './theme';
import type { CargoItemId, MissionSetupInput, ResourcePool } from '../contracts/gameContract';
import {
    CARGO_BY_ID, CARGO_COLUMNS, CARGO_ITEMS, CARGO_ROWS, occupiedCells, packedInventory, placementProblem, rotatedCells,
    type CargoPlacement, type Rotation,
} from '../data/cargo';
import { FOOD_PER_CREW_PER_SOL, OXYGEN_PER_SOL, WATER_PER_CREW_PER_SOL } from '../data/supplyRates';
import { type FlightUi } from './flightUi';

const CARGO_COLORS: Record<CargoItemId, number> = {
    windSampler: 0xd39e55, repairKits: 0xcc745e, batteryPacks: 0xe1bd65, medkits: 0xcf7c8c,
    seedPods: 0x8db079, extraRations: 0xba9a6e, waterCanisters: 0x75a7c7, oxygenTanks: 0x69bbb5,
};
const DRAG_THRESHOLD_PX = 6;

/** Inventory tabs, like Mission Prep's shelf: mission gear, supplies, power, tools. */
const INVENTORY_TABS = ['Mission', 'Supplies', 'Power', 'Tools'] as const;
type InventoryTab = typeof INVENTORY_TABS[number];
const TAB_OF: Partial<Record<CargoItemId, InventoryTab>> = {
    windSampler: 'Mission',
    seedPods: 'Supplies', extraRations: 'Supplies', waterCanisters: 'Supplies', oxygenTanks: 'Supplies',
    batteryPacks: 'Power',
    repairKits: 'Tools', medkits: 'Tools',
};
const PIECE = 76;
const STEP = 84;

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
    const bay = ui.frame(root, [248, 108, 576, 596]);
    const inventory = ui.frame(root, [840, 108, 424, 596]);
    ui.label(bay, [20, 12, 332, 40], 'Cargo Bay', { display: true, size: 28 });
    const usage = ui.label(bay, [340, 12, 196, 40], '', { size: 15, color: p.amber, center: true });
    ui.label(bay, [20, 56, 524, 32], 'Drag a supply into the bay, or click it and then a cell.', { size: 14, color: p.secondary });
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
        }, { tone: 'tile' });
        return { button, x, y };
    });
    const status = ui.label(bay, [20, 448, 528, 40], '', { size: 14, wrap: true });
    const rotate = ui.button(bay, [20, 500, 164, 44], rotateHeld, { label: 'Rotate [R]' });
    const empty = ui.button(bay, [196, 500, 164, 44], emptyBay, { label: 'Empty Bay' });
    const cancel = ui.button(bay, [372, 500, 176, 44], cancelHeld, { label: 'Put Back [Esc]' });
    ui.label(bay, [20, 548, 528, 28], 'Click a packed item to take it out · drag it to move it', { size: 13, color: p.muted });

    // ---- Inventory: tabbed by kind, so items are quick to find ----
    ui.label(inventory, [16, 12, 384, 36], 'Supply Inventory', { display: true, size: 28 });
    const required = setup.missionGoal.requiredEquipment ?? {};
    const tabOf = (id: CargoItemId): InventoryTab => TAB_OF[id] ?? 'Supplies';
    let tab: InventoryTab = INVENTORY_TABS.find(t => CARGO_ITEMS.some(item => tabOf(item.id) === t && (required[item.id] ?? 0) > 0)) ?? 'Mission';
    const tabs = INVENTORY_TABS.map((name, index) => {
        const button = ui.button(inventory, [16 + index * 97, 50, 92, 36], () => { tab = name; refresh(); }, { label: name });
        // Amber marker: this tab still holds required equipment that is not packed yet.
        const marker = ui.box(button.entity, [84, 2, 6, 6], p.amber);
        return { name, button, marker };
    });
    const ROW = 64;
    const items = CARGO_ITEMS.map((item) => {
        const slot = CARGO_ITEMS.filter(other => tabOf(other.id) === tabOf(item.id)).indexOf(item);
        const button = ui.button(inventory, [16, 94 + slot * ROW, 384, ROW - 6], () => {
            if (ui.hasKeyboardFocus(button.entity)) pick(item.id, true);
        });
        ui.icon(button.entity, 10, 12, 32, item.id, p.amber);
        ui.label(button.entity, [54, 4, 220, 26], item.name, { display: true, size: 18 });
        ui.label(button.entity, [54, 30, 270, 24], item.effect, { size: 12, color: p.secondary, wrap: true });
        const needed = (required[item.id] ?? 0) > 0;
        if (needed) {
            const tag = ui.box(button.entity, [276, 8, 64, 18], p.amber);
            ui.label(tag, [0, 0, 64, 18], 'NEEDED', { size: 11, color: p.ink, center: true });
        }
        const stock = ui.label(button.entity, [334, 0, 44, ROW - 6], '', { size: 15, color: p.amber, center: true });
        ui.on(button.entity, 'press', () => pick(item.id, false));
        return { item, button, stock };
    });

    // ---- Supply meters: how long each supply lasts with what is packed ----
    const meterTop = 380;
    ui.label(inventory, [16, meterTop, 384, 22], `Supplies for ${setup.crew.length || 4} crew · mission ends Sol ${setup.missionGoal.deadlineSol}`, {
        size: 13, color: p.secondary,
    });
    const meterKeys: (keyof ResourcePool)[] = ['food', 'water', 'oxygen'];
    const meters = meterKeys.map((key, index) => {
        const y = meterTop + 26 + index * 26;
        ui.icon(inventory, 16, y + 1, 20, key as 'food' | 'water' | 'oxygen', p.amber);
        ui.label(inventory, [44, y, 70, 22], key === 'oxygen' ? 'O₂' : key[0]!.toUpperCase() + key.slice(1), { size: 14 });
        const segs = Array.from({ length: 12 }, (_, i) => ui.box(inventory, [116 + i * 13, y + 6, 11, 10], p.well));
        const days = ui.label(inventory, [276, y, 124, 22], '', { size: 13, center: true });
        return { key, segs, days };
    });

    const validation = ui.label(inventory, [16, 478, 384, 40], '', { size: 14, wrap: true });
    const launch = ui.button(inventory, [16, 528, 384, 48], () => { if (!held) onLaunch(); }, { label: 'Review & Launch', tone: 'primary' });

    const piecesLayer = ui.box(grid, [0, 0, 520, 340]);
    let pieces = ui.box(piecesLayer, [0, 0, 520, 340]);
    const guides = ui.box(grid, [0, 0, 520, 340]);
    const markers = cells.map(cell => ({
        ...cell,
        ghost: ui.box(guides, [12 + cell.x * STEP, 8 + cell.y * STEP, PIECE, PIECE], p.transparent),
        focus: ui.box(guides, [12 + cell.x * STEP + PIECE - 12, 8 + cell.y * STEP + 4, 8, 8], p.transparent),
    }));

    // Pieces are drawn across the 8-px gaps between cells, but the gaps themselves are not
    // buttons. These invisible strips make the whole piece clickable: a press on a gap
    // acts on the piece that covers it (and does nothing over an empty gap).
    const pieceAt = (x: number, y: number) => placements.find(piece => occupiedCells(piece).some(([px, py]) => px === x && py === y));
    const gapHit = (bounds: readonly [number, number, number, number], a: readonly [number, number], b: readonly [number, number]) => {
        const hit = makeAbsBox(ui.world, grid, ...bounds, undefined, false);
        ui.world.insert(hit, Interactable, { enabled: true, blockRaycast: true, raycastTarget: true });
        ui.on(hit, 'press', () => {
            const piece = pieceAt(a[0], a[1]);
            if (piece && piece === pieceAt(b[0], b[1])) pressCell(a[0], a[1], false);
        });
        ui.on(hit, 'hover_enter', () => { hover = { x: a[0], y: a[1] }; preview(); });
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
        say(`${CARGO_BY_ID[item].name} in hand: drop it on the bay or click a cell. R rotates, Esc puts it back.`, false);
    }

    function pressCell(x: number, y: number, keyboard: boolean): void {
        if (held) { placeAt(x, y); return; }
        const hit = placements.find(piece => occupiedCells(piece).some(([px, py]) => px === x && py === y));
        if (!hit) return;
        // Lift it out; a click (no drag) on release means "take it out of the rocket".
        commit(placements.filter(piece => piece.id !== hit.id));
        held = { item: hit.item, rotation: hit.rotation, from: hit };
        if (keyboard) { held = null; say(`${CARGO_BY_ID[hit.item].name} returned to inventory.`, false); return; }
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
        feedback = text;
        error = isError;
        refresh();
    }

    // ---- Drawing ----
    function preview(): void {
        for (const cell of markers) ui.fill(cell.ghost, p.transparent);
        if (!hover) return;
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
        ui.world.despawn(pieces);
        pieces = ui.box(piecesLayer, [0, 0, 520, 340]);
        let occupied = 0;
        for (const piece of placements) {
            const footprint = occupiedCells(piece);
            occupied += footprint.length;
            const base = cargoColor(piece.item, 0.44);
            const outline = cargoColor(piece.item, 0.91);
            const detail = cargoColor(piece.item, 0.55);
            const contains = (x: number, y: number) => footprint.some(([cx, cy]) => cx === x && cy === y);
            for (const [x, y] of footprint) {
                const left = 12 + x * STEP;
                const top = 8 + y * STEP;
                const right = contains(x + 1, y);
                const down = contains(x, y + 1);
                ui.box(pieces, [left, top, PIECE + (right ? 8 : 0), PIECE + (down ? 8 : 0)], base);
                if (right && down && contains(x + 1, y + 1)) ui.box(pieces, [left + PIECE, top + PIECE, 8, 8], base);
                if (!contains(x - 1, y)) ui.box(pieces, [left, top, 4, PIECE + (down ? 8 : 0)], outline);
                if (!contains(x, y - 1)) ui.box(pieces, [left, top, PIECE + (right ? 8 : 0), 4], outline);
                if (!right) ui.box(pieces, [left + PIECE - 4, top, 4, PIECE + (down ? 8 : 0)], outline);
                if (!down) ui.box(pieces, [left, top + PIECE - 4, PIECE + (right ? 8 : 0), 4], outline);
                if (right && down && !contains(x + 1, y + 1)) {
                    ui.box(pieces, [left + PIECE, top + PIECE - 4, 8, 4], outline);
                    ui.box(pieces, [left + PIECE - 4, top + PIECE, 4, 8], outline);
                }
                ui.box(pieces, [left + 12, top + 12, 4, 4], detail);
                ui.box(pieces, [left + 60, top + 60, 4, 4], detail);
            }
            // Icon + name centred on the whole footprint, so a piece reads as one object.
            const cx = footprint.reduce((a, [x]) => a + x, 0) / footprint.length;
            const cy = footprint.reduce((a, [, y]) => a + y, 0) / footprint.length;
            const px = Math.round(12 + cx * STEP + PIECE / 2);
            const py = Math.round(8 + cy * STEP + PIECE / 2);
            ui.icon(pieces, px - 16, py - 26, 32, piece.item, p.white);
            ui.label(pieces, [px - 60, py + 8, 120, 22], CARGO_BY_ID[piece.item].shortName, { display: true, size: 15, center: true, color: p.white });
        }

        const counts = packedInventory(placements);
        for (const { item, button, stock } of items) {
            ui.setText(stock, `×${item.stock - counts[item.id]}`);
            ui.fill(button.surface, held?.item === item.id ? p.teal : p.raised);
            ui.show(button.entity, tabOf(item.id) === tab);
        }
        for (const t of tabs) {
            const active = t.name === tab;
            ui.fill(t.button.surface, active ? p.amber : p.raised);
            ui.textColor(t.button.text, active ? p.ink : p.text);
            const missing = CARGO_ITEMS.some(item => tabOf(item.id) === t.name && counts[item.id] < (required[item.id] ?? 0));
            ui.show(t.marker, missing && !active);
        }
        ui.setText(usage, `${occupied} / ${CARGO_COLUMNS * CARGO_ROWS} cells used`);
        ui.setText(status, feedback || 'Pack the required equipment first, then supplies.');
        ui.textColor(status, error ? p.bad : p.secondary);

        // Meters: starting stock + what packed items will add, against daily use in the main loop.
        const lastsBy = supplyLasts(setup, placements);
        for (const meter of meters) {
            const { lasts, deadline, ok } = lastsBy.find(entry => entry.key === meter.key)!;
            const filled = Math.min(meter.segs.length, Math.round((lasts / deadline) * meter.segs.length));
            meter.segs.forEach((seg, i) => ui.fill(seg, i < filled ? (ok ? p.good : p.amber) : p.well));
            ui.setText(meter.days, ok ? 'whole trip ✓' : `${lasts} of ${deadline} sols`);
            ui.textColor(meter.days, ok ? p.good : p.amber);
        }

        const problem = held ? 'Place or put back the item in hand first.' : launchProblem(placements);
        ui.setText(validation, problem ?? 'Crew and equipment ready.');
        ui.textColor(validation, problem ? p.bad : p.good);
        ui.fill(launch.surface, problem ? p.well : p.amber);
        ui.textColor(launch.text, problem ? p.secondary : p.ink);
        launch.setDisabled(Boolean(problem));
        rotate.setDisabled(!held);
        cancel.setDisabled(!held);
        empty.setDisabled(placements.length === 0);
        preview();
    }
    refresh();

    // Per-frame input. Returns true when it used Escape, so the page does not navigate away.
    return input => {
        if (input.isKeyPressed('KeyR') || input.isMouseButtonPressed(2)) rotateHeld();
        if (drag && input.isMouseButtonReleased(0)) {
            const moved = Math.hypot(input.mouseX - drag.x, input.mouseY - drag.y) > DRAG_THRESHOLD_PX;
            drag = null;
            if (held && held.from && !moved) {
                // A click on a packed item: it goes back to the inventory.
                const name = CARGO_BY_ID[held.item].name;
                held = null;
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
