import type { CargoInventory, CargoItemId, ConditionState, CrewMember, ResourcePool } from '../contracts/gameContract';
import { CARGO_BY_ID, CARGO_ITEMS, normalizeCargo } from '../data/cargo';
import type { StationEquipmentId } from '../data/tharsisEquipment';
import { formatResource, resourceEntries, RESOURCE_LABELS } from '../data/missions';
import { CHECKLIST } from '../data/tharsisOrders';
import { expeditionOf, hazardWeather, INSTRUMENTS, type Expedition, type ExpeditionId } from '../data/expeditions';
import type { OutpostGameState, WeatherForecast } from './solEngine';
import { appendLog, applyResourceDelta, canAffordCost, clamp, resourceChanges, round1, spend } from './stateOps';
import { dutyMoraleLoss, FIELD_REST_MORALE, heatingPower, radiationAfterDose, radiationEffects, REST_MORALE } from './tharsisConditions';
import { advanceWork, stationCrew, type WorkAssignment, type WorkFlow } from './tharsisWork';
import { authoredBriefing, type SurveyBriefing } from './tharsisEvents';

export const ROVER_SLOTS = 20;
export const PACK_UNITS: ResourcePool = { food: 4, water: 4, oxygen: 6, energy: 8, res: 4 };
export const ROVER_UPKEEP: ResourcePool = { food: 2, water: 2, oxygen: 3, energy: 4, res: 0 };
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
    resting: boolean;
}

