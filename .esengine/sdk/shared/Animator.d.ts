import { Entity } from './wasm.js';
import { World, EventDef, ComponentDef } from './app.js';
import { ResourceDef } from './resource.js';
import { PoseTrack, Pose, PoseWorld, JointResolver, MotionParams, AnimatorMotion, MotionDriver, AnimatorAvatar } from './motion.js';

/**
 * @file    layerStack.ts
 * @brief   Laying one layer's pose over what the layers under it already said.
 *
 * @details This is the operation {@link file://./poseMix.ts} is NOT. Mixing is a
 *          weighted average over the motions that wrote a field, and it commutes
 *          — which is what a crossfade and a blend tree need, and why the answer
 *          cannot depend on sample order. A layer stack is ordered: the aim layer
 *          at weight 0.3 means "three tenths of the way from whatever is under me
 *          to what I say", and swapping two layers is a different character.
 *
 *          So the two are kept apart rather than parameterized into one function.
 *          A field the layer wrote but nothing under it did still interpolates —
 *          against the world's own value, reached by seeding the accumulator the
 *          way any pose is seeded. That is the other half of the difference:
 *          mixing gives a lone writer its field whole, a layer never does.
 */

/** Which tracks of `layer` this stack lets through; null admits every one. */
interface LayerReach {
    admits(track: PoseTrack): boolean;
}
/**
 * Lay `layer` over `acc`: every field the layer wrote moves a `weight` share of
 * the way from what is already there to what the layer says. Where the layer is
 * the first to write a field, "already there" is the world's own value.
 */
declare function overlayPose(acc: Pose, layer: Pose, weight: number, world: PoseWorld, reach: LayerReach | null): void;
/**
 * Add what `layer` says BEYOND `reference` onto `acc` — a flinch or a lean stated
 * as a departure from its own resting pose, so it reads the same over a walk as
 * over a run. Measured against the layer's own start and not against `acc`, which
 * would make the same clip mean something different under every base state.
 */
declare function addPoseOver(acc: Pose, layer: Pose, reference: Pose, weight: number, world: PoseWorld, reach: LayerReach | null): void;

/**
 * @file    animatorMask.ts
 * @brief   The part of a rig a layer is allowed to write.
 *
 * @details A mask needs no vocabulary of its own: a rig's joints ARE its entity
 *          hierarchy, and a clip already names what it animates by `childPath`.
 *          So a mask is a set of those same paths, each standing for the subtree
 *          under it — and it is resolved against the entity being animated,
 *          because the same controller drives rigs that are not the same objects.
 */

/** Which subtrees of the animated entity a layer may write. */
interface AnimatorMask {
    /**
     * Each names a subtree by `childPath`, its own root included; the empty path
     * is the whole rig, and no paths admits nothing — a layer switched off, which
     * having no mask at all does not mean. Named the CLIP's way like everything
     * a controller says, and translated by the rig's avatar.
     */
    paths: string[];
}
/**
 * One layer's resolved mask, reused across frames. Re-resolved each time rather
 * than cached against the hierarchy: a rig gains and loses entities while it
 * plays, and a mask that went stale would silently start writing a joint the
 * author excluded.
 */
declare class MaskReach implements LayerReach {
    private readonly admitted_;
    resolve(world: Pick<World, 'tryGet'>, root: Entity, mask: AnimatorMask, resolveJoint: JointResolver): void;
    admits(track: PoseTrack): boolean;
}

/**
 * @file    animatorIK.ts
 * @brief   Bending the posed skeleton to reach something the clips did not know about.
 *
 * @details Three decisions shape this.
 *
 *          IK belongs to the CONTROLLER, not to a layer. A layer answers "who is
 *          speaking"; IK is the constraint reality puts on what was said — a foot
 *          belongs on the ground whichever layer decided how the leg swings — so
 *          it runs once, on the stack's answer, rather than once per layer.
 *
 *          It solves in the RIG's own space, reading the pose this frame just
 *          stated. `Transform.worldPosition` is last frame's, computed before the
 *          animator wrote anything, so a solver reading it plants the foot against
 *          a character that has already moved on.
 *
 *          The chain is derived from the tip. A two-bone solve is BY DEFINITION
 *          the tip and the two joints above it, so naming three would be three
 *          chances to name them inconsistently.
 */

