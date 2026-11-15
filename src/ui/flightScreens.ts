import { Interactable, type Entity, type InputState } from 'esengine';
import {
    AVAILABLE_CREW, SKILL_TREE_UPGRADES, UPGRADE_BRANCHES,
    type CrewMember, type MissionRequirement, type SkillUpgradeDef, type TaskCategory, type UpgradeBranch,
} from '../contracts/gameContract';
import { CARGO_BY_ID, normalizeCargo } from '../data/cargo';
import { CREW_ABILITIES } from '../data/crewAbilities';
import { LAUNCH_CREW_SIZE, missionDeadline, victoryCriteria, type MissionOffer } from '../data/missions';
import { purchaseProblem, type PlaytestProfile } from '../data/profile';
import { MENU_BACKGROUND, SIDEBAR_BACKGROUND, type Bounds, type FlightUi, type IconName } from './flightUi';
import { mountMenuWalker } from './menuWalker';
import { mountMenuAmbience } from './menuAmbience';
import { mountMenuSky } from './menuSky';
import { mountMenuCat } from './menuCat';
import { play, vibrate } from './feedback';
import { burst } from './fx';
import { easeOutBack, makeMotion, type Motion } from './motion';
import { makeAbsBox } from './theme';
import { tutorial } from './tutorial';
import { showVolumeControls, type VolumeField } from './audioSettings';

export type Page = 'menu' | 'crew' | 'upgrade' | 'settings' | 'mission' | 'cargo' | 'review' | 'quit' | 'exit' | 'run';
type Navigate = (page: Page) => void;
const NAV = [
    ['Play', 'mission'], ['Crew', 'crew'], ['Upgrade', 'upgrade'], ['Settings', 'settings'], ['Quit', 'quit'],
] as const;

function logo(ui: FlightUi, x: number, y: number, large: boolean): void {
    const { root, palette: p } = ui;
    ui.icon(root, x + (large ? 192 : 144), y + 12, 48, 'mars', p.rust);
    ui.label(root, [x, y, large ? 200 : 152, large ? 108 : 84], 'MSP', {
        display: true, size: large ? 96 : 72,
    });
    ui.box(root, [x + 4, y + (large ? 104 : 80), large ? 236 : 192, 4], p.rust);
    ui.label(root, [x + 4, y + (large ? 112 : 88), 228, 28], 'MARS STATION PROGRAM', {
        size: large ? 16 : 14, color: p.secondary,
    });
}

function sidebar(ui: FlightUi, page: Page, navigate: Navigate, hero: boolean, motion?: Motion): Entity | null {
    let playButton: Entity | null = null;
    const { root, palette: p } = ui;
    if (!hero) ui.image(root, [0, 216, 248, 504], SIDEBAR_BACKGROUND);
    logo(ui, hero ? 36 : 24, hero ? 56 : 24, hero);
    NAV.forEach(([label, destination], i) => {
        const active = destination === page || (destination === 'mission' && (page === 'cargo' || page === 'review'));
        const width = hero ? 228 : 204;
        const x = hero ? 36 : 24;
        const y = (hero ? 236 : 216) + i * 64;
        const button = ui.button(root, [x, y, width, 52], () => navigate(destination), {
            tone: hero && i === 0 ? 'hero' : active ? 'primary' : 'plain',
        });
        // On the title screen the menu slides in from the left, one button after another.
        motion?.enter(button.entity, x, y, { dx: -56, delay: 120 + i * 70, duration: 340, reveal: true });
        if (hero && i === 0) playButton = button.entity;
        if (i === 0) tutorial.targets.set('play', button.entity);
        tutorial.targets.set(`nav-${destination}`, button.entity);
        const ink = active ? p.ink : hero && i === 0 ? p.cyan : p.text;
        ui.label(button.entity, [8, 0, width - 16, 52], label, { display: true, size: 26, color: ink, center: true });
    });
    if (!hero) {
        const back = ui.button(root, [24, 548, 204, 48], () => navigate(page === 'cargo' ? 'mission' : 'menu'));
        ui.label(back.entity, [8, 0, 188, 48], page === 'cargo' ? 'Missions' : 'Main Menu', {
            display: true, size: 20, color: p.secondary, center: true,
        });
    }
    return playButton;
}

