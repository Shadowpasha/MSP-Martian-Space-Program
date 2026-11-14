import { SplineData } from '../shared/terrainBand2D.js';
export { PathFollower, PathFollowerData, PathMode, PathOrient, Spline, SplineCurve, SplineNearest, SplinePlugin, SplinePoint, TerrainBand2D, TerrainBand2DData, TerrainBandBuild, buildTerrainBand, pathPlace, splinePlugin } from '../shared/terrainBand2D.js';
import { ComponentDef, MeshData } from '../shared/app.js';
import '../shared/wasm.js';
import '../shared/resource.js';

/**
 * @file    roadDecal.ts
 * @brief   A road, a track or a stain laid along a Spline and over the ground, its edges fading into what it lies on.
 *
 * @details A decal is cut from meshes, and a terrain is no mesh: it is drawn from height pages, coarser with distance. So this asks
 *          the ground where it is, row by row across the curve, and draws the strip as the entity's own MeshRenderer, so a material
 *          on it can be anything. Its colour's alpha falls to nothing at both edges, so the seam with the ground is a gradient and
 *          not a line. It is made again when the spline, its fields or the ground change. The terrain module is optional and asked by
 *          name: with none, the strip lies along the curve as drawn.
 */

/** The fields of the `RoadDecal` component. @experimental */
interface RoadDecalData {
    /** How far apart its rows are along the curve, in world units: finer follows the ground and the bends more closely. */
    step: number;
    /** How many cells across. More follows a ground that crowns or slopes under the road. */
    across: number;
    /** × the width each spline point says. */
    widthScale: number;
    /** How far above the ground it lies, in world units. Enough to win against the ground from as far as it is seen. */
    lift: number;
    /** The share of its half width over which each edge fades, 0 to 1. */
    edgeFade: number;
    /** The length of one repeat of its texture along the curve, in world units. */
    tile: number;
}
/**
 * Lays the entity's MeshRenderer along the `Spline` of the same entity and over the ground.
 *
 * @experimental
 */
declare const RoadDecal: ComponentDef<RoadDecalData>;
/** What the ground answers, from a terrain or a planet's surface. Read by name: a game with neither pays for neither. */
interface RoadGround {
    heightAt(x: number, z: number): number | null;
    normalAt?(x: number, z: number): readonly [number, number, number] | null;
}
/**
 * The strip's geometry, relative to `origin`. Null where it has nothing to lay. Positions lie on the ground where it answers and on the curve
 * where it does not; texture v runs along the curve in world units over `tile`, and u across from 0 to 1.
 */
declare function buildRoadDecal(spline: SplineData, road: RoadDecalData, origin: {
    x: number;
    y: number;
    z: number;
}, ground: RoadGround | null): MeshData | null;

export { RoadDecal, SplineData, buildRoadDecal };
export type { RoadDecalData, RoadGround };
