import assert from 'node:assert/strict';
import test from 'node:test';
import { AVAILABLE_CREW, GAMEPLAY_UPGRADES, type MissionSetupInput } from '../src/contracts/gameContract';
import { TRAINING_RUN, WEATHER_SURVEY } from '../src/data/missions';
import { loadProfile, recordResearch } from '../src/data/profile';
import { expeditionChecklist, type Technique } from '../src/data/tharsisOrders';
import { activateCrewAbility, stationShiftCapacity } from '../src/simulation/crewAbilities';
import { assessMission } from '../src/simulation/missionStatus';
import { advanceSol, continueAfterOutcome, continueAfterReport, createInitialGameState, isTharsis, previewEndSol } from '../src/simulation/solEngine';
import {
    applyForecast, defaultLoad, dispatchIssues, dispatchRover, fieldReturnEstimate, resourceForecast, stormReserve,
    toggleFieldRest, type TharsisState,
} from '../src/simulation/tharsis';
import { briefingPreview, resolveBriefing, selectBriefingPreview } from '../src/simulation/tharsisEvents';
import { activateUpgrade } from '../src/simulation/tharsisUpgrades';
import { acceptWork, assignWork, chooseFieldCrew, findOrder, quoteForLead } from '../src/simulation/tharsisWork';

function run(setup: MissionSetupInput = WEATHER_SURVEY): TharsisState {
    const state = createInitialGameState(setup, [], 0);
    assert.ok(isTharsis(state));
    return state;
}

function plan(state: TharsisState): void {
    if (state.tharsis.phase === 'report') continueAfterReport(state);
    assert.equal(resolveBriefing(state, 0), null);
    continueAfterOutcome(state);
}

function staff(state: TharsisState, id: string, lead: string, method: Technique[] = []): void {
    assert.equal(acceptWork(state, findOrder(state, id)!, method), null);
    assert.equal(assignWork(state, id, lead), null);
}

function readyRover(state: TharsisState, second = 'crew_medic'): void {
    assert.equal(chooseFieldCrew(state, 'crew_pilot'), null);
    assert.equal(chooseFieldCrew(state, second), null);
    for (const group of expeditionChecklist(state.tharsis.expedition)) {
        for (const id of group.orders) state.tharsis.completed[id] = state.sol;
    }
}

test('the Captain previews one local response with the exact committed effects', () => {
    const state = run(TRAINING_RUN);
    const initial = structuredClone(state.resources);
    assert.equal(selectBriefingPreview(state, 1), null);
    assert.match(selectBriefingPreview(state, 0)!, /one response/);
    const preview = briefingPreview(state);
    assert.deepEqual(state.resources, initial);
    assert.match(preview!.outcome[1]!, /−5 Power|-5 Power/);
    assert.equal(resolveBriefing(state, 1), null);
    assert.deepEqual(state.tharsis.outcome, preview!.outcome);
    continueAfterOutcome(state);
    readyRover(state, 'crew_engineer');
    assert.equal(dispatchRover(state, defaultLoad(state)), null);
    advanceSol(state);
    continueAfterReport(state);
    assert.equal(state.tharsis.briefing.area, 'rover');
    assert.equal(state.tharsis.previewedChoice, null);
    assert.match(selectBriefingPreview(state, 0)!, /at this briefing location/);
});

