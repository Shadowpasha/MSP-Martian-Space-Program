import type { CrewRole, ResourcePool, TaskCategory } from '../contracts/gameContract';
import type { StationEquipmentId } from './tharsisEquipment';

type Bay = 'rover' | 'instruments' | 'life' | 'stores' | 'crew' | 'custom';
type Pools = Partial<ResourcePool>;
export const TECHNIQUES = {
    specialist: 'Use the specialist checkout. Saves a shift at the cost of extra instrument power.',
    parallel: 'Stage tools and parallelize checks. Saves a shift but uses additional power and materials.',
    recycle: 'Reuse prepared spares. Saves materials but draws additional power.',
    conserve: 'Run the test in pulses. Saves power but consumes a spare and adds a shift.',
    dry: 'Reuse the test water in a closed cycle. Saves water but draws more power.',
} as const;
export type Technique = keyof typeof TECHNIQUES;
export const METHODS: readonly Technique[] = ['specialist', 'parallel', 'recycle', 'conserve'];

export interface WorkOrder {
    id: string;
    title: string;
    bay: Bay;
    description: string;
    category: TaskCategory;
    specialists: readonly CrewRole[];
    shifts: number;
    cost: Pools;
    needs?: readonly string[];
    exterior?: true;
    methods?: readonly Technique[];
    yield?: Pools;
    recovery?: number;
    decommission?: StationEquipmentId;
}

