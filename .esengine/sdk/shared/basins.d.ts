import { Entity } from './wasm.js';
import { ComponentDef, Plugin, App, MeshData } from './app.js';
import { ResourceDef } from './resource.js';
import { BuiltinShaderTemplate } from './builtinShaders.js';

/**
 * @file    waterQuery.ts
 * @brief   What a world is laid out by in the water: how deep it stands over a height, and how far a point is from the shore.
 *
 * @details A part of a baked water field that is a function of three arrays, so a worker given them answers as the main thread does. Its own file so that a
 *          worker carries these few lines and not the baking of water.
 */
/** The grid a zone is baked over. */
interface ZoneGrid {
    minX: number;
    minZ: number;
    sizeX: number;
    sizeZ: number;
    nx: number;
    nz: number;
}
/** The part of a baked water field that a world is laid out by, as data a worker can be given. */
interface WaterQueryData {
    grid: ZoneGrid;
    /** The surface's height at rest, and the distance from the shore (above zero in the water), at each texel. */
    height: Float32Array;
    shore: Float32Array;
    /** The open sea past the region, if the zone has one. */
    ocean: {
        level: number;
    } | null;
}
/** How deep water stands at a point and how far it is from the shore: what a world is laid out by, from the field's own numbers. */
declare class WaterQuery {
    readonly data: WaterQueryData;
    constructor(data: WaterQueryData);
    private lerp;
    /** How deep the water stands at rest over the world height `y` at (x, z): above zero under water, null where there is none. */
    depthAt(x: number, z: number, y: number): number | null;
    /** How far (x, z) is from the water's edge: above zero on dry land, below in the water, deep in the open sea past the region; null where no water is baked. */
    shoreAt(x: number, z: number): number | null;
}

/** Each wave of the set: its heading off the base direction (degrees), its length and its height as shares of the body's, and its speed share. */
declare const WAVE_SET: readonly (readonly [number, number, number, number])[];
/** What shapes the waves: a WaterZone's and its bodies' heights, and the parameters of the Water material they are written to. */
interface WaveParams {
    /** Half of the most a crest stands above the rest plane (the set's heights add up to twice this), in world units. */
    height: number;
    /** Length of the longest wave. */
    length: number;
    /** A multiplier on how fast they travel. */
    speed: number;
    /** The base heading, in degrees. */
    direction: number;
    /** How many of the set's waves are summed, longest first (the quality level's); all of them when absent. */
    count?: number;
}
/**
 * How much of a wave a mesh of `cell`-sized cells can draw: none below three cells to a wavelength, all of it from six. The shader applies the
 * same ramp per vertex with the cell size of the ring the vertex is in, so a coarse far ring does not alias; `cell` 0 draws every wave.
 */
declare function waveFade(length: number, cell: number): number;
/** The surface's height above the body's rest plane at (x, z), `time` seconds in. */
declare function waveHeight(p: WaveParams, x: number, z: number, time: number, cell?: number): number;
/** The slope of the surface at (x, z): how fast its height changes along x and along z. */
declare function waveSlope(p: WaveParams, x: number, z: number, time: number): [number, number];

/**
 * @file    shore.ts
 * @brief   Where a lake ends, and how the waves calm toward it: what the zone (zone.ts) bakes a lake's outline and shore with.
 */
/** A point on the body's plane. */
interface Point2 {
    x: number;
    y: number;
}
/** The signed distance from (x, z) to the polygon's outline, positive inside it, negative outside. Self-intersecting outlines are not judged. */
declare function polygonSdf(poly: readonly Point2[], x: number, z: number): number;
/** The share of the waves kept where the water is `reach` deep or far from the edge: none at the edge, all from `width` in; with no width, all of them everywhere. */
declare function shoreDamp(reach: number, width: number): number;

