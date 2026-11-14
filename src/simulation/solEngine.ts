import {
    cloneSetup,
    computeSkillModifiers,
    DEFAULT_MARS_SETUP,
    type CargoInventory,
    type ConditionState,
    type CrewMember,
    type CrewRole,
    type MainLoopResult,
    type MissionGoal,
    type MissionRequirement,
    type MissionRequirementKind,
    type MissionSetupInput,
    type PlanetId,
    type RationPolicy,
    type ResourcePool,
    type SkillTreeModifiers,
    type SolSummaryRecord,
    type TaskCategory,
    type WeatherType,
} from '../contracts/gameContract';
import { pickDailyEvent, type DailyEventDef, type EventChoice } from '../data/events';
import type { ProposedTaskSpec } from '../services/geminiPlanner';

export interface ActiveTask {
    id: string;
    title: string;
    description: string;
    category: TaskCategory;
    totalSols: number;
    progress: number;       // 0 .. totalSols
    upfrontPaid: boolean;
    dailyCost: Partial<ResourcePool>;
    rewardOnComplete: {
        resources?: Partial<ResourcePool>;
        radiationDelta?: number;
        moraleDelta?: number;
        goalFlag?: 'wind_sample_collected' | 'ice_core_collected';
    };
    recommendedRole: CrewRole;
    assignedCrewIds: string[];
    source: 'ai' | 'event' | 'station';
    requirementKind?: Exclude<MissionRequirementKind, 'assign_crew'>;
    requirementUnits?: number;
}

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
    cargo: CargoInventory;
    crew: CrewMember[];
    skillModifiers: SkillTreeModifiers;
    unlockedSkillIds: string[];
    goal: MissionGoal;
    rationPolicy: RationPolicy;
    tasks: ActiveTask[];
    usedEventIds: string[];
    currentEvent: DailyEventDef | null;
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
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

function round1(v: number): number {
    return Math.round(v * 10) / 10;
}

function forecastForSol(sol: number, planet: PlanetId, goalDeadline: number, goalCompleted: boolean): WeatherForecast {
    if (planet === 'moon') {
        if (sol % 5 === 0) return { weather: 'Solar Flare', temperatureC: -135, radiationRisk: 'High' };
        if (sol % 3 === 0) return { weather: 'Cold Snap', temperatureC: -160, radiationRisk: 'Moderate' };
        return { weather: 'Clear', temperatureC: -110, radiationRisk: 'Low' };
    }
    // Mars weather pattern: guarantees sandstorm around Sol 12-15 if goal is sandstorm sample
    if (!goalCompleted && sol >= goalDeadline - 3 && sol <= goalDeadline) {
        return { weather: 'Dust Storm', temperatureC: -78, radiationRisk: 'Moderate' };
    }
    const cycle = (sol * 5 + 1) % 10;
    if (cycle === 3 || cycle === 8) return { weather: 'Dust Storm', temperatureC: -76, radiationRisk: 'Low' };
    if (cycle === 5) return { weather: 'Solar Flare', temperatureC: -54, radiationRisk: 'High' };
    if (cycle === 2 || cycle === 7) return { weather: 'Dust Haze', temperatureC: -65, radiationRisk: 'Low' };
    if (cycle === 6) return { weather: 'Cold Snap', temperatureC: -84, radiationRisk: 'Low' };
    return { weather: 'Clear', temperatureC: -56, radiationRisk: 'Low' };
}

