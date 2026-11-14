// Launch intro: the hype moment between "Launch Mission" and the survival run.
//
// A rocket trip, in the game's pixel style:
//   the launch pad at night: crew aboard on the left, the destination on the right
//   -> 3, 2, 1 (smoke puffs, engines light on 1) -> LIFT-OFF! (flash, rumble, shake)
//   -> the camera follows the rocket up: the pad drops away, stars streak past
//   -> Earth falls behind, the destination planet grows ahead, a progress bar fills
//   -> arrival: the planet fills the screen, the screen breaks into pixels, the run starts.
// About 5.5 seconds. A click, Space, Enter or Esc skips straight to the run. With Reduced Motion
// nothing moves, flashes or shakes: the pad scene shows with the countdown, then the run starts.
// Sprites come from scripts/art/launch_sprites.py.
import { Interactable, px, UINode, type Color, type Entity, type InputState } from 'esengine';
import type { MissionSetupInput } from '../contracts/gameContract';
import { play, vibrate } from './feedback';
import type { FlightUi } from './flightUi';
import { burst } from './fx';
import { easeInCubic, easeOutBack, easeOutCubic, type Motion } from './motion';
import { makeAbsBox } from './theme';

const W = 1280;
const H = 720;
const ART = 'assets/textures/launch/';
const SPACE: Color = { r: 0.04, g: 0.04, b: 0.1, a: 1 };
const GROUND: Color = { r: 0.23, g: 0.14, b: 0.2, a: 1 };
/** Sprites are drawn at 1x and shown at this scale, so their pixels stay square. */
const SCALE = 4;
const ROCKET = { x: 592, y: 408, w: 24 * SCALE, h: 48 * SCALE };

type Rect = [x: number, y: number, w: number, h: number];

export interface LaunchIntro {
    /** Run once per frame. */
    tick(input: InputState): void;
}

