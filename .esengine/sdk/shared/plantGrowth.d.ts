import { Entity } from './wasm.js';
import { MeshData, AssetLease, AssetScope, App } from './app.js';
import { ResourceDef } from './resource.js';

/**
 * @file    builder.ts
 * @brief   Where plants stand, and the geometry of a patch of them.
 *
 * @details A field of grass is tens of thousands of blades and a forest is thousands of trees, which no engine draws one entity at a time. The
 *          ground is cut into cells and every cell is ONE mesh with all its plants in it, so a field is a few hundred draws that
 *          culling can drop whole. Each cell is built at the detail its distance deserves — fewer, broader blades; a tree
 *          reduced to two crossed cards — and the engine's own level-of-detail picks among them.
 *
 *          What the wind needs is painted into the vertices, because a plant is not a thing the vertex stage can see once it is
 *          merged: the colour's red is how far up the plant the vertex is (the tip moves and the root does not), green is a
 *          phase of the plant's own so a meadow does not sway as one, and blue is how much light reaches it (the base of a
 *          clump is darker). The Foliage material reads them; a mesh drawn without it shows them as colour, so a field with
 *          no material is painted in its own colours instead.
 */

/** One plant, in the space of the cell that holds it. */
interface Plant {
    x: number;
    y: number;
    z: number;
    /** Turn about the vertical, radians. */
    yaw: number;
    scale: number;
    /** How many times wider it is than its scale makes it, across the ground only: a far version's plant, standing for those left out. 1 when absent. */
    spread?: number;
    /** How far its top (the last tenth of its height) is tipped over, in radians, toward the way it is turned: a far version's flower. 0 when absent. */
    tilt?: number;
    /** 0 to 1: its own phase in the wind, and how dark its roots are. */
    phase: number;
    shade: number;
    /** The ground's normal it leans with (a stone on a slope), after its turn; upright when absent. */
    up?: readonly [number, number, number];
    /** Who it is, within what grew it: what became of it is kept against this. Only a kind that can be touched has one. */
    key?: string;
    /** How far it leans, sideways per unit of height along x and z: a shear, so any material bends with it. */
    shear?: readonly [number, number];
}
/** What a place is, as the ground answers: how high it is and how much it faces up. */
type Ground = (x: number, z: number) => {
    y: number;
    up: number;
} | null;
interface ScatterParams {
    /** The cell: its centre and its side, in the space the ground answers in. */
    centerX: number;
    centerZ: number;
    size: number;
    count: number;
    seed: number;
    /** An integer naming the cell, so two cells never roll the same dice. */
    cellKey: number;
    minScale: number;
    maxScale: number;
    /** The least a place may face up (the normal's y) and still grow something. */
    minUp: number;
    heightMin: number;
    heightMax: number;
}
/** A deterministic 32-bit generator: the same seed grows the same field on every host. */
declare function rng(seed: number): () => number;
/**
 * The plants of one cell: `count` tries at random places, each kept only where the ground is gentle enough and in the height band.
 * Positions come back relative to the cell's centre, with the ground's height already in them.
 */
declare function scatterCell(p: ScatterParams, ground: Ground): Plant[];
/** How blades are drawn. */
interface BladeParams {
    height: number;
    width: number;
    /** Segments up a blade; the more, the smoother its bend. */
    segments: number;
    /** How far the tip is thrown over, as a share of the blade's height, the way the blade faces. 0.12 when absent. */
    lean?: number;
    /** Every n-th plant only, drawn broader to make up for the ones left out. */
    thin: number;
    /** Paint a colour the plain material shows, instead of the wind's weights. */
    paint?: {
        base: [number, number, number];
        tip: [number, number, number];
    } | null;
    /** Which version of its cell this mesh is, 0 the near one to 3, written to every vertex for the Foliage shader to draw it only in its own band of distances. Absent: drawn at any. */
    band?: number;
}
/**
 * A patch of grass: a tapered, slightly bent blade for each plant, facing where its yaw says. The normal leans toward the ground's up
 * so a meadow is lit as one surface and not as ten thousand knives.
 */