export function createInitialGameState(
    inputSetup: MissionSetupInput = DEFAULT_MARS_SETUP,
    unlockedSkillIds: readonly string[] = [],
): OutpostGameState {
    const setup = cloneSetup(inputSetup);
    const skillModifiers = unlockedSkillIds.length > 0
        ? computeSkillModifiers(unlockedSkillIds)
        : { ...setup.skillModifiers };

    const usedEventIds: string[] = [];
    const firstEvent = pickDailyEvent(1, setup.startingConditions.weather, new Set(usedEventIds), setup.missionGoal.completed);
    usedEventIds.push(firstEvent.id);

    const state: OutpostGameState = {
        planet: setup.planet,
        sol: 1,
        targetSol: setup.targetSol,
        phase: 'event',
        resources: { ...setup.startingResources },
        conditions: { ...setup.startingConditions },
        tomorrowForecast: forecastForSol(2, setup.planet, setup.missionGoal.deadlineSol, setup.missionGoal.completed),
        cargo: { ...setup.cargo },
        crew: setup.crew.map((c) => ({ ...c, perk: { ...c.perk }, stageAnchor: { ...c.stageAnchor } })),
        skillModifiers,
        unlockedSkillIds: [...unlockedSkillIds],
        goal: {
            ...setup.missionGoal,
            requirements: (setup.missionGoal.requirements ?? []).map((r) => ({ ...r })),
        },
        rationPolicy: 'full',
        tasks: [],
        usedEventIds,
        currentEvent: firstEvent,
        lastEventChoiceLabel: 'Pending',
        lastEventOutcome: null,
        lastSolReport: [
            `Touchdown on ${setup.planet.toUpperCase()}! Attempt your mission before Sol ${setup.missionGoal.deadlineSol}.`,
            `Primary Objective: ${setup.missionGoal.title} by Sol ${setup.missionGoal.deadlineSol}.`,
        ],
        dailyLog: [
            { id: 1, sol: 1, kind: 'good', text: `Sol 1: Outpost initialized on ${setup.planet.toUpperCase()}. 4 crew online.` },
            { id: 2, sol: 1, kind: 'event', text: `Alert: ${firstEvent.title}` },
        ],
        timeline: [],
        result: null,
        nextTaskSeq: 1,
        nextLogSeq: 3,
        halfRationSols: 0,
        tasksCompletedCount: 0,
        perkMatchesCount: 0,
        lowEnergyCount: 0,
        lowFoodCount: 0,
        lowOxygenCount: 0,
    };

    return state;
}

function appendLog(state: OutpostGameState, kind: LogEntry['kind'], text: string): void {
    state.dailyLog.push({ id: state.nextLogSeq++, sol: state.sol, kind, text });
    if (state.dailyLog.length > 80) state.dailyLog.shift();
}

export function applyResourceDelta(resources: ResourcePool, delta: Partial<ResourcePool>): void {
    if (delta.energy) resources.energy = clamp(round1(resources.energy + delta.energy), 0, 120);
    if (delta.food) resources.food = Math.max(0, round1(resources.food + delta.food));
    if (delta.water) resources.water = Math.max(0, round1(resources.water + delta.water));
    if (delta.oxygen) resources.oxygen = clamp(round1(resources.oxygen + delta.oxygen), 0, 100);
    if (delta.res) resources.res = Math.max(0, round1(resources.res + delta.res));
}

export function canAffordCost(resources: ResourcePool, cost: Partial<ResourcePool>): boolean {
    if ((cost.energy ?? 0) > resources.energy) return false;
    if ((cost.food ?? 0) > resources.food) return false;
    if ((cost.water ?? 0) > resources.water) return false;
    if ((cost.oxygen ?? 0) > resources.oxygen) return false;
    if ((cost.res ?? 0) > resources.res) return false;
    return true;
}

export function isChoiceAvailable(state: OutpostGameState, choice: EventChoice): { ok: boolean; reason?: string } {
    if (choice.requiresCargo && state.cargo[choice.requiresCargo] <= 0) {
        return { ok: false, reason: `Needs ${choice.requiresCargo}` };
    }
    if (choice.requiresRole) {
        const alive = state.crew.some((c) => c.role === choice.requiresRole && c.health > 0);
        if (!alive) return { ok: false, reason: `Needs ${choice.requiresRole}` };
    }
    return { ok: true };
}

