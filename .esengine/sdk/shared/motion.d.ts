import { Entity, Vec3 as Vec3$1, Quat as Quat$1 } from './wasm.js';
import { AnyComponentDef, World } from './app.js';

/**
 * @file    pose.ts
 * @brief   What a motion evaluates to before anything is written: component
 *          values, held so several motions can be composed into one result.
 *
 * @details A sampler that writes the world as it goes cannot be blended - the
 *          second motion overwrites the first, and the result depends on which
 *          ran last. Sampling into a pose separates "what this motion says at
 *          this time" from "what the entity ends up as", so composition is an
 *          operation on values and the world is written once.
 *
 *          Runtime-internal: the buffers are reused between frames, so nothing
 *          outside the animation runtime should hold one.
 */

/** The world surface a pose is seeded from and written back to. */
interface PoseWorld {
    has(entity: Entity, def: AnyComponentDef): boolean;
    get(entity: Entity, def: AnyComponentDef): Record<string, unknown>;
    set(entity: Entity, def: AnyComponentDef, data: Record<string, unknown>): void;
}
/** One component on one entity, as some motion posed it. */
interface PoseTrack {
    entity: Entity;
    def: AnyComponentDef;
    /** The component's values with this motion's channels written in. */
    data: Record<string, unknown>;
    /** Top-level fields this motion wrote; the rest of `data` is the base. */
    touched: Set<string>;
}
/**
 * One motion's evaluated result. Reused across frames: {@link reset} keeps the
 * track objects and their buffers, so a steady animation allocates nothing
 * after its first frame.
 */
declare class Pose {
    private readonly slots_;
    private readonly live_;
    private stamp_;
    /** Drop this frame's contents, keeping the buffers. */
    reset(): void;
    get tracks(): readonly PoseTrack[];
    /**
     * The track for this component, seeded from the world the first time this
     * frame asks for it. The seed is what makes an untouched field survive: a
     * motion animating only position must not zero the rotation beside it.
     */
    track(world: PoseWorld, entity: Entity, def: AnyComponentDef): PoseTrack | null;
    /** Write this pose's touched fields to the world. */
    applyTo(world: PoseWorld): void;
}

/**
 * @file    poseMix.ts
 * @brief   Composing several weighted poses into the one that gets written.
 *
 * @details Every field is a weighted average over the poses that WROTE it, and
 *          the weights are renormalized per field. That is what lets a motion
 *          animating only position fade against one animating only rotation:
 *          each channel is shared out among its own contributors, so a field
 *          only one motion drives arrives whole instead of fading toward the
 *          base value.
 *
 *          Addition commutes, so the result does not depend on the order the
 *          poses were sampled or mixed - which is the property crossfade needs
 *          and the reason sampling writes here rather than into the world.
 */

/** A pose and how much of it the result is made of. */
interface WeightedPose {
    pose: Pose;
    weight: number;
}

/**
 * @file    animatorAvatar.ts
 * @brief   How one rig spells the joints another rig's clips name.
 *
 * @details A clip addresses what it animates by `childPath`, which is the name
 *          whoever exported the model chose. Two characters rigged by two people
 *          therefore share no clip at all, and the corpus shows the cost: an
 *          enemy has to be rigged with the names its clips already use.
 *
 *          An avatar is the translation, and it is a property of the RIG, not of
 *          the controller: one controller drives many characters, and what each
 *          of them calls its left hand is each of their own business.
 *
 *          It applies at the one place a path becomes an entity. There is no
 *          retarget stage and no rewritten clip — a clip is data several rigs can
 *          read at once, and rewriting it on load would make one copy per rig and
 *          a question about which copy a change reached.
 */

