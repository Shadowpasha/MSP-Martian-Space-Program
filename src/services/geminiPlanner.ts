import { GoogleGenAI } from '@google/genai';
import type {
    CargoInventory,
    ConditionState,
    CrewMember,
    CrewRole,
    MissionGoal,
    MissionRequirementKind,
    PlanetId,
    ResourcePool,
    SkillTreeModifiers,
    TaskCategory,
} from '../contracts/gameContract';
import {
    pickDailyEvent,
    type DailyEventDef,
    type EventChoice,
    type MissionProgressDelta,
} from '../data/events';

/**
 * Optional in-code override; leave empty and set GEMINI_API_KEY in the project's `.env` file instead.
 * When no key is found, the planner uses the built-in deterministic offline task simulator.
 */
export const GEMINI_API_KEY = '';

export const DEFAULT_GEMINI_MODEL = 'gemini-3-flash-preview';
const GEMINI_TIMEOUT_MS = 18000;

export interface GeminiConfig {
    apiKey: string;
    model: string;
    endpointOverride?: string;
}

let cachedEnvApiKey: string | null = null;
let envFetchPromise: Promise<string> | null = null;

function stripQuotes(raw: string): string {
    const trimmed = raw.trim();
    if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
        return trimmed.slice(1, -1).trim();
    }
    return trimmed;
}

export function parseDotEnvApiKey(envText: string): string {
    let fallbackViteKey = '';
    for (const rawLine of envText.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const clean = line.startsWith('export ') ? line.slice(7).trim() : line;
        const eqIdx = clean.indexOf('=');
        if (eqIdx <= 0) continue;
        const key = clean.slice(0, eqIdx).trim();
        const value = stripQuotes(clean.slice(eqIdx + 1));
        if (!value) continue;
        if (key === 'GEMINI_API_KEY') return value;
        if (key === 'VITE_GEMINI_API_KEY' && !fallbackViteKey) fallbackViteKey = value;
    }
    return fallbackViteKey;
}

function readSyncEnvApiKey(): string {
    if (GEMINI_API_KEY.trim()) return GEMINI_API_KEY.trim();
    if (cachedEnvApiKey) return cachedEnvApiKey;

    const procEnv = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process?.env;
    const nodeKey = procEnv?.GEMINI_API_KEY?.trim() || procEnv?.VITE_GEMINI_API_KEY?.trim() || '';
    if (nodeKey) {
        cachedEnvApiKey = nodeKey;
        return nodeKey;
    }

    const metaEnv = (import.meta as { env?: Record<string, string | undefined> }).env;
    const bundleKey = metaEnv?.GEMINI_API_KEY?.trim() || metaEnv?.VITE_GEMINI_API_KEY?.trim() || '';
    if (bundleKey) {
        cachedEnvApiKey = bundleKey;
        return bundleKey;
    }

    return '';
}

export async function resolveGeminiApiKey(explicitKey?: string): Promise<string> {
    if (explicitKey?.trim()) return explicitKey.trim();

    const syncKey = readSyncEnvApiKey();
    if (syncKey) return syncKey;

    if (envFetchPromise) return envFetchPromise;
    if (typeof window === 'undefined' || typeof fetch !== 'function') return '';

    envFetchPromise = (async () => {
        for (const url of ['./.env', '/.env']) {
            const ac = new AbortController();
            const timer = setTimeout(() => ac.abort(), 1500);
            try {
                const res = await fetch(url, { cache: 'no-store', signal: ac.signal });
                const contentType = res.headers.get('content-type') ?? '';
                if (!res.ok || contentType.includes('text/html')) continue;
                const parsed = parseDotEnvApiKey(await res.text());
                if (parsed) {
                    cachedEnvApiKey = parsed;
                    return parsed;
                }
            } catch {
                // `.env` unavailable over HTTP; keep checking or fall back cleanly.
            } finally {
                clearTimeout(timer);
            }
        }
        return '';
    })();

    return envFetchPromise;
}

export async function preloadGeminiKey(): Promise<boolean> {
    return (await resolveGeminiApiKey()).length > 0;
}

export function getGeminiStatusLabel(): string {
    return readSyncEnvApiKey()
        ? `A.R.I.E.S. AI Online (${DEFAULT_GEMINI_MODEL})`
        : 'A.R.I.E.S. Simulator Active (.env key optional)';
}

export function getActiveGeminiConfig(): GeminiConfig {
    return {
        apiKey: readSyncEnvApiKey(),
        model: DEFAULT_GEMINI_MODEL,
    };
}

export interface ProposedTaskSpec {
    title: string;
    description: string;
    category: TaskCategory;
    durationSols: number;
    upfrontCost: Partial<ResourcePool>;
    dailyCost: Partial<ResourcePool>;
    rewardOnComplete: {
        resources?: Partial<ResourcePool>;
        radiationDelta?: number;
        moraleDelta?: number;
        goalFlag?: 'wind_sample_collected' | 'ice_core_collected';
    };
    recommendedRole: CrewRole;
    riskNote: string;
    requirementKind?: Exclude<MissionRequirementKind, 'assign_crew'>;
    requirementUnits?: number;
}

