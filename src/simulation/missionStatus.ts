import { cloneValue, type CargoItemId, type ResourcePool } from '../contracts/gameContract';
import { CARGO_ITEMS } from '../data/cargo';
import { formatResource, missionDeadline } from '../data/missions';
import { expeditionChecklist } from '../data/tharsisOrders';
import { crewAbilityProblem } from './crewAbilities';
import { previewEndSol } from './solEngine';
import { round1, shortfalls } from './stateOps';
import {
    dispatchIssues, dispatchRover, expeditionFor, fieldCrew, fieldReturnEstimate, localArea, localBudget, resourceForecast,
    stormDay, stormWindowKnown, surveySols, travelerReadiness, tripPlan, type Area, type RoverLoad, type TharsisState,
} from './tharsis';
import { radiationAfterDose, radiationEffects } from './tharsisConditions';
import { findOrder, missingPrerequisites, workCompletionEstimate } from './tharsisWork';
import { upgradeProblem } from './tharsisUpgrades';

type Resource = keyof ResourcePool;
export type MissionAction =
    | { label: string; panel: 'roverChecklist' | 'conditions' | 'roverCargo' | 'life' | 'workOrders'; area?: Area }
    | { label: string; panel: 'work'; orderId: string }
    | { label: string; panel: 'cargo'; area: Area; item: CargoItemId }
    | { label: string; panel: 'resources'; area: Area; resource: Resource }
    | { label: string; panel: 'abilities'; memberId: string }
    | { label: string; panel: 'retry' };

export interface MissionNotice {
    message: string;
    actions: MissionAction[];
}

const SUPPLY_ORDERS: Record<Resource, string> = { energy: 'solar', food: 'greens', water: 'water', oxygen: 'air', res: 'spares' };

export function missionWorkTarget(state: TharsisState, orderId: string): string {
    let order = findOrder(state, orderId);
    while (order) {
        const [missing] = missingPrerequisites(state, order);
        if (!missing) return order.id;
        order = findOrder(state, missing);
    }
    return orderId;
}

export function resourceOptions(state: TharsisState, area: Area, key: Resource): MissionAction[] {
    const local = localArea(state, area);
    if (!local || state.phase !== 'planning') return [];
    const options: MissionAction[] = CARGO_ITEMS.filter(item => local.cargo[item.id] > 0 && item.resources?.[key])
        .map(item => ({ label: `Use ${item.name}`, panel: 'cargo', area, item: item.id }));
    if (area === 'rover') return options;
    if (key === 'oxygen' && !upgradeProblem(state, { kind: 'electrolysis' })) {
        options.unshift({ label: 'Run electrolysis', panel: 'resources', area, resource: key });
    }
    if (key === 'energy' && state.tharsis.upgrades.batteryCharged && !upgradeProblem(state, { kind: 'batteryBank' })) {
        options.unshift({ label: 'Discharge Battery Bank', panel: 'resources', area, resource: key });
    }
    if (key === 'oxygen' || key === 'energy') {
        const engineer = local.crew.find(member => member.role === 'engineer' && !crewAbilityProblem(state, 'station', member.id));
        if (engineer) options.push({ label: 'Fabricate a Repair Kit', panel: 'abilities', memberId: engineer.id });
    }
    const order = findOrder(state, SUPPLY_ORDERS[key]);
    const estimate = order && workCompletionEstimate(state, order);
    if (order && estimate !== null && estimate !== undefined) {
        const finish = state.sol + estimate - 1;
        options.push({ label: `${order.title} · Sol ${finish}${finish > missionDeadline(state) ? ' (late)' : ''}`, panel: 'work', orderId: order.id });
    }
    if (key === 'food' && state.rationPolicy === 'full') options.push({ label: 'Review half rations', panel: 'life' });
    if (key === 'energy' && stormDay(state) && state.tharsis.shelter === 'off') options.push({ label: 'Review shelter controls', panel: 'life' });
    const checklist = expeditionChecklist(state.tharsis.expedition);
    const spending = resourceForecast(state, 'station').tasks.find(flow => flow.cost?.[key] && !flow.yield?.[key] &&
        !checklist.some(group => group.orders.includes(flow.orderId)));
    if (spending) options.push({ label: `Review draw · ${spending.title}`, panel: 'work', orderId: spending.orderId });
    return options;
}

