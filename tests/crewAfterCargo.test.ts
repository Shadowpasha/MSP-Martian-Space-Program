import assert from 'node:assert/strict';
import test from 'node:test';
import { AVAILABLE_CREW } from '../src/contracts/gameContract';
import { buildLaunchSetup, cargoProblem, LAUNCH_CREW_SIZE, launchProblem, missionOffers, toggleCrewPick } from '../src/data/missions';

const ids = AVAILABLE_CREW.map(member => member.id);
const packedOffer = missionOffers().find(offer => offer.setup && !offer.prepared && Object.keys(offer.setup.missionGoal.requiredEquipment ?? {}).length === 0)
    ?? missionOffers().find(offer => offer.setup && !offer.prepared)!;

test('Edit Crew toggles picks and never seats more than four', () => {
    let picks: string[] = [];
    for (const id of ids) picks = toggleCrewPick(picks, id);
    assert.equal(picks.length, LAUNCH_CREW_SIZE);
    assert.deepEqual(picks, ids.slice(0, LAUNCH_CREW_SIZE));

    // A fifth pick is ignored; removing one opens a seat for them.
    assert.deepEqual(toggleCrewPick(picks, ids[5]!), picks);
    picks = toggleCrewPick(picks, ids[0]!);
    assert.equal(picks.includes(ids[0]!), false);
    picks = toggleCrewPick(picks, ids[5]!);
    assert.deepEqual(picks, [...ids.slice(1, LAUNCH_CREW_SIZE), ids[5]!]);
});

test('cargo preparation does not block on the crew, which is picked on the Launch Summary', () => {
    const shortCrew = buildLaunchSetup(packedOffer, ids.slice(0, 2), [], false)!;
    assert.equal(launchProblem(shortCrew), 'Select exactly four crew members to launch.');
    // Cargo only reports cargo: missing equipment, or nothing when the hold is fine.
    assert.notEqual(cargoProblem(shortCrew), launchProblem(shortCrew));
    const fullCrew = buildLaunchSetup(packedOffer, ids.slice(0, LAUNCH_CREW_SIZE), [], false)!;
    assert.equal(cargoProblem(fullCrew), launchProblem(fullCrew));
});
