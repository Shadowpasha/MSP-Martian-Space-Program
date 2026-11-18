import { expeditionOf } from '../data/expeditions';
import { EQUIPMENT_IDS, STATION_EQUIPMENT } from '../data/tharsisEquipment';
import { expeditionOrders, TECHNIQUES, type Technique } from '../data/tharsisOrders';
import { missionDeadline, formatResource, resourceEntries } from '../data/missions';
import { localArea, localBudget, stormDay, type TharsisState } from '../simulation/tharsis';
import { customDraftBlock, findOrder, methodProblem, orderBlock, scheduledOrder, stationCrew, workDraftBlock } from '../simulation/tharsisWork';
import { ariesText, customWorkOrder, type CustomTaskSpec } from '../simulation/tharsisCustom';
import type { ResourcePool } from '../contracts/gameContract';

export type TaskDraft = {
    kind: 'procedure'; orderId: string; method: Technique[]; leadId?: string;
} | {
    kind: 'custom'; task: CustomTaskSpec; reviseId?: string; leadId?: string;
};

export interface DiscussionMessage { speaker: 'crew' | 'aries'; text: string; }
export type DiscussionReply = { message: string; draft?: TaskDraft | null };

export function draftProblem(state: TharsisState, draft: TaskDraft): string | null {
    if (draft.kind === 'custom') return customDraftBlock(state, draft.task, draft.reviseId);
    const order = findOrder(state, draft.orderId);
    return order ? workDraftBlock(state, order, draft.method) : 'That work order is no longer available.';
}

function clampInt(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Math.round(n)));
}

function firstAvailableLead(state: TharsisState, preferredRole?: string): string | undefined {
    const healthy = stationCrew(state).filter(m => m.health > 0);
    return (preferredRole ? healthy.find(m => m.role === preferredRole) : undefined)?.id ?? healthy[0]?.id;
}

function summarizePool(pool: Partial<ResourcePool>): string {
    return resourceEntries(pool).map(([k, v]) => formatResource(k, v)).join(', ');
}

function negotiateProcedure(
    state: TharsisState,
    orderId: string,
    currentMethod: Technique[],
    intent: 'faster' | 'cheaper' | 'yield',
    leadId?: string,
): DiscussionReply {
    const order = findOrder(state, orderId);
    if (!order) return { message: 'That work order is no longer on the board.', draft: null };
    const want: Technique = intent === 'faster' ? 'parallel' : intent === 'cheaper' ? 'conserve' : 'specialist';
    const alt: Technique = intent === 'faster' ? 'specialist' : intent === 'cheaper' ? 'dry' : 'recycle';
    const methods = order.methods ?? [];
    const nextTech = methods.includes(want) ? want : methods.includes(alt) ? alt : null;
    if (!nextTech) {
        return { message: `${order.title} does not support a ${intent} procedure tweak. You can adjust the lead or try a custom station task.` };
    }
    const nextMethod = currentMethod.includes(nextTech) ? currentMethod : [nextTech];
    const block = methodProblem(order, nextMethod) || workDraftBlock(state, order, nextMethod);
    if (block) {
        return { message: `Cannot apply ${nextTech} to ${order.title}: ${block}` };
    }
    return {
        message: `Counter-offer for ${order.title}: apply "${nextTech}" (${TECHNIQUES[nextTech]}). Check the quoted shifts and supply draw on the right.`,
        draft: { kind: 'procedure', orderId, method: nextMethod, leadId },
    };
}