export function resolveDailyEventChoice(state: OutpostGameState, choiceId: string): { ok: boolean; message: string } {
    if (!state.currentEvent) return { ok: false, message: 'No active event.' };
    const choice = state.currentEvent.choices.find((c) => c.id === choiceId);
    if (!choice) return { ok: false, message: 'Choice not found.' };

    const check = isChoiceAvailable(state, choice);
    if (!check.ok) return { ok: false, message: check.reason ?? 'Unavailable.' };

    if (choice.consumesCargo) {
        for (const [k, amt] of Object.entries(choice.consumesCargo) as [keyof CargoInventory, number][]) {
            if (amt) state.cargo[k] = Math.max(0, state.cargo[k] - amt);
        }
    }
    if (choice.resourceDelta) {
        applyResourceDelta(state.resources, choice.resourceDelta);
    }
    if (choice.radiationDelta) {
        const rad = choice.radiationDelta > 0
            ? choice.radiationDelta * (1 - state.skillModifiers.radiationShielding)
            : choice.radiationDelta;
        state.conditions.radiation = clamp(round1(state.conditions.radiation + rad), 0, 100);
    }
    if (choice.moraleDelta) {
        const mor = choice.moraleDelta < 0
            ? choice.moraleDelta * state.skillModifiers.moraleDecayMult
            : choice.moraleDelta;
        state.conditions.morale = clamp(round1(state.conditions.morale + mor), 0, 100);
    }

    state.lastEventChoiceLabel = choice.label;
    state.lastEventOutcome = choice.outcomeText;
    appendLog(state, 'event', `${state.currentEvent.title}: ${choice.outcomeText}`);
    state.currentEvent = null;
    if (state.phase === 'event') state.phase = 'planning';
    return { ok: true, message: choice.outcomeText };
}

export function enqueueTask(
    state: OutpostGameState,
    spec: ProposedTaskSpec,
    source: ActiveTask['source'] = 'ai',
): ActiveTask {
    // Pay upfront cost if any (clamped cleanly)
    const upfront: Partial<ResourcePool> = {};
    for (const [k, v] of Object.entries(spec.upfrontCost) as [keyof ResourcePool, number][]) {
        if (v && v > 0) upfront[k] = -Math.min(state.resources[k], v);
    }
    applyResourceDelta(state.resources, upfront);

    const task: ActiveTask = {
        id: `task_${state.nextTaskSeq++}`,
        title: spec.title,
        description: spec.description,
        category: spec.category,
        totalSols: Math.max(1, Math.round(spec.durationSols)),
        progress: 0,
        upfrontPaid: true,
        dailyCost: { ...spec.dailyCost },
        rewardOnComplete: {
            resources: spec.rewardOnComplete.resources ? { ...spec.rewardOnComplete.resources } : undefined,
            radiationDelta: spec.rewardOnComplete.radiationDelta,
            moraleDelta: spec.rewardOnComplete.moraleDelta,
            goalFlag: spec.rewardOnComplete.goalFlag,
        },
        recommendedRole: spec.recommendedRole,
        assignedCrewIds: [],
        source,
        requirementKind: spec.requirementKind,
        requirementUnits: spec.requirementUnits,
    };
    state.tasks.push(task);
    syncAssignCrewRequirement(state);
    appendLog(state, 'info', `Queued [${task.category}] "${task.title}" (${task.totalSols} Sol${task.totalSols > 1 ? 's' : ''}).`);
    return task;
}

export function cancelTask(state: OutpostGameState, taskId: string): boolean {
    const idx = state.tasks.findIndex((t) => t.id === taskId);
    if (idx === -1) return false;
    const [removed] = state.tasks.splice(idx, 1);
    syncAssignCrewRequirement(state);
    appendLog(state, 'warn', `Canceled task "${removed!.title}".`);
    return true;
}

export function assignCrewToTask(state: OutpostGameState, crewId: string, taskId: string | null): void {
    // Remove from any previous task first
    for (const t of state.tasks) {
        t.assignedCrewIds = t.assignedCrewIds.filter((id) => id !== crewId);
    }
    if (!taskId) {
        syncAssignCrewRequirement(state);
        return;
    }
    const target = state.tasks.find((t) => t.id === taskId);
    if (!target) return;
    if (target.assignedCrewIds.length >= 2) {
        target.assignedCrewIds.shift();
    }
    target.assignedCrewIds.push(crewId);
    syncAssignCrewRequirement(state);
}

