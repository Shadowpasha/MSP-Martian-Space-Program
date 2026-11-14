import { BuiltinComponentDef, BoxCollider3DData, CapsuleCollider3DData, CharacterController3DData, ConvexCollider3DData, MeshCollider3DData, RigidBody3DData, SphereCollider3DData, ComponentDef, World, App, Plugin } from './app.js';
import { Vec3, Entity, Quat } from './wasm.js';
import { ResourceDef } from './resource.js';
import { Physics3DWasmModule, Physics3DEventsData, Physics3DQueries, Physics3DModuleFactory } from './Physics3DQueries.js';

declare const RigidBody3D: BuiltinComponentDef<RigidBody3DData>;
declare const BoxCollider3D: BuiltinComponentDef<BoxCollider3DData>;
declare const SphereCollider3D: BuiltinComponentDef<SphereCollider3DData>;
declare const CapsuleCollider3D: BuiltinComponentDef<CapsuleCollider3DData>;
/**
 * Imported geometry used as it is, for a level to collide against. Always static:
 * a triangle soup has no inertia tensor, so there is nothing for a solver to push.
 *
 * @experimental
 */
declare const MeshCollider3D: BuiltinComponentDef<MeshCollider3DData>;
/**
 * The convex hull of imported geometry — what a `MeshCollider3D` cannot be. A
 * triangle soup has no inertia tensor and is scenery whatever its body says; a
 * hull is a volume a solver pushes as readily as a box.
 *
 * @experimental
 */
declare const ConvexCollider3D: BuiltinComponentDef<ConvexCollider3DData>;
/**
 * A kinematic mover for a 3D player or NPC: swept against the world rather than
 * solved in it. Set `velocity` each step and read `isOnFloor` back; the vertical
 * component is carried for you, so a zero there means "walk", not "hang".
 *
 * @experimental
 */
declare const CharacterController3D: BuiltinComponentDef<CharacterController3DData>;

/** Axis motion for SixDOF joints. @experimental */
declare const JointMotion3D: {
    readonly Locked: 0;
    readonly Limited: 1;
    readonly Free: 2;
};
interface JointFrame3D {
    connectedEntity: number;
    anchor: Vec3;
    axis: Vec3;
    normalAxis: Vec3;
    enableMotor: boolean;
    /** Body B's target angular velocity relative to A, in constraint axes, rad/s. */
    angularVelocity: Vec3;
    maxMotorTorque: number;
    collideConnected: boolean;
    enabled: boolean;
}
/** Shoulder/hip rotation about a twist axis with an elliptical swing cone. @experimental */
interface SwingTwistJoint3DData extends JointFrame3D {
    normalHalfConeAngle: number;
    planeHalfConeAngle: number;
    twistMinAngle: number;
    twistMaxAngle: number;
}
/** Translation is in world units; angles are radians. Zero is the creation pose. @experimental */
interface SixDOFJoint3DData extends JointFrame3D {
    /** X/Y/Z: JointMotion3D.Locked, Limited or Free. */
    translationMotion: Vec3;
    rotationMotion: Vec3;
    translationLower: Vec3;
    translationUpper: Vec3;
    rotationLower: Vec3;
    rotationUpper: Vec3;
    /** Body B's target velocity relative to A, in constraint axes, world units/s. */
    linearVelocity: Vec3;
    maxMotorForce: number;
}
/** A limited ball joint with separate twist limits. Angles are radians. @experimental */
declare const SwingTwistJoint3D: ComponentDef<SwingTwistJoint3DData>;
/** Six axes independently locked, limited or free; optional velocity motors. @experimental */
declare const SixDOFJoint3D: ComponentDef<SixDOFJoint3DData>;
/** Returns an explanation for invalid settings, or null when they are valid. @experimental */
declare function joint3DSettingsError(d: SwingTwistJoint3DData | SixDOFJoint3DData): string | null;

interface PointJoint3DData {
    connectedEntity: number;
    anchor: Vec3;
    collideConnected: boolean;
    enabled: boolean;
}
/**
 * A shared point the two bodies turn freely about — a chain link, a ragdoll limb.
 *
 * @experimental
 */
