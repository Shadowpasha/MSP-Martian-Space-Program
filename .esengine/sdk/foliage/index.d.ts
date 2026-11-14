export { Foliage, FoliageData, FoliageField, FoliagePlugin, FoliageRes, foliagePlugin } from '../shared/foliagePlugin.js';
import { ComponentDef, App, Plugin } from '../shared/app.js';
import { ResourceDef } from '../shared/resource.js';
import { PlacedKind, ReadyKinds, Plant, GrownCell, PlacementSet } from '../shared/plantGrowth.js';
export { BladeParams, CardRect, Ground, PLACED_STRIDE, PlacedPart, PlantGrowth, PlantGrowthRes, PlantInteractionDef, PlantKind, ScatterParams, buildBillboardMesh, buildGrassMesh, buildInstancedMesh, buildPlacedMesh, plantGrowthOf, rng, scatterCell, softenNormals, thinPlants } from '../shared/plantGrowth.js';
import { Entity } from '../shared/wasm.js';

/** The fields of the `PlacedFoliage` component. @experimental */
interface PlacedFoliageData {
    sizeX: number;
    sizeZ: number;
    cellSize: number;
    kinds: PlacedKind[];
    records: number[];
    /** The name a save keeps what became of these plants under. Empty takes the entity's name. */
    stateKey: string;
}
/**
 * Plants placed by hand. Presence is the opt-in; its children are the cells near the eye.
 *
 * @experimental
 */
declare const PlacedFoliage: ComponentDef<PlacedFoliageData>;
interface BuiltPlaced {
    signature: string;
    data: PlacedFoliageData;
    /** The kinds' parts once their assets are in hand. */
    ready: ReadyKinds | null;
    /** The records sorted into cells (`cz * 1000 + cx`), by kind, the first time a cell asks. */
    cells: Map<number, Map<number, Plant[]>> | null;
    epoch: number;
    retired: boolean;
}
/** Run-time facts about the placed foliage. */
declare class PlacedFoliageField {
    /** @internal */ readonly built_: Map<number, BuiltPlaced>;
    /** @internal */ app_: App | null;
    /** How many meshes are still waiting to be made, across every plant in the app. */
    get pending(): number;
    /** How many cells are grown and standing now, across every entity. */
    get cellCount(): number;
}
declare class PlacedFoliagePlugin implements Plugin {
    name: string;
    build(app: App): void;
    cleanup(app?: App): void;
    private retire;
    /** Reads the geometry and makes the handles of every part of every kind; the cells wait for it. */
    private start;
    private cellsAcross;
    /**
     * The cells as two layers of chunks: the near one, wanted out to the furthest `drawDistance` and grown a few milliseconds a piece, and the far one
     * (the hierarchical level of detail), wanted out to the furthest `farDistance` and cheap enough that the whole area stands at once.
     */
    private layers;
    /** Sorts the records into cells and kinds, once. */
    private sort;
}
/** The resource the plugin installs. @experimental */
declare const PlacedFoliageRes: ResourceDef<PlacedFoliageField>;
declare const placedFoliagePlugin: Plugin;

/** The fields of the `FoliageContact` component. @experimental */
interface FoliageContactData {
    /** How far from the entity plants lean away, in world units. */
    radius: number;
    /** How hard: 1 is a full lean, 0 none. */
    strength: number;
    /** Seconds grass takes to stand up again behind it. */
    recovery: number;
    /** Off: it neither bends plants nor brings them near. */
    enabled: boolean;
}
/**
 * Something plants feel: grass and shrubs lean away from it, and the plants near it become entities with colliders.
 *
 * @experimental
 */
declare const FoliageContact: ComponentDef<FoliageContactData>;
/** The fields of the `PlantProxy` component. @experimental */
interface PlantProxyData {
    /** The table the plant's state is kept in: a world's, or a `PlacedFoliage`'s. */
    source: string;
    /** The plant, within its source. */
    key: string;
}
/**
 * Marks the entity standing in for a plant while something is near it. What a ray or a collision hits; `PlantInteraction.of` says which plant it is.
 *
 * @experimental
 */