/** What an IK constraint does to the joint it names. */
type AnimatorIKKind = 'two-bone' | 'look-at' | 'foot-plant';
interface AnimatorIK {
    kind: AnimatorIKKind;
    /** The joint the chain ends at, by the childPath a clip names it with. */
    tip: string;
    /** What it should reach, or look at, named the same way. */
    target: string;
    /** 0 leaves the pose alone, 1 puts the tip on the target. */
    weight?: number;
    /** A float parameter scaling `weight` — how a game fades a constraint in. */
    parameter?: string;
    /** two-bone: a joint the middle one bends towards. Absent keeps its own bend. */
    pole?: string;
    /** look-at: the tip's own axis that ends up pointing at the target. */
    axis?: 'x' | 'y' | 'z';
    /** foot-plant: a joint lowered so the leg reaching the lowest foot still can: the hips. */
    pelvis?: string;
    /** foot-plant: lay the foot along the slope under it. Default true. */
    align?: boolean;
    /** foot-plant: how far up and down to look for ground, in the rig's units. Default the leg's length. */
    reach?: number;
    /** foot-plant: seconds to settle on a new height, so a step onto a kerb is not a jump. Default 0.06. */
    smooth?: number;
    /** foot-plant: the physics layers that count as ground. Default all of them. */
    layers?: number;
}
/** What is under a point, in the world. */
interface GroundHit {
    y: number;
    normal: Vec3;
}
/**
 * Asks what ground lies below `origin`, within `drop`. Injected rather than imported:
 * the animation core runs in a game with no physics at all, and with no probe a
 * foot-plant simply leaves the clip's feet where they are.
 */
type GroundProbe = (origin: Vec3, drop: number, layers: number) => GroundHit | null;
/** What a frame's foot-plants need beyond the pose: the probe, the step, and where each foot had settled. */
interface GroundContext {
    probe: GroundProbe | null;
    dt: number;
    memory: Map<string, {
        lift: number;
        normal: Vec3;
    }>;
    /** Each joint a foot-plant moves, as it stood before the first one did. */
    rest?: Map<Entity, {
        position: Vec3;
        rotation: Quat;
    }>;
}
interface Vec3 {
    x: number;
    y: number;
    z: number;
}
interface Quat {
    w: number;
    x: number;
    y: number;
    z: number;
}
/**
 * Apply every constraint to the stack's answer, in the order they are declared:
 * one can move a joint another then reads, and an author who wrote them in an
 * order meant it. Foot-plants go first, together: where the feet land moves the
 * body the others are measured from.
 */
declare function solveAnimatorIK(world: World, rigRoot: Entity, pose: Pose, constraints: readonly AnimatorIK[], params: MotionParams, resolveJoint?: JointResolver, ground?: GroundContext): void;

/**
 * @file    animatorEvent.ts
 * @brief   What the animator says happened, for anything that cares to hear it.
 *
 * @details The animator's job ends at "the clip declared `hit` and the playhead
 *          just crossed it". Dealing damage, playing a footstep, bursting dust —
 *          those belong to the systems that own damage, sound and particles, and
 *          an animator that called them would be a state machine that imports the
 *          combat rules. So it states the event and stops, and the dependency
 *          runs the other way: gameplay reads the animator, never the reverse.
 *
 *          One channel, the engine's own event bus, rather than a listener list
 *          beside it: a callback fires inside the animator's own loop over
 *          entities, and a handler that spawns or despawns there is mutating the
 *          set being iterated.
 */

/**
 * One event a clip declared, and who it happened to.
 *
 * The payload is two scalars rather than an open object: what crosses this bus
 * is also what a compiled system reads, and a shape that varies per clip has no
 * layout to bake in. A clip states them as `value` and `text` on the event.
 *
 * @experimental
 */
