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

/** Which short explanations have been read, and which lessons are finished. */
export interface Lessons {
    /** After training: the "training is done" message on the main menu has been read. */
    intro: boolean;
    /** The crew on the Launch Summary has been explained. */
    teamSeen: boolean;
    upgradeTour: number;
    /** An upgrade was bought, or there were no points for one. */
    upgradeDone: boolean;
    cargoTour: number;
    /** Auto Fill was pressed (it is offered once, so a full bay cannot loop the lesson). */
    autoFilled: boolean;
}
export const newLessons = (): Lessons => ({ intro: false, teamSeen: false, upgradeTour: 0, upgradeDone: false, cargoTour: 0, autoFilled: false });

/** What the Cargo Preparation page reports about itself (src/ui/cargoPacker.ts). */
export interface CargoCoachView {
    /** The first item marked NEEDED that is not packed yet. */
    needed: { id: string; name: string; tab: string } | null;
    /** The inventory tab that is open. */
    tab: string;
    /** An item is in hand, waiting to be put down. */
    held: boolean;
    /** Food, water or air does not last the whole trip yet. */
    short: boolean;
    /** The Review & Launch button can be pressed. */
    ready: boolean;
}

/** What the pages before a launch report about themselves. */
export interface LaunchView {
    lessons: Lessons;
    /** The mission's NASA briefing popup is open. */
    missionPopup: boolean;
    /** The launch button was pressed and the rocket intro is playing. */
    launching: boolean;
    cargo: CargoCoachView | null;
}

const CARGO_GRID: Bounds = [272, 204, 528, 348];
const CARGO_TOUR: readonly CoachStep[] = [
    { id: 'cargo-tour-bay', area: CARGO_GRID, next: 'Next', text: 'This is the cargo bay. Your things go in these squares.' },
];
const UPGRADE_TOUR: readonly CoachStep[] = [
    { id: 'upgrade-tour-points', area: [264, 652, 300, 44], next: 'Next', text: 'These are your points. You win them in missions.' },
    { id: 'upgrade-tour-tree', area: [264, 180, 596, 464], next: 'Next', text: 'Points buy upgrades. Upgrades make your station better.' },
];
export const PREP_TOUR_LENGTHS = { upgrade: UPGRADE_TOUR.length, cargo: CARGO_TOUR.length };

/** Cargo Preparation: pick up the needed item, put it down, let Auto Fill pack the rest, go on. */
function cargoStep(cargo: CargoCoachView, lessons: Lessons): CoachStep {
    if (cargo.held) return { id: 'cargo-place', area: CARGO_GRID, text: 'Now click a square to put it down.' };
    if (lessons.cargoTour < CARGO_TOUR.length) return CARGO_TOUR[lessons.cargoTour]!;
    if (cargo.needed) {
        return cargo.tab === cargo.needed.tab
            ? { id: `cargo-pick-${cargo.needed.id}`, target: `cargo-item-${cargo.needed.id}`, text: `You must take the ${cargo.needed.name}. Click it.` }
            : { id: `cargo-tab-${cargo.needed.tab}`, target: `cargo-tab-${cargo.needed.tab}`, text: 'Click the glowing tab to find it.' };
    }
    if (cargo.short && !lessons.autoFilled) {
        return { id: 'cargo-autofill', target: 'cargo-autofill', text: 'Click AUTO FILL. It packs food, water and air for you.' };
    }
    return cargo.ready
        ? { id: 'cargo-review', target: 'cargo-launch', text: 'All packed! Click REVIEW & LAUNCH.' }
        : { id: 'cargo-read', text: 'Something is missing. Read the yellow words.' };
}

/** Launch Summary: meet the team once, then launch. */
function reviewStep(view: LaunchView): CoachStep | null {
    if (view.launching) return null;
    return view.lessons.teamSeen
        ? { id: 'review-launch', target: 'review-launch', text: 'All set! Click LAUNCH MISSION.' }
        : { id: 'review-team', area: [248, 108, 584, 596], next: 'Next', text: 'This is your team. 4 astronauts go on every trip.' };
}

/**
 * Chapter 1, before the training mission starts: Play, open the training, pack the cargo, meet
 * the team, launch. `null` when there is nothing to say.
 */
export function menuStep(page: Page, view: LaunchView & { welcomed: boolean }): CoachStep | null {
    switch (page) {
        case 'menu':
            return view.welcomed ? { id: 'menu-play', target: 'play', text: 'Click the big PLAY button.' }
                : { id: 'menu-welcome', next: 'Go!', text: 'Hi! I am ARIES. Let us go to Mars! I show you where to click.' };
        case 'mission':
            return { id: 'mission-training', target: 'open-training', text: 'Click OPEN TRAINING. It is a practice trip.' };
        case 'cargo':
            return view.cargo ? cargoStep(view.cargo, view.lessons) : null;
        case 'review':
            return reviewStep(view);
        case 'crew': case 'upgrade': case 'settings':
            return { id: 'shell-play', target: 'play', text: 'Click PLAY when you are ready.' };
        default:
            return null;
    }
}

