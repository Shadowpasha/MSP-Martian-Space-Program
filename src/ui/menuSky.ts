// The main menu window: drifting clouds, faint stars, a shuttle and shooting stars. All layers are
// cut from the painting (art/menu_sky.py), shown at 2×.
//
// Draw order, back to front: the clear sky (clouds smoothed away, sun kept), twinkling stars,
// the painting's clouds above the sun swaying gently left and right, a shuttle light crossing high up, shooting stars every
// couple of seconds, then the window's front (bars, wall, mountains, dish, dome, ground).
//
// With Reduced Motion only the still layers are drawn (the painting looks unchanged).
import type { Color, Entity } from 'esengine';
import type { FlightUi } from './flightUi';
import type { Motion } from './motion';

const S = 2;
const FULL: [number, number, number, number] = [0, 0, 1280, 720];
/** The cloud strip (art/menu_sky.py): the sky above the sun, in painting pixels. */
const CLOUDS = { x: 165, y: 28, w: 475, h: 32 };
const CLOUD_SWAY = 2;         // painting px either side of where the clouds were painted
const CLOUD_PERIOD = 60;      // seconds for one full sway, left and back
const CLOUD_BREATH = 11;      // seconds for one slow brighten-and-dim
/** Star field: the upper sky, painting pixels. */
const STAR_AREA = { x0: 172, x1: 636, y0: 31, y1: 62 };
const STAR_COUNT = 26;
/** Shooting stars that can be in the sky at the same time. */
const METEORS = 4;

export function mountMenuSky(ui: FlightUi, parent: Entity, motion: Motion): () => void {
    if (motion.reducedMotion) return () => {};
    const image = (ref: string, bounds = FULL) => ui.image(parent, bounds, ref);
    const white = (a: number): Color => ({ r: 1, g: 1, b: 1, a });

    image('assets/textures/menu_glow_sky_clear.png');
    // Stars: fixed spots, each with its own twinkle.
    const stars = Array.from({ length: STAR_COUNT }, (_, i) => {
        const x = STAR_AREA.x0 + ((i * 97) % (STAR_AREA.x1 - STAR_AREA.x0));
        const y = STAR_AREA.y0 + ((i * 53) % (STAR_AREA.y1 - STAR_AREA.y0));
        return { box: ui.box(parent, [x * S, y * S, S, S], white(0)), phase: i * 1.9, speed: 0.8 + (i % 5) * 0.35 };
    });
    // The clouds above the sun, cut from the painting, swaying around their painted spots.
    const clouds = [0, 1].map(() => image('assets/textures/menu_sky_clouds.png', [CLOUDS.x * S, CLOUDS.y * S, CLOUDS.w * S, CLOUDS.h * S]));
    // A shuttle high up: a blinking light with a short trail.
    const shuttle = ui.box(parent, [0, 0, S, S], white(0));
    const trail = ui.box(parent, [0, 0, 6 * S, 1], white(0));
    // A shooting star: a short bright streak.
    // Shooting stars: a few at once, each a short streak of fading dots.
    const meteors = Array.from({ length: METEORS }, () => ({
        dots: Array.from({ length: 5 }, () => ui.box(parent, [0, 0, S, S], white(0))),
        started: -1e9, x: 0, y: 0, dx: 0, dy: 0, ms: 500,
    }));
    image('assets/textures/menu_glow_window_front.png');

    const start = Date.now();
    let meteorAt = start + 1200;
    return () => {
        const now = Date.now();
        const t = (now - start) / 1000;

        stars.forEach(star => ui.fill(star.box, white(0.15 + 0.4 * (0.5 + 0.5 * Math.sin(t * star.speed + star.phase)))));

        // The clouds sway slowly around where they were painted, eased like a breath. Sub-pixel
        // motion: the main copy sits on whole screen pixels and a second copy one pixel ahead fades
        // in with the fraction, so they glide instead of stepping. The strip has empty margins,
        // so it never needs cutting at the window's edges.
        const offset = Math.sin(t * (Math.PI * 2) / CLOUD_PERIOD) * CLOUD_SWAY * S;
        const whole = Math.floor(offset);
        const fraction = offset - whole;
        motion.set(clouds[0]!, CLOUDS.x * S + whole, CLOUDS.y * S);
        motion.set(clouds[1]!, CLOUDS.x * S + whole + 1, CLOUDS.y * S);
        // They also breathe: a slow brightening and dimming, like the sunset light changing.
        const breath = 0.88 + 0.12 * Math.sin(t * (Math.PI * 2) / CLOUD_BREATH);
        ui.fill(clouds[0]!, white(breath));
        ui.fill(clouds[1]!, white(fraction * breath));

        // The shuttle crosses right to left over 40 s, then waits 20 s.
        const lap = t % 60;
        const flying = lap < 40;
        const sx = STAR_AREA.x1 - (lap / 40) * (STAR_AREA.x1 - STAR_AREA.x0);
        const sy = STAR_AREA.y0 + 6 + Math.sin(lap / 6) * 2;
        motion.set(shuttle, Math.round(sx * S), Math.round(sy * S));
        motion.set(trail, Math.round((sx + 1) * S), Math.round(sy * S + 1));
        ui.fill(shuttle, flying ? (Math.floor(t * 2) % 2 ? { r: 1, g: 0.3, b: 0.3, a: 1 } : white(1)) : white(0));
        ui.fill(trail, white(flying ? 0.25 : 0));

        // A shooting star every 6–12 s: falls down-left across the upper sky in 0.5 s.
        // A new shooting star every 1.5-4 s, on whichever streak is free; each has its own
        // length, angle and speed, falling down-left across the upper sky.
        if (now >= meteorAt) {
            meteorAt = now + 1500 + Math.random() * 2500;
            const free = meteors.find(m => now - m.started > m.ms);
            if (free) {
                free.started = now;
                free.x = STAR_AREA.x0 + 60 + Math.random() * 380;
                free.y = STAR_AREA.y0 + Math.random() * 14;
                free.dx = -(26 + Math.random() * 28);
                free.dy = 10 + Math.random() * 12;
                free.ms = 380 + Math.random() * 320;
            }
        }
        for (const m of meteors) {
            const age = now - m.started;
            m.dots.forEach((dot, i) => {
                const k = age / m.ms - i * 0.06;
                const visible = k >= 0 && k <= 1;
                motion.set(dot, Math.round((m.x + k * m.dx) * S), Math.round((m.y + k * m.dy) * S));
                ui.fill(dot, white(visible ? (1 - k) * (1 - i * 0.18) : 0));
            });
        }

    };
}
