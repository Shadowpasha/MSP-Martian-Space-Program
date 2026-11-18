import type { CrewMember, CrewRole } from '../contracts/gameContract';

export interface AbilityCopy {
    name: string;
    description: string;
    bestTime: string;
}

export const CREW_ABILITIES: Record<CrewRole, AbilityCopy> = {
    captain: {
        name: 'Read the Situation',
        description: 'Preview one response each briefing when the Captain is there.',
        bestTime: 'Best time: Before picking a news choice to see what happens first.',
    },
    scientist: {
        name: 'Double Shift',
        description: 'Lead two station jobs per Sol for 3 Sols, then recover for 3 Sols.',
        bestTime: 'Best time: Early on when you have lots of station tasks to finish.',
    },
    engineer: {
        name: 'Field Fabrication',
        description: 'Turn 4 station Materials into a Repair Kit once per mission.',
        bestTime: 'Best time: When you need an extra Repair Kit and have 4 Materials.',
    },
    botanist: {
        name: 'Germination Tray',
        description: 'Plant a Seed Pod with 2 Water. Harvest 12 Food two Sols later. Once per mission.',
        bestTime: 'Best time: When you have a Seed Pod and want extra Food in 2 days.',
    },
    pilot: {
        name: 'Storm Override',
        description: 'Spend 4 extra rover Power to drive through one storm Sol. Once per mission.',
        bestTime: 'Best time: When the rover is stuck in a dust storm.',
    },
    medic: {
        name: 'Field Triage',
        description: 'Use a local Medkit to raise one living member to at least 40 HP and 40 Morale and reset duty. Once per mission.',
        bestTime: 'Best time: When a crew member gets hurt and you have a Medkit.',
    },
};

export const CREW_UNIQUE_ABILITIES: Record<string, AbilityCopy> = {
    crew_jemison: {
        name: 'Bio-Chelation',
        description: 'Spend 2 Water and 2 Power to purge 15 Radiation and restore +10 Morale locally. Once per mission.',
        bestTime: 'Best time: After a solar flare or high-exposure shift to scrub radiation.',
    },
    crew_whitson: {
        name: 'Microgravity Synthesis',
        description: 'Spend 3 Power and 2 Materials to synthesize +12 Food and +12 O₂ at the station. Once per mission.',
        bestTime: 'Best time: When both Food and Oxygen reserves run low at the station.',
    },
    crew_aldrin: {
        name: 'Rendezvous Burn',
        description: 'Spend 4 rover Power to cut remaining rover travel by 1 Sol (min 1). Once per mission.',
        bestTime: 'Best time: While driving in the rover to beat a tight deadline.',
    },
};

export function crewAbilityFor(member: Pick<CrewMember, 'id' | 'role'>): AbilityCopy {
    return CREW_UNIQUE_ABILITIES[member.id] ?? CREW_ABILITIES[member.role];
}
