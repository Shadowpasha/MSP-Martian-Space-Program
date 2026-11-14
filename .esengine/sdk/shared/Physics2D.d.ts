import { Entity, Vec2 } from './wasm.js';
import { App } from './app.js';
import { ResourceDef } from './resource.js';

/**
 * @file    PhysicsModuleLoader.ts
 * @brief   Loads and initializes the Physics WASM module (standalone or side module)
 */
interface PhysicsWasmModule {
    _physics_init(gx: number, gy: number, timestep: number, substeps: number, contactHertz: number, contactDampingRatio: number, contactSpeed: number): void;
    /** World-level tuning (sleeping/continuous/restitution threshold/max speed). */
    _physics_setWorldConfig(enableSleep: number, enableContinuous: number, restitutionThreshold: number, maxLinearSpeed: number): void;
    _physics_shutdown(): void;
    _physics_createBody(entityId: number, bodyType: number, x: number, y: number, angle: number, gravityScale: number, linearDamping: number, angularDamping: number, fixedRotation: number, bullet: number): void;
    _physics_destroyBody(entityId: number): void;
    _physics_hasBody(entityId: number): number;
    /** Enable/disable a body in place (keeps shapes/velocity/joints). */
    _physics_setBodyEnabled(entityId: number, enabled: number): void;
    /** Destroy all of an entity's shapes, keeping the body, for in-place rebuild. */
    _physics_clearShapes(entityId: number): void;
    _physics_addBoxShape(entityId: number, halfW: number, halfH: number, offX: number, offY: number, radius: number, density: number, friction: number, restitution: number, isSensor: number, categoryBits: number, maskBits: number): void;
    _physics_addCircleShape(entityId: number, radius: number, offX: number, offY: number, density: number, friction: number, restitution: number, isSensor: number, categoryBits: number, maskBits: number): void;
    _physics_addCapsuleShape(entityId: number, radius: number, halfHeight: number, offX: number, offY: number, density: number, friction: number, restitution: number, isSensor: number, categoryBits: number, maskBits: number): void;
    _physics_addSegmentShape(entityId: number, x1: number, y1: number, x2: number, y2: number, density: number, friction: number, restitution: number, isSensor: number, categoryBits: number, maskBits: number): void;
    _physics_addPolygonShape(entityId: number, verticesPtr: number, vertexCount: number, radius: number, density: number, friction: number, restitution: number, isSensor: number, categoryBits: number, maskBits: number): void;
    _physics_addChainShape(entityId: number, pointsPtr: number, pointCount: number, isLoop: number, friction: number, restitution: number, categoryBits: number, maskBits: number): void;
    _physics_step(dt: number): void;
    _physics_setBodyTransform(entityId: number, x: number, y: number, angle: number): void;
    /** Batch world-pixel poses; returns how many live bodies actually moved. */
    _physics_setBodyTransforms?(bufferPtr: number, count: number, ppu: number): number;
    _physics_setBodyTargetTransform(entityId: number, x: number, y: number, angle: number, dt: number): void;
    _physics_getDynamicBodyCount(): number;
    _physics_getBodyCount(): number;
    _physics_getShapeCount(): number;
    _physics_getJointCount(): number;
    _physics_getTrackingRows(): number;
    _physics_getDynamicBodyTransforms(): number;
    /**
     * Render interpolation, done by the module. It keeps the two most recent
     * fixed-step snapshots itself and lerps them, because that loop runs over
     * every dynamic body every frame — the shape of work the no-JIT budget keeps
     * off the JS path (docs/REARCH_NATIVE.md §3.2).
     */
    _physics_capturePoses(): void;
    _physics_getInterpolatedCount(): number;
    _physics_getInterpolatedTransforms(alpha: number): number;
    _physics_collectEvents(): void;
    _physics_getCollisionEnterCount(): number;
    _physics_getCollisionEnterBuffer(): number;
    /** High-speed impact events: [entityA, entityB, px, py, nx, ny, approachSpeed]. */
    _physics_getHitEventCount(): number;
    _physics_getHitEventBuffer(): number;
    _physics_getCollisionExitCount(): number;
    _physics_getCollisionExitBuffer(): number;
    _physics_getSensorEnterCount(): number;
    _physics_getSensorEnterBuffer(): number;
    _physics_getSensorExitCount(): number;
    _physics_getSensorExitBuffer(): number;
    _physics_applyForce(entityId: number, forceX: number, forceY: number): void;
    _physics_applyImpulse(entityId: number, impulseX: number, impulseY: number): void;
    _physics_setLinearVelocity(entityId: number, vx: number, vy: number): void;
    _physics_getLinearVelocity(entityId: number): number;
    _physics_setGravity(gx: number, gy: number): void;
    _physics_getGravity(): number;
    _physics_setAngularVelocity(entityId: number, omega: number): void;
    _physics_getAngularVelocity(entityId: number): number;
    _physics_applyTorque(entityId: number, torque: number): void;
    _physics_applyAngularImpulse(entityId: number, impulse: number): void;
    _physics_updateBodyProperties(entityId: number, bodyType: number, gravityScale: number, linearDamping: number, angularDamping: number, fixedRotation: number, bullet: number): void;
    _physics_setOneWayPlatform(entityId: number, nx: number, ny: number, enable: number): void;
    _physics_setOneWayPlatformLocal(entityId: number, nx: number, ny: number, enable: number): void;
    _physics_createRevoluteJoint(entityIdA: number, entityIdB: number, anchorAx: number, anchorAy: number, anchorBx: number, anchorBy: number, enableMotor: number, motorSpeed: number, maxMotorTorque: number, enableLimit: number, lowerAngle: number, upperAngle: number, collideConnected: number): number;
    _physics_destroyJoint(entityId: number): void;
    _physics_hasJoint(entityId: number): number;
    _physics_setRevoluteMotorSpeed(entityId: number, speed: number): void;
    _physics_setRevoluteMaxMotorTorque(entityId: number, torque: number): void;
    _physics_enableRevoluteMotor(entityId: number, enable: number): void;
    _physics_enableRevoluteLimit(entityId: number, enable: number): void;
    _physics_setRevoluteLimits(entityId: number, lower: number, upper: number): void;
    _physics_getRevoluteAngle(entityId: number): number;
    _physics_getRevoluteMotorTorque(entityId: number): number;
    _physics_createDistanceJoint(entityIdA: number, entityIdB: number, anchorAx: number, anchorAy: number, anchorBx: number, anchorBy: number, length: number, enableSpring: number, hertz: number, dampingRatio: number, enableLimit: number, minLength: number, maxLength: number, enableMotor: number, maxMotorForce: number, motorSpeed: number, collideConnected: number): number;
    _physics_createPrismaticJoint(entityIdA: number, entityIdB: number, anchorAx: number, anchorAy: number, anchorBx: number, anchorBy: number, axisX: number, axisY: number, enableSpring: number, hertz: number, dampingRatio: number, enableLimit: number, lowerTranslation: number, upperTranslation: number, enableMotor: number, maxMotorForce: number, motorSpeed: number, collideConnected: number): number;
    _physics_createWeldJoint(entityIdA: number, entityIdB: number, anchorAx: number, anchorAy: number, anchorBx: number, anchorBy: number, linearHertz: number, angularHertz: number, linearDampingRatio: number, angularDampingRatio: number, collideConnected: number): number;
    _physics_createWheelJoint(entityIdA: number, entityIdB: number, anchorAx: number, anchorAy: number, anchorBx: number, anchorBy: number, axisX: number, axisY: number, enableSpring: number, hertz: number, dampingRatio: number, enableLimit: number, lowerTranslation: number, upperTranslation: number, enableMotor: number, maxMotorTorque: number, motorSpeed: number, collideConnected: number): number;
    _physics_createMotorJoint(entityIdA: number, entityIdB: number, linearVelX: number, linearVelY: number, maxVelocityForce: number, angularVelocity: number, maxVelocityTorque: number, linearHertz: number, linearDampingRatio: number, maxSpringForce: number, angularHertz: number, angularDampingRatio: number, maxSpringTorque: number, collideConnected: number): number;
    _physics_setMotorJointLinearVelocity(entityId: number, vx: number, vy: number): void;
    _physics_setMotorJointAngularVelocity(entityId: number, omega: number): void;
    _physics_setMotorJointMaxVelocityForce(entityId: number, force: number): void;
    _physics_setMotorJointMaxVelocityTorque(entityId: number, torque: number): void;
    _physics_createMouseJoint(entityId: number, targetX: number, targetY: number, hertz: number, dampingRatio: number, maxForce: number): number;
    _physics_setMouseTarget(targetX: number, targetY: number): void;
    _physics_destroyMouseJoint(): void;
    _physics_hasMouseJoint(): number;
    _physics_raycast(originX: number, originY: number, dirX: number, dirY: number, maxDistance: number, maskBits: number): number;
    _physics_getRaycastBuffer(): number;
    _physics_overlapCircle(centerX: number, centerY: number, radius: number, maskBits: number): number;
    _physics_getOverlapBuffer(): number;
    _physics_setAwake(entityId: number, awake: number): void;
    _physics_isAwake(entityId: number): number;
    _physics_shapeCastCircle(centerX: number, centerY: number, radius: number, translationX: number, translationY: number, maskBits: number): number;
    _physics_shapeCastBox(centerX: number, centerY: number, halfW: number, halfH: number, angle: number, translationX: number, translationY: number, maskBits: number): number;
    _physics_shapeCastCapsule(center1X: number, center1Y: number, center2X: number, center2Y: number, radius: number, translationX: number, translationY: number, maskBits: number): number;
    _physics_getShapeCastBuffer(): number;
    _physics_moveCharacter(px: number, py: number, c1x: number, c1y: number, c2x: number, c2y: number, radius: number, velX: number, velY: number, dt: number, upX: number, upY: number, floorCos: number, maskBits: number, selfEntity: number, skinWidth: number, maxSlides: number, snapLength: number, slideOnCeiling: number, carryX: number, carryY: number, flags: number, stepHeight: number): number;
    _physics_getMoveCharacterBuffer(): number;
    _physics_overlapAABB(minX: number, minY: number, maxX: number, maxY: number, maskBits: number): number;
    _physics_getBodyMass(entityId: number): number;
    _physics_getBodyInertia(entityId: number): number;
    _physics_getBodyCenterOfMass(entityId: number): number;
    _physics_getDistanceJointLength(entityId: number): number;
    _physics_getDistanceJointCurrentLength(entityId: number): number;
    _physics_setDistanceJointLength(entityId: number, length: number): void;
    _physics_enableDistanceJointSpring(entityId: number, enable: number): void;
    _physics_enableDistanceJointLimit(entityId: number, enable: number): void;
    _physics_setDistanceJointLimits(entityId: number, minLength: number, maxLength: number): void;
    _physics_enableDistanceJointMotor(entityId: number, enable: number): void;
    _physics_setDistanceJointMotorSpeed(entityId: number, speed: number): void;
    _physics_setDistanceJointMaxMotorForce(entityId: number, force: number): void;
    _physics_getDistanceJointMotorForce(entityId: number): number;
    _physics_getPrismaticJointTranslation(entityId: number): number;
    _physics_getPrismaticJointSpeed(entityId: number): number;
    _physics_enablePrismaticJointSpring(entityId: number, enable: number): void;
    _physics_enablePrismaticJointLimit(entityId: number, enable: number): void;
    _physics_setPrismaticJointLimits(entityId: number, lower: number, upper: number): void;
    _physics_enablePrismaticJointMotor(entityId: number, enable: number): void;
    _physics_setPrismaticJointMotorSpeed(entityId: number, speed: number): void;
    _physics_setPrismaticJointMaxMotorForce(entityId: number, force: number): void;
    _physics_getPrismaticJointMotorForce(entityId: number): number;
    _physics_enableWheelJointSpring(entityId: number, enable: number): void;
    _physics_enableWheelJointLimit(entityId: number, enable: number): void;
    _physics_setWheelJointLimits(entityId: number, lower: number, upper: number): void;
    _physics_enableWheelJointMotor(entityId: number, enable: number): void;
    _physics_setWheelJointMotorSpeed(entityId: number, speed: number): void;
    _physics_setWheelJointMaxMotorTorque(entityId: number, torque: number): void;
    _physics_getWheelJointMotorTorque(entityId: number): number;
    HEAPF32: Float32Array;
    HEAPU8: Uint8Array;
    HEAPU32: Uint32Array;
    _malloc(size: number): number;
    _free(ptr: number): void;
}
type PhysicsModuleFactory = (config?: Record<string, unknown>) => Promise<PhysicsWasmModule>;
declare function loadPhysicsModule(wasmUrl: string, factory?: PhysicsModuleFactory): Promise<PhysicsWasmModule>;