export interface TharsisRun {
    /** Which expedition profile this run uses (site, instrument, hazard...). */
    expedition: ExpeditionId;
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

export function expeditionFor(state: TharsisState): Expedition {
    return expeditionOf(state.tharsis.expedition);
}

/** Survey Sols at the site (the survey is counted in whole Sols of 24 hours). */
export function surveySols(state: TharsisState): number {
    return expeditionFor(state).surveyHours / 24;
}

export function createTharsis(state: OutpostGameState, seed: number, id: ExpeditionId = 'tharsis'): TharsisRun {
    const expedition = expeditionOf(id);
    const run: TharsisRun = {
        expedition: id,
        seed: seed >>> 0, stormStart: expedition.hazard.firstSol + (seed >>> 0) % expedition.hazard.spread, phase: 'briefing', work: [], completed: {},
        disabledEquipment: {}, dutyStreak: {},
        fieldPair: [], rover: null, hours: 0, returnedWithData: false, shelter: 'off',
        briefing: authoredBriefing(1, 'station', seed, null, expedition, state.goal.deadlineSol), stormBriefing: null, outcome: [], reportSol: 0,
        briefingCommitted: true, recentSystems: [],
    };
    state.lastEventTitle = run.briefing.title;
    state.dailyLog = state.dailyLog.filter(entry => entry.kind !== 'event');
    syncMorale(state.crew, state.conditions);
    applyForecast(state, run);
    return run;
}

function forecast(run: TharsisRun, sol: number, start = run.stormStart): WeatherForecast {
    const expedition = expeditionOf(run.expedition);
    const { temperature } = expedition;
    const weather = hazardWeather(expedition);
    if (hazardDay(start, sol)) return { weather: weather.hazard, temperatureC: temperature.hazard, radiationRisk: 'High' };
    if (sol === start - 1) return { weather: weather.warning, temperatureC: temperature.warning, radiationRisk: 'Moderate' };
    return { weather: 'Clear', temperatureC: temperature.clear, radiationRisk: 'Low' };
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
    return hazardDay(state.tharsis.stormStart, sol);
}

function hazardDay(start: number, sol: number): number {
    const day = sol - start + 1;
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
    if (INSTRUMENTS.includes(id)) return `The ${item.name} is reserved for ${expeditionFor(state).site}.`;
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
    const { legs, temperature } = expeditionFor(state);
    const hasPilot = fieldCrew(state).some(member => member.role === 'pilot' && member.health > 0);
    const leg = hasPilot ? legs.pilot : legs.backup;
    const sols = leg * 2 + surveySols(state);
    const perSol = { ...ROVER_UPKEEP, energy: ROVER_UPKEEP.energy + heatingPower(temperature.clear) };
    const cleanCost: ResourcePool = { ...EMPTY_POOLS };
    for (const [key, amount] of resourceEntries(perSol)) cleanCost[key] = amount * sols;
    return { hasPilot, leg, sols, perSol, cleanCost, returnSol: state.sol + sols - 1, latest: state.goal.deadlineSol - sols + 1 };
}

export function fieldReturnEstimate(state: TharsisState): number | null {
    const run = state.tharsis;
    const { rover, hours, stormStart } = run;
    if (!rover) return null;

    // Project the route with visible weather. Supplies, treatment, and future decisions can change the trip.
    const knownStormStart = rover.conditions.weather === 'Dust Haze' || state.sol >= stormStart ? stormStart : Infinity;
    const pausedToday = rover.resting || restsForMorale(state) || rover.interrupted;
    const requiredSamples = rover.phase === 'returning' ? 0 : surveySols(state);
    let samples = rover.phase === 'site' ? hours / 24 : 0;
    let outbound = rover.phase === 'outbound' ? rover.travelLeft : 0;
    let inbound = rover.phase === 'returning' ? rover.travelLeft : rover.legLength;
    let radiation = rover.conditions.radiation;
    let sol = state.sol;
    while (outbound > 0 || samples < requiredSamples || inbound > 0) {
        const day = hazardDay(knownStormStart, sol);
        const { dose, restricted } = roverBudget(state, forecast(run, sol, knownStormStart), day, false);
        radiation = radiationAfterDose(radiation, dose);
        if (radiation >= 100) return null;
        const sampling = outbound === 0 && samples < requiredSamples;
        const paused = restricted || (sol === state.sol && pausedToday);
        if (paused || (sampling && radiationEffects(radiation).exteriorHold)) {
            if (sampling) samples = 0;
        } else if (outbound > 0) outbound--;
        else if (sampling) samples++;
        else inbound--;
        sol++;
    }
    return sol - 1;
}

export function defaultLoad(state: TharsisState): RoverLoad {
    const resources = tripPlan(state).cleanCost;
    return { resources: { ...resources, oxygen: resources.oxygen + 1 }, cargo: { ...EMPTY_CARGO, [expeditionFor(state).instrument]: 1 } };
}

export function loadSlots(load: RoverLoad): number {
    return resourceEntries(load.resources).reduce((sum, [key, amount]) => sum + Math.ceil(amount / PACK_UNITS[key]), 0) +
        CARGO_ITEMS.reduce((sum, item) => sum + load.cargo[item.id] * item.cells.length, 0);
}

export function roverLoadStock(load: RoverLoad): ResourcePool {
    const stock = { ...load.resources };
    for (const item of CARGO_ITEMS) {
        for (const [key, amount] of resourceEntries(item.resources)) stock[key] += amount * load.cargo[item.id];
    }
    return stock;
}

export function dispatchProblem(state: TharsisState, load: RoverLoad): string | null {
    const run = state.tharsis;
    if (state.phase !== 'planning') return 'Dispatch during planning.';
    if (run.rover) return 'The rover is already in the field.';
    if (run.returnedWithData) return 'The data drive is already docked. Restore station reserves.';
    const pair = fieldCrew(state);
    if (pair.length !== 2 || pair.some(member => member.health < 40)) return 'Select two travelers with at least 40 health.';
    if (pair.some(member => member.morale < FIELD_REST_MORALE)) return `Travelers need at least ${FIELD_REST_MORALE}% Morale. Give them a Sol off duty.`;
    const missing = CHECKLIST.find(check => check.orders.some(id => !run.completed[id]));
    if (missing) return `Complete the ${missing.label.toLowerCase()} checks first.`;
    const trip = tripPlan(state);
    if (state.sol > trip.latest) return `A clean trip needs ${trip.sols} Sols. Latest departure: Sol ${trip.latest}.`;
    const { instrument } = expeditionFor(state);
    if (load.cargo[instrument] !== 1) return `Load the ${CARGO_BY_ID[instrument].name}.`;
    for (const [key] of resourceEntries(EMPTY_POOLS)) {
        const value = load.resources[key];
        if (!Number.isSafeInteger(value) || value < 0 || value > state.resources[key]) return `Set ${RESOURCE_LABELS[key]} within available station stock.`;
    }
    for (const item of CARGO_ITEMS) {
        const count = load.cargo[item.id];
        if (!Number.isSafeInteger(count) || count < 0 || count > state.cargo[item.id]) return `Invalid quantity or insufficient stock for ${item.name}.`;
    }
    if (loadSlots(load) > ROVER_SLOTS) return `Load exceeds ${ROVER_SLOTS} slots.`;
    if (!canAffordCost(roverLoadStock(load), { ...trip.cleanCost, oxygen: trip.cleanCost.oxygen + 1 })) return 'Load clean-trip supplies plus at least 1 O₂ for docking.';
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
        legLength: leg, travelLeft: leg, distance: 0, conditions: { ...state.conditions }, interrupted: false, resting: false,
    };
    syncMorale(fieldCrew(state), run.rover.conditions);
    syncMorale(stationCrew(state), state.conditions);
    appendLog(state, 'info', `Rover dispatched for ${expeditionFor(state).site} · ${leg} Sol${leg === 1 ? '' : 's'} per travel leg.`);
    return null;
}