export function showMenu(ui: FlightUi, navigate: Navigate, reducedMotion: boolean, onHowToPlay?: () => void): (input: InputState) => void {
    const { root, palette: p } = ui;
    const motion = makeMotion(ui.world, reducedMotion);
    ui.box(root, [0, 0, 1280, 720], p.ink);
    // The painting stays still. Small details inside it come alive in place instead (a blinking
    // beacon, the dome's soft glow, a radar blip), and some of them react when clicked.
    const scene = ui.group(root, [0, 0, 1280, 720]);
    // The painting without its standing crew member: he is a sprite that walks the deck.
    ui.image(scene, [0, 0, 1280, 720], MENU_BACKGROUND);
    // Everything else in the painting uses screen coordinates inside this layer.
    const layer = ui.group(scene, [0, 0, 1280, 720]);
    // Lights painted onto the station (monitor light, beacon, radar blip) sit behind the walking crew member.
    const details = ui.group(layer, [0, 0, 1280, 720]);
    // The window (clouds, stars, shuttle, rover), then grow lights, motes, vents, steam and the door.
    const sky = mountMenuSky(ui, details, motion);
    const ambience = mountMenuAmbience(ui, details, motion);
    // The station cat roams the deck too; the crew member is drawn after it, so he walks in front.
    const cat = mountMenuCat(ui, layer, motion);
    // The deck's railings are redrawn over the cat, so it walks behind them.
    ui.image(layer, [0, 0, 1280, 720], 'assets/textures/menu_glow_deck_rail.png');
    const walker = mountMenuWalker(ui, layer, motion);
    // A few dust specks drift slowly across the painting (left to right, bobbing a little).
    if (!reducedMotion) {
        for (let i = 0; i < 14; i++) {
            const size = i % 3 === 0 ? 3 : 2;
            const x0 = (i * 397) % 1280;
            const y0 = 60 + ((i * 211) % 600);
            const speed = 0.008 + (i % 5) * 0.003;
            const speck = ui.box(layer, [x0, y0, size, size], { ...(i % 4 === 0 ? p.amber : p.text), a: 0.35 + (i % 3) * 0.12 });
            motion.path(speck, ms => [(x0 + ms * speed) % 1300 - 10, y0 + Math.sin(ms / 1400 + i) * 6 + ((ms * 0.002) % 40)]);
        }
    }

    // ---- Things in the painting that react when clicked ----
    const hotspot = (bounds: Bounds, onPress: () => void) => {
        const [x, y, w, h] = bounds;
        const hit = makeAbsBox(ui.world, layer, x, y, w, h, undefined, false);
        ui.world.insert(hit, Interactable, { enabled: true, blockRaycast: true, raycastTarget: true });
        // A thin amber outline on hover, so kids can find what is clickable.
        const edges = [
            ui.box(hit, [0, 0, w, 2], { ...p.amber, a: 0.7 }), ui.box(hit, [0, h - 2, w, 2], { ...p.amber, a: 0.7 }),
            ui.box(hit, [0, 0, 2, h], { ...p.amber, a: 0.7 }), ui.box(hit, [w - 2, 0, 2, h], { ...p.amber, a: 0.7 }),
        ];
        edges.forEach(edge => ui.show(edge, false));
        ui.on(hit, 'hover_enter', () => edges.forEach(edge => ui.show(edge, true)));
        ui.on(hit, 'hover_exit', () => edges.forEach(edge => ui.show(edge, false)));
        ui.on(hit, 'press', () => {
            if (!ui.world.valid(root)) return;
            vibrate('short');
            onPress();
        });
        return hit;
    };
    const busy = new Set<string>();
    const once = (key: string, ms: number, run: () => void) => {
        if (busy.has(key)) return;
        busy.add(key);
        run();
        motion.after(ms, () => busy.delete(key));
    };

    // The satellite dish sends out radio waves with two beeps.
    const waves = [0, 1, 2].map(i => ui.box(layer, [474 - i * 6, 126 - i * 8, 10 + i * 12, 3], { ...p.cyan, a: 0.9 - i * 0.2 }));
    waves.forEach(wave => ui.show(wave, false));
    hotspot([430, 120, 90, 110], () => once('dish', 900, () => {
        play('beep');
        waves.forEach((wave, i) => {
            motion.after(i * 120, () => ui.show(wave, true));
            motion.after(500 + i * 120, () => ui.show(wave, false));
        });
    }));

    // The greenhouse dome glows a few times with a chime. DOME is its click area (screen pixels).
    const DOME = { cx: 903, base: 266, halfWidth: 84, height: 62 };
    // The glow lights the dome's glass panes from inside (a layer cut from the painting by
    // art/menu_glow.py): the lattice and the plants stay dark on top of it.
    const domeGlow = ui.image(layer, [0, 0, 1280, 720], 'assets/textures/menu_glow_dome.png', { r: 1, g: 1, b: 1, a: 0 });
    const glow = { set: (a: number) => ui.fill(domeGlow, { r: 1, g: 1, b: 1, a: Math.min(1, a * 1.6) }) };
    // The clickable area (and its hover outline) follows the glow: tune DOME above and both move.
    hotspot([DOME.cx - DOME.halfWidth - 4, DOME.base - DOME.height - 4, DOME.halfWidth * 2 + 8, DOME.height + 6], () => once('dome', 900, () => {
        play('chime');
        [0, 1, 2].forEach(i => {
            motion.after(i * 220, () => glow.set(0.45));
            motion.after(i * 220 + 120, () => glow.set(0));
        });
    }));

    // The two crew members say hello in a speech bubble.
    const bubble = (x: number, y: number, words: string) => {
        const holder = ui.group(layer, [x, y, 84, 30]);
        const card = ui.box(holder, [0, 0, 84, 26], p.text);
        ui.label(card, [0, 0, 84, 26], words, { size: 14, color: p.ink, center: true });
        ui.box(holder, [16, 26, 6, 4], p.text);
        ui.show(holder, false);
        return { holder, x, y };
    };
    const hello = [bubble(690, 372, 'Hi there!'), bubble(970, 390, 'Hello!')];
    // The walking crew member's bubble and click area follow him; he stops while he says hello.
    const walkerBubble = () => ({ x: Math.round(walker.position().x - 24), y: walker.position().top - 30 });
    const greet = (index: number) => once(`crew${index}`, 1600, () => {
        const { holder } = hello[index]!;
        const { x, y } = index === 0 ? walkerBubble() : hello[index]!;
        if (index === 0) { walker.pause(1600); motion.set(holder, x, y); }
        play('blip', 1.3);
        motion.after(110, () => play('blip', 1.6));
        ui.show(holder, true);
        motion.hop(holder, x, y, 6);
        motion.after(1400, () => ui.show(holder, false));
    });
    const walkerHit = hotspot([685, 410, 52, 120], () => greet(0));
    hotspot([965, 430, 60, 90], () => greet(1));

    const play_ = sidebar(ui, 'menu', navigate, true, motion);
    // Under the menu: starts the first-time tutorial again.
    if (onHowToPlay) {
        const howTo = ui.button(root, [36, 236 + NAV.length * 64, 228, 44], onHowToPlay, { label: 'How to Play', labelSize: 20 });
        motion.enter(howTo.entity, 36, 236 + NAV.length * 64, { dx: -56, delay: 120 + NAV.length * 70, duration: 340, reveal: true });
    }
    // Hovering Play runs a chase of launch lights along its bottom edge.
    const lights = play_ ? Array.from({ length: 9 }, (_, i) => ui.box(play_, [14 + i * 22, 44, 12, 3], { ...p.cyan, a: 0.25 })) : [];
    let playHovered = false;
    if (play_) {
        ui.on(play_, 'hover_enter', () => { playHovered = true; });
        ui.on(play_, 'hover_exit', () => { playHovered = false; lights.forEach(light => ui.fill(light, { ...p.cyan, a: 0.25 })); });
    }
    let lastLit = -1;

    // Small status light aligned with the monitor in the station painting.
    const monitorLight = ui.box(details, [776, 393, 4, 4], p.cyan);
    let lastBlink = true;
    // A red beacon on top of the dish, blinking slowly.
    const beacon = ui.group(details, [461, 120, 18, 18]);
    ui.box(beacon, [0, 0, 18, 18], { ...p.bad, a: 0.25 });
    ui.box(beacon, [3, 3, 12, 12], { ...p.bad, a: 0.45 });
    ui.box(beacon, [6, 6, 6, 6], { r: 1, g: 0.35, b: 0.3, a: 1 });
    let beaconOn = true;
    // A radar blip circling the round scope on the monitor.
    if (!reducedMotion) {
        const blip = ui.box(details, [832, 408, 4, 4], p.white);
        motion.path(blip, ms => {
            const turn = (ms / 3200) * Math.PI * 2;
            // Circles the round scope on the monitor (lined up against captures of the painting).
            return [831 + Math.cos(turn) * 22, 408 + Math.sin(turn) * 22];
        });
    }
    let lastGlow = -1;
    let walkerHitX = 685;
    return () => {
        motion.tick();
        walker.tick();
        sky();
        ambience();
        cat();
        const hitX = Math.round(walker.position().x - 29);
        if (hitX !== walkerHitX) { motion.set(walkerHit, hitX, 410); walkerHitX = hitX; }
        if (reducedMotion) return;
        const lit = Date.now() % 2900 < 2600;
        if (lastBlink !== lit) ui.show(monitorLight, lit);
        lastBlink = lit;
        if (playHovered) {
            const step = Math.floor(Date.now() / 70) % lights.length;
            if (step !== lastLit) {
                lights.forEach((light, i) => ui.fill(light, { ...p.cyan, a: i === step ? 1 : (i + 1) % lights.length === step ? 0.6 : 0.25 }));
                lastLit = step;
            }
        }
        const now = Date.now();
        const beaconLit = now % 1800 < 600;
        if (beaconLit !== beaconOn) { ui.show(beacon, beaconLit); beaconOn = beaconLit; }
        // The dome breathes: a faint glow rising and falling every 4 s (unless a click is flashing it).
        if (!busy.has('dome')) {
            const level = Math.round((0.5 - 0.5 * Math.cos((now / 4000) * Math.PI * 2)) * 32) / 100;
            if (level !== lastGlow) { glow.set(level); lastGlow = level; }
        } else lastGlow = -1;
    };
}

