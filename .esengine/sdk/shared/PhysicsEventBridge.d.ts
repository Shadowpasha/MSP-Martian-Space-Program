import { Vec2, Entity } from './wasm.js';
import { BuiltinComponentDef, ComponentDef, Plugin, App } from './app.js';
import { Physics2DPluginConfig, PhysicsModuleFactory } from './Physics2D.js';

interface RigidBody2DData {
    bodyType: number;
    gravityScale: number;
    linearDamping: number;
    angularDamping: number;
    fixedRotation: boolean;
    bullet: boolean;
    enabled: boolean;
}
interface BoxCollider2DData {
    halfExtents: Vec2;
    offset: Vec2;
    radius: number;
    density: number;
    friction: number;
    restitution: number;
    isSensor: boolean;
    enabled: boolean;
    categoryBits: number;
    maskBits: number;
}
interface CircleCollider2DData {
    radius: number;
    offset: Vec2;
    density: number;
    friction: number;
    restitution: number;
    isSensor: boolean;
    enabled: boolean;
    categoryBits: number;
    maskBits: number;
}
interface CapsuleCollider2DData {
    radius: number;
    halfHeight: number;
    offset: Vec2;
    density: number;
    friction: number;
    restitution: number;
    isSensor: boolean;
    enabled: boolean;
    categoryBits: number;
    maskBits: number;
}
interface SegmentCollider2DData {
    point1: Vec2;
    point2: Vec2;
    density: number;
    friction: number;
    restitution: number;
    isSensor: boolean;
    enabled: boolean;
    categoryBits: number;
    maskBits: number;
}
interface PolygonCollider2DData {
    vertices: Vec2[];
    radius: number;
    density: number;
    friction: number;
    restitution: number;
    isSensor: boolean;
    enabled: boolean;
    categoryBits: number;
    maskBits: number;
}
interface ChainCollider2DData {
    points: Vec2[];
    isLoop: boolean;
    friction: number;
    restitution: number;
    categoryBits: number;
    maskBits: number;
    enabled: boolean;
}

declare const RigidBody2D: BuiltinComponentDef<RigidBody2DData>;
declare const BoxCollider2D: BuiltinComponentDef<BoxCollider2DData>;
declare const CircleCollider2D: BuiltinComponentDef<CircleCollider2DData>;
declare const CapsuleCollider2D: BuiltinComponentDef<CapsuleCollider2DData>;
declare const SegmentCollider2D: BuiltinComponentDef<SegmentCollider2DData>;
declare const PolygonCollider2D: ComponentDef<PolygonCollider2DData>;
declare const ChainCollider2D: ComponentDef<ChainCollider2DData>;
interface OneWayPlatform2DData {
    normal: Vec2;
    /** Rotate the normal with the physics body, including its parent's world rotation. */
    localSpace?: boolean;
    enabled: boolean;
}
declare const OneWayPlatform2D: ComponentDef<OneWayPlatform2DData>;
interface HingeJoint2DData {
    connectedEntity: number;
    anchorA: Vec2;
    anchorB: Vec2;
    enableMotor: boolean;
    motorSpeed: number;
    maxMotorTorque: number;
    enableLimit: boolean;
    lowerAngle: number;
    upperAngle: number;
    collideConnected: boolean;
    enabled: boolean;
}
declare const HingeJoint2D: ComponentDef<HingeJoint2DData>;
interface DistanceJoint2DData {
    connectedEntity: number;
    anchorA: Vec2;
    anchorB: Vec2;
    length: number;
    enableSpring: boolean;
    hertz: number;
    dampingRatio: number;
    enableLimit: boolean;
    minLength: number;
    maxLength: number;
    enableMotor: boolean;
    maxMotorForce: number;
    motorSpeed: number;
    collideConnected: boolean;
    enabled: boolean;
}
declare const DistanceJoint2D: ComponentDef<DistanceJoint2DData>;
interface SliderJoint2DData {
    connectedEntity: number;
    anchorA: Vec2;
    anchorB: Vec2;
    axis: Vec2;
    enableSpring: boolean;
    hertz: number;
    dampingRatio: number;
    enableLimit: boolean;
    lowerTranslation: number;
    upperTranslation: number;
    enableMotor: boolean;
    maxMotorForce: number;
    motorSpeed: number;
    collideConnected: boolean;
    enabled: boolean;
}
declare const SliderJoint2D: ComponentDef<SliderJoint2DData>;
interface FixedJoint2DData {
    connectedEntity: number;
    anchorA: Vec2;
    anchorB: Vec2;
    linearHertz: number;
    angularHertz: number;
    linearDampingRatio: number;
    angularDampingRatio: number;
    collideConnected: boolean;
    enabled: boolean;
}
declare const FixedJoint2D: ComponentDef<FixedJoint2DData>;
interface WheelJoint2DData {
    connectedEntity: number;
    anchorA: Vec2;
    anchorB: Vec2;
    axis: Vec2;
    enableSpring: boolean;
    hertz: number;
    dampingRatio: number;
    enableLimit: boolean;
    lowerTranslation: number;
    upperTranslation: number;
    enableMotor: boolean;
    maxMotorTorque: number;
    motorSpeed: number;
    collideConnected: boolean;
    enabled: boolean;
}
declare const WheelJoint2D: ComponentDef<WheelJoint2DData>;
interface MotorJoint2DData {
    connectedEntity: number;
    linearVelocity: Vec2;
    maxVelocityForce: number;
    angularVelocity: number;
    maxVelocityTorque: number;
    linearHertz: number;
    linearDampingRatio: number;
    maxSpringForce: number;
    angularHertz: number;
    angularDampingRatio: number;
    maxSpringTorque: number;
    collideConnected: boolean;
    enabled: boolean;
}
declare const MotorJoint2D: ComponentDef<MotorJoint2DData>;