export function syncAssignCrewRequirement(state: OutpostGameState): void {
    const req = state.goal.requirements.find((r) => r.kind === 'assign_crew');
    if (!req) return;
    if (state.goal.completed) {
        req.current = req.target;
        return;
    }
    const goalTask = state.tasks.find(
        (t) => t.category === 'GOAL' || t.rewardOnComplete.goalFlag === state.goal.requiredFlag,
    );
    if (goalTask) {
        req.current = Math.min(req.target, goalTask.assignedCrewIds.length);
        return;
    }
    const distinctAssigned = new Set<string>();
    for (const t of state.tasks) {
        for (const id of t.assignedCrewIds) distinctAssigned.add(id);
    }
    req.current = Math.min(req.target, distinctAssigned.size);
}

export function advanceMissionRequirement(
    state: OutpostGameState,
    kind: Exclude<MissionRequirementKind, 'assign_crew'>,
    units: number,
): void {
    const req = state.goal.requirements.find((r) => r.kind === kind);
    if (!req || units <= 0) return;
    const before = req.current;
    req.current = Math.min(req.target, req.current + units);
    if (req.current > before) {
        appendLog(state, 'good', `Mission Req updated: ${req.current}/${req.target} ${req.label}`);
    }
}

export function getMissingMissionRequirements(state: OutpostGameState): MissionRequirement[] {
    return state.goal.requirements.filter((r) => r.current < r.target);
}

export function areMissionRequirementsMet(state: OutpostGameState): boolean {
    return getMissingMissionRequirements(state).length === 0;
}

export function getCrewAssignment(state: OutpostGameState, crewId: string): ActiveTask | undefined {
    return state.tasks.find((t) => t.assignedCrewIds.includes(crewId));
}

export function computeTaskEfficiency(
    state: OutpostGameState,
    task: ActiveTask,
): {
    effectiveDailyCost: Partial<ResourcePool>;
    progressPerSol: number;
    yieldMultiplier: number;
    matchedPerkNames: string[];
} {
    const assigned = task.assignedCrewIds
        .map((id) => state.crew.find((c) => c.id === id))
        .filter((c): c is CrewMember => Boolean(c && c.health > 0));

    if (assigned.length === 0) {
        return {
            effectiveDailyCost: { ...task.dailyCost },
            progressPerSol: 0,
            yieldMultiplier: 1,
            matchedPerkNames: [],
        };
    }

    let costMult = state.skillModifiers.aiCostDiscountMult;
    let progress = 0;
    let yieldMult = 1;
    const matchedPerkNames: string[] = [];

    assigned.forEach((member, idx) => {
        const matches =
            member.perk.bonusCategory === task.category ||
            (task.category === 'GOAL' && member.role === 'pilot');
        const slotFactor = idx === 0 ? 1.0 : 0.7;
        if (matches) {
            costMult *= member.perk.costMultiplier;
            progress += member.perk.speedMultiplier * slotFactor;
            yieldMult = Math.max(yieldMult, member.perk.yieldMultiplier);
            matchedPerkNames.push(`${member.name.split(' ')[0]}: ${member.perk.title}`);
        } else {
            progress += 1.0 * slotFactor;
        }
    });

    if (task.category === 'BIO') yieldMult *= state.skillModifiers.hydroponicsYieldMult;
    if (task.category === 'NAV' || task.category === 'GOAL') yieldMult *= state.skillModifiers.roverYieldMult;

    progress += state.skillModifiers.taskSpeedBonus;

    const effectiveDailyCost: Partial<ResourcePool> = {};
    for (const [k, val] of Object.entries(task.dailyCost) as [keyof ResourcePool, number][]) {
        if (val && val > 0) {
            effectiveDailyCost[k] = Math.max(1, Math.round(val * costMult * 10) / 10);
        }
    }

    return {
        effectiveDailyCost,
        progressPerSol: round1(progress),
        yieldMultiplier: round1(yieldMult),
        matchedPerkNames,
    };
}

