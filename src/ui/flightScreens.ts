import { Interactable, type Entity, type InputState } from 'esengine';
import {
    AVAILABLE_CREW, SKILL_TREE_UPGRADES, UPGRADE_BRANCHES,
    type CrewMember, type SkillUpgradeDef, type TaskCategory, type UpgradeBranch,
} from '../contracts/gameContract';
import { CARGO_BY_ID, normalizeCargo } from '../data/cargo';
import { formatResource, LAUNCH_CREW_SIZE, resourceEntries, type MissionOffer } from '../data/missions';
import { purchaseProblem, type PlaytestProfile } from '../data/profile';
import { MENU_BACKGROUND, SIDEBAR_BACKGROUND, type FlightUi, type IconName } from './flightUi';
import { makeAbsBox } from './theme';

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

function sidebar(ui: FlightUi, page: Page, navigate: Navigate, hero: boolean): void {
    const { root, palette: p } = ui;
    if (!hero) ui.image(root, [0, 216, 248, 504], SIDEBAR_BACKGROUND);
    logo(ui, hero ? 36 : 24, hero ? 56 : 24, hero);
    NAV.forEach(([label, destination], i) => {
        const active = destination === page || (destination === 'mission' && (page === 'cargo' || page === 'review'));
        const width = hero ? 228 : 204;
        const button = ui.button(root, [hero ? 36 : 24, (hero ? 236 : 216) + i * 64, width, 52], () => navigate(destination), {
            tone: hero && i === 0 ? 'hero' : active ? 'primary' : 'plain',
        });
        const ink = active ? p.ink : hero && i === 0 ? p.cyan : p.text;
        ui.label(button.entity, [8, 0, width - 16, 52], label, { display: true, size: 26, color: ink, center: true });
    });
    if (!hero) {
        const back = ui.button(root, [24, 548, 204, 48], () => navigate(page === 'cargo' ? 'mission' : 'menu'));
        ui.label(back.entity, [8, 0, 188, 48], page === 'cargo' ? 'Missions' : 'Main Menu', {
            display: true, size: 20, color: p.secondary, center: true,
        });
    }
}