declare const PointJoint3D: ComponentDef<PointJoint3DData>;
interface HingeJoint3DData {
    connectedEntity: number;
    anchor: Vec3;
    axis: Vec3;
    enableLimit: boolean;
    lowerAngle: number;
    upperAngle: number;
    enableMotor: boolean;
    motorSpeed: number;
    maxMotorTorque: number;
    collideConnected: boolean;
    enabled: boolean;
    /** Where the hinge is now, in radians. Written by the world each step. */
    angle: number;
}
/**
 * One axis of rotation — a door, a lever, a driven wheel. Limits are radians
 * measured from the pose the joint was made in, so zero is where you placed it.
 *
 * @experimental
 */
declare const HingeJoint3D: ComponentDef<HingeJoint3DData>;
interface SliderJoint3DData {
    connectedEntity: number;
    anchor: Vec3;
    axis: Vec3;
    enableLimit: boolean;
    lowerTranslation: number;
    upperTranslation: number;
    enableMotor: boolean;
    motorSpeed: number;
    maxMotorForce: number;
    collideConnected: boolean;
    enabled: boolean;
    /** How far along the axis it has travelled, in world units. Written by the
     *  world each step. */
    translation: number;
}
/**
 * One axis of travel — a lift, a piston, a sliding door. Limits are world units
 * along `axis`, again measured from where the joint was made.
 *
 * @experimental
 */
declare const SliderJoint3D: ComponentDef<SliderJoint3DData>;
interface DistanceJoint3DData {
    connectedEntity: number;
    anchor: Vec3;
    connectedAnchor: Vec3;
    minLength: number;
    maxLength: number;
    frequency: number;
    damping: number;
    collideConnected: boolean;
    enabled: boolean;
}
/**
 * A distance kept between two points: a rope when only `maxLength` matters, a rod
 * when the two lengths meet, a spring when `frequency` is above zero.
 *
 * @experimental
 */
declare const DistanceJoint3D: ComponentDef<DistanceJoint3DData>;
interface FixedJoint3DData {
    connectedEntity: number;
    collideConnected: boolean;
    enabled: boolean;
}
/**
 * No freedom at all: the two move as one. It has no anchor — the pose the pieces
 * are in when the joint is made is the joint.
 *
 * @experimental
 */
declare const FixedJoint3D: ComponentDef<FixedJoint3DData>;
/** What the world holds for one joint: the two bodies it was built between, which
 *  are what it takes to take the joint back out again. */
interface Joint3DRecord {
    bodyA: number;
    bodyB: number;
    /** Which component built it — a joint whose component changed is rebuilt. */
    type: string;
    /** The motor the world was last told about, so a joint is only re-driven when
     *  gameplay actually changed it. */
    motorOn: boolean;
    motorSpeed: number;
    settings?: string;
    motorSettings?: string;
}
type Joint3DMap = Map<Entity, Joint3DRecord>;
/** One joint as a visualizer needs it: which rule, what it connects, and the
 *  local geometry that positions it. Anchors and axes are in the declaring
 *  entity's own space, in world units. */
interface Joint3DShape {
    type: string;
    connectedEntity: number;
    /** Null for a fixed joint, which has no anchor — the pose is the joint. */
    anchor: Vec3 | null;
    /** The far anchor, on the connected entity. Distance joints only. */
    connectedAnchor: Vec3 | null;
    /** The axis a hinge turns about or a slider travels along. */
    axis: Vec3 | null;
    enabled: boolean;
    limits?: SwingTwistJoint3DData | SixDOFJoint3DData;
}
/**
 * The joint an entity declares, in the shape a gizmo draws — the SAME first-wins
 * choice the world makes, so an editor never draws a joint the solver ignored.
 */
declare function readJoint3D(world: World, entity: number): Joint3DShape | null;

/**
 * @file    ragdoll.ts
 * @brief   A skinned character that goes limp: its bones become bodies joined by swing/twist limits, and give the pose back to the animation after.
 *
 * @details A `Ragdoll` is read off the skeleton a character already has (the joints its `MeshSkin` names), so there is nothing to author beyond the
 *          switch and a few numbers. Turning `active` on gives each bone that is long enough a box along the bone (a box, because a capsule is
 *          aligned to its body's y and a bone is not) and a `SwingTwistJoint3D` to the nearest bone above it that has one, at the pose the animation had that frame,
 *          so nothing snaps. The bodies are the ordinary 3D physics ones: the solver writes each bone's pose back through the hierarchy, and the
 *          skin follows. The animation keeps running underneath and the bodies' pose is put back over it each frame.
 *
 *          Turning it off removes the bodies and lets the animation drive again, and over `recoverTime` seconds blends from the pose the body
 *          was in to the one the animation gives, so a character does not pop upright. That is the whole of a passive ragdoll; driving the limbs
 *          (a motor, a stand-up pose match) is left for later.
 */

