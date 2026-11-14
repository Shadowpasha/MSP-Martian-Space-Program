import assert from 'node:assert/strict';
import test from 'node:test';
import { AVAILABLE_CREW, DEFAULT_CREW, type CrewMember } from '../src/contracts/gameContract';
import { WEATHER_SURVEY } from '../src/data/missions';
import { CHECKLIST, ORDER_BY_ID, type Technique } from '../src/data/tharsisOrders';
import { advanceSol, commitBriefing, continueAfterOutcome, continueAfterReport, createInitialGameState, isTharsis } from '../src/simulation/solEngine';
import { applyForecast, defaultLoad, dispatchProblem, dispatchRover, emergencyReturn, loadSlots, resourceForecast, stormDay, tripPlan, useLocalCargo, type TharsisState } from '../src/simulation/tharsis';
import { choiceBlock, resolveBriefing, validateBriefing } from '../src/simulation/tharsisEvents';
import { acceptCustomWork, acceptWork, assignWork, chooseFieldCrew, findOrder, orderBlock, updateChecklist, workQuote } from '../src/simulation/tharsisWork';
import { awardResearch, loadProfile } from '../src/data/profile';
import { discussWork, draftSurveyBriefing } from '../src/services/tharsisAries';

function survey(seed = 0, crew: CrewMember[] = DEFAULT_CREW): TharsisState {
    const state = createInitialGameState({ ...WEATHER_SURVEY, crew }, [], seed);
    assert.ok(isTharsis(state));
    return state;
}

function plan(state: TharsisState) {
    continueAfterReport(state);
    const available = state.tharsis.briefing.choices.map((choice, index) => ({ choice, index })).filter(({ choice }) => !choiceBlock(state, choice));
    const index = available.find(({ choice }) => choice.effects.every(effect => !/loss|stress|exposure/.test(effect.id)))?.index ?? available[0]?.index ?? -1;
    assert.notEqual(index, -1);
    assert.equal(resolveBriefing(state, index), null);
    assert.equal(advanceSol(state).advanced, false);
    continueAfterOutcome(state);
}

function setDeparture(state: TharsisState, sol: number, withPilot = true) {
    plan(state);
    assert.equal(chooseFieldCrew(state, withPilot ? 'crew_pilot' : 'crew_engineer'), null);
    assert.equal(chooseFieldCrew(state, 'crew_medic'), null);
    for (const check of CHECKLIST) for (const id of check.orders) state.tharsis.completed[id] = 1;
    updateChecklist(state);
    state.sol = sol;
    applyForecast(state, state.tharsis);
}

function step(state: TharsisState) {
    assert.equal(advanceSol(state).advanced, true);
    if (!state.result) plan(state);
}

test('authored dependencies, assignment, explicit acceptance, and cargo determine work progress', () => {
    const state = survey();
    const service = ORDER_BY_ID.get('drive-service')!;
    assert.match(acceptWork(state, service, [])!, /planning/);
    assert.equal(advanceSol(state).advanced, false);
    plan(state);
    assert.match(acceptWork(state, service, [])!, /Inspect drivetrain/);
    const drive = ORDER_BY_ID.get('drive-check')!;
    assert.match(acceptWork(state, drive, ['parallel', 'specialist'])!, /one way/);
    assert.equal(acceptWork(state, drive, ['specialist']), null);
    assert.match(assignWork(state, drive.id, 'crew_medic')!, /eligible/);
    assert.equal(assignWork(state, drive.id, 'crew_pilot'), null);
    const untrained = workQuote(drive, [], state.crew.find(member => member.role === 'medic')!, state.skillModifiers);
    const specialist = workQuote(drive, ['specialist'], state.crew.find(member => member.role === 'pilot')!, state.skillModifiers);
    assert.ok(specialist.sols < untrained.sols);
    assert.equal(useLocalCargo(state, 'station', 'extraRations'), null);
    assert.equal(state.goal.requirements.find(requirement => requirement.kind === 'prep_supplies')?.current, 0);
    assert.equal(state.tharsis.completed[drive.id], undefined);
    assert.equal(advanceSol(state).advanced, true);
    assert.equal(state.tharsis.completed[drive.id], 1);
    assert.match(acceptWork(state, service, [])!, /planning/);
    plan(state);
    assert.equal(acceptWork(state, service, []), null);
    assert.match(orderBlock(state, ORDER_BY_ID.get('calibrate')!)!, /Service drive and power and Assemble Wind Sampler/);
});

