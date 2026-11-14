import { MeshData, World } from '../shared/app.js';
export { Bone2D, Bone2DData, BoneConstraint2D, BoneConstraint2DData, BoneConstraintKind, IK2D, IK2DData, Rig2DPlugin } from '../shared/rig2dPlugin.js';
import { Entity } from '../shared/wasm.js';
import '../shared/resource.js';

/**
 * @file    rigSource.ts
 * @brief   `.esrig`: a 2D character as it is authored. Parts cut from an image, the bones under them, what each vertex follows.
 *
 * @details The file a person edits; the `.esmesh` baked from it is what a scene draws, so a built game carries no rig code unless
 *          it uses constraints. Bones in a scene are ordinary entities, which is what lets clips, the animator and masks reach them.
 *          Rig space is world units, y up. Part vertices stay in image pixels, y down, so a part keeps its shape when it is moved.
 *          A parent always comes before its children in `bones`: every walk over them relies on it.
 */
declare const RIG_SOURCE_VERSION = 1;
declare const RIG_SOURCE_EXT = ".esrig";
/** A vertex follows at most this many bones: what the mesh format's joint channel holds. */
declare const RIG_MAX_INFLUENCES = 4;
/** @experimental */
interface RigBone {
    name: string;
    /** Index of the parent bone, -1 for a root. */
    parent: number;
    /** Where it starts in its parent's space (rig space for a root). */
    x: number;
    y: number;
    /** Radians, counter-clockwise, in its parent's space. */
    rotation: number;
    /** How far it reaches along its own +x. Draws the bone, aims an IK chain, and shapes automatic weights. */
    length: number;
    /**
     * What the prefab names this bone's entity by, so what a scene adds to it stays on it when bones are reordered, removed or reparented.
     * Missing on a rig saved before there were ids, which is read as `b<index>`, the name those prefabs used. See {@link ensureRigBoneIds}.
     */
    id?: string;
}
/** @experimental */
interface RigPart {
    name: string;
    /** The piece of the image, in pixels from its top left. */
    rect: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    /** Where the rect's top left sits in rig space. */
    x: number;
    y: number;
    /** Flat `[x, y, ...]`, in pixels from the rect's top left, y down. */
    vertices: number[];
    /** Flat vertex indices, three a triangle. */
    triangles: number[];
    /** Per vertex, flat `[bone, weight, ...]`, at most {@link RIG_MAX_INFLUENCES} pairs summing to 1. Empty until it is bound, which only a bake refuses. */
    weights: number[][];
}
/** A shape the mesh can blend towards. `offsets` is by part name, flat `[vertex, dx, dy, ...]` in rig units, y up. @experimental */
interface RigDeform {
    name: string;
    offsets: Record<string, number[]>;
}
/** @experimental */
interface RigSource {
    version: number;
    /** The image the parts are cut from. */
    texture: string;
    textureWidth: number;
    textureHeight: number;
    /** World units one image pixel covers. */
    unitsPerPixel: number;
    bones: RigBone[];
    /** In draw order, first at the back: they are one mesh, drawn in index order. */
    parts: RigPart[];
    deforms: RigDeform[];
}
/** @experimental */
declare function createRig(texture: string, textureWidth: number, textureHeight: number, unitsPerPixel?: number): RigSource;
/** Every way a rig is not a rig, as sentences. A rig still being made passes: no bones, and vertices that follow nothing yet. @experimental */
declare function checkRig(rig: RigSource): string[];
/** Reads a `.esrig`, refusing a damaged one: a silently repaired rig is a character that moves wrong later. @experimental */
declare function parseRig(text: string): RigSource;
/** @experimental */
declare function serializeRig(rig: RigSource): string;
/** The id the prefab names bone `index`'s entity by. A bone with none is named by its index, which is what every rig saved before ids had. @experimental */
declare function rigBoneId(bones: readonly RigBone[], index: number): string;
/**
 * Gives every bone without an id one, without reusing one already given: a scene may still hold what it added to a removed bone's entity,
 * and a new bone must not inherit it. Call before anything reorders the list.
 * @experimental
 */
