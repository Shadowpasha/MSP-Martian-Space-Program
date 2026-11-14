import { Color, Entity } from './wasm.js';
import { ResourceDef } from './resource.js';
import { ComponentDef, Plugin, App } from './app.js';

/** What a walker can cross. @experimental */
interface ReachOptions {
    /** The side of a cell of the search, in world units. Smaller finds narrower passes and costs more. Default 4. */
    step?: number;
    /** The steepest ground a walker climbs, in degrees from flat. Default 35. */
    maxSlope?: number;
    /** A place the walker may not stand, besides ground too steep: water deeper than it wades, a zone kept clear. */
    blocked?: (x: number, z: number) => boolean;
    /** How many cells the search may open before it gives up (and says so). Default 200 000. */
    maxCells?: number;
    /** How far past the box round both ends the search may wander, as a share of the distance between them. Default 1. */
    detour?: number;
}
/** The way from one place to another, or why there is none. @experimental */
interface ReachResult {
    /**
     * `reached`: a way was found. `unreachable`: every way out of the start within the search's bounds was walked, and none came to
     * the end. `exhausted`: the search ran out of cells before it knew. `noGround`: one end stands where no ground is known, too steep
     * or refused.
     */
    state: 'reached' | 'unreachable' | 'exhausted' | 'noGround';
    /** The way, from the start to the end (or to the nearest place reached, when it was not), on the ground. */
    path: {
        x: number;
        y: number;
        z: number;
    }[];
    /** How long the way is, along the ground. */
    length: number;
    /** How many cells were opened. */
    cells: number;
}
/** The ground a search reads. */
interface ReachGround {
    heightAt(x: number, z: number): number | null;
}
/**
 * Searches the ground for a way from (fromX, fromZ) to (toX, toZ) that a walker held to `maxSlope` can take.
 * @experimental
 */
declare function findGroundPath(ground: ReachGround, fromX: number, fromZ: number, toX: number, toZ: number, options?: ReachOptions): ReachResult;

/**
 * @file    heightfield.ts
 * @brief   The ground as numbers: a grid of heights, read by a heightmap image or made by noise.
 *
 * @details Heights are stored as 0..1 and scaled by the terrain's own height, so the same field
 *          serves a terrain of any size and a rescale never touches the data. Everything here is
 *          pure and has no engine in it, which is what lets the mesh builder and the tests stand on it.
 */
/** A rectangular grid of heights, 0 to 1, row-major with z as the row. */
interface Heightfield {
    readonly width: number;
    readonly height: number;
    readonly data: Float32Array;
}
/**
 * How a heightmap image holds its heights. The file says how deep its channels are; this says what they mean, so an image is never
 * read one way or another by what its pixels happen to hold.
 * @experimental
 */
declare const HeightmapFormat: {
    /** The grey (or red) channel is the height, at the depth the file has: 16 bits from a 16-bit PNG, 8 (256 steps) from any other. */
    readonly Grey: 0;
    /** Sixteen bits across two 8-bit channels: red is the high byte, green the low one. */
    readonly RedGreen16: 1;
};
/**
 * A heightfield from an RGBA image read as data, 0 at its lowest and 1 at its highest, by `format`. `wide` is the first channel at 16
 * bits, for an image whose file holds 16 bits a channel.
 */
declare function heightfieldFromPixels(width: number, height: number, pixels: ArrayLike<number>, format?: number, wide?: ArrayLike<number>): Heightfield;
/** What {@link proceduralHeightfield} is made from. */
interface ProceduralParams {
    /** Samples along each side. */
    resolution: number;
    seed: number;
    /** How many times the biggest hill repeats across the terrain. */
    frequency: number;
    octaves: number;
    /** What each octave keeps of the height of the one before it: lower is smoother. */
    persistence: number;
    /** 0 is rolling hills; 1 is sharp ridges, the way eroded mountains look. */
    ridged: number;
    /** How far the noise is pushed about by noise of its own before it is read, 0 to 1: bent ridges and winding valleys instead of round hills. */
    warp?: number;
}
/** Fractal noise as a heightfield, scaled to span 0 to 1 so the terrain's height is its true range. */
declare function proceduralHeightfield(p: ProceduralParams): Heightfield;
/** The height at (u, v), each 0 to 1 across the field, bilinear between the four samples it falls among. */
declare function sampleHeight(field: Heightfield, u: number, v: number): number;
/** The unit normal of the ground at (u, v), from the heights a texel either side of it, in world units. */
declare function terrainNormal(field: Heightfield, u: number, v: number, sizeX: number, sizeZ: number, heightScale: number): [number, number, number];
/** What {@link erodeHeightfield} wears the ground with. */
interface ErosionParams {
    /** How much rain falls, 0 to 1: at 1, a drop for every sample of the field. */
    amount: number;
    seed: number;
    /** The field's world size along x and z, and its world height: erosion works in the ground's own proportions. */
    sizeX: number;
    sizeZ: number;
    height: number;
}
/** The ground after the rain, and where the water ran: `flow` is 0 to 1 per sample, the share of the busiest channel's water that passed. */
interface Eroded {
    field: Heightfield;
    flow: Float32Array;
}
/**
 * Hydraulic erosion: drops of rain fall at random over the field, each runs downhill carrying what it can for its speed and the water in it,
 * cuts the ground where it carries less than it could, lays it down where it carries more or slows (in a hollow, on a flat, as it dries),
 * and evaporates as it goes. What is left has gullies down the slopes, sharper ridges between them and silt in the valleys, and where the water
 * ran is kept as `flow`. The same seed wears the same ground everywhere.
 */
declare function erodeHeightfield(field: Heightfield, p: ErosionParams): Eroded;
/** {@link erodeHeightfield} as a job that yields its progress (0 to 1) every few thousand drops, for spreading over frames. */
declare function erosionJob(field: Heightfield, p: ErosionParams): Generator<number, Eroded, void>;

/** The ground a terrain draws, as the pages and the CPU read it. */
interface TerrainSource {
    /** Whether the ground goes on for ever (no edge to clip, no area to bake). */
    readonly infinite: boolean;
    /** The area the ground covers, [minX, minZ, maxX, maxZ] in the terrain's space; null for an infinite one. */
    readonly bounds: readonly [number, number, number, number] | null;
    /** The least and the most the height can be: what the pages encode their heights over. */
    readonly minHeight: number;
    readonly maxHeight: number;
    /** The height at (x, z), or null off the area (or where a provider has not answered yet). */
    height(x: number, z: number): number | null;
    /** The ground's unit normal at (x, z), or null where the height is not known. */
    normal(x: number, z: number): [number, number, number] | null;
    /** The weights of the layers (up to eight; the first four by default grass, dirt, snow, rock) at (x, z), where the ground there is `h` high and faces `ny` up. */
    paint(x: number, z: number, h: number, ny: number): LayerWeights;
    /**
     * The ground over a grid of `count` by `count` samples `spacing` apart from (x0, z0), when the source samples whole regions (a
     * provider, which may answer later); without it the pages read `height` and `paint` point by point.
     */
    region?(x0: number, z0: number, spacing: number, count: number): TerrainRegionSamples | Promise<TerrainRegionSamples>;
}
/** A region's samples: heights, and the weights of layers 1 to 4 (`paint`) and 5 to 8 (`paint2`), four a sample. */
interface TerrainRegionSamples {
    heights: Float32Array;
    paint?: Float32Array;
    paint2?: Float32Array;
}
/** The weights of a terrain's layers at a point, in order: four or eight of them (a missing one weighs nothing). */
type LayerWeights = readonly number[];
/** The pixels of a splatmap, as the terrain read them. */
interface Splat {
    width: number;
    height: number;
    pixels: Uint8Array;
}
/** What an area's ground is made of, as plain data a worker can rebuild it from. */
interface FieldSourceData {
    field: Heightfield;
    params: Pick<TerrainData, 'sizeX' | 'sizeZ' | 'height' | 'rockSlope' | 'dirtHeight' | 'snowHeight'>;
    splat: Splat | null;
    splat2: Splat | null;
    flow: Float32Array | null;
    range: [number, number];
}
/**
 * An area's ground: a field of heights (0 to 1 over `range`, from 0 to `height` by default), centred on the terrain, with its splatmap
 * and where its rain ran.
 */
