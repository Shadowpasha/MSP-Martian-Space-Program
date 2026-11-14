import { Entity } from './wasm.js';
import { App, ComponentDef, Plugin, AssetLease, AssetScope, MeshData } from './app.js';
import { ResourceDef } from './resource.js';
import { PlanetFacts, Terrains } from './planetQuery.js';
import { PlacedKind, PlantKind, ReadyKinds } from './plantGrowth.js';

/** A place a layer is wanted round, on the layer's plane (the ground by default), in world units. */
interface ChunkSource {
    x: number;
    z: number; /** Its height, where a layer is not on a plane (a planet's collision reads the whole position). */
    y?: number;
}
/** One kind of chunk: how it is cut, where it is wanted and how it is made. */
interface ChunkLayer<T> {
    /** What the layer is, for the progress shown while its chunks are made. */
    readonly label: string;
    /**
     * The world plane the chunk grid lies on. `'xz'` (the default) is the ground of a 3D world and chunks are cut along world x and z. `'xy'` is a 2D
     * world, whose ground is the screen plane: chunks are cut along world x and y, and every place below called z is world y. It decides how the world's own
     * streaming sources (and the camera) are read; a layer's own `sources()` already answer in the layer's plane.
     */
    plane?: 'xz' | 'xy';
    /** The world position of chunk (0, 0)'s corner, and the side of a chunk along the plane's two axes (x, then z, or y on 'xy'). */
    originX: number;
    originZ: number;
    sizeX: number;
    sizeZ: number;
    /** The chunks there are, [x0, z0, x1, z1) in chunk coordinates; null for no end. */
    extent: readonly [number, number, number, number] | null;
    /** Chunks within this of a source are wanted; one is let go once past `unloadRadius` of every source. */
    loadRadius: number;
    unloadRadius: number;
    /** Names the layer's inputs: when it changes every chunk is made again, and answers for an older one are thrown away. */
    generation: number | string;
    /** Where the layer is wanted round; absent, the world's streaming sources (or the eye, where there are none). */
    sources?(): Iterable<ChunkSource>;
    /** True when `make` answers later, off the main thread: the layer is then asked for every chunk it wants, at once, and is not held to the frame's time. */
    async?: boolean;
    /** Makes a chunk. Null is "not yet" (what it stands on is not ready) and is asked again later; a promise answers later. */
    make(cx: number, cz: number, signal: AbortSignal): T | null | Promise<T | null>;
    /** Puts a made chunk into the world. An older version of it, if one was published, has just been released. */
    publish(cx: number, cz: number, value: T): void;
    /** Takes a published chunk out of the world: everything it put there. */
    release(cx: number, cz: number, value: T): void;
}
/** Where one chunk stands: being made, published (for the layer's generation now, or an older one), or failed. */
type ChunkState = 'making' | 'ready' | 'stale' | 'failed';
/** A layer's chunks, counted. */
interface ChunkLayerStatus {
    /** Published for the generation now. */
    ready: number;
    /** Published for an older generation, waiting to be made again. */
    stale: number;
    /** Wanted and not published yet (including those being made). */
    pending: number;
    making: number;
    failed: number;
    /** Why the first failed chunk failed. */
    reason?: string;
}
/** The procedural chunks of every layer. Read {@link ProceduralChunks.status} for where they stand. */
declare class ProceduralChunks {
    private readonly layers_;
    /** @internal Set by the plugin: the world's own sources, sampled once a frame. */
    sources_: () => ChunkSource[];
    /** True while something else is showing this world (the editor's play realm has its own): no place is wanted, so every chunk is let go. */
    suspended: boolean;
    /** Adds a layer under `id`, or takes the new definition of one already there (its chunks stay and follow the new generation). */
    set<T>(id: string, def: ChunkLayer<T>): void;
    /** Takes a layer away, releasing every chunk it published and stopping what is being made. */
    remove(id: string): void;
    has(id: string): boolean;
    /** Where the chunk of layer `id` at world (x, z) (x, y on an 'xy' layer) stands, or null when it is not wanted, not made, or there is no such layer. */
    stateAt(id: string, x: number, z: number): ChunkState | null;
    /** Layer `id`'s chunks counted, or null when there is no such layer. */
    status(id: string): ChunkLayerStatus | null;
    /** How many chunks every layer still wants made. */
    get pending(): number;
    /**
     * Makes the published chunks of layer `id` that touch the world square [x0, x1] by [z0, z1] again, each keeping its old version
     * until the new one replaces it: what changed there (a zone, a felled tree) changed only them.
     */
    invalidate(id: string, x0: number, z0: number, x1: number, z1: number): void;
    /** Lets go of every chunk of every layer. */
    clear(): void;
    /**
     * One frame: releases what no source is near, then makes what is wanted, nearest first across every layer: the chunks a source
     * stands in at once, and the rest while `hasTime` says so (an `async` layer's, all of them).
     */
    step(hasTime: () => boolean): boolean;
    /** Makes one chunk; true when it is now being answered later. */
    private make;
    private publish;
    private fail;
    /** Releases what a chunk published and stops what it is making. */
    private drop;
    /** @internal The labels and progress of the layers still making chunks, for the bakes list. */
    progress_(): {
        label: string;
        progress: number;
        owner: object;
    }[];
}
/** The resource; {@link chunksOf} installs it where it is missing. @experimental */
declare const ProceduralChunksRes: ResourceDef<ProceduralChunks>;
declare function streamingSourcesOf(app: App): ChunkSource[];
/** The App's procedural chunks, installed (with the system that steps them, after Update) on first use. */
declare function chunksOf(app: App): ProceduralChunks;

