import { ComponentDef, Plugin, App, MeshRendererGeometry } from './app.js';
import { Vec2 } from './wasm.js';

/**
 * @file    curve.ts
 * @brief   A smooth curve through a list of points, measured by the distance along it.
 *
 * @details A centripetal Catmull-Rom curve (it passes through every point and does not loop where they are unevenly spaced) cut into short straight pieces, with the length of each summed, so a place on
 *          the curve is a distance `s` from its start and not a parameter that runs fast where the points are close and slow where
 *          they are far. That is what a river's width and speed, a road's banking or a rail's pace are written against. The points are
 *          in the curve's own space; where it is in the world is its entity's Transform.
 *
 *          Each point carries a width, interpolated along the curve (a river narrows at a rapid, a road widens at a junction).
 */
/** A point of a curve: where it is, and how wide the thing along it is there. */
interface SplinePoint {
    x: number;
    y: number;
    z: number;
    width: number;
}
/** Where on a curve a point is nearest, and how far from it. */
interface SplineNearest {
    /** The distance along the curve. */
    s: number;
    /** The distance from the query point to the curve. */
    distance: number;
    /** Which side of the curve the point is on: the sign of the xz cross product of the curve's heading and the offset to the point. */
    side: number;
}
/** The curve through `points`, open or closed. */
declare class SplineCurve {
    /** The straight pieces the curve is cut into: positions, widths, and the distance along the curve at each (one longer than the pieces). */
    private readonly px;
    private readonly py;
    private readonly pz;
    private readonly pw;
    private readonly ps;
    readonly count: number;
    /** The length of the curve. */
    readonly length: number;
    readonly closed: boolean;
    constructor(points: readonly SplinePoint[], closed?: boolean);
    /** The index of the piece `s` falls in, and how far along it (0 to 1). */
    private locate;
    private next;
    /** The point a distance `s` along the curve. Past either end of an open curve it is the end; a closed curve goes round. */
    position(s: number): [number, number, number];
    /** The unit direction of travel at distance `s`. */
    tangent(s: number): [number, number, number];
    /** The width at distance `s`. */
    width(s: number): number;
    /** Where on the curve (x, z) is nearest, measured in the xz plane. */
    nearest(x: number, z: number): SplineNearest;
}

/**
 * @file    splineComponent.ts
 * @brief   The Spline component alone, which the plugin that drives it and what is built from it both read.
 */

/** The fields of the `Spline` component. @experimental */
interface SplineData {
    /** The points the curve passes through, in the entity's own space, in order, each with the width of whatever follows it there. */
    points: SplinePoint[];
    /** Whether the curve joins its end to its start. Needs three points. */
    closed: boolean;
}
/**
 * A curve through points. It is read by what follows it (a river's `WaterBody` on the same entity, a {@link PathFollower} on another).
 *
 * @experimental
 */
declare const Spline: ComponentDef<SplineData>;

/**
 * @file    splinePlugin.ts
 * @brief   The Spline component: a curve through a few points, authored once and read by whatever follows it.
 *
 * @details A `Spline` is data and nothing draws it: a river, a road or a camera rail reads it from the same entity and builds what it needs
 *          (see {@link SplineCurve}). The points are in the entity's own space, so moving or turning the entity moves the whole curve.
 *          The one thing that runs each frame is what follows it: a {@link PathFollower} moves its own entity along the curve of another.
 */

/** What a {@link PathFollower} does at the end of the curve. */
declare const PathMode: {
    readonly Once: 0;
    readonly Loop: 1;
    readonly PingPong: 2;
};
/** How a {@link PathFollower} turns to the way it is going. */
declare const PathOrient: {
    /** Keeps the rotation it has. */
    readonly None: 0;
    /** Turns about y to face along the curve, +z forward: a 3D walker on the ground. */
    readonly FaceXZ: 1;
    /** Turns about z to face along the curve, +x forward: a 2D sprite. */
    readonly FaceXY: 2;
};
/** The fields of the `PathFollower` component. @experimental */
interface PathFollowerData {
    /** The entity that holds the `Spline` to follow. */
    spline: number;
    /** World units a second along the curve; negative runs it backwards. */
    speed: number;
    /** How far along the curve it has gone, in world units. Written each frame; set it to start part-way along. */
    distance: number;
    /** {@link PathMode}. */
    mode: number;
    /** {@link PathOrient}. */
    orient: number;
    /** Whether it is moving. A `Once` follower stops itself at the end. */
    playing: boolean;
}
/**
 * Moves its entity along the `Spline` of another: an enemy on a patrol route, a platform on a rail, a camera on a track. It sets the entity's
 * own `position` (and `rotation`, when asked), so a follower sits at the top of the hierarchy. The curve is read through its entity's
 * Transform, so moving, turning or scaling the spline moves the whole route. It advances by the length of the curve, not by its parameter,
 * so it goes at `speed` everywhere on it.
 *
 * @experimental
 */
