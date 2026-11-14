import { Entity, Color } from './wasm.js';
import { Plugin, ComponentDef, App } from './app.js';
import { ResourceDef } from './resource.js';

/**
 * @file    field.ts
 * @brief   The ground as a volume: a signed distance at every point of a grid, cut into chunks, that can be carved and filled.
 *
 * @details Below zero is solid. A height field has one answer per column, so it cannot hold a cave or an overhang; this has one per point.
 *          A chunk keeps its own copy of a margin one sample wide round it, so that it can be meshed alone and two chunks still agree where
 *          they meet. Only what was edited has to be kept: the rest is the source's answer, made again when it is next needed, which is what
 *          lets a world without end cost what the player changed in it. Distances are stored in a byte, clamped to a few cells: a
 *          surface needs to know its distance only close by.
 */
/** How many layers of material a volume has. */
declare const VOXEL_MATERIALS = 4;
/** What a place in the volume is. @experimental */
interface VoxelSample {
    /** How far to the surface, in world units: below zero is solid. Near the surface it should be about true; far from it, only the sign counts. */
    distance: number;
    /** Which of the volume's materials it is, 0 to 3. */
    material: number;
}
/** Says what is at a place, relative to the volume's entity, into `out`. The same place must always get the same answer. @experimental */
type VoxelSource = (x: number, y: number, z: number, out: VoxelSample) => void;
/** @experimental */
interface VoxelPoint {
    x: number;
    y: number;
    z: number;
}
/** A shape to carve with or fill by, in the coordinates of the field. @experimental */
type VoxelShape = {
    kind: 'sphere';
    center: VoxelPoint;
    radius: number;
} | {
    kind: 'box';
    center: VoxelPoint;
    halfExtents: VoxelPoint;
} | {
    kind: 'capsule';
    from: VoxelPoint;
    to: VoxelPoint;
    radius: number;
};
/** @experimental */
type VoxelOp = 'subtract' | 'add' | 'paint';
/** @experimental */
interface VoxelEditOptions {
    /** What `add` fills with and `paint` paints. Defaults to 0. */
    material?: number;
    /** How far the shape's edge melts into what it meets, in world units. 0 keeps it sharp. */
    smooth?: number;
    /** Materials this edit cannot change, by a function of the material: stone a pick cannot break. */
    keep?: (material: number) => boolean;
}
/** What an edit did. @experimental */
interface VoxelEditResult {
    /** The volume taken out of each material, in cubic world units: what a miner carries away. */
    removed: number[];
    /** The volume added, in cubic world units. */
    added: number;
    /** How many chunks changed. */
    chunks: number;
}
/** Where a ray met a volume. @experimental */
interface VoxelHit {
    point: VoxelPoint;
    normal: VoxelPoint;
    distance: number;
    material: number;
}
/** A volume's changes, as a save stores them, chunk by chunk. Plain JSON. @experimental */
interface VoxelFieldData {
    version: 1;
    cellSize: number;
    chunkCells: number;
    /** By `cx,cy,cz`: its distances and materials, run-length coded, in base64. */
    chunks: Record<string, string>;
}
interface VoxelFieldOptions {
    cellSize: number;
    chunkCells: number;
    minY: number;
    maxY: number;
    source: VoxelSource;
    /** How many chunks nothing edited are held once read, so a ray or a dig does not ask the source again. Defaults to 64. */
    cached?: number;
}
/** One chunk: `(cells + 2)` samples a side, from -1 to `cells`. */
interface VoxelChunk {
    readonly cx: number;
    readonly cy: number;
    readonly cz: number;
    readonly key: string;
    distances: Int8Array | null;
    materials: Uint8Array | null;
    edited: boolean;
    /** Whether any sample is solid and any is not. Known once it has been read. */
    surfaced: boolean;
    revision: number;
    savedRevision: number;
    touched: number;
}
declare class VoxelField {
    readonly cellSize: number;
    readonly chunkCells: number;
    readonly side: number;
    readonly rowMin: number;
    readonly rowMax: number;
    private readonly floorY_;
    private readonly ceilingY_;
    /** The world distance a stored byte's 127 stands for. */
    private readonly range_;
    private readonly source_;
    private readonly cached_;
    private readonly chunks_;
    private readonly dirty_;
    private readonly sample_;
    private clock_;
    constructor(options: VoxelFieldOptions);
    /** The chunk, holding its samples. Asks the source when nothing holds them. */
    chunk(cx: number, cy: number, cz: number): VoxelChunk;
    private generate_;
    /** Lets go of what the source can make again, oldest first, past the number to hold. What `keep` names stays and is not counted: asking the source again is what a dig must not wait on. */
    trim(keep?: (chunk: VoxelChunk) => boolean): void;
    /** The chunks changed since this was last asked. */
    takeDirty(): VoxelChunk[];
    /** Carves, fills or paints with a shape. Everything it reaches, the margins of the chunks round it included, changes together. */
    apply(shape: VoxelShape, op: VoxelOp, options?: VoxelEditOptions): VoxelEditResult;
    private refreshSurfaced_;
    private at_;
    /** The signed distance at a place, read between the samples. */
    distanceAt(x: number, y: number, z: number): number;
    /** The material of the deepest solid sample round a place, or -1 where all round it is air. */
    materialAt(x: number, y: number, z: number): number;
    /** Where a ray from `origin` first meets something solid, within `maxDistance`. `direction` need not be of any length. */
    raycast(origin: VoxelPoint, direction: VoxelPoint, maxDistance: number): VoxelHit | null;
    private hit_;
    /** What the save holds: every chunk edited, or only those changed since the last call that asked for `changedOnly`. */
    serialize(changedOnly?: boolean): VoxelFieldData;
    /**
     * Puts saved chunks back over the volume. With `merge` those not named stay as they are; otherwise they go back to the source. A save cut from another grid cannot
     * be read and changes nothing: false. A chunk that cannot be read is left as it was, and named in `skipped`.
     */
    restore(data: VoxelFieldData, merge?: boolean, skipped?: string[]): boolean;
    /** How many chunks are held with their samples, and how many of those were edited. */
    get held(): {
        chunks: number;
        edited: number;
    };
}