test('Double Shift works on three Sols, preserves unfinished work, and blocks the next three', () => {
    const scientist = AVAILABLE_CREW.find(member => member.role === 'scientist')!;
    const state = run({ ...WEATHER_SURVEY, crew: [scientist, ...WEATHER_SURVEY.crew.slice(0, 3)] });
    plan(state);
    assert.equal(activateCrewAbility(state, 'station', scientist.id), null);
    assert.match(activateCrewAbility(state, 'station', scientist.id)!, /Double Shift through Sol 3/);
    assert.match(chooseFieldCrew(state, scientist.id)!, /field duty on Sol 7/);
    staff(state, 'greens', scientist.id, ['conserve']);
    staff(state, 'water', scientist.id);
    assert.equal(acceptWork(state, findOrder(state, 'spares')!, []), null);
    assert.match(assignWork(state, 'spares', scientist.id)!, /slots are full/);
    assert.equal(resourceForecast(state, 'station').tasks.filter(flow => !flow.hold).length, 2);
    const projected = previewEndSol(state);
    assert.equal(state.sol, 1);
    assert.equal(projected.crew.find(member => member.id === scientist.id)!.stamina, scientist.stamina - 14);
    advanceSol(state);
    assert.deepEqual(state, projected);
    for (const sol of [2, 3]) {
        plan(state);
        assert.equal(state.sol, sol);
        assert.equal(stationShiftCapacity(state, scientist), 2);
        advanceSol(state);
    }
    const unfinished = state.tharsis.work.find(job => job.orderId === 'greens')!;
    assert.equal(unfinished.leadId, null);
    assert.equal(unfinished.progress, 2.4);
    for (const sol of [4, 5, 6]) {
        plan(state);
        assert.equal(state.sol, sol);
        assert.equal(stationShiftCapacity(state, scientist), 0);
        assert.match(assignWork(state, 'greens', scientist.id)!, /recovery through Sol 6/);
        assert.match(chooseFieldCrew(state, scientist.id)!, /Recovering/);
        advanceSol(state);
    }
    plan(state);
    assert.equal(stationShiftCapacity(state, scientist), 1);
    assert.equal(activateCrewAbility(state, 'station', scientist.id), null);
});

test('fabrication and planting pay once and the tray harvest appears in the resource forecast', () => {
    const state = run();
    plan(state);
    const before = { ...state.resources };
    const { repairKits, seedPods } = state.cargo;
    assert.equal(activateCrewAbility(state, 'station', 'crew_engineer'), null);
    assert.match(activateCrewAbility(state, 'station', 'crew_engineer')!, /Already used/);
    assert.equal(state.resources.res, before.res - 4);
    assert.equal(state.cargo.repairKits, repairKits + 1);
    assert.equal(activateCrewAbility(state, 'station', 'crew_botanist'), null);
    assert.equal(state.resources.water, before.water - 2);
    assert.equal(state.cargo.seedPods, seedPods - 1);
    for (const sol of [1, 2]) {
        assert.equal(resourceForecast(state, 'station').recovery.food, 0, `Sol ${sol}`);
        advanceSol(state);
        plan(state);
    }
    assert.equal(resourceForecast(state, 'station').recovery.food, 18);
    advanceSol(state);
    assert.match(state.lastSolReport.join(' '), /Germination Tray harvested/);
    assert.equal(state.tharsis.abilities.trayHarvestSol, null);
});

test('a local Medic restores field readiness and the Pilot overrides one storm travel hold', () => {
    const state = run();
    plan(state);
    readyRover(state);
    const load = defaultLoad(state);
    load.cargo.medkits = 1;
    assert.equal(dispatchRover(state, load), null);
    state.sol = state.tharsis.stormStart;
    applyForecast(state, state.tharsis);
    state.tharsis.rover!.conditions.radiation = 0;
    const pilot = state.crew.find(member => member.role === 'pilot')!;
    pilot.health = 31;
    pilot.morale = 9;
    state.tharsis.dutyStreak[pilot.id] = 4;
    assert.match(activateCrewAbility(state, 'station', 'crew_medic', pilot.id)!, /unavailable here/);
    assert.equal(activateCrewAbility(state, 'rover', 'crew_medic', pilot.id), null);
    assert.equal(pilot.health, 40);
    assert.equal(pilot.morale, 40);
    assert.equal(state.tharsis.dutyStreak[pilot.id], 0);
    assert.equal(state.tharsis.rover!.cargo.medkits, 0);
    const before = fieldReturnEstimate(state)!;
    const power = state.tharsis.rover!.resources.energy;
    assert.equal(activateCrewAbility(state, 'rover', pilot.id), null);
    assert.equal(state.tharsis.rover!.resources.energy, power - 4);
    assert.match(activateCrewAbility(state, 'rover', pilot.id)!, /Already used/);
    assert.ok(fieldReturnEstimate(state)! < before);
    advanceSol(state);
    assert.equal(state.tharsis.rover?.phase, 'site');
});

