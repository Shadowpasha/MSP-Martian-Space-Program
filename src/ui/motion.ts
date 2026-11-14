// Small frame-driven motion helper for the flight screens.
//
// Screens are drawn with absolutely placed UI nodes, so motion here means moving a node's
// insets over time. Positions snap to whole pixels to keep the pixel art crisp. Every effect
// is skipped when the player turns on Reduced Motion (Settings): entities simply sit at their
// resting place and timed steps run at once. The owning screen calls tick() every frame.
import { px, UINode, type Entity, type World } from 'esengine';
import { setNodeDisplayed } from './theme';

type Ease = (t: number) => number;

export const easeOutCubic: Ease = t => 1 - (1 - t) ** 3;
export const easeInCubic: Ease = t => t ** 3;
/** Overshoots a little, then settles: a small "pop". */
export const easeOutBack: Ease = t => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

type Kind = 'ease' | 'float' | 'shake' | 'path';

interface Track {
    kind: Kind;
    entity: Entity;
    /** Resting place. */
    x: number;
    y: number;
    /** ease: offset at the start (eases to 0, or from 0 when `away`). float/shake: amplitude in dy/dx. */
    dx: number;
    dy: number;
    start: number;
    duration: number;
    ease: Ease;
    /** ease: move from the resting place out to the offset instead of in from it. */
    away?: boolean;
    /** Hidden until its delay ends (for staggered entrances). */
    reveal?: boolean;
    /** path: position for a time in ms since start. */
    at?: (ms: number) => readonly [number, number];
    onDone?: () => void;
    lastX?: number;
    lastY?: number;
}

export interface MoveOptions {
    dx?: number;
    dy?: number;
    /** Milliseconds before it starts. */
    delay?: number;
    /** Milliseconds. */
    duration?: number;
    ease?: Ease;
    /** Hide the entity until it starts moving. */
    reveal?: boolean;
    onDone?: () => void;
}

