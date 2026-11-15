import type { CrewRole, ExpeditionId, MissionRequirementKind, ResourcePool, TaskCategory } from '../contracts/gameContract';
import type { StationEquipmentId } from './tharsisEquipment';

type Bay = 'rover' | 'instruments' | 'life' | 'stores' | 'crew' | 'custom';
type Pools = Partial<ResourcePool>;
export const TECHNIQUES = {
    specialist: 'Have the best-matched crew member run it. Saves 1 Sol, uses a bit more Power.',
    parallel: 'Team up with extra tools. Saves 1 Sol, uses more Power and Materials.',
    recycle: 'Reuse spare parts. Saves Materials, uses a bit more Power.',
    conserve: 'Go slow to save Power. Uses 1 extra Sol and 1 Material.',
    dry: 'Reuse test water. Saves Water, uses a bit more Power.',
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
    { id: 'drive-check', title: 'Check rover wheels', bay: 'rover', category: 'NAV', specialists: ['pilot', 'engineer'], shifts: 2,
        description: 'Check that the rover wheels and steering turn smoothly.', cost: { energy: 2 }, methods: ['specialist', 'parallel', 'conserve'] },
    { id: 'drive-service', title: 'Charge rover battery', bay: 'rover', category: 'ENG', specialists: ['engineer'], shifts: 3,
        description: 'Plug in cables, check seals, and test the rover battery.', needs: ['drive-check'], cost: { energy: 3, res: 1 }, methods: METHODS },
    { id: 'sampler', title: 'Attach science tool', bay: 'instruments', category: 'SCI', specialists: ['scientist', 'engineer'], shifts: 2,
        description: 'Bolt the science tool onto the rover and check the wires.', cost: { energy: 2, res: 1 }, methods: METHODS },
    { id: 'calibrate', title: 'Test tool on rover', bay: 'instruments', category: 'SCI', specialists: ['scientist', 'engineer'], shifts: 2,
        description: 'Turn on the science tool with rover power to make sure it reads right.', needs: ['drive-service', 'sampler'], cost: { energy: 3 }, methods: ['specialist', 'parallel', 'conserve'] },
    { id: 'audit', title: 'Count trip supplies', bay: 'stores', category: 'BIO', specialists: ['botanist', 'captain'], shifts: 1,
        description: 'Count the food, water, and gear to make sure nothing is missing.', cost: { energy: 1 } },
    { id: 'load-test', title: 'Test drive the rover', bay: 'rover', category: 'NAV', specialists: ['pilot', 'engineer'], shifts: 2,
        description: 'Take the rover for a short practice drive outside with cargo loaded.', needs: ['calibrate', 'audit'], cost: { energy: 3 }, exterior: true, methods: ['specialist', 'parallel', 'conserve'] },
    { id: 'telemetry', title: 'Test radio link', bay: 'instruments', category: 'SCI', specialists: ['scientist', 'pilot'], shifts: 2,
        description: 'Make sure the science tool can send its data back to the station.', needs: ['load-test'], cost: { energy: 2 }, methods: ['specialist', 'parallel', 'conserve'] },
    { id: 'seal', title: 'Pack and seal supplies', bay: 'stores', category: 'BIO', specialists: ['botanist', 'medic'], shifts: 2,
        description: 'Seal up the water, air tanks, and food packs for the trip.', needs: ['audit'], cost: { energy: 2, water: 1 }, methods: ['specialist', 'parallel', 'conserve', 'dry'] },
    { id: 'route', title: 'Plan the drive route', bay: 'crew', category: 'NAV', specialists: ['pilot', 'captain'], shifts: 1,
        description: 'Pick the safest path to the site and plan when to radio home.', needs: ['telemetry'], cost: { energy: 2 } },
    { id: 'suits', title: 'Check space suits', bay: 'crew', category: 'MED', specialists: ['medic', 'captain'], shifts: 1,
        description: 'Test the space suits for the two crew members going on the rover.', needs: ['route', 'seal'], cost: { energy: 2, oxygen: 1 } },
    { id: 'harden', title: 'Storm-proof the rover', bay: 'rover', category: 'ENG', specialists: ['engineer', 'pilot'], shifts: 2,
        description: 'Add dust covers and extra shielding so the rover is safe in a storm.', needs: ['drive-service'], cost: { energy: 3, res: 2 }, methods: METHODS },
    { id: 'shield', title: 'Shield the storm room', bay: 'life', category: 'ENG', specialists: ['engineer', 'medic'], shifts: 2,
        description: 'Stack water tanks and panels around the shelter to block radiation.', cost: { energy: 2, res: 2 }, methods: METHODS },
    { id: 'greens', title: 'Pick space veggies', bay: 'life', category: 'BIO', specialists: ['botanist'], shifts: 2,
        description: 'Harvest fresh veggies and plant new seeds for extra Food and O2.', cost: { energy: 3, water: 1 }, yield: { food: 22, oxygen: 5 }, methods: ['specialist', 'conserve', 'dry'] },
    { id: 'water', title: 'Clean recycled water', bay: 'life', category: 'SCI', specialists: ['scientist', 'botanist'], shifts: 2,
        description: 'Filter and clean used station water so the crew can drink it.', cost: { energy: 3 }, yield: { water: 23 }, methods: ['specialist', 'conserve'] },
    { id: 'air', title: 'Make fresh oxygen', bay: 'life', category: 'ENG', specialists: ['engineer'], shifts: 2,
        description: 'Turn clean water into breathable O2 air for the station.', cost: { energy: 3, water: 1 }, yield: { oxygen: 28 }, methods: ['specialist', 'conserve'] },
    { id: 'solar', title: 'Clean solar panels', bay: 'life', category: 'ENG', specialists: ['engineer'], shifts: 2,
        description: 'Brush dust off the solar panels so the station makes more Power.', cost: { energy: 1 }, yield: { energy: 21 }, exterior: true, methods: ['specialist', 'parallel'] },
    { id: 'spares', title: 'Gather spare parts', bay: 'stores', category: 'ENG', specialists: ['engineer', 'captain'], shifts: 2,
        description: 'Collect useful parts and wiring from old station gear.', cost: { energy: 2 }, yield: { res: 9 }, methods: ['specialist', 'conserve'] },
    { id: 'triage', title: 'Medical checkup', bay: 'life', category: 'MED', specialists: ['medic'], shifts: 1,
        description: 'Check the crew for tiredness or radiation and help them heal.', cost: { energy: 1, water: 1 }, recovery: 10 },
];

