import { NavGrid, Cell, NavSurface, NavPoint, NavQueryOptions, NavPathResult, NavSurfaceSink } from '../shared/NavGrid.js';
export { NavGridOptions } from '../shared/NavGrid.js';
import { Vec3, Quat, Entity } from '../shared/wasm.js';
import { World, ComponentDef, Plugin, App, AnyComponentDef, ComponentData, CommandsInstance, InputState, EventDef } from '../shared/app.js';
import { ResourceDef } from '../shared/resource.js';
import { FsmState, FsmDefinition, Blackboard, AiRegistry, FsmTransition, AiParamValue, Status } from '../shared/registry.js';
export { AiAction, AiActionInput, AiActionSpec, AiCondition, AiOutputDef, AiOutputs, AiParamDef, AiParams, AiTouches, AiValueSpec, BlackboardGuard, CompareOp, FsmActionRef, actionRefArg, actionRefName, actionRefParams, evalGuard, evalGuards, formatActionArg, invokeAction, parseActionArg } from '../shared/registry.js';
import { GraphEdge } from '../shared/AiContext.js';
export { AiContext, aiRegistry, registerAction, registerCondition, registerValue } from '../shared/AiContext.js';
import { Physics2DAPI } from '../shared/Physics2D.js';

/**
 * @file    pathfind.ts
 * @brief   A* over a {@link NavGrid} — pure, allocation-lean, unit-testable.
 *
 * Uniform-cost 4- or 8-connected search with a binary min-heap open set and
 * octile/manhattan heuristics. Diagonal steps never cut corners (both shared
 * orthogonal neighbours must be walkable), so an agent following the path can't
 * clip a wall corner.
 */

interface PathfindOptions {
    /** Allow 8-connected diagonal moves. Default true. */
    diagonal?: boolean;
    /**
     * When start/goal lands on a blocked cell, snap to the nearest walkable one
     * within this ring radius before searching. 0 disables snapping. Default 8.
     */
    snapRadius?: number;
    /**
     * Cells of room the agent needs on every step — a body has width, and a
     * path planned for a point hands it one that only its centre fits through.
     * 0 (default) plans for a point.
     */
    clearance?: number;
}
/**
 * Find a grid path from `start` to `goal`, inclusive of both endpoints. A goal
 * that cannot be reached yields the route to the reachable cell NEAREST it, and
 * the caller sees it fell short because it named the goal. Null means the START
 * is nowhere: a cell off the grid has no route from it.
 */
declare function findPath(grid: NavGrid, start: Cell, goal: Cell, opts?: PathfindOptions): Cell[] | null;
/** Convert a cell path to world-space waypoints (cell centres, on the grid's plane). */
declare function pathToWorld(grid: NavGrid, path: Cell[]): Vec3[];

/**
 * @file    NavMesh.ts
 * @brief   A polygon navigation mesh and the routes over it.
 *
 * The representation for a world made of geometry rather than cells: ground that
 * slopes, stacks and overhangs. Its polygons are convex, so a straight line
 * between two points of one is always walkable, and a route is therefore the
 * DOORWAYS it goes through rather than a chain of little steps — which is why a
 * path over a mesh comes out as a handful of turns instead of a staircase.
 *
 * Built by {@link buildNavMesh}; queried through {@link NavSurface} like any
 * other navigable world.
 */

