// Mission Prep state + the actions screens call. Pure TypeScript, unit-tested.
// Screens only READ `PrepState` and call these functions. Actions set `dirty`
// (rebuild the screen) or `previewDirty` (repaint grid preview only).
import { DEFAULT_CREW, type CrewMember, type MissionSetupInput } from '../../contracts/gameContract';
import { getItem, ITEMS } from '../data/items';
import type { ItemCategory } from '../data/types';
import { ROCKET_COLS, ROCKET_ROWS } from './balance';
import { buildSetup } from './buildSetup';
import { canLaunch, checklist, launchBlocker } from './checklist';
import { createRng, type Rng } from './rng';
import { rollOffers, type MissionOffer } from './roll';
import { RocketGrid, type Rotation } from './rocketGrid';

export type PrepScreen = 'mission' | 'crew' | 'pack';
export const STEPS: { id: PrepScreen; label: string }[] = [
    { id: 'mission', label: 'Mission' },
    { id: 'crew', label: 'Crew' },
    { id: 'pack', label: 'Pack' },
];

export interface HeldItem {
    itemId: string;
    rotation: Rotation;
    /** Where it came from, so Esc/cancel can put it back. */
    from: { kind: 'shelf' } | { kind: 'grid'; x: number; y: number; rotation: Rotation };
}

export interface PrepState {
    screen: PrepScreen;
    rng: Rng;
    roster: CrewMember[];
    offers: MissionOffer[];
    /** Offer shown in the inspector / route on the map. */
    focused: number;
    /** Offer the player committed to (Choose Crew pressed). */
    chosen: MissionOffer | null;
    crewIds: string[];
    /** Crew member shown in the Crew inspector. */
    crewFocus: string;
    grid: RocketGrid;
    shelfTab: ItemCategory;
    held: HeldItem | null;
    hover: { x: number; y: number } | null;
    /** Item shown in the Pack inspector. */
    inspect: string | null;
    /** Keyboard cursor on the shelf (index into the current tab). */
    kbShelf: number;
    /** True after a key was used, until the pointer is used again: shows focus rings. */
    keyboard: boolean;
    message: string;
    messageLevel: 'info' | 'warn';
    unlockedSkillIds: string[];
    completed: string[];
    dirty: boolean;
    previewDirty: boolean;
}

export function newPrepState(opts: {
    seed?: number;
    roster?: CrewMember[];
    unlockedSkillIds?: string[];
    completed?: string[];
} = {}): PrepState {
    const roster = opts.roster ?? DEFAULT_CREW;
    const s: PrepState = {
        screen: 'mission',
        rng: createRng(opts.seed ?? (Date.now() >>> 0)),
        roster,
        offers: [],
        focused: 0,
        chosen: null,
        crewIds: [],
        crewFocus: roster[0]?.id ?? '',
        grid: new RocketGrid(ROCKET_COLS, ROCKET_ROWS),
        shelfTab: 'mission',
        held: null,
        hover: null,
        inspect: null,
        kbShelf: 0,
        keyboard: false,
        message: '',
        messageLevel: 'info',
        unlockedSkillIds: opts.unlockedSkillIds ?? [],
        completed: opts.completed ?? [],
        dirty: true,
        previewDirty: false,
    };
    s.offers = rollOffers(s.rng, { completed: s.completed });
    return s;
}

function say(s: PrepState, message: string, level: 'info' | 'warn' = 'info'): void {
    s.message = message;
    s.messageLevel = level;
    s.dirty = true;
}

export function crewOnBoard(s: PrepState): CrewMember[] {
    return s.roster.filter((c) => s.crewIds.includes(c.id));
}

// ---- Navigation -----------------------------------------------------------

/** Which steps the step list may jump to: done steps and the current one. */
export function stepReachable(s: PrepState, screen: PrepScreen): boolean {
    if (screen === 'mission') return true;
    if (screen === 'crew') return s.chosen !== null;
    return s.chosen !== null && s.crewIds.length >= 2;
}

export function goTo(s: PrepState, screen: PrepScreen): void {
    if (!stepReachable(s, screen) || s.screen === screen) return;
    cancelHeld(s);
    s.screen = screen;
    s.hover = null;
    say(s, '');
}

// ---- Mission Select --------------------------------------------------------