/** A rig's own spelling for each joint a clip may name, and how it stands at rest. */
interface AnimatorAvatar {
    /**
     * The name a clip uses → the `childPath` this rig reaches that joint by. A
     * name with no entry resolves as itself, so a clip authored against this rig
     * keeps working and an avatar can translate only what differs.
     */
    joints: Record<string, string>;
    /**
     * Each joint's rotation in the BIND pose, by the name `joints` uses. What a
     * clip states is where a joint is, and what it MEANS is the offset from where
     * that joint rests — two rigs bound differently need this to read one clip
     * the same way. Absent for a rig nothing is retargeted onto.
     */
    rest?: Record<string, Quat>;
    /**
     * Each joint's PARENT at rest, as a rotation in the rig's own space — what a
     * joint's local values are expressed in. Two rigs whose skeletons stand on
     * different axes (one Z-up under a turned root, one Y-up) read one clip the
     * same way only through this. Absent is the identity.
     */
    space?: Record<string, Quat>;
    /** Each joint's local position at rest: a clip that moves a joint (the hips)
     *  moves it FROM here, so another rig needs its own. */
    restPosition?: Record<string, Vec3>;
    /**
     * Root to the joint furthest from it, at rest — the ONE measure every avatar
     * uses, since two measured differently give a ratio that means nothing. What
     * it buys is displacement: a step authored on a smaller rig slides on a
     * taller one unless it travels further.
     */
    scale?: number;
}
interface Quat {
    w: number;
    x: number;
    y: number;
    z: number;
}
interface Vec3 {
    x: number;
    y: number;
    z: number;
}
/** Finding a joint on a rig, whichever way a clip spelled it. */
type JointResolver = (root: Entity, path: string) => Entity | null;
/** What a `.esavatar` this build writes claims. */
declare const AVATAR_FORMAT_VERSION = 1;
/**
 * Read a parsed `.esavatar`. Throws for a shape that is not one and for a
 * version this build does not know — the same upward guard a controller has, for
 * the same reason: a translation half-read animates the wrong joints in silence.
 */
declare function parseAvatar(raw: unknown): AnimatorAvatar;
/**
 * How far a clip authored against `source` should travel on `target`. One where
 * either rig does not state its size — a ratio against a guess would move a
 * character by an amount nobody chose.
 */
declare function travelRatio(source: AnimatorAvatar | null, target: AnimatorAvatar | null): number;
/** A blank avatar, which translates nothing and resolves every path as itself. */
declare function emptyAvatar(): AnimatorAvatar & {
    version: number;
};
/**
 * The resolver a rig with `avatar` uses. Null for no avatar rather than an
 * identity one, so the common case reaches {@link resolveChildEntity} with
 * nothing in between.
 */
declare function avatarResolver(world: Pick<World, 'tryGet'>, avatar: AnimatorAvatar | null): JointResolver;

/**
 * @file    motion.ts
 * @brief   What an animator state plays, and the seam that knows how to play it.
 *
 * @details The state machine owns states, time and transitions; a MOTION owns
 *          "this stretch of animation, sampled onto this entity". Keeping the two
 *          apart is what lets one graph drive a sprite sheet on one entity and a
 *          skeletal `.estimeline` on another without the graph naming either —
 *          the alternative grows a branch per animation technology in the three
 *          places the animator touches a motion (enter, per-frame, has-it-ended).
 *
 *          A motion is DATA (`kind` + its own fields); a {@link MotionDriver} is
 *          the code for one kind, registered per App. So a new kind of animation
 *          is a registration, and this file never learns about it. Drivers for
 *          kinds the engine ships in a separate module (timeline, spine) are
 *          registered by THAT module's plugin, which is also what keeps the
 *          animation core from importing it.
 */

/** Parameter values a graph exposes to its motions (floats and bools). */
type MotionParams = Readonly<Record<string, number | boolean>>;
/** A single authored clip, played by whichever driver owns `kind`. */
interface AnimatorClipMotion {
    /** Which driver plays this. `sprite` and `timeline` ship with the engine. */
    kind: string;
    /** What to play: a registered clip name, or an asset ref the driver resolves. */
    clip: string;
    speed?: number;
    loop?: boolean;
}
/** One stop on a 1D blend: at or above `value`, play `motion`. */
interface AnimatorBlendStop {
    value: number;
    motion: AnimatorMotion;
}
/**
 * Parameter-driven selection among motions. A blend is itself a motion, so a stop
 * may hold another blend or any other kind — the nesting is what makes a
 * locomotion tree expressible without the graph gaining a second vocabulary.
 */