declare function buildGrassMesh(plants: readonly Plant[], blade: BladeParams): MeshData;
declare function buildInstancedMesh(source: MeshData, plants: readonly Plant[], paint?: BladeParams['paint'], band?: number, seats?: boolean): MeshData;
/**
 * Copies of an authored mesh, one per plant, as one mesh, with every channel of the source kept: the colour, the second uv and the tangent that a
 * normal map reads are what the artist made, and the wind's painted weights do not replace them (see buildInstancedMesh for a mesh that is painted).
 * Each copy is turned about the vertical, scaled, leaned with the ground where it has an `up`, and placed; positions, normals and tangents are carried, other channels are copied as they are.
 */
declare function buildPlacedMesh(source: MeshData, plants: readonly Plant[]): MeshData;
/**
 * The mesh with its normals turned toward up by `amount` (0 leaves them, 1 makes them all up): a card that stands for a crown lit as a rounded thing
 * rather than as the flat it is. A copy; the source is shared by every plant of the kind.
 */
declare function softenNormals(source: MeshData, amount: number): MeshData;
/**
 * The plants a far version draws, when it draws a share `keep` of them (above 0 to 1): every n-th, n the nearest whole number to 1 / keep, each grown by the
 * square root of n (to a most of twice) so the ground they cover is what it was. The same plants every time: what is kept is a matter of order.
 * `already` is how many times thinner the plants were planned than they would be (a far plan with sparser spacing): the n-th is then every n / `already`-th.
 */
declare function thinPlants(plants: readonly Plant[], keep: number, already?: number): readonly Plant[];
/** The rectangle of the plant's texture a card shows, in uv. */
interface CardRect {
    u0: number;
    v0: number;
    u1: number;
    v1: number;
}
/**
 * The far version of a plant: two cards crossed at right angles, as wide and as tall as the plant is, each showing the rectangle of the
 * plant's texture that is its picture. Cheap enough that a forest on the horizon is a few triangles a tree, and seen from any side.
 */
declare function buildBillboardMesh(plants: readonly Plant[], width: number, height: number, rect: CardRect, paint?: BladeParams['paint'], triangle?: boolean): MeshData;

/**
 * @file    plantKind.ts
 * @brief   What a kind of plant is made of, as data: the shape both a `PlacedFoliage` and a world's recipes name plants by.
 *
 * @details Types and a constant only, so the world-generation module can describe a plant without carrying the code that grows it.
 */
/** One part of a kind: what is drawn, and with what. Paths are the project's. */
interface PlacedPart {
    mesh: string;
    /** A cheaper mesh with the same parts, drawn past the kind's `lodDistance`; empty draws the mesh to the end. */
    lod1Mesh: string;
    /** A cheaper still, drawn from the kind's `lod2Distance`; empty or absent keeps the cheaper mesh to the end of the kind's reach. */
    lod2Mesh?: string;
    material: string;
    texture: string;
    tint: [number, number, number, number];
    /** False for a part that is blended (glass, a decal): it is drawn after what is solid. */
    opaque: boolean;
    /**
     * How far its normals are turned to face up, 0 to 1 (default 0): for a flat card that stands for a crown, which lit by its own normal is bright
     * on the side the sun is on and a dark slab on the other. A crown is lit as a rounded thing, and facing up is how a card is.
     */
    soft?: number;
    /** False for a part that casts no shadow (default true): the ground cover that is a hand's width tall, which is drawn into the shadow map for nothing. */
    castShadows?: boolean;
}
/**
 * What a kind of plant does when something comes near. Every length but `activationDistance` is in the plant's own units, multiplied by its scale.
 *
 * @experimental
 */
