import test from 'node:test';
import assert from 'node:assert/strict';
import {
    computeSkillModifiers,
    DEFAULT_MARS_SETUP,
    MOON_TEST_SETUP,
} from '../src/contracts/gameContract';
import {
    advanceSol,
    applySkillTreePresets,
    assignCrewToTask,
    computeTaskEfficiency,
    consumeCargoDirectly,
    createInitialGameState,
    enqueueTask,
    resolveDailyEventChoice,
    setRationPolicy,
} from '../src/simulation/solEngine';
import { evaluatePlanOffline } from '../src/services/geminiPlanner';

test('Sol 1 starts with empty task queue and daily event decisions never create tasks', () => {
    const state = createInitialGameState(DEFAULT_MARS_SETUP);
    assert.equal(state.sol, 1);
    assert.equal(state.tasks.length, 0);
    assert.ok(state.currentEvent !== null);
    const blocked = advanceSol(state);
    assert.equal(blocked.advanced, false);

    const res = resolveDailyEventChoice(state, state.currentEvent!.choices[0]!.id);
    assert.equal(res.ok, true);
    assert.equal(state.tasks.length, 0);
});

test('Crew perk matching gives cost discount and faster progress', () => {
    const state = createInitialGameState(DEFAULT_MARS_SETUP);
    resolveDailyEventChoice(state, state.currentEvent!.choices[0]!.id);
    const task = enqueueTask(state, {
        title: 'Repair Array',
        description: 'Fix solar wiring.',
        category: 'ENG',
        durationSols: 2,
        upfrontCost: {},
        dailyCost: { energy: 10, res: 4 },
        rewardOnComplete: { resources: { energy: 20 } },
        recommendedRole: 'engineer',
        riskNote: 'none',
    });

    assignCrewToTask(state, 'crew_engineer', task.id);
    const effEng = computeTaskEfficiency(state, task);
    assert.equal(effEng.progressPerSol, 1.5);
    assert.equal(effEng.effectiveDailyCost.energy, 7);
    assert.equal(effEng.matchedPerkNames.length, 1);

    assignCrewToTask(state, 'crew_botanist', task.id);
    const effDuo = computeTaskEfficiency(state, task);
    assert.equal(effDuo.progressPerSol, 2.2);

    assignCrewToTask(state, 'crew_engineer', null);
    const effBot = computeTaskEfficiency(state, task);
    assert.equal(effBot.progressPerSol, 1.0);
    assert.equal(effBot.effectiveDailyCost.energy, 10);
    assert.equal(effBot.matchedPerkNames.length, 0);
});

test('Skill tree modifiers reduce daily food and oxygen consumption', () => {
    const baseState = createInitialGameState(DEFAULT_MARS_SETUP, []);
    const upgradedState = createInitialGameState(DEFAULT_MARS_SETUP, ['hydro_rationing', 'closed_o2']);

    resolveDailyEventChoice(baseState, baseState.currentEvent!.choices[0]!.id);
    resolveDailyEventChoice(upgradedState, upgradedState.currentEvent!.choices[0]!.id);

    // Clear starter tasks so we compare pure daily life-support drain
    baseState.tasks = [];
    upgradedState.tasks = [];

    advanceSol(baseState);
    advanceSol(upgradedState);

    assert.ok(
        upgradedState.resources.food > baseState.resources.food,
        `Expected upgraded food (${upgradedState.resources.food}) > base (${baseState.resources.food})`,
    );
    assert.ok(
        upgradedState.resources.oxygen > baseState.resources.oxygen,
        `Expected upgraded O2 (${upgradedState.resources.oxygen}) > base (${baseState.resources.oxygen})`,
    );

    const mods = computeSkillModifiers(['hydro_rationing', 'closed_o2']);
    assert.equal(mods.foodConsumptionMult, 0.75);
    assert.equal(mods.oxygenConsumptionMult, 0.75);
});

test('Half rations saves food but lowers morale', () => {
    const fullState = createInitialGameState(DEFAULT_MARS_SETUP);
    const halfState = createInitialGameState(DEFAULT_MARS_SETUP);
    resolveDailyEventChoice(fullState, fullState.currentEvent!.choices[0]!.id);
    resolveDailyEventChoice(halfState, halfState.currentEvent!.choices[0]!.id);
    fullState.tasks = [];
    halfState.tasks = [];

    setRationPolicy(halfState, 'half');
    advanceSol(fullState);
    advanceSol(halfState);

    assert.ok(halfState.resources.food > fullState.resources.food);
    assert.ok(halfState.conditions.morale < fullState.conditions.morale);
});

test('Offline AI planner converts player plan into balanced task with Skill Tree discount', () => {
    const state = createInitialGameState(DEFAULT_MARS_SETUP);
    applySkillTreePresets(state, ['ai_logistics']);
    const res = evaluatePlanOffline('Send rover out during sandstorm to collect the wind sample', {
        planet: state.planet,
        sol: state.sol,
        targetSol: state.targetSol,
        resources: state.resources,
        conditions: state.conditions,
        cargo: state.cargo,
        crew: state.crew,
        goal: state.goal,
        skillModifiers: state.skillModifiers,
    });
    assert.equal(res.source, 'offline-fallback');
    assert.equal(res.task.category, 'GOAL');
    assert.equal(res.task.rewardOnComplete.goalFlag, 'wind_sample_collected');
    assert.equal(res.task.recommendedRole, 'pilot');
    assert.ok((res.task.dailyCost.energy ?? 0) <= 4); // discounted from 5 by 0.8
});