interface AnimatorBlend1DMotion {
    kind: 'blend1d';
    /** Float parameter that drives the selection. */
    parameter: string;
    thresholds: AnimatorBlendStop[];
}
/** One stop of a 2D blend, placed in the plane the two parameters span. */
interface AnimatorBlendPoint {
    position: {
        x: number;
        y: number;
    };
    motion: AnimatorMotion;
}
/**
 * Selection among motions by TWO parameters. What a 1D blend cannot say is any
 * locomotion that turns: forward speed and strafe are one motion here, where
 * stacking two 1D blends would make the character pick a direction and a speed
 * independently and land between the clips that describe neither.
 */
interface AnimatorBlend2DMotion {
    kind: 'blend2d';
    parameterX: string;
    parameterY: string;
    points: AnimatorBlendPoint[];
}
type AnimatorMotion = AnimatorClipMotion | AnimatorBlend1DMotion | AnimatorBlend2DMotion;
declare function isBlend1D(m: AnimatorMotion): m is AnimatorBlend1DMotion;
declare function isBlend2D(m: AnimatorMotion): m is AnimatorBlend2DMotion;
/**
 * A window of a motion's own playback, in ANIMATOR seconds. Half-open — an event
 * at `from` belongs to the window before this one — except on the frame a state
 * was entered, where `from` and `to` are both 0 and a closed window is the only
 * one that can contain an event authored at the very start of a clip.
 */
interface MotionSpan {
    from: number;
    to: number;
    inclusiveStart: boolean;
}
/** Something a clip declares happened at a point in its own time. */
interface MotionEvent {
    name: string;
    /** The event's numeric payload; 0 when it carries none. */
    value: number;
    /** The event's string payload; empty when it carries none. */
    text: string;
}
/**
 * How far a motion asks to move over a span, in the animated entity's OWN frame.
 * A request, not a result: what the character ends up doing with it is the
 * character controller's answer, and this never reaches a Transform.
 */
interface RootMotionDelta {
    position: Vec3$1;
    rotation: Quat$1;
}
/**
 * What a driver is given to act on. `drive`/`finished` re-enter the registry, so
 * a composite motion (a blend) delegates to its chosen child without holding the
 * registry itself — and therefore without caring what kind that child is.
 */
