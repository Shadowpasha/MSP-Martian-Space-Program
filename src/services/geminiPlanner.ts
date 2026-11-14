import { CREW_ROLES } from '../contracts/gameContract';
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

const GEMINI_ROUTE = '/api/gemini-plan';
let geminiModel: string | null = null;

export function getGeminiStatusLabel(): string {
    return geminiModel ? 'A.R.I.E.S. connected' : 'A.R.I.E.S. unavailable';
}

export function assistantIsAvailable(): boolean { return geminiModel !== null; }

function isLocalPlaytest(): boolean {
    return typeof location !== 'undefined' && location.protocol === 'http:' &&
        (location.hostname === '127.0.0.1' || location.hostname === 'localhost');
}

export async function checkGeminiConnection(): Promise<void> {
    if (!isLocalPlaytest()) return;
    try {
        const response = await fetch(GEMINI_ROUTE, { cache: 'no-store', signal: AbortSignal.timeout(2_000) });
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
            const status: { model?: string | null } = await response.json();
            geminiModel = status.model ?? null;
            return;
        }
    } catch {
        // A static export can still use the local task planner.
    }
    geminiModel = null;
}

export async function requestGemini(systemInstruction: string, input: string, options: {
    kind?: 'discussion' | 'briefing';
    timeout?: number;
    signal?: AbortSignal;
} = {}): Promise<{ text: string } | { error: string }> {
    if (!geminiModel) await checkGeminiConnection();
    if (!geminiModel) return { error: 'Gemini is unavailable.' };
    try {
        const timeout = AbortSignal.timeout(options.timeout ?? 20_000);
        const response = await fetch(GEMINI_ROUTE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: options.signal ? AbortSignal.any([timeout, options.signal]) : timeout,
            body: JSON.stringify({ systemInstruction, input, ...(options.kind && { kind: options.kind }) }),
        });
        if (!response.headers.get('content-type')?.includes('application/json')) {
            geminiModel = null;
            return { error: 'Local Gemini server is unavailable.' };
        }
        const result: { text?: string; error?: string } = await response.json();
        if (!response.ok || typeof result.text !== 'string' || !result.text.trim()) {
            geminiModel = null;
            return { error: result.error || 'Gemini returned an empty response.' };
        }
        return { text: result.text };
    } catch (error) {
        if (!options.signal?.aborted) geminiModel = null;
        return { error: error instanceof Error && error.name === 'TimeoutError'
            ? 'Gemini request timed out.' : 'Could not reach the local Gemini server.' };
    }
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
    fallbackReason?: string;
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
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.round(n))) : min;
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
    const recognized = CREW_ROLES.find(role => role === s);
    if (recognized) return recognized;
    if (cat === 'BIO') return 'botanist';
    if (cat === 'NAV' || cat === 'GOAL') return 'pilot';
    if (cat === 'MED') return 'medic';
    if (cat === 'SCI') return 'scientist';
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
        `Return strict JSON with keys: replyText, task: { title, description, category (ENG|BIO|NAV|MED|SCI|GOAL), durationSols, upfrontCost, dailyCost, rewardOnComplete: { resources, radiationDelta, moraleDelta, goalFlag }, recommendedRole (${CREW_ROLES.join('|')}), riskNote, requirementKind, requirementUnits }.`,
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

function useOfflinePlanner(userPlan: string, ctx: PlannerContextSnapshot, fallbackReason?: string): AiPlannerResponse {
    return { ...evaluatePlanOffline(userPlan, ctx), fallbackReason };
}

export async function generateTaskWithGemini(
    userPlan: string,
    ctx: PlannerContextSnapshot,
): Promise<AiPlannerResponse> {
    const result = await requestGemini(buildSystemPrompt(ctx), `Player Action Plan: ${JSON.stringify(userPlan)}`);
    if ('error' in result) return useOfflinePlanner(userPlan, ctx, result.error);

    try {
        const parsed = JSON.parse(extractJsonPayload(result.text)) as {
            replyText?: string;
            task?: Record<string, unknown>;
        };
        const t = parsed?.task;
        if (!t || typeof t.title !== 'string' || !t.title.trim()) {
            return useOfflinePlanner(userPlan, ctx, 'Gemini returned an invalid task proposal.');
        }
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
            replyText: String(parsed.replyText || 'Review the procedure and choose a crew lead.').slice(0, 320),
            task,
        };
    } catch {
        return useOfflinePlanner(userPlan, ctx, 'Gemini returned an invalid task proposal.');
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
    const moon = ctx.planet === 'moon';

    if (/(prep.*sensor|calibrate.*sensor|weather sensor|drill sensor|mast sensor|setup sensor)/.test(q)) {
        return {
            source: 'offline-fallback',
            replyText: 'A.R.I.E.S. [Local Sim]: Sensor calibration takes 1 Sol. Assign an Engineer for faster, cheaper work.',
            task: {
                title: moon ? 'Prep Drill Sensor' : 'Prep Weather Sensor',
                description: `Calibrate field instruments for ${ctx.goal.coords}.`,
                category: 'ENG',
                durationSols: 1,
                upfrontCost: {},
                dailyCost: { energy: scaleCost(3), res: scaleCost(1) },
                rewardOnComplete: {
                    resources: { res: 4 },
                    moraleDelta: 2,
                },
                recommendedRole: 'engineer',
                riskNote: 'Adds one Sensor preparation unit.',
                requirementKind: 'prep_sensor',
                requirementUnits: 1,
            },
        };
    }

    if (/(prep.*rover|check rover|service rover|fix rover|tune rover|stage rover)/.test(q)) {
        return {
            source: 'offline-fallback',
            replyText: 'A.R.I.E.S. [Local Sim]: Inspect the rover in 1 Sol. A Pilot reduces the daily cost.',
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
                riskNote: 'Adds one Rover preparation unit.',
                requirementKind: 'prep_rover',
                requirementUnits: 1,
            },
        };
    }

    if (/(prep.*suppl|supply|supplies|pack.*ration|stage.*food|prep.*food|prep.*o2|prep.*oxy)/.test(q)) {
        return {
            source: 'offline-fallback',
            replyText: 'A.R.I.E.S. [Local Sim]: Pack food, water and O₂ in 1 Sol for +2 Prep Supplies. A Botanist boosts the yield.',
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
        const missionSols = Math.max(1, Math.ceil(ctx.goal.durationHours / 24));
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
                title: ctx.goal.title,
                description: `Operate field instrumentation at ${ctx.goal.coords} for ${ctx.goal.durationHours} hours.`,
                category: 'GOAL',
                durationSols: missionSols,
                upfrontCost: { res: scaleCost(2) },
                dailyCost: { energy: scaleCost(5), oxygen: scaleCost(4), food: scaleCost(1) },
                rewardOnComplete: {
                    resources: { res: 8, water: moon ? 10 : 2 },
                    moraleDelta: 12,
                    goalFlag: ctx.goal.requiredFlag,
                },
                recommendedRole: ctx.crew.some(member => member.role === 'pilot') ? 'pilot' : 'captain',
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
            replyText: 'A.R.I.E.S. [Local Sim]: Extract water in 2 Sols for +2 Prep Supplies. A Scientist improves the yield.',
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
                recommendedRole: 'scientist',
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
