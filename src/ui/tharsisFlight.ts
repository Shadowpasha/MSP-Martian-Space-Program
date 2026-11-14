import { Draggable, UINode, UIPositionType, px, uiNodeWorldBox, type Entity, type FocusManagerState,
    type InputState, type UIEventQueue, type World } from 'esengine';
import type { MainLoopResult, MissionSetupInput, ResourcePool } from '../contracts/gameContract';
import { formatResource, resourceEntries, RESOURCE_LABELS } from '../data/missions';
import { CHECKLIST, type Technique } from '../data/tharsisOrders';
import { assistantIsAvailable, checkGeminiConnection } from '../services/geminiPlanner';
import { discussWork, draftSurveyBriefing, type DiscussionMessage, type TaskDraft } from '../services/tharsisAries';
import { advanceSol, commitBriefing, continueAfterOutcome, continueAfterReport, createInitialGameState, isTharsis } from '../simulation/solEngine';
import { defaultLoad, expeditionFor, fieldCrew, fieldReturnEstimate, resourceForecast, roverPosition, stormDay, type RoverLoad } from '../simulation/tharsis';
import { resolveBriefing, choiceBlock, commitmentLabel } from '../simulation/tharsisEvents';
import { dutyMoraleLoss, FIELD_REST_MORALE, LOW_MORALE, radiationEffects, REST_MORALE, SEVERE_MORALE } from '../simulation/tharsisConditions';
import { acceptCustomWork, acceptWork, assignWork, findOrder, stationCrew } from '../simulation/tharsisWork';
import { makeFlightUi, type Bounds, type FlightArt, type FlightUi } from './flightUi';
import { showRoverChecklist, showStorage } from './tharsisManifest';
import { RESOURCE_KEYS, resourceRate, runway, showConditions, showResources, signed } from './tharsisResources';
import { showTerminal, type TerminalStatus } from './tharsisTerminal';
import { showWorkConsole, type WorkPanel } from './tharsisWorkConsole';
import { makeAbsBox } from './theme';

const STATION = 'assets/textures/tharsis_station.png';
const SITE = 'assets/textures/tharsis_site.png';
const ROOM_NAMES = ['Rover Bay', 'Instrument Lab', 'Life Support', 'Storage'] as const;
type Panel = WorkPanel | 'roverChecklist' | 'cargo' | 'roverCargo' | 'log' | 'aries' | 'resources' | 'conditions';

interface Options {
    world: World;
    root: Entity;
    events: UIEventQueue;
    input: InputState;
    focus: FocusManagerState;
    art: FlightArt;
    setup: MissionSetupInput;
    profile: { highContrast: boolean; reducedMotion: boolean };
    onFinish: (result: MainLoopResult) => void;
    onExit: (target: 'menu' | 'mission') => void;
}

export type RunButton = (key: string, parent: Entity, bounds: Bounds, action: () => void, options?: Parameters<FlightUi['button']>[3]) => ReturnType<FlightUi['button']>;

function resourceLine(pool: ResourcePool, inRover = false): string {
    return resourceEntries(pool).map(([key, val]) => inRover && key === 'oxygen' ? `${val} O₂` : formatResource(key, val)).join('   ');
}

