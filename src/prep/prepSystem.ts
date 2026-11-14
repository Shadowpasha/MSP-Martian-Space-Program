// Mission Prep runtime: builds the three screens under the "PrepRoot" entity of
// assets/scenes/mission-prep.esscene, routes input, and on Launch writes the
// contract MissionSetupInput to Storage and switches to the team's main scene.
// It does nothing in any scene without a PrepRoot, so the main loop is untouched.
import {
    Assets,
    defineSystem,
    GetWorld,
    Input,
    Res,
    SceneManager,
    Storage,
    transitionTo,
    UIEvents,
    type Entity,
    type SceneManagerState,
    type UIEventQueue,
    type World,
} from 'esengine';
import { STORAGE_KEYS, type CrewMember } from '../contracts/gameContract';
import {
    cancelHeld, chooseFocusedMission, clearHover, confirmCrew, cycleShelfTab, emptyBay, focusCrew, focusOffer,
    goTo, launch, moveCrewFocus, moveOfferFocus, moveShelfFocus, newPrepState, pickFocusedShelf, pickFromGrid,
    pickFromShelf, placeHeldAt, rotateHeld, setHover, setShelfTab, toggleCrew, unpackAt, type PrepState,
} from './logic/flow';
import { assetsReady, loadPrepAssets, type AssetsState } from './ui/assets';
import { Ui } from './ui/kit';
import { T } from './ui/tokens';
import { buildCrewPick } from './screens/crewPick';
import { buildMissionSelect, type ScreenHandle } from './screens/missionSelect';
import { buildPackRocket } from './screens/packRocket';
import { buildStub, type StubId } from './screens/shell';

/** The team's main-loop scene, loaded after Launch. */
export const OUTPOST_SCENE = { name: 'outpost', path: 'assets/scenes/main.esscene' };
const ASSET_TIMEOUT_MS = 4000;
const DRAG_THRESHOLD_PX = 6;

interface InputLike {
    mouseX: number;
    mouseY: number;
    isKeyPressed(code: string): boolean;
    isMouseButtonPressed(button: number): boolean;
    isMouseButtonReleased(button: number): boolean;
}

let state: PrepState | null = null;
let rootEntity: Entity | null = null;
let ui: Ui | null = null;
let screen: ScreenHandle = {};
let stub: StubId | null = null;
let builtStub: StubId | null = null;
let loadStarted = 0;
let launched = false;
/**
 * Pointer press that picked something up: a release far enough away is a drop.
 * 'pending' = pressed this frame; the origin is read from Input on the next tick
 * (UI handlers run outside this system, so the mouse sampled here is the press point).
 */
let drag: { x: number; y: number } | 'pending' | null = null;

function now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function portraitOf(m: CrewMember): string {
    return m.portraitPath;
}

export const prepSystem = defineSystem(
    [GetWorld(), Res(UIEvents), Res(Assets), Res(Input), Res(SceneManager)],
    (world: World, events: UIEventQueue, assets: unknown, input: unknown, scenes: SceneManagerState) => {
        const prepRoot = world.findEntityByName('PrepRoot');
        if (prepRoot === null) {
            state = null;
            rootEntity = null;
            return;
        }
        if (launched) return;
        const inp = input as InputLike;

        if (!state) {
            const skills = Storage.getJSON<string[]>(STORAGE_KEYS.ACTIVE_SKILLS) ?? [];
            state = newPrepState({ unlockedSkillIds: skills });
            loadPrepAssets(assets as AssetsState, state.roster.map(portraitOf));
            loadStarted = now();
            ui = new Ui(world, events);
        }
        const s = state;
        if (!assetsReady() && now() - loadStarted < ASSET_TIMEOUT_MS) return;

        handleInput(s, inp);

        if (s.dirty || stub !== builtStub || rootEntity === null) {
            rebuild(world, prepRoot, s, scenes);
        } else if (s.previewDirty) {
            s.previewDirty = false;
            screen.refreshPreview?.();
        }
        screen.tick?.(now());
    },
    { name: 'MissionPrepSystem' },
);

const ARROWS = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'] as const;

