import { Vec2, Entity, CppRegistry } from './wasm.js';
import { SpineAABB, SpinePair, SpineCullingEnvelope, SpineEraBinding, Plugin, App } from './app.js';
import { SpineVersion, ResourceDef } from './resource.js';
import { EngineApi } from './engineApi.js';
import { SkeletalBone, MeshBatchVisitor, SkeletalMaterialOf, SkeletalBoneTree } from './runtimeAssets.js';

/**
 * @file    spineMetrics.ts
 * @brief   What one runtime's frame cost, as facts rather than a number.
 *
 * @details Fine-grained is COUNTED, coarse-grained is TIMED. A clock read beside
 *          each of the eleven crossings an entity makes is eleven thousand clock
 *          reads at a thousand entities — the observer becoming the thing worth
 *          observing. So the counts are exact and free, and the timers are two
 *          per runtime per frame.
 *
 *          Which is why `readback` is one phase here and not four. Splitting it
 *          into discover / extract / transfer needs a clock at every batch
 *          boundary; that experiment lives in benchmarks/spine-readback-phases,
 *          where paying for it changes nothing anyone ships.
 *
 *          Aggregated per RUNTIME, never per entity: the unit anything is done
 *          about — a batch ABI, a shared buffer, a version that misbehaves — is
 *          one loaded Spine version, and a map keyed by entity would allocate
 *          per entity to say so.
 */
/**
 * What one skeleton's clipping costs, in work rather than time. Three facts and
 * not one score, because they do not grow alike: `rawVertices` prices OPENING a
 * region and rises faster than itself, `edgeWork` prices the cut and is linear
 * in triangles x edges, amplification is what clipping hands the stages after.
 */
interface SpineClipBudget {
    /** The polygon as authored. Fixed by the attachment, not by the pose. */
    rawVertices: number;
    /** Convex pieces it decomposed into. More than one means concave. */
    pieces: number;
    /** Edges across those pieces — what a cut is actually charged per triangle. */
    effectiveEdges: number;
    /** Triangles that reached the region at all. */
    candidateTriangles: number;
    /** …whose bounds could not meet it. */
    rejectedTriangles: number;
    /** …that were wholly inside a convex one and passed through untouched. */
    bypassedTriangles: number;
    /** …that the cut actually ran on. The only ones a budget is charged for. */
    chargedTriangles: number;
    /** Σ charged triangles x the edges of the region charging them. */
    edgeWork: number;
    inputVertices: number;
    outputVertices: number;
    outputTriangles: number;
    /** Sharing the cut destroyed: it rebuilds every triangle's own vertices. */
    vertexAmplification: number;
    triangleAmplification: number;
}
/** Every crossing a frame made into the module, by what it asked for. */
interface SpineAbiCounts {
    pose: number;
    /** Crossings that resolved world transforms — the other half of a pose. */
    world: number;
    batchCount: number;
    vertexCount: number;
    indexCount: number;
    batchData: number;
    batchColor: number;
    malloc: number;
    free: number;
    submit: number;
}
/** Bytes moved, which no call count can stand in for. */
interface SpineByteCounts {
    /** Read out of the module's heap by the walk. */
    wasmRead: number;
    /** Written into the engine core's heap for submission. */
    coreWrite: number;
    /** Handed out by the module's allocator for one frame's batches. */
    scratchAllocated: number;
}
/** One runtime's frame. Mutated in place — a frame that allocates to say what a
 *  frame cost is measuring itself. */
/**
 * A frame's posing, as what was asked for rather than what was called.
 *
 * Each counts ONE thing. `renderCulled` is per (entity, CAMERA): an entity four
 * cameras declined was declined four times and owes one world pose, so it is not
 * a count of deferrals and is not reported as one — that would need somewhere
 * that knows the frame ended, and there is no such place yet.
 */
interface SpinePoseCounts {
    logicalUpdates: number;
    worldMaterializations: number;
    worldAlreadyCurrent: number;
    meshExtractions: number;
    renderCulled: number;
}
interface SpineFrameMetrics {
    frame: number;
    entities: number;
    residencies: number;
    meshBatches: number;
    vertices: number;
    indices: number;
    abi: SpineAbiCounts;
    /** What the frame's poses were made of, in demand rather than in calls. */
    pose: SpinePoseCounts;
    bytes: SpineByteCounts;
    /** Milliseconds. `readback` is the whole extract+submit pass; see the file
     *  note for why it is not four numbers. */
    time: {
        pose: number;
        readback: number;
        total: number;
    };
}
/** What a frame reports as it goes: counters only, incremented at the call sites
 *  that make the crossings. Shared with every skeletal runtime — the walk is. */
