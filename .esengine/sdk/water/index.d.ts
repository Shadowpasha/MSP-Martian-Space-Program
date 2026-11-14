import { WaterSample } from '../shared/basins.js';
export { Basin, BasinMap, BasinOptions, FieldSample, Point2, RippleField, WATERFALL_SHADER_TEMPLATE, WAVE_SET, WaterBody, WaterBodyData, WaterField, WaterForm, WaterPlugin, WaterZone, WaterZoneData, Waterfall, WaterfallAnchor, WaterfallAnchorData, WaterfallData, WaterfallLanding, WaterfallLip, Waters, WatersRes, WaveParams, buildOceanMesh, buildWaterfall, currentShare, drainPath, findBasins, oceanReach, oceanSnap, polygonSdf, shoreDamp, waterPlugin, waterfallAnchorPoint, waterfallFlight, waterfallHeading, waveFade, waveHeight, waveSlope } from '../shared/basins.js';
import { Plugin, App, ComponentDef } from '../shared/app.js';
import '../shared/wasm.js';
import '../shared/resource.js';
import '../shared/builtinShaders.js';

/**
 * @file    underwater.ts
 * @brief   Seeing from under the water: the effect that fogs the world by how much water the light crossed, lights it with the sun through the waves, and the system that says when.
 *
 * @details The effect is the water's own: its definition and shader are registered here, with the rest of the water module, so a build with no water carries
 *          none of it. For each pixel it asks whether the pixel's place on the camera's near plane is under the surface (so a lens half in the water
 *          has a waterline across it, soft by `u_band`), and for those that are:
 *            - the light has crossed the distance from the eye to what it came from (the longest the water is seen through for the sky), and
 *              the water takes it out colour by colour (red first: the same absorption and density the surface's material draws with) and gives back
 *              its own colour, which dims with the camera's depth;
 *            - what the camera sees is lit by the sun through the waves: a web of bright threads on what faces the sun and is not in shadow, from the
 *              pattern the surface draws (render/waterCaustics.ts), less the further the sun's light went through the water to reach it;
 *            - and the water between the camera and what it sees scatters the sun toward it: the same pattern marched along the ray, 24 steps, each
 *              step in light where the shadow map says the sun reaches it, which is what makes shafts.
 *          The system reads the camera's place in the water from {@link Waters.sample} each frame and tells the post-process volume system (see
 *          postprocess/underwater.ts), which adds the effect for as long as the camera is under.
 */

/** Registers the effect with the post-process registry, once. */
declare function registerUnderwaterEffect(): void;
/** The plugin that keeps the post-process volume system told whether the camera is under water. */
declare class UnderwaterPlugin implements Plugin {
    name: string;
    build(app: App): void;
    cleanup(): void;
}

/**
 * @file    floating.ts
 * @brief   A body that floats: the water holds it up and carries it along, through forces on its rigid body.
 *
 * @details `Floating` goes on an entity that has a `RigidBody3D` (and a collider), and the forces come from asking the water's surface
 *          ({@link Waters.sample}) where it is under a few points of the body. It touches nothing a renderer owns: the surface is the
 *          CPU's own, so a server, a test or a build that draws nothing floats things the same.
 *
 *          At each sample point the share of it under water (`wet`: 0 at the surface, 1 from `radius` down) gives
 *            - a buoyant force against gravity of `mass * g * buoyancy * wet / points` (so `buoyancy` is the ratio of the water's density
 *              to the body's, and a body of 2 floats half under), applied AT the point so waves tip it and a body weighted to one side
 *              leans; and
 *            - a drag of `mass * drag * wet / points` against the point's velocity relative to the water, which is what brings it to
 *              rest in still water and carries it along with a river's current.
 *          The forces are applied each fixed step, before the world is stepped, and Jolt keeps them for that step only.
 */

/** A point in space. */
interface Vec3Like {
    x: number;
    y: number;
    z: number;
}
/** The fields of the `Floating` component. @experimental */
interface FloatingData {
    /** The water's density against the body's: 1 holds it up exactly when it is wholly under, 2 floats it half under. */
    buoyancy: number;
    /** How hard the water resists the body moving through it (a rate, per second). */
    drag: number;
    /** How deep, in world units, a sample point has to be under the surface to be wholly wet. */
    radius: number;
    /** The points of the body, in its own space and world units, the water is asked about. Empty is the one at its origin. */
    points: Vec3Like[];
    /** How much of a ripple the body makes in a body of water that keeps ripples: a multiplier, 0 for none. */
    wake: number;
}
/**
 * A body the water holds up. It needs a `RigidBody3D`; presence is the opt-in.
 *
 * @experimental
 */
declare const Floating: ComponentDef<FloatingData>;
/** What the water does to one point of a body. */
interface FloatingForce {
    /** The force in newtons, world space. */
    force: [number, number, number];
    /** Where it acts, in physics units (metres). */
    point: [number, number, number];
}
/** The state a force is worked out from, in physics units (metres, kilograms, seconds), world space. */
interface FloatingBody {
    position: [number, number, number];
    velocity: [number, number, number];
    angularVelocity: [number, number, number];
    mass: number;
}
/**
 * The force on one point of a floating body, or null where it is dry. `gravity` is the world's, in metres a second squared; `ppu` is how many world
 * units a metre is; `dt` the fixed step. `sample` is what the water says at the point (world units).
 */
declare function floatingForce(body: FloatingBody, point: [number, number, number], sample: WaterSample | null, floating: FloatingData, gravity: [number, number, number], ppu: number, dt: number, points: number): FloatingForce | null;
/**
 * The bump a point at the surface puts into ripples this step, in world units (negative is a dip), or 0 where it is not touching the surface.
 * `velocity` is the point's velocity relative to the water in world units a second; what goes down into the water pushes it down, and moving along it drags a trough.
 */
declare function wakeStrength(sample: WaterSample | null, velocity: [number, number, number], floating: FloatingData, dt: number): number;
/** The plugin that floats bodies, for a build that has water. */
declare class FloatingPlugin implements Plugin {
    name: string;
    build(app: App): void;
}

export { Floating, FloatingPlugin, UnderwaterPlugin, WaterSample, floatingForce, registerUnderwaterEffect, wakeStrength };
export type { FloatingBody, FloatingData, FloatingForce };
