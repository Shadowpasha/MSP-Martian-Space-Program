// Tiny pixel bursts for big moments: sparks when an upgrade unlocks, a dust puff when cargo
// lands. Plain squares moved by the motion helper, removed after they fade out. With Reduced
// Motion nothing is spawned at all.
import type { Color, Entity } from 'esengine';
import type { FlightUi } from './flightUi';
import type { Motion } from './motion';

export function burst(
    ui: FlightUi, motion: Motion, parent: Entity, x: number, y: number,
    options: { colors: Color[]; count?: number; speed?: number; gravity?: number; life?: number; size?: number; upward?: boolean },
): void {
    if (motion.reducedMotion) return;
    const count = options.count ?? 10;
    const speed = options.speed ?? 0.18;
    const gravity = options.gravity ?? 0.0006;
    const life = options.life ?? 520;
    const size = options.size ?? 4;
    for (let i = 0; i < count; i++) {
        // Spread evenly round the circle (or the upper half), with a little wobble so it isn't a perfect ring.
        const turn = options.upward ? Math.PI * (1 + (i + 0.5) / count) : (Math.PI * 2 * i) / count;
        const angle = turn + Math.sin(i * 12.9898) * 0.25;
        const v = speed * (0.6 + 0.4 * Math.abs(Math.sin(i * 78.233)));
        const vx = Math.cos(angle) * v;
        const vy = Math.sin(angle) * v;
        const color = options.colors[i % options.colors.length]!;
        const bit = ui.box(parent, [x, y, size, size], color);
        motion.path(bit, ms => [x + vx * ms, y + vy * ms + gravity * ms * ms]);
        // Two steps of fading, then gone.
        motion.after(life * 0.6, () => ui.fill(bit, { ...color, a: 0.55 }));
        motion.after(life, () => { if (ui.world.valid(bit)) ui.world.despawn(bit); });
    }
}