/** How a ragdoll's joints are limited. */
declare const RagdollProfile: {
    /** Every joint gets `swing` and `twist`. */
    readonly Uniform: 0;
    /** Each joint gets the share of them its part of a body has, read from the bone's name: a spine stiff, a shoulder loose, a shin almost a hinge. A bone the names do not place gets all of it. */
    readonly Humanoid: 1;
};
/** Which of its own axes a character looks along. */
declare const RagdollFacing: {
    readonly PlusZ: 0;
    readonly MinusZ: 1;
    readonly PlusX: 2;
    readonly MinusX: 3;
};
/** The fields of the `Ragdoll` component. @experimental */
interface RagdollData {
    /** Whether the character is limp. Turn it on when it is knocked down, off to stand it up. */
    active: boolean;
    /** The entity that holds the `MeshSkin` whose joints are the skeleton. 0 looks on this entity and then below it. */
    skin: number;
    /** {@link RagdollProfile}: whether every joint gets the same limits, or each the limits its part of a body has. */
    profile: number;
    /** How far a limb may swing from its bone's line, in degrees, either way. With the humanoid profile this is the most a loose joint (a shoulder, a hip) is given. */
    swing: number;
    /** How far a limb may twist about its own line, in degrees, either way. With the humanoid profile this is the most a loose joint is given. */
    twist: number;
    /** How far a knee or an elbow may bend, in degrees, and only one way: a shin folds back, a forearm folds forward. 0 leaves them swinging like any other joint. Humanoid profile only. */
    bend: number;
    /** {@link RagdollFacing}: which way the character looks, in its own frame. It is what tells a knee from a hyperextended one. */
    facing: number;
    /** A limb's thickness as a fraction of its length. */
    thickness: number;
    /** A bone shorter than this (world units) gets no body of its own: a finger, a toe. Its parent carries it. */
    minBoneLength: number;
    friction: number;
    /** Seconds to blend from the limp pose back to the animation once `active` is turned off. 0 pops. */
    recoverTime: number;
}
/**
 * A skinned character that can go limp.
 *
 * @experimental
 */
declare const Ragdoll: ComponentDef<RagdollData>;
/** The fields of the `RagdollJoint` component. @experimental */
interface RagdollJointData {
    /** Whether this bone gets a body of its own. Off, the bone above carries it. */
    body: boolean;
    /** Whether the limits below stand in for the ones the profile would give this joint. */
    custom: boolean;
    /** How far the limb may swing from its bone's line, in degrees, either way. */
    swing: number;
    /** How far the limb may twist about its own line, in degrees, either way. */
    twist: number;
    /** How far it may bend, in degrees, one way only (a knee, an elbow). 0 is an ordinary swing and twist joint. */
    bend: number;
    /** Which way a bend goes where the bone's name does not say: 0 as its name says (a shin back, a forearm forward), 1 toward the way the character faces, -1 away from it. */
    fold: number;
}
/**
 * What the author says of one bone of a ragdoll: that it gets no body, or limits of its own. Put it on the bone's entity.
 *
 * @experimental
 */