export interface AiPlannerResponse {
    source: 'gemini' | 'offline-fallback';
    replyText: string;
    task: ProposedTaskSpec;
}

export interface PlannerContextSnapshot {
    planet: PlanetId;
    sol: number;
    targetSol: number;
    resources: ResourcePool;
    conditions: ConditionState;
    cargo: CargoInventory;
    crew: CrewMember[];
    goal: MissionGoal;
    skillModifiers: SkillTreeModifiers;
}

function clamp(n: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, Math.round(n)));
}

function sanitizePartialPool(
    raw: Partial<Record<keyof ResourcePool, unknown>> | undefined,
    maxPerField: number,
    discountMult: number,
    applyDiscount: boolean,
): Partial<ResourcePool> {
    const out: Partial<ResourcePool> = {};
    if (!raw || typeof raw !== 'object') return out;
    const keys: (keyof ResourcePool)[] = ['energy', 'food', 'water', 'oxygen', 'res'];
    for (const k of keys) {
        const v = Number(raw[k]);
        if (!Number.isFinite(v) || v <= 0) continue;
        const scaled = applyDiscount ? v * discountMult : v;
        out[k] = clamp(scaled, 1, maxPerField);
    }
    return out;
}

function normalizeCategory(raw: unknown): TaskCategory {
    const s = String(raw ?? '').toUpperCase();
    if (s === 'ENG' || s === 'BIO' || s === 'NAV' || s === 'MED' || s === 'SCI' || s === 'GOAL') {
        return s;
    }
    return 'ENG';
}

function normalizeRole(raw: unknown, cat: TaskCategory): CrewRole {
    const s = String(raw ?? '').toLowerCase();
    if (s === 'engineer' || s === 'botanist' || s === 'pilot' || s === 'medic') return s;
    if (cat === 'BIO') return 'botanist';
    if (cat === 'NAV' || cat === 'GOAL') return 'pilot';
    if (cat === 'MED') return 'medic';
    return 'engineer';
}

function buildSystemPrompt(ctx: PlannerContextSnapshot): string {
    const reqSummary = ctx.goal.requirements
        .map((r) => `${r.current}/${r.target} ${r.label} (${r.kind})`)
        .join('; ');
    return [
        'You are A.R.I.E.S., a friendly robot helper for kids aged 8-14 playing a Mars/Moon outpost game.',
        'Turn the player action plan into ONE fun, clear task with Sol duration and daily resource costs.',
        `Planet: ${ctx.planet.toUpperCase()} | Sol ${ctx.sol}/${ctx.targetSol} | Weather: ${ctx.conditions.weather} (${ctx.conditions.temperatureC}C) | Radiation: ${ctx.conditions.radiation} | Morale: ${ctx.conditions.morale}`,
        `Resources: Energy=${Math.round(ctx.resources.energy)}, Food=${Math.round(ctx.resources.food)}, Water=${Math.round(ctx.resources.water)}, Oxygen=${Math.round(ctx.resources.oxygen)}, Res=${Math.round(ctx.resources.res)}`,
        `Mission Goal: "${ctx.goal.title}" (${ctx.goal.durationHours}h, Coords=${ctx.goal.coords}, Due Sol ${ctx.goal.deadlineSol}, Completed=${ctx.goal.completed}, flag="${ctx.goal.requiredFlag}")`,
        `Mission Requirements: ${reqSummary}`,
        `Crew Roles: ${ctx.crew.map((c) => `${c.name} (${c.role}, perk=${c.perk.bonusCategory})`).join('; ')}`,
        'Rules:',
        '- Keep all text short and kid-friendly! replyText: 1-2 short upbeat sentences (max 24 words). title: 2-4 words. description: max 12 words. riskNote: max 8 words.',
        '- durationSols must be an integer between 1 and 4 (e.g. 48h mission = 2 Sols).',
        '- dailyCost fields (energy, food, water, oxygen, res) must be small realistic numbers (0..8 per Sol; tough EVA jobs cost extra food/oxygen/energy).',
        '- rewardOnComplete.resources values should be balanced (4..24) relative to duration and cost.',
        '- Set goalFlag ONLY when the player plan directly executes the primary mission objective.',
        '- Optional requirementKind (prep_sensor|prep_rover|prep_supplies) and requirementUnits (1..4) if this task preps a mission requirement.',
        'Return strict JSON with keys: replyText, task: { title, description, category (ENG|BIO|NAV|MED|SCI|GOAL), durationSols, upfrontCost, dailyCost, rewardOnComplete: { resources, radiationDelta, moraleDelta, goalFlag }, recommendedRole (engineer|botanist|pilot|medic), riskNote, requirementKind, requirementUnits }.',
    ].join('\n');
}

function extractJsonPayload(rawText: string): string {
    const trimmed = rawText.trim();
    const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const body = fenced?.[1]?.trim() ?? trimmed;
    const start = body.indexOf('{');
    const end = body.lastIndexOf('}');
    if (start !== -1 && end > start) {
        return body.slice(start, end + 1);
    }
    return body;
}