test('Cargo consumption updates inventory and resources cleanly', () => {
    const state = createInitialGameState(DEFAULT_MARS_SETUP);
    const beforePacks = state.cargo.batteryPacks;
    const beforeEnergy = state.resources.energy;
    const res = consumeCargoDirectly(state, 'batteryPacks');
    assert.equal(res.ok, true);
    assert.equal(state.cargo.batteryPacks, beforePacks - 1);
    assert.equal(state.resources.energy, Math.min(120, beforeEnergy + 22));
});

test('Mission requirements gate goal completion; completing all requirements + goal wins immediately', () => {
    // 1. Deadline failure check on Moon (deadline Sol 10)
    const failState = createInitialGameState(MOON_TEST_SETUP);
    failState.resources.oxygen = 100;
    failState.resources.food = 100;
    failState.resources.water = 100;
    failState.resources.energy = 100;
    while (failState.phase !== 'ended') {
        if (failState.currentEvent) {
            const avail = failState.currentEvent.choices.find((c) => !c.requiresCargo && !c.requiresRole) ?? failState.currentEvent.choices[0]!;
            resolveDailyEventChoice(failState, avail.id);
        }
        advanceSol(failState);
    }
    assert.equal(failState.result?.outcome, 'defeat');
    assert.equal(failState.result?.solReached, 10);
    assert.ok(failState.result?.lessons.length >= 1);

    // 2. Attempting the goal task before requirements are met holds completion
    const winState = createInitialGameState(MOON_TEST_SETUP, ['hydro_rationing', 'closed_o2', 'solar_mppt']);
    winState.resources = { energy: 120, food: 100, water: 100, oxygen: 120, res: 20 };
    resolveDailyEventChoice(winState, winState.currentEvent!.choices[0]!.id);
    const goalTask = enqueueTask(winState, {
        title: 'Extract Polar Ice Core',
        description: 'Complete the mission objective.',
        category: 'GOAL',
        durationSols: 1,
        upfrontCost: {},
        dailyCost: { energy: 4, oxygen: 2 },
        rewardOnComplete: { goalFlag: 'ice_core_collected', resources: { res: 5 } },
        recommendedRole: 'pilot',
    });
    assignCrewToTask(winState, 'crew_pilot', goalTask.id);
    const crewReqAfterOne = winState.goal.requirements.find((r) => r.kind === 'assign_crew');
    assert.equal(crewReqAfterOne?.current, 1);

    advanceSol(winState);
    assert.notEqual(winState.phase, 'ended');
    assert.equal(winState.goal.completed, false);

    // 3. Fulfill Prep Weather Sensor, Prep Rover, Prep Supplies, and Assign 2 Crew -> victory
    const sensorTask = enqueueTask(winState, {
        title: 'Prep Weather Sensor',
        description: 'Calibrate sensor array.',
        category: 'ENG',
        durationSols: 1,
        upfrontCost: {},
        dailyCost: { energy: 1 },
        rewardOnComplete: {},
        recommendedRole: 'engineer',
        requirementKind: 'prep_sensor',
        requirementUnits: 1,
    });
    const roverTask = enqueueTask(winState, {
        title: 'Prep Mission Rover',
        description: 'Inspect rover.',
        category: 'NAV',
        durationSols: 1,
        upfrontCost: {},
        dailyCost: { energy: 1 },
        rewardOnComplete: {},
        recommendedRole: 'pilot',
        requirementKind: 'prep_rover',
        requirementUnits: 1,
    });
    const supplyTask = enqueueTask(winState, {
        title: 'Prep Mission Supplies',
        description: 'Pack food and oxygen.',
        category: 'MED',
        durationSols: 1,
        upfrontCost: {},
        dailyCost: { energy: 1 },
        rewardOnComplete: {},
        recommendedRole: 'medic',
        requirementKind: 'prep_supplies',
        requirementUnits: 4,
    });
    assignCrewToTask(winState, 'crew_engineer', sensorTask.id);
    assignCrewToTask(winState, 'crew_pilot', roverTask.id);
    assignCrewToTask(winState, 'crew_medic', supplyTask.id);
    resolveDailyEventChoice(winState, winState.currentEvent!.choices[0]!.id);
    advanceSol(winState);

    assert.equal(winState.goal.requirements.find((r) => r.kind === 'prep_sensor')?.current, 1);
    assert.equal(winState.goal.requirements.find((r) => r.kind === 'prep_rover')?.current, 1);
    assert.equal(winState.goal.requirements.find((r) => r.kind === 'prep_supplies')?.current, 4);

    // Assign 2 crew to the awaiting goalTask -> immediate completion next Sol
    assignCrewToTask(winState, 'crew_pilot', goalTask.id);
    assignCrewToTask(winState, 'crew_botanist', goalTask.id);
    assert.equal(winState.goal.requirements.find((r) => r.kind === 'assign_crew')?.current, 2);

    resolveDailyEventChoice(winState, winState.currentEvent!.choices[0]!.id);
    advanceSol(winState);

    assert.equal(winState.phase, 'ended');
    assert.equal(winState.result?.outcome, 'victory');
    assert.equal(winState.result?.solReached, 3);
    assert.equal(winState.result?.goalCompleted, true);
    assert.ok((winState.result?.researchPointsEarned ?? 0) > 0);
});