/** The fields at one place, by name. `height` is NaN where there is no ground. */
type FieldValues = Record<string, number>;
/** A field of the game's own: a number at (x, z), read after the built-in ones (which it may read from `at`). */
type FieldFn = (x: number, z: number, at: Readonly<FieldValues>) => number;
/** A seeded noise field: `scale` world units to a feature, `octaves` layers of detail. */
interface NoiseField {
    scale: number;
    octaves?: number;
}
/** Where the environment comes from. */
interface EnvironmentInputs {
    seed: number;
    /** The ground's height, how much it faces up and (if known) its normal at (x, z), or null where there is none. */
    ground(x: number, z: number): {
        y: number;
        up: number;
        normal?: [number, number, number];
    } | null;
    /** How deep water stands over the world height `y` at (x, z): above zero under water, null where there is none. */
    waterDepth?(x: number, z: number, y: number): number | null;
    /** How far (x, z) is from the water's edge across the ground: above zero on land, below in the water, null where no water is known. */
    shoreDistance?(x: number, z: number): number | null;
    /**
     * Where (x, z) is in the space the noise fields are read from. Absent, the noise is flat, over x and z; a round world gives the point's place in
     * three dimensions, so a field wanders over it with no seam where its ground's patches meet.
     */
    space?(x: number, z: number): readonly [number, number, number];
    /** The noise fields; absent ones keep their defaults (moisture 900, temperature 2400, rock 500 world units). */
    noise?: Partial<Record<string, NoiseField>>;
    /** Fields of the game's own. */
    fields?: Record<string, FieldFn>;
    /** Fields set by hand over an area: the value, and how much of it holds at (x, z) (0 to 1). */
    overrides?(x: number, z: number): {
        field: string;
        value: number;
        weight: number;
    }[];
}
/** A stable 32-bit hash of integers, as a number in [0, 1). */
declare function hash01(...v: number[]): number;
/** A stable hash of a string, for mixing a name into a seed. */
declare function hashString(s: string): number;
/** Fractal value noise in three dimensions, 0 to 1: what a round world's slow fields are read from, which has no seam and no pole. */
declare function fbm3(x: number, y: number, z: number, seed: number, octaves: number): number;
/** Fractal value noise, 0 to 1. */
declare function fbm(x: number, z: number, seed: number, octaves: number): number;
/** Samples the environment. */
declare class Environment {
    readonly inputs: EnvironmentInputs;
    private readonly noise_;
    private readonly seeds_;
    constructor(inputs: EnvironmentInputs);
    /**
     * Every field at (x, z), each worked out the first time it is read and not before: a biome reads three or four of the dozen, and a candidate asks
     * of every biome, so working all of them out for each was most of what laying out a world cost.
     */
    sample(x: number, z: number): FieldValues;
}

/** A zone's outline: a circle, or a rectangle turned by `yaw` radians about the vertical. */
type ZoneShape = {
    type: 'circle';
    x: number;
    z: number;
    radius: number;
    y?: number;
} | {
    type: 'rect';
    x: number;
    z: number;
    halfX: number;
    halfZ: number;
    yaw?: number;
    y?: number;
    facing?: readonly [number, number, number];
};
interface ZoneDef {
    /** Stable: what a placement records as the zone it stands in or was kept out by. */
    id: string;
    /** What the zone is for (home, road, landing, building, resource, view): a game's own words. */
    kind: string;
    shape: ZoneShape;
    /** Over how many world units past its outline it fades out. */
    falloff: number;
    priority: number;
    /** The tags of what it keeps out; `*` keeps out everything. */
    excludes: readonly string[];
    /** A biome it holds over its area, if any. */
    biome?: string;
    /** Fields it sets over its area. */
    fields?: Readonly<Record<string, number>>;
    /**
     * Levels the terrain under it: to this world height, or ('ground') to the ground's height at its centre as the ground was made,
     * blending back over its falloff. Live plane generators hold the modifier; it is released when the zone or its last consumer goes.
     */
    flatten?: number | 'ground';
}
/** How far (x, z) is outside a zone's outline: negative inside. */
declare function zoneDistance(shape: ZoneShape, x: number, z: number): number;
/** How much of a zone holds at a point `d` outside its outline: 1 inside, fading smoothly to 0 at `falloff`. */
declare function zoneWeight(zone: ZoneDef, d: number): number;
/** The square a zone reaches, its edge included: [minX, minZ, maxX, maxZ]. */
declare function zoneBounds(zone: ZoneDef): [number, number, number, number];
/** The zones of one world. */
declare class Zones {
    private readonly zones_;
    private readonly listeners_;
    /** Bumped on every change. */
    revision: number;
    /** Told the area every change touched (the zone's old and new bounds) and the zone there, so only what stands there is placed again. */
    onChange: ((bounds: [number, number, number, number], zone: ZoneDef) => void) | null;
    /** Listens alongside other consumers; the returned function stops listening. */
    subscribe(listener: NonNullable<Zones['onChange']>): () => void;
    private changed;
    set(zone: ZoneDef): void;
    delete(id: string): void;
    get(id: string): ZoneDef | undefined;
    all(): IterableIterator<ZoneDef>;
    /** The zones that hold at (x, z), with how much, highest priority first. */
    at(x: number, z: number, reach?: number): {
        zone: ZoneDef;
        weight: number;
    }[];
    /**
     * The zone that keeps out something of radius `radius` carrying `tags` at (x, z), or null. Inside a zone it is kept out; in its
     * edge it is kept out with the zone's weight there, by a draw fixed for that place, so the edge thins instead of ending on a line.
     */
    excluding(x: number, z: number, radius: number, tags: readonly string[], seed: number): ZoneDef | null;
}