function negotiateCustom(
    state: TharsisState,
    draft: Extract<TaskDraft, { kind: 'custom' }>,
    intent: 'faster' | 'cheaper' | 'yield',
): DiscussionReply {
    const task: CustomTaskSpec = {
        ...draft.task,
        cost: { ...draft.task.cost },
        output: { ...draft.task.output },
    };
    if (intent === 'faster') {
        if (task.shifts <= 1) {
            return { message: `${task.title} is already down to 1 Sol. It cannot be rushed any further.` };
        }
        task.shifts -= 1;
        for (const [k, v] of resourceEntries(task.cost)) {
            task.cost[k] = clampInt(v * 1.4, 1, k === 'energy' ? 8 : k === 'oxygen' ? 5 : 4);
        }
        const block = customDraftBlock(state, task, draft.reviseId);
        if (block) return { message: `Cannot rush ${task.title} to ${task.shifts} Sol: ${block}` };
        return {
            message: `Counter-offer: compress ${task.title} to ${task.shifts} Sol. Daily draw rises to ${summarizePool(task.cost)} per shift.`,
            draft: { ...draft, task },
        };
    }
    if (intent === 'cheaper') {
        if (task.shifts >= 4) {
            return { message: `${task.title} is already stretched to 4 Sols for minimum daily draw.` };
        }
        task.shifts += 1;
        for (const [k, v] of resourceEntries(task.cost)) {
            task.cost[k] = Math.max(1, Math.floor(v * 0.7));
        }
        const block = customDraftBlock(state, task, draft.reviseId);
        if (block) return { message: `Cannot stretch ${task.title}: ${block}` };
        return {
            message: `Counter-offer: stretch ${task.title} over ${task.shifts} Sols to cut daily draw to ${summarizePool(task.cost)} per shift.`,
            draft: { ...draft, task },
        };
    }
    // yield boost
    const firstOut = resourceEntries(task.output)[0];
    if (!firstOut) return { message: 'This task has no resource output to boost.' };
    const [outKey, outVal] = firstOut;
    const cap = outKey === 'res' ? 4 * task.shifts : 10 * task.shifts;
    if (outVal >= cap) return { message: `${task.title} is already at maximum safe output.` };
    task.output[outKey] = Math.min(cap, outVal + 3);
    const firstCost = resourceEntries(task.cost)[0];
    if (firstCost) {
        const [ck, cv] = firstCost;
        task.cost[ck] = Math.min(ck === 'energy' ? 8 : 4, cv + 1);
    }
    const block = customDraftBlock(state, task, draft.reviseId);
    if (block) return { message: `Cannot boost output on ${task.title}: ${block}` };
    return {
        message: `Counter-offer: raise output to ${summarizePool(task.output)} at completion, trading +1 ${firstCost ? formatResource(firstCost[0], 1).replace(/^\d+\s*/, '') : 'unit'} per shift.`,
        draft: { ...draft, task },
    };
}

function proposeResourceTask(state: TharsisState, target: keyof ResourcePool): DiscussionReply {
    const r = state.resources;
    const candidates: Record<keyof ResourcePool, { task: CustomTaskSpec; role: string; note: string }> = {
        energy: {
            role: 'engineer',
            note: 'Auxiliary fuel-cell conversion trades spare water for immediate station power.',
            task: {
                title: 'Auxiliary Fuel-Cell Run',
                description: 'Convert reserve water into electrical power via the backup fuel cell.',
                category: 'ENG',
                shifts: 1,
                cost: r.water >= 4 ? { water: 3 } : { res: 1 },
                output: { energy: 9 },
                exterior: false,
            },
        },
        water: {
            role: 'engineer',
            note: 'Deep condensate recovery extracts extra water from station thermal loops.',
            task: {
                title: 'Deep Condensate Recovery',
                description: 'Scavenge moisture from air ducts and thermal plates into clean storage.',
                category: 'ENG',
                shifts: 1,
                cost: { energy: 4 },
                output: { water: 7 },
                exterior: false,
            },
        },
        oxygen: {
            role: 'scientist',
            note: 'Electrolytic O2 boost cracks station water and power into breathable cabin oxygen.',
            task: {
                title: 'Electrolytic O2 Boost',
                description: 'Run high-rate electrolysis to replenish station oxygen reserves.',
                category: 'SCI',
                shifts: 1,
                cost: r.water >= 4 ? { energy: 4, water: 2 } : { energy: 5 },
                output: { oxygen: 8 },
                exterior: false,
            },
        },
        food: {
            role: 'botanist',
            note: 'Intensive tray harvest accelerates fast-cycle greens using water and grow-lamp power.',
            task: {
                title: 'Intensive Tray Harvest',
                description: 'Force a rapid-cycle harvest from the station hydroponic racks.',
                category: 'BIO',
                shifts: 2,
                cost: { energy: 3, water: 2 },
                output: { food: 12 },
                exterior: false,
            },
        },
        res: {
            role: 'engineer',
            note: 'Regolith scrap sorting recovers usable materials without dismantling station hardware.',
            task: {
                title: 'Regolith Scrap Recovery',
                description: 'Sort spare brackets and external lander framing for station materials.',
                category: 'ENG',
                shifts: 1,
                cost: { energy: 4 },
                output: { res: 3 },
                exterior: stormDay(state) === 0,
            },
        },
    };
    const pick = candidates[target];
    const leadId = firstAvailableLead(state, pick.role);
    const draft: TaskDraft = { kind: 'custom', task: pick.task, leadId };
    const block = customDraftBlock(state, pick.task);
    if (block) {
        return { message: `${pick.note} However, it is currently blocked: ${block}` };
    }
    return {
        message: `${pick.note} You can negotiate shifts or output before scheduling.`,
        draft,
    };
}