test('Battery Bank, Electrolysis, and Emergency Stores respect charges and stocks', () => {
    const state = run({ ...WEATHER_SURVEY, upgradeIds: Object.values(GAMEPLAY_UPGRADES) });
    plan(state);
    const before = { ...state.resources };
    assert.equal(activateUpgrade(state, { kind: 'batteryBank' }), null);
    assert.match(activateUpgrade(state, { kind: 'batteryBank' })!, /One transfer/);
    assert.equal(state.resources.energy, before.energy - 12);
    assert.equal(activateUpgrade(state, { kind: 'electrolysis' }), null);
    assert.equal(state.resources.energy, before.energy - 15);
    assert.equal(state.resources.water, before.water - 4);
    assert.equal(state.resources.oxygen, 100);
    assert.match(activateUpgrade(state, { kind: 'electrolysis' })!, /Already ran/);
    state.resources.oxygen = 3;
    const next = previewEndSol(state);
    assert.equal(next.resources.oxygen, 12);
    assert.equal(next.tharsis.upgrades.emergencyStoresUsed, true);
    assert.equal(state.tharsis.upgrades.emergencyStoresUsed, false);
    assert.equal(resourceForecast(state, 'station').recovery.oxygen, 12);
    advanceSol(state);
    plan(state);
    const power = state.resources.energy;
    assert.equal(activateUpgrade(state, { kind: 'batteryBank' }), null);
    assert.equal(state.resources.energy, power + 12);
    state.resources.oxygen = 3;
    assert.equal(previewEndSol(state).result?.outcome, 'defeat');
});

test('Microgrid supports indoor life support in shelter and Cross-Training qualifies a new lead', () => {
    const state = run({ ...WEATHER_SURVEY, upgradeIds: [GAMEPLAY_UPGRADES.microgrid, GAMEPLAY_UPGRADES.crossTraining, GAMEPLAY_UPGRADES.protectedRotation] });
    plan(state);
    state.sol = state.tharsis.stormStart;
    applyForecast(state, state.tharsis);
    state.tharsis.shelter = 'full';
    assert.equal(activateUpgrade(state, { kind: 'crossTraining', memberId: 'crew_medic', role: 'botanist' }), null);
    const medic = state.crew.find(member => member.id === 'crew_medic')!;
    assert.equal(medic.role, 'medic');
    assert.equal(quoteForLead(state, findOrder(state, 'greens')!, ['specialist'], medic).specialist, true);
    staff(state, 'greens', medic.id, ['specialist']);
    staff(state, 'solar', 'crew_engineer', ['specialist']);
    const flows = resourceForecast(state, 'station').tasks;
    assert.equal(flows[0]?.hold, undefined);
    assert.match(flows[1]?.hold ?? '', /exterior restrictions/);
    medic.morale = 76;
    state.tharsis.dutyStreak[medic.id] = 4;
    assert.equal(activateUpgrade(state, { kind: 'protectedRotation', memberId: medic.id }), null);
    assert.match(activateUpgrade(state, { kind: 'protectedRotation', memberId: medic.id })!, /already been used/);
    advanceSol(state);
    assert.equal(medic.morale, 88);
    assert.equal(state.tharsis.dutyStreak[medic.id], 0);
});

