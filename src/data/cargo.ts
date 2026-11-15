import type { CargoInventory, CargoItemId, ResourcePool } from '../contracts/gameContract';

export type Cell = readonly [column: number, row: number];
export type Rotation = 0 | 1 | 2 | 3;

export interface CargoItem {
    id: CargoItemId;
    name: string;
    shortName: string;
    stock: number;
    cells: readonly Cell[];
    effect: string;
    resources?: Partial<ResourcePool>;
    morale?: number;
    radiation?: number;
    crewHealth?: number;
}

export const CARGO_ITEMS: readonly CargoItem[] = [
    { id: 'windSampler', name: 'Wind Sampler', shortName: 'Sampler', stock: 1,
        cells: [[0, 0], [1, 0], [0, 1], [1, 1]], effect: 'Required for the weather survey.' },
    { id: 'repairKits', name: 'Repair Kit', shortName: 'Repair', stock: 2,
        cells: [[0, 0], [0, 1], [1, 1]], effect: '+12 O₂, +6 Power', resources: { oxygen: 12, energy: 6 } },
    { id: 'batteryPacks', name: 'Battery Pack', shortName: 'Battery', stock: 2,
        cells: [[0, 0], [1, 0]], effect: '+22 Power', resources: { energy: 22 } },
    { id: 'medkits', name: 'Medkit', shortName: 'Medical', stock: 2,
        cells: [[0, 0]], effect: '+15 crew health, +6 Morale, −12 radiation', crewHealth: 15, morale: 6, radiation: -12 },
    { id: 'seedPods', name: 'Seed Pod', shortName: 'Seeds', stock: 2,
        cells: [[0, 0]], effect: '+8 Food, +6 O₂', resources: { food: 8, oxygen: 6 } },
    { id: 'extraRations', name: 'Extra Rations', shortName: 'Rations', stock: 3,
        cells: [[0, 0], [1, 0]], effect: '+10 Food, +5 Morale', resources: { food: 10 }, morale: 5 },
    { id: 'waterCanisters', name: 'Water Canister', shortName: 'Water', stock: 3,
        cells: [[0, 0], [0, 1]], effect: '+14 Water', resources: { water: 14 } },
    { id: 'oxygenTanks', name: 'Oxygen Tank', shortName: 'O₂ Tank', stock: 2,
        cells: [[0, 0], [1, 0], [2, 0]], effect: '+16 O₂', resources: { oxygen: 16 } },
    { id: 'radDetector', name: 'RAD Detector', shortName: 'RAD', stock: 1,
        cells: [[0, 0], [1, 0]], effect: 'Required for the radiation survey.' },
    { id: 'iceDrill', name: 'Ice Drill', shortName: 'Drill', stock: 1,
        cells: [[0, 0], [0, 1], [0, 2]], effect: 'Required to drill the ice cores.' },
];

export const CARGO_BY_ID = Object.fromEntries(CARGO_ITEMS.map(item => [item.id, item])) as Record<CargoItemId, CargoItem>;
export const CARGO_COLUMNS = 6;
export const CARGO_ROWS = 4;

export interface CargoPlacement {
    id: number;
    item: CargoItemId;
    x: number;
    y: number;
    rotation: Rotation;
}

export function normalizeCargo(cargo: CargoInventory): Required<CargoInventory> {
    return {
        ...cargo, waterCanisters: cargo.waterCanisters ?? 0, oxygenTanks: cargo.oxygenTanks ?? 0,
        radDetector: cargo.radDetector ?? 0, iceDrill: cargo.iceDrill ?? 0,
    };
}

export function packedInventory(placements: readonly CargoPlacement[]): Required<CargoInventory> {
    const inventory = normalizeCargo({ repairKits: 0, medkits: 0, batteryPacks: 0, seedPods: 0, extraRations: 0, windSampler: 0 });
    for (const placement of placements) inventory[placement.item]++;
    return inventory;
}

