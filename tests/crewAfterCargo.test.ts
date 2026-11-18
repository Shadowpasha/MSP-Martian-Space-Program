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

test('Auto Fill packs the required gear and one of each basic, around what is already packed', async () => {
    const { AUTO_FILL_BASICS, autoFillCargo, packedInventory, placementProblem } = await import('../src/data/cargo');
    const drill = { id: 7, item: 'iceDrill' as const, x: 5, y: 0, rotation: 0 as const };
    const packed = autoFillCargo([drill], { iceDrill: 1, windSampler: 1 });
    const counts = packedInventory(packed);
    assert.equal(counts.iceDrill, 1, 'the drill already packed is kept, not doubled');
    assert.equal(counts.windSampler, 1);
    for (const item of AUTO_FILL_BASICS) assert.equal(counts[item], 1, item);
    assert.deepEqual(packed[0], drill);
    // Every piece is legal and ids stay unique.
    for (const piece of packed) assert.equal(placementProblem(packed, piece), null);
    assert.equal(new Set(packed.map(piece => piece.id)).size, packed.length);
    // Running it again adds nothing.
    assert.equal(autoFillCargo(packed, { iceDrill: 1, windSampler: 1 }).length, packed.length);
});

test('Auto Fill fills every supply meter for the whole trip on each packed mission', async () => {
    const { autoFillCargo, CARGO_BY_ID } = await import('../src/data/cargo');
    const { FOOD_PER_CREW_PER_SOL, OXYGEN_PER_SOL, WATER_PER_CREW_PER_SOL } = await import('../src/data/supplyRates');
    for (const offer of missionOffers().filter(o => o.setup && !o.prepared)) {
        const setup = buildLaunchSetup(offer, ids.slice(0, LAUNCH_CREW_SIZE), [], false)!;
        // The same sums as the cargo meters (supplyLasts).
        const short = (packed: readonly { item: keyof typeof CARGO_BY_ID }[]) => (['food', 'water', 'oxygen'] as const).filter(key => {
            const amount = packed.reduce((sum, piece) => sum + (CARGO_BY_ID[piece.item].resources?.[key] ?? 0), setup.startingResources[key]);
            const perSol = key === 'food' ? 4 * FOOD_PER_CREW_PER_SOL : key === 'water' ? 4 * WATER_PER_CREW_PER_SOL : OXYGEN_PER_SOL;
            const targetSols = setup.expedition === 'infinite' ? 20 : setup.missionGoal.deadlineSol;
            return Math.floor(amount / perSol) < targetSols;
        });
        const packed = autoFillCargo([], offer.setup!.missionGoal.requiredEquipment ?? {}, short);
        assert.deepEqual(short(packed), [], offer.title);
        assert.equal(cargoProblem(buildLaunchSetup(offer, ids.slice(0, LAUNCH_CREW_SIZE), packed, false)!), null, offer.title);
    }
});
