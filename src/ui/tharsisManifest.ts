import { INSTRUMENTS } from '../data/expeditions';
import type { Entity } from 'esengine';
import type { ResourcePool } from '../contracts/gameContract';
import { CARGO_ITEMS } from '../data/cargo';
import type { CargoItemId } from '../contracts/gameContract';
import { RESOURCE_LABELS } from '../data/missions';
import { defaultLoad, dispatchIssues, expeditionFor, dispatchRover, emergencyReturn, loadSlots, localArea, PACK_UNITS, ROVER_SLOTS,
    peakRoverBudget, roverLoadStock, stormReserve, stormWindowKnown, toggleFieldRest, travelerReadiness, tripPlan, useLocalCargo, type Area,
    type RoverLoad, type TharsisState } from '../simulation/tharsis';
import { fieldDutyProblem } from '../simulation/crewAbilities';
import { FIELD_REST_MORALE } from '../simulation/tharsisConditions';
import { missionWorkTarget, resourceOptions, type MissionAction } from '../simulation/missionStatus';
import { chooseFieldCrew } from '../simulation/tharsisWork';
import type { FlightUi } from './flightUi';
import type { RunButton } from './tharsisFlight';

const KEYS: readonly (keyof ResourcePool)[] = ['food', 'water', 'oxygen', 'energy', 'res'];

interface Console {
    state: TharsisState;
    ui: FlightUi;
    content: Entity;
    button: RunButton;
    change: (action: () => string | null) => void;
}