interface SkeletalProbe {
    meshBatches: number;
    vertices: number;
    indices: number;
    abi: SpineAbiCounts;
    bytes: SpineByteCounts;
}
/** The last N frames of one number, and what they were. A mean hides the frame
 *  that missed: four at 4ms and one at 9ms averages to a budget nobody blew. */
declare class SpineTimeWindow {
    readonly capacity: number;
    private samples_;
    private count_;
    private at_;
    private scratch_;
    constructor(capacity?: number);
    push(ms: number): void;
    get size(): number;
    /** last / mean / p50 / p95 / max over the window. Allocates one object per
     *  CALL, which is a diagnostic reading its own answer, not a frame. */
    stats(): {
        last: number;
        mean: number;
        p50: number;
        p95: number;
        max: number;
    };
}

/**
 * @file    SpineModuleLoader.ts
 * @brief   Loads and initializes the standalone Spine WASM module
 */
interface SpineWasmModule {
    _spine_loadSkeleton(skelDataPtr: number, skelDataLen: number, atlasPtr: number, atlasLen: number, isBinary: number): number;
    _spine_unloadSkeleton(handle: number): void;
    _spine_getAtlasPageCount(handle: number): number;
    _spine_getAtlasPageTextureName(handle: number, pageIndex: number): number;
    _spine_setAtlasPageTexture(handle: number, pageIndex: number, textureId: number, width: number, height: number): void;
    _spine_createInstance(skeletonHandle: number): number;
    _spine_destroyInstance(instanceId: number): void;
    _spine_playAnimation(instanceId: number, name: number, loop: number, track: number): number;
    _spine_setToSetupPose(instanceId: number): void;
    _spine_addAnimation(instanceId: number, name: number, loop: number, delay: number, track: number): number;
    _spine_setSkin(instanceId: number, name: number): void;
    _spine_update(instanceId: number, dt: number): void;
    _spine_advanceAndApply(instanceId: number, dt: number): void;
    _spine_materializeWorldPose(instanceId: number, dt: number): void;
    _spine_requiresContinuousWorldPose(skeletonHandle: number): number;
    _spine_getAnimationDuration(skeletonHandle: number, animation: number): number;
    _spine_getAnimations(instanceId: number): number;
    _spine_getSkins(instanceId: number): number;
    _spine_getBonePosition(instanceId: number, bone: number, outXPtr: number, outYPtr: number): number;
    _spine_getBoneRotation(instanceId: number, bone: number): number;
    _spine_getBones?(instanceId: number): number;
    _spine_getBonePoses?(instanceId: number, outPtr: number, capacity: number): number;
    _spine_getBounds(instanceId: number, outXPtr: number, outYPtr: number, outWPtr: number, outHPtr: number): void;
    _spine_getSkeletonBounds(skeletonHandle: number, outXPtr: number, outYPtr: number, outWPtr: number, outHPtr: number): number;
    _spine_getMeshBatchColorPremultiplied?(instanceId: number, batchIndex: number): number;
    _spine_getMeshBatchCount(instanceId: number): number;
    _spine_getMeshBatchVertexCount(instanceId: number, batchIndex: number): number;
    _spine_getMeshBatchIndexCount(instanceId: number, batchIndex: number): number;
    _spine_getMeshBatchData(instanceId: number, batchIndex: number, outVerticesPtr: number, outIndicesPtr: number, outTextureIdPtr: number, outBlendModePtr: number): void;
    /** Toggle clip-region processing (default on) — perf escape hatch for clip-free scenes. */
    _spine_setClippingEnabled(enabled: number): void;
    _spine_setDefaultMix(skeletonHandle: number, duration: number): void;
    _spine_setMixDuration(skeletonHandle: number, fromAnim: number, toAnim: number, duration: number): void;
    _spine_setTrackAlpha(instanceId: number, track: number, alpha: number): void;
    _spine_enableEvents(instanceId: number): void;
    _spine_getEventCount(instanceId: number): number;
    _spine_getEventBuffer(): number;
    _spine_clearEvents(): void;
    _spine_getEventAnimationName(index: number): number;
    _spine_getEventName(index: number): number;
    _spine_getEventStringValue(index: number): number;
    _spine_setAttachment(instanceId: number, slotName: number, attachmentName: number): number;
    _spine_setIKTarget(instanceId: number, constraintName: number, targetX: number, targetY: number, mix: number): number;
    _spine_setSlotColor(instanceId: number, slotName: number, r: number, g: number, b: number, a: number): number;
    _spine_setSkeletonColor(instanceId: number, r: number, g: number, b: number, a: number): number;
    _spine_listConstraints(instanceId: number): number;
    _spine_getTransformConstraintMix(instanceId: number, name: number): number;
    _spine_setTransformConstraintMix(instanceId: number, name: number, rotate: number, x: number, y: number, scaleX: number, scaleY: number, shearY: number): number;
    _spine_getPathConstraintMix(instanceId: number, name: number): number;
    _spine_setPathConstraintMix(instanceId: number, name: number, position: number, spacing: number, rotate: number, x: number, y: number): number;
    _spine_probe_extract(instanceId: number, stage: number, useCollector: number): number;
    _spine_probe_counts(out: number): void;
    _spine_probe_clip_storage(out: number): void;
    _spine_clipBudget(instanceId: number, out: number): number;
    _spine_probe_clip_start(instanceId: number, stage: number): number;
    _spine_probe_clip_start_counts(out: number): void;
    _spine_probe_storage(out: number): void;
    _spine_probe_pose(instanceId: number, dt: number, stage: number): number;
    _spine_probe_pose_counts(out: number): void;
    cwrap(ident: string, returnType: string | null, argTypes: string[]): (...args: unknown[]) => unknown;
    UTF8ToString(ptr: number): string;
    stringToNewUTF8(str: string): number;
    HEAPF32: Float32Array;
    HEAPU8: Uint8Array;
    HEAPU32: Uint32Array;
    _malloc(size: number): number;
    _free(ptr: number): void;
}
interface SpineWrappedAPI {
    loadSkeleton(skelDataPtr: number, skelDataLen: number, atlasPtr: number, atlasLen: number, isBinary: boolean): number;
    getLastError(): string;
    unloadSkeleton(handle: number): void;
    getAtlasPageCount(handle: number): number;
    getAtlasPageTextureName(handle: number, pageIndex: number): string;
    setAtlasPageTexture(handle: number, pageIndex: number, textureId: number, width: number, height: number): void;
    createInstance(skeletonHandle: number): number;
    destroyInstance(instanceId: number): void;
    playAnimation(instanceId: number, name: string, loop: boolean, track: number): boolean;
    /** Back to the data's own starting pose, tracks cleared — what a replay starts from. */
    setToSetupPose(instanceId: number): void;
    addAnimation(instanceId: number, name: string, loop: boolean, delay: number, track: number): boolean;
    setSkin(instanceId: number, name: string): void;
    update(instanceId: number, dt: number): void;
    /**
     * The two halves {@link update} is made of. Advancing is what an animation
     * MEANS — track time, mixing, events, attachments — and materializing is
     * where those local transforms become world ones. Only the second is worth
     * skipping, and only where {@link requiresContinuousWorldPose} says it may be.
     */
    advanceAndApply(instanceId: number, dt: number): void;
    materializeWorldPose(instanceId: number, dt: number): void;
    requiresContinuousWorldPose(skeletonHandle: number): number;
    /** Seconds; negative where the skeleton has no such animation. */
    getAnimationDuration(skeletonHandle: number, animation: string): number;
    getAnimations(instanceId: number): string;
    getSkins(instanceId: number): string;
    getBonePosition(instanceId: number, bone: string, outXPtr: number, outYPtr: number): boolean;
    getBoneRotation(instanceId: number, bone: string): number;
    /** Bone names in skeleton order, a parent before its children; absent on a module built before the call existed. */
    getBones?(instanceId: number): string;
    /** Five floats a bone — parent index (-1 for a root), x, y, degrees, length — into `outPtr`; returns the count written. */
    getBonePoses?(instanceId: number, outPtr: number, capacity: number): number;
    getBounds(instanceId: number, outXPtr: number, outYPtr: number, outWPtr: number, outHPtr: number): void;
    /** The skeleton's authored extent — answerable without an instance or a pose. */
    getSkeletonBounds(skeletonHandle: number, outXPtr: number, outYPtr: number, outWPtr: number, outHPtr: number): number;
    getMeshBatchCount(instanceId: number): number;
    getMeshBatchColorPremultiplied?(instanceId: number, batchIndex: number): number;
    getMeshBatchVertexCount(instanceId: number, batchIndex: number): number;
    getMeshBatchIndexCount(instanceId: number, batchIndex: number): number;
    getMeshBatchData(instanceId: number, batchIndex: number, outVerticesPtr: number, outIndicesPtr: number, outTextureIdPtr: number, outBlendModePtr: number): void;
    setDefaultMix(skeletonHandle: number, duration: number): void;
    setMixDuration(skeletonHandle: number, fromAnim: string, toAnim: string, duration: number): void;
    setTrackAlpha(instanceId: number, track: number, alpha: number): void;
    enableEvents(instanceId: number): void;
    getEventCount(instanceId: number): number;
    getEventBuffer(): number;
    clearEvents(): void;
    getEventAnimationName(index: number): string;
    getEventName(index: number): string;
    getEventStringValue(index: number): string;
    setAttachment(instanceId: number, slotName: string, attachmentName: string): boolean;
    setIKTarget(instanceId: number, constraintName: string, targetX: number, targetY: number, mix: number): boolean;
    setSlotColor(instanceId: number, slotName: string, r: number, g: number, b: number, a: number): boolean;
    setSkeletonColor(instanceId: number, r: number, g: number, b: number, a: number): boolean;
    listConstraints(instanceId: number): string;
    getTransformConstraintMix(instanceId: number, name: string): string;
    setTransformConstraintMix(instanceId: number, name: string, rotate: number, x: number, y: number, scaleX: number, scaleY: number, shearY: number): boolean;
    getPathConstraintMix(instanceId: number, name: string): string;
    setPathConstraintMix(instanceId: number, name: string, position: number, spacing: number, rotate: number, x: number, y: number): boolean;
    /**
     * BENCHMARK ONLY — run the extraction to `stage` and report what the walk
     * did (see benchmarks/spine-extract-stages). Nothing on a frame path calls
     * these: a frame's crossings are asserted in tests/spine-extract-stages.
     */
    probeExtract(instanceId: number, stage: number, useCollector: number): number;
    probeCounts(out: number): void;
    probeClipStorage(out: number): void;
    probeClipStart(instanceId: number, stage: number): number;
    probeClipStartCounts(out: number): void;
    /**
     * What one instance's clipping costs this pose, in work rather than time.
     * Poses and extracts, so it is a diagnostic call and not a frame reading.
     */
    clipBudget(instanceId: number, out: number): number;
    probeStorage(out: number): void;
    probePose(instanceId: number, dt: number, stage: number): number;
    probePoseCounts(out: number): void;
}
declare function wrapSpineModule(raw: SpineWasmModule): SpineWrappedAPI;
type SpineModuleFactory = (config?: Record<string, unknown>) => Promise<SpineWasmModule>;

