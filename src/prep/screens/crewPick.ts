// Crew Pick: who flies. Everyone brings a perk, but every person adds daily food
// and water use (numbers mirror the main loop's advanceSol()).
import type { Entity } from 'esengine';
import type { CrewMember } from '../../contracts/gameContract';
import { FOOD_PER_CREW_PER_SOL, OXYGEN_PER_SOL, WATER_PER_CREW_PER_SOL } from '../logic/balance';
import { crewOnBoard, type PrepState } from '../logic/flow';
import { iconPath } from '../ui/assets';
import type { Ui } from '../ui/kit';
import { LAYOUT, T, TYPE } from '../ui/tokens';
import type { ScreenHandle } from './missionSelect';
import { buildShell, type ShellActions } from './shell';

export interface CrewActions extends ShellActions {
    focus(id: string): void;
    toggle(id: string): void;
    next(): void;
}

const ROLE_NAME: Record<string, string> = { engineer: 'Engineer', botanist: 'Botanist', pilot: 'Pilot', medic: 'Medic' };

export function buildCrewPick(ui: Ui, root: Entity, s: PrepState, act: CrewActions, portrait: (m: CrewMember) => string): ScreenHandle {
    const offer = s.chosen!;
    buildShell(ui, root, s, {
        title: 'Choose Your Crew',
        subtitle: 'Pick 2 to 4. Each brings a skill, and each eats and drinks.',
        icon: 'ui_icon_crew_16',
    }, act);

    const m = LAYOUT.main;
    const main = ui.panel(root, m.x, m.y, m.w, m.h, { fill: T.ink800 });
    const going = crewOnBoard(s);
    ui.panelHeader(main, 0, 0, m.w - 4, `Available crew (${s.roster.length})`, {
        text: `${going.length} of 4 going`, color: going.length >= 2 ? T.green400 : T.amber400,
    });

    const cardW = Math.floor((m.w - 4 - 16 * 2 - 12) / 2);
    const cardH = 196;
    s.roster.forEach((c, i) => {
        const x = 16 + (i % 2) * (cardW + 12);
        const y = 46 + Math.floor(i / 2) * (cardH + 12);
        if (s.crewFocus === c.id) ui.brackets(main, x, y, cardW, cardH);
        crewCard(ui, main, x, y, cardW, cardH, c, {
            focused: s.crewFocus === c.id,
            onBoard: s.crewIds.includes(c.id),
            recommended: offer.mission.recommendedRoles.includes(c.role),
            portrait: portrait(c),
            focus: () => act.focus(c.id),
        });
    });

    // Footer: what this crew costs per sol + next step.
    const fy = 46 + 2 * (cardH + 12) + 4;
    const foot = ui.panel(main, 12, fy, m.w - 28, m.h - fy - 16, { fill: T.ink900, bg: T.ink800 });
    const n = going.length;
    ui.text(foot, 16, 6, 380, 22, `Every sol, ${n} crew use`, { font: 'display', size: 16 });
    const uses: [string, string][] = [
        ['ui_icon_food_16', `Food ${fmt(n * FOOD_PER_CREW_PER_SOL)}`],
        ['ui_icon_water_16', `Water ${fmt(n * WATER_PER_CREW_PER_SOL)}`],
    ];
    uses.forEach(([icon, text], i) => {
        ui.image(foot, 16 + i * 116, 34, 16, 16, iconPath(icon));
        ui.text(foot, 38 + i * 116, 32, 90, 20, text, { size: TYPE.meta, font: 'bold' });
    });
    // The main loop's air use is per outpost, not per person: say so instead of implying otherwise.
    ui.image(foot, 248, 34, 16, 16, iconPath('ui_icon_o2_16'));
    ui.text(foot, 270, 32, 140, 20, `O₂ ${fmt(OXYGEN_PER_SOL)}% (base)`, { size: TYPE.meta, font: 'bold' });
    ui.text(foot, 16, 54, 380, 18, s.keyboard ? 'Keys: arrows pick · Space adds · Enter packs' : '', { size: TYPE.label, color: T.textSecondary });
    const ready = going.length >= 2;
    ui.button(foot, m.w - 28 - 4 - 236, 10, 228, 52, ready ? 'Pack the Rocket' : `Pick ${2 - going.length} more`,
        () => act.next(), { variant: 'primary', disabled: !ready, icon: iconPath('ui_icon_pack_16'), size: 19, name: 'BtnPackRocket' });

    inspector(ui, root, s, act, portrait);
    return {};
}

