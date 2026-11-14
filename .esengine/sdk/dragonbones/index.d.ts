import { DragonBonesManager } from '../shared/DragonBonesPlugin.js';
export { DragonBones, DragonBonesEntityOptions, DragonBonesModuleController, DragonBonesModuleFactory, DragonBonesPlugin, DragonBonesWasmModule, DragonBonesWrappedAPI, dragonBonesPlugin, wrapDragonBonesModule } from '../shared/DragonBonesPlugin.js';
import { Entity, ESEngineModule } from '../shared/wasm.js';
import { SceneData, BasisTranscoder } from '../shared/app.js';
import { RuntimeAssetSource } from '../shared/runtimeAssets.js';
import '../shared/resource.js';

/**
 * @file    dragonbones/loadDragonBonesScene.ts
 * @brief   Turning DragonBonesAnimation components into posed armatures.
 *
 * @details The counterpart of `spine/loadSpineScene.ts`, and split for the same
 *          reason: the builder runtime and the editor must load a scene's
 *          skeletons by ONE implementation, or the viewport and the shipped game
 *          disagree about what the scene contains.
 *
 *          Two phases, because entity ids do not exist until the scene spawns.
 *          Phase 1 fetches bytes and uploads the atlas page; phase 2 binds them to
 *          entities. The split is what lets the runtime loader interleave the fetch
 *          with everything else it preloads.
 *
 *          Where this differs from Spine is the atlas. A Spine `.atlas` lists its
 *          pages inside itself; a DragonBones `_tex.json` is a JSON object naming
 *          exactly one, in `imagePath`. So there is no page loop here — one image,
 *          resolved against the atlas's AUTHORED directory, because a cook renames
 *          the atlas and the image independently and neither ends up beside the
 *          other by accident.
 */

/** Lazily yields the realm's Basis transcoder, or null where a cook cannot have
 *  produced a compressed page (editor, uncooked dev). Same seam as Spine's. */
type TranscoderProvider = () => Promise<BasisTranscoder | null>;
/**
 * The in-place editable props from a DragonBonesAnimation component's data — the
 * SINGLE extraction the scene loader and the editor's live-sync both feed to
 * `setEntityProps`, so a prop added to the component is carried by both paths from
 * one place instead of being hand-listed twice.
 */
declare function dragonBonesEntityProps(d: Record<string, unknown>): {
    skeletonScale: number;
    flipX: boolean;
    flipY: boolean;
    layer: number;
    timeScale: number;
    playing: boolean;
    color: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
};
/** What phase 1 fetched for one skeleton/atlas pair. */
interface DragonBonesAssetInfo {
    skeletonData: Uint8Array | string;
    atlasJson: string;
    /** The uploaded page's id, or -1 when the image could not be loaded — the
     *  armature still poses, it just draws untextured, which is visible. */
    textureId: number;
}
/**
 * Phase 1 — fetch each pair's skeleton and atlas and upload the atlas image.
 * Keyed by `skeletonRef:atlasRef` for {@link applyDragonBonesEntities}.
 */
declare function loadDragonBonesAssets(
/** The wasm engine module, or null on a core with no heap — the upload goes
 *  through the ResourceManager's byte path there. */
module: ESEngineModule | null, source: RuntimeAssetSource, pairs: ReadonlyArray<{
    skeleton: string;
    atlas: string;
}>, transcoderProvider?: TranscoderProvider): Promise<Map<string, DragonBonesAssetInfo>>;
/**
 * Phase 2 — for each DragonBonesAnimation entity, parse its pair into the manager
 * (shared per pair, so ten of the same armature parse the file once), bind the
 * uploaded page, and apply the component's armature, props and animation.
 */
declare function applyDragonBonesEntities(opts: {
    manager: DragonBonesManager;
    sceneData: SceneData;
    entityMap: Map<number, Entity>;
    assetInfo: Map<string, DragonBonesAssetInfo>;
}): void;
/**
 * Combined convenience: discover this scene's DragonBones pairs, load them, and
 * bind them to the spawned entities. What the editor's viewport calls.
 */
declare function loadDragonBonesSceneEntities(opts: {
    module: ESEngineModule | null;
    source: RuntimeAssetSource;
    manager: DragonBonesManager;
    sceneData: SceneData;
    entityMap: Map<number, Entity>;
    transcoderProvider?: TranscoderProvider;
}): Promise<void>;

/**
 * @file    dragonbones/skeletonNames.ts
 * @brief   The armature and animation names a `_ske.json` declares.
 *
 * @details Read here rather than asked of the module, for the reason the Spine
 *          atlas's page names are (see spine/atlasPages): naming what is in a file
 *          is not posing a skeleton, and making an inspector dropdown wait on a
 *          wasm instantiation buys nothing.
 *
 *          A `.dbbin` is binary and yields nothing — which is not an error. Every
 *          reader of this is expected to work without it, and the editor's field
 *          simply stays free text.
 */
interface DragonBonesArmatureNames {
    name: string;
    animations: string[];
}
/**
 * Armatures and their animations, in file order. Anything unreadable — binary
 * data, a truncated download, a file that is simply not this format — is no names
 * rather than a throw: a caller asking what is inside can always be told nothing.
 */
declare function parseDragonBonesNames(source: string | object): DragonBonesArmatureNames[];

export { DragonBonesManager, RuntimeAssetSource, applyDragonBonesEntities, dragonBonesEntityProps, loadDragonBonesAssets, loadDragonBonesSceneEntities, parseDragonBonesNames };
export type { DragonBonesArmatureNames, DragonBonesAssetInfo };
