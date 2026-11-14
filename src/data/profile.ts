import { AVAILABLE_CREW, DEFAULT_CREW, SKILL_TREE_UPGRADES, type SkillUpgradeDef } from '../contracts/gameContract';
import { LAUNCH_CREW_SIZE } from './missions';

export interface PlaytestProfile {
    crewIds: string[];
    upgradeIds: string[];
    researchPoints: number;
    awardedRuns: string[];
    reducedMotion: boolean;
    highContrast: boolean;
    /** Music and sound effects (the mixer mutes everything when off). */
    soundEnabled: boolean;
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    /** Vibration on devices that support it. */
    vibration: boolean;
}

function clampUnit(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : fallback;
}

const CREW_IDS = new Set(AVAILABLE_CREW.map(member => member.id));
const UPGRADE_IDS = new Set(SKILL_TREE_UPGRADES.map(node => node.id));

function strings(value: unknown): string[] {
    return Array.isArray(value) ? [...new Set(value.filter((entry): entry is string => typeof entry === 'string'))] : [];
}

export function loadProfile(stored: unknown, legacySkills: unknown, preferReducedMotion: boolean): PlaytestProfile {
    const saved = (stored && typeof stored === 'object' ? stored : {}) as Partial<PlaytestProfile>;
    const savedCrew = strings(saved.crewIds).filter(id => CREW_IDS.has(id));
    const researchPoints = Number.isSafeInteger(saved.researchPoints) && saved.researchPoints! >= 0 ? saved.researchPoints! : 3;
    return {
        crewIds: Array.isArray(saved.crewIds) ? savedCrew.slice(0, LAUNCH_CREW_SIZE) : DEFAULT_CREW.map(member => member.id),
        upgradeIds: strings([...strings(saved.upgradeIds), ...strings(legacySkills)]).filter(id => UPGRADE_IDS.has(id)),
        researchPoints,
        awardedRuns: strings(saved.awardedRuns),
        reducedMotion: typeof saved.reducedMotion === 'boolean' ? saved.reducedMotion : preferReducedMotion,
        highContrast: saved.highContrast === true,
        // `sound` was the toggle's name in an earlier build; honour it if a save still has it.
        soundEnabled: saved.soundEnabled !== false && (saved as { sound?: unknown }).sound !== false,
        masterVolume: clampUnit(saved.masterVolume, 0.53),
        musicVolume: clampUnit(saved.musicVolume, 0.18),
        sfxVolume: clampUnit(saved.sfxVolume, 0.34),
        vibration: saved.vibration !== false,
    };
}

export function purchaseProblem(profile: PlaytestProfile, node: SkillUpgradeDef): string | null {
    if (profile.upgradeIds.includes(node.id)) return 'Already owned';
    if (node.prerequisites.some(id => !profile.upgradeIds.includes(id))) return 'Unlock the required nodes first';
    const missing = node.cost - profile.researchPoints;
    return missing > 0 ? `Need ${missing} more research point${missing === 1 ? '' : 's'}` : null;
}

export function purchaseUpgrade(profile: PlaytestProfile, node: SkillUpgradeDef): PlaytestProfile {
    if (purchaseProblem(profile, node)) return profile;
    return { ...profile, researchPoints: profile.researchPoints - node.cost, upgradeIds: [...profile.upgradeIds, node.id] };
}

/** Research points spent on the upgrades this profile owns. */
export function spentResearch(profile: PlaytestProfile): number {
    return SKILL_TREE_UPGRADES.filter(node => profile.upgradeIds.includes(node.id)).reduce((sum, node) => sum + node.cost, 0);
}

/** Sell back every upgrade: all owned upgrades are removed and their full cost is refunded. */
export function resetUpgrades(profile: PlaytestProfile): PlaytestProfile {
    if (profile.upgradeIds.length === 0) return profile;
    return { ...profile, researchPoints: profile.researchPoints + spentResearch(profile), upgradeIds: [] };
}

export function awardResearch(profile: PlaytestProfile, runId: string, earned: number): PlaytestProfile {
    if (profile.awardedRuns.includes(runId) || !Number.isSafeInteger(earned) || earned < 0) return profile;
    return {
        ...profile, researchPoints: profile.researchPoints + earned,
        awardedRuns: [...profile.awardedRuns, runId],
    };
}
