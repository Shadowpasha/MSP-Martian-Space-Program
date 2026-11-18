import { createTextInput, px, UIPositionType, type Entity, type UIEventQueue, type World } from 'esengine';
import type { ResourcePool } from '../contracts/gameContract';
import { STATION_EQUIPMENT } from '../data/tharsisEquipment';
import { formatResource, resourceEntries } from '../data/missions';
import { TECHNIQUES } from '../data/tharsisOrders';
import { draftProblem, type DiscussionMessage, type TaskDraft } from '../services/tharsisAries';
import type { TharsisState } from '../simulation/tharsis';
import { customWorkOrder } from '../simulation/tharsisCustom';
import { findOrder, preferredLead, quoteForLead, scheduledOrder, stationCrew, workLeadProblem } from '../simulation/tharsisWork';
import type { Bounds, FlightUi } from './flightUi';
import type { RunButton } from './tharsisFlight';

export type TerminalStatus = 'local';

/** What the A.R.I.E.S. link is doing, in words and colour. */
export function ariesStatus(p: FlightUi['palette'], _status: TerminalStatus): { label: string; color: FlightUi['palette']['good'] } {
    return { label: 'A.R.I.E.S. Local', color: p.cyan };
}

export function showAriesBadge(ui: FlightUi, parent: Entity, bounds: Bounds, status: TerminalStatus): void {
    const p = ui.palette;
    const { label, color } = ariesStatus(p, status);
    const badge = ui.frame(parent, bounds, p.ink, color);
    const innerHeight = bounds[3] - 8;
    const iconSize = Math.min(16, innerHeight);
    ui.icon(badge, 6, (innerHeight - iconSize) / 2, iconSize, 'circuit', color);
    ui.label(badge, [14 + iconSize, 0, bounds[2] - 24 - iconSize, innerHeight], label, { size: 12, fit: 11, color });
}

interface TerminalOptions {
    ui: FlightUi;
    content: Entity;
    world: World;
    events: UIEventQueue;
    button: RunButton;
    state: TharsisState;
    topic: string | null;
    history: readonly DiscussionMessage[];
    page: number;
    status: TerminalStatus;
    pending: boolean;
    prompt: string;
    draft: TaskDraft | null;
    notice: string;
    onSubmit: (text: string) => void;
    onInput: (text: string) => void;
    onPage: (page: number) => void;
    onAccept: () => void;
    onDiscard: () => void;
    onQueue: () => void;
    onRetry: () => void;
    onObjectives: () => void;
    onWorkOrders: () => void;
}

function wrapLines(text: string, width: number): string[] {
    const rows: string[] = [];
    let line = '';
    for (const word of text.split(/\s+/)) {
        if (!word) continue;
        if (line && line.length + word.length + 1 > width) {
            rows.push(line);
            line = '';
        }
        let remaining = word;
        while (remaining.length > width) {
            rows.push(remaining.slice(0, width));
            remaining = remaining.slice(width);
        }
        line = line ? `${line} ${remaining}` : remaining;
    }
    if (line) rows.push(line);
    return rows;
}

type TranscriptRow = { speaker?: DiscussionMessage['speaker']; text: string };
const VISIBLE_ROWS = 17;

function transcriptRows(history: readonly DiscussionMessage[]): TranscriptRow[] {
    return history.flatMap(message => [
        { speaker: message.speaker, text: message.speaker === 'crew' ? '> CREW' : '< A.R.I.E.S.' },
        ...wrapLines(message.text, 66).map(text => ({ text })),
        { text: '' },
    ]);
}

const resources = (pool: Partial<ResourcePool>, sign: string) => resourceEntries(pool).map(([key, value]) => `${sign}${formatResource(key, value)}`).join('  ·  ');