export function focusOffer(s: PrepState, index: number): void {
    if (index < 0 || index >= s.offers.length || s.focused === index) return;
    s.focused = index;
    s.dirty = true;
}

export function chooseFocusedMission(s: PrepState): void {
    const offer = s.offers[s.focused];
    if (!offer) return;
    if (s.chosen !== offer) {
        // A different mission means different hardware: start the rocket empty.
        s.chosen = offer;
        s.grid = new RocketGrid(ROCKET_COLS, ROCKET_ROWS);
        s.held = null;
    }
    s.screen = 'crew';
    say(s, 'Pick 2 to 4 crew. Everyone brings a skill, but everyone eats, drinks and breathes.');
}

// ---- Crew Pick -------------------------------------------------------------

export function focusCrew(s: PrepState, crewId: string): void {
    if (s.crewFocus === crewId) return;
    s.crewFocus = crewId;
    s.dirty = true;
}

export function toggleCrew(s: PrepState, crewId: string): void {
    s.crewFocus = crewId;
    const i = s.crewIds.indexOf(crewId);
    if (i >= 0) {
        s.crewIds.splice(i, 1);
        say(s, '');
        return;
    }
    if (s.crewIds.length >= s.roster.length) return;
    s.crewIds.push(crewId);
    say(s, '');
}

export function confirmCrew(s: PrepState): void {
    if (s.crewIds.length < 2) {
        say(s, 'Pick at least 2 crew to fly the mission.', 'warn');
        return;
    }
    s.screen = 'pack';
    s.shelfTab = 'mission';
    say(s, 'Pack the mission hardware first, then supplies. Drag items in, or click one and click a slot.');
}

// ---- Pack the Rocket -------------------------------------------------------

export function setShelfTab(s: PrepState, tab: ItemCategory): void {
    if (s.shelfTab === tab) return;
    s.shelfTab = tab;
    s.kbShelf = 0;
    s.dirty = true;
}

export const SHELF_TABS: ItemCategory[] = ['mission', 'supplies', 'power', 'tools'];

export function shelfItems(s: PrepState): string[] {
    return ITEMS.filter((i) => i.category === s.shelfTab).map((i) => i.id);
}

// ---- Keyboard ----------------------------------------------------------------

export function moveOfferFocus(s: PrepState, d: number): void {
    focusOffer(s, (s.focused + d + s.offers.length) % s.offers.length);
}

/** Crew cards sit in a 2-column grid. */
export function moveCrewFocus(s: PrepState, dx: number, dy: number): void {
    const i = Math.max(0, s.roster.findIndex((c) => c.id === s.crewFocus));
    const n = s.roster.length;
    let j = i + dx + dy * 2;
    if (j < 0 || j >= n) j = i;
    focusCrew(s, s.roster[j]!.id);
}

export function moveShelfFocus(s: PrepState, d: number): void {
    const n = shelfItems(s).length;
    if (n === 0) return;
    s.kbShelf = (s.kbShelf + d + n) % n;
    s.inspect = shelfItems(s)[s.kbShelf] ?? null;
    s.dirty = true;
}

export function cycleShelfTab(s: PrepState, d: number): void {
    const i = SHELF_TABS.indexOf(s.shelfTab);
    setShelfTab(s, SHELF_TABS[(i + d + SHELF_TABS.length) % SHELF_TABS.length]!);
}

/** Enter on the shelf: pick the focused item up, target the top-left slot. */
export function pickFocusedShelf(s: PrepState): void {
    const id = shelfItems(s)[s.kbShelf];
    if (!id) return;
    pickFromShelf(s, id);
    if (!s.hover) s.hover = { x: 0, y: 0 };
    s.previewDirty = true;
}

export function pickFromShelf(s: PrepState, itemId: string): void {
    cancelHeld(s);
    s.held = { itemId, rotation: 0, from: { kind: 'shelf' } };
    s.inspect = itemId;
    say(s, `${getItem(itemId).name} in hand. Click a slot to pack it. R rotates, Esc puts it back.`);
}