export function makeMotion(world: World, reducedMotion: boolean) {
    const tracks = new Map<Entity, Track>();
    /** Entities placed directly with set(), keeping their last position so unchanged frames write nothing. */
    const placed = new Map<Entity, Track>();
    const timers: Array<{ at: number; run: () => void }> = [];
    const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

    function place(track: Track, x: number, y: number): void {
        const rx = Math.round(x);
        const ry = Math.round(y);
        if (rx === track.lastX && ry === track.lastY) return;
        track.lastX = rx;
        track.lastY = ry;
        world.update(track.entity, UINode, node => {
            node.insetLeft = px(rx);
            node.insetTop = px(ry);
        });
    }

    function begin(track: Track): void {
        tracks.set(track.entity, track);
        if (track.reveal) setNodeDisplayed(world, track.entity, false);
    }

    /** Ease an entity from (x+dx, y+dy) to its resting place (x, y). */
    function enter(entity: Entity, x: number, y: number, options: MoveOptions = {}): void {
        if (reducedMotion || !world.valid(entity)) {
            options.onDone?.();
            return;
        }
        const track: Track = {
            kind: 'ease', entity, x, y, dx: options.dx ?? 0, dy: options.dy ?? 0,
            start: now() + (options.delay ?? 0), duration: options.duration ?? 240,
            ease: options.ease ?? easeOutCubic, reveal: options.reveal, onDone: options.onDone,
        };
        begin(track);
        place(track, x + track.dx, y + track.dy);
    }

    /** Ease an entity from its resting place (x, y) out by (dx, dy), and leave it there. */
    function leave(entity: Entity, x: number, y: number, options: MoveOptions = {}): void {
        if (reducedMotion || !world.valid(entity)) {
            options.onDone?.();
            return;
        }
        begin({
            kind: 'ease', entity, x, y, dx: options.dx ?? 0, dy: options.dy ?? 0, away: true,
            start: now() + (options.delay ?? 0), duration: options.duration ?? 240,
            ease: options.ease ?? easeInCubic, onDone: options.onDone,
        });
    }

    /** A quick hop: up by `height` and back down with a little bounce. */
    function hop(entity: Entity, x: number, y: number, height = 6, delay = 0): void {
        enter(entity, x, y, { dy: -height, delay, duration: 280, ease: easeOutBack });
    }

    /** Float up and down by `amplitude` pixels, one cycle every `period` ms, until replaced. */
    function float(entity: Entity, x: number, y: number, amplitude = 2, period = 2400): void {
        if (reducedMotion || !world.valid(entity)) return;
        begin({ kind: 'float', entity, x, y, dx: 0, dy: amplitude, start: now(), duration: period, ease: easeOutCubic });
    }

    /** Rattle side to side by `amplitude` pixels for `duration` ms, fading out. */
    function shake(entity: Entity, x: number, y: number, amplitude = 3, duration = 360, onDone?: () => void): void {
        if (reducedMotion || !world.valid(entity)) {
            onDone?.();
            return;
        }
        begin({ kind: 'shake', entity, x, y, dx: amplitude, dy: 0, start: now(), duration, ease: easeOutCubic, onDone });
    }

    /** Follow a path forever: `at(ms)` gives the position `ms` milliseconds after it starts. */
    function path(entity: Entity, at: (ms: number) => readonly [number, number]): void {
        if (reducedMotion || !world.valid(entity)) return;
        const [x, y] = at(0);
        begin({ kind: 'path', entity, x, y, dx: 0, dy: 0, start: now(), duration: Infinity, ease: easeOutCubic, at });
    }

    /** Run `run` after `ms` milliseconds (at once with Reduced Motion). */
    function after(ms: number, run: () => void): void {
        if (reducedMotion || ms <= 0) run();
        else timers.push({ at: now() + ms, run });
    }

    /** Put an entity at (x, y) right now, ending any motion it had. Used for pointer-driven moves. */
    function set(entity: Entity, x: number, y: number): void {
        if (!world.valid(entity)) return;
        const track = tracks.get(entity) ?? placed.get(entity)
            ?? { kind: 'ease' as Kind, entity, x, y, dx: 0, dy: 0, start: 0, duration: 0, ease: easeOutCubic };
        tracks.delete(entity);
        placed.set(entity, track);
        place(track, x, y);
    }

    /** Stop moving an entity and leave it at its resting place. */
    function stop(entity: Entity): void {
        const track = tracks.get(entity);
        if (!track) return;
        tracks.delete(entity);
        if (world.valid(entity)) place(track, track.x, track.y);
    }

    function finish(track: Track): void {
        tracks.delete(track.entity);
        if (track.away) place(track, track.x + track.dx, track.y + track.dy);
        else place(track, track.x, track.y);
        track.onDone?.();
    }

    function tick(): void {
        const time = now();
        if (timers.length) {
            const due = timers.filter(timer => timer.at <= time);
            for (const timer of due) timers.splice(timers.indexOf(timer), 1);
            due.forEach(timer => timer.run());
        }
        if (tracks.size === 0) return;
        for (const track of [...tracks.values()]) {
            if (!world.valid(track.entity)) {
                tracks.delete(track.entity);
                continue;
            }
            const elapsed = time - track.start;
            if (elapsed < 0) continue;
            if (track.reveal) {
                track.reveal = false;
                setNodeDisplayed(world, track.entity, true);
            }
            if (track.kind === 'path') {
                const [x, y] = track.at!(elapsed);
                place(track, x, y);
                continue;
            }
            if (track.kind === 'float') {
                // From the resting place up by the amplitude and back, on a sine wave.
                const phase = (elapsed % track.duration) / track.duration;
                place(track, track.x, track.y - track.dy * (0.5 - 0.5 * Math.cos(phase * Math.PI * 2)));
                continue;
            }
            const t = Math.min(1, elapsed / track.duration);
            if (t >= 1) {
                finish(track);
                continue;
            }
            if (track.kind === 'shake') {
                const side = Math.floor(elapsed / 40) % 2 === 0 ? 1 : -1;
                place(track, track.x + side * track.dx * (1 - t), track.y);
                continue;
            }
            const k = track.away ? track.ease(t) : 1 - track.ease(t);
            place(track, track.x + track.dx * k, track.y + track.dy * k);
        }
    }

    return { enter, leave, hop, float, shake, path, after, set, stop, tick, reducedMotion };
}

export type Motion = ReturnType<typeof makeMotion>;
