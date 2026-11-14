import { Entity } from './wasm.js';
import { ResourceDef } from './resource.js';

/** What the module exports. Kept in step with Physics3DModuleEntry.cpp by
 *  {@link assertPhysics3DContract} — a TypeScript interface is gone at run time,
 *  and a module built before the JS that drives it installs happily and then
 *  throws once per frame for the length of the session. */
interface Physics3DWasmModule {
    _physics3d_init(gx: number, gy: number, gz: number, maxBodies: number): void;
    _physics3d_shutdown(): void;
    _physics3d_isReady(): number;
    _physics3d_step(dt: number, collisionSteps: number): void;
    _physics3d_optimize(): void;
    _physics3d_setLayerMask(layer: number, mask: number): void;
    /** Each value <= 0 keeps the backend's own default; after init, before bodies. */
    _physics3d_setSolver(velocityIterations: number, positionIterations: number, allowSleep: number, bounceThreshold: number): void;
    _physics3d_addBox(entity: number, hx: number, hy: number, hz: number, px: number, py: number, pz: number, qx: number, qy: number, qz: number, qw: number, motion: number, gravityScale: number, linearDamping: number, angularDamping: number, fixedRotation: number, layer: number, continuous: number, friction: number, restitution: number, isSensor: number, cx: number, cy: number, cz: number): number;
    _physics3d_addSphere(entity: number, radius: number, px: number, py: number, pz: number, qx: number, qy: number, qz: number, qw: number, motion: number, gravityScale: number, linearDamping: number, angularDamping: number, fixedRotation: number, layer: number, continuous: number, friction: number, restitution: number, isSensor: number, cx: number, cy: number, cz: number): number;
    _physics3d_addCapsule(entity: number, radius: number, halfHeight: number, px: number, py: number, pz: number, qx: number, qy: number, qz: number, qw: number, motion: number, gravityScale: number, linearDamping: number, angularDamping: number, fixedRotation: number, layer: number, continuous: number, friction: number, restitution: number, isSensor: number, cx: number, cy: number, cz: number): number;
    _physics3d_addMeshBody(entity: number, vertexPtr: number, vertexCount: number, indexPtr: number, indexCount: number, px: number, py: number, pz: number, qx: number, qy: number, qz: number, qw: number, layer: number, friction: number, restitution: number): number;
    _physics3d_addConvexBody(entity: number, vertexPtr: number, vertexCount: number, px: number, py: number, pz: number, qx: number, qy: number, qz: number, qw: number, motion: number, gravityScale: number, linearDamping: number, angularDamping: number, fixedRotation: number, layer: number, continuous: number, friction: number, restitution: number, isSensor: number): number;
    _physics3d_removeBody(bodyId: number): void;
    /** Optional for older binaries. Required by CompoundCollider3D, never silently approximated. */
    _physics3d_addCompound?(entity: number, parts: number, count: number, px: number, py: number, pz: number, qx: number, qy: number, qz: number, qw: number, motion: number, gravityScale: number, linearDamping: number, angularDamping: number, fixedRotation: number, layer: number, continuous: number, friction: number, restitution: number, isSensor: number, mass: number): number;
    _malloc(bytes: number): number;
    _free(ptr: number): void;
    _physics3d_setTransform(bodyId: number, px: number, py: number, pz: number, qx: number, qy: number, qz: number, qw: number): void;
    _physics3d_setLinearVelocity(bodyId: number, vx: number, vy: number, vz: number): void;
    _physics3d_getBodyState(bodyId: number): number;
    /** Writes (mass, wx, wy, wz) to the query buffer; 0 when the body is gone or does not move. */
    _physics3d_getBodyDynamics?(bodyId: number): number;
    /** A force in newtons at a world point, over the next step. */
    _physics3d_addForce?(bodyId: number, fx: number, fy: number, fz: number, px: number, py: number, pz: number): void;
    /** A torque in newton metres, over the next step. */
    _physics3d_addTorque?(bodyId: number, tx: number, ty: number, tz: number): void;
    _physics3d_addCharacter(entity: number, radius: number, halfHeight: number, px: number, py: number, pz: number, maxSlope: number, mass: number, layer: number, pushForce: number): number;
    _physics3d_removeCharacter(characterId: number): void;
    _physics3d_moveCharacter(characterId: number, vx: number, vy: number, vz: number, dt: number, stepUp: number, stepDown: number): void;
    _physics3d_setCharacterPosition(characterId: number, px: number, py: number, pz: number): void;
    /** `_physics3d_raycast` with flags: bit 0 also meets characters. */
    _physics3d_raycastWith(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, layerMask: number, flags: number): number;
    _physics3d_raycast(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, layerMask: number): number;
    _physics3d_sphereCast(px: number, py: number, pz: number, radius: number, dx: number, dy: number, dz: number, layerMask: number): number;
    _physics3d_overlapSphere(px: number, py: number, pz: number, radius: number, layerMask: number): number;
    _physics3d_overlapBox(px: number, py: number, pz: number, hx: number, hy: number, hz: number, layerMask: number): number;
    _physics3d_addSwingTwistJoint(entity: number, bodyA: number, bodyB: number, px: number, py: number, pz: number, ax: number, ay: number, az: number, nx: number, ny: number, nz: number, normalHalf: number, planeHalf: number, twistMin: number, twistMax: number, collideConnected: number): number;
    _physics3d_addSixDOFJoint(entity: number, bodyA: number, bodyB: number, px: number, py: number, pz: number, ax: number, ay: number, az: number, nx: number, ny: number, nz: number, translationMotion: number, rotationMotion: number, lx: number, ly: number, lz: number, hx: number, hy: number, hz: number, rx: number, ry: number, rz: number, sx: number, sy: number, sz: number, collideConnected: number): number;
    _physics3d_setAdvancedJointMotor(entity: number, enable: number, vx: number, vy: number, vz: number, wx: number, wy: number, wz: number, maxForce: number, maxTorque: number): void;
    _physics3d_addPointJoint(entity: number, bodyA: number, bodyB: number, px: number, py: number, pz: number, collideConnected: number): number;
    _physics3d_addHingeJoint(entity: number, bodyA: number, bodyB: number, px: number, py: number, pz: number, ax: number, ay: number, az: number, enableLimit: number, lower: number, upper: number, enableMotor: number, motorSpeed: number, maxTorque: number, collideConnected: number): number;
    _physics3d_addSliderJoint(entity: number, bodyA: number, bodyB: number, px: number, py: number, pz: number, ax: number, ay: number, az: number, enableLimit: number, lower: number, upper: number, enableMotor: number, motorSpeed: number, maxForce: number, collideConnected: number): number;
    _physics3d_addDistanceJoint(entity: number, bodyA: number, bodyB: number, ax: number, ay: number, az: number, bx: number, by: number, bz: number, minLength: number, maxLength: number, frequency: number, damping: number, collideConnected: number): number;
    _physics3d_addFixedJoint(entity: number, bodyA: number, bodyB: number, collideConnected: number): number;
    _physics3d_removeJoint(entity: number, bodyA: number, bodyB: number): void;
    _physics3d_setJointMotor(entity: number, enable: number, speed: number): void;
    _physics3d_jointValue(entity: number): number;
    _physics3d_contactEnters(): number;
    _physics3d_contactEntersBytes(): number;
    _physics3d_contactExits(): number;
    _physics3d_contactExitsBytes(): number;
    _physics3d_sensorEnters(): number;
    _physics3d_sensorEntersBytes(): number;
    _physics3d_sensorExits(): number;
    _physics3d_sensorExitsBytes(): number;
    _physics3d_transforms(): number;
    _physics3d_transformsBytes(): number;
    _physics3d_queryResult(): number;
    _physics3d_queryResultBytes(): number;
    HEAPF32: Float32Array;
    HEAPU32: Uint32Array;
}
type Physics3DModuleFactory = (options?: {
    wasmBinary?: ArrayBuffer;
}) => Promise<Physics3DWasmModule>;
/** One readback record: entity, position, rotation. */
declare const PHYSICS3D_TRANSFORM_STRIDE = 8;
/** Throws naming what is missing, rather than letting the first frame do it. */
declare function assertPhysics3DContract(module: unknown): void;
/** Load the module from `url`, or adopt a factory a host already resolved. */
declare function loadPhysics3DModule(url: string, factory?: Physics3DModuleFactory): Promise<Physics3DWasmModule>;
/** Two bodies met, and where. */
interface Contact3DEvent {
    entityA: Entity;
    entityB: Entity;
    normalX: number;
    normalY: number;
    normalZ: number;
    pointX: number;
    pointY: number;
    pointZ: number;
}
/** A sensor was entered or left. The SENSOR is always named first. */
interface Sensor3DEvent {
    sensorEntity: Entity;
    visitorEntity: Entity;
}
interface Physics3DEventsData {
    contactEnters: Contact3DEvent[];
    /** Ends carry only the pair: at that moment the bodies are locked and one may
     *  already be gone, so there is no geometry left to report. */
    contactExits: Array<{
        entityA: Entity;
        entityB: Entity;
    }>;
    sensorEnters: Sensor3DEvent[];
    sensorExits: Sensor3DEvent[];
}
/**
 * This step's 3D collision and trigger events. Drained per fixed step, so a
 * system reading it must run inside one — a read from `Update` sees whatever the
 * last step left.
 *
 * @experimental
 */
