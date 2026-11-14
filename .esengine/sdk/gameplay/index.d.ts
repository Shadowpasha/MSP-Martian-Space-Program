import { ComponentDef, World, EventDef, Plugin, App, InputState, MarkerData } from '../shared/app.js';
import { Vec3, Entity } from '../shared/wasm.js';
import { AnimatorControllerAPI, AnimatorEventPayload } from '../shared/Animator.js';
import { Overlap3DHit, Physics3DQueries } from '../shared/Physics3DQueries.js';
export { ATTACK_KEY, COMBAT_ATTACK_END, COMBAT_ATTACK_START, COMBAT_HIT, DODGE_KEY, TPC_ATTACK, TPC_DODGE, TPC_GROUNDED, TPC_JUMP, TPC_SPEED } from '../shared/vocabulary.js';
import '../shared/resource.js';
import '../shared/motion.js';

/**
 * @file    ThirdPersonController.ts
 * @brief   Input to a walking character, and the character's real motion back
 *          out to its animator.
 *
 * @details It decides what the player WANTS - a direction in the camera's ground
 *          plane, a speed to reach it at, a jump - and asks
 *          CharacterController3D for it. What actually happens is the physics
 *          world's answer, and that answer, not the request, is what reaches the
 *          animator: a character shoving a wall has a full stick and no motion,
 *          and it must not be running on the spot.
 *
 *          It solves no collision, owns no gravity (the character controller
 *          carries the vertical component), and names no animation clip.
 */

/** The fields of the `ThirdPersonController` component. @experimental */
interface ThirdPersonControllerData {
    /** Top speed on the ground, world units per second. */
    moveSpeed: number;
    /** How fast it reaches that speed, units per second squared. */
    acceleration: number;
    /** How fast it sheds it when the stick centres. */
    deceleration: number;
    /** How fast it turns to face where it is going, degrees per second. */
    rotationSpeed: number;
    /** Upward speed a jump starts with; 0 disables jumping. */
    jumpSpeed: number;
    /** How much of `acceleration` applies while off the ground, 0..1. */
    airControl: number;
    /** Read the stick in the camera's ground plane rather than the world's. */
    cameraRelative: boolean;
    /** The camera that defines "forward". 0 = the first ThirdPersonCamera found. */
    camera: Entity;
    /** Speed under which the animator is told the character is standing still. */
    idleThreshold: number;
    enabled: boolean;
}
/**
 * Drives a CharacterController3D from player input, and reports what the
 * character actually did to its Animator.
 *
 * @experimental
 */
declare const ThirdPersonController: ComponentDef<ThirdPersonControllerData>;
/** A basis to read the stick against: two ground-plane axes. */
interface MoveBasis {
    forward: Vec3;
    right: Vec3;
}
/** The world basis, for a controller reading its stick without a camera. */
declare const WORLD_BASIS: MoveBasis;
/**
 * Where the player is asking to go, as a unit vector on the ground plane.
 * Zero-length when the stick is centred, which is a stop rather than a
 * direction. `input.y` is forward on the stick, `input.x` is right.
 */
declare function desiredDirection(input: {
    x: number;
    y: number;
}, basis: MoveBasis): Vec3;
/**
 * Move a horizontal velocity toward what was asked for. Accelerating and
 * stopping are separate rates because a character that coasts to a halt as
 * slowly as it gets going feels like it is on ice.
 */
declare function approachVelocity(current: {
    x: number;
    z: number;
}, target: {
    x: number;
    z: number;
}, acceleration: number, deceleration: number, dt: number): {
    x: number;
    z: number;
};
/** The heading, in degrees about world up, that a ground direction points at. */
declare function facingYaw(direction: Vec3): number;
/** The signed shortest way from `from` to `to`, in degrees. */
declare function shortestAngleDelta(from: number, to: number): number;
/**
 * The velocity a root-motion request comes to over the seconds it covers. A RATE,
 * because the animator states one per rendered frame while the character steps on
 * its own clock: adding the displacement moves twice on a frame with two steps.
 */