declare class FieldSource implements TerrainSource {
    readonly field: Heightfield;
    private readonly data;
    private splat;
    private readonly flow;
    private splat2;
    readonly infinite = false;
    readonly bounds: readonly [number, number, number, number];
    readonly minHeight: number;
    readonly maxHeight: number;
    constructor(field: Heightfield, data: Pick<TerrainData, 'sizeX' | 'sizeZ' | 'height' | 'rockSlope' | 'dirtHeight' | 'snowHeight'>, splat: Splat | null, flow: Float32Array | null, range?: readonly [number, number], splat2?: Splat | null);
    /**
     * The splatmaps a brush paints into, made where the ground had none: the first from the paint the ground has now (by height and
     * slope), the second (layers 5 to 8) empty, and only when `second` says it is wanted. They are as fine as the field, to 1024 a side.
     */
    ensureSplats(second: boolean): {
        a: Splat;
        b: Splat | null;
    };
    /** The splatmaps now, null where the ground has none. */
    splats(): {
        a: Splat | null;
        b: Splat | null;
    };
    private get span();
    /** The ground as data (its arrays are shared, not copied): `FieldSource.fromData` makes the same ground from it. */
    toData(): FieldSourceData;
    static fromData(d: FieldSourceData): FieldSource;
    height(x: number, z: number): number | null;
    /** The ground's normal at (x, z), or null off the area. */
    normal(x: number, z: number): [number, number, number] | null;
    paint(x: number, z: number, h: number, ny: number): LayerWeights;
}
/** What shapes an infinite ground: the noise's seed and scale, and how worn and how ridged it is. */
type NoiseParams = Pick<TerrainData, 'seed' | 'frequency' | 'octaves' | 'persistence' | 'ridged' | 'warp' | 'erosion' | 'sizeX' | 'height' | 'rockSlope' | 'dirtHeight' | 'snowHeight'>;
/**
 * Ground that goes on for ever: fractal noise read at any point, `frequency` hills to every `sizeX` world units, `height` tall at most.
 * `erosion` damps each octave by how steep the ones under it already are, which is what rain does to real ground.
 */
declare class NoiseSource implements TerrainSource {
    private readonly p;
    readonly infinite = true;
    readonly bounds: null;
    readonly minHeight = 0;
    readonly maxHeight: number;
    constructor(p: NoiseParams);
    /** The ground as data: `NoiseSource.fromData` makes the same ground from it. */
    toData(): NoiseParams;
    static fromData(p: NoiseParams): NoiseSource;
    height(x: number, z: number): number;
    /** The normal at (x, z), from the noise's own slope. */
    normal(x: number, z: number): [number, number, number];
    paint(_x: number, _z: number, h: number, ny: number): [number, number, number, number];
    /** The height (0 to 1) at (x, z) and its slope along x and z, per world unit. */
    sample(x: number, z: number): [number, number, number];
}
/** Value noise at (x, y), 0 to 1, and its derivatives along x and y. */
declare function noised(x: number, y: number, seed: number): [number, number, number];
/**
 * A change made to the ground over part of the world (a building's plot levelled, a riverbed cut): in world space, a height in and a
 * height out. Modifiers are applied in the order they were set, inside their bounds only.
 */
interface TerrainModifier {
    readonly id: string;
    /** The world square it can change, [minX, minZ, maxX, maxZ], its edge included. */
    readonly bounds: readonly [number, number, number, number];
    /** The world height at world (x, z), given the height the ground has there. */
    apply(x: number, z: number, h: number): number;
}
/** A source with the modifiers laid over it: what the pages, the queries and collision all read. */
declare class ModifiedSource implements TerrainSource {
    readonly base: TerrainSource;
    private readonly modifiers;
    private readonly step;
    readonly infinite: boolean;
    readonly bounds: TerrainSource['bounds'];
    readonly minHeight: number;
    readonly maxHeight: number;
    /** The terrain's world position: its space is this far from the world's. Kept current by the terrain. */
    origin: {
        x: number;
        y: number;
        z: number;
    };
    constructor(base: TerrainSource, modifiers: () => Iterable<TerrainModifier>, origin: {
        x: number;
        y: number;
        z: number;
    }, step: number);
    height(x: number, z: number): number | null;
    normal(x: number, z: number): [number, number, number] | null;
    paint(x: number, z: number, h: number, ny: number): LayerWeights;
    get region(): TerrainSource['region'];
    /** Whether any modifier can change something in the square [x0, x1] by [z0, z1] of the terrain's space. */
    touched(x0: number, z0: number, x1: number, z1: number): boolean;
    private modify;
}
/**
 * Levels the ground to world height `height` over a circle or a turned rectangle, blending back to the ground over `falloff` world
 * units past its outline: a plot built on, a landing pad, a road's bed.
 */
declare function flattenModifier(id: string, shape: {
    type: 'circle';
    x: number;
    z: number;
    radius: number;
} | {
    type: 'rect';
    x: number;
    z: number;
    halfX: number;
    halfZ: number;
    yaw?: number;
}, height: number, falloff: number): TerrainModifier;

/**
 * @file    sculpt.ts
 * @brief   Brush strokes on an area's ground: raise, lower, smooth and flatten its heights, and paint its layers.
 *
 * @details Pure arithmetic over the arrays the ground is made of (a heightfield, and up to two splatmaps), so an editor tool and a
 *          test drive the same code. Positions are in the terrain's own space (its entity at the origin); a brush reaches `radius`
 *          from its centre, at full strength over the inner `1 - falloff` of that and easing to nothing at the edge.
 *          Heights are the field's 0 to 1, so an amount in world units is divided by the span the field is read over.
 */

/** What a brush does to heights. @experimental */
declare const SculptMode: {
    readonly Raise: 0;
    readonly Lower: 1;
    readonly Smooth: 2;
    readonly Flatten: 3;
};
/** A brush at (x, z) in the terrain's space. */
interface Brush {
    x: number;
    z: number;
    radius: number;
    /** 0 to 1: how much of the brush's edge eases away. 0 is a hard disc, 1 a cone. */
    falloff: number;
}
/** The texels a stroke changed, both corners included. */
interface Dirty {
    i0: number;
    j0: number;
    i1: number;
    j1: number;
}
/** The brush's weight at `d` from its centre, 1 over its core, easing (smoothstep) to 0 at its edge. */
declare function brushWeight(d: number, radius: number, falloff: number): number;
/** The union of two dirty spans, either of which may be absent. */
declare function unionDirty(a: Dirty | null, b: Dirty | null): Dirty | null;
/** What one dab does. */
interface SculptDab {
    mode: number;
    brush: Brush;
    /**
     * Raise and lower: how far the brush's core moves the ground, in the field's 0 to 1. Smooth and flatten: how much of the way to
     * the average or to `target` it goes, 0 to 1.
     */
    amount: number;
    /** Flatten's height, in the field's 0 to 1. */
    target?: number;
}
/**
 * Applies one dab to `field` and says which texels it touched (null when the brush is off the area). Heights stay between 0 and 1.
 */
declare function sculptField(field: Heightfield, sizeX: number, sizeZ: number, dab: SculptDab): Dirty | null;
/** What one paint dab does. */
interface PaintDab {
    /** The layer, 0 to 7: layers 1 to 4 live in the first splatmap, 5 to 8 in the second. */
    layer: number;
    brush: Brush;
    /** 0 to 1: how far toward the layer being all there is a texel at the brush's core goes. */
    strength: number;
    /** Takes the layer away instead of laying it. */
    erase?: boolean;
}
/**
 * Paints one dab into the splatmaps (`b` null paints layers 1 to 4 only) and says which texels it touched. The two maps must be the
 * same size. The weights of a texel always add to one: laying a layer takes from the others in proportion to what they had, and
 * erasing one gives its share back to them (to layer 1 where there is nothing else).
 */
declare function paintSplat(a: Splat, b: Splat | null, sizeX: number, sizeZ: number, dab: PaintDab): Dirty | null;
/** A height field as the red-and-green 16-bit image a heightmap is saved as (red the high byte): `RGBA` pixels, opaque. */
declare function encodeHeightmap(field: Heightfield): Uint8Array;

