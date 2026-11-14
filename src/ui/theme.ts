import {
    FlexContainer,
    spawnUIEntity,
    Text,
    UIVisual,
    UINode,
    UIDisplay,
    UIPointerEvents,
    UIPositionType,
    FlexDirection,
    JustifyContent,
    AlignItems,
    AlignContent,
    TextAlign,
    TextVerticalAlign,
    px,
    type Color,
    type Entity,
    type TextData,
    type UIVisualData,
    type World,
    type ButtonStateVisual,
} from 'esengine';
import type { CrewRole, TaskCategory } from '../contracts/gameContract';

export const PALETTE = {
    bgDark: { r: 0.075, g: 0.078, b: 0.133, a: 0.96 } as Color,
    panelBg: { r: 0.106, g: 0.118, b: 0.196, a: 0.95 } as Color,
    panelCard: { r: 0.145, g: 0.161, b: 0.263, a: 0.97 } as Color,
    panelBorder: { r: 0.29, g: 0.32, b: 0.49, a: 1 } as Color,
    panelBorderLight: { r: 0.42, g: 0.47, b: 0.68, a: 1 } as Color,
    modalBg: { r: 0.094, g: 0.102, b: 0.173, a: 0.98 } as Color,
    scrim: { r: 0.025, g: 0.028, b: 0.065, a: 0.80 } as Color,

    textPrimary: { r: 0.95, g: 0.96, b: 0.99, a: 1 } as Color,
    textMuted: { r: 0.68, g: 0.74, b: 0.87, a: 1 } as Color,
    textDim: { r: 0.47, g: 0.53, b: 0.68, a: 1 } as Color,
    darkInk: { r: 0.10, g: 0.11, b: 0.18, a: 1 } as Color,

    cyan: { r: 0.31, g: 0.78, b: 0.97, a: 1 } as Color,
    amber: { r: 0.96, g: 0.72, b: 0.31, a: 1 } as Color,
    marsOrange: { r: 0.94, g: 0.44, b: 0.25, a: 1 } as Color,
    green: { r: 0.28, g: 0.82, b: 0.49, a: 1 } as Color,
    purple: { r: 0.62, g: 0.49, b: 0.97, a: 1 } as Color,
    red: { r: 0.93, g: 0.35, b: 0.36, a: 1 } as Color,

    btnNormal: { r: 0.17, g: 0.19, b: 0.31, a: 1 } as Color,
    btnHover: { r: 0.24, g: 0.27, b: 0.42, a: 1 } as Color,
    btnPressed: { r: 0.13, g: 0.15, b: 0.25, a: 1 } as Color,
    btnDisabled: { r: 0.12, g: 0.13, b: 0.20, a: 0.78 } as Color,

    primaryNormal: { r: 0.20, g: 0.56, b: 0.84, a: 1 } as Color,
    primaryHover: { r: 0.28, g: 0.66, b: 0.94, a: 1 } as Color,
    primaryPressed: { r: 0.14, g: 0.44, b: 0.70, a: 1 } as Color,

    goldNormal: { r: 0.96, g: 0.72, b: 0.31, a: 1 } as Color,
    goldHover: { r: 1.0, g: 0.81, b: 0.44, a: 1 } as Color,
    goldPressed: { r: 0.80, g: 0.57, b: 0.19, a: 1 } as Color,

    goNormal: { r: 0.93, g: 0.48, b: 0.22, a: 1 } as Color,
    goHover: { r: 0.99, g: 0.58, b: 0.30, a: 1 } as Color,
    goPressed: { r: 0.78, g: 0.37, b: 0.14, a: 1 } as Color,
};

export function lerpColor(a: Color, b: Color, t: number): Color {
    const k = Math.max(0, Math.min(1, t));
    return {
        r: a.r + (b.r - a.r) * k,
        g: a.g + (b.g - a.g) * k,
        b: a.b + (b.b - a.b) * k,
        a: a.a + (b.a - a.a) * k,
    };
}

export function buttonStates(
    normal: Color = PALETTE.btnNormal,
    hover: Color = PALETTE.btnHover,
    pressed: Color = PALETTE.btnPressed,
    disabled: Color = PALETTE.btnDisabled,
): Record<string, ButtonStateVisual> {
    return {
        normal: { color: normal },
        hover: { color: hover },
        pressed: { color: pressed },
        disabled: { color: disabled },
    };
}

export function roleColor(role: CrewRole): Color {
    if (role === 'engineer') return { r: 0.32, g: 0.65, b: 0.98, a: 1 };
    if (role === 'botanist') return { r: 0.32, g: 0.84, b: 0.52, a: 1 };
    if (role === 'pilot') return { r: 0.94, g: 0.38, b: 0.36, a: 1 };
    return { r: 0.96, g: 0.64, b: 0.26, a: 1 };
}

export function roleShortTag(role: CrewRole): string {
    if (role === 'engineer') return 'ENG';
    if (role === 'botanist') return 'BIO';
    if (role === 'pilot') return 'PLT';
    return 'MED';
}