/** A way between two places the ground does not join, in world space. */
interface NavLinkSegment {
    start: Vec3;
    end: Vec3;
    /** Whether it can be taken from `end` back to `start`. */
    bidirectional: boolean;
    /** How far from each end ground may be and still be joined. */
    radius: number;
}
interface NavMeshData {
    /** `vertCount * 3` world-space floats. */
    verts: Float32Array;
    /** `maxVertsPerPoly` vertex indices per polygon, padded with -1. */
    polys: Int32Array;
    /** `maxVertsPerPoly` neighbour polygon indices, one per edge, -1 for none. */
    neis: Int32Array;
    polyCount: number;
    maxVertsPerPoly: number;
    /**
     * How far the mesh was pulled back from every wall when it was baked. An
     * agent no wider than this fits along any route over it; the mesh IS the set
     * of places such an agent's centre may stand.
     */
    agentRadius: number;
    /**
     * How far off the mesh a world point may be and still be taken as standing
     * on it, in world pixels — the bake's own resolution, since a point is only
     * ever off by the grid it was voxelised on plus the erosion.
     */
    snapDistance: number;
    /** What crossing each polygon costs, as an area id the cost table is read by. */
    areas: Uint8Array;
    /**
     * How far above or below a point a floor may be and still be the one it
     * stands on. Over more than one floor the nearest wins; this is what makes a
     * point with no floor anywhere near it answer "nowhere" rather than name the
     * roof three storeys up.
     */
    verticalReach: number;
}
declare class NavMesh implements NavSurface {
    /** The mesh follows the ground, so off it is straight up. */
    readonly up: Vec3;
    readonly verts: Float32Array;
    readonly polys: Int32Array;
    readonly neis: Int32Array;
    readonly polyCount: number;
    readonly maxVertsPerPoly: number;
    readonly agentRadius: number;
    readonly snapDistance: number;
    readonly verticalReach: number;
    readonly areas: Uint8Array;
    /** What a unit of distance costs in each area, 1 for open ground. Read every
     *  search rather than baked in, so a swamp can dry out without a rebuild. */
    private areaCost_;
    /** Ways between polygons that share no edge, both directions listed separately. */
    private links_;
    private linksFrom_;
    /** Polygon bounds in the ground plane, four floats each — the whole of what
     *  the lookup below needs, and cheaper to scan than the vertices. */
    private readonly bounds;
    private readonly bucketMinX;
    private readonly bucketMinZ;
    private readonly bucketSize;
    private readonly bucketsX;
    private readonly bucketsZ;
    private readonly buckets;
    constructor(data: NavMeshData);
    /**
     * Say what an area costs to cross, against 1 for open ground. Cheap makes a
     * route prefer it and dear makes it go round; nothing here BLOCKS, because a
     * price an agent will not pay when there is another way is still a price it
     * pays when there is not.
     */
    setAreaCost(area: number, cost: number): void;
    /** What crossing polygon `p` costs a unit of distance. */
    costOf(p: number): number;
    /**
     * Join places the ground does not. Each segment is resolved to the polygons
     * under its two ends; one that reaches no ground at either end joins nothing
     * and is dropped, because a link to nowhere is a route that ends in the air.
     */
    connect(segments: readonly NavLinkSegment[]): void;
    /** How many links this mesh carries, counting each direction of a two-way one. */
    get linkCount(): number;
    private addLink;
    /** How many corners polygon `p` actually has. */
    vertexCount(p: number): number;
    /** World position of polygon `p`'s corner `i`, written into `out`. */
    corner(p: number, i: number, out: Vec3): Vec3;
    /** Whether `(x, z)` is inside polygon `p`, seen from above. */
    contains(p: number, x: number, z: number): boolean;
    /**
     * Height of polygon `p` at `(x, z)`. A convex polygon is not flat — its
     * corners came off a voxel grid — so the answer comes from the triangle of
     * the fan that covers the point, and from the nearest corner when the point
     * is outside every one of them.
     */
    heightAt(p: number, x: number, z: number): number;
    /**
     * The polygon a world point stands on, or -1. A point over more than one —
     * under a bridge, on a balcony — belongs to the floor nearest its own height,
     * which is the whole reason this mesh exists. `snap` overrides how far off the
     * mesh the point may be, for a caller that has its own idea of near.
     */
    findPoly(p: NavPoint, out?: Vec3, snap?: number): number;
    /** Squared distance from a point to polygon `p`'s boundary, with the closest
     *  point on it written into `hit`. */
    private distanceToEdges;
    findWorldPath(from: NavPoint, to: NavPoint, opts?: NavQueryOptions): Vec3[] | null;
    /** Refuse an undersized bake explicitly instead of returning an unsafe body route. */
    queryWorldPath(from: NavPoint, to: NavPoint, opts?: NavQueryOptions): NavPathResult;
    private planWorldPath;
    /**
     * The taut route, broken at every link. A link joins two points and nothing
     * between them, so the funnel is run over each RUN of polygons the route walks
     * and the runs are joined end to end — pulling one taut across a link would cut
     * the corner off a ladder.
     */
    private routeThroughLinks;
    /**
     * A* over the polygon graph, keyed on where each doorway is crossed. A goal it
     * cannot reach yields the route to the polygon it got NEAREST: an agent sent
     * somewhere it cannot get to walks to the door, and the caller sees it fell
     * short because it named the goal itself.
     */
    private findPolyPath;
    /**
     * Pull the route taut through the doorways it crosses — the funnel algorithm.
     * Without it a path is the chain of polygon midpoints the search happened to
     * visit; with it, it is the shortest line that stays inside them, and the
     * only corners left are the ones an agent really has to turn at.
     */
    private straightPath;
    isNavigable(p: NavPoint, opts?: NavQueryOptions): boolean;
    describe(sink: NavSurfaceSink): void;
    private bucketX;
    private bucketZ;
}

/**
 * @file    compact.ts
 * @brief   Compact heightfield — the OPEN space above each solid span, with the
 *          neighbours an agent can actually reach from it.
 *
 * The solid field says where the world is; this says where an agent may be. Two
 * open spans are neighbours only if the step between them is small enough to
 * climb and the gap is tall enough to stand in, so the connection graph here is
 * already the walkable one: everything after this reads adjacency instead of
 * re-deciding it.
 *
 * Flat typed arrays rather than the solid field's linked spans, because from
 * here on the field is walked far more often than it is built.
 */

/** A box that blocks, in world space, turned by its own rotation. */
interface NavObstacleBox {
    center: Vec3;
    halfExtents: Vec3;
    rotation: Quat;
}
/** The same box, marking ground that costs something other than open ground. */
interface NavAreaBox extends NavObstacleBox {
    /** Which area id the cells inside it take, 2 upwards. */
    area: number;
}

/**
 * @file    build.ts
 * @brief   Triangles in, {@link NavMesh} out — the whole bake, in one place.
 *
 * Voxelise, filter, partition, trace, polygonise. Each stage lives in its own
 * file and is testable on its own; this is the order they go in and the one
 * place the world's units (pixels, degrees) are turned into the voxel counts
 * every stage below actually works in.
 *
 * The stages and their order are Recast's (Mikko Mononen, zlib) — this is an
 * independent TypeScript implementation of that published pipeline, not a port of
 * its source. In TypeScript rather than a second wasm module because a bake runs
 * once per volume and splitting navigation across two languages costs more than
 * it buys.
 */

interface BuildNavMeshOptions {
    /** The box of world to bake, in world pixels. */
    min: Vec3;
    max: Vec3;
    /** Voxel size in the ground plane. The finer it is, the closer the mesh hugs
     *  the geometry and the longer the bake takes. */
    cellSize: number;
    /** Voxel size vertically. Wants to be several times smaller than `cellSize`,
     *  because it is what decides whether two floors are one. */
    cellHeight: number;
    /** Steepest ground an agent can stand on, in degrees from level. */
    maxSlopeDegrees?: number;
    /** How much room an agent needs above the floor, in world pixels. */
    agentHeight?: number;
    /** How wide the agent is. The mesh is pulled back from every wall by this, so
     *  routes over it clear the walls by construction. */
    agentRadius?: number;
    /** The tallest step an agent can walk up rather than round, in world pixels. */
    stepHeight?: number;
    /** How far, in world pixels, a simplified outline may stray from the raw one. */
    maxSimplificationError?: number;
    /** How long a wall edge may get before it is split, in world pixels. 0 leaves
     *  them alone. */
    maxEdgeLength?: number;
    /** Smallest patch of unreachable ground worth a polygon, in world pixels
     *  squared. Below this a stranded ledge is left out of the mesh entirely. */
    minRegionArea?: number;
    /** Corners a polygon may have. Six is the default this is tuned around. */
    maxVertsPerPoly?: number;
    /** Boxes that block without being geometry — see `NavObstacle`. */
    obstacles?: readonly NavObstacleBox[];
    /** Ways between places the ground does not join — see `NavLink`. */
    links?: readonly NavLinkSegment[];
    /** Boxes of ground that cost more or less to cross — see `NavArea`. */
    areas?: readonly NavAreaBox[];
}
declare function buildNavMesh(verts: Float32Array, indices: ArrayLike<number>, opts: BuildNavMeshOptions): NavMesh;

