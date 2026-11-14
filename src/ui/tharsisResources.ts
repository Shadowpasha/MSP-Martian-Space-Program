import type { Entity } from 'esengine';
import type { ResourcePool } from '../contracts/gameContract';
import { EQUIPMENT_IDS, STATION_EQUIPMENT } from '../data/tharsisEquipment';
import { RESOURCE_LABELS } from '../data/missions';
import { round1 } from '../simulation/stateOps';
import { localArea, localBudget, resourceForecast, stormDay, type Area, type TharsisState } from '../simulation/tharsis';
import { radiationAfterDose, radiationEffects } from '../simulation/tharsisConditions';
import type { FlightUi } from './flightUi';
import type { RunButton } from './tharsisFlight';

export const RESOURCE_KEYS = ['energy', 'food', 'water', 'oxygen', 'res'] as const;
type Resource = keyof ResourcePool;
type Forecast = ReturnType<typeof resourceForecast>;

export function resourceRate(forecast: Forecast, key: Resource) {
    const passive = round1(forecast.passive[key]);
    const use = round1(forecast.upkeep[key] + forecast.tasks.reduce((sum, flow) => sum + (flow.cost?.[key] ?? 0), 0));
    const recovery = round1(forecast.tasks.reduce((sum, flow) => sum + (flow.remaining === 1 ? flow.yield?.[key] ?? 0 : 0), 0));
    return { passive, use, recovery, daily: round1(passive + recovery - use) };
}

export const signed = (value: number) => value ? `${value > 0 ? '+' : '−'}${Math.abs(value)}` : '0';

export function runway(stock: number, forecast: Forecast, key: Resource): string {
    const { passive, use } = resourceRate(forecast, key);
    const drain = round1(use - passive);
    if (drain > 0) return `${(stock / drain).toFixed(1)} Sols at current use`;
    if (!stock && !passive) return 'No stock or scheduled daily draw';
    return 'Stable at current use';
}

