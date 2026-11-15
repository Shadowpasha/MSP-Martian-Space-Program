import type { Entity } from 'esengine';
import { formatResource, resourceEntries } from '../data/missions';
import { STATION_EQUIPMENT } from '../data/tharsisEquipment';
import { expeditionOrders, TECHNIQUES, type Technique, type WorkOrder } from '../data/tharsisOrders';
import { cycleShelter, resourceForecast, type TharsisState } from '../simulation/tharsis';
import { crewAbilityStatus, stationShiftCapacity } from '../simulation/crewAbilities';
import { LOW_MORALE, moralePace } from '../simulation/tharsisConditions';
import { acceptWork, assignWork, assignmentProblem, cancelWork, equipmentBlock, findOrder, missingPrerequisites, orderBlock, preferredLead,
    quoteForLead, scheduledOrder, stationCrew, workDraftBlock, workLeadProblem } from '../simulation/tharsisWork';
import type { Bounds, FlightUi } from './flightUi';
import type { RunButton } from './tharsisFlight';

const TABS = [
    ['rover', 'Rover Bay'], ['instruments', 'Instrument Lab'], ['life', 'Life Support'], ['stores', 'Field Stores'],
    ['crew', 'Field Crew'],
] as const;
export type WorkPanel = typeof TABS[number][0] | 'assignments';

const METHOD_LABELS: Record<Technique, string> = {
    specialist: 'Specialist', parallel: 'Parallel', recycle: 'Reuse spares', conserve: 'Pulse test', dry: 'Closed cycle',
};

interface ConsoleOptions {
    state: TharsisState;
    ui: FlightUi;
    content: Entity;
    button: RunButton;
    panel: WorkPanel;
    selected: string | null;
    methods: ReadonlyMap<string, Technique>;
    selectMethod: (id: string, technique: Technique | null) => void;
    change: (action: () => string | null) => void;
    open: (tab: WorkPanel | 'roverChecklist' | 'aries', id?: string) => void;
    chooseDefault: (id: string) => void;
    leadDrag: (entity: Entity, crewId: string, home: Bounds) => void;
    setDrop: (entity: Entity, orderId: string) => void;
    dragging: (entity: Entity) => boolean;
}