export function showShell(ui: FlightUi, page: Page, title: string, subtitle: string, icon: IconName, navigate: Navigate): void {
    const { root, palette: p } = ui;
    ui.box(root, [0, 0, 1280, 720], p.ink);
    sidebar(ui, page, navigate, false);
    const header = ui.frame(root, [248, 16, 1016, 76]);
    ui.icon(header, 16, 12, 48, icon, p.amber);
    ui.label(header, [84, 2, 888, 40], title, { display: true, size: 38 });
    ui.label(header, [88, 42, 872, 20], subtitle, { size: 15, color: p.secondary });
}

const CATEGORIES: Record<TaskCategory, string> = {
    ENG: 'Engineering', BIO: 'Hydroponics', NAV: 'Navigation', MED: 'Medical', SCI: 'Science', GOAL: 'Expedition',
};
const percent = (fraction: number) => Math.round(fraction * 100);
const titleCase = (word: string) => word[0]!.toUpperCase() + word.slice(1);
/** The perk's three multipliers as plain sentences a kid can read. */
function perks(member: CrewMember): string[] {
    const { perk } = member;
    return [
        `Uses ${percent(1 - perk.costMultiplier)}% less supplies`,
        `Works ${percent(perk.speedMultiplier - 1)}% faster`,
        `Brings back ${percent(perk.yieldMultiplier - 1)}% more`,
    ];
}

/** "On Engineering jobs:": the jobs where a crew member's perk numbers apply (the card already says "Best at"). */
function perkScope(member: CrewMember): string {
    const category = CATEGORIES[member.perk.bonusCategory];
    return `On ${category}${member.role === 'pilot' ? ' and Expedition' : ''} jobs:`;
}

/** Two taps on the same crew card within this many ms add or remove them. */
const DOUBLE_TAP_MS = 400;

