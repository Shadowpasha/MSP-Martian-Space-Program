import type { CargoItemId, ResourcePool } from '../contracts/gameContract';
import { CARGO_BY_ID } from '../data/cargo';
import { formatResource, resourceEntries } from '../data/missions';
import { appendLog, applyResourceDelta, canAffordCost, clamp, resourceChanges, round1, spend } from './stateOps';
import { changeAreaMorale, localArea, stormDay, type Area, type TharsisState } from './tharsis';

interface EffectRule { resource?: keyof ResourcePool; amount?: number; morale?: number; radiation?: number; resetsSurvey?: boolean; }

const EFFECTS = {
    none: {},
    power_loss: { resource: 'energy', amount: -3 },
    water_loss: { resource: 'water', amount: -2 },
    oxygen_loss: { resource: 'oxygen', amount: -2 },
    food_loss: { resource: 'food', amount: -2 },
    materials_loss: { resource: 'res', amount: -1 },
    power_saved: { resource: 'energy', amount: 2 },
    water_recovered: { resource: 'water', amount: 2 },
    oxygen_saved: { resource: 'oxygen', amount: 2 },
    crew_confidence: { morale: 2 },
    crew_stress: { morale: -2 },
    exposure: { radiation: 3 },
    field_reset: { resetsSurvey: true },
} satisfies Record<string, EffectRule>;

const POSITIVE_BANDS: Record<string, readonly (keyof typeof EFFECTS)[]> = {
    'water reclamation': ['water_recovered'],
    'oxygen generator': ['oxygen_saved', 'power_saved'],
    'solar power': ['power_saved'],
    'crew health': [],
    'sampler checkout': ['power_saved'],
    'rover workshop': ['power_saved'],
    'food storage': [],
    'rover power': ['power_saved'],
    'rover oxygen': ['oxygen_saved'],
    'route communications': ['power_saved'],
    'wind instrument': ['power_saved'],
    'field supplies': [],
    'field dosimetry': [],
};

const COMMITMENTS = {
    none: {}, power: { energy: 2 }, water: { water: 2 }, materials: { res: 1 },
} satisfies Record<string, Partial<ResourcePool>>;

const EVENT_CARGO = ['repairKits', 'medkits', 'batteryPacks', 'extraRations', 'waterCanisters', 'oxygenTanks'] as const;
export const allowedEventCargo = (cargo: Partial<Record<CargoItemId, number>>) => EVENT_CARGO.filter(id => (cargo[id] ?? 0) > 0);

export const EVENT_EFFECT_IDS = Object.keys(EFFECTS) as Array<keyof typeof EFFECTS>;
export const EVENT_COMMITMENT_IDS = Object.keys(COMMITMENTS) as Array<keyof typeof COMMITMENTS>;
export const EVENT_SYSTEMS = {
    station: ['water reclamation', 'oxygen generator', 'solar power', 'crew health', 'sampler checkout', 'rover workshop', 'food storage'],
    rover: ['rover power', 'rover oxygen', 'route communications', 'wind instrument', 'field supplies', 'field dosimetry'],
} as const;

export function availableEffectIds(state: TharsisState): Array<keyof typeof EFFECTS> {
    return EVENT_EFFECT_IDS.filter(id => id !== 'field_reset' || state.tharsis.rover?.phase === 'site');
}

interface Effect {
    id: keyof typeof EFFECTS;
    severity: 1 | 2;
}

export interface SurveyChoice {
    action: string;
    detail: string;
    result: string;
    commitment: keyof typeof COMMITMENTS;
    effects: Effect[];
    cargo?: CargoItemId;
}

export interface SurveyBriefing {
    title: string;
    observation: string;
    system: string;
    area: Area;
    source: 'Mission control' | 'Local' | 'Gemini';
    choices: SurveyChoice[];
}

function choice(action: string, detail: string, result: string, id: Effect['id'], commitment: SurveyChoice['commitment'] = 'none', severity: Effect['severity'] = 1): SurveyChoice {
    return { action, detail, result, commitment, effects: [{ id, severity }] };
}

type LocalScenario = Pick<SurveyBriefing, 'title' | 'observation' | 'system' | 'choices'>;