declare const PlantProxy: ComponentDef<PlantProxyData>;
/** What has become of a plant. @experimental */
type PlantState = 'standing' | 'felled' | 'harvested' | 'removed';
/** One plant as a game asks about it. @experimental */
interface PlantRef {
    source: string;
    key: string;
    /** The kind it shows now: a felled tree's stump is a kind of its own. */
    kind: number;
    x: number;
    y: number;
    z: number;
    scale: number;
    state: PlantState;
    /** What is left of its `health`. */
    health: number;
    /** How many more times it can be harvested. */
    yields: number;
    /** Its `PlantProxy`, while something is near. */
    entity: Entity | null;
}
/** Something that happened to a plant. @experimental */
interface PlantEvent {
    type: 'activated' | 'deactivated' | 'damaged' | 'felled' | 'landed' | 'harvested' | 'removed' | 'regrown';
    plant: PlantRef;
}
/** The saved form of what has become of the plants. @experimental */
interface PlantSaveState {
    version: 1;
    clock: number;
    plants: {
        source: string;
        key: string;
        state: PlantState;
        shownAs: number;
        health: number;
        yields: number;
        regrowAt: number;
    }[];
}
/** Everything plants know about being touched. @experimental */
declare class PlantInteraction {
    /** @internal */ app_: App | null;
    private readonly cells_;
    private readonly changes_;
    private readonly active_;
    private readonly falling_;
    /** Plants coming back: when they started, on the clock. */
    private readonly growing_;
    private readonly listeners_;
    private clock_;
    private untilScan_;
    /** The most plants that are entities at once; a contact in a thicket past this finds the furthest still data. */
    maxActive: number;
    /** The most made per frame, so walking into a wood costs a few frames and not one long one. */
    maxActivatedPerFrame: number;
    /** How many plants are entities now. */
    get activeCount(): number;
    /** How many plants have had something happen to them, across every source: what a save holds. */
    get changedCount(): number;
    /** Hears what happens to plants. Returns what stops it. */
    on(listener: (event: PlantEvent) => void): () => void;
    /** The plant an entity stands for, a `PlantProxy` that a ray or a collision found. */
    of(entity: Entity): PlantRef | null;
    /** A plant by its source and key, where its cell is grown now. */
    find(source: string, key: string): PlantRef | null;
    /** The plants with an `interaction` within `radius` of a place on the ground, nearest first: what an axe swung here could reach. Cut ones are not among them. */
    near(x: number, z: number, radius: number): PlantRef[];
    /** Takes `amount` of a plant's `health`, and fells it at nothing left, away from `from` where given. False for a plant that cannot be hurt. */
    damage(plant: PlantRef, amount: number, from?: {
        x: number;
        z: number;
    }): boolean;
    /** Brings a plant down, toward a direction on the ground or along its own turn. Only what still stands; false otherwise. */
    fell(plant: PlantRef, toward?: {
        x: number;
        z: number;
    }): boolean;
    /** Takes up to `amount` from a plant, and answers how much it got. At nothing left it becomes its `harvestedKind`, or is gone until it regrows. */
    harvest(plant: PlantRef, amount?: number): number;
    /** Takes a plant away with no fall, for good: what a building placed over it or a game's own rule does. */
    remove(plant: PlantRef): boolean;
    /** Everything that has become of the plants, for a save. A tree coming down is saved as down. */
    saveState(): PlantSaveState;
    /** Puts the plants back as a save has them, whatever is grown now. What had fallen and not gone yet is gone. */
    loadState(state: PlantSaveState): void;
    /** @internal A cell of plants has been planted: the kinds with an `interaction` are known from now on. */
    addCell(grown: GrownCell, source: string, kinds: readonly PlacedKind[], ready: ReadyKinds, byKind: ReadonlyMap<number, readonly Plant[]>, half: number): void;
    /** @internal A far cell: nothing near enough to touch, so only what stands for a felled plant needs to go. It is told apart by having no reach. */
    addFarCell(grown: GrownCell, source: string, kinds: readonly PlacedKind[], ready: ReadyKinds): void;
    /** @internal What a cell's set should show now: its plants less those that have gone, each as it leans or grows. */
    placementsOf(grown: GrownCell, set: PlacementSet): readonly Plant[];
    /** @internal A cell has been let go: its entities go with it, and what became of its plants stays. */
    removeCell(grown: GrownCell): void;
    /** @internal */
    step(dt: number): void;
    private contacts;
    /** Which plants should be entities, within what each kind says, and which no longer should. */
    private scan;
    private activate;
    private spawnProxy;
    /** A capsule standing on the plant's foot. The physics module is optional and read by name; a game without it has plants with no collision and no complaint. */
    private insertCollider;
    private deactivate;
    /** Each active plant toward where its contacts push it, with a spring, so it rustles on being let go. */
    private lean;
    private regrow;
    private advanceGrowth;
    /** It comes down as an entity with its own meshes, turning about its foot: a shape a character can be hit by and then climb over. */
    private startFall;
    private advanceFalls;
    private endFall;
    private refreshCell;
    /** The sets that show plants as another kind than they were grown, made the first time one is wanted in a cell. */
    private ensureShown;
    /** The far cells of a source, which show every plant of theirs that has not gone. */
    private writeFar;
    private writeCell;
    private writeKind;
    private growth;
    private cellAt;
    /** The kind a plant shows now, or -1 where nothing is there. */
    private kindNow;
    private resolveKind;
    private located;
    private changeFor;
    private refOf;
    private emit;
}
/** The resource plants are touched through. @experimental */
declare const PlantInteractionRes: ResourceDef<PlantInteraction>;
/** The App's plant interaction, installed (with its system) the first time a kind wants it. */
declare function plantInteractionOf(app: App): PlantInteraction;

export { FoliageContact, PlacedFoliage, PlacedFoliageField, PlacedFoliagePlugin, PlacedFoliageRes, PlacedKind, Plant, PlantInteraction, PlantInteractionRes, PlantProxy, placedFoliagePlugin, plantInteractionOf };
export type { FoliageContactData, PlacedFoliageData, PlantEvent, PlantProxyData, PlantRef, PlantSaveState, PlantState };