/**
 * @file    SpineController.ts
 * @brief   Spine animation control for the modular Spine WASM module
 */

interface RawSpineEvent {
    type: number;
    track: number;
    floatValue: number;
    intValue: number;
    animationName: string;
    eventName: string;
    stringValue: string;
}
interface ConstraintList {
    ik: string[];
    transform: string[];
    path: string[];
}
interface TransformMixData {
    mixRotate: number;
    mixX: number;
    mixY: number;
    mixScaleX: number;
    mixScaleY: number;
    mixShearY: number;
}
interface PathMixData {
    position: number;
    spacing: number;
    mixRotate: number;
    mixX: number;
    mixY: number;
}
declare class SpineModuleController {
    private raw_;
    private api_;
    private bridge_;
    constructor(raw: SpineWasmModule, api: SpineWrappedAPI);
    get raw(): SpineWasmModule;
    loadSkeleton(skelData: Uint8Array | string, atlasText: string, isBinary: boolean): number;
    getLastError(): string;
    unloadSkeleton(handle: number): void;
    getAtlasPageCount(handle: number): number;
    getAtlasPageTextureName(handle: number, pageIndex: number): string;
    setAtlasPageTexture(handle: number, pageIndex: number, textureId: number, width: number, height: number): void;
    createInstance(skeletonHandle: number): number;
    destroyInstance(instanceId: number): void;
    /**
     * Back to where the skeleton's data says it starts, every track cleared.
     *
     * The one state a replay is reproducible from: `play` resets nothing, so a
     * bone the next animation does not key keeps whatever the last pose left it
     * at, and seeking twice to one time gives two poses.
     */
    setToSetupPose(instanceId: number): void;
    play(instanceId: number, animation: string, loop?: boolean, track?: number): boolean;
    addAnimation(instanceId: number, animation: string, loop?: boolean, delay?: number, track?: number): boolean;
    setSkin(instanceId: number, skinName: string): void;
    update(instanceId: number, dt: number): void;
    getAnimations(instanceId: number): string[];
    getSkins(instanceId: number): string[];
    getBonePosition(instanceId: number, boneName: string): Vec2 | null;
    getBoneRotation(instanceId: number, boneName: string): number;
    /**
     * The skeleton as a tree in the pose the instance is in: each bone's name, parent
     * (-1 for a root), where it starts, the way it points in degrees and how long it is,
     * in skeleton space. Null from a module built before the call existed. @experimental
     */
    getBoneTree(instanceId: number): SkeletalBone[] | null;
    /**
     * What this instance's clipping costs the engine in the pose it is in, as
     * work rather than time: a coefficient measured on one machine and compiler
     * stops being true, and the three quantities below do not.
     *
     * `null` where the runtime cannot answer — 2.1 and 4.3 have no counted walk.
     */
    clipBudget(instanceId: number): SpineClipBudget | null;
    /** The animation clock onto the bones' LOCAL transforms — see spineBounds
     *  and the runtime's ensurePose for why this is not the whole pose. */
    advanceAndApply(instanceId: number, dt: number): void;
    /** The world transforms the local pose implies. */
    materializeWorldPose(instanceId: number, dt: number): void;
    /** Seconds; negative where this skeleton has no such animation. */
    animationDuration(skeletonHandle: number, animation: string): number;
    /** Whether this skeleton's world pose carries state and may not be deferred. */
    requiresContinuousWorldPose(skeletonHandle: number): boolean;
    /** What the skeleton was AUTHORED at, in its own space — no instance, no
     *  pose, and never an authority over culling. See spineBounds. */
    skeletonBounds(skeletonHandle: number): SpineAABB | null;
    getBounds(instanceId: number): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    /**
     * Iterate this instance's mesh batches. The views point into wasm scratch and
     * are valid only for the duration of each call, so a consumer copies straight
     * into its own heap and nothing allocates a typed array per batch per frame.
     *
     * The walk itself is shared with every other skeletal module (see
     * skeletal/meshBatches) — the four readback entry points are packed the same
     * way on the C++ side, so reading them differently per runtime would be two
     * copies of one contract.
     */
    forEachMeshBatch(instanceId: number, cb: MeshBatchVisitor, probe?: SkeletalProbe): void;
    setDefaultMix(skeletonHandle: number, duration: number): void;
    setMixDuration(skeletonHandle: number, fromAnim: string, toAnim: string, duration: number): void;
    setTrackAlpha(instanceId: number, track: number, alpha: number): void;
    setAttachment(instanceId: number, slotName: string, attachmentName: string): boolean;
    setIKTarget(instanceId: number, constraintName: string, targetX: number, targetY: number, mix: number): boolean;
    setSlotColor(instanceId: number, slotName: string, r: number, g: number, b: number, a: number): boolean;
    /** Whole-skeleton tint, multiplied into every vertex — backs SpineAnimation.color.
     *  Optional-chained: a spine wasm without this export (a realm still on an older
     *  module — the SDK can lead the wasm) degrades to a no-op instead of crashing. */
    setSkeletonColor(instanceId: number, r: number, g: number, b: number, a: number): boolean;
    enableEvents(instanceId: number): void;
    collectEvents(instanceId: number): RawSpineEvent[];
    listConstraints(instanceId: number): ConstraintList;
    getTransformConstraintMix(instanceId: number, name: string): TransformMixData | null;
    setTransformConstraintMix(instanceId: number, name: string, mix: TransformMixData): boolean;
    getPathConstraintMix(instanceId: number, name: string): PathMixData | null;
    setPathConstraintMix(instanceId: number, name: string, mix: PathMixData): boolean;
}

