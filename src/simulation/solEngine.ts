// The run engine: one expedition from Sol 1 to the debrief.
//
// Every mission is an expedition (src/simulation/tharsis.ts with a profile from
// src/data/expeditions.ts): the station works through orders, two crew take the rover to the
// survey site and back, and the run ends on docking with the data, on a collapse, or at the
// deadline. The old survival loop (daily events, a task queue, the AI task planner) was removed.
import { expeditionOf } from '../data/expeditions';
import {
    cloneSetup,
    cloneValue,
    computeSkillModifiers,
    DEFAULT_MARS_SETUP,
    DEFAULT_SKILL_MODIFIERS,
    type CargoInventory,
    type ConditionState,
    type CrewMember,
    type MainLoopResult,
    type MissionGoal,
    type MissionSetupInput,
    type PlanetId,
    type RationPolicy,
    type ResourcePool,
    type SkillTreeModifiers,
    type SolSummaryRecord,
    type WeatherType,
} from '../contracts/gameContract';
import { normalizeCargo } from '../data/cargo';
import { missionDeadline } from '../data/missions';
import { appendLog } from './stateOps';
import { applyForecast, createTharsis, resolveTharsisSol, type TharsisRun, type TharsisState } from './tharsis';
import { nextBriefing, type SurveyBriefing } from './tharsisEvents';

export { applyResourceDelta, canAffordCost } from './stateOps';

export interface LogEntry {
    id: number;
    sol: number;
    kind: 'info' | 'warn' | 'good' | 'event';
    text: string;
}

export interface WeatherForecast {
    weather: WeatherType;
    temperatureC: number;
    radiationRisk: 'Low' | 'Moderate' | 'High';
}

export interface OutpostGameState {
    planet: PlanetId;
    sol: number;
    targetSol: number;
    phase: 'event' | 'planning' | 'ended';
    resources: ResourcePool;
    conditions: ConditionState;
    tomorrowForecast: WeatherForecast;
    cargo: Required<CargoInventory>;
    crew: CrewMember[];
    skillModifiers: SkillTreeModifiers;
    unlockedSkillIds: string[];
    goal: MissionGoal;
    rationPolicy: RationPolicy;
    lastEventTitle: string;
    lastEventChoiceLabel: string;
    lastEventOutcome: string | null;
    lastSolReport: string[];
    dailyLog: LogEntry[];
    timeline: SolSummaryRecord[];
    result: MainLoopResult | null;
    nextTaskSeq: number;
    nextLogSeq: number;
    halfRationSols: number;
    tasksCompletedCount: number;
    perkMatchesCount: number;
    lowEnergyCount: number;
    lowFoodCount: number;
    lowOxygenCount: number;
    tharsis?: TharsisRun;
}

export function createInitialGameState(
    inputSetup: MissionSetupInput = DEFAULT_MARS_SETUP,
    unlockedSkillIds: readonly string[] = [],
    seed = Math.floor(Math.random() * 0x100000000),
): OutpostGameState {
    const setup = cloneSetup(inputSetup);
    const upgradeIds = [...new Set([...(Array.isArray(setup.upgradeIds) ? setup.upgradeIds : []), ...unlockedSkillIds])];
    const skillModifiers = computeSkillModifiers(upgradeIds, { ...DEFAULT_SKILL_MODIFIERS, ...setup.skillModifiers });

    const state: OutpostGameState = {
        planet: setup.planet,
        sol: 1,
        targetSol: setup.targetSol,
        phase: 'event',
        resources: { ...setup.startingResources },
        conditions: { ...setup.startingConditions },
        // Replaced by the expedition's own forecast below.
        tomorrowForecast: { weather: 'Clear', temperatureC: setup.startingConditions.temperatureC, radiationRisk: 'Low' },
        cargo: normalizeCargo(setup.cargo),
        crew: setup.crew.map((c) => ({ ...c, perk: { ...c.perk }, stageAnchor: { ...c.stageAnchor } })),
        skillModifiers,
        unlockedSkillIds: upgradeIds,
        goal: {
            ...setup.missionGoal,
            requirements: (setup.missionGoal.requirements ?? []).map((r) => ({ ...r })),
        },
        rationPolicy: 'full',
        lastEventTitle: '',
        lastEventChoiceLabel: 'Pending',
        lastEventOutcome: null,
        lastSolReport: [
            `Touchdown on ${setup.planet.toUpperCase()}! Attempt your mission before Sol ${setup.missionGoal.deadlineSol}.`,
            `Primary Objective: ${setup.missionGoal.title} by Sol ${setup.missionGoal.deadlineSol}.`,
        ],
        dailyLog: [
            { id: 1, sol: 1, kind: 'good', text: `Sol 1: Outpost initialized on ${setup.planet.toUpperCase()}. ${setup.crew.length} crew online.` },
        ],
        timeline: [],
        result: null,
        nextTaskSeq: 1,
        nextLogSeq: 2,
        halfRationSols: 0,
        tasksCompletedCount: 0,
        perkMatchesCount: 0,
        lowEnergyCount: 0,
        lowFoodCount: 0,
        lowOxygenCount: 0,
    };

    // Every mission runs as an expedition; a setup without a profile is the Tharsis survey.
    state.tharsis = createTharsis(state, seed, setup.expedition ?? 'tharsis');
    return state;
}

