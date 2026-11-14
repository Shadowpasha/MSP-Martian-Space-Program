import { Plugin, App } from './app.js';
import { ResourceDef } from './resource.js';
import { Entity } from './wasm.js';
import { SkeletalHeap, SkeletalController, SkeletalBone, SkeletalBounds, MeshBatchVisitor, SkeletalBoneTree, SkeletalSubmitCore, SkeletalMaterialOf } from './runtimeAssets.js';

/**
 * @file    dragonbones/DragonBonesModuleLoader.ts
 * @brief   cwrap the DragonBones side module's exports once, so the controller
 *          calls typed functions instead of re-stating signatures per call.
 */

interface DragonBonesWasmModule extends SkeletalHeap {
    cwrap(name: string, ret: string | null, sig: string[]): (...args: unknown[]) => unknown;
    HEAPF32: Float32Array;
    HEAP32: Int32Array;
}
type DragonBonesModuleFactory = (options?: {
    wasmBinary?: Uint8Array;
}) => Promise<DragonBonesWasmModule>;
interface DragonBonesWrappedAPI {
    loadSkeleton(skeletonPtr: number, skeletonLen: number, atlasPtr: number, atlasLen: number): number;
    getLastError(): string;
    unloadSkeleton(handle: number): void;
    getArmatures(handle: number): string;
    getAtlasImageName(handle: number): string;
    setAtlasTexture(handle: number, textureId: number): void;
    createInstance(handle: number, armatureName: string): number;
    destroyInstance(instanceId: number): void;
    playAnimation(instanceId: number, name: string, playTimes: number): number;
    fadeInAnimation(instanceId: number, name: string, fadeSeconds: number, playTimes: number): number;
    stopAnimation(instanceId: number, name: string): void;
    setTimeScale(instanceId: number, scale: number): void;
    setColor(instanceId: number, r: number, g: number, b: number, a: number): void;
    update(instanceId: number, dt: number): void;
    getAnimations(instanceId: number): string;
    getMeshBatchCount(instanceId: number): number;
    getMeshBatchVertexCount(instanceId: number, batchIndex: number): number;
    getMeshBatchIndexCount(instanceId: number, batchIndex: number): number;
    getMeshBatchData(instanceId: number, batchIndex: number, verticesPtr: number, indicesPtr: number, textureIdPtr: number, blendModePtr: number): void;
    getBounds(instanceId: number, xPtr: number, yPtr: number, wPtr: number, hPtr: number): void;
    /** Bone names in armature order; absent on a module built before the call existed. */
    getBones?(instanceId: number): string;
    /** Five floats a bone — parent index (-1 for a root), x, y, degrees, length — into `outPtr`; returns the count. */
    getBonePoses?(instanceId: number, outPtr: number, capacity: number): number;
    runtimeVersion(): number;
}
/** Bind every export once; a typo becomes a load-time failure, not a call-time one. */
declare function wrapDragonBonesModule(raw: DragonBonesWasmModule): DragonBonesWrappedAPI;

/**
 * @file    dragonbones/DragonBonesController.ts
 * @brief   One loaded DragonBones module, driven from TypeScript.
 *
 * @details Implements SkeletalController — the part that means the same thing as
 *          it does for Spine — and then adds what only DragonBones has, rather
 *          than bending either runtime into the other's vocabulary.
 *
 *          Two additions are worth naming. `getArmatures` exists because a
 *          DragonBones file is a project holding several armatures, so choosing
 *          one is a real step and not a detail. And `fadeIn` is where Spine would
 *          set a mix duration: DragonBones crossfades at the moment of play, so
 *          the fade is an argument to starting an animation, not state on the
 *          skeleton.
 */