interface MotionContext {
    world: World;
    entity: Entity;
    params: MotionParams;
    /** Play a nested motion. `enter` restarts it from the top. */
    drive(motion: AnimatorMotion, enter: boolean): void;
    /** Whether a nested motion has run to its end. */
    finished(motion: AnimatorMotion): boolean;
    /** Sample a nested motion into `pose`; false when its kind cannot be sampled. */
    sample(motion: AnimatorMotion, time: number, pose: Pose): boolean;
    /** One pass of a nested motion in seconds; 0 when it does not say. */
    duration(motion: AnimatorMotion): number;
    /** Whether a nested motion repeats, and so never ends on its own. */
    loops(motion: AnimatorMotion): boolean;
    /** Append a nested motion's events over `span` to `out`. */
    events(motion: AnimatorMotion, span: MotionSpan, out: MotionEvent[]): void;
    /** A nested motion's displacement over `span`; false when it states none. */
    rootDelta(motion: AnimatorMotion, span: MotionSpan, out: RootMotionDelta): boolean;
    /**
     * Borrow scratch for composing nested samples; hand it back with
     * {@link releasePose}. Pooled rather than owned by a driver, because a blend
     * nested inside a blend samples while its parent's scratch is still live.
     */
    borrowPose(): Pose;
    releasePose(pose: Pose): void;
    /**
     * Borrow a list to gather weighted poses into. Its entries are reused, so a
     * caller fills a PREFIX and passes the count on rather than truncating it.
     */
    borrowMix(): WeightedPose[];
    releaseMix(mix: WeightedPose[]): void;
    /** Borrow a displacement to combine nested ones into; hand it back. */
    borrowDelta(): RootMotionDelta;
    releaseDelta(delta: RootMotionDelta): void;
    /**
     * The joint `path` names on the rig being animated. A driver goes through
     * here rather than resolving a childPath itself: a rig with an avatar spells
     * its joints its own way, and that translation has to reach every reader of
     * a path or a clip drives half a skeleton.
     */
    resolveJoint: JointResolver;
    /**
     * Whether the animator is taking this motion's root track as DISPLACEMENT.
     * A driver that can state a root pose must then leave the root's position and
     * rotation out of what it samples: the same movement written to the entity and
     * handed to the character controller moves it twice.
     */
    extractRootMotion: boolean;
}
/**
 * How one kind of motion is played. A driver supplies EITHER `sample` — stating
 * values for something else to compose — or `apply`, for a motion that can only
 * be switched to, a sprite sheet having no meaning halfway between two clips.
 * Only a motion that states values without writing them can be blended.
 */
interface MotionDriver<M extends AnimatorMotion = AnimatorMotion> {
    /**
     * Drive `motion` on the context's entity. Called every frame the state is
     * active, so a driver must be idempotent in steady state; `enter` is true
     * only on the frame the state was entered, and means restart from the top.
     */
    apply?(ctx: MotionContext, motion: M, enter: boolean): void;
    /**
     * Evaluate `motion` at `time` seconds into `pose`, writing no component;
     * wrapping belongs here, only the driver knowing how long its clip runs.
     * Returns whether anything was sampled — a composite whose chosen child
     * cannot be must answer false, or the caller takes silence for a pose.
     */
    sample?(ctx: MotionContext, motion: M, time: number, pose: Pose): boolean;
    /** One pass in seconds. Absent, or 0, means the motion does not say. */
    duration?(ctx: MotionContext, motion: M): number;
    /** Whether the motion repeats. A looping motion never finishes. */
    loops?(ctx: MotionContext, motion: M): boolean;
    /**
     * Append every event `motion` crossed over `span` to `out`, in the order the
     * clip declares them. Wrapping belongs here for the same reason sampling does:
     * only the driver knows how long its clip runs and whether it repeats, and a
     * caller differencing two absolute times cannot tell a loop from a rewind.
     * This is also the active motion's native-effect dispatch point. It runs even
     * without a custom event sink, only for the selected motion (never its fading
     * predecessor). Sampling poses must stay free of those side effects.
     */
    events?(ctx: MotionContext, motion: M, span: MotionSpan, out: MotionEvent[]): void;
    /**
     * How far `motion` asks to move over `span`, into `out`. False when the motion
     * states no root motion — which is not the same as stating none this frame.
     */
    rootMotion?(ctx: MotionContext, motion: M, span: MotionSpan, out: RootMotionDelta): boolean;
    /**
     * Whether the motion has ended — what gates a `hasExitTime` transition. For
     * a driver whose end is no clock the animator keeps (a sprite clip, a spine
     * track); one reporting a `duration` is judged on the animator's own time.
     * Absent answers false: a transition that never fires is the visible failure.
     */
    isFinished?(ctx: MotionContext, motion: M): boolean;
}
/**
 * The drivers one App knows. Per App and not global because a driver reaches
 * live per-App state (the timeline's player flags, spine's manager), which a
 * second App in the same process must not share.
 */