declare function ensureRigBoneIds(rig: RigSource): void;
/** A bone's place in rig space. @experimental */
interface RigBoneWorld {
    x: number;
    y: number;
    rotation: number;
}
/** Every bone in rig space. `rotations` poses them, by bone index, in place of their bind rotations. @experimental */
declare function rigBoneWorlds(bones: readonly RigBone[], rotations?: ArrayLike<number>): RigBoneWorld[];
/** Takes a bone out, giving its children to its parent where they stand, and its vertices to its parent or nearest survivor. @experimental */
declare function removeRigBone(rig: RigSource, index: number): void;

/**
 * @file    rigMesh.ts
 * @brief   From an image to a mesh that bends: cutting it into parts, covering a part, deciding what each vertex follows.
 *
 * @details A part is covered by a grid of cells, keeping those with something drawn in them. An outline hugging the picture saves
 *          triangles but bends badly: long thin triangles fold where a limb turns, and the even cells are what make a bend smooth.
 *          The empty corners of a kept cell are transparent, so the grid's stairs are never seen.
 */

/** Image coverage: `alpha(x, y)` in 0..255 for a pixel from the top left. @experimental */
interface RigImage {
    width: number;
    height: number;
    alpha(x: number, y: number): number;
}
/** A rig image over RGBA bytes, row by row from the top. @experimental */
declare function rigImageFromRGBA(width: number, height: number, rgba: ArrayLike<number>): RigImage;
/**
 * The separate pictures in an image, each what is joined by drawn pixels, largest first. What a sheet of a character's limbs is
 * cut into. Specks under `minArea` pixels are left out.
 * @experimental
 */
declare function findRigParts(image: RigImage, opts?: {
    threshold?: number;
    minArea?: number;
}): {
    x: number;
    y: number;
    w: number;
    h: number;
}[];
/** Covers `rect` with square cells of `cell` pixels, wherever something is drawn. Vertices come back in pixels from the rect's corner. @experimental */
declare function coverRigPart(image: RigImage, rect: RigPart['rect'], opts?: {
    cell?: number;
    threshold?: number;
}): {
    vertices: number[];
    triangles: number[];
};
/** Where a part's vertex sits in rig space. @experimental */
declare function rigVertex(rig: RigSource, part: RigPart, vertex: number): {
    x: number;
    y: number;
};
/**
 * Binds a part's vertices by how near each is to each bone. A good start and not the end: nearness cannot tell an arm from the
 * torso it hangs beside, which is what `bones` (only these may be followed) and painting are for. `falloff` is how sharply a bone's reach ends.
 * @experimental
 */
declare function autoWeightPart(rig: RigSource, part: RigPart, opts?: {
    bones?: readonly number[];
    falloff?: number;
}): void;
/** Every vertex of a part follows one bone, for a piece that does not bend: a helmet, a sword. @experimental */
declare function bindPartToBone(part: RigPart, bone: number): void;
/** One dab of a weight brush. `add` and `remove` move `bone`'s share, `smooth` evens every bone with the vertices joined to each. @experimental */
interface RigWeightDab {
    x: number;
    y: number;
    /** World units. */
    radius: number;
    bone: number;
    /** How far the centre of the brush goes, 0..1. */
    strength: number;
    mode: 'add' | 'remove' | 'smooth';
}
/** Applies a dab to a part, returning how many vertices changed. The weights still sum to 1 after it, which is why the others give way. @experimental */
declare function paintPartWeights(rig: RigSource, part: RigPart, dab: RigWeightDab): number;
/** Pushes the vertices of every part around (x, y), by (dx, dy) at the centre and nothing at `radius`, into one deform. Returns how many moved. @experimental */
declare function pushRigDeform(rig: RigSource, deformIndex: number, x: number, y: number, radius: number, dx: number, dy: number): number;
/** How much `bone` moves each vertex of a part, 0..1: what a weight view colours. @experimental */
declare function partWeightsOf(part: RigPart, bone: number): Float32Array;