// ---- Chapter 2: after the training is won (Upgrade, then a real mission) ----

export interface PrepView extends LaunchView {
    /** The astronauts picked on the Crew page, how many a mission takes, and the selected card. */
    crewIds: readonly string[];
    crewSize: number;
    selectedCrewId: string;
    /** The first astronaut who is not on the crew. */
    freeCrewId: string | null;
    /** Upgrade page: can the selected upgrade be bought, and which one on this tab can. */
    upgrade: { canBuySelected: boolean; buyableId: string | null };
}

/** The next place to visit after training: Upgrade, then Play. */
function nextStop(view: PrepView, id: string, praise = ''): CoachStep {
    if (!view.lessons.upgradeDone) return { id: `${id}-to-upgrade`, target: 'nav-upgrade', text: `${praise}Click UPGRADE.` };
    return { id: `${id}-to-play`, target: 'play', text: `${praise}Click PLAY to pick a real mission.` };
}

/** Steps of chapter 2, on the menu pages. `null` when there is nothing to say. */
export function prepStep(page: Page, view: PrepView): CoachStep | null {
    const { lessons } = view;
    switch (page) {
        case 'menu':
            return lessons.intro ? nextStop(view, 'prep-menu')
                : { id: 'prep-welcome', next: 'Okay!', text: 'Training is done! You won points. Let us spend them.' };
        case 'crew':
            if (view.crewIds.length >= view.crewSize) return nextStop(view, 'crew-done');
            if (!view.crewIds.includes(view.selectedCrewId)) return { id: `crew-add-${view.selectedCrewId}`, target: 'crew-add', text: 'You need 4. Click ADD TO CREW.' };
            return view.freeCrewId
                ? { id: `crew-pick-${view.freeCrewId}`, target: `crew-card-${view.freeCrewId}`, text: 'You need 4. Click this card.' }
                : null;
        case 'upgrade':
            if (lessons.upgradeTour < UPGRADE_TOUR.length) return UPGRADE_TOUR[lessons.upgradeTour]!;
            if (lessons.upgradeDone) return nextStop(view, 'upgrade-done', 'Nice! ');
            if (view.upgrade.canBuySelected) return { id: 'upgrade-buy', compact: true, target: 'upgrade-unlock', text: 'Click UNLOCK to buy it.' };
            return view.upgrade.buyableId
                ? { id: `upgrade-pick-${view.upgrade.buyableId}`, target: `upgrade-node-${view.upgrade.buyableId}`, text: 'You can buy this one. Click it.' }
                : { id: 'upgrade-none', next: 'Okay!', text: 'Not enough points yet. Win missions to get more.' };
        case 'mission':
            return view.missionPopup
                ? { id: 'prep-mission-brief', compact: true, target: 'prepare-cargo', text: 'Read the story. Then click PREPARE CARGO.' }
                : { id: 'prep-mission-pick', target: 'select-mission', text: 'Click SELECT MISSION.' };
        case 'cargo':
            return view.cargo ? cargoStep(view.cargo, lessons) : null;
        case 'review':
            return reviewStep(view);
        case 'settings':
            return nextStop(view, 'prep-settings');
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
    /** The astronaut whose card is selected for a planned job, before Lock lead is pressed. */
    pendingLead: (orderId: string) => string | undefined;
}

/** Explained once on the first planning screen, before any job is given out. */
const BOARD_TOUR: readonly CoachStep[] = [
    { id: 'tour-supplies', area: [12, 12, 868, 84], next: 'Next',
        text: 'This is your station. Here are Power, Food, Water and Air. Do not let them run out!' },
    { id: 'tour-crew', area: [16, 380, 1248, 160], next: 'Next',
        text: 'This is your team, each in their own room. Each one does one job a day.' },
    { id: 'tour-sol', area: [900, 638, 360, 60], next: 'Got it!',
        text: 'A day on Mars is a SOL. Give jobs first. Then click END SOL.' },
];
export const BOARD_TOUR_LENGTH = BOARD_TOUR.length;

const WORK_TABS = ['rover', 'instruments', 'life', 'stores', 'crew'];
const firstName = (member: CrewMember) => member.name.split(' ')[0]!;
const close = (id: string, text: string, view?: RunView): CoachStep =>
    view?.panel === 'solReview'
        ? { id: `${id}-close`, target: 'review-back', text: 'Click BACK TO PLANNING.' }
        : { id: `${id}-close`, target: 'close', text };

/** Steps during the training mission. */
export function runStep(state: TharsisState, status: MissionAssessment | undefined, view: RunView, tourStep: number): CoachStep {
    const run = state.tharsis;
    if (run.phase === 'briefing') {
        const open = run.briefing.choices.findIndex(choice => !choiceBlock(state, choice));
        return {
            id: `briefing-${state.sol}`, compact: true, target: `choice-${Math.max(0, open)}`,
            text: state.sol === 1 ? 'Here is the news. Read it. Then click the glowing button.'
                : 'Read the news. Then click the glowing button.',
        };
    }
    if (run.phase === 'outcome') return { id: `outcome-${state.sol}`, compact: true, target: 'planning', text: 'Good choice! Now click OPEN OPERATIONS.' };
    if (run.phase === 'report') return {
        id: `report-${state.sol}`, compact: true, target: 'nextBrief',
        text: state.result ? 'Mission over! Click VIEW DEBRIEF.'
            : 'The day is done! Click OPEN NEXT BRIEFING.',
    };
    if (state.result) {
        return state.result.outcome === 'victory'
            ? { id: 'debrief-win', done: true, target: 'menu', text: 'You did it! Great job, commander! Click MAIN MENU.' }
            : { id: 'debrief-retry', target: 'retry', text: 'Oh no! Let us try again. Click RETRY TRAINING.' };
    }
    if (!view.panel && tourStep < BOARD_TOUR.length) return BOARD_TOUR[tourStep]!;

    const hint = trainingHint(state, status);
    if (hint.work) return workStep(state, view, hint.work, hint);
    switch (hint.kind) {
        case 'doubleShift': return doubleShiftStep(state, view);
        case 'travelers': return travelersStep(state, view);
        case 'oxygen': return oxygenStep(view);
        case 'dispatch': return dispatchStep(state, status, view, hint);
        case 'endSol': return endSolStep(state, view, roverWords(state) ?? 'All jobs are set.');
        default: return guideStep(view, hint);
    }
}

/** Anything unusual (a supply ran low, the rover is late): the game's own guide has the exact fix. */
function guideStep(view: RunView, hint: Hint): CoachStep {
    if (view.panel) return { id: 'guide-panel', showGuide: true, compact: true, text: 'Something needs fixing. Read the blue strip below.' };
    return hint.action
        ? { id: 'guide-board', showGuide: true, target: 'guide-next', text: 'Something needs fixing. Click the glowing button.' }
        : { id: 'guide-read', showGuide: true, text: 'Read the help strip at the top.' };
}

function roverWords(state: TharsisState): string | null {
    const rover = state.tharsis.rover;
    if (!rover) return state.tharsis.returnedWithData ? 'The rover is home!' : null;
    if (rover.phase === 'site') return 'The rover is reading the weather.';
    if (rover.phase === 'returning') return 'The rover is driving home.';
    return 'The rover is driving.';
}

function endSolStep(state: TharsisState, view: RunView, words: string): CoachStep {
    const id = `end-sol-${state.sol}`;
    if (view.panel === 'solReview') return { id: `${id}-review`, target: 'review-advance', text: 'That is okay. Click END SOL ANYWAY.' };
    if (view.panel) return close(id, `${words} Click CLOSE.`);
    return { id, target: 'endSol', text: `${words} Click END SOL.` };
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
        return endSolStep(state, view, `${lead ? firstName(lead) : 'Your astronaut'} is working on it.`);
    }

    if (job) {
        // Scheduled, and it needs a leader. Anyone free will do if the best astronaut is busy.
        const free = (member: CrewMember | undefined) => member && !assignmentProblem(state, order.id, member.id) ? member : undefined;
        const lead = free(wanted) ?? stationCrew(state).find(member => free(member));
        if (!lead) return endSolStep(state, view, 'Everyone has a job.');
        if (!view.panel) return { id: `${id}-tasks`, target: 'tasks', text: 'This job needs a leader. Click TASKS.' };
        if (view.panel !== 'assignments') {
            return WORK_TABS.includes(view.panel)
                ? { id: `${id}-scheduled`, target: 'view-scheduled', text: 'Click PLANNED TASKS.' }
                : close(id, 'Click CLOSE.', view);
        }
        if (view.selected !== order.id) return { id: `${id}-row`, target: `order-${order.id}`, text: `Click "${order.title}" in the list.` };
        // Picking a leader takes two clicks: the card, then Lock lead. Whoever is picked can be locked in.
        const picked = state.crew.find(member => member.id === view.pendingLead(order.id));
        if (free(picked)) return { id: `${id}-lock`, target: 'lock-lead', text: 'Now click LOCK LEAD.' };
        return { id: `${id}-lead`, target: `lead-${lead.id}`, text: `Who does the job? Click ${firstName(lead)}.` };
    }

    // Not scheduled yet.
    if (orderBlock(state, order)) return guideStep(view, hint);
    if (!view.panel) {
        return { id: `${id}-room`, target: `check-${order.bay}`, text: `New job: "${order.title}". Click the glowing button.` };
    }
    if (view.panel !== order.bay) {
        return WORK_TABS.includes(view.panel)
            ? { id: `${id}-tab`, target: `tab-${order.bay}`, text: 'Click the glowing tab.' }
            : close(id, 'Good! Click CLOSE.', view);
    }
    if (view.selected !== order.id) return { id: `${id}-row`, target: `order-${order.id}`, text: `Click "${order.title}" in the list.` };
    const picked = view.technique(order.id);
    const fast = work.specialist && Boolean(order.methods?.includes('specialist'))
        && stationCrew(state).some(member => !workLeadProblem(state, order, ['specialist'], member));
    if (fast && picked !== 'specialist') {
        return { id: `${id}-method`, target: 'method-specialist', text: 'Click BEST MATCH. It is the fastest way.' };
    }
    if (workDraftBlock(state, order, picked === 'specialist' ? ['specialist'] : [])) return guideStep(view, hint);
    return { id: `${id}-schedule`, target: 'schedule', text: 'Now click SCHEDULE WORK ORDER.' };
}