/**
 * @file    spineSceneDiagnostics.ts
 * @brief   Why this scene's spine costs what it does, answered from what the
 *          frame already knew.
 *
 * @details Everything here is DERIVED. No counter is added, no clock is read,
 *          and nothing is remembered between calls: a report is the frame
 *          metrics and the residency facts, read at the moment somebody asks.
 *          A diagnostic that kept its own tally would be a second authority
 *          about the same frame, and the first thing to go wrong with one is
 *          that it disagrees with the thing it is explaining.
 *
 *          What makes it worth having is the join. The runtime knows what a
 *          frame paid; the residencies know who was ALLOWED to skip and which
 *          of the two proofs they were missing. Neither answers "why is this
 *          scene expensive" alone — 800 unresolved world poses is a number, and
 *          "150 entities across two assets resolve every frame because nothing
 *          certified their extent" is somewhere to go.
 *
 *          The split between the two blockers is the editorial part, and it is
 *          deliberate: an asset that also carries state across its world pose is
 *          NOT reported as wanting a certificate, because certifying it would
 *          change nothing. Only the assets a promise would actually unlock are
 *          offered as work.
 */

/**
 * One residency as a diagnostic reads it: the two proofs AND what they came to.
 * Kept as three fields rather than the verdict alone, because "this asset is not
 * deferring" is not something anyone can act on and "nothing certified its
 * extent" is.
 */
