import { ComponentDef, MeshData, App, Plugin } from './app.js';
import { ResourceDef } from './resource.js';

/**
 * @file    cellBuild.ts
 * @brief   One cell of a Foliage, from where its plants may stand to the geometry of them: the part that is only computation.
 *
 * @details Growing a cell is two things. Working out where its plants stand and what they look like — a few thousand questions of the
 *          ground, then tens of thousands of vertices — is arithmetic on data, 4 to 12 ms of it a cell. Putting the result in the world
 *          (two meshes on the GPU and an entity) is the engine's, and quick.
 *
 *          The first is here, as one function of plain data, so it runs the same wherever it is called: on a worker, which is where it
 *          belongs, or on the main thread where a worker cannot be given the ground (a terrain with modifiers laid on it, a game's own
 *          provider). One implementation is also why the two cannot come to disagree about a cell.
 */

/** A blade's or a plant's own colours, where no material paints it. */
type CellPaint = {
    base: [number, number, number];
    tip: [number, number, number];
} | null;
/** One cell to grow: plain data, so it can be sent to a worker as it is. */
interface FoliageCellSpec {
    /** The cell's centre and side in the world, and how many plants are tried in it. */
    centerX: number;
    centerZ: number;
    size: number;
    count: number;
    seed: number;
    cellKey: number;
    minScale: number;
    maxScale: number;
    minUp: number;
    heightMin: number;
    heightMax: number;
    /** The deepest water a plant may stand in. */
    waterDepth: number;
    /** How far from a zone's edge a plant is kept, and what it is kept out as. */
    zonePadding: number;
    tags: string[];
    /** The Foliage entity's height: the plants carry the ground's height relative to it. */
    baseY: number;
    /** The copies of a mesh carry, in a second uv, where each vertex of a head sits from its plant's axis: what a shader turns the head about. */
    seats?: boolean;
    paint: CellPaint;
    /**
     * The far versions: how many there are (1 to 3), the share of its plants each keeps of the one before, the most a kept plant is
     * grown by, and whether a mesh's far version is cards (a tree) or the plant itself, fewer and larger. With `only`, the cell is that one
     * version alone (0 the near one), marked with its band: each version is then a layer of cells of its own, grown only as far out as it is drawn.
     */
    far: {
        levels: number;
        keep: number;
        grow: number;
        cards: boolean;
        only?: number | null;
        up?: number;
        tilt?: number;
    };
    /** Grass, as blades of this size; or copies of a mesh, with the card its far version is drawn as. */
    look: {
        kind: 'grass';
        bladeHeight: number;
        bladeWidth: number;
        bladeLean?: number;
    } | {
        kind: 'mesh';
        card: {
            u0: number;
            v0: number;
            u1: number;
            v1: number;
        };
        tent: boolean;
    };
}

/** The fields of the `Foliage` component. @experimental */
interface FoliageData {
    /** The plant to scatter. Empty grows grass, blades made here. */
    mesh: number;
    /** A material on the Foliage shader, which makes the wind. Empty draws the plants in their own colours, still. */
    material: number;
    /** An image over the area whose red says how many of the plants stand where: none at 0, all the field asks at white. Empty grows them everywhere. */
    densityMap: number;
    /** An image over the area whose red says how large the plants stand where: full size at white, none at black. */
    scaleMap: number;
    /** A picture over the area that colours the plants by where they stand, mixed in by its alpha (the material's shader reads it). */
    colorMap: number;
    /** How much of the colour map is mixed in where its alpha is whole. */
    colorMapStrength: number;
    /** A strip of colours each plant takes the colour of its top from, by a number of its own: as wide a share of the strip, as many of the plants. */
    palette: number;
    /** How many far versions a cell has, 1 to 3: each is the same plants, fewer and larger, and takes over `farStep` times further out than the last. */
    farLevels: number;
    /** The share of its plants each far version keeps of the one before. They thin to it plant by plant before it takes over, so nothing jumps. */
    farKeep: number;
    /** How many times further out each far version takes over than the one before: the first at `lodDistance`. */
    farStep: number;
    /** The most a plant kept in a far version is grown by, to cover the ground the ones left out did. */
    farGrow: number;
    /** The share of that growth a mesh plant's height takes, 0 to 1: at 0 it grows across the ground only, at 1 the same every way. Grass grows broader, never higher. */
    farGrowUp: number;
    /** How far the top of a mesh plant is tipped over in its far versions, in degrees, each plant its own way round. */
    farTilt: number;
    /** How far the head of a mesh plant turns to face the eye, 0 to 1: at the eye, and half the draw distance away. */
    faceEyeNear: number;
    faceEye: number;
    /** A mesh's far version is crossed cards of its texture (a tree). Off, it is the plant itself, fewer and larger (a flower). */
    farCards: boolean;
    /** How far up a plant the colour map begins: 0 colours it whole, 0.6 only its top (a flower's head, on a mesh whose red rises to it). */
    colorMapFrom: number;
    /** The area, centred on the entity, and the side of the cells it is cut into. */
    sizeX: number;
    sizeZ: number;
    cellSize: number;
    /** Plants per cell. */
    count: number;
    seed: number;
    minScale: number;
    maxScale: number;
    /** The least a place may face up (0 to 1) and still grow something: lower lets plants onto slopes. */
    minUp: number;
    /** The band of heights, in world units, plants grow in. */
    heightMin: number;
    heightMax: number;
    /** How deep under water, in world units, a plant may stand: 0 keeps them on dry ground; reeds stand in the shallows. */
    waterDepth: number;
    /** Grass: how tall and how wide a blade is, at scale 1. */
    bladeHeight: number;
    bladeWidth: number;
    /** How far a blade's tip is thrown over, as a share of its height. */
    bladeLean: number;
    /** Distance past which a cell is drawn as its far version, and past which it is not drawn. */
    lodDistance: number;
    drawDistance: number;
    /** Whether the generated cells cast shadows. Disable for dense short grass; it still receives lighting and shadows. */
    castShadows: boolean;
    /** WorldGen world whose zones reserve roads and buildings. Empty uses its first world; no WorldGen leaves the field unchanged. */
    zoneWorld: string;
    /** Extra comma-separated exclusion tags, in addition to foliage and grass/tree. */
    zoneTags: string;
    /** Additional world-space clearance from a zone's boundary. */
    zonePadding: number;
    /** A tree's far version is two crossed cards showing this rectangle of its texture, as uv: left, bottom, right, top. */
    cardU0: number;
    cardV0: number;
    cardU1: number;
    cardV1: number;
    /** 1 draws a far tree's cards as tents (a conifer's outline) rather than rectangles. */
    cardTent: number;
}
/**
 * Plants across an area. Presence is the opt-in; its children are the cells that draw them.
 *
 * @experimental
 */
