export { Brush, Dirty, Eroded, ErosionParams, FieldSource, GroundEdit, GroundPatch, Heightfield, HeightmapFormat, LayerWeights, ModifiedSource, NOISE_PROVIDER, NoiseParams, NoiseSource, PAGE_SIDE, PAGE_TEXELS, PATCH_CELLS, Page, PageImage, PageTable, PaintDab, PlanetFacts, PlanetProvider, PlanetRegion, PlanetRegistry, PlanetRegistryRes, PlanetSamples, ProceduralParams, ProviderSource, QuadtreeParams, ReachGround, ReachOptions, ReachResult, SculptDab, SculptMode, Splat, Terrain, TerrainData, TerrainExtent, TerrainLoad, TerrainModifier, TerrainNode, TerrainPlugin, TerrainProvider, TerrainRegion, TerrainRegionSamples, TerrainSamples, TerrainSource, TerrainStatus, TerrainUnavailable, Terrains, TerrainsRes, TiledGroundEdit, TiledGroundImage, TiledGroundPatch, boxDistance, brushWeight, encodeHeightmap, erodeHeightfield, erosionJob, findGroundPath, flattenModifier, heightfieldFromPixels, levelRange, makePage, nodeKey, noiseProvider, noised, paintSplat, parentOf, planetProvider, proceduralHeightfield, registerPlanetProvider, registerTerrainProvider, sampleHeight, sculptField, selectNodes, terrainNormal, terrainPlugin, terrainProvider, unionDirty } from '../shared/planetQuery.js';
export { FACES, LayerImage, LayerSource, PackedLayers, Planet, PlanetData, PlanetPageSource, PlanetPlugin, PlanetStatus, Planets, SphereNode, SphereTreeParams, TerrainLayerAssetLoader, TerrainLayerDef, buildPatchMesh, direction, faceOf, levelsFor, makePlanetPage, nodeAt, nodeBound, nodeDistance, nodePoint, nodeRect, nodeSpan, packLayers, paintWeights, parseTerrainLayer, planetPlugin, selectSphereNodes, sphereNodeKey, sphereRange, tangentFrame } from '../shared/patch.js';
import { App } from '../shared/app.js';
import '../shared/wasm.js';
import '../shared/resource.js';

/**
 * @file    layerArrays.ts
 * @brief   A ground's layer files (`.esterrainlayer`) read and packed into the texture arrays its shader samples.
 */

/** An image file's pixels exactly as stored (no premultiply, no colour conversion), by its project path or reference. */
declare function imagePixelsAt(app: App, path: string): Promise<{
    width: number;
    height: number;
    pixels: Uint8Array;
    wide?: Uint16Array;
} | null>;

export { imagePixelsAt as readTerrainImage };