/**
 * @file    groundEdit.ts
 * @brief   A handle on one area terrain's ground that a tool can change: strokes in, the drawn ground, its queries and its collision follow.
 *
 * @details The ground an area draws is a field of heights and up to two splatmaps (source.ts). A handle changes those arrays in place with
 *          the brushes of sculpt.ts and has the terrain make again only the pages the stroke reached. A stroke is bracketed by
 *          {@link GroundEdit.begin} and {@link GroundEdit.end}, and `end` returns what changed as a {@link GroundPatch} that
 *          {@link GroundEdit.apply} lays down either way, which is what an editor's undo is made of. Nothing here writes a file: the
 *          arrays are what {@link GroundEdit.heightmapPixels} and {@link GroundEdit.splatmapPixels} hand over to be saved.
 */

interface Tile$1<T> {
    rect: Dirty;
    before: T;
    after: T;
}
/** @internal What one stroke changed in one array: the 32-by-32 tiles it touched, as they were and as they are. */
interface Piece<T> {
    rect: Dirty;
    width: number;
    tiles: Tile$1<T>[];
}
/** What one stroke changed. @experimental */
interface GroundPatch {
    heights: Piece<Float32Array> | null;
    splat: Piece<Uint8Array> | null;
    splat2: Piece<Uint8Array> | null;
}
/** What a handle needs of its terrain. @internal */
interface GroundHost {
    /** Makes again the pages and the collision of the world square [minX, minZ, maxX, maxZ]. */
    remake(b: readonly [number, number, number, number]): void;
}
/** One area terrain's ground, open to brushes. @experimental */
declare class GroundEdit {
    private readonly host;
    private readonly source;
    private readonly modified;
    private readonly sizeX;
    private readonly sizeZ;
    private open_;
    /** @internal */
    constructor(host: GroundHost, source: FieldSource, modified: ModifiedSource, sizeX: number, sizeZ: number);
    get field(): Heightfield;
    get samplesX(): number;
    get samplesZ(): number;
    /** The world height the field's 0 sits at and its 1 reaches. */
    get minHeight(): number;
    get maxHeight(): number;
    get area(): {
        sizeX: number;
        sizeZ: number;
    };
    /** The terrain's world position on the ground plane: the brush's world (x, z) is this far from the terrain's own. */
    get origin(): {
        x: number;
        z: number;
    };
    private get span();
    /** The height of the ground (the brushes' own, without modifiers laid over it) at world (x, z), or null off the area. */
    heightAt(x: number, z: number): number | null;
    begin(): void;
    /**
     * One dab of height. `amount` is in world units for raise and lower (how far the brush's core moves the ground) and 0 to 1 for smooth
     * and flatten (how much of the way they go); `target` is flatten's world height. At the world position (x, z).
     */
    sculpt(mode: number, x: number, z: number, radius: number, falloff: number, amount: number, target?: number): void;
    /** One dab of paint at the world position (x, z). Layers 5 to 8 make the second splatmap if there is none. */
    paint(layer: number, x: number, z: number, radius: number, falloff: number, strength: number, erase?: boolean): void;
    /** Ends the stroke and says what it changed, or null when it changed nothing. */
    end(): GroundPatch | null;
    /** Lays a patch's `before` or its `after` back over the ground. */
    apply(patch: GroundPatch, side: 'before' | 'after'): void;
    /** The heights as the image a heightmap is saved as: red and green 16 bits, `RGBA`, `field.width` by `field.height`. */
    heightmapPixels(): {
        width: number;
        height: number;
        pixels: Uint8Array;
    };
    /** The splatmaps as `RGBA` images to save, null where the ground has none. */
    splatmapPixels(): {
        a: Splat | null;
        b: Splat | null;
    };
    private remake;
}

/**
 * @file    quadtree.ts
 * @brief   Which squares of ground to draw, and how finely: a CDLOD quadtree round the eye.
 *
 * @details Every node is one square drawn with the same patch of `cells` by `cells`, so a node at level L has cells 2^L times the finest.
 *          Each level has a range: a node closer to the eye than the level below's range is split into its four children, so the
 *          ground is finest where it is near and coarsens with distance, level by level. The Terrain shader moves each vertex in the
 *          outer part of its level's range onto the grid of the level above (geomorphing), so where two levels meet their edges are the
 *          same line: no crack, no skirt, and nothing pops as the eye moves.
 */
/** One square of ground to draw: its level (0 the finest), its place in that level's grid, and its extent in the terrain's space. */
interface TerrainNode {
    level: number;
    ix: number;
    iz: number;
    x0: number;
    z0: number;
    size: number;
}
/** What the tree is cut by. */
interface QuadtreeParams {
    /** The side of a level-0 node, in world units. */
    leafSize: number;
    /** How many levels there are: the top one's nodes are `leafSize * 2^(levels - 1)` across. */
    levels: number;
    /** The distance within which level 0 is drawn; each level's is twice the one below's. */
    range0: number;
    /** The area to draw, [minX, minZ, maxX, maxZ]; null draws the top level's nodes round the eye out to its range (an infinite ground). */
    bounds: readonly [number, number, number, number] | null;
    /** The least and most height the ground has: the vertical extent every node's box is measured with. */
    minHeight: number;
    maxHeight: number;
}
/** The range of level `level`: where its nodes end and the next level's begin. */
declare function levelRange(p: Pick<QuadtreeParams, 'range0'>, level: number): number;
/**
 * The nodes to draw for an eye at (ex, ey, ez), coarse to fine. Every place in the area (or within the top range of the eye, for an
 * infinite ground) is covered by exactly one node.
 */
declare function selectNodes(p: QuadtreeParams, ex: number, ey: number, ez: number): TerrainNode[];
/** How far the eye is from a node's box (its square, from the least to the most height). */
declare function boxDistance(x0: number, z0: number, size: number, y0: number, y1: number, ex: number, ey: number, ez: number): number;
/** The node one level up that holds this one. */
declare function parentOf(n: TerrainNode, leafSize: number): TerrainNode;
/** A node's key, for the pages and the pool. */
declare function nodeKey(level: number, ix: number, iz: number): string;

/**
 * @file    pages.ts
 * @brief   The ground's height, slope and paint in pages: one per quadtree node, made from the source and kept in two atlas textures.
 *
 * @details A page is a node's square sampled `PAGE_TEXELS` times along each side (two samples to a cell of its patch), with one sample
 *          more past each edge so the slope at the edge is known and a filtered read there stays inside the page. Its three images:
 *            - heights: red and green the height over the source's range, high byte then low (read texel by texel and blended in the
 *              shader, as a filtered pair of bytes is no number); blue and alpha the normal's x and z (filtered);
 *            - paint and paint2: the weights of layers 1 to 4 and 5 to 8 (filtered).
 *          Pages are made as the tree asks for them, coarse ones first, within a time budget a frame, and the least recently drawn give
 *          their slot up when the atlas is full. A node whose page is not made yet is drawn by an ancestor's.
 */

/** Cells along a patch's side, and samples along a page's (two to a cell). */
declare const PATCH_CELLS = 32;
declare const PAGE_TEXELS: number;
/** A page's side in the atlas: its samples, the one on its far edge, and one past each edge. */
declare const PAGE_SIDE: number;
/** A page's place and what it found. */
interface Page {
    slot: number;
    /** The least and most height in it: the node's box. */
    min: number;
    max: number;
    /** When it was last drawn, for choosing which to give up. */
    used: number;
    /** The ground changed under it: it is still drawn, as it was, until a new image takes its slot. */
    stale?: boolean;
}
/** The pixels of one page. */
interface PageImage {
    heights: Uint8Array;
    paint: Uint8Array;
    paint2: Uint8Array;
    min: number;
    max: number;
}
/**
 * Samples a node's page from `source`: square (x0, z0) to (x0 + size, z0 + size) in the terrain's space. Heights are encoded over
 * the source's range. Off an area's edge the ground is its nearest edge's, so the pages there are whole. A source that samples regions
 * (a provider) is asked for the page's whole grid at once, and may answer later. `repaint`, given, has the last word on each sample's
 * paint (a world's biomes), from the paint the source gave it.
 */
