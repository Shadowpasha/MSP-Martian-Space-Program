export { BoxCollider2D, BoxCollider2DData, CapsuleCollider2D, CapsuleCollider2DData, ChainCollider2D, ChainCollider2DData, CharacterController2D, CharacterController2DData, CharacterDynamicBodies, CircleCollider2D, CircleCollider2DData, DistanceJoint2D, DistanceJoint2DData, FixedJoint2D, FixedJoint2DData, HingeJoint2D, HingeJoint2DData, MAX_POLYGON_VERTICES, MIN_POLYGON_VERTICES, MotorJoint2D, MotorJoint2DData, MoveAndSlideParams, MoveAndSlideResult, OneWayPlatform2D, OneWayPlatform2DData, Physics2DContactEventData, Physics2DEventType, Physics2DPlugin, PlatformerController2D, PlatformerController2DData, PolygonCollider2D, PolygonCollider2DData, PolygonDecomposition, RigidBody2D, RigidBody2DData, SegmentCollider2D, SegmentCollider2DData, SlideCast, SlideHit, SliderJoint2D, SliderJoint2DData, WheelJoint2D, WheelJoint2DData, computePolygonHull, decomposePolygon2D, moveAndSlide, physics2dPlugin, registerPhysics2DEventBridge } from '../shared/PhysicsEventBridge.js';
export { CollisionEnterEvent, CollisionHitEvent, MassData, Physics2D, Physics2DAPI, Physics2DDebugDraw, Physics2DDebugDrawConfig, Physics2DEvents, Physics2DEventsData, Physics2DPluginConfig, PhysicsModuleFactory, PhysicsWasmModule, RaycastHit, SensorEvent, ShapeCastHit, drawPhysics2DDebug, loadPhysicsModule, setupPhysics2DDebugDraw } from '../shared/Physics2D.js';
export { CAPSULE_ARC_SEGMENTS, Collider2DInstance, Collider2DOutline, Collider2DShape, MIN_CHAIN_POINTS, collider2DOutline, readCollider2DShapes, shapeCenter, shapeOffset } from '../shared/ColliderShape2D.js';
import { App } from '../shared/app.js';
export { BodyType } from '../shared/wasm.js';
import '../shared/resource.js';

/**
 * @file  CharacterController2DSystem.ts — the controller's wiring into a running
 *        2D world, split off at the line the file already drew.
 *
 * The component and `moveAndSlide` are data and arithmetic that any reader of a
 * scene needs; this reaches the solver. Together they put `Physics2D`,
 * `PhysicsSystem` and `Physics2DDebugDraw` in the declaration closure, and from
 * there into every package — see tools/check-core-carries-options.mjs.
 */

/**
 * Register the character-controller system. Runs in FixedUpdate ahead of the
 * physics step, so the resolved Transform is what reaches a kinematic body.
 * Movement goes through Box2D's kinematic mover, which — unlike a generic shape
 * cast — rests a character on the ground instead of wedging it there.
 */
declare function registerCharacterController2DSystem(app: App): void;

export { registerCharacterController2DSystem };