function handleInput(s: PrepState, inp: InputLike): void {
    const key = (c: string) => inp.isKeyPressed(c);
    const anyKey = ARROWS.some(key) || key('Enter') || key('Space') || key('KeyQ') || key('KeyE') || key('KeyX');
    if (anyKey && !s.keyboard) { s.keyboard = true; s.dirty = true; }
    if (inp.isMouseButtonPressed(0) && s.keyboard) { s.keyboard = false; s.dirty = true; }
    const dx = (key('ArrowRight') ? 1 : 0) - (key('ArrowLeft') ? 1 : 0);
    const dy = (key('ArrowDown') ? 1 : 0) - (key('ArrowUp') ? 1 : 0);

    if (key('Escape')) {
        if (stub) { stub = null; return; }
        if (s.held) cancelHeld(s);
    }
    if (stub) return;

    if (s.screen === 'mission') {
        if (dx || dy) moveOfferFocus(s, dx || dy);
        if (key('Enter') || key('Space')) chooseFocusedMission(s);
        return;
    }
    if (s.screen === 'crew') {
        if (dx || dy) moveCrewFocus(s, dx, dy);
        if (key('Space')) toggleCrew(s, s.crewFocus);
        if (key('Enter')) confirmCrew(s);
        return;
    }

    // ---- Pack the Rocket ----
    if (key('KeyR') || inp.isMouseButtonPressed(2)) rotateHeld(s);
    if (s.held) {
        // Arrows move the target slot, Enter/Space packs it there.
        if (dx || dy) {
            const h = s.hover ?? { x: 0, y: 0 };
            setHover(s, clamp(h.x + dx, 0, s.grid.cols - 1), clamp(h.y + dy, 0, s.grid.rows - 1));
        }
        if ((key('Enter') || key('Space')) && s.hover) placeHeldAt(s, s.hover.x, s.hover.y);
    } else {
        if (dx) moveShelfFocus(s, dx);
        if (key('KeyQ')) cycleShelfTab(s, -1);
        if (key('KeyE')) cycleShelfTab(s, 1);
        if (key('Enter') || key('Space')) pickFocusedShelf(s);
        if (key('KeyX') && s.hover) unpackAt(s, s.hover.x, s.hover.y);
    }

    // Drag and drop: releasing away from where the press started drops the item.
    if (drag === 'pending') {
        drag = { x: inp.mouseX, y: inp.mouseY };
    } else if (drag && inp.isMouseButtonReleased(0)) {
        const moved = Math.hypot(inp.mouseX - drag.x, inp.mouseY - drag.y) > DRAG_THRESHOLD_PX;
        drag = null;
        if (moved && s.held) {
            if (s.hover) {
                // A drag ends empty-handed; click-packing keeps supplies in hand instead.
                if (placeHeldAt(s, s.hover.x, s.hover.y)) s.held = null;
                else cancelHeld(s);
            } else {
                cancelHeld(s);
            }
        }
    }
}

function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}

function rebuild(world: World, prepRoot: Entity, s: PrepState, scenes: SceneManagerState): void {
    const kit = ui!;
    kit.destroy(rootEntity);
    s.dirty = false;
    s.previewDirty = false;
    builtStub = stub;
    // Each build gets a fresh child root under PrepRoot so teardown is one despawn.
    rootEntity = kit.box(prepRoot, 0, 0, 1280, 720, T.ink900, false);

    const shell = {
        openStub: (id: StubId) => { stub = id; },
        goTo: (to: 'mission' | 'crew' | 'pack') => goTo(s, to),
    };

    if (s.screen === 'mission') {
        screen = buildMissionSelect(kit, rootEntity, s, {
            ...shell,
            focus: (i) => focusOffer(s, i),
            choose: () => chooseFocusedMission(s),
        });
    } else if (s.screen === 'crew') {
        screen = buildCrewPick(kit, rootEntity, s, {
            ...shell,
            focus: (id) => focusCrew(s, id),
            toggle: (id) => toggleCrew(s, id),
            next: () => confirmCrew(s),
        }, portraitOf);
    } else {
        screen = buildPackRocket(kit, rootEntity, s, {
            ...shell,
            shelfPress: (id) => {
                if (s.held && s.held.itemId === id && s.held.from.kind === 'shelf') { cancelHeld(s); return; }
                pickFromShelf(s, id);
                drag = 'pending';
            },
            cellPress: (x, y) => {
                if (s.held) { placeHeldAt(s, x, y); return; }
                if (pickFromGrid(s, x, y)) drag = 'pending';
            },
            hover: (x, y) => setHover(s, x, y),
            hoverOut: (x, y) => { if (s.hover && s.hover.x === x && s.hover.y === y) clearHover(s); },
            tab: (t) => setShelfTab(s, t),
            rotate: () => rotateHeld(s),
            empty: () => emptyBay(s),
            launch: () => doLaunch(world, s, scenes),
        });
        screen.refreshPreview?.();
    }

    if (stub) buildStub(kit, rootEntity, stub, () => { stub = null; });
}

function doLaunch(world: World, s: PrepState, scenes: SceneManagerState): void {
    const setup = launch(s);
    if (!setup) return;
    Storage.setJSON(STORAGE_KEYS.PENDING_SETUP, setup);
    launched = true;
    ui?.destroy(rootEntity);
    rootEntity = null;
    try {
        if (!scenes.isLoaded(OUTPOST_SCENE.name)) scenes.register(OUTPOST_SCENE);
        void transitionTo(scenes, OUTPOST_SCENE.name, { type: 'fade', duration: 0.5, color: T.ink900 });
    } catch (err) {
        // Setup is saved either way: opening main.esscene and pressing Play picks it up.
        console.warn('[MissionPrep] scene switch failed; open assets/scenes/main.esscene', err);
        launched = false;
        s.dirty = true;
    }
    void world;
}
