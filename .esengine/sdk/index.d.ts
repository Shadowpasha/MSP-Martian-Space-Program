import { Entity, Vec2, Color, Vec3 as Vec3$2, Quat, CppRegistry, ESEngineModule, UIVisualType, UIVisualFit, Vec4, UIFillMethod, UIFillOrigin, MaskMode, FlexDirection, FlexWrap, JustifyContent, AlignItems, AlignContent, Padding, EasingType, BodyType, LoopMode, TweenState, TweenTarget } from './shared/wasm.js';
export { AlignSelf, BillboardMode, ClearFlags, EmitterShape, FontHandle, ForceFieldType, INVALID_ENTITY, INVALID_FONT, INVALID_MATERIAL, INVALID_TEXTURE, LightType, ParticleColliderShape, ParticleCollisionFallback, ParticleCollisionMode, ParticleEasing, ParticleRenderMode, ProjectionType, ReflectionAxis, ReflectionQuality, ReflectionUpdate, ShapeType, SimulationSpace, SpriteDrawMode, SpriteMaskInteraction, SubEmitterTrigger, TextureHandle, UIDisplay, UIPointerEvents, UIPositionType, color, quat, vec2, vec3, vec4 } from './shared/wasm.js';
import { SceneData, PrefabData, PrefabOverride, FlattenContext, FlattenResult, PrefabEntityId, ComponentData$1 as ComponentData, ProcessedEntity, DeferredRecord, Assets, World, ShaderHandle, Plugin, App, InputState, ComponentDef, CommandsInstance, AnyComponentDef, ComponentData as ComponentData$1, Schedule, ComponentMetadata, SystemTouches, MeshData, MeshChannelDesc, FrameCosts, MaterialHandle, BlendMode, MeshRendererGeometry, SpriteData, TransformData, ShadowCaster2DData, BuiltinComponentDef, ScreenOverlayData, BundleMode, SceneEntityData, SceneConfig, RenderReadiness, RenderReadinessStamp, SystemDef, SceneManagerState, AddressableManifest, ManifestModel, Catalog, AotManifest, ParsedTextureImportSettings, SpineCullingRect, Backend, SpriteAnimClip, MeshRendererData, ImpostorData, LocaleCatalog, FrameProfile, SystemCost, ScopeCost, CatalogData, WebAppOptions } from './shared/app.js';
export { ABI_LAYOUT_HASH, Added, AddedWrapper, AddressableAssetType, AddressableManifestAsset, AddressableManifestGroup, Ambiguity, And, AotHost, AotSystemDecl, ApplyUpdateResult, AssetContentType, AssetFieldMeta, AssetFieldType, AssetLease, AssetRef, AssetRefCounter, AssetRefInfo, AssetScope, AssetTypeEntry, BUNDLE_MODES, Billboard, BillboardData, BitmapText, BitmapTextData, BoxCollider3DData, CacheCleanupPreview, CacheCleanupResult, Camera, CameraData, CameraRenderParams, Canvas, CanvasData, CapsuleCollider3DData, CatalogEntry, Changed, ChangedWrapper, CharacterController3DData, Children, ChildrenData, Commands, CommandsDescriptor, ComponentsData, CompressedTextureFormat, ContentCacheEntry, ContentCacheReport, ConvexCollider3DData, CookedAtlasInfo, CullMode, DEFAULT_SCREEN_SCALING, DOMAIN_SCRIPTS, DOMAIN_UNATTRIBUTED, Disabled, Draggable, DraggableData, DragonBonesAnimation, DragonBonesAnimationData, DrawCallback, DrawFrameInfo, EditorAssetType, EntityCommands, EventDef, EventReader, EventReaderDescriptor, EventReaderInstance, EventRegistry, EventWriter, EventWriterDescriptor, EventWriterInstance, FieldMeta, FilterExpr, FrameProfileInput, FrameTiming, GamepadAxis, GamepadButton, GetWorld, GetWorldDescriptor, GroupOpacity, GroupOpacityData, HdrFormat, HttpBackend, Impostor, InferParam, InferParams, Input, InputPlugin, JsonResult, Light, LightData, LightProbeVolume, LightProbeVolumeData, LocalTransform, LocalTransformData, LocaleEntry, LocaleResult, LocaleTableAsset, Localization, LocalizationAPI, MATERIAL_FORMAT_VERSION, MAX_PRESENT_WAIT_MS, MESH_MAX_BONES, Marker, MarkerData, Material, MaterialAssetData, MaterialData, MaterialOptions, MeshChannel, MeshChannelType, MeshCollider3DData, MeshMorphTargets, MeshRenderer, MissingAssetCallback, MissingAssetsError, Mut, MutWrapper, Name, NameData, NestedPrefabRef, Not, Occluder, OccluderData, Or, OutputTransform, Parent, ParentData, ParticleCollider, ParticleColliderData, ParticleEmitter, ParticleEmitterData, ParticleForceField, ParticleForceFieldData, PlanarReflection, PlanarReflectionData, PluginDependency, PluralCategory, PluralForms, PluralSelector, PostProcess, PostProcessAPI, PostProcessStack, PostProcessVolume, PostProcessVolumeData, PreSceneDrawCallback, PreSceneDrawInfo, PrefabEntityData, ProfileNode, ProfileNodeKind, PseudoLocalizationOptions, Query, QueryArg, QueryBuilder, QueryCost, QueryDescriptor, QueryInstance, QueryResult, RAW_PAYLOAD_UPLOAD, ReflectionProbe, ReflectionProbeData, Removed, RemovedQueryDescriptor, RemovedQueryInstance, RenderDemand, RenderOnDemandOptions, RenderParams, RenderPipeline, RenderSurfaceSource, RigidBody3DData, RunCondition, RuntimeOnly, SCENE_FORMAT_VERSION, SCREEN_FIT_OFF, ScaleMode, SceneComponentCodec, SceneComponentData, SceneContext, SceneLoadCancelled, SceneLoadOptions, SceneLoadProgressCallback, SceneManager, SceneMigrationResult, SceneOwner, SceneOwnerData, SceneStatus, ScopeRemainder, ScreenOverlay, ScreenScaling, ScreenScalingData, ShaderSources, ShadowCaster2D, ShapeRenderer, ShapeRendererData, SkeletalFieldMeta, SliceBorder, SortingGroup, SortingGroupData, SphereCollider3DData, SpineAnimation, SpineAnimationData, SpineCullingContract, SpineLoadResult, SpineManifestContract, SpringBone, SpringBoneCollider, SpringBoneColliderData, SpringBoneData, Sprite, SpriteAnimEvent, SpriteAnimEventHandler, SpriteAnimFrame, SpriteAnimation, SpriteAnimationAPI, SpriteAnimator, SpriteAnimatorData, SpriteMask, SpriteMaskData, SubsystemActivity, SubsystemEvent, SubsystemPhase, SubsystemRegistry, SubsystemStatus, SystemOptions, SystemParam, SystemRunner, SystemSet, SystemSetOptions, TParams, TextureFormatRecord, TextureFormatReport, TextureResult as TextureInfo, TextureRef, TextureUploadDecision, TextureUploadReason, TimeOfDay, TimeOfDayData, TouchPoint, TrailRenderer, TrailRendererData, Transform, TransitionOptions, UNTIMED_SCOPE_LABEL, UniformValue, UnwrapQueryArg, UpdateStages, UpdateStatus, UploadedGpuFormat, Velocity, VelocityData, Viewport, Weather, WeatherData, With, Without, WorldTransform, WorldTransformData, addPlugin, addStartupSystem, addSystem, addSystemSetToSchedule, addSystemToSchedule, atlasCatalogFields, buildFrameProfile, clearDrawCallbacks, clearUserComponents, compressedUploadDecision, decodeMesh, defaultPluralSelector, defineComponent, defineEvent, defineSystem, defineSystemSet, defineTag, encodeChannelTable, encodeMesh, enumOptions, findEntityByName, flushPendingRegistrations, getAddressableType, getAddressableTypeByEditorType, getAllAssetExtensions, getAssetMimeType, getAssetTypeEntry, getComponent, getComponentAssetFieldDescriptors, getComponentAssetFields, getComponentDefaults, getComponentFieldMeta, getComponentRegistry, getComponentSkeletalFieldDescriptor, getCustomExtensions, getEditorType, getReplicatedFields, getUserComponent, getUserComponentFingerprint, getUserComponents, getWeChatPackOptions, inputEventCallbacks, inputPlugin, interpolate, isBuiltinComponent, isCustomExtension, isKnownAssetExtension, isTextureRef, loadComponent, loadSceneData, loadSceneWithAssets, looksLikeAssetPath, matchLocale, meanFrameProfile, migrateSceneData, normalizeBundleMode, packChannels, parseLocaleTable, pseudoLocalize, readPtrField, registerComponent, registerDrawCallback, registerPreSceneDrawCallback, registerSceneComponentCodec, remapEntityFields, resetWorldTo, sceneOutOfBandFields, scopeDomain, selectPluralForm, serializeScene, shutdownMaterialAPI, spineCullingContractFrom, spineManifestContractFrom, textureFormatOf, textureImportSettingsFrom, unregisterComponent, unregisterDrawCallback, unregisterPreSceneDrawCallback, updateCameraAspectRatio, wrapSceneSystem, writePtrField } from './shared/app.js';
export { BoxCollider2D, BoxCollider2DData, CapsuleCollider2D, CapsuleCollider2DData, ChainCollider2D, CharacterController2D, CharacterController2DData, CharacterDynamicBodies, CircleCollider2D, CircleCollider2DData, DistanceJoint2D, FixedJoint2D, HingeJoint2D, MAX_POLYGON_VERTICES, MIN_POLYGON_VERTICES, MotorJoint2D, OneWayPlatform2D, Physics2DContactEventData, Physics2DEventType, Physics2DPlugin, PlatformerController2D, PlatformerController2DData, PolygonCollider2D, PolygonDecomposition, RigidBody2D, RigidBody2DData, SegmentCollider2D, SliderJoint2D, WheelJoint2D, computePolygonHull, decomposePolygon2D } from './shared/PhysicsEventBridge.js';
export { CAPSULE_ARC_SEGMENTS, Collider2DInstance, Collider2DOutline, Collider2DShape, MIN_CHAIN_POINTS, collider2DOutline, readCollider2DShapes, shapeCenter, shapeOffset } from './shared/ColliderShape2D.js';
import { Physics3DConfig } from './shared/Physics3DPlugin.js';
export { BONE_LIMITS, BoneClass, BoxCollider3D, COLLIDER3D_RING_SEGMENTS, CapsuleCollider3D, CharacterController3D, Collider3DComponent, Collider3DInstance, Collider3DShape, CollisionGeometry, CollisionGeometryRes, CollisionPiece, ConvexCollider3D, DistanceJoint3D, DistanceJoint3DData, FixedJoint3D, FixedJoint3DData, HingeJoint3D, HingeJoint3DData, Joint3DShape, JointMotion3D, MeshCollider3D, Physics3D, Physics3DDebugDraw, Physics3DDebugDrawConfig, Physics3DPlugin, PointJoint3D, PointJoint3DData, Ragdoll, RagdollData, RagdollFacing, RagdollJoint, RagdollJointData, RagdollPlan, RagdollProfile, RigidBody3D, SixDOFJoint3D, SixDOFJoint3DData, SliderJoint3D, SliderJoint3DData, SphereCollider3D, SwingTwistJoint3D, SwingTwistJoint3DData, classifyBone, collider3DWireframe, collisionGeometryOf, drawPhysics3DDebug, joint3DSettingsError, placeCollider3DWireframe, ragdollPlan, readCollider3DShapes, readJoint3D, rotateVec3ByQuat } from './shared/Physics3DPlugin.js';
import { ResourceDef, TimeData, QualityReport, QualityController, PlatformImage, PlatformCanvas, BusEffectDef, BusDuckRule, AudioLoadType, AudioAPI, Physics3DBackend, QualityConfig, AudioHandle, PlatformRewardedAd, PlatformInterstitialAd, PlatformRewardedAdResult, PlatformVideoBackend, VideoStreamOptions, VideoStreamHandle, PlatformSocket, PlatformSocketReadyState, PlatformSocketOptions, PlatformSocketEvents, PlatformAdapter, PlatformRequestOptions, PlatformResponse, WasmInstantiateResult, PlatformShareOptions, PlatformPaymentRequest, PlatformScreenRecorder, SideModuleHost, SideModuleId, EmscriptenFactory, DeviceCapabilities, DeviceState, PowerState, MotionOptions, DeviceResult, MotionSample, VibrationOptions } from './shared/resource.js';
export { AchievementProvider, Achievements, AchievementsAPI, Audio, AudioBackendInitOptions, AudioBufferHandle, AudioBufferStats, AudioBus, AudioBusConfig, AudioDelivery, AudioMixer, AudioMixerConfig, BUILTIN_AUDIO_BUSES, BuiltinSideModuleId, CompressorEffectDef, DeviceQualityInfo, DeviceQualityRule, DeviceRequestStatus, FilterEffectDef, FrameVerdict, GamepadSnapshot, MOST_WATER_WAVES, MotionRate, PlatformAudioBackend, PlatformCanvas2DContext, PlatformRecording, PlatformRecordingShareOptions, PlatformType, PlayConfig, PowerDecision, PowerLevel, PowerPolicy, QualityLevel, QualityMode, QualityProfile, QualitySample, Res, ResDescriptor, ResMut, ResMutDescriptor, ResMutInstance, ReverbEffectDef, SIDE_MODULES, SPINE_VERSIONS, SideModuleDescriptor, SpineVersion, Time, VibrationIntensity, builtinBusVolume, clearProjectSideModules, createLocalAchievements, decidePower, defaultQualityMode, defaultQualityProfile, defineResource, judgeFrames, parseBusEffects, parseQualityConfig, physics3dModuleId, projectSideModuleIds, registerSideModule, resolveQualityProfile, sideModuleDescriptor, spineModuleId } from './shared/resource.js';
import { AiParamValue } from './shared/registry.js';
export { AiAction, AiActionInput, AiActionSpec, AiCondition, AiOutputDef, AiOutputs, AiParamDef, AiParams, AiRegistry, AiValueSpec, Blackboard, BlackboardGuard, CompareOp, evalGuard, evalGuards, formatActionArg, invokeAction, parseActionArg } from './shared/registry.js';
export { ReplayReport, Speculation, SpeculationInstance, SpeculationOutcome, replay } from './shared/speculation.js';
import { PhysicsWasmModule, Physics2DPluginConfig } from './shared/Physics2D.js';
export { CollisionEnterEvent, CollisionHitEvent, Physics2D, Physics2DEvents, Physics2DEventsData, PhysicsModuleFactory, SensorEvent, loadPhysicsModule } from './shared/Physics2D.js';
import { Physics3DWasmModule } from './shared/Physics3DQueries.js';
export { Physics3DEvents } from './shared/Physics3DQueries.js';
import { SpineWasmModule, SpineManager } from './shared/SpinePlugin.js';
export { Spine, SpineEvents, SpinePlugin } from './shared/SpinePlugin.js';
export { DragonBones, DragonBonesPlugin, dragonBonesPlugin } from './shared/DragonBonesPlugin.js';
export { BUILTIN_SHADER_TEMPLATES, BuiltinShaderTemplate, builtinShaderTemplate } from './shared/builtinShaders.js';
import { EngineApi } from './shared/engineApi.js';
export { ResourceStats, evictTextureDimensions, getResourceManager, getResourceStats, requireResourceManager, resolveDocumentRef, setRetainedBudget, setTextureBudget, shutdownResourceManager, trimTextureCache } from './shared/resourceManager.js';
export { AssetPlugin, Assets, AssetsData, assetPlugin } from './shared/AssetPlugin.js';
export { ImportedScenePlugin, NodeVisibility, ParticleModelUnits } from './imported-scene/index.js';
export { BiomeCondition, BiomeDef, BiomeRecipe, ChunkLayer, ChunkLayerStatus, ChunkSource, ChunkState, Group, PlacedObject, PlacedObjectData, Placement, PlacementChange, PlacementDiffs, PlacementDiffsData, PlacementLayer, ProceduralChunks, ProceduralChunksRes, Recipe, RecipeMember, Rejection, WorldGen, WorldGenData, WorldGenPlugin, WorldGenRes, WorldGenStatus, WorldGens, WorldPlan, WorldRules, WorldZone, WorldZoneData, ZoneDef, ZoneShape, ZoneShapeKind, Zones, chunksOf, registerWorldRules, streamingSourcesOf, worldGenPlugin, worldRules } from './shared/worldgenPlugin.js';
import { RuntimeAssetSource } from './shared/runtimeAssets.js';
import { AnimatorTransition, AnimatorControllerDef, AnimatorIKKind, AnimatorParamType, AnimatorCondition, AnimatorIK, AnimatorLayer, AnimatorParam } from './shared/Animator.js';
export { ANIMATOR_FORMAT_VERSION, Animator, AnimatorBlend1D, AnimatorBlendThreshold, AnimatorController, AnimatorControllerAPI, AnimatorData, AnimatorEvalResult, AnimatorEvent, AnimatorEventPayload, AnimatorEventSink, AnimatorLayerBlend, AnimatorMask, AnimatorParamValues, AnimatorPathEvalResult, AnimatorScope, AnimatorSpineMotion, AnimatorState, AnimatorSubMachine, GroundContext, GroundHit, GroundProbe, LayerReach, MaskReach, SPINE_MOTION, STATE_PATH_SEP, SpineAnimationDriver, addPoseOver, animatorLayer, animatorLayerCount, animatorScopes, clearAnimatorControllerStore, enterStatePath, evaluateAnimatorPath, evaluateAnimatorTransitions, getRegisteredAnimatorController, layerState, leafStateOf, motionOf, overlayPose, registerAnimatorController, resolveParams, selectBlendClip, setLayerState, solveAnimatorIK } from './shared/Animator.js';
export { FingerPoseDef, GripFinger, GripHand, GripHandStatus, GripHolder, GripHolderData, GripJoint, GripMirror, GripPlacement, GripPose, GripPoseData, GripPoseDef, GripProfile, GripProfileData, GripSurface, GripSurfaceData, GripSurfaceShape, GripThumb, captureFingerPose, fingerPose, gripHandJoints, gripHolderStatus, gripPose, gripPoseByJoint, gripPoseFromJson, gripPoseNames, gripPoseStatus, gripSurfaceLines, registerFingerPose, registerGripPose, releaseGripHolds, slerpQuat } from './shared/gripHold.js';
import { AnimatorMotion, MotionDriver, AnimatorClipMotion } from './shared/motion.js';
export { AVATAR_FORMAT_VERSION, AnimatorAvatar, AnimatorBlend1DMotion, AnimatorBlend2DMotion, AnimatorBlendPoint, AnimatorBlendStop, JointResolver, MotionContext, MotionEvent, MotionRegistry, MotionSpan, RootMotionDelta, avatarResolver, blend1DMotionDriver, blend1DPair, blend2DMotionDriver, blend2DWeights, dominantBlendPoint, emptyAvatar, isBlend1D, isBlend2D, parseAvatar, selectBlendStop, travelRatio } from './shared/motion.js';
import { GraphEdge } from './shared/AiContext.js';
export { AiContext, aiRegistry, noInput, registerAction, registerCondition, registerValue } from './shared/AiContext.js';
export { ActivationTrack, ActiveShot, AnimFramesTrack, AudioTrack, CameraClip, CameraTrack, Curve, CustomEvent, CustomEventTrack, InterpType, Keyframe, MAX_SEQUENCE_DEPTH, Particle, ParticleAPI, ParticleCollisionBudget, ParticleCollisionEvent, ParticleCollisionEventPayload, ParticleCollisionStats, PlayheadRun, PropertyChannel, PropertyTrack, RootPlacement, SampleDeps, SampleOptions, SampleWorld, SequenceClip, SequenceLayer, SequenceLookup, SequenceTrack, ShotState, SpineTrack, SpriteAnimTrack, TIMELINE_FORMAT_VERSION, TIMELINE_MOTION, Timeline, TimelineAPI, TimelineAsset, TimelinePlayer, TimelinePlayerData, TimelinePlugin, Track, TrackType, WrapMode, applyWrapMode, collectCustomEvents, collectSequenceLayers, createRootPlacement, createTimelineMotionDriver, evaluateChannel, isRootPlacementChannel, linearKey, parseAnimationClip, parseTimelineAsset, playheadRuns, resolveActiveShot, resolveChildEntity, resolveShot, runCrosses, sampleKeyframes, sampleRootPlacement, sampleTimeline, sampleTimelineInWorld, serializeTimelineAsset, serializeTimelineToJson, timelinePlugin, wouldNestCycle } from './shared/entry.js';
export { Eroded, ErosionParams, FieldSource, Heightfield, HeightmapFormat, LayerWeights, ModifiedSource, NOISE_PROVIDER, NoiseParams, NoiseSource, PAGE_SIDE, PAGE_TEXELS, PATCH_CELLS, Page, PageImage, PageTable, PlanetProvider, PlanetRegion, ProceduralParams, ProviderSource, QuadtreeParams, Splat, TERRAIN_TILE_BUDGET, Terrain, TerrainData, TerrainExtent, TerrainImage, TerrainModifier, TerrainNode, TerrainPlugin, TerrainProvider, TerrainRegion, TerrainRegionSamples, TerrainSamples, TerrainSource, TerrainStatus, TerrainTileEntry, TerrainTileStats, TerrainTilesDocument, TerrainUnavailable, Terrains, TerrainsRes, TiledSource, boxDistance, erodeHeightfield, erosionJob, flattenModifier, heightfieldFromPixels, levelRange, makePage, nodeKey, noiseProvider, noised, parentOf, parseTerrainTiles, planetProvider, proceduralHeightfield, registerPlanetProvider, registerTerrainProvider, sampleHeight, selectNodes, terrainNormal, terrainPlugin, terrainProvider } from './shared/planetQuery.js';
export { FACES, LayerImage, LayerSource, PackedLayers, Planet, PlanetData, PlanetPlugin, PlanetStatus, Planets, SphereNode, SphereTreeParams, TerrainLayerAssetLoader, TerrainLayerDef, buildPatchMesh, direction, faceOf, levelsFor, nodeAt, nodePoint, nodeRect, packLayers, paintWeights, parseTerrainLayer, planetPlugin, selectSphereNodes, sphereNodeKey } from './shared/patch.js';
export { Foliage, FoliageData, FoliageField, FoliagePlugin, FoliageRes, foliagePlugin } from './shared/foliagePlugin.js';
export { VOXEL_MATERIALS, VoxelEditEvent, VoxelEditOptions, VoxelEditResult, VoxelField, VoxelFieldData, VoxelFieldOptions, VoxelHit, VoxelMaterial, VoxelNoiseParams, VoxelOp, VoxelPlugin, VoxelPoint, VoxelSample, VoxelShape, VoxelSource, VoxelTerrain, VoxelTerrainData, VoxelTerrainStatus, VoxelTerrains, VoxelTerrainsRes, heightVoxelSource, noiseVoxelSource, voxelPlugin } from './shared/source.js';
export { Bone2D, Bone2DData, BoneConstraint2D, BoneConstraint2DData, BoneConstraintKind, IK2D, IK2DData } from './shared/rig2dPlugin.js';
export { PathFollower, PathFollowerData, PathMode, PathOrient, Spline, SplineCurve, SplineData, SplineNearest, SplinePlugin, SplinePoint, TerrainBand2D, TerrainBand2DData, TerrainBandBuild, buildTerrainBand, pathPlace, splinePlugin } from './shared/terrainBand2D.js';
export { Basin, BasinMap, BasinOptions, FieldSample, Point2, WATERFALL_SHADER_TEMPLATE, WAVE_SET, WaterBody, WaterBodyData, WaterField, WaterForm, WaterPlugin, WaterSample, WaterZone, WaterZoneData, Waterfall, WaterfallAnchor, WaterfallAnchorData, WaterfallData, WaterfallLanding, WaterfallLip, Waters, WatersRes, WaveParams, buildOceanMesh, buildWaterfall, currentShare, drainPath, findBasins, oceanReach, oceanSnap, polygonSdf, shoreDamp, waterPlugin, waterfallAnchorPoint, waterfallFlight, waterfallHeading, waveFade, waveHeight, waveSlope } from './shared/basins.js';
export { BladeParams, CardRect, Ground, Plant, ScatterParams, buildBillboardMesh, buildGrassMesh, buildInstancedMesh, rng, scatterCell } from './shared/plantGrowth.js';
export { ATTACK_KEY, COMBAT_ATTACK_END, COMBAT_ATTACK_START, COMBAT_HIT, DODGE_KEY, TPC_ATTACK, TPC_DODGE, TPC_GROUNDED, TPC_JUMP, TPC_SPEED } from './shared/vocabulary.js';
export { Rng, RngSeed, createRng, hashSeed } from './shared/random.js';
import { MiniGameGlobal } from './shared/api.js';
export { NetTransport, ReliableOrderedTransport } from './shared/NetChannel.js';

declare const DEFAULT_DESIGN_WIDTH: number;
declare const DEFAULT_DESIGN_HEIGHT: number;
declare const DEFAULT_PIXELS_PER_UNIT: number;
declare const DEFAULT_TEXT_CANVAS_SIZE = 512;
declare const DEFAULT_SPRITE_SIZE: {
    x: number;
    y: number;
};
declare const DEFAULT_FONT_FAMILY = "Arial";
declare const DEFAULT_FONT_SIZE = 24;
declare const DEFAULT_LINE_HEIGHT = 1.2;
declare const DEFAULT_MAX_DELTA_TIME = 0.5;
declare const DEFAULT_FALLBACK_DT: number;
declare const DEFAULT_GRAVITY: {
    x: number;
    y: number;
};
declare const DEFAULT_FIXED_TIMESTEP: number;
declare const DEFAULT_SPINE_SKIN = "default";
declare const RuntimeConfig: {
    sceneTransitionDuration: number;
    sceneTransitionColor: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    /** The family a Text with no `fontFamily` of its own rasterizes with. */
    defaultFontFamily: string;
    maxDeltaTime: number;
    maxFixedSteps: number;
    textCanvasSize: number;
    assetLoadTimeout: number;
    assetFailureCooldown: number;
    /** Whether several fingers are handled at once, until a game says otherwise with `Input.setMultiTouch`. */
    multiTouch: boolean;
    /**
     * Resident GPU-texture byte budget (see setTextureBudget). Released-but-
     * budgeted textures stay resident as an evictable LRU cache, so re-entering
     * a scene (or streaming an area back in) revives them instead of
     * re-fetching + re-decoding. 0 turns the cache off (free at refcount 0).
     */
    textureCacheBudget: number;
    /**
     * Decoded audio-buffer byte budget — the audio mirror of
     * textureCacheBudget. Released buffers stay as an evictable warm cache
     * (instantly playable, revived without re-fetch + re-decode) and the
     * oldest are dropped past this budget. Read live by AudioAPI, so changes
     * apply without re-init. 0 turns the warm cache off.
     */
    audioCacheBudget: number;
    /**
     * How many bytes of CPU copies the graphics device may keep to survive a GPU
     * loss before it warns (see setRetainedBudget). The engine keeps about 28 KiB
     * of its own; this is one 2048×2048 image. 0 never warns.
     */
    retainedBudget: number;
};
interface RuntimeBuildConfig {
    sceneTransitionDuration?: number;
    sceneTransitionColor?: string;
    defaultFontFamily?: string;
    maxDeltaTime?: number;
    maxFixedSteps?: number;
    textCanvasSize?: number;
    assetLoadTimeout?: number;
    assetFailureCooldown?: number;
    textureCacheBudget?: number;
    audioCacheBudget?: number;
    retainedBudget?: number;
    /** Handle several fingers at once (the default), or one at a time; `Input.setMultiTouch` changes it while the game runs. */
    multiTouch?: boolean;
}
/**
 * What every {@link RuntimeBuildConfig} field is when a project says nothing, in the units the config is written in (seconds, milliseconds,
 * bytes, `#rrggbb`). A project block carries only what differs from these, so an untouched project ships the bytes it always did.
 */
declare const RUNTIME_BUILD_DEFAULTS: Readonly<Required<RuntimeBuildConfig>>;
/**
 * The runtime tuning a project declared, read from untrusted JSON: a field of the wrong type is dropped, a number is held to its range, and a value
 * equal to its default is dropped too (absence is how a default is written everywhere else in a project). Nothing here invents a value.
 * @experimental
 */
declare function parseRuntimeBuildConfig(value: unknown): RuntimeBuildConfig;
declare function applyBuildRuntimeConfig(app: {
    setMaxDeltaTime(v: number): void;
    setMaxFixedSteps(v: number): void;
}, config: RuntimeBuildConfig): void;

/**
 * @file    ptrLayouts.generated.ts
 * @brief   Auto-generated component pointer layouts
 * @details Generated by EHT - DO NOT EDIT
 */
type PtrFieldType = 'f32' | 'i32' | 'u32' | 'bool' | 'u8' | 'vec2' | 'vec3' | 'vec4' | 'quat' | 'color' | 'struct';
/** A registered POD struct field (Dimension, Padding): its members, at
 *  offsets relative to the field. */
interface PtrStructMember {
    readonly name: string;
    readonly type: PtrFieldType;
    readonly offset: number;
}
interface PtrFieldDesc {
    readonly name: string;
    readonly type: PtrFieldType;
    readonly offset: number;
    readonly members?: readonly PtrStructMember[];
}
interface PtrLayout {
    readonly ptrFn: string;
    readonly fields: readonly PtrFieldDesc[];
}
declare const PTR_LAYOUTS: Record<string, PtrLayout>;

/**
 * @file    discoverAssets.ts
 * @brief   Unified asset discovery from scene/prefab data.
 *
 * Each component may reference assets in three ways: a custom
 * `discoverAssets` callback, declared `assetFields`, or paired
 * `skeletalFields`. This module walks a SceneData and buckets every
 * such ref by asset type. A `discoverAssets` callback is authoritative:
 * when present, `assetFields` are not walked for discovery (they still
 * drive the editor's asset pickers and ref rewrites) — the callback may
 * deliberately exclude values, e.g. FSM/BT agents skip plain
 * code-registered names that only look like asset refs.
 *
 * Refs in serialized data may be either a concrete path
 * (`"assets/player.png"`, legacy) or a UUID reference
 * (`"@uuid:xxxxxxxx-..."`, produced by the meta-driven pipeline).
 * An optional `refResolver` callback translates a ref to its
 * current path before bucketing. Without a resolver the ref is
 * passed through unchanged — works for legacy scenes that still
 * store paths directly.
 */

interface SpineAssetRef {
    skeleton: string;
    atlas: string;
}
/** A skeleton/atlas pair, whichever runtime poses it. */
type SkeletalAssetRef = SpineAssetRef;
interface SceneAssetRefs {
    byType: Map<string, Set<string>>;
    /**
     * The same buckets keyed by the RAW serialized ref (pre-resolution).
     * Loaders whose registry is keyed by what the COMPONENT carries (anim
     * clips: `SpriteAnimator.clip` / Animator states hold the serialized ref)
     * must be driven by the raw ref, so load-time aliasing can bind the raw
     * ref to the resolved registration — a realm whose resolver returns
     * absolute URLs would otherwise register under keys no component uses.
     */
    rawByType: Map<string, Set<string>>;
    /**
     * Resolved path → the RAW ref it came from (first spelling wins; several refs
     * can name one asset). Lets a caller that must bucket by resolved path — the
     * handle maps are keyed that way — still load through the authored ref, which
     * is the spelling per-asset lookups (texture import settings) are keyed by.
     */
    rawFor: Map<string, string>;
    /**
     * Skeleton/atlas pairs posed by SPINE. Split from {@link dragonBones} because
     * the two are loaded by different runtimes: a pair handed to the wrong one is
     * parsed by a parser that cannot read it, and fails as "unsupported version"
     * rather than as the routing mistake it is.
     */
    spines: SkeletalAssetRef[];
    /** Skeleton/atlas pairs posed by DragonBones. */
    dragonBones: SkeletalAssetRef[];
    /**
     * Refs seen during discovery that could not be resolved to a path
     * (e.g. unknown UUID). Callers surface this to the user so missing
     * assets don't silently turn into texture handle 0.
     */
    unresolved: string[];
    /** Resolved paths of the textures a MeshRenderer draws directly (its texture and normal map): what texture streaming may start small. */
    meshTextures: Set<string>;
    /** Resolved paths of the materials a MeshRenderer draws with: their textures may start small too. */
    meshMaterials: Set<string>;
}
/** Turns a raw serialized ref into a concrete path (or null if unknown). */
type RefResolver = (ref: string) => string | null;
declare function discoverSceneAssets(sceneData: SceneData, refResolver?: RefResolver): SceneAssetRefs;

declare function flattenPrefab(prefab: PrefabData, overrides: PrefabOverride[], ctx: FlattenContext): FlattenResult;

/**
 * The fields {@link applyOverrides} reads/writes. Both `ProcessedEntity` (a
 * flattened instance entity) and `PrefabEntityData` (a source-file entity)
 * satisfy it structurally, so the same override logic bakes overrides into a
 * live instance *or* into the prefab source.
 */
interface OverrideTarget {
    prefabEntityId: PrefabEntityId;
    name: string;
    visible: boolean;
    components: ComponentData[];
    metadata?: Record<string, unknown>;
}
/**
 * Group overrides by their target entity once so flatten can apply each
 * entity's overrides in O(K) instead of O(N×M) per scene tree.
 */
declare function bucketOverridesByEntity(overrides: readonly PrefabOverride[]): Map<PrefabEntityId, PrefabOverride[]>;
declare function applyOverrides(entity: OverrideTarget, overrides: readonly PrefabOverride[] | undefined): void;
/**
 * Bake a set of overrides into a prefab's source, returning a NEW PrefabData with
 * the changes applied as the base (entity identities preserved). This is the core
 * of editor "Apply to Prefab": an instance's overrides (from {@link diffAgainstSource})
 * become the prefab's new base, so every instance re-derives from them.
 *
 * Scope matches {@link diffAgainstSource}: property / name / visibility /
 * component add·replace·remove / metadata overrides on existing prefab entities.
 * Structural changes (entities the instance added or removed) are not folded in —
 * the caller surfaces those separately. Pure: the input `source` is not mutated.
 */
declare function applyOverridesToSource(source: PrefabData, overrides: readonly PrefabOverride[]): PrefabData;

/**
 * Remap entity-typed component fields from prefab-local ids to runtime ids.
 *
 * The mapping is keyed by `PrefabEntityId` (string) → runtime entity (number),
 * matching what flatten built. A component field whose value is a string —
 * the authored prefab-local reference — gets resolved through the mapping;
 * a numeric value is treated as already a runtime id (or zero/INVALID) and
 * left alone, so partially-instantiated/mutated components round-trip.
 */
declare function remapComponentEntityRefs(components: ComponentData[], idMapping: Map<PrefabEntityId, number>): void;

declare function cloneComponents(components: ComponentData[]): ComponentData[];
declare function cloneComponentData(data: Record<string, unknown>): Record<string, unknown>;
declare function cloneMetadata(metadata: Record<string, unknown>): Record<string, unknown>;

declare function collectNestedPrefabPaths(prefab: PrefabData, loadPrefab: (path: string) => PrefabData | null, visited?: Set<string>): string[];
declare function preloadNestedPrefabs(prefab: PrefabData, loadPrefab: (path: string) => Promise<PrefabData>, cache: Map<string, PrefabData>, visited?: Set<string>, depth?: number): Promise<void>;

/**
 * Result of a migration pass over a prefab JSON blob. `migrated` is true
 * when at least one field was upgraded; callers can choose to log/warn so
 * users know to re-save in the new format.
 */
interface MigrationResult {
    data: PrefabData;
    migrated: boolean;
    fromVersion: string;
    toVersion: string;
}
declare const PREFAB_FORMAT_VERSION = "2";
/**
 * Upgrade a parsed `.esprefab` JSON value to the current format.
 *
 * The historical format used numeric entity ids; current format uses
 * opaque strings (UUIDs for editor-authored prefabs). Numeric ids are
 * stringified with `String(n)` so cross-references — `parent`, `children`,
 * `rootEntityId`, `PrefabOverride.prefabEntityId`, `nestedPrefab.overrides`
 * — remain consistent.
 *
 * The function is total: it accepts already-migrated data and returns it
 * with `migrated: false`. Throws on shapes that can't be reconciled.
 */
declare function migratePrefabData(raw: unknown): MigrationResult;

interface DiffOptions {
    /**
     * Metadata keys whose presence/value should not produce diffs. Editor
     * selection markers, per-panel UI state, and prefab-tracking metadata
     * that belongs on the *instance root* rather than the prefab itself
     * typically live here (e.g. `prefab:source`, `prefab:overrides`).
     */
    ignoreMetadataKeys?: readonly string[];
    /**
     * Entity names whose children should be excluded from the diff entirely
     * (useful for editor-only scaffolding entities).
     */
    ignoreEntityNames?: readonly string[];
    /**
     * Optional numeric tolerance for float equality checks. Defaults to 0
     * (exact equality). Raise to tame small FP drift from Transform math.
     */
    floatEpsilon?: number;
}
/**
 * Compute the minimal `PrefabOverride[]` that, applied to `source`, produces
 * the `instance` state. The editor calls this on every change to an instance
 * to keep `prefab:overrides` accurate.
 *
 * Contract:
 *   applyOverrides(flattenPrefab(source, [], ctx), diffAgainstSource(source, instance))
 *   reproduces `instance` modulo runtime id remapping.
 *
 * Current scope:
 *   - Handles property / component_added / component_replaced / component_removed
 *     / name / visibility / metadata_set / metadata_removed
 *   - Handles instance entities that are NEW relative to source (reports them
 *     via `untracked` — caller decides whether to surface as variant additions
 *     or error)
 *   - Does NOT yet emit "entity_removed" overrides (entity deletion from an
 *     instance has no override type today); missing entities are reported via
 *     `orphanedSourceIds`.
 */
declare function diffAgainstSource(source: PrefabData, instance: readonly ProcessedEntity[], options?: DiffOptions): {
    overrides: PrefabOverride[];
    untracked: ProcessedEntity[];
    orphanedSourceIds: PrefabEntityId[];
};

/** An id as an authored document spells it. Scenes count; prefabs name. */
type DocumentEntityId = string | number;
type DocumentDiagnosticSeverity = 'error' | 'warning';
/** One structured problem found in an authored document. */
interface DocumentDiagnostic {
    /** Stable machine code (kebab-case), e.g. `duplicate-id`, `parent-cycle`. */
    code: string;
    severity: DocumentDiagnosticSeverity;
    /** One-line human-readable explanation. */
    message: string;
    /** The entity the problem is on, when applicable. */
    entityId?: DocumentEntityId;
    /** The component type / `Comp.field` / metadata key involved, when applicable. */
    field?: string;
}
/** One entity of a document, in the terms every format shares. */
interface DocumentNode {
    id: DocumentEntityId;
    parent: DocumentEntityId | null;
    children: readonly DocumentEntityId[];
    components: readonly {
        type: string;
        data: Record<string, unknown>;
    }[];
}

interface StaleOverride {
    override: PrefabOverride;
    reason: string;
    /** Where in the prefab the override lives. */
    site: 'variant' | 'nested' | 'instance';
    /** For nested sites, the nested prefab's entity id whose overrides list it came from. */
    nestedAt?: PrefabEntityId;
}
interface ValidateResult {
    stale: StaleOverride[];
    /**
     * Entity ids mentioned in the prefab's own `children` lists that have
     * no corresponding entity entry. Surfaces corruption from third-party
     * editing tools; flatten also fails hard on this, so this is a softer
     * diagnostic the editor can surface before flatten.
     */
    orphanedChildren: PrefabEntityId[];
    /**
     * Entity ids that appear on more than one entry. Identity must be unique
     * within a prefab or overrides/diff address the wrong target; the editor
     * must never mint a colliding id (it uses UUIDs).
     */
    duplicateIds: PrefabEntityId[];
    /**
     * Entity ids containing the reserved address separator (`/`). Flatten
     * composes `slot/localId` addresses with it, so an authored id must not
     * contain it — flatten rejects these hard; this is the soft pre-check.
     */
    invalidIds: PrefabEntityId[];
}
/**
 * Find overrides pointing at entities or components that no longer exist.
 *
 * The check is structural (no flatten). For nested-prefab site validation
 * pass a loader via `options.loadPrefab`; without it, nested overrides are
 * skipped (treated as "cannot verify").
 *
 * Used by the editor on scene open + on Apply-to-Source to warn the user
 * before stale overrides silently disappear.
 */
declare function validateOverrides(prefab: PrefabData, options?: {
    /** Overrides applied at instance site, e.g. `prefab:overrides` metadata. */
    instanceOverrides?: readonly PrefabOverride[];
    loadPrefab?: (path: string) => PrefabData | null;
}): ValidateResult;
/** A prefab's findings are document findings; the name is kept for its readers. */
type PrefabDiagnosticSeverity = DocumentDiagnosticSeverity;
type PrefabDiagnostic = DocumentDiagnostic;
interface ValidatePrefabOptions {
    /** Resolver for nested / variant dependency + nested-override checks. */
    loadPrefab?: (path: string) => PrefabData | null;
    /** Instance-site overrides (a scene instance's delta) to validate too. */
    instanceOverrides?: readonly PrefabOverride[];
}
/**
 * Validate a prefab asset end-to-end and return every problem found. Errors mean
 * the prefab is structurally broken (flatten would misbehave or throw); warnings
 * are suspicious but loadable (stale overrides, dangling refs). Pure + total.
 */
declare function validatePrefab(prefab: PrefabData, options?: ValidatePrefabOptions): PrefabDiagnostic[];

/**
 * @file    sceneInstance.ts
 * @brief   Prefab instance ⇄ scene-delta boundary (the canonical expand/collapse core)
 *
 * A prefab instance is persisted as a DELTA over its prefab asset and lives,
 * once loaded, as EXPANDED ordinary entities. This module is the lossless
 * boundary between the two, built on the engine's own prefab data layer
 * (`flattenPrefab` / `diffAgainstSource`):
 *
 *   expand:   prefab asset + delta  →  flat instance entities
 *   collapse: flat instance entities →  delta
 *
 * It is the SINGLE source for that transform — both the runtime scene loader
 * (`scene.ts` `loadSceneWithAssets`, for `play == ship`) and the editor's
 * model layer build on it, so the two never diverge.
 *
 * A `{prefab, overrides}` pair alone is NOT enough — `PrefabOverride` cannot
 * express structural edits — so the delta also carries `added` (entities added
 * under the instance) and `removed` (prefab children deleted in the instance),
 * sourced from `diffAgainstSource`'s `untracked` / `orphanedSourceIds`. Both
 * structural buckets reference entities by stable `prefabEntityId`, so the round
 * trip survives the id reallocation that `flattenPrefab` performs.
 *
 * Pure data (no World / wasm) — unit-testable as the data-loss safety net.
 */

/** Sync nested-prefab resolver passed through to `flattenPrefab`. */
type SyncPrefabResolver = (path: string) => PrefabData | null;
/** An entity added under a prefab instance (not part of the prefab asset). */
interface AddedEntity {
    /** Stable instance-local identity (its prefabEntityId — absent from the asset). */
    prefabEntityId: PrefabEntityId;
    name: string;
    components: ComponentData[];
    visible: boolean;
    /** Parent by stable id — a prefab entity OR another added entity; null = under the instance root. */
    parentId: PrefabEntityId | null;
}
/** The persisted form of a prefab instance: a minimal delta over the asset. */
interface PrefabInstanceDelta {
    /** `@uuid:` ref to the prefab asset. */
    prefab: string;
    /** Property / component / name / visibility / metadata edits. */
    overrides: PrefabOverride[];
    /** Entities added under the instance (not in the asset). */
    added: AddedEntity[];
    /** Prefab children deleted in this instance (by their asset prefabEntityId). */
    removed: PrefabEntityId[];
}
/** A prefab instance as it lives in the scene FILE: a delta + where it attaches. */
interface PrefabInstanceEntry extends PrefabInstanceDelta {
    /** The instance root's stable scene source id. */
    id: number;
    /** The instance root's scene parent (its attach point), or null = scene root. */
    parent: number | null;
}
/**
 * Expand a prefab asset + instance delta into flat instance entities, allocating
 * ids via `allocateId`. Reuses `flattenPrefab` (which applies the overrides),
 * drops `removed` prefab entities, and appends `added` entities re-linked by
 * their stable parent id. `loadPrefab` resolves nested prefab refs (callers that
 * know the prefab is flat may omit it).
 */
declare function expandInstance(prefab: PrefabData, delta: PrefabInstanceDelta, allocateId: () => number, loadPrefab?: SyncPrefabResolver, deferred?: DeferredRecord[]): {
    entities: ProcessedEntity[];
    rootId: number;
    unresolved: PrefabOverride[];
};
/** Rebuild every entity's `children` array from its `parent` link (consistency). */
declare function rebuildChildren(entities: ProcessedEntity[]): void;
/**
 * Collapse expanded instance entities back to a delta. `diffAgainstSource`
 * yields the override list + the structural buckets (`untracked` → added,
 * `orphanedSourceIds` → removed), with added parents recorded by stable id.
 */
declare function collapseInstance(prefab: PrefabData, prefabRef: string, expanded: readonly ProcessedEntity[], loadPrefab?: SyncPrefabResolver): PrefabInstanceDelta;
/**
 * Expand a scene instance entry into flat entities: flatten the asset + delta,
 * pin the instance root to the entry's stable `id` (re-allocating only the
 * internal entities), and attach the root under the entry's scene `parent`.
 */
declare function expandEntry(prefab: PrefabData, entry: PrefabInstanceEntry, allocateId: () => number, loadPrefab?: SyncPrefabResolver, deferred?: DeferredRecord[]): {
    entities: ProcessedEntity[];
    rootId: number;
    unresolved: PrefabOverride[];
};
/**
 * Collapse an expanded instance subtree (root `rootId`, attached under
 * `sceneParent`) back to a scene entry — the inverse of {@link expandEntry}.
 */
declare function collapseEntry(prefab: PrefabData, prefabRef: string, expanded: readonly ProcessedEntity[], rootId: number, sceneParent: number | null, loadPrefab?: SyncPrefabResolver): PrefabInstanceEntry;
/** The structural + property parts of a delta applied by {@link applyDeltaToSource}. */
interface SourceDelta {
    overrides: readonly PrefabOverride[];
    added: readonly AddedEntity[];
    removed: readonly PrefabEntityId[];
}
/**
 * Bake a complete instance delta into a prefab's source — the STRUCTURAL
 * "Apply to Prefab". `applyOverridesToSource` only folds property/component/
 * name/visibility/metadata edits; this also inserts `added` entities (linked
 * under their parent) and deletes `removed` subtree roots and their descendants
 * (never the prefab root), so an instance's structural changes truly enter the
 * asset. Pure: `source` is not mutated. Nested-scoped ids (composed `slot/…`
 * addresses) that don't exist on this source are skipped — structural apply
 * targets the top-level asset.
 */
declare function applyDeltaToSource(source: PrefabData, delta: SourceDelta): PrefabData;
/**
 * Build a prefab VARIANT that inherits `baseRef` and bakes an instance delta as
 * the variant's own authored state — the authoring inverse of instantiating a
 * variant, and the sibling of {@link applyDeltaToSource} (which bakes INTO the
 * base instead of layering a new variant on top). Property / component / name /
 * visibility overrides become the variant's `overrides`; entities the instance
 * ADDED become variant `entities` (appended onto the base by
 * `mergeVariantEntities`, which links them into their parent's children on
 * flatten). The variant's rootEntityId mirrors the base — variants EXTEND their
 * base, they never relocate the root.
 *
 * A variant cannot DELETE a base entity (merge only replaces / appends), so
 * `delta.removed` is not representable and is ignored here; a caller that must
 * surface dropped removals should inspect it first. Pure: neither `base` nor
 * `delta` is mutated.
 */
declare function buildVariant(base: PrefabData, baseRef: string, name: string, delta: {
    overrides: readonly PrefabOverride[];
    added: readonly AddedEntity[];
}): PrefabData;
/** A scene/model entity subtree, as fed to {@link extractPrefab} (id-keyed). */
interface ExtractEntity {
    id: number;
    name: string;
    parent: number | null;
    children: number[];
    components: ComponentData[];
    visible?: boolean;
}
/** An entity-ref field pointing OUTSIDE the extracted subtree. */
interface ExternalEntityRef {
    /** Source id of the entity holding the reference. */
    entityId: number;
    componentType: string;
    /** The entity-typed field name on that component. */
    field: string;
    /** The out-of-subtree runtime id it currently points at. */
    target: number;
}
/**
 * List the entity-ref fields in a subtree that point OUTSIDE it — the refs that
 * {@link extractPrefab} will clear. The editor calls this before "Create Prefab"
 * to warn the user (or let them cancel) rather than silently dropping links.
 */
declare function collectExternalEntityRefs(entities: readonly ExtractEntity[]): ExternalEntityRef[];
declare function extractPrefab(entities: readonly ExtractEntity[], rootId: number, name: string, makeId?: (sourceId: number) => PrefabEntityId): PrefabData;

interface InstantiatePrefabOptions {
    assets?: Assets;
    assetBaseUrl?: string;
    /** The parent must still accept the root after loading; failure rolls back the instance. */
    parent?: Entity;
    overrides?: PrefabOverride[];
    /**
     * Make the virtual instances nested in this prefab whole as well (see prefab/deferred.ts). By default they are made as roots
     * and left to be opened.
     */
    expandDeferred?: boolean;
}
/**
 * What instantiating a prefab answers: the root, and every entity the prefab
 * brought with it.
 *
 * @beta
 */
interface InstantiatePrefabResult {
    root: Entity;
    entities: Map<number, Entity>;
}
declare function instantiatePrefab(world: World, prefab: PrefabData, options?: InstantiatePrefabOptions): Promise<InstantiatePrefabResult>;

/**
 * Engine components that no longer exist. A file written before their retirement
 * still names them; keeping them would only make the loader warn and skip.
 */
declare const RETIRED_COMPONENT_TYPES: ReadonlySet<string>;
/**
 * Components an engine upgrade renamed, old name to new. A name is the key a file
 * stores a component under, so a rename is a migration: without one the loader
 * reads the old name as a component it has never heard of.
 */
declare const RENAMED_COMPONENT_TYPES: ReadonlyMap<string, string>;

interface EffectUniformDef {
    name: string;
    label: string;
    min: number;
    max: number;
    step: number;
    defaultValue: number;
    /**
     * The "effect does nothing" value a partial-weight volume blend fades toward.
     * 0 for additive/intensity params (default); 1 for MULTIPLICATIVE params
     * (contrast, saturation, zoom) — blending those from 0 crushes the image to
     * black / extreme distortion at a volume's soft edge.
     */
    neutralValue?: number;
    /** Set by the engine from another effect, not by a scene: an inspector does not list it. */
    internal?: boolean;
    /**
     * A world length (1) or a world rate per length (-1): its default is written at 100 units a metre and follows the
     * project's units per metre when a volume leaves it unset (ecs/worldUnits.ts). A value a volume states is never scaled.
     */
    worldUnits?: 1 | -1;
}
/**
 * A uniform as it reads in this project: a world-unit one's default and range scaled to the project's units per metre
 * (a length by the scale, a rate per length by its inverse), any other as declared. What the volume system fills an
 * unset uniform with, and what an inspector offers.
 */
declare function uniformInUnits(u: EffectUniformDef): EffectUniformDef;
/** A texture parameter (LUT, mask): the sampler uniform it binds to. */
interface EffectTextureDef {
    name: string;
    label: string;
    /** Set by the engine from another effect, not by a scene: an inspector does not list it. */
    internal?: boolean;
}
/** Pixels an effect brings itself, RGBA8. Clamped at the edges unless `wrap` says it tiles (a noise table read far past 0..1). */
interface BuiltinTexture {
    width: number;
    height: number;
    pixels: Uint8Array;
    wrap?: 'clamp' | 'repeat';
}
/** A colour parameter (fog colour): the vec4 uniform it feeds and its default. */
interface EffectColorDef {
    name: string;
    label: string;
    defaultValue: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
}
interface EffectSubPass {
    name: string;
    factory: () => ShaderHandle;
    /**
     * Fraction of the chain size this sub-pass draws at (default 1). The chain's
     * LAST pass always draws full size — it feeds the blit — so a fractional
     * effect ends on a pass that reads the small result and writes the big one.
     */
    scale?: number;
    /** Uniforms this pass always carries, whatever the volume says: constants of its design (the voxel atlas's size). */
    uniforms?: Record<string, number>;
}
/**
 * An effect that is a compute shader over the picture rather than a draw. The WGSL is handed, at group 0: `@binding(0)` the image
 * so far (`texture_2d<f32>`), `@binding(1)` the image it writes (`texture_storage_2d<rgba16float, write>`), `@binding(2)` a uniform
 * block of the effect's `uniforms` as f32s in the order they are listed, `@binding(3)` the size (`vec4f(w, h, 1/w, 1/h)`),
 * `@binding(4)` the scene's depth (`texture_depth_2d`) and `@binding(5)` a linear clamp sampler; it declares the ones it uses and
 * an entry point named `main`. Only a device with a compute stage (WebGPU) runs it: on WebGL2 the effect is left out.
 */
interface ComputeEffectSource {
    source: string;
    /** The workgroup size the shader declares; it is dispatched over the whole picture in groups of this. Default 8 x 8. */
    workgroupSize?: [number, number];
}
/** What an effect is for, which is how an editor groups a list of thirty: the camera, the colour, the light, the air, the edges, a look. */
type EffectCategory = 'lens' | 'color' | 'light' | 'atmosphere' | 'aa' | 'stylize';
interface EffectDef {
    type: string;
    label: string;
    /** Set for every built-in effect, by the table at the end of this file. */
    category?: EffectCategory;
    /**
     * Set for an effect that is a stage of the chain's last pass and not a pass of its own ("displayLut"): it has no shader, and the volume's
     * values are handed to the stack for the last pass to read, which runs once and after the output transform.
     */
    stage?: 'output';
    /** What compiles the effect's draw shader. Absent for a compute effect (see {@link compute}) and an output stage. */
    factory?: () => ShaderHandle;
    /** Set instead of `factory` for an effect that runs as a compute shader. */
    compute?: ComputeEffectSource;
    /** Set instead of `factory` for an effect the engine implements itself, in compute passes of its own ("voxelGI"). */
    native?: string;
    /**
     * Passes that stand in for a `native` or `compute` effect on a device that cannot run it (a fragment version of a compute
     * one). They take every one of the effect's uniforms, as a multi-pass effect's passes do.
     */
    fallback?: EffectSubPass[];
    uniforms: EffectUniformDef[];
    /** Texture params, carried on the volume as serialized refs (`textures`). */
    textures?: EffectTextureDef[];
    /**
     * Textures the effect brings itself, by sampler uniform: made once per App from the pixels a source group installed and bound unless
     * the volume names one. For data an effect is meaningless without (AgX's table), not for a choice an author makes.
     */
    builtinTextures?: Record<string, () => BuiltinTexture>;
    /** Colour params, carried on the volume as `colors`. */
    colors?: EffectColorDef[];
    multiPass?: EffectSubPass[];
}
declare function registerEffect(def: EffectDef): void;
declare function getEffectDef(type: string): EffectDef | undefined;
declare function getEffectTypes(): string[];
declare function getAllEffectDefs(): EffectDef[];

declare class PostProcessPlugin implements Plugin {
    name: string;
    readonly profileDomain = "render";
    /** Each App's own: the plugin is one object, and an editor holds several apps (the edit world, a game playing). */
    private readonly skies_;
    build(app: App): void;
    cleanup(app?: App): void;
}
declare const postProcessPlugin: PostProcessPlugin;

/**
 * @file    customSky.ts
 * @brief   A sky a project writes itself, drawn behind the scene and, when it asks, lighting it.
 *
 * @details The author writes one function, the sky's radiance along a direction, in GLSL and WGSL. Around it this builds a
 *          post-process effect that draws it where nothing else was drawn, as Sky Atmosphere does, and that can draw the
 *          same function as a small panorama for the engine to read back: that panorama is made into the scene's
 *          environment (its diffuse light and its reflections) exactly as Sky Atmosphere's is, at most once a second. So a
 *          stylised sky lights the scene with the light it shows, as Unreal's sky material does under a real-time Sky Light.
 *
 *          The function is `skyRadiance(dir, sun, sunColor, env)`: `dir` and `sun` unit world directions (the sun is the
 *          first directional light, or straight up without one), `sunColor` that light's colour times intensity, and `env`
 *          1 while the panorama is drawn — when a sun disc should be left out, since the directional light is the sun's
 *          direct light there. It returns linear radiance, before exposure. The effect's own params are uniforms like any
 *          effect's: in GLSL by name, in WGSL as `mc.<name>`; the time is `u_time.x` / `tc.u_time.x`.
 *
 *          A sky with clouds can shade the ground under them, as Sky Atmosphere's do: with `groundShadow` the author writes a
 *          second function, `skyShadow(world, sun)`, how much of the scene's light is left at a world position (1 is all of
 *          it), and every surface the pass finds is multiplied by it.
 */

interface SkyEffectSource {
    /** The effect's type, as a volume names it. */
    type: string;
    label: string;
    /** The sky's own float params. Brightness (`u_intensity`) and Light the Scene (`u_lightScene`) are added. */
    uniforms?: EffectUniformDef[];
    /** Colour params (vec4). */
    colors?: EffectColorDef[];
    /** Textures the sky brings itself (a noise table), by sampler name: GLSL `name`, WGSL `name` with `name_s`. */
    textures?: Record<string, () => BuiltinTexture>;
    /** GLSL declarations and `vec3 skyRadiance(vec3 dir, vec3 sun, vec3 sunColor, float env)`. */
    glsl: string;
    /** The same in WGSL: `fn skyRadiance(dir : vec3f, sun : vec3f, sunColor : vec3f, env : f32) -> vec3f`. */
    wgsl: string;
    /**
     * The sky shades the ground: the sources also hold `float skyShadow(vec3 world, vec3 sun)` and
     * `fn skyShadow(world : vec3f, sun : vec3f) -> f32`, what is left of a surface's light at a world position, 0 to 1.
     */
    groundShadow?: boolean;
}
/**
 * Registers a sky a project wrote: an effect of `type` a PostProcessVolume can carry, with Brightness and Light the
 * Scene beside the sky's own params. One per type; defining a type again replaces it.
 */
declare function defineSkyEffect(src: SkyEffectSource): void;

/**
 * @file  weather.ts
 * @brief What a weather IS — a handful of scales and levels — and how it reaches the picture.
 *
 * @details A weather is not a set of effect parameters: a project's fog density is in its own units and its sun is as
 *          bright as its author made it. A preset therefore speaks in MULTIPLIERS of what the scene already says (the sun
 *          at a quarter of its strength, the fog five times as thick) and in a few absolute levels where a number means
 *          the same everywhere (how hard it rains, how wet the ground is). The same preset then fits any scene.
 *
 *          The state is blended between two presets by a transition's progress, and applied in two places: to the lights
 *          (the component's own, in play mode only — see weatherSystem) and, after the volumes have blended, to the
 *          effects that result.
 */

interface WeatherState {
    /** × the directional lights' strength. */
    sun: number;
    /** × the ambient light's strength. */
    sky: number;
    /** × the directional light's colour. */
    sunTint: [number, number, number];
    /** How soft its shadows are, in suns: 1 leaves them as authored, 8 makes the source eight times wider across the
     *  sky — an overcast sky's shadows are barely there, and the ones that are fade into the ground. */
    shadowSoftness: number;
    /** × how dark the light's shadows are. */
    shadowStrength: number;
    /** × Height Fog's density. */
    fogDensity: number;
    /** The colour fog moves toward, and how far (0 = its own colour). */
    fogTint: [number, number, number];
    fogTintAmount: number;
    /** × Height Fog's sun glow and the shafts it carries. */
    fogGlow: number;
    /** × Height Fog's sky haze, capped at 1. */
    skyFog: number;
    /** × Colour Grade's saturation and contrast. */
    saturation: number;
    contrast: number;
    /** Stops added to Auto Exposure's compensation. */
    exposure: number;
    /** The rain effect's strength, and the wetness and puddles it leaves. Absolute. */
    rain: number;
    wetness: number;
    puddles: number;
    /** How much snow lies, 0..1. Absolute. */
    snow: number;
    /** × Screen Space Reflections' strength. */
    ssr: number;
    /** × what baked reflection probes show, and × their colour (1 keeps it, 0 is grey): a probe was baked under
     *  whatever sky the scene had then. */
    reflection: number;
    reflectionSaturation: number;
    /** How overcast the sky is, 0 clear .. 1 grey: what Sky Atmosphere draws no sun, moon or stars through. */
    overcast: number;
    /** How loud the rain on the soundtrack is, 0..2. */
    sound: number;
    /** × the wind: how far plants sway (a Foliage material's u_windStrength). */
    wind: number;
    /** × the waves' height on every body of water, in what is drawn and in what the surface answers. */
    waves: number;
}
type WeatherPreset = Partial<WeatherState>;
/** The presets every project has. Their ids are the dropdown's values, so they only ever grow. */
declare const WEATHER_CLEAR = 0;
declare const WEATHER_MIST = 1;
declare const WEATHER_OVERCAST = 2;
declare const WEATHER_RAIN = 3;
declare const WEATHER_STORM = 4;
declare const WEATHER_SNOW = 5;
/** What `target` says when there is nothing to move toward. */
declare const WEATHER_NONE = -1;
/**
 * Adds a weather of the project's own, and returns the id it answers to.
 *
 * @details A preset names only what it changes; the rest is neutral. Registering a name again replaces it, so a
 *          project can retune a built-in one. A custom id is for code (`weatherTo`, a component's `preset` value) — the
 *          Inspector's dropdown lists the built-ins.
 *
 * @beta
 */
declare function registerWeatherPreset(name: string, preset: WeatherPreset): number;
/** The id a preset answers to, or undefined. @beta */
declare function weatherPresetId(name: string): number | undefined;
/** Every preset, built-in first. @beta */
declare function weatherPresetNames(): string[];
/**
 * The weather `progress` of the way from one preset to another, eased so a transition starts and ends gently.
 *
 * @beta
 */
declare function blendWeather(from: number, to: number, progress: number): WeatherState;
declare const WeatherDrive: {
    readonly Lights: 1;
    readonly Fog: 2;
    readonly Rain: 4;
    readonly Grade: 8;
    readonly Exposure: 16;
    readonly Reflections: 32;
    readonly Sound: 64;
    /** The plants' sway and the waves' height. */
    readonly Wind: 128;
    readonly All: 255;
};
/** @beta */
declare function currentWeather(): WeatherState | null;

/** Where the clouds are in their drift. Plain numbers: what a save holds to bring the same sky back. @experimental */
interface SkyClockState {
    /** How far the main layer has drifted, in kilometres. */
    driftX: number;
    driftZ: number;
    /** How far the upper layer has drifted, in kilometres. */
    upperDriftX: number;
    upperDriftZ: number;
    /** How far the clouds' shapes have changed, in the noise's own units. */
    evolve: number;
}
/** Where the clouds are now. @experimental */
declare function skyClockState(): SkyClockState;
/** Puts the clouds where a save had them, or back to the start. @experimental */
declare function setSkyClockState(next: Partial<SkyClockState> | null): void;

/**
 * @file  timeOfDay.ts
 * @brief Where the sun and the moon are at an hour of the day, and what that does to the light, the fog and the sky.
 *
 * @details The sun is placed by the astronomy that fits in four lines — an hour angle, a latitude and a declination — so a
 *          day has the right shape (a long arc in summer, a low one in winter, sunrise toward the east) with three numbers a
 *          person can understand. Everything else is the same idea as the weather: MULTIPLIERS of what the scene already
 *          says (the sun at its strength times a curve, the fog's colour times how dark it is) so the same hour fits any
 *          scene. The moon stands opposite the sun and is the directional light's aim while the sun is down.
 *
 *          The state is applied in two places, as the weather's is: to the lights (in play mode, from the weather
 *          system, which owns the lights so the two scale one number and not each other's last answer) and to the
 *          effects the volumes resolve.
 */

interface TimeOfDayState {
    /** The hour this is the state of, 0..24. */
    hour: number;
    /** Unit vectors toward the sun and the moon, in world space (Y up). */
    sunDir: [number, number, number];
    moonDir: [number, number, number];
    /** The sun's height above the horizon in degrees, negative below it. */
    sunElevation: number;
    /** The sun's azimuth as the effects take it: degrees from +Z toward +X. */
    sunAzimuth: number;
    /** 0 at night, 1 by day, with the dusk between. */
    daylight: number;
    /** The unit vector the key (directional) light shines FROM: the sun by day, the moon by night. */
    lightDir: [number, number, number];
    /** × the key light's strength, and what it is tinted: warm at the horizon, white overhead, blue by moonlight. */
    light: number;
    lightTint: [number, number, number];
    /** × the ambient light's strength, and its tint. */
    sky: number;
    skyTint: [number, number, number];
    /** × what baked reflection probes show, and × their colour. */
    reflection: number;
    reflectionSaturation: number;
    /** × Height Fog's colour (how lit the haze is), and the dusk colour it moves toward and how far. */
    fogBrightness: number;
    fogDusk: number;
    /** Stops added to the exposure compensation: a night is kept readable, not as bright as a day. */
    exposure: number;
}
/** What a time of day drives. A bit each, so a project can take the sky from the clock and keep its own light. */
declare const TimeDrive: {
    readonly Lights: 1;
    readonly Sky: 2;
    readonly Fog: 4;
    readonly Exposure: 8;
    readonly Reflections: 16;
    readonly All: 31;
};
/**
 * The sun's place at an hour: its elevation and its azimuth from +Z toward +X, in radians.
 *
 * @param hour        Solar time, 0..24; 12 is noon.
 * @param latitude    Degrees; where on the planet. Positive is north.
 * @param declination Degrees, -23.5..23.5: the season. Positive is summer in the north.
 * @param north       Degrees the world is turned from compass north (+Z) toward +X.
 */
declare function sunPosition(hour: number, latitude: number, declination: number, north: number): {
    elevation: number;
    azimuth: number;
};
/** The time of day at an hour. @beta */
declare function timeOfDayAt(hour: number, latitude?: number, declination?: number, north?: number): TimeOfDayState;
/** The time of day the frame is under, or null. @beta */
declare function currentTimeOfDay(): TimeOfDayState | null;

declare const Storage: {
    /** Await the host's pending writes; without this capability, no cloud acknowledgment is implied. */
    flush(): Promise<void>;
    getString(key: string, defaultValue?: string): string | undefined;
    setString(key: string, value: string): void;
    getNumber(key: string, defaultValue?: number): number | undefined;
    setNumber(key: string, value: number): void;
    getBoolean(key: string, defaultValue?: boolean): boolean | undefined;
    setBoolean(key: string, value: boolean): void;
    getJSON<T>(key: string, defaultValue?: T): T | undefined;
    setJSON<T>(key: string, value: T): void;
    remove(key: string): void;
    has(key: string): boolean;
    clear(): void;
};

/** Optional host score submission, independent of friends/open-data boards. */
declare const Scores: {
    readonly available: boolean;
    /** A resolved submission means sent; host validation may still reject the score. */
    submit(score: number): Promise<void>;
};

/**
 * @file    inputRouter.ts
 * @brief   Chain-of-responsibility input routing (editor → UI → game)
 *
 * The platform layer delivers raw events (key, pointer, wheel, touch) into
 * the SDK. Before those events land in the `InputState` that gameplay code
 * polls, they pass through the router's tier-1 (editor) and tier-2 (UI)
 * handlers. Either tier can return `true` from a callback to consume the
 * event; consumed events do not propagate to later tiers. Consumed releases
 * silently clear previously held gameplay state without adding release edges.
 *
 * Tier-3 (game) is implicit — it is the InputState resource itself. Code
 * that calls `state.isKeyDown(...)` / `state.isMouseButtonDown(...)` sees
 * only events that no upstream handler claimed.
 *
 * Chain-of-responsibility (rather than a boolean editor-is-active flag)
 * lets a tool consume only the events it actually cares about: a marquee
 * drag claims mouse-move while pressed but lets wheel scroll through to
 * the viewport camera; a modal dialog consumes Escape but ignores the
 * arrow keys.
 */
interface Modifiers {
    readonly shift: boolean;
    readonly ctrl: boolean;
    readonly alt: boolean;
    readonly meta: boolean;
}
/**
 * An input handler. All methods are optional; return `true` to consume an
 * event (stops propagation to later tiers and to InputState), `false` /
 * `void` to let it fall through.
 */
interface InputHandler {
    onKeyDown?(code: string, mods: Modifiers): boolean | void;
    onKeyUp?(code: string, mods: Modifiers): boolean | void;
    onPointerMove?(x: number, y: number, mods: Modifiers): boolean | void;
    onPointerDown?(button: number, x: number, y: number, mods: Modifiers): boolean | void;
    onPointerUp?(button: number, mods: Modifiers): boolean | void;
    onWheel?(deltaX: number, deltaY: number, mods: Modifiers): boolean | void;
    onTouchStart?(id: number, x: number, y: number): boolean | void;
    onTouchMove?(id: number, x: number, y: number): boolean | void;
    onTouchEnd?(id: number): boolean | void;
    onTouchCancel?(id: number): boolean | void;
}
declare class InputRouter {
    private editorHandler_;
    private uiHandler_;
    private mods_;
    /** Registers the editor-tier handler and returns an unregister thunk. */
    setEditorHandler(handler: InputHandler | null): () => void;
    /** Registers the UI-tier handler and returns an unregister thunk. */
    setUIHandler(handler: InputHandler | null): () => void;
    get currentMods(): Modifiers;
    /** Clear cancelled key chords without delivering input to handlers. */
    resetModifiers(): void;
    dispatchKeyDown(code: string): boolean;
    dispatchKeyUp(code: string): boolean;
    dispatchPointerMove(x: number, y: number): boolean;
    dispatchPointerDown(button: number, x: number, y: number): boolean;
    dispatchPointerUp(button: number): boolean;
    dispatchWheel(deltaX: number, deltaY: number): boolean;
    dispatchTouchStart(id: number, x: number, y: number): boolean;
    dispatchTouchMove(id: number, x: number, y: number): boolean;
    dispatchTouchEnd(id: number): boolean;
    dispatchTouchCancel(id: number): boolean;
    private updateModsFromKey;
}
declare const inputRouter: InputRouter;

type SwipeDirection = 'left' | 'right' | 'up' | 'down';
declare class GestureDetector {
    private input_;
    private tracks_;
    private prevPinchDist_;
    onTap: ((x: number, y: number) => void) | null;
    onSwipe: ((direction: SwipeDirection, speed: number) => void) | null;
    onPinch: ((scale: number, centerX: number, centerY: number) => void) | null;
    onLongPress: ((x: number, y: number) => void) | null;
    constructor(input: InputState);
    update(dt: number): void;
    private processStarts_;
    private lastPositions_;
    private processActive_;
    private processEnds_;
    private processPinch_;
    reset(): void;
}

/**
 * One physical source for an action. Plain serializable data on purpose: this is
 * also the rebind and persistence format, so what a player remaps is the same
 * shape a `.inputmap` asset ships.
 *
 * @public
 */
type Binding = {
    kind: 'key';
    code: string;
} | {
    kind: 'mouse';
    button: number;
} | {
    kind: 'gpButton';
    button: number;
    pad?: number;
} | {
    kind: 'gpAxis';
    axis: number;
    pad?: number;
    scale?: number;
} | {
    kind: 'keys1d';
    neg: string;
    pos: string;
} | {
    kind: 'keys2d';
    up: string;
    down: string;
    left: string;
    right: string;
} | {
    kind: 'stick';
    stick: 'left' | 'right';
    pad?: number;
} | {
    kind: 'virtual';
    id: string;
};
/**
 * How an action's bindings combine: a digital `button`, a signed 1D `axis`, or a
 * 2D `axis2d`. It decides which query answers — `pressed`/`down` for a button,
 * `value` for an axis, `axis2d` for the last.
 *
 * @public
 */
type ActionType = 'button' | 'axis' | 'axis2d';
/**
 * A named action: what kind of value it produces and every source that feeds it.
 * Bindings are alternatives, not a chord — whichever is strongest this frame wins.
 *
 * @public
 */
interface ActionDef {
    type: ActionType;
    bindings: Binding[];
}
/**
 * The serialized form of a whole map — the content of an `.inputmap` asset.
 * Data-driven input: author/ship this JSON, then {@link loadInputMapAsset}.
 * `version` is the asset format's, so an older file stays readable.
 *
 * @public
 */
interface InputMapAsset {
    version: number;
    actions: Record<string, ActionDef>;
}
/** A keyboard key, by `KeyboardEvent.code` — physical position, not the character
 *  it types, so WASD stays WASD on AZERTY.
 *  @public */
declare const Key: (code: string) => Binding;
/** A mouse button, by the DOM numbering (0 = left, 1 = middle, 2 = right) — and
 *  those three by name, so `MouseButton.Left` reads the same in a binding
 *  (`MouseButton(MouseButton.Left)`) and in a direct query
 *  (`input.isMouseButtonDown(MouseButton.Left)`). Before the names existed
 *  `MouseButton.Left` was undefined, and a query with it was never true.
 *  @public */
declare const MouseButton: ((button: number) => Binding) & {
    readonly Left: 0;
    readonly Middle: 1;
    readonly Right: 2;
};
/** A gamepad button — see {@link GamepadButton}. `pad` defaults to the first one.
 *  @public */
declare const GpButton: (button: number, pad?: number) => Binding;
/** A gamepad axis — see {@link GamepadAxis}. `scale` multiplies the reading, so
 *  `-1` inverts a stick axis that points the other way.
 *  @public */
declare const GpAxis: (axis: number, pad?: number, scale?: number) => Binding;
/** Two keys → a signed 1D axis (neg = -1, pos = +1).
 *  @public */
declare const Keys1D: (neg: string, pos: string) => Binding;
/** Four keys → a 2D axis (up = +y, right = +x).
 *  @public */
declare const Keys2D: (up: string, down: string, left: string, right: string) => Binding;
/** A gamepad stick → a 2D axis (up = +y; the raw Y axis is inverted to match Keys2D).
 *  @public */
declare const Stick: (stick: "left" | "right", pad?: number) => Binding;
/**
 * A named value the game writes itself (`Input.setVirtual`) — an on-screen
 * stick or button, which is the only input a touch device has. Works as a
 * scalar or a 2D source, so one kind covers both.
 *
 * @public
 */
declare const Virtual: (id: string) => Binding;
/** A digital action, read with `pressed`/`down`/`released`. Alternatives use the
 *  strongest value; an analog source counts as down past half its range.
 *  A complete keyboard/mouse tap between samples sets both edge flags while
 *  leaving `down` false and the sampled value at zero.
 *  @public */
declare const Button: (...bindings: Binding[]) => ActionDef;
/** A signed 1D action in [-1, 1], read with `value`.
 *  @public */
declare const Axis1D: (...bindings: Binding[]) => ActionDef;
/** A 2D action, read with `axis2d`. Diagonals are not normalised — the vector is
 *  what the sources produced.
 *  @public */
declare const Axis2D: (...bindings: Binding[]) => ActionDef;
/**
 * Which device families an interactive rebind listens to. Mouse is OFF by default
 * (so the click that started the rebind isn't captured).
 *
 * @public
 */
interface ListenOptions {
    keyboard?: boolean;
    mouse?: boolean;
    gamepad?: boolean;
}
/**
 * A live set of named actions, as {@link defineInputMap} answers it. Query it by
 * name from a system. Every read within a render frame or fixed simulation step
 * sees the same values; edges reach each cadence independently, once.
 *
 * @public
 */
declare class InputMap {
    private readonly defs_;
    private readonly state_;
    private readonly fixedState_;
    private pendingListen_;
    private tapOwner_;
    private cancellation_;
    constructor(actions: Record<string, ActionDef>);
    /** @internal Recompute the active cadence. Render evaluation also buffers
     *  edges for the next fixed step; complete physical taps survive between
     *  samples alongside the normal held-state transitions. */
    evaluate(input: InputState): void;
    private evaluateStates_;
    private readStates_;
    down(name: string): boolean;
    pressed(name: string): boolean;
    released(name: string): boolean;
    /** Scalar value: button [0,1], axis [-1,1], axis2d the magnitude [0,1]. */
    value(name: string): number;
    /** 2D value (axis2d); scalar actions return {value, 0}. A fresh object each call. */
    axis2d(name: string): Vec2;
    actions(): string[];
    getBindings(name: string): Binding[];
    /** Replace an action's bindings (no-op for an unknown action). */
    setBindings(name: string, bindings: Binding[]): void;
    /** Serialize current bindings (persist via Storage). */
    toJSON(): Record<string, Binding[]>;
    /** Serialize the FULL map (action types + bindings) — an `.inputmap` asset's
     *  content. (vs {@link toJSON}, which is bindings-only for rebind persistence.) */
    toAsset(): InputMapAsset;
    /** Override bindings for actions that EXIST in this map (unknown names ignored,
     *  so stale saved data for a removed action never resurrects it). */
    loadJSON(data: Record<string, Binding[]>): void;
    /** Save current bindings under `key`. */
    save(key: string): void;
    /** Apply bindings previously {@link save}d under `key`; returns true if found. */
    load(key: string): boolean;
    /** Resolve with the next physical input the user presses (or null if cancelled /
     *  superseded by another listen). Drives a rebind UI — the evaluation system
     *  feeds it each frame, so the map must be installed and the app running. */
    listenForBinding(opts?: ListenOptions): Promise<Binding | null>;
    /** Capture the next input and (re)bind it to `name` (replaces, or appends when `append`). */
    rebind(name: string, opts?: ListenOptions & {
        append?: boolean;
    }): Promise<Binding | null>;
    /** Cancel a pending {@link listenForBinding} (resolves it with null). */
    cancelListen(): void;
    isListening(): boolean;
    private scanForRebind_;
    /** First newly-pressed input this frame, as a Binding (keyboard + gamepad by
     *  default; mouse opt-in). Axis sources aren't captured — rebinding targets
     *  discrete inputs. */
    private scanBinding_;
}
/**
 * Define a named-action input map and register render/fixed evaluation systems.
 * Returns the live map — import it and query by name from any system.
 *
 * @example
 * export const Game = defineInputMap({ Jump: Button(Key('Space'), GpButton(GamepadButton.South)) });
 * // In a system: if (Game.pressed('Jump')) jump();
 *
 * @public
 */
declare function defineInputMap(actions: Record<string, ActionDef>): InputMap;
/**
 * Build a live InputMap from a loaded `.inputmap` asset (data-driven input —
 * fetch / import the JSON, then call this). Registers the evaluation system, same
 * as {@link defineInputMap}. Not frozen: no project we certify releases against
 * loads a map from an asset, so nothing holds this signature up.
 */
declare function loadInputMapAsset(asset: InputMapAsset): InputMap;

interface EntityEvent<TData = unknown> {
    /** Event type string (e.g. `'click'`, `'change'`). */
    readonly type: string;
    /** The entity where the event originated. */
    readonly target: Entity;
    /** The entity currently handling the event (differs from target during bubbling). */
    readonly currentTarget: Entity;
    /** User-provided payload (shape depends on `type`). */
    readonly data: TData;
    /** True if any handler called `stopPropagation()`. */
    propagationStopped: boolean;
    /** True if any handler called `preventDefault()`. */
    defaultPrevented: boolean;
    /** Stop the event from bubbling further up the parent chain. */
    stopPropagation(): void;
    /** Signal that the default action (if any) should be skipped. */
    preventDefault(): void;
}
/** Immutable dispatch facts for debugger observers; no payload or mutation methods. */
interface EntityEventObservation {
    readonly eventId: number;
    readonly type: string;
    readonly target: Entity;
    readonly currentTarget: Entity;
    readonly propagationStopped: boolean;
    readonly defaultPrevented: boolean;
}
type EntityEventHandler<TData = unknown> = (event: EntityEvent<TData>) => void;
type Unsubscribe$1 = () => void;
/**
 * Entity event queue: pub/sub with bubbling support.
 *
 * @example
 * ```ts
 * const events = new EntityEventQueue();
 * world.onDespawn(e => events.removeAll(e));   // one-time wiring
 *
 * events.on(buttonEntity, 'click', e => console.log('clicked'));
 * events.emit(buttonEntity, 'click');
 * ```
 */
declare class EntityEventQueue {
    private readonly entityHandlers_;
    private readonly globalHandlers_;
    private readonly typeCounts_;
    private pending_;
    private readonly activeKeys_;
    private readonly observers_;
    private readonly eventIds_;
    private nextEventId_;
    /** Observe actual dispatch after handlers, without subscribing as a game listener.
     * Observers cannot stop propagation, prevent defaults or change the payload. */
    observe(handler: (event: EntityEventObservation) => void): Unsubscribe$1;
    /**
     * Subscribe to an entity-specific event.
     * Returns an unsubscribe function.
     */
    on(entity: Entity, type: string, handler: EntityEventHandler): Unsubscribe$1;
    /**
     * Subscribe to all events of a type, from any entity.
     */
    on(type: string, handler: EntityEventHandler): Unsubscribe$1;
    private countType_;
    /**
     * Is anyone subscribed to this event type, for any entity?
     *
     * For producers that must LOOK for their events rather than being handed them: a
     * visibility watcher walks the UI tree, a proximity watcher measures distances, and
     * neither should do that work into an empty room. Emitting is unaffected — an event
     * with no handlers still queues for `drain()`.
     */
    hasListenersFor(type: string): boolean;
    /**
     * Remove all entity-specific handlers for `entity`.
     * Wire this to `world.onDespawn` for automatic cleanup.
     */
    removeAll(entity: Entity): void;
    /**
     * Emit an event for `entity`. Synchronously dispatches to registered
     * handlers and queues the event for `drain()` / `query()`. Returns the
     * event so callers can inspect propagationStopped / defaultPrevented
     * (e.g. to drive bubbling to parents).
     */
    emit<TData = unknown>(entity: Entity, type: string, data?: TData): EntityEvent<TData>;
    /**
     * Emit a bubbled event to an ancestor. Shares propagation state with
     * the root event: calling stopPropagation on the bubbled event marks
     * the root as stopped so callers can halt the bubbling walk.
     *
     * Callers are responsible for walking the parent chain; this queue
     * does not know about hierarchy.
     */
    emitBubbled(ancestor: Entity, rootEvent: EntityEvent): EntityEvent;
    /**
     * Return all events queued since the last drain and clear the queue.
     * Typically called once per frame by a UI system.
     */
    drain(): readonly EntityEvent[];
    /** Non-destructively inspect currently-pending events of a type. */
    query(type: string): readonly EntityEvent[];
    /** Restore an already-dispatched event for frame consumers without calling handlers again. @internal */
    requeue(event: EntityEvent): void;
    /** Remove all handlers and pending events. */
    clear(): void;
    private dispatch_;
}
/**
 * Shared EntityEventQueue resource. A plugin inserts the authoritative
 * instance on startup; systems access it via `Res(EntityEvents)`.
 *
 * The default value exists only so the resource is well-typed before
 * the owning plugin constructs the real queue. Consumers should never
 * see the placeholder at runtime — UIInteractionPlugin inserts its
 * queue during `build()`.
 */
declare const EntityEvents: ResourceDef<EntityEventQueue>;

/**
 * One authored wire. `event` is an open string (the widget vocabulary lives in
 * `UIEventType`, but any emitted name works); `action`/`guard` are
 * `aiRegistry` names; `arg` is the action's per-reference argument, exactly as
 * `.esfsm`/`.esbt` carry it.
 */
interface EventBindingRow {
    /** Event type to listen for on this entity, e.g. `'click'`. */
    event: string;
    /**
     * Name of the entity the action runs on. Empty/omitted = the entity that
     * carries the binding. Resolution is nearest-first, so a name inside a
     * prefab instance finds that instance's copy.
     */
    target?: string;
    /** Registered action name (`aiRegistry`), e.g. `'ui.setPage'`. */
    action: string;
    /**
     * The action's argument in canonical string form, e.g. `'tabs:settings'`.
     * Rows authored before the action declared its parameters keep this and
     * still run — the registry projects between the two forms.
     */
    arg?: string;
    /**
     * The action's declared parameters by name, e.g. `{controller: 'tabs', page:
     * 'settings'}`. Present when the action declares parameters; wins over `arg`.
     */
    params?: Record<string, AiParamValue>;
    /** Registered condition name that must pass for the row to run. */
    guard?: string;
    /** Run at most once, then stay inert until the scene reloads. */
    once?: boolean;
    /** Authoring toggle — an unchecked row stays in the data but never fires. */
    enabled?: boolean;
}
interface EventBindingData {
    rows: EventBindingRow[];
}
declare const EventBinding: ComponentDef<EventBindingData>;
/**
 * The entity named `name`, searched nearest-first from `from`: `from` itself,
 * then its subtree, then each ancestor's subtree (skipping the branch already
 * searched), and finally the world-wide name index as a fallback for scenes
 * with no shared root. Returns null when nothing matches.
 *
 * Exported for tests and for editor-side parity checks.
 */
declare function resolveBindingTarget(world: World, from: Entity, name: string): Entity | null;
declare class EventBindingPlugin implements Plugin {
    name: string;
    readonly profileDomain = "events";
    private runtime_;
    build(app: App): void;
    cleanup(): void;
}
declare const eventBindingPlugin: EventBindingPlugin;

/**
 * @file    transaction.ts
 * @brief   Undo/redo primitive for editor-driven mutation gestures
 *
 * The editor wraps one user gesture (a property edit, a drag, a paste) in
 * a Transaction. Each op in the transaction carries both its forward and
 * reverse closures so the pair can be replayed in either direction without
 * re-deriving state. TransactionManager holds the undo/redo stacks.
 */
/**
 * A single reversible mutation. `forward` applies the change; `reverse`
 * restores the pre-change state. Both closures are invoked at most once
 * per direction, and the pair is expected to be symmetric.
 */
interface TransactionOp {
    forward(): void;
    reverse(): void;
}
declare class Transaction {
    readonly id: string;
    readonly label: string;
    readonly timestamp: number;
    private readonly ops_;
    constructor(label: string, id?: string);
    /**
     * Appends an op to this transaction and runs its `forward` closure
     * immediately. Use `addDeferred` if the caller has already applied the
     * mutation and just wants to register a reverse.
     */
    add(op: TransactionOp): void;
    /**
     * Registers the reverse/forward pair without calling `forward` —
     * caller has already applied the mutation and just wants it undoable.
     */
    addDeferred(op: TransactionOp): void;
    get opCount(): number;
    undo(): void;
    redo(): void;
}
interface TransactionManagerOptions {
    /** Hard cap on undo history. Oldest entries drop first. Default: 200. */
    historyLimit?: number;
}
declare class TransactionManager {
    private readonly undoStack_;
    private readonly redoStack_;
    private readonly historyLimit_;
    private active_;
    constructor(options?: TransactionManagerOptions);
    /**
     * Opens a transaction and returns it. Caller adds ops, then calls
     * `commit(tx)`. Only one transaction is active at a time — nested
     * begins throw, keeping the LIFO invariant clean.
     */
    begin(label: string): Transaction;
    /**
     * Commits the active transaction onto the undo stack. Empty
     * transactions are dropped silently (keeps the stack uncluttered
     * when a gesture ends up being a no-op).
     */
    commit(tx: Transaction): void;
    /**
     * Aborts the active transaction without committing. Ops that have
     * already been `add`-ed are reversed so the world returns to the
     * pre-begin state.
     */
    rollback(tx: Transaction): void;
    undo(): Transaction | null;
    redo(): Transaction | null;
    canUndo(): boolean;
    canRedo(): boolean;
    peekUndo(): Transaction | null;
    peekRedo(): Transaction | null;
    /** Clears both undo and redo stacks. Use on scene load / project switch. */
    clear(): void;
}

/**
 * @file    behavior.ts
 * @brief   defineBehavior — per-entity scripted behavior, compiled to one ECS system.
 *
 * The authoring sugar for the gameplay loop: a behavior is a `defineComponent`
 * (its `state`, attachable + tunable per-entity in the editor Details panel) plus
 * an auto-registered system that drives `start` / `update` / `destroy` for every
 * entity carrying that component. There is no second runtime — it desugars
 * entirely onto the existing ECS-system model (REARCH_GAMEPLAY.md §2.2).
 */

/**
 * The per-entity handle passed to a behavior's lifecycle hooks. `self` is the
 * behavior's own component data — mutate it freely, the change persists. The
 * object is REUSED across entities and frames (zero per-entity allocation): do
 * not retain it past the hook call; copy what you need.
 */
interface BehaviorContext<S extends object> {
    /** The entity this behavior instance is attached to. */
    readonly entity: Entity;
    /** This behavior's own component data — mutate freely (persists). */
    readonly self: S;
    /** Frame timing (`delta` seconds, `elapsed`, …). */
    readonly time: TimeData;
    /** Runtime input (keyboard / mouse / touch). */
    readonly input: InputState;
    /** Deferred structural ops (spawn / despawn / insert) — safe mid-iteration. */
    readonly commands: CommandsInstance;
    /** The world, for cross-entity access. */
    readonly world: World;
    /**
     * Read another component on THIS entity.
     *
     * For a script component this IS the stored object, so mutating it sticks.
     * For an ENGINE component (Transform, Sprite, RigidBody2D — anything C++-backed)
     * it is a copy decoded out of the wasm heap: mutating it changes nothing.
     * Read it, change it, and hand it back through {@link set}.
     */
    get<C extends AnyComponentDef>(component: C): ComponentData$1<C>;
    /** Write another component on THIS entity — how an engine component is changed. */
    set<C extends AnyComponentDef>(component: C, data: ComponentData$1<C>): void;
    /** Whether THIS entity has `component`. */
    has(component: AnyComponentDef): boolean;
}
interface BehaviorDef<S extends object> {
    /** Per-entity state → a `defineComponent`, editable in the Details panel. */
    state?: S;
    /** Schedule the lifecycle system runs in (default `Schedule.Update`). */
    schedule?: Schedule;
    /** Field-presentation metadata for `state` (ranges, enums, …), forwarded to the component. */
    metadata?: ComponentMetadata;
    /**
     * The components this behaviour reaches for through `ctx.get`/`ctx.set`, by
     * name — its own state component is already declared. Undeclared, the
     * schedule assumes anything, and this conflicts with every other system.
     */
    touches?: SystemTouches;
    /** Run once, the frame the behavior's component first appears on an entity. */
    start?(ctx: BehaviorContext<S>): void;
    /** Run every frame for each entity carrying the behavior. `dt` == `ctx.time.delta`. */
    update?(ctx: BehaviorContext<S>, dt: number): void;
    /** Run once when the component is removed OR the entity is despawned. */
    destroy?(ctx: BehaviorContext<S>): void;
}
/**
 * Define a per-entity behavior. Returns the backing {@link ComponentDef} (so you
 * can spawn/insert it from code), and registers the lifecycle system as a side
 * effect.
 *
 * @example
 * export const Patrol = defineBehavior('Patrol', {
 *   state: { speed: 60 },
 *   update(ctx, dt) {
 *     const t = ctx.get(Transform);          // a copy — Transform is C++-backed
 *     t.position.x += ctx.self.speed * dt;
 *     ctx.set(Transform, t);                 // …so hand it back
 *   },
 * });
 */
declare function defineBehavior<S extends object>(name: string, def: BehaviorDef<S>): ComponentDef<S>;

/**
 * @file    staticBatch.ts
 * @brief   Many static meshes that share a material, folded into a few larger ones.
 *
 * @details The renderer already draws the SAME geometry many times as one instanced
 *          draw. What it cannot do is draw DIFFERENT geometry as one: each mesh is its
 *          own buffer range, so a level assembled from fifty distinct props pays fifty
 *          draws per material. A static batch is the answer a tool can give — bake each
 *          part's world transform into its vertices, concatenate, and draw the result once.
 *
 *          Three jobs, kept apart so each can be tested without a GPU:
 *            - {@link mergeMeshes}   the geometry: transforms and concatenates decoded meshes;
 *            - {@link planStaticBatches}  the grouping: who may share a draw, in which cells;
 *            - the plugin (staticBatchPlugin.ts)  the world: reads entities, uploads, hides.
 *
 *          What it costs is memory, not correctness: the merged mesh holds a copy of every
 *          part's vertices, and a part that stood for a hundred instances is now a hundred
 *          copies. {@link StaticBatchGroup} reports both numbers so the trade is visible.
 */

/** Why a mesh was left out of every batch. Each one is a rule the merge relies on. */
type StaticBatchRefusal = 
/** No geometry behind the handle yet (still loading, or a mesh that failed). */
'no-mesh'
/** Posed by a skeleton: one draw can only be in one pose. */
 | 'skinned'
/** Carries blend shapes: one draw can only be in one shape. */
 | 'morph'
/** Chooses among levels of detail at run time, which a merged mesh cannot. */
 | 'lod'
/** A billboard: it turns to each view, and a merged mesh is fixed where it was baked. */
 | 'billboard'
/** Lit by a bake: its atlas patch belongs to the object, not to the batch. */
 | 'baked'
/** Blended: its result depends on order, and merging is the loss of order. */
 | 'blended'
/** Moves (a dynamic body or a character): a static batch bakes where it stands. */
 | 'moves'
/** Switched off, so there is nothing to draw. */
 | 'disabled'
/** Vertex layout the merge cannot transform (positions or normals not float). */
 | 'layout'
/** The only member of its group: merging it would cost memory and save nothing. */
 | 'alone';
/** What decides whether two meshes may share a draw — every field is state a draw owns. */
interface StaticBatchState$1 {
    material: number;
    texture: number;
    normalMap: number;
    color: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    layer: number;
    cullBackfaces: boolean;
    lit: boolean;
    /** Shadow participation belongs to the draw; omitted keeps the MeshRenderer default of true. */
    castShadows?: boolean;
    parallax: {
        x: number;
        y: number;
    };
    /** The author's own grouping (`StaticBatch.group`), so two rooms can be kept apart. */
    group: string;
}
/** Whether a vertex layout is one the merge knows how to transform. */
declare function channelSignature(channels: readonly MeshChannelDesc[], stride: number): string;
/** Null when the layout can be merged; otherwise the refusal to report. */
declare function layoutRefusal(mesh: MeshData): StaticBatchRefusal | null;
/** One mesh and where it stands. */
interface BatchPart {
    mesh: MeshData;
    /** Column-major world matrix. */
    world: ArrayLike<number>;
}
/**
 * Concatenates `parts` into one mesh in world space.
 *
 * Every part must carry the same vertex layout (the planner groups by it); positions and
 * tangents go through the world matrix, normals through its inverse transpose. A mirrored part
 * (negative determinant) has its winding reversed and its tangent handedness flipped, so it
 * still faces the way it did.
 */
declare function mergeMeshes(parts: readonly BatchPart[]): MeshData;
/** What the planner knows about one entity, without holding its geometry. */
interface StaticBatchCandidate {
    entity: number;
    /** `staticBatchKey(...)` of its draw state plus its vertex layout. */
    key: string;
    /** Where its mesh stands, for the cell it falls in. */
    center: readonly [number, number, number];
    vertices: number;
}
interface StaticBatchPlan {
    /** Entities to merge together, one list per resulting mesh. */
    batches: {
        key: string;
        entities: number[];
        vertices: number;
    }[];
    /** Entities left out because they would have been alone in their group. */
    alone: number[];
}
interface StaticBatchLimits {
    /** Side of the world cell a batch is confined to: bigger merges more and culls worse. */
    cellSize: number;
    /** Most vertices one merged mesh may hold. */
    maxVertices: number;
}
declare const STATIC_BATCH_DEFAULTS: StaticBatchLimits;
/** The draw state two meshes must share to be one draw, as a string. */
declare function staticBatchKey(state: StaticBatchState$1, layout: string): string;
/**
 * Groups candidates by draw state, confines each group to world cells, and splits a cell at the
 * vertex limit. Order inside a batch follows entity id, so the same scene always merges the same way.
 */
declare function planStaticBatches(candidates: readonly StaticBatchCandidate[], limits?: StaticBatchLimits): StaticBatchPlan;
/** One merged mesh, as the report states it. */
interface StaticBatchGroup {
    /** The entity that now draws the merged mesh. */
    entity: number;
    /** The meshes folded into it. */
    parts: number[];
    vertices: number;
    triangles: number;
    /** Bytes of vertex and index data the merged mesh holds (the copy the merge costs). */
    bytes: number;
    /** What drawing the parts took: one per distinct mesh range, plus the instancing the renderer already did. */
    drawsBefore: number;
}
/** What the last pass did and left out, for a profiler or an editor panel. */
interface StaticBatchReport {
    groups: StaticBatchGroup[];
    refused: Map<number, StaticBatchRefusal>;
}

/** Where a marked mesh stands after the last pass: not decided yet, merged, or left out and why. @experimental */
declare const StaticBatchState: {
    readonly Pending: 0;
    readonly Merged: 1;
    readonly Skinned: 2;
    readonly Morph: 3;
    readonly Lod: 4;
    readonly Blended: 5;
    readonly Moves: 6;
    readonly Baked: 7;
    readonly Alone: 8;
    readonly NoMesh: 9;
    readonly Layout: 10;
    readonly Disabled: 11;
    readonly Billboard: 12;
};
/** The fields of the `StaticBatch` component. @experimental */
interface StaticBatchData {
    /** Meshes batch only with others of the same group, so two rooms can be kept apart. */
    group: string;
    /** What the last pass did with this mesh (a {@link StaticBatchState}); written by the pass, 0 until it has run. */
    state: number;
    /** How many meshes were drawn together with this one, itself included; 0 unless merged. */
    batched: number;
}
/**
 * Marks a mesh as one that will not move, so it may be drawn together with others that share its material.
 * Presence is the opt-in.
 *
 * @experimental
 */
declare const StaticBatch: ComponentDef<StaticBatchData>;
/** Run-time access to the batcher: what it did, and how to ask it to do it again. */
declare class StaticBatching {
    limits: StaticBatchLimits;
    /** @internal */ readonly groups_: StaticBatchGroupState[];
    /** @internal */ readonly refused_: Map<number, StaticBatchRefusal>;
    /** @internal */ readonly seen_: Set<number>;
    /** @internal */ pending_: number;
    /** @internal */ stable_: number;
    /** @internal */ busy_: boolean;
    /** @internal */ dirty_: boolean;
    /** What the last passes merged and left out. */
    report(): StaticBatchReport;
    /** The last passes in the small form the profiler reports across a process boundary. */
    summary(): StaticBatchSummary | null;
    /** Marked entities the pass has not decided on yet (their mesh is still loading). */
    get pending(): number;
    /** Forget every decision and merge again from the scene as it stands. */
    rebuild(): void;
}
/** What the profiler shows of the batcher: one entry per merged mesh, and the meshes left out by reason. */
interface StaticBatchSummary {
    groups: {
        entity: number;
        parts: number[];
        partCount: number;
        triangles: number;
        bytes: number;
        drawsBefore: number;
    }[];
    refused: {
        reason: string;
        count: number;
        entities: number[];
    }[];
}
/** The resource the plugin installs. @experimental */
declare const StaticBatchingRes: ResourceDef<StaticBatching>;
interface StaticBatchGroupState {
    entity: Entity;
    handle: number;
    parts: Entity[];
    report: StaticBatchGroup;
}
declare class StaticBatchPlugin implements Plugin {
    name: string;
    build(app: App): void;
    cleanup(app?: App): void;
    /** Marked entities whose mesh handle has not arrived: the pass cannot decide on them yet. */
    private freshEntities;
    /** Marked entities with a mesh, not yet merged or refused. */
    private undecided;
    private refuse;
    /** Records on the component what became of it, which is where the editor reads it from. */
    private stamp;
    private pass;
    /** Rebuild any group that lost a part (its scene unloaded, or the entity was destroyed). */
    private sweep;
    private restore;
    private shrink;
    /** Undo everything: parts draw themselves again, merged meshes are released. */
    private discardAll;
}
declare const staticBatchPlugin: Plugin;

/**
 * @file    frameStats.ts
 * @brief   The last frame's cost and counters, as the editor's profiler reads
 *          them — the same answer from its Play realm and from a device.
 */

interface FrameStatsReport {
    seq?: number;
    frameMs?: number;
    phases: Record<string, number>;
    /** Per-system and per-scope cost with the domain/system attribution the
     *  profile tree is folded from. Null while the app has stats off. */
    costs: FrameCosts | null;
    drawCalls: number;
    /** Every draw the GPU was asked for, every pass included; what `quality.drawCallBudget` is held to. */
    gpuDraws?: number;
    triangles: number;
    sprites: number;
    entities: number;
    gpuMs: number;
    cppScopes: Record<string, number>;
    cppCounters: Record<string, number>;
    gpuScopes: Record<string, number>;
    wasmBytes: number;
    vramBytes: number;
    /** Decoded audio resident (bytes), and how many clips play from their compressed file instead and the PCM that saved (estimate). */
    audioBytes?: number;
    audioStreamedCount?: number;
    audioStreamedSavedBytes?: number;
    /** What static batching merged and left out; absent until a mesh has been marked. */
    staticBatch?: StaticBatchSummary;
    /** Per CompositeBatch root, what it draws now; absent while no root is in the scene. */
    compositeBatch?: {
        entity: number;
        parts: number;
        instanced: number;
        draws: number;
        drawsBefore: number;
        moving: number;
    }[];
    quality?: QualityReport;
    /** What texture streaming holds: how many textures, the megabytes they take and would at full size, and how many moves it has made. */
    textureStreaming?: {
        enabled: boolean;
        textures: number;
        streamedMB: number;
        fullMB: number;
        moves: number;
        failures: number;
        startedSmall: number;
    };
}
declare function frameStatsReport(app: App): FrameStatsReport;

/**
 * @file    consoleForward.ts
 * @brief   Everything a game prints, handed to a listener as well as the console.
 *
 * wasm print/printErr and the SDK logger both route through console, so wrapping
 * it catches the whole stream — the editor's Play realm and a development build
 * talking to the editor forward the same lines.
 */
type ConsoleLevel = 'info' | 'warn' | 'error';
/** Wrap console so @p send hears every line; returns the unwrap. A throwing
 *  listener never stops the original console from printing. */
declare function forwardConsole(send: (level: ConsoleLevel, line: string) => void): () => void;

declare function setEditorMode(active: boolean): void;
declare function isEditor(): boolean;
declare function isRuntime(): boolean;
declare function setPlayMode(active: boolean): void;
declare function isPlayMode(): boolean;
/**
 * Run condition for gameplay (simulation-advancing) systems: true outside an
 * editor, or inside an editor only while play mode is active. In editor edit
 * mode it returns false, freezing gameplay while render/transform/layout
 * systems (which do not use this gate) keep ticking.
 */
declare function playModeOnly(): boolean;
/** Editor-only: advance FX simulations (particles, trails) in edit mode. */
declare function setFxEditPreview(enabled: boolean): void;
declare function isFxEditPreview(): boolean;
/** Run condition for FX systems: gameplay rules, plus the authoring preview. */
declare function fxPreviewOrPlayMode(): boolean;

/**
 * @file    context.ts
 * @brief   Explicit application context replacing globalThis implicit coupling
 */
/**
 * Surface the engine exposes to an attached editor host.
 *
 * `registerComponent` is called eagerly during `defineComponent` so the
 * editor knows the full component catalogue. The `on*` callbacks are all
 * optional — an editor that only needs the catalogue (no live inspector)
 * can leave them unset and avoid any per-mutation overhead.
 *
 * All entity values are the engine's numeric Entity handle. Component
 * identification is by the string name that was passed to
 * `registerComponent` / `defineComponent`.
 */
interface EditorBridge {
    registerComponent(name: string, defaults: Record<string, unknown>, isTag: boolean): void;
    /** Fired after an entity is created (optionally with a Name component). */
    onEntitySpawned?(entity: number, name?: string): void;
    /** Fired just before an entity is destroyed. Components are still attached. */
    onEntityDespawned?(entity: number): void;
    /** Fired when a component is first attached to an entity. */
    onComponentAdded?(entity: number, component: string): void;
    /** Fired when a component is detached from an entity. */
    onComponentRemoved?(entity: number, component: string): void;
    /** Fired when component data changes (insert with new data, set, or edit). */
    onComponentChanged?(entity: number, component: string): void;
    /** Fired when a parent link changes. `parent === null` means the entity was unparented. */
    onParentChanged?(child: number, parent: number | null): void;
}
interface PendingSystemEntry {
    schedule: number;
    system: unknown;
}
type WasmErrorHandler = (error: unknown, context: string) => void;
interface WasmErrorState {
    handler: WasmErrorHandler | null;
    lastReportTime: number;
    suppressedCount: number;
}
declare class AppContext {
    readonly componentRegistry: Map<string, any>;
    readonly pendingSystems: PendingSystemEntry[];
    /** Plugins a project bundle installed at module level, drained with the
     *  systems: a bundle is imported before an App exists. */
    readonly pendingPlugins: unknown[];
    editorBridge: EditorBridge | null;
    readonly wasmError: WasmErrorState;
    /**
     * Run mode. `editorMode` = an editor host is attached (vs a standalone
     * runtime); `playMode` = within an editor, gameplay is running. Gameplay
     * systems gate on these via {@link playModeOnly} (`env.ts`). Kept here so
     * all app-scoped mutable state lives on one context (with componentRegistry
     * / editorBridge / pendingSystems) rather than in a separate module global,
     * so isolated Apps get isolated run modes.
     */
    editorMode: boolean;
    playMode: boolean;
    /**
     * How many times the queues have been taken or cleared. What was declared into them belongs to the App that took them, so a declaration
     * made once for the context (a layer that is imported once) has to be queued again for the next App when this has moved.
     */
    queueEpoch: number;
    /** @brief Drain all pending systems and clear the queue */
    drainPendingSystems(): PendingSystemEntry[];
    /** @brief Drain all pending plugins and clear the queue */
    drainPendingPlugins(): unknown[];
    /** @brief Reset all mutable state for a new session */
    reset(): void;
}
declare function getDefaultContext(): AppContext;
declare function setDefaultContext(ctx: AppContext): void;

/**
 * @file    hotReload.ts
 * @brief   State-preserving hot-reload support (RC10 P3): collect a project bundle's
 *          re-registrations in isolation so the editor can decide hot-swap vs reload.
 */

interface ProbedRegistrations {
    /** Digest of the user component schemas the bundle declared (shape, not values). */
    fingerprint: string;
    /** The systems the bundle queued, to feed to {@link App.hotSwapSystems}. */
    pending: PendingSystemEntry[];
}
/**
 * Run `register` (a project-bundle re-import) inside a throwaway {@link AppContext}, so
 * its `defineComponent` / `addSystem` populate an isolated registry instead of the live
 * one — and return what it registered. The live context is always restored, even on
 * throw. The caller compares `fingerprint` to the live one (`getUserComponentFingerprint`
 * before calling) to choose hot-swap (unchanged → keep the World) vs full-reload, and
 * feeds `pending` to `App.hotSwapSystems`. Component identity is interned by name (see
 * component.ts), so the probe's component defs share the live `_id`s — the re-imported
 * systems' queries resolve to the live storage. See docs/REARCH_HOT_RELOAD.md.
 */
declare function probeRegistrations(register: () => Promise<void>): Promise<ProbedRegistrations>;

declare const uiPlugins: Plugin[];

/**
 * @file    ui/core/events.ts
 * @brief   The UI's vocabulary over the engine's entity event channel.
 *
 * The queue itself is not UI-specific and lives in `entityEvents.ts` (so the
 * core binding layer and non-UI producers can speak it without importing
 * `ui/`); the names below are aliases of those very objects — one queue, one
 * resource, two spellings. What IS UI-specific is {@link UIEventType}: the set
 * of type strings the built-in widgets emit.
 */

/**
 * Common UI event types. Event type strings are open — users may emit any
 * string they like (e.g. `'item_selected'` from a ListView). These constants
 * document the standard set emitted by built-in widgets.
 */
declare const UIEventType: {
    readonly Click: "click";
    readonly Press: "press";
    readonly Release: "release";
    /** A pointer holding this entity moved. Carries a {@link UiPointerEventData}; bubbles like a press. */
    readonly PointerMove: "pointer_move";
    /** A pointer's hold on this entity ended without a release: the system cancelled it, or something took the gesture over. */
    readonly PressCancel: "press_cancel";
    readonly HoverEnter: "hover_enter";
    readonly HoverExit: "hover_exit";
    readonly Focus: "focus";
    readonly Blur: "blur";
    readonly Change: "change";
    readonly Submit: "submit";
    readonly DragStart: "drag_start";
    readonly DragMove: "drag_move";
    readonly DragEnd: "drag_end";
    readonly Scroll: "scroll";
    /** This node arrived on screen — it, or an ancestor, stopped being `display: None`
     *  (or it was just created visible). Emitted by the UI visibility watcher. */
    readonly Shown: "shown";
    /** …and left it, the same way. */
    readonly Hidden: "hidden";
    readonly Select: "select";
    readonly Deselect: "deselect";
};
/**
 * Union of the string values in `UIEventType`. Event emitters accept
 * any string (widgets may define their own), but consumers can narrow
 * to this type when they only handle built-ins.
 */
type UIEventType = typeof UIEventType[keyof typeof UIEventType];

/**
 * Change notification emitted by a DataSource.
 */
type DataSourceChange = {
    type: 'insert';
    index: number;
    count: number;
} | {
    type: 'remove';
    index: number;
    count: number;
} | {
    type: 'update';
    index: number;
    count: number;
} | {
    type: 'reset';
};
type Unsubscribe = () => void;
/**
 * Abstract backing store for a virtualized list. Producers implement
 * `getCount` + `getItem` at minimum; optional methods provide
 * heterogeneous item types, stable identity for diffing, and change
 * notifications so consumers can mark themselves dirty.
 */
interface DataSource<T = unknown> {
    getCount(): number;
    getItem(index: number): T;
    /** Defaults to `'default'`. Used to route items to the matching template. */
    getItemType?(index: number): string;
    /** Stable identity to support future reorder-aware diffing. */
    getItemId?(index: number, item: T): string | number;
    /** Subscribe to change notifications; returns an unsubscribe fn. */
    subscribe?(listener: (change: DataSourceChange) => void): Unsubscribe;
}
/**
 * DataSource backed by a mutable array, with helper methods that mutate
 * the array and notify subscribers in one call.
 */
declare class ArrayDataSource<T> implements DataSource<T> {
    private readonly items_;
    private readonly listeners_;
    constructor(items?: readonly T[]);
    getCount(): number;
    getItem(index: number): T;
    subscribe(listener: (c: DataSourceChange) => void): Unsubscribe;
    /** Replace all items. Emits a `reset`. */
    setItems(items: readonly T[]): void;
    /** Append items to the end. Emits `insert`. */
    append(items: readonly T[]): void;
    /** Insert items at `index`. Emits `insert`. */
    insert(index: number, items: readonly T[]): void;
    /** Remove `count` items starting at `index`. Emits `remove`. */
    remove(index: number, count?: number): void;
    /** Replace item at `index`. Emits `update`. */
    update(index: number, item: T): void;
    private emit_;
}
/** Convenience factory for ad-hoc arrays. */
declare function arrayDataSource<T>(items: readonly T[]): ArrayDataSource<T>;

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}
/**
 * Abstract layout math for a virtualized list. Implementations answer
 * three questions for a list of fixed-size items:
 *
 * - how big is the total content?
 * - where does item `i` sit inside that content?
 * - which index range is visible in the given viewport?
 *
 * Variable-height items can be added later via an optional
 * measure callback; this revision assumes fixed-size items.
 */
interface LayoutProvider {
    getContentSize(count: number): Vec2;
    getItemRect(index: number): Rect;
    /** Inclusive start, exclusive end. Returns [0, 0] when nothing is visible. */
    getVisibleRange(viewport: Rect, count: number): [start: number, end: number];
}
interface LinearLayoutOptions {
    direction?: 'row' | 'column';
    spacing?: number;
    itemSize: Vec2;
}
declare class LinearLayoutProvider implements LayoutProvider {
    private readonly dir_;
    private readonly spacing_;
    private readonly itemSize_;
    constructor(opts: LinearLayoutOptions);
    getContentSize(count: number): Vec2;
    getItemRect(index: number): Rect;
    getVisibleRange(viewport: Rect, count: number): [number, number];
    private mainAxis_;
    private stride_;
}
interface MeasuredLinearLayoutOptions {
    direction?: 'row' | 'column';
    spacing?: number;
    /** Fixed cross-axis size (width for a column list, height for a row). */
    crossSize: number;
    /** Main-axis size (height for a column, width for a row) of item `index`. */
    mainSizeOf: (index: number) => number;
}
/**
 * A linear list whose items vary along the main axis (e.g. chat bubbles that grow
 * with their wrapped text). Item offsets are prefix-summed and cached; the cache
 * rebuilds when the item count changes or {@link invalidate} is called (a data or
 * measurement change — the ListView invalidates on both). `mainSizeOf` is the
 * app's measure hook, so the list stays measurement-agnostic.
 */
declare class MeasuredLinearLayoutProvider implements LayoutProvider {
    private readonly dir_;
    private readonly spacing_;
    private readonly crossSize_;
    private readonly mainSizeOf_;
    /** Prefix offsets: `offsets_[i]` = main-axis start of item `i`; length count+1. */
    private offsets_;
    private total_;
    private monotone_;
    private builtFor_;
    constructor(opts: MeasuredLinearLayoutOptions);
    /** Re-measure on the next query (an item's data/size changed, not just the count). */
    invalidate(): void;
    private ensure_;
    getContentSize(count: number): Vec2;
    getItemRect(index: number): Rect;
    getVisibleRange(viewport: Rect, count: number): [number, number];
}
interface GridLayoutOptions {
    columns: number;
    itemSize: Vec2;
    spacing?: Vec2;
}
declare class GridLayoutProvider implements LayoutProvider {
    private readonly cols_;
    private readonly itemSize_;
    private readonly spacing_;
    constructor(opts: GridLayoutOptions);
    getContentSize(count: number): Vec2;
    getItemRect(index: number): Rect;
    getVisibleRange(viewport: Rect, count: number): [number, number];
}

/**
 * @file    view-pool.ts
 * @brief   Entity recycler for virtualized lists.
 *
 * A ViewPool keeps idle item entities around instead of despawning them,
 * so scrolling through a 10 000-row list only ever has ~(viewport items)
 * active. When an item scrolls off-screen, it is released back to the
 * pool; when a new item scrolls on, one is acquired from the pool (or a
 * fresh one is created).
 *
 * Visibility is toggled through an injected `setVisible` hook; this keeps
 * ViewPool decoupled from the UIVisual component shape.
 */

/**
 * Factory + binder pair for a single item type. Registered per type
 * (e.g. `'default'`, `'header'`, `'footer'`).
 */
interface ViewPoolTemplate<TData = unknown> {
    /**
     * Create a new entity when the pool has no free instances.
     * Attach any child entities / components needed to render one item.
     */
    factory: (world: World, parent: Entity) => Entity;
    /**
     * Apply data to an entity just acquired from the pool (or freshly
     * created). Called every time the item is bound, so binders must be
     * idempotent — do not rely on prior state.
     */
    binder: (entity: Entity, data: TData, index: number) => void;
}

interface ListViewItemTemplate<T = unknown> extends ViewPoolTemplate<T> {
}
interface ListViewOptions<T = unknown> {
    world: World;
    /** Entity that hosts the scrolling content (items are parented here). */
    parent: Entity;
    dataSource: DataSource<T>;
    layout: LayoutProvider;
    /** Size of the visible window into the content, in content-local units. */
    viewportSize: Vec2;
    /** Map of item type → template; every `getItemType(i)` result must have a match. */
    templates: Record<string, ListViewItemTemplate<T>>;
    /**
     * Extra index count kept mounted on each side of the strict visible range.
     * Default 2. For grid layouts set this to `columns * 2` or similar for
     * row-level padding.
     */
    recycleBuffer?: number;
    /**
     * Override how an item entity is positioned for its computed rect.
     * Default writes `Transform.position = (centerX, -centerY, 0)` so the
     * item's center lands on the layout rect center in a y-up world.
     */
    placeItem?: (world: World, entity: Entity, rect: Rect, index: number) => void;
    /** Called after each bind, useful for ad-hoc per-item tweaks. */
    onItemBound?: (entity: Entity, data: T, index: number) => void;
    /** Toggle visibility on pool acquire/release. Forwarded to ViewPool. */
    setVisible?: (world: World, entity: Entity, visible: boolean) => void;
}
/**
 * Virtualized list driver. Owns a ViewPool + DataSource subscription;
 * on each `update()` computes the visible index range and syncs the
 * mounted item set to match.
 *
 * Does not own input — callers drive scrolling by calling
 * `setScrollOffset()`. Typical wiring: a ScrollContainer primitive (or
 * the app's input layer) computes a new offset and pushes it in.
 */
declare class ListView<T = unknown> {
    private readonly world_;
    private readonly parent_;
    private readonly dataSource_;
    private readonly layout_;
    private readonly pool_;
    private readonly recycleBuffer_;
    private readonly placeItem_;
    private readonly onItemBound_;
    private readonly mounted_;
    private unsubscribeDataSource_;
    private viewportSize_;
    private scrollOffset_;
    private dirty_;
    private disposed_;
    constructor(opts: ListViewOptions<T>);
    /** A measured layout caches per-item offsets; drop them when the data (or, for
     *  width-dependent measures like wrapped text, the viewport) changes. No-op for
     *  fixed-size providers. */
    private invalidateLayout_;
    /** Current visible window within the content, in content-local coords. */
    getViewport(): Rect;
    /** Total size of the content for the current data count. */
    getContentSize(): Vec2;
    /** Strict visible index range [start, end). */
    getVisibleRange(): [number, number];
    /** Number of entities currently mounted (useful for virtualization tests). */
    getMountedCount(): number;
    setScrollOffset(offset: Vec2): void;
    setViewportSize(size: Vec2): void;
    /** Mark the mount set dirty — the next `update()` will re-sync. */
    refresh(): void;
    /**
     * Sync mounted items to the current viewport + data source.
     * Cheap when nothing has changed (short-circuits on !dirty).
     */
    update(): void;
    private sync_;
    /** Release all mounted items and tear down subscriptions. */
    dispose(): void;
}

interface ScrollContainerOptions {
    viewportSize: Vec2;
    contentSize: Vec2;
    initialOffset?: Vec2;
    /** Axis restrictions. Default 'vertical'. */
    direction?: 'both' | 'vertical' | 'horizontal';
    /** Multiplier applied to wheel deltas. Default 1. */
    wheelSpeed?: number;
    /** Drag/touch scrolling (pointer grab + kinetic fling). Default true. */
    dragScroll?: boolean;
    /** Fling velocity left after 1s of coasting. Default 0.135. */
    decelerationRate?: number;
    /** Auto-fading overlay scrollbar thumbs. Default true. */
    showScrollbar?: boolean;
    /**
     * Let a drag pull the content past either end (rubber-banded, so the further out, the stiffer), and spring it back when let go.
     * The offset itself stays clamped; the extra is {@link ScrollContainer.getOverscroll}. Default false.
     */
    elastic?: boolean;
    /** Seconds the spring back takes to settle. Default 0.5. */
    bounceTime?: number;
}
type ScrollListener = (offset: Vec2) => void;
/** Told when the overscroll changes; @p offset is the (clamped) offset it is measured from. */
type OverscrollListener = (overscroll: Vec2, offset: Vec2) => void;
/**
 * Scroll state for a virtualized view. Clamps offset to the legal range
 * `[0, contentSize - viewportSize]` and notifies listeners on any change.
 *
 * The ScrollContainer itself has no input knowledge; a system pushes
 * wheel / drag deltas into `scrollBy`. Consumers that need to react
 * (e.g. a ListView) subscribe via `onScroll`.
 */
declare class ScrollContainer {
    private viewportSize_;
    private contentSize_;
    private offset_;
    private readonly direction_;
    private readonly wheelSpeed_;
    private readonly dragScroll_;
    private readonly decelerationRate_;
    private readonly showScrollbar_;
    private readonly listeners_;
    private readonly overListeners_;
    private readonly elastic_;
    private readonly bounceTime_;
    private over_;
    private overVel_;
    constructor(opts: ScrollContainerOptions);
    getOffset(): Vec2;
    getViewportSize(): Vec2;
    getContentSize(): Vec2;
    getMaxOffset(): Vec2;
    getShowScrollbar(): boolean;
    getWheelSpeed(): number;
    getDragScroll(): boolean;
    getDecelerationRate(): number;
    setOffset(offset: Vec2): void;
    isElastic(): boolean;
    /** How far the content is pulled past an end on each axis: negative before the start, positive past the end, 0 inside. */
    getOverscroll(): Vec2;
    /** Whether the content is out past an end, or still moving back from it. */
    isSpringing(): boolean;
    /**
     * Put the content where a finger holding it would: @p raw is the UNCLAMPED offset the drag asks for. Inside the range it is the
     * offset; past an end the offset stops there and the rest is shown as rubber-banded overscroll. Not elastic, this is `setOffset`.
     */
    dragTo(raw: Vec2): void;
    /** Take the speed out of the spring, leaving the content where it is. */
    releaseSpring(): void;
    /** Momentum arriving at an end: some of it goes into the overscroll, which then springs back. */
    absorb(axis: 'x' | 'y', velocity: number): void;
    /** Advance the spring by @p dt seconds. Returns whether the overscroll changed. */
    tickSpring(dt: number): boolean;
    private setOverscroll;
    private notifyOver_;
    scrollBy(delta: Vec2): void;
    setViewportSize(size: Vec2): void;
    setContentSize(size: Vec2): void;
    /** Update both extents before clamping, so resize emits only its final offset. */
    setSizes(viewport: Vec2, content: Vec2): void;
    onScroll(listener: ScrollListener): () => void;
    onOverscroll(listener: OverscrollListener): () => void;
    dispose(): void;
}

/**
 * @file    ui/ui-plugin.ts
 * @brief   UIPlugin — the single declarative UI pipeline.
 *
 * Composes the separate concept plugins (layout, mask, safe-area, text,
 * interaction, behavior, controller, drag, focus, text-input, render-order) into one
 * plugin so the app's plugin list carries a single UI entry instead of ten
 * hand-ordered ones. System *execution* order is still defined declaratively by
 * each system's runAfter/runBefore labels; composition only fixes *build* order
 * so resources exist before their readers (UIInteraction inserts UIEvents before
 * UIBehavior reads it at build). The concept plugins stay individually exported
 * for granular/advanced wiring (e.g. a layout-only test harness).
 */

declare class UIPlugin implements Plugin {
    name: string;
    private readonly widgetCleanups_;
    build(app: App): void;
    cleanup(app?: App): void;
    /** Shared UI event bus (delegates to the behavior layer). */
    get events(): EntityEventQueue;
    registerListView(list: ListView<unknown>): void;
    unregisterListView(list: ListView<unknown>): void;
    attachScrollContainer(entity: Entity, container: ScrollContainer): void;
    detachScrollContainer(entity: Entity): void;
}
declare const uiPlugin: UIPlugin;

/**
 * Horizontal alignment. With a layout box it aligns inside the box; without one it
 * anchors the run relative to the entity's own position.
 *
 * @public
 */
declare const TextAlign: {
    readonly Left: 0;
    readonly Center: 1;
    readonly Right: 2;
};
/** @public */
type TextAlign = (typeof TextAlign)[keyof typeof TextAlign];
/**
 * Vertical alignment, on the same rule as {@link TextAlign}: inside the box when
 * there is one, otherwise relative to the origin.
 *
 * @public
 */
declare const TextVerticalAlign: {
    readonly Top: 0;
    readonly Middle: 1;
    readonly Bottom: 2;
};
/** @public */
type TextVerticalAlign = (typeof TextVerticalAlign)[keyof typeof TextVerticalAlign];
/**
 * What a run too big for its box does. Needs a box: `Clip` and `Ellipsis` drop the
 * lines past the box height, and trim a line past the box width. Trimming is
 * whole-glyph — text does not go through a scissor, so a partial glyph is not
 * something this can draw.
 *
 * @public
 */
declare const TextOverflow: {
    readonly Visible: 0;
    readonly Clip: 1;
    readonly Ellipsis: 2;
    /** Smaller type until the text fits the box: the size drops a whole pixel at a time, and line height and letter spacing with it. */
    readonly Shrink: 3;
    /** Every line shows, and the box grows to hold them: the entity's `ContentRect` height becomes the text's own. */
    readonly ResizeHeight: 4;
};
/** @public */
type TextOverflow = (typeof TextOverflow)[keyof typeof TextOverflow];
/** Glyph pipeline for a Text.
 *  @public */
declare const TextRenderMode: {
    /** Hinted bitmap while the entity is unscaled, SDF once it scales. */
    readonly Auto: 0;
    /** Canvas2D native AA at the on-screen pixel size. Sharpest when static. */
    readonly Bitmap: 1;
    /** Signed-distance field — a stable ~1px edge at any scale/zoom. */
    readonly Sdf: 2;
};
/** @public */
type TextRenderMode = (typeof TextRenderMode)[keyof typeof TextRenderMode];
/**
 * {@link Text}'s fields. Alignment and `overflow` read differently with and
 * without a layout box — see {@link TextAlign} and {@link TextOverflow}.
 *
 * @public
 */
interface TextData {
    content: string;
    /**
     * Localization key. Non-empty ⇒ `content` is DERIVED: every frame the
     * text-localization system resolves the key through the app's Localization
     * resource (opt-in plugin) and writes the result into `content`, so a
     * `setLocale` re-flows every bound label. Empty (default) or no
     * Localization resource ⇒ `content` stands as authored.
     */
    i18nKey: string;
    /**
     * A font asset the game SHIPS (`.ttf` / `.otf` / `.woff`). When set it wins
     * over {@link fontFamily}: the loader registers the file with the platform's
     * text stack and this handle resolves back to that family. Leave it empty to
     * name a font the host already has, through `fontFamily`.
     */
    font: number;
    /** Font family resolved by the platform's text stack — a font the HOST
     *  already has. For a font you ship, use {@link font} instead. */
    fontFamily: string;
    fontSize: number;
    color: Color;
    align: TextAlign;
    verticalAlign: TextVerticalAlign;
    wordWrap: boolean;
    overflow: TextOverflow;
    lineHeight: number;
    /**
     * Extra space after every glyph, in the same px as `fontSize`; negative draws them closer. It is CSS's
     * `letter-spacing` and a Cocos Label's `spacingX`. Wrapping, alignment, `Ellipsis` and `Shrink` all measure
     * with it, and `Shrink` scales it with the size. Absent is 0.
     */
    letterSpacing?: number;
    bold: boolean;
    italic: boolean;
    strokeColor: Color;
    strokeWidth: number;
    shadowColor: Color;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
    /** A line under each line of text, in the font's own underscore. Absent is off. */
    underline?: boolean;
    richText: boolean;
    renderMode: TextRenderMode;
    /**
     * Draw layer, for a text with NO layout box — a label standing in the world
     * rather than inside a Canvas. It is read the same way Sprite.layer and
     * ShapeRenderer.layer are, so a label can be put in front of (or behind) the
     * world content around it.
     *
     * Ignored under a UINode: inside a Canvas the UI render order decides, and a
     * second knob there would let a text sort against its own panel.
     *
     * It exists because world text was pinned to layer 0 with no way off it, so
     * any ShapeRenderer or Sprite that also sat on layer 0 and drew later simply
     * covered it — a board hiding its own pieces, a name tag behind the character
     * it names — with nothing in the component to reach for.
     */
    layer: number;
    /**
     * Width of the layout box for a text with NO `UINode` — 0 (the default) means no box, and the entity origin
     * is the box, as it always was. With a box, alignment, wrapping and overflow work inside it, exactly as
     * under a `UINode`, while the text stays world content sorted by `layer`. A `UINode`, when present, decides
     * the box and these three are ignored.
     */
    boxWidth?: number;
    /** Height of that box; 0 for none. Vertical alignment and `Clip`/`Ellipsis` need it. */
    boxHeight?: number;
    /**
     * Where the entity origin sits inside the box, as a fraction from its left and bottom edges: (0.5, 0.5) is
     * the centre, (0, 1) the top-left corner. It is the anchor point of a Cocos or Unity rect transform.
     */
    boxPivot?: Vec2;
    /** Render toggle — the editor's eye and runtime hiding both flip this. */
    enabled: boolean;
}
/**
 * A run of text. Under a `UINode` it lays out in that box; standing alone it draws
 * in the world at the entity's transform, anchored by its alignment. `content` is
 * derived rather than authored once `i18nKey` is set.
 *
 * @public
 */
declare const Text: ComponentDef<TextData>;

/**
 * @file    ui/text/glyph-preload.ts
 * @brief   Putting glyphs on the atlas before they are shown, a few milliseconds a frame.
 *
 * A character costs the frame it first appears in. One is nothing; the first page
 * of a novel is hundreds, and on a phone that frame runs long. A game knows what it
 * is about to show, so it can spend that time on its loading screen instead, spread
 * over frames rather than in one.
 *
 * This holds only the walk: which character is next, and when the frame's budget is
 * spent. Producing a glyph is the sink's, so a preloaded glyph is the same atlas cell
 * the layout would have asked for (TextPlugin.preload).
 */
interface GlyphPreloadOptions {
    /** Milliseconds of glyph work per frame. A loading screen with nothing else to do can give it more. Default 4. */
    budgetMs?: number;
}
interface GlyphPreload {
    /** Characters done over characters asked for, 0 to 1. */
    readonly progress: number;
    /** Resolves when every character is on the atlas, or the preload was released first. */
    readonly done: Promise<void>;
    /**
     * Stop, if it has not finished, and let the atlas pages go. Preloaded glyphs keep their pages until this is called, since a page no
     * text is showing is otherwise released at the next frame: call it when the chapter they were for is over. Text showing them keeps
     * what it uses.
     */
    release(): void;
}

/**
 * @file    ui/text/plugin.ts
 * @brief   TextPlugin — renders the `Text` component via the dynamic glyph
 *          atlas. A pre-flush callback scans Text entities, places the text
 *          inside its UINode box (rendering never mutates layout) and draws
 *          batched glyph quads, layered with sibling UI elements. Two glyph
 *          pipelines — hinted bitmap vs SDF — routed per Text by
 *          {@link resolveTextRenderMode}.
 */

declare class TextPlugin implements Plugin {
    name: string;
    private readonly states_;
    /** Apps this plugin was built on: only those step a preload. */
    private readonly built_;
    private stateFor;
    cleanup(app?: App): void;
    build(app: App): void;
    /**
     * Draw every Text belonging to one domain, into whichever list is open.
     *
     * The domain is asked of the engine, not derived here: it is resolved once at
     * a UI subtree's root and inherited (UISystem::screenDomain), and a second
     * spelling of that rule in TS is a second rule.
     */
    private drawDomain;
    /**
     * Whether the engine can keep a label's glyph quads and submit them itself. A core without the entry points (an older native host) takes the
     * path that hands every label over every frame.
     */
    private canRetain;
    /**
     * One domain's Text, with the glyph quads kept by the engine: a label that is the same as the last time costs a comparison here and the
     * engine's own loop, and is laid out again only when its text, style or box changed.
     */
    private drawRetained;
    /** Lay the labels the engine reports stale out again, in the domain they are in now. */
    private rebuildStale;
    /** Lay one label out in @p screen's domain and give the engine its quads. */
    private layoutRetained;
    private drawDomainWithMatrix;
    /**
     * Put the glyphs of @p text on the atlas ahead of time, a slice a frame, as @p entity's Text will draw them: its font, size, style and
     * pipeline, in its domain. Everything is read from the Text rather than asked for again, since a glyph at another size or in another
     * atlas is a different cell and preloading it would buy nothing. See {@link preloadGlyphs}.
     */
    preload(app: App, entity: Entity, text: string, options?: GlyphPreloadOptions): GlyphPreload;
    private stepPreloads;
    private projectionKnown;
    private domainView;
    /** The two glyph pipelines of one domain, created lazily; they share layout,
     *  page store, and batch submit — only the atlas contents and shader
     *  coverage differ. */
    private rendererFor;
}
declare const textPlugin: TextPlugin;
/**
 * Put the glyphs of @p text on the atlas before they are shown, so the frame that shows them does not pay for them. The first page of a
 * novel is hundreds of new characters, and they all land in one frame otherwise. Give it what is coming (a chapter, the next scene's
 * lines) on a loading screen and wait on `done`, or let it run behind the game: it spends `budgetMs` a frame.
 *
 * @param entity The Text that will show them, which says how they are drawn. It need not be visible.
 * @param text   Repeated characters cost nothing. Text in a rich-text size or an outline is another cell, and is made when it first shows.
 * @returns      Call `release()` when the text is over: the glyphs hold their atlas pages until then.
 */
declare function preloadGlyphs(app: App, entity: Entity, text: string, options?: GlyphPreloadOptions): GlyphPreload;

declare class UIMaskPlugin implements Plugin {
    name: "uiMask";
    build(app: App): void;
}
declare const uiMaskPlugin: UIMaskPlugin;

/**
 * Registers `ContentRect` and keeps the sprites and texts that share an entity with one following it.
 *
 * Only entities whose rect changed since the last run are visited (change tracking), at the end of the update and again at the very
 * end, so a script that resizes something in the frame's last system still draws it at the new size that frame.
 */
declare class ContentRectPlugin implements Plugin {
    name: string;
    build(app: App): void;
}
declare const contentRectPlugin: ContentRectPlugin;

declare class UIInteractionPlugin implements Plugin {
    name: "uiInteraction";
    dependencies: "uiLayout"[];
    private readonly releases_;
    cleanup(app?: App): void;
    build(app: App): void;
}
declare const uiInteractionPlugin: UIInteractionPlugin;

/**
 * @file    ui/layout/layout.ts
 * @brief   Layout concept — the Yoga-backed layout driver.
 *
 * Owns the PreUpdate `UILayoutSystem` (drives the C++ Yoga pass via
 * `uiLayout_update` + `transform_update`) plus the PostUpdate late pass
 * that re-solves after scroll/list mutations. Co-located with the
 * `flex`/`safe-area` schemas in this module.
 */

declare class UILayoutPlugin implements Plugin {
    name: string;
    readonly profileDomain = "ui";
    build(app: App): void;
}
declare const uiLayoutPlugin: UILayoutPlugin;

declare class UIRenderOrderPlugin implements Plugin {
    name: "uiRenderOrder";
    dependencies: "uiLayout"[];
    after: ("text" | "uiInteraction" | "uiMask")[];
    build(app: App): void;
}
declare const uiRenderOrderPlugin: UIRenderOrderPlugin;

/**
 * @file    ui/core/visibility.ts
 * @brief   `shown` / `hidden` — a node arriving on or leaving the screen, as events.
 *
 * A UI node goes away because an ANCESTOR's `display` changed: navigation shows a
 * panel, a tab button shows a page, a dialog closes. Every node under it stops being
 * drawn, and until now nothing said so — a game that wanted "play the entrance when
 * this screen appears" had to walk the parent chain of every animated node itself,
 * every frame, and re-derive what the layout pass had already computed.
 *
 * These are the two events for it, on the same channel as `click`: so the answer is
 * data (an EventBinding row from `shown` to a named action) rather than a system.
 *
 * Visibility is read as the engine's own resolved bit (`hidden_in_tree_`, the same
 * one rendering and hit-testing use), so "visible" cannot drift from what you can
 * see. That bit is only reachable one entity at a time, so the scan is gated twice —
 * it is the whole cost of this file, and on a steady frame it must be nothing:
 *
 *   · nobody listening ⇒ no scan. A producer that has to LOOK for its events should
 *     do nothing into an empty room, and this one has no other reason to run.
 *   · nothing moved ⇒ no scan. `hidden_in_tree_` is a function of authored `display`
 *     and of the tree, so it cannot change unless a UINode was written or the
 *     hierarchy changed — both O(1) to ask about (the same pair PhysicsSystem gates
 *     its reconcile on). A UI that is merely being looked at costs two integer
 *     comparisons per frame.
 */

declare class UIVisibilityPlugin implements Plugin {
    name: "uiVisibility";
    dependencies: "uiInteraction"[];
    build(app: App): void;
}
declare const uiVisibilityPlugin: UIVisibilityPlugin;

declare class TextInputPlugin implements Plugin {
    name: "textInput";
    dependencies: "focus"[];
    private cleanupListeners_;
    cleanup(app?: App): void;
    build(app: App): void;
}
declare const textInputPlugin: TextInputPlugin;

declare class DragPlugin implements Plugin {
    name: "drag";
    dependencies: "uiInteraction"[];
    private readonly cleanups_;
    cleanup(app?: App): void;
    build(app: App): void;
}
declare const dragPlugin: DragPlugin;

declare class FocusPlugin implements Plugin {
    name: "focus";
    dependencies: "uiInteraction"[];
    private readonly keyDefaults_;
    cleanup(app?: App): void;
    build(app: App): void;
}
declare const focusPlugin: FocusPlugin;

interface SafeAreaData {
    applyTop: boolean;
    applyBottom: boolean;
    applyLeft: boolean;
    applyRight: boolean;
    /**
     * Also clear the host's own overlay — WeChat's capsule menu, which sits
     * INSIDE the safe area: measured on an iPhone 12, its bottom is 29px below
     * `safeArea.top`. Only for a node the overlay actually reaches: this moves
     * the whole node down, so a HUD already above the capsule ends up on it.
     */
    avoidHostMenu: boolean;
}
declare const SafeArea: ComponentDef<SafeAreaData>;
declare class SafeAreaPlugin implements Plugin {
    name: "safeArea";
    dependencies: "uiLayout"[];
    private readonly resizeCleanups_;
    private latestResizeCleanup_;
    cleanup(app?: App): void;
    build(app: App): void;
}
declare const safeAreaPlugin: SafeAreaPlugin;

declare function getColorMatrixShader(): ShaderHandle;
declare const Filters: {
    identityMatrix(): number[];
    grayscaleMatrix(): number[];
    sepiaMatrix(): number[];
    brightnessMatrix(value: number): number[];
    contrastMatrix(value: number): number[];
    saturationMatrix(value: number): number[];
    invertMatrix(): number[];
    getColorMatrixShader: typeof getColorMatrixShader;
    /**
     * Maps a 20-element (5x4 row-major) color matrix onto the shader's params:
     * four row vec4s plus the offset column. Apply with Material.setUniform.
     */
    colorMatrixUniforms(matrix: number[]): Record<string, number[]>;
};

/** The latest capture for one surface in one view. @experimental */
interface PlanarReflectionStatus {
    state: 'inactive' | 'budget-excluded' | 'unavailable' | 'ready';
    width?: number;
    height?: number;
    draws?: number;
    bytes?: number;
    rejected?: number;
    updated?: boolean;
}
/** A view is the camera that drew it: a game view is its runtime camera entity, the editor's own eye is EDITOR_VIEW_ENTITY,
 *  and 0 is a draw that named no camera. @experimental */
declare function planarReflectionStatus(app: App, entity: Entity, view?: Entity): PlanarReflectionStatus;
/** Refreshes an OnDemand capture through the same component mutation path as authoring. @experimental */
declare function refreshPlanarReflection(app: App, entity: Entity): void;

/**
 * @file    lightAim.ts
 * @brief   A light aims along its entity's forward.
 * @details Where a light points is its Transform's rotation, the same fact a
 *          camera's orientation is — so a light turns with its parent, a rotate
 *          gizmo aims it, and an animation track can swing it. Naming a direction
 *          instead is a way IN, and this is the one place on this side of the
 *          boundary that says which direction "no rotation" means; the engine's is
 *          `lightForward` in RenderFrame.cpp.
 */

/** The direction an unrotated light aims: into the screen, where a 2D scene's
 *  light has always come from. */
declare const LIGHT_FORWARD: Readonly<Vec3$2>;
/**
 * The rotation that aims a light along `aim` (any length; zero gives no turn).
 * Roll about the aim is left at none — a cone and parallel rays have nothing to
 * say about it.
 *
 * @experimental
 */
declare function lightAimRotation(aim: Vec3$2): Quat;
/**
 * Where a light with this rotation aims — the unit vector the engine lights along.
 *
 * @experimental
 */
declare function lightAimOf(rotation: Quat): Vec3$2;

/**
 * @file    spriteFilter.ts
 * @brief   Per-sprite filter effects using custom materials
 */

interface OutlineFilterOptions {
    color?: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    width?: number;
    texelSize?: {
        x: number;
        y: number;
    };
}
interface DropShadowFilterOptions {
    color?: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    offsetX?: number;
    offsetY?: number;
    blur?: number;
    texelSize?: {
        x: number;
        y: number;
    };
}
declare const SpriteFilter: {
    createOutline(options?: OutlineFilterOptions): MaterialHandle;
    createGlow(options?: OutlineFilterOptions): MaterialHandle;
    createDropShadow(options?: DropShadowFilterOptions): MaterialHandle;
    setOutlineColor(material: MaterialHandle, color: {
        r: number;
        g: number;
        b: number;
        a: number;
    }): void;
    setOutlineWidth(material: MaterialHandle, width: number): void;
    setShadowOffset(material: MaterialHandle, x: number, y: number): void;
    setShadowBlur(material: MaterialHandle, blur: number): void;
};

interface LineCmd {
    from: Vec2;
    to: Vec2;
    color: Color;
    thickness: number;
}
interface FillCmd {
    type: 'rect' | 'circle' | 'polygon';
    color: Color;
    x: number;
    y: number;
    width: number;
    height: number;
    radius?: number;
    segments?: number;
}
declare class Graphics {
    private path_;
    private lineColor_;
    private lineThickness_;
    private fillColor_;
    private filling_;
    lineCommands: LineCmd[];
    fillCommands: FillCmd[];
    get pathLength(): number;
    lineStyle(thickness: number, color: Color): void;
    beginFill(color: Color): void;
    endFill(): void;
    moveTo(x: number, y: number): void;
    lineTo(x: number, y: number): void;
    private addCurveSegments_;
    curveTo(cpx: number, cpy: number, x: number, y: number, segments?: number): void;
    cubicCurveTo(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number, segments?: number): void;
    arc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean, segments?: number): void;
    drawArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean, segments?: number): void;
    drawRect(x: number, y: number, width: number, height: number): void;
    drawRoundRect(x: number, y: number, width: number, height: number, radius: number): void;
    drawCircle(cx: number, cy: number, radius: number, segments?: number): void;
    drawEllipse(cx: number, cy: number, rw: number, rh: number, segments?: number): void;
    clear(): void;
    flush(): void;
}

declare const TextureFilter: {
    readonly Nearest: 0;
    readonly Linear: 1;
};
type TextureFilter = (typeof TextureFilter)[keyof typeof TextureFilter];
declare const TextureWrap: {
    readonly Repeat: 0;
    readonly ClampToEdge: 1;
    readonly MirroredRepeat: 2;
};
type TextureWrap = (typeof TextureWrap)[keyof typeof TextureWrap];
declare function setTextureFilter(textureId: number, filter: TextureFilter): void;
declare function setTextureWrap(textureId: number, wrap: TextureWrap): void;
declare function setTextureParams(textureId: number, minFilter: TextureFilter, magFilter: TextureFilter, wrapS: TextureWrap, wrapT: TextureWrap): void;
/**
 * The texture's 9-slice border, in texture pixels from each edge. A property of
 * the IMAGE — every `UIVisual` set to NineSlice reads it, so a frame is sliced
 * once at import rather than re-typed on every entity that uses it. Normally
 * applied by the asset pipeline at load; call it directly to re-slice a texture
 * already resident (an authoring tool editing the border live).
 */
declare function setTextureSliceBorder(textureId: number, left: number, right: number, top: number, bottom: number): void;

/**
 * A world transform as a column-major 4x4, from the TRS the engine resolved.
 *
 * One author for it, because more than one reader wants it in this form — a bake
 * collects it from the editor's world, and a tool collects it from a document —
 * and two transcriptions of a rotation matrix are two chances to transpose one.
 */
declare function composeTRS(p: {
    x: number;
    y: number;
    z: number;
}, q: {
    x: number;
    y: number;
    z: number;
    w: number;
}, s: {
    x: number;
    y: number;
    z: number;
}): number[];
/**
 * General 4x4 inverse (cofactor expansion). A singular matrix yields the
 * untouched `result` — callers treat that as "no inverse" rather than NaN.
 *
 * The view/projection builders above have exact inverses of their own; this is
 * for a matrix nobody can name, such as a composed view-projection.
 */
declare function invertMatrix4(m: Float32Array, result?: Float32Array): Float32Array;

interface ScreenRect {
    x: number;
    y: number;
    w: number;
    h: number;
}
declare function intersectRects(a: ScreenRect, b: ScreenRect): ScreenRect;
/**
 * The world-space ray a screen point names.
 *
 * @details Every plane it could land on gives a different answer, so the ray is
 *          what exists and a position is what a chosen plane yields. `dir` is a
 *          unit vector; `origin` sits on the near plane.
 */
interface WorldRay {
    origin: Vec3$2;
    dir: Vec3$2;
}
declare function screenRay(screenX: number, screenY: number, inverseVP: Float32Array, vpX: number, vpY: number, vpW: number, vpH: number): WorldRay;
/**
 * Where @p ray meets the plane through @p point with normal @p normal, or null
 * when the two are parallel — a plane the ray never reaches has no point on it,
 * and a number would be a position the caller did not ask about.
 */
declare function rayPlaneHit(ray: WorldRay, point: Vec3$2, normal: Vec3$2): Vec3$2 | null;
/**
 * Where a screen point lands on the world plane at @p planeZ.
 *
 * @details A screen point is a RAY, not a position. Orthographically the ray's
 *          x/y are constant along its length, which is why taking z = 0 worked
 *          and why every 2D caller can keep calling this unchanged. Under a
 *          perspective camera they are not constant, and the same call would
 *          answer with wherever the near plane happened to be — off by more the
 *          further the content sits from z = 0.
 *
 *          So the ray is intersected with the plane, which is one implementation
 *          with the orthographic case as its degenerate form rather than two
 *          branches that have to agree. `planeZ` defaults to the 2D plane, so a
 *          caller that has no depth in mind keeps getting the 2D answer.
 */
declare function screenToWorld(screenX: number, screenY: number, inverseVP: Float32Array, vpX: number, vpY: number, vpW: number, vpH: number, planeZ?: number): {
    x: number;
    y: number;
};
declare function pointInWorldRect(px: number, py: number, worldX: number, worldY: number, worldW: number, worldH: number, pivotX: number, pivotY: number): boolean;
declare function quaternionToAngle2D(rz: number, rw: number): number;
declare function pointInOBB(px: number, py: number, worldX: number, worldY: number, worldW: number, worldH: number, pivotX: number, pivotY: number, rotationZ: number, rotationW: number): boolean;

/**
 * The camera as a LENS — what a projection needs, and nothing about the surface.
 *
 * Narrower than {@link UICameraData} on purpose: it is the part two different
 * cameras can both supply, one being resolved and one already drawn with.
 * @beta
 */
interface CameraLens {
    viewProjection: Float32Array;
    vpX: number;
    vpY: number;
    vpW: number;
    vpH: number;
}
declare class CameraViewAPI {
    private readonly app_;
    private readonly lens_;
    private readonly invVPCache;
    /**
     * @param lens_ Which camera this view answers for. The default is the one
     *              being resolved — what a system inside the frame wants.
     *              Anything aligning to the PICTURE wants
     *              {@link PresentedCameraView}: the live one moves mid-frame and
     *              can hold a state no frame was drawn from.
     */
    constructor(app_: App, lens_?: (app: App) => CameraLens | null);
    private cam;
    /**
     * The live UI surface, for the two answers that are not projections.
     *
     * Where the pointer is and what box UI lays out within are facts about the
     * surface as it stands, not about a picture that was drawn — so they read
     * the live resource even on a view over the committed camera.
     */
    private surface;
    /**
     * Where a screen point lands on the world plane at @p planeZ.
     *
     * @p screenX / @p screenY are FRAMEBUFFER pixels, y growing up from the
     * bottom edge. For the pointer use {@link pointerToWorld}, which takes
     * `input.mouseX` / `input.mouseY` as they come.
     *
     * A screen point is a ray. Orthographically its x/y do not vary along it, so
     * the plane is irrelevant and the default answers for everyone. Under a
     * perspective camera it decides the answer, and the right plane is the one
     * the thing being hit or dragged actually sits on — z = 0 would place a
     * sprite at z = -400 wherever its shadow on the 2D plane happens to fall.
     */
    screenToWorld(screenX: number, screenY: number, planeZ?: number): {
        x: number;
        y: number;
    } | null;
    /**
     * Where the POINTER lands on the world plane at @p planeZ, taking the
     * coordinates {@link Input} reports (`input.mouseX` / `input.mouseY`, a
     * touch's x / y): CSS pixels, y down from the top.
     *
     * `screenToWorld` takes framebuffer pixels with y UP — what the renderer and
     * the editor viewport work in. Feeding it the pointer directly mirrors the
     * answer about the viewport's centre; this is the call a game wants.
     */
    pointerToWorld(pointerX: number, pointerY: number, planeZ?: number): {
        x: number;
        y: number;
    } | null;
    /** The world ray under the pointer, in {@link Input}'s coordinates — see {@link pointerToWorld}. */
    pointerRay(pointerX: number, pointerY: number): WorldRay | null;
    private pointerScreen;
    /**
     * The world ray a screen point names — what `screenToWorld` intersects with
     * the z plane. Callers that drag along an arbitrary plane (an editor moving
     * along a world axis, a pick against the ground) need the ray itself: a
     * z-keyed answer cannot express a plane that is not z-keyed.
     */
    screenRay(screenX: number, screenY: number): WorldRay | null;
    /**
     * Where the world point lands on screen — the inverse of `screenToWorld`,
     * taking the same third dimension. Under a perspective camera a point at
     * @p worldZ projects nowhere near its shadow on the 2D plane, so anything
     * drawing an overlay ON an entity (an outline, a gizmo, a screen rect) has to
     * pass the entity's z or it draws where the entity is not.
     *
     * Null means the point has NO screen position: no camera, or it stands at or
     * behind the eye, where the divide mirrors it to the far side of the view.
     * Outside the viewport is NOT that, and keeps its coordinates.
     */
    worldToScreen(worldX: number, worldY: number, worldZ?: number): {
        x: number;
        y: number;
    } | null;
    /**
     * The part of segment @p a → @p b that can be drawn, cut at the near plane.
     *
     * @details One end behind the eye still leaves a visible part, and dropping the
     *          whole segment is what makes a wireframe come apart as the eye moves
     *          into it. Null when none of it is in front.
     */
    clipSegment(a: Vec3$2, b: Vec3$2): {
        a: Vec3$2;
        b: Vec3$2;
    } | null;
    /**
     * Where a world DIRECTION points on screen at @p at — px per world unit, y-up.
     *
     * @details Null when @p at has no projection. Perspective makes this a fact
     *          about the POINT: an arm drawn on something asks here, where a basis
     *          read off the camera answers only for the centre of the view.
     */
    projectDirectionAt(at: Vec3$2, dir: Vec3$2): {
        x: number;
        y: number;
    } | null;
    getWorldMousePosition(): {
        x: number;
        y: number;
    } | null;
    getWorldBounds(): {
        left: number;
        right: number;
        bottom: number;
        top: number;
    } | null;
}
/**
 * Per-App camera-query API resource, published by `cameraPlugin` on every core
 * (web and native alike). Read it as
 * `app.getResource(CameraView)` to convert screen<->world etc. (Named
 * `CameraView` rather than `Camera` because `Camera` is the ECS component.)
 */
declare const CameraView: ResourceDef<CameraViewAPI>;
/**
 * The same queries, against the camera the last frame was actually drawn with.
 *
 * One implementation, two sources: a second projection written over the commit
 * would be a second near-plane cut to keep in step, and a wireframe cut by one
 * and drawn by the other comes apart exactly where a segment leaves the view.
 * @beta
 */
declare const PresentedCameraView: ResourceDef<CameraViewAPI>;
/** A view over the camera the last frame was drawn with. @beta */
declare const presentedCameraView: (app: App) => CameraViewAPI;

/** @beta */
interface CameraCommitData {
    /** The {@link UICameraData.revision} this frame was drawn with; 0 = none. */
    revision: number;
    /** The view-projection that drew it — a copy, not the live resource's array. */
    viewProjection: Float32Array;
    /** Where the picture landed, in window pixels. */
    vpX: number;
    vpY: number;
    vpW: number;
    vpH: number;
    /** False until a frame has been drawn with a camera at all. */
    valid: boolean;
}
/**
 * Told when the committed camera CHANGES — not when one is published.
 *
 * A commit happens on every drawn frame, so "a commit happened" says nothing
 * about what is on screen. Told the other question instead: looking for it on a
 * clock of one's own is a poll that never sleeps, or a change that lands late.
 * @beta
 */
type CameraCommitListener = () => void;
/** Subscribe to committed-camera changes. Returns an unsubscribe. @beta */
declare function onCameraCommitChanged(fn: CameraCommitListener): () => void;
/** Announce a change. Called by the camera plugin, after the submit. @beta */
declare function cameraCommitChanged(): void;
/** The last drawn camera, as a resource. @beta */
declare const CameraCommit: ResourceDef<CameraCommitData>;

interface EditorViewData {
    /** When true, the framebuffer + screen<->world use this view, not scene cameras. */
    active: boolean;
    /** World-space point the view looks at and turns around. */
    x: number;
    y: number;
    /** Depth of that point. Zero is the 2D plane, where a project that never
     *  leaves it stays. */
    z: number;
    /** Half-height of the view in world units (zoom; smaller = more zoomed in). */
    orthoSize: number;
    /**
     * `false` (default) is the 2D view: an orthographic projection where zoom is
     * `orthoSize` and depth cannot be seen. `true` previews the scene the way a
     * perspective game camera would — the only way to look at 2.5D content while
     * authoring it.
     *
     * The view keeps its OWN projection rather than following the scene's camera,
     * which is the same choice UE and Unity make: an orthographic view of a
     * perspective scene is a working mode (a top-down or side elevation), not a
     * mismatch to be corrected. What the game will look like is the Game view's
     * job; this is the editor's own eye.
     */
    perspective: boolean;
    /** Vertical field of view in degrees, used only when `perspective`. */
    fov: number;
    /**
     * Camera distance along +z, used only when `perspective`. This is what zoom
     * moves in that mode — a perspective view cannot zoom by widening a box, and
     * changing the fov instead would alter the projection the user is previewing.
     */
    distance: number;
    /**
     * Where the eye stands relative to the focus (x, y): yaw about world +Y, pitch
     * above the xz plane, in DEGREES like `fov`. Both zero is the head-on 2D view,
     * and every 2D projection stays exactly what it was there — orbiting is what a
     * 3D scene needs to be looked at, not a different camera.
     */
    yaw: number;
    pitch: number;
    /**
     * Aspect ratio the editor lays UI out against, so the editor previews how UI adapts
     * on a simulated device: `> 0` fits the design resolution into this aspect (the device
     * simulator), `0` uses the authored design aspect — WYSIWYG at the design resolution.
     * Editor-only; scene cameras (shipped games) ignore it. See uiLayoutRect.
     */
    uiPreviewAspect: number;
}
declare const DEFAULT_EDITOR_VIEW: EditorViewData;
/**
 * Half-height, in world units, of what the view sees on the z = 0 plane — where
 * 2D content lives and where the grid, the framing and the minimap all measure.
 *
 * Orthographically this IS `orthoSize`. In perspective the visible extent is the
 * frustum's cross-section at the focus plane, `tan(fov/2) · distance` — merely
 * proportional to the zoom value, not equal to it. Everything that needs "how
 * much world is on screen" asks here rather than reading `orthoSize`, which
 * answers for one of the two projections and silently mis-scales the other.
 */
declare function editorViewHalfHeight(view: EditorViewData): number;
/** {@link editorViewHalfHeight} with the panel aspect applied — the visible world rect. */
declare function editorViewHalfExtent(view: EditorViewData, aspect: number): {
    halfW: number;
    halfH: number;
};
/**
 * World units per screen pixel at @p at — what a thing drawn at a fixed number of
 * pixels measures in the world where it stands. Orthographically the same
 * everywhere; in perspective it grows with the distance along the view axis, which
 * is the axis the projection divides by. Without @p at, the focus answers.
 */
declare function editorViewWorldPerPixel(view: EditorViewData, heightPx: number, at?: Vec3$2): number;
/**
 * Zoom the view until it sees @p halfH world units of height, writing whichever
 * field this projection zooms with. The inverse of {@link editorViewHalfHeight},
 * so "frame this" and "how big is what I see" cannot disagree.
 */
declare function setEditorViewHalfHeight(view: EditorViewData, halfH: number): void;
declare const EditorView: ResourceDef<EditorViewData>;
/**
 * True when the view is turned away from the head-on 2D one. Absent angles read
 * as zero: a workspace saved before this existed, or a partial view an embedder
 * hands in, is the 2D view — not an orbit by NaN.
 */
declare function editorViewIsOrbited(view: EditorViewData): boolean;
/** A world axis as it points on screen: a unit direction (y down, as screens are)
 *  plus how far it leans toward the eye — `1` straight at it, `-1` straight away. */
interface ScreenAxis {
    dx: number;
    dy: number;
    depth: number;
}
/**
 * Where the world axes point on screen for this view. Read off the very basis the
 * camera is built from, so an indicator drawn from it cannot disagree with what is
 * rendered — a second copy of the rotation is exactly how those two drift apart.
 */
declare function editorViewAxes(view: EditorViewData): {
    x: ScreenAxis;
    y: ScreenAxis;
    z: ScreenAxis;
};
/** The view's own axes as world directions — unit, and right-handed with forward. */
interface EditorViewBasis {
    right: Vec3$2;
    up: Vec3$2;
    forward: Vec3$2;
}
/**
 * Where the view's right / up / forward point in the world.
 *
 * A drag is a screen direction, and this is what it means in world terms. Read
 * off the very matrix the camera is built from, so navigation cannot move along
 * axes the picture was not drawn with.
 */
declare function editorViewBasis(view: EditorViewData): EditorViewBasis;
/**
 * How far the eye stands off the focus. A perspective eye has to stand
 * somewhere, and so does an orbited orthographic one; head-on 2D does not.
 */
declare function editorViewStandoff(view: EditorViewData): number;
/**
 * How far the view's volume reaches, from the EYE — which stands off what it is
 * looking at, and spends that stand-off before the scene begins. So the reach past
 * the focus is constant and the stand-off is added to it; a head-on orthographic
 * eye, which has none, is left with exactly the reach it always had.
 */
declare function editorViewClipFar(view: EditorViewData): number;
/**
 * Where the volume begins, from the eye. Zero orthographically — that projection
 * builds a symmetric box and ignores it. Depth resolution goes as distance² over
 * near, and the stand-off IS the distance, so how close the near plane may sit is
 * a question about the zoom. The floor is what answers at a close-up eye.
 */
declare function editorViewClipNear(view: EditorViewData): number;
/** Where the eye stands in world space. */
declare function editorViewEye(view: EditorViewData): Vec3$2;
/**
 * Move the focus by an offset in the view's OWN axes, in world units.
 *
 * Every navigation that is not a turn is this: a drag, a zoom about the cursor,
 * a dolly. Expressing them here is what keeps them from each picking a world
 * plane of their own, which is only the same answer while the eye is head-on.
 */
declare function moveEditorViewFocus(view: EditorViewData, right: number, up: number, forward?: number): void;
/**
 * How much of the screen's two axes an axis-aligned box of half-size @p half
 * covers, in world units — what "fit this in the frame" has to measure.
 */
declare function editorViewBoxExtent(view: EditorViewData, half: Vec3$2): {
    right: number;
    up: number;
};
/** A world axis, as an index into (x, y, z). */
type WorldAxis = 0 | 1 | 2;
/** The world plane a view works on, through the origin: the two axes that run in
 *  it, and the one it is normal to. */
interface EditorWorkPlane {
    u: WorldAxis;
    v: WorldAxis;
    normal: WorldAxis;
}
/**
 * The plane this view is ABOUT: the ground under a 3D scene (perspective is the
 * editor's word for looking at one), the plane 2D content lives on otherwise.
 *
 * Answered by the view alone, at every angle — what the GRID draws. A grid is the
 * frame the eye judges the scene against, so one that changes plane partway
 * through an orbit moves the frame itself; edge-on it converges into the horizon
 * and the shader's fade takes it.
 */
declare function editorViewGridPlane(view: EditorViewData): EditorWorkPlane;
/**
 * The plane a GESTURE acts on: {@link editorViewGridPlane}, handed over to the
 * plane the eye most faces where it would otherwise look along it — a drag on a
 * plane seen edge-on turns a pixel of cursor travel into unbounded world motion.
 * Input only; the grid asks the other one.
 */
declare function editorViewWorkPlane(view: EditorViewData): EditorWorkPlane;
/**
 * The work-plane axis a screen direction names, with the sign pointing that way —
 * what "right" and "up" mean for a gesture on that plane. `right` resolves first
 * and `up` takes the plane's other axis, so the pair is never one axis twice.
 * Head-on: +X right, +Y up.
 */
declare function screenWorkAxes(view: EditorViewData): {
    right: {
        axis: WorldAxis;
        sign: number;
    };
    up: {
        axis: WorldAxis;
        sign: number;
    };
};
/** A world axis as a unit vector. */
declare function worldAxisVector(axis: WorldAxis): Vec3$2;
/**
 * Yaw/pitch that put the eye on a world axis, looking back down it — the standard
 * views (front, side, top) every DCC offers. `sign` picks which end of the axis the
 * eye stands on.
 */
declare function editorViewAxisAngles(axis: 'x' | 'y' | 'z', sign: 1 | -1): {
    yaw: number;
    pitch: number;
};

/**
 * @file    environmentLight.ts
 * @brief   Which Ambient light is a scene's environment.
 *
 * @details The frame decides this in RenderFrame.cpp: the first active Light that is
 *          enabled, has intensity, is Ambient and names an environment the registry
 *          holds. A bake has to take the same light's sky, and an editor has to say
 *          which light that is and why the others lose — three readers of one rule,
 *          so the document-side reading is this one function, beside `bakeLightOf`
 *          which fills defaults the same way. The C++ rule is the authority; this
 *          mirrors it over a scene document, so a change to one is a change to both.
 */
/** The slice of a scene entity this reads. */
interface EnvironmentLightEntity {
    id: number;
    name: string;
    /** Absent is visible. */
    visible?: boolean;
    components: ReadonlyArray<{
        type: string;
        data: Record<string, unknown>;
    }>;
}
/** Why the frame passes over an Ambient light, or null when it is in play. */
type AmbientSkip = 'hidden' | 'disabled' | 'no-intensity';
/** One Ambient light, as the scene document states it with the component's defaults filled in. */
interface SceneAmbientLight {
    entityId: number;
    name: string;
    skipped: AmbientSkip | null;
    /** The environment it names, as written, or null when it names none. */
    environment: string | null;
    /** It names one the project does not hold. */
    environmentMissing: boolean;
    drawEnvironment: boolean;
    /** Degrees about +Y. */
    rotation: number;
    intensity: number;
}
/**
 * Every Ambient light in a scene, in document order.
 *
 * @param exists Whether the project holds the asset a light names. The frame cannot
 *        use an environment it cannot load, and it moves on to the next light.
 */
declare function sceneAmbientLights(entities: readonly EnvironmentLightEntity[], exists: (ref: string) => boolean): SceneAmbientLight[];
/** An Ambient light the frame could take the environment from. */
declare function carriesEnvironment(light: SceneAmbientLight): boolean;
/**
 * The light whose environment the frame uses, and the lights that name one but lose to it.
 * Nothing is removed from the scene to settle it: a shadowed light is kept, and said so.
 */
declare function sceneEnvironment(lights: readonly SceneAmbientLight[]): {
    effective: SceneAmbientLight | null;
    shadowed: SceneAmbientLight[];
};

type EditorLightingMode = 'scene' | 'studio';
interface EditorViewLightingData {
    mode: EditorLightingMode;
    /** Degrees about +Y that the key and the fill turn together. */
    rotation: number;
    keyIntensity: number;
    fillIntensity: number;
    /** Scales the neutral sky. Never the scene's Ambient: that light is not consulted. */
    skyIntensity: number;
    /** Draw the scene's environment as the background while studio-lit. */
    showSky: boolean;
    /** Preview exposure in stops, independent of the mode. 0 is exact identity. */
    exposure: number;
}
declare const DEFAULT_EDITOR_VIEW_LIGHTING: EditorViewLightingData;
declare const EDITOR_EXPOSURE_RANGE: {
    readonly min: -6;
    readonly max: 6;
};
declare const EditorViewLighting: ResourceDef<EditorViewLightingData>;
/** True when the view differs from the game's own settings in any way. */
declare function editorViewLightingIsOverriding(data: EditorViewLightingData): boolean;
/** The game's own settings: studio off and exposure at zero. The rig's tuning is kept. */
declare function resetEditorViewLighting(data: EditorViewLightingData): EditorViewLightingData;
/** The numbers the engine setters take, so the push and its tests share one reading. */
declare function editorViewLightingArgs(data: EditorViewLightingData, viewActive: boolean): {
    mode: number;
    rotation: number;
    key: number;
    fill: number;
    sky: number;
    showSky: boolean;
    exposure: number;
};
type SkyUnavailable = 'no-ambient' | 'no-environment' | 'missing' | 'off' | 'unusable';
type SceneDark = 'no-lights' | 'no-enabled-light';
/** What a scene gives the studio preview to say about itself. */
interface StudioPreviewReport {
    /** Non-Ambient lights that are visible, enabled and have intensity. */
    sceneLights: number;
    /** The environment the scene's own frame would use, or null. */
    environment: SceneAmbientLight | null;
    /** Why there is no environment to show as a sky, or null when there is one. */
    skyUnavailable: SkyUnavailable | null;
    /** Why the scene alone would read dark, or null when it has light. */
    sceneDark: SceneDark | null;
}
/**
 * The actual reasons, read from the scene document: nothing here guesses at what the
 * engine did. The Lighting panel uses it to say why a toggle is disabled or why the
 * scene looks dark without the studio.
 */
declare function studioPreviewReport(entities: readonly EnvironmentLightEntity[], exists: (ref: string) => boolean): StudioPreviewReport;

/**
 * Memory-safety model for this module
 * -----------------------------------
 *
 * Every function here reads from WASM-owned memory and returns values the
 * caller may hold across later frames. To stay safe when WASM memory grows
 * or the renderer reuses its capture buffer, we never return a typed array
 * that views the WASM heap — we copy primitives into fresh JS objects /
 * buffers before returning.
 *
 *   - decodeFrameCapture copies every field out as plain `number`s and
 *     numeric arrays. The intermediate `DataView` and `Uint32Array` views
 *     are local and dropped as soon as the function returns.
 *   - getSnapshotImageData reads pixel rows from the heap view into a
 *     freshly-allocated `Uint8ClampedArray` ("flipped") and wraps that
 *     JS-owned buffer in the returned ImageData.
 *
 * Do NOT "optimize" either function by returning a heap-backed typed array
 * directly — a subsequent WASM alloc/grow would detach it or the renderer
 * would overwrite the bytes on the next capture, handing the caller silent
 * corruption.
 */
/**
 * Why a draw call started rather than joining the one before it. Mirrors the
 * engine's BatchBreak; each member is a condition the merge itself tests.
 */
declare enum BatchBreak {
    None = 0,
    RunStart = 1,
    Instanced = 2,
    Shader = 3,
    Blend = 4,
    Layout = 5,
    Material = 6,
    Depth = 7,
    Cull = 8,
    State = 9,
    Scissor = 10,
    Stencil = 11,
    IndexGap = 12,
    TextureSlots = 13
}
declare enum RenderType {
    Sprite = 0,
    Spine = 1,
    Mesh = 2,
    ExternalMesh = 3,
    Text = 4,
    Particle = 5,
    Shape = 6,
    UIElement = 7
}
/** What a pass of the frame draws: a camera's scene, or the screen-space overlay. */
declare enum CapturePass {
    Scene = 0,
    Overlay = 1
}
interface DrawCallInfo {
    index: number;
    /** Which pass of the frame drew it, in the order the passes ran. */
    pass: number;
    passKind: CapturePass;
    stage: number;
    type: RenderType;
    blendMode: number;
    textureId: number;
    materialId: number;
    shaderId: number;
    indexCount: number;
    /** 0 for a draw that is not instanced. */
    instanceCount: number;
    triangleCount: number;
    layer: number;
    breakReason: BatchBreak;
    scissorX: number;
    scissorY: number;
    scissorW: number;
    scissorH: number;
    scissorEnabled: boolean;
    stencilWrite: boolean;
    stencilTest: boolean;
    stencilRef: number;
    textureSlotUsage: number;
    /** Every texture the draw bound, slot 0 first; `textureId` is the first. */
    textures: number[];
    /** The entities the draw was made from, in draw order; an item with no entity
     *  (a glyph run, a gizmo) is not listed. */
    entities: number[];
}
interface FrameCaptureData {
    drawCalls: DrawCallInfo[];
    passCount: number;
}
/**
 * What capture asks of the engine: the wasm module, which hands out addresses in
 * its heap, or a native host's surface, which copies into a buffer allocated in
 * its heap arena — its script cannot read engine memory directly.
 */
interface CaptureEngine {
    HEAPU8: Uint8Array;
    _malloc?(bytes: number): number;
    _free?(offset: number): void;
    renderer_captureNextFrame(): void;
    renderer_hasCapturedData(): boolean;
    renderer_getCapturedFrameSize(): number;
    renderer_getCapturedEntityCount(): number;
    renderer_getCapturedTextureCount(): number;
    renderer_getCapturedPassCount(): number;
    renderer_getCapturedFrameData?(): number;
    renderer_getCapturedEntities?(): number;
    renderer_getCapturedTextures?(): number;
    renderer_copyCapturedRecords?(dest: number, destSize: number): boolean;
    renderer_copyCapturedEntities?(dest: number, destSize: number): boolean;
    renderer_copyCapturedTextures?(dest: number, destSize: number): boolean;
    renderer_replayToDrawCall(drawCallIndex: number): void;
    renderer_snapshotMatchesCapture(): boolean;
    renderer_pollSnapshotReadback(): number;
    renderer_getSnapshotPtr?(): number;
    renderer_getSnapshotSize(): number;
    renderer_getSnapshotWidth(): number;
    renderer_getSnapshotHeight(): number;
    renderer_copySnapshot?(dest: number, destSize: number): boolean;
}
/** A frame renders before this resolves: a live loop's next animation frame, or a driver's step. */
type NextFrame = () => Promise<void>;
/**
 * Captures the next whole frame, every pass of it. Null when @p maxFrames frames
 * rendered and none of them drew anything.
 */
declare function captureFrame(module: CaptureEngine, nextFrame: NextFrame, maxFrames?: number): Promise<FrameCaptureData | null>;
interface ReplaySnapshot {
    image: ImageData;
    /** See {@link snapshotMatchesCapture}. */
    matchesCapture: boolean;
}
/** The captured frame's pass, drawn up to and including draw @p drawCallIndex. */
declare function replayDraw(module: CaptureEngine, drawCallIndex: number, nextFrame: NextFrame, maxFrames?: number): Promise<ReplaySnapshot | null>;

/**
 * @file    refusals.ts
 * @brief   The engine's refusal codes as the words a reader gets.
 *
 * Indexed by the number the engine writes, in the order of its enums
 * (LightRefusal in LightPlan.hpp, the atlas refusal in ShadowPlan). The web and
 * native backends read the same codes, so they read them through one table.
 */
/** Why a light did not reach the frame. */
declare const LIGHT_REFUSAL: readonly ["none", "capacity", "no-environment-sun"];
/** Why a shadow caster got fewer tiles than it asked for. */
declare const ATLAS_REFUSAL: readonly ["none", "tile-budget", "tile-too-large", "atlas-full"];

declare enum RenderStage {
    Background = 0,
    Opaque = 1,
    Transparent = 2,
    Overlay = 3
}
type RenderTargetHandle = number;
interface RenderStats {
    /** The draws of the scene's and the overlay's lists, after batching: what the draw calls a frame debugger lists add up to. */
    drawCalls: number;
    /**
     * Every draw the GPU was asked for, every pass included: shadow maps, the depth prepass, reflections, motion vectors and post-processing as well as
     * the scene. This is the number a draw call budget is held to.
     */
    gpuDraws: number;
    triangles: number;
    sprites: number;
    text: number;
    skeletal: number;
    meshes: number;
    culled: number;
}
/**
 * What the shadow atlas gave one caster last frame. @experimental
 *
 * `granted` below `requested` and above zero is a REDUCTION: a sun that kept two
 * cascades of four still casts, and calling that a rejection would throw away the
 * distinction the frame records it for. Zero granted is a denial.
 */
interface ShadowStatus {
    /** Tiles asked for: a cascade set, a cube's six faces, or one. */
    requested: number;
    /** Tiles kept. 0 means this light casts no shadow at all this frame. */
    granted: number;
    /**
     * Why it did not get what it asked for. Three answers, not one: only
     * `atlas-full` is fixed by a bigger atlas, and `tile-budget` is the shader's
     * array bound, which no size changes.
     */
    refusal: (typeof ATLAS_REFUSAL)[number];
    /** Casters the frame denied outright, for a reader that wants the total. */
    deniedCasters: number;
    /** Casters that kept fewer tiles than they asked for. */
    reducedCasters: number;
}
/**
 * What the light cap did to one light last frame, and what it did overall.
 * @experimental
 *
 * `accepted` false comes with the reason beside it: the cap logged a COUNT and
 * dropped the rest, so which light went dark was a question only deleting lights
 * could answer.
 */
interface LightStatus {
    accepted: boolean;
    /** Why not, when `accepted` is false; `none` otherwise. */
    refusal: (typeof LIGHT_REFUSAL)[number];
    /** The shader's array bound — what `accepted` lights can never exceed. */
    limit: number;
    /** Lights that asked this frame. */
    requested: number;
    /** How many the frame turned away, for a reader that wants the total. */
    refusedCount: number;
    /** Where the environment's sun shone this frame, when a light followed it —
     *  the aim such a light takes instead of its Transform's. */
    environmentSunAim: [number, number, number] | null;
}
/**
 * What a view decided about one object's level, read back from where the decision
 * was made. @experimental
 *
 * Never recomputed by a reader: the whole point of carrying `unbiased` is that an
 * explanation of a level has to be the frame's own, and a second selector written
 * beside this one would be free to disagree with the picture on screen.
 */
/** How a view shades its meshes. @experimental */
/** `directLighting` / `indirectLighting`: clay lit by the lights alone, or by everything that is not a light (ambient,
 *  sky, reflections, probes, bakes) — Unreal's lighting components, for asking where a shadow's fill comes from. */
type ViewShading = 'shaded' | 'clay' | 'albedo' | 'wireframe' | 'directLighting' | 'indirectLighting';
interface LodDecision {
    /** The level drawn, or `null` when the object was small enough to be culled. */
    level: number | null;
    /** What the bare thresholds ask for with no memory behind them; differing from
     *  `level` is hysteresis holding the coarser (or finer) side. */
    unbiased: number | null;
    /** Stand-ins the group actually reaches — levels beyond it do not exist. */
    levels: number;
    /** Fraction of the viewport HEIGHT the object covered when it was measured. */
    screenSize: number;
}
/** GPU device status, mirroring the engine's `GfxDeviceStatus`. */
declare const DeviceStatus: {
    readonly Live: 0;
    readonly Lost: 1;
    readonly Recovering: 2;
    readonly Dead: 3;
};
/** Why a device was lost, mirroring the engine's `GfxDeviceLostReason`. */
declare const DeviceLostReason: {
    readonly Unknown: 0;
    readonly ContextLost: 1;
    readonly OutOfMemory: 2;
    readonly Reset: 3;
    readonly Removed: 4;
    readonly Destroyed: 5;
    readonly Validation: 6;
    readonly Internal: 7;
};
/**
 * Whether the GPU device can still be drawn to.
 *
 * Reports `Live` when the core cannot answer — an older wasm build, or a native
 * backend with no heap to marshal. Treating "cannot tell" as a loss would black
 * out every host predating this call.
 */
declare function getDeviceStatus(): number;
/** The engine's one-line loss report (backend, GPU, driver, reason); empty while live. */
declare function getDeviceLostReport(): string;
/** Who the device is. */
interface DeviceIdentity {
    backend: string;
    vendor: string;
    renderer: string;
    /** Driver / API version string, as the driver spells it. */
    version: string;
}
/**
 * The GPU this session is running on, readable WHILE it works.
 *
 * The engine captured this at init all along — a lost backend cannot be asked
 * who it was — but it could only be read off a loss report, so a healthy session
 * could not say which GPU it had. Null before a device exists.
 */
declare function getDeviceIdentity(source?: ESEngineModule | null): DeviceIdentity | null;
/**
 * Tell the engine about a loss the host observed.
 *
 * The browser reports context loss to JS, not to wasm, so without this the core
 * keeps submitting until its own next poll notices.
 */
declare function reportDeviceLost(reason: number, message: string): void;
/**
 * What the loss guard actually did — where it attached, and how many events it
 * has seen. An observation point, because every inference about this has been
 * wrong and only direct measurement has held.
 */
declare function getContextLossGuardInfo(): {
    target: string;
    lostEventsSeen: number;
};
/**
 * Ask the engine to rebuild the device and every object it issued, behind the
 * same handles.
 *
 * False means "not yet": a browser hands a WebGL context back when it is ready.
 * The device then draws while Recovering and turns Live once nothing is owed.
 */
declare function recoverDevice(): boolean;
/**
 * Which generation of the GPU device is current; every rebuild advances it.
 * 0 where the core cannot answer.
 */
declare function deviceGeneration(): number;
/** Told that the device came back, with the generation it came back as. */
type DeviceRestoredListener = (generation: number) => void;
/**
 * Called after the device has been rebuilt AND refilled — everything the GPU held
 * is new storage, so content the game drew itself (a render texture) is blank
 * until it is drawn again. Returns the unsubscribe.
 */
declare function onDeviceRestored(listener: DeviceRestoredListener): () => void;
declare function shutdownRendererAPI(): void;
declare const Renderer: {
    init(width: number, height: number): void;
    resize(width: number, height: number): void;
    beginFrame(elapsedSec?: number): void;
    setOrigin(x: number, y: number, z: number): void;
    updateTransforms(registry: {
        _cpp: CppRegistry;
    }): void;
    /**
     * Begins the pass. The clear rides begin as a load-op: `clearFlags` bit 0 =
     * color, bit 1 = depth; `clearColor` is the color value; `clearRect` scopes the
     * clear to a viewport region (omitted = the whole target). No flags = load.
     */
    begin(viewProjection: Float32Array, target?: RenderTargetHandle, clearFlags?: number, clearColor?: {
        x: number;
        y: number;
        z: number;
        w: number;
    }, clearRect?: {
        x: number;
        y: number;
        w: number;
        h: number;
    }): void;
    flush(): void;
    end(): void;
    /** Closes the frame — after every camera, after the screen post stack, and
     *  after the overlay. See RendererBackend.endFrame. */
    endFrame(): void;
    /** Whether the core can draw the frame's screen overlay. */
    hasScreenOverlay(): boolean;
    beginScreenOverlay(projection: Float32Array, vpX: number, vpY: number, vpW: number, vpH: number): void;
    submitScreenOverlay(registry: {
        _cpp: CppRegistry;
    }): void;
    endScreenOverlay(target?: RenderTargetHandle): void;
    submitAll(registry: {
        _cpp: CppRegistry;
    }, vpX: number, vpY: number, vpW: number, vpH: number): void;
    setStage(stage: RenderStage): void;
    createRenderTarget(width: number, height: number, flags?: number): RenderTargetHandle;
    releaseRenderTarget(handle: RenderTargetHandle): void;
    getTargetTexture(handle: RenderTargetHandle): number;
    getTargetDepthTexture(handle: RenderTargetHandle): number;
    setClearColor(r: number, g: number, b: number, a: number): void;
    setViewport(x: number, y: number, w: number, h: number): void;
    /** Layers (bits 0..31) that sort by world Y within the layer — top-down occlusion. */
    setYSortLayers(mask: number): void;
    /**
     * Layers (bits 0..31) that resolve their contents by the depth buffer instead
     * of paint order — the 2.5D opt-in. Opaque draws (blend mode None) in such a
     * layer write depth and occlude whatever is behind them whatever order they
     * were drawn in; blended ones test without writing and stay back-to-front. A
     * layer that also y-sorts keeps y-sorting (see `layerOrderOf`).
     *
     * The live twin of the `depthLayers` app option, so an editor can apply the
     * project setting to a running view without rebooting the realm.
     */
    setDepthLayers(mask: number): void;
    /**
     * Layers (bits 0..31) whose draws are painted in hierarchy order: a sprite, a label and a shape stack as their entities do in the tree
     * (a preorder walk), instead of by shader and depth. The order a scene of nodes has in an authoring tool, and the one in which a panel
     * covers the text of the panel under it.
     */
    setTreeSortLayers(mask: number): void;
    /**
     * Sorting layers (bits 0..31) the NEXT collect draws — `Camera.cullingMask`.
     * Set per camera before submitting it; a layer with no bit (outside 0..31) is
     * drawn by every camera.
     */
    setCullingMask(mask: number): void;
    /**
     * Names the view the NEXT collect looks from — the camera entity, so a level
     * chosen by how big something looks is remembered per camera. Set per camera
     * before submitting it; 0 is the shared default view.
     */
    setViewId(view: number): void;
    /**
     * What @p view decided about `entity`'s LOD last time it drew it, or null when
     * that view has not measured it — off screen, or carrying no LODGroup, which
     * is not the same as measuring it at level 0. @experimental
     */
    lodInspect(view: number, entity: number): LodDecision | null;
    /**
     * Show `level` for `entity` in `view` instead of the level that view chose;
     * `null` goes back to choosing. @experimental
     *
     * View state, never component state: a group is authored policy and reads the
     * same everywhere. The choice goes on being made underneath, so leaving a
     * preview obeys the selector again rather than resuming from what was held up.
     */
    setLodPreview(view: number, entity: number, level: number | null): void;
    /**
     * Shade `view`'s meshes as `mode` says instead of as authored. @experimental
     *
     * View state, like a LOD preview. Clay is one neutral lit surface, albedo the base
     * colour with no light, wireframe a dark surface with its edges; a shadow map is
     * unaffected and a host that predates the mode ignores the call.
     */
    setViewShading(view: number, mode: ViewShading): void;
    /**
     * Give meshes loaded from now on an edge buffer, which a wireframe view draws. @experimental
     *
     * A second index buffer per mesh, so off unless an editor asks, and asked before the
     * assets load: a mesh realized earlier has none and is drawn as a plain surface.
     */
    setMeshEdgeBuffers(enabled: boolean): void;
    /**
     * Colour one skinned entity in `view` by how much a joint moves each of its vertices;
     * `null` stops. @experimental
     *
     * `joint` is an index into the mesh's own bind matrices, the order its joint channel
     * uses. View state like the shading beside it: the same entity drawn through another
     * view keeps its look.
     */
    setViewSkinWeights(view: number, entity: number | null, joint?: number): void;
    /**
     * What the light cap did to `entity` last frame, or null before any frame has
     * collected lights. @experimental
     *
     * Read back rather than derived: a reader working out which lights were
     * dropped by taking the tail of a list would be a second cap, agreeing with
     * the frame only until either sorted differently.
     */
    lightStatus(entity: number): LightStatus | null;
    /**
     * What the shadow atlas gave `entity` last frame, or null when it asked the
     * atlas for nothing. @experimental
     */
    shadowStatus(entity: number): ShadowStatus | null;
    setTextureParams(textureId: number, minFilter: number, magFilter: number, wrapS: number, wrapT: number): void;
    measureBitmapText(fontHandle: number, text: string, fontSize: number, spacing: number): {
        width: number;
        height: number;
    };
    getStats(): RenderStats;
    captureNextFrame(): void;
    getCapturedData(): FrameCaptureData | null;
    hasCapturedData(): boolean;
    replayToDrawCall(drawCallIndex: number): void;
    /** Resolves with the replay snapshot once its async readback lands (see frameCapture). */
    getSnapshotImageData(): Promise<ImageData | null>;
    snapshotMatchesCapture(): boolean;
};

interface EditorViewShadingData {
    mode: ViewShading;
    /** The one skinned entity to colour by a joint's weights, and the joint (an index into its bind matrices). */
    weights: {
        entity: number;
        joint: number;
    } | null;
}
declare const DEFAULT_EDITOR_VIEW_SHADING: EditorViewShadingData;
declare const EditorViewShading: ResourceDef<EditorViewShadingData>;
/** The mode the engine is to use: an inactive view (play mode, a shipped game) carries no override. */
declare function editorViewShadingMode(data: EditorViewShadingData, viewActive: boolean): ViewShading;

type GridColor = [number, number, number, number];
interface EditorGridData {
    /** When true (editor only), the grid renderer draws the grid this frame. */
    enabled: boolean;
    /** Minor grid line spacing, world units. */
    spacing: number;
    /** Every Nth line is drawn as a heavier major line. */
    majorEvery: number;
    /** Minor line color. */
    color: GridColor;
    /** Major line color. */
    majorColor: GridColor;
    /** One color per world axis, indexed the way a WorldAxis is: x, y, z. Which two
     *  get drawn is the work plane's answer, not this resource's. */
    axisColors: [GridColor, GridColor, GridColor];
}
declare const DEFAULT_EDITOR_GRID: EditorGridData;
declare const EditorGrid: ResourceDef<EditorGridData>;

/**
 * @file    editorGridRenderer.ts
 * @brief   Infinite world-space editor grid, drawn on the plane the view is about.
 *
 * `installEditorGrid(app)` registers a pre-scene draw callback (see customDraw /
 * RenderPipeline): each editor frame, when `EditorGrid.enabled` and the
 * `EditorView` is active, it draws one full-screen quad whose fragment shader
 * intersects that pixel's world ray with the plane the view is about
 * (`editorViewGridPlane` — the ground in a 3D view, the 2D plane in a flat one,
 * at every angle) and paints minor / major / axis lines there. Because it runs in
 * the pre-scene pass, scene entities draw over it (UE5 / Unity behaviour).
 *
 * The ray is built from the view's own basis rather than from a matrix inverse:
 * four vec4 params carry the eye, the two screen axes scaled to what the view
 * sees, and the forward reach, and one `w` flag decides whether a screen offset
 * moves the ray's origin (orthographic) or turns its direction (perspective). So
 * both projections run the same three lines, and the grid is bounded by nothing
 * — line width and the legibility fade come from `fwidth` of the plane
 * coordinate, which is what makes a tilted ground plane fade out at its horizon
 * instead of aliasing or ending at a quad edge.
 *
 * The shader is a dual-language `.esshader` (GLSL + WGSL twins) on the reflected
 * `#pragma param` seam: parameters ride the MaterialConstants UBO and the draw
 * goes through `Draw.drawMeshWithMaterial`'s reflected path, so the grid renders
 * on every backend.
 *
 * Frontends just install this once and flip the `EditorGrid` resource — the web
 * editor and the headless render host (pixel verification) get the grid for free.
 */

/**
 * Register the editor grid renderer on this App. Idempotent per App: inserts the
 * default `EditorGrid` resource if absent and registers the pre-scene draw pass.
 * The grid only draws when the resource is `enabled` and the `EditorView` active.
 */
declare function installEditorGrid(app: App): void;

/**
 * @file  uiLayoutRect.ts
 * @brief Pure geometry: the world-space box UI is laid out within, plus the
 *        design-resolution ortho scaling behind it. No engine / WASM / DOM
 *        coupling (only the generated CanvasScaleMode enum), so it unit-tests in
 *        isolation like viewportMath. CameraPlugin builds on top of it.
 */
/**
 * Half-height (world units) of the visible area after fitting a design resolution
 * into an actual aspect per @p scaleMode. `orthoForWidth` is the half-height that
 * makes the design *width* exactly fit; `orthoForHeight` the design height.
 */
declare function computeEffectiveOrthoSize(baseOrthoSize: number, designAspect: number, actualAspect: number, scaleMode: number, matchWidthOrHeight: number): number;
/**
 * Synthetic camera `entity` id of the editor navigation view (never a real ECS
 * entity — see CameraPlugin.editorCameraInfo). Distinguishes the free-zoom editor
 * view from scene cameras when deciding the UI layout box.
 */
declare const EDITOR_VIEW_ENTITY = -1;
/** The minimal camera fields the UI box needs (a subset of CameraInfo). */
interface CameraExtents {
    entity: number;
    cameraX: number;
    cameraY: number;
    halfW: number;
    halfH: number;
}
/**
 * The design-resolution fit UI and the camera share — the project `ScreenScaling`
 * when it opts in, else the scene's `Canvas` (see CameraPlugin.resolveFitSource).
 * One source for both, so what the editor lays out and what ships cannot differ.
 */
interface CanvasScale {
    designResolution: {
        x: number;
        y: number;
    };
    scaleMode: number;
    matchWidthOrHeight: number;
}
interface WorldRect {
    left: number;
    right: number;
    bottom: number;
    top: number;
}
/**
 * World anchor of the editor's UI box — the origin. The design frame is a fixed
 * place in the world, not something glued to the navigation view: anchored here it
 * stays concentric with the viewport's design-frame overlay, and pans/zooms with
 * the scene like every other piece of content. (In play the box tracks the camera
 * instead; see {@link uiLayoutRect}.)
 */
declare const EDITOR_UI_ANCHOR: {
    readonly x: 0;
    readonly y: 0;
};
/**
 * The world-space box the UI subtree is laid out within (UINode `px` are world
 * units in this box), for the primary camera. Its SIZE is the area UI lays out in;
 * its CENTER is where that area sits in the world, which places screen roots (a UI
 * root with no transform parent) — so in play the HUD tracks the camera.
 *
 * A scene camera's extents carry its zoom (`orthoSize` fitted to the screen), so
 * under a fit its box is the design resolution fitted to the camera's aspect and
 * centred on the camera — UINode px map 1:1 to design px and a zoom does not reflow
 * the UI. Without a fit the box is the camera's extents. The editor view instead renders the world at a *free
 * zoom* with a raw orthoSize (editorCameraInfo passes a null fit, for predictable
 * navigation), so laying UI out in its zoomed extents would rescale and reflow every
 * element on each zoom. For it, recover the *fixed* design-resolution box from the
 * fit and anchor it at {@link EDITOR_UI_ANCHOR}: the UI then lays out identically at
 * any zoom or pan, and still scales visually with the scene because it renders
 * through the same zoomed viewProjection.
 *
 * With no fit (no Canvas and no project fit) the editor falls back to its own
 * extents — there is nothing to lay out, so it doesn't matter.
 */
declare function uiLayoutRect(cam: CameraExtents, fit: CanvasScale | null, width: number, height: number, previewAspect?: number): WorldRect;

/**
 * @file    CameraPlugin.ts
 * @brief   Camera system plugin — collects cameras, computes view-projection, drives rendering
 */

/**
 * A camera's authored point-of-view — the view *parameters*, separate from the
 * computed view-projection matrix. This is the seam a camera director will blend
 * over (interpolating x / y / rotation / orthoSize between two POVs) before one
 * view is built and handed to the renderer. The POV holds only authored values;
 * `buildCameraInfo` applies presentation (canvas design-resolution scaling, the
 * projection, the rotation) when turning a POV into the renderer-facing CameraInfo.
 */
interface CameraPOV {
    entity: number;
    isActive: boolean;
    x: number;
    y: number;
    z: number;
    rotation: number;
    /**
     * The camera's full orientation, when it is turned off the 2D plane. Absent
     * for a rotation purely about Z — which every 2D camera is, and which the
     * scalar above already says — so turning this on cannot move a 2D scene.
     */
    tilt?: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
    /** Orbit in radians about the focus (x, y, focusZ) — an eye that stands off
     *  the -Z axis. Absent (the 2D case) keeps the rotation-about-Z view exactly
     *  as it was; `z` is then the eye's own depth rather than a standoff. */
    orbit?: {
        yaw: number;
        pitch: number;
        focusZ: number;
    };
    projection: number;
    orthoSize: number;
    fov: number;
    near: number;
    far: number;
    viewport: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
    clearFlags: number;
    priority: number;
    pixelPerfect: boolean;
    /** Sorting layers this camera renders; bit i = layer i. */
    cullingMask: number;
    /** Offscreen target this camera draws into; 0 = the screen. */
    renderTarget: number;
}
/**
 * The Camera fields a POV is read from. Named as a shape rather than as one
 * registry's return type, because the editor reads the same fields off its own
 * projected World.
 *
 * @beta
 */
interface CameraFields {
    isActive: boolean;
    projectionType: number;
    orthoSize: number;
    fov: number;
    nearPlane: number;
    farPlane: number;
    viewport: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
    clearFlags: number;
    priority: number;
    pixelPerfect: boolean;
    /** Absent on a core built before the field; that camera drew every layer. */
    cullingMask?: number;
    /** Absent on a core built before the field; that camera drew to the screen. */
    renderTarget?: number;
}
/**
 * The placement a POV is read from — see {@link CameraFields}. WORLD, because a
 * camera's view is its own transform inverted, and a camera parented to anything
 * (a rig, the player) sits where the hierarchy puts it.
 *
 * @beta
 */
interface CameraTransformFields {
    worldPosition: {
        x: number;
        y: number;
        z: number;
    };
    worldRotation: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
}
/**
 * The eight world-space corners of what a camera sees — near face then far, in
 * the order {@link frustumCornersWorld} documents. Built through the same POV →
 * CameraInfo path a frame is, so it carries the projection, the tilt and the
 * design-resolution framing. @p width / @p height are the frame it renders into.
 *
 * @beta
 */
declare function cameraFrustumCorners(camera: CameraFields, transform: CameraTransformFields, width: number, height: number, canvas: CanvasScale | null, result?: Float32Array): Float32Array;
/** Draw a camera's current world without stepping gameplay or changing authored cameras.
 * Hosts may read this frame and redraw their editor eye in the same browser task. */
declare function renderCameraFrame(app: App, width: number, height: number, entity?: number): boolean;

/** Easing for a view-target transition. */
declare const BlendCurve: {
    readonly Linear: 0;
    readonly EaseIn: 1;
    readonly EaseOut: 2;
    readonly EaseInOut: 3;
};
type BlendCurve = (typeof BlendCurve)[keyof typeof BlendCurve];
/** A transient camera shake — a decaying view-space perturbation (UE modifier). */
interface ActiveShake {
    amplitude: number;
    rotation: number;
    frequency: number;
    duration: number;
    startTime: number;
    seed: number;
}
interface CameraDirectorState {
    /** Committed view-target entity, or -1 → fall back to the active/priority camera. */
    target: number;
    hasPending: boolean;
    pendingTarget: number;
    pendingTime: number;
    pendingCurve: number;
    blending: boolean;
    from: CameraPOV | null;
    startTime: number;
    duration: number;
    curve: number;
    /** Last resolved main POV — also the snapshot source when a new blend starts. */
    currentMain: CameraPOV | null;
    /** Active transient shakes (applied to the rendered POV, never to the Transform). */
    shakes: ActiveShake[];
    shakeSeq: number;
    /**
     * The view a playing timeline's camera track asks for, set every step it has one. While present it
     * is the view and `setViewTarget` waits; when the track has nothing to say the scene's own camera is
     * the view again.
     */
    timelineShot: TimelineShot | null;
    /** The timeline player that set `timelineShot`, so only it can take it back. */
    timelineOwner: number;
}
/** A shot between two cameras, `weight` of the way from `from` (or none) to `to`. */
interface TimelineShot {
    from: number | null;
    to: number;
    weight: number;
    curve: number;
}
declare const CameraDirector: ResourceDef<CameraDirectorState>;
/**
 * Where director commands land: the App (host code) or the CameraDirector
 * resource state itself (systems — `Res(CameraDirector)`).
 */
type CameraDirectorHost = App | CameraDirectorState;
/**
 * Switch the active view target, optionally blending over `time` seconds with an
 * easing `curve`. Records intent; the director applies it on the next frame
 * (snapshotting the current view as the blend start). `time<=0` (or no prior
 * view) is an instant cut. Pass the App from host code, or the
 * `Res(CameraDirector)` state from inside a system.
 */
declare function setViewTarget(host: CameraDirectorHost, entity: number, opts?: {
    time?: number;
    curve?: number;
}): void;
/**
 * A playing timeline's camera track says which camera is the view (and, across an overlap, how far one is
 * blended into the next). Pass `null` to give the view back: only the player that set a shot can clear it.
 */
declare function setTimelineShot(host: CameraDirectorHost, owner: number, shot: TimelineShot | null): void;
/**
 * Trigger a transient camera shake on the active view — a decaying perturbation
 * applied to the rendered POV only (never to a camera's Transform, so it always
 * recovers and never dirties the scene). The UE `StartCameraShake` analog.
 * Pass the App from host code, or the `Res(CameraDirector)` state from a system.
 */
declare function shakeCamera(host: CameraDirectorHost, opts?: {
    amplitude?: number;
    rotation?: number;
    frequency?: number;
    duration?: number;
}): void;

interface FollowTargetData {
    /** Entity to follow (-1 = none). */
    target: number;
    /** World-space offset added to the target position. */
    offsetX: number;
    offsetY: number;
    offsetZ: number;
    /**
     * Follow the target's DEPTH as well. Off for a flat scene, where the camera's z
     * is how far back it stands and following it would walk it into the content
     * plane. Its own switch rather than "offsetZ ≠ 0": standing level with the
     * target is a legal 3D offset.
     */
    followZ: boolean;
    /** The target may move within this radius (world units) without the camera following. */
    deadzone: number;
    /** Damping time-constant in seconds (larger = smoother/slower; 0 = snap). */
    damping: number;
}
declare const FollowTarget: ComponentDef<FollowTargetData>;

interface CameraBoundsData {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}
declare const CameraBounds: ComponentDef<CameraBoundsData>;

/**
 * @file    geometry.ts
 * @brief   Geometry API for custom mesh rendering
 * @details Provides geometry creation and management for custom shapes,
 *          particles, trails, and other procedural meshes.
 */

type GeometryHandle = number;
declare enum DataType {
    Float = 1,
    Float2 = 2,
    Float3 = 3,
    Float4 = 4,
    Int = 5,
    Int2 = 6,
    Int3 = 7,
    Int4 = 8
}
interface VertexAttributeDescriptor {
    name: string;
    type: DataType;
}
interface GeometryOptions {
    vertices: Float32Array;
    layout: VertexAttributeDescriptor[];
    indices?: Uint16Array | Uint32Array;
    dynamic?: boolean;
}
declare function shutdownGeometryAPI(): void;
declare const Geometry: {
    /**
     * Creates a new geometry with vertices and optional indices.
     * @param options Geometry creation options
     * @returns Geometry handle
     */
    create(options: GeometryOptions): GeometryHandle;
    /**
     * Updates vertices of a dynamic geometry.
     * @param handle Geometry handle
     * @param vertices New vertex data
     * @param offset Offset in floats
     */
    updateVertices(handle: GeometryHandle, vertices: Float32Array, offset?: number): void;
    /**
     * Releases a geometry.
     * @param handle Geometry handle
     */
    release(handle: GeometryHandle): void;
    /**
     * Checks if a geometry handle is valid.
     * @param handle Geometry handle
     * @returns True if valid
     */
    isValid(handle: GeometryHandle): boolean;
    /**
     * Creates a unit quad geometry (1x1, centered at origin).
     * @returns Geometry handle
     */
    createQuad(width?: number, height?: number): GeometryHandle;
    /**
     * Creates a circle geometry.
     * @param radius Circle radius
     * @param segments Number of segments
     * @returns Geometry handle
     */
    createCircle(radius?: number, segments?: number): GeometryHandle;
    /**
     * Creates a polygon geometry from vertices.
     * @param points Array of {x, y} points
     * @returns Geometry handle
     */
    createPolygon(points: Array<{
        x: number;
        y: number;
    }>): GeometryHandle;
};

/**
 * @file    draw.ts
 * @brief   Immediate mode 2D drawing API
 * @details Provides simple drawing primitives (lines, rectangles, circles)
 *          with automatic batching. All draw commands are cleared each frame.
 */

declare function shutdownDrawAPI(): void;
interface DrawAPI {
    /**
     * Begins a new draw frame with the given view-projection matrix.
     * Must be called before any draw commands.
     * @param viewportWidth Framebuffer width used by screen-sized 3D primitives
     * @param viewportHeight Framebuffer height used by screen-sized 3D primitives
     */
    begin(viewProjection: Float32Array, viewportWidth?: number, viewportHeight?: number): void;
    /**
     * Ends the current draw frame and submits all commands.
     * Must be called after all draw commands.
     */
    end(): void;
    /**
     * Draws a line between two points.
     * @param from Start point
     * @param to End point
     * @param color RGBA color
     * @param thickness Line thickness in pixels (default: 1)
     */
    line(from: Vec2, to: Vec2, color: Color, thickness?: number): void;
    /**
     * Draws a line between two points in space.
     *
     * The ribbon is widened across the view, so it reads as a line from wherever
     * the camera is. Thickness is in WORLD units rather than pixels — a distant
     * line thins out the way the geometry beside it does.
     */
    line3D(from: Vec3$2, to: Vec3$2, color: Color, thickness?: number): void;
    /**
     * Draws a world-space line with a stable framebuffer-pixel thickness.
     * The active draw frame must include its framebuffer dimensions.
     */
    line3DScreen(from: Vec3$2, to: Vec3$2, color: Color, thickness?: number): void;
    /** Draws a framebuffer-sized line at one world anchor. Offsets are pixels, +Y up. */
    line3DScreenOffset(anchor: Vec3$2, fromOffset: Vec2, toOffset: Vec2, color: Color, thickness?: number): void;
    /**
     * Draws a filled or outlined rectangle.
     * @param position Center position
     * @param size Width and height
     * @param color RGBA color
     * @param filled If true draws filled, if false draws outline (default: true)
     */
    rect(position: Vec2, size: Vec2, color: Color, filled?: boolean): void;
    /**
     * Draws a rectangle outline.
     * @param position Center position
     * @param size Width and height
     * @param color RGBA color
     * @param thickness Line thickness in pixels (default: 1)
     */
    rectOutline(position: Vec2, size: Vec2, color: Color, thickness?: number): void;
    /**
     * Draws a filled or outlined circle.
     * @param center Center position
     * @param radius Circle radius
     * @param color RGBA color
     * @param filled If true draws filled, if false draws outline (default: true)
     * @param segments Number of segments for approximation (default: 32)
     */
    circle(center: Vec2, radius: number, color: Color, filled?: boolean, segments?: number): void;
    /**
     * Draws a circle outline.
     * @param center Center position
     * @param radius Circle radius
     * @param color RGBA color
     * @param thickness Line thickness in pixels (default: 1)
     * @param segments Number of segments for approximation (default: 32)
     */
    circleOutline(center: Vec2, radius: number, color: Color, thickness?: number, segments?: number): void;
    /**
     * Draws a textured quad.
     * @param position Center position
     * @param size Width and height
     * @param textureHandle GPU texture handle
     * @param tint Color tint (default: white)
     */
    texture(position: Vec2, size: Vec2, textureHandle: number, tint?: Color): void;
    /**
     * Draws a rotated textured quad.
     * @param position Center position
     * @param size Width and height
     * @param rotation Rotation angle in radians
     * @param textureHandle GPU texture handle
     * @param tint Color tint (default: white)
     */
    textureRotated(position: Vec2, size: Vec2, rotation: number, textureHandle: number, tint?: Color): void;
    /**
     * Sets the current render layer.
     * @param layer Layer index (higher layers render on top)
     */
    setLayer(layer: number): void;
    /**
     * Sets the current depth for sorting within a layer.
     * @param depth Z depth value
     */
    setDepth(depth: number): void;
    /**
     * Gets the number of draw calls in the current/last frame.
     */
    getDrawCallCount(): number;
    /**
     * Gets the number of primitives drawn in the current/last frame.
     */
    getPrimitiveCount(): number;
    /**
     * Sets the blend mode for subsequent draw operations.
     * @param mode The blend mode to use
     */
    setBlendMode(mode: BlendMode): void;
    /**
     * Enables or disables depth testing.
     * @param enabled True to enable depth testing
     */
    setDepthTest(enabled: boolean): void;
    /** Runs synchronous drawing with scoped depth state, restored even on throw.
     * Returns false without drawing on older cores without scoped depth support. */
    withDepthState(state: {
        test: boolean;
        write: boolean;
    }, draw: () => void): boolean;
    /**
     * Draws a custom mesh with a shader.
     * @param geometry Geometry handle
     * @param shader Shader handle
     * @param transform Transform matrix (4x4, column-major)
     */
    drawMesh(geometry: GeometryHandle, shader: ShaderHandle, transform: Float32Array): void;
    /**
     * Draws a custom mesh with a material.
     *
     * A material whose shader was compiled from a `.esshader` (Material.compileShader)
     * draws through the reflected MaterialConstants path: its `#pragma param` values and
     * render state come straight from the engine material store, the shader positions
     * itself via the injected FrameConstants (and params), and `transform` is unused —
     * this path runs on every backend. A raw-GLSL material (Material.createShader) uses
     * the legacy loose-uniform stream with `u_projection`/`u_model` and `transform`
     * (identity when omitted).
     * @param geometry Geometry handle
     * @param material Material handle
     * @param transform Transform matrix (4x4, column-major) — legacy raw-GLSL path only
     */
    drawMeshWithMaterial(geometry: GeometryHandle, material: MaterialHandle, transform?: Float32Array): void;
}
declare const Draw: DrawAPI;

/**
 * @file  Offscreen thumbnails of an asset, through the engine's own render path.
 *        A material ball and a mesh differ by ONE call; what follows — readback,
 *        pixels, row flip — is shared, since a second copy of it is a second
 *        place for the row order to be wrong.
 */

/**
 * A thumbnail of a loaded `.esmesh`, seen from off-axis and framed to its own
 * bounds — a mesh is authored at whatever scale its source used, and head-on it
 * is a silhouette. Null if the engine isn't ready or the mesh isn't loaded.
 */
declare function renderMeshPreview(module: unknown, mesh: number, w: number, h: number): Promise<ImageData | null>;

/**
 * @file  Offscreen preview of posed skeletal geometry, owned by its handle.
 *
 *        Unlike a material ball, what is drawn here is not in any scene: the
 *        caller poses a skeleton itself and hands over the batches, which the
 *        engine copies and replays through the one skeletal path a frame's own
 *        geometry takes.
 *
 *        Everything names the handle. There is no current preview, no mode and
 *        no begin/end pair to get wrong, so two previews in flight cannot reach
 *        each other whatever order their calls arrive in — and a render CONSUMES
 *        what was handed over, so a frame that fails cannot draw last frame's
 *        pose again underneath the next one.
 */

/** One batch of posed geometry, in the format every skeletal runtime emits. */
interface SkeletalPreviewBatch {
    /** x,y,u,v,r,g,b,a per vertex. */
    vertices: Uint8Array;
    indices: Uint8Array;
    vertexCount: number;
    indexCount: number;
    textureId: number;
    blendMode: number;
    premultipliedColor?: boolean;
    /** Column-major 4×4, as the renderer takes a model matrix. */
    transform: Float32Array;
    materialId?: number;
    layer?: number;
    depth?: number;
}
/**
 * An offscreen preview of one posed skeleton.
 *
 * Its lifetime is the caller's: whoever needs the preview to be alive holds
 * this, and `dispose` ends it. A disposed handle answers nothing rather than
 * quietly addressing whatever was made next.
 */
declare class SkeletalPreview {
    private readonly core;
    readonly width: number;
    readonly height: number;
    private id;
    private constructor();
    /** A preview of `w`×`h`, or null where this core has no such surface. */
    static create(module: unknown, w: number, h: number): SkeletalPreview | null;
    get live(): boolean;
    /** Hand over one batch. The engine copies it, so these buffers are the
     *  caller's again the moment this returns. */
    submit(batch: SkeletalPreviewBatch): boolean;
    /**
     * Draw what has been handed over and resolve with the pixels, upright.
     *
     * Null when this preview already has a readback in flight — one at a time,
     * which is what keeps a landed image and the camera it was drawn with from
     * drifting apart. The caller re-renders when the pending one lands.
     */
    render(viewProjection: Float32Array): Promise<ImageData | null>;
    /** End it. Idempotent, and the id stops answering rather than addressing
     *  whatever is made next. */
    dispose(): void;
}

/**
 * @file    shaderReflect.ts
 * @brief   What a `.esshader`'s `#pragma param` lines declare, read from the source.
 * @details Parses the same param grammar the engine's C++ ShaderParser does, but only the
 *          declaration metadata (name / type / default / range / ui hint / display name).
 *          The engine remains the single source of the std140 layout + GLSL codegen; this is
 *          the static view of the declarations, for everything that needs to know a shader's
 *          parameter vocabulary without compiling one.
 *
 *          Three things read it, which is why it lives here rather than in the editor where
 *          it started: the Material inspector builds its parameter panel from it, the built-in
 *          templates derive their material defaults from it (so the defaults cannot drift from
 *          the shader that consumes them), and `Material.setUniform` uses it to tell a caller
 *          that the name it just wrote is not one this shader has — a value the engine would
 *          otherwise drop without a word.
 *
 *          Grammar (matches ShaderParser):
 *            #pragma param <name> <type> [default(csv)] [range(min,max)] [ui(hint)] [texel(data)] [unit(length|perLength)]
 *            (<type> `textureArray` reads as a `texture` param with `layered` set)
 *            #pragma domain <Unlit|Lit|PostProcess|UI>
 */
type ShaderParamType = 'float' | 'vec2' | 'vec3' | 'vec4' | 'color' | 'int' | 'texture';
interface ShaderParam {
    name: string;
    type: ShaderParamType;
    /** Human label for the inspector row (leading `u_` stripped, capitalized). */
    displayName: string;
    /** Default components for a scalar/vector param (length 1–4); empty for a texture. */
    default: number[];
    /** Default texture hint for a texture param (e.g. "white"); undefined otherwise. */
    defaultTexture?: string;
    /** Optional slider bounds from `range(min,max)`. */
    range?: {
        min: number;
        max: number;
    };
    /** Optional UI hint from `ui(...)`, e.g. "slider". */
    ui?: string;
    /**
     * `texel(data)`: a texture whose texels this shader reads as numbers (a normal,
     * packed roughness), which sRGB decode would bend. Absent means colour.
     */
    texel?: 'data';
    /**
     * `unit(length)` (1) or `unit(perLength)` (-1): the default and range are written at 100 world units a metre, the
     * engine's reference, and follow the project's units per metre where a material leaves the param unset
     * (ecs/worldUnits.ts; {@link shaderParamInUnits} is what an inspector shows). Absent is a plain number.
     */
    worldUnits?: 1 | -1;
    /**
     * Declared `textureArray`: a 2D texture array, sampled with a layer index
     * (`texture(u_x, vec3(uv, layer))`). Set it with `Material.tex` on a handle from
     * `createTextureArrayFromPixels`. Absent means a plain 2D texture.
     */
    layered?: true;
}
interface ShaderReflection {
    domain: string;
    params: ShaderParam[];
}
/**
 * A param's declared default in the shape a `.esmaterial`'s `properties` stores it: a number
 * for float/int, `{r,g,b,a}` for a color, `{x,y,…}` for a vector, and for a texture the
 * default's NAME (`"white"`, `"flatnormal"` — an engine-resolved stand-in, not an asset ref).
 */
declare function paramDefaultValue(param: ShaderParam): unknown;
/** Parse a `.esshader` source into its declared parameters (world-unit ones in the project's units) and domain. */
declare function reflectEsshader(source: string): ShaderReflection;

/**
 * @file    materialGraph.ts
 * @brief   Material Graph → `.esshader` compiler (REARCH_MATERIAL §4.4, P5).
 * @details A material graph is a **visual frontend that generates a `.esshader`**, not a parallel
 *          pipeline: `compileMaterialGraph` emits GLSL whose backend is the same ShaderParser
 *          path (`compileEsshader` → MaterialConstants block + sampler units + variants). Const /
 *          texture nodes become `#pragma param`s, so a graph's inputs are ordinary, reflected,
 *          editable material parameters — one reflection model for hand-written and graph shaders
 *          alike. The vertex stage is fixed (2D bakes the transform into the batch vertices); the
 *          programmable surface is the fragment, which this compiler builds by topologically
 *          walking the node DAG from the output.
 *
 * @beta   Pre-1.0: the material-graph node set and serialized shape may still change.
 */
/** A node's GLSL output type. Determines how it combines and how it promotes to fragColor. */
type GraphType = 'float' | 'vec2' | 'vec3' | 'vec4';
type GraphNodeType = 'output' | 'subgraph' | 'subInput' | 'subOutput' | 'normalMap' | 'channel' | 'literal' | 'uvTransform' | 'switch' | 'uv' | 'vertexColor' | 'time' | 'screenUV' | 'constFloat' | 'constColor' | 'textureSample' | 'multiply' | 'add' | 'lerp' | 'oneMinus' | 'saturate' | 'sin' | 'smoothstep' | 'noise' | 'panner';
interface MaterialGraphNode {
    id: string;
    type: GraphNodeType;
    /** Node literals: param `name`, scalar/color `value`, texture `default`. */
    params?: Record<string, unknown>;
    /** Input slot → source node id (e.g. multiply: `{ a, b }`; textureSample: `{ uv? }`). */
    inputs?: Record<string, string>;
    /** Editor canvas position (px). Ignored by the compiler — layout only. */
    x?: number;
    y?: number;
}
interface MaterialGraph {
    /** `'subgraph'` for a `.esmatsub` — a graph meant to be used as a node, ending in a `subOutput`. */
    kind?: 'subgraph';
    name?: string;
    /** Material domain (Unlit default; Lit etc. flow through unchanged, under its current name). */
    domain?: string;
    /** Id of the `output` node — the compile root. */
    output: string;
    nodes: MaterialGraphNode[];
}
/**
 * Compile a material graph into a `.esshader` source string (assembled by the engine's
 * ShaderParser like any hand-written shader). Emits BOTH stage languages — the GLSL fragment
 * and its `#pragma fragment wgsl` twin — from one DAG walk, so a graph material runs on
 * either backend. Throws on a missing node/input, a cycle, an unknown node type, or an
 * output root that isn't an `output` node.
 */
declare function compileMaterialGraph(source: MaterialGraph, resolve?: SubgraphResolver): string;
/** A node input/output port. `type` drives the port's color hint; connections coerce freely. */
interface NodePort {
    name: string;
    type: GraphType;
}
/** An editable node literal, surfaced as a node-inspector field. */
interface NodeParamSpec {
    key: string;
    label: string;
    kind: 'color' | 'float' | 'texture' | 'bool' | 'channel' | 'text';
}
/** Static schema for a node type — the single source the palette, ports, and node inspector
 *  all read, kept beside the compiler so the editor and codegen never drift. */
interface NodeSpec {
    label: string;
    inputs: NodePort[];
    /** Output port type, or null for the `output` sink (no output port). */
    output: GraphType | null;
    params: NodeParamSpec[];
    /** Whether the palette offers it (the singleton `output` node is not addable). */
    addable: boolean;
}
declare const NODE_SPECS: Record<GraphNodeType, NodeSpec>;
/** A default starter graph: a white texture sample straight into the output. */
declare function newMaterialGraph(): MaterialGraph;
/** Add a node of @p type at canvas (@p x,@p y); returns the new graph + the new node id. */
declare function addNode(g: MaterialGraph, type: GraphNodeType, x: number, y: number): {
    graph: MaterialGraph;
    id: string;
};
/** Move a node to (@p x,@p y) on the canvas (layout only). */
declare function moveNode(g: MaterialGraph, id: string, x: number, y: number): MaterialGraph;
/** How a graph finds a subgraph it names: by the `ref` its `subgraph` node carries. Null = not found. */
type SubgraphResolver = (ref: string) => MaterialGraph | null;
/** One input a subgraph takes, read from its `subInput` nodes — what a node using it shows as ports. */
interface SubgraphInput {
    /** The node id inside the subgraph, and the slot name on a `subgraph` node that uses it. */
    name: string;
    type: GraphType;
    /** What an unconnected input reads as, unless the using node overrides it with `params["in_<name>"]`. */
    default: number;
}
/** The inputs a subgraph exposes, in the order its nodes list them. */
declare function subgraphInputs(sub: MaterialGraph): SubgraphInput[];
/** The `ref`s a graph names, directly (not through the subgraphs those name). */
declare function subgraphRefs(graph: MaterialGraph): string[];
/**
 * Replace every `subgraph` node with the nodes of the graph it names, so the compiler only ever sees
 * plain nodes. An unconnected input becomes a literal (the subgraph's default, or the using node's
 * `in_<name>`); a connected one is the wire itself. Ids and explicit param names are prefixed with the
 * using node's id, so one subgraph used twice makes two independent copies — not one shared param.
 * Throws on a missing subgraph, a subgraph that contains itself, or nesting past 8 levels.
 */
declare function flattenSubgraphs(graph: MaterialGraph, resolve: SubgraphResolver, stack?: readonly string[]): MaterialGraph;
/** A starter subgraph: one input, passed straight through. */
declare function newMaterialSubgraph(): MaterialGraph;
/**
 * The type a subgraph hands back, worked out from its nodes without compiling — what the editor
 * colours the using node's wire with. Falls back to float for anything it cannot tell.
 */
declare function subgraphOutputType(sub: MaterialGraph): GraphType;
interface ExtractedSubgraph {
    /** The new `.esmatsub`: the selection, with a `subInput` for each wire that came in from outside. */
    sub: MaterialGraph;
    /** The graph with the selection replaced by one `subgraph` node naming @p ref. */
    graph: MaterialGraph;
    /** The id of that node. */
    nodeId: string;
}
/**
 * Turn the nodes @p ids into a subgraph, and put one node using it in their place.
 *
 * Every wire from outside into the selection becomes an input (one per source node, named after the
 * slot it fed), and the one selected node that something outside reads becomes the result. Throws if
 * there is not exactly one such node — a subgraph has one result — or if the selection holds the
 * output. A node's own param names carry over unchanged; the subgraph node prefixes them, so a
 * material that set `u_tint` now finds it as `<node>_u_tint`.
 */
declare function extractSubgraph(g: MaterialGraph, ids: readonly string[], ref: string, name?: string): ExtractedSubgraph;
/** Whether @p sub compiles when used — checked by wrapping its output in a throwaway material output. */
declare function validateSubgraph(sub: MaterialGraph, resolve: SubgraphResolver): void;
/**
 * Connect @p fromId's output into @p toId's @p toSlot input. Rejected (returns the graph
 * unchanged) if it would create a cycle or the slot is unknown — so the canvas can't author an
 * uncompilable graph.
 */
declare function connect(g: MaterialGraph, fromId: string, toId: string, toSlot: string): MaterialGraph;
/** Clear @p toId's @p toSlot input connection. */
declare function disconnect(g: MaterialGraph, toId: string, toSlot: string): MaterialGraph;
/** Remove a node (and every edge into/out of it). The `output` node can't be removed. */
declare function removeNode(g: MaterialGraph, id: string): MaterialGraph;

/**
 * @file  What the engine needs a WebGPU device to be created with.
 *
 *        A feature the adapter offers is unusable until the device asked for it,
 *        and the refusal arrives late and quietly: `createTexture` throws, the
 *        asset loader logs a warning, and the frame draws the white placeholder.
 *        So every host that acquires a device asks the same question here rather
 *        than each remembering its own list.
 */
/** Optional device features the engine uses when the adapter has them. */
declare const ENGINE_WEBGPU_FEATURES: readonly ["texture-compression-astc", "texture-compression-bc", "texture-compression-etc2", "timestamp-query"];
/** An adapter, as far as this needs to know it. */
interface WebGPUAdapterLike {
    readonly features?: {
        has(name: string): boolean;
    };
}
/** The subset of {@link ENGINE_WEBGPU_FEATURES} this adapter actually offers. */
declare function engineWebGPUFeatures(adapter: WebGPUAdapterLike): string[];

/** What a project asks for. `auto` takes WebGPU where the machine has it. */
type RenderBackendRequest = 'webgl2' | 'webgpu' | 'auto';
/** The device, plus what it took to get one. `device` null ⇒ boot WebGL2. */
interface WebGPUBootResult {
    device: unknown | null;
    /** Why WebGPU was not used, for a host that wants to say so. */
    reason?: string;
    /**
     * Which adapter served the device. An unrecognized `--use-webgpu-adapter` is
     * ignored in silence, so this is the only thing that says whether hardware or
     * a software rasterizer drew the frame.
     */
    adapter?: string;
}
/**
 * A device for `requested`, or null to fall back to WebGL2 — a project that asks
 * for WebGPU still runs on a browser without it, which is the only behaviour a
 * shipped game can have. `onError` takes Dawn's uncaptured validation messages,
 * which are dropped in silence without a listener.
 *
 * @beta
 */
declare function acquireWebGPUDevice(requested: RenderBackendRequest, onError?: (message: string) => void): Promise<WebGPUBootResult>;

/** Pixels as every capture consumer expects them: RGBA, rows bottom-up. */
interface FramePixels {
    rgba: Uint8Array;
    width: number;
    height: number;
}
/** Whether this build can return its own pixels — an older wasm cannot. */
declare function canCaptureFramePixels(module: ESEngineModule): boolean;
/**
 * The next completed frame, read from the engine.
 *
 * `advance` runs one frame — a driver's own step, or waiting a rAF under a live
 * loop. Null when the build cannot capture, when the request is refused (a
 * WebGPU surface configured without readback), or when the readback never lands.
 *
 * @beta
 */
declare function captureFramePixels(module: ESEngineModule, width: number, height: number, advance?: () => void | Promise<void>): Promise<FramePixels | null>;

/**
 * @file    layerOrder.ts
 * @brief   How a sorting layer resolves the draws inside it — the JS mirror of
 *          the engine's `DrawList::layerOrder` (src/esengine/renderer/draw).
 *
 * The renderer decides this from two bitmasks and nothing else. Anything that has
 * to AGREE with what was drawn — the editor's picking, a gizmo that ranks
 * overlapping entities, a future runtime hit-test — has to ask the same question
 * of the same two masks, or it answers about a different image than the one on
 * screen. One rule, mirrored once, rather than each caller's idea of "on top".
 */
/** How one sorting layer resolves the draws inside it. */
declare enum LayerOrder {
    /** Submission order, tie-broken by depth: the 2D default. */
    Painter = 0,
    /** World Y within the layer — lower on screen draws on top. */
    YSort = 1,
    /** The depth buffer, from each entity's z — the 2.5D opt-in. */
    Depth = 2
}
/**
 * The one answer for @p layer, from two masks that are two spellings of the same
 * question. Y-sort is a depth PROJECTED from world Y and depth is the real thing,
 * so a layer declaring both has said two contradictory things: y-sort wins, which
 * is what the engine does, so a project that had it renders as it did. Layers
 * outside 0..31 have no bit and are therefore painter-ordered.
 */
declare function layerOrderOf(layer: number, ySortMask: number, depthMask: number): LayerOrder;
/**
 * How far in FRONT a draw sits within its layer — larger is nearer the viewer,
 * so ranking by this descending is "topmost first".
 *
 * The camera looks down -z, so a larger z is nearer; under y-sort the projected
 * depth is world Y inverted (lower on screen = nearer). Painter layers still
 * answer by z because the engine's sort key tie-breaks on it, and a scene that
 * puts one sprite in front of another with z means it — this is exactly the
 * ordering a person sees.
 */
declare function layerFrontness(order: LayerOrder, worldY: number, worldZ: number): number;
/** What a draw's place in the frame depends on: its layer, where it sits inside
 *  that layer, the layer's rule, and the two world coordinates either rule uses. */
interface DrawRank {
    layer: number;
    /** The layer's RULE — how it resolves its contents. Not to be confused with
     *  `orderInLayer`, which is one draw's stated place inside it. */
    order: LayerOrder;
    /** `Sprite.order`: the author's explicit place within the layer, outranking
     *  whatever the rule would have inferred. 0 means nothing was stated. */
    orderInLayer: number;
    /** Where this draw sits inside its `SortingGroup`, or null when it is in none.
     *  See {@link sortingIdentity} — with a group, `layer`/`orderInLayer` are the
     *  GROUP's and this is what separates the members. */
    groupInner?: number | null;
    worldY: number;
    worldZ: number;
}
/**
 * Positive when @p a ended up in FRONT of @p b — the order the frame resolved,
 * for anything that has to answer "which of these is on top" outside the renderer.
 *
 * The sorting layer normally decides, because a higher layer is simply painted
 * later. Two DEPTH layers are the exception, and not a special case bolted on: a
 * depth layer resolves per PIXEL, so an opaque draw at a nearer z occludes what a
 * later layer puts over it — that is the whole point of the 2.5D opt-in, and it is
 * what a paired pixel check proves (near sprite in the LOWER layer, still in
 * front). Ranking those two by layer would answer with the sprite that the depth
 * buffer rejected.
 */
declare function compareDrawRank(a: DrawRank, b: DrawRank): number;
/** One entity under the pointer, with everything its rank depends on. */
interface PickCandidate<T> {
    entity: T;
    /** Where the frame put it: layer, that layer's rule, and the world coords it uses. */
    rank: DrawRank;
    /** Position in the World's iteration order: the paint order for equal depth. */
    index: number;
}
/**
 * Candidates ranked topmost-first, the way the RENDERER stacked them — the layer
 * rules via {@link compareDrawRank}, then later-drawn winning ties. Backwards
 * means a click selects what is hidden behind what the person aimed at.
 */
declare function rankPickCandidates<T>(candidates: ReadonlyArray<PickCandidate<T>>): T[];

/**
 * @file    frameDebugReport.ts
 * @brief   One captured frame as a frame debugger shows it, and one replayed draw,
 *          built inside the game's own realm and carried out as plain data.
 *
 * The editor's viewport, its Play realm and a device running a debug build all
 * answer the frame debugger through these two functions, so a capture reads the
 * same wherever it was taken.
 */

interface FrameDebugReport {
    passCount: number;
    draws: DrawCallInfo[];
    /** Every entity a draw lists, by id; absent where the entity has no Name. */
    names: Record<number, string>;
    /** The load paths behind the frame's material and texture ids, where an asset
     *  is behind them. */
    materials: Record<number, string>;
    textures: Record<number, string>;
}
/** How a realm names what a draw bound: its Assets, asked by id. */
interface FrameAssetNames {
    material(id: number): string | null;
    texture(renderId: number): string | null;
}
/** One replayed draw: the pass up to and including it, as RGBA rows top-down. */
interface FrameReplayImage {
    width: number;
    height: number;
    pixels: Uint8ClampedArray;
    matchesCapture: boolean;
}
declare function frameDebugReport(data: FrameCaptureData, nameOf: (entity: number) => string | null, assets?: FrameAssetNames): FrameDebugReport;
/**
 * Capture @p app's next whole frame; null when it drew nothing. @p pathOf turns an
 * asset's load path into the one its reader knows it by.
 */
declare function captureFrameReport(app: App, nextFrame: NextFrame, pathOf?: (path: string) => string | null): Promise<FrameDebugReport | null>;
/** The last capture's pass in @p app, drawn up to and including @p drawIndex. */
declare function replayFrameDraw(app: App, drawIndex: number, nextFrame: NextFrame): Promise<FrameReplayImage | null>;

interface RenderTextureOptions {
    width: number;
    height: number;
    depth?: boolean;
    filter?: 'nearest' | 'linear';
}
interface RenderTextureHandle {
    _handle: RenderTargetHandle;
    /** Raw device texture id — for Draw.texture / low-level GL paths only. */
    textureId: number;
    /**
     * Resource-table handle for the color texture — what `Sprite.texture` /
     * `UIVisual.texture` consume (components resolve through the texture table;
     * a raw device id would fall back to the white texture). 0 when no resource
     * manager is live (headless renderer-only hosts).
     */
    texture: number;
    width: number;
    height: number;
    _depth: boolean;
    _filter: 'nearest' | 'linear';
    /** The device generation its pixels were drawn on — see {@link RenderTexture.contentLost}. */
    _generation: number;
}
declare const RenderTexture: {
    create(options: RenderTextureOptions): RenderTextureHandle;
    release(rt: RenderTextureHandle): void;
    resize(rt: RenderTextureHandle, width: number, height: number): RenderTextureHandle;
    begin(rt: RenderTextureHandle, viewProjection: Float32Array): void;
    end(): void;
    getDepthTexture(rt: RenderTextureHandle): number;
    /**
     * Whether the device has been rebuilt since this target was drawn: the storage
     * is there, zero-filled, and only whoever drew the pixels can put them back.
     * A target a camera renders every frame never needs asking; one drawn once
     * (a minimap, a baked mask) does. Pair it with `onDeviceRestored`.
     */
    contentLost(rt: RenderTextureHandle): boolean;
    /** Says the target has been drawn again, which is what clears {@link contentLost}. */
    contentDrawn(rt: RenderTextureHandle): void;
};

/** Where one source texture sits on an atlas. @experimental */
interface AtlasEntry {
    /** Left edge in atlas pixels. */
    x: number;
    /** Top edge in atlas pixels, counted from the top of the canvas. */
    y: number;
    width: number;
    height: number;
    /** What `Sprite.uvOffset` takes to show exactly this entry. */
    uvOffset: {
        x: number;
        y: number;
    };
    /** What `Sprite.uvScale` takes to show exactly this entry. */
    uvScale: {
        x: number;
        y: number;
    };
}
/** Options of {@link TextureAtlas.pack}. @experimental */
interface TextureAtlasOptions {
    /** The largest canvas edge to try, in pixels. Default 2048. */
    maxSize?: number;
    /** Transparent pixels kept between neighbours so a filtered edge does not pick up the next picture. Default 2. */
    padding?: number;
    /** Sampling filter of the canvas. Default `'linear'`. */
    filter?: 'nearest' | 'linear';
}
/** A packed canvas and where each source sits on it. @experimental */
interface TextureAtlasHandle {
    /** Resource-table handle of the canvas — what `Sprite.texture` takes. */
    readonly texture: number;
    readonly width: number;
    readonly height: number;
    /** The entry of a source texture handle, or undefined when it was not packed. */
    get(source: number): AtlasEntry | undefined;
    /** `{ texture, uvOffset, uvScale }` for a source, ready to spread into a `Sprite`. */
    sprite(source: number): {
        texture: number;
        uvOffset: {
            x: number;
            y: number;
        };
        uvScale: {
            x: number;
            y: number;
        };
    };
    /** Draws the canvas again from the sources; done for you after a device loss. */
    repaint(): void;
    /** Frees the canvas. The sources are not touched. */
    release(): void;
}
declare const TextureAtlas: {
    /**
     * Draws `sources` (texture handles) onto one new canvas and returns where each landed. Call it
     * from a `Schedule.Update` system, not a draw callback. Null while the renderer is not up yet;
     * throws when a handle has no size or the textures do not fit. Keep the sources alive: a device
     * loss draws the canvas again from them.
     * @experimental
     */
    pack(sources: readonly number[], options?: TextureAtlasOptions): TextureAtlasHandle | null;
};

/**
 * @file    render/uvRect.ts
 * @brief   A rectangle of a picture, in pixels, as the UV window a sprite shows.
 *
 * Texture space has v growing UP: v = 0 is the image's LAST row, v = 1 its first.
 * Pixel rectangles (an atlas packer, a sheet grid, an image editor) are measured
 * from the TOP. The conversion between the two lives here once — written out by
 * hand it comes out upside down, and a quad that shows the whole picture never
 * says so.
 */
/** The window `Sprite.uvOffset` / `uvScale` (and `UIVisual`'s) take. */
interface UvRect {
    uvOffset: {
        x: number;
        y: number;
    };
    uvScale: {
        x: number;
        y: number;
    };
}
/**
 * The UV window of a pixel rectangle in a @p textureWidth x @p textureHeight
 * picture, the rectangle's @p y measured DOWN from the top edge as image tools
 * measure it. Spread the result into a `Sprite` to show exactly that cell.
 */
declare function uvRectFromPixels(rect: {
    x: number;
    y: number;
    width: number;
    height: number;
}, textureWidth: number, textureHeight: number): UvRect;

/** Options of {@link TextureCanvas.create}. @experimental */
interface TextureCanvasOptions {
    /** Sampling filter when the canvas is shown. Default `'linear'`; `'nearest'` for pixel art. */
    filter?: 'nearest' | 'linear';
}
/** A canvas you can paste textures into. @experimental */
interface TextureCanvasHandle {
    /** Resource-table handle of the canvas — what `Sprite.texture` takes. Show it with no `flipY`. */
    readonly texture: number;
    readonly width: number;
    readonly height: number;
    /**
     * Pastes `source` (a texture handle) with its top-left corner at (`x`, `y`), counted in pixels from the
     * canvas's top-left. It is drawn at its own size unless `width` and `height` are given. Pictures blend over
     * what is already there, in the order they are pasted.
     */
    draw(source: number, x: number, y: number, width?: number, height?: number): void;
    /** Back to transparent, forgetting everything pasted. */
    clear(): void;
    /** Frees the canvas. The pasted textures are not touched. */
    release(): void;
}
declare const TextureCanvas: {
    /**
     * A transparent canvas `width` × `height` pixels. Call it, and `draw`, from a `Schedule.Update` system, not a
     * draw callback: each paste is a pass of its own. Null while the renderer is not up yet. Keep the pasted
     * textures alive: a device loss pastes them again.
     * @experimental
     */
    create(width: number, height: number, options?: TextureCanvasOptions): TextureCanvasHandle | null;
};

/**
 * @file    renderOrigin.ts
 * @brief   The point a frame is drawn relative to, so a world far from zero keeps its precision on the GPU.
 *
 * @details Single floats hold a position well only near zero: at 50 km from it a step is 4 mm, and the vertices of a mesh there jitter as the
 *          camera moves. The renderer takes every world position from an origin near the camera before it reaches the GPU, and the camera's
 *          view-projection is built for the same origin, so the picture is the same and the numbers in it are small. The origin is the
 *          camera's position rounded to `step`, and it stays where it is until the camera is further than `step` from it: shadow maps, the
 *          light grid and other caches that are laid out on the world's grid step only when it does, not with every frame. Off (step 0) it is
 *          zero, which changes nothing.
 */
interface RenderOriginState {
    /** The grid the origin is rounded to, and how far the camera goes from it before it moves; 0 draws relative to the world's own zero. */
    step: number;
    x: number;
    y: number;
    z: number;
}
/** The origin now. Read-only: it moves by {@link followRenderOrigin}. */
declare function renderOrigin(): Readonly<RenderOriginState>;
/** Turns the origin on (a step above 0, in world units) or off (0). Turning it off returns it to zero. */
declare function setRenderOriginStep(step: number): void;

/** @experimental */
declare const Quality: ResourceDef<QualityController | null>;

/**
 * @file  shaderWarmup.ts
 * @brief Letting the shaders a scene draws with finish compiling before it is shown.
 *
 * With `quality.asyncShaderCompile` a draw whose shader the browser is still compiling is left out, so a scene that opens straight onto its first
 * frame fills in as its shaders are ready. {@link warmShaders} is the other choice: draw the scene's frames out of sight until nothing is
 * compiling any more (behind a loading screen), and open on a complete picture.
 */

/** What a warm-up did. */
interface ShaderWarmup {
    /** Frames drawn out of sight. */
    frames: number;
    /** Milliseconds it took. */
    ms: number;
    /** Shaders still compiling when it stopped: 0 unless it gave up. */
    pending: number;
    /** It stopped because the time was up, not because everything was ready. */
    timedOut: boolean;
}
/** @experimental */
interface ShaderWarmupOptions {
    /** How long to wait for the compiles before giving up and opening anyway. Default 30000. */
    timeoutMs?: number;
    /** Consecutive frames in which nothing was compiling before it counts as done: a frame can ask for a shader the one before did not. Default 3. */
    settleFrames?: number;
    /** Called after each frame with how many shaders are still compiling. */
    onProgress?: (pending: number) => void;
}
/**
 * How many shaders are still compiling in the background (0 when shaders are not compiled that way).
 * @experimental
 */
declare function pendingShaders(source: App | ESEngineModule | null): number;
/**
 * Waits until no shader is compiling. For a host that asked the engine to ready programs (a scene being prepared) and wants "ready" to be true.
 * @experimental
 */
declare function shadersCompiled(module: ESEngineModule | null, timeoutMs?: number): Promise<boolean>;
/**
 * Draws the app's frames out of sight until its shaders have finished compiling, so what is shown first is complete.
 *
 * The frames advance the world by a tenth of a millisecond each: they exist to make the renderer ask for the shaders the scene needs (a variant is
 * only asked for when something first draws with it), not to play the game. Meant for a loading screen, before the first visible frame.
 * @experimental
 */
declare function warmShaders(app: App, options?: ShaderWarmupOptions): Promise<ShaderWarmup>;

/**
 * @file  vectorPath.ts
 * @brief Polygons, polylines and strokes as geometry a MeshRenderer draws.
 *
 * A path is a list of points. {@link buildPathGeometry} turns it into the triangles of its fill (ear clipping, holes allowed) and of its
 * stroke (a width, a join at every corner, a cap at each end), with an optional feathered edge standing in for anti-aliasing where the
 * quality level draws without multisampling. The result is a {@link MeshRendererGeometry}: a MeshRenderer draws it, sorts it with every other
 * renderable, batches it, and a scene saves it the way it saves any mesh geometry, so a path costs no renderer of its own.
 *
 * Pure: no engine, no DOM. Curves are flattened here ({@link cubicBezier}, {@link quadraticBezier}, {@link circlePoints}) into the points a
 * stroke and a fill take.
 */

/** Red, green, blue and alpha, each 0 to 1. */
type PathColor = readonly [number, number, number, number];
/** How two stroked segments meet at a corner. */
type LineJoin = 'miter' | 'round' | 'bevel';
/** How an open stroke ends. */
type LineCap = 'butt' | 'round' | 'square';
/** @experimental */
interface PathFill {
    color: PathColor;
    /** Rings cut out of the fill. Each is a list of points inside the outline. */
    holes?: readonly (readonly Vec2[])[];
}
/** @experimental */
interface PathStroke {
    color: PathColor;
    /** The full width of the line, in the units of the points. */
    width: number;
    join?: LineJoin;
    cap?: LineCap;
    /** How far a miter may reach, as a multiple of half the width, before the corner is bevelled instead. Default 4. */
    miterLimit?: number;
}
/** @experimental */
interface PathStyle {
    fill?: PathFill;
    stroke?: PathStroke;
    /** The outline joins its last point back to its first: a stroke has no caps, a fill needs it either way. Default false. */
    closed?: boolean;
    /** Width of a fade to transparent along every outer edge, in the units of the points: anti-aliasing for a surface drawn without multisampling. 0 (default) draws hard edges. */
    feather?: number;
    /** How finely a round join or cap is cut, as the angle one slice may turn through, in radians. Default 0.25. */
    arcStep?: number;
}
/**
 * The geometry of a path: its fill, then its stroke on top, as one mesh in the path's own coordinates.
 * An empty result (fewer than the points a shape needs) is a mesh with nothing in it, which draws nothing.
 * @experimental
 */
declare function buildPathGeometry(points: readonly Vec2[], style: PathStyle): MeshRendererGeometry;
/** The geometry of several paths drawn into one mesh, in order. */
declare function mergeGeometry(parts: readonly MeshRendererGeometry[]): MeshRendererGeometry;
/** A cubic Bezier curve as points, cut finely enough that no point is further than `tolerance` from the curve. @experimental */
declare function cubicBezier(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, tolerance?: number): Vec2[];
/** A quadratic Bezier curve as points. @experimental */
declare function quadraticBezier(p0: Vec2, p1: Vec2, p2: Vec2, tolerance?: number): Vec2[];
/** The points of a circle (or a slice of one: angles in radians, counter-clockwise from +x). @experimental */
declare function circlePoints(cx: number, cy: number, radius: number, segments?: number, startAngle?: number, endAngle?: number): Vec2[];

/**
 * @file  pathRenderer.ts
 * @brief Drawing a path on an entity: the points in, a MeshRenderer's geometry out.
 *
 * The geometry belongs to the entity's MeshRenderer, so a path sorts, batches and clips like any other renderable and a scene saves it as the
 * mesh geometry it is. To change a path, call {@link setPath} again with the new points: the mesh is rebuilt and uploaded, which costs the
 * tessellation of the path and nothing while it stands still.
 */

/**
 * Draws `points` as a path on `entity`, giving it a MeshRenderer if it has none. An empty result (a stroke of one point) clears what was drawn.
 * @experimental
 */
declare function setPath(app: App, entity: Entity, points: readonly Vec2[], style: PathStyle): void;
/** Stops drawing the path on `entity` (its MeshRenderer stays). @experimental */
declare function clearPath(app: App, entity: Entity): void;

/** The fields of the `RainShelter` component. @experimental */
interface RainShelterData {
    /** The covered ground is the ellipse inside the sprite's rectangle (a crown), not the whole of it (a roof). */
    round: boolean;
    /** Ground around the sprite's edge that stays dry too, in world units: eaves. */
    margin: number;
    /** Off: the sprite shelters nothing. */
    enabled: boolean;
}
/**
 * Keeps the ground under this sprite dry in the 2D rain, as far as the sprite lets it be seen.
 *
 * @experimental
 */
declare const RainShelter: ComponentDef<RainShelterData>;
/** The fields of the `RainUpright` component. @experimental */
interface RainUprightData {
    /** Ground around the sprite's edge that the rain still draws on, in world units: the feet, or a trunk's base. */
    inset: number;
    /** Off: the sprite is treated as ground like any other. */
    enabled: boolean;
}
/**
 * Marks a sprite that STANDS on the ground (a character, a trunk, a crate), so the 2D rain's rings, splashes and wet darkening are not drawn over
 * it. The rain is laid over the finished picture and cannot tell a character from the floor under them; this tells it. Falling streaks still cross it.
 *
 * @experimental
 */
declare const RainUpright: ComponentDef<RainUprightData>;
/** One upright sprite's rectangle, and how much of it shows (a faded one shows the ground behind it). */
interface Upright {
    x: number;
    y: number;
    hx: number;
    hy: number;
    amount: number;
}
/** The upright a sprite is, or null where it has no body to keep the rain off. */
declare function uprightOf(sprite: SpriteData, transform: TransformData, data: RainUprightData): Upright | null;
/** What to draw for the uprights the view can see: a rectangle each, the amount in the red channel. */
declare function uprightRects(uprights: readonly Upright[], view: {
    left: number;
    bottom: number;
    right: number;
    top: number;
}): MaskRect[];
/** One shelter: its ground and how dry it is. A negative half height says round. */
interface Shelter {
    x: number;
    y: number;
    hx: number;
    /** Negative for an ellipse. */
    hy: number;
    /** 0 where the ground under it cannot be seen, 1 where all of it can. */
    dry: number;
}
/** A filled rectangle of the mask, centred, in world units. */
interface MaskRect {
    x: number;
    y: number;
    w: number;
    h: number;
    dry: number;
}
/** How dry the ground under a sprite is, from how much of it shows through: an opaque sprite hides it, a clear one hides nothing. */
declare function drynessOf(alpha: number): number;
/** The size a mask is painted at: what the effect asks for, held to what the quality level allows (none: as asked), in whole sixteens of texels. */
declare function shelterMaskSizeOf(asked: number, allowed: number | null): number;
/** How many strips an ellipse is cut into for a mask this big: one per sixteen texels, since more would draw what the mask cannot show. */
declare function ellipseStripsOf(size: number): number;
/**
 * What to draw for the shelters: a rectangle each, an ellipse as strips of one, the driest last so where two overlap the drier wins (a draw
 * overwrites, and a max is what overlapping shelters want). The mask is not drawn for shelters the view cannot see.
 *
 * @param view  The world rectangle the mask covers.
 */
declare function maskRects(shelters: readonly Shelter[], view: {
    left: number;
    bottom: number;
    right: number;
    top: number;
}, strips?: number): MaskRect[];

/** What a surface makes of a step. */
declare enum StepKind {
    /** A ring that spreads and fades. */
    Water = 0,
    /** A footprint that stays a while and fades. */
    Print = 1
}
/** The fields of the `StepSurface` component. @experimental */
interface StepSurfaceData {
    kind: StepKind;
    /** The covered ground is the ellipse inside the sprite's rectangle, not the whole of it. */
    round: boolean;
    /** Ground around the sprite's edge that counts as on it, in world units. */
    margin: number;
    enabled: boolean;
}
/**
 * Makes the ground this sprite covers a surface that steps leave water rings or footprints on.
 *
 * @experimental
 */
declare const StepSurface: ComponentDef<StepSurfaceData>;
/** The fields of the `Footsteps` component. @experimental */
interface FootstepsData {
    /** How far it travels between two steps, in world units. */
    stride: number;
    /** How far apart the left and right feet are, in world units. */
    width: number;
    /** A footprint's length, in world units, and how long it lasts, in seconds. */
    printSize: number;
    printLife: number;
    printColor: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    /** A ring's final size (its width), in world units, and how long it takes to spread and fade, in seconds. */
    rippleSize: number;
    rippleLife: number;
    rippleColor: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    /** The sprite layer the steps are drawn on: above the ground, below whatever walks. */
    layer: number;
    /** Also leave a print where there is no surface at all. */
    onBareGround: boolean;
    /** Optional textures for a print and a ring (a texture handle); 0 uses the ones drawn here. */
    printTexture: number;
    rippleTexture: number;
    enabled: boolean;
}
/**
 * Makes what walks leave rings on water and prints on soft ground, by what it stands on (see `StepSurface`).
 *
 * @experimental
 */
declare const Footsteps: ComponentDef<FootstepsData>;
/** The surface a step lands on: the highest sprite layer of the surfaces that cover the point, or null. */
declare function surfaceAt(x: number, y: number, surfaces: readonly {
    kind: StepKind;
    layer: number;
    centre: {
        x: number;
        y: number;
    };
    half: {
        x: number;
        y: number;
    };
    margin: number;
    round: boolean;
}[]): StepKind | null;
/** Where one foot lands: `stride` along from the last step is not asked here; this is the foot's side of a body heading `heading` (radians). */
declare function footAt(x: number, y: number, heading: number, width: number, left: boolean): {
    x: number;
    y: number;
};
/** A step's look at `age` of `life` seconds: how big and how clear. A ring spreads from a third of its size and fades; a print stays full size and fades. */
declare function stampLook(kind: StepKind, age: number, life: number): {
    scale: number;
    alpha: number;
};

/** The most bodies the sway shader leans plants away from at once. */
declare const SWAY_PUSHERS = 8;
/** The fields of the `SwayPusher` component. @experimental */
interface SwayPusherData {
    /** How far from the entity the plants lean away, in world units. */
    radius: number;
    /** How hard: 1 is the full lean the material's \`u_swayPushStrength\` says, 0 none. */
    strength: number;
    /** Off: plants do not lean away from it. */
    enabled: boolean;
}
/**
 * Makes the plants of a `sprite-sway` material lean away from this entity as it walks through them.
 *
 * @experimental
 */
declare const SwayPusher: ComponentDef<SwayPusherData>;
/** One body, as the shader takes it: where it stands, how far it reaches, how hard it pushes. */
interface PushValue {
    x: number;
    y: number;
    z: number;
    w: number;
}
/** The eight bodies nearest `focus`, farthest dropped, as the shader's values; an unused one reaches nowhere (radius 0). */
declare function nearestPushers(bodies: readonly {
    x: number;
    y: number;
    radius: number;
    strength: number;
}[], focus: {
    x: number;
    y: number;
}): PushValue[];

/** The fields of the `SightViewer` component. @experimental */
interface SightViewerData {
    /** How far this eye sees, in world units. 0 is no limit: only a wall stops it. */
    radius: number;
    /** Off: this eye sees nothing. */
    enabled: boolean;
}
/**
 * An eye: the sprites with a `SightTarget` are seen while some viewer has a clear line to them.
 *
 * @experimental
 */
declare const SightViewer: ComponentDef<SightViewerData>;
/** The fields of the `SightTarget` component. @experimental */
interface SightTargetData {
    /** The sprite's alpha, as a share of its own, while no viewer sees it. 0 is gone. */
    hiddenOpacity: number;
    /** Seconds the fade takes, either way. */
    fadeTime: number;
    /** Off: the sprite stays as authored. */
    enabled: boolean;
}
/**
 * Hides the sprite on this entity while no `SightViewer` has a clear line to it.
 *
 * @experimental
 */
declare const SightTarget: ComponentDef<SightTargetData>;
/** A point in the world plane. */
interface SightPoint {
    x: number;
    y: number;
}
/** One blocker: the outline of a wall, in world units, in order round the shape. */
type SightRing = readonly SightPoint[];
/** Whether a point lies inside a ring (even-odd). */
declare function ringContains(ring: SightRing, p: SightPoint): boolean;
/**
 * Whether the line from `from` to `to` runs through a wall. A ring that contains either end blocks nothing for this pair.
 */
declare function segmentBlocked(from: SightPoint, to: SightPoint, rings: readonly SightRing[]): boolean;
/** A caster's outline in the world: its box or its traced path, scaled, turned and placed by its transform. Null for one that blocks nothing. */
declare function sightRingOf(caster: ShadowCaster2DData, transform: TransformData): SightRing | null;
/** Whether `viewer` sees `target`: inside its radius (when it has one) and with no wall between. */
declare function seesPoint(viewer: SightPoint, radius: number, target: SightPoint, rings: readonly SightRing[]): boolean;
/** The walls the last frame read, for a game that wants the same answer the sprites got. */
declare function currentSightRings(): readonly SightRing[];

/** The fields of the `FogOfWar` component. @experimental */
interface FogOfWarData {
    /** The world rectangle the fog covers, centred on the entity, in world units. */
    width: number;
    height: number;
    /** How many texels a side the maps are. More is finer edges and more to paint. */
    texels: number;
    /** How far a viewer with no `radius` of its own sees, in world units. */
    viewRadius: number;
    /** How many rays are cast from each viewer: the fineness of the field of view's edge. */
    rays: number;
    /** Off: the fog is not painted and the effect draws nothing. */
    enabled: boolean;
}
/**
 * Names the world rectangle a 2D fog of war covers. Put a `fog2d` effect in the scene's post-process volume to draw it.
 *
 * @experimental
 */
declare const FogOfWar: ComponentDef<FogOfWarData>;
/**
 * How far one ray from `origin` goes before a wall stops it, for `rays` rays evenly round the circle, none longer than `radius`. A wall that contains
 * `origin` stops nothing, as for `SightViewer`: standing in a bush you see out of it.
 */
declare function fanDistances(origin: SightPoint, radius: number, rings: readonly SightRing[], rays: number): Float32Array;
/** What has been seen, on a grid of cells over the fog's rectangle: the part that survives a lost device and goes into a save. */
declare class ExploredGrid {
    readonly size: number;
    readonly cells: Uint8Array;
    constructor(size: number);
    /** Marks the cell holding a world point, given the rectangle's low corner and its edge. True when it was new. */
    mark(x: number, y: number, left: number, bottom: number, width: number, height: number): boolean;
    /** Marks everything the rays of one viewer reach, a block of cells round each step along each ray. */
    markFan(origin: SightPoint, distances: Float32Array, left: number, bottom: number, width: number, height: number): boolean;
    /** The grid as a string a save file can hold: run lengths of its cells, in base 36. */
    toString(): string;
    /** Takes what {@link toString} wrote. False, leaving the grid as it was, for a string of another size or a damaged one. */
    fromString(text: string): boolean;
}
/** What has been seen so far, as a string for a save file; empty when there is no fog. */
declare function exploredToString(): string;
/** Restores what a save kept. The fog repaints its map from it on the next frame. False when there is no fog yet or the string does not fit it. */
declare function exploredFromString(text: string): boolean;

/** The fields of the `CoverFade` component. @experimental */
interface CoverFadeData {
    /** The sprite's alpha, as a share of its own, while something stands under it. 0 is gone, 1 is no fade. */
    opacity: number;
    /** Seconds the fade takes, either way. */
    fadeTime: number;
    /** Ground around the sprite's edge, in world units, that counts as under it: the fade starts as a target steps up to the edge, not after it is in. */
    margin: number;
    /** The covered ground is the ellipse inside the sprite's rectangle, not the whole rectangle: a tree crown, not a roof. */
    round: boolean;
    /** Off: the sprite stays as authored. */
    enabled: boolean;
}
/**
 * Makes the sprite on this entity thin out while a `CoverFadeTarget` stands under it.
 *
 * @experimental
 */
declare const CoverFade: ComponentDef<CoverFadeData>;
/** Marks what a `CoverFade` keeps visible: the player, and anything else that must not be hidden. @experimental */
declare const CoverFadeTarget: ComponentDef<{}>;
/**
 * The ground a sprite covers: its rectangle's centre and half extents, from its size and pivot under the entity's scale. The pivot is where the
 * entity's position sits in the sprite (0.5 is the middle). Rotation is not read.
 */
declare function coveredGround(sprite: SpriteData, transform: TransformData): {
    centre: {
        x: number;
        y: number;
    };
    half: {
        x: number;
        y: number;
    };
};
/** Whether the point (px, py) is on the ground a sprite covers. */
declare function coversPoint(px: number, py: number, centre: {
    x: number;
    y: number;
}, half: {
    x: number;
    y: number;
}, margin: number, round: boolean): boolean;
/** The share of its alpha a sprite shows after `dt`, moving from `current` toward `goal` in `fadeTime` seconds. */
declare function stepFade(current: number, goal: number, dt: number, fadeTime: number): number;

/**
 * @file  blobShadow.ts
 * @brief A soft dark disc on the ground under a thing: the cheapest shadow there is, and often the one a phone can afford.
 *
 * A real shadow is a map drawn from the light and read back by every pixel; a blob shadow is one disc of vertex colour lying on the ground,
 * drawn once, with no map, no light and no extra pass. It says "this stands here" and "this is this high" (the disc fades and shrinks as the
 * thing leaves the ground), which is most of what a shadow tells a player. It is NOT the light's shadow: it does not stretch with the sun, fall
 * across steps, or land on a wall.
 *
 * The component goes on the thing that casts. A disc is made for it (an entity of its own, never saved with the scene) and put on the ground
 * under it each frame. The ground is a height (`groundY`), or a function of where the thing stands ({@link setBlobShadowGround}) for a ground
 * that is not flat.
 */

/** The fields of the `BlobShadow` component. @experimental */
interface BlobShadowData {
    enabled: boolean;
    /** Radius of the disc where the thing stands on the ground, in world units. */
    radius: number;
    /** How dark the disc is at its centre, 0 to 1. */
    opacity: number;
    /** How soft its edge is: 0 a hard-edged disc, 1 a disc that fades from its centre. */
    softness: number;
    /** Height of the flat ground, in world units, when no ground function is set. */
    groundY: number;
    /** How far above the ground the thing may be before its shadow is gone. 0 never fades it. */
    fadeHeight: number;
    /** How small the disc is at that height, as a share of its size on the ground: 0 keeps its size, 1 shrinks it to nothing. */
    shrink: number;
    /** How far above the ground the disc is drawn, so it does not flicker against it. */
    lift: number;
}
/**
 * Puts a soft shadow disc on the ground under the entity.
 * @experimental
 */
declare const BlobShadow: ComponentDef<BlobShadowData>;
/** Where the ground is under a point, for a ground that is not flat: its height there, or null where there is none (the flat `groundY` is used). @experimental */
type BlobShadowGround = (x: number, z: number) => number | null;
/** Sets how the ground height is found under each blob shadow; `null` goes back to each shadow's own `groundY`. @experimental */
declare function setBlobShadowGround(app: App, sample: BlobShadowGround | null): void;
/**
 * A unit disc lying in the XZ plane (normal up), its vertex colour black and its alpha falling from the centre to the edge as `softness` says.
 * A resident mesh and not a MeshRenderer's inline geometry: the inline path is drawn in the XY plane only (it turns about Z and no other axis),
 * and a shadow lies on the ground.
 * @experimental
 */
declare function buildBlobMesh(softness: number): MeshData;
/** The alpha at a vertex of a blob mesh, 0 to 1. @experimental */
declare function blobAlpha(mesh: MeshData, vertex: number): number;

/** Top-level canvases in input order; parentOf returns null for absent or invalid parents. @experimental */
declare function canvasRootEntities<T>(entities: readonly T[], parentOf: (entity: T) => T | null): T[];

/**
 * Whether the pointer passes through @p entity because of `UINode.pointerEvents`:
 * the nearest node, itself first, whose value is not Auto decides — None lets the
 * pointer through, Receive takes it back (CSS `pointer-events: auto` written on a
 * child). The rule the engine's layout applies; this is it for code that asks
 * between layouts.
 */
declare function isPointerBlockedInTree(world: Pick<World, 'has' | 'get' | 'valid'>, entity: Entity): boolean;

/**
 * @file    ui/core/dimension.ts
 * @brief   Dimension — a CSS-style length (value + unit) for the runtime UI box
 *          model.
 *
 * One field can be pixels, a percentage of the parent, or content-driven (auto),
 * replacing the old size/offset/`-1`-sentinel scheme. The on-wire shape matches
 * the C++ `Dimension` struct serialized by the EHT codegen (`{ value, unit }`,
 * `unit` an integer); these helpers give it a typed, ergonomic authoring API.
 */
/** How a {@link Dimension}'s `value` is interpreted. Mirrors the C++ u8 unit.
 *  @public */
declare const DimensionUnit: {
    /** Absolute pixels. */
    readonly Px: 0;
    /** Percentage of the parent's corresponding axis (0..100). */
    readonly Percent: 1;
    /** Content-/layout-driven; `value` is ignored. */
    readonly Auto: 2;
};
/** @public */
type DimensionUnit = (typeof DimensionUnit)[keyof typeof DimensionUnit];
/**
 * A CSS-style length. Plain data matching the generated `Dimension` struct, so it
 * crosses to the engine as memory rather than being converted.
 *
 * @public
 */
interface Dimension {
    value: number;
    unit: number;
}
/** `n` pixels — a design pixel, which at the project's design resolution is one
 *  screen pixel and scales with it thereafter.
 *  @public */
declare const px: (n: number) => Dimension;
/** `n` percent of the parent axis (0..100), not a 0..1 fraction.
 *  @public */
declare const percent: (n: number) => Dimension;
/** Content-/layout-driven length (Yoga `auto`); `value` is ignored. Not frozen
 *  with its two siblings: no certified game asks for one. */
declare const auto: () => Dimension;
/** True when the dimension is the content-/layout-driven `auto` length. */
declare const isAuto: (d: Dimension) => boolean;

interface UINodeData {
    /** Relative (flex flow) or Absolute (placed by inset). */
    position: number;
    /** CSS `display` (UIDisplay). None removes this node AND its whole subtree
     *  from layout, rendering and hit-testing — the hierarchical show/hide.
     *  Contrast with UIVisual.enabled, which hides only this entity's visual. */
    display: number;
    /** Subtree opacity, multiplied down the tree like CSS `opacity` — the knob
     *  that fades a whole panel. Multiplies into each descendant's own alpha
     *  rather than compositing the subtree offscreen. */
    opacity: number;
    /** CSS `pointer-events` (UIPointerEvents). None makes this node AND its
     *  subtree transparent to the pointer: still drawn, hits pass through. */
    pointerEvents: number;
    /** Box size; `auto()` = content-/flex-driven. */
    width: Dimension;
    height: Dimension;
    minWidth: Dimension;
    minHeight: Dimension;
    maxWidth: Dimension;
    maxHeight: Dimension;
    /** Flex grow factor (share of free space; 0 = don't grow). */
    flexGrow: number;
    /** Flex shrink factor (1 = shrink to fit). */
    flexShrink: number;
    /** Base size before grow/shrink; `auto()` = use width/height or content. */
    flexBasis: Dimension;
    /** Per-item cross-axis alignment override (AlignSelf: 0 Auto…4 Stretch). */
    alignSelf: number;
    marginLeft: Dimension;
    marginTop: Dimension;
    marginRight: Dimension;
    marginBottom: Dimension;
    /** Offset from the parent's edges when `position` is Absolute; `auto()` =
     *  that edge is unconstrained. Mirrors CSS left/top/right/bottom. */
    insetLeft: Dimension;
    insetTop: Dimension;
    insetRight: Dimension;
    insetBottom: Dimension;
}
/**
 * A layout box. Under a Canvas its size and position come from the flex layout
 * rather than from Transform, which the layout writes.
 *
 * `@beta`: anchors, insets and the theme tokens beside them are the newest part
 * of the UI, and the corpus reaches thirty-three of a hundred and fifteen UI
 * symbols.
 *
 * @beta
 */
declare const UINode: BuiltinComponentDef<UINodeData>;

/** The fields of the `UIVisual` component, whose tier this shape carries.
 *  @beta */
interface UIVisualData {
    visualType: UIVisualType;
    texture: number;
    color: Color;
    /** CSS `object-fit`: Fill stretches to the box (default), Contain
     *  letterboxes the whole image inside it, Cover fills the box and crops.
     *  Ignored by NineSlice and Tiled, which exist to adapt to the box. */
    fit: UIVisualFit;
    /** Base UV sub-region offset (identity = whole texture). */
    uvOffset: Vec2;
    /** Base UV sub-region scale (identity = whole texture). */
    uvScale: Vec2;
    /** NineSlice border (texture metadata wins when present). */
    sliceBorder: Vec4;
    /** Tiled: texture repeats every tileSize px of the box. */
    tileSize: Vec2;
    /** Filled: axis to crop along. */
    fillMethod: UIFillMethod;
    /** Filled: edge the fill grows from. */
    fillOrigin: UIFillOrigin;
    /** Filled: visible fraction [0,1]. */
    fillAmount: number;
    material: number;
    enabled: boolean;
}
/**
 * What a {@link UINode} draws — a colour, a texture, a nine-slice, a tiled fill
 * or a partial one. The node decides the box; this decides what fills it.
 *
 * @beta
 */
declare const UIVisual: BuiltinComponentDef<UIVisualData>;

interface UIMaskData {
    enabled: boolean;
    mode: MaskMode;
    /** Stencil mode only: above 0, clip to the SHAPE the mask sprite draws
     *  instead of to its box (0, the default, keeps the box). */
    alphaCutoff: number;
}
declare const UIMask: BuiltinComponentDef<UIMaskData>;

/**
 * The layout-pixel domain, centred on the origin. `left`/`right` are what a
 * screen root is placed within; `scale` is how many device pixels one layout
 * pixel covers, which is what a text renderer needs and a camera cannot say.
 */
interface ScreenLayoutData {
    /** False before a viewport is known — nothing has a screen to lay out on. */
    valid: boolean;
    left: number;
    bottom: number;
    right: number;
    top: number;
    /** The same box as the safe area allows: content, not the projection. */
    safeLeft: number;
    safeBottom: number;
    safeRight: number;
    safeTop: number;
    /** Device pixels per layout pixel. */
    scale: number;
    /** The framebuffer this domain projects onto. */
    viewportW: number;
    viewportH: number;
}

/**
 * @file    world-anchor.ts
 * @brief   A UI node that stands over a point in the 3D world: an objective marker, a name over a head, a health bar.
 *
 * @details Placed from the camera's pose as it stands at the end of Update, not from the matrix the camera plugin
 *          resolved at the start of the frame: a first-person view turns in Update, and a marker read off the early
 *          matrix trails the view by a frame and swims as the player looks around.
 */

interface UIWorldAnchorData {
    /** The entity to stand over; 0 = the world point `offset`. */
    target: Entity;
    /** Added to the target's world position (world units); the world point itself when there is no target. */
    offset: Vec3$2;
    /** The camera that looks; 0 = the active camera that clears colour with the highest priority (the view on screen). */
    camera: Entity;
    /** Off screen or behind the camera, stand at the screen's edge in the point's direction instead (an objective marker). */
    clampToEdges: boolean;
    /** How far inside the edge a clamped marker stands, in layout pixels. */
    edgeMargin: number;
    /** Behind the camera and not clamped: hide (display None) rather than stand where the projection mirrors it. */
    hideWhenBehind: boolean;
    /** Read back: the point is in front of the camera and inside the screen. */
    onScreen: boolean;
    /** Read back: the point is behind the camera. */
    behind: boolean;
    /** Read back: world distance from the camera. */
    distance: number;
}
/**
 * Puts the UINode it is on at the screen position of a world point, every frame. The node is placed Absolute, by its
 * left/top insets, in its parent — which is expected to cover the screen (a screen Canvas root or a full-screen
 * panel). Centre it on the point with negative margins of half its size.
 *
 * @experimental
 */
declare const UIWorldAnchor: ComponentDef<UIWorldAnchorData>;
/** The eye a projection is made from: where it is, which way it turns, and its lens. */
interface AnchorLens {
    position: Vec3$2;
    rotation: Quat;
    perspective: boolean;
    /** Vertical field of view, degrees (perspective). */
    fov: number;
    /** Half the visible height, world units (orthographic). */
    orthoSize: number;
    near: number;
}
interface AnchorPlacement {
    /** Layout pixels from the left and from the top of the screen box. */
    left: number;
    top: number;
    onScreen: boolean;
    behind: boolean;
    distance: number;
}
/**
 * Where a world point stands on the screen box, in layout pixels from its top-left corner. Pure: the system below
 * and the tests share it.
 *
 * Behind the eye a perspective projection mirrors the point to the opposite side; a clamped marker is put on the edge
 * in the point's true direction instead.
 */
declare function placeOnScreen(point: Vec3$2, lens: AnchorLens, box: {
    width: number;
    height: number;
}, clamp: boolean, margin: number): AnchorPlacement;

/**
 * @file    ui/layout/anchored-rect.ts
 * @brief   The data and the arithmetic of `RectAnchors`, with nothing of the ECS: an importer places a node the way the engine will
 *          without compiling the engine.
 */
/** Which edges are pinned: the flags of one axis are mutually exclusive between its edges and its centre. */
declare const AnchorFlag: Readonly<{
    TOP: 1;
    MID: 2;
    BOTTOM: 4;
    LEFT: 8;
    CENTER: 16;
    RIGHT: 32;
    HORIZONTAL: number;
    VERTICAL: number;
}>;
declare const AnchorMode: Readonly<{
    ONCE: 0;
    ON_RESIZE: 1;
    ALWAYS: 2;
}>;
interface RectAnchorsData {
    /** The pinned edges, as {@link AnchorFlag} bits. Zero pins nothing. */
    alignFlags: number;
    /** Distance from each pinned edge of the parent rectangle: in layout units, or as a fraction of the parent's size (see the `isAbs…` flags). */
    left: number;
    right: number;
    top: number;
    bottom: number;
    /** Offset from the centre of the parent rectangle, for a centred axis. */
    horizontalCenter: number;
    verticalCenter: number;
    isAbsLeft: boolean;
    isAbsRight: boolean;
    isAbsTop: boolean;
    isAbsBottom: boolean;
    isAbsHorizontalCenter: boolean;
    isAbsVerticalCenter: boolean;
    /** When it aligns: {@link AnchorMode}. */
    alignMode: number;
    enabled: boolean;
}

declare const RectAnchors: ComponentDef<RectAnchorsData>;
/** Align one node now, whatever its mode. Answers whether it had a box to align to. */
declare function alignRectAnchorsNow(world: World, entity: Entity, screen: ScreenLayoutData | null): boolean;

interface FlexContainerData {
    direction: FlexDirection;
    wrap: FlexWrap;
    justifyContent: JustifyContent;
    alignItems: AlignItems;
    alignContent: AlignContent;
    gap: Vec2;
    padding: Padding;
}
declare const FlexContainer: BuiltinComponentDef<FlexContainerData>;

/**
 * @file    ui/layout/anchor.ts
 * @brief   Anchor presets — authoring shortcuts over a UINode's CSS box fields.
 *
 * The box model is CSS (position + inset + margin), so an anchor is NOT stored
 * state: a preset is a derived view that maps to/from the inset/margin/position
 * fields. Keeping the box fields the single source of truth (rather than a
 * redundant anchor enum, as RectTransform engines store) is what makes a preset
 * and the live layout impossible to desync.
 *
 * Each axis resolves independently to one of {@link AnchorAxis}: Start pins the
 * near edge, End the far edge, Stretch pins both edges with the size set to
 * `auto` so the insets drive it, and Center leaves both insets AND both margins
 * `auto` — the engine reads that combination as "centre this out-of-flow node in
 * the parent box", the one anchor a pivot-less CSS box can't express through
 * Yoga alone (Yoga's abspos centring keys off the parent's `justifyContent`, so
 * it can't differ per sibling).
 */

/** Per-axis anchor mode (a preset is one of these per axis). */
declare enum AnchorAxis {
    /** Pin the near edge (left / top). */
    Start = 0,
    /** Centre via `auto` margins on both edges. */
    Center = 1,
    /** Pin the far edge (right / bottom). */
    End = 2,
    /** Pin both edges; the size becomes `auto` so the insets drive it. */
    Stretch = 3
}
/** A 2-D anchor: one {@link AnchorAxis} per axis. */
interface AnchorPreset {
    h: AnchorAxis;
    v: AnchorAxis;
}
/** The four axis modes in row/column order, for building a preset grid. */
declare const ANCHOR_AXES: readonly AnchorAxis[];
/** The UINode fields a preset resolves to. Always sets `position` Absolute plus
 *  the two inset + two margin dimensions per axis; `width`/`height` appear only
 *  for a Stretch axis (so a non-stretch axis preserves the authored size). */
interface AnchorFields {
    position: number;
    insetLeft: Dimension;
    insetRight: Dimension;
    insetTop: Dimension;
    insetBottom: Dimension;
    marginLeft: Dimension;
    marginRight: Dimension;
    marginTop: Dimension;
    marginBottom: Dimension;
    width?: Dimension;
    height?: Dimension;
}
/** Resolve a preset to the UINode box fields that express it. */
declare function anchorPresetFields(preset: AnchorPreset): AnchorFields;
/** Per-axis classification of a UINode's box: each axis resolves independently
 *  to its {@link AnchorAxis}, or null when that axis isn't a clean preset — so a
 *  box with one hand-tuned axis still reads (and can keep) the other. */
declare function detectAnchorAxes(node: UINodeData): {
    h: AnchorAxis | null;
    v: AnchorAxis | null;
};
/** The preset a UINode currently matches, or null (Relative flow, or a custom
 *  box that isn't a clean preset). `detectAnchor(node with anchorPresetFields(p))`
 *  round-trips back to `p`. */
declare function detectAnchor(node: UINodeData): AnchorPreset | null;

interface InteractableData {
    enabled: boolean;
    blockRaycast: boolean;
    raycastTarget: boolean;
}
declare const Interactable: BuiltinComponentDef<InteractableData>;
interface UIInteractionData {
    hovered: boolean;
    pressed: boolean;
    justPressed: boolean;
    justReleased: boolean;
}
declare const UIInteraction: BuiltinComponentDef<UIInteractionData>;
interface WidgetInteractionInit {
    /** Start disabled (Interactable.enabled = false). */
    disabled?: boolean;
    /** Participate in Tab traversal + keyboard activation. Default true. */
    focusable?: boolean;
    /** Tab order within the focus ring. Default 0 (document order). */
    tabIndex?: number;
}
/**
 * The one interaction assembly every widget shares: a raycast-blocking
 * Interactable plus (by default) a Focusable so the control is keyboard-
 * reachable. Per-frame pointer state (UIInteraction) is transient — the
 * hit-test system creates it on demand, widgets never insert it.
 */
declare function makeWidgetInteractable(world: World, entity: Entity, init?: WidgetInteractionInit): void;

interface FocusableData {
    tabIndex: number;
    isFocused: boolean;
}
declare const Focusable: ComponentDef<FocusableData>;
declare class FocusManagerState {
    focusedEntity: Entity | null;
    /**
     * Whether the current focus should be SHOWN — the `:focus-visible` rule the web
     * arrived at, for the same reason.
     *
     * Focus follows a pointer press (so Enter/Space then act on what you clicked),
     * but a clicked control that keeps a focus highlight reads as stuck: the pointer
     * has moved on and the button is still lit, until you click something else. Only
     * keyboard-acquired focus is worth drawing, because only then is the highlight
     * the sole thing telling you where you are.
     *
     * Lives here rather than on {@link Focusable} because it is per-session input
     * state, like hover — authoring it into a scene would mean nothing.
     */
    focusVisible: boolean;
    /** `visible` = acquired by keyboard. Pointer presses pass false. */
    focus(entity: Entity, visible?: boolean): Entity | null;
    blur(): Entity | null;
    /** Whether `entity` holds focus AND that focus should be drawn. */
    isVisiblyFocused(entity: Entity): boolean;
}
declare const FocusManager: ResourceDef<FocusManagerState>;

interface DragStateData {
    isDragging: boolean;
    startWorldPos: {
        x: number;
        y: number;
    };
    currentWorldPos: {
        x: number;
        y: number;
    };
    deltaWorld: {
        x: number;
        y: number;
    };
    totalDeltaWorld: {
        x: number;
        y: number;
    };
    pointerStartWorld: {
        x: number;
        y: number;
    };
}
declare const DragState: ComponentDef<DragStateData>;

interface UIDialogData {
    /** Escape closes the dialog while open. */
    closeOnEscape: boolean;
    /** A click on the backdrop scrim (not the panel) closes the dialog. */
    closeOnBackdrop: boolean;
}
declare const UIDialog: ComponentDef<UIDialogData>;
/** True when the dialog root's subtree is displayed. */
declare function isDialogOpen(world: Pick<World, 'has' | 'get'>, root: Entity): boolean;
/** Show the dialog subtree and emit `change` with the new open state. */
declare function openDialog(world: World, events: EntityEventQueue, root: Entity): void;
/** Hide the dialog subtree and emit `change` with the new open state. */
declare function closeDialog(world: World, events: EntityEventQueue, root: Entity): void;

interface UISliderData {
    min: number;
    max: number;
    /** Quantization step; 0 = continuous. */
    step: number;
    value: number;
    /** The Filled fill bar entity (fillAmount tracks the value fraction). */
    fill: Entity;
    /** The handle thumb entity (insetLeft tracks the value fraction). */
    handle: Entity;
}
declare const UISlider: ComponentDef<UISliderData>;

interface UIToggleData {
    isOn: boolean;
    /** The on-state indicator entity (UIVisual.enabled tracks `isOn`). */
    check: Entity;
}
declare const UIToggle: ComponentDef<UIToggleData>;
interface UIToggleGroupData {
    /** Whether the group may end up with nothing selected. */
    allowSwitchOff: boolean;
}
/**
 * Makes the UIToggles beneath it exclusive — a radio group, a tab bar, a
 * difficulty picker. Sits on the COMMON ANCESTOR, like FlexContainer, so the
 * toggles need no reference to each other or to it.
 */
declare const UIToggleGroup: ComponentDef<UIToggleGroupData>;

/** Ordered, parallel entity lists use the same prefab remapping as MeshSkin.joints. @beta */
interface UITabViewData {
    selectedIndex: number;
    tabs: Entity[];
    pages: Entity[];
    labels: string[];
    allowSwitchOff: boolean;
    vertical: boolean;
    loopNavigation: boolean;
    selectOnFocus: boolean;
}
/** A ToggleGroup with corresponding content pages. No separate selection primitive. @beta */
declare const UITabView: ComponentDef<UITabViewData>;
/** Apply selection without emitting: also used by the editor's ephemeral preview. */
declare function applyTabViewSelection(world: World, root: Entity, index: number): void;

/** Optional authored adapter; runtime TreeDataSource can wrap any project model. @beta */
interface TreeViewNode {
    id: string;
    label: string;
    children?: TreeViewNode[];
    selectable?: boolean;
}
/** Serializable configuration; live adapters and subscriptions remain per world. @beta */
interface UITreeViewData {
    nodes: TreeViewNode[];
    expandedIds: Array<string | number>;
    selectedIds: Array<string | number>;
    selectionMode: number;
    rowHeight: number;
    indent: number;
    dragEnabled: boolean;
    rowPrefab: string;
    emptyPrefab: string;
}
/** One virtualized collection with stable project IDs, not a second UI tree. @beta */
declare const UITreeView: ComponentDef<UITreeViewData>;

/** Canonical RGBA value plus ordinary editable UI children. @beta */
interface UIColorPickerData {
    color: Color;
    alphaEnabled: boolean;
    format: number;
    rememberColors: boolean;
    historyLimit: number;
    history: Color[];
    sv: Entity;
    alphaRamp: Entity;
    cursor: Entity;
    hue: Entity;
    alpha: Entity;
    fields: Entity[];
    hex: Entity;
    historyRoot: Entity;
    rememberButton: Entity;
    preview: Entity;
}
/** HSV is an editing coordinate system; values retain the engine's Color semantics. @beta */
declare const UIColorPicker: ComponentDef<UIColorPickerData>;

/** Stable application identity, independent of ECS entity IDs. @beta */
type TreeItemId = string | number;
/** Adapt any project model to a tree; mutations and persistence stay with the host. @beta */
interface TreeDataSource<T> {
    getRoots(): readonly T[];
    getChildren(item: T): readonly T[];
    getId(item: T): TreeItemId;
    getLabel(item: T): string;
    isSelectable?(item: T): boolean;
    subscribe?(listener: () => void): Unsubscribe;
}
/** A visible row projected into the existing virtualized ListView. @beta */
interface TreeRow<T> {
    readonly id: TreeItemId;
    readonly item: T;
    readonly parentId: TreeItemId | null;
    readonly depth: number;
    readonly hasChildren: boolean;
    readonly expanded: boolean;
    readonly selectable: boolean;
    readonly selected: boolean;
}
/** A drop is a request, never an implicit mutation of the host model. @beta */
interface TreeDropRequest<T> {
    readonly source: TreeRow<T>;
    readonly target: TreeRow<T>;
    readonly position: 'before' | 'inside' | 'after';
}
/** Iterative traversal handles deep trees; stable IDs retain state through reorder. @beta */
declare class TreeViewModel<T> implements DataSource<TreeRow<T>> {
    readonly source: TreeDataSource<T>;
    private rows_;
    private nodes_;
    private children_;
    private expanded_;
    private selected_;
    private readonly listeners_;
    private readonly off_;
    private disposed_;
    constructor(source: TreeDataSource<T>, expanded?: readonly TreeItemId[]);
    getCount(): number;
    getItem(index: number): TreeRow<T>;
    getItemId(_index: number, row: TreeRow<T>): TreeItemId;
    getNode(id: TreeItemId): TreeRow<T> | undefined;
    indexOf(id: TreeItemId): number;
    get expandedIds(): readonly TreeItemId[];
    get selectedIds(): readonly TreeItemId[];
    subscribe(listener: (change: DataSourceChange) => void): Unsubscribe;
    /** Build transactionally: invalid IDs/cycles leave the previous projection intact. */
    refresh(): void;
    setExpanded(ids: readonly TreeItemId[]): void;
    toggle(id: TreeItemId): void;
    select(ids: readonly TreeItemId[], mode?: number): void;
    isSelected(id: TreeItemId): boolean;
    /** Reveal ancestors without forcing any project-specific selection policy. */
    reveal(id: TreeItemId): void;
    canDrop(request: TreeDropRequest<T>): boolean;
    dispose(): void;
    private project_;
    private emit_;
}

/**
 * @file    ui/core/compose.ts
 * @brief   Composition sugar over the Layer-1 primitives: build full component
 *          literals from sparse inits, and spawn a UI entity in one call.
 *
 * Lives in core (not widgets) because everything that assembles UI needs it —
 * widget factories, the text-input plugin, and behavior systems that build
 * transient subtrees (a dropdown popup). Pure over L1 components only.
 */

interface UINodeInit {
    /** Stretch to fill the parent (absolute + inset 0 on all edges). */
    fill?: boolean;
    /** UIPositionType: Relative (flex flow) or Absolute (placed by inset). */
    position?: number;
    /** Subtree opacity (CSS `opacity`), multiplied down the tree. */
    opacity?: number;
    /** UIPointerEvents: None makes this node and its subtree click-through. */
    pointerEvents?: number;
    width?: Dimension;
    height?: Dimension;
    insetLeft?: Dimension;
    insetTop?: Dimension;
    insetRight?: Dimension;
    insetBottom?: Dimension;
    flexGrow?: number;
    flexShrink?: number;
    marginLeft?: Dimension;
    marginTop?: Dimension;
    marginRight?: Dimension;
    marginBottom?: Dimension;
}
/**
 * Build a UINode (CSS box). `fill: true` is the common widget case
 * (stretch to the parent); otherwise set width/height and/or inset. Anchoring
 * (e.g. top-right) = position Absolute + the relevant insets.
 */
declare function buildUINode(init?: UINodeInit): UINodeData;
interface UIVisualInit {
    visualType?: UIVisualType;
    texture?: number;
    color?: {
        r: number;
        g: number;
        b: number;
        a: number;
    };
    /** CSS `object-fit` (UIVisualFit). Default Fill. */
    fit?: UIVisualFit;
    uvOffset?: Vec2;
    uvScale?: Vec2;
    sliceBorder?: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
    tileSize?: Vec2;
    fillMethod?: UIFillMethod;
    fillOrigin?: UIFillOrigin;
    fillAmount?: number;
    material?: number;
    enabled?: boolean;
}
declare function buildUIVisual(init?: UIVisualInit): UIVisualData;
/** The edge a partial fill grows toward, for widgets built on `Filled`. */
type LinearFillDirection = 'right' | 'left' | 'up' | 'down';
/**
 * direction → the `Filled` visual's crop axis + anchor edge (grows along
 * `direction`, cropped from the opposite edge). The one canonical table for
 * progress, slider, and future Filled widgets.
 */
declare const FILL_AXIS: Record<LinearFillDirection, readonly [UIFillMethod, UIFillOrigin]>;
interface TextInit extends Partial<TextData> {
}
declare function buildText(init?: TextInit): TextData;
interface UIEntityInit {
    world: World;
    parent?: Entity;
    /** CSS-box layout (defaults to fill the parent). */
    node?: UINodeInit;
    visual?: UIVisualInit;
    text?: TextInit;
}
/**
 * Spawn a UI entity — Transform and UINode always, UIVisual and Text when the
 * init asks for them, parented when it names a parent. Every built-in widget is
 * composed from this, so a hand-built node and a widget are the same thing.
 *
 * @beta
 */
declare function spawnUIEntity(init: UIEntityInit): Entity;
/**
 * Toggle visibility of a UI entity via UIVisual.enabled. Safe if the
 * entity has no UIVisual — no-op in that case.
 */
declare function setUIVisible(world: World, entity: Entity, visible: boolean): void;

/**
 * @file    list-view.ts
 * @brief   createListView — the ergonomic widget factory over the collection core.
 *
 * A one-call, data-driven, virtualized list/grid that composes the existing
 * primitives (DataSource + LayoutProvider + ViewPool + ListView + ScrollContainer
 * + UIMask) — matching the createButton/createDialog factory-and-handle shape.
 *
 * Items are positioned by UINode Absolute inset (not Transform, which the UI
 * layout owns); the content frame is translated by the scroll offset; a
 * Scissor UIMask on the viewport clips. Wheel and drag/touch scrolling (with
 * a kinetic fling) are handled by the behavior plugin once the viewport is a
 * hovered raycast target.
 */

/**
 * The per-frame runtime a list view plugs into: the tick registry that drives
 * virtualization and the scroll input hookup. The composed `uiPlugin` (and the
 * granular `uiBehaviorPlugin`) satisfy this — passed explicitly so the factory
 * works against whichever plugin instance owns the app, never a module
 * singleton.
 */
interface ListViewHost {
    registerListView(list: ListView<unknown>): void;
    unregisterListView(list: ListView<unknown>): void;
    attachScrollContainer(entity: Entity, container: ScrollContainer): void;
    detachScrollContainer(entity: Entity): void;
}
/** A single item type: how to build the entity and how to bind data to it. */
interface ListItemTemplate<T> {
    /** Create one item entity (use `spawnUIEntity` so it carries a UINode). */
    create: (world: World, parent: Entity) => Entity;
    /** Apply data to an item; called on every (re)bind, so keep it idempotent. */
    bind: (entity: Entity, data: T, index: number) => void;
}
/** Layout sugar. A column list, a row list, or a grid (`columns`). */
type ListLayoutSpec = {
    itemHeight: number | ((index: number) => number);
    spacing?: number;
    direction?: 'column';
} | {
    itemWidth: number;
    spacing?: number;
    direction: 'row';
} | {
    columns: number;
    itemSize: Vec2;
    spacing?: Vec2;
};
interface CreateListViewOptions<T> {
    world: World;
    /** The plugin that ticks virtualization + routes scroll input (`uiPlugin`). */
    host: ListViewHost;
    parent?: Entity;
    /** Initial UI layout size; virtualization and scroll bounds follow the resolved box. */
    viewportSize: Vec2;
    /** Extra viewport UINode props (its size defaults to `viewportSize`). */
    node?: UINodeInit;
    /** Viewport background. Default: a transparent hit-target (so the wheel works). */
    background?: UIVisualInit;
    /** Backing data — a `DataSource<T>` or a raw array (wrapped in an ArrayDataSource). */
    data: DataSource<T> | readonly T[];
    /** Layout sugar (`itemHeight` / `columns` …) or a full `LayoutProvider`. */
    layout: ListLayoutSpec | LayoutProvider;
    /** One template, or a map of item type → template for heterogeneous rows. */
    item: ListItemTemplate<T> | Record<string, ListItemTemplate<T>>;
    /** Scroll axis. Defaults from the layout (column→vertical, row→horizontal). */
    direction?: 'vertical' | 'horizontal' | 'both';
    /** Extra indices kept mounted on each side of the visible range. Default 2. */
    recycleBuffer?: number;
    /** Wheel delta multiplier. Default 1. */
    wheelSpeed?: number;
    /** Drag/touch scrolling with a kinetic fling. Default true. */
    dragScroll?: boolean;
    /** Fling velocity fraction left after 1s of coasting. Default 0.135. */
    decelerationRate?: number;
    /** Called after each item bind. */
    onItemBound?: (entity: Entity, data: T, index: number) => void;
}
interface ListViewHandle<T> {
    /** The viewport entity (the clipped window; add it to your UI tree). */
    readonly entity: Entity;
    /** The scrolling content frame that items are parented to. */
    readonly content: Entity;
    /** The data source — mutate an `ArrayDataSource` here to update the list. */
    readonly data: DataSource<T>;
    /** The scroll model (escape hatch: `scroll.scrollBy`, `onScroll`, …). */
    readonly scroll: ScrollContainer;
    /** The virtualization driver (escape hatch). */
    readonly view: ListView<T>;
    /** Force a re-sync of mounted items on the next frame. */
    refresh(): void;
    /** Scroll so item `index` is at the top-left of the viewport. */
    scrollToIndex(index: number): void;
    /** Number of item entities currently mounted (for virtualization checks). */
    mountedCount(): number;
    /** Tear down: unregister, release items, drop scroll/data subscriptions. */
    dispose(): void;
}
/**
 * Build a virtualized list (or grid) in one call.
 *
 * @example
 * const list = createListView<Player>({
 *   world, parent, viewportSize: { x: 320, y: 480 },
 *   data: arrayDataSource(players),
 *   layout: { itemHeight: 56 },
 *   item: {
 *     create: (w, parent) => spawnUIEntity({ world: w, parent, node: { height: px(56) } }),
 *     bind: (e, p) => setText(e, p.name),
 *   },
 * });
 * list.data.append([newPlayer]);   // auto-refreshes
 */
declare function createListView<T>(opts: CreateListViewOptions<T>): ListViewHandle<T>;

/** Generic data, optional custom row template, and host-owned drop policy. @beta */
interface TreeViewOptions<T = TreeViewNode> {
    world: World;
    events: EntityEventQueue;
    parent?: Entity;
    node?: UINodeInit;
    data?: TreeDataSource<T>;
    nodes?: TreeViewNode[];
    settings?: Partial<Omit<UITreeViewData, 'nodes'>>;
    item?: ListItemTemplate<TreeRow<T>>;
    /** A custom template can nominate its drag grip; the rest of the row scrolls. */
    dragHandle?: (rowEntity: Entity) => Entity;
    canDrop?: (request: TreeDropRequest<T>) => boolean;
    onDrop?: (request: TreeDropRequest<T>) => void;
    onChange?: (ids: readonly TreeItemId[]) => void;
}
/** Stable identity and explicit refresh keep application data authoritative. @beta */
interface TreeViewHandle<T = TreeViewNode> {
    readonly entity: Entity;
    getModel(): TreeViewModel<T> | undefined;
    refresh(): void;
    reveal(id: TreeItemId): void;
    dispose(): void;
}
/** Bind project data to an authored TreeView; disposal restores the previous adapter. @beta */
declare function setTreeViewData<T>(world: World, entity: Entity, data: TreeDataSource<T>, options?: Pick<TreeViewOptions<T>, 'item' | 'dragHandle' | 'canDrop' | 'onDrop'>): () => void;
/** Factories and authored prefabs enter the same composed UI runtime. @beta */
declare function createTreeView<T = TreeViewNode>(opts: TreeViewOptions<T>): TreeViewHandle<T>;

/** Explicit callbacks bind the same picker to UI, sprites, materials, or project data. @beta */
interface ColorPickerOptions {
    world: World;
    events: EntityEventQueue;
    parent?: Entity;
    node?: UINodeInit;
    color?: Color;
    alphaEnabled?: boolean;
    format?: number;
    history?: readonly Color[];
    historyLimit?: number;
    rememberColors?: boolean;
    onChange?: (color: Color) => void;
    onHistoryChange?: (colors: readonly Color[]) => void;
}
/** No implicit target mutation or global history storage. @beta */
interface ColorPickerHandle {
    readonly entity: Entity;
    getColor(): Color;
    setColor(color: Color): void;
    dispose(): void;
}
/** The picker composes existing TextInput, Slider and Button controls. @beta */
declare function createColorPicker(opts: ColorPickerOptions): ColorPickerHandle;

/** Trigger and layout settings for an engine UI tooltip. @beta */
interface UITooltipData {
    content: string;
    stylePrefab: string;
    hover: boolean;
    focus: boolean;
    longPress: boolean;
    hoverDelay: number;
    longPressDelay: number;
    /** 0 bottom, 1 top, 2 left, 3 right. */
    side: number;
    gap: number;
    avoidEdges: boolean;
    maxWidth: number;
}
/** An input-transparent, themed engine UI popup attached to a target. @beta */
declare const UITooltip: ComponentDef<UITooltipData>;
/** Ephemeral authoring preview; never changes scene data or authored delays. @experimental */
declare function previewTooltip(world: World, target: Entity): () => void;

/** Creation options for a composed tab view. @beta */
interface TabViewOptions {
    world: World;
    events: EntityEventQueue;
    parent?: Entity;
    node?: UINodeInit;
    labels: readonly string[];
    selectedIndex?: number;
    tabHeight?: number;
    onChange?: (index: number, page: Entity) => void;
}
/** A composed view and its editable children. @beta */
interface TabViewHandle {
    readonly entity: Entity;
    readonly tabs: readonly Entity[];
    readonly pages: readonly Entity[];
    select(index: number): void;
    dispose(): void;
}
/** Ordinary editable Toggles and content entities, captured by the widget prefab generator. @beta */
declare function createTabView(opts: TabViewOptions): TabViewHandle;

/** Attach to an existing control without changing its input configuration. @beta */
declare function attachTooltip(world: World, target: Entity, options?: Partial<UITooltipData>): void;
/** Creation options for a tooltip example target. @beta */
interface TooltipOptions {
    world: World;
    parent?: Entity;
    node?: UINodeInit;
    content?: string;
    settings?: Partial<UITooltipData>;
}
/** A tooltip target with explicit lifetime. @beta */
interface TooltipHandle {
    readonly entity: Entity;
    dispose(): void;
}
/** Palette example target. The popup is generated by the behavior at runtime. @beta */
declare function createTooltip(opts: TooltipOptions): TooltipHandle;

interface UIDropdownData {
    /** Display labels, one per option. */
    options: string[];
    selectedIndex: number;
    /** Popup row height in px. */
    optionHeight: number;
    /** The button's label Text entity (content tracks the selection). */
    label: Entity;
}
declare const UIDropdown: ComponentDef<UIDropdownData>;
declare function isDropdownOpen(world: World, e: Entity): boolean;
declare function closeDropdown(world: World, e: Entity): void;
declare function openDropdown(world: World, events: EntityEventQueue, e: Entity): void;

/** One named enum-state: a page list plus the currently selected page name. */
interface ControllerState {
    /** Controller name, referenced by gears (e.g. "tab", "$interaction"). */
    name: string;
    /** Ordered page names (the enum's members). */
    pages: string[];
    /** Currently selected page name (should be one of `pages`). */
    current: string;
}
interface UIControllerData {
    controllers: ControllerState[];
}
declare const UIController: ComponentDef<UIControllerData>;
/**
 * The built-in controller name driven by pointer state (normal/hover/pressed/
 * disabled). An entity that carries a `$interaction` controller + Interactable
 * gets its button states through gears — the one mechanism for all widget
 * interaction visuals (color/sprite/scale, or any other reflected field).
 */
declare const INTERACTION_CONTROLLER = "$interaction";
/** Canonical interaction pages, in the order the driver prefers them. */
declare const INTERACTION_PAGES: readonly ["normal", "hover", "pressed", "disabled", "focused"];
/** Build an interaction ControllerState (defaults to the 4 canonical pages). */
declare function interactionController(pages?: string[]): ControllerState;
/** Build a plain named ControllerState (current defaults to the first page). */
declare function controllerState(name: string, pages: string[], current?: string): ControllerState;
/**
 * The entity that OWNS the controller named `name`, searching `entity` then its
 * ancestors (nearest wins). Null if no ancestor declares it. This is how a gear
 * on a leaf finds the controller on the UI root.
 */
declare function findControllerOwner(world: World, entity: Entity, name: string): Entity | null;
/** The current page of the nearest controller named `name`, or null if none. */
declare function getControllerPage(world: World, entity: Entity, name: string): string | null;
/**
 * Switch the nearest controller named `name` to `page`. No-op (returns false)
 * when the controller is missing, already on that page, or `page` is not one of
 * its declared pages (a guard against typos silently doing nothing visible).
 */
declare function setControllerPage(world: World, entity: Entity, name: string, page: string): boolean;

/**
 * @file    Easing.ts
 * @brief   Pure easing math — 1:1 port of C++ EasingFunctions.hpp
 *
 * The EasingType enum values are WASM boundary contract — they must stay
 * in lock-step with src/esengine/animation/TweenData.hpp::EasingType.
 */

interface BezierPoints {
    p1x: number;
    p1y: number;
    p2x: number;
    p2y: number;
}

/**
 * A per-page value. Numbers, colours, and vectors interpolate when the binding
 * has a `tween`; strings, booleans (and anything else) always snap — e.g. a
 * `Text.content` gear that swaps the label per page. Colours/vectors are the
 * whole-field shape (e.g. `UIVisual.color` → a Color), matching how the inspector
 * and serialization store them.
 */
type GearValue = number | boolean | string | Color | Vec2 | Vec3$2;
interface GearTween {
    /** Easing curve applied across the transition (see {@link EasingType}). */
    easing: EasingType;
    /** Transition length in seconds; 0 (or absent tween) = snap. */
    duration: number;
}
interface GearBinding {
    /** Name of the controller (resolved on self → nearest ancestor) that drives this. */
    controller: string;
    /** Target component name (e.g. "UIVisual", "Transform", "UINode"). */
    component: string;
    /** Dot-path within the component data (e.g. "color", "color.a", "scale.x"). */
    property: string;
    /** page name → value; a page absent here leaves the field alone on that page. */
    pages: Record<string, GearValue>;
    /** Optional interpolation on page change; omit for an instant snap. */
    tween?: GearTween;
}
interface UIGearData {
    bindings: GearBinding[];
}
declare const UIGear: ComponentDef<UIGearData>;
/** Builder for a single {@link GearBinding} (keeps example/authoring code terse). */
declare function gearBinding(controller: string, component: string, property: string, pages: Record<string, GearValue>, tween?: GearTween): GearBinding;

/**
 * @file    ui/controller/gear-apply.ts
 * @brief   The systems that turn controller pages into applied field values.
 *
 * Two systems:
 *
 *   • InteractionControllerDriverSystem — writes the `$interaction` controller's
 *     `current` page from pointer state (via `driverStateFor`), so a button
 *     built from UIController + gears gets normal/hover/pressed/disabled for free.
 *   • GearApplySystem — for every UIGear binding, resolves its controller's page,
 *     looks up the page's value, and writes it to the target field, snapping or
 *     tweening. It runs in edit mode too (not play-gated): setting a controller's
 *     `current` in the editor immediately previews that page, for free.
 *
 * The read/write/lerp helpers are pure and exported so unit tests (and a future
 * editor preview path) can exercise the value logic without a World.
 */

/** Read the value at a dot-path (returns undefined if the path doesn't resolve). */
declare function readFieldPath(data: Record<string, unknown>, path: string): unknown;
/**
 * Write `value` at a dot-path. Object values (Color/Vec) are shallow-cloned so a
 * shared authored value never becomes aliased across entities. Returns false
 * (writes nothing) when the path doesn't resolve to an existing leaf.
 */
declare function writeFieldPath(data: Record<string, unknown>, path: string, value: unknown): boolean;

/**
 * @file    ui/binding/signal.ts
 * @brief   Signal — a minimal reactive value, the source side of data binding.
 *
 * A signal holds a value and notifies subscribers when it changes; `bind` (see
 * `bind.ts`) drives a component field from one, replacing the imperative
 * get→mutate→insert loop that updating UI from game state used to require.
 * Push-based (subscribers run on `set`), so there is no per-frame polling.
 */
/** A read-only reactive value. */
interface ReadonlySignal<T> {
    get(): T;
    /** Subscribe to changes; returns an unsubscribe. */
    subscribe(fn: (value: T) => void): () => void;
}
/** A writable reactive value. */
interface Signal<T> extends ReadonlySignal<T> {
    set(value: T): void;
    update(fn: (prev: T) => T): void;
}
/** A reactive value seeded with `initial`. `set` notifies subscribers only when
 *  the value actually changes (`Object.is`), so an unchanged write is free. */
declare function signal<T>(initial: T): Signal<T>;
/** A read-only signal computed from `sources`; recomputes (and notifies) whenever
 *  any source changes. Its subscriptions live for the process — use for
 *  app-lifetime derivations (e.g. `health / maxHealth`). */
declare function derived<T>(sources: ReadonlySignal<unknown>[], compute: () => T): ReadonlySignal<T>;

/**
 * @file    ui/controller/bind-page.ts
 * @brief   bindControllerPage — drive a controller's page from a Signal.
 *
 * The data-layer bridge into a controller: a reactive value (see binding/signal)
 * that names the current page, applied now and on every change. This is the
 * declarative path to a data-driven tab bar / view switcher — set the signal, the
 * controller switches page, and every geared element reflows. Mirrors `bind`
 * (seed + subscribe + auto-dispose on despawn); the target is a controller's
 * `current` rather than a plain component field, so it goes through
 * {@link setControllerPage} instead of a raw insert.
 */

/**
 * Bind `source` (a page name) to the nearest controller named `controller`
 * (self → ancestors from `entity`): applied now and on every change. Unknown
 * pages/controllers are ignored (see {@link setControllerPage}); the binding tears
 * itself down when `entity` despawns. Returns a dispose to unbind early.
 */
declare function bindControllerPage(world: World, entity: Entity, controller: string, source: ReadonlySignal<string>): () => void;

/**
 * @file    ui/collection/kinetic-scroll.ts
 * @brief   KineticScroll — the pure velocity model behind drag/touch scrolling:
 *          EMA-smoothed sampling while held, exponential decay after release.
 *          Like {@link ScrollContainer}, it has no input or ECS knowledge.
 */

interface KineticScrollOptions {
    /** Fling velocity left after 1s of coasting (`v *= rate^dt`). Default 0.135. */
    decelerationRate?: number;
    /** Speed floor (px/s) below which coasting stops. Default 4. */
    restVelocity?: number;
    /** Per-second EMA rate for velocity samples (`1 - e^(-rate·dt)`). Default 12. */
    sampleRate?: number;
}
declare class KineticScroll {
    private readonly decayLog_;
    private readonly restVelocity_;
    private readonly sampleRate_;
    private velocity_;
    private dragging_;
    constructor(opts?: KineticScrollOptions);
    /** A finger/pointer grabbed the content: cancel any coast, start sampling. */
    beginDrag(): void;
    /** Feed one frame's offset delta (px) while the drag is held. */
    sample(delta: Vec2, dt: number): void;
    /** Release: the sampled velocity carries over into coasting. */
    endDrag(): void;
    /** Hard stop (new grab, wheel input, or hitting a clamp edge). */
    stop(): void;
    /** Kill one axis of the coast (that axis hit its clamp edge). */
    killAxis(axis: 'x' | 'y'): void;
    isDragging(): boolean;
    /** Coasting = released with speed above the rest floor. */
    isCoasting(): boolean;
    getVelocity(): Vec2;
    /**
     * Advance one coast frame: returns the offset delta to apply and decays
     * the velocity. Zero vector when not coasting.
     */
    tick(dt: number): Vec2;
}

/**
 * @file    ui/controller/interaction-gears.ts
 * @brief   Fold per-state visual overrides into `$interaction` gear bindings.
 *
 * Controller-layer sugar shared by every consumer that authors interaction
 * visuals — the button/toggle factories and the dropdown popup rows built by
 * the behavior system.
 */

/**
 * Visual overrides for a single interaction state. Omitted fields leave the
 * live value alone on that state (the gear's sparse-page semantics).
 */
interface ButtonStateVisual {
    color?: Color;
    sprite?: number;
    scale?: number;
}

interface ButtonOptions {
    world: World;
    events: EntityEventQueue;
    parent?: Entity;
    /** CSS-box layout. Default: fill the parent. */
    node?: UINodeInit;
    /** Background renderer config. Default: solid white quad. */
    background?: UIVisualInit;
    /** Label text. Omit to skip spawning a child label entity. */
    text?: string | TextInit;
    /**
     * Map of state name (e.g. "normal", "hover", "pressed", "disabled")
     * to its visual override. The `$interaction` driver writes the four
     * canonical state names; callers may add more (e.g. "loading") and
     * flip them manually via `setButtonState`. Omit to default to the
     * active theme's control roles ({@link themeButtonStates}).
     */
    states?: Record<string, ButtonStateVisual>;
    /** Tween time for color/scale state changes. Default 0 (snap). */
    fadeDuration?: number;
    /** Start in the disabled state (Interactable.enabled = false). */
    disabled?: boolean;
    /** Participate in Tab traversal + Enter/Space activation. Default true. */
    focusable?: boolean;
    /** Tab order within the focus ring. Default 0 (document order). */
    tabIndex?: number;
    onClick?: (entity: Entity) => void;
    /** Run `onClick` inside the host's own release event rather than on the next
     *  frame, for a call a host accepts only from a player's gesture (sharing a
     *  recording on WeChat). */
    userGesture?: boolean;
}
interface ButtonHandle {
    readonly entity: Entity;
    setDisabled(disabled: boolean): void;
    dispose(): void;
}
/** The canonical button state colors from the active theme's control roles —
 *  `createButton`'s default when the caller passes no `states`. `disabled` reuses
 *  the resting control fill at reduced alpha. */
declare function themeButtonStates(): Record<string, ButtonStateVisual>;
/**
 * Spawn a clickable button entity composed of Interactable + a `$interaction`
 * UIController + UIGear state bindings, optionally with a child Text label.
 *
 * Click comes straight from the interaction layer's `click` event (released
 * while still over the button); the handler is gated on Interactable.enabled.
 */
declare function createButton(opts: ButtonOptions): ButtonHandle;
/**
 * Imperatively set a button's `$interaction` page. Useful for custom states
 * like "loading" that the pointer driver does not manage — the driver leaves
 * any non-canonical page alone until user code switches back.
 */
declare function setButtonState(world: World, entity: Entity, state: string): void;

interface TextInputOptions {
    world: World;
    events: EntityEventQueue;
    parent?: Entity;
    /** CSS-box layout. Default: 220×32. */
    node?: UINodeInit;
    value?: string;
    placeholder?: string;
    /** Catalog key for the empty-field hint; requires a Localization resource. */
    placeholderI18nKey?: string;
    fontFamily?: string;
    /** Default: the theme's label size. */
    fontSize?: number;
    /** 0 = unlimited. */
    maxLength?: number;
    password?: boolean;
    multiline?: boolean;
    readOnly?: boolean;
    /** Inner horizontal padding in px. Default 6. */
    padding?: number;
    /** Glyph pipeline for the field text. Default Auto (bitmap unscaled, SDF scaled). */
    renderMode?: TextRenderMode;
    /** Text / background / placeholder color overrides (theme roles otherwise). */
    color?: Color;
    backgroundColor?: Color;
    placeholderColor?: Color;
    disabled?: boolean;
    tabIndex?: number;
    /** Fires on every edit. */
    onChange?: (value: string, entity: Entity) => void;
    /** Fires on Enter (single-line). */
    onSubmit?: (value: string, entity: Entity) => void;
}
interface TextInputHandle {
    readonly entity: Entity;
    getValue(): string;
    setValue(value: string): void;
    dispose(): void;
}
/**
 * Single-call editable text field over the {@link TextInput} component and its
 * SDF input plugin (focus, caret, IME gate, clipboard, password masking).
 * Colors default to theme roles and re-resolve on `switchTheme`.
 */
declare function createTextInput(opts: TextInputOptions): TextInputHandle;

/**
 * @file    scroll-view.ts
 * @brief   createScrollView — a clipped, scrollable panel for arbitrary content.
 *
 * The non-virtualized sibling of createListView: a Scissor-masked viewport
 * whose content frame is translated by a ScrollContainer (wheel + drag/touch
 * with kinetic fling, driven by the behavior plugin). Parent anything under
 * `content`; sizes are explicit because scroll math needs them up front.
 */

interface ScrollViewOptions {
    world: World;
    /** The plugin that routes scroll input (`uiPlugin`). */
    host: ListViewHost;
    parent?: Entity;
    /** Pixel size of the visible window. */
    viewportSize: Vec2;
    /** Pixel size of the scrollable content frame. */
    contentSize: Vec2;
    /** Extra viewport UINode props (its size defaults to `viewportSize`). */
    node?: UINodeInit;
    /** Viewport background. Default: a transparent hit-target (so the wheel works). */
    background?: UIVisualInit;
    /** Scroll axis. Default 'vertical'. */
    direction?: 'vertical' | 'horizontal' | 'both';
    /** Wheel delta multiplier. Default 1. */
    wheelSpeed?: number;
    /** Drag/touch scrolling with a kinetic fling. Default true. */
    dragScroll?: boolean;
    /** Fling velocity fraction left after 1s of coasting. Default 0.135. */
    decelerationRate?: number;
    onScroll?: (offset: Vec2) => void;
}
interface ScrollViewHandle {
    /** The viewport entity (the clipped window; add it to your UI tree). */
    readonly entity: Entity;
    /** The scrolling content frame — parent your content here. */
    readonly content: Entity;
    /** The scroll model (escape hatch: `scrollBy`, `onScroll`, …). */
    readonly scroll: ScrollContainer;
    scrollTo(offset: Vec2): void;
    /** Update the scroll range after content changes size. */
    setContentSize(size: Vec2): void;
    dispose(): void;
}
declare function createScrollView(opts: ScrollViewOptions): ScrollViewHandle;

interface ToggleOptions {
    world: World;
    events: EntityEventQueue;
    parent?: Entity;
    node?: UINodeInit;
    /** Background renderer for the frame. */
    background?: UIVisualInit;
    /** Interaction states (normal / hover / pressed / disabled) for the frame.
     *  Defaults to the active theme's control roles (as createButton). */
    interactionStates?: Record<string, ButtonStateVisual>;
    /**
     * Optional rendering for the on-state indicator ("check mark").
     * A child entity hidden when off, shown when on. Fills the parent by
     * default; override via `check.node`.
     */
    check?: {
        node?: UINodeInit;
        color?: Color;
        sprite?: number;
    };
    /** Initial on/off state. */
    isOn?: boolean;
    /** Start disabled. */
    disabled?: boolean;
    /** Participate in Tab traversal + Enter/Space activation. Default true. */
    focusable?: boolean;
    tabIndex?: number;
    onChange?: (isOn: boolean, entity: Entity) => void;
}
interface ToggleHandle {
    readonly entity: Entity;
    getValue(): boolean;
    setValue(value: boolean): void;
    setDisabled(disabled: boolean): void;
    dispose(): void;
}
/**
 * Compose a Toggle from a Button (interaction + visual states) plus a
 * separate child entity driven by `isOn` for the check-mark visual.
 * State + flipping live in the {@link UIToggle} component and its behavior
 * system — click, `setValue`, a binding, or the editor inspector all flip the
 * indicator and emit `change` identically.
 */
declare function createToggle(opts: ToggleOptions): ToggleHandle;

interface ProgressOptions {
    world: World;
    parent?: Entity;
    node?: UINodeInit;
    /** Background (track) renderer. */
    background?: UIVisualInit;
    /** Fill renderer config (the filled bar). */
    fill?: {
        color?: Color;
        sprite?: number;
    };
    /** Direction the fill grows (linear bars). Default: 'right'. */
    direction?: LinearFillDirection;
    /** Radial gauge: a clockwise wedge from 12 o'clock; `direction` is ignored. */
    radial?: boolean;
    /** Initial progress 0..1. Default 0. */
    value?: number;
}
interface ProgressHandle {
    readonly entity: Entity;
    readonly fillEntity: Entity;
    getValue(): number;
    setValue(v: number): void;
    dispose(): void;
}
/**
 * Linear progress bar. Two entities: a track (background) and a fill child
 * that stretches over the track as a {@link UIVisualType.Filled} visual —
 * `setValue` writes `fillAmount`, so the bar is a render-time crop with no
 * per-frame layout pass, and a sprite fill reveals (not stretches). Direction
 * selects the fill axis/origin.
 */
declare function createProgress(opts: ProgressOptions): ProgressHandle;

interface DialogOptions {
    world: World;
    events: EntityEventQueue;
    parent?: Entity;
    /** Full-viewport backdrop. Default: fill the parent. */
    backdropNode?: UINodeInit;
    /** Backdrop visuals. Default: themed scrim. */
    backdropVisual?: UIVisualInit;
    /** Panel box (the modal). Default: 400x300 centered. */
    panelNode?: UINodeInit;
    panelVisual?: UIVisualInit;
    /** Start hidden. Default true. */
    startHidden?: boolean;
    /** Escape closes the dialog. Default true. */
    closeOnEscape?: boolean;
    /** Clicking the backdrop scrim (not the panel) closes the dialog. Default true. */
    closeOnBackdrop?: boolean;
    /** Fires on every open/close, whoever initiated it (code, Escape, scrim). */
    onOpenChange?: (open: boolean) => void;
}
interface DialogHandle {
    readonly entity: Entity;
    readonly panelEntity: Entity;
    isOpen(): boolean;
    open(): void;
    close(): void;
    dispose(): void;
}
/**
 * Modal dialog: a backdrop scrim (blocks clicks behind it) with a centered
 * panel child. Hidden by default; open state IS the backdrop root's
 * `UINode.display`, so hiding removes the whole subtree — including anything
 * the caller parents under `panelEntity` — from layout, rendering and input.
 *
 * Dismissal (Escape / scrim click) is data-driven by the {@link UIDialog}
 * component, so a dialog instantiated from a prefab behaves without code.
 */
declare function createDialog(opts: DialogOptions): DialogHandle;

interface SliderOptions {
    world: World;
    events: EntityEventQueue;
    parent?: Entity;
    node?: UINodeInit;
    min?: number;
    max?: number;
    value?: number;
    /**
     * Optional quantization step. `0` (default) = continuous. Also the
     * keyboard nudge; a continuous slider nudges by 1% of the range.
     */
    step?: number;
    /** Handle width in pixels. Default 12. */
    handleWidth?: number;
    /** Start disabled. */
    disabled?: boolean;
    /** Participate in Tab traversal + arrow-key nudging. Default true. */
    focusable?: boolean;
    tabIndex?: number;
    trackVisual?: UIVisualInit;
    fillVisual?: UIVisualInit;
    handleVisual?: UIVisualInit;
    onChange?: (value: number, entity: Entity) => void;
}
interface SliderHandle {
    readonly entity: Entity;
    readonly trackEntity: Entity;
    readonly fillEntity: Entity;
    readonly handleEntity: Entity;
    getValue(): number;
    setValue(value: number): void;
    dispose(): void;
}
/**
 * Horizontal slider composed of a track, a fill bar, and a handle thumb.
 * State + input live in the {@link UISlider} component and its behavior
 * system: pointer drag (press-capture on the track), arrow keys / Home / End
 * while focused, and value→visual sync for any writer — this handle, a
 * binding, or the editor inspector.
 */
declare function createSlider(opts: SliderOptions): SliderHandle;

interface DropdownOptions<T> {
    world: World;
    events: EntityEventQueue;
    parent?: Entity;
    node?: UINodeInit;
    options: readonly T[];
    selectedIndex?: number;
    optionToLabel?: (option: T, index: number) => string;
    /** Visual state overrides for the main button. */
    buttonStates?: {
        normal?: Color;
        hover?: Color;
        pressed?: Color;
    };
    /** Height of each option row in pixels. Default 32. */
    optionHeight?: number;
    /** Start disabled. */
    disabled?: boolean;
    /** Participate in Tab traversal + arrow-key selection. Default true. */
    focusable?: boolean;
    tabIndex?: number;
    onSelect?: (index: number, option: T, entity: Entity) => void;
}
interface DropdownHandle<T> {
    readonly entity: Entity;
    readonly labelEntity: Entity;
    isOpen(): boolean;
    getSelectedIndex(): number;
    getSelected(): T;
    setSelectedIndex(index: number): void;
    open(): void;
    close(): void;
    dispose(): void;
}
/**
 * Dropdown: a button showing the current selection that opens a popup with
 * clickable option rows. State + behavior live in the {@link UIDropdown}
 * component and its system: click toggles the popup, a click anywhere else
 * closes it, arrow keys step the selection while focused, and the label
 * follows `selectedIndex` for any writer. The factory adds the generic-type
 * mapping (`options: T[]` + `optionToLabel`) on top.
 */
declare function createDropdown<T>(opts: DropdownOptions<T>): DropdownHandle<T>;

/**
 * @file    ui/widgets/toPrefab.ts
 * @brief   widgetToPrefab — turn an imperative widget builder into PrefabData.
 *
 * The widget factories (createButton, createSlider, …) are the single source of
 * a control's structure + default styling. Running one against a lightweight
 * recording World captures its spawn/insert/setParent calls as plain data, which
 * `extractPrefab` serialises into a shippable `.esprefab`. So the editor gets a
 * drop-in, themed control asset generated from the exact same code the runtime
 * uses — no hand-authored duplicate to drift.
 */

/**
 * Run `build` against a recording World and serialise the resulting subtree to a
 * PrefabData named `name`. `build` returns the root entity (as the factories do).
 */
declare function widgetToPrefab(build: (world: World) => Entity, name: string): PrefabData;

declare const BUILTIN_UI_PREFABS: Record<string, PrefabData>;
declare const BUILTIN_UI_WIDGET_NAMES: readonly ["TreeView", "ColorPicker", "TabView", "Tooltip", "VirtualJoystick", "VirtualButton", "Button", "Toggle", "Slider", "Dialog", "TextInput", "Progress", "Dropdown", "ListView", "ScrollView"];

interface MeasureTextOptions {
    /** Default: Arial. */
    fontFamily?: string;
    /** Display px. */
    fontSize: number;
    bold?: boolean;
    italic?: boolean;
    /** Extra px between glyphs (mirrors the renderer's letterSpacing). */
    letterSpacing?: number;
    /** Word-wrap width in display px. 0 / undefined ⇒ a single line (no wrap). */
    maxWidth?: number;
    /** Line height in display px. Default: `fontSize * 1.2` (the Text default ratio). */
    lineHeight?: number;
}
interface TextMetrics {
    /** Width of the widest line, display px. */
    width: number;
    /** Number of lines after wrapping + explicit `\n`. */
    lineCount: number;
    /** `lineCount * lineHeight`, display px — the height to size a box to. */
    height: number;
}
/**
 * Measure `text` at the given font, word-wrapped to `maxWidth`. Pure w.r.t. the
 * inputs (a shared hidden canvas is the only state). Honours explicit `\n`.
 */
declare function measureText(text: string, opts: MeasureTextOptions): TextMetrics;

/** A computed UINode text box, in local display pixels. @experimental */
interface TextInspectionOptions extends MeasureTextOptions {
    width: number;
    height: number;
    wordWrap?: boolean;
    richText?: boolean;
    customFont?: boolean;
}
/** Overflow before the renderer applies Clip / Ellipsis. @experimental */
interface TextInspection {
    metrics: TextMetrics | null;
    horizontalOverflow: boolean;
    verticalOverflow: boolean;
    /** These cases require visual verification rather than an automatic pass. */
    unsupported: 'rich-text' | 'custom-font' | 'complex-script' | 'invalid-box' | null;
}
/**
 * Inspect ordinary glyph-atlas text using individual glyph advances, as the
 * renderer does. Results depend on the host font; custom bitmap fonts and
 * shaped scripts deliberately return no automatic verdict. @experimental
 */
declare function inspectTextLayout(text: string, opts: TextInspectionOptions): TextInspection;

/**
 * The surface UI lays out against: its pixel size and the scale mapping design
 * pixels onto it. Written by the camera plugin before layout runs.
 *
 * @beta
 */
interface UICameraData {
    viewProjection: Float32Array;
    vpX: number;
    vpY: number;
    vpW: number;
    vpH: number;
    screenW: number;
    screenH: number;
    worldLeft: number;
    worldBottom: number;
    worldRight: number;
    worldTop: number;
    worldMouseX: number;
    worldMouseY: number;
    valid: boolean;
    /**
     * Which write of {@link UICameraData.viewProjection} this is.
     *
     * The matrix is rewritten IN PLACE twice a frame — an early peek, then the
     * resolve the renderer draws from — so a reader holds live memory and cannot
     * tell the two apart. This number can; `CameraCommit` is the drawn one.
     */
    revision: number;
}
/** The UI surface, as a resource — what a system reads to place something in
 *  screen terms rather than design terms.
 *  @beta */
declare const UICameraInfo: ResourceDef<UICameraData>;

declare function screenToUiWorld(camera: UICameraData, screenGLX: number, screenGLY: number): {
    x: number;
    y: number;
};
/**
 * The LAYOUT point a screen pixel names, through the same matrix the overlay
 * draws with — the same one, not an equivalent one. Two derivations agree until
 * either gains a case, and the symptom then is a HUD that looks right and clicks
 * somewhere else.
 */
declare function screenToUiLayout(overlay: ScreenOverlayData, screenGLX: number, screenGLY: number): {
    x: number;
    y: number;
};
/** Whether @p entity is laid out on the screen rather than in the world — the
 *  engine's own answer (UISystem::screenDomain), never a second derivation. */
declare function isScreenEntity(world: PickableWorld, entity: Entity): boolean;
/** A layout point's pixel on the surface, through the overlay's own projection —
 *  the forward of {@link screenToUiLayout}, for anchoring something the OS draws
 *  (an IME candidate window) under something the engine drew. */
declare function uiLayoutToScreen(overlay: ScreenOverlayData, x: number, y: number): {
    x: number;
    y: number;
};
declare function uiWorldToScreen(camera: UICameraData, worldX: number, worldY: number): {
    x: number;
    y: number;
};
/**
 * What picking asks of a world: the two accessors that reach the engine core.
 * Named as a subset so a host holding a narrowed view of the world can still
 * pick, without the helpers claiming to need the rest of it.
 */
type PickableWorld = Pick<World, 'getCppRegistry' | 'getWasmModule'>;
/**
 * The topmost **interactable** entity along a pointer ray — the same raycast the
 * interaction system runs, so a custom cursor agrees with the built-in one.
 * A query: what a press or a hover MEANS is the interaction system's business.
 */
declare function uiHitTestWorld(world: PickableWorld, ray: WorldRay, screenRay?: WorldRay): Entity | null;
/** Editor pick: topmost UI entity under the point, regardless of Interactable;
 *  {@link uiHitTestWorld} is the runtime raycast. */
/**
 * What the GAME's pointer would hit at framebuffer pixel (@p screenGLX, @p screenGLY)
 * — the interaction system's own question, so anything that synthesises a click
 * (an automation driver) is refused exactly where a player's would land
 * elsewhere: a subtree under `pointerEvents: None` passes the pointer through.
 * Unlike {@link uiPickWorld}, the editor's selection pick, which sees everything.
 */
declare function uiHitAtScreen(world: PickableWorld, camera: UICameraData, overlay: ScreenOverlayData, screenGLX: number, screenGLY: number): Entity | null;
declare function uiPickWorld(world: PickableWorld, worldX: number, worldY: number): Entity | null;
/** All editor-pickable UI entities under the point, most specific first. */
declare function uiPickAllWorld(world: PickableWorld, worldX: number, worldY: number): Entity[];

interface UILayoutGenerationData {
    generation: number;
}
declare const UILayoutGeneration: ResourceDef<UILayoutGenerationData>;

/**
 * Which characters a field accepts as they are typed or pasted. The rest never reach `value`: they are
 * removed from the field itself, so what is on screen and what a script reads are the same.
 */
declare const TextInputFilter: {
    /** Anything. */
    readonly None: 0;
    /** Only 0-9, for a count or a price. */
    readonly Digits: 1;
    /** 0-9, a point and a minus sign, for a number that may have a fraction or be negative. */
    readonly Decimal: 2;
    /** 0-9 and the characters of a phone number: + * # and -. */
    readonly Phone: 3;
};
type TextInputFilter = typeof TextInputFilter[keyof typeof TextInputFilter];
interface TextInputData {
    value: string;
    placeholder: string;
    /** Optional catalog key for the displayed hint. Does not change the value or authored placeholder. */
    placeholderI18nKey?: string;
    placeholderColor: Color;
    /** A font asset the game SHIPS. When set it wins over {@link fontFamily},
     *  exactly as `Text.font` does — a field on a skinned panel is drawn in the
     *  game's own typeface, not in whatever the host happens to have. */
    font: number;
    fontFamily: string;
    fontSize: number;
    color: Color;
    backgroundColor: Color;
    padding: number;
    maxLength: number;
    /** Characters the field accepts; see {@link TextInputFilter}. */
    inputFilter: TextInputFilter;
    multiline: boolean;
    password: boolean;
    readOnly: boolean;
    focused: boolean;
    cursorPos: number;
    /** Where the value sits in the field: Left, Center or Right. A single line
     *  keeps the alignment only while it fits — past that the field scrolls to
     *  follow the caret, as a left-aligned one always has. */
    textAlign: TextAlign;
    /** Glyph pipeline for the field text — mirrors Text.renderMode, propagated to
     *  the child Text the input plugin renders through (Auto / Bitmap / Sdf). */
    renderMode: TextRenderMode;
}
declare const TextInput: ComponentDef<TextInputData>;

/** Read-only scene queries needed to inspect focus. @experimental */
type FocusInspectionWorld = Pick<World, 'getWasmModule' | 'getCppRegistry' | 'getEntitiesWithComponents' | 'valid' | 'has' | 'get'>;
/** Why a focusable is absent from the current Tab ring. @experimental */
type FocusSkipReason = 'disabled' | 'hidden' | 'outside-dialog';
/** A read-only focus traversal entry. Equal indices keep ECS query order. @experimental */
interface FocusTraversalEntry {
    entity: Entity;
    tabIndex: number;
    skipped: FocusSkipReason | null;
}
/** The same snapshot used by keyboard traversal. @experimental */
interface FocusTraversalInspection {
    entries: FocusTraversalEntry[];
    /** False when the host cannot report resolved hierarchical visibility. */
    visibilityResolved: boolean;
}
/** Inspect Tab order without moving focus or emitting events. @experimental */
declare function inspectFocusTraversal(world: FocusInspectionWorld): FocusTraversalInspection;

/**
 * @file    ui/theme/tokens.ts
 * @brief   ThemeTokens — semantic design tokens for the widget layer.
 *
 * Widgets read their defaults from the active theme via {@link getTheme} instead
 * of hard-coding values ("去裸色"): one place defines the palette + type scale, and
 * an app re-themes every widget it constructs afterwards by calling {@link setTheme}
 * first. Semantic roles (surface/control/primary/text/…) decouple widgets from
 * literal values, so the same widget code renders correctly under {@link DARK_TOKENS}
 * or {@link LIGHT_TOKENS}. `DARK_TOKENS` is the built-in default.
 */

/**
 * Semantic colour roles widgets read, so a project restyles by naming roles
 * rather than by reaching into each widget.
 *
 * @beta
 */
interface ThemeColors {
    /** Dialog / panel background. */
    surface: Color;
    /** Raised surface — popup / dropdown list background. */
    surfaceElevated: Color;
    /** Interactive control resting fill (button/option). */
    control: Color;
    controlHover: Color;
    controlActive: Color;
    /**
     * Keyboard focus. A ROLE of its own rather than a reuse of `controlHover`,
     * because the two answer different questions — "the pointer is here" and "the
     * keyboard is here" — and a user tabbing through a form has nothing but this to
     * tell them where they are. Only ever shown for focus that arrived by keyboard
     * (see FocusManagerState.focusVisible).
     */
    controlFocus: Color;
    /** Slider / progress track. */
    track: Color;
    /** Accent — slider fill, progress fill, selected option. */
    primary: Color;
    primaryHover: Color;
    primaryActive: Color;
    /** Content/handle drawn on top of `primary`. */
    onPrimary: Color;
    /** Default foreground (label text / icon) drawn on `surface`/`control`. */
    text: Color;
    /** Modal scrim. */
    backdrop: Color;
}
/** Every color role, in display order — THE list a theme editor or a project
 *  format validator iterates (keyof ThemeColors, as a runtime value). */
declare const THEME_COLOR_ROLES: readonly (keyof ThemeColors)[];
/** Typographic scale (font sizes in px) consumed by widget text. */
interface ThemeType {
    /** Control / label text (buttons, options). */
    label: number;
    /** Body / default text. */
    body: number;
    /** Headings (dialog titles). */
    title: number;
}
interface ThemeTokens {
    colors: ThemeColors;
    type: ThemeType;
}
/** Built-in dark palette (mirrors the values the widgets used to hard-code). */
declare const DARK_TOKENS: ThemeTokens;
/** Built-in light palette — the same roles on light surfaces with dark text. */
declare const LIGHT_TOKENS: ThemeTokens;
/** A project's partial re-skin over a base theme: any subset of color roles
 *  and type-scale steps. Absent keys inherit from the base. */
interface ThemeOverrides {
    colors?: Partial<ThemeColors>;
    type?: Partial<ThemeType>;
}
/**
 * Parse a JSON-transportable color override map (role → `#rrggbb[aa]` hex — the
 * shape project manifests and shipped game configs carry) into {@link ThemeOverrides}.
 * Unknown roles and malformed hex are dropped; undefined when nothing valid remains.
 * The ONE config→overrides converter shared by the editor and every shipped host.
 */
declare function parseThemeOverrides(colors?: Record<string, string>): ThemeOverrides | undefined;
/**
 * The effective tokens for a base theme name plus a project's partial overrides —
 * the ONE merge every runtime and the editor resolve through, so a project that
 * overrides `primary` alone re-tints the accent while inheriting the rest.
 */
declare function resolveThemeTokens(base: 'dark' | 'light', overrides?: ThemeOverrides): ThemeTokens;
/** The active design tokens widgets resolve their defaults from. */
declare function getTheme(): ThemeTokens;
/** Replace the active design tokens (affects widgets constructed afterwards). */
declare function setTheme(tokens: ThemeTokens): void;
/** The active colour palette — what a widget reads at build time, so a theme
 *  swap after that needs a rebuild rather than a repaint.
 *  @beta */
declare function themeColors(): ThemeColors;
/** Convenience: the active type scale. */
declare function themeType(): ThemeType;

/** A semantic color role (a key of {@link ThemeColors}). */
type ColorRole = keyof ThemeColors;
interface ThemeStyleData {
    /** Role that drives this entity's `UIVisual.color`. */
    visual?: ColorRole;
    /** Role that drives this entity's `Text.color`. */
    text?: ColorRole;
    /** Page-name → role, for each `$interaction` colour-gear page. */
    states?: Record<string, ColorRole>;
    /** Roles that drive a `TextInput`'s background / text / placeholder colors
     *  (the input plugin owns its UIVisual, so those fields are the source). */
    input?: {
        background?: ColorRole;
        text?: ColorRole;
        placeholder?: ColorRole;
    };
}
declare const ThemeStyle: ComponentDef<ThemeStyleData>;
/** Tag `entity` so the active theme's colors re-resolve onto it (see
 *  `applyThemeToWorld`). */
declare function markThemed(world: World, entity: Entity, style: ThemeStyleData): void;

/**
 * @file    ui/behavior/theme-apply.ts
 * @brief   Live re-theming: re-resolve every {@link ThemeStyle}-tagged entity's
 *          role bindings against the active theme.
 *
 * This is what makes {@link switchTheme} restyle already-constructed widgets, not
 * just future ones — the piece a colors-baked-at-construction model otherwise
 * can't express. Lives here (not in `theme/`) because it touches the widgets'
 * `$interaction` colour gears (behavior state) plus `UIVisual`/`Text` (core);
 * `theme/` is cross-cutting and may not import up into behaviors.
 */

/**
 * Re-resolve every {@link ThemeStyle} entity's role bindings and write the active
 * theme's colors into its `UIVisual`/`Text`/`$interaction` colour gear pages. The
 * existing **alpha is preserved** — only the hue re-themes — so a dimmed
 * `disabled` state keeps its transparency, and a caller's translucency survives
 * a swap.
 */
declare function applyThemeToWorld(world: World): void;
/** Set the active theme AND live-restyle every already-constructed themed widget. */
declare function switchTheme(world: World, tokens: ThemeTokens): void;

/**
 * @file    ui/binding/bind.ts
 * @brief   bind — drive a component field from a {@link ReadonlySignal}.
 *
 * The declarative replacement for the imperative "read the component, mutate the
 * field, insert it back" every UI-from-state update used to be. The field is set
 * immediately, then tracks the signal; the binding auto-disposes when the entity
 * despawns (and returns a manual dispose).
 */

/**
 * Bind `source` to `entity`'s `component.field`: applied now and on every change.
 * Writes are guarded (skipped if the entity is gone or lacks the component), and
 * the binding tears itself down when the entity despawns. Returns a dispose to
 * unbind early.
 */
declare function bind<C extends object, K extends keyof C>(world: World, entity: Entity, component: ComponentDef<C>, field: K, source: ReadonlySignal<C[K]>): () => void;

/**
 * @file    ui/binding/two-way.ts
 * @brief   bindWidgetValue — two-way binding between a Signal and a widget's
 *          value component field.
 *
 * Down: `bind` writes the signal into the field (the widget's behavior system
 * observes the component and updates visuals + emits `change`). Up: the
 * widget's `change` event writes back into the signal. The signal is the
 * loop breaker — `Signal.set` and the down-binding both no-op on equal
 * values, so a round trip settles in one hop.
 *
 * Works with any component whose behavior system emits `change` with the new
 * value in its payload: `UISlider.value` (`{ value }`), `UIToggle.isOn`
 * (`{ isOn }`), `UIDropdown.selectedIndex` (`{ index }`).
 */

/**
 * Two-way bind `signal` ↔ `entity`'s `component.field`, with the widget's
 * `change` event as the upstream edge. `payloadKey` names the field in the
 * change payload (e.g. `'value'` for UISlider, `'isOn'` for UIToggle,
 * `'index'` for UIDropdown). Returns a dispose that tears down both
 * directions (the down-binding also auto-disposes on despawn).
 */
declare function bindWidgetValue<C extends object, K extends keyof C>(world: World, events: EntityEventQueue, entity: Entity, component: ComponentDef<C>, field: K, signal: Signal<C[K]>, payloadKey?: string): () => void;

interface TextSegment {
    type: 'text';
    text: string;
    bold: boolean;
    italic: boolean;
    color: Color | null;
    fontSize: number | null;
}
type ImageValign = 'baseline' | 'middle' | 'top' | 'bottom';
interface ImageSegment {
    type: 'image';
    src: string;
    width: number;
    height: number;
    valign: ImageValign;
    offsetX: number;
    offsetY: number;
    scale: number;
    tint: Color | null;
}
type RichTextRun = TextSegment | ImageSegment;
declare function parseRichText(input: string): RichTextRun[];

interface PageDef {
    /** The prefab the page is made from: a path or `@uuid:` reference, whatever the asset system loads a prefab by. */
    prefab: string;
    /** An entity of the scene to build the page's contents under (see the file comment). One of `mount` and `parent` is needed. */
    mount?: Entity | (() => Entity);
    /** An entity to add the page's root under, last among its children. */
    parent?: Entity | (() => Entity);
    /** Overrides applied to the prefab as it is built, as a scene's prefab instance carries them. */
    overrides?: PrefabOverride[];
    /**
     * What closing does. `keep` (the default): the page stays built and is switched off, so opening it again costs nothing.
     * `destroy`: its contents are removed and the next open builds them again.
     */
    onClose?: 'keep' | 'destroy';
}
/** A built page: its root, and its nodes by name. */
interface PageHandle {
    readonly id: string;
    /** The page's root: the mount, or the prefab's own root when the page was given a `parent`. */
    readonly root: Entity;
    /** The node called `name` inside this page, if there is one. */
    find(name: string): Entity | undefined;
    has(name: string): boolean;
    /** Every name in the page, for a caller that wires them all. */
    names(): IterableIterator<string>;
}
declare class UIPages {
    private readonly world_;
    private readonly assets_;
    private readonly pages_;
    private readonly builtListeners_;
    private readonly prefabs_;
    private readonly mounts_;
    constructor(world_: World, assets_: Assets);
    register(id: string, def: PageDef): void;
    has(id: string): boolean;
    /**
     * Register a virtual instance of the scene (prefab/deferred.ts) as a page named after its root: the root is the mount, and the
     * prefab and overrides are the ones the instance was made from. Answers the page's id, or null when the entity is not a virtual
     * instance or is already registered.
     */
    registerDeferred(entity: Entity, onClose?: PageDef['onClose']): string | null;
    /** Register every virtual instance of the world — or only those under `root` — that is not a page yet. Answers their ids. */
    registerDeferredAll(root?: Entity, onClose?: PageDef['onClose']): string[];
    /** Whether the page has been built (and not destroyed since). */
    isBuilt(id: string): boolean;
    /** Whether the page is open: built and switched on. */
    isOpen(id: string): boolean;
    /** The page's handle, once it has been built. */
    page(id: string): PageHandle | null;
    /** Called each time a page is built, after its contents exist and before the `open` that asked for it answers: the place to wire it. */
    onBuilt(listener: (page: PageHandle) => void): () => void;
    /** Fetch the page's prefab now, so that building it later is only making entities. */
    preload(id: string): Promise<void>;
    open(id: string): Promise<PageHandle>;
    close(id: string): void;
    private state_;
    private prefab_;
    private build_;
    private isUnder_;
    /** Names are only looked for inside the page, depth first; where one is used twice the first one wins. */
    private nameIndex_;
    private destroy_;
}

declare enum VirtualJoystickMode {
    Fixed = 0,
    Follow = 1
}
interface VirtualJoystickData {
    inputId: string;
    mode: VirtualJoystickMode;
    radius: number;
    deadZone: number;
    returnSpeed: number;
    base: Entity;
    handle: Entity;
}
interface VirtualButtonData {
    inputId: string;
    value: number;
}
declare const VirtualJoystick: ComponentDef<VirtualJoystickData>;
declare const VirtualButton: ComponentDef<VirtualButtonData>;

interface VirtualJoystickOptions {
    world: World;
    parent?: Entity;
    node?: UINodeInit;
    inputId?: string;
    mode?: VirtualJoystickMode;
    radius?: number;
    deadZone?: number;
    returnSpeed?: number;
    disabled?: boolean;
    baseVisual?: UIVisualInit;
    handleVisual?: UIVisualInit;
}
declare function createVirtualJoystick(options: VirtualJoystickOptions): {
    entity: number;
    baseEntity: number;
    handleEntity: number;
    setDisabled: (disabled: boolean) => void;
    dispose: () => void;
};
interface VirtualButtonOptions extends ButtonOptions {
    inputId?: string;
    value?: number;
}
declare function createVirtualButton(options: VirtualButtonOptions): ButtonHandle;

/**
 * @file    deferredInstances.ts
 * @brief   Which entities of a world are virtual instances not yet opened, and what each would be made from.
 *
 * Loading a scene that has virtual prefab instances (prefab/deferred.ts) makes only their roots. This is where those roots are
 * remembered: per world, by entity, so that `UIPages` (or any caller) can open one when it is wanted. A record goes with its entity:
 * once the entity is despawned there is nothing to open.
 */

/** What `entity` would be made from, if it is a virtual instance. */
declare function deferredRecord(world: World, entity: Entity): DeferredRecord | undefined;
/** Every virtual instance of the world, in the order they were registered. */
declare function deferredEntities(world: World): Entity[];

/**
 * @file    assetGroups.ts
 * @brief   The project's asset-delivery configuration model + resolver.
 *
 * `.esengine/asset-groups.json` is the SINGLE authored source for *which assets
 * ship where*: any folder can be marked a delivery group (local / subpackage /
 * remote-CDN), decoupling the delivery decision from a magic folder NAME. Build
 * profiles carry the CDN root per environment (dev / prod). This module is the
 * pure model + resolver shared by BOTH the cook (staging + manifest) and the
 * editor Play realm (its addressable manifest) — one implementation, so the two
 * can never disagree about what group an asset is in.
 *
 * Pure and dependency-free (no fs / DOM); the fs load lives in the cook / editor.
 */

/** The user-facing delivery modes for a group, as a runtime list so callers
 *  (the editor's Delivery menu / badges) enumerate them from one source instead
 *  of hand-repeating the members. `subpackage` maps to the manifest's `lazy`
 *  bundle mode; `local`/`remote` map to themselves. */
declare const ASSET_GROUP_MODES: readonly ["local", "subpackage", "remote"];
type AssetGroupMode = typeof ASSET_GROUP_MODES[number];
/** One authored group: every asset under `folder` (recursively) joins it. */
interface AssetGroupDef {
    /** Project-relative folder whose assets belong to this group. */
    folder: string;
    mode: AssetGroupMode;
    /**
     * Ship every asset in this folder whether or not a scene references it.
     *
     * A build cooks what it can REACH from the entry scenes, which is right for
     * anything a scene names — and blind to anything named only in code: a path
     * built at runtime, a texture in rich-text markup, a clip picked by id. This
     * is where a project says so, rather than discovering at run time on a device
     * that the file was culled. (Unity's Resources folder and Unreal's additional
     * cook directories are the same declaration.)
     *
     * Off by default: reachability is what keeps a build from shipping the whole
     * project.
     */
    alwaysInclude?: boolean;
}
/**
 * One authored atlas: every texture under `folder` (recursively) packs into its
 * pages. A SEPARATE axis from a delivery group on purpose — which assets travel
 * together and which assets share a texture page are different decisions, and an
 * atlas may span two groups or a group hold two atlases.
 */
interface AtlasDef {
    /** Project-relative folder whose textures pack together. */
    folder: string;
}
/** A build environment's variables — currently just the CDN root remote groups
 *  are served from (dev vs prod differ; the export bakes the active one in). */
interface BuildProfile {
    remoteRoot?: string;
}
/** The whole `.esengine/asset-groups.json` document. */
interface AssetGroupsConfig {
    version: string;
    /** groupName → definition. */
    groups?: Record<string, AssetGroupDef>;
    /** atlasName → definition. */
    atlases?: Record<string, AtlasDef>;
    /** Which profile is active for a build (key into `profiles`). */
    activeProfile?: string;
    profiles?: Record<string, BuildProfile>;
}
/** The group + delivery an asset resolves to (delivery is the manifest's typed
 *  {@link BundleMode}, so cook staging / manifest / runtime all speak one type). */
interface ResolvedAssetGroup {
    name: string;
    delivery: BundleMode;
    /** See {@link AssetGroupDef.alwaysInclude}. */
    alwaysInclude: boolean;
}
/** Map a user-facing mode to the manifest bundle mode (`subpackage` → `lazy`). */
declare function modeToDelivery(mode: AssetGroupMode): BundleMode;
/** The atlas an asset packs into: its name (the packing identity) and folder. */
interface ResolvedAtlas {
    name: string;
    folder: string;
}
/**
 * The atlas a texture belongs to, or null for a standalone one. Priority mirrors
 * {@link resolveAssetGroup}: an explicit `config.atlases` entry (longest folder
 * prefix), else the `<name>.atlas/` folder convention, whose identity is the
 * DIRECTORY PATH so same-named dirs stay distinct atlases.
 */
declare function resolveAtlas(projectRelPath: string, config: AssetGroupsConfig | null | undefined): ResolvedAtlas | null;
/**
 * The delivery group an asset belongs to, in priority order:
 *   1. An explicit `config.groups` entry whose `folder` is (the longest) prefix
 *      of the asset's path — the modern, name-decoupled configuration.
 *   2. The legacy folder-name convention (`subpackages/<name>/` → lazy,
 *      `remote/<name>/` → remote) — kept as a zero-config default / back-compat.
 *   3. `main` / `local` — the eagerly-shipped default.
 *
 * Pure: `config` is the parsed document (or null when the project has none).
 * The SINGLE resolver the cook and the editor Play realm both call.
 */
declare function resolveAssetGroup(projectRelPath: string, config: AssetGroupsConfig | null | undefined): ResolvedAssetGroup;
/** The CDN root of the active build profile (the value the export bakes into the
 *  shipped `game.config.json` so `remote`-group assets resolve against it).
 *  Undefined when no profile / no root is set. */
declare function activeRemoteRoot(config: AssetGroupsConfig | null | undefined): string | undefined;
/** The delivery mode a config assigns to `folder` directly — `local` when the
 *  folder has no group of its own (parent-folder groups don't count here; this is
 *  the per-folder authoring state, for a menu check / badge). */
declare function folderGroupMode(config: AssetGroupsConfig | null | undefined, folder: string): AssetGroupMode;
/** Whether `folder` has its own group marked {@link AssetGroupDef.alwaysInclude}
 *  — the per-folder authoring state, for a menu check / badge. */
declare function folderAlwaysInclude(config: AssetGroupsConfig | null | undefined, folder: string): boolean;
/**
 * A copy of `config` with `folder` assigned delivery `mode` — the pure authoring
 * mutation the editor writes to `.esengine/asset-groups.json`. `local` drops the
 * group, unless it is carrying an `alwaysInclude` that must outlive the mode
 * change (a folder can be ordinary local delivery AND always shipped).
 */
declare function withFolderGroup(config: AssetGroupsConfig | null | undefined, folder: string, mode: AssetGroupMode): AssetGroupsConfig;
/**
 * A copy of `config` with `folder` marked (or unmarked) always-include: ship its
 * assets whether or not a scene references them. Clearing it on an otherwise
 * ordinary local folder drops the group entirely — a local group with nothing to
 * say is the same as no group.
 */
declare function withFolderAlwaysInclude(config: AssetGroupsConfig | null | undefined, folder: string, on: boolean): AssetGroupsConfig;
/** A copy of `config` with the active build profile's CDN root set (creating the
 *  profile — default `dev` — and making it active). Pure. */
declare function withActiveRemoteRoot(config: AssetGroupsConfig | null | undefined, remoteRoot: string): AssetGroupsConfig;

/** Lower-case, zero-padded 16-hex-digit XXH64 — the canonical `contentHash` string. */
declare function contentHashHex(data: Uint8Array): string;
/**
 * Convenience over {@link contentHashHex} that also accepts a string (hashed as
 * UTF-8). Build-time only — `TextEncoder` is a Node/browser global.
 */
declare function contentHashOf(data: Uint8Array | string): string;

declare class AsyncCache<T> {
    private dispose_?;
    private cache_;
    private pending_;
    private failed_;
    /**
     * @param dispose_ Optional releaser for a value whose load finishes AFTER
     *   its getOrLoad already timed out — the caller got the timeout rejection,
     *   so that late value has no owner and would otherwise leak (e.g. a GL
     *   texture created past the deadline). NOT called for
     *   invalidate()/clearAll(), whose in-flight results still reach the caller.
     */
    constructor(dispose_?: ((value: T) => void) | undefined);
    /** Current cooldown rejections; expired records retain no failure metadata. */
    /** @internal Failed preparation provenance for source invalidation. */
    failures(): Generator<[string, Error]>;
    getOrLoad(key: string, loader: () => Promise<T>, timeout?: number): Promise<T>;
    /**
     * Drop this key's pending record only if it is still THIS request's. A load
     * that finishes after invalidate() replaced it would otherwise delete its
     * successor's record, and the next getOrLoad would start a third load of the
     * same asset instead of joining the second.
     */
    private clearPendingIfCurrent_;
    /** Release a value that was abandoned by a timeout; never throws upward. */
    private disposeAbandoned_;
    get(key: string): T | undefined;
    has(key: string): boolean;
    delete(key: string): boolean;
    /**
     * Drop every record of `key` — resolved value, failure cooldown, and
     * any in-flight loader. Used by hot-reload when the underlying bytes
     * changed on disk and the next `getOrLoad` must fetch fresh.
     *
     * Returns true if any record was removed. Doesn't release whatever
     * resource the cached value points to — that's the caller's concern
     * (see `Assets.invalidate` for the resource-aware variant).
     */
    invalidate(key: string): boolean;
    clear(): void;
    clearAll(): void;
    /** Re-file a value under `key`, for a sweep that removed it to force a reload. */
    set(key: string, value: T): void;
    /**
     * Key/value pairs of what is resolved. `values()` is not enough for a sweep
     * that has to RELOAD each entry: the key is what names the asset.
     */
    entries(): IterableIterator<[string, T]>;
    values(): IterableIterator<T>;
    /**
     * @internal Entry counts for the resource census.
     *
     * `pending` is the one to watch: it should be empty at rest, so a non-zero
     * value between cycles means a load never settled — and a load that never
     * settles holds its callbacks, its buffers and whatever closed over them.
     */
    sizes(): {
        cached: number;
        pending: number;
        failed: number;
    };
}

/**
 * Canonical `createImageBitmap` options. premultiply + colorspace conversion are
 * OFF so the engine owns blending and color (matching the C++ upload); `flip`
 * bakes a vertical flip into the bitmap so callers upload it as-is.
 */
declare function imageBitmapOptions(flip: boolean): ImageBitmapOptions;
/**
 * Decode a source into a GL-oriented `ImageBitmap` for direct `texImage2D` upload
 * (the editor/web TextureLoader). With `flip`, the result samples file-top at v=1;
 * upload it with `UNPACK_FLIP_Y_WEBGL` off (the orientation is already baked).
 */
declare function decodeImageBitmap(src: ImageBitmapSource | PlatformImage, flip: boolean): Promise<ImageBitmap>;
interface DecodedPixels {
    width: number;
    height: number;
    pixels: Uint8Array;
    /** The image's own size, where it was decoded smaller than that; absent when it is the image's size. */
    sourceWidth?: number;
    sourceHeight?: number;
}
/**
 * Decode a source into a top-first RGBA pixel buffer for the C++ `createTexture`
 * upload path (play realm, preview, spine). Orientation stays top-first here; the
 * consumer chooses the final convention via `createTextureFromPixels(flipY)` —
 * v=1=top for general textures, v=0=top for spine / bitmap fonts.
 */
declare function decodeImagePixels(src: ImageBitmapSource, maxEdge?: number): Promise<DecodedPixels>;
/**
 * Fetch a URL and decode it to top-first RGBA pixels. The single fetch→blob→decode
 * path the runtime asset sources use for `estella://` / http origins (a CORS-mode
 * `<img>` taints the canvas on custom schemes; fetch→blob sidesteps it). Uses the
 * global `fetch` — these callers all run in a browser/electron context.
 */
declare function fetchDecodePixels(url: string, maxEdge?: number): Promise<DecodedPixels>;

/**
 * The second barrier of an update. `Assets.applyUpdate` resolves when the ASSET
 * graph has caught up; the bindings that read it move on a frame, so a paused
 * app converges when it resumes and this is how to wait for that.
 *
 * @beta
 */
interface LiveBindingsData {
    /** Resolves once every ended era seen so far has been migrated onto its
     *  replacement, or given up on. Needs the app to be ticking. */
    settled(): Promise<void>;
}
/** The per-App live-binding coordinator, for a game or host that has to know
 *  when the world has caught up with an update.
 *
 * @beta
 */
declare const LiveBindings: ResourceDef<LiveBindingsData>;

/** A mesh uploaded to the GPU, named by the handle everything else references. */
interface MeshResult {
    handle: number;
}

/**
 * @file    unwrap.ts
 * @brief   A second UV set for a mesh that has none — the whole unwrap, in order.
 *
 * Cut into flat charts, project each onto its own plane, scale them all by ONE
 * ratio, pack, split the vertices the cuts run through. A bake is read through
 * the result, so what it must guarantee is that no two surfaces share a texel —
 * which is exactly what the UV set the art is wrapped in does not.
 */

interface UnwrapOptions {
    /** Widest angle two neighbouring faces may differ by and stay one chart. */
    maxChartAngleDegrees?: number;
    /** Texels of empty space kept around every chart, at {@link atlasSize}. Two is
     *  the least that stops a bilinear tap reading the chart next door. */
    paddingTexels?: number;
    /** The atlas size the padding is reckoned against. Not stored anywhere: a UV
     *  set is resolution-independent, and this only fixes what "two texels" means. */
    atlasSize?: number;
}
interface UnwrapResult {
    /** The mesh with a `TexCoord1` channel. Has MORE vertices than the input
     *  wherever a chart boundary runs through one — a vertex on a seam holds a
     *  different lightmap UV for each side of it. */
    mesh: MeshData;
    charts: number;
    /** Fraction of the unit square the triangles cover. What is left is the price
     *  of packing charts, and of the padding that keeps them apart. */
    coverage: number;
}
/**
 * Gives `mesh` a lightmap UV set, splitting vertices where charts meet.
 *
 * Every per-vertex datum follows its vertex, morph deltas included, so the result
 * is the same mesh — drawn, skinned and shaped identically — that now also
 * carries somewhere to read a bake from.
 */
declare function unwrapLightmapUV(mesh: MeshData, options?: UnwrapOptions): UnwrapResult;

/**
 * @file    bvh.ts
 * @brief   What a ray hits, and how far away — the question a bake asks millions
 *          of times and nothing else here answers.
 *
 * Flat typed arrays throughout, and a traversal that allocates nothing: a bake
 * of one room is tens of millions of these, and an object per ray is the whole
 * cost of the pass.
 */
/** Triangles as `9 * count` floats: three world-space corners each. */
interface TriangleSoup {
    positions: Float32Array;
    count: number;
}
declare class Bvh {
    /** Six floats per node: min xyz, max xyz. */
    private readonly bounds;
    /** Two ints per node: a leaf's first triangle or an inner node's LEFT child
     *  (the right is the one after it), then the triangle count — {@link INNER}
     *  for an inner node. */
    private readonly node;
    /** Triangle indices, reordered so a leaf's are contiguous. */
    private readonly order;
    private readonly tris;
    private used;
    private depth;
    /** Sized to the tree: a walk leaves one waiting sibling per level, and a
     *  fixed stack drops the deepest ones without a word. */
    private readonly stack;
    constructor(tris: TriangleSoup);
    private centroid;
    private bound;
    /** Split on the widest axis at the centroid midpoint — cheap, and a bake
     *  builds this once per scene while it traverses it for hours. */
    private build;
    /**
     * Whether anything blocks the segment from `origin` to `origin + dir * far`.
     *
     * A shadow ray wants the first blocker, not the nearest one, so this stops at
     * the first hit — which is most of what a bake asks and the cheapest to answer.
     */
    occluded(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, far: number, epsilon: number): boolean;
    /** The nearest triangle along the ray, or -1. `hitDistance` holds how far. */
    hit(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, far: number, epsilon: number): number;
    /** Distance to the last {@link hit}; meaningless before one. */
    hitDistance: number;
    /** Barycentric coordinates of the last {@link hit}, as `u` and `v` on corners
     *  two and three — corner one takes `1 - u - v`. */
    hitU: number;
    hitV: number;
    private trace;
    private lastU;
    private lastV;
    /** Möller-Trumbore, both faces: a bake lights what is there, and a wall
     *  modelled inside out still occludes the room. */
    private intersect;
}

/**
 * @file    atlas.ts
 * @brief   Which texel of the atlas is which point of the world.
 *
 * Every object gets a patch sized by the surface it actually has, so one
 * world-to-texel ratio holds across the whole bake — the same rule the unwrap
 * follows inside one mesh, applied between them.
 */

/** One object to bake: geometry with a lightmap UV set, and where it stands. */
interface BakeSurface {
    mesh: MeshData;
    /** Column-major 4x4, as `glm` and the engine write one. */
    transform: ArrayLike<number>;
    /** What fraction of each channel the surface reflects. Drives the bounce;
     *  a surface that reflects nothing still receives light. */
    albedo?: readonly [number, number, number];
    /** What to call it when a bake has something to say about it. */
    label?: string;
    /** True when its draw adds the lamps itself (a lit renderer): its patch then
     *  holds only what arrives indirectly, or the lamps would land twice. */
    realtimeDirect?: boolean;
    /** Drawn with both faces: a ray arriving at its back finds it lit, not black. */
    twoSided?: boolean;
    /** Share of its area that is there — for a cutout, the texels past its cutoff.
     *  Rays pass the rest, so foliage shades what is under it without walling it in. */
    coverage?: number;
}
/** Every texel a bake will solve, as parallel arrays. */
interface LumelField {
    count: number;
    /** World position, three floats each. */
    position: Float32Array;
    /** World normal, three floats each. */
    normal: Float32Array;
    /** Index into the atlas, one per lumel. */
    texel: Int32Array;
    /** Which surface each lumel belongs to. */
    surface: Int32Array;
    /** Per surface: the share of its triangles' texels another of its own already held. */
    shared: Float32Array;
}

/**
 * @file    reflection.ts
 * @brief   What a shiny thing standing at a point would SEE — the whole sphere
 *          of it, as a panorama.
 *
 * @details The probe gather with the integral taken out: irradiance asks what
 *          arrives from everywhere at once, a reflection asks what arrives from
 *          each direction separately. Same rays, same surfaces, same answer per
 *          ray — {@link rayRadiance} — so the two halves of one bake cannot
 *          disagree about what a wall gives off.
 */

/** A captured sphere: equirectangular RGB, the layout the prefilter reads. */
interface CapturedPanorama {
    width: number;
    height: number;
    rgb: Float32Array;
}
/** What a ray that escapes the scene brings back, by direction. */
type SkyRadiance = (dx: number, dy: number, dz: number, out: Float32Array, at: number) => void;
/** A flat sky, for a bake with no environment to sample. */
declare function flatSky(colour: readonly [number, number, number]): SkyRadiance;
/**
 * Captures the sphere seen from `at`, as an equirectangular panorama.
 *
 * The mapping is the environment importer's — centre column +Z, row 0 +Y —
 * because this is handed to that importer's own prefilter. `atlas` is the solved
 * light field by texel, as the probes read it; `sky` answers the rays that leave.
 */
declare function captureReflection(at: readonly [number, number, number], bvh: Bvh, lookup: HitLookup, atlas: Float32Array, atlasSize: number, width: number, height: number, sky: SkyRadiance): CapturedPanorama;

/**
 * @file    solve.ts
 * @brief   How much light reaches each texel — direct, then what arrives indirectly.
 *
 * The gather reads the atlas the pass before it wrote, so a second round costs
 * what the first did and carries light one surface further. That is the whole
 * reason a bake is worth having: it is the term a real-time renderer here has
 * no way to compute at all.
 */

/** A light as a bake sees one: no shadow maps, no cap on how many. */
interface BakeLight {
    kind: 'directional' | 'point' | 'spot';
    /** Where it is — point and spot only. */
    position?: readonly [number, number, number];
    /** Where it aims — directional and spot only. */
    direction?: readonly [number, number, number];
    color: readonly [number, number, number];
    intensity: number;
    /** Reach, in world units. Past it a point or spot light contributes nothing. */
    radius?: number;
    /** How the light ends, as the frame lights it (distanceFalloff): held at full out to `innerRadius`, then ramped to
     *  `radius` raised to `falloff` (1 = linear) — or, with `metre` set, 1/d² in metres (`metre` world units to one)
     *  let go over the reach by (1 - (d/r)^4)^2. A bake that disagreed with the frame lit a lamp's room twice over. */
    innerRadius?: number;
    falloff?: number;
    metre?: number;
    /** Cosines of the half angles a spot falls off between. */
    innerCos?: number;
    outerCos?: number;
    /** Directional only: this light is the environment's sun. The bake takes its
     *  direction and colour from there, and the sky without it. */
    followsEnvironmentSun?: boolean;
}
/** Where a ray that hit triangle `t` lands in the atlas, and what it reflects. */
interface HitLookup {
    /** UV of each triangle's three corners, six floats each. */
    triUV: Float32Array;
    /** Which surface each triangle belongs to. */
    triSurface: Int32Array;
    /** Patch origin and side per surface, as `[x, y, side, rotated]`. */
    patch: Float32Array;
    /** Albedo per surface, three floats each. */
    albedo: Float32Array;
    /** Which way each triangle FACES, three floats each. A surface gives off
     *  light on one side; a ray arriving at the other finds an unlit back. */
    triNormal: Float32Array;
    /** Per surface: 1 where both faces are drawn, so both give off light. */
    twoSided: Uint8Array;
    /** Per surface: the share of rays it stops. Below one only for a cutout. */
    coverage: Float32Array;
    /** Whether any surface lets rays through, which costs a nearest-hit walk. */
    cutouts: boolean;
    /** How far a surface's back may sit and still be passed: half a lumel. A layer
     *  that close above a surface (a decal, a wet sheen, a duplicate) is finer than
     *  the atlas can say anything about, and stopping at its back walls the surface
     *  under it off from the sky. */
    backReach: number;
}

/**
 * @file    sky.ts
 * @brief   The sky a gather sees, as data: a bake that runs on several threads
 *          hands each one the description, and a closure cannot cross.
 */

/** A sky a bake can pass between threads. */
type SkySpec = {
    kind: 'flat';
    rgb: readonly [number, number, number];
}
/** An environment's nine irradiance coefficients as the frame reads them:
 *  turned `yaw` radians about +Y and scaled by `tint`. */
 | {
    kind: 'sh';
    irradiance: readonly number[];
    yaw: number;
    tint: readonly [number, number, number];
};
/**
 * The radiance along each direction whose cosine-weighted mean over an open
 * hemisphere is the spec's irradiance there: the coefficients unconvolved, so an
 * uncovered floor gathers exactly what the frame would light it with.
 */
declare function skyRadiance(spec: SkySpec): SkyRadiance;

/**
 * @file    probes.ts
 * @brief   What light arrives at a point in the air, as nine coefficients.
 *
 * @details The bounce's gather, aimed from a point rather than from a surface:
 *          the whole sphere instead of a hemisphere, and no normal to weight by.
 *          It is the same light field the atlas holds, sampled where a thing that
 *          moves can be — which is the one place a lightmap cannot answer.
 */

/** Where one grid of probes sits, and how many. */
interface ProbeGrid {
    /** The world box the probes fill, corner to corner. */
    min: readonly [number, number, number];
    max: readonly [number, number, number];
    /** Probes along each axis. */
    resolution: readonly [number, number, number];
}

/**
 * @file    bake.ts
 * @brief   Surfaces and lights in, an atlas out — the whole bake, in one place.
 *
 * Lay out, rasterise, solve direct, bounce, dilate, encode. Each stage is its
 * own file and testable on its own; this is the order they go in, and the one
 * place a caller's units are turned into the texels every stage works in.
 */

interface BakeOptions {
    /** Side of the square atlas, in texels. */
    atlasSize?: number;
    /** How finely a surface is lit, in texels per world unit. A world unit here
     *  is a DESIGN PIXEL, so a room is hundreds of units across and a lumel every
     *  few of them is already fine — a density borrowed from an engine whose unit
     *  is a metre would ask for an atlas no scene could fit. */
    texelsPerUnit?: number;
    /** How many times light is allowed to reflect. Zero is direct light only —
     *  useful, because past the sixteen a frame can carry it is still the answer. */
    bounces?: number;
    /** Rays each lumel gathers per bounce. */
    samples?: number;
    /** The sky's radiance where no {@link sky} is given: the same from every
     *  direction, and still only reaching what can see it. */
    ambient?: readonly [number, number, number];
    /** What a lumel or a probe receives along a ray that escapes the scene — the
     *  environment as the frame lights by it, tint and turn included. A bake split
     *  across threads needs it as data. */
    sky?: SkySpec | SkyRadiance;
    /** Texels the solved edges are smeared outwards, so a bilinear tap near a
     *  chart's border does not read the empty atlas beside it. */
    dilate?: number;
    /** Grids of probes to solve in the same light field — what lights the things
     *  a bake cannot hold still. Solved after the surfaces, because a probe
     *  gathers what they ended up giving off. */
    probeGrids?: readonly ProbeGrid[];
    /** Bake the probes WITHOUT the sky, and how much of it each sees: the frame then lights them with
     *  the sky it has (a live Sky Atmosphere, a weather) seen through that, so a room stays dark under
     *  a sky that changes. Off, the probes hold the sky as it was at the bake. */
    skyOcclusion?: boolean;
    /** What stands in the light and holds none of it: geometry with no lightmap UV set (lit by probes when the
     *  game runs). It shadows the surfaces and hides the sky from the probes; a ray that meets it finds it unlit. */
    occluders?: readonly BakeSurface[];
    /** Directions each probe gathers. Over the whole sphere, so this buys less
     *  per ray than a lumel's hemisphere does. */
    probeSamples?: number;
    /** Where reflections are captured from — a panorama each, solved in the same
     *  light field the probes are. The specular half of the same question. */
    reflectionProbes?: readonly (readonly [number, number, number])[];
    /** Width of a captured panorama; its height is half. Small on purpose: what
     *  a rough surface reflects is a blur, and the prefilter below widens the
     *  lobe anyway. */
    reflectionWidth?: number;
    /** What a captured ray brings back when it escapes the scene. The environment
     *  where the caller could sample one, the flat ambient where it could not. */
    reflectionSky?: SkyRadiance;
}
interface BakeResult {
    /** `atlasSize * atlasSize * 4` bytes a `.png` is written from; see
     *  {@link encodeLightmap}. */
    pixels: Uint8Array;
    size: number;
    /** What each surface's `MeshLightmap.scaleOffset` must be set to, in order. */
    scaleOffset: Array<[number, number, number, number]>;
    /** Texels the surfaces actually cover, out of the atlas. */
    lumels: number;
    /** Per surface: the share of its texels its own lightmap UVs laid twice. */
    shared: Float32Array;
    /** Nine RGB coefficients per probe, one array per requested grid, in grid
     *  order with x varying fastest — what a `.esprobes` carries. */
    probes: Float32Array[];
    /** With {@link BakeOptions.skyOcclusion}: nine coefficients per probe, one array per grid, of how
     *  much of the sky each sees. Empty without it. */
    probeSkyVisibility: Float32Array[];
    /** One captured sphere per {@link BakeOptions.reflectionProbes}, in the order
     *  they were given, for the caller to prefilter into an atlas column. */
    reflections: CapturedPanorama[];
}
/** What a bake does where the caller says nothing — and what a scene's own
 *  `BakedLighting` starts at, so the two cannot drift apart. */
declare const BAKE_DEFAULTS: {
    atlasSize: number;
    texelsPerUnit: number;
    bounces: number;
    samples: number;
    ambient: readonly [number, number, number];
    dilate: number;
    probeGrids: readonly ProbeGrid[];
    probeSamples: number;
    skyOcclusion: boolean;
    reflectionProbes: readonly (readonly [number, number, number])[];
    reflectionWidth: number;
};
/**
 * The most an atlas texel holds, in units of a flat ambient of one. Stored as the
 * square root of its fraction, alpha opaque: eight plain bits stop at one, and a
 * scale in alpha does not survive a premultiplying decoder. `bakedIrradiance` reads it.
 */
declare const LIGHTMAP_RANGE = 8;
/** Irradiance to atlas bytes: `sqrt(v / LIGHTMAP_RANGE)` per channel, alpha 255. */
declare function encodeLightmap(rgb: Float32Array, count: number): Uint8Array;
/**
 * The atlas as an image file holds it: texel row `y` (second UV `v` = y / size) in
 * image row `size - 1 - y`. The engine uploads a picture bottom-up, so a UV of 0
 * reads the image's LAST row; written top-down, every lookup lands on its mirror.
 */
declare function lightmapImage(pixels: Uint8Array, size: number): Uint8Array;
/** What {@link encodeLightmap} wrote at texel `i`. */
declare function decodeLightmap(pixels: ArrayLike<number>, i: number): [number, number, number];
/** Everything a solve step reads, as arrays another thread can be handed. */
interface BakeScene {
    lumels: LumelField;
    tris: TriangleSoup;
    lookup: HitLookup;
    lights: readonly BakeLight[];
    sky: SkySpec | SkyRadiance;
    atlasSize: number;
    samples: number;
}
/** One pass over every lumel. Each writes only its own lumels' entries of `out`,
 *  so any split of the range gives the same result. */
type BakeJob = {
    kind: 'direct';
    out: Float32Array;
} | {
    kind: 'gather';
    atlas: Float32Array;
    out: Float32Array;
};
interface BakeStep {
    scene: BakeScene;
    job: BakeJob;
}
/** Runs jobs against one scene over any range of its lumels; one per thread. */
declare function bakeRunner(scene: BakeScene): (job: BakeJob, from: number, to: number) => void;
/**
 * A bake as its passes, in order: the driver runs each yielded job over every
 * lumel, on one thread or many, before asking for the next. Throws when the surfaces do not fit rather than shrinking
 * one, which would light it at a different resolution from its neighbours.
 */
declare function bakeLightmapSteps(surfaces: readonly BakeSurface[], lights: readonly BakeLight[], options?: BakeOptions): Generator<BakeStep, BakeResult, void>;
/** {@link bakeLightmapSteps} driven on this thread. */
declare function bakeLightmap(surfaces: readonly BakeSurface[], lights: readonly BakeLight[], options?: BakeOptions): BakeResult;

/**
 * @file    mobility.ts
 * @brief   Whether a bake can hold an object still.
 *
 * @details A bake writes light into a PLACE, so an object the simulation moves
 *          wears the light of where it started. Which things move is the physics
 *          components' to say; a second declaration of it would be a second
 *          answer free to disagree. Two collectors read the same rule from here,
 *          each having got the facts from the shape it reads (a document, or a
 *          world).
 */

/** What an entity's physics components say about whether it stays put. */
interface BakeMobility {
    /** It carries a CharacterController3D, which exists to walk. */
    characterController?: boolean;
    /** Its RigidBody3D's `bodyType`, when it has one. */
    bodyType?: BodyType;
}
/**
 * True where a bake may light this object and false where a probe volume must.
 *
 * Nothing said is a yes: a scene's walls and floors carry no physics at all.
 */
declare function bakeHoldsStill(mobility: BakeMobility): boolean;

/**
 * @file    fingerprint.ts
 * @brief   What a bake was OF, as one short string.
 *
 * @details Two collectors fill in the same shape — one from a document, one from
 *          a world — and the rule for reducing it lives here, so they cannot
 *          disagree about whether a scene has changed since it was lit. Order
 *          does not count: the two walk their sources differently, and a scene
 *          whose entities were reordered is the same scene to light.
 */

/** Everything a bake reads, at the grain a fingerprint is taken of. */
interface BakeInputs {
    surfaces: ReadonlyArray<{
        /** The mesh's project path, or its `builtin:` ref — its identity, not its bytes. */
        mesh: string;
        /** Column-major 4x4 world transform. */
        transform: ArrayLike<number>;
        albedo?: readonly [number, number, number];
        /** The base colour texture's project path, where it has one. */
        texture?: string;
        /** False where the simulation moves it. */
        holdsStill?: boolean;
        /** True where the frame adds the lamps to it, leaving the bake its indirect half. */
        realtimeDirect?: boolean;
        /** Drawn with both faces. */
        twoSided?: boolean;
        /** The material's project path, whose cutoff says how much of it stops a ray. */
        material?: string;
    }>;
    lights: readonly BakeLight[];
    volumes: ReadonlyArray<{
        center: readonly [number, number, number];
        halfExtents: readonly [number, number, number];
        spacing: number;
    }>;
    /** Where each reflection probe stands. A capture is a function of the POINT,
     *  so that is the whole of what one contributes to a bake. */
    reflections?: ReadonlyArray<readonly [number, number, number]>;
    ambient?: readonly [number, number, number];
    options?: BakeOptions;
}
/**
 * The fingerprint of one bake's inputs.
 *
 * Every value a bake reads reaches this; nothing else does. A mesh is named by
 * its PATH rather than its bytes — a reimport that changes the geometry changes
 * the file, and the gate that rebakes byte for byte is what answers for that.
 */
declare function bakeFingerprint(inputs: BakeInputs): string;

/**
 * @file    components.ts
 * @brief   What a project AUTHORS about its baked light: how finely, and of what.
 *
 * @details One declaration and no policy, on the shape StreamedWorld has. The
 *          engine never reads it — a bake is a creation-time act — so it is a
 *          TypeScript component: what it carries are the knobs a baker takes and
 *          the fingerprint of the last bake, which is how anything downstream
 *          knows the scene has moved on since.
 */

/** The fields of the `BakedLighting` component. @experimental */
interface BakedLightingData {
    /** Side of the square atlas, in texels. */
    atlasSize: number;
    /** How finely a surface is lit, in texels per world unit. A world unit here
     *  is a design pixel, so a room is hundreds of them across. */
    texelsPerUnit: number;
    /** How many times light is allowed to reflect. Zero is direct light only. */
    bounces: number;
    /** Rays each lumel gathers per bounce. */
    samples: number;
    /** Directions each probe gathers — over the whole sphere, so this buys less
     *  per ray than a lumel's hemisphere does. */
    probeSamples: number;
    /** Bake the probes without the sky and with how much of it each sees, so the sky the frame has
     *  (a live Sky Atmosphere, a weather) lights them through it: a room stays dark under any sky. */
    skyOcclusion: boolean;
    /** What the last bake was OF. Empty until one has run; different from what
     *  the scene fingerprints to now means the light is out of date. The baker
     *  writes it — not `readonly`, which means "the engine computes this and the
     *  editor must not project it into the World", and this is neither. */
    bakedFrom: string;
}
/**
 * Declares how the scene carrying it is lit, and what its light was baked from.
 *
 * Presence is not the switch — a scene with nothing to light bakes to nothing
 * either way. It exists so the knobs have one home rather than one per door, and
 * so "out of date" can be asked without re-running the bake to find out.
 *
 * @experimental
 */
declare const BakedLighting: ComponentDef<BakedLightingData>;

/**
 * @file    lights.ts
 * @brief   What a bake makes of one authored Light.
 *
 * @details A document states only what an author touched, so every collector has
 *          to fill the rest in — and two of them filling it in separately is two
 *          answers about a field nobody set. The defaults here are the
 *          component's own, and the reading is one function both doors call.
 */

/** A Light's authored fields, as loosely as a document may state them. */
interface AuthoredLight {
    type?: number;
    color?: {
        r?: number;
        g?: number;
        b?: number;
    };
    intensity?: number;
    radius?: number;
    innerRadius?: number;
    falloff?: number;
    inverseSquare?: boolean;
    innerAngle?: number;
    outerAngle?: number;
    followEnvironmentSun?: boolean;
    enabled?: boolean;
}
/** A lamp the bake places, or a contribution to the light from no direction. */
type BakeLightContribution = {
    lamp: BakeLight;
    ambient?: undefined;
} | {
    ambient: [number, number, number];
    lamp?: undefined;
};
/** Where a light aims: -Z under its rotation, as the renderer reads it. */
declare function bakeLightForward(q: {
    x: number;
    y: number;
    z: number;
    w: number;
}): [
    number,
    number,
    number
];
/**
 * One authored Light as the bake takes it, or null where it contributes nothing.
 *
 * An Ambient light is not a fourth kind of lamp: it occupies no slot and aims
 * nowhere, so it comes back as the term every surface receives.
 */
declare function bakeLightOf(authored: AuthoredLight | undefined, position: readonly [number, number, number], rotation: {
    x: number;
    y: number;
    z: number;
    w: number;
}, linearColor?: boolean): BakeLightContribution | null;

/**
 * @file    sh.ts
 * @brief   Nine coefficients: the shader's `shIrradiance` and its inverse.
 *
 * @details Two things produce these — a panorama import and a probe solve — and
 *          one expression reads them back. The scales here are the shader's own,
 *          so what a bake writes is what a fragment reconstructs.
 */
/** The nine real SH basis scales, in the usual l/m order. */
declare const SH_BASIS_SCALE: readonly [0.282095, 0.488603, 0.488603, 0.488603, 1.092548, 1.092548, 0.315392, 1.092548, 0.546274];
/**
 * Ramamoorthi & Hanrahan's cosine-lobe convolution, over π.
 *
 * The division is what makes a constant field come back as itself — a uniform
 * radiance c integrates to πc — so these land where the flat ambient term sits,
 * as the value that multiplies albedo.
 */
declare const SH_COSINE_BAND: readonly [1, number, number, number, 0.25, 0.25, 0.25, 0.25, 0.25];
/** The nine basis functions at `d`, which must be a unit direction. */
declare function shBasis(dx: number, dy: number, dz: number, out: Float32Array): void;
/** Convolves radiance coefficients into irradiance ones, in place. */
declare function convolveCosine(coefficients: Float32Array, at?: number): void;
/** Evaluate nine RGB coefficients at `d` — the shader's reconstruction, in
 *  TypeScript, so a test can state what a pixel should be. */
declare function evalIrradianceSH(coefficients: ArrayLike<number>, dx: number, dy: number, dz: number, at?: number): [number, number, number];

/**
 * @file    panorama.ts
 * @brief   Where an equirectangular panorama's texels look, seen from inside it.
 *
 * The centre column is +Z and row 0 is +Y; u grows toward -X, the right of a
 * viewer facing +Z, so a panorama reads as its photographer saw it rather than
 * mirrored. sky.esshader draws with the same mapping, written out in GLSL and WGSL.
 */
/** The unit direction texel coordinates (u, v) in [0, 1] look along. */
declare function panoramaDirection(u: number, v: number): [number, number, number];
/** The texel coordinates (u, v) the unit direction `d` finds. */
declare function panoramaUV(dx: number, dy: number, dz: number): [number, number];

/** A panorama in linear light: equirectangular, row 0 = up (+Y). */
interface Panorama {
    width: number;
    height: number;
    /** RGB triples, `width * height * 3` linear values. */
    rgb: Float32Array;
}
/** Bilinear lookup of the panorama along `d` (normalized), by `panoramaUV`. */
declare function samplePanorama(env: Panorama, dx: number, dy: number, dz: number, out: Float32Array): void;
/** Octahedral unit square → direction, with +Y at the centre. Values slightly
 *  outside [0,1] stay continuous, which is what makes the atlas' border texels
 *  the neighbours a bilinear tap expects. */
declare function octDecode(u: number, v: number): [number, number, number];
/** The inverse of {@link octDecode}. */
declare function octEncode(dx: number, dy: number, dz: number): [number, number];
/**
 * Project the panorama onto nine RGB coefficients, convolved with the clamped
 * cosine lobe and divided by π — the same nine a probe solve produces, through
 * the same basis, because one expression in the shader reads them both.
 */
declare function projectIrradianceSH(env: Panorama): Float32Array;
/** The atlas' pixel size, and where each mip's face begins in it. Mips stack
 *  downward, every face ringed by one texel so a bilinear tap at the edge of one
 *  never reaches into the next. */
declare function atlasLayout(faceSize: number, mipCount: number): {
    width: number;
    height: number;
    offsets: number[];
};
/** RGBM, gamma-2 in the colour channels: an 8-bit encoding whose channels each
 *  interpolate the way the GPU is about to interpolate them. */
declare function encodeRgbm(r: number, g: number, b: number, maxRange: number, out: Uint8Array, at: number): void;
/** The inverse of {@link encodeRgbm} — the same expression the shader runs. */
declare function decodeRgbm(r: number, g: number, b: number, a: number, maxRange: number): [number, number, number];
/** Prefilter `env` into the octahedral mip atlas, as RGBA8 rows top-first. */
declare function prefilterOctahedral(env: Panorama, faceSize: number, mipCount: number, maxRange: number): {
    width: number;
    height: number;
    rgba: Uint8Array;
};

/**
 * @file    clip.ts
 * @brief   The geometry a decal IS: the receiving surface, cut to the projector's box.
 *
 * @details A decal is not a sticker floating in front of a wall — it is the wall,
 *          drawn again with the decal's material and won on depth by the bias that
 *          material carries. So what a projector produces is the receiver's own
 *          triangles, clipped to the box and given the box's coordinates as UVs.
 *
 *          Cut and not discarded per pixel: the result is ordinary geometry, which
 *          is the whole reason a decal here needs no pass, no depth read and no
 *          G-buffer, and is lit and shadowed exactly as the surface under it.
 */
/** A point in the projector's own space: the unit cube from -0.5 to 0.5. */
interface ClipVertex {
    /** Position, projector-local. */
    p: [number, number, number];
    /** Normal, projector-local — carried through so the cut geometry lights
     *  like the surface it was cut from rather than like the box. */
    n: [number, number, number];
}
/** One triangle of a receiver, already in the projector's space. */
type ClipTriangle = [ClipVertex, ClipVertex, ClipVertex];
/**
 * How far from facing the projector a surface may be and still take the decal,
 * as the cosine of the angle. A wall at 90° to the projector catches the decal
 * as an infinitely stretched smear, which is what this refuses.
 */
declare const DEFAULT_FACING_COSINE = 0.2;
/**
 * How close to a face of the box a vertex may be and still count as on it.
 *
 * A projector placed so its box ENDS at the surface puts every receiver vertex
 * exactly on a face, where the last bit of the transform decides it: a floor at
 * y=0 came out ±6e-16 either side, and half the decal was clipped away.
 */
declare const CLIP_EPSILON = 0.00001;
/**
 * The receiver triangles, cut to the box.
 *
 * Returns triangles in the same projector space, fanned from each clipped
 * polygon. A triangle wholly outside contributes nothing; one wholly inside
 * comes back unchanged, which is the common case for small geometry.
 */
declare function clipToProjector(triangles: readonly ClipTriangle[], minCosine?: number): ClipTriangle[];
/** Where a clipped vertex reads the decal's texture: the box's own xy. */
declare function projectorUV(v: ClipVertex): [number, number];

/**
 * @file    bake.ts
 * @brief   A projector and the surfaces under it, in: one mesh out.
 *
 * @details The mesh is in the PROJECTOR's own space, so the entity carrying the
 *          decal draws it through the very transform that defined the box — move
 *          the decal and its geometry moves with it, without a rebake, right up
 *          until it leaves the surface it was cut from.
 */

/** One surface the projector may print on, in WORLD space. */
interface DecalReceiver {
    /** Three floats per vertex. */
    positions: Float32Array;
    /** Three floats per vertex, one per position. */
    normals: Float32Array;
    /** Three indices per triangle. */
    indices: Uint32Array;
}
/**
 * One mesh, placed, as surfaces a projector can print on.
 *
 * Here and not in each caller because it is the same knowledge the cut needs:
 * which channel is which, and that a transform moves a position one way and a
 * normal the other.
 */
declare function receiverFromMesh(mesh: MeshData, transform: ArrayLike<number>): DecalReceiver | null;
interface DecalBakeOptions {
    /** How far from facing the projector a surface may be. @see DEFAULT_FACING_COSINE */
    facing?: number;
}
/**
 * The decal's geometry, or null when the projector prints on nothing.
 *
 * Null and not an empty mesh: a decal over thin air is a thing to report, and a
 * mesh with no triangles is a draw call that says nothing.
 */
declare function bakeDecalMesh(receivers: readonly DecalReceiver[], projectorWorld: ArrayLike<number>, options?: DecalBakeOptions): MeshData | null;

/**
 * @file    components.ts
 * @brief   What a project AUTHORS about a decal: how squarely it prints.
 *
 * @details One declaration and no policy, on the shape BakedLighting has. The
 *          engine never reads it — the geometry is cut at creation time and drawn
 *          as an ordinary mesh — so it is a TypeScript component.
 *
 *          WHERE it prints is not here: that is the entity's own Transform, whose
 *          unit cube is the box. A decal is placed, turned and sized with the
 *          gizmo every other object uses.
 */

/** The fields of the `DecalProjector` component. @experimental */
interface DecalProjectorData {
    /** How far from facing the projector a surface may be and still take the
     *  decal, as a cosine. 1 accepts only what squarely faces it; 0 accepts
     *  anything not turned away. */
    facing: number;
    /** What the last cut was OF. Empty until one has run; different from what
     *  the scene reads as now means the decal is out of date. The baker writes it. */
    bakedFrom: string;
}
/**
 * Declares that the entity carrying it prints its material onto what it covers.
 *
 * The result is an ordinary mesh on this same entity's MeshRenderer — so
 * instancing, LOD, culling and picking need to know nothing about decals, and
 * the material's own depth bias is what wins it against the surface.
 *
 * @experimental
 */
declare const DecalProjector: ComponentDef<DecalProjectorData>;

/**
 * @file  builtinMeshes.ts — stock geometry a project references without owning a file.
 *        A `builtin:<id>` mesh ref names one of these; it is built here, not fetched.
 */

interface BuiltinMeshTemplate {
    id: string;
    /** The ref an authored field carries. */
    ref: string;
    /** Menu / picker label. */
    label: string;
    description: string;
    /**
     * Whether the surface encloses a volume. A closed one is drawn opaque and
     * back-face culled — it can hide what is behind it and has an inside nobody
     * sees; a flat one stays two-sided, or a ground plane disappears from below.
     */
    closed: boolean;
    /**
     * The geometry, with its lightmap UV set (`TexCoord1`) already unwrapped: a
     * bake lays its charts out by that set and the runtime samples the atlas
     * through it, so both must read the same one, and the template is where it is
     * made. Without it the renderer has no UV to read a baked atlas by, and a
     * baked built-in mesh draws as if nothing had been baked.
     */
    build(): MeshData;
}
declare const BUILTIN_MESH_TEMPLATES: readonly BuiltinMeshTemplate[];
/** The template a ref (or a bare id) names, or undefined for anything else. */
declare function builtinMeshTemplate(ref: string): BuiltinMeshTemplate | undefined;
/** Whether `ref` names built-in geometry rather than a project file. */
declare function isBuiltinMeshRef(ref: string): boolean;

/** Anything WebGL will take directly as texture content. */
type GlImageSource = PlatformImage | PlatformCanvas | ImageBitmap;

/** A texture backed by a canvas someone else draws on. */
interface CanvasTexture {
    /** The engine texture handle — stable across every {@link update}. */
    readonly handle: number;
    /** Size of the last upload. Follows the source when it is resized. */
    readonly width: number;
    readonly height: number;
    /** Re-take the source's current content. Cheap to call, not free: one
     *  `texImage2D` of the whole surface. Callers gate on visibility. */
    update(): void;
    /** End it: the device frees the texture and the handle is dead afterwards. */
    destroy(): void;
}
/**
 * Wrap `source` in an engine texture and take its content once.
 *
 * Null where there is no WebGL2 context to upload through (the native backend,
 * a host still booting) — an answer, not a failure. Takes the App because the
 * module behind it is engine-internal, and a service that samples someone
 * else's canvas has an App and should need nothing more.
 */
declare function createCanvasTexture(app: App | null | undefined, source: GlImageSource): CanvasTexture | null;

/**
 * @file    sheetGrid.ts
 * @brief   How a sprite sheet is cut into cells — the one author for that stride.
 *
 * Three surfaces cut a sheet the same way and each had written the arithmetic
 * down: the flipbook's `.esanim`, the tileset's atlas, and the particle emitter's
 * `spriteColumns`/`spriteRows`. The stride is `margin + i * (cell + spacing)` in
 * all of them, and it is the kind of expression that is wrong by one for a long
 * time before anybody notices, because a sheet with no margin and no spacing —
 * which is most of them — hides every mistake in both terms.
 *
 * So it lives here, named for what it is rather than for whoever asked first.
 * `.esanim` keeps its own spellings as one-line delegates: this is the author,
 * those are the aliases.
 *
 * A cell is addressed row-major from 0, the way every one of those surfaces
 * already addresses it.
 */
/**
 * A sheet's cutting geometry, in the image's own pixels. `pageWidth`/`pageHeight`
 * are the whole image, which is what turns a pixel rect into a UV window.
 */
interface SheetGrid {
    cellWidth: number;
    cellHeight: number;
    margin: number;
    spacing: number;
    pageWidth: number;
    pageHeight: number;
}
/** Columns the grid fits across the page. At least 1, so cell 0 always resolves. */
declare function sheetCols(grid: SheetGrid): number;
/** Rows the grid fits down the page. At least 1, for the same reason. */
declare function sheetRows(grid: SheetGrid): number;
/** How many cells the grid holds — what a cell index is addressed against. */
declare function sheetCellCount(grid: SheetGrid): number;
/** Pixel rect of a cell, clamped into the valid range so no index escapes the page. */
declare function sheetCellRect(grid: SheetGrid, cell: number): {
    x: number;
    y: number;
    width: number;
    height: number;
};
/**
 * UV window of a cell — exactly what `Sprite.uvOffset` / `Sprite.uvScale` take.
 *
 * Y is flipped: a sheet is addressed from its top-left, UV space runs from the
 * bottom, so cell 0 carries the HIGHEST v. That is the one thing here that reads
 * as wrong in an inspector until you remember which way an image is stored.
 */
declare function sheetCellUv(grid: SheetGrid, cell: number): {
    uvOffset: {
        x: number;
        y: number;
    };
    uvScale: {
        x: number;
        y: number;
    };
};

/**
 * @file  The two things a scene file's entity list can hold, and how to tell
 *        them apart. Its own module so the loader and the validator ask the same
 *        question rather than each spelling the test out.
 */

/**
 * A scene-file entity is either an ordinary entity record or a prefab-instance
 * entry — a minimal delta over a `.esprefab` asset. The runtime expands each
 * instance through the same `flattenPrefab` core the editor uses, so a saved
 * prefab scene loads identically in both.
 */
type SceneEntry = SceneEntityData | PrefabInstanceEntry;
/** True for a prefab-instance entry (carries a `prefab` asset ref). */
declare function isPrefabEntry(e: SceneEntry): e is PrefabInstanceEntry;

/**
 * @file  Everything wrong with a scene, in the vocabulary prefabs already speak.
 *
 *        A prefab has been validated at every gate it passes since it got a
 *        format; a scene — the document a game actually ships — was checked
 *        nowhere, and the loader answered a repeated id by keeping whichever
 *        entity came last. Both are entity documents, so both are read by the
 *        shared checks, and a scene only adds what is its own: it is a forest
 *        rather than one rooted tree, and its prefab-instance entries stand in
 *        for entities that are not expanded yet.
 */

/**
 * Validate a scene and return every problem found. Errors mean the scene cannot
 * be loaded into a world that means what the file says; warnings are loadable.
 * Pure + total — nothing here throws, and the caller decides what a finding
 * costs.
 */
declare function validateScene(scene: SceneData): DocumentDiagnostic[];

/** A streamable cell: an additive scene with a world-space center + radius. */
interface StreamCell {
    /** Registered scene name (must be a `SceneManager.register`ed scene). */
    scene: string;
    x: number;
    y: number;
    /** Where the cell sits in depth. Absent = the plane a flat scene draws on. */
    z?: number;
    /** Cell radius in world units; distances are measured to the cell edge. */
    radius: number;
}
interface StreamDecision {
    toActivate: string[];
    toDeactivate: string[];
}
/**
 * Decide which cells cross the load/unload thresholds this tick. A cell becomes
 * active when its edge is within `loadRadius`; an active cell deactivates only
 * once its edge passes `unloadRadius` (hysteresis). Cells inside the band keep
 * their current state. Pure.
 *
 * A cell is a sphere, not a circle: measuring in two axes makes every floor of a
 * tower the same place, so a world stacked in depth holds all of it resident at
 * once. Both z default to 0, which is where a flat game's cells and focus are —
 * the third term vanishes and the answer is the plane one.
 */
declare function computeStreaming(cells: readonly StreamCell[], focusX: number, focusY: number, loadRadius: number, unloadRadius: number, active: ReadonlySet<string>, focusZ?: number): StreamDecision;
/** Out-of-range cells are fully unloaded, or merely put to sleep (faster wake). */
type StreamPolicy = 'unload' | 'sleep';
interface SceneStreamingConfig {
    loadRadius: number;
    /** Clamped up to `loadRadius` if smaller (hysteresis requires unload ≥ load). */
    unloadRadius: number;
    policy?: StreamPolicy;
}
/**
 * The slice of SceneManager the streamer drives. `SceneManagerState` satisfies it
 * structurally; tests inject a recording stub.
 */
interface SceneStreamHost {
    loadAdditive(name: string): Promise<unknown>;
    unload(name: string): Promise<void>;
    sleep(name: string): void;
    wake(name: string): void;
    isLoaded(name: string): boolean;
    isSleeping(name: string): boolean;
}
declare class SceneStreamingController {
    private readonly host_;
    private readonly cells_;
    /** Cells the controller currently considers in-range (hysteresis state). */
    private readonly active_;
    /** Cells with an async load/unload in flight, so it isn't issued twice. */
    private readonly inFlight_;
    private focusX_;
    private focusY_;
    private focusZ_;
    private loadRadius_;
    private unloadRadius_;
    private policy_;
    private focusEntity_;
    constructor(host: SceneStreamHost, config?: SceneStreamingConfig);
    configure(config: SceneStreamingConfig): void;
    register(cell: StreamCell): void;
    unregister(scene: string): void;
    clear(): void;
    /** Set the focus directly (or let the streaming system read a focus entity).
     *  @p z defaults to the plane a flat game's cells sit on. */
    setFocus(x: number, y: number, z?: number): void;
    /** Follow an entity; the streaming system reads its Transform each tick. */
    setFocusEntity(entity: Entity | null): void;
    getFocusEntity(): Entity | null;
    /** Scenes the controller currently holds in-range. */
    getActive(): string[];
    /** Reconcile resident cells against the current focus. Idempotent per tick. */
    update(): void;
    private activate_;
    private deactivate_;
}
declare const SceneStreaming: ResourceDef<SceneStreamingController>;

/**
 * @file    scenePlugin.ts
 * @brief   Plugin that provides scene management capabilities
 */

declare const sceneManagerPlugin: Plugin;

/**
 * @file    components.ts
 * @brief   What a project AUTHORS about residency: that a world is streamed, what
 *          stays out of the streaming, and who asks for content to be present.
 *
 * @details Three declarations and no policy. The grid is read by the cook, which
 *          is what turns one authored world into a persistent scene plus cells;
 *          the source is read by the streamer, which is the only thing that
 *          decides what exists. Neither is a place to put "load this now" — a
 *          game that could say that has an answer the engine can never make
 *          asynchronous.
 */

/** The plane a streamed world is cut on. @experimental */
declare enum StreamPlane {
    /** A 3D world's ground: cells along world x and z, and y does not partition. */
    Ground = 0,
    /** A 2D world's screen plane: cells along world x and y, and z (depth, layering) does not partition. */
    Screen = 1
}
/** The fields of the `StreamedWorld` component. @experimental */
interface StreamedWorldData {
    /**
     * Edge of one square cell in world units, on the plane below. The axis that is not on the plane does not
     * partition: on the ground a cell is a vertical column, so a tower's floors are one place.
     */
    cellSize: number;
    /** The plane the cells lie on: the ground (x, z) of a 3D world, or the screen (x, y) of a 2D one. */
    plane: StreamPlane;
}
/**
 * Declares the scene carrying it a streamed world, and how the cook cuts it.
 *
 * Its entity is persistent by construction — it is what says the world streams.
 * Presence is the switch: remove it and the scene loads whole, which is what a
 * small one should do and what every scene did before.
 *
 * @experimental
 */
declare const StreamedWorld: ComponentDef<StreamedWorldData>;
/**
 * Keeps the entity's whole subtree out of the partition — the player, the camera,
 * the sun, the services that outlive any place.
 *
 * NOT scene persistence (`setPersistent`, which is about surviving a scene
 * SWITCH): this decides which cooked scene an entity is written into.
 *
 * @experimental
 */
declare const WorldPersistent: ComponentDef<{}>;
/** The fields of the `WorldStreamingSource` component. @experimental */
interface WorldStreamingSourceData {
    /**
     * Cells this close are PREPARED — fetched, decoded, their assets acquired —
     * without being brought into the world. Speculation, never authority: a
     * prepared cell a source turns away from is thrown away, not published.
     * Clamped up to `loadRadius`.
     */
    prefetchRadius: number;
    /** Cells whose nearest edge is within this distance are asked for. */
    loadRadius: number;
    /**
     * A resident cell is only given up once its nearest edge passes this. Must
     * exceed `loadRadius`: the gap between the two is the band that stops a
     * source standing on a boundary from loading and unloading every frame.
     */
    unloadRadius: number;
    enabled: boolean;
}
/**
 * "Keep the world near me present." Add it beside a `Transform`.
 *
 * A source states a need, never a decision: several may exist and their asks are
 * UNIONED, which is what makes split screen, a spectator, a cinematic camera and
 * an editor preview the same kind of thing.
 *
 * @experimental
 */
declare const WorldStreamingSource: ComponentDef<WorldStreamingSourceData>;

/**
 * @file    cells.ts
 * @brief   What a cooked world IS, and the one function that decides which of its
 *          cells should exist right now.
 *
 * @details Separated from the streamer on purpose: residency is a decision about
 *          geometry and radii, and everything expensive — loading, spawning,
 *          releasing — is what happens AFTER it. Pure here means the union rule
 *          and the hysteresis band can be held to by a criterion that never
 *          builds a world.
 */
/** One cooked cell: an additive scene, and the ground it covers. @experimental */
interface WorldCell {
    /** Registered scene name — what `SceneManager` is asked to bring up. */
    name: string;
    /** Where its document ships, package-relative. */
    path: string;
    /** Grid coordinate on the XZ plane. */
    x: number;
    z: number;
    /**
     * The ground it covers, world units. The grid square UNIONED with where its
     * content actually is: a cell is asked for by distance to this box, and a
     * prop hanging over the edge is part of the place the box stands for.
     */
    minX: number;
    minZ: number;
    maxX: number;
    maxZ: number;
    /** Authored entities inside, for a report that can be checked against the world. */
    entityCount: number;
    /** Top-level authored entities inside — each one a residency atom. */
    rootCount: number;
}
/** A cooked world: the persistent scene's cells. @experimental */
interface WorldManifest {
    version: number;
    /** Registered name of the persistent scene these cells belong to. */
    scene: string;
    /** Edge of one grid square, world units. */
    cellSize: number;
    /**
     * The world plane the cells lie on: `'xz'` (the default, and what a manifest cooked before this field has) or `'xy'` for a 2D world. A cell's
     * `z` and `minZ`/`maxZ` are the SECOND axis of that plane, so on `'xy'` they are world y.
     */
    plane?: 'xz' | 'xy';
    /**
     * Authored ids in the persistent world that a cell holds a hard reference to.
     * Only these are kept resolvable — a table of every row would be a cost the
     * whole world pays for the handful of references that exist.
     */
    persistentRefs: number[];
    cells: WorldCell[];
}
/** One source's ask, as the streamer samples it. @experimental */
interface ResidencySource {
    x: number;
    z: number;
    loadRadius: number;
    unloadRadius: number;
    /** How early this source is worth preparing for. Never below `loadRadius`. */
    prefetchRadius: number;
}
/** The plane a manifest's cells lie on, a manifest cooked before the field existing as the ground. @experimental */
declare function manifestPlane(manifest: {
    plane?: 'xz' | 'xy';
} | null): 'xz' | 'xy';
/** The second coordinate of a world position on a plane: z on the ground, y on the screen. @experimental */
declare function planeSecond(position: {
    y: number;
    z?: number;
}, plane: 'xz' | 'xy'): number;
/** What residency should be, and the moves that get there. @experimental */
interface ResidencyDecision {
    /** Every cell that should exist after this tick, in manifest order. */
    target: string[];
    /**
     * Cells worth PREPARING: near enough that a source may soon want them. A
     * superset of the demanded ones in the ordinary case, but not by rule — a
     * cell held by hysteresis can sit past every prefetch radius.
     */
    prefetch: string[];
    /** Demanded and not resident, nearest first: what to publish. */
    toLoad: string[];
    toUnload: string[];
}
/**
 * The cell a world position falls in — the one rule, with two callers that must
 * not drift: the cook assigns every top-level root by it, and the editor draws
 * its grid from it. `z` is the position's SECOND coordinate on the plane the
 * world is cut on: world z on the ground, world y on the screen plane.
 */
declare function cellAt(x: number, z: number, cellSize: number): {
    x: number;
    z: number;
};
/**
 * The grid square one cell coordinate stands for.
 *
 * NOT the same as {@link WorldCell}'s box: a cooked cell's box is this square
 * unioned with where its content actually reached, so it is usually larger. This
 * is the partition; that is the partition plus its overhang.
 */
declare function cellSquare(cellX: number, cellZ: number, cellSize: number): {
    minX: number;
    minZ: number;
    maxX: number;
    maxZ: number;
};
/**
 * Ground-plane distance from a point to a cell's box; zero inside it.
 *
 * To the BOX rather than to the cell's centre, because a centre answers the same
 * for a source standing on a diagonal corner as for one a whole cell away, and
 * that is where holes open in a world laid out on a grid.
 */
declare function distanceToCell(cell: WorldCell, x: number, z: number): number;
/**
 * Which cells should exist, given where the sources are and what is resident.
 *
 * A UNION, never a fold: a fold lets the last source win, and a second camera
 * then deletes the world the first is standing in. The band is the other half —
 * in at `loadRadius`, out past `unloadRadius`, so a boundary is not a treadmill.
 */
declare function desiredResidency(cells: readonly WorldCell[], sources: readonly ResidencySource[], resident: ReadonlySet<string>): ResidencyDecision;

/**
 * Where a cell is in its lifetime.
 *
 * `prepared` is the one worth naming: fetched, decoded, its assets acquired, and
 * carrying not one runtime entity. Nothing in the world can observe it, because
 * there is nothing there to observe.
 *
 * @experimental
 */
type CellResidency = 'unloaded' | 'preparing' | 'prepared' | 'publishing' | 'resident' | 'unloading';
/**
 * The slice of `SceneManager` the streamer drives. `SceneManagerState` satisfies
 * it structurally; a criterion injects a recording stub.
 *
 * @experimental
 */
interface WorldStreamHost {
    register(config: SceneConfig): void;
    prepare(name: string): Promise<void>;
    /**
     * Make the render programs a prepared cell requires ready. Absent on a host
     * that predates the obligation, which reads as not applicable — the same
     * answer a headless one gives, and never a claim that succeeded.
     */
    readyRenderPrograms?(name: string): Promise<RenderReadiness>;
    discardPrepared(name: string): number;
    loadAdditive(name: string): Promise<unknown>;
    unload(name: string, options?: {
        keepPersistent?: boolean;
    }): Promise<void>;
    isLoaded(name: string): boolean;
}
/** What the streamer is doing, for a report. @experimental */
interface WorldStreamerStatus {
    cellCount: number;
    sourceCount: number;
    /** Cells that should exist right now, load radius unioned with the kept band. */
    desiredCells: string[];
    /** Cells worth readying: what any source is close enough to speculate about. */
    prefetchCells: string[];
    residentCells: string[];
    /** Ready and holding nothing the world can see. */
    preparedCells: string[];
    loadingCells: string[];
    unloadingCells: string[];
    /** Cells brought in since boot, and cells taken out. Churn is the difference. */
    loadCount: number;
    unloadCount: number;
    /** Preparations begun, and preparations thrown away unpublished. */
    prepareCount: number;
    cancelCount: number;
    /** Of those preparations, the ones begun for a cell nobody had asked for yet. */
    prefetchRequests: number;
    /** Acquisitions given back by discarding readiness — not by unloading. */
    cancelledRefs: number;
    /**
     * Decided the instant a cell is first DEMANDED, by what demand finds there:
     * readiness that already exists is a hit, and anything else — nothing, or a
     * preparation still in flight — is a miss. A preparation that was on its way
     * is not a hit: the player waited for it either way.
     */
    prefetchHits: number;
    prefetchMisses: number;
    /** Demanded to resident, milliseconds — what a prefetch hit is worth. */
    lastDemandToResidentMs: number;
}
/** Where one cell's last delivery spent its time. @experimental */
interface CellDelivery {
    /** Phases of the preparation, which runs between frames and on no system timer. */
    phases: Record<string, number>;
    /** Issue to resident. For a hit this contains the dwell, so it is not a latency. */
    deliveryMs: number;
    prepareMs: number;
    publishMs: number;
    /** The latency a player feels: from wanting the place to standing in it. */
    demandToResidentMs: number;
    /** How long readiness waited to be wanted. Zero on a miss — nothing waited. */
    dwellMs: number;
    outcome: 'hit' | 'miss' | '';
}
declare class WorldStreamer {
    private readonly host_;
    private manifest_;
    /** In manifest order, so every list this produces is stable. */
    private readonly cells_;
    private sourceCount_;
    private loadCount_;
    private unloadCount_;
    private prepareCount_;
    private cancelCount_;
    private cancelledRefs_;
    private prefetchRequests_;
    private prefetchHits_;
    private prefetchMisses_;
    private lastDemandToResident_;
    private readonly operations_;
    private clearPromise_;
    private clearing_;
    private manifestRequest_;
    constructor(host: WorldStreamHost);
    /** Adopt a cooked world after the previous world's operations and receipts drain. The latest request wins. */
    loadManifest(manifest: WorldManifest, sceneConfig?: (cell: WorldCell) => SceneConfig): Promise<void>;
    get manifest(): WorldManifest | null;
    residencyOf(name: string): CellResidency;
    /**
     * The render-program claim a cell holds, or null when it holds none.
     *
     * A cell on a host with no renderer holds NONE — the obligation did not
     * apply, which is a different fact from a claim that succeeded and must stay
     * distinguishable from one. Publication reads this to re-check freshness.
     *
     * @experimental
     */
    renderReadinessOf(name: string): RenderReadinessStamp | null;
    /**
     * How often publication found this cell's claim stale and made a new one.
     *
     * Zero across a dwell where nothing moved: readying again for content that
     * did not change is the cost prefetching exists to avoid paying twice.
     *
     * @experimental
     */
    restampsOf(name: string): number;
    /**
     * Where a cell's load spent its time.
     *
     * Most of a load runs BETWEEN frames — off every system timer there is — so a
     * profiler watching the frame loop sees the cost and cannot name it.
     */
    recordPhase(name: string, phase: string, ms: number): void;
    /**
     * Per cell: where its last delivery spent its time.
     *
     * Per CELL and not a running average, because the question prefetch answers
     * is asked one arrival at a time: a mean over hits and misses together
     * describes no arrival that happened.
     */
    delivery(): Record<string, CellDelivery>;
    /**
     * Reconcile residency against where the sources are.
     *
     * The sources arrive as a list and are unioned, never folded: a fold gives
     * the last one written the whole answer, and then a second camera deletes
     * the world the first is standing in.
     */
    update(sources: readonly ResidencySource[]): void;
    /** Drain every cell and preparation; registrations remain reusable by a later update. Cancels pending adoption. */
    clear(): Promise<void>;
    private clearCells_;
    /** Track host operations through their completion handlers so replacement cannot reuse a live scene name. */
    private run_;
    status(): WorldStreamerStatus;
    /**
     * A cell has just been asked for, and what the ask FINDS is the hit.
     *
     * Not judged at publication: "prepared by the time we published it" is true
     * of every cell that ever loads. Only readiness that already existed when
     * the ask arrived took anything off the wait.
     */
    private demand_;
    /**
     * Move one cell toward what it should be, or leave it alone while an earlier
     * move is still in flight. Re-entered when that move finishes, which is what
     * lets a source that turned around re-issue the opposite one — without this,
     * a cell whose load was overtaken stays resident forever.
     */
    private step_;
    private discardPrepared_;
    private beginPrepare_;
    /**
     * Pay the render-program obligation, or leave it owed.
     *
     * A debt rather than an event: a claim that could not be made leaves the cell
     * in `preparing` with its assets intact, and the next progression tries
     * again. Dropping it would strip a preparation that had almost finished.
     */
    private settleReadiness_;
    /**
     * Ask the host to ready a cell's programs, as a promise either way.
     *
     * A host that throws SYNCHRONOUSLY would otherwise unwind through the
     * progression and leave the streamer mid-step. A failed readying is an
     * outcome this handles, not one it propagates.
     */
    private askReadiness_;
    /** Every obligation is satisfied: only now is the cell prepared. */
    private markPrepared_;
    /**
     * The obligation publication has, which is not the one preparation had.
     *
     * A claim about THEN, so requirements are derived AGAIN rather than inferred
     * from what looks like it moved. A stale one blocks this publication without
     * sending the cell backwards; an unpayable debt leaves it prepared.
     */
    private publishWhenReady_;
    private beginLoad_;
    private beginUnload_;
}
/** The world's residency authority. @experimental */
declare const WorldStreaming: ResourceDef<WorldStreamer>;

/**
 * Sample every enabled source and hand the whole list to the streamer.
 *
 * A list, not a focus: the streamer unions them. Exported because this is the
 * only place a `Transform` becomes a residency ask, which is what the criterion
 * for "a second source cannot delete the first one's world" has to reach.
 */
declare const worldResidencySystem: SystemDef;
/**
 * Residency, over the scene manager's primitives.
 *
 * `PostUpdate`: a source's ask is about where it ended this frame, and reading it
 * before movement asks for the world it was in last frame — which at a boundary
 * is the wrong side of it.
 */
declare const worldResidencyPlugin: Plugin;

/**
 * @file    report.ts
 * @brief   What residency did, as numbers something outside the frame can check.
 *
 * @details A picture cannot answer this. "The far cell is not drawn" and "the far
 *          cell does not exist" look identical from a camera, and the difference
 *          between them is the whole feature — so what is published is the count
 *          of things that ARE, per cell, beside what the cook said the cell holds.
 *
 *          Read-only, and residency-owned facts only: how many bodies physics
 *          still has is physics' answer, and a residency report that reached for
 *          it would be the second author this design exists to avoid.
 */

/** @experimental */
interface WorldResidencyReport {
    /** False when this build has no cooked world; every other field is empty. */
    streamed: boolean;
    cellCount: number;
    /**
     * Where the cells ARE, in manifest order — the ground each name stands for.
     *
     * Every other list here is names, and a name cannot be drawn. A reader that
     * had to find the coordinates elsewhere would be reading a second copy of
     * the partition, which agrees with this one only until one of them moves.
     */
    cells: Array<{
        name: string;
        x: number;
        z: number;
    }>;
    /** Edge of one grid square, world units — what the coordinates above scale by. */
    cellSize: number;
    /** The plane the cells lie on: a cell's z is world z on 'xz' (the ground) and world y on 'xy' (a 2D world's screen). */
    plane: 'xz' | 'xy';
    sourceCount: number;
    desiredCells: string[];
    /** Cells any source is close enough to speculate about. */
    prefetchCells: string[];
    residentCells: string[];
    /** Ready, owning assets, and holding nothing the world can see. */
    preparedCells: string[];
    /** Of those, the ones holding a render-program claim. A prepared cell with
     *  none was readied by a host that has no renderer to ready. */
    preparedWithRenderClaim: string[];
    /** Each of those claims, and how often publication found one stale. Absent
     *  from the map = that cell holds none. */
    renderClaims: Record<string, RenderReadinessStamp & {
        restamps: number;
    }>;
    loadingCells: string[];
    unloadingCells: string[];
    loadCount: number;
    unloadCount: number;
    prepareCount: number;
    cancelCount: number;
    /** Of those preparations, the ones begun before anything asked for the cell. */
    prefetchRequests: number;
    /** Acquisitions given back by discarding readiness — not by unloading. */
    cancelledRefs: number;
    /** What demand FOUND, counted the instant it arrived. See `WorldStreamerStatus`. */
    prefetchHits: number;
    prefetchMisses: number;
    lastDemandToResidentMs: number;
    /** Live entities each resident cell owns. Absent from the map = not resident. */
    cellEntityCounts: Record<string, number>;
    /** Of those, how many draw anything. */
    cellRenderCounts: Record<string, number>;
    /** Acquisitions each resident cell still owes. Zero after it unloads. */
    assetRefsByCell: Record<string, number>;
    /** What the cook put in each cell — the number a live count is checked against. */
    authoredCellEntityCounts: Record<string, number>;
    /**
     * Each resident cell's authored rows and the handle each one currently has.
     * The row survives a reload and the handle does not, which is the difference
     * between an identity and a way to reach something that exists.
     */
    cellRows: Record<string, Array<{
        id: number;
        entity: number;
    }>>;
    /** Live entities the persistent world owns; residency never touches these. */
    persistentEntities: number;
    /** Their handles. Unchanged for the life of the world — that is the claim. */
    persistentHandles: number[];
    /**
     * Per cell: where its last delivery spent its time, and whether the ask for
     * it found readiness waiting. The phases run between frames, which is why no
     * frame profiler holds them and why a total is not a hitch.
     */
    delivery: Record<string, CellDelivery>;
}
/**
 * Residency as it stands this instant.
 *
 * @experimental
 */
declare function worldResidencyReport(app: App): WorldResidencyReport;

/**
 * @file    identity.ts
 * @brief   The authored id an entity came from, which is what survives a cell
 *          leaving and coming back.
 *
 * @details A runtime handle names an entity that EXISTS; a cell's unload ends
 *          every one of them and its reload mints new ones. So a handle is the
 *          wrong thing to write down about a place, and the authored id — the row
 *          the cook wrote into the cell document — is the right one.
 *
 *          Recorded through `SceneOrigins`, which a streamed world switches on:
 *          a game that never streams keeps paying nothing for the table.
 */

/**
 * Authored id → live entity, for the persistent rows a cell is allowed to name.
 *
 * Only the rows the cook recorded: a table of the whole persistent world would
 * be a cost every frame of every game pays for the handful of references that
 * actually cross the boundary.
 */
declare function persistentEntityRows(app: App, manifest: WorldManifest): ReadonlyMap<number, Entity>;
/**
 * The authored id `entity` was loaded from — its identity across a cell's
 * lifetime, as opposed to the handle, which is only good while it exists.
 */
declare function stableEntityId(app: App, entity: Entity): number | undefined;

/**
 * @file    partitionWorld.ts
 * @brief   Cutting one authored world into a persistent scene plus cells.
 *
 * @details Lives in the runtime rather than the pipeline because a packaged build
 *          is not the only host that has to cut a world: an editor Play session
 *          cuts the unsaved document the same way, and two implementations of
 *          "which cell is this in" is two worlds.
 *
 *          The RESULT is still cooked content. A packaged game that walked its
 *          whole world at boot to decide who lives where has already paid for the
 *          world it was trying not to load.
 *
 *          Only TOP-LEVEL entities are placed. That is what makes a subtree the
 *          residency atom rather than a rule to remember: a door cannot be sorted
 *          away from its house, because the door was never asked. Placing by each
 *          entity's own world position is the version of this that leaves children
 *          behind when their parent unloads, and it takes the hierarchy contract
 *          with it.
 *
 *          Pure: the caller supplies what only a project can answer — which
 *          fields hold entity references, and where a prefab's root sits.
 */

interface Vec3$1 {
    x: number;
    y: number;
    z: number;
}
/** Where a prefab asset's root sits, for an instance that does not override it. */
interface PrefabRoot {
    rootId: string;
    position: Vec3$1;
}
interface PartitionOptions {
    /** The entity-valued fields of a component type; empty for most. */
    entityFieldsOf(componentType: string): readonly string[];
    /** Resolve a scene's `@uuid:` prefab reference. Absent = instances must override. */
    resolvePrefab?(ref: string): PrefabRoot | null;
}
/** One cooked cell: what it covers, and the scene document that fills it. */
interface PartitionedCell {
    name: string;
    x: number;
    z: number;
    minX: number;
    minZ: number;
    maxX: number;
    maxZ: number;
    entityCount: number;
    rootCount: number;
    data: SceneData;
}
interface WorldPartition {
    cellSize: number;
    /** The plane the cells lie on. */
    plane: 'xz' | 'xy';
    /** The entry scene as it now ships: everything residency never removes. */
    persistent: SceneData;
    cells: PartitionedCell[];
    /**
     * Authored ids a cell references in the persistent world. The runtime needs
     * exactly these to resolve across the document boundary.
     */
    persistentRefs: number[];
    /** Refuse the build. A dangling hard reference is not a warning. */
    errors: string[];
    warnings: string[];
}
/**
 * Cut `scene` into a persistent scene plus cells, or answer null when the scene
 * never declared itself streamed — which is every scene that came before this
 * and every small one that should stay whole.
 */
declare function partitionWorld(scene: SceneData, sceneName: string, options: PartitionOptions): WorldPartition | null;

/**
 * @file    cutWorld.ts
 * @brief   One authored world, cut — the entry both hosts of a streamed world go
 *          through.
 *
 * @details A cook writes the result to files and a play realm keeps it in memory,
 *          and that is the ONLY difference between them: same partition, same
 *          manifest, same cell names, same paths. Two hosts assembling their own
 *          manifests is how a world comes to mean one thing in the editor and
 *          another in the package — the failure this module exists to make
 *          impossible, because there is nowhere left to disagree.
 */

/** Where cooked world content goes, package-relative. */
declare const WORLD_DIR = "world";
/**
 * Where a cell's document ships. A realm that delivers cells from memory never
 * fetches this, but it carries the same value: two manifests that differ in a
 * field one side ignores are still two manifests, and nothing would catch it.
 */
declare function cellDocumentPath(cellName: string): string;
/** Where a world's manifest ships, package-relative. */
declare function worldManifestPath(sceneName: string): string;
/** An authored world, cut into what ships and what arrives. @experimental */
interface CutWorld {
    /** What residency is told about the world — byte-identical on both hosts. */
    manifest: WorldManifest;
    /** The entry scene as it now boots: everything residency never removes. */
    persistent: SceneData;
    /** Cell name → its document, for a host that delivers cells from memory. */
    documents: Map<string, SceneData>;
    /**
     * Why this world cannot be cut. A hard reference across a residency boundary
     * is one: shipping it produces a handle that dangles the first time a player
     * walks away. Non-empty means refuse — in a build AND in Play, because a
     * world the editor agreed to run is one the author will ship.
     */
    errors: readonly string[];
    warnings: readonly string[];
}
/**
 * Cut `scene`, or answer null when it never declared itself a streamed world —
 * which is every scene that came before this and every small one that stays whole.
 */
declare function cutWorld(scene: SceneData, sceneName: string, options: PartitionOptions): CutWorld | null;
/** Where a prefab asset's root sits, from its document. Null if it has no root. */
declare function prefabRootOf(document: unknown): PrefabRoot | null;
/**
 * Read every prefab `scene` instances, and answer where each one's root sits.
 *
 * A synchronous lookup, resolved up front, because the partition is pure and one
 * that could await inside it would not be. Both hosts come through here; they
 * differ only in how the bytes are fetched.
 */
declare function resolvePrefabRoots(scene: SceneData, read: (ref: string) => Promise<unknown | null>): Promise<(ref: string) => PrefabRoot | null>;

/**
 * @file    componentRefs.ts
 * @brief   Which component fields hold entity references, asked of the engine
 *          rather than listed here.
 *
 * @details A table would answer for the components someone remembered. The
 *          registry answers for every one registered where the question is asked
 *          — and that is not the same set on both sides: a cook loads the
 *          engine's components, while a play realm has also drained the project's
 *          own bundle. Play's reference check is therefore a SUPERSET of the
 *          cook's, and a cross-cell reference held by a project component is
 *          found in the editor first. The runtime is the backstop for whatever
 *          neither saw: an id it cannot resolve is cleared, never left pointing
 *          at another entity.
 */
/**
 * A lookup over the registry as it stands right now.
 *
 * Taken as a snapshot rather than answered per call, because `getComponentRegistry`
 * composes a fresh map on every call and a partition asks this once per component
 * field of every entity in the world.
 */
declare function registryEntityFields(): (componentType: string) => readonly string[];

/**
 * Per loaded entity, the id it carried in the scene document.
 *
 * Absent unless a consumer asks for it. The editor, streamed cells and authored
 * procedural zones use the document identity across entity lifetimes; games
 * without those consumers do not pay for the table.
 *
 * @experimental
 */
declare const SceneOrigins: ResourceDef<Map<number, number>>;
/**
 * Start recording origins on `app`. Call before the first scene loads — what is
 * already spawned was not recorded.
 *
 * @experimental
 */
declare function enableSceneOrigins(app: App): void;
/** @experimental */
declare function sceneOriginsEnabled(app: App): boolean;
/**
 * Record a scene load's document-id → entity map. No-op unless enabled.
 *
 * @experimental
 */
declare function recordSceneOrigins(app: App, entityMap: ReadonlyMap<number, Entity>): void;
/**
 * The document id `entity` was loaded from; undefined if the game spawned it (or
 * nothing is recording).
 *
 * @experimental
 */
declare function sceneOriginOf(app: App, entity: Entity): number | undefined;

/**
 * @file    sceneTransition.ts
 * @brief   Convenience wrapper for scene transitions
 */

/** A cross-scene fade: how long, and what colour it passes through.
 *  @beta */
interface TransitionConfig {
    duration: number;
    type: 'fade';
    color?: Color;
}
/**
 * Pass the App from host code, or the `Res(SceneManager)` state from inside a
 * system.
 *
 * @beta
 */
declare function transitionTo(host: App | SceneManagerState, targetScene: string, config: TransitionConfig): Promise<void>;

/**
 * An override as written at a SPAWN: the entity id may be left out, and then it
 * is the prefab's root — which is the entity a one-sprite prefab has.
 *
 * @beta
 */
type SpawnOverride = Omit<PrefabOverride, 'prefabEntityId'> & {
    prefabEntityId?: string;
};
/**
 * Prefab instantiation, as `Res(Prefabs)` hands it over.
 *
 * `@beta`: `instantiate` is the whole surface and it has not moved, but its result
 * and override shapes are spelled in the prefab document model, which is also the
 * on-disk format — so their names are settled ahead of the shapes.
 *
 * @beta
 */
declare class PrefabServer {
    private readonly world_;
    private readonly getAssets_;
    private readonly getScenes_;
    constructor(world: World, getAssets: () => Assets, getScenes?: () => SceneManagerState | null);
    /**
     * Spawn a prefab into the world. What it spawns belongs to the scene that
     * was live when it landed, exactly like an entity that scene authored —
     * ownerless, a bullet or a called minion leaks into the next room. Pass
     * `scene: false` for something meant to outlive the area it came from.
     */
    instantiate(pathOrAddress: string, options?: {
        baseUrl?: string;
        parent?: Entity;
        overrides?: SpawnOverride[];
        scene?: boolean;
    }): Promise<InstantiatePrefabResult>;
    /**
     * The load is asynchronous, so the scene that asked may already be gone by
     * the time the entities exist — adopting into whatever is active now is the
     * only owner that is real, and a switch that already happened takes it.
     */
    private adoptIntoActiveScene_;
}
/**
 * Prefab instantiation, as a resource. Spawning from a prefab is asynchronous
 * because its assets may not be loaded yet.
 *
 * @beta
 */
declare const Prefabs: ResourceDef<PrefabServer>;
declare class PrefabsPlugin implements Plugin {
    name: string;
    dependencies: ResourceDef<Assets>[];
    build(app: App): void;
}
declare const prefabsPlugin: PrefabsPlugin;

/**
 * @file    AudioProjectConfig.ts
 * @brief   Project-declared mixer state (project.esproject `features.audio`):
 *          bus volumes, custom buses, insert chains, duck rules. The runtime
 *          applies it at boot; the editor Mixer edits the same shape. On
 *          backends without a WebAudio graph every step degrades to a no-op
 *          through the AudioAPI guards.
 */

interface AudioBusDecl {
    name: string;
    /** Parent bus for buses beyond the default five (default parent: master). */
    parent?: string;
    volume?: number;
    muted?: boolean;
    effects?: BusEffectDef[];
    duck?: BusDuckRule;
}
interface AudioProjectConfig {
    buses?: AudioBusDecl[];
    /** How many voices may sound at once before `priority` decides which is
     *  dropped. 0 or less means no cap. */
    maxVoices?: number;
    /**
     * Clips whose import settings ask for something other than `auto`, by project-relative path:
     * `streaming` plays one from its compressed file, `decompress` decodes it at load. Written by the
     * editor and the exporter from the assets' import settings, never by hand in the project file.
     */
    loadTypes?: Record<string, Exclude<AudioLoadType, 'auto'>>;
    /**
     * Clips the exporter re-encoded, by project-relative path: how long each really is and the silence the encoding
     * put before it, in seconds. Written by the exporter only; a project played from its own files has none.
     */
    encoded?: Record<string, {
        seconds: number;
        lead: number;
    }>;
}
/** Normalize arbitrary JSON into a valid config (tolerant; drops junk). */
declare function parseAudioProjectConfig(raw: unknown): AudioProjectConfig;
/**
 * Apply the declared mixer state: create missing buses, then set volume /
 * mute / effects / duck per declaration. Full-state semantics — a declared
 * bus with no `duck` clears any prior rule, so the editor can re-apply live.
 */
declare function applyAudioProjectConfig(audio: AudioAPI, config: AudioProjectConfig | undefined): void;

/**
 * @file  debugChannelProtocol.ts — what a development build and the editor say to
 *        each other. Its own module so the core can name the protocol without
 *        carrying the channel.
 */

declare const DEBUG_CHANNEL_PROTOCOL = 1;
/** The editor's address as a development export writes it into the config. */
interface DebugChannelConfig {
    /** `ws://<editor host>:<port>/?token=<token>` */
    url: string;
    /** The project the build was made from, so the editor can tell a build of
     *  another project from one of the project it has open. */
    project?: string;
}
/** What `control` changes; each field absent leaves that setting alone. */
interface DebugControl {
    paused?: boolean;
    /** Advance this many frames — a paused game included. */
    step?: number;
    /** A cap on the frame rate; 0 lifts it. */
    fps?: number;
}
type DebugChannelQuery = {
    t: 'query';
    reqId: number;
    kind: 'frameCapture';
} | {
    t: 'query';
    reqId: number;
    kind: 'frameReplay';
    drawIndex: number;
    maxSide?: number;
}
/** The whole composited frame, as the engine drew it. */
 | {
    t: 'query';
    reqId: number;
    kind: 'screen';
    maxSide?: number;
} | {
    t: 'query';
    reqId: number;
    kind: 'stats';
} | {
    t: 'query';
    reqId: number;
    kind: 'updateStatus';
} | {
    t: 'query';
    reqId: number;
    kind: 'diskCache';
    rescan?: boolean;
} | {
    t: 'query';
    reqId: number;
    kind: 'cleanDiskCache';
    budgetBytes: number;
    execute?: boolean;
} | {
    t: 'query';
    reqId: number;
    kind: 'retainDiskCacheVersion';
    revision: string;
    retain?: boolean;
} | {
    t: 'query';
    reqId: number;
    kind: 'snapshot';
    selectedId: number | null;
    withTree: boolean;
} | ({
    t: 'query';
    reqId: number;
    kind: 'control';
} & DebugControl);
/**
 * What a device sends. A replay's pixels follow their `reply` as binary frames,
 * `pixels` of them: text would add a third to every byte, and a mini-game host's
 * socket drops a frame the size of a whole screen. Lines go in batches, since a
 * host that traces its own every call prints thousands a second.
 */
type DebugChannelMessage = {
    t: 'hello';
    v: number;
    platform: string;
    title: string;
    project: string | null;
    revision: string | null;
    /** The graphics API the game draws through; null until the game has started. */
    graphics: string | null;
} | {
    t: 'reply';
    reqId: number;
    data: unknown;
    pixels?: number;
} | {
    t: 'reply';
    reqId: number;
    error: string;
} | {
    t: 'logs';
    entries: Array<{
        level: ConsoleLevel;
        line: string;
    }>;
};

/**
 * @file    worldConfig.ts
 * @brief   The project's say in how its 3D physics world is made (Project Settings → Physics → 3D).
 *
 * Types and one pure function only: the scene loader reads this without pulling the 3D physics code in.
 */

interface Physics3DWorldConfig {
    /**
     * Scene units in one metre. 100 (the default): a unit is a centimetre. 1: a unit is a metre, as glTF and most imported
     * 3D scenes are. The solver works in metres, so this is what makes a 1.8-unit character in a metre scene 1.8 m tall
     * rather than 1.8 cm, and keeps its gravity at 9.81 m/s² rather than 9.81 units/s².
     */
    unitsPerMeter: number;
    /** Metres per second squared, whatever the scene unit is. */
    gravity: Vec3$2;
    /** Collision passes per fixed step: more keeps fast bodies from tunnelling, at their cost. */
    collisionSteps: number;
    /** Bodies the world is sized for; the solver refuses one past it. */
    maxBodies: number;
    /** 0 = the backend's own (Jolt 10 / PhysX 1). */
    velocityIterations: number;
    /** 0 = the backend's own (Jolt 2 / PhysX 6). */
    positionIterations: number;
    enableSleep: boolean;
    /** m/s; slower impacts do not bounce. 0 = the backend's own (Jolt 1 / PhysX 2). */
    bounceThreshold: number;
}
declare const DEFAULT_PHYSICS3D_WORLD: Physics3DWorldConfig;
/** The plugin config a project's 3D world settings ask for; only what is valid and set. */
declare function physics3DPluginConfigOf(world: Partial<Physics3DWorldConfig> | undefined): Partial<Physics3DConfig>;
/**
 * Everything the 3D world is made with: the project's 3D world settings, plus the two a game has only one of —
 * the fixed step and the collision matrix — taken from the project's physics settings, as 2D takes them.
 */
declare function physics3DInstallConfig(world: Partial<Physics3DWorldConfig> | undefined, shared: {
    fixedTimestep?: number;
    collisionLayerMasks?: number[];
} | undefined): Partial<Physics3DConfig>;

/**
 * @file    runtimeLoader.ts
 * @brief   Runtime scene loader for builder targets (WeChat, Playable, etc.)
 */

interface LoadRuntimeSceneOptions {
    /** Authored ids this scene may reference in ANOTHER document — the persistent
     *  rows a streamed cell names. See {@link SceneLoadOptions.externalEntities}. */
    externalEntities?: ReadonlyMap<number, Entity>;
    /** Where this load spent its time. See {@link SceneLoadOptions.onPhase}. */
    onPhase?: (phase: string, ms: number) => void;
    app: App;
    /** The wasm module, or null on a native host — the engine core is arm64 there,
     *  so there is no Module to reach through. */
    module: ESEngineModule | null;
    sceneData: SceneData;
    source: RuntimeAssetSource;
    spineModule?: SpineWasmModule | null;
    spineManager?: SpineManager | null;
    physicsModule?: PhysicsWasmModule | null;
    /** Project-declared physics world config (gravity, solver tuning, collision-layer
     *  masks, sleep/continuous toggles) — threaded from the editor's Project Settings. */
    physicsConfig?: Physics2DPluginConfig;
    /** The 3D physics backend; selects the side module the 3D world is acquired from. Absent ⇒ Jolt. */
    physics3dBackend?: Physics3DBackend;
    /** The project's 3D world: scene units per metre and gravity (Project Settings → Physics → 3D). Absent ⇒ centimetre units, Earth gravity. */
    physics3dWorld?: Partial<Physics3DWorldConfig>;
    /** Project-declared physics enable (`.uproject` features analog) — installs
     *  physics even for runtime-spawned bodies the static scene doesn't show.
     *  OR-combined with a content scan. */
    physicsEnabled?: boolean;
    /** An already-resolved 3D physics module, for tests and headless hosts. */
    physics3dModule?: Physics3DWasmModule;
    /** Project-declared UI theme (Project Settings → UI). Dark is the default;
     *  'light' switches the token set AND re-resolves already-instantiated
     *  ThemeStyle-tagged widgets (prefab instances carry dark baked values). */
    uiTheme?: 'dark' | 'light';
    /** Project-declared partial re-skin over the base theme (Project Settings →
     *  UI theme colors); merged via {@link resolveThemeTokens}. */
    uiThemeOverrides?: ThemeOverrides;
    sceneName?: string;
}
/** True if any entity carries a 3D physics component. */
declare function sceneUses3DPhysics(sceneData: SceneData): boolean;
/** True if any Text or TextInput hint binds to a localization key — the scene needs
 *  the Localization resource + the project's `.eslocale` tables to render as
 *  authored (an unbound key would show as the raw key string). */
declare function sceneUsesI18n(sceneData: SceneData): boolean;
/** True if any entity carries a physics component, or a TilemapLayer that may spawn
 *  colliders at runtime — either baked collidable tile ids (legacy scenes) or a
 *  `.estileset` reference, whose collision shapes derive live at load and are
 *  invisible to a component scan. A visual-only tileset costs one unused physics
 *  module load; missing real tile colliders would break the scene. */
declare function sceneUsesPhysics(sceneData: SceneData): boolean;
/**
 * Prepare a scene and publish it. What every caller outside residency wants, and
 * the shape the two halves are defined against.
 */
declare function loadRuntimeScene(options: LoadRuntimeSceneOptions): Promise<void>;
declare function createRuntimeSceneConfig(name: string, sceneData: SceneData | undefined, options: Omit<LoadRuntimeSceneOptions, 'sceneData' | 'sceneName'>, scenePath?: string): SceneConfig;
interface RuntimeInitConfig {
    app: App;
    /** The wasm module, or null on a native host (see LoadRuntimeSceneOptions). */
    module: ESEngineModule | null;
    source: RuntimeAssetSource;
    /**
     * Addressable manifest for the app's Assets, enabling `Assets.loadGroup`
     * (on-demand groups / subpackages) from game code. Set here — on the
     * per-App runtime instance — rather than on whatever Assets resource
     * existed before initRuntime, which the runtime instance replaces.
     */
    manifest?: AddressableManifest | ManifestModel | null;
    /** CDN root that `remote`-group assets resolve against ({@link Assets.setRemoteRoot}) —
     *  enables hot-update delivery from a remote origin. */
    remoteRoot?: string;
    /** Storage key an applied hot-update persists the manifest under. When set,
     *  initRuntime restores any manifest a prior run persisted there — a returning
     *  player boots on the updated content ({@link Assets.restorePersistedUpdate}). */
    persistUpdateKey?: string;
    /**
     * Logical-path → build-path catalog for cooked builds (content-addressed
     * staging renames physical files): loaders route their inner text refs (a
     * material's shader path) through Catalog.getBuildPath, which is identity
     * without one. Applied when the per-App runtime Assets is first created.
     */
    catalog?: Catalog;
    /** Every scene the game can switch to. `data` loads eagerly at register
     *  time; `path` registers a lazy scene fetched through the runtime Assets
     *  on first {@link SceneManagerState.switchTo}/load. One of the two. */
    scenes: Array<{
        name: string;
        data?: SceneData;
        path?: string;
    }>;
    /**
     * Cooked worlds the build carries. The one belonging to `firstScene` is
     * adopted by the streamer after that scene is up — its cells are content
     * residency brings in, so they are deliberately not in `scenes`.
     */
    worlds?: WorldManifest[];
    /**
     * Cell name → its document, for a host that already holds them: an editor
     * Play session cuts the unsaved scene in memory and has nowhere to fetch a
     * cell FROM. A package leaves this out and every cell arrives by its path;
     * the manifest is the same either way, cell paths included.
     */
    cellDocuments?: ReadonlyMap<string, SceneData>;
    firstScene: string;
    spineModule?: SpineWasmModule | null;
    spineManager?: SpineManager | null;
    physicsModule?: PhysicsWasmModule | null;
    /** Project-declared physics world config (gravity, solver tuning, collision-layer
     *  masks, sleep/continuous toggles) — threaded from the editor's Project Settings. */
    physicsConfig?: Physics2DPluginConfig;
    /** The 3D physics backend; selects the side module the 3D world is acquired from. Absent ⇒ Jolt. */
    physics3dBackend?: Physics3DBackend;
    /** The project's 3D world: scene units per metre and gravity (Project Settings → Physics → 3D). Absent ⇒ centimetre units, Earth gravity. */
    physics3dWorld?: Partial<Physics3DWorldConfig>;
    /** Project-declared physics enable; see {@link LoadRuntimeSceneOptions.physicsEnabled}. */
    physicsEnabled?: boolean;
    /** Project-declared mixer state (bus volumes / custom buses / effects / duck
     *  rules) — threaded from the editor's audio config, applied once at boot. */
    audioConfig?: AudioProjectConfig;
    /** The project's runtime tuning (scene transition, frame limits, asset timeouts, cache budgets). Applied before anything loads, so the
     *  first asset already runs under it. */
    runtime?: RuntimeBuildConfig;
    /** Project-declared UI theme; see {@link LoadRuntimeSceneOptions.uiTheme}. */
    uiTheme?: 'dark' | 'light';
    /** Project-declared theme token overrides; see {@link LoadRuntimeSceneOptions.uiThemeOverrides}. */
    uiThemeOverrides?: ThemeOverrides;
    /** The design resolution and camera fit. A desktop window opens at the design
     *  size; the fit itself is applied by createWebApp/createNativeApp. */
    screenFit?: {
        designWidth: number;
        designHeight: number;
        scaleMode: number;
        matchWidthOrHeight: number;
    };
    /** The achievement ids the project declares — the set an unlock is checked
     *  against, since a store would take an unknown one and do nothing. */
    achievements?: string[];
    /** The Steam application id; present ⇒ try to bring a Steam client up and let
     *  it answer for achievements. Absent or unavailable keeps the local one. */
    steamAppId?: number;
    aspectRatio?: number;
    /**
     * The compiled twins a build produced (docs/REARCH_AOT.md): bytes, because
     * fetching them is the transport's job — http here, `wx` there. Installed
     * before the first scene registers, the only moment where no component
     * exists yet to be left behind in the wrong memory.
     */
    aot?: {
        module: string | BufferSource;
        manifest: AotManifest;
    };
    debugChannel?: DebugChannelConfig;
}
declare function initRuntime(config: RuntimeInitConfig): Promise<void>;

/**
 * @file    packagedRuntime.ts
 * @brief   The asset assembly every PACKAGED realm shares — a WeChat mini-game,
 *          a native app: realms that ship cooked content beside the runtime and
 *          read it off the device rather than over HTTP.
 * @details The addressable manifest is the single source: it resolves a ref to a
 *          staged path, and its atlas metadata builds the catalog the loaders
 *          consult for their inner text refs (a material's shader). Everything
 *          here is DOM-free and transport-free — the platform layer decides how
 *          the bytes arrive, so the same code serves both realms.
 */

/**
 * `game.config.json` — what an export bakes about the project, and the contract
 * between the export pipeline that writes it and every runtime that reads it.
 * One declaration so the two sides cannot drift.
 */
interface PackagedGameConfig {
    /** External Web distribution SDK selected by this export. */
    webChannel?: 'poki' | 'crazygames' | 'youtube';
    /** Public client encryption key for invited CrazyGames leaderboards; never a server API key. */
    leaderboardEncryptionKey?: string;
    /** Project-relative path of the scene the game boots into. */
    entryScene: string;
    /** Every switchable scene (SceneManager name + cooked path); includes the entry. */
    scenes?: Array<{
        name: string;
        path: string;
    }>;
    /**
     * Scenes the cook cut into cells, each with the manifest describing them.
     * Deliberately not in `scenes`: a cell is content residency brings in, not a
     * place a game switches to.
     */
    worlds?: Array<{
        scene: string;
        manifest: string;
    }>;
    /**
     * The project's own bundled code, as a payload-relative file name. Absent
     * means this build has none — which is how a host tells "no project script"
     * from "the project script failed to load". Guessing between those with a
     * catch runs the empty world and calls it a success.
     */
    scripts?: string;
    /** Bitmask of render layers (0..31) that y-sort within the layer. */
    ySortLayers?: number;
    /** Bitmask of render layers (0..31) that resolve by real depth (2.5D). */
    depthLayers?: number;
    /** Project color space — 'linear' boots the linear-light pipeline. */
    colorSpace?: 'gamma' | 'linear';
    /** The curve the frame applies on the way to the display; absent = none. */
    outputTransform?: 'none' | 'aces' | 'neutral';
    /** Scene-target multisampling the project asked for; absent ⇒ 4. Clamped by
     *  the device, which answers capability and never policy. */
    msaaSamples?: number;
    quality?: QualityConfig;
    /** GPU backend the build asks for; absent ⇒ WebGL2. A request for
     *  'webgpu' falls back where the machine cannot serve one. */
    renderBackend?: 'webgl2' | 'webgpu';
    /** Project camera fit (design resolution + scale mode) — letterboxes the main
     *  camera without a UI Canvas; absent = no fit. */
    screenFit?: {
        designWidth: number;
        designHeight: number;
        scaleMode: number;
        matchWidthOrHeight: number;
    };
    /** Project widget theme; absent = dark. */
    uiTheme?: 'light';
    /** Project theme color overrides (role → #rrggbbaa hex). */
    uiThemeColors?: Record<string, string>;
    /** The achievement ids this game declares. The runtime refuses an unlock
     *  outside the set, because a store accepts an unknown id and does nothing. */
    achievements?: string[];
    /** The Steam application id, when this build ships to Steam. Its presence is
     *  what makes the runtime try to bring a Steam client up at all. */
    steamAppId?: number;
    /**
     * The engine binary's size as it arrives in the page, decompressed. A host
     * that compresses states a Content-Length for fewer bytes than a download
     * counts, so the boot bar measures against this instead.
     */
    engineBytes?: number;
    /** The package carries the engine built as plain JavaScript (wasm/esengine.asm.js),
     *  which the page loads where there is no WebAssembly. */
    engineJs?: boolean;
    /**
     * Install physics even when the shipped scene shows no bodies — a project
     * that spawns them from script (Project Settings → Physics → Enabled).
     * Absent ⇒ physics installs only when a scene actually uses it.
     */
    physicsEnabled?: boolean;
    /** The physics world the project declared: gravity, solver, collision matrix.
     *  Absent ⇒ the engine's own defaults. */
    physicsConfig?: Physics2DPluginConfig;
    /** The 3D physics backend the project chose; absent ⇒ Jolt. */
    physics3dBackend?: Physics3DBackend;
    /** The project's 3D world: scene units per metre and gravity (Project Settings → Physics → 3D). Absent ⇒ centimetre units, Earth gravity. */
    physics3dWorld?: Partial<Physics3DWorldConfig>;
    /** Project mixer state: bus volumes, custom buses, effects, duck rules.
     *  Absent ⇒ the default mix. */
    audioConfig?: AudioProjectConfig;
    /** The runtime tuning the project declared (scene transition, frame limits, asset timeouts, cache budgets).
     *  Absent ⇒ the engine's own values; only fields that differ from them are written. */
    runtime?: RuntimeBuildConfig;
    /** Hot-update delivery: the CDN root `remote`-group assets resolve against +
     *  the storage key an applied update persists under (both optional). */
    hotUpdate?: {
        remoteRoot?: string;
        persistUpdateKey?: string;
    };
    /**
     * Optional native modules this project supplied itself, staged beside the
     * engine's own (see `.esengine/modules/<id>/`).
     *
     * The declaration ships rather than being discovered, because discovery is not
     * possible where it matters: a mini-game cannot list a directory and a
     * playable has no directory at all. The export knows what it staged, so it
     * says so, and every transport resolves these ids exactly like a built-in.
     */
    sideModules?: Array<{
        id: string;
        file: string;
        globalName?: string;
    }>;
    /**
     * The compiled twins this build produced (docs/REARCH_AOT.md). `wasm` is
     * package-relative; the manifest rides here so there is not a second file to
     * keep in step. Absent unless the project marked something `@compiled`, so a
     * runtime reads presence and needs no mode flag.
     */
    aot?: {
        module: string;
        manifest: AotManifest;
    };
    /** Where the editor that made this development build listens for it. Never
     *  written by a shipping export. */
    debugChannel?: DebugChannelConfig;
}
/** The packaged realm's resolved asset index — manifest, catalog, resolution. */
interface PackagedAssetIndex {
    manifest: AddressableManifest;
    model: ManifestModel;
    /** Logical → staged mapping for the loaders' inner refs; absent when the
     *  build stages assets under their logical paths (nothing to remap). */
    catalog?: Catalog;
    /** Resolve any ref spelling (`@uuid:`, logical, "/"-rooted) to a staged path. */
    resolvePath(ref: string): string;
    /** The asset's LOGICAL source path for any ref spelling (including its own staged
     *  path), or null when unknown — recovers the authored directory a
     *  content-addressed rename hid. */
    addressOf(ref: string): string | null;
    /** Every staged asset path — content-driven discovery (locale tables). */
    assetPaths(): string[];
    /** How a texture is sampled and 9-sliced, for any ref spelling. */
    textureImport(ref: string): ParsedTextureImportSettings | undefined;
    /** The culling contract shipped for a spine PAIR, for any ref spelling. */
    spineCulling(skeleton: string, atlas: string): SpineCullingRect | undefined;
}
/**
 * Build the catalog from an addressable manifest. Content-addressed packs rename
 * physical files, so assets carrying an `address` (their logical source path) get
 * a catalog buildPath. Atlas-packed frames additionally register frame/uv, keyed
 * by every ref spelling a scene can use.
 */
/**
 * Register the project modules this build staged, so `sideModules.acquire(id)`
 * resolves them the way it resolves the engine's own.
 *
 * Every realm calls this after reading its config and before anything acquires —
 * one line each rather than one clever shared boot, because the four realms do
 * not share a boot: the web fetches its config, native reads it off disk, a
 * mini-game requires it, and a playable has it inlined.
 */
declare function registerPackagedSideModules(config: Pick<PackagedGameConfig, 'sideModules'>): void;
/**
 * The app options a packaged config declares — everything an App must be built
 * WITH (shaders compile against the colour space; the layer masks are renderer
 * state set before the first frame).
 *
 * Every host projected these by hand and each list was a chance to miss one: the
 * web host was still building its App without the 2.5D depth mask after the
 * export had started shipping it, so a shipped game could carry the setting and
 * ignore it. One projection, so a field added to the config reaches every realm
 * that spreads it.
 */
/**
 * The attributes every host creates the engine's WebGL2 context with. WebGL
 * gives no stencil buffer unless asked, and sprite masks draw through one.
 * `preserveDrawingBuffer` is for a harness that reads a composited frame back.
 */
declare function glContextAttributes(preserveDrawingBuffer?: boolean): WebGLContextAttributes;
declare function packagedAppOptions(config: Pick<PackagedGameConfig, 'ySortLayers' | 'depthLayers' | 'colorSpace' | 'outputTransform' | 'screenFit' | 'msaaSamples' | 'quality'>): {
    ySortLayers?: number;
    depthLayers?: number;
    colorSpace?: 'gamma' | 'linear';
    outputTransform?: 'none' | 'aces' | 'neutral';
    msaaSamples?: number;
    quality?: QualityConfig;
    /** GPU backend the build asks for; absent ⇒ WebGL2. A request for
     *  'webgpu' falls back where the machine cannot serve one. */
    renderBackend?: 'webgl2' | 'webgpu';
    screenFit?: PackagedGameConfig['screenFit'];
};
/**
 * The {@link initRuntime} arguments a packaged config declares — everything
 * applied to a LIVE app rather than baked into its construction. The twin of
 * {@link packagedAppOptions}; between them a host names the config once.
 */
declare function packagedRuntimeInit(config: Pick<PackagedGameConfig, 'physicsEnabled' | 'physicsConfig' | 'physics3dBackend' | 'physics3dWorld' | 'audioConfig' | 'uiTheme' | 'uiThemeColors' | 'achievements' | 'steamAppId' | 'screenFit' | 'aot' | 'debugChannel' | 'runtime'>): {
    physicsEnabled?: boolean;
    physicsConfig?: Physics2DPluginConfig;
    physics3dBackend?: Physics3DBackend;
    /** The project's 3D world: scene units per metre and gravity (Project Settings → Physics → 3D). Absent ⇒ centimetre units, Earth gravity. */
    physics3dWorld?: Partial<Physics3DWorldConfig>;
    audioConfig?: AudioProjectConfig;
    runtime?: RuntimeBuildConfig;
    uiTheme?: 'light';
    uiThemeOverrides?: ThemeOverrides;
    achievements?: string[];
    steamAppId?: number;
    screenFit?: PackagedGameConfig['screenFit'];
    aot?: PackagedGameConfig['aot'];
    debugChannel?: DebugChannelConfig;
};
declare function catalogFromManifest(manifest: AddressableManifest): Catalog | undefined;
/** Read + index the packaged addressable manifest through the platform's reader. */
declare function loadPackagedAssetIndex(manifestPath?: string): Promise<PackagedAssetIndex>;
/** {@link loadPackagedAssetIndex} over an already-parsed manifest. */
declare function indexPackagedManifest(manifest: AddressableManifest): PackagedAssetIndex;
/** Transport overrides for realms that do not read bytes off a device. */
interface PackagedAssetSourceOptions {
    /** Where bytes come from; the platform's packaged-file reader by default. */
    backend?: Backend;
    /** Image → RGBA; the platform's decode by default. A cooked web build passes
     *  a fetch+blob decoder instead: drawing a cross-origin image into a canvas
     *  taints it, and getImageData then throws. */
    decodePixels?: RuntimeAssetSource['decodePixels'];
}
/**
 * The asset source a packaged realm runs on: manifest-driven ref resolution over
 * whatever transport the realm has. One construction for every realm that ships
 * cooked content — a mini-game, a native app, a cooked web build — so a fix to
 * how refs or asset listings resolve reaches all three.
 */
declare function createPackagedAssetSource(index: PackagedAssetIndex, options?: PackagedAssetSourceOptions): RuntimeAssetSource;
/**
 * Route audio and video refs through the same resolver as every other asset.
 * `playSFX` / a video source take plain paths rather than `@uuid:` refs, so
 * without this they would miss the logical→staged mapping a cooked build needs —
 * one resolution channel, not a parallel base-URL scheme per media type.
 */
declare function applyAssetRefResolvers(app: App, resolveRef: (ref: string) => string): void;

/**
 * @file    worldSnapshot.ts
 * @brief   A running world as an inspector shows it: the shallow tree, and one
 *          entity with its values — from the editor's Play realm and from a
 *          device alike.
 */

interface SnapshotComponent {
    type: string;
    data: Record<string, unknown>;
}
interface SnapshotEntity {
    id: number;
    name: string;
    parent: number | null;
    children: number[];
    /** Types only in the tree; values only for the entity asked for. */
    components: SnapshotComponent[];
    /** Whether it has something to hide, and whether it is hidden. */
    hideable?: boolean;
    hidden?: boolean;
    /** The id of the document entity it was loaded from, for the entry scene's. */
    src?: number;
}
interface WorldSnapshot {
    tree: {
        version: '1.0';
        name: 'live';
        entities: SnapshotEntity[];
    } | null;
    selected: SnapshotEntity | null;
}
interface WorldSnapshotOptions {
    /** The scene whose entities carry their document id (`src`). */
    entryScene?: string;
    /** Turns an asset's load path into the one its reader knows it by. */
    assetPath?: (path: string) => string | null;
}
/** Authoring inspection omits transient state; runtime diagnostics may request
 * it explicitly. The tree's own structural fields remain separate. */
declare function inspectableTypes(world: World, entity: number, includeTransient?: boolean): string[];
/**
 * Rewrite handle-valued asset fields to the load paths behind them. A World stores
 * handles; an inspector speaks refs, and a handle shown raw reads as an empty slot.
 * Handles nobody can name pass through untouched.
 */
declare function translateAssetHandles(components: readonly SnapshotComponent[], pathForHandle: (kind: string, handle: number) => string | null): SnapshotComponent[];
/**
 * @p app's world: the tree when @p withTree (O(entities), so a caller polling one
 * entity's values skips it), and @p selectedId's values when given.
 */
declare function worldSnapshot(app: App, selectedId: number | null, withTree: boolean, opts?: WorldSnapshotOptions): WorldSnapshot;

/**
 * @file  debugChannelHook.ts — where the runtime starts a development build's
 *        channel, without carrying it: a shipping package never opens one, so
 *        the channel arrives only with `esengine/debug-channel`.
 */

/** Open this build's line to the editor, from a host as soon as it has read its
 *  config: what it prints while the engine boots is then heard too. */
declare function startDebugChannel(config: DebugChannelConfig): void;

/**
 * @file    TweenTypes.ts
 * @brief   Shared tween enums/types — WASM boundary contract
 *
 * TweenState and LoopMode are generated from src/esengine/animation/TweenData.hpp.
 */

interface TweenOptions {
    easing?: EasingType;
    delay?: number;
    loop?: LoopMode;
    loopCount?: number;
}

/**
 * @file    ValueTween.ts
 * @brief   JS-side value tweening (fallback for fields not covered by C++ TweenTarget)
 *
 * Each App owns its own `ValueTweenManager` instance (held inside
 * `TweenAPI`). Handles carry a reference back to their manager so
 * `handle.state` / `handle.cancel()` etc. route to the right app.
 */

declare class ValueTweenManager {
    private entries_;
    private nextId_;
    private updating_;
    private cppSequences_;
    private readonly module_;
    private readonly registry_;
    constructor(module: AnimCore, registry: CppRegistry);
    create(from: number, to: number, duration: number, callback: (value: number) => void, options?: TweenOptions): number;
    update(dt: number): void;
    private updateEntries_;
    pause(id: number): void;
    resume(id: number): void;
    cancel(id: number): void;
    getState(id: number): TweenState;
    setBezier(id: number, p1x: number, p1y: number, p2x: number, p2y: number): void;
    setSequenceNext(id: number, nextId: number): void;
    setSequenceNextExternal(id: number, external: {
        pause(): void;
        resume(): void;
    }): void;
    registerCppSequence(cppEntity: Entity, jsTweenId: number): void;
}
declare class ValueTweenHandle {
    private readonly manager_;
    readonly id: number;
    constructor(manager: ValueTweenManager, id: number);
    /** @internal used by TweenAPI.then() to chain the C++ tween side */
    get manager(): ValueTweenManager;
    get state(): TweenState;
    bezier(p1x: number, p1y: number, p2x: number, p2y: number): this;
    then(next: ValueTweenHandle): this;
    then(next: {
        pause(): void;
        resume(): void;
    }): this;
    pause(): void;
    resume(): void;
    cancel(): void;
}

/**
 * @file    TweenGroup.ts
 * @brief   Parallel and sequential tween composition utilities.
 *
 * `TweenGroup` / `TweenSequence` are pure logic — they wrap any set of
 * `Completable` items and expose parent-level state/pause/resume/cancel.
 * `TweenCompositionManager` owns auto-polling: call `add(group)` once and
 * `update()` each frame; it removes groups as they finish.
 *
 * There is no module-level composition singleton anymore — the manager is
 * owned by each `TweenAPI` instance so multiple apps don't share state.
 */

interface Completable {
    get state(): TweenState;
    pause(): void;
    resume(): void;
    cancel(): void;
}
declare class TweenGroup implements Completable {
    private readonly tweens_;
    private onComplete_;
    private completed_;
    constructor(tweens: Completable[]);
    get state(): TweenState;
    pause(): void;
    resume(): void;
    cancel(): void;
    onComplete(callback: () => void): this;
    /** @internal - called by TweenSequence/checker to poll completion */
    checkComplete(): boolean;
}
type TweenFactory = () => Completable;
declare class TweenSequence implements Completable {
    private readonly factories_;
    private currentIndex_;
    private currentTween_;
    private completed_;
    private cancelled_;
    private paused_;
    private onComplete_;
    constructor(factories: TweenFactory[]);
    get state(): TweenState;
    pause(): void;
    resume(): void;
    cancel(): void;
    onComplete(callback: () => void): this;
    /** @internal */
    checkComplete(): boolean;
}

/**
 * Whichever engine core drives the tweens: the wasm module on the web, the native
 * host's bindings on a device (see ecs/engineApi.ts). Every call is optional-chained
 * — a core built without the tween system leaves a tween inert rather than throwing,
 * the same way particles and trails already treat an absent entry point.
 */
type AnimCore = NonNullable<EngineApi>;
declare class TweenHandle {
    private readonly module_;
    private readonly registry_;
    private readonly valueManager_;
    readonly entity: Entity;
    constructor(module: AnimCore, registry: CppRegistry, valueManager: ValueTweenManager, entity: Entity);
    get state(): TweenState;
    bezier(p1x: number, p1y: number, p2x: number, p2y: number): this;
    then(next: TweenHandle | ValueTweenHandle): this;
    pause(): void;
    resume(): void;
    cancel(): void;
}
declare class TweenAPI {
    private readonly module_;
    private readonly registry_;
    private readonly valueManager_;
    private readonly compositionManager_;
    private updating_;
    constructor(module: AnimCore, registry: CppRegistry);
    to(entity: Entity, target: TweenTarget, from: number, to: number, duration: number, options?: TweenOptions): TweenHandle;
    value(from: number, to: number, duration: number, callback: (value: number) => void, options?: TweenOptions): ValueTweenHandle;
    cancel(tweenHandle: TweenHandle): void;
    cancelAll(entity: Entity): void;
    update(deltaTime: number): void;
    parallel(tweens: Completable[]): TweenGroup;
    sequence(factories: TweenFactory[]): TweenSequence;
    delay(seconds: number): ValueTweenHandle;
    /** @internal test hook — how many groups/sequences are still being polled */
    get activeCompositionCount(): number;
    /** @internal shutdown hook for plugin cleanup */
    clear(): void;
}
/** Resource handle for the per-app Tween API. */
declare const Tween: ResourceDef<TweenAPI>;

/**
 * @file    animatorGraph.ts
 * @brief   Immutable graph operations on an AnimatorControllerDef — the
 *          animation controller editor's model.
 *
 * The structural graph algorithms live in the shared `stateGraph` core; this
 * module binds them to the `.esanimator` shape (`initialState`, required
 * transition lists, `{to, conditions}` transitions) and adds the animator-only
 * ops (motion/props on a state, condition editing, parameters, and the
 * any-state transition rewiring on rename). An `.esanimator` payload IS the
 * runtime AnimatorControllerDef, so there is no separate editor model.
 */

/** A flattened transition edge, for the graph canvas. */
type AnimatorEdge = GraphEdge<AnimatorTransition>;
/** Flatten every state's outgoing transitions into addressable edges. */
declare function animatorEdges(def: AnimatorControllerDef, layer?: number): AnimatorEdge[];
/** A blank controller with one initial state and no parameters. */
declare function emptyAnimatorController(): AnimatorControllerDef;
declare function addState(def: AnimatorControllerDef, name: string, x?: number, y?: number, layer?: number): AnimatorControllerDef;
declare function removeState(def: AnimatorControllerDef, name: string, layer?: number): AnimatorControllerDef;
declare function moveState(def: AnimatorControllerDef, name: string, x: number, y: number, layer?: number): AnimatorControllerDef;
/**
 * Rename a state. On top of the shared rewiring (initial + per-state transition
 * targets) an animator also has any-state transitions to repoint.
 */
declare function renameState(def: AnimatorControllerDef, oldName: string, newName: string, layer?: number): AnimatorControllerDef;
declare function setInitial(def: AnimatorControllerDef, name: string, layer?: number): AnimatorControllerDef;
/** Set the state's motion to a single sprite clip (clears any other motion). */
declare function setStateClip(def: AnimatorControllerDef, name: string, clip: string, layer?: number): AnimatorControllerDef;
/**
 * Point the state at a motion of any registered kind — a timeline, a blend over
 * either. Null clears it, leaving a state that plays nothing.
 */
declare function setStateMotion(def: AnimatorControllerDef, name: string, motion: AnimatorMotion | null, layer?: number): AnimatorControllerDef;
declare function setStateProps(def: AnimatorControllerDef, name: string, patch: {
    speed?: number;
    loop?: boolean;
    rootMotion?: boolean;
    speedParameter?: string;
}, layer?: number): AnimatorControllerDef;
declare function addTransition(def: AnimatorControllerDef, from: string, to: string, layer?: number): AnimatorControllerDef;
declare function removeTransition(def: AnimatorControllerDef, from: string, index: number, layer?: number): AnimatorControllerDef;
declare function updateTransition(def: AnimatorControllerDef, from: string, index: number, patch: Partial<AnimatorTransition>, layer?: number): AnimatorControllerDef;
/** Replace the whole condition list on a transition. */
declare function setConditions(def: AnimatorControllerDef, from: string, index: number, conditions: AnimatorCondition[], layer?: number): AnimatorControllerDef;
declare function addParam(def: AnimatorControllerDef, name: string, type: AnimatorParamType): AnimatorControllerDef;
declare function removeParam(def: AnimatorControllerDef, name: string): AnimatorControllerDef;
declare function updateParam(def: AnimatorControllerDef, name: string, patch: Partial<AnimatorParam>): AnimatorControllerDef;
/**
 * A new layer over the ones already there, with one state of its own. Added at
 * the top because that is what "over" means and it is where an author who just
 * asked for a layer expects to find it.
 */
declare function addLayer(def: AnimatorControllerDef, name: string): AnimatorControllerDef;
/** Drop layer `index`. The base layer is not one of these and cannot be removed:
 *  a controller with no base is a controller that poses nothing. */
declare function removeLayer(def: AnimatorControllerDef, index: number): AnimatorControllerDef;
/** Patch what layer `index` is, as opposed to what its machine does. Refuses the
 *  base layer, which has no weight, blend or mask to set. */
declare function updateLayer(def: AnimatorControllerDef, index: number, patch: Pick<Partial<AnimatorLayer>, 'name' | 'weight' | 'blend' | 'mask'>): AnimatorControllerDef;
/**
 * Move layer `index` to `to`, both counted with the base layer at 0. Order is
 * what a stack means, so this is an edit like any other rather than a view
 * setting — and the base layer neither moves nor is displaced.
 */
declare function moveLayer(def: AnimatorControllerDef, index: number, to: number): AnimatorControllerDef;
/** A new constraint, off until an author names what it reaches for: an empty tip
 *  resolves to nothing, so it is inert rather than wrong. */
declare function addIK(def: AnimatorControllerDef, kind: AnimatorIKKind): AnimatorControllerDef;
declare function removeIK(def: AnimatorControllerDef, index: number): AnimatorControllerDef;
/**
 * Patch one constraint. Changing `kind` drops the fields the other kind owns —
 * a pole on a look-at and an axis on a two-bone are fields nothing reads, and
 * leaving them makes a file that answers a question it was not asked.
 */
declare function updateIK(def: AnimatorControllerDef, index: number, patch: Partial<AnimatorIK>): AnimatorControllerDef;

/**
 * @file    AnimationPlugin.ts
 * @brief   Animation plugin registering Tween and SpriteAnimator systems
 *
 * The animator graph and grip poses are SkeletalAnimationPlugin's.
 */

declare class AnimationPlugin implements Plugin {
    name: string;
    private readonly despawnCleanups_;
    private latestDespawnCleanup_;
    build(app: App): void;
    cleanup(app?: App): void;
}
declare const animationPlugin: AnimationPlugin;

/**
 * @file    AnimClipLoader.ts
 * @brief   .esanim asset format: parsing, serialization, sheet-grid math, and
 *          per-frame anchor resolution
 */

declare const ANIM_CLIP_FORMAT_VERSION = "1.5";
/**
 * A frame's anchor, normalized inside the frame's own rect — EXACTLY the space
 * `Sprite.pivot` uses: (0,0) = bottom-left, (0.5,0.5) = center, (1,1) = top-right.
 * The same numbers travel from the file to the component with no conversion, so
 * "feet on the ground" is `{ x: 0.5, y: 0 }` in both places. Values outside 0–1
 * are allowed (they anchor outside the frame), matching `Sprite.pivot`.
 */
interface AnimClipPivotData {
    x: number;
    y: number;
}
/** The anchor a clip that authors pivots falls back to — the `Sprite.pivot` default. */
declare const DEFAULT_ANIM_CLIP_PIVOT: AnimClipPivotData;
/** A pair in the clip's own units — world units, which the engine authors at 1 = 1
 *  design pixel. Frame sizes and offsets are both in it. */
interface AnimClipVec2 {
    x: number;
    y: number;
}
/**
 * Who owns `Sprite.size` while the clip plays. `'entity'` — the default, and what
 * every clip written before format 1.5 does — leaves the entity's size alone, so
 * every frame draws at that one size. `'frame'` hands size to the clip and each
 * frame draws at its own, which is what lets frames of DIFFERENT sizes share a clip.
 */
type AnimClipSizing = 'entity' | 'frame';
/**
 * Sprite-sheet slicing grid. When present, frames may reference grid cells
 * instead of per-frame textures; all cell frames share `texture`.
 * `pageWidth`/`pageHeight` are baked by the editor from the image's natural
 * size (UV normalization needs them; the runtime never reads the image).
 */
/** A clip's sheet: the cutting geometry every sheet has, plus the image it cuts. */
interface AnimClipSheetData extends SheetGrid {
    texture: string;
}
interface AnimClipFrameData {
    /** Per-frame texture ref; absent on sheet-cell frames. */
    texture?: string;
    /** Sheet cell index (row-major, 0-based); requires a `sheet` section. */
    cell?: number;
    duration?: number;
    /**
     * Anchor override for this frame; absent = the clip's `pivot`. Added in format
     * 1.4 — this is what keeps a character's feet planted when the artwork shifts
     * inside the cell from frame to frame.
     */
    pivot?: AnimClipPivotData;
    /**
     * What this frame draws at. Absent = its own natural size (its sheet cell, or
     * its texture's pixels), which is what an author almost always means.
     */
    size?: AnimClipVec2;
    /**
     * Shifts this frame's artwork away from the clip's anchor, in {@link size}'s
     * units, and folded into the frame's pivot at load. Units rather than a
     * normalized pivot because the same offset is the same visual shift on frames
     * of any size — a pivot is not.
     */
    offset?: AnimClipVec2;
    atlasFrame?: {
        x: number;
        y: number;
        width: number;
        height: number;
        pageWidth: number;
        pageHeight: number;
    };
}
/**
 * A frame event: as the playhead crosses `frame`, the runtime fires `name`
 * (with optional `data`) to any listener. Added in format 1.3; the runtime
 * (SpriteAnimator) always supported events, only the format/editor did not.
 */
interface AnimClipEventData {
    frame: number;
    name: string;
    data?: unknown;
}
interface AnimClipAssetData {
    version: string;
    type: 'animation-clip';
    fps?: number;
    loop?: boolean;
    /**
     * Clip-wide anchor every frame inherits (frames override it per frame) — the
     * same fallback relationship `fps` has with per-frame `duration`. Absent means
     * the clip does not author anchors at all and playback leaves `Sprite.pivot`
     * exactly as the entity authored it.
     */
    pivot?: AnimClipPivotData;
    /** Who owns `Sprite.size` — see {@link AnimClipSizing}. Absent = `'entity'`. */
    frameSizing?: AnimClipSizing;
    sheet?: AnimClipSheetData;
    frames: AnimClipFrameData[];
    events?: AnimClipEventData[];
}
/** @see sheetCols */
declare function animClipSheetCols(sheet: AnimClipSheetData): number;
/** @see sheetRows */
declare function animClipSheetRows(sheet: AnimClipSheetData): number;
/** @see sheetCellRect */
declare function animClipCellRect(sheet: AnimClipSheetData, cell: number): {
    x: number;
    y: number;
    width: number;
    height: number;
};
/** @see sheetCellUv */
declare function animClipCellUv(sheet: AnimClipSheetData, cell: number): {
    uvOffset: {
        x: number;
        y: number;
    };
    uvScale: {
        x: number;
        y: number;
    };
};
/**
 * Does this clip author anchors at all? True as soon as the clip OR any single
 * frame declares one. All-or-nothing on purpose: a clip that anchored only some
 * frames would leave the last override standing on the plain ones — the same
 * staleness the UV window has to reset away.
 *
 * An offset counts: it IS an anchor, written in units instead of fractions.
 */
declare function animClipDrivesPivot(data: AnimClipAssetData): boolean;
/**
 * Does this clip own `Sprite.size`? The mode says so outright, an authored frame
 * size says so by existing — and so does an offset, which needs the size it is a
 * fraction of. Left to the entity, one clip on two entities would shift by two
 * different amounts, the very drift offsets exist to remove.
 */
declare function animClipDrivesSize(data: AnimClipAssetData): boolean;
/**
 * The size a frame renders at: its own override, else its natural size (the
 * caller's — a sheet cell, or the texture's pixels) — or `null` when the clip
 * does not own size, which leaves `Sprite.size` as the entity authored it.
 */
declare function animClipFrameSize(data: AnimClipAssetData, frame: AnimClipFrameData, natural?: AnimClipVec2 | null): AnimClipVec2 | null;
/**
 * The anchor a frame actually renders with: its own override, else the clip
 * default, else centered — or `null` when the clip authors no anchors, which is
 * the signal to leave `Sprite.pivot` exactly as the entity set it.
 *
 * The one place this resolution lives: the runtime bake, the edit-mode viewport
 * projection, and the editor's drag handle all read it here.
 */
declare function animClipFramePivot(data: AnimClipAssetData, frame: AnimClipFrameData, size?: AnimClipVec2 | null): AnimClipPivotData | null;
/** Parse arbitrary JSON into a normalized {@link AnimClipAssetData} (tolerant of missing fields). */
declare function parseAnimClipAsset(rawJson: unknown): AnimClipAssetData;
/**
 * Serialize an {@link AnimClipAssetData} to a plain JSON-ready object (drops
 * empty/undefined). Stamps the CURRENT format version: whatever the file said when
 * it was read, this writer produced what is on disk now — a clip that gained 1.4
 * anchors must not keep claiming 1.3.
 */
declare function serializeAnimClip(asset: AnimClipAssetData): Record<string, unknown>;
/** A fresh sheet-sliced clip over a texture (no frames yet). */
declare function createAnimClip(texture: string, cellWidth: number, cellHeight: number, pageWidth: number, pageHeight: number): AnimClipAssetData;
/**
 * A fresh clip over a sequence of per-frame textures — the shape a flipbook of
 * separate images is. Owns size from the start: images drawn at one shared size
 * is the thing an image sequence is authored to avoid.
 */
declare function createAnimClipFromTextures(textures: string[]): AnimClipAssetData;
declare function extractAnimClipTexturePaths(data: AnimClipAssetData): string[];
/**
 * Bake a parsed clip into what the runtime plays. @p textureSizes carries each
 * frame texture's pixel size, which is the natural size of a per-texture frame —
 * without it a clip that owns size has nothing to fall back to and says so.
 */
declare function parseAnimClipData(clipPath: string, data: AnimClipAssetData, textureHandles: Map<string, number>, textureSizes?: Map<string, AnimClipVec2>): SpriteAnimClip;

/**
 * @file    animatorMigrate.ts
 * @brief   Bringing a parsed `.esanimator` to the version this build writes.
 *
 * @details A version is a property of the FILE, not of a controller: one built in
 *          code never passes through here, having no older spelling to be read
 *          from. What the guard buys is the other direction — a file from a later
 *          build is refused rather than read for the parts this one recognises,
 *          because layers it cannot see would animate a visibly wrong character
 *          and nothing would say so.
 */

/** What a pass over a controller blob came to. */
interface AnimatorMigration {
    def: AnimatorControllerDef;
    /** Whether anything was upgraded; a caller may ask the author to re-save. */
    migrated: boolean;
    /** The version the file claimed — 1 for one written before layers existed. */
    fromVersion: number;
}
/**
 * Total and idempotent: already-current data comes back with `migrated: false`.
 * Throws for a shape that cannot be reconciled, and for a version this build does
 * not know.
 */
declare function migrateAnimatorController(raw: unknown): AnimatorMigration;

/**
 * @file    animatorRootMotion.ts
 * @brief   How far the animation asks the character to move — a request, never a
 *          result.
 *
 * @details A clip that animates the entity it is played ON is not posing a
 *          skeleton; it is saying where the character travels. Writing that to
 *          the Transform would put the animator in charge of movement, and an
 *          animator in charge of movement walks through walls: the world's
 *          answer is the character controller's to give.
 *
 *          So the animator states the request here and touches nothing. Gameplay
 *          reads it, hands it to whatever moves the character, and the character
 *          ends up wherever collision allowed — which is what the pattern beside
 *          it already does with the stick.
 *
 *          The deltas come with the SECONDS they cover because the animator runs
 *          on the frame clock and a character controller usually steps on a fixed
 *          one. A consumer forms a rate from the pair; a consumer that just added
 *          the delta would move twice on a frame with two steps and not at all on
 *          a frame with none.
 */

/** The fields of the `AnimatorRootMotion` component. @experimental */
interface AnimatorRootMotionData {
    /** Whether the animator publishes this entity's root motion at all. */
    enabled: boolean;
    /**
     * Engine-written: whether a state that DECLARES root motion is driving this
     * frame. The switch a consumer reads — not "is the delta non-zero", which is
     * also true of the still moment in the middle of a dodge.
     */
    active: boolean;
    /** Engine-written: the displacement asked for, in world space. */
    deltaPosition: Vec3$2;
    /** Engine-written: the turn asked for, in the character's own frame. */
    deltaRotation: Quat;
    /** Engine-written: seconds the deltas cover; 0 when nothing was asked. */
    deltaTime: number;
}
/**
 * Publishes what the active animation asks to move, for gameplay to hand to a
 * character controller. Add it to a character whose animations drive movement;
 * without it, a root-motion state still refuses to pose the character's own
 * Transform — it simply plays on the spot.
 *
 * @experimental
 */
declare const AnimatorRootMotion: ComponentDef<AnimatorRootMotionData>;

/**
 * @file    spriteMotion.ts
 * @brief   The `sprite` motion kind: an animator state driving a sprite clip.
 *
 * @details Playback itself stays SpriteAnimationAPI's — this only points the
 *          entity's SpriteAnimator at a clip and reads back whether it ended, so
 *          there is still exactly one thing advancing sprite frames.
 */

declare const SPRITE_MOTION = "sprite";
declare const spriteMotionDriver: MotionDriver<AnimatorClipMotion>;

/**
 * @file  SpatialAudio.ts — where a sound is, relative to who is hearing it.
 *
 * Three-dimensional throughout. A scene has depth whether or not its art does,
 * and a distance that drops z reports a source across the room as being in the
 * listener's ear.
 */

declare enum AttenuationModel {
    Linear = 0,
    Inverse = 1,
    Exponential = 2
}
interface SpatialAudioConfig {
    model: AttenuationModel;
    refDistance: number;
    maxDistance: number;
    rolloff: number;
}
declare function calculateAttenuation(distance: number, config?: SpatialAudioConfig): number;
/** How far apart two points are, in the three dimensions a scene has. */
declare function spatialDistance(source: Vec3$2, listener: Vec3$2): number;
/**
 * Stereo pan for a source heard by a listener whose own right points along
 * `right`: how far along that right the source sits, over the audible radius.
 * Against the LISTENER'S right, not world +X — a listener that has turned hears
 * the world turn with it, and an unturned one's right IS world +X.
 */
declare function calculatePanning(source: Vec3$2, listener: Vec3$2, right: Vec3$2, maxDistance: number): number;

/** Clip selection policy. Zero-weight slots are disabled in every mode. @beta */
type SoundEventMode = 'random' | 'no-repeat' | 'sequence';
/** An authored audio reference and its relative weight. @beta */
interface SoundEventClip {
    clip: string;
    weight: number;
}
/** Versioned `.esaudioevent` document shared by authoring and playback. @beta */
interface SoundEventAsset {
    version: 1;
    clips: SoundEventClip[];
    mode: SoundEventMode;
    volume: [number, number];
    /** Playback rate changes both pitch and duration; this is not time stretching. */
    playbackRate: [number, number];
    bus: string;
    priority: number;
    /** 0 means unlimited. Pending loads and paused voices still own a slot. */
    maxInstances: number;
    /** Seconds on the consumer's simulation clock. */
    cooldown: number;
    spatial?: SpatialAudioConfig;
}
/** Validates the authored document with slot-specific errors; never drops a broken clip. @beta */
declare function parseSoundEvent(value: unknown): SoundEventAsset;
/** Selected authored slot and sampled playback parameters. @beta */
interface SoundEventSelection {
    clip: string;
    slot: number;
    volume: number;
    playbackRate: number;
}
/** A selection or the reason no candidate can sound. @beta */
type SoundEventSelectionResult = {
    selection: SoundEventSelection;
    reason?: never;
} | {
    selection: null;
    reason: 'empty' | 'zero-weight';
};
/** Immutable compiled choices; selecting allocates no candidate lists or retained history.
 * Selection and parameter random streams are independent so range edits preserve clip order.
 * Duplicate clip identities combine weights in random modes; their first slot is reported.
 * The seed is reduced to 32 bits; only selection and sampled parameters are reproducible.
 * @beta */
declare class SoundEventSelector {
    private readonly asset;
    private readonly groups;
    private readonly sequence;
    private total;
    private cursor;
    private last;
    private choiceState;
    private parameterState;
    constructor(asset: SoundEventAsset, seed?: number);
    next(): SoundEventSelectionResult;
    /** Rescale after excluding a dominant weight so subtraction cannot erase the remaining choices. */
    private sampleWithoutLast;
    private sampleRange;
    private random;
}

/** Lifecycle of one admitted or rejected event trigger. @beta */
type SoundEventStatus = 'loading' | 'playing' | 'paused' | 'ended' | 'stopped' | 'rejected';
/** Event gates run before clip loading; global admission runs through Audio. @beta */
type SoundEventRejection = 'disposed' | 'owner-gone' | 'cooldown' | 'event-limit' | 'empty' | 'zero-weight' | 'missing-position' | 'load-failed' | 'global-limit' | 'backend-refused';
/** A trigger's controls remain valid while its selected clip loads. @beta */
interface SoundEventHandle extends AudioHandle {
    readonly status: SoundEventStatus;
    readonly reason: SoundEventRejection | null;
    readonly error: string | null;
    readonly selection: Readonly<SoundEventSelection> | null;
    /** Initial loading resolves to its resulting status, including early cancellation. */
    readonly ready: Promise<SoundEventStatus>;
}
/** One owned definition and deterministic choice stream. Dispose to release its voices and definition. @beta */
interface SoundEventEmitter {
    readonly ref: string;
    readonly disposed: boolean;
    /** Spatial events need an explicit world position or a live owner transform. */
    trigger(position?: Vec3$2): SoundEventHandle;
    dispose(): void;
}
/** Resource and admission counters, without retaining trigger history. @beta */
interface SoundEventStats {
    definitions: number;
    emitters: number;
    pendingDefinitions: number;
    pendingClips: number;
    active: number;
    admitted: number;
    played: number;
    ended: number;
    stopped: number;
    rejected: number;
    reasons: Partial<Record<SoundEventRejection, number>>;
}
type Resources = Pick<Assets, 'acquireTyped'>;
/** Per-App event ownership layered on Assets leases and Audio's existing voice pool.
 * Emitters of one canonical definition share admission across asset generations.
 * Cooldown starts on admission, including later load/global-pool failures; stopping does not reset it.
 * @beta */
declare class SoundEventPlayback {
    private readonly audio;
    private readonly resources;
    private readonly ownerAlive;
    private readonly ownerPosition;
    private readonly events;
    private readonly emitters;
    private readonly pending;
    private readonly owners;
    private readonly ownerLoads;
    private readonly reasons;
    private readonly offStop;
    private clock;
    private disposed;
    private admitted;
    private played;
    private ended;
    private stopped;
    private rejected;
    private listener;
    private right;
    constructor(audio: AudioAPI, resources: () => Resources | null, ownerAlive?: (owner: Entity) => boolean, ownerPosition?: (owner: Entity) => Vec3$2 | null);
    /** Loading a definition is preparation, not a play intent; Audio.stopAll does not unload emitters.
     * `alive` is a pure lifetime predicate checked after asynchronous loads and on updates/triggers. */
    load(ref: string, options?: {
        owner?: Entity;
        seed?: number;
        alive?: () => boolean;
    }): Promise<SoundEventEmitter | null>;
    /** Advance on simulation time; paused requests retain event and global voice ownership. */
    update(delta: number, listener?: Vec3$2, right?: Vec3$2): void;
    stopOwner(owner: Entity): void;
    /** @internal A registry switch cannot transfer an old entity owner's emitters to reused IDs. */
    resetOwners(): void;
    stopAll(): void;
    getStats(): SoundEventStats;
    dispose(): void;
    private addOwner;
    private removeOwner;
    private live;
    private refresh;
    private end;
    private finish;
    private reject;
    private releaseEmitter;
    private trigger;
    private alive;
    private position;
    private applySpatial;
    private start;
}
/** Per-App sound event loading, emitters and admission controls. @beta */
declare const SoundEvents: ResourceDef<SoundEventPlayback>;

interface PooledAudioNode {
    gain: GainNode;
    panner: StereoPannerNode;
    /** A decoded clip's buffer source, or a streamed clip's media element source. */
    source: AudioBufferSourceNode | MediaElementAudioSourceNode | null;
    inUse: boolean;
    startTime: number;
}
declare class AudioPool {
    private readonly context_;
    private readonly pool_;
    private activeCount_;
    constructor(context: AudioContext, initialSize?: number);
    private createNode;
    acquire(): PooledAudioNode;
    release(node: PooledAudioNode): void;
    get activeCount(): number;
    get capacity(): number;
}

interface AudioPluginConfig {
    initialPoolSize?: number;
    masterVolume?: number;
    musicVolume?: number;
    sfxVolume?: number;
}
declare class AudioPlugin implements Plugin {
    name: string;
    private config_;
    private readonly states_;
    private latestState_;
    constructor(config?: AudioPluginConfig);
    build(app: App): void;
    private stopSources_;
    stopAllSources(): void;
    cleanup(app?: App): void;
}
declare const audioPlugin: AudioPlugin;

interface AudioSourceData {
    clip: string;
    bus: string;
    volume: number;
    pitch: number;
    loop: boolean;
    /** With `loop`: seconds into the clip that it comes back to at its end, so an introduction is heard once. 0 is the start. */
    loopStart: number;
    /** Seconds it takes to come up to its volume when `playing` is raised. 0 is at once. */
    fadeIn: number;
    /** Seconds it takes to go down to nothing when `playing` is lowered, after which it stops. 0 is at once. */
    fadeOut: number;
    /**
     * Raise it and the clip sounds; lower it and the voice stops. The engine
     * lowers it again when a non-looping clip ends, so it reads as "is this
     * sounding" — the flag contract TimelinePlayer and SpriteAnimator keep.
     */
    playing: boolean;
    /**
     * Latched true when a non-looping clip reaches its end; cleared when
     * `playing` is raised again. Runtime-observable — don't author it.
     */
    finished: boolean;
    playOnAwake: boolean;
    spatial: boolean;
    minDistance: number;
    maxDistance: number;
    attenuationModel: number;
    rolloff: number;
    priority: number;
    enabled: boolean;
}
declare const AudioSource: ComponentDef<AudioSourceData>;
interface AudioListenerData {
    enabled: boolean;
}
/** An entity-owned event definition; all voices share the Audio voice budget. @beta */
interface SoundEventSourceData {
    event: string;
    seed: number;
    playOnAwake: boolean;
    enabled: boolean;
}
/** Trigger with triggerSoundEventSource or the soundEvent.trigger graph action. @beta */
declare const SoundEventSource: ComponentDef<SoundEventSourceData>;
declare const AudioListener: ComponentDef<AudioListenerData>;

/** Play one source intent, independently of other triggers in the same frame.
 * While the definition loads, at most 256 intents per source wait in FIFO order.
 * Returns null when unavailable, cancelled, overflowing, or the definition fails;
 * otherwise the handle exposes event/global admission and clip-load results.
 * @beta */
declare function triggerSoundEventSource(world: World, entity: Entity): Promise<SoundEventHandle | null>;
/** Cancel this component's queued intents and voices, preserving other emitters on the entity. @beta */
declare function stopSoundEventSource(world: World, entity: Entity): void;

/**
 * @file    takeover.ts
 * @brief   Something covered the game: pause it, silence it, and put back
 *          exactly what was found.
 *
 * A fullscreen ad and a store overlay are the same event as far as the game is
 * concerned — the player is no longer looking at it and no longer able to act.
 * The ceremony was written inside the ads service, which is where it was needed
 * first; the Steam overlay needs the same one, and a second copy would be a
 * second answer to "what happens when a game is covered".
 *
 * ★ Ref-counted, which a single caller never needed: a player can open the Steam
 * overlay DURING an interstitial ad, and the overlay closing must not resume a
 * game the ad is still covering.
 */
/** What a takeover asks of the app. Injected so this stays pure orchestration —
 *  and so a test can drive it without an App. */
interface TakeoverHost {
    setPaused(paused: boolean): void;
    isPaused(): boolean;
    suspendAudio(): void;
    resumeAudio(): void;
}
interface Takeover {
    /** Something is now covering the game. */
    begin(): void;
    /** …and is not any more. Unbalanced calls are ignored rather than trusted:
     *  a store tells you the overlay closed, and nothing guarantees it told you
     *  it opened. */
    end(): void;
    /** Whether anything is covering the game right now. */
    readonly active: boolean;
    /** The common case: cover the game for the length of one promise. */
    around<T>(show: () => Promise<T>): Promise<T>;
}
declare function createTakeover(host: TakeoverHost): Takeover;

/**
 * A drop-in ad source for hosts that have none: the editor's play mode, unit
 * tests, a web dev build. `create*` mirrors the platform factories so one seam
 * serves both; {@link createMockAdProvider} is the standard implementation.
 */
interface AdProvider {
    createRewardedAd(adUnitId: string): PlatformRewardedAd;
    createInterstitialAd(adUnitId: string): PlatformInterstitialAd;
}
interface MockAdProviderOptions {
    /** How long the pretend ad stays "on screen" (ms). Default 600 — long
     *  enough that a broken pause/resume would be seen, short enough to iterate. */
    durationMs?: number;
    /** What `showRewarded` reports. Default true; set false to exercise the
     *  player-abandoned path. */
    completed?: boolean;
}
/** The mock ad source: resolves after a short pretend playback. The pause /
 *  audio-suspend ceremony still runs for real, so the editor exercises the
 *  exact frames a device would. */
declare function createMockAdProvider(options?: MockAdProviderOptions): AdProvider;
declare class AdsAPI {
    private readonly takeover_;
    private provider_;
    private readonly rewarded_;
    private readonly interstitials_;
    private showing_;
    /** @param takeover The app-wide pause/silence ceremony. Shared rather than
     *  private: a store overlay opening during an ad is one covered game, not two
     *  (see services/takeover.ts). */
    constructor(takeover: Takeover);
    /** Whether SOME ad source exists here — the platform's or an installed
     *  provider. False is what a menu reads to hide its "watch ad" button. */
    get available(): boolean;
    /** True while an ad covers the game (the clock is paused, audio suspended). */
    get showing(): boolean;
    /**
     * Install (or clear with null) an {@link AdProvider} that answers INSTEAD of
     * the platform. The editor's play mode installs the mock; a native shell
     * with a mediation SDK installs a real one. Clearing drops cached units.
     */
    setProvider(provider: AdProvider | null): void;
    /** Warm a rewarded unit so `showRewarded` has a fill ready. Best-effort:
     *  a preload failure only means show() pays the load. */
    preloadRewarded(adUnitId: string): Promise<void>;
    /**
     * Show a rewarded video and resolve with whether the reward was earned —
     * after the ad closed and the game is running again. Rejects when this
     * platform has no ad source (check {@link available} first) or the host
     * genuinely has no fill, or another ad is showing; the game state is restored
     * in every path. Overlapping requests are rejected without queuing an ad.
     */
    showRewarded(adUnitId: string): Promise<PlatformRewardedAdResult>;
    /** Show an interstitial; resolves when it closed. Same contract as
     *  {@link showRewarded}, minus the reward. */
    showInterstitial(adUnitId: string): Promise<void>;
    private static readonly ALREADY_SHOWING;
    private static readonly NO_SOURCE;
    /** An ad covers the game exactly as a store overlay does; `showing` stays an
     *  ADS question, which is why the flag is still here. */
    private withTakeover_;
    private rewardedUnit_;
    private interstitialUnit_;
    private dropCachedUnits_;
}
declare const Ads: ResourceDef<AdsAPI>;

/** What a sign-in yields: the code, and nothing that resembles a session. */
interface LoginResult {
    /**
     * The host's one-time code. Send it to YOUR server, which exchanges it for
     * a session using the app secret. Short-lived and single-use: cache the
     * session your server returns, never this.
     */
    code: string;
}
declare class IdentityAPI {
    /** Whether this platform can sign a player in at all — what a menu reads to
     *  hide its sign-in button rather than offer one that cannot work. */
    get available(): boolean;
    /**
     * Begin a sign-in.
     *
     * Rejects with the host's own words when it fails — this is a network round
     * trip, and "it failed" without a reason is not something a game can act on.
     * Rejects immediately where the platform has no sign-in, so a caller that
     * skipped {@link available} hears about it rather than hanging.
     */
    login(): Promise<LoginResult>;
    /**
     * Whether the host still regards the last sign-in as current.
     *
     * The reason to ask is to SKIP a login: if the session your server holds is
     * still good, exchanging a fresh code buys nothing. False where there is no
     * sign-in at all — there is nothing current about nothing.
     */
    sessionValid(): Promise<boolean>;
}
declare const Identity: ResourceDef<IdentityAPI>;

/**
 * @file    servicesPlugin.ts
 * @brief   Installs the platform-services resources (Ads, Achievements, Identity).
 *
 * What is here is what the ENGINE owes a game on every platform. A service that
 * only some hosts have — a share sheet, a purchase, a friends board — is a
 * package (`estella-plugin-minigame-services`), built on the same platform
 * capabilities this file uses.
 *
 * The ads service is handed the app's clock and the audio device as two narrow
 * hooks, so a fullscreen takeover can pause the game it covers without the
 * service knowing the App.
 */

declare class ServicesPlugin implements Plugin {
    name: string;
    readonly profileDomain = "services";
    build(app: App): void;
}
declare const servicesPlugin: ServicesPlugin;

/** What a script can ask of the app's native code. */
interface NativeChannelApi {
    /** Whether this platform has native code to reach at all. */
    readonly available: boolean;
    /** Whether a call to `method` would be answered. Cheap; ask before offering a feature. */
    has(method: string): boolean;
    /**
     * Call `method` in the app's native code. Resolves with what it answered;
     * rejects when nothing answers to the name, or with the reason the native
     * side gave. `args` is anything JSON carries.
     */
    call<T = unknown>(method: string, args?: unknown): Promise<T>;
    /** Hear every `event` the native side raises from now on. Returns the unsubscribe. */
    on<T = unknown>(event: string, handler: (data: T) => void): () => void;
}
/** The app's native code, by name: see the file's own note for what each platform answers. */
declare const NativeChannel: NativeChannelApi;

declare class VideoPlugin implements Plugin {
    name: string;
    private readonly states_;
    private latestState_;
    build(app: App): void;
    stopAll(): void;
    cleanup(app?: App): void;
}
declare const videoPlugin: VideoPlugin;

type VideoHandle = VideoStreamHandle;
type VideoPlayOptions = VideoStreamOptions;
declare class VideoAPI {
    private readonly backend_;
    private readonly handles_;
    private refResolver_;
    private disposed_;
    private hostMuted_;
    private readonly muteTargets_;
    private readonly offHostMute_;
    private readonly hasHostMute_;
    private executionHeld_;
    private readonly playbackTargets_;
    private readonly offExecution_;
    private readonly hasExecutionPolicy_;
    baseUrl: string;
    constructor(backend: PlatformVideoBackend, observeExecution?: (callback: (held: boolean) => void) => () => void);
    get backendName(): string;
    setRefResolver(resolver: ((ref: string) => string) | null): void;
    private resolveUrl_;
    play(source: string, options?: VideoPlayOptions): VideoStreamHandle;
    /**
     * Resolve the cook-demuxed audio-track sibling through the realm's ref
     * resolver: the cook registers it as `<source path>.m4a` (path refs) or
     * `<uuid>-audio` (uuid refs). A resolver miss returns the ref unchanged —
     * treated as "no cooked sibling" so backends fall back to URL derivation.
     */
    private resolveAudioTrack_;
    update(module: ESEngineModule | null): void;
    stop(handle: VideoStreamHandle): void;
    stopAll(): void;
    dispose(): void;
}
declare const VideoPlayer: ResourceDef<VideoAPI>;

interface VideoData {
    source: string;
    autoplay: boolean;
    loop: boolean;
    muted: boolean;
    volume: number;
    playbackRate: number;
    /** On first frame, size the Sprite to the video's native pixels. */
    fitSize: boolean;
    enabled: boolean;
}
declare const Video: ComponentDef<VideoData>;

declare class ParticlePlugin implements Plugin {
    name: string;
    /** Entity → authored color-over-life gradient (out-of-band; baked to the C++ LUT). */
    private readonly gradients_;
    /** Entity → authored size-over-life curve (out-of-band; baked to the C++ LUT). */
    private readonly sizeCurves_;
    /** Entity → authored burst schedule (out-of-band; handed to the sim as (time, count) pairs). */
    private readonly bursts_;
    private overlay_;
    private offDespawn_;
    build(app: App): void;
    cleanup(): void;
}
declare const particlePlugin: ParticlePlugin;

/**
 * Per-app motion-trail API. Wraps the C++ registry-scoped trail system so two App
 * instances (e.g. editor tabs) drive independent trails without cross-talk.
 *
 * Consumed as a resource: declare `Res(Trail)` as a system param, or grab it with
 * `app.getResource(Trail)` outside ECS code.
 */
declare class TrailAPI {
    private readonly module_;
    private readonly registry_;
    /** @param module whichever engine core is present (see ecs/engineApi.ts). */
    constructor(module: NonNullable<EngineApi>, registry: CppRegistry);
    /** Advance every trail: record points for moving emitters, age out old ones. */
    update(dt: number): void;
    /** Drop an entity's recorded history (the streak vanishes instantly). */
    clear(entity: Entity): void;
}
/** Resource handle for the per-app trail API. */
declare const Trail: ResourceDef<TrailAPI>;

declare class TrailPlugin implements Plugin {
    name: string;
    private offDespawn_;
    build(app: App): void;
    cleanup(): void;
}
declare const trailPlugin: TrailPlugin;

/** One simulated point of a chain. */
interface SpringBoneParticle {
    /** Where the simulation has it, in world units. */
    position: [number, number, number];
    /** Where the animation puts it. */
    pose: [number, number, number];
    /** The index of its parent particle, -1 for the chain's root. */
    parent: number;
}
/**
 * Per-app secondary-motion API. Wraps the C++ registry-scoped spring-bone system, so two App instances (editor tabs) simulate
 * independent chains.
 *
 * Consumed as a resource: declare `Res(SpringBone)` as a system param, or grab it with `app.getResource(SpringBone)`.
 */
declare class SpringBoneAPI {
    private readonly module_;
    private readonly registry_;
    /** @param module whichever engine core is present (see ecs/engineApi.ts). */
    constructor(module: NonNullable<EngineApi>, registry: CppRegistry);
    /** Advance every chain: step the springs toward the pose the animation gave, then turn the bones to match. */
    update(dt: number): void;
    /**
     * A chain as the engine has it now, for an editor to draw: each particle's simulated position, the position the animation gives it, and
     * its parent's index (-1 for the root). Empty when the chain has not been stepped yet.
     */
    snapshot(root: Entity): SpringBoneParticle[];
    /** Give a chain's bones back as the animation had them and forget its state: what ends a preview in an editor. */
    release(root: Entity): void;
    /** Put a chain back at its animated pose on its next frame: a teleport, a respawn, a pose set by hand. */
    reset(root: Entity): void;
}
/** Resource handle for the per-app spring-bone API. */
declare const SpringBoneRes: ResourceDef<SpringBoneAPI>;

/**
 * Runs the spring-bone chains after the frame's animation has posed the skeleton (animators write in Update; this is PostUpdate)
 * and before it is drawn. Frozen in editor edit mode like the rest of gameplay, so a chain never swings while it is being authored;
 * the FX preview flag is the one exception (env.ts).
 */
declare class SpringBonePlugin implements Plugin {
    name: string;
    build(app: App): void;
}
declare const springBonePlugin: SpringBonePlugin;

declare class MeshRendererAPI {
    /** Whichever engine core is present (see ecs/engineApi.ts). */
    private readonly module_;
    private readonly registry_;
    /** Entity → authored geometry, so scene save round-trips what was uploaded. */
    private readonly authored_;
    constructor(
    /** Whichever engine core is present (see ecs/engineApi.ts). */
    module_: NonNullable<EngineApi>, registry_: CppRegistry);
    /**
     * Upload geometry for an entity's MeshRenderer component. Positions are x,y pairs in
     * component-local space; uvs default to 0,0 (untextured meshes render vertex
     * colors on the white texture); colors are r,g,b,a floats per vertex.
     */
    setGeometry(entity: Entity, geometry: MeshRendererGeometry): void;
    /** Clear an entity's mesh geometry (a valid state: the mesh renders nothing). */
    clearGeometry(entity: Entity): void;
    /** The last geometry uploaded for this entity (scene-export source). */
    getGeometry(entity: Entity): MeshRendererGeometry | undefined;
}
declare const MeshRenderers: ResourceDef<MeshRendererAPI>;
declare class MeshRendererPlugin implements Plugin {
    name: string;
    readonly profileDomain = "render";
    private offDespawn_;
    private offBlobShadows_;
    build(app: App): void;
    cleanup(): void;
}
declare const meshRendererPlugin: MeshRendererPlugin;

/** A 4x4 column-major matrix, as {@link worldMatrix} makes one (doubles, so a deep chain does not drift). */
type Mat4 = Float64Array;
interface TRS {
    position: {
        x: number;
        y: number;
        z: number;
    };
    rotation: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
    scale: {
        x: number;
        y: number;
        z: number;
    };
}
/**
 * Where a part stands in its root's space: the product of the LOCAL transforms on the way down
 * from the root to it, root excluded. Read from local transforms rather than from world ones, so
 * the answer does not depend on whether the root has moved this frame and its world matrices
 * have been brought up to date yet.
 */
declare function rootLocalMatrix(chain: readonly TRS[]): Mat4;
/** One part, as the planner sees it: its draw state, its mesh and where it stands in the root's space. */
interface CompositePart {
    entity: number;
    /** Draw state plus vertex layout (`staticBatchKey`): parts that may share a draw. */
    key: string;
    /** The mesh handle: parts that may share an instanced set share this AND the key. */
    mesh: number;
    local: Mat4;
    vertices: number;
    /** Centre of its mesh's bounds in the root's space: the cell it is merged in. */
    center: readonly [number, number, number];
}
interface CompositeLimits {
    /** Parts of one mesh at or past which they are drawn as one instanced set instead of merged. */
    instanceMin: number;
    /** Side of a merge chunk in the root's space; 0 = chosen from the composite's size. */
    cellSize: number;
    /** Vertices a merged chunk may hold before it is split. */
    maxVertices: number;
}
declare const COMPOSITE_DEFAULTS: CompositeLimits;
/** Parts of one mesh and draw state, drawn as the placements of one set. */
interface CompositeInstanceSet {
    key: string;
    mesh: number;
    entities: number[];
}
/** Parts merged into one mesh. `id` is stable while the chunk's members are the same, which is what lets an edit re-merge only its chunk. */
interface CompositeChunk {
    id: string;
    key: string;
    entities: number[];
}
interface CompositePlan {
    sets: CompositeInstanceSet[];
    chunks: CompositeChunk[];
    /** Parts nothing would draw with: they keep drawing themselves. */
    alone: number[];
    cellSize: number;
}
/** Decide which parts are instanced, which are merged and in which chunk, and which draw alone. */
declare function planComposite(parts: readonly CompositePart[], limits?: CompositeLimits, cellSize?: number): CompositePlan;

/** The fields of the `CompositeBatch` component. @experimental */
interface CompositeBatchData {
    /** Parts of one mesh at or past which they are drawn as one instanced set instead of merged. */
    instanceMin: number;
    /** Side of a merge chunk in the root's own space; 0 lets the pass choose from the model's size. */
    cellSize: number;
    /** Meshes under the root the pass draws (instanced or merged). Written by the pass. */
    parts: number;
    /** Of those, the parts drawn as instanced sets. */
    instanced: number;
    /** Draws the model takes now: sets, merged chunks and the parts that still draw themselves. */
    draws: number;
    /** Draws the same parts took before: one per distinct mesh and draw state. */
    drawsBefore: number;
    /** Parts that kept moving inside the root and were let go to draw themselves. */
    moving: number;
}
/**
 * Marks the root of a model assembled from many parts that moves as a whole (a ship, a vehicle, a moving platform),
 * so its parts may be drawn in a few draws that follow it. Presence is the opt-in; the parts need nothing.
 *
 * @experimental
 */
declare const CompositeBatch: ComponentDef<CompositeBatchData>;
interface PartState {
    entity: Entity;
    key: string;
    mesh: number;
    local: Mat4;
    vertices: number;
    center: [number, number, number];
    mr: MeshRendererData;
    /** Looks in a row in which its place in the root changed. */
    changed: number;
}
interface DrawnChunk {
    holder: Entity;
    handle: number;
    entities: Entity[];
}
interface DrawnSet {
    holder: Entity;
    entities: Entity[];
    placements: Float32Array;
}
interface CompositeState {
    root: Entity;
    cellSize: number | null;
    parts: Map<Entity, PartState>;
    chunks: Map<string, DrawnChunk>;
    sets: Map<string, DrawnSet>;
    /** Parts whose MeshRenderer this pass switched off, and so must switch back on. */
    owned: Set<Entity>;
    moving: Set<Entity>;
    refused: Map<Entity, StaticBatchRefusal>;
    holders: Set<Entity>;
    nextScan: number;
}
/** Run-time access to the composites: what each one draws, and how to look again now. */
declare class CompositeBatching {
    /** @internal */ readonly composites_: Map<number, CompositeState>;
    /** @internal */ readonly forced_: Set<number>;
    /** @internal */ busy_: boolean;
    /** Work done so far, for a profiler or a check: re-plans, chunk merges, placement writes, scans. */
    readonly counts: {
        scans: number;
        applies: number;
        merges: number;
        placementWrites: number;
    };
    /** Look at `root` (or every composite) on the next frame instead of waiting for the next scheduled look. */
    refresh(root?: Entity): void;
    /** What a composite draws now, or null when it is not one the pass has seen. */
    report(root: Entity): {
        sets: number;
        chunks: number;
        alone: number;
        moving: number;
        refused: number;
        parts: number;
    } | null;
}
/** The resource the plugin installs. @experimental */
declare const CompositeBatchingRes: ResourceDef<CompositeBatching>;
declare class CompositeBatchPlugin implements Plugin {
    name: string;
    private readonly meshes_;
    build(app: App): void;
    cleanup(app?: App): void;
    private meshData;
    /** The root's subtree (root included), not entering a nested composite or the pass's own draws. */
    private subtree;
    /** The local transforms from just under the root down to `entity`. */
    private chain;
    /** Why a part cannot be folded, or null. The same rules a static batch keeps, read the same way. */
    private refusal;
    private scan;
    /** Re-plan the composite and bring its draws in line, re-merging only the chunks whose members changed. */
    private apply;
    /** Mesh data the scan has already read, so a merge never waits. */
    private cached;
    private readonly resolved_;
    private holder;
    private writePlacements;
    private restore;
    private stamp;
    private discard;
}
declare const compositeBatchPlugin: Plugin;

/** One piece of work in hand: what it is and how far along, 0 to 1. */
interface BakeProgress {
    readonly label: string;
    readonly progress: number;
}
/** A job: yields its progress (0 to 1) whenever it may be paused, and returns what it made. */
type WorkJob<T> = Generator<number, T, void>;
/** The jobs an App is running. Read {@link Bakes.active} for what to show. */
declare class Bakes {
    /** How long, in milliseconds, all the work spread over frames may take of one frame between it. */
    budgetMs: number;
    /** How much more a frame gives while work that would be seen missing is still to do (see `urge`). */
    priorityExtraMs: number;
    /** What this frame's work stepped elsewhere may still take, after the jobs and whoever went before. */
    private left_;
    /** Who asked for time this frame, in the order they first did, and who asked the frame before. */
    private readonly turns_;
    private waiting_;
    private open_;
    /** How long one piece of each owner's work has been taking, smoothed. */
    private readonly piece_;
    /** Whose remaining work would be seen missing. */
    private readonly urgent_;
    private clock_;
    /** Whether work stepped elsewhere ran out of time, this frame and the one before. */
    private starved_;
    private starvedBefore_;
    private readonly running_;
    private readonly marks_;
    /**
     * Runs `job` over the frames to come, under `label`; the promise is what it returns. A job that is cancelled (see `cancel`)
     * never settles.
     */
    run<T>(label: string, job: WorkJob<T>): {
        done: Promise<T>;
        cancel: () => void;
    };
    /**
     * Shows work that is stepped elsewhere (pages made a few a frame) under `label` while `progress` is below 1; `owner` names it,
     * so a later mark replaces it. Mark it 1, or `clear` it, when it is done.
     */
    mark(owner: object, label: string, progress: number): void;
    clear(owner: object): void;
    /** Every piece of work in hand now. Empty when the engine is idle. */
    get active(): BakeProgress[];
    /**
     * Whether `owner`'s work stepped elsewhere may go on this frame. Such work does what it must at once (what stands right by the
     * player) whatever this says, and stops when it says no; saying no is remembered, so the jobs leave it more of the next frame.
     *
     * The first time an owner asks in a frame it is given its part: what the frame has left, divided among it and those that asked
     * the frame before and have not had their turn yet. An owner that asks alone has all of it.
     */
    hasTime(owner?: object): boolean;
    /**
     * Says whether what `owner` still has to do would be seen missing by the player: the chunk they stand in, the ground under them.
     * While any owner says so the frame's budget is larger by `priorityExtraMs`. Say false when it is done, or it is held for good.
     */
    urge(owner: object, urgent: boolean): void;
    /** Whether something the player would see missing is still being made: what a loading screen waits for. */
    get urgent(): boolean;
    /** What this frame may spend: the steady budget, and the extra while something urgent is outstanding. */
    get frameBudgetMs(): number;
    /** Starts the frame's budget and steps the jobs for their part of it, oldest first; a job that finishes or throws settles its promise. */
    step(now?: () => number): void;
}
/** The resource; {@link bakesOf} installs it where it is missing. @experimental */
declare const BakesRes: ResourceDef<Bakes>;
/** The App's jobs, installed (with the system that steps them, before Update) on first use, so a plugin that bakes needs nothing else. */
declare function bakesOf(app: App): Bakes;
/** Runs a job to its end at once, for a caller with no frames to spread it over (a test, a tool). */
declare function finish<T>(job: WorkJob<T>): T;

/** What the streamer keeps of one texture. @experimental */
interface StreamedTexture {
    handle: number;
    /** The file's own size. */
    fullWidth: number;
    fullHeight: number;
    /** The longer side it is held at now. */
    edge: number;
    /** The most texels across a view asked for lately; 0 when none has drawn it for `unseenAfter`. */
    wanted: number;
    /** When a view last drew it, ms. */
    seenAt: number;
    /** Since when the size it should be has been smaller than the one it is, ms; -1 when it has not. */
    smallerSince: number;
}
/** @experimental */
interface TextureStreamingOptions {
    /** No texture is held smaller than this on its longer side. */
    minEdge: number;
    /** The bytes the streamed textures may hold together; 0 is no cap. */
    budgetBytes: number;
    /** How long a texture must be needed smaller before it shrinks, ms. */
    shrinkAfter: number;
    /** How long a texture no view draws keeps the size it was needed at, ms; then it goes to `minEdge`. */
    unseenAfter: number;
}
/** @experimental */
declare const TEXTURE_STREAMING_DEFAULTS: TextureStreamingOptions;
/** The longer side a texture should be held at: the next power of two above what is wanted, between `minEdge` and the file. @experimental */
declare function streamTargetEdge(fullEdge: number, wanted: number, minEdge: number): number;
/** The bytes a texture held at `edge` on its longer side takes, with its chain, at four bytes a texel. @experimental */
declare function streamedBytes(fullWidth: number, fullHeight: number, edge: number): number;
/** A size to move a texture to. @experimental */
interface StreamMove {
    handle: number;
    edge: number;
}
/**
 * What to move now: every texture whose size should change, the growing ones first and the most starved of those first, then the
 * shrinking ones. With a budget, the sizes are first brought within it by halving the largest, so a scene that needs more than the
 * budget is drawn a level softer rather than over it. Writes `smallerSince` on the entries it judges.
 *
 * @experimental
 */
declare function planStreaming(entries: readonly StreamedTexture[], now: number, options: TextureStreamingOptions): StreamMove[];
/** What streaming is doing, for a profiler and a check. @experimental */
declare class TextureStreaming {
    readonly textures: Map<number, StreamedTexture>;
    /** Textures something other than a mesh draws, left at their size. */
    readonly held: Set<number>;
    /** Textures that came back larger than asked (a host that cannot cut a file at a level): left alone from then on. */
    readonly refused: Set<number>;
    /** Textures being put back at their size because something other than a mesh draws them. */
    readonly restoring: Set<number>;
    moves: number;
    failures: number;
    inFlight: number;
    enabled: boolean;
    /** The bytes the streamed textures take now, and would at their files' sizes. */
    bytes(): {
        now: number;
        full: number;
    };
}
/** @experimental */
declare const TextureStreamingRes: ResourceDef<TextureStreaming>;
/** @experimental */
declare class TextureStreamingPlugin implements Plugin {
    name: string;
    build(app: App): void;
}
/** @experimental */
declare const textureStreamingPlugin: Plugin;

type Vec3 = [number, number, number];
/** Where on the unit square a direction of the upper hemisphere folds to. Below the horizon is taken as on it. @experimental */
declare function impostorEncode(d: Vec3): [number, number];
/** The direction a point of the unit square unfolds to. @experimental */
declare function impostorDecode(u: number, v: number): Vec3;
/** The direction, from the object toward the camera, that frame (i, j) of a `frames`-wide atlas is taken from. @experimental */
declare function impostorFrameDirection(i: number, j: number, frames: number): Vec3;
/** The up a picture is taken with from `d`: world up laid flat across the view, and -Z straight overhead. @experimental */
declare function impostorPictureUp(d: Vec3): Vec3;
/** The sorting layer the pictures are taken on: nothing else is drawn by their cameras, and nothing else is put there. */
declare const IMPOSTOR_BAKE_LAYER = 31;
/** One kind of mesh's pictures: being taken, or taken. */
interface ImpostorKind {
    target: RenderTextureHandle | null;
    frames: number;
    /** While being taken: the cameras and the copy, and the frame they were set up on. */
    cameras: Entity[];
    copy: Entity | null;
    since: number;
    ready: boolean;
}
/** What the plugin has taken, by kind. @experimental */
declare class ImpostorAtlases {
    readonly kinds: Map<string, ImpostorKind>;
    /** The entities handed an atlas, and by which kind. */
    readonly given: Map<number, string>;
    /** How many kinds have their pictures. */
    get ready(): number;
}
/** @experimental */
declare const ImpostorAtlasesRes: ResourceDef<ImpostorAtlases>;
/** What makes two impostors share pictures: everything that decides how the mesh looks, and how the atlas is cut. */
declare function impostorKindKey(mr: MeshRendererData, imp: ImpostorData): string;
/** @experimental */
declare class ImpostorPlugin implements Plugin {
    name: string;
    build(app: App): void;
}
/** @experimental */
declare const impostorPlugin: Plugin;

/**
 * @file    drawBudget.ts
 * @brief   Where a frame's draws went, pass by pass, held against the level's draw call budget.
 *
 * @details The device counts every draw it issues (`render.gpu.draws`); the scene's and the overlay's
 *          lists count theirs after batching (`batch.draws`), and the passes that draw the scene again
 *          count their own (shadow maps, the depth prepass, planar reflections, motion vectors, the
 *          cover pass). What none of them claims — post-processing, a blit, the editor's grid — is
 *          `other`, so the shares always add up to the device's total and a pass nobody counts is still
 *          seen. The per-pass counters are published only while the frame profiler is on; without them
 *          everything but the lists is `other`.
 */
/** A part of the frame, by what drew it. @experimental */
type DrawPass = 'lists' | 'shadow' | 'prepass' | 'reflection' | 'motion' | 'cover' | 'other';
/** @experimental */
interface DrawPassShare {
    pass: DrawPass;
    draws: number;
}
/** @experimental */
interface DrawBudgetReport {
    /** Every draw the GPU was asked for. */
    draws: number;
    /** The budget it is held to; 0 is none. */
    budget: number;
    /** By how many it went past the budget; 0 within it. */
    over: number;
    /** The draws by pass, largest first, the empty ones left out. */
    passes: DrawPassShare[];
}
/**
 * A frame's draws by pass. @p gpuDraws is the device's own count; @p counters the frame's engine
 * counters by name (a frame stats report's `cppCounters`), and @p listDraws the lists' count to use
 * when the counters do not carry it (they are absent while the profiler is off).
 *
 * @experimental
 */
declare function drawBudgetReport(gpuDraws: number, budget: number, counters: Readonly<Record<string, number>>, listDraws?: number): DrawBudgetReport;

/** What a fact may be. Enough for a count, a flag, or a named place. */
type PlaythroughValue = string | number | boolean;
/**
 * The facts a game publishes about itself, by its own names. Open rather than a
 * fixed set: `cores` and `gate` belong to one game, and an engine that named
 * them would be designing every other game's progression.
 */
interface PlaythroughData {
    facts: Record<string, PlaythroughValue>;
}
declare const Playthrough: ResourceDef<PlaythroughData>;

/**
 * Trigonometry a compiled system may call, answering the same bits as the
 * interpreted build. `Math.sin` is refused by the AOT subset and says so.
 *
 * @beta
 */
declare const exact: {
    /** Sine, to the same bits in an interpreted build and a compiled one. */
    sin(x: number): number;
    /** Cosine, to the same bits in an interpreted build and a compiled one. */
    cos(x: number): number;
};

/**
 * @file    scalar.ts
 * @brief   Scalar math helpers — the single TS source for the clamp/lerp/remap
 *          family game code previously re-implemented inline. Exposed as the
 *          `scalar` namespace (e.g. `scalar.lerp(a, b, t)`).
 */
declare const scalar: {
    /** Clamp `x` to [min, max]. */
    readonly clamp: (x: number, min: number, max: number) => number;
    /** Clamp `x` to [0, 1]. */
    readonly clamp01: (x: number) => number;
    /** Linear interpolate a→b by t (t is not clamped). */
    readonly lerp: (a: number, b: number, t: number) => number;
    /** Inverse of lerp: the t for which lerp(a,b,t)===value (0 if a===b). */
    readonly inverseLerp: (a: number, b: number, value: number) => number;
    /** Map `value` from [inMin,inMax] onto [outMin,outMax]. */
    readonly remap: (value: number, inMin: number, inMax: number, outMin: number, outMax: number) => number;
    readonly deg2rad: (deg: number) => number;
    readonly rad2deg: (rad: number) => number;
    /** Within `epsilon` (default 1e-6). */
    readonly approximately: (a: number, b: number, epsilon?: number) => boolean;
    /** Hermite smoothstep of `x` across the [edge0, edge1] edge (clamped). */
    readonly smoothstep: (edge0: number, edge1: number, x: number) => number;
    /** Euclidean modulo — result has the sign of `n` (unlike JS `%`). */
    readonly mod: (x: number, n: number) => number;
    readonly sign: (x: number) => number;
};

/**
 * @file    vec2.ts
 * @brief   Vec2 helpers — the single TS source for 2D vector math, operating on
 *          the canonical `Vec2` ({x,y}) type. Pure: every op returns a new Vec2.
 *          Exposed as the `v2` namespace (e.g. `v2.add(a, b)`).
 */

declare const v2: {
    readonly create: (x?: number, y?: number) => Vec2;
    readonly clone: (a: Vec2) => Vec2;
    readonly add: (a: Vec2, b: Vec2) => Vec2;
    readonly sub: (a: Vec2, b: Vec2) => Vec2;
    /** Multiply by a scalar. */
    readonly scale: (a: Vec2, s: number) => Vec2;
    /** Component-wise multiply. */
    readonly mul: (a: Vec2, b: Vec2) => Vec2;
    readonly neg: (a: Vec2) => Vec2;
    readonly dot: (a: Vec2, b: Vec2) => number;
    /** 2D cross product (z component of the 3D cross). */
    readonly cross: (a: Vec2, b: Vec2) => number;
    readonly len: (a: Vec2) => number;
    readonly len2: (a: Vec2) => number;
    readonly dist: (a: Vec2, b: Vec2) => number;
    readonly dist2: (a: Vec2, b: Vec2) => number;
    /** Unit vector, or {0,0} for a zero vector. */
    readonly normalize: (a: Vec2) => Vec2;
    /** Linear interpolate a→b by t (t not clamped). */
    readonly lerp: (a: Vec2, b: Vec2, t: number) => Vec2;
    /** Angle in radians (atan2(y, x)). */
    readonly angle: (a: Vec2) => number;
    /** Vector from an angle (radians) and length. */
    readonly fromAngle: (radians: number, length?: number) => Vec2;
    /** Rotate by `radians` about the origin. */
    readonly rotate: (a: Vec2, radians: number) => Vec2;
    /** Left perpendicular (90° CCW). */
    readonly perp: (a: Vec2) => Vec2;
    readonly equals: (a: Vec2, b: Vec2, epsilon?: number) => boolean;
};

/**
 * @file    vec3.ts
 * @brief   Vec3 helpers operating on the canonical `Vec3` ({x,y,z}) type. Pure:
 *          every op returns a new Vec3. Exposed as the `v3` namespace.
 */

declare const v3: {
    readonly create: (x?: number, y?: number, z?: number) => Vec3$2;
    readonly clone: (a: Vec3$2) => Vec3$2;
    readonly add: (a: Vec3$2, b: Vec3$2) => Vec3$2;
    readonly sub: (a: Vec3$2, b: Vec3$2) => Vec3$2;
    readonly scale: (a: Vec3$2, s: number) => Vec3$2;
    readonly mul: (a: Vec3$2, b: Vec3$2) => Vec3$2;
    readonly neg: (a: Vec3$2) => Vec3$2;
    readonly dot: (a: Vec3$2, b: Vec3$2) => number;
    readonly cross: (a: Vec3$2, b: Vec3$2) => Vec3$2;
    readonly len: (a: Vec3$2) => number;
    readonly len2: (a: Vec3$2) => number;
    readonly dist: (a: Vec3$2, b: Vec3$2) => number;
    readonly normalize: (a: Vec3$2) => Vec3$2;
    readonly lerp: (a: Vec3$2, b: Vec3$2, t: number) => Vec3$2;
    readonly equals: (a: Vec3$2, b: Vec3$2, epsilon?: number) => boolean;
};

/**
 * @file    quat.ts
 * @brief   Quaternion helpers operating on the canonical `Quat` ({w,x,y,z})
 *          type. Pure: every op returns a new Quat. Exposed as the `q` namespace.
 *
 * A rotation is a quaternion everywhere it is stored, and every place that lets
 * someone name one in a friendlier way — a Z angle in a 2D scene, three euler
 * degrees in the inspector, a rotation channel in a timeline — is a way IN, not
 * a second representation. Each such entry point that rebuilt the whole
 * quaternion from its own axis flattened the other two; keeping the conversions
 * here is what lets those entries compose instead of overwrite.
 */

declare const q: {
    create(w?: number, x?: number, y?: number, z?: number): Quat;
    clone(a: Quat): Quat;
    /** `a` applied after `b` (a·b) — a world-space turn composes on the left. */
    mul(a: Quat, b: Quat): Quat;
    /** A turn of `rad` about one axis. */
    axis(axis: "x" | "y" | "z", rad: number): Quat;
    /**
     * Unit length. Interpolating quaternions component-wise leaves a shorter
     * one, and writing that scales the model — so anything that lerps must end
     * here.
     */
    normalize(a: Quat): Quat;
    dot(a: Quat, b: Quat): number;
    /** Negated. `-q` and `q` are the same rotation; which one is stored decides
     *  whether a component-wise interpolation takes the short arc or the long one. */
    neg(a: Quat): Quat;
    /** The opposite turn. For a unit quaternion — which every stored rotation is
     *  — this is the inverse, and a world direction taken into a local frame by it. */
    conjugate(a: Quat): Quat;
    /** A vector turned by this rotation (q·v·q⁻¹, expanded). */
    rotate(a: Quat, v: Vec3$2): Vec3$2;
    /**
     * A rotation as three degrees, applied X then Y then Z about fixed axes —
     * the order every DCC's inspector shows. A rotation purely about Z reads
     * back as (0, 0, angle) and rebuilds exactly.
     */
    toEuler(a: Quat): [number, number, number];
    /** Inverse of {@link toEuler}. */
    fromEuler(deg: readonly number[]): Quat;
    /**
     * The shortest turn taking `from` to `to`; either may be any length. A
     * direction is a way of naming a rotation, so it comes in here — what is
     * stored stays the rotation. Roll about the axis is unconstrained by the pair
     * and is left at none, which is what an aim has to say about it.
     */
    rotationTo(from: Vec3$2, to: Vec3$2): Quat;
    /** Set the Z turn, keeping whatever the other two axes say — the 2D way in. */
    setAngleZ(a: Quat | undefined, deg: number): Quat;
    /** The Z turn of a 2D rotation, in radians. */
    angleZ(a: Pick<Quat, "z" | "w">): number;
    /**
     * The same turn, `t` of the way through it — the shortest arc, so a rotation
     * stored as -q scales the short way round rather than the long one. What a
     * caller handed one frame's worth of turn needs to spend it over two steps.
     */
    scaled(a: Quat, t: number): Quat;
};

/**
 * @file    color.ts
 * @brief   Color helpers on the canonical `Color` ({r,g,b,a}, 0..1 floats — the
 *          engine convention, e.g. white = {1,1,1,1}). Pure. Exposed as the
 *          `col` namespace (the bare `color` name is already an SDK export).
 */

declare const col: {
    readonly create: (r?: number, g?: number, b?: number, a?: number) => Color;
    /** Opaque color from RGB (0..1). */
    readonly rgb: (r: number, g: number, b: number) => Color;
    /** From 0..255 channels (alpha defaults opaque). */
    readonly from255: (r: number, g: number, b: number, a?: number) => Color;
    readonly clone: (c: Color) => Color;
    /** HSV uses degrees for hue and 0..1 for saturation/value/alpha. @beta */
    readonly fromHsv: (h: number, s: number, v: number, a?: number) => Color;
    /** Preserve a caller's hue at zero saturation/value; no color-space conversion. @beta */
    readonly toHsv: (color: Color, fallbackHue?: number) => {
        h: number;
        s: number;
        v: number;
    };
    /** Per-channel linear interpolate a→b by t (t not clamped). */
    readonly lerp: (a: Color, b: Color, t: number) => Color;
    readonly withAlpha: (c: Color, a: number) => Color;
    /** Per-channel multiply (tint). */
    readonly multiply: (a: Color, b: Color) => Color;
    /** Scale RGB by `s` (alpha unchanged). */
    readonly scaleRgb: (c: Color, s: number) => Color;
    /**
     * Parse `#rgb` / `#rgba` / `#rrggbb` / `#rrggbbaa` (with or without `#`) to a
     * 0..1 Color (alpha defaults opaque). Throws on malformed input.
     */
    readonly fromHex: (hex: string) => Color;
    /** Format as `#rrggbb` (or `#rrggbbaa` when `withAlpha`). Clamps to [0,1]. */
    readonly toHex: (c: Color, withAlpha?: boolean) => string;
    readonly equals: (a: Color, b: Color, epsilon?: number) => boolean;
};

/**
 * @file    LocalizationPlugin.ts
 * @brief   Registers the per-App Localization resource. Opt-in: add it via
 *          `app.addPlugin(localizationPlugin)` or with options.
 */

interface LocalizationOptions {
    /** Active locale (default 'en'). */
    locale?: string;
    /** Fallback locale when a key is missing in the active one (default 'en'). */
    fallback?: string;
    /** Catalogs to preload, keyed by locale. */
    catalogs?: Record<string, LocaleCatalog>;
    /**
     * `.eslocale` string-table assets to load at startup (paths or `@uuid:`
     * refs). Loaded through the app's Assets resource — bound Text re-flows
     * the frame each table lands. Requires the AssetPlugin.
     */
    tables?: string[];
}
declare class LocalizationPlugin implements Plugin {
    private readonly opts;
    name: string;
    constructor(opts?: LocalizationOptions);
    build(app: App): void;
}
declare const localizationPlugin: LocalizationPlugin;

/**
 * @file    saveGame.ts
 * @brief   Versioned save/load with migration, over the Storage API. A save is a
 *          `{ version, data, savedAt }` envelope; on load, older saves are run
 *          forward through a migration chain to the current version — so a
 *          shipped game can evolve its save shape without bricking old saves.
 */
interface SaveEnvelope<T> {
    /** Schema version the `data` was written at. */
    version: number;
    data: T;
    /** Epoch ms the save was written. */
    savedAt: number;
}
/** Migrates save data from version N to N+1. Keyed by the source version N. */
type SaveMigration = (data: unknown) => unknown;
/**
 * Bring `data` (written at `version`) forward to `currentVersion` by applying
 * `migrations[version]`, `migrations[version+1]`, … in order. Pure.
 * Throws if the save is newer than current (no downgrade) or a step is missing.
 */
declare function migrateSaveData(version: number, data: unknown, currentVersion: number, migrations: Record<number, SaveMigration>): unknown;
/** The slice of the Storage API SaveManager needs (injectable for tests). */
interface SaveStorage {
    getJSON<T>(key: string, defaultValue?: T): T | undefined;
    setJSON<T>(key: string, value: T): void;
    remove(key: string): void;
    has(key: string): boolean;
    /** Optional acknowledgment of pending writes for asynchronous hosts. */
    flush?(): Promise<void>;
}
interface SaveManagerOptions {
    /** Current save schema version. */
    version: number;
    /** Migration chain; `migrations[n]` upgrades version n → n+1. */
    migrations?: Record<number, SaveMigration>;
    /** Storage backend (defaults to the engine's Storage). */
    storage?: SaveStorage;
    /** Clock for `savedAt` (defaults to Date.now); inject for deterministic tests. */
    now?: () => number;
    /** Key prefix for slots (defaults to `save:`). */
    keyPrefix?: string;
}
/**
 * Named save slots with schema versioning + migration. `save(slot, data)` stamps
 * the current version; `load(slot)` migrates an older save forward and returns
 * its data (or null when the slot is empty / unreadable).
 */
declare class SaveManager {
    private readonly version;
    private readonly migrations;
    private readonly storage;
    private readonly now;
    private readonly prefix;
    constructor(opts: SaveManagerOptions);
    save<T>(slot: string, data: T): void;
    /** Save and await the host's writes when it supports asynchronous storage. */
    saveAsync<T>(slot: string, data: T): Promise<void>;
    /** Load + migrate a slot's data, or null if empty/unreadable. */
    load<T>(slot: string): T | null;
    has(slot: string): boolean;
    remove(slot: string): void;
    /** When the slot was written (epoch ms), or null if empty. */
    savedAt(slot: string): number | null;
    private key_;
}

/**
 * @file    entityUtils.ts
 * @brief   Showing / hiding an entity, and taking it out of the frame.
 *
 * Two different questions that read alike. `visible` is about drawing: the
 * entity is still simulated, still hit by queries, just not on screen.
 * `active` is about existing at all: a `Disabled` entity is skipped by the
 * systems that respect the tag.
 *
 * WHICH components hiding reaches is not decided here: each declares itself
 * `renderable=<field>` at its ES_COMPONENT site, and {@link renderableComponents}
 * answers from the registry. Scene sleep/wake and the editor's eye read the same
 * declaration, so a renderer cannot be visible to one and invisible to another.
 */

/**
 * Whether hiding this entity would do anything — it has a UI node, or at least
 * one renderer of its own. False for a bare transform, whose children draw but
 * which has nothing of its own to hide.
 */
declare function hasVisibility(world: World, entity: Entity): boolean;
/**
 * Show or hide an entity.
 *
 * A UI node hides through `display`, which the layout pass resolves down the
 * tree — hiding a panel hides everything under it, and that is what hiding a UI
 * element means. Nothing else has hierarchical visibility in the runtime, so
 * for the rest the write lands on this entity's own renderers and its children
 * keep drawing.
 */
declare function setEntityVisible(world: World, entity: Entity, visible: boolean): void;
/** The reading {@link setEntityVisible} writes. An entity with nothing to hide is visible. */
declare function isEntityVisible(world: World, entity: Entity): boolean;
/**
 * Switch `entity` off, or back on. Everything under it goes with it — a
 * character switched off with its sword still swinging is not switched off —
 * and the subtree is DERIVED, so switching the character back on does not
 * un-switch a sword the author had switched off on its own.
 */
declare function setEntityActive(world: World, entity: Entity, active: boolean): void;
/** Whether this entity ITSELF is switched on. An ancestor's switch takes it out
 *  of every query without changing this — see {@link setEntityActive}. */
declare function isEntityActive(world: World, entity: Entity): boolean;

/**
 * @file    entityBox.ts
 * @brief   How much room an entity takes up in the world, and where.
 *
 * The box an editor outlines, hit-tests and drags is the box the renderer
 * draws, so both have to be derived from one description of it. Two of them
 * agree until a pivot or a parent scale is involved, and then a selection
 * outline sits beside the sprite it claims to be around.
 */

/**
 * The three reads a box derivation needs — so an editor's read-only projection
 * of a World satisfies it without being handed the mutators.
 *
 * @experimental
 */
type ReadableWorld = Pick<World, 'valid' | 'has' | 'get'>;
/**
 * An oriented box in world units: a centre, half-extents along its own three
 * axes, and the rotation that turns those axes into the world's.
 *
 * A sprite, a UI node and any other quad have `hd` zero — they are flat, and a
 * box given thickness they do not have is hit by a ray that passes in front.
 *
 * @experimental
 */
interface EntityBox {
    cx: number;
    cy: number;
    cz: number;
    hw: number;
    hh: number;
    hd: number;
    rot: Quat;
}
/** @experimental */
interface EntityBoxOptions {
    /**
     * World half-size for an entity that draws nothing of its own — a camera, a
     * light, an empty. Zero (the default) reports no box for those; an editor
     * that wants them clickable passes the size of the icon it drew.
     *
     * A function when that size is not a world size: an icon drawn at a fixed
     * number of PIXELS covers a world extent that depends on where it is, and the
     * caller is handed the entity's world position to answer for it.
     */
    iconHalf?: number | ((at: Vec3$2) => number);
}
/**
 * The world box of `entity`, or null when it has none.
 *
 * Size scaled by the WORLD scale, centred by the pivot, turned by the world
 * rotation — the three fields the renderer composes. UI nodes get null: they
 * live in the layout's own screen space and are hit-tested there.
 *
 * @experimental
 */
declare function entityWorldBox(world: ReadableWorld, entity: Entity, opts?: EntityBoxOptions): EntityBox | null;
/**
 * What a UI box derivation needs on top of the reads: a laid-out size lives in
 * the engine core, not in a component.
 *
 * @experimental
 */
type LayoutWorld = ReadableWorld & Pick<World, 'getCppRegistry' | 'getWasmModule'>;
/**
 * The world box of a UI node's resolved layout — {@link entityWorldBox} for the
 * space UI lives in. Null for anything that is not a laid-out UI node.
 *
 * @experimental
 */
declare function uiNodeWorldBox(world: LayoutWorld, entity: Entity): EntityBox | null;
/**
 * The world box of a MeshRenderer's geometry — {@link entityWorldBox} for a mesh,
 * whose extent is in its vertices rather than in a size field. The engine
 * answers: only it knows whether the live geometry is the resident one or the
 * inline payload. Null for anything else, and for a mesh that draws nothing.
 *
 * @experimental
 */
declare function meshWorldBox(world: LayoutWorld, entity: Entity): EntityBox | null;
/**
 * The box's eight corners in world units — what an outline is drawn through and
 * what a union is taken over. A flat box reports four of them twice, which is
 * what a quad's eight corners are.
 *
 * @experimental
 */
declare function entityBoxCorners(b: EntityBox): Vec3$2[];
/**
 * How far along @p dir a ray from @p origin travels to meet the box, or null
 * when it misses.
 *
 * The slab test in the box's own frame. Zero half-extent is a flat box rather
 * than a degenerate one: a ray parallel to it hits only from within its plane.
 *
 * @experimental
 */
declare function entityBoxRayHit(b: EntityBox, origin: Vec3$2, dir: Vec3$2): number | null;

/**
 * @file    entityPick.ts
 * @brief   Which entities a click lands on, for whoever is holding a camera.
 *
 * The editor's viewport and a running game ask the same question of the same
 * boxes. They asked it twice, and the two answers had drifted: one knew a mesh's
 * extent and the other boxed a model as a point.
 */

/**
 * The reads a pick needs: a box's, plus the World's own list of entities.
 *
 * @experimental
 */
type PickWorld = LayoutWorld & Pick<World, 'getAllEntities'>;
/** @experimental */
interface EntityPickOptions {
    /**
     * World half-size of the box given to entities that draw nothing — a camera,
     * a light, an empty. Zero (the default) leaves them unpickable, which is what
     * a realm that draws no gizmo for them wants. A function when the icon's size
     * is a screen size (see {@link EntityBoxOptions.iconHalf}).
     */
    iconHalf?: number | ((at: Vec3$2) => number);
    /** Entities this realm refuses to select. Everything is selectable by default. */
    pickable?(entity: Entity): boolean;
    /** The project's sorting-layer masks, so hits rank the way the frame stacked them. */
    ySortLayers?: number;
    depthLayers?: number;
}
/**
 * Entities the ray meets, topmost first.
 *
 * The ray decides what is hit; the layer rules decide which of the hits is on
 * top, because that is what the renderer stacked them by and a click that ranked
 * them any other way selects something the person cannot see.
 *
 * @experimental
 */
declare function pickEntitiesByRay(world: PickWorld, ray: WorldRay, opts?: EntityPickOptions): Entity[];

type HitAreaShape = {
    type: 'rect';
    x: number;
    y: number;
    width: number;
    height: number;
} | {
    type: 'circle';
    cx: number;
    cy: number;
    radius: number;
} | {
    type: 'polygon';
    points: number[];
};
declare function pointInHitArea(px: number, py: number, area: HitAreaShape): boolean;

declare enum ScreenOrientation {
    Portrait = "portrait",
    Landscape = "landscape"
}
/** Event payloads for {@link ScreenInfo.on}. */
interface ScreenInfoEvents {
    resize: [width: number, height: number];
    orientationchange: [orientation: ScreenOrientation];
}
declare class ScreenInfo {
    width: number;
    height: number;
    dpr: number;
    orientation: ScreenOrientation;
    private events_;
    private initialized_;
    on<K extends keyof ScreenInfoEvents>(event: K, handler: (...args: ScreenInfoEvents[K]) => void): () => void;
    update(width: number, height: number, dpr?: number): void;
}

type SocketReadyState = PlatformSocketReadyState;
type GameSocketOptions = PlatformSocketOptions;
declare class GameSocket implements PlatformSocket {
    private url_;
    private protocols_?;
    private ws_;
    private sendQueue_;
    private events_;
    /** A WebSocket: nothing is lost and nothing overtakes. */
    readonly delivery: "reliable-ordered";
    readyState: SocketReadyState;
    constructor(options: GameSocketOptions);
    on<K extends keyof PlatformSocketEvents>(event: K, handler: (...args: PlatformSocketEvents[K]) => void): () => void;
    connect(): void;
    send(data: string | ArrayBuffer): void;
    close(code?: number, reason?: string): void;
}

declare class MiniGameSocket implements PlatformSocket {
    private url_;
    private protocols_?;
    private readonly g_;
    private task_;
    private sendQueue_;
    private events_;
    /** `wx.connectSocket` and its siblings are WebSockets like any other. */
    readonly delivery: "reliable-ordered";
    readyState: SocketReadyState;
    constructor(options: GameSocketOptions, global: MiniGameGlobal);
    on<K extends keyof PlatformSocketEvents>(event: K, handler: (...args: PlatformSocketEvents[K]) => void): () => void;
    connect(): void;
    send(data: string | ArrayBuffer): void;
    close(code?: number, reason?: string): void;
}

/**
 * @file    WeChatSocket.ts
 * @brief   WeChat's binding of the mini-game family socket.
 *
 * @deprecated Use {@link MiniGameSocket}, which takes the host global explicitly
 * and serves every vendor of the family. This subclass only reads `wx` off the
 * global scope for callers that constructed it by name.
 */

declare class WeChatSocket extends MiniGameSocket {
    constructor(options: GameSocketOptions);
}

/**
 * @file  createSocket.ts — open a socket through the platform adapter.
 *
 * Its own module rather than the networking barrel's: the barrel re-exports
 * replication, so anything that reaches it puts the protocol in the package.
 */

/**
 * Web → WebSocket, wechat → wx.connectSocket, node → ws. A platform without
 * networking fails loud; a bare host with no adapter set (unit tests) falls
 * back to the browser socket.
 */
declare function createSocket(options: GameSocketOptions): PlatformSocket;

/**
 * Add capabilities to the platform this app is already on — a host answering
 * what its adapter cannot (the editor's play realm stands in for an open data
 * context this way). Its own door because `setPlatform({ ...getPlatform() })`
 * drops every method an adapter holds on its PROTOTYPE.
 *
 * @throws Error if no platform is set — there is nothing to extend yet.
 */
declare function extendPlatform(extra: Partial<PlatformAdapter>): void;
/**
 * Get the current platform adapter
 * @throws Error if platform not initialized
 */
declare function getPlatform(): PlatformAdapter;
/**
 * Check if platform is initialized
 */
declare function isPlatformInitialized(): boolean;
/**
 * Get platform type
 */
declare function getPlatformType(): PlatformAdapter['name'] | null;
/**
 * Check if running on WeChat specifically (true vendor identity).
 * Prefer isMiniGame() for "no DOM / packaged fs / subpackages" checks that hold
 * for every mini-game vendor, not just WeChat.
 */
declare function isWeChat(): boolean;
/**
 * Check if running on Web
 */
declare function isWeb(): boolean;
/**
 * Check if running on a native host (embedded Dawn + JS engine on iOS/Android).
 * Native has no DOM: offscreen canvas/image throw, textures come from the
 * pixel-decode path (loadImagePixels), and lifecycle/safe-area treat it like a
 * headless-but-visible host rather than the web DOM branch.
 */
declare function isNative(): boolean;
declare function platformFetch(url: string, options?: PlatformRequestOptions): Promise<PlatformResponse>;
declare function platformReadFile(path: string): Promise<ArrayBuffer>;
declare function platformReadTextFile(path: string): Promise<string>;
declare function platformFileExists(path: string): Promise<boolean>;
declare function platformInstantiateWasm(pathOrBuffer: string | ArrayBuffer, imports: WebAssembly.Imports): Promise<WasmInstantiateResult>;
declare function platformCreateCanvas(width: number, height: number): PlatformCanvas;
/** Whether this platform can open a share sheet at all, without opening one. */
declare function platformCanShare(): boolean;
/** Actively open the host's share sheet; false when this platform cannot share
 *  (web, native, tests) so the caller can hide its share button honestly. */
declare function platformShare(options: PlatformShareOptions): boolean;
/** Register the passive-share card provider; false when the platform has no
 *  passive share surface. The host asks the provider at share time. */
declare function platformOnShareRequest(provide: () => PlatformShareOptions): boolean;
/** The host's screen recorder, or null where there is none — which a game reads
 *  to hide its record button rather than to show one that fails. */
declare function platformScreenRecorder(): PlatformScreenRecorder | null;
/** Whether a purchase may happen here at all — declared by the platform, and
 *  permitted on THIS device. See `PlatformAdapter.canPay`. */
declare function platformCanPay(): boolean;
/** Buy in-game currency; rejects where purchase is not available, so a caller
 *  that skipped {@link platformCanPay} hears why rather than hanging. */
declare function platformRequestPayment(request: PlatformPaymentRequest): Promise<void>;
/**
 * Whether this platform has a USABLE open data context — what a leaderboard
 * reads to hide itself honestly (web, native and the editor have none).
 *
 * Method presence is not the answer here, the way it is for share: the
 * mini-game family is ONE adapter, so every vendor defines these, and a game
 * whose package declares no context directory has none even on a host that
 * supports them. So the honest probe is the same one the ad path uses — ask
 * for the thing and treat null as "not here".
 */
declare function platformCanOpenData(): boolean;
/**
 * Send one message into the open data context; false where there is none.
 * One way: the hosts offer no path back, so there is nothing to await.
 *
 * Gated on the same probe rather than on method presence — otherwise this
 * reports a delivery it did not make, on every mini-game host without a
 * context, which is the answer a caller is least able to check.
 */
declare function platformOpenDataPostMessage(message: Record<string, unknown>): boolean;
/** The canvas the open data context draws on, for sampling as a texture. */
declare function platformOpenDataCanvas(): PlatformCanvas | null;
/** Write this player's own cloud rows; false where the host has no such store.
 *  Unlike a share, "there was nowhere to write this" is knowable at call time,
 *  so it is reported rather than swallowed. */
declare function platformSetCloudKeyValues(entries: Readonly<Record<string, string>>): boolean;
declare function platformDevicePixelRatio(): number;

/**
 * @file    logger.ts
 * @brief   Centralized logging system for SDK
 */
declare enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3
}
interface LogEntry {
    timestamp: number;
    level: LogLevel;
    category: string;
    message: string;
    data?: unknown;
}
interface LogHandler {
    handle(entry: LogEntry): void;
}
declare class Logger {
    private handlers_;
    private minLevel_;
    constructor();
    setMinLevel(level: LogLevel): void;
    addHandler(handler: LogHandler): void;
    removeHandler(handler: LogHandler): void;
    clearHandlers(): void;
    debug(category: string, message: string, data?: unknown): void;
    info(category: string, message: string, data?: unknown): void;
    warn(category: string, message: string, data?: unknown): void;
    error(category: string, message: string, data?: unknown): void;
    private log;
}
/**
 * Default logger singleton. Prefer this over `console.*` inside the SDK
 * so consumers can install a handler (e.g. an editor log panel) and
 * receive structured `LogEntry`s with category + level.
 *
 * Usage: `import { log } from './logger'; log.warn('physics', 'foo', err);`
 */
declare const log: Logger;
declare function getLogger(): Logger;
declare function setLogLevel(level: LogLevel): void;
declare function debug(category: string, message: string, data?: unknown): void;
declare function info(category: string, message: string, data?: unknown): void;
declare function warn(category: string, message: string, data?: unknown): void;
declare function error(category: string, message: string, data?: unknown): void;

/**
 * @file    events.ts
 * @brief   What a shipped game reports about going wrong, and why it is
 *          AGGREGATED before anyone sees it.
 *
 * The failures that matter in a released game are the ones nobody is watching:
 * a device that loses its GL context, an asset that 404s for players in one
 * region, a system that throws on frame 12,000. None of them reach the person
 * who could fix them, because the console they would print to is on a phone.
 *
 * The reason this is not simply "send every error somewhere" is the shape those
 * errors have. A system that throws does it EVERY FRAME — sixty identical
 * reports a second, from every player at once. Sent one by one that is not
 * telemetry, it is an outage the engine caused: the network queue grows without
 * bound, the sink's rate limit trips, and the one distinct error that would have
 * explained everything arrives after the flood, if at all.
 *
 * So the unit here is not the error, it is the DISTINCT error with a count. Two
 * throws from the same system with the same message are one event seen twice,
 * carrying `firstAt`/`lastAt`, and the report says "1,842 times over 31s" —
 * which is more diagnostic than 1,842 copies would be, and is the difference
 * between a feature that can be left on in production and one that cannot.
 *
 * Nothing in this file talks to a network. See `Diagnostics.ts` for why the
 * engine never picks a destination.
 */
/** Where an event came from. Not a severity — every kind here is something the
 *  game did not intend, and what differs is who can act on it. */
type DiagnosticKind = 
/**
 * Anything the engine logged as an error: a system that threw during a
 * schedule, an asset that would not load, a subsystem that refused to start.
 *
 * One kind rather than several, because the split a developer acts on is
 * carried by `source` (the log category, or the system's name) — and the
 * alternative was recognizing a system throw by pattern-matching the
 * sentence the logger happened to print, which would break the first time
 * anyone rephrased it.
 */
'engine'
/** Reached the host with nobody catching it: `window.onerror`,
 *  `unhandledrejection`, `wx.onError`. Usually game code outside a system —
 *  a callback, a promise, a timer. */
 | 'unhandled'
/** The GPU took the context away (backgrounded, driver reset, too many
 *  contexts). The frame after this one draws nothing. */
 | 'context-lost'
/** The OS says memory is running out. Not yet a failure — it is the warning
 *  that arrives before the process is killed, which is the crash no report
 *  ever gets sent for. */
 | 'memory'
/** The game itself called `Diagnostics.report` — a failed purchase, a save
 *  that would not write, whatever it considers worth knowing. */
 | 'game';
/** One distinct problem, however many times it happened. */
interface DiagnosticEvent {
    kind: DiagnosticKind;
    /** Stable identity across repeats — see {@link fingerprint}. */
    id: string;
    message: string;
    /** The engine subsystem or the system's name, when there is one. */
    source?: string;
    stack?: string;
    /** How many times this exact problem has occurred since it was first seen. */
    count: number;
    /** Epoch ms of the first and most recent occurrence. */
    firstAt: number;
    lastAt: number;
    /** Whatever the reporter attached. The engine never puts anything
     *  identifying here, and neither should a game — see the file header of
     *  `Diagnostics.ts`. */
    context?: Record<string, unknown>;
}
/** A problem as it is reported, before aggregation gives it a count. */
interface DiagnosticReport {
    kind: DiagnosticKind;
    message: string;
    source?: string;
    /** An Error, or anything thrown — the stack is taken from it when there is
     *  one. Strings and non-Errors are tolerated: `throw 'nope'` is legal JS and
     *  is exactly the kind of code that ships. */
    error?: unknown;
    context?: Record<string, unknown>;
}
/** The stack of anything that was thrown, including the cross-realm case: an
 *  Error from a WeChat sub-context or an iframe fails `instanceof` but still
 *  carries `stack` (the same reason the console log handler checks for it). */
declare function stackOf(error: unknown): string | undefined;
declare function messageOf(error: unknown): string;
/**
 * The identity two occurrences of the same problem share.
 *
 * Message + source + the first stack frame. The message alone would merge two
 * unrelated "Cannot read properties of undefined" into one event and hide a
 * second bug behind the first; the WHOLE stack would split one bug into a dozen
 * events whenever it is reached through different callers, which is the failure
 * that makes a crash reporter useless at exactly the moment it is needed.
 *
 * Numbers in the message are normalized away, because an error carrying an
 * entity id or a frame count would otherwise be a brand-new problem every time
 * it happened.
 */
declare function fingerprint(report: DiagnosticReport): string;

/**
 * Where a game sends its diagnostics. Receives DISTINCT events with counts, not
 * individual occurrences.
 *
 * Called on the game's own thread with whatever has accumulated. It must not
 * throw — one that does is caught and dropped — and it should not block: a sink
 * that awaits a network round-trip inside the frame has traded a bug report for
 * a stutter. Batch and send it yourself.
 */
type DiagnosticsSink = (events: readonly DiagnosticEvent[]) => void;
interface DiagnosticsOptions {
    /**
     * How many distinct problems to track at once. Reached, further NEW problems
     * are dropped (counted in {@link DiagnosticsAPI.dropped}) while the ones
     * already known keep counting.
     *
     * Keeping the earliest rather than the newest is deliberate: when a game
     * comes apart it comes apart in cascade, and the first distinct failure is
     * the one that explains the next fifty. An LRU here would evict the cause
     * and keep the consequences.
     */
    maxDistinct?: number;
    /** Seconds between handing what has accumulated to the sink. Zero delivers
     *  on the next frame, which is rarely what a network sink wants. */
    flushIntervalSec?: number;
}
declare class DiagnosticsAPI {
    private events_;
    private sink_;
    private maxDistinct_;
    private flushInterval_;
    private sinceFlush_;
    private dropped_;
    /** Re-entrancy guard — see the file header. Set while a sink runs, so
     *  anything reported from inside it (or from the logger it touched) is
     *  ignored instead of recursing. */
    private inSink_;
    constructor(options?: DiagnosticsOptions);
    /**
     * Install where diagnostics go, or `null` to stop sending (events still
     * aggregate locally). Installing a sink hands it whatever has already
     * accumulated — a game that installs one after boot does not lose the boot.
     */
    setSink(sink: DiagnosticsSink | null): void;
    /** Report a problem. Repeats of one already seen increment its count. */
    report(report: DiagnosticReport): void;
    /** Report something thrown, taking the message and stack off it. */
    reportError(kind: DiagnosticReport['kind'], error: unknown, source?: string): void;
    /** The distinct problems seen since the last flush, oldest first. */
    get events(): readonly DiagnosticEvent[];
    /** New problems that were not tracked because {@link DiagnosticsOptions.maxDistinct}
     *  was reached. A non-zero value here means the report is incomplete, and a
     *  sink should say so rather than let it read as the whole picture. */
    get dropped(): number;
    /**
     * Hand everything accumulated to the sink and start a new window.
     *
     * Clears even when there is no sink: the alternative is a game that never
     * installs one accumulating counts forever, and a count since boot is not
     * what the API promises. What survives with no sink is the aggregation, not
     * an unbounded history.
     */
    flush(): void;
    /** Advance the flush clock. Driven by the plugin's system, not a timer —
     *  a background tab or a suspended mini-game should not be flushing. */
    tick(deltaSeconds: number): void;
    /** Drop everything without sending. */
    clear(): void;
}
declare const Diagnostics: ResourceDef<DiagnosticsAPI>;

/**
 * @file    DiagnosticsPlugin.ts
 * @brief   Installs the diagnostics resource and subscribes it to everything
 *          that already knew something had gone wrong.
 *
 * Nothing here is a NEW error channel. The engine has had four for a long time
 * — `app.onError`, `app.onSystemError`, `app.onWasmError`, and the logger — and
 * a fifth would just be a fifth place to remember to look. Three of those are
 * single-slot setters that belong to the GAME: taking one would silently
 * replace whatever the developer had installed, which is a bad trade for a
 * feature whose whole promise is that it does not get in the way.
 *
 * The logger is the one that was already right for this. It has always been a
 * broadcast (`addHandler`), every error the engine raises goes through it —
 * including the system-threw path, which logs before it consults either
 * handler — and adding a listener takes nothing away from anyone. So the bridge
 * is a `LogHandler`, and the game's own error handlers keep working exactly as
 * they did.
 *
 * That leaves the failures that never reach a log because they happen outside
 * the frame, which is why the platform grew three optional subscriptions:
 * uncaught host errors, a lost render context, and OS memory pressure. Each is
 * absent on the platforms that cannot signal it, and absent is fine — what is
 * collected degrades, the API does not.
 *
 * Flushing is driven by a system rather than a timer. A backgrounded tab or a
 * suspended mini-game stops stepping, and a diagnostics batch that kept firing
 * into a frozen host would be reporting from a game that is not running.
 */

interface DiagnosticsPluginOptions extends DiagnosticsOptions {
    /**
     * The lowest log level to collect. `Error` by default — a warning is
     * something the engine handled, and a report full of them buries the one
     * line that says a texture never loaded. `Warn` is the useful widening when
     * chasing a specific complaint.
     */
    captureLevel?: LogLevel;
}
declare class DiagnosticsPlugin implements Plugin {
    private readonly options_;
    name: string;
    readonly profileDomain = "diagnostics";
    private unsubscribes_;
    private handler_;
    constructor(options_?: DiagnosticsPluginOptions);
    build(app: App): void;
    cleanup(app: App): void;
}
declare const diagnosticsPlugin: DiagnosticsPlugin;

/**
 * @file    censusTypes.ts
 * @brief   The census vocabulary, apart from the registry that collects it.
 *
 * @details A probe lives in the subsystem it measures — the ECS one in ecs/, the
 *          renderer's next to the renderer — and each needs these types to
 *          declare itself. Were they in census.ts, every subsystem would take a
 *          value import of the registry to get a type, and the registry imports
 *          nothing on purpose so that anything can register with it.
 */

/**
 * How a counter is allowed to behave over a long run. See census.ts for why the
 * distinction is the whole design and not bookkeeping.
 */
type CensusTier = 'conserved' | 'bounded' | 'trend' | 'info';
interface CensusEntry {
    /** Dotted namespace: `ecs.entities`, `render.gl.textures`, `physics.bodies`. */
    readonly key: string;
    readonly value: number;
    readonly tier: CensusTier;
    readonly unit: 'count' | 'bytes';
}
/**
 * What a probe is given to read. Every field is optional and a probe must cope
 * with any of them missing: a census is taken from a bare World in a unit test,
 * from a full App in the editor, and from a running game where the wasm module
 * is reachable but the App is behind a realm boundary.
 */
interface CensusContext {
    readonly app?: App;
    readonly world?: World;
    readonly module?: ESEngineModule | null;
}
interface CensusProbe {
    /** Stable identity; registering the same id twice replaces rather than duplicates. */
    readonly id: string;
    /** `undefined` when this probe cannot measure anything in the given context. */
    read(ctx: CensusContext): readonly CensusEntry[] | undefined;
}
interface Census {
    readonly atMs: number;
    readonly entries: ReadonlyMap<string, CensusEntry>;
    /** Probes that threw. Their counters are ABSENT from `entries`, not zero. */
    readonly failedProbes: readonly string[];
}

/**
 * @file    censusRegistry.ts
 * @brief   Where probes are kept, apart from both the probes and the judge.
 *
 * @details Split out so `census.ts` can depend on the engine's own probes (it
 *          installs them before the first snapshot) while those probes depend
 *          only on this — no cycle. The bundler's tree-shaking makes the
 *          alternative unsafe: with every module but an entry marked
 *          side-effect free, registrations reached by a bare import or a
 *          top-level call are dropped from dist, and takeCensus ships blind.
 */

/**
 * Register a source of counters. Keyed by `probe.id`, so a plugin installed
 * twice replaces its probe rather than double-counting through it.
 */
declare function registerCensusProbe(probe: CensusProbe): () => void;

/**
 * @file    census.ts
 * @brief   How many of X are alive right now — one snapshot, for every X the
 *          engine is capable of leaking.
 *
 * @details The engine could not answer that question. Entity count it had;
 *          everything else a long session accumulates — GL objects, listeners,
 *          physics bodies, cache entries, both heaps — was reachable only by
 *          reading a private field of whichever class happened to own it, if at
 *          all. So the failure that actually ends an editor session ("Play/Stop
 *          forty times and it starts to crawl") had no instrument pointed at it,
 *          and every leak we ever fixed was found by someone noticing.
 *
 *          This is that instrument. Subsystems register probes; a census reads
 *          them all into one flat set of named counters that a churn test can
 *          take before and after, and a human can read.
 *
 *          THE TIER IS THE DESIGN. The obvious assertion — every counter returns
 *          to its baseline — is wrong often enough to be useless, and a soak test
 *          that cries wolf gets deleted within the month. A texture cache holding
 *          refCount==0 entries for revival is doing its job; a transient buffer
 *          pool that grew to its high-water mark and stayed there is doing its
 *          job; a JS heap is not under anyone's control at all. Only some
 *          counters obey a conservation law, so only those are asserted as one:
 *
 *            conserved — spawn/destroy is a round trip. Must be IDENTICAL across
 *                        cycles. Entities, bodies, listeners, live GL objects.
 *            bounded   — may plateau above baseline, must not grow per cycle.
 *                        Pools and caches. Judged on slope, never on value.
 *            trend     — noisy and allocator-dependent. Heaps. Judged on slope
 *                        against a stated per-cycle budget.
 *            info      — recorded to explain a failure, never asserted.
 *
 *          Slope rather than value is also what makes the test cheap: a leak is a
 *          positive slope from cycle one, so fifty cycles prove what ten thousand
 *          would, and the projection in the report says what those ten thousand
 *          would have cost.
 */

/** Registered probe ids, for diagnosing a census that came back thinner than expected. */
declare function censusProbeIds(): string[];
/** Read every registered probe into one snapshot. */
declare function takeCensus(ctx?: CensusContext): Census;
/**
 * Settle the JS heap before a census, if the host allows it. True when a
 * collection ran; without one the heap only climbs between samples, so the heap
 * counters downgrade themselves to `info`. Node needs `--expose-gc`.
 */
declare function collectGarbage(): boolean;
interface CensusDelta {
    readonly key: string;
    readonly tier: CensusTier;
    readonly unit: CensusEntry['unit'];
    readonly before: number;
    readonly after: number;
    readonly delta: number;
}
/**
 * What moved between two snapshots. A counter present on only one side is
 * reported with the missing half as 0: a probe that appeared or vanished
 * mid-run is a real difference, not a reason to skip the row.
 */
declare function diffCensus(before: Census, after: Census): CensusDelta[];
interface CensusSeriesOptions {
    /**
     * Cycles to discard before judging. A first pass legitimately allocates for
     * good — lazy component registration, a shader compiled on first use, a pool
     * reaching working size — and judging that would fail every run.
     * Defaults to the larger of 3 and a fifth of the samples.
     */
    warmupCycles?: number;
    /**
     * Cycle count the projection reports against — "at this rate, N cycles costs
     * this much". Does not affect the verdict.
     */
    projectCycles?: number;
    /** Per-cycle growth a `bounded` counter may show before it reads as a leak. */
    boundedSlopeTolerance?: number;
    /**
     * Per-cycle byte growth a `trend` counter (a heap) may show.
     *
     * The default is a DETECTION FLOOR, not a taste — below ~16 KB the number
     * is V8 sizing its heap, not the engine keeping anything (measurements in
     * docs/REARCH_RELIABILITY_SOAK.md). Exact counters do the fine-grained job.
     */
    trendByteBudgetPerCycle?: number;
}
interface CensusVerdict {
    readonly key: string;
    readonly tier: CensusTier;
    readonly unit: CensusEntry['unit'];
    readonly leaking: boolean;
    /** Least-squares growth per cycle over the judged samples. */
    readonly slopePerCycle: number;
    /**
     * The growth the samples actually support — the slope pulled back by twice
     * its standard error. This, not the point estimate, is what is judged.
     */
    readonly confidentSlopePerCycle: number;
    /**
     * Share of cycles on which the counter rose. Near 1 is a leak; near 0 with a
     * positive slope is a pool that stepped once and the fit read as a ramp.
     */
    readonly risingFraction: number;
    readonly first: number;
    readonly last: number;
    /** confidentSlopePerCycle × projectCycles — what this costs over a session. */
    readonly projected: number;
    /** Populated when `leaking`; the sentence a failure should print. */
    readonly reason?: string;
}
interface CensusReport {
    readonly cycles: number;
    readonly judgedFrom: number;
    readonly projectCycles: number;
    readonly verdicts: readonly CensusVerdict[];
    readonly leaks: readonly CensusVerdict[];
    readonly failedProbes: readonly string[];
}
/**
 * Judge a run: one census per cycle, in order. Tiers share the fitted slope,
 * differing only in how much of one they may have.
 *
 * Conserved counters are also checked for VARIANCE: one that spiked and came
 * back means a cycle cleans up late, which the slope alone reads as steady.
 */
declare function analyzeCensusSeries(samples: readonly Census[], opts?: CensusSeriesOptions): CensusReport;
/** Two snapshots, as a table. Rows that did not move are omitted unless `all`. */
declare function formatCensusDiff(before: Census, after: Census, all?: boolean): string;
/**
 * A run, as the failure message it should print.
 *
 * Leaks lead; the rest follows as context, because the counter that did NOT move
 * is half the diagnosis — entities conserved while GL textures climb says the
 * scene tore down and the renderer did not.
 */
declare function formatCensusReport(report: CensusReport): string;

/**
 * @file  sceneOptionals.ts — the optional subsystems a scene load reaches, held
 *        behind a seam so the loader does not name them.
 *
 * `runtimeLoader` is in every package, so a subsystem it imports by value is in
 * every package too — 110KB of Spine and DragonBones in a project with neither,
 * measured on examples/hello-world. Every use of them here is already behind a
 * test (`discovered.spines.length > 0`), so the code was never RUN; it was only
 * ever shipped.
 *
 * The signatures are `Parameters<typeof …>` rather than spelled out: this is a
 * seam over the real functions, and a seam that restates their arguments is the
 * second declaration that drifts.
 */

/**
 * Which optional subsystems this BUILD ships, as the seam itself answers it.
 *
 * Exported because the only honest test of that question reads the shipped
 * bundle rather than the source. Every registration here is reached from an
 * entry, and an entry is the one thing a bundler is told to keep — but what the
 * entry reaches was dropped once already, and the SDK's own suite could not see
 * it: it imports `src`, where the wiring was never in doubt.
 *
 * Diagnostic, not a switch. A scene that needs a subsystem this build does not
 * ship already says so in the log; this is how a report can say it too.
 */
declare function shippedOptionalSubsystems(): string[];

/**
 * @file    glDebug.ts
 * @brief   GL error checking API for debugging rendering issues
 */

declare function shutdownGLDebugAPI(): void;
declare const GLDebug: {
    enable(): void;
    disable(): void;
    check(context: string): number;
    diagnose(): void;
};

declare function setWasmErrorHandler(handler: WasmErrorHandler | null): void;

type StatsPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
declare class StatsOverlay {
    private el_;
    private visible_;
    private disposed_;
    private lastUpdateTime_;
    private lastStats_;
    private accumulatedTimings_;
    constructor(container: HTMLElement, position?: StatsPosition);
    update(stats: FrameStats): void;
    show(): void;
    hide(): void;
    dispose(): void;
    private accumulateTimings_;
    private render_;
}

interface FrameStats {
    fps: number;
    frameTimeMs: number;
    entityCount: number;
    systemTimings: Map<string, number>;
    phaseTimings: Map<string, number>;
    drawCalls: number;
    /** Every draw the GPU was asked for, every pass included (see `RenderStats.gpuDraws`). */
    gpuDraws: number;
    /** The draw call budget of the quality level in force; 0 when the app has no quality controller. */
    drawCallBudget: number;
    triangles: number;
    sprites: number;
    text: number;
    skeletal: number;
    meshes: number;
    culled: number;
}
declare function defaultFrameStats(): FrameStats;
declare const Stats: ResourceDef<FrameStats>;
interface FrameSnapshot {
    frameTimeMs: number;
    phaseTimings: Map<string, number>;
    systemTimings: Map<string, number>;
}
declare class FrameHistory {
    private readonly capacity_;
    private buffer_;
    private cursor_;
    private count_;
    constructor(capacity?: number);
    get count(): number;
    push(frameTimeMs: number, phaseTimings: Map<string, number>, systemTimings?: Map<string, number>): void;
    getLatest(): FrameSnapshot | null;
    getAll(): FrameSnapshot[];
    reset(): void;
}
declare class StatsCollector {
    private deltas_;
    private cursor_;
    private count_;
    private sum_;
    pushFrame(deltaSeconds: number): void;
    getFps(): number;
    getFrameTimeMs(): number;
    reset(): void;
}
interface StatsPluginOptions {
    overlay?: boolean;
    position?: StatsPosition;
    container?: HTMLElement;
}
declare class StatsPlugin implements Plugin {
    readonly name = "stats";
    private collector_;
    private overlay_;
    private options_;
    constructor(options?: StatsPluginOptions);
    build(app: App): void;
    cleanup(): void;
}
declare const statsPlugin: StatsPlugin;

/**
 * @file    profileCapture.ts — recorded frames as a portable document.
 */

/** Bumped when a reader can no longer make sense of an older file. */
declare const PROFILE_CAPTURE_VERSION = 1;
/** Where a capture came from. Every field optional: a bare App knows none of it. */
interface CaptureSource {
    /** 'edit' / 'play' in the editor; a shipped build names its platform. */
    realm?: string;
    engineVersion?: string;
    platform?: string;
    gpu?: string;
    /** Free-form: device model, build id, the scene under test. */
    label?: string;
}
/**
 * One frame, in the terms the profile model reads. Deliberately the same
 * vocabulary a live frame is measured in, so a capture needs no translation
 * and no reader can drift from what the panel shows.
 */
interface CapturedFrame {
    quality?: QualityReport;
    id: number;
    dtMs: number;
    systems: SystemCost[];
    scopes: ScopeCost[];
    /** Scopes measured inside wasm. */
    nativeScopes?: ScopeCost[];
    /** -1 when no GPU timer answered. */
    gpuMs?: number;
    counters?: Record<string, number>;
    drawCalls?: number;
    triangles?: number;
    entities?: number;
    memory?: {
        wasmBytes?: number;
        jsHeapBytes?: number;
        vramBytes?: number;
        /** Decoded audio resident, the clips streamed instead, and the PCM that saved (estimate). */
        audioBytes?: number;
        audioStreamedCount?: number;
        audioStreamedSavedBytes?: number;
    };
    /** Editor-only. Absent from anything a shipped game records. */
    editor?: {
        ms: number;
        phases: Record<string, number>;
        /** Brackets INSIDE a phase above, already counted by it. Optional: a
         *  capture written before they existed simply has none. */
        parts?: Record<string, number>;
    };
}
interface ProfileCapture {
    version: number;
    generatedAt: string;
    source: CaptureSource;
    /** The frame budget the capture was judged against (ms). */
    budgetMs: number;
    frames: CapturedFrame[];
    /** Main-thread long tasks, for correlating a spike the frames cannot explain. */
    longTasks?: Array<{
        startMs: number;
        ms: number;
        name: string;
    }>;
}
/** What a set of frames came to. The one summary every reader shows. */
interface CaptureSummary {
    frames: number;
    budgetMs: number;
    fps: number;
    p50: number;
    p95: number;
    p99: number;
    /** Frames over the budget by half again — a visible stutter. */
    longFrames: number;
    worstFrameMs: number;
    worstFrameId: number | null;
    /** The window's cost, per frame. */
    mean: FrameProfile;
    drawCalls: number;
    triangles: number;
    entities: number;
    /** Named counters, averaged per frame. */
    counters: Record<string, number>;
}
/** p-th percentile (0..100) of an unsorted sample; 0 for an empty set. */
declare function percentile(values: readonly number[], p: number): number;
/** Fold one captured frame into its cost tree. */
declare function frameProfileOf(frame: CapturedFrame): FrameProfile;
/**
 * Summarize frames the way every reader wants them: the live window an agent
 * asks for, an imported file, and a report a shipped build hands back all go
 * through here, so none of them can compute a different fps from the same frames.
 */
declare function summarizeFrames(frames: readonly CapturedFrame[], budgetMs?: number): CaptureSummary;
declare function summarizeCapture(capture: ProfileCapture): CaptureSummary;
/**
 * Read a capture from JSON, or say what is wrong with it. Returns a refusal
 * rather than throwing so a UI can show the reason: a file picked by hand is
 * the one input guaranteed to sometimes be the wrong file.
 */
declare function parseProfileCapture(text: string): {
    capture: ProfileCapture;
} | {
    error: string;
};

/**
 * @file    profileRecorder.ts — a shipped game recording its own frames.
 */

interface ProfileRecorderOptions {
    /** Use already enabled timings without changing their instrumentation switches. */
    instrumentation?: 'enable' | 'existing';
    /** Frames kept before the oldest is dropped. 1800 is ~30s at 60Hz. */
    maxFrames?: number;
    /** The budget a reader judges the capture against. Defaults to 60Hz. */
    budgetMs?: number;
    /** Device, build, scene — whatever makes a capture identifiable later. */
    source?: CaptureSource;
}
/**
 * Records frames into a capture the game can hand anywhere. Measures nothing of
 * its own, so a capture cannot disagree with the profiler panel; and chooses no
 * destination — `take()` returns an object, the engine opens no socket.
 */
declare class ProfileRecorder {
    private readonly app_;
    private readonly options_;
    private readonly frames_;
    private recording_;
    private detach_;
    private seq_;
    constructor(app: App, options?: ProfileRecorderOptions);
    get recording(): boolean;
    get frameCount(): number;
    /**
     * Begin recording, turning on the instrumentation it reads — both sides of
     * it, since the C++ scopes are behind their own switch and a capture missing
     * them looks like an engine that costs nothing rather than one not measured.
     */
    start(): void;
    /** Stop recording and put the engine's own profiling back down. */
    stop(): void;
    /** Throw away what has been recorded, keeping the recorder running. */
    clear(): void;
    /**
     * The capture so far. Recording may continue; the frames are copied out, so
     * the returned document does not change under a reader.
     */
    take(): ProfileCapture;
    private capture_;
}
/**
 * Installs a {@link ProfileRecorder} and hands it to the game. Recording is NOT
 * started: a shipped build pays for the instrumentation only from the moment
 * something asks it to.
 */
declare class ProfileRecorderPlugin implements Plugin {
    private readonly options_;
    private readonly onReady_?;
    readonly name = "profileRecorder";
    readonly profileDomain = "diagnostics";
    private recorder_;
    constructor(options_?: ProfileRecorderOptions, onReady_?: ((recorder: ProfileRecorder) => void) | undefined);
    /** The recorder, once the plugin has been built into an App. */
    get recorder(): ProfileRecorder | null;
    build(app: App): void;
    cleanup(): void;
}

declare class TimerHandle {
    private readonly manager_;
    private readonly id_;
    constructor(manager: TimerManager, id: number);
    get id(): number;
    get isActive(): boolean;
    get elapsed(): number;
    get repeatCount(): number;
    pause(): this;
    resume(): this;
    cancel(): void;
    reset(): this;
}
declare class TimerManager {
    private nextId_;
    private readonly timers_;
    private timeScale_;
    delay(seconds: number, callback: (timer: TimerHandle) => void): TimerHandle;
    interval(seconds: number, callback: (timer: TimerHandle) => void, maxRepeat?: number): TimerHandle;
    private addTimer_;
    has(id: number): boolean;
    getElapsed(id: number): number;
    getRepeatCount(id: number): number;
    pause(id: number): void;
    resume(id: number): void;
    cancel(id: number): void;
    reset(id: number): void;
    cancelAll(): void;
    get activeCount(): number;
    get timeScale(): number;
    set timeScale(v: number);
    tick(dt: number): void;
}
declare const TimerRes: ResourceDef<TimerManager>;
declare const timerPlugin: Plugin;

declare const velocitySystem: SystemDef;
declare const velocityPlugin: Plugin;

type LifecycleEvent = 'show' | 'hide' | 'pause' | 'resume';
type LifecycleListener = (event: LifecycleEvent) => void;
declare class LifecycleManager {
    private listeners_;
    private visible_;
    private focused_;
    private autoPause_;
    constructor(autoPause?: boolean);
    get visible(): boolean;
    get focused(): boolean;
    get autoPause(): boolean;
    set autoPause(v: boolean);
    on(listener: LifecycleListener): () => void;
    off(listener: LifecycleListener): void;
    /** @internal */
    setVisible_(v: boolean): void;
    /** @internal */
    setFocused_(v: boolean): void;
    /** @internal */
    emit_(event: LifecycleEvent): void;
    removeAllListeners(): void;
}
declare const Lifecycle: ResourceDef<LifecycleManager>;
interface LifecyclePluginOptions {
    autoPause?: boolean;
}
declare class LifecyclePlugin implements Plugin {
    private readonly options_?;
    name: string;
    private cleanupFn_;
    constructor(options_?: LifecyclePluginOptions | undefined);
    build(app: App): void;
    cleanup(): void;
}
/** Default-config instance; `new LifecyclePlugin({ autoPause })` to configure. */
declare const lifecyclePlugin: LifecyclePlugin;

/**
 * @file    fetchHost.ts
 * @brief   The web/editor transport: fetch a side module's `<file>.js` glue and
 *          `<file>.wasm` from a base URL (the directory esengine.wasm is served
 *          from) and instantiate it. Used by the editor edit/play realms and the
 *          exported web/desktop game — anywhere the artifacts sit next to the
 *          engine and can be fetched. The glue text is fetched (not bare-imported)
 *          so privileged custom schemes (`estella://`, `game://`) that refuse
 *          cross-origin module imports still work.
 */

declare function createFetchSideModuleHost(baseUrl: string): SideModuleHost;

/**
 * @file    embeddedHost.ts
 * @brief   The single-file (playable-ad) transport: every needed side module's
 *          glue + wasm is inlined by the exporter, so nothing is fetched (ad
 *          networks require a self-contained .html). The exporter decides *which*
 *          modules to embed from a content scan of the scene, so an embedded
 *          registry that lacks a module the scene needs is an export bug, not a
 *          silent runtime degrade.
 *
 *          Bytes arrive DECODED: how they survived the trip inside an HTML file
 *          is the host page's business, and naming an encoding here would put
 *          one page's transport decision in the SDK.
 */

interface EmbeddedSideModuleEntry {
    /** The emscripten `<file>.js` glue, as source text. */
    glue: string;
    /** The `<file>.wasm` binary. */
    wasm: Uint8Array;
}
/** Inlined by the playable exporter as a window global, keyed by {@link SideModuleId}. */
type EmbeddedSideModuleRegistry = Partial<Record<SideModuleId, EmbeddedSideModuleEntry>>;
declare function createEmbeddedSideModuleHost(registry: EmbeddedSideModuleRegistry): SideModuleHost;

/** id → the emscripten factory `require('./wasm/<file>.js')` returned. */
type MiniGameSideModuleFactories = Partial<Record<SideModuleId, EmscriptenFactory>>;
/**
 * `binarySuffix` is what the EXPORT staged, not what this guesses: a host whose
 * loader takes `.wasm.br` gets a package with only the compressed binary in it,
 * and a loader that appended `.wasm` itself would name a file that is not there.
 */
declare function createMiniGameSideModuleHost(factories: MiniGameSideModuleFactories, binarySuffix?: string): SideModuleHost;

/**
 * @file    worldUnits.ts
 * @brief   What one world unit is, and the defaults that follow it.
 *
 * @details A 3D project says how many world units make a metre (Project Settings → Physics → 3D, `world3d.unitsPerMeter`):
 *          100 — a unit is a centimetre — unless it says otherwise, and 1 for a scene in metres such as an imported glTF.
 *          Every default that is a length, a speed or an acceleration is written once, at that reference of 100 a metre,
 *          and is scaled by the project's own: a character controller is a 1.6 m person, a first-person walk 3.2 m/s and a
 *          particle half a metre across in either kind of project. Before, those defaults were written in whichever unit
 *          their author had in mind — the character's in metres under a solver that reads centimetres, a 3 mm capsule; the
 *          first person's in centimetres in a metre scene, a 3.2 km/s walk.
 *
 *          A value a scene states is never scaled: only what a default fills in is.
 */
/** The scale every world-unit default is written at: 100 units a metre, a unit a centimetre. */
declare const REFERENCE_UNITS_PER_METER = 100;
/**
 * Set the project's units per metre. Called before a scene loads (by the runtime from the project's config, by the
 * editor when a project opens or the setting changes), so the defaults it fills in are the project's.
 */
declare function setWorldUnitsPerMeter(value: number): void;
/** The project's units per metre. */
declare function worldUnitsPerMeter(): number;
/** What a reference-scale default is multiplied by: 1 in a centimetre project, 0.01 in a metre one. */
declare function worldUnitScale(): number;

/**
 * @file    playableRuntime.ts
 * @brief   Playable ad runtime initialization (single-HTML builds)
 *
 * @details Side modules (physics, spine) are NOT wired here: the host page builds
 *          an {@link createEmbeddedSideModuleHost} from the exporter-inlined
 *          base64 registry and hands it to `createWebApp`, so physics and spine
 *          self-gate off `app.sideModules` exactly as in every other realm. This
 *          entry only owns the embedded asset source + the runtime boot.
 */

interface PlayableRuntimeConfig {
    app: App;
    module: ESEngineModule;
    canvas: HTMLCanvasElement;
    assets: Record<string, string>;
    /**
     * Logical (source) path → embedded-asset key (`@uuid:<id>`), so path-style
     * refs (a scene's "assets/x.esmaterial", a material's rewritten logical
     * refs) resolve to the inlined data. Applied as in-memory ALIASES onto the
     * assets map — every channel (fetch, image decode, audio) reads that one
     * map, and aliases share the data-URL strings (no payload duplication).
     */
    assetPathMap?: Record<string, string>;
    scenes: Array<{
        name: string;
        data: SceneData;
    }>;
    firstScene: string;
    /** Install physics even when the scene shows no bodies — a project that
     *  spawns them from script (Project Settings → Physics → Enabled). */
    physicsEnabled?: boolean;
    /** The physics world the project declared: gravity, solver, collision matrix.
     *  The FULL config, not a three-field subset: a collision matrix that reached
     *  Play and not a shipped build is a game that only collides in rehearsal. */
    physicsConfig?: Physics2DPluginConfig;
    /** The 3D physics backend the project chose; absent ⇒ Jolt. */
    physics3dBackend?: Physics3DBackend;
    /** The project's 3D world: scene units per metre and gravity (Project Settings → Physics → 3D). Absent ⇒ centimetre units, Earth gravity. */
    physics3dWorld?: Partial<Physics3DWorldConfig>;
    /** Project-declared UI theme; 'light' re-skins ThemeStyle-tagged widgets at boot. */
    uiTheme?: 'dark' | 'light';
    /** Project-declared theme token overrides (partial re-skin over the base). */
    uiThemeOverrides?: ThemeOverrides;
    /** Project-declared mixer state (bus volumes / effects / duck rules). */
    audioConfig?: AudioProjectConfig;
    /** The project's runtime tuning (Project Settings → Game → Runtime). */
    runtime?: RuntimeBuildConfig;
    /** Bitmask of render layers (0..31) that y-sort within the layer (Project Settings → Rendering). */
    ySortLayers?: number;
    /** Bitmask of render layers (0..31) that resolve by real depth (2.5D). */
    depthLayers?: number;
    manifest?: AddressableManifest | null;
}
declare function initPlayableRuntime(config: PlayableRuntimeConfig): Promise<void>;

/**
 * @file  The one call a playable ad's game code makes when the player takes the
 *        call to action, and the seam that keeps the ad network out of that code.
 *
 *        Every network wants a different function for "the player clicked through"
 *        — Meta wants `FbPlayableAd.onCTAClick()`, the mraid family wants
 *        `mraid.open(url)`, and each new one wants its own. None of them can be
 *        called directly from a game that also ships to the web, so the export
 *        injects a bridge (see the desktop `PlayableAdProfile`) and this function
 *        dispatches through it. A build with no network selected has no bridge and
 *        this is a no-op — the game is playable, the click just goes nowhere.
 *
 *        Deliberately its own module: importing a CTA call must not drag the whole
 *        playable runtime into a web build.
 */
/** What the exported page installs on `globalThis` — one method per interaction. */
interface PlayableAdBridge {
    /** Hand the player off to the store, the way THIS network spells it. */
    cta?(url?: string): void;
    ready?(): void;
    gameEnd?(): void;
    retry?(): void;
    onActive?(listener: (active: boolean) => void): () => void;
}
/**
 * Dispatch a user-gesture store click through the selected network.
 * MRAID accepts an explicit store URL; other hosts select their own destination.
 * Without a bridge, the scene remains playable and reports missing configuration.
 */
declare function playableCta(url?: string): void;
/** Whether an ad-network bridge is installed — for a game that wants to hide its
 *  store button when there is nowhere to send the player. */
declare function hasPlayableCta(): boolean;
/** Notify the ad container when the game reaches a win or loss. */
declare function playableGameEnd(): void;
/** Notify the ad container when the player explicitly restarts the game. */
declare function playableRetry(): void;

/**
 * @file    playRealmRuntime.ts
 * @brief   Editor play-realm runtime entry — the SAME shipping runtime
 *          (`initRuntime`) the playable/wechat paths use, but driven from a live
 *          scene SNAPSHOT + a uuid→url asset manifest fetched over the realm
 *          origin. So what the editor "plays" is literally the shipping runtime
 *          (play == ship). Mirrors {@link initPlayableRuntime} minus the
 *          base64/embedded asset packing.
 *
 *          Builtin components/systems run as-is. Project-defined components/systems
 *          are already registered by the time this runs: the host imports the project
 *          bundle (esengine external + import map → the shared instance) BEFORE booting,
 *          so its defineComponent/defineSystem populate the registry this drains. This
 *          entry only owns the runtime + snapshot + asset fetch.
 */

interface PlayRealmRuntimeConfig {
    app: App;
    module: ESEngineModule;
    canvas: HTMLCanvasElement;
    /** The current scene as RAW (`@uuid:`) SceneData — handles are realm-local. */
    sceneData: SceneData;
    /** Where the host keeps this realm's textures compressed (RuntimeAssetSource). */
    compressedTexture?: RuntimeAssetSource['compressedTexture'];
    /** Additional switchable scenes beyond the entry (SceneManager targets).
     *  `path` entries load lazily through the runtime Assets on first switch. */
    extraScenes?: Array<{
        name: string;
        data?: SceneData;
        path?: string;
    }>;
    /** SceneManager name of the entry `sceneData` (default '__play'). Shipped
     *  builds pass the real scene name so game code can switch back to it. */
    entrySceneName?: string;
    /** Lowercased uuid → fetchable URL (e.g. `estella://project/<path>`). */
    assetManifest: Record<string, string>;
    /**
     * Logical (source) path → fetchable staged path, for cooked builds whose
     * content-addressed staging renamed the physical files. Path-style refs
     * (a scene's "assets/x.esmaterial") resolve through this BEFORE extension
     * sniffing, exactly like uuid refs — so a .png staged as .ktx2 transcodes.
     * Omit when files are served at their logical paths (the editor realm).
     */
    assetPathMap?: Record<string, string>;
    /**
     * Logical path → build-path catalog for the same cooked case: loaders fetch
     * their INNER text refs (a material's shader) through Catalog.getBuildPath,
     * which is identity without this. Omit alongside assetPathMap.
     */
    catalogData?: CatalogData | null;
    manifest?: AddressableManifest | null;
    /** CDN root `remote`-group assets resolve against — turns on hot-update delivery. */
    remoteRoot?: string;
    /** Storage key an applied hot-update persists under; boot restores it if present. */
    persistUpdateKey?: string;
    /** Base URL the engine side-modules (physics.wasm, …) are served from — same
     *  dir as esengine.wasm. When set, the realm can load physics on demand. */
    wasmBaseUrl?: string;
    /** Project-root URL for path-addressed runtime assets. Textures resolve
     *  through the uuid manifest, but the audio channel takes plain project-relative
     *  paths (`audio.playSFX('assets/…')`), so it needs this base to fetch from the
     *  project rather than the play-realm subdir. */
    assetBaseUrl?: string;
    /** Project-declared physics enable (`.uproject` features analog) — installs
     *  physics even for runtime-spawned bodies the static scene doesn't show. */
    physicsEnabled?: boolean;
    /** Project-declared physics world config (gravity, solver tuning, collision-layer
     *  masks, sleep/continuous) from the editor's Project Settings. */
    physicsConfig?: Physics2DPluginConfig;
    /** The 3D physics backend the project chose; absent ⇒ Jolt. */
    physics3dBackend?: Physics3DBackend;
    /** The project's 3D world: scene units per metre and gravity (Project Settings → Physics → 3D). Absent ⇒ centimetre units, Earth gravity. */
    physics3dWorld?: Partial<Physics3DWorldConfig>;
    /** Project-declared UI theme; 'light' re-skins ThemeStyle-tagged widgets at boot. */
    uiTheme?: 'dark' | 'light';
    /** Project-declared theme token overrides (partial re-skin over the base). */
    uiThemeOverrides?: ThemeOverrides;
    /** Project-declared mixer state (bus volumes / effects / duck rules). */
    audioConfig?: AudioProjectConfig;
    /** The project's runtime tuning (Project Settings → Game → Runtime), so Play runs under what ships. */
    runtime?: RuntimeBuildConfig;
    /** The project's declared achievement ids — Play checks an unlock against the
     *  same set a shipped build does, so a typo is found here. */
    achievements?: string[];
    /** Turn on per-phase / per-system frame timing (editor profiler; off in shipped games). */
    enableStats?: boolean;
}
/**
 * Boot the shipping runtime against a single in-memory scene snapshot. The host
 * page has already created `app` (createWebApp) + bound a GL context; here we
 * register the snapshot as the sole scene, wire a fetch-backed source, and run.
 */
declare function initPlayRealmRuntime(config: PlayRealmRuntimeConfig): Promise<void>;

declare const corePlugin: Plugin;
declare const DEFAULT_UI_CAMERA_INFO: {
    readonly viewProjection: Float32Array<ArrayBuffer>;
    readonly vpX: 0;
    readonly vpY: 0;
    readonly vpW: 0;
    readonly vpH: 0;
    readonly screenW: 0;
    readonly screenH: 0;
    readonly worldLeft: 0;
    readonly worldBottom: 0;
    readonly worldRight: 0;
    readonly worldTop: 0;
    readonly worldMouseX: 0;
    readonly worldMouseY: 0;
    readonly valid: false;
    readonly revision: 0;
};

/** Requests requiring a player gesture must be called from the host event itself. */
declare const Device: {
    capabilities: () => DeviceCapabilities;
    state: () => DeviceState;
    /** The battery and the processor's heat as far as the platform has said (a null is a thing it does not say). */
    power: () => PowerState;
    motion: {
        start: (options?: MotionOptions) => Promise<DeviceResult>;
        stop: () => Promise<DeviceResult>;
        onChange: (handler: (sample: MotionSample) => void) => () => void;
    };
    vibrate: (options?: VibrationOptions) => Promise<DeviceResult>;
    keepScreenOn: (enabled: boolean) => Promise<DeviceResult>;
    fullscreen: (enabled: boolean, target?: unknown) => Promise<DeviceResult>;
    pointerLock: (enabled: boolean, target?: unknown) => Promise<DeviceResult>;
    onChange: (handler: (state: DeviceState) => void) => () => void;
    dispose: () => void;
};

interface CreateWebAppOptions extends WebAppOptions {
    /**
     * Convenience for the fetch realms (editor / web / desktop): the base URL the
     * side-module artifacts (physics.wasm, spine38.js/.wasm, …) are served from —
     * usually the same directory as esengine.wasm. Builds a fetch {@link SideModuleHost}
     * when no explicit `sideModules` is given. Realms that inline their modules
     * (playable / WeChat) pass `sideModules` directly instead.
     */
    wasmBaseUrl?: string;
}
declare function createWebApp(module: ESEngineModule, options?: CreateWebAppOptions): App;
interface HeadlessAppOptions {
    plugins?: Plugin[];
    /** Optional-native-module acquirer (physics on the server). */
    sideModules?: SideModuleHost;
}
/** The simulation stack with no presentation: timers/lifecycle, gameplay AI, audio
 *  (silent on a host with no device) and replication. Presentation plugins exist to
 *  be seen, so a headless app leaves them out — see pluginSets.ts. */
declare const headlessBasePlugins: () => Plugin[];
/**
 * An App with the full simulation stack and no presentation: no renderer, no
 * render pipeline, no input device, no UI. This is the authoritative-server
 * shape (same wasm module, same gameplay code, same fixed-tick loop) — also
 * useful for workers and tests. Drive it with {@link runHeadless} or
 * `app.tick(dt)`.
 *
 * @beta Pre-1.0: the headless asset story (gameplay data without textures)
 * is still settling and may change this factory's options.
 */
declare function createHeadlessApp(module: ESEngineModule, options?: HeadlessAppOptions): App;
/**
 * Drive an app on a wall-clock interval (no requestAnimationFrame on a
 * server). Delta is measured, so the fixed-step accumulator keeps simulation
 * cadence exact across timer jitter. Returns a stop function.
 *
 * @beta Pre-1.0: paired with {@link createHeadlessApp}, evolves with it.
 */
declare function runHeadless(app: App, options?: {
    fps?: number;
}): () => void;

export { ANCHOR_AXES, ANIM_CLIP_FORMAT_VERSION, ASSET_GROUP_MODES, AddressableManifest, Ads, AdsAPI, AiParamValue, AlignContent, AlignItems, AnchorAxis, AnchorFlag, AnchorMode, AnimationPlugin, AnimatorClipMotion, AnimatorCondition, AnimatorControllerDef, AnimatorIK, AnimatorIKKind, AnimatorLayer, AnimatorMotion, AnimatorParam, AnimatorParamType, AnimatorRootMotion, AnimatorTransition, AnyComponentDef, AotManifest, App, AppContext, ArrayDataSource, AsyncCache, AttenuationModel, AudioAPI, AudioHandle, AudioListener, AudioLoadType, AudioPlugin, AudioPool, AudioSource, Axis1D, Axis2D, BAKE_DEFAULTS, BUILTIN_MESH_TEMPLATES, BUILTIN_UI_PREFABS, BUILTIN_UI_WIDGET_NAMES, Backend, BakedLighting, Bakes, BakesRes, BatchBreak, BlendCurve, BlendMode, BlobShadow, BodyType, BuiltinComponentDef, BundleMode, BusDuckRule, BusEffectDef, Button, CLIP_EPSILON, COMPOSITE_DEFAULTS, CameraBounds, CameraCommit, CameraDirector, CameraView, CameraViewAPI, CapturePass, Catalog, CatalogData, Color, CommandsInstance, ComponentData$1 as ComponentData, ComponentDef, ComponentMetadata, CompositeBatch, CompositeBatchPlugin, CompositeBatching, CompositeBatchingRes, ContentRectPlugin, CoverFade, CoverFadeTarget, DARK_TOKENS, DEBUG_CHANNEL_PROTOCOL, DEFAULT_ANIM_CLIP_PIVOT, DEFAULT_DESIGN_HEIGHT, DEFAULT_DESIGN_WIDTH, DEFAULT_EDITOR_GRID, DEFAULT_EDITOR_VIEW, DEFAULT_EDITOR_VIEW_LIGHTING, DEFAULT_EDITOR_VIEW_SHADING, DEFAULT_FACING_COSINE, DEFAULT_FALLBACK_DT, DEFAULT_FIXED_TIMESTEP, DEFAULT_FONT_FAMILY, DEFAULT_FONT_SIZE, DEFAULT_GRAVITY, DEFAULT_LINE_HEIGHT, DEFAULT_MAX_DELTA_TIME, DEFAULT_PHYSICS3D_WORLD, DEFAULT_PIXELS_PER_UNIT, DEFAULT_SPINE_SKIN, DEFAULT_SPRITE_SIZE, DEFAULT_TEXT_CANVAS_SIZE, DEFAULT_UI_CAMERA_INFO, DataType, DecalProjector, DeferredRecord, Device, DeviceCapabilities, DeviceLostReason, DeviceResult, DeviceState, DeviceStatus, Diagnostics, DiagnosticsAPI, DiagnosticsPlugin, DimensionUnit, DragPlugin, DragState, Draw, EDITOR_EXPOSURE_RANGE, EDITOR_UI_ANCHOR, EDITOR_VIEW_ENTITY, ENGINE_WEBGPU_FEATURES, EasingType, EditorGrid, EditorView, EditorViewLighting, EditorViewShading, EngineApi, Entity, EntityEventQueue, EntityEvents, EventBinding, EventBindingPlugin, ExploredGrid, FILL_AXIS, UIFillMethod as FillMethod, UIFillOrigin as FillOrigin, Filters, FlattenContext, FlattenResult, FlexContainer, FlexDirection, FlexWrap, FocusManager, FocusManagerState, FocusPlugin, Focusable, FogOfWar, FollowTarget, Footsteps, FrameCosts, FrameHistory, FrameProfile, GLDebug, GameSocket, Geometry, GestureDetector, GpAxis, GpButton, Graphics, GridLayoutProvider, IMPOSTOR_BAKE_LAYER, INTERACTION_CONTROLLER, INTERACTION_PAGES, Identity, IdentityAPI, ImpostorAtlases, ImpostorAtlasesRes, ImpostorData, ImpostorPlugin, InputMap, InputRouter, InputState, Interactable, JustifyContent, Key, Keys1D, Keys2D, KineticScroll, LIGHTMAP_RANGE, LIGHT_FORWARD, LIGHT_TOKENS, LayerOrder, Lifecycle, LifecycleManager, LifecyclePlugin, LinearLayoutProvider, ListView, LiveBindings, LocaleCatalog, LocalizationPlugin, LogLevel, Logger, LoopMode, ManifestModel, MaskMode, MaterialHandle, MeasuredLinearLayoutProvider, MeshChannelDesc, MeshData, MeshRendererAPI, MeshRendererData, MeshRendererGeometry, MeshRendererPlugin, MeshRenderers, MiniGameSocket, MotionDriver, MotionOptions, MotionSample, MouseButton, NODE_SPECS, NativeChannel, PREFAB_FORMAT_VERSION, PROFILE_CAPTURE_VERSION, PTR_LAYOUTS, ParsedTextureImportSettings, ParticlePlugin, Physics2DPluginConfig, Physics3DBackend, PhysicsWasmModule, PlatformAdapter, PlatformCanvas, PlatformImage, PlatformPaymentRequest, PlatformRequestOptions, PlatformResponse, PlatformScreenRecorder, PlatformShareOptions, PlatformSocket, PlatformSocketEvents, PlatformSocketOptions, PlatformSocketReadyState, PlatformVideoBackend, Playthrough, Plugin, PostProcessPlugin, PowerState, ComponentData as PrefabComponentData, PrefabData, PrefabEntityId, PrefabOverride, PrefabServer, Prefabs, PrefabsPlugin, PresentedCameraView, ProcessedEntity, ProfileRecorder, ProfileRecorderPlugin, Quality, QualityConfig, QualityController, QualityReport, Quat, REFERENCE_UNITS_PER_METER, RENAMED_COMPONENT_TYPES, RETIRED_COMPONENT_TYPES, RUNTIME_BUILD_DEFAULTS, RainShelter, RainUpright, RectAnchors, RenderStage, RenderTexture, RenderType, Renderer, ResourceDef, RuntimeAssetSource, RuntimeConfig, SH_BASIS_SCALE, SH_COSINE_BAND, SPRITE_MOTION, STATIC_BATCH_DEFAULTS, SWAY_PUSHERS, SafeArea, SafeAreaPlugin, SaveManager, SceneConfig, SceneData, SceneEntityData, SceneManagerState, SceneOrigins, SceneStreaming, SceneStreamingController, Schedule, ScopeCost, Scores, ScreenInfo, ScreenOrientation, ScreenOverlayData, ScrollContainer, ServicesPlugin, ShaderHandle, ShadowCaster2DData, SideModuleHost, SideModuleId, SightTarget, SightViewer, SkeletalPreview, SoundEventPlayback, SoundEventSelector, SoundEventSource, SoundEvents, SpineCullingRect, SpringBoneAPI, SpringBonePlugin, SpringBoneRes, SpriteAnimClip, SpriteData, SpriteFilter, StaticBatch, StaticBatchPlugin, StaticBatchState, StaticBatching, StaticBatchingRes, Stats, StatsCollector, StatsOverlay, StatsPlugin, StepKind, StepSurface, Stick, Storage, StreamPlane, StreamedWorld, SwayPusher, SystemCost, SystemDef, SystemTouches, TEXTURE_STREAMING_DEFAULTS, THEME_COLOR_ROLES, Text, TextAlign, TextInput, TextInputFilter, TextInputPlugin, TextOverflow, TextPlugin, TextRenderMode, TextVerticalAlign, TextureAtlas, TextureCanvas, TextureFilter, TextureStreaming, TextureStreamingPlugin, TextureStreamingRes, TextureWrap, ThemeStyle, TimeData, TimeDrive, TimerHandle, TimerManager, TimerRes, Trail, TrailAPI, TrailPlugin, Transaction, TransactionManager, TransformData, TreeViewModel, Tween, TweenAPI, TweenGroup, TweenHandle, TweenSequence, TweenState, TweenTarget, UICameraInfo, UIColorPicker, UIController, UIDialog, UIDropdown, EntityEventQueue as UIEventQueue, UIEventType, EntityEvents as UIEvents, UIGear, UIInteraction, UIInteractionPlugin, UILayoutGeneration, UILayoutPlugin, UIMask, UIMaskPlugin, UINode, UIPages, UIPlugin, UIRenderOrderPlugin, UISlider, UITabView, UIToggle, UIToggleGroup, UITooltip, UITreeView, UIVisibilityPlugin, UIVisual, UIVisualFit, UIVisualType, UIWorldAnchor, ValueTweenHandle, Vec2, Vec3$2 as Vec3, Vec4, VibrationOptions, Video, VideoAPI, VideoPlayer, VideoPlugin, VideoStreamHandle, VideoStreamOptions, Virtual, VirtualButton, VirtualJoystick, VirtualJoystickMode, WEATHER_CLEAR, WEATHER_MIST, WEATHER_NONE, WEATHER_OVERCAST, WEATHER_RAIN, WEATHER_SNOW, WEATHER_STORM, WORLD_DIR, WeChatSocket, WeatherDrive, WebAppOptions, World, WorldPersistent, WorldStreamer, WorldStreaming, WorldStreamingSource, acquireWebGPUDevice, activeRemoteRoot, addIK as addAnimatorIK, addLayer as addAnimatorLayer, addParam as addAnimatorParam, addState as addAnimatorState, addTransition as addAnimatorTransition, addNode, alignRectAnchorsNow, analyzeCensusSeries, anchorPresetFields, animClipCellRect, animClipCellUv, animClipDrivesPivot, animClipDrivesSize, animClipFramePivot, animClipFrameSize, animClipSheetCols, animClipSheetRows, animationPlugin, animatorEdges, applyAssetRefResolvers, applyAudioProjectConfig, applyBuildRuntimeConfig, applyDeltaToSource, applyOverrides, applyOverridesToSource, applyTabViewSelection, applyThemeToWorld, arrayDataSource, atlasLayout, attachTooltip, audioPlugin, auto, bakeDecalMesh, bakeFingerprint, bakeHoldsStill, bakeLightForward, bakeLightOf, bakeLightmap, bakeLightmapSteps, bakeRunner, bakesOf, bind, bindControllerPage, bindWidgetValue, blendWeather, blobAlpha, bucketOverridesByEntity, buildBlobMesh, buildPathGeometry, buildText, buildUINode, buildUIVisual, buildVariant, builtinMeshTemplate, calculateAttenuation, calculatePanning, cameraCommitChanged, cameraFrustumCorners, canCaptureFramePixels, canvasRootEntities, captureFrame, captureFramePixels, captureFrameReport, captureReflection, carriesEnvironment, catalogFromManifest, cellAt, cellDocumentPath, cellSquare, censusProbeIds, circlePoints, clearPath, clipToProjector, cloneComponentData, cloneComponents, cloneMetadata, closeDialog, closeDropdown, col, collapseEntry, collapseInstance, collectExternalEntityRefs, collectGarbage, collectNestedPrefabPaths, compareDrawRank, compileMaterialGraph, composeTRS, compositeBatchPlugin, computeEffectiveOrthoSize, computeStreaming, connect, contentHashHex, contentHashOf, contentRectPlugin, controllerState, convolveCosine, corePlugin, coveredGround, coversPoint, createAnimClip, createAnimClipFromTextures, createButton, createCanvasTexture, createColorPicker, createDialog, createDropdown, createEmbeddedSideModuleHost, createFetchSideModuleHost, createHeadlessApp, createListView, createMockAdProvider, createPackagedAssetSource, createProgress, createRuntimeSceneConfig, createScrollView, createSlider, createSocket, createTabView, createTakeover, createTextInput, createToggle, createTooltip, createTreeView, createVirtualButton, createVirtualJoystick, createMiniGameSideModuleHost as createWeChatSideModuleHost, createWebApp, cubicBezier, currentSightRings, currentTimeOfDay, currentWeather, cutWorld, debug, decodeImageBitmap, decodeImagePixels, decodeLightmap, decodeRgbm, defaultFrameStats, deferredEntities, deferredRecord, defineBehavior, defineInputMap, defineSkyEffect, derived, desiredResidency, detectAnchor, detectAnchorAxes, deviceGeneration, diagnosticsPlugin, diffAgainstSource, diffCensus, disconnect, discoverSceneAssets, distanceToCell, dragPlugin, drawBudgetReport, drynessOf, editorViewAxes, editorViewAxisAngles, editorViewBasis, editorViewBoxExtent, editorViewClipFar, editorViewClipNear, editorViewEye, editorViewGridPlane, editorViewHalfExtent, editorViewHalfHeight, editorViewIsOrbited, editorViewLightingArgs, editorViewLightingIsOverriding, editorViewShadingMode, editorViewStandoff, editorViewWorkPlane, editorViewWorldPerPixel, ellipseStripsOf, emptyAnimatorController, enableSceneOrigins, encodeLightmap, encodeRgbm, engineWebGPUFeatures, entityBoxCorners, entityBoxRayHit, entityWorldBox, error, evalIrradianceSH, eventBindingPlugin, exact, expandEntry, expandInstance, exploredFromString, exploredToString, extendPlatform, extractAnimClipTexturePaths, extractPrefab, extractSubgraph, fanDistances, fetchDecodePixels, findControllerOwner, fingerprint, finish, flatSky, flattenPrefab, flattenSubgraphs, focusPlugin, folderAlwaysInclude, folderGroupMode, footAt, formatCensusDiff, formatCensusReport, forwardConsole, frameDebugReport, frameProfileOf, frameStatsReport, fxPreviewOrPlayMode, gearBinding, getAllEffectDefs, getContextLossGuardInfo, getControllerPage, getDefaultContext, getDeviceIdentity, getDeviceLostReport, getDeviceStatus, getEffectDef, getEffectTypes, getLogger, getPlatform, getPlatformType, getTheme, glContextAttributes, hasPlayableCta, hasVisibility, headlessBasePlugins, imageBitmapOptions, impostorDecode, impostorEncode, impostorFrameDirection, impostorKindKey, impostorPictureUp, impostorPlugin, indexPackagedManifest, info, initPlayRealmRuntime, initPlayableRuntime, initRuntime, inputRouter, inspectFocusTraversal, inspectTextLayout, inspectableTypes, installEditorGrid, instantiatePrefab, interactionController, intersectRects, invertMatrix4, isAuto, isBuiltinMeshRef, isDialogOpen, isDropdownOpen, isEditor, isEntityActive, isEntityVisible, isFxEditPreview, isNative, isPlatformInitialized, isPlayMode, isPointerBlockedInTree, isPrefabEntry, isRuntime, isScreenEntity, isWeChat, isWeb, layerFrontness, layerOrderOf, lifecyclePlugin, lightAimOf, lightAimRotation, lightmapImage, loadInputMapAsset, loadPackagedAssetIndex, loadRuntimeScene, localizationPlugin, log, makeWidgetInteractable, manifestPlane, markThemed, maskRects, measureText, mergeGeometry, mergeMeshes, meshRendererPlugin, meshWorldBox, messageOf, migrateAnimatorController, migratePrefabData, migrateSaveData, modeToDelivery, moveLayer as moveAnimatorLayer, moveState as moveAnimatorState, moveEditorViewFocus, moveNode, nearestPushers, newMaterialGraph, newMaterialSubgraph, octDecode, octEncode, onCameraCommitChanged, onDeviceRestored, openDialog, openDropdown, packagedAppOptions, packagedRuntimeInit, panoramaDirection, panoramaUV, paramDefaultValue, parseAnimClipAsset, parseAnimClipData, parseAudioProjectConfig, parseProfileCapture, parseRichText, parseRuntimeBuildConfig, parseSoundEvent, parseThemeOverrides, particlePlugin, partitionWorld, pendingShaders, percent, percentile, persistentEntityRows, physics3DInstallConfig, physics3DPluginConfigOf, pickEntitiesByRay, placeOnScreen, planComposite, planStaticBatches, planStreaming, planarReflectionStatus, planeSecond, platformCanOpenData, platformCanPay, platformCanShare, platformCreateCanvas, platformDevicePixelRatio, platformFetch, platformFileExists, platformInstantiateWasm, platformOnShareRequest, platformOpenDataCanvas, platformOpenDataPostMessage, platformReadFile, platformReadTextFile, platformRequestPayment, platformScreenRecorder, platformSetCloudKeyValues, platformShare, playModeOnly, playableCta, playableGameEnd, playableRetry, pointInHitArea, pointInOBB, pointInWorldRect, postProcessPlugin, prefabRootOf, prefabsPlugin, prefilterOctahedral, preloadGlyphs, preloadNestedPrefabs, presentedCameraView, previewTooltip, probeRegistrations, projectIrradianceSH, projectorUV, px, q, quadraticBezier, quaternionToAngle2D, rankPickCandidates, rayPlaneHit, readFieldPath, rebuildChildren, receiverFromMesh, recordSceneOrigins, recoverDevice, reflectEsshader, refreshPlanarReflection, registerCensusProbe, registerEffect, registerPackagedSideModules, registerWeatherPreset, registryEntityFields, remapComponentEntityRefs, removeIK as removeAnimatorIK, removeLayer as removeAnimatorLayer, removeParam as removeAnimatorParam, removeState as removeAnimatorState, removeTransition as removeAnimatorTransition, removeNode, renameState as renameAnimatorState, renderCameraFrame, renderMeshPreview, renderOrigin, replayDraw, replayFrameDraw, reportDeviceLost, resetEditorViewLighting, resolveAssetGroup, resolveAtlas, resolveBindingTarget, resolvePrefabRoots, resolveThemeTokens, ringContains, rootLocalMatrix, runHeadless, safeAreaPlugin, samplePanorama, scalar, sceneAmbientLights, sceneEnvironment, sceneManagerPlugin, sceneOriginOf, sceneOriginsEnabled, sceneUses3DPhysics, sceneUsesI18n, sceneUsesPhysics, screenRay, screenToUiLayout, screenToUiWorld, screenToWorld, screenWorkAxes, seesPoint, segmentBlocked, serializeAnimClip, servicesPlugin, setConditions as setAnimatorConditions, setInitial as setAnimatorInitial, setStateClip as setAnimatorStateClip, setStateMotion as setAnimatorStateMotion, setStateProps as setAnimatorStateProps, setBlobShadowGround, setButtonState, setControllerPage, setDefaultContext, setEditorMode, setEditorViewHalfHeight, setEntityActive, setEntityVisible, setFxEditPreview, setLogLevel, setPath, setPlayMode, setRenderOriginStep, setSkyClockState, setTextureFilter, setTextureParams, setTextureSliceBorder, setTextureWrap, setTheme, setTimelineShot, setTreeViewData, setUIVisible, setViewTarget, setWasmErrorHandler, setWorldUnitsPerMeter, shBasis, shadersCompiled, shakeCamera, sheetCellCount, sheetCellRect, sheetCellUv, sheetCols, sheetRows, shelterMaskSizeOf, shippedOptionalSubsystems, shutdownDrawAPI, shutdownGLDebugAPI, shutdownGeometryAPI, shutdownRendererAPI, sightRingOf, signal, skyClockState, skyRadiance, spatialDistance, spawnUIEntity, springBonePlugin, spriteMotionDriver, stableEntityId, stackOf, stampLook, startDebugChannel, staticBatchKey, channelSignature as staticBatchLayout, layoutRefusal as staticBatchLayoutRefusal, staticBatchPlugin, statsPlugin, stepFade, stopSoundEventSource, streamTargetEdge, streamedBytes, studioPreviewReport, subgraphInputs, subgraphOutputType, subgraphRefs, summarizeCapture, summarizeFrames, sunPosition, surfaceAt, switchTheme, takeCensus, textInputPlugin, textPlugin, textureStreamingPlugin, themeButtonStates, themeColors, themeType, timeOfDayAt, timerPlugin, trailPlugin, transitionTo, translateAssetHandles, triggerSoundEventSource, uiHitAtScreen, uiHitTestWorld, uiInteractionPlugin, uiLayoutPlugin, uiLayoutRect, uiLayoutToScreen, uiMaskPlugin, uiNodeWorldBox, uiPickAllWorld, uiPickWorld, uiPlugin, uiPlugins, uiRenderOrderPlugin, uiVisibilityPlugin, uiWorldToScreen, uniformInUnits, unwrapLightmapUV, updateIK as updateAnimatorIK, updateLayer as updateAnimatorLayer, updateParam as updateAnimatorParam, updateTransition as updateAnimatorTransition, uprightOf, uprightRects, uvRectFromPixels, v2, v3, validateOverrides, validatePrefab, validateScene, validateSubgraph, velocityPlugin, velocitySystem, videoPlugin, warmShaders, warn, weatherPresetId, weatherPresetNames, widgetToPrefab, withActiveRemoteRoot, withFolderAlwaysInclude, withFolderGroup, worldAxisVector, worldManifestPath, worldResidencyPlugin, worldResidencyReport, worldResidencySystem, worldSnapshot, worldUnitScale, worldUnitsPerMeter, writeFieldPath };
export type { ActionDef, ActionType, AdProvider, AddedEntity, AmbientSkip, AnchorFields, AnchorPreset, AnimClipAssetData, AnimClipEventData, AnimClipFrameData, AnimClipPivotData, AnimClipSheetData, AnimClipSizing, AnimClipVec2, AnimatorEdge, AnimatorMigration, AnimatorRootMotionData, AssetGroupDef, AssetGroupMode, AssetGroupsConfig, AtlasDef, AtlasEntry, AudioBusDecl, AudioListenerData, AudioPluginConfig, AudioProjectConfig, AudioSourceData, AuthoredLight, BakeInputs, BakeJob, BakeLight, BakeLightContribution, BakeMobility, BakeOptions, BakeProgress, BakeResult, BakeScene, BakeStep, BakeSurface, BakedLightingData, BehaviorContext, BehaviorDef, BezierPoints, Binding, BlobShadowData, BlobShadowGround, BuildProfile, BuiltinMeshTemplate, ButtonHandle, ButtonOptions, ButtonStateVisual, CameraBoundsData, CameraCommitData, CameraCommitListener, CameraDirectorState, CameraExtents, CameraFields, CameraLens, CameraPOV, CameraTransformFields, CanvasScale, CanvasTexture, CaptureSource, CaptureSummary, CapturedFrame, CapturedPanorama, CellResidency, Census, CensusContext, CensusDelta, CensusEntry, CensusProbe, CensusReport, CensusSeriesOptions, CensusTier, CensusVerdict, ClipTriangle, ClipVertex, ColorPickerHandle, ColorPickerOptions, ColorRole, Completable, CompositeBatchData, CompositeChunk, CompositeInstanceSet, CompositeLimits, CompositePart, CompositePlan, ComputeEffectSource, ConsoleLevel, ControllerState, CoverFadeData, CreateListViewOptions, CreateWebAppOptions, CutWorld, DataSource, DataSourceChange, DebugChannelConfig, DebugChannelMessage, DebugChannelQuery, DebugControl, DecalBakeOptions, DecalProjectorData, DecalReceiver, DecodedPixels, DeviceIdentity, DeviceRestoredListener, DiagnosticEvent, DiagnosticKind, DiagnosticReport, DiagnosticsOptions, DiagnosticsPluginOptions, DiagnosticsSink, DialogHandle, DialogOptions, DiffOptions, Dimension, DocumentDiagnostic, DocumentDiagnosticSeverity, DocumentEntityId, DocumentNode, DragStateData, DrawAPI, DrawBudgetReport, DrawCallInfo, DrawPass, DrawPassShare, DrawRank, DropShadowFilterOptions, DropdownHandle, DropdownOptions, EditorBridge, EditorGridData, EditorLightingMode, EditorViewBasis, EditorViewData, EditorViewLightingData, EditorViewShadingData, EditorWorkPlane, EffectDef, EffectUniformDef, EmbeddedSideModuleEntry, EmbeddedSideModuleRegistry, EntityBox, EntityBoxOptions, EntityEvent, EntityEventHandler, EntityEventObservation, EntityPickOptions, EnvironmentLightEntity, EventBindingData, EventBindingRow, ExternalEntityRef, ExtractEntity, FlexContainerData, FocusInspectionWorld, FocusSkipReason, FocusTraversalEntry, FocusTraversalInspection, FocusableData, FogOfWarData, FollowTargetData, FootstepsData, FrameAssetNames, FrameCaptureData, FrameDebugReport, FramePixels, FrameReplayImage, FrameSnapshot, FrameStats, FrameStatsReport, GameSocketOptions, GearBinding, GearTween, GearValue, GeometryHandle, GeometryOptions, GlImageSource, GlyphPreload, GlyphPreloadOptions, GraphNodeType, GraphType, GridColor, HeadlessAppOptions, HitAreaShape, ImageSegment, InputHandler, InputMapAsset, InstantiatePrefabOptions, InstantiatePrefabResult, InteractableData, LayoutProvider, LayoutWorld, LifecycleEvent, LifecycleListener, LifecyclePluginOptions, LightStatus, LineCap, LineJoin, LinearFillDirection, ListItemTemplate, ListLayoutSpec, ListViewHandle, ListViewHost, ListViewOptions, ListenOptions, LiveBindingsData, LoadRuntimeSceneOptions, LocalizationOptions, LodDecision, LogEntry, LogHandler, LoginResult, MaskRect, MaterialGraph, MaterialGraphNode, MeasureTextOptions, MeshResult, MigrationResult, MockAdProviderOptions, Modifiers, NativeChannelApi, NextFrame, NodeParamSpec, NodePort, NodeSpec, OutlineFilterOptions, PackagedAssetIndex, PackagedAssetSourceOptions, PackagedGameConfig, PageDef, PageHandle, Panorama, PartitionOptions, PartitionedCell, PathColor, PathFill, PathStroke, PathStyle, Physics3DWorldConfig, PickCandidate, PickWorld, PickableWorld, PlanarReflectionStatus, PlayRealmRuntimeConfig, PlayableAdBridge, PlayableRuntimeConfig, PlaythroughData, PlaythroughValue, PooledAudioNode, PrefabDiagnostic, PrefabDiagnosticSeverity, PrefabInstanceDelta, PrefabInstanceEntry, PrefabRoot, ProbeGrid, ProbedRegistrations, ProfileCapture, ProfileRecorderOptions, ProgressHandle, ProgressOptions, PtrLayout, PushValue, RainShelterData, RainUprightData, ReadableWorld, ReadonlySignal, RectAnchorsData, RenderBackendRequest, RenderOriginState, RenderStats, RenderTargetHandle, RenderTextureHandle, RenderTextureOptions, ReplaySnapshot, ResidencyDecision, ResidencySource, ResolvedAssetGroup, ResolvedAtlas, RichTextRun, RuntimeBuildConfig, RuntimeInitConfig, SafeAreaData, SaveEnvelope, SaveManagerOptions, SaveMigration, SaveStorage, SceneAmbientLight, SceneAssetRefs, SceneDark, SceneEntry, SceneStreamHost, SceneStreamingConfig, ScreenAxis, ScreenInfoEvents, ScreenRect, ScrollViewHandle, ScrollViewOptions, ShaderParam, ShaderParamType, ShaderReflection, ShaderWarmup, ShaderWarmupOptions, ShadowStatus, SheetGrid, Shelter, SightPoint, SightRing, SightTargetData, SightViewerData, Signal, SkeletalPreviewBatch, SkyClockState, SkyEffectSource, SkyRadiance, SkySpec, SkyUnavailable, SliderHandle, SliderOptions, SnapshotComponent, SnapshotEntity, SocketReadyState, SoundEventAsset, SoundEventClip, SoundEventEmitter, SoundEventHandle, SoundEventMode, SoundEventRejection, SoundEventSelection, SoundEventSelectionResult, SoundEventSourceData, SoundEventStats, SoundEventStatus, SourceDelta, SpatialAudioConfig, SpawnOverride, SpringBoneParticle, StaleOverride, StaticBatchData, StaticBatchState$1 as StaticBatchDrawState, StaticBatchGroup, StaticBatchLimits, StaticBatchRefusal, StaticBatchReport, StaticBatchSummary, StatsPluginOptions, StatsPosition, StepSurfaceData, StreamCell, StreamDecision, StreamMove, StreamPolicy, StreamedTexture, StreamedWorldData, StudioPreviewReport, SubgraphInput, SubgraphResolver, SwayPusherData, SwipeDirection, SyncPrefabResolver, TabViewHandle, TabViewOptions, Takeover, TakeoverHost, TextData, TextInit, TextInputData, TextInputHandle, TextInputOptions, TextInspection, TextInspectionOptions, TextMetrics, TextSegment, TextureAtlasHandle, TextureAtlasOptions, TextureCanvasHandle, TextureCanvasOptions, TextureStreamingOptions, ThemeColors, ThemeOverrides, ThemeStyleData, ThemeTokens, ThemeType, TimeOfDayState, TimelineShot, ToggleHandle, ToggleOptions, TooltipHandle, TooltipOptions, TransactionManagerOptions, TransactionOp, TransitionConfig, TreeDataSource, TreeDropRequest, TreeItemId, TreeRow, TreeViewHandle, TreeViewNode, TreeViewOptions, TweenFactory, TweenOptions, UICameraData, UIColorPickerData, UIControllerData, UIDialogData, UIDropdownData, UIEntityInit, EntityEvent as UIEvent, EntityEventHandler as UIEventHandler, UIGearData, UIInteractionData, UILayoutGenerationData, UIMaskData, UINodeInit, UISliderData, UITabViewData, UIToggleData, UIToggleGroupData, UITooltipData, UITreeViewData, UIVisualData, UIVisualInit, UIWorldAnchorData, Unsubscribe$1 as Unsubscribe, UnwrapOptions, UnwrapResult, Upright, UvRect, ValidatePrefabOptions, ValidateResult, VertexAttributeDescriptor, VideoData, VideoHandle, VideoPlayOptions, ViewShading, VirtualButtonData, VirtualButtonOptions, VirtualJoystickData, VirtualJoystickOptions, MiniGameSideModuleFactories as WeChatSideModuleFactories, WeatherPreset, WeatherState, WebGPUAdapterLike, WebGPUBootResult, WidgetInteractionInit, WorkJob, WorldAxis, WorldCell, WorldManifest, WorldPartition, WorldRay, WorldRect, WorldResidencyReport, WorldSnapshot, WorldSnapshotOptions, WorldStreamHost, WorldStreamerStatus, WorldStreamingSourceData };
