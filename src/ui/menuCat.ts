// The station cat on the main menu (Last Tick's "Animated Pixel Kittens", built by art/menu_cat.py).
// It mostly stays put: sits and slowly looks around, now and then washes, yawns or naps. Only
// after a long while in one spot (or when clicked, after a meow) does it get up and move: a walk
// along the upper deck, or a jump onto the crate, the orange cabinet, the console desk or the
// drawer cabinet, or back down to the floor. Positions are painting pixels (the painting is shown at 2×).
// With Reduced Motion it just sits on the console desk.
import { Interactable, type Entity } from 'esengine';
import { makeAbsBox } from './theme';
import type { FlightUi } from './flightUi';
import type { Motion } from './motion';

const S = 2;
const CELL = 32;                 // atlas cells, painting px
const FEET = 25;                 // the cat's feet line inside a cell
const CAT_ATLAS = 'assets/textures/menu_cat.png';
const GRID = [8, 8] as const;

/** Atlas rows (art/menu_cat.py). */
const WALK_RIGHT = 0;
const WALK_LEFT = 8;
const REST = { first: 16, count: 6, ms: 900 };
const WASH = { first: 24, count: 8, ms: 240 };
const YAWN = { first: 32, count: 8, ms: 220 };
const MEOW = { first: 40, count: 3, ms: 260 };
const SLEEP_LEFT = 43;
const SLEEP_RIGHT = 45;
const LEAP_FRAME = 2;
/** Sitting still, facing us, and a brief glance to the side (both from the rest row). */
const SIT = REST.first;
const GLANCE = REST.first + 4;            // the stretched-out walk frame, used mid-jump

const WALK_SPEED = 8;            // painting px per second: an unhurried stroll
const WALK_FRAME_MS = 140;
const JUMP_MS = 700;
const JUMP_HEIGHT = 10;
/** How long it stays in one spot before moving on by itself (ms). */
const STAY = [45000, 90000] as const;

interface Surface { name: string; x0: number; x1: number; y: number; sleep: boolean }
/** Where the cat can stand: the deck floor and four things it can jump onto (painting pixels). */
const FLOOR: Surface = { name: 'floor', x0: 206, x1: 532, y: 263, sleep: false };
const PERCHES: Surface[] = [
    { name: 'crate', x0: 237, x1: 256, y: 244, sleep: true },
    { name: 'cabinet', x0: 308, x1: 322, y: 233, sleep: false },
    { name: 'desk', x0: 338, x1: 386, y: 236, sleep: true },
    { name: 'drawers', x0: 440, x1: 458, y: 237, sleep: false },
];

type Task =
    | { kind: 'walk'; x: number }
    | { kind: 'jump'; to: Surface; x: number }
    | { kind: 'anim'; first: number; count: number; ms: number; loops: number }
    | { kind: 'sleep'; ms: number }
    | { kind: 'hold'; frame: number; ms: number };

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const pick = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)]!;

