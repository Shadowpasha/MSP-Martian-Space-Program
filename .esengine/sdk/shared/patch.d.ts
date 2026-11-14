import { TerrainData, PlanetProvider, PlanetPainter, PageImage, PageTable } from './planetQuery.js';
import { ComponentDef, Plugin, App, AssetLoader, LoadContext, MeshData } from './app.js';
import { Color, Entity } from './wasm.js';

/**
 * @file    paint.ts
 * @brief   Which paint a point of ground takes, by how high and how steep it is.
 */

/** The weights of grass, dirt, snow and rock at a point of ground, by how high (0 to 1 of the terrain) and how steep it is. */
declare function paintWeights(h: number, ny: number, t: Pick<TerrainData, 'rockSlope' | 'dirtHeight' | 'snowHeight'>): [number, number, number, number];

/**
 * @file    sphere.ts
 * @brief   Ground on a sphere: which squares of a cube's faces to draw, and where a square's point stands on the planet.
 *
 * @details A planet is a cube whose six faces are each a quadtree, with every point pushed out onto the sphere: a node is a square of a face
 *          (`level`, `ix`, `iz`), drawn with the same patch as flat ground, and its points are cut by distance exactly as the flat quadtree's
 *          are (quadtree.ts), only the distance is to the node's bounding sphere and the top of the tree is six faces round the planet's centre.
 *
 *          A face is (u, v) in -1 to 1. The point on the cube is `normal + tan(u * PI / 4) * a + tan(v * PI / 4) * b`, normalised: the tangent
 *          spreads the squares evenly by angle, so a node's size on the ground varies by a third from the middle of a face to its corner and not
 *          by two; it is closed in both directions (`direction` and `faceOf`), which is what lets a point be named by the face it is on.
 *
 *          Nothing here touches a renderer or a terrain: positions are in the planet's own space, its centre the origin and its radius `radius`.
 */
/** The six faces of the cube: the outward normal, and the directions u and v grow along. Each is a right-handed frame (a x b = normal). */
declare const FACES: readonly {
    normal: readonly [number, number, number];
    a: readonly [number, number, number];
    b: readonly [number, number, number];
}[];
/** One square of a face: its level (0 the finest), its place in that level's grid on the face, and the face. */
interface SphereNode {
    face: number;
    level: number;
    ix: number;
    iz: number;
}
/** What the tree is cut by. */
interface SphereTreeParams {
    /** The planet's radius, in metres. */
    radius: number;
    /** The ground's least and most height above the radius: the vertical extent every node's bound is measured with. */
    minHeight: number;
    maxHeight: number;
    /** The side of a level-0 node, in metres along the ground. */
    leafSize: number;
    /** The distance within which level 0 is drawn; each level's is twice the one below's. */
    range0: number;
}
/** The unit direction from the planet's centre to the point (u, v) of a face. */
declare function direction(face: number, u: number, v: number, out?: [number, number, number]): [number, number, number];
/** The face a direction falls on and where on it: the inverse of `direction`. */
declare function faceOf(dx: number, dy: number, dz: number): {
    face: number;
    u: number;
    v: number;
};
/** The side of a node of `level` on its face, in the face's -1 to 1 units. */
declare const nodeSpan: (levels: number, level: number) => number;
/** How many levels a planet needs so that the finest node is about `leafSize` metres a side (to the nearest power of two): the top level's node is a whole face. */
declare function levelsFor(radius: number, leafSize: number): number;
/** The corner of a node, in its face's units: u0, v0 and the span. */
declare function nodeRect(levels: number, node: SphereNode): {
    u0: number;
    v0: number;
    span: number;
};
/** The point of a node on the planet at (s, t) in 0 to 1 across it, at `height` above the radius, in the planet's space. */
declare function nodePoint(p: SphereTreeParams, levels: number, node: SphereNode, s: number, t: number, height: number, out?: [number, number, number]): [number, number, number];
/**
 * A sphere that holds every point of the node whatever the ground's height is: centred on the node's middle at the middle of the height range,
 * as far across as the node's corners and the full height range between them.
 */
