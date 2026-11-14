import { FORECAST_CHANCE, OFFERS_PER_ROLL, ROVER_MP_PER_SOL } from './balance';
import { PLAYABLE_MISSIONS } from '../data/missions';
import { pick, randInt, shuffled, type Rng } from './rng';
import type { HazardId, MissionSite, PrepMission } from '../data/types';

/** A mission rolled with concrete numbers, as Mission Select shows it. */
export interface MissionOffer {
    mission: PrepMission;
    site: MissionSite;
    travelSolsOneWay: number;
    /** Sol by which the goal must be done (contract deadlineSol and targetSol). */
    deadlineSol: number;
    /** A hazard the forecast warns about, or null. */
    forecast: HazardId | null;
}

export interface RollOptions {
    /** Mission ids already completed; offered again only when nothing else is left. */
    completed?: readonly string[];
    pool?: readonly PrepMission[];
    count?: number;
}

/** Mission Select: up to N different playable missions, each with a random site, deadline and forecast. */
export function rollOffers(rng: Rng, opts: RollOptions = {}): MissionOffer[] {
    const all = opts.pool ?? PLAYABLE_MISSIONS;
    const done = new Set(opts.completed ?? []);
    const count = Math.min(opts.count ?? OFFERS_PER_ROLL, all.length);
    let pool = all.filter((m) => !done.has(m.id));
    if (pool.length < count) pool = all.slice();
    return shuffled(rng, pool).slice(0, count).map((m) => makeOffer(rng, m));
}

export function makeOffer(rng: Rng, mission: PrepMission, site: MissionSite = pick(rng, mission.sites)): MissionOffer {
    const travelSolsOneWay = travelSols(site);
    const slack = randInt(rng, mission.slackSols[0], mission.slackSols[1]);
    const forecast = mission.hazards.length > 0 && rng() < FORECAST_CHANCE ? pick(rng, mission.hazards) : null;
    return {
        mission,
        site,
        travelSolsOneWay,
        // The main loop starts on Sol 1.
        deadlineSol: 1 + travelSolsOneWay + mission.taskSols + slack,
        forecast,
    };
}

export function travelSols(site: MissionSite): number {
    return Math.max(1, Math.ceil(site.distanceMP / ROVER_MP_PER_SOL));
}