/** The fields of the `CharacterController2D` component, whose tier this shape carries.
 *  @beta */
interface CharacterController2DData {
    /** Desired velocity in world pixels/second; set it from gameplay each step. */
    velocity: Vec2;
    /** Up direction for floor/ceiling classification (opposes gravity). */
    up: Vec2;
    /** Max walkable slope, measured from `up` (radians). Steeper = wall. */
    floorMaxAngle: number;
    /** Slide iterations per move (corners need more than one). */
    maxSlides: number;
    /** Gap kept from surfaces (pixels) so the body doesn't stick/jitter. */
    skinWidth: number;
    /** Down-probe length (pixels) to stay glued to floors on slopes/stairs; 0 = off. */
    snapLength: number;
    /** When false, a ceiling hit stops the remaining move instead of sliding along it. */
    slideOnCeiling: boolean;
    /** Collision layers that block the character. */
    maskBits: number;
    /** The highest ledge it walks up without jumping (pixels); 0 = only what its rounded foot rides over. */
    stepHeight: number;
    /** Stand still on a walkable slope, and walk it without being slowed or sped by gravity. */
    stopOnSlope: boolean;
    /** Keep the speed asked for along a slope, rather than the speed across the ground. */
    constantSlopeSpeed: boolean;
    /** A slope past `floorMaxAngle` is a wall to walk into, and it slides down it. Off, it walks straight up. */
    blockSteepSlopes: boolean;
    /** Move with what it stands on. */
    followPlatform: boolean;
    /** How it meets dynamic bodies: a {@link CharacterDynamicBodies}. */
    dynamicBodies: number;
    /** Push: the most force it pushes with, in Newtons, as physics measures it. */
    pushForce: number;
    /** Pass through one-way platforms while this is on. */
    dropThrough: boolean;
    /** Output: touched a surface classified as floor this move. */
    isOnFloor: boolean;
    /** Output: touched a surface classified as wall this move. */
    isOnWall: boolean;
    /** Output: touched a surface classified as ceiling this move. */
    isOnCeiling: boolean;
    /** Output: normal of the last floor touched (zero when airborne). */
    floorNormal: Vec2;
    /** Output: actual displacement / dt after collisions (pixels/second). */
    realVelocity: Vec2;
    /** Output: the entity it stands on; 0 when airborne. */
    floorEntity: Entity;
    /** Output: the velocity of what it stands on (pixels/second). */
    floorVelocity: Vec2;
}
/** How a character meets dynamic bodies. @experimental */
declare const CharacterDynamicBodies: {
    /** They stop it, and stay where they are. */
    readonly Block: 0;
    /** They stop it, and it pushes them with up to `pushForce`. */
    readonly Push: 1;
    /** It passes through. */
    readonly Ignore: 2;
};
/**
 * A kinematic mover for a player or an NPC: it sweeps rather than being pushed,
 * so it never tunnels and never inherits a rigid body's momentum.
 *
 * @beta
 */