export function showCrew(
    ui: FlightUi, profile: PlaytestProfile, initialId: string, onCrew: (ids: string[]) => void, selectedId: (id: string) => void,
): () => void {
    const { root, palette: p } = ui;
    const motion = makeMotion(ui.world, ui.reducedMotion);
    const grid = ui.frame(root, [248, 108, 628, 596]);
    const inspector = ui.frame(root, [892, 108, 372, 596]);
    ui.label(grid, [16, 6, 300, 36], 'Choose your crew', { display: true, size: 24 });

    // Seat counter: four pips (a check in each filled seat) plus the count in words.
    const pips = Array.from({ length: LAUNCH_CREW_SIZE }, (_, i) => {
        const x = 372 + i * 28;
        ui.box(grid, [x, 12, 22, 22], p.edge);
        const empty = ui.box(grid, [x + 2, 14, 18, 18], p.panel);
        const taken = ui.box(grid, [x, 12, 22, 22], p.amber);
        ui.icon(taken, 3, 3, 16, 'check', p.ink);
        return { empty, taken, x };
    });
    const count = ui.label(grid, [490, 8, 124, 30], '', { size: 14 });

    let selected = AVAILABLE_CREW.find(member => member.id === initialId) ?? AVAILABLE_CREW[0]!;
    let assigned = [...profile.crewIds];
    let streak = 0;
    let lastTap = 0;
    let field = false;
    let cardTaps = { id: '', time: 0, count: 0 };
    const cards = AVAILABLE_CREW.map((member, index) => {
        const cardX = 12 + (index % 3) * 204;
        const cardY = 48 + Math.floor(index / 3) * 270;
        const button = ui.button(grid, [cardX, cardY, 192, 262], () => {
            selected = member;
            selectedId(member.id);
            if (member.role === 'scientist') tap();
            // Double-tap a card to add or remove that crew member. Only the second quick tap
            // counts, so a longer burst of taps does not keep flipping them on and off.
            const time = Date.now();
            cardTaps = cardTaps.id === member.id && time - cardTaps.time < DOUBLE_TAP_MS
                ? { id: member.id, time, count: cardTaps.count + 1 }
                : { id: member.id, time, count: 1 };
            if (cardTaps.count === 2) { toggleSelected(); return; }
            refresh();
        }, { tone: 'tile' });
        tutorial.targets.set(`crew-card-${member.id}`, button.entity);
        const outline = [
            ui.box(button.entity, [4, 4, 184, 4], p.amber),
            ui.box(button.entity, [4, 254, 184, 4], p.amber),
            ui.box(button.entity, [4, 4, 4, 254], p.amber),
            ui.box(button.entity, [184, 4, 4, 254], p.amber),
        ];
        ui.image(button.entity, [32, 10, 128, 160], member.portraitPath);
        ui.box(button.entity, [8, 172, 176, 2], p.edge);
        ui.label(button.entity, [14, 180, 166, 26], member.name, { display: true, size: 20, fit: 14 });
        const roleIcon = ui.icon(button.entity, 14, 208, 20, member.role, p.secondary);
        const roleText = ui.label(button.entity, [42, 207, 140, 22], titleCase(member.role), { color: p.secondary, size: 14 });
        const alt = member.role === 'scientist' ? {
            roleIcon, roleText,
            icon: ui.icon(button.entity, 14, 208, 20, 'mars', p.good),
            text: ui.label(button.entity, [42, 207, 142, 22], 'Not a Spy', { color: p.good, size: 14, fit: 11 }),
        } : null;
        if (alt) { ui.show(alt.icon, false); ui.show(alt.text, false); }
        ui.label(button.entity, [14, 230, 168, 22], `Best at ${CATEGORIES[member.perk.bonusCategory]}`, { color: p.amber, size: 13, fit: 11 });
        // Filled badge with a check mark, so "on the crew" never depends on colour alone.
        const tag = ui.box(button.entity, [10, 10, 92, 24], p.amber);
        ui.icon(tag, 4, 4, 16, 'check', p.ink);
        ui.label(tag, [22, 0, 68, 24], 'On crew', { size: 13, color: p.ink, center: true });
        // The roster deals in one card after another when the page opens.
        motion.enter(button.entity, cardX, cardY, { dy: 18, delay: 40 + index * 55, duration: 320, reveal: true });
        return { button, outline, tag, member, alt };
    });

    function tap(): void {
        const time = Date.now();
        streak = time - lastTap < 700 ? streak + 1 : 1;
        lastTap = time;
        if (streak < 20 || field) return;
        streak = 0;
        const card = cards.find(entry => entry.alt)!;
        const swap = (on: boolean) => {
            field = on;
            ui.show(card.alt!.roleIcon, !on);
            ui.show(card.alt!.roleText, !on);
            ui.show(card.alt!.icon, on);
            ui.show(card.alt!.text, on);
            refresh();
        };
        swap(true);
        play('sparkle');
        motion.hop(card.alt!.text, 42, 207, 6);
        motion.hop(card.alt!.icon, 14, 208, 6);
        motion.after(3000, () => swap(false));
    }

    const portraits = AVAILABLE_CREW.map(member => ui.image(inspector, [118, 12, 128, 160], member.portraitPath));
    const name = ui.label(inspector, [16, 180, 332, 34], '', { display: true, size: 28, fit: 18 });
    const role = ui.label(inspector, [16, 214, 332, 22], '', { size: 15, color: p.amber });
    const bio = ui.label(inspector, [16, 240, 332, 70], '', { wrap: true, top: true, color: p.secondary, size: 14 });
    // These are real astronauts: every bio names where its facts come from.
    const source = ui.label(inspector, [16, 309, 332, 18], '', { size: 12, color: p.muted });
    const perkCard = ui.frame(inspector, [12, 330, 340, 110], p.well);
    const perkName = ui.label(perkCard, [12, 2, 308, 24], '', { display: true, size: 19, color: p.good });
    const focus = ui.label(perkCard, [12, 27, 308, 18], '', { size: 13, color: p.amber });
    const perkRows = perks(selected).map((_, index) => {
        ui.icon(perkCard, 12, 48 + index * 18, 16, 'check', p.good);
        return ui.label(perkCard, [38, 46 + index * 18, 282, 18], '', { size: 13, color: p.text });
    });
    const abilityCard = ui.frame(inspector, [12, 446, 340, 78], p.well, p.teal);
    const abilityName = ui.label(abilityCard, [12, 3, 316, 23], '', { display: true, size: 18, color: p.cyan });
    const abilityText = ui.label(abilityCard, [12, 26, 316, 46], '', { size: 13, color: p.text, wrap: true, top: true });
    // One action per state: Add (seat open), Remove (on the crew), or a plain "Crew is full" note.
    function addSelected(): void {
        if (assigned.includes(selected.id) || assigned.length >= LAUNCH_CREW_SIZE) return;
        assigned = [...assigned, selected.id];
        onCrew(assigned);
        refresh();
        celebrateJoin();
    }
    function removeSelected(): void {
        if (!assigned.includes(selected.id)) return;
        assigned = assigned.filter(id => id !== selected.id);
        onCrew(assigned);
        refresh();
    }
    /** Double-tap: on the crew → off; open seat → on; crew full → the "Crew is full" plate shakes. */
    function toggleSelected(): void {
        if (assigned.includes(selected.id)) { removeSelected(); play('blip', 0.8); return; }
        if (assigned.length < LAUNCH_CREW_SIZE) { addSelected(); return; }
        refresh();
        play('buzz');
        motion.shake(fullPlate, 16, 532, 3, 240);
    }
    const add = ui.button(inspector, [16, 532, 332, 44], addSelected, { tone: 'primary', label: 'Add to Crew' });
    tutorial.targets.set('crew-add', add.entity);
    const remove = ui.button(inspector, [16, 532, 332, 44], removeSelected, { label: 'Remove from Crew' });
    const fullPlate = ui.box(inspector, [16, 532, 332, 44], p.well);
    ui.icon(fullPlate, 12, 12, 20, 'lock', p.muted);
    ui.label(fullPlate, [44, 0, 276, 44], 'Crew is full', { size: 15, color: p.muted });

    // The new crew member's badge and seat pip hop in; filling the last seat ripples all four pips.
    function celebrateJoin(): void {
        play(assigned.length >= LAUNCH_CREW_SIZE ? 'success' : 'chime');
        const card = cards.find(entry => entry.member.id === selected.id);
        if (card) motion.hop(card.tag, 10, 10, 8);
        if (assigned.length >= LAUNCH_CREW_SIZE) {
            pips.forEach(({ taken, x }, i) => motion.hop(taken, x, 12, 7, i * 70));
            motion.hop(count, 490, 8, 5, 280);
        } else {
            const pip = pips[assigned.length - 1];
            if (pip) motion.hop(pip.taken, pip.x, 12, 7);
        }
    }

    // The inspector portrait slides up into place, then floats gently while it is on show.
    let shownId: string | null = null;
    function presentSelected(): void {
        if (shownId === selected.id) return;
        const previous = portraits[AVAILABLE_CREW.findIndex(member => member.id === shownId)];
        if (previous !== undefined) motion.stop(previous);
        shownId = selected.id;
        const portrait = portraits[AVAILABLE_CREW.findIndex(member => member.id === selected.id)]!;
        motion.enter(portrait, 118, 12, { dy: 12, duration: 240, onDone: () => motion.float(portrait, 118, 12, 3, 2600) });
        motion.enter(name, 16, 180, { dx: -12, duration: 220 });
        motion.enter(role, 16, 214, { dx: -12, delay: 40, duration: 220 });
    }

    function refresh(): void {
        presentSelected();
        cards.forEach(({ button, outline, tag, member }) => {
            const isSelected = member.id === selected.id;
            outline.forEach(edge => ui.show(edge, isSelected));
            ui.fill(button.surface, isSelected ? p.raised : p.well);
            ui.show(tag, assigned.includes(member.id));
        });
        portraits.forEach((portrait, index) => ui.show(portrait, AVAILABLE_CREW[index]!.id === selected.id));
        const onCrew = assigned.includes(selected.id);
        const open = LAUNCH_CREW_SIZE - assigned.length;
        const full = open <= 0;
        pips.forEach(({ empty, taken }, i) => {
            ui.show(taken, i < assigned.length);
            ui.show(empty, i >= assigned.length);
        });
        ui.setText(count, full ? 'Crew ready' : `${assigned.length} of ${LAUNCH_CREW_SIZE} picked`);
        ui.textColor(count, full ? p.good : p.amber);
        ui.setText(name, selected.name);
        ui.setText(role, field && selected.role === 'scientist' ? 'Not a Spy · Field Researcher' : `${titleCase(selected.role)} · ${selected.trait}`);
        ui.setText(bio, selected.bio);
        ui.setText(source, selected.source ? `Source: ${selected.source.label}` : '');
        ui.setText(perkName, selected.perk.title);
        ui.setText(focus, perkScope(selected));
        perks(selected).forEach((line, index) => ui.setText(perkRows[index]!, line));
        ui.setText(abilityName, CREW_ABILITIES[selected.role].name);
        ui.setText(abilityText, CREW_ABILITIES[selected.role].description);
        ui.show(add.entity, !onCrew && !full);
        add.setDisabled(onCrew || full);
        ui.show(remove.entity, onCrew);
        remove.setDisabled(!onCrew);
        ui.show(fullPlate, !onCrew && full);
    }
    refresh();
    return motion.tick;
}

