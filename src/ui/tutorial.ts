// Whether the first-time tutorial is running, and where it is up to.
//
// It starts by itself the first time the game is opened and stays on, from the main menu through the
// training mission, until the player wins the training or presses "Skip tutorial". After that it
// never starts by itself again; "How to Play" starts it over (on the main menu until the tutorial
// is done, then in Settings).
//
// What it says at each moment is in tutorialSteps.ts; how it is drawn is in coach.ts.
import { Storage, type Entity } from 'esengine';

const SAVED = 'mars-outpost:tutorial-v1';

let loaded = false;
let active = false;
let finished = false;

function load(): void {
    if (loaded) return;
    loaded = true;
    finished = Storage.getJSON<{ done?: boolean }>(SAVED)?.done === true;
    active = !finished;
}

export const tutorial = {
    /** The welcome on the main menu has been read. */
    welcomed: false,
    /** How many steps of the station tour (the first planning screen) have been read. */
    tourStep: 0,
    /** Buttons on the menu pages that a step can point at, by key. Cleared for every page. */
    targets: new Map<string, Entity>(),

    get active(): boolean {
        load();
        return active;
    },

    /** Won or skipped once: "How to Play" moves from the main menu into Settings. */
    get finished(): boolean {
        load();
        return finished;
    },

    /** Someone who has already finished a mission (before the tutorial existed) is not a new player. */
    skipForReturningPlayer(): void {
        load();
        if (!finished) this.finish();
    },

    /** "How to Play": start again from the welcome. */
    begin(): void {
        loaded = true;
        active = true;
        this.welcomed = false;
        this.tourStep = 0;
    },

    /** The training was won: remember it, but keep talking until the player leaves the mission. */
    markDone(): void {
        if (finished) return;
        finished = true;
        Storage.setJSON(SAVED, { done: true });
    },

    /** Leaving the mission screen ends a tutorial that was won there. */
    leaveRun(): void {
        if (finished) active = false;
    },

    /** Skipped, or done: stop now and do not start by itself again. */
    finish(): void {
        this.markDone();
        active = false;
    },
};