export function showRoverChecklist({ state, ui, content, button, change, draft, reset, dispatch, issuePage, showIssues, openAction }: Console & {
    draft: RoverLoad; reset: () => void; dispatch: () => void;
    issuePage: number | null; showIssues: (page: number | null) => void; openAction: (action: MissionAction) => void;
}): void {
    const p = ui.palette;
    const run = state.tharsis;
    const trip = tripPlan(state);
    const issues = dispatchIssues(state, draft);
    button('rover-issues', content, [774, 12, 232, 42], () => showIssues(issuePage === null ? 0 : null), {
        label: issuePage === null ? `Dispatch requirements (${issues.length})` : 'Back to rover load', labelSize: 14, tone: 'hero',
    });
    ui.label(content, [22, 61, 1116, 27], `${trip.hasPilot ? 'Pilot' : 'Backup driver'} · ${trip.leg} Sol per leg · ${trip.sols} Sol round trip · Latest departure Sol ${trip.latest} · Clean-trip return Sol ${trip.returnSol}`, { size: 15, color: p.cyan });
    if (issuePage !== null) {
        const perPage = 5;
        const last = Math.max(0, Math.ceil(issues.length / perPage) - 1);
        const page = Math.min(issuePage, last);
        if (!issues.length) ui.label(content, [24, 102, 1120, 55], 'Crew, preflight checks, instrument, and clean-trip load are ready.', { size: 19, color: p.good });
        issues.slice(page * perPage, page * perPage + perPage).forEach((issue, index) => {
            const row = ui.frame(content, [22, 102 + index * 89, 1132, 82], p.ink, p.teal);
            ui.label(row, [12, 5, 1108, 33], issue.message, { size: 16, wrap: true, color: p.amber });
            const options = issue.orderId ? [{ label: 'Open required work order', panel: 'work' as const, orderId: missionWorkTarget(state, issue.orderId) }] :
                issue.resource ? resourceOptions(state, 'station', issue.resource) : [];
            button(`fix-load-${index}`, row, [12, 41, 241, 34], () => showIssues(null), { label: 'Review crew and load', labelSize: 14 });
            options.slice(0, 3).forEach((action, i) => button(`fix-issue-${index}-${i}`, row, [266 + i * 278, 41, 266, 34],
                () => openAction(action), { label: action.label, labelSize: 14 }));
        });
        if (last) {
            button('dispatch-prev', content, [22, 557, 142, 40], () => showIssues(page - 1), { label: 'Previous', disabled: page === 0 });
            ui.label(content, [182, 557, 110, 40], `${page + 1} / ${last + 1}`, { size: 15, color: p.secondary });
            button('dispatch-next', content, [305, 557, 142, 40], () => showIssues(page + 1), { label: 'More', disabled: page === last });
        }
        return;
    }
    const pair = ui.frame(content, [20, 102, 1136, 96], p.ink);
    ui.label(pair, [12, 4, 250, 30], `Travelers   ${run.fieldPair.length}/2`, { display: true, size: 23 });
    ui.label(pair, [12, 41, 240, 38], 'Changing crew reopens suit certification.', { size: 13, color: p.secondary, wrap: true });
    state.crew.forEach((member, index) => {
        const selected = run.fieldPair.includes(member.id);
        const readiness = travelerReadiness(state, member);
        button(`traveler-${member.id}`, pair, [260 + index * 214, 9, 200, 45], () => change(() => {
            const previous = tripPlan(state).leg;
            const previousLoad = defaultLoad(state);
            const usesSuggestedSupplies = KEYS.every(key => draft.resources[key] === previousLoad.resources[key]);
            const result = chooseFieldCrew(state, member.id);
            if (!result && previous !== tripPlan(state).leg && usesSuggestedSupplies) {
                draft.resources = defaultLoad(state).resources;
            }
            return result;
        }), { label: `${member.name.split(' ')[0]} · ${member.role}`, tone: selected ? 'hero' : 'plain',
            disabled: !selected && (member.health <= 0 || Boolean(fieldDutyProblem(state, member))) });
        ui.label(pair, [260 + index * 214, 55, 200, 34], readiness ?? (selected ? 'Selected · ready' : 'Available'), {
            size: 12, fit: 11, color: readiness ? p.amber : p.secondary, wrap: true, center: true,
        });
    });
    const tanks = ui.frame(content, [20, 214, 548, 304], p.ink);
    const holds = ui.frame(content, [588, 214, 568, 304], p.ink);
    ui.label(tanks, [12, 5, 506, 29], 'Bulk supplies', { display: true, size: 23, color: p.amber });
    ui.label(holds, [12, 5, 518, 29], 'Packable cargo', { display: true, size: 23, color: p.amber });
    KEYS.forEach((key, index) => {
        const y = 45 + index * 42;
        ui.label(tanks, [12, y, 194, 32], `${RESOURCE_LABELS[key]} · ${PACK_UNITS[key]}/slot`, { size: 15 });
        ui.label(tanks, [205, y, 127, 32], `${draft.resources[key]} / ${Math.floor(state.resources[key])}`, { size: 16, color: p.cyan, center: true });
        const adjust = (delta: number) => change(() => {
            draft.resources[key] = Math.max(0, Math.min(Math.floor(state.resources[key]), draft.resources[key] + delta));
            return null;
        });
        button(`bulk-${key}-minus`, tanks, [340, y, 42, 32], () => adjust(-1), { label: '−', disabled: !draft.resources[key] });
        button(`bulk-${key}-plus`, tanks, [391, y, 42, 32], () => adjust(1), { label: '+', disabled: draft.resources[key] >= Math.floor(state.resources[key]) });
        button(`bulk-${key}-pack`, tanks, [442, y, 79, 32], () => adjust(PACK_UNITS[key]), { label: '+ Pack', disabled: draft.resources[key] >= Math.floor(state.resources[key]) });
    });
    const upkeepLine = (cost: ResourcePool) => `${cost.food} Food · ${cost.water} Water · ${cost.oxygen} O₂ · ${cost.energy} Power`;
    ui.label(tanks, [12, 253, 508, 20], `Clear per Sol   ${upkeepLine(trip.perSol)}`, { size: 13, color: p.secondary });
    const peak = peakRoverBudget(state);
    ui.label(tanks, [12, 276, 508, 20], `Storm peak   ${upkeepLine(peak.upkeep)}${peak.restricted ? ' · Shelter' : ''}`, { size: 13, color: p.amber });

    rosterItems(state).forEach((item, index) => {
        const y = 40 + index * 30;
        ui.label(holds, [12, y, 206, 27], item.name, { size: 15 });
        ui.label(holds, [224, y, 108, 27], `${item.cells.length} slot${item.cells.length === 1 ? '' : 's'}`, { size: 13, color: p.secondary });
        ui.label(holds, [324, y, 100, 27], `${draft.cargo[item.id]} / ${state.cargo[item.id]}`, { size: 15, color: p.cyan, center: true });
        const adjust = (delta: number) => change(() => { draft.cargo[item.id] += delta; return null; });
        button(`cargo-${item.id}-minus`, holds, [428, y, 47, 26], () => adjust(-1), { label: '−', disabled: INSTRUMENTS.includes(item.id) || !draft.cargo[item.id] });
        button(`cargo-${item.id}-plus`, holds, [484, y, 47, 26], () => adjust(1), { label: '+', disabled: INSTRUMENTS.includes(item.id) || draft.cargo[item.id] >= state.cargo[item.id] });
    });

    const problem = issues[0]?.message;
    const slots = loadSlots(draft);
    const extra = stormReserve(state);
    const overlap = stormWindowKnown(state) && trip.returnSol >= run.stormStart && state.sol <= run.stormStart + 2;
    const weatherNote = extra.energy || extra.oxygen ? `${stormWindowKnown(state) ? 'Storm reserve' : 'Storm reserve up to'} +${extra.energy} Power / +${extra.oxygen} O₂` :
        overlap && !run.completed.harden ? `Travel overlaps storm Sols ${run.stormStart}–${run.stormStart + 2} · Shelter delays the rover` :
        run.completed.harden ? 'Rover hardened' : 'Standard rover shelters during storms';
    ui.label(content, [24, 526, 700, 30], `${slots}/${ROVER_SLOTS} slots · ${weatherNote}`, { size: 14, color: slots > ROVER_SLOTS ? p.bad : p.amber });
    const packed = roverLoadStock(draft);
    const missingPower = Math.max(0, trip.cleanCost.energy + extra.energy - packed.energy);
    const missingOxygen = Math.max(0, trip.cleanCost.oxygen + extra.oxygen + 1 - packed.oxygen);
    const gaps = [missingPower && `${missingPower} Power`, missingOxygen && `${missingOxygen} O₂`].filter(Boolean).join(' and ');
    const loadNote = slots > ROVER_SLOTS ? `Load exceeds ${ROVER_SLOTS} slots. Pack consumables in place of some bulk stock.` : problem;
    const warning = !loadNote && gaps && `Storm reserve needs ${gaps} more. Loaded supplies cover the clear-weather trip.`;
    ui.label(content, [24, 561, 700, 42], loadNote || warning || 'Ready to dispatch. Delays can move the return past the deadline.', {
        size: 15, color: loadNote ? p.secondary : warning ? p.amber : p.good, wrap: true,
    });
    button('reset-load', content, [738, 540, 190, 50], reset, { label: 'Clean-trip load' });
    button('dispatch', content, [940, 540, 216, 50], () => change(() => {
        const result = dispatchRover(state, draft);
        if (!result) dispatch();
        return result;
    }), { label: problem ? 'Dispatch locked' : `Dispatch to ${expeditionFor(state).site.replace(/^the /, '')}`, tone: problem ? 'plain' : 'primary', disabled: Boolean(problem), labelSize: 16 });
}