const BRANCH_ICON: Record<UpgradeBranch, IconName> = {
    Infrastructure: 'solar', Survival: 'oxygen', Operations: 'circuit', Crew: 'crew',
};
const TECH_ICON: Record<string, IconName> = {
    solar_mppt: 'solar', efficient_inverters: 'power', power_balancing: 'circuit', sun_tracking: 'solar',
    heat_recovery: 'power', habitat_microgrid: 'circuit',
    closed_o2: 'oxygen', hydro_rationing: 'food', greywater_reclaimer: 'water', grow_trays: 'botanist',
    condenser: 'water', redundant_scrubbers: 'oxygen',
    ai_logistics: 'circuit', survey_routes: 'mars', planning_cache: 'circuit', rover_racks: 'rover',
    dispatch_automation: 'settings', autonomous_logistics: 'rover',
    rad_hull: 'radiation', habitation_quarters: 'crew', dosimeter_network: 'radiation', shift_scheduling: 'captain',
    storm_shelter: 'mars', crew_support: 'medic',
};

export function showUpgrades(
    ui: FlightUi, profile: PlaytestProfile, initial: SkillUpgradeDef, select: (id: string) => void, unlock: (node: SkillUpgradeDef) => void,
    fx: {
        /** An upgrade bought a moment ago: it hops and the lines to what it opens up light up. */
        justUnlocked?: string | null;
        /** First visit or a new branch tab: the tree rises in tier by tier. */
        newBranch?: boolean;
    } = {},
    /** Sell back every upgrade for a full refund. */
    reset?: () => void,
): () => void {
    const { root, palette: p } = ui;
    const motion = makeMotion(ui.world, ui.reducedMotion);
    const justUnlocked = fx.justUnlocked ?? null;
    const tree = ui.frame(root, [248, 108, 628, 596]);
    // The inspector's contents slide in a little each time a different upgrade is picked.
    const inspector = ui.group(ui.frame(root, [892, 108, 372, 596]), [0, 0, 364, 588]);
    motion.enter(inspector, 0, 0, { dx: 14, duration: 220 });
    const owned = new Set(profile.upgradeIds);
    const points = profile.researchPoints;
    const branchNodes = SKILL_TREE_UPGRADES.filter(node => node.branch === initial.branch);
    const tabWidths = [176, 128, 148, 112];
    let tabX = 12;
    UPGRADE_BRANCHES.forEach((branch, index) => {
        const width = tabWidths[index]!;
        const button = ui.button(tree, [tabX, 12, width, 44], () => select(SKILL_TREE_UPGRADES.find(node => node.branch === branch)!.id), {
            tone: branch === initial.branch ? 'primary' : 'plain',
        });
        const tint = branch === initial.branch ? p.ink : p.text;
        ui.icon(button.entity, 8, 10, 24, BRANCH_ICON[branch], tint);
        ui.label(button.entity, [36, 0, width - 44, 44], branch, { display: true, size: 16, fit: 12, color: tint });
        tabX += width + 12;
    });
    const graph = ui.frame(tree, [12, 68, 596, 464], p.well);
    const coordinates = (node: SkillUpgradeDef) => ({
        x: node.slot === 'left' ? 116 : node.slot === 'right' ? 408 : 262, y: 16 + 108 * (node.tier - 1),
    });
    for (let tier = 1; tier <= 4; tier++) {
        const y = 16 + (tier - 1) * 108;
        ui.box(graph, [72, y + 40, 492, 2], p.edge);
        ui.label(graph, [8, y + 30, 64, 22], `Tier ${tier}`, { size: 13, color: p.muted });
    }
    for (const node of branchNodes) {
        for (const id of node.prerequisites) {
            const parent = branchNodes.find(candidate => candidate.id === id)!;
            const from = coordinates(parent);
            const to = coordinates(node);
            const fromX = from.x + 64;
            const toX = to.x + 64;
            const turn = from.y + 96;
            const routed = node.id === initial.id || (owned.has(node.id) && owned.has(id));
            const ink = routed ? p.amber : owned.has(id) ? p.bevel : p.edge;
            const segments = [ui.box(graph, [fromX, from.y + 80, 4, 18], ink)];
            if (fromX !== toX) segments.push(ui.box(graph, [Math.min(fromX, toX), turn, Math.abs(toX - fromX) + 4, 4], ink));
            segments.push(ui.box(graph, [toX, turn, 4, to.y - turn], ink));
            if (id === justUnlocked) {
                // The paths this unlock opens flash bright, then settle to their usual colour.
                motion.after(120, () => segments.forEach(segment => ui.fill(segment, p.hover)));
                motion.after(900, () => segments.forEach(segment => ui.fill(segment, ink)));
            }
        }
    }
    // Node states read without colour: owned shows a check, locked a lock, and anything you can
    // buy shows its price on a filled tag (an outlined tag when you cannot afford it yet).
    for (const node of branchNodes) {
        const { x, y } = coordinates(node);
        const isOwned = owned.has(node.id);
        const locked = node.prerequisites.some(id => !owned.has(id)) && !isOwned;
        const affordable = !locked && !isOwned && points >= node.cost;
        const selected = node.id === initial.id;
        const button = ui.button(graph, [x, y, 132, 84], () => select(node.id), { tone: 'tile' });
        tutorial.targets.set(`upgrade-node-${node.id}`, button.entity);
        if (selected || isOwned) {
            const thickness = selected ? 4 : 2;
            ui.box(button.entity, [4, 4, 124, thickness], p.amber);
            ui.box(button.entity, [4, 80 - thickness, 124, thickness], p.amber);
            ui.box(button.entity, [4, 4, thickness, 76], p.amber);
            ui.box(button.entity, [128 - thickness, 4, thickness, 76], p.amber);
        }
        ui.icon(button.entity, 12, 8, 28, TECH_ICON[node.id]!, locked ? p.muted : p.amber);
        if (isOwned || locked) ui.icon(button.entity, 102, 10, 20, isOwned ? 'check' : 'lock', isOwned ? p.good : p.muted);
        else {
            const tag = ui.box(button.entity, [78, 10, 46, 20], affordable ? p.amber : p.edge);
            if (!affordable) ui.box(tag, [2, 2, 42, 16], p.well);
            ui.label(tag, [0, 0, 46, 20], `${node.cost} pts`, { size: 12, color: affordable ? p.ink : p.muted, center: true });
        }
        ui.label(button.entity, [8, 42, 116, 38], node.label, { size: 13, fit: 11, color: locked ? p.muted : p.text, center: true, wrap: true });
        if (node.id === justUnlocked) {
            motion.hop(button.entity, x, y, 10);
            play('sparkle');
            burst(ui, motion, graph, x + 64, y + 40, { colors: [p.amber, p.hover, p.white], count: 14, speed: 0.22 });
        }
        else if (fx.newBranch) motion.enter(button.entity, x, y, { dy: 12, delay: 40 + (node.tier - 1) * 70, duration: 260, reveal: true });
        else if (selected) motion.hop(button.entity, x, y, 4);
    }
    const wallet = ui.frame(tree, [12, 540, 300, 44], p.well);
    ui.icon(wallet, 12, 6, 24, 'upgrade', p.amber);
    ui.label(wallet, [44, 0, 160, 36], 'Research points', { size: 15, color: p.secondary });
    // Reset in the header: the first press asks (showing the refund), a second press within a few seconds resets.
    if (reset) {
        const spent = SKILL_TREE_UPGRADES.filter(node => owned.has(node.id)).reduce((sum, node) => sum + node.cost, 0);
        let armed = false;
        const resetButton = ui.button(root, [1052, 30, 200, 48], () => {
            if (armed) { reset(); return; }
            armed = true;
            if (resetButton.text) ui.setText(resetButton.text, `Refund ${spent} pts?`);
            ui.fill(resetButton.surface, p.amber);
            if (resetButton.text) ui.textColor(resetButton.text, p.ink);
            motion.after(3500, () => {
                armed = false;
                if (resetButton.text) { ui.setText(resetButton.text, 'Reset Upgrades'); ui.textColor(resetButton.text, p.text); }
                ui.fill(resetButton.surface, p.raised);
            });
        }, { label: 'Reset Upgrades', disabled: owned.size === 0 });
    }
    const walletPoints = ui.label(wallet, [204, 0, 76, 36], points.toLocaleString('en-US'), { display: true, size: 22, color: p.amber, center: true });
    if (justUnlocked) motion.hop(walletPoints, 204, 0, 6, 80);
    ui.label(tree, [328, 542, 280, 20], `${owned.size} of ${SKILL_TREE_UPGRADES.length} unlocked`, { size: 14, color: p.secondary });
    ui.label(tree, [328, 562, 280, 20], 'Finish missions to earn more points.', { size: 13, color: p.muted });

    const problem = purchaseProblem(profile, initial);
    const isOwned = owned.has(initial.id);
    const missingPrereqs = initial.prerequisites.filter(id => !owned.has(id));
    const short = Math.max(0, initial.cost - points);
    ui.icon(inspector, 16, 14, 48, TECH_ICON[initial.id]!, p.amber);
    ui.label(inspector, [76, 8, 272, 60], initial.label, { display: true, size: 24, fit: 16, wrap: true });
    ui.label(inspector, [16, 76, 332, 24], `${initial.branch}  ·  Tier ${initial.tier}`, { size: 15, color: p.amber });
    const effects = ui.frame(inspector, [12, 112, 340, 120], p.well);
    ui.label(effects, [12, 6, 300, 26], 'What it does', { display: true, size: 20 });
    ui.label(effects, [12, 36, 308, 72], initial.summary, { wrap: true, top: true, size: 15, color: p.good });
    // Missing prerequisite = lock; not enough points = empty box (you can still earn them).
    const rows: Array<[ok: boolean, text: string, lock: boolean]> = [
        ...initial.prerequisites.map((id): [boolean, string, boolean] => [owned.has(id), SKILL_TREE_UPGRADES.find(node => node.id === id)!.label, true]),
        [isOwned || points >= initial.cost, isOwned
            ? `${initial.cost} research points · paid`
            : `${initial.cost} research points · you have ${points.toLocaleString('en-US')}`, false],
    ];
    const needs = ui.frame(inspector, [12, 244, 340, 56 + rows.length * 30], p.well);
    ui.label(needs, [12, 6, 300, 26], 'Needs first', { display: true, size: 20 });
    rows.forEach(([ok, text, lock], index) => {
        const y = 44 + index * 30;
        if (ok || lock) ui.icon(needs, 12, y + 1, 20, ok ? 'check' : 'lock', ok ? p.good : p.muted);
        else {
            ui.box(needs, [14, y + 3, 16, 16], p.muted);
            ui.box(needs, [16, y + 5, 12, 12], p.well);
        }
        ui.label(needs, [40, y, 280, 24], text, { size: 14, fit: 12, color: ok ? p.text : p.secondary });
    });
    const statusY = 256 + 56 + rows.length * 30;
    const status = isOwned ? 'You own this. It helps on every mission from now on.'
        : missingPrereqs.length ? 'Unlock the upgrade above it first.'
        : short > 0 ? `You need ${short} more research point${short === 1 ? '' : 's'}. Finish missions to earn them.`
        : 'You can unlock this now.';
    ui.label(inspector, [16, statusY, 332, 44], status, { size: 14, wrap: true, top: true, color: problem && !isOwned ? p.secondary : p.good });
    if (isOwned || missingPrereqs.length) {
        // Nothing to press here, so a plate says the state instead of a dead button.
        const plate = ui.box(inspector, [16, 532, 332, 44], p.well);
        ui.icon(plate, 12, 12, 20, isOwned ? 'check' : 'lock', isOwned ? p.good : p.muted);
        ui.label(plate, [44, 0, 276, 44], isOwned ? 'Owned' : 'Locked', { size: 15, color: isOwned ? p.good : p.muted });
    } else {
        const unlockButton = ui.button(inspector, [16, 532, 332, 44], () => unlock(initial), {
            tone: problem ? 'plain' : 'primary', disabled: Boolean(problem), label: `Unlock · ${initial.cost} points`,
        });
        tutorial.targets.set('upgrade-unlock', unlockButton.entity);
    }
    return motion.tick;
}