interface Physics2DDebugDrawConfig {
    enabled: boolean;
    showColliders: boolean;
    showVelocity: boolean;
    showContacts: boolean;
}
declare const Physics2DDebugDraw: ResourceDef<Physics2DDebugDrawConfig>;
interface VelocityProvider {
    getLinearVelocity(entity: number): {
        x: number;
        y: number;
    };
}
declare function drawPhysics2DDebug(app: App, physicsApiRes: ResourceDef<VelocityProvider>, physicsEventsRes: ResourceDef<Physics2DEventsData>): void;
declare function setupPhysics2DDebugDraw(app: App, physicsApiRes: ResourceDef<VelocityProvider>, physicsEventsRes: ResourceDef<Physics2DEventsData>): void;

interface Physics2DPluginConfig {
    gravity?: Vec2;
    fixedTimestep?: number;
    subStepCount?: number;
    contactHertz?: number;
    contactDampingRatio?: number;
    contactSpeed?: number;
    collisionLayerMasks?: number[];
    /** Let bodies sleep when at rest (default true). */
    enableSleep?: boolean;
    /** Continuous collision (anti-tunneling) for fast bodies (default true). */
    enableContinuous?: boolean;
    /** Min impact speed (m/s) that produces a bounce; ≤0 keeps the Box2D default. */
    restitutionThreshold?: number;
    /** Clamp on body speed (world units/s); ≤0 keeps the Box2D default. */
    maxLinearSpeed?: number;
}
interface CollisionEnterEvent {
    entityA: Entity;
    entityB: Entity;
    normalX: number;
    normalY: number;
    contactX: number;
    contactY: number;
}
interface SensorEvent {
    sensorEntity: Entity;
    visitorEntity: Entity;
}
/** A high-speed impact (approach speed past the world's hit threshold). */
interface CollisionHitEvent {
    entityA: Entity;
    entityB: Entity;
    pointX: number;
    pointY: number;
    normalX: number;
    normalY: number;
    /** Approach speed (world units/s) — impact strength for gameplay reactions. */
    approachSpeed: number;
}
/** What `Physics2DEvents` holds for a frame, whose tier this shape carries.
 *  @beta */
