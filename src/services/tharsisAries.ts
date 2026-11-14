import { EQUIPMENT_IDS, STATION_EQUIPMENT } from '../data/tharsisEquipment';
import { TECHNIQUES, WORK_ORDERS, type Technique } from '../data/tharsisOrders';
import { localArea, stormDay, type TharsisState } from '../simulation/tharsis';
import { allowedEventCargo, allowedPositiveEffects, availableEffectIds, EVENT_COMMITMENT_IDS, EVENT_SYSTEMS, validateBriefing } from '../simulation/tharsisEvents';
import { customDraftBlock, findOrder, methodProblem, orderBlock, scheduledOrder, stationCrew, workDraftBlock } from '../simulation/tharsisWork';
import { plainText, readCustomTask, type CustomTaskSpec } from '../simulation/tharsisCustom';
import { requestGemini } from './geminiPlanner';

function parse(response: Awaited<ReturnType<typeof requestGemini>>): unknown {
    if (!('text' in response)) return null;
    try { return JSON.parse(response.text); } catch { return null; }
}

export async function draftSurveyBriefing(state: TharsisState, signal?: AbortSignal) {
    const { area } = state.tharsis.briefing;
    const local = localArea(state, area);
    if (!local) return null;
    const systemInstruction = [
        'Write one ground-truth engineering briefing for the fiction Mars Station Program, the Tharsis Ridge weather survey. Use the supplied run facts and only the listed systems. There is no Earth resupply or transfer between locations.',
        'Use realistic NASA-style diagnostics. Examples include MEDA wind and pressure checks, scheduled relay contacts, power load isolation, water-recovery conductivity checks and oxygen-generator inlet faults. Rover events use only rover systems and supplies.',
        'Supply observable symptoms and measurements that help a careful player reason about the fault. Return two or three plausible actions with distinct consequences. The observation and detail must leave consequences hidden. The result describes the actual outcome without embedded numbers.',
        'Include at least one choice with commitment none, cargo none, and no losses, stress, or exposure. Other actions may waste resources for no gain. Use only the listed effect IDs. Positive resource effects must be in positiveResourceEffects for the chosen system. Effect none must stand alone. No invented cargo, mission progress, severe failures, threats, or new weather.',
        'If a regional dust storm is underway, focus on a local fault during the alert. Storm timing and storm-wide effects are handled by mission control.',
        'If field_reset is listed, it is a severity-1 setback that costs the current survey Sol. Use it only for an avoidable bad response to a wind instrument or route communications fault.',
        'Keep title <=52 characters, observation <=310, action <=48, detail <=126, result <=150. Use plain text. For cargo use none or an available cargo ID. Avoid repeating recent systems.',
    ].join('\n');
    const systems = EVENT_SYSTEMS[area].filter(system => !state.tharsis.recentSystems.slice(-2).includes(system));
    const input = JSON.stringify({
        mission: 'Tharsis Ridge Weather Survey', seed: state.tharsis.seed, briefingSol: state.sol, lastSol: state.tharsis.reportSol, deadline: state.goal.deadlineSol,
        difficulty: 'Tharsis standard', area, weather: local.conditions.weather, stormDay: stormDay(state), radiation: local.conditions.radiation, morale: local.conditions.morale,
        resources: local.resources, cargo: local.cargo, crew: local.crew.map(({ role, health, stamina }) => ({ role, health, stamina })),
        localReport: state.lastSolReport.filter(line => area === 'station' ? !/^(Rover|Site A|The interrupted survey)/.test(line) : /^(Rover|Site A|The interrupted survey)/.test(line)).slice(0, 6),
        fieldHours: state.tharsis.hours, travelPhase: state.tharsis.rover?.phase, completedWork: Object.keys(state.tharsis.completed),
        systems, positiveResourceEffects: Object.fromEntries(systems.map(system => [system, allowedPositiveEffects(system)])),
        commitments: EVENT_COMMITMENT_IDS, effects: availableEffectIds(state), severity: [1, 2], availableCargo: allowedEventCargo(local.cargo),
    });
    const response = await requestGemini(systemInstruction, input, { kind: 'briefing', timeout: 11_000, signal });
    return validateBriefing(parse(response), state);
}

export type TaskDraft = {
    kind: 'procedure'; orderId: string; method: Technique[]; leadId?: string;
} | {
    kind: 'custom'; task: CustomTaskSpec; reviseId?: string; leadId?: string;
};

export interface DiscussionMessage { speaker: 'crew' | 'aries'; text: string; }
type DiscussionReply = { message: string; draft?: TaskDraft | null };

export function draftProblem(state: TharsisState, draft: TaskDraft): string | null {
    if (draft.kind === 'custom') return customDraftBlock(state, draft.task, draft.reviseId);
    const order = findOrder(state, draft.orderId);
    return order ? workDraftBlock(state, order, draft.method) : 'That work order is no longer available.';
}

