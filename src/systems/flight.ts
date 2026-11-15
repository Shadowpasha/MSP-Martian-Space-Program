import {
    Assets, Audio, defineSystem, FocusManager, GamepadButton, GetWorld, Input, Res, Storage, UIEvents,
    type Entity, type World,
} from 'esengine';
import {
    SKILL_TREE_UPGRADES, STORAGE_KEYS,
    type MainLoopResult, type MissionSetupInput,
} from '../contracts/gameContract';
import type { CargoPlacement } from '../data/cargo';
import { buildLaunchSetup, cargoProblem, LAUNCH_CREW_SIZE, launchProblem, missionOffers, type MissionOffer } from '../data/missions';
import { loadProfile, purchaseUpgrade, recordResearch, resetUpgrades, type PlaytestProfile } from '../data/profile';
import { showCargoPacker } from '../ui/cargoPacker';
import { showLaunchSummary } from '../ui/launchSummary';
import {
    showCrew, showExit, showMenu, showMissions, showPreparedManifest, showQuit, showSettings, showShell, showUpgrades, type Page,
} from '../ui/flightScreens';
import { makeFlightArt, makeFlightUi, type IconName } from '../ui/flightUi';
import { makeAbsBox, setNodeDisplayed } from '../ui/theme';
import { setFeedbackPrefs } from '../ui/feedback';
import { bindAudio, playMusic, setSoundEnabled, setVolumes, unlockAudio } from '../audio/soundManager';
import { mountTharsisFlight } from '../ui/tharsisFlight';
import { showCoach, type Coach } from '../ui/coach';
import { tutorial } from '../ui/tutorial';
import { menuStep } from '../ui/tutorialSteps';
import type { VolumeField } from '../ui/audioSettings';

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
        // The tutorial is for new players: a save that has already finished a mission skips it.
        if (profile.awardedRuns.length > 0) tutorial.skipForReturningPlayer();
        bindAudio(audio);
        setVolumes(profile.masterVolume, profile.musicVolume, profile.sfxVolume);
        setSoundEnabled(profile.soundEnabled);
        setFeedbackPrefs({ sound: profile.soundEnabled, vibration: profile.vibration });
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
            setFeedbackPrefs({ sound: profile.soundEnabled, vibration: profile.vibration });
        }

        function navigate(destination: Page): void {
            nextPage = destination;
        }

        function changeVolume(field: VolumeField, value: number): void {
            if (profile[field] === value) return;
            saveProfile({ ...profile, [field]: value });
            setVolumes(profile.masterVolume, profile.musicVolume, profile.sfxVolume);
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
            if (next.prepared !== 'training') {
                setup.upgradeIds = [...new Set([...(Array.isArray(setup.upgradeIds) ? setup.upgradeIds : []), ...profile.upgradeIds])];
            }
            runSetup = setup;
            draft = [];
            draftKey = '';
            if (next.prepared === 'team') Storage.remove(STORAGE_KEYS.PENDING_SETUP);
            navigate('run');
        }

        function render(destination: Page): void {
            const previousPage = page;
            page = destination;
            focus.blur();
            if (pageRoot !== null) world.despawn(pageRoot);
            const root = makeAbsBox(world, sceneRoot, 0, 0, 1280, 720);
            pageRoot = root;
            tickPage = null;
            tutorial.targets.clear();
            // The expedition draws its own station and site; the scene's old outpost backdrop stays hidden.
            setNodeDisplayed(world, backdrop, false);
            playMusic(page === 'run' ? 'game' : 'menu');

            if (page === 'run' && runSetup) {
                const runId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
                const finish = (result: MainLoopResult) => {
                    saveProfile(recordResearch(profile, runId, result, runSetup?.expedition === 'training'));
                    Storage.setJSON(STORAGE_KEYS.LAST_RESULT, result);
                };
                // Every mission is an expedition; a team manifest without rules runs as the Tharsis survey.
                const setup: MissionSetupInput = { ...runSetup, rules: 'tharsis-expedition' };
                tickPage = mountTharsisFlight({
                    world, events, input, focus, root, art, setup, profile, onFinish: finish,
                    onExit: target => { tutorial.leaveRun(); navigate(target); }, onRetry: () => navigate('run'),
                    onVolume: changeVolume, onSound: soundEnabled => {
                        saveProfile({ ...profile, soundEnabled });
                        setSoundEnabled(soundEnabled);
                    },
                });
                return;
            }

            const ui = makeFlightUi(world, events, root, art, focus, profile);
            // Returns true when the page used Escape itself (e.g. putting back a held cargo item).
            let surfaceTick: ((state: typeof input) => boolean | void) | undefined;
            switch (page) {
                case 'crew':
                    showShell(ui, page, 'Crew', 'Pick 4 crew for your next mission. Double-tap a card to add or remove.', 'crew', navigate);
                    surfaceTick = showCrew(ui, profile, selectedCrewId, crewIds => saveProfile({ ...profile, crewIds }), id => { selectedCrewId = id; });
                    break;
                case 'upgrade':
                    showShell(ui, page, 'Upgrade', 'Spend research points to unlock station systems and procedures.', 'upgrade', navigate);
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
                    showShell(ui, page, 'Mission Selection', 'Pick a job for your crew. A Sol is one day on Mars: 24 hours 39 minutes.', 'mars', navigate);
                    surfaceTick = showMissions(ui, missionOffers(readPendingSetup()), selectMission, missionPage, next => { missionPage = next; navigate('mission'); });
                    break;
                case 'cargo': {
                    const chosen = offer;
                    if (!chosen?.setup) { navigate('mission'); break; }
                    showShell(ui, page, chosen.prepared ? 'Launch Briefing' : 'Cargo Preparation', chosen.prepared ? chosen.title : `${chosen.title} · pack what the mission needs`,
                        (Object.keys(chosen.setup.missionGoal.requiredEquipment ?? {})[0] ?? 'windSampler') as IconName, navigate);
                    // Prepared missions launch from here, so they check everything. Packed missions only
                    // check the cargo: the crew is picked next, on the Launch Summary.
                    const problem = (placements: CargoPlacement[]) => {
                        const setup = buildLaunchSetup(chosen, profile.crewIds, placements);
                        if (!setup) return 'Choose a mission to launch.';
                        return chosen.prepared ? launchProblem(setup) : cargoProblem(setup);
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
                    surfaceTick = showLaunchSummary(ui, preview, draft, launchProblem(preview), () => launch(chosen, false), () => navigate('cargo'), chosen.image, {
                        crewIds: profile.crewIds,
                        // Edit Crew saves the new four to the profile (the Crew page shows the same picks) and redraws the summary.
                        onCrew: crewIds => { saveProfile({ ...profile, crewIds }); navigate('review'); },
                    });
                    break;
                }
                case 'settings':
                    showShell(ui, page, 'Settings', 'Sound, vibration, motion, contrast, volume and the tutorial.', 'settings', navigate);
                    showSettings(
                        ui,
                        profile,
                        setting => {
                            const updated = { ...profile, [setting]: !profile[setting] };
                            saveProfile(updated);
                            if (setting === 'soundEnabled') setSoundEnabled(updated.soundEnabled);
                            navigate('settings');
                        },
                        changeVolume,
                        () => { tutorial.begin(); navigate('menu'); },
                    );
                    break;
                case 'quit':
                    showQuit(ui, navigate);
                    break;
                case 'exit':
                    showExit(ui, navigate);
                    break;
                default:
                    // "How to Play" sits on the main menu only until the tutorial is done; then it is in Settings.
                    surfaceTick = showMenu(ui, navigate, profile.reducedMotion,
                        tutorial.finished ? undefined : () => { tutorial.begin(); navigate('menu'); });
            }
            // The first-time tutorial: ARIES points at the next button on this page.
            let coach: Coach | null = null;
            let coachStale = true;
            const refreshCoach = () => {
                coachStale = false;
                coach?.dispose();
                const step = tutorial.active ? menuStep(page, { welcomed: tutorial.welcomed, trainingReady: offer?.prepared === 'training' }) : null;
                coach = step && showCoach(ui, root, step, key => tutorial.targets.get(key), {
                    next: () => { tutorial.welcomed = true; coachStale = true; },
                    skip: () => { tutorial.finish(); coachStale = true; },
                });
            };
            tickPage = () => {
                // The page sees input first, so Escape can put back a held cargo item instead of leaving.
                const usedEscape = surfaceTick?.(input) === true;
                if (!usedEscape && (input.isKeyPressed('Escape') || input.isGamepadButtonPressed(GamepadButton.East))) {
                    if (page === 'cargo') navigate('mission');
                    else if (page === 'review') navigate('cargo');
                    else if (page !== 'menu') navigate('menu');
                }
                if (coachStale) refreshCoach();
                coach?.tick();
                ui.updateFocus(input);
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