interface Physics2DEventsData {
    collisionEnters: CollisionEnterEvent[];
    collisionExits: Array<{
        entityA: Entity;
        entityB: Entity;
    }>;
    collisionHits: CollisionHitEvent[];
    sensorEnters: SensorEvent[];
    sensorExits: SensorEvent[];
}
/**
 * This step's collision and trigger events, as a resource. Drained per fixed
 * step, so a system reading it must run inside one — a read from `Update` sees
 * whatever the last step left.
 *
 * @beta
 */
declare const Physics2DEvents: ResourceDef<Physics2DEventsData>;
interface RaycastHit {
    entity: Entity;
    point: Vec2;
    normal: Vec2;
    fraction: number;
}
type ShapeCastHit = RaycastHit;
/** One step of the native kinematic mover: resolved displacement (pixels), slid
 *  velocity (pixels/s), and the surface contact classification. */
interface MoverResult {
    dx: number;
    dy: number;
    velX: number;
    velY: number;
    isOnFloor: boolean;
    isOnWall: boolean;
    isOnCeiling: boolean;
    floorNormalX: number;
    floorNormalY: number;
    /** The entity it stands on, or null when airborne. */
    floorEntity: Entity | null;
    /** The dynamic bodies it pressed against this move, with the normals facing it. Absent when none. */
    hits?: {
        entity: Entity;
        normalX: number;
        normalY: number;
    }[];
}
/** What else a {@link MoverResult} move is asked to do. */
interface MoverOptions {
    /** Moved with what it stands on, world pixels per second: no part of its own velocity, so what it reports back excludes it. */
    carry?: Vec2;
    /** Pass through every one-way surface: a drop. */
    dropThrough?: boolean;
    /** Pass through dynamic bodies. */
    ignoreDynamic?: boolean;
    /** Treat a slope too steep to stand on as a wall, not something to walk up. */
    blockSteepSlopes?: boolean;
    /** It stood on a floor before this move: only then can it step over a ledge. */
    wasOnFloor?: boolean;
    /** The highest ledge it steps over, world pixels. */
    stepHeight?: number;
}
interface MassData {
    mass: number;
    inertia: number;
    centerOfMass: Vec2;
}