interface AnimatorEventPayload {
    /** The animated entity — the character this happened to. */
    entity: Entity;
    /** The event's name as the clip declared it (`footstep`, `hit`). */
    name: string;
    /** Its numeric payload; 0 when the clip states none. */
    value: number;
    /** Its string payload; empty when the clip states none. */
    text: string;
}
/**
 * The bus every animation event arrives on. Read it with
 * `EventReader(AnimatorEvent)` in a system of your own.
 *
 * @experimental
 */
declare const AnimatorEvent: EventDef<AnimatorEventPayload>;
/**
 * Where the animator posts what it saw. `EventWriter(AnimatorEvent)` satisfies
 * it, and so does a test's array — the animator states events without knowing
 * whether an App is listening.
 *
 * @experimental
 */
interface AnimatorEventSink {
    send(event: AnimatorEventPayload): void;
}

type AnimatorParamType = 'float' | 'bool' | 'trigger';
interface AnimatorParam {
    name: string;
    type: AnimatorParamType;
    /** Default value for float (number) / bool (boolean). Triggers default off. */
    default?: number | boolean;
}
/**
 * A transition condition. Numeric comparisons (`gt`/`lt`/`eq`/`neq`) carry a
 * `value`; `true`/`false` test a bool param; `trigger` fires when the named
 * trigger is set (and consumes it).
 */
type AnimatorCondition = {
    param: string;
    op: 'gt' | 'lt' | 'eq' | 'neq';
    value: number;
} | {
    param: string;
    op: 'true' | 'false' | 'trigger';
};
interface AnimatorTransition {
    /** Target state name. */
    to: string;
    /** All conditions must hold (AND). Empty = unconditional. */
    conditions: AnimatorCondition[];
    /**
     * Seconds to blend from the state being left into the one being entered.
     * Absent or 0 cuts. Honoured only where both motions can be sampled: a
     * sprite sheet is switched, having nothing to be halfway between.
     */
    duration?: number;
    /**
     * Only fire once the current state's clip has finished (a non-looping sprite
     * clip reached its end). Combined with `conditions`, both must hold. With no
     * conditions, this is "auto-advance when the clip ends" (e.g. attack→idle).
     */
    hasExitTime?: boolean;
}
/** One stop on a 1D blend: at/above `value`, play `clip`. */
interface AnimatorBlendThreshold {
    value: number;
    clip: string;
    speed?: number;
    loop?: boolean;
}
/**
 * 1D parameter-driven clip selection. The sprite channel plays one clip at a
 * time, so a "blend" here is a *selection* by threshold (idle→walk→run as a
 * speed parameter rises), not a weighted pose blend (that's the skeletal/Spine
 * follow-on). Thresholds may be given in any order.
 */
interface AnimatorBlend1D {
    /** Float parameter that drives the selection. */
    parameter: string;
    thresholds: AnimatorBlendThreshold[];
}
/** A state that drives a Spine skeletal animation instead of a sprite clip. */
interface AnimatorSpineMotion {
    animation: string;
    loop?: boolean;
}
/**
 * Minimal channel the Animator uses to drive Spine, kept here so the animation
 * core does not depend on the optional spine module. `SpineManager` satisfies it
 * structurally; `SpinePlugin` injects it via `AnimatorController.setSpineDriver`.
 */
interface SpineAnimationDriver {
    setAnimation(entity: Entity, animation: string, loop: boolean): void;
}
/**
 * A nested state machine. A state carrying one is a *container* (it plays no
 * motion of its own); on entry the machine descends to `initialState`, and the
 * container state's own `transitions` are the edges that exit the whole machine.
 */
