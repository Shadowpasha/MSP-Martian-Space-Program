import { Vec3 } from './wasm.js';

/**
 * @file    NavSurface.ts
 * @brief   What "somewhere an agent can walk" means to everything that uses one.
 *
 * There are two honest representations of a navigable world and they do not
 * overlap. A uniform GRID is what a tilemap already is — authored cell by cell,
 * editable a cell at a time while the game runs, and exactly as accurate as the
 * tiles it came from. A polygon MESH is what arbitrary geometry reduces to —
 * it follows sloped and multi-level ground, which no single grid can, and its
 * cost is that it is baked rather than poked.
 *
 * Everything above them asks the same three questions, so they meet here and not
 * in each consumer: the agent driver, the resource games query, the running
 * overlay and the editor viewport all speak to a `NavSurface` and never learn
 * which kind they were handed.
 */

/** A world point a caller may name in two axes — a flat scene has no third. */
interface NavPoint {
    x: number;
    y: number;
    z?: number;
}
interface NavQueryOptions {
    /**
     * How wide the body being routed is, in world pixels. A path planned for a
     * point is a path only the centre of an agent fits through. 0 (the default)
     * plans for a point.
     */
    radius?: number;
}
/** Completeness refers to the surface's resolved (possibly snapped) destination. */
interface NavPathResult {
    path: Vec3[] | null;
    status: 'complete' | 'partial' | 'unavailable' | 'unknown';
    reason: 'none' | 'no-surface' | 'building' | 'start-unavailable' | 'target-unavailable' | 'disconnected' | 'insufficient-clearance' | 'radius-mismatch' | 'diagnostics-unavailable';
}
/**
 * Where a surface hands out its shape, for a drawer to turn into lines. A
 * visitor rather than a returned array because the caller is a per-frame overlay
 * over thousands of faces: the corner array a `face` call is given belongs to
 * the surface and is only valid until that call returns.
 */
interface NavSurfaceSink {
    /** One walkable face — a closed convex polygon, in world space. */
    face(corners: readonly Vec3[]): void;
    /** An edge the walkable world STOPS at: a wall, a ledge, a drop. */
    border(a: Vec3, b: Vec3): void;
    /** A way between two places the ground does not join — see `NavLink`. A
     *  surface with no such thing simply never calls it. */
    link(a: Vec3, b: Vec3): void;
}
/** The active navigable world, however it was built. */
interface NavSurface {
    /**
     * Which way is OFF the ground here — the direction anything drawn ON this
     * surface is lifted along so it does not fight the floor for pixels. A flat
     * grid's is +Z, toward the viewer of a scene laid out in x/y; a spatial
     * mesh's is +Y, out of the ground it follows.
     */
    readonly up: Vec3;
    /**
     * Plan a world-space route between two world points, or null when there is
     * no way. The waypoints carry all three axes: on a flat surface the third is
     * the plane the scene is drawn on, on a spatial one it is the ground the
     * route walks over.
     */
    findWorldPath(from: NavPoint, to: NavPoint, opts?: NavQueryOptions): Vec3[] | null;
    /** Optional for custom surfaces; built-ins distinguish partial routes from arrival. */
    queryWorldPath?(from: NavPoint, to: NavPoint, opts?: NavQueryOptions): NavPathResult;
    /**
     * Whether a body may occupy a world point, including sideways avoidance.
     * Grids test disk radii against tile faces and bounds; meshes reject bodies
     * larger than their bake. Custom surfaces may retain point-only checks.
     */
    isNavigable(p: NavPoint, opts?: NavQueryOptions): boolean;
    /** Hand the shape of the walkable world to a drawer. */
    describe(sink: NavSurfaceSink): void;
}

/**
 * @file    NavGrid.ts
 * @brief   Uniform navigation grid — a walkability bitmap plus the affine map
 *          between grid cells and world space.
 *
 * The representation for a world that IS a grid: a tilemap, or any flat scene
 * whose ground is one plane. Its two advantages over a baked mesh are that it
 * costs nothing to build from data that is already cells, and that a single cell
 * can be flipped while the game runs — a door closes, a tower goes up. Ground
 * that slopes or stacks is not its question; that is {@link NavMesh}.
 *
 * Pure data + math, zero engine/wasm dependency, so the whole pathfinding core
 * is unit-testable in isolation. The engine binding (build one from a tilemap
 * layer) lives beside it; A* in pathfind.ts.
 */

/** Integer grid coordinate. Its own type rather than a world vector, so a cell
 *  coordinate cannot be passed where world pixels are expected. */