export const MISSIONS_PER_PAGE = 3;

const DIFFICULTY_NAMES = ['Easy', 'Medium', 'Hard'] as const;

/**
 * Three segments filled up to the level, with the word beside them so colour is never the only cue.
 * The segments fill one by one, starting `delay` ms from now.
 */
function difficultyBar(ui: FlightUi, motion: Motion, parent: Entity, x: number, y: number, level: 1 | 2 | 3, delay = 0): void {
    const p = ui.palette;
    const tone = level === 1 ? p.good : level === 2 ? p.amber : p.bad;
    for (let i = 0; i < 3; i++) {
        const seg = ui.box(parent, [x + i * 30, y + 7, 26, 10], p.edge);
        if (i < level) motion.after(delay + i * 120, () => ui.fill(seg, tone));
    }
    ui.label(parent, [x + 100, y, 160, 24], DIFFICULTY_NAMES[level - 1], { size: 15, color: tone });
}

const REQUIREMENT_ICONS: Partial<Record<MissionRequirement['kind'], IconName>> = {
    prep_sensor: 'circuit', prep_rover: 'rover', prep_supplies: 'food', assign_crew: 'crew',
};

function requirementText(r: MissionRequirement): string {
    // Shorter wording for the standard labels; a mission's own wording (e.g. Tharsis) is kept.
    if (r.kind === 'assign_crew' && r.label === 'Assign Crew') return `Assign ${r.target} crew`;
    if (r.kind === 'prep_supplies' && r.label.startsWith('Prep Supplies')) return `Prep supplies × ${r.target}`;
    return r.target > 1 ? `${r.label} × ${r.target}` : r.label;
}

