import type { CrewMember, CrewRole, ResourcePool } from '../../contracts/gameContract';
import {
    BASE_RESOURCES, ENERGY_PER_SOL_ESTIMATE, FOOD_PER_CREW_PER_SOL, MIN_CREW, MIN_SUPPLY_SHARE,
    OXYGEN_MAX, OXYGEN_PER_SOL, WATER_PER_CREW_PER_SOL,
} from './balance';
import { getItem } from '../data/items';
import type { MissionOffer } from './roll';
import type { RocketGrid } from './rocketGrid';

export type SupplyKey = 'food' | 'water' | 'oxygen' | 'energy';
export type Level = 'ok' | 'warn' | 'bad';

export interface SupplyForecast {
    key: SupplyKey;
    label: string;
    /** Starting amount after the rocket is unpacked. */
    amount: number;
    /** How many sols that lasts with this crew. */
    lastsSols: number;
    missionSols: number;
    /** Launch threshold (same number the checklist uses). */
    minSols: number;
    /** Lasts the whole mission without growing or recycling more. */
    full: boolean;
    /**
     * ok = enough to launch (≥ minSols); bad = too little. Power never blocks
     * launch (it is an estimate, and solar panels recharge it), so it is warn instead of bad.
     */
    level: Level;
    /** Energy is an estimate (weather changes it); the meter says "about". */
    estimate: boolean;
}

export interface ChecklistRow {
    id: string;
    label: string;
    have: number;
    need: number;
    met: boolean;
    /** Where the player fixes it. */
    fix: 'crew' | 'pack';
}

export const SUPPLY_LABELS: Record<SupplyKey, string> = {
    food: 'Food',
    water: 'Water',
    oxygen: 'O₂',
    energy: 'Power',
};

/** Starting resources = what the outpost already has + what the rocket carries. */
export function startingResources(grid: RocketGrid): ResourcePool {
    const packed = grid.totals().resources;
    return {
        energy: BASE_RESOURCES.energy + packed.energy,
        food: BASE_RESOURCES.food + packed.food,
        water: BASE_RESOURCES.water + packed.water,
        oxygen: Math.min(OXYGEN_MAX, BASE_RESOURCES.oxygen + packed.oxygen),
        res: BASE_RESOURCES.res + packed.res,
    };
}

/** One launch threshold for meters and checklist: supplies for at least half the mission. */
export function launchMinSols(offer: MissionOffer): number {
    return Math.ceil(offer.deadlineSol * MIN_SUPPLY_SHARE);
}

export function dailyUse(key: SupplyKey, crewCount: number): number {
    const n = Math.max(1, crewCount);
    if (key === 'food') return n * FOOD_PER_CREW_PER_SOL;
    if (key === 'water') return n * WATER_PER_CREW_PER_SOL;
    if (key === 'oxygen') return OXYGEN_PER_SOL;
    return ENERGY_PER_SOL_ESTIMATE;
}

export function supplyForecasts(offer: MissionOffer, grid: RocketGrid, crewCount: number): SupplyForecast[] {
    const start = startingResources(grid);
    const missionSols = offer.deadlineSol;
    const minSols = launchMinSols(offer);
    return (['food', 'water', 'oxygen', 'energy'] as SupplyKey[]).map((key) => {
        const amount = start[key];
        const lastsSols = Math.floor(amount / dailyUse(key, crewCount));
        const enough = lastsSols >= minSols;
        const level: Level = enough ? 'ok' : key === 'energy' ? 'warn' : 'bad';
        return {
            key, label: SUPPLY_LABELS[key], amount, lastsSols, missionSols, minSols,
            full: lastsSols >= missionSols, level, estimate: key === 'energy',
        };
    });
}

/** Everything that must be true before Launch. Energy is shown but never blocks launch. */
export function checklist(offer: MissionOffer, grid: RocketGrid, crew: readonly CrewMember[]): ChecklistRow[] {
    const rows: ChecklistRow[] = [];
    rows.push({
        id: 'crew',
        label: 'Crew on board (2 to 4)',
        have: crew.length,
        need: MIN_CREW,
        met: crew.length >= MIN_CREW,
        fix: 'crew',
    });
    for (const hw of offer.mission.hardware) {
        const have = grid.count(hw.itemId);
        rows.push({ id: `hw_${hw.itemId}`, label: getItem(hw.itemId).name, have, need: hw.count, met: have >= hw.count, fix: 'pack' });
    }
    const minSols = launchMinSols(offer);
    for (const f of supplyForecasts(offer, grid, crew.length)) {
        if (f.key === 'energy') continue;
        rows.push({
            id: `supply_${f.key}`,
            label: `${f.label} for ${minSols}+ sols`,
            have: f.lastsSols,
            need: minSols,
            met: f.lastsSols >= minSols,
            fix: 'pack',
        });
    }
    return rows;
}

export function canLaunch(rows: readonly ChecklistRow[]): boolean {
    return rows.every((r) => r.met);
}

/** One sentence explaining the first thing blocking launch, for the disabled button. */
export function launchBlocker(rows: readonly ChecklistRow[]): string | null {
    const r = rows.find((x) => !x.met);
    if (!r) return null;
    if (r.id === 'crew') return `Pick ${r.need - r.have} more crew`;
    if (r.id.startsWith('hw_')) return `Pack the ${r.label}`;
    const name = r.id.replace('supply_', '');
    const label = name === 'oxygen' ? 'O₂' : name[0]!.toUpperCase() + name.slice(1);
    return `Need more ${label}`;
}

/** Roles the mission recommends that nobody on board has yet. */
export function missingRoles(recommended: readonly CrewRole[], crew: readonly CrewMember[]): CrewRole[] {
    return recommended.filter((role) => !crew.some((c) => c.role === role));
}