interface AnimatorSubMachine {
    states: AnimatorState[];
    initialState: string;
    /** Transitions evaluated from every sub-state in this machine. */
    anyStateTransitions?: AnimatorTransition[];
}
interface AnimatorState {
    name: string;
    /**
     * What this state plays, of any registered kind (`sprite`, `timeline`, a
     * blend over either). Takes precedence over the single-kind fields below,
     * which are the same thing spelled for one kind and are migrated to this.
     */
    motion?: AnimatorMotion;
    /** Single sprite clip this state plays. Mutually exclusive with `blend`/`spine`/`stateMachine`. */
    clip?: string;
    /** 1D blend selection. Mutually exclusive with `clip`/`spine`/`stateMachine`. */
    blend?: AnimatorBlend1D;
    /** Drive a Spine animation instead of a sprite clip. */
    spine?: AnimatorSpineMotion;
    /** Nested machine — makes this a container state (no motion of its own). */
    stateMachine?: AnimatorSubMachine;
    /**
     * This state's motion states where the CHARACTER goes, not how it is posed:
     * its root track leaves the pose and becomes a request on
     * {@link AnimatorRootMotion}. Per state, because a locomotion state is
     * stick-driven and a lunge is not, and the export cannot say which.
     */
    rootMotion?: boolean;
    speed?: number;
    /**
     * A float parameter that multiplies how fast this state plays: its clock advances by `dt * parameter`, so a run clip follows a character's
     * speed and a parameter of 0 holds the pose. Whatever the motion's kind, because it is the state's clock that is scaled. A missing or
     * negative parameter plays at the normal rate or stops, never backwards.
     */
    speedParameter?: string;
    loop?: boolean;
    transitions: AnimatorTransition[];
    /** Editor-only canvas position; the interpreter ignores it. */
    x?: number;
    y?: number;
}
/** How a layer's pose meets what the layers under it already said. */
type AnimatorLayerBlend = 'override' | 'additive';
/**
 * A layer over the base one: a state machine of its own, and how much of what it
 * says survives. Neither `weight` nor `blend` exists on the base layer, both
 * being statements about what is underneath and nothing being.
 */
interface AnimatorLayer extends AnimatorScope {
    name: string;
    /** 0 leaves the layers below untouched, 1 states this layer whole. */
    weight?: number;
    blend?: AnimatorLayerBlend;
    /** Which part of the rig this layer may write; absent is all of it. */
    mask?: AnimatorMask;
}
/** What a `.esanimator` this build writes claims. */
declare const ANIMATOR_FORMAT_VERSION = 2;
interface AnimatorControllerDef {
    /**
     * Absent is 1, the shape before layers. A file claiming a version this build
     * does not know is refused rather than read for the parts it recognises,
     * which would drop a layer silently and animate the wrong character.
     */
    version?: number;
    parameters: AnimatorParam[];
    states: AnimatorState[];
    initialState: string;
    /** Transitions evaluated from every state, before the current state's own. */
    anyStateTransitions?: AnimatorTransition[];
    /**
     * The `.esavatar` this controller's CLIPS were authored against. With one on
     * the rig as well, a pose is restated from that rig's bind pose to this one;
     * without it a name map alone is only right between rigs that share a bind
     * pose.
     */
    avatar?: string;
    /** Layers over the base one, laid down in order. */
    layers?: AnimatorLayer[];
    /**
     * Constraints applied to the stack's answer, in order. Not per layer: a layer
     * answers who is speaking, and a foot belongs on the ground whichever one
     * decided how the leg swings.
     */
    ik?: AnimatorIK[];
}
/**
 * The shape shared by the top-level controller, every layer and every nested
 * machine: a set of states, an entry point, and machine-wide any-state
 * transitions.
 */
type AnimatorScope = Pick<AnimatorControllerDef, 'states' | 'initialState' | 'anyStateTransitions'>;
/** How many state machines run on one entity: the base layer and those over it. */
declare function animatorLayerCount(def: AnimatorControllerDef): number;
/**
 * Layer `index`'s active state. Read and written through here so each layer's
 * state has one home: the base layer's is `currentState`, which is what a
 * single-layer controller has always had and what every reader of one expects.
 */