declare const RagdollJoint: ComponentDef<RagdollJointData>;
/** A bone as the plan reads it: where it is in the world, and the nearest bone above it. */
interface RagdollBone {
    id: number;
    /** What the bone is called, which is how the humanoid profile tells a knee from a shoulder. */
    name?: string;
    /** What the author said of this bone in a {@link RagdollJoint}: no body, or limits of its own, in degrees. */
    override?: {
        body?: boolean;
        swing?: number;
        twist?: number;
        bend?: number;
        fold?: number;
    };
    parent: number | null;
    position: Vec3;
    rotation: Quat;
}
/** What one limb is made of: a box in its bone's frame, and the joint to the limb above. */
interface RagdollLimb {
    entity: number;
    /** The limb whose body this one is joined to; null for the topmost, which hangs from nothing. */
    connected: number | null;
    halfExtents: Vec3;
    center: Vec3;
    /** The twist axis and a reference perpendicular to it, in this bone's own frame. */
    axis: Vec3;
    normalAxis: Vec3;
    /** The share (0 to 1) of the component's swing and twist this joint gets. */
    swing: number;
    twist: number;
    /** Limits the author gave this bone in degrees, which stand in for the share of the component's. */
    swingDeg?: number;
    twistDeg?: number;
    /**
     * Set where the joint is a one-way hinge (a knee, an elbow): the hinge axis and a reference perpendicular to it, in this bone's own frame, and
     * how far the bone may turn about it either way from the pose it is in when the joint is made, in radians (the lower is at most 0, the upper at least 0).
     */
    hinge?: {
        axis: Vec3;
        normalAxis: Vec3;
        lower: number;
        upper: number;
    };
}
/** The parts of a body whose joints are limited differently. */
type BoneClass = 'spine' | 'neck' | 'head' | 'shoulder' | 'upperArm' | 'forearm' | 'hand' | 'thigh' | 'shin' | 'foot' | 'toe' | 'other';
/** The share of the swing and twist each part gets: a trunk bends little, a shoulder and a hip go round, a knee and an elbow are almost hinges. */
declare const BONE_LIMITS: Readonly<Record<BoneClass, {
    swing: number;
    twist: number;
}>>;
/**
 * Which part of a body a bone is, from its name (Rigify's `DEF-upper_arm.L`, Mixamo's `LeftArm`, a plain `forearm_r`). The checks go from the more specific to the less, because
 * a forearm is also an arm and a shin a leg.
 *
 * @experimental
 */
declare function classifyBone(name: string | undefined): BoneClass;
/**
 * The limbs a skeleton is made into. Pure: bones in, limbs out, parents before children.
 *
 * A bone points at its longest child; one with no children (a hand, a head) takes its parent's line and half its length. A bone shorter than
 * `minBoneLength` gets no limb, and what hangs from it hangs from the limb above.
 *
 * @experimental
 */
declare function planRagdoll(bones: readonly RagdollBone[], options: {
    thickness: number;
    minBoneLength: number;
    profile?: number;
    bend?: number;
    forward?: Vec3;
}): RagdollLimb[];
/** What a ragdoll is made of: the skeleton it reads, and what each limb gets (a body, and a joint to the limb above). */
interface RagdollPlan {
    skin: Entity;
    bones: Entity[];
    limbs: Array<{
        limb: RagdollLimb;
        /** The joint it is given: swing and twist, or a one-way hinge as a six-axis joint. Absent for the topmost limb. */
        joint: {
            kind: 'swingTwist';
            data: SwingTwistJoint3DData;
        } | {
            kind: 'sixDOF';
            data: SixDOFJoint3DData;
        } | null;
    }>;
}
/**
 * What `entity`'s ragdoll would be made of from the pose its skeleton is in now: the same answer the ragdoll builds its bodies from, so the editor can draw it before anything runs.
 * Null where there is no skinned mesh to read.
 *
 * @experimental
 */
declare function ragdollPlan(world: World, entity: Entity, data: RagdollData): RagdollPlan | null;

interface Physics3DDebugDrawConfig {
    enabled: boolean;
    showColliders: boolean;
    showContacts: boolean;
}
/** Off until a game turns it on: a debug overlay costs a line per edge per frame. */
declare const Physics3DDebugDraw: ResourceDef<Physics3DDebugDrawConfig>;
interface Contact3D {
    pointX: number;
    pointY: number;
    pointZ: number;
}
declare function drawPhysics3DDebug(app: App, contacts?: readonly Contact3D[]): void;
/** Installed by the 3D physics plugin; the resource decides whether it draws. */
declare function setupPhysics3DDebugDraw(app: App, contacts: () => readonly Contact3D[]): void;

/**
 * @file    ColliderShape3D.ts
 * @brief   The single geometry projection over the 3D collider components — the
 *          shared seam for every visualizer of the 3D world.
 * @details A 3D collider is invisible in a way a 2D one never was: the shape is
 *          not the sprite, the entity may be rotated on three axes, and nothing
 *          on screen says how big the box around a model is. This reads the
 *          components into shape descriptors and emits wireframes from them, so
 *          the editor gizmo and any runtime overlay draw the same geometry.
 *
 *          What it reports is what the SOLVER builds, not what the scene carries:
 *          the running world gives an entity ONE body shape, chosen in the order
 *          {@link readCollider3DShapes} walks, and none at all without an enabled
 *          RigidBody3D. A gizmo that drew every authored collider would promise
 *          collisions that do not happen.
 *
 * Units: 3D collider fields are world units already (the system divides by
 * pixels-per-unit on its way into the solver), so nothing here scales.
 */

