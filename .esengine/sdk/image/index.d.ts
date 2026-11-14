declare const IMAGE_BLENDS: readonly ["normal", "multiply", "screen", "overlay", "add", "softLight", "hardLight", "vividLight", "linearLight", "pinLight", "colorDodge", "colorBurn", "linearBurn", "darken", "lighten", "difference", "exclusion", "subtract", "divide", "hue", "saturation", "color", "luminosity"];
type ImageBlend = (typeof IMAGE_BLENDS)[number];
/** Adjustments of the picture so far. Any of them together, applied in this order. */
interface ImageAdjust {
    /** Stops, as a photo's: 1 is twice as bright. */
    exposure?: number;
    levels?: {
        input?: readonly [number, number];
        gamma?: number;
        output?: readonly [number, number];
    };
    /** [[in, out]...] 0..1 for all channels, or { r, g, b } for each. */
    curves?: readonly (readonly number[])[] | {
        r?: readonly (readonly number[])[];
        g?: readonly (readonly number[])[];
        b?: readonly (readonly number[])[];
    };
    brightness?: number;
    contrast?: number;
    temperature?: number;
    tint?: number;
    /** Each [r, g, b], -1..1, pushing that part of the tonal range. */
    balance?: {
        shadows?: readonly number[];
        midtones?: readonly number[];
        highlights?: readonly number[];
    };
    /** Degrees round the wheel, and -1..1 each. */
    hue?: number;
    saturation?: number;
    lightness?: number;
    vibrance?: number;
    /** true, or how much of [r, g, b] each makes the grey. */
    blackWhite?: boolean | readonly number[];
    gradientMap?: readonly (readonly [number, string])[];
    invert?: boolean;
    posterize?: number;
    threshold?: number;
}
/** Every filter and what it takes. A number but for: `at`, `from`, `to` a place; `color` a colour; `mono` true or false. */
declare const IMAGE_FILTERS: {
    readonly gaussian: readonly ["radius"];
    readonly motion: readonly ["angle", "distance"];
    readonly spin: readonly ["at", "angle"];
    readonly zoom: readonly ["at", "amount"];
    readonly lens: readonly ["radius", "highlights"];
    readonly sharpen: readonly ["amount", "radius", "threshold"];
    readonly highPass: readonly ["radius"];
    readonly noise: readonly ["amount", "scale", "mono", "seed"];
    readonly median: readonly ["radius"];
    readonly emboss: readonly ["angle", "height", "amount"];
    readonly ripple: readonly ["amount", "size", "seed"];
    readonly displace: readonly ["amount", "size", "seed"];
    readonly twirl: readonly ["at", "radius", "angle"];
    readonly pixelate: readonly ["cell"];
    readonly chromatic: readonly ["at", "amount"];
    readonly vignette: readonly ["at", "amount", "radius", "outer", "color"];
    readonly fog: readonly ["color", "density", "from", "to", "patchiness", "size", "seed"];
    readonly rays: readonly ["at", "threshold", "length", "strength", "decay"];
    readonly flare: readonly ["at", "size", "color", "strength"];
    readonly texture: readonly ["scale", "amount", "angle", "seed"];
};
type ImageFilterName = keyof typeof IMAGE_FILTERS;
declare const IMAGE_SOURCE_EXT = ".esimage";
declare const IMAGE_SOURCE_VERSION = 1;
declare const MAX_IMAGE_SIZE = 2048;
type ImageFill = string | {
    type: 'linear';
    from: readonly [number, number];
    to: readonly [number, number];
    stops: readonly (readonly [number, string])[];
} | {
    type: 'radial';
    at: readonly [number, number];
    radius: number;
    stops: readonly (readonly [number, string])[];
}
/** The same picture on every machine: it comes from `seed` and never from a random number. */
 | {
    type: 'noise';
    scale?: number;
    octaves?: number;
    seed?: number;
    stops: readonly (readonly [number, string])[];
}
/** By which way a figure's surface faces: 1 toward the light, 0.5 side on, 0 away. So light turns the form and does not sit on its edge. */
 | {
    type: 'form';
    figure: string;
    light?: readonly number[];
    stops: readonly (readonly [number, string])[];
}
/** The colour of an `image` layer at each place. */
 | {
    type: 'image';
    image: string;
}
/** Marks in rows and columns: windows, tiles, grilles. On four corners it lies in perspective. */
 | {
    type: 'grid';
    /** A cell's size in pixels, or with `quad` how many columns and rows there are. */
    cell?: readonly [number, number];
    cells?: readonly [number, number];
    /** Corners in order round: top left, top right, bottom right, bottom left. */
    quad?: readonly (readonly number[])[];
    /** The mark as a share of its cell, each 0..1. */
    mark?: readonly [number, number];
    colors: readonly string[];
    /** Between the marks; clear without it. */
    ground?: string;
    /** The share of marks that are on, 0..1, and what the rest show. */
    lit?: number;
    off?: string;
    seed?: number;
};
interface ImageEffect {
    type: 'shadow' | 'glow' | 'innerShadow' | 'innerGlow' | 'bevel' | 'overlay';
    /** A bevel: how wide, the light's direction in degrees, how strong, and the colour on its dark side. */
    size?: number;
    angle?: number;
    depth?: number;
    shade?: string;
    /** An overlay: what covers the shape. */
    fill?: ImageFill;
    blend?: ImageBlend;
    color?: string;
    x?: number;
    y?: number;
    blur?: number;
    opacity?: number;
}
interface ImageTransform {
    translate?: readonly [number, number];
    /** Degrees, clockwise on screen, about `origin`. */
    rotate?: number;
    scale?: number | readonly [number, number];
    /** Default the layer's middle. */
    origin?: readonly [number, number];
}
type ImageShape = 'rect' | 'circle' | 'ellipse' | 'ring' | 'polygon' | 'line' | 'star' | 'gear' | 'path' | 'pixels' | 'paint' | 'figure' | 'image' | 'text' | 'block' | 'perspective' | 'reflect' | 'bloom' | 'adjust' | 'filter' | 'group';
/** How a brush lays colour. Any of these on a stroke, a sweep or a field, over what its `brush` starts from. */
interface ImageBrushSettings {
    hardness?: number;
    opacity?: number;
    taper?: readonly [number, number];
    /** 1 round; lower is a flat brush, thin along its travel and wide across it. */
    roundness?: number;
    /** Degrees the flat of the brush is held at, which gives thick and thin as a pen does. Without it the brush turns with the stroke. */
    angle?: number;
    /** 0..1: how much the tooth of the paper breaks it up, in a texture fixed to the picture. */
    grain?: number;
    grainScale?: number;
    /** 0..1: how much the brush runs dry, in streaks along its travel. */
    dry?: number;
    /** 0..1: how much it picks up what is under it as it goes. */
    wet?: number;
    /** 0..1: pigment gathered at the edge, as watercolour dries. */
    edge?: number;
    /** Each dab this many brush radii off the line. */
    scatter?: number;
    /** The dabs as a share of the brush's size: small, and scattered, they are a spray. */
    dab?: number;
    /** Between dabs, as a share of a dab's width. */
    spacing?: number;
    /** 0..1: each dab adds this much, so paint builds where it passes, as an airbrush does, and opacity no longer caps it. */
    flow?: number;
    /** How much of the length at each end fades out, each 0..1. */
    fade?: readonly [number, number];
}
/** One movement of a brush. Replayed in order on a `paint` layer, so the same list is the same picture. */
interface ImageStroke extends ImageBrushSettings {
    /** A named brush from IMAGE_BRUSHES, which what else is given here overrides. */
    brush?: string;
    /** Through these, smoothly; a third number is pressure, 1 by default. One point is a dab. */
    points: readonly (readonly number[])[];
    color?: string;
    /** The colour it has become by the end. */
    to?: string;
    size: number;
    /** 1 is a hard edge, 0 fades from the middle. */
    hardness?: number;
    opacity?: number;
    /** How much of the length at each end narrows to a point, each 0..1. */
    taper?: readonly [number, number];
    /** Separate hairs across its width, which meet where it narrows. */
    bristles?: number;
    /** The width of a bristle; by default what spreads them across the stroke. */
    strand?: number;
    spread?: number;
    /** How far each bristle's lightness and strength differ, 0..1. */
    vary?: number;
    /** How far a bristle wanders from its line, in pixels. */
    wobble?: number;
    seed?: number;
    /** 0..1: drags what is already on this layer along, instead of laying colour. */
    smudge?: number;
    erase?: boolean;
    blend?: ImageBlend;
}
/** Many hairs between guide lines, gathered into locks. A few words of intent, and hundreds of strokes when drawn. */
interface ImageSweep extends ImageBrushSettings {
    type: 'sweep';
    brush?: string;
    /** Two or more lines, side by side and in order, each root to tip. */
    guides: readonly (readonly (readonly number[])[])[];
    /** Across the guides, first to last. */
    colors: readonly string[];
    count: number;
    /** What the colours have turned to by the tips. */
    tip?: string;
    /** The width of one hair. */
    size?: number;
    clumps?: number;
    /** How far hairs draw into their lock by the tips, 0..1. */
    gather?: number;
    /** The share of hairs that stray from the mass, 0..1. */
    flyaway?: number;
    vary?: number;
    wobble?: number;
    opacity?: number;
    taper?: readonly [number, number];
    seed?: number;
}
/** A region covered in strokes that follow a flow, each its colour from `tone` where it starts. */
interface ImageField extends ImageBrushSettings {
    type: 'field';
    brush?: string;
    /** An SVG path to start strokes in, or "@id" for where an earlier layer drew; the whole picture without it. Strokes may run over its edge. */
    region?: string;
    /** Lines the strokes follow, nearest the most, or a direction in degrees clockwise from right. */
    guides?: readonly (readonly (readonly number[])[])[];
    angle?: number;
    /** Where each stroke takes its colour; left out when it smudges. */
    tone?: ImageFill;
    /** 0..1: the strokes drag what is there along the flow, and lay no colour. */
    smudge?: number;
    size: number;
    length?: number;
    /** How many times over the strokes cover the region. */
    coverage?: number;
    /** Degrees either side of the flow. */
    spread?: number;
    vary?: number;
    opacity?: number;
    hardness?: number;
    seed?: number;
}
/** The same strokes again and again along a line: feathers, scales, leaves, beads. */
interface ImageAlong {
    type: 'along';
    line: readonly (readonly number[])[];
    count: number;
    /** Drawn with x along the line and y across it, about the point [0, 0]. */
    strokes: readonly ImageStroke[];
    /** How large they are at the start of the line and at the end. */
    scale?: number | readonly [number, number];
    /** Degrees, added to the line's direction. */
    turn?: number;
    /** Each one again, reflected across the line. */
    both?: boolean;
    /** Up to this far off their place, in pixels and a tenth as many degrees. */
    jitter?: number;
    seed?: number;
}
type ImageMark = ImageStroke | ImageSweep | ImageField | ImageAlong;
interface ImageLayer {
    id?: string;
    shape: ImageShape;
    at?: readonly [number, number];
    size?: readonly [number, number];
    radius?: number | readonly number[];
    radii?: readonly [number, number];
    inner?: number;
    count?: number;
    tooth?: number;
    turn?: number;
    points?: readonly (readonly [number, number])[];
    d?: string;
    rows?: readonly string[];
    palette?: Readonly<Record<string, string>>;
    scale?: number;
    layers?: readonly ImageLayer[];
    strokes?: readonly ImageMark[];
    /** "below": a paint layer's canvas starts as the picture so far, so its strokes and smudges work across everything under it. */
    from?: 'below';
    /** Seen when looking and left out of the .png, while what it masks still works. A figure is one unless told otherwise. */
    guide?: boolean;
    /** A figure: pixels from floor to crown, standing straight. */
    height?: number;
    /** A figure: degrees turned about the body, 0 facing the viewer, 90 facing picture right, 180 away. */
    yaw?: number;
    /** A figure: degrees seen from above. */
    pitch?: number;
    build?: {
        head?: number;
        shoulders?: number;
        chest?: number;
        waist?: number;
        hips?: number;
        limbs?: number;
    };
    pose?: {
        rotate?: Readonly<Record<string, readonly number[]>>;
        move?: Readonly<Record<string, readonly number[]>>;
        /** A joint and where it must be: [x, y] in the picture, or [x, y, z] on the body's own axes. */
        reach?: Readonly<Record<string, {
            at: readonly number[];
            pole?: readonly number[];
        }>>;
    };
    /** Text: what it says. */
    text?: string;
    fontSize?: number;
    /** A family the machine has, or a font file in the project. */
    font?: string;
    weight?: number | string;
    align?: 'left' | 'center' | 'right';
    /** Characters one under the other, as a sign down a building. */
    vertical?: boolean;
    /** Extra between characters, in pixels. */
    tracking?: number;
    /** Text: pixels taken off each stroke of the letters, for the white-hot core of a neon tube. */
    thin?: number;
    /** Text: 0..1 how much the surface shows through, as worn paint, and how much it is rubbed away in streaks. */
    grain?: number;
    grainScale?: number;
    dry?: number;
    /** Text or paint: a face of a block already drawn, "id.a", to lie on: text within `within`, and strokes with their points counted 0..1 across it and 0..1 down. */
    face?: string;
    /** On a face, the part it takes: left, top, right, bottom, each 0..1. */
    within?: readonly number[];
    /** Text: four corners in the picture it is laid on, in order round from the top left, so it lies on a wall in perspective. */
    quad?: readonly (readonly number[])[];
    /** Pixels of soft edge on the layer, fading inward, keeping its colour where a blur would smear it. */
    feather?: number;
    /** What it clips to, softened, grown or shrunk, or turned inside out. */
    clipFeather?: number;
    clipGrow?: number;
    clipInvert?: boolean;
    /** Only where the picture so far is this light, [low, high, softness?] each 0..1: a highlight or shadow selected by what it is. */
    blendIf?: readonly number[];
    adjust?: ImageAdjust;
    filter?: ImageFilterName;
    params?: Readonly<Record<string, unknown>>;
    /** A bloom: how bright a pixel must be to shine, 0..1, and how much it does. */
    threshold?: number;
    strength?: number;
    /** A block or a perspective: the points lines recede to. */
    vanish?: readonly (readonly number[])[];
    /** A block: how far each face runs toward its vanishing point, 0..1. */
    depth?: readonly number[];
    /** A block: the fill of each face, and of the roof if it can be seen. */
    faces?: readonly ImageFill[];
    roof?: ImageFill;
    /** A reflect: the line it mirrors about, level or as points along where things meet the ground, how far down it reaches, and how far it wavers and smears in pixels. */
    y?: number;
    edge?: readonly (readonly number[])[];
    reach?: number;
    ripple?: number;
    smear?: number;
    /** An image: a picture in the project. */
    src?: string;
    /** Drawn everywhere but inside this earlier layer. */
    except?: string;
    /** A figure: where the light is, x right, y up, z toward the viewer. */
    light?: readonly number[];
    fill?: ImageFill;
    stroke?: {
        color: ImageFill;
        width: number;
        align?: 'center' | 'inside' | 'outside';
        join?: 'round' | 'miter' | 'bevel';
        cap?: 'round' | 'butt' | 'square';
    };
    opacity?: number;
    blend?: ImageBlend;
    transform?: ImageTransform;
    mirror?: 'x' | 'y';
    effects?: readonly ImageEffect[];
    clip?: string;
    erase?: boolean;
    visible?: boolean;
    /** Softens the layer as drawn, with its effects, in the picture's pixels. On a group it softens the group as one thing. */
    blur?: number;
}
interface ImageSource {
    version?: number;
    size: number | readonly [number, number];
    background?: string;
    /**
     * The picture repeats: laid edge to edge with itself it shows no seam. What is drawn past one edge comes in at the
     * opposite one, a blur or a shadow goes round with it, and a noise fill repeats with the picture. For a wall, a floor,
     * a cloth: anything a surface is covered with.
     */
    tile?: boolean;
    /** What the surface is, beside what it looks like: see {@link ImageMaterial}. With it, a normal map and a material are written beside the picture. */
    material?: ImageMaterial;
    layers: readonly ImageLayer[];
}
/**
 * A picture as a surface. Each part is a number for the whole of it, or layers drawn as a grey picture of their own:
 * light is high, light is rough, light is metal.
 */
