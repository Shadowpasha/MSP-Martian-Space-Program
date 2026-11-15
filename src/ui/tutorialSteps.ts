// What the first-time tutorial says and points at, for every moment of the first game.
//
// The tutorial is not a fixed script. Each time the screen is drawn, these functions look at where
// the player is (which page, which mission phase, which panel is open) and answer one thing: the
// next button to click and one short sentence about why. A child who clicks something else is never
// stuck: the next step is worked out again from wherever they ended up.
//
// The words are written for a seven-year-old: short sentences, one idea at a time, and the name of
// the button in CAPITALS exactly as it is written on the screen.
//
// This file has no engine code, so the whole walkthrough is tested in tests/tutorial.test.ts.
import type { CrewMember } from '../contracts/gameContract';
import { defaultLoad, dispatchIssues, resourceForecast, type TharsisState } from '../simulation/tharsis';
import { choiceBlock } from '../simulation/tharsisEvents';
import { assignmentProblem, findOrder, orderBlock, stationCrew, workDraftBlock, workLeadProblem } from '../simulation/tharsisWork';
import type { Page } from './flightScreens';
import type { Bounds } from './flightUi';
import type { MissionAssessment } from './tharsisObjectives';
import { trainingHint, type Hint } from './trainingGuide';

export interface CoachStep {
    /** Changes when the step changes (the coach plays its sound once per id). */
    id: string;
    text: string;
    /** Key of the button to click. The spotlight and the arrow follow it. */
    target?: string;
    /** A part of the screen to show, for steps that explain something instead of asking for a click. */
    area?: Bounds;
    /** Label of the bubble's own button, for steps the player reads and then continues. */
    next?: string;
    /** A thin strip along the bottom instead of the big bubble, for screens full of text to read. */
    compact?: boolean;
    /** The coach has no simple answer here: show the game's own training guide and point at it. */
    showGuide?: boolean;
    /** The player finished the tutorial. */
    done?: boolean;
}

/** Steps on the menu pages, before the mission starts. `null` when there is nothing to say. */
export function menuStep(page: Page, view: { welcomed: boolean; trainingReady: boolean }): CoachStep | null {
    switch (page) {
        case 'menu':
            return view.welcomed
                ? { id: 'menu-play', target: 'play', text: 'First, click the big PLAY button.' }
                : { id: 'menu-welcome', next: 'Show me!', text: 'Hi! I am ARIES, your robot helper. Let us fly to Mars together! I will show you what to click.' };
        case 'mission':
            return { id: 'mission-training', target: 'open-training', text: 'This is your first mission. It is a practice trip. Click OPEN TRAINING.' };
        case 'cargo':
            return view.trainingReady
                ? { id: 'cargo-launch', target: 'launch', text: 'Your 4 astronauts and their things are ready. Click LAUNCH MISSION to blast off!' }
                : null;
        case 'crew': case 'upgrade': case 'settings':
            return { id: 'shell-play', target: 'play', text: 'You can look around here. When you are ready, click PLAY.' };
        default:
            return null;
    }
}

/** What the mission screen is showing right now. */
export interface RunView {
    panel: string | null;
    /** The work order or crew member picked inside the open panel. */
    selected: string | null;
    /** The method picked for a work order that is not scheduled yet. */
    technique: (orderId: string) => string | undefined;
    /** The supply shown in the Resource panel. */
    resource: string;
}

/** Explained once on the first planning screen, before any job is given out. */
const BOARD_TOUR: readonly CoachStep[] = [
    { id: 'tour-supplies', area: [400, 12, 868, 84], next: 'Next',
        text: 'This is your Mars station! Up here are your supplies: Power, Food, Water and Air. Never let them run out.' },
    { id: 'tour-crew', area: [348, 572, 532, 136], next: 'Next',
        text: 'Here are your 4 astronauts. Each one can do one job every day.' },
    { id: 'tour-sol', area: [1036, 636, 224, 60], next: 'Got it!',
        text: 'A day on Mars is called a SOL. First you give out jobs. Then END SOL finishes the day. Let us give out the first job!' },
];
export const BOARD_TOUR_LENGTH = BOARD_TOUR.length;

const WORK_TABS = ['rover', 'instruments', 'life', 'stores', 'crew'];
const firstName = (member: CrewMember) => member.name.split(' ')[0]!;
const close = (id: string, text: string, view?: RunView): CoachStep =>
    view?.panel === 'solReview'
        ? { id: `${id}-close`, target: 'review-back', text: 'Click BACK TO PLANNING to go back to the station.' }
        : { id: `${id}-close`, target: 'close', text };