/**
 * @file    navGeometry.ts
 * @brief   The world's static collision surface, as triangles a navmesh can be
 *          baked from.
 *
 * The bodies a scene collides against ARE the ground it can walk on, so the bake
 * takes them as its source rather than a second authored description that can
 * disagree with them. Which collider on an entity counts is decided by the same
 * projection the editor gizmo and the physics overlay read, so a navmesh cannot
 * be baked from a shape nobody can see.
 *
 * STATIC bodies only. A crate that is about to be pushed is not floor, and a
 * mesh baked over one describes the world for exactly as long as nobody touches
 * it — a moving obstacle is a job for avoidance, not for the bake.
 */

/** World-space triangle soup: `verts` is `vertexCount * 3` floats. */
interface NavGeometry {
    verts: Float32Array;
    indices: Uint32Array;
    /** How many bodies went into it — zero is the difference between "baked an
     *  empty world" and "baked a world with no static geometry in it". */
    bodyCount: number;
}
interface CollectNavGeometryOptions {
    /** Only geometry touching this box is collected. */
    min: Vec3;
    max: Vec3;
    /** Physics layers the ground is on, as a mask; 0 (the default) takes them all. */
    layers?: number;
}
/**
 * Whether every static body's shape is available — a mesh collider has none until
 * its asset loads, and a bake that ran first would leave a hole where the level
 * is. Read from the components, not the shape projection: an unloaded mesh
 * produces no shape at all, so the projection would always report nothing amiss.
 */
declare function navGeometryReady(world: World, layers?: number): boolean;
declare function collectNavGeometry(world: World, opts: CollectNavGeometryOptions): NavGeometry;

/** Ownership of one replacement surface; build it separately from the live one. */
interface NavSurfaceUpdate {
    readonly version: number;
    readonly pending: boolean;
    readonly cancelled: boolean;
    /** Install only if this is still the current request. */
    commit(surface: NavSurface | null): boolean;
    /** Retain the previous surface and reject future commits from this request.
     * The producer owns stopping its underlying work. */
    cancel(): boolean;
}
declare class Navigation {
    private surface_;
    private surfaceUpdate_;
    private surfaceUpdateVersion_;
    /** Where agents may walk, or null until something builds and installs it. */
    get surface(): NavSurface | null;
    set surface(surface: NavSurface | null);
    /** Soft planning time budget per NavAgentSystem tick, in ms. At least one
     * query may run; a synchronous query cannot be interrupted. <=0 disables it. */
    planningBudgetMs: number;
    /** Maximum agent plans per tick; <=0 disables the count limit. */
    maxPlansPerFrame: number;
    /** Last agent tick; pending includes agents held for a surface update.
     * Time excludes movement, avoidance and baking. */
    readonly planningStats: {
        completed: number;
        pending: number;
        elapsedMs: number;
    };
    private pathRevision_;
    /** Revision used by agents to retire cached plans after an explicit update. */
    get pathRevision(): number;
    /** Agents retain destinations and wait while a replacement is pending. */
    get surfaceUpdatePending(): boolean;
    /** Stage an async producer's result without exposing a half-built surface.
     * Starting another request cancels the previous one's right to commit.
     * This schedules no worker; the producer owns computation and yielding. */
    beginSurfaceUpdate(): NavSurfaceUpdate;
    /** Replan agents after editing a custom surface or its links/costs in place.
     * Built-in grid topology and replacing the surface are detected automatically. */
    invalidatePaths(): void;
    setSurface(surface: NavSurface | null): void;
    hasSurface(): boolean;
    /**
     * Plan a world-space route, or null if there is no surface or no way. See
     * {@link NavSurface.findWorldPath} for what the waypoints carry.
     */
    findWorldPath(from: NavPoint, to: NavPoint, opts?: NavQueryOptions): Vec3[] | null;
    /** Explain a built-in route; custom surfaces without diagnostics report unknown. */
    queryWorldPath(from: NavPoint, to: NavPoint, opts?: NavQueryOptions): NavPathResult;
}
declare const Nav: ResourceDef<Navigation>;

interface NavAgentData {
    /** Movement speed in world pixels per second. */
    speed: number;
    /**
     * How wide the body is, in pixels. Planning routes it around anything it
     * would not fit through. 0 routes it as a point, which is what every agent
     * did before this was honoured — so it stays the default, rather than
     * silently re-routing every project that already shipped.
     */
    radius: number;
    /** Stop distance from the final goal, in pixels. */
    arriveRadius: number;
    /** Periodic replan cadence in seconds; 0 disables periodic refresh.
     * Target/topology changes and blocked-route recovery still replan. */
    repathInterval: number;
    /** Whether a destination is set. Cleared on arrival or `stopNavAgent`. */
    hasTarget: boolean;
    /** Destination in world pixels. */
    targetX: number;
    targetY: number;
    targetZ: number;
    /** Set true by the system the frame the agent reaches its goal. */
    arrived: boolean;
}
declare const NavAgent: ComponentDef<NavAgentData>;
/**
 * Point a NavAgent at a world position and (re)arm it. Safe to call every frame
 * (e.g. to chase a moving target) — the system only replans when the target
 * actually moves or the repath timer elapses.
 */