function localNotices(state: TharsisState, area: Area, projected: TharsisState): MissionNotice[] {
    const local = localArea(state, area);
    if (!local) return [];
    const title = area === 'station' ? 'Station' : 'Rover';
    const { upkeep, passive, dose } = localBudget(state, area);
    const next = localArea(projected, area);
    const shortages = new Map(shortfalls({
        ...local.resources, energy: round1(local.resources.energy + passive.energy),
    }, area === 'rover' ? { ...upkeep, oxygen: upkeep.oxygen + 1 } : upkeep));
    for (const key of ['food', 'water', 'oxygen'] as const) {
        if (next?.resources[key] === 0 && !shortages.has(key)) shortages.set(key, 0);
    }
    const issues: MissionNotice[] = [...shortages].filter(([key]) =>
        area === 'rover' || !next || next.resources[key] <= 0 || key === 'energy')
        .map(([key, amount]) => ({
            message: amount ? `${title} needs ${formatResource(key, amount)} more for this Sol.` : `${title} ${formatResource(key, 0)} projected after this Sol.`,
            actions: [
                ...resourceOptions(state, area, key),
                ...(area === 'rover' ? [{ label: 'Review emergency return', panel: 'roverCargo' as const }] : []),
                { label: 'Open resource forecast', panel: 'resources', area, resource: key },
            ],
        }));
    const risk = radiationEffects(radiationAfterDose(local.conditions.radiation, dose));
    if (risk.health > 0) issues.push({
        message: `${title} radiation is projected to be ${risk.level.toLowerCase()} this Sol.`,
        actions: [
            { label: 'Check exposure and controls', panel: 'conditions', area },
            ...(local.cargo.medkits ? [{ label: 'Use a Medkit', panel: 'cargo' as const, area, item: 'medkits' as const }] : []),
        ],
    });
    return issues;
}

function fastestLeg(state: TharsisState): number {
    const { legs } = expeditionFor(state);
    return state.crew.some(member => member.role === 'pilot' && member.health > 0) ? legs.pilot : legs.backup;
}

/** Optimistic lower bound. It assumes parallel prep and clear, uninterrupted travel. */
export function earliestDockSol(state: TharsisState): number {
    const { rover, hours, returnedWithData, completed, expedition } = state.tharsis;
    if (returnedWithData) return state.sol;
    const cleanTrip = fastestLeg(state) * 2 + surveySols(state);
    if (rover) {
        if (rover.phase === 'returning') return state.sol + rover.travelLeft - 1 + (hours ? 0 : cleanTrip);
        const outbound = rover.phase === 'outbound' ? rover.travelLeft : 0;
        return state.sol + outbound + surveySols(state) - hours / 24 + rover.legLength - 1;
    }
    function prepDepth(id: string): number {
        return completed[id] ? 0 : 1 + Math.max(0, ...(findOrder(state, id)?.needs?.map(prepDepth) ?? []));
    }
    const prep = Math.max(0, ...expeditionChecklist(expedition).flatMap(group => group.orders.map(prepDepth)));
    return state.sol + prep + cleanTrip - 1;
}

/** Docked stock estimate for the selected pair and load on a clear trip. */
export function cleanDockReserves(state: TharsisState, load: RoverLoad, next: TharsisState, waitForPrep: boolean): ResourcePool {
    const station = waitForPrep ? next.resources : state.resources;
    const trip = tripPlan(state);
    const travelers = new Set(fieldCrew(state).map(member => member.id));
    const crewCount = state.crew.filter(member => member.health > 0 && !travelers.has(member.id)).length;
    const mods = state.skillModifiers;
    const food = round1(crewCount * mods.foodConsumptionMult * (state.rationPolicy === 'half' ? 0.5 : 1));
    const water = round1(crewCount * 0.9 * mods.waterConsumptionMult);
    const oxygen = round1((2 + crewCount * 0.5) * mods.oxygenConsumptionMult);
    return {
        ...station,
        food: Math.max(0, round1(station.food - trip.sols * food - trip.cleanCost.food)),
        water: Math.max(0, round1(station.water - trip.sols * water - trip.cleanCost.water)),
        oxygen: Math.max(0, round1(station.oxygen - trip.sols * oxygen - trip.cleanCost.oxygen)),
        energy: Math.max(0, round1(station.energy - load.resources.energy)),
        res: Math.max(0, round1(station.res - load.resources.res)),
    };
}

