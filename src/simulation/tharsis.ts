import type { CargoInventory, CargoItemId, ConditionState, CrewMember, ResourcePool } from '../contracts/gameContract';
import { CARGO_BY_ID, CARGO_ITEMS, normalizeCargo } from '../data/cargo';
import type { StationEquipmentId } from '../data/tharsisEquipment';
import { formatResource, resourceEntries, RESOURCE_LABELS } from '../data/missions';
import { CHECKLIST } from '../data/tharsisOrders';
import type { OutpostGameState, WeatherForecast } from './solEngine';
import { appendLog, applyResourceDelta, canAffordCost, clamp, resourceChanges, round1, spend } from './stateOps';
import { advanceWork, stationCrew, type WorkAssignment, type WorkFlow } from './tharsisWork';
import { authoredBriefing, type SurveyBriefing } from './tharsisEvents';

export const ROVER_SLOTS = 20;
export const PACK_UNITS: ResourcePool = { food: 4, water: 4, oxygen: 6, energy: 8, res: 4 };
export const ROVER_UPKEEP: ResourcePool = { food: 2, water: 2, oxygen: 3, energy: 4, res: 0 };
export const STORM_DRAW = { energy: 2, oxygen: 2 };
export const EMPTY_POOLS: ResourcePool = { energy: 0, food: 0, water: 0, oxygen: 0, res: 0 };
export const EMPTY_CARGO = normalizeCargo({ windSampler: 0, repairKits: 0, batteryPacks: 0, medkits: 0, seedPods: 0, extraRations: 0 });

export interface RoverLoad {
    resources: ResourcePool;
    cargo: Required<CargoInventory>;
}

interface Rover extends RoverLoad {
    crewIds: string[];
    phase: 'outbound' | 'site' | 'returning';
    legLength: number;
    travelLeft: number;
    distance: number;
    conditions: ConditionState;
    interrupted: boolean;
}

export interface TharsisRun {
    seed: number;
    stormStart: number;
    phase: 'briefing' | 'outcome' | 'planning' | 'report' | 'debrief';
    work: WorkAssignment[];
    completed: Record<string, number>;
    disabledEquipment: Partial<Record<StationEquipmentId, true>>;
    dutyStreak: Record<string, number>;
    fieldPair: string[];
    rover: Rover | null;
    hours: number;
    returnedWithData: boolean;
    shelter: 'off' | 'essential' | 'full';
    briefing: SurveyBriefing;
    stormBriefing: SurveyBriefing | null;
    outcome: string[];
    reportSol: number;
    briefingCommitted: boolean;
    recentSystems: string[];
}

export type TharsisState = OutpostGameState & { tharsis: TharsisRun };
export type Area = 'station' | 'rover';

export function createTharsis(state: OutpostGameState, seed: number): TharsisRun {
    const run: TharsisRun = {
        seed: seed >>> 0, stormStart: 8 + (seed >>> 0) % 3, phase: 'briefing', work: [], completed: {},
        disabledEquipment: {}, dutyStreak: {},
        fieldPair: [], rover: null, hours: 0, returnedWithData: false, shelter: 'off',
        briefing: authoredBriefing(1, 'station', seed, null), stormBriefing: null, outcome: [], reportSol: 0,
        briefingCommitted: true, recentSystems: [],
    };
    state.currentEvent = null;
    state.lastEventTitle = run.briefing.title;
    state.dailyLog = state.dailyLog.filter(entry => entry.kind !== 'event');
    syncMorale(state.crew, state.conditions);
    applyForecast(state, run);
    return run;
}

function forecast(run: TharsisRun, sol: number): WeatherForecast {
    if (sol >= run.stormStart && sol < run.stormStart + 3) return { weather: 'Dust Storm', temperatureC: -76, radiationRisk: 'High' };
    if (sol === run.stormStart - 1) return { weather: 'Dust Haze', temperatureC: -64, radiationRisk: 'Low' };
    return { weather: 'Clear', temperatureC: -58, radiationRisk: 'Low' };
}

export function applyForecast(state: OutpostGameState, run: TharsisRun): void {
    const today = forecast(run, state.sol);
    state.conditions.weather = today.weather;
    state.conditions.temperatureC = today.temperatureC;
    state.tomorrowForecast = state.sol === run.stormStart - 1 ? today : forecast(run, state.sol + 1);
    if (run.rover) {
        run.rover.conditions.weather = today.weather;
        run.rover.conditions.temperatureC = today.temperatureC;
    }
}

