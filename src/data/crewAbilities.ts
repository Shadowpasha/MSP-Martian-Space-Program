import type { CrewRole } from '../contracts/gameContract';

export const CREW_ABILITIES: Record<CrewRole, { name: string; description: string }> = {
    captain: { name: 'Read the Situation', description: 'Preview one response each briefing when the Captain is there.' },
    scientist: { name: 'Double Shift', description: 'Lead two station jobs per Sol for 3 Sols, then recover for 3 Sols.' },
    engineer: { name: 'Field Fabrication', description: 'Turn 4 station Materials into a Repair Kit once per mission.' },
    botanist: { name: 'Germination Tray', description: 'Plant a Seed Pod with 2 Water. Harvest 12 Food two Sols later. Once per mission.' },
    pilot: { name: 'Storm Override', description: 'Spend 4 extra rover Power to drive through one storm Sol. Once per mission.' },
    medic: { name: 'Field Triage', description: 'Use a local Medkit to raise one living member to at least 40 HP and 40 Morale and reset duty. Once per mission.' },
};