export function consumeCargoDirectly(state: OutpostGameState, item: keyof CargoInventory): { ok: boolean; text: string } {
    if (state.cargo[item] <= 0) return { ok: false, text: 'Out of stock.' };
    state.cargo[item] -= 1;
    let text = '';
    if (item === 'batteryPacks') {
        applyResourceDelta(state.resources, { energy: 22 });
        text = 'Used Battery Pack: +22 Energy.';
    } else if (item === 'extraRations') {
        applyResourceDelta(state.resources, { food: 10 });
        state.conditions.morale = clamp(state.conditions.morale + 5, 0, 100);
        text = 'Opened Extra Rations: +10 Food, +5 Morale.';
    } else if (item === 'medkits') {
        state.conditions.radiation = clamp(state.conditions.radiation - 12, 0, 100);
        state.conditions.morale = clamp(state.conditions.morale + 6, 0, 100);
        for (const c of state.crew) c.health = clamp(c.health + 15, 0, 100);
        text = 'Used Medkit: -12 Radiation, +15 Crew Health, +6 Morale.';
    } else if (item === 'seedPods') {
        applyResourceDelta(state.resources, { food: 8, oxygen: 6 });
        text = 'Planted Seed Pod boost: +8 Food, +6 Oxygen.';
    } else if (item === 'repairKits') {
        applyResourceDelta(state.resources, { oxygen: 12, energy: 6 });
        text = 'Used Repair Kit on life support seals: +12 Oxygen, +6 Energy.';
    } else {
        state.cargo[item] += 1;
        return { ok: false, text: 'Wind Sampler must be deployed via your Mission task.' };
    }
    advanceMissionRequirement(state, 'prep_supplies', 1);
    appendLog(state, 'good', text);
    return { ok: true, text };
}

export function setRationPolicy(state: OutpostGameState, policy: RationPolicy): void {
    state.rationPolicy = policy;
    appendLog(state, policy === 'half' ? 'warn' : 'info', `Ration policy set to ${policy === 'half' ? 'Half Rations (saves food, -Morale)' : 'Full Rations'}.`);
}

export function applySkillTreePresets(state: OutpostGameState, unlockedIds: readonly string[]): void {
    state.unlockedSkillIds = [...unlockedIds];
    state.skillModifiers = computeSkillModifiers(unlockedIds);
    appendLog(state, 'info', `Skill Tree modifiers updated (${unlockedIds.length} active nodes).`);
}

