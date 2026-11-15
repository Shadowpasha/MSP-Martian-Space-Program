import { expeditionOf } from '../data/expeditions';
import { CARGO_BY_ID } from '../data/cargo';
import type { CrewMember, CrewRole, ExpeditionId, ResourcePool, SkillTreeModifiers } from '../contracts/gameContract';
import { EQUIPMENT_IDS, STATION_EQUIPMENT, type StationEquipmentId } from '../data/tharsisEquipment';
import { formatResource, resourceEntries } from '../data/missions';
import { expeditionChecklist, expeditionOrder, repeatable, type Technique, type WorkOrder } from '../data/tharsisOrders';
import { appendLog, applyResourceDelta, canAffordCost, clamp, round1, shortfalls, spend } from './stateOps';
import { moralePace, radiationEffects } from './tharsisConditions';
import { customWorkOrder, readCustomTask, type CustomWorkOrder } from './tharsisCustom';
import { doubleShift, fieldDutyProblem, stationShiftCapacity } from './crewAbilities';
import { hasUpgrade, trainedRole } from './tharsisUpgrades';
import { localBudget, stormDay, type TharsisState } from './tharsis';

export interface WorkAssignment {
    orderId: string;
    method: Technique[];
    leadId: string | null;
    progress: number;
    custom?: CustomWorkOrder;
}

export function scheduledOrder(job: WorkAssignment, expedition: ExpeditionId = 'tharsis'): WorkOrder {
    return job.custom ?? expeditionOrder(expedition, job.orderId)!;
}

export function findOrder(state: TharsisState, id: string): WorkOrder | undefined {
    return expeditionOrder(state.tharsis.expedition, id) ?? state.tharsis.work.find(job => job.orderId === id)?.custom;
}

export function equipmentBlock(state: TharsisState, order: WorkOrder): string | null {
    if (order.id === 'harden' && state.tharsis.rover) return 'Dock the rover before hardening it.';
    const equipment = EQUIPMENT_IDS.find(id => state.tharsis.disabledEquipment[id] &&
        (order.decommission === id || (STATION_EQUIPMENT[id].blocks as readonly string[]).includes(order.id)));
    return equipment ? `${STATION_EQUIPMENT[equipment].name} decommissioned.` : null;
}

export function methodProblem(order: WorkOrder, method: readonly Technique[]): string | null {
    if (method.length > 2 || new Set(method).size !== method.length || method.some(id => !order.methods?.includes(id))) {
        return 'These techniques cannot be used on this work order.';
    }
    if (method.includes('specialist') && method.includes('parallel')) return 'Choose one way to shorten the checkout.';
    return null;
}

function shiftsRemaining(shifts: number, rate: number, progress = 0): number {
    const remainingTenths = Math.round((shifts - progress) * 10);
    return Math.ceil(remainingTenths / Math.round(rate * 10));
}

export function workQuote(order: WorkOrder, method: readonly Technique[], lead: CrewMember, mods: SkillTreeModifiers, additionalRole?: CrewRole) {
    const specialist = order.specialists.includes(lead.role) || Boolean(additionalRole && order.specialists.includes(additionalRole));
    const perk = lead.perk.bonusCategory === order.category;
    const parallel = method.includes('parallel');
    const specialistCheck = method.includes('specialist');
    const recycle = method.includes('recycle');
    const conserve = method.includes('conserve');
    const dry = method.includes('dry');
    const shifts = Math.max(1, order.shifts - Number(parallel || specialistCheck) + Number(conserve));
    const cost = { ...order.cost };
    cost.energy = Math.max(0, (cost.energy ?? 0) + Number(!specialist) + Number(specialistCheck) + 2 * Number(parallel) + Number(recycle) + Number(dry) - 2 * Number(conserve));
    if (dry && cost.water) cost.water--;
    cost.res = Math.max(0, (cost.res ?? 0) + Number(parallel) + Number(conserve) - Number(recycle));
    const discount = (perk ? lead.perk.costMultiplier : 1) * mods.aiCostDiscountMult;
    for (const key of Object.keys(cost) as Array<keyof ResourcePool>) {
        if (cost[key]) cost[key] = round1(cost[key]! * discount);
        else delete cost[key];
    }
    const pace = (specialist || parallel || order.shifts === 1 ? 1 : 0.8) * (perk ? lead.perk.speedMultiplier : 1) + mods.taskSpeedBonus;
    const rate = round1(pace * moralePace(lead.morale));
    const output = { ...order.yield };
    let yieldMult = perk ? lead.perk.yieldMultiplier : 1;
    if (order.category === 'BIO') yieldMult *= mods.hydroponicsYieldMult;
    if (order.category === 'NAV') yieldMult *= mods.roverYieldMult;
    for (const key of Object.keys(output) as Array<keyof ResourcePool>) output[key] = round1(output[key]! * yieldMult);
    const salvage = order.decommission;
    if (salvage && output.res) output.res = Math.min(output.res, STATION_EQUIPMENT[salvage].maxMaterials);
    return { shifts, rate, sols: shiftsRemaining(shifts, rate), cost, output, specialist, perk };
}