declare function nodeBound(p: SphereTreeParams, levels: number, node: SphereNode): {
    x: number;
    y: number;
    z: number;
    r: number;
};
/**
 * How far the eye is from a node, measured on the shell of ground at the eye's own height (held to the ground's range): a node under the eye is at no
 * distance however high or low the ground there turns out to be, as a flat node's box is for an eye between its least and most height. A bound that
 * held the whole height range would be a few hundred metres across even for the finest node and split everything near it a level too far.
 */
declare function nodeDistance(p: SphereTreeParams, levels: number, node: SphereNode, ex: number, ey: number, ez: number): number;
/** The range of level `level`: where its nodes end and the next level's begin. */
declare const sphereRange: (p: Pick<SphereTreeParams, "range0">, level: number) => number;
/**
 * The nodes to draw for an eye at (ex, ey, ez) in the planet's space, coarse to fine. Every point of the planet is covered by exactly one node: a node
 * nearer the eye than the level below's range is split into its four children, and the six faces' top nodes are where it begins.
 */
declare function selectSphereNodes(p: SphereTreeParams, ex: number, ey: number, ez: number, levels?: number): SphereNode[];
/** The node of `level` on `face` that holds (u, v). */
declare function nodeAt(levels: number, face: number, level: number, u: number, v: number): SphereNode;
/** A key that names a node, for the pages and the children a terrain keeps by it. */
declare const sphereNodeKey: (n: SphereNode) => string;

/** What a planet page is made against. */
interface PlanetPageSource {
    provider: PlanetProvider;
    world: string;
    seed: number;
    version: number;
    radius: number;
    /** The levels of the planet's tree (see sphere.ts). */
    levels: number;
    minHeight: number;
    maxHeight: number;
    /** What paints the ground over the provider's paint, if anything does; asked for each page, so one that is set later is used from then on. */
    paint?: () => PlanetPainter | null;
}
/** The frame at a unit direction on a face: the face's u and v directions made perpendicular to it. */
declare function tangentFrame(face: number, d: readonly [number, number, number], eu: [number, number, number], ev: [number, number, number]): void;
/** Samples a node's page: the grid's directions go to the provider, and what comes back is encoded. May answer later, as the provider may. */
declare function makePlanetPage(src: PlanetPageSource, node: SphereNode): PageImage | Promise<PageImage>;

/**
 * @file    planetPlugin.ts
 * @brief   The `Planet` component: ground on a sphere, drawn as six quadtrees round the eye, from a provider a game names.
 *
 * @details The same machinery as flat ground (terrainPlugin.ts) with a sphere under it: the tree is cut by the eye's distance to each node (sphere.ts), a
 *          node is the one shared patch drawn as an instance, its page (heights, normals, paint) is made from the provider by direction (planetPages.ts) into
 *          the one atlas, and the Planet shader (planetShader.ts) puts every vertex of the patch on the sphere. From the ground the finest nodes are under the
 *          eye; from space the whole planet is a handful of coarse ones, so a planet seen from far off and from underfoot is one thing.
 *
 *          The planet entity is its centre and stands unrotated and unscaled: its children are the nodes, placed in its space. The first slice draws the ground;
 *          collision, the layers' textures, the sea and the sky of a round world are the next ones.
 */

