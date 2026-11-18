import { AVAILABLE_CREW, DEFAULT_CREW, SKILL_TREE_UPGRADES, type MainLoopResult, type SkillUpgradeDef } from '../contracts/gameContract';
import { LAUNCH_CREW_SIZE } from './missions';

export const VETERAN_SOLS = 25;

export interface PlaytestProfile {
    crewIds: string[];
    upgradeIds: string[];
    researchPoints: number;
    awardedRuns: string[];
    crewSols: Record<string, number>;
    missionStars: Record<string, number>;
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

function numberMap(value: unknown): Record<string, number> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const out: Record<string, number> = {};
    for (const [k, v] of Object.entries(value)) {
        if (typeof v === 'number' && Number.isFinite(v) && v >= 0) out[k] = Math.floor(v);
    }
    return out;
}

export function isVeteran(profile: PlaytestProfile, crewId: string): boolean {
    return (profile.crewSols[crewId] ?? 0) >= VETERAN_SOLS;
}

export function crewUnlockProblem(profile: PlaytestProfile, crewId: string): string | null {
    if (crewId === 'crew_jemison') {
        return Object.values(profile.missionStars).some(s => s >= 3) ? null : 'Earn 3-Star Mastery on any mission';
    }
    if (crewId === 'crew_whitson') {
        const total = Object.values(profile.crewSols).reduce((a, b) => a + b, 0);
        return total >= 50 ? null : `Log 50 total Sols across runs (${total}/50)`;
    }
    if (crewId === 'crew_aldrin') {
        return (profile.missionStars['goal_moon_shadow_ice'] ?? 0) >= 1 ? null : 'Complete Shadow Ice (Cabeus Crater)';
    }
    return null;
}

export function loadProfile(stored: unknown, legacySkills: unknown, preferReducedMotion: boolean): PlaytestProfile {
    const saved = (stored && typeof stored === 'object' ? stored : {}) as Partial<PlaytestProfile>;
    const researchPoints = Number.isSafeInteger(saved.researchPoints) && saved.researchPoints! >= 0 ? saved.researchPoints! : 3;
    const crewSols = numberMap(saved.crewSols);
    const missionStars = numberMap(saved.missionStars);
    const baseProfile: PlaytestProfile = {
        crewIds: [],
        upgradeIds: strings([...strings(saved.upgradeIds), ...strings(legacySkills)]).filter(id => UPGRADE_IDS.has(id)),
        researchPoints,
        awardedRuns: strings(saved.awardedRuns),
        crewSols,
        missionStars,
        reducedMotion: typeof saved.reducedMotion === 'boolean' ? saved.reducedMotion : preferReducedMotion,
        highContrast: saved.highContrast === true,
        // `sound` was the toggle's name in an earlier build; honour it if a save still has it.
        soundEnabled: saved.soundEnabled !== false && (saved as { sound?: unknown }).sound !== false,
        masterVolume: clampUnit(saved.masterVolume, 0.53),
        musicVolume: clampUnit(saved.musicVolume, 0.18),
        sfxVolume: clampUnit(saved.sfxVolume, 0.34),
        vibration: saved.vibration !== false,
    };
    const savedCrew = strings(saved.crewIds).filter(id => CREW_IDS.has(id) && !crewUnlockProblem(baseProfile, id));
    baseProfile.crewIds = Array.isArray(saved.crewIds) ? savedCrew.slice(0, LAUNCH_CREW_SIZE) : DEFAULT_CREW.map(member => member.id);
    return baseProfile;
}

export function purchaseProblem(profile: PlaytestProfile, node: SkillUpgradeDef): string | null {
    if (profile.upgradeIds.includes(node.id)) return 'Already owned';
    const ownedPrereqs = node.prerequisites.filter(id => profile.upgradeIds.includes(id)).length;
    const needed = node.requiredCount ?? node.prerequisites.length;
    if (ownedPrereqs < needed) {
        return node.requiredCount ? `Unlock any ${needed} required nodes first` : 'Unlock the required nodes first';
    }
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

const TRAINING_CLEAR = 'tharsis-training-first-clear';

export interface RunMeta {
    missionId?: string;
    crewIds?: readonly string[];
    targetSol?: number;
}

export function recordResearch(
    profile: PlaytestProfile,
    runId: string,
    result: MainLoopResult,
    training: boolean,
    meta?: RunMeta,
): PlaytestProfile {
    let next = profile;
    if (!training) {
        const crewSols = { ...next.crewSols };
        for (const id of meta?.crewIds ?? []) {
            crewSols[id] = (crewSols[id] ?? 0) + Math.max(1, result.solReached);
        }
        const missionStars = { ...next.missionStars };
        let starBonus = 0;
        if (result.outcome === 'victory' && meta?.missionId) {
            const early = (meta.targetSol ?? result.targetSol) - result.solReached >= 3;
            const stars = early ? 3 : 2;
            const prev = missionStars[meta.missionId] ?? 0;
            if (stars > prev) {
                starBonus = (stars - prev) * 2;
                missionStars[meta.missionId] = stars;
                result.researchPointsEarned += starBonus;
            }
        }
        next = { ...next, crewSols, missionStars };
        return awardResearch(next, runId, result.researchPointsEarned);
    }
    if (result.outcome !== 'victory' || profile.awardedRuns.includes(TRAINING_CLEAR)) {
        result.researchPointsEarned = 0;
        return profile;
    }
    return awardResearch(profile, TRAINING_CLEAR, result.researchPointsEarned);
}