declare const CharacterController2D: ComponentDef<CharacterController2DData>;
/** Nearest blocking hit along a sweep: surface `n*` and the `[0,1]` sweep fraction. */
interface SlideHit {
    nx: number;
    ny: number;
    fraction: number;
}
/**
 * Sweep the character shape from `(ox,oy)` by `(dx,dy)` (pixels) and return the
 * nearest hit that blocks it, or `null` for a clear path. Self-collision and the
 * mask filter are the caller's responsibility.
 */
type SlideCast = (ox: number, oy: number, dx: number, dy: number) => SlideHit | null;
interface MoveAndSlideParams {
    startX: number;
    startY: number;
    motionX: number;
    motionY: number;
    velX: number;
    velY: number;
    upX: number;
    upY: number;
    floorMaxAngle: number;
    maxSlides: number;
    skinWidth: number;
    snapLength: number;
    slideOnCeiling: boolean;
    wasOnFloor: boolean;
}
interface MoveAndSlideResult {
    x: number;
    y: number;
    velX: number;
    velY: number;
    isOnFloor: boolean;
    isOnWall: boolean;
    isOnCeiling: boolean;
    floorNormalX: number;
    floorNormalY: number;
}
/**
 * Resolve one move: advance toward the first contact, classify the surface, then
 * project the leftover motion (and velocity) onto it and repeat. Velocity is slid
 * by the same projections so a grounded body's downward gravity doesn't accumulate
 * — the contract matches Godot's `move_and_slide`.
 */
declare function moveAndSlide(p: MoveAndSlideParams, cast: SlideCast): MoveAndSlideResult;

/**
 * @file    PlatformerController2D.ts
 * @brief   What a side-on character wants: run, jump, drop through. CharacterController2D is what the world makes of it.
 *
 * @details The forgiveness a platformer is judged on lives here, and on its own clock. A jump pressed a moment before landing still
 *          happens, and one pressed a moment after running off a ledge does too. Input is read per rendered frame and latched, so a tap
 *          between two fixed steps is not lost, and consumed on the fixed step, where the character actually moves.
 */

/** The fields of the `PlatformerController2D` component. @experimental */
interface PlatformerController2DData {
    /** Top running speed, world pixels per second. */
    moveSpeed: number;
    /** How fast it reaches that speed on the ground, and in the air. */
    groundAcceleration: number;
    airAcceleration: number;
    /** How fast it sheds it when the stick centres, on the ground and in the air. */
    groundDeceleration: number;
    airDeceleration: number;
    /** Downward acceleration, world pixels per second squared. */
    gravity: number;
    /** Gravity multiplier while falling. Above 1 lands faster than it rose, which reads as weight. */
    fallGravityScale: number;
    /** The fastest it falls. */
    maxFallSpeed: number;
    /** Upward speed a jump starts with; 0 disables jumping. */
    jumpSpeed: number;
    /** How much of a rising speed survives letting go of jump, 0..1. 1 makes every jump full height. */
    jumpCut: number;
    /** Seconds after leaving the ground that a jump still counts as from the ground. */
    coyoteTime: number;
    /** Seconds a jump pressed too early is remembered, to happen on landing. */
    jumpBuffer: number;
    /** Extra jumps before landing again. */
    airJumps: number;
    /** Seconds a drop through a one-way platform lasts. */
    dropTime: number;
    /** A jump keeps the velocity of the platform it left. */
    keepPlatformVelocity: boolean;
    /** Read the keyboard itself. Off, a game or an AI writes `moveInput`, `jumpHeld`, `jumpPressed` and `dropPressed`. */
    readKeyboard: boolean;
    /** Input: -1 left to 1 right. */
    moveInput: number;
    /** Input: the jump button is down. */
    jumpHeld: boolean;
    /** Input: the jump button went down. Consumed by the next fixed step. */
    jumpPressed: boolean;
    /** Input: ask to drop through a one-way platform. Consumed by the next fixed step. */
    dropPressed: boolean;
    enabled: boolean;
}
/**
 * Runs and jumps a CharacterController2D, with the forgiveness a platformer needs.
 *
 * @experimental
 */
