// Ambience for the expedition backgrounds (the station cutaway and Site A): the same ideas as the
// main menu, driven by a small config per scene. Every layer is cut from the painting by
// art/run_ambience.py, so glows have the exact shape of what glows. Positions are painting
// pixels (640×360), drawn at 2×.
//
// Each scene can have: clouds above the sun that sway and breathe over a clear sky (window bars
// redrawn on top), faint twinkling stars, shooting stars, glow layers that breathe / hum /
// flicker / blink, particle emitters (plant motes, water drips, embers, steam, blowing dust,
// exhaust, dust devils), a crane that travels its beam, screens with live data, lockers that
// open and close, an idling vehicle and spinning anemometer cups.
// With Reduced Motion only the painting is shown.
import { px, UINode, type Color, type Entity } from 'esengine';
import type { FlightUi } from './flightUi';
import type { Motion } from './motion';

const S = 2;
const FULL: [number, number, number, number] = [0, 0, 1280, 720];

type Pulse = 'breathe' | 'hum' | 'flicker' | 'blink';
type Area = readonly [x0: number, y0: number, x1: number, y1: number];
type Emitter =
    | { kind: 'mote'; area: Area; every: number }
    | { kind: 'drip'; from: Area; to: number; every: number }
    | { kind: 'ember'; area: Area; every: number }
    | { kind: 'steam'; at: readonly [number, number]; every: number }
    | { kind: 'dust'; area: Area; every: number }
    | { kind: 'exhaust'; at: readonly [number, number]; every: number }
    | { kind: 'devil'; area: Area; every: number };
type ScreenKind = 'graph' | 'bars' | 'readout';

export interface SceneAmbience {
    /** Layer files are assets/textures/run_<scene>_<name>.png. */
    scene: 'station' | 'site';
    /** The cloud strip's left edge, top and size (painting px), as art/run_ambience.py printed it. */
    clouds?: { x: number; y: number; w: number; h: number };
    stars?: Area;
    meteors?: boolean;
    glows: { name: string; pulse: Pulse; strength?: number; speed?: number }[];
    emitters: Emitter[];
    /** A crane trolley and hook (layers crane + crane_hole) that travels along its beam by dx painting px. */
    crane?: { range: readonly [number, number] };
    /** Monitor screens that show live data (painting px). */
    screens?: { area: Area; kind: ScreenKind }[];
    /** Lockers whose doors (layer locker<n>, hinged on the left) swing open now and then. */
    lockers?: { area: Area }[];
    /** A copy layer that idles like a running engine (a tiny shake). */
    rumble?: string;
    /** Spinning cups (an anemometer): the painted cups are covered (layer cups_hole) and copies of
     * one cup (layer cup, w x h painting px) orbit the hub on arms. */
    spinner?: { cx: number; cy: number; rx: number; ry: number; cup: readonly [number, number] };
}

interface Particle {
    entity: Entity; x: number; y: number; vx: number; vy: number; born: number; life: number; size: number; grow: number; color: Color;
    /** Dust devils: the particle circles a rising centre. */
    swirl?: { cx: number; angle: number; spin: number; radius: number };
}

const white = (a: number): Color => ({ r: 1, g: 1, b: 1, a });
const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);