const STATION_EVENTS: readonly LocalScenario[] = [
    {
        title: 'Water quality drift', system: 'water reclamation',
        observation: 'Conductivity rose immediately after the processor changed beds. The backup sample from the clean tank reads normal.',
        choices: [
            choice('Isolate and reprocess', 'Divert the suspect stream back through the processor.', 'The second pass brought the diverted water into spec.', 'water_recovered', 'power'),
            choice('Flush the clean tank', 'Purge stored water and refill the feed line.', 'The clean water went to waste. The suspect stream was still upstream.', 'water_loss', 'water', 2),
            choice('Switch to test samples', 'Keep the outlet closed and watch a second cycle.', 'A second test narrowed the fault while the crew waited for the outlet.', 'crew_stress'),
        ],
    },
    {
        title: 'Solar strings falling out of step', system: 'solar power',
        observation: 'One string drops under load. Its neighboring strings have the same dust coating, and their output stayed steady.',
        choices: [
            choice('Isolate the weak string', 'Transfer the load and check the connector.', 'A high-resistance connector was bypassed before it drained the bus.', 'power_saved'),
            choice('Run full-array cleaning', 'Power the cleaning cycle across all strings.', 'Cleaning burned battery power. The connector fault remained.', 'power_loss', 'power', 2),
        ],
    },
    {
        title: 'Oxygen cell current rises', system: 'oxygen generator',
        observation: 'The cell stack draws more current after its inlet pump starts. The cabin pressure trace holds steady.',
        choices: [
            choice('Inspect the inlet screen', 'Check for restriction upstream of the cell stack.', 'The crew cleared the restriction and restored output.', 'oxygen_saved', 'power'),
            choice('Vent and retest the cabin', 'Run a full cabin pressure check.', 'The cabin was tight. The pressure test used reserve oxygen.', 'oxygen_loss', 'none', 2),
            choice('Hold the stack in standby', 'Use reserve air while checking the pump trace.', 'Standby kept the pump offline while the crew reviewed the trace.', 'none'),
        ],
    },
    {
        title: 'Wind mast readings disagree', system: 'sampler checkout',
        observation: 'The apparent gusts arrive exactly when the ventilation fan switches speed. The outdoor pressure trace stays level.',
        choices: [
            choice('Compare fan-on and fan-off traces', 'Repeat the check with the mast shielded from the vent.', 'The paired traces identified the airflow contamination.', 'crew_confidence'),
            choice('Replace the instrument harness', 'Splice in the spare wiring and rerun the test.', 'The replacement harness read the same gusts. The crew used a spare unnecessarily.', 'materials_loss', 'materials'),
        ],
    },
];

const ROVER_EVENTS: readonly LocalScenario[] = [
    {
        title: 'Rover voltage dip', system: 'rover power',
        observation: 'The bus dips only when the cabin heater and telemetry transmitter start together. The battery holds steady at idle.',
        choices: [
            choice('Stagger the starts', 'Transmit after the heater startup cycle.', 'Separating the loads kept the bus within limits.', 'power_saved'),
            choice('Run the full-load test', 'Repeat both starts together to reproduce the fault.', 'The bus dropped again and drained the reserve.', 'power_loss', 'power'),
        ],
    },
    {
        title: 'Radio echo across the ridge', system: 'route communications',
        observation: 'The call cuts out just beyond a ridge shoulder. The antenna self-test and line voltages both pass.',
        choices: [
            choice('Use the scheduled link window', 'Wait for the line-of-sight relay pass.', 'The link cleared as the relay passed overhead.', 'none'),
            choice('Boost transmitter power', 'Hold the transmitter at full power.', 'The terrain still blocked the signal, and the transmitter drained the battery.', 'power_loss', 'power'),
        ],
    },
    {
        title: 'Cabin pressure reading drops', system: 'rover oxygen',
        observation: 'The digital gauge dips during radio transmissions. The independent mechanical gauge stays level.',
        choices: [
            choice('Check the independent gauge', 'Compare both instruments with the radio off.', 'The mechanical gauge confirmed that cabin pressure was stable.', 'none'),
            choice('Purge the cabin', 'Cycle the cabin air to retest pressure.', 'The gauge interference persisted. The purge used field oxygen.', 'oxygen_loss', 'none', 2),
        ],
    },
    {
        title: 'Canteen condensation', system: 'field supplies',
        observation: 'Droplets are on the outside of a cold water canister. The seal mark still lines up and the fill level is stable.',
        choices: [
            choice('Check the seal mark', 'Dry the canister and compare it to the fill log.', 'Water stopped appearing after the canister warmed up.', 'none'),
            choice('Discard the suspect water', 'Empty the canister before it can contaminate the supply.', 'The seal was sound. Potable water was discarded.', 'water_loss'),
        ],
    },
];