/**
 * @file    ripples.ts
 * @brief   The disturbance a thing makes in water: a wave equation on a grid, and the foam it leaves.
 *
 * @details A water zone that is asked to ripple keeps a square window of its surface, a few hundred world units across, as a grid of heights, and each
 *          step moves it by the wave equation (every cell is pulled toward the mean of its four neighbours, and carries the velocity it had), with a little
 *          damping so a ripple dies. A disturbance (a body entering, a body moving, a script's `disturb`) is a smooth bump put into the grid; it spreads
 *          as a ring at the wave speed. Beside the height the grid keeps a foam: fed where a disturbance was and where the water moves, and fading with time.
 *
 *          It is the CPU's, and a plain array: it runs wherever the app does, is the same on every backend, and can be read back. The window follows the camera
 *          (it is re-centred in whole cells and the contents shift with it), so a lake or an ocean of any size has ripples where they are seen, for the
 *          price of one grid. The Water shader reads it as a texture (`encode`) for the slope it adds to the waves' and for the foam.
 *
 *          The wave equation is stepped in as many substeps as keep the wave from crossing more than half a cell in one: past that it would not be stable.
 */
/** A ripple grid over a square window of a body's own xz plane. */
declare class RippleField {
    /** Cells along a side. */
    readonly n: number;
    /** World size of the window along a side. */
    readonly size: number;
    /** World size of one cell. */
    readonly cell: number;
    /** The window's minimum corner in the body's xz plane. */
    originX: number;
    originZ: number;
    /** The most height a cell may hold, either way: disturbances that go on (a body moving) saturate here instead of piling up. */
    limit: number;
    private height;
    private previous;
    private next;
    private foam;
    constructor(n: number, size: number);
    /** The cell index holding (x, z), or -1 outside the window. */
    private index;
    /**
     * Moves the window so it is centred on (x, z), in whole cells: the grid shifts under it, what was on the side it leaves is gone and what comes in is still water.
     * Returns whether it moved.
     */
    recenter(x: number, z: number): boolean;
    /** Shifts a grid so the cell that was at (i + di, j + dj) is at (i, j): the window moving by (di, dj) cells. */
    private shift;
    /**
     * A smooth bump of `strength` (a height in world units; negative is a dip) and `radius` put into the water at (x, z). It is put into the current heights and the
     * last step's alike, so it starts at rest and spreads, and it feeds the foam by as much as it is strong.
     */
    disturb(x: number, z: number, radius: number, strength: number): void;
    /**
     * Steps the grid `dt` seconds on: waves travelling at `speed` (world units a second), losing `damping` of their height a second, and the foam fading by `foamFade` a second.
     * The window's edge lets waves out (the heights there are held at rest) rather than reflecting them.
     */
    step(dt: number, speed: number, damping: number, foamFade: number): void;
    /** The height of the ripples at (x, z) in world units, 0 outside the window. */
    heightAt(x: number, z: number): number;
    /** The foam at (x, z), 0 to 1, 0 outside the window. */
    foamAt(x: number, z: number): number;
    /** The greatest height anywhere in the grid, for a caller asking whether the water is still. */
    peak(): number;
    /**
     * The grid as RGBA8 for the shader: red the height (0.5 at rest, `range` above or below at 1 and 0), green the foam, blue and alpha unused (255).
     * Row j of the grid is row j of the image, so the shader's uv is (x - originX) / size, (z - originZ) / size.
     */
    encode(range: number, into?: Uint8Array): Uint8Array;
}

/**
 * @file    zone.ts
 * @brief   A water zone: every body of water in a region baked into one field, which one surface is drawn from.
 *
 * @details Bodies of water drawn each as a mesh of its own are separate surfaces, and where a river runs into a lake or the sea they meet
 *          along a seam: two heights, two sets of waves, a shore foaming across the river's mouth, a ribbon's edge showing over the lake.
 *          So a body of water is not drawn: it is an INPUT. A zone gathers the bodies over its region and bakes them into a grid, each
 *          texel holding what the water is there:
 *            - the height of its surface (a lake's level, the height of a river's curve at its nearest place, the sea's level);
 *            - the signed distance to the nearest shore (positive on the water): where the surface is cut and where it foams;
 *            - how high its waves stand there (a body's own height, calmed toward its shore and as the water shallows);
 *            - how it flows (a river's current), and how deep it is over the ground.
 *          Where two bodies meet their values are blended by how far inside each the texel is, so a river is at its lake's level where it runs
 *          into it, its current fades into the still water, and its banks run on into the lake's shores with no seam; the sea gives way to
 *          the bodies over it. One mesh following the camera reads the field and is the whole surface, and {@link WaterField.sample} answers
 *          the CPU from the same numbers.
 *
 *          The field is in the world's own frame on the xz plane: bodies may be turned about their up, not tilted.
 */