test('manifest validation is atomic and changes to the travelers invalidate their suits', () => {
    const state = survey();
    setDeparture(state, 13);
    assert.equal(tripPlan(state).latest, 13);
    const load = defaultLoad(state);
    assert.equal(dispatchProblem(state, load), null);
    assert.equal(loadSlots(load), 13);
    const current = structuredClone({ resources: state.resources, cargo: state.cargo });
    load.cargo.waterCanisters = 1;
    assert.match(dispatchRover(state, load)!, /insufficient stock/);
    load.cargo.waterCanisters = 0;
    load.resources.res = 14;
    load.resources.energy = 56;
    assert.match(dispatchRover(state, load)!, /slots/);
    assert.deepEqual({ resources: state.resources, cargo: state.cargo }, current);
    assert.equal(chooseFieldCrew(state, 'crew_pilot'), null);
    assert.equal(chooseFieldCrew(state, 'crew_engineer'), null);
    assert.equal(tripPlan(state).latest, 11);
    assert.equal(state.tharsis.completed.suits, undefined);
    assert.match(dispatchRover(state, defaultLoad(state))!, /field crew checks/);
});

test('a Sol 13 departure can dock on Sol 16 and award one debrief', () => {
    const state = survey();
    setDeparture(state, 13);
    const load = defaultLoad(state);
    load.resources.energy += 2;
    load.cargo.medkits = 1;
    assert.equal(dispatchRover(state, load), null);
    assert.equal(state.cargo.windSampler, 0);
    assert.equal(state.cargo.medkits, 1);
    assert.equal(state.tharsis.rover?.resources.oxygen, 13);
    step(state);
    assert.equal(state.tharsis.rover?.phase, 'site');
    assert.equal(state.tharsis.hours, 0);
    step(state);
    assert.equal(state.tharsis.hours, 24);
    step(state);
    assert.equal(state.tharsis.hours, 48);
    assert.equal(state.tharsis.rover?.phase, 'returning');
    assert.equal(state.result, null);
    step(state);
    assert.equal(state.result?.outcome, 'victory');
    assert.equal(state.result?.solReached, 16);
    assert.equal(state.cargo.windSampler, 1);
    assert.equal(state.cargo.medkits, 2);
    assert.equal(state.tharsis.phase, 'report');
    continueAfterReport(state);
    assert.equal(state.tharsis.phase, 'debrief');
    const points = state.result!.researchPointsEarned;
    const awarded = awardResearch(loadProfile(null, [], false), 'ridge', points);
    const reloaded = loadProfile(JSON.parse(JSON.stringify(awarded)), [], false);
    assert.equal(awardResearch(reloaded, 'ridge', points), reloaded);
});

test('docking evaluates reserves after station shifts and after unloading rover stock', () => {
    for (const waterDelivered of [0, 3]) {
        const state = survey();
        setDeparture(state, 13);
        const load = defaultLoad(state);
        load.resources.water += waterDelivered;
        assert.equal(dispatchRover(state, load), null);
        for (let i = 0; i < 3; i++) step(state);
        assert.equal(state.tharsis.rover?.phase, 'returning');
        state.resources.water = 10;
        step(state);
        assert.equal(state.tharsis.rover, null);
        assert.equal(state.tharsis.returnedWithData, true);
        assert.equal(state.resources.water, 8.2 + waterDelivered);
        assert.equal(state.result?.outcome, waterDelivered ? 'victory' : 'defeat');
        if (!waterDelivered) assert.match(state.result!.reason, /below the required station reserves/);
    }
});

