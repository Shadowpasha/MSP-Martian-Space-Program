// The astronaut outside at the survey site (tharsis_site.png), while the rover is there. Like
// someone bored on a long shift: he stands, does a slow low-gravity hop, stops, now and then turns
// around, and hops again, never far from the rover. When the rover arrives he hops down out of its
// door; when it is about to leave he hops back over and up into the door before the Sol ends.
// With Reduced Motion he just stands beside the rover.
//
// The atlas is art/eva_walker.py's: 8x4 cells of 40x64 pixels; the hop is row 2 (facing right)
// and row 3 (facing left). It is drawn at 2x, so he is in scale with the painted rover.
import type { Entity } from 'esengine';
import { play } from './feedback';
import type { FlightUi } from './flightUi';
import type { Motion } from './motion';

const ATLAS = 'assets/textures/eva_walker.png';
const SCALE = 2;
const FRAME_W = 40 * SCALE;
const FRAME_H = 64 * SCALE;
const HEAD_X = 20 * SCALE;
const FEET_Y = 62 * SCALE;
/** The ground beside the rover, and the stretch he hops about in (screen px, head centre x). */
const GROUND_Y = 490;
const AREA = [470, 610] as const;
/** The rover's door: where he hops up to (head centre x) and how far up the sill is. */
const DOOR_X = 808;
const DOOR_RISE = 56;
/** How far the coming-down tuck (frame 5) sits above the ground in its cell (screen px): lowered by
 * this, it stands on the ground. */
const SINK = 8;
/**
 * One hop, as [atlas frame, ms] (the same as art/eva_walker.py's preview). The Sprite AI sheet runs
 * stand, half crouch, take-off, three tucked frames, then two crouches; played in that order there
 * is no wind-up, the knees tuck while he is still rising, and he pops up out of the crouch. So the
 * frames are replayed as a jump: half crouch and crouch to wind up, take off straight, tuck, float
 * longest at the top, tuck coming down, land straight into the crouch, half crouch, stand.
 * The coming-down tuck (frame 5) also stands in, lowered to the ground, as the in-between pose
 * going down into the crouch and getting up out of it, so he never drops or pops a whole crouch at once.
 */
const HOP: ReadonlyArray<readonly [frame: number, ms: number, sink?: number]> = [
    [1, 140], [5, 140, SINK], [7, 240], [2, 150], [3, 260], [4, 460], [5, 300], [6, 220], [7, 260], [5, 160, SINK], [1, 180],
];
/** The steps of HOP he is off the ground for (take-off to the last tuck), inclusive. */
const AIR = [3, 6] as const;
const LIFT = 7;
const DRIFT = 45;
/** Boarding is the same size of hop, just quicker, so it fits before the Sol ends. */
const BOARD_SPEED = 2;
const BOARD_DRIFT = 60;
/** Where he heads after hopping out of the rover: the near edge of his patch. */
const HOME_X = AREA[1] - 20;
/** Fading up into the door, or down out of it. */
const DOOR_MS = 520;

type Facing = 1 | -1;
const hopCell = (frame: number, facing: Facing) => 16 + frame + (facing === 1 ? 0 : 8);
const STAND = 0;

type Mode = 'gone' | 'idle' | 'hop' | 'emerge' | 'board' | 'enter';

export interface Eva {
    /** Whether the rover is at the site. `fromDoor`: he has just arrived, so he hops out of the door;
     * otherwise he is already standing about outside. */
    setPresent(present: boolean, fromDoor: boolean): void;
    /** Hop over and into the rover, then call `done`. False (and nothing happens) if he is not out. */
    board(done: () => void): boolean;
    tick(): void;
}

