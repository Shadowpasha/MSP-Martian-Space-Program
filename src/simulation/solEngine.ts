import {
    cloneSetup,
    computeSkillModifiers,
    DEFAULT_SKILL_MODIFIERS,
    DEFAULT_MARS_SETUP,
    type CargoInventory,
    type GoalFlag,
    type CargoItemId,
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
import { pickDailyEvent, type DailyEventDef, type EventChoice, type MissionProgressDelta } from '../data/events';
import { CARGO_BY_ID, normalizeCargo } from '../data/cargo';
import { formatResource, resourceEntries } from '../data/missions';
import type { ProposedTaskSpec } from '../services/geminiPlanner';

export interface ActiveTask {
    id: string;
    title: string;
    description: string;
    category: TaskCategory;
    totalSols: number;
    progress: number;       // 0 .. totalSols
    staffedSols: number;
    upfrontPaid: boolean;
    dailyCost: Partial<ResourcePool>;
    rewardOnComplete: {
        resources?: Partial<ResourcePool>;
        radiationDelta?: number;
        moraleDelta?: number;
        goalFlag?: GoalFlag;
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
    cargo: Required<CargoInventory>;
    crew: CrewMember[];
    skillModifiers: SkillTreeModifiers;
    unlockedSkillIds: string[];
    goal: MissionGoal;
    rationPolicy: RationPolicy;
    tasks: ActiveTask[];
    usedEventIds: string[];
    usedEventTitles: string[];
    currentEvent: DailyEventDef | null;
    lastEventTitle: string;
    lastEventChoiceLabel: string;
    lastEventOutcome: string | null;
    lastEventScienceFact: string | null;
    lastEventDeltas: string[];
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
        : { ...DEFAULT_SKILL_MODIFIERS, ...setup.skillModifiers };

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
        cargo: normalizeCargo(setup.cargo),
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
        usedEventTitles: [firstEvent.title],
        currentEvent: firstEvent,
        lastEventTitle: firstEvent.title,
        lastEventChoiceLabel: 'Pending',
        lastEventOutcome: null,
        lastEventScienceFact: firstEvent.scienceFact,
        lastEventDeltas: [],
        lastSolReport: [
            `Touchdown on ${setup.planet.toUpperCase()}! Attempt your mission before Sol ${setup.missionGoal.deadlineSol}.`,
            `Primary Objective: ${setup.missionGoal.title} by Sol ${setup.missionGoal.deadlineSol}.`,
        ],
        dailyLog: [
            { id: 1, sol: 1, kind: 'good', text: `Sol 1: Outpost initialized on ${setup.planet.toUpperCase()}. ${setup.crew.length} crew online.` },
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
        return { ok: false, reason: `Needs ${CARGO_BY_ID[choice.requiresCargo].name}` };
    }
    if (choice.requiresRole) {
        const alive = state.crew.some((c) => c.role === choice.requiresRole && c.health > 0);
        if (!alive) return { ok: false, reason: `Needs ${choice.requiresRole}` };
    }
    return { ok: true };
}

function formatChoiceDeltas(
    choice: EventChoice,
    radApplied: number,
    morApplied: number,
    reqEffects: string[],
): string[] {
    const out: string[] = [];
    if (choice.consumesCargo) {
        for (const [k, amt] of Object.entries(choice.consumesCargo) as [keyof CargoInventory, number][]) {
            if (amt) out.push(`-${amt} ${CARGO_BY_ID[k]?.name ?? k}`);
        }
    }
    const r = choice.resourceDelta;
    if (r?.energy) out.push(`${r.energy > 0 ? '+' : ''}${r.energy} Power`);
    if (r?.food) out.push(`${r.food > 0 ? '+' : ''}${r.food} Food`);
    if (r?.water) out.push(`${r.water > 0 ? '+' : ''}${r.water} Water`);
    if (r?.oxygen) out.push(`${r.oxygen > 0 ? '+' : ''}${r.oxygen}% O2`);
    if (r?.res) out.push(`${r.res > 0 ? '+' : ''}${r.res} Res`);
    if (radApplied) out.push(`${radApplied > 0 ? '+' : ''}${round1(radApplied)} Radiation`);
    if (morApplied) out.push(`${morApplied > 0 ? '+' : ''}${round1(morApplied)}% Morale`);
    out.push(...reqEffects);
    return out;
}

export function applyMissionRequirementDelta(
    state: OutpostGameState,
    delta: MissionProgressDelta,
): string[] {
    const effects: string[] = [];
    for (const [kind, rawAmt] of Object.entries(delta) as [keyof MissionProgressDelta, number][]) {
        if (!rawAmt) continue;
        const req = state.goal.requirements.find((r) => r.kind === kind);
        if (!req) continue;
        const before = req.current;
        req.current = clamp(req.current + rawAmt, 0, req.target);
        const actual = req.current - before;
        if (actual > 0) {
            appendLog(state, 'good', `Mission Req +${actual}: ${req.current}/${req.target} ${req.label}`);
            effects.push(`+${actual} ${req.label}`);
        } else if (actual < 0) {
            appendLog(state, 'warn', `Mission Req damaged (${actual}): ${req.current}/${req.target} ${req.label}`);
            effects.push(`${actual} ${req.label} (damaged!)`);
        }
    }
    return effects;
}

export function resolveDailyEventChoice(state: OutpostGameState, choiceId: string): { ok: boolean; message: string } {
    const ev = state.currentEvent;
    if (!ev) return { ok: false, message: 'No active event.' };
    const choice = ev.choices.find((c) => c.id === choiceId);
    if (!choice) return { ok: false, message: 'Choice not found.' };

    const check = isChoiceAvailable(state, choice);
    if (!check.ok) return { ok: false, message: check.reason ?? 'Unavailable.' };

    if (choice.consumesCargo) {
        for (const [k, amt] of Object.entries(choice.consumesCargo) as [keyof CargoInventory, number][]) {
            if (!amt) continue;
            const missionReserve = state.goal.requiredEquipment?.[k] ?? 0;
            state.cargo[k] -= Math.min(amt, Math.max(0, state.cargo[k] - missionReserve));
        }
    }
    if (choice.resourceDelta) {
        applyResourceDelta(state.resources, choice.resourceDelta);
    }
    let radApplied = 0;
    if (choice.radiationDelta) {
        radApplied = choice.radiationDelta > 0
            ? choice.radiationDelta * (1 - state.skillModifiers.radiationShielding)
            : choice.radiationDelta;
        state.conditions.radiation = clamp(round1(state.conditions.radiation + radApplied), 0, 100);
    }
    let morApplied = 0;
    if (choice.moraleDelta) {
        morApplied = choice.moraleDelta < 0
            ? choice.moraleDelta * state.skillModifiers.moraleDecayMult
            : choice.moraleDelta;
        state.conditions.morale = clamp(round1(state.conditions.morale + morApplied), 0, 100);
    }
    const reqEffects = choice.requirementDelta
        ? applyMissionRequirementDelta(state, choice.requirementDelta)
        : [];

    state.lastEventChoiceLabel = choice.label;
    state.lastEventOutcome = choice.outcomeText;
    state.lastEventScienceFact = ev.scienceFact ?? null;
    state.lastEventDeltas = formatChoiceDeltas(choice, radApplied, morApplied, reqEffects);
    appendLog(state, 'event', `${ev.title}: ${choice.outcomeText}`);
    state.currentEvent = null;
    if (state.phase === 'event') state.phase = 'planning';
    return { ok: true, message: choice.outcomeText };
}

export function applyGeneratedDailyEvent(state: OutpostGameState, event: DailyEventDef): void {
    if (state.phase === 'ended' || state.result !== null) return;
    state.currentEvent = event;
    state.lastEventTitle = event.title;
    state.lastEventScienceFact = event.scienceFact ?? null;
    if (!state.usedEventIds.includes(event.id)) {
        state.usedEventIds.push(event.id);
    }
    if (!state.usedEventTitles.includes(event.title)) {
        state.usedEventTitles.push(event.title);
    }
    const existingIdx = state.dailyLog.findIndex((entry) => entry.sol === state.sol && entry.kind === 'event');
    if (existingIdx !== -1) {
        state.dailyLog[existingIdx]!.text = `Alert: ${event.title}`;
    } else {
        appendLog(state, 'event', `Alert: ${event.title}`);
    }
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
        totalSols: Math.max(
            1, Math.round(spec.durationSols),
            spec.rewardOnComplete.goalFlag === state.goal.requiredFlag ? Math.ceil(state.goal.durationHours / 24) : 0,
        ),
        progress: 0,
        staffedSols: 0,
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
        req.current = Math.min(req.target, staffedCrewCount(state, goalTask));
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

function staffedCrewCount(state: OutpostGameState, task: ActiveTask): number {
    return state.crew.filter(member => member.health > 0 && task.assignedCrewIds.includes(member.id)).length;
}

export function getReserveShortfalls(state: OutpostGameState): string[] {
    return resourceEntries(state.goal.minimumReserves)
        .filter(([key, target]) => state.resources[key] < target)
        .map(([key, target]) => `${formatResource(key, state.resources[key])} / ${formatResource(key, target)}`);
}

function missionCompletionShortfalls(state: OutpostGameState, expedition: ActiveTask): string[] {
    const crew = staffedCrewCount(state, expedition);
    const missing = state.goal.requirements.flatMap(requirement => {
        const current = requirement.kind === 'assign_crew' ? crew : requirement.current;
        return current < requirement.target ? [`${current}/${requirement.target} ${requirement.label}`] : [];
    });
    for (const item of Object.values(CARGO_BY_ID)) {
        const required = state.goal.requiredEquipment?.[item.id] ?? 0;
        if (state.cargo[item.id] < required) missing.push(`${required} × ${item.name}`);
    }
    return [...missing, ...getReserveShortfalls(state)];
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

    // Planner proposals already include the AI discount in their quoted costs.
    let costMult = 1;
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

export function consumeCargoDirectly(state: OutpostGameState, item: CargoItemId): { ok: boolean; text: string } {
    if (state.cargo[item] <= 0) return { ok: false, text: 'Out of stock.' };
    if (item === 'windSampler') return { ok: false, text: 'Use the Wind Sampler during the weather survey.' };
    const supply = CARGO_BY_ID[item];
    state.cargo[item] -= 1;
    if (supply.resources) applyResourceDelta(state.resources, supply.resources);
    if (supply.morale) state.conditions.morale = clamp(state.conditions.morale + supply.morale, 0, 100);
    if (supply.radiation) state.conditions.radiation = clamp(state.conditions.radiation + supply.radiation, 0, 100);
    if (supply.crewHealth) {
        for (const member of state.crew) member.health = clamp(member.health + supply.crewHealth, 0, 100);
    }
    const text = `Used ${supply.name} · ${supply.effect}.`;
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
    const completed = new Set<string>();
    const isExpedition = (task: ActiveTask) => task.rewardOnComplete.goalFlag === state.goal.requiredFlag;
    const orderedTasks = [...state.tasks.filter(task => !isExpedition(task)), ...state.tasks.filter(isExpedition)];
    for (const task of orderedTasks) {
        if (isExpedition(task) && state.goal.completed) continue;
        const eff = computeTaskEfficiency(state, task);
        if (eff.progressPerSol <= 0) {
            report.push(`Task "${task.title}" stalled (no crew assigned).`);
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

        task.staffedSols += 1;
        task.progress = Math.min(task.totalSols, round1(task.progress + eff.progressPerSol));
        const isGoalTask = isExpedition(task);
        const requiredFieldSols = Math.max(1, Math.ceil(state.goal.durationHours / 24));
        if (task.progress >= task.totalSols && (!isGoalTask || task.staffedSols >= requiredFieldSols)) {
            if (isGoalTask) {
                const missing = missionCompletionShortfalls(state, task);
                if (missing.length > 0) {
                    const missingText = missing.join(', ');
                    report.push(`"${task.title}" held: complete requirements (${missingText}).`);
                    appendLog(state, 'warn', `"${task.title}" waiting on Mission Requirements: ${missingText}.`);
                    continue;
                }
            }

            completedTitles.push(task.title);
            completed.add(task.id);
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
        } else if (isGoalTask && task.staffedSols < requiredFieldSols) {
            report.push(`Expedition data collected on ${task.staffedSols}/${requiredFieldSols} Sols.`);
        }
    }
    state.tasks = state.tasks.filter(task => !completed.has(task.id));
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
        eventTitle: state.lastEventTitle,
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
    if (!state.usedEventTitles.includes(nextEvent.title)) {
        state.usedEventTitles.push(nextEvent.title);
    }
    state.currentEvent = nextEvent;
    state.lastEventTitle = nextEvent.title;
    state.lastEventChoiceLabel = 'Pending';
    state.lastEventOutcome = null;
    state.lastEventScienceFact = null;
    state.lastEventDeltas = [];
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
        lessons.push('Food supplies ran tight — assign Scott Kelly (Botanist) to Hydroponics early or unlock "Algae Nutrient Loop".');
    }
    if (state.lowOxygenCount >= 2 || state.resources.oxygen < 30) {
        lessons.push('Oxygen margins got thin — keep 1 Repair Kit for micrometeorites or unlock "Closed-Loop Scrubbers".');
    }
    if (!state.goal.completed) {
        lessons.push(`Plan "${state.goal.title}" at least 2-3 Sols before Sol ${state.goal.deadlineSol} using A.R.I.E.S. AI or Rover Bay.`);
    }
    if (state.perkMatchesCount < state.tasksCompletedCount) {
        lessons.push('Match crew specialties to task categories for better progress, lower costs, and higher yields.');
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
