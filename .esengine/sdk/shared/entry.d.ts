import { Entity, CppRegistry, Vec3, Quat } from './wasm.js';
import { ResourceDef } from './resource.js';
import { EventDef, AnyComponentDef, World, ComponentDef, Plugin, App } from './app.js';
import { MotionEvent, MotionDriver, AnimatorClipMotion } from './motion.js';
import { EngineApi } from './engineApi.js';

/** A bounded contact in project world units; body is INVALID_ENTITY for a plane. @beta */
interface ParticleCollisionEventPayload {
    emitter: Entity;
    particle: number;
    body: Entity;
    mode: number;
    x: number;
    y: number;
    z: number;
    normalX: number;
    normalY: number;
    normalZ: number;
    velocityX: number;
    velocityY: number;
    velocityZ: number;
}
/** Read with EventReader; like other engine events, contacts are readable next frame. @beta */
declare const ParticleCollisionEvent: EventDef<ParticleCollisionEventPayload>;
/** One emitter's latest completed update. Events count accepted notifications/sub-bursts. @beta */
interface ParticleCollisionStats {
    emitter: Entity;
    queries: number;
    hits: number;
    budgetSkipped: number;
    distanceSkipped: number;
    unavailable: number;
    events: number;
    eventDropped: number;
    fallbacks: number;
    mode: number;
}
/** App-wide limits, shared fairly by all scene emitters. Zero disables that work. @beta */
interface ParticleCollisionBudget {
    queries: number;
    events: number;
}

interface Query {
    mode: number;
    mask: number;
    x: number;
    y: number;
    z: number;
    dx: number;
    dy: number;
    dz: number;
}
interface Hit {
    body: Entity;
    x: number;
    y: number;
    z: number;
    nx: number;
    ny: number;
    nz: number;
}
/** null is a miss; undefined means unavailable and explicitly invokes the authored fallback. @internal */
type ParticleQueryResolver = (query: Query) => Hit | null | undefined;

/**
 * Per-app particle API. Wraps the C++ registry-scoped particle system
 * so two App instances (e.g. editor tabs previewing different scenes)
 * can drive independent simulations without cross-talk.
 *
 * Consumed as a resource: declare `Res(Particle)` as a system param, or
 * grab it with `app.getResource(Particle)` outside ECS code.
 */
declare class ParticleAPI {
    private readonly module_;
    private readonly registry_;
    private readonly collisions_;
    /** @param module whichever engine core is present — the wasm module on the web,
     *  the native host's bindings on a device (see ecs/engineApi.ts). */
    constructor(module: NonNullable<EngineApi>, registry: CppRegistry, resolve?: ParticleQueryResolver);
    update(dt: number): void;
    /** Contacts published by the last completed update, in project world units. */
    get collisionEvents(): readonly ParticleCollisionEventPayload[];
    /** Per-emitter counters from the last update, including fallback reasons. */
    get collisionStats(): readonly ParticleCollisionStats[];
    /** Provider errors are visible alongside the unavailable/fallback counters. */
    get collisionError(): string | null;
    /** Global App caps, independent of each emitter's smaller limits. */
    setCollisionBudget(budget: Partial<ParticleCollisionBudget>): void;
    /** Draw bounded hit normals without enabling gameplay collision events. */
    get debugNormals(): boolean;
    set debugNormals(enabled: boolean);
    /** @internal */
    get collisionContacts(): readonly ParticleCollisionEventPayload[];
    play(entity: Entity): void;
    stop(entity: Entity): void;
    reset(entity: Entity): void;
    /**
     * Spawn `count` of `entity`'s particles at a world point, now — an impact's sparks, a muzzle's flash — without moving
     * the emitter or replaying it (Unity's `ParticleSystem.Emit`). The emitter's own settings make them; its shape's +Y (a
     * cone's or hemisphere's axis) points along `options.normal` when given, else as the entity is turned, and
     * `options.velocity` is added to each. CPU-simulated emitters only. Returns how many were spawned.
     */
    emitAt(entity: Entity, count: number, position: {
        x: number;
        y: number;
        z: number;
    }, options?: {
        normal?: {
            x: number;
            y: number;
            z: number;
        };
        velocity?: {
            x: number;
            y: number;
            z: number;
        };
    }): number;
    getAliveCount(entity: Entity): number;
    /**
     * Upload an entity's baked color-over-life LUT (an N×4 RGBA Float32Array) so
     * the sim samples it instead of start/end + easing; pass null to clear. The
     * data is copied into the wasm heap for the call, then freed.
     */
    setColorLut(entity: Entity, lut: Float32Array | null): void;
    /** Upload an entity's baked size-over-life multiplier LUT (an N-scalar
     *  Float32Array), or null to clear. */
    setSizeLut(entity: Entity, lut: Float32Array | null): void;
    /**
     * Speed-over-life multiplier. Scales how fast a particle travels along the
     * trajectory it already has — gravity, damping and noise still accumulate
     * into its velocity, so this is not a second force system.
     */
    setSpeedLut(entity: Entity, lut: Float32Array | null): void;
    /**
     * Burst schedule: each burst releases `count` particles once the emitter has been emitting for `time` seconds
     * (counted from the end of its start delay). A looping emitter repeats the schedule every duration. Null clears.
     */
    setBursts(entity: Entity, bursts: readonly {
        time: number;
        count: number;
    }[] | null): void;
    private uploadLut;
}
/** Resource handle for the per-app particle API. */
declare const Particle: ResourceDef<ParticleAPI>;

