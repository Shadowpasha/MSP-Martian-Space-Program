import { CREW_ROLES, GAMEPLAY_UPGRADES, type CrewRole } from '../contracts/gameContract';
import { stationShiftCapacity } from './crewAbilities';
import { appendLog, applyResourceDelta, canAffordCost, spend } from './stateOps';
import type { TharsisState } from './tharsis';

type CrewSelection = { memberId: string; role: CrewRole };
export interface UpgradeState {
    batteryCharged: boolean;
    batteryTransferSol: number | null;
    electrolysisSol: number | null;
    emergencyStoresUsed: boolean;
    recorderUsed: boolean;
    crossTraining: CrewSelection | null;
    rotation: { memberId: string; sol: number } | null;
}

export type UpgradeCommand =
    | { kind: 'batteryBank' }
    | { kind: 'electrolysis' }
    | ({ kind: 'crossTraining' } & CrewSelection)
    | { kind: 'protectedRotation'; memberId: string };

const BANK_POWER = 12;
const ELECTROLYSIS_COST = { water: 4, energy: 3 };
const TRAINING_COST = { energy: 4 };
const ROTATION_COST = { food: 2 };

export function hasUpgrade(state: TharsisState, key: keyof typeof GAMEPLAY_UPGRADES): boolean {
    return state.unlockedSkillIds.includes(GAMEPLAY_UPGRADES[key]);
}

export function upgradeProblem(state: TharsisState, command: UpgradeCommand): string | null {
    if (state.phase !== 'planning') return 'Use this system during planning.';
    if (!hasUpgrade(state, command.kind)) return 'This upgrade is locked.';
    const { resources, tharsis: { upgrades } } = state;
    if (command.kind === 'batteryBank') {
        if (upgrades.batteryTransferSol === state.sol) return 'One transfer per Sol. Ready next Sol.';
        return upgrades.batteryCharged
            ? resources.energy > 120 - BANK_POWER ? 'Needs room for 12 Power in station batteries.' : null
            : resources.energy < BANK_POWER ? 'Needs 12 station Power.' : null;
    }
    if (command.kind === 'electrolysis') {
        if (upgrades.electrolysisSol === state.sol) return 'Already ran electrolysis this Sol.';
        if (resources.oxygen >= 100) return 'Station O₂ is full.';
        return canAffordCost(resources, ELECTROLYSIS_COST) ? null : 'Needs 4 station Water and 3 Power.';
    }
    const member = state.crew.find(candidate => candidate.id === command.memberId);
    if (!member || !stationShiftCapacity(state, member)) return 'Select a healthy, available crew member at the station.';
    if (command.kind === 'crossTraining') {
        if (upgrades.crossTraining) return 'Cross-Training has already been used.';
        if (!CREW_ROLES.includes(command.role) || member.role === command.role) return 'Choose a different work role.';
        return canAffordCost(resources, TRAINING_COST) ? null : 'Needs 4 station Power.';
    }
    if (upgrades.rotation?.sol === state.sol) return 'Protected Rotation has already been used this Sol.';
    return canAffordCost(resources, ROTATION_COST) ? null : 'Needs 2 station Food.';
}

export function activateUpgrade(state: TharsisState, command: UpgradeCommand): string | null {
    const problem = upgradeProblem(state, command);
    if (problem) return problem;
    const { resources, tharsis: { upgrades } } = state;
    let note: string;
    switch (command.kind) {
        case 'batteryBank':
            applyResourceDelta(resources, { energy: upgrades.batteryCharged ? BANK_POWER : -BANK_POWER });
            upgrades.batteryCharged = !upgrades.batteryCharged;
            upgrades.batteryTransferSol = state.sol;
            note = upgrades.batteryCharged ? 'Stored 12 Power in the Battery Bank.' : 'Returned 12 Power from the Battery Bank.';
            break;
        case 'electrolysis':
            spend(resources, ELECTROLYSIS_COST);
            applyResourceDelta(resources, { oxygen: 12 });
            upgrades.electrolysisSol = state.sol;
            note = 'Emergency Electrolysis ran · 4 Water and 3 Power used.';
            break;
        case 'crossTraining':
            spend(resources, TRAINING_COST);
            upgrades.crossTraining = { memberId: command.memberId, role: command.role };
            note = `Cross-Training complete · ${state.crew.find(member => member.id === command.memberId)!.name} can cover ${command.role} work.`;
            break;
        case 'protectedRotation':
            spend(resources, ROTATION_COST);
            upgrades.rotation = { memberId: command.memberId, sol: state.sol };
            note = `Protected Rotation set for ${state.crew.find(member => member.id === command.memberId)!.name} this Sol.`;
            break;
    }
    appendLog(state, 'good', note);
    return null;
}

export function trainedRole(state: TharsisState, member: CrewSelection['memberId']): CrewRole | undefined {
    const training = state.tharsis.upgrades.crossTraining;
    return training?.memberId === member ? training.role : undefined;
}

export function releaseEmergencyStores(state: TharsisState, report: string[]): void {
    if (!hasUpgrade(state, 'emergencyStores') || state.tharsis.upgrades.emergencyStoresUsed) return;
    const { food, water, oxygen } = state.resources;
    if (food > 0 && water > 0 && oxygen > 0) return;
    applyResourceDelta(state.resources, { food: 8, water: 8, oxygen: 12 });
    state.tharsis.upgrades.emergencyStoresUsed = true;
    report.push('Emergency Stores opened · +8 Food, +8 Water, +12 station O₂.');
}
