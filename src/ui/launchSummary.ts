// Launch Summary: the last check before the survival run, in the flight UI style.
// Shows the mission, the four crew with their perks, the packed cargo, and how long
// food, water and O₂ last. Launch starts the run; Back returns to Cargo Preparation.
import type { MissionSetupInput } from '../contracts/gameContract';
import { CARGO_ITEMS, CARGO_COLUMNS, CARGO_ROWS, occupiedCells, packedInventory, type CargoPlacement } from '../data/cargo';
import { missionDeadline, victoryCriteria } from '../data/missions';
import { supplyLasts } from './cargoPacker';
import type { FlightUi } from './flightUi';
import { stopMusic } from '../audio/soundManager';
import { play, vibrate } from './feedback';
import type { InputState } from 'esengine';
import { playLaunchIntro, type LaunchIntro } from './launchIntro';
import { makeMotion } from './motion';

const ROLE: Record<string, string> = {
    engineer: 'Engineer', botanist: 'Botanist', pilot: 'Pilot', medic: 'Medic', scientist: 'Scientist', captain: 'Captain',
};

export function showLaunchSummary(
    ui: FlightUi, setup: MissionSetupInput, placements: readonly CargoPlacement[], problem: string | null,
    onLaunch: () => void, onBack: () => void,
    /** The mission's picture, shown on the mission side of the launch intro. */
    missionImage?: string,
): (input: InputState) => boolean {
    const { root, palette: p } = ui;
    const motion = makeMotion(ui.world, ui.reducedMotion);
    const goal = setup.missionGoal;

    // ---- Crew (left) ----
    // Both halves sit in holders so Launch can shake them and lift them off together.
    const crewHolder = ui.group(root, [248, 108, 584, 596]);
    const crewFrame = ui.frame(crewHolder, [0, 0, 584, 596]);
    ui.label(crewFrame, [20, 12, 400, 40], 'Launch Crew', { display: true, size: 28 });
    ui.label(crewFrame, [380, 16, 176, 32], `${setup.crew.length} of 4 aboard`, { size: 15, color: setup.crew.length === 4 ? p.good : p.bad, center: true });
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

    // Per frame: run the motion and the intro. While launching, Escape belongs to the intro (skip),
    // so the page must not navigate away on it.
    return (input: InputState) => {
        motion.tick();
        intro?.tick(input);
        return launching;
    };
}
