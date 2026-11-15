// Launch Summary: the last check before the survival run, in the flight UI style.
// Shows the mission, the four crew with their perks, the packed cargo, and how long
// food, water and O₂ last. Edit Crew picks the four who fly (crew comes after cargo).
// Launch starts the run; Back returns to Cargo Preparation.
import { Interactable, type Entity } from 'esengine';
import { AVAILABLE_CREW, type MissionSetupInput } from '../contracts/gameContract';
import { CARGO_ITEMS, CARGO_COLUMNS, CARGO_ROWS, occupiedCells, packedInventory, type CargoPlacement } from '../data/cargo';
import { LAUNCH_CREW_SIZE, missionDeadline, toggleCrewPick, victoryCriteria } from '../data/missions';
import { supplyLasts } from './cargoPacker';
import type { FlightUi } from './flightUi';
import { stopMusic } from '../audio/soundManager';
import { play, vibrate } from './feedback';
import type { InputState } from 'esengine';
import { playLaunchIntro, type LaunchIntro } from './launchIntro';
import { easeOutBack, makeMotion } from './motion';
import { makeAbsBox } from './theme';
import { tutorial } from './tutorial';

const ROLE: Record<string, string> = {
    engineer: 'Engineer', botanist: 'Botanist', pilot: 'Pilot', medic: 'Medic', scientist: 'Scientist', captain: 'Captain',
};