declare const PlatformerController2D: ComponentDef<PlatformerController2DData>;

/**
 * @file    polygonHull2D.ts
 * @brief   The polygon Box2D actually builds from one set of points.
 *
 * @details Handing `b2CreatePolygonShape` a ring is not handing it that ring: it
 *          takes the CONVEX HULL, welding points within slop, dropping ones its
 *          neighbours already span, and refusing the lot when fewer than three
 *          survive. A caller that does not know this draws shapes nobody can hit.
 *
 *          A port of `b2ComputeHull` (third_party/box2d/src/hull.c), kept faithful
 *          to its welding and collinear slop because its whole job is AGREEMENT.
 *          Concavity is answered a level up, in {@link decomposePolygon2D}, which
 *          uses this to know what the solver will make of each piece it proposes.
 *
 *          Units are physics metres — the slop below is metres, so a hull
 *          computed in pixels would weld at a thousand times the real tolerance.
 */

/**
 * The most vertices Box2D stores in ONE polygon (`B2_MAX_POLYGON_VERTICES`). It
 * caps a convex piece, not what an author may draw: a ring past it is divided
 * into pieces that each fit.
 */
declare const MAX_POLYGON_VERTICES = 8;
/** Fewer than a triangle is not a polygon: Box2D builds no shape from it. */
declare const MIN_POLYGON_VERTICES = 3;
/**
 * The convex hull Box2D builds from `vertices`, counter-clockwise, in metres.
 * Empty when Box2D builds no shape: fewer than three vertices survive welding,
 * or every surviving one is collinear.
 */
declare function computePolygonHull(vertices: readonly Vec2[]): Vec2[];

/**
 * @file    polygonDecompose2D.ts
 * @brief   The convex pieces a concave collider ring collides as.
 *
 * @details Box2D builds only convex polygons, and only eight vertices of one. A
 *          ring that is neither is not a shape it can take — but it IS a union of
 *          shapes it can take, so the limit belongs to a PIECE rather than to
 *          what an author may draw.
 *
 *          Ear clipping to triangles, then merging neighbours back while the
 *          result stays convex and within the cap. The merge works on vertex
 *          INDICES, so two pieces share an edge exactly rather than within a
 *          tolerance: float comparison at a seam is how a partition develops
 *          gaps nothing can be pushed out of.
 *
 *          Every piece is finally passed through {@link computePolygonHull},
 *          which is what Box2D will do to it. A sliver the solver would refuse
 *          is dropped here instead of silently becoming no shape at run time.
 */

/** What a collider ring collides as, once Box2D's two constraints are applied.
 *  Shared with every caller that asks about the same ring, so treat it as frozen. */
interface PolygonDecomposition {
    /** Convex pieces, each counter-clockwise and within the solver's vertex cap. */
    readonly pieces: readonly Vec2[][];
    /** The ring crosses itself, so no partition of it exists: `pieces` is the
     *  convex hull, which is what the solver falls back to. */
    degenerate: boolean;
}
/**
 * The convex pieces `vertices` collides as. A ring already convex and within the
 * cap is ONE piece and the same points, so the common shape costs nothing and
 * keeps the identity an author drew.
 */
declare function decomposePolygon2D(vertices: readonly Vec2[]): PolygonDecomposition;

/**
 * @file    Physics2DPlugin.ts
 * @brief   Physics2DAPI plugin — async wasm load + resource wiring
 *
 * Thin orchestration layer. Types live in `PhysicsTypes.ts`,
 * the Physics2DAPI API class in `Physics2DAPI.ts`, and the per-frame loop
 * + entity-tracking state in `PhysicsSystem.ts`. This file just
 * loads the wasm module, wires resources, and hands off to the
 * system layer.
 */

