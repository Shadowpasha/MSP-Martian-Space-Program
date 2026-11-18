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
    targetSol: 20,
    missionGoal: {
        ...surveyBase.missionGoal,
        id: 'tharsis_weather_survey',
        title: 'Tharsis Ridge Weather Survey',
        description: 'Drive to Site A, record 48 hours of weather data, and come back by Sol 20. Watch out for dust storms!',
        deadlineSol: 20,
        requirements: expeditionRequirements(),
        minimumReserves: { ...EXPEDITION_RESERVES },
        requiredEquipment: { windSampler: 1 },
    },
};

export const TRAINING_RUN: MissionSetupInput = {
    ...cloneSetup(WEATHER_SURVEY),
    expedition: 'training',
    targetSol: 5,
    missionGoal: {
        ...WEATHER_SURVEY.missionGoal,
        id: 'tharsis_training',
        title: 'Tharsis Training Run',
        description: 'Record 24 hours of weather at Training Marker and bring it back to the station.',
        durationHours: 24,
        deadlineSol: 5,
        requirements: expeditionRequirements('training'),
    },
    crew: AVAILABLE_CREW.filter(member => ['crew_captain', 'crew_scientist', 'crew_pilot', 'crew_engineer'].includes(member.id))
        .map((member, index) => ({ ...member, stageAnchor: { ...surveyBase.crew[index]!.stageAnchor } })),
    startingResources: { energy: 80, food: 44, water: 48, oxygen: 46, res: 14 },
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
    /** Mission art shared by the card, briefing and launch sequence. */
    image: string;
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
        site: 'TUTORIAL · 5 SOLS',
        description: 'Practice assigning crew, driving the rover, and surviving with a step-by-step guide.',
        setup: TRAINING_RUN,
        prepared: 'training',
        image: 'assets/textures/missions/previews/tharsis_training.png',
    };
    const survey: MissionOffer = {
        title: WEATHER_SURVEY.missionGoal.title, site: 'MARS · SITE A',
        description: 'Record 48 hours of weather data at Site A.',
        setup: WEATHER_SURVEY, difficulty: 1, briefing: THARSIS_BRIEFING,
        image: 'assets/textures/missions/previews/tharsis_weather_survey.png',
    };
    const infiniteSetup: MissionSetupInput = {
        ...surveyBase,
        rules: 'tharsis-expedition',
        expedition: 'infinite',
        targetSol: 999,
        missionGoal: {
            ...surveyBase.missionGoal,
            id: 'infinite_survival',
            title: 'Infinite Survival',
            description: 'Survive as many Sols as possible at Elysium Outpost through escalating storms.',
            deadlineSol: 999,
            requirements: expeditionRequirements('infinite'),
            minimumReserves: { ...EXPEDITION_RESERVES },
            requiredEquipment: { windSampler: 1 },
        },
    };
    const infiniteOffer: MissionOffer = {
        title: 'Infinite Survival',
        site: 'MARS · ENDLESS',
        description: 'Survive as many Sols as possible and post your score.',
        setup: infiniteSetup,
        difficulty: 3,
        briefing: {
            task: 'No rescue window is scheduled. Manage station life support, negotiate custom tasks, and survive escalating storm waves as long as possible.',
            basis: 'Long-duration Mars habitat endurance',
            fact: 'A conjunction-class Mars mission keeps crews on the surface for roughly 500 days before the return transfer window opens.',
            lesson: 'Endless survival rewards recycling upgrades, early hydroponics, and careful storm rationing.',
            source: 'NASA Mars Design Reference Architecture',
        },
        image: 'assets/textures/missions/previews/radiation_detective.png',
    };
    return [
        ...(pending ? [{
            title: pending.missionGoal.title, site: pending.planet.toUpperCase() + ' · TEAM SETUP',
            description: pending.missionGoal.description, setup: pending, prepared: 'team' as const,
            image: 'assets/textures/missions/previews/team_manifest.png',
        }] : []),
        training,
        ...(!pending ? [survey] : []),
        ...laterMissions,
        infiniteOffer,
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
    if (setup.expedition === 'infinite') return 'Survive as many Sols as possible at Elysium Outpost.';
    const reserves = resourceEntries(setup.missionGoal.minimumReserves).map(([key, amount]) => formatResource(key, amount));
    const goal = `Dock with both travelers and ${expeditionOf(setup.expedition).surveyHours}h of data by Sol ${missionDeadline(setup)}.`;
    return reserves.length ? `${goal} Keep ${reserves.join(' · ')} at the station.` : goal;
}

export function launchProblem(setup: MissionSetupInput): string | null {
    if (setup.crew.length !== LAUNCH_CREW_SIZE || new Set(setup.crew.map(member => member.id)).size !== LAUNCH_CREW_SIZE) {
        return 'Select exactly four crew members to launch.';
    }
    return cargoProblem(setup);
}

/** The cargo half of the launch check. Cargo Preparation uses it alone: the crew is picked afterwards, on the Launch Summary. */
export function cargoProblem(setup: MissionSetupInput): string | null {
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
    // Training is packed by the player like a real mission. If nothing was packed, its ready-made
    // cargo is used, so a first-time player can never launch the practice trip empty-handed.
    const readyMade = offer.prepared === 'team' || (offer.prepared === 'training' && placements.length === 0);
    setup.cargo = readyMade ? normalizeCargo(setup.cargo) : packedInventory(placements);
    return setup;
}

/** Edit Crew: tap a crew member to add or remove them. A fifth pick is ignored until a seat opens. */
export function toggleCrewPick(ids: readonly string[], id: string): string[] {
    if (ids.includes(id)) return ids.filter(other => other !== id);
    return ids.length >= LAUNCH_CREW_SIZE ? [...ids] : [...ids, id];
}
