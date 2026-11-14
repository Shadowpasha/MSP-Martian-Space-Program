import { SpineManager, SpineWasmModule, SpineClipBudget, ConstraintList, TransformMixData, PathMixData, RawSpineEvent, SpinePreviewInstance, SpineResidencyFacts, SpineFrameMetrics, SpineTimeWindow } from '../shared/SpinePlugin.js';
export { Spine, SpineAssetDiagnostic, SpineDeferralBlocker, SpineDiagnosticRuntime, SpineEvent, SpineEventType, SpineEvents, SpineEventsData, SpineFinding, SpineFindingCode, SpineModuleController, SpineModuleFactory, SpinePlugin, SpinePoseTotals, SpineSceneDiagnostics, formatSpineDiagnostics, spinePlugin, spineSceneDiagnostics, wrapSpineModule } from '../shared/SpinePlugin.js';
import { Entity, ESEngineModule, CppRegistry as CppRegistry$1 } from '../shared/wasm.js';
import { EngineApi } from '../shared/engineApi.js';
import { SceneData, SpineEraBinding, SpineEraClaim, BasisTranscoder, AssetScope, SpineCullingEnvelope } from '../shared/app.js';
export { SpineAABB, SpineBoundsSource, SpinePair, SpineScanCoverage, certifyBounds, contains, envelopeFor, mayDeferWorldPose, scanObservedBounds, setupBounds, worldBounds } from '../shared/app.js';
import { SpineVersion } from '../shared/resource.js';
import { RuntimeAssetSource, SkeletalBoneTree, SkeletalMaterialOf } from '../shared/runtimeAssets.js';
export { SkeletalBone } from '../shared/runtimeAssets.js';
import { AssetsData } from '../shared/AssetPlugin.js';

/**
 * @file    loadSpineScene.ts
 * @brief   Shared spine scene loader. For every SpineAnimation entity in a scene
 *          it fetches the skeleton/atlas/textures through the asset provider and
 *          hands them to the SpineManager — the single spine runtime
 *          implementation — then applies the component's props/skin/animation.
 *          Both the builder runtime loader and the editor scene loader call this,
 *          so spine loads identically on every target instead of being
 *          re-implemented per host.
 *
 * Two phases are exposed separately so entity ids exist before binding: phase 1
 * ({@link loadSpineAssets}) fetches + decodes assets and detects each version;
 * phase 2 ({@link applySpineEntities}) loads them into the SpineManager after the
 * scene spawns. Every version routes to its side-module backend — there is no
 * native runtime. {@link loadSpineSceneEntities} is the combined convenience.
 */

/**
 * The in-place editable spine props from a SpineAnimation component's data — the
 * SINGLE extraction both the scene loader and the editor's live-sync feed to
 * `setEntityProps`, so a new prop (color/timeScale/playing/...) is carried by both
 * paths from one place instead of being hand-listed twice.
 */
declare function spineEntityProps(d: Record<string, unknown>): {
    skeletonScale: number;
    flipX: boolean;
    flipY: boolean;
    layer: number;
    timeScale: number;
    playing: boolean;
    color?: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
};
/** Lazily yields the realm's Basis transcoder (KTX2 atlas pages), or null where
 *  compressed textures can't occur (editor, uncooked dev). Same seam as the
 *  TextureLoader's transcoder provider. */
type TranscoderProvider = () => Promise<BasisTranscoder | null>;
/** The opaque C++ registry handle SpineManager.loadEntity expects (app.world.getCppRegistry()). */
type CppRegistry = Parameters<SpineManager['loadEntity']>[2];
/** One prepared pair: the era to bind entities to, the runtime version its
 *  skeleton document names, and — for a preparation nothing else owns — the
 *  claim this phase took, which the caller gives back once the eras are bound. */
interface SpineAssetInfo {
    version: SpineVersion | null;
    era: SpineEraBinding;
    /** Null when an owner holds the preparation's claim (the scene's receipt). */
    preparation: SpineEraClaim | null;
}
/**
 * Phase 1 — fetch + decode each spine pair's skeleton/atlas/textures and detect
 * its runtime version. Keyed by `skeletonRef:atlasRef` for {@link applySpineEntities}.
 */
/**
 * Who prepares the pairs, and who owns what the preparation takes. With one,
 * two scenes of a spine asset share its era — one page upload, one native
 * skeleton — and the receipts are the scene's. Without one the same algorithm
 * runs over a host's own file access, and what it uploads is the host's.
 */
interface SpineAssetOwner {
    assets: AssetsData;
    scope: AssetScope;
}
declare function loadSpineAssets(
/** The wasm engine module, or null on a core with no heap — the atlas page upload
 *  goes through the ResourceManager's byte path there. */
module: ESEngineModule | null, source: RuntimeAssetSource, spineManager: SpineManager | null | undefined, spinePairs: ReadonlyArray<{
    skeleton: string;
    atlas: string;
}>, transcoderProvider?: TranscoderProvider, owner?: SpineAssetOwner): Promise<Map<string, SpineAssetInfo>>;
/**
 * Phase 2 — for each SpineAnimation entity, route its loaded asset to the
 * SpineManager (every version loads its side-module backend) and apply the
 * component's props, skin, and animation.
 */