declare const Physics3DEvents: ResourceDef<Physics3DEventsData>;
/**
 * Refill `events` from the module's four buffers. A contact point is made in the world's own
 * units, so `pixelsPerUnit` brings it into the space `Transform` and the queries speak.
 */
declare function drainPhysics3DEvents(module: Physics3DWasmModule, events: Physics3DEventsData, pixelsPerUnit?: number): void;

/**
 * @file    Physics3DQueries.ts
 * @brief   Asking the 3D world what is where, in the units a scene is authored in.
 * @details Every distance crosses in metres and comes back in world units, the
 *          same contract the step follows — a query answering in the solver's
 *          units would be a second set of numbers for a caller to remember.
 */

/** Where a cast met something, in world units. */
interface Cast3DHit {
    entity: Entity;
    /** How far along the cast, 0..1. */
    fraction: number;
    x: number;
    y: number;
    z: number;
    normalX: number;
    normalY: number;
    normalZ: number;
}
/** One body an overlap test found, and a point where it touches. */
interface Overlap3DHit {
    entity: Entity;
    x: number;
    y: number;
    z: number;
}
/**
 * The 3D world's spatial queries.
 *
 * A layer mask of 0 means every layer: a caller that did not ask to filter is
 * asking for everything, and answering "nothing" there would be a silent empty
 * result for the commonest call.
 */
