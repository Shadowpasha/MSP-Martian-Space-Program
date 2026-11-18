import type { Entity } from 'esengine';
import { CREW_ROLES, type CrewMember } from '../contracts/gameContract';
import { crewAbilityFor } from '../data/crewAbilities';
import { activateCrewAbility, crewAbilityProblem, crewAbilityStatus, doubleShift, stationShiftCapacity } from '../simulation/crewAbilities';
import { activateUpgrade, hasUpgrade, upgradeProblem, type UpgradeCommand } from '../simulation/tharsisUpgrades';
import { localArea, type Area, type TharsisState } from '../simulation/tharsis';
import { LOW_MORALE } from '../simulation/tharsisConditions';
import { scheduledOrder } from '../simulation/tharsisWork';
import type { FlightUi } from './flightUi';
import type { RunButton } from './tharsisFlight';

/** Health at or below this shows red. */
export const LOW_HEALTH = 30;

export type DutyTone = 'good' | 'amber' | 'cyan' | 'bad';
/** What a crew member is doing this Sol: free to lead a task, busy with one, or unable to. */
export function crewDuty(state: TharsisState, member: CrewMember): { word: string; detail: string; tone: DutyTone } {
    if (member.health <= 0) return { word: "Can't work", detail: 'Incapacitated: no health left.', tone: 'bad' };
    if (state.tharsis.rover?.crewIds.includes(member.id)) return { word: 'With rover', detail: 'Out on the expedition with the rover.', tone: 'cyan' };
    const capacity = stationShiftCapacity(state, member);
    if (capacity === 0) return { word: 'Resting', detail: 'Recovering after Double Shift. Cannot lead tasks yet.', tone: 'cyan' };
    const jobs = state.tharsis.work.filter(job => job.leadId === member.id);
    const titles = jobs.map(job => scheduledOrder(job, state.tharsis.expedition).title).join(', ');
    if (jobs.length >= capacity) return { word: 'Busy', detail: `Leading: ${titles}.`, tone: 'amber' };
    if (jobs.length) return { word: 'Ready', detail: `Leading: ${titles}. Can lead ${capacity - jobs.length} more.`, tone: 'good' };
    return { word: 'Ready', detail: 'Free to lead a task this Sol.', tone: 'good' };
}

