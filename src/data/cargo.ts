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
