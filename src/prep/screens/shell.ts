// design.md §6.1 shared shell, matching the Crew/Upgrade mockups: the MSP logo and
// the Play/Crew/Upgrade/Settings/Quit nav float over a Mars backdrop on the left;
// a header panel carries the page icon, title and subtitle. Mission Prep adds its
// step indicator to the header's right.
import type { Entity } from 'esengine';
import { STEPS, stepReachable, type PrepScreen, type PrepState } from '../logic/flow';
import { UI_ART, iconPath } from '../ui/assets';
import type { Ui } from '../ui/kit';
import { LAYOUT, T, TYPE } from '../ui/tokens';

/** Screens owned by teammates; the sidebar opens a wireframe placeholder for them. */
export type StubId = 'crew_roster' | 'upgrade' | 'settings' | 'quit';

export interface ShellActions {
    openStub(id: StubId): void;
    goTo(screen: PrepScreen): void;
}

const NAV: { label: string; icon: string; active?: boolean; stub?: StubId }[] = [
    { label: 'Play', icon: 'ui_icon_play_16', active: true },
    { label: 'Crew', icon: 'ui_icon_crew_16', stub: 'crew_roster' },
    { label: 'Upgrade', icon: 'ui_icon_upgrade_16', stub: 'upgrade' },
    { label: 'Settings', icon: 'ui_icon_gear_16', stub: 'settings' },
    { label: 'Quit', icon: 'ui_icon_quit_16', stub: 'quit' },
];

export function buildShell(ui: Ui, root: Entity, s: PrepState,
    page: { title: string; subtitle: string; icon: string }, act: ShellActions): void {
    ui.box(root, 0, 0, 1280, 720, T.ink900);

    // ---- Left: backdrop, logo, nav (no panel, as in the mockups) ---------
    ui.image(root, 0, 0, 272, 720, UI_ART.backdrop);
    ui.image(root, LAYOUT.sidebar.x, 20, 232, 80, UI_ART.logo);
    NAV.forEach((n, i) => {
        ui.button(root, LAYOUT.sidebar.x + 4, 136 + i * 64, 220, 52, n.label, () => { if (n.stub) act.openStub(n.stub); }, {
            variant: n.active ? 'navActive' : 'nav', align: 'left', icon: iconPath(n.icon), size: 21,
        });
    });

    // ---- Header ----------------------------------------------------------
    const hd = LAYOUT.header;
    const head = ui.panel(root, hd.x, hd.y, hd.w, hd.h, { fill: T.ink800 });
    ui.image(head, 18, 20, 32, 32, iconPath(page.icon));
    ui.text(head, 62, 6, 500, 38, page.title, { font: 'display', size: TYPE.title });
    ui.text(head, 62, 44, 500, 24, page.subtitle, { size: TYPE.meta, color: T.textSecondary });

    // Step indicator: done / current / locked, each clickable when reachable.
    const stepW = 128;
    const sx0 = hd.w - 4 - 12 - STEPS.length * (stepW + 8) + 8;
    STEPS.forEach((step, i) => {
        const x = sx0 + i * (stepW + 8);
        const current = s.screen === step.id;
        const reachable = stepReachable(s, step.id);
        const done = !current && reachable && STEPS.findIndex((x2) => x2.id === s.screen) > i;
        const label = `${i + 1} ${step.label}`;
        if (current) {
            const p = ui.panel(head, x, 16, stepW, 44, { fill: T.ink700, border: T.amber400, bg: T.ink800, cut: 4 });
            ui.text(p, 0, 0, stepW - 4, 40, label, { font: 'display', size: 17, color: T.amber400, align: 'center' });
        } else {
            const icon = done ? iconPath('ui_icon_check_16') : reachable ? undefined : iconPath('ui_icon_lock_16');
            ui.button(head, x, 16, stepW, 44, label, () => act.goTo(step.id), {
                variant: 'tab', disabled: !reachable, size: 16, icon,
            });
        }
    });
}

/** Wireframe placeholder for a teammate's screen. */
export function buildStub(ui: Ui, root: Entity, id: StubId, close: () => void): void {
    const names: Record<StubId, string> = {
        crew_roster: 'Crew Roster', upgrade: 'Upgrade', settings: 'Settings', quit: 'Quit',
    };
    ui.box(root, 0, 0, 1280, 720, T.scrim, false);
    const p = ui.panel(root, 380, 220, 520, 280, { fill: T.ink700, border: T.edge300, bg: T.ink900 });
    ui.text(p, 24, 20, 470, 36, names[id], { font: 'display', size: 26 });
    ui.box(p, 24, 64, 468, 2, T.edge500);
    ui.text(p, 24, 80, 470, 90,
        'Wireframe placeholder. A teammate builds this screen; it plugs into the same sidebar.',
        { wrap: true, color: T.textSecondary });
    ui.button(p, 24, 196, 180, 52, 'Back', close, { variant: 'secondary', name: 'BtnStubBack' });
}