declare const Foliage: ComponentDef<FoliageData>;
interface BuiltFoliage {
    signature: string;
    data: FoliageData;
    source: MeshData | null;
    /** The field's own instance of its material (0 with none): what its cells are drawn with and where everything the field itself says is written, so two fields on one material do not write over each other. */
    instance: number;
    /** The density map's red, read once; null where the field has none. */
    density: {
        width: number;
        height: number;
        values: Uint8Array;
    } | null;
    scale: {
        width: number;
        height: number;
        values: Uint8Array;
    } | null;
    loading: boolean;
    epoch: number;
    /** What its cells are being grown for now: a cell that lands for an earlier one is not put in the world. */
    generation?: string;
    /** Its cells' geometry made on the workers, for the surroundings `key` names; null where they cannot be given those. */
    away?: {
        key: string;
        grow: ((cell: FoliageCellSpec) => Promise<MeshData[]>) | null;
    };
}
/** Run-time facts about the foliage the plugin has grown. */
declare class FoliageField {
    /** @internal */ readonly built_: Map<number, BuiltFoliage>;
    /** @internal The u_windStrength each material had before the weather's wind scaled it, to put back. */
    readonly authoredWind_: Map<number, number>;
    /** Instances of materials no field draws with any more, let go once the cells grown with them are gone. */
    readonly retired_: {
        instance: number;
        frames: number;
    }[];
    /** @internal */ app_: App | null;
    /** @internal Cells whose geometry has come back from a worker and is waiting to be put in the world, a few a frame. */
    readonly landed_: (() => void)[];
    /** How many cells near enough to be drawn, across every field, are still waiting to be grown. */
    get pending(): number;
    /** How many cells are grown and standing now, across every field. */
    get cellCount(): number;
    private statusOf_;
}
/** The resource the plugin installs. @experimental */
declare const FoliageRes: ResourceDef<FoliageField>;
declare class FoliagePlugin implements Plugin {
    name: string;
    /** No foliage, no work; the frame after the last one goes still runs its sweep. */
    readonly activeWhen: ComponentDef<FoliageData>[];
    private clearContacts_;
    build(app: App): void;
    /**
     * The weather's wind on the plants: each Foliage material's u_windStrength is its authored strength times the weather's `wind`, and is
     * put back when the weather is taken away or stops driving the wind. Only while the game runs, as the weather's lights are: in the
     * editor a material asset is left as authored, so previewing a storm never saves one.
     */
    private blow;
    cleanup(app?: App): void;
    /** Reads the plant's geometry, if it has one; the cells wait for it. */
    private start;
    /**
     * The field's cells as a layer of chunks: the area's grid, wanted out to `drawDistance` round the streaming sources, grown again
     * (each old cell kept till its new one stands) when a field, the ground or the water changes.
     */
    private layer;
    /** The field's density map where it lies in the world: over the whole area. */
    private densityOf;
    /** The same for its scale map. */
    private scaleOf;
    private mapOf;
    /** Writes the colour map and the palette to the field's instance of its material. */
    private wash;
    private cellsAcross;
    /**
     * What makes a Foliage's cells on the workers, when what they are grown against can be handed over as data: no terrain (a flat
     * area) or one a worker can rebuild, water that is baked or absent, and the zones, which are data already. Null when it cannot,
     * and the cells are made here. Worked out again only when the ground, the water or the zones change.
     */
    private awayFor;
    /**
     * Grows cell (cx, cz): its plants, their meshes and the entity that draws them, not yet in the world (its parent is set on publishing).
     * The geometry is made on a worker where `away` can make it, and the cell lands a frame or two later; else it is made here.
     */
    private grow;
    /** Puts a cell's geometry in the world: its meshes on the GPU and the entity that draws them (its parent is set on publishing). */
    private land;
    private sweep;
}
declare const foliagePlugin: Plugin;

export { Foliage, FoliageField, FoliagePlugin, FoliageRes, foliagePlugin };
export type { FoliageData };