interface ImageMaterial {
    /** How far white stands above black, in pixels of the picture. Default 4. */
    relief?: number;
    /** The relief, drawn: light is high. Default: the colour picture's own lightness, dark being low. */
    height?: readonly ImageLayer[];
    /** How rough, 0..1 everywhere, or drawn: light is rough. Default 0.8. */
    roughness?: number | readonly ImageLayer[];
    /** How much metal, 0..1 everywhere, or drawn: light is metal. Default 0. */
    metal?: number | readonly ImageLayer[];
}
/** The source if it is well formed; otherwise throws, naming the layer and the field. */
declare function validateImageSource(raw: unknown): ImageSource;

/**
 * How this raster draws, as a name: what a picture drawn and kept (a texture recipe in the content cache) is kept under. It changes
 * whenever the same source would come out as other pixels; tests/image-raster-revision.test.ts fails until it does.
 */
declare const IMAGE_RASTER_REVISION = "1";
interface RgbaBitmap {
    width: number;
    height: number;
    rgba: Uint8Array;
}
/** A `figure` layer flattened into the picture: what the drawer of figures hands the raster. */
interface FlatFigure {
    /** Coverage of the whole body in picture pixels, then of each kind of block as it shows. */
    mask: Float32Array;
    parts: Record<string, Float32Array>;
    /** Which way the surface faces at each pixel, x right, y up, z toward the viewer; zero off the body. */
    normals: Float32Array;
    /** Dark where one block passes in front of another. */
    contour: Float32Array;
    /** In the picture: where each joint landed, and the bones and the head's cross as lines. */
    joints: Record<string, readonly [number, number]>;
    lines: readonly (readonly (readonly [number, number])[])[];
    light: readonly [number, number, number];
}
/** Draws text to coverage in the picture's pixels. Lives in whoever has fonts: this file has none. */
type ImageTextDrawer = (layer: ImageLayer, m: readonly number[], w: number, h: number) => {
    fill: Float32Array;
    line: Float32Array | null;
};
/** x, y, width and height in the picture's pixels. */
type ImageBox = readonly [number, number, number, number];
interface RenderedImage extends RgbaBitmap {
    notes: string[];
    /** Where the picture is solid, null if nowhere, and how much of its area that is, 0..1: how large it looks beside others. */
    bounds: ImageBox | null;
    covers: number;
    /** The same box for each layer with an id, after every transform, without its effects. */
    layerBounds: Record<string, ImageBox>;
    /** For each paint layer with an id: its entries, which `drop` counts, and the strokes they came to. */
    painted: Record<string, {
        entries: number;
        strokes: number;
    }>;
    /** For each figure with an id: where its joints landed in the picture. */
    figures: Record<string, Record<string, readonly [number, number]>>;
    /** For each block with an id: its faces' corners in the picture, to place things on. */
    blocks: Record<string, Record<string, readonly (readonly number[])[]>>;
}
/** Draws a source that has been validated. */
declare function renderImage(source: ImageSource, options?: {
    guides?: boolean;
    pictures?: Readonly<Record<string, RgbaBitmap>>;
    text?: ImageTextDrawer;
}): RenderedImage;

