import type { CrewMember, CrewRole } from '../contracts/gameContract';
import { CREW_ABILITIES } from '../data/crewAbilities';
import { FIELD_REST_MORALE } from './tharsisConditions';
import { localArea, stormDay, syncMorale, type Area, type TharsisState } from './tharsis';
import { appendLog, applyResourceDelta, spend } from './stateOps';

export interface CrewAbilityState {
    doubleShiftStarts: Record<string, number>;
    used: Partial<Record<CrewRole, true>>;
    trayHarvestSol: number | null;
    stormOverrideSol: number | null;
}

const DOUBLE_SHIFT_SOLS = 3;
const RECOVERY_SOLS = 3;
const FABRICATION_COST = { res: 4 };
const TRAY_COST = { water: 2 };
const OVERRIDE_COST = { energy: 4 };

export function doubleShift(state: TharsisState, member: CrewMember) {
    if (member.role !== 'scientist') return null;
    const start = state.tharsis.abilities.doubleShiftStarts[member.id];
    if (start === undefined) return null;
    const recovery = start + DOUBLE_SHIFT_SOLS;
    const ready = recovery + RECOVERY_SOLS;
    return state.sol < ready ? { recovery, ready, active: state.sol < recovery } : null;
}

export function stationShiftCapacity(state: TharsisState, member: CrewMember): number {
    if (member.health <= 0 || state.tharsis.rover?.crewIds.includes(member.id)) return 0;
    const cycle = doubleShift(state, member);
    return cycle ? cycle.active ? 2 : 0 : 1;
}

export function fieldDutyProblem(state: TharsisState, member: CrewMember): string | null {
    const cycle = doubleShift(state, member);
    return cycle ? cycle.active
        ? `Double Shift through Sol ${cycle.recovery - 1}. Available for field duty on Sol ${cycle.ready}.`
        : `Recovering through Sol ${cycle.ready - 1}.` : null;
}

export function crewAbilityStatus(state: TharsisState, member: CrewMember): string {
    if (member.health <= 0) return 'Incapacitated';
    const { abilities } = state.tharsis;
    const cycle = doubleShift(state, member);
    if (cycle) return cycle.active ? `2 shifts · to Sol ${cycle.recovery - 1}` : `Recovery · to Sol ${cycle.ready - 1}`;
    if (member.role === 'captain') return '1 preview / briefing';
    if (member.role === 'botanist' && abilities.trayHarvestSol !== null) return `Harvest Sol ${abilities.trayHarvestSol}`;
    if (member.role === 'pilot' && abilities.stormOverrideSol === state.sol) return 'Override armed';
    return abilities.used[member.role] ? 'Used' : 'Ready';
}

export function crewAbilityProblem(state: TharsisState, area: Area, memberId: string, targetId?: string): string | null {
    if (state.phase !== 'planning') return 'Use crew abilities during planning.';
    const local = localArea(state, area);
    const member = local?.crew.find(candidate => candidate.id === memberId && candidate.health > 0);
    if (!local || !member) return 'This crew member is unavailable here.';
    const { abilities, rover, fieldPair, completed } = state.tharsis;
    if (abilities.used[member.role]) return 'Already used this mission.';
    switch (member.role) {
        case 'captain': return 'Use Read the Situation during a briefing.';
        case 'scientist':
            return area !== 'station' ? 'Double Shift needs the station.'
                : fieldDutyProblem(state, member) ?? (fieldPair.includes(member.id) ? 'Remove the Scientist from the field pair first.' : null);
        case 'engineer':
            return area !== 'station' ? 'Fabrication needs the station.' : local.resources.res < FABRICATION_COST.res ? 'Needs 4 station Materials.' : null;
        case 'botanist':
            return area !== 'station' ? 'Plant the tray at the station.' : !local.cargo.seedPods || local.resources.water < TRAY_COST.water ? 'Needs one Seed Pod and 2 station Water.' : null;
        case 'pilot':
            if (area !== 'rover' || !rover || rover.phase === 'site' || !stormDay(state) || completed.harden) {
                return 'Available during storm travel in a standard rover.';
            }
            if (rover.resting || local.crew.some(candidate => candidate.health < 40 || candidate.morale < FIELD_REST_MORALE)) return 'The field pair needs to be ready to drive.';
            return local.resources.energy < OVERRIDE_COST.energy ? 'Needs 4 extra rover Power.' : null;
        case 'medic': {
            if (!local.cargo.medkits) return 'Needs a Medkit at this location.';
            return local.crew.some(candidate => candidate.health > 0 && candidate.id === targetId) ? null : 'Select a living crew member here.';
        }
    }
}

export function activateCrewAbility(state: TharsisState, area: Area, memberId: string, targetId?: string): string | null {
    const problem = crewAbilityProblem(state, area, memberId, targetId);
    if (problem) return problem;
    const local = localArea(state, area)!;
    const member = local.crew.find(candidate => candidate.id === memberId)!;
    const { abilities, dutyStreak } = state.tharsis;
    switch (member.role) {
        case 'scientist':
            abilities.doubleShiftStarts[memberId] = state.sol;
            break;
        case 'engineer':
            spend(local.resources, FABRICATION_COST);
            local.cargo.repairKits++;
            break;
        case 'botanist':
            spend(local.resources, TRAY_COST);
            local.cargo.seedPods--;
            abilities.trayHarvestSol = state.sol + 2;
            break;
        case 'pilot':
            spend(local.resources, OVERRIDE_COST);
            abilities.stormOverrideSol = state.sol;
            break;
        case 'medic': {
            const target = local.crew.find(candidate => candidate.id === targetId)!;
            local.cargo.medkits--;
            target.health = Math.max(40, target.health);
            target.morale = Math.max(40, target.morale);
            dutyStreak[target.id] = 0;
            syncMorale(local.crew, local.conditions);
            break;
        }
    }
    if (member.role !== 'scientist') abilities.used[member.role] = true;
    appendLog(state, 'good', `${member.name} · ${CREW_ABILITIES[member.role].name}.`);
    return null;
}

export function harvestTray(state: TharsisState, report: string[]): void {
    if (state.tharsis.abilities.trayHarvestSol !== state.sol) return;
    applyResourceDelta(state.resources, { food: 18 });
    state.tharsis.abilities.trayHarvestSol = null;
    report.push('Germination Tray harvested · +18 station Food.');
}

export function startRecovery(state: TharsisState, report: string[]): void {
    for (const member of state.crew) {
        const cycle = doubleShift(state, member);
        if (!cycle || cycle.recovery !== state.sol + 1) continue;
        for (const job of state.tharsis.work) if (job.leadId === member.id) job.leadId = null;
        report.push(`${member.name} enters Double Shift recovery for Sols ${cycle.recovery}–${cycle.ready - 1}. Reassign any unfinished orders.`);
    }
}