/** The fields of the `WaterZone` component. @experimental */
interface WaterZoneData {
    /** The region baked, along x and z, centred on the entity. Bodies (or the parts of them) outside it are not drawn; an ocean goes on past it. */
    sizeX: number;
    sizeZ: number;
    /** Texels along the longer side of the region. */
    resolution: number;
    /** A material on the Water shader for the whole surface. Empty uses the stock water. */
    material: number;
    /** The waves every body shares (each sets only how high they stand): the length of the longest, a multiplier on their speed, their heading in degrees. */
    waveLength: number;
    waveSpeed: number;
    waveDirection: number;
    /** The surf: how high a breaker stands against its body's waves (0 draws none), and how long the surf's waves are, in world units. */
    surf: number;
    surfLength: number;
    /** The surface's mesh: the cell size of its finest ring, cells along a ring's side, and how many rings (each twice as coarse) follow the camera. */
    cellSize: number;
    cells: number;
    rings: number;
    /** Cells along a side of the ripple grid; 0 keeps none. The grid is a window of `rippleSize` that follows the camera. */
    ripples: number;
    rippleSize: number;
    /** How fast a ripple spreads (world units a second), how much of its height it loses a second, and how fast the foam it leaves fades a second. */
    rippleSpeed: number;
    rippleDamping: number;
    foamFade: number;
}
/**
 * Where the bodies of water are drawn from, and what they share. A scene without one is given a zone over its lakes and rivers with these
 * defaults; put one in to say where, how fine, and what the water looks like.
 *
 * @experimental
 */
declare const WaterZone: ComponentDef<WaterZoneData>;
/**
 * An ocean, as the zone takes it: at `level` wherever the ground is below it and joined to the open sea, which is past the region's
 * edge. A basin below the sea's level that no low ground joins to the edge is dry land, not sea.
 */
interface ZoneOcean {
    kind: 'ocean';
    key: number;
    level: number;
    waveHeight: number;
    shoreWidth: number;
    /** How open the water is to the wind, 0 to 1 (its fetch): how far the weather raises its waves. Open sea, 1 when absent. */
    exposure?: number;
}
/** A lake: its outline on its own plane at world height `level`, and how a world point is put into the outline's space. */
interface ZoneLake {
    kind: 'lake';
    key: number;
    level: number;
    waveHeight: number;
    shoreWidth: number;
    exposure?: number;
    outline: readonly Point2[];
    /** A world (x, z) in the outline's own space, and back. */
    toLocal(x: number, z: number): [number, number];
    toWorld(x: number, z: number): [number, number];
}
/** A point along a river, in the world: where its middle is, its surface's height, half its width, its heading and how fast it runs there. */
interface RiverStation {
    x: number;
    z: number;
    y: number;
    half: number;
    dx: number;
    dz: number;
    speed: number;
}
/** A river, as the stations along it (a few to a width), in order downstream. */
interface ZoneRiver {
    kind: 'river';
    key: number;
    waveHeight: number;
    shoreWidth: number;
    exposure?: number;
    stations: readonly RiverStation[];
}
type ZoneBody = ZoneOcean | ZoneLake | ZoneRiver;
/** The ground's world height at (x, z), or null where none is known. */
type ZoneGround = (x: number, z: number) => number | null;

