import { getItem } from '../data/items';
import type { ItemDef } from '../data/types';
import type { CargoInventory, ResourcePool } from '../../contracts/gameContract';

// ---------------------------------------------------------------------------
// Rocket cargo bay: a grid inventory ("Pack the Rocket"). Items have
// tetris-like shapes and can be rotated. Pure logic, no engine code.
// ---------------------------------------------------------------------------

export type Rotation = 0 | 1 | 2 | 3;

export interface Cell { x: number; y: number }

export interface PlacedItem {
    uid: number;
    itemId: string;
    x: number;
    y: number;
    rotation: Rotation;
}

/** Parse ['XX', 'X.'] into a list of filled cells, rotated clockwise `rotation` times. */
export function shapeCells(shape: string[], rotation: Rotation = 0): Cell[] {
    let cells: Cell[] = [];
    shape.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === 'X') cells.push({ x, y }); }));
    for (let r = 0; r < rotation; r++) {
        const h = Math.max(...cells.map((c) => c.y)) + 1;
        // (x, y) -> (h - 1 - y, x) rotates 90° clockwise.
        cells = cells.map((c) => ({ x: h - 1 - c.y, y: c.x }));
    }
    // Keep the shape touching (0, 0) so x/y always mean "top-left of the shape".
    const minX = Math.min(...cells.map((c) => c.x));
    const minY = Math.min(...cells.map((c) => c.y));
    return cells.map((c) => ({ x: c.x - minX, y: c.y - minY }));
}

export function shapeSize(shape: string[], rotation: Rotation = 0): { w: number; h: number } {
    const cells = shapeCells(shape, rotation);
    return { w: Math.max(...cells.map((c) => c.x)) + 1, h: Math.max(...cells.map((c) => c.y)) + 1 };
}

export class RocketGrid {
    readonly cols: number;
    readonly rows: number;
    private items_: PlacedItem[] = [];
    /** occupancy[y][x] = uid of the item in that cell, or 0. */
    private occ_: number[][];
    private nextUid_ = 1;

    constructor(cols: number, rows: number) {
        this.cols = cols;
        this.rows = rows;
        this.occ_ = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
    }

    get items(): readonly PlacedItem[] { return this.items_; }

    /** uid of the item covering (x, y), or 0 for empty. */
    at(x: number, y: number): number {
        return this.inBounds(x, y) ? this.occ_[y][x] : 0;
    }

    inBounds(x: number, y: number): boolean {
        return x >= 0 && y >= 0 && x < this.cols && y < this.rows;
    }

    /** Cells the item would cover with its top-left at (x, y). */
    footprint(itemId: string, x: number, y: number, rotation: Rotation): Cell[] {
        return shapeCells(getItem(itemId).shape, rotation).map((c) => ({ x: c.x + x, y: c.y + y }));
    }

    canPlace(itemId: string, x: number, y: number, rotation: Rotation = 0, ignoreUid = 0): boolean {
        return this.footprint(itemId, x, y, rotation).every(
            (c) => this.inBounds(c.x, c.y) && (this.occ_[c.y][c.x] === 0 || this.occ_[c.y][c.x] === ignoreUid),
        );
    }

    /** Returns the new item's uid, or 0 if it does not fit there. */
    place(itemId: string, x: number, y: number, rotation: Rotation = 0): number {
        if (!this.canPlace(itemId, x, y, rotation)) return 0;
        const uid = this.nextUid_++;
        this.items_.push({ uid, itemId, x, y, rotation });
        for (const c of this.footprint(itemId, x, y, rotation)) this.occ_[c.y][c.x] = uid;
        return uid;
    }

    remove(uid: number): PlacedItem | null {
        const idx = this.items_.findIndex((i) => i.uid === uid);
        if (idx < 0) return null;
        const [it] = this.items_.splice(idx, 1);
        for (const c of this.footprint(it.itemId, it.x, it.y, it.rotation)) this.occ_[c.y][c.x] = 0;
        return it;
    }

    /** Move/rotate an already placed item. Returns false (and leaves it alone) if it does not fit. */
    move(uid: number, x: number, y: number, rotation: Rotation): boolean {
        const it = this.items_.find((i) => i.uid === uid);
        if (!it || !this.canPlace(it.itemId, x, y, rotation, uid)) return false;
        for (const c of this.footprint(it.itemId, it.x, it.y, it.rotation)) this.occ_[c.y][c.x] = 0;
        Object.assign(it, { x, y, rotation });
        for (const c of this.footprint(it.itemId, x, y, rotation)) this.occ_[c.y][c.x] = uid;
        return true;
    }

    /** First free spot (row by row, all rotations) for an item, or null if the bay is too full. */
    findSpot(itemId: string): { x: number; y: number; rotation: Rotation } | null {
        for (const rotation of [0, 1, 2, 3] as Rotation[]) {
            for (let y = 0; y < this.rows; y++) {
                for (let x = 0; x < this.cols; x++) {
                    if (this.canPlace(itemId, x, y, rotation)) return { x, y, rotation };
                }
            }
        }
        return null;
    }

    clear(): void {
        for (const it of this.items_.slice()) this.remove(it.uid);
    }

    count(itemId: string): number {
        return this.items_.filter((i) => i.itemId === itemId).length;
    }

    usedCells(): number {
        return this.occ_.reduce((n, row) => n + row.filter((v) => v !== 0).length, 0);
    }

    /** What the packed items add to the contract: starting resources and cargo counts. */
    totals(): { resources: ResourcePool; cargo: CargoInventory } {
        const resources: ResourcePool = { energy: 0, food: 0, water: 0, oxygen: 0, res: 0 };
        const cargo: CargoInventory = {
            repairKits: 0, medkits: 0, batteryPacks: 0, seedPods: 0, extraRations: 0, windSampler: 0,
        };
        for (const it of this.items_) {
            const def: ItemDef = getItem(it.itemId);
            for (const [k, v] of Object.entries(def.resources ?? {}) as [keyof ResourcePool, number][]) resources[k] += v;
            for (const [k, v] of Object.entries(def.cargo ?? {}) as [keyof CargoInventory, number][]) cargo[k] += v;
        }
        return { resources, cargo };
    }
}
