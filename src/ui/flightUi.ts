import {
    AssetScope, createButton, GamepadButton, Interactable, px, spawnUIEntity, Text, TextAlign, TextVerticalAlign,
    UIDisplay, UINode, UIPointerEvents, UIPositionType, UIVisual, UIVisualFit, UIVisualType, uiNodeWorldBox,
    type AssetsData, type Color, type Entity, type FocusManagerState, type InputState, type UIEventQueue, type World,
} from 'esengine';
import { makeAbsBox, setNodeDisplayed, setText, setTextColor, setVisualColor } from './theme';

export type Bounds = readonly [x: number, y: number, width: number, height: number];

const color = (hex: number, a = 1): Color => ({
    r: (hex >> 16) / 255, g: ((hex >> 8) & 255) / 255, b: (hex & 255) / 255, a,
});

export function flightPalette(highContrast: boolean) {
    return {
        ink: color(highContrast ? 0x12121e : 0x1e1d30),
        panel: color(highContrast ? 0x171723 : 0x212031),
        raised: color(highContrast ? 0x2a293d : 0x323149),
        well: color(0x262539),
        edge: color(highContrast ? 0xa29ab0 : 0x555064),
        bevel: color(highContrast ? 0xc1b8cb : 0x777185),
        text: color(highContrast ? 0xffffff : 0xe8dcdd),
        secondary: color(highContrast ? 0xeee5ee : 0xbdb1bc),
        muted: color(highContrast ? 0xcbc2cc : 0xa39aab),
        amber: color(0xeeb166),
        hover: color(0xf8c574),
        pressed: color(0xc48850),
        rust: color(0xa25754),
        cyan: color(0x65ccd0),
        teal: color(0x145360),
        good: color(0x87b77a),
        bad: color(0xd96c6c),
        transparent: color(0x000000, 0),
        white: color(0xffffff),
    };
}

type Tone = 'plain' | 'primary' | 'hero' | 'tile';
interface ButtonOptions { tone?: Tone; disabled?: boolean; label?: string; }
interface Control { entity: Entity; ring: Entity; }

export interface FlightArt {
    texture(ref: string): Promise<number>;
    font(display: boolean): Promise<number>;
}

export function makeFlightArt(world: World, root: Entity, assets: AssetsData): FlightArt {
    const textures = new Map<string, Promise<number>>();
    const fonts = new Map<string, Promise<number>>();
    const owned = new AssetScope();
    const stop = world.onDespawn(entity => {
        if (entity !== root) return;
        stop();
        owned.releaseAll();
        for (const ref of fonts.keys()) assets.releaseFont(ref);
    });
    return {
        texture(ref) {
            let pending = textures.get(ref);
            if (!pending) {
                pending = assets.acquireTexture(ref).then(lease => {
                    if (world.valid(root)) owned.add(lease);
                    else lease.release();
                    return lease.value.handle;
                });
                textures.set(ref, pending);
            }
            return pending;
        },
        font(display) {
            const ref = display ? 'assets/fonts/pixelify_sans.ttf' : 'assets/fonts/ibm_plex_mono.ttf';
            let pending = fonts.get(ref);
            if (!pending) {
                pending = assets.loadFont(ref).then(font => font.handle);
                fonts.set(ref, pending);
            }
            return pending;
        },
    };
}

export const MENU_BACKGROUND = 'assets/textures/menu_station.png';
export const SIDEBAR_BACKGROUND = 'assets/textures/menu_landscape.png';
export const ICON_NAMES = [
    'play', 'crew', 'upgrade', 'settings', 'quit', 'lock', 'check', 'back',
    'engineer', 'botanist', 'pilot', 'medic', 'scientist', 'captain', 'mars', 'moon',
    'power', 'oxygen', 'water', 'food', 'solar', 'radiation', 'rover', 'circuit',
    'windSampler', 'repairKits', 'batteryPacks', 'medkits', 'seedPods', 'extraRations', 'waterCanisters', 'oxygenTanks',
] as const;
export type IconName = typeof ICON_NAMES[number];