/**
 * @file    keyframes.ts
 * @brief   A curve as authored: keys, tangents, and the one function that samples them.
 *
 * There were two curves. A timeline channel had tangents and six interpolations and an
 * editor that could draw it; a particle's size-over-life had `{t, v}` pairs, straight
 * lines, and no way to author one at all. Nothing about "a value that changes over a
 * span" is particular to either, so the shape and the sampler live here and both ask.
 *
 * Where `time` runs is the caller's: seconds for a timeline, 0..1 of a particle's life.
 *
 * @copyright Copyright (c) 2026 ESEngine Team
 *            Licensed under the Apache License, Version 2.0.
 */
/** How a key reaches the NEXT one. Set per key, so one curve can mix them. */
declare const InterpType: {
    readonly Hermite: "hermite";
    readonly Linear: "linear";
    readonly Step: "step";
    readonly EaseIn: "easeIn";
    readonly EaseOut: "easeOut";
    readonly EaseInOut: "easeInOut";
};
type InterpType = (typeof InterpType)[keyof typeof InterpType];
/** One authored point on a curve. Tangents are in value-per-unit-of-time. */
interface Keyframe {
    time: number;
    value: number;
    inTangent: number;
    outTangent: number;
    interpolation?: InterpType;
}
/**
 * @brief The value @p keys hold at @p at. Endpoints CLAMP — a curve states what it
 *        states and nothing beyond, which is what lets a caller sample any time.
 *
 * @details Keys are expected in ascending time; an empty curve is 0 and a single key is
 *          that key everywhere. Hermite is the default: a key states tangents, so
 *          ignoring them would be a silent straight line.
 */
declare function sampleKeyframes(keys: readonly Keyframe[], at: number): number;
/**
 * @brief A curve as a component or asset carries it.
 * @details A named shape rather than a bare array so a field can say "this is a curve"
 *          and an editor can offer a curve to author it.
 */
interface Curve {
    keys: Keyframe[];
}
/** A key at @p time with straight lines either side — what a hand-written curve wants. */
declare function linearKey(time: number, value: number): Keyframe;

/**
 * The `.estimeline` format version. What the serializer stamps and what the
 * loader migrates up to: two constants would let a document be written at a
 * version its own reader thinks needs migrating.
 */
declare const TIMELINE_FORMAT_VERSION = "1.3";
declare const WrapMode: {
    readonly Once: 0;
    readonly Loop: 1;
    readonly PingPong: 2;
};
type WrapMode = (typeof WrapMode)[keyof typeof WrapMode];
declare const TrackType: {
    readonly Property: "property";
    readonly Spine: "spine";
    readonly SpriteAnim: "spriteAnim";
    readonly Audio: "audio";
    readonly Particle: "particle";
    readonly Activation: "activation";
    readonly Marker: "marker";
    readonly CustomEvent: "customEvent";
    readonly AnimFrames: "animFrames";
    readonly Camera: "camera";
    readonly Sequence: "sequence";
};
type TrackType = (typeof TrackType)[keyof typeof TrackType];

