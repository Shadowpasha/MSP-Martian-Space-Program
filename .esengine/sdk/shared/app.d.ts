import { Entity, CppRegistry, ESEngineModule, TextureHandle, CppResourceManager, FontHandle, TextureContent, BillboardMode, Color, TextAlign, Vec2, Vec3, ProjectionType, Vec4, ClearFlags, CanvasScaleMode, LightType, Quat, ParticleColliderShape, EmitterShape, ParticleEasing, SimulationSpace, ParticleRenderMode, SubEmitterTrigger, ParticleCollisionMode, ParticleCollisionFallback, ForceFieldType, ReflectionAxis, ReflectionQuality, ReflectionUpdate, BodyType, ShapeType, SpringBoneShape, SpriteMaskInteraction, SpriteDrawMode, TilemapOrientation, TilemapStaggerAxis, TilemapStaggerIndex } from './wasm.js';
import { ResourceDef, AudioAPI, ResourceStorage, ResDescriptor, ResMutDescriptor, ResMutInstance, QualityProfile, GamepadSnapshot, InputEventCallbacks, QualityController, SideModuleHost, QualityConfig } from './resource.js';

/** Preview settings; never modify a catalog or interpolated parameter. @experimental */
interface PseudoLocalizationOptions {
    /** Extra visible characters as a fraction of source length. Default 0.35. */
    expansion?: number;
    accents?: boolean;
}
/** Length stress preview preserving placeholders, rich-text tags and newlines. @experimental */
declare function pseudoLocalize(template: string, options?: PseudoLocalizationOptions): string;

type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
/** A pluralized message. `other` is required (the catch-all). */
interface PluralForms {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other: string;
}
type LocaleEntry = string | PluralForms;
type LocaleCatalog = Record<string, LocaleEntry>;
type TParams = Record<string, string | number>;
type PluralSelector = (count: number) => PluralCategory;
/** Default (English-like) rule: exactly 1 → `one`, everything else → `other`.
 *  `zero` is honored separately by selectPluralForm when count is 0. */
declare const defaultPluralSelector: PluralSelector;
/** Replace `{name}` placeholders from `params`; unknown placeholders are left
 *  intact so a missing binding is visible rather than silently blank. Pure. */
declare function interpolate(template: string, params?: TParams): string;
/** Pick a plural form: explicit `zero` when count is 0, else the selector's
 *  category, falling back to `other`. Pure. */
declare function selectPluralForm(forms: PluralForms, count: number, selector: PluralSelector): string;
/**
 * Per-App localization service: catalogs keyed by locale, an active locale + a
 * fallback, and `t()` resolution (active → fallback → the key itself). Published
 * as the {@link Localization} resource; read it as `app.getResource(Localization)`.
 */
declare class LocalizationAPI {
    private readonly catalogs;
    private readonly selectors;
    private locale_;
    private fallback_;
    private pseudo_;
    private readonly plainCache_;
    constructor(locale?: string, fallback?: string);
    /** Merge `entries` into a locale's catalog (later calls override keys). */
    addCatalog(locale: string, entries: LocaleCatalog): void;
    setLocale(locale: string): void;
    get locale(): string;
    setFallbackLocale(locale: string): void;
    get fallbackLocale(): string;
    /** Opt-in length stress preview. Pass null to restore ordinary translation. */
    setPseudoLocalization(options: PseudoLocalizationOptions | null): void;
    /** Override the plural rule for a locale (e.g. languages with few/many). */
    setPluralSelector(locale: string, selector: PluralSelector): void;
    /** Locales that have a catalog, in insertion order. */
    availableLocales(): string[];
    /** True if the key resolves in the active locale or the fallback. */
    has(key: string): boolean;
    /**
     * Translate `key`, interpolating `{params}`. A pluralized entry selects a
     * form from `params.count` (default 0). Unknown keys return the key itself
     * (a visible, greppable fallback) rather than throwing.
     */
    t(key: string, params?: TParams): string;
    private translate_;
    private lookup_;
}
/**
 * Per-App localization resource, published by `LocalizationPlugin`. Read as
 * `app.getResource(Localization)`.
 */
declare const Localization: ResourceDef<LocalizationAPI>;
/**
 * The serialized shape of a `.eslocale` asset — ONE locale's catalog, shipped
 * as data (via `Assets.loadLocaleTable`) instead of baked into code. Ship one
 * file per locale so a game loads only the languages it needs.
 */
interface LocaleTableAsset {
    version: number;
    /** BCP-47-ish tag the entries register under (e.g. 'en', 'zh-CN'). */
    locale: string;
    entries: LocaleCatalog;
}
/**
 * Pick the best available locale for a platform tag: exact match first, else
 * the first locale sharing the primary language ('zh-Hans-CN' → 'zh-CN'),
 * else null — the caller keeps its current locale. Pure.
 */
declare function matchLocale(tag: string, available: readonly string[]): string | null;
/**
 * Parse + validate `.eslocale` text. Fail-loud: a malformed table names the
 * offending file and field instead of silently registering nothing. Pure.
 */
declare function parseLocaleTable(text: string, path: string): LocaleTableAsset;

/**
 * @file    ecs/entityOrder.ts
 * @brief   Permute the JS-side entity containers to a caller-supplied order.
 *
 * @details Iteration order is painter order: the engine walks its component pools
 *          and the SDK walks these Maps/Sets, and within a sorting layer whichever
 *          entity is visited last lands on top. Both sides are insertion-ordered,
 *          so "apply this order" means re-inserting in rank order — which is what
 *          {@link World.applyEntityOrder} does through these two helpers.
 *
 *          Ranking is stable: an entity the caller did not rank keeps its position
 *          relative to the other unranked ones, after every ranked one.
 */

/** `entity -> rank` for {@link reorderMapByRank}/{@link reorderSetByRank}. */
type RankOf = (entity: Entity) => number;

/**
 * Heap views + base byte offset for one component instance. The resolver reuses a
 * single instance across calls (it only ever writes the four fields), so callers
 * must consume it immediately and never retain it.
 */
interface ComponentHeap {
    f32: Float32Array;
    u32: Uint32Array;
    u8: Uint8Array;
    ptr: number;
}
/** Fills `out` with the heap views + base ptr for `entity`'s component; returns
 *  false when the entity has no live component (skip the read/write). */
type ComponentHeapResolver = (entity: Entity, out: ComponentHeap) => boolean;
/**
 * Where the fast path gets a component's memory. One implementation per engine
 * backend; the BuiltinBridge holds one and both `resolvePtrSetter` and
 * `resolvePtrGetter` go through it.
 */
interface MemoryProvider {
    /**
     * Resolve a per-entity heap-view filler for `cppName`, or null if this backend
     * has no fast-path binding for the component (the bridge then falls back to the
     * method-based path).
     */
    resolveComponentHeap(cppName: string): ComponentHeapResolver | null;
}
/** A host-injected zero-copy accessor: `entity -> ArrayBuffer` over the native
 *  ECS component, or a nullish value when the entity has no live component. */
type NativeComponentBufferFn = (entity: number) => ArrayBuffer | null | undefined;
/**
 * Native (embedded-Dawn) backend: each component is reached through the host's
 * generated `es_<Component>_buffer(entity)` binding, which hands back a zero-copy
 * ArrayBuffer over that entity's native component. The accessors then write it at
 * offset 0. `scope` is where those globals live (the QuickJS global object on a
 * device; a plain object in tests).
 *
 * The buffer is re-fetched on every access on purpose: a SparseSet growth moves
 * the dense array, invalidating any previously handed-out ArrayBuffer.
 */
declare class NativeMemoryProvider implements MemoryProvider {
    private readonly scope;
    constructor(scope?: Record<string, unknown>);
    resolveComponentHeap(cppName: string): ComponentHeapResolver | null;
}

/**
 * @file    BuiltinBridge.ts
 * @brief   C++ Registry integration layer for builtin components
 */

type PtrFieldType = 'f32' | 'i32' | 'u32' | 'bool' | 'u8' | 'vec2' | 'vec3' | 'vec4' | 'quat' | 'color';
interface PtrFieldDesc {
    readonly name: string;
    readonly type: PtrFieldType;
    readonly offset: number;
}
declare function readPtrField(f32: Float32Array, u32: Uint32Array, u8: Uint8Array, ptr: number, field: PtrFieldDesc): unknown;
interface XY {
    x: number;
    y: number;
}
interface XYZ {
    x: number;
    y: number;
    z: number;
}
interface XYZW {
    x: number;
    y: number;
    z: number;
    w: number;
}
interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}
type PtrFieldValue = number | boolean | XY | XYZ | XYZW | RGBA;
declare function writePtrField(f32: Float32Array, u32: Uint32Array, u8: Uint8Array, ptr: number, field: PtrFieldDesc, value: PtrFieldValue | unknown): void;
interface BuiltinMethods {
    add: (e: Entity, d: unknown) => void;
    get: (e: Entity) => unknown;
    has: (e: Entity) => boolean;
    remove: (e: Entity) => void;
}
/** Result of verifying a connected C++ Registry against the generated metadata. */
interface BridgeVerification {
    /** True when every component in COMPONENT_META has all four methods. */
    readonly ok: boolean;
    /** List of components with missing bindings (empty when ok). */
    readonly missing: readonly {
        readonly name: string;
        readonly methods: readonly string[];
    }[];
    /**
     * Components reported by the WASM module's reflection table
     * (`getBuiltinComponentNames`) that are not present in the shipped
     * COMPONENT_META — the WASM was built from a newer schema than the SDK
     * bundle. Only populated when the module exposes the reflection call.
     */
    readonly wasmOnly: readonly string[];
    /**
     * Components declared in COMPONENT_META that the WASM module's reflection
     * table does not list — the SDK was built from a newer schema than the
     * WASM. Only populated when the module exposes the reflection call.
     */
    readonly sdkOnly: readonly string[];
    /**
     * Set when the WASM module reports an ABI layout hash
     * (`getAbiLayoutHash`) that differs from the SDK bundle's
     * {@link ABI_LAYOUT_HASH}. A mismatch means the loaded WASM and this SDK
     * were generated from different component schemas, so the byte offsets the
     * SDK uses for fast pointer access read the wrong memory. This is always
     * fatal — never tolerated even in non-strict mode. Null when the hashes
     * match or the module predates the handshake (no `getAbiLayoutHash`).
     */
    readonly abiMismatch: {
        readonly sdk: string;
        readonly wasm: string;
    } | null;
}
/** Options for {@link BuiltinBridge.connect}. */
interface BridgeConnectOptions {
    /**
     * When true (recommended for production), verify every component in
     * COMPONENT_META against the registry at connect time and throw a single
     * aggregated diagnostic if any bindings are missing. When false (default,
     * legacy-compatible), pre-populate the method cache for whatever bindings
     * exist and let per-component lookups throw on demand — this keeps
     * partial mock registries used in unit tests working unchanged.
     */
    readonly strict?: boolean;
    /**
     * Fast-path memory backend. Omit on web/emscripten: `connect` derives a
     * {@link WasmMemoryProvider} from `module`. The native (embedded-Dawn) runtime
     * injects a {@link NativeMemoryProvider} here — there is no wasm module, so the
     * bridge reaches components through the host's `es_<Component>_buffer` bindings.
     */
    readonly memory?: MemoryProvider;
    /**
     * The world-transform composition seam, for a core with no emscripten module.
     * `epoch` is a one-word view over the engine's staleness counter and `ensure`
     * composes; the web build reads both off `module`. Without it a producer's
     * announcement goes nowhere and nothing ever recomposes.
     */
    readonly transformComposition?: TransformComposition;
}
/** The two halves of the composition seam a core has to expose. */
interface TransformComposition {
    readonly epoch: Uint32Array;
    ensure(): void;
    /** Optional third: what the last composition changed. A core that cannot
     *  report it leaves every consumer to rebuild, which is a capability
     *  difference and not a failure. */
    setChangeTracking?(on: boolean): void;
    compositionChanges?(): NativeComposition;
    takeChanges?(): void;
}
/** What a core answers about the compositions since the last acknowledgement. */
interface NativeComposition {
    readonly serial: number;
    readonly tracking: boolean;
    readonly overflowed: boolean;
    readonly count: number;
    readonly visited: number;
    readonly changed: ArrayBuffer | null;
}
/**
 * The pending change set, as a consumer reads it. `overflowed` means it grew
 * past the point where reading the world again is cheaper, so it was dropped —
 * rebuild rather than apply.
 */
interface CompositionDelta {
    readonly serial: number;
    readonly changed: Uint32Array;
    readonly visited: number;
    readonly overflowed: boolean;
    /** Whether anything is asking for the set at all. */
    readonly tracking: boolean;
}
declare class BuiltinBridge {
    private cppRegistry_;
    private module_;
    private transformEpochWord_;
    private transformComposition_;
    private memory_;
    private builtinMethodCache_;
    private extraMethodCache_;
    private builtinEntitySets_;
    /**
     * Bind to a C++ Registry.
     *
     * Production call sites should pass `{ strict: true }` so the bridge
     * verifies that every component declared in COMPONENT_META has its four
     * bindings (add/get/has/remove) and throws a single aggregated diagnostic
     * if any are missing. This surfaces drift between the WASM build and the
     * generated metadata at startup rather than on first component use.
     *
     * In non-strict mode (default, used by unit tests with partial mock
     * registries) the cache is pre-populated for whatever bindings exist and
     * individual `getBuiltinMethods()` calls throw lazily on missing ones.
     */
    connect(cppRegistry: CppRegistry, module?: ESEngineModule, options?: BridgeConnectOptions): void;
    disconnect(): void;
    /**
     * Say that composed world transforms are stale. Called for a write to a
     * local transform field or to the hierarchy — never for `worldPosition` and
     * friends, which are the composition's own output.
     */
    invalidateTransformComposition(): void;
    /** Compose if any producer invalidated since the last one; O(1) otherwise. */
    ensureTransformsComposed(): void;
    /**
     * Ask composition to record which entities' output changed. Answers whether
     * this core can: one that cannot leaves a consumer to rebuild every time.
     */
    setTransformChangeTracking(on: boolean): boolean;
    /**
     * What every composition since the last acknowledgement changed, or null from
     * a core that cannot report. The ids VIEW engine memory and the next
     * composition may move it, so a consumer reads, applies and acknowledges
     * within one turn.
     */
    compositionChanges(): CompositionDelta | null;
    /** Acknowledge the pending set: it starts again. */
    takeCompositionChanges(): void;
    /** @internal What the staleness counter reads, for the fixtures that assert
     *  a producer notified. */
    transformEpoch(): number;
    get hasCpp(): boolean;
    getCppRegistry(): CppRegistry | null;
    getWasmModule(): ESEngineModule | null;
    /**
     * Describe the current binding state without throwing. Useful for
     * diagnostics and tests that want to inspect coverage.
     */
    verify(): BridgeVerification;
    private verifyAgainst_;
    getBuiltinMethods(cppName: string): BuiltinMethods;
    private resolveAndCache_;
    /** @internal One core call for all generated builtin memberships, when supported. */
    componentNames(entity: Entity): string[] | null;
    /** @internal Bindings outside the generated membership query. */
    getExtraMethodCache(): ReadonlyMap<string, BuiltinMethods>;
    getMethodCache(): Map<string, BuiltinMethods>;
    /**
     * Every engine pool's version in one number, or null where this build cannot
     * be asked (no registry, or an artifact older than the binding). Null means
     * "assume everything moved": a holder of addresses must re-resolve rather
     * than trust a number it could not read.
     */
    layoutEpoch(): number | null;
    getEntitySet(cppName: string): Set<Entity> | undefined;
    getOrCreateEntitySet(cppName: string): Set<Entity>;
    /** Re-order every builtin entity set so queries iterate in rank order
     *  (the JS half of {@link World.applyEntityOrder}; the engine's own pools are
     *  permuted by the same call). */
    reorderEntitySets(rankOf: RankOf): void;
    /** Removes the entity from every builtin set; returns the cppNames it was in. */
    deleteFromEntitySets(entity: Entity): string[];
    insert<T>(entity: Entity, component: BuiltinComponentDef<T>, data?: Partial<T>): {
        merged: T;
        isNew: boolean;
    };
    /**
     * Hand a component's whole value to C++, converting the fields embind cannot
     * take as a JS array. The write `insert` performs, without its structural
     * bookkeeping — so a replace cannot marshal differently from an add.
     */
    replace(entity: Entity, cppName: string, payload: Record<string, unknown>, entityFields?: readonly string[]): void;
    get<T>(entity: Entity, component: BuiltinComponentDef<T>): T;
    has(entity: Entity, component: BuiltinComponentDef<any>): boolean;
    remove(entity: Entity, component: BuiltinComponentDef<any>): void;
    /**
     * Where `cppName`'s bytes are for an entity: what compiled code adds an EHT
     * offset to. Through the {@link MemoryProvider}, the seam the fast
     * accessors already use — an address resolved a second way can disagree.
     * Null where this backend serves no flat memory.
     */
    resolveComponentAddress(cppName: string): ((entity: Entity) => number | undefined) | null;
    /**
     * The wasm-exported pointer function for `cppName` — `(entity) => byte offset
     * of that entity's component in the wasm heap`. Web/emscripten only (there is
     * no such numeric address on native); the fast path itself goes through the
     * {@link MemoryProvider}, so this is a lower-level convenience.
     */
    resolvePtrFn(cppName: string): ((entity: Entity) => number) | null;
    resolvePtrSetter(cppName: string): ((entity: Entity, data: unknown) => void) | null;
    /**
     * A getter reading C++ component data out of the wasm heap. `borrowed` (the
     * default) refills ONE object per call, so the value dies at the next call;
     * `retained` fills a fresh one, which is what a caller keeping the value past
     * its own step needs — a query row outliving the row after it, above all.
     */
    resolvePtrGetter(cppName: string, mode?: 'borrowed' | 'retained'): ((entity: Entity) => unknown) | null;
}

/**
 * @file    ScriptPool.ts
 * @brief   Flat storage for a script component whose fields are all scalars.
 *
 * @details A `defineComponent` component is a JS object per entity, which is
 *          fine for the interpreter and impossible for compiled code: a compiled
 *          system reaches a component by ADDRESS, and a JS object has none. So a
 *          component whose defaults are entirely numbers and booleans is stored
 *          in one Float64Array instead, and what callers hold is a live view
 *          onto a row of it.
 *
 *          The layout is the ABI's, not one chosen here: declaration order, one
 *          f64 per field, which is what `packLayout` gives a `host` shape. That
 *          agreement is a contract with the compiler and a test holds it.
 *
 *          A view is LIVE, and for script components that changes nothing: the
 *          query already yields the stored object itself and `writeMutBack_`
 *          only records a Changed tick for them. Writing through a setter is the
 *          same write it always was, one indirection later.
 */

/** What a pooled field holds. Booleans are 0/1 in the slot, `true`/`false` out. */
type PoolKind = 'number' | 'boolean';
interface PoolField {
    readonly name: string;
    readonly kind: PoolKind;
}
/** A byte range the pool was given, and where it starts in the host's memory. */
interface PoolBlock {
    readonly buffer: ArrayBufferLike;
    readonly byteOffset: number;
    readonly byteLength: number;
}
/**
 * Where a pool's storage is allocated FROM. The default is the JS heap, which
 * suits a native host: same process, real address. A wasm host must pass linear
 * memory, because compiled code inside the module cannot reach a JS-heap array —
 * and unreachable is what rows exist to stop being.
 */
interface PoolMemory {
    /** Stable allocator ownership, not merely a buffer. Compatible wrappers may
     * reuse existing rows without moving them to a different allocation domain. */
    readonly allocatorIdentity?: object;
    alloc(bytes: number): PoolBlock;
    release(block: PoolBlock): void;
    /**
     * The block's buffer as it is NOW. A wasm heap that grows DETACHES the one
     * handed out at `alloc` while the bytes stay at the same offset, so a pool
     * that held the old object would read undefined and never say why.
     */
    current?(block: PoolBlock): ArrayBufferLike;
}
interface PoolAssetRefs {
    fields(): readonly {
        readonly field: string;
    }[];
    addressChanged(): void;
}
/**
 * Rows of one component, and a view per live entity. Slots come from a free list
 * rather than being compacted, so a view stays valid while its entity carries
 * the component: an index that moved under a held view is a bug that surfaces
 * three frames later. Iteration order lives in the map that holds the views.
 */
declare class ScriptPool {
    private readonly memory_;
    private readonly assetRefs_?;
    readonly fields: readonly PoolField[];
    /** Bytes per row, and what the ABI's `stride` must agree with. */
    readonly stride: number;
    private rows_;
    private slots_;
    private sparseBlock_;
    /** Entity index -> slot + 1, so zero means absent. The engine's sparse set
     *  in the same shape, and the reason a host needs no call to resolve a row. */
    private sparse_;
    private sparseLen_;
    private ownersBlock_;
    /** Slot -> the entity holding it, so a host can ask WHO is in this column.
     *  The sparse table answers the other direction and cannot answer this one,
     *  and without it a compiled system has to be offered every entity alive. */
    private owners_;
    private capacity_;
    private readonly slotOf_;
    private readonly views_;
    private readonly free_;
    private next_;
    private refs_;
    private disposed_;
    get disposed(): boolean;
    dispose(): void;
    private assertOpen_;
    constructor(fields: readonly PoolField[], capacity?: number, memory_?: PoolMemory, assetRefs_?: PoolAssetRefs | undefined);
    /**
     * What a host needs to resolve this component WITHOUT calling back: rows at
     * a constant stride, and a sparse table saying which slot an entity is in.
     * Every address is in the memory the pool allocated from.
     *
     * Valid until the next growth, which is per call anyway.
     */
    span(): {
        rows: number;
        stride: number;
        sparse: number;
        sparseCount: number;
        owners: number;
        ownerCount: number;
    };
    /** The current sparse view. Retrieve it again after pool or heap growth;
     *  a held typed array cannot follow replacement or detached memory. */
    get sparseTable(): Uint32Array;
    /**
     * Rebuild the views over whatever buffer the blocks are in now: a grown wasm
     * heap leaves the bytes at the same offsets but detaches every view of the
     * old ArrayBuffer. Cheap and idempotent, so call it when unsure — the
     * per-entity views read `slots_` on access and need no rebuild.
     */
    refresh(): void;
    /** Every view of this pool's storage, made in ONE place. Anything that can
     *  have detached a view calls this rather than fixing up the one it knows
     *  about — the heap grows for all of them at once. */
    private rebuild_;
    private bufferOf_;
    private ensureCurrent_;
    /** The current row view. Retrieve it again after pool or heap growth.
     *  Pool growth moves row addresses; foreign heap growth detaches views
     *  while allocation addresses stay unchanged. */
    get buffer(): Float64Array;
    get size(): number;
    get hasPortableAssetRefs(): boolean;
    /** Byte offset of `entity`'s row inside `buffer`. */
    baseOf(entity: Entity): number | undefined;
    /**
     * The address a host hands to compiled code: the row's offset in the memory
     * the pool allocated from, not in the pool's own view. The two differ by
     * `byteOffset` once the rows are carved out of a larger block. Valid until
     * the next growth, which a one-call lifetime requires anyway.
     */
    address(entity: Entity): number | undefined;
    has(entity: Entity): boolean;
    /** The live view, or undefined when the entity does not carry this. */
    get(entity: Entity): Record<string, unknown> | undefined;
    /**
     * Give `entity` a row seeded from `defaults` and overlaid with `data`, or
     * overwrite the fields `data` names on the row it already has. Returns the
     * view either way, and whether the row is new.
     */
    put(entity: Entity, defaults: Record<string, unknown>, data?: Record<string, unknown>): {
        view: Record<string, unknown>;
        isNew: boolean;
    };
    delete(entity: Entity): boolean;
    entities(): IterableIterator<Entity>;
    private claim_;
    private mark_;
    private growRows_;
    /** The sparse table is indexed by ENTITY INDEX, which the world hands out
     *  and this pool does not control, so it grows on its own schedule. */
    private reserveSparse_;
    private writeAll_;
    private writeSome_;
    private writeValue_;
    /** One object per entity, with an accessor per field onto its row. */
    private makeView_;
}

/**
 * @file    ScriptStorage.ts
 * @brief   TypeScript-side component storage for user-defined (non-builtin) components
 */

interface InsertResult<T> {
    value: T;
    isNew: boolean;
}
declare class ScriptStorage {
    private tsStorage_;
    private entityComponents_;
    /**
     * Components held as rows rather than objects, by id. A component qualifies
     * when its defaults are all scalars, which is exactly the set a compiled
     * system can reach — a compiled system addresses a component, and a JS
     * object has no address.
     */
    private pools_;
    private poolMemory_;
    private releasingPools_;
    releasePools(): void;
    /**
     * @internal Where pools allocate from. A wasm runtime installs one backed by
     * linear memory before any component is added, because compiled code cannot
     * reach a JS-heap array; a native one leaves the default.
     */
    /**
     * Bumped whenever a pooled row is claimed, released, or moved by a growth —
     * i.e. whenever an address this storage handed out may have stopped meaning
     * what it meant. The engine's own pools answer the same question through
     * `Registry::layoutEpoch`; a caller that holds addresses reads both.
     */
    get layoutEpoch(): number;
    private layoutEpoch_;
    usePoolMemory(memory: PoolMemory, validateOnly?: boolean): void;
    /** @internal The rows behind `component`, or undefined if it has none. */
    poolFor(id: symbol): ScriptPool | undefined;
    hasPortableAssetRefs(id: symbol): boolean;
    /**
     * @internal Re-view every pool. A wasm heap grows for one pool and detaches
     * the views of all of them, so this is a set operation and not a per-pool
     * one. Idempotent: a caller that is unsure may call it.
     */
    refreshPools(): void;
    /**
     * The pool `component` uses, creating it on first sight. `null` once for a
     * shape that cannot be flat, and remembered as null so the check is not
     * repeated per insert.
     */
    private pool_;
    private notPooled_;
    insert<T>(entity: Entity, component: ComponentDef<T>, data?: unknown): InsertResult<T>;
    /**
     * Record that `entity` carries `component`. The index and the per-component
     * maps are one membership fact, so every write that adds a component has to
     * come through here or `getEntityComponentIds` starts answering a subset.
     */
    private note_;
    get<T>(entity: Entity, component: ComponentDef<T>): T;
    has<T>(entity: Entity, component: ComponentDef<T>): boolean;
    remove<T>(entity: Entity, component: ComponentDef<T>): void;
    /**
     * Store a whole value, answering whether the entity lacked the component —
     * the caller owns the structural bookkeeping an addition needs. Invalid data
     * warns rather than throwing as `insert` does: a scene load and the reconciler
     * write through here, where one bad field must not take a frame down.
     */
    set(entity: Entity, component: ComponentDef<any>, data: unknown): {
        isNew: boolean;
    };
    getStorage(component: ComponentDef<any>): Map<Entity, unknown>;
    getStorageById(id: symbol): Map<Entity, unknown> | undefined;
    getEntityComponentIds(entity: Entity): Set<symbol> | undefined;
    /** Re-order every component's storage so queries iterate in rank order — the
     *  script half of {@link World.applyEntityOrder}. */
    reorderStorages(rankOf: RankOf): void;
    removeEntity(entity: Entity): symbol[];
    /**
     * @internal Live map sizes for the resource census.
     *
     * `storages` counts component types ever stored and never shrinks by design
     * (an emptied storage is kept for reuse), so the census tracks it as bounded
     * while `rows` and `entities` are the conserved pair.
     */
    sizes(): {
        storages: number;
        rows: number;
        entities: number;
    };
}

/**
 * @file    NameIndex.ts
 * @brief   Bidirectional name-to-entity index
 */

declare class NameIndex {
    private nameToEntities_;
    private entityToName_;
    update(entity: Entity, name: string): void;
    remove(entity: Entity): void;
    findByName(name: string): Entity | null;
    /** @internal Live map sizes for the resource census. */
    sizes(): {
        names: number;
        entities: number;
    };
    private unlink_;
}

/**
 * @file    ChangeTracker.ts
 * @brief   Tracks per-component add/change/remove ticks for change detection queries
 */

declare class ChangeTracker {
    private worldTick_;
    private componentAddedTicks_;
    private componentIncarnations_;
    private nextIncarnation_;
    private componentChangedTicks_;
    private componentAddedSequences_;
    private componentChangedSequences_;
    private changeSequence_;
    private revision_;
    private readonly revisions_;
    private readonly removals_;
    /** Membership moves, independent of ordinary change tracking. */
    private readonly topology_;
    /**
     * Components WRITTEN, for a consumer that needs to enumerate them sparsely.
     * `isChangedSince` answers about one entity at a time; finding which entities
     * changed through it means walking the per-entity map, which is the O(E) a
     * candidate consumer is trying to avoid.
     */
    private readonly writes_;
    private trackedComponents_;
    private componentLastChangedTick_;
    private nextReaderId_;
    advanceTick(): void;
    getWorldTick(): number;
    enableChangeTracking(component: AnyComponentDef): void;
    enableChangeSequenceTracking(component: AnyComponentDef, added: boolean): void;
    getChangeSequence(): number;
    resolveChangeSequenceMatcher(component: AnyComponentDef, added: boolean): (entity: Entity, after: number) => boolean;
    isAddedAfterSequence(entity: Entity, component: AnyComponentDef, after: number): boolean;
    isChangedAfterSequence(entity: Entity, component: AnyComponentDef, after: number): boolean;
    anyAddedAfterSequence(component: AnyComponentDef, after: number): boolean;
    anyChangedAfterSequence(component: AnyComponentDef, after: number): boolean;
    enableIncarnationTracking(component: AnyComponentDef): void;
    getComponentIncarnation(entity: Entity, component: AnyComponentDef): number;
    isAddedSince(entity: Entity, component: AnyComponentDef, sinceTick: number): boolean;
    isChangedSince(entity: Entity, component: AnyComponentDef, sinceTick: number): boolean;
    /** True if ANY entity changed `component` after `sinceTick`. O(1) — reads the
     *  per-component last-changed tick, not the per-entity map. */
    anyChangedSince(component: AnyComponentDef, sinceTick: number): boolean;
    getRemovedEntitiesSince(component: AnyComponentDef, sinceTick: number): Entity[];
    /**
     * Entities whose MEMBERSHIP in `component` moved after `sinceTick` — gained
     * or lost, and deliberately not saying which. A consumer re-reads the world
     * to find out; this only says who is worth re-reading.
     */
    getTopologyChangedEntitiesSince(component: AnyComponentDef, sinceTick: number): Entity[];
    registerMutationCursor(component: AnyComponentDef, kind: 'write' | 'topology'): number;
    mutationSequence(kind: 'write' | 'topology'): number;
    mutationsForCursor(component: AnyComponentDef, kind: 'write' | 'topology', reader: number): Entity[];
    advanceMutationCursor(component: AnyComponentDef, kind: 'write' | 'topology', reader: number, through: number): void;
    disposeMutationCursor(component: AnyComponentDef, kind: 'write' | 'topology', reader: number): void;
    private mutationJournal_;
    mutationRevision(component: AnyComponentDef, kind: 'write' | 'topology'): number;
    private recordRevision_;
    registerTopologyReaderFrom(component: AnyComponentDef, retainFromTick: number): number;
    advanceTopologyReader(component: AnyComponentDef, readerId: number, lastRunTick: number): void;
    disposeTopologyReader(component: AnyComponentDef, readerId: number): void;
    /** @internal How many readers hold `component`'s membership journal. */
    topologyReaderCount(component: AnyComponentDef): number;
    /** Entities whose `component` was written after `sinceTick`. Says nothing
     *  about WHICH field, or whether the value actually differs. */
    getWrittenEntitiesSince(component: AnyComponentDef, sinceTick: number): Entity[];
    bufferedWriteRows(component: AnyComponentDef): number;
    registerWriteReaderFrom(component: AnyComponentDef, retainFromTick: number): number;
    advanceWriteReader(component: AnyComponentDef, readerId: number, lastRunTick: number): void;
    disposeWriteReader(component: AnyComponentDef, readerId: number): void;
    /** @internal How many readers hold `component`'s write journal. */
    writeReaderCount(component: AnyComponentDef): number;
    /**
     * A tick-based claim for windows after the current tick. System queries
     * use a cursor instead, distinguishing events within the same tick.
     */
    registerRemovedReader(component: AnyComponentDef): number;
    registerRemovedCursorReader(component: AnyComponentDef): number;
    getRemovalSequence(): number;
    getRemovedEntitiesForReader(component: AnyComponentDef, readerId: number): Entity[];
    advanceRemovedCursorReader(component: AnyComponentDef, readerId: number, through: number): void;
    /**
     * A claim starting at an explicit tick, for a reader whose window is not
     * "since I last ran". A sampler that reads with a one-tick overlap must
     * claim from that same floor, or another reader's prune can take a row it
     * was always going to ask for.
     */
    registerRemovedReaderFrom(component: AnyComponentDef, retainFromTick: number): number;
    /**
     * This reader has finished a run whose window ended at `lastRunTick`, so it
     * will never ask for a row at or before it again. Tick-based samplers read
     * `tick > lastRunTick`, which is why the claim is the tick after.
     */
    advanceRemovedReader(component: AnyComponentDef, readerId: number, lastRunTick: number): void;
    /** Give up the claim, and let the watermark move at once — history with no
     *  owner is not history anyone can ask for. */
    disposeRemovedReader(component: AnyComponentDef, readerId: number): void;
    /** @internal How many readers hold `component`'s history — for the fixtures
     *  that assert a disposed reader stopped pinning it. */
    removedReaderCount(component: AnyComponentDef): number;
    recordAdded(component: AnyComponentDef, entity: Entity): void;
    /**
     * Whether anything is asking about this component's changes. `recordChanged`
     * self-gates on the same answer; this exists so a caller marking a whole
     * query's worth of entities can ask ONCE instead of per entity.
     */
    isTracked(component: AnyComponentDef): boolean;
    recordChanged(component: AnyComponentDef, entity: Entity): void;
    private recordSequence_;
    recordRemoved(component: AnyComponentDef, entity: Entity): void;
    /**
     * The gate lives here rather than in each caller: despawn reaches script
     * components through this id-only entry point and builtins through
     * recordRemoved, and when only the latter checked, the same despawn was
     * recorded for one kind and dropped for the other.
     */
    recordRemovedById(componentId: symbol, entity: Entity): void;
    /**
     * @internal Live map sizes for the resource census.
     *
     * `removedRows` is bounded by what registered readers still owe: rows exist
     * only while a `Removed` reader holds the component, and are pruned to the
     * lowest claim whenever one advances or goes away.
     */
    sizes(): {
        tracked: number;
        addedRows: number;
        changedRows: number;
        removedRows: number;
        sequenceRows: number;
    };
}

/**
 * @file    QueryCache.ts
 * @brief   Component-aware query result cache with fine-grained invalidation
 */

/** Cumulative counters for query-cache activity (observability only). */
interface QueryCacheStats {
    /** Lookups that returned a still-valid cached result. */
    readonly hits: number;
    /** Lookups that recomputed — either no entry or stale. */
    readonly misses: number;
    /** Times an entry was rejected because one of its dep components changed. */
    readonly componentInvalidations: number;
    /** Current number of entries held. */
    readonly size: number;
}
declare class QueryCache {
    private structuralVersion_;
    private componentVersions_;
    private cache_;
    private hits_;
    private misses_;
    private componentInvalidations_;
    get structuralVersion(): number;
    markStructuralChange(): void;
    /** A component's current version — for a derived set that has to recompute
     *  when it moves, without standing up a second invalidation scheme. */
    componentVersion(componentId: symbol): number;
    markComponentDirty(componentId: symbol): void;
    /**
     * Drop every cached result. For changes no per-component version describes —
     * a reorder (see World.applyEntityOrder) moves entities within results that are
     * otherwise still correct, so nothing else would recompute them.
     */
    invalidateAll(): void;
    getOrCompute(cacheKey: string, dependentComponentIds: symbol[], computeFn: () => Entity[]): Entity[];
    /** Snapshot of counters. Read-only; callers can diff across frames. */
    getStats(): QueryCacheStats;
    /** Reset counters without dropping cached entries. */
    resetStats(): void;
    /** True when every dependent component is unchanged since the entry was cached. */
    private checkValidity_;
}

/**
 * @file    world.ts
 * @brief   ECS World with C++ Registry integration
 */

/**
 * Predicate-based filter applied after the positive/negative component
 * checks. Callers (typically `QueryInstance`) compile an expression tree
 * into a `match` closure plus a list of components the tree reads so the
 * query cache can invalidate on structural changes to any of them.
 */
interface QueryFilter {
    readonly match: (entity: Entity) => boolean;
    readonly deps: readonly AnyComponentDef[];
}
/** @internal Loads the asset paths an engine-backed component was handed; see World.setAssetFieldResolver. */
type AssetFieldResolver = (entity: Entity, component: AnyComponentDef, authored: Record<string, unknown>) => void;
/**
 * The entity store, as `GetWorld()` hands it to a system — the escape hatch for
 * work the declared parameters cannot express. Prefer `Query`/`Res`/`Commands`:
 * those declare their access, so the scheduler can see it and the cache can serve
 * them. The frozen surface here is what a game does with entities; what the frame
 * runner, the query cache and the editor's projection need is `@internal`.
 *
 * @public
 */
declare class World {
    private readonly builtin_;
    private readonly scripts_;
    private readonly names_;
    /** @internal */
    readonly changes_: ChangeTracker;
    /** @internal */
    readonly queries_: QueryCache;
    /** @see inactiveEntities_ */
    private inactive_;
    private inactiveVersion_;
    private coreActivityEpoch_;
    private readonly coreDisconnect_;
    private entities_;
    private indexGeneration_;
    private iterationDepth_;
    private queryCostEnabled_;
    private nextEntityIndex_;
    private nextGeneration_;
    private spawnCallbacks_;
    private despawnCallbacks_;
    private assetFieldResolver_;
    private despawning_;
    /** @internal */
    get builtin(): BuiltinBridge;
    /**
     * Bind this world to an engine core. The embedding contract, not the game
     * one: a host instantiates the module and calls this, and everything below
     * reaches the same registry through {@link getCppRegistry}.
     *
     * @internal
     */
    connectCpp(cppRegistry: CppRegistry, module?: ESEngineModule, options?: BridgeConnectOptions): void;
    /** @internal */
    disconnectCpp(): void;
    /** @internal Whether an engine core is bound — false in a pure-JS world. */
    get hasCpp(): boolean;
    /** @internal */
    getCppRegistry(): CppRegistry | null;
    /** @internal Release native leases before the owning core is disconnected. */
    onCoreDisconnect(dispose: () => void): () => void;
    private notifyCoreDisconnect_;
    /** @internal Refresh membership mirrors after an observed native mutation. */
    refreshBuiltinMembership(entity: Entity, component: AnyComponentDef): void;
    /** @internal */
    getWasmModule(): ESEngineModule | null;
    /**
     * Create an entity with no components. Throws during query iteration —
     * mutating the set a query is walking is what `Commands` exists to defer.
     */
    spawn(name?: string): Entity;
    /**
     * @internal An identity for a spawn {@link Commands} will apply later — what
     * `cmds.spawn(...).id()` answers while a query is running. Allowed mid-iteration
     * because it touches no component storage: a bare id is in no query. The spawn
     * itself (name, components, spawn callbacks) happens at
     * {@link commitReservedSpawn}, when the commands flush.
     */
    reserveEntity(): Entity;
    /** @internal Finish a spawn begun by {@link reserveEntity}. */
    commitReservedSpawn(entity: Entity, name?: string): void;
    private allocateEntity_;
    private commitSpawn_;
    /**
     * Destroy `entity` and its whole subtree — children before parents, so none
     * is left orphaned and still drawing. Already-gone entities are ignored, and
     * as with {@link spawn} this throws during query iteration.
     */
    despawn(entity: Entity): void;
    /** Depth-first teardown of `entity` and its descendants (children before parent). */
    private despawnSubtree_;
    private abortedReported_;
    private despawnOne_;
    /**
     * Run `callback` whenever an entity is created; the returned function
     * unsubscribes. A throw is logged and swallowed, so one bad listener cannot
     * stop the others or the spawn itself.
     */
    onSpawn(callback: (entity: Entity) => void): () => void;
    /**
     * Run `callback` whenever an entity is destroyed, once per entity in a
     * subtree teardown; the returned function unsubscribes. This is the hook a
     * per-entity side table is cleaned up from.
     */
    onDespawn(callback: (entity: Entity) => void): () => void;
    /** Whether `entity` currently exists. False for one never spawned and for a
     *  despawned one alike — {@link isStale} tells the two apart. */
    valid(entity: Entity): boolean;
    /** @internal True throughout subtree teardown, including queued ancestors. */
    isDestructionPending(entity: Entity): boolean;
    /** Effective activity, including ancestors; unlike valid(), an inactive
     * entity remains available for inspection, cleanup and serialization. */
    isEntityActive(entity: Entity): boolean;
    /**
     * True if `entity` refers to a slot that has been recycled — its index is
     * currently live, but held by a *different* generation. Useful for
     * diagnostic logs: `valid()` alone can't distinguish "never existed" from
     * "was despawned and its slot reassigned" since both return false.
     */
    isStale(entity: Entity): boolean;
    /** How many entities exist. */
    entityCount(): number;
    /**
     * @internal Live sizes of every map the world keeps, for the resource census.
     *
     * `indexSlots` never shrinks by design — it is keyed by entity INDEX, which
     * the registry recycles, so it settles at the session's peak. One that keeps
     * climbing means indices are not being reused, which entityCount() cannot show.
     */
    getStorageSizes(): {
        entities: number;
        indexSlots: number;
        spawnCallbacks: number;
        despawnCallbacks: number;
        coreDisconnectCallbacks: number;
        names: ReturnType<NameIndex['sizes']>;
        scripts: ReturnType<ScriptStorage['sizes']>;
        changes: ReturnType<ChangeTracker['sizes']>;
        queryCacheEntries: number;
    };
    /** @internal Structural version the query cache invalidates against. */
    getWorldVersion(): number;
    /** @internal Cumulative query-cache counters (hits, misses, invalidation causes). */
    getQueryCacheStats(): QueryCacheStats;
    /** @internal Reset the query-cache counters. Entries themselves are kept. */
    resetQueryCacheStats(): void;
    /**
     * @internal Whether queries count what they scan. Per-World rather than a
     * module flag: the editor realm and the play realm are separate Apps in one
     * process, and a shared switch would have each turn the other's accounting on.
     */
    setQueryCostEnabled(enabled: boolean): void;
    /** @internal */
    get queryCostEnabled(): boolean;
    /** @internal Iteration depth is what makes spawn/despawn refuse mid-query. */
    beginIteration(): void;
    /** @internal */
    endIteration(): void;
    /** @internal Depth is reset rather than unwound when a frame aborts. */
    resetIterationDepth(): void;
    /**
     * @internal Set the guard aside for a system suspended at an `await`, and
     * give it back when that system resumes.
     *
     * The depth is the WORLD's, and a system parked mid-query would otherwise
     * lend its iteration to whoever runs next: their spawn is refused for an
     * iteration that is not theirs, and their reset frees a query still walking.
     */
    suspendIteration(): number;
    /** @internal Pairs with {@link suspendIteration}. */
    resumeIteration(depth: number): void;
    /** @internal */
    isIterating(): boolean;
    /** Every entity, in storage order — which is the order queries walk and,
     *  within a sorting layer, the order the renderer draws. A fresh array. */
    getAllEntities(): Entity[];
    /**
     * Reorder the world's storage so every iteration follows `entities`.
     *
     * Within a sorting layer the renderer draws in the order it walks the ECS —
     * so an entity that iterates later lands on top. That order is storage order,
     * which a scene gets for free by spawning in its authored order and which this
     * re-establishes on a world that is already populated: the picture a reload
     * would give, without respawning anything (entity ids, component values and
     * every subsystem keyed on them survive untouched).
     *
     * Entities left out of `entities` keep their relative order after the listed
     * ones. Both halves of the world move together — the engine's component pools
     * and the JS-side storages the SDK's own queries walk — so an editor's outliner
     * drag and a game's "bring this card to the front" mean one thing.
     *
     * @param entities the desired iteration order (first iterates first, draws first)
     */
    /** @internal */
    applyEntityOrder(entities: readonly Entity[]): void;
    /** Marshal the order to whichever core is connected (see applyEntityOrder). */
    private pushEntityOrderToCore_;
    /** Keep {@link Parent} and {@link Children} consistent when reparenting. */
    setParent(child: Entity, parent: Entity): void;
    /** Reject invalid relationships without changing hierarchy or notifications. */
    trySetParent(child: Entity, parent: Entity): boolean;
    /** Detach `entity` from its parent, leaving its own children attached to it. */
    removeParent(entity: Entity): void;
    /** `entity`'s children, snapshotted out of the wasm vector that holds them. */
    private childEntitiesOf_;
    private insertHierarchy_;
    private isHierarchyComponent_;
    private trackHierarchyWrite_;
    /**
     * Add `component` to `entity`, with `data` merged over the component's
     * defaults, and answer the stored value. Adding one that is already there
     * replaces it.
     */
    insert<C extends AnyComponentDef>(entity: Entity, component: C, data?: Partial<ComponentData<C>>): ComponentData<C>;
    /**
     * Store a whole component value and stamp the change tick a `Changed` filter
     * reads. Insert-or-replace: an entity that lacks the component gets it.
     */
    set<C extends AnyComponentDef>(entity: Entity, component: C, data: ComponentData<C>): void;
    /**
     * @internal What turns an asset path written into an engine-backed
     * component's handle field (`Sprite.texture = 'assets/hero.png'`,
     * `MeshRenderer.mesh = 'builtin:cube'`) into the handle. Installed by the
     * asset layer on every core; see bindAssetReferenceTracking.
     */
    setAssetFieldResolver(resolver: AssetFieldResolver | null): void;
    /**
     * An engine-backed component's asset fields hold handles, and the engine
     * cannot store a string there: written straight through, `texture` read
     * back as the path while the engine held 0, and nothing drew. A string in
     * one is a path to load — the same ref a scene file carries — so it leaves
     * the data here (the field takes its default until the load lands) and goes
     * to the resolver.
     */
    private takeAssetRefs_;
    private resolveAssetRefs_;
    /**
     * Edit a component in place and report the change — the write path for
     * "read it, adjust a field, keep the rest". The draft is BORROWED for the
     * call, and for a script component it IS the stored object, so nothing may
     * keep it. Reporting is unconditional; a false positive costs one look.
     *
     * @throws if `entity` does not carry `component`.
     */
    update<C extends AnyComponentDef>(entity: Entity, component: C, edit: (draft: ComponentData<C>) => void): void;
    /**
     * The component's value, to READ. Writing to the result is deprecated: it
     * stores nothing for an engine-backed component and changes a script one
     * with nothing observing it — use {@link update}, {@link set} or `Mut()`.
     * Asking for a component the entity lacks throws; {@link tryGet} allows it.
     */
    get<C extends AnyComponentDef>(entity: Entity, component: C): ComponentData<C>;
    /** Whether `entity` carries `component`. */
    has(entity: Entity, component: AnyComponentDef): boolean;
    /** {@link get}, answering null instead of throwing when the component is
     *  absent. Reading only, on the same terms — writing to the result is
     *  deprecated; {@link update} is the edit. */
    tryGet<C extends AnyComponentDef>(entity: Entity, component: C): ComponentData<C> | null;
    /** Take `component` off `entity`. Throws during query iteration, as
     *  {@link spawn} does. */
    remove(entity: Entity, component: AnyComponentDef): void;
    private insertBuiltin_;
    private insertScript_;
    private removeScript_;
    /** The entity with this {@link Name}, or null. Names are not identities —
     *  with two matches, which one comes back is not defined. */
    findEntityByName(name: string): Entity | null;
    /** @internal Pre-resolve a component to its direct storage/getter for fast iteration. */
    resolveGetter(component: AnyComponentDef, mode?: 'borrowed' | 'retained'): ((entity: Entity) => unknown) | null;
    /** @internal Pre-resolve a component to a direct has-check for fast query matching. */
    resolveHas(component: AnyComponentDef): ((entity: Entity) => boolean) | null;
    /** @internal Pre-resolve a component to a direct setter for fast Mut write-back. */
    resolveSetter(component: AnyComponentDef): ((entity: Entity, data: unknown) => void) | null;
    /** @internal Per-frame reuse of the query instance pool. */
    resetQueryPool(): void;
    /** The names of every component on `entity` — for inspectors and diagnostics;
     *  a system asks {@link has} about the definitions it knows. */
    getComponentTypes(entity: Entity): string[];
    /** @internal Inspect a group with one script catalogue index, preserving input order. */
    getComponentTypesBatch(entities: readonly Entity[]): string[][];
    private componentTypes_;
    /**
     * Every entity switched off, ITSELF or by an ancestor.
     *
     * Derived, not tagged down the tree: a scene that wrote the tag on each
     * descendant would lose which of them the author switched off. Recomputed
     * when the tag or the hierarchy moves; free when nothing is switched off.
     */
    private inactiveEntities_;
    private resolveStorages_;
    private collectComponentIds_;
    /**
     * Entities carrying every component in `components`, narrowed by `with` and
     * `without`. Answered from the query cache, so calling it every frame is the
     * intended use; the array is the cache's own and must not be mutated.
     *
     * @public
     */
    getEntitiesWithComponents(components: AnyComponentDef[], withFilters?: AnyComponentDef[], withoutFilters?: AnyComponentDef[]): readonly Entity[];
    /**
     * @internal The same walk, with the cache key, dependency ids and predicate
     * filter supplied by the caller. `QueryInstance` computes those once per
     * query so a cache hit allocates nothing — which is why they are not
     * parameters of the frozen door above: they are the cache's shape, and
     * freezing them would freeze it.
     */
    queryEntities(components: AnyComponentDef[], withFilters?: AnyComponentDef[], withoutFilters?: AnyComponentDef[], precomputedKey?: string, filter?: QueryFilter, precomputedDepIds?: symbol[]): readonly Entity[];
    /** @internal The frame runner's clock for change detection. */
    advanceTick(): void;
    /** @internal */
    getWorldTick(): number;
    /** @internal Opted into by a query that declares an Added/Changed filter;
     *  tracking every component would cost every write. */
    enableChangeTracking(component: AnyComponentDef): void;
    /** @internal Opt a system query into precise change boundaries, separately from tick sampling. */
    enableChangeSequenceTracking(component: AnyComponentDef, added: boolean): void;
    /** @internal Latest opted-in component mutation sequence. */
    getChangeSequence(): number;
    /** @internal Bind a live sequence index once for a system query's entity loop. */
    resolveChangeSequenceMatcher(component: AnyComponentDef, added: boolean): (entity: Entity, after: number) => boolean;
    /** @internal Live additions after a completed system boundary. */
    isAddedAfterSequence(entity: Entity, component: AnyComponentDef, after: number): boolean;
    /** @internal Live changes after a completed system boundary. */
    isChangedAfterSequence(entity: Entity, component: AnyComponentDef, after: number): boolean;
    /** @internal O(1) empty-window checks before enumerating system query candidates. */
    anyAddedAfterSequence(component: AnyComponentDef, after: number): boolean;
    /** @internal O(1) empty-window checks before enumerating system query candidates. */
    anyChangedAfterSequence(component: AnyComponentDef, after: number): boolean;
    /** @internal Opt in to live component identities, independent of frame ticks. */
    enableIncarnationTracking(component: AnyComponentDef): void;
    /** @internal Changes on remove/reinsert, including multiple edits in one tick.
     * Components present before tracking was enabled share the initial identity 0. */
    getComponentIncarnation(entity: Entity, component: AnyComponentDef): number;
    /** @internal What `Added`/`Changed` filters are implemented in terms of. */
    isAddedSince(entity: Entity, component: AnyComponentDef, sinceTick: number): boolean;
    /** @internal */
    isChangedSince(entity: Entity, component: AnyComponentDef, sinceTick: number): boolean;
    /** @internal True if ANY entity changed `component` after `sinceTick` (O(1) gate). */
    anyChangedSince(component: AnyComponentDef, sinceTick: number): boolean;
    /** @internal What a `Removed` query reads. */
    getRemovedEntitiesSince(component: AnyComponentDef, sinceTick: number): Entity[];
    /** @internal A tick-based removal lease for samples after the current tick. */
    registerRemovedReader(component: AnyComponentDef): number;
    /** @internal A removal lease starting at the current event sequence. */
    registerRemovedCursorReader(component: AnyComponentDef): number;
    /** @internal Latest removal sequence, independent of frame ticks. */
    getRemovalSequence(): number;
    /** @internal Unacknowledged removals belonging to this cursor reader. */
    getRemovedEntitiesForReader(component: AnyComponentDef, readerId: number): Entity[];
    /** @internal Release only events this run observed, preserving later removals. */
    advanceRemovedCursorReader(component: AnyComponentDef, readerId: number, through: number): void;
    /** @internal A claim from an explicit tick, for a reader that reads with an
     *  overlap rather than "since I last ran". */
    registerRemovedReaderFrom(component: AnyComponentDef, retainFromTick: number): number;
    /** @internal That reader is done with everything up to `lastRunTick`. */
    advanceRemovedReader(component: AnyComponentDef, readerId: number, lastRunTick: number): void;
    /** @internal The reader is gone; its share of the watermark goes with it. */
    disposeRemovedReader(component: AnyComponentDef, readerId: number): void;
    /** @internal How many readers hold `component`'s removal history. */
    removedReaderCount(component: AnyComponentDef): number;
    /** @internal A claim on `component`'s MEMBERSHIP journal — who gained or
     *  lost it — independent of ordinary change tracking. */
    registerTopologyReaderFrom(component: AnyComponentDef, retainFromTick: number): number;
    /** @internal A mutation cursor distinguishes writes within one world tick. */
    registerMutationCursor(component: AnyComponentDef, kind: 'write' | 'topology'): number;
    /** @internal Current boundary to acknowledge after a successful read. */
    mutationSequence(kind: 'write' | 'topology'): number;
    /** @internal Component stamps survive released mutation-history readers. */
    mutationRevision(component: AnyComponentDef, kind: 'write' | 'topology'): number;
    /** @internal Unacknowledged component mutations for this reader. */
    mutationsForCursor(component: AnyComponentDef, kind: 'write' | 'topology', reader: number): Entity[];
    /** @internal Preserve mutations that arrived after the read's boundary. */
    advanceMutationCursor(component: AnyComponentDef, kind: 'write' | 'topology', reader: number, through: number): void;
    /** @internal Release this reader's history claim. */
    disposeMutationCursor(component: AnyComponentDef, kind: 'write' | 'topology', reader: number): void;
    /** @internal Entities worth re-reading because their membership moved. */
    getTopologyChangedEntitiesSince(component: AnyComponentDef, sinceTick: number): Entity[];
    /** @internal That reader is done with everything up to `lastRunTick`. */
    advanceTopologyReader(component: AnyComponentDef, readerId: number, lastRunTick: number): void;
    /** @internal The reader is gone; its share of the watermark goes with it. */
    disposeTopologyReader(component: AnyComponentDef, readerId: number): void;
    /** @internal How many readers hold `component`'s membership journal. */
    topologyReaderCount(component: AnyComponentDef): number;
    /** @internal A claim on `component`'s WRITE journal — which entities had it
     *  written, enumerable sparsely, unlike the per-entity changed map. */
    registerWriteReaderFrom(component: AnyComponentDef, retainFromTick: number): number;
    /** @internal Entities whose `component` was written after `sinceTick`. */
    getWrittenEntitiesSince(component: AnyComponentDef, sinceTick: number): Entity[];
    /** @internal An O(1) upper bound on what `getWrittenEntitiesSince` returns,
     *  for a caller choosing between reading the journal and a scan. */
    bufferedWriteRows(component: AnyComponentDef): number;
    /** @internal That reader is done with everything up to `lastRunTick`. */
    advanceWriteReader(component: AnyComponentDef, readerId: number, lastRunTick: number): void;
    /** @internal The reader is gone; its share of the watermark goes with it. */
    disposeWriteReader(component: AnyComponentDef, readerId: number): void;
    /** @internal How many readers hold `component`'s write journal. */
    writeReaderCount(component: AnyComponentDef): number;
    /**
     * @internal One place for "this component was written".
     *
     * The composition epoch hangs off the LOGICAL mutation contract, not off the
     * storage path: `set`, `insert`, `update` and a `Mut` write-back all arrive
     * here whether or not the fast pointer setter moved the bytes.
     */
    private recordComponentWrite_;
    private syncActivityEpoch_;
    /** @internal Say composed world transforms are stale, for a producer that
     *  wrote the bytes without going through the mutation seam. */
    invalidateTransformComposition(): void;
    /** @internal Compose world transforms if a producer invalidated them. */
    ensureTransformsComposed(): void;
    /** @internal What the composition staleness counter reads. */
    transformEpoch(): number;
    /** @internal Ask composition to record which entities' output changed.
     *  Answers whether this core can report it at all. */
    setTransformChangeTracking(on: boolean): boolean;
    /** @internal What every composition since the last acknowledgement changed;
     *  null from a core that cannot say. The ids view engine memory, so a
     *  consumer reads, applies and acknowledges within one turn. */
    compositionChanges(): CompositionDelta | null;
    /** @internal Acknowledge that set: it starts again. */
    takeCompositionChanges(): void;
    /** @internal Mark component as changed without writing data (for in-place Mut query) */
    markChanged(entity: Entity, component: AnyComponentDef): void;
    /**
     * @internal The open speculation's undo log, or null.
     *
     * The pre-image is taken where the HANDLE leaves, not where the write
     * arrives: script storage hands out the stored object itself, so by `set`
     * the old value is gone (docs/MUTATION_CONTRACT.md). Hence `get`/`tryGet`
     * ask here too, and only a component's first touch is kept.
     */
    private speculation_;
    /** @internal */
    openSpeculation(log: {
        record(world: World, entity: Entity, component: AnyComponentDef): void;
    }): void;
    /** @internal */
    closeSpeculation(): void;
    /** @internal Whether a step that can be taken back is running. */
    get speculating(): boolean;
    /** @internal Whether any query is asking about `component`'s changes. */
    isChangeTracked(component: AnyComponentDef): boolean;
    /**
     * @internal Where script-component rows are allocated from. A wasm runtime
     * installs linear memory here BEFORE any component is added, because
     * compiled code cannot reach a JS-heap array.
     */
    useScriptPoolMemory(memory: PoolMemory, validateOnly?: boolean): void;
    /**
     * @internal `component`'s bytes for `entity`, in the memory compiled code
     * reads: an engine component through the bridge, a script one through its
     * pool. Undefined where there are no flat bytes. The resolver is cached per
     * component — finding it walks a generated table, and this is asked once per
     * entity per frame.
     */
    addressOfComponent(component: AnyComponentDef, entity: Entity): number | undefined;
    /**
     * @internal One number for "could any component have moved since you last
     * asked": the engine's pools (`Registry::layoutEpoch`) plus this SDK's own (a
     * claimed, released or grown script row). Null where the engine cannot be
     * asked, which means re-resolve. It says nothing about which entities MATCH;
     * that is the query cache's answer, and a caller needing both asks both.
     */
    layoutEpoch(): number | null;
    /**
     * @internal The script pools' half of {@link layoutEpoch}, on its own.
     *
     * A host that reads the engine's half itself needs only this one, and must
     * have it: a row added to or deleted from a script pool moves nothing the
     * registry's version numbers can see.
     */
    scriptLayoutEpoch(): number;
    /**
     * @internal Where a SCRIPT component's whole column is, for a host that
     * walks it in its own address space. Undefined for an engine component,
     * whose column belongs to the registry and is reached by its own door.
     */
    scriptSpanOf(component: AnyComponentDef): {
        rows: number;
        stride: number;
        sparse: number;
        sparseCount: number;
        owners: number;
        ownerCount: number;
    } | undefined;
    /** @internal Whether script rows still carry a portable asset reference. */
    hasPortableScriptAssetRefs(component: AnyComponentDef): boolean;
    /** @internal Release script memory after its application stops using it. */
    releaseScriptPools(): void;
    /**
     * @internal The same answer as a function, for a caller with a whole column
     * to walk: the lookup above is per entity, and a loop that pays it per row is
     * paying to be told the same thing every time.
     */
    addressResolver(component: AnyComponentDef): (entity: Entity) => number | undefined;
    /** Cleared with the bridge, because a reconnect may serve other memory. */
    private readonly addressOf_;
}

interface SpriteAnimFrame {
    texture: TextureHandle;
    duration?: number;
    uvOffset?: {
        x: number;
        y: number;
    };
    uvScale?: {
        x: number;
        y: number;
    };
    /**
     * The anchor this frame renders with, in `Sprite.pivot`'s own space — resolved
     * at load time from the clip's per-frame/clip-wide anchors. Absent on EVERY
     * frame of a clip that authors no anchors, which is what keeps playback from
     * touching a pivot the entity owns.
     */
    pivot?: {
        x: number;
        y: number;
    };
    /**
     * The size this frame renders at, in world units — resolved at load time from
     * the clip's sizing mode and the frame's natural size. Absent on EVERY frame of
     * a clip that does not own size, which is what keeps playback from resizing a
     * sprite the entity sized itself.
     */
    size?: {
        x: number;
        y: number;
    };
}
interface SpriteAnimEvent {
    frame: number;
    name: string;
    data?: unknown;
}
type SpriteAnimEventHandler = (event: SpriteAnimEvent, entity: Entity) => void;
interface SpriteAnimClip {
    name: string;
    frames: SpriteAnimFrame[];
    fps: number;
    loop: boolean;
    labels?: Record<string, number>;
    events?: SpriteAnimEvent[];
}
/**
 * Owns one App's sprite-animation clip registry and frame-event listeners,
 * advances SpriteAnimator components, and drives goto-frame/label. Published as
 * the {@link SpriteAnimation} resource; read it as
 * `app.getResource(SpriteAnimation)`.
 */
declare class SpriteAnimationAPI {
    private readonly clips;
    private assetClips_;
    private readonly entityListeners;
    private globalListeners;
    private readonly clipTokens;
    private readonly appliedAnimators;
    private readonly pendingApplies;
    private updating;
    registerClip(clip: SpriteAnimClip): void;
    /**
     * Register an EXISTING clip object under an additional lookup name. Loaders
     * register a clip under its resolved load path, which in some realms is an
     * absolute URL — components reference the serialized project-relative ref,
     * so the two must alias to the SAME object (events attached through one
     * name fire for the other).
     */
    aliasClip(name: string, clip: SpriteAnimClip): void;
    unregisterClip(name: string): void;
    /**
     * @internal Where a clip loaded from a `.esanim` comes from: this app's
     * realm. A code registration wins, as it always did — what changes is that
     * the asset half is no longer a second copy kept in the map above.
     */
    useAssetClips(source: (ref: string) => SpriteAnimClip | undefined): void;
    getClip(name: string): SpriteAnimClip | undefined;
    clearClips(): void;
    onEvent(entity: Entity, handler: SpriteAnimEventHandler): () => void;
    onEventGlobal(handler: SpriteAnimEventHandler): () => void;
    removeEntityListeners(entity: Entity): void;
    private isCurrentAnimator;
    private fireEvents;
    update(world: World, deltaTime: number): void;
    private updateWorld;
    gotoFrame(animator: SpriteAnimatorData, frameIndex: number, andPlay?: boolean): void;
    gotoLabel(animator: SpriteAnimatorData, label: string, andPlay?: boolean): void;
}
/**
 * Per-App sprite-animation resource (clip registry + frame-event listeners),
 * published by `AnimationPlugin`. Read as `app.getResource(SpriteAnimation)`.
 */
declare const SpriteAnimation: ResourceDef<SpriteAnimationAPI>;
/** The fields of the `SpriteAnimator` component, whose tier this shape carries.
 *  @beta */
interface SpriteAnimatorData {
    clip: string;
    speed: number;
    playing: boolean;
    loop: boolean;
    enabled: boolean;
    currentFrame: number;
    frameTimer: number;
    /** Latched when a one-shot clip completes; runtime-only, do not author.
     *  Raising `playing` on a finished animator replays from frame 0 — the
     *  same flag contract as TimelinePlayer. */
    finished: boolean;
}
/**
 * Frame playback on an entity: which clip, how fast, and where in it. The clip is
 * named rather than referenced, so a project registers clips from code or ships
 * them as `.esanim` and this stays the same either way.
 *
 * @beta
 */
declare const SpriteAnimator: ComponentDef<SpriteAnimatorData>;

interface Backend {
    fetchBinary(path: string): Promise<ArrayBuffer>;
    fetchText(path: string): Promise<string>;
    resolveUrl(path: string): string;
    setBaseUrl?(url: string): void;
}
interface HttpBackendOptions {
    baseUrl: string;
}
declare class HttpBackend implements Backend {
    private baseUrl_;
    constructor(options: HttpBackendOptions);
    fetchBinary(path: string): Promise<ArrayBuffer>;
    fetchText(path: string): Promise<string>;
    resolveUrl(path: string): string;
    setBaseUrl(url: string): void;
}

type AssetContentType = 'json' | 'text' | 'binary' | 'image' | 'audio';
type AddressableAssetType = 'texture' | 'material' | 'spine' | 'bitmap-font' | 'font' | 'prefab' | 'json' | 'text' | 'binary' | 'audio';
type EditorAssetType = 'texture' | 'material' | 'shader' | 'spine-atlas' | 'spine-skeleton' | 'dragonbones-atlas' | 'dragonbones-skeleton' | 'bitmap-font' | 'font' | 'prefab' | 'json' | 'audio' | 'sound-event' | 'world-rules' | 'terrain-layer' | 'terrain-tiles' | 'video' | 'scene' | 'anim-clip' | 'tilemap' | 'tileset' | 'timeline' | 'mesh' | 'unknown';
interface AssetTypeEntry {
    extensions: string[];
    /**
     * Full lower-case name endings claiming this type, checked BEFORE extensions
     * because they are the more specific claim. For a format whose files are told
     * apart by convention rather than suffix — DragonBones ships `_ske.json`
     * beside `_tex.json`, and `.json` alone cannot see the difference.
     */
    suffixes?: string[];
    contentType: AssetContentType;
    editorType: EditorAssetType;
    addressableType: AddressableAssetType | null;
    wechatPackInclude: boolean;
    hasTransitiveDeps: boolean;
}
declare function getAssetTypeEntry(extensionOrPath: string): AssetTypeEntry | undefined;
declare function getEditorType(path: string): EditorAssetType;
declare function getAddressableType(path: string): AddressableAssetType | null;
declare function getAddressableTypeByEditorType(editorType: string): AddressableAssetType | null;
declare function isKnownAssetExtension(ext: string): boolean;
declare function getAllAssetExtensions(): Set<string>;
declare function looksLikeAssetPath(value: unknown): value is string;
declare function getCustomExtensions(): string[];
declare function getWeChatPackOptions(): Array<{
    type: string;
    value: string;
}>;
declare function getAssetMimeType(ext: string): string | undefined;
declare function isCustomExtension(path: string): boolean;

/**
 * @file    asset/textureImportSettings.ts
 * @brief   The `.meta` importer block → {@link TextureImportSettings}.
 *
 * One parser, because there is one source: the importer block the asset
 * inspector edits, which the cook copies verbatim into the ship manifest. The
 * editor reads it from its own asset database and the runtime from the
 * AssetRegistry, but they must agree on what it MEANS — a second reader is how
 * "works in the editor, not in the build" gets born.
 */
/** Import-time texture settings, as the loader consumes them. */
interface ParsedTextureImportSettings {
    filter?: 'linear' | 'nearest';
    wrap?: 'repeat' | 'clamp' | 'mirror';
    srgb?: boolean;
    mipmaps?: boolean;
    sliceBorder?: {
        left: number;
        right: number;
        top: number;
        bottom: number;
    };
}
/** Parse an importer block; undefined when it carries nothing the loader needs. */
declare function textureImportSettingsFrom(importer: Record<string, unknown> | undefined | null): ParsedTextureImportSettings | undefined;

/**
 * @file    asset/spineImportSettings.ts
 * @brief   The `.meta` importer block → a spine asset's culling contract.
 *
 * One parser, because there is one source: the importer block the asset
 * inspector edits and the cook copies into the ship manifest.
 *
 * A contract is a rectangle AND the atlas it was promised against, and the type
 * says so rather than leaving them two optional fields. A spine asset is a
 * PAIR — an atlas decides how its regions were trimmed and so what geometry the
 * attachments end up with — so a rectangle with no atlas beside it is a promise
 * about nothing in particular. Recording the atlas at authoring time is also
 * what makes the promise stop applying when somebody re-points the skeleton at
 * a different one, which is the direction this has to fail in.
 */
/** A rectangle in the skeleton's own space, as the `.meta` stores it. */
interface SpineCullingRect {
    x: number;
    y: number;
    width: number;
    height: number;
}
/** What an author promised, and what they promised it about. */
interface SpineCullingContract {
    bounds: SpineCullingRect;
    /** The atlas ref the promise was recorded against. */
    atlas: string;
}
/**
 * Parse an importer block; undefined when it carries no contract.
 *
 * Both halves or neither: a fresh `.meta` carries every declared setting's
 * default, so the state "no contract" is a zero-area rectangle and an empty
 * atlas rather than absent keys — and half a contract is not one.
 */
declare function spineCullingContractFrom(importer: Record<string, unknown> | undefined | null): SpineCullingContract | undefined;
/** What the manifest ships for a skeleton: the rectangle, and the atlas as this
 *  build's own asset key. */
interface SpineManifestContract {
    cullingBounds: SpineCullingRect;
    atlas: string;
}
/**
 * One skeleton's `.meta` → the manifest entry, or undefined. ONE function for
 * every writer, because two is how "works in Play, not in the build" is born.
 *
 * `keyOfRef` turns the recorded atlas into this build's key; a contract naming
 * an atlas this build does not ship is dropped.
 */
declare function spineManifestContractFrom(importer: Record<string, unknown> | undefined | null, keyOfRef: (ref: string) => string | undefined): SpineManifestContract | undefined;

/** Where a texture's small copy is, and how big it and the file are. */
interface StreamTailInfo {
    path: string;
    size: number;
    width: number;
    height: number;
    fullWidth: number;
    fullHeight: number;
}
interface AddressableManifestAsset {
    path: string;
    address?: string;
    type: AddressableAssetType;
    size: number;
    labels: string[];
    /**
     * Content hash of the built bytes (XXH64, see contentHash.ts), the asset's
     * *physical* identity.
     * Populated by the import pipeline. Lets the runtime dedupe by content and
     * treat `<contentHash>.<ext>` as an immutable, permanently-cacheable URL
     * (changing a file yields a new hash → a new URL, never a stale cache).
     */
    contentHash?: string;
    /** GPU compressed formats this asset was encoded for (e.g. ['astc-4x4','etc2-rgba8']). */
    compressedFormats?: string[];
    /** A small copy of a texture a mesh draws, which texture streaming fetches first (`path` is its build path). */
    streamTail?: StreamTailInfo;
    /**
     * How the texture is sampled and sliced — the runtime half of the `.meta`
     * importer block, parsed at cook time rather than shipped raw: a packaged
     * realm needs filter/wrap/sRGB and the 9-slice border, never the cook's own
     * settings (maxSize, compression format). Absent when the asset is not a
     * texture or its importer says nothing the renderer acts on.
     */
    textureImport?: ParsedTextureImportSettings;
    /**
     * A spine skeleton's culling promise: the rectangle, and the ATLAS it was
     * promised against as this manifest's own KEY, not a build locator.
     *
     * It ships rather than being re-derived, which would honour the promise
     * after a skeleton was re-pointed at another atlas.
     */
    spineImport?: SpineManifestContract;
    /**
     * Present when the export packed this asset with others into one file, which
     * a network build fetches once instead of one request per asset: `path` then
     * names no file of its own, and its bytes are `size` at `offset` in `file`.
     */
    pack?: AssetPackRef;
    metadata?: {
        atlas?: string;
        atlasPage?: number;
        atlasFrame?: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
        /** Page pixel size — with atlasFrame, what the runtime derives uv from. */
        atlasPageWidth?: number;
        atlasPageHeight?: number;
    };
}
/** Where a packed asset's bytes sit (see {@link AddressableManifestAsset.pack}). */
interface AssetPackRef {
    /** The pack, as a path beside the manifest. */
    file: string;
    offset: number;
    size: number;
}
interface AddressableManifestGroup {
    bundleMode: string;
    labels: string[];
    assets: Record<string, AddressableManifestAsset>;
}
interface AddressableManifest {
    version: '2.0';
    /**
     * Build content revision — a stable hash over every asset's `contentHash`
     * (see {@link deriveManifestRevision}). Two builds share a revision iff they
     * ship byte-identical content under the same addressable keys, so a
     * changed / added / removed asset flips it. It is the fast gate for "is there
     * an update?"; the per-asset `contentHash` diff stays authoritative on WHAT
     * changed. Optional — absent on legacy manifests, where the diff falls back
     * to comparing contentHashes (or build paths) directly.
     */
    revision?: string;
    groups: Record<string, AddressableManifestGroup>;
}
/**
 * Delivery mode for an addressable group — the single typed source of truth for
 * what was historically a bare `bundleMode: string` scattered across the cook /
 * export / runtime sides.
 * - `local`  — ships in the main package, loaded eagerly (current default; the
 *              value `exportWeChat` emits today).
 * - `lazy`   — ships in a subpackage (e.g. a WeChat 分包), loaded on demand.
 * - `remote` — fetched from a remote / CDN URL on demand.
 */
type BundleMode = 'local' | 'lazy' | 'remote';
declare const BUNDLE_MODES: readonly BundleMode[];
/**
 * Normalize a wire `bundleMode` string to a known {@link BundleMode}. Unknown /
 * missing values map to `local` — the safe default: treated as part of the main
 * package so the asset is always present.
 */
declare function normalizeBundleMode(mode: string | undefined | null): BundleMode;
declare class ManifestModel {
    private readonly manifest;
    private constructor();
    static fromJson(manifest: AddressableManifest): ManifestModel;
    private packs_;
    /** The pack holding the asset at build `path`, or null when it has a file of its own. */
    packOf(path: string): AssetPackRef | null;
    /** The build paths each pack holds, by pack file. */
    packMembers(): Map<string, Set<string>>;
    static empty(): ManifestModel;
    /** All group names, in manifest order. */
    groupNames(): string[];
    group(name: string): AddressableManifestGroup | null;
    /** Typed delivery mode of a group (unknown group → `local`). */
    bundleMode(name: string): BundleMode;
    /** Group names whose delivery mode equals `mode`. */
    groupsByMode(mode: BundleMode): string[];
    /** Assets in a group (empty for an unknown group). */
    assetsInGroup(name: string): AddressableManifestAsset[];
    /** Asset paths in a group. */
    assetPathsInGroup(name: string): string[];
    /** Every asset across all groups. */
    allAssets(): AddressableManifestAsset[];
    /** Every asset carrying its owning group name and record key — the iteration
     *  the hot-update diff walks (allAssets() drops both). */
    entries(): Array<{
        group: string;
        key: string;
        asset: AddressableManifestAsset;
    }>;
    /**
     * Per-ref texture import settings for every asset that carries them — what a
     * packaged realm answers `RuntimeAssetSource.textureImportSettings` with, so
     * a shipped game samples and 9-slices exactly as the editor did.
     */
    textureImportLookup(): (ref: string) => ParsedTextureImportSettings | undefined;
    /**
     * The culling contract this build ships for a spine PAIR, or undefined.
     *
     * Both refs, because there is no useful answer about a skeleton alone. The
     * atlas is compared as an IDENTITY — `@uuid:…`, a path and an address all
     * agree — so one the contract was not made against inherits nothing.
     */
    spineCullingLookup(): (skeleton: string, atlas: string) => SpineCullingRect | undefined;
    /** The manifest's build content revision (see {@link deriveManifestRevision}),
     *  or null on a legacy manifest that predates the field. */
    revision(): string | null;
    /** Assets carrying `label` across all groups, deduped by path. */
    assetsByLabel(label: string): AddressableManifestAsset[];
    /** Find an asset by its path or its address (null if absent). */
    findAsset(pathOrAddress: string): AddressableManifestAsset | null;
    private keyIndex_;
    private pathIndex_;
    private remoteIndex_;
    private indexes;
    /** Asset by its group-record key (the uuid in editor/WeChat manifests). */
    assetByKey(key: string): AddressableManifestAsset | null;
    /** Asset by its build path. */
    assetByPath(path: string): AddressableManifestAsset | null;
    /**
     * Build path of a `remote`-group asset by ANY of its keys — record key (uuid),
     * address (logical source path, bare and `/`-rooted), or build path — or null
     * when the ref is not a remote-delivered asset. Lets a resolver route scene
     * `@uuid` refs to remote assets through the CDN (so they hot-update with the
     * manifest), while local / lazy assets keep their normal resolution.
     */
    remoteAssetPath(ref: string): string | null;
    /**
     * The stable name of the `remote`-group asset a ref names — its address,
     * else the key it is filed under. NOT interchangeable with
     * {@link remoteAssetPath}: a build path is content-addressed, so it names
     * one revision, while this is what every revision agrees on.
     */
    remoteAssetIdentity(ref: string): string | null;
    /** Both remote indexes, built together from one walk. */
    private remoteIndexes_;
    /**
     * Resolve a serialized asset ref (a uuid, an address, or a path) to its
     * build path, falling back to the ref itself. The single manifest→path
     * resolution the shipped runtimes use, and the last word on the name: a
     * build path is whatever the cook staged the file as.
     */
    resolvePath(ref: string): string;
}

interface AtlasFrameInfo {
    atlas: string;
    frame: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    uvOffset: [number, number];
    uvScale: [number, number];
    trim?: {
        sourceW: number;
        sourceH: number;
        offsetX: number;
        offsetY: number;
    };
}
interface CatalogEntry {
    type: string;
    atlas?: string;
    frame?: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    uv?: {
        offset: [number, number];
        scale: [number, number];
    };
    trim?: {
        sourceW: number;
        sourceH: number;
        offsetX: number;
        offsetY: number;
    };
    deps?: string[];
    buildPath?: string;
    /** A small copy of the texture that texture streaming fetches first. */
    streamTail?: StreamTailInfo;
}
interface CatalogData {
    version: number;
    entries: Record<string, CatalogEntry>;
    addresses?: Record<string, string>;
    labels?: Record<string, string[]>;
}
/** The atlas record a cook/export manifest carries for a packed texture. */
interface CookedAtlasInfo {
    page?: number;
    frame: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    pageWidth: number;
    pageHeight: number;
}
/**
 * Derive a CatalogEntry's atlas fields from a cook-manifest atlas record.
 * Frame pixels are image-space (y from the page TOP); uv is emitted for
 * flipY-uploaded textures (v origin = image bottom), matching the
 * Sprite/UIVisual `uvOffset`/`uvScale` convention. `pagePath` is the page's
 * fetch identity — the same string every frame of the page shares, so texture
 * loading can collapse them onto one GPU texture.
 */
declare function atlasCatalogFields(atlas: CookedAtlasInfo, pagePath: string): Pick<CatalogEntry, 'atlas' | 'frame' | 'uv'>;
declare class Catalog {
    private entries_;
    private addresses_;
    private labels_;
    /** Built on first ask; a pack has thousands of entries and most callers never ask. */
    private addressByBuildPath_;
    private constructor();
    static fromJson(data: CatalogData): Catalog;
    static empty(): Catalog;
    resolve(ref: string): string;
    getEntry(path: string): CatalogEntry | null;
    getAtlasFrame(path: string): AtlasFrameInfo | null;
    /**
     * The authored logical address a staged path came from, or null. A document
     * that names a SIBLING — a spine atlas page, a font page — resolves it against
     * where the document was AUTHORED, and content-addressed staging renames every
     * asset to a hash under one flat directory, which loses that.
     */
    addressOf(path: string): string | null;
    /** The small copy of a texture streaming fetches first, or null when the build shipped none. */
    getStreamTail(path: string): StreamTailInfo | null;
    getBuildPath(path: string): string;
    getDeps(path: string): string[];
    getByLabel(label: string): string[];
    getAllLabels(): string[];
    hasEntry(path: string): boolean;
    hasAddress(address: string): boolean;
    get isEmpty(): boolean;
}

/**
 * @file    hotUpdate.ts
 * @brief   Pure manifest-diff core for content-addressed hot updates.
 *
 * The runtime hot-update flow is: fetch the remote manifest → {@link diffManifests}
 * it against the active one → download the changed (content-addressed) assets →
 * swap the active manifest. Because every asset url is `<contentHash>.<ext>`
 * (immutable), a changed asset is a NEW url: the diff is a pure comparison of
 * per-asset `contentHash`, and applying it never overwrites or invalidates a
 * cached file — the old url simply stops being referenced.
 *
 * This module is pure — no fetch, no platform, no Assets — so it unit-tests in
 * isolation and the SAME diff drives every platform (web / mini-game / native).
 */

/** One asset the update touches, resolved to what the downloader needs. */
interface AssetChange {
    /** Group-record key (uuid in cooked manifests, else path) — the stable
     *  cross-build identity the diff matches on. */
    key: string;
    /** Build path of the asset in the NEW manifest (content-addressed → the
     *  immutable url tail the downloader appends to the remote root). */
    path: string;
    /** Owning group in the new manifest. */
    group: string;
    type: AddressableAssetType;
    size: number;
    contentHash?: string;
}
/** The result of comparing an active manifest to a candidate one. */
interface UpdatePlan {
    /** True iff any asset is new / content-changed (or, absent contentHashes on
     *  both sides, the top-level revision moved). */
    hasUpdate: boolean;
    fromRevision: string | null;
    toRevision: string | null;
    /** Distinct groups owning ≥1 changed / added asset — the set to re-load. */
    changedGroups: string[];
    /** New or content-changed assets to download. */
    changedAssets: AssetChange[];
    /** Assets present before but absent now — informational, for cache cleanup;
     *  never downloaded. */
    removedAssets: AssetChange[];
    /** Sum of `changedAssets` sizes: the download-size estimate for UI/progress. */
    totalBytes: number;
}

type CacheProtection = 'current' | 'pending' | 'rollback' | 'retained';
interface Entry {
    name: string;
    key?: string;
    hash?: string;
    size: number;
    lastAccess: number;
}
interface ContentCacheEntry extends Entry {
    versions: string[];
    protection: string[];
}
interface ContentCacheReport {
    /** The Assets service issuing this report, when supplied by that service. */
    owner?: string;
    capability: 'managed' | 'storage-only' | 'unavailable';
    /** Resource bytes only; index bytes are reported separately. Null is unknown. */
    usedBytes: number | null;
    indexBytes: number | null;
    protectedBytes: number | null;
    reclaimableBytes: number | null;
    entries: ContentCacheEntry[];
    versions: {
        owner: string;
        revision: string;
        reason: CacheProtection | null;
        missing: number;
        retained: boolean;
    }[];
}
interface CacheCleanupPreview {
    report: ContentCacheReport;
    budgetBytes: number;
    candidates: string[];
    releaseBytes: number;
    remainingBytes: number | null;
    budgetMet: boolean | null;
}
interface CacheCleanupResult extends CacheCleanupPreview {
    removed: string[];
    failed: string[];
    /** Cleanup can free a full disk even when updating its index is refused.
     * The next scan reconciles those successful deletions. */
    indexPersisted?: boolean;
}

/**
 * @file    AssetLease.ts
 * @brief   The receipt for one acquisition, and a scope that holds several.
 *
 * @details A path answers "which asset do I want?". A lease answers "which
 *          instance do I actually hold?" — and only the second one can be given
 *          back correctly once `invalidate()` has made two generations of the
 *          same path live at the same time.
 */
/** One acquisition, and the right to end it. */
interface AssetLease<T = unknown> {
    readonly key: string;
    /** Ledger-minted, so two eras never merge even if their values compare equal. */
    readonly generation: number;
    readonly value: T;
    /** @internal Unavailable dependencies of the preparation held by this receipt. */
    readonly failedDependencies?: readonly string[];
    /** Give this one acquisition back. Calling twice is a no-op, not a double free. */
    release(): void;
    /**
     * A second receipt for the SAME generation — an owner splitting what it holds.
     *
     * Not a re-acquire: this era may already be superseded, which is exactly when
     * loading the path again hands back a different instance than the one the
     * splitting owner is bound to. Null when the ledger has forgotten it.
     */
    retain(): AssetLease<T> | null;
}
/**
 * @brief Everything one owner acquired, released together.
 *
 * @details Holds receipts rather than paths, so unloading releases what was
 *          actually acquired — not what the manifest says this owner would
 *          acquire if it loaded today. A failed acquisition produced no lease,
 *          so there is nothing to release and nothing to guess about.
 */
declare class AssetScope {
    private leases_;
    add<T>(lease: AssetLease<T>): AssetLease<T>;
    /** Hand back the current batch in reverse order, attempting all releases.
     * A failure is reported after cleanup; acquisitions made by cleanup belong
     * to the next batch. */
    releaseAll(): void;
    /**
     * Take over every receipt `other` holds; it owes nothing afterwards.
     *
     * The transfer an owner needs when the acquiring code is not the owning
     * code: a loader acquires into a scope of its own and hands the whole thing
     * to whoever will outlive it.
     */
    absorb(other: AssetScope): void;
    /** Stop tracking one lease without releasing it — for an ownership transfer. */
    forget(lease: AssetLease): boolean;
    /** How many acquisitions this scope still owes. Diagnostics and tests. */
    get size(): number;
    /** @internal The receipts themselves — for a census, never to release behind the scope. */
    leases(): readonly AssetLease[];
}

/**
 * @file    entityAssetScopes.ts
 * @brief   What an entity owns outside a scene, ending at its despawn.
 *
 * @details A runtime entity can have no scene; a persistent entity leaves its
 *          scene and keeps rendering. Somebody
 *          has to owe a release for what it is still bound to, and the two
 *          answers that existed were both wrong: the scene's scope is about to
 *          be given back, and the app's never ends while an entity's does.
 *
 *          So the entity is the owner, and the acquisition ends when the entity
 *          does — `World.onDespawn`, which fires for a whole subtree, before the
 *          component storage goes.
 */

declare class EntityAssetScopes {
    private worlds_;
    /**
     * The scope this entity owns, created on first use.
     *
     * Takes the World rather than being handed one at construction: the end of
     * an entity scope is its despawn, so the subscription that ends it is made
     * here — before any scope exists there is nothing that could be missed.
     */
    ensure(world: World, entity: Entity): AssetScope;
    /** What this entity owns, or null when it owns nothing of its own. */
    scopeFor(entity: Entity, world?: World): AssetScope | null;
    /** Live per-entity scopes. Diagnostics and the resource census. */
    get size(): number;
    private bind_;
}

/** Resources retained before a spawn; attachment transfers them to entity scopes. */
interface PreparedSpawnOwnership {
    attach(world: World, entities: ReadonlyMap<number, Entity>): void;
    release(): void;
}

/**
 * @file    deferred.ts
 * @brief   Virtual prefab instances: seen when authoring, made when they are used.
 *
 * An instance whose root carries `deferred: true` in its metadata is a virtual node. The editor shows it expanded like any other
 * instance (nothing about authoring changes: it can be looked at, selected and edited without running anything), but a scene
 * that is loaded to run makes only its root, in the place it has, and keeps a record of what the rest would be made from. The
 * contents are made when somebody asks for them (`UIPages`, or `openDeferred`), under that same root.
 *
 * The mark is ordinary prefab metadata, so it can be set where it belongs: on a prefab's root (every use of the prefab is
 * virtual), on a nested slot (that mounting is), or as an override on one instance in a scene (that instance is).
 */

/** What stands in for a virtual instance until it is opened. `id` is the entity the root was made as. */
interface DeferredRecord {
    id: number;
    /** The prefab the contents come from. */
    prefab: string;
    /** The overrides the instance carries, in the prefab's own address space. */
    overrides: PrefabOverride[];
}

interface ComponentData$1 {
    type: string;
    data: Record<string, unknown>;
}
/**
 * Per-entity identity inside a prefab file.
 *
 * The string is opaque — UUIDs for editor-authored prefabs, stringified
 * integers for migrated legacy files. Stability matters more than format:
 * once an entity has been assigned a `PrefabEntityId`, the editor must
 * never reassign or reuse it for the lifetime of the prefab, otherwise
 * existing instance overrides will silently apply to the wrong target.
 */
type PrefabEntityId = string;
interface PrefabData {
    version: string;
    name: string;
    rootEntityId: PrefabEntityId;
    entities: PrefabEntityData[];
    /**
     * If set, this prefab inherits from another prefab. The variant's own
     * `entities` list may **override** existing base entries (matched by
     * `prefabEntityId`) and **add** new entities; `overrides` is applied
     * on top of the merged result.
     */
    basePrefab?: string;
    overrides?: PrefabOverride[];
}
interface PrefabEntityData {
    prefabEntityId: PrefabEntityId;
    name: string;
    parent: PrefabEntityId | null;
    children: PrefabEntityId[];
    components: ComponentData$1[];
    visible: boolean;
    /**
     * Editor/tooling state that survives prefab round-trip. Not consumed by
     * the runtime engine — the runtime instantiation path drops this. The
     * editor uses it to round-trip per-entity metadata such as asset refs
     * (`asset:Comp.field` → uuid) and selection markers.
     */
    metadata?: Record<string, unknown>;
    nestedPrefab?: NestedPrefabRef;
}
interface NestedPrefabRef {
    prefabPath: string;
    overrides: PrefabOverride[];
}
/**
 * Override types applied to an entity in an instantiated prefab.
 *
 * - `property`          — patch one field of one component.
 *                         Requires: componentType, propertyName, value.
 * - `name`              — change the entity's name. Requires: value (string).
 * - `visibility`        — change the entity's visibility. Requires: value (boolean).
 * - `parent`            — re-parent a prefab-origin entity within the instance.
 *                         Requires: value = the new parent's stable
 *                         `PrefabEntityId`, or `null` for "under the instance
 *                         root". Structural: applied by `expandInstance` /
 *                         `applyDeltaToSource` (which own the id space), not by
 *                         `applyOverrides`. The instance root is never re-parented
 *                         this way — its attach point is the instance entry's own
 *                         `parent`.
 * - `component_added`   — add a component **only if not already present**
 *                         (idempotent insert). Requires: componentData.
 *                         Use this for variants that want to *augment* the
 *                         base without silently stomping existing data.
 * - `component_replaced`— upsert: replace the component's data if the
 *                         component already exists, or insert it if not.
 *                         Requires: componentData. Use this when you
 *                         explicitly want to override the base's copy.
 * - `component_removed` — delete the component if present.
 *                         Requires: componentType.
 * - `metadata_set`      — set or replace one metadata key. Requires:
 *                         metadataKey, value (any JSON-serialisable).
 *                         Idempotent — applying twice is a no-op.
 * - `metadata_removed`  — delete one metadata key if present. Requires:
 *                         metadataKey.
 */
/**
 * One field of one entity of a prefab, overridden at the instance. Also the
 * on-disk shape a scene stores an instance's edits as.
 *
 * @beta
 */
interface PrefabOverride {
    prefabEntityId: PrefabEntityId;
    type: 'property' | 'component_added' | 'component_replaced' | 'component_removed' | 'name' | 'visibility' | 'parent' | 'metadata_set' | 'metadata_removed';
    componentType?: string;
    propertyName?: string;
    metadataKey?: string;
    value?: unknown;
    componentData?: ComponentData$1;
}
interface ProcessedEntity {
    /** Runtime entity id assigned by the flatten allocator. */
    id: number;
    /** Stable identity from the source prefab; preserved for diff/override matching. */
    prefabEntityId: PrefabEntityId;
    name: string;
    parent: number | null;
    children: number[];
    components: ComponentData$1[];
    visible: boolean;
    metadata?: Record<string, unknown>;
}
interface FlattenContext {
    allocateId: () => number;
    loadPrefab: (path: string) => PrefabData | null;
    visited?: Set<string>;
    depth?: number;
    /**
     * When present, a nested instance that is virtual (see deferred.ts) is flattened to its root only and a record of what it would
     * be made from is pushed here. Absent: every instance is flattened whole.
     */
    deferred?: DeferredRecord[];
}
interface FlattenResult {
    entities: ProcessedEntity[];
    rootId: number;
    /** Overrides whose target is no entity of the prefab — by the address they
     *  name, which a caller reports: applied nowhere, they change nothing. */
    unresolved: PrefabOverride[];
}

/**
 * @file    preparedPrefab.ts
 * @brief   A prefab that can be spawned in one frame, because everything it
 *          names is already in hand.
 *
 * `instantiatePrefab` is async, and every bit of that is asset loading: nested
 * prefabs, then the textures and materials the flattened entities reference. A
 * caller that wants an entity NOW — a script graph's spawn node, a bullet in a
 * system's body — cannot wait for a microtask and still hand the id to the next
 * thing it does.
 *
 * So the wait is moved: `preparePrefab` does the loading once, at the moment the
 * thing that will spawn it is itself being loaded, and keeps the flattened scene
 * with its asset handles already written in. {@link spawnPrepared} is then a
 * clone and a spawn, synchronous by construction.
 *
 * It reuses the scene path rather than reimplementing it — `flattenPrefab`,
 * `preloadSceneAssets`, `resolveSceneAssetPaths`, `loadSceneData` — so a prefab
 * spawned this way and the same prefab placed in a scene resolve identically.
 */

/**
 * A prefab with its loading done: the flattened entities, their asset handles
 * already written in, and the acquisitions that keeps true.
 */
interface PreparedPrefab {
    /** The ref it was prepared from — what a report names. */
    readonly ref: string;
    /** Flattened, resolved, and never handed out: each spawn clones it. */
    readonly scene: SceneData;
    /** Id of the root within {@link scene}. */
    readonly rootId: number;
    /** Assets referenced but not loaded — spawning still works, they draw as nothing. */
    readonly missing: readonly string[];
    /** Give back everything the preparation took. */
    release(): void;
    /** @internal Retain exact resource generations before creating a spawned copy. */
    retainSpawnAssets?(): PreparedSpawnOwnership;
    /** @internal Record references against this copy's runtime IDs after spawning. */
    trackSpawnReferences?(entities: ReadonlyMap<number, number>): void;
}

/**
 * @file    dependencies.ts
 * @brief   What one asset's preparation took, and what it merely read.
 *
 * @details A dependency graph is a PROJECTION of what actually happened, never a
 *          second source of fact. So an edge is not something a loader declares
 *          beside its work — it is recorded by the door the loader went through
 *          to do the work, and a loader that took nothing produces no edges no
 *          matter what it says.
 *
 *          Two kinds, and the difference matters:
 *
 *          `owned` — the preparation acquired a runtime resource and holds it.
 *          A receipt proves it, the era gives it back, and the child cannot go
 *          away underneath the parent.
 *
 *          `source` — the preparation READ another asset's content to decide
 *          what to produce (an external `.tsj` folded into a `.tmj`). Nothing is
 *          held: the parent owns no runtime object for it, and destroying
 *          anything on its behalf would be wrong. It is causality, not
 *          ownership — the reason the parent must be rebuilt when it changes.
 *
 *          A source edge exists iff changing that content may invalidate the
 *          parent's semantic value. Reading a log setting or an editor
 *          preference during a load is not a dependency.
 *
 *          Cycles are not refused here. `A imports B` while `B`'s metadata names
 *          `A` is a real shape; what has to be acyclic is a BUILD PLAN, which is
 *          this graph's condensation and not this graph.
 */

type DependencyKind = 'owned' | 'source';
/** One edge, as the acquisition that produced it named its other end. */
interface DependencyReceipt {
    readonly kind: DependencyKind;
    /** The asset type when the acquisition had one; a source read and a
     *  composed resource are identified by their path alone. */
    readonly type?: string;
    /** The identity within this realm: what the acquisition asked for. */
    readonly path: string;
}
/** One asset of a realm: what kind it is, and the name its era is filed under. */
interface AssetIdentity {
    readonly type: string;
    readonly path: string;
}
/** What one preparation took, sealed onto what it produced. */
interface Preparation {
    /** Everything it acquired; released when what it produced retires. */
    readonly dependencies: AssetScope;
    /** Every edge it produced, owned and source alike. */
    readonly edges: readonly DependencyReceipt[];
    /** An optional dependency was unavailable; initial degraded loads may run,
     * but a refresh must not replace a working era with one missing it. */
    readonly failedDependencies?: readonly string[];
}
/**
 * What a handle-bound load produced, and what its preparation took — the same
 * sealing an era gets, for the asset kind whose current value lives in a cache
 * rather than under a slot's name.
 */
type PreparedLoad<T> = Preparation & {
    readonly value: T;
};

/**
 * @file    registryAssets.ts
 * @brief   The identity of an asset a component names by REF rather than by handle.
 *
 * @details Two asset models had one ownership vocabulary between them. A sprite
 *          holds `texture = 17`: the field names an exact instance, so its owner
 *          holds a receipt for that generation. A `SpriteAnimator` holds
 *          `clip = "walk.esanim"`: the field names an asset, and every lookup
 *          asks a registry which object that name means NOW. Such a holder never
 *          had a generation to own — give it one and the moment a hot update
 *          republishes, ownership says one era while the component uses another.
 *
 *          So what it owns is the SLOT: the stable name, however many eras pass
 *          under it. An era owns what it acquired for itself and nothing else —
 *          publication belongs to the slot, which is what makes it impossible
 *          for a retiring era to unpublish the newer one that replaced it.
 *
 *          A lookup identity is (asset TYPE, logical name). Bare names would
 *          have two kinds of asset sharing one entry the moment a project's own
 *          registry-backed type answered to a name an engine one already used —
 *          today that is only prevented by the file extensions differing.
 */

/** What one preparation PRODUCED. What it took is recorded for it — see
 *  dependencies.ts — so an era cannot describe a dependency it does not have. */
interface RegistryEra<T> {
    /** The runtime object a lookup returns while this era is the published one. */
    readonly published: unknown;
    /** The logical identity a holder keeps — the same across every era. */
    readonly value: T;
}

/**
 * @file    spineBounds.ts
 * @brief   Three different things that all look like a rectangle.
 *
 * @details Skipping a world pose for something off camera is only safe if the
 *          "off camera" was decided without one, and the extent that decides it
 *          has to be one nothing can leave. Three kinds, and only one of them is
 *          allowed to answer that:
 *
 *          SETUP is what the skeleton was authored at. A fact about the data,
 *          and animations reach outside it.
 *
 *          OBSERVED is what a scan saw: every animation, every skin, sampled.
 *          Useful to look at and to propose, and it is not a proof — a mix of
 *          two animations is not the union of their extents, runtime code can
 *          move a bone the export never did, and an extreme between two samples
 *          is simply not seen. It may never authorise a skip.
 *
 *          CERTIFIED is somebody promising that nothing leaves this rectangle.
 *          A contract, not a measurement, which is why its only source is
 *          explicit. A scan can suggest one; accepting it is the promise.
 *
 *          Everything here is in the skeleton's own space. A certificate
 *          belongs to an era, which entities share; where one of them stands is
 *          not part of it.
 */
/** A rectangle in the skeleton's own space. */
interface SpineAABB {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}
/** What a scan actually visited, so "it scanned everything" is checkable. */
interface SpineScanCoverage {
    animations: number;
    skins: number;
    samples: number;
}
/**
 * The extent culling is allowed to trust, and how much that is worth.
 *
 * `observed` carries the era it was scanned from and retires with it: what one
 * generation's bytes did is no promise about the next. A certificate is about
 * the asset, so it carries no era at all.
 */
type SpineCullingEnvelope = {
    kind: 'certified';
    bounds: SpineAABB;
    source: 'explicit';
} | {
    kind: 'observed';
    bounds: SpineAABB;
    source: 'animation-scan';
    sampleStep: number;
    era: string;
    coverage: SpineScanCoverage;
} | {
    kind: 'unknown';
};
/** The narrow slice of a controller a scan needs. */
interface SpineBoundsSource {
    createInstance(skeletonHandle: number): number;
    destroyInstance(instanceId: number): void;
    getAnimations(instanceId: number): string[];
    getSkins(instanceId: number): string[];
    setSkin(instanceId: number, skin: string): void;
    play(instanceId: number, animation: string, loop?: boolean, track?: number): boolean;
    update(instanceId: number, dt: number): void;
    getBounds(instanceId: number): {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    animationDuration(skeletonHandle: number, animation: string): number;
    skeletonBounds(skeletonHandle: number): SpineAABB | null;
}
/** What the skeleton was authored at. A fact, never an authority. */
declare function setupBounds(source: SpineBoundsSource, skeletonHandle: number): SpineAABB | null;
/**
 * Every animation, at `sampleStep` through its whole duration, in every skin.
 *
 * On its own scratch instance, so the entities using this skeleton keep the
 * pose they were in. The result is `observed`, and stays that whatever it finds.
 */
declare function scanObservedBounds(source: SpineBoundsSource, skeletonHandle: number, era: string, sampleStep?: number): SpineCullingEnvelope;
/**
 * Somebody promising that no pose of this skeleton leaves `bounds`.
 *
 * The only way to make a certificate, and it takes a rectangle rather than
 * another envelope: an observation cannot be upgraded into a promise by passing
 * it through a function, only by somebody deciding to make one.
 */
declare function certifyBounds(bounds: SpineAABB): SpineCullingEnvelope;
/**
 * The envelope as it stands for `era`. An observation of another generation is
 * not one of this one, and comes back unknown rather than being trusted.
 */
declare function envelopeFor(envelope: SpineCullingEnvelope, era: string): SpineCullingEnvelope;
/**
 * Whether this entity's world pose may be left unresolved when nothing can see
 * it. Two independent proofs, and the absence of either is a no: the runtime
 * saying its constraints carry no state across a pose, and an envelope somebody
 * certified. Anything else materialises, which costs time and cannot be wrong.
 */
declare function mayDeferWorldPose(envelope: SpineCullingEnvelope, requiresContinuousWorldPose: boolean): boolean;
/** A 2D affine transform, row-major `[a, b, c, d, tx, ty]`. */
type SpineAffine = readonly [number, number, number, number, number, number];
/**
 * The local rectangle in world space, still conservative: all four corners are
 * transformed and re-bounded, because under rotation the corners of the result
 * are not the transformed corners of the input.
 */
declare function worldBounds(local: SpineAABB, transform: SpineAffine): SpineAABB;
/** Whether `outer` contains `inner`, which is what "did not leave it" means. */
declare function contains(outer: SpineAABB, inner: SpineAABB): boolean;

/** One atlas page, as the runtime needs it: a GL id and its size. */
interface SpinePage {
    glId: number;
    w: number;
    h: number;
}
/** What a spine preparation produced. */
interface SpineAssetValue {
    /** The skeleton document — bytes for `.skel`, text for `.json`. */
    skelData: Uint8Array | string;
    atlasText: string;
    isBinary: boolean;
    /** By the name the atlas gives each page. */
    textures: Map<string, SpinePage>;
}
/**
 * A spine asset's identity: the skeleton document and the atlas it is drawn
 * with. Carried rather than composed into a key and split back out — a ref can
 * be `@uuid:...` and a path can be `C:/...`, so a string with a separator in it
 * is not something the pair can be recovered from.
 */
interface SpinePair {
    skeleton: string;
    atlas: string;
}
/** A claim on an era, held by something derived from it. */
interface SpineEraClaim {
    release(): void;
}
/**
 * One prepared era, and the right to keep it alive.
 *
 * Indivisible on purpose: a runtime that was handed an id and a separate way to
 * keep something alive can be handed the id of one generation and a claim on
 * another. What it retains is always the generation whose bytes it parsed.
 */
interface SpineEraBinding {
    /** Which era — what a runtime keys its native residency by. */
    readonly id: string;
    /** Which ASSET, for anything that has to name it back to a person. */
    readonly pair: SpinePair;
    readonly value: SpineAssetValue;
    /**
     * A claim on THIS generation. Never a fresh acquisition by name: after an
     * invalidate that name resolves to a different era than the one this native
     * skeleton was parsed from. Null when the era can no longer be joined.
     */
    retain(): SpineEraClaim | null;
    /**
     * What culling may assume about this asset's extent. Carried with the era
     * because a residency is made from one, but it belongs to the PAIR: a
     * promise about the asset survives the generation it was read beside.
     */
    readonly culling: SpineCullingEnvelope;
}

interface TextureResult {
    handle: TextureHandle;
    width: number;
    height: number;
    /** The file's own size, where it was made smaller than that (texture streaming); absent when it is the file's size. */
    fullWidth?: number;
    fullHeight?: number;
}
/**
 * One spine PAIR: the two documents it is, and the atlas pages it holds. No
 * native skeleton — that belongs to a runtime backend of a particular Spine
 * version, is built from this, and dies with the entities posing it.
 */
type SpineResult = SpineAssetValue;
interface SpineLoadResult {
    success: boolean;
    error?: string;
}
interface MaterialResult {
    handle: number;
    shaderHandle: number;
}
interface FontResult {
    handle: FontHandle;
    /** Outline fonts (.ttf/.otf/.woff) only: the family name the font was
     *  registered with, which is what `Text` rasterizes against. Absent for
     *  bitmap fonts, whose handle IS the resource. */
    family?: string;
    /** Outline fonts only: the source path, so unload can drop the registration. */
    path?: string;
}
interface AudioResult {
    bufferId: string;
}
interface AnimClipResult {
    clipId: string;
}
interface TilemapResult {
    sourceId: string;
}
interface TilesetResult {
    /** The `.estileset` path the resolved tileset is cached under. */
    tilesetId: string;
}
interface TimelineResult {
    timelineId: string;
}
interface FsmResult {
    fsmId: string;
}
interface AnimatorControllerResult {
    controllerId: string;
}
interface LocaleResult {
    /** The locale the table's entries were merged into. */
    locale: string;
    /** How many keys the table carried. */
    keyCount: number;
}
interface BtResult {
    btId: string;
}
interface PrefabResult {
    data: unknown;
}
/**
 * A data asset's parsed document. `T` is the caller's claim about the file's
 * shape — the loader parses, it does not validate, so a wrong claim is a wrong
 * claim about untyped JSON exactly as `JSON.parse` would give.
 */
interface JsonResult<T = unknown> {
    data: T;
}
interface LoadContext {
    backend: Backend;
    catalog: Catalog;
    resourceManager: CppResourceManager;
    loadTexture(path: string, flipY?: boolean): Promise<TextureResult>;
    /**
     * Load a texture and get the receipt for THIS acquisition — what a loader
     * holding a texture past its own `load` needs, because a path-addressed
     * release after an invalidate gives back the oldest era rather than the one
     * this loader was handed.
     */
    acquireTexture(path: string, flipY?: boolean): Promise<AssetLease<TextureResult>>;
    /** Say that material @p material binds texture @p texture, before it is acquired: a mesh material's textures may start small. */
    noteMaterialTexture?(material: string, texture: string): void;
    /**
     * Say what is wrong with an asset that LOADED anyway: a part of it was left out (a texture that would not load, a value of a shape nothing
     * reads) and what draws is the rest. Replaces the list this asset had; an empty list says it is whole. Without this a half-loaded material
     * looks exactly like a good one: a log line, and then a default-looking surface nobody can attribute.
     */
    noteAssetProblems?(asset: string, problems: readonly string[]): void;
    /**
     * The same for an asset of ANY type — a material instance acquiring the
     * parent it diffs against. The general door; {@link acquireTexture} is the
     * one specialization, for the flip variants a texture has.
     */
    acquireAsset<T>(type: string, ref: string): Promise<AssetLease<T>>;
    /**
     * The path an asset ref names, or null when it names nothing known. Optional: a loader that wants to
     * compare two spellings of one asset (a timeline deciding whether a clip plays itself) asks it.
     */
    resolveRef?(ref: string): string | null;
    /**
     * A prefab loaded, flattened and resolved, so it can be spawned in one
     * frame. Optional: a context built for a loader that never spawns has no
     * reason to carry it.
     */
    preparePrefab?(ref: string): Promise<AssetLease<PreparedPrefab>>;
    loadText(path: string): Promise<string>;
    loadBinary(path: string): Promise<ArrayBuffer>;
    /**
     * Decode a texture ref to top-first RGBA pixels through the platform's ONE
     * decode path (a runtime-injected pixel decoder when present, else the
     * shared fetch→ImageBitmap route). For loaders that COMPOSE textures — the
     * tilemap loader folding an image-collection tileset into a grid atlas —
     * rather than uploading refs 1:1. Optional: minimal providers may lack it;
     * consumers fail loud.
     */
    decodePixels?(path: string): Promise<{
        width: number;
        height: number;
        pixels: Uint8Array;
    }>;
    /** Upload raw top-first RGBA as a texture (TextureLoader.loadFromPixels).
     *  Optional, same caveat as {@link decodePixels}. */
    createTextureFromPixels?(width: number, height: number, pixels: Uint8Array, flipY: boolean): Promise<TextureResult>;
    /**
     * The same upload, as something an era can OWN: a texture composed from
     * pixels has no path, no generation and no cache, so there is no receipt to
     * acquire — but it still has to be given back, and only the era that
     * composed it knows when. Releasing destroys it.
     */
    createOwnedTexture?(width: number, height: number, pixels: Uint8Array, flipY: boolean): Promise<AssetLease<TextureResult>>;
    /**
     * Read another asset's content because it shapes what this one becomes — a
     * `.tsj` folded into a `.tmj`. Takes the REF, not a build path: what is
     * recorded is the identity an invalidation will name.
     *
     * Nothing is held; what is recorded is that this asset must be rebuilt when
     * that content changes. A log setting read during a load is not one.
     */
    readSource?(ref: string): Promise<string>;
    /**
     * Audio API for the owning app, resolved lazily so that
     * AudioPlugin / AssetPlugin can be installed in either order.
     * Returns null when no AudioPlugin is installed — audio-typed
     * assets will fail to preload.
     */
    getAudio(): AudioAPI | null;
    /**
     * Sprite-animation API for the owning app (clip registry), resolved lazily
     * like {@link getAudio}. Returns null when no AnimationPlugin is installed.
     */
    getSpriteAnimation(): SpriteAnimationAPI | null;
    /**
     * Localization service for the owning app, resolved lazily like
     * {@link getAudio}. Returns null when no LocalizationPlugin is installed —
     * loading a `.eslocale` then fails loud (a table with nowhere to register
     * is a setup error, not a soft skip).
     */
    getLocalization(): LocalizationAPI | null;
}
/**
 * A loader whose asset lives in a REGISTRY under its ref: what a component
 * carries is the name, and every lookup asks what that name means now.
 *
 * Preparing is all of it. The slot holds the era and answers the lookup, so
 * there is no second place to write and nothing to keep in step with it.
 */
interface RegistryAssetLoader<T> {
    prepare(path: string, ctx: LoadContext): Promise<RegistryEra<T>>;
}
/**
 * How one asset type is loaded. A loader implements EXACTLY ONE door: `load` +
 * `unload` for an asset a component holds by handle, or `registry` for one it
 * holds by ref. Two doors to the same asset is two answers about who owns it.
 */
interface AssetLoader<T> {
    readonly type: string;
    readonly extensions: string[];
    load?(path: string, ctx: LoadContext): Promise<T>;
    /** Destroy what `load` made. What it ACQUIRED is the preparation's and goes
     *  back with the era — a loader releasing it here would free it twice. */
    unload?(asset: T): void;
    /** Set instead of `load`/`unload` when the asset is published by name. */
    registry?: RegistryAssetLoader<T>;
    /**
     * Sever any residency identity the loader's subsystem keeps for `path`
     * (hot reload: the source bytes changed, so a warm-cache entry must never
     * be revived). Called by `Assets.invalidate` for every registered loader,
     * whether or not the Assets-level cache held the path — the subsystem
     * cache can outlive it. Returns true if anything was dropped. Optional:
     * loaders whose results carry no out-of-Assets residency omit it.
     */
    invalidate?(path: string): boolean;
}

/**
 * Compressed-texture loading (KTX2 / Basis Universal).
 *
 * Decoded textures stay GPU-compressed in VRAM (4–8× smaller than RGBA8), the key
 * constraint on mobile. The actual transcode is done by a wasm side-module behind
 * the {@link BasisTranscoder} seam; this module owns the device
 * capability probe, the format choice, and the WebGL upload — all testable without
 * the wasm.
 *
 * Upload is JS-direct (`gl.compressedTexImage2D`) to mirror the existing
 * `TextureLoader` PNG path, and because WebGL compressed-texture extensions must be
 * enabled JS-side via `getExtension`. The C++ `GfxDevice::compressedTexImage2D`
 * entry backs the non-WebGL2 fallback path instead.
 */

/**
 * GPU compressed formats the transcoder can target, mirroring the C++
 * `GfxCompressedFormat`. ASTC is best quality/size, ETC2 is the WebGL2 baseline,
 * S3TC covers desktop GPUs.
 */
declare enum CompressedTextureFormat {
    ETC2_RGBA8 = "etc2-rgba8",
    ASTC_4x4 = "astc-4x4",
    S3TC_DXT5 = "s3tc-dxt5"
}
interface TranscodedLevel {
    readonly width: number;
    readonly height: number;
    readonly data: Uint8Array;
}
interface TranscodeResult {
    readonly width: number;
    readonly height: number;
    /** GPU-ready compressed block data for the requested format, level 0. */
    readonly data: Uint8Array;
    /** Every mip level the file carries, level 0 first; absent means level 0 only. */
    readonly levels?: readonly TranscodedLevel[];
}
interface RgbaResult {
    readonly width: number;
    readonly height: number;
    /** width*height*4 RGBA8 bytes, level 0. */
    readonly data: Uint8Array;
    /** Every mip level the file carries, level 0 first; absent means level 0 only. */
    readonly levels?: readonly TranscodedLevel[];
}
/**
 * Decodes a KTX2/Basis container into GPU-ready bytes. The concrete implementation
 * is a wasm side-module injected behind this interface, so the loader
 * decision logic stays unit-testable without it.
 */
interface BasisTranscoder {
    /** Transcode to a device-supported compressed format, or null if it cannot.
     *  A worker-backed transcoder answers with a promise. */
    transcode(ktx2: Uint8Array, target: CompressedTextureFormat): TranscodeResult | null | Promise<TranscodeResult | null>;
    /** Decode to uncompressed RGBA8 — the universal fallback. */
    transcodeToRgba(ktx2: Uint8Array): RgbaResult | null | Promise<RgbaResult | null>;
}
/** What a texture ended up as on the GPU. */
type UploadedGpuFormat = CompressedTextureFormat | 'rgba8';
/**
 * Why an upload landed on the format it did.
 *
 * `uncompressed-payload` is not a fallback — an ordinary image asked for
 * nothing. The other three each name a different thing to change: the DEVICE
 * samples none, the FILE would not transcode, or its size is not whole blocks.
 */
type TextureUploadReason = 'compressed' | 'no-device-format' | 'transcode-failed' | 'not-block-aligned' | 'uncompressed-payload';
/**
 * What one texture upload did with a cooked payload, on THIS device.
 *
 * The second half; the first is what the build shipped
 * (pipeline/src/assets/textureCookDecision.ts). Kept apart because a cook that
 * shipped raw is a build setting and a device that decoded it is a device.
 */
interface TextureUploadDecision {
    /** What arrived: a transcodable container, or a plain image. */
    readonly payload: 'ktx2' | 'raw';
    /** The best format this device offered for it; null when it offered none. */
    readonly target: CompressedTextureFormat | null;
    readonly effective: UploadedGpuFormat;
    readonly reason: TextureUploadReason;
}
/** The decision a compressed payload came to, given the device's answer and
 *  whether the transcode to it worked. Pure — the three cases hold without a
 *  GL context, a device or the basis module. */
declare function compressedUploadDecision(target: CompressedTextureFormat | null, transcoded: boolean): TextureUploadDecision;
/** A texture that was never a compressed payload — an ordinary image upload. */
declare const RAW_PAYLOAD_UPLOAD: TextureUploadDecision;

/**
 * @file  textureFormatReport.ts
 * @brief What the textures this realm loaded actually became on the GPU.
 *
 *        A cooked KTX2 that the device cannot sample is decoded to RGBA and
 *        uploaded — correctly, four times larger, and until now with nothing
 *        anywhere saying so. This is the ledger of those decisions, kept where
 *        they are taken (the loader) and therefore scoped to the realm that took
 *        them, so a report never outlives the textures it describes.
 *
 *        `deviceFormats` is the INPUT, not an outcome: the formats this machine
 *        samples at all. Empty with `deviceProbed` false means nobody could be
 *        asked yet — a different answer from "this device supports none", and
 *        collapsing them is how "0" reads as a fact instead of a silence.
 */

interface TextureFormatRecord extends TextureUploadDecision {
    /** The residency key the texture was loaded under. */
    readonly path: string;
}
interface TextureFormatReport {
    /** Compressed formats this device samples, best first. */
    readonly deviceFormats: readonly CompressedTextureFormat[];
    /** Whether anything was in a position to answer the question. */
    readonly deviceProbed: boolean;
    readonly textures: readonly TextureFormatRecord[];
    /** Compressed payloads that stayed compressed. */
    readonly compressed: number;
    /** Compressed payloads decoded to RGBA — the ones that cost 4x their VRAM. */
    readonly decoded: number;
}
/**
 * The record for one asset path, whichever flip orientation it loaded under.
 *
 * Rows are keyed by residency key (path + flip), so a caller holding a plain
 * asset path cannot look one up — and a caller that reconstructed the key would
 * own a copy of a shape that is not its to know.
 */
declare function textureFormatOf(report: TextureFormatReport | null, path: string): TextureFormatRecord | null;

/**
 * Decode a texture ref to raw RGBA pixels on the current platform. Set by a
 * caller that fetches through a channel `TextureLoader`'s URL-based `<img>`
 * decode can't reach — e.g. the runtime scene loader, whose asset providers
 * pre-decode from `estella://` / WeChat package files / inlined data-URLs. When
 * set, non-KTX2 textures upload through this instead of `loadImage(url)`.
 */
type TexturePixelDecoder = (path: string, flip: boolean, maxEdge?: number) => Promise<{
    width: number;
    height: number;
    pixels: Uint8Array;
    sourceWidth?: number;
    sourceHeight?: number;
}>;
/**
 * Where a host keeps its textures GPU-compressed: the KTX2 for `path`, `'pending'`
 * while it is being made, or null for one that is not. A pending texture is drawn
 * from a preview no larger than {@link TEXTURE_PREVIEW_EDGE}, so art still being
 * compressed is not held in video memory in full.
 */
type TextureCompressedSource = (path: string) => Promise<Uint8Array | 'pending' | null>;
/**
 * Texture import-time settings. Applied when the GL texture is first uploaded,
 * because WebGL sampler state lives on the texture object — the only way to
 * change filter/wrap after the fact is to hold the GL texture id and call
 * `texParameteri`. See {@link TextureLoader#importSettingsResolver}.
 */
interface TextureImportSettings {
    readonly filter?: 'linear' | 'nearest';
    readonly wrap?: 'repeat' | 'clamp' | 'mirror';
    readonly mipmaps?: boolean;
    /** Whether the image stores sRGB-encoded color (default). Authored-linear
     *  data (normal maps, masks) sets false so the linear pipeline skips the
     *  hardware EOTF. Ignored in gamma mode. */
    readonly srgb?: boolean;
    /**
     * 9-slice border in texture pixels. A property of the IMAGE (where its
     * corners end), not of any one entity — so it is authored once at import
     * and every `UIVisual` set to NineSlice inherits it. Applied to the texture
     * handle's metadata at load; a UIVisual may still override per entity.
     */
    readonly sliceBorder?: {
        readonly left: number;
        readonly right: number;
        readonly top: number;
        readonly bottom: number;
    };
}
type TextureImportSettingsResolver = (ref: string) => TextureImportSettings | undefined;
declare class TextureLoader implements AssetLoader<TextureResult> {
    private readonly imageRevisions_;
    /** End the browser image-cache identity when an asset's bytes change. */
    invalidate(path: string): boolean;
    readonly type = "texture";
    readonly extensions: string[];
    private module_;
    /**
     * Basis transcoder for KTX2 assets. Either injected directly via
     * {@link setTranscoder} (tests / embedded realms) or acquired lazily on the
     * first KTX2 load via {@link setTranscoderProvider} — AssetPlugin wires the
     * provider to `app.sideModules.acquire('basis')`, so the basis wasm is only
     * fetched when a project actually uses compressed textures (self-gating, like
     * physics / spine).
     */
    private transcoder_;
    private transcoderProvider_;
    private transcoderPending_;
    setTranscoder(t: BasisTranscoder | null): void;
    setTranscoderProvider(p: (() => Promise<BasisTranscoder | null>) | null): void;
    /** The transcoder, acquiring it once on demand. Concurrent KTX2 loads share
     *  the in-flight acquisition so the basis module loads exactly once. */
    private ensureTranscoder_;
    /**
     * What every texture this loader uploaded became, and the device capability
     * that constrained it. Owned by the loader, so it is scoped to the realm that
     * took the decisions and cannot outlive the textures it describes.
     */
    private readonly formats_;
    /** Where each texture this loader decoded from a file came from: what a resize decodes again. */
    private readonly sources_;
    private pendingStartEdge_;
    /** How many loads began smaller than their file (texture streaming), and how many were asked to: a report, and what a check reads. */
    startedSmall: number;
    askedSmall: number;
    /** The same sources by residency key, kept past a release: a texture revived from the warm cache is the same file at the size it was left at. */
    private readonly sourcesByKey_;
    /** The decision the in-flight upload came to. Set by the one entry point that
     *  chooses a path (decodeAndUpload_) and read by the one that records. */
    private lastDecision_;
    private deviceFormats_;
    /**
     * Optional hook that returns per-asset import settings. Invoked at
     * load-time with the ORIGINAL ref (pre-resolution), so callers can key
     * off `@uuid:...` directly. Undefined-result falls back to defaults.
     */
    importSettingsResolver: TextureImportSettingsResolver | null;
    constructor(module: ESEngineModule | null);
    /** Currently-effective settings for the in-flight load. Set by Assets.ts
     *  before delegating to load(); cleared when done. Avoids threading a new
     *  param through the AssetLoader interface, which is also implemented by
     *  non-texture loaders that don't need it. */
    private pendingSettings_;
    setPendingSettings(s: TextureImportSettings | undefined): void;
    /** Platform pixel decoder (see {@link TexturePixelDecoder}). Null ⇒ the
     *  default URL `<img>` decode path (editor / app Assets, unchanged). */
    private pixelDecoder_;
    setPixelDecoder(decoder: TexturePixelDecoder | null): void;
    get pixelDecoder(): TexturePixelDecoder | null;
    /** Compressed-texture source (see {@link TextureCompressedSource}). */
    private compressedSource_;
    setCompressedSource(source: TextureCompressedSource | null): void;
    load(path: string, ctx: LoadContext): Promise<TextureResult>;
    loadRaw(path: string, ctx: LoadContext): Promise<TextureResult>;
    loadFromPixels(width: number, height: number, pixels: Uint8Array, flipY: boolean, content: TextureContent): Promise<TextureResult>;
    unload(asset: TextureResult): void;
    /**
     * Loads the bytes onto the GPU WITHOUT claiming the path — what a re-upload
     * after a device loss wants, since the identity belongs to the handle being
     * recovered. Claiming it leaves the pool holding two records, and the loser
     * is swept up by the next loss with nobody able to re-upload it.
     */
    loadDetached(path: string, ctx: LoadContext, flip: boolean, settings?: TextureImportSettings): Promise<TextureResult>;
    /**
     * Decode the texture behind @p handle again, no larger than @p maxEdge texels on a side (0 is its full size), and move the new
     * pixels behind the handle: everything that holds the handle — a material, a renderer, a batch key — sees the new size at once.
     * The texture streamer's one move. False for a handle this loader did not decode from a file, or one the host cannot re-point.
     */
    resize(handle: number, maxEdge: number, ctx: LoadContext): Promise<{
        width: number;
        height: number;
    } | null>;
    /** Whether @p handle was decoded from a file by this loader, so it can be decoded again at another size. */
    resizable(handle: number): boolean;
    /** The size of the file behind @p handle, whatever size it is held at; null for one this loader did not decode from a file. */
    fullSize(handle: number): {
        width: number;
        height: number;
    } | null;
    /** Decode the next load no larger than @p edge on a side (texture streaming's start), where the file's own size can still be known. */
    setPendingStartEdge(edge: number): void;
    /** A texture the warm cache gave back under @p key is the one this loader decoded under it: resizable again. */
    adoptRevived(handle: number, key: string): void;
    private loadWithFlip;
    private decodeAndUpload_;
    /** Decode @p path (whose bytes are at @p buildPath; @p copy when that is its small copy) no larger than @p maxEdge, and upload it. */
    private decodeFile_;
    /** An encoded image in memory, through the same image path a URL takes. */
    private uploadImageBytes_;
    /**
     * Upload a KTX2 (Basis) compressed texture: transcode to a device-supported GPU
     * format (or RGBA8 fallback), and upload. KTX2 carries its own orientation, so
     * the `flip` flag does not apply.
     */
    private uploadKtx2_;
    private uploadKtx2Levels_;
    /**
     * KTX2 through the engine's own upload, for a backend with no GL context.
     * Falls back to an RGBA decode when no compressed format is available or the
     * transcode to it fails — the same bargain the GL path makes.
     */
    private loadCompressedViaEngine;
    /**
     * Decode `src` into a GPU-uploadable source. When `createImageBitmap` is
     * available we bake the vertical orientation into the bitmap here via
     * `imageOrientation`, NOT later via `UNPACK_FLIP_Y_WEBGL`: Chromium/ANGLE
     * silently ignore that pixel-store flag for `ImageBitmap` sources, so relying
     * on it uploads every texture upside-down. The raw `<img>` fallback keeps the
     * flag (it works for element/pixel sources) — see {@link createTextureFromImage}.
     */
    private loadImage;
    private createTextureFromImage;
    private getWebGL2Context;
    /**
     * Which compressed formats this device samples, best first.
     *
     * The INPUT to every upload decision, and the half a realm answers without
     * loading one. Null when nothing could be asked — an empty list would read as
     * a capability. Cached, since `getExtension` also ENABLES.
     */
    deviceFormats(): CompressedTextureFormat[] | null;
    /** What the textures this loader uploaded became, and on what device. */
    formatReport(): TextureFormatReport;
    private createTextureWebGL2;
    private createTextureFallback;
}

/**
 * @file    AssetRefLedger.ts
 * @brief   Who still holds an asset, per generation, with a receipt per acquire.
 *
 * @details A cache key is not an identity. `invalidate()` mints a new
 *          generation of the same key while the previous one still has holders,
 *          so a key-addressed release cannot know which one the caller was
 *          handed — it can only guess, and guessing frees somebody else's
 *          asset while leaving the caller's with nobody able to free it.
 *
 *          So an acquire hands back a LEASE: the receipt for that one
 *          acquisition. Releasing means giving the receipt back, not naming a
 *          path and hoping. The generation id is minted here rather than taken
 *          from the value, because a loader may hand out an `===` equal value
 *          for a later generation and two eras must never merge.
 *
 *          One implementation, because there were two: textures kept handles
 *          and generic assets kept loader entries, and only the texture one had
 *          been taught about generations. The kind of resource is the caller's
 *          business; the accounting is not.
 */
/** The receipt for one acquisition. Give it back to release exactly that one. */
interface AssetRefLease<T> {
    readonly key: string;
    /** Ledger-minted. Distinguishes eras even when their values compare equal. */
    readonly generation: number;
    readonly value: T;
}

/**
 * @file  .esmesh — GPU-resident geometry on disk.
 *
 *        Self-describing: the channel table is written out rather than implied by
 *        a mask, so a file states its own strides and offsets and a reader needs
 *        no table of its own. Adding a channel is then an append to the vocabulary
 *        below, not a format version — and a mesh without normals stays a file
 *        without normals instead of one carrying zeroes.
 */
/**
 * Joints one draw can be posed by — what the RENDERER holds (256 mat4 is 16KB,
 * exactly WebGL2's guaranteed block), not what the format carries. A mesh bound
 * to more is drawn in its bind pose: a joint index no uploaded matrix answers
 * moves the vertex nowhere in particular. Mirrors GfxEnums.hpp.
 */
declare const MESH_MAX_BONES = 256;
/**
 * What a channel means. The value IS the shader attribute location, and the first
 * three match the 2D batch layout, so one attribute vocabulary serves both vertex
 * sources. Append only: these numbers are serialized.
 */
declare const MeshChannel: {
    readonly Position: 0;
    readonly Color: 1;
    readonly TexCoord0: 2;
    readonly Normal: 3;
    readonly Tangent: 4;
    /** Which joints move this vertex — indices into the mesh's own bind matrices. */
    readonly Joints: 5;
    /** How much each of those four joints moves it. */
    readonly Weights: 6;
    /** A second UV set: what an unwrap produces for a lightmap, a detail pass or an
     *  AO atlas. Carried because the boundary is lossy in one direction — a source
     *  that had one cannot be re-derived — and read by nothing yet, which is why
     *  `meshShaderReads` in GfxEnums.hpp keeps it out of the vertex LAYOUT. */
    readonly TexCoord1: 7;
};
declare const MeshChannelType: {
    readonly Float32: 0;
    readonly UNorm8: 1;
    /** Joint indices: glTF writes them as u8 or u16, and u16 loses neither. */
    readonly UInt16: 2;
};
interface MeshChannelDesc {
    /** One of {@link MeshChannel}; also the attribute location. */
    semantic: number;
    /** 1..4. */
    components: number;
    /** One of {@link MeshChannelType}. */
    type: number;
    /** Byte offset of this channel within one vertex. */
    offset: number;
}
/**
 * The shapes a mesh can be blended towards, as offsets from the vertices it
 * carries. Deltas rather than whole positions because a target usually moves a
 * fraction of the mesh, and what is stored is then zero wherever it says nothing.
 */
interface MeshMorphTargets {
    /** One name per target, in the order weights address them. */
    names: string[];
    /** Whether each target carries a normal delta behind its position delta.
     *  A mesh-wide fact, not a per-target one: the deltas are one packed array
     *  and a reader cannot find target `i` without a fixed stride. */
    hasNormals: boolean;
    /**
     * `targets * vertexCount * (hasNormals ? 6 : 3)` floats: for each target,
     * for each vertex, the position delta and — when carried — the normal delta.
     * Float32 and not half: half is what the GPU wants, and narrowing here would
     * make every other reader (a collider, an editor preview) inherit that choice.
     */
    deltas: Float32Array;
}
interface MeshData {
    channels: MeshChannelDesc[];
    vertexStride: number;
    vertexCount: number;
    /** Interleaved vertex bytes, `vertexCount * vertexStride` long. */
    vertices: Uint8Array;
    indices: Uint32Array;
    aabbMin: [number, number, number];
    aabbMax: [number, number, number];
    /**
     * The bind pose, one 4x4 per joint, in the order the `Joints` channel indexes.
     * It lives with the vertices because those indices point AT it — split apart,
     * a file's indices would name something it does not carry. Absent for
     * geometry that is not skinned.
     */
    inverseBindMatrices?: Float32Array;
    /**
     * The shapes this geometry can be blended towards. Like the bind pose, it
     * lives with the vertices because it is indexed BY them — one delta per
     * vertex per target, so a file carrying the two apart could not say which
     * vertex a delta moves.
     */
    morph?: MeshMorphTargets;
}
/**
 * Byte size of one vertex for these channels, laid out in the order given.
 *
 * Rounded up to 4 so every channel starts aligned: WebGL rejects a float
 * attribute at an unaligned offset, and a colour packed between two of them is
 * exactly how that happens.
 */
declare function packChannels(semantics: {
    semantic: number;
    components: number;
    type: number;
}[]): {
    channels: MeshChannelDesc[];
    vertexStride: number;
};
declare function encodeMesh(data: MeshData): Uint8Array;
declare function decodeMesh(bytes: Uint8Array): MeshData;
/** The channel table as the engine takes it: one 8-byte record per channel. */
declare function encodeChannelTable(channels: MeshChannelDesc[]): Uint8Array;

type ReleaseCallback = () => void;

/**
 * @file    AssetRefCounter.ts
 * @brief   Optional asset reference counting for debugging and monitoring
 */
interface AssetRefInfo {
    assetPath: string;
    refCount: number;
    entities: number[];
}
declare class AssetRefCounter {
    private textures_;
    private fonts_;
    private materials_;
    addTextureRef(path: string, entity: number): void;
    removeTextureRef(path: string, entity: number): void;
    getTextureRefCount(path: string): number;
    getTextureRefs(path: string): number[];
    getAllTextureRefs(): AssetRefInfo[];
    addFontRef(path: string, entity: number): void;
    removeFontRef(path: string, entity: number): void;
    getFontRefCount(path: string): number;
    getFontRefs(path: string): number[];
    getAllFontRefs(): AssetRefInfo[];
    addMaterialRef(path: string, entity: number): void;
    removeMaterialRef(path: string, entity: number): void;
    getMaterialRefCount(path: string): number;
    getMaterialRefs(path: string): number[];
    getAllMaterialRefs(): AssetRefInfo[];
    removeAllRefsForEntity(entity: number): void;
    clear(): void;
    getTotalRefCount(): {
        textures: number;
        fonts: number;
        materials: number;
    };
    /**
     * Total (asset, entity) pairs held, across every kind — the number a
     * spawn/despawn round trip must conserve.
     *
     * {@link getTotalRefCount} counts distinct PATHS, which understates a leak:
     * ten thousand entities that never released one texture read as a single ref.
     */
    getTotalRefRows(): number;
}

/**
 * One asset generation ending: which ref, what kind of asset it was, and what
 * live holders were bound to just before the drop.
 *
 * The kind travels because every source of one knows it, and a listener that
 * has to guess can only serve the kind somebody had in mind.
 */
interface AssetInvalidation {
    /** As the caller spelled it, not the resolved path. */
    readonly ref: string;
    /** In whichever vocabulary the source knew: a loader/field type, or the
     *  manifest's type for an applied update. */
    readonly type: AssetFieldType | AddressableAssetType;
    /** What holders were bound to: a texture's handle, a loader's value.
     *  Undefined when nothing was cached to report. */
    readonly oldValue?: unknown;
}
/** Callback fired when an asset generation ends — `Assets.invalidate(ref)`
 *  dropped cache entries, or `applyUpdate` replaced the content behind a ref. */
type InvalidateListener = (event: AssetInvalidation) => void;
/** Input to {@link Assets.checkForUpdate}. */
interface CheckForUpdateOptions {
    /** Url of the candidate (remote) manifest JSON — diffed against the active one. */
    manifestUrl: string;
    /** CDN root the candidate's `remote`-group assets are served from; remembered
     *  and applied by {@link Assets.applyUpdate}. Defaults to the current root. */
    remoteRoot?: string;
}
/** One asset {@link Assets.applyUpdate} could not deliver: `fetch` (download
 *  failed) or `integrity` (bytes' content hash ≠ the manifest's). */
interface AssetDownloadFailure {
    path: string;
    /** `packed`: the update's manifest packs the asset, and an update downloads assets one by one. */
    reason: 'fetch' | 'integrity' | 'packed';
}
/**
 * How far an update got. Each is its own answer: an update can be running in this
 * session and still be gone on the next launch, which a single `ok` cannot say.
 */
interface UpdateStages {
    /** Every changed asset downloaded and matched its content hash. */
    verified: boolean;
    /** This session runs on the new manifest, and its asset graph has settled on it. */
    applied: boolean;
    /** The next launch starts on it: stored, and read back. Null without a persistence key. */
    persisted: boolean | null;
    /** Every changed remote asset is in the disk cache, so the next launch reads them
     *  without the network. Null where the platform keeps no cache. */
    cached: boolean | null;
}
/** Outcome of {@link Assets.applyUpdate} — atomic: `ok` only when every changed
 *  asset downloaded + verified and the manifest was swapped. On failure nothing
 *  is applied (`updated: 0`) and `failed` lists why (rollback). */
interface ApplyUpdateResult {
    ok: boolean;
    updated: number;
    failed: AssetDownloadFailure[];
    stages: UpdateStages;
    /** The revision this session runs on afterwards. */
    revision: string | null;
    /** The changed assets the cache refused, by url: what the next launch fetches again. */
    uncached: string[];
    /** Why nothing was attempted: no update staged (none checked, or another apply took it). */
    reason?: 'nothing-staged';
}
/** What {@link Assets.updateStatus} reports. */
interface UpdateStatus {
    /** The revision this session runs on. */
    revision: string | null;
    /** The revision the next launch starts on, when an update was persisted. */
    persistedRevision: string | null;
    /** The update {@link Assets.checkForUpdate} staged, and what applying it downloads. */
    staged: {
        revision: string | null;
        assets: number;
        bytes: number;
    } | null;
    applying: boolean;
}
interface AssetsOptions {
    backend: Backend;
    catalog?: Catalog;
    /**
     * Addressable manifest (groups + bundle modes). When set, enables
     * `loadGroup(name)`. Accepts the raw manifest JSON or a pre-built
     * {@link ManifestModel}. Optional — label/path loading works without it.
     */
    manifest?: AddressableManifest | ManifestModel;
    /** The wasm module, or null on the native (embedded-Dawn) backend, which has
     *  no wasm heap — its ResourceManager uploads texture bytes directly. */
    module: ESEngineModule | null;
    /**
     * Lazy accessor for the owning app's Audio API. AudioAssetLoader
     * calls it at load time so AssetPlugin and AudioPlugin can be built
     * in any order. Pass null (or omit) if no audio support is needed.
     */
    getAudio?: () => AudioAPI | null;
    getSpriteAnimation?: () => SpriteAnimationAPI | null;
    /** Lazy accessor for the owning app's Localization service, same contract
     *  as {@link getAudio} — `.eslocale` tables register through it. */
    getLocalization?: () => LocalizationAPI | null;
}
interface AssetBundle {
    textures: Map<string, TextureResult>;
    materials: Map<string, MaterialResult>;
    spine: Map<string, SpineResult>;
    fonts: Map<string, FontResult>;
    /**
     * What this load actually acquired. Release through it rather than by group
     * name: a manifest can be updated between the two, and then the group's
     * membership is no longer the set this bundle took out.
     */
    scope: AssetScope;
    /** Give back everything this bundle acquired. Idempotent. */
    release(): void;
}
/**
 * Describes one asset a scene / prefab referenced that couldn't be
 * materialized into a usable handle. The caller of preloadSceneAssets
 * uses this to surface editor UI ("missing asset") or to abort the
 * load entirely — instead of the old behaviour of silently storing
 * `texture: 0` and hoping the renderer notices.
 */
interface MissingAsset {
    /** The original serialized ref (`"@uuid:..."` or a plain path). */
    ref: string;
    /** Asset type (`"texture"`, `"material"`, ...) when known. */
    type?: string;
    /** `unresolved` = UUID not in registry; `load-failed` = fetch threw. */
    reason: 'unresolved' | 'load-failed';
    /** Stringified error for `load-failed`. */
    error?: string;
}
interface SceneAssetResult {
    textureHandles: Map<string, number>;
    materialHandles: Map<string, number>;
    fontHandles: Map<string, number>;
    meshHandles: Map<string, number>;
    environmentHandles: Map<string, number>;
    probeVolumeHandles: Map<string, number>;
    releaseCallbacks: ReleaseCallback[];
    /**
     * What this preload actually acquired. Release side reads THIS rather than
     * re-deriving from the scene's declared refs: a failed load left no lease,
     * and an invalidate mid-load left the receipt of the era we really got.
     */
    scope: AssetScope;
    /** @internal Projection of successful acquisitions; their scope/era remains the owner. */
    acquisitions?: readonly {
        readonly type: string;
        readonly path: string;
        readonly lease: AssetLease;
    }[];
    missing: MissingAsset[];
    /** Per asset type: how many loaded, the sum of their load times and the
     *  slowest one, in ms. Loads overlap, so the sums exceed the wall time. */
    timings: Record<string, {
        count: number;
        ms: number;
        slowestMs: number;
    }>;
    /** Wall time of the whole preload, in ms. */
    wallMs: number;
}
type AssetRefResolver = (ref: string) => string | null;
declare class Assets {
    readonly backend: Backend;
    readonly catalog: Catalog;
    get baseUrl(): string | undefined;
    set baseUrl(url: string | undefined);
    private baseUrl_?;
    private module_;
    private manifestModel_;
    /** CDN root that `remote`-group assets resolve against; see {@link setRemoteRoot}. */
    private remoteRoot_?;
    /** Applies run one after another: two at once would each commit, and one that
     *  finishes after a newer check would clear the newer candidate. */
    private applyChain_;
    private applying_;
    /** The update staged by {@link checkForUpdate}, consumed by {@link applyUpdate}. */
    private pendingUpdate_;
    /** Storage key {@link applyUpdate} persists the active manifest under; set by
     *  {@link restorePersistedUpdate}. Null → persistence off. */
    private persistKey_;
    /** The revision this package shipped, read when persistence is armed at boot. */
    private shippedRevision_;
    private cacheOwner_;
    private cacheRollback_;
    private cacheLaunch_;
    private cacheLaunchRollback_;
    private activeUpdate_;
    private getAudio_;
    private getSpriteAnimation_;
    private getLocalization_;
    private loaders_;
    private textureLoader_;
    private textureImportResolver_;
    private spineLoader_;
    private textureCache_;
    /** Live texture references per cache key. See {@link AssetRefLedger}. */
    private textureRefs_;
    /**
     * Bumped by releaseAll(). A load in flight across one has no owner left: the
     * scene that asked is gone and its references were dropped, so the texture
     * it produces is destroyed by the pool before the caller's `await` ever
     * resumes. Delivering that handle is a use-after-free; the load fails instead.
     */
    private resetEpoch_;
    private releasing_;
    private preparations_;
    /** @internal How many times everything this loader held has been given back: what a holder kept of an earlier one names things that are gone. */
    get epoch(): number;
    private assertLoading_;
    /** Handles already disowned in this epoch, so N callers sharing one load
     *  drop its single C++ reference once between them, not N times. */
    private abandoned_;
    private genericCache_;
    /** Per-asset reference counts for the generic caches, keyed `type:path`.
     *  Same contract as textures: every load*() increments, every release*()
     *  decrements, and the loader's unload runs only at zero — so an asset
     *  shared by two scenes survives the first scene's unload. */
    private genericRefs_;
    /** Eras already given back, so N callers abandoning one shared load hand it
     *  over once between them rather than unloading it N times. */
    private retired_;
    /** Propagations in flight — what {@link assetGraphSettled} waits on. */
    private settling_;
    private loadContext_;
    private assetRefResolver_;
    private refCounter_;
    private invalidateListeners_;
    private readonly appScope_;
    private readonly entityScopes_;
    private readonly registrySlots_;
    /** `"<kind>:<handle>"` → resolved load path, recorded on every handle-yielding
     *  load. The REVERSE of resolution — inspectors and tooling that only hold a
     *  live World handle use it to name the asset (see {@link pathForHandle}). */
    private handleToPath_;
    /** Textures a mesh draws, by resolved path, directly or through a material: what texture streaming may load small to begin with. */
    private readonly meshTextures_;
    /** Materials a mesh draws with, by resolved path: their textures join {@link meshTextures_} as the material loads them. */
    private readonly meshMaterials_;
    /** The edge a mesh texture is first loaded at while texture streaming is on; 0 loads it whole. */
    private streamingStartEdge_;
    /**
     * Geometry built at run time rather than loaded (a static batch), by handle. It has no file to be replayed
     * from, so the data itself is kept: a device loss puts it back from here.
     */
    private builtMeshes_;
    private constructor();
    static create(options: AssetsOptions): Assets;
    register<T>(loader: AssetLoader<T>): void;
    getLoader<T>(type: string): AssetLoader<T> | undefined;
    loadTexture(ref: string): Promise<TextureResult>;
    loadTextureRaw(ref: string): Promise<TextureResult>;
    /**
     * The textures the engine is waiting for content for — its ledger, not a
     * mirror of this cache — with who refills each and the path it was
     * registered under. A blank path is not this layer's to fetch.
     */
    texturesAwaitingReupload(): {
        handle: number;
        content: TextureContent;
        path: string;
    }[];
    /**
     * Decode the texture behind @p handle again, no larger than @p maxEdge texels on a side (0 is its full size), behind the same handle:
     * what texture streaming moves a texture between sizes with. Null for a texture no file of this realm's stands behind.
     */
    resizeTexture(handle: number, maxEdge: number): Promise<{
        width: number;
        height: number;
    } | null>;
    /** The size of the file behind @p handle, whatever size it is held at; null for a texture no file of this realm's stands behind. */
    textureFullSize(handle: number): {
        width: number;
        height: number;
    } | null;
    /**
     * Load the textures meshes draw no larger than @p edge on a side to begin with (0 loads them whole): texture streaming grows each
     * to what its views need. A texture something else also draws is put back at its size by the streamer.
     */
    setTextureStreamingStart(edge: number | (() => number)): void;
    /** Whether {@link resizeTexture} can move @p handle between sizes. */
    textureResizable(handle: number): boolean;
    /**
     * Refills every owed texture someone can: an asset texture is loaded again and
     * moved behind its handle, any other goes to the refill its creator provided.
     * Content nobody can remake is forgone by name, or the device recovers forever.
     */
    reuploadTexturesAfterDeviceLoss(): Promise<number>;
    /**
     * The meshes the engine is waiting for geometry for, by handle. No path
     * travels with them: the engine never knew one, and this layer does.
     */
    meshesAwaitingRematerialization(): number[];
    /** Every live mesh and whether its geometry is on the device. */
    meshRealizations(): {
        handle: number;
        realized: boolean;
    }[];
    /**
     * Replays each owed mesh from its source, into the handle it already has.
     *
     * A missing provenance is a CONTRACT VIOLATION, not a mesh that turns out to
     * be unrecoverable: the engine only owes what a producer declared
     * replayable, so an absent path means this layer lost the record.
     *
     * @return How many came back. The rest stay owed.
     */
    rematerializeMeshesAfterDeviceLoss(): Promise<number>;
    /**
     * Pays what the engine owes after rebuilding the device. The rebuild itself
     * is the engine's, once per loss; this only refills content. Returns whether
     * the device is whole — false while the context is not back yet, or while
     * content is still owed, so a caller retries.
     */
    recoverFromDeviceLoss(): Promise<boolean>;
    /** The decoded geometry behind a mesh handle this realm loaded, or null when nothing here can name it. */
    readMeshData(handle: number): Promise<MeshData | null>;
    /** Uploads geometry built at run time. Returns its handle, or 0 when the engine refused it. */
    createMesh(data: MeshData): number;
    /** Gives back geometry {@link createMesh} made. */
    releaseBuiltMesh(handle: number): void;
    private loadTextureVariant_;
    private acquireTextureVariant_;
    /**
     * Try to revive an evictable texture from the C++ pool's residency cache.
     * Returns null on a miss — or when the resource-manager surface doesn't
     * support residency (minimal test mocks). Gated on invalidateTexturePath
     * too: reviving without the ability to sever a path on hot reload could
     * hand out stale bytes, so both must be present or neither is used.
     */
    private reviveResidentTexture_;
    /**
     * Provide per-asset texture import settings at load time (filter, wrap,
     * mipmaps). The resolver is called with the original ref — keyed off
     * `@uuid:...` in editor scenarios. Returning `undefined` uses defaults.
     */
    setTextureImportSettingsResolver(resolver: TextureImportSettingsResolver | null): void;
    getTexture(ref: string): TextureResult | undefined;
    /**
     * The load path behind a LIVE handle (`kind` = the asset slot type:
     * 'texture' | 'material' | 'font' | …), or null when this realm never
     * loaded such a handle. The reverse of ref resolution — the live "Game"
     * inspector uses it to show WHICH asset a World component's handle-valued
     * slot is wearing (a raw handle number names nothing to a human).
     */
    pathForHandle(kind: string, handle: number): string | null;
    /**
     * The load path of a texture by the id the renderer bound it with — a frame
     * capture's `textureId` — rather than by asset handle. Null for a texture no
     * asset of this realm loaded: the white fill, a render target, a glyph atlas.
     */
    pathForRenderedTexture(renderId: number): string | null;
    /** Record a handle→path pair, dropped on invalidation or final release. */
    private recordHandlePath_;
    /** {@link acquireSpine} without the receipt, for a caller that will let the
     *  realm's teardown be its release. */
    loadSpine(skeletonRef: string, atlasRef?: string): Promise<SpineResult>;
    /**
     * One spine PAIR — a skeleton and the atlas it is drawn with. The same
     * skeleton with another atlas is another asset, which is why the receipt
     * names the pair and not the skeleton's path.
     */
    acquireSpine(skeletonRef: string, atlasRef?: string): Promise<AssetLease<SpineResult>>;
    private acquireSpineLease_;
    /** The atlas of a pair the caller named only half of: a skeleton's atlas is
     *  a Catalog dependency, which is what a cook records for it. */
    private spineAtlasOf_;
    loadMaterial(ref: string): Promise<MaterialResult>;
    loadFont(ref: string): Promise<FontResult>;
    loadAudio(ref: string): Promise<AudioResult>;
    loadAnimClip(ref: string): Promise<AnimClipResult>;
    /**
     * A clip is published under the load path AND the ref as it was spelled: a
     * realm whose resolver returns URLs hands the loader `estella://…/walk.esanim`
     * while components ask for `assets/animations/walk.esanim`. Both names are
     * the slot's, so a republish is seen through either.
     */
    private acquireAnimClip_;
    loadTilemap(ref: string): Promise<TilemapResult>;
    loadTileset(ref: string): Promise<TilesetResult>;
    loadTimeline(ref: string): Promise<TimelineResult>;
    /** Load a `.eslocale` string table and merge it into the app's Localization
     *  catalogs. Requires the LocalizationPlugin (fails loud otherwise). */
    loadLocaleTable(ref: string): Promise<LocaleResult>;
    /** Load a `.esfsm` state machine into the shared AI store, keyed by its
     *  asset path — the ref a StateMachineAgent's `fsm` field resolves. */
    loadStateMachine(ref: string): Promise<FsmResult>;
    /** Load a `.esbt` behavior tree into the shared AI store, keyed by its
     *  asset path — the ref a BehaviorTreeAgent's `bt` field resolves. */
    loadBehaviorTree(ref: string): Promise<BtResult>;
    /** Load a `.esanimator` controller into the shared animator store, keyed by
     *  its asset path — the ref an Animator's `controller` field resolves. */
    loadAnimatorController(ref: string): Promise<AnimatorControllerResult>;
    loadPrefab(ref: string): Promise<PrefabResult>;
    /**
     * Load a `.json` data asset — a game's own table, tuning or dialogue file.
     *
     * `T` is what the caller expects the document to be; nothing validates it,
     * so this is `JSON.parse`'s guarantee, not a schema's. What the asset system
     * adds over fetching the file yourself is everything around the parse: ref
     * resolution (`@uuid:` and manifest paths), one parse per file, group /
     * subpackage delivery, and hot update.
     */
    loadJson<T = unknown>(ref: string): Promise<JsonResult<T>>;
    load<T>(type: string, ref: string): Promise<T>;
    getAtlasFrame(ref: string): AtlasFrameInfo | null;
    /**
     * Set (or clear) the addressable manifest used by {@link loadGroup}.
     * Accepts the raw manifest JSON or a pre-built {@link ManifestModel};
     * `null` clears it.
     */
    setManifest(manifest: AddressableManifest | ManifestModel | null): void;
    getManifest(): ManifestModel | null;
    loadByLabel(label: string, onProgress?: (loaded: number, total: number) => void): Promise<AssetBundle>;
    /**
     * Load every asset in an addressable group through the typed loaders,
     * warming the cache (and populating the returned bundle for the four
     * displayable types). Requires a manifest (see {@link setManifest}); with
     * no manifest set, this is a no-op returning an empty bundle.
     *
     * This is the single group-loading channel — the basis for on-demand /
     * subpackage delivery. It dispatches through the same per-type loaders as
     * {@link loadByLabel}, so the two never diverge.
     */
    loadGroup(groupName: string, onProgress?: (loaded: number, total: number) => void): Promise<AssetBundle>;
    /**
     * Release every asset the group's CURRENT membership names.
     *
     * @details Prefer `bundle.release()` on what {@link loadGroup} returned:
     *          this door re-reads the manifest, so an update between the two
     *          releases a set the load never took. No-op without a manifest.
     */
    releaseGroup(groupName: string): void;
    /** The CDN / remote root that `remote`-group assets resolve against. */
    get remoteRoot(): string | undefined;
    /** Point `remote`-group resolution at a CDN root: their content-addressed
     *  paths then fetch from `<root>/<path>`. A trailing slash is trimmed;
     *  `undefined` clears it (same-origin fallback). */
    setRemoteRoot(url: string | undefined): void;
    /** Absolute url of a `remote`-group asset against `root` (default the active
     *  remote root). An already-absolute manifest path (a fully-qualified CDN url)
     *  passes through; with no root the path returns as-is (same-origin fallback). */
    private remoteUrlFor_;
    /** The load url for a manifest asset. A `remote`-group asset resolves to its
     *  `<root>/<path>` CDN url when a root is set; every other case (local / lazy
     *  group, or a remote group with no CDN root — same-origin realms like editor
     *  Play) resolves through the normal resolver + Catalog. The single remote/local
     *  routing rule shared by {@link loadGroup} and {@link fetchAndVerify_}, so a
     *  loadGroup'd asset and the same asset reached by a scene `@uuid` ref (via
     *  {@link resolveLoadPath_} → {@link remoteAssetPath_}) never resolve two ways. */
    private manifestAssetUrl_;
    /**
     * Fetch a candidate manifest and diff it against the active one WITHOUT
     * applying anything — the "is there an update, and how big?" query. The
     * returned plan (changed assets + byte total) is what a UI shows before
     * asking the player to download; the candidate is staged for {@link applyUpdate}.
     *
     * Diffing is by content hash (see {@link diffManifests}); because assets are
     * content-addressed, a changed asset is a brand-new url, so applying can never
     * overwrite or corrupt a cached file.
     */
    checkForUpdate(options: CheckForUpdateOptions): Promise<UpdatePlan>;
    /**
     * Apply the update staged by the last {@link checkForUpdate}, ATOMICALLY.
     * Phase 1 downloads AND integrity-verifies every changed (content-addressed)
     * asset — bytes are hashed and checked against the manifest's `contentHash`,
     * so a corrupted / tampered CDN response is caught. Only if ALL succeed does
     * phase 2 commit: swap the active manifest + root, rebind live handles (via
     * `onInvalidate`), and persist. If any asset fails to download or fails its
     * hash check, NOTHING is swapped — the old manifest stays active (rollback)
     * and the failures are returned. No-op with nothing staged.
     */
    applyUpdate(onProgress?: (loaded: number, total: number) => void): Promise<ApplyUpdateResult>;
    private applyStaged_;
    /** Which revision runs, which one the next launch starts on, and what is staged. */
    updateStatus(): UpdateStatus;
    private cacheVersion_;
    private protectCacheVersions_;
    /** Disk cache statistics, distinct from texture/audio residency budgets.
     * A scan reconciles interrupted writes/deletes; unknown files stay pinned. */
    diskCacheReport(rescan?: boolean): Promise<ContentCacheReport>;
    /** Preview by default; execution recomputes LRU against current protections. */
    cleanDiskCache(budgetBytes: number, execute?: boolean): Promise<CacheCleanupResult>;
    /** Keep an older downloaded build, independently of the rolling rollback. */
    retainDiskCacheVersion(revision: string, retain?: boolean): Promise<ContentCacheReport>;
    /** Download one changed asset's bytes from its delivery source (remote → CDN
     *  url against `root`, else the normal resolved path) and verify the content
     *  hash. Null on success, else the failure reason. Uses the PENDING manifest +
     *  root — phase 1 runs before the swap. */
    private fetchAndVerify_;
    /**
     * Remember a storage key under which {@link applyUpdate} persists the active
     * manifest, and immediately restore any manifest a prior run persisted there —
     * so a returning player boots straight onto the updated content, even offline.
     * Returns true if a persisted manifest was found and made active. Call at
     * boot, before the first scene loads.
     */
    restorePersistedUpdate(key: string): boolean;
    /** True once stored and read back; a store can drop a write without throwing.
     *  Null with no persistence key. */
    private persistActiveManifest_;
    private persistedRevision_;
    /**
     * Load one asset into the displayable bundle maps. Returns the in-flight
     * promise for the four bundle-able types (texture / material / spine /
     * font), or null for any other type. Shared by `loadByLabel` and
     * `loadGroup` so both dispatch through one channel.
     */
    private bundleLoadTask_;
    /**
     * Like {@link bundleLoadTask_} but also warms the cache for non-displayable
     * types that have a typed loader (prefab, audio), so a whole group / sub-
     * package preloads. Raw types (json / text / binary) and unknowns return
     * null — they have no typed loader and are fetched lazily on demand.
     */
    private groupLoadTask_;
    /**
     * Preload an explicit list of refs (`@uuid:` or paths) through the typed
     * loaders, warming every cache with bounded concurrency and progress.
     * This is the streaming prefetch primitive: point it at the next area's
     * assets while gameplay continues, and the eventual real loads hit warm
     * caches (or revive resident textures) instead of the network.
     *
     * Asset types come from the catalog / manifest when known, falling back
     * to file-extension matching against the registered loaders. Refs whose
     * type can't be determined — and refs that fail to load — are reported
     * in `failed`; preload itself never rejects.
     */
    preload(refs: ReadonlyArray<string>, onProgress?: (loaded: number, total: number) => void, options?: {
        readonly maxConcurrent?: number;
    }): Promise<{
        failed: MissingAsset[];
    }>;
    /** Asset type for a resolved path: catalog entry → manifest entry →
     *  extension match against the registered loaders → null. */
    private inferAssetType_;
    /** Thunk that loads `path` through its type's canonical channel, or null
     *  when no loader handles the type. Textures/spine have dedicated entry
     *  points (refcount / two-file pairing); everything else is loadTyped. */
    private typedLoadFor_;
    fetchJson<T = unknown>(ref: string): Promise<T>;
    fetchBinary(ref: string): Promise<ArrayBuffer>;
    fetchText(ref: string): Promise<string>;
    preloadSceneAssets(sceneData: SceneData, onProgress?: (loaded: number, total: number) => void, options?: {
        readonly maxConcurrent?: number;
        readonly skipSpine?: boolean;
    }): Promise<SceneAssetResult>;
    private preloadSceneAssets_;
    resolveSceneAssetPaths(sceneData: SceneData, result: SceneAssetResult): void;
    /** Record scene users only after source IDs have been mapped to live World entities.
     * Resolution is preparation; source IDs cannot be removed by World.onDespawn. */
    trackSceneAssetReferences(scene: SceneData, entities: ReadonlyMap<number, number>): void;
    /**
     * Load a texture and get the receipt for THIS acquisition.
     *
     * The difference from {@link loadTexture} is who can be released correctly
     * afterwards: a path names an asset, a lease names the instance this caller
     * was handed. After `invalidate()` those are no longer the same thing.
     */
    acquireTexture(ref: string): Promise<AssetLease<TextureResult>>;
    /** {@link acquireTexture} for everything that goes through a typed loader. */
    acquireTyped<T>(type: string, ref: string): Promise<AssetLease<T>>;
    private acquireTypedLease_;
    /**
     * A claim on the slot for a registry-backed asset, or null when this type is
     * not one. The ref the caller spelled is an ALIAS of the slot: a component
     * carries that spelling and looks the asset up by it, while the load path is
     * whatever this realm resolved it to.
     */
    private acquireSlot_;
    /**
     * The owner-facing receipt for one ledger acquisition.
     *
     * `retain` goes through the ledger rather than through this class's load
     * path: an owner splitting what it holds joins the era it already has, which
     * after an invalidate is not the era a path resolves to.
     */
    private textureLease_;
    /**
     * A receipt for a texture this engine COMPOSED — no path, no generation, no
     * cache entry to join. Its only identity is the handle, so the last holder
     * destroys it rather than handing it back to a pool that could revive it.
     */
    private ownedTextureLease_;
    /** {@link textureLease_} for everything that goes through a typed loader. */
    private typedLease_;
    releaseTexture(ref: string): void;
    /**
     * @internal Give back one texture acquisition by its receipt — exact even
     * when `invalidate()` left two generations of the same path live. Callers
     * hold an {@link AssetLease} and use its `release()`.
     */
    releaseTextureLease(lease: AssetRefLease<number>): void;
    /** The last SDK reference to a texture handle is gone: let the C++ pool decide. */
    private disposeTexture_;
    releaseFont(ref: string): void;
    releaseAudio(ref: string): void;
    releaseAnimClip(ref: string): void;
    releaseTimeline(ref: string): void;
    releaseTilemap(ref: string): void;
    releasePrefab(ref: string): void;
    /**
     * Release a material obtained via {@link loadMaterial}, addressed by its
     * handle (materials are tracked by handle, not ref, in the scene manager).
     * Routes through the shared refcount + cache path so a material shared by
     * two scenes survives until its last owner releases it, and the cache never
     * hands the next load a destroyed handle. Destroying the handle directly
     * (bypassing this) would strand a dead handle in the material cache.
     */
    releaseMaterial(handle: number): void;
    /**
     * Give back one reference to every asset in `byType` — what a scene, a
     * document or a group acquired, in one call.
     *
     * Materials (handle-keyed) and skeletons (SpineManager's) are skipped.
     * @beta Pre-1.0: the type vocabulary follows the loader registry.
     */
    releaseAssets(byType: ReadonlyMap<string, ReadonlySet<string>>): void;
    /**
     * @internal Release one reference to a typed asset by path — the door the
     * group channel table uses. Game code calls the named release* methods.
     */
    releaseTyped(type: string, ref: string): void;
    /**
     * @internal The typed twin of {@link releaseTextureLease}; callers use the
     * lease's own `release()`.
     */
    releaseTypedLease(type: string, lease: AssetRefLease<PreparedLoad<unknown>>): void;
    /** The last reference to a typed asset is gone: hand it to its loader. */
    private disposeGeneric_;
    /** End one handle-bound era: its loader destroys what it made, then what its
     *  preparation acquired goes back — in that order, since the value is what
     *  is still using it. */
    private retire_;
    /**
     * Drop every internal cache entry for `ref` so the next `loadTexture` /
     * `loadMaterial` / ... fetches fresh bytes. Call this when the source
     * file changed on disk (hot reload).
     *
     * Any GPU handle that was already handed out stays valid and keeps
     * rendering — that's the caller's concern to release. The next load
     * produces a brand-new handle from the updated bytes; the old handle
     * is evicted from the cache but not freed, so currently-rendering
     * entities don't flicker.
     *
     * If any cache held `ref`, invokes every listener registered via
     * `onInvalidate` with the original ref. Listeners that throw are
     * caught and logged — one bad subscriber can't prevent other
     * subscribers from observing the invalidation.
     *
     * What was BUILT from `ref` ends too. The plan is read BEFORE anything is
     * dropped, and walked deepest-first with each group awaiting the one before
     * it: a parent re-prepared too early acquires the era it already had.
     *
     * Returns true if any cache held `ref` itself.
     */
    invalidate(ref: string): boolean;
    /**
     * Resolves when every propagation started so far has landed.
     *
     * The ASSET graph only. What reads it — a component bound to a handle — is
     * the second barrier, and it moves on a frame rather than here: see the
     * live-binding coordinator's `settled`.
     *
     * @internal
     */
    assetGraphSettled(): Promise<void>;
    /** What a change to `ref` reaches. Not filtered by path: an asset that
     *  happens to live at the changed file can still be what the chain reaches
     *  LAST, and dropping it there is the same erasure one level up. */
    private rebuildPlan_;
    /** Count one propagation as in flight until it lands. It answers to nobody
     *  in the ordinary case, so a failure is reported here rather than thrown at
     *  whoever happens to be waiting. */
    private track_;
    /** Each group only once everything it was built from has landed. */
    private rebuildAssetGraph_;
    /**
     * End every era at one PATH: a file changed, and whatever it names changed
     * with it. What `invalidate(ref)` is, and what a hot update's changed key is.
     */
    private invalidateSource_;
    /**
     * End ONE asset's era — its type all the way down. A path can name a texture
     * and a material, and what one of them acquired changing is not a change to
     * the other; a plan that knows the difference and then ends both has thrown
     * away what it knew.
     */
    private invalidateAsset_;
    /**
     * Prepare a new era for the slot (type, ref) names, and publish it
     * atomically. By IDENTITY: the slot is keyed by what the asset is, and this
     * preparation resolves where the current revision serves it.
     */
    private republishSlot_;
    /** {@link republishSlot_} for every type this ref names one of — a changed
     *  FILE, which does not say what kind of asset lives at it. */
    private republishSlots_;
    /** Fire every onInvalidate listener with one generation's ending. Isolates
     *  throws. Shared by {@link invalidate} and {@link applyUpdate}. */
    private fireInvalidate_;
    /**
     * Subscribe to cache invalidations. The listener fires once per
     * successful `invalidate(ref)` call with the original ref (not the
     * resolved path). Returns an unsubscribe function.
     *
     * Typical use: a scene-graph controller or renderer that holds cached
     * handles for assets — subscribe to re-bind / re-load on hot reload
     * so stale GPU handles stop being rendered.
     */
    onInvalidate(listener: InvalidateListener): () => void;
    /**
     * @internal Live entry counts for the resource census.
     *
     * Cache sizes are not expected to return to baseline — that is what a cache
     * is for. `refCounts` and `handlePaths` are: every load handing one out has a
     * release taking it back. `pendingLoads` and `propagations` should be zero at rest.
     */
    sizes(): {
        textureCached: number;
        pendingLoads: number;
        /** Rebuilds of dependents still running after an invalidation. */
        propagations: number;
        refCounts: number;
        refRows: number;
        genericCaches: number;
        genericCached: number;
        handlePaths: number;
        invalidateListeners: number;
        registrySlots: number;
        trackedRefRows: number;
    };
    /**
     * What is explicitly owned by the whole asset realm.
     *
     * Its life is this instance's. Entity bindings use scene or entity scopes,
     * including runtime entities with no scene, so their resources can end sooner.
     *
     * @internal
     */
    get appScope(): AssetScope;
    /**
     * What entities own for themselves — runtime entities with no scene and
     * persistent entities that outlived theirs. Ends at the entity's despawn.
     *
     * @internal
     */
    get entityScopes(): EntityAssetScopes;
    /** @internal A standalone bake uses the same acquisition transaction as a graph recipe. */
    preparePrefab(ref: string, overrides?: readonly PrefabOverride[]): Promise<PreparedPrefab>;
    releaseAll(): void;
    getTextureLoader(): TextureLoader;
    /**
     * What the textures this realm loaded became on the GPU, and which compressed
     * formats the device samples at all. @experimental
     *
     * The upload half; what the BUILD shipped is the cook's own record. A realm
     * that plays source images still answers `deviceFormats` — the capability a
     * cooked payload would meet here.
     */
    textureFormatReport(): TextureFormatReport;
    setAssetRefResolver(resolver: AssetRefResolver): void;
    private readonly assetProblems_;
    private assetProblemListener_;
    /**
     * What is wrong with an asset that loaded: the parts of it that were left out, each said once. Empty when it is whole (or was never
     * loaded). A material whose texture would not load, or whose value has a shape nothing reads, is here and not in a failed load.
     * @experimental
     */
    getAssetProblems(asset: string): readonly string[];
    /** Hear every change to an asset's problems (the editor's diagnostics). One listener; null removes it. @experimental */
    setAssetProblemListener(listener: ((asset: string, problems: readonly string[]) => void) | null): void;
    getAssetRefResolver(): AssetRefResolver | null;
    /**
     * Attach optional usage monitoring. Scene publication records runtime
     * entity IDs through trackSceneAssetReferences; the shared World binding
     * removes them on despawn and follows the active asset resource. Plugin
     * and runtime factories install it; manually created Assets default to
     * no tracking until a counter is attached.
     */
    setRefCounter(counter: AssetRefCounter): void;
    getRefCounter(): AssetRefCounter | null;
    /**
     * Resolve any serialized asset ref (UUID or plain path) to a concrete
     * path. Returns null when a UUID ref can't be matched to a known
     * asset. Without a registry/resolver configured, refs pass through
     * unchanged — legacy path-only scenes keep working.
     */
    resolveRef(ref: string): string | null;
    /**
     * The load path a ref resolves to — resolver plus addressable Catalog,
     * the same two steps every typed load performs. This is the key a loader
     * registers a data asset under, so runtime stores keyed by registration
     * path (FSM/BT/timeline/tilemap via `resolveAssetKey`) must look up with
     * THIS: `resolveRef` alone diverges once the Catalog carries mappings.
     */
    resolveLoadPath(ref: string): string;
    /**
     * Canonical path-resolution for all typed load methods.
     * Runs the AssetRefResolver first so `@uuid:...` refs map to their real
     * project path, then applies the addressable Catalog for any further
     * indirection. If the resolver returns null (unknown UUID), we fall back
     * to the Catalog on the original ref — the loader will 404 with a clear
     * error rather than silently succeeding on a nonsense URL.
     *
     * Historically each load method called `this.catalog.resolve(ref)`
     * directly, which completely bypassed the AssetRefResolver. Editors that
     * serialized asset refs as `@uuid:...` could never resolve them at load
     * time — textures silently rendered white. This helper closes that gap.
     */
    private resolveLoadPath_;
    /** CDN url of `ref` when it names a `remote`-group asset AND a remote root is
     *  set; null otherwise (caller falls back to the normal resolver). */
    private remoteAssetPath_;
    /**
     * What a ref MEANS in this realm, with no revision in it.
     *
     * Distinct from {@link resolveLoadPath_}, which goes on to where that asset
     * is served from NOW. Identity is what a slot is keyed by and what two
     * spellings agree on; a locator is what one preparation reads.
     */
    private assetIdentity_;
    private registerBuiltinLoaders;
    private textureCacheKey_;
    private loadTyped;
    private acquireTyped_;
    /**
     * One era of one handle-bound asset, under the KEY that identifies it — the
     * path for everything whose identity is a path, and the PAIR for spine,
     * whose skeleton with another atlas is another asset. One ownership
     * algorithm, differing only in what it calls one asset.
     */
    private acquirePrepared_;
    /** The cache of current eras for one handle-bound type. A load that lands
     *  after its own deadline was never handed to anyone, so this is the last
     *  place that knows it and what it acquired. */
    private genericCacheFor_;
    /**
     * What THIS realm publishes for a ref-bound asset — the answer a runtime
     * lookup reads, and the only copy of it.
     *
     * By the ref as spelled or the path it resolves to: a slot answers to both,
     * so a lookup site need not know which spelling a scene serialized.
     *
     * @internal
     */
    resolveRegistryAsset<T>(type: string, ref: string): T | undefined;
    /** @internal Changes when a registry type publishes, replaces or withdraws an era. */
    registryAssetVersion(type: string): number;
    /**
     * What the current era of a ref-bound asset took — the dependency graph as a
     * PROJECTION of acquisitions, never a table anyone maintains.
     *
     * @internal
     */
    dependenciesOf(type: string, ref: string): readonly DependencyReceipt[];
    /**
     * The asset types a component holds BY HANDLE — the loaders with a `load`
     * door. What a live rebind can migrate: a ref-bound asset's slot swaps
     * under the name a field already holds, so there is nothing to move.
     *
     * @internal
     */
    handleBoundTypes(): string[];
    /**
     * Every asset of this realm whose CURRENT era took `ref` — the reverse of
     * {@link dependenciesOf}, walked from the eras so there is no table to keep.
     * By canonical identity: a receipt says what the acquisition ASKED for (a
     * `@uuid:` ref, a document-relative path) and a change names a file.
     *
     * @internal
     */
    dependentsOfSource(ref: string): AssetIdentity[];
    /**
     * Every asset of this realm that ACQUIRED this one — the edge to follow once
     * the walk is past the file that changed. A source read is NOT one: those
     * bytes are exactly as their reader read them, and what ended here is this
     * asset's own generation.
     *
     * @internal
     */
    dependentsOfAsset(asset: AssetIdentity): AssetIdentity[];
    /** Every era with an edge that `names` — the walk both doors share. */
    private dependents_;
    /** Every live era of this realm, published under a name or held by handle. */
    private eras_;
    /**
     * Everything this realm publishes of one type. What a schedule analysis
     * reads to learn what the graphs THIS app loaded reach for.
     *
     * @internal
     */
    publishedRegistryAssets<T>(type: string): T[];
    /**
     * The slot table's view of one registry-backed loader — the LoadContext
     * bound in, so the table stays about ownership and knows nothing about how
     * any particular kind of asset is parsed.
     */
    private registryKind_;
    /** A generation-bound recipe through the ordinary typed-asset door. */
    private preparePrefabLease_;
    private bakePrefab_;
    /**
     * Run one preparation: what the loader takes IS the result's ownership and
     * IS the graph's edges. A transaction, because an acquisition on the way to
     * a value that never arrives has no owner — the thing that would have held
     * it does not exist.
     */
    private prepared_;
    /** The load context one preparation sees: every door that takes something
     *  reports it, and the plain readers stay plain. */
    private recordingContext_;
    private getLoadContext_;
}

interface SceneEntityData {
    id: number;
    name: string;
    parent: number | null;
    children: number[];
    components: SceneComponentData[];
    visible?: boolean;
}
interface SceneComponentData {
    type: string;
    data: Record<string, unknown>;
}
interface SliceBorder {
    left: number;
    right: number;
    top: number;
    bottom: number;
}
interface TextureMetadata {
    version: string;
    type: 'texture';
    sliceBorder: SliceBorder;
}
interface SceneData {
    /**
     * Format version: one integer that only counts up. Files written before it
     * became an integer carry a `"major.minor"` string, which
     * {@link migrateSceneData} normalizes — read it through
     * {@link parseSceneFormatVersion}, never by comparing it directly.
     */
    version: number | string;
    name: string;
    /** Origin tag of the engine that wrote this scene (see provenance.ts). */
    generator?: string;
    entities: SceneEntityData[];
    textureMetadata?: Record<string, TextureMetadata>;
    /**
     * Set by {@link expandScenePrefabs} on the scene it answers, never written to a file: the virtual instances it left as roots
     * alone, and what each is made from. The loader hands them to the world once the entities exist.
     */
    deferredInstances?: DeferredRecord[];
}
interface LoadedSceneAssets {
    texturePaths: Set<string>;
    materialHandles: Set<number>;
    fontPaths: Set<string>;
    spineKeys: Set<string>;
    /**
     * The receipts the preload produced, handed to whoever owns the scene.
     * Present means the owner releases through these and must not also release
     * the same assets by path — that is the double free this replaces.
     */
    scope?: AssetScope;
}
/** Progress during a scene load, in assets: how many are done of how many.
 *  @beta */
type SceneLoadProgressCallback = (loaded: number, total: number) => void;
type MissingAssetCallback = (missing: MissingAsset[]) => void;
interface SceneLoadOptions {
    assets?: Assets;
    assetBaseUrl?: string;
    collectAssets?: LoadedSceneAssets;
    onProgress?: SceneLoadProgressCallback;
    /**
     * Invoked once during load with the list of asset refs that could not
     * be loaded (unresolved UUID or fetch failure). Fires even if the list
     * is empty — callers that want "missing asset" UI wire this up.
     */
    onMissingAssets?: MissingAssetCallback;
    /**
     * If true, throw after preloading when any asset is missing; the
     * scene is not spawned. Default is false (legacy behaviour: missing
     * assets get handle 0, scene loads anyway).
     */
    abortOnMissingAssets?: boolean;
    /**
     * Authored ids this document may reference that live in another one — the
     * persistent rows a streamed cell is allowed to name. Absent = a reference
     * outside the document resolves to nothing, which is what it always did.
     */
    externalEntities?: ReadonlyMap<number, Entity>;
    /**
     * Where a load's time went, phase by phase. Most of it runs between frames —
     * off every system timer there is — so a profiler watching the frame loop
     * sees the cost and cannot say what it was.
     *
     * A name may be dotted, and a dot means containment: `spawn.components` is
     * part of `spawn`, so a reader sums the roots and never the whole list.
     */
    onPhase?: ScenePhaseSink;
}
/**
 * Where a load's time went. Dotted names nest; see {@link SceneLoadOptions.onPhase}.
 *
 * @experimental
 */
type ScenePhaseSink = (phase: string, ms: number) => void;
declare class MissingAssetsError extends Error {
    readonly missing: MissingAsset[];
    constructor(missing: MissingAsset[]);
}
/**
 * The asset kinds a component field may hold — a closed set, because each one
 * names a registered loader. Adding one means adding the loader too.
 *
 * @public
 */
type AssetFieldType = 'texture' | 'material' | 'font' | 'anim-clip' | 'audio' | 'sound-event' | 'video' | 'tilemap' | 'tileset' | 'timeline' | 'statemachine' | 'behaviortree' | 'scriptgraph' | 'animatorcontroller' | 'avatar' | 'mesh' | 'environment' | 'probeVolume' | 'prefab';
declare function getComponentAssetFields(componentType: string): string[];
declare function getComponentAssetFieldDescriptors(componentType: string): readonly {
    field: string;
    type: AssetFieldType;
}[];
/** The skeleton/atlas pair a component carries, and whose runtime it belongs to. */
declare function getComponentSkeletalFieldDescriptor(componentType: string): {
    skeletonField: string;
    atlasField: string;
    runtime: string;
} | null;
/**
 * Resolve a document's entity references to live entities.
 *
 * `external` answers for authored ids that live in ANOTHER document — the rows a
 * streamed cell is allowed to name in the persistent world. An id neither map
 * knows is cleared, never left as a number that names a different entity.
 */
declare function remapEntityFields(compData: SceneComponentData, entityMap: Map<number, Entity>, external?: ReadonlyMap<number, Entity>): void;
/**
 * Hook for a component whose full state does not fit the plain field record —
 * e.g. TilemapLayer's tile chunks live in a C++ blob. Registered by the owning
 * plugin (see tilemapPlugin) so the generic (de)serializer carries no
 * component-specific knowledge.
 */
interface SceneComponentCodec {
    /** Serialize: write out-of-band state into the plain record. */
    exportData?(entity: number, data: Record<string, unknown>): void;
    /**
     * Out-of-band field keys. Stripped from `data` before validation/insert
     * (so the component insert doesn't choke on them) and passed to
     * {@link importData} after insert.
     */
    outOfBandFields?: readonly string[];
    /** Deserialize: reapply out-of-band state after the component is inserted. */
    importData?(entity: number, outOfBand: Record<string, unknown>): void;
}
/** Register a custom (de)serializer for a component type. Idempotent. */
declare function registerSceneComponentCodec(type: string, codec: SceneComponentCodec): void;
/**
 * What a component carries beside its fields — a MeshRenderer's inline `geometry`:
 * saved with the scene by its codec, but no field, so no inspector or set_field
 * reaches it. Empty for a component without such data.
 */
declare function sceneOutOfBandFields(type: string): readonly string[];
/**
 * Current scene format version — bump by one per migration step below.
 *
 * An integer, not semver: this number only has to answer "older, current, or
 * newer", and dotted ones cannot. `parseFloat` sorts "1.10" below "1.2".
 *
 * 2: `Light2D` and `Mesh2D` renamed to `Light` and `MeshRenderer`. An engine
 *    from before the rename reads the new names as components it has never
 *    heard of and drops them, which is a scene that loads and has no lights —
 *    so it must refuse the file instead, and the version is what tells it to.
 * 3: the flat physics components took the `2D` suffix the 3D ones already had
 *    (`RigidBody` → `RigidBody2D`, the four colliders, `CharacterController`).
 *    Same reasoning as 2, and worse here: an older engine drops the bodies and
 *    loads a level whose floor nothing collides with.
 * 4: the flat joints took the 3D set's words, which are also the industry's
 *    (`RevoluteJoint2D` → `HingeJoint2D`, prismatic → slider, weld → fixed).
 *    Same reasoning again: dropped joints load a machine whose parts fall apart.
 */
declare const SCENE_FORMAT_VERSION = 4;
interface SceneMigrationResult {
    /** A migrated *copy* — the input is never mutated. */
    data: SceneData;
    /** True if any legacy shape was upgraded (callers may prompt a re-save). */
    migrated: boolean;
    /** Retired engine components dropped, by name — an editor says which it
     *  upgraded away; a runtime load has no one to tell. */
    retired: string[];
    fromVersion: number;
    toVersion: number;
}
/**
 * Upgrade a SceneData to the current format. Total + idempotent: already-current
 * data returns `migrated: false`; migrations are shape-driven so they no-op on
 * current scenes. Rejects data newer than this engine. Returns a deep copy, so
 * loading never mutates the caller's object (snapshots can be reloaded).
 */
declare function migrateSceneData(raw: SceneData): SceneMigrationResult;
declare function loadSceneData(world: World, sceneData: SceneData, external?: ReadonlyMap<number, Entity>, onPhase?: ScenePhaseSink): Map<number, Entity>;
/**
 * Reset the world to a previously-captured scene: despawn every current entity,
 * then reload `sceneData`. Used for editor play-state isolation (snapshot before
 * Play via {@link serializeScene}, restore on Stop), level restart, etc. Because
 * {@link loadSceneData} no longer mutates its input, the same snapshot can be
 * restored repeatedly. Entity ids change; the returned map is
 * snapshot-id → new entity for callers that need to remap references/selection.
 */
declare function resetWorldTo(world: World, sceneData: SceneData): Map<number, Entity>;
declare function loadSceneWithAssets(world: World, sceneData: SceneData, options?: SceneLoadOptions): Promise<Map<number, Entity>>;
declare function loadComponent(world: World, entity: Entity, compData: SceneComponentData, entityName?: string): void;
/**
 * Walks the live world and produces a SceneData that round-trips through
 * loadSceneData. Editors call this on save; external tools (prefab extract,
 * diff, CLI export) can reuse the same primitive.
 *
 * Parent/child links are collapsed into the entity record's parent+children
 * fields; the Parent and Children components themselves are omitted from
 * the components array so loadSceneData's setParent pass is the single
 * source of truth for hierarchy.
 */
declare function serializeScene(world: World, sceneName?: string): SceneData;
declare function updateCameraAspectRatio(world: World, aspectRatio: number): void;
declare function findEntityByName(world: World, name: string): Entity | null;

/**
 * @file    component.generated.ts
 * @brief   Auto-generated component metadata
 * @details Generated by EHT - DO NOT EDIT
 */

/**
 * Single-source-of-truth hash of the C++/TS boundary ABI (component
 * schema + pointer layouts). The WASM module exposes the same digest via
 * getAbiLayoutHash(); BuiltinBridge.connect() compares them and refuses to
 * run on mismatch, because mismatched offsets read the wrong heap bytes.
 */
declare const ABI_LAYOUT_HASH = "cb0184ba3431d6f9";
/**
 * One asset-valued field of a component: which field, and what kind of
 * asset it holds. Declaring it is what gives the field dependency
 * tracking, cook inclusion, `@uuid:` refs and hot-update.
 *
 * @public
 */
interface AssetFieldMeta {
    field: string;
    type: AssetFieldType;
}
/**
 * A skeleton/atlas field PAIR, which has to be declared together: the two
 * files are one asset, and loading either alone yields nothing to draw.
 *
 * @public
 */
interface SkeletalFieldMeta {
    skeletonField: string;
    atlasField: string;
    /** Which runtime the pair belongs to — `spine`, `dragonbones`. */
    runtime: string;
}
/**
 * The fields of the engine's `Billboard` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @beta
 */
interface BillboardData {
    mode: BillboardMode;
    enabled: boolean;
}
interface BitmapTextData {
    text: string;
    color: Color;
    fontSize: number;
    align: TextAlign;
    spacing: number;
    parallax: Vec2;
    layer: number;
    font: number;
    enabled: boolean;
}
interface BoxCollider3DData {
    halfExtents: Vec3;
    center?: Vec3;
    friction: number;
    restitution: number;
    isSensor: boolean;
    enabled: boolean;
}
interface CameraData$1 {
    projectionType: ProjectionType;
    fov: number;
    orthoSize: number;
    nearPlane: number;
    farPlane: number;
    aspectRatio: number;
    isActive: boolean;
    priority: number;
    viewport: Vec4;
    clearFlags: ClearFlags;
    pixelPerfect: boolean;
    cullingMask: number;
    renderTarget: number;
}
interface CanvasData {
    designResolution: Vec2;
    pixelsPerUnit: number;
    scaleMode: CanvasScaleMode;
    matchWidthOrHeight: number;
    backgroundColor: Color;
    layer: number;
}
interface CapsuleCollider3DData {
    radius: number;
    halfHeight: number;
    center?: Vec3;
    friction: number;
    restitution: number;
    isSensor: boolean;
    enabled: boolean;
}
interface CharacterController3DData {
    velocity: Vec3;
    radius: number;
    halfHeight: number;
    maxSlope: number;
    stepHeight: number;
    snapDown: number;
    mass: number;
    pushForce: number;
    enabled: boolean;
    layer: number;
    isOnFloor: boolean;
    floorNormal: Vec3;
    realVelocity: Vec3;
}
/**
 * The fields of the engine's `Children` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @public
 */
interface ChildrenData {
    entities: Entity[];
}
interface ConvexCollider3DData {
    mesh: number;
    friction: number;
    restitution: number;
    isSensor: boolean;
    enabled: boolean;
}
interface DraggableData {
    enabled: boolean;
    dragThreshold: number;
    lockX: boolean;
    lockY: boolean;
    constrainMin: boolean;
    constraintMin: Vec2;
    constrainMax: boolean;
    constraintMax: Vec2;
}
interface DragonBonesAnimationData {
    skeletonPath: string;
    atlasPath: string;
    armature: string;
    animation: string;
    timeScale: number;
    loop: boolean;
    playing: boolean;
    fadeInTime: number;
    flipX: boolean;
    flipY: boolean;
    color: Color;
    layer: number;
    skeletonScale: number;
    material: number;
    enabled: boolean;
}
/**
 * The fields of the engine's `GroupOpacity` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @beta
 */
interface GroupOpacityData {
    opacity: number;
    enabled: boolean;
}
/**
 * The fields of the engine's `Impostor` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @beta
 */
interface ImpostorData {
    screenSize: number;
    frames: number;
    resolution: number;
    enabled: boolean;
}
interface LightData {
    type: LightType;
    color: Color;
    intensity: number;
    radius: number;
    innerRadius: number;
    falloff: number;
    inverseSquare: boolean;
    shadowStrength: number;
    layerMin?: number;
    layerMax?: number;
    cookie: number;
    cookieSize: Vec2;
    innerAngle: number;
    outerAngle: number;
    shadowSoftness: number;
    sourceAngle: number;
    shadowDistance: number;
    meshShadows: boolean;
    shadowExtent: number;
    followEnvironmentSun: boolean;
    aimFollowedSun: boolean;
    environment: number;
    environmentRotation: number;
    drawEnvironment: boolean;
    reflectionScale: number;
    reflectionSaturation: number;
    bakedTint: Color;
    hemisphere: boolean;
    groundColor: Color;
    enabled: boolean;
}
interface LightProbeVolumeData {
    probes: number;
    capture: boolean;
    captureInterval: number;
    halfExtents: Vec3;
    spacing: number;
    enabled: boolean;
}
interface MeshCollider3DData {
    mesh: number;
    friction: number;
    restitution: number;
    layer: number;
    enabled: boolean;
}
interface MeshRendererData$1 {
    texture: number;
    normalMap: number;
    color: Color;
    layer: number;
    opaque: boolean;
    cullBackfaces: boolean;
    lit: boolean;
    castShadows: boolean;
    parallax: Vec2;
    material: number;
    enabled: boolean;
    mesh: number;
}
/**
 * The fields of the engine's `Occluder` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @beta
 */
interface OccluderData {
    halfExtents: Vec3;
    enabled: boolean;
}
/**
 * The fields of the engine's `Parent` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @public
 */
interface ParentData {
    entity: Entity;
}
/**
 * The fields of the engine's `ParticleCollider` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @beta
 */
interface ParticleColliderData {
    shape: ParticleColliderShape;
    radius: number;
    halfHeight: number;
    halfExtents: Vec3;
    inverted: boolean;
    mask: number;
    enabled: boolean;
}
/**
 * The fields of the engine's `ParticleEmitter` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @beta
 */
interface ParticleEmitterData$1 {
    rate: number;
    burstCount: number;
    burstInterval: number;
    duration: number;
    simulationSpeed: number;
    startDelay: number;
    looping: boolean;
    playOnStart: boolean;
    maxParticles: number;
    gpuSimulation: boolean;
    lifetimeMin: number;
    lifetimeMax: number;
    shape: EmitterShape;
    shapeRadius: number;
    shapeSize: Vec3;
    shapeAngle: number;
    speedMin: number;
    speedMax: number;
    angleSpreadMin: number;
    angleSpreadMax: number;
    startSizeMin: number;
    startSizeMax: number;
    endSizeMin: number;
    endSizeMax: number;
    sizeEasing: ParticleEasing;
    startColor: Color;
    endColor: Color;
    colorEasing: ParticleEasing;
    rotationMin: number;
    rotationMax: number;
    angularVelocityMin: number;
    angularVelocityMax: number;
    gravity: Vec3;
    damping: number;
    addedVelocityMin: Vec3;
    addedVelocityMax: Vec3;
    speedLimit: number;
    limitDampen: number;
    noiseStrength: number;
    noiseFrequency: number;
    noiseScrollSpeed: number;
    noiseOctaves: number;
    texture: number;
    spriteColumns: number;
    spriteRows: number;
    spriteFPS: number;
    spriteLoop: boolean;
    blendMode: number;
    layer: number;
    material: number;
    simulationSpace: SimulationSpace;
    renderMode: ParticleRenderMode;
    velocityScale: number;
    lengthScale: number;
    enabled: boolean;
    subEmitterTrigger: SubEmitterTrigger;
    subEmitterChance: number;
    subEmitterInheritVelocity: number;
    subEmitter: Entity;
    trailEnabled: boolean;
    trailWidth: number;
    trailPoints: number;
    trailMinDistance: number;
    collisionEnabled: boolean;
    collisionFloor: number;
    collisionMode: ParticleCollisionMode;
    collisionMask: number;
    collisionQueryBudget: number;
    collisionMaxDistance: number;
    collisionFallback: ParticleCollisionFallback;
    collisionEvents: boolean;
    collisionEventBudget: number;
    collisionThickness: number;
    collisionBounce: number;
    collisionFriction: number;
    collisionLifetimeLoss: number;
}
interface ParticleForceFieldData {
    type: ForceFieldType;
    strength: number;
    radius: number;
    direction: Vec3;
    falloff: boolean;
    enabled: boolean;
}
/**
 * The fields of the engine's `PlanarReflection` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @experimental
 */
interface PlanarReflectionData {
    axis: ReflectionAxis;
    clipOffset: number;
    cullingMask: number;
    quality: ReflectionQuality;
    resolutionScale: number;
    maxSize: number;
    update: ReflectionUpdate;
    updatesPerSecond: number;
    revision: number;
    enabled: boolean;
}
/**
 * The fields of the engine's `ReflectionProbe` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @beta
 */
interface ReflectionProbeData {
    reflection: number;
    halfExtents: Vec3;
    slot: number;
    enabled: boolean;
}
interface RigidBody3DData {
    bodyType: BodyType;
    gravityScale: number;
    linearDamping: number;
    angularDamping: number;
    fixedRotation: boolean;
    layer: number;
    continuousCollision: boolean;
    enabled: boolean;
}
interface ShadowCaster2DData {
    size: Vec2;
    path: Vec2[];
    enabled: boolean;
}
interface ShapeRendererData {
    shapeType: ShapeType;
    color: Color;
    size: Vec2;
    cornerRadius: number;
    layer: number;
    parallax: Vec2;
    enabled: boolean;
}
/**
 * The fields of the engine's `SortingGroup` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @beta
 */
interface SortingGroupData {
    layer: number;
    order: number;
    enabled: boolean;
}
interface SphereCollider3DData {
    radius: number;
    center?: Vec3;
    friction: number;
    restitution: number;
    isSensor: boolean;
    enabled: boolean;
}
/**
 * The fields of the engine's `SpineAnimation` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @beta
 */
interface SpineAnimationData {
    skeletonPath: string;
    atlasPath: string;
    skin: string;
    animation: string;
    timeScale: number;
    loop: boolean;
    playing: boolean;
    flipX: boolean;
    flipY: boolean;
    color: Color;
    layer: number;
    skeletonScale: number;
    material: number;
    enabled: boolean;
}
interface SpringBoneData {
    enabled: boolean;
    stiffness: number;
    drag: number;
    gravity: Vec3;
    wind: Vec3;
    windGust: number;
    windFrequency: number;
    endLength: number;
    radius: number;
    weight: number;
    colliders: Entity[];
}
interface SpringBoneColliderData {
    shape: SpringBoneShape;
    radius: number;
    height: number;
    offset: Vec3;
}
/**
 * The fields of the engine's `Sprite` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @public
 */
interface SpriteData {
    texture: number;
    color: Color;
    size: Vec2;
    pivot: Vec2;
    uvOffset: Vec2;
    uvScale: Vec2;
    layer: number;
    order?: number;
    maskInteraction?: SpriteMaskInteraction;
    lit: boolean;
    flipX: boolean;
    flipY: boolean;
    drawMode?: SpriteDrawMode;
    tileSize: Vec2;
    tileSpacing: Vec2;
    parallax: Vec2;
    material: number;
    enabled: boolean;
}
/**
 * The fields of the engine's `SpriteMask` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @beta
 */
interface SpriteMaskData {
    alphaCutoff: number;
    limitRange: boolean;
    rangeEndLayer: number;
    rangeEndOrder: number;
    enabled: boolean;
}
/**
 * The fields of the engine's `TilemapLayer` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @beta
 */
interface TilemapLayerData {
    cellSize: Vec2;
    orientation: TilemapOrientation;
    hexSideLength: number;
    staggerAxis: TilemapStaggerAxis;
    staggerIndex: TilemapStaggerIndex;
    originOffset: Vec2;
    tileset: number;
    tilesetColumns: number;
    renderLayer: number;
    tintColor: Color;
    opacity: number;
    parallaxFactor: Vec2;
    visible: boolean;
    lit?: boolean;
}
interface TrailRendererData {
    time: number;
    minVertexDistance: number;
    emitting: boolean;
    startWidth: number;
    endWidth: number;
    startColor: Color;
    endColor: Color;
    texture: number;
    blendMode: number;
    layer: number;
    material: number;
    enabled: boolean;
}
/**
 * The fields of the engine's `Transform` component, generated from
 * the C++ struct so the two shapes cannot drift.
 *
 * @public
 */
interface TransformData {
    position: Vec3;
    rotation: Quat;
    scale: Vec3;
    worldPosition: Vec3;
    worldRotation: Quat;
    worldScale: Vec3;
}
interface VelocityData {
    linear: Vec3;
    angular: Vec3;
}

/**
 * @file    component.ts
 * @brief   Component definition and builtin components
 */

/**
 * An asset a component's data points at, as scene preload discovery reports one.
 * `type` is the loader's kind and `path` the project-relative reference.
 *
 * @public
 */
interface AssetRef {
    type: string;
    path: string;
}
/**
 * Per-field editor presentation metadata — the engine's UPROPERTY analog. A
 * component declares it once at its definition site; the editor's inspector reads
 * it via {@link getComponentFieldMeta} and renders the matching control, falling
 * back to value-shape inference for any field without metadata. None of this is
 * read by the runtime (which stores raw values); it is purely authoring policy
 * co-located with the component so the inspector and the data never diverge.
 *
 * @public
 */
interface FieldMeta {
    /** Render as a dropdown of these options; the stored value is the option's int. */
    enum?: ReadonlyArray<{
        label: string;
        value: number;
    }>;
    /**
     * Render as a dropdown whose options are resolved by the editor from a named
     * source (e.g. project sorting layers) — falls back to a plain number when the
     * source yields none, so free-int editing survives a project with no named set.
     */
    enumSource?: string;
    /**
     * Names a registered source of LABELS for the entries of a LIST field: the
     * inspector shows a row per entry under the name that source gives it (a
     * morph weight under its shape's name). The labels come from elsewhere —
     * a mesh's own targets — which is why the field cannot state them itself.
     */
    labelSource?: string;
    /** Render as a bitmask multi-select; each option is a single bit. */
    flags?: ReadonlyArray<{
        label: string;
        value: number;
    }>;
    /** Render as a color-gradient editor (the field value is `{ stops: [...] }`). */
    gradient?: boolean;
    /** Render as a scalar over-life curve editor (the field value is `{ keys: [...] }`). */
    curve?: boolean;
    /** Render as a key→value string map editor (the field value is `Record<string,string>`)
     *  — arbitrary user properties (e.g. a Marker's gameplay data), like Tiled's custom
     *  properties. Value-shape inference can't tell a property map from any other object,
     *  so a field must opt in here. */
    map?: boolean;
    /** Render as a post-process effect stack (the field value is the `effects` array).
     *  The rows, their parameters and their ranges come from the effect registry, so an
     *  effect the engine gains is authorable without touching the editor. */
    effectStack?: boolean;
    /**
     * Render as a bitmask whose bit LABELS are resolved by the editor (e.g. named
     * collision layers from project settings) rather than fixed here. `bits` is the
     * count (default 32); `source` names the editor's label provider.
     */
    bitmask?: {
        bits?: number;
        source?: string;
    };
    /** Hard numeric range — clamps both typed entry and drag-scrub. */
    min?: number;
    max?: number;
    /** Scrub/step granularity (per pixel for drag, per arrow for the input). */
    step?: number;
    /** Render the number as a slider; requires a finite {@link min}/{@link max}. */
    slider?: boolean;
    /** Unit shown after the resting value (e.g. '°', 'px', '%'). */
    unit?: string;
    /**
     * This field is a fraction of the named sibling, axis-wise (`Sprite.pivot` of
     * `Sprite.size`), so the editor can offer a pixel view of it. The stored value
     * stays the fraction. Authored `normalized_of=` at the C++ ES_PROPERTY site.
     */
    normalizedOf?: string;
    /**
     * The states of a sibling discriminator this field means anything in — a Spot's
     * cone angles to `type: Spot`. The inspector hides it elsewhere and leaves the
     * stored value alone. Authored `shown_when=<field>:<State>` by NAME at the C++
     * ES_PROPERTY site; the names resolve to stored numbers when this is generated.
     */
    shownWhen?: {
        field: string;
        values: ReadonlyArray<number>;
    };
    /** Human label / tooltip overriding the key-derived ones. */
    label?: string;
    tooltip?: string;
    /** Group under a category header; `advanced` tucks the field behind a fold. */
    category?: string;
    advanced?: boolean;
}
/**
 * What a component declares about its fields beyond their default values: which
 * are assets, which the editor may keyframe, which replicate. Optional
 * throughout — a component that says nothing gets the derived defaults.
 *
 * @public
 */
interface ComponentMetadata {
    /**
     * Fields that are world lengths, speeds or accelerations (a radius, a walk speed, gravity): their defaults are
     * written at the reference 100 units a metre and scale with the project's units per metre (ecs/worldUnits.ts).
     * A value a scene states is never scaled.
     */
    worldUnitFields?: string[];
    assetFields?: AssetFieldMeta[];
    skeletalFields?: SkeletalFieldMeta;
    entityFields?: string[];
    /** Per-field editor presentation policy, keyed by field name. */
    fields?: Record<string, FieldMeta>;
    /** Keyframeable fields (Sequencer tracks); auto-derived from numeric fields if omitted. */
    animatableFields?: string[];
    /**
     * Fields the network replication layer syncs (RC11). Whole-field granularity;
     * omitted = the component never replicates. Builtins author this at the C++
     * ES_PROPERTY site (`replicated`) instead — same single-source rule as fieldMeta.
     */
    replicatedFields?: string[];
    /**
     * Engine-COMPUTED output fields (Transform's world-space fields), authored
     * `readonly` at the C++ ES_PROPERTY site. Never authoring inputs — the editor
     * must not project them into the World (it clobbers the composed value).
     */
    readonlyFields?: string[];
    /**
     * Custom asset discovery for scene preload. Authoritative when present:
     * `assetFields` are NOT walked for discovery (they still drive editor
     * pickers/ref rewrites), so the callback can exclude values that are not
     * asset refs (e.g. code-registered FSM/BT names).
     */
    discoverAssets?: (data: Record<string, unknown>) => AssetRef[];
    /**
     * Runtime-only state that must never persist: a transient component is
     * skipped by {@link serializeScene} (e.g. per-frame pointer/drag/hover state
     * that its driving system rebuilds each frame). Systems still
     * read/write it normally; only scene save omits it.
     *
     * Builtins author this at the C++ `ES_COMPONENT(transient)` site — same
     * single-source rule as fieldMeta.
     */
    transient?: boolean;
    /**
     * The name of the bool field that gates this component's part in an entity's
     * visibility — set it and {@link setEntityVisible}, the editor's eye and scene
     * sleep/wake all reach this component. Omitted = the component draws nothing.
     * Builtins author it at the C++ `ES_COMPONENT(renderable=<field>)` site.
     */
    renderableField?: string;
}
/**
 * Build dropdown options from an enum const, so the labels derive from the same
 * definition the runtime uses (no hand-mirrored value→label drift). `only` curates
 * the member set when an enum carries alias entries that share a value (e.g.
 * ScaleMode); otherwise duplicate values are dropped, keeping the first label.
 */
declare function enumOptions(obj: Record<string, unknown>, only?: readonly string[]): ReadonlyArray<{
    label: string;
    value: number;
}>;
/**
 * A component type, as {@link defineComponent} returns it. Pass it to queries,
 * `world.get`/`world.insert` and `Commands`; the reflection members below are
 * what the editor and the asset cook read, derived from the metadata given at
 * definition. The underscored members are engine plumbing.
 *
 * @public
 */
interface ComponentDef<T> {
    /** @internal */
    readonly _id: symbol;
    /** @internal */
    readonly _name: string;
    /** @internal */
    readonly _default: T;
    /** @internal */
    readonly _builtin: false;
    readonly assetFields: readonly AssetFieldMeta[];
    readonly skeletalFields?: SkeletalFieldMeta;
    readonly entityFields: readonly string[];
    readonly colorKeys: readonly string[];
    readonly animatableFields: readonly string[];
    /** Fields the replication layer syncs; empty = never replicates. See {@link ComponentMetadata.replicatedFields}. */
    readonly replicatedFields: readonly string[];
    /** Engine-computed output fields the editor must never write back. See {@link ComponentMetadata.readonlyFields}. */
    readonly readonlyFields: readonly string[];
    readonly fieldMeta: Readonly<Record<string, FieldMeta>>;
    readonly discoverAssets?: (data: Record<string, unknown>) => AssetRef[];
    /** Runtime-only: omitted from scene serialization. See {@link ComponentMetadata.transient}. */
    readonly transient: boolean;
    /** Bool field gating this component's visibility, or null if it draws nothing.
     *  See {@link ComponentMetadata.renderableField}. */
    readonly renderableField: string | null;
    create(data?: Partial<T>): T;
}
/**
 * Declare a component type from its name and the defaults every instance starts
 * with. `name` is the identity a scene file stores, so it is what a saved entity
 * is rebound by; defining the same name twice returns the first definition
 * rather than replacing it, so a hot reload cannot orphan live entities.
 *
 * @throws if `name` is already taken by a built-in engine component.
 * @public
 */
declare function defineComponent<T extends object>(name: string, defaults: T, metadata?: ComponentMetadata): ComponentDef<T>;
/**
 * Declare a component with no fields — a marker a query filters on. Returning
 * the existing definition for a name already declared is deliberate: a tag
 * carries no data, so re-declaring one cannot conflict with itself the way
 * {@link defineComponent} can.
 *
 * @public
 */
declare function defineTag(name: string): ComponentDef<{}>;
declare function getUserComponent(name: string): ComponentDef<any> | undefined;
declare function clearUserComponents(): void;
declare function unregisterComponent(name: string): void;
/**
 * A component the engine ships, whose storage lives in C++. Carries the same
 * reflection a {@link ComponentDef} does, authored at the `ES_PROPERTY` site
 * instead of in a metadata argument, so tooling reads both the same way.
 *
 * @public
 */
interface BuiltinComponentDef<T> {
    /** @internal */
    readonly _id: symbol;
    /** @internal */
    readonly _name: string;
    /** @internal */
    readonly _cppName: string;
    /** @internal */
    readonly _builtin: true;
    /** @internal */
    readonly _default: T;
    readonly assetFields: readonly AssetFieldMeta[];
    readonly skeletalFields?: SkeletalFieldMeta;
    readonly entityFields: readonly string[];
    readonly colorKeys: readonly string[];
    readonly animatableFields: readonly string[];
    /** Fields authored `replicated` at the C++ ES_PROPERTY site (via COMPONENT_META). */
    readonly replicatedFields: readonly string[];
    /** Fields authored `readonly` (engine-computed outputs); the editor never writes them back. */
    readonly readonlyFields: readonly string[];
    readonly fieldMeta: Readonly<Record<string, FieldMeta>>;
    readonly discoverAssets?: (data: Record<string, unknown>) => AssetRef[];
    /** Runtime-only: omitted from scene serialization. Authored `ES_COMPONENT(transient)`. */
    readonly transient: boolean;
    /** Bool field gating this component's visibility, or null if it draws nothing.
     *  Authored `ES_COMPONENT(renderable=<field>)`. */
    readonly renderableField: string | null;
}
/**
 * Either kind of component type: one a project declared, or one the engine
 * ships. Everything that takes "a component" takes this, so a query or a
 * command reads a built-in and a user component the same way.
 *
 * @public
 */
type AnyComponentDef = ComponentDef<any> | BuiltinComponentDef<any>;
declare function isBuiltinComponent(comp: AnyComponentDef): comp is BuiltinComponentDef<any>;
declare function registerComponent(name: string, def: AnyComponentDef): void;
/** Complete catalogue: global builtins + the current context's user components. */
declare function getComponentRegistry(): Map<string, AnyComponentDef>;
/** Just the current context's user/script components (excludes builtins). */
declare function getUserComponents(): Map<string, AnyComponentDef>;
/**
 * A stable digest of the current context's user component schemas — each component's
 * name plus its default field shape (keys + value types, recursively). The hot-reload
 * fast path compares this across a project-bundle re-import: an unchanged digest means
 * only system logic changed (hot-swap, keep the live World); a changed digest means a
 * component's fields changed and the live data no longer matches the new schema, so the
 * realm must full-reload. Builtins are excluded (their C++-backed shape never changes).
 * Default *values* are intentionally not hashed — only the shape gates a rebuild.
 */
declare function getUserComponentFingerprint(): string;
declare function getComponent(name: string): AnyComponentDef | undefined;
/** A component's per-field editor presentation metadata (empty if none declared). */
declare function getComponentFieldMeta(name: string): Readonly<Record<string, FieldMeta>>;
/**
 * The fields the replication layer syncs for a component — builtin (C++
 * `replicated` annotation) and user (`replicatedFields` metadata) through one
 * accessor. Empty = the component never replicates.
 */
declare function getReplicatedFields(name: string): readonly string[];
declare const ScaleMode: {
    readonly FixedWidth: CanvasScaleMode.FixedWidth;
    readonly FixedHeight: CanvasScaleMode.FixedHeight;
    readonly Expand: CanvasScaleMode.Expand;
    readonly Shrink: CanvasScaleMode.Shrink;
    readonly Match: CanvasScaleMode.Match;
    readonly ShowAll: CanvasScaleMode.Expand;
    readonly NoBorder: CanvasScaleMode.Shrink;
};
type ScaleMode = (typeof ScaleMode)[keyof typeof ScaleMode];

type LocalTransformData = TransformData;
type WorldTransformData = TransformData;
/**
 * {@link Camera}'s fields, and one the editor adds.
 *
 * @beta
 */
interface CameraData extends CameraData$1 {
    showFrustum: boolean;
}
/**
 * {@link Name}'s single field. TS-only: the engine keeps names in its own index
 * rather than as a C++ component.
 *
 * @public
 */
interface NameData {
    value: string;
}
interface SceneOwnerData {
    scene: string;
    persistent: boolean;
}
/**
 * Where an entity is. `position`/`rotation`/`scale` are the authoring inputs,
 * relative to the parent; `worldPosition`/`worldRotation`/`worldScale` are what
 * the engine composed from them and must not be written back.
 *
 * @public
 */
declare const Transform: BuiltinComponentDef<TransformData>;
/**
 * @deprecated A legacy spelling of {@link Transform} — the same component. Scene
 * loading normalises the name away, and both spellings will go at 1.0.
 */
declare const LocalTransform: BuiltinComponentDef<TransformData>;
/**
 * @deprecated A legacy spelling of {@link Transform} — the same component, whose
 * world fields it was once separate from. Read `Transform.worldPosition` instead.
 */
declare const WorldTransform: BuiltinComponentDef<TransformData>;
/**
 * A textured quad. `size` is in world units and is the drawn extent — the texture
 * is stretched into it rather than deciding it — and `pivot` says where in that
 * rectangle the entity's position sits. `layer` is the painter order between
 * sprites; within a layer, storage order decides.
 *
 * @public
 */
declare const Sprite: BuiltinComponentDef<SpriteData>;
/**
 * Authored drag configuration, read by the drag system. Works on a UI node and
 * on a plain world-space sprite alike — the hit test answers for both.
 *
 * @experimental
 */
declare const Draggable: BuiltinComponentDef<DraggableData>;
declare const ShapeRenderer: BuiltinComponentDef<ShapeRendererData>;
declare const Light: BuiltinComponentDef<LightData>;
declare const ShadowCaster2D: BuiltinComponentDef<ShadowCaster2DData>;
declare const LightProbeVolume: BuiltinComponentDef<LightProbeVolumeData>;
/** A non-recursive planar capture, received by this entity's lit material. @experimental */
declare const PlanarReflection: BuiltinComponentDef<PlanarReflectionData>;
/**
 * A box inside which reflections come from a bake rather than from the sky: the
 * specular half of what LightProbeVolume answers. The atlas is the SCENE's and
 * `slot` says which column of it is here, so a room full of shiny things is still
 * one draw — a texture per probe would be a bind per draw.
 *
 * @experimental
 */
declare const ReflectionProbe: BuiltinComponentDef<ReflectionProbeData>;
/**
 * A box sight does not pass through: what stands behind it is not collected, and
 * the picture is unchanged. Authored, not taken from the geometry beside it — the
 * box has to lie INSIDE the wall, and bounds that contain a mesh claim the air at
 * its corners, where things would stop being drawn in front of the player.
 *
 * @experimental
 */
declare const Occluder: BuiltinComponentDef<OccluderData>;
/**
 * Turns this entity's `Sprite` into a stencil: the sprites drawn AFTER it that ask to be
 * masked (`Sprite.maskInteraction`) are cut by its shape. The mask's own sprite is not
 * drawn while it is masking — it is the cut, not a picture.
 */
declare const SpriteMask: BuiltinComponentDef<SpriteMaskData>;
/**
 * Makes this entity and everything under it sort as ONE unit: the group states the
 * layer and order the whole subtree presents outward, and each member's own
 * `Sprite.order` becomes its place INSIDE the group. Nothing outside the group can
 * land between two of its members, which is what a per-sprite order cannot promise.
 */
declare const SortingGroup: BuiltinComponentDef<SortingGroupData>;
/**
 * Fades this entity and everything under it: the opacities multiply down the hierarchy into each descendant's own alpha,
 * the way `UINode.opacity` does for a UI subtree. It is not a composited layer — overlapping children show through one
 * another mid-fade.
 */
declare const GroupOpacity: BuiltinComponentDef<GroupOpacityData>;
/**
 * What a viewport draws and from where. One camera per render target;
 * `priority` breaks the tie and `isActive` takes one out.
 *
 * `@beta`: `clearFlags` is a bitmask whose C++ enum has no TypeScript spelling,
 * and `cullingMask` names layers no exported constant identifies — so two of
 * these fields are typed `number` for want of the vocabulary, not by design.
 *
 * @beta
 */
declare const Camera: BuiltinComponentDef<CameraData>;
declare const Canvas: BuiltinComponentDef<CanvasData>;
declare const Velocity: BuiltinComponentDef<VelocityData>;
/**
 * An entity's parent. The engine keeps this and {@link Children} in step, so
 * set the relationship through `world.setParent` rather than by writing either
 * side; a transform composes against whatever this names.
 *
 * @public
 */
declare const Parent: BuiltinComponentDef<ParentData>;
/**
 * An entity's children, in order. The order is the draw order within a layer
 * for UI, and the engine maintains the list — {@link Parent} is the side to
 * write.
 *
 * @public
 */
declare const Children: BuiltinComponentDef<ChildrenData>;
declare const BitmapText: BuiltinComponentDef<BitmapTextData>;
/**
 * A Spine skeleton on an entity — which skeleton and atlas, and what it is
 * playing. Driving it is {@link Spine}'s job; this is the data it drives.
 *
 * @beta
 */
declare const SpineAnimation: BuiltinComponentDef<SpineAnimationData>;
declare const DragonBonesAnimation: BuiltinComponentDef<DragonBonesAnimationData>;
/**
 * Local-space geometry of a MeshRenderer renderable (triangle list, indexed).
 * `positions` is x,y pairs; `uvs` is u,v pairs (default 0,0); `colors` is r,g,b,a
 * floats (0-1) per vertex (default white). Uploaded via meshRenderer_setGeometry, which
 * validates indices engine-side.
 */
interface MeshRendererGeometry {
    positions: number[];
    uvs?: number[];
    colors?: number[];
    indices: number[];
}
interface MeshRendererData extends MeshRendererData$1 {
    geometry: MeshRendererGeometry;
}
declare const MeshRenderer: BuiltinComponentDef<MeshRendererData>;
declare const TrailRenderer: BuiltinComponentDef<TrailRendererData>;
declare const SpringBone: BuiltinComponentDef<SpringBoneData>;
declare const SpringBoneCollider: BuiltinComponentDef<SpringBoneColliderData>;
declare const Billboard: BuiltinComponentDef<BillboardData>;
declare const Impostor: BuiltinComponentDef<ImpostorData>;
declare const ParticleForceField: BuiltinComponentDef<ParticleForceFieldData>;
declare const ParticleCollider: BuiltinComponentDef<ParticleColliderData>;
/**
 * One layer of a tile lattice: `cellSize` is its step in world units, and
 * `orientation` with the stagger fields cover isometric and hex, so it is not
 * only a square grid. The tiles are in a referenced `.estileset` rather than
 * here — render, collision and tile animation all derive from that.
 *
 * @beta
 */
declare const TilemapLayer: BuiltinComponentDef<TilemapLayerData>;

/**
 * The generated C++ field shape plus two the simulation has no member for:
 * `colorGradient` and `sizeCurve` are authored in TypeScript and baked to a LUT
 * the sim reads (see particlePlugin's scene codec), which is why they live here
 * and not in the generated interface.
 *
 * @beta
 */
interface ParticleEmitterData extends ParticleEmitterData$1 {
    /**
     * Color-over-life gradient (authored stops). When it has stops it overrides
     * startColor/endColor + colorEasing. Empty ⇒ start/end fallback.
     */
    colorGradient: {
        stops: {
            t: number;
            color: Color;
        }[];
    };
    /**
     * Size-over-life curve (a multiplier × start size, keys over [0,1]). When it
     * has keys it overrides startSize/endSize + sizeEasing. Empty ⇒ start/end fallback.
     */
    sizeCurve: {
        keys: {
            t: number;
            v: number;
        }[];
    };
    /**
     * Bursts on a schedule: `count` particles once the emitter has been emitting for `time` seconds, repeated every
     * `duration` while it loops. Beside (not instead of) `burstCount`, which repeats one burst on an interval.
     */
    bursts: {
        time: number;
        count: number;
    }[];
}
/**
 * A particle system on an entity. `colorGradient` and `sizeCurve` OVERRIDE the
 * start/end pairs when they carry stops or keys and fall back to them when
 * empty; `simulationSpace` decides whether particles follow the entity or are
 * left behind by it. Integration is C++, over the whole system at once.
 *
 * @beta
 */
declare const ParticleEmitter: BuiltinComponentDef<ParticleEmitterData>;
/**
 * Marks an entity inactive: it keeps its components and its place in the tree,
 * and every query skips it — which is how the systems skip it. A query that
 * NAMES this one sees them, since managing the switch means reaching what is
 * switched off; `setEntityActive` sets it, and takes the subtree with it.
 */
declare const Disabled: ComponentDef<{}>;
/**
 * Marks a world-only DERIVED entity — one a system (re)builds from source data
 * (the child layer entities a `Tilemap.source` projects, runtime tile
 * colliders, …). Scene serialization skips tagged entities entirely:
 * persisting one would duplicate it against the next derivation.
 *
 * @public
 */
declare const RuntimeOnly: ComponentDef<{}>;
/**
 * An entity's name — what the outliner shows and `findEntityByName` looks up.
 * Not an identity: nothing stops two entities sharing one.
 *
 * @public
 */
declare const Name: ComponentDef<NameData>;
declare const SceneOwner: ComponentDef<SceneOwnerData>;
interface MarkerData {
    /** Gameplay identity — the game queries markers of a given kind (spawn point,
     *  waypoint, pickup, door, trigger …). Free-form: the game defines the vocabulary.
     *  `Query(Marker)` then filters by `type`. */
    type: string;
    /** Arbitrary per-marker gameplay data (team, targetScene, event, …), like Tiled's
     *  custom object properties. Imported `.tmj` object properties land here too. */
    properties: Record<string, string>;
}
/**
 * A named point/region of gameplay interest, placed in the editor as a real entity.
 * On its own (Transform + Marker) it's a spawn point / waypoint / location marker; add a
 * sensor collider (the Trigger Area preset) and it's a trigger zone. Pure ECS — no
 * parallel "object layer" structure — so it serializes, shows in the Inspector, and is
 * `Query`-able like any component. The converged target for imported `.tmj` object groups.
 */
declare const Marker: ComponentDef<MarkerData>;
interface PostProcessVolumeData {
    effects: {
        type: string;
        enabled: boolean;
        uniforms: Record<string, number>;
        /** Texture params (LUTs, masks): sampler uniform -> serialized texture ref. */
        textures?: Record<string, string>;
        /** Colour params (a fog colour): uniform -> RGBA. Blends like a float does,
         *  toward the effect's declared default at a volume's soft edge. */
        colors?: Record<string, {
            r: number;
            g: number;
            b: number;
            a: number;
        }>;
    }[];
    isGlobal: boolean;
    shape: 'box' | 'sphere';
    /** Half-extents of the shape (a sphere uses `x` as its radius). `z` is the
     *  half-DEPTH of a box, where **0 means unbounded** — a flat scene's volume
     *  reaches through every depth, and a box of no thickness would contain
     *  nothing at all. */
    size: {
        x: number;
        y: number;
        z?: number;
    };
    priority: number;
    weight: number;
    blendDistance: number;
}
declare const PostProcessVolume: ComponentDef<PostProcessVolumeData>;
interface WeatherData {
    /** The weather the scene is in (the built-in presets: Clear, Mist, Overcast, Rain, Storm, Snow). */
    preset: number;
    /** The weather it is turning into; -1 for none. */
    target: number;
    /** How far along that turn it is, 0..1. The system advances it in play, and a value set here previews it in the editor. */
    progress: number;
    /** Seconds a turn takes. */
    duration: number;
    /** Presets to cycle through by themselves, by name or id, comma separated ("clear,mist,rain,clear"); empty = stay. */
    sequence: string;
    /** Seconds each weather of the sequence holds before the next turn begins. */
    hold: number;
    /** What the weather drives: lights, fog, rain, grade, exposure, reflections, sound, wind (plants and waves). */
    drive: number;
    /** An entity with a looping AudioSource — the sound of the rain. The weather sets its volume (the authored one times
     *  how hard it rains) and raises or lowers its `playing`. 0 = none. */
    soundSource: number;
}
/**
 * The weather of a scene: one of a few presets, a turn toward another, and an optional cycle between them.
 *
 * @details A preset is a handful of multipliers on what the scene already has — the sun at a fraction of its strength,
 *          the fog thicker, the picture a little greyer — and a few absolute levels (how hard it rains, how wet the ground
 *          is), so the same weather fits any project. The component drives the scene's lights (in play), the post-process
 *          effects its volumes resolve (rain, fog, grade, exposure, reflections) and the sound of the rain.
 */
declare const Weather: ComponentDef<WeatherData>;
interface TimeOfDayData {
    /** The hour of the day, 0..24 (12 is noon). The system advances it in play, and a value set here previews it in the editor. */
    hour: number;
    /** Seconds a whole day takes while the game runs; 0 holds the hour where it is. */
    daySeconds: number;
    /** Where on the planet, in degrees (positive north): how high the noon sun climbs and how long a day is. */
    latitude: number;
    /** The season, in degrees, -23.5 (winter) .. 23.5 (summer) in the north. */
    declination: number;
    /** How far the world is turned from compass north (+Z) toward +X, in degrees: which way the sun rises. */
    north: number;
    /** What the time drives: the lights, the sky, the fog, the exposure, the reflections. */
    drive: number;
}
/**
 * The time of day of a scene: where the sun and the moon are, and what the light, the sky and the fog are because of it.
 *
 * @details The sun crosses the sky along the path its latitude and the season give it; the scene's directional light is aimed
 *          at it (at the moon by night) and scaled by a day's curve — warm and weak near the horizon, gone once it is down — and
 *          the ambient light follows. A Sky Atmosphere effect draws the sun, a dusk glow, a moon and stars where it stands,
 *          and the fog is lit as the day is. It composes with Weather: both scale the same lights from what the author set.
 */
declare const TimeOfDay: ComponentDef<TimeOfDayData>;

/**
 * The value shape a component definition holds — `ComponentData<typeof Transform>`
 * is `TransformData`. This is what `world.get` answers and `world.set` takes, so a
 * helper generic over a component writes its own signature with it.
 *
 * @public
 */
type ComponentData<C> = C extends BuiltinComponentDef<infer T> ? T : C extends ComponentDef<infer T> ? T : never;
declare function getComponentDefaults(typeName: string): Record<string, unknown> | null;

/**
 * @file    query.ts
 * @brief   Component query system with mutable component support
 */

/**
 * A query argument asking for write access, as {@link Mut} returns it. Opaque —
 * the query yields the component's data, not this.
 *
 * @public
 */
interface MutWrapper<T extends AnyComponentDef> {
    /** @internal */
    readonly _type: 'mut';
    /** @internal */
    readonly _component: T;
}
/**
 * Ask a {@link Query} for write access to `component`.
 *
 * An unwrapped engine component is yielded as a copy, so assigning to it changes
 * nothing. Wrapped, the yielded data is written back to the world as iteration
 * leaves the entity, and the component is marked changed for `Changed()`.
 *
 * @public
 */
declare function Mut<T extends AnyComponentDef>(component: T): MutWrapper<T>;
/**
 * A query argument matching only entities that gained the component since this
 * system last ran, as {@link Added} returns it. Opaque — the query still yields
 * the component's data.
 *
 * @public
 */
interface AddedWrapper<T extends AnyComponentDef> {
    /** @internal */
    readonly _filterType: 'added';
    /** @internal */
    readonly _component: T;
}
/**
 * A query argument matching only entities whose component was written since
 * this system last ran, as {@link Changed} returns it. A write is what
 * {@link Mut} records, so an unwrapped read never marks one.
 *
 * @public
 */
interface ChangedWrapper<T extends AnyComponentDef> {
    /** @internal */
    readonly _filterType: 'changed';
    /** @internal */
    readonly _component: T;
}
declare function Added<T extends AnyComponentDef>(component: T): AddedWrapper<T>;
declare function Changed<T extends AnyComponentDef>(component: T): ChangedWrapper<T>;
/**
 * Every value accepted as a positional `Query(...)` argument: a bare component,
 * or a component wrapped for mutation / change detection. Exported so `system.ts`
 * can constrain `SystemParam` against the exact same set — the two must never drift.
 */
/**
 * Anything {@link Query} accepts: a component for read access, or one wrapped in
 * {@link Mut} to write, `Added()` to match only entities that just gained it, or
 * `Changed()` to match only those whose copy was written since the last run.
 *
 * @public
 */
type QueryArg = AnyComponentDef | MutWrapper<AnyComponentDef> | AddedWrapper<AnyComponentDef> | ChangedWrapper<AnyComponentDef>;
/**
 * A composable match expression for {@link QueryBuilder.filter}, built with
 * `With`/`Without`/`And`/`Or`/`Not`. A readable data shape on purpose: an
 * editor or a tool can inspect one without running the query.
 *
 * @public
 */
type FilterExpr = {
    readonly kind: 'with';
    readonly component: AnyComponentDef;
} | {
    readonly kind: 'without';
    readonly component: AnyComponentDef;
} | {
    readonly kind: 'and';
    readonly filters: readonly FilterExpr[];
} | {
    readonly kind: 'or';
    readonly filters: readonly FilterExpr[];
} | {
    readonly kind: 'not';
    readonly filter: FilterExpr;
};
declare function With(component: AnyComponentDef): FilterExpr;
declare function Without(component: AnyComponentDef): FilterExpr;
declare function And(...filters: FilterExpr[]): FilterExpr;
declare function Or(...filters: FilterExpr[]): FilterExpr;
declare function Not(filter: FilterExpr): FilterExpr;
/**
 * A settled query request in a system's parameter list. Opaque — the system body
 * receives a `QueryInstance` to iterate.
 *
 * @public
 */
interface QueryDescriptor<C extends readonly QueryArg[]> {
    /** @internal */
    readonly _type: 'query';
    /** @internal */
    readonly _components: C;
    /** @internal */
    readonly _mutIndices: number[];
    /** @internal */
    readonly _with: AnyComponentDef[];
    /** @internal */
    readonly _without: AnyComponentDef[];
    /** @internal */
    readonly _addedFilters: Array<{
        index: number;
        component: AnyComponentDef;
    }>;
    /** @internal */
    readonly _changedFilters: Array<{
        index: number;
        component: AnyComponentDef;
    }>;
    /** @internal */
    readonly _filter: FilterExpr | null;
}
/**
 * A {@link Query} before it is handed to a system, narrowable by components the
 * match must or must not have. Each call returns a NEW builder, so narrowing a
 * shared query does not disturb it, and any of them is a valid parameter.
 *
 * @public
 */
interface QueryBuilder<C extends readonly QueryArg[]> extends QueryDescriptor<C> {
    /** Match only entities that also carry all of these; their data is not yielded. */
    with(...components: AnyComponentDef[]): QueryBuilder<C>;
    /** Exclude entities carrying any of these. */
    without(...components: AnyComponentDef[]): QueryBuilder<C>;
    /** Attach a composable filter expression. Replaces any prior call. */
    filter(expr: FilterExpr): QueryBuilder<C>;
}
/**
 * Match the entities carrying every one of `components`, yielding the entity
 * followed by each component's data in the order asked for.
 *
 * Read-only unless an argument is wrapped in {@link Mut}; narrow further with
 * the builder's `with`/`without`, or per-component with `Added()`/`Changed()`.
 *
 * @public
 */
declare function Query<C extends QueryArg[]>(...components: C): QueryBuilder<C>;
/**
 * The component a {@link QueryArg} asks for, with any wrapper taken off — `Mut(X)`,
 * `Added(X)` and `Changed(X)` all read as `X`, because a wrapper says how the
 * component is accessed and not which one it is.
 *
 * @public
 */
type UnwrapQueryArg<T> = T extends MutWrapper<infer C> ? C : T extends AddedWrapper<infer C> ? C : T extends ChangedWrapper<infer C> ? C : T;
/**
 * The data tuple a query's arguments resolve to, in the order they were asked
 * for. Computed, never supplied — but {@link QueryResult} is spelled with it, so
 * it carries a name a reader can look up.
 *
 * @public
 */
type ComponentsData<C extends readonly QueryArg[]> = {
    [K in keyof C]: ComponentData<UnwrapQueryArg<C[K]>>;
};
/**
 * One step of a {@link QueryInstance}: the entity, then each requested
 * component's data in the order it was asked for. A tuple, so destructuring it
 * in a `for…of` is typed without annotation.
 *
 * @public
 */
type QueryResult<C extends readonly QueryArg[]> = [
    Entity,
    ...ComponentsData<C>
];
/** What a system's queries walked in a frame, and what they then discarded. */
interface QueryCost {
    /** Times the system asked a query for its entities. */
    calls: number;
    /** Entities those calls walked, summed. */
    scanned: number;
    /** Of those, entities an Added/Changed filter rejected. */
    filtered: number;
}
/**
 * A live query, as a system body receives it. Iterate it — each step yields the
 * entity followed by its components — or use `forEach`, `single`, `toArray`,
 * `count` and `isEmpty`. Any {@link Mut} argument is written back and marked
 * changed as iteration leaves each entity, so leaving the loop early is safe.
 *
 * @public
 */
declare class QueryInstance<C extends readonly QueryArg[]> implements Iterable<QueryResult<C>> {
    private readonly world_;
    private readonly descriptor_;
    private readonly actualComponents_;
    private readonly allRequired_;
    private readonly result_;
    private readonly mutData_;
    /**
     * Mut rows the iterator handed out and the caller may still be holding:
     * entity, which Mut slot, and the very object it was given. Written once more
     * when the system returns — see {@link settleKeptRows}.
     */
    private kept_;
    private readonly cacheKey_;
    private readonly depIds_;
    private lastRunTick_;
    private lastChangeSequence_;
    private sequenceMatchers_;
    private calls_;
    private scanned_;
    private filtered_;
    private readonly getters_;
    private readonly gettersRetained_;
    private readonly mutSetters_;
    private readonly mutIsBuiltin_;
    private readonly compiledFilter_;
    constructor(world: World, descriptor: QueryDescriptor<C>, lastRunTick?: number);
    /** @internal Update lastRunTick for reuse across system runs */
    resetTick(tick: number): void;
    /** @internal System-owned queries use completed runs, not coarse frame ticks. */
    resetChangeSequence(sequence: number): void;
    /**
     * Every result reader uses this candidate set. A closed change window is
     * empty in O(1); otherwise the structural query cache supplies the entities
     * before their individual change filters are applied.
     */
    private candidates_;
    /**
     * @internal What this query cost since the last read: how many times it was
     * asked, how many entities that walked, and how many of those a change filter
     * then threw away. Reset by the read, so a frame's figure is that frame's.
     */
    takeCost(): QueryCost;
    private hasChangeFilters_;
    private passesChangeFilters_;
    private rejected_;
    /**
     * Write buffered Mut() data back to storage for one entity and record a
     * Changed tick for each mutated component. This is the single write-back path
     * shared by the iterator and forEach — keeping the three former copies from
     * drifting apart.
     *
     * Builtin (wasm-backed) components write through a direct ptr / embind setter
     * that pokes component storage without going through world.set(), so the
     * change must be recorded here explicitly to keep Changed()/Added() detection
     * consistent with script components and with world.set(). recordChanged()
     * self-gates on whether any query is actually tracking the component, so on
     * the hot path with nothing listening this is a Set.has() + return.
     */
    private writeMutBack_;
    /**
     * @internal Write the Mut rows this query's iterator handed out once more,
     * now that the system has returned. Called by the runner, before the
     * system's Commands flush.
     *
     * The iterator's rows are the ones a caller may KEEP, and keeping them is
     * how a system edits after the loop: collect, sort, then change the nearest.
     * A script component's row is its stored object, so that edit already landed;
     * an engine-backed one (Transform, Sprite) is a copy written back as the loop
     * advanced, and an edit made after that was silently dropped. Until the
     * system returns a kept row stays live. The lent rows of {@link forEach} are
     * not tracked and cost nothing here.
     */
    settleKeptRows(): void;
    /**
     * Rows the caller may keep: a fresh array per entity, and for an
     * engine-backed component a fresh value rather than the shared fill target.
     * {@link forEach} lends its row instead and is cheaper for a body that only
     * reads it once.
     */
    [Symbol.iterator](): Iterator<QueryResult<C>>;
    /**
     * Run `callback` per matching entity, LENDING it the row: the values are
     * refilled for the next entity, so anything kept past the callback must be
     * copied. The fast path — iterating instead costs an allocation per row
     * (1.2x for script components, 1.7x for engine-backed ones).
     */
    forEach(callback: (entity: Entity, ...components: ComponentsData<C>) => void): void;
    /**
     * The one result, or null. Copied off the iterator's shared row buffer, which
     * the next iteration overwrites — a caller that holds this would otherwise
     * watch it change under them.
     */
    /** The one row, or null. The iterator's rows are already the caller's to keep. */
    single(): QueryResult<C> | null;
    /**
     * Whether iterating would yield nothing. Asks the entity set rather than
     * running the iterator: taking one step of a Mut() query writes that entity
     * back and records a Changed tick for it, and asking whether a query is empty
     * must not mark anything as having changed.
     */
    isEmpty(): boolean;
    /**
     * How many results iterating would yield. Added()/Changed() are per-entity
     * tick checks rather than part of the entity set the cache returns, so
     * counting has to apply them too — the same pass the iterator makes.
     */
    count(): number;
    toArray(): QueryResult<C>[];
}
/**
 * A request to iterate the entities that LOST a component since this system
 * last ran, as {@link Removed} returns it. Opaque — the body receives an
 * instance yielding entities, since the component itself is already gone.
 *
 * @public
 */
interface RemovedQueryDescriptor<T extends AnyComponentDef> {
    /** @internal */
    readonly _type: 'removed';
    /** @internal */
    readonly _component: T;
}
declare function Removed<T extends AnyComponentDef>(component: T): RemovedQueryDescriptor<T>;
/**
 * The entities that lost a component since this system last ran, as
 * {@link Removed} asked for. Yields entities only — the component is gone, so
 * there is nothing left to read from it.
 *
 * @public
 */
declare class RemovedQueryInstance<T extends AnyComponentDef> implements Iterable<Entity> {
    private readonly world_;
    private readonly component_;
    private lastRunTick_;
    private readerId_;
    private readThrough_;
    /** Constructing one has NO side effect on the world: a runner that builds
     *  several params and throws on a later one would otherwise leave a claim
     *  on removal history that nothing can ever release. */
    constructor(world: World, component: T, lastRunTick: number);
    /** @internal Claim the history, once the whole parameter set is committed. */
    activateRetention(): void;
    /**
     * @internal This run is over, so release the sequence it observed. A later
     * removal in the same frame is still owed. NOT `resetTick`: a system may
     * await mid-body, and an early release would let another reader's prune
     * take rows this one is still owed.
     */
    releaseThrough(_lastRunTick: number): void;
    /** @internal Give up the claim — the runner evicted or reset this system. */
    dispose(): void;
    /** @internal Update lastRunTick for reuse across system runs */
    resetTick(tick: number): void;
    private read_;
    [Symbol.iterator](): Iterator<Entity>;
    isEmpty(): boolean;
    toArray(): Entity[];
}

/**
 * @file    commands.ts
 * @brief   Deferred entity/component operations
 */

/**
 * A request for a command queue in a system's parameter list, as
 * {@link Commands} returns it. Opaque — the system body receives a
 * `CommandsInstance`, which is the thing with methods.
 *
 * @public
 */
interface CommandsDescriptor {
    /** @internal */
    readonly _type: 'commands';
}
/**
 * Ask a system for a command queue: spawning, despawning and adding or removing
 * components, recorded now and applied together.
 *
 * It flushes when the system returns — on a throw too, and after an async body's
 * await — so structural edits never land mid-iteration of that system's queries.
 *
 * @public
 */
declare function Commands(): CommandsDescriptor;
interface SpawnComponentEntry {
    component: AnyComponentDef;
    data: unknown;
}
/**
 * One entity's share of a {@link CommandsInstance}: chain `insert`/`remove` and
 * let the queue apply them. Asking {@link EntityCommands.id} for a spawn's
 * entity materialises it early, because an id has to exist to be answered —
 * except inside a running query, where the id is reserved and the spawn still
 * lands at the flush.
 *
 * @public
 */
declare class EntityCommands {
    private readonly commands_;
    private readonly entityRef_;
    private readonly components_;
    private readonly spawnName_?;
    private isNew_;
    private parent_;
    constructor(commands: CommandsInstance, entity: Entity | null, name?: string);
    /** @internal What this spawn or edit WOULD do, as text a second run can be
     *  compared against — a queued spawn has no entity yet, so identity cannot
     *  be part of the comparison and the composition is. */
    describe(): string;
    insert<T extends object>(component: AnyComponentDef, data?: Partial<T>): this;
    remove(component: AnyComponentDef): this;
    /**
     * Attach this entity under `parent`. The engine keeps {@link Parent} and
     * {@link Children} in step from here — inserting `Parent` yourself writes
     * only one half of the link.
     */
    childOf(parent: Entity): this;
    id(): Entity;
    finalize(): void;
}
/**
 * The command queue a system declared with {@link Commands}. Records structural
 * work — spawn, despawn, add or remove a component, install a resource — and
 * applies it when the system returns, so nothing moves under a running query.
 *
 * @public
 */
declare class CommandsInstance {
    private readonly world_;
    private readonly resources_;
    private pending_;
    private spawned_;
    constructor(world: World, resources: ResourceStorage);
    spawn(name?: string): EntityCommands;
    entity(entity: Entity): EntityCommands;
    despawn(entity: Entity): this;
    /**
     * A world-level service, for the work no component write can express.
     * Null where nothing installed it — an app assembled without that plugin
     * is a fact to report, not a crash. Here rather than on each context
     * because this is the one door every authored surface already holds.
     */
    resource<T>(def: ResourceDef<T>): T | null;
    insertResource<T>(resource: ResourceDef<T>, value: T): this;
    queueInsert(entity: Entity, component: AnyComponentDef, data: unknown): void;
    queueRemove(entity: Entity, component: AnyComponentDef): void;
    queueSetParent(entity: Entity, parent: Entity): void;
    /** @internal Whether the world is inside a query walk, where a spawn must wait. */
    isWorldIterating(): boolean;
    /** @internal An identity for a spawn that will be applied at flush. */
    reserveEntity(): Entity;
    /** @internal How EntityCommands applies a deferred spawn — `entityRef` is the
     *  handle it already gave the caller, filled in once the entity exists. */
    spawnImmediate(components: SpawnComponentEntry[], entityRef: {
        entity: Entity;
    }, name?: string, parent?: Entity | null): void;
    /** @internal Everything queued and not yet applied, as comparable text. */
    describe(): string;
    flush(): void;
    private executeCommand;
}

/**
 * @file    event.ts
 * @brief   Event system with double-buffered event buses
 */
/**
 * An event type, as {@link defineEvent} returns it. Opaque — pass it to
 * {@link EventWriter} / {@link EventReader} rather than reading it.
 *
 * @public
 */
interface EventDef<T> {
    /** @internal */
    readonly _id: symbol;
    /** @internal */
    readonly _name: string;
    /**
     * The payload's fields, as a value rather than as an erased type — the same
     * thing `defineComponent` and `defineResource` carry, and for the same
     * reason: a mechanism that has to know this shape can ask.
     *
     * @internal
     */
    readonly _default?: object;
    /** @internal */
    readonly _phantom?: T;
}
/**
 * Declare an event type. The bus is double-buffered: an event sent this frame is
 * readable for exactly the next one, so a reader that misses a frame misses the
 * event — events are for this-frame signalling, not a queue.
 *
 * `payload` is a default of the shape `T`, the way a component declares its
 * fields. Optional, and needed only where a `@compiled` system reads or writes
 * the event: `T` is erased at run time, so without it nothing on this side can
 * say what layout the compiled code baked in. The compiler asks for it by name
 * and line when a promise depends on it.
 *
 * @public
 */
declare function defineEvent<T>(name: string, payload?: T & object): EventDef<T>;
declare class EventBus<T> {
    private readBuffer_;
    private writeBuffer_;
    send(event: T): void;
    getReadBuffer(): readonly T[];
    swap(): void;
    /** @internal How much has been written since the last swap — a speculation
     *  takes this before it runs and un-writes back to it if it is abandoned. */
    writeMark(): number;
    /** @internal */
    rewindWrite(mark: number): void;
    /** @internal Payloads written past `mark`, oldest first, as text. */
    writtenSince(mark: number): string[];
}
declare class EventRegistry {
    private readonly buses_;
    /**
     * By NAME as well, because a compiled module's manifest carries names —
     * it cannot know a runtime's symbols. Registered when a bus is first made,
     * which is when a system asks for a reader or a writer.
     */
    private readonly byName_;
    register<T>(event: EventDef<T>): void;
    getBus<T>(event: EventDef<T>): EventBus<T>;
    /** The bus a manifest's name refers to, or undefined if nothing made one. */
    busNamed(name: string): EventBus<unknown> | undefined;
    private make_;
    swapAll(): void;
    /** @internal Where every bus's write half stands right now. */
    writeMarks(): Map<symbol, number>;
    /** @internal Un-write back to `marks`. A bus made DURING the speculation is
     *  absent from them, so it rewinds to empty rather than being left alone. */
    rewindWrites(marks: Map<symbol, number>): void;
    /** @internal What has been written since `marks`, as comparable text: a
     *  replay asks whether the same step announces the same things. */
    writtenSince(marks: Map<symbol, number>): string;
}
/**
 * A request for send access to an event in a system's parameter list, as
 * {@link EventWriter} returns it. Opaque — the body receives the instance.
 *
 * @public
 */
interface EventWriterDescriptor<T> {
    /** @internal */
    readonly _type: 'event_writer';
    /** @internal */
    readonly _event: EventDef<T>;
}
/**
 * A request for receive access to an event, as {@link EventReader} returns it.
 * Each reader keeps its own cursor, so two systems both see every event.
 *
 * @public
 */
interface EventReaderDescriptor<T> {
    /** @internal */
    readonly _type: 'event_reader';
    /** @internal */
    readonly _event: EventDef<T>;
}
/**
 * Ask a system for send access to an event. The body receives an
 * {@link EventWriterInstance}; what it sends is readable next frame.
 *
 * @public
 */
declare function EventWriter<T>(event: EventDef<T>): EventWriterDescriptor<T>;
/**
 * Ask a system for receive access to an event. Each declaring system keeps its
 * own cursor, so two readers both see every event rather than consuming it from
 * each other.
 *
 * @public
 */
declare function EventReader<T>(event: EventDef<T>): EventReaderDescriptor<T>;
/**
 * The send end of an event, as {@link EventWriter} asked for. What is sent this
 * frame is what every reader sees next, so sending is not a call into them.
 *
 * @public
 */
declare class EventWriterInstance<T> {
    private readonly bus_;
    constructor(bus: EventBus<T>);
    send(event: T): void;
}
/**
 * The events sent since this system last ran, as {@link EventReader} asked for.
 * Reading does not consume: every reader of an event sees the whole frame's
 * worth, and the buffer turns over on its own.
 *
 * @public
 */
declare class EventReaderInstance<T> implements Iterable<T> {
    private readonly bus_;
    constructor(bus: EventBus<T>);
    [Symbol.iterator](): Iterator<T>;
    isEmpty(): boolean;
    toArray(): T[];
}

/**
 * @file    AotContext.ts
 * @brief   The host half of the ABI, in the language that owns the maps.
 *
 * @details The ABI gives the host four jobs: pack the rows, resolve the resource
 *          addresses, ready the command buffer, and fill a SysCtx. On web that host is TypeScript rather than C++, and not by
 *          preference — the query's candidate set and the script pools' slot
 *          maps are both here, so anything else would have to call back across
 *          the boundary once per entity per frame, which is the cost AOT exists
 *          to remove.
 *
 *          Everything it writes goes into the ENGINE's linear memory, because
 *          that is where the compiled code reads. The arena is rebuilt per call:
 *          a row array has a one-call lifetime, and reusing the block rather
 *          than the contents is what keeps that free.
 */

/** One record the compiled code appended. */
interface AotCommand {
    readonly kind: number;
    readonly a: number;
}
/**
 * The per-call scratch, in engine memory. One instance per system is enough —
 * a call is over before the next begins, and nothing may outlive it.
 */
declare class AotContext {
    private readonly memory;
    private block;
    private disposed;
    private words;
    private cmdCap;
    /** f64 slots a call may append across every writer it declared. */
    private eventCap;
    constructor(memory: PoolMemory, cmdCap?: number, eventCap?: number);
    /** Hand the block back; the arena is dead after this. */
    dispose(): void;
    /**
     * Lay out one call and answer the ctx address.
     *
     * The rows arrive packed — every query's, back to back, in query order —
     * because the caller wrote them there as it walked. `offsets[k]`/`counts[k]`
     * locate the k-th Query's; `resources[j]` is the j-th Res. One `set` copies
     * the block, where a row at a time was a word at a time (bench/aot-frame).
     */
    build(rows: Uint32Array, rowWords: number, offsets: Uint32Array, counts: Uint32Array, resources: readonly number[]): number;
    /** What the call appended. Valid until the next `build`. */
    commands(): AotCommand[];
    /**
     * What the call SENT: each record is a writer slot then its fields, in the
     * order the manifest declares. Valid until the next `build`.
     */
    events(): {
        slot: number;
        fields: readonly number[];
    }[];
    /** How long one writer's record is, set by the caller before the call. */
    setRecordLengths(lengths: readonly number[]): void;
    private lengthOf_;
    private lengths_;
    private countAt_;
    private cmdAt_;
    private evCountAt_;
    private evBufAt_;
    private address_;
    /** The ctx `build` last laid out. */
    get address(): number;
    private reserve_;
    /** The words of this arena, over whatever buffer the heap is in now. */
    private view_;
}

/**
 * @file    AotSystems.ts
 * @brief   The compiled twins a build produced, and how a system finds its own.
 *
 * @details When a twin is used is settled: the editor's preview always
 *          interprets, and AOT is a shipping mode. So the runner has one rule —
 *          call the twin if there IS one — and the decision lives in who
 *          installs, which is the build, once, at load.
 *
 *          Installing verifies the handshake first. A module whose
 *          contract hash disagrees is REFUSED, not warned about: mismatched
 *          offsets do not produce an error, they produce a read of a different
 *          field.
 */

/** One system's declaration, as the build wrote it beside the module. */
interface AotSystemDecl {
    readonly name: string;
    readonly symbol: string;
    /** One entry per declared Query, in the order the system names them. */
    readonly queries: readonly (readonly {
        comp: string;
        mut: boolean;
    }[])[];
    /** One per declared Res/ResMut. `mut` is what makes a host write the mirror
     *  back after the call — without it the write is silently dropped. */
    readonly resources: readonly {
        name: string;
        mut: boolean;
        fields?: readonly string[];
    }[];
    /**
     * Event readers, and the query slot each one's payloads go into. `fields`
     * is the payload's layout, in the order the compiled code reads it — the
     * host flattens an object into exactly that order or the code reads a
     * different field.
     */
    readonly readers?: readonly {
        slot: number;
        event: string;
        fields: readonly string[];
    }[];
    /** Event writers, by the slot the appended record names. */
    readonly writers?: readonly {
        slot: number;
        event: string;
        fields: readonly string[];
    }[];
    /**
     * Whether the body appends a COMMAND record. From the body rather than the
     * declaration: taking `Commands()` and never despawning writes nothing.
     * Absent is a manifest older than this field — read it as `true`, because
     * the road that cannot flush them fails silently.
     */
    readonly commands?: boolean;
}
/**
 * What a road knows that the manifest cannot say for itself. Each answer comes
 * from the RUNTIME, never from the manifest: a manifest compared against itself
 * always agrees.
 */
interface InstallOptions {
    /** The fields this runtime's copy of a resource has, in ITS order, or
     *  undefined when there is no such resource. */
    readonly resourceFields?: (name: string) => readonly string[] | undefined;
    /** The fields this runtime's copy of an event payload has, in ITS order.
     *  Undefined is "cannot say" — an event declared without a payload value. */
    readonly eventFields?: (name: string) => readonly string[] | undefined;
    /** `sizeof(es_addr_t)` where this module will run: 4 in a wasm module
     *  addressing the engine's memory by offset, 8 in a library the host
     *  loaded into its own process. */
    readonly addressBytes?: 4 | 8;
    /** Which declarations become twins. The handshake is still checked over the
     *  WHOLE manifest, because that is what the module is. Default: all. */
    readonly runs?: (name: string) => boolean;
    /** What the ARTIFACT says it was built as, or null where this road cannot
     *  ask it. Two builds over one engine and one project agree on both digests
     *  while declaring different queries, mut flags and event payloads. */
    readonly moduleContract?: string | null;
}
interface AotManifest {
    /** The engine the module was built against (EHT offsets, resource shapes,
     *  struct sizes, address width). */
    readonly engineAbi: string;
    /** The project's own component shapes, scoped to the ones it names. */
    readonly projectShapes: string;
    /**
     * Which BUILD this sidecar belongs to. The artifact bakes the same number,
     * so the two can be asked the question neither digest above answers: are
     * these halves from one run? Optional only for a module built before it
     * existed, which a loader treats as unpaired rather than as paired.
     */
    readonly moduleContract?: string;
    readonly systems: readonly AotSystemDecl[];
}
/** A twin, resolved: its declaration and the function that runs it. */
interface AotTwin {
    readonly decl: AotSystemDecl;
    readonly call: (ctx: number) => void;
    /** The components this system may write, for the Changed bookkeeping the
     *  compiled code cannot do — it never calls back. */
    readonly mutated: readonly (readonly AnyComponentDef[])[];
}
/**
 * The twins available to a world. Empty in the editor and in dev, which is why
 * dispatch needs no mode flag: there is simply nothing to find.
 */
declare class AotSystems {
    private readonly byName;
    private calls_;
    get size(): number;
    /** The systems a module supplied twins for. Install is all-or-nothing. */
    names(): readonly string[];
    /**
     * How many times a twin has been called. Installed is not the same question
     * as ran: a differential cannot tell them apart, because the closure that
     * would have run produces the same numbers.
     */
    get calls(): number;
    /** Counted by the runner, which is the only thing that dispatches. */
    noteCall(): void;
    /**
     * Take a built module, after checking what it baked in against what is here.
     *
     * `resolve` turns a component NAME into the definition this world uses,
     * because the manifest carries names — a build cannot know a runtime's ids.
     * It is also how the project digest is recomputed: the shapes the module
     * named, as this runtime has them now.
     */
    install(manifest: AotManifest, exports: Readonly<Record<string, unknown>>, resolve: (name: string) => AnyComponentDef | undefined, opts?: InstallOptions): void;
    get(name: string): AotTwin | undefined;
    clear(): void;
}

/**
 * @file    AotRuntime.ts
 * @brief   What the runner needs to call a twin instead of a closure.
 *
 * @details Three things, and no more: which twins exist, what the manifest's
 *          names mean here, and one arena to lay a call out in.
 *
 *          A COMPONENT's address is deliberately absent: `AotDispatch` asks the
 *          world for a resolver once per system and calls it per row, and a
 *          second door onto the same fact is a second thing to keep true.
 *          A resource's is here because a resource has no address of its own
 *          until something mirrors it, and that something is per world.
 */

/** Where the bytes are, in the memory the compiled code reads. */
interface AotAddresses {
    /**
     * The named resource's bytes, ready for THIS call. A resource is a host
     * record with no address of its own, so an implementation mirrors it — and
     * doing that per call rather than per row is why it is one call.
     */
    resourceAt(name: string): number | undefined;
    /** Copy the mirror back, for a resource the system declared `ResMut`. */
    resourceWriteBack(name: string): void;
    /**
     * This frame's payloads of `event`, as rows: one per payload, each carrying
     * the address of a block laid out in `fields` order. Entity-less, because
     * an event is not carried by one.
     */
    payloadRows(event: string, fields: readonly string[]): readonly (readonly number[])[];
    /** Deliver one payload the compiled code appended, rebuilt from `fields`. */
    sendEvent(event: string, fields: readonly string[], values: readonly number[]): void;
    /** Hand back the blocks `payloadRows` took; they outlive no call. */
    releasePayloads(): void;
    /** The definition a manifest's component NAME refers to in this world. */
    componentNamed(name: string): AnyComponentDef | undefined;
}
/**
 * One twin's frame, whoever lays the rows out.
 *
 * A wasm module shares the engine's memory, so they go HERE and the call takes
 * their address. A host loading a library has 64-bit addresses nothing here can
 * hold, so it packs them itself and takes only which system to run.
 */
interface AotDispatcher {
    /**
     * True when the twin RAN. False is the no-cliff rule arriving where it can
     * still be honoured: a host that cannot yet name every component of a system
     * has not failed, it has not taken this one, and the interpreter keeps it.
     */
    run(twin: AotTwin): boolean;
}
/**
 * Installed by a shipping build, absent everywhere else. That absence is the
 * whole of the mode policy: with no twins there is nothing to dispatch to, so
 * the editor and dev builds need no flag and take no branch worth measuring.
 */
interface AotRuntime {
    /** Retire dispatch and release its owned arenas/mirrors. Idempotent. */
    dispose?(): void;
    readonly systems: AotSystems;
    readonly addresses: AotAddresses;
    readonly ctx: AotContext;
    /**
     * How this runtime's twins are called, for the world that will call them.
     * The runtime decides, because it is what knows where the rows can live —
     * the runner asking would be the runner knowing which host it is on.
     */
    dispatcherFor(world: World): AotDispatcher;
}

/**
 * @file    system.ts
 * @brief   System definition and scheduling
 */

/**
 * When in a frame a system runs, in the order listed; `Startup` runs once before
 * the first frame. The `Fixed*` three are the simulation's cadence, running zero
 * or more times per frame as `Time.fixedDelta` accumulates — where anything that
 * must be deterministic belongs.
 *
 * @public
 */
declare enum Schedule {
    Startup = 0,
    First = 1,
    PreUpdate = 2,
    Update = 3,
    PostUpdate = 4,
    Last = 5,
    FixedPreUpdate = 10,
    FixedUpdate = 11,
    FixedPostUpdate = 12
}
/**
 * A request for the {@link World} itself, as {@link GetWorld} returns it — the
 * escape hatch for work the declared parameters cannot express.
 *
 * @public
 */
interface GetWorldDescriptor {
    /** @internal */
    readonly _type: 'get_world';
}
/**
 * Ask a system for the {@link World} itself. The escape hatch: it declares no
 * access, so the scheduler cannot see what the system touches and the query cache
 * cannot serve it. Reach for `Query`/`Res`/`Commands` first.
 *
 * @public
 */
declare function GetWorld(): GetWorldDescriptor;
/**
 * Anything that may appear in a system's parameter list — what {@link Query},
 * {@link Res}, {@link Commands} and their siblings return. Each is a request for
 * access, resolved to a live value by {@link InferParams} when the system runs.
 *
 * @public
 */
type SystemParam = QueryDescriptor<readonly QueryArg[]> | ResDescriptor<unknown> | ResMutDescriptor<unknown> | CommandsDescriptor | EventWriterDescriptor<unknown> | EventReaderDescriptor<unknown> | RemovedQueryDescriptor<AnyComponentDef> | GetWorldDescriptor;
/**
 * One parameter's declaration resolved to the value a system body receives.
 * {@link InferParams} maps this over a whole list; a request this does not
 * recognise resolves to `never`, which is what makes a bad parameter a type
 * error at the definition rather than a surprise at the call.
 *
 * @public
 */
type InferParam<P> = P extends QueryDescriptor<infer C> ? QueryInstance<C> : P extends ResDescriptor<infer T> ? T : P extends ResMutDescriptor<infer T> ? ResMutInstance<T> : P extends CommandsDescriptor ? CommandsInstance : P extends EventWriterDescriptor<infer T> ? EventWriterInstance<T> : P extends EventReaderDescriptor<infer T> ? EventReaderInstance<T> : P extends RemovedQueryDescriptor<infer _T> ? RemovedQueryInstance<_T> : P extends GetWorldDescriptor ? World : never;
/**
 * The values a system body receives, derived from the parameters it declared —
 * a `Query(...)` becomes a `QueryInstance`, a `Res(X)` becomes the resource
 * value. Inferred, so a system body's arguments are typed without annotation.
 *
 * @public
 */
type InferParams<P extends readonly SystemParam[]> = {
    [K in keyof P]: InferParam<P[K]>;
};
/**
 * Predicate evaluated per-frame; returning false skips the system for that tick.
 * It is asked once per schedule run, so a set of nine systems gated on one pause
 * flag reads it once and either all nine run or none do.
 *
 * @public
 */
type RunCondition = () => boolean;
/**
 * A declared system, as {@link defineSystem} returns it. Opaque: hand it to
 * `addSystem`, a {@link SystemSet} or a schedule rather than reading it — every
 * member is engine plumbing and may change.
 *
 * @public
 */
interface SystemDef {
    /** @internal */
    readonly _id: symbol;
    /** @internal */
    readonly _params: readonly SystemParam[];
    /** @internal */
    readonly _fn: (...args: never[]) => void | Promise<void>;
    /** @internal */
    readonly _name: string;
    /** @internal */
    readonly _runBefore?: readonly string[];
    /** @internal */
    readonly _runAfter?: readonly string[];
    /** @internal */
    readonly _runWhenPaused?: boolean;
    /** @internal */
    readonly _touches?: SystemTouches | (() => SystemTouches);
}
/**
 * Scheduling policy a system carries with it. Names are matched against other
 * systems' names and against {@link SystemSet} names, so a set can be ordered
 * against without knowing which systems are in it.
 *
 * @public
 */
interface SystemOptions {
    /** Name other systems reference in their ordering edges. */
    name?: string;
    /** This system runs before each of these names (a system or a set). */
    runBefore?: string[];
    /** This system runs after each of these names (a system or a set). */
    runAfter?: string[];
    /** Opt into paused First/PreUpdate/Update/PostUpdate frames. Last already runs; fixed steps stay stopped. */
    runWhenPaused?: boolean;
    /**
     * What the system reaches for through {@link GetWorld}. See {@link SystemTouches}.
     *
     * A function is re-read every time the access is, which is what lets a system
     * running authored data (an FSM, a behaviour tree) answer from the data
     * actually loaded rather than from everything it could ever be handed.
     */
    touches?: SystemTouches | (() => SystemTouches);
}
/**
 * What a system reaches for outside its declared parameters — a {@link GetWorld}
 * user's claim about the escape hatch, without which the scheduler assumes it
 * touches everything. By component NAME: the reason to reach through the World
 * is usually a type registered later than the system.
 *
 * @public
 */
interface SystemTouches {
    reads?: readonly string[];
    writes?: readonly string[];
    /**
     * Some of the reach genuinely cannot be named — a system running data a
     * project authored, where one of the leaves does not say what it writes.
     * Declared rather than left out: an omitted `touches` and a known-incomplete
     * one are both "assume everything", but only this one says so on purpose.
     */
    opaque?: boolean;
}
/**
 * Declare a system: what it reads and writes, and the function to run.
 *
 * Ordering declared here travels with the definition, so it applies wherever
 * the system is registered — including the top-level {@link addSystem}, which
 * takes no options of its own. Edges given again at the registration site (or
 * on the enclosing {@link SystemSet}) are added to these, not replaced.
 *
 * @public
 */
declare function defineSystem<P extends readonly SystemParam[]>(params: [...P], fn: (...args: InferParams<P>) => void | Promise<void>, options?: SystemOptions): SystemDef;
/**
 * A named group of systems. When registered via `App.addSystemSet`, every
 * member gets the set's `runIf` and its `runBefore` / `runAfter` edges — the
 * group's ordering written once instead of per system. Other
 * systems or sets may also reference the set's *name* in their own edges; the
 * scheduler expands such a reference to every member of the set.
 *
 * Build one with {@link defineSystemSet}; the underscore-prefixed fields are
 * the scheduler's, not an authoring surface.
 *
 * @public
 */
interface SystemSet {
    /** @internal */
    readonly _kind: 'set';
    /** @internal */
    readonly _name: string;
    /** @internal */
    readonly _systems: readonly SystemDef[];
    /** @internal */
    readonly _runIf?: RunCondition;
    /** @internal */
    readonly _runBefore?: readonly string[];
    /** @internal */
    readonly _runAfter?: readonly string[];
}
/**
 * What a {@link SystemSet} is built out of. `systems` keeps the order it is
 * written in; `runIf` and the two edge lists apply to every member.
 *
 * @public
 */
interface SystemSetOptions {
    /** Systems contained in the set. */
    systems: SystemDef[];
    /** Predicate checked per-frame; false skips every member. */
    runIf?: RunCondition;
    /** Member systems run before each of these names (may reference a set). */
    runBefore?: string[];
    /** Member systems run after each of these names (may reference a set). */
    runAfter?: string[];
}
/**
 * Group systems under one name so ordering and run conditions are written once.
 *
 * ```ts
 * const physics = defineSystemSet('physics', {
 *     systems: [applyForces, integrateVelocity],
 *     runBefore: ['render'],
 *     runIf: () => !paused,
 * });
 * app.addSystemSetToSchedule(Schedule.FixedUpdate, physics);
 * ```
 *
 * Members keep the order they are listed in; anything constraining `'physics'`
 * constrains all of them.
 *
 * @public
 */
declare function defineSystemSet(name: string, options: SystemSetOptions): SystemSet;
declare function addSystem(system: SystemDef): void;
/**
 * Register a system to run once, before the first frame — where a project spawns
 * its world. Startup runs after the engine's own startup, so the components and
 * resources a system asks for are there.
 *
 * @public
 */
declare function addStartupSystem(system: SystemDef): void;
/**
 * Register a system in a {@link Schedule}. This is how a project bundle's
 * systems reach the loop: the call records them, and the app drains what was
 * recorded when it starts, so module-level registration works before an `App`
 * exists.
 *
 * @public
 */
declare function addSystemToSchedule(schedule: Schedule, system: SystemDef): void;
/**
 * Register a {@link SystemSet} from a project bundle, the module-level twin of
 * `App.addSystemSetToSchedule`. Without it a project can define a set — the run
 * condition a pause is written as — and have no door to register it through.
 *
 * @public
 */
declare function addSystemSetToSchedule(schedule: Schedule, set: SystemSet): void;
declare class SystemRunner {
    private readonly world_;
    private readonly resources_;
    private readonly eventRegistry_;
    private readonly argsCache_;
    private readonly systemTicks_;
    private readonly systemChangeSequences_;
    private readonly queryCache_;
    private readonly removedCache_;
    private currentLastRunTick_;
    private timings_;
    private queryCosts_;
    /**
     * Compiled twins, when a shipping build installed them. Absent in the editor
     * and in dev, which is the whole of the mode policy — with nothing installed
     * there is nothing to dispatch to.
     */
    private aot_;
    /** The compiled half of this runner: everything a twin needs around its
     *  call, from whichever side of the contract can lay the rows out. */
    private aotDispatch_;
    constructor(world: World, resources: ResourceStorage, eventRegistry?: EventRegistry);
    /** @internal Install the twins a build produced. */
    useAot(runtime: AotRuntime | null): void;
    setTimingEnabled(enabled: boolean): void;
    getTimings(): ReadonlyMap<string, number> | null;
    /**
     * Per-system query cost for the frame: what each system's queries walked, and
     * how much of that a change filter then discarded. This is what turns "7ms"
     * into "7ms over 18,400 entities, none of which had changed".
     */
    getQueryCosts(): ReadonlyMap<string, QueryCost> | null;
    /** @brief Clear timing data for the current frame */
    clearTimings(): void;
    /** @brief Remove cached state for a single system */
    evict(systemId: symbol): void;
    /** @brief Clear all cached state */
    reset(): void;
    run(system: SystemDef): void | Promise<void>;
    /**
     * A compiled system's frame: the dispatcher does the contract, this keeps the
     * scheduler's own books — what it cost, and when it last ran.
     */
    private runCompiled_;
    private flushSystem_;
    private harvestQueryCost_;
    private resolveParam;
}

/**
 * @file    WasmPoolMemory.ts
 * @brief   Component rows on the engine's wasm heap, where compiled code is.
 *
 * @details A compiled system runs inside the engine's module and reads memory by
 *          offset. Rows on the JS heap are as unreachable to it as the objects
 *          they replaced, so on web they come from `_malloc` instead — one
 *          linear memory, one set of offsets, and `ScriptPool.address` is
 *          already the address the compiled code wants.
 *
 *          The trap is growth: `_malloc` may grow the heap, and growing DETACHES
 *          every ArrayBuffer view of it. The bytes survive at the same offsets —
 *          it is the same linear memory — but a held `Float64Array` stops
 *          working, silently returning undefined rather than throwing. So a
 *          block is identified by its OFFSET and the buffer is fetched fresh,
 *          which is the same thing emscripten does for its own HEAP views.
 */

/** What this needs of the engine module: an allocator and its heap. */
interface WasmHeap {
    readonly allocatorIdentity?: object;
    _malloc(size: number): number;
    _free(ptr: number): void;
    /** The live view. Emscripten replaces this object when the heap grows. */
    readonly HEAPU8: Uint8Array;
}

/**
 * @file    installAot.ts
 * @brief   Take a built module and let the scheduler call it.
 *
 * @details The one entry point a shipping runtime needs: instantiate the wasm a
 *          build produced, check what it baked in, and hand the runner the twins.
 *          Everything it assembles has been tested on its own — this is the
 *          wiring that was waiting for the handshake to be decided.
 *
 *          The module IMPORTS the engine's memory, so there is nothing to link
 *          and no engine change: it reads the components where they already
 *          are.
 *
 *          Refuses rather than degrades. A module built for other offsets does
 *          not produce a wrong answer, it produces a read of a different field,
 *          and a runtime that fell back to the interpreter on a mismatch would
 *          hide exactly the thing worth knowing.
 */

/**
 * The engine module a compiled system shares memory with. The Memory OBJECT,
 * which the module imports as `env.memory`: a HEAP view's buffer is an
 * ArrayBuffer and cannot be imported.
 */
type AotHost = WasmHeap & {
    readonly memory: WebAssembly.Memory;
};

/**
 * @file    blend.ts
 * @brief   Blend mode definitions for rendering
 */
/**
 * Mirrors the engine's `BlendMode` (src/esengine/renderer/draw/BlendMode.hpp) — the
 * values are serialized into material assets, so they are fixed.
 */
declare enum BlendMode {
    /** SrcAlpha, OneMinusSrcAlpha — the default. */
    Normal = 0,
    /** SrcAlpha, One — glow, particles. */
    Additive = 1,
    /** DstColor, OneMinusSrcAlpha — shadows, multiply. */
    Multiply = 2,
    /** One, OneMinusSrcColor — lighten. */
    Screen = 3,
    /** One, OneMinusSrcAlpha — for premultiplied-alpha sources. */
    PremultipliedAlpha = 4,
    /** One, One — additive with a premultiplied-alpha source. */
    PmaAdditive = 5,
    /** Takes the brighter pixel (GL_MAX). */
    Lighten = 6,
    /** Takes the darker pixel (GL_MIN). */
    Darken = 7,
    /** Screen on light, Multiply on dark; requires shader support. */
    Overlay = 8,
    /**
     * No blending — the source replaces the destination. An opaque sprite pays
     * nothing to read the destination it would ignore, and this is the only mode
     * a draw may write depth in, since a blended one must stay in painter's order.
     */
    None = 9
}

/**
 * @file    material.ts
 * @brief   Material and Shader API for custom rendering
 * @details Provides shader creation and material management for custom visual effects.
 */

type ShaderHandle = number;
type MaterialHandle = number;
interface TextureRef {
    __textureRef: true;
    /** ResourceManager texture handle, resolved to a device texture at draw time. */
    textureId: number;
    slot?: number;
}
type UniformValue = number | Vec2 | Vec3 | Vec4 | number[] | TextureRef;
declare function isTextureRef(v: UniformValue): v is TextureRef;
/** Triangle culling mode; mirrors the engine's CullMode. */
declare enum CullMode {
    None = 0,
    Back = 1,
    Front = 2
}
interface MaterialOptions {
    shader: ShaderHandle;
    uniforms?: Record<string, UniformValue>;
    blendMode?: BlendMode;
    depthTest?: boolean;
    depthWrite?: boolean;
    cull?: CullMode;
    /** Depth-buffer units toward the eye — the only way to say which of two
     *  COPLANAR surfaces wins (a decal on a wall). 0 leaves it where it is. */
    depthBias?: number;
    /** Enabled static switches (#pragma switch) for the record; the shader permutation is
     *  chosen at compile time (see Material.compileShader). Stored for inspection/serialization. */
    switches?: Record<string, boolean>;
}
/** The `version` a `.esmaterial` this build writes carries, named the way its
 *  sibling formats name theirs. */
declare const MATERIAL_FORMAT_VERSION = "1.0";
interface MaterialAssetData {
    version: string;
    type: 'material';
    shader: string;
    blendMode?: number;
    depthTest?: boolean;
    depthWrite?: boolean;
    cull?: number;
    depthBias?: number;
    /**
     * Parent material asset ref — present on a material instance (UE MaterialInstanceConstant).
     * The shader and any non-overridden render state are inherited from the parent; `shader`
     * is then ignored and `properties` carries only the overridden parameters (the diff).
     */
    instanceOf?: string;
    /** Enabled static switches (#pragma switch) — selects the shader permutation at load. */
    switches?: Record<string, boolean>;
    properties: Record<string, unknown>;
}
interface MaterialData {
    shader: ShaderHandle;
    uniforms: Map<string, UniformValue>;
    blendMode: BlendMode;
    depthTest: boolean;
    depthWrite: boolean;
    cull: CullMode;
    /** Depth-buffer units toward the eye — the only way to say which of two
     *  COPLANAR surfaces wins (a decal on a wall). 0 leaves it where it is. */
    depthBias: number;
    /** Enabled static switches (the shader permutation was chosen for these at compile time). */
    switches: Record<string, boolean>;
    /**
     * Instance parenting (UE MaterialInstanceConstant): when set, this material inherits the
     * parent's shader + render state + params, and only its own diffs are stored — `uniforms`
     * holds just the overridden params, and `overrides` names the overridden render-state
     * fields. Undefined on a base material.
     */
    parent?: MaterialHandle;
    /** The permutation an instance switched to for itself; an instance otherwise draws with its parent's shader. */
    ownShader?: ShaderHandle;
    overrides: Set<string>;
    dirty_: boolean;
    cachedBuffer_: Float32Array | null;
    cachedIdx_: number;
    /** What the engine's store holds for each non-texture uniform of this material, as [arity, x, y, z, w]: what was last SENT, not what the caller's
     *  object says now (a caller may reuse and edit one object), which is what lets a write of the number already there be a no-op. */
    sent_?: Map<string, number[]>;
    /** The whole material has been defined and pushed once, so the engine holds the rest of it and one changed value may go alone. */
    pushed_?: boolean;
}
type TextureLease = AssetLease<{
    handle: number;
}>;
declare function shutdownMaterialAPI(): void;
interface ResolvedMaterial {
    shader: ShaderHandle;
    blendMode: BlendMode;
    depthTest: boolean;
    depthWrite: boolean;
    cull: CullMode;
    depthBias: number;
    uniforms: Map<string, UniformValue>;
}
declare const Material: {
    /**
     * Creates a shader from vertex and fragment source code.
     * @param vertexSrc GLSL vertex shader source
     * @param fragmentSrc GLSL fragment shader source
     * @returns Shader handle, or 0 on failure
     */
    createShader(vertexSrc: string, fragmentSrc: string): ShaderHandle;
    /**
     * Releases a shader.
     * @param shader Shader handle to release
     */
    releaseShader(shader: ShaderHandle): void;
    /**
     * Creates a material with a shader and optional settings.
     * @param options Material creation options
     * @returns Material handle
     */
    create(options: MaterialOptions): MaterialHandle;
    /**
     * Compiles a `.esshader` material shader through the engine's ShaderParser, which
     * generates the std140 MaterialConstants block from its `#pragma param` declarations and
     * registers the param layout. Use this (not createShader) for materials whose parameters
     * should reach the GPU. Returns a shader handle, or 0 on failure.
     */
    compileShader(esshaderSource: string, features?: string[]): ShaderHandle;
    /**
     * Every live material whose shader declares `param`: what a value that belongs to the whole scene (the weather's wind) is written to, without
     * asking each sprite which material it wears.
     */
    materialsDeclaring(param: string): MaterialHandle[];
    /**
     * Record what a compiled permutation was made from: the source's switches and how to compile it under others. The asset loader says so for
     * every shader it compiles, which is what lets `recompile` answer for a material that only holds the handle.
     */
    noteProgram(shader: ShaderHandle, features: readonly string[], esshaderSource: string, compile: (features: string[]) => ShaderHandle): void;
    /**
     * Switch a material to the permutation of its own shader source that has `changes` applied: a switch the shader does not declare is left out
     * (a project's macro the effect never branched on), and the material takes the permutation at once, with its parameters and textures
     * carried over. A material that inherits (an instance) switches for itself and leaves its parent as it is. Answers whether the shader changed.
     */
    recompile(material: MaterialHandle, changes: Record<string, boolean>): boolean;
    /** Gets an enabled static switch (false when unset). */
    getSwitch(material: MaterialHandle, name: string): boolean;
    /** Sets a static switch on the record. The shader permutation is chosen at compile time,
     *  so a change takes effect when the material's shader is next (re)compiled — callers that
     *  need it live recompile the shader with the new switch set. */
    setSwitch(material: MaterialHandle, name: string, on: boolean): void;
    /**
     * Gets material data by handle.
     * @param material Material handle
     * @returns Material data or undefined
     */
    get(material: MaterialHandle): MaterialData | undefined;
    /** Effective shader/render state without allocating or cloning uniform maps. */
    getRenderState(material: MaterialHandle): Omit<ResolvedMaterial, "uniforms"> | null;
    /**
     * Replace the complete local parameter/render-state snapshot and flush once.
     * Missing fields restore base defaults or remove an instance override, so
     * future parent edits keep propagating. Shader and parent ownership stay with
     * the asset loader; this operation never re-acquires a different generation.
     * When supplied, textureLeases transfers ownership of the complete edited
     * texture set. Receipts remain held until replacement, Reset or material release.
     */
    applyState(material: MaterialHandle, state: Omit<MaterialOptions, "shader">, textureLeases?: ReadonlyMap<string, TextureLease>): void;
    /**
     * Sets a uniform value on a material.
     * @param material Material handle
     * @param name Uniform name
     * @param value Uniform value
     */
    setUniform(material: MaterialHandle, name: string, value: UniformValue): void;
    /**
     * Gets a uniform value from a material.
     * @param material Material handle
     * @param name Uniform name
     * @returns Uniform value or undefined
     */
    getUniform(material: MaterialHandle, name: string): UniformValue | undefined;
    /**
     * Sets the blend mode for a material.
     * @param material Material handle
     * @param mode Blend mode
     */
    setBlendMode(material: MaterialHandle, mode: BlendMode): void;
    /**
     * Gets the blend mode of a material.
     * @param material Material handle
     * @returns Blend mode
     */
    getBlendMode(material: MaterialHandle): BlendMode;
    /**
     * Sets depth test enabled for a material.
     * @param material Material handle
     * @param enabled Whether depth test is enabled
     */
    setDepthTest(material: MaterialHandle, enabled: boolean): void;
    /** Enables/disables depth writes (default on, matching the engine's 2D state). */
    setDepthWrite(material: MaterialHandle, enabled: boolean): void;
    /**
     * How far toward the eye this surface is pushed, in depth-buffer units —
     * what makes a decal win against the wall it is laid on. Negative is toward
     * the eye; 0 leaves the surface where its geometry puts it.
     */
    setDepthBias(material: MaterialHandle, units: number): void;
    /** Sets the triangle culling mode. */
    setCull(material: MaterialHandle, cull: CullMode): void;
    /**
     * Gets the shader handle for a material.
     * @param material Material handle
     * @returns Shader handle
     */
    getShader(material: MaterialHandle): ShaderHandle;
    /**
     * Releases a material (does not release the shader).
     * @param material Material handle
     */
    release(material: MaterialHandle): void;
    /**
     * Checks if a material exists.
     * @param material Material handle
     * @returns True if material exists
     */
    isValid(material: MaterialHandle): boolean;
    /**
     * Render a material offscreen at @p w×@p h and resolve with its pixels, through the real
     * viewport path, lit by one directional light. `shape.mesh` (a loaded mesh handle) draws it on
     * that geometry, seen off-axis and framed; without, a sprite shader samples `shape.texture` on
     * a flat quad. Null if the engine isn't ready or the readback fails.
     */
    renderPreview(material: MaterialHandle, w: number, h: number, shape?: {
        mesh?: number;
        texture?: number;
    }): Promise<ImageData | null>;
    releaseAll(): void;
    /**
     * Creates a material from asset data. When @p parentHandle is given (the asset's
     * `instanceOf` resolved to a loaded parent), builds a Material Instance carrying only the
     * asset's overrides — `properties` and any present render-state fields. Otherwise builds a
     * base material on @p shaderHandle.
     */
    createFromAsset(data: MaterialAssetData, shaderHandle: ShaderHandle, parentHandle?: MaterialHandle): MaterialHandle;
    /**
     * Creates a material instance (UE MaterialInstanceConstant): it inherits @p source's
     * shader, render state and parameters, and stores only the diffs you later set on it.
     * Editing the parent propagates to every non-overriding instance. Use this for cheap
     * variants ("the same material, but red") instead of duplicating the whole material.
     * @param source Parent material (a base material or another instance)
     * @returns New instance handle
     */
    createInstance(source: MaterialHandle): MaterialHandle;
    /**
     * Exports material to serializable asset data.
     * @param material Material handle
     * @param shaderPath Shader file path for asset reference
     * @returns Material asset data
     */
    toAssetData(material: MaterialHandle, shaderPath: string, parentPath?: string): MaterialAssetData | null;
    /**
     * Gets all uniforms from a material.
     * @param material Material handle
     * @returns Map of uniform names to values
     */
    getUniforms(material: MaterialHandle): Map<string, UniformValue>;
    tex(textureId: number, slot?: number): TextureRef;
};
/**
 * Built-in ES 3.0 shader sources for SDK custom materials.
 * These use the batch renderer vertex layout (vec3 position + vec4 color + vec2 texCoord)
 * and are NOT duplicates of the .esshader files (which are ES 1.0 with different layouts).
 */
declare const ShaderSources: {
    SPRITE_VERTEX: string;
    SPRITE_FRAGMENT: string;
    COLOR_VERTEX: string;
    COLOR_FRAGMENT: string;
};

interface PassConfig {
    name: string;
    shader: ShaderHandle;
    enabled: boolean;
    floatUniforms: Map<string, number>;
    vec4Uniforms: Map<string, Vec4>;
    /** Effect-declared textures (LUTs, masks): sampler uniform -> SDK texture handle. */
    textureUniforms: Map<string, number>;
    /**
     * Fraction of the chain size this pass draws at. 1 is every pass that has
     * ever existed here; a fraction is for an effect whose result is smooth
     * enough to compute small and read back big (SSAO's occlusion term).
     */
    scale: number;
    /** A later pass of a multi-pass effect: its composite reads the input the
     *  effect started from rather than the pass before it. */
    continuesEffect: boolean;
    /** Set for a compute pass: it has no `shader`, and the engine dispatches this WGSL over the picture instead. */
    compute?: ComputePassSource;
    /** Set for a pass the engine implements itself ("voxelGI"): it has no `shader`, and the engine declares its own passes. */
    native?: string;
}
/** What a compute pass runs: the WGSL, the names of its f32 params in the order its params block lists them, and its workgroup size. */
interface ComputePassSource {
    source: string;
    params: string[];
    workgroupSize: [number, number];
}
/**
 * Owns one App's post-process stacks, camera bindings, screen stack, and id
 * counter. A stack registers into the state it is created with — no global.
 * Held by {@link PostProcessAPI} (a per-App resource in B2b-3b).
 */
declare class PostProcessState {
    nextStackId: number;
    readonly stacks: Map<number, PostProcessStack>;
    readonly cameraBindings: Map<Entity, PostProcessStack>;
    screenStack: PostProcessStack | null;
    /** Create a stack owned by (and registered in) this state. */
    createStack(): PostProcessStack;
    reset(): void;
}
declare class PostProcessStack {
    readonly id: number;
    private readonly state_;
    private passes_;
    private destroyed_;
    private dirty_;
    private displayLut_;
    constructor(state: PostProcessState);
    addPass(name: string, shader: ShaderHandle, scale?: number, continuesEffect?: boolean): this;
    /** Adds a compute pass (see {@link ComputePassSource}). A device with no compute leaves it out of the chain. */
    addComputePass(name: string, compute: ComputePassSource): this;
    /** Adds a pass the engine implements itself, by kind. A device with no compute stage leaves it out of the chain. */
    addNativePass(name: string, kind: string): this;
    removePass(name: string): this;
    clearPasses(): this;
    /**
     * A graded look for the last pass: `texture` is a 1024x32 table (a 32-slice strip, slice along x being blue) read by the picture as the
     * display shows it, after the output transform, and `amount` how far the picture moves toward its answer (0 to 1). Part of the stack, as
     * its passes are: 0 for no table clears it.
     */
    setDisplayLut(texture: number, amount: number): this;
    get displayLut(): {
        readonly texture: number;
        readonly amount: number;
    };
    setEnabled(name: string, enabled: boolean): this;
    setUniform(passName: string, uniform: string, value: number): this;
    /** Binds a texture (SDK texture handle) to a pass's sampler uniform. */
    setTexture(passName: string, uniform: string, textureHandle: number): this;
    setUniformVec4(passName: string, uniform: string, value: Vec4): this;
    setAllPassesEnabled(enabled: boolean): void;
    get passCount(): number;
    get enabledPassCount(): number;
    get passes(): readonly PassConfig[];
    get isDirty(): boolean;
    clearDirty(): void;
    get isDestroyed(): boolean;
    destroy(): void;
}

/**
 * The format one frame committed its intermediates to. @experimental
 *
 * `fellBack` is `requested !== effective`, stated so a reader does not have to
 * compare two strings to learn whether anything gave way — and `linear` is what
 * separates a granted ask from no ask at all, which the pair alone cannot say.
 */
interface HdrFormat {
    requested: string;
    effective: string;
    /** Why they differ; `none` when they do not. */
    reason: string;
    /** Whether the project asked for a linear pipeline this frame. */
    linear: boolean;
    fellBack: boolean;
}
/**
 * Per-App post-process API. Owns this App's `state` (stacks, camera bindings,
 * screen stack) and drives the shared C++ post-process pipeline via the module.
 * The wasm-call methods are shared on the prototype; only `state` is per-App.
 *
 * B2b-3a: a single default instance is exported to keep call sites unchanged;
 * B2b-3b flips this to a per-App `defineResource` injected into the pipeline.
 */
/**
 * The curve a frame applies on its way to the display — the pipeline's, not an
 * effect a stack happens to hold, so it runs once and last. `none` leaves values
 * alone, which is the exact round trip flat content wants; `aces` maps radiance
 * above 1 down a filmic shoulder, which is what a lit 3D scene needs; `neutral`
 * (Khronos PBR Neutral) rolls highlights off while keeping hue and saturation, so a
 * sunlit red stays red where `aces` walks it toward cream.
 *
 * @experimental
 */
type OutputTransform = 'none' | 'aces' | 'neutral';
declare class PostProcessAPI {
    readonly state: PostProcessState;
    /** Volume-system bookkeeping (per-App): camera → the stack it created, and shared effect shaders. */
    readonly volumeStacks: Map<number, PostProcessStack>;
    readonly volumeShaders: Map<string, number>;
    /**
     * Which stack the engine's pass list currently holds, or null when it holds
     * none. Distinct from the stack's own dirty flag, which only tracks edits:
     * every camera ends by clearing the engine's passes, so a stack that was
     * pushed last frame and never edited must still be pushed again this frame.
     */
    private engineStack_;
    private qualityFilter_;
    setQualityFilter(profile: Readonly<QualityProfile> | null): void;
    /** How the quality level in force smooths edges: the volume system adds the temporal pass where it says `temporal`. */
    get antialiasing(): 'msaa' | 'temporal';
    /** Whether the quality level in force has the dynamic GI run its cheaper way: the volume system sets the effect's switches from it. */
    get dynamicGIReduced(): boolean;
    /**
     * Whether the quality level in force runs an effect, by its type. For a system that prepares something for an effect off the GPU (the dynamic GI
     * builds a distance field, a second of a phone's CPU): it asks before it does.
     */
    effectAllowed(type: string): boolean;
    private allowQualityPass_;
    get screenStack(): PostProcessStack | null;
    setScreenStack(stack: PostProcessStack | null): void;
    createStack(): PostProcessStack;
    bind(camera: Entity, stack: PostProcessStack): void;
    unbind(camera: Entity): void;
    getStack(camera: Entity): PostProcessStack | null;
    init(width: number, height: number): boolean;
    shutdown(): void;
    resize(width: number, height: number): void;
    isInitialized(): boolean;
    setBypass(bypass: boolean): void;
    /**
     * The curve the frame applies on its way to the display.
     *
     * Applied to whatever the chain produced, so it also engages the capture: a
     * project that asks for a curve gets one with an empty stack. See
     * {@link OutputTransform} for which to want.
     */
    setOutputTransform(transform: OutputTransform): void;
    /**
     * Multisampling the scene target should rasterise with; 1 turns it off. The
     * device clamps it, so this is the project's ASK, not what it gets — a
     * backend with no MSAA answers 1 whatever is set here.
     */
    setMsaaSamples(samples: number): void;
    /**
     * What the scene target is ACTUALLY multisampled at, and the most this
     * device can do. @experimental
     *
     * Two numbers because a request and a capability are different facts: asking
     * for 8 where the backend allows 1 is not a typo, and only saying both tells
     * those apart. `0` means nothing here can answer.
     */
    msaaCapability(): {
        effective: number;
        max: number;
    };
    /**
     * The format decision the last frame COMMITTED to. @experimental
     *
     * The frame's own answer, not the device asked again. `linear` false is a
     * project that never asked for HDR, which is not a fallback. The names come
     * from the engine — a second spelling of the enum's order is drift.
     */
    hdrFormat(): HdrFormat | null;
    begin(): void;
    end(): void;
    /** Say the frame needs a present when the rects alone cannot: a 1x letterbox
     *  and a split-screen viewport are the same geometry and differ only in intent. */
    setPresentRequired(required: boolean): void;
    setOutputViewport(x: number, y: number, w: number, h: number): void;
    _applyForCamera(camera: Entity): void;
    _resetAfterCamera(): void;
    _beginScreenCapture(): void;
    _endScreenCapture(): void;
    _applyScreenStack(): void;
    _executeScreenPasses(): void;
}
/**
 * Per-App post-process resource. Published + injected into the render pipeline
 * by `PostProcessPlugin`; read as `app.getResource(PostProcess)`.
 */
declare const PostProcess: ResourceDef<PostProcessAPI>;

/**
 * @file  Systems whose order nobody decided.
 *
 *        A schedule runs its systems in topological order, and for two systems
 *        with no edge between them that order falls out of registration and a
 *        depth-first walk. That is fine while they touch different data. When
 *        one writes what the other reads, the result depends on which happened
 *        to come first — so adding a third system, or moving a plugin in the
 *        build list, can change what the game does with nothing to point at.
 *
 *        Naming those pairs is also the prerequisite for ever running them at
 *        the same time: a pair that must not be reordered cannot be a batch.
 */

/** Two systems that touch the same data with nothing saying which goes first. */
interface Ambiguity {
    /** The two system names, in registration order. */
    a: string;
    b: string;
    /** The components and resources they disagree over. */
    over: string[];
}

interface ScreenOverlayData {
    /** False when nothing has a screen yet — no surface, no layout. */
    active: boolean;
    /** Layout-domain → clip. 16 floats, column-major, as a camera's is. */
    projection: Float32Array;
    /** The pixel rect of the surface this projection covers. */
    vpX: number;
    vpY: number;
    vpW: number;
    vpH: number;
    /** The whole surface, which is what a pointer's coordinates are flipped by. */
    surfaceW: number;
    surfaceH: number;
    /**
     * The pointer, in LAYOUT pixels — the domain a screen element's transform is
     * in, so a drag can subtract the two. Inverted through {@link projection} and
     * nothing else: a UI system reading the camera's world mouse instead draws in
     * the right place and answers a click somewhere else.
     */
    pointerX: number;
    pointerY: number;
    /**
     * Sorting layers this frame shows, as a bitmask — frame-level VISIBILITY
     * POLICY, assembled from the rendering cameras' masks and nothing else about
     * them. It does not make the overlay theirs: the projection, the viewport and
     * the order stay the screen's. With no camera it is every layer.
     */
    layerMask: number;
}
declare const ScreenOverlay: ResourceDef<ScreenOverlayData>;

/**
 * @file    presentPlan.ts
 * @brief   Where the scene is rendered, and where that image lands on the surface.
 *
 * A quad that scales itself can only clamp at its OWN texture's edge — the
 * neighbouring sprite is a different texture — so every boundary breaks and N
 * sprites give N candidate seams. Scaling one whole image has no interior
 * boundary to break, which is why these are two numbers and not one.
 *
 * The invariant every policy but {@link RenderResolution.Surface} holds:
 * `renderHeight === worldHeight`, so one world unit is one rendered pixel and
 * every sprite samples 1:1.
 *
 * NO IMPORTS, no engine state: a build tool and a test read this the same way the
 * render loop does.
 */
/** How the scene's own resolution is chosen. */
declare enum RenderResolution {
    /**
     * Render straight to the surface. Every sprite scales itself, so a
     * non-integer texel-to-pixel ratio shows a seam at every sprite boundary.
     * The behaviour every project had before this existed, and the default.
     */
    Surface = 0,
    /**
     * Render at the size the camera's world height asks for, then scale that
     * image to fill the surface. One uniform resample, no seams; slightly soft
     * at non-integer ratios.
     */
    Design = 1,
    /**
     * As {@link Design}, but the image is presented at a WHOLE multiple of its
     * own size. That rect IS the instruction — the engine reads whole-multiple-ness
     * off it and copies rather than interpolates, so nothing carries a second
     * answer. Costs black bars wherever a whole multiple does not fill the surface.
     */
    IntegerMultiple = 2
}

/**
 * One active touch, in screen pixels with y growing downward.
 *
 * @beta
 */
interface TouchPoint {
    id: number;
    x: number;
    y: number;
}
/**
 * Standard-mapping gamepad buttons (W3C "standard gamepad"). Positional names
 * (SDL / Steam Input convention) avoid device assumptions; Xbox / PlayStation
 * face labels are noted for reference.
 *
 * @public
 */
declare enum GamepadButton {
    South = 0,// A (Xbox) · Cross (PS)
    East = 1,// B · Circle
    West = 2,// X · Square
    North = 3,// Y · Triangle
    LeftBumper = 4,// LB · L1
    RightBumper = 5,// RB · R1
    LeftTrigger = 6,// LT · L2 (analog)
    RightTrigger = 7,// RT · R2 (analog)
    Back = 8,// View · Select / Share
    Start = 9,// Menu · Options
    LeftStick = 10,// L3 (stick click)
    RightStick = 11,// R3
    DpadUp = 12,
    DpadDown = 13,
    DpadLeft = 14,
    DpadRight = 15,
    Guide = 16
}
/** Standard-mapping gamepad axes (signed, [-1,1]).
 *  @public */
declare enum GamepadAxis {
    LeftX = 0,
    LeftY = 1,
    RightX = 2,
    RightY = 3
}
/** @internal Per-gamepad runtime state — current + previous frame, for edges. */
interface PadState {
    connected: boolean;
    buttons: number[];
    prevButtons: number[];
    axes: number[];
}
/**
 * This frame's raw input — the layer under {@link defineInputMap}'s named actions.
 *
 * `@beta`: per-frame touch state is reachable only as the raw `touches` /
 * `touchesStarted` / `touchesEnded` maps, so freezing it freezes two gaps in that
 * representation — no accessor for started/ended, and no write door at all.
 *
 * @beta
 */
declare class InputState {
    keysDown: Set<string>;
    keysPressed: Set<string>;
    keysReleased: Set<string>;
    mouseX: number;
    mouseY: number;
    /** How far the pointer moved this frame, summed over its events: what a locked pointer has instead of a position. Cleared at the end of the frame. */
    mouseDeltaX: number;
    mouseDeltaY: number;
    mouseButtons: Set<number>;
    mouseButtonsPressed: Set<number>;
    mouseButtonsReleased: Set<number>;
    scrollDeltaX: number;
    scrollDeltaY: number;
    /** Whether the device can be touched — asked of the platform, not of history. */
    touchAvailable: boolean;
    touches: Map<number, TouchPoint>;
    touchesStarted: Map<number, TouchPoint>;
    /** Fingers lifted this frame, at the position they lifted AT — a release is
     *  hit-tested where it happened, and the live `touches` no longer hold it. */
    touchesEnded: Map<number, TouchPoint>;
    keysPressedFixed: Set<string>;
    keysReleasedFixed: Set<string>;
    mouseButtonsPressedFixed: Set<number>;
    mouseButtonsReleasedFixed: Set<number>;
    private fixedContext_;
    isKeyDown(key: string): boolean;
    isKeyPressed(key: string): boolean;
    isKeyReleased(key: string): boolean;
    getMousePosition(): {
        x: number;
        y: number;
    };
    /** How far the pointer moved this frame. Zero where the host does not say (a mini game has no pointer to lock). */
    getMouseDelta(): {
        x: number;
        y: number;
    };
    isMouseButtonDown(button: number): boolean;
    isMouseButtonPressed(button: number): boolean;
    isMouseButtonReleased(button: number): boolean;
    /** Record a key-down. The pressed edge only fires on the transition, so a
     *  browser's auto-repeat keydown for a held key doesn't re-trigger it. */
    noteKeyDown(code: string): void;
    noteKeyUp(code: string): void;
    noteMouseDown(button: number): void;
    noteMouseUp(button: number): void;
    getScrollDelta(): {
        x: number;
        y: number;
    };
    getTouches(): TouchPoint[];
    getTouchCount(): number;
    getTouch(id: number): TouchPoint | null;
    isTouchActive(id: number): boolean;
    /** Fingers that went down this frame. */
    getTouchesStarted(): TouchPoint[];
    /** Fingers that came up this frame, at the position they came up at. */
    getTouchesEnded(): TouchPoint[];
    /** Retire a touch after a normal release, retaining its position and press edge. */
    endTouch(id: number): void;
    /**
     * Whether several fingers are handled at once. On (the default), every touch
     * reaches the UI and the game. Off, one finger at a time does: the first to
     * go down is the touch until it lifts, and a finger pressed meanwhile is
     * ignored for its whole life, by the UI and the game alike, so a second
     * finger cannot press a button or move a joystick under the first.
     */
    /** What the game set with {@link setMultiTouch}, or null to follow the project (RuntimeConfig.multiTouch). */
    private multiTouch_;
    /** Single-touch mode: the finger being handled, or null when none is down. */
    private soleTouch_;
    /** Single-touch mode: fingers ignored until they lift. */
    private ignoredTouches_;
    /** On unless the project turned it off (Project Settings → Runtime) or the game did. */
    isMultiTouchEnabled(): boolean;
    /**
     * Handle several fingers at once, or one. Turning it off while several are
     * down keeps the first that went down and cancels the rest, as the platform
     * cancelling them would: their touches end with no release edge, and a UI
     * control they were pressing lets go without a click.
     */
    setMultiTouch(enabled: boolean): void;
    /** @internal Whether a finger going down is handled; records it as the one in single-touch mode. */
    admitTouch(id: number): boolean;
    /** @internal Whether a finger's move, lift or cancel is ignored; a lift or cancel also retires it. */
    touchIgnored(id: number, retiring?: boolean): boolean;
    /** @internal Every finger is gone (focus lost, the app hidden). */
    forgetTouches(): void;
    /**
     * Named 2D values a game writes itself — an on-screen control, the only
     * input a touch device has. Named rather than a screen rectangle, so what
     * is touched and what is read stay one object when the layout moves.
     */
    private virtual_;
    private virtualSources_;
    /** Set a named virtual input; held until overwritten, so stopping means
     *  writing zero. `y` defaults to 0 for button/1D use. */
    setVirtual(id: string, x: number, y?: number): void;
    getVirtual(id: string): Vec2;
    /** A control owns only its contribution, even when several share a binding. */
    setVirtualSource(owner: object, id: string, x: number, y?: number): void;
    removeVirtualSource(owner: object): void;
    /** @internal Host cancellation releases managed controls, leaving manual values to their writer. */
    cancelVirtualSources(): void;
    /** Drop every virtual input — used when a control layer is torn down. */
    clearVirtual(): void;
    /** Per-index pad state; an index persists across disconnect so a reconnect resumes. */
    gamepads: Map<number, PadState>;
    /** Analog buttons (e.g. triggers) count as "down" at/above this value. */
    gamepadButtonThreshold: number;
    /** Axis magnitudes below this read as 0 (rest-position stick jitter). */
    gamepadDeadzone: number;
    /** Indices of currently-connected gamepads. */
    getGamepads(): number[];
    isGamepadConnected(pad?: number): boolean;
    isGamepadButtonDown(button: number, pad?: number): boolean;
    isGamepadButtonPressed(button: number, pad?: number): boolean;
    isGamepadButtonReleased(button: number, pad?: number): boolean;
    /** Raw analog value of a button in [0,1] (triggers; 0/1 for digital buttons). */
    getGamepadButtonValue(button: number, pad?: number): number;
    /** Signed axis value in [-1,1], with the deadzone applied. */
    getGamepadAxis(axis: number, pad?: number): number;
    private connectedPad_;
    /** True when the pointer is over an interactive UI element this frame (set each
     *  frame by the UI interaction system). Gameplay checks this to ignore input
     *  the UI handled — e.g. don't fire a weapon when clicking a HUD button.
     *  Unity's `EventSystem.IsPointerOverGameObject()` analog. */
    pointerOverUI: boolean;
    isPointerOverUI(): boolean;
    /** Ingest this frame's snapshots: shift current→prev (edge detection) then
     *  store new values. Pads absent from `snapshots` are marked disconnected. */
    /**
     * Pads supplied by the HOST rather than by the hardware — a test harness, a
     * driver, the editor's agent. They outrank the poll at the same index: the
     * poll runs every frame, so anything merely written into {@link gamepads}
     * is gone before a system reads it.
     *
     * @beta
     */
    injectGamepad(snapshot: GamepadSnapshot): void;
    /** Give an index (or all of them) back to the hardware. @beta */
    releaseGamepad(index?: number): void;
    private injected_;
    updateGamepads(snapshots: GamepadSnapshot[]): void;
    clearFrameState(): void;
    /** Enter a fixed-timestep step: keyboard/mouse edge queries now read the fixed
     *  mirrors. Called by App before each FixedUpdate step. */
    beginFixedStep(): void;
    /** Leave a fixed step: drop the consumed edges (so a later step this frame
     *  doesn't see them again) and restore the render context. Edges that arrived
     *  on a frame with no fixed step are never cleared here, so they survive to the
     *  next frame's first step instead of being lost. */
    endFixedStep(): void;
}
/**
 * This frame's raw input, as a resource. The input plugin writes it before any
 * game system runs, and clears the per-frame edges after the last one.
 *
 * @beta
 */
declare const Input: ResourceDef<InputState>;
/**
 * The callbacks a platform's raw events arrive through — routed past the UI
 * first, then recorded on `state`.
 *
 * Named and exported because the platform binding is not the only caller that
 * should exist. A harness driving a running game has to be able to deliver a
 * click, and the only faithful way to do that is through the same funnel the
 * real event uses: a synthetic DOM event carries no usable `offsetX`, and
 * poking `mouseX` and `mouseButtonsPressed` by hand skips the router, so UI
 * that should have swallowed the click never sees it and gameplay behind a
 * button reacts to presses the player never made.
 *
 * One implementation, so the injected event and the real one cannot diverge.
 */
declare function inputEventCallbacks(state: InputState): InputEventCallbacks;
declare class InputPlugin implements Plugin {
    name: string;
    private target_;
    private unbind_;
    private readonly executionCleanup_;
    constructor(target?: unknown);
    build(app: App): void;
    cleanup(app?: App): void;
}
declare const inputPlugin: InputPlugin;

/**
 * @file  renderDemand.ts
 * @brief Drawing only the frames that can look different: a still screen costs the game's logic and nothing else.
 *
 * A card table, a puzzle between moves, a menu: for most of a session such a game's picture does not change, and the GPU draws it sixty times a
 * second anyway, which is the heat and the battery. With render-on-demand on, a frame is drawn when
 *  - something asked for it ({@link RenderDemand.request}) or is holding the screen live ({@link RenderDemand.hold}: a tween, a video, a
 *    particle burst, anything the engine cannot see move on its own);
 *  - the player did something (a key, a button, a finger, the pointer moved, the wheel turned);
 *  - the surface changed size, or entities were created or destroyed;
 *  - shaders are still compiling in the background, which leaves draws out until they are ready.
 * and for `tailFrames` frames after the last of those, so what settles over a few frames (an exposure adapting, a blend finishing) does.
 *
 * What the engine does NOT see is a component's value changing by script or an animation playing: those are what `request` and `hold` are for.
 * That is why this is opt-in; a game that turns it on states which of its screens are still.
 */

/** @experimental */
interface RenderOnDemandOptions {
    /** Frames still drawn after the last reason to draw. Default 30: a half second, enough for an exposure or a fade to settle. */
    tailFrames?: number;
}
/** What one frame is asked about. */
interface RenderDemandProbe {
    width: number;
    height: number;
    /** The world's structural version (entities and components added or removed). */
    worldVersion: number;
    /** Shaders still compiling in the background. */
    pendingShaders: number;
    input: InputState | null;
}
/** @experimental */
declare class RenderDemand {
    private enabled_;
    private tailFrames_;
    private remaining_;
    private requested_;
    private holds_;
    private lastWidth_;
    private lastHeight_;
    private lastWorldVersion_;
    private lastInput_;
    private drawn_;
    private skipped_;
    get enabled(): boolean;
    /** Frames drawn and frames left out since this was turned on. */
    get stats(): {
        drawn: number;
        skipped: number;
    };
    enable(options?: RenderOnDemandOptions): void;
    disable(): void;
    /** Draw the next frame (and the tail after it): something changed that the engine could not see. */
    request(): void;
    /**
     * Draw every frame until the returned function is called: for what moves on its own (a tween, a video, an animation). Holds add up, so two
     * owners do not release each other's.
     */
    hold(): () => void;
    /** Asked once per frame, by the frame that would draw. False leaves the frame out; the screen keeps the last picture. */
    shouldRender(probe: RenderDemandProbe): boolean;
}

/**
 * @file    renderPipeline.ts
 * @brief   Unified render pipeline for runtime and editor
 */

interface Viewport {
    x: number;
    y: number;
    w: number;
    h: number;
}
interface RenderParams {
    registry: {
        _cpp: CppRegistry;
    };
    viewProjection: Float32Array;
    width: number;
    height: number;
    elapsed: number;
    /** Background for the pass's load-op clear (default opaque black). */
    clearColor?: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
    /**
     * The caller already opened the frame (`beginFrame`) — as the render system
     * does, so the transform pass can run before the cameras are read. Opening a
     * frame twice ages the render-target pool twice, so it must happen once.
     */
    frameAlreadyBegun?: boolean;
}
interface CameraRenderParams {
    registry: {
        _cpp: CppRegistry;
    };
    viewProjection: Float32Array;
    /** The view-projection for the render origin, which the renderer is begun with; absent, `viewProjection` (the origin is zero). */
    renderViewProjection?: Float32Array;
    viewportPixels: Viewport;
    clearFlags: number;
    elapsed: number;
    cameraEntity?: Entity;
    /** Background for the camera's load-op clear (default opaque black). */
    clearColor?: {
        x: number;
        y: number;
        z: number;
        w: number;
    };
    /** Sorting layers this camera draws (`Camera.cullingMask`); omitted = all. */
    cullingMask?: number;
    /** Offscreen target to draw into; 0 (default) is the screen. */
    renderTarget?: number;
    /** World units the camera shows vertically (`2 * halfH`); drives the render size. */
    worldHeight?: number;
    /** How the render resolution is chosen; omitted = render straight to the surface. */
    renderPolicy?: RenderResolution;
}
declare class RenderPipeline {
    private frameElapsed_;
    get frameElapsed(): number;
    private renderingEnabled_;
    /** Which frames are drawn, when the game has asked for only those that can look different. */
    readonly demand: RenderDemand;
    private lastWidth_;
    private lastHeight_;
    private activeScenes_;
    private preFlushCallbacks_;
    private screenOverlayCallbacks_;
    private postProcess_;
    private quality_;
    private applyQuality_;
    private warnedMissingPresent_;
    /** @experimental */
    get renderingEnabled(): boolean;
    /** @experimental */
    setRenderingEnabled(enabled: boolean): void;
    setQuality(quality: QualityController, apply?: () => void): void;
    setActiveScenes(scenes: Set<string> | null): void;
    /**
     * Inject this App's post-process API (by PostProcessPlugin). When null, the
     * pipeline does no post-processing — it has no hard dependency on the
     * post-process subsystem.
     */
    setPostProcess(pp: PostProcessAPI | null): void;
    /** The optional projection is the current pass; legacy manual hosts may omit it. */
    addPreFlushCallback(cb: (registry: {
        _cpp: CppRegistry;
    }, viewProjection?: Float32Array) => void): void;
    /**
     * Register geometry a plugin draws into the SCREEN overlay rather than into a
     * camera — the sibling of {@link addPreFlushCallback}, separate for the same
     * reason the two collects are: a callback that ran in both would put the same
     * glyph in each list. Runs between the overlay's collect and its pass.
     */
    addScreenOverlayCallback(cb: (registry: {
        _cpp: CppRegistry;
    }, viewProjection?: Float32Array) => void): void;
    /**
     * Run what plugins registered to draw just before the frame flushes (glyph
     * quads, today). {@link submitScene} calls this in the middle of its own
     * sequence; a host that owns its render loop in C++ — the native one — calls
     * it directly at the same point, between collecting the scene and flushing,
     * so text lands in the same frame either way.
     */
    runPreFlushCallbacks(registry: {
        _cpp: CppRegistry;
    }, viewProjection?: Float32Array): void;
    beginFrame(elapsedSec?: number): void;
    /**
     * Closes the frame. The pair of {@link beginFrame}, and the last thing a
     * frame does: a backend that borrows the swapchain image for a frame gives it
     * back here, so everything drawn after the first camera — a second camera,
     * the screen post stack, the overlay — still has somewhere to land.
     */
    endFrame(): void;
    /**
     * The frame's screen-space overlay: one pass, after every camera and after
     * post. It takes a projection and a rect and no camera, which is what makes a
     * HUD hold still while the view moves. Silent when the core has no overlay
     * pass, which has not partitioned the domains either.
     */
    renderScreenOverlay(registry: {
        _cpp: CppRegistry;
    }, overlay: ScreenOverlayData, target?: number): void;
    beginScreenCapture(): void;
    endScreenCapture(): void;
    submitScene(registry: {
        _cpp: CppRegistry;
    }, viewProjection: Float32Array, viewport: Viewport, _elapsed: number): void;
    render(params: RenderParams): void;
    renderCamera(params: CameraRenderParams): void;
    private executePreSceneDrawCallbacks;
    private executeDrawCallbacks;
}

/**
 * @file  What it means for content to have its render programs ready.
 *
 * Publishing content whose shaders are not built pays for them in the first
 * frame that shows it. A preparation that readies assets and not programs is a
 * promise half kept; this is the other half's shape.
 */
/**
 * A claim that some content's render programs are ready.
 *
 * Two facts, never one: the digest says WHICH programs, so a claim cannot cover
 * content it was not made about, and the epoch says those programs still exist.
 * The device generation guards the act of claiming, not the claim.
 *
 * @experimental
 */
interface RenderReadinessStamp {
    /** The requirement digest in two halves — 64 bits do not survive a JS number. */
    digestLo: number;
    digestHi: number;
    /** The program epoch the digest holds under. */
    programEpoch: number;
}
/**
 * The outcome of trying to ready some content's render programs.
 *
 * `applicable: false` is the honest answer where there is no renderer, and must
 * never be spelled as a claim that succeeded. `stamp: null` is a debt: it can be
 * attempted again, and until one succeeds nothing is ready.
 *
 * @experimental
 */
type RenderReadiness = {
    applicable: false;
} | {
    applicable: true;
    stamp: RenderReadinessStamp | null;
};

/**
 * @file    customDraw.ts
 * @brief   Custom draw callback registration for the render pipeline
 */
/** The camera facts used by the draw pass invoking a callback. */
interface DrawFrameInfo {
    /** Canonical view-projection matrix for this render pass. Valid for the callback. */
    readonly viewProjection: Float32Array;
    /** Framebuffer viewport dimensions used by Draw.begin. */
    readonly width: number;
    readonly height: number;
}
type DrawCallback = (elapsed: number, frame: DrawFrameInfo) => void;
declare function registerDrawCallback(id: string, fn: DrawCallback, scene?: string): void;
declare function unregisterDrawCallback(id: string): void;
declare function clearDrawCallbacks(): void;
interface PreSceneDrawInfo {
    /** Camera viewport width in pixels (drives aspect). */
    width: number;
    /** Camera viewport height in pixels. */
    height: number;
    /** Seconds since app start (same clock as the post-scene callbacks). */
    elapsed: number;
}
type PreSceneDrawCallback = (info: PreSceneDrawInfo) => void;
declare function registerPreSceneDrawCallback(id: string, fn: PreSceneDrawCallback): void;
declare function unregisterPreSceneDrawCallback(id: string): void;

/** Where a loaded scene is in its lifecycle. `paused` still draws; `sleeping`
 *  does not — see {@link SceneManagerState.pause} and `sleep`.
 *  @beta */
type SceneStatus = 'loading' | 'running' | 'paused' | 'sleeping' | 'unloading';
/**
 * A scene as registered: where its data comes from, the systems that run while it
 * is loaded, and hooks either side of its lifetime. `path` and `data` are
 * alternatives — a scene either loads from disk or is handed its content.
 *
 * @beta
 */
interface SceneConfig {
    name: string;
    path?: string;
    data?: SceneData;
    systems?: Array<{
        schedule: Schedule;
        system: SystemDef;
    }>;
    setup?: (ctx: SceneContext) => void | Promise<void>;
    cleanup?: (ctx: SceneContext) => void;
    /**
     * Authored ids this scene may reference in ANOTHER document, resolved at load
     * time. A streamed cell names the persistent world through this; nothing else
     * has a document boundary to cross.
     */
    externalEntities?: () => ReadonlyMap<number, Entity>;
    /** Where this scene's load spent its time. See {@link SceneLoadOptions.onPhase}. */
    onPhase?: (phase: string, ms: number) => void;
    /**
     * Do everything this scene's load can do without the world seeing anything —
     * fetch, decode, acquire. Creates no entities; `load` publishes what it left.
     */
    prepare?: () => Promise<void>;
    /** Throw away what `prepare` readied, answering how many receipts came back. */
    discardPrepared?: () => number;
    /**
     * Ready the render programs this scene's content requires, from what
     * `prepare` decoded. Absent means the obligation does not apply here, which
     * is how a headless host satisfies it — never by inventing a claim.
     */
    readyRenderPrograms?: () => Promise<RenderReadiness>;
}
/**
 * A live scene, as `setup` receives it and `load` answers with. Everything it
 * spawns or adopts is scene-owned and goes away when the scene unloads, which is
 * why an entity or an asset reference nothing records is one nothing releases.
 *
 * @beta
 */
interface SceneContext {
    readonly name: string;
    readonly entities: ReadonlySet<Entity>;
    spawn(): Entity;
    /** Track an entity as scene-owned, transferring it from its previous scene. */
    adopt(entity: Entity): void;
    /**
     * Track assets a loader acquired for this scene, so unload gives them back.
     *
     * The asset half of {@link adopt}: a scene whose data arrives inside `setup`
     * preloads its own, and a reference nothing records is one nothing releases.
     */
    trackAssets(byType: ReadonlyMap<string, ReadonlySet<string>>): void;
    /**
     * Take over the receipts a loader acquired for this scene.
     *
     * What {@link trackAssets} is for a caller that only ever had paths. A
     * caller holding receipts hands them over instead: unload then gives back
     * the acquisitions this load made, not the oldest ones sharing their path.
     */
    trackAssetScope(scope: AssetScope): void;
    despawn(entity: Entity): void;
    registerDrawCallback(id: string, fn: DrawCallback): void;
    bindPostProcess(camera: Entity, stack: PostProcessStack): void;
    unbindPostProcess(camera: Entity): void;
    setPersistent(entity: Entity, persistent: boolean): void;
}
/**
 * How a switch, unload or reload behaves. `keepPersistent` decides whether
 * entities marked persistent survive it.
 *
 * @beta
 */
interface TransitionOptions {
    keepPersistent?: boolean;
    transition?: 'none' | 'fade';
    duration?: number;
    color?: Color;
    onStart?: () => void;
    onComplete?: () => void;
}
/**
 * Thrown by a `load()` whose scene slot was replaced — by a concurrent `unload()`
 * or a superseding load — while its assets were still loading. The load despawns
 * anything it had spawned and rejects with this instead of committing a
 * half-loaded scene, so a `load()`/`unload()` race can't orphan entities.
 */
declare class SceneLoadCancelled extends Error {
    constructor(name: string);
}
/**
 * Scene loading and transitions, as `Res(SceneManager)` hands it over. A scene is
 * a unit of ownership as much as of content: what it spawned is despawned and what
 * it acquired is released when it unloads.
 *
 * `@beta`: the vocabulary is settled, but one certified project drives it against
 * twenty-six signatures — thin evidence for that breadth of promise.
 *
 * @beta
 */
declare class SceneManagerState {
    private readonly app_;
    private readonly configs_;
    private readonly scenes_;
    private readonly contexts_;
    private readonly additiveScenes_;
    private readonly pausedScenes_;
    private readonly sleepingScenes_;
    private readonly loadOrder_;
    private activeScene_;
    private initialScene_;
    private readonly transitionController_;
    private switching_;
    private loadPromises_;
    private stopEntityTracking_;
    constructor(app: App);
    private trackEntityDestruction_;
    /**
     * Forget the scenes while the caller keeps the World.
     *
     * scene-teardown: NOT the shared protocol. Entities stay, so what they still
     * render must not be released under them — and a dropped instance therefore
     * keeps its receipts and systems. No caller in this repo says if that is right.
     */
    reset(): void;
    register(config: SceneConfig): void;
    setInitial(name: string): void;
    getInitial(): string | null;
    isTransitioning(): boolean;
    switchTo(name: string, options?: TransitionOptions): Promise<void>;
    /**
     * Start the active scene over: retire it and bring it back up, entities and
     * all. `switchTo` cannot express this — asked for the scene already running
     * it does nothing, which is the right answer for a gate and the wrong one
     * for every death, retry and restart there is.
     */
    reload(options?: TransitionOptions): Promise<void>;
    private switchTo_;
    /** The swap itself: retire whatever is active, bring `name` up. */
    private swapTo_;
    updateTransition(dt: number): void;
    /** Replace whatever is active with `name`. */
    load(name: string, onProgress?: SceneLoadProgressCallback): Promise<SceneContext>;
    /** Bring `name` up alongside whatever is already running. */
    loadAdditive(name: string, onProgress?: SceneLoadProgressCallback): Promise<SceneContext>;
    /**
     * Ready `name` without bringing it up. A no-op for a scene that declares no
     * preparation, and for one already loaded — there is nothing left to hide.
     */
    prepare(name: string): Promise<void>;
    /**
     * Make the render programs `name`'s prepared content requires ready.
     * @returns Not applicable where the scene declares no readying or is already
     *          up; otherwise the claim, or null when one could not be made.
     */
    readyRenderPrograms(name: string): Promise<RenderReadiness>;
    /**
     * Give back what {@link prepare} readied, answering how many acquisitions
     * came back with it. Zero for a scene that readied nothing.
     */
    discardPrepared(name: string): number;
    /**
     * The one load path. `mode` is the only difference between the two doors —
     * which is why they were two copies, and why the fix for re-loading a SLEPT
     * scene reached only one: additive flipped the status bit without the
     * restore, leaving those entities disabled forever.
     */
    private loadScene_;
    /**
     * Roll back a load that threw partway, through the teardown a successful
     * unload runs: a half-loaded scene owns what a loaded one owns.
     *
     * `keepPersistent: false` because persistence is a property of a COMMITTED
     * scene — a failed load cannot promote an entity into a global one.
     */
    private rollbackFailedLoad_;
    /**
     * Give back everything this instance owns — the one teardown protocol.
     *
     * Idempotent by construction: every collection is emptied as it is walked.
     * An `unload` during a load tears the instance down, and that load's own
     * rollback then runs over it again — over whatever its setup added between.
     */
    private disposeSceneOwnedState_;
    /**
     * Who lives through this unload and who does not, decided before anything is
     * destroyed. Persistence is only asked of a scene that COMMITTED: a rollback
     * passes `keepPersistent: false`, and everything it made is doomed.
     */
    private partitionOnUnload_;
    /**
     * Hand one entity over to nobody in particular: it outlives the scene it came
     * from, so nothing scene-gated may still read it as that scene's.
     *
     * `scene === ''` is the existing "always active" rule; left as the dead
     * scene's, a persistent camera would stop rendering.
     */
    private promoteToGlobal_;
    /**
     * Split the scene's ownership of what this entity is bound to.
     *
     * `retain`, not a re-acquire: the era the fields hold is not the era their
     * path resolves to once a hot update has passed this scene by. One per
     * SOURCE receipt — a handle names its receipt by value, a ref names the
     * slot that publishes it.
     */
    private promoteAssetOwnership_;
    private adoptInto_;
    /**
     * Forget the scene, if the slot is still this instance's.
     *
     * The identity check is the whole point: a concurrent unload + reload may
     * already have put a NEWER instance in the slot, and a rollback that
     * cleared it by name would delete the live scene out from under it.
     */
    private removeSceneSlot_;
    unload(name: string, options?: TransitionOptions): Promise<void>;
    /**
     * Populate a scene: entities, assets, systems, setup().
     *
     * Returning means this load still owns the scene slot. Every await inside is a
     * window for a concurrent unload to take it; checking that here rather than
     * per caller is what the additive path was missing.
     */
    private loadSceneData_;
    private releaseSceneAssets_;
    /**
     * What the named scene acquired, so an owner-aware operation (a live asset
     * replacement) can put a receipt where this scene will give it back.
     *
     * @internal
     */
    assetScopeFor(name: string): AssetScope | null;
    pause(name: string): void;
    resume(name: string): void;
    sleep(name: string): void;
    private sleepEntity_;
    wake(name: string): void;
    /** Put one entity back the way {@link sleep} found it. Shared with the
     *  promotion of a persistent entity out of a sleeping scene, which is the
     *  same question asked about one entity instead of all of them. */
    private restoreSleepState_;
    private setPostProcessPassesEnabled;
    isPaused(name: string): boolean;
    isSleeping(name: string): boolean;
    isLoaded(name: string): boolean;
    isActive(name: string): boolean;
    getActive(): string | null;
    getActiveScenes(): string[];
    getLoaded(): string[];
    /** Scenes whose load has started and not yet finished, in the order they began. */
    getLoading(): string[];
    /**
     * Resolves once every load in flight NOW has finished, failed or been
     * cancelled — loads read their files in wall time, so a caller that advances
     * the game by frames (a test, an automation driver) cannot count its way to
     * a loaded scene. A load started after this call is not waited for.
     */
    whenLoadsSettle(): Promise<void>;
    getLoadOrder(): string[];
    bringToTop(name: string): void;
    getScene(name: string): SceneContext | null;
    getSceneStatus(name: string): SceneStatus | null;
}
/**
 * Scene loading, as a resource. Registered by the scene plugin, so a bare `App`
 * without it has no scenes to manage.
 *
 * @beta
 */
declare const SceneManager: ResourceDef<SceneManagerState>;
declare function wrapSceneSystem(app: App, sceneName: string, system: SystemDef): SystemDef;

/** `scaleMode` sentinel: no camera fit — the camera uses its own orthoSize (default). */
declare const SCREEN_FIT_OFF = -1;
interface ScreenScalingData {
    /** Design (reference) resolution width in px — the horizontal reference the fit uses. */
    designWidth: number;
    /** Design (reference) resolution height in px. */
    designHeight: number;
    /** A {@link CanvasScaleMode} (FixedWidth=0 … Match=4), or {@link SCREEN_FIT_OFF} (-1). */
    scaleMode: number;
    /** Match-mode blend 0..1 (0 = fit width, 1 = fit height); ignored for other modes. */
    matchWidthOrHeight: number;
    /**
     * Whether the scene renders at its own resolution and is then scaled to the
     * surface, or straight to the surface. See {@link RenderResolution}. Optional
     * because a project file written before it existed must still read; absent
     * means `Surface`, which is the behaviour every project already had.
     */
    renderPolicy?: RenderResolution;
}
/** Off by default (scaleMode = -1) ⇒ zero behavior change for a project that never
 *  opts into a camera fit. Dimensions default to the engine's Canvas default. */
declare const DEFAULT_SCREEN_SCALING: ScreenScalingData;
declare const ScreenScaling: ResourceDef<ScreenScalingData>;

/**
 * @file    subsystems.ts
 * @brief   Per-App registry of engine subsystem lifecycle + liveness — the
 *          observability seam for "which modules are loaded, ready, stepping, or
 *          errored".
 *
 * @details Phase (registered → initializing → ready, error terminal) is recorded;
 *          each transition appends a timestamped event for history. Liveness is
 *          derived, not stored: an owned system pets the watchdog via
 *          markStepped() each tick; getStatuses() reports `stepping` while beats
 *          are fresh, `idle` once stale (e.g. physics frozen by playModeOnly in
 *          edit mode) — the load≠run distinction. One registry per realm, never a
 *          shared singleton, so realms report independently.
 */
/** Recorded lifecycle phases. `stepping` / `idle` are derived, not phases. */
type SubsystemPhase = 'registered' | 'initializing' | 'ready' | 'error';
/** Runtime liveness, derived from watchdog beats at read time. */
type SubsystemActivity = 'stepping' | 'idle' | 'inactive';
/** One recorded lifecycle transition. */
interface SubsystemEvent {
    readonly id: string;
    readonly phase: SubsystemPhase;
    readonly detail?: string;
    /** performance.now() at emit, for ordering and age. */
    readonly atMs: number;
    /** Monotonic emit counter — stable order even across equal timestamps. */
    readonly seq: number;
}
/** A subsystem's current status, with liveness derived at read time. */
interface SubsystemStatus {
    readonly id: string;
    readonly displayName: string;
    readonly phase: SubsystemPhase;
    readonly activity: SubsystemActivity;
    /** Latest phase detail (e.g. an error message). */
    readonly detail?: string;
    /** The last error reason, retained even after later transitions. */
    readonly lastError?: string;
    /** Plugin names this subsystem declared a dependency on (cascade context). */
    readonly dependsOn: readonly string[];
    /** How long the current phase has been held, in ms. */
    readonly phaseAgeMs: number;
}
declare class SubsystemRegistry {
    private readonly entries_;
    /** Insertion order, so the UI lists subsystems install-order stably. */
    private readonly order_;
    private readonly events_;
    private readonly listeners_;
    private seq_;
    /** Register (or re-register) a subsystem in the `registered` phase. */
    register(id: string, opts?: {
        displayName?: string;
        dependsOn?: string[];
    }): void;
    /** Move a subsystem to a new lifecycle phase (no-op for an unknown id). */
    transition(id: string, phase: SubsystemPhase, detail?: string): void;
    /** Terminal error transition; keeps the reason in `lastError`. */
    markError(id: string, reason?: string): void;
    /** The current phase of a subsystem, or undefined if unknown. */
    phaseOf(id: string): SubsystemPhase | undefined;
    /** Pet the watchdog: an owned system ran this frame. Cheap and silent (no
     *  notify) — liveness is sampled, not pushed. Call once per tick. */
    markStepped(id: string): void;
    /** Current status of every subsystem, install order, liveness derived now. */
    getStatuses(): SubsystemStatus[];
    /** Recent lifecycle transitions, oldest→newest (for a diagnostics log). */
    recentEvents(limit?: number): SubsystemEvent[];
    /** Subscribe to phase transitions (not per-beat). Returns an unsubscribe. */
    subscribe(fn: () => void): () => void;
    private emit_;
}

/**
 * @file    frameProfile.ts — the per-frame cost model every profiler view reads.
 */

/** Systems a project registered, as opposed to any engine plugin's. */
declare const DOMAIN_SCRIPTS = "scripts";
/** Systems registered outside both a plugin build and the project bundle. */
declare const DOMAIN_UNATTRIBUTED = "unattributed";
/** No display refreshes slower than this, so a longer block is not a present. */
declare const MAX_PRESENT_WAIT_MS = 50;
/** The label of the row holding render time that no scope measured and no present explains. */
declare const UNTIMED_SCOPE_LABEL = "untimed";
/** Time under a scope that none of its children claimed. */
type ScopeRemainder = 'work' | 'wait';
interface SystemCost {
    readonly name: string;
    readonly ms: number;
    readonly domain: string;
    /** Absent when the system ran no query, or when accounting was off. */
    readonly query?: QueryCost;
}
interface ScopeCost {
    readonly name: string;
    readonly ms: number;
    /** The system this ran inside; '' when it ran outside every system. */
    readonly system: string;
    readonly remainder: ScopeRemainder;
    /** The scope this ran inside. Its time is part of that scope's, not beside it. */
    readonly parent?: string;
}
interface FrameProfileInput {
    readonly frameMs: number;
    readonly systems: readonly SystemCost[];
    readonly scopes: readonly ScopeCost[];
    /** Scopes measured inside wasm. Adopted by the wait scope of their domain. */
    readonly nativeScopes?: readonly ScopeCost[];
    readonly gpuMs?: number;
}
type ProfileNodeKind = 'domain' | 'system' | 'scope' | 'rest';
interface ProfileNode {
    readonly id: string;
    readonly label: string;
    readonly ms: number;
    readonly kind: ProfileNodeKind;
    readonly children: readonly ProfileNode[];
    /** On a system node that ran a query — why its time is what it is. */
    readonly query?: QueryCost;
}
/**
 * `frameMs === cpuMs + waitMs + idleMs`, and every node's ms equals the sum of
 * its children. `gpuMs` is a parallel track and is in none of those sums.
 */
interface FrameProfile {
    readonly frameMs: number;
    readonly cpuMs: number;
    readonly waitMs: number;
    readonly idleMs: number;
    readonly gpuMs: number;
    readonly domains: readonly ProfileNode[];
}
/**
 * Average a window of frames into one profile, per frame. A node is divided by
 * the whole window, not by the frames it appeared in: dividing by its own
 * appearances would report an every-fourth-frame system four times too dear.
 * Obeys the same sums a single frame does.
 */
declare function meanFrameProfile(profiles: readonly FrameProfile[]): FrameProfile;
/** The part of a dotted scope name that names its domain. */
declare function scopeDomain(name: string): string;
/**
 * Fold one frame's flat measurements into the tree the profiler renders.
 *
 * Pure, so the live editor view, an imported capture and the agent all derive
 * the same numbers from the same rule rather than each rounding their own way.
 */
declare function buildFrameProfile(input: FrameProfileInput): FrameProfile;

/**
 * @file    app.ts
 * @brief   Application builder and web platform integration
 */

type PluginDependency = string | ResourceDef<any>;
interface Plugin {
    name?: string;
    dependencies?: PluginDependency[];
    before?: string[];
    after?: string[];
    /** Cost domain the profiler files this plugin's systems under. Defaults to
     *  `name`; declare it where the two differ, as `camera` producing `render`. */
    profileDomain?: string;
    /**
     * The components this plugin's work is about: while no entity has any of them,
     * its systems are not run — a game that never places water pays nothing for the
     * water plugin each frame. They keep running for one frame after the last one
     * goes, so a plugin can release what it held. Absent: always run.
     */
    activeWhen?: readonly AnyComponentDef[];
    build(app: App): void;
    finish?(app: App): void;
    /** Releases acquired resources on quit or a failed build; must tolerate a
     * partially completed build. */
    cleanup?(app?: App): void;
}

/** One frame's costs, attributed. The input `buildFrameProfile` folds. */
interface FrameCosts {
    systems: SystemCost[];
    scopes: ScopeCost[];
}
/**
 * @experimental What the loop's own clock read for one completed frame. The one
 * place frame time is measured: the profiler, the debug channel and the quality
 * controller all take it from here instead of each keeping a clock.
 */
interface FrameTiming {
    /** Counts completed frames, so a reader can tell a new one from the last. */
    seq: number;
    /** Interval since the previous frame, before simulation speed or delta clamping. */
    frameMs: number;
    /**
     * How long this frame's own run took, first system to last; -1 where there is
     * no clock. What is left of `frameMs` is time the loop waited for its next
     * turn, so a frame that came late with this inside the budget was not held up
     * by its systems.
     */
    busyMs: number;
}
declare class App {
    private readonly world_;
    private readonly resources_;
    private readonly systems_;
    private runner_;
    /** Whether the once-per-app boot work has run. Not `runner_ !== null`: a
     *  compiled-systems install needs the runner BEFORE the first tick, and
     *  reading the boot from its existence would then skip that work forever. */
    private booted_;
    /** The compiled twins a build installed, or null where it made none. */
    private aot_;
    private systemCounter_;
    private readonly templateToRuntime_;
    /** Set name -> runtime system names registered under that set, for dep expansion. */
    private readonly setMembership_;
    private running_;
    private readonly executionHolds_;
    private executionEpoch_;
    private readonly executionObservers_;
    private loopVersion_;
    private queuedFrame_;
    /** Whether {@link queuedFrame_} is a timer (hidden + runInBackground) rather than a rAF id. */
    private queuedOnTimer_;
    private runInBackground_;
    private onVisibility_;
    private frameInFlight_;
    private frameTiming_;
    private lastTime_;
    private fixedTimestep_;
    private fixedAccumulator_;
    private maxDeltaTime_;
    private maxFixedSteps_;
    private fixedStepBudgetMs_;
    private targetFrameInterval_;
    private nextCapFrameAt_;
    private module_;
    private ownedCppRegistry_;
    private pipeline_;
    private spineInitPromise_?;
    private compiledInstallTail_;
    private readonly installed_plugins_;
    private readonly installedPluginSet_;
    private readonly installedPluginNames_;
    private readonly subsystems_;
    /** The plugin currently in build(), so systems it adds inherit its name for
     *  liveness reporting. Null outside a build. */
    private buildingPlugin_;
    /** The cost domain of that plugin, which is its name unless it declared one. */
    private buildingDomain_;
    private buildingGate_;
    /** Registration undo actions for the current build; nested builds own theirs. */
    private buildRollback_;
    private addingBundleSystems_;
    private sideModules_;
    /** This App made the host, so quitting disposes it; one handed in is its maker's to end. */
    private ownsSideModules_;
    private pluginsFinished_;
    private readonly eventRegistry_;
    private readonly sortedSystemsCache_;
    /** Transitive ordering, per schedule. Invalidated with the sort it follows. */
    private readonly dependencyCache_;
    private error_handler_;
    private system_error_handler_;
    private statsEnabled_;
    private phaseTimings_;
    private frameScopes_;
    /** The system being run, so a scope opened inside one is filed under it. */
    private currentSystem_;
    private readonly openScopes_;
    private readonly frameObservers_;
    private frame_paused_;
    private user_paused_;
    private step_pending_;
    private steppedFrames_;
    private play_speed_;
    private constructor();
    static new(): App;
    getPlugin<T extends Plugin>(ctor: new (...args: any[]) => T): T | undefined;
    /** Subsystem lifecycle registry ("which modules loaded/ready/stepping/errored").
     *  Named plugins auto-register in {@link addPlugin}; async plugins (physics)
     *  drive their own initializing→ready/error transitions. */
    get subsystems(): SubsystemRegistry;
    /** The realm's optional-native-module acquirer (physics, spine). Physics and
     *  spine pull their wasm from here, so a realm wires its transport once
     *  (fetch / inlined / WeChat) and every subsystem follows. */
    get sideModules(): SideModuleHost | null;
    /**
     * `owned` says the host was made for this App alone: quitting then disposes
     * it, with the workers and module instances tied to it. A host shared with
     * anything else is left as it is, and whoever made it disposes it.
     */
    setSideModules(host: SideModuleHost, options?: {
        owned?: boolean;
    }): void;
    addPlugins(plugins: Plugin[]): this;
    addPlugin(plugin: Plugin): this;
    private rollbackPluginBuild_;
    addEvent<T>(event: EventDef<T>): this;
    /**
     * The entry list for `schedule`, or a refusal that says what was wrong.
     *
     * Every valid schedule gets its list in the constructor, so a miss means the
     * caller passed something that is not a Schedule — a member that does not
     * exist (`Schedule.LateUpdate` evaluates to `undefined`), or the two
     * arguments the wrong way round. Neither is caught before it runs: the
     * editor and the mini-game exporters bundle project code with esbuild, which
     * strips types without checking them, so a registration TypeScript would
     * have rejected reaches the App intact.
     *
     * It used to be `systems_.get(schedule)!`, which turned both into "Cannot
     * read properties of undefined (reading 'push')" thrown from inside a
     * minified bundle, naming neither the system nor the value.
     */
    /** Whether a plugin's systems run this frame: some entity has one of its components, or had last frame. */
    private gateOpen_;
    private registeringDomain_;
    private scheduleBucket_;
    /**
     * Register `system` onto `schedule`, adding ordering to its declared edges.
     * `profileDomain` attributes systems registered after an async plugin build
     * returns; otherwise the current build context supplies it.
     */
    addSystemToSchedule(schedule: Schedule, system: SystemDef, options?: {
        runBefore?: string[];
        runAfter?: string[];
        runIf?: RunCondition;
        profileDomain?: string;
        /** This system alone, gated as Plugin.activeWhen gates a whole plugin: skipped while no
         *  entity has any of these, and run one frame past the last. Takes precedence over the
         *  building plugin's gate. */
        activeWhen?: readonly AnyComponentDef[];
    }): this;
    private registerSystemEntry_;
    addSystem(system: SystemDef): this;
    /**
     * Register systems drained from the PROJECT BUNDLE, marking them as the set
     * hot reload may swap. The bundle drain is the one boundary that separates
     * user-authored systems from everything the engine registers — plugin
     * builds tag themselves, but lazily-added engine systems are told apart
     * from user code only by which door they came through.
     * @internal
     */
    addBundleSystems(entries: ReadonlyArray<{
        schedule: number;
        system: SystemDef | SystemSet;
    }>): this;
    addStartupSystem(system: SystemDef): this;
    /**
     * Hot-swap the project's (user-authored) system function bodies in place, keeping
     * the live World/Registry/entities — the state-preserving hot-reload fast path
     * (RC10 P3). `incoming` is the freshly re-imported bundle's drained systems.
     *
     * Returns false when the structure changed — a user system was added, removed, or
     * renamed, or a schedule's user-system count differs — because the running systems
     * then no longer line up with the new code, so the caller must full-reload instead.
     * Builtin/plugin systems (those with an owning subsystem) are never touched. The
     * match validates fully before mutating, so a rejected swap leaves the scheduler
     * untouched (no torn half-swap). Component identity is stable by name (see
     * component.ts), so the new functions' queries resolve to the live storage.
     */
    hotSwapSystems(incoming: ReadonlyArray<{
        schedule: number;
        system: SystemDef;
    }>): boolean;
    /** A live (scoped) system name and a re-imported raw name refer to the same system
     *  if the live one is an explicit name that matches, or both are auto-named (the
     *  live `System_N` placeholder ⇔ an unnamed re-import). */
    private static systemNamesCompatible;
    /**
     * Register every system in `set` onto `schedule`. Each member gets the set's
     * `runIf`, and the set's `runBefore` / `runAfter` edges on top of any it
     * declared itself; members keep the order they were listed in. Other systems
     * may reference the set's name in their own ordering, and the scheduler
     * expands those references to every member.
     */
    addSystemSetToSchedule(schedule: Schedule, set: SystemSet): this;
    /** Shortcut for `addSystemSetToSchedule(Schedule.Update, set)`. */
    addSystemSet(set: SystemSet): this;
    removeSystem(systemId: symbol): boolean;
    /**
     * Bind the app to an engine core. Part of the embedding contract, which is
     * `esengine/wasm` — a host builds the module and calls this; a game is
     * handed an App that is already connected.
     * `ownedRegistry` transfers a newly constructed instance to this App after
     * the connection guards pass; failed verification releases it too. Omit
     * it for a registry whose lifetime belongs to the embedding host.
     *
     * @internal
     */
    connectCpp(cppRegistry: CppRegistry, module?: ESEngineModule, options?: BridgeConnectOptions & {
        ownedRegistry?: boolean;
    }): this;
    /** @internal */
    get wasmModule(): ESEngineModule | null;
    get pipeline(): RenderPipeline | null;
    setPipeline(pipeline: RenderPipeline): void;
    get spineInitPromise(): Promise<unknown> | undefined;
    set spineInitPromise(p: Promise<unknown> | undefined);
    waitForPhysics(): Promise<void>;
    get isPhysicsReady(): boolean;
    get world(): World;
    /**
     * Run the compiled twins a build produced instead of the systems' closures.
     * Call it BEFORE the world has any pooled component: the rows must be in the
     * memory the module reads. Refuses rather than degrades — a module built for
     * other offsets reads a different field, which is not an error.
     *
     * @experimental
     */
    useCompiledSystems(opts: {
        readonly host: AotHost;
        readonly manifest: AotManifest;
        readonly wasm: BufferSource;
    }): Promise<void>;
    private reserveCompiledInstall_;
    private checkCompiledInstallEpoch_;
    private commitCompiledRuntime_;
    /**
     * Which systems this App is running compiled, and how many twin calls have
     * happened. `installed` without `calls` rising means the module loaded and
     * nothing dispatched to it — which no differential can report, because the
     * closure it replaced computes the same answer.
     *
     * @experimental
     */
    get compiledSystems(): {
        readonly installed: readonly string[];
        readonly calls: number;
    };
    setFixedTimestep(timestep: number): this;
    /** The fixed-update timestep (seconds) — the FixedUpdate / physics cadence. */
    getFixedTimestep(): number;
    setMaxDeltaTime(v: number): this;
    setMaxFixedSteps(v: number): this;
    onError(handler: (error: unknown, systemName: string) => void): this;
    onSystemError(handler: (error: Error, systemName?: string) => 'continue' | 'pause'): this;
    onWasmError(handler: (error: unknown, context: string) => void): this;
    /** Pause simulation time and ordinary systems; presentation opt-ins and Last still run. */
    setPaused(paused: boolean): void;
    isPaused(): boolean;
    stepFrame(): void;
    setPlaySpeed(speed: number): void;
    setTargetFrameRate(fps: number): void;
    /**
     * Keep simulating while the page is hidden — a window behind others, a
     * minimized one, or one never shown (an editor driven by automation).
     *
     * A browser stops `requestAnimationFrame` for a hidden document, so without
     * this the game holds still there: what a shipped game wants, since nobody is
     * watching and the battery is. An editor's Play wants the opposite; Unity
     * calls the same switch `Application.runInBackground`. While hidden the loop
     * runs on a timer at the frame cap (60 fps when uncapped).
     */
    setRunInBackground(on: boolean): void;
    getRunInBackground(): boolean;
    getTargetFrameRate(): number;
    getPlaySpeed(): number;
    enableStats(): this;
    getSystemTimings(): ReadonlyMap<string, number> | null;
    getPhaseTimings(): ReadonlyMap<string, number> | null;
    /** @experimental The last completed frame's clock readings; see {@link FrameTiming}. */
    getFrameTiming(): Readonly<FrameTiming> | null;
    /** Frames requested by stepping controls, excluded from wall-clock FPS windows. */
    getSteppedFrameCount(): number;
    /**
     * Sub-frame CPU scopes recorded this frame via {@link measureFrameScope} —
     * the finer breakdown within a single system, keyed by scope name. Null when
     * stats aren't enabled. Sibling of {@link getSystemTimings} /
     * {@link getPhaseTimings}; surfaces as the profiler's `js.*` rows.
     */
    getFrameScopes(): ReadonlyMap<string, number> | null;
    /**
     * This frame's costs with the attribution a profile tree needs: which domain
     * owns each system, which system each scope ran inside. Null when stats are
     * off. Feed to `buildFrameProfile`, which is where the tree is derived.
     */
    getFrameCosts(): FrameCosts | null;
    /**
     * Time `fn` as a named sub-frame scope (accumulated if the name repeats in a
     * frame). A no-op passthrough when stats are off, so shipped games pay only a
     * single branch. Use it to split a heavy system into attributable pieces.
     *
     * `remainder: 'wait'` declares that whatever time is left under this scope
     * once its native scopes are subtracted is CPU blocked, not work — the
     * swapchain block a GPU submit absorbs, or an await. The profiler keeps such
     * time out of every cost total instead of reporting it as a hotspot.
     */
    measureFrameScope<T>(name: string, fn: () => T, options?: {
        remainder?: ScopeRemainder;
    }): T;
    /**
     * Observe the end of every frame, once its systems have run and its timings
     * are final. Returns a disposer.
     *
     * A broadcast, not a slot: a recorder and a game's own budget alarm both
     * watch without either taking the hook from the other.
     */
    onFrameEnd(fn: (dtMs: number) => void): () => void;
    getEntityCount(): number;
    insertResource<T>(resource: ResourceDef<T>, value: T): this;
    getResource<T>(resource: ResourceDef<T>): T;
    hasResource<T>(resource: ResourceDef<T>): boolean;
    getResourceByName(name: string): unknown | undefined;
    getResourceChangeTick(name: string): number;
    getRegisteredResourceNames(): string[];
    /**
     * Every resource this app holds, as `[name, value]` — what an inspector
     * shows. Includes the slots only a read has materialised, which
     * {@link getRegisteredResourceNames} (insert-only) does not.
     */
    getResourceEntries(): Array<[string, unknown]>;
    registerScene(config: SceneConfig): this;
    setInitialScene(name: string): this;
    /**
     * How many compiled twins this App runs. Zero unless a build installed some,
     * which is the whole of the mode policy — and the one number that tells a
     * shipped AOT build apart from a shipped interpreted one from outside.
     */
    get compiledSystemCount(): number;
    /**
     * Install the compiled twins a build produced, and answer how many
     * (docs/REARCH_AOT.md §9). Call it BEFORE any component exists — a twin reads
     * rows in the ENGINE's memory, and refuses rather than move rows already
     * allocated elsewhere, or trust a module built for other offsets.
     */
    installCompiledSystems(source: string | BufferSource, manifest: AotManifest): Promise<number>;
    /**
     * The same, where the host loads a library. Null when this is not such a
     * host, which is every host but a native one — and then the caller falls
     * through to the module road above.
     */
    private installNative_;
    tick(delta: number): Promise<void>;
    /** Hold frame execution without changing the game's own pause state. */
    holdExecution(): () => void;
    isExecutionHeld(): boolean;
    /** Observe execution holds, including the initial state. Media/timer owners can cooperate here. */
    onExecutionChange(callback: (held: boolean) => void): () => void;
    private notifyExecution_;
    private callExecutionObserver_;
    /**
     * Advance exactly `frames` frames of exactly `dt` seconds, with the rAF loop held
     * off for the duration — "let the game run a bit", made reproducible.
     *
     * The loop it replaces is wall-clock and browser-scheduled: a backgrounded tab is
     * throttled to about one frame a second, so an observer that steps by waiting sees
     * a frozen game and concludes the game is broken. Worse, there was no other door —
     * a driver that needed the next 30 frames of simulation had to reach for
     * `runFrame_`, and reaching for a private method is a thing that keeps working
     * until the day it doesn't.
     *
     * A PAUSED app still steps here: advancing frame by frame is exactly what stepping
     * a paused game means. The pause (and the loop) are restored afterwards, with the
     * clock re-based so the first resumed frame is not handed the whole excursion as
     * its delta.
     */
    stepFrames(frames?: number, dt?: number): Promise<void>;
    run(): Promise<void>;
    private invalidateLoop_;
    private queueLoopFrame_;
    private mainLoop;
    private quitting_;
    private quitEpoch_;
    quit(options?: {
        keepRenderer?: boolean;
    }): void;
    private quit_;
    /**
     * The runner, made on demand. Making one is free and decides nothing — what
     * has to happen exactly once before a frame is in `boot_`, so a caller that
     * needs the runner early (a compiled-systems install) does not consume the
     * boot by asking.
     */
    private ensureRunner_;
    /**
     * The clock, before anything asks for it. Installing compiled systems is one
     * such thing and it runs BEFORE the first frame: a twin declaring `Res(Time)`
     * is refused outright if this App cannot yet say what Time's fields are.
     */
    private ensureSpeculation_;
    private ensureTime_;
    /** Once per app, on the way into the first frame: the clock every system
     *  reads, and the plugins' last chance to add one. */
    private boot_;
    private runFrame_;
    private finishPlugins_;
    private sortPlugins;
    /**
     * Expands an ordering name to the indices it refers to — a system, or every
     * member of a set that is also in this schedule. A name matching neither
     * resolves to nothing, which is how ordering against a system that was never
     * registered stays a no-op rather than an error.
     */
    private resolverFor;
    /**
     * Pairs of systems in `schedule` that touch the same data with nothing
     * saying which runs first, so their order is whatever registration and the
     * sort happened to produce.
     *
     * @beta
     */
    scheduleAmbiguities(schedule: Schedule): Ambiguity[];
    /**
     * `schedule` grouped into batches that could run at the same time — how much
     * of it is inherently sequential. A measurement: the schedule starts systems
     * in sorted order, overlapping only what awaits. See {@link parallelBatches}.
     *
     * @beta
     */
    scheduleBatches(schedule: Schedule): string[][];
    private sortSystems;
    private startupInFlight_;
    private flushStartupSystems_;
    private runSchedule;
    /**
     * What must finish before each system of `systems` may start, transitively.
     *
     * Ordering edges are a stronger statement than access: two systems that touch
     * nothing in common may still have been ordered on purpose, and starting the
     * second beside the first would silently ignore that.
     */
    private dependenciesFor;
    /** Liveness: a system ran, so its owning subsystem stepped this frame. */
    private markSystemStepped;
    /**
     * Report one system's failure. Pausing stops the schedule from STARTING
     * anything else; what is already in flight still has to be waited for, since
     * a promise cannot be taken back.
     */
    private reportSystemError;
    private updateTime;
}
/**
 * How the host provides the render surface the C++ renderer binds to — the single
 * seam every platform's renderer init flows through:
 *   - `gl-context`: an emscripten-registered WebGL2 context handle (web/desktop/WeChat).
 *   - `webgpu`: the host acquired a GPUDevice (navigator.gpu) and passed it as the
 *     module factory's `preinitializedWebGPUDevice` before instantiation; the engine
 *     owns the swapchain, resolving the canvas via `canvasSelector` (default '#canvas',
 *     via document.querySelector — so the canvas must be in the DOM).
 *   - `default`: the module resolves its own surface (module.initRenderer()).
 *
 * Native (wasm-on-JSC, no DOM): the host injects the device AND an already-built
 * CAMetalLayer/ANativeWindow surface, so `{ kind: 'webgpu' }` omits `canvasSelector`
 * and must not reach the '#canvas' fallback.
 */
type RenderSurfaceSource = {
    readonly kind: 'gl-context';
    readonly handle: number;
    /** The context is WeChat's EmscriptenGLX one, whose GL calls the linked
     *  library issues natively rather than through the JS glue. */
    readonly glx?: boolean;
} | {
    readonly kind: 'webgpu';
    readonly canvasSelector?: string;
    /** Configure the swapchain so the engine can read its own frames back
     *  (`captureFrame`). Fixed at surface configuration, hence here. */
    readonly readback?: boolean;
} | {
    readonly kind: 'default';
};
interface WebAppOptions {
    getViewportSize?: () => {
        width: number;
        height: number;
    };
    /**
     * How the host provides the render surface (WebGL2 context handle / WebGPU
     * device + swapchain / headless default). See {@link RenderSurfaceSource}.
     * Omitted ⇒ `{ kind: 'default' }` (module.initRenderer resolves its own).
     */
    renderSurface?: RenderSurfaceSource;
    plugins?: Plugin[];
    /** The realm's optional-native-module acquirer; set before plugins build so
     *  SpinePlugin (and later physics) can pull from it. See {@link App.sideModules}. */
    sideModules?: SideModuleHost;
    /** `sideModules` was made for this App alone, so quitting disposes it. See {@link App.setSideModules}. */
    ownsSideModules?: boolean;
    /**
     * Bitmask of render layers (bits 0..31) that sort by world Y within the
     * layer — top-down occlusion (lower on screen draws on top). Project-level
     * setting (Project Settings → Rendering); change later via Renderer.setYSortLayers.
     */
    ySortLayers?: number;
    /**
     * Bitmask of render layers (bits 0..31) that resolve by real depth instead of
     * painter's order — the 2.5D opt-in. Opaque draws in such a layer write the
     * depth buffer and sort front-to-back; blended ones test without writing and
     * stay back-to-front. A layer that also y-sorts keeps y-sorting.
     * Project-level setting (Project Settings → Rendering).
     */
    depthLayers?: number;
    /**
     * Project color space (Project Settings → Rendering). 'linear' renders in
     * linear light: sRGB decode on sample, linear blending in sRGB-format
     * intermediates, and an explicit linear→sRGB encode in the final blit.
     * Must be declared at app creation — shaders compile against it.
     */
    colorSpace?: 'gamma' | 'linear';
    /**
     * The curve the frame applies on its way to the display, once and last. `aces`
     * engages the capture the way an effect does, so a scene that asks for one goes
     * through the graph even with an empty stack. Declared by the host for now — it
     * is not yet a field of the project manifest. See {@link OutputTransform}.
     */
    outputTransform?: OutputTransform;
    /**
     * Scene-target multisampling (Project Settings → Rendering). 1 turns it off;
     * 4 is the default and what a browser gives its own drawing buffer. The
     * device clamps it, so this is what the project WANTS, not what it gets.
     */
    msaaSamples?: number;
    quality?: QualityConfig;
    /**
     * Seed the engine's randomness so this run reproduces — a replay, a bug
     * report, a pixel assertion. Absent, every run differs, which is what a
     * player wants of particles.
     */
    randomSeed?: number;
    /**
     * Project camera fit (Project Settings → Display). When set with a real
     * scaleMode (≥ 0), the MAIN scene camera letterboxes this design resolution
     * into the actual aspect regardless of any UI Canvas; omitted / scaleMode = -1
     * keeps the legacy behavior (Canvas fit when present, else raw orthoSize). See
     * {@link ScreenScaling}.
     */
    screenFit?: ScreenScalingData;
}
/**
 * Install a {@link Plugin} from a project bundle — the module-level twin of
 * {@link App.addPlugin}, and the door a plugin PACKAGE is installed through: a
 * bundle is imported before an App exists.
 *
 * @experimental
 */
declare function addPlugin(plugin: Plugin): void;
/**
 * Install everything a project bundle registered at module level. One door, so a
 * host cannot drain half of it — plugins first, because a project's own system
 * may read a resource one of them inserts.
 *
 * @experimental
 */
declare function flushPendingRegistrations(app: App): void;

export { ABI_LAYOUT_HASH, Added, And, App, AssetRefCounter, AssetScope, Assets, BUNDLE_MODES, Billboard, BitmapText, BlendMode, Camera, Canvas, Catalog, Changed, Children, Commands, CommandsInstance, CompressedTextureFormat, CullMode, DEFAULT_SCREEN_SCALING, DOMAIN_SCRIPTS, DOMAIN_UNATTRIBUTED, Disabled, Draggable, DragonBonesAnimation, EntityCommands, EventReader, EventReaderInstance, EventRegistry, EventWriter, EventWriterInstance, GamepadAxis, GamepadButton, GetWorld, GroupOpacity, HttpBackend, Impostor, Input, InputPlugin, InputState, Light, LightProbeVolume, LocalTransform, Localization, LocalizationAPI, MATERIAL_FORMAT_VERSION, MAX_PRESENT_WAIT_MS, MESH_MAX_BONES, ManifestModel, Marker, Material, MeshChannel, MeshChannelType, MeshRenderer, MissingAssetsError, Mut, Name, NativeMemoryProvider, Not, Occluder, Or, Parent, ParticleCollider, ParticleEmitter, ParticleForceField, PlanarReflection, PostProcess, PostProcessAPI, PostProcessStack, PostProcessVolume, Query, QueryInstance, RAW_PAYLOAD_UPLOAD, ReflectionProbe, Removed, RemovedQueryInstance, RenderDemand, RenderPipeline, RuntimeOnly, SCENE_FORMAT_VERSION, SCREEN_FIT_OFF, ScaleMode, SceneLoadCancelled, SceneManager, SceneManagerState, SceneOwner, Schedule, ScreenOverlay, ScreenScaling, ShaderSources, ShadowCaster2D, ShapeRenderer, SortingGroup, SpineAnimation, SpringBone, SpringBoneCollider, Sprite, SpriteAnimation, SpriteAnimationAPI, SpriteAnimator, SpriteMask, SubsystemRegistry, SystemRunner, TilemapLayer, TimeOfDay, TrailRenderer, Transform, UNTIMED_SCOPE_LABEL, Velocity, Weather, With, Without, World, WorldTransform, addPlugin, addStartupSystem, addSystem, addSystemSetToSchedule, addSystemToSchedule, atlasCatalogFields, buildFrameProfile, certifyBounds, clearDrawCallbacks, clearUserComponents, compressedUploadDecision, contains, decodeMesh, defaultPluralSelector, defineComponent, defineEvent, defineSystem, defineSystemSet, defineTag, encodeChannelTable, encodeMesh, enumOptions, envelopeFor, findEntityByName, flushPendingRegistrations, getAddressableType, getAddressableTypeByEditorType, getAllAssetExtensions, getAssetMimeType, getAssetTypeEntry, getComponent, getComponentAssetFieldDescriptors, getComponentAssetFields, getComponentDefaults, getComponentFieldMeta, getComponentRegistry, getComponentSkeletalFieldDescriptor, getCustomExtensions, getEditorType, getReplicatedFields, getUserComponent, getUserComponentFingerprint, getUserComponents, getWeChatPackOptions, inputEventCallbacks, inputPlugin, interpolate, isBuiltinComponent, isCustomExtension, isKnownAssetExtension, isTextureRef, loadComponent, loadSceneData, loadSceneWithAssets, looksLikeAssetPath, matchLocale, mayDeferWorldPose, meanFrameProfile, migrateSceneData, normalizeBundleMode, packChannels, parseLocaleTable, pseudoLocalize, readPtrField, registerComponent, registerDrawCallback, registerPreSceneDrawCallback, registerSceneComponentCodec, remapEntityFields, resetWorldTo, scanObservedBounds, sceneOutOfBandFields, scopeDomain, selectPluralForm, serializeScene, setupBounds, shutdownMaterialAPI, spineCullingContractFrom, spineManifestContractFrom, textureFormatOf, textureImportSettingsFrom, unregisterComponent, unregisterDrawCallback, unregisterPreSceneDrawCallback, updateCameraAspectRatio, worldBounds, wrapSceneSystem, writePtrField };
export type { AddedWrapper, AddressableAssetType, AddressableManifest, AddressableManifestAsset, AddressableManifestGroup, Ambiguity, AnyComponentDef, AotHost, AotManifest, AotSystemDecl, ApplyUpdateResult, AssetContentType, AssetFieldMeta, AssetFieldType, AssetLease, AssetLoader, AssetRef, AssetRefInfo, AssetTypeEntry, Backend, BasisTranscoder, BillboardData, BitmapTextData, BoxCollider3DData, BuiltinComponentDef, BundleMode, CacheCleanupPreview, CacheCleanupResult, CameraData, CameraRenderParams, CanvasData, CapsuleCollider3DData, CatalogData, CatalogEntry, ChangedWrapper, CharacterController3DData, ChildrenData, CommandsDescriptor, ComponentData, ComponentData$1, ComponentDef, ComponentHeap, ComponentMetadata, ComponentsData, ContentCacheEntry, ContentCacheReport, ConvexCollider3DData, CookedAtlasInfo, DeferredRecord, DraggableData, DragonBonesAnimationData, DrawCallback, DrawFrameInfo, EditorAssetType, EventDef, EventReaderDescriptor, EventWriterDescriptor, FieldMeta, FilterExpr, FlattenContext, FlattenResult, FrameCosts, FrameProfile, FrameProfileInput, FrameTiming, GetWorldDescriptor, GroupOpacityData, HdrFormat, ImpostorData, InferParam, InferParams, JsonResult, LightData, LightProbeVolumeData, LoadContext, LocalTransformData, LocaleCatalog, LocaleEntry, LocaleResult, LocaleTableAsset, MarkerData, MaterialAssetData, MaterialData, MaterialHandle, MaterialOptions, MemoryProvider, MeshChannelDesc, MeshCollider3DData, MeshData, MeshMorphTargets, MeshRendererData, MeshRendererGeometry, MissingAssetCallback, MutWrapper, NameData, NativeComponentBufferFn, NestedPrefabRef, OccluderData, OutputTransform, ParentData, ParsedTextureImportSettings, ParticleColliderData, ParticleEmitterData, ParticleForceFieldData, PlanarReflectionData, Plugin, PluginDependency, PluralCategory, PluralForms, PluralSelector, PostProcessVolumeData, PreSceneDrawCallback, PreSceneDrawInfo, PrefabData, PrefabEntityData, PrefabEntityId, PrefabOverride, PreparedPrefab, ProcessedEntity, ProfileNode, ProfileNodeKind, PseudoLocalizationOptions, QueryArg, QueryBuilder, QueryCost, QueryDescriptor, QueryResult, ReflectionProbeData, RemovedQueryDescriptor, RenderOnDemandOptions, RenderParams, RenderReadiness, RenderReadinessStamp, RenderSurfaceSource, RigidBody3DData, RunCondition, SceneComponentCodec, SceneComponentData, SceneConfig, SceneContext, SceneData, SceneEntityData, SceneLoadOptions, SceneLoadProgressCallback, SceneMigrationResult, SceneOwnerData, SceneStatus, ScopeCost, ScopeRemainder, ScreenOverlayData, ScreenScalingData, ShaderHandle, ShadowCaster2DData, ShapeRendererData, SkeletalFieldMeta, SliceBorder, SortingGroupData, SphereCollider3DData, SpineAABB, SpineAnimationData, SpineBoundsSource, SpineCullingContract, SpineCullingEnvelope, SpineCullingRect, SpineEraBinding, SpineEraClaim, SpineLoadResult, SpineManifestContract, SpinePair, SpineScanCoverage, SpringBoneColliderData, SpringBoneData, SpriteAnimClip, SpriteAnimEvent, SpriteAnimEventHandler, SpriteAnimFrame, SpriteAnimatorData, SpriteData, SpriteMaskData, SubsystemActivity, SubsystemEvent, SubsystemPhase, SubsystemStatus, SystemCost, SystemDef, SystemOptions, SystemParam, SystemSet, SystemSetOptions, SystemTouches, TParams, TextureFormatRecord, TextureFormatReport, TextureRef, TextureResult, TextureUploadDecision, TextureUploadReason, TilemapLayerData, TimeOfDayData, TouchPoint, TrailRendererData, TransformData, TransitionOptions, UniformValue, UnwrapQueryArg, UpdateStages, UpdateStatus, UploadedGpuFormat, VelocityData, Viewport, WeatherData, WebAppOptions, WorldTransformData };