export function showMissions(
    ui: FlightUi, offers: readonly MissionOffer[], onChoose: (offer: MissionOffer) => void,
    page = 0, onPage: (page: number) => void = () => {},
): () => void {
    const { root, palette: p } = ui;
    const motion = makeMotion(ui.world, ui.reducedMotion);
    const selectButtons: Array<ReturnType<FlightUi['button']>> = [];
    const pages = Math.max(1, Math.ceil(offers.length / MISSIONS_PER_PAGE));
    const current = Math.min(Math.max(0, page), pages - 1);
    if (pages > 1) {
        // Pager in the header's right side: ◀ 1 / 2 ▶ (arrow keys reach these buttons too).
        const prev = ui.button(root, [1052, 30, 52, 48], () => onPage(current - 1), { label: '◀', disabled: current === 0 });
        ui.label(root, [1106, 30, 92, 48], `${current + 1} / ${pages}`, { display: true, size: 20, center: true, color: p.amber });
        const next = ui.button(root, [1200, 30, 52, 48], () => onPage(current + 1), { label: '▶', disabled: current === pages - 1 });
        selectButtons.push(prev, next);
    }
    const visible = offers.slice(current * MISSIONS_PER_PAGE, current * MISSIONS_PER_PAGE + MISSIONS_PER_PAGE);
    visible.forEach((offer, index) => {
        // The cards rise in one after another; their difficulty bars fill once they land.
        const cardX = 248 + index * 340;
        const cardDelay = 60 + index * 80;
        const slot = ui.group(root, [cardX, 108, 336, 596]);
        motion.enter(slot, cardX, 108, { dy: 22, delay: cardDelay, duration: 340, reveal: true });
        const card = ui.frame(slot, [0, 0, 336, 596], offer.setup ? p.panel : p.well);
        const active = Boolean(offer.setup);
        ui.box(card, [12, 12, 304, 120], p.ink);
        ui.image(card, [12, 12, 304, 120], offer.image ?? `assets/textures/mission_${Math.min(3, index + 1)}.png`);
        ui.label(card, [16, 140, 296, 24], offer.site, { color: active ? p.amber : p.muted, size: 14 });
        ui.label(card, [16, 166, 296, 62], offer.title, { display: true, size: 28, fit: 18, wrap: true, color: active ? p.text : p.muted });
        ui.label(card, [16, 230, 296, 42], offer.description, { size: 16, color: active ? p.text : p.muted, wrap: true, top: true });
        if (offer.difficulty) difficultyBar(ui, motion, card, 16, 278, offer.difficulty, cardDelay + 320);
        if (offer.setup) {
            const { missionGoal: goal } = offer.setup;
            ui.label(card, [16, 304, 296, 24], `Deadline · Sol ${missionDeadline(offer.setup)}`, { size: 15, color: p.amber });
            ui.label(card, [16, 333, 296, 54], victoryCriteria(offer.setup), { size: 13, wrap: true, top: true, color: p.secondary });
            const kit = Object.entries(goal.requiredEquipment ?? {}).filter(([, count]) => (count ?? 0) > 0) as [IconName, number][];
            const rows: Array<[IconName, string, boolean]> = [
                ...kit.map(([id, count]): [IconName, string, boolean] => [id, `${offer.prepared ? 'Aboard' : 'Pack'} · ${CARGO_BY_ID[id as keyof typeof CARGO_BY_ID].name} × ${count}`, true]),
                ...goal.requirements.map((r): [IconName, string, boolean] => [REQUIREMENT_ICONS[r.kind] ?? 'check', requirementText(r), false]),
            ];
            rows.slice(0, 5).forEach(([icon, text, cargo], row) => {
                const y = 396 + row * 24;
                ui.icon(card, 16, y + 2, 20, icon, cargo ? p.amber : p.secondary);
                ui.label(card, [44, y, 268, 24], text, { size: 14, color: cargo ? p.text : p.secondary });
            });
        } else {
            // Not playable yet: the card still shows the job and its NASA mission, with a clear lock.
            ui.icon(card, 16, 306, 20, 'lock', p.muted);
            ui.label(card, [44, 304, 268, 24], 'Coming soon', { size: 15, color: p.muted });
        }
        // Selecting a mission opens its briefing popup first; "Prepare Cargo" there continues.
        const button = ui.button(card, [16, 532, 296, 44], () => (offer.briefing ? openBriefing(offer) : onChoose(offer)), {
            label: offer.prepared === 'training' ? 'Open Training' : active ? 'Select Mission' : 'Coming soon', disabled: !active, tone: active ? 'primary' : 'plain',
        });
        if (active) selectButtons.push(button);
        if (offer.prepared === 'training') tutorial.targets.set('open-training', button.entity);
        // The first real mission on the page, for chapter 2 of the tutorial.
        else if (active && !offer.prepared && !tutorial.targets.has('select-mission')) tutorial.targets.set('select-mission', button.entity);
    });

    let popup: Entity | null = null;
    function closeBriefing(): void {
        if (popup !== null) ui.world.despawn(popup);
        popup = null;
        tutorial.view.missionPopup = false;
        selectButtons.forEach(button => button.setDisabled(false));
        // The pager keeps its own edge states.
        if (pages > 1) {
            selectButtons[0]!.setDisabled(current === 0);
            selectButtons[1]!.setDisabled(current === pages - 1);
        }
    }

    function openBriefing(offer: MissionOffer): void {
        const brief = offer.briefing!;
        // Cards stay visible but go inert, so the pointer and the keyboard only reach the popup.
        selectButtons.forEach(button => button.setDisabled(true));
        play('whoosh');
        popup = makeAbsBox(ui.world, root, 0, 0, 1280, 720, { ...p.ink, a: 0.82 }, false);
        ui.world.insert(popup, Interactable, { enabled: true, blockRaycast: true, raycastTarget: true });
        // The backdrop darkens in two quick steps while the panel rises into place.
        const scrim = popup;
        if (!motion.reducedMotion) {
            ui.fill(scrim, { ...p.ink, a: 0.4 });
            motion.after(70, () => ui.fill(scrim, { ...p.ink, a: 0.62 }));
            motion.after(140, () => ui.fill(scrim, { ...p.ink, a: 0.82 }));
        }
        const holder = ui.group(popup, [280, 95, 720, 530]);
        motion.enter(holder, 280, 95, { dy: 30, duration: 300, ease: easeOutBack });
        const panel = ui.frame(holder, [0, 0, 720, 530], p.raised);
        ui.box(panel, [12, 12, 240, 136], p.ink);
        ui.image(panel, [12, 12, 240, 136], offer.image ?? 'assets/textures/mission_1.png');
        // The card already showed the site and the deadline; the popup adds the job, the real
        // NASA mission and the lesson. Title on top, then three short blocks.
        ui.label(panel, [272, 10, 420, 44], offer.title, { display: true, size: 32, fit: 18 });
        ui.label(panel, [272, 58, 420, 92], brief.task, { size: 15, wrap: true, top: true });

        const nasa = ui.frame(panel, [12, 168, 688, 152], p.ink);
        ui.label(nasa, [16, 8, 648, 28], `Real NASA mission: ${brief.basis}`, { display: true, size: 20, color: p.amber });
        ui.label(nasa, [16, 44, 648, 64], brief.fact, { size: 15, color: p.text, wrap: true, top: true });
        ui.label(nasa, [16, 112, 648, 24], `Source: ${brief.source}`, { size: 13, color: p.muted });

        const why = ui.frame(panel, [12, 332, 688, 108], p.ink);
        ui.label(why, [16, 8, 648, 28], 'Why it matters', { display: true, size: 20, color: p.good });
        ui.label(why, [16, 42, 648, 52], brief.lesson, { size: 15, color: p.secondary, wrap: true, top: true });

        ui.button(panel, [12, 460, 200, 48], closeBriefing, { label: 'Back' });
        const prepare = ui.button(panel, [452, 460, 248, 48], () => { closeBriefing(); onChoose(offer); }, { label: 'Prepare Cargo', tone: 'primary' });
        tutorial.targets.set('prepare-cargo', prepare.entity);
        tutorial.view.missionPopup = true;
    }
    return motion.tick;
}