export function authoredBriefing(sol: number, area: Area, seed: number, storm: 'onset' | 'peak' | 'clearing' | null): SurveyBriefing {
    if (sol === 1) return {
        title: 'Tharsis Ridge flight briefing', system: 'mission control', area, source: 'Mission control',
        observation: 'Site A lies beyond the ridge. Prepare the rover, instruments, supplies, and field crew. Return the crew and 48 consecutive hours of data by Sol 16. Seasonal dust risk is elevated. The launch checklist tracks your work orders.',
        choices: [
            choice('Check the maintenance log', 'Review the landing diagnostics before scheduling checks.', 'The readings are consistent with a clean landing.', 'crew_confidence'),
            choice('Repeat the full power test', 'Run the lander’s full-load test one more time.', 'The second test found no new fault and used station power.', 'power_loss', 'power'),
        ],
    };
    if (storm) {
        const title = storm === 'onset' ? 'Regional dust storm' : storm === 'peak' ? 'Storm at peak opacity' : 'Last Sol under dust';
        const observation = area === 'rover'
            ? 'Visibility is restricted and the solar particle alert is active. Unprotected crews must shelter. A hardened rover can operate at higher Power and O₂ cost.'
            : 'Solar output has dropped sharply, filters are working harder, and a solar particle alert is active. Activate shelter operations in Life Support to reduce exposure and power load.';
        return { title, observation, system: 'storm', area, source: 'Mission control', choices: [
            choice('Isolate nonessential circuits', 'Use the low-load storm checklist.', 'The lower electrical load preserved reserve power.', 'power_saved'),
            choice('Run at full output', 'Keep all lights, transmitters, and work circuits live.', 'The extra load drained reserves during the alert.', 'power_loss', 'none', 2),
        ] };
    }
    const deck = area === 'station' ? STATION_EVENTS : ROVER_EVENTS;
    const index = ((seed >>> 0) + sol * 3) % deck.length;
    const scenario = deck[index]!;
    const rotation = ((seed >>> 0) + sol) % scenario.choices.length;
    return { ...scenario, choices: [...scenario.choices.slice(rotation), ...scenario.choices.slice(0, rotation)], area, source: 'Local' };
}

export function nextBriefing(state: TharsisState): SurveyBriefing {
    const day = stormDay(state);
    return authoredBriefing(state.sol, state.tharsis.rover ? 'rover' : 'station', state.tharsis.seed,
        day === 1 ? 'onset' : day === 2 ? 'peak' : day === 3 ? 'clearing' : null);
}

export function commitmentLabel(choice: SurveyChoice): string {
    return [...resourceEntries(COMMITMENTS[choice.commitment]).map(([key, amount]) => formatResource(key, amount)),
        ...(choice.cargo ? [CARGO_BY_ID[choice.cargo].name] : [])].join(' · ');
}

export function choiceBlock(state: TharsisState, choice: SurveyChoice): string | null {
    const local = localArea(state, state.tharsis.briefing.area);
    if (!local) return 'This location is no longer available.';
    if (!canAffordCost(local.resources, COMMITMENTS[choice.commitment])) return `Needs ${commitmentLabel(choice)}`;
    if (choice.cargo && !local.cargo[choice.cargo]) return `Needs ${CARGO_BY_ID[choice.cargo].name}`;
    return null;
}

function fieldText(value: unknown, max: number): string | null {
    if (typeof value !== 'string') return null;
    const text = value.trim().replace(/[\r\n\t]+/g, ' ');
    return text.length > 0 && text.length <= max && !/[<>]/.test(text) ? text : null;
}