/** What the field encodes its numbers over, which the shader decodes with: see {@link WaterField.encode}. */
interface ZoneRanges {
    heightMin: number;
    heightSpan: number;
    shore: number;
    amp: number;
    flow: number;
    depth: number;
}
/** What {@link WaterField.sample} answers about the water at a point. */
interface FieldSample {
    /** The body that owns the most of it. */
    key: number;
    /** Its surface's height at rest, the height its waves stand to (and the share of its body's that is, calmed toward the shore), and its current. */
    height: number;
    amp: number;
    calm: number;
    /** The height its body's waves stand to away from any shore: what the surf breaking on the shore is measured against. */
    swell: number;
    flowX: number;
    flowZ: number;
    /** The signed distance to the nearest shore (positive on the water) and how deep the water is over the ground. */
    shore: number;
    depth: number;
    /** The distance the surf runs in by: the shore's, a river's water taken for land, smoothed over the surf's length. */
    surf: number;
    /** How much of the surf a current leaves: 0 in a river, rising away from its mouth over half the surf's length. */
    still: number;
    /** How open it is to the wind, 0 to 1: how far the weather raises its waves (see {@link ZoneOcean.exposure}). */
    exposure: number;
}
/** What the current is at a reach this wide against the river's widest, against its nominal speed (half): a narrow reach is quick and a wide one slow. */
declare function currentShare(width: number, widest: number): number;
/** The baked water of a zone. */
declare class WaterField {
    readonly grid: ZoneGrid;
    readonly height: Float32Array;
    readonly shore: Float32Array;
    readonly amp: Float32Array;
    readonly calm: Float32Array;
    readonly swell: Float32Array;
    readonly flowX: Float32Array;
    readonly flowZ: Float32Array;
    readonly depth: Float32Array;
    /** The distance the surf runs in by (see {@link FieldSample.surf}). */
    readonly surf: Float32Array;
    /** How much of the surf a current leaves (see {@link FieldSample.still}). */
    readonly still: Float32Array;
    /** How steep the shore is, 0 (a gentle beach) to 1 (rock, a cliff): where waves burst white rather than wash up. */
    readonly steep: Float32Array;
    readonly exposure: Float32Array;
    /** The body that owns the most of each texel, as its key; -1 where there is no water. */
    readonly owner: Int32Array;
    /** The ocean, which goes on past the region: what a point outside it is. */
    readonly ocean: ZoneOcean | null;
    private constructor();
    /**
     * Bakes `bodies` over `grid`. Each texel takes every body's say (its height, its distance to its own shore, its waves and current) and
     * weighs them by how far inside each it is, over a texel and a half, so where two bodies meet the values run from one to the other.
     * The lakes come first, then the rivers have what they leave (a river runs into a lake and is the lake there), and the ocean what both leave. A texel no body holds keeps the height of the nearest water, so the
     * surface's vertices there (which the shore cuts away) do not pull the water's edge down to nothing.
     */
    static bake(grid: ZoneGrid, bodies: readonly ZoneBody[], ground?: ZoneGround, surfLength?: number): WaterField;
    /** {@link WaterField.bake} as a job that yields its progress (0 to 1) every few rows, for spreading over frames. */
    static baking(grid: ZoneGrid, bodies: readonly ZoneBody[], ground?: ZoneGround, surfLength?: number): Generator<number, WaterField, void>;
    /** The field at a world point inside the region, read as the texels around it blend; null outside the region. */
    at(x: number, z: number): FieldSample | null;
    /**
     * The water at a world point: the field inside the region, the ocean past it (as deep as it likes, waves whole), null where there is none.
     * `shore` above zero is water.
     */
    sample(x: number, z: number): FieldSample | null;
    /** The part of the field a world is laid out by (how deep water stands over a height, how far a point is from the shore), as a query over this field's own arrays. */
    query(): WaterQuery;
    private query_;
    /** The ranges the encoding spans, from what the field holds; the shore distance reaches `shoreReach` at least (as far out as the surf is drawn). */
    ranges(shoreReach?: number): ZoneRanges;
    private ranges_;
    private measure;
    /**
     * The field as two RGBA8 images, rows from minZ. heights (read texel by texel: filtered bytes are no number): rg the height, high byte
     * first; b the depth, as its square root (fine where the water is shallow, where the shore is drawn by it); a the swell (the body's waves' height). field (filtered): r the shore distance (0.5 at it, a signed square root); gb the current (0.5 still); a the calm.
     * exposure (filtered): r how open the water is to the wind; g the distance the surf runs in by; b how much surf a current leaves; a how steep the shore is. Each over its range in `r`.
     */
    encode(r: ZoneRanges): {
        heights: Uint8Array;
        field: Uint8Array;
        exposure: Uint8Array;
    };
}