/** The fields of the `Planet` component. @experimental */
interface PlanetData {
    /** The planet's radius in metres. */
    radius: number;
    /** The generator the ground is made by (registerPlanetProvider), the world it belongs to as the game names it, its version and its seed. */
    provider: string;
    world: string;
    generatorVersion: number;
    seed: number;
    /** The finest cell of the ground's mesh, in metres, and how far out the finest cells reach before the ground coarsens (above 1 is further). */
    cellSize: number;
    detail: number;
    /** The four layers' colours: grass, dirt, snow, rock. */
    layerColor0: Color;
    layerColor1: Color;
    layerColor2: Color;
    layerColor3: Color;
    /** The size, in metres, of the ground's own wander in brightness, and how strong it is (0 to 1). */
    macroScale: number;
    macroVariation: number;
    /** Whether bodies and characters collide with the ground; how far round each thing that moves it is built for collision; its layer and friction. */
    collision: boolean;
    collisionDistance: number;
    collisionLayer: number;
    friction: number;
    /** Whether the planet has a sea: a sphere at `seaLevel` above the radius, which the ground that dips below it stands in. */
    sea: boolean;
    seaLevel: number;
    /** The sea's colour and how much of it there is over what is under it (0 to 1). */
    seaColor: Color;
    seaOpacity: number;
    /** How hard the planet pulls what is on it, in metres a second squared at the surface; 0 pulls nothing. Bodies are pulled toward the centre of the nearest planet that pulls (physics3d/planetGravity.ts). */
    gravity: number;
    /** The terrain layers (`.esterrainlayer` files, up to four) the ground is drawn with, in the order the paint weighs them. Empty draws the four layer colours. */
    layers: string[];
}
/**
 * Ground on a sphere. Presence is the opt-in; its children are the quadtree's nodes.
 *
 * @experimental
 */
declare const Planet: ComponentDef<PlanetData>;
interface Built {
    signature: string;
    data: PlanetData;
    provider: PlanetProvider | null;
    /** What the planet is made against, and how its tree is cut. */
    source: PlanetPageSource | null;
    tree: SphereTreeParams | null;
    epoch: number;
    table: PageTable;
    heights: number;
    paint: number;
    mesh: number;
    instance: number;
    nodes: Map<string, Entity>;
    spare: Entity[];
    wanted: Map<string, SphereNode>;
    asked: Set<string>;
    pending: boolean;
    failure: string | null;
    /** The layers' texture arrays, what they were packed from, and whether a packing is in hand. */
    arrays: number[];
    packed: string;
    packing: boolean;
    /** The registry's revision when the provider was last looked for, so a late registration is noticed. */
    providers: number;
    /** The painters' revision the pages were last painted at. */
    painted: number;
    /** The sea's entity, mesh and material instance, when the planet has one. */
    sea: {
        entity: Entity;
        mesh: number;
        material: number;
        base: number;
    } | null;
}
/** Where a planet stands: still being made, ready, or failed (with why). */
interface PlanetStatus {
    state: 'loading' | 'ready' | 'failed';
    reason?: string;
}
/** The planets of an app, for what asks about them. @experimental */
declare class Planets {
    readonly built_: Map<number, Built>;
    /** How a planet stands, or null for an entity that is not one. */
    status(entity: Entity): PlanetStatus | null;
}
declare class PlanetPlugin implements Plugin {
    name: string;
    /** No planet, no work; the frame after the last one goes still lets it go. */
    readonly activeWhen: ComponentDef<PlanetData>[];
    private stock_;
    private planets_;
    build(app: App): void;
    cleanup(app?: App): void;
    /** What a planet is made against, from its fields: its provider, and the cut its tree is made with. */
    private make;
    /** The stock material: the Planet shader, compiled once. */
    private stock;
    private prepare;
    private eye;
    /** Chooses the nodes for the eye, makes the pages they want within the budget, and places the nodes. */
    private draw;
    /** The sea: a sphere at the sea level standing at the planet, made when the planet has one and let go when it has not. */
    private keepSea;
    private seaPending_;
    /** Makes the sea: the sphere, a material on the Planet Sea shader that blends over what is under it and is hidden by what is nearer, and the entity. */
    private makeSea;
    private dropSea;
    /** Packs the layers into the arrays the material reads, when what they name changed: the ground keeps the arrays it has until the new ones are made. */
    private pack;
    /** Makes the wanted pages, coarse and near first, for as long as the frame can spare. */
    /** One node's page: made by a worker when the planet's provider can be loaded in one, here when it cannot. */
    private pageOf;
    private makePages;
    /** Puts a node entity on each node drawn (reusing the ones it had), and takes the rest away. */
    private place;
    private destroy;
}
declare const planetPlugin: PlanetPlugin;