export function advanceSol(state: OutpostGameState): { advanced: boolean; reason?: string } {
    if (state.phase === 'ended') return { advanced: false, reason: 'Mission already ended.' };
    if (!isTharsis(state)) return { advanced: false, reason: 'No expedition is running.' };
    return advanceTharsisSol(state);
}

export function previewEndSol(state: TharsisState): TharsisState {
    const projected = cloneValue(state);
    advanceSol(projected);
    return projected;
}

export function isTharsis(state: OutpostGameState): state is TharsisState {
    return state.tharsis !== undefined;
}

export function continueAfterOutcome(state: TharsisState): void {
    if (state.tharsis.phase !== 'outcome') return;
    state.tharsis.phase = 'planning';
    state.phase = 'planning';
}

export function commitBriefing(state: TharsisState, sol: number, briefing: SurveyBriefing): boolean {
    const run = state.tharsis;
    if (run.expedition === 'training' || state.sol !== sol || run.phase !== 'report' || run.briefingCommitted || briefing.area !== run.briefing.area) return false;
    if (run.briefing.system === 'storm') run.stormBriefing = run.briefing;
    run.briefing = briefing;
    run.briefingCommitted = true;
    return true;
}

export function continueAfterReport(state: TharsisState): void {
    const run = state.tharsis;
    if (run.phase !== 'report') return;
    if (state.result) {
        run.phase = 'debrief';
        return;
    }
    run.phase = 'briefing';
    run.briefingCommitted = true;
    if (run.briefing.source !== 'Mission control') run.recentSystems = [...run.recentSystems.slice(-2), run.briefing.system];
    state.lastEventTitle = run.briefing.title;
    state.lastEventChoiceLabel = 'Pending';
    state.lastEventOutcome = null;
    appendLog(state, 'event', `Sol ${state.sol} briefing · ${run.briefing.title}`);
}

function advanceTharsisSol(state: TharsisState): { advanced: boolean; reason?: string } {
    const run = state.tharsis;
    if (run.phase !== 'planning') return { advanced: false, reason: 'Finish the current briefing or report first.' };
    const report: string[] = [];
    if (state.rationPolicy === 'half') state.halfRationSols++;
    const { completed, collapse } = resolveTharsisSol(state, report);
    recordSol(state, completed);
    run.reportSol = state.sol;
    run.phase = 'report';
    const infinite = run.expedition === 'infinite';
    const deadline = missionDeadline(state);
    if (collapse || (!infinite && (state.goal.completed || state.sol >= deadline))) {
        const { site, surveyHours, dataKind } = expeditionOf(run.expedition);
        const reason = collapse ?? (state.goal.completed ? `The crew docked with ${surveyHours} hours of ${dataKind} from ${site} by Sol ${state.sol}.` :
            run.rover ? `Sol ${deadline} ended with the crew still in the field (${run.hours}/${surveyHours}h).` :
                run.returnedWithData ? `Sol ${deadline} ended below the required station reserves.` : `Sol ${deadline} ended without a complete data drive at the station.`);
        finalizeRun(state, infinite || (state.goal.completed && !collapse) ? 'victory' : 'defeat',
            infinite ? `Survived ${state.sol} Sols at ${site}: ${reason}` : reason, report);
        return { advanced: true };
    }
    state.sol++;
    state.phase = 'event';
    state.lastSolReport = report;
    applyForecast(state, run);
    run.briefing = nextBriefing(state);
    run.outcome = [];
    run.briefingCommitted = run.expedition === 'training';
    run.previewedChoice = null;
    run.stormBriefing = null;
    return { advanced: true };
}

