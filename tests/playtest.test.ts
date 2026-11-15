import assert from 'node:assert/strict';
import test from 'node:test';
import { AVAILABLE_CREW, DEFAULT_CREW, DEFAULT_MARS_SETUP, GAMEPLAY_UPGRADES, SKILL_TREE_UPGRADES, UPGRADE_BRANCHES, computeSkillModifiers } from '../src/contracts/gameContract';
import { packedInventory, placementProblem, rotatedCells, type CargoPlacement } from '../src/data/cargo';
import { buildLaunchSetup, launchProblem, missionOffers } from '../src/data/missions';
import { loadProfile, purchaseProblem, purchaseUpgrade, resetUpgrades, spentResearch } from '../src/data/profile';
import { createInitialGameState, isTharsis } from '../src/simulation/solEngine';
import { hasUpgrade } from '../src/simulation/tharsisUpgrades';

const sampler: CargoPlacement = { id: 1, item: 'windSampler', x: 0, y: 0, rotation: 0 };
const drill: CargoPlacement = { id: 4, item: 'iceDrill', x: 5, y: 0, rotation: 0 };
const water: CargoPlacement = { id: 2, item: 'waterCanisters', x: 2, y: 0, rotation: 0 };
const tank: CargoPlacement = { id: 3, item: 'oxygenTanks', x: 3, y: 0, rotation: 0 };
const starterCrew = DEFAULT_CREW.map(member => member.id);
const playableOffer = missionOffers().find(offer => offer.setup?.expedition === 'tharsis')!;

test('the picker offers optional training, three expeditions, and three upcoming missions', () => {
    const offers = missionOffers();
    assert.equal(offers.length, 7);
    assert.deepEqual(offers.map(offer => offer.title), [
        'Tharsis Training Run', 'Tharsis Ridge Weather Survey', 'Radiation Detective', 'Ice Hunter', 'Shadow Ice', 'Breathe Easy', 'Space Garden',
    ]);
    const training = offers[0]!;
    const trainingSetup = buildLaunchSetup(training, [], [])!;
    assert.equal(training.prepared, 'training');
    assert.equal(trainingSetup.targetSol, 9);
    assert.equal(launchProblem(trainingSetup), null);
    assert.deepEqual(trainingSetup.upgradeIds, [GAMEPLAY_UPGRADES.electrolysis]);
    const playable = offers.slice(1).filter(offer => offer.setup);
    assert.equal(playable.length, 3);
    assert.deepEqual(playable.map(offer => offer.difficulty), [1, 2, 3]);
    assert.deepEqual(playable.map(offer => offer.setup!.expedition), ['tharsis', 'radiation', 'ice']);
    assert.ok(playable.every(offer => offer.setup!.rules === 'tharsis-expedition'));
    assert.equal(playableOffer.setup?.missionGoal.deadlineSol, 20);
    assert.ok(offers.slice(1).every(offer => offer.briefing));
    const iceOffer = playable.find(offer => offer.setup?.expedition === 'ice')!;
    const ice = buildLaunchSetup(iceOffer, starterCrew, [drill])!;
    assert.equal(launchProblem(ice), null);
    assert.match(launchProblem(buildLaunchSetup(iceOffer, starterCrew, [sampler])!)!, /Ice Drill/);
    // A team manifest without expedition rules still starts as an expedition (the Tharsis survey).
    const external = missionOffers(DEFAULT_MARS_SETUP)[0]!;
    const setup = buildLaunchSetup(external, [], [])!;
    assert.equal(setup.cargo.batteryPacks, DEFAULT_MARS_SETUP.cargo.batteryPacks);
    assert.equal(launchProblem(setup), null);
    const state = createInitialGameState(setup);
    assert.ok(isTharsis(state));
    assert.equal(state.tharsis.expedition, 'tharsis');
});

test('cargo rotations are normalized and rejected moves preserve the draft and stock', () => {
    const draft = [sampler, water, tank];
    assert.deepEqual(rotatedCells('waterCanisters', 1), [[1, 0], [0, 0]]);
    assert.deepEqual(rotatedCells('repairKits', 0), [[0, 0], [0, 1], [1, 1]]);
    assert.match(placementProblem(draft, { ...water, x: 1 })!, /occupies/);
    assert.match(placementProblem(draft, { ...tank, x: 4, y: 2 })!, /outside/);
    assert.match(placementProblem(draft, { ...sampler, id: 4, x: 4, y: 2 })!, /stock/);
    assert.equal(placementProblem(draft, { ...water, x: 2, y: 3, rotation: 1 }), null);
    assert.equal(packedInventory(draft).windSampler, 1);
    assert.equal(packedInventory(draft).waterCanisters, 1);
    assert.equal(packedInventory(draft).oxygenTanks, 1);
    assert.equal(packedInventory(draft).batteryPacks, 0);
    assert.deepEqual(draft, [sampler, water, tank]);
});