/**
 * @file    rigBake.ts
 * @brief   What a scene draws of a rig: its `.esmesh`, and the skin that same geometry takes in a preview.
 *
 * @details One mesh, the parts laid down in draw order: a blended mesh draws in index order, so that order IS how a limb goes behind
 *          the body, and the whole character is one draw. Joint i of the mesh is bone i of the rig, so what binds it is the order of the bones.
 */

/** Turns a rig into mesh data, refusing one {@link checkRig} refuses or that has no bones to follow. @experimental */
declare function bakeRig(rig: RigSource): MeshData;
/**
 * Where every vertex of one part lands, flat `[x, y, ...]` in rig space, by the same sum the shader does: deform first, then skin.
 * What an authoring view draws, so what it shows is what the game will.
 * @experimental
 */
declare function skinRigPart(rig: RigSource, partIndex: number, posed: readonly RigBoneWorld[], deformWeights?: ArrayLike<number>): Float32Array;

/**
 * @file    rigRebind.ts
 * @brief   Changing which bone is which after a rig is bound: a new parent, a whole skeleton from another rig, and what the paths a clip names become.
 *
 * @details A bone has three names. Its index is what a vertex follows and what joint of the mesh it is, and it moves whenever the list is
 *          reordered. Its path (`upper/lower`) is what a clip names it by, and it moves when it or a bone above it is renamed or reparented.
 *          Its `id` never moves: it is what the prefab names the bone's entity by, so what a scene added to one bone (an IK2D, a sword) stays
 *          on that bone through every edit here. Every function in this file keeps vertices where they are in rig space: rebinding
 *          changes what follows what, never what the character looks like at rest.
 */

/** Each bone's path, as a clip names it below the rig's root. @experimental */
declare function rigBonePaths(bones: readonly RigBone[]): string[];
/** Why a bone cannot take this parent, or null when it can. @experimental */
declare function rigParentProblem(rig: RigSource, index: number, parent: number): string | null;
/**
 * Hangs a bone (and everything below it) off another, or makes it a root with -1, where it stands now: its place and rotation are
 * re-expressed in the new parent's space, so nothing moves at rest. The list is reordered when the new parent came after it, and the
 * weights with it; ids stay, so the scene keeps what it added to each bone. Returns the bone's index afterwards.
 * Throws on a parent {@link rigParentProblem} refuses.
 * @experimental
 */
declare function setRigBoneParent(rig: RigSource, index: number, parent: number): number;
/** What {@link rebindRigToSkeleton} did, bone by bone of the rig as it was. @experimental */
interface RigRebindReport {
    /** Old bone names that found a bone of the same name. */
    matched: string[];
    /** Old bone names that did not, and the new bone their vertices went to. */
    moved: {
        from: string;
        to: string;
    }[];
}
/**
 * Binds the rig to another skeleton, a list of bones as a `.esrig` holds them, matched by name. The rig's bones become a copy of
 * `skeleton`, ids included, so two rigs bound to one skeleton have entities of the same ids and names and play the same clips.
 * A vertex keeps its weights on every bone that found its namesake. A bone that did not hands them to its nearest ancestor that did,
 * or, with none, to the new bone whose head is closest to its own. Vertices stay where they are in rig space; what moves is the bind
 * pose, so the skin rests where it did against whatever pose the new skeleton rests in.
 * @experimental
 */
declare function rebindRigToSkeleton(rig: RigSource, skeleton: readonly RigBone[]): RigRebindReport;
/** How the paths a clip names changed between two saves of one rig, by bone id. @experimental */
interface RigPathChanges {
    /** Old path to new, for every bone still there whose path is not what it was. */
    renamed: Map<string, string>;
    /** Paths of bones that are gone. */
    removed: string[];
    /** Every path the rig had before: what a clip must name to be one of this rig's. */
    before: Set<string>;
}
/** Compares two saves of a rig. Bones without ids are matched by index, which is what they were saved as. @experimental */
declare function rigPathChanges(before: readonly RigBone[], after: readonly RigBone[]): RigPathChanges;
/**
 * Where a path named before the change points now. A path below a bone (a sword parented to `arm` in the scene, `arm/sword`) follows the
 * deepest bone it starts with. Null when that bone is gone; the path itself when nothing it starts with changed.
 * @experimental
 */
