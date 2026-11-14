// Launch Summary: the last check before the survival run, in the flight UI style.
// Shows the mission, the four crew with their perks, the packed cargo, and how long
// food, water and O₂ last. Launch starts the run; Back returns to Cargo Preparation.
import type { MissionSetupInput } from '../contracts/gameContract';
import { CARGO_ITEMS, CARGO_COLUMNS, CARGO_ROWS, occupiedCells, packedInventory, type CargoPlacement } from '../data/cargo';
import { supplyLasts } from './cargoPacker';
import type { FlightUi } from './flightUi';

const ROLE: Record<string, string> = {
    engineer: 'Engineer', botanist: 'Botanist', pilot: 'Pilot', medic: 'Medic', scientist: 'Scientist', captain: 'Captain',
};

export function showLaunchSummary(
    ui: FlightUi, setup: MissionSetupInput, placements: readonly CargoPlacement[], problem: string | null,
    onLaunch: () => void, onBack: () => void,
): void {
    const { root, palette: p } = ui;
    const goal = setup.missionGoal;

    // ---- Crew (left) ----
    const crewFrame = ui.frame(root, [248, 108, 584, 596]);
    ui.label(crewFrame, [20, 12, 400, 40], 'Launch Crew', { display: true, size: 28 });
    ui.label(crewFrame, [380, 16, 176, 32], `${setup.crew.length} of 4 aboard`, { size: 15, color: setup.crew.length === 4 ? p.good : p.bad, center: true });
    setup.crew.forEach((member, index) => {
        const x = 16 + (index % 2) * 276;
        const y = 60 + Math.floor(index / 2) * 262;
        const card = ui.frame(crewFrame, [x, y, 264, 250], p.raised);
        ui.box(card, [12, 12, 96, 120], p.ink);
        ui.image(card, [12, 12, 96, 120], member.portraitPath);
        ui.label(card, [120, 14, 124, 52], member.name, { display: true, size: 20, wrap: true, top: true });
        ui.label(card, [120, 70, 124, 22], ROLE[member.role] ?? member.role, { size: 14, color: p.amber });
        ui.label(card, [12, 144, 236, 24], member.perk.title, { display: true, size: 16, color: p.good });
        ui.label(card, [12, 170, 236, 64], member.perk.description, { size: 12, color: p.secondary, wrap: true, top: true });
    });

    // ---- Mission, cargo, supplies (right) ----
    const side = ui.frame(root, [848, 108, 416, 596]);
    ui.label(side, [16, 10, 384, 34], goal.title, { display: true, size: 24, wrap: true });
    ui.label(side, [16, 44, 384, 22], `${setup.planet === 'moon' ? 'Moon' : 'Mars'} · ${goal.coords} · due Sol ${goal.deadlineSol}`, {
        size: 13, color: p.secondary,
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
        for (let i = 0; i < 12; i++) ui.box(side, [124 + i * 13, y + 7, 11, 10], i < filled ? (entry.ok ? p.good : p.amber) : p.well);
        ui.label(side, [284, y, 116, 24], entry.ok ? 'whole trip ✓' : `${entry.lasts} of ${entry.deadline} sols`, {
            size: 13, color: entry.ok ? p.good : p.amber, center: true,
        });
    });

    ui.label(side, [16, 462, 384, 52], problem ?? 'Ready for launch. Short supplies can be grown or recycled on the way.', {
        size: 14, wrap: true, color: problem ? p.bad : p.good,
    });
    ui.button(side, [16, 528, 140, 48], onBack, { label: 'Back' });
    ui.button(side, [168, 528, 232, 48], onLaunch, { label: 'Launch Mission', tone: 'primary', disabled: Boolean(problem) });
}