interface Cell {
    x: number;
    y: number;
}
interface NavGridOptions {
    /** Cell columns. */
    width: number;
    /** Cell rows. */
    height: number;
    /** World pixels per cell (square). */
    cellSize: number;
    /** World position of cell (0,0)'s centre. Its `z` is the depth every waypoint
     *  comes back at — the plane the scene is drawn on. Defaults to the origin. */
    origin?: {
        x: number;
        y: number;
        z?: number;
    };
    /**
     * Walkability, row-major `width * height`, 1 = walkable / 0 = blocked.
     * Defaults to fully walkable. Copied in, not retained.
     */
    walkable?: ArrayLike<number>;
}
/**
 * A uniform-cost square grid with a walkability mask. `gy` increases with world
 * +Y; a Y-down source (e.g. a tilemap) flips rows when it builds the grid, so
 * NavGrid itself stays direction-agnostic.
 */
declare class NavGrid implements NavSurface {
    /** The grid lies in x/y, so off it is toward whoever is looking at the scene. */
    readonly up: Vec3;
    readonly width: number;
    readonly height: number;
    readonly cellSize: number;
    /** Cell (0,0)'s centre. */
    readonly originX: number;
    readonly originY: number;
    /** The depth the grid lies at — carried onto every waypoint it hands back. */
    readonly originZ: number;
    /** Row-major walkability, 1 = walkable. Mutable via {@link setWalkable}. */
    readonly walkable: Uint8Array;
    /** Cells an obstacle is standing on, or null while nothing blocks. Kept apart
     *  from `walkable` so a door closing and reopening cannot erase the map. */
    private obstructed_;
    /** What crossing each cell costs, or null while it all costs the same. */
    private cost_;
    private topologyRevision_;
    /** @internal Invalidates derived connectivity after walkability changes. */
    get topologyRevision(): number;
    constructor(opts: NavGridOptions);
    index(gx: number, gy: number): number;
    inBounds(gx: number, gy: number): boolean;
    isWalkable(gx: number, gy: number): boolean;
    setWalkable(gx: number, gy: number, walkable: boolean): void;
    /**
     * Put something in the way of a cell, or take it out again. The map's own
     * walkability is untouched: an obstacle is a thing standing ON the ground, and
     * lifting it has to give back exactly the ground that was there.
     */
    setObstructed(gx: number, gy: number, obstructed: boolean): void;
    /** Lift everything off the ground at once, before the obstacles are re-marked. */
    clearObstructions(): void;
    /**
     * What crossing a cell costs, against 1 for open ground. Cheap makes a route
     * prefer it and dear makes it go round; it never blocks, because a price an
     * agent will not pay when there is another way is still one it pays when
     * there is not.
     */
    costAt(gx: number, gy: number): number;
    setCost(gx: number, gy: number, cost: number): void;
    /** Put every cell back to open-ground price, before the areas are re-marked. */
    clearCosts(): void;
    /**
     * Cells from here to the nearest thing that blocks — off the grid counts as
     * blocked. An agent is a body: a path hugging a wall is walkable for the
     * cell it was planned through and a wall for the half hanging over the next.
     * Computed on first ask, dropped when walkability changes.
     */
    clearanceAt(gx: number, gy: number): number;
    private clearance_;
    /** Centre of cell `(gx, gy)` in world space. */
    cellToWorld(gx: number, gy: number): Vec3;
    /** Cell containing a world point. May be out of bounds — caller checks. */
    worldToCell(p: NavPoint): Cell;
    /**
     * Nearest walkable cell to `(gx, gy)` by outward ring search, or null if the
     * whole grid is blocked. Used to snap a start/goal that lands on a wall onto
     * a usable cell before searching.
     */
    nearestWalkable(gx: number, gy: number, maxRadius?: number, clearance?: number): Cell | null;
    findWorldPath(from: NavPoint, to: NavPoint, opts?: NavQueryOptions): Vec3[] | null;
    isNavigable(p: NavPoint, opts?: NavQueryOptions): boolean;
    /** Diagnose a route without treating a best-effort partial path as arrival. */
    queryWorldPath(from: NavPoint, to: NavPoint, opts?: NavQueryOptions): NavPathResult;
    /**
     * Every walkable cell as a quad, and every edge where the walkable world
     * stops. The corner array is reused between calls — see {@link NavSurfaceSink}.
     */
    describe(sink: NavSurfaceSink): void;
}

export { NavGrid };
export type { Cell, NavGridOptions, NavPathResult, NavPoint, NavQueryOptions, NavSurface, NavSurfaceSink };
