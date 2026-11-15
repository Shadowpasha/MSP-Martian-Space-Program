// Whether the tutorial is running, and where it is up to.
//
// It has two chapters:
//   1. The first game: pack the cargo, meet the team, then the whole (short) training mission.
//   2. After the training is won: the Upgrade page, then on to a real mission.
//      It ends when the first real mission lifts off.
//
// The tutorial starts when a new player presses Play. Skipping or finishing it stops it from
// starting automatically. "How to Play" in Settings can start it again at any time.
//
// What it says at each moment is in tutorialSteps.ts; how it is drawn is in coach.ts.
import { Storage, type Entity } from 'esengine';
import { newLessons, type CargoCoachView } from './tutorialSteps';

const SAVED = 'mars-outpost:tutorial-v1';

type SavedProgress = { done?: boolean; chapter?: number };
let saved: SavedProgress | null | undefined;
let active = false;
let chapter: 1 | 2 = 1;

function load(): void {
    if (saved !== undefined) return;
    saved = Storage.getJSON<SavedProgress>(SAVED) ?? null;
    chapter = saved?.chapter === 2 ? 2 : 1;
    active = chapter === 2 && saved?.done !== true;
}

function save(next: SavedProgress): void {
    saved = next;
    Storage.setJSON(SAVED, next);
}

export const tutorial = {
    /** The welcome on the mission selection screen has been read. */
    welcomed: false,
    /** How many steps of the station tour (the first planning screen) have been read. */
    tourStep: 0,
    /** Chapter 2: which short tours have been read and which lessons are finished. */
    lessons: newLessons(),
    /** Buttons on the menu pages that a step can point at, by key. Cleared for every page. */
    targets: new Map<string, Entity>(),
    /** What the page that is showing reports about itself. Cleared for every page. */
    view: { missionPopup: false, launching: false, cargo: null as CargoCoachView | null },

    get active(): boolean {
        load();
        return active;
    },

    get chapter(): 1 | 2 {
        load();
        return chapter;
    },

    /** The bubble's own button was pressed on the step with this id: that part has been read. */
    read(id: string): void {
        const lessons = this.lessons;
        if (id === 'mission-welcome') this.welcomed = true;
        else if (id === 'prep-welcome') lessons.intro = true;
        else if (id === 'review-team') lessons.teamSeen = true;
        else if (id.startsWith('upgrade-tour')) lessons.upgradeTour++;
        else if (id === 'upgrade-none') lessons.upgradeDone = true;
        else if (id.startsWith('cargo-tour')) lessons.cargoTour++;
    },

    /** A new page is being drawn. */
    resetPage(): void {
        this.targets.clear();
        this.view = { missionPopup: false, launching: false, cargo: null };
    },

    /** Someone who finished a mission before the tutorial existed is not a new player. */
    skipForReturningPlayer(): void {
        load();
        if (saved === null) this.finish();
    },

    /** Entering Mission Selection through Play starts the tutorial once for new players. */
    startOnPlay(): void {
        load();
        if (!active && saved?.done !== true) this.begin();
    },

    /** "How to Play": start again from the welcome. */
    begin(): void {
        load();
        active = true;
        chapter = 1;
        this.welcomed = false;
        this.tourStep = 0;
        this.lessons = newLessons();
    },

    /** The training was won: chapter 2 starts, also after the game is closed and opened again. */
    trainingWon(): void {
        load();
        if (!active || chapter === 2) return;
        chapter = 2;
        // A replay should not undo a prior decision to dismiss the automatic tutorial.
        if (saved?.done !== true) save({ chapter });
    },

    /** Skipped, or the first real mission lifted off: stop and do not start by itself again. */
    finish(): void {
        active = false;
        save({ done: true });
    },
};