interface PropertyChannel {
    property: string;
    keyframes: Keyframe[];
}
interface TrackBase {
    type: TrackType;
    name: string;
    childPath: string;
}
interface PropertyTrack extends TrackBase {
    type: typeof TrackType.Property;
    component: string;
    channels: PropertyChannel[];
}
interface SpineClip {
    start: number;
    duration: number;
    animation: string;
    loop: boolean;
    speed: number;
}
interface SpineTrack extends TrackBase {
    type: typeof TrackType.Spine;
    clips: SpineClip[];
    blendIn: number;
}
interface SpriteAnimTrack extends TrackBase {
    type: typeof TrackType.SpriteAnim;
    clip: string;
    startTime: number;
}
interface ParticleTrack extends TrackBase {
    type: typeof TrackType.Particle;
    events: {
        time: number;
        action: 'play' | 'stop' | 'reset';
    }[];
}
interface AudioEvent {
    time: number;
    clip: string;
    volume: number;
}
interface AudioTrack extends TrackBase {
    type: typeof TrackType.Audio;
    events: AudioEvent[];
}
interface ActivationRange {
    start: number;
    end: number;
}
interface ActivationTrack extends TrackBase {
    type: typeof TrackType.Activation;
    ranges: ActivationRange[];
}
interface Marker {
    time: number;
    name: string;
}
interface MarkerTrack extends TrackBase {
    type: typeof TrackType.Marker;
    markers: Marker[];
}
interface CustomEvent {
    time: number;
    name: string;
    payload: Record<string, unknown>;
}
interface CustomEventTrack extends TrackBase {
    type: typeof TrackType.CustomEvent;
    events: CustomEvent[];
}
interface AnimFrame {
    texture: string;
    duration?: number;
}
interface AnimFramesTrack extends TrackBase {
    type: typeof TrackType.AnimFrames;
    frames: AnimFrame[];
}
/**
 * One shot: the camera that is the view for `duration` seconds from `start`.
 * Shots that touch cut; shots that overlap blend over the overlap, with this shot's `curve` (a
 * BlendCurve) shaping the later one's arrival.
 */
interface CameraClip {
    start: number;
    duration: number;
    /** The camera entity, as a name path below the timeline's root, like every track's target. */
    camera: string;
    curve?: number;
}
/** The view over time. Not about any one object, so its `childPath` is always empty. */
interface CameraTrack extends TrackBase {
    type: typeof TrackType.Camera;
    clips: CameraClip[];
}
/** Another timeline, played in a window of this one. */
interface SequenceClip {
    start: number;
    duration: number;
    /** The `.estimeline` it plays, by asset ref. */
    timeline: string;
    /** Where the nested timeline's own name paths start, below this timeline's root ('' = the root itself). */
    root: string;
    speed: number;
    /** Repeat the nested timeline to fill `duration` instead of holding its last frame. */
    loop: boolean;
}
interface SequenceTrack extends TrackBase {
    type: typeof TrackType.Sequence;
    clips: SequenceClip[];
}
type Track = PropertyTrack | SpineTrack | SpriteAnimTrack | ParticleTrack | AudioTrack | ActivationTrack | MarkerTrack | CustomEventTrack | AnimFramesTrack | CameraTrack | SequenceTrack;
interface TimelineAsset {
    version: string;
    type: 'timeline';
    duration: number;
    wrapMode: WrapMode;
    tracks: Track[];
}

declare function parseTimelineAsset(rawJson: unknown): TimelineAsset;

/**
 * @file    TimelineEvaluator.ts
 * @brief   Pure-TS timeline sampler — evaluate a TimelineAsset at an absolute
 *          time and apply its property tracks to the world.
 *
 * The engine's C++ TimelineSystem is a temporary implementation. This is the
 * modern replacement's kernel: ONE
 * sample(time) call drives both forward playback (advance the clock, then sample)
 * and editor scrubbing (sample at any T) — so the editor gets "scrub ==
 * evaluate-at-T" for free, with no separate evaluate/apply paths.
 *
 * The interpolation math is a 1:1 port of TimelineSystem.cpp::evaluateChannel
 * (hermite/linear/step/ease) so playback and editor preview match the C++ path
 * numerically, and P4 can delete the C++ runtime with no regression.
 *
 * The sampler is dependency-injected (world / component lookup / child resolution)
 * so it is a pure function: unit-testable without WASM and reusable by both the
 * runtime and the editor preview bridge.
 */

