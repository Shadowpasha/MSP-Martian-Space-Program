// Mission Prep UI kit on top of Estella's UI primitives. Everything is placed
// absolutely on the 1280×720 design grid (like the main loop does), so screens
// line up on design.md's 4-px rhythm. A `Ui` owns what it built: `destroy()`
// unsubscribes every listener and despawns the tree.
import {
    createButton,
    Interactable,
    Name,
    px,
    spawnUIEntity,
    Text,
    TextAlign,
    TextVerticalAlign,
    UIPointerEvents,
    UIPositionType,
    UIVisual,
    UIVisualType,
    type Color,
    type Entity,
    type TextData,
    type UIEventQueue,
    type UIVisualData,
    type World,
} from 'esengine';
import { FONTS, font, tex } from './assets';
import { T, TYPE } from './tokens';

export type FontRole = 'display' | 'body' | 'bold';
export type ButtonVariant = 'primary' | 'secondary' | 'nav' | 'navActive' | 'tab' | 'tabActive' | 'ghost';

export interface TextOpts {
    size?: number;
    color?: Color;
    font?: FontRole;
    align?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    wrap?: boolean;
}

export interface ButtonOpts {
    variant?: ButtonVariant;
    disabled?: boolean;
    /** Icon texture path drawn left of the label. */
    icon?: string;
    size?: number;
    font?: FontRole;
    align?: 'left' | 'center';
    /** Entity name (lets tests and the editor's click_ui find it). */
    name?: string;
}

const ALIGN = { left: TextAlign.Left, center: TextAlign.Center, right: TextAlign.Right };
const VALIGN = { top: TextVerticalAlign.Top, middle: TextVerticalAlign.Middle, bottom: TextVerticalAlign.Bottom };

function fontHandle(role: FontRole): number {
    if (role === 'display') return font(FONTS.display);
    if (role === 'bold') return font(FONTS.bodyBold);
    return font(FONTS.body);
}

function shade(c: Color, d: number): Color {
    const f = (v: number) => Math.max(0, Math.min(1, v + d));
    return { r: f(c.r), g: f(c.g), b: f(c.b), a: c.a };
}

const VARIANTS: Record<ButtonVariant, { fill: Color; border: Color; text: Color; hover: Color; font: FontRole }> = {
    primary: { fill: T.amber400, border: T.amber300, text: T.ink900, hover: T.amber300, font: 'display' },
    secondary: { fill: T.ink700, border: T.edge500, text: T.textPrimary, hover: shade(T.ink700, 0.06), font: 'display' },
    nav: { fill: T.ink700, border: T.edge500, text: T.textPrimary, hover: shade(T.ink700, 0.06), font: 'display' },
    navActive: { fill: T.amber400, border: T.amber300, text: T.ink900, hover: T.amber300, font: 'display' },
    tab: { fill: T.ink800, border: T.edge500, text: T.textSecondary, hover: T.ink700, font: 'display' },
    tabActive: { fill: T.ink700, border: T.amber400, text: T.amber400, hover: T.ink700, font: 'display' },
    ghost: { fill: T.ink800, border: T.ink800, text: T.textSecondary, hover: T.ink700, font: 'body' },
};

export class Ui {
    private disposers_: (() => void)[] = [];

    constructor(readonly world: World, readonly events: UIEventQueue) {}

    /** A plain absolutely-placed box. `clickThrough` lets the pointer pass to what is underneath. */
    box(parent: Entity, x: number, y: number, w: number, h: number, color?: Color, clickThrough = true): Entity {
        return spawnUIEntity({
            world: this.world,
            parent,
            node: {
                position: UIPositionType.Absolute,
                insetLeft: px(x), insetTop: px(y), width: px(w), height: px(h),
                // None is inherited by the whole subtree, so anything clickable must
                // take the pointer back with Receive (CSS pointer-events: auto on a child).
                pointerEvents: clickThrough ? UIPointerEvents.None : UIPointerEvents.Receive,
            },
            visual: color ? { color } : undefined,
        });
    }