function doubleShiftStep(state: TharsisState, view: RunView): CoachStep {
    const scientist = state.crew.find(member => member.role === 'scientist')!;
    const name = firstName(scientist);
    if (!view.panel) return { id: 'double-crew', target: `crew-${scientist.id}`, text: `${name} can work extra fast. Click ${name}.` };
    if (view.panel !== 'abilities') return close('double', 'Good! Click CLOSE.', view);
    if (view.selected !== scientist.id) return { id: 'double-pick', target: `specialty-${scientist.id}`, text: `Click ${name} at the top.` };
    return { id: 'double-go', target: 'activate-specialty', text: `Click WORK DOUBLE SPEED. Now ${name} does 2 jobs a day!` };
}

function travelersStep(state: TharsisState, view: RunView): CoachStep {
    if (!view.panel) return { id: 'travelers-open', target: 'roverChecklist', text: 'Two astronauts ride the rover. Click ROVER TRIP.' };
    if (view.panel !== 'roverChecklist') return close('travelers', 'Good! Click CLOSE.', view);
    const riders = state.crew.filter(member => member.role === 'pilot' || member.role === 'captain');
    const pair = state.tharsis.fieldPair;
    const extra = state.crew.find(member => pair.includes(member.id) && !riders.includes(member));
    if (extra) return { id: `travelers-remove-${extra.id}`, target: `traveler-${extra.id}`, text: `Click ${firstName(extra)} to take them out.` };
    const next = riders.find(member => !pair.includes(member.id));
    if (!next) return close('travelers', 'The rover team is ready! Click CLOSE.', view);
    return {
        id: `travelers-add-${next.id}`, target: `traveler-${next.id}`,
        text: next.role === 'pilot' ? `${firstName(next)} drives the rover. Click ${firstName(next)}.`
            : `Click ${firstName(next)} too.`,
    };
}