declare function applySpineEntities(opts: {
    spineManager: SpineManager;
    sceneData: SceneData;
    entityMap: Map<number, Entity>;
    registry: CppRegistry;
    assetInfo: Map<string, SpineAssetInfo>;
}): Promise<void>;
/**
 * Combined convenience: discover spine pairs in the scene, load their assets, and
 * apply them to the spawned entities. For hosts (the editor) driving the 3.8/4.1
 * JS runtimes, where the native virtual-FS ordering doesn't apply.
 */
declare function loadSpineSceneEntities(opts: {
    module: ESEngineModule | null;
    source: RuntimeAssetSource;
    spineManager: SpineManager;
    sceneData: SceneData;
    entityMap: Map<number, Entity>;
    registry: CppRegistry;
    transcoderProvider?: TranscoderProvider;
}): Promise<void>;

/**
 * @file    SpineRuntime.ts
 * @brief   One loaded Spine version: what it holds, and what it poses.
 *
 * @details A runtime is a wasm module of one Spine version plus everything that
 *          lives inside it — the native skeletons it parsed, by ERA, and the
 *          instance each entity is posed by. Its ABI half is a private adapter
 *          (heap, scratch allocation, guarded calls); the two are one lifetime,
 *          which is why they are one object.
 *
 *          It does NOT decide which runtime an entity belongs to. That is the
 *          manager's: a runtime can only see its own entities, so one handed an
 *          entity another is posing has nothing to retire.
 */

declare class SpineRuntime {
    readonly version: SpineVersion;
    private controller_;
    private entities_;
    private disabledEntities_;
    private skeletons_;
    /** Null unless someone asked. The one field every probe is behind. */
    private metrics_;
    private readonly poseWindow_;
    private readonly readbackWindow_;
    private readonly totalWindow_;
    /** One runtime per loaded module: the ABI adapter is made here rather than
     *  handed in, because nothing else has a reason to hold one. */
    constructor(version: SpineVersion, module: SpineWasmModule);
    get entityCount(): number;
    loadEntity(entity: Entity, era: SpineEraBinding): boolean;
    /**
     * One claim on the era's native skeleton — the loaded one if this runtime has
     * it, else a fresh parse; -1 when the era cannot be joined or will not parse.
     * Retained BEFORE anything is parsed from it: what a native skeleton was made
     * of has to outlive it, and a page freed under it cannot be put back.
     */
    private claimSkeleton_;
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
    setAnimation(entity: Entity, animation: string, loop: boolean): void;
    setSkin(entity: Entity, skin: string): void;
    getBounds(entity: Entity): {
        x: number;
        y: number;
        width: number;
        height: number;
    } | null;
    clipBudget(entity: Entity): SpineClipBudget | null;
    getAnimations(entity: Entity): string[];
    getSkins(entity: Entity): string[];
    /**
     * The skeleton's bones as drawn this frame, with how the entity places them: the
     * skeleton's own scale and flips, which the draw applies and a point in skeleton
     * space has to as well. Null when nothing is loaded or the module predates the call.
     */
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
    setEnabled(entity: Entity, enabled: boolean): void;
    enableEvents(entity: Entity): void;
    collectAllEvents(isActive?: (entity: Entity) => boolean): {
        entity: Entity;
        raw: RawSpineEvent;
    }[];
    /**
     * Whether the camera in hand would draw this entity, or null where the
     * question cannot be asked — no certified extent, or a core without the
     * entry point. Null is not "invisible": an unknown extent makes visibility
     * unknown, and the only answer a caller may act on is `false`.
     */
    private cameraWouldDraw_;
    /**
     * Whether this entity's world pose may be left owed when nothing wants it —
     * both proofs, settled when its residency was made. The scheduler that will
     * use it does not exist yet; a diagnostic asking why can already read the
     * two facts off the residency.
     */
    mayDefer(entity: Entity): boolean;
    /**
     * Scan this entity's SKELETON — every animation over its whole duration, in
     * every skin — on a scratch instance, so the entity asking keeps its pose.
     * An OBSERVATION whatever it finds: authoring proposes contracts from it and
     * the runtime may never act on it. See spineBounds.
     */
    observedBounds(entity: Entity, sampleStep?: number): SpineCullingEnvelope | null;
    /** Why, for a diagnostic: the promise, and what the runtime says of itself. */
    poseEligibility(entity: Entity): {
        culling: SpineCullingEnvelope;
        requiresContinuousWorldPose: boolean;
    } | null;
    /**
     * A skeleton posed by nobody but its caller.
     *
     * Outside `entities_` on purpose — the map `updateAll` and the submit both
     * walk — so a preview is never advanced or drawn by the frame. What it gives
     * back is the same instance and the same batch walk a scene entity gets.
     */
    openPreview(era: SpineEraBinding): SpinePreviewInstance | null;
    /** Every residency this runtime holds, for a scene-level diagnostic. */
    residencies(): SpineResidencyFacts[];
    /**
     * Entities owing a world pose, disabled ones aside — those are out of the
     * frame, so posing every frame would not have resolved them either.
     *
     * A STATE and not a tally, which is what makes it exact: read after a
     * frame's submit it is the world-transform resolves that frame did not do.
     */
    worldPoseDebt(): number;
    /**
     * Resolve this entity's world transforms if they do not already reflect its
     * local pose; returns whether it had to. The REVISION is the authority, not
     * the frame — a frame that resolves and then moves an IK target owes another
     * one, and a frame key would hand the next asker the pose from before it.
     */
    ensurePose(entity: Entity): boolean;
    /** What only the world transforms will show — a constraint retargeted, an
     *  attachment swapped. The local pose is already whatever it was. */
    private poseChanged_;
    updateAll(dt: number, isActive?: (entity: Entity) => boolean): void;
    /** @param core whichever engine core is present (see ecs/engineApi.ts) — the
     *  batches cross through its heap, which is wasm linear memory on the web and the
     *  host arena on a device. */
    extractAndSubmitMeshes(core: NonNullable<EngineApi>, registry: CppRegistry$1, materialOf?: SkeletalMaterialOf, isActive?: (entity: Entity) => boolean): void;
    /**
     * Start or stop reporting what each frame costs. Off by default and off is
     * free: every counter and both clock reads are behind this one field, so a
     * runtime nobody is watching pays a branch per entity and nothing else.
     */
    observe(on: boolean): void;
    /** The LIVE frame record — the same object every frame, so reading it costs
     *  nothing and holding it shows the next frame. Null when not observing. */
    metrics(): SpineFrameMetrics | null;
    /** The last 120 COMPLETED frames of each timed phase — all three fed at the
     *  same boundary, so they always describe the same frames. A mean hides the
     *  frame that missed; these say whether one did. */
    windows(): {
        pose: SpineTimeWindow;
        readback: SpineTimeWindow;
        total: SpineTimeWindow;
    };
    removeEntity(entity: Entity): void;
    /** Drop one reference to an entity's skeleton. At zero the NATIVE object
     *  goes first and the era it was parsed from after it — the order ownership
     *  says, not the order today's unload happens to tolerate. */
    private releaseSkeleton_;
    /** Give back everything this runtime holds, in the order it holds it:
     *  instances, then the native skeletons, then the eras they came from. */
    dispose(): void;
}