/** The fields of the `VoxelTerrain` component. @experimental */
interface VoxelTerrainData {
    /** The side of a cell, in world units: the finest thing the ground can show. */
    cellSize: number;
    /** How many cells a chunk has a side: what one edit makes again at the least. */
    chunkCells: number;
    /** How far down and up the volume goes from the entity. It is closed at both ends. */
    minY: number;
    maxY: number;
    seed: number;
    surfaceHeight: number;
    hillHeight: number;
    hillScale: number;
    caveWidth: number;
    caveScale: number;
    soilDepth: number;
    oreAmount: number;
    /** How far from the eye it is drawn, in world units. */
    drawDistance: number;
    castShadows: boolean;
    /** Whether 3D bodies and characters collide with it. */
    collision: boolean;
    /** How far round each moving body and character it is built for collision. */
    collisionDistance: number;
    collisionLayer: number;
    friction: number;
    /** A material on the Voxel Ground shader, or 0 for the stock one with the colours and pictures below. */
    material: number;
    color0: Color;
    color1: Color;
    color2: Color;
    color3: Color;
    map0: number;
    map1: number;
    map2: number;
    map3: number;
    /** How long one repeat of the pictures is in the world. */
    tile: number;
}
/**
 * Ground that is a volume. Presence is the opt-in; the entity's position places it, and its rotation and scale do not apply.
 *
 * @experimental
 */