function oxygenStep(view: RunView): CoachStep {
    if (!view.panel) return { id: 'air-open', target: 'resource-oxygen', text: 'The station needs more air. Click O2 at the top.' };
    if (view.panel !== 'resources') return close('air', 'Good! Click CLOSE.', view);
    if (view.resource !== 'oxygen') return { id: 'air-pick', target: 'resource-detail-oxygen', text: 'Click the O2 box.' };
    return { id: 'air-go', target: 'resource-system', text: 'Click RUN ELECTROLYSIS. It makes air from water.' };
}

function dispatchStep(state: TharsisState, status: MissionAssessment | undefined, view: RunView, hint: Hint): CoachStep {
    if (!view.panel) return { id: 'dispatch-open', target: 'roverChecklist', text: 'Time to send the rover! Click ROVER TRIP.' };
    if (view.panel !== 'roverChecklist') return close('dispatch', 'Good! Click CLOSE.', view);
    if (!status?.dispatch.length) return { id: 'dispatch-go', target: 'dispatch', text: 'Click the yellow LAUNCH button. Off it goes!' };
    return dispatchIssues(state, defaultLoad(state)).length ? guideStep(view, hint)
        : { id: 'dispatch-pack', target: 'reset-load', text: 'Click AUTO-PACK SUPPLIES.' };
}