declare function makePage(source: TerrainSource, x0: number, z0: number, size: number, repaint?: Repaint): PageImage | Promise<PageImage>;
/** The paint of a sample at (x, z) in the terrain's space, `h` high and facing `ny` up, from what it would otherwise be. */
type Repaint = (x: number, z: number, h: number, ny: number, w: LayerWeights) => LayerWeights;
/** Where the pages live: slots in a square atlas, given out and taken back by key. */
declare class PageTable {
    readonly atlasSize: number;
    readonly perRow: number;
    readonly capacity: number;
    private readonly pages_;
    private readonly free_;
    private clock_;
    constructor(atlasSize: number);
    get(key: string): Page | undefined;
    /** Marks pages drawn this frame, so they are the last to be given up. */
    touch(key: string): void;
    /** Moves the clock a frame on. */
    tick(): void;
    /** A slot for a new page under `key`: a free one, or the least recently drawn one not drawn this frame. Null when every slot is in use now. */
    claim(key: string, min: number, max: number): Page | null;
    /** Forgets the pages `test` names (the ground changed under them): they are made again as they are wanted. */
    forget(test: (key: string) => boolean): void;
    /**
     * Marks the pages `test` names as out of date without taking them away: they go on being drawn as they were until each is made again
     * (`claim` on its key), so an edit never leaves a hole in the ground while its pages are rebuilt over the next frames.
     */
    markStale(test: (key: string) => boolean): void;
    /** Whether the page under `key` is out of date. */
    isStale(key: string): boolean;
    /** Forgets every page (the device lost the atlas, or the ground changed). */
    clear(): void;
    /** Where a slot's page starts in the atlas, in texels. */
    origin(slot: number): [number, number];
    get size(): number;
}

/**
 * @file    surface.ts
 * @brief   The ground as one set of triangles: what is drawn near the eye, what is collided with and what a query answers.
 *
 * @details The ground is the lattice of `cellSize` cells in the terrain's space (a node at every multiple of the cell), each node as
 *          high as the source says there (an area's nodes past its edge take the edge's height), and each cell cut in two along the
 *          diagonal from its (1, 0) corner to its (0, 1) corner. That is the finest level the quadtree draws (a patch's vertices fall
 *          on the lattice and are cut the same way), the triangles collision is built from, and what `heightAt` and `normalAt` read, so
 *          all three agree to the GPU's 16-bit height encoding. Coarser levels farther from the eye are drawn coarser; nothing collides
 *          with them. The rule does not change with the camera, the order tiles are made in, or a reload.
 */

/** A tile's triangles: positions relative to its corner (x0, 0, z0) in the terrain's space, wound counter-clockwise from above. */
interface SurfaceTile {
    x0: number;
    z0: number;
    positions: Float32Array;
    indices: Uint32Array;
}
declare class TerrainSurface {
    readonly source: TerrainSource;
    readonly cell: number;
    constructor(source: TerrainSource, cell: number);
    /** The height of lattice node (i, k), or null where the source has not answered. Off an area it is its nearest edge's, as the pages have it. */
    node(i: number, k: number): number | null;
    /** Whether (x, z) is on the ground: inside an area, anywhere for ground without end. */
    covers(x: number, z: number): boolean;
    /** The height at (x, z) on its cell's triangle, or null off the ground or where a corner is not known yet. */
    height(x: number, z: number): number | null;
    /** The normal of the triangle under (x, z), or null where its height is not known. */
    normal(x: number, z: number): [number, number, number] | null;
    /** Tile (tx, tz)'s triangles, or null while a node of it is not known yet. */
    tile(tx: number, tz: number): SurfaceTile | null;
    /**
     * Where the ray from (ox, oy, oz) along (dx, dy, dz) first meets the ground, within `maxDistance` (along the direction, normalised):
     * the distance, the point and the triangle's normal; null where it meets none (or crosses ground not known yet). Exact against the
     * triangles: it walks the lattice cell by cell under the ray and meets each cell's two.
     */
    raycast(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, maxDistance: number): {
        distance: number;
        point: [number, number, number];
        normal: [number, number, number];
    } | null;
    /** The four corners of the cell under (x, z) and where in it the point is, or null. */
    private corners;
}

/**
 * @file    groundQuery.ts
 * @brief   What the ground says at a world point, from the ground's own data: the same answers on the main thread and on a worker.
 *
 * @details A terrain answers three questions at a point: how high, which way it faces, how it is painted. They are the ground's surface (the lattice of
 *          triangles, surface.ts) and its source (the field or the noise), shifted by where the terrain stands. Everything here is a function of that data
 *          alone, so a worker given the data (`GroundData`) answers as the terrain does, and what a world is laid out from does not depend on which of them
 *          was asked.
 */

/** Where a terrain stands, in the world. */
interface GroundOrigin {
    x: number;
    y: number;
    z: number;
}
/** A terrain's ground as data a worker can rebuild it from. */
interface GroundData {
    origin: GroundOrigin;
    /** The lattice's cell, in the terrain's units. */
    cell: number;
    source: {
        kind: 'field';
        data: FieldSourceData;
    } | {
        kind: 'noise';
        data: NoiseParams;
    };
    /**
     * How far from the terrain's own space the source is read. The engine's noise as a PROVIDER is the world's ground, the same
     * wherever a terrain stands on it, so its terrain reads it at its own position; absent, the source is the terrain's own.
     */
    shift?: {
        x: number;
        z: number;
    };
}

/** One tile of a `.esterrain`, by its place in the grid and the project paths of its images. @experimental */
interface TerrainTileEntry {
    x: number;
    z: number;
    height: string;
    splat?: string;
    splat2?: string;
}
/** A `.esterrain` document. @experimental */
interface TerrainTilesDocument {
    version: 1;
    /** Samples along a tile's side, its edges shared with its neighbours. */
    tileSamples: number;
    tilesX: number;
    tilesZ: number;
    /** How the tile and overview images hold their heights: a {@link HeightmapFormat}. */
    format: number;
    /** The whole area at low detail, always in memory: what distant ground is drawn from. */
    overview: string;
    overviewSplat?: string;
    overviewSplat2?: string;
    tiles: TerrainTileEntry[];
}
/** An image's pixels as the terrain reads them. */
interface TerrainImage {
    width: number;
    height: number;
    pixels: Uint8Array;
    wide?: Uint16Array;
}
/** What a tiled ground holds in memory and is reading. @experimental */
interface TerrainTileStats {
    resident: number;
    reading: number;
    bytes: number;
    reads: number;
    evictions: number;
}
/** A `.esterrain` checked, or a message naming what is wrong with it. */
declare function parseTerrainTiles(json: unknown, file?: string): TerrainTilesDocument;
/** @internal One tile in memory. */
interface Tile {
    field: Heightfield;
    splat: Splat | null;
    splat2: Splat | null;
    bytes: number;
    used: number;
}
type Params = Pick<TerrainData, 'sizeX' | 'sizeZ' | 'height' | 'rockSlope' | 'dirtHeight' | 'snowHeight'>;
/** The default most a tiled ground keeps of its full-detail tiles in memory. */
declare const TERRAIN_TILE_BUDGET: number;
/** An area's ground read from tiles. @experimental */
declare class TiledSource implements TerrainSource {
    readonly doc: TerrainTilesDocument;
    private readonly params;
    readonly overview: Heightfield;
    private overviewSplat;
    private overviewSplat2;
    private readonly read;
    readonly budget: number;
    readonly infinite = false;
    readonly bounds: readonly [number, number, number, number];
    readonly minHeight = 0;
    readonly maxHeight: number;
    /** Samples along the whole area's sides. */
    readonly samplesX: number;
    readonly samplesZ: number;
    private readonly entries_;
    private readonly tiles_;
    private readonly reading_;
    private readonly dirty_;
    private overviewDirty_;
    private clock_;
    private bytes_;
    private reads_;
    private evictions_;
    constructor(doc: TerrainTilesDocument, params: Params, overview: Heightfield, overviewSplat: Splat | null, overviewSplat2: Splat | null, read: (path: string) => Promise<TerrainImage | null>, budget?: number);
    stats(): TerrainTileStats;
    /** Bytes the overview holds, which stay for as long as the ground does. */
    get overviewBytes(): number;
    /** The world-unit spacing of the overview's samples along x: pages this coarse or coarser are made from it alone. */
    get overviewSpacing(): number;
    height(x: number, z: number): number | null;
    normal(x: number, z: number): [number, number, number] | null;
    paint(x: number, z: number, h: number, ny: number): LayerWeights;
    region(x0: number, z0: number, spacing: number, count: number): TerrainRegionSamples | Promise<TerrainRegionSamples>;
    /** Lets go of tiles, least recently used first, until what is held is within the budget; those in `keep` stay. */
    trim(keep?: ReadonlySet<string>): void;
    /** @internal The tile at (tx, tz) if it is in memory. */
    tileAt(tx: number, tz: number): Tile | undefined;
    /** @internal Reads the tile at (tx, tz) if it is not in memory; null where the document has none. */
    readTile(tx: number, tz: number): Promise<Tile | null>;
    /** @internal Whether the document has a tile at (tx, tz). */
    hasTile(tx: number, tz: number): boolean;
    /** @internal Keeps a changed tile in memory until {@link markSaved}: a tile let go with changes in it would lose them. */
    markDirty(tx: number, tz: number): void;
    /** @internal The tiles changed since they were read or last saved. */
    dirtyTiles(): string[];
    /** @internal Whether the overview has changed since it was read or last saved. */
    get overviewDirty(): boolean;
    /** @internal */
    markOverviewDirty(): void;
    /** @internal Lets saved tiles go again. */
    markSaved(): void;
    /** @internal Gives a tile in memory its splatmaps where it has none, painted as the ground is painted now. */
    ensureTileSplats(tile: Tile, tx: number, tz: number, second: boolean): void;
    /** @internal The overview's splatmaps, made at the overview's size where it has none. */
    overviewSplats(make: boolean, second: boolean): {
        a: Splat | null;
        b: Splat | null;
    };
    private tile;
    private ensure;
    /** Where (x, z) falls: its tile's key, and its place in that tile in samples. */
    private locate;
    private keysOver;
    private fromOverview;
    private fromTiles;
}