export function quoteForLead(state: TharsisState, order: WorkOrder, method: readonly Technique[], lead: CrewMember) {
    return workQuote(order, method, lead, state.skillModifiers, trainedRole(state, lead.id));
}

export function canSpecialize(state: TharsisState, order: WorkOrder, member: CrewMember): boolean {
    const trained = trainedRole(state, member.id);
    return order.specialists.includes(member.role) || Boolean(trained && order.specialists.includes(trained));
}

export function stationCrew(state: TharsisState): CrewMember[] {
    const away = state.tharsis.rover?.crewIds ?? [];
    return state.crew.filter(member => !away.includes(member.id));
}

export function workLeadProblem(state: TharsisState, order: WorkOrder, method: readonly Technique[], member: CrewMember): string | null {
    if (member.health <= 0) return 'Crew member is incapacitated.';
    if (state.tharsis.rover?.crewIds.includes(member.id)) return 'Crew member is with the rover.';
    const cycle = doubleShift(state, member);
    if (cycle && !cycle.active) return `Double Shift recovery through Sol ${cycle.ready - 1}.`;
    return method.includes('specialist') && !canSpecialize(state, order, member) ? 'Specialist procedure requires a matching work role.' : null;
}

export function missingPrerequisites(state: TharsisState, order: WorkOrder): string[] {
    return order.needs?.filter(id => !state.tharsis.completed[id]) ?? [];
}

export function orderBlock(state: TharsisState, order: WorkOrder): string | null {
    if (state.tharsis.completed[order.id] && !repeatable(order)) return 'Complete';
    if (state.tharsis.work.some(job => job.orderId === order.id)) return 'Already scheduled';
    const missing = missingPrerequisites(state, order);
    if (missing.length) return `Needs ${missing.map(id => findOrder(state, id)!.title).join(' and ')}`;
    if (order.id === 'suits' && state.tharsis.fieldPair.length !== 2) return 'Choose both travelers in the rover checklist.';
    const { instrument } = expeditionOf(state.tharsis.expedition);
    if (order.id === 'sampler' && !state.cargo[instrument]) return `A ${CARGO_BY_ID[instrument].name} must be in station cargo.`;
    return equipmentBlock(state, order);
}

function quoteBlock(state: TharsisState, order: WorkOrder, method: readonly Technique[]): string | null {
    const leads = stationCrew(state).filter(member => !workLeadProblem(state, order, method, member));
    if (!leads.length) return 'No available crew can lead this method.';
    const deficits = leads.map(lead => shortfalls(state.resources, quoteForLead(state, order, method, lead).cost));
    if (deficits.some(gaps => !gaps.length)) return null;
    const nearest = deficits.sort((left, right) => left.reduce((sum, [, n]) => sum + n, 0) - right.reduce((sum, [, n]) => sum + n, 0))[0]!;
    return `First shift needs ${nearest.map(([key, amount]) => formatResource(key, amount)).join(' and ')} more at the station.`;
}