/**
 * @file    planetSurface.ts
 * @brief   A planet's ground as a plane for laying a world out on: each face of the cube is one, in metres.
 *
 * @details The plan (plan.ts) works on a plane of x and z. A round world has none, but each face of the cube the planet is cut into (terrain/sphere.ts)
 *          is a square of ground that reads as one: x and z are metres across the face from its middle (a quarter turn of the great circle
 *          is a face's width, so a metre on the plane is a metre on the ground at the middle and a third less at the corner), and the
 *          height is the ground's height above the radius. A world is laid out face by face, and a direction is laid out by the face it falls on, so
 *          a point is planned once. What is placed is taken from the plane to the planet here: its place, and which way is up.
 */

/** The metres a unit of a face's -1 to 1 is, at its middle. */
declare const faceUnit: (radius: number) => number;
/** How wide a face is, in metres across the plane (-half to +half). */
declare const faceHalf: (radius: number) => number;
/** Where a point of the plane stands on the planet: its direction from the centre, the unit vectors along the plane's x, up and z there. */
interface PlaneFrame {
    dir: [number, number, number];
    eu: [number, number, number];
    ev: [number, number, number];
}
/** One face of a planet as a plane. */
declare class PlanetFace {
    readonly face: number;
    readonly planet: () => PlanetFacts | null;
    constructor(face: number, planet: () => PlanetFacts | null);
    private facts;
    /** The unit direction from the centre at a point of the plane (beyond the face's edge it carries on over the next). */
    directionAt(x: number, z: number): [number, number, number];
    /** The point of the plane under a direction from the centre, or null for a direction that does not face this one. */
    planeOf(dx: number, dy: number, dz: number): {
        x: number;
        z: number;
    } | null;
    /** The frame at a point of the plane. */
    frameAt(x: number, z: number): PlaneFrame;
    /** The world position of a point of the plane at a height above the radius. */
    world(x: number, y: number, z: number): [number, number, number];
    /** The tiles of the planet's answer this face has read, newest last: a world is laid out from these, not from a call of the provider for each point it asks about. */
    private readonly tiles_;
    /** The tile of the plane that holds (x, z), read from the provider in one call for all its points; null while the provider answers later. */
    private tile;
    /** The cell of a tile that holds (x, z), and where in it. */
    private cellOf;
    /** The ground's height above the radius at (x, z), filtered between the tile's points; null where it cannot be said yet. */
    private heightAt;
    /** The planet's layers' paint at (x, z) from the provider (the nearest point of its tile), or null where it does not paint or cannot say yet. */
    paintAt(x: number, z: number): readonly number[] | null;
    /** The provider's own fields at (x, z), filtered between the tile's points; null where it has none or cannot say yet. */
    fieldsAt(x: number, z: number): readonly number[] | null;
    /** The ground under a point of the plane: its height above the radius, how much it faces away from the centre, and its normal along the plane's x, up and z. */
    ground(x: number, z: number): {
        y: number;
        up: number;
        normal: [number, number, number];
    } | null;
    /** What a plane normal is in the world: along the frame's x, up and z. */
    worldNormal(normal: readonly [number, number, number], x: number, z: number): [number, number, number];
    /** The environment's inputs for this face: the ground, and the noise read in three dimensions from the point's place on the sphere. */
    environment(): Pick<EnvironmentInputs, 'ground' | 'space'>;
    /** A zone of the world (a circle or a box standing at a world position) as this face's plane has it, or null where its centre is not over this face. */
    zoneOnFace(zone: ZoneDef): ZoneDef | null;
    /** The streaming sources, in this face's plane (those over it, and over its neighbours' edges within `reach`). */
    sourcesOnFace(sources: Iterable<{
        x: number;
        y?: number;
        z: number;
    }>, reach: number): {
        x: number;
        z: number;
    }[];
}
/** The six faces of a planet, as planes. */
declare function planetFaces(planet: () => PlanetFacts | null): PlanetFace[];
/** The zones of a world as each face has them: those over it, in its plane. Kept in step by `sync`. */
declare class FaceZones {
    readonly face: PlanetFace;
    readonly zones: Zones;
    constructor(face: PlanetFace);
    /** Takes the world's zones, replacing what was there: only what changed touches the plan. */
    sync(world: Iterable<ZoneDef>): void;
}

