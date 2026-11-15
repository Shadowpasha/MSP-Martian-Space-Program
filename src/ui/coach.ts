// Draws one tutorial step: ARIES the robot in a speech bubble, a glowing frame around the button
// to click, a bouncing arrow pointing at it, and the rest of the screen dimmed.
//
// Nothing here blocks the game. The dimmed parts stay clickable, so a player who clicks somewhere
// else simply gets the next step from wherever they land (see tutorialSteps.ts).
import { Interactable, px, UINode, uiNodeWorldBox, type Entity } from 'esengine';
import { play } from './feedback';
import type { Bounds, FlightUi } from './flightUi';
import { makeAbsBox, setNodeDisplayed } from './theme';
import type { CoachStep } from './tutorialSteps';

const ROBOT = 'assets/textures/ai_robot.png';
const SCREEN: Bounds = [0, 0, 1280, 720];
type Rect = readonly [x: number, y: number, width: number, height: number];
type MakeButton = (key: string, parent: Entity, bounds: Bounds, action: () => void, options?: Parameters<FlightUi['button']>[3]) => unknown;

export interface Coach {
    /** Call every frame: follows the button and runs the pulse and the arrow's bounce. */
    tick(): void;
    dispose(): void;
}

/** Where each step's button was last seen, so a redrawn screen shows the spotlight at once. */
const remembered = new Map<string, Rect>();
let lastSpoken = '';

const overlap = (a: Rect, b: Rect) =>
    Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));

/** Pixel-art arrow, drawn in a 44 x 48 box. Each row is [x, y, width, height]. */
const ARROW_DOWN: readonly Bounds[] = [[16, 2, 12, 20], [2, 22, 40, 6], [8, 28, 28, 6], [14, 34, 16, 6], [19, 40, 6, 6]];
const ARROW_UP: readonly Bounds[] = ARROW_DOWN.map(([x, y, w, h]): Bounds => [x, 48 - y - h, w, h]);