export function workDraftBlock(state: TharsisState, order: WorkOrder, method: readonly Technique[]): string | null {
    if (state.phase !== 'planning') return 'Work orders are scheduled during planning.';
    if (expeditionOrder(state.tharsis.expedition, order.id) !== order) return 'Unknown work order.';
    const active = state.tharsis.work.find(job => job.orderId === order.id);
    if (active?.progress) return 'The current procedure is already underway.';
    const blocker = orderBlock(state, order);
    return (blocker === 'Already scheduled' ? equipmentBlock(state, order) : blocker) ?? methodProblem(order, method) ?? quoteBlock(state, order, method);
}

export function acceptWork(state: TharsisState, order: WorkOrder, method: readonly Technique[], revise = false): string | null {
    const active = state.tharsis.work.find(job => job.orderId === order.id);
    if (active && !revise) return 'Already scheduled';
    const block = workDraftBlock(state, order, method);
    if (block) return block;
    if (active) {
        active.method = [...method];
        const lead = state.crew.find(member => member.id === active.leadId);
        if (lead && workLeadProblem(state, order, method, lead)) active.leadId = null;
    } else state.tharsis.work.push({ orderId: order.id, method: [...method], leadId: null, progress: 0 });
    appendLog(state, 'info', `${order.title} ${active ? 'revised' : 'scheduled'}.`);
    return null;
}

export function customDraftBlock(state: TharsisState, value: unknown, reviseId?: string): string | null {
    if (state.phase !== 'planning') return 'Work orders are scheduled during planning.';
    const spec = readCustomTask(value);
    if (!spec) return 'This procedure exceeds the station’s operating limits.';
    const jobs = state.tharsis.work;
    if (reviseId && !jobs.some(job => job.orderId === reviseId && job.custom && !job.progress)) return 'The selected task has already started or was removed.';
    if (jobs.some(job => job.orderId !== reviseId && scheduledOrder(job, state.tharsis.expedition).title.toLowerCase() === spec.title.toLowerCase())) return 'A task with this name is already scheduled.';
    if (spec.decommission) {
        if (state.tharsis.disabledEquipment[spec.decommission]) return `${STATION_EQUIPMENT[spec.decommission].name} has already been decommissioned.`;
        if (jobs.some(job => job.orderId !== reviseId && job.custom?.decommission === spec.decommission)) return 'This equipment is already scheduled for salvage.';
    }
    return quoteBlock(state, customWorkOrder(spec, reviseId ?? 'draft'), []);
}

export function acceptCustomWork(state: TharsisState, value: unknown, reviseId?: string): { id: string } | { reason: string } {
    const reason = customDraftBlock(state, value, reviseId);
    if (reason) return { reason };
    const spec = readCustomTask(value)!;
    const id = reviseId ?? `custom-${state.nextTaskSeq++}`;
    const custom = customWorkOrder(spec, id);
    const active = state.tharsis.work.find(job => job.orderId === id);
    if (active) active.custom = custom;
    else state.tharsis.work.push({ orderId: id, custom, method: [], leadId: null, progress: 0 });
    appendLog(state, 'info', `${custom.title} ${active ? 'revised' : 'scheduled'}.`);
    return { id };
}

export function assignmentProblem(state: TharsisState, orderId: string, leadId: string | null): string | null {
    if (state.phase !== 'planning') return 'Assign crew during planning.';
    const job = state.tharsis.work.find(item => item.orderId === orderId);
    if (!job) return 'Schedule that work order first.';
    if (!leadId) return null;
    const member = state.crew.find(candidate => candidate.id === leadId);
    if (!member) return 'Select a station crew member.';
    const order = scheduledOrder(job, state.tharsis.expedition);
    const blocker = equipmentBlock(state, order) ?? workLeadProblem(state, order, job.method, member);
    if (blocker) return blocker;
    if (stationShiftCapacity(state, member) === 2 && job.leadId !== leadId &&
        state.tharsis.work.filter(other => other.leadId === leadId).length >= 2) return 'Double Shift slots are full. Unassign one lead first.';
    return null;
}