declare class Physics3DQueries {
    private readonly module_;
    private readonly ppu_;
    private readonly characters_;
    constructor(module_: Physics3DWasmModule, ppu_: number, characters_?: ReadonlyMap<Entity, number>);
    /**
     * Put a character somewhere, rather than moving it there. Its position is an
     * OUTPUT — the step writes it into `Transform` every frame — so this is the
     * only way to say it, and the velocity is dropped with the move.
     *
     * Answers false for an entity the world has no character for.
     */
    teleportCharacter(entity: Entity, position: {
        x: number;
        y: number;
        z: number;
    }): boolean;
    /**
     * The nearest body along a ray, or null. `direction` carries its length.
     *
     * Characters (CharacterController3D) are passed through unless `options.characters` asks for them: line of sight and
     * a camera's boom ask about the world, a shot asks about who is in the way. A ray that starts inside a character
     * meets it at once, so a shooter leaves its own out by its layer.
     */
    raycast(origin: {
        x: number;
        y: number;
        z: number;
    }, direction: {
        x: number;
        y: number;
        z: number;
    }, layerMask?: number, options?: {
        characters?: boolean;
    }): Cast3DHit | null;
    /**
     * Sweeps a sphere along `direction` and returns the first body it meets.
     *
     * What a ray cannot answer: a ray is infinitely thin, so it passes through
     * the very gaps a moving body would not fit — "can this thing get there" is
     * a different question from "is anything on this line".
     */
    sphereCast(origin: {
        x: number;
        y: number;
        z: number;
    }, radius: number, direction: {
        x: number;
        y: number;
        z: number;
    }, layerMask?: number): Cast3DHit | null;
    /** Every body overlapping a sphere — what a spawn point asks before it spawns. */
    overlapSphere(centre: {
        x: number;
        y: number;
        z: number;
    }, radius: number, layerMask?: number): Overlap3DHit[];
    /** The same for a box, given its half-extents. */
    overlapBox(centre: {
        x: number;
        y: number;
        z: number;
    }, halfExtents: {
        x: number;
        y: number;
        z: number;
    }, layerMask?: number): Overlap3DHit[];
    private readCast_;
    private readOverlaps_;
}

export { PHYSICS3D_TRANSFORM_STRIDE, Physics3DEvents, Physics3DQueries, assertPhysics3DContract, drainPhysics3DEvents, loadPhysics3DModule };
export type { Cast3DHit, Contact3DEvent, Overlap3DHit, Physics3DEventsData, Physics3DModuleFactory, Physics3DWasmModule, Sensor3DEvent };