/** What one stroke changed in one array of a tiled ground. */
interface Arrays {
    heights: Piece<Float32Array> | null;
    splat: Piece<Uint8Array> | null;
    splat2: Piece<Uint8Array> | null;
}
/** What one stroke on a tiled ground changed: in each tile it reached, and in the overview. @experimental */
interface TiledGroundPatch {
    tiles: Map<string, Arrays>;
    overview: Arrays;
    bounds: [number, number, number, number];
}
/** An image a save writes, with where it goes. @experimental */
interface TiledGroundImage {
    path: string;
    width: number;
    height: number;
    pixels: Uint8Array;
}
/** One tiled ground, open to brushes. @experimental */
declare class TiledGroundEdit {
    private readonly host;
    private readonly source;
    private readonly modified;
    private readonly sizeX;
    private readonly sizeZ;
    readonly tiled = true;
    private open_;
    /** @internal */
    constructor(host: GroundHost, source: TiledSource, modified: ModifiedSource, sizeX: number, sizeZ: number);
    get minHeight(): number;
    get maxHeight(): number;
    get area(): {
        sizeX: number;
        sizeZ: number;
    };
    get origin(): {
        x: number;
        z: number;
    };
    get samplesX(): number;
    get samplesZ(): number;
    /** Tiles changed and not saved yet. */
    get unsaved(): string[];
    heightAt(x: number, z: number): number | null;
    begin(): void;
    sculpt(mode: number, x: number, z: number, radius: number, falloff: number, amount: number, target?: number): void;
    paint(layer: number, x: number, z: number, radius: number, falloff: number, strength: number, erase?: boolean): void;
    end(): TiledGroundPatch | null;
    /** Lays a patch's `before` or `after` back; a tile that has left memory since is read again first. */
    apply(patch: TiledGroundPatch, side: 'before' | 'after'): void;
    /**
     * What a save writes: every changed tile's images, and the overview's, at the paths the document names. A splatmap the document did not
     * name before is given a path beside its tile's heights, and `document` is then the document to write as well (null when unchanged).
     */
    saveImages(): {
        images: TiledGroundImage[];
        document: TerrainTilesDocument | null;
    };
    /**
     * The whole area as one heightmap image, the size {@link importImage} takes: from every tile (`all`, each read in turn), or from
     * the tiles in memory (`loaded`), the rest from the overview. Null when `loaded` finds no tile in memory.
     */
    exportImage(mode: 'all' | 'loaded'): Promise<{
        width: number;
        height: number;
        pixels: Uint8Array;
    } | null>;
    /**
     * A heightmap laid over the ground: on every tile (`all`) or the tiles in memory (`loaded`). `field` covers the whole area and is
     * resampled to it if its size differs. The tiles in memory take it at once; what comes back is every image to write (the tiles'
     * and the overview's). Refused while there are changes not saved, which it would overwrite.
     */
    importImage(field: Heightfield, mode: 'all' | 'loaded'): TiledGroundImage[];
    /** After the images of {@link saveImages} are written: the tiles may leave memory again. */
    saved(): void;
    private get span();
    /** The window of samples a brush reaches, one wider, and the tiles in memory over it; null where one is not, after asking for it. */
    private dab;
    private window;
    /** The window's values of one array, read from whichever tile holds each sample. */
    private readWindow;
    /** Writes the window's `hit` back into every tile that holds a sample of it, keeping each tile's values first for undo. */
    private writeWindow;
    /** Brings the overview's samples over the changed samples up to date, from the tiles. */
    private updateOverview;
    private tilesOver;
    private world;
}

/** The engine's own provider of ground without end: seeded noise of the world's position. */
declare const NOISE_PROVIDER = "estella:noise";
/** How far the ground goes: an area of its own size, or for ever. */
declare const TerrainExtent: {
    readonly Area: 0;
    readonly Infinite: 1;
};
/** The fields of the `Terrain` component. @experimental */
interface TerrainData {
    /** {@link TerrainExtent}: an area `sizeX` by `sizeZ`, or ground that goes on for ever (from a provider, read anywhere). */
    extent: number;
    /**
     * Ground read from a provider (without end, or an area with no heightmap, a window on it where the area stands): the provider
     * (`estella:noise`, the engine's noise, or one a game registers with registerTerrainProvider), the world it belongs to as the game
     * names it, and the generator version that world was made with.
     */
    provider: string;
    world: string;
    generatorVersion: number;
    /** A heightmap image, read as {@link heightmapFormat} says. Empty makes the ground from noise. */
    heightmap: number;
    /** A `.esterrain` (project path): the area's ground as tiles read where they are looked at, and an overview for the rest. Takes the heightmap's place. */
    tiles: string;
    /** How the heightmap holds its heights: a {@link HeightmapFormat}. */
    heightmapFormat: number;
    /** An image whose four channels are the weights of layers 1 to 4; empty paints by height and slope. */
    splatmap: number;
    /** An image whose four channels are the weights of layers 5 to 8, read with the first. */
    splatmap2: number;
    /** A picture laid over the whole of an area and mixed into the ground's colour by its alpha: a meadow's flowers, a map's regions, scorched ground. */
    colorMap: number;
    /** How much of the colour map is mixed in where its alpha is whole. */
    colorMapStrength: number;
    /** An image over the whole of an area whose red says how much of the sky reaches the ground there: a baked occlusion, for the folds no screen-space pass can see across. */
    occlusionMap: number;
    /** How much of the occlusion map is applied. */
    occlusionStrength: number;
    /**
     * The terrain layers (`.esterrainlayer` files, up to eight) the ground is drawn with, in the order the paint weighs them. With any,
     * the ground is drawn on the Terrain Layers shader (its material, if one is named, must be on it); with none, by the four colours.
     */
    layers: string[];
    /** A material on the Terrain shader. Empty draws the layer colours onto the ground. */
    material: number;
    /** An area's size along x and z, centred on its entity; for ground without end, the span `frequency` hills are spread over. */
    sizeX: number;
    sizeZ: number;
    /** World height of the highest ground. */
    height: number;
    /** The finest cell of the ground's mesh, in world units: what it is drawn at near the eye. */
    cellSize: number;
    /** Above 1 the finest cells reach further out before the ground coarsens. */
    detail: number;
    /** How far ground without end is drawn. */
    drawDistance: number;
    /** Whether bodies collide with the ground; how far round each thing that moves on it the ground is built for collision; its layer and friction. */
    collision: boolean;
    collisionDistance: number;
    collisionLayer: number;
    friction: number;
    /** Noise ground: the seed, how many hills across, how many octaves, how rough, how ridged, and (an area's) how many samples. */
    seed: number;
    frequency: number;
    octaves: number;
    persistence: number;
    ridged: number;
    resolution: number;
    /** How far the noise is bent by noise of its own, 0 to 1: winding valleys and bent ridges instead of round hills. */
    warp: number;
    /** How much rain wears the ground, 0 to 4: an area is worn drop by drop (dirt where the water ran), ground without end by its noise. */
    erosion: number;
    /** Painting: how steep ground must be to turn to rock (0 flat, 1 sheer), and the heights, 0 to 1, where dirt and snow start. */
    rockSlope: number;
    dirtHeight: number;
    snowHeight: number;
    /** The four layers: grass, dirt, snow, rock. With no material these are the colours the ground is drawn in; a material has its own layers and tints. */
    layerColor0: Color;
    layerColor1: Color;
    layerColor2: Color;
    layerColor3: Color;
}
/**
 * The ground. Presence is the opt-in; its children are the quadtree's nodes, drawn as instances of one patch.
 *
 * @experimental
 */
