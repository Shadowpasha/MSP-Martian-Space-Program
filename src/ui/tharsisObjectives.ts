import type { Entity } from 'esengine';
import { CARGO_BY_ID } from '../data/cargo';
import { formatResource, RESOURCE_LABELS, resourceEntries } from '../data/missions';
import { expeditionChecklist } from '../data/tharsisOrders';
import type { assessMission, MissionAction } from '../simulation/missionStatus';
import { previewEndSol } from '../simulation/solEngine';
import { expeditionFor, travelerReadiness, type RoverLoad, type TharsisState } from '../simulation/tharsis';
import { hasUpgrade } from '../simulation/tharsisUpgrades';
import type { FlightUi } from './flightUi';
import type { RunButton } from './tharsisFlight';

export type MissionAssessment = ReturnType<typeof assessMission>;
type OpenAction = (action: MissionAction) => void;

export function showMissionObjectives(ui: FlightUi, content: Entity, button: RunButton, state: TharsisState, draft: RoverLoad,
    status: MissionAssessment, page: number, setPage: (page: number) => void, openAction: OpenAction): void {
    const p = ui.palette;
    const run = state.tharsis;
    const { instrument, surveyHours, site } = expeditionFor(state);
    ui.label(content, [22, 59, 1132, 29], `Dock both travelers and ${surveyHours}h of data from ${site} by Sol ${status.deadline}.`,
        { size: 17, color: p.cyan });
    const prep = ui.frame(content, [20, 104, 478, 495], p.ink, p.teal);
    ui.label(prep, [16, 8, 442, 34], 'Success criteria', { display: true, size: 24 });
    expeditionChecklist(run.expedition).forEach((group, index) => {
        const count = group.orders.filter(id => run.completed[id]).length;
        const done = count === group.orders.length;
        const label = `${group.label}  ${count}/${group.orders.length}${done ? ' · Complete' : ' · Pending'}`;
        const missing = group.orders.find(id => !run.completed[id]);
        if (missing && !run.rover && !run.returnedWithData) {
            button(`objective-${group.bay}`, prep, [16, 49 + index * 32, 444, 29],
                () => openAction({ panel: 'work', orderId: missing, label }), { label, labelSize: 14 });
        } else ui.label(prep, [20, 49 + index * 32, 442, 29], label, { size: 14, color: done ? p.good : p.secondary });
    });
    const installed = run.rover ? run.rover.cargo[instrument] > 0 : run.returnedWithData || (draft.cargo[instrument] === 1 && state.cargo[instrument] > 0);
    ui.label(prep, [16, 181, 440, 28], `${CARGO_BY_ID[instrument].name} · ${installed ? run.rover ? 'On rover' : run.returnedWithData ? 'Returned' : 'Loaded in draft' : 'Required'}`,
        { size: 15, color: installed ? p.good : p.amber });
    const readiness = status.pair.filter(member => !travelerReadiness(state, member)).length;
    const crew = run.returnedWithData ? 'Travelers · both docked' : `Travelers · ${readiness}/2 ready${status.pair.length ? ` · ${status.pair.map(member => member.name.split(' ')[0]).join(' + ')}` : ''}`;
    ui.label(prep, [16, 211, 442, 27], crew, { size: 14, color: readiness === 2 || run.returnedWithData ? p.good : p.amber });
    const position = run.returnedWithData ? 'Docked · data recovered' : run.rover?.phase === 'site' ? `Sampling at ${site}` :
        run.rover?.phase === 'returning' ? 'Returning to station' : run.rover ? `Driving to ${site}` : 'Docked · preparing for launch';
    ui.label(prep, [16, 245, 444, 26], `Rover · ${position}`, { size: 15, color: p.cyan });
    ui.label(prep, [16, 274, 442, 27], `Data  ${run.hours}/${surveyHours}h${hasUpgrade(state, 'recorder') ? ` · Recorder ${run.upgrades.recorderUsed ? 'used' : 'ready'}` : ''}`,
        { size: 15, color: run.hours >= surveyHours ? p.good : p.text });
    const dock = run.returnedWithData ? 'Docked with data' : status.dockSol === null ? 'Docking at risk' :
        `${run.rover || status.launchReady ? 'Projected docking' : 'Earliest clear-route docking'} · Sol ${status.dockSol}`;
    ui.label(prep, [16, 302, 446, 28], `${dock} / Sol ${status.deadline}`, { size: 14, color: status.dockSol === null && !run.returnedWithData ||
        (status.dockSol ?? 0) > status.deadline ? p.amber : p.cyan });
    const reserves = resourceEntries(state.goal.minimumReserves);
    const reserveTop = reserves.length > 3 ? 345 : 350;
    ui.label(prep, [16, 334, 442, 26], status.dockReserves ? 'Station now / at dock estimate / target' : 'Station now / target',
        { size: 14, color: p.secondary });
    reserves.forEach(([key, target], index) => {
        const current = state.resources[key];
        const projected = status.dockReserves?.[key];
        const label = `${formatResource(key, current)}${projected === undefined ? '' : `  /  ${projected}`}  /  ${target}`;
        ui.label(prep, [16, reserveTop + 14 + index * 24, 444, 22], label, { size: 14, color: (projected ?? current) >= target ? p.good : p.amber });
    });

    const blockers = ui.frame(content, [516, 104, 640, 495], p.ink, p.teal);
    ui.label(blockers, [14, 8, 604, 34], status.notices.length ? 'Blockers and next steps' : 'Ready for the next Sol', { display: true, size: 24 });
    const perPage = 3;
    const lastPage = Math.max(0, Math.ceil(status.notices.length / perPage) - 1);
    const currentPage = Math.min(page, lastPage);
    status.notices.slice(currentPage * perPage, currentPage * perPage + perPage).forEach((notice, index) => {
        const y = 49 + index * 132;
        ui.label(blockers, [14, y, 610, 45], notice.message, { size: 15, wrap: true, top: true, color: p.amber });
        notice.actions.slice(0, 6).forEach((action, i) => {
            button(`objective-action-${index}-${i}`, blockers, [14 + i % 3 * 205, y + 46 + Math.floor(i / 3) * 35, 196, 31], () => openAction(action),
                { label: action.label, labelSize: 13, labelFit: 10 });
        });
        ui.box(blockers, [14, y + 123, 609, 1], p.edge);
    });
    if (lastPage) {
        button('objectives-prev', blockers, [14, 446, 132, 34], () => setPage(currentPage - 1), { label: 'Previous', disabled: !currentPage });
        ui.label(blockers, [160, 446, 220, 34], `${currentPage + 1} / ${lastPage + 1}`, { size: 14, color: p.secondary });
        button('objectives-next', blockers, [484, 446, 140, 34], () => setPage(currentPage + 1), { label: 'More', disabled: currentPage === lastPage });
    }
}

