import { Vec2 } from './wasm.js';
import { World } from './app.js';

/**
 * @file    Collider2DShape.ts
 * @brief   The single geometry projection over the collider components — the shared
 *          seam for BOTH visualizers (the runtime Physics2DDebugDraw and the editor's
 *          collider gizmo) and for tile-collision overlays. It does NOT touch the
 *          runtime physics model: colliders stay ordinary C++/TS components dispatched
 *          by presence in PhysicsSystem; this only READS them into a shape descriptor,
 *          computes the offset+rotation center once (previously duplicated 3×), and
 *          emits world-space outlines each backend renders in its own primitives.
 *
 * Units: shape fields are physics metres (as stored on the components); `ppu`
 * (pixels-per-unit) scales them to world pixels in shapeCenter / collider2DOutline.
 */

/** Semicircle-cap segment count for a capsule outline (matches the legacy debug draw). */
declare const CAPSULE_ARC_SEGMENTS = 16;
/** Box2D builds no chain below four points; the editor may not author one either. */
declare const MIN_CHAIN_POINTS = 4;
/** A collider's geometry, in physics metres. Offset (box/circle/capsule) is metres too;
 *  segment/polygon/chain carry their points directly and sit at the entity origin. */
type Collider2DShape = {
    kind: 'box';
    halfExtents: Vec2;
    offset: Vec2;
} | {
    kind: 'circle';
    radius: number;
    offset: Vec2;
} | {
    kind: 'capsule';
    radius: number;
    halfHeight: number;
    offset: Vec2;
} | {
    kind: 'segment';
    point1: Vec2;
    point2: Vec2;
} | {
    kind: 'polygon';
    vertices: Vec2[];
} | {
    kind: 'chain';
    points: Vec2[];
    isLoop: boolean;
};
/** A shape read off an entity, with the sensor flag the visualizers colour by and
 *  the enabled flag they decide by: a disabled collider is absent from the physics
 *  world, so the runtime overlay skips it while the editor keeps drawing it (you
 *  still author its geometry through the gizmo). */
interface Collider2DInstance {
    shape: Collider2DShape;
    isSensor: boolean;
    enabled: boolean;
}
/** World-space (pixel) outline: straight runs as polylines + true circles left as
 *  {center, radius} so a backend can stroke them as arcs (SVG <circle> / circleOutline). */
interface Collider2DOutline {
    polylines: Vec2[][];
    circles: {
        c: Vec2;
        r: number;
    }[];
    /**
     * The authored outline where the solver does not have it — a concave polygon's
     * filled-in notch, or vertices past the eight Box2D takes. Absent when what was
     * drawn is what collides; every backend strokes it apart, or the viewport says
     * a shape exists where nothing can be hit.
     */
    declined?: Vec2[][];
}
/** The collider's local offset in metres (0 for segment/polygon/chain, which have none). */
declare function shapeOffset(shape: Collider2DShape): Vec2;
/**
 * The shape's world-pixel centre = the entity's world position plus its collider offset
 * (metres × ppu) rotated by the entity angle. Every drawer of a collider goes through
 * here, so a gizmo and the solver cannot disagree about where the shape is.
 */
declare function shapeCenter(shape: Collider2DShape, worldPos: Vec2, angle: number, ppu: number): Vec2;
/**
 * The shape's outline in world pixels, rotated by `angle` about `center` (see
 * {@link shapeCenter}). Straight-edged shapes return closed/open polylines; a circle
 * returns a single {c, r} for the backend to stroke as an arc.
 */
declare function collider2DOutline(shape: Collider2DShape, center: Vec2, angle: number, ppu: number): Collider2DOutline;
/**
 * Read every collider component present on `entity` into shape descriptors, in the same
 * order PhysicsSystem's addShapeForEntity dispatches (box, circle, capsule, segment,
 * polygon, chain). Chain has no sensor flag, so it reports isSensor: false.
 */
declare function readCollider2DShapes(world: World, entity: number): Collider2DInstance[];

export { CAPSULE_ARC_SEGMENTS, MIN_CHAIN_POINTS, collider2DOutline, readCollider2DShapes, shapeCenter, shapeOffset };
export type { Collider2DInstance, Collider2DOutline, Collider2DShape };