declare const Terrain: ComponentDef<TerrainData>;
/**
 * Makes the page of the square (x0, z0) to (x0 + size, z0 + size) of a terrain's own space somewhere else, painted as the terrain would
 * paint it; null when it cannot make this one.
 */
type TerrainPager = (x0: number, z0: number, size: number) => Promise<PageImage> | null;
/** What the plugin knows about one terrain it has built. */
interface Built {
    signature: string;
    data: TerrainData;
    source: TerrainSource | null;
    /** The triangles of the finest level, which queries and collision read. */
    surface: TerrainSurface | null;
    /** Bumped on every rebuild so an answer that arrives for an older one is thrown away. */
    epoch: number;
    loading: boolean;
    /** The erosion in hand, to stop if the terrain is rebuilt. */
    cancel: (() => void) | null;
    table: PageTable;
    heights: number;
    paint: number;
    mesh: number;
    instance: number;
    /** The nodes drawn now, by key, and spare ones to place again. */
    nodes: Map<string, Entity>;
    spare: Entity[];
    /** Pages wanted and not made yet, by key. */
    wanted: Map<string, TerrainNode>;
    /** The share of its detail's range the ground is drawn at, so its nodes fit the pages there are (see fitRange). */
    fit: number;
    fitSaid?: boolean;
    /** Pages asked of a provider that answers later, by key: the frame's budget is not spent waiting for them. */
    asked: Set<string>;
    /** The workers failed one of this terrain's pages: it makes its own. */
    pagerFailed?: boolean;
    /** A synchronous source's page paused inside sampling/painting, rather than blocking a whole frame. */
    pageWork?: {
        key: string;
        epoch: number;
        edits: number;
        job: Generator<number, PageImage, void>;
        image?: PageImage;
    };
    pending: boolean;
    /** Why the ground could not be made, once it could not: nothing is drawn or answered for it. */
    failure: string | null;
    /** Bumped whenever modifiers change the ground under it: a page asked for before is thrown away when it lands. */
    edits: number;
    /** The atlas of layers 5 to 8's paint, with layers. */
    paint2: number;
    /** The layers packed (albedo, normal and mask arrays), what they were packed from, and whether a packing is in hand. */
    arrays: number[];
    packed: string;
    packing: boolean;
    /** Whether the colour map is on the material: so taking it off is written once, and ground without one is written nothing. */
    washed: boolean;
    /** The same of the occlusion map. */
    shaded: boolean;
}
/** Where a terrain's ground stands: still being made, ready, or failed (with why). */
interface TerrainStatus {
    state: 'loading' | 'ready' | 'failed';
    reason?: string;
}
interface TerrainLoad {
    loading: number;
    cpuBytes: number;
    tiles: number;
    unsaved: number;
}
/** Run-time access to the ground: how high it is anywhere, for putting things on it. */
declare class Terrains {
    /** @internal */ readonly built_: Map<number, Built>;
    /** @internal */ app_: App | null;
    /**
     * The world height of the ground at (x, z), or null where no terrain is. The terrain's own position is taken into account; its
     * rotation and scale are not (a terrain is laid flat at its own size).
     */
    heightAt(x: number, z: number): number | null;
    /**
     * The weights of the terrain's layers at (x, z), as the ground is painted there (four, or as many as it has layers), or null where no terrain is:
     * what a world's rules read as the fields `paint.<layer>`.
     */
    paintAt(x: number, z: number): readonly number[] | null;
    /**
     * The world rectangle the terrains cover, `[minX, minZ, maxX, maxZ]`, or null where it has no end (a terrain of infinite extent) or there is none:
     * what a layer of chunks laid over the ground is held to, so it does not count a radius of empty world.
     */
    areaBounds(): [number, number, number, number] | null;
    /**
     * The ground as data a worker can rebuild it from, when it can be: one terrain, made, of a field or of noise (the engine's own noise provider
     * included, whose ground is its parameters), with nothing laid over it. Null otherwise (a game's provider, a modified ground, several terrains,
     * one still being made), when what is laid out over it must ask here.
     */
    groundData(): GroundData | null;
    /** The names of the terrain's layers, in the order `paintAt` weighs them: the layer files' names, or grass, dirt, snow and rock without any. */
    layerNames(): string[];
    /** The world height of the ground at (x, z) as it was made, under every modifier laid over it: what a plot is levelled from. */
    heightBeneathAt(x: number, z: number): number | null;
    /** Where the ground faces at (x, z) (a unit normal), or null where no terrain is. */
    normalAt(x: number, z: number): [number, number, number] | null;
    /**
     * Whether the ground at (x, z) is known: false while a terrain that covers it is still being made, or its provider has not answered
     * there yet; true where it is known, and where no terrain is (there is no ground to wait for).
     */
    groundKnownAt(x: number, z: number): boolean;
    /**
     * Where a ray meets the ground, anywhere and whether or not anything collides there: exact against the same triangles collision and
     * `heightAt` use. `maxDistance` is along the direction. Null where it meets no terrain within it.
     */
    raycast(origin: {
        x: number;
        y: number;
        z: number;
    }, direction: {
        x: number;
        y: number;
        z: number;
    }, maxDistance: number): {
        distance: number;
        point: {
            x: number;
            y: number;
            z: number;
        };
        normal: {
            x: number;
            y: number;
            z: number;
        };
        entity: Entity;
    } | null;
    /**
     * A way across the ground from one place to another that a walker held to `maxSlope` can take, or why there is none: what a game
     * checks a spawn, a quest's goal or a village against. The ground is read where the search goes, modifiers and all, so nothing is
     * baked first; ground still being made is no ground yet (see `groundKnownAt`).
     */
    findPath(from: {
        x: number;
        z: number;
    }, to: {
        x: number;
        z: number;
    }, options?: ReachOptions): ReachResult;
    /** Whether the ground under (x, z) is built for collision: what a game waits on before it drops something there. */
    collisionReadyAt(x: number, z: number): boolean;
    /** Where a terrain's ground stands. A failed one draws and answers nothing, and says why. */
    status(entity: Entity): TerrainStatus | null;
    load(): TerrainLoad;
    /** @internal The modifiers laid over every terrain's ground, by id, in the order they were set. */
    readonly modifiers_: Map<string, TerrainModifier>;
    /**
     * Lays `modifier` over the ground (or replaces the one with its id): the drawn ground, its queries and its collision all follow it,
     * and only what it reaches is made again.
     */
    setModifier(modifier: TerrainModifier): void;
    /** Takes a modifier off the ground. */
    deleteModifier(id: string): void;
    /**
     * A handle to change the ground of the area terrain on `entity` with brushes (sculpt.ts), or null while it is being made, when it
     * is not an area of its own heights (infinite ground, a provider's) or when it is not a terrain.
     */
    groundEdit(entity: Entity): GroundEdit | TiledGroundEdit | null;
    /** @internal Makes again what the world square `b` reaches: its pages and its collision, and what stands on the ground. */
    remake_(b: readonly [number, number, number, number]): void;
    /** @internal What has the last word on the ground's paint, in world space (a world's biomes), if anything does. */
    paint_: Repaint | null;
    /**
     * Gives the ground's paint to `paint` (or back to the terrains, with null): at each sample, in world space, it is handed the paint
     * the terrain made and returns the paint to draw. The pages already made are made again.
     */
    setPaint(paint: Repaint | null): void;
    /** @internal Who makes the ground's pages off the main thread, if anyone does. */
    pager_: TerrainPager | null;
    /**
     * Hands the making of pages to `pager` (or back to the terrain, with null). A world that paints the ground has the plan the paint is
     * read from on its workers already, and a page painted there costs the frame nothing; painted here it is tens of milliseconds a page.
     * The pager answers null for a page it cannot make (its plan is no longer the ground's), and the terrain makes that one itself.
     */
    setPager(pager: TerrainPager | null): void;
    /** Makes every page again, for a paint that changed what it answers. */
    repaint(): void;
    /** @internal Bumped whenever a terrain's ground changes, so what stands on it knows to stand again. */
    revision_: number;
    /** Whether any terrain is still reading its images or wearing its ground: its heights are not known yet. */
    get loading(): boolean;
    /** How many pages every terrain still wants made for what is in view. */
    get pending(): number;
}
/** The resource the plugin installs. @experimental */
declare const TerrainsRes: ResourceDef<Terrains>;
declare class TerrainPlugin implements Plugin {
    name: string;
    /** No terrain, no work; the frame after the last one goes still runs its sweep. */
    readonly activeWhen: ComponentDef<TerrainData>[];
    /** The stock materials a terrain with none of its own is an instance of: without layers, and with. */
    private stock_;
    private stockLayers_;
    /** Bumped when an asset is edited and saved, so layers are packed again; and the listener that bumps it. */
    private layerEdits_;
    private watching_;
    build(app: App): void;
    cleanup(app?: App): void;
    /** Reads the images the terrain names (or makes its noise, and wears it), and makes its source. */
    private load;
    private pixelsOf;
    /** An image file's pixels exactly as stored (no premultiply, no colour conversion), by its project path or reference. */
    private pixelsAt;
    /** The stock material: the Terrain shader, compiled once. */
    private stock;
    /** The stock material for ground with layers: the Terrain Layers shader, compiled once. */
    private stockLayers;
    /**
     * Packs the terrain's layers into the arrays its material reads, when what they name changed (or a layer file was saved): the
     * ground keeps the arrays it has until the new ones are made.
     */
    private pack;
    /** Makes what the ground is drawn with: the patch, the atlases and an instance of its material. */
    private prepare;
    /**
     * The terrain's collision as a layer of procedural chunks: a tile within `collisionDistance` of every moving 3D body and character,
     * made when one comes near, let go when none is, and made again (the old tile kept till then) when the ground changes.
     */
    private collide;
    private eye;
    /** The quadtree's cut for this terrain: leaf nodes a patch of the finest cells, ranges doubling, enough levels to cover it. */
    private treeOf;
    /** Chooses the nodes for the eye, makes the pages they want within the budget, and places the nodes. */
    private draw;
    /** Makes the wanted pages, coarse and near first: asked of the workers where a pager can make them, else made here for as long as the frame can spare. */
    private makePages;
    /** Puts a node entity on each node drawn (reusing the ones it had), and takes the rest away. */
    private place;
    private destroy;
    /** Releases the nodes of a terrain whose entity is gone. */
    private sweep;
}
declare const terrainPlugin: Plugin;