declare function rootMotionVelocity(delta: {
    x: number;
    z: number;
}, seconds: number): {
    x: number;
    z: number;
};
/**
 * Turn `from` toward `to` at a rate. The shortest way round, so a character
 * crossing the -180/180 seam does not spin the long way to get there.
 */
declare function turnToward(from: number, to: number, degreesPerSecond: number, dt: number): number;
/** A yaw in degrees as the rotation quaternion about world up. */
declare function yawQuaternion(yawDeg: number): {
    w: number;
    x: number;
    y: number;
    z: number;
};
/** The yaw a rotation about world up carries, in degrees. */
declare function yawOfQuaternion(q: {
    w: number;
    y: number;
}): number;

/**
 * @file    FirstPersonController.ts
 * @brief   Looking, walking, jumping and crouching as the one who stands in the world, and a hand-held thing that does not go through walls.
 *
 * @details It decides what the player WANTS (where to look, which way to go, whether to jump or crouch) and asks the 3D character controller for it, as the third-person
 *          layer does: it solves no collision and owns no gravity. The body turns about world up with the player's yaw; the camera under it tilts with the pitch.
 *
 *          Crouching changes the capsule. The physics world has no way to resize a character, so a crouch makes it again at the new height, with the feet where they were, and
 *          standing up first asks whether there is room over the head.
 *
 *          The view model is a second camera drawn over the first, with a field of view and a near plane of its own, over the layer the held thing is on, so that it neither
 *          stretches with a wide view of the world nor goes through the wall it is held against.
 */

/** The fields of the `FirstPersonController` component. @experimental */
interface FirstPersonControllerData {
    /** Top speed on the ground, world units per second. */
    moveSpeed: number;
    /** What the speed is multiplied by while the sprint key is held. */
    sprintMultiplier: number;
    /** What the speed is multiplied by while crouched. */
    crouchMultiplier: number;
    /** How fast it reaches its speed, units per second squared. */
    acceleration: number;
    /** How fast it sheds it when nothing is asked for. */
    deceleration: number;
    /** How much of `acceleration` applies while off the ground, 0..1. */
    airControl: number;
    /** Upward speed a jump starts with; 0 disables jumping. */
    jumpSpeed: number;
    /**
     * The player's own gravity, as a share of the world's: 1 falls as everything else does; a game that wants a
     * snappier arc than the world's bodies (21 m/s² against 9.81) sets more. The controller carries its own
     * vertical speed while airborne then.
     */
    gravityScale: number;
    /** Seconds after walking off an edge in which a jump still takes off ("coyote time"). */
    coyoteTime: number;
    /** Seconds a jump pressed before landing is kept, so it takes off on the frame the player lands. */
    jumpBuffer: number;
    /** Degrees of turn for each pixel the pointer moves. */
    lookSensitivity: number;
    /** Degrees of turn for each pixel a finger drags. */
    touchSensitivity: number;
    /** The lowest the player may look, in degrees (negative is down). */
    pitchMin: number;
    /** The highest the player may look, in degrees. */
    pitchMax: number;
    /** Where the eye is above the character's centre when standing, in world units. */
    eyeHeight: number;
    /** Where it is when crouched. */
    crouchEyeHeight: number;
    /** The capsule's half height when crouched; the standing one is the character controller's own. */
    crouchHalfHeight: number;
    /** How fast the eye moves between the two heights, units per second. */
    eyeSpeed: number;
    /** The camera that looks: a child of this entity. 0 is the first child that carries a Camera. */
    camera: Entity;
    /** Take the pointer for looking once the player clicks (web), instead of looking while a button is held. A mini game has no pointer to take. */
    pointerLock: boolean;
    /** Look by dragging a finger on the right of the screen, from `touchLookFrom` pixels across. */
    touchLook: boolean;
    touchLookFrom: number;
    enabled: boolean;
    /** Where it is looking, in degrees: set them to turn the player (a spawn point, a teleport). */
    yaw: number;
    pitch: number;
    /** Whether it is crouched now; set by the controller. */
    crouching: boolean;
    /** The capsule's standing half height, remembered from the character controller the first time it is seen; 0 until then. */
    standHalfHeight: number;
    /** Where the eye is now, between the two heights. */
    eye: number;
    /** A rebuild of the capsule in progress: 0 none, 1 the old one is let go and the new one made on the next step. */
    rebuild: number;
    /** Seconds since the character last stood on the floor; set by the controller. */
    airTime: number;
    /** Seconds the last jump press has left to take off in; set by the controller. */
    jumpHeld: number;
    /** Whether the jump this airborne spell started with has been used; set by the controller. */
    jumped: boolean;
}
/**
 * A player who looks through a camera and walks, jumps and crouches in a CharacterController3D.
 *
 * @experimental
 */