declare function layerState(a: AnimatorData, index: number): string;
declare function setLayerState(a: AnimatorData, index: number, path: string): void;
/** Layer `index`, the base one at 0. Null for an index the controller has not got. */
declare function animatorLayer(def: AnimatorControllerDef, index: number): AnimatorScope | null;
/**
 * Every machine a controller runs, base layer first. The ONE way to walk them: a
 * reader that reaches for `def.states` sees the base layer and calls it the
 * controller, which is how the loader shipped acquiring no clip any layer played
 * — silent in a real project, green in every hand-built test.
 */
declare function animatorScopes(def: AnimatorControllerDef): AnimatorScope[];
type AnimatorParamValues = Readonly<Record<string, number | boolean>>;
interface AnimatorEvalResult {
    /** Target state if a transition fired, else null (stay). */
    next: string | null;
    /** Trigger params a fired transition consumed (caller resets them). */
    consumedTriggers: string[];
}
/**
 * Evaluate one step of the state machine. Any-state transitions are checked
 * before the current state's. `clipFinished` gates `hasExitTime` transitions
 * (true = the current clip has ended); it defaults true so transitions without
 * exit time are unaffected. Returns the next state (or null to stay) and the
 * triggers a fired transition consumed. Pure.
 */
declare function evaluateAnimatorTransitions(def: AnimatorScope, currentState: string, params: AnimatorParamValues, triggers: ReadonlySet<string>, clipFinished?: boolean): AnimatorEvalResult;
/** The active state is a `/`-separated path of state names (e.g. `Combat/Attack1`). */
declare const STATE_PATH_SEP = "/";
/**
 * Descend from state `name` in `scope` to a concrete leaf, returning the path
 * segments. A container state (one with a `stateMachine`) recurses into its
 * `initialState`; a normal state ends the path.
 */
declare function enterStatePath(scope: AnimatorScope, name: string): string[];
interface AnimatorPathEvalResult {
    /** Target path if a transition fired, else null (stay). */
    nextPath: string | null;
    consumedTriggers: string[];
    /** Seconds the fired transition blends over; 0 when it cuts. */
    fadeDuration: number;
}
/**
 * Evaluate one step of a (possibly nested) state machine over a path. Transitions
 * are checked highest-priority first: top-level any-state, then each enclosing
 * machine's any-state from outermost in, then the leaf's own transitions, then the
 * container exit transitions from innermost out. A fired transition's `to` is
 * resolved within the machine that owns it (descending into a sub-machine's
 * initial state when needed). `clipFinished` reflects the leaf clip. Pure.
 */
declare function evaluateAnimatorPath(def: AnimatorScope, currentPath: string, params: AnimatorParamValues, triggers: ReadonlySet<string>, clipFinished?: boolean): AnimatorPathEvalResult;
/** The leaf (motion-bearing) state of a resolved path, or null if unresolvable. */
declare function leafStateOf(def: AnimatorScope, path: string): AnimatorState | null;
/**
 * Select a 1D blend's clip for a parameter value: the threshold with the
 * greatest `value` ≤ `value`, clamped up to the first stop when below all.
 * Pure. Returns `{ clip: '' }` for an empty blend.
 */
declare function selectBlendClip(blend: AnimatorBlend1D, value: number): AnimatorBlendThreshold;
/** Motion kind for a Spine animation; the spine module registers its driver. */
declare const SPINE_MOTION = "spine";
/**
 * What a state plays. A file is normalized on load, so this converts only for a
 * controller built in code with the older fields — which nothing new writes, and
 * which stays readable rather than becoming a silent no-motion.
 * Null for a state with no motion of its own (a container).
 */
declare function motionOf(st: AnimatorState): AnimatorMotion | null;
/** Merge a controller's declared parameter defaults with per-entity overrides. */
declare function resolveParams(def: AnimatorControllerDef, overrides: ReadonlyMap<string, number | boolean>): Record<string, number | boolean>;
/** The fields of the `Animator` component, whose tier this shape carries.
 *  @beta */