/** Evaluate a single property channel at `time` (seconds). Endpoints clamp. */
declare function evaluateChannel(channel: PropertyChannel, time: number): number;
/** Map an absolute time through the clip's wrap mode (for forward playback). */
declare function applyWrapMode(time: number, duration: number, mode: WrapMode): {
    time: number;
    stopped: boolean;
};
/**
 * Whether a channel states the placement of the entity the clip is played ON —
 * the whole of root motion: a channel aimed at a child poses a bone, one aimed at
 * nothing says where the character travels. Read by both the sampler that leaves
 * these out of the pose and the extractor, so the two cannot disagree.
 */
declare function isRootPlacementChannel(childPath: string, component: string, property: string): boolean;
/** Where a clip says its entity stands, over a base that states nothing. */
interface RootPlacement {
    position: Vec3;
    rotation: Quat;
}
/** A placement holder to sample into; the base is neutral, see below. */
declare function createRootPlacement(): RootPlacement;
/**
 * The root placement `asset` states at `time`, into `out`. Over a NEUTRAL base:
 * two of these are only ever subtracted, so the entity's own values would cancel
 * anyway while making the answer depend on where the character stood.
 *
 * False when the clip states no root track — not the same as one holding still.
 */
declare function sampleRootPlacement(asset: TimelineAsset, time: number, out: RootPlacement): boolean;
/** Minimal world surface the sampler needs (component get/set by definition). */
interface SampleWorld {
    has(entity: Entity, def: AnyComponentDef): boolean;
    get(entity: Entity, def: AnyComponentDef): Record<string, unknown>;
    set(entity: Entity, def: AnyComponentDef, data: Record<string, unknown>): void;
}
interface SampleDeps {
    world: SampleWorld;
    getComponent: (name: string) => AnyComponentDef | undefined;
    resolveChild: (root: Entity, childPath: string) => Entity | null;
}
interface SampleOptions {
    /** Return true to skip a channel — the editor uses this for muted tracks. */
    skipChannel?: (childPath: string, component: string, property: string) => boolean;
}
/** Evaluate every property track at `time` and write the results to the world. */
declare function sampleTimeline(asset: TimelineAsset, time: number, rootEntity: Entity, deps: SampleDeps, opts?: SampleOptions): void;
/**
 * Convenience wrapper binding the real SDK component registry + child resolver.
 * The editor preview bridge and the runtime both call this; tests inject mocks
 * into {@link sampleTimeline} directly.
 */
declare function sampleTimelineInWorld(asset: TimelineAsset, time: number, world: SampleWorld & Pick<World, 'tryGet'>, rootEntity: Entity, opts?: SampleOptions): void;

/**
 * @file    timelineEvents.ts
 * @brief   Which stretches of a clip a playhead covered between two times, and
 *          which authored events that crossed.
 *
 * @details A fixed step never lands on an event's time, so "did it happen" is a
 *          question about an INTERVAL, and the interval is not always one piece:
 *          a looping clip advancing past its end covered the tail and then the
 *          head, with a discontinuity between them that a single (from, to] span
 *          reads as a rewind. {@link playheadRuns} is the one place that knows
 *          the shape of that, so events and root motion answer the same question
 *          the same way — the alternative is two wrap handlers that agree until
 *          one of them is fixed.
 *
 *          Pure: no world, no asset state. What a run means in clip time is all
 *          that is here, so the loop seam is a unit test rather than a frame.
 */

/**
 * A stretch of clip time the playhead covered, in the direction it covered it —
 * `to` below `from` is a ping-pong clip running backwards. `inclusiveStart` marks
 * a run that BEGINS an instant rather than continuing one: the frame a state was
 * entered, and each lap of a loop.
 */
interface PlayheadRun {
    from: number;
    to: number;
    inclusiveStart: boolean;
}
/**
 * The stretches of clip time a playhead covered going from `from` to `to` (both
 * in clip seconds, `to` at or after `from`) under `mode`.
 *
 * A span at least a whole pass long collapses to ONE covering run: a frame long
 * enough to lap the clip twice reporting everything twice is a stutter.
 */
declare function playheadRuns(from: number, to: number, duration: number, mode: WrapMode, inclusiveStart: boolean): PlayheadRun[];
/** Whether a moment at `at` falls inside `run`, in the direction it runs. */
declare function runCrosses(run: PlayheadRun, at: number): boolean;
/**
 * Append every custom event `asset` declares within `runs` to `out`, run by run
 * and then in declaration order, so a long frame still reports swing before hit.
 * `childPath` is not read: the event happened to the character the clip plays on.
 */