function readReply(raw: unknown, state: TharsisState): DiscussionReply | null {
    if (!raw || typeof raw !== 'object') return null;
    const value = raw as Record<string, unknown>;
    const prose = plainText(value.message, 640);
    const message = prose?.replace(/\bgemini\b/gi, 'A.R.I.E.S.');
    if (!message) return null;
    if (!value.draft || typeof value.draft !== 'object') return { message };
    const suggestion = value.draft as Record<string, unknown>;
    if (suggestion.kind === 'clear') return { message, draft: null };
    const leadId = stationCrew(state).find(member => member.role === suggestion.leadRole && member.health > 0)?.id;
    const lead = leadId ? { leadId } : {};
    if (suggestion.kind === 'procedure' && typeof suggestion.orderId === 'string') {
        const order = findOrder(state, suggestion.orderId);
        const method = suggestion.techniques;
        if (order && order.bay !== 'custom' && Array.isArray(method) && !methodProblem(order, method)) {
            return { message, draft: { kind: 'procedure', orderId: order.id, method, ...lead } };
        }
    }
    if (suggestion.kind === 'custom') {
        const task = readCustomTask(suggestion.task);
        const reviseId = typeof suggestion.reviseId === 'string' ? suggestion.reviseId : undefined;
        if (task && (!reviseId || state.tharsis.work.some(job => job.orderId === reviseId && job.custom))) {
            return { message, draft: { kind: 'custom', task, reviseId, ...lead } };
        }
    }
    return { message: `${message} The task needs a different procedure before it can be scheduled.` };
}

export async function discussWork(state: TharsisState, topic: string | null, history: readonly DiscussionMessage[], currentDraft: TaskDraft | null, signal?: AbortSignal): Promise<DiscussionReply | null> {
    const systemInstruction = [
        'You are A.R.I.E.S., the crew’s operations partner at an isolated Mars station. Brainstorm with the crew in natural language. Ask one useful follow-up when a tradeoff or priority is unclear. Compare alternatives or explain why something is impractical. A conversation-only response with only message is welcome. Never mention the provider, a simulated mode, or any schema.',
        'When a procedure is specific enough to review, optionally include one draft while continuing the discussion. The player may keep asking and revise the draft before pressing Schedule. A draft is never approval. Never claim you scheduled work or changed the station. Gains require the scheduled crew to finish the job. An equipment limit is a cap, and the quote will show the actual yield. Only request kind clear when the player asks to withdraw the proposal.',
        'For a listed work order use kind procedure, its orderId, and zero to two available technique IDs. Specialist and parallel are mutually exclusive. An order already underway cannot be revised. Earlier suggestions matter if the player asks to change them. Include leadRole when a specific station specialist is appropriate. Return concise valid JSON with only the relevant fields for the chosen draft kind.',
        'Invent custom maintenance, conversion, salvage, or other station work if it fits equipment, weather, stock, and crew. Provide a short specific title (44 characters), description (180), category ENG/BIO/NAV/MED/SCI, and 1–4 shifts. Cost is per shift and output is delivered on completion. Use positive integers and only energy, food, water, oxygen, res. Cost at least one resource and up to three. Max per shift in key order 8/4/4/5/4. Output up to two different resources and never one it costs. Ordinary output max per shift 12/9/10/12/4 with a combined budget of 125% of one maximum. Set exterior for EVA. Custom work cannot complete required dispatch checks or touch mission equipment, the field team, or profile upgrades.',
        'If the crew is willing to sacrifice station equipment, use kind custom with task.decommission set to an available equipment ID and task.output set to materials only (res, 4 up to its maxMaterials). Speak plainly about the permanent loss and offer an alternative if the player is undecided. When revising a scheduled custom task include its reviseId. For changes to an unscheduled draft omit reviseId.',
        'Keep each reply under 640 characters. Explain the idea, risk, or actual question. The review panel shows the quoted numbers, so there is no need to format your chat as a task form.',
    ].join('\n');
    const input = JSON.stringify({
        sol: state.sol, deadline: state.goal.deadlineSol, weather: state.conditions.weather, resources: state.resources, cargo: state.cargo,
        equipment: EQUIPMENT_IDS.map(id => ({ id, ...STATION_EQUIPMENT[id], state: state.tharsis.disabledEquipment[id] ? 'decommissioned' :
            state.tharsis.work.some(job => job.custom?.decommission === id) ? 'salvage scheduled' : 'available' })),
        crew: stationCrew(state).map(({ name, role, health, morale, id }) => ({ name, role, health, morale, dutySols: state.tharsis.dutyStreak[id] ?? 0,
            task: state.tharsis.work.find(job => job.leadId === id)?.orderId })),
        workOrders: WORK_ORDERS.filter(order => !state.tharsis.completed[order.id] || order.yield).map(order => ({
            id: order.id, title: order.title, shifts: order.shifts, cost: order.cost, needs: order.needs, methods: order.methods, specialists: order.specialists,
            output: order.yield, status: orderBlock(state, order) ?? 'ready',
        })),
        scheduled: state.tharsis.work.map(job => ({ id: job.orderId, title: scheduledOrder(job).title, started: job.progress > 0, method: job.method,
            ...(job.custom && { task: job.custom }) })),
        techniques: TECHNIQUES, topic, currentDraft, recentConversation: history.slice(-8).map((entry, index, recent) => ({
            speaker: entry.speaker, text: index < recent.length - 2 ? entry.text.slice(0, 240) : entry.text,
        })),
    });
    const response = await requestGemini(systemInstruction, input, { kind: 'discussion', timeout: 19_000, signal });
    return readReply(parse(response), state);
}
