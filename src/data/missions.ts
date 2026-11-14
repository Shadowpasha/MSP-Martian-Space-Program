import {
    AVAILABLE_CREW, cloneSetup, DEFAULT_MARS_SETUP, MOON_TEST_SETUP,
    type CrewMember, type MissionSetupInput, type ResourcePool,
} from '../contracts/gameContract';
import { CARGO_BY_ID, normalizeCargo, packedInventory, type CargoPlacement } from './cargo';

export const LAUNCH_CREW_SIZE = 4;
const surveyBase = cloneSetup(DEFAULT_MARS_SETUP);
export const WEATHER_SURVEY: MissionSetupInput = {
    ...surveyBase,
    targetSol: 16,
    missionGoal: {
        ...surveyBase.missionGoal,
        id: 'tharsis_weather_survey',
        title: 'Tharsis Ridge Weather Survey',
        description: 'Collect 48 hours of weather data at Site A, Tharsis Ridge, by the end of Sol 16.',
        deadlineSol: 16,
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
}

const laterMissions: MissionOffer[] = [
    { title: 'Polar Ice Recon', site: 'PLANUM BOREUM', description: 'Survey water-ice deposits near the polar cap.' },
    { title: 'Crater Relay', site: 'GALE CRATER', description: 'Recover a remote communications relay.' },
];

export function missionOffers(pending?: MissionSetupInput): MissionOffer[] {
    const mission = pending ?? WEATHER_SURVEY;
    return [
        {
            title: mission.missionGoal.title,
            site: pending ? mission.planet.toUpperCase() + ' · TEAM MANIFEST' : 'MARS · SITE A',
            description: mission.missionGoal.description,
            setup: mission,
            prepared: pending ? 'team' : undefined,
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