export function advanceSol(state: OutpostGameState): { advanced: boolean; reason?: string } {
    if (state.phase === 'ended') return { advanced: false, reason: 'Mission already ended.' };
    if (state.currentEvent) {
        return { advanced: false, reason: 'Resolve today’s Daily Event before ending the Sol!' };
    }

    const report: string[] = [];
    const mods = state.skillModifiers;
    const aliveCrew = state.crew.filter((c) => c.health > 0);
    const crewCount = Math.max(1, aliveCrew.length);

    // 1. Base daily resource drain & passive solar recharge (Skill Tree ready)
    const foodNeed = round1(crewCount * (state.rationPolicy === 'full' ? 1.0 : 0.5) * mods.foodConsumptionMult);
    const waterNeed = round1(crewCount * 0.9 * mods.waterConsumptionMult);
    const stormO2Extra = state.conditions.weather === 'Dust Storm' ? 1.5 : 0;
    const o2Need = round1((4.2 + stormO2Extra) * mods.oxygenConsumptionMult);

    const solarBase =
        state.conditions.weather === 'Clear' ? 7.0
            : state.conditions.weather === 'Cold Snap' ? 5.8
                : state.conditions.weather === 'Dust Haze' ? 4.0
                    : state.conditions.weather === 'Solar Flare' ? 5.2
                        : 1.6; // Dust Storm
    const solarGain = round1(solarBase * mods.solarOutputMult);
    const basePowerDraw = round1((6.0 + (state.conditions.weather === 'Cold Snap' ? 2.0 : 0)) * mods.energyConsumptionMult);
    const netBaseEnergy = round1(solarGain - basePowerDraw);

    applyResourceDelta(state.resources, {
        food: -foodNeed,
        water: -waterNeed,
        oxygen: -o2Need,
        energy: netBaseEnergy,
    });
    report.push(
        `Daily Life Support: Food -${foodNeed}, Water -${waterNeed}, O2 -${o2Need}%, Power ${netBaseEnergy >= 0 ? '+' : ''}${netBaseEnergy} (${solarGain} solar vs ${basePowerDraw} base).`,
    );

    // 2. Ration & Medic morale/radiation effects
    if (state.rationPolicy === 'half') {
        state.halfRationSols += 1;
        const mLoss = round1(7 * mods.moraleDecayMult);
        state.conditions.morale = clamp(round1(state.conditions.morale - mLoss), 0, 100);
        report.push(`Half Rations conserved food but strained crew Morale (-${mLoss}).`);
    } else {
        state.conditions.morale = clamp(round1(state.conditions.morale + 1), 0, 100);
    }

    const medic = aliveCrew.find((c) => c.role === 'medic');
    if (medic) {
        const medicTask = getCrewAssignment(state, medic.id);
        if (!medicTask || medicTask.category === 'MED') {
            state.conditions.morale = clamp(round1(state.conditions.morale + 2.5), 0, 100);
            state.conditions.radiation = clamp(round1(state.conditions.radiation - 1.5), 0, 100);
        }
    }

    // 3. Weather & Radiation environmental pass
    if (state.conditions.weather === 'Solar Flare') {
        const medicMitigation = medic ? 0.7 : 1.0;
        const radHit = round1(13 * (1 - mods.radiationShielding) * medicMitigation);
        state.conditions.radiation = clamp(round1(state.conditions.radiation + radHit), 0, 100);
        report.push(`Solar Flare radiation spike: +${radHit} mSv.`);
    } else if (state.conditions.radiation > 10) {
        state.conditions.radiation = clamp(round1(state.conditions.radiation - 2), 0, 100);
    }

    if (state.conditions.radiation >= 50) {
        const radMorale = round1(4 * mods.moraleDecayMult);
        state.conditions.morale = clamp(round1(state.conditions.morale - radMorale), 0, 100);
        for (const c of aliveCrew) c.health = clamp(c.health - 5, 0, 100);
        report.push(`High radiation (${state.conditions.radiation} mSv) harmed crew health & morale.`);
    }

    if (state.resources.food <= 0 || state.resources.water <= 0) {
        const penalty = round1(11 * mods.moraleDecayMult);
        state.conditions.morale = clamp(round1(state.conditions.morale - penalty), 0, 100);
        for (const c of aliveCrew) c.health = clamp(c.health - 10, 0, 100);
        report.push(`CRITICAL: Missing ${state.resources.food <= 0 ? 'Food' : 'Water'}! Crew losing health & morale.`);
    }

    // 4. Advance Active Tasks
    const completedTitles: string[] = [];
    const remainingTasks: ActiveTask[] = [];
    for (const task of state.tasks) {
        const eff = computeTaskEfficiency(state, task);
        if (eff.progressPerSol <= 0) {
            report.push(`Task "${task.title}" stalled (no crew assigned).`);
            remainingTasks.push(task);
            continue;
        }
        if (eff.matchedPerkNames.length > 0) {
            state.perkMatchesCount += eff.matchedPerkNames.length;
        }

        // Deduct daily cost
        const negCost: Partial<ResourcePool> = {};
        for (const [k, v] of Object.entries(eff.effectiveDailyCost) as [keyof ResourcePool, number][]) {
            if (v) negCost[k] = -v;
        }
        applyResourceDelta(state.resources, negCost);

        // Fatigue assigned crew slightly; resting crew recover stamina
        for (const id of task.assignedCrewIds) {
            const member = state.crew.find((c) => c.id === id);
            if (member) member.stamina = clamp(member.stamina - 8, 20, 100);
        }

        task.progress = round1(task.progress + eff.progressPerSol);
        if (task.progress >= task.totalSols) {
            const isGoalTask = task.rewardOnComplete.goalFlag === state.goal.requiredFlag;
            if (isGoalTask) {
                syncAssignCrewRequirement(state);
                const missingReqs = getMissingMissionRequirements(state);
                if (missingReqs.length > 0) {
                    task.progress = round1(Math.max(0, task.totalSols - 0.5));
                    const missingText = missingReqs.map((r) => `${r.current}/${r.target} ${r.label}`).join(', ');
                    report.push(`"${task.title}" held: complete requirements (${missingText}).`);
                    appendLog(state, 'warn', `"${task.title}" waiting on Mission Requirements: ${missingText}.`);
                    remainingTasks.push(task);
                    continue;
                }
            }

            completedTitles.push(task.title);
            state.tasksCompletedCount += 1;

            const gainedResources: Partial<ResourcePool> = {};
            if (task.rewardOnComplete.resources) {
                for (const [k, v] of Object.entries(task.rewardOnComplete.resources) as [keyof ResourcePool, number][]) {
                    if (v) gainedResources[k] = round1(v * eff.yieldMultiplier);
                }
                applyResourceDelta(state.resources, gainedResources);
            }
            if (task.rewardOnComplete.radiationDelta) {
                state.conditions.radiation = clamp(round1(state.conditions.radiation + task.rewardOnComplete.radiationDelta), 0, 100);
            }
            if (task.rewardOnComplete.moraleDelta) {
                state.conditions.morale = clamp(round1(state.conditions.morale + task.rewardOnComplete.moraleDelta), 0, 100);
            }

            if (!isGoalTask) {
                if (task.requirementKind) {
                    advanceMissionRequirement(state, task.requirementKind, task.requirementUnits ?? 1);
                } else {
                    const lowerTitle = task.title.toLowerCase();
                    if (/(sensor|weather|radar|mast|drill)/.test(lowerTitle)) {
                        advanceMissionRequirement(state, 'prep_sensor', 1);
                    } else if (/(rover|vehicle|drive)/.test(lowerTitle)) {
                        advanceMissionRequirement(state, 'prep_rover', 1);
                    } else if (task.category === 'BIO' || /(food|water|oxy|scrubber|supply|ration|solar)/.test(lowerTitle)) {
                        advanceMissionRequirement(state, 'prep_supplies', 2);
                    }
                }
            } else {
                state.goal.completed = true;
                syncAssignCrewRequirement(state);
                report.push(`MISSION OBJECTIVE COMPLETE: ${state.goal.title}!`);
                appendLog(state, 'good', `MISSION GOAL COMPLETED: ${state.goal.title}!`);
            }

            const perkMsg = eff.matchedPerkNames.length > 0 ? ` (${eff.matchedPerkNames[0]})` : '';
            report.push(`Completed "${task.title}"${perkMsg}!`);
            appendLog(state, 'good', `Completed "${task.title}"${perkMsg}.`);
        } else {
            remainingTasks.push(task);
        }
    }
    state.tasks = remainingTasks;
    syncAssignCrewRequirement(state);

    // Resting crew recover stamina
    for (const c of state.crew) {
        if (!getCrewAssignment(state, c.id) && c.health > 0) {
            c.stamina = clamp(c.stamina + 12, 0, 100);
        }
        c.morale = Math.round(state.conditions.morale);
    }

    if (state.resources.energy < 15) state.lowEnergyCount += 1;
    if (state.resources.food < 10) state.lowFoodCount += 1;
    if (state.resources.oxygen < 25) state.lowOxygenCount += 1;

    // Record timeline snapshot for this Sol
    state.timeline.push({
        sol: state.sol,
        weather: state.conditions.weather,
        eventTitle: state.lastEventChoiceLabel,
        eventChoiceLabel: state.lastEventChoiceLabel,
        tasksCompleted: completedTitles,
        resourcesAfter: { ...state.resources },
        moraleAfter: state.conditions.morale,
        radiationAfter: state.conditions.radiation,
    });

    // 5. Check Loss / Victory
    const collapseReason = checkCollapseReason(state);
    if (collapseReason) {
        finalizeRun(state, 'defeat', collapseReason, report);
        return { advanced: true };
    }

    if (state.goal.completed) {
        finalizeRun(
            state,
            'victory',
            `Mission Accomplished on Sol ${state.sol}! "${state.goal.title}" completed successfully.`,
            report,
        );
        return { advanced: true };
    }

    // 6. Advance to Next Sol
    state.sol += 1;
    state.conditions.weather = state.tomorrowForecast.weather;
    state.conditions.temperatureC = state.tomorrowForecast.temperatureC;
    state.tomorrowForecast = forecastForSol(state.sol + 1, state.planet, state.goal.deadlineSol, state.goal.completed);

    // Roll next Sol event
    const nextEvent = pickDailyEvent(
        state.sol,
        state.conditions.weather,
        new Set(state.usedEventIds),
        state.goal.completed,
    );
    state.usedEventIds.push(nextEvent.id);
    state.currentEvent = nextEvent;
    state.lastEventChoiceLabel = 'Pending';
    state.lastEventOutcome = null;
    state.phase = 'event';
    state.lastSolReport = report;

    appendLog(state, 'info', `--- Sol ${state.sol} (${state.conditions.weather}, ${state.conditions.temperatureC}C) ---`);
    appendLog(state, 'event', `Alert: ${nextEvent.title}`);

    return { advanced: true };
}