function readInteractionText(interaction: {
    output_text?: string;
    outputs?: Array<{ type?: string; text?: string }>;
}): string | undefined {
    if (interaction.output_text?.trim()) {
        return interaction.output_text.trim();
    }
    if (Array.isArray(interaction.outputs)) {
        const joined = interaction.outputs
            .filter((o) => o && typeof o.text === 'string')
            .map((o) => o.text ?? '')
            .join('')
            .trim();
        if (joined) return joined;
    }
    return undefined;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        return await Promise.race([
            promise,
            new Promise<T>((_, reject) => {
                timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
            }),
        ]);
    } finally {
        if (timer !== undefined) clearTimeout(timer);
    }
}

export interface DailyEventContextSnapshot {
    planet: PlanetId;
    sol: number;
    targetSol: number;
    resources: ResourcePool;
    conditions: ConditionState;
    cargo: CargoInventory;
    crew: CrewMember[];
    goal: MissionGoal;
    usedEventIds: readonly string[];
    usedEventTitles: readonly string[];
}

export interface DailyEventGenerationResult {
    source: 'gemini' | 'fallback';
    event: DailyEventDef;
}

const ALLOWED_EVENT_CARGO: ReadonlyArray<Exclude<keyof CargoInventory, 'windSampler'>> = [
    'repairKits',
    'medkits',
    'batteryPacks',
    'seedPods',
    'extraRations',
];

function sanitizeSignedDelta(
    raw: Partial<Record<keyof ResourcePool, unknown>> | undefined,
): Partial<ResourcePool> | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const out: Partial<ResourcePool> = {};
    const keys: (keyof ResourcePool)[] = ['energy', 'food', 'water', 'oxygen', 'res'];
    for (const k of keys) {
        const v = Number(raw[k]);
        if (!Number.isFinite(v) || Math.round(v) === 0) continue;
        out[k] = clamp(v, -12, 18);
    }
    return Object.keys(out).length > 0 ? out : undefined;
}

function sanitizeRequirementDelta(
    raw: Partial<Record<keyof MissionProgressDelta, unknown>> | undefined,
): MissionProgressDelta | undefined {
    if (!raw || typeof raw !== 'object') return undefined;
    const out: MissionProgressDelta = {};
    const keys: (keyof MissionProgressDelta)[] = ['prep_sensor', 'prep_rover', 'prep_supplies'];
    for (const k of keys) {
        const v = Number(raw[k]);
        if (!Number.isFinite(v) || Math.round(v) === 0) continue;
        out[k] = k === 'prep_supplies' ? clamp(v, -2, 2) : clamp(v, -1, 1);
    }
    return Object.keys(out).length > 0 ? out : undefined;
}

function buildChoiceSummary(
    res: Partial<ResourcePool> | undefined,
    rad: number,
    mor: number,
    req: MissionProgressDelta | undefined,
): string {
    const parts: string[] = [];
    if (req?.prep_sensor) parts.push(`${req.prep_sensor > 0 ? '+' : ''}${req.prep_sensor} Prep Sensor`);
    if (req?.prep_rover) parts.push(`${req.prep_rover > 0 ? '+' : ''}${req.prep_rover} Prep Rover`);
    if (req?.prep_supplies) parts.push(`${req.prep_supplies > 0 ? '+' : ''}${req.prep_supplies} Prep Supplies`);
    if (res?.energy) parts.push(`${res.energy > 0 ? '+' : ''}${res.energy} Power`);
    if (res?.food) parts.push(`${res.food > 0 ? '+' : ''}${res.food} Food`);
    if (res?.water) parts.push(`${res.water > 0 ? '+' : ''}${res.water} Water`);
    if (res?.oxygen) parts.push(`${res.oxygen > 0 ? '+' : ''}${res.oxygen} O2`);
    if (res?.res) parts.push(`${res.res > 0 ? '+' : ''}${res.res} Res`);
    if (rad) parts.push(`${rad > 0 ? '+' : ''}${rad} Radiation`);
    if (mor) parts.push(`${mor > 0 ? '+' : ''}${mor} Morale`);
    return parts.length > 0 ? parts.join(', ') : 'Safe check';
}