declare const VoxelTerrain: ComponentDef<VoxelTerrainData>;
/** What a volume is doing. @experimental */
interface VoxelTerrainStatus {
    /** Chunks drawn, the triangles they hold, and the chunks with collision. */
    drawnChunks: number;
    triangles: number;
    collidingChunks: number;
    /** Chunks held with their samples, those edited (what a save holds), and those waiting to be made again. */
    heldChunks: number;
    editedChunks: number;
    waitingChunks: number;
    /** The milliseconds the last chunk took to make again. */
    lastRebuildMs: number;
}
/** What an edit changed, relative to the world. @experimental */
interface VoxelEditEvent {
    entity: Entity;
    shape: VoxelShape;
    op: VoxelOp;
    result: VoxelEditResult;
}
interface DrawnChunk {
    entity: Entity;
    mesh: number;
    triangles: number;
}
interface Built {
    entity: Entity;
    signature: string;
    field: VoxelField;
    origin: VoxelPoint;
    data: VoxelTerrainData;
    drawn: Map<string, DrawnChunk>;
    /** The columns made to be drawn and to be collided with. */
    drawnColumns: Set<string>;
    collidedColumns: Set<string>;
    collided: Set<string>;
    waiting: Map<string, VoxelChunk>;
    instance: number;
    pending: boolean;
    epoch: number;
    lastRebuildMs: number;
}
/** What a game asks of its volumes. Places are in the world. @experimental */
declare class VoxelTerrains {
    /** @internal */ app_: App | null;
    /** @internal */ readonly built_: Map<number, Built>;
    /** @internal */ readonly sources_: Map<number, VoxelSource>;
    /** @internal */ readonly sourceIds_: Map<VoxelSource, number>;
    private readonly listeners_;
    /** Sets what the volume is before anyone digs in it, in place of the stock hills. The same place must always get the same answer. */
    setSource(entity: Entity, source: VoxelSource | null): void;
    /** The volume's own field: made here if the system has not yet got to it, so a game can edit in the frame it spawned it. */
    private fieldOf_;
    /** @internal */ ensure_: ((entity: Entity) => Built | null) | null;
    /** Changes the volume with a shape. Every chunk the shape reaches is made again, and the collision with it. */
    edit(entity: Entity, shape: VoxelShape, op: VoxelOp, options?: VoxelEditOptions): VoxelEditResult | null;
    /** Carves a shape out of the volume. What it answers is how much of each material came out. */
    carve(entity: Entity, shape: VoxelShape, options?: VoxelEditOptions): VoxelEditResult | null;
    /** Fills a shape with a material. */
    fill(entity: Entity, shape: VoxelShape, material?: number, options?: VoxelEditOptions): VoxelEditResult | null;
    /** Hears every edit that changed something: what a game keeps a navmesh or a quest in step by. Returns how to stop. */
    onEdit(listener: (event: VoxelEditEvent) => void): () => void;
    /** Where a ray first meets any volume, within `maxDistance`. */
    raycast(origin: VoxelPoint, direction: VoxelPoint, maxDistance?: number): (VoxelHit & {
        entity: Entity;
    }) | null;
    /** The signed distance at a place: below zero is inside something solid. Null with no such volume. */
    distanceAt(entity: Entity, at: VoxelPoint): number | null;
    /** The material at a place, or -1 in the open. Null with no such volume. */
    materialAt(entity: Entity, at: VoxelPoint): number | null;
    /** What a save holds: only chunks that were edited, and with `changedOnly` only those changed since the last such call. Plain JSON. */
    serialize(entity: Entity, changedOnly?: boolean): VoxelFieldData | null;
    /** Puts a save back; with `merge`, over what is there rather than instead of it. False when it was cut from another grid and nothing changed. */
    restore(entity: Entity, data: VoxelFieldData, merge?: boolean): boolean;
    /** Whether the volume round (x, z) is built for collision: what a game waits on before it drops something there. */
    collisionReadyAt(entity: Entity, x: number, z: number): boolean;
    status(entity: Entity): VoxelTerrainStatus | null;
}
/** @experimental */
declare const VoxelTerrainsRes: ResourceDef<VoxelTerrains>;
/** Makes and keeps every `VoxelTerrain`. @experimental */
declare class VoxelPlugin implements Plugin {
    name: string;
    readonly activeWhen: ComponentDef<VoxelTerrainData>[];
    private stock_;
    build(app: App): void;
    cleanup(app?: App): void;
    /** The volume's state: made again when what it is made from has changed. */
    private ensure;
    private prepare;
    private stock;
    private rows;
    /** One chunk's skin, and its surface data, or null where nothing passes through. */
    private skin;
    private showChunk;
    private colliderOf;
    /** The chunks edits reached, for as long as the frame can spare and at least one, so a dig is always seen. */
    private remake;
    private draw;
    private collide;
    private destroy;
}
/** @experimental */
declare const voxelPlugin: VoxelPlugin;

/**
 * @file    source.ts
 * @brief   What a volume is before anyone digs in it: hills with caves through them, or any height field given a body.
 */

/** The material of each part of the stock ground. @experimental */
declare const VoxelMaterial: {
    readonly Topsoil: 0;
    readonly Soil: 1;
    readonly Rock: 2;
    readonly Ore: 3;
};
/** @experimental */
interface VoxelNoiseParams {
    seed: number;
    /** Where the ground lies on average, relative to the volume's entity. */
    surfaceHeight: number;
    /** How far the hills rise and fall from it, and how wide they are, in world units. */
    hillHeight: number;
    hillScale: number;
    /** How wide the tunnels are, in world units; 0 has none. */
    caveWidth: number;
    /** How far apart the tunnels are, in world units. */
    caveScale: number;
    /** How deep the soil goes before rock, in world units. */
    soilDepth: number;
    /** The share of the rock that is ore, 0 to 1. */
    oreAmount: number;
    /** The side of the volume's cells. The corners a vertex reads reach about two cells in, so topsoil thinner than that shows soil through in a pattern. Defaults to 1. */
    cellSize?: number;
}
/** Hills, with tunnels where two sheets of noise cross, soil over rock, and pockets of ore. @experimental */
declare function noiseVoxelSource(params: VoxelNoiseParams): VoxelSource;
/**
 * A body under a height field: solid below `heightAt`, so a Terrain's own ground, or any other, can be dug into as a volume. The answer must be
 * the same for the same place, and null where it knows no height is air.
 *
 * @experimental
 */
declare function heightVoxelSource(heightAt: (x: number, z: number) => number | null, material?: (depth: number, sample: VoxelSample) => void): VoxelSource;

export { VOXEL_MATERIALS, VoxelField, VoxelMaterial, VoxelPlugin, VoxelTerrain, VoxelTerrains, VoxelTerrainsRes, heightVoxelSource, noiseVoxelSource, voxelPlugin };
export type { VoxelEditEvent, VoxelEditOptions, VoxelEditResult, VoxelFieldData, VoxelFieldOptions, VoxelHit, VoxelNoiseParams, VoxelOp, VoxelPoint, VoxelSample, VoxelShape, VoxelSource, VoxelTerrainData, VoxelTerrainStatus };
