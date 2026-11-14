import {
    Assets, defineSystem, FocusManager, GamepadButton, GetWorld, Input, Res, Storage, UIEvents,
    type Entity, type World,
} from 'esengine';
import {
    computeSkillModifiers, DEFAULT_SKILL_MODIFIERS, SKILL_TREE_UPGRADES, STORAGE_KEYS,
    type MainLoopResult, type MissionSetupInput,
} from '../contracts/gameContract';
import type { CargoPlacement } from '../data/cargo';
import { buildLaunchSetup, LAUNCH_CREW_SIZE, launchProblem, missionOffers, preparedMoonOffer, type MissionOffer } from '../data/missions';
import { awardResearch, loadProfile, purchaseUpgrade, resetUpgrades, type PlaytestProfile } from '../data/profile';
import { showCargoPacker } from '../ui/cargoPacker';
import { showLaunchSummary } from '../ui/launchSummary';
import {
    showCrew, showExit, showMenu, showMissions, showPreparedManifest, showQuit, showSettings, showShell, showUpgrades, type Page,
} from '../ui/flightScreens';
import { makeFlightArt, makeFlightUi } from '../ui/flightUi';
import { makeAbsBox, setNodeDisplayed } from '../ui/theme';
import { menuAmbience, setFeedbackPrefs } from '../ui/feedback';
import { mountSurvivalUi } from './gameUi';

const controllers = new WeakMap<World, { root: Entity; update: () => void }>();

function readPendingSetup(): MissionSetupInput | undefined {
    const setup = Storage.getJSON<MissionSetupInput>(STORAGE_KEYS.PENDING_SETUP);
    return setup?.missionGoal && Array.isArray(setup.crew) && setup.cargo && setup.startingResources && setup.startingConditions
        ? setup : undefined;
}