export function parseDailyEventJson(
    rawText: string,
    sol: number,
    aliveRoles: ReadonlySet<CrewRole>,
): DailyEventDef | null {
    const parsed = JSON.parse(extractJsonPayload(rawText)) as Record<string, unknown>;
    const rawChoices = Array.isArray(parsed.choices) ? parsed.choices : [];
    const choices: EventChoice[] = [];

    for (let i = 0; i < Math.min(3, rawChoices.length); i++) {
        const rc = rawChoices[i] as Record<string, unknown> | undefined;
        if (!rc || typeof rc !== 'object') continue;
        const label = String(rc.label ?? '').trim().slice(0, 44);
        const outcomeText = String(rc.outcomeText ?? '').trim().slice(0, 120);
        if (!label || !outcomeText) continue;

        const reqCargoRaw = String(rc.requiresCargo ?? '').trim() as Exclude<keyof CargoInventory, 'windSampler'>;
        const requiresCargo = ALLOWED_EVENT_CARGO.includes(reqCargoRaw) ? reqCargoRaw : undefined;
        const reqRoleRaw = String(rc.requiresRole ?? '').trim().toLowerCase() as CrewRole;
        const requiresRole = aliveRoles.has(reqRoleRaw) ? reqRoleRaw : undefined;

        const resourceDelta = sanitizeSignedDelta(rc.resourceDelta as Partial<Record<keyof ResourcePool, unknown>>);
        const requirementDelta = sanitizeRequirementDelta(
            rc.requirementDelta as Partial<Record<keyof MissionProgressDelta, unknown>>,
        );
        const radRaw = Number(rc.radiationDelta ?? 0);
        const radiationDelta = Number.isFinite(radRaw) && Math.round(radRaw) !== 0 ? clamp(radRaw, -12, 16) : undefined;
        const morRaw = Number(rc.moraleDelta ?? 0);
        const moraleDelta = Number.isFinite(morRaw) && Math.round(morRaw) !== 0 ? clamp(morRaw, -10, 14) : undefined;
        const summaryRaw = String(rc.summary ?? '').trim().slice(0, 56);

        choices.push({
            id: `ai_ev_${sol}_c${i + 1}`,
            label,
            summary: summaryRaw || buildChoiceSummary(resourceDelta, radiationDelta ?? 0, moraleDelta ?? 0, requirementDelta),
            requiresCargo,
            requiresRole,
            consumesCargo: requiresCargo ? { [requiresCargo]: 1 } : undefined,
            resourceDelta,
            radiationDelta,
            moraleDelta,
            requirementDelta,
            outcomeText,
        });
    }

    if (choices.length < 2) return null;

    // Guarantee at least one fallback choice with no cargo or crew prerequisite so kids never get softlocked.
    if (choices.every((c) => Boolean(c.requiresCargo || c.requiresRole))) {
        const last = choices[choices.length - 1]!;
        last.requiresCargo = undefined;
        last.consumesCargo = undefined;
        last.requiresRole = undefined;
    }

    const title = String(parsed.title ?? '').trim().slice(0, 36);
    const prompt = String(parsed.prompt ?? '').trim().slice(0, 160);
    if (!title || !prompt) return null;

    const badgeRaw = String(parsed.badge ?? 'MARS ALERT').trim().toUpperCase().slice(0, 14);
    const factRaw = String(parsed.scienceFact ?? '').trim().slice(0, 175);
    const scienceFact = factRaw
        ? factRaw.startsWith('Real NASA Fact:')
            ? factRaw
            : `Real NASA Fact: ${factRaw}`
        : 'Real NASA Fact: Real Mars missions test sensors daily because Martian weather, dust, and radiation shift rapidly.';

    return {
        id: `ai_event_sol_${sol}_${Date.now().toString(36).slice(-4)}`,
        title,
        prompt,
        badge: badgeRaw || 'MARS ALERT',
        scienceFact,
        source: 'gemini',
        choices,
    };
}

function buildDailyEventPrompt(ctx: DailyEventContextSnapshot): string {
    const aliveCrew = ctx.crew.filter((c) => c.health > 0);
    const cargoSummary = ALLOWED_EVENT_CARGO.map((k) => `${k}=${ctx.cargo[k]}`).join(', ');
    const reqSummary = ctx.goal.requirements
        .map((r) => `${r.kind}: ${r.current}/${r.target} (${r.label})`)
        .join('; ');
    const recentTitles = ctx.usedEventTitles.slice(-8).join(' | ') || 'None';
    return [
        'You are the Event Director for a fun kids (ages 7-12) NASA Mars survival game.',
        'Invent ONE original, creative morning event inspired by real challenges NASA faces on Mars (or Moon if planet is MOON).',
        'Real NASA Mars ideas: electrostatic clinging dust on airlocks/panels, toxic perchlorate salts in regolith soil, -80C frozen rover wheel joints, MOXIE-style CO2 oxygen maker filter clogs, solar conjunction blocking Earth radio, dust devils damaging outside sensors, radiation bursts without a magnetic field, frost veins under red dirt, meteorite pressure leaks.',
        `Planet: ${ctx.planet.toUpperCase()} | Sol ${ctx.sol}/${ctx.targetSol} | Weather: ${ctx.conditions.weather} (${ctx.conditions.temperatureC}C) | Rad: ${ctx.conditions.radiation} mSv | Morale: ${ctx.conditions.morale}%`,
        `Resources: Energy=${Math.round(ctx.resources.energy)}, Food=${Math.round(ctx.resources.food)}, Water=${Math.round(ctx.resources.water)}, O2=${Math.round(ctx.resources.oxygen)}%, Res=${Math.round(ctx.resources.res)}`,
        `Mission Progress: ${reqSummary}`,
        `Crew alive: ${aliveCrew.map((c) => `${c.name.split(' ')[0]} (${c.role})`).join(', ')}`,
        `Cargo available: ${cargoSummary}`,
        `Do NOT repeat these titles: ${recentTitles}`,
        'Rules:',
        '- Keep all text super fun, short, and easy for a 7-12 year old!',
        '- title: 2-4 catchy words (max 32 chars). badge: 1-2 uppercase words (max 12 chars).',
        '- prompt: 1-2 short sentences (max 140 chars) explaining what just happened this morning.',
        '- scienceFact: Starts with "Real NASA Fact: " and teaches 1 cool true Mars/space science fact (max 155 chars).',
        '- If Mission Progress shows any prepped step (> 0, like prep_sensor 1/1 or prep_rover 1/1), you MAY threaten to break/set it back with requirementDelta (e.g. { "prep_sensor": -1 } on the skip/unsafe choice while crew perk or repair kit saves it or adds +1)! Smart choices can also give +1 progress.',
        '- Provide 2 or 3 choices. Choice 1 can optionally reward an alive crew role (requiresRole: engineer|botanist|pilot|medic) or cargo item (requiresCargo: repairKits|medkits|batteryPacks|seedPods|extraRations). The last choice MUST have NO requiresRole and NO requiresCargo.',
        '- Keep resourceDelta fields between -8 and +15, radiationDelta -10..+14, moraleDelta -8..+12, requirementDelta fields -1..+1. Never kill the crew.',
        'Return raw JSON only: { "title", "badge", "prompt", "scienceFact", "choices": [{ "label", "summary", "requiresCargo?", "requiresRole?", "resourceDelta": { "energy?", "food?", "water?", "oxygen?", "res?" }, "radiationDelta?", "moraleDelta?", "requirementDelta": { "prep_sensor?", "prep_rover?", "prep_supplies?" }, "outcomeText" }] }.',
    ].join('\n');
}

