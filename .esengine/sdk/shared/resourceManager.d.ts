import { CppResourceManager } from './wasm.js';

/**
 * Resolve a ref one document carries about another asset: a logical project path
 * stands as it is, anything else is relative to the document. Every loader whose
 * document names a sibling resolves through this, because the cook rewrites all
 * of those refs to the same logical shape.
 */
declare function resolveDocumentRef(documentPath: string, ref: string): string;
declare function resolveRelativePath(basePath: string, relativePath: string): string;

interface TextureDimensions {
    width: number;
    height: number;
}
declare function shutdownResourceManager(): void;
declare function getResourceManager(): CppResourceManager | null;
declare function requireResourceManager(): CppResourceManager;
/**
 * Set the resident GPU-texture byte budget. When resident bytes exceed this,
 * the C++ ResourcePool evicts least-recently-used unreferenced textures. `0`
 * disables caching — a texture frees the moment its refcount hits zero.
 * Negative / fractional inputs are clamped to a non-negative integer.
 *
 * The engine applies `RuntimeConfig.textureCacheBudget` at startup, so scene
 * switches keep recently-used textures warm by default; call this (or set
 * `textureCacheBudget` in the build config) to size it for your game.
 *
 * This is the single game-facing surface over the C++ budget; there is no
 * parallel TS-side budget to drift from it.
 */
declare function setTextureBudget(bytes: number): void;
/**
 * Warn once when the CPU copies the graphics device keeps to survive a GPU loss
 * ({@link ResourceStats.retainedBytes}) grow past `bytes`; 0 never warns. The
 * engine applies `RuntimeConfig.retainedBudget` at startup.
 */
declare function setRetainedBudget(bytes: number): void;
/** GPU resource counts + texture residency figures. See {@link getResourceStats}. */
interface ResourceStats {
    shaderCount: number;
    textureCount: number;
    vertexBufferCount: number;
    indexBufferCount: number;
    cacheHits: number;
    cacheMisses: number;
    /** Resident texture bytes (RGBA8 estimate) — held + evictable entries. */
    textureBytes: number;
    /** The texture pool's resident-byte budget (0 = eviction off). */
    textureBudget: number;
    /** Cached refCount==0 textures awaiting revive or eviction. */
    textureEvictableCount: number;
    /** CPU copies the graphics device keeps so content survives a device loss. */
    retainedBytes: number;
}
/**
 * Snapshot of GPU resource usage from the C++ ResourceManager — the
 * observability side of the texture budget: watch `textureBytes` against
 * `textureBudget` and `textureEvictableCount` to size the warm cache.
 * Returns null when the resource manager isn't initialized (or a test mock
 * doesn't model stats).
 */
declare function getResourceStats(): ResourceStats | null;
/**
 * Free every evictable cached texture now (memory pressure). Held textures
 * and the budget are untouched; the warm cache refills as textures are
 * released afterwards. The engine calls this on OS memory warnings — call it
 * yourself before a known memory spike (e.g. a huge one-off allocation).
 * Returns the number of textures freed (0 when uninitialized / mocked).
 */
declare function trimTextureCache(): number;
declare function evictTextureDimensions(handle: number): void;
declare function getTextureDimensions(handle: number): TextureDimensions | null;

export { evictTextureDimensions, getResourceManager, getResourceStats, getTextureDimensions, requireResourceManager, resolveDocumentRef, resolveRelativePath, setRetainedBudget, setTextureBudget, shutdownResourceManager, trimTextureCache };
export type { ResourceStats, TextureDimensions };