/**
 * @file    plants.ts
 * @brief   The kinds of plant a world's recipes name, made into the kinds a `PlacedFoliage` grows: one kind a plant in each colouring it has.
 *
 * @details A plant with `tints` is as many kinds as it has tints (its parts' colour multiplied by each), and a place takes one of them by a slow
 *          noise, so a wood has warm and cool stands and never a speckle. A plant without is one kind.
 */

/** A rules' plants as kinds, and which kind a plant at a place is. */
interface PlantSet {
    kinds: PlacedKind[];
    /** The index of the kind that the plant `name` is at world (x, z); -1 for a name the set does not have. */
    kindAt(name: string, x: number, z: number): number;
    /** How far the plant `name` is sunk into the ground. */
    sinkOf(name: string): number;
    /** World units to a unit of the plant `name`'s mesh. */
    unitOf(name: string): number;
    /** The furthest any kind is wanted: where the far versions end. */
    reach: number;
    /** The least distance a far version is shown over (from what its kind draws to how far it goes): a far cell is as wide as that allows. 0 where none has one. */
    span: number;
}

/** Fit an upright building's base to a grid over its entire rotated footprint. */
interface GroundingOptions {
    /** Width and depth in model units, centred on the model's origin. */
    size: readonly [number, number];
    /** Odd grid side, including corners, edges and centre (3, 5, 7 or 9; default 5). */
    samples?: number;
    /** Base elevation before offset; highest avoids embedding the base (default). */
    mode?: 'highest' | 'lowest' | 'mean' | 'center';
    /** Reject sites with more height variation than this, in world units. */
    maxRelief?: number;
    /** Vertical offset in model units, scaled with the model. */
    offset?: number;
}
/** Measurements a foundation builder or a placement diagnostic can use. */
interface GroundFit {
    y: number;
    min: number;
    max: number;
    mean: number;
    relief: number;
    /** Distance from the base to the lowest sampled ground, in world units. */
    supportDepth: number;
    /** Distance from the base to the highest sampled ground, in world units. */
    buriedDepth: number;
    samples: number;
}
type GroundFitResult = {
    ok: true;
    fit: GroundFit;
} | {
    ok: false;
    reason: 'noGround' | 'slope' | 'water' | 'relief';
};
/** Shared by file validation and direct callers; bad grids must never cause unbounded sampling. */
declare function validateGrounding(options: GroundingOptions): void;
/**
 * Samples the same ground used by the plan, without changing it. Positive yaw follows the engine's +Y quaternion rotation.
 * A supported site is a finite grid test, not a proof about features smaller than its sample spacing. Use maxRelief no greater
 * than the model's foundation depth, or level the accepted site with a WorldZone before placing an authored building.
 */
declare function fitGroundFootprint(inputs: Pick<EnvironmentInputs, 'ground' | 'waterDepth'>, x: number, z: number, yaw: number, scale: number, options: GroundingOptions, limits?: {
    minUp?: number;
    waterDepth?: number;
}): GroundFitResult;

/**
 * @file    rules.ts
 * @brief   What a game says its worlds are made of: biomes, the recipes that stand in them, and the layers they are placed in.
 *
 * @details The engine places; the game rules; the artists make the recipes. A rule set is registered under an id and named by a
 *          `WorldGen` component with its version, as a terrain names its provider, and a saved world keeps the version it was made
 *          with.
 *
 *            - A biome is a weight over the fields: each condition a band of one field with soft edges, multiplied. Where several hold
 *              their weights are mixed, its edge wanders by `transition` world units of noise so no border is ruled, and it says how
 *              the ground is painted and which recipes stand in it, in which layer and how densely.
 *            - A recipe is a group an artist composed: an anchor (a big tree, a main rock) and members placed round it within ranges
 *              (a ring of distances, an arc of angles, a count, a scale), each with its footprint (what it takes on the ground: a
 *              trunk) apart from its canopy, how it stands on the ground and how steep it may stand, and whether it may be left out.
 *            - A layer is a pass of placement: big things first. Each takes its candidates on a jittered grid `spacing` apart, keeps
 *              clear of the footprints of the layers before it, and is published in chunks out to `drawDistance`.
 */