export async function generateDailyEventWithGemini(
    ctx: DailyEventContextSnapshot,
    config: GeminiConfig = getActiveGeminiConfig(),
): Promise<DailyEventGenerationResult> {
    const fallbackEvent = () =>
        pickDailyEvent(ctx.sol, ctx.conditions.weather, new Set(ctx.usedEventIds), ctx.goal.completed);

    const trimmedKey = await resolveGeminiApiKey(config.apiKey);
    if (!trimmedKey && !config.endpointOverride) {
        return { source: 'fallback', event: fallbackEvent() };
    }

    const model = config.model.trim() || DEFAULT_GEMINI_MODEL;
    const aliveRoles = new Set<CrewRole>(ctx.crew.filter((c) => c.health > 0).map((c) => c.role));

    try {
        const ai = new GoogleGenAI({ apiKey: trimmedKey, apiVersion: 'v1beta' });
        const interaction = await withTimeout(
            ai.interactions.create(
                {
                    model,
                    system_instruction: `${buildDailyEventPrompt(ctx)}\nRespond with raw JSON only.`,
                    input: `Generate Sol ${ctx.sol} Mars morning event during ${ctx.conditions.weather}.`,
                    generation_config: {
                        temperature: 0.85,
                    },
                },
                {
                    retries: { strategy: 'none' },
                    timeout_ms: GEMINI_TIMEOUT_MS,
                },
            ),
            GEMINI_TIMEOUT_MS + 1000,
            `Gemini Event (${model})`,
        );

        const rawText = readInteractionText(interaction);
        if (!rawText) return { source: 'fallback', event: fallbackEvent() };

        const parsed = parseDailyEventJson(rawText, ctx.sol, aliveRoles);
        if (!parsed) return { source: 'fallback', event: fallbackEvent() };

        return { source: 'gemini', event: parsed };
    } catch {
        return { source: 'fallback', event: fallbackEvent() };
    }
}

