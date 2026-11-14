export const STATION_EQUIPMENT = {
    'hydroponics-rack': {
        name: 'Hydroponics grow rack', loss: 'Disables hydroponic harvests for the rest of the mission.',
        blocks: ['greens'], maxMaterials: 10,
    },
    'auxiliary-solar': {
        name: 'Auxiliary solar string', loss: 'Reduces passive solar generation by 35% for the rest of the mission.',
        blocks: [], maxMaterials: 12,
    },
    'water-reclaimer': {
        name: 'Water reclaimer', loss: 'Disables potable water recovery jobs for the rest of the mission.',
        blocks: ['water'], maxMaterials: 10,
    },
} as const;

export type StationEquipmentId = keyof typeof STATION_EQUIPMENT;
export const EQUIPMENT_IDS = Object.keys(STATION_EQUIPMENT) as StationEquipmentId[];
