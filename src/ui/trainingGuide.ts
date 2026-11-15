import type { Entity } from 'esengine';
import { expeditionChecklist, expeditionOrder } from '../data/tharsisOrders';
import { doubleShift } from '../simulation/crewAbilities';
import { resourceOptions, type MissionAction } from '../simulation/missionStatus';
import { expeditionFor, fieldCrew, resourceForecast, type TharsisState } from '../simulation/tharsis';
import { captainCanPreview } from '../simulation/tharsisEvents';
import { upgradeProblem } from '../simulation/tharsisUpgrades';
import { orderBlock } from '../simulation/tharsisWork';
import type { FlightUi } from './flightUi';
import type { RunButton } from './tharsisFlight';
import type { MissionAssessment } from './tharsisObjectives';

export interface Hint {
    text: string;
    action?: MissionAction;
    /** What kind of step this is, for the first-time tutorial coach (src/ui/tutorialSteps.ts). */
    kind?: 'doubleShift' | 'travelers' | 'oxygen' | 'dispatch' | 'endSol';
    /** The work order this step is about, with the lead's first name. */
    work?: { orderId: string; lead: string; specialist: boolean };
}

export function trainingHint(state: TharsisState, status?: MissionAssessment): Hint {
    const run = state.tharsis;
    if (run.phase === 'briefing') return {
        text: captainCanPreview(state) && run.previewedChoice === null
            ? 'Preview the recommended response with the Captain. Commit after reviewing its effect.'
            : 'Commit the recommended response to open operations.',
    };
    if (run.phase === 'outcome') return { text: 'Read the effect of your choice, then open operations to plan this Sol.' };
    if (run.phase === 'report') return { text: 'Read the report to see completed checks, rover progress, and what each crew member did.' };
    if (run.phase === 'debrief') return { text: 'The debrief shows the result. Retry to practice a different approach.' };
    if (run.returnedWithData) return {
        text: 'The rover is home. Restore any missing station reserves before the deadline.',
        action: status?.notices.find(notice => notice.actions.length)?.actions[0],
    };
    if (run.rover) {
        if (status?.review) return { text: status.review, action: status.notices.find(notice => notice.actions.length)?.actions[0] };
        if (run.rover.phase === 'site') return { kind: 'endSol', text: 'End Sol to take a 24-hour sample. Check rover supply levels before advancing.' };
        if (run.rover.phase === 'returning') return { kind: 'endSol', text: 'End Sol to dock. The station must have enough Food, Water, and O₂ when the crew gets home.' };
        return { kind: 'endSol', text: 'The rover drives when you end the Sol. The station crew can work while the rover is away.' };
    }
    const scientist = state.crew.find(member => member.role === 'scientist')!;
    const flows = resourceForecast(state, 'station').tasks;
    const finishes = (id: string) => run.completed[id]
        || (run.work.some(job => job.orderId === id && Boolean(job.leadId)) && flows.some(flow => flow.orderId === id && flow.remaining === 1));
    const followWork = (id: string, name: string, lead: string, specialist = false): Hint => {
        const job = run.work.find(item => item.orderId === id);
        const hold = flows.find(flow => flow.orderId === id)?.hold;
        return {
            text: job ? hold ? `${name} · ${hold}. Choose ${lead} as lead where available.` : `Check the lead and pace for ${name.toLowerCase()}.`
                : `Open ${name}${specialist ? ', choose Specialist' : ''}, schedule the order, then assign ${lead}.`,
            action: { label: name, panel: 'work', orderId: id },
            work: { orderId: id, lead, specialist },
        };
    };
    if (!finishes('drive-check')) return followWork('drive-check', 'Check Rover Wheels', 'Eileen', true);
    if (!finishes('sampler')) return followWork('sampler', 'Attach Science Tool', 'Chiaki', true);
    if (!finishes('audit')) {
        if (state.sol === 1 && !doubleShift(state, scientist)) return {
            kind: 'doubleShift',
            text: 'Turn on Double Shift so Chiaki can also count supplies. Or let Neil count supplies if you want Chiaki to do one job.',
            action: { label: 'Open Double Shift', panel: 'abilities', memberId: scientist.id },
        };
        return followWork('audit', 'Count Trip Supplies', doubleShift(state, scientist)?.active ? 'Chiaki' : 'Neil');
    }
    if (run.completed['drive-check'] && run.completed.sampler) {
        if (!finishes('calibrate')) return followWork('calibrate', 'Test Tool on Rover', 'Chiaki', true);
        const pair = fieldCrew(state);
        if (pair.length !== 2 || !pair.some(member => member.role === 'pilot')) return {
            kind: 'travelers',
            text: 'Pick Eileen and Neil in the rover checklist. A Pilot makes this a 3-Sol round trip.',
            action: { label: 'Choose Travelers', panel: 'roverChecklist' },
        };
    }
    if (run.completed.calibrate && run.completed.audit) {
        if (!finishes('suits')) return followWork('suits', 'Check Space Suits', 'Neil');
        const oxygen = status?.dockReserves?.oxygen;
        if (oxygen !== undefined && oxygen < (state.goal.minimumReserves?.oxygen ?? 0)) return {
            kind: !upgradeProblem(state, { kind: 'electrolysis' }) ? 'oxygen' : undefined,
            text: `A clear trip projects ${oxygen}% station O₂ at docking. Raise it to 25% or more before launch.`,
            action: !upgradeProblem(state, { kind: 'electrolysis' }) ? { label: 'Open Electrolysis', panel: 'resources', area: 'station', resource: 'oxygen' } :
                resourceOptions(state, 'station', 'oxygen')[0],
        };
        if (run.completed.suits) return {
            kind: 'dispatch',
            text: 'Use the clean-trip load, then dispatch. The Wind Sampler travels with the rover.',
            action: { label: 'Open Rover Checklist', panel: 'roverChecklist' },
        };
    }
    return { kind: 'endSol', text: 'End Sol to perform the staffed orders. The next briefing follows the Sol report.' };
}

