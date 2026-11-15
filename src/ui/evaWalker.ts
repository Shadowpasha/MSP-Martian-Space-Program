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
/** Low gravity (the same numbers as art/eva_walker.py's preview): ms per hop frame, the airborne
 * frames, how high he floats at the top, and how far one hop carries him. */
const HOP_MS = [160, 140, 140, 300, 360, 360, 300, 220] as const;
const AIR = [3, 4, 5, 6] as const;
const LIFT = 7;
const DRIFT = 45;
/** Boarding is the same hop, quicker and longer, so it fits before the Sol ends. */
const BOARD_SPEED = 1.6;
const BOARD_DRIFT = 90;
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
        let t = ms * speed;
        const airStart = HOP_MS.slice(0, AIR[0]).reduce((a, b) => a + b, 0);
        const airLength = AIR.reduce((sum, i) => sum + HOP_MS[i]!, 0);
        const air = Math.min(1, Math.max(0, (t - airStart) / airLength));
        for (let frame = 0; frame < HOP_MS.length; frame++) {
            if (t < HOP_MS[frame]!) return { frame, along: air, lift: Math.round(Math.sin(Math.PI * air) * LIFT) };
            t -= HOP_MS[frame]!;
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
                    // Away from the door, into the patch where he passes the time.
                    facing = -1;
                    startHop(now, x - (AREA[1] - 20), 1);
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
                    rest(now, 1200, 2600);
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
                rest(now, 1800, 4200);
                return;
            }
            x = hopFrom + facing * hopDrift * at.along;
            draw(at.lift, at.frame);
        },
    };
}