/**
 * Unit contract: Box2D simulates in meters; the engine converts at the
 * pixels-per-unit (PPU) boundary. Spatial *queries* (`raycast` / `shapeCast` /
 * `overlapCircle` / `moveCharacter`) take and return **world pixels**, scaled by
 * the live PPU. Everything that talks to the solver directly — forces, impulses,
 * velocities, `setGravity` — is in **meters** (m/s, m/s²), matching the collider
 * component dimensions. Convert with {@link getPixelsPerUnit} when mixing the two.
 */
declare class Physics2DAPI {
    private module_;
    private ppu_;
    /**
     * Starting state for both construction paths. `_fromModule` uses `Object.create`,
     * which runs no field initializer — a default declared as `ppu_ = 100` would be
     * `undefined` there.
     */
    private init_;
    /** @internal Update the pixels-per-unit used to scale queries by default. */
    setPixelsPerUnit(ppu: number): void;
    /**
     * Live pixels-per-unit (world pixels per Box2D meter). Collider dimensions are
     * stored in meters, so consumers that cast a collider's shape through the
     * pixel-space query API (raycast/shapeCast) must scale by this.
     */
    getPixelsPerUnit(): number;
    constructor(app: App);
    /** @internal */
    static _fromModule(module: PhysicsWasmModule): Physics2DAPI;
    applyForce(entity: Entity, force: Vec2): void;
    applyImpulse(entity: Entity, impulse: Vec2): void;
    setLinearVelocity(entity: Entity, velocity: Vec2): void;
    getLinearVelocity(entity: Entity): Vec2;
    /** World gravity in **meters/s²** (Box2D space), e.g. `{ x: 0, y: -9.81 }`. */
    setGravity(gravity: Vec2): void;
    getGravity(): Vec2;
    setAngularVelocity(entity: Entity, omega: number): void;
    getAngularVelocity(entity: Entity): number;
    applyTorque(entity: Entity, torque: number): void;
    applyAngularImpulse(entity: Entity, impulse: number): void;
    createRevoluteJoint(entityA: Entity, entityB: Entity, anchorA: Vec2, anchorB: Vec2, options?: {
        enableMotor?: boolean;
        motorSpeed?: number;
        maxMotorTorque?: number;
        enableLimit?: boolean;
        lowerAngle?: number;
        upperAngle?: number;
        collideConnected?: boolean;
    }): boolean;
    destroyJoint(entity: Entity): void;
    setRevoluteMotorSpeed(entity: Entity, speed: number): void;
    setRevoluteMaxMotorTorque(entity: Entity, torque: number): void;
    enableRevoluteMotor(entity: Entity, enable: boolean): void;
    enableRevoluteLimit(entity: Entity, enable: boolean): void;
    setRevoluteLimits(entity: Entity, lower: number, upper: number): void;
    getRevoluteAngle(entity: Entity): number;
    getRevoluteMotorTorque(entity: Entity): number;
    raycast(origin: Vec2, direction: Vec2, maxDistance: number, maskBits?: number, ppu?: number): RaycastHit[];
    overlapCircle(center: Vec2, radius: number, maskBits?: number, ppu?: number): Entity[];
    setAwake(entity: Entity, awake: boolean): void;
    isAwake(entity: Entity): boolean;
    shapeCastCircle(center: Vec2, radius: number, translation: Vec2, maskBits?: number, ppu?: number): ShapeCastHit[];
    shapeCastBox(center: Vec2, halfExtents: Vec2, angle: number, translation: Vec2, maskBits?: number, ppu?: number): ShapeCastHit[];
    shapeCastCapsule(center1: Vec2, center2: Vec2, radius: number, translation: Vec2, maskBits?: number, ppu?: number): ShapeCastHit[];
    /**
     * Advance a kinematic capsule character one step against the world using Box2D's
     * native mover (collide-into-planes + depenetrating slide). Unlike a raw shape
     * cast this resolves resting/touching contacts with valid normals, so a grounded
     * character slides instead of wedging. Capsule endpoints/radius and `pos`/`velocity`
     * are world pixels; `dt` seconds; `up` a unit vector; `floorCos = cos(floorMaxAngle)`.
     * `self` is excluded from the collision. Returns null if the module isn't ready.
     */
    moveCharacter(pos: Vec2, c1: Vec2, c2: Vec2, radius: number, velocity: Vec2, dt: number, up: Vec2, floorCos: number, maskBits: number, self: Entity, skinWidth?: number, maxSlides?: number, snapLength?: number, slideOnCeiling?: boolean, ppu?: number, options?: MoverOptions): MoverResult | null;
    overlapAABB(min: Vec2, max: Vec2, maskBits?: number, ppu?: number): Entity[];
    getMass(entity: Entity): number;
    getInertia(entity: Entity): number;
    getCenterOfMass(entity: Entity, ppu?: number): Vec2;
    getMassData(entity: Entity, ppu?: number): MassData;
    getDistanceJointLength(entity: Entity, ppu?: number): number;
    getDistanceJointCurrentLength(entity: Entity, ppu?: number): number;
    setDistanceJointLength(entity: Entity, length: number, ppu?: number): void;
    enableDistanceJointSpring(entity: Entity, enable: boolean): void;
    enableDistanceJointLimit(entity: Entity, enable: boolean): void;
    setDistanceJointLimits(entity: Entity, minLength: number, maxLength: number, ppu?: number): void;
    enableDistanceJointMotor(entity: Entity, enable: boolean): void;
    setDistanceJointMotorSpeed(entity: Entity, speed: number): void;
    setDistanceJointMaxMotorForce(entity: Entity, force: number): void;
    getDistanceJointMotorForce(entity: Entity): number;
    getPrismaticJointTranslation(entity: Entity, ppu?: number): number;
    getPrismaticJointSpeed(entity: Entity, ppu?: number): number;
    enablePrismaticJointSpring(entity: Entity, enable: boolean): void;
    enablePrismaticJointLimit(entity: Entity, enable: boolean): void;
    setPrismaticJointLimits(entity: Entity, lower: number, upper: number, ppu?: number): void;
    enablePrismaticJointMotor(entity: Entity, enable: boolean): void;
    setPrismaticJointMotorSpeed(entity: Entity, speed: number): void;
    setPrismaticJointMaxMotorForce(entity: Entity, force: number): void;
    getPrismaticJointMotorForce(entity: Entity): number;
    enableWheelJointSpring(entity: Entity, enable: boolean): void;
    enableWheelJointLimit(entity: Entity, enable: boolean): void;
    setWheelJointLimits(entity: Entity, lower: number, upper: number, ppu?: number): void;
    enableWheelJointMotor(entity: Entity, enable: boolean): void;
    setWheelJointMotorSpeed(entity: Entity, speed: number): void;
    setWheelJointMaxMotorTorque(entity: Entity, torque: number): void;
    getWheelJointMotorTorque(entity: Entity): number;
    setMotorJointLinearVelocity(entity: Entity, velocity: Vec2, ppu?: number): void;
    setMotorJointAngularVelocity(entity: Entity, omega: number): void;
    setMotorJointMaxVelocityForce(entity: Entity, force: number): void;
    setMotorJointMaxVelocityTorque(entity: Entity, torque: number): void;
    createMouseJoint(entity: Entity, target: Vec2, opts?: {
        hertz?: number;
        dampingRatio?: number;
        maxForce?: number;
    }, ppu?: number): boolean;
    setMouseTarget(target: Vec2, ppu?: number): void;
    destroyMouseJoint(): void;
    hasMouseJoint(): boolean;
    private readUniqueEntityBuffer_;
    private readShapeCastBuffer_;
    static setDebugDraw(app: App, enabled: boolean): void;
    static setDebugDrawConfig(app: App, config: Partial<Physics2DDebugDrawConfig>): void;
}
/**
 * Resource published by `Physics2DPlugin` once the wasm module is ready.
 * Game code reads it as `Res(Physics)` / `app.getResource(Physics)` to call forces,
 * impulses, joint helpers, raycasts, etc.
 */
/**
 * The physics world, as `Res(Physics)` hands it over — queries, impulses and the
 * step's own knobs. Bodies and colliders are components; this is for what has no
 * component to be.
 *
 * `@beta`: the corpus reaches three of thirty-seven physics symbols, so the
 * vocabulary is settled well ahead of the evidence for it.
 *
 * @beta
 */
declare const Physics2D: ResourceDef<Physics2DAPI>;

export { Physics2D, Physics2DAPI, Physics2DDebugDraw, Physics2DEvents, drawPhysics2DDebug, loadPhysicsModule, setupPhysics2DDebugDraw };
export type { CollisionEnterEvent, CollisionHitEvent, MassData, Physics2DDebugDrawConfig, Physics2DEventsData, Physics2DPluginConfig, PhysicsModuleFactory, PhysicsWasmModule, RaycastHit, SensorEvent, ShapeCastHit };