export const flightSystem = defineSystem(
    [GetWorld(), Res(UIEvents), Res(Assets), Res(Input), Res(FocusManager)],
    (world, events, assets, input, focus) => {
        const foundRoot = world.findEntityByName('GameRoot');
        if (foundRoot === null) return;
        const sceneRoot: Entity = foundRoot;
        const current = controllers.get(world);
        if (current?.root === sceneRoot) {
            current.update();
            return;
        }

        const backdrop = world.findEntityByName('OutpostBackdrop');
        const art = makeFlightArt(world, sceneRoot, assets);
        const legacySkills = Storage.getJSON<unknown>(STORAGE_KEYS.ACTIVE_SKILLS);
        const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
        let profile = loadProfile(Storage.getJSON<unknown>(STORAGE_KEYS.PROFILE), legacySkills, reducedMotion);
        setFeedbackPrefs(profile);
        let page: Page = 'menu';
        let nextPage: Page | null = null;
        let pageRoot: Entity | null = null;
        let tickPage: (() => void) | null = null;
        let selectedCrewId = profile.crewIds[0] ?? 'crew_engineer';
        let selectedUpgradeId = SKILL_TREE_UPGRADES[0]!.id;
        /** Set for one render after buying an upgrade, so the Upgrade page can celebrate it. */
        let justUnlocked: string | null = null;
        /** The branch the Upgrade page last showed, so only a new branch (or a fresh visit) animates the tree in. */
        let upgradeBranch: string | null = null;
        let offer: MissionOffer | null = null;
        let missionPage = 0;
        let draft: CargoPlacement[] = [];
        let draftKey = '';
        let runSetup: MissionSetupInput | null = null;

        function saveProfile(next: PlaytestProfile): void {
            if (next === profile) return;
            Storage.setJSON(STORAGE_KEYS.PROFILE, next);
            profile = next;
            setFeedbackPrefs(profile);
        }

        function navigate(destination: Page): void {
            nextPage = destination;
        }

        function selectMission(next: MissionOffer): void {
            const newKey = next.setup ? `${next.setup.planet}:${next.setup.missionGoal.id}` : '';
            if (!next.setup) return;
            if (draftKey !== newKey) draft = [];
            draftKey = newKey;
            offer = next;
            navigate('cargo');
        }

        function launch(next: MissionOffer, usePreparedCrew: boolean): void {
            const setup = buildLaunchSetup(next, profile.crewIds, draft, usePreparedCrew);
            if (!setup || launchProblem(setup)) return;
            setup.skillModifiers = computeSkillModifiers(profile.upgradeIds, { ...DEFAULT_SKILL_MODIFIERS, ...setup.skillModifiers });
            runSetup = setup;
            draft = [];
            draftKey = '';
            if (next.prepared === 'team') Storage.remove(STORAGE_KEYS.PENDING_SETUP);
            navigate('run');
        }

        function render(destination: Page): void {
            const previousPage = page;
            page = destination;
            // The station hum belongs to the title screen only.
            if (destination !== 'menu') menuAmbience(false);
            focus.blur();
            if (pageRoot !== null) world.despawn(pageRoot);
            const root = makeAbsBox(world, sceneRoot, 0, 0, 1280, 720);
            pageRoot = root;
            tickPage = null;
            setNodeDisplayed(world, backdrop, page === 'run');

            if (page === 'run' && runSetup) {
                const runId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                const finish = (result: MainLoopResult) => {
                    saveProfile(awardResearch(profile, runId, result.researchPointsEarned));
                    Storage.setJSON(STORAGE_KEYS.LAST_RESULT, result);
                };
                const exit = (target: 'menu' | 'mission' | 'moon') => {
                    if (target === 'moon') {
                        const moon = preparedMoonOffer();
                        launch(moon, profile.crewIds.length !== LAUNCH_CREW_SIZE);
                    } else navigate(target);
                };
                tickPage = mountSurvivalUi({
                    world, events, assets, focus, gameRoot: root, setup: runSetup, reducedMotion: profile.reducedMotion, onFinish: finish, onExit: exit,
                });
                return;
            }

            const ui = makeFlightUi(world, events, root, art, focus, profile);
            // Returns true when the page used Escape itself (e.g. putting back a held cargo item).
            let surfaceTick: ((state: typeof input) => boolean | void) | undefined;
            switch (page) {
                case 'crew':
                    showShell(ui, page, 'Crew', 'Pick 4 crew for your next mission.', 'crew', navigate);
                    surfaceTick = showCrew(ui, profile, selectedCrewId, crewIds => saveProfile({ ...profile, crewIds }), id => { selectedCrewId = id; });
                    break;
                case 'upgrade':
                    showShell(ui, page, 'Upgrade', 'Spend research points to make every mission easier.', 'upgrade', navigate);
                    surfaceTick = showUpgrades(ui, profile, SKILL_TREE_UPGRADES.find(node => node.id === selectedUpgradeId)!, id => {
                        if (id !== selectedUpgradeId) { selectedUpgradeId = id; navigate('upgrade'); }
                    }, node => {
                        saveProfile(purchaseUpgrade(profile, node));
                        Storage.setJSON(STORAGE_KEYS.ACTIVE_SKILLS, profile.upgradeIds);
                        justUnlocked = node.id;
                        navigate('upgrade');
                    }, (() => {
                        const branch = SKILL_TREE_UPGRADES.find(node => node.id === selectedUpgradeId)!.branch;
                        const fx = { justUnlocked, newBranch: previousPage !== 'upgrade' || branch !== upgradeBranch };
                        upgradeBranch = branch;
                        return fx;
                    })(), () => {
                        saveProfile(resetUpgrades(profile));
                        Storage.setJSON(STORAGE_KEYS.ACTIVE_SKILLS, profile.upgradeIds);
                        upgradeBranch = null;
                        navigate('upgrade');
                    });
                    justUnlocked = null;
                    break;
                case 'mission':
                    showShell(ui, page, 'Mission Selection', 'Pick a job for your crew.', 'mars', navigate);
                    surfaceTick = showMissions(ui, missionOffers(readPendingSetup()), selectMission, missionPage, next => { missionPage = next; navigate('mission'); });
                    break;
                case 'cargo': {
                    const chosen = offer;
                    if (!chosen?.setup) { navigate('mission'); break; }
                    showShell(ui, page, 'Cargo Preparation', `${chosen.title} · pack what the mission needs`, 'windSampler', navigate);
                    const problem = (placements: CargoPlacement[]) => {
                        const setup = buildLaunchSetup(chosen, profile.crewIds, placements);
                        return setup ? launchProblem(setup) : 'Choose a mission to launch.';
                    };
                    const start = () => launch(chosen, Boolean(chosen.prepared));
                    if (chosen.prepared) showPreparedManifest(ui, chosen, problem(draft), start);
                    // Packed missions go through the Launch Summary before the run.
                    else surfaceTick = showCargoPacker(ui, chosen.setup, draft, next => { draft = next; }, problem, () => navigate('review'));
                    break;
                }
                case 'review': {
                    const chosen = offer;
                    const preview = chosen?.setup ? buildLaunchSetup(chosen, profile.crewIds, draft) : null;
                    if (!chosen || !preview) { navigate('mission'); break; }
                    showShell(ui, page, 'Launch Summary', `${chosen.title} · last check before launch`, 'check', navigate);
                    surfaceTick = showLaunchSummary(ui, preview, draft, launchProblem(preview), () => launch(chosen, false), () => navigate('cargo'), chosen.image);
                    break;
                }
                case 'settings':
                    showShell(ui, page, 'Settings', 'Sound, vibration, motion and contrast.', 'settings', navigate);
                    showSettings(ui, profile, setting => { saveProfile({ ...profile, [setting]: !profile[setting] }); navigate('settings'); });
                    break;
                case 'quit':
                    showQuit(ui, navigate);
                    break;
                case 'exit':
                    showExit(ui, navigate);
                    break;
                default:
                    surfaceTick = showMenu(ui, navigate, profile.reducedMotion);
            }
            tickPage = () => {
                // The page sees input first, so Escape can put back a held cargo item instead of leaving.
                const usedEscape = surfaceTick?.(input) === true;
                if (!usedEscape && (input.isKeyPressed('Escape') || input.isGamepadButtonPressed(GamepadButton.East))) {
                    if (page === 'cargo') navigate('mission');
                    else if (page === 'review') navigate('cargo');
                    else if (page !== 'menu') navigate('menu');
                }
                ui.updateFocus(input);
            };
        }

        controllers.set(world, {
            root: sceneRoot,
            update() {
                if (nextPage) {
                    const requested = nextPage;
                    nextPage = null;
                    render(requested);
                }
                tickPage?.();
            },
        });
        render('menu');
    },
    { name: 'FlightScreenSystem' },
);