interface PlantInteractionDef {
    /** How near a `FoliageContact` a plant becomes an entity, in world units. 0 keeps it data, which also leaves it untouchable. */
    activationDistance?: number;
    /** The capsule that stands for it to physics, while it is near: its radius and height. Either 0 has none. */
    radius?: number;
    height?: number;
    /** How far it leans from what touches it, in radians. 0 stands firm. */
    bend?: number;
    /** What `damage` must take to fell it. 0 cannot be felled that way. */
    health?: number;
    /** Seconds it takes to come down. 0 is gone at once. Default 1.8. */
    fallSeconds?: number;
    /** How far it comes down, in degrees. Default 85: a crown takes the ground before a trunk does. */
    fallAngle?: number;
    /** Seconds it lies before it sinks away. Default 30. */
    lieSeconds?: number;
    /** The kind it leaves when felled, a stump: an index into the kinds, or a plant's name in `WorldRules.plants`. Absent leaves nothing. */
    felledKind?: number | string;
    /** How many times `harvest` can take from it. 0 cannot be harvested. */
    yields?: number;
    /** The kind it becomes with nothing left to take, a bare bush. Absent leaves nothing. */
    harvestedKind?: number | string;
    /** Seconds after felling or the last harvest before it stands again, grown back. 0 is never. */
    regrowSeconds?: number;
}
/** A kind of plant: its parts, and how far it is drawn. */
interface PlacedKind {
    parts: PlacedPart[];
    /** Past this the cheaper mesh stands in. */
    lodDistance: number;
    /**
     * Past this the parts' `lod2Mesh` stands in for the cheaper mesh (default 0: none). The cheaper mesh of a tree is half the triangles of the first, still
     * thousands, and from far enough they cover a few pixels each, which is dear for what they show; the third is a tenth.
     */
    lod2Distance?: number;
    /** Past this the kind is not drawn as itself. */
    drawDistance: number;
    /**
     * The hierarchical level of detail: what stands for the kind from `drawDistance` out to `farDistance`, once the plants themselves are too small to
     * draw: parts of their own (a tree's crossed cards, with the atlas they were baked to), merged a cell at a time like the plants are. Empty has none.
     */
    far: PlacedPart[];
    farDistance: number;
    /**
     * The share of the plants its far version draws, above 0 to 1 (default 1): the others are left out and the ones kept grown to make up their cover, so
     * ground cover far off costs a share of what it does near, and the ground's own texture carries the rest. A kind with no cards of its own may use its
     * cheaper mesh as its far version, thinned.
     */
    farKeep?: number;
    /** What it does when something comes near. Absent, it is only ever drawn. */
    interaction?: PlantInteractionDef;
}
/**
 * A kind a world's recipes name (`WorldRules.plants`): the same, with the colourings the art gives it and how far it is sunk into the ground.
 *
 * `tints` are linear multipliers on the parts' colour, which a place takes one of by a slow noise (`tintScale` world units to a stand), so a wood has
 * warm and cool stands and not a speckle. Absent, the kind is as made.
 */
interface PlantKind extends PlacedKind {
    tints?: [number, number, number][];
    tintScale?: number;
    /** How far a plant is sunk into the ground, in world units: a stone's buried underside. */
    sink?: number;
    /** World units to a unit of the plant's mesh: 100 for plants modelled in metres in a world of centimetres. A recipe's `scale` is then a size relative to the model. Default 1. */
    unit?: number;
}
/** Numbers a record takes in `PlacedFoliage.records`: the kind's index, x, y, z in the entity's space, the turn about the vertical in radians, and the scale. */
declare const PLACED_STRIDE = 6;