    /**
     * design.md Panel: dark fill, 2-px border, a double-edge bevel (light top/left,
     * dark bottom/right inner lines) and 8-px 45° chamfered corners cut in 2-px
     * steps, painted in `bg` (the colour behind the panel).
     * Returns the inner content box (origin at the inner top-left).
     */
    panel(parent: Entity, x: number, y: number, w: number, h: number,
        o: { fill?: Color; border?: Color; bg?: Color; borderW?: number; cut?: number } = {}): Entity {
        const bw = o.borderW ?? 2;
        const cut = o.cut ?? 8;
        const fill = o.fill ?? T.ink800;
        const border = o.border ?? T.edge500;
        const frame = this.box(parent, x, y, w, h, border);
        const inner = this.box(frame, bw, bw, w - bw * 2, h - bw * 2, fill);
        const iw = w - bw * 2;
        const ih = h - bw * 2;
        this.box(inner, 0, 0, iw, 1, shade(fill, 0.07));
        this.box(inner, 0, 0, 1, ih, shade(fill, 0.07));
        this.box(inner, 0, ih - 1, iw, 1, shade(fill, -0.05));
        this.box(inner, iw - 1, 0, 1, ih, shade(fill, -0.05));
        if (cut > 0) this.chamfer(frame, w, h, cut, o.bg ?? T.ink900, border);
        return inner;
    }

    /** Cut 45° stepped corners into a box of size w×h and redraw the border along the diagonal. */
    chamfer(frame: Entity, w: number, h: number, cut: number, bg: Color, border: Color): void {
        for (let k = 0; k * 2 < cut; k++) {
            const run = cut - k * 2;
            const yT = k * 2;
            const yB = h - 2 - k * 2;
            this.box(frame, 0, yT, run, 2, bg);
            this.box(frame, w - run, yT, run, 2, bg);
            this.box(frame, 0, yB, run, 2, bg);
            this.box(frame, w - run, yB, run, 2, bg);
            this.box(frame, run, yT, 2, 2, border);
            this.box(frame, w - run - 2, yT, 2, 2, border);
            this.box(frame, run, yB, 2, 2, border);
            this.box(frame, w - run - 2, yB, 2, 2, border);
        }
    }

    /** Selection brackets just outside a frame's corners (design.md: amber illuminated selection). */
    brackets(parent: Entity, x: number, y: number, w: number, h: number, color: Color = T.amber400): void {
        const L = 14;
        const t = 3;
        const o = 4;
        for (const [cx, cy, sx, sy] of [[x - o, y - o, 1, 1], [x + w + o, y - o, -1, 1], [x - o, y + h + o, 1, -1], [x + w + o, y + h + o, -1, -1]] as const) {
            this.box(parent, sx > 0 ? cx : cx - L, sy > 0 ? cy : cy - t, L, t, color);
            this.box(parent, sx > 0 ? cx : cx - t, sy > 0 ? cy : cy - L, t, L, color);
        }
    }

    /** design.md PanelHeader: a lighter strip with a small square glyph and a bold title. */
    panelHeader(parent: Entity, x: number, y: number, w: number, title: string, right?: { text: string; color?: Color }): Entity {
        const strip = this.box(parent, x, y, w, 30, T.ink700);
        this.box(strip, 0, 29, w, 1, T.edge500);
        this.box(strip, 10, 11, 8, 8, T.textSecondary);
        this.text(strip, 26, 0, w - 40, 30, title, { font: 'display', size: 17 });
        if (right) this.text(strip, w - 210, 0, 200, 30, right.text, { font: 'display', size: 16, align: 'right', color: right.color ?? T.textSecondary });
        return strip;
    }

    text(parent: Entity, x: number, y: number, w: number, h: number, content: string, o: TextOpts = {}): Entity {
        const role = o.font ?? 'body';
        return spawnUIEntity({
            world: this.world,
            parent,
            node: {
                position: UIPositionType.Absolute,
                insetLeft: px(x), insetTop: px(y), width: px(w), height: px(h),
                pointerEvents: UIPointerEvents.None,
            },
            text: {
                content,
                fontSize: o.size ?? TYPE.body,
                color: o.color ?? T.textPrimary,
                font: fontHandle(role),
                align: ALIGN[o.align ?? 'left'],
                verticalAlign: VALIGN[o.valign ?? (o.wrap ? 'top' : 'middle')],
                wordWrap: o.wrap ?? false,
            },
        });
    }

    /** A pixel sprite. Size should be an integer multiple of the source (16 px → 32, 48…). */
    image(parent: Entity, x: number, y: number, w: number, h: number, path: string,
        o: { tint?: Color; uvOffset?: { x: number; y: number }; uvScale?: { x: number; y: number } } = {}): Entity {
        const handle = tex(path);
        return spawnUIEntity({
            world: this.world,
            parent,
            node: {
                position: UIPositionType.Absolute,
                insetLeft: px(x), insetTop: px(y), width: px(w), height: px(h),
                pointerEvents: UIPointerEvents.None,
            },
            visual: handle
                ? {
                    visualType: UIVisualType.Image, texture: handle,
                    color: o.tint ?? { r: 1, g: 1, b: 1, a: 1 },
                    uvOffset: o.uvOffset, uvScale: o.uvScale,
                }
                : { color: T.clear },
        });
    }