declare class Physics2DPlugin implements Plugin {
    name: string;
    private config_;
    private wasmUrl_;
    private factory_?;
    private readonly instances_;
    private latestInstance_;
    constructor(wasmUrl: string, config?: Physics2DPluginConfig, factory?: PhysicsModuleFactory);
    build(app: App): void;
    /**
     * Shut the native Box2D world down on app teardown. Without this,
     * `_physics_shutdown` was dead code and the C++ physics world (bodies,
     * joints, contact state) leaked across an engine re-init. The bridge-guarded
     * module makes the call abort-safe; null after so a double cleanup is a no-op.
     */
    cleanup(app?: App): void;
}
declare function physics2dPlugin(wasmUrl: string, config?: Physics2DPluginConfig, factory?: PhysicsModuleFactory): Physics2DPlugin;

/**
 * @file    PhysicsEventBridge.ts
 * @brief   Contacts and sensor overlaps, republished on the entity event channel.
 *
 * `Physics2DEvents` is a per-frame batch resource: excellent for a system that
 * wants every contact this tick, useless for "when THIS entity is touched". The
 * bridge turns each batch entry into an entity-scoped event on the shared queue
 * — the same channel a button's `click` travels — which is what lets an authored
 * `EventBinding` row wire a trigger area with no code, exactly like a widget.
 *
 * Both participants hear it. A contact has no privileged side, and a trigger's
 * two roles (the area, and whoever walked into it) both routinely want to react;
 * each side receives the OTHER entity in the payload.
 */

/**
 * The event types the physics bridge emits. Open strings, like every other
 * producer's — these constants exist so the editor's palette and game code spell
 * them the same way (mirrors `UIEventType`).
 */
declare const Physics2DEventType: {
    readonly CollisionEnter: "collision_enter";
    readonly CollisionExit: "collision_exit";
    readonly CollisionHit: "collision_hit";
    readonly TriggerEnter: "trigger_enter";
    readonly TriggerExit: "trigger_exit";
};
type Physics2DEventType = typeof Physics2DEventType[keyof typeof Physics2DEventType];
/** Payload carried by every bridged event: who else was involved. */
interface Physics2DContactEventData {
    /** The other participant — the body touched, or the trigger/visitor. */
    other: Entity;
    /** True on the sensor's own `trigger_*` event (false on the visitor's). */
    isSensor?: boolean;
    /** Approach speed, on `collision_hit` only. */
    approachSpeed?: number;
}
/**
 * Republish this frame's physics batch onto the entity event channel. Runs in
 * Update (after the fixed-step physics has filled the resource) and only in play
 * mode — the edit realm never steps the world.
 */
declare function registerPhysics2DEventBridge(app: App): void;

export { BoxCollider2D, CapsuleCollider2D, ChainCollider2D, CharacterController2D, CharacterDynamicBodies, CircleCollider2D, DistanceJoint2D, FixedJoint2D, HingeJoint2D, MAX_POLYGON_VERTICES, MIN_POLYGON_VERTICES, MotorJoint2D, OneWayPlatform2D, Physics2DEventType, Physics2DPlugin, PlatformerController2D, PolygonCollider2D, RigidBody2D, SegmentCollider2D, SliderJoint2D, WheelJoint2D, computePolygonHull, decomposePolygon2D, moveAndSlide, physics2dPlugin, registerPhysics2DEventBridge };
export type { BoxCollider2DData, CapsuleCollider2DData, ChainCollider2DData, CharacterController2DData, CircleCollider2DData, DistanceJoint2DData, FixedJoint2DData, HingeJoint2DData, MotorJoint2DData, MoveAndSlideParams, MoveAndSlideResult, OneWayPlatform2DData, Physics2DContactEventData, PlatformerController2DData, PolygonCollider2DData, PolygonDecomposition, RigidBody2DData, SegmentCollider2DData, SlideCast, SlideHit, SliderJoint2DData, WheelJoint2DData };
