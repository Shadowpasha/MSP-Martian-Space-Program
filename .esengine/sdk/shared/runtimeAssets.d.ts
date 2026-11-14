import { Entity } from './wasm.js';
import { Backend, ParsedTextureImportSettings } from './app.js';

/** The heap a module marshals through. */
interface SkeletalHeap {
    _malloc(size: number): number;
    _free(ptr: number): void;
    HEAPU8: Uint8Array;
    HEAPU32: Uint32Array;
}
type MeshBatchVisitor = (vertBytes: Uint8Array, indexBytes: Uint8Array, vertexCount: number, indexCount: number, textureId: number, blendMode: number, premultipliedColor?: boolean) => void;

/**
 * The material a skeleton is drawn with, as the engine knows it (0 = none).
 * Read per frame from the entity's own component rather than mirrored into the
 * manager: a material handle is whatever the component says this frame, and a
 * copy kept beside the pose would answer with the previous one.
 */
type SkeletalMaterialOf = (entity: Entity) => number;
/** The slice of the engine core this needs. */
interface SkeletalSubmitCore {
    renderer_submitSkeletalBatchByEntity?(registry: unknown, verticesPtr: number, vertexCount: number, indicesPtr: number, indexCount: number, textureId: number, blendMode: number, entity: number, skeletonScale: number, flipX: boolean, flipY: boolean, layer: number, depth: number, materialId: number): void;
    renderer_submitSkeletalBatchByEntityEx?(registry: unknown, verticesPtr: number, vertexCount: number, indicesPtr: number, indexCount: number, textureId: number, blendMode: number, entity: number, skeletonScale: number, flipX: boolean, flipY: boolean, layer: number, depth: number, materialId: number, premultipliedColor: boolean): void;
    _malloc?(size: number): number;
    _free?(ptr: number): void;
    HEAPU8?: Uint8Array;
}

/**
 * @file    skeletal/types.ts
 * @brief   What a caller can ask of ANY skeletal runtime the engine hosts.
 *
 * @details Deliberately the intersection and not the union. Spine mixes through a
 *          from/to table set on the skeleton; DragonBones fades in at the moment
 *          of play. Spine has skins and path constraints; DragonBones has display
 *          lists and several armatures per file. Folding those together would
 *          invent a vocabulary neither runtime speaks, so each keeps its own on
 *          its own controller, and only what genuinely means the same thing in
 *          both is promised here.
 *
 *          What that leaves is the lifecycle, the queries the editor and gameplay
 *          actually reach for, and the render path — which is most of what code
 *          outside the two implementations ever touches.
 */

/** One bone of a posed skeleton, in the skeleton's own space. */
interface SkeletalBone {
    name: string;
    /** Index of the parent in the same list; -1 for a root. */
    parent: number;
    /** Where the bone starts. */
    x: number;
    y: number;
    /** The way it points. */
    degrees: number;
    length: number;
}
/**
 * A skeleton's bones as drawn this frame, and how its entity places them: the
 * scale and flips the draw applies, which a point in skeleton space has to as
 * well to land where the artwork is.
 */
interface SkeletalBoneTree {
    bones: SkeletalBone[];
    scale: number;
    flipX: boolean;
    flipY: boolean;
}
interface SkeletalBounds {
    x: number;
    y: number;
    width: number;
    height: number;
}
interface SkeletalController {
    /** Why the last call that could fail did. Empty when it did not. */
    getLastError(): string;
    /** Drop a loaded file and every instance built from it. */
    unloadSkeleton(handle: number): void;
    destroyInstance(instanceId: number): void;
    /** Advance by `dt` seconds and re-pose. Geometry is read back after this. */
    update(instanceId: number, dt: number): void;
    /** Animation names this instance can play. */
    getAnimations(instanceId: number): string[];
    /** Where the posed skeleton currently is, in its own units. */
    getBounds(instanceId: number): SkeletalBounds;
    /** Visit the posed geometry; views live only for the duration of each call. */
    forEachMeshBatch(instanceId: number, cb: MeshBatchVisitor): void;
}