declare function collectCustomEvents(asset: TimelineAsset, runs: readonly PlayheadRun[], out: MotionEvent[]): void;

/**
 * @file    timelineSequences.ts
 * @brief   Which timelines play inside which, and which camera is the view when.
 *
 * Both are pure functions of (asset, time), so playback, scrubbing and a backwards run all ask the
 * same question and get the same answer: nothing here remembers the previous frame.
 */

/** Timelines nested deeper than this are not played (and the editor refuses to build them). */
declare const MAX_SEQUENCE_DEPTH = 4;
/** What a nested timeline sees: its own clock, and the entity its name paths start from. */
interface SequenceLayer {
    /** Stable across frames while the clip plays: which track and clip, down the nesting. */
    key: string;
    asset: TimelineAsset;
    ref: string;
    /** The nested timeline's own time. */
    time: number;
    clip: SequenceClip;
    root: Entity;
}
type SequenceLookup = (ref: string) => TimelineAsset | undefined;
type ChildResolver = (root: Entity, childPath: string) => Entity | null;
/**
 * The timelines playing inside `asset` at `time`, outermost first, with each one's own time and root.
 * A timeline already on the way down (a loop) or past the depth limit is skipped, not entered.
 */
declare function collectSequenceLayers(asset: TimelineAsset, time: number, root: Entity, resolveChild: ChildResolver, lookup: SequenceLookup, chain?: readonly string[], keyPrefix?: string, depth?: number): SequenceLayer[];
/** Whether `ref` can be played inside `asset` without it ending up inside itself, by whatever route. */
declare function wouldNestCycle(host: string, ref: string, lookup: SequenceLookup): boolean;
/** The view at one moment: `to` is the camera now, `from` the one it is leaving, `weight` how far across. */
interface ShotState {
    from: string | null;
    to: string;
    /** 0..1 along the overlap; 1 when there is nothing being left. */
    weight: number;
    curve: number;
}
/**
 * Which camera is the view at `time`. Clips that touch cut; clips that overlap blend over the overlap.
 * No clip over `time` is no answer (null): the scene's own camera takes over.
 */
declare function resolveShot(clips: readonly CameraClip[], time: number): ShotState | null;
/** A shot with its cameras resolved to entities — what the camera director takes. */
interface ActiveShot {
    from: Entity | null;
    to: Entity;
    weight: number;
    curve: number;
}
/**
 * The shot at `time` across a timeline and the ones nested in it: the outermost timeline that has a camera
 * answer wins, so a parent's cut is not overridden by what a child inside it was doing.
 */
declare function resolveActiveShot(asset: TimelineAsset, time: number, root: Entity, resolveChild: ChildResolver, lookup: SequenceLookup): ActiveShot | null;

/**
 * @file    TimelineDrive.ts
 * @brief   Pure-TS per-frame timeline runtime — the replacement for the C++
 *          TimelineSystem::advance.
 *
 * Holds a per-entity playback clock and, each frame: advances time (speed + wrap),
 * samples property tracks (via the shared evaluator), and edge-detects event-track
 * triggers through the shared {@link applyTimelineEvent}. Event windows use the
 * same playhead runs as animator motions, including loop seams and ping-pong
 * turns; a folded sample time alone cannot preserve playback direction.
 */

/** Per-entity playback state (replaces the C++ Instance clock). */
interface TimelineState {
    time: number;
    prevTime: number;
    /** Unfolded playback time. Optional for callers constructing older state records. */
    phase?: number;
    /** Whether the entry instant has already been dispatched. */
    started?: boolean;
    playing: boolean;
    speed: number;
    wrapMode: WrapMode;
    /** Per spine event-track (keyed by track index in asset.tracks): current clip, or -1. */
    spineClipIndices: Record<number, number>;
    /** The timelines playing inside this one, by `SequenceLayer.key`: where each was last step, for edge detection. */
    nested: Record<string, {
        time: number;
        spineClipIndices: Record<number, number>;
    }>;
}

/**
 * @internal How the api reaches the `TimelinePlayer` component flags. Injected
 * by `TimelinePlugin` (which owns both sides, avoiding a module cycle). The
 * component flags are the authoritative playback channel — the per-frame system
 * reconciles them into {@link TimelineState} — so play/pause/stop must write
 * through to them or they would be overwritten on the next tick.
 */