declare const FirstPersonController: ComponentDef<FirstPersonControllerData>;
/** The fields of the `FirstPersonViewModel` component. @experimental */
interface FirstPersonViewModelData {
    /** The sorting layer the held thing is on; its entities carry this `layer` on their renderers. */
    layer: number;
    /** The view model's own field of view, in degrees. */
    fov: number;
    nearPlane: number;
    farPlane: number;
}
/**
 * Put on the player's camera: a second camera is drawn over it, showing only the entities on `layer`, with a field of view and near plane of its own, and the camera is told
 * not to draw that layer itself. Whatever is held goes under the camera, on the layer.
 *
 * @experimental
 */
declare const FirstPersonViewModel: ComponentDef<FirstPersonViewModelData>;
/** A turn about world up, as a quaternion. Zero is looking down -z; a positive turn is to the left. */
declare function yawRotation(yawDeg: number): {
    w: number;
    x: number;
    y: number;
    z: number;
};
/** A tilt about the camera's own right, as a quaternion. A positive tilt looks up. */
declare function pitchRotation(pitchDeg: number): {
    w: number;
    x: number;
    y: number;
    z: number;
};
/** Where the player looks after the pointer has moved (`dx`, `dy` in pixels, screen down being positive): to the right and up are what the pointer says. */
declare function lookAfter(yaw: number, pitch: number, dx: number, dy: number, degreesPerPixel: number, pitchMin: number, pitchMax: number): {
    yaw: number;
    pitch: number;
};
/** The ground direction a stick asks for when the player has turned `yaw` degrees: `y` is forward, `x` is right. Zero when centred. */
declare function walkDirection(stick: {
    x: number;
    y: number;
}, yaw: number): {
    x: number;
    z: number;
};
/** Whether the player is crouched after this step: crouched if asked to be, and kept down where there is no room to stand. */
declare function crouchAfter(crouching: boolean, wantsCrouch: boolean, roomToStand: boolean): boolean;

/**
 * @file    ThirdPersonCamera.ts
 * @brief   An eye that orbits a target and does not go through walls.
 *
 * @details Owns where the camera is and which way it looks: yaw, pitch, how far
 *          back it sits and how it catches up. It moves nothing else - a
 *          character's motion is {@link ThirdPersonController}'s, and the two
 *          only meet where the controller reads this yaw to know what "forward"
 *          means to the player.
 *
 *          Obstruction asks the physics world the same way anything else does.
 *          A camera that owned a second notion of solid would drift from the one
 *          the character walks against.
 */

/** The fields of the `ThirdPersonCamera` component. @experimental */
interface ThirdPersonCameraData {
    /** What it orbits. 0 = inert. */
    target: Entity;
    /** How far back it sits when nothing is in the way, world units. */
    distance: number;
    /** Turn about world up, degrees. */
    yaw: number;
    /** Turn above the horizon, degrees; positive looks down at the target. */
    pitch: number;
    minPitch: number;
    maxPitch: number;
    /** Degrees per pixel of pointer travel. */
    sensitivity: number;
    /** How fast position catches up, per second. 0 = rigid. */
    followDamping: number;
    /** Lifted off the target's origin, so the eye frames the chest not the feet. */
    targetOffset: Vec3;
    /** Pull in when something solid stands between the pivot and the eye. */
    obstruction: boolean;
    /** How fat the probe is, so the eye stops before it clips a wall. */
    obstructionRadius: number;
    /** Physics layers the probe collides with; 0 = every layer. */
    obstructionLayers: number;
    enabled: boolean;
}
/**
 * A camera that orbits a target under pointer control.
 *
 * @experimental
 */