/** What a body of water is. A river follows the `Spline` on its own entity. */
declare const WaterForm: {
    readonly Ocean: 0;
    readonly Lake: 1;
    readonly River: 2;
};
/** The fields of the `WaterBody` component. @experimental */
interface WaterBodyData {
    /** {@link WaterForm}. */
    form: number;
    /** What the game calls the body, the same in every session (an entity's number is not): what a query names the water by. */
    bodyId: string;
    /** A lake's extent along x and z, centred on its entity, when it has no outline of its own. An ocean has none: it goes on past the zone. */
    sizeX: number;
    sizeZ: number;
    /** A lake's outline: three points or more round it on its own xz plane (x, y is x, z). Empty is the rectangle of `sizeX` by `sizeZ`. */
    boundary: Point2[];
    /** How far in from the shore, and how deep, the waves take to come to full height; 0 leaves them whole to the edge. */
    shoreWidth: number;
    /** A river's current, in world units a second where the river is as wide as its widest; a narrower reach runs faster. */
    flowSpeed: number;
    /** The height of the tallest wave, in world units. Their length, speed and heading are the zone's, which every body shares. */
    waveHeight: number;
    /** How deep a river cuts its bed into the terrain under its surface, at its middle; 0 leaves the ground as it is. */
    bedDepth: number;
}
/**
 * A body of water. Presence is the opt-in; it is drawn as part of its zone's surface.
 *
 * @experimental
 */
declare const WaterBody: ComponentDef<WaterBodyData>;
/** What {@link Waters.sample} answers. */
interface WaterSample {
    /** The entity of the body that holds the most of the water there, and what the game calls it (its `bodyId`). */
    entity: Entity;
    bodyId: string;
    /** How far the point is above the surface (negative under it), in world units. */
    depth: number;
    /** The surface's normal at the point, in world space. */
    normal: [number, number, number];
    /** How the water moves there, in world units a second (a river's current; still water is zero). */
    flow: [number, number, number];
    /** The world position of the surface above or below the point. */
    surface: [number, number, number];
    /** Whether the point is over water: always, for an answer that is not null. */
    inside: boolean;
}
/** What the quality level lets water spend: waves summed, the ripple grid's side, whether waves lift the geometry, the mirror from below, the sun's light through it. */
interface WaterQuality {
    waves: number;
    rippleCells: number;
    displacement: boolean;
    mirror: boolean;
    caustics: boolean;
}
/** Run-time access to the water: where its surface is at a point, for what floats on it or swims in it. */
declare class Waters {
    /** @internal */ app_: App | null;
    /** What the quality level allows now; the plugin refreshes it each frame, and what is drawn and what is answered both follow it. */
    quality: WaterQuality;
    /** The baked water, and the zone it was baked by. @internal */
    field_: WaterField | null;
    /** @internal */ zone_: WaterZoneData;
    /** The ripples the zone keeps, where it asks for them. @internal */
    ripples_: RippleField | null;
    /** The material instance the surface is drawn with, for what draws the same water (the underwater effect). @internal */
    instance_: number;
    /** Bumped each time a new bake lands, so what is placed by the water (plants kept out of it) knows to place again. @internal */
    revision_: number;
    /** Whether a bake is in hand: what is placed by the water waits for it. */
    baking: boolean;
    /** The baked water as data a worker can answer `depthAt` and `shoreAt` from, or null where none is baked. */
    queryData(): WaterQueryData | null;
    /**
     * Whether there is no water to ask about: nothing is baked, so `depthAt` answers null everywhere. A world laid out with no water at
     * all is laid out the same here and on a worker, which "no data to hand over" alone does not say.
     */
    get empty(): boolean;
    /** How deep the water stands at rest over the world height `y` at (x, z): above zero under water, null where there is none. */
    depthAt(x: number, z: number, y: number): number | null;
    /**
     * The surface over or under `(x, y, z)`: how far above it the point is (negative under), the surface's normal, the current, and the point
     * on it straight above or below. Null where there is no water. The waves are read at the instant of the frame.
     */
    sample(x: number, y: number, z: number): WaterSample | null;
    /**
     * Disturbs the water at the world point (x, y, z): a bump of `strength` world units (negative is a dip) over `radius`, which spreads as a ring and leaves foam.
     * Does nothing where there is no water or where the zone keeps no ripples.
     */
    disturb(x: number, y: number, z: number, radius: number, strength: number): boolean;
    /** The height the ripples add to the surface at the world point, where the zone keeps them; 0 elsewhere. */
    rippleAt(x: number, _y: number, z: number): number;
    /**
     * The body of water at (x, z) and its surface at rest, or null where there is none: which water a place belongs to, for what a game
     * keeps per body (a fishing spot, a level it raises) and a placement that keeps by the shore.
     */
    bodyAt(x: number, z: number): {
        entity: Entity;
        bodyId: string;
        form: number;
        level: number;
    } | null;
    /**
     * How far (x, z) is from the water's edge, across the ground: above zero on dry land (how far to the nearest water), below it on the
     * water (how far in from its shore). Past the zone's region it is the open sea's, deep in; null where no water is baked at all.
     */
    shoreAt(x: number, z: number): number | null;
    private bodyIdOf;
    /** The world height of the surface above or below (x, z), or null where there is none. */
    heightAt(x: number, z: number): number | null;
    /** The waves as they stand where the zone says they are `amp` high: the zone's, at that height, raised by the weather as far as the water is open to it. */
    private waves;
}
/** The resource the plugin installs. @experimental */
declare const WatersRes: ResourceDef<Waters>;
declare class WaterPlugin implements Plugin {
    name: string;
    /** Nothing to bake, carve or draw without a body or a zone; the frame after the last one goes still runs, and lets go. */
    readonly activeWhen: (ComponentDef<WaterBodyData> | ComponentDef<WaterZoneData>)[];
    /** The stock material the surface is an instance of when the zone names none, made once from the Water shader. */
    private stock_;
    /** The resource this plugin installed. */
    private waters_;
    private key_;
    private surface_;
    private epoch_;
    /** The bake in hand, for the inputs `key` names; the field drawn until it lands is the last one baked. */
    private baking_;
    /** The beds cut into the terrain, by river: what they were cut from, and the ids of their modifiers. */
    private beds_;
    build(app: App): void;
    cleanup(app?: App): void;
    /** The world position of the active camera, or null where there is none (the editor's scene view has no entity). */
    private eye;
    /** The middle of the zone's region: where the surface and the ripples stay without a camera to follow. */
    private middle;
    /**
     * The bodies as the zone takes them, in the world, the zone's settings, and the region they are baked over: the `WaterZone`'s, or without
     * one a region round every lake and river with a margin for their shores.
     */
    private gather;
    /**
     * Cuts each river's bed into the terrain, and gives the ground back where a river stops cutting or is gone. A bed is laid again only
     * when the river it is cut from changes: the water baked over the cut ground does not cut it again.
     */
    private carve;
    /** The world height of the ground, where a terrain is built. */
    private ground;
    /** The material the surface is an instance of when the zone names none: the Water shader, compiled once. */
    private stock;
    /** The surface, made (or remade, where its mesh or its material changed) as the zone asks. */
    private surface;
    private build_;
    /** Puts the baked field where the shader reads it: the heights texel by texel, the rest filtered. */
    private upload;
    /** Writes the zone into the instance, and moves the surface to the camera on the lattice its rings line up on. */
    private update;
    /**
     * Keeps the zone's ripples: makes the grid when `ripples` asks for one, moves its window to the camera, steps it, and (where drawn) puts it where the shader reads it.
     * It runs headless too, so the surface a test or a server asks about has them.
     */
    private ripple;
    private dropRipples;
    private dropFieldTextures;
    private dropSurface;
}
declare const waterPlugin: Plugin;