export function solSafetyWarning(state: TharsisState, status: MissionAssessment): string | null {
    if (status.review) return status.review;
    const run = state.tharsis;
    if (!run.rover && !run.returnedWithData) {
        if (status.launchReady) return 'Your rover is ready to launch! Want to launch it before ending the day?';
        if (!run.work.length && state.crew.some(member => member.health > 0)) {
            return 'No station tasks are planned for today. Want to pick a task first?';
        }
    }
    const next = previewEndSol(state);
    const lowKeys = (['food', 'water', 'oxygen', 'energy'] as const).filter(key => next.resources[key] <= 2 && next.resources[key] < state.resources[key]);
    if (lowKeys.length) {
        return `Station ${lowKeys.map(key => RESOURCE_LABELS[key]).join(' and ')} will be very low after tonight! Check supplies or end Sol anyway.`;
    }
    if (next.tharsis.rover) {
        const roverLow = (['food', 'water', 'oxygen', 'energy'] as const).filter(key => next.tharsis.rover!.resources[key] <= 1);
        if (roverLow.length) {
            return `Rover ${roverLow.map(key => RESOURCE_LABELS[key]).join(' and ')} will be very low after tonight!`;
        }
    }
    return null;
}

export function showSolReview(ui: FlightUi, content: Entity, button: RunButton, state: TharsisState, status: MissionAssessment, openAction: OpenAction,
    back: () => void, advance: () => void): void {
    const p = ui.palette;
    const warning = solSafetyWarning(state, status) ?? '';
    ui.label(content, [22, 68, 865, 78], warning, { size: 19, color: p.amber, wrap: true, top: true });
    const choices = new Map<string, MissionAction>();
    if (status.launchReady) choices.set('Launch Rover', { label: 'Open Rover Checklist', panel: 'roverChecklist' });
    if (!state.tharsis.rover && !state.tharsis.returnedWithData && !state.tharsis.work.length) {
        choices.set('Pick a Task', { label: 'Pick a Mission Task', panel: 'workOrders' });
    }
    for (const notice of status.notices) for (const action of notice.actions) choices.set(action.label, action);
    const actions = [...choices.values()].slice(0, 6);
    actions.forEach((action, index) => button(`review-action-${index}`, content, [22 + index % 3 * 288, 151 + Math.floor(index / 3) * 51, 270, 42],
        () => openAction(action), { label: action.label, labelSize: 14 }));
    button('review-back', content, [22, 286, 261, 50], back, { label: 'Back to Planning', tone: 'hero' });
    button('review-advance', content, [602, 286, 267, 50], advance, { label: 'End Sol Anyway', tone: 'primary' });
}