export function categoryColor(cat: TaskCategory): Color {
    if (cat === 'ENG') return { r: 0.28, g: 0.62, b: 0.96, a: 1 };
    if (cat === 'BIO') return { r: 0.28, g: 0.80, b: 0.48, a: 1 };
    if (cat === 'NAV') return { r: 0.94, g: 0.58, b: 0.22, a: 1 };
    if (cat === 'MED') return { r: 0.92, g: 0.36, b: 0.54, a: 1 };
    if (cat === 'GOAL') return { r: 0.98, g: 0.78, b: 0.22, a: 1 };
    return { r: 0.64, g: 0.52, b: 0.96, a: 1 };
}

export function setText(world: World, entity: Entity | null, content: string): void {
    if (entity === null || !world.valid(entity) || !world.has(entity, Text)) return;
    const t = world.get(entity, Text) as TextData;
    if (t.content === content) return;
    t.content = content;
    world.insert(entity, Text, t);
}

export function setTextColor(world: World, entity: Entity | null, color: Color): void {
    if (entity === null || !world.valid(entity) || !world.has(entity, Text)) return;
    const t = world.get(entity, Text) as TextData;
    t.color = { ...color };
    world.insert(entity, Text, t);
}

export function setVisualColor(world: World, entity: Entity | null, color: Color): void {
    if (entity === null || !world.valid(entity) || !world.has(entity, UIVisual)) return;
    const v = world.get(entity, UIVisual) as UIVisualData;
    v.color = { ...color };
    world.insert(entity, UIVisual, v);
}

export function setVisualTexture(world: World, entity: Entity | null, texture: number): void {
    if (entity === null || !world.valid(entity) || !world.has(entity, UIVisual)) return;
    const v = world.get(entity, UIVisual) as UIVisualData;
    v.texture = texture;
    v.visualType = 2; // UIVisualType.Image
    v.enabled = true;
    world.insert(entity, UIVisual, v);
}

export function setNodeDisplayed(world: World, entity: Entity | null, visible: boolean): void {
    if (entity === null || !world.valid(entity) || !world.has(entity, UINode)) return;
    const next = visible ? UIDisplay.Flex : UIDisplay.None;
    world.update(entity, UINode, (n) => {
        n.display = next;
    });
}

export function makeAbsBox(
    world: World,
    parent: Entity,
    left: number,
    top: number,
    width: number,
    height: number,
    color?: Color,
    clickThrough = false,
): Entity {
    return spawnUIEntity({
        world,
        parent,
        node: {
            position: UIPositionType.Absolute,
            insetLeft: px(left),
            insetTop: px(top),
            width: px(width),
            height: px(height),
            pointerEvents: clickThrough ? UIPointerEvents.None : UIPointerEvents.Auto,
        },
        visual: color ? { color } : undefined,
    });
}

export function makeFramedBox(
    world: World,
    parent: Entity,
    left: number,
    top: number,
    width: number,
    height: number,
    fillColor: Color,
    borderColor: Color = PALETTE.panelBorder,
    clickThrough = false,
    borderWidth = 2,
): { frame: Entity; inner: Entity } {
    const frame = makeAbsBox(world, parent, left, top, width, height, borderColor, clickThrough);
    const inner = makeAbsBox(
        world,
        frame,
        borderWidth,
        borderWidth,
        Math.max(4, width - borderWidth * 2),
        Math.max(4, height - borderWidth * 2),
        fillColor,
        true,
    );
    return { frame, inner };
}

export function makeAbsLabel(
    world: World,
    parent: Entity,
    left: number,
    top: number,
    width: number,
    height: number,
    content: string,
    opts: {
        fontSize?: number;
        color?: Color;
        bold?: boolean;
        align?: TextAlign;
        verticalAlign?: TextVerticalAlign;
        wordWrap?: boolean;
    } = {},
): Entity {
    return spawnUIEntity({
        world,
        parent,
        node: {
            position: UIPositionType.Absolute,
            insetLeft: px(left),
            insetTop: px(top),
            width: px(width),
            height: px(height),
            pointerEvents: UIPointerEvents.None,
        },
        text: {
            content,
            fontSize: opts.fontSize ?? 13,
            color: opts.color ?? PALETTE.textPrimary,
            bold: opts.bold ?? false,
            align: opts.align ?? TextAlign.Left,
            verticalAlign: opts.verticalAlign ?? TextVerticalAlign.Middle,
            wordWrap: opts.wordWrap ?? false,
        },
    });
}

export function attachRowFlex(world: World, entity: Entity, gapX = 6, pad = 0): void {
    world.insert(entity, FlexContainer, {
        direction: FlexDirection.Row,
        wrap: 0,
        justifyContent: JustifyContent.Start,
        alignItems: AlignItems.Center,
        alignContent: AlignContent.Start,
        gap: { x: gapX, y: 0 },
        padding: { left: pad, top: pad, right: pad, bottom: pad },
    });
}