export function emergencyReturn(state: TharsisState): string | null {
    const rover = state.tharsis.rover;
    if (state.phase !== 'planning' || !rover || rover.phase === 'returning') return 'No field trip can turn back now.';
    rover.phase = 'returning';
    rover.travelLeft = Math.max(1, rover.distance);
    rover.resting = false;
    state.tharsis.hours = 0;
    appendLog(state, 'warn', 'Emergency return ordered. The partial data window was cleared.');
    return null;
}

export function toggleFieldRest(state: TharsisState): string | null {
    const rover = state.tharsis.rover;
    if (state.phase !== 'planning' || !rover) return 'Order field rest while the rover is away.';
    rover.resting = !rover.resting;
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
        const delta = active ? -dutyMoraleLoss(streak) * state.skillModifiers.moraleDecayMult : REST_MORALE;
        const updated = clamp(round1(member.morale + delta), 0, 100);
        const measured = round1(updated - member.morale);
        member.morale = updated;
        if (measured) gains.push(`${member.name.split(' ')[0]} ${measured > 0 ? '+' : ''}${measured}${active ? ` (${streak} on duty)` : ' (rest)'}`);
    }
    syncMorale(crew, conditions);
    if (gains.length) report.push(`${area} Morale · ${gains.join(' · ')}.`);
}

function degradeArea(state: TharsisState, crew: CrewMember[], conditions: ConditionState, shortOnSupplies: boolean, unheated: boolean, area: string, report: string[]) {
    const radiation = radiationEffects(conditions.radiation);
    const health = radiation.health + (unheated ? 14 : shortOnSupplies ? 10 : 0);
    const morale = radiation.morale + (unheated ? 10 : shortOnSupplies ? 6 : 0);
    if (!health) return;
    for (const member of crew) if (member.health > 0) member.health = clamp(member.health - health, 0, 100);
    const loss = round1(morale * state.skillModifiers.moraleDecayMult);
    changeAreaMorale(crew, conditions, -loss);
    const reasons = [radiation.health && `${radiation.level.toLowerCase()} radiation`, unheated && 'insufficient heating power',
        shortOnSupplies && !unheated && 'life-support shortage'].filter(Boolean).join(' and ');
    report.push(`${area} crew · ${reasons} · −${health} HP and −${loss} Morale per living crew member.`);
}

function doseChange(state: TharsisState, day: number, base: number, recovery: number): number {
    if (!day) return -recovery;
    const peak = day === 2 ? 1.4 : day === 3 ? 0.9 : 1;
    return round1(base * peak * expeditionFor(state).hazard.exposure * (1 - state.skillModifiers.radiationShielding));
}