/**
 * @file    provider.ts
 * @brief   Ground made by a generator a game names: one function of the world's position, versioned, the same on every machine.
 *
 * @details A provider samples the ground over a region it is handed: a world, a seed, a generator version, a corner in world units, a
 *          spacing and a count. Every region is the same function read at other points, so two regions that share an edge share its
 *          samples, a coarse page and a fine one agree where their samples coincide, and the order regions are asked in changes nothing.
 *          The client draws from it, the server answers from it, and what stands on the ground is placed by it: one source.
 *
 *          A version names an algorithm for good. A saved world keeps the version it was made with; a provider that changes its algorithm
 *          adds a version and keeps the old one, and a terrain asking for a version its provider does not have fails, loudly, rather than
 *          growing other ground under what was built on it. The engine's own noise is the provider `estella:noise`, version 1.
 */

/** Where and how finely a provider is asked to sample. */
interface TerrainRegion {
    /** The world (a planet, a level) the ground belongs to, as the game names it. */
    world: string;
    seed: number;
    /** The generator version the world was made with. */
    version: number;
    /** The world position of the first sample, and the distance between samples along x and z. */
    x0: number;
    z0: number;
    spacing: number;
    /** Samples along each side: `count * count` of them, row by row from z0, each row from x0. */
    count: number;
}
/** What a provider answers for a region: heights in world units and, if it paints the ground, four layer weights a sample. */
interface TerrainSamples {
    heights: Float32Array;
    /** Grass, dirt, snow, rock, 0 to 1, four a sample; absent leaves the terrain to paint by height and slope. */
    paint?: Float32Array;
}
/** A generator of ground. */
interface TerrainProvider {
    /** The name a Terrain asks for it by. */
    readonly id: string;
    /** The generator versions it can still make. */
    readonly versions: readonly number[];
    /** The least and most height its ground can have for this seed and version: what the GPU encodes heights over. */
    range(seed: number, version: number): [number, number];
    /** The ground over a region. May answer later (a worker, a server); must answer the same for the same region every time. */
    sample(region: TerrainRegion): TerrainSamples | Promise<TerrainSamples>;
    /** The height at one point, for a provider that can answer one at once; without it a point is answered from sampled regions. */
    heightAt?(world: string, seed: number, version: number, x: number, z: number): number;
}
/**
 * Makes `provider` available to every Terrain that names it. A second provider under the same id replaces the first. A terrain that
 * named one not yet registered (a script registers it after the scene loaded) is made once it is.
 */
declare function registerTerrainProvider(provider: TerrainProvider): void;
/** The provider registered under `id`, if any. */
declare function terrainProvider(id: string): TerrainProvider | undefined;
/** Why a terrain's ground could not be made. */
declare class TerrainUnavailable extends Error {
}
/** Ground from a provider, as a terrain draws and answers it. Positions are world positions less the terrain's own. */
declare class ProviderSource implements TerrainSource {
    readonly provider: TerrainProvider;
    readonly world: string;
    readonly seed: number;
    readonly version: number;
    /** The terrain's own position, which the provider's world positions are offset by. */
    private readonly originX;
    private readonly originZ;
    /** The spacing a point's tile is sampled at: the finest the terrain is drawn at. */
    private readonly pointSpacing;
    private readonly paintRules;
    readonly infinite = true;
    readonly bounds: null;
    readonly minHeight: number;
    readonly maxHeight: number;
    /** Tiles of samples a point is answered from, by key; a tile asked for and not yet answered is a promise. */
    private readonly tiles_;
    constructor(provider: TerrainProvider, world: string, seed: number, version: number, 
    /** The terrain's own position, which the provider's world positions are offset by. */
    originX: number, originZ: number, 
    /** The spacing a point's tile is sampled at: the finest the terrain is drawn at. */
    pointSpacing: number, paintRules: (h: number, ny: number) => [number, number, number, number]);
    /** The ground over a region of the terrain's space, from the provider. */
    region(x0: number, z0: number, spacing: number, count: number): TerrainSamples | Promise<TerrainSamples>;
    height(x: number, z: number): number | null;
    /** The normal at (x, z), from the heights a spacing either side; null where they are not known yet. */
    normal(x: number, z: number): [number, number, number] | null;
    paint(_x: number, _z: number, h: number, ny: number): [number, number, number, number];
}
/** The engine's own ground without end: seeded noise of the world's position, as `estella:noise` version 1. */
declare function noiseProvider(params: (seed: number) => NoiseParams): TerrainProvider;

