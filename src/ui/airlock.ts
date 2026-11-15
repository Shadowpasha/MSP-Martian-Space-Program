// The airlock between the station and expedition views: two heavy hazard-striped doors slam
// shut from the sides (a jolt, a flash, warning lights), the destination is stencilled across
// the seal while the view changes behind them, then the doors grind open onto the new scene.
//
// The doors go in their own layer, which the owner keeps above the screen's UI.
import { px, UINode, type Color, type Entity, type World } from 'esengine';
import type { FlightUi } from './flightUi';
import { play } from './feedback';

const W = 1280;
const H = 720;
const HALF = W / 2;
/** Milliseconds: doors closing, shut (the view changes partway through), doors opening. */
const CLOSE = 380;
const HOLD = 560;
const OPEN = 480;
/** When, after the doors shut, the view behind them changes. */
const SWAP_AT = 140;

const STEEL: Color = { r: 0.13, g: 0.14, b: 0.21, a: 1 };
const SEAM: Color = { r: 0.07, g: 0.07, b: 0.12, a: 1 };
const BEVEL: Color = { r: 0.24, g: 0.26, b: 0.36, a: 1 };
const RIVET: Color = { r: 0.33, g: 0.35, b: 0.46, a: 1 };
const HAZARD: Color = { r: 0.96, g: 0.72, b: 0.31, a: 1 };
const BLACK: Color = { r: 0.04, g: 0.04, b: 0.07, a: 1 };
const RED: Color = { r: 0.93, g: 0.25, b: 0.22, a: 1 };

const easeIn = (t: number) => t * t * t;
const easeOut = (t: number) => 1 - (1 - t) ** 3;

export interface Airlock {
    /** Advance the animation; false once the doors are open and gone. */
    tick(): boolean;
}