test('crew, cargo and one paid upgrade transfer into the built-in survey', () => {
    assert.equal(AVAILABLE_CREW.length, 6);
    const crewIds = [...starterCrew.filter(id => id !== 'crew_pilot'), 'crew_captain'];
    const profile = purchaseUpgrade(loadProfile(null, [], false), SKILL_TREE_UPGRADES.find(node => node.id === 'closed_o2')!);
    assert.match(launchProblem(buildLaunchSetup(playableOffer, crewIds, [])!)!, /Wind Sampler/);
    assert.match(launchProblem(buildLaunchSetup(playableOffer, crewIds.slice(0, 3), [sampler])!)!, /four crew/);
    const setup = buildLaunchSetup(playableOffer, crewIds, [sampler, water, tank])!;
    assert.equal(launchProblem(setup), null);
    setup.upgradeIds = [...profile.upgradeIds, 'greywater_reclaimer', 'greywater_reclaimer'];
    setup.skillModifiers = { ...setup.skillModifiers, waterConsumptionMult: 0.8 };
    const sim = createInitialGameState(setup);
    assert.ok(isTharsis(sim));
    assert.equal(hasUpgrade(sim, 'electrolysis'), true);
    assert.equal(sim.skillModifiers.waterConsumptionMult, 0.68);
    assert.ok(sim.crew.some(member => member.role === 'captain'));
    assert.equal(sim.crew.length, 4);
    assert.equal(sim.cargo.batteryPacks, 0);
    assert.equal(sim.cargo.waterCanisters, 1);
    assert.equal(sim.cargo.oxygenTanks, 1);
    assert.equal(sim.tharsis?.phase, 'briefing');
});

test('each upgrade branch forks and rejoins and purchases debit and unlock together', () => {
    for (const branch of UPGRADE_BRANCHES) {
        const nodes = SKILL_TREE_UPGRADES.filter(node => node.branch === branch);
        assert.deepEqual(nodes.map(node => node.tier), [1, 2, 2, 3, 3, 4]);
        assert.deepEqual(nodes.map(node => node.cost), [3, 5, 5, 7, 7, 10]);
        assert.deepEqual(nodes[5]!.prerequisites, [nodes[3]!.id, nodes[4]!.id]);
        let profile = loadProfile({ researchPoints: 37 }, [], false);
        assert.match(purchaseProblem(profile, nodes[5]!)!, /required/);
        for (const node of nodes) {
            const before = computeSkillModifiers(profile.upgradeIds);
            profile = purchaseUpgrade(profile, node);
            assert.ok(profile.upgradeIds.includes(node.id));
            if (node.tier === 2 || node.tier === 3) assert.notDeepEqual(before, computeSkillModifiers(profile.upgradeIds));
            else assert.deepEqual(before, computeSkillModifiers(profile.upgradeIds));
            assert.equal(purchaseUpgrade(profile, node), profile);
        }
        assert.equal(profile.researchPoints, 0);
    }
    const migrated = loadProfile(null, ['hydro_rationing', 'closed_o2', 'closed_o2', 'missing'], true);
    assert.deepEqual(migrated.upgradeIds, ['hydro_rationing', 'closed_o2']);
    assert.equal(migrated.researchPoints, 3);
    assert.equal(migrated.reducedMotion, true);
});

test('resetting upgrades refunds every point spent and clears the tree', () => {
    const start = { ...loadProfile(null, [], false), researchPoints: 40 };
    const tier1 = SKILL_TREE_UPGRADES.find(node => node.id === 'solar_mppt')!;
    const tier2 = SKILL_TREE_UPGRADES.find(node => node.prerequisites.includes('solar_mppt'))!;
    const bought = purchaseUpgrade(purchaseUpgrade(start, tier1), tier2);
    assert.deepEqual(bought.upgradeIds, [tier1.id, tier2.id]);
    assert.equal(spentResearch(bought), tier1.cost + tier2.cost);
    const reset = resetUpgrades(bought);
    assert.deepEqual(reset.upgradeIds, []);
    assert.equal(reset.researchPoints, 40);
    assert.equal(resetUpgrades(reset), reset, 'nothing to reset leaves the profile unchanged');
});
