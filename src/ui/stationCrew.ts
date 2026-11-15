// The crew walking about the station cutaway (tharsis_station.png). The bays are walled off from
// each other, so every crew member stays in the room of their role and moves between a few spots
// there, stopping to work at each. Crew out with the rover, or incapacitated, are not shown.
// With Reduced Motion everyone stands still at their spot.
//
// Sprites are the per-role atlases from art/crew_walkers.py: 8×4 cells of 40×64 pixels, walk
// 0-6 right and 8-14 left, idle 16-21 right and 24-29 left, outlined so they read against the
// painting. They are drawn at 2× (whole pixels, like the painting) so they stand out in the room.
import type { Entity } from 'esengine';
import type { CrewRole } from '../contracts/gameContract';
import type { FlightUi } from './flightUi';
import type { Motion } from './motion';

const SCALE = 2;
const FRAME_W = 40 * SCALE;
const FRAME_H = 64 * SCALE;
/** Where the head centre and the feet sit inside a frame (see art/crew_walkers.py). */
const HEAD_X = 20 * SCALE;
const FEET_Y = 62 * SCALE;
/** The middle of the painted floor deck (screen px), where the crew's feet stand. */
const FLOOR_Y = 548;
/** Spots to stand at in each room, head x in screen px: clear of the railings at the room's ends. */
const ROOM_SPOTS = {
    roverBay: [60, 140, 200, 262],
    lab: [378, 452, 530, 584],
    lifeSupport: [698, 770, 850, 904],
    storage: [1018, 1080, 1150, 1222],
} as const;
/** Each role's room: the pilot with the rover, engineer and scientist at the instrument bench,
 * the botanist with the plants, medic and captain with the supplies and suit lockers. */
const ROLE_ROOM: Record<CrewRole, keyof typeof ROOM_SPOTS> = {
    pilot: 'roverBay',
    engineer: 'lab',
    scientist: 'lab',
    botanist: 'lifeSupport',
    medic: 'storage',
    captain: 'storage',
};
const SPEED = 40;           // screen px per second
const WALK_MS = 110;        // per walk frame (7-frame stride)
const IDLE_MS = 220;        // per idle frame (6-frame breath)
const WALK_FRAMES = 7;
const IDLE_FRAMES = 6;

type Facing = 1 | -1;
const walkCell = (frame: number, facing: Facing) => frame + (facing === 1 ? 0 : 8);
const idleCell = (frame: number, facing: Facing) => 16 + frame + (facing === 1 ? 0 : 8);

/** A crew member as the station sees them. */
export interface StationCrewMember {
    id: string;
    role: CrewRole;
    /** At the station (not with the rover). */
    present: boolean;
    /** Unable to move about (incapacitated): stands at their spot. */
    still: boolean;
}

interface Walker {
    sprite: Entity;
    spots: readonly number[];
    x: number;
    facing: Facing;
    present: boolean;
    still: boolean;
    target: number | null;
    waitUntil: number;
    walkedMs: number;
    idleMs: number;
}

export interface StationCrew {
    /** Update who is at the station. */
    sync(crew: readonly StationCrewMember[]): void;
    /** Where a crew member is now (head centre x, top of the sprite, screen px), or null if not shown. */
    position(id: string): { x: number; top: number } | null;
    tick(): void;
}

/** The top of a crew member's head below the sprite's top (in the atlases from art/crew_walkers.py
 * the head starts 8 to 11 pixels down the cell). */
export const HEAD_TOP = 8 * SCALE;
/** A crew member's on-screen size, for click areas. */
export const SPRITE_W = FRAME_W;
export const SPRITE_H = FRAME_H;