export function showConditions(ui: FlightUi, content: Entity, button: RunButton, state: TharsisState, area: Area,
    select: (area: Area) => void, openControls: (area: Area) => void): void {
    const p = ui.palette;
    const actualArea = area === 'rover' && state.tharsis.rover ? 'rover' : 'station';
    const { conditions, resources } = localArea(state, actualArea)!;
    const budget = localBudget(state, actualArea);
    const day = stormDay(state);
    const projectedDose = radiationAfterDose(conditions.radiation, budget.dose);
    const projectedEffects = radiationEffects(projectedDose);
    const powered = round1(resources.energy + budget.passive.energy) >= budget.upkeep.energy;
    button('condition-station', content, [20, 68, 172, 39], () => select('station'), { label: 'Station', tone: actualArea === 'station' ? 'hero' : 'plain' });
    button('condition-rover', content, [204, 68, 172, 39], () => select('rover'), {
        label: 'Rover', tone: actualArea === 'rover' ? 'hero' : 'plain', disabled: !state.tharsis.rover,
    });
    ui.label(content, [866, 70, 284, 32], `SOL ${state.sol} / ${state.goal.deadlineSol}`, { size: 15, color: p.cyan, center: true });

    const columns = [
        {
            title: 'Weather', value: `${conditions.weather}${day ? ` · ${day}/3` : ''}`, warning: Boolean(day || conditions.weather === 'Dust Haze'),
            rows: [
                [actualArea === 'station' ? `+${budget.passive.energy} passive solar Power` : 'Rover running from packed supplies',
                    budget.filterOxygen ? `Filtration draws ${budget.filterOxygen}${actualArea === 'station' ? '%' : ''} O₂` : 'Filters at normal load'].join(' · '),
                conditions.weather === 'Dust Haze' ? 'Opacity is rising. Check storm protection and reserves.' :
                    conditions.weather === 'Solar Flare' ? 'Particle exposure rises. Solar generation continues.' :
                    day ? 'The storm draws down reserves and limits exposed work.' : 'Routine operations.',
            ],
        },
        {
            title: 'Temperature', value: `${conditions.temperatureC} °C`, warning: !powered && budget.heating > 0,
            rows: [`${budget.heating} Power for heating, included in ${budget.upkeep.energy} Power total upkeep.`,
                !powered && budget.heating > 0 ? 'Heating reserve shortfall. Crew will lose health and Morale.' :
                    budget.heating ? 'Heaters are funded at current stock.' : 'Baseline heating is covered by routine upkeep.'],
        },
        {
            title: 'Radiation', value: `${conditions.radiation} mSv`, warning: projectedEffects.health > 0,
            rows: [`${projectedDose} mSv projected after exposure · ${projectedEffects.level}`,
                projectedEffects.health ? `Each crew member loses ${projectedEffects.health} HP and ${round1(projectedEffects.morale * state.skillModifiers.moraleDecayMult)} Morale at this dose.` :
                    'Current exposure is below the crew health threshold.',
                projectedEffects.exteriorHold ? 'Exposure exceeds the limit for outside work and field sampling.' :
                    actualArea === 'station' ? 'Shelter and shielding reduce incoming exposure.' : 'Rover hardening reduces incoming exposure.'],
        },
    ];
    columns.forEach(({ title, value, warning, rows }, index) => {
        const card = ui.frame(content, [20 + 384 * index, 132, 364, 356], p.ink, warning ? p.rust : p.teal);
        ui.label(card, [16, 12, 330, 34], title, { display: true, size: 23, color: p.secondary });
        ui.label(card, [16, 56, 330, 56], value, { display: true, size: 29, fit: 19, color: warning ? p.amber : p.cyan });
        ui.box(card, [16, 122, 328, 1], p.teal);
        rows.forEach((line, row) => ui.label(card, [16, 143 + 62 * row, 328, 55], line, {
            size: 15, wrap: true, top: true, color: row === 0 ? p.text : p.secondary,
        }));
    });
    const text = actualArea === 'station' ? `Shelter ${state.tharsis.shelter} · ${state.tharsis.completed.shield ? 'Shelter panels fitted' : 'Standard shielding'}` :
        state.tharsis.completed.harden ? 'Hardened rover · Added shielding and insulation' : 'Standard rover · Must shelter in a storm';
    ui.label(content, [24, 519, 810, 44], text, { size: 16, color: p.amber });
    button('condition-controls', content, [860, 512, 272, 49], () => openControls(actualArea), {
        label: actualArea === 'station' ? 'Life support controls' : 'Expedition supplies', tone: 'hero',
    });
}