export const WORK_ORDERS: readonly WorkOrder[] = [
    { id: 'drive-check', title: 'Inspect drivetrain', bay: 'rover', category: 'NAV', specialists: ['pilot', 'engineer'], shifts: 2,
        description: 'Check wheel resistance and steering actuator current against the maintenance log.', cost: { energy: 2 }, methods: ['specialist', 'parallel', 'conserve'] },
    { id: 'drive-service', title: 'Service drive and power', bay: 'rover', category: 'ENG', specialists: ['engineer'], shifts: 3,
        description: 'Service seals, re-seat connectors, and cycle the rover battery under a bench load.', needs: ['drive-check'], cost: { energy: 3, res: 1 }, methods: METHODS },
    { id: 'sampler', title: 'Assemble Wind Sampler', bay: 'instruments', category: 'SCI', specialists: ['scientist', 'engineer'], shifts: 2,
        description: 'Fit the wind mast, pressure head, and harness. Inspect the sampler before applying power.', cost: { energy: 2, res: 1 }, methods: METHODS },
    { id: 'calibrate', title: 'Calibrate on rover power', bay: 'instruments', category: 'SCI', specialists: ['scientist', 'engineer'], shifts: 2,
        description: 'Check the wind and pressure baselines for interference when rover systems switch on.', needs: ['drive-service', 'sampler'], cost: { energy: 3 }, methods: ['specialist', 'parallel', 'conserve'] },
    { id: 'audit', title: 'Audit field inventory', bay: 'stores', category: 'BIO', specialists: ['botanist', 'captain'], shifts: 1,
        description: 'Count consumables and inspect expiration dates and fittings against the rover checklist.', cost: { energy: 1 } },
    { id: 'load-test', title: 'Load-test the rover', bay: 'rover', category: 'NAV', specialists: ['pilot', 'engineer'], shifts: 2,
        description: 'Drive a short loaded course and log traction and the lowest battery voltage.', needs: ['calibrate', 'audit'], cost: { energy: 3 }, exterior: true, methods: ['specialist', 'parallel', 'conserve'] },
    { id: 'telemetry', title: 'Verify instrument telemetry', bay: 'instruments', category: 'SCI', specialists: ['scientist', 'pilot'], shifts: 2,
        description: 'Reconcile sensor timestamps with the station link and verify that the logger has coverage.', needs: ['load-test'], cost: { energy: 2 }, methods: ['specialist', 'parallel', 'conserve'] },
    { id: 'seal', title: 'Verify and seal field stores', bay: 'stores', category: 'BIO', specialists: ['botanist', 'medic'], shifts: 2,
        description: 'Check potable water seals, reserve oxygen, battery connectors, and packed rations.', needs: ['audit'], cost: { energy: 2, water: 1 }, methods: ['specialist', 'parallel', 'conserve', 'dry'] },
    { id: 'route', title: 'Rehearse route and comms', bay: 'crew', category: 'NAV', specialists: ['pilot', 'captain'], shifts: 1,
        description: 'Rehearse the route to Site A, radio contact windows, and the turnaround rule.', needs: ['telemetry'], cost: { energy: 2 } },
    { id: 'suits', title: 'Certify field suits', bay: 'crew', category: 'MED', specialists: ['medic', 'captain'], shifts: 1,
        description: 'Fit and pressure-test EVA suits for the two travelers selected in the rover checklist.', needs: ['route', 'seal'], cost: { energy: 2, oxygen: 1 } },
    { id: 'harden', title: 'Harden rover for storm', bay: 'rover', category: 'ENG', specialists: ['engineer', 'pilot'], shifts: 2,
        description: 'Fit dust baffles, isolate the drive connections, and line the rover safe compartment.', needs: ['drive-service'], cost: { energy: 3, res: 2 }, methods: METHODS },
    { id: 'shield', title: 'Shield station shelter', bay: 'life', category: 'ENG', specialists: ['engineer', 'medic'], shifts: 2,
        description: 'Rearrange water and shielding panels around the storm shelter for passive protection.', cost: { energy: 2, res: 2 }, methods: METHODS },
    { id: 'greens', title: 'Harvest hydroponics', bay: 'life', category: 'BIO', specialists: ['botanist'], shifts: 2,
        description: 'Harvest mature greens and re-seed the trays. Supplement the station ration stock.', cost: { energy: 3, water: 1 }, yield: { food: 18, oxygen: 4 }, methods: ['specialist', 'conserve', 'dry'] },
    { id: 'water', title: 'Recover potable water', bay: 'life', category: 'SCI', specialists: ['scientist', 'botanist'], shifts: 2,
        description: 'Reprocess collected condensate and release it after a conductivity check.', cost: { energy: 3 }, yield: { water: 19 }, methods: ['specialist', 'conserve'] },
    { id: 'air', title: 'Service oxygen generator', bay: 'life', category: 'ENG', specialists: ['engineer'], shifts: 2,
        description: 'Service the cell stack and split reclaimed water into cabin oxygen.', cost: { energy: 3, water: 1 }, yield: { oxygen: 23 }, methods: ['specialist', 'conserve'] },
    { id: 'solar', title: 'Restore solar array', bay: 'life', category: 'ENG', specialists: ['engineer'], shifts: 2,
        description: 'Clear dust from the panel faces and rebalance the power converters.', cost: { energy: 1 }, yield: { energy: 21 }, exterior: true, methods: ['specialist', 'parallel'] },
    { id: 'spares', title: 'Recover station spares', bay: 'stores', category: 'ENG', specialists: ['engineer', 'captain'], shifts: 2,
        description: 'Reclaim seals and wiring from decommissioned station equipment.', cost: { energy: 2 }, yield: { res: 9 }, methods: ['specialist', 'conserve'] },
    { id: 'triage', title: 'Run crew checks', bay: 'life', category: 'MED', specialists: ['medic'], shifts: 1,
        description: 'Check crew exposure, treat fatigue, and review shelter rotation.', cost: { energy: 1, water: 1 }, recovery: 10 },
];

export const ORDER_BY_ID = new Map(WORK_ORDERS.map(order => [order.id, order]));
export const CHECKLIST = [
    { kind: 'prep_rover', label: 'Rover', bay: 'rover', orders: ['drive-check', 'drive-service', 'load-test'] },
    { kind: 'prep_sensor', label: 'Instruments', bay: 'instruments', orders: ['sampler', 'calibrate', 'telemetry'] },
    { kind: 'prep_supplies', label: 'Field supplies', bay: 'stores', orders: ['audit', 'seal'] },
    { kind: 'assign_crew', label: 'Field crew', bay: 'crew', orders: ['route', 'suits'] },
] as const;

export function repeatable(order: WorkOrder): boolean {
    return order.yield !== undefined || order.recovery !== undefined;
}