export function makeFlightUi(
    world: World, events: UIEventQueue, root: Entity, art: FlightArt, focus: FocusManagerState,
    options: { highContrast: boolean; reducedMotion: boolean },
) {
    const palette = flightPalette(options.highContrast);
    const controls: Control[] = [];
    const listeners: Array<() => void> = [];
    const cleanup = world.onDespawn(entity => {
        if (entity !== root) return;
        cleanup();
        listeners.forEach(unsubscribe => unsubscribe());
    });
    const box = (parent: Entity, bounds: Bounds, fill?: Color) => makeAbsBox(world, parent, ...bounds, fill, true);
    const group = (parent: Entity, bounds: Bounds) => makeAbsBox(world, parent, ...bounds);

    function frame(parent: Entity, bounds: Bounds, fill = palette.panel, edge = palette.edge) {
        const [x, y, w, h] = bounds;
        const outer = group(parent, bounds);
        box(outer, [4, 0, w - 8, h], edge);
        box(outer, [0, 4, w, h - 8], edge);
        const inner = group(outer, [4, 4, w - 8, h - 8]);
        box(inner, [0, 0, w - 8, h - 8], fill);
        box(outer, [8, 2, Math.max(4, w - 16), 2], palette.bevel);
        box(outer, [8, h - 4, 20, 2], palette.rust);
        return inner;
    }

    function label(parent: Entity, bounds: Bounds, content: string, opts: {
        size?: number; color?: Color; display?: boolean; wrap?: boolean; center?: boolean; top?: boolean;
    } = {}) {
        const [x, y, w, h] = bounds;
        const el = spawnUIEntity({
            world, parent,
            node: { position: UIPositionType.Absolute, insetLeft: px(x), insetTop: px(y), width: px(w), height: px(h), pointerEvents: UIPointerEvents.None },
            text: {
                content, fontSize: opts.size ?? 16, fontFamily: opts.display ? 'sans-serif' : 'monospace',
                bold: opts.display ?? false, color: opts.color ?? palette.text,
                align: opts.center ? TextAlign.Center : TextAlign.Left,
                verticalAlign: opts.top ? TextVerticalAlign.Top : TextVerticalAlign.Middle, wordWrap: opts.wrap ?? false,
            },
        });
        void art.font(opts.display ?? false).then(handle => {
            // Fonts are loaded asynchronously once per runtime.
            if (world.valid(el)) world.update(el, Text, data => { data.font = handle; });
        }).catch(() => {});
        return el;
    }

    function image(parent: Entity, bounds: Bounds, ref: string, tint = palette.white, slot?: number) {
        const el = box(parent, bounds);
        world.insert(el, UIVisual, { visualType: UIVisualType.Image, enabled: false });
        void art.texture(ref).then(texture => {
            if (!world.valid(el)) return;
            world.update(el, UIVisual, data => {
                data.texture = texture;
                data.color = tint;
                data.enabled = true;
                data.fit = UIVisualFit.Fill;
                if (slot !== undefined) {
                    data.uvOffset = { x: (slot % 8) / 8, y: (3 - Math.floor(slot / 8)) / 4 };
                    data.uvScale = { x: 1 / 8, y: 1 / 4 };
                }
            });
        }).catch(() => {});
        return el;
    }

    function icon(parent: Entity, x: number, y: number, size: number, name: IconName, tint = palette.text) {
        const spriteHasColor = [
            'engineer', 'botanist', 'medic', 'scientist', 'captain', 'oxygen', 'water', 'food', 'solar', 'radiation', 'circuit',
            'windSampler', 'repairKits', 'batteryPacks', 'medkits', 'seedPods', 'extraRations',
        ].includes(name);
        return image(parent, [x, y, size, size], 'assets/textures/flight_icons.png', spriteHasColor ? palette.white : tint, ICON_NAMES.indexOf(name));
    }

    function button(parent: Entity, bounds: Bounds, onClick: () => void, opts: ButtonOptions = {}) {
        const [x, y, w, h] = bounds;
        const tone = opts.tone ?? 'plain';
        const resting = tone === 'hero' ? palette.cyan : tone === 'primary' ? palette.amber : palette.edge;
        const handle = createButton({
            world, parent, events, disabled: opts.disabled,
            node: { position: UIPositionType.Absolute, insetLeft: px(x), insetTop: px(y), width: px(w), height: px(h) },
            states: {
                normal: { color: resting }, hover: { color: tone === 'hero' ? palette.white : palette.hover },
                pressed: { color: palette.pressed }, disabled: { color: palette.edge },
            },
            fadeDuration: options.reducedMotion ? 0 : 0.1, onClick,
        });
        const surface = box(handle.entity, [2, 2, w - 4, h - 4],
            tone === 'hero' ? palette.teal : tone === 'primary' ? palette.amber : tone === 'tile' ? palette.well : palette.raised);
        for (const [cx, cy] of [[0, 0], [w - 4, 0], [0, h - 4], [w - 4, h - 4]]) {
            box(handle.entity, [cx!, cy!, 4, 4], palette.panel);
        }
        const ring = box(handle.entity, [w - 16, 6, 8, 8], palette.white);
        setNodeDisplayed(world, ring, false);
        const text = opts.label === undefined ? null : label(handle.entity, [8, 2, w - 16, h - 4], opts.label, {
            display: true, size: 18, center: true, color: tone === 'primary' ? palette.ink : palette.text,
        });
        controls.push({ entity: handle.entity, ring });
        return { ...handle, surface, text };
    }

    let lastFocused: Entity | null = null;
    function isEnabled(control: Control): boolean {
        return world.valid(control.entity) && world.isEntityActive(control.entity) &&
            world.get(control.entity, UINode).display !== UIDisplay.None && world.get(control.entity, Interactable).enabled;
    }
    function updateFocus(input: InputState) {
        const key = (name: string, pad: GamepadButton) => input.isKeyPressed(name) || input.isGamepadButtonPressed(pad);
        const dx = Number(key('ArrowRight', GamepadButton.DpadRight)) - Number(key('ArrowLeft', GamepadButton.DpadLeft));
        const dy = Number(key('ArrowDown', GamepadButton.DpadDown)) - Number(key('ArrowUp', GamepadButton.DpadUp));
        if (dx || dy) {
            const current = controls.find(control => control.entity === focus.focusedEntity);
            const available = controls.filter(isEnabled);
            if (!current && available.length) focus.focus(available[0]!.entity, true);
            const origin = current && uiNodeWorldBox(world, current.entity);
            if (origin) {
                let next: Control | undefined;
                let score = Infinity;
                for (const control of available) {
                    const candidate = uiNodeWorldBox(world, control.entity);
                    if (!candidate) continue;
                    const offsetX = candidate.cx - origin.cx;
                    const offsetY = origin.cy - candidate.cy;
                    const along = offsetX * dx + offsetY * dy;
                    if (along <= 0) continue;
                    const across = Math.abs(offsetX * dy - offsetY * dx);
                    const distance = along + across * 2;
                    if (distance < score) { score = distance; next = control; }
                }
                if (next) focus.focus(next.entity, true);
            }
        }
        if (input.isGamepadButtonPressed(GamepadButton.South) && focus.focusedEntity !== null) {
            const control = controls.find(item => item.entity === focus.focusedEntity);
            if (control && isEnabled(control)) events.emit(control.entity, 'click');
        }
        const focused = focus.focusVisible ? focus.focusedEntity : null;
        if (focused === lastFocused) return;
        for (const control of controls) {
            if (control.entity === lastFocused || control.entity === focused) {
                setNodeDisplayed(world, control.ring, control.entity === focused);
            }
        }
        lastFocused = focused;
    }

    return {
        world, root, palette, box, group, frame, label, image, icon, button, updateFocus,
        setText: (entity: Entity | null, content: string) => setText(world, entity, content),
        textColor: (entity: Entity | null, fill: Color) => setTextColor(world, entity, fill),
        fill: (entity: Entity | null, fill: Color) => setVisualColor(world, entity, fill),
        show: (entity: Entity, visible: boolean) => setNodeDisplayed(world, entity, visible),
        on: (entity: Entity, event: string, handler: () => void) => listeners.push(events.on(entity, event, handler)),
        hasKeyboardFocus: (entity: Entity) => focus.isVisiblyFocused(entity),
    };
}

export type FlightUi = ReturnType<typeof makeFlightUi>;
