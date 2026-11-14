import type { ItemDef } from './types';

// Everything that fits in the rocket. Every item maps onto the team contract:
// `resources` raise MissionSetupInput.startingResources, `cargo` raises
// MissionSetupInput.cargo. Mission hardware maps to the contract's
// `windSampler` slot, which the main loop uses as "the goal hardware" for both
// wind and ice goals (see DEFAULT_MARS_SETUP / MOON_TEST_SETUP).

export const ITEMS: ItemDef[] = [
    // ---- Supplies ---------------------------------------------------------
    {
        id: 'food_crate', name: 'Food Crate', shape: ['X'], category: 'supplies',
        resources: { food: 6 }, sprite: 'item_food_crate_16.png',
        description: 'Six days of meals for one astronaut.',
    },
    {
        id: 'water_tank', name: 'Water Tank', shape: ['X', 'X'], category: 'supplies',
        resources: { water: 10 }, sprite: 'item_water_tank_16.png',
        description: 'Ten units of drinking water. Water is heavy, so it takes two slots.',
    },
    {
        id: 'o2_canister', name: 'Oxygen Canister', shape: ['X', 'X'], category: 'supplies',
        resources: { oxygen: 12 }, sprite: 'item_o2_canister_16.png',
        description: 'Adds 12% to the base air supply. Mars air is mostly carbon dioxide.',
    },
    {
        id: 'extra_rations', name: 'Emergency Rations', shape: ['X'], category: 'supplies',
        cargo: { extraRations: 1 }, sprite: 'item_rations_16.png',
        description: 'A sealed food pack you can open later when food runs low.',
    },
    {
        id: 'seed_pod', name: 'Seed Pod', shape: ['X'], category: 'supplies',
        cargo: { seedPods: 1 }, sprite: 'item_seed_pod_16.png',
        description: 'Plant it at the outpost to grow food and make oxygen.',
        realHardware: 'NASA Veggie plant pillows (Space Station)',
    },
    // ---- Power ------------------------------------------------------------
    {
        id: 'power_cell', name: 'Power Cell', shape: ['XX'], category: 'power',
        resources: { energy: 12 }, sprite: 'item_power_cell_16.png',
        description: 'Charges the outpost with 12 power on arrival.',
    },
    {
        id: 'battery_pack', name: 'Battery Pack', shape: ['XX'], category: 'power',
        cargo: { batteryPacks: 1 }, sprite: 'item_battery_pack_16.png',
        description: 'A spare battery to plug in later, like during a dust storm.',
    },
    // ---- Tools ------------------------------------------------------------
    {
        id: 'repair_kit', name: 'Repair Kit', shape: ['XX'], category: 'tools',
        cargo: { repairKits: 1 }, sprite: 'item_repair_kit_16.png',
        description: 'Fixes leaky seals and broken machines.',
    },
    {
        id: 'medkit', name: 'Medkit', shape: ['X'], category: 'tools',
        cargo: { medkits: 1 }, sprite: 'item_medkit_16.png',
        description: 'Treats injuries. Help from Earth is very far away.',
    },
    {
        id: 'materials', name: 'Materials Crate', shape: ['XX', 'XX'], category: 'tools',
        resources: { res: 6 }, sprite: 'item_materials_16.png',
        description: 'Metal, wire and panels for building and repairs.',
    },
    // ---- Mission hardware -------------------------------------------------
    {
        id: 'weather_sensor', name: 'Weather Sensor', shape: ['XXX', '.X.'], category: 'mission',
        cargo: { windSampler: 1 }, sprite: 'item_weather_sensor_16.png',
        description: 'Measures wind, temperature, pressure and dust.',
        realHardware: 'MEDA on Perseverance / REMS on Curiosity',
    },
    {
        id: 'ice_drill', name: 'Ice Core Drill', shape: ['XXXX'], category: 'mission',
        cargo: { windSampler: 1 }, sprite: 'item_ice_drill_16.png',
        description: 'Drills a long core of frozen ground to look for water ice.',
        realHardware: 'Perseverance sampling drill / RIMFAX ground radar',
    },
];

const BY_ID = new Map(ITEMS.map((i) => [i.id, i]));

export function getItem(id: string): ItemDef {
    const item = BY_ID.get(id);
    if (!item) throw new Error(`Unknown item '${id}'`);
    return item;
}