export function mountEva(ui: FlightUi, parent: Entity, motion: Motion): Eva {
    const sprite = ui.image(parent, [0, 0, FRAME_W, FRAME_H], ATLAS, ui.palette.white, hopCell(STAND, 1));
    ui.show(sprite, false);
    let mode: Mode = 'gone';
    let x: number = AREA[0] + 60;
    let facing: Facing = 1;
    let started = 0;           // when the current hop / door move began
    let hopFrom = 0;           // x where the current hop took off
    let hopDrift = DRIFT;      // how far this hop carries him
    let speed = 1;
    let waitUntil = 0;
    let onBoarded: (() => void) | null = null;
    /** Just out of the rover: still hopping over to his patch, one ordinary hop at a time. */
    let leaving = false;

    const draw = (lift: number, frame: number, alpha = 1) => {
        motion.set(sprite, Math.round(x - HEAD_X), Math.round(GROUND_Y - FEET_Y - lift));
        ui.setSlot(sprite, hopCell(frame, facing));
        ui.fill(sprite, { r: 1, g: 1, b: 1, a: alpha });
    };
    const rest = (now: number, min: number, max: number) => {
        mode = 'idle';
        waitUntil = now + min + Math.random() * (max - min);
        draw(0, STAND);
    };
    const startHop = (now: number, drift: number, pace: number) => {
        mode = mode === 'board' ? 'board' : 'hop';
        started = now;
        hopFrom = x;
        hopDrift = drift;
        speed = pace;
    };

    /** Where the hop is `ms` in: the frame, how far along, how high. Null once it has landed. */
    function hopAt(ms: number): { frame: number; along: number; lift: number } | null {
        // lift: screen px above the ground (negative lowers a frame, see SINK).
        let t = ms * speed;
        const airStart = HOP.slice(0, AIR[0]).reduce((sum, [, ms]) => sum + ms, 0);
        const airLength = HOP.slice(AIR[0], AIR[1] + 1).reduce((sum, [, ms]) => sum + ms, 0);
        const air = Math.min(1, Math.max(0, (t - airStart) / airLength));
        for (const [frame, ms, sink] of HOP) {
            if (t < ms) return { frame, along: air, lift: Math.round(Math.sin(Math.PI * air) * LIFT) - (sink ?? 0) };
            t -= ms;
        }
        return null;
    }

    function emerge(now: number): void {
        mode = 'emerge';
        started = now;
        x = DOOR_X;
        facing = -1;
        ui.show(sprite, true);
        play('thunk', 1.2);
    }

    return {
        setPresent(present, fromDoor) {
            const now = Date.now();
            if (!present) {
                if (mode !== 'enter') { mode = 'gone'; ui.show(sprite, false); }
                return;
            }
            if (mode !== 'gone') return;
            if (motion.reducedMotion || !fromDoor) {
                x = AREA[0] + Math.round(Math.random() * (AREA[1] - AREA[0]));
                facing = 1;
                ui.show(sprite, true);
                rest(now, 0, 0);
                return;
            }
            emerge(now);
        },
        board(done) {
            if (mode === 'gone' || mode === 'board' || mode === 'enter' || motion.reducedMotion) return false;
            onBoarded = done;
            leaving = false;
            mode = 'board';
            facing = DOOR_X >= x ? 1 : -1;
            startHop(Date.now(), Math.min(BOARD_DRIFT, Math.abs(DOOR_X - x)), BOARD_SPEED);
            return true;
        },
        tick() {
            const now = Date.now();
            if (motion.reducedMotion || mode === 'gone') return;
            if (mode === 'emerge' || mode === 'enter') {
                // Down out of the door (fading in), or up into it (fading out).
                const t = Math.min(1, (now - started) / DOOR_MS);
                const k = mode === 'emerge' ? 1 - t : t;
                draw(Math.round(DOOR_RISE * k), k > 0.15 ? 4 : 7, 1 - k);
                if (t < 1) return;
                if (mode === 'emerge') {
                    // Away from the door, over to the patch where he passes the time.
                    facing = -1;
                    leaving = true;
                    startHop(now, Math.min(DRIFT, x - HOME_X), 1);
                } else {
                    mode = 'gone';
                    ui.show(sprite, false);
                    play('thunk', 0.8);
                    const done = onBoarded;
                    onBoarded = null;
                    done?.();
                }
                return;
            }
            if (mode === 'idle') {
                draw(0, STAND);
                if (now < waitUntil) return;
                // Bored: sometimes he just turns around and stands a bit longer.
                const ahead = x + facing * DRIFT;
                if (ahead < AREA[0] || ahead > AREA[1] || Math.random() < 0.3) {
                    facing = facing === 1 ? -1 : 1;
                    rest(now, 2500, 4500);
                    return;
                }
                startHop(now, DRIFT, 1);
                return;
            }
            // Hopping (about, or over to the door).
            const at = hopAt(now - started);
            if (at === null) {
                x = hopFrom + facing * hopDrift;
                if (mode === 'board') {
                    const left = DOOR_X - x;
                    if (Math.abs(left) < 2) {
                        // At the door: up and in.
                        facing = 1;
                        mode = 'enter';
                        started = now;
                        return;
                    }
                    facing = left > 0 ? 1 : -1;
                    startHop(now, Math.min(BOARD_DRIFT, Math.abs(left)), BOARD_SPEED);
                    return;
                }
                if (leaving) {
                    if (x - HOME_X > 1) {
                        startHop(now, Math.min(DRIFT, x - HOME_X), 1);
                        return;
                    }
                    leaving = false;
                }
                rest(now, 3500, 7000);
                return;
            }
            x = hopFrom + facing * hopDrift * at.along;
            draw(at.lift, at.frame);
        },
    };
}