/** Draws the scene's background and its ambience into `parent`; returns the per-frame tick. */
export function mountSceneAmbience(ui: FlightUi, parent: Entity, motion: Motion, background: string, config: SceneAmbience): () => void {
    ui.image(parent, FULL, background);
    if (motion.reducedMotion) return () => {};
    const layer = (name: string, alpha = 0) => ui.image(parent, FULL, `assets/textures/run_${config.scene}_${name}.png`, white(alpha));

    // ---- Sky: clear sky behind the clouds, stars, the clouds, shooting stars, then the bars ----
    let clouds: Entity[] = [];
    if (config.clouds) {
        const c = config.clouds;
        layer('sky_clear', 1);
        clouds = [0, 1].map(() => ui.image(parent, [c.x * S, c.y * S, c.w * S, c.h * S], `assets/textures/run_${config.scene}_clouds.png`));
    }
    const stars = config.stars ? Array.from({ length: 22 }, (_, i) => {
        const [x0, y0, x1, y1] = config.stars!;
        const x = x0 + ((i * 97) % (x1 - x0));
        const y = y0 + ((i * 53) % Math.max(1, y1 - y0));
        return { box: ui.box(parent, [x * S, y * S, S, S], white(0)), phase: i * 1.9, speed: 0.8 + (i % 5) * 0.35 };
    }) : [];
    const meteors = config.meteors && config.stars ? Array.from({ length: 3 }, () => ({
        dots: Array.from({ length: 5 }, () => ui.box(parent, [0, 0, S, S], white(0))),
        started: -1e9, x: 0, y: 0, dx: 0, dy: 0, ms: 500,
    })) : [];
    if (config.clouds) layer('front', 1);

    // Moving copies: the crane over its fill, the idling rover.
    let crane: Entity | null = null;
    if (config.crane) { layer('crane_hole', 1); crane = layer('crane', 1); }
    const rumble = config.rumble ? layer(config.rumble, 1) : null;

    const glows = config.glows.map(glow => ({ ...glow, entity: layer(glow.name), phase: Math.random() * 6 }));

    // Screens: drawn over the painted screens in bright cyan.
    const ink: Color = { r: 0.62, g: 1, b: 1, a: 0.85 };
    const screens = (config.screens ?? []).map(screen => {
        const [x0, y0, x1, y1] = screen.area;
        const w = x1 - x0, h = y1 - y0;
        const count = screen.kind === 'graph' ? w : screen.kind === 'bars' ? Math.max(3, Math.floor(w / 3)) : Math.max(1, h >> 1);
        const marks = Array.from({ length: count }, () => ui.box(parent, [0, 0, 0, 0], ink));
        return { ...screen, x0, y0, w, h, marks, phase: Math.random() * 10 };
    });
    // Lockers: a dark inside with shelves and a few things, behind a door that swings.
    const lockers = (config.lockers ?? []).map((locker, i) => {
        const [x0, y0, x1, y1] = locker.area;
        const w = x1 - x0, h = y1 - y0;
        const inside = ui.group(parent, [x0 * S, y0 * S, w * S, h * S]);
        const shelfA = Math.round(h * 0.38) * S, shelfB = Math.round(h * 0.7) * S;
        ui.box(inside, [0, 0, w * S, h * S], { r: 0.07, g: 0.07, b: 0.11, a: 1 });
        ui.box(inside, [2, shelfA, w * S - 4, S], { r: 0.35, g: 0.3, b: 0.27, a: 1 });
        ui.box(inside, [2, shelfB, w * S - 4, S], { r: 0.35, g: 0.3, b: 0.27, a: 1 });
        ui.box(inside, [4, shelfA - 14, 8, 14], { r: 0.85, g: 0.45, b: 0.18, a: 1 });
        ui.box(inside, [w * S - 14, shelfA - 10, 8, 10], { r: 0.6, g: 0.65, b: 0.7, a: 1 });
        ui.box(inside, [6, shelfB - 18, w * S - 12, 18], { r: 0.42, g: 0.48, b: 0.38, a: 1 });
        ui.show(inside, false);
        const door = ui.image(parent, [x0 * S, y0 * S, w * S, h * S], 'assets/textures/run_' + config.scene + '_locker' + (i + 1) + '.png');
        return { w, inside, door, phase: 'closed' as 'closed' | 'opening' | 'open' | 'closing', at: Date.now() + rand(4000, 12000) };
    });
    if (config.spinner) layer('cups_hole', 1);
    const cups = config.spinner ? [0, 1, 2].map(() => {
        const [cw, ch] = config.spinner!.cup;
        const arm = ui.box(parent, [0, 0, 0, S], { r: 0.16, g: 0.14, b: 0.18, a: 1 });
        const sprite = ui.image(parent, [0, 0, cw * S, ch * S], 'assets/textures/run_' + config.scene + '_cup.png');
        return { arm, sprite };
    }) : [];
    let craneX = 0;
    let craneTarget = 0;
    let craneWait = Date.now() + 2500;
    const particles: Particle[] = [];
    function spawn(x: number, y: number, vx: number, vy: number, life: number, size: number, color: Color, grow = 0): void {
        particles.push({ entity: ui.box(parent, [Math.round(x), Math.round(y), size, size], color), x, y, vx, vy, born: Date.now(), life, size, grow, color });
    }
    const start = Date.now();
    const next = config.emitters.map((_, i) => start + 400 + i * 350);
    let meteorAt = start + 1500;
    let last = start;

    return () => {
        const now = Date.now();
        const dt = Math.min(100, now - last);
        last = now;
        const t = (now - start) / 1000;
        const wave = (speed: number, phase = 0) => 0.5 + 0.5 * Math.sin(t * speed + phase);

        // Clouds: a slow 60 s sway of 2 painting px each way, glided with a sub-pixel second copy,
        // and an 11 s breath.
        if (config.clouds && clouds.length) {
            const c = config.clouds;
            const offset = Math.sin((t * Math.PI * 2) / 60) * 2 * S;
            const whole = Math.floor(offset);
            const breath = 0.88 + 0.12 * Math.sin((t * Math.PI * 2) / 11);
            motion.set(clouds[0]!, c.x * S + whole, c.y * S);
            motion.set(clouds[1]!, c.x * S + whole + 1, c.y * S);
            ui.fill(clouds[0]!, white(breath));
            ui.fill(clouds[1]!, white((offset - whole) * breath));
        }
        stars.forEach(star => ui.fill(star.box, white(0.12 + 0.35 * wave(star.speed, star.phase))));
        if (meteors.length && now >= meteorAt) {
            meteorAt = now + 2000 + Math.random() * 3500;
            const free = meteors.find(m => now - m.started > m.ms);
            const [x0, y0, x1, y1] = config.stars!;
            if (free) Object.assign(free, { started: now, x: rand(x0 + 40, x1), y: rand(y0, y0 + (y1 - y0) / 2), dx: -rand(24, 50), dy: rand(8, 20), ms: rand(380, 700) });
        }
        for (const m of meteors) {
            const age = now - m.started;
            m.dots.forEach((dot, i) => {
                const k = age / m.ms - i * 0.06;
                motion.set(dot, Math.round((m.x + k * m.dx) * S), Math.round((m.y + k * m.dy) * S));
                ui.fill(dot, white(k >= 0 && k <= 1 ? (1 - k) * (1 - i * 0.18) : 0));
            });
        }

        for (const glow of glows) {
            const strength = glow.strength ?? 0.4;
            const speed = glow.speed ?? 1;
            const level = glow.pulse === 'breathe' ? 0.25 + 0.75 * wave(1.2 * speed, glow.phase)
                : glow.pulse === 'hum' ? 0.6 + 0.3 * wave(0.5 * speed, glow.phase) + (Math.random() < 0.006 ? -0.5 : 0)
                    : glow.pulse === 'flicker' ? 0.4 + 0.3 * wave(7.3 * speed, glow.phase) + 0.2 * wave(17 * speed) + 0.1 * Math.random()
                        : (Math.floor(t * speed * 1.2 + glow.phase) % 2 === 0 ? 1 : 0.1);
            ui.fill(glow.entity, white(Math.max(0, Math.min(1, level * strength))));
        }

        // Crane: rolls to a new spot along the beam, waits, rolls on.
        if (crane && config.crane) {
            if (now >= craneWait) {
                const step = (6 * dt) / 1000;
                if (Math.abs(craneTarget - craneX) <= step) {
                    craneX = craneTarget;
                    craneWait = now + rand(3000, 7000);
                    craneTarget = rand(config.crane.range[0], config.crane.range[1]);
                } else craneX += Math.sign(craneTarget - craneX) * step;
            }
            motion.set(crane, Math.round(craneX * S), 0);
        }
        // Engine idle: the car lifts a screen pixel for a short beat about every 0.7 s (the engine's
        // pulse), then rests. Calm, not a constant jitter.
        if (rumble) motion.set(rumble, 0, now % 700 < 90 ? -1 : 0);
        // Anemometer: three cups on arms circling the hub (seen from the side, so they swing left and
        // right; the ones behind the hub are dimmer).
        if (config.spinner) {
            const { cx, cy, rx, ry, cup: [cw, ch] } = config.spinner;
            cups.forEach(({ arm, sprite }, i) => {
                const angle = t * Math.PI * 2 * 0.9 + (i * Math.PI * 2) / 3;
                const x = cx + Math.cos(angle) * rx;
                const y = cy + Math.sin(angle) * ry;
                const behind = Math.sin(angle) < 0;
                ui.world.update(arm, UINode, node => {
                    node.insetLeft = px(Math.round(Math.min(cx, x) * S)); node.insetTop = px(Math.round(y * S));
                    node.width = px(Math.round(Math.abs(x - cx) * S));
                });
                motion.set(sprite, Math.round((x - cw / 2) * S), Math.round((y - ch / 2) * S));
                // Behind the hub a cup is shaded darker, never see-through.
                ui.fill(sprite, behind ? { r: 0.72, g: 0.7, b: 0.76, a: 1 } : white(1));
            });
        }
        // Screens: a scrolling line graph, bars that rise and fall, or lines of readout blinking in.
        for (const screen of screens) {
            const k = t * 2 + screen.phase;
            screen.marks.forEach((mark, i) => {
                let x = screen.x0, y = screen.y0, w = 1, h = 1;
                if (screen.kind === 'graph') {
                    const v = 0.5 + 0.3 * Math.sin(k * 1.3 + i * 0.5) + 0.15 * Math.sin(k * 3.1 + i * 1.7);
                    x = screen.x0 + i;
                    y = screen.y0 + Math.round((1 - v) * (screen.h - 1));
                } else if (screen.kind === 'bars') {
                    const v = 0.25 + 0.7 * (0.5 + 0.5 * Math.sin(k * (0.8 + i * 0.37) + i));
                    h = Math.max(1, Math.round(v * (screen.h - 1)));
                    x = screen.x0 + 1 + i * 3;
                    y = screen.y0 + screen.h - h;
                    w = 2;
                } else {
                    const on = Math.floor(k * 1.5 + i) % 5 !== 0;
                    w = on ? Math.floor((0.3 + 0.7 * ((Math.sin(k * 0.7 + i * 2.3) + 1) / 2)) * (screen.w - 2)) : 0;
                    x = screen.x0;
                    y = Math.min(screen.y0 + screen.h - 1, screen.y0 + i * 2);
                }
                ui.world.update(mark, UINode, node => {
                    node.insetLeft = px(x * S); node.insetTop = px(y * S); node.width = px(w * S); node.height = px(h * S);
                });
            });
        }
        // Lockers: shut for a while, swing open (the door squeezes toward its hinge), stay open, swing shut.
        for (const locker of lockers) {
            const since = now - locker.at;
            let open = locker.phase === 'open' ? 1 : 0;
            if (locker.phase === 'closed' && since >= 0) { locker.phase = 'opening'; locker.at = now; }
            else if (locker.phase === 'opening') {
                open = Math.min(1, since / 700);
                if (open >= 1) { locker.phase = 'open'; locker.at = now + rand(2000, 4000); }
            } else if (locker.phase === 'open' && since >= 0) { locker.phase = 'closing'; locker.at = now; }
            else if (locker.phase === 'closing') {
                open = 1 - Math.min(1, since / 700);
                if (open <= 0) { locker.phase = 'closed'; locker.at = now + rand(8000, 16000); }
            }
            const eased = open * open * (3 - 2 * open);
            ui.show(locker.inside, eased > 0);
            ui.world.update(locker.door, UINode, node => { node.width = px(Math.max(S, Math.round(locker.w * S * (1 - 0.82 * eased)))); });
        }

        config.emitters.forEach((emitter, i) => {
            if (now < next[i]!) return;
            next[i] = now + emitter.every * rand(0.6, 1.4);
            if (emitter.kind === 'mote') {
                const [x0, y0, x1] = emitter.area;
                spawn(rand(x0, x1) * S, y0 * S, rand(-4, 4), rand(-20, -10), 2400, 2, { r: 0.78, g: 1, b: 0.6, a: 0.85 });
            } else if (emitter.kind === 'drip') {
                const [x0, y0, x1] = emitter.from;
                spawn(rand(x0, x1) * S, y0 * S, 0, 70, ((emitter.to - y0) * S * 1000) / 70, 2, { r: 0.55, g: 0.85, b: 1, a: 0.9 });
            } else if (emitter.kind === 'ember') {
                const [x0, y0, x1] = emitter.area;
                spawn(rand(x0, x1) * S, y0 * S, rand(-7, 7), rand(-30, -16), rand(900, 1500), 2, { r: 1, g: rand(0.6, 0.9), b: 0.2, a: 0.95 });
            } else if (emitter.kind === 'steam') {
                for (let k = 0; k < 5; k++) {
                    spawn(emitter.at[0] * S + rand(-3, 3), emitter.at[1] * S - k * 2, rand(-5, 5), rand(-24, -12), 1300 + k * 160, 3,
                        { r: 0.85, g: 0.85, b: 0.9, a: 0.4 }, 6);
                }
            } else if (emitter.kind === 'exhaust') {
                // A puff of exhaust from the tail pipe, blown out backward (away from the car) and
                // drifting up a little, swelling as it thins out. Light grey so it reads on the dusk.
                for (let k = 0; k < 5; k++) {
                    const shade = rand(0.62, 0.78);
                    spawn(emitter.at[0] * S + rand(-2, 1), emitter.at[1] * S + rand(-2, 2), rand(-40, -24), rand(-10, -3), rand(1600, 2400), 4,
                        { r: shade, g: shade * 0.96, b: shade, a: 0.6 }, 13);
                }
            } else if (emitter.kind === 'devil') {
                // A dust devil: specks circling a centre that rises.
                const [x0, y0, x1, y1] = emitter.area;
                const cx = rand(x0, x1) * S, base = rand(y0, y1) * S;
                const color: Color = { r: 0.92, g: 0.7, b: 0.52, a: 0.55 };
                for (let k = 0; k < 26; k++) {
                    particles.push({
                        entity: ui.box(parent, [0, 0, 2, 2], { ...color, a: 0 }), x: cx, y: base - rand(0, 6), vx: 0, vy: rand(-22, -12),
                        born: now + k * 40, life: rand(2200, 3200), size: 2, grow: 0, color,
                        swirl: { cx, angle: rand(0, 6.3), spin: rand(5, 8), radius: rand(3, 6) },
                    });
                }
            } else {
                // Dust on the wind: a soft speck drifting right to left, low over the ground.
                const [, y0, x1, y1] = emitter.area;
                spawn(x1 * S, rand(y0, y1) * S, rand(-70, -40), rand(-4, 4), rand(5000, 9000), 2, { r: 0.95, g: 0.72, b: 0.55, a: 0.45 });
            }
        });

        for (let i = particles.length - 1; i >= 0; i--) {
            const particle = particles[i]!;
            const age = now - particle.born;
            if (age < 0) continue;
            if (age >= particle.life || !ui.world.valid(particle.entity)) {
                if (ui.world.valid(particle.entity)) ui.world.despawn(particle.entity);
                particles.splice(i, 1);
                continue;
            }
            particle.y += (particle.vy * dt) / 1000;
            if (particle.swirl) {
                // Circles a rising centre, widening as it climbs.
                const swirl = particle.swirl;
                swirl.angle += (swirl.spin * dt) / 1000;
                swirl.radius += (6 * dt) / 1000;
                particle.x = swirl.cx + Math.cos(swirl.angle) * swirl.radius * S;
            } else particle.x += (particle.vx * dt) / 1000;
            const progress = age / particle.life;
            const size = Math.round(particle.size + particle.grow * progress);
            const offset = (size - particle.size) / 2;
            ui.world.update(particle.entity, UINode, node => {
                node.insetLeft = px(Math.round(particle.x - offset)); node.insetTop = px(Math.round(particle.y - offset));
                node.width = px(size); node.height = px(size);
            });
            // Fade in over the first fifth (so dust does not pop in), out over the rest.
            const fade = Math.min(1, progress * 5) * (1 - progress);
            ui.fill(particle.entity, { ...particle.color, a: particle.color.a * fade });
        }
    };
}