export function startAirlock(world: World, ui: FlightUi, root: Entity, title: string, subtitle: string, swap: () => void): Airlock {
    const start = Date.now();
    let swapped = false;
    let slammed = false;
    let opening = false;
    let layer: Entity | null = null;
    let left: Entity | null = null;
    let right: Entity | null = null;
    let seal: Entity | null = null;
    let flash: Entity | null = null;
    let lamps: Entity[] = [];

    /** One door: steel panels, seams, rivets, and a hazard band along the edge that meets the other. */
    function door(x: number, inner: 'right' | 'left'): Entity {
        const d = ui.group(layer!, [x, 0, HALF, H]);
        ui.box(d, [0, 0, HALF, H], STEEL);
        for (let y = 120; y < H; y += 120) {
            ui.box(d, [0, y, HALF, 3], SEAM);
            ui.box(d, [0, y + 3, HALF, 1], BEVEL);
        }
        ui.box(d, [inner === 'right' ? 300 : 340, 0, 3, H], SEAM);
        ui.box(d, [0, 0, HALF, 2], BEVEL);
        for (let y = 20; y < H; y += 60) {
            for (const rx of inner === 'right' ? [16, 286, 572] : [62, 348, 618]) ui.box(d, [rx, y, 4, 4], RIVET);
        }
        // The hazard band: amber with black stripes climbing diagonally.
        const BAND = 44;
        const bandX = inner === 'right' ? HALF - BAND : 0;
        ui.box(d, [bandX, 0, BAND, H], HAZARD);
        for (let y = 0; y < H; y += 6) {
            // Black and amber in 12 px stripes, shifted 6 px each row; clipped to the band.
            const shift = (Math.floor(y / 6) * 6) % 24;
            for (let x = shift - 24; x < BAND; x += 24) {
                const x0 = Math.max(0, x);
                const x1 = Math.min(BAND, x + 12);
                if (x1 > x0) ui.box(d, [bandX + x0, y, x1 - x0, 6], BLACK);
            }
        }
        ui.box(d, [inner === 'right' ? HALF - 46 : 44, 0, 2, H], SEAM);
        // A handle bar on each door.
        ui.box(d, [inner === 'right' ? HALF - 120 : 100, 300, 20, 120], SEAM);
        ui.box(d, [inner === 'right' ? HALF - 116 : 104, 304, 12, 112], BEVEL);
        return d;
    }

    function build(): void {
        if (layer !== null && world.valid(layer)) world.despawn(layer);
        layer = ui.group(root, [0, 0, W, H]);
        left = door(-HALF, 'right');
        right = door(W, 'left');
        // The seal: a glowing seam, warning lamps and the destination.
        seal = ui.group(layer, [0, 0, W, H]);
        ui.box(seal, [HALF - 3, 0, 6, H], HAZARD);
        lamps = [ui.box(seal, [HALF - 18, 40, 36, 14], RED), ui.box(seal, [HALF - 18, H - 54, 36, 14], RED)];
        ui.box(seal, [HALF - 330, 300, 660, 120], { r: 0.03, g: 0.03, b: 0.06, a: 0.86 });
        ui.box(seal, [HALF - 330, 300, 660, 3], HAZARD);
        ui.box(seal, [HALF - 330, 417, 660, 3], HAZARD);
        ui.label(seal, [HALF - 320, 312, 644, 64], title, { display: true, size: 56, center: true, color: { r: 0, g: 0, b: 0, a: 0.8 } });
        ui.label(seal, [HALF - 324, 308, 644, 64], title, { display: true, size: 56, center: true, color: HAZARD });
        ui.label(seal, [HALF - 320, 372, 640, 32], subtitle, { size: 16, center: true, color: ui.palette.secondary });
        flash = ui.box(layer, [0, 0, W, H], { r: 1, g: 0.95, b: 0.85, a: 0 });
        place(Date.now() - start);
    }

    const at = (entity: Entity | null, x: number, y = 0) => {
        if (entity !== null && world.valid(entity)) world.update(entity, UINode, node => { node.insetLeft = px(Math.round(x)); node.insetTop = px(Math.round(y)); });
    };
    const colour = (entity: Entity | null, color: Color) => {
        if (entity !== null && world.valid(entity)) ui.fill(entity, color);
    };

    /** Put everything where it is `ms` into the animation. */
    function place(ms: number): void {
        let shut: number;                      // 0 open .. 1 shut
        if (ms < CLOSE) shut = easeIn(ms / CLOSE);
        else if (ms < CLOSE + HOLD) shut = 1;
        else shut = 1 - easeOut(Math.min(1, (ms - CLOSE - HOLD) / OPEN));
        const held = ms - CLOSE;
        // The slam: a jolt that dies away, and a white flash.
        const jolt = held >= 0 && held < 220 ? Math.round(Math.sin(held / 18) * 8 * (1 - held / 220)) : 0;
        at(left, -HALF + HALF * shut + jolt, jolt / 2);
        at(right, W - HALF * shut + jolt, -jolt / 2);
        const showSeal = held >= 40 && held < HOLD;
        if (seal !== null && world.valid(seal)) ui.show(seal, showSeal);
        const blink = Math.floor(ms / 120) % 2 === 0;
        lamps.forEach(lamp => colour(lamp, blink ? RED : { ...RED, a: 0.25 }));
        colour(flash, { r: 1, g: 0.95, b: 0.85, a: held >= 0 && held < 160 ? 0.45 * (1 - held / 160) : 0 });
    }

    build();
    play('whoosh', 0.8);
    return {
        tick() {
            const ms = Date.now() - start;
            if (!slammed && ms >= CLOSE) {
                slammed = true;
                play('slam');
            }
            if (!swapped && ms >= CLOSE + SWAP_AT) {
                swapped = true;
                swap();
            }
            if (!opening && ms >= CLOSE + HOLD) {
                opening = true;
                play('whoosh', 1.2);
            }
            if (ms >= CLOSE + HOLD + OPEN) {
                if (layer !== null && world.valid(layer)) world.despawn(layer);
                layer = null;
                return false;
            }
            place(ms);
            return true;
        },
    };
}