test('a field interruption resets 24 hours and the deadline counts the return leg', () => {
    const state = survey();
    setDeparture(state, 13);
    const load = defaultLoad(state);
    load.resources.food += 2;
    load.resources.water += 2;
    load.resources.oxygen += 3;
    load.resources.energy += 4;
    assert.equal(dispatchRover(state, load), null);
    step(state);
    step(state);
    state.tharsis.rover!.interrupted = true;
    step(state);
    assert.equal(state.tharsis.hours, 0);
    step(state);
    assert.equal(state.result?.outcome, 'defeat');
    assert.match(state.result!.reason, /still in the field/);

    const delayed = survey();
    setDeparture(delayed, 13);
    const late = defaultLoad(delayed);
    late.resources.energy += 4;
    late.resources.oxygen += 3;
    late.resources.food += 2;
    late.resources.water += 2;
    assert.equal(dispatchRover(delayed, late), null);
    delayed.tharsis.rover!.interrupted = true;
    for (let i = 0; i < 4; i++) step(delayed);
    assert.equal(delayed.tharsis.hours, 48);
    assert.equal(delayed.result?.outcome, 'defeat');
    assert.match(delayed.result!.reason, /48\/48h/);
});

test('emergency return uses travel upkeep and field decisions cannot spend station stock', () => {
    const state = survey();
    setDeparture(state, 6, false);
    assert.equal(dispatchRover(state, defaultLoad(state)), null);
    assert.match(assignWork(state, 'drive-check', 'crew_engineer')!, /Schedule/);
    step(state);
    const localBefore = state.tharsis.rover!.resources.energy;
    const stationBefore = { ...state.resources };
    const cargoBefore = { ...state.cargo };
    assert.match(useLocalCargo(state, 'rover', 'batteryPacks')!, /Out of stock/);
    assert.deepEqual(state.cargo, cargoBefore);
    assert.equal(emergencyReturn(state), null);
    assert.equal(state.tharsis.rover!.travelLeft, 1);
    step(state);
    assert.equal(state.tharsis.rover, null);
    assert.ok(state.resources.energy >= stationBefore.energy + localBefore - 4);
    assert.equal(state.goal.completed, false);
    assert.equal(state.cargo.windSampler, 1);
});

test('storm seeds create three consecutive sols and protected field operations can continue', () => {
    for (let seed = 0; seed < 3; seed++) {
        const state = survey(seed);
        const onset = 8 + seed;
        for (let sol = onset - 1; sol <= onset + 3; sol++) {
            state.sol = sol;
            applyForecast(state, state.tharsis);
            assert.equal(stormDay(state), sol >= onset && sol < onset + 3 ? sol - onset + 1 : 0);
            if (sol === onset - 1) assert.equal(state.conditions.weather, 'Dust Haze');
        }
        for (const hardened of [true, false]) {
            const trip = survey(seed);
            setDeparture(trip, onset - 2);
            if (hardened) trip.tharsis.completed.harden = 1;
            trip.tharsis.shelter = 'essential';
            const load = defaultLoad(trip);
            load.resources.oxygen += 8;
            load.resources.energy += 8;
            load.resources.food += 4;
            load.resources.water += 4;
            assert.equal(dispatchRover(trip, load), null);
            step(trip);
            step(trip);
            assert.equal(trip.tharsis.hours, 24);
            step(trip);
            assert.equal(trip.tharsis.hours, hardened ? 48 : 0);
            assert.ok(trip.tharsis.rover!.conditions.radiation > 0);
            assert.ok(trip.lastSolReport.some(line => line.includes(`Storm 1/3`)));
        }
    }
});

test('Gemini choices are validated, hidden until committed, location-scoped, and committed once', () => {
    const state = survey();
    setDeparture(state, 6);
    assert.equal(dispatchRover(state, defaultLoad(state)), null);
    assert.equal(advanceSol(state).advanced, true);
    const value = {
        title: 'Radio current test', observation: 'The current spike coincides with a radio test.', system: 'rover power',
        choices: [
            { action: 'Compare voltage traces', detail: 'Observe the connected load.', result: 'The crew identified the electrical fault.', commitment: 'none', cargo: 'none', effects: [{ id: 'none', severity: 1 }] },
            { action: 'Reboot all devices', detail: 'Cycle station relays.', result: 'The power was wasted.', commitment: 'power', cargo: 'none', effects: [{ id: 'power_loss', severity: 2 }] },
        ],
    };
    assert.equal(validateBriefing({ ...value, system: 'water reclamation' }, state), null);
    const unavailable = structuredClone(value);
    unavailable.choices[1]!.cargo = 'batteryPacks';
    assert.equal(validateBriefing(unavailable, state), null);
    unavailable.choices[1]!.cargo = 'windSampler';
    assert.equal(validateBriefing(unavailable, state), null);
    const accepted = validateBriefing(value, state)!;
    assert.ok(accepted);
    assert.equal(commitBriefing(state, state.sol - 1, accepted), false);
    assert.equal(commitBriefing(state, state.sol, accepted), true);
    assert.equal(commitBriefing(state, state.sol, accepted), false);
    assert.deepEqual(state.tharsis.outcome, []);
    continueAfterReport(state);
    const station = state.resources.energy;
    const rover = state.tharsis.rover!.resources.energy;
    assert.equal(resolveBriefing(state, 1), null);
    assert.equal(state.resources.energy, station);
    assert.equal(state.tharsis.rover!.resources.energy, rover - 8);
    assert.match(state.tharsis.outcome.join(' '), /−8 Power|-8 Power/);
    assert.match(resolveBriefing(state, 0)!, /pending/);
});

