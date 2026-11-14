import type { ResourcePool } from '../../contracts/gameContract';

// Tuning knobs for Mission Prep. Daily-use numbers MIRROR the main loop's
// advanceSol() in src/simulation/solEngine.ts — if that changes, change these.

/** Main loop: food = crew × 1.0 per sol (full rations). */
export const FOOD_PER_CREW_PER_SOL = 1.0;
/** Main loop: water = crew × 0.9 per sol. */
export const WATER_PER_CREW_PER_SOL = 0.9;
/** Main loop: oxygen = 4.2 % per sol, flat (not per crew). */
export const OXYGEN_PER_SOL = 4.2;
/**
 * Estimate only: the main loop's energy changes with weather (+1 on a clear sol,
 * about -4.4 in a dust storm) and tasks. Used for the "lasts about N sols" meter.
 */
export const ENERGY_PER_SOL_ESTIMATE = 3;

/** What the outpost already has before the rocket's cargo is added. */
export const BASE_RESOURCES: ResourcePool = { energy: 40, food: 8, water: 8, oxygen: 40, res: 4 };
export const OXYGEN_MAX = 100;

/** Rocket cargo bay size, in cells. */
export const ROCKET_COLS = 7;
export const ROCKET_ROWS = 4;

/** Rover speed on the map, used to turn site distance into travel sols. */
export const ROVER_MP_PER_SOL = 5;

export const MIN_CREW = 2;
export const OFFERS_PER_ROLL = 3;
export const FORECAST_CHANCE = 0.6;

/**
 * A supply must last at least this share of the mission to launch. Below the
 * full trip the crew has to grow or recycle the rest in the main loop.
 */
export const MIN_SUPPLY_SHARE = 0.5;