declare const ThirdPersonCamera: ComponentDef<ThirdPersonCameraData>;
/**
 * Where the eye sits relative to its pivot, at these angles. Length 1, and
 * pointing BEHIND the target: the camera looks back down it.
 */
declare function orbitOffset(yawDeg: number, pitchDeg: number): Vec3;
/**
 * The ground-plane basis the player's input is read in, for a camera at this
 * yaw. PITCH IS ABSENT on purpose: forward is where the player looks ALONG the
 * ground, so an eye angled steeply down still walks the character across the
 * floor rather than into it.
 */
declare function cameraGroundBasis(yawDeg: number): {
    forward: Vec3;
    right: Vec3;
};
/**
 * How much of the way to the target a damped value travels in `dt`.
 * `damping` is a rate per second; 0 means "arrive now", which is what a gate
 * that wants to read the settled value asks for.
 */
declare function dampFactor(damping: number, dt: number): number;
/** Keep `pitch` inside its limits, whichever way round they were authored. */
declare function clampPitch(pitch: number, min: number, max: number): number;

/**
 * @file    Hunter.ts
 * @brief   The gameplay layer above a character that hunts: what it decides,
 *          asked of the same navigation, physics, animator and combat a player
 *          goes through.
 *
 * @details The twin of {@link ThirdPersonController}. That one turns INPUT into a
 *          request; this one turns PERCEPTION into one. Everything downstream is
 *          deliberately identical — the route is navigation's, the movement is
 *          the character controller's, the speed the animator hears is the one
 *          the world allowed, and a swing goes out as an animator trigger and
 *          comes back through the same MeleeAttack. An attacker being a program
 *          rather than a person must not change the mechanism.
 *
 *          Four states and no authoring surface: this is a concrete enemy, not a
 *          framework. The FSM and behaviour-tree runtimes are how a GAME declares
 *          its own; what needed proving first is that the chain holds at all.
 */

/** What a hunter is doing. Engine-written; a game reads it. @experimental */
type HunterState = 'idle' | 'chase' | 'attack' | 'dead';
/** The fields of the `Hunter` component. @experimental */
interface HunterData {
    /** Ground-plane distance it closes to before it swings, world units. */
    attackRange: number;
    /** Seconds between swings. */
    attackInterval: number;
    /** How fast it turns to face, degrees per second. */
    rotationSpeed: number;
    /** Speed under which the animator is told it is standing still. */
    idleThreshold: number;
    enabled: boolean;
    /** Engine-written: one of `idle` / `chase` / `attack` / `dead`. */
    state: string;
    /** Engine-written: seconds until it may swing again. */
    cooldown: number;
}
/**
 * A character that hunts what it perceives: it asks navigation for a route, the
 * character controller for the movement, and the animator for a swing. Add it
 * beside `Perceiver`/`Perception`, `NavAgent`, `CharacterController3D` and an
 * `Animator` whose graph answers `attack`; damage stays `MeleeAttack`'s.
 *
 * @experimental
 */
declare const Hunter: ComponentDef<HunterData>;
/** Everything the decision depends on, so it can be made without a world. */
interface HunterSituation {
    alive: boolean;
    visible: boolean;
    /** Distance to what it sees, IN THE GROUND PLANE — two capsules standing on
     *  the same floor are never as close as their three-axis distance says. */
    distance: number;
    attackRange: number;
}
/**
 * What a hunter should be doing. Recomputed every frame rather than latched:
 * a target that steps out of reach mid-swing has to be chased again, and a
 * state that only leaves on its own would leave it swinging at air.
 */