function recordSol(state: OutpostGameState, completedTitles: string[]): void {
    if (state.resources.energy < 15) state.lowEnergyCount++;
    if (state.resources.food < 10) state.lowFoodCount++;
    if (state.resources.oxygen < 25) state.lowOxygenCount++;
    state.timeline.push({
        sol: state.sol, weather: state.conditions.weather, eventTitle: state.lastEventTitle,
        eventChoiceLabel: state.lastEventChoiceLabel, tasksCompleted: completedTitles, resourcesAfter: { ...state.resources },
        moraleAfter: state.conditions.morale, radiationAfter: state.conditions.radiation,
    });
}

function finalizeRun(
    state: TharsisState,
    outcome: 'victory' | 'defeat',
    reason: string,
    report: string[],
): void {
    state.phase = 'ended';
    state.lastSolReport = report;

    const resourceScore = Math.round(
        state.resources.energy +
            state.resources.food * 2 +
            state.resources.water * 2 +
            state.resources.oxygen +
            state.resources.res * 3,
    );
    const goalBonus = state.goal.completed ? 400 : 0;
    const victoryBonus = outcome === 'victory' ? 500 : 0;
    const score = Math.max(0, state.sol * 40 + state.tasksCompletedCount * 60 + state.perkMatchesCount * 35 + resourceScore + goalBonus + victoryBonus);
    const training = state.tharsis.expedition === 'training';
    const researchPointsEarned = training ? outcome === 'victory' ? 3 : 0 : Math.max(2, Math.round(score / 180));

    const expedition = expeditionOf(state.tharsis.expedition);
    const lessons: string[] = [];
    if (state.lowEnergyCount >= 2 || state.resources.energy < 20) {
        lessons.push('Power ran low. Pack an extra Battery Pack or store Power before the storm with Battery Bank.');
    }
    if (state.lowFoodCount >= 2 || state.halfRationSols >= 3) {
        lessons.push('Food supplies ran tight — harvest the hydroponics early or unlock "Algae Nutrient Loop".');
    }
    if (state.lowOxygenCount >= 2 || state.resources.oxygen < 30) {
        lessons.push('Oxygen margins got thin. Keep a Repair Kit or Oxygen Tank in reserve, or use Emergency Electrolysis.');
    }
    if (!state.goal.completed) {
        const { legs, surveyHours } = expedition;
        const trip = (legs: number) => legs * 2 + surveyHours / 24;
        lessons.push(`Finish prep early, then reserve ${trip(legs.pilot)} Sols with a Pilot or ${trip(legs.backup)} with a backup driver for the round trip.`);
    }
    const hazardWeather = expedition.hazard.kind === 'solar' ? 'Solar Flare' : 'Dust Storm';
    if (!state.goal.completed && state.timeline.some(sol => sol.weather === hazardWeather)) {
        lessons.unshift(expedition.hazard.kind === 'solar'
            ? 'The solar storm lasts three Sols. Shelter the station and harden the rover before the radiation arrives.'
            : 'The dust storm lasts three Sols. Prepare shelter and bring extra Power and O₂ for field operations.');
    }
    if (lessons.length === 0) {
        lessons.push('Textbook Martian logistics! Try a harder mission, or aim for an even higher surplus next run.');
    }

    state.result = {
        outcome,
        reason,
        planet: state.planet,
        solReached: state.sol,
        targetSol: state.targetSol,
        goalCompleted: state.goal.completed,
        score,
        researchPointsEarned,
        finalResources: { ...state.resources },
        lessons,
        timeline: [...state.timeline],
    };

    appendLog(state, outcome === 'victory' ? 'good' : 'warn', `${outcome.toUpperCase()}: ${reason}`);
}