declare class DragonBonesModuleController implements SkeletalController {
    private readonly raw_;
    private readonly api_;
    constructor(raw: DragonBonesWasmModule, api: DragonBonesWrappedAPI);
    /**
     * Parse a skeleton and its atlas together; -1 on failure, with the reason in
     * {@link getLastError}. Both are copied into the module's heap because the
     * parsers want a terminated string and the caller's bytes are not one.
     */
    loadSkeleton(skeletonData: Uint8Array | string, atlasJson: string): number;
    getLastError(): string;
    unloadSkeleton(handle: number): void;
    /** The armatures this file holds — DragonBones-only; a Spine file has one skeleton. */
    getArmatures(handle: number): string[];
    /** The image the atlas expects, so the caller knows what to upload. */
    getAtlasImageName(handle: number): string;
    /**
     * Bind the uploaded page. Safe to call after instances exist — the module
     * invalidates them, because uploading last is the normal order.
     */
    setAtlasTexture(handle: number, textureId: number): void;
    /** -1 when the file holds no armature by that name (see {@link getArmatures}). */
    createInstance(skeletonHandle: number, armatureName: string): number;
    destroyInstance(instanceId: number): void;
    /** `loop` false plays once; DragonBones counts plays, where 0 means forever. */
    play(instanceId: number, animation: string, loop?: boolean): boolean;
    /** Crossfade into `animation` over `fadeSeconds` — Spine's mix table, per play. */
    fadeIn(instanceId: number, animation: string, fadeSeconds: number, loop?: boolean): boolean;
    stop(instanceId: number, animation?: string): void;
    setTimeScale(instanceId: number, scale: number): void;
    /** Tint, multiplied onto each slot's authored colour — opaque white is "as drawn". */
    setColor(instanceId: number, r: number, g: number, b: number, a: number): void;
    update(instanceId: number, dt: number): void;
    getAnimations(instanceId: number): string[];
    /**
     * The armature's bones as posed now, in the y-up space the geometry is in: name, parent
     * (-1 for a root), start, the way each points in degrees, and length. Null from a module
     * built before the call existed. @experimental
     */
    getBoneTree(instanceId: number): SkeletalBone[] | null;
    getBounds(instanceId: number): SkeletalBounds;
    forEachMeshBatch(instanceId: number, cb: MeshBatchVisitor): void;
    /** The DragonBones data format this module reads. */
    runtimeVersion(): number;
}

/**
 * @file    dragonbones/DragonBonesManager.ts
 * @brief   Entities, their armature instances, and the skeletons they share.
 *
 * @details ONE class, where Spine has two. Its Manager exists to route an entity
 *          to the backend for ITS Spine version, because five vendored runtimes
 *          ship side by side. DragonBones' format is frozen and there is one
 *          runtime, so that routing layer would have nothing to route — mirroring
 *          the split here would be importing someone else's constraint.
 *
 *          Skeletons are shared and refcounted. Ten entities of the same armature
 *          parse the file once and hold one atlas between them; the last one out
 *          unloads it. An entity given no asset key gets its own, which is the
 *          honest fallback for a caller that cannot say when two are the same.
 */