/** A band of one field with soft edges: full weight between `min` and `max`, fading to none over `blend` past each. */
interface BiomeCondition {
    field: string;
    min?: number;
    max?: number;
    blend?: number;
}
/** What stands in a biome: a recipe, the layer it is placed in, and the share of that layer's candidates it takes (0 to 1). */
interface BiomeRecipe {
    recipe: string;
    layer: string;
    density: number;
}
interface BiomeDef {
    id: string;
    conditions: readonly BiomeCondition[];
    /** A multiplier on its weight, to favour it where it ties. */
    weight?: number;
    /** How far its edge wanders, in world units. */
    transition?: number;
    /** How the ground is painted where it holds: the weight of each of the terrain's layers (four, or up to eight), and how much of the ground's own paint it replaces. */
    paint?: readonly number[];
    paintStrength?: number;
    recipes: readonly BiomeRecipe[];
}
/** One kind of thing in a recipe. */
interface RecipeMember {
    /** Stable within the recipe: part of every placement's id. */
    id: string;
    /** The mesh it is drawn with, and the material: an asset path (as a recipe file names them) or a handle already loaded. Absent for a member that is a `plant`. */
    mesh?: number | string;
    /**
     * Or the kind of plant it is, by its name in the rules' `plants`: several parts (a trunk and its crown), a cheaper mesh and a far version each,
     * and the colourings the art gives it. It is grown a cell at a time like a `PlacedFoliage`, in place of the mesh and material above.
     */
    plant?: string;
    material?: number | string;
    /** What a game interacts with it as (ore, tree to fell); absent, it is decoration and drawn merged with its chunk. */
    interactive?: string;
    /** How many of it (the anchor is always one). */
    count?: readonly [number, number];
    /** How far from the anchor and at what angles (degrees, from +x toward +z), for a member. */
    ring?: readonly [number, number];
    arc?: readonly [number, number];
    scale?: readonly [number, number];
    /** Radius it takes on the ground: world units by default, model units with scaleFootprint. */
    footprint: number;
    /** Scale footprint and canopy with the model. Omitted preserves existing world-unit rules. */
    scaleFootprint?: boolean;
    /** Fit an upright building over its whole base; also reserves at least the scaled base's circumcircle. */
    grounding?: GroundingOptions;
    /** How far it spreads overhead (a crown), for what is kept clear of view; the footprint when absent. */
    canopy?: number;
    /** Upright, or leaning with the ground. */
    attach?: 'upright' | 'align';
    /** The least the ground may face up for it to stand (0 to 1). */
    minUp?: number;
    /** How deep in water it may stand (reeds); 0 keeps it on dry ground. */
    waterDepth?: number;
    /** The chance it is placed at all, for a member that may be left out. */
    chance?: number;
    /** Tags a zone may keep it out by, beside its recipe's. */
    tags?: readonly string[];
    /**
     * Decoration's far version past its layer's `lodDistance`: two crossed cards (or a tent, for a conifer) showing this rectangle of its
     * texture. Absent, it is drawn whole out to `drawDistance`.
     */
    far?: {
        u0: number;
        v0: number;
        u1: number;
        v1: number;
        tent?: boolean;
    };
}
interface Recipe {
    id: string;
    /** Bumped when the recipe changes what it places: part of every placement's id. */
    version: number;
    tags?: readonly string[];
    anchor: RecipeMember;
    members?: readonly RecipeMember[];
}
interface PlacementLayer {
    id: string;
    /** Bumped when the layer's placement changes: part of every placement's id. */
    version?: number;
    /** The distance between candidates: about the distance between groups where the layer is full. */
    spacing: number;
    /** How far from the streaming sources the layer is published, and the side of its chunks. */
    drawDistance: number;
    /** Past this, decoration that has a far version is drawn as it; the layer's draw distance when absent. */
    lodDistance?: number;
    chunkSize?: number;
    /**
     * How much further apart the far versions of this layer's plants are planned than the layer's `spacing` (default 1): a plant kind that keeps a quarter
     * of its plants far off is planned at 2, which is a quarter of the candidates to work out instead of all of them and three in four thrown away.
     */
    farSpacing?: number;
    /** Whether later layers keep clear of its footprints (default true). */
    occupies?: boolean;
}
/** A game's rules for laying out a world. */
interface WorldRules {
    id: string;
    /** The versions it can still make; a world names one. */
    versions: readonly number[];
    biomes: readonly BiomeDef[];
    recipes: readonly Recipe[];
    /** The kinds of plant the recipes' members name. */
    plants?: Readonly<Record<string, PlantKind>>;
    /** In order: each keeps clear of the layers before it. */
    layers: readonly PlacementLayer[];
    noise?: Partial<Record<string, NoiseField>>;
    fields?: Record<string, FieldFn>;
}
/**
 * Makes `rules` available to every WorldGen that names them; a second set under the same id replaces the first. A WorldGen waiting
 * for its rules (a script registers them after the scene loaded) is laid out once they are here.
 */
declare function registerWorldRules(rules: WorldRules): void;
declare function worldRules(id: string): WorldRules | undefined;
/** The weight of a soft band at `v`. */
declare function bandWeight(c: BiomeCondition, v: number): number;

/**
 * @file    plan.ts
 * @brief   Where everything in a world stands: biomes from the fields, groups from the recipes, layer by layer, the same whatever is
 *          asked first.
 *
 * @details Every answer is a function of the world position, the seed and the rules, so a chunk placed before its neighbour and one
 *          placed after it agree, and a server and a client agree.
 *
 *            - Each layer has one candidate a cell of a grid `spacing` apart, jittered, with a priority drawn for it. A candidate takes
 *              a biome by the weights there (so a border mixes), a recipe of that biome by its density, and must have ground, not be
 *              too steep or under water, not be kept out by a zone, and keep clear of the footprints of the layers before it.
 *            - Of two candidates of a layer whose groups would overlap, the one with the higher priority stands. Each candidate looks
 *              only at its neighbours, so nothing depends on the order chunks are made in.
 *            - A group's members are placed round its anchor and checked the same way; a member that cannot stand is left out.
 *            - A group belongs to the chunk its anchor stands in, members and all, so a group across a chunk's edge is neither cut nor
 *              placed twice.
 *            - Ids are made of the layer, the grid cell, the recipe and the member, with their versions: never a position in a list.
 */

