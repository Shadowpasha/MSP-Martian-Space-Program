// The astronaut outside at the survey site (tharsis_site.png), while the rover is there. Like
// someone bored on a long shift: he stands, does a slow low-gravity hop, stops, now and then turns
// around, and hops again, never far from the rover. When the rover arrives he hops down out of its
// door; when it is about to leave he hops back over and up into the door before the Sol ends.
// Before the trip, while the rover idles there being readied, he waits beside it ("calm"): he
// stands on one spot and only hops in place now and then.
// With Reduced Motion he just stands beside the rover.
//
// The atlas is art/eva_walker.py's: 8x4 cells of 40x64 pixels; the hop is row 2 (facing right)
// and row 3 (facing left). It is drawn at 2x, so he is in scale with the painted rover.
import { px, UINode, type Color, type Entity } from 'esengine';
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
 * longest at the top, tuck coming down, land in the crouch and straight back up: half crouch, stand.
 * The coming-down tuck (frame 5) also stands in, lowered to the ground, as the in-between pose
 * going down into the crouch and getting up out of it, so he never drops or pops a whole crouch at once.
 */
const HOP: ReadonlyArray<readonly [frame: number, ms: number, sink?: number]> = [
    [1, 140], [5, 140, SINK], [7, 240], [2, 150], [3, 260], [4, 460], [5, 300], [6, 300], [5, 160, SINK], [1, 180],
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
/** Where he waits while the rover is being readied (calm). */
const WAIT_X = 560;
/** Fading up into the door, or down out of it. */
const DOOR_MS = 520;
/** Mars dust kicked up when he lands (and, lighter, when he pushes off): reddish specks that drift
 * out slowly, rise a little and fade, as dust does in low gravity. */
const DUST: Color = { r: 0.9, g: 0.68, b: 0.5, a: 0.85 };
const DUST_LAND = 8;
const DUST_TAKEOFF = 3;

type Facing = 1 | -1;
const hopCell = (frame: number, facing: Facing) => 16 + frame + (facing === 1 ? 0 : 8);
const STAND = 0;

type Mode = 'gone' | 'idle' | 'hop' | 'emerge' | 'board' | 'enter';

interface Mote { entity: Entity; x: number; y: number; vx: number; vy: number; born: number; life: number }

export interface Eva {
    /** Whether he is outside. `fromDoor`: the rover has just arrived, so he hops out of its door;
     * otherwise he is already standing about. `calm`: the rover is still being readied, so he waits
     * on one spot and only hops in place. */
    setPresent(present: boolean, fromDoor: boolean, calm: boolean): void;
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
    /** Waiting while the rover is readied: hops in place, never moves off. */
    let calm = false;
    /** The step of the current hop last drawn, to catch the moments he leaves and meets the ground. */
    let lastStep = -1;
    let last = Date.now();
    const motes: Mote[] = [];

    /** A puff of dust at his feet: `count` specks thrown out to both sides, `speed` px/s at most. */
    function puff(now: number, count: number, speed: number): void {
        for (let i = 0; i < count; i++) {
            const side = i % 2 === 0 ? -1 : 1;
            const size = Math.random() < 0.5 ? 4 : 6;
            const entity = ui.box(parent, [0, 0, size, size], DUST);
            motes.push({
                entity, x: x + side * (4 + Math.random() * 8), y: GROUND_Y - 3 - Math.random() * 4,
                vx: side * speed * (0.35 + Math.random() * 0.65), vy: -(6 + Math.random() * 10),
                born: now, life: 800 + Math.random() * 600,
            });
        }
    }

    function moveMotes(now: number, dt: number): void {
        for (let i = motes.length - 1; i >= 0; i--) {
            const mote = motes[i]!;
            const age = now - mote.born;
            if (age >= mote.life || !ui.world.valid(mote.entity)) {
                if (ui.world.valid(mote.entity)) ui.world.despawn(mote.entity);
                motes.splice(i, 1);
                continue;
            }
            mote.x += (mote.vx * dt) / 1000;
            mote.y += (mote.vy * dt) / 1000;
            mote.vx *= 0.97;
            mote.vy += (14 * dt) / 1000;    // weak gravity: it settles back slowly
            const mx = Math.round(mote.x);
            const my = Math.round(Math.min(GROUND_Y - 1, mote.y));
            ui.world.update(mote.entity, UINode, node => { node.insetLeft = px(mx); node.insetTop = px(my); });
            ui.fill(mote.entity, { ...DUST, a: DUST.a * (1 - age / mote.life) });
        }
    }

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
        lastStep = -1;
    };

    /** Where the hop is `ms` in: the step and frame, how far along, how high. Null once it has landed. */
    function hopAt(ms: number): { step: number; frame: number; along: number; lift: number } | null {
        // lift: screen px above the ground (negative lowers a frame, see SINK).
        let t = ms * speed;
        const airStart = HOP.slice(0, AIR[0]).reduce((sum, [, ms]) => sum + ms, 0);
        const airLength = HOP.slice(AIR[0], AIR[1] + 1).reduce((sum, [, ms]) => sum + ms, 0);
        const air = Math.min(1, Math.max(0, (t - airStart) / airLength));
        for (const [step, [frame, ms, sink]] of HOP.entries()) {
            if (t < ms) return { step, frame, along: air, lift: Math.round(Math.sin(Math.PI * air) * LIFT) - (sink ?? 0) };
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
        setPresent(present, fromDoor, waiting) {
            const now = Date.now();
            calm = waiting;
            if (!present) {
                if (mode !== 'enter') { mode = 'gone'; ui.show(sprite, false); }
                return;
            }
            if (mode !== 'gone') return;
            if (motion.reducedMotion || !fromDoor || calm) {
                x = calm ? WAIT_X : AREA[0] + Math.round(Math.random() * (AREA[1] - AREA[0]));
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
            const dt = Math.min(100, now - last);
            last = now;
            moveMotes(now, dt);
            if (motion.reducedMotion || mode === 'gone') return;
            if (mode === 'emerge' || mode === 'enter') {
                // Down out of the door (fading in), or up into it (fading out).
                const t = Math.min(1, (now - started) / DOOR_MS);
                const k = mode === 'emerge' ? 1 - t : t;
                draw(Math.round(DOOR_RISE * k), k > 0.15 ? 4 : 7, 1 - k);
                if (t < 1) return;
                if (mode === 'emerge') {
                    // Down from the door with a puff of dust, then over to the patch where he passes the time.
                    puff(now, DUST_LAND, 30);
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
                // Waiting for the rover: a hop on the spot now and then, nothing more.
                if (calm) {
                    startHop(now, 0, 1);
                    return;
                }
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
            if (at.step !== lastStep) {
                if (at.step === AIR[0]) puff(now, DUST_TAKEOFF, 18);
                if (at.step === AIR[1] + 1) puff(now, DUST_LAND, 30);
                lastStep = at.step;
            }
            draw(at.lift, at.frame);
        },
    };
}
