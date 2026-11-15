import { clamp, round1 } from './stateOps';

export const LOW_MORALE = 50;
export const SEVERE_MORALE = 25;
export const FIELD_REST_MORALE = 20;
export const REST_MORALE = 12;

export function dutyMoraleLoss(streak: number): number {
    return Math.min(4, 0.5 + (streak - 1) * 1.2);
}

export function moralePace(morale: number): number {
    return morale < SEVERE_MORALE ? 0.75 : morale < LOW_MORALE ? 0.85 : 1;
}

export function heatingPower(temperatureC: number): number {
    return Math.max(0, Math.ceil((-65 - temperatureC) / 10));
}

export function radiationAfterDose(radiation: number, dose: number): number {
    return clamp(round1(radiation + dose), 0, 100);
}

export function radiationEffects(dose: number) {
    if (dose >= 80) return { level: 'Dangerous', health: 8, morale: 8, exteriorHold: true };
    if (dose >= 60) return { level: 'High', health: 4, morale: 4, exteriorHold: false };
    if (dose >= 35) return { level: 'Elevated', health: 1, morale: 2, exteriorHold: false };
    return { level: 'Safe', health: 0, morale: 0, exteriorHold: false };
}