declare function setNavDestination(world: World, entity: Entity, target: {
    x: number;
    y: number;
    z?: number;
}): void;
/** Clear a NavAgent's destination and stop it in place. */
declare function stopNavAgent(world: World, entity: Entity): void;

interface NavVolumeData {
    /** Half-extents of the box, in world pixels; the entity's Transform is its centre. */
    halfExtents: Vec3;
    /** Voxel size in the ground plane, in world pixels. Smaller is a mesh that
     *  hugs the geometry more closely, and a slower bake. */
    cellSize: number;
    /** Voxel size vertically, in world pixels. This is what decides whether a
     *  balcony and the floor under it are two levels or one. */
    cellHeight: number;
    /** Steepest ground an agent can stand on, in degrees from level. */
    maxSlopeDegrees: number;
    /** Headroom an agent needs; ground with less is not walkable. */
    agentHeight: number;
    /** How wide the agent is. The mesh is pulled back from every wall by this, so
     *  a route over it clears the walls without the planner doing anything. */
    agentRadius: number;
    /** Height difference between neighbouring cells an agent can climb. */
    stepHeight: number;
    /** Physics layers the ground is on; 0 = every layer. */
    layers: number;
}
declare const NavVolume: ComponentDef<NavVolumeData>;

interface NavObstacleData {
    /** Half-extents of the blocking box, in world pixels; the Transform is its centre. */
    halfExtents: Vec3;
    /** Whether it blocks right now. A door that opens is this field. */
    enabled: boolean;
}
declare const NavObstacle: ComponentDef<NavObstacleData>;

interface NavLinkData {
    /** Where the way starts, relative to the entity. */
    start: Vec3;
    /** Where it comes out, relative to the entity. */
    end: Vec3;
    /** Whether it can be taken in both directions. A drop off a ledge is not. */
    bidirectional: boolean;
    /**
     * How far from each end the ground may be and still be joined, in world
     * pixels. An end that reaches no ground joins nothing.
     */
    radius: number;
    enabled: boolean;
}
declare const NavLink: ComponentDef<NavLinkData>;

interface NavAreaData {
    /** Half-extents of the box, in world pixels; the Transform is its centre. */
    halfExtents: Vec3;
    /**
     * What a unit of distance inside it costs, against 1 for open ground. Under 1
     * is preferred, over 1 is avoided; 0 or less is not a shortcut but a mistake,
     * and reads as free ground.
     */
    cost: number;
    enabled: boolean;
}
declare const NavArea: ComponentDef<NavAreaData>;

/**
 * @file    navObstacles.ts
 * @brief   The boxes a scene currently says are in the way, and a number that
 *          changes when any of them does.
 *
 * Blocking is a bake input, not a query filter: an obstacle has to take its
 * ground away before the erosion, or routes would scrape along its face. So what
 * a running game needs from this is cheap CHANGE detection — walking a handful of
 * boxes every frame to find out whether the expensive thing has to happen again.
 */

/** Every obstacle currently blocking, in world space. Disabled ones are absent,
 *  which is what makes a door opening a change of this list. */
declare function collectNavObstacles(world: World): NavObstacleBox[];
/**
 * Every priced patch of ground a scene declares. Each gets an area id of its own,
 * numbered in the order they are found: a cost can then be changed without
 * rebuilding anything, because the mesh carries the ID and not the price.
 */
declare function collectNavAreas(world: World): Array<NavAreaBox & {
    cost: number;
}>;
/** The first area id a scene may use. 0 is unwalkable, 1 is open ground. */
declare const FIRST_AREA = 2;
/** A number that differs whenever the priced patches move, resize or appear. The
 *  COST is left out: changing one costs a lookup, and moving one costs a bake. */
declare function navAreaDigest(areas: ReadonlyArray<NavAreaBox>): number;
/** Price the cells a patch covers. A grid charges by the cell, as it blocks. */
declare function applyAreasToGrid(grid: NavGrid, areas: ReadonlyArray<NavAreaBox & {
    cost: number;
}>): void;
/** Every link a scene declares, with both ends placed in the world. */
declare function collectNavLinks(world: World): NavLinkSegment[];
/** A number that differs whenever the links do. Same shape as the obstacles'
 *  digest, and separate because re-joining a mesh is cheap and re-baking is not. */
declare function navLinkDigest(links: readonly NavLinkSegment[]): number;
/**
 * A number that differs whenever the obstacles do — one moved, resized, added,
 * removed or switched off. Positions are rounded to a tenth of a pixel first, so
 * a body settling under gravity does not read as a world that keeps changing.
 */
declare function navObstacleDigest(obstacles: readonly NavObstacleBox[]): number;
/**
 * Mark the cells an obstacle is standing on. A grid blocks by the cell, so this
 * is the whole of what an obstacle does to one — and it is re-marked from scratch
 * each time, because working out which cells a box has LEFT is the same walk.
 */
declare function applyObstaclesToGrid(grid: NavGrid, obstacles: readonly NavObstacleBox[]): void;

declare class NavPlugin implements Plugin {
    name: string;
    /** A volume to bake or an agent to move; the frame after the last one goes still runs, so a mesh is let go. */
    readonly activeWhen: (ComponentDef<NavAgentData> | ComponentDef<NavVolumeData>)[];
    build(app: App): void;
}
declare const navPlugin: NavPlugin;

