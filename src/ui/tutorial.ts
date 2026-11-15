// Whether the tutorial is running, and where it is up to.
//
// It has two chapters:
//   1. The first game: pack the cargo, meet the team, then the whole (short) training mission.
//   2. After the training is won: the Upgrade page, then on to a real mission.
//      It ends when the first real mission lifts off.
//
// The tutorial starts by itself the first time the game is opened. "Skip tutorial" ends it for good;
// "How to Play" on the main menu starts it over from chapter 1.
//
// What it says at each moment is in tutorialSteps.ts; how it is drawn is in coach.ts.
import { Storage, type Entity } from 'esengine';
import { newLessons, type CargoCoachView } from './tutorialSteps';

const SAVED = 'mars-outpost:tutorial-v1';

let loaded = false;
let active = false;
let chapter: 1 | 2 = 1;
/** Nothing was saved yet: this player has never met the tutorial. */
let fresh = true;

function load(): void {
    if (loaded) return;
    loaded = true;
    const saved = Storage.getJSON<{ done?: boolean; chapter?: number }>(SAVED);
    fresh = !saved;
    active = saved?.done !== true;
    chapter = saved?.chapter === 2 ? 2 : 1;
}

export const tutorial = {
    /** The welcome on the main menu has been read. */
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
        if (id === 'menu-welcome') this.welcomed = true;
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
        if (fresh) this.finish();
    },

    /** "How to Play": start again from the welcome. */
    begin(): void {
        loaded = true;
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
        fresh = false;
        Storage.setJSON(SAVED, { chapter: 2 });
    },

    /** Skipped, or the first real mission lifted off: stop and do not start by itself again. */
    finish(): void {
        loaded = true;
        fresh = false;
        active = false;
        Storage.setJSON(SAVED, { done: true });
    },
};
