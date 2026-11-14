import {
    Assets, Audio, defineSystem, FocusManager, GamepadButton, GetWorld, Input, Res, Storage, UIEvents,
    type Entity, type World,
} from 'esengine';
import {
    computeSkillModifiers, DEFAULT_SKILL_MODIFIERS, SKILL_TREE_UPGRADES, STORAGE_KEYS,
    type MainLoopResult, type MissionSetupInput,
} from '../contracts/gameContract';
import type { CargoPlacement } from '../data/cargo';
import { buildLaunchSetup, LAUNCH_CREW_SIZE, launchProblem, missionOffers, preparedMoonOffer, type MissionOffer } from '../data/missions';
import { awardResearch, loadProfile, purchaseUpgrade, type PlaytestProfile } from '../data/profile';
import { showCargo } from '../ui/cargoScreen';
import {
    showCrew, showExit, showMenu, showMissions, showPreparedManifest, showQuit, showSettings, showShell, showUpgrades, type Page,
} from '../ui/flightScreens';
import { makeFlightArt, makeFlightUi } from '../ui/flightUi';
import { makeAbsBox, setNodeDisplayed } from '../ui/theme';
import { bindAudio, playMusic, setSoundEnabled, setVolumes, unlockAudio } from '../audio/soundManager';
import { mountSurvivalUi } from './gameUi';

const controllers = new WeakMap<World, { root: Entity; update: () => void }>();

function readPendingSetup(): MissionSetupInput | undefined {
    const setup = Storage.getJSON<MissionSetupInput>(STORAGE_KEYS.PENDING_SETUP);
    return setup?.missionGoal && Array.isArray(setup.crew) && setup.cargo && setup.startingResources && setup.startingConditions
        ? setup : undefined;
}

export const flightSystem = defineSystem(
    [GetWorld(), Res(UIEvents), Res(Assets), Res(Input), Res(FocusManager), Res(Audio)],
    (world, events, assets, input, focus, audio) => {
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
        bindAudio(audio);
        setVolumes(profile.masterVolume, profile.musicVolume, profile.sfxVolume);
        setSoundEnabled(profile.soundEnabled);
        let page: Page = 'menu';
        let nextPage: Page | null = null;
        let pageRoot: Entity | null = null;
        let tickPage: (() => void) | null = null;
        let selectedCrewId = profile.crewIds[0] ?? 'crew_engineer';
        let selectedUpgradeId = SKILL_TREE_UPGRADES[0]!.id;
        let offer: MissionOffer | null = null;
        let draft: CargoPlacement[] = [];
        let draftKey = '';
        let runSetup: MissionSetupInput | null = null;

        function saveProfile(next: PlaytestProfile): void {
            if (next === profile) return;
            Storage.setJSON(STORAGE_KEYS.PROFILE, next);
            profile = next;
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
            page = destination;
            focus.blur();
            if (pageRoot !== null) world.despawn(pageRoot);
            const root = makeAbsBox(world, sceneRoot, 0, 0, 1280, 720);
            pageRoot = root;
            tickPage = null;
            setNodeDisplayed(world, backdrop, page === 'run');
            playMusic(page === 'run' ? 'game' : 'menu');

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
            let surfaceTick: ((state: typeof input) => void) | undefined;
            switch (page) {
                case 'crew':
                    showShell(ui, page, 'Crew', 'Select four specialists for the next mission.', 'crew', navigate);
                    showCrew(ui, profile, selectedCrewId, crewIds => saveProfile({ ...profile, crewIds }), id => { selectedCrewId = id; });
                    break;
                case 'upgrade':
                    showShell(ui, page, 'Upgrade', 'Spend research to improve future missions.', 'upgrade', navigate);
                    showUpgrades(ui, profile, SKILL_TREE_UPGRADES.find(node => node.id === selectedUpgradeId)!, id => {
                        if (id !== selectedUpgradeId) { selectedUpgradeId = id; navigate('upgrade'); }
                    }, node => {
                        saveProfile(purchaseUpgrade(profile, node));
                        Storage.setJSON(STORAGE_KEYS.ACTIVE_SKILLS, profile.upgradeIds);
                        navigate('upgrade');
                    });
                    break;
                case 'mission':
                    showShell(ui, page, 'Mission Selection', 'Review the contract before loading the cargo bay.', 'mars', navigate);
                    showMissions(ui, missionOffers(readPendingSetup()), selectMission);
                    break;
                case 'cargo': {
                    const chosen = offer;
                    if (!chosen?.setup) { navigate('mission'); break; }
                    showShell(ui, page, 'Cargo Preparation', chosen.title, 'windSampler', navigate);
                    const problem = (placements: CargoPlacement[]) => {
                        const setup = buildLaunchSetup(chosen, profile.crewIds, placements);
                        return setup ? launchProblem(setup) : 'Choose a mission to launch.';
                    };
                    const start = () => launch(chosen, Boolean(chosen.prepared));
                    if (chosen.prepared) showPreparedManifest(ui, chosen, problem(draft), start);
                    else surfaceTick = showCargo(ui, draft, next => { draft = next; }, problem, start);
                    break;
                }
                case 'settings':
                    showShell(ui, page, 'Settings', 'Adjust motion, contrast, and audio levels for this profile.', 'settings', navigate);
                    showSettings(
                        ui,
                        profile,
                        setting => {
                            const updated = { ...profile, [setting]: !profile[setting] };
                            saveProfile(updated);
                            if (setting === 'soundEnabled') setSoundEnabled(updated.soundEnabled);
                            navigate('settings');
                        },
                        (field, value) => {
                            const updated = { ...profile, [field]: value };
                            saveProfile(updated);
                            setVolumes(updated.masterVolume, updated.musicVolume, updated.sfxVolume);
                        },
                    );
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
                if (input.isKeyPressed('Escape') || input.isGamepadButtonPressed(GamepadButton.East)) {
                    if (page === 'cargo') navigate('mission');
                    else if (page !== 'menu') navigate('menu');
                }
                ui.updateFocus(input);
                surfaceTick?.(input);
            };
        }

        controllers.set(world, {
            root: sceneRoot,
            update() {
                if (input.isMouseButtonPressed(0) || input.isKeyPressed('Enter') || input.isKeyPressed('Space')) {
                    unlockAudio();
                }
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