interface DailyBudget {
    passive: ResourcePool;
    upkeep: ResourcePool;
    heating: number;
    filterPower: number;
    filterOxygen: number;
    dose: number;
}

function stationBudget(state: TharsisState): DailyBudget {
    const { conditions, skillModifiers: mods } = state;
    const count = stationCrew(state).filter(member => member.health > 0).length;
    const { shelter, completed, disabledEquipment } = state.tharsis;
    const day = stormDay(state);
    const dust = conditions.weather === 'Dust Storm';
    const haze = conditions.weather === 'Dust Haze';
    const dustSolar = day === 2 ? 0 : day === 3 ? 3 : 2;
    const solar = (dust ? dustSolar : haze ? 4 : 8) * mods.solarOutputMult *
        (disabledEquipment['auxiliary-solar'] ? 0.65 : 1);
    const heating = round1(heatingPower(conditions.temperatureC) * mods.energyConsumptionMult);
    const filterPower = round1((dust ? day === 2 ? 5 : 3 : haze ? 1 : 0) * mods.energyConsumptionMult);
    const filterOxygen = round1((dust ? day === 2 ? 3 : 2 : haze ? 1 : 0) * mods.oxygenConsumptionMult);
    const stormPower = dust ? shelter === 'off' ? 7 : shelter === 'essential' ? 2 : 0 : 0;
    const energy = round1((4 + stormPower) * mods.energyConsumptionMult + filterPower + heating);
    const oxygen = round1((2 + count * 0.5) * mods.oxygenConsumptionMult + filterOxygen);
    const food = count * (state.rationPolicy === 'full' ? 1 : 0.5) * mods.foodConsumptionMult;
    const shielded = Boolean(completed.shield);
    const dose = doseChange(state, day, shelter === 'off' ? 25 : shelter === 'essential' ? shielded ? 4 : 12 : shielded ? 2 : 5, 3);
    const upkeep = { energy, oxygen, food: round1(food), water: round1(count * 0.9 * mods.waterConsumptionMult), res: 0 };
    return { passive: { ...EMPTY_POOLS, energy: round1(solar) }, upkeep, heating, filterPower, filterOxygen, dose };
}

function roverBudget(state: TharsisState, weather: WeatherForecast, day: number, resting: boolean): DailyBudget & { restricted: boolean } {
    const hardened = Boolean(state.tharsis.completed.harden);
    const restricted = day > 0 && !hardened;
    const clearHeat = heatingPower(expeditionFor(state).temperature.clear);
    const heat = heatingPower(weather.temperatureC);
    const heating = hardened ? clearHeat + Math.ceil((heat - clearHeat) / 2) : heat;
    const dust = weather.weather === 'Dust Storm';
    const haze = weather.weather === 'Dust Haze';
    const filterPower = dust && !restricted ? day === 2 ? 3 : 2 : 0;
    const filterOxygen = dust ? day === 2 ? 3 : 2 : haze ? 1 : 0;
    const monitoring = weather.weather === 'Solar Flare' && hardened ? 1 : 0;
    const energy = (restricted || resting ? 2 : ROVER_UPKEEP.energy) + heating + filterPower + monitoring;
    const dose = doseChange(state, day, hardened ? 5 : dust ? 22 : 25, 2);
    const upkeep = { ...ROVER_UPKEEP, energy, oxygen: ROVER_UPKEEP.oxygen + filterOxygen };
    return { passive: { ...EMPTY_POOLS }, upkeep, heating, filterPower, filterOxygen, dose, restricted };
}

export function peakRoverBudget(state: TharsisState) {
    return roverBudget(state, forecast(state.tharsis, state.tharsis.stormStart + 1), 2, false);
}