    button(parent: Entity, x: number, y: number, w: number, h: number, label: string,
        onClick: () => void, o: ButtonOpts = {}): Entity {
        const v = VARIANTS[o.variant ?? 'secondary'];
        const disabled = o.disabled ?? false;
        const frame = this.box(parent, x, y, w, h, disabled ? T.edge500 : v.border, false);
        const fill = disabled ? T.ink600 : v.fill;
        const handle = createButton({
            world: this.world,
            events: this.events,
            parent: frame,
            node: {
                position: UIPositionType.Absolute, insetLeft: px(2), insetTop: px(2), width: px(w - 4), height: px(h - 4),
                pointerEvents: UIPointerEvents.Receive,
            },
            states: {
                normal: { color: fill },
                hover: { color: disabled ? fill : v.hover },
                pressed: { color: disabled ? fill : shade(v.fill, -0.08) },
                disabled: { color: T.ink600 },
                // Keyboard focus is distinct from hover (design.md §3.2): a light plate, not a tint.
                focused: { color: disabled ? fill : (o.variant === 'primary' || o.variant === 'navActive' ? T.white100 : T.edge500) },
            },
            disabled,
            onClick: () => onClick(),
        });
        this.disposers_.push(() => handle.dispose());
        if (o.name) this.world.insert(handle.entity, Name, { value: o.name });
        const iconSize = h >= 52 ? 32 : 16;
        const left = o.icon ? 12 + iconSize + 10 : 12;
        if (o.icon) this.image(handle.entity, 12, Math.round((h - 4 - iconSize) / 2), iconSize, iconSize, o.icon);
        this.text(handle.entity, left, 0, w - 4 - left - 8, h - 4, label, {
            size: o.size ?? TYPE.nav,
            color: disabled ? T.textSecondary : v.text,
            font: o.font ?? v.font,
            align: o.align ?? (o.icon ? 'left' : 'center'),
        });
        return frame;
    }

    /** A coloured box that reports pointer events (cargo cells, map pins, crew cards). */
    hotspot(parent: Entity, x: number, y: number, w: number, h: number, color: Color,
        on: { click?: () => void; press?: () => void; hoverEnter?: () => void; hoverExit?: () => void }, name?: string): Entity {
        const e = this.box(parent, x, y, w, h, color, false);
        if (name) this.world.insert(e, Name, { value: name });
        this.world.insert(e, Interactable, { enabled: true, blockRaycast: true, raycastTarget: true });
        if (on.click) this.disposers_.push(this.events.on(e, 'click', () => on.click!()));
        if (on.press) this.disposers_.push(this.events.on(e, 'press', () => on.press!()));
        if (on.hoverEnter) this.disposers_.push(this.events.on(e, 'hover_enter', () => on.hoverEnter!()));
        if (on.hoverExit) this.disposers_.push(this.events.on(e, 'hover_exit', () => on.hoverExit!()));
        return e;
    }

    setColor(e: Entity, color: Color): void {
        if (!this.world.valid(e) || !this.world.has(e, UIVisual)) return;
        const v = this.world.get(e, UIVisual) as UIVisualData;
        v.color = { ...color };
        this.world.insert(e, UIVisual, v);
    }

    setVisible(e: Entity, on: boolean): void {
        if (!this.world.valid(e) || !this.world.has(e, UIVisual)) return;
        const v = this.world.get(e, UIVisual) as UIVisualData;
        if (v.enabled === on) return;
        v.enabled = on;
        this.world.insert(e, UIVisual, v);
    }

    setText(e: Entity, content: string): void {
        if (!this.world.valid(e) || !this.world.has(e, Text)) return;
        const t = this.world.get(e, Text) as TextData;
        if (t.content === content) return;
        t.content = content;
        this.world.insert(e, Text, t);
    }

    destroy(root: Entity | null): void {
        for (const d of this.disposers_) {
            try { d(); } catch { /* entity already gone */ }
        }
        this.disposers_ = [];
        if (root !== null && this.world.valid(root)) this.world.despawn(root);
    }
}