export function validateBriefing(value: unknown, state: TharsisState): SurveyBriefing | null {
    if (!value || typeof value !== 'object') return null;
    const area = state.tharsis.briefing.area;
    const local = localArea(state, area);
    if (!local) return null;
    const raw = value as Record<string, unknown>;
    const title = fieldText(raw.title, 52);
    const observation = fieldText(raw.observation, 310);
    const system = typeof raw.system === 'string' && (EVENT_SYSTEMS[area] as readonly string[]).includes(raw.system) ? raw.system : null;
    if (!title || !observation || !system || state.tharsis.recentSystems.slice(-2).includes(system) ||
        !Array.isArray(raw.choices) || raw.choices.length < 2 || raw.choices.length > 3) return null;
    const choices: SurveyChoice[] = [];
    const effectsForArea = availableEffectIds(state);
    for (const candidate of raw.choices as unknown[]) {
        if (!candidate || typeof candidate !== 'object') return null;
        const item = candidate as Record<string, unknown>;
        const action = fieldText(item.action, 48);
        const detail = fieldText(item.detail, 126);
        const result = fieldText(item.result, 150);
        const commitment = EVENT_COMMITMENT_IDS.find(id => id === item.commitment);
        const cargo = allowedEventCargo(local.cargo).find(id => id === item.cargo);
        if (!action || !detail || !result || !commitment || (item.cargo && item.cargo !== 'none' && !cargo) ||
            !Array.isArray(item.effects) || item.effects.length < 1 || item.effects.length > 2) return null;
        const effects: Effect[] = [];
        for (const effect of item.effects as unknown[]) {
            if (!effect || typeof effect !== 'object') return null;
            const { id: requested, severity } = effect as Record<string, unknown>;
            const id = effectsForArea.find(id => id === requested);
            if (!id || (severity !== 1 && severity !== 2) || effects.some(effect => effect.id === id)) return null;
            const rule: EffectRule = EFFECTS[id];
            if ((rule.amount ?? 0) > 0 && !POSITIVE_BANDS[system]?.includes(id)) return null;
            if (rule.resetsSurvey && (severity !== 1 || (system !== 'wind instrument' && system !== 'route communications'))) return null;
            effects.push({ id, severity });
        }
        if (effects.length > 1 && effects.some(({ id }) => id === 'none')) return null;
        if (choices.some(choice => choice.action.toLowerCase() === action.toLowerCase())) return null;
        choices.push({ action, detail, result, commitment, cargo, effects });
    }
    const free = choices.some(choice => choice.commitment === 'none' && !choice.cargo &&
        !choice.effects.some(({ id }) => {
            const effect: EffectRule = EFFECTS[id];
            return (effect.amount ?? 0) < 0 || (effect.radiation ?? 0) > 0 || (effect.morale ?? 0) < 0 || effect.resetsSurvey;
        }));
    const distinct = new Set(choices.map(choice => JSON.stringify([choice.commitment, choice.cargo, [...choice.effects].sort((a, b) => a.id.localeCompare(b.id))])));
    return free && distinct.size > 1 ? { title, observation, system, area, source: 'Gemini', choices } : null;
}

export function allowedPositiveEffects(system: string): readonly string[] {
    return POSITIVE_BANDS[system] ?? [];
}

export function resolveBriefing(state: TharsisState, index: number): string | null {
    const run = state.tharsis;
    const choice = run.briefing.choices[index];
    if (run.phase !== 'briefing' || !choice) return 'No briefing choice is pending.';
    const blocker = choiceBlock(state, choice);
    if (blocker) return blocker;
    const { resources, conditions, cargo, crew } = localArea(state, run.briefing.area)!;
    const before = { ...resources };
    const moraleBefore = conditions.morale;
    const radiationBefore = conditions.radiation;
    spend(resources, COMMITMENTS[choice.commitment]);
    if (choice.cargo) cargo[choice.cargo]--;
    for (const effect of choice.effects) {
        const change: EffectRule = EFFECTS[effect.id];
        if (change.resource && change.amount) applyResourceDelta(resources, { [change.resource]: change.amount * effect.severity });
        if (change.morale) changeAreaMorale(crew, conditions, change.morale * effect.severity * (change.morale < 0 ? state.skillModifiers.moraleDecayMult : 1));
        if (change.radiation) conditions.radiation = clamp(round1(conditions.radiation + change.radiation * effect.severity * (1 - state.skillModifiers.radiationShielding)), 0, 100);
        if (change.resetsSurvey && run.rover?.phase === 'site') run.rover.interrupted = true;
    }
    const measured = resourceChanges(before, resources, run.briefing.area === 'rover');
    const morale = round1(conditions.morale - moraleBefore);
    const dose = round1(conditions.radiation - radiationBefore);
    const signed = (delta: number) => `${delta > 0 ? '+' : ''}${delta}`;
    const changes = [measured, morale ? `${signed(morale)} Morale` : '', dose ? `${signed(dose)} mSv` : '', choice.cargo ? `Used ${CARGO_BY_ID[choice.cargo].name}` : '',
        run.rover?.interrupted ? 'Field collection unavailable this Sol' : ''].filter(Boolean);
    run.outcome = [choice.result, changes.join(' · ') || 'No measured change in supplies or conditions.'];
    run.phase = 'outcome';
    run.briefingCommitted = true;
    state.lastEventTitle = run.briefing.title;
    state.lastEventChoiceLabel = choice.action;
    state.lastEventOutcome = run.outcome.join(' ');
    appendLog(state, 'event', `${run.briefing.title} · ${state.lastEventOutcome}`);
    return null;
}
