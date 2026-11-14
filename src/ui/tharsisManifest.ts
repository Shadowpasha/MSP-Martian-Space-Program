import type { Entity } from 'esengine';
import type { ResourcePool } from '../contracts/gameContract';
import { CARGO_ITEMS } from '../data/cargo';
import { RESOURCE_LABELS } from '../data/missions';
import { defaultLoad, dispatchProblem, dispatchRover, emergencyReturn, loadSlots, localArea, PACK_UNITS, ROVER_SLOTS,
    STORM_DRAW, tripPlan, useLocalCargo, type Area, type RoverLoad, type TharsisState } from '../simulation/tharsis';
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

export function showRoverChecklist({ state, ui, content, button, change, draft, reset, dispatch }: Console & {
    draft: RoverLoad; reset: () => void; dispatch: () => void;
}): void {
    const p = ui.palette;
    const run = state.tharsis;
    const trip = tripPlan(state);
    ui.label(content, [22, 61, 1116, 27], `${trip.leg === 1 ? 'Pilot' : 'Backup driver'} · ${trip.leg} Sol per leg · ${trip.sols} Sol round trip · Latest departure Sol ${trip.latest} · Projected return Sol ${trip.returnSol}`, { size: 15, color: p.cyan });
    const pair = ui.frame(content, [20, 102, 1136, 96], p.ink);
    ui.label(pair, [12, 4, 250, 30], `Travelers   ${run.fieldPair.length}/2`, { display: true, size: 23 });
    ui.label(pair, [12, 41, 240, 38], 'Changing crew reopens suit certification.', { size: 13, color: p.secondary, wrap: true });
    state.crew.forEach((member, index) => {
        button(`traveler-${member.id}`, pair, [260 + index * 214, 20, 200, 48], () => change(() => {
            const previous = tripPlan(state).leg;
            const previousLoad = defaultLoad(state);
            const usesSuggestedSupplies = KEYS.every(key => draft.resources[key] === previousLoad.resources[key]);
            const result = chooseFieldCrew(state, member.id);
            if (!result && previous !== tripPlan(state).leg && usesSuggestedSupplies) {
                draft.resources = defaultLoad(state).resources;
            }
            return result;
        }), { label: `${member.name.split(' ')[0]} · ${member.role}`, tone: run.fieldPair.includes(member.id) ? 'hero' : 'plain', disabled: member.health <= 0 });
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
    ui.label(tanks, [12, 261, 508, 25], 'Per Sol   2 Food · 2 Water · 3 O₂ · 4 Power', { size: 14, color: p.secondary });

    CARGO_ITEMS.forEach((item, index) => {
        const y = 40 + index * 30;
        ui.label(holds, [12, y, 206, 27], item.name, { size: 15 });
        ui.label(holds, [224, y, 108, 27], `${item.cells.length} slot${item.cells.length === 1 ? '' : 's'}`, { size: 13, color: p.secondary });
        ui.label(holds, [324, y, 100, 27], `${draft.cargo[item.id]} / ${state.cargo[item.id]}`, { size: 15, color: p.cyan, center: true });
        const adjust = (delta: number) => change(() => { draft.cargo[item.id] += delta; return null; });
        button(`cargo-${item.id}-minus`, holds, [428, y, 47, 26], () => adjust(-1), { label: '−', disabled: item.id === 'windSampler' || !draft.cargo[item.id] });
        button(`cargo-${item.id}-plus`, holds, [484, y, 47, 26], () => adjust(1), { label: '+', disabled: item.id === 'windSampler' || draft.cargo[item.id] >= state.cargo[item.id] });
    });

    const problem = dispatchProblem(state, draft);
    const slots = loadSlots(draft);
    const weatherNote = state.conditions.weather === 'Dust Haze' ? ' · Opacity rising' : '';
    ui.label(content, [24, 526, 700, 30], `${slots}/${ROVER_SLOTS} slots · ${run.completed.harden ? 'Rover hardened' : 'Standard rover'} · Storm draw +${STORM_DRAW.energy} Power and +${STORM_DRAW.oxygen} O₂/Sol${weatherNote}`, { size: 14, color: slots > ROVER_SLOTS ? p.bad : p.amber });
    ui.label(content, [24, 561, 700, 42], problem ?? 'Ready to dispatch. A delay can move the projected return past the deadline.', { size: 15, color: problem ? p.secondary : p.good, wrap: true });
    button('reset-load', content, [738, 540, 190, 50], reset, { label: 'Clean-trip load' });
    button('dispatch', content, [940, 540, 216, 50], () => change(() => {
        const result = dispatchRover(state, draft);
        if (!result) dispatch();
        return result;
    }), { label: problem ? 'Dispatch locked' : 'Dispatch to Site A', tone: problem ? 'plain' : 'primary', disabled: Boolean(problem) });
}

export function showStorage({ state, ui, content, button, change, area, open }: Console & {
    area: Area; open: (target: 'roverChecklist' | 'stores') => void;
}): void {
    const p = ui.palette;
    const local = localArea(state, area);
    if (!local) return;
    const station = area === 'station';
    ui.label(content, [22, 60, 1112, 27], station ? 'Use supplies at the station. Supplies in the rover checklist transfer at dispatch.' :
        'Use the cargo loaded into the rover. Station supplies are accessible again after docking.', { size: 15, color: p.cyan });
    CARGO_ITEMS.forEach((item, index) => {
        const row = ui.frame(content, [20 + index % 2 * 576, 102 + Math.floor(index / 2) * 105, 556, 94], p.ink);
        ui.label(row, [14, 6, 394, 30], `${item.name}  ×${local.cargo[item.id]}`, { display: true, size: 22, color: local.cargo[item.id] ? p.text : p.muted });
        ui.label(row, [14, 40, 360, 38], item.effect, { size: 14, color: p.secondary, wrap: true });
        if (item.id !== 'windSampler') button(`use-${item.id}`, row, [420, 21, 110, 46], () => change(() => {
            const result = useLocalCargo(state, area, item.id);
            return result ?? `Used ${item.name} · ${item.effect}`;
        }), { label: 'Use one', disabled: !local.cargo[item.id] });
    });
    if (station) {
        button('stores-orders', content, [22, 540, 226, 50], () => open('stores'), { label: 'Field store work orders' });
        button('rover-checklist', content, [266, 540, 216, 50], () => open('roverChecklist'), { label: 'Open rover checklist', tone: 'hero', disabled: Boolean(state.tharsis.rover) });
    } else {
        const rover = state.tharsis.rover!;
        button('return', content, [840, 540, 314, 50], () => change(() => emergencyReturn(state) ?? 'Emergency return requested.'), {
            label: rover.phase === 'returning' ? 'Return underway' : 'Order emergency return', disabled: rover.phase === 'returning', tone: 'primary',
        });
    }
}