interface AnimatorData {
    /** Registered controller name (see AnimatorControllerAPI.registerController). */
    controller: string;
    /** The base layer's active state; empty until the first update seeds it. */
    currentState: string;
    /** A `.esavatar` saying how THIS rig spells the joints the clips name. Empty
     *  where the clips were authored against this rig and need no translation. */
    avatar: string;
    /** The active state of each layer ABOVE the base one, by that layer's index
     *  minus one — the base layer's is {@link currentState}, for the same reason
     *  the base layer has no weight. */
    layerStates: string[];
    enabled: boolean;
}
/**
 * A state machine over clips: the controller decides which clip plays from the
 * parameters a game writes, so gameplay sets `speed` or fires a trigger rather
 * than naming a clip.
 *
 * @beta
 */
declare const Animator: ComponentDef<AnimatorData>;
/** Register a controller under `key` (an asset path); the loader and any code
 *  path that keys by path share this store. */
declare function registerAnimatorController(key: string, def: AnimatorControllerDef): void;
declare function getRegisteredAnimatorController(key: string): AnimatorControllerDef | undefined;
/** Drop all path-registered controllers (tests / hot-reload). */
declare function clearAnimatorControllerStore(): void;
/**
 * Owns one App's animator-controller registry and per-entity parameter/trigger
 * values, evaluates each Animator's state machine, and drives the entity's
 * SpriteAnimator clip on state changes. Published as the {@link AnimatorController}
 * resource; read it as `app.getResource(AnimatorController)`.
 */