interface NavDebugDrawConfig {
    enabled: boolean;
    /** Outline every walkable face. */
    showFaces: boolean;
    /** Mark the edges the walkable world stops at, which is where a route turns. */
    showBorders: boolean;
    /** Draw the ways between places the ground does not join. */
    showLinks: boolean;
}
/** Off until a game turns it on: a surface is thousands of faces and each is a loop. */
declare const NavDebugDraw: ResourceDef<NavDebugDrawConfig>;
/** Draw one frame of the overlay. Exported for the unit test, which counts what
 *  it asked to be drawn rather than looking at pixels. */
declare function drawNavDebug(surface: NavSurface | null, cfg: NavDebugDrawConfig): void;

/**
 * @file    FsmRunner.ts
 * @brief   The state-machine interpreter — pure, generic, unit-testable.
 *
 * `compileFsm` indexes a definition once (per loaded asset); `stepFsm` advances
 * one runtime instance one tick. Semantics: at most one transition per tick;
 * `onEnter` runs the tick a state becomes active, `onExit` when it is left,
 * `onUpdate` on ticks where no transition fires.
 */

/** A definition indexed by state name for O(1) lookup during ticks. */
interface CompiledFsm {
    initial: string;
    states: Map<string, FsmState>;
}
declare function compileFsm(def: FsmDefinition): CompiledFsm;
/** Mutable per-instance runtime state. `entered` gates the one-shot `onEnter`. */
interface FsmRunState {
    current: string;
    previous: string | null;
    entered: boolean;
}
declare function createFsmRunState(fsm: CompiledFsm): FsmRunState;
/**
 * Advance one tick. Returns true if a transition was taken. The new state's
 * `onEnter` runs on the following tick (via `entered=false`), so a pass-through
 * state cleanly enters-then-exits across two ticks rather than looping.
 */
declare function stepFsm<Ctx>(fsm: CompiledFsm, run: FsmRunState, ctx: Ctx, bb: Blackboard, registry: AiRegistry<Ctx>): boolean;

/**
 * @file    fsmGraph.ts
 * @brief   Immutable graph operations on an FsmDefinition — the editor's model.
 *
 * The structural graph algorithms live in the shared `stateGraph` core; this
 * module binds them to the `.esfsm` shape (`initial`, optional transition lists,
 * bare `{to}` transitions) and adds the FSM-only state-hook op. A `.esfsm` IS
 * the runtime definition (states carry optional x/y layout the interpreter
 * ignores), so there is no separate editor model to compile.
 */

/** A flattened transition edge, for the graph canvas. */
type FsmEdge = GraphEdge<FsmTransition>;
/** Flatten every state's outgoing transitions into addressable edges. */
declare function fsmEdges(def: FsmDefinition): FsmEdge[];
/** A blank machine with one initial state. */
declare function emptyFsm(): FsmDefinition;
declare function addState(def: FsmDefinition, name: string, x?: number, y?: number): FsmDefinition;
declare function removeState(def: FsmDefinition, name: string): FsmDefinition;
declare function moveState(def: FsmDefinition, name: string, x: number, y: number): FsmDefinition;
declare function renameState(def: FsmDefinition, oldName: string, newName: string): FsmDefinition;
declare function setInitial(def: FsmDefinition, name: string): FsmDefinition;
declare function addTransition(def: FsmDefinition, from: string, to: string): FsmDefinition;
declare function removeTransition(def: FsmDefinition, from: string, index: number): FsmDefinition;
declare function updateTransition(def: FsmDefinition, from: string, index: number, patch: Partial<FsmTransition>): FsmDefinition;
/**
 * Point a state hook at an action, with its input in either form: the canonical
 * string (`arg`) or the action's declared parameters. A bare name stays a bare
 * string in the data — the shorthand most hooks use — and clearing the name
 * clears the hook.
 */
declare function setStateHook(def: FsmDefinition, name: string, hook: 'onEnter' | 'onUpdate' | 'onExit', action: string, arg?: string, params?: Record<string, AiParamValue>): FsmDefinition;

interface StateMachineAgentData {
    /** Key of the FSM to run: a `registerFsm` name or a `.esfsm` asset path. */
    fsm: string;
    /** Active state name, written by the system each tick (observable in the inspector). */
    current: string;
}
declare const StateMachineAgent: ComponentDef<StateMachineAgentData>;
/** Register (compile) an FSM under `key` — the code half of the registry. */
declare function registerFsm(key: string, def: FsmDefinition): CompiledFsm;
declare function getFsm(key: string): CompiledFsm | undefined;
/** Drop all registered FSMs (tests / hot-reload). */
declare function clearFsmStore(): void;

/** Per-entity FSM runtime: blackboard persists; run rebuilds when the FSM key changes. */
interface AgentState {
    bb: Blackboard;
    run: FsmRunState | null;
    fsmKey: string | null;
}
/** The slice of `World` the FSM step needs — lets tests inject a fake. */
interface FsmWorldView {
    getEntitiesWithComponents(components: readonly AnyComponentDef[]): readonly Entity[];
    get<C extends AnyComponentDef>(entity: Entity, component: C): ComponentData<C>;
    set<C extends AnyComponentDef>(entity: Entity, component: C, data: ComponentData<C>): void;
    has(entity: Entity, component: AnyComponentDef): boolean;
}
/** Get (creating if needed) an agent's blackboard — lets game code seed data / fire triggers early. */
declare function agentBlackboard(states: Map<Entity, AgentState>, entity: Entity): Blackboard;
/** Advance every StateMachineAgent one tick. `states` carries per-entity runtime across frames. */
declare function stepStateMachines(world: FsmWorldView, commands: CommandsInstance, dt: number, states: Map<Entity, AgentState>, resolveFsm?: (ref: string) => CompiledFsm | undefined, input?: InputState): void;
/** Resource for game code to reach an agent's blackboard / current state. */
declare class StateMachines {
    private states;
    constructor(states: Map<Entity, AgentState>);
    blackboard(entity: Entity): Blackboard;
    /** Fire a one-shot trigger consumed by the agent's next enabled transition. */
    fire(entity: Entity, trigger: string): void;
    /** The agent's active state name, or null before its first tick. */
    state(entity: Entity): string | null;
}
declare const AiFsm: ResourceDef<StateMachines>;
declare class FsmPlugin implements Plugin {
    name: string;
    /** Nothing to step without an agent; state per entity is dropped on despawn. */
    readonly activeWhen: ComponentDef<StateMachineAgentData>[];
    build(app: App): void;
}
declare const fsmPlugin: FsmPlugin;

