// Small signs of life in the main menu painting (shown at 2×). The glows are layers cut from the
// painting's own bright pixels (art/menu_glow.py), so each one has the exact shape of the thing
// that glows; this file only fades them and adds a few tiny particles.
//
// - Hydroponics: grow lights breathe, a slow shimmer runs across the leaves, green motes drift
//   up from the rows, and water drips through the gaps under the top two shelves (it stops at
//   the leaves below, so it never crosses a plant).
// - Upper deck: the doorway on the right slides open now and then (behind its railing), and the
//   lamp above it turns amber while the door moves.
// - Generator bay: the generator hums (a copy of it, over a dark fill in its shape, rises a
//   pixel in short bursts), the vent grilles flicker like a fire behind them, the lamps hum, the
//   generator's indicator pulses, panel lights blink, embers drift up from the vents, a pipe
//   drips onto the floor, and steam puffs rise from the pipes.
//
// With Reduced Motion none of it moves.
import { px, UINode, UIVisual, type Color, type Entity } from 'esengine';
import type { FlightUi } from './flightUi';
import type { Motion } from './motion';

/** Painting pixels → screen pixels. */
const S = 2;
const glow = (name: string) => `assets/textures/menu_glow_${name}.png`;

/** Plant rows the motes rise from (x range and the leaves' top edge), painting pixels. */
const PLANT_ROWS = [[204, 293, 198], [204, 293, 220], [204, 293, 242]] as const;
/** Water: each drip falls from under a shelf (y) to the top of the leaves below (to). */
const DRIPS = [{ y: 208, to: 219 }, { y: 231, to: 241 }] as const;
/** Plant bays left and right of the rack's middle post (x ranges). */
const BAYS = [[206, 248], [258, 292]] as const;
/** Vent grilles the embers rise from (x range and top edge). */
const VENT_TOPS = [[403, 437, 300], [588, 612, 315]] as const;
/** A leaking pipe joint and the floor under it. */
const LEAK = { x: 333, y: 312, floor: 345 };
/** The upper-deck doorway's opening, and the lamp above it (painting pixels). */
const DOOR = { x0: 584, x1: 624, y0: 200, y1: 259 };
/** Each half is half the opening plus a pixel of overlap at the seam. */
const DOOR_HALF = 21;
const DOOR_LAMP = [592, 186, 23, 4] as const;
const DOOR_MS = { move: 650, open: 2600 };
/** Generator indicator and the small panel lights, measured from the painting. */
const INDICATOR = [191, 330, 13, 4] as const;
const PANEL_LIGHTS = [[306, 322], [319, 322], [445, 338]] as const;
/** Pipe joints that let off steam: x, y and how often (ms between puffs). */
const STEAM = [[332, 304, 2600], [547, 301, 3400], [276, 296, 4200], [320, 181, 5200], [545, 190, 4700]] as const;

interface Particle { entity: Entity; x: number; y: number; vx: number; vy: number; born: number; life: number; size: number; grow: number; color: Color }