declare class AnimatorControllerAPI {
    private assetControllers_;
    private assetAvatars_;
    private readonly controllers;
    private readonly params;
    private readonly triggers;
    private readonly runtimes_;
    private readonly motions_;
    private groundProbe_;
    constructor();
    /**
     * Teach this animator a kind of motion. Called by the plugin that owns the
     * kind (TimelinePlugin, SpinePlugin); a state naming an unregistered kind is
     * inert rather than an error, since a scene may be authored against a module
     * this build does not load.
     */
    registerMotionDriver<M extends AnimatorMotion>(kind: M['kind'], driver: MotionDriver<M>): void;
    /** Whether some driver can play `kind` here. */
    hasMotionDriver(kind: string): boolean;
    /** What foot-plant constraints ask about the ground; a physics plugin wires it. Without one they leave the clip's feet alone. */
    setGroundProbe(probe: GroundProbe | null): void;
    /** Inject the Spine driver (SpinePlugin wires SpineManager here). Optional —
     *  without it, spine-targeting states are inert. */
    setSpineDriver(driver: SpineAnimationDriver | null): void;
    registerController(name: string, def: AnimatorControllerDef): void;
    unregisterController(name: string): void;
    /**
     * @internal Where a `.esanimator` comes from: this app's realm. Set by the
     * animation plugin; without one only code registrations answer.
     */
    useAssetControllers(source: (ref: string) => AnimatorControllerDef | undefined): void;
    /** Where a `.esavatar` comes from. Same shape as the controller source, and
     *  optional for the same reason: without one, every path resolves as itself. */
    useAssetAvatars(source: (ref: string) => AnimatorAvatar | undefined): void;
    /** This rig's avatar, or null where its clips need no translating. */
    private avatarOf;
    getController(name: string): AnimatorControllerDef | undefined;
    clearControllers(): void;
    setFloat(entity: Entity, name: string, value: number): void;
    setBool(entity: Entity, name: string, value: boolean): void;
    setTrigger(entity: Entity, name: string): void;
    resetTrigger(entity: Entity, name: string): void;
    getFloat(entity: Entity, name: string): number;
    getBool(entity: Entity, name: string): boolean;
    /** Drop an entity's parameter/trigger/playback state (wire to world.onDespawn). */
    removeEntity(entity: Entity): void;
    private paramStore;
    private triggerStore;
    /**
     * `dt` seconds advance the animator's own clock, which is what a sampled
     * motion is evaluated against and what a crossfade progresses on. `events`
     * is where what the clips declared is posted; without one the animator still
     * runs and simply says nothing, which is what a bare App is.
     */
    update(world: World, dt?: number, events?: AnimatorEventSink): void;
    /**
     * Run one layer: its own clock, its own transitions, its own pose — laid over
     * what the layers under it already put in `rt.composed`. Answers whether it
     * left anything there, a layer driving a sprite sheet having written the
     * entity directly instead.
     */
    private stepLayer;
    /**
     * Put `pose` into the stack. The base layer states it outright; a layer over
     * it leans the stack toward what it says, or adds what it says beyond its own
     * rest pose — neither of which commutes, which is the whole difference
     * between this and the pose mixer a crossfade uses.
     */
    private compose;
    /**
     * Post what the ACTIVE motion crossed. A motion being faded out states
     * nothing: its clock is still running, so an attack cancelled into a dodge
     * would go on landing its hit, and "how much of it is still on screen" is not
     * an answer to whether it happened.
     */
    private emitEvents;
    /**
     * State what the animation asks to move, for gameplay to hand on. World space,
     * because a consumer wants "move me this way" rather than a vector in a frame
     * it has to reconstruct; and paired with the seconds it covers, because the
     * consumer usually steps on a different clock than this one.
     */
    private publishRootMotion;
    /**
     * Enter a state: the clock restarts, and the motion being left keeps running
     * as the thing to fade out of. Only when BOTH can be sampled - a switched
     * motion has no partial state to hold, so a fade over one would be a pause.
     */
    private beginState;
    /** Advance the state's clock, and the fade's if one is running. */
    private advance;
    /** This layer's mask against this rig, or null where it writes all of it. */
    private reachFor;
    /**
     * What this layer's motion says, as a pose for the stack to compose — two
     * composed here already when a fade is running, mixing being the operation
     * that does not care which was sampled first. Null for a motion that can only
     * be driven, a sprite sheet writing the entity itself and joining no stack.
     */
    private poseLayer;
    /** Whether a motion has run out. A clip whose length the driver states is
     *  judged against our clock; anything else answers for itself. */
    private motionEnded;
    private canSample;
    /**
     * This entity's clocks, grown to the controller it is now running. Grown and
     * not rebuilt: a controller swapped for one with more layers keeps the base
     * layer mid-clip, which is what the entity is visibly doing.
     */
    private groundFor;
    private runtimeFor;
    /** What this entity's layers used up this frame, spent once they have all
     *  been asked. */
    private readonly spentTriggers_;
    /** Reused across entities and frames: a steady animation states no events,
     *  and an array per animated entity per frame would be the only allocation. */
    private readonly eventScratch_;
    private readonly rootScratch_;
}
/**
 * Per-App animator resource (controller registry + per-entity parameters),
 * published by `AnimationPlugin`. Read as `app.getResource(AnimatorController)`.
 */
declare const AnimatorController: ResourceDef<AnimatorControllerAPI>;

export { ANIMATOR_FORMAT_VERSION, Animator, AnimatorController, AnimatorControllerAPI, AnimatorEvent, MaskReach, SPINE_MOTION, STATE_PATH_SEP, addPoseOver, animatorLayer, animatorLayerCount, animatorScopes, clearAnimatorControllerStore, enterStatePath, evaluateAnimatorPath, evaluateAnimatorTransitions, getRegisteredAnimatorController, layerState, leafStateOf, motionOf, overlayPose, registerAnimatorController, resolveParams, selectBlendClip, setLayerState, solveAnimatorIK };
export type { AnimatorBlend1D, AnimatorBlendThreshold, AnimatorCondition, AnimatorControllerDef, AnimatorData, AnimatorEvalResult, AnimatorEventPayload, AnimatorEventSink, AnimatorIK, AnimatorIKKind, AnimatorLayer, AnimatorLayerBlend, AnimatorMask, AnimatorParam, AnimatorParamType, AnimatorParamValues, AnimatorPathEvalResult, AnimatorScope, AnimatorSpineMotion, AnimatorState, AnimatorSubMachine, AnimatorTransition, GroundContext, GroundHit, GroundProbe, LayerReach, SpineAnimationDriver };