/** A part with what it needs in hand: the handles of its meshes (shared by every cell) and of its material and texture. */
interface ReadyPart {
    part: PlacedPart;
    mesh: number;
    lod1: number;
    lod2?: number;
    material: number;
    texture: number;
}
/** Every kind's parts in hand, and the parts that stand for each far off; `owned` are the meshes made here, which `releaseKinds` gives back. */
interface ReadyKinds {
    kinds: ReadyPart[][];
    far: ReadyPart[][];
    owned: number[];
    lease: AssetLease<AssetScope>;
}
/** One set of placements in a cell: the entity holding them, the kind and the plants it was made for. */
interface PlacementSet {
    entity: Entity;
    kind: number;
    plants: readonly Plant[];
    /** Made to show plants that turned into this kind (a stump), rather than the ones grown as it. */
    turned: boolean;
}
/** One grown cell: its entity (none where nothing stands), what it owns so far, and whether it has been let go. */
interface GrownCell {
    entity: Entity | null;
    handles: number[];
    dead: boolean;
    assets?: AssetLease<AssetScope>;
    /** Its placement sets, kept where a plant in it can change; absent, they are made and forgotten. */
    sets?: PlacementSet[];
}
/** Who decides what a cell's sets show, where its plants can be touched. */
interface PlacementObserver {
    placementsOf(cell: GrownCell, set: PlacementSet): readonly Plant[];
    removeCell(cell: GrownCell): void;
}
/** The growth of every plant in an app: the pieces waiting. */
declare class PlantGrowth {
    /** The pieces not yet made, in the order they were asked. */
    readonly queue: {
        cell: GrownCell;
        run: () => void;
    }[];
    app_: App | null;
    /** @internal Installed with the plant interaction, the first time a kind wants it. */
    observer_: PlacementObserver | null;
    /** How many pieces are still waiting to be made. */
    get pending(): number;
    /** Pieces made so far, and the milliseconds spent making them: what the growth has cost, for a profile to read. */
    made: number;
    spentMs: number;
    /**
     * Makes one entity under `parent` that draws `part`'s mesh at every place in `plants`, relative to `parent`. `from` and `to` are the distances
     * from the eye between which a plant is drawn (0 for no limit); `lod` is the distance past which the part's cheaper mesh stands in, and `shadow` the one past which it casts no shadow. All of them are scaled by the quality level's `detailScale`.
     */
    private place;
    /** Tells the engine where a set's plants stand. An empty list clears it. */
    private writePlacements;
    /** @internal Writes a set as its observer says it should be now. */
    writeSet(app: App, cell: GrownCell, set: PlacementSet): void;
    /** Places a set, remembering it where the cell's plants can change, and shows it as it should be now. */
    private track;
    /** @internal The sets that show plants that have turned into `kindIndex`, made at once: there are few, and a stump must stand when its tree starts down. */
    placeTurned(app: App, cell: GrownCell, kinds: readonly PlacedKind[], ready: ReadyKinds, kindIndex: number): void;
    /**
     * Grows `cell`, whose entity the caller has made and stands at the cell's centre: the plants of each kind in `byKind` (relative to that centre),
     * a piece of work a kind's part.
     */
    growCell(app: App, cell: GrownCell, kinds: readonly PlacedKind[], ready: ReadyKinds, byKind: ReadonlyMap<number, readonly Plant[]>): void;
    /**
     * Grows the far version of `cell`: each kind with one, its plants (thinned to the kind's `farKeep`) as a set of the far part's, drawn from
     * where the kind stops (`drawDistance`) out to `farDistance` from the eye. Cheap enough (a tree is two cards) to be made at once. `thinnedBy` is how many
     * times thinner they were planned already (a far plan), so they are not thinned twice.
     */
    growFar(app: App, cell: GrownCell, kinds: readonly PlacedKind[], ready: ReadyKinds, byKind: ReadonlyMap<number, readonly Plant[]>, _at?: {
        x: number;
        z: number;
        half?: number;
    }, thinnedBy?: number): void;
    /** Lets a cell go: what it made is despawned, and what it had not yet made is left unmade. */
    release(app: App, cell: GrownCell): void;
    /** One frame of it: the far versions shown where they should be, and the queue worked through while the frame's budget lasts, one piece at least. */
    step(app: App): void;
}
/** The resource every plant's growth shares. @experimental */
declare const PlantGrowthRes: ResourceDef<PlantGrowth>;
/** The App's plant growth, installed (with the system that steps it) on first use. */
declare function plantGrowthOf(app: App): PlantGrowth;

export { PLACED_STRIDE, PlantGrowth, PlantGrowthRes, buildBillboardMesh, buildGrassMesh, buildInstancedMesh, buildPlacedMesh, plantGrowthOf, rng, scatterCell, softenNormals, thinPlants };
export type { BladeParams, CardRect, Ground, GrownCell, PlacedKind, PlacedPart, PlacementSet, Plant, PlantInteractionDef, PlantKind, ReadyKinds, ScatterParams };