export function showCrewAbilities(ui: FlightUi, content: Entity, button: RunButton, state: TharsisState,
    crewId: string | null, select: (id: string) => void, openWork: (id: string) => void, change: (action: () => string | null) => void): void {
    const p = ui.palette;
    const member = state.crew.find(candidate => candidate.id === crewId) ?? state.crew[0]!;
    const area: Area = state.tharsis.rover?.crewIds.includes(member.id) ? 'rover' : 'station';
    const local = localArea(state, area)!;
    const ability = crewAbilityFor(member);
    state.crew.forEach((candidate, index) => {
        button(`specialty-${candidate.id}`, content, [24 + index * 280, 68, 264, 50], () => select(candidate.id), {
            label: candidate.name, tone: candidate === member ? 'hero' : 'plain',
        });
    });
    const details = ui.frame(content, [24, 140, 548, 438], p.ink, p.teal);
    ui.image(details, [18, 16, 88, 112], member.portraitPath);
    ui.label(details, [122, 10, 403, 30], member.name, { display: true, size: 24, fit: 18 });
    // The same two bars as the name tag over their head, labelled.
    const bar = (y: number, name: string, value: number, text: string, color: typeof p.good) => {
        ui.label(details, [122, y, 70, 20], name, { size: 14, color: p.secondary });
        ui.box(details, [196, y + 6, 236, 8], { r: 1, g: 1, b: 1, a: 0.12 });
        ui.box(details, [196, y + 6, Math.round(236 * Math.min(100, Math.max(0, value)) / 100), 8], color);
        ui.label(details, [440, y, 90, 20], text, { size: 14, color });
    };
    bar(44, 'Health', member.health, `${member.health}/100`, member.health <= LOW_HEALTH ? p.bad : p.good);
    bar(68, 'Morale', member.morale, `${member.morale}%`, member.morale < LOW_MORALE ? p.bad : p.amber);
    // Busy or ready this Sol.
    const duty = crewDuty(state, member);
    const dutyColor = p[duty.tone];
    ui.box(details, [122, 94, 404, 30], { ...dutyColor, a: 0.16 });
    ui.box(details, [122, 94, 4, 30], dutyColor);
    ui.label(details, [134, 94, 110, 30], duty.word.toUpperCase(), { display: true, size: 16, color: dutyColor });
    ui.label(details, [244, 94, 278, 30], duty.detail, { size: 13, fit: 10, color: p.text, wrap: true });
    const D = 20;
    ui.label(details, [18, 141 + D, 330, 29], ability.name, { size: 24, display: true, color: p.cyan, fit: 18 });
    ui.label(details, [348, 145 + D, 176, 25], crewAbilityStatus(state, member), { size: 14, fit: 11, color: p.amber });
    ui.label(details, [18, 175 + D, 506, 52], ability.description, { size: 15, wrap: true, top: true });
    ui.label(details, [18, 228 + D, 506, 36], ability.bestTime, { size: 14, color: p.cyan, wrap: true, top: true });
    if (member.id === 'crew_scientist' && !doubleShift(state, member)) {
        ui.label(details, [18, 266 + D, 506, 26], 'Works twice as fast for 3 days, then rests for 3 days.',
            { size: 14, color: p.amber });
    }
    const abilityProblem = crewAbilityProblem(state, area, member.id, member.role === 'medic' ? member.id : undefined);
    if (abilityProblem) ui.label(details, [18, 294 + D, 506, 44], abilityProblem, { size: 14, color: p.secondary, wrap: true, top: true });
    if (member.role === 'medic' && !abilityProblem) {
        const targets = local.crew.filter(target => target.health > 0);
        targets.forEach((target, index) => button(`triage-${target.id}`, details, [18 + index % 2 * 253, 294 + D + Math.floor(index / 2) * 52, 242, 44],
            () => change(() => activateCrewAbility(state, area, member.id, target.id)), {
                label: `Treat ${target.name.split(' ')[0]}`, tone: 'hero',
            }));
    } else if (member.role !== 'captain') {
        const label = member.role === 'scientist' ? 'Work Double Speed' :
            member.role === 'engineer' ? 'Make a Repair Kit' : member.role === 'botanist' ? 'Plant Seed Pod' : 'Drive Through Storm';
        button('activate-specialty', details, [18, 346 + D, 398, 48], () => change(() => activateCrewAbility(state, area, member.id)), {
            label, disabled: Boolean(abilityProblem), tone: 'primary',
        });
    }

    const assignments = ui.frame(content, [590, 140, 566, 438], p.ink);
    ui.label(assignments, [16, 14, 520, 30], 'Duty & station systems', { size: 23, display: true });
    const jobs = state.tharsis.work.filter(job => job.leadId === member.id);
    if (!jobs.length) ui.label(assignments, [16, 53, 520, 34], area === 'rover' ? 'Assigned to the field team.' : 'No work orders assigned.', { size: 15, color: p.secondary });
    jobs.forEach((job, index) => {
        button(`inspect-job-${job.orderId}`, assignments, [16, 52 + index * 42, 528, 36], () => openWork(job.orderId),
            { label: scheduledOrder(job, state.tharsis.expedition).title });
    });
    const { upgrades } = state.tharsis;
    if (hasUpgrade(state, 'crossTraining')) {
        ui.label(assignments, [16, 144, 530, 32], 'Cross-Training · 4 Power', { size: 18, color: p.cyan, display: true });
        if (upgrades.crossTraining) {
            const training = upgrades.crossTraining;
            const trainee = state.crew.find(candidate => candidate.id === training.memberId)!;
            ui.label(assignments, [16, 182, 530, 48], `${trainee.name} qualified for ${training.role} work.`, { size: 15, wrap: true });
        } else if (area === 'station') {
            const roles = CREW_ROLES.filter(role => role !== member.role);
            const reason = upgradeProblem(state, { kind: 'crossTraining', memberId: member.id, role: roles[0]! });
            ui.label(assignments, [16, 179, 530, 31], reason ?? 'Choose a second work role for this crew member.', { size: 14, color: p.secondary });
            roles.forEach((role, index) => {
                const command: UpgradeCommand = { kind: 'crossTraining', memberId: member.id, role };
                button(`train-${role}`, assignments, [16 + index % 3 * 178, 217 + Math.floor(index / 3) * 43, 166, 36],
                    () => change(() => activateUpgrade(state, command)), { label: role[0]!.toUpperCase() + role.slice(1), disabled: Boolean(reason) });
            });
        } else ui.label(assignments, [16, 182, 530, 32], 'Select a station crew member.', { size: 15, color: p.secondary });
    }
    if (hasUpgrade(state, 'protectedRotation')) {
        const command: UpgradeCommand = { kind: 'protectedRotation', memberId: member.id };
        const reason = upgradeProblem(state, command);
        const rotation = upgrades.rotation?.sol === state.sol ? state.crew.find(candidate => candidate.id === upgrades.rotation?.memberId) : undefined;
        ui.label(assignments, [16, 311, 530, 35], rotation ? `Protected Rotation · ${rotation.name}` : 'Protected Rotation · 2 Food', { size: 17, color: p.cyan, display: true });
        ui.label(assignments, [16, 348, 526, 29], rotation ? 'Rest Morale and duty reset apply this Sol.' : reason ?? 'Gain rest Morale after working this Sol.',
            { size: 14, color: p.secondary, wrap: true });
        button('protected-rotation', assignments, [16, 383, 372, 40], () => change(() => activateUpgrade(state, command)), {
            label: 'Set protected rotation', disabled: Boolean(reason), tone: 'hero',
        });
    }
}