export function assignWork(state: TharsisState, orderId: string, leadId: string | null): string | null {
    const problem = assignmentProblem(state, orderId, leadId);
    if (problem) return problem;
    const job = state.tharsis.work.find(item => item.orderId === orderId)!;
    const member = state.crew.find(candidate => candidate.id === leadId);
    if (member && stationShiftCapacity(state, member) === 1) {
        for (const other of state.tharsis.work) if (other.leadId === leadId) other.leadId = null;
    }
    job.leadId = leadId;
    return null;
}

export function cancelWork(state: TharsisState, orderId: string): void {
    if (state.phase === 'planning') state.tharsis.work = state.tharsis.work.filter(job => job.orderId !== orderId);
}

export function updateChecklist(state: TharsisState): void {
    for (const requirement of state.goal.requirements) {
        const checklist = expeditionChecklist(state.tharsis.expedition).find(item => item.kind === requirement.kind);
        if (checklist) requirement.current = checklist.orders.filter(id => state.tharsis.completed[id]).length;
    }
}

export function chooseFieldCrew(state: TharsisState, id: string): string | null {
    const mission = state.tharsis;
    if (state.phase !== 'planning' || mission.rover) return 'Change the field team while the rover is docked.';
    if (mission.fieldPair.includes(id)) mission.fieldPair = mission.fieldPair.filter(member => member !== id);
    else {
        const member = stationCrew(state).find(candidate => candidate.id === id && candidate.health > 0);
        if (!member) return 'This crew member is unavailable.';
        const blocker = fieldDutyProblem(state, member);
        if (blocker) return blocker;
        if (mission.fieldPair.length >= 2) return 'Remove one traveler before adding another.';
        mission.fieldPair.push(id);
    }
    delete mission.completed.suits;
    cancelWork(state, 'suits');
    updateChecklist(state);
    return null;
}

export interface WorkFlow {
    orderId: string;
    title: string;
    cost?: Partial<ResourcePool>;
    yield?: Partial<ResourcePool>;
    remaining?: number;
    hold?: string;
    shortages?: ReturnType<typeof shortfalls>;
    decommission?: StationEquipmentId;
}

interface ShiftConditions {
    storm: boolean;
    unheated: boolean;
}

export function advanceWork(state: TharsisState, conditions: ShiftConditions, report: string[], flows?: WorkFlow[]) {
    const finished: string[] = [];
    const done = new Set<string>();
    const worked = new Set<string>();
    const shiftsByLead = new Map<string, number>();
    for (const job of state.tharsis.work) {
        const order = scheduledOrder(job, state.tharsis.expedition);
        const lead = state.crew.find(member => member.id === job.leadId);
        const used = lead ? shiftsByLead.get(lead.id) ?? 0 : 0;
        const leadBlock = lead ? workLeadProblem(state, order, job.method, lead) ??
            (used >= stationShiftCapacity(state, lead) ? 'lead has worked all available shifts' : null) : 'assign a station lead';
        const quote = lead && !leadBlock ? quoteForLead(state, order, job.method, lead) : null;
        const hold = leadBlock ?? shiftHold(state, order, conditions);
        const shortages = quote && !hold ? shortfalls(state.resources, quote.cost) : [];
        const reason = hold ?? (shortages.length ? `needs ${shortages.map(([key, amount]) => formatResource(key, amount)).join(' and ')} more after upkeep and earlier work` : null);
        if (reason || !lead || !quote) {
            const message = (reason ?? 'no eligible lead').replace(/\.$/, '');
            report.push(`${order.title} held · ${message}.`);
            flows?.push({ orderId: order.id, title: order.title, hold: message, shortages, yield: order.yield, decommission: order.decommission });
            continue;
        }
        const remaining = shiftsRemaining(quote.shifts, quote.rate, job.progress);
        spend(state.resources, quote.cost);
        job.progress = round1(job.progress + quote.rate);
        lead.stamina = clamp(lead.stamina - 7, 20, 100);
        worked.add(lead.id);
        shiftsByLead.set(lead.id, used + 1);
        if (quote.specialist) state.perkMatchesCount++;
        flows?.push({ orderId: order.id, title: order.title, cost: quote.cost, yield: quote.output, remaining, decommission: order.decommission });
        if (job.progress < quote.shifts) {
            report.push(`${order.title} · ${job.progress}/${quote.shifts} work complete.`);
            continue;
        }
        applyResourceDelta(state.resources, quote.output);
        const decommission = job.custom?.decommission;
        if (decommission) {
            state.tharsis.disabledEquipment[decommission] = true;
            report.push(`${STATION_EQUIPMENT[decommission].name} decommissioned. ${STATION_EQUIPMENT[decommission].loss}`);
        }
        if (order.recovery) {
            const amount = order.recovery * (quote.specialist && quote.perk ? lead.perk.yieldMultiplier : 1);
            for (const member of stationCrew(state)) if (member.health > 0) member.health = clamp(member.health + amount, 0, 100);
            state.conditions.radiation = Math.max(0, state.conditions.radiation - round1(amount * 0.6));
        }
        if (!job.custom) state.tharsis.completed[order.id] = state.sol;
        finished.push(order.title);
        done.add(job.orderId);
        state.tasksCompletedCount++;
        const resources = resourceEntries(quote.output).map(([key, amount]) => `+${formatResource(key, amount)}`).join(' · ');
        const line = `${order.title} complete · ${lead.name.split(' ')[0]}${resources ? ` · ${resources}` : ''}.`;
        report.push(line);
        appendLog(state, 'good', line);
    }
    for (const member of stationCrew(state)) if (!worked.has(member.id) && member.health > 0) member.stamina = clamp(member.stamina + 12, 0, 100);
    state.tharsis.work = state.tharsis.work.filter(job => !done.has(job.orderId));
    updateChecklist(state);
    return { completed: finished, worked };
}