/** Points per full circle in a sphere/capsule wireframe. */
declare const COLLIDER3D_RING_SEGMENTS = 24;
/** A 3D collider's geometry in entity-local space, in world units. */
type Collider3DShape = {
    rotation?: Quat;
} & ({
    kind: 'box';
    halfExtents: Vec3;
    center: Vec3;
} | {
    kind: 'sphere';
    radius: number;
    center?: Vec3;
} | {
    kind: 'capsule';
    radius: number;
    halfHeight: number;
    center?: Vec3;
});
/** Which component authored a shape — the Inspector target behind a gizmo. */
type Collider3DComponent = 'CompoundCollider3D' | 'BoxCollider3D' | 'SphereCollider3D' | 'CapsuleCollider3D' | 'MeshCollider3D' | 'ConvexCollider3D' | 'CharacterController3D';
interface Collider3DInstance {
    component: Collider3DComponent;
    shape: Collider3DShape;
    isSensor: boolean;
    /** Whether the running world builds this shape. False for a disabled collider,
     *  one shadowed by a higher-priority shape on the same entity, one whose mesh
     *  never loaded, or any collider on an entity with no enabled RigidBody3D —
     *  all authorable, none of them in the solver. */
    active: boolean;
}
/** Turn a vector by a rotation — what places an anchor, an axis or a wireframe
 *  vertex in the world. The maths is the math module's; this is its name here. */
declare function rotateVec3ByQuat(rot: Quat, v: Vec3): Vec3;
/**
 * Every 3D collider on `entity`, each marked with whether it is the one the solver
 * ends up building. The order mirrors `createBody` in Physics3DSystem — box, sphere,
 * mesh, hull, capsule — and must keep mirroring it: a visualizer drawing a different
 * shape than the world collides with is worse than none.
 */
declare function readCollider3DShapes(world: World, entity: number): Collider3DInstance[];
/**
 * The shape's wireframe as entity-local polylines (world units, unrotated).
 * A box gives its 12 edges; a sphere three great circles; a capsule two rings,
 * four caps and the four lines between them.
 */
declare function collider3DWireframe(shape: Collider3DShape, segments?: number): Vec3[][];
/**
 * Local polylines placed in the world by an entity's position and rotation.
 *
 * Scale is deliberately left out: the solver builds the shape from the collider's
 * own numbers, so a scaled entity still collides at its authored size and a gizmo
 * that grew with the scale would be drawing a body that does not exist.
 */
declare function placeCollider3DWireframe(lines: Vec3[][], position: Vec3, rotation: Quat): Vec3[][];

/** One piece of static geometry, in world units. */
interface CollisionPiece {
    /** The entity the piece belongs to: what a contact or a ray that hits it reports. */
    owner: Entity;
    /** Where the piece's positions are measured from, in the world. */
    origin: readonly [number, number, number];
    /** `vertexCount * 3` floats, relative to `origin`. */
    positions: Float32Array;
    /** Three a triangle, counter-clockwise seen from the side that faces out. */
    indices: Uint32Array;
    friction: number;
    restitution: number;
    /** The collision layer (0 to 15). */
    layer: number;
}
/** The pieces now, by key. */
declare class CollisionGeometry {
    private readonly pieces_;
    /** Bumped on every change, so a reader can skip a frame where nothing changed. */
    revision: number;
    set(key: string, piece: CollisionPiece): void;
    delete(key: string): void;
    get(key: string): CollisionPiece | undefined;
    /** Deletes every piece whose key starts with `prefix`. */
    deleteAll(prefix: string): void;
    entries(): IterableIterator<[string, CollisionPiece]>;
    get size(): number;
}
declare const CollisionGeometryRes: ResourceDef<CollisionGeometry>;
/** The app's collision geometry, installed on first use. */
declare function collisionGeometryOf(app: App): CollisionGeometry;

