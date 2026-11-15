import {
    AssetScope, createButton, createSlider, GamepadButton, Interactable, px, spawnUIEntity, Text, TextAlign, TextVerticalAlign,
    UIDisplay, UINode, UIPointerEvents, UIPositionType, UIVisual, UIVisualFit, UIVisualType, uiNodeWorldBox,
    type AssetsData, type Color, type Entity, type FocusManagerState, type InputState, type UIEventQueue, type World,
} from 'esengine';
import { play, soundsStarted, vibrate } from './feedback';
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
interface ButtonOptions {
    tone?: Tone; disabled?: boolean; label?: string; labelSize?: number; labelFit?: number;
    /** No hover lift, press sink, hover tick or click blip (for grid cells that other things are drawn over). */
    still?: boolean;
    /** No hover tick: for big hover areas built from buttons (list rows, cards) rather than real buttons. */
    quiet?: boolean;
}
interface Control { entity: Entity; ring: Entity; disabled: () => boolean; x: number; y: number; }

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
/** Icons that do not fit in the 8 x 4 atlas: one image each (scripts/art/launch_sprites.py). */
export const EXTRA_ICONS = {
    radDetector: 'assets/textures/icons/icon_rad_detector_32.png',
    iceDrill: 'assets/textures/icons/icon_ice_drill_32.png',
} as const;
export type IconName = typeof ICON_NAMES[number] | keyof typeof EXTRA_ICONS;

/** Average glyph width as a share of font size. Slightly wide on purpose, so estimates err toward fitting. */
const GLYPH_WIDTH = 0.6;
const LINE_HEIGHT = 1.15;

/**
 * Largest font size from `max` down to `min` at which `text` fits a `width` × `height` box.
 * Engine text has no measuring API here, so this estimates from the glyph width. Without `wrap`
 * the text must fit on one line; with `wrap` it may use as many lines as the height allows.
 */
export function fitFontSize(text: string, width: number, height: number, max: number, min: number, wrap: boolean): number {
    for (let size = max; size > min; size--) {
        const perLine = Math.floor(width / (size * GLYPH_WIDTH));
        const maxLines = wrap ? Math.max(1, Math.floor(height / (size * LINE_HEIGHT))) : 1;
        if (wrappedLines(text, perLine) <= maxLines) return size;
    }
    return min;
}

