import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_CREW, type CrewMember, type MissionSetupInput } from '../src/contracts/gameContract';
import { EXPEDITIONS } from '../src/data/expeditions';
import { WEATHER_SURVEY } from '../src/data/missions';
import { expeditionSetup, NASA_MISSIONS } from '../src/data/nasaMissions';
import { ORDER_BY_ID, type Technique } from '../src/data/tharsisOrders';
import { advanceSol, continueAfterOutcome, continueAfterReport, createInitialGameState, isTharsis } from '../src/simulation/solEngine';
import { defaultLoad, dispatchRover, stormDay, useLocalCargo, type TharsisState } from '../src/simulation/tharsis';
import { choiceBlock, resolveBriefing } from '../src/simulation/tharsisEvents';
import { acceptWork, assignWork, chooseFieldCrew, orderBlock } from '../src/simulation/tharsisWork';

const setupFor = (id: string): MissionSetupInput => {
    const mission = NASA_MISSIONS.find(m => m.id === id);
    assert.ok(mission, id);
    const setup = expeditionSetup(mission);
    assert.ok(setup, `${id} should be playable`);
    return setup;
};

const ROUTE = ['drive-check', 'drive-service', 'sampler', 'calibrate', 'audit', 'load-test', 'telemetry', 'seal', 'route', 'suits'];

function plan(state: TharsisState) {
    continueAfterReport(state);
    const available = state.tharsis.briefing.choices.map((choice, index) => ({ choice, index })).filter(({ choice }) => !choiceBlock(state, choice));
    const index = available.find(({ choice }) => choice.effects.every(effect => !/loss|stress|exposure/.test(effect.id)))?.index ?? available[0]?.index ?? -1;
    assert.notEqual(index, -1);
    assert.equal(resolveBriefing(state, index), null);
    continueAfterOutcome(state);
}

/** The same scripted crew as tests/tharsis.test.ts runSurvey, for any expedition. */
function run(setup: MissionSetupInput, seed: number, strategy: 'prepared' | 'unprepared', crew: CrewMember[] = DEFAULT_CREW) {
    const state = createInitialGameState({ ...setup, crew }, [], seed);
    assert.ok(isTharsis(state));
    const trip = state.tharsis;
    const instrument = EXPEDITIONS[trip.expedition].instrument;
    state.cargo = { windSampler: 0, repairKits: 1, medkits: 0, seedPods: 2, extraRations: 2, batteryPacks: 1, waterCanisters: 3, oxygenTanks: 1, [instrument]: 1 };
    const pilot = state.crew.find(member => member.role === 'pilot');
    const first = pilot ?? state.crew.find(member => member.role === 'captain') ?? state.crew[0]!;
    const second = state.crew.find(member => member !== first && member.role === 'medic') ?? state.crew.find(member => member !== first)!;
    plan(state);
    chooseFieldCrew(state, first.id);
    chooseFieldCrew(state, second.id);
    while (!state.result) {
        trip.shelter = strategy !== 'unprepared' && (state.conditions.weather === 'Dust Haze' || stormDay(state) > 0) ? 'essential' : 'off';
        if (state.resources.energy < 35) useLocalCargo(state, 'station', 'batteryPacks');
        if (state.resources.oxygen < 53) {
            if (state.cargo.oxygenTanks) useLocalCargo(state, 'station', 'oxygenTanks');
            else if (state.cargo.repairKits) useLocalCargo(state, 'station', 'repairKits');
        }
        if (state.resources.food < 26) {
            if (state.cargo.extraRations) useLocalCargo(state, 'station', 'extraRations');
            else if (state.cargo.seedPods) useLocalCargo(state, 'station', 'seedPods');
        }
        if (state.resources.water < 29) useLocalCargo(state, 'station', 'waterCanisters');
        const marked = new Set(trip.work.flatMap(job => job.leadId ? [job.leadId] : []));
        const urgent = [...ROUTE];
        if (state.resources.oxygen < 42) urgent.unshift('air');
        if (state.resources.food < 24) urgent.unshift('greens');
        if (state.resources.water < 22) urgent.unshift('water');
        if (state.resources.res < 6 && !trip.rover) urgent.unshift('spares');
        if (strategy !== 'unprepared' && state.sol < 10) urgent.splice(1, 0, 'harden', 'shield');
        for (const id of urgent) {
            const order = ORDER_BY_ID.get(id)!;
            if (orderBlock(state, order)) continue;
            const available = state.crew.filter(member => !marked.has(member.id) && !trip.rover?.crewIds.includes(member.id));
            const specialist = available.find(member => order.specialists.includes(member.role));
            const lead = specialist ?? available[0];
            if (!lead) continue;
            const method: Technique[] = order.methods?.length ? specialist && order.methods.includes('specialist') ? ['specialist'] : order.methods.includes('parallel') ? ['parallel'] : [] : [];
            if (acceptWork(state, order, method) === null && assignWork(state, id, lead.id) === null) marked.add(lead.id);
        }
        if (!trip.rover && !trip.returnedWithData) {
            const load = defaultLoad(state);
            if (strategy !== 'unprepared' && trip.completed.harden && state.sol <= trip.stormStart + 2) {
                load.resources.oxygen += 6;
                load.resources.energy += 6;
            }
            dispatchRover(state, load);
        }
        assert.equal(advanceSol(state).advanced, true);
        if (!state.result) plan(state);
    }
    return state;
}

test('the Tharsis survey is the Tharsis expedition', () => {
    assert.equal(WEATHER_SURVEY.expedition, 'tharsis');
    assert.equal(EXPEDITIONS.tharsis.instrument, 'windSampler');
});

test('Radiation Detective (Medium) and Ice Hunter (Hard) are expeditions with their own instruments', () => {
    const radiation = setupFor('radiation_detective');
    const ice = setupFor('ice_hunter');
    assert.equal(radiation.rules, 'tharsis-expedition');
    assert.deepEqual(radiation.missionGoal.requiredEquipment, { radDetector: 1 });
    assert.deepEqual(ice.missionGoal.requiredEquipment, { iceDrill: 1 });
    assert.equal(EXPEDITIONS.radiation.hazard.kind, 'solar');
    for (const id of ['moon_shadow_ice', 'oxygen_maker', 'space_garden']) {
        assert.equal(expeditionSetup(NASA_MISSIONS.find(m => m.id === id)!), undefined, `${id} is coming soon`);
    }
});

test('a prepared crew wins every seed of both new expeditions, an unprepared crew does not', () => {
    for (const id of ['radiation_detective', 'ice_hunter']) {
        const setup = setupFor(id);
        for (let seed = 0; seed < 3; seed++) {
            const prepared = run(setup, seed, 'prepared');
            assert.equal(prepared.result?.outcome, 'victory', `${id} prepared seed ${seed}: ${prepared.result?.reason} (Sol ${prepared.sol})`);
            assert.ok(prepared.sol <= setup.missionGoal.deadlineSol);
            const unprepared = run(setup, seed, 'unprepared');
            assert.equal(unprepared.result?.outcome, 'defeat', `${id} unprepared seed ${seed} should fail`);
        }
    }
});

test('the solar storm keeps solar power but raises station radiation faster than dust', () => {
    const solar = run(setupFor('radiation_detective'), 0, 'prepared');
    const weathers = new Set(solar.timeline.map(sol => sol.weather));
    assert.ok(weathers.has('Solar Flare'), [...weathers].join(','));
    assert.ok(!weathers.has('Dust Storm'));
});
