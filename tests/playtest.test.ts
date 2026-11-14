import assert from 'node:assert/strict';
import test from 'node:test';
import { AVAILABLE_CREW, DEFAULT_CREW, DEFAULT_MARS_SETUP, SKILL_TREE_UPGRADES, UPGRADE_BRANCHES, computeSkillModifiers } from '../src/contracts/gameContract';
import { packedInventory, placementProblem, rotatedCells, type CargoPlacement } from '../src/data/cargo';
import { DAILY_EVENTS } from '../src/data/events';
import { buildLaunchSetup, launchProblem, missionOffers } from '../src/data/missions';
import { awardResearch, loadProfile, purchaseProblem, purchaseUpgrade } from '../src/data/profile';
import {
    advanceSol, assignCrewToTask, computeTaskEfficiency, consumeCargoDirectly, createInitialGameState, enqueueTask,
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
    // After Tharsis come Mission Prep's NASA-based missions; all six are playable.
    assert.equal(offers.length, 6);
    assert.equal(offers.filter(offer => offer.setup).length, 6);
    assert.equal(offers[0]?.setup?.missionGoal.deadlineSol, 16);
    assert.deepEqual(offers.map(offer => offer.setup?.missionGoal.requiredFlag), [
        'wind_sample_collected', 'crop_harvested', 'ice_core_collected', 'oxygen_produced', 'ice_core_collected', 'radiation_measured',
    ]);
    // Each page of three runs Easy, Medium, Hard.
    assert.deepEqual(offers.map(offer => offer.difficulty), [1, 2, 3, 1, 2, 3]);
    assert.ok(offers.every(offer => offer.briefing), 'every mission has a NASA briefing for the popup');
    const ice = buildLaunchSetup(offers[2]!, starterCrew, [sampler])!;
    assert.equal(ice.missionGoal.requiredFlag, 'ice_core_collected');
    assert.equal(launchProblem(ice), null);
    const external = missionOffers(DEFAULT_MARS_SETUP)[0]!;
    const setup = buildLaunchSetup(external, [], [])!;
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

test('crew, cargo and one paid upgrade make a keyless survey winnable', () => {
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
    resolveEvent(sim);
    const hadWater = sim.resources.water;
    assert.equal(consumeCargoDirectly(sim, 'waterCanisters').ok, true);
    assert.equal(sim.resources.water, hadWater + 14);
    assert.equal(consumeCargoDirectly(sim, 'oxygenTanks').ok, true);
    assert.equal(sim.cargo.waterCanisters, 0);
    assert.equal(sim.goal.requirements.find(req => req.kind === 'prep_supplies')?.current, 2);
    quickTask(sim, 'Prep Sensor', 'crew_engineer');
    quickTask(sim, 'Prep Rover', 'crew_medic');
    quickTask(sim, 'Prep Supplies', 'crew_botanist');
    assert.equal(advanceSol(sim).advanced, true);
    resolveEvent(sim);
    const goal = quickTask(sim, 'Gather weather data', 'crew_captain', 'crew_engineer');
    const captainEfficiency = computeTaskEfficiency(sim, goal);
    assert.equal(captainEfficiency.progressPerSol, 2);
    assert.ok(captainEfficiency.matchedPerkNames.some(name => name.includes('Field Command')));
    advanceSol(sim);
    assert.equal(sim.goal.completed, false);
    resolveEvent(sim);
    advanceSol(sim);
    assert.equal(sim.result?.outcome, 'victory');
    assert.equal(sim.result?.solReached, 3);
    const awarded = awardResearch(profile, 'fresh', sim.result!.researchPointsEarned);
    const reloaded = loadProfile(JSON.parse(JSON.stringify(awarded)), [], false);
    assert.equal(awardResearch(reloaded, 'fresh', sim.result!.researchPointsEarned), reloaded);
    assert.equal(reloaded.researchPoints, sim.result!.researchPointsEarned);
});

test('the finishing Sol checks reserves after other tasks and before expedition rewards', () => {
    for (const resupply of [false, true]) {
        const state = createInitialGameState(buildLaunchSetup(playableOffer, starterCrew, [sampler])!);
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
    const state = createInitialGameState(buildLaunchSetup(playableOffer, starterCrew, [sampler])!, ['ai_logistics']);
    const goal = quickTask(state, 'Gather weather data', 'crew_medic');
    assert.equal(goal.dailyCost.energy, 4);
    assert.equal(computeTaskEfficiency(state, goal).effectiveDailyCost.energy, 4);
    state.currentEvent = DAILY_EVENTS.find(event => event.id === 'sandstorm_wind_window')!;
    assert.equal(resolveDailyEventChoice(state, 'prep_wind_sampler').ok, true);
    assert.equal(state.cargo.windSampler, 1);
});

test('Mission Prep goals (oxygen, crops, radiation, ice) can be completed in the survival loop', () => {
    const offers = missionOffers();
    const equipment: Record<string, CargoPlacement[]> = {
        ice_core_collected: [sampler],
        oxygen_produced: [
            { id: 11, item: 'batteryPacks', x: 0, y: 0, rotation: 0 },
            { id: 12, item: 'batteryPacks', x: 0, y: 1, rotation: 0 },
        ],
        crop_harvested: [
            { id: 21, item: 'seedPods', x: 0, y: 0, rotation: 0 },
            { id: 22, item: 'seedPods', x: 1, y: 0, rotation: 0 },
            { id: 23, item: 'waterCanisters', x: 2, y: 0, rotation: 0 },
        ],
        radiation_measured: [
            { id: 31, item: 'medkits', x: 0, y: 0, rotation: 0 },
            { id: 32, item: 'medkits', x: 1, y: 0, rotation: 0 },
        ],
    };
    // Like the Tharsis win test: two packed supplies are used on Sol 1 to fill the prep-supplies units.
    const supplies: CargoPlacement[] = [
        { id: 41, item: 'waterCanisters', x: 5, y: 0, rotation: 0 },
        { id: 42, item: 'oxygenTanks', x: 3, y: 3, rotation: 0 },
    ];
    for (const offer of offers.slice(1)) {
        const flag = offer.setup!.missionGoal.requiredFlag;
        const setup = buildLaunchSetup(offer, starterCrew, [...equipment[flag]!, ...supplies])!;
        assert.equal(launchProblem(setup), null, `${offer.title} launches with its equipment`);
        assert.match(launchProblem(buildLaunchSetup(offer, starterCrew, [])!) ?? '', /Pack required equipment/, `${offer.title} needs equipment`);
        const sim = createInitialGameState(setup);
        resolveEvent(sim);
        assert.equal(consumeCargoDirectly(sim, 'waterCanisters').ok, true);
        assert.equal(consumeCargoDirectly(sim, 'oxygenTanks').ok, true);
        quickTask(sim, 'Prep Sensor', 'crew_engineer');
        quickTask(sim, 'Prep Rover', 'crew_medic');
        quickTask(sim, 'Prep Supplies', 'crew_botanist');
        assert.equal(advanceSol(sim).advanced, true);
        resolveEvent(sim);
        const goal = quickTask(sim, 'Start the mission goal expedition', 'crew_pilot', 'crew_engineer');
        assert.equal(goal.rewardOnComplete.goalFlag, flag, `${offer.title}: the goal task carries ${flag}`);
        for (let sol = 0; sol < 12 && !sim.goal.completed && sim.phase !== 'ended'; sol++) {
            if (sim.currentEvent) resolveEvent(sim);
            advanceSol(sim);
        }
        assert.equal(sim.goal.completed, true, `${offer.title}: goal completed`);
    }
});