export function rotatedCells(item: CargoItemId, rotation: Rotation): Cell[] {
    let cells = CARGO_BY_ID[item].cells;
    for (let turn = 0; turn < rotation; turn++) {
        const height = Math.max(...cells.map(([, y]) => y));
        cells = cells.map(([x, y]) => [height - y, x]);
    }
    return [...cells];
}

export function occupiedCells(placement: CargoPlacement): Cell[] {
    return rotatedCells(placement.item, placement.rotation).map(([x, y]) => [x + placement.x, y + placement.y]);
}

export function placementProblem(draft: readonly CargoPlacement[], next: CargoPlacement): string | null {
    const other = draft.filter(placed => placed.id !== next.id);
    if (other.filter(placed => placed.item === next.item).length >= CARGO_BY_ID[next.item].stock) return 'No more of this item in stock.';
    if (!Number.isInteger(next.x) || !Number.isInteger(next.y) || ![0, 1, 2, 3].includes(next.rotation)) {
        return 'Choose a grid cell and a valid rotation.';
    }
    const cells = occupiedCells(next);
    if (cells.some(([x, y]) => x < 0 || x >= CARGO_COLUMNS || y < 0 || y >= CARGO_ROWS)) return 'The item extends outside the cargo bay.';
    const taken = new Set(other.flatMap(occupiedCells).map(([x, y]) => y * CARGO_COLUMNS + x));
    if (cells.some(([x, y]) => taken.has(y * CARGO_COLUMNS + x))) return 'Another item occupies this space.';
    return null;
}

/** Auto Fill's basics after the required equipment: one each of food, water, O₂ and first aid. */
export const AUTO_FILL_BASICS: readonly CargoItemId[] = ['extraRations', 'waterCanisters', 'oxygenTanks', 'medkits'];

export type SupplyKey = 'food' | 'water' | 'oxygen';

/**
 * Auto Fill: keeps what is already packed, then adds what the mission requires and one of each
 * basic supply, then tops up until every supply meter covers the whole trip. `shortSupplies`
 * names the supplies that still run out before the deadline (the meters' own numbers). Each
 * item goes in the first spot (top-left first, any rotation) where it fits. Items that are out
 * of stock or have no room are skipped.
 */
export function autoFillCargo(
    placements: readonly CargoPlacement[],
    required: Partial<Record<CargoItemId, number>>,
    shortSupplies: (placements: readonly CargoPlacement[]) => readonly SupplyKey[] = () => [],
): CargoPlacement[] {
    const packed = [...placements];
    let nextId = Math.max(0, ...packed.map(piece => piece.id)) + 1;
    const counts = () => packedInventory(packed);
    const place = (item: CargoItemId): boolean => {
        for (let y = 0; y < CARGO_ROWS; y++) {
            for (let x = 0; x < CARGO_COLUMNS; x++) {
                for (const rotation of [0, 1, 2, 3] as const) {
                    const next: CargoPlacement = { id: nextId, item, x, y, rotation };
                    if (placementProblem(packed, next)) continue;
                    packed.push(next);
                    nextId++;
                    return true;
                }
            }
        }
        return false;
    };
    for (const [item, need] of Object.entries(required) as [CargoItemId, number][]) {
        while (counts()[item] < need && place(item)) { /* keep packing until the requirement is met */ }
    }
    for (const item of AUTO_FILL_BASICS) {
        if (counts()[item] === 0) place(item);
    }
    // Top up: for each supply that still runs short, pack whichever item gives the most of it,
    // falling back to the next best when one is out of stock or will not fit.
    const givesUp = new Set<SupplyKey>();
    for (;;) {
        const key = shortSupplies(packed).find(supply => !givesUp.has(supply));
        if (!key) break;
        const best = CARGO_ITEMS.filter(item => (item.resources?.[key] ?? 0) > 0)
            .sort((a, b) => (b.resources![key] ?? 0) - (a.resources![key] ?? 0));
        if (!best.some(item => place(item.id))) givesUp.add(key);
    }
    return packed;
}