export function showCoach(
    ui: FlightUi, root: Entity, step: CoachStep, find: (key: string) => Entity | undefined,
    actions: { next: () => void; skip: () => void },
    makeButton: MakeButton = (_key, parent, bounds, action, options) => ui.button(parent, bounds, action, options),
): Coach {
    const { world, palette: p } = ui;
    const owned: Entity[] = [];
    const own = (entity: Entity) => { owned.push(entity); return entity; };
    const place = (entity: Entity, [x, y, w, h]: Rect) => {
        const shown = w > 0 && h > 0;
        setNodeDisplayed(world, entity, shown);
        if (shown) world.update(entity, UINode, node => {
            node.insetLeft = px(Math.round(x)); node.insetTop = px(Math.round(y));
            node.width = px(Math.round(w)); node.height = px(Math.round(h));
        });
    };

    // Two invisible boxes at known places: a button's place on the 1280 x 720 screen is read by
    // comparing its laid-out box with theirs, whatever size the game is drawn at.
    const screen = own(ui.box(root, SCREEN));
    const corner = own(ui.box(root, [0, 0, 16, 16]));

    // Screens with a lot to read (the morning news, the day's report) stay bright.
    const dimmed = !step.compact && !step.showGuide;
    const shade = { ...p.ink, a: 0.56 };
    const dims = [0, 1, 2, 3].map(() => own(ui.box(root, [0, 0, 0, 0], shade)));
    const outline = [0, 1, 2, 3].map(() => own(ui.box(root, [0, 0, 0, 0], p.ink)));
    const ring = [0, 1, 2, 3].map(() => own(ui.box(root, [0, 0, 0, 0], p.amber)));
    const arrow = (rows: readonly Bounds[]) => {
        const holder = own(makeAbsBox(world, root, 0, 0, 44, 48, undefined, true));
        rows.forEach(([x, y, w, h]) => ui.box(holder, [x - 2, y - 2, w + 4, h + 4], p.ink));
        rows.forEach(row => ui.box(holder, row, p.hover));
        setNodeDisplayed(world, holder, false);
        return holder;
    };
    const arrowDown = arrow(ARROW_DOWN);
    const arrowUp = arrow(ARROW_UP);

    // The speech bubble. It catches clicks so nothing underneath is pressed through it.
    const [bw, bh] = step.compact ? [1240, 60] : [600, 180];
    const bubble = own(ui.group(root, [0, 0, bw, bh]));
    world.insert(bubble, Interactable, { enabled: true, blockRaycast: true, raycastTarget: true });
    const body = ui.frame(bubble, [0, 0, bw, bh], p.ink, p.cyan);
    if (step.compact) {
        ui.image(body, [6, 2, 48, 48], ROBOT);
        ui.label(body, [66, 2, 970, 48], step.text, { display: true, size: 20, fit: 14, wrap: true });
        makeButton('coach-skip', body, [1050, 8, 170, 36], actions.skip, { label: 'Skip tutorial', labelSize: 14 });
    } else {
        ui.image(body, [10, 8, 78, 78], ROBOT);
        ui.label(body, [4, 88, 90, 22], 'ARIES', { display: true, size: 15, color: p.cyan, center: true });
        ui.label(body, [102, 6, 478, 112], step.text, { display: true, size: 22, fit: 16, wrap: true });
        makeButton('coach-skip', body, [102, 128, 170, 32], actions.skip, { label: 'Skip tutorial', labelSize: 13 });
        if (step.next) makeButton('coach-next', body, [352, 122, 228, 42], actions.next, { label: step.next, tone: 'primary', labelSize: 20 });
        else if (step.target) ui.label(body, [288, 124, 292, 40], 'Click the glowing button!', { size: 15, color: p.amber, center: true });
    }

    if (lastSpoken !== step.id) {
        lastSpoken = step.id;
        play('blip', 1.4);
    }

    const memory = `${step.id}|${step.target ?? ''}`;
    function measure(): Rect | null {
        if (step.area) return step.area;
        if (!step.target) return null;
        const entity = find(step.target);
        if (entity !== undefined && world.valid(entity)) {
            const target = uiNodeWorldBox(world, entity);
            const full = uiNodeWorldBox(world, screen);
            const top = uiNodeWorldBox(world, corner);
            if (target && full && top && full.hw > 0 && full.hh > 0 && target.hw > 0 && target.hh > 0) {
                const kx = 640 / full.hw;
                const ky = 360 / full.hh;
                // The layout's y axis may point up or down; the corner box says which.
                const yUp = top.cy > full.cy;
                const rect: Rect = [
                    (target.cx - target.hw - (full.cx - full.hw)) * kx,
                    (yUp ? full.cy + full.hh - (target.cy + target.hh) : target.cy - target.hh - (full.cy - full.hh)) * ky,
                    target.hw * 2 * kx, target.hh * 2 * ky,
                ];
                remembered.set(memory, rect);
                return rect;
            }
        }
        return remembered.get(memory) ?? null;
    }

    /** The bubble goes where it does not cover the button or its arrow. */
    function bubbleSpot(rect: Rect | null): readonly [number, number] {
        if (step.compact) return step.showGuide || (rect && rect[1] + rect[3] > 640) ? [20, 4] : [20, 656];
        if (!rect) return step.showGuide ? [340, 528] : [340, 270];
        const keepClear: Rect = [rect[0] - 16, rect[1] - 64, rect[2] + 32, rect[3] + 128];
        const spots: ReadonlyArray<readonly [number, number]> =
            [[340, 528], [16, 528], [664, 528], [340, 12], [16, 12], [664, 12], [340, 270], [16, 270], [664, 270]];
        let best = spots[0]!;
        let least = Infinity;
        for (const spot of spots) {
            const covered = overlap([spot[0], spot[1], bw, bh], keepClear);
            if (covered < least) { least = covered; best = spot; }
            if (!covered) break;
        }
        return best;
    }

    let drawn = '';
    function draw(rect: Rect | null, beat: number): void {
        const [bx, by] = bubbleSpot(rect);
        place(bubble, [bx, by, bw, bh]);
        if (!rect) {
            place(dims[0]!, dimmed ? SCREEN : [0, 0, 0, 0]);
            [dims[1]!, dims[2]!, dims[3]!, ...outline, ...ring, arrowDown, arrowUp].forEach(entity => setNodeDisplayed(world, entity, false));
            return;
        }
        // A hole around the button, with the four sides of the screen dimmed around it.
        const x = Math.max(0, rect[0] - 8);
        const y = Math.max(0, rect[1] - 8);
        const w = Math.min(1280, rect[0] + rect[2] + 8) - x;
        const h = Math.min(720, rect[1] + rect[3] + 8) - y;
        const sides: Rect[] = dimmed ? [[0, 0, 1280, y], [0, y + h, 1280, 720 - y - h], [0, y, x, h], [x + w, y, 1280 - x - w, h]] : [];
        dims.forEach((entity, index) => place(entity, sides[index] ?? [0, 0, 0, 0]));
        const frame = (boxes: Entity[], grow: number, thick: number) => {
            const [fx, fy, fw, fh] = [rect[0] - grow, rect[1] - grow, rect[2] + grow * 2, rect[3] + grow * 2];
            place(boxes[0]!, [fx, fy, fw, thick]);
            place(boxes[1]!, [fx, fy + fh - thick, fw, thick]);
            place(boxes[2]!, [fx, fy, thick, fh]);
            place(boxes[3]!, [fx + fw - thick, fy, thick, fh]);
        };
        const grow = 7 + beat * 3;
        frame(outline, grow + 2, 8);
        frame(ring, grow, 4);
        // The arrow points down at the button from above, or up from below when there is no room.
        const cx = Math.max(4, Math.min(1232, rect[0] + rect[2] / 2 - 22));
        const above = rect[1] - grow >= 60;
        setNodeDisplayed(world, arrowDown, above);
        setNodeDisplayed(world, arrowUp, !above);
        if (above) place(arrowDown, [cx, rect[1] - grow - 52 - beat * 6, 44, 48]);
        else place(arrowUp, [cx, rect[1] + rect[3] + grow + 4 + beat * 6, 44, 48]);
    }

    function tick(): void {
        if (!world.valid(bubble)) return;
        const rect = measure();
        const beat = ui.reducedMotion ? 0 : Math.floor(Date.now() / 380) % 2;
        const key = `${rect ? rect.map(Math.round).join(',') : 'none'}|${beat}`;
        if (key === drawn) return;
        drawn = key;
        draw(rect, beat);
    }
    tick();

    return {
        tick,
        dispose() {
            owned.forEach(entity => { if (world.valid(entity)) world.despawn(entity); });
        },
    };
}