interface SpineResidencyFacts {
    era: string;
    /** The asset this era is a generation of. */
    pair: SpinePair;
    /** Its refcount — entities posed by it, disabled ones included. */
    entities: number;
    culling: SpineCullingEnvelope;
    requiresContinuousWorldPose: boolean;
    mayDefer: boolean;
}
/**
 * The slice of a runtime a report reads, declared HERE rather than taken as a
 * runtime — everything the diagnostic needs is a read, and a view that cannot
 * reach `loadEntity` cannot become a second answer to which runtime poses an
 * entity. That answer is the manager's alone (tools/check-spine-lifetimes).
 */
interface SpineDiagnosticRuntime {
    readonly version: SpineVersion;
    readonly entityCount: number;
    worldPoseDebt(): number;
    residencies(): SpineResidencyFacts[];
    metrics(): SpineFrameMetrics | null;
    windows(): {
        pose: SpineTimeWindow;
        readback: SpineTimeWindow;
        total: SpineTimeWindow;
    };
}
/** A proof a residency is missing. Both absent is possible; neither is `mayDefer`. */
type SpineDeferralBlocker = 'no-certificate' | 'stateful-constraints';
/** One loaded skeleton, and whether the entities on it may owe a world pose. */
interface SpineAssetDiagnostic {
    version: SpineVersion;
    /** The era — one generation of one skeleton+atlas pair. */
    era: string;
    /**
     * The asset, as the two refs it is made of. Carried rather than split back
     * out of `era`: a ref can be `@uuid:...` and a path can be `C:/...`, so
     * anything routing a person to this asset has to be handed the pair.
     */
    pair: SpinePair;
    /** Entities posed by it, disabled ones included: it is the residency's refcount. */
    entities: number;
    mayDefer: boolean;
    /** What the culling promise amounts to, not the rectangle itself. */
    envelope: SpineCullingEnvelope['kind'];
    /** Empty exactly when `mayDefer`. */
    blockedBy: readonly SpineDeferralBlocker[];
}
/** A frame's posing, summed over every loaded runtime. */
interface SpinePoseTotals {
    logicalUpdates: number;
    worldMaterializations: number;
    worldAlreadyCurrent: number;
    /** Per (entity, CAMERA): a scene drawn by two cameras extracts twice. */
    meshExtractions: number;
    /** Per (entity, CAMERA) too — camera declines, not entities culled. */
    renderCulled: number;
}
/** One phase over the frames behind it. */
interface SpineWindowStats {
    last: number;
    p50: number;
    p95: number;
    max: number;
}
/**
 * One runtime's recent frames. PER RUNTIME rather than summed, because a
 * percentile does not add: the p95 of two runtimes' totals is not the sum of
 * their p95s, and printing it as one would be a number nobody's frame had.
 */