declare function remapRigPath(path: string, changes: RigPathChanges): string | null;

/**
 * @file    solve2d.ts
 * @brief   Bending a chain of bones towards a point, in one plane. Pure, so the runtime and an authoring view move a limb the same way.
 *
 * @details Two bones have an exact answer, which is also the only one that keeps a knee bending the way it was told. Longer chains
 *          take cyclic coordinate descent: it respects a joint's limits directly, where a position-based solver would have to project them back afterwards.
 */
/** One bone of a chain. `x, y` is where it starts in its parent's space and `rotation` its turn there. @experimental */
interface ChainBone {
    x: number;
    y: number;
    rotation: number;
    /** Radians the local rotation must stay between. */
    min?: number;
    max?: number;
}
/** @experimental */
interface ChainSolveOptions {
    /** How far past the last bone's origin the point being aimed is, along its +x. */
    tipLength: number;
    /** Two bones only: which way the middle joint bends, +1 counter-clockwise. Defaults to the way it already bends. */
    bend?: number;
    iterations?: number;
    /** Close enough, in the chain's units. */
    tolerance?: number;
}
/** A rotation within a joint's limits, measured the short way round from the middle of them so a limit can cross ±180°. @experimental */
declare function clampAngle(angle: number, min?: number, max?: number): number;
/** Where the chain's tip ends up, in the space the first bone's `x, y` are in. @experimental */
declare function chainTip(chain: readonly ChainBone[], tipLength: number): {
    x: number;
    y: number;
};
/**
 * Turns the chain's bones in place so its tip reaches `target`, in the space the first bone's `x, y` are in. A point out of reach
 * leaves the chain stretched towards it.
 * @experimental
 */
declare function solveChain2D(chain: ChainBone[], targetX: number, targetY: number, opts: ChainSolveOptions): void;

/** @experimental */
interface SpawnedRig {
    /** Carries the MeshRenderer, the MeshSkin and, when the rig has deforms, the MeshMorph. */
    root: Entity;
    /** By bone index, which is the order the mesh's joints are in. */
    bones: Entity[];
}
/** `mesh` is the rig baked and loaded; `texture` is its image. Each bone is named as in the rig, so a clip reaches it by path. @experimental */
declare function spawnRig(world: World, rig: RigSource, opts: {
    mesh: number;
    texture: number;
    layer?: number;
    x?: number;
    y?: number;
    z?: number;
}): SpawnedRig;
/**
 * A rig as a prefab, which is how it reaches a scene: saving again changes every instance, and what a scene adds to one (an IK2D, a clip) stays.
 * `mesh` and `texture` are asset refs. Same shape as {@link spawnRig}.
 * @experimental
 */
declare function rigPrefab(rig: RigSource, name: string, mesh: string, texture: string): {
    version: string;
    name: string;
    rootEntityId: string;
    entities: Record<string, unknown>[];
};

export { RIG_MAX_INFLUENCES, RIG_SOURCE_EXT, RIG_SOURCE_VERSION, autoWeightPart, bakeRig, bindPartToBone, chainTip, checkRig, clampAngle, coverRigPart, createRig, ensureRigBoneIds, findRigParts, paintPartWeights, parseRig, partWeightsOf, pushRigDeform, rebindRigToSkeleton, remapRigPath, removeRigBone, rigBoneId, rigBonePaths, rigBoneWorlds, rigImageFromRGBA, rigParentProblem, rigPathChanges, rigPrefab, rigVertex, serializeRig, setRigBoneParent, skinRigPart, solveChain2D, spawnRig };
export type { ChainBone, ChainSolveOptions, RigBone, RigBoneWorld, RigDeform, RigImage, RigPart, RigPathChanges, RigRebindReport, RigSource, RigWeightDab, SpawnedRig };