/**
 * @file    waterMesh.ts
 * @brief   The geometry of a zone's water: rings of coarsening grids that follow the camera.
 *
 * @details It lies in the xz plane facing up, with the uv the position itself (so the Water shader's surface space is x and z, plus
 *          `u_origin`), and the vertex colour's red the number of the ring the vertex is in, in sevenths (`cell * 2^(red * 7)`
 *          is its cell size: the Water shader's vertex hook fades the waves a coarse ring cannot draw by it).
 *
 *          The surface is rings, each a grid of the same number of cells with twice the cell size of the one inside it and a hole where that one
 *          sits. Where two rings meet the coarse one has half the vertices along the edge, so the surfaces can part there by what the waves
 *          do between its vertices; the fade keeps that to waves the coarse ring can already draw.
 */

/**
 * An ocean of `rings` rings of `cells` cells a side (a multiple of four), the innermost with `cellSize` cells. It reaches
 * `cells * cellSize * 2^(rings - 1) / 2` out from its centre, and with `skirt` a flat apron runs on from there to that
 * half-extent: the sea out to the horizon, at the cost of one cell's quads along each side.
 */
declare function buildOceanMesh(cells: number, rings: number, cellSize: number, skirt?: number): MeshData;
/** The outer half-extent of an ocean built with these numbers. */
declare function oceanReach(cells: number, rings: number, cellSize: number): number;
/** The cell size of the coarsest ring: the lattice an ocean follows its camera on, so every ring stays aligned. */
declare function oceanSnap(rings: number, cellSize: number): number;