declare const PathFollower: ComponentDef<PathFollowerData>;
/**
 * Where a follower that has gone `travelled` along a curve of `length` stands, and whether a `Once` follower has run out of curve going the way
 * it was going (`forward`).
 */
declare function pathPlace(travelled: number, length: number, mode: number, forward?: boolean): {
    s: number;
    done: boolean;
};
declare class SplinePlugin implements Plugin {
    name: string;
    private readonly curves_;
    build(app: App): void;
    private curveOf;
    private follow;
}
declare const splinePlugin: Plugin;

/**
 * @file    terrainBand2D.ts
 * @brief   A 2D ground drawn along a Spline: a filled body, a lip along its surface, and the chain collider that stands on it.
 *
 * @details An open spline is a ground profile: the fill reaches from the curve down to `depth` below its lowest point, and the lip runs along
 *          the curve. A closed one is a shape (an island, a platform): the fill is what it encloses and the lip runs round the inside of
 *          its rim. Either way the curve is read in the entity's own x, y, the way a sprite is, so moving the entity moves the ground.
 *
 *          The mesh is the entity's own MeshRenderer geometry (so it sorts, batches and saves like any other, and the renderer's texture
 *          and tint apply), rebuilt only when the spline or the band's fields change. The fill's texture coordinates are in world units
 *          over `tile`, so a texture repeats at one size however the curve is drawn.
 */

/** The fields of the `TerrainBand2D` component. @experimental */
interface TerrainBand2DData {
    /** How far apart, along the curve, the points of the outline are: smaller is smoother and costs more triangles. */
    resolution: number;
    /** An open spline's fill reaches this far below its lowest point. A closed one ignores it. */
    depth: number;
    /** The length of one repeat of the fill's texture, in world units. */
    tile: number;
    /** How wide the lip along the surface is, drawn over the fill; 0 draws none. */
    edgeWidth: number;
    /** The lip's colour, multiplying the texture under it. */
    edgeColor: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    /** An image the lip is drawn with, repeating along the surface (grass, snow, a rocky rim). None draws the lip as a flat colour in the fill's own mesh. */
    edgeTexture: number;
    /** The length of one repeat of the lip's image along the surface, in world units. */
    edgeTile: number;
    /** Whether the band gives its entity a chain collider along the surface, for a static body to carry. */
    collider: boolean;
}
/**
 * Ground along the `Spline` of the same entity, drawn by the entity's MeshRenderer.
 *
 * @experimental
 */
declare const TerrainBand2D: ComponentDef<TerrainBand2DData>;
/** What a band is built into: the mesh, and the outline its collider follows. */
interface TerrainBandBuild {
    geometry: MeshRendererGeometry;
    /** The lip as a mesh of its own, with its image laid along the surface by arc length, when the band has an `edgeTexture`; the lip is then not in `geometry`. */
    edge: MeshRendererGeometry | null;
    /** The surface, in the entity's own space: the curve for an open spline, the ring for a closed one. */
    outline: Vec2[];
    closed: boolean;
}
/**
 * The geometry of a band over `points`. Pure: the same inputs give the same mesh.
 *
 * @experimental
 */
declare function buildTerrainBand(points: readonly SplinePoint[], closedCurve: boolean, band: TerrainBand2DData): TerrainBandBuild | null;

export { PathFollower, PathMode, PathOrient, Spline, SplineCurve, SplinePlugin, TerrainBand2D, buildTerrainBand, pathPlace, splinePlugin };
export type { PathFollowerData, SplineData, SplineNearest, SplinePoint, TerrainBand2DData, TerrainBandBuild };