/**
 * @file    builtins.ts
 * @brief   Engine-provided AI actions/conditions — code-free glue from
 *          `.esfsm`/`.esbt` data to engine subsystems.
 *
 * Registered when the FSM/BT plugin builds, so the names show up in the editor
 * palettes next to game-registered ones. Namespaced (`timeline.…`) to stay clear
 * of game action names; a name already present in the registry is never
 * overwritten, so game code wins regardless of registration order. Everything
 * here speaks through components — the same channel game code and the editor
 * use. Event-source verbs dispatch intents through their component adapter.
 */
/**
 * Register the engine's built-in actions/conditions. Idempotent (and safe after
 * an `aiRegistry.clear()`): each name registers only if absent.
 */
declare function ensureBuiltinAiRegistrations(): void;

/**
 * @file    types.ts
 * @brief   Behavior-tree data model — the serializable shape of a `.esbt`.
 *
 * A tree is pure data; leaf `name`s resolve to real logic through the shared
 * AiRegistry at runtime (the same registry FSM actions/conditions use), so the
 * data embeds no code — matching `.esfsm` and the input maps.
 */

type BtNodeType = 'sequence' | 'selector' | 'parallel' | 'inverter' | 'succeeder' | 'repeater' | 'wait' | 'action' | 'condition';
interface BtNode {
    type: BtNodeType;
    /** Editor-only stable id for selection/addressing; ignored by the interpreter. */
    id?: string;
    /** Registry name for a leaf (`action`/`condition`). */
    name?: string;
    /** Optional string argument an `action` leaf passes to its registry fn. */
    arg?: string;
    /** The action's declared parameters by name — the other projection of `arg`. */
    params?: Record<string, AiParamValue>;
    /** Children: many for a composite, one for a decorator. */
    children?: BtNode[];
    /** `repeater`: iterations before Success; 0 = forever. */
    count?: number;
    /** `parallel`: succeed when `one` child succeeds, or when `all` do (default). */
    policy?: 'all' | 'one';
    /** `wait`: seconds to run before Success. */
    seconds?: number;
    /** Editor-only canvas position; ignored by the interpreter. */
    x?: number;
    y?: number;
}
interface BtDefinition {
    root: BtNode;
    /**
     * Editor-only unconnected nodes/subtrees (created but not yet wired under
     * root). The interpreter ignores them — only `root` is ticked.
     */
    orphans?: BtNode[];
}

/**
 * @file    BtRunner.ts
 * @brief   The behavior-tree interpreter — pure, generic, unit-testable.
 *
 * One `tickBt` per frame walks the tree; each node returns a {@link Status}.
 * Composites are reactive (UE-style): each tick re-evaluates children from the
 * start, so a higher-priority branch whose condition just became true preempts a
 * lower-priority branch that was Running. Only decorators with intrinsic timing
 * (`wait`/`repeater`) keep per-node state, keyed by node path ("0.1.2"). `dt` is
 * passed explicitly (only `wait` uses it) so the core stays free of any
 * engine/context type.
 */

interface NodeState {
    /** Repeater: completed iterations. */
    n?: number;
    /** Wait: elapsed seconds. */
    elapsed?: number;
}
type BtRunState = Map<string, NodeState>;
declare function createBtRunState(): BtRunState;
/** Advance the tree one tick, returning the root's status. */
declare function tickBt<Ctx>(def: BtDefinition, ctx: Ctx, bb: Blackboard, registry: AiRegistry<Ctx>, rs: BtRunState, dt: number): Status;

/**
 * @file    btGraph.ts
 * @brief   Immutable tree operations on a BtDefinition — the editor's model.
 *
 * Pure functions returning new definitions (never mutating), so the tree editor
 * drives them through AssetDocument.edit for free undo, mirroring fsmGraph. The
 * editor model is a forest: the run tree (`root`) plus `orphans` — unconnected
 * nodes/subtrees the interpreter ignores. Dragging a parent's handle to an
 * orphan reparents it into the tree. Nodes carry an editor-only `id`/`x`/`y`
 * that the interpreter ignores; a `.esbt` IS the runtime definition (no compile).
 */

interface BtEdge {
    /** Stable id `from->to`. */
    id: string;
    from: string;
    to: string;
}
/** Max children a node type accepts: composites unbounded, decorators one, leaves none. */
declare function maxChildren(type: BtNodeType): number;
declare function canHaveChildren(type: BtNodeType): boolean;
/** Assign ids to any node missing one (e.g. a hand-written `.esbt`). Mutates + returns the def. */
declare function ensureBtIds(def: BtDefinition): BtDefinition;
/** A blank tree: a Selector root. */
declare function emptyBt(): BtDefinition;
/** All nodes flattened (run tree + orphans), for the canvas. */
declare function btNodes(def: BtDefinition): BtNode[];
/** Parent -> child edges across the run tree and every orphan subtree. */
declare function btEdges(def: BtDefinition): BtEdge[];
declare function addBtChild(def: BtDefinition, parentId: string, type: BtNodeType, x?: number, y?: number): BtDefinition;
/** Add an unconnected node to the editor's orphan pool (not ticked until wired under root). */
declare function addBtOrphan(def: BtDefinition, type: BtNodeType, x?: number, y?: number): BtDefinition;
declare function removeBtNode(def: BtDefinition, id: string): BtDefinition;
declare function moveBtNode(def: BtDefinition, id: string, x: number, y: number): BtDefinition;
/** Patch a node's fields (type/name/count/policy/seconds). Changing type clamps children to the new capacity. */
declare function setBtNodeField(def: BtDefinition, id: string, patch: Partial<BtNode>): BtDefinition;
/**
 * Reparent a subtree under a new parent (canvas drag-to-connect) — moves it out
 * of the orphan pool or from its current parent. No-ops on a cycle (new parent
 * is a descendant), a full parent, or the run root itself.
 */