export function playLaunchIntro(
    ui: FlightUi, motion: Motion, setup: MissionSetupInput, missionImage: string | undefined, onDone: () => void,
): LaunchIntro {
    const p = ui.palette;
    const world = ui.world;
    const reduced = motion.reducedMotion;
    const start = Date.now();
    const steps: Array<{ at: number; run: () => void }> = [];
    const at = (ms: number, run: () => void) => steps.push({ at: ms, run });
    let finished = false;
    const finish = () => {
        if (finished) return;
        finished = true;
        onDone();
    };
    const destination = setup.planet === 'moon' ? 'moon' : 'mars';
    const destinationName = destination === 'moon' ? 'THE MOON' : 'MARS';
    const goal = setup.missionGoal;

    // Sizes and positions that change over time (planets growing), eased frame by frame.
    const sizeTweens: Array<{ entity: Entity; from: Rect; to: Rect; at: number; ms: number; ease: (t: number) => number }> = [];
    const setRect = (entity: Entity, [x, y, w, h]: Rect) => {
        if (!world.valid(entity)) return;
        world.update(entity, UINode, node => {
            node.insetLeft = px(Math.round(x)); node.insetTop = px(Math.round(y));
            node.width = px(Math.round(w)); node.height = px(Math.round(h));
        });
    };
    const resize = (entity: Entity, from: Rect, to: Rect, ms: number, ease = easeOutCubic) => {
        if (reduced) { setRect(entity, to); return; }
        setRect(entity, from);
        sizeTweens.push({ entity, from, to, at: Date.now(), ms, ease });
    };

    // ---- Stage: one full-screen layer on top of the page; a press anywhere skips ----
    const stage = makeAbsBox(world, ui.root, 0, 0, W, H, SPACE, false);
    world.insert(stage, Interactable, { enabled: true, blockRaycast: true, raycastTarget: true });
    ui.on(stage, 'press', finish);
    if (!reduced) motion.enter(stage, 0, 0, { dy: -H, duration: 260, ease: easeOutCubic });

    // Fixed stars, then the streaks used once the rocket is moving.
    for (let i = 0; i < 60; i++) {
        const size = i % 7 === 0 ? 3 : 2;
        ui.box(stage, [(i * 211) % W, (i * 137) % 600, size, size], { ...p.white, a: 0.25 + (i % 4) * 0.15 });
    }
    const startStreaks = () => {
        if (reduced) return;
        for (let i = 0; i < 26; i++) {
            const x = (i * 97 + 31) % W;
            const length = 24 + (i % 5) * 18;
            const speed = 0.9 + (i % 4) * 0.35;
            const streak = ui.box(stage, [x, -length, 2, length], { ...p.white, a: 0.3 + (i % 3) * 0.2 });
            motion.path(streak, ms => [x, ((ms * speed + i * 173) % (H + length)) - length]);
        }
    };

    // Earth below and the destination ahead (sizes animate during the trip).
    const earth = ui.image(stage, [140, H + 40, 320, 320], `${ART}launch_planet_earth_64.png`);
    const target = ui.image(stage, [900, -100, 48, 48], `${ART}launch_planet_${destination}_64.png`);

    // ---- The pad: ground, tower, and the two info panels (all drop away at lift-off) ----
    const pad = ui.group(stage, [0, 0, W, H]);
    ui.box(pad, [0, 600, W, 120], GROUND);
    ui.box(pad, [0, 600, W, 3], { ...p.rust, a: 1 });
    for (let x = 520; x <= 548; x += 28) ui.box(pad, [x, 330, 6, 270], p.edge);
    for (let y = 340; y < 600; y += 30) ui.box(pad, [520, y, 34, 4], p.edge);
    ui.box(pad, [554, 400, 40, 4], p.edge);
    ui.box(pad, [560, 594, 160, 10], p.bevel);
    const smokeAt = () => burst(ui, motion, pad, 640, 596, {
        colors: [p.secondary, p.muted, p.bevel], count: 10, speed: 0.12, gravity: 0.00012, life: 700, size: 6, upward: true,
    });

    const panel = (x: number, y: number, w: number, h: number, title: string) => {
        const holder = ui.group(pad, [x, y, w, h]);
        ui.box(holder, [0, 0, w, h], { ...p.ink, a: 0.85 });
        ui.box(holder, [0, 0, w, 3], p.amber);
        ui.label(holder, [14, 8, w - 28, 26], title, { display: true, size: 18, color: p.amber });
        return holder;
    };
    const crewPanel = panel(32, 150, 300, 360, 'CREW ABOARD');
    const crewRows = setup.crew.slice(0, 4).map((member, i) => {
        const y = 44 + i * 78;
        const row = ui.group(crewPanel, [12, y, 276, 72]);
        ui.box(row, [0, 0, 60, 72], SPACE);
        ui.image(row, [2, 2, 56, 68], member.portraitPath);
        ui.label(row, [70, 10, 204, 26], member.name, { display: true, size: 17, fit: 12 });
        ui.label(row, [70, 38, 204, 20], member.role.toUpperCase(), { size: 12, color: p.cyan });
        ui.show(row, false);
        return { row, y };
    });
    const missionPanel = panel(948, 150, 300, 300, 'DESTINATION');
    ui.image(missionPanel, [12, 42, 276, 150], missionImage ?? 'assets/textures/mission_1.png');
    ui.label(missionPanel, [12, 200, 276, 52], goal.title, { display: true, size: 20, fit: 13, wrap: true, center: true });
    ui.label(missionPanel, [12, 258, 276, 24], `${destinationName} · DEADLINE SOL ${goal.deadlineSol}`, { size: 13, color: p.amber, center: true });

    // ---- The rocket: body plus two flame frames that flicker ----
    const rocket = ui.group(stage, [ROCKET.x, ROCKET.y, ROCKET.w, ROCKET.h + 64]);
    const flames = [
        ui.image(rocket, [24, 176, 48, 64], `${ART}launch_flame_a_12x16.png`),
        ui.image(rocket, [24, 176, 48, 64], `${ART}launch_flame_b_12x16.png`),
    ];
    flames.forEach(f => ui.show(f, false));
    ui.image(rocket, [0, 0, ROCKET.w, ROCKET.h], `${ART}launch_rocket_24x48.png`);
    let burning = false;

    // ---- Banner, countdown, travel progress ----
    const banner = ui.group(stage, [0, 24, W, 44]);
    ui.box(banner, [0, 0, W, 44], { ...p.ink, a: 0.75 });
    const bannerText = ui.label(banner, [0, 0, W, 44], `LAUNCH SEQUENCE  ·  ${goal.title.toUpperCase()}`, {
        display: true, size: 20, fit: 13, color: p.text, center: true,
    });
    const countHolder = ui.group(stage, [440, 100, 400, 110]);
    ui.box(countHolder, [0, 0, 400, 110], { ...p.ink, a: 0.8 });
    const count = ui.label(countHolder, [0, 0, 400, 110], '', { display: true, size: 72, color: p.amber, center: true });
    ui.show(countHolder, false);

    // Trip progress (the banner says where to).
    const trip = ui.group(stage, [340, 640, 600, 50]);
    ui.box(trip, [0, 28, 600, 10], { ...p.ink, a: 0.9 });
    const tripFill = ui.box(trip, [0, 28, 0, 10], p.cyan);
    ui.show(trip, false);

    const hint = ui.label(stage, [0, 696, W, 20], 'Click to skip', { size: 12, color: { ...p.text, a: 0.6 }, center: true });

    // ---- Flash and the final pixel dissolve (on top) ----
    const flash = ui.box(stage, [0, 0, W, H], { ...p.white, a: 0 });
    const flashOnce = (strength = 0.8) => {
        if (reduced) return;
        ui.fill(flash, { ...p.white, a: strength });
        motion.after(70, () => ui.fill(flash, { ...p.white, a: strength * 0.45 }));
        motion.after(150, () => ui.fill(flash, { ...p.white, a: 0 }));
    };
    const dissolve = Array.from({ length: 16 * 9 }, (_, i) => {
        const cell = ui.box(stage, [(i % 16) * 80, Math.floor(i / 16) * 80, 80, 80], p.ink);
        ui.show(cell, false);
        return cell;
    });

    // ---- Timeline (ms from Launch) ----
    const r = (ms: number) => (reduced ? Math.min(ms, 400) : ms);
    at(0, () => {
        play('whoosh');
        if (!reduced) {
            motion.enter(crewPanel, 32, 150, { dx: -360, delay: 120, duration: 300, ease: easeOutBack });
            motion.enter(missionPanel, 948, 150, { dx: 360, delay: 200, duration: 300, ease: easeOutBack });
        }
    });
    crewRows.forEach(({ row, y }, i) => at(r(420 + i * 120), () => {
        ui.show(row, true);
        motion.hop(row, 12, y, 8);
        if (!reduced) play('thunk', 1.2 + i * 0.1);
    }));
    const countdown = (ms: number, text: string) => at(ms, () => {
        ui.show(countHolder, true);
        ui.setText(count, text);
        motion.hop(count, 0, 0, 14);
        play('count');
        smokeAt();
    });
    const base = reduced ? 500 : 1000;
    countdown(base, '3');
    countdown(base + 600, '2');
    countdown(base + 1200, '1');
    at(base + 1200, () => {
        // Engines light on "1".
        burning = true;
        play('launch');
        if (!reduced) motion.shake(rocket, ROCKET.x, ROCKET.y, 2, 600);
    });
    at(base + 1800, () => {
        ui.setText(count, 'LIFT-OFF!');
        motion.hop(count, 0, 0, 14);
        play('go');
        vibrate('long');
        flashOnce(0.7);
        if (reduced) return;
        smokeAt();
        motion.shake(stage, 0, 0, 6, 420);
        // The rocket climbs to the middle of the screen while the pad drops away below it.
        motion.leave(rocket, ROCKET.x, ROCKET.y, { dy: -190, duration: 900, ease: easeInCubic });
        motion.leave(pad, 0, 0, { dy: H + 40, delay: 150, duration: 1000, ease: easeInCubic });
        motion.after(500, () => ui.show(countHolder, false));
        motion.after(300, startStreaks);
    });
    if (!reduced) {
        const travel = base + 2600;
        at(travel, () => {
            motion.float(rocket, ROCKET.x, ROCKET.y - 190, 4, 700);
            ui.setText(bannerText, `EN ROUTE TO ${destinationName}`);
            // Earth falls behind; the destination grows ahead.
            resize(earth, [-20, H - 130, 300, 300], [0, H + 60, 120, 120], 1500, easeInCubic);
            resize(target, [900, 70, 40, 40], [840, 90, 220, 220], 1700, easeInCubic);
            ui.show(trip, true);
            sizeTweens.push({ entity: tripFill, from: [0, 28, 0, 10], to: [0, 28, 600, 10], at: Date.now(), ms: 1700, ease: t => t });
        });
        at(travel + 1700, () => {
            // Arrival: the planet rushes in and fills the screen.
            play('slam');
            flashOnce(0.6);
            ui.setText(bannerText, `ARRIVING AT ${destinationName}`);
            resize(target, [840, 90, 220, 220], [-160, -560, 1600, 1600], 450, easeInCubic);
            motion.leave(rocket, ROCKET.x, ROCKET.y - 190, { dy: -460, duration: 400, ease: easeInCubic });
        });
        at(travel + 2050, () => {
            const order = dissolve.map((_, i) => i).sort((a, b) => ((a * 7919) % 144) - ((b * 7919) % 144));
            order.forEach((index, n) => motion.after(Math.floor(n * 2.6), () => ui.show(dissolve[index]!, true)));
        });
        at(travel + 2500, finish);
    } else {
        at(base + 2600, finish);
    }

    let lastFlame = -1;
    return {
        tick(input) {
            if (finished) return;
            if (input.isKeyPressed('Space') || input.isKeyPressed('Enter') || input.isKeyPressed('Escape')) {
                finish();
                return;
            }
            const now = Date.now();
            const elapsed = now - start;
            for (const step of steps.filter(s => s.at <= elapsed)) {
                steps.splice(steps.indexOf(step), 1);
                step.run();
                if (finished) return;
            }
            for (const tween of [...sizeTweens]) {
                const t = Math.min(1, (now - tween.at) / tween.ms);
                const k = tween.ease(t);
                setRect(tween.entity, tween.from.map((v, i) => v + (tween.to[i]! - v) * k) as Rect);
                if (t >= 1) sizeTweens.splice(sizeTweens.indexOf(tween), 1);
            }
            if (burning) {
                const frame = reduced ? 0 : Math.floor(now / 80) % 2;
                if (frame !== lastFlame) {
                    ui.show(flames[0]!, frame === 0);
                    ui.show(flames[1]!, frame === 1);
                    lastFlame = frame;
                }
            }
            ui.show(hint, Math.floor(elapsed / 600) % 2 === 0);
        },
    };
}