export function showMenu(ui: FlightUi, navigate: Navigate, reducedMotion: boolean): (input: InputState) => void {
    const { root, palette: p } = ui;
    ui.box(root, [0, 0, 1280, 720], p.ink);
    ui.image(root, [0, 0, 1280, 720], MENU_BACKGROUND);
    sidebar(ui, 'menu', navigate, true);
    // Small status light aligned with the monitor in the station painting.
    const monitorLight = ui.box(root, [776, 393, 4, 4], p.cyan);
    let lastBlink = true;
    return () => {
        if (reducedMotion) return;
        const lit = Date.now() % 2900 < 2600;
        if (lastBlink !== lit) ui.show(monitorLight, lit);
        lastBlink = lit;
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
function perks(member: CrewMember): string {
    const { perk } = member;
    return `−${percent(1 - perk.costMultiplier)}% cost  ·  +${percent(perk.speedMultiplier - 1)}% progress  ·  +${percent(perk.yieldMultiplier - 1)}% yield`;
}

export function showCrew(ui: FlightUi, profile: PlaytestProfile, initialId: string, onCrew: (ids: string[]) => void, selectedId: (id: string) => void): void {
    const { root, palette: p } = ui;
    const grid = ui.frame(root, [248, 108, 628, 452]);
    const locked = ui.frame(root, [248, 576, 628, 128]);
    const inspector = ui.frame(root, [892, 108, 372, 596]);
    ui.label(grid, [16, 4, 300, 36], 'Available Crew (6)', { display: true, size: 24 });
    const crewCount = ui.label(grid, [388, 8, 216, 28], '', { color: p.amber, center: true });
    ui.label(locked, [16, 0, 360, 32], 'Locked Crew', { display: true, size: 22 });
    ui.label(locked, [384, 0, 220, 32], 'Future roster slots', { size: 14, color: p.muted });
    for (let i = 0; i < 5; i++) {
        const card = ui.frame(locked, [16 + i * 120, 36, 104, 76], p.well);
        ui.image(card, [20, 4, 56, 68], 'assets/textures/crew_locked.png');
        ui.icon(card, 36, 22, 24, 'lock', p.secondary);
    }

    let selected = AVAILABLE_CREW.find(member => member.id === initialId) ?? AVAILABLE_CREW[0]!;
    let assigned = [...profile.crewIds];
    const cards = AVAILABLE_CREW.map((member, index) => {
        const button = ui.button(grid, [12 + (index % 3) * 204, 44 + Math.floor(index / 3) * 196, 192, 184], () => {
            selected = member;
            selectedId(member.id);
            refresh();
        }, { tone: 'tile' });
        const outline = [
            ui.box(button.entity, [4, 4, 184, 4], p.amber),
            ui.box(button.entity, [4, 176, 184, 4], p.amber),
            ui.box(button.entity, [4, 4, 4, 176], p.amber),
            ui.box(button.entity, [184, 4, 4, 176], p.amber),
        ];
        ui.image(button.entity, [32, 4, 128, 160], member.portraitPath);
        ui.box(button.entity, [4, 132, 184, 48], p.raised);
        ui.label(button.entity, [16, 134, 160, 24], member.name, { display: true, size: 20 });
        ui.icon(button.entity, 16, 155, 20, member.role, p.secondary);
        ui.label(button.entity, [44, 154, 128, 24], member.role[0]!.toUpperCase() + member.role.slice(1), { color: p.secondary, size: 14 });
        const tag = ui.label(button.entity, [72, 6, 112, 20], 'ON CREW', { size: 12, color: p.amber, center: true });
        return { button, outline, tag, member };
    });

    const portraits = AVAILABLE_CREW.map(member => ui.image(inspector, [116, 20, 128, 160], member.portraitPath));
    const name = ui.label(inspector, [16, 198, 332, 36], '', { display: true, size: 28 });
    const role = ui.label(inspector, [16, 232, 332, 24], '', { size: 16, color: p.amber });
    const bio = ui.label(inspector, [16, 272, 332, 80], '', { wrap: true, top: true, color: p.secondary, size: 15 });
    const traitCard = ui.frame(inspector, [12, 352, 340, 104], p.well);
    const perkName = ui.label(traitCard, [12, 4, 308, 24], '', { display: true, size: 20, color: p.good });
    const perkNumbers = ui.label(traitCard, [12, 32, 300, 52], '', { size: 14, color: p.secondary, wrap: true, top: true });
    const focus = ui.label(inspector, [16, 464, 332, 30], '', { size: 15, color: p.amber });
    const feedback = ui.label(inspector, [16, 500, 332, 24], '', { size: 13, color: p.secondary });
    const action = ui.button(inspector, [16, 532, 332, 44], () => {
        if (assigned.includes(selected.id)) assigned = assigned.filter(id => id !== selected.id);
        else if (assigned.length < LAUNCH_CREW_SIZE) assigned = [...assigned, selected.id];
        else return;
        onCrew(assigned);
        refresh();
    }, { tone: 'primary', label: 'Add to Crew' });

    function refresh(): void {
        cards.forEach(({ button, outline, tag, member }) => {
            const isSelected = member.id === selected.id;
            outline.forEach(edge => ui.show(edge, isSelected));
            ui.fill(button.surface, isSelected ? p.raised : p.well);
            ui.show(tag, assigned.includes(member.id));
        });
        portraits.forEach((portrait, index) => ui.show(portrait, AVAILABLE_CREW[index]!.id === selected.id));
        const onCrew = assigned.includes(selected.id);
        const full = assigned.length >= LAUNCH_CREW_SIZE;
        ui.setText(crewCount, `Launch crew ${assigned.length} / ${LAUNCH_CREW_SIZE}`);
        ui.setText(name, selected.name);
        ui.setText(role, `${selected.role.toUpperCase()} · ${selected.trait}`);
        ui.setText(bio, selected.bio);
        ui.setText(perkName, selected.perk.title);
        ui.setText(perkNumbers, perks(selected));
        const category = CATEGORIES[selected.perk.bonusCategory];
        ui.setText(focus, `Task focus · ${category}${selected.role === 'pilot' ? ' / Expedition' : ''}`);
        ui.setText(feedback, onCrew ? 'Assigned to the next launch.' : full ? 'Remove a crew member to open a seat.' : 'Seat available on the next launch.');
        ui.setText(action.text, onCrew ? 'Remove from Crew' : 'Add to Crew');
        ui.fill(action.surface, !onCrew && full ? p.raised : p.amber);
        ui.textColor(action.text, !onCrew && full ? p.muted : p.ink);
        action.setDisabled(!onCrew && full);
    }
    refresh();
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

export function showUpgrades(ui: FlightUi, profile: PlaytestProfile, initial: SkillUpgradeDef, select: (id: string) => void, unlock: (node: SkillUpgradeDef) => void): void {
    const { root, palette: p } = ui;
    const tree = ui.frame(root, [248, 108, 628, 596]);
    const inspector = ui.frame(root, [892, 108, 372, 596]);
    const owned = new Set(profile.upgradeIds);
    const branchNodes = SKILL_TREE_UPGRADES.filter(node => node.branch === initial.branch);
    const tabWidths = [168, 136, 140, 112];
    let tabX = 12;
    UPGRADE_BRANCHES.forEach((branch, index) => {
        const width = tabWidths[index]!;
        const button = ui.button(tree, [tabX, 12, width, 44], () => select(SKILL_TREE_UPGRADES.find(node => node.branch === branch)!.id), {
            tone: branch === initial.branch ? 'primary' : 'plain',
        });
        const tint = branch === initial.branch ? p.ink : p.text;
        ui.icon(button.entity, 8, 10, 24, BRANCH_ICON[branch], tint);
        ui.label(button.entity, [36, 0, width - 40, 44], branch, { display: true, size: 16, color: tint });
        tabX += width + 12;
    });
    const graph = ui.frame(tree, [12, 68, 596, 464], p.well);
    const coordinates = (node: SkillUpgradeDef) => ({
        x: node.slot === 'left' ? 116 : node.slot === 'right' ? 408 : 262, y: 16 + 108 * (node.tier - 1),
    });
    for (let tier = 1; tier <= 4; tier++) {
        const y = 16 + (tier - 1) * 108;
        ui.box(graph, [64, y + 30, 500, 2], p.edge);
        ui.label(graph, [16, y + 12, 44, 36], `T${tier}`, { display: true, size: 20, color: p.muted, center: true });
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
            ui.box(graph, [fromX, from.y + 80, 4, 18], ink);
            if (fromX !== toX) ui.box(graph, [Math.min(fromX, toX), turn, Math.abs(toX - fromX) + 4, 4], ink);
            ui.box(graph, [toX, turn, 4, to.y - turn], ink);
        }
    }
    for (const node of branchNodes) {
        const { x, y } = coordinates(node);
        const isOwned = owned.has(node.id);
        const locked = node.prerequisites.some(id => !owned.has(id)) && !isOwned;
        const selected = node.id === initial.id;
        const button = ui.button(graph, [x, y, 132, 84], () => select(node.id), { tone: 'tile' });
        if (selected || isOwned) {
            const thickness = selected ? 4 : 2;
            ui.box(button.entity, [4, 4, 124, thickness], p.amber);
            ui.box(button.entity, [4, 80 - thickness, 124, thickness], p.amber);
            ui.box(button.entity, [4, 4, thickness, 76], p.amber);
            ui.box(button.entity, [128 - thickness, 4, thickness, 76], p.amber);
        }
        ui.icon(button.entity, 50, 8, 32, TECH_ICON[node.id]!, locked ? p.muted : p.amber);
        if (isOwned || locked) ui.icon(button.entity, 100, 10, 20, isOwned ? 'check' : 'lock', isOwned ? p.good : p.muted);
        ui.label(button.entity, [12, 44, 108, 34], node.label, { display: true, size: 15, color: locked ? p.muted : p.text, center: true, wrap: true });
    }
    ui.label(tree, [16, 540, 588, 38], `Research points  ${profile.researchPoints.toLocaleString('en-US')}    ·    ${owned.size} / 24 upgrades owned`, { size: 16, color: p.amber });

    const art = ui.frame(inspector, [16, 16, 332, 148], p.well);
    ui.box(art, [40, 102, 244, 4], p.edge);
    ui.box(art, [64, 110, 196, 4], p.rust);
    ui.icon(art, 112, 16, 96, TECH_ICON[initial.id]!, p.amber);
    ui.label(inspector, [16, 176, 332, 64], initial.label, { display: true, size: 28, wrap: true });
    ui.label(inspector, [16, 244, 332, 28], `${initial.branch}  ·  Tier ${initial.tier}`, { color: p.amber });
    const effects = ui.frame(inspector, [16, 284, 332, 92], p.well);
    ui.label(effects, [12, 4, 292, 24], 'Effects', { display: true, size: 22 });
    ui.label(effects, [12, 34, 292, 44], initial.summary, { wrap: true, top: true, size: 15, color: p.good });
    const requirements = ui.frame(inspector, [16, 388, 332, 100], p.well);
    ui.label(requirements, [12, 4, 292, 24], 'Requirements', { display: true, size: 22 });
    if (!initial.prerequisites.length) ui.label(requirements, [12, 36, 292, 24], 'Available from Tier 1', { size: 15, color: p.secondary });
    initial.prerequisites.forEach((id, index) => {
        const status = owned.has(id);
        ui.icon(requirements, 12, 34 + index * 24, 20, status ? 'check' : 'lock', status ? p.good : p.muted);
        ui.label(requirements, [40, 32 + index * 24, 272, 24], SKILL_TREE_UPGRADES.find(node => node.id === id)!.label, { size: 14, color: p.secondary });
    });
    const problem = purchaseProblem(profile, initial);
    ui.label(inspector, [16, 492, 332, 28], problem ?? 'Available for the next launch', { color: problem ? p.secondary : p.good, size: 14 });
    ui.button(inspector, [16, 532, 332, 44], () => unlock(initial), {
        tone: problem ? 'plain' : 'primary', disabled: Boolean(problem),
        label: owned.has(initial.id) ? 'Owned' : `Unlock · ${initial.cost} points`,
    });
}

export function showMissions(ui: FlightUi, offers: readonly MissionOffer[], onChoose: (offer: MissionOffer) => void): void {
    const { root, palette: p } = ui;
    const selectButtons: Array<ReturnType<FlightUi['button']>> = [];
    offers.forEach((offer, index) => {
        const card = ui.frame(root, [248 + index * 340, 108, 336, 596], offer.setup ? p.panel : p.well);
        const active = Boolean(offer.setup);
        ui.box(card, [12, 12, 304, 148], p.ink);
        ui.image(card, [12, 12, 304, 148], offer.image ?? `assets/textures/mission_${index + 1}.png`);
        ui.label(card, [16, 168, 296, 28], offer.site, { color: active ? p.amber : p.muted, size: 14 });
        ui.label(card, [16, 204, 296, 64], offer.title, { display: true, size: 28, wrap: true, color: active ? p.text : p.muted });
        ui.label(card, [16, 276, 296, 86], offer.description, { size: 15, color: p.secondary, wrap: true, top: true });
        if (offer.setup) {
            const { missionGoal: goal } = offer.setup;
            ui.label(card, [16, 372, 296, 28], `Deadline · Sol ${goal.deadlineSol}`, { size: 16, color: p.amber });
            ui.label(card, [16, 404, 296, 80], goal.requirements.map(req => `${req.target} · ${req.label.split(' (')[0]}`).join('\n'), {
                size: 14, wrap: true, top: true,
            });
            ui.label(card, [16, 488, 296, 40], resourceEntries(goal.minimumReserves).map(([key, amount]) => formatResource(key, amount)).join(' · '), {
                size: 14, color: p.secondary, wrap: true,
            });
        }
        // Selecting a mission opens its briefing popup first; "Prepare Cargo" there continues.
        const button = ui.button(card, [16, 532, 296, 44], () => (offer.briefing ? openBriefing(offer) : onChoose(offer)), {
            label: active ? 'Select Mission' : 'Unavailable', disabled: !active, tone: active ? 'primary' : 'plain',
        });
        if (active) selectButtons.push(button);
    });

    let popup: Entity | null = null;
    function closeBriefing(): void {
        if (popup !== null) ui.world.despawn(popup);
        popup = null;
        selectButtons.forEach(button => button.setDisabled(false));
    }

    function openBriefing(offer: MissionOffer): void {
        const brief = offer.briefing!;
        // Cards stay visible but go inert, so the pointer and the keyboard only reach the popup.
        selectButtons.forEach(button => button.setDisabled(true));
        popup = makeAbsBox(ui.world, root, 0, 0, 1280, 720, { ...p.ink, a: 0.82 }, false);
        ui.world.insert(popup, Interactable, { enabled: true, blockRaycast: true, raycastTarget: true });
        const panel = ui.frame(popup, [280, 70, 720, 580], p.raised);
        ui.box(panel, [12, 12, 240, 136], p.ink);
        ui.image(panel, [12, 12, 240, 136], offer.image ?? `assets/textures/mission_${offers.indexOf(offer) + 1}.png`);
        ui.label(panel, [272, 14, 420, 22], offer.site, { color: p.amber, size: 14 });
        ui.label(panel, [272, 38, 420, 44], offer.title, { display: true, size: 32 });
        if (offer.setup) {
            ui.label(panel, [272, 86, 420, 22], `Deadline · Sol ${offer.setup.missionGoal.deadlineSol}  ·  ${offer.setup.planet === 'moon' ? 'Moon' : 'Mars'}`, {
                size: 15, color: p.secondary,
            });
        }
        ui.label(panel, [272, 112, 420, 40], brief.task, { size: 14, wrap: true, top: true });

        const nasa = ui.frame(panel, [12, 164, 688, 216], p.ink);
        ui.label(nasa, [16, 8, 648, 28], 'The real NASA mission', { display: true, size: 20, color: p.amber });
        ui.label(nasa, [16, 38, 648, 24], brief.basis, { size: 15, color: p.text, wrap: true });
        ui.label(nasa, [16, 70, 648, 96], brief.fact, { size: 15, color: p.secondary, wrap: true, top: true });
        ui.label(nasa, [16, 170, 648, 24], `Source: ${brief.source}`, { size: 12, color: p.muted });

        const why = ui.frame(panel, [12, 392, 688, 100], p.ink);
        ui.label(why, [16, 8, 648, 28], 'Why it matters', { display: true, size: 20, color: p.good });
        ui.label(why, [16, 38, 648, 52], brief.lesson, { size: 15, color: p.secondary, wrap: true, top: true });

        ui.button(panel, [12, 508, 200, 48], closeBriefing, { label: 'Back' });
        ui.button(panel, [452, 508, 248, 48], () => { closeBriefing(); onChoose(offer); }, { label: 'Prepare Cargo', tone: 'primary' });
    }
}

export function showPreparedManifest(ui: FlightUi, offer: MissionOffer, problem: string | null, onLaunch: () => void): void {
    const { root, palette: p } = ui;
    if (!offer.setup) return;
    const bay = ui.frame(root, [248, 108, 584, 596]);
    const summary = ui.frame(root, [848, 108, 416, 596]);
    const counts = normalizeCargo(offer.setup.cargo);
    ui.label(bay, [20, 16, 520, 40], 'Prepared Cargo', { display: true, size: 28 });
    Object.values(CARGO_BY_ID).forEach((item, index) => {
        ui.icon(bay, 24, 72 + index * 55, 24, item.id, p.amber);
        ui.label(bay, [64, 68 + index * 55, 476, 32], `${item.name} × ${counts[item.id]}`, { size: 18 });
    });
    ui.label(summary, [20, 16, 368, 40], 'Launch Crew', { display: true, size: 28 });
    ui.label(summary, [20, 76, 368, 248], offer.setup.crew.map(member => `${member.name} · ${member.role}`).join('\n\n'), { wrap: true, top: true });
    ui.label(summary, [20, 444, 368, 64], problem ?? 'Ready for launch.', { wrap: true, color: problem ? p.bad : p.good });
    ui.button(summary, [20, 524, 368, 48], onLaunch, { label: 'Launch Mission', tone: 'primary', disabled: Boolean(problem) });
}

export function showSettings(ui: FlightUi, profile: PlaytestProfile, change: (field: 'reducedMotion' | 'highContrast') => void): void {
    const { root, palette: p } = ui;
    const panel = ui.frame(root, [248, 108, 1016, 284]);
    for (const [index, [field, title, description]] of ([
        ['reducedMotion', 'Reduced Motion', 'Keep status lights and interface transitions steady.'],
        ['highContrast', 'High Contrast', 'Brighten text, outlines, and focus markers.'],
    ] as const).entries()) {
        const y = 28 + index * 104;
        ui.label(panel, [24, y, 600, 40], title, { display: true, size: 28 });
        ui.label(panel, [24, y + 40, 700, 28], description, { color: p.secondary });
        ui.button(panel, [800, y + 12, 160, 44], () => change(field), { label: profile[field] ? 'On' : 'Off', tone: profile[field] ? 'primary' : 'plain' });
    }
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