declare function reparentBtNode(def: BtDefinition, id: string, newParentId: string): BtDefinition;

interface BehaviorTreeAgentData {
    /** Key of the tree to run: a `registerBt` name or a `.esbt` asset path. */
    bt: string;
    /** Last root status, written by the system each tick (observable). */
    status: string;
}
declare const BehaviorTreeAgent: ComponentDef<BehaviorTreeAgentData>;
declare function registerBt(key: string, def: BtDefinition): BtDefinition;
declare function getBt(key: string): BtDefinition | undefined;
/** Drop all registered trees (tests / hot-reload). */
declare function clearBtStore(): void;

interface BtAgentState {
    bb: Blackboard;
    rs: BtRunState;
    btKey: string | null;
    status: string;
}
/** The slice of `World` the BT step needs — lets tests inject a fake. */
interface AiWorldView {
    getEntitiesWithComponents(components: readonly AnyComponentDef[]): readonly Entity[];
    get<C extends AnyComponentDef>(entity: Entity, component: C): ComponentData<C>;
    set<C extends AnyComponentDef>(entity: Entity, component: C, data: ComponentData<C>): void;
    has(entity: Entity, component: AnyComponentDef): boolean;
}
/** Get (creating if needed) an agent's blackboard — lets game code seed data early. */
declare function agentBtBlackboard(states: Map<Entity, BtAgentState>, entity: Entity): Blackboard;
/** Advance every BehaviorTreeAgent one tick. `states` carries per-entity runtime across frames. */
declare function stepBehaviorTrees(world: AiWorldView, commands: CommandsInstance, dt: number, states: Map<Entity, BtAgentState>, resolveTree?: (ref: string) => BtDefinition | undefined, input?: InputState): void;
/** Resource for game code to reach an agent's blackboard / last status. */
declare class BehaviorTrees {
    private states;
    constructor(states: Map<Entity, BtAgentState>);
    blackboard(entity: Entity): Blackboard;
    status(entity: Entity): string | null;
}
declare const AiBt: ResourceDef<BehaviorTrees>;
declare class BtPlugin implements Plugin {
    name: string;
    /** Nothing to tick without an agent; state per entity is dropped on despawn. */
    readonly activeWhen: ComponentDef<BehaviorTreeAgentData>[];
    build(app: App): void;
}
declare const btPlugin: BtPlugin;

/**
 * @file    sense.ts
 * @brief   Line-of-sight / field-of-view sensing — pure geometry, unit-testable.
 *
 * `senseTarget` combines a range check, a cone (field-of-view) check, and an
 * optional occlusion callback (`isBlocked`, backed by a physics raycast in the
 * engine, a fake in tests) so the core stays free of any physics/wasm type. The
 * engine's perception system writes the result to a `Perception` component that
 * FSM conditions / BT leaves read via `ctx.get(Perception)`.
 *
 * Three-dimensional, with the flat case as its degenerate: a cone measured in
 * x and y sees through floors, and a scene the renderer and the solver both
 * treat as spatial has floors.
 */

interface SenseResult {
    /** Target is within range, inside the cone, and not occluded. */
    visible: boolean;
    /** Distance to the target (always set, even when not visible). */
    distance: number;
    /** Unit direction observer→target, or zero when not visible. */
    dir: Vec3;
}
/**
 * Which of an entity's own axes its sensing cone points down. `x` is where a flat
 * scene's characters face (unrotated = screen-right); `-z` is where an imported
 * model faces, the convention the camera and lights use. Two conventions in one
 * engine, neither derivable from the other — the entity says which it means.
 */
type FacingAxis = 'x' | '-z';
/** The world direction an entity with rotation `rot` faces along `axis`. */
declare function facingFromRotation(rot: Quat, axis?: FacingAxis): Vec3;
/** Wrap an angle to (-π, π]. */
declare function normalizeAngle(a: number): number;
/**
 * Sense `target` from `observer`, which faces along `facing` (need not be unit).
 * `halfFov` is half the field-of-view in radians (≥ π means omnidirectional).
 * `isBlocked(from, to)` returns true when the line of sight is occluded. An
 * observer standing on the target is visible.
 */
declare function senseTarget(observer: Vec3, facing: Vec3, target: Vec3, range: number, halfFov: number, isBlocked?: (from: Vec3, to: Vec3) => boolean): SenseResult;

interface PerceiverData {
    /** Sight range in world pixels. */
    range: number;
    /** Field-of-view cone in degrees; 360 = omnidirectional. */
    fovDegrees: number;
    /** Which of the entity's own axes the cone points down — see {@link FacingAxis}. */
    facingAxis: FacingAxis;
    /**
     * Physics layers the line-of-sight ray may hit (3D only; 0 = every layer).
     * A ray cast from inside the observer's own body hits it first and the check
     * has to let that through, so a 3D scene keeps sight honest by casting only
     * against the layers that actually block sight.
     */
    losLayers: number;
    /**
     * How far a {@link Noise} of loudness 1 is heard, in world units; 0 = deaf. A noise is heard within
     * `hearingRange * loudness`, through walls, as Unreal's hearing sense is.
     */
    hearingRange: number;
}
declare const Perceiver: ComponentDef<PerceiverData>;
interface PerceptionData {
    /** A target is currently seen. */
    visible: boolean;
    /** Distance to the seen target (0 when none). */
    distance: number;
    /** Seen target position in world pixels. */
    targetX: number;
    targetY: number;
    targetZ: number;
    /** Unit direction observer→target. */
    dirX: number;
    dirY: number;
    dirZ: number;
    /** A noise was heard this step. */
    heard: boolean;
    /** Where the last noise heard came from. */
    noiseX: number;
    noiseY: number;
    noiseZ: number;
    /** Seconds since that noise; -1 = nothing heard yet. */
    sinceHeard: number;
}
declare const Perception: ComponentDef<PerceptionData>;
/** Tags an entity as sensable by Perceivers. */
declare const PerceptionTarget: ComponentDef<{}>;
/** What a noise carries: where it was made, how loud (1 = heard out to a Perceiver's `hearingRange`), and who made it. */
interface NoisePayload {
    x: number;
    y: number;
    z: number;
    loudness: number;
    /** The entity that made it; it does not hear itself. 0 = no one in particular. */
    source: Entity;
}
/**
 * Something made a sound perceivers may hear (a gunshot, a door, a footfall). Send it with `EventWriter(Noise)`; the
 * perception step reads it the frame after, as every event is read.
 */