export function stormDay(state: TharsisState, sol = state.sol): number {
    const day = sol - state.tharsis.stormStart + 1;
    return day >= 1 && day <= 3 ? day : 0;
}

export function roverPosition(state: TharsisState): number {
    const rover = state.tharsis.rover;
    return rover ? clamp(rover.distance / rover.legLength, 0, 1) : 0;
}

export function localArea(state: TharsisState, area: Area) {
    const rover = state.tharsis.rover;
    if (area === 'station') return { resources: state.resources, cargo: state.cargo, crew: stationCrew(state), conditions: state.conditions };
    if (rover) return { ...rover, crew: state.crew.filter(member => rover.crewIds.includes(member.id)) };
    return null;
}

export function useLocalCargo(state: TharsisState, area: Area, id: CargoItemId): string | null {
    const local = localArea(state, area);
    if (state.phase !== 'planning' || !local) return 'Use supplies from an open planning console.';
    const item = CARGO_BY_ID[id];
    if (!item || local.cargo[id] <= 0) return 'Out of stock at this location.';
    if (id === 'windSampler') return 'The Wind Sampler is reserved for Site A.';
    local.cargo[id]--;
    applyResourceDelta(local.resources, item.resources ?? {});
    if (item.morale) changeAreaMorale(local.crew, local.conditions, item.morale);
    local.conditions.radiation = clamp(local.conditions.radiation + (item.radiation ?? 0), 0, 100);
    if (item.crewHealth) for (const member of local.crew) if (member.health > 0) member.health = clamp(member.health + item.crewHealth, 0, 100);
    appendLog(state, 'good', `${area === 'station' ? 'Station' : 'Rover'} used ${item.name} · ${item.effect}.`);
    return null;
}

export function fieldCrew(state: TharsisState): CrewMember[] {
    const ids = state.tharsis.rover?.crewIds ?? state.tharsis.fieldPair;
    return state.crew.filter(member => ids.includes(member.id));
}

export function tripPlan(state: TharsisState) {
    const leg = fieldCrew(state).some(member => member.role === 'pilot' && member.health > 0) ? 1 : 2;
    const sols = leg * 2 + 2;
    const cleanCost: ResourcePool = { ...EMPTY_POOLS };
    for (const [key, amount] of resourceEntries(ROVER_UPKEEP)) cleanCost[key] = amount * sols;
    return { leg, sols, cleanCost, returnSol: state.sol + sols - 1, latest: state.goal.deadlineSol - sols + 1 };
}

export function fieldReturnEstimate(state: TharsisState): number | null {
    const { rover, hours } = state.tharsis;
    if (!rover) return null;
    const sampling = rover.phase === 'site' ? 2 - hours / 24 : 2;
    const remaining = rover.phase === 'returning' ? rover.travelLeft : sampling + rover.legLength + (rover.phase === 'outbound' ? rover.travelLeft : 0);
    return state.sol + remaining - 1;
}

export function defaultLoad(state: TharsisState): RoverLoad {
    const resources = tripPlan(state).cleanCost;
    return { resources: { ...resources, oxygen: resources.oxygen + 1 }, cargo: { ...EMPTY_CARGO, windSampler: 1 } };
}

export function loadSlots(load: RoverLoad): number {
    return resourceEntries(load.resources).reduce((sum, [key, amount]) => sum + Math.ceil(amount / PACK_UNITS[key]), 0) +
        CARGO_ITEMS.reduce((sum, item) => sum + load.cargo[item.id] * item.cells.length, 0);
}

export function dispatchProblem(state: TharsisState, load: RoverLoad): string | null {
    const run = state.tharsis;
    if (state.phase !== 'planning') return 'Dispatch during planning.';
    if (run.rover) return 'The rover is already in the field.';
    if (run.returnedWithData) return 'The data drive is already docked. Restore station reserves.';
    const pair = fieldCrew(state);
    if (pair.length !== 2 || pair.some(member => member.health < 40)) return 'Select two travelers with at least 40 health.';
    const missing = CHECKLIST.find(check => check.orders.some(id => !run.completed[id]));
    if (missing) return `Complete the ${missing.label.toLowerCase()} checks first.`;
    const trip = tripPlan(state);
    if (state.sol > trip.latest) return `A clean trip needs ${trip.sols} Sols. Latest departure: Sol ${trip.latest}.`;
    if (load.cargo.windSampler !== 1) return 'Load the Wind Sampler.';
    for (const [key] of resourceEntries(EMPTY_POOLS)) {
        const value = load.resources[key];
        if (!Number.isSafeInteger(value) || value < 0 || value > state.resources[key]) return `Set ${RESOURCE_LABELS[key]} within available station stock.`;
    }
    for (const item of CARGO_ITEMS) {
        const count = load.cargo[item.id];
        if (!Number.isSafeInteger(count) || count < 0 || count > state.cargo[item.id]) return `Invalid quantity or insufficient stock for ${item.name}.`;
    }
    if (loadSlots(load) > ROVER_SLOTS) return `Load exceeds ${ROVER_SLOTS} slots.`;
    const available = { ...load.resources };
    for (const item of CARGO_ITEMS) {
        for (const [key, amount] of resourceEntries(item.resources)) available[key] += amount * load.cargo[item.id];
    }
    if (!canAffordCost(available, { ...trip.cleanCost, oxygen: trip.cleanCost.oxygen + 1 })) return 'Load clean-trip supplies plus at least 1 O₂ for docking.';
    return null;
}