/** Reserve for the worst overlap until the crew can see the first storm warning. */
export function stormReserve(state: TharsisState) {
    const run = state.tharsis;
    const reserve = { energy: 0, oxygen: 0 };
    if (!run.completed.harden) return reserve;
    const { hazard } = expeditionFor(state);
    const warned = state.sol >= run.stormStart - 1;
    const firstStart = warned ? run.stormStart : Math.max(hazard.firstSol, state.sol + 2);
    const lastStart = warned ? run.stormStart : hazard.firstSol + hazard.spread - 1;
    const trip = tripPlan(state);
    for (let start = firstStart; start <= lastStart; start++) {
        const extra = { energy: 0, oxygen: 0 };
        for (let sol = Math.max(state.sol, start - 1); sol <= Math.min(trip.returnSol, start + 2); sol++) {
            const { upkeep } = roverBudget(state, forecast(run, sol, start), hazardDay(start, sol), false);
            extra.energy += upkeep.energy - trip.perSol.energy;
            extra.oxygen += upkeep.oxygen - trip.perSol.oxygen;
        }
        reserve.energy = Math.max(reserve.energy, extra.energy);
        reserve.oxygen = Math.max(reserve.oxygen, extra.oxygen);
    }
    return reserve;
}

function restsForMorale(state: TharsisState): boolean {
    return fieldCrew(state).some(member => member.morale < FIELD_REST_MORALE);
}

export function localBudget(state: TharsisState, area: Area): DailyBudget {
    const rover = state.tharsis.rover;
    return area === 'rover' && rover
        ? roverBudget(state, forecast(state.tharsis, state.sol), stormDay(state), rover.resting || restsForMorale(state))
        : stationBudget(state);
}

export function resourceForecast(state: TharsisState, area: Area) {
    const budget = localBudget(state, area);
    const tasks: WorkFlow[] = [];
    if (area === 'rover' && state.tharsis.rover) {
        return { ...budget, tasks };
    }
    const predicted = structuredClone(state);
    const unheated = stationUpkeep(predicted, budget, []);
    advanceWork(predicted, { storm: stormDay(state) > 0, unheated }, [], tasks);
    return { ...budget, tasks };
}