declare function decideHunterState(s: HunterSituation): HunterState;
/**
 * Perceive, decide, and ask — after perception, before navigation, so the
 * destination is planned the frame it was chosen. It moves nothing: where the
 * hunter ends up is the character controller's answer, and the speed the
 * animator hears is that answer. A hunter shoving a wall is not running on the spot.
 */
declare function huntTargets(world: World, animator: AnimatorControllerAPI | null, attackTrigger: string, dt: number): void;

/**
 * @file    Health.ts
 * @brief   What a blow is, and the one place it lands.
 *
 * @details A blow travels as a REQUEST on the {@link Damage} bus and one system
 *          answers it. Nothing else writes `Health` — not the thing that swung,
 *          not the physics query that found a body — so "how much is left" has a
 *          single author, and every rule that will ever sit between a hit and a
 *          health bar (armour, invulnerability, a shield) has one seam to sit in
 *          rather than an inlined subtraction to be found and edited.
 *
 *          Going back UP is the same author's other verb. A respawn that reset
 *          the field itself would be a second one, and then "how much is left"
 *          has two answers whenever they disagree.
 *
 *          The bus is double buffered, so a blow sent this frame lands on the
 *          next. That is one frame between the animation's hit moment and the
 *          number changing, and it buys a combat system that never reaches into
 *          the thing it hit.
 */

/** The fields of the `Health` component. @experimental */
interface HealthData {
    current: number;
    max: number;
}
/**
 * What something has left. Presence is also what makes an entity DAMAGEABLE: a
 * combat query finds colliders, and the floor is one of them.
 *
 * @experimental
 */
declare const Health: ComponentDef<HealthData>;
/**
 * One blow, on its way to whoever it lands on.
 *
 * The point it landed at travels with it because presentation needs it and
 * cannot recover it: by the time a spark is drawn, the swing has moved on.
 *
 * @experimental
 */
interface DamagePayload {
    target: Entity;
    /** Who dealt it, so a blow cannot be traced back to nobody. */
    source: Entity;
    amount: number;
    x: number;
    y: number;
    z: number;
}
/**
 * The bus every blow travels on. Send it to deal damage; read it to answer one
 * (a spark, a sound, a hit reaction).
 *
 * @experimental
 */
declare const Damage: EventDef<DamagePayload>;
/**
 * Land every blow in `blows`. The ONLY writer of `Health` — a blow aimed at
 * something that has none, or at something already down, is simply not applied.
 */
/**
 * Put an entity back to full. The other half of this seam: a respawn restores
 * what a blow took, and neither reaches into the field itself.
 *
 * `max` is the whole policy — there is no second notion of "full" to invent, and
 * a caller that wants some other number wants a rule this seam does not have.
 *
 * @experimental
 */
declare function restoreToFull(world: World, entity: Entity): void;
declare function applyDamage(world: World, blows: Iterable<DamagePayload>): void;

/**
 * @file    MeleeAttack.ts
 * @brief   The swing: when the animation says it connects, what was in the way,
 *          and who is allowed to be hurt by it.
 *
 * @details Three facts, kept apart on purpose:
 *
 *              an animation event  ≠  a hit  ≠  damage
 *
 *          The clip says only that the swing reached its effective moment. What
 *          is in that space is the physics world's answer, and what that does to
 *          anyone is gameplay's. Collapsing any two of them is what makes a
 *          combat system that cannot be re-aimed, re-timed or re-balanced.
 *
 *          So: the animator posts `hit` and knows nothing about damage; the
 *          query is asked at the ANIMATED anchor and knows nothing about health;
 *          the filtering (self, already-hit, damageable) lives here and nowhere
 *          in the physics layer.
 */