test('A.R.I.E.S. can brainstorm, draft a custom procedure, and retain conversational context', async t => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'location');
    Object.defineProperty(globalThis, 'location', { configurable: true, value: new URL('http://localhost:4173/') });
    t.after(() => previous ? Object.defineProperty(globalThis, 'location', previous) : Reflect.deleteProperty(globalThis, 'location'));
    const state = survey();
    plan(state);
    state.resources.res = 0;
    const conversation = [{ speaker: 'crew' as const, text: 'We have no materials. Is there hardware we can give up?' }];
    const task = { title: 'Strip auxiliary solar string', description: 'Isolate its feed and reclaim wiring and mounting rails.', category: 'ENG', shifts: 2,
        cost: { energy: 3 }, output: { res: 9 }, decommission: 'auxiliary-solar' };
    const answers: object[] = [
        { message: 'We can give up some solar output. How much power can you reserve for the storm?' },
        { message: 'Then the auxiliary string is a workable trade. Keep a battery in reserve.', draft: { kind: 'custom', task, leadRole: 'engineer' } },
        { message: 'A partial strip takes less time.', draft: { kind: 'custom', task: { ...task, shifts: 1, output: { res: 6 } }, leadRole: 'engineer' } },
    ];
    t.mock.method(globalThis, 'fetch', async (_url: string, options?: RequestInit) => {
        if (!options?.method) return Response.json({ model: 'test-model' });
        const body = JSON.parse(String(options.body));
        assert.equal(body.kind, 'discussion');
        assert.match(body.systemInstruction, /Brainstorm/);
        const snapshot = JSON.parse(body.input);
        assert.equal(snapshot.resources.res, 0);
        assert.equal(snapshot.recentConversation[0].text, conversation[0]!.text);
        return Response.json({ text: JSON.stringify(answers.shift()) });
    });
    const initial = await discussWork(state, null, conversation, null);
    assert.equal(initial?.draft, undefined);
    const draft = (await discussWork(state, null, conversation, null))?.draft;
    assert.equal(draft?.kind, 'custom');
    assert.equal(draft?.leadId, 'crew_engineer');
    const revised = (await discussWork(state, null, conversation, draft ?? null))?.draft;
    assert.equal(revised?.kind === 'custom' && revised.task.output.res, 6);
    assert.equal(state.tharsis.work.length, 0);
    assert.deepEqual(state.tharsis.disabledEquipment, {});
});

test('custom salvage consumes one piece of real equipment only after staffed completion', () => {
    const state = survey();
    plan(state);
    state.resources.res = 0;
    const spec = { title: 'Strip solar panel', description: 'Disconnect and strip the auxiliary solar string.', category: 'ENG', shifts: 2,
        cost: { energy: 2 }, output: { res: 8 }, decommission: 'auxiliary-solar' };
    assert.deepEqual(resourceForecast(state, 'station').passive.energy, 8);
    assert.ok('reason' in acceptCustomWork(state, { ...spec, output: { res: 90 }, goalFlag: 'wind_sample_collected' }));
    assert.ok('reason' in acceptCustomWork(state, { ...spec, decommission: 'windSampler' }));
    assert.ok('reason' in acceptCustomWork(state, { ...spec, category: 'GOAL' }));
    const first = acceptCustomWork(state, spec);
    assert.ok('id' in first);
    assert.ok('reason' in acceptCustomWork(state, { ...spec, title: 'Strip it again' }));
    const second = acceptCustomWork(state, { ...spec, shifts: 3, output: { res: 9 } }, first.id);
    assert.deepEqual(first, second);
    assert.equal(state.tharsis.work.length, 1);
    assert.equal(assignWork(state, first.id, 'crew_engineer'), null);
    const before = structuredClone(state.resources);
    const preview = resourceForecast(state, 'station');
    assert.equal(preview.tasks[0]?.remaining, 2);
    assert.deepEqual(state.resources, before);
    step(state);
    assert.equal(state.tharsis.disabledEquipment['auxiliary-solar'], undefined);
    assert.ok('reason' in acceptCustomWork(state, spec, first.id));
    step(state);
    assert.equal(state.tharsis.disabledEquipment['auxiliary-solar'], true);
    assert.ok(state.resources.res > 0);
    assert.equal(state.tharsis.work.length, 0);
    assert.equal(state.cargo.windSampler, 1);
    assert.equal(state.goal.requirements.every(requirement => requirement.current === 0), true);
    assert.equal(resourceForecast(state, 'station').passive.energy, 5.2);
});