/** Steps during the training mission. */
export function runStep(state: TharsisState, status: MissionAssessment | undefined, view: RunView, tourStep: number): CoachStep {
    const run = state.tharsis;
    if (run.phase === 'briefing') {
        const open = run.briefing.choices.findIndex(choice => !choiceBlock(state, choice));
        return {
            id: `briefing-${state.sol}`, compact: true, target: `choice-${Math.max(0, open)}`,
            text: state.sol === 1 ? 'Every morning there is news from Mars. Read it, then click the glowing button to choose what to do.'
                : 'Good morning! Read the news, then click the glowing button.',
        };
    }
    if (run.phase === 'outcome') return { id: `outcome-${state.sol}`, compact: true, target: 'planning', text: 'Good choice! This is what happened. Now click OPEN OPERATIONS.' };
    if (run.phase === 'report') return {
        id: `report-${state.sol}`, compact: true, target: 'nextBrief',
        text: state.result ? 'The mission is over! Click VIEW DEBRIEF to see how you did.'
            : 'The day is done! This list shows what your crew did. Click OPEN NEXT BRIEFING.',
    };
    if (state.result) {
        return state.result.outcome === 'victory'
            ? { id: 'debrief-win', done: true, target: 'menu', text: 'You did it! You are a real Mars commander now. Click MAIN MENU and pick your next mission!' }
            : { id: 'debrief-retry', target: 'retry', text: 'Oh no! That is okay. Real astronauts practice many times. Click RETRY TRAINING.' };
    }
    if (!view.panel && tourStep < BOARD_TOUR.length) return BOARD_TOUR[tourStep]!;

    const hint = trainingHint(state, status);
    if (hint.work) return workStep(state, view, hint.work, hint);
    switch (hint.kind) {
        case 'doubleShift': return doubleShiftStep(state, view);
        case 'travelers': return travelersStep(state, view);
        case 'oxygen': return oxygenStep(view);
        case 'dispatch': return dispatchStep(state, status, view, hint);
        case 'endSol': return endSolStep(state, view, roverWords(state) ?? 'All the jobs are set for today.');
        default: return guideStep(view, hint);
    }
}

/** Anything unusual (a supply ran low, the rover is late): the game's own guide has the exact fix. */
function guideStep(view: RunView, hint: Hint): CoachStep {
    if (view.panel) return { id: 'guide-panel', showGuide: true, compact: true, text: 'Something needs fixing. Read the blue strip at the bottom. It tells you what to do.' };
    return hint.action
        ? { id: 'guide-board', showGuide: true, target: 'guide-next', text: 'Something needs fixing. Click the glowing button in the guide box and read what it says.' }
        : { id: 'guide-read', showGuide: true, text: 'Read the guide box. It tells you what to do next.' };
}

function roverWords(state: TharsisState): string | null {
    const rover = state.tharsis.rover;
    if (!rover) return state.tharsis.returnedWithData ? 'The rover is home with the weather data!' : null;
    if (rover.phase === 'site') return 'The rover is at the weather spot. It records the weather for a whole day.';
    if (rover.phase === 'returning') return 'The rover is driving home with the data.';
    return 'The rover is driving across Mars.';
}

function endSolStep(state: TharsisState, view: RunView, words: string): CoachStep {
    const id = `end-sol-${state.sol}`;
    if (view.panel === 'solReview') return { id: `${id}-review`, target: 'review-advance', text: 'It is okay to keep going. Click END SOL ANYWAY.' };
    if (view.panel) return close(id, `${words} Click CLOSE to go back to the station.`);
    return { id, target: 'endSol', text: `${words} Click the yellow END SOL button to go to the next day.` };
}

function workStep(state: TharsisState, view: RunView, work: NonNullable<Hint['work']>, hint: Hint): CoachStep {
    const run = state.tharsis;
    const order = findOrder(state, work.orderId);
    if (!order) return guideStep(view, hint);
    const id = `job-${order.id}`;
    const job = run.work.find(item => item.orderId === order.id);
    const wanted = state.crew.find(member => firstName(member) === work.lead);

    if (job?.leadId) {
        // Staffed already. If something holds it up, the guide explains; otherwise the day can end.
        if (resourceForecast(state, 'station').tasks.some(flow => flow.orderId === order.id && flow.hold)) return guideStep(view, hint);
        const lead = state.crew.find(member => member.id === job.leadId);
        return endSolStep(state, view, `${lead ? firstName(lead) : 'Your astronaut'} is on the job. It takes more than one day.`);
    }

    if (job) {
        // Scheduled, and it needs a leader. Anyone free will do if the best astronaut is busy.
        const free = (member: CrewMember | undefined) => member && !assignmentProblem(state, order.id, member.id) ? member : undefined;
        const lead = free(wanted) ?? stationCrew(state).find(member => free(member));
        if (!lead) return endSolStep(state, view, 'Everyone already has a job today.');
        if (!view.panel) return { id: `${id}-tasks`, target: 'tasks', text: `The job "${order.title}" needs a leader. Click TASKS.` };
        if (view.panel !== 'assignments') {
            return WORK_TABS.includes(view.panel)
                ? { id: `${id}-scheduled`, target: 'view-scheduled', text: 'Click SCHEDULED TASKS to pick a leader for the job.' }
                : close(id, 'Click CLOSE to go back to the station.', view);
        }
        if (view.selected !== order.id) return { id: `${id}-row`, target: `order-${order.id}`, text: `Click the job "${order.title}" in the list.` };
        return { id: `${id}-lead`, target: `lead-${lead.id}`, text: `Who does this job? ${firstName(lead)} is great at it! Click the card with ${firstName(lead)}.` };
    }

    // Not scheduled yet.
    if (orderBlock(state, order)) return guideStep(view, hint);
    if (!view.panel) {
        return { id: `${id}-room`, target: `check-${order.bay}`, text: `Time for a job: "${order.title}". Click the glowing button to find it.` };
    }
    if (view.panel !== order.bay) {
        return WORK_TABS.includes(view.panel)
            ? { id: `${id}-tab`, target: `tab-${order.bay}`, text: 'The next job is in another room. Click the glowing tab.' }
            : close(id, 'Nice! Click CLOSE to go back to the station.', view);
    }
    if (view.selected !== order.id) return { id: `${id}-row`, target: `order-${order.id}`, text: `Click the job "${order.title}" in the list.` };
    const picked = view.technique(order.id);
    const fast = work.specialist && Boolean(order.methods?.includes('specialist'))
        && stationCrew(state).some(member => !workLeadProblem(state, order, ['specialist'], member));
    if (fast && picked !== 'specialist') {
        return { id: `${id}-method`, target: 'method-specialist', text: 'Click SPECIALIST. An expert finishes the job in one day!' };
    }
    if (workDraftBlock(state, order, picked === 'specialist' ? ['specialist'] : [])) return guideStep(view, hint);
    return { id: `${id}-schedule`, target: 'schedule', text: 'Now click SCHEDULE WORK ORDER to put the job on the list.' };
}