export function mountTharsisFlight({ world, root, events, input, focus, art, setup, profile, onFinish, onExit }: Options) {
    const initial = createInitialGameState(setup);
    if (!isTharsis(initial)) throw new Error('Expected the Tharsis expedition setup.');
    const state = initial;
    const run = state.tharsis;
    let ui: FlightUi;
    let view: 'station' | 'expedition' = 'station';
    let panel: Panel | null = null;
    let selected: string | null = null;
    let draft: RoverLoad | null = null;
    let message = '';
    let dirty = true;
    let surface: Entity | null = null;
    let ask: AbortController | null = null;
    let sentMessage: DiscussionMessage | null = null;
    let pendingBriefing: AbortController | null = null;
    let topic: string | null = null;
    const conversations = new Map<string | null, { messages: DiscussionMessage[]; draft: TaskDraft | null }>();
    const methods = new Map<string, Technique>();
    let chatPage = 0;
    let terminalStatus: TerminalStatus = 'checking';
    let pendingCheck = false;
    let draftNotice = '';
    let prompt = '';
    let selectedResource: keyof ResourcePool = 'energy';
    let resourcePage = 0;
    let moraleInfo = false;
    let reportPage = 0;
    let textInput: Entity | null = null;
    let controls = new Map<string, Entity>();
    let dragCards: { entity: Entity; crewId: string; home: Bounds }[] = [];
    let dropTarget: { entity: Entity; orderId: string } | null = null;
    const dragged = new Set<Entity>();
    const stop = world.onDespawn(entity => {
        if (entity !== root) return;
        stop();
        ask?.abort();
        pendingBriefing?.abort();
    });

    function open(next: Panel | null, orderId?: string) {
        panel = next;
        selected = orderId ?? null;
        message = '';
        moraleInfo = false;
        if (next === 'aries') {
            const nextTopic = orderId ?? null;
            if (topic !== nextTopic) {
                topic = nextTopic;
                prompt = '';
                chatPage = 0;
                draftNotice = '';
            }
            if (terminalStatus === 'checking' && !pendingCheck) {
                pendingCheck = true;
                void checkGeminiConnection().then(() => {
                    if (!world.valid(root)) return;
                    pendingCheck = false;
                    if (!ask && terminalStatus === 'checking') terminalStatus = assistantIsAvailable() ? 'connected' : 'unavailable';
                    if (panel === 'aries') dirty = true;
                });
            }
        }
        dirty = true;
    }

    function change(action: () => string | null) {
        message = action() ?? '';
        dirty = true;
    }

    function button(key: string, parent: Entity, bounds: Bounds, action: () => void, options?: Parameters<FlightUi['button']>[3]) {
        const control = ui.button(parent, bounds, action, options);
        controls.set(key, control.entity);
        return control;
    }

    function leadDrag(entity: Entity, crewId: string, home: Bounds) {
        world.insert(entity, Draggable, {
            enabled: true, dragThreshold: 6, lockX: false, lockY: false, constrainMin: false, constraintMin: { x: 0, y: 0 },
            constrainMax: false, constraintMax: { x: 0, y: 0 },
        });
        dragCards.push({ entity, crewId, home });
    }

    function conversation() {
        let room = conversations.get(topic);
        if (!room) {
            room = { messages: [], draft: null };
            conversations.set(topic, room);
        }
        return room;
    }

    function submit(value: string) {
        const text = value.trim().slice(0, 480);
        if (!text || ask) return;
        const room = conversation();
        const requestedTopic = topic;
        const operation = new AbortController();
        ask = operation;
        const previous = room.messages[room.messages.length - 1];
        sentMessage = previous?.speaker === 'crew' && previous.text === text ? previous : { speaker: 'crew', text };
        if (sentMessage !== previous) room.messages.push(sentMessage);
        chatPage = 0;
        draftNotice = '';
        prompt = '';
        dirty = true;
        void discussWork(state, requestedTopic, room.messages, room.draft, operation.signal).then(reply => {
            if (!world.valid(root) || operation.signal.aborted) return;
            ask = null;
            sentMessage = null;
            terminalStatus = reply ? 'connected' : 'unavailable';
            if (reply) {
                room.messages.push({ speaker: 'aries', text: reply.message });
                if (reply.draft !== undefined) room.draft = reply.draft;
            } else if (topic === requestedTopic && !prompt) prompt = text;
            if (panel === 'aries') dirty = true;
        });
    }

    function pickResource(key: keyof ResourcePool) {
        selectedResource = key;
        resourcePage = 0;
        open('resources');
    }

    function acceptDraft() {
        const room = conversation();
        if (!room.draft) return;
        const proposed = room.draft;
        let id: string;
        if (proposed.kind === 'custom') {
            const result = acceptCustomWork(state, proposed.task, proposed.reviseId);
            if ('reason' in result) { draftNotice = result.reason; dirty = true; return; }
            id = result.id;
        } else {
            const order = findOrder(state, proposed.orderId);
            const reason = order ? acceptWork(state, order, proposed.method, true) : 'That work order is unavailable.';
            if (reason) { draftNotice = reason; dirty = true; return; }
            id = proposed.orderId;
        }
        room.draft = null;
        open('assignments', id);
    }

    function endSol() {
        const result = advanceSol(state);
        if (!result.advanced) { message = result.reason ?? ''; dirty = true; return; }
        if (sentMessage && !prompt) prompt = sentMessage.text;
        sentMessage = null;
        ask?.abort();
        ask = null;
        open(null);
        reportPage = 0;
        if (state.result) onFinish(state.result);
        else if (!run.briefingCommitted) {
            const operation = new AbortController();
            pendingBriefing = operation;
            const sol = state.sol;
            void draftSurveyBriefing(state, operation.signal).then(briefing => {
                if (!world.valid(root) || operation.signal.aborted) return;
                pendingBriefing = null;
                if (briefing) {
                    commitBriefing(state, sol, briefing);
                    terminalStatus = 'connected';
                } else terminalStatus = 'unavailable';
                dirty = true;
            });
        }
    }

    function closeReport() {
        pendingBriefing?.abort();
        pendingBriefing = null;
        continueAfterReport(state);
        dirty = true;
    }

    function board(root: Entity, interactive: boolean) {
        const p = ui.palette;
        const atSite = view === 'expedition';
        const rover = run.rover;
        const local = atSite && rover ? rover : state;
        const sol = run.phase === 'report' ? run.reportSol : state.sol;
        const day = stormDay(state, sol);
        const weatherAtSol = run.phase === 'report' ? state.timeline[state.timeline.length - 1]?.weather ?? state.conditions.weather : state.conditions.weather;
        ui.image(root, [0, 0, 1280, 720], atSite ? SITE : STATION);
        if (day) ui.box(root, [0, 98, 1280, 476], { r: 0.41, g: 0.15, b: 0.08, a: 0.26 });
        const clock = ui.frame(root, [12, 12, 376, 84], p.ink, day ? p.rust : p.edge);
        ui.label(clock, [14, 4, 352, 34], expeditionFor(state).region, { display: true, size: 33, fit: 20 });
        ui.label(clock, [16, 44, 342, 22], `SOL ${sol} / ${state.goal.deadlineSol}   ·   ${atSite ? 'EXPEDITION' : 'STATION'}`, { color: p.amber, size: 15 });

        const monitor = ui.frame(root, [400, 12, 868, 84], p.ink, p.teal);
        const forecast = interactive ? resourceForecast(state, atSite && rover ? 'rover' : 'station') : null;
        const values = [local.conditions.radiation, local.conditions.morale];
        let tooltipTarget: Entity | null = null;
        RESOURCE_KEYS.forEach((key, index) => {
            const x = 12 + index * 121;
            if (index) ui.box(monitor, [x - 10, 12, 2, 52], p.teal);
            const value = local.resources[key];
            const suffix = key === 'oxygen' ? atSite && rover ? ' u' : '%' : '';
            const rate = forecast && resourceRate(forecast, key);
            const drain = rate ? rate.use - rate.passive : 0;
            const color = drain > 0 && value / drain <= 2 ? p.bad : p.cyan;
            const cell = interactive ? button(`resource-${key}`, monitor, [x - 4, 4, 112, 67], () => pickResource(key),
                { tone: 'tile' }).entity : ui.group(monitor, [x - 4, 4, 112, 67]);
            ui.label(cell, [7, 2, 100, 17], RESOURCE_LABELS[key], { size: 12, color: p.secondary });
            ui.label(cell, [7, 20, 100, 25], `${value}${suffix}`, { display: true, size: 23, color });
            if (rate) ui.label(cell, [7, 47, 100, 17], `${signed(rate.daily)} / Sol`, { size: 12, color: rate.daily < 0 ? p.amber : p.good });
            if (forecast && rate) {
                ui.on(cell, 'hover_enter', () => reveal(cell, key));
                ui.on(cell, 'hover_exit', () => hide(cell));
                ui.on(cell, 'focus', () => { if (ui.hasKeyboardFocus(cell)) reveal(cell, key); });
                ui.on(cell, 'blur', () => hide(cell));
            }
        });
        values.forEach((value, index) => {
            const x = 617 + index * 121;
            const morale = index === 1;
            ui.box(monitor, [x - 10, 12, 2, 52], p.teal);
            ui.label(monitor, [x, 4, 105, 22], morale ? 'Morale' : 'Radiation', { size: 14, color: p.secondary });
            const caution = morale ? value < LOW_MORALE : radiationEffects(value).health > 0;
            ui.label(monitor, [x, 25, 108, 26], `${value}${morale ? '%' : ' mSv'}`, { display: true, size: 23, color: caution ? p.bad : p.cyan });
            if (forecast) ui.label(monitor, [x, 56, 108, 16],
                morale ? value < SEVERE_MORALE ? 'Severe strain' : caution ? 'Low' : 'Steady' : radiationEffects(value).level,
                { size: 12, color: caution ? p.amber : p.secondary });
        });

        const telemetry = ui.frame(root, [12, 108, 504, 46], p.ink, day ? p.rust : p.edge);
        const weather = `${weatherAtSol}${day ? ` ${day}/3` : ''}${run.phase !== 'report' ? ` · ${local.conditions.temperatureC} °C` : ''}`;
        ui.label(telemetry, [12, 0, 326, 38], weather, { size: 16, color: day || weatherAtSol === 'Dust Haze' ? p.amber : p.text });
        if (interactive) button('conditions', telemetry, [342, 3, 152, 34], () => open('conditions'), { label: 'Conditions', labelSize: 14 });
        if (interactive) {
            button('station', root, [928, 108, 152, 44], () => { view = 'station'; dirty = true; }, { label: 'Station', tone: !atSite ? 'hero' : 'plain' });
            button('expedition', root, [1088, 108, 180, 44], () => { view = 'expedition'; dirty = true; }, { label: 'Expedition', tone: atSite ? 'hero' : 'plain' });
        }

        if (!atSite) {
            const rooms = ['rover', 'instruments', 'life', 'cargo'] as const;
            ROOM_NAMES.forEach((title, i) => {
                if (interactive) button(rooms[i]!, root, [24 + 320 * i, 516, 272, 44], () => open(rooms[i]!), { label: title });
            });
        } else {
            const card = ui.frame(root, [24, 280, 416, 220], p.ink, p.teal);
            const eta = fieldReturnEstimate(state);
            const { site, surveyHours } = expeditionFor(state);
            const dockStatus = !rover ? `Return by Sol ${state.goal.deadlineSol}` :
                eta === null ? 'Critical exposure projected' : `Projected dock Sol ${eta}`;
            const dockRisk = rover && (eta === null || eta > state.goal.deadlineSol);
            const leg = rover?.phase === 'outbound' ? `En route to ${site} · ${rover.travelLeft} Sol left` : rover?.phase === 'returning' ? `Returning · ${rover.travelLeft} Sol left` :
                rover?.phase === 'site' ? `At ${site} · Survey active` : run.returnedWithData ? 'Docked · Data recovered' : `Docked · Readying for ${site}`;
            ui.label(card, [16, 8, 368, 44], rover ? 'Rover telemetry' : `${site[0]!.toUpperCase()}${site.slice(1)} overlook`, { display: true, size: 26, fit: 18, color: p.cyan });
            ui.label(card, [16, 58, 368, 38], leg, { wrap: true, size: 15 });
            ui.label(card, [16, 104, 368, 24], fieldCrew(state).map(member => member.name.split(' ')[0]).join(' + ') || 'No field crew selected', { color: p.secondary });
            ui.label(card, [16, 144, 368, 28], `${run.hours}/${surveyHours} consecutive hours`, { color: run.hours === surveyHours ? p.good : p.amber });
            ui.label(card, [16, 174, 368, 25], `${run.completed.harden ? 'Hardened' : 'Standard rover'} · ${dockStatus}`, { size: 14, color: dockRisk ? p.bad : p.secondary });
            const route = ui.frame(root, [24, 176, 416, 80], p.ink, p.teal);
            ui.label(route, [12, 0, 140, 28], 'STATION', { size: 13, color: p.secondary });
            ui.label(route, [240, 0, 152, 28], expeditionFor(state).site.replace(/^the /, '').toUpperCase(), { size: 13, color: p.secondary, fit: 10 });
            ui.box(route, [25, 44, 356, 4], p.teal);
            ui.box(route, [24, 39, 4, 14], p.secondary);
            ui.box(route, [379, 39, 4, 14], p.secondary);
            ui.icon(route, 10 + Math.round(356 * roverPosition(state)), 29, 32, 'rover', p.amber);
            if (interactive) button('fieldLoad', root, [24, 516, 416, 44], () => open(rover ? 'roverCargo' : 'roverChecklist'), { label: rover ? 'Rover supplies & return' : 'Open rover checklist' });
        }

        const checklist = ui.frame(root, [12, 572, 324, 136], p.ink);
        ui.label(checklist, [12, 1, 288, 22], 'Dispatch checklist', { display: true, size: 19, color: p.amber });
        CHECKLIST.forEach((item, index) => {
            const count = item.orders.filter(id => run.completed[id]).length;
            const text = `${item.label}  ${count}/${item.orders.length}`;
            if (interactive) button(`check-${item.bay}`, checklist, [12 + index % 2 * 152, 28 + Math.floor(index / 2) * 44, 144, 36], () => open(item.bay), { label: text, labelSize: 15 });
            else ui.label(checklist, [12 + index % 2 * 152, 28 + Math.floor(index / 2) * 44, 144, 36], text, { size: 14 });
        });
        const crew = ui.frame(root, [348, 572, 532, 136], p.ink);
        ui.label(crew, [12, 0, 420, 24], `Crew assignments   ${run.work.filter(job => job.leadId).length}/${stationCrew(state).length} assigned`, { display: true, size: 19 });
        if (interactive) button('morale-info', crew, [442, 1, 74, 23], () => { moraleInfo = !moraleInfo; dirty = true; }, { label: 'Morale', labelSize: 14, tone: moraleInfo ? 'hero' : 'plain' });
        state.crew.forEach((member, index) => {
            const x = 12 + index * 128;
            const active = run.work.find(job => job.leadId === member.id);
            const field = rover?.crewIds.includes(member.id);
            const bounds = [x, 28, 116, 92] as const;
            const card = interactive ? button(`crew-${member.id}`, crew, bounds, () => open('assignments', active?.orderId)).entity : ui.group(crew, bounds);
            ui.image(card, [4, 12, 38, 48], member.portraitPath);
            ui.label(card, [44, 10, 68, 24], member.name.split(' ')[0]!, { display: true, size: 16 });
            const streak = run.dutyStreak[member.id] ?? 0;
            ui.label(card, [44, 32, 68, 18], `${member.health} HP`, { size: 11, color: p.secondary });
            ui.label(card, [44, 48, 70, 17], `${member.morale}% Morale`, { size: 10, color: member.morale < LOW_MORALE ? p.bad : p.good });
            const duty = field ? 'Expedition' : 'Assigned';
            ui.label(card, [5, 67, 106, 20], member.health <= 0 ? 'Incapacitated' : field || active ? streak ? `Duty streak ${streak}` : duty : 'Rest next Sol', { center: true, size: 12, color: member.health <= 0 ? p.bad : field ? p.cyan : active ? p.amber : p.muted });
        });
        const ops = ui.frame(root, [892, 572, 376, 136], p.ink, p.teal);
        if (interactive) {
            button('aries', ops, [8, 8, 111, 43], () => open('aries'), { label: 'A.R.I.E.S.', tone: 'hero' });
            button('roverChecklist', ops, [127, 8, 145, 43], () => open(rover ? 'roverCargo' : 'roverChecklist'), { label: rover ? 'Field supplies' : 'Rover checklist', labelSize: 15 });
            button('tasks', ops, [280, 8, 80, 43], () => open('assignments'), { label: 'Tasks', labelSize: 16 });
            button('log', ops, [8, 64, 74, 52], () => open('log'), { label: 'Log' });
            button('endSol', ops, [91, 64, 269, 52], endSol, { label: 'End Sol', tone: 'primary' });
        } else ui.label(ops, [12, 17, 344, 92], 'Operations control', { display: true, size: 26, center: true, color: p.cyan });
        if (interactive && moraleInfo) {
            const morale = ui.frame(root, [371, 334, 504, 224], p.ink, p.teal);
            ui.label(morale, [14, 8, 454, 31], 'Crew Morale', { display: true, size: 23 });
            ui.label(morale, [14, 48, 470, 50], `Working costs ${dutyMoraleLoss(1)} to ${dutyMoraleLoss(4)} points per Sol as the duty streak grows. A rest Sol restores ${REST_MORALE} and resets the streak.`, { size: 15, wrap: true, top: true });
            ui.label(morale, [14, 103, 470, 52], `Pace drops 25% below ${LOW_MORALE}% Morale and 50% below ${SEVERE_MORALE}%. Field crew must rest below ${FIELD_REST_MORALE}%.`, { size: 15, wrap: true, color: p.amber, top: true });
            ui.label(morale, [14, 160, 470, 46], 'Unassign leads in Scheduled tasks or plan a field rest in Expedition supplies.', { size: 14, wrap: true, color: p.secondary, top: true });
        }
        if (!forecast) return;
        const tooltip = ui.group(root, [524, 104, 394, 90]);
        const tipFrame = ui.frame(tooltip, [0, 0, 394, 90], p.ink, p.cyan);
        const tipTitle = ui.label(tipFrame, [12, 2, 360, 29], '', { display: true, size: 19, color: p.cyan });
        const tipText = ui.label(tipFrame, [12, 34, 360, 30], '', { size: 14, color: p.text });
        ui.show(tooltip, false);
        function reveal(entity: Entity, key: keyof ResourcePool) {
            tooltipTarget = entity;
            ui.setText(tipTitle, RESOURCE_LABELS[key]);
            ui.setText(tipText, runway(local.resources[key], forecast!, key));
            ui.show(tooltip, true);
        }
        function hide(entity: Entity) {
            if (tooltipTarget === entity) ui.show(tooltip, false);
        }
    }

    function console(bounds: Bounds, title: string, detail?: string): Entity {
        ui.box(ui.root, [0, 0, 1280, 720], { r: 0.04, g: 0.045, b: 0.075, a: 0.82 });
        const content = ui.frame(ui.root, bounds, ui.palette.panel, ui.palette.teal);
        ui.label(content, [20, 10, bounds[2] - 48, 44], title, { display: true, size: 34 });
        if (detail) ui.label(content, [22, 58, bounds[2] - 52, 24], detail, { color: ui.palette.cyan, size: 15 });
        return content;
    }

    function phaseOverlay() {
        const p = ui.palette;
        if (run.phase === 'briefing') {
            const { briefing } = run;
            const box = console([132, 68, 1016, 584], briefing.title, `SOL ${state.sol} · ${briefing.area === 'rover' ? 'ROVER UPLINK' : 'STATION BRIEFING'}`);
            const storm = run.stormBriefing;
            if (storm) ui.label(box, [22, 91, 968, 60], `${storm.title.toUpperCase()}  ·  ${storm.observation}`, { size: 14, color: p.amber, wrap: true, top: true });
            ui.label(box, [22, storm ? 159 : 96, 968, 96], briefing.observation, { size: 18, wrap: true, top: true });
            const width = briefing.choices.length === 2 ? 476 : 312;
            briefing.choices.forEach((choice, index) => {
                const blocker = choiceBlock(state, choice);
                const card = ui.frame(box, [16 + (width + 16) * index, 260, width, 256], p.raised);
                ui.label(card, [12, 8, width - 32, 66], choice.action, { display: true, size: 22, wrap: true, top: true });
                ui.label(card, [12, 79, width - 32, 104], choice.detail, { size: 15, wrap: true, top: true });
                const commitment = commitmentLabel(choice);
                ui.label(card, [12, 183, width - 32, 27], blocker ?? (commitment ? `Uses ${commitment}` : 'No upfront cost'), { size: 13, color: blocker ? p.bad : p.secondary, wrap: true });
                button(`choice-${index}`, card, [12, 211, width - 32, 36], () => change(() => resolveBriefing(state, index)), { label: blocker ? 'Unavailable' : 'Commit decision', disabled: Boolean(blocker), tone: blocker ? 'plain' : 'hero' });
            });
            if (message) ui.label(box, [22, 530, 960, 26], message, { color: p.bad });
        } else if (run.phase === 'outcome') {
            const box = console([188, 188, 904, 344], run.briefing.title, 'DECISION OUTCOME');
            ui.label(box, [22, 100, 846, 78], run.outcome[0] ?? '', { size: 19, wrap: true, top: true });
            ui.label(box, [22, 184, 846, 46], run.outcome[1] ?? '', { size: 17, color: p.amber, wrap: true });
            button('planning', box, [570, 252, 302, 56], () => { continueAfterOutcome(state); dirty = true; }, { label: 'Open operations', tone: 'primary' });
        } else if (run.phase === 'report') {
            const box = console([120, 60, 1040, 596], `Sol ${run.reportSol} report`, 'STATION & EXPEDITION');
            const max = 7;
            const history = state.lastSolReport;
            history.slice(reportPage * max, reportPage * max + max).forEach((line, i) => {
                ui.label(box, [22, 88 + i * 44, 968, 42], line, { size: 16, wrap: true, color: /held|reset|Storm/.test(line) ? p.amber : p.text });
            });
            ui.label(box, [22, 408, 970, 28], `Station   ${resourceLine(state.resources)}`, { size: 15, color: p.cyan });
            if (run.rover) ui.label(box, [22, 441, 970, 28], `Rover     ${resourceLine(run.rover.resources, true)}`, { size: 15, color: p.amber });
            if (history.length > max) {
                button('reportPrev', box, [22, 512, 100, 44], () => { reportPage--; dirty = true; }, { label: 'Previous', disabled: !reportPage });
                button('reportNext', box, [132, 512, 100, 44], () => { reportPage++; dirty = true; }, { label: 'More', disabled: (reportPage + 1) * max >= history.length });
            }
            if (pendingBriefing) ui.label(box, [300, 514, 390, 44], 'A.R.I.E.S. is drafting the next briefing…', { size: 14, color: p.cyan });
            button('nextBrief', box, [736, 504, 268, 56], closeReport, { label: state.result ? 'View debrief' : 'Open next briefing', tone: 'primary' });
        } else if (state.result) {
            const result = state.result;
            const box = console([148, 88, 984, 544], result.outcome === 'victory' ? 'Survey complete' : 'Mission ended', `SOL ${result.solReached} · ${result.researchPointsEarned} RESEARCH EARNED`);
            ui.label(box, [22, 92, 912, 90], result.reason, { size: 22, wrap: true, color: result.outcome === 'victory' ? p.good : p.amber });
            result.lessons.slice(0, 4).forEach((lesson, index) => ui.label(box, [22, 192 + 58 * index, 912, 52], lesson, { size: 17, wrap: true }));
            button('menu', box, [22, 454, 286, 52], () => onExit('menu'), { label: 'Main Menu', tone: 'primary' });
            button('mission', box, [331, 454, 286, 52], () => onExit('mission'), { label: 'New Mission' });
        }
    }

    function render() {
        dirty = false;
        const lastKey = Array.from(controls).find(([, entity]) => focus.isVisiblyFocused(entity))?.[0];
        controls = new Map();
        dragCards = [];
        dropTarget = null;
        textInput = null;
        dragged.clear();
        if (surface !== null) world.despawn(surface);
        surface = makeAbsBox(world, root, 0, 0, 1280, 720);
        ui = makeFlightUi(world, events, surface, art, focus, profile);
        const planning = run.phase === 'planning';
        board(surface, planning && !panel);
        if (!planning) phaseOverlay();
        else if (panel) {
            const titles: Partial<Record<Panel, string>> = { roverChecklist: 'Rover Checklist', cargo: 'Station storage', roverCargo: 'Expedition supplies',
                log: 'Mission log', aries: 'A.R.I.E.S. Terminal', assignments: 'Scheduled tasks', resources: 'Resource management', conditions: 'Environmental conditions' };
            const title = titles[panel] ?? 'Work orders';
            const content = console([48, 28, 1184, 664], title);
            button('close', content, [1028, 12, 120, 42], () => open(null), { label: 'Close' });
            if (message) ui.label(content, [24, 608, 1120, 32], message, { color: ui.palette.amber, size: 15, wrap: true });
            if (panel === 'roverChecklist') {
                draft ??= defaultLoad(state);
                showRoverChecklist({ state, ui, content, button, draft, change, reset: () => { draft = defaultLoad(state); dirty = true; },
                    dispatch: () => { draft = null; view = 'expedition'; open(null); } });
            } else if (panel === 'cargo' || panel === 'roverCargo') {
                showStorage({ state, ui, content, button, area: panel === 'cargo' ? 'station' : 'rover', change, open: target => open(target) });
            } else if (panel === 'aries') {
                const room = conversation();
                textInput = showTerminal({ ui, content, world, events, button, state, topic, history: room.messages, page: chatPage, status: terminalStatus,
                    pending: Boolean(ask), prompt, draft: room.draft, notice: draftNotice, onSubmit: submit,
                    onInput: value => { prompt = value; }, onPage: value => { chatPage = value; dirty = true; },
                    onDiscard: () => { room.draft = null; draftNotice = ''; dirty = true; }, onAccept: acceptDraft,
                    onQueue: () => open('assignments'),
                });
            } else if (panel === 'resources') {
                showResources(ui, content, button, state, view === 'expedition' ? 'rover' : 'station', selectedResource, resourcePage,
                    key => { selectedResource = key; resourcePage = 0; dirty = true; }, page => { resourcePage = page; dirty = true; });
            } else if (panel === 'conditions') {
                showConditions(ui, content, button, state, view === 'expedition' ? 'rover' : 'station',
                    area => { view = area === 'rover' ? 'expedition' : 'station'; dirty = true; },
                    area => open(area === 'rover' ? 'roverCargo' : 'life'));
            } else if (panel === 'log') {
                const lines = state.dailyLog.slice(-9).reverse();
                lines.forEach((entry, index) => ui.label(content, [24, 84 + index * 52, 1120, 48], `SOL ${entry.sol}   ${entry.text}`, { size: 16, wrap: true, color: entry.kind === 'warn' ? ui.palette.amber : ui.palette.text }));
            } else {
                showWorkConsole({ state, ui, content, button, panel, selected,
                    methods, selectMethod: (id, technique) => { if (technique) methods.set(id, technique); else methods.delete(id); dirty = true; },
                    chooseDefault: id => { selected = id; }, change, open, leadDrag,
                    setDrop: (entity, orderId) => { dropTarget = { entity, orderId }; }, dragging: entity => dragged.has(entity),
                });
            }
        }
        if (lastKey) {
            const next = controls.get(lastKey) ?? controls.values().next().value;
            if (next !== undefined) focus.focus(next, true);
        }
    }

    return () => {
        if (dirty && !dragged.size) render();
        if (input.isKeyPressed('Escape') && panel) open(null);
        if (focus.focusedEntity !== textInput || textInput === null) ui.updateFocus(input);
        if (!dragCards.length) return;
        const starts = new Set(events.query('drag_start').map(event => event.target));
        const ends = new Set(events.query('drag_end').map(event => event.target));
        for (const card of dragCards) {
            if (starts.has(card.entity)) dragged.add(card.entity);
            if (!ends.has(card.entity)) continue;
            const current = uiNodeWorldBox(world, card.entity);
            const target = dropTarget && uiNodeWorldBox(world, dropTarget.entity);
            if (current && target && dropTarget && Math.abs(current.cx - target.cx) <= target.hw + current.hw * 0.4 &&
                Math.abs(current.cy - target.cy) <= target.hh + current.hh * 0.4) {
                change(() => assignWork(state, dropTarget!.orderId, card.crewId));
            }
            world.update(card.entity, UINode, node => {
                node.position = UIPositionType.Absolute;
                node.insetLeft = px(card.home[0]);
                node.insetTop = px(card.home[1]);
            });
            dragged.delete(card.entity);
            dirty = true;
        }
    };
}