test('Weather Relay narrows load and route forecasts and the Recorder preserves exactly one lost sample', () => {
    const state = run({ ...WEATHER_SURVEY, upgradeIds: [GAMEPLAY_UPGRADES.weatherRelay, GAMEPLAY_UPGRADES.recorder] });
    plan(state);
    readyRover(state);
    state.sol = state.tharsis.stormStart - 2;
    applyForecast(state, state.tharsis);
    const load = defaultLoad(state);
    load.resources.oxygen += 10;
    load.resources.energy += 20;
    assert.equal(dispatchRover(state, load), null);
    assert.ok(fieldReturnEstimate(state)! > fieldReturnEstimate(state, false)!);
    state.tharsis.completed.harden = 1;
    assert.ok(stormReserve(state).energy > 0);
    state.sol = 1;
    applyForecast(state, state.tharsis);
    advanceSol(state);
    plan(state);
    advanceSol(state);
    plan(state);
    assert.equal(state.tharsis.hours, 24);
    assert.equal(toggleFieldRest(state), null);
    advanceSol(state);
    assert.equal(state.tharsis.hours, 24);
    assert.equal(state.tharsis.upgrades.recorderUsed, true);
    plan(state);
    assert.equal(toggleFieldRest(state), null);
    advanceSol(state);
    assert.equal(state.tharsis.hours, 0);
});

test('following the tutorial guide wins in six Sols and grants research once', () => {
    const state = run(TRAINING_RUN);
    plan(state);
    assert.equal(activateCrewAbility(state, 'station', 'crew_scientist'), null);
    staff(state, 'drive-check', 'crew_pilot', ['specialist']);
    staff(state, 'sampler', 'crew_scientist', ['specialist']);
    staff(state, 'audit', 'crew_scientist');
    assert.equal(assessMission(state, defaultLoad(state)).review, null);
    advanceSol(state);
    plan(state);
    staff(state, 'calibrate', 'crew_scientist', ['specialist']);
    assert.equal(chooseFieldCrew(state, 'crew_pilot'), null);
    assert.equal(chooseFieldCrew(state, 'crew_captain'), null);
    advanceSol(state);
    plan(state);
    staff(state, 'suits', 'crew_captain');
    const status = assessMission(state, defaultLoad(state));
    assert.equal(status.dockReserves?.oxygen, 15);
    assert.ok(status.notices.some(notice => notice.actions.some(action => action.label === 'Run electrolysis')));
    assert.equal(activateUpgrade(state, { kind: 'electrolysis' }), null);
    advanceSol(state);
    plan(state);
    const load = defaultLoad(state);
    assert.equal(dispatchRover(state, load), null);
    for (const sol of [4, 5, 6]) {
        assert.equal(state.sol, sol);
        assert.equal(assessMission(state, load).review, null);
        advanceSol(state);
        if (sol < 6) plan(state);
    }
    assert.deepEqual([state.result?.outcome, state.result?.solReached, state.result?.finalResources.oxygen], ['victory', 6, 27]);
    assert.ok(state.timeline.every(entry => entry.weather === 'Clear'));
    const result = state.result!;
    const profile = recordResearch(loadProfile(null, [], false), 'first-flight', result, true);
    assert.equal(profile.researchPoints, 6);
    const replay = { ...result };
    assert.equal(recordResearch(profile, 'second-flight', replay, true), profile);
    assert.equal(replay.researchPointsEarned, 0);
});

test('objectives expose exact load and resource gaps and review an otherwise missed deadline', () => {
    const state = run(TRAINING_RUN);
    plan(state);
    const first = assessMission(state, defaultLoad(state));
    assert.match(first.dispatch.find(issue => issue.kind === 'checks')!.message, /Inspect drivetrain/);
    assert.ok(first.review?.includes('Sol 7'));
    readyRover(state, 'crew_captain');
    const load = defaultLoad(state);
    load.resources.oxygen -= 2;
    assert.match(dispatchIssues(state, load).find(issue => issue.resource === 'oxygen')!.message, /Pack 2 more O₂/);
    state.resources.oxygen = 1;
    const before = structuredClone(state);
    const warning = assessMission(state, defaultLoad(state));
    assert.match(warning.review!, /oxygen reached zero/);
    assert.ok(warning.notices.some(notice => notice.actions.some(action => action.label === 'Use Oxygen Tank')));
    assert.deepEqual(state, before);
    advanceSol(state);
    assert.equal(state.result?.reason, warning.review);
});
