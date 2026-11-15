import {
    AVAILABLE_CREW, cloneSetup, DEFAULT_MARS_SETUP, GAMEPLAY_UPGRADES,
    type CrewMember, type MissionSetupInput, type ResourcePool,
} from '../contracts/gameContract';
import { CARGO_BY_ID, normalizeCargo, packedInventory, type CargoPlacement } from './cargo';
import { EXPEDITION_RESERVES, expeditionOf, expeditionRequirements } from './expeditions';
import { nasaMissionOffers, type MissionDifficulty } from './nasaMissions';

export const LAUNCH_CREW_SIZE = 4;
const surveyBase = cloneSetup(DEFAULT_MARS_SETUP);
export const WEATHER_SURVEY: MissionSetupInput = {
    ...surveyBase,
    rules: 'tharsis-expedition',
    expedition: 'tharsis',
    targetSol: 16,
    missionGoal: {
        ...surveyBase.missionGoal,
        id: 'tharsis_weather_survey',
        title: 'Tharsis Ridge Weather Survey',
        description: 'Deploy to Site A, collect 48 consecutive hours of weather data, and return by Sol 16. Seasonal dust risk is elevated.',
        deadlineSol: 16,
        requirements: expeditionRequirements(),
        minimumReserves: { ...EXPEDITION_RESERVES },
        requiredEquipment: { windSampler: 1 },
    },
};

export const TRAINING_RUN: MissionSetupInput = {
    ...cloneSetup(WEATHER_SURVEY),
    expedition: 'training',
    targetSol: 6,
    missionGoal: {
        ...WEATHER_SURVEY.missionGoal,
        id: 'tharsis_training',
        title: 'Tharsis Training Run',
        description: 'Record 24 hours of weather at Training Marker and return to the station.',
        durationHours: 24,
        deadlineSol: 6,
        requirements: expeditionRequirements('training'),
    },
    crew: AVAILABLE_CREW.filter(member => ['captain', 'scientist', 'pilot', 'engineer'].includes(member.role))
        .map((member, index) => ({ ...member, stageAnchor: { ...surveyBase.crew[index]!.stageAnchor } })),
    startingResources: { energy: 70, food: 38, water: 42, oxygen: 46, res: 12 },
    startingConditions: { ...surveyBase.startingConditions, radiation: 8 },
    cargo: { windSampler: 1, batteryPacks: 1, waterCanisters: 1, oxygenTanks: 1, extraRations: 1, repairKits: 0, medkits: 0, seedPods: 0 },
    upgradeIds: [GAMEPLAY_UPGRADES.electrolysis],
};

export interface MissionOffer {
    title: string;
    site: string;
    description: string;
    setup?: MissionSetupInput;
    prepared?: 'team' | 'training';
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
    const training: MissionOffer = {
        title: TRAINING_RUN.missionGoal.title,
        site: 'TUTORIAL · 6 SOLS',
        description: 'Practice crew assignments, rover dispatch, and survival with a guide.',
        setup: TRAINING_RUN,
        prepared: 'training',
        image: 'assets/textures/mission_1.png',
    };
    const survey: MissionOffer = {
        title: WEATHER_SURVEY.missionGoal.title, site: 'MARS · SITE A',
        description: 'Record 48 hours of weather data at Site A.',
        setup: WEATHER_SURVEY, difficulty: 1, briefing: THARSIS_BRIEFING, image: 'assets/textures/mission_1.png',
    };
    return [
        ...(pending ? [{
            title: pending.missionGoal.title, site: pending.planet.toUpperCase() + ' · TEAM SETUP',
            description: pending.missionGoal.description, setup: pending, prepared: 'team' as const,
        }] : []),
        training,
        ...(!pending ? [survey] : []),
        ...laterMissions,
    ];
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

export function missionDeadline(setup: { targetSol: number; goal?: { deadlineSol: number }; missionGoal?: { deadlineSol: number } }): number {
    return Math.min(setup.targetSol, setup.goal?.deadlineSol ?? setup.missionGoal?.deadlineSol ?? setup.targetSol);
}

export function victoryCriteria(setup: MissionSetupInput): string {
    const reserves = resourceEntries(setup.missionGoal.minimumReserves).map(([key, amount]) => formatResource(key, amount));
    const goal = `Dock with both travelers and ${expeditionOf(setup.expedition).surveyHours}h of data by Sol ${missionDeadline(setup)}.`;
    return reserves.length ? `${goal} Keep ${reserves.join(' · ')} at the station.` : goal;
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