/**
 * @file    layers.ts
 * @brief   A terrain layer (`.esterrainlayer`): one kind of ground (grass, a path's dirt, sand, rock) as the textures an artist made for it,
 *          and how they are laid; and the layers of a terrain packed into the texture arrays its shader reads.
 *
 * @details A layer names up to three textures, read as data and laid by world position:
 *            - albedo: the colour (sRGB);
 *            - normal: a tangent-space normal map, green up (the OpenGL convention);
 *            - mask: red the ambient occlusion, green the roughness, blue the height (where two layers meet, the higher shows).
 *          A texture a layer leaves out is made up: white albedo, a flat normal, and a mask of no occlusion, the layer's `roughness` and
 *          half height. The layers are packed at one size (the largest of their textures, to a power of two within `maxSize`), the tint
 *          multiplied into the albedo and the normal's strength into its slope, so the shader reads three arrays and nothing per layer
 *          but its tile.
 */

/** One kind of ground, as a `.esterrainlayer` file holds it. @experimental */
interface TerrainLayerDef {
    /** Project paths of the textures (see the file's notes); an empty or missing one is made up. */
    albedo?: string;
    normal?: string;
    mask?: string;
    /** How many world units one repeat of the textures covers. */
    tile: number;
    /** Multiplies the albedo, 0 to 1 a channel. */
    tint: [number, number, number];
    /** The roughness where there is no mask, 0 to 1. */
    roughness: number;
    /** How strongly the normal map bends the light: 1 as drawn, 0 flat. */
    normalStrength: number;
    /**
     * How much the layer's own height decides where it meets another, 0 to 1: 0 blends by the paint alone (a smooth edge, for grass into sand),
     * 1 by the layers' heights (stones standing through grass). Absent, it is the material's `u_heightBlend`.
     */
    heightBlend?: number;
}
/** A layer from a file's JSON, with what it leaves out at its defaults; throws naming the first field it cannot take. */
declare function parseTerrainLayer(json: unknown, file?: string): TerrainLayerDef;
/** Loads `.esterrainlayer` files as checked layers. @experimental */
declare class TerrainLayerAssetLoader implements AssetLoader<TerrainLayerDef> {
    readonly type = "terrain-layer";
    readonly extensions: string[];
    load(path: string, ctx: LoadContext): Promise<TerrainLayerDef>;
    unload(): void;
}
/** An image read as data: RGBA, top row first. */
interface LayerImage {
    width: number;
    height: number;
    pixels: Uint8Array;
}
/** A layer with its textures read (null where it has none). */
interface LayerSource {
    def: TerrainLayerDef;
    albedo: LayerImage | null;
    normal: LayerImage | null;
    mask: LayerImage | null;
}
/** The layers packed: one image a layer in each of the three arrays, all `size` by `size`. */
interface PackedLayers {
    size: number;
    albedo: Uint8Array[];
    normal: Uint8Array[];
    mask: Uint8Array[];
    tiles: number[];
    heightBlends: number[];
}
/** Packs `layers` into the three arrays, at the size of their largest texture to a power of two no larger than `maxSize`. */
declare function packLayers(layers: readonly LayerSource[], maxSize?: number): PackedLayers;

/**
 * @file    patch.ts
 * @brief   The one patch every quadtree node of the ground is drawn with.
 *
 * @details A flat grid of `cells` by `cells` over 0 to 1 in x and z, its uv the same; its box runs 0 to 1 in y as well, because the
 *          Terrain shader lifts it to the node's page and the node's scale.y is its page's height range, so culling sees the ground's true box.
 */

declare function buildPatchMesh(cells: number, flipped?: boolean): MeshData;

export { FACES, Planet, PlanetPlugin, Planets, TerrainLayerAssetLoader, buildPatchMesh, direction, faceOf, levelsFor, makePlanetPage, nodeAt, nodeBound, nodeDistance, nodePoint, nodeRect, nodeSpan, packLayers, paintWeights, parseTerrainLayer, planetPlugin, selectSphereNodes, sphereNodeKey, sphereRange, tangentFrame };
export type { LayerImage, LayerSource, PackedLayers, PlanetData, PlanetPageSource, PlanetStatus, SphereNode, SphereTreeParams, TerrainLayerDef };