function wrappedLines(text: string, perLine: number): number {
    let lines = 1;
    let used = 0;
    for (const word of text.split(/\s+/).filter(Boolean)) {
        if (word.length > perLine) return Infinity;
        const needed = used === 0 ? word.length : used + 1 + word.length;
        if (needed <= perLine) used = needed;
        else { lines++; used = word.length; }
    }
    return lines;
}

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
        /** Smallest font size allowed: shrink from `size` until the text fits the box. */
        fit?: number;
    } = {}) {
        const [x, y, w, h] = bounds;
        const size = opts.fit === undefined
            ? opts.size ?? 16
            : fitFontSize(content, w, h, opts.size ?? 16, opts.fit, opts.wrap ?? false);
        const el = spawnUIEntity({
            world, parent,
            node: { position: UIPositionType.Absolute, insetLeft: px(x), insetTop: px(y), width: px(w), height: px(h), pointerEvents: UIPointerEvents.None },
            text: {
                content, fontSize: size, fontFamily: opts.display ? 'sans-serif' : 'monospace',
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
        if (name in EXTRA_ICONS) return image(parent, [x, y, size, size], EXTRA_ICONS[name as keyof typeof EXTRA_ICONS], palette.white);
        return image(parent, [x, y, size, size], 'assets/textures/flight_icons.png', spriteHasColor ? palette.white : tint,
            ICON_NAMES.indexOf(name as typeof ICON_NAMES[number]));
    }

    /** Buttons being rattled because someone pressed them while they were disabled. */
    const rattles: Array<{ entity: Entity; x: number; y: number; start: number }> = [];
    function placeAt(entity: Entity, x: number, y: number): void {
        if (!world.valid(entity)) return;
        world.update(entity, UINode, node => { node.insetLeft = px(x); node.insetTop = px(y); });
    }

    function button(parent: Entity, bounds: Bounds, onClick: () => void, opts: ButtonOptions = {}) {
        const [x, y, w, h] = bounds;
        const tone = opts.tone ?? 'plain';
        const resting = tone === 'hero' ? palette.cyan : tone === 'primary' ? palette.amber : palette.edge;
        let disabled = Boolean(opts.disabled);
        let hovered = false;
        const handle = createButton({
            world, parent, events, disabled: opts.disabled,
            node: { position: UIPositionType.Absolute, insetLeft: px(x), insetTop: px(y), width: px(w), height: px(h) },
            // Start in the state's own colour. The engine default is a white quad that then fades to
            // the state colour, which flashed every button white whenever a page was redrawn.
            background: { color: opts.disabled ? palette.edge : resting },
            states: {
                normal: { color: resting }, hover: { color: tone === 'hero' ? palette.white : palette.hover },
                pressed: { color: palette.pressed }, disabled: { color: palette.edge },
            },
            fadeDuration: options.reducedMotion ? 0 : 0.1,
            onClick: () => {
                if (!live()) return;
                // One sound per press: if the action plays its own (the popup's whoosh, a chime, the
                // launch rumble), that is the sound; otherwise the menus' blip. `still` controls (the
                // cargo grid) always make their own. The survival run uses soundManager's click/confirm.
                const before = soundsStarted();
                onClick();
                if (!opts.still && soundsStarted() === before) play('blip');
            },
        });
        const surface = box(handle.entity, [2, 2, w - 4, h - 4],
            tone === 'hero' ? palette.teal : tone === 'primary' ? palette.amber : tone === 'tile' ? palette.well : palette.raised);
        for (const [cx, cy] of [[0, 0], [w - 4, 0], [0, h - 4], [w - 4, h - 4]]) {
            box(handle.entity, [cx!, cy!, 4, 4], palette.panel);
        }
        const ring = box(handle.entity, [w - 16, 6, 8, 8], palette.white);
        setNodeDisplayed(world, ring, false);
        const text = opts.label === undefined ? null : label(handle.entity, [8, 2, w - 16, h - 4], opts.label, {
            display: true, size: opts.labelSize ?? 18, fit: opts.labelFit, center: true, color: tone === 'primary' ? palette.ink : palette.text,
        });
        controls.push({ entity: handle.entity, ring, disabled: () => disabled, x, y });

        // Only a button on the page that is showing reacts: never one left over from a page that is
        // gone or hidden (so nothing from a previous screen can tick or click under the current one).
        const live = () => world.valid(root) && world.valid(handle.entity) && world.isEntityActive(handle.entity)
            && world.get(handle.entity, UINode).display !== UIDisplay.None;
        // Feel: lift a pixel on hover, sink on press, tick and buzz. `still` buttons (the cargo
        // grid cells) keep their place and stay quiet, since pieces are drawn over them.
        const moves = !options.reducedMotion && !opts.still;
        // Only real buttons tick: cards ("tile") and quiet rows lift but stay silent.
        const ticks = !opts.still && !opts.quiet && tone !== 'tile';
        listeners.push(events.on(handle.entity, 'hover_enter', () => {
            // Hover events bubble up from inside the button; react once per real enter.
            if (hovered || !live()) return;
            hovered = true;
            if (disabled || opts.still) return;
            if (ticks) play('tick');
            if (moves) placeAt(handle.entity, x, y - 1);
        }));
        listeners.push(events.on(handle.entity, 'hover_exit', event => {
            if (event.target !== handle.entity && event.target !== catcher) return;
            hovered = false;
            if (moves) placeAt(handle.entity, x, y);
        }));
        listeners.push(events.on(handle.entity, 'press', () => {
            if (!live()) return;
            if (disabled) { refuse(handle.entity, x, y); return; }
            vibrate('short');
            if (moves) placeAt(handle.entity, x, y + 2);
        }));
        listeners.push(events.on(handle.entity, 'release', () => {
            if (moves && !disabled) placeAt(handle.entity, x, hovered ? y - 1 : y);
        }));
        // The engine sends no pointer events to a disabled button, so while it is disabled an
        // invisible catcher covers it and turns a press into the "not allowed" rattle.
        const catcher = makeAbsBox(world, handle.entity, 0, 0, w, h, undefined, false);
        world.insert(catcher, Interactable, { enabled: true, blockRaycast: true, raycastTarget: true });
        listeners.push(events.on(catcher, 'press', () => { if (live()) refuse(handle.entity, x, y); }));
        setNodeDisplayed(world, catcher, disabled);
        const setDisabled = (value: boolean) => {
            disabled = value;
            handle.setDisabled(value);
            setNodeDisplayed(world, catcher, value);
            if (value && moves) placeAt(handle.entity, x, y);
        };
        return { ...handle, setDisabled, surface, text };
    }

    /** A press on a disabled control: it rattles side to side with a low buzz instead of doing nothing. */
    function refuse(entity: Entity, x: number, y: number): void {
        play('buzz');
        vibrate('short');
        if (options.reducedMotion || rattles.some(r => r.entity === entity)) return;
        rattles.push({ entity, x, y, start: Date.now() });
    }

    function stepRattles(): void {
        const now = Date.now();
        for (const r of [...rattles]) {
            const t = now - r.start;
            if (t >= 280 || !world.valid(r.entity)) {
                placeAt(r.entity, r.x, r.y);
                rattles.splice(rattles.indexOf(r), 1);
                continue;
            }
            placeAt(r.entity, r.x + (Math.floor(t / 40) % 2 === 0 ? 3 : -3) * (1 - t / 280), r.y);
        }
    }

    const sliders = new Set<Entity>();
    function slider(
        parent: Entity,
        bounds: Bounds,
        value: number,
        onChange: (next: number) => void,
        opts: { step?: number; disabled?: boolean; fillColor?: Color } = {},
    ) {
        const [x, y, w, h] = bounds;
        const handle = createSlider({
            world,
            events,
            parent,
            node: { position: UIPositionType.Absolute, insetLeft: px(x), insetTop: px(y), width: px(w), height: px(h) },
            min: 0,
            max: 1,
            step: opts.step ?? 0.05,
            value,
            handleWidth: 16,
            disabled: opts.disabled,
            trackVisual: { color: palette.well },
            fillVisual: { color: opts.fillColor ?? palette.cyan },
            handleVisual: { color: palette.amber },
            onChange,
        });
        for (const decoration of [handle.fillEntity, handle.handleEntity]) {
            world.update(decoration, UINode, node => { node.pointerEvents = UIPointerEvents.None; });
        }
        const ring = box(handle.entity, [w - 8, -9, 8, 8], palette.white);
        setNodeDisplayed(world, ring, false);
        controls.push({ entity: handle.entity, ring, disabled: () => Boolean(opts.disabled), x, y });
        sliders.add(handle.entity);
        return handle;
    }

    let lastFocused: Entity | null = null;
    function isEnabled(control: Control): boolean {
        return world.valid(control.entity) && world.isEntityActive(control.entity) &&
            world.get(control.entity, UINode).display !== UIDisplay.None && world.get(control.entity, Interactable).enabled;
    }
    function updateFocus(input: InputState) {
        stepRattles();
        const key = (name: string, pad: GamepadButton) => input.isKeyPressed(name) || input.isGamepadButtonPressed(pad);
        const dx = Number(key('ArrowRight', GamepadButton.DpadRight)) - Number(key('ArrowLeft', GamepadButton.DpadLeft));
        const dy = Number(key('ArrowDown', GamepadButton.DpadDown)) - Number(key('ArrowUp', GamepadButton.DpadUp));
        if ((dx || dy) && (focus.focusedEntity === null || !sliders.has(focus.focusedEntity))) {
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
        world, root, palette, box, group, frame, label, image, icon, button, slider, updateFocus,
        /** The player's Reduced Motion setting; screens with motion read it. */
        reducedMotion: options.reducedMotion,
        setText: (entity: Entity | null, content: string) => setText(world, entity, content),
        textColor: (entity: Entity | null, fill: Color) => setTextColor(world, entity, fill),
        fill: (entity: Entity | null, fill: Color) => setVisualColor(world, entity, fill),
        show: (entity: Entity, visible: boolean) => setNodeDisplayed(world, entity, visible),
        on: (entity: Entity, event: string, handler: () => void) => listeners.push(events.on(entity, event, handler)),
        hasKeyboardFocus: (entity: Entity) => focus.isVisiblyFocused(entity),
    };
}

export type FlightUi = ReturnType<typeof makeFlightUi>;