/** The cargo this expedition can carry: everything except the other missions' instruments. */
function rosterItems(state: TharsisState) {
    const own = expeditionFor(state).instrument;
    return CARGO_ITEMS.filter(item => item.id === own || !INSTRUMENTS.includes(item.id));
}

export function showStorage({ state, ui, content, button, change, area, open, highlight }: Console & {
    area: Area; open: (target: 'roverChecklist' | 'stores') => void;
    highlight?: CargoItemId;
}): void {
    const p = ui.palette;
    const local = localArea(state, area);
    if (!local) return;
    const station = area === 'station';
    ui.label(content, [22, 60, 1112, 27], station ? 'Use supplies at the station. Supplies in the rover checklist transfer at dispatch.' :
        'Use the cargo loaded into the rover. Station supplies are accessible again after docking.', { size: 15, color: p.cyan });
    rosterItems(state).forEach((item, index) => {
        const row = ui.frame(content, [20 + index % 2 * 576, 102 + Math.floor(index / 2) * 105, 556, 94], p.ink, item.id === highlight ? p.cyan : undefined);
        ui.label(row, [14, 6, 394, 30], `${item.name}  ×${local.cargo[item.id]}`, { display: true, size: 22, color: local.cargo[item.id] ? p.text : p.muted });
        ui.label(row, [14, 40, 360, 38], item.effect, { size: 14, color: p.secondary, wrap: true });
        if (!INSTRUMENTS.includes(item.id)) button(`use-${item.id}`, row, [420, 21, 110, 46], () => change(() => {
            const result = useLocalCargo(state, area, item.id);
            return result ?? `Used ${item.name} · ${item.effect}`;
        }), { label: 'Use one', disabled: !local.cargo[item.id], tone: item.id === highlight ? 'hero' : 'plain' });
    });
    if (station) {
        button('stores-orders', content, [22, 540, 226, 50], () => open('stores'), { label: 'Field store work orders' });
        button('rover-checklist', content, [266, 540, 216, 50], () => open('roverChecklist'), { label: 'Open rover checklist', tone: 'hero', disabled: Boolean(state.tharsis.rover) });
    } else {
        const rover = state.tharsis.rover!;
        const forcedRest = local.crew.some(member => member.morale < FIELD_REST_MORALE);
        button('field-rest', content, [22, 540, 230, 50], () => change(() => toggleFieldRest(state)), {
            label: forcedRest ? 'Field rest required' : rover.resting ? 'Cancel field rest' : 'Rest for one Sol',
            disabled: forcedRest, tone: rover.resting ? 'hero' : 'plain',
        });
        ui.label(content, [268, 526, 550, 65], 'Rest restores Morale and uses supplies. Travel pauses and a partial survey window resets.', {
            size: 14, color: p.secondary, wrap: true,
        });
        button('return', content, [840, 540, 314, 50], () => change(() => emergencyReturn(state) ?? 'Emergency return requested.'), {
            label: rover.phase === 'returning' ? 'Return underway' : 'Order emergency return', disabled: rover.phase === 'returning', tone: 'primary',
        });
    }
}