export function dispatchRover(state: TharsisState, load: RoverLoad): string | null {
    const reason = dispatchProblem(state, load);
    if (reason) return reason;
    const run = state.tharsis;
    const { leg } = tripPlan(state);
    spend(state.resources, load.resources);
    for (const item of CARGO_ITEMS) state.cargo[item.id] -= load.cargo[item.id];
    for (const job of run.work) if (job.leadId && run.fieldPair.includes(job.leadId)) job.leadId = null;
    run.hours = 0;
    run.rover = {
        resources: { ...load.resources }, cargo: { ...load.cargo }, crewIds: [...run.fieldPair], phase: 'outbound',
        legLength: leg, travelLeft: leg, distance: 0, conditions: { ...state.conditions }, interrupted: false,
    };
    syncMorale(fieldCrew(state), run.rover.conditions);
    syncMorale(stationCrew(state), state.conditions);
    appendLog(state, 'info', `Rover dispatched for Site A · ${leg} Sol${leg === 1 ? '' : 's'} per travel leg.`);
    return null;
}

export function emergencyReturn(state: TharsisState): string | null {
    const rover = state.tharsis.rover;
    if (state.phase !== 'planning' || !rover || rover.phase === 'returning') return 'No field trip can turn back now.';
    rover.phase = 'returning';
    rover.travelLeft = Math.max(1, rover.distance);
    state.tharsis.hours = 0;
    appendLog(state, 'warn', 'Emergency return ordered. The partial data window was cleared.');
    return null;
}

function syncMorale(crew: readonly CrewMember[], conditions: ConditionState): void {
    const alive = crew.filter(member => member.health > 0);
    conditions.morale = alive.length ? round1(alive.reduce((sum, member) => sum + member.morale, 0) / alive.length) : 0;
}

export function changeAreaMorale(crew: readonly CrewMember[], conditions: ConditionState, delta: number): void {
    for (const member of crew) if (member.health > 0) member.morale = clamp(round1(member.morale + delta), 0, 100);
    syncMorale(crew, conditions);
}

function applyDutyMorale(state: TharsisState, crew: readonly CrewMember[], conditions: ConditionState, worked: ReadonlySet<string>, area: string, report: string[]): void {
    const { dutyStreak } = state.tharsis;
    const gains: string[] = [];
    for (const member of crew) {
        if (member.health <= 0) continue;
        const active = worked.has(member.id);
        const streak = active ? (dutyStreak[member.id] ?? 0) + 1 : 0;
        dutyStreak[member.id] = streak;
        const delta = active ? -Math.min(5, 2 * (streak - 1)) * state.skillModifiers.moraleDecayMult : 7;
        const updated = clamp(round1(member.morale + delta), 0, 100);
        const measured = round1(updated - member.morale);
        member.morale = updated;
        if (measured) gains.push(`${member.name.split(' ')[0]} ${measured > 0 ? '+' : ''}${measured}${active ? ` (${streak} on duty)` : ' (rest)'}`);
    }
    syncMorale(crew, conditions);
    if (gains.length) report.push(`${area} Morale · ${gains.join(' · ')}.`);
}

function degradeArea(crew: CrewMember[], conditions: ConditionState, resources: ResourcePool, shortOnSupplies = false) {
    if (conditions.radiation >= 50 || resources.oxygen <= 0 || shortOnSupplies) {
        for (const member of crew) if (member.health > 0) member.health = clamp(member.health - (conditions.radiation >= 50 ? 5 : 10), 0, 100);
        changeAreaMorale(crew, conditions, -4);
    }
}