export function showTerminal(options: TerminalOptions): Entity | null {
    const { ui, state, content, button, status } = options;
    const p = ui.palette;
    const topic = options.topic && findOrder(state, options.topic)?.title;
    const training = state.tharsis.expedition === 'training';
    showAriesBadge(ui, content, [352, 18, 167, 29], status);
    ui.label(content, [24, 61, 698, 24], topic ? `TOPIC  /  ${topic}` : training ? 'TRAINING GUIDANCE  /  LOCAL BRIEFINGS' : 'STATION NEGOTIATION  /  LOCAL OPS', { size: 14, color: p.cyan });

    const terminal = ui.frame(content, [20, 96, 708, 434], p.ink, p.teal);
    const rows = transcriptRows(options.history);
    const maxOffset = Math.max(0, rows.length - VISIBLE_ROWS);
    const offset = Math.min(options.page, maxOffset);
    const start = Math.max(0, maxOffset - offset);
    ui.label(terminal, [16, 6, 404, 26], 'NEGOTIATION LOG', { size: 14, color: p.cyan });
    rows.slice(start, start + VISIBLE_ROWS).forEach((row, i) => {
        const y = 45 + i * 19;
        if (row.speaker) ui.box(terminal, [14, y, 668, 18], row.speaker === 'crew' ? p.well : p.panel);
        if (row.text) ui.label(terminal, [28, y, 640, 18], row.text, { size: row.speaker ? 13 : 15,
            color: row.speaker === 'crew' ? p.amber : row.speaker === 'aries' ? p.cyan : p.text });
    });
    if (!options.history.length) {
        const greeting = training ? 'Ask me for help with a work order, a resource shortage, or the next step in the training run.' :
            topic ? 'Negotiate shifts, supplies, or output for this task using the quick actions below or by typing.' :
                'Pick a resource goal below or type a request to negotiate a custom station task.';
        ui.label(terminal, [18, 49, 650, 68], greeting, { size: 17, color: p.secondary, wrap: true, top: true });
    }
    if (maxOffset) {
        button('chat-older', terminal, [476, 386, 95, 32], () => options.onPage(Math.min(maxOffset, offset + 12)), { label: 'Older', disabled: offset >= maxOffset });
        button('chat-newer', terminal, [582, 386, 100, 32], () => options.onPage(Math.max(0, offset - 12)), { label: 'Newer', disabled: !offset });
    }

    const quickReplies: ReadonlyArray<readonly [string, string, string]> = training
        ? [['q-next', 'Next Step', 'What is the next step?'], ['q-power', 'Power', 'Need power'], ['q-water', 'Water', 'Need water'], ['q-o2', 'Oxygen', 'Need oxygen']]
        : options.draft
            ? [['q-fast', 'Make Faster', 'Make it faster'], ['q-cheap', 'Cut Cost', 'Cut cost and save supplies'], ['q-yield', 'Boost Yield', 'Boost output yield'], ['q-salvage', 'Salvage', 'Salvage equipment for materials']]
            : [['q-power', 'Need Power', 'Need power'], ['q-water', 'Need Water', 'Need water'], ['q-o2', 'Need O₂', 'Need oxygen'], ['q-food', 'Need Food', 'Need food']];
    quickReplies.forEach(([key, label, cmd], idx) => {
        button(key, content, [20 + idx * 179, 540, 170, 38], () => options.onSubmit(cmd), { label, labelSize: 13 });
    });

    const field = createTextInput({ world: options.world, events: options.events, parent: content,
        node: { position: UIPositionType.Absolute, insetLeft: px(20), insetTop: px(589), width: px(555), height: px(48) },
        value: options.prompt, placeholder: '> Enter a message', fontFamily: 'monospace', maxLength: 480,
        fontSize: 16, padding: 12, color: p.text, backgroundColor: p.ink, placeholderColor: p.secondary, disabled: options.pending,
        onChange: options.onInput, onSubmit: options.onSubmit,
    });
    button('send', content, [586, 589, 142, 48], () => options.onSubmit(field.getValue()), { label: 'Send', tone: 'hero', disabled: options.pending });
    if (training) {
        const guide = ui.frame(content, [748, 96, 404, 188], p.ink, p.teal);
        ui.label(guide, [14, 10, 370, 28], 'Training guidance', { display: true, size: 22 });
        ui.label(guide, [14, 51, 370, 64], 'Use the mission consoles to review objectives, schedule work, and assign leads.',
            { size: 15, color: p.secondary, wrap: true, top: true });
        button('aries-objectives', guide, [14, 127, 177, 40], options.onObjectives, { label: 'Objectives', tone: 'hero' });
        button('aries-work', guide, [204, 127, 177, 40], options.onWorkOrders, { label: 'Work Orders' });
    } else drawTaskReview(options);
    return field.entity;
}