/** The station cutaway (tharsis_station.png). */
export const STATION_AMBIENCE: SceneAmbience = {
    scene: 'station',
    clouds: { x: 5, y: 30, w: 630, h: 21 },
    stars: [12, 32, 630, 48],
    meteors: true,
    glows: [
        { name: 'dome', pulse: 'breathe', strength: 0.55, speed: 0.4 },
        { name: 'grow', pulse: 'breathe', strength: 0.5 },
        { name: 'leaves', pulse: 'breathe', strength: 0.25, speed: 0.5 },
        { name: 'lamps', pulse: 'hum', strength: 0.3 },
        { name: 'wall_lamps', pulse: 'hum', strength: 0.4, speed: 1.4 },
        { name: 'screens', pulse: 'flicker', strength: 0.35, speed: 0.15 },
        { name: 'rover_lights', pulse: 'breathe', strength: 0.5, speed: 0.6 },
        { name: 'vents', pulse: 'flicker', strength: 0.6 },
    ],
    emitters: [
        { kind: 'mote', area: [345, 170, 412, 0], every: 500 },
        { kind: 'mote', area: [345, 200, 412, 0], every: 600 },
        { kind: 'drip', from: [346, 186, 410, 0], to: 199, every: 450 },
        { kind: 'drip', from: [346, 215, 410, 0], to: 225, every: 550 },
        { kind: 'ember', area: [112, 320, 128, 0], every: 500 },
        { kind: 'ember', area: [267, 320, 283, 0], every: 550 },
        { kind: 'ember', area: [388, 320, 410, 0], every: 450 },
        { kind: 'ember', area: [585, 320, 601, 0], every: 600 },
        { kind: 'steam', at: [60, 327], every: 3800 },
        { kind: 'steam', at: [238, 321], every: 4600 },
        { kind: 'steam', at: [452, 327], every: 4200 },
        { kind: 'steam', at: [548, 327], every: 5200 },
    ],
    crane: { range: [-44, 30] },
    screens: [
        // The screens' glass, measured from the painting, one pixel inside its edge.
        { area: [255, 227, 276, 237], kind: 'graph' },
        { area: [295, 226, 305, 232], kind: 'readout' },
        { area: [453, 230, 462, 235], kind: 'bars' },
    ],
    lockers: [{ area: [500, 204, 516, 266] }, { area: [516, 204, 531, 266] }],
};

/** Site A (tharsis_site.png). */
export const SITE_AMBIENCE: SceneAmbience = {
    scene: 'site',
    clouds: { x: 0, y: 0, w: 640, h: 39 },
    stars: [10, 2, 630, 30],
    meteors: true,
    glows: [
        { name: 'dome', pulse: 'breathe', strength: 0.6, speed: 0.4 },
        { name: 'rover_lights', pulse: 'breathe', strength: 0.55, speed: 0.7 },
        { name: 'rover_roof', pulse: 'blink', strength: 0.6, speed: 0.8 },
        { name: 'beacon', pulse: 'blink', strength: 0.8, speed: 0.6 },
    ],
    emitters: [
        { kind: 'dust', area: [0, 200, 640, 260], every: 260 },
        { kind: 'dust', area: [0, 255, 640, 340], every: 220 },
        { kind: 'dust', area: [0, 150, 640, 205], every: 420 },
        { kind: 'exhaust', at: [367, 203], every: 380 },
        { kind: 'devil', area: [60, 150, 330, 200], every: 14000 },
    ],
    rumble: 'rover',
    spinner: { cx: 513, cy: 134, rx: 18, ry: 3, cup: [14, 16] },
};
