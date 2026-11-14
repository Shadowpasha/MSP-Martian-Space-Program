// Mission Prep missions, shaped for Mokhtar's mission picker (src/data/missions.ts).
// Each becomes a full MissionSetupInput in the same format as his Tharsis survey:
// planet base setup, deadline, the four prep requirements, minimum reserves and
// the required mission hardware. Crew and cargo are filled in later by his flow.
import { cloneSetup, DEFAULT_MARS_SETUP, MOON_TEST_SETUP, type MissionSetupInput } from '../../contracts/gameContract';
import { getMission } from '../data/missions';
import type { PrepMission } from '../data/types';
import { travelSols } from './roll';

export interface PickerMission {
    title: string;
    /** Small caps line above the title, e.g. "MARS · JEZERO CRATER RIM". */
    site: string;
    description: string;
    /** Card picture; the Moon mission uses the lunar map instead of a Mars window. */
    image?: string;
    setup: MissionSetupInput;
}

/** Same reserve rule as the Tharsis survey, so every mission plays by one standard. */
const MINIMUM_RESERVES = { food: 10, water: 10, oxygen: 25 } as const;

export function pickerSetup(mission: PrepMission): MissionSetupInput {
    if (!mission.goalFlag) throw new Error(`Mission '${mission.id}' is not playable in the main loop yet.`);
    const site = mission.sites[0]!;
    const base = cloneSetup(mission.planet === 'moon' ? MOON_TEST_SETUP : DEFAULT_MARS_SETUP);
    // Fixed (not rolled) so the card shows a stable deadline: travel + task + the most spare time.
    const deadline = 1 + travelSols(site) + mission.taskSols + mission.slackSols[1];
    return {
        ...base,
        planet: mission.planet,
        targetSol: deadline,
        missionGoal: {
            id: `goal_${mission.id}`,
            title: mission.title,
            description: `${mission.objective} at ${site.name} by the end of Sol ${deadline}.`,
            coords: site.coords,
            durationHours: mission.durationHours,
            deadlineSol: deadline,
            requiredFlag: mission.goalFlag,
            requirements: [
                { id: 'req_sensor', label: mission.sensorLabel, kind: 'prep_sensor', current: 0, target: 1 },
                { id: 'req_rover', label: 'Prep Rover', kind: 'prep_rover', current: 0, target: 1 },
                { id: 'req_supplies', label: 'Prep Supplies (Food, O2, H2O)', kind: 'prep_supplies', current: 0, target: 4 },
                { id: 'req_crew', label: 'Assign Crew', kind: 'assign_crew', current: 0, target: 2 },
            ],
            minimumReserves: { ...MINIMUM_RESERVES },
            requiredEquipment: { windSampler: 1 },
            completed: false,
        },
    };
}

/** Ice Hunter (Mars) and Shadow Ice (Moon) for slots 2 and 3 of the picker. */
export function pickerMissions(): PickerMission[] {
    return ['ice_hunter', 'moon_shadow_ice'].map((id) => {
        const m = getMission(id);
        const site = m.sites[0]!;
        const setup = pickerSetup(m);
        return {
            title: m.title,
            site: `${m.planet === 'moon' ? 'MOON' : 'MARS'} · ${site.name.toUpperCase()}`,
            description: `${setup.missionGoal.description} Based on NASA's ${m.realBasis.mission.split(' (')[0]}.`,
            image: m.planet === 'moon' ? 'assets/textures/prep/maps/map_lunar_south_pole_320x180.png' : undefined,
            setup,
        };
    });
}