function drawTaskReview(options: TerminalOptions): void {
    const { ui, state, content, button, draft } = options;
    const p = ui.palette;
    const review = ui.frame(content, [748, 96, 404, 362], p.ink, p.teal);
    const order = !draft ? undefined : draft.kind === 'custom' ? customWorkOrder(draft.task, 'draft') : findOrder(state, draft.orderId);
    const id = draft?.kind === 'procedure' ? draft.orderId : draft?.reviseId;
    const active = id ? state.tharsis.work.find(job => job.orderId === id) : undefined;
    const equipment = draft?.kind === 'custom' && draft.task.decommission;
    ui.label(review, [14, 6, 368, 25], active ? 'PROPOSED REVISION' : 'TASK DRAFT', { size: 14, color: p.amber });
    if (!draft || !order) {
        ui.label(review, [14, 44, 364, 74], 'A task will appear here when the discussion has a procedure ready to review.', { wrap: true, top: true, color: p.secondary });
    } else {
        const method = draft.kind === 'procedure' ? draft.method : [];
        const crew = stationCrew(state).filter(member => !workLeadProblem(state, order, method, member));
        const lead = crew.find(member => member.id === draft.leadId && member.health > 0) ??
            crew.find(member => member.id === active?.leadId && member.health > 0) ?? preferredLead(crew, order, state);
        const quote = lead && quoteForLead(state, order, method, lead);
        const existing = active ? scheduledOrder(active, state.tharsis.expedition) : draft.kind === 'procedure' ? order : null;
        const previous = lead && existing && quoteForLead(state, existing, active?.method ?? [], lead);
        const reason = draftProblem(state, draft);
        const detail = method.length ? method.map(id => TECHNIQUES[id]).join(' ') : order.description;
        ui.label(review, [14, 37, 370, 60], order.title, { display: true, size: 24, top: true, wrap: true });
        if (quote && lead) {
            const timing = previous && previous.sols !== quote.sols ? `${previous.sols} → ${quote.sols} Sol` : `${quote.sols} Sol`;
            ui.label(review, [14, 94, 370, 24], `${timing}  ·  ${lead.name.split(' ')[0]}  ·  ${order.category}`, { size: 15, color: p.cyan });
            ui.label(review, [14, 122, 370, 24], `Per Sol  ${resources(quote.cost, '−') || '0 used'}`, { size: 14, color: p.secondary });
            ui.label(review, [14, 147, 370, 24], `On completion  ${resources(quote.output, '+') || 'Work order progress'}`, { size: 14, color: p.good });
            if (previous && resources(previous.cost, '−') !== resources(quote.cost, '−')) {
                ui.label(review, [14, 173, 370, 22], `Previous draw  ${resources(previous.cost, '−') || '0'}`, { size: 13, color: p.muted });
            } else if (previous && resources(previous.output, '+') !== resources(quote.output, '+')) {
                ui.label(review, [14, 173, 370, 22], `Previous yield  ${resources(previous.output, '+') || '0'}`, { size: 13, color: p.muted });
            } else if (order.exterior) ui.label(review, [14, 173, 370, 22], 'Exterior shift · Weather restrictions apply', { size: 13, color: p.amber });
        }
        ui.label(review, [14, 199, 370, 65], detail, { size: 13, wrap: true, top: true, color: p.secondary });
        if (equipment) ui.label(review, [14, 262, 370, 42], STATION_EQUIPMENT[equipment].loss, { size: 13, wrap: true, top: true, color: p.amber });
        if (reason || options.notice) ui.label(content, [760, 62, 378, 29], reason ?? options.notice, { size: 12, wrap: true, color: p.amber });
        button('discard-draft', review, [14, 307, 114, 36], options.onDiscard, { label: 'Discard' });
        button('schedule-draft', review, [140, 307, 244, 36], options.onAccept, {
            label: active ? 'Apply revision' : 'Schedule task', tone: reason ? 'plain' : 'primary', disabled: Boolean(reason) || options.pending,
        });
    }

    const queue = ui.frame(content, [748, 470, 404, 167], p.ink);
    const jobs = state.tharsis.work;
    ui.label(queue, [14, 4, 214, 28], `SCHEDULED  ${jobs.length}`, { size: 13, color: p.cyan });
    button('review-queue', queue, [239, 6, 145, 31], options.onQueue, { label: 'Open queue', labelSize: 15 });
    if (!jobs.length) ui.label(queue, [14, 46, 368, 28], 'No tasks scheduled', { size: 14, color: p.muted });
    jobs.slice(-3).forEach((job, index) => {
        const title = scheduledOrder(job, state.tharsis.expedition).title;
        const lead = state.crew.find(member => member.id === job.leadId);
        ui.label(queue, [14, 43 + index * 35, 370, 19], title, { size: 14 });
        ui.label(queue, [14, 61 + index * 35, 370, 16], lead ? `Lead  ${lead.name.split(' ')[0]}` : 'Awaiting assignment', { size: 12, color: p.secondary });
    });
}