interface PlayerFlagChannel {
    /** Raise `playing` (replays from the top when the clip is finished). */
    raise(entity: Entity): void;
    /** Lower `playing`, keeping the clock (pause). */
    lower(entity: Entity): void;
    /** Lower `playing` and clear `finished` (a stopped clip is rewound, not completed). */
    reset(entity: Entity): void;
}
/**
 * Per-App timeline playback control. Holds this App's per-entity playback state
 * and is published as the {@link Timeline} resource; game code drives playback via
 * `app.getResource(Timeline)`.
 *
 * The timeline runtime is pure TS now — there is no
 * C++ handle or wasm module here. `TimelinePlugin` advances each entity's
 * {@link TimelineState} every frame; these methods flip/seek that state and
 * write the play flags through to the entity's `TimelinePlayer` component.
 */
declare class TimelineAPI {
    private readonly flags_;
    private readonly states_;
    private readonly codeAssets_;
    private assetTimelines_;
    constructor(flags_?: PlayerFlagChannel | null);
    /**
     * Register a timeline built in code under `name`, so a `TimelinePlayer`
     * whose `timeline` is that name plays it like an authored one.
     *
     * Per app, like every other code registration: a name registered here is
     * this app's, and it wins over an asset of the same name.
     */
    registerAsset(name: string, asset: TimelineAsset): void;
    unregisterAsset(name: string): void;
    /** @internal Where a loaded `.estimeline` comes from: this app's realm. */
    useAssetTimelines(source: (ref: string) => TimelineAsset | undefined): void;
    /** What `name` plays: a code registration first, then this realm's asset. */
    getAsset(name: string): TimelineAsset | undefined;
    /** @internal Plugin ensures (creating if needed) the per-entity playback state. */
    ensureState(entity: Entity, wrapMode: WrapMode, speed: number): TimelineState;
    getState(entity: Entity): TimelineState | undefined;
    /** @internal Forget an entity's state (on despawn). */
    removeState(entity: Entity): void;
    /** @internal */
    clearStates(): void;
    play(entity: Entity): void;
    pause(entity: Entity): void;
    stop(entity: Entity): void;
    setTime(entity: Entity, time: number): void;
    isPlaying(entity: Entity): boolean;
    getCurrentTime(entity: Entity): number;
}
/**
 * Per-App timeline control resource, published by `TimelinePlugin`. Drive
 * playback as `app.getResource(Timeline).play(entity)`.
 */
declare const Timeline: ResourceDef<TimelineAPI>;

/**
 * @file    childPath.ts
 * @brief   Address a descendant by its `"a/b/c"` path of names, and walk a subtree.
 *
 * A rig's joints ARE its entity hierarchy here, so this is how an animation clip
 * reaches the bone it animates and how a layer mask names the part of the body it
 * is allowed to write. It grew up under `timeline/` because clips asked first,
 * but nothing in it is a timeline — it speaks Children and Name — so it lives
 * where anything addressing a rig can reach it without importing that module.
 */

/**
 * The descendant `childPath` names, relative to `rootEntity`; the root itself for
 * an empty path. Null when a segment names no child, which is what an authored
 * path pointing at a renamed bone comes to.
 */
declare function resolveChildEntity(world: Pick<World, 'tryGet'>, rootEntity: Entity, childPath: string): Entity | null;

/**
 * @file    TimelineSerializer.ts
 * @brief   Serialize an in-memory TimelineAsset back to .estimeline JSON — the
 *          inverse of TimelineLoader.parseTimelineAsset.
 *
 * The runtime previously only LOADED timelines; authoring (the Sequencer editor)
 * needs to write them back. Field names and the wrapMode
 * string encoding mirror the loader exactly so parse(serialize(x)) round-trips —
 * notably AnimFrames tracks persist under the on-disk key `animFrames` (the loader
 * reads `raw.animFrames` into the in-memory `frames`).
 */

/** Serialize to a plain JSON-ready object (the `.estimeline` document shape). */
declare function serializeTimelineAsset(asset: TimelineAsset): Record<string, unknown>;
/** Serialize to a pretty-printed JSON string for writing to disk. */
declare function serializeTimelineToJson(asset: TimelineAsset, indent?: number): string;