function stationBudget(state: TharsisState, day: number) {
    const { conditions, skillModifiers: mods } = state;
    const count = stationCrew(state).filter(member => member.health > 0).length;
    const sheltered = state.tharsis.shelter !== 'off';
    const solar = (day ? 1 : conditions.weather === 'Dust Haze' ? 6 : 8) * mods.solarOutputMult *
        (state.tharsis.disabledEquipment['auxiliary-solar'] ? 0.65 : 1);
    const stormPower = state.tharsis.shelter === 'full' ? 1 : sheltered ? 5 : 9;
    const energy = (4 + (day ? stormPower : 0)) * mods.energyConsumptionMult;
    const oxygen = (2 + count * 0.5 + (day ? 2 : 0)) * mods.oxygenConsumptionMult;
    const food = count * (state.rationPolicy === 'full' ? 1 : 0.5) * mods.foodConsumptionMult;
    return { passive: { ...EMPTY_POOLS, energy: solar }, upkeep: { energy, oxygen, food, water: count * 0.9 * mods.waterConsumptionMult, res: 0 } };
}

function applyStationResources(state: TharsisState, budget: ReturnType<typeof stationBudget>): void {
    const { passive, upkeep } = budget;
    applyResourceDelta(state.resources, {
        energy: passive.energy - upkeep.energy, oxygen: -upkeep.oxygen, food: -upkeep.food, water: -upkeep.water,
    });
}

function roverBudget(state: TharsisState, day: number): ResourcePool {
    if (!day) return { ...ROVER_UPKEEP };
    return { ...ROVER_UPKEEP, energy: state.tharsis.completed.harden ? ROVER_UPKEEP.energy + STORM_DRAW.energy : 2,
        oxygen: ROVER_UPKEEP.oxygen + STORM_DRAW.oxygen };
}

export function resourceForecast(state: TharsisState, area: Area) {
    const day = stormDay(state);
    if (area === 'rover' && state.tharsis.rover) {
        return { passive: { ...EMPTY_POOLS }, upkeep: roverBudget(state, day), tasks: [] as WorkFlow[] };
    }
    const budget = stationBudget(state, day);
    const predicted = structuredClone(state);
    const tasks: WorkFlow[] = [];
    applyStationResources(predicted, budget);
    advanceWork(predicted, day > 0, [], tasks);
    return { ...budget, tasks };
}

function stationUpkeep(state: TharsisState, day: number, report: string[]): void {
    const { resources, conditions, skillModifiers: mods } = state;
    const crew = stationCrew(state);
    const sheltered = state.tharsis.shelter !== 'off';
    const shielded = day > 0 && sheltered && Boolean(state.tharsis.completed.shield);
    const budget = stationBudget(state, day);
    const before = { ...resources };
    applyStationResources(state, budget);
    if (day) {
        const exposure = (state.tharsis.shelter === 'full' ? shielded ? 2 : 4 : shielded ? 4 : sheltered ? 10 : 23) * (1 - mods.radiationShielding);
        conditions.radiation = clamp(round1(conditions.radiation + exposure), 0, 100);
        report.push(`Storm ${day}/3 · station radiation +${round1(exposure)} mSv${shielded ? ' with shelter shielding' : ''}.`);
    } else {
        conditions.radiation = Math.max(0, round1(conditions.radiation - 2));
    }
    if (state.rationPolicy === 'half') changeAreaMorale(crew, conditions, -2.5 * mods.moraleDecayMult);
    report.push(`Station upkeep · ${resourceChanges(before, resources) || 'no usable stock'}.`);
}

export function cycleShelter(state: TharsisState): string {
    const run = state.tharsis;
    if (run.shelter === 'off') {
        run.shelter = 'essential';
        return 'Essential mode keeps indoor work operating at reduced power and exposure.';
    }
    if (run.shelter === 'essential') {
        run.shelter = 'full';
        return 'Full shelter minimizes exposure and pauses nonessential work on storm Sols.';
    }
    run.shelter = 'off';
    return 'Standard station operations restored.';
}

