import assert from 'node:assert/strict';
import test from 'node:test';
import { AVAILABLE_CREW, DEFAULT_CREW, DEFAULT_MARS_SETUP, SKILL_TREE_UPGRADES, UPGRADE_BRANCHES, computeSkillModifiers } from '../src/contracts/gameContract';
import { packedInventory, placementProblem, rotatedCells, type CargoPlacement } from '../src/data/cargo';
import { DAILY_EVENTS } from '../src/data/events';
import { buildLaunchSetup, launchProblem, missionOffers } from '../src/data/missions';
import { loadProfile, purchaseProblem, purchaseUpgrade } from '../src/data/profile';
import {
    advanceSol, assignCrewToTask, computeTaskEfficiency, createInitialGameState, enqueueTask,
    isChoiceAvailable, resolveDailyEventChoice, type OutpostGameState,
} from '../src/simulation/solEngine';
import { evaluatePlanOffline } from '../src/services/geminiPlanner';

const sampler: CargoPlacement = { id: 1, item: 'windSampler', x: 0, y: 0, rotation: 0 };
const water: CargoPlacement = { id: 2, item: 'waterCanisters', x: 2, y: 0, rotation: 0 };
const tank: CargoPlacement = { id: 3, item: 'oxygenTanks', x: 3, y: 0, rotation: 0 };
const starterCrew = DEFAULT_CREW.map(member => member.id);
const playableOffer = missionOffers()[0]!;

function resolveEvent(state: OutpostGameState): void {
    const choice = state.currentEvent?.choices.find(option => isChoiceAvailable(state, option).ok);
    assert.ok(choice);
    assert.equal(resolveDailyEventChoice(state, choice.id).ok, true);
}

function quickTask(state: OutpostGameState, plan: string, ...crew: string[]) {
    const proposal = evaluatePlanOffline(plan, state);
    const task = enqueueTask(state, proposal.task);
    crew.forEach(id => assignCrewToTask(state, id, task.id));
    return task;
}

test('mission offers expose one contract and honor a prepared external manifest', () => {
    const offers = missionOffers();
    assert.equal(offers.length, 3);
    assert.equal(offers.filter(offer => offer.setup).length, 1);
    assert.equal(offers[0]?.setup?.missionGoal.deadlineSol, 16);
    assert.equal(offers[0]?.setup?.rules, 'tharsis-expedition');
    assert.equal(buildLaunchSetup(offers[1]!, starterCrew, []), null);
    const external = missionOffers(DEFAULT_MARS_SETUP)[0]!;
    const setup = buildLaunchSetup(external, [], [])!;
    assert.equal(setup.rules, undefined);
    assert.equal(setup.cargo.batteryPacks, DEFAULT_MARS_SETUP.cargo.batteryPacks);
    assert.equal(setup.cargo.waterCanisters, 0);
    assert.equal(launchProblem(setup), null);
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
    setup.skillModifiers = computeSkillModifiers(profile.upgradeIds);
    const sim = createInitialGameState(setup);
    assert.equal(sim.skillModifiers.oxygenConsumptionMult, 0.75);
    assert.ok(sim.crew.some(member => member.role === 'captain'));
    assert.equal(sim.crew.length, 4);
    assert.equal(sim.cargo.batteryPacks, 0);
    assert.equal(sim.cargo.waterCanisters, 1);
    assert.equal(sim.cargo.oxygenTanks, 1);
    assert.equal(sim.tharsis?.phase, 'briefing');
});

test('the finishing Sol checks reserves after other tasks and before expedition rewards', () => {
    for (const resupply of [false, true]) {
        const setup = buildLaunchSetup(playableOffer, starterCrew, [sampler])!;
        delete setup.rules;
        const state = createInitialGameState(setup);
        for (const req of state.goal.requirements) if (req.kind !== 'assign_crew') req.current = req.target;
        resolveEvent(state);
        state.sol = 15;
        const goal = quickTask(state, 'Gather weather data', 'crew_pilot', 'crew_medic');
        advanceSol(state);
        assert.equal(state.sol, 16);
        assert.equal(goal.staffedSols, 1);
        resolveEvent(state);
        state.resources = { energy: 100, food: 50, water: 12, oxygen: 80, res: 30 };
        if (resupply) {
            const support = enqueueTask(state, {
                title: 'Distribute Water', description: 'Top up reserves.', category: 'SCI', durationSols: 1,
                upfrontCost: {}, dailyCost: {}, rewardOnComplete: { resources: { water: 2 } },
                recommendedRole: 'engineer', riskNote: '',
            });
            assignCrewToTask(state, 'crew_engineer', support.id);
        }
        advanceSol(state);
        assert.equal(state.result?.outcome, resupply ? 'victory' : 'defeat');
        assert.equal(state.result?.solReached, 16);
        if (!resupply) {
            assert.ok(state.lastSolReport.some(line => line.includes('8.4 Water / 10 Water')));
            assert.equal(state.resources.water, 8.4);
        }
    }
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
            assert.notDeepEqual(before, computeSkillModifiers(profile.upgradeIds));
            assert.equal(purchaseUpgrade(profile, node), profile);
        }
        assert.equal(profile.researchPoints, 0);
    }
    const migrated = loadProfile(null, ['hydro_rationing', 'closed_o2', 'closed_o2', 'missing'], true);
    assert.deepEqual(migrated.upgradeIds, ['hydro_rationing', 'closed_o2']);
    assert.equal(migrated.researchPoints, 3);
    assert.equal(migrated.reducedMotion, true);
});

test('the AI cost discount applies once and the storm event retains required hardware', () => {
    const setup = buildLaunchSetup(playableOffer, starterCrew, [sampler])!;
    delete setup.rules;
    const state = createInitialGameState(setup, ['ai_logistics']);
    const goal = quickTask(state, 'Gather weather data', 'crew_medic');
    assert.equal(goal.dailyCost.energy, 4);
    assert.equal(computeTaskEfficiency(state, goal).effectiveDailyCost.energy, 4);
    state.currentEvent = DAILY_EVENTS.find(event => event.id === 'sandstorm_wind_window')!;
    assert.equal(resolveDailyEventChoice(state, 'prep_wind_sampler').ok, true);
    assert.equal(state.cargo.windSampler, 1);
});