export const ORDER_BY_ID = new Map(WORK_ORDERS.map(order => [order.id, order]));
interface ChecklistGroup {
    kind: MissionRequirementKind;
    label: string;
    bay: Exclude<Bay, 'life' | 'custom'>;
    orders: readonly string[];
}

export const CHECKLIST = [
    { kind: 'prep_rover', label: 'Rover', bay: 'rover', orders: ['drive-check', 'drive-service', 'load-test'] },
    { kind: 'prep_sensor', label: 'Instruments', bay: 'instruments', orders: ['sampler', 'calibrate', 'telemetry'] },
    { kind: 'prep_supplies', label: 'Field supplies', bay: 'stores', orders: ['audit', 'seal'] },
    { kind: 'assign_crew', label: 'Field crew', bay: 'crew', orders: ['route', 'suits'] },
] as const satisfies readonly ChecklistGroup[];

// Training is short on purpose: one job per group, all done on the first Sol, so the whole
// mission (get ready, drive out, record, drive home) fits in a few Sols.
const TRAINING_CHECKLIST: readonly ChecklistGroup[] = [
    { ...CHECKLIST[0], orders: ['drive-check'] },
    { ...CHECKLIST[1], orders: ['sampler'] },
    { ...CHECKLIST[2], orders: ['audit'] },
];

export function expeditionChecklist(id: ExpeditionId): readonly ChecklistGroup[] {
    return id === 'training' ? TRAINING_CHECKLIST : CHECKLIST;
}

const trainingOrderIds = new Set(TRAINING_CHECKLIST.flatMap(group => group.orders));
const trainingOrders = WORK_ORDERS.filter(order => trainingOrderIds.has(order.id) || repeatable(order)).map(order => {
    if (order.id === 'calibrate') return { ...order, needs: ['drive-check', 'sampler'] };
    if (order.id === 'suits') return { ...order, needs: ['calibrate', 'audit'] };
    return order;
});
const trainingOrderById = new Map(trainingOrders.map(order => [order.id, order]));

export function expeditionOrders(id: ExpeditionId): readonly WorkOrder[] {
    return id === 'training' ? trainingOrders : WORK_ORDERS;
}

export function expeditionOrder(id: ExpeditionId, orderId: string): WorkOrder | undefined {
    return (id === 'training' ? trainingOrderById : ORDER_BY_ID).get(orderId);
}

export function repeatable(order: WorkOrder): boolean {
    return order.yield !== undefined || order.recovery !== undefined;
}
