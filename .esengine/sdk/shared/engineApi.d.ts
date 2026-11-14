interface NativeEngineApi {
    anim_cancelAllTweens?(registry: unknown, targetEntity: number): void;
    anim_cancelTween?(registry: unknown, tweenEntity: number): void;
    anim_createTween?(registry: unknown, entity: number, targetProp: number, from: number, to: number, duration: number, easing: number, delay: number, loopMode: number, loopCount: number): number;
    anim_getTweenState?(registry: unknown, tweenEntity: number): number;
    anim_pauseTween?(registry: unknown, tweenEntity: number): void;
    anim_resumeTween?(registry: unknown, tweenEntity: number): void;
    anim_setSequenceNext?(registry: unknown, tweenEntity: number, nextEntity: number): void;
    anim_setTweenBezier?(registry: unknown, tweenEntity: number, p1x: number, p1y: number, p2x: number, p2y: number): void;
    anim_updateTweens?(registry: unknown, deltaTime: number): void;
    draw_begin?(matrixPtr: number, viewportWidth: number, viewportHeight: number): void;
    draw_circle?(centerX: number, centerY: number, radius: number, r: number, g: number, b: number, a: number, filled: boolean, segments: number): void;
    draw_circleOutline?(centerX: number, centerY: number, radius: number, r: number, g: number, b: number, a: number, thickness: number, segments: number): void;
    draw_deferBegin?(): void;
    draw_deferEnd?(): void;
    draw_end?(): void;
    draw_getDepthState?(): number;
    draw_getDrawCallCount?(): number;
    draw_getPrimitiveCount?(): number;
    draw_line?(fromX: number, fromY: number, toX: number, toY: number, r: number, g: number, b: number, a: number, thickness: number): void;
    draw_line3D?(fromX: number, fromY: number, fromZ: number, toX: number, toY: number, toZ: number, r: number, g: number, b: number, a: number, thickness: number): void;
    draw_line3DScreen?(fromX: number, fromY: number, fromZ: number, toX: number, toY: number, toZ: number, r: number, g: number, b: number, a: number, thickness: number): void;
    draw_line3DScreenOffset?(anchorX: number, anchorY: number, anchorZ: number, fromX: number, fromY: number, toX: number, toY: number, r: number, g: number, b: number, a: number, thickness: number): void;
    draw_mesh?(geometryHandle: number, shaderHandle: number, transformPtr: number): void;
    draw_meshWithMaterial?(geometryHandle: number, materialId: number): boolean;
    draw_meshWithUniforms?(geometryHandle: number, shaderHandle: number, transformPtr: number, uniformsPtr: number, uniformCount: number): void;
    draw_rect?(x: number, y: number, width: number, height: number, r: number, g: number, b: number, a: number, filled: boolean): void;
    draw_rectOutline?(x: number, y: number, width: number, height: number, r: number, g: number, b: number, a: number, thickness: number): void;
    draw_setBlendMode?(mode: number): void;
    draw_setDepth?(depth: number): void;
    draw_setDepthState?(flags: number): void;
    draw_setDepthTest?(enabled: boolean): void;
    draw_setLayer?(layer: number): void;
    draw_texture?(x: number, y: number, width: number, height: number, textureId: number, r: number, g: number, b: number, a: number): void;
    draw_textureRotated?(x: number, y: number, width: number, height: number, rotation: number, textureId: number, r: number, g: number, b: number, a: number): void;
    engine_getCounters?(): string;
    engine_getCpuScopes?(): string;
    engine_getGpuScopes?(): string;
    engine_prepareMeshPrograms?(rowsPtr: number, count: number, outPtr: number): void;
    engine_setCpuProfiling?(on: boolean): void;
    engine_setRandomSeed?(seed: number): void;
    environment_create?(shPtr: number, specularHandle: number, faceSize: number, mipCount: number, maxRange: number, columns: number): number;
    environment_release?(environmentHandle: number): void;
    environment_setSky?(environmentHandle: number, skyHandle: number): void;
    environment_setSun?(environmentHandle: number, skyShPtr: number, dx: number, dy: number, dz: number, r: number, g: number, b: number): void;
    geometry_create?(): number;
    geometry_init?(handle: number, verticesPtr: number, vertexCount: number, layoutPtr: number, layoutCount: number, dynamic: boolean): void;
    geometry_isValid?(handle: number): boolean;
    geometry_release?(handle: number): void;
    geometry_setIndices16?(handle: number, indicesPtr: number, indexCount: number): void;
    geometry_setIndices32?(handle: number, indicesPtr: number, indexCount: number): void;
    geometry_updateVertices?(handle: number, verticesPtr: number, vertexCount: number, offset: number): void;
    getUINodeAlphaInTree?(registry: unknown, entity: number): number;
    getUINodeComputedHeight?(registry: unknown, entity: number): number;
    getUINodeComputedWidth?(registry: unknown, entity: number): number;
    getUINodeHiddenInTree?(registry: unknown, entity: number): boolean;
    gl_checkErrors?(context: string): number;
    gl_enableErrorCheck?(enabled: boolean): void;
    material_compileEsshader?(source: string, featuresCsv: string): number;
    material_define?(materialId: number, shaderHandle: number, blendMode: number, flags: number, depthBias: number): void;
    material_setTexture?(materialId: number, name: string, textureHandle: number): void;
    material_setUniform?(materialId: number, name: string, arity: number, v0: number, v1: number, v2: number, v3: number): void;
    material_undefine?(materialId: number): void;
    meshInstances_set?(registry: unknown, entity: number, dataPtr: number, count: number): void;
    meshRenderer_makeAllResident?(registry: unknown): number;
    meshRenderer_setGeometry?(registry: unknown, entity: number, posUvPtr: number, vertexCount: number, colorsPtr: number, indicesPtr: number, indexCount: number): void;
    meshRenderer_setMaterialAll?(registry: unknown, materialId: number): number;
    meshRenderer_setMeshAll?(registry: unknown, meshHandle: number): number;
    mesh_createFromChannels?(channelsPtr: number, channelCount: number, vertexStride: number, vertexPtr: number, vertexBytes: number, indexPtr: number, indexCount: number, minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number, bindPtr: number, bindFloats: number, morphPtr: number, morphFloats: number, morphTargets: number, morphNormals: number): number;
    mesh_release?(meshHandle: number): void;
    mesh_rematerializeFromChannels?(targetHandle: number, channelsPtr: number, channelCount: number, vertexStride: number, vertexPtr: number, vertexBytes: number, indexPtr: number, indexCount: number, minX: number, minY: number, minZ: number, maxX: number, maxY: number, maxZ: number, bindPtr: number, bindFloats: number, morphPtr: number, morphFloats: number, morphTargets: number, morphNormals: number): number;
    particle_collisionEventCount?(): number;
    particle_collisionEvents?(): number;
    particle_collisionQueries?(): number;
    particle_collisionQueryCount?(): number;
    particle_collisionResolve?(registry: unknown, ptr: number, count: number): void;
    particle_collisionSetBudget?(queries: number, events: number, debug: boolean): void;
    particle_collisionStats?(): number;
    particle_collisionStatsCount?(): number;
    particle_emitAt?(registry: unknown, entity: number, count: number, px: number, py: number, pz: number, nx: number, ny: number, nz: number, vx: number, vy: number, vz: number): number;
    particle_getAliveCount?(entity: number): number;
    particle_play?(registry: unknown, entity: number): void;
    particle_reset?(registry: unknown, entity: number): void;
    particle_set_bursts?(entity: number, ptr: number, count: number): void;
    particle_set_color_lut?(entity: number, ptr: number, count: number): void;
    particle_set_size_lut?(entity: number, ptr: number, count: number): void;
    particle_set_speed_lut?(entity: number, ptr: number, count: number): void;
    particle_stop?(registry: unknown, entity: number): void;
    particle_update?(registry: unknown, dt: number): void;
    postprocess_addComputePass?(name: string, wgsl: string, params: string, workgroupX: number, workgroupY: number): number;
    postprocess_addNativePass?(name: string, kind: string): number;
    postprocess_addPass?(name: string, shaderHandle: number): number;
    postprocess_addScreenPass?(name: string, shaderHandle: number): number;
    postprocess_begin?(): void;
    postprocess_beginScreenCapture?(): void;
    postprocess_clearPasses?(): void;
    postprocess_clearScreenPasses?(): void;
    postprocess_effectiveMsaaSamples?(): number;
    postprocess_end?(): void;
    postprocess_endScreenCapture?(): void;
    postprocess_executeScreenPasses?(): void;
    postprocess_giStats?(dst: number, capacity: number): number;
    postprocess_hdrFormat?(outPtr: number): number;
    postprocess_hdrFormatNames?(): string;
    postprocess_init?(width: number, height: number): boolean;
    postprocess_isInitialized?(): boolean;
    postprocess_maxMsaaSamples?(): number;
    postprocess_pollSkyCapture?(): number;
    postprocess_requestSkyCapture?(passName: string, width: number, height: number): void;
    postprocess_resize?(width: number, height: number): void;
    postprocess_setBypass?(bypass: boolean): void;
    postprocess_setDisplayLut?(textureHandle: number, amount: number): void;
    postprocess_setGIScene?(headerPtr: number, headerCount: number, sdfPtr: number, sdfCount: number, instancesPtr: number, instanceCount: number, pixelsPtr: number, pixelCount: number): boolean;
    postprocess_setMsaaSamples?(samples: number): void;
    postprocess_setOutputTransform?(transform: number): void;
    postprocess_setOutputViewport?(x: number, y: number, w: number, h: number): void;
    postprocess_setPassContinuesEffect?(passName: string): void;
    postprocess_setPassScale?(passName: string, scale: number): void;
    postprocess_setPassTexture?(passName: string, uniform: string, textureHandle: number): void;
    postprocess_setPresentRequired?(required: boolean): void;
    postprocess_setScreenUniformFloat?(passName: string, uniform: string, value: number): void;
    postprocess_setScreenUniformVec4?(passName: string, uniform: string, x: number, y: number, z: number, w: number): void;
    postprocess_setUniformFloat?(passName: string, uniform: string, value: number): void;
    postprocess_setUniformVec4?(passName: string, uniform: string, x: number, y: number, z: number, w: number): void;
    postprocess_setViewExposure?(ev: number): void;
    postprocess_shutdown?(): void;
    postprocess_supportsCompute?(): boolean;
    postprocess_takeSkyCapture?(dst: number, bytes: number): boolean;
    postprocess_updateGIField?(headerPtr: number, headerCount: number, sdfPtr: number, sdfOffset: number, sdfCount: number): boolean;
    probe_volume_create?(resX: number, resY: number, resZ: number, shPtr: number): number;
    probe_volume_release?(volumeHandle: number): void;
    probe_volume_setSkyVisibility?(volumeHandle: number, visibilityPtr: number): void;
    registry_batchSyncPhysicsTransforms?(registry: unknown, bufferPtr: number, count: number, ppu: number): void;
    registry_componentMutationRevision?(registry: unknown, component: number, topology: boolean): number;
    registry_entityChangeResetEpoch?(registry: unknown): number;
    registry_entityChangeSequence?(registry: unknown): number;
    registry_getCanvasEntity?(registry: unknown): number;
    registry_getGeneration?(registry: unknown, entity: number): number;
    registry_readEntityChanges?(registry: unknown, after: number, outputPtr: number, capacity: number): number;
    registry_readWorldPoses2D?(registry: unknown, entitiesPtr: number, count: number, outputPtr: number): number;
    registry_unwatchEntityChanges?(registry: unknown, reader: number): void;
    registry_watchEntityChanges?(registry: unknown): number;
    renderer_begin?(matrixPtr: number, targetHandle: number, clearFlags: number, r: number, g: number, b: number, a: number, clearX: number, clearY: number, clearW: number, clearH: number): void;
    renderer_beginFrame?(elapsedSec: number): void;
    renderer_beginScreenOverlay?(projectionPtr: number, vpX: number, vpY: number, vpW: number, vpH: number): void;
    renderer_captureFrame?(w: number, h: number): number;
    renderer_captureNextFrame?(): void;
    renderer_copyCapturedEntities?(dest: number, destSize: number): boolean;
    renderer_copyCapturedRecords?(dest: number, destSize: number): boolean;
    renderer_copyCapturedTextures?(dest: number, destSize: number): boolean;
    renderer_copySnapshot?(dest: number, destSize: number): boolean;
    renderer_createSkeletalPreview?(w: number, h: number): number;
    renderer_createTarget?(width: number, height: number, flags: number): number;
    renderer_destroySkeletalPreview?(preview: number): void;
    renderer_deviceGeneration?(): number;
    renderer_diagnose?(): void;
    renderer_end?(): void;
    renderer_endFrame?(): void;
    renderer_endScreenOverlay?(targetHandle: number): void;
    renderer_entityVisibleToCamera?(registry: unknown, entity: number, layer: number, minX: number, minY: number, maxX: number, maxY: number, outVisiblePtr: number): void;
    renderer_flush?(): void;
    renderer_getCapturedEntityCount?(): number;
    renderer_getCapturedFrameSize?(): number;
    renderer_getCapturedPassCount?(): number;
    renderer_getCapturedTextureCount?(): number;
    renderer_getCulled?(): number;
    renderer_getDrawCalls?(): number;
    renderer_getEstimatedGpuBytes?(): number;
    renderer_getGpuDrawCalls?(): number;
    renderer_getGpuTimeMs?(): number;
    renderer_getMeshes?(): number;
    renderer_getPendingShaders?(): number;
    renderer_getPlanarReflectionStatus?(view: number, entity: number): string;
    renderer_getPreviewHeight?(): number;
    renderer_getPreviewSize?(): number;
    renderer_getPreviewWidth?(): number;
    renderer_getSkeletal?(): number;
    renderer_getSkeletalPreviewHeight?(preview: number): number;
    renderer_getSkeletalPreviewSize?(preview: number): number;
    renderer_getSkeletalPreviewWidth?(preview: number): number;
    renderer_getSnapshotHeight?(): number;
    renderer_getSnapshotSize?(): number;
    renderer_getSnapshotWidth?(): number;
    renderer_getSprites?(): number;
    renderer_getTargetDepthTexture?(handle: number): number;
    renderer_getTargetTexture?(handle: number): number;
    renderer_getText?(): number;
    renderer_getTextureBytes?(): number;
    renderer_getTriangles?(): number;
    renderer_hasCapturedData?(): boolean;
    renderer_init?(width: number, height: number): void;
    renderer_lightStatus?(entity: number, outPtr: number): number;
    renderer_lodInspect?(view: number, entity: number, outPtr: number): number;
    renderer_pollFrameCapture?(handle: number): number;
    renderer_pollPreviewReadback?(): number;
    renderer_pollProbeCapture?(): number;
    renderer_pollSkeletalPreview?(preview: number): number;
    renderer_pollSnapshotReadback?(): number;
    renderer_programEpoch?(): number;
    renderer_releaseTarget?(handle: number): void;
    renderer_renderMaterialPreview?(materialId: number, w: number, h: number, meshId: number, textureId: number): void;
    renderer_renderMeshPreview?(meshId: number, w: number, h: number): void;
    renderer_renderSkeletalPreview?(preview: number, viewProjectionPtr: number): number;
    renderer_replayToDrawCall?(drawCallIndex: number): void;
    renderer_requestProbeCapture?(x: number, y: number, z: number, face: number): void;
    renderer_resize?(width: number, height: number): void;
    renderer_retainedTextBatch?(entity: number, verticesPtr: number, vertexCount: number, indicesPtr: number, indexCount: number, pageId: number, glyphMode: number): void;
    renderer_retainedTextBegin?(entity: number, sdf: number, screen: number, hasBox: number, layer: number, boxWidth: number, boxHeight: number, autoKind: number): void;
    renderer_retainedTextClear?(entity: number): void;
    renderer_retainedTextStale?(registry: unknown, outPtr: number, capacity: number): number;
    renderer_retainedTextSubmit?(registry: unknown, screen: number, projectionPtr: number): void;
    renderer_setAsyncShaderCompile?(on: boolean): void;
    renderer_setClearColor?(r: number, g: number, b: number, a: number): void;
    renderer_setColorSpace?(linear: number): void;
    renderer_setCullingMask?(mask: number): void;
    renderer_setDepthLayers?(mask: number): void;
    renderer_setDepthPrepass?(on: boolean): void;
    renderer_setEntityDrawOrder?(registry: unknown, entitiesPtr: number, count: number): void;
    renderer_setImpostorAtlas?(entity: number, texture: number, frames: number): void;
    renderer_setLightingDirect?(on: boolean): void;
    renderer_setLodPreview?(view: number, entity: number, level: number): void;
    renderer_setMeshEdgeBuffers?(enabled: boolean): void;
    renderer_setOrigin?(x: number, y: number, z: number): void;
    renderer_setPlanarReflectionQuality?(scale: number, maxSize: number, updatesPerSecond: number): void;
    renderer_setProbeVolumeOverride?(entity: number, volumeHandle: number): void;
    renderer_setProbeVolumeReflection?(entity: number, environmentHandle: number, slot: number): void;
    renderer_setQualityBudgets?(atlasSize: number, cellSize: number, cascades: number, particleLimit: number): void;
    renderer_setShadow2DSoftSamples?(samples: number): void;
    renderer_setShadowDistance?(distance: number): void;
    renderer_setSkyEnvironment?(environmentHandle: number): void;
    renderer_setStage?(stage: number): void;
    renderer_setTextureParams?(textureId: number, minFilter: number, magFilter: number, wrapS: number, wrapT: number): void;
    renderer_setTreeSortLayers?(mask: number): void;
    renderer_setViewId?(view: number): void;
    renderer_setViewLighting?(mode: number, rotationDegrees: number, keyIntensity: number, fillIntensity: number, skyIntensity: number, showSky: boolean): void;
    renderer_setViewShading?(view: number, mode: number): void;
    renderer_setViewSkinWeights?(view: number, entity: number, joint: number): void;
    renderer_setViewport?(x: number, y: number, w: number, h: number): void;
    renderer_setWorldUnitsPerMeter?(units: number): void;
    renderer_setYSortLayers?(mask: number): void;
    renderer_shadowStatus?(entity: number, outPtr: number): number;
    renderer_snapshotMatchesCapture?(): boolean;
    renderer_submitAll?(registry: unknown, vpX: number, vpY: number, vpW: number, vpH: number): void;
    renderer_submitScreenOverlay?(registry: unknown): void;
    renderer_submitSkeletalBatchByEntity?(registry: unknown, verticesPtr: number, vertexCount: number, indicesPtr: number, indexCount: number, textureId: number, blendMode: number, entity: number, skelScale: number, flipX: boolean, flipY: boolean, layer: number, depth: number, materialId: number): void;
    renderer_submitSkeletalBatchByEntityEx?(registry: unknown, verticesPtr: number, vertexCount: number, indicesPtr: number, indexCount: number, textureId: number, blendMode: number, entity: number, skelScale: number, flipX: boolean, flipY: boolean, layer: number, depth: number, materialId: number, premultipliedColor: boolean): void;
    renderer_submitSkeletalPreviewBatch?(preview: number, verticesPtr: number, vertexCount: number, indicesPtr: number, indexCount: number, textureId: number, blendMode: number, transformPtr: number, layer: number, depth: number, materialId: number): number;
    renderer_submitSkeletalPreviewBatchEx?(preview: number, verticesPtr: number, vertexCount: number, indicesPtr: number, indexCount: number, textureId: number, blendMode: number, transformPtr: number, layer: number, depth: number, materialId: number, premultipliedColor: boolean): number;
    renderer_submitTextBatch?(verticesPtr: number, vertexCount: number, indicesPtr: number, indexCount: number, textureId: number, transformPtr: number, entity: number, layer: number, depth: number, glyphMode: number, cullBit: number): void;
    renderer_takeFrameCapture?(handle: number, dest: number, destSize: number): boolean;
    renderer_takeProbeCapture?(dst: number, bytes: number): boolean;
    renderer_takeTextureWants?(): string;
    renderer_updateTransforms?(registry: unknown): void;
    rm_acquireTextureByPath?(rm: unknown, path: string): number;
    rm_adoptTextureContent?(rm: unknown, target: number, source: number): boolean;
    rm_createCompressedTexture?(rm: unknown, width: number, height: number, format: number, dataPtr: number, dataLen: number, mipLevels: number, content: number): number;
    rm_createLabelAtlasFont?(rm: unknown, textureHandle: number, texWidth: number, texHeight: number, chars: string, charWidth: number, charHeight: number): number;
    rm_createShader?(rm: unknown, vertSrc: string, fragSrc: string): number;
    rm_createTexture?(rm: unknown, width: number, height: number, pixelsPtr: number, pixelsLen: number, format: number, flipY: boolean, content: number): number;
    rm_createTextureArray?(rm: unknown, width: number, height: number, layers: number, pixelsPtr: number, pixelsLen: number, format: number, filterMode: number, wrapMode: number, content: number): number;
    rm_createTextureEx?(rm: unknown, width: number, height: number, pixelsPtr: number, pixelsLen: number, format: number, flipY: boolean, filterMode: number, wrapMode: number, content: number): number;
    rm_forgoTextureContent?(rm: unknown, handle: number): void;
    rm_getBitmapFontRefCount?(rm: unknown, handleId: number): number;
    rm_getShaderRefCount?(rm: unknown, handleId: number): number;
    rm_getTextureGLId?(rm: unknown, handleId: number): number;
    rm_getTextureNativeId?(rm: unknown, handle: number): number;
    rm_getTextureRefCount?(rm: unknown, handleId: number): number;
    rm_invalidateTexturePath?(rm: unknown, path: string): boolean;
    rm_loadBitmapFont?(rm: unknown, fntContent: string, textureHandle: number, texWidth: number, texHeight: number): number;
    rm_meshRealizations?(rm: unknown): string;
    rm_meshesAwaitingRemat?(rm: unknown): string;
    rm_registerExternalTexture?(rm: unknown, glTextureId: number, width: number, height: number, content: number): number;
    rm_registerExternalTextureSized?(rm: unknown, glTextureId: number, width: number, height: number, bytes: number, content: number): number;
    rm_registerTextureWithPath?(rm: unknown, handleId: number, path: string): void;
    rm_releaseBitmapFont?(rm: unknown, handleId: number): void;
    rm_releaseShader?(rm: unknown, handleId: number): void;
    rm_releaseTexture?(rm: unknown, handleId: number): void;
    rm_restoreTextureContent?(rm: unknown, handle: number): void;
    rm_setRetainedBudget?(rm: unknown, bytes: number): void;
    rm_setTextureBudget?(rm: unknown, bytes: number): void;
    rm_setTextureMetadata?(rm: unknown, handleId: number, left: number, right: number, top: number, bottom: number): void;
    rm_supportsCompressedFormat?(rm: unknown, format: number): boolean;
    rm_texturesAwaitingReupload?(rm: unknown): string;
    rm_trimTextureCache?(rm: unknown): number;
    rm_updateTextureSubregion?(rm: unknown, handleId: number, x: number, y: number, width: number, height: number, pixelsPtr: number, pixelsLen: number): void;
    rm_wrapDeviceTexture?(rm: unknown, textureId: number, width: number, height: number): number;
    springbone_release?(registry: unknown, entity: number): void;
    springbone_reset?(registry: unknown, entity: number): void;
    springbone_snapshot?(registry: unknown, entity: number): number;
    springbone_snapshotCount?(): number;
    springbone_snapshotData?(): number;
    springbone_update?(registry: unknown, dt: number): void;
    tilemap_advanceAnimations?(entity: number, dtMs: number): void;
    tilemap_clearTileAnimations?(entity: number): void;
    tilemap_destroyLayer?(entity: number): void;
    tilemap_exportChunks?(entity: number): string;
    tilemap_fillRect?(entity: number, x: number, y: number, w: number, h: number, tileId: number): void;
    tilemap_flipTile?(entity: number, x: number, y: number, flipH: boolean, flipV: boolean, flipD: boolean): void;
    tilemap_getEditRevision?(entity: number): number;
    tilemap_getGeneration?(entity: number): number;
    tilemap_getTile?(entity: number, x: number, y: number): number;
    tilemap_getTileProperty?(entity: number, x: number, y: number, key: string): string;
    tilemap_hasLayer?(entity: number): boolean;
    tilemap_importChunks?(entity: number, encoded: string): boolean;
    tilemap_initInfinite?(entity: number, tileWidth: number, tileHeight: number): void;
    tilemap_initInfiniteLayer?(entity: number, tileWidth: number, tileHeight: number): void;
    tilemap_initLayer?(entity: number, width: number, height: number, tileWidth: number, tileHeight: number): void;
    tilemap_readChunkIndex?(entity: number, rowsPtr: number, capacity: number): number;
    tilemap_readChunkTiles?(entity: number, chunkX: number, chunkY: number, tilesPtr: number, capacity: number): boolean;
    tilemap_removeChunk?(entity: number, chunkX: number, chunkY: number): void;
    tilemap_rotateTile?(entity: number, x: number, y: number, degrees: number): void;
    tilemap_setChunkTiles?(entity: number, chunkX: number, chunkY: number, tilesPtr: number, width: number, height: number): void;
    tilemap_setGridType?(entity: number, type: number): void;
    tilemap_setHexParams?(entity: number, sideLength: number, staggerAxisX: number, staggerIndexEven: number): void;
    tilemap_setOriginEntity?(layerKey: number, originEntity: number): void;
    tilemap_setRenderProps?(entity: number, textureHandle: number, tilesetColumns: number, uvTileW: number, uvTileH: number, sortLayer: number, depth: number, parallaxX: number, parallaxY: number): void;
    tilemap_setTile?(entity: number, x: number, y: number, tileId: number): void;
    tilemap_setTileAnimation?(entity: number, tileId: number, framesPtr: number, frameCount: number): void;
    tilemap_setTileProperty?(entity: number, tileId: number, key: string, value: string): void;
    tilemap_setTiles?(entity: number, tilesPtr: number, count: number): void;
    tilemap_setTilesets?(entity: number, dataPtr: number, count: number): void;
    tilemap_setTint?(entity: number, r: number, g: number, b: number, a: number, opacity: number): void;
    tilemap_setVisible?(entity: number, visible: boolean): void;
    tilemap_tileToWorld?(entity: number, tx: number, ty: number, originX: number, originY: number): number;
    tilemap_worldToTile?(entity: number, wx: number, wy: number, originX: number, originY: number): number;
    trail_clear?(registry: unknown, entity: number): void;
    trail_update?(registry: unknown, dt: number): void;
    transform_copyFlatRenderMatrix?(registry: unknown, entity: number, outputPtr: number): boolean;
    transform_update?(registry: unknown): void;
    uiHitTest_getHitEntity?(): number;
    uiHitTest_pick?(registry: unknown, worldX: number, worldY: number): number;
    uiHitTest_pickAll?(registry: unknown, worldX: number, worldY: number): number;
    uiHitTest_pickResult?(index: number): number;
    uiHitTest_update?(registry: unknown, originX: number, originY: number, originZ: number, dirX: number, dirY: number, dirZ: number): void;
    uiHitTest_updateDomains?(registry: unknown, worldOriginX: number, worldOriginY: number, worldOriginZ: number, worldDirX: number, worldDirY: number, worldDirZ: number, screenOriginX: number, screenOriginY: number, screenOriginZ: number, screenDirX: number, screenDirY: number, screenDirZ: number): void;
    uiLayout_update?(registry: unknown, boxLeft: number, boxBottom: number, boxRight: number, boxTop: number, propertyDirty: boolean): void;
    uiNode_computedHeight?(registry: unknown, entity: number): number;
    uiNode_computedWidth?(registry: unknown, entity: number): number;
    uiRenderOrder_update?(registry: unknown): void;
    ui_getCullBit?(registry: unknown, entity: number): number;
    ui_getRenderOrder?(registry: unknown, entity: number): number;
    ui_isScreenDomain?(registry: unknown, entity: number): boolean;
}