export async function generateTaskWithGemini(
    userPlan: string,
    ctx: PlannerContextSnapshot,
    config: GeminiConfig = getActiveGeminiConfig(),
): Promise<AiPlannerResponse> {
    const trimmedKey = await resolveGeminiApiKey(config.apiKey);
    if (!trimmedKey && !config.endpointOverride) {
        return evaluatePlanOffline(userPlan, ctx);
    }

    const model = config.model.trim() || DEFAULT_GEMINI_MODEL;

    try {
        let rawText: string | undefined;

        if (config.endpointOverride?.trim()) {
            const ac = new AbortController();
            const timer = setTimeout(() => ac.abort(), GEMINI_TIMEOUT_MS);
            try {
                const res = await fetch(config.endpointOverride.trim(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    signal: ac.signal,
                    body: JSON.stringify({
                        contents: [
                            {
                                role: 'user',
                                parts: [
                                    { text: buildSystemPrompt(ctx) },
                                    { text: `Player Action Plan: "${userPlan}"` },
                                ],
                            },
                        ],
                    }),
                });
                if (!res.ok) {
                    const fallback = evaluatePlanOffline(userPlan, ctx);
                    fallback.replyText = `[Gemini HTTP ${res.status} - using local sim] ${fallback.replyText}`;
                    return fallback;
                }
                const json = (await res.json()) as {
                    output_text?: string;
                    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
                };
                rawText = json.output_text ?? json.candidates?.[0]?.content?.parts?.[0]?.text;
            } finally {
                clearTimeout(timer);
            }
        } else {
            const ai = new GoogleGenAI({ apiKey: trimmedKey, apiVersion: 'v1beta' });
            const interaction = await withTimeout(
                ai.interactions.create(
                    {
                        model,
                        system_instruction: `${buildSystemPrompt(ctx)}\nRespond with raw JSON only (no markdown fences).`,
                        input: `Player Action Plan: "${userPlan}"`,
                        generation_config: {
                            temperature: 0.4,
                        },
                    },
                    {
                        retries: { strategy: 'none' },
                        timeout_ms: GEMINI_TIMEOUT_MS,
                    },
                ),
                GEMINI_TIMEOUT_MS + 1000,
                `Gemini (${model})`,
            );
            rawText = readInteractionText(interaction);
        }

        if (!rawText) {
            return evaluatePlanOffline(userPlan, ctx);
        }

        const parsed = JSON.parse(extractJsonPayload(rawText)) as {
            replyText?: string;
            task?: Record<string, unknown>;
        };
        const t = parsed.task ?? {};
        const category = normalizeCategory(t.category);
        const durationSols = clamp(Number(t.durationSols ?? 2), 1, 4);
        const discount = ctx.skillModifiers.aiCostDiscountMult;

        const rewardRaw = (t.rewardOnComplete as Record<string, unknown> | undefined) ?? {};
        const goalFlagRaw = rewardRaw.goalFlag;
        const goalFlag =
            goalFlagRaw === 'wind_sample_collected' || goalFlagRaw === 'ice_core_collected'
                ? goalFlagRaw
                : undefined;

        const reqKindRaw = String(t.requirementKind ?? '');
        const requirementKind =
            reqKindRaw === 'prep_sensor' || reqKindRaw === 'prep_rover' || reqKindRaw === 'prep_supplies'
                ? reqKindRaw
                : undefined;
        const requirementUnits = requirementKind ? clamp(Number(t.requirementUnits ?? 1), 1, 4) : undefined;

        const task: ProposedTaskSpec = {
            title: String(t.title || 'Custom Outpost Operation').slice(0, 46),
            description: String(t.description || userPlan).slice(0, 140),
            category,
            durationSols,
            upfrontCost: sanitizePartialPool(
                t.upfrontCost as Partial<Record<keyof ResourcePool, unknown>>,
                12,
                discount,
                true,
            ),
            dailyCost: sanitizePartialPool(
                t.dailyCost as Partial<Record<keyof ResourcePool, unknown>>,
                8,
                discount,
                true,
            ),
            rewardOnComplete: {
                resources: sanitizePartialPool(
                    rewardRaw.resources as Partial<Record<keyof ResourcePool, unknown>>,
                    26,
                    1,
                    false,
                ),
                radiationDelta: clamp(Number(rewardRaw.radiationDelta ?? 0), -20, 18),
                moraleDelta: clamp(Number(rewardRaw.moraleDelta ?? 2), -10, 16),
                goalFlag,
            },
            recommendedRole: normalizeRole(t.recommendedRole, category),
            riskNote: String(t.riskNote || 'Monitor daily oxygen & power reserves while active.').slice(0, 110),
            requirementKind,
            requirementUnits,
        };

        return {
            source: 'gemini',
            replyText: String(parsed.replyText || 'Task telemetry computed via Gemini. Review costs and assign crew.').slice(0, 320),
            task,
        };
    } catch (err) {
        const fallback = evaluatePlanOffline(userPlan, ctx);
        const reason = err instanceof Error ? err.message.slice(0, 72) : 'request failed';
        fallback.replyText = `[Gemini fallback: ${reason}] ${fallback.replyText}`;
        return fallback;
    }
}

/**
 * Context-aware deterministic planner used automatically when no Gemini API key
 * is entered or when offline. Applies the same Skill Tree discount rules.
 */
