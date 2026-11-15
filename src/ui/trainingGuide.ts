import type { Entity } from 'esengine';
import { doubleShift } from '../simulation/crewAbilities';
import { resourceOptions, type MissionAction } from '../simulation/missionStatus';
import { fieldCrew, resourceForecast, type TharsisState } from '../simulation/tharsis';
import { captainCanPreview } from '../simulation/tharsisEvents';
import { upgradeProblem } from '../simulation/tharsisUpgrades';
import type { FlightUi } from './flightUi';
import type { RunButton } from './tharsisFlight';
import type { MissionAssessment } from './tharsisObjectives';

interface Hint {
    text: string;
    action?: MissionAction;
}

function trainingHint(state: TharsisState, status?: MissionAssessment): Hint {
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
        if (run.rover.phase === 'site') return { text: 'End Sol to take a 24-hour sample. Check rover supply levels before advancing.' };
        if (run.rover.phase === 'returning') return { text: 'End Sol to dock. The station must have enough Food, Water, and O₂ when the crew gets home.' };
        return { text: 'The rover drives when you end the Sol. The station crew can work while the rover is away.' };
    }
    const scientist = state.crew.find(member => member.role === 'scientist')!;
    const flows = resourceForecast(state, 'station').tasks;
    const finishes = (id: string) => run.completed[id] || flows.some(flow => flow.orderId === id && flow.remaining === 1);
    const followWork = (id: string, name: string, lead: string, specialist = false): Hint => {
        const job = run.work.find(item => item.orderId === id);
        const hold = flows.find(flow => flow.orderId === id)?.hold;
        return {
            text: job ? hold ? `${name} · ${hold}. Choose ${lead} as lead where available.` : `Check the lead and pace for ${name.toLowerCase()}.`
                : `Open ${name}${specialist ? ', choose Specialist' : ''}, schedule the order, then assign ${lead}.`,
            action: { label: name, panel: 'work', orderId: id },
        };
    };
    if (!finishes('drive-check')) return followWork('drive-check', 'Inspect Drivetrain', 'Eileen', true);
    if (!finishes('sampler')) return followWork('sampler', 'Assemble the Instrument', 'Chiaki', true);
    if (!finishes('audit')) {
        if (state.sol === 1 && !doubleShift(state, scientist)) return {
            text: 'Activate Double Shift so Chiaki can also audit supplies. Neil can do the audit if you want Chiaki to work one shift.',
            action: { label: 'Open Double Shift', panel: 'abilities', memberId: scientist.id },
        };
        return followWork('audit', 'Audit Field Inventory', doubleShift(state, scientist)?.active ? 'Chiaki' : 'Neil');
    }
    if (run.completed['drive-check'] && run.completed.sampler) {
        if (!finishes('calibrate')) return followWork('calibrate', 'Calibrate on Rover Power', 'Chiaki', true);
        const pair = fieldCrew(state);
        if (pair.length !== 2 || !pair.some(member => member.role === 'pilot')) return {
            text: 'Choose Eileen and Neil in the rover checklist. A Pilot makes this a three-Sol round trip.',
            action: { label: 'Choose Travelers', panel: 'roverChecklist' },
        };
    }
    if (run.completed.calibrate && run.completed.audit) {
        if (!finishes('suits')) return followWork('suits', 'Certify Field Suits', 'Neil');
        const oxygen = status?.dockReserves?.oxygen;
        if (oxygen !== undefined && oxygen < (state.goal.minimumReserves?.oxygen ?? 0)) return {
            text: `A clear trip projects ${oxygen}% station O₂ at docking. Raise it to 25% or more before launch.`,
            action: !upgradeProblem(state, { kind: 'electrolysis' }) ? { label: 'Open Electrolysis', panel: 'resources', area: 'station', resource: 'oxygen' } :
                resourceOptions(state, 'station', 'oxygen')[0],
        };
        if (run.completed.suits) return {
            text: 'Use the clean-trip load, then dispatch. The Wind Sampler travels with the rover.',
            action: { label: 'Open Rover Checklist', panel: 'roverChecklist' },
        };
    }
    return { text: 'End Sol to perform the staffed orders. The next briefing follows the Sol report.' };
}

export function showTrainingGuide(ui: FlightUi, root: Entity, button: RunButton, state: TharsisState, status: MissionAssessment | undefined,
    visible: boolean, board: boolean, toggle: () => void, open: (action: MissionAction) => void): void {
    const p = ui.palette;
    if (!visible) {
        button('show-guide', root, board ? [1064, 169, 188, 36] : [1064, 682, 184, 30], toggle, { label: 'Show Guide', labelSize: 14 });
        return;
    }
    const hint = trainingHint(state, status);
    if (!board) {
        const strip = ui.frame(root, [44, 676, 1192, 39], p.ink, p.teal);
        ui.label(strip, [12, 2, 920, 34], hint.text, { size: 13, fit: 12, wrap: true });
        button('hide-guide', strip, [1029, 5, 149, 28], toggle, { label: 'Hide Guide', labelSize: 13 });
        return;
    }
    const box = ui.frame(root, [536, 194, 716, 138], p.ink, p.teal);
    ui.label(box, [16, 4, 480, 28], `Training guide · Sol ${state.sol}/6`, { size: 20, display: true, color: p.cyan });
    button('hide-guide', box, [559, 9, 140, 29], toggle, { label: 'Hide Guide', labelSize: 13 });
    ui.label(box, [16, 40, 684, 47], hint.text, { size: 15, wrap: true, top: true });
    if (hint.action) {
        const action = hint.action;
        button('guide-next', box, [16, 90, 360, 36], () => open(action), { label: action.label, labelSize: 15, tone: 'hero' });
    }
}