function advanceRover(state: TharsisState, day: number, report: string[]): string | null {
    const run = state.tharsis;
    const rover = run.rover;
    if (!rover) return null;
    const crew = fieldCrew(state);
    const hardened = Boolean(run.completed.harden);
    const restricted = day > 0 && !hardened;
    const cost = roverBudget(state, day);
    const funded = canAffordCost(rover.resources, cost);
    const before = { ...rover.resources };
    spend(rover.resources, cost);
    const exposure = day ? round1((hardened ? 5 : 25) * (1 - state.skillModifiers.radiationShielding)) : 0;
    if (day) rover.conditions.radiation = clamp(rover.conditions.radiation + exposure, 0, 100);
    degradeArea(crew, rover.conditions, rover.resources, !funded);
    for (const member of crew) if (member.health > 0) member.stamina = clamp(member.stamina - (restricted ? 2 : 7), 20, 100);
    report.push(`Rover upkeep · ${resourceChanges(before, rover.resources, true) || 'no usable stock'}${day ? ` · radiation +${exposure} mSv` : ''}.`);
    if (rover.conditions.radiation >= 100 || crew.some(member => member.health <= 0) || rover.resources.oxygen <= 0) {
        return 'The field team lost life support or suffered a critical exposure before docking.';
    }
    const hold = restricted ? 'crew sheltering in the dust storm' : !funded ? 'insufficient field supplies' :
        rover.interrupted ? 'field systems required a reset' : crew.some(member => member.health < 40) ? 'field crew needs treatment' :
        rover.phase === 'site' && !rover.cargo.windSampler ? 'Wind Sampler missing' : null;
    applyDutyMorale(state, crew, rover.conditions, new Set(hold ? [] : rover.crewIds), 'Rover', report);
    if (rover.conditions.morale <= 0) return 'Field crew Morale collapsed before docking.';
    rover.interrupted = false;
    if (hold) {
        if (rover.phase === 'site' && run.hours > 0) {
            run.hours = 0;
            report.push('The interrupted survey window reset to 0h.');
        }
        report.push(`Rover held · ${hold}.`);
        return null;
    }
    if (rover.phase === 'site') {
        run.hours += 24;
        report.push(`Site A · ${run.hours}/48 consecutive hours recorded.`);
        if (run.hours === 48) {
            rover.phase = 'returning';
            rover.travelLeft = rover.legLength;
        }
        return null;
    }
    rover.travelLeft--;
    rover.distance += rover.phase === 'outbound' ? 1 : -1;
    if (rover.travelLeft > 0) {
        report.push(`Rover ${rover.phase} · ${rover.travelLeft} Sol remaining on this leg.`);
        return null;
    }
    if (rover.phase === 'outbound') {
        rover.phase = 'site';
        report.push('Rover arrived at Site A. The first collection shift starts next Sol.');
        return null;
    }
    applyResourceDelta(state.resources, rover.resources);
    for (const item of CARGO_ITEMS) state.cargo[item.id] += rover.cargo[item.id];
    run.returnedWithData = run.hours === 48;
    run.fieldPair = [...rover.crewIds];
    run.rover = null;
    syncMorale(state.crew, state.conditions);
    report.push(run.returnedWithData ? 'Rover docked with the crew and the complete data drive.' : 'Rover docked after an emergency return.');
    if (resourceEntries(rover.resources).some(([, amount]) => amount > 0)) report.push(`Rover stock returned to the station · ${resourceChanges(EMPTY_POOLS, rover.resources)}.`);
    return null;
}

export function completionShortfalls(state: TharsisState): string[] {
    return resourceEntries(state.goal.minimumReserves).filter(([key, amount]) => state.resources[key] < amount)
        .map(([key, amount]) => `${formatResource(key, state.resources[key])} / ${formatResource(key, amount)}`);
}

export function resolveTharsisSol(state: TharsisState, report: string[]) {
    const day = stormDay(state);
    stationUpkeep(state, day, report);
    const { completed, worked } = advanceWork(state, day > 0, report);
    const crew = stationCrew(state);
    applyDutyMorale(state, crew, state.conditions, worked, 'Station', report);
    degradeArea(crew, state.conditions, state.resources, state.resources.food <= 0 || state.resources.water <= 0);
    const fieldFailure = advanceRover(state, day, report);
    const missing = completionShortfalls(state);
    if (day && !state.resources.energy) {
        changeAreaMorale(stationCrew(state), state.conditions, -8);
        report.push('Station batteries depleted. Life-support circuits are running on emergency power.');
    }
    const collapse = fieldFailure ?? (state.conditions.radiation >= 100 ? 'Station radiation reached the emergency abort threshold.' :
        state.resources.oxygen <= 0 ? 'Station oxygen reached zero.' : state.conditions.morale <= 0 ? 'Station morale collapsed.' :
        stationCrew(state).every(member => member.health <= 0) ? 'The station crew was incapacitated.' : null);
    if (!collapse && state.tharsis.returnedWithData && !missing.length) state.goal.completed = true;
    if (!state.goal.completed && state.tharsis.returnedWithData && missing.length) report.push(`Docked · restore reserves: ${missing.join(', ')}.`);
    return { completed, collapse };
}