export function showLaunchSummary(
    ui: FlightUi, setup: MissionSetupInput, placements: readonly CargoPlacement[], problem: string | null,
    onLaunch: () => void, onBack: () => void,
    /** The mission's picture, shown on the mission side of the launch intro. */
    missionImage?: string,
    /** Edit Crew: the current picks, and where a confirmed new four goes. Without it the crew is fixed. */
    crewEdit?: { crewIds: readonly string[]; onCrew: (ids: string[]) => void },
): (input: InputState) => boolean {
    const { root, palette: p } = ui;
    const motion = makeMotion(ui.world, ui.reducedMotion);
    const goal = setup.missionGoal;

    // ---- Crew (left) ----
    // Both halves sit in holders so Launch can shake them and lift them off together.
    const crewHolder = ui.group(root, [248, 108, 584, 596]);
    const crewFrame = ui.frame(crewHolder, [0, 0, 584, 596]);
    ui.label(crewFrame, [20, 12, 400, 40], 'Launch Crew', { display: true, size: 28 });
    const crewReady = setup.crew.length === LAUNCH_CREW_SIZE;
    ui.label(crewFrame, crewEdit ? [220, 16, 150, 32] : [380, 16, 176, 32], `${setup.crew.length} of ${LAUNCH_CREW_SIZE} aboard`, {
        size: 15, color: crewReady ? p.good : p.bad, center: true,
    });
    const editCrew = crewEdit ? ui.button(crewFrame, [380, 12, 188, 40], () => { if (!launching) openCrewEditor(); }, {
        label: 'Edit Crew', tone: crewReady ? 'plain' : 'primary', labelSize: 16,
    }) : null;
    setup.crew.forEach((member, index) => {
        const x = 16 + (index % 2) * 276;
        const y = 60 + Math.floor(index / 2) * 262;
        // The crew cards come aboard one after another.
        const seat = ui.group(crewFrame, [x, y, 264, 250]);
        motion.enter(seat, x, y, { dy: 18, delay: 60 + index * 90, duration: 320, reveal: true });
        const card = ui.frame(seat, [0, 0, 264, 250], p.raised);
        ui.box(card, [12, 12, 96, 120], p.ink);
        ui.image(card, [12, 12, 96, 120], member.portraitPath);
        ui.label(card, [120, 14, 124, 52], member.name, { display: true, size: 20, wrap: true, top: true });
        ui.label(card, [120, 70, 124, 22], ROLE[member.role] ?? member.role, { size: 14, color: p.amber });
        ui.label(card, [12, 144, 236, 24], member.perk.title, { display: true, size: 16, color: p.good });
        ui.label(card, [12, 170, 236, 68], member.perk.description, { size: 13, color: p.secondary, wrap: true, top: true });
    });
    // Open seats stay visible, so a short crew reads as "pick someone" rather than a broken layout.
    for (let index = setup.crew.length; index < LAUNCH_CREW_SIZE; index++) {
        const x = 16 + (index % 2) * 276;
        const y = 60 + Math.floor(index / 2) * 262;
        const seat = ui.frame(crewFrame, [x, y, 264, 250], p.well);
        ui.icon(seat, 112, 84, 40, 'crew', p.muted);
        ui.label(seat, [12, 132, 240, 28], 'Empty seat', { display: true, size: 18, color: p.muted, center: true });
        if (crewEdit) ui.label(seat, [12, 162, 240, 24], 'Use Edit Crew to fill it', { size: 13, color: p.muted, center: true });
    }

    // ---- Mission, cargo, supplies (right) ----
    const sideHolder = ui.group(root, [848, 108, 416, 596]);
    const side = ui.frame(sideHolder, [0, 0, 416, 596]);
    ui.label(side, [16, 10, 384, 34], goal.title, { display: true, size: 24, fit: 16 });
    ui.label(side, [16, 44, 384, 22], `${setup.planet === 'moon' ? 'Moon' : 'Mars'} · Deadline Sol ${missionDeadline(setup)}`, {
        size: 14, color: p.amber,
    });

    ui.label(side, [16, 74, 260, 28], 'Packed Cargo', { display: true, size: 20 });
    const cells = placements.reduce((n, piece) => n + occupiedCells(piece).length, 0);
    ui.label(side, [260, 76, 140, 24], `${cells} / ${CARGO_COLUMNS * CARGO_ROWS} cells`, { size: 13, color: p.amber, center: true });
    const counts = packedInventory(placements);
    const packed = CARGO_ITEMS.filter(item => counts[item.id] > 0);
    if (packed.length === 0) ui.label(side, [16, 108, 384, 24], 'Nothing packed.', { size: 14, color: p.muted });
    packed.forEach((item, index) => {
        const x = 16 + (index % 2) * 194;
        const y = 106 + Math.floor(index / 2) * 34;
        ui.icon(side, x, y + 4, 24, item.id, p.amber);
        ui.label(side, [x + 32, y, 156, 32], `${item.name} × ${counts[item.id]}`, { size: 14 });
    });

    const supplyTop = 106 + Math.ceil(Math.max(1, packed.length) / 2) * 34 + 10;
    ui.label(side, [16, supplyTop, 384, 28], 'Supplies', { display: true, size: 20 });
    supplyLasts(setup, placements).forEach((entry, index) => {
        const y = supplyTop + 32 + index * 28;
        ui.icon(side, 16, y + 2, 20, entry.key, p.amber);
        ui.label(side, [44, y, 80, 24], entry.label, { size: 14 });
        const filled = Math.min(12, Math.round((entry.lasts / entry.deadline) * 12));
        // The meter fills block by block once the crew is aboard.
        for (let i = 0; i < 12; i++) {
            const seg = ui.box(side, [124 + i * 13, y + 7, 11, 10], p.well);
            if (i < filled) motion.after(400 + index * 120 + i * 35, () => ui.fill(seg, entry.ok ? p.good : p.amber));
        }
        ui.label(side, [284, y, 116, 24], entry.ok ? 'whole trip ✓' : `${entry.lasts} of ${entry.deadline} sols`, {
            size: 13, color: entry.ok ? p.good : p.amber, center: true,
        });
    });

    ui.label(side, [16, 430, 384, 76], problem ?? victoryCriteria(setup), {
        size: 14, wrap: true, color: problem ? p.bad : p.good,
    });
    // Launch: engines rumble and the screen rattles for a moment, then the launch intro
    // (your crew vs the mission, countdown, lift-off) plays and starts the run.
    let launching = false;
    let intro: LaunchIntro | null = null;
    const back = ui.button(side, [16, 528, 140, 48], () => { if (!launching) onBack(); }, { label: 'Back' });
    const go = ui.button(side, [168, 528, 232, 48], () => {
        if (launching) return;
        launching = true;
        tutorial.view.launching = true;
        // The menu music fades out: the rocket intro has only its own sounds, and the survival
        // run starts its game music when it opens.
        stopMusic();
        play('launch');
        vibrate('long');
        back.setDisabled(true);
        go.setDisabled(true);
        if (go.text) ui.setText(go.text, 'Lift-off!');
        const begin = () => { intro = playLaunchIntro(ui, motion, setup, missionImage, onLaunch); };
        if (motion.reducedMotion) { begin(); return; }
        motion.shake(crewHolder, 248, 108, 3, 320);
        motion.shake(sideHolder, 848, 108, 3, 320, begin);
    }, { label: 'Launch Mission', tone: 'primary', disabled: Boolean(problem) });
    tutorial.targets.set('review-launch', go.entity);

    // ---- Edit Crew popup: every crew member, tap to pick, confirm with exactly four ----
    let popup: Entity | null = null;
    function setPageInert(inert: boolean): void {
        back.setDisabled(inert);
        go.setDisabled(inert || Boolean(problem));
        editCrew?.setDisabled(inert);
    }
    function closeCrewEditor(): void {
        if (popup !== null) ui.world.despawn(popup);
        popup = null;
        setPageInert(false);
    }
    function openCrewEditor(): void {
        if (!crewEdit || popup !== null) return;
        const edit = crewEdit;
        let picks = edit.crewIds.filter(id => AVAILABLE_CREW.some(member => member.id === id)).slice(0, LAUNCH_CREW_SIZE);
        // The page behind goes inert, so the pointer and the keyboard only reach the popup.
        setPageInert(true);
        play('whoosh');
        popup = makeAbsBox(ui.world, root, 0, 0, 1280, 720, { ...p.ink, a: 0.82 }, false);
        ui.world.insert(popup, Interactable, { enabled: true, blockRaycast: true, raycastTarget: true });
        const holder = ui.group(popup, [196, 52, 888, 616]);
        motion.enter(holder, 196, 52, { dy: 30, duration: 300, ease: easeOutBack });
        const panel = ui.frame(holder, [0, 0, 888, 616], p.raised);
        ui.label(panel, [20, 12, 400, 40], 'Edit Crew', { display: true, size: 28 });
        const count = ui.label(panel, [560, 16, 308, 32], '', { size: 15, center: true });

        const tiles = AVAILABLE_CREW.map((member, index) => {
            const x = 16 + (index % 3) * 288;
            const y = 60 + Math.floor(index / 3) * 236;
            const tile = ui.button(panel, [x, y, 276, 224], () => {
                const wasPicked = picks.includes(member.id);
                const next = toggleCrewPick(picks, member.id);
                // All four seats taken: a fifth tap changes nothing, and the hint says why.
                if (!wasPicked && next.length === picks.length) return;
                picks = next;
                if (!wasPicked) play(picks.length === LAUNCH_CREW_SIZE ? 'success' : 'chime');
                refresh();
            }, { tone: 'tile' });
            const outline = [
                ui.box(tile.entity, [4, 4, 268, 4], p.amber), ui.box(tile.entity, [4, 216, 268, 4], p.amber),
                ui.box(tile.entity, [4, 4, 4, 216], p.amber), ui.box(tile.entity, [268, 4, 4, 216], p.amber),
            ];
            ui.box(tile.entity, [14, 14, 96, 120], p.ink);
            ui.image(tile.entity, [14, 14, 96, 120], member.portraitPath);
            ui.label(tile.entity, [122, 16, 142, 52], member.name, { display: true, size: 18, wrap: true, top: true, fit: 13 });
            ui.icon(tile.entity, 122, 74, 20, member.role, p.secondary);
            ui.label(tile.entity, [148, 72, 116, 24], ROLE[member.role] ?? member.role, { size: 14, color: p.amber });
            ui.label(tile.entity, [14, 142, 250, 24], member.perk.title, { display: true, size: 15, color: p.good, fit: 12 });
            ui.label(tile.entity, [14, 168, 250, 46], member.perk.description, { size: 12, color: p.secondary, wrap: true, top: true });
            // Filled badge with a check mark, so "picked" never depends on colour alone.
            const tag = ui.box(tile.entity, [122, 102, 92, 24], p.amber);
            ui.icon(tag, 4, 4, 16, 'check', p.ink);
            ui.label(tag, [22, 0, 68, 24], 'On crew', { size: 13, color: p.ink, center: true });
            return { tile, outline, tag, member };
        });

        const hint = ui.label(panel, [20, 548, 420, 48], '', { size: 14, color: p.secondary, wrap: true });
        ui.button(panel, [464, 548, 160, 48], closeCrewEditor, { label: 'Cancel' });
        const confirm = ui.button(panel, [636, 548, 232, 48], () => {
            if (picks.length !== LAUNCH_CREW_SIZE) return;
            const chosen = [...picks];
            closeCrewEditor();
            edit.onCrew(chosen);
        }, { label: 'Confirm Crew', tone: 'primary' });

        function refresh(): void {
            const full = picks.length >= LAUNCH_CREW_SIZE;
            tiles.forEach(({ tile, outline, tag, member }) => {
                const picked = picks.includes(member.id);
                outline.forEach(edge => ui.show(edge, picked));
                ui.fill(tile.surface, picked ? p.raised : p.well);
                ui.show(tag, picked);
            });
            ui.setText(count, full ? 'Crew ready' : `${picks.length} of ${LAUNCH_CREW_SIZE} picked`);
            ui.textColor(count, full ? p.good : p.amber);
            ui.setText(hint, full
                ? 'All four seats are taken. Tap someone on the crew to free a seat.'
                : `Tap ${LAUNCH_CREW_SIZE - picks.length} more to fill the seats.`);
            confirm.setDisabled(!full);
        }
        refresh();
    }

    // Per frame: run the motion and the intro. While launching, Escape belongs to the intro (skip),
    // so the page must not navigate away on it. With Edit Crew open, Escape closes the popup instead.
    return (input: InputState) => {
        motion.tick();
        intro?.tick(input);
        if (popup !== null && input.isKeyPressed('Escape')) { closeCrewEditor(); return true; }
        return launching;
    };
}
