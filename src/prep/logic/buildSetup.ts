import {
    computeSkillModifiers,
    DEFAULT_MARS_SETUP,
    MOON_TEST_SETUP,
    type CrewMember,
    type MissionSetupInput,
} from '../../contracts/gameContract';
import type { MissionOffer } from './roll';
import type { RocketGrid } from './rocketGrid';
import { startingResources } from './checklist';

/**
 * The hand-off to the main loop: everything Mission Prep decided, as the team
 * contract's MissionSetupInput. Saved to Storage key STORAGE_KEYS.PENDING_SETUP.
 *
 * `requirements` keep `current: 0`: the main loop runs the prep tasks itself.
 */
export function buildSetup(
    offer: MissionOffer,
    crew: readonly CrewMember[],
    grid: RocketGrid,
    unlockedSkillIds: readonly string[] = [],
): MissionSetupInput {
    const { mission, site } = offer;
    if (!mission.goalFlag) throw new Error(`Mission '${mission.id}' is not playable in the main loop yet.`);
    const base = mission.planet === 'moon' ? MOON_TEST_SETUP : DEFAULT_MARS_SETUP;
    const deadline = offer.deadlineSol;

    return {
        planet: mission.planet,
        targetSol: deadline,
        missionGoal: {
            id: `goal_${mission.id}`,
            title: `${mission.title} (${mission.durationHours}h)`,
            description: `${mission.objective} before Sol ${deadline} at coords: ${site.coords} (${site.name}).`,
            coords: site.coords,
            durationHours: mission.durationHours,
            deadlineSol: deadline,
            requiredFlag: mission.goalFlag,
            requirements: [
                { id: 'req_sensor', label: mission.sensorLabel, kind: 'prep_sensor', current: 0, target: 1 },
                { id: 'req_rover', label: 'Prep Rover', kind: 'prep_rover', current: 0, target: 1 },
                { id: 'req_supplies', label: 'Prep Supplies (Food, O2, H2O)', kind: 'prep_supplies', current: 0, target: 4 },
                { id: 'req_crew', label: 'Assign Crew', kind: 'assign_crew', current: 0, target: Math.min(2, crew.length) },
            ],
            completed: false,
        },
        startingResources: startingResources(grid),
        startingConditions: { ...base.startingConditions },
        cargo: grid.totals().cargo,
        crew: crew.map((c) => JSON.parse(JSON.stringify(c)) as CrewMember),
        skillModifiers: computeSkillModifiers(unlockedSkillIds),
    };
}
