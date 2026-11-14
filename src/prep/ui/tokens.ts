import type { Color } from 'esengine';

// DESIGN.md (MSP-ART-001) §3 colour tokens and §6 spacing, as Estella colours.
// Proposed as the shared token set; the main loop still uses src/ui/theme.ts.

function hex(h: string, a = 1): Color {
    const n = parseInt(h.replace('#', ''), 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a };
}

export const T = {
    ink900: hex('#1E1D30'),
    ink800: hex('#212031'),
    ink700: hex('#323149'),
    ink600: hex('#36354B'),
    edge500: hex('#555064'),
    edge300: hex('#777185'),
    textPrimary: hex('#E8DCDD'),
    textSecondary: hex('#BDB1BC'),
    textMuted: hex('#918898'),
    amber400: hex('#EEB166'),
    amber300: hex('#F8C574'),
    mars600: hex('#A25754'),
    mars500: hex('#D0685A'),
    rust700: hex('#573548'),
    cyan800: hex('#145360'),
    cyan400: hex('#65CCD0'),
    green400: hex('#87B77A'),
    red400: hex('#D96C6C'),
    white100: hex('#F3ECEA'),
    /** Item category tints for packed cells (muted so sprites read on top). */
    catMission: hex('#6A3E55'),
    catSupplies: hex('#4B5F45'),
    catPower: hex('#6B5B33'),
    catTools: hex('#48455E'),
    scrim: hex('#14131F', 0.82),
    previewOk: hex('#EEB166', 0.55),
    previewBad: hex('#D96C6C', 0.6),
    clear: hex('#000000', 0),
} as const;

/** design.md §6.2 spacing tokens (4-px foundation). */
export const S = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

/** Type sizes for the 1280×720 design resolution (design.md §5.1 scaled from 1080p). */
export const TYPE = {
    title: 30,
    heading: 18,
    name: 20,
    nav: 20,
    body: 15,
    meta: 13,
    label: 12,
} as const;

/** 1280×720 layout grid shared by all three screens (design.md §6.1 shell). */
export const LAYOUT = {
    pad: 16,
    sidebar: { x: 16, y: 16, w: 232, h: 688 },
    header: { x: 260, y: 16, w: 1004, h: 80 },
    main: { x: 260, y: 108, w: 676, h: 596 },
    inspector: { x: 948, y: 108, w: 316, h: 596 },
} as const;