function shiftHold(state: TharsisState, order: WorkOrder, { storm, unheated }: ShiftConditions) {
    const disabled = equipmentBlock(state, order);
    if (disabled) return disabled.replace(/\.$/, '');
    if (unheated && !['air', 'triage'].includes(order.id)) return 'station heating shortfall';
    if (order.exterior && radiationEffects(state.conditions.radiation).exteriorHold) return 'radiation above exterior work limit';
    if (order.exterior && storm && !(order.id === 'load-test' && state.tharsis.completed.harden)) return 'storm exterior restrictions';
    const microgrid = hasUpgrade(state, 'microgrid') && order.bay === 'life' && !order.exterior;
    if (storm && state.tharsis.shelter === 'full' && !microgrid && !['air', 'triage'].includes(order.id)) return 'station in full shelter';
    return null;
}

/** Fastest usable procedure at today's staffing, pace and routine upkeep. */
export function workCompletionEstimate(state: TharsisState, order: WorkOrder): number | null {
    const active = state.tharsis.work.find(job => job.orderId === order.id);
    const block = orderBlock(state, order);
    if (block && block !== 'Already scheduled') return null;
    const { passive, upkeep, heating } = localBudget(state, 'station');
    const spendable = { ...state.resources };
    for (const [key, amount] of resourceEntries(upkeep)) spendable[key] = Math.max(0, round1(spendable[key] + passive[key] - amount));
    const unheated = heating > 0 && round1(state.resources.energy + passive.energy) < upkeep.energy;
    if (shiftHold(state, order, { storm: Boolean(stormDay(state)), unheated })) return null;
    const methods: Technique[][] = active ? [active.method] : [[], ...(order.methods ?? []).map(method => [method])];
    const estimates = stationCrew(state).flatMap(lead => methods.flatMap(method => {
        if (workLeadProblem(state, order, method, lead)) return [];
        const quote = quoteForLead(state, order, method, lead);
        return canAffordCost(spendable, quote.cost) ? [shiftsRemaining(quote.shifts, quote.rate, active?.progress)] : [];
    }));
    return estimates.length ? Math.min(...estimates) : null;
}

export function preferredLead(crew: readonly CrewMember[], order: WorkOrder, state?: TharsisState): CrewMember | undefined {
    const healthy = crew.filter(member => state ? stationShiftCapacity(state, member) > 0 : member.health > 0);
    const specialists = healthy.filter(member => state ? canSpecialize(state, order, member) : order.specialists.includes(member.role));
    return specialists.find(member => member.perk.bonusCategory === order.category) ?? specialists[0] ?? healthy[0];
}