export function assessMission(state: TharsisState, draft: RoverLoad) {
    const run = state.tharsis;
    const deadline = missionDeadline(state);
    const next = previewEndSol(state);
    const pair = fieldCrew(state);
    const dispatch = run.rover || run.returnedWithData ? [] : dispatchIssues(state, draft);
    let dockSol = run.rover ? fieldReturnEstimate(state) : run.returnedWithData ? null : earliestDockSol(state);
    const launchReady = !run.rover && !run.returnedWithData && !dispatch.length && state.phase === 'planning';
    if (launchReady) {
        const launch = cloneValue(state);
        if (!dispatchRover(launch, draft)) dockSol = fieldReturnEstimate(launch);
    }
    const dockIsLate = dockSol !== null && dockSol > deadline;
    const alreadyLate = earliestDockSol(state) > deadline;
    const dockReserves = run.rover ? next.tharsis.returnedWithData ? next.resources : null
        : run.returnedWithData ? next.resources : pair.length === 2 ? cleanDockReserves(state, draft, next, dispatch.some(issue => issue.kind === 'checks')) : null;
    const notices = [...localNotices(state, 'station', next), ...localNotices(state, 'rover', next)];
    if (run.rover) {
        const traveling = run.rover.phase !== 'site';
        const pilot = pair.find(member => member.role === 'pilot' && !crewAbilityProblem(state, 'rover', member.id));
        if (stormDay(state) && !run.completed.harden && run.abilities.stormOverrideSol !== state.sol) notices.push({
            message: traveling ? 'Storm shelter stops this travel Sol.' : 'Storm shelter stops outdoor sampling this Sol.',
            actions: pilot ? [{ label: 'Use Storm Override', panel: 'abilities', memberId: pilot.id }] :
                [{ label: 'Check rover conditions', panel: 'conditions', area: 'rover' }],
        });
        if (run.rover.resting || run.rover.interrupted || pair.some(member => Boolean(travelerReadiness(state, member)))) notices.push({
            message: run.rover.interrupted ? 'The briefing interrupted field systems this Sol.' :
                run.rover.resting ? 'The field pair is scheduled to rest this Sol.' : 'The field pair needs rest or treatment before it can proceed.',
            actions: [{ label: 'Review field supplies and rest', panel: 'roverCargo' }],
        });
    }
    const gaps = shortfalls(dockReserves ?? state.resources, state.goal.minimumReserves);
    for (const [key, amount] of gaps) notices.push({
        message: `${dockReserves ? 'Projected docking' : 'Current station'} reserve shortfall · ${formatResource(key, amount)} needed.`,
        actions: resourceOptions(state, 'station', key),
    });
    const held = resourceForecast(state, 'station').tasks.filter(flow => flow.hold);
    for (const flow of held) notices.push({
        message: `${flow.title} held · ${flow.hold}.`,
        actions: [{ label: 'Review the order and lead', panel: 'work', orderId: flow.orderId },
            ...(flow.shortages ?? []).flatMap(([key]) => resourceOptions(state, 'station', key))],
    });
    for (const issue of dispatch) {
        if (issue.kind === 'checks' && issue.orderId) {
            const orderId = missionWorkTarget(state, issue.orderId);
            notices.push({ message: issue.message, actions: [{ label: `Open ${findOrder(state, orderId)!.title}`, panel: 'work', orderId }] });
        } else {
            notices.push({ message: issue.message, actions: [{ label: 'Open rover checklist', panel: 'roverChecklist' },
                ...(issue.resource ? resourceOptions(state, 'station', issue.resource) : [])] });
        }
    }
    const nextDock = next.tharsis.rover ? fieldReturnEstimate(next, stormWindowKnown(state)) : earliestDockSol(next);
    const lateAfterSol = !next.tharsis.returnedWithData && (nextDock === null || nextDock > deadline);
    const review = next.result?.outcome === 'defeat' ? next.result.reason :
        next.result?.outcome === 'victory' ? null :
        lateAfterSol ? (nextDock === null ? 'Projected exposure risks a rover abort before docking.' :
            `After this Sol, the earliest projected return is Sol ${nextDock}. The deadline is Sol ${deadline}.`) : null;
    if (alreadyLate || dockIsLate || ((run.rover || launchReady) && dockSol === null)) notices.unshift({
        message: alreadyLate ? `Even a clear route would miss the Sol ${deadline} deadline.` :
            dockIsLate ? `The planned route projects docking on Sol ${dockSol}, past the Sol ${deadline} deadline.` :
                'Current exposure and weather put docking at risk.',
        actions: alreadyLate ? [{ label: 'Retry mission', panel: 'retry' }] :
            run.rover ? [{ label: 'Review rover supplies and rest', panel: 'roverCargo' }] :
                [{ label: 'Review departure and reserves', panel: 'roverChecklist' }],
    });
    if (review && !notices.length) notices.push({ message: review, actions: [{ label: 'Retry mission', panel: 'retry' }] });
    return { deadline, dispatch, dockSol, dockReserves, notices, review, pair, launchReady };
}
