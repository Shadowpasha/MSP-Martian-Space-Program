import { WorldRules, Zones, ZoneDef, WorldPlan, PlacementDiffs, Placement } from '../shared/worldgenPlugin.js';
export { BiomeCondition, BiomeDef, BiomeRecipe, Environment, EnvironmentInputs, FaceZones, FieldFn, FieldValues, GroundFit, GroundFitResult, GroundingOptions, Group, NoiseField, PlacedObject, PlacedObjectData, PlacementChange, PlacementDiffsData, PlacementLayer, PlaneFrame, PlanetFace, Recipe, RecipeMember, Rejection, WorldGen, WorldGenData, WorldGenPlugin, WorldGenRes, WorldGenStatus, WorldGens, WorldSurface, WorldZone, WorldZoneData, ZoneShape, ZoneShapeKind, bandWeight, faceHalf, faceUnit, fbm, fbm3, fitGroundFootprint, hash01, hashString, planetFaces, registerWorldRules, validateGrounding, worldGenPlugin, worldRules, zoneBounds, zoneDistance, zoneWeight } from '../shared/worldgenPlugin.js';
import { AssetLoader, LoadContext, App } from '../shared/app.js';
import '../shared/wasm.js';
import '../shared/resource.js';
import '../shared/planetQuery.js';
import '../shared/plantGrowth.js';

/**
 * @file    rulesAsset.ts
 * @brief   World rules as a project file (`.esworld`): biomes, recipes and layers as data, which artists and designers edit and a
 *          package carries with every mesh and material they name.
 *
 * @details The file is the rules' JSON: what `registerWorldRules` takes, less the fields made by code (a game's own fields stay in
 *          code). Meshes and materials are named by their project paths, so the cook follows them from the file as it follows a
 *          material's textures. A file that does not say what rules need is refused with where it went wrong, rather than laying out
 *          a world from half of it.
 */

/** Whether a WorldGen's `rules` names a file rather than rules registered by code. */
declare function isRulesFile(ref: string): boolean;
/** Rules from a file's JSON, checked; throws naming the first thing a world could not be laid out from. */
declare function parseWorldRules(json: unknown, file?: string): WorldRules;
/** Loads `.esworld` files as checked world rules. */
declare class WorldRulesAssetLoader implements AssetLoader<WorldRules> {
    readonly type = "world-rules";
    readonly extensions: string[];
    load(path: string, ctx: LoadContext): Promise<WorldRules>;
    unload(): void;
}

/** A path's reserved corridor, usable on a 3D ground plane or a 2D world's x/y plane. */
interface RoadOptions {
    id: string;
    /** World [x, z] points (read z as y in a 2D world). Repeat the first point to close a loop. */
    points: readonly (readonly [number, number])[];
    /** Full width of the travelled surface. */
    width: number;
    /** Extra clearance on each side, before the soft edge (default 0). */
    clearance?: number;
    falloff?: number;
    priority?: number;
    /** Default ['*']; use tags such as tree/building to keep small ground cover. */
    excludes?: readonly string[];
    biome?: string;
    fields?: Readonly<Record<string, number>>;
}
/**
 * Turns a polyline into ordinary zones: rectangles with round joins and end caps, so bends leave no holes.
 * These serialize into worker plans and use the normal footprint-aware exclusion and terrain-paint paths.
 * It reserves a corridor; it does not make a road mesh or flatten a sloping road to one height.
 */
declare function roadZones(options: RoadOptions): ZoneDef[];
/** Replace just this road's zones, including removing obsolete segments after shortening the path. Validates before changing anything. */
declare function setRoad(zones: Zones, options: RoadOptions): void;
/** Remove a road's reservation; unrelated zones are preserved. */
declare function removeRoad(zones: Zones, id: string): void;

/**
 * @file    world2d.ts
 * @brief   A generated world on the screen plane: the rules a 3D world is laid out by, read flat over x and y, and published in chunks round the camera.
 *
 * @details The plan (plan.ts) is a function of position, seed and rules and asks nothing of the ground but a height, so a world with no
 *          terrain is a flat plan, and a 2D world is that plan with its second axis read as world y. Nothing is drawn here: what the plan
 *          places is a list of things standing at points (a recipe, a member of it, a biome, a footprint), and what a thing looks like
 *          (a sprite, a prefab, a tile of the ground) is the game's, said in `publish`.
 *
 *            - A chunk is a square of the world, `chunkSize` a side. Each frame the ones near a streaming source (or the camera) are made,
 *              nearest first within the frame's budget, and the ones left behind are released with whatever `publish` handed back to undo them.
 *            - What `publish` is given: the placements of the chunk, and the biome of each cell of a grid across it, for painting the ground.
 *            - What a player changed (a tree felled) is a {@link PlacementDiffs}: laid over the plan before a chunk is shown, so it stays felled
 *              when its chunk is let go and made again, and after a save is read back. Only the chunk the thing stood in is made again.
 *            - A group (an anchor and the members placed round it) belongs to the chunk its anchor stands in, so one across a chunk's edge is neither
 *              cut nor placed twice.
 *
 *          The rules are the 3D ones: a recipe's `mesh`, `material`, `attach` and `minUp` mean nothing here and are not read, and its `ring` is in world
 *          units with `arc` in degrees from +x toward +y.
 */

