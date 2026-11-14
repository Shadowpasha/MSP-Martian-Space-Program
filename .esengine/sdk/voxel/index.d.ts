export { VOXEL_MATERIALS, VoxelEditEvent, VoxelEditOptions, VoxelEditResult, VoxelField, VoxelFieldData, VoxelFieldOptions, VoxelHit, VoxelMaterial, VoxelNoiseParams, VoxelOp, VoxelPlugin, VoxelPoint, VoxelSample, VoxelShape, VoxelSource, VoxelTerrain, VoxelTerrainData, VoxelTerrainStatus, VoxelTerrains, VoxelTerrainsRes, heightVoxelSource, noiseVoxelSource, voxelPlugin } from '../shared/source.js';
import '../shared/wasm.js';
import '../shared/app.js';
import '../shared/resource.js';

/**
 * @file    surfaceNets.ts
 * @brief   The skin of one chunk of a volume: Naive Surface Nets over its samples.
 *
 * @details One vertex for each cell the surface passes through, at the mean of where it crosses that cell's edges, and one quad for each
 *          grid edge it crosses. An edge belongs to the chunk its first sample is in, so no quad is made twice; a vertex and its normal are
 *          worked out from the eight corners of its cell alone, and those corners are in both chunks' samples at a border, so the two
 *          agree exactly and no crack can open between them, however the chunks were edited.
 */

/** A chunk's skin, relative to the chunk's first corner. */
interface VoxelSurface {
    positions: Float32Array;
    normals: Float32Array;
    /** Four bytes a vertex: how much of each material it is, summing to about 255. */
    weights: Uint8Array;
    indices: Uint32Array;
}
/** The skin of a chunk of `cells` a side, with samples from -1 to `cells`; null where the surface does not pass. */
declare function surfaceNets(distances: Int8Array, materials: Uint8Array, cells: number, cellSize: number): VoxelSurface | null;

export { surfaceNets };
export type { VoxelSurface };