/**
 * @file    runtimeAssets.ts
 * @brief   Shared runtime asset primitives — the pluggable asset-fetch provider
 *          interface and the decoded-pixels → GL texture upload — used by the
 *          builder runtime loader and the spine scene loader (and any editor that
 *          drives the same load path). Kept in its own module so neither the
 *          runtime loader nor the spine loader has to import the other.
 */

/**
 * How a target supplies scene assets to the single `Assets` channel, built from
 * canonical parts instead of a bespoke provider:
 *   - `backend`  — canonical fetch (text/binary, incl. KTX2 containers)
 *   - `decodePixels` — platform image → RGBA (URL `<img>` can't reach `estella://`
 *     / WeChat package files / inlined data-URLs); `flip` is applied on upload via
 *     `createTextureFromPixels`, so decoders return top-first and ignore it
 *   - `resolveRef` — ref → resolved (extension-bearing) path; must run before the
 *     `TextureLoader` KTX2 extension check, so uuid/manifest lookup lives HERE, not
 *     in `backend.resolveUrl`. Omit for identity.
 * (Signature declared locally, not imported from TextureLoader — that module
 * imports from this one, so importing back would cycle.)
 */
interface RuntimeAssetSource {
    backend: Backend;
    decodePixels(path: string, flip: boolean, maxEdge?: number): Promise<{
        width: number;
        height: number;
        pixels: Uint8Array;
    }>;
    resolveRef?(ref: string): string;
    /**
     * The LOGICAL source path a ref was authored at (e.g. `assets/spine/hero.atlas`),
     * even after a content-addressed build renamed the physical file to a hash. A
     * loader that resolves a SIBLING by name — a Spine atlas naming its page PNG
     * relative to itself — needs the logical directory, which `resolveRef` (a build
     * path) has lost. Optional: a realm that stages under logical paths has nothing
     * to recover, and a caller falls back to the resolved path.
     */
    resolveAddress?(ref: string): string | null;
    /**
     * A texture as its host keeps it GPU-compressed (TextureLoader's
     * `TextureCompressedSource`). The editor's play realm supplies it, so the
     * running game holds the art compressed as the edit viewport does.
     */
    compressedTexture?(path: string): Promise<Uint8Array | 'pending' | null>;
    /**
     * Every asset path this realm ships (logical, extension-bearing). Powers
     * content-driven discovery of assets NO scene references — locale string
     * tables (`.eslocale`), which Text binds by KEY, not path. Optional: a
     * realm without it simply can't auto-load such assets (the runtime loader
     * warns when a scene needs them).
     */
    listAssetPaths?(): string[];
    /**
     * Per-texture import settings (filter/wrap/sRGB and the 9-slice border) for a
     * ref. These belong to the ASSET, not to any scene that uses it, which is why
     * they arrive through the realm's source alongside `resolveRef` rather than
     * being copied into every scene that references the texture — a copy in the
     * scene goes stale the moment the `.meta` changes.
     *
     * Optional: a realm without it renders with loader defaults. Each realm has
     * the data already — the editor from its asset database, a cooked build from
     * the `importer` block the cook copies into the ship manifest.
     */
    textureImportSettings?(ref: string): ParsedTextureImportSettings | undefined;
    /** The rectangle no pose of this spine PAIR leaves, in the skeleton's own
     *  space. Both refs, since an atlas the promise was not recorded against
     *  inherits nothing; a realm without this certifies nothing. */
    spineCulling?(skeleton: string, atlas: string): {
        x: number;
        y: number;
        width: number;
        height: number;
    } | undefined;
}

export type { MeshBatchVisitor, RuntimeAssetSource, SkeletalBone, SkeletalBoneTree, SkeletalBounds, SkeletalController, SkeletalHeap, SkeletalMaterialOf, SkeletalSubmitCore };