/** One thing the plan placed, on the screen plane. */
interface Placement2D {
    /** Stable across loads and load orders: what a save records and `remove` takes. */
    id: string;
    group: string;
    layer: string;
    recipe: string;
    member: string;
    biome: string;
    /** The zone it stands in, if any. */
    zone: string | null;
    x: number;
    y: number;
    /** Turn, in radians, and size. */
    yaw: number;
    scale: number;
    /** What a game interacts with it as (a tree to fell); null for scenery. */
    interactive: string | null;
    /** The kind of plant the rules name, or null. */
    plant: string | null;
    /** What it takes on the ground, and how far it spreads overhead, in world units. */
    footprint: number;
    canopy: number;
}
/** One chunk, as `publish` is given it. */
interface World2DChunk {
    /** The chunk's place on the grid of chunks, and the world corner (lowest x and y) it starts at. */
    cx: number;
    cy: number;
    x0: number;
    y0: number;
    size: number;
    /** The things standing in it, with what a player changed laid over them. */
    placements: Placement2D[];
    /** The ground: `cells` by `cells` squares across the chunk, row 0 at the lowest y, each the index into `biomes` of the biome that holds most there (255: none). */
    cells: number;
    cellSize: number;
    biomeGrid: Uint8Array;
    /** The rules' biome ids, in the order the grid indexes them. */
    biomes: readonly string[];
}
interface World2DOptions {
    /** The rules, or the id of rules the game registered with `registerWorldRules`. */
    rules: WorldRules | string;
    seed?: number;
    /** The world as the game names it: another name lays out another world by the same rules and seed. */
    world?: string;
    /** The side of a chunk, in world units (default 512). */
    chunkSize?: number;
    /** The side of one cell of the ground grid, in world units (default 32). */
    cellSize?: number;
    /** Chunks within this of a source are made, and one is released past `unloadRadius`. Defaults: a chunk and a half, and two and a half. */
    loadRadius?: number;
    unloadRadius?: number;
    /** Where the world is wanted round, in world x and y; absent, the streaming sources, or else the camera. */
    sources?: () => Iterable<{
        x: number;
        y: number;
    }>;
    /** Areas planned by hand: kept clear, or held to a biome. A zone's `z` is world y. */
    zones?: readonly ZoneDef[];
    /** What players changed; absent, the world keeps its own. */
    diffs?: PlacementDiffs;
    /** Shows one chunk. Returns how to take what it showed away (despawn what it spawned); `release` calls it. */
    publish(chunk: World2DChunk): (() => void) | void;
}
/** A generated 2D world: ask it, change it, let it go. */
interface World2D {
    /** The plan, for the questions a game asks about the world itself. */
    readonly plan: WorldPlan;
    /** What players changed. Remove a felled tree's id here and its chunk is made again without it. */
    readonly diffs: PlacementDiffs;
    /** The biome that holds most at a world point, or null. */
    biomeAt(x: number, y: number): string | null;
    /** The chunks counted: ready, pending, failed. */
    status(): {
        ready: number;
        pending: number;
        failed: number;
    };
    /** Takes the world away, releasing every chunk. */
    dispose(): void;
}
/** A placement as a 2D game reads it: the plan's second axis is world y. */
declare function placement2D(p: Placement): Placement2D;
/**
 * One chunk of a plan: what stands in the square [cx * size, (cx + 1) * size) by [cy * size, (cy + 1) * size), with what players changed laid over
 * it, and the biome of each cell of a `cells` by `cells` grid across it. `ids` is every placement the plan made there, removed ones too, which is
 * what a change to one of them is looked up by.
 */
declare function world2dChunk(plan: WorldPlan, diffs: PlacementDiffs, cx: number, cy: number, size: number, cells: number): {
    chunk: World2DChunk;
    ids: string[];
};
/** Lays out a world by `rules` over the screen plane and publishes it in chunks round the camera, as `id`. */
declare function createWorld2D(app: App, id: string, options: World2DOptions): World2D;
/** The world's streaming sources as 2D points, for a game that wants to add its own. */
declare function streamingPoints2D(app: App): {
    x: number;
    y: number;
}[];

export { Placement, PlacementDiffs, WorldPlan, WorldRules, WorldRulesAssetLoader, ZoneDef, Zones, createWorld2D, isRulesFile, parseWorldRules, placement2D, removeRoad, roadZones, setRoad, streamingPoints2D, world2dChunk };
export type { Placement2D, RoadOptions, World2D, World2DChunk, World2DOptions };