function proposeSalvage(state: TharsisState): DiscussionReply {
    const available = EQUIPMENT_IDS.find(id =>
        !state.tharsis.disabledEquipment[id] && !state.tharsis.work.some(j => j.custom?.decommission === id),
    );
    if (!available) {
        return { message: 'No station equipment remains available to salvage. Try Regolith Scrap Recovery for materials instead.' };
    }
    const eq = STATION_EQUIPMENT[available];
    const task: CustomTaskSpec = {
        title: `Salvage ${eq.name}`.slice(0, 44),
        description: `Dismantle ${eq.name} permanently for station materials.`,
        category: 'ENG',
        shifts: 1,
        cost: { energy: 2 },
        output: { res: eq.maxMaterials },
        exterior: false,
        decommission: available,
    };
    const leadId = firstAvailableLead(state, 'engineer');
    return {
        message: `Warning: salvaging ${eq.name} is permanent (${eq.loss}) in exchange for ${eq.maxMaterials} Materials. Review the draft or counter-offer.`,
        draft: { kind: 'custom', task, leadId },
    };
}

export function discussWork(
    state: TharsisState,
    topic: string | null,
    history: readonly DiscussionMessage[],
    currentDraft: TaskDraft | null,
): DiscussionReply {
    const training = state.tharsis.expedition === 'training';
    const lastCrew = [...history].reverse().find(m => m.speaker === 'crew')?.text.toLowerCase() ?? '';

    if (training) {
        const { hours, rover, completed } = state.tharsis;
        if (!completed.prep_rover && !rover) {
            return { message: 'Next step: open Rover Bay and complete Rover Checkup so the field team can deploy.' };
        }
        if (hours < expeditionOf('training').surveyHours && !rover) {
            return { message: 'Next step: open Rover Checklist in Rover Bay, pick two travelers, and launch to Training Marker.' };
        }
        return {
            message: `Training status: ${hours}/${expeditionOf('training').surveyHours}h recorded, deadline Sol ${missionDeadline(state)}. Check Objectives for remaining tasks.`,
        };
    }

    if (/\b(cancel|clear|discard|withdraw|nevermind|stop)\b/.test(lastCrew)) {
        return { message: 'Proposal cleared. Ask for Power, Water, O2, Food, Materials, or Salvage whenever you want a new plan.', draft: null };
    }

    if (currentDraft) {
        if (/\b(fast|faster|rush|quick|speed|sooner)\b/.test(lastCrew)) {
            return currentDraft.kind === 'custom'
                ? negotiateCustom(state, currentDraft, 'faster')
                : negotiateProcedure(state, currentDraft.orderId, currentDraft.method, 'faster', currentDraft.leadId);
        }
        if (/\b(cheap|cheaper|save|cut|cost|conserve|less|stretch|slow)\b/.test(lastCrew)) {
            return currentDraft.kind === 'custom'
                ? negotiateCustom(state, currentDraft, 'cheaper')
                : negotiateProcedure(state, currentDraft.orderId, currentDraft.method, 'cheaper', currentDraft.leadId);
        }
        if (/\b(more|boost|yield|output|extra|double)\b/.test(lastCrew)) {
            return currentDraft.kind === 'custom'
                ? negotiateCustom(state, currentDraft, 'yield')
                : negotiateProcedure(state, currentDraft.orderId, currentDraft.method, 'yield', currentDraft.leadId);
        }
    }

    if (/\b(salvage|decommission|dismantle|scrap hardware)\b/.test(lastCrew)) return proposeSalvage(state);
    if (/\b(power|energy|solar|battery|watt)\b/.test(lastCrew)) return proposeResourceTask(state, 'energy');
    if (/\b(water|ice|hydrate|condensate)\b/.test(lastCrew)) return proposeResourceTask(state, 'water');
    if (/\b(o2|oxygen|air|breath)\b/.test(lastCrew)) return proposeResourceTask(state, 'oxygen');
    if (/\b(food|ration|eat|hungry|hydro|crop)\b/.test(lastCrew)) return proposeResourceTask(state, 'food');
    if (/\b(material|part|metal|res|repair)\b/.test(lastCrew)) return proposeResourceTask(state, 'res');

    if (topic) {
        const order = findOrder(state, topic);
        if (order && !orderBlock(state, order)) {
            const leadId = firstAvailableLead(state, order.specialists[0]);
            return {
                message: `Reviewing ${order.title}. We can run it standard, rush it faster, or conserve supplies. Pick an option or schedule as-is.`,
                draft: { kind: 'procedure', orderId: order.id, method: [], leadId },
            };
        }
    }

    // Default: inspect lowest station resource and propose a tailored plan.
    const r = state.resources;
    const lowest: Array<[keyof ResourcePool, number]> = [
        ['energy', r.energy / 25],
        ['water', r.water / 18],
        ['oxygen', r.oxygen / 20],
        ['food', r.food / 18],
        ['res', r.res / 6],
    ];
    lowest.sort((a, b) => a[1] - b[1]);
    return proposeResourceTask(state, lowest[0]![0]);
}

export function describeCustomDraft(task: CustomTaskSpec): string {
    return ariesText(customWorkOrder(task, 'draft').description, 180) ?? '';
}