declare const Noise: EventDef<NoisePayload>;

/** The slice of `World` the perception step needs — lets tests inject a fake. */
interface PerceptionWorldView {
    getEntitiesWithComponents(components: readonly AnyComponentDef[]): readonly Entity[];
    get<C extends AnyComponentDef>(entity: Entity, component: C): ComponentData<C>;
    set<C extends AnyComponentDef>(entity: Entity, component: C, data: ComponentData<C>): void;
    has(entity: Entity, component: AnyComponentDef): boolean;
    insert<C extends AnyComponentDef>(entity: Entity, component: C, data?: Partial<ComponentData<C>>): unknown;
    /** Make composed (world) poses current; a fake world without them leaves this out. */
    ensureTransformsComposed?(): void;
}
/**
 * True when the line from `from` to `to` is occluded. `observer` and `target`
 * are the two bodies at its ends — whatever they own is not what the check is
 * asking about. `layers` is the 3D layer mask the caller wants cast against
 * (0 = every layer); a 2D check has no layers and ignores it.
 */
type LosCheck = (from: Vec3, to: Vec3, observer: Entity, target: Entity, layers: number) => boolean;
/**
 * Update every Perceiver's Perception: the nearest visible target, and the nearest noise it heard.
 * Positions are WORLD positions, so a perceiver can sit on an eye (a head bone, a sensor) and a target on what is
 * looked at (a player's eye camera); sight measured from one character's feet to another's was cut by every kerb.
 * `noises` are this step's {@link Noise} events; `dt` ages what was heard before.
 */
declare function stepPerception(world: PerceptionWorldView, isBlocked?: LosCheck, noises?: readonly NoisePayload[], dt?: number): void;
/**
 * Raycast-backed line of sight: occluded by anything hit before the target that
 * is not one of the two bodies at the ends. A character's collider sits at its
 * feet, so a ray aimed at the origin passes through the target's own capsule —
 * counting that hides everyone approached from below.
 */
declare function makeLosCheck(physics: Physics2DAPI): LosCheck;
declare class PerceptionPlugin implements Plugin {
    name: string;
    /** Perception is a perceiver's: without one there is no one to see. */
    readonly activeWhen: ComponentDef<PerceiverData>[];
    build(app: App): void;
}
declare const perceptionPlugin: PerceptionPlugin;

export { AiBt, AiFsm, AiParamValue, AiRegistry, BehaviorTreeAgent, BehaviorTrees, Blackboard, BtPlugin, Cell, FIRST_AREA, FsmDefinition, FsmPlugin, FsmState, FsmTransition, Nav, NavAgent, NavArea, NavDebugDraw, NavGrid, NavLink, NavMesh, NavObstacle, NavPathResult, NavPlugin, NavPoint, NavQueryOptions, NavSurface, NavSurfaceSink, NavVolume, Navigation, Noise, Perceiver, Perception, PerceptionPlugin, PerceptionTarget, StateMachineAgent, StateMachines, Status, addBtChild, addBtOrphan, addState, addTransition, agentBlackboard, agentBtBlackboard, applyAreasToGrid, applyObstaclesToGrid, btEdges, btNodes, btPlugin, buildNavMesh, canHaveChildren, clearBtStore, clearFsmStore, collectNavAreas, collectNavGeometry, collectNavLinks, collectNavObstacles, compileFsm, createBtRunState, createFsmRunState, drawNavDebug, emptyBt, emptyFsm, ensureBtIds, ensureBuiltinAiRegistrations, facingFromRotation, findPath, fsmEdges, fsmPlugin, getBt, getFsm, makeLosCheck, maxChildren, moveBtNode, moveState, navAreaDigest, navGeometryReady, navLinkDigest, navObstacleDigest, navPlugin, normalizeAngle, pathToWorld, perceptionPlugin, registerBt, registerFsm, removeBtNode, removeState, removeTransition, renameState, reparentBtNode, senseTarget, setBtNodeField, setInitial, setNavDestination, setStateHook, stepBehaviorTrees, stepFsm, stepPerception, stepStateMachines, stopNavAgent, tickBt, updateTransition };
export type { AiWorldView, BehaviorTreeAgentData, BtDefinition, BtEdge, BtNode, BtNodeType, BtRunState, BuildNavMeshOptions, CollectNavGeometryOptions, CompiledFsm, FacingAxis, FsmEdge, FsmRunState, FsmWorldView, LosCheck, NavAgentData, NavAreaBox, NavAreaData, NavDebugDrawConfig, NavGeometry, NavLinkData, NavLinkSegment, NavMeshData, NavObstacleBox, NavObstacleData, NavSurfaceUpdate, NavVolumeData, NoisePayload, PathfindOptions, PerceiverData, PerceptionData, PerceptionWorldView, SenseResult, StateMachineAgentData };