/**
 * @file    waterfall.ts
 * @brief   Water falling from a lip: sheets thrown out at a speed and pulled down by gravity until they meet the ground or water.
 *
 * @details A river's surface is a field over the ground and cannot stand on end, so where a river comes to a cliff it stops. A `Waterfall`
 *          is what goes on from there: put the entity at the lip, facing the way the water leaves it (its forward), and the sheets are the
 *          path a thing thrown level at `speed` takes (only the entity's turn about the vertical aims it: keep it upright and unscaled), built as the entity's own MeshRenderer so a material on it can be anything. With no
 *          material it takes the stock Waterfall shader (waterfallShader.ts). Each sheet ends where it meets the ground, or water that is
 *          not the water it left, or `maxDrop` under the lip, whichever is first; it is made again when its fields, the entity's place or the ground change. The
 *          terrain and the water are asked by name: with neither, a fall is `maxDrop` high.
 *
 *          What a vertex carries for a material: uv.x across the sheet (0 to 1), uv.y the seconds the water there has been falling, colour
 *          red the share of the fall done (0 at the lip, 1 at the foot), green a number of the sheet's own (so sheets do not move as one),
 *          and alpha 0 at the sheet's two edges.
 *
 *          The sheet is all a fall draws. What belongs at a place on it (the mist at its foot, the sound of it) is a child entity
 *          with a `WaterfallAnchor`, kept on the middle of the fall at a share of the way down wherever the fall lands.
 */

/** The fields of the `Waterfall` component. @experimental */
interface WaterfallData {
    /** How wide the water is where it leaves the lip, in world units. */
    width: number;
    /** How fast it leaves the lip, level and along the entity's forward, in world units a second. Faster throws it further out. */
    speed: number;
    /** How much wider a sheet is at its foot than at the lip, as a share of its width: 1 is twice as wide. */
    flare: number;
    /** How many sheets, 1 to 5, one behind another along the throw: the middle one whole, the others narrower. */
    sheets: number;
    /** How far apart the sheets leave the lip, in world units. */
    sheetGap: number;
    /** How far under the lip a fall that meets nothing ends, in world units. */
    maxDrop: number;
    /** Rows down a sheet and cells across it. */
    rows: number;
    across: number;
}
/**
 * Falling water from the entity's place along its forward, drawn as the entity's MeshRenderer.
 *
 * @experimental
 */
declare const Waterfall: ComponentDef<WaterfallData>;
/** The fields of the `WaterfallAnchor` component. @experimental */
interface WaterfallAnchorData {
    /** Where on the fall, as a share of the time the water takes to come down: 0 the lip, 1 the foot. */
    at: number;
    /** How far above the fall's path there, in world units. */
    lift: number;
}
/**
 * Keeps the entity, a child of a `Waterfall`'s, on the middle of the fall: at its foot wherever that is, or a share of the way down.
 *
 * @experimental
 */
declare const WaterfallAnchor: ComponentDef<WaterfallAnchorData>;
/** Where an anchor sits in the fall's own space (the throw along -z), on a fall that takes `seconds` to come down. */
declare function waterfallAnchorPoint(fall: WaterfallData, seconds: number, anchor: WaterfallAnchorData): [number, number, number];
/**
 * What a fall lands on: the ground's height at a place, and the water there (which body's it is, and how far `y` is above its surface,
 * negative under it), null where there is none. Either may be absent.
 */
interface WaterfallLanding {
    heightAt?(x: number, z: number): number | null;
    waterAt?(x: number, z: number, y: number): {
        body: number;
        above: number;
    } | null;
}
/** The lip in the world: where it is and the level direction the water leaves along (unit, on xz). */
interface WaterfallLip {
    x: number;
    y: number;
    z: number;
    dirX: number;
    dirZ: number;
}
/** The seconds a sheet thrown from `lip`, `ahead` along the throw, falls before it lands, and the drop that is. */
declare function waterfallFlight(fall: WaterfallData, lip: WaterfallLip, landing: WaterfallLanding | null, ahead?: number): {
    seconds: number;
    drop: number;
};
/**
 * The sheets' geometry in the entity's own space, where the throw is along -z: the entity's turn about the vertical is what aims it in the
 * world, and `lip` says where that is for what the sheets land on. Null where there is nothing to draw. Rows are closer together near the
 * lip, where the path turns the most.
 */
