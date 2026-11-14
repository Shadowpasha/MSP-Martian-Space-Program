// Loads Mission Prep textures and fonts once, then hands out handles.
// Screens ask `tex(path)`; 0 means "not loaded (yet)" and they draw a plain fill.
import { ITEMS } from '../data/items';

/** The part of Estella's `Res(Assets)` this module uses. */
export interface AssetsState {
    loadTexture(path: string): Promise<{ handle: number }>;
    loadFont(path: string): Promise<{ handle: number }>;
}

export const PREP_TEX = 'assets/textures/prep/';
export const MAPS = {
    mars: `${PREP_TEX}maps/map_jezero_320x180.png`,
    moon: `${PREP_TEX}maps/map_lunar_south_pole_320x180.png`,
} as const;
export const UI_ART = {
    logo: 'assets/textures/prep/ui/ui_logo_msp_116x40.png',
    backdrop: 'assets/textures/prep/ui/env_mars_backdrop_sidebar_136x360.png',
} as const;
export const FONTS = {
    display: 'assets/fonts/PixelifySans.ttf',
    body: 'assets/fonts/IBMPlexMono-Regular.ttf',
    bodyBold: 'assets/fonts/IBMPlexMono-SemiBold.ttf',
} as const;

export function iconPath(name: string): string {
    return `${PREP_TEX}icons/${name}.png`;
}
export function itemSpritePath(sprite: string): string {
    return `${PREP_TEX}items/${sprite}`;
}

const ICON_NAMES = [
    'ui_icon_food_16', 'ui_icon_water_16', 'ui_icon_o2_16', 'ui_icon_power_16', 'ui_icon_res_16',
    'ui_icon_check_16', 'ui_icon_cross_16', 'ui_icon_warn_16', 'ui_icon_mission_16', 'ui_icon_crew_16',
    'ui_icon_pack_16', 'ui_icon_launch_16', 'ui_icon_base_16', 'ui_icon_lock_16', 'ui_icon_rotate_16',
    'ui_icon_up_16', 'ui_icon_down_16', 'ui_icon_play_16', 'ui_icon_upgrade_16', 'ui_icon_gear_16', 'ui_icon_quit_16',
    'hz_dust_storm_16', 'hz_solar_flare_16', 'hz_cold_snap_16', 'hz_rough_terrain_16',
    'hz_dust_on_panels_16', 'hz_equipment_failure_16', 'hz_comms_blackout_16',
];

const textures = new Map<string, number>();
const fonts = new Map<string, number>();
let started = false;
let ready = false;

export function assetsReady(): boolean {
    return ready;
}

export function tex(path: string): number {
    return textures.get(path) ?? 0;
}

export function font(path: string): number {
    return fonts.get(path) ?? 0;
}

/** Kick off loading; resolves when every asset settled (failures fall back to plain fills / default font). */
export function loadPrepAssets(assets: AssetsState, extraTextures: readonly string[]): void {
    if (started) return;
    started = true;
    const texPaths = [
        ...Object.values(MAPS),
        ...Object.values(UI_ART),
        ...ICON_NAMES.map(iconPath),
        ...ITEMS.map((i) => itemSpritePath(i.sprite)),
        ...extraTextures,
    ];
    const jobs: Promise<unknown>[] = [];
    for (const p of texPaths) {
        jobs.push(assets.loadTexture(p).then((r) => { textures.set(p, r.handle); }).catch(() => {}));
    }
    for (const p of Object.values(FONTS)) {
        jobs.push(assets.loadFont(p).then((r) => { fonts.set(p, r.handle); }).catch(() => {}));
    }
    void Promise.all(jobs).then(() => { ready = true; });
}