declare class MotionRegistry {
    private readonly drivers_;
    /** Scratch lent to composite motions. Pools and not one buffer per driver:
     *  nesting decides how many are live at once, and only the stack knows that. */
    private readonly posePool_;
    private readonly mixPool_;
    private readonly deltaPool_;
    register<M extends AnimatorMotion>(kind: M['kind'], driver: MotionDriver<M>): void;
    unregister(kind: string): void;
    has(kind: string): boolean;
    driverFor(motion: AnimatorMotion): MotionDriver | undefined;
    /**
     * The context for driving `entity` this tick, REUSED across entities: the
     * alternative is an object and three closures per animated entity per frame.
     * A driver must not keep it — it describes only the call it was handed to.
     */
    context(world: World, entity: Entity, params: MotionParams, resolveJoint?: JointResolver): MotionContext;
    private readonly ctx_;
}
/**
 * Where a parameter sits among a blend's stops. `upper` is null wherever one stop
 * answers for the whole blend.
 *
 * REUSED — destructure it before anything re-enters this module: a nested blend
 * resolves into the same object while its parent's answer is still being read.
 */
interface Blend1DPair {
    lower: AnimatorBlendStop | null;
    upper: AnimatorBlendStop | null;
    /** 0 at `lower`, 1 at `upper`; 0 whenever `upper` is null. */
    t: number;
}
/**
 * Divide `value` between the two stops it falls between. Under every threshold
 * the lowest stop answers whole, which is what makes a speed parameter resting
 * at zero play idle rather than nothing.
 */
declare function blend1DPair(blend: AnimatorBlend1DMotion, value: number): Readonly<Blend1DPair>;
/**
 * The stop a 1D blend selects for `value`: the greatest threshold at or below it,
 * clamped up to the lowest when the parameter sits under them all. This is what a
 * motion that can only be SWITCHED to gets — a sprite sheet has no meaning
 * halfway between two clips — while one that states values is mixed instead.
 */
declare function selectBlendStop(blend: AnimatorBlend1DMotion, value: number): AnimatorBlendStop | null;
/**
 * A blend states values, so it MIXES: at 0.5 between walk and run the character
 * is half of each, rather than walking until run's threshold is crossed. A
 * motion that can only be switched to still picks ({@link selectBlendStop}) —
 * `apply` is the seam for exactly those, and the two answers differ only there.
 */
declare const blend1DMotionDriver: MotionDriver<AnimatorBlend1DMotion>;
/**
 * Gradient-band weights, normalized to sum to one: each point keeps what the
 * neighbour nearest to pushing it out leaves it. That puts a sample standing on a
 * clip entirely on that clip, and holds one outside the hull by its nearest edge
 * rather than letting it fall to nothing. Only `weight` is written.
 */
declare function blend2DWeights(blend: AnimatorBlend2DMotion, x: number, y: number, out: {
    weight: number;
}[]): void;
/** The point carrying the most weight: what a motion that can only be SWITCHED
 *  to gets, and who speaks for the blend's events and its end. */
declare function dominantBlendPoint(blend: AnimatorBlend2DMotion, x: number, y: number): AnimatorBlendPoint | null;
/**
 * The same operation the 1D blend performs, with the weights coming from a plane
 * rather than a line — which is why this shares the pose mixer and the phase
 * synchronisation rather than restating either.
 */
declare const blend2DMotionDriver: MotionDriver<AnimatorBlend2DMotion>;

export { AVATAR_FORMAT_VERSION, MotionRegistry, Pose, avatarResolver, blend1DMotionDriver, blend1DPair, blend2DMotionDriver, blend2DWeights, dominantBlendPoint, emptyAvatar, isBlend1D, isBlend2D, parseAvatar, selectBlendStop, travelRatio };
export type { AnimatorAvatar, AnimatorBlend1DMotion, AnimatorBlend2DMotion, AnimatorBlendPoint, AnimatorBlendStop, AnimatorClipMotion, AnimatorMotion, JointResolver, MotionContext, MotionDriver, MotionEvent, MotionParams, MotionSpan, PoseTrack, PoseWorld, RootMotionDelta };