function checkCollapseReason(state: OutpostGameState): string | null {
    if (state.resources.oxygen <= 0) return 'Habitat Oxygen hit 0%. Life support depressurized.';
    if (state.conditions.morale <= 0) return 'Crew Morale collapsed to 0%. Emergency abort triggered.';
    if (state.conditions.radiation >= 100) return 'Radiation hit lethal 100 mSv threshold.';
    if (state.crew.every((c) => c.health <= 0)) return 'All crew members became incapacitated.';
    const deadline = Math.min(state.targetSol, state.goal.deadlineSol);
    if (state.sol >= deadline && !state.goal.completed) {
        return `Mission Failed (Sol ${state.sol}): "${state.goal.title}" was not completed before the Sol ${deadline} deadline.`;
    }
    return null;
}

function finalizeRun(
    state: OutpostGameState,
    outcome: 'victory' | 'defeat',
    reason: string,
    report: string[],
): void {
    state.phase = 'ended';
    state.currentEvent = null;
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
    const researchPointsEarned = Math.max(2, Math.round(score / 180));

    const lessons: string[] = [];
    if (state.lowEnergyCount >= 2 || state.resources.energy < 20) {
        lessons.push('Power dipped during dust storms — pack an extra Battery Pack or unlock "Dust-Repel Solar Coating".');
    }
    if (state.lowFoodCount >= 2 || state.halfRationSols >= 3) {
        lessons.push('Food supplies ran tight — assign Kenji Sato (Botanist) to Hydroponics early or unlock "Algae Nutrient Loop".');
    }
    if (state.lowOxygenCount >= 2 || state.resources.oxygen < 30) {
        lessons.push('Oxygen margins got thin — keep 1 Repair Kit for micrometeorites or unlock "Closed-Loop Scrubbers".');
    }
    if (!state.goal.completed) {
        lessons.push(`Plan "${state.goal.title}" at least 2-3 Sols before Sol ${state.goal.deadlineSol} using A.R.I.E.S. AI or Rover Bay.`);
    }
    if (state.perkMatchesCount < state.tasksCompletedCount) {
        lessons.push('Match crew specialties to task categories (ENG->Elena, BIO->Kenji, NAV/GOAL->Maya, MED->Marcus) for huge cost & speed bonuses.');
    }
    if (lessons.length === 0) {
        lessons.push('Textbook Martian logistics! Try Mars without skill modifiers or aim for an even higher surplus next run.');
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