/**
 * @file  imageMaterial.ts — a picture as a surface: the maps a lit material reads beside its colour.
 *
 *        A wall is not only its colour. Light catches the edges of its bricks and slides off its glaze, and a picture
 *        alone draws flat however well it is painted. So a source may say what its surface is as well as what it looks
 *        like: its relief, how rough it is, and where it is metal. Each is drawn with the same layers the colour is, as
 *        a grey picture of its own (light is high, light is rough, light is metal), and what a material needs is made
 *        from them: a normal map from the relief, and one map holding roughness and metal.
 *
 *        With nothing drawn for the relief, the colour's own lightness stands in for it: dark is low. That is the
 *        cheap guess every texture tool makes, and it is right for mortar and wrong for a painted stripe, which is why
 *        a relief can be drawn instead.
 */

interface MaterialMaps {
    /** Tangent space, +z out of the surface, as the engine's lit materials read it. */
    normal: RgbaBitmap;
    /** Roughness in green and metal in blue, glTF's layout; null when both are one value everywhere. */
    surface: RgbaBitmap | null;
    /** The one value, where it is one. */
    roughness: number;
    metal: number;
    /** The grey pictures the maps were made from, for looking at. */
    height: RgbaBitmap;
    notes: string[];
}
type DrawOptions = {
    pictures?: Readonly<Record<string, RgbaBitmap>>;
    text?: ImageTextDrawer;
};
/** The maps a source's `material` asks for, drawn beside its colour @p color. */
declare function renderMaterialMaps(source: ImageSource, color: RgbaBitmap, options?: DrawOptions): MaterialMaps;