export function mountMenuAmbience(ui: FlightUi, parent: Entity, motion: Motion): () => void {
    const { palette: p } = ui;
    if (motion.reducedMotion) return () => {};
    const full: [number, number, number, number] = [0, 0, 1280, 720];
    const white = (a: number): Color => ({ r: 1, g: 1, b: 1, a });
    const layer = (name: string, alpha = 0) => ui.image(parent, full, glow(name), white(alpha));
    // The generator copy (over a dark fill in its shape) goes first, so the lamp glow stays on top.
    layer('generator_hole', 1);
    const generator = layer('generator', 1);
    const leaves = layer('leaves');
    const grow = layer('grow');
    const lamps = layer('lamps');
    const vents = [layer('vent_a'), layer('vent_b')];
    const ember: Color = { r: 1, g: 0.62, b: 0.25, a: 0 };
    const indicator = ui.box(parent, [INDICATOR[0] * S, INDICATOR[1] * S, INDICATOR[2] * S, INDICATOR[3] * S], ember);
    const panels = PANEL_LIGHTS.map(([x, y]) => ui.box(parent, [x * S, y * S, 2 * S, S], { ...p.good, a: 0 }));

    // ---- The upper-deck door: two steel halves (art/menu_door.py) slide into the jambs ----
    // Draw order: the halves, then the painting's frame around the opening (so they vanish into
    // the walls), then the railing in front, then the lamp above.
    const halfW = DOOR_HALF * S;
    const doorTop = DOOR.y0 * S;
    const doorH = (DOOR.y1 - DOOR.y0) * S;
    const leftHalf = ui.image(parent, [DOOR.x0 * S, doorTop, halfW, doorH], 'assets/textures/menu_door_left.png');
    const rightHalf = ui.image(parent, [DOOR.x1 * S - halfW, doorTop, halfW, doorH], 'assets/textures/menu_door_right.png');
    layer('door_frame', 1);
    layer('door_rail', 1);
    const doorLamp = ui.box(parent, [DOOR_LAMP[0] * S, DOOR_LAMP[1] * S, DOOR_LAMP[2] * S, DOOR_LAMP[3] * S], { ...ember, a: 0 });
    /** The scene's right edge: the right half is cut off there, so it never shows past the painting on wide windows. */
    const SCENE_RIGHT = 1280;
    function drawDoor(openness: number): void {
        const shift = Math.round((halfW - S) * openness);
        motion.set(leftHalf, DOOR.x0 * S - shift, doorTop);
        const x = DOOR.x1 * S - halfW + shift;
        const visible = Math.max(0, Math.min(halfW, SCENE_RIGHT - x));
        ui.world.update(rightHalf, UINode, node => {
            node.insetLeft = px(x); node.insetTop = px(doorTop); node.width = px(visible);
        });
        // Show only the texture's left part, so the half is cut off rather than squeezed.
        ui.world.update(rightHalf, UIVisual, visual => {
            visual.uvOffset = { x: 0, y: 0 };
            visual.uvScale = { x: visible / halfW, y: 1 };
        });
    }
    let doorPhase: 'closed' | 'opening' | 'open' | 'closing' = 'closed';
    let doorAt = Date.now() + 4000;
    drawDoor(0);

    const particles: Particle[] = [];
    function spawn(x: number, y: number, vx: number, vy: number, life: number, size: number, color: Color, grow = 0): void {
        const entity = ui.box(parent, [Math.round(x), Math.round(y), size, size], color);
        particles.push({ entity, x, y, vx, vy, born: Date.now(), life, size, grow, color });
    }
    const start = Date.now();
    let nextMote = start;
    let nextDrop = start + 400;
    let nextEmber = start;
    let nextLeak = start + 1500;
    const nextSteam = STEAM.map((_, i) => start + 800 + i * 900);
    let last = start;

    return () => {
        const now = Date.now();
        const dt = Math.min(100, now - last);
        last = now;
        const t = now / 1000;
        const wave = (speed: number, phase = 0) => 0.5 + 0.5 * Math.sin(t * speed + phase);

        ui.fill(grow, white(0.15 + 0.35 * wave(1.3)));
        ui.fill(leaves, white(0.05 + 0.2 * wave(0.6, 1)));
        // The generator hums in short bursts: it rises a pixel and settles, a few times a second.
        const humming = now % 2600 < 700;
        motion.set(generator, 0, humming && Math.floor(now / 70) % 2 === 0 ? -1 : 0);

        // The door: closed for a while, slides open, stays open, slides shut.
        const since = now - doorAt;
        if (doorPhase === 'closed' && since >= 0) { doorPhase = 'opening'; doorAt = now; }
        else if (doorPhase === 'opening') {
            const k = Math.min(1, since / DOOR_MS.move);
            drawDoor(k * k * (3 - 2 * k));
            if (k >= 1) { doorPhase = 'open'; doorAt = now; }
        } else if (doorPhase === 'open' && since >= DOOR_MS.open) { doorPhase = 'closing'; doorAt = now; }
        else if (doorPhase === 'closing') {
            const k = Math.min(1, since / DOOR_MS.move);
            drawDoor(1 - k * k * (3 - 2 * k));
            if (k >= 1) { doorPhase = 'closed'; doorAt = now + 6000 + Math.random() * 6000; }
        }
        const moving = doorPhase === 'opening' || doorPhase === 'closing';
        ui.fill(doorLamp, { ...ember, a: moving ? 0.55 + 0.3 * wave(12) : doorPhase === 'open' ? 0.35 : 0 });
        ui.fill(lamps, white(0.15 + 0.15 * wave(0.4) + (Math.random() < 0.01 ? -0.15 : 0)));
        // Vent fire: two layered waves plus noise, so it never looks like a clean pulse.
        vents.forEach((vent, i) => ui.fill(vent, white(0.2 + 0.25 * wave(7.3, i * 2) + 0.15 * wave(17.1, i) + 0.15 * Math.random())));
        ui.fill(indicator, { ...ember, a: 0.25 + 0.5 * wave(2.2) });
        panels.forEach((panel, i) => ui.fill(panel, { ...(i % 2 ? p.amber : p.good), a: (Math.floor(t * (0.7 + i * 0.4)) + i) % 3 === 0 ? 0 : 0.9 }));

        if (now >= nextMote) {
            nextMote = now + 250 + Math.random() * 300;
            const [x0, x1, top] = PLANT_ROWS[Math.floor(Math.random() * PLANT_ROWS.length)]!;
            spawn((x0 + Math.random() * (x1 - x0)) * S, top * S, (Math.random() - 0.5) * 8, -10 - Math.random() * 10, 2400, 2,
                { r: 0.78, g: 1, b: 0.6, a: 0.85 });
        }
        if (now >= nextDrop) {
            nextDrop = now + 150 + Math.random() * 300;
            const drip = DRIPS[Math.floor(Math.random() * DRIPS.length)]!;
            const [x0, x1] = BAYS[Math.floor(Math.random() * BAYS.length)]!;
            const speed = 70;
            spawn((x0 + Math.random() * (x1 - x0)) * S, drip.y * S, 0, speed, ((drip.to - drip.y) * S * 1000) / speed, 2,
                { r: 0.55, g: 0.85, b: 1, a: 0.9 });
        }
        if (now >= nextEmber) {
            nextEmber = now + 180 + Math.random() * 260;
            const [x0, x1, top] = VENT_TOPS[Math.floor(Math.random() * VENT_TOPS.length)]!;
            spawn((x0 + Math.random() * (x1 - x0)) * S, top * S, (Math.random() - 0.5) * 14, -16 - Math.random() * 14, 900 + Math.random() * 600, 2,
                { r: 1, g: 0.6 + Math.random() * 0.3, b: 0.2, a: 0.95 });
        }
        if (now >= nextLeak) {
            nextLeak = now + 900 + Math.random() * 900;
            spawn(LEAK.x * S, LEAK.y * S, 0, 80, ((LEAK.floor - LEAK.y) * S * 1000) / 80, 2, { r: 0.6, g: 0.85, b: 1, a: 0.85 });
        }
        STEAM.forEach(([x, y, every], i) => {
            if (now < nextSteam[i]!) return;
            nextSteam[i] = now + every * (0.7 + Math.random() * 0.6);
            for (let k = 0; k < 6; k++) {
                spawn(x * S + (Math.random() - 0.5) * 6, y * S - k * 2, (Math.random() - 0.5) * 10, -12 - Math.random() * 12,
                    1400 + k * 160, 3, { r: 0.86, g: 0.86, b: 0.92, a: 0.4 }, 6);
            }
        });

        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i]!;
            const age = now - particle.born;
            if (age >= particle.life || !ui.world.valid(particle.entity)) {
                if (ui.world.valid(particle.entity)) ui.world.despawn(particle.entity);
                particles.splice(i, 1);
                continue;
            }
            particle.x += (particle.vx * dt) / 1000;
            particle.y += (particle.vy * dt) / 1000;
            const progress = age / particle.life;
            // Steam swells as it rises (centred on its path); motes and drops keep their size.
            const size = Math.round(particle.size + particle.grow * progress);
            const offset = (size - particle.size) / 2;
            ui.world.update(particle.entity, UINode, node => {
                node.insetLeft = px(Math.round(particle.x - offset)); node.insetTop = px(Math.round(particle.y - offset));
                node.width = px(size); node.height = px(size);
            });
            ui.fill(particle.entity, { ...particle.color, a: particle.color.a * (1 - progress) });
        }
    };
}