/** One thing placed. */
interface Placement {
    /** Stable across loads, load orders and rule additions: what a save records. */
    id: string;
    /** The group it belongs to (its anchor's group). */
    group: string;
    layer: string;
    recipe: string;
    recipeVersion: number;
    member: string;
    biome: string;
    /** The highest-priority zone it stands in, if any. */
    zone: string | null;
    x: number;
    y: number;
    z: number;
    yaw: number;
    scale: number;
    /** The ground's normal under it, which an aligned one leans with. */
    normal: [number, number, number];
    /** Which way is up where it stands, on a round world (where it is not +Y); an upright one stands along it. */
    up?: [number, number, number];
    attach: 'upright' | 'align';
    mesh: number;
    material: number;
    /** The kind of plant it is, by its name in the rules' `plants`, or null for a mesh. */
    plant: string | null;
    interactive: string | null;
    footprint: number;
    canopy: number;
    /** Full-footprint measurements when the recipe asks for ground fitting. */
    grounding?: GroundFit;
    /** The far version it is drawn as past its layer's lodDistance, when its recipe gives one. */
    far: RecipeMember['far'] | null;
}
/** Why a candidate or a member did not stand. */
type Rejection = 'noBiome' | 'density' | 'noGround' | 'slope' | 'water' | 'relief' | 'zone' | 'occupied' | 'conflict';
interface Group {
    id: string;
    layer: string;
    x: number;
    z: number;
    /** How far its members reach from its anchor, footprints included. */
    radius: number;
    priority: number;
    anchor: Placement;
    members: Placement[];
}
/** One world's plan. */
declare class WorldPlan {
    readonly rules: WorldRules;
    readonly env: Environment;
    readonly zones: Zones;
    readonly seed: number;
    readonly world: string;
    private readonly worldHash_;
    private readonly recipes_;
    private readonly layers_;
    private readonly viable_;
    private readonly groups_;
    constructor(rules: WorldRules, env: Environment, zones: Zones, seed: number, world: string);
    /** Forgets what was worked out: the ground, the water or the zones changed. */
    invalidate(): void;
    /** The layer's index by id, or -1. */
    layerIndex(id: string): number;
    /** The weight of every biome that holds at (x, z), summing to 1 (empty where none does), heaviest first. */
    biomeWeights(x: number, z: number): {
        biome: string;
        weight: number;
    }[];
    /** The biome that holds most at (x, z), or null. */
    biomeAt(x: number, z: number): string | null;
    /** The ground's paint at (x, z): `base` (grass, dirt, snow, rock) pulled toward each biome's paint by its weight and strength. */
    paint(x: number, z: number, base: readonly number[]): number[];
    /** The groups of layer `layer` whose anchors stand in [x0, x1) by [z0, z1). */
    groupsIn(layer: string, x0: number, z0: number, x1: number, z1: number): Group[];
    /** Every placement of the given layers (all, by default) whose group's anchor stands in the square. */
    placementsIn(x0: number, z0: number, x1: number, z1: number, layers?: readonly string[]): Placement[];
    /** How many candidates of a layer in the square stood, and why the rest did not. */
    stats(layer: string, x0: number, z0: number, x1: number, z1: number): Record<'placed' | Rejection, number>;
    /** Everything that decided what stands at (x, z): the fields, the biomes, the zones, and each layer's candidate in that cell. */
    explain(x: number, z: number): {
        fields: FieldValues;
        biomes: {
            biome: string;
            weight: number;
        }[];
        zones: {
            id: string;
            kind: string;
            weight: number;
        }[];
        layers: {
            layer: string;
            cell: [number, number];
            group: string | null;
            rejected: Rejection | null;
            detail?: string;
        }[];
    };
    /** The group of layer `li` in grid cell (gx, gz), or why there is none. */
    group(li: number, gx: number, gz: number): Group | Rejection;
    private makeGroup;
    private place;
    /** Why a member cannot stand on the place whose fields are `f`, or null if it can. */
    private standing;
    private tagsOf;
    /** The candidate of layer `li` in cell (gx, gz) if it may stand before its own layer's overlaps are settled, or why not. */
    private viable;
    private makeViable;
    /** The id of a placement of an earlier layer whose footprint a footprint of `radius` at (x, z) would overlap, or null. */
    private occupied;
    private biomeWeight;
}

/**
 * @file    diffs.ts
 * @brief   What the players changed in a generated world, kept apart from it: what was taken away and what was moved.
 *
 * @details The world is made again from its rules every time a chunk comes near; what a player did is laid over it before anything is
 *          shown, so a felled tree stays felled after its chunk is let go and made again, and after a save is read back. Changes are
 *          kept by placement id, which does not change with the order things are made in or with rules added later. What a player
 *          builds is not a change to the generated world: it is the game's own, and the zone it reserves keeps generation out of it.
 */