export function showWorkConsole(options: ConsoleOptions): void {
    const { ui, content, state, button, panel, open } = options;
    const p = ui.palette;
    if (panel !== 'assignments') {
        TABS.forEach(([key, title], index) => button(`tab-${key}`, content, [20 + index * 176, 64, 166, 36], () => open(key), {
            label: title, tone: panel === key ? 'hero' : 'plain',
        }));
        button('view-scheduled', content, [920, 64, 232, 36], () => open('assignments'), { label: 'Scheduled tasks' });
    } else button('view-required', content, [20, 64, 232, 36], () => open('rover'), { label: 'Browse work orders' });
    const list = ui.frame(content, [20, 116, 376, 480], p.ink);
    const inspector = ui.frame(content, [412, 116, 740, 480], p.ink, p.teal);
    const run = state.tharsis;
    if (panel === 'life') {
        button('shelter', content, [810, 12, 208, 42], () => options.change(() => cycleShelter(state)), {
            label: `Shelter · ${run.shelter}`, tone: run.shelter !== 'off' ? 'hero' : 'plain',
        });
        button('rations', content, [590, 12, 208, 42], () => options.change(() => {
            state.rationPolicy = state.rationPolicy === 'full' ? 'half' : 'full';
            return state.rationPolicy === 'half' ? 'Half rations save Food and lower Morale.' : 'Full rations restored.';
        }), { label: state.rationPolicy === 'full' ? 'Full rations' : 'Half rations' });
    }
    const orders = panel === 'assignments' ? run.work.map(job => scheduledOrder(job, run.expedition)) : expeditionOrders(run.expedition).filter(order => order.bay === panel);
    const held = new Map(resourceForecast(state, 'station').tasks.filter(flow => flow.hold).map(flow => [flow.orderId, flow.hold]));
    const selected = orders.find(order => order.id === options.selected) ?? orders[0];
    if (selected && options.selected !== selected.id) options.chooseDefault(selected.id);
    ui.label(list, [12, 4, 340, 32], panel === 'assignments' ? 'Scheduled shifts' : 'Station work orders', { display: true, size: 22, color: p.amber });
    const assignmentPage = panel === 'assignments' ? Math.max(0, Math.floor(orders.findIndex(order => order.id === selected?.id) / 7)) : 0;
    const visible = orders.slice(assignmentPage * 7, assignmentPage * 7 + 7);
    visible.forEach((order, index) => {
        const active = run.work.find(job => job.orderId === order.id);
        const disabled = equipmentBlock(state, order);
        const blocker = orderBlock(state, order);
        const row = button(`order-${order.id}`, list, [12, 44 + index * 54, 344, 48], () => open(panel, order.id), {
            tone: selected?.id === order.id ? 'hero' : 'tile',
        });
        ui.label(row.entity, [10, 3, 320, 24], order.title, { display: true, size: 19 });
        const hold = held.get(order.id);
        ui.label(row.entity, [10, 27, 320, 16], disabled ? 'Equipment unavailable' : hold ? `Held · ${hold}` :
            active ? 'Staffed' : blocker ?? 'Ready', {
            size: 12, fit: 11, color: disabled ? p.bad : hold ? p.amber : active ? p.cyan : blocker === 'Complete' ? p.good : blocker ? p.muted : p.amber,
        });
    });
    if (orders.length > 7) {
        button('assignment-prev', list, [12, 432, 150, 34], () => open(panel, orders[(assignmentPage - 1) * 7]?.id), { label: 'Previous', disabled: !assignmentPage });
        button('assignment-next', list, [204, 432, 150, 34], () => open(panel, orders[(assignmentPage + 1) * 7]?.id), { label: 'More', disabled: (assignmentPage + 1) * 7 >= orders.length });
    }
    if (!orders.length) ui.label(list, [12, 56, 336, 70], panel === 'assignments' ? 'Choose a work order to schedule its first shift.' : 'Select a station room to browse all work orders.', { wrap: true, top: true });
    if (panel === 'crew') button('choosePair', list, [12, 416, 344, 44], () => open('roverChecklist'), { label: 'Choose the field pair' });
    if (!selected) {
        ui.label(inspector, [16, 20, 690, 48], 'Select a scheduled shift to assign its lead.', { display: true, size: 24, wrap: true });
        return;
    }
    const job = run.work.find(item => item.orderId === selected.id);
    const block = orderBlock(state, selected);
    const technique = options.methods.get(selected.id);
    const method = job?.method ?? (technique ? [technique] : []);
    const crew = stationCrew(state).filter(member => !workLeadProblem(state, selected, method, member));
    const lead = crew.find(member => member.id === job?.leadId) ?? preferredLead(crew, selected, state);
    const quote = lead && quoteForLead(state, selected, method, lead);
    const perShift = (cost: Parameters<typeof resourceEntries>[0]) => resourceEntries(cost).map(([key, val]) => formatResource(key, val)).join(' · ') || 'No resource draw';
    ui.label(inspector, [16, 6, 692, 38], selected.title, { display: true, size: 26, color: p.cyan });
    ui.label(inspector, [16, 48, 692, 54], selected.description, { size: 16, wrap: true, top: true });
    ui.label(inspector, [16, 108, 692, 48], block && !job ? block : `Specialists  ${selected.specialists.join(' / ')}`, {
        size: 15, color: block && !job ? block === 'Complete' ? p.good : p.amber : p.secondary, wrap: true,
    });
    if (quote) {
        const salvage = job?.custom?.decommission;
        if (salvage) ui.label(inspector, [16, 151, 692, 38], STATION_EQUIPMENT[salvage].loss, { wrap: true, size: 14, color: p.amber });
        const label = job ? `Remaining ${(Math.max(0, quote.shifts - job.progress)).toFixed(1)} work · ${quote.rate}/Sol · ${perShift(quote.cost)}/Sol` : `${technique ? METHOD_LABELS[technique] : 'Standard'} with ${lead.name.split(' ')[0]}   ${quote.sols} Sol · ${perShift(quote.cost)} / Sol`;
        ui.label(inspector, [16, 189, 692, 28], label, { size: 14, color: p.amber });
        if (selected.yield) ui.label(inspector, [16, 218, 690, 26], `Completion yield  ${perShift(quote.output)}`, { size: 14, color: p.good });
    }
    if (job) {
        const hold = held.get(selected.id);
        if (hold) ui.label(inspector, [16, 144, 692, 42], `Held this Sol · ${hold}`, { size: 14, color: p.amber, wrap: true });
        drawAssignments(options, inspector, selected, job.leadId);
        return;
    }
    const prerequisite = findOrder(state, missingPrerequisites(state, selected)[0] ?? '');
    if (prerequisite && prerequisite.bay !== 'custom') {
        const tab = run.work.some(item => item.orderId === prerequisite.id) ? 'assignments' : prerequisite.bay;
        button('prerequisite', inspector, [16, 256, 692, 44], () => open(tab, prerequisite.id), {
            label: `Open prerequisite · ${prerequisite.title}`, tone: 'hero',
        });
    } else if (block && selected.id === 'suits' && run.fieldPair.length !== 2) {
        button('choose-travelers', inspector, [16, 256, 330, 44], () => open('roverChecklist'), { label: 'Choose travelers', tone: 'hero' });
    }
    if (!block) {
        const leadOptions = crew.map(member => {
            const candidate = quoteForLead(state, selected, method, member);
            return `${member.name.split(' ')[0]} ${candidate.sols} Sol`;
        });
        ui.label(inspector, [16, 252, 688, 52], `Eligible leads   ${leadOptions.join(' · ')}`, { size: 14, color: p.secondary, wrap: true, top: true });
    }
    if (!block && selected.methods?.length) {
        const choices = [null, ...selected.methods];
        const width = Math.min(136, Math.floor(692 / choices.length) - 6);
        choices.forEach((id, index) => {
            const eligible = id !== 'specialist' || stationCrew(state).some(member => !workLeadProblem(state, selected, ['specialist'], member));
            button(`method-${id ?? 'standard'}`, inspector, [16 + index * (width + 6), 306, width, 36], () => options.selectMethod(selected.id, id), {
                label: id ? METHOD_LABELS[id] : 'Standard', labelSize: 15, disabled: !eligible, tone: id === (technique ?? null) ? 'hero' : 'plain',
            });
        });
        if (technique) ui.label(inspector, [16, 350, 689, 54], TECHNIQUES[technique], { size: 14, color: p.secondary, wrap: true, top: true });
    }
    const scheduleBlock = block ?? workDraftBlock(state, selected, method);
    if (scheduleBlock && !block) ui.label(inspector, [302, 374, 406, 39], scheduleBlock, { size: 14, color: p.amber, wrap: true });
    if (!block) button('consult', inspector, [16, 420, 270, 40], () => open('aries', selected.id), { label: 'Discuss procedure' });
    button('schedule', inspector, [402, 420, 306, 40], () => options.change(() => {
        const reason = acceptWork(state, selected, method);
        if (!reason) open('assignments', selected.id);
        return reason;
    }), { label: block === 'Complete' ? 'Complete' : block ? 'Work order locked' : 'Schedule work order',
        tone: scheduleBlock ? 'plain' : 'primary', disabled: Boolean(scheduleBlock) });
}