/** Pick up an item already in the bay (click on it, or start dragging it). */
export function pickFromGrid(s: PrepState, x: number, y: number): boolean {
    const uid = s.grid.at(x, y);
    if (!uid) return false;
    const it = s.grid.items.find((i) => i.uid === uid)!;
    s.grid.remove(uid);
    s.held = { itemId: it.itemId, rotation: it.rotation, from: { kind: 'grid', x: it.x, y: it.y, rotation: it.rotation } };
    s.inspect = it.itemId;
    say(s, `Picked up ${getItem(it.itemId).name}. Place it again, or press Esc.`);
    return true;
}

export function rotateHeld(s: PrepState): void {
    if (!s.held) return;
    s.held.rotation = ((s.held.rotation + 1) % 4) as Rotation;
    s.previewDirty = true;
}

/** Put the held item back where it came from (shelf, or its old slot). */
export function cancelHeld(s: PrepState): void {
    const h = s.held;
    if (!h) return;
    if (h.from.kind === 'grid') s.grid.place(h.itemId, h.from.x, h.from.y, h.from.rotation);
    s.held = null;
    s.dirty = true;
}

/** Hover position is the cell under the pointer; the held shape's top-left sits there. */
export function setHover(s: PrepState, x: number, y: number): void {
    if (s.hover && s.hover.x === x && s.hover.y === y) return;
    s.hover = { x, y };
    s.previewDirty = true;
}

export function clearHover(s: PrepState): void {
    if (!s.hover) return;
    s.hover = null;
    s.previewDirty = true;
}

export function heldFitsAt(s: PrepState, x: number, y: number): boolean {
    return !!s.held && s.grid.canPlace(s.held.itemId, x, y, s.held.rotation);
}

/** Click (or drop) on a cell: place what you hold, otherwise pick up what is there. */
export function clickCell(s: PrepState, x: number, y: number): void {
    if (s.held) {
        placeHeldAt(s, x, y);
        return;
    }
    pickFromGrid(s, x, y);
}

export function placeHeldAt(s: PrepState, x: number, y: number): boolean {
    const h = s.held;
    if (!h) return false;
    const def = getItem(h.itemId);
    if (!s.grid.place(h.itemId, x, y, h.rotation)) {
        say(s, `The ${def.name} doesn't fit there. Try another slot or rotate it (R).`, 'warn');
        return false;
    }
    // Keep supplies in hand so packing six food crates is six clicks, not twelve.
    const keep = h.from.kind === 'shelf' && def.category === 'supplies' && s.grid.findSpot(h.itemId) !== null;
    s.held = keep ? { itemId: h.itemId, rotation: h.rotation, from: { kind: 'shelf' } } : null;
    say(s, `Packed ${def.name}.`);
    return true;
}

/** Click a shelf item: put the first one that fits straight into the bay (keyboard / quick add). */
export function quickPack(s: PrepState, itemId: string): void {
    cancelHeld(s);
    const spot = s.grid.findSpot(itemId);
    s.inspect = itemId;
    if (!spot) {
        say(s, `No room left for the ${getItem(itemId).name}. Take something out first.`, 'warn');
        return;
    }
    s.grid.place(itemId, spot.x, spot.y, spot.rotation);
    say(s, `Packed ${getItem(itemId).name}.`);
}

export function unpackAt(s: PrepState, x: number, y: number): void {
    const uid = s.grid.at(x, y);
    if (!uid) return;
    const it = s.grid.remove(uid)!;
    say(s, `Took out ${getItem(it.itemId).name}.`);
}

export function emptyBay(s: PrepState): void {
    s.grid.clear();
    s.held = null;
    say(s, 'Rocket emptied.');
}

// ---- Launch ---------------------------------------------------------------

export function launchStatus(s: PrepState): { ok: boolean; blocker: string | null } {
    if (!s.chosen) return { ok: false, blocker: 'Choose a mission first' };
    const rows = checklist(s.chosen, s.grid, crewOnBoard(s));
    return { ok: canLaunch(rows), blocker: launchBlocker(rows) };
}

/** Returns the contract setup to hand to the main loop, or null (with a message) if not ready. */
export function launch(s: PrepState): MissionSetupInput | null {
    const st = launchStatus(s);
    if (!st.ok || !s.chosen) {
        say(s, `${st.blocker ?? 'Not ready'}.`, 'warn');
        return null;
    }
    cancelHeld(s);
    return buildSetup(s.chosen, crewOnBoard(s), s.grid, s.unlockedSkillIds);
}