interface SpineRuntimeTiming {
    version: SpineVersion;
    /** Completed frames behind these numbers. */
    frames: number;
    pose: SpineWindowStats;
    readback: SpineWindowStats;
    total: SpineWindowStats;
}
type SpineFindingCode = 
/** Nothing is counting, so every per-frame number below is zero. */
'not-observing'
/** Assets a culling contract would unlock. The one actionable finding. */
 | 'no-certificate'
/** Assets no contract can unlock: their world pose carries state. */
 | 'stateful-constraints'
/** Deferral is permitted and bought nothing this frame — everything was wanted. */
 | 'nothing-deferred'
/** Deferral is permitted and is paying. */
 | 'deferral-working';
/** A statement about the scene, with the numbers that justify it. Wording lives
 *  in {@link formatSpineDiagnostics}, so a panel can say it its own way. */
interface SpineFinding {
    code: SpineFindingCode;
    /** Entities the finding is about. */
    entities: number;
    /** The eras it is about, where it is about assets at all. */
    assets: readonly string[];
}
interface SpineSceneDiagnostics {
    /** False when no runtime is counting; the per-frame numbers are then zero. */
    observing: boolean;
    /** The newest frame any runtime has begun. */
    frame: number;
    entities: number;
    /**
     * Enabled entities owing a world pose. Read after the frame's submit — where
     * a diagnostic is read — this is exactly what the frame did not resolve.
     */
    worldPoseDebt: number;
    /** Entities whose residency permits owing one at all. */
    deferrable: number;
    assets: SpineAssetDiagnostic[];
    /** What the frames behind this one cost, per runtime. */
    runtimes: SpineRuntimeTiming[];
    pose: SpinePoseTotals;
    /** What the frame drew, summed across runtimes. */
    geometry: {
        meshBatches: number;
        vertices: number;
        indices: number;
    };
    /** Crossings into the modules, and the bytes they moved. */
    abi: SpineAbiCounts;
    bytes: SpineByteCounts;
    /** Milliseconds, summed across runtimes; `readback` covers every camera. */
    time: {
        pose: number;
        readback: number;
        total: number;
    };
    findings: SpineFinding[];
}
/**
 * Read every loaded runtime and say what the scene's spine is doing.
 *
 * `observing` is the manager's, not inferred from whether metrics objects
 * exist: a realm watching a scene that has loaded no runtime yet is observing,
 * and reporting otherwise would send someone to turn on what is already on.
 */