/**
 * @file    spineCertificates.ts
 * @brief   Where a promise about a spine asset's extent comes from.
 *
 * @details A certified envelope is a statement somebody made about an asset, so
 *          it belongs to the asset and not to a generation of its bytes: a hot
 *          reload replaces what the skeleton does, not what was promised about
 *          it. And it is about the PAIR — an atlas decides how its regions were
 *          trimmed and so what geometry the attachments end up with — which is
 *          why nothing here answers about a skeleton alone.
 *
 *          It is a READ, not a table. This was a mutable projection somebody had
 *          to remember to fill, and the thing that went wrong with it is the
 *          only thing that can: nobody filled it, in any realm, ever. So the
 *          question now goes straight to the authority a realm already ships —
 *          the manifest the cook wrote from the `.meta` — and there is no moment
 *          at which the projection can be out of date with it, because there is
 *          no projection.
 */

/** What a runtime asks when it is about to make a residency. */
interface SpineCertificateSource {
    /** The promise recorded for this PAIR, or unknown where there is none. */
    envelopeFor(skeleton: string, atlas: string): SpineCullingEnvelope;
}
/** The slice of a realm's asset source a certificate is read from. */
interface SpineCullingProvider {
    spineCulling?(skeleton: string, atlas: string): {
        x: number;
        y: number;
        width: number;
        height: number;
    } | undefined;
}
/**
 * The promises a realm ships, read from the source that serves its assets.
 *
 * A realm whose source answers nothing certifies nothing — which is what makes
 * an unconfigured project behave exactly as it did, and what makes an editor
 * preview (not a product runtime) simply not defer.
 */
declare function spineCertificatesFrom(source: SpineCullingProvider): SpineCertificateSource;
/** A realm with no recorded promises: everything materialises. */
declare const NO_CERTIFICATES: SpineCertificateSource;

export { ConstraintList, NO_CERTIFICATES, PathMixData, RuntimeAssetSource, SkeletalBoneTree, SpineClipBudget, SpineCullingEnvelope, SpineManager, SpinePreviewInstance, SpineResidencyFacts, SpineRuntime, SpineVersion, TransformMixData, applySpineEntities, loadSpineAssets, loadSpineSceneEntities, spineCertificatesFrom, spineEntityProps };
export type { SpineCertificateSource, SpineCullingProvider };