/** Where and how a placement was moved: any of its position, its turn and its scale. */
interface PlacementChange {
    x?: number;
    y?: number;
    z?: number;
    yaw?: number;
    scale?: number;
}
/** A world's changes, as a save stores them. */
interface PlacementDiffsData {
    version: 1;
    removed: string[];
    changed: Record<string, PlacementChange>;
}
declare class PlacementDiffs {
    private readonly removed_;
    private readonly changed_;
    private readonly listeners_;
    revision: number;
    /** Told the id of every placement that changed, so only its chunk is made again. */
    onChange: ((id: string) => void) | null;
    /** Listens alongside other consumers; the returned function stops listening. */
    subscribe(listener: NonNullable<PlacementDiffs['onChange']>): () => void;
    private notify;
    /** Takes a placement out of the world for good (felled, mined, picked up). */
    remove(id: string): void;
    /** Puts a removed placement back (it grew again). */
    restore(id: string): void;
    /** Moves, turns or scales a placement. */
    change(id: string, change: PlacementChange): void;
    isRemoved(id: string): boolean;
    changeOf(id: string): PlacementChange | undefined;
    toJSON(): PlacementDiffsData;
    /** Replaces every change with a save's. */
    load(data: PlacementDiffsData): void;
    private changed;
}

/** The fields of the `WorldGen` component. @experimental */
interface WorldGenData {
    /** The rules the world is laid out by, as the game registered them, and the version of them the world was made with. */
    rules: string;
    version: number;
    /** The world (a planet, a level) as the game names it, and its seed. */
    world: string;
    seed: number;
    /** Whether the biomes paint the terrain. */
    paintGround: boolean;
    /** {@link WorldSurface}: a plane (a Terrain of x and z), or a planet (the entity is also a `Planet`, and the world is laid out over its six faces). */
    surface: number;
    /** The height of the sea above a planet's radius: a point lower than this is under water. */
    seaLevel: number;
}
/** What a world is laid out on. */
declare const WorldSurface: {
    readonly Plane: 0;
    readonly Planet: 1;
};
/**
 * A generated world: the rules it is laid out by. Presence is the opt-in; what the rules place is published as its children.
 *
 * @experimental
 */
declare const WorldGen: ComponentDef<WorldGenData>;
/** How a `WorldZone` is shaped. */
declare const ZoneShapeKind: {
    readonly Circle: 0;
    readonly Box: 1;
};
/** The fields of the `WorldZone` component. @experimental */
interface WorldZoneData {
    /** What the zone is for (home, road, landing, building, resource, view): the game's own words. */
    kind: string;
    shape: number;
    radius: number;
    sizeX: number;
    sizeZ: number;
    /** Over how many world units past its outline it fades out. */
    falloff: number;
    priority: number;
    /** The tags of what it keeps out, separated by commas; `*` keeps out everything. */
    excludes: string;
    /** A biome it holds over its area; empty holds none. */
    biome: string;
    /** Whether it levels the terrain under it to the ground's height at its centre. */
    flatten: boolean;
}
/**
 * An area of a generated world planned by hand: kept clear, held to a biome, or both. It follows its entity's position and its turn
 * about the vertical.
 *
 * @experimental
 */
declare const WorldZone: ComponentDef<WorldZoneData>;
/** The fields of the `PlacedObject` component. @experimental */
interface PlacedObjectData {
    /** The placement's id: what a save records when the game changes it. */
    id: string;
    /** What the game interacts with it as. */
    kind: string;
}
/**
 * Marks an entity a generated world placed for the game to interact with. Written by the engine; a scene does not author it.
 *
 * @experimental
 */
