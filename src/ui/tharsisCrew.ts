import type { Entity } from 'esengine';
import { CREW_ROLES } from '../contracts/gameContract';
import { CREW_ABILITIES } from '../data/crewAbilities';
import { activateCrewAbility, crewAbilityProblem, crewAbilityStatus, doubleShift } from '../simulation/crewAbilities';
import { activateUpgrade, hasUpgrade, upgradeProblem, type UpgradeCommand } from '../simulation/tharsisUpgrades';
import { localArea, type Area, type TharsisState } from '../simulation/tharsis';
import { scheduledOrder } from '../simulation/tharsisWork';
import type { FlightUi } from './flightUi';
import type { RunButton } from './tharsisFlight';

export function showCrewAbilities(ui: FlightUi, content: Entity, button: RunButton, state: TharsisState,
    crewId: string | null, select: (id: string) => void, openWork: (id: string) => void, change: (action: () => string | null) => void): void {
    const p = ui.palette;
    const member = state.crew.find(candidate => candidate.id === crewId) ?? state.crew[0]!;
    const area: Area = state.tharsis.rover?.crewIds.includes(member.id) ? 'rover' : 'station';
    const local = localArea(state, area)!;
    const ability = CREW_ABILITIES[member.role];
    state.crew.forEach((candidate, index) => {
        button(`specialty-${candidate.id}`, content, [24 + index * 280, 68, 264, 50], () => select(candidate.id), {
            label: candidate.name, tone: candidate === member ? 'hero' : 'plain',
        });
    });
    const details = ui.frame(content, [24, 140, 548, 438], p.ink, p.teal);
    ui.image(details, [18, 16, 88, 112], member.portraitPath);
    ui.label(details, [122, 12, 403, 32], member.name, { display: true, size: 24 });
    ui.label(details, [122, 46, 403, 26], `${area === 'rover' ? 'Rover' : 'Station'} · ${member.health} HP · ${member.morale}% Morale`, { size: 15, color: p.secondary });
    ui.label(details, [122, 79, 403, 25], crewAbilityStatus(state, member), { size: 15, color: p.amber });
    ui.label(details, [18, 141, 506, 29], ability.name, { size: 24, display: true, color: p.cyan });
    ui.label(details, [18, 179, 506, 55], ability.description, { size: 16, wrap: true, top: true });
    if (member.role === 'scientist' && !doubleShift(state, member)) {
        ui.label(details, [18, 236, 506, 28], `Work Sols ${state.sol}–${state.sol + 2} · Recover Sols ${state.sol + 3}–${state.sol + 5}`,
            { size: 15, color: p.amber });
    }
    const abilityProblem = crewAbilityProblem(state, area, member.id, member.role === 'medic' ? member.id : undefined);
    if (abilityProblem) ui.label(details, [18, 280, 506, 50], abilityProblem, { size: 15, color: p.secondary, wrap: true, top: true });
    if (member.role === 'medic' && !abilityProblem) {
        const targets = local.crew.filter(target => target.health > 0);
        targets.forEach((target, index) => button(`triage-${target.id}`, details, [18 + index % 2 * 253, 280 + Math.floor(index / 2) * 55, 242, 45],
            () => change(() => activateCrewAbility(state, area, member.id, target.id)), {
                label: `Treat ${target.name.split(' ')[0]}`, tone: 'hero',
            }));
    } else if (member.role !== 'captain') {
        const label = member.role === 'scientist' ? 'Activate Double Shift' :
            member.role === 'engineer' ? 'Fabricate Repair Kit' : member.role === 'botanist' ? 'Plant Seed Pod' : 'Arm Storm Override';
        button('activate-specialty', details, [18, 342, 398, 48], () => change(() => activateCrewAbility(state, area, member.id)), {
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
