// Mission Prep (Pick Mission & Crew + Pack the Rocket) — data types.
// Pure TypeScript: nothing under src/prep/data or src/prep/logic imports 'esengine',
// so it is unit-tested with plain Node (scripts/verify-prep.mjs).
import type { CargoInventory, CrewRole, PlanetId, ResourcePool } from '../../contracts/gameContract';

export type GoalFlag = 'wind_sample_collected' | 'ice_core_collected';

export interface Source {
    label: string;
    url: string;
}

export interface MissionSite {
    id: string;
    name: string;
    /** Display coordinates, e.g. "18.47N, 77.39E". Approximate. */
    coords: string;
    /** Distance from base in movement points (MP). Game value, not real km. */
    distanceMP: number;
    /** Where the pin sits on the crater map, normalised 0..1 (x right, y down). */
    map: { x: number; y: number };
}

export type HazardId =
    | 'dust_storm'
    | 'solar_flare'
    | 'dust_on_panels'
    | 'cold_snap'
    | 'rough_terrain'
    | 'comms_blackout'
    | 'equipment_failure';

export interface PrepMission {
    id: string;
    title: string;
    planet: PlanetId;
    /** One plain-language sentence for a 7-12 year old. */
    briefing: string;
    objective: string;
    realBasis: { mission: string; fact: string; sources: Source[] };
    /** The trade-off this mission teaches. */
    lesson: string;
    difficulty: 1 | 2 | 3;
    sites: MissionSite[];
    /** Sols of work at the site. */
    taskSols: number;
    /** Random spare sols added to the deadline, [min, max]. */
    slackSols: [number, number];
    /** Contract `MissionGoal.durationHours`. */
    durationHours: number;
    /** Crew roles that make this mission easier (their perks match the goal tasks). */
    recommendedRoles: CrewRole[];
    /** Mission hardware that must be in the rocket. */
    hardware: { itemId: string; count: number }[];
    /** Label for the contract's prep_sensor requirement. */
    sensorLabel: string;
    hazards: HazardId[];
    /**
     * Goal flag the main loop understands. `null` = the main loop cannot play this
     * mission yet (see docs/CONTRACT-PROPOSAL.md); it stays hidden from the roll.
     */
    goalFlag: GoalFlag | null;
}

export type ItemCategory = 'supplies' | 'power' | 'tools' | 'mission';

export interface ItemDef {
    id: string;
    name: string;
    /** Tetris-style shape rows: 'X' filled, '.' empty. */
    shape: string[];
    category: ItemCategory;
    /** Adds to the contract's startingResources. */
    resources?: Partial<ResourcePool>;
    /** Adds to the contract's cargo counts. */
    cargo?: Partial<CargoInventory>;
    /** Plain-language line for the inspector. */
    description: string;
    /** Real NASA hardware it is based on, if any. */
    realHardware?: string;
    /** Sprite file under assets/textures/prep/items/. */
    sprite: string;
}