test('consecutive shifts lower individual Morale and a rest Sol restores it', () => {
    const state = survey();
    plan(state);
    const member = state.crew.find(crew => crew.role === 'engineer')!;
    const greens = findOrder(state, 'greens')!;
    member.morale = 47;
    const air = findOrder(state, 'air')!;
    const work = () => { assert.equal(acceptWork(state, air, ['specialist']), null); assert.equal(assignWork(state, air.id, member.id), null); step(state); };
    work();
    assert.equal(state.tharsis.dutyStreak[member.id], 1);
    work();
    assert.equal(state.tharsis.dutyStreak[member.id], 2);
    assert.equal(member.morale, 45);
    work();
    assert.equal(member.morale, 41);
    const low = workQuote(greens, [], member, state.skillModifiers).rate;
    assert.equal(advanceSol(state).advanced, true);
    assert.equal(state.tharsis.dutyStreak[member.id], 0);
    assert.equal(member.morale, 48);
    assert.ok(workQuote(greens, [], member, state.skillModifiers).rate > low);
    assert.match(state.lastSolReport.join(' '), /Kalpana \+7 \(rest\)/);
});

test('a live briefing can accompany authored storm warnings without replacing the storm', async t => {
    const previous = Object.getOwnPropertyDescriptor(globalThis, 'location');
    Object.defineProperty(globalThis, 'location', { configurable: true, value: new URL('http://localhost:4173/') });
    t.after(() => previous ? Object.defineProperty(globalThis, 'location', previous) : Reflect.deleteProperty(globalThis, 'location'));
    const state = survey();
    setDeparture(state, 7);
    assert.equal(advanceSol(state).advanced, true);
    assert.equal(state.tharsis.briefing.system, 'storm');
    t.mock.method(globalThis, 'fetch', async (_url: string, options?: RequestInit) => {
        if (!options?.method) return Response.json({ model: 'test-model' });
        const body = JSON.parse(String(options.body));
        const snapshot = JSON.parse(body.input);
        assert.equal(body.kind, 'briefing');
        assert.equal(snapshot.area, 'station');
        assert.equal(snapshot.lastSol, 7);
        assert.equal(snapshot.stormDay, 1);
        return Response.json({ text: JSON.stringify({ title: 'Bus fault', observation: 'One solar branch draws current with the relay off.', system: 'solar power', choices: [
            { action: 'Isolate branch', detail: 'Open the local breaker.', result: 'The fault stopped drawing power.', commitment: 'none', cargo: 'none', effects: [{ id: 'power_saved', severity: 1 }] },
            { action: 'Retry the inverter', detail: 'Run the same startup sequence.', result: 'The faulty branch consumed reserves.', commitment: 'power', cargo: 'none', effects: [{ id: 'power_loss', severity: 1 }] },
        ] }) });
    });
    const generated = await draftSurveyBriefing(state);
    assert.ok(generated);
    assert.equal(commitBriefing(state, 8, generated), true);
    assert.equal(state.tharsis.stormBriefing?.title, 'Regional dust storm');
    assert.equal(state.tharsis.briefing.source, 'Gemini');
    assert.equal(stormDay(state), 1);
});

const route = ['drive-check', 'drive-service', 'sampler', 'calibrate', 'audit', 'load-test', 'telemetry', 'seal', 'route', 'suits'];