/**
 * @file    ecs/nativeHeap.ts
 * @brief   The heap a native core marshals bulk data through.
 *
 * Half the engine's surface passes bulk data as an offset plus a count: tile
 * arrays, polygon vertices, body transforms, spine meshes. On the web that offset
 * addresses wasm's linear memory, which the SDK writes through `module.HEAPF32`
 * and hands over as a number. A native core had no such memory, so every one of
 * those calls was web-only — which is why physics, tilemaps and spine could not
 * run on a device even though their C++ compiles natively.
 *
 * The host now reserves one arena and exposes it as a single `ArrayBuffer`
 * (`native/host/heap.hpp`). This builds the same views over it that an emscripten
 * module exposes, so a subsystem's module interface — `HEAPF32` + `_malloc` +
 * a `…Ptr` argument — is satisfied by the same SDK code on both platforms.
 *
 * One difference, in the native build's favour: the arena never moves, so these
 * views stay valid for the process lifetime instead of being invalidated by heap
 * growth.
 */
/** The heap members a subsystem module interface asks for. */
interface NativeHeap {
    readonly allocatorIdentity: object;
    HEAPU8: Uint8Array;
    HEAPU16: Uint16Array;
    HEAPU32: Uint32Array;
    HEAPI32: Int32Array;
    HEAPF32: Float32Array;
    HEAPF64: Float64Array;
    _malloc(bytes: number): number;
    _free(offset: number): void;
}

/**
 * @file    ecs/engineApi.ts
 * @brief   Whichever engine core is present, by one set of names.
 *
 * A plugin that drives the engine — UI layout, hit testing, render order — used
 * to reach it as `app.wasmModule.uiLayout_update(...)`, which is a statement
 * about HOW the core is embedded, not about what the plugin wants. On a device
 * there is no wasm module, so every such plugin was web-only by construction.
 *
 * `engineApi(app)` answers with the module on the web and with the native host's
 * bindings on a device. Both spell the entry points the same way, because both
 * come from the same C++ declarations: embind registers them for the module, and
 * EHT generates the native side (see nativeEngineApi.generated.ts).
 *
 * Members are optional — a core answers what it compiles — so call sites read
 * `api.uiLayout_update?.(…)`, which is also how they treat an engine build that
 * left a subsystem out.
 */

/**
 * The engine surface a plugin may call, from either core: the entry points plus
 * the heap they marshal bulk data through. A wasm module answers both by
 * construction; a native host answers the heap from its arena (see nativeHeap.ts),
 * so a plugin that writes a tile array and passes an offset works on both.
 */
type EngineApi = NativeEngineApi & Partial<NativeHeap>;

export type { EngineApi };