/** The fields of the `MeleeAttack` component. @experimental */
interface MeleeAttackData {
    /** Radius of the sphere a `hit` tests, in world units. */
    radius: number;
    /** What a landed blow takes off. */
    damage: number;
    /** Physics layers the swing can reach; 0 is every layer. */
    layers: number;
    /**
     * The entity whose WORLD placement the query is centred on — a socket under
     * an animated joint, so where the swing reaches is what the animation did.
     * 0 falls back to the attacker itself, which is a body slam, not a sword.
     */
    anchor: Entity;
    enabled: boolean;
    /** Engine-written: the live swing, or 0 when none is running. */
    attackId: number;
    /** Engine-written: how many targets the live swing has landed on. */
    hitCount: number;
}
/**
 * A melee swing whose timing is the animation's and whose reach is the physics
 * world's. Add it beside an `Animator` whose attack clip declares `attack-start`,
 * `hit` and `attack-end`.
 *
 * @experimental
 */
declare const MeleeAttack: ComponentDef<MeleeAttackData>;
/**
 * The swings currently in the air, one per attacker: ONE swing lands on a target
 * once, and the next one may land again. Leaning on "the event only fires once"
 * is a contract the first multi-frame hit window breaks, and breaks silently —
 * double damage reads as a balance problem, not a bug.
 */
declare class MeleeAttacks {
    private readonly live_;
    private nextId_;
    /** Begin a swing, ending whatever this attacker had in the air. */
    open(entity: Entity): number;
    close(entity: Entity): void;
    live(entity: Entity): {
        id: number;
        hits: number;
    } | null;
    /**
     * Record `target` as hit by this attacker's live swing. False when the swing
     * already reached it, which is the whole point.
     */
    record(entity: Entity, target: Entity): boolean;
    /** Drop an attacker's swing (wire to world.onDespawn). */
    forget(entity: Entity): void;
    clear(): void;
}
/**
 * The only thing a swing asks the physics world. Narrow on purpose: what is in
 * this space is all physics can answer, and `Physics3DQueries` satisfies it
 * without combat depending on the rest of that surface.
 */
interface MeleeOverlapQuery {
    overlapSphere(centre: {
        x: number;
        y: number;
        z: number;
    }, radius: number, layerMask?: number): readonly Overlap3DHit[];
}
/**
 * Turn the animation events an attacker posted into blows.
 *
 * Runs on LAST frame's events, before this frame's animator poses anything:
 * the joints still hold the pose that produced the event, so the swing is asked
 * about the space it was actually in.
 */
declare function resolveMeleeHits(world: World, attacks: MeleeAttacks, queries: MeleeOverlapQuery | null, events: Iterable<AnimatorEventPayload>, damage: {
    send(blow: DamagePayload): void;
}): void;

/**
 * @file    GameplayPlugin.ts
 * @brief   Wires the third-person character and its camera into the frame.
 *
 * @details Three systems, and WHERE they sit is the design. The controller asks
 *          before the physics step and observes after it, so what reaches the
 *          animator is the motion the world allowed rather than the motion the
 *          player asked for. The camera runs once a frame, after everything has
 *          moved, because it follows and is never followed.
 */

/**
 * Ask for motion: the stick, in the camera's ground plane, as a velocity the
 * character controller will try to honour. The vertical component is left alone
 * unless a jump starts one, because the character controller carries it.
 */
declare function requestMotion(world: World, input: InputState, dt: number, animator?: AnimatorControllerAPI | null): void;
/**
 * Observe what happened. The animator is told the speed the character REACHED,
 * so walking into a wall reads as standing still, and the character turns to
 * face where it actually went.
 */
declare function observeMotion(world: World, animator: AnimatorControllerAPI | null, dt: number): void;
declare function updateCameras(world: World, input: InputState, queries: Physics3DQueries | null, dt: number): void;
declare class GameplayPlugin implements Plugin {
    name: string;
    private offDespawn_;
    private offViewModels_;
    /** Per App, not per module: two Apps in one process must not share swings. */
    private readonly attacks_;
    build(app: App): void;
    cleanup(): void;
}
declare const gameplayPlugin: GameplayPlugin;

