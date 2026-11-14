import { Joint3DMap, PieceMap, Physics3DConfig } from '../shared/Physics3DPlugin.js';
export { BONE_LIMITS, BoneClass, BoxCollider3D, COLLIDER3D_RING_SEGMENTS, CapsuleCollider3D, CharacterController3D, Collider3DComponent, Collider3DInstance, Collider3DShape, ConvexCollider3D, DEFAULT_PHYSICS3D_CONFIG, DistanceJoint3D, DistanceJoint3DData, FixedJoint3D, FixedJoint3DData, HingeJoint3D, HingeJoint3DData, Joint3DShape, JointMotion3D, MeshCollider3D, Physics3D, Physics3DDebugDraw, Physics3DDebugDrawConfig, Physics3DPlugin, PointJoint3D, PointJoint3DData, Ragdoll, RagdollBone, RagdollData, RagdollFacing, RagdollJoint, RagdollJointData, RagdollLimb, RagdollPlan, RagdollProfile, RigidBody3D, SixDOFJoint3D, SixDOFJoint3DData, SliderJoint3D, SliderJoint3DData, SphereCollider3D, SwingTwistJoint3D, SwingTwistJoint3DData, classifyBone, collider3DWireframe, drawPhysics3DDebug, joint3DSettingsError, physics3dPlugin, placeCollider3DWireframe, planRagdoll, ragdollPlan, readCollider3DShapes, readJoint3D, rotateVec3ByQuat, setupPhysics3DDebugDraw, stepPhysics3D } from '../shared/Physics3DPlugin.js';
import { Physics3DWasmModule } from '../shared/Physics3DQueries.js';
export { Cast3DHit, Contact3DEvent, Overlap3DHit, PHYSICS3D_TRANSFORM_STRIDE, Physics3DEvents, Physics3DEventsData, Physics3DModuleFactory, Physics3DQueries, Sensor3DEvent, assertPhysics3DContract, drainPhysics3DEvents, loadPhysics3DModule } from '../shared/Physics3DQueries.js';
import { Entity, Vec3, Quat } from '../shared/wasm.js';
import { ComponentDef } from '../shared/app.js';
export { BoxCollider3DData, CapsuleCollider3DData, CharacterController3DData, ConvexCollider3DData, MeshCollider3DData, RigidBody3DData, SphereCollider3DData } from '../shared/app.js';
import { ResourceDef } from '../shared/resource.js';

/** The live module and the promise that resolves it, for a caller that must wait. */
interface Physics3DRuntime {
    module: Physics3DWasmModule | null;
    initPromise: Promise<unknown> | null;
    /** Entity -> body id, so a scene teardown can drop the world's population. */
    bodies: Map<Entity, number>;
    /** Entity -> character id. Characters are not bodies and are kept apart. */
    characters: Map<Entity, number>;
    /** Entity -> the joint it declared, with the bodies it was built between. */
    joints: Joint3DMap;
    /** Key -> the body built for that piece of the app's collision geometry. */
    pieces: PieceMap;
    /** The world's configuration (gravity, the scale of a world unit), for what applies forces to it. Null until the plugin is built. */
    config: Physics3DConfig | null;
}
declare const Physics3DRuntime: ResourceDef<Physics3DRuntime>;

interface CompoundColliderPart3D {
    kind: 'box' | 'sphere' | 'capsule';
    position: Vec3;
    rotation: Quat;
    halfExtents?: Vec3;
    radius?: number;
    /** Cylinder half-height; total capsule height is 2 * (halfHeight + radius). */
    halfHeight?: number;
}
interface CompoundCollider3DData {
    /** Local model units. The entity's composed scale applies to sizes and offsets. */
    parts: CompoundColliderPart3D[];
    friction: number;
    restitution: number;
    isSensor: boolean;
    mass: number;
    enabled: boolean;
}
declare const CompoundCollider3D: ComponentDef<CompoundCollider3DData>;

export { CompoundCollider3D, Physics3DConfig, Physics3DRuntime, Physics3DWasmModule };
export type { CompoundCollider3DData, CompoundColliderPart3D };