/**
 * @file    AnimationClip.ts
 * @brief   The unified animation-clip loader — one .esanim document the Sequencer
 *          authors and the Animator state-machine references.
 *
 * The editor unified two formats into `.esanim`: the rich multi-track model
 * (property curves + sprite frames + events + …) and the legacy sprite-flipbook
 * AnimClip (frames + fps). `parseAnimationClip` accepts either — discriminating by
 * structure, not the `type` string — and returns the one in-memory model
 * ({@link TimelineAsset}). A flipbook becomes a clip with a single sprite-frame
 * track, so old `.esanim` files keep working while everything converges on one
 * format. (The engine's two RUNTIMES merge in P4; this is the format seam.)
 */

/**
 * Parse any `.esanim` / legacy `.estimeline` document into the unified clip model.
 * Discriminates by shape: a `tracks` array is the rich multi-track clip; a `frames`
 * array is the legacy flipbook.
 */
declare function parseAnimationClip(rawJson: unknown): TimelineAsset;

interface TimelinePlayerData {
    timeline: string;
    playing: boolean;
    speed: number;
    /** Overrides the wrap mode the CLIP declares; empty means the clip's own. */
    wrapMode: string;
    /**
     * Latched true when a Once clip completes; cleared when `playing` is raised
     * again (which replays from the top). Runtime-observable — don't author it.
     */
    finished: boolean;
}
declare const TimelinePlayer: ComponentDef<TimelinePlayerData>;

declare class TimelinePlugin implements Plugin {
    name: string;
    private animFramesStates_;
    private offDespawn_;
    build(app: App): void;
    clearHandles(): void;
    cleanup(): void;
    private ensureAnimFrames;
    private processAnimFrames;
}
declare const timelinePlugin: TimelinePlugin;

/**
 * @file    timelineMotion.ts
 * @brief   The `timeline` motion kind: an animator state driving an `.estimeline`.
 *
 * @details This is what lets one animator graph animate a skinned model. A
 *          skeletal clip IS a timeline - property tracks writing each joint
 *          entity's Transform - so this driver samples the same asset with the
 *          same evaluator, and what it produces is a pose rather than a write.
 *          The path from joint Transform to MeshSkin is unchanged: the animator
 *          adds no second owner of a bone pose.
 *
 *          It does not touch TimelinePlayer. That component carries a clip's own
 *          clock for standalone playback, and one clock cannot serve two clips
 *          at once - which crossfade needs. The animator keeps the time and
 *          hands it in; TimelinePlayer stays what a timeline plays on when no
 *          animator is involved.
 */

declare const TIMELINE_MOTION = "timeline";
/**
 * The driver, over the app's own {@link TimelineAPI}: which clip a name resolves
 * to is per App, so this is built per App rather than being a module value.
 */
interface TimelineMotionEffects {
    /** Resolve lazily: a module may be installed after the timeline plugin. Per App. */
    particle?: () => Pick<ParticleAPI, 'play' | 'stop' | 'reset'> | null;
}
declare function createTimelineMotionDriver(timeline: TimelineAPI, effects?: TimelineMotionEffects): MotionDriver<AnimatorClipMotion>;

export { InterpType, MAX_SEQUENCE_DEPTH, Particle, ParticleAPI, ParticleCollisionEvent, TIMELINE_FORMAT_VERSION, TIMELINE_MOTION, Timeline, TimelineAPI, TimelinePlayer, TimelinePlugin, TrackType, WrapMode, applyWrapMode, collectCustomEvents, collectSequenceLayers, createRootPlacement, createTimelineMotionDriver, evaluateChannel, isRootPlacementChannel, linearKey, parseAnimationClip, parseTimelineAsset, playheadRuns, resolveActiveShot, resolveChildEntity, resolveShot, runCrosses, sampleKeyframes, sampleRootPlacement, sampleTimeline, sampleTimelineInWorld, serializeTimelineAsset, serializeTimelineToJson, timelinePlugin, wouldNestCycle };
export type { ActivationTrack, ActiveShot, AnimFramesTrack, AudioTrack, CameraClip, CameraTrack, Curve, CustomEvent, CustomEventTrack, Keyframe, ParticleCollisionBudget, ParticleCollisionEventPayload, ParticleCollisionStats, PlayheadRun, PropertyChannel, PropertyTrack, RootPlacement, SampleDeps, SampleOptions, SampleWorld, SequenceClip, SequenceLayer, SequenceLookup, SequenceTrack, ShotState, SpineTrack, SpriteAnimTrack, TimelineAsset, TimelinePlayerData, Track };