/**
 * @file    recipeSource.ts
 * @brief   What an `.esimage` shipped as a texture says: a picture, or one of the surface maps of another picture.
 *
 * @details A picture with a `material` is a surface as well as a colour: a normal map and a roughness-and-metal map are drawn from
 *          the same layers. A map is a texture of its own (it has its own import settings: data, not colour), so it is a file of
 *          its own: `{ "mapOf": "assets/wall.esimage", "map": "normal" }`. Nothing is drawn twice in the source, and a wall whose
 *          layers change changes its maps with it.
 */

/** The maps a picture with a `material` has beside its colour. */
declare const RECIPE_MAPS: readonly ["normal", "surface"];
type RecipeMap = (typeof RECIPE_MAPS)[number];
/** A recipe that is a surface map of the picture at `mapOf` (a project path). */
interface ImageMapSource {
    version?: number;
    mapOf: string;
    map: RecipeMap;
}
type Recipe = {
    picture: ImageSource;
} | {
    map: ImageMapSource;
};
/** A recipe from its text, checked: a wrong one says what is wrong. */
declare function parseRecipe(text: string): Recipe;
/** The project files a recipe needs beside itself. */
declare function recipeNeeds(text: string): string[];

/**
 * @file    imageText.ts
 * @brief   A picture's text, drawn by a 2D canvas: the one part of a picture that follows the fonts of the machine it is drawn on.
 *
 * @details The raster has no fonts. Whoever has a canvas (a browser, a worker with an OffscreenCanvas, a mini-game) hands it this
 *          drawer, which sets the text and reads back how much of each pixel it covers. A `font` that is a file of the project is
 *          drawn in that file's own glyphs wherever it is drawn; a family name is whatever the device has by that name.
 */

interface TextCanvas {
    getContext(id: '2d', options?: {
        willReadFrequently?: boolean;
    }): unknown;
}
/**
 * A drawer of text on canvases `canvas` makes. `familyOf` answers the family a font file was registered under, or nothing for a
 * font that is a family's own name.
 */
declare function canvasTextDrawer(canvas: (w: number, h: number) => TextCanvas, familyOf: (font: string) => string | undefined): ImageTextDrawer;

/**
 * @file    index.ts
 * @brief   Pictures drawn from their source: the raster an `.esimage` is drawn by, for a game that ships recipes in place of pixels.
 */

/** Installs the drawer of texture recipes: what importing this module does, and a way back for whoever took it out. */
declare function installTextureRecipes(): void;

export { IMAGE_RASTER_REVISION, IMAGE_SOURCE_EXT, IMAGE_SOURCE_VERSION, MAX_IMAGE_SIZE, RECIPE_MAPS, canvasTextDrawer, installTextureRecipes, parseRecipe, recipeNeeds, renderImage, renderMaterialMaps, validateImageSource };
export type { FlatFigure, ImageLayer, ImageMapSource, ImageMaterial, ImageSource, ImageTextDrawer, MaterialMaps, RecipeMap, RenderedImage, RgbaBitmap };