/**
 * @file  placement.ts
 * @brief The questions a build mode asks while a finger drags something over the ground: which cell is this, where does it sit snapped, and may it stand there.
 *
 * @details Three pure pieces and no system. {@link snapToGrid} and {@link snapFootprint} turn a free point into the place a thing of a given size sits on a grid
 *          (a 3 by 1 wall centres on the middle of its middle cell, a 2 by 2 table on a corner). {@link checkPlacement} says whether that place is clear: no
 *          collider of the physics world in it, no solid tile under it, nothing the game's own occupancy says is there, and it names what is in the way. What
 *          follows the finger (a ghost sprite), what it is tinted, what may be placed on what, and what a confirmed placement does are the game's: the
 *          engine answers the question each frame and the game draws the answer.
 *
 *          The probes are handed in rather than looked up, so a game that has no physics, or no tilemap, or keeps its buildings in its own table, passes the
 *          ones it has, and this module pulls in none of them.
 */

/** A grid the world is built on: the size of one cell, and where the corner of cell (0, 0) lies. */
interface PlacementGrid {
    cellWidth: number;
    cellHeight: number;
    originX?: number;
    originY?: number;
}
/** One cell of a grid, by column and row. */
interface GridCell {
    col: number;
    row: number;
}
/** A rectangle in the world. */
interface PlacementRect {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}
/** The cell a world point falls in. */
declare function gridCellAt(grid: PlacementGrid, x: number, y: number): GridCell;
/** The middle of a cell, in the world. */
declare function gridCellCentre(grid: PlacementGrid, col: number, row: number): {
    x: number;
    y: number;
};
/** The point snapped to the middle of the cell it is in (`'centre'`, the default) or to the nearest cell corner (`'corner'`). */
declare function snapToGrid(grid: PlacementGrid, x: number, y: number, mode?: 'centre' | 'corner'): {
    x: number;
    y: number;
    col: number;
    row: number;
};
/** Where a thing `cols` by `rows` cells big sits when its middle is dragged to a point: snapped so it covers whole cells. */
interface SnappedFootprint {
    /** The middle of the footprint, in the world: where the ghost is drawn. */
    x: number;
    y: number;
    /** The lowest cell it covers, and how many it covers each way. */
    col: number;
    row: number;
    cols: number;
    rows: number;
    rect: PlacementRect;
}
/**
 * Snaps a footprint of `cols` by `rows` cells to the grid by its middle: an odd count centres on a cell, an even one on a cell corner, each way on its own, so
 * the footprint always covers whole cells and the finger stays in the middle of it.
 */
declare function snapFootprint(grid: PlacementGrid, x: number, y: number, cols: number, rows: number): SnappedFootprint;
/** What a placement is checked against. Each is optional; a probe not given blocks nothing. */
interface PlacementProbes {
    /** The physics world: anything whose collider overlaps the footprint is in the way. */
    physics?: {
        overlapAABB(min: {
            x: number;
            y: number;
        }, max: {
            x: number;
            y: number;
        }, maskBits?: number): Entity[];
    };
    /** The collision layers the physics query asks about (all of them, by default). */
    mask?: number;
    /** Whether the ground at a world point is solid, as the game's tilemap says (`(x, y) => isTileSolid(...)`): a solid tile under any sampled point blocks. */
    solidAt?(x: number, y: number): boolean;
    /** The spacing of the points a cell is sampled at for `solidAt`, in world units (default a quarter of the smaller cell side): a solid tile narrower than this can slip between them. */
    solidStep?: number;
    /** Whether the game's own table says a cell is taken (a building already there, a zone it forbids). */
    blocked?(col: number, row: number): boolean;
    /** Entities that do not count as in the way: the thing being placed itself, and what it may stand among. */
    ignore?: ReadonlySet<Entity>;
}
/** What is in the way of a placement, or that nothing is. */
interface PlacementCheck {
    clear: boolean;
    /** The colliders in the footprint, as the physics world lists them. */
    blockers: Entity[];
    /** The cells the tilemap or the game's table says are taken, by cell of the footprint. */
    blockedCells: GridCell[];
}
/**
 * Whether a snapped footprint may stand where it is. The physics probe is asked once, with the footprint's rectangle shrunk a hair so a wall that
 * only touches its edge is not in the way; the tilemap is sampled on a lattice over each cell it covers (every `solidStep`, a quarter of a cell by default);
 * the game's table is asked of every cell.
 */
