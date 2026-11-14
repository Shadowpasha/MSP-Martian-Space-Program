import {
    AVAILABLE_CREW, cloneSetup, DEFAULT_MARS_SETUP, MOON_TEST_SETUP,
    type CrewMember, type MissionSetupInput, type ResourcePool,
} from '../contracts/gameContract';
import { CARGO_BY_ID, normalizeCargo, packedInventory, type CargoPlacement } from './cargo';
import { nasaMissionOffers, type MissionDifficulty } from './nasaMissions';

export const LAUNCH_CREW_SIZE = 4;
const surveyBase = cloneSetup(DEFAULT_MARS_SETUP);
export const WEATHER_SURVEY: MissionSetupInput = {
    ...surveyBase,
    rules: 'tharsis-expedition',
    targetSol: 16,
    missionGoal: {
        ...surveyBase.missionGoal,
        id: 'tharsis_weather_survey',
        title: 'Tharsis Ridge Weather Survey',
        description: 'Deploy to Site A, collect 48 consecutive hours of weather data, and return by Sol 16. Seasonal dust risk is elevated.',
        deadlineSol: 16,
        requirements: [
            { id: 'req_rover', label: 'Rover work orders', kind: 'prep_rover', current: 0, target: 3 },
            { id: 'req_sensor', label: 'Instrument checks', kind: 'prep_sensor', current: 0, target: 3 },
            { id: 'req_supplies', label: 'Field supply checks', kind: 'prep_supplies', current: 0, target: 2 },
            { id: 'req_crew', label: 'Field crew checks', kind: 'assign_crew', current: 0, target: 2 },
        ],
        minimumReserves: { food: 10, water: 10, oxygen: 25 },
        requiredEquipment: { windSampler: 1 },
    },
};

export interface MissionOffer {
    title: string;
    site: string;
    description: string;
    setup?: MissionSetupInput;
    prepared?: 'team' | 'moon-test';
    /** Card picture; defaults to assets/textures/mission_<slot>.png. */
    image?: string;
    /** Difficulty bar on the card (1 Easy, 2 Medium, 3 Hard); a team manifest has none. */
    difficulty?: MissionDifficulty;
    /** Shown in the mission popup: the real NASA mission it is based on and why it matters. */
    briefing?: MissionBriefing;
}

export interface MissionBriefing {
    /** What the crew will do, in plain words. */
    task: string;
    /** The real NASA mission or instrument this is based on (short name, for the popup heading). */
    basis: string;
    /** A true fact from that mission. */
    fact: string;
    /** The trade-off this mission teaches. */
    lesson: string;
    /** Where the fact comes from. */
    source: string;
}

export const THARSIS_BRIEFING: MissionBriefing = {
    task: 'Set up the wind sampler on Tharsis Ridge and record 48 hours of weather so the station gets better storm warnings.',
    basis: 'the Mars weather stations REMS and MEDA',
    fact: 'In 2018 a dust storm covered all of Mars. It blocked so much sunlight that the solar-powered Opportunity rover ran out of power and never woke up again.',
    lesson: 'Dust storms block sunlight, so solar power drops. Battery packs take cargo space, but they keep the station running in the dark.',
    source: 'NASA: Opportunity rover mission comes to end (2019)',
};

// After the Tharsis survey: Mission Prep's NASA-based missions (Ice Hunter, Shadow Ice,
// Breathe Easy, Space Garden, Radiation Detective). They replace the old placeholders;
// the picker pages through them three at a time.
const laterMissions: MissionOffer[] = nasaMissionOffers();

export function missionOffers(pending?: MissionSetupInput): MissionOffer[] {
    const mission = pending ?? WEATHER_SURVEY;
    return [
        {
            title: mission.missionGoal.title,
            site: pending ? mission.planet.toUpperCase() + ' · TEAM SETUP' : 'MARS · SITE A',
            // The card line is the goal only; the deadline has its own line on the card.
            description: pending ? mission.missionGoal.description : 'Record 48 hours of weather data at Site A.',
            setup: mission,
            // The starter: one tool to pack, a nearby site and 16 sols for a 2-sol job.
            difficulty: pending ? undefined : 1,
            prepared: pending ? 'team' : undefined,
            briefing: pending ? undefined : THARSIS_BRIEFING,
        },
        ...laterMissions,
    ];
}

export function preparedMoonOffer(): MissionOffer {
    return {
        title: MOON_TEST_SETUP.missionGoal.title, site: 'MOON · TEST MISSION',
        description: MOON_TEST_SETUP.missionGoal.description, setup: MOON_TEST_SETUP, prepared: 'moon-test',
    };
}

export const RESOURCE_LABELS: Record<keyof ResourcePool, string> = {
    energy: 'Power', food: 'Food', water: 'Water', oxygen: 'O₂', res: 'Materials',
};

export function formatResource(key: keyof ResourcePool, amount: number): string {
    return `${amount}${key === 'oxygen' ? '%' : ''} ${RESOURCE_LABELS[key]}`;
}

export function resourceEntries(resources: Partial<ResourcePool> | undefined): [keyof ResourcePool, number][] {
    return Object.entries(resources ?? {}) as [keyof ResourcePool, number][];
}

export function launchProblem(setup: MissionSetupInput): string | null {
    if (setup.crew.length !== LAUNCH_CREW_SIZE || new Set(setup.crew.map(member => member.id)).size !== LAUNCH_CREW_SIZE) {
        return 'Select exactly four crew members to launch.';
    }
    const missing = Object.entries(setup.missionGoal.requiredEquipment ?? {})
        .filter(([id, count]) => (setup.cargo[id as keyof typeof setup.cargo] ?? 0) < count)
        .map(([id, count]) => `${count} × ${CARGO_BY_ID[id as keyof typeof CARGO_BY_ID].name}`);
    return missing.length ? `Pack required equipment: ${missing.join(', ')}.` : null;
}

export function buildLaunchSetup(
    offer: MissionOffer,
    crewIds: readonly string[],
    placements: readonly CargoPlacement[],
    usePreparedCrew = Boolean(offer.prepared),
): MissionSetupInput | null {
    if (!offer.setup) return null;
    const setup = cloneSetup(offer.setup);
    if (offer.prepared) delete setup.rules;
    if (!usePreparedCrew) {
        const selected = new Set(crewIds);
        const anchors = DEFAULT_MARS_SETUP.crew.map(member => member.stageAnchor);
        setup.crew = AVAILABLE_CREW.filter(member => selected.has(member.id)).map((member, index): CrewMember => ({
            ...member, perk: { ...member.perk }, stageAnchor: { ...(anchors[index] ?? member.stageAnchor) },
        }));
    }
    setup.cargo = offer.prepared ? normalizeCargo(setup.cargo) : packedInventory(placements);
    return setup;
}