function stationUpkeep(state: TharsisState, budget: DailyBudget, report: string[]): boolean {
    const { resources, conditions, skillModifiers: mods } = state;
    const { passive, upkeep, heating, filterPower, filterOxygen, dose } = budget;
    const day = stormDay(state);
    const before = { ...resources };
    const unheated = heating > 0 && round1(resources.energy + passive.energy) < upkeep.energy;
    applyResourceDelta(resources, { energy: passive.energy - upkeep.energy, oxygen: -upkeep.oxygen, food: -upkeep.food, water: -upkeep.water });
    conditions.radiation = radiationAfterDose(conditions.radiation, dose);
    if (day) {
        report.push(`Storm ${day}/3 · ${conditions.weather} · station radiation +${dose} mSv.`);
    }
    if (heating || filterPower || filterOxygen) {
        report.push(`Station climate · ${conditions.temperatureC} °C · heating ${heating} Power · filtration ${filterPower} Power and ${filterOxygen}% O₂ · solar +${passive.energy} Power.`);
    }
    if (state.rationPolicy === 'half') changeAreaMorale(stationCrew(state), conditions, -2.5 * mods.moraleDecayMult);
    report.push(`Station upkeep · ${resourceChanges(before, resources) || 'no usable stock'}.`);
    return unheated;
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
    const lowMorale = restsForMorale(state);
    const resting = rover.resting || lowMorale;
    const { upkeep: cost, heating, filterPower, filterOxygen, dose, restricted } = roverBudget(state, forecast(run, state.sol), day, resting);
    const funded = canAffordCost(rover.resources, cost);
    const unheated = heating > 0 && rover.resources.energy < cost.energy;
    const before = { ...rover.resources };
    spend(rover.resources, cost);
    rover.conditions.radiation = radiationAfterDose(rover.conditions.radiation, dose);
    report.push(`Rover upkeep · ${resourceChanges(before, rover.resources, true) || 'no usable stock'}${day ? ` · radiation +${dose} mSv` : ''}.`);
    if (heating || filterOxygen) {
        report.push(`Rover climate · ${rover.conditions.temperatureC} °C · heating ${heating} Power · filtration ${filterPower} Power and ${filterOxygen} O₂.`);
    }
    degradeArea(state, crew, rover.conditions, !funded || rover.resources.oxygen <= 0, unheated, 'Rover', report);
    if (rover.conditions.radiation >= 100 || crew.some(member => member.health <= 0) || rover.resources.oxygen <= 0) {
        return 'The field team lost life support or suffered a critical exposure before docking.';
    }
    const hold = unheated ? 'insufficient heating power' : !funded ? 'insufficient field supplies' : restricted ? 'crew sheltering through the storm' :
        lowMorale ? 'crew resting due to low Morale' : rover.resting ? 'planned field rest' :
        rover.phase === 'site' && radiationEffects(rover.conditions.radiation).exteriorHold ? 'radiation above field work limit' :
        rover.interrupted ? 'field systems required a reset' : crew.some(member => member.health < 40) ? 'field crew needs treatment' :
        rover.phase === 'site' && !rover.cargo[expeditionFor(state).instrument] ? `${CARGO_BY_ID[expeditionFor(state).instrument].name} missing` : null;
    for (const member of crew) if (member.health > 0) member.stamina = clamp(member.stamina + (hold ? 12 : -7), 20, 100);
    applyDutyMorale(state, crew, rover.conditions, new Set(hold ? [] : rover.crewIds), 'Rover', report);
    if (rover.conditions.morale <= 0) return 'Field crew Morale collapsed before docking.';
    rover.interrupted = false;
    rover.resting = false;
    if (hold) {
        if (rover.phase === 'site' && run.hours > 0) {
            run.hours = 0;
            report.push('The interrupted survey window reset to 0h.');
        }
        report.push(`Rover held · ${hold}.`);
        return null;
    }
    const { site, surveyHours } = expeditionFor(state);
    if (rover.phase === 'site') {
        run.hours += 24;
        report.push(`${capitalize(site)} · ${run.hours}/${surveyHours} consecutive hours recorded.`);
        if (run.hours === surveyHours) {
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
        report.push(`Rover arrived at ${site}. The first collection shift starts next Sol.`);
        return null;
    }
    applyResourceDelta(state.resources, rover.resources);
    for (const item of CARGO_ITEMS) state.cargo[item.id] += rover.cargo[item.id];
    run.returnedWithData = run.hours === surveyHours;
    run.fieldPair = [...rover.crewIds];
    run.rover = null;
    syncMorale(state.crew, state.conditions);
    report.push(run.returnedWithData ? 'Rover docked with the crew and the complete data drive.' : 'Rover docked after an emergency return.');
    if (resourceEntries(rover.resources).some(([, amount]) => amount > 0)) report.push(`Rover stock returned to the station · ${resourceChanges(EMPTY_POOLS, rover.resources)}.`);
    return null;
}

function capitalize(text: string): string {
    return text[0]!.toUpperCase() + text.slice(1);
}

export function completionShortfalls(state: TharsisState): string[] {
    return resourceEntries(state.goal.minimumReserves).filter(([key, amount]) => state.resources[key] < amount)
        .map(([key, amount]) => `${formatResource(key, state.resources[key])} / ${formatResource(key, amount)}`);
}

export function resolveTharsisSol(state: TharsisState, report: string[]) {
    const day = stormDay(state);
    const unheated = stationUpkeep(state, stationBudget(state), report);
    const { completed, worked } = advanceWork(state, { storm: day > 0, unheated }, report);
    const crew = stationCrew(state);
    applyDutyMorale(state, crew, state.conditions, worked, 'Station', report);
    const shortOnSupplies = state.resources.food <= 0 || state.resources.water <= 0 || state.resources.oxygen <= 0;
    degradeArea(state, crew, state.conditions, shortOnSupplies, unheated, 'Station', report);
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