/**
 * @file    planetProvider.ts
 * @brief   Ground on a sphere made by a generator a game names: one function of a direction, versioned, the same on every machine.
 *
 * @details The provider of flat ground (provider.ts) answers for a square of world positions; this one answers for directions from a planet's
 *          centre, because a sphere has no x and z. It is handed the unit directions to sample and the radius they are on, and gives back the height
 *          above that radius at each and, if it paints the ground, four layer weights. The same rules hold: every sample is the same function read
 *          at another direction, so two pages that share an edge share its samples; a version names an algorithm for good.
 */

/** What a planet provider answers: the heights and paint of a terrain's, and the values of the fields it names, a sample after another. */
interface PlanetSamples extends TerrainSamples {
    /** `fields.length` values a sample, in the order the provider's `fields` names them. */
    fields?: Float32Array;
}
/** What a provider is asked to sample: a list of unit directions from the planet's centre. */
interface PlanetRegion {
    /** The world (a planet) the ground belongs to, as the game names it. */
    world: string;
    seed: number;
    /** The generator version the planet was made with. */
    version: number;
    /** The planet's radius in metres: a provider reasons in metres, a direction is only where. */
    radius: number;
    /** `count` unit directions, x, y, z one after the other. */
    directions: Float32Array;
    count: number;
}
/** A generator of ground on a sphere. */
interface PlanetProvider {
    /** The name a Planet asks for it by. */
    readonly id: string;
    /** The generator versions it can still make. */
    readonly versions: readonly number[];
    /** The least and most height above the radius its ground can have for this seed, version and radius: what the GPU encodes heights over. */
    range(seed: number, version: number, radius: number): [number, number];
    /**
     * The names of fields the ground has beyond its height and paint, which a generated world reads as part of its environment (an ecology: how much of
     * a place is a wetland). A game's own generator decides them, so the ground that is drawn and what grows on it come from one function.
     */
    readonly fields?: readonly string[];
    /**
     * The text of a self-contained module (plain JavaScript, no imports) whose default export is this provider's `id`, `versions`, `fields` and `sample`, so that
     * a worker can load the generator and a generated world can be laid out off the main thread. Absent, the world is laid out on the main thread.
     */
    readonly workerSource?: string;
    /** The ground in the directions asked: heights in metres above the radius, the layer weights if it paints, and its fields if it has any. May answer later. */
    sample(region: PlanetRegion): PlanetSamples | Promise<PlanetSamples>;
}
/**
 * Makes `provider` available to every Planet that names it. A second provider under the same id replaces the first. A planet that named one not yet
 * registered (a script registers it after the scene loaded) is made once it is.
 * @experimental
 */
declare function registerPlanetProvider(provider: PlanetProvider): void;
/** The provider registered under `id`, if any. */
declare function planetProvider(id: string): PlanetProvider | undefined;

/** What a planet says of itself, from its component and its provider. */
interface PlanetFacts {
    /** The centre, in world units. */
    centre: [number, number, number];
    radius: number;
    /** How hard it pulls, in metres a second squared at the surface (0: it pulls nothing). */
    gravity: number;
    /** The ground's height above the radius in a direction from the centre, or null while the provider answers later or the planet is not made. */
    height: ((dx: number, dy: number, dz: number) => number | null) | null;
    /** The weights of the planet's layers there, as its provider paints them (null where it does not, or cannot say yet), and the layers' names (their files', without the extension). */
    paint: ((dx: number, dy: number, dz: number) => readonly number[] | null) | null;
    layers: readonly string[];
    /** The names of the provider's own fields, and their values in a direction (null where it cannot say yet). */
    fieldNames: readonly string[];
    fieldsAt: ((dx: number, dy: number, dz: number) => readonly number[] | null) | null;
    /** The provider's answer for many directions at once (heights, paint, fields), or null while it answers later: a world is laid out from tiles of it, not a call a point. */
    sampleMany: ((directions: Float32Array, count: number) => PlanetSamples | null) | null;
    /** What a worker needs to read this planet's ground itself: its provider's module text, and what it is asked with. Null where the provider has none. */
    worker?: {
        source: string;
        seed: number;
        version: number;
        world: string;
    } | null;
}
/**
 * What paints a planet's ground: given a direction from the centre and the paint the provider gave there (the weights of the planet's layers), the paint
 * to use. A generated world's biomes are one.
 */
type PlanetPainter = (dx: number, dy: number, dz: number, base: readonly number[]) => readonly number[];
/** How a worker is made to paint a planet as the main thread's painter does: the plan of each face by a key, and what a worker makes it from. */
interface RemotePaint {
    /** The six faces' plans' keys. */
    readonly keys: readonly string[];
    /** What a worker makes face `face`'s plan from (plain data). */
    spec(face: number): unknown;
}
/** The planets of the app. @experimental */
declare class PlanetRegistry {
    readonly planets: Map<number, PlanetFacts>;
    private readonly painters_;
    private readonly remote_;
    /** Bumped when a painter is set, changed or taken away, so the planet's pages are painted again. */
    paintRevision: number;
    /** Sets what paints the planet `entity`'s ground (null takes it away); a planet paints with its provider's paint until then. */
    setPaint(entity: Entity, painter: PlanetPainter | null, remote?: RemotePaint | null): void;
    /** How a worker paints the planet `entity`'s ground as its painter does, when it can. */
    remotePaintOf(entity: Entity): RemotePaint | null;
    /** What paints the planet `entity`'s ground, if anything does. */
    paintOf(entity: Entity): PlanetPainter | null;
    /** The planet whose surface is nearest the position (a planet pulls from any distance), or null with none. */
    nearest(x: number, y: number, z: number): Entity | null;
    /** The unit direction away from the centre of the planet `entity`, at a position; null for no such planet, or at its very centre. */
    up(entity: Entity, x: number, y: number, z: number): [number, number, number] | null;
    /** How far the position is above the planet's radius (negative inside), or null for no such planet. */
    altitude(entity: Entity, x: number, y: number, z: number): number | null;
    /** The ground's height above the radius under the position, from the generator; null where it cannot say yet. */
    groundHeight(entity: Entity, x: number, y: number, z: number): number | null;
    /** The point on the ground under the position, in world units, or null where the ground cannot be said yet. */
    groundPoint(entity: Entity, x: number, y: number, z: number): [number, number, number] | null;
}
declare const PlanetRegistryRes: ResourceDef<PlanetRegistry>;

export { FieldSource, GroundEdit, HeightmapFormat, ModifiedSource, NOISE_PROVIDER, NoiseSource, PAGE_SIDE, PAGE_TEXELS, PATCH_CELLS, PageTable, PlanetRegistry, PlanetRegistryRes, ProviderSource, SculptMode, TERRAIN_TILE_BUDGET, Terrain, TerrainExtent, TerrainPlugin, TerrainUnavailable, Terrains, TerrainsRes, TiledGroundEdit, TiledSource, boxDistance, brushWeight, encodeHeightmap, erodeHeightfield, erosionJob, findGroundPath, flattenModifier, heightfieldFromPixels, levelRange, makePage, nodeKey, noiseProvider, noised, paintSplat, parentOf, parseTerrainTiles, planetProvider, proceduralHeightfield, registerPlanetProvider, registerTerrainProvider, sampleHeight, sculptField, selectNodes, terrainNormal, terrainPlugin, terrainProvider, unionDirty };
export type { Brush, Dirty, Eroded, ErosionParams, GroundPatch, Heightfield, LayerWeights, NoiseParams, Page, PageImage, PaintDab, PlanetFacts, PlanetPainter, PlanetProvider, PlanetRegion, PlanetSamples, ProceduralParams, QuadtreeParams, ReachGround, ReachOptions, ReachResult, SculptDab, Splat, TerrainData, TerrainImage, TerrainLoad, TerrainModifier, TerrainNode, TerrainProvider, TerrainRegion, TerrainRegionSamples, TerrainSamples, TerrainSource, TerrainStatus, TerrainTileEntry, TerrainTileStats, TerrainTilesDocument, TiledGroundImage, TiledGroundPatch };