function generalHint(state: TharsisState, status?: MissionAssessment): Hint {
    const run = state.tharsis;
    if (run.phase === 'briefing') return { text: 'Read the news above and pick a choice to start today.' };
    if (run.phase === 'outcome') return { text: 'Read what happened, then continue to plan today.' };
    if (run.phase === 'report') return { text: 'See what your crew did today, then continue.' };
    if (run.phase === 'debrief') return { text: 'Mission finished! You can retry or go back to the menu.' };
    if (run.returnedWithData) {
        const fixAction = status?.notices.find(notice => notice.actions.length)?.actions[0];
        return fixAction
            ? { text: 'The rover is back! Raise low station supplies to green, then press End Sol to win.', action: fixAction }
            : { text: 'The rover is back with the data! Press End Sol to finish the mission.' };
    }
    if (run.rover) {
        if (status?.review) return { text: status.review, action: status.notices.find(notice => notice.actions.length)?.actions[0] };
        const { surveyHours } = expeditionFor(state);
        if (run.rover.phase === 'site') return { text: `Rover is at the site (${run.hours}/${surveyHours}h). Press End Sol to collect 24h of data!` };
        if (run.rover.phase === 'returning') return { text: 'Rover is driving home! Press End Sol to dock and win.' };
        return { text: 'Rover is on the way! Pick station tasks below or press End Sol.' };
    }
    const checklist = expeditionChecklist(run.expedition);
    const incompleteIds = checklist.flatMap(group => group.orders).filter(id => !run.completed[id]);
    if (!incompleteIds.length) {
        if (run.fieldPair.length < 2) return {
            text: 'All rover checks are done! Pick 2 crew members to drive the rover.',
            action: { label: 'Pick 2 Rover Crew', panel: 'roverChecklist' },
        };
        return {
            text: 'Everything is ready! Load the rover supplies and press Dispatch Rover.',
            action: { label: 'Launch Rover', panel: 'roverChecklist' },
        };
    }
    const readyOrder = incompleteIds
        .map(id => expeditionOrder(run.expedition, id)!)
        .find(order => !orderBlock(state, order));
    if (readyOrder) return {
        text: `Next step: Open "${readyOrder.title}" and press Schedule work order.`,
        action: { label: `Do: ${readyOrder.title}`, panel: 'work', orderId: readyOrder.id },
    };
    const activeChecklistJob = run.work.find(job => incompleteIds.includes(job.orderId));
    if (activeChecklistJob) {
        const order = expeditionOrder(run.expedition, activeChecklistJob.orderId)!;
        if (!activeChecklistJob.leadId) return {
            text: `"${order.title}" is scheduled! Lock a crew member or press End Sol to auto-pick.`,
            action: { label: `Assign: ${order.title}`, panel: 'work', orderId: order.id },
        };
        return {
            text: `"${order.title}" is ready to run! Press End Sol to work on it today.`,
            action: { label: 'See Planned Tasks', panel: 'work', orderId: order.id },
        };
    }
    return { text: 'Press End Sol to finish today\'s tasks.' };
}

export function showTrainingGuide(ui: FlightUi, root: Entity, button: RunButton, state: TharsisState, status: MissionAssessment | undefined,
    visible: boolean, board: boolean, toggle: () => void, open: (action: MissionAction) => void): void {
    const p = ui.palette;
    const isTraining = state.tharsis.expedition === 'training';
    if (!visible) {
        // On the board the Help button in the top bar brings it back.
        if (!board) button('show-guide', root, [1064, 682, 184, 30], toggle, { label: 'Show Help', labelSize: 14 });
        return;
    }
    const hint = isTraining ? trainingHint(state, status) : generalHint(state, status);
    if (!board) {
        const strip = ui.frame(root, [44, 676, 1192, 39], p.ink, p.teal);
        ui.label(strip, [12, 2, hint.action ? 865 : 990, 34], hint.text, { size: 13, fit: 12, wrap: true });
        if (hint.action) {
            const action = hint.action;
            button('guide-next-strip', strip, [888, 5, 130, 28], () => open(action), { label: 'Go there', labelSize: 13, tone: 'hero' });
        }
        button('hide-guide', strip, [1029, 5, 149, 28], toggle, { label: 'Hide Help', labelSize: 13 });
        return;
    }
    // Docked under the top bar, full width: what to do next and a button that goes there.
    const strip = ui.frame(root, [12, 160, 1256, 44], p.ink, p.teal);
    ui.label(strip, [12, 0, 130, 40], isTraining ? 'Training' : 'Next step', { size: 16, display: true, color: p.cyan });
    ui.label(strip, [142, 2, hint.action ? 742 : 950, 36], hint.text, { size: 14, fit: 11, wrap: true });
    if (hint.action) {
        const action = hint.action;
        button('guide-next', strip, [892, 5, 210, 30], () => open(action), { label: action.label, labelSize: 13, labelFit: 10, tone: 'hero' });
    }
    button('hide-guide', strip, [1110, 5, 134, 30], toggle, { label: 'Hide Help', labelSize: 13 });
}