export function showResources(ui: FlightUi, content: Entity, button: RunButton, state: TharsisState, area: Area, key: Resource, taskPage: number,
    select: (key: Resource) => void, page: (next: number) => void): void {
    const p = ui.palette;
    const actualArea = area === 'rover' && state.tharsis.rover ? 'rover' : 'station';
    const local = localArea(state, actualArea)!;
    const forecast = resourceForecast(state, actualArea);
    const { passive, use, recovery, daily } = resourceRate(forecast, key);
    const unit = key === 'oxygen' && actualArea === 'station' ? '%' : '';
    ui.label(content, [22, 59, 1100, 28], `${actualArea === 'station' ? 'STATION' : 'ROVER'}   ·   SOL ${state.sol} RESOURCE FORECAST`, { size: 14, color: p.cyan });
    RESOURCE_KEYS.forEach((id, index) => {
        const row = ui.frame(content, [20 + 229 * index, 108, 216, 72], p.ink, id === key ? p.cyan : p.edge);
        button(`resource-detail-${id}`, row, [8, 6, 192, 50], () => select(id), {
            label: `${RESOURCE_LABELS[id]}  ${local.resources[id]}${id === 'oxygen' && actualArea === 'station' ? '%' : ''}`, tone: id === key ? 'hero' : 'tile', labelSize: 17,
        });
    });
    const budget = ui.frame(content, [20, 200, 476, 406], p.ink, p.teal);
    ui.label(budget, [18, 8, 420, 43], RESOURCE_LABELS[key], { display: true, size: 27 });
    ui.label(budget, [18, 58, 420, 32], runway(local.resources[key], forecast, key), { size: 19, color: p.amber });
    const climate = key === 'energy' ? round1(forecast.heating + forecast.filterPower) : key === 'oxygen' ? forecast.filterOxygen : 0;
    const rows = [ ['Passive recovery / Sol', passive], ['Routine upkeep / Sol', -(forecast.upkeep[key] - climate)],
        [key === 'energy' ? 'Heating and filtration / Sol' : 'Filtration / Sol', -climate],
        ['Task consumption / Sol', -(use - forecast.upkeep[key])], ['Tasks finishing this Sol', recovery], ['Projected net this Sol', daily] ] as const;
    rows.filter((_, index) => index !== 2 || climate > 0).forEach(([label, value], index) => {
        const y = 101 + index * 35;
        ui.box(budget, [16, y + 30, 434, 1], p.edge);
        ui.label(budget, [18, y, 310, 29], label, { size: 15, color: p.secondary });
        ui.label(budget, [328, y, 116, 29], `${signed(round1(value))}${unit}`, { size: 16, color: value < 0 ? p.bad : value > 0 ? p.good : p.text, center: true });
    });
    ui.label(budget, [18, 324, 430, 58], 'Runway uses current passive recovery and daily draw. Task yields arrive on completion.', { size: 13, color: p.muted, wrap: true, top: true });

    const tasks = ui.frame(content, [512, 200, 640, 406], p.ink);
    ui.label(tasks, [16, 10, 590, 42], 'Scheduled task contributions', { display: true, size: 24 });
    const relevant = forecast.tasks.filter(flow => flow.cost?.[key] || flow.yield?.[key] || flow.hold);
    if (!relevant.length) ui.label(tasks, [16, 65, 600, 68], 'Current tasks do not change this resource.', { size: 16, color: p.secondary, wrap: true, top: true });
    relevant.slice(taskPage * 4, taskPage * 4 + 4).forEach((flow, index) => {
        const y = 58 + index * 64;
        ui.label(tasks, [17, y, 596, 26], flow.title, { display: true, size: 18 });
        const costs = flow.cost?.[key] ?? 0;
        const gain = flow.yield?.[key] ?? 0;
        const detail = flow.hold ? `Held · ${flow.hold}` : [costs ? `−${costs}${unit} / Sol` : '',
            gain ? `+${gain}${unit} on completion · ${flow.remaining} Sol` : '',
            key === 'energy' && flow.decommission === 'auxiliary-solar' ? 'Passive generation −35% after completion' : ''].filter(Boolean).join('   ·   ');
        ui.label(tasks, [17, y + 26, 596, 28], detail, { size: 14, wrap: true, color: flow.hold ? p.amber : p.cyan });
        ui.box(tasks, [16, y + 54, 602, 1], p.edge);
    });
    if (relevant.length > 4) {
        button('resources-prev', tasks, [17, 333, 130, 38], () => page(taskPage - 1), { label: 'Previous', disabled: taskPage === 0 });
        button('resources-next', tasks, [164, 333, 130, 38], () => page(taskPage + 1), { label: 'More', disabled: (taskPage + 1) * 4 >= relevant.length });
    }
    const disabled = EQUIPMENT_IDS.filter(id => state.tharsis.disabledEquipment[id]);
    if (actualArea === 'station' && disabled.length) {
        ui.label(content, [22, 608, 1100, 32], `Decommissioned   ${disabled.map(id => STATION_EQUIPMENT[id].name).join('  ·  ')}`, { size: 14, color: p.amber });
    }
}
