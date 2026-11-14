import { clamp, round1 } from './stateOps';

export const LOW_MORALE = 60;
export const SEVERE_MORALE = 35;
export const FIELD_REST_MORALE = 20;
export const REST_MORALE = 12;

export function dutyMoraleLoss(streak: number): number {
    return Math.min(8, 1 + (streak - 1) * 2.5);
}

export function moralePace(morale: number): number {
    return morale < SEVERE_MORALE ? 0.5 : morale < LOW_MORALE ? 0.75 : 1;
}

export function heatingPower(temperatureC: number): number {
    return Math.max(0, Math.ceil((-65 - temperatureC) / 10));
}

export function radiationAfterDose(radiation: number, dose: number): number {
    return clamp(round1(radiation + dose), 0, 100);
}

export function radiationEffects(dose: number) {
    if (dose >= 75) return { level: 'Dangerous', health: 12, morale: 12, exteriorHold: true };
    if (dose >= 50) return { level: 'High', health: 5, morale: 7, exteriorHold: false };
    if (dose >= 30) return { level: 'Elevated', health: 2, morale: 3, exteriorHold: false };
    return { level: 'Safe', health: 0, morale: 0, exteriorHold: false };
}