function runSurvey(crew: CrewMember[], seed: number, strategy: 'prepared' | 'careful' | 'unprepared') {
    const state = survey(seed, crew);
    const run = state.tharsis;
    const pilot = state.crew.find(member => member.role === 'pilot');
    const first = pilot ?? state.crew.find(member => member.role === 'captain') ?? state.crew[0]!;
    const second = state.crew.find(member => member !== first && member.role === 'medic') ?? state.crew.find(member => member !== first)!;
    state.cargo = { windSampler: 1, repairKits: 1, medkits: 0, seedPods: 2, extraRations: 2, batteryPacks: 1, waterCanisters: 3, oxygenTanks: 1 };
    plan(state);
    chooseFieldCrew(state, first.id);
    chooseFieldCrew(state, second.id);
    while (!state.result) {
        run.shelter = strategy !== 'unprepared' && (state.conditions.weather === 'Dust Haze' || stormDay(state) > 0) ? 'essential' : 'off';
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
        const marked = new Set(run.work.flatMap(job => job.leadId ? [job.leadId] : []));
        const urgent = [...route];
        if (state.resources.oxygen < 42) urgent.unshift('air');
        if (state.resources.food < 24) urgent.unshift('greens');
        if (state.resources.water < 22) urgent.unshift('water');
        if (state.resources.res < 6 && !run.rover) urgent.unshift('spares');
        if (strategy !== 'unprepared' && state.sol < 10) urgent.splice(1, 0, 'harden', 'shield');
        for (const id of urgent) {
            const order = ORDER_BY_ID.get(id)!;
            if (orderBlock(state, order)) continue;
            const available = state.crew.filter(member => !marked.has(member.id) && !run.rover?.crewIds.includes(member.id));
            const specialist = available.find(member => order.specialists.includes(member.role));
            const lead = specialist ?? available[0];
            if (!lead) continue;
            const optimize = strategy !== 'careful' || ['drive-check', 'harden'].includes(id);
            const method: Technique[] = optimize && order.methods?.length ? specialist && order.methods.includes('specialist') ? ['specialist'] : order.methods.includes('parallel') ? ['parallel'] : [] : [];
            if (acceptWork(state, order, method) === null && assignWork(state, id, lead.id) === null) marked.add(lead.id);
        }
        if (!run.rover && !run.returnedWithData) {
            const load = defaultLoad(state);
            if (strategy !== 'unprepared' && run.completed.harden && state.sol <= run.stormStart + 2) {
                load.resources.oxygen += 6;
                load.resources.energy += 6;
            }
            dispatchRover(state, load);
        }
        step(state);
    }
    return state;
}

test('fresh profiles finish near the deadline, with viable routes for all four-person rosters', () => {
    for (let seed = 0; seed < 3; seed++) {
        const prepared = runSurvey(DEFAULT_CREW, seed, 'prepared');
        const careful = runSurvey(DEFAULT_CREW, seed, 'careful');
        const unprepared = runSurvey(DEFAULT_CREW, seed, 'unprepared');
        assert.equal(prepared.result?.outcome, 'victory', `Prepared seed ${seed}: ${prepared.result?.reason}`);
        assert.ok(prepared.sol >= 12 && prepared.sol <= 14, `Prepared seed ${seed}: Sol ${prepared.sol}`);
        assert.equal(careful.result?.outcome, 'victory', `Careful seed ${seed}: ${careful.result?.reason}`);
        assert.ok(careful.sol >= 15 && careful.sol <= 16, `Careful seed ${seed}: Sol ${careful.sol}`);
        assert.equal(unprepared.result?.outcome, 'defeat');
        assert.ok(unprepared.tharsis.rover, `Unprepared seed ${seed} should reach the field and be caught by the storm.`);
    }
    for (let i = 0; i < AVAILABLE_CREW.length; i++) {
        for (let j = i + 1; j < AVAILABLE_CREW.length; j++) {
            const crew = AVAILABLE_CREW.filter((_, index) => index !== i && index !== j);
            for (let seed = 0; seed < 3; seed++) {
                const state = runSurvey(crew, seed, 'prepared');
                assert.equal(state.result?.outcome, 'victory', `${crew.map(member => member.role)} seed ${seed}: ${state.result?.reason}`);
            }
        }
    }
});