function drawAssignments(options: ConsoleOptions, inspector: Entity, order: WorkOrder, leadId: string | null) {
    const { ui, state, button, change, open } = options;
    const p = ui.palette;
    const target = ui.frame(inspector, [16, 248, 692, 48], p.raised, p.teal);
    options.setDrop(target, order.id);
    const lead = state.crew.find(member => member.id === leadId);
    ui.label(target, [10, 0, 664, 40], lead ? `Shift lead  ${lead.name} · ${lead.role}` : 'Select or drag an eligible crew card here', { size: 16, color: p.cyan, center: true });
    const candidate = state.tharsis.work.find(job => job.orderId === order.id)!;
    const disabled = equipmentBlock(state, order);
    stationCrew(state).forEach((member, index) => {
        const blocker = assignmentProblem(state, order.id, member.id);
        const eligible = !blocker;
        const quote = quoteForLead(state, order, candidate.method, member);
        const bounds = [16 + index * 176, 312, 164, 92] as const;
        const control = button(`lead-${member.id}`, inspector, bounds, () => {
            if (!options.dragging(control.entity)) change(() => assignWork(state, order.id, member.id));
        }, { disabled: !eligible, tone: leadId === member.id ? 'hero' : 'tile' });
        if (eligible) options.leadDrag(control.entity, member.id, bounds);
        ui.image(control.entity, [8, 8, 44, 56], member.portraitPath);
        ui.label(control.entity, [57, 8, 102, 24], member.name.split(' ')[0]!, { display: true, size: 19 });
        ui.label(control.entity, [57, 32, 102, 21], `Morale ${member.morale}%`, { size: 12, color: member.morale < LOW_MORALE ? p.bad : p.secondary });
        const penalty = Math.round((1 - moralePace(member.morale)) * 100);
        const occupied = state.tharsis.work.filter(job => job.leadId === member.id).length;
        const slots = stationShiftCapacity(state, member);
        const status = slots === 2 ? `${occupied}/2 shifts` : occupied && leadId !== member.id ? 'Reassign' : quote.specialist ? 'Specialist' : 'Backup';
        const unavailable = member.role === 'scientist' && (!slots || slots === 2) ? crewAbilityStatus(state, member) : blocker;
        ui.label(control.entity, [6, 60, 152, 30], eligible ? `${quote.sols} Sol · ${penalty ? `−${penalty}% pace` : status}` :
            (slots === 2 ? '2/2 shifts assigned' : unavailable ?? 'Unavailable'), {
            size: 12, fit: 11, color: eligible ? p.amber : p.muted, center: true, wrap: true,
        });
    });
    button('unassign', inspector, [16, 420, 220, 40], () => change(() => assignWork(state, order.id, null)), { label: 'Unassign lead', disabled: !leadId });
    if (!candidate.progress && !disabled) button('discuss-scheduled', inspector, [246, 420, 232, 40], () => open('aries', order.id), { label: 'Discuss revision' });
    button('cancel', inspector, [488, 420, 220, 40], () => change(() => { cancelWork(state, order.id); open('assignments'); return null; }), { label: 'Cancel order' });
}