function fmt(n: number): string {
    return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function crewCard(ui: Ui, parent: Entity, x: number, y: number, w: number, h: number, c: CrewMember,
    o: { focused: boolean; onBoard: boolean; recommended: boolean; portrait: string; focus: () => void }): void {
    const frame = ui.hotspot(parent, x, y, w, h, o.focused ? T.amber400 : T.edge500, { click: o.focus }, `CrewCard_${c.id}`);
    const bw = o.focused ? 3 : 2;
    const p = ui.box(frame, bw, bw, w - bw * 2, h - bw * 2, o.focused ? T.ink700 : T.ink800);
    const pw = 128;
    const well = ui.box(p, 10, 10, pw, pw, T.ink900);
    ui.image(well, 0, 0, pw, pw, o.portrait, { tint: o.onBoard ? undefined : { r: 0.62, g: 0.6, b: 0.68, a: 1 } });

    const tx = 10 + pw + 12;
    const tw = w - bw * 2 - tx - 10;
    ui.text(p, tx, 10, tw, 26, c.name, { font: 'display', size: TYPE.name });
    ui.text(p, tx, 36, tw, 18, ROLE_NAME[c.role] ?? c.role, { size: TYPE.meta, color: T.textSecondary });
    ui.image(p, tx, 64, 16, 16, iconPath('ui_icon_up_16'));
    ui.text(p, tx + 22, 62, tw - 22, 20, c.perk.title, { size: TYPE.meta, font: 'bold', color: T.green400 });
    if (o.recommended) {
        const b = ui.box(p, tx, 92, Math.min(tw, 150), 22, T.rust700);
        ui.text(b, 6, 0, 140, 22, 'Good for this mission', { size: 11, font: 'bold', color: T.amber300 });
    }

    // Status strip across the bottom: on board vs at base, in words and icon.
    const sy = h - bw * 2 - 44;
    const strip = ui.box(p, 10, sy, w - bw * 2 - 20, 34, o.onBoard ? { ...T.green400, a: 0.18 } : T.ink900);
    ui.image(strip, 8, 9, 16, 16, iconPath(o.onBoard ? 'ui_icon_check_16' : 'ui_icon_base_16'));
    ui.text(strip, 32, 0, 220, 34, o.onBoard ? 'On board' : 'Staying at base', {
        size: TYPE.meta, font: 'bold', color: o.onBoard ? T.green400 : T.textSecondary,
    });
}

function inspector(ui: Ui, root: Entity, s: PrepState, act: CrewActions, portrait: (m: CrewMember) => string): void {
    const r = LAYOUT.inspector;
    const p = ui.panel(root, r.x, r.y, r.w, r.h, { fill: T.ink800 });
    const c = s.roster.find((x) => x.id === s.crewFocus) ?? s.roster[0]!;
    const w = r.w - 36;
    const onBoard = s.crewIds.includes(c.id);

    const well = ui.box(p, 16, 16, 120, 120, T.ink900);
    ui.image(well, 0, 0, 120, 120, portrait(c));
    ui.text(p, 148, 20, w - 132, 28, c.name, { font: 'display', size: 22, wrap: true });
    ui.text(p, 148, 78, w - 132, 20, ROLE_NAME[c.role] ?? c.role, { size: TYPE.meta, color: T.textSecondary });
    ui.text(p, 148, 98, w - 132, 36, c.trait, { size: TYPE.meta, color: T.textSecondary, wrap: true });

    let y = 148;
    ui.text(p, 16, y, w, 108, c.bio, { wrap: true, size: 14 });
    y += 112;

    // Trait rows (design.md TraitRow): direction icon + title + one line of effect.
    const perk = ui.panel(p, 12, y, w + 8, 108, { fill: T.ink900, bg: T.ink800 });
    ui.image(perk, 10, 10, 32, 32, iconPath('ui_icon_up_16'));
    ui.text(perk, 52, 8, w - 52, 22, c.perk.title, { font: 'display', size: 16, color: T.green400 });
    ui.text(perk, 52, 32, w - 56, 70, c.perk.description, { wrap: true, size: TYPE.meta });
    y += 116;
    const cost = ui.panel(p, 12, y, w + 8, 74, { fill: T.ink900, bg: T.ink800 });
    ui.image(cost, 10, 10, 32, 32, iconPath('ui_icon_down_16'));
    ui.text(cost, 52, 8, w - 52, 22, 'Needs supplies', { font: 'display', size: 16, color: T.red400 });
    ui.text(cost, 52, 32, w - 56, 40, `Eats ${FOOD_PER_CREW_PER_SOL} food and drinks ${WATER_PER_CREW_PER_SOL} water every sol.`, {
        wrap: true, size: TYPE.meta,
    });

    const full = !onBoard && s.crewIds.length >= s.roster.length;
    ui.button(p, 12, r.h - 70, w + 8, 54, onBoard ? 'Leave at Base' : 'Add to Crew', () => act.toggle(c.id), {
        variant: onBoard ? 'secondary' : 'primary', disabled: full, size: 20,
        icon: iconPath(onBoard ? 'ui_icon_base_16' : 'ui_icon_crew_16'), name: 'BtnToggleCrew',
    });
}
