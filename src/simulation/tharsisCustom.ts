import type { CrewRole, ResourcePool, TaskCategory } from '../contracts/gameContract';
import { EQUIPMENT_IDS, STATION_EQUIPMENT, type StationEquipmentId } from '../data/tharsisEquipment';
import { resourceEntries } from '../data/missions';
import type { WorkOrder } from '../data/tharsisOrders';

const SPECIALTY = { ENG: 'engineer', BIO: 'botanist', NAV: 'pilot', MED: 'medic', SCI: 'scientist' } satisfies Partial<Record<TaskCategory, CrewRole>>;
const COST_LIMITS: ResourcePool = { energy: 8, food: 4, water: 4, oxygen: 5, res: 4 };
const OUTPUT_PER_SHIFT: ResourcePool = { energy: 12, food: 9, water: 10, oxygen: 12, res: 4 };

export interface CustomTaskSpec {
    title: string;
    description: string;
    category: keyof typeof SPECIALTY;
    shifts: number;
    cost: Partial<ResourcePool>;
    output: Partial<ResourcePool>;
    exterior: boolean;
    decommission?: StationEquipmentId;
}

export interface CustomWorkOrder extends WorkOrder {
    bay: 'custom';
}

export function ariesText(value: unknown, max: number): string | null {
    if (typeof value !== 'string') return null;
    const text = value.trim().replace(/\s+/g, ' ').replace(/\bgemini\b/gi, 'A.R.I.E.S.');
    return text.length > 0 && text.length <= max && !/[<>\u0000-\u001f]/.test(text) ? text : null;
}

function parsePool(value: unknown, limits: ResourcePool): Partial<ResourcePool> | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    const pool: Partial<ResourcePool> = {};
    for (const [rawKey, amount] of Object.entries(value)) {
        const key = resourceEntries(limits).find(([id]) => id === rawKey)?.[0];
        if (!key || typeof amount !== 'number' || !Number.isInteger(amount) || amount < 0 || amount > limits[key]) return null;
        if (amount) pool[key] = amount;
    }
    return pool;
}

/** Both discussion and scheduling run the same economy checks. */
export function readCustomTask(value: unknown): CustomTaskSpec | null {
    if (!value || typeof value !== 'object') return null;
    const raw = value as Record<string, unknown>;
    const title = ariesText(raw.title, 44);
    const description = ariesText(raw.description, 180);
    const category = Object.keys(SPECIALTY).find(key => key === raw.category) as CustomTaskSpec['category'] | undefined;
    const shifts = raw.shifts;
    const decommission = EQUIPMENT_IDS.find(id => id === raw.decommission);
    if (!title || !description || !category || typeof shifts !== 'number' || !Number.isInteger(shifts) || shifts < 1 || shifts > 4 ||
        (raw.decommission !== undefined && raw.decommission !== 'none' && !decommission) ||
        (raw.exterior !== undefined && typeof raw.exterior !== 'boolean')) return null;
    const cost = parsePool(raw.cost, COST_LIMITS);
    const limits = { ...OUTPUT_PER_SHIFT };
    for (const [key, amount] of resourceEntries(limits)) limits[key] = amount * shifts;
    if (decommission) limits.res = STATION_EQUIPMENT[decommission].maxMaterials;
    const output = parsePool(raw.output, limits);
    if (!cost || !output) return null;
    const inputs = resourceEntries(cost);
    const gains = resourceEntries(output);
    if (!inputs.length || inputs.length > 3 || !gains.length || gains.length > 2 || gains.some(([key]) => cost[key])) return null;
    if (decommission ? gains.length !== 1 || (output.res ?? 0) < 4 : gains.reduce((budget, [key, amount]) => budget + amount / limits[key], 0) > 1.25) return null;
    if (Object.keys(raw).some(key => !['title', 'description', 'category', 'shifts', 'cost', 'output', 'exterior', 'decommission'].includes(key))) return null;
    return { title, description, category, shifts, cost, output, exterior: raw.exterior === true, ...(decommission && { decommission }) };
}

export function customWorkOrder(spec: CustomTaskSpec, id: string): CustomWorkOrder {
    const { title, description, shifts, cost, output, category, exterior, decommission } = spec;
    return { id, title, description, bay: 'custom', category, specialists: [SPECIALTY[category]], shifts, cost,
        yield: output, ...(exterior && { exterior: true }), ...(decommission && { decommission }) };
}