export function evaluatePlanOffline(userPlan: string, ctx: PlannerContextSnapshot): AiPlannerResponse {
    const q = userPlan.toLowerCase();
    const disc = ctx.skillModifiers.aiCostDiscountMult;
    const scaleCost = (n: number) => Math.max(1, Math.round(n * disc));
    const stormPenalty = ctx.conditions.weather === 'Dust Storm' ? 1 : 0;

    if (/(prep.*sensor|calibrate.*sensor|weather sensor|drill sensor|mast sensor|setup sensor)/.test(q)) {
        return {
            source: 'offline-fallback',
            replyText: 'A.R.I.E.S. [Local Sim]: Weather sensor calibration takes 1 Sol and satisfies the Sensor requirement (1/1). Elena Vance (Engineer) cuts cost and speeds it up.',
            task: {
                title: 'Prep Weather Sensor',
                description: `Calibrate atmospheric barometer & wind anemometer for ${ctx.goal.coords}.`,
                category: 'ENG',
                durationSols: 1,
                upfrontCost: {},
                dailyCost: { energy: scaleCost(3), res: scaleCost(1) },
                rewardOnComplete: {
                    resources: { res: 4 },
                    moraleDelta: 2,
                },
                recommendedRole: 'engineer',
                riskNote: 'Required (1/1) before final mission completion.',
                requirementKind: 'prep_sensor',
                requirementUnits: 1,
            },
        };
    }

    if (/(prep.*rover|check rover|service rover|fix rover|tune rover|stage rover)/.test(q)) {
        return {
            source: 'offline-fallback',
            replyText: 'A.R.I.E.S. [Local Sim]: Rover pre-drive inspection takes 1 Sol and satisfies the Rover requirement (1/1). Maya Sterling (Pilot) cuts transit drain.',
            task: {
                title: 'Prep Mission Rover',
                description: `Inspect rover suspension, heaters, and navigation guidance for ${ctx.goal.coords}.`,
                category: 'NAV',
                durationSols: 1,
                upfrontCost: {},
                dailyCost: { energy: scaleCost(3), res: scaleCost(1) },
                rewardOnComplete: {
                    resources: { energy: 6 },
                    moraleDelta: 2,
                },
                recommendedRole: 'pilot',
                riskNote: 'Required (1/1) before final mission completion.',
                requirementKind: 'prep_rover',
                requirementUnits: 1,
            },
        };
    }

    if (/(prep.*suppl|supply|supplies|pack.*ration|stage.*food|prep.*food|prep.*o2|prep.*oxy)/.test(q)) {
        return {
            source: 'offline-fallback',
            replyText: 'A.R.I.E.S. [Local Sim]: Packing expedition food, water, and O2 canisters takes 1 Sol (+2 Prep Supplies progress). Kenji Sato boosts supply output.',
            task: {
                title: 'Prep Mission Supplies',
                description: 'Seal field rations, oxygen tanks, and thermal water packs for mission deploy.',
                category: 'BIO',
                durationSols: 1,
                upfrontCost: {},
                dailyCost: { energy: scaleCost(3), water: scaleCost(2) },
                rewardOnComplete: {
                    resources: { food: 6, oxygen: 6 },
                    moraleDelta: 3,
                },
                recommendedRole: 'botanist',
                riskNote: 'Advances Prep Supplies checklist (+2).',
                requirementKind: 'prep_supplies',
                requirementUnits: 2,
            },
        };
    }

    if (/(gather.*weather|weather data|wind|sample|sandstorm|storm sample|ice core|mission|goal|expedition)/.test(q)) {
        const isMars = ctx.planet === 'mars';
        const missionSols = Math.max(1, Math.round(ctx.goal.durationHours / 24));
        const missing = ctx.goal.requirements
            .filter((r) => r.kind !== 'assign_crew' && r.current < r.target)
            .map((r) => `${r.label} (${r.current}/${r.target})`);
        const warnText = missing.length > 0
            ? ` Note: Still missing ${missing.join(', ')} and crew assignment before completion.`
            : ' All prep checks ready! Drag enough crew onto this task to execute.';
        return {
            source: 'offline-fallback',
            replyText: `A.R.I.E.S. [Local Sim]: "${ctx.goal.title}" queued for ${ctx.goal.durationHours}h (${missionSols} Sols) at ${ctx.goal.coords}.${warnText}`,
            task: {
                title: isMars ? 'Gather Weather Data (48h)' : 'Extract Polar Ice Core (24h)',
                description: `Operate field instrumentation at ${ctx.goal.coords} for ${ctx.goal.durationHours} hours.`,
                category: 'GOAL',
                durationSols: missionSols,
                upfrontCost: { res: scaleCost(2) },
                dailyCost: { energy: scaleCost(5), oxygen: scaleCost(4), food: scaleCost(1) },
                rewardOnComplete: {
                    resources: { res: 8, water: isMars ? 2 : 10 },
                    moraleDelta: 12,
                    goalFlag: ctx.goal.requiredFlag,
                },
                recommendedRole: 'pilot',
                riskNote: stormPenalty ? 'Dust Storm active: Pilot strongly recommended.' : 'Requires all Mission Requirements completed.',
            },
        };
    }

    if (/(food|crop|hydro|plant|farm|algae|grow|greenhouse)/.test(q)) {
        return {
            source: 'offline-fallback',
            replyText: 'A.R.I.E.S. [Local Sim]: Cultivating fast-cycle hydroponic greens takes 2 Sols (+2 Prep Supplies progress). Kenji Sato boosts yield by +45%.',
            task: {
                title: 'Expand Hydroponic Crop Cycle',
                description: 'Seed high-yield nutrient trays and increase grow-lamp photoperiod.',
                category: 'BIO',
                durationSols: 2,
                upfrontCost: {},
                dailyCost: { water: scaleCost(3), energy: scaleCost(3) },
                rewardOnComplete: {
                    resources: { food: 18, oxygen: 7 },
                    moraleDelta: 5,
                },
                recommendedRole: 'botanist',
                riskNote: 'Requires steady water flow across both Sols.',
                requirementKind: 'prep_supplies',
                requirementUnits: 2,
            },
        };
    }

    if (/(solar|power|energy|battery|clean|panel|generator)/.test(q)) {
        return {
            source: 'offline-fallback',
            replyText: 'A.R.I.E.S. [Local Sim]: Solar array restoration and MPPT tuning completes in 1 Sol with low EVA drain. Elena Vance reduces tool & power draw.',
            task: {
                title: 'Solar Array Maintenance & Boost',
                description: 'Brush Martian dust from arrays and rebalance inverter capacitors.',
                category: 'ENG',
                durationSols: 1 + stormPenalty,
                upfrontCost: {},
                dailyCost: { water: scaleCost(1), oxygen: scaleCost(2), food: scaleCost(1) },
                rewardOnComplete: {
                    resources: { energy: 24, res: 2 },
                    moraleDelta: 2,
                },
                recommendedRole: 'engineer',
                riskNote: stormPenalty ? 'High winds add +1 Sol EVA caution.' : 'Low risk EVA sweep.',
                requirementKind: 'prep_supplies',
                requirementUnits: 1,
            },
        };
    }

    if (/(water|ice|drill|condenser|recycle|melt)/.test(q)) {
        return {
            source: 'offline-fallback',
            replyText: 'A.R.I.E.S. [Local Sim]: Subsurface ice extraction & distillation requires 2 Sols (+2 Prep Supplies). Assign an Engineer or Botanist for optimal recovery.',
            task: {
                title: 'Permafrost Water Extraction',
                description: 'Run thermal auger outside Airlock A and pump meltwater to cisterns.',
                category: 'SCI',
                durationSols: 2,
                upfrontCost: { energy: scaleCost(3) },
                dailyCost: { energy: scaleCost(4), oxygen: scaleCost(2) },
                rewardOnComplete: {
                    resources: { water: 20, oxygen: 5 },
                    moraleDelta: 3,
                },
                recommendedRole: 'engineer',
                riskNote: 'High heater power draw each Sol.',
                requirementKind: 'prep_supplies',
                requirementUnits: 2,
            },
        };
    }

    if (/(oxygen|o2|air|scrubber|seal|leak|breath)/.test(q)) {
        return {
            source: 'offline-fallback',
            replyText: 'A.R.I.E.S. [Local Sim]: Scrubber overhaul & electrolysis boost takes 1 Sol (+2 Prep Supplies) and trades power + water for breathable oxygen.',
            task: {
                title: 'O2 Scrubber & Electrolysis Boost',
                description: 'Clean zeolite canisters and crack reserve water into breathable oxygen.',
                category: 'ENG',
                durationSols: 1,
                upfrontCost: {},
                dailyCost: { energy: scaleCost(4), water: scaleCost(3) },
                rewardOnComplete: {
                    resources: { oxygen: 22 },
                    moraleDelta: 4,
                },
                recommendedRole: 'engineer',
                riskNote: 'Draws power & water to split H2O into O2.',
                requirementKind: 'prep_supplies',
                requirementUnits: 2,
            },
        };
    }

    if (/(rad|radiation|shield|med|heal|sick|morale|rest|counsel|stress)/.test(q)) {
        return {
            source: 'offline-fallback',
            replyText: 'A.R.I.E.S. [Local Sim]: Shield reinforcement & medical recovery spans 1 Sol with extra rations for crew recovery. Marcus Thorne (Medic) amplifies the healing effect.',
            task: {
                title: 'Medical Recovery & Rad Shielding',
                description: 'Line bunk bulkheads with water bags and run crew wellness triage.',
                category: 'MED',
                durationSols: 1,
                upfrontCost: {},
                dailyCost: { food: scaleCost(2), water: scaleCost(2), energy: scaleCost(2) },
                rewardOnComplete: {
                    radiationDelta: -14,
                    moraleDelta: 14,
                },
                recommendedRole: 'medic',
                riskNote: 'Extra calories needed for tissue recovery.',
            },
        };
    }

    // Default Rover / Res / Sensor Reconnaissance plan
    return {
        source: 'offline-fallback',
        replyText: `A.R.I.E.S. [Local Sim]: Evaluated "${userPlan.slice(0, 48)}". Mapped as a 2-Sol rover & sensor field operation consuming extra food/O2/power for resource salvage.`,
        task: {
            title: userPlan.trim().length > 4 ? userPlan.trim().slice(0, 34) : 'Rover Sensor & Res Recon',
            description: `Field operation: ${userPlan.trim().slice(0, 110) || 'Survey nearby crater for salvageable supplies.'}`,
            category: 'NAV',
            durationSols: 2,
            upfrontCost: {},
            dailyCost: { energy: scaleCost(3), oxygen: scaleCost(3), food: scaleCost(1) },
            rewardOnComplete: {
                resources: { res: 10, energy: 8, water: 4 },
                moraleDelta: 4,
            },
            recommendedRole: 'pilot',
            riskNote: 'Extra EVA rations & O2 drawn each Sol while away.',
        },
    };
}