export function showPreparedManifest(ui: FlightUi, offer: MissionOffer, problem: string | null, onLaunch: () => void): void {
    const { root, palette: p } = ui;
    if (!offer.setup) return;
    const bay = ui.frame(root, [248, 108, 584, 596]);
    const summary = ui.frame(root, [848, 108, 416, 596]);
    const counts = normalizeCargo(offer.setup.cargo);
    ui.label(bay, [20, 16, 520, 40], 'Prepared Cargo', { display: true, size: 28 });
    Object.values(CARGO_BY_ID).filter(item => counts[item.id] > 0).forEach((item, index) => {
        ui.icon(bay, 24, 72 + index * 46, 24, item.id, p.amber);
        ui.label(bay, [64, 68 + index * 46, 476, 32], `${item.name} × ${counts[item.id]}`, { size: 18 });
    });
    ui.label(summary, [20, 16, 368, 40], 'Launch Crew', { display: true, size: 28 });
    ui.label(summary, [20, 76, 368, 248], offer.setup.crew.map(member => `${member.name} · ${member.role}`).join('\n\n'), { wrap: true, top: true });
    ui.label(summary, [20, 322, 368, 90], victoryCriteria(offer.setup), { size: 15, wrap: true, top: true, color: p.cyan });
    if (offer.prepared === 'training') ui.label(summary, [20, 411, 368, 30], 'Emergency Electrolysis installed', { size: 14, color: p.amber });
    ui.label(summary, [20, 444, 368, 64], problem ?? 'Ready for launch.', { wrap: true, color: problem ? p.bad : p.good });
    const launch = ui.button(summary, [20, 524, 368, 48], onLaunch, { label: 'Launch Mission', tone: 'primary', disabled: Boolean(problem) });
    tutorial.targets.set('launch', launch.entity);
}

export type SettingField = 'soundEnabled' | 'vibration' | 'reducedMotion' | 'highContrast';

export function showSettings(
    ui: FlightUi,
    profile: PlaytestProfile,
    change: (field: SettingField) => void,
    onVolume?: (field: 'masterVolume' | 'musicVolume' | 'sfxVolume', value: number) => void,
): void {
    const { root, palette: p } = ui;
    const panel = ui.frame(root, [248, 108, 1016, 588]);
    for (const [index, [field, title, description]] of ([
        ['soundEnabled', 'Music & Sound', 'Mars music, button clicks and game sounds.'],
        ['vibration', 'Vibration', 'Buzz on taps and launch, on phones and tablets that can vibrate.'],
        ['reducedMotion', 'Reduced Motion', 'Keep the screen still: no slides, hops, shakes or drifting dust.'],
        ['highContrast', 'High Contrast', 'Brighten text, outlines, and focus markers.'],
    ] as const).entries()) {
        const y = 16 + index * 66;
        ui.label(panel, [24, y, 600, 32], title, { display: true, size: 24 });
        ui.label(panel, [24, y + 32, 700, 22], description, { color: p.secondary, size: 14 });
        ui.button(panel, [800, y + 8, 160, 40], () => change(field), { label: profile[field] ? 'On' : 'Off', tone: profile[field] ? 'primary' : 'plain' });
    }

    ui.box(panel, [24, 286, 936, 2], p.edge);

    showVolumeControls(ui, panel, 304, profile, (field: VolumeField, value) => onVolume?.(field, value));
}

export function showQuit(ui: FlightUi, navigate: Navigate): void {
    const { root, palette: p } = ui;
    ui.box(root, [0, 0, 1280, 720], p.ink);
    ui.image(root, [0, 0, 1280, 720], MENU_BACKGROUND);
    const panel = ui.frame(root, [372, 220, 536, 260]);
    ui.label(panel, [24, 28, 480, 52], 'Leave the Station?', { display: true, size: 38 });
    ui.label(panel, [24, 92, 480, 52], 'Your crew and unlocked upgrades are saved.', { color: p.secondary, wrap: true });
    ui.button(panel, [24, 172, 224, 48], () => navigate('menu'), { label: 'Cancel' });
    ui.button(panel, [272, 172, 224, 48], () => navigate('exit'), { label: 'Quit', tone: 'primary' });
}

export function showExit(ui: FlightUi, navigate: Navigate): void {
    const { root, palette: p } = ui;
    ui.box(root, [0, 0, 1280, 720], p.ink);
    logo(ui, 512, 116, true);
    const panel = ui.frame(root, [344, 316, 592, 212]);
    ui.label(panel, [16, 20, 548, 48], 'Session Ended', { display: true, size: 34, center: true });
    ui.label(panel, [20, 72, 540, 40], 'Close this browser tab or press Stop in Estella.', { center: true, color: p.secondary, wrap: true });
    ui.button(panel, [152, 136, 280, 48], () => navigate('menu'), { label: 'Return to Main Menu' });
}