export function mountStationCrew(ui: FlightUi, parent: Entity, motion: Motion, crew: readonly StationCrewMember[]): StationCrew {
    const walkers = new Map<string, Walker>();
    let last = Date.now();

    /** Another spot in the walker's room, well away from where a roommate stands or is heading
     * (so their name tags do not overlap), or failing that at least not the same spot. */
    function nextSpot(self: Walker): number {
        const taken = [...walkers.values()].filter(w => w !== self && w.present && w.spots === self.spots)
            .map(w => w.target ?? w.x);
        const others = self.spots.filter(spot => spot !== self.x);
        const apart = others.filter(spot => taken.every(x => Math.abs(x - spot) >= 100));
        const free = others.filter(spot => !taken.includes(spot));
        const choices = apart.length ? apart : free.length ? free : others;
        return choices[Math.floor(Math.random() * choices.length)]!;
    }

    function place(walker: Walker): void {
        motion.set(walker.sprite, Math.round(walker.x - HEAD_X), FLOOR_Y - FEET_Y);
    }

    function spawn(member: StationCrewMember): Walker {
        const spots = ROOM_SPOTS[ROLE_ROOM[member.role]];
        // Roommates start apart: the first at the room's first spot, the next at its third.
        const roommates = [...walkers.values()].filter(w => w.spots === spots).length;
        const x = spots[(roommates * 2) % spots.length]!;
        const facing: Facing = roommates % 2 === 0 ? 1 : -1;
        const sprite = ui.image(parent, [x - HEAD_X, FLOOR_Y - FEET_Y, FRAME_W, FRAME_H],
            `assets/textures/crew_walk_${member.role}.png`, ui.palette.white, idleCell(0, facing));
        ui.show(sprite, member.present);
        return {
            sprite, spots, x, facing, present: member.present, still: member.still, target: null,
            waitUntil: Date.now() + 1500 + Math.random() * 3000, walkedMs: 0, idleMs: Math.random() * 1000,
        };
    }

    function sync(members: readonly StationCrewMember[]): void {
        for (const member of members) {
            const walker = walkers.get(member.id);
            if (!walker) {
                walkers.set(member.id, spawn(member));
                continue;
            }
            walker.still = member.still;
            if (walker.present !== member.present) {
                walker.present = member.present;
                ui.show(walker.sprite, member.present);
            }
        }
        for (const [id, walker] of walkers) {
            if (walker.present && !members.some(member => member.id === id)) {
                walker.present = false;
                ui.show(walker.sprite, false);
            }
        }
    }

    function step(walker: Walker, now: number, dt: number): void {
        if (walker.still) {
            walker.target = null;
            ui.setSlot(walker.sprite, idleCell(0, walker.facing));
            return;
        }
        if (walker.target === null) {
            walker.idleMs += dt;
            ui.setSlot(walker.sprite, idleCell(Math.floor(walker.idleMs / IDLE_MS) % IDLE_FRAMES, walker.facing));
            if (now < walker.waitUntil) return;
            walker.target = nextSpot(walker);
            walker.facing = walker.target > walker.x ? 1 : -1;
            walker.walkedMs = 0;
            return;
        }
        const move = (SPEED * dt) / 1000;
        if (Math.abs(walker.target - walker.x) <= move) {
            // Arrived: work here for a while, facing a random way.
            walker.x = walker.target;
            walker.target = null;
            walker.idleMs = 0;
            if (Math.random() < 0.4) walker.facing = walker.facing === 1 ? -1 : 1;
            walker.waitUntil = now + 4000 + Math.random() * 6000;
            place(walker);
            ui.setSlot(walker.sprite, idleCell(0, walker.facing));
            return;
        }
        walker.x += move * walker.facing;
        walker.walkedMs += dt;
        place(walker);
        ui.setSlot(walker.sprite, walkCell(Math.floor(walker.walkedMs / WALK_MS) % WALK_FRAMES, walker.facing));
    }

    sync(crew);
    return {
        sync,
        position(id) {
            const walker = walkers.get(id);
            return walker?.present ? { x: Math.round(walker.x), top: FLOOR_Y - FEET_Y } : null;
        },
        tick() {
            const now = Date.now();
            const dt = Math.min(100, now - last);
            last = now;
            if (motion.reducedMotion) return;
            for (const walker of walkers.values()) if (walker.present) step(walker, now, dt);
        },
    };
}