/**
 * @file    Physics3DSystem.ts
 * @brief   Keeps the 3D world and the ECS saying the same thing.
 * @details Each fixed step: entities that gained a RigidBody3D get a body, ones
 *          that lost it give theirs back, the world advances, and what moved is
 *          written to its Transform.
 *
 *          Positions cross in METRES and land in world units, the same
 *          pixels-per-unit contract the 2D world uses: a solver tuned for metres
 *          behaves nothing like itself when a character is 180 units tall.
 */

interface Physics3DConfig {
    /** Layer i collides with layer j when bit j of `layerMasks[i]` is set AND bit
     *  i of `layerMasks[j]` is. Absent leaves every layer colliding with all. */
    layerMasks?: number[];
    gravity: {
        x: number;
        y: number;
        z: number;
    };
    fixedTimestep: number;
    collisionSteps: number;
    pixelsPerUnit: number;
    maxBodies: number;
    /** Solver passes; 0 keeps the backend's own (Jolt 10 / PhysX 1). */
    velocityIterations: number;
    /** 0 keeps the backend's own (Jolt 2 / PhysX 6). */
    positionIterations: number;
    /** Resting bodies stop being simulated until something touches them. */
    enableSleep: boolean;
    /** Slower impacts than this (m/s) do not bounce; 0 keeps the backend's own (Jolt 1 / PhysX 2). */
    bounceThreshold: number;
}
declare const DEFAULT_PHYSICS3D_CONFIG: Physics3DConfig;
/** Which body an entity owns, so a removed component takes its body with it. */
type BodyMap = Map<Entity, number>;
/** The body each piece of collision geometry was built as, by its key, and the piece it was built from. */
type PieceMap = Map<string, {
    piece: CollisionPiece;
    id: number;
}>;
/** Bring the world's population in line with the ECS, then step and read back. */
declare function stepPhysics3D(app: App, module: Physics3DWasmModule, bodies: BodyMap, config: Physics3DConfig, characters?: BodyMap, events?: Physics3DEventsData, joints?: Joint3DMap, pieces?: PieceMap, geometry?: CollisionGeometry | null): void;

/** Ask the 3D world what is where. Present once the module has loaded. */
declare const Physics3D: ResourceDef<Physics3DQueries | null>;

declare class Physics3DPlugin implements Plugin {
    name: string;
    private config_;
    private wasmUrl_;
    private factory_?;
    private module_;
    constructor(wasmUrl: string, config?: Partial<Physics3DConfig>, factory?: Physics3DModuleFactory);
    build(app: App): void;
    /** Tear the world down, so a re-init does not inherit the last one's bodies. */
    cleanup(): void;
}
declare function physics3dPlugin(wasmUrl: string, config?: Partial<Physics3DConfig>, factory?: Physics3DModuleFactory): Physics3DPlugin;

export { BONE_LIMITS, BoxCollider3D, COLLIDER3D_RING_SEGMENTS, CapsuleCollider3D, CharacterController3D, CollisionGeometry, CollisionGeometryRes, ConvexCollider3D, DEFAULT_PHYSICS3D_CONFIG, DistanceJoint3D, FixedJoint3D, HingeJoint3D, JointMotion3D, MeshCollider3D, Physics3D, Physics3DDebugDraw, Physics3DPlugin, PointJoint3D, Ragdoll, RagdollFacing, RagdollJoint, RagdollProfile, RigidBody3D, SixDOFJoint3D, SliderJoint3D, SphereCollider3D, SwingTwistJoint3D, classifyBone, collider3DWireframe, collisionGeometryOf, drawPhysics3DDebug, joint3DSettingsError, physics3dPlugin, placeCollider3DWireframe, planRagdoll, ragdollPlan, readCollider3DShapes, readJoint3D, rotateVec3ByQuat, setupPhysics3DDebugDraw, stepPhysics3D };
export type { BoneClass, Collider3DComponent, Collider3DInstance, Collider3DShape, CollisionPiece, DistanceJoint3DData, FixedJoint3DData, HingeJoint3DData, Joint3DMap, Joint3DShape, Physics3DConfig, Physics3DDebugDrawConfig, PieceMap, PointJoint3DData, RagdollBone, RagdollData, RagdollJointData, RagdollLimb, RagdollPlan, SixDOFJoint3DData, SliderJoint3DData, SwingTwistJoint3DData };
