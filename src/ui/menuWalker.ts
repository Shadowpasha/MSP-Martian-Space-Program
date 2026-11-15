// The main menu's walking crew member. The painting has him erased (MENU_BACKGROUND);
// this sprite walks between a few spots on the control deck, turns to face the screens when he
// stops, and turns side-on again before he sets off. With Reduced Motion he stands
// still at the console, as in the original painting.
import type { Entity } from 'esengine';
import { MENU_WALKER, type FlightUi } from './flightUi';
import type { Motion } from './motion';

/** The painting is 640×360 drawn at 2×; the sprite frames are 40×64 painting pixels. */
const SCALE = 2;
const FRAME_W = 40 * SCALE;
const FRAME_H = 64 * SCALE;
/** Where the head centre and the feet sit inside a frame (see art/menu_walker.py). */
const HEAD_X = 20 * SCALE;
const FEET_Y = 62 * SCALE;
/** The deck floor line, and the stops along it (head x, screen pixels). */
const FLOOR_Y = 526;
const CONSOLE = 714;
const MONITOR = 840;
const COLLEAGUE = 924;
const STOPS = [CONSOLE, MONITOR, COLLEAGUE];
const SPEED = 54;         // screen px per second
const FRAME_MS = 100;     // the 7-frame Sprite AI stride at 10 fps
const WALK_FRAMES = 7;
const TURN_MS = 200;      // the side pose, held briefly when he turns to or from the screens

type Facing = 1 | -1;
/** Atlas cells (art/menu_walker.py): walk 0-6 right, 8-14 left; 16 back view, 17/18 side standing right/left. */
const walkFrame = (frame: number, facing: Facing) => frame + (facing === 1 ? 0 : 8);
const POSE = {
    back: 16,
    side: (facing: Facing) => (facing === 1 ? 17 : 18),
};
type Stance = 'back' | 'side';

export interface MenuWalker {
    /** Head-centre x and the top of the sprite, for things that follow him (the hello bubble). */
    position(): { x: number; top: number };
    /** Stand still for `ms` (while he says hello). */
    pause(ms: number): void;
    tick(): void;
}

export function mountMenuWalker(ui: FlightUi, parent: Entity, motion: Motion): MenuWalker {
    let x = CONSOLE;
    let facing: Facing = 1;
    let stance: Stance = 'back';
    let target: number | null = null;
    let waitUntil = Date.now() + 1500;
    let last = Date.now();
    let walkedMs = 0;
    /** Poses still to play before he moves on (turning around), one every TURN_MS. */
    let turning: number[] = [];
    let turnAt = 0;
    const sprite = ui.image(parent, [x - HEAD_X, FLOOR_Y - FEET_Y, FRAME_W, FRAME_H], MENU_WALKER, ui.palette.white, POSE.back);

    const place = () => motion.set(sprite, Math.round(x - HEAD_X), FLOOR_Y - FEET_Y);
    const turn = (poses: number[]) => { turning = poses; turnAt = 0; };

    /** Arrived: face the screens at the console and monitor; beside his colleague he stays side-on, facing her. */
    function arrive(): void {
        if (x === COLLEAGUE) {
            stance = 'side';
            facing = 1;
            turn([POSE.side(facing)]);
        } else {
            stance = 'back';
            turn([POSE.side(facing), POSE.back]);
        }
    }

    /** Leaving: turn side-on towards the next stop, then walk. */
    function setOff(direction: Facing): void {
        facing = direction;
        stance = 'side';
        turn([POSE.side(direction)]);
    }

    return {
        position: () => ({ x, top: FLOOR_Y - FEET_Y }),
        pause(ms) {
            waitUntil = Math.max(waitUntil, Date.now() + ms);
            // Mid-walk he stops side-on; standing, he keeps his pose.
            if (stance === 'side' && turning.length === 0) ui.setSlot(sprite, POSE.side(facing));
        },
        tick() {
            const now = Date.now();
            const dt = Math.min(100, now - last);
            last = now;
            if (motion.reducedMotion) return;
            if (turning.length) {
                if (now >= turnAt) {
                    ui.setSlot(sprite, turning.shift()!);
                    turnAt = now + TURN_MS;
                }
                return;
            }
            if (now < waitUntil) return;
            if (target === null) {
                const options = STOPS.filter(stop => stop !== x);
                target = options[Math.floor(Math.random() * options.length)]!;
                setOff(target > x ? 1 : -1);
                return;
            }
            const step = (SPEED * dt) / 1000;
            if (Math.abs(target - x) <= step) {
                // Arrived: turn, then stand for a few seconds before the next stroll.
                x = target;
                target = null;
                walkedMs = 0;
                place();
                arrive();
                waitUntil = now + 2500 + Math.random() * 3500;
                return;
            }
            x += step * facing;
            walkedMs += dt;
            place();
            ui.setSlot(sprite, walkFrame(Math.floor(walkedMs / FRAME_MS) % WALK_FRAMES, facing));
        },
    };
}