export function mountMenuCat(ui: FlightUi, parent: Entity, motion: Motion): () => void {
    let surface: Surface = motion.reducedMotion ? PERCHES[2]! : FLOOR;
    let x = motion.reducedMotion ? 360 : 300;
    let y = surface.y;
    let facing: 1 | -1 = 1;
    const sprite = ui.image(parent, [0, 0, CELL * S, CELL * S], CAT_ATLAS, ui.palette.white, REST.first, GRID);
    // Placed on whole screen pixels (half painting pixels), so walking and jumping glide instead of stepping.
    const place = () => motion.set(sprite, Math.round(x * S) - (CELL / 2) * S, Math.round(y * S) - FEET * S);
    place();
    if (motion.reducedMotion) return () => {};

    const tasks: Task[] = [{ kind: 'hold', frame: SIT, ms: 4000 }];
    let started = Date.now();
    let from = { x, y };
    let last = Date.now();

    /** Sitting quietly: still for long stretches, a brief glance now and then; rarely a wash, a yawn or a nap. */
    function idle(): Task[] {
        const routine: Task[] = [{ kind: 'hold', frame: SIT, ms: rand(7000, 14000) }];
        const r = Math.random();
        if (r < 0.5) routine.push({ kind: 'hold', frame: GLANCE, ms: rand(900, 1600) });
        else if (r < 0.6) routine.push({ kind: 'anim', ...WASH, loops: 1 });
        else if (r < 0.68) routine.push({ kind: 'anim', ...YAWN, loops: 1 });
        else if (r < 0.8 && surface.sleep) routine.push({ kind: 'sleep', ms: rand(15000, 30000) });
        return routine;
    }

    let moveAt = Date.now() + rand(...STAY);
    let wantsToMove = false;
    /** Decide what to do next: keep idling until it is time to move (or it was clicked). */
    function plan(): void {
        if (!wantsToMove && Date.now() < moveAt) { tasks.push(...idle()); return; }
        wantsToMove = false;
        moveAt = Date.now() + rand(...STAY);
        move();
    }

    /** One move: a stroll on the floor, a jump onto a perch, or a hop back down. */
    function move(): void {
        if (surface === FLOOR) {
            if (Math.random() < 0.55) {
                // Head for a perch: walk to just beside it, jump up, maybe stroll along it, settle.
                const perch = pick(PERCHES);
                const fromLeft = x < (perch.x0 + perch.x1) / 2;
                const launch = fromLeft ? perch.x0 - 9 : perch.x1 + 9;
                tasks.push({ kind: 'walk', x: Math.min(FLOOR.x1, Math.max(FLOOR.x0, launch)) });
                tasks.push({ kind: 'jump', to: perch, x: fromLeft ? perch.x0 + 3 : perch.x1 - 3 });
                if (perch.x1 - perch.x0 > 20) tasks.push({ kind: 'walk', x: rand(perch.x0 + 4, perch.x1 - 4) });
            } else {
                tasks.push({ kind: 'walk', x: rand(FLOOR.x0, FLOOR.x1) });
            }
        } else {
            // Hop down to the floor on one side.
            const left = Math.random() < 0.5;
            const edge = left ? surface.x0 + 2 : surface.x1 - 2;
            tasks.push({ kind: 'walk', x: edge }, { kind: 'jump', to: FLOOR, x: left ? surface.x0 - 10 : surface.x1 + 10 });
        }
    }

    function begin(): void {
        started = Date.now();
        from = { x, y };
    }

    // Clicking the cat: it meows, then gets up and moves somewhere else.
    const HIT = { w: 20, h: 16 };
    const hit = makeAbsBox(ui.world, parent, 0, 0, HIT.w * S, HIT.h * S, undefined, false);
    ui.world.insert(hit, Interactable, { enabled: true, blockRaycast: true, raycastTarget: true });
    ui.on(hit, 'press', () => {
        const busy = tasks[0]?.kind === 'walk' || tasks[0]?.kind === 'jump';
        if (busy) return;
        tasks.length = 0;
        tasks.push({ kind: 'anim', ...MEOW, loops: 2 });
        wantsToMove = true;
        begin();
    });

    return () => {
        const now = Date.now();
        const dt = Math.min(100, now - last);
        last = now;
        if (!tasks.length) { plan(); begin(); }
        const task = tasks[0]!;
        const age = now - started;
        let done = false;

        if (task.kind === 'walk') {
            facing = task.x >= x ? 1 : -1;
            const step = (WALK_SPEED * dt) / 1000;
            if (Math.abs(task.x - x) <= step) { x = task.x; done = true; }
            else x += step * facing;
            ui.setSlot(sprite, (facing === 1 ? WALK_RIGHT : WALK_LEFT) + (Math.floor(age / WALK_FRAME_MS) % 8));
        } else if (task.kind === 'jump') {
            // A smooth arc from where it stood to the landing spot, stretched out mid-air.
            facing = task.x >= from.x ? 1 : -1;
            const k = Math.min(1, age / JUMP_MS);
            x = from.x + (task.x - from.x) * k;
            y = from.y + (task.to.y - from.y) * k - JUMP_HEIGHT * 4 * k * (1 - k);
            ui.setSlot(sprite, (facing === 1 ? WALK_RIGHT : WALK_LEFT) + (k < 0.15 || k > 0.85 ? 0 : LEAP_FRAME));
            if (k >= 1) { surface = task.to; y = surface.y; done = true; }
        } else if (task.kind === 'anim') {
            const frame = Math.floor(age / task.ms);
            ui.setSlot(sprite, task.first + (frame % task.count));
            done = frame >= task.count * task.loops;
        } else if (task.kind === 'hold') {
            ui.setSlot(sprite, task.frame);
            done = age >= task.ms;
        } else {
            // Sleeping: a slow breath every 2.4 s.
            ui.setSlot(sprite, (facing === 1 ? SLEEP_RIGHT : SLEEP_LEFT) + (Math.floor(age / 1200) % 2));
            done = age >= task.ms;
        }

        place();
        motion.set(hit, Math.round((x - HIT.w / 2) * S), Math.round((y - HIT.h) * S));
        if (done) { tasks.shift(); begin(); }
    };
}