declare function buildWaterfall(fall: WaterfallData, lip: WaterfallLip, landing: WaterfallLanding | null): MeshData | null;
/** The level direction an entity turned by `q` faces along (its forward, -z, laid on the ground), or -z where it faces straight up or down. */
declare function waterfallHeading(q: {
    x: number;
    y: number;
    z: number;
    w: number;
}): [number, number];

declare const WATERFALL_SHADER_TEMPLATE: BuiltinShaderTemplate;

/**
 * @file    basins.ts
 * @brief   Where water would gather and how it would run off a piece of ground: basins with their spill levels and outlets, and the
 *          drainage down to the edge. For a game to decide its lakes, rivers and sea, not water that is drawn.
 *
 * @details One priority flood (Barnes et al., 2014) from the region's edge, lowest first. Each texel is reached from a neighbour no
 *          higher than it would drain to, so:
 *            - a texel reached from above its own ground is in a basin, filled to the level the flood stood at: the basin's spill
 *              level, where a lake there would run over, through its outlet;
 *            - the texel each one was reached from is where its water goes, so every texel drains along a tree to the edge, flats and
 *              basins included, and the accumulation along it (how many texels drain through each) is where rivers run;
 *            - with a sea level, low ground the flood reaches from the edge without climbing over it is sea; a basin below the sea that
 *              is walled off from it stays a basin (dry, or a lake at its own level).
 *          The answer depends only on the ground and the region, never on the order anything is asked.
 */

/** A basin: the texels a lake filling it to its spill level would cover. */
interface Basin {
    id: number;
    /** The height water stands at when the basin is full: the lowest point of its rim. */
    level: number;
    /** How many texels it covers, and its deepest point. */
    cells: number;
    deepest: {
        x: number;
        z: number;
        y: number;
    };
    /** Where it runs over its rim, and the texel index there. */
    outlet: {
        x: number;
        z: number;
        y: number;
        index: number;
    };
}
interface BasinMap {
    grid: ZoneGrid;
    /** The ground's height per texel (row by row from minZ), and the height water would fill it to. */
    ground: Float32Array;
    filled: Float32Array;
    /** The texel each one drains to; -1 at the edge, where water leaves the region. */
    downstream: Int32Array;
    /** How many texels drain through each, itself included. */
    accumulation: Float32Array;
    /** The basin each texel is in, or -1. */
    basin: Int32Array;
    /** 1 where the ground is the sea's (with a sea level). */
    sea: Uint8Array;
    basins: Basin[];
}
interface BasinOptions {
    /** The sea's level: low ground joined to the edge below it is sea, not basin. */
    seaLevel?: number;
    /** A basin shallower than this, or of fewer texels, is not kept as one (its texels still drain through it). */
    minDepth?: number;
    minCells?: number;
}
/** The basins and drainage of the ground over `grid`. Ground not known is taken as the sea's level (or as low as the lowest known). */
declare function findBasins(grid: ZoneGrid, ground: (x: number, z: number) => number | null, options?: BasinOptions): BasinMap;
/** The path water takes from (x, z) down the drainage, texel by texel, to the region's edge: a river's course, as world points. */
declare function drainPath(map: BasinMap, x: number, z: number): {
    x: number;
    z: number;
    y: number;
}[];

export { RippleField, WATERFALL_SHADER_TEMPLATE, WAVE_SET, WaterBody, WaterField, WaterForm, WaterPlugin, WaterZone, Waterfall, WaterfallAnchor, Waters, WatersRes, buildOceanMesh, buildWaterfall, currentShare, drainPath, findBasins, oceanReach, oceanSnap, polygonSdf, shoreDamp, waterPlugin, waterfallAnchorPoint, waterfallFlight, waterfallHeading, waveFade, waveHeight, waveSlope };
export type { Basin, BasinMap, BasinOptions, FieldSample, Point2, WaterBodyData, WaterSample, WaterZoneData, WaterfallAnchorData, WaterfallData, WaterfallLanding, WaterfallLip, WaveParams };