/** How one entity's armature is posed and drawn. */
interface EntityInfo {
    skeletonHandle: number;
    instanceId: number;
    skeletonScale: number;
    flipX: boolean;
    flipY: boolean;
    layer: number;
    timeScale: number;
    /**
     * False freezes the pose: the armature stops advancing but is still drawn.
     * Distinct from {@link DragonBonesManager.setEnabled}, which removes it from
     * the frame entirely — a paused character is still on screen.
     */
    playing: boolean;
    /** Set when the skeleton is shared; absent means this entity owns its own. */
    assetKey?: string;
}
interface DragonBonesEntityOptions {
    armature: string;
    /** Identifies the loaded file, so entities of one asset share a skeleton. */
    assetKey?: string;
    skeletonScale?: number;
    flipX?: boolean;
    flipY?: boolean;
    layer?: number;
    animation?: string;
    loop?: boolean;
}
declare class DragonBonesManager {
    private readonly controller_;
    private readonly entities_;
    private readonly disabled_;
    private readonly skeletons_;
    private readonly unkeyedSkeletons_;
    constructor(controller: DragonBonesModuleController);
    get controller(): DragonBonesModuleController;
    /**
     * Parse a file once per `assetKey`, or every time when none is given.
     * Returns -1 on failure, with the reason on the controller.
     */
    loadSkeleton(skeletonData: Uint8Array | string, atlasJson: string, assetKey?: string): number;
    /** Bind the uploaded atlas page; safe after instances exist. */
    setAtlasTexture(skeletonHandle: number, textureId: number): void;
    getArmatures(skeletonHandle: number): string[];
    /** @internal Retire a scene load that produced no armature instances. */
    discardUnboundSkeleton(assetKey: string): void;
    /** Replace an armature only after its new instance and ownership are valid. */
    addEntity(entity: Entity, skeletonHandle: number, options: DragonBonesEntityOptions): boolean;
    removeEntity(entity: Entity): void;
    hasInstance(entity: Entity): boolean;
    /** The entities that currently have an armature bound — what a per-frame pass
     *  over "everything DragonBones draws" iterates, without asking the World. */
    boundEntities(): Iterable<Entity>;
    /**
     * A disabled entity keeps its instance but stops advancing and drawing.
     *
     * Also driven by `DragonBonesAnimation.enabled` — the plugin carries that field
     * across on its edges (skeletal/enableSync), so writing the component wins at
     * the moment it is written and this call holds between such writes.
     */
    setEnabled(entity: Entity, enabled: boolean): void;
    setEntityProps(entity: Entity, props: Partial<Pick<EntityInfo, 'skeletonScale' | 'flipX' | 'flipY' | 'layer' | 'playing'>> & {
        timeScale?: number;
        color?: {
            r: number;
            g: number;
            b: number;
            a: number;
        };
    }): void;
    /**
     * Tint the whole armature. Multiplied onto each slot's authored colour, so
     * opaque white is not "no tint applied" but "the tint that changes nothing" —
     * which is why clearing the field in the editor restores the original rather
     * than leaving the last colour stuck.
     */
    setColor(entity: Entity, r: number, g: number, b: number, a: number): void;
    play(entity: Entity, animation: string, loop?: boolean): boolean;
    /** Crossfade in, which is where DragonBones puts what Spine keeps in a table. */
    fadeIn(entity: Entity, animation: string, fadeSeconds: number, loop?: boolean): boolean;
    stop(entity: Entity, animation?: string): void;
    setTimeScale(entity: Entity, scale: number): void;
    getAnimations(entity: Entity): string[];
    /** The posed bones of this entity's armature and how it places them; null if not loaded. @experimental */
    boneTree(entity: Entity): SkeletalBoneTree | null;
    getBounds(entity: Entity): SkeletalBounds | null;
    /** Freeze inactive entities without changing their manual enable state. */
    updateAnimations(dt: number, isActive?: (entity: Entity) => boolean): void;
    /** Skip extraction for entities the activity predicate excludes. */
    submitMeshes(core: SkeletalSubmitCore, registry: unknown, materialOf?: SkeletalMaterialOf, isActive?: (entity: Entity) => boolean): void;
    /** Drop every instance and skeleton. Idempotent, so a second call is a no-op. */
    dispose(): void;
    /** One reference gone; a shared skeleton unloads when the last one does. */
    private releaseSkeleton_;
}

/** Reach the manager from a system or from gameplay code. Null until acquired. */
declare const DragonBones: ResourceDef<DragonBonesManager | null>;
declare class DragonBonesPlugin implements Plugin {
    name: string;
    private manager_;
    private app_;
    private despawnUnsub_;
    private acquiring_;
    private submitWired_;
    /** Carries DragonBonesAnimation.enabled into the manager (skeletal/enableSync). */
    private readonly enableMirror_;
    /** Pass a manager for headless use or tests; otherwise it is built on demand. */
    constructor(manager?: DragonBonesManager);
    get manager(): DragonBonesManager | null;
    /**
     * Load the side module and build the manager, once.
     *
     * Concurrent callers share the one in-flight promise: two entities spawning in
     * the same frame must not instantiate two wasm modules and then disagree about
     * which one owns their skeletons.
     */
    acquire(): Promise<DragonBonesManager | null>;
    build(app: App): void;
    /**
     * Drop the despawn subscription and free every skeleton the module holds.
     * Without it a re-init leaves a listener pointing at a dead manager and the
     * wasm side keeps armatures nothing can reach.
     */
    cleanup(): void;
}
declare const dragonBonesPlugin: () => DragonBonesPlugin;

export { DragonBones, DragonBonesManager, DragonBonesModuleController, DragonBonesPlugin, dragonBonesPlugin, wrapDragonBonesModule };
export type { DragonBonesEntityOptions, DragonBonesModuleFactory, DragonBonesWasmModule, DragonBonesWrappedAPI };