declare function checkPlacement(grid: PlacementGrid, footprint: SnappedFootprint, probes?: PlacementProbes): PlacementCheck;

/**
 * @file  nearest.ts
 * @brief The entities of a kind that stand nearest a point: the one thing an "interact" button needs to know before it decides what it does.
 *
 * @details {@link nearestEntities} walks the entities that carry a component and a `Transform`, keeps the ones within a radius that pass the game's filter, and
 *          returns them nearest first. {@link nearestMarkers} is the same over `Marker`, whose `type` is the game's own word for what an entity is (a door, a
 *          tree, a bed). What the button DOES for each kind, and which kinds count, are the game's: the engine says what is near and how far, and the game
 *          maps that to a verb.
 *
 *          The distance is measured on the screen plane (x and y) by default, or on the ground (x and z) with `plane: 'xz'`, from each entity's world position.
 *          An entity switched off with `Disabled` is not found. The cost is one pass over the entities that carry the component, which is what a button
 *          press or a once-a-frame prompt can afford over the hundreds of things a village holds; a world of many thousands wants a spatial index of its own.
 */

/** One entity found, how far it is from the point, and where it stands. */
interface NearEntity {
    entity: Entity;
    distance: number;
    x: number;
    y: number;
}
/** @experimental */
interface NearestOptions<D> {
    /** The farthest an entity may be and still be found, in world units (default: any distance). */
    radius?: number;
    /** The most entities returned, nearest first (default: all of them). */
    limit?: number;
    /** Whether an entity counts: asked with its component's data, after the radius. */
    filter?(entity: Entity, data: D): boolean;
    /** Which two world axes the distance is measured on: the screen plane (default) or the ground. */
    plane?: 'xy' | 'xz';
}
/** The entities carrying `component`, within `options.radius` of `from` and passing `options.filter`, nearest first. */
declare function nearestEntities<D>(world: World, component: ComponentDef<D>, from: {
    x: number;
    y: number;
}, options?: NearestOptions<D>): NearEntity[];
/**
 * The markers near a point, nearest first. `type` keeps only markers of that type (or any of several); `has` keeps only those whose `properties` carry every
 * given key and value.
 */
declare function nearestMarkers(world: World, from: {
    x: number;
    y: number;
}, options?: Omit<NearestOptions<MarkerData>, 'filter'> & {
    type?: string | readonly string[];
    has?: Readonly<Record<string, string>>;
}): NearEntity[];

export { Damage, FirstPersonController, FirstPersonViewModel, GameplayPlugin, Health, Hunter, MeleeAttack, MeleeAttacks, ThirdPersonCamera, ThirdPersonController, WORLD_BASIS, applyDamage, approachVelocity, cameraGroundBasis, checkPlacement, clampPitch, crouchAfter, dampFactor, decideHunterState, desiredDirection, facingYaw, gameplayPlugin, gridCellAt, gridCellCentre, huntTargets, lookAfter, nearestEntities, nearestMarkers, observeMotion, orbitOffset, pitchRotation, requestMotion, resolveMeleeHits, restoreToFull, rootMotionVelocity, shortestAngleDelta, snapFootprint, snapToGrid, turnToward, updateCameras, walkDirection, yawOfQuaternion, yawQuaternion, yawRotation };
export type { DamagePayload, FirstPersonControllerData, FirstPersonViewModelData, GridCell, HealthData, HunterData, HunterSituation, HunterState, MeleeAttackData, MeleeOverlapQuery, MoveBasis, NearEntity, NearestOptions, PlacementCheck, PlacementGrid, PlacementProbes, PlacementRect, SnappedFootprint, ThirdPersonCameraData, ThirdPersonControllerData };