declare function spineSceneDiagnostics(runtimes: Iterable<SpineDiagnosticRuntime>, observing: boolean): SpineSceneDiagnostics;
/** The report as text, for a console or an overlay. */
declare function formatSpineDiagnostics(d: SpineSceneDiagnostics): string;
/**
 * One skeleton an editor poses itself: outside the frame's tick and its submit,
 * driven only by whoever opened it. The batch walk is the SAME one a scene
 * entity's geometry crosses — a preview posed another way draws another thing.
 */
interface SpinePreviewInstance {
    animations(): string[];
    skins(): string[];
    /** Start `animation` from its beginning, unlooped — the caller owns the clock. */
    play(animation: string): void;
    setSkin(skin: string): void;
    advance(dt: number): void;
    duration(animation: string): number;
    /** What clipping costs in the pose it is standing in. */
    clipBudget(): SpineClipBudget | null;
    forEachMeshBatch(visit: MeshBatchVisitor): void;
    dispose(): void;
}

declare class SpineManager {
    private coreModule_;
    private factories_;
    private runtimes_;
    private loadingRuntimes_;
    /** Which runtime poses each entity. The authority for that is HERE: a
     *  runtime can only see its own entities, so one handed an entity another is
     *  posing cannot retire the binding it replaces. */
    private bindings_;
    private readonly disabledEntities_;
    /** So a runtime loaded after `observe(true)` reports too. */
    private observing_;
    constructor(
    /** Whichever engine core is present (see ecs/engineApi.ts). */
    coreModule: NonNullable<EngineApi>, moduleFactories: Map<SpineVersion, SpineModuleFactory>);
    static detectVersion(data: Uint8Array): SpineVersion | null;
    static detectVersionJson(json: string): SpineVersion | null;
    loadEntity(entity: Entity, 
    /** The prepared era and the right to keep it alive — indivisible, so a
     *  runtime can never be given one generation's id with another's claim. */
    era: SpineEraBinding, _registry: CppRegistry): Promise<SpineVersion | null>;
    /** Freeze inactive entities without changing their manual enable state. */
    updateAnimations(dt: number, isActive?: (entity: Entity) => boolean): void;
    /** Skip extraction for entities the activity predicate excludes. */
    submitMeshes(registry: CppRegistry, materialOf?: SkeletalMaterialOf, isActive?: (entity: Entity) => boolean): void;
    /** The entities that currently have a skeleton bound — what a per-frame pass
     *  over "everything spine draws" iterates, without asking the World. */
    boundEntities(): Iterable<Entity>;
    removeEntity(entity: Entity): void;
    /**
     * Tear down every loaded runtime, freeing the native skeletons / atlases
     * each holds. Idempotent — clearing the maps makes a second call a no-op.
     * The ONE teardown door: `shutdown()` was a second name for this.
     */
    dispose(): void;
    getEntityVersion(entity: Entity): SpineVersion | undefined;
    hasRuntime(version: SpineVersion): boolean;
    /**
     * Start or stop reporting what frames cost, on every runtime this app has
     * and every one it loads later. Off by default.
     */
    observe(on: boolean): void;
    /**
     * Open a skeleton for an editor to pose itself, outside this manager's
     * bindings: it is never advanced by `updateAnimations` and never drawn by
     * `submitMeshes`. Null when the era's version has no runtime here.
     */
    openPreview(era: SpineEraBinding): Promise<SpinePreviewInstance | null>;
    /** Whether anything is counting. */
    get observing(): boolean;
    /**
     * Why this scene's spine costs what it does — the frame's numbers joined to
     * the per-asset reason each of them was paid. Derived on the spot from what
     * the runtimes already know; see spineSceneDiagnostics.
     */
    diagnostics(): SpineSceneDiagnostics;
    setAnimation(entity: Entity, animation: string, loop: boolean): void;
    setSkin(entity: Entity, skin: string): void;
    setEntityProps(entity: Entity, props: {
        skeletonScale?: number;
        flipX?: boolean;
        flipY?: boolean;
        layer?: number;
        timeScale?: number;
        playing?: boolean;
        color?: {
            r: number;
            g: number;
            b: number;
            a: number;
        };
    }): void;
    getBounds(entity: Entity): {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    /**
     * What a scan of this entity's skeleton saw — an OBSERVATION, for authoring
     * to propose a culling contract from. Never an authority: see spineBounds.
     */
    observedBounds(entity: Entity, sampleStep?: number): SpineCullingEnvelope | null;
    clipBudget(entity: Entity): SpineClipBudget | null;
    getAnimations(entity: Entity): string[];
    getSkins(entity: Entity): string[];
    /** The posed bones of this entity's skeleton and how it places them; null if not loaded. @experimental */
    boneTree(entity: Entity): SkeletalBoneTree | null;
    setDefaultMix(entity: Entity, duration: number): void;
    setMixDuration(entity: Entity, fromAnim: string, toAnim: string, duration: number): void;
    setTrackAlpha(entity: Entity, track: number, alpha: number): void;
    setAttachment(entity: Entity, slotName: string, attachmentName: string): boolean;
    setIKTarget(entity: Entity, constraintName: string, targetX: number, targetY: number, mix: number): boolean;
    setSlotColor(entity: Entity, slotName: string, r: number, g: number, b: number, a: number): boolean;
    listConstraints(entity: Entity): ConstraintList | null;
    getTransformConstraintMix(entity: Entity, name: string): TransformMixData | null;
    setTransformConstraintMix(entity: Entity, name: string, mix: TransformMixData): boolean;
    getPathConstraintMix(entity: Entity, name: string): PathMixData | null;
    setPathConstraintMix(entity: Entity, name: string, mix: PathMixData): boolean;
    /**
     * Take an entity out of the frame, or put it back: a disabled entity keeps its
     * instance but stops posing and drawing. Distinct from `playing: false`, which
     * freezes the pose and keeps showing it.
     *
     * Also driven by `SpineAnimation.enabled` — the plugin carries that field
     * across on its edges (skeletal/enableSync), so writing the component wins at
     * the moment it is written and this call holds between such writes.
     */
    setEnabled(entity: Entity, enabled: boolean): void;
    enableEvents(entity: Entity): void;
    collectAllEvents(isActive?: (entity: Entity) => boolean): {
        entity: Entity;
        raw: RawSpineEvent;
    }[];
    hasInstance(entity: Entity): boolean;
    private runtimeOf_;
    private ensureRuntime;
}

type SpineEventType = 'start' | 'interrupt' | 'end' | 'complete' | 'event';
interface SpineEvent {
    entity: Entity;
    type: SpineEventType;
    track: number;
    animationName: string;
    eventName?: string;
    floatValue?: number;
    intValue?: number;
    stringValue?: string;
}
interface SpineEventsData {
    readonly events: readonly SpineEvent[];
}
declare const SpineEvents: ResourceDef<SpineEventsData>;
/**
 * Public runtime spine API. Present once the app has a {@link SpineManager}
 * (a realm with the spine side-module). Read it with `Res(Spine)` to control
 * playback — `setAnimation` / `setSkin` / `setMixDuration` / `getAnimations` / etc.
 */
/**
 * Spine playback, as `Res(Spine)` hands it over. Reached through the
 * `esengine/spine` entry, since the runtime is a side module a project opts into.
 *
 * @beta
 */
declare const Spine: ResourceDef<SpineManager>;
declare function spinePlugin(manager?: SpineManager): SpinePlugin;
declare class SpinePlugin implements Plugin {
    name: string;
    private spineManager_;
    private app_;
    private despawnUnsub_;
    private submitWired_;
    /** Carries SpineAnimation.enabled into the manager (see skeletal/enableSync). */
    private readonly enableMirror_;
    /** Pass an explicit manager for headless/tests; otherwise the plugin builds
     *  one in {@link build} from the app's {@link App.sideModules} host (the realm
     *  decides the transport — fetch / inlined / WeChat). */
    constructor(manager?: SpineManager);
    get spineManager(): SpineManager | null;
    setSpineManager(manager: SpineManager): void;
    private wireSubmit_;
    build(app: App): void;
    /**
     * Wire the spine manager into the Animator as its Spine driver, so
     * spine-targeting Animator states drive skeletal animations. Runs after all
     * plugins build (the AnimatorController resource exists by then if the
     * AnimationPlugin is installed).
     */
    finish(app: App): void;
    private wireAnimatorDriver_;
    /**
     * Drop the world.onDespawn subscription and dispose the spine manager's
     * native backends. Without this, a re-init left a stale despawn listener
     * pointing at a dead manager and leaked the wasm-side spine resources.
     */
    cleanup(): void;
    private collectAndPublishEvents_;
}

export { Spine, SpineEvents, SpineManager, SpineModuleController, SpinePlugin, SpineTimeWindow, formatSpineDiagnostics, spinePlugin, spineSceneDiagnostics, wrapSpineModule };
export type { ConstraintList, PathMixData, RawSpineEvent, SpineAssetDiagnostic, SpineClipBudget, SpineDeferralBlocker, SpineDiagnosticRuntime, SpineEvent, SpineEventType, SpineEventsData, SpineFinding, SpineFindingCode, SpineFrameMetrics, SpineModuleFactory, SpinePoseTotals, SpinePreviewInstance, SpineResidencyFacts, SpineSceneDiagnostics, SpineWasmModule, TransformMixData };