declare const PlacedObject: ComponentDef<PlacedObjectData>;
/** Where a WorldGen stands: being made, ready, or failed (with why); and each of its layers' chunks. */
interface WorldGenStatus {
    state: 'loading' | 'ready' | 'failed';
    reason?: string;
    layers: Record<string, ChunkLayerStatus>;
}
interface BuiltWorld {
    assets: AssetLease<AssetScope>;
    retired: boolean;
    meshData: Map<number, MeshData | null | Promise<MeshData | null>>;
    signature: string;
    data: WorldGenData;
    rules: WorldRules | null;
    plan: WorldPlan | null;
    /** The same plan with the sparser spacing the layers that have a `farSpacing` are planned at for their far versions; null when none has one. */
    farPlan: WorldPlan | null;
    failure: string | null;
    /** The terrain's and the water's revisions the plan was read from. */
    ground: string;
    /** Subscriptions and terrain effects owned by this generation, not by its retained chunks. */
    listeners: (() => void)[];
    levelled: Set<string>;
    paint: Terrains['paint_'];
    /** The maker of the ground's pages this world handed its terrain, and the plan it was made for. */
    pager?: Terrains['pager_'];
    pagerKey?: string;
    /** Zones that level their ground and wait for it to be known. */
    levelling: Set<string>;
    /** The rules' plants as kinds, and their parts once the assets are in hand (null while they are being loaded, or when the rules have no plants). */
    plants: PlantSet | null;
    plantsReady: ReadyKinds | null;
    /** A planet's six faces, each laid out as a plane (null for a world on a plane). */
    faces: FaceUnit[] | null;
    /** A world on a planet whose plan waits for the planet to say what it is (its ground and layers), which it does a frame after it is made. */
    waitingForPlanet: boolean;
}
/** One face of a planet's world: its plane, its plan (and the sparser one for far versions) and the zones over it. */
interface FaceUnit {
    face: PlanetFace;
    plan: WorldPlan;
    farPlan: WorldPlan | null;
    zones: FaceZones;
}
/** Run-time access to the generated worlds. */
declare class WorldGens {
    /** @internal */ readonly built_: Map<number, BuiltWorld>;
    /** @internal */ app_: App | null;
    private readonly zones_;
    private readonly diffs_;
    /** @internal Authored projections belong to a named world, shared by all of its generators. */
    readonly authored_: Map<string, Set<string>>;
    /** @internal A flatten modifier remains until its last live plan lets it go. */
    readonly levelled_: Map<string, {
        signature: string;
        owners: Set<BuiltWorld>;
    }>;
    /** @internal The interactive entity of each placement id published now. */
    readonly objects_: Map<string, number>;
    /** The zones of a world (by its name), which a game adds to as it plans and builds. Shared by every WorldGen of that world. */
    zones(world?: string): Zones;
    /** The changes made to a world (by its name), which a save stores and reads back. */
    diffs(world?: string): PlacementDiffs;
    /** A WorldGen's plan, or the first one's: what stands where, asked of anywhere, loaded or not. Null until it is made or if it failed. */
    plan(entity?: Entity): WorldPlan | null;
    /** The interactive entity standing for placement `id`, or null where its chunk is not published or the placement is removed. */
    objectOf(id: string): Entity | null;
    status(entity: Entity): WorldGenStatus | null;
    private first_;
}
/** The resource the plugin installs. @experimental */
declare const WorldGenRes: ResourceDef<WorldGens>;
declare class WorldGenPlugin implements Plugin {
    name: string;
    /** Stops listening for edited rules files. */
    private watching_;
    build(app: App): void;
    cleanup(app?: App): void;
    /** A WorldGen's rules and plan, or why it has none. */
    private make;
    /** Takes a WorldGen's rules, once they are known: checks the version, and makes the plan (loading what the recipes name first). */
    private adopt;
    /** Loads the meshes and materials `refs` name, and gives back the rules with each path replaced by its handle. */
    private resolve;
    /** Makes a WorldGen's plan from its rules, and what keeps it current. */
    private plan;
    /**
     * Makes a planet's plans: one for each face of the cube, each on the face's plane. The plan of a face is the same plan as a plane's, read from the
     * planet's ground by direction and from noise in three dimensions, so a field wanders over an edge between two faces without a seam; a direction is
     * planned by the face it falls on, and the faces' plans paint the planet's ground by the same biomes that place what stands on it.
     */
    private planPlanet;
    /** Levels a zone's ground, or (the ground under its centre not known yet) keeps it to level once it is. */
    private level;
    private unlevel;
    /** The ground's paint by a plan's biomes. */
    private painter;
    /** Where the group of placement `id` is anchored, from the layer and grid cell its id names. */
    private anchorOf;
    /** Puts the authored `WorldZone`s into their world's zones. */
    private syncZones;
    private syncWorldZones;
    /** Hands each of the rules' layers to the chunks, made from the plan: of the one plane, or of each face of a planet. */
    private publish;
    /**
     * What lays a plane's world out on workers, when the ground and the water can be handed to them as data (a terrain of a field or of noise, with nothing laid over it;
     * water that is baked): the chunks are spread over the workers, and a worker is sent the plan the first time it is asked a square of it. Null when they cannot, and
     * the world is laid out here.
     */
    private awayOnPlane;
    /** The name of a face's plan for workers: what it was made from, so a plan made from other rules, zones or sea is a new one. */
    private planKey;
    /** What a worker makes a face's plan from: plain data, the rules without what is code (the fields a game registered) or what only the main thread reads (the plants' kinds). */
    private planSpec;
    /** Asks the pool for a square of a face's plan: the plan is sent with the first question a worker is asked of it, and named after that. */
    private awayOf;
    /** One unit's layers as chunks: nearest first within the frame's budget, with the far versions of its plants a layer of their own. */
    private publishUnit;
    /** Pending and published chunks both borrow the generation they were built from. */
    private ownChunk;
    /** What one chunk of a layer places: its decoration merged by mesh, and its interactive placements, with the changes laid over. */
    private chunk;
    /** Puts a chunk in the world: a mesh a kind of decoration, an entity an interactive placement. */
    private place;
    private unplace;
    private retire;
    private drop;
    private sweep;
}
declare const worldGenPlugin: Plugin;

export { Environment, FaceZones, PlacedObject, PlacementDiffs, PlanetFace, ProceduralChunks, ProceduralChunksRes, WorldGen, WorldGenPlugin, WorldGenRes, WorldGens, WorldPlan, WorldSurface, WorldZone, ZoneShapeKind, Zones, bandWeight, chunksOf, faceHalf, faceUnit, fbm, fbm3, fitGroundFootprint, hash01, hashString, planetFaces, registerWorldRules, streamingSourcesOf, validateGrounding, worldGenPlugin, worldRules, zoneBounds, zoneDistance, zoneWeight };
export type { BiomeCondition, BiomeDef, BiomeRecipe, ChunkLayer, ChunkLayerStatus, ChunkSource, ChunkState, EnvironmentInputs, FieldFn, FieldValues, GroundFit, GroundFitResult, GroundingOptions, Group, NoiseField, PlacedObjectData, Placement, PlacementChange, PlacementDiffsData, PlacementLayer, PlaneFrame, Recipe, RecipeMember, Rejection, WorldGenData, WorldGenStatus, WorldRules, WorldZoneData, ZoneDef, ZoneShape };