function doubleShiftStep(state: TharsisState, view: RunView): CoachStep {
    const scientist = state.crew.find(member => member.role === 'scientist')!;
    const name = firstName(scientist);
    if (!view.panel) return { id: 'double-crew', target: `crew-${scientist.id}`, text: `${name} has a special power that helps today. Click on ${name}.` };
    if (view.panel !== 'abilities') return close('double', 'Nice work! Click CLOSE to go back to the station.', view);
    if (view.selected !== scientist.id) return { id: 'double-pick', target: `specialty-${scientist.id}`, text: `Click the name ${name} at the top.` };
    return { id: 'double-go', target: 'activate-specialty', text: `Click ACTIVATE DOUBLE SHIFT. Now ${name} can do 2 jobs every day!` };
}

function travelersStep(state: TharsisState, view: RunView): CoachStep {
    if (!view.panel) return { id: 'travelers-open', target: 'roverChecklist', text: 'Two astronauts will ride the rover. Let us pick them. Click ROVER CHECKLIST.' };
    if (view.panel !== 'roverChecklist') return close('travelers', 'Well done! Click CLOSE to go back to the station.', view);
    const riders = state.crew.filter(member => member.role === 'pilot' || member.role === 'captain');
    const pair = state.tharsis.fieldPair;
    const extra = state.crew.find(member => pair.includes(member.id) && !riders.includes(member));
    if (extra) return { id: `travelers-remove-${extra.id}`, target: `traveler-${extra.id}`, text: `${firstName(extra)} should stay at the station. Click ${firstName(extra)} to take them out of the rover.` };
    const next = riders.find(member => !pair.includes(member.id));
    if (!next) return close('travelers', 'The rover team is ready! Click CLOSE.', view);
    return {
        id: `travelers-add-${next.id}`, target: `traveler-${next.id}`,
        text: next.role === 'pilot' ? `${firstName(next)} is the pilot. Pilots drive fast! Click ${firstName(next)}.`
            : `${firstName(next)} is the captain. Click ${firstName(next)} too.`,
    };
}

function oxygenStep(view: RunView): CoachStep {
    if (!view.panel) return { id: 'air-open', target: 'resource-oxygen', text: 'The station needs more air for when the rover comes home. Click O2 at the top.' };
    if (view.panel !== 'resources') return close('air', 'Good! Click CLOSE to go back to the station.', view);
    if (view.resource !== 'oxygen') return { id: 'air-pick', target: 'resource-detail-oxygen', text: 'Click the O2 box. O2 is the air we breathe.' };
    return { id: 'air-go', target: 'resource-system', text: 'Click RUN ELECTROLYSIS. This machine turns water into air!' };
}

function dispatchStep(state: TharsisState, status: MissionAssessment | undefined, view: RunView, hint: Hint): CoachStep {
    if (!view.panel) return { id: 'dispatch-open', target: 'roverChecklist', text: 'Everything is ready. Time to send the rover! Click ROVER CHECKLIST.' };
    if (view.panel !== 'roverChecklist') return close('dispatch', 'Great! Click CLOSE to go back to the station.', view);
    if (!status?.dispatch.length) return { id: 'dispatch-go', target: 'dispatch', text: 'The rover is packed. Click the yellow DISPATCH button. Off it goes!' };
    return dispatchIssues(state, defaultLoad(state)).length ? guideStep(view, hint)
        : { id: 'dispatch-pack', target: 'reset-load', text: 'Click CLEAN-TRIP LOAD. It packs just the right food, water and air.' };
}
