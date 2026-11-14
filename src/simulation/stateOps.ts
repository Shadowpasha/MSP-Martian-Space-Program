import type { ResourcePool } from '../contracts/gameContract';
import { formatResource, resourceEntries } from '../data/missions';
import type { LogEntry, OutpostGameState } from './solEngine';

export const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
export const round1 = (value: number) => Math.round(value * 10) / 10;

export function applyResourceDelta(resources: ResourcePool, delta: Partial<ResourcePool>): void {
    for (const [key, value] of resourceEntries(delta)) {
        if (!value) continue;
        const max = key === 'energy' ? 120 : key === 'oxygen' ? 100 : Infinity;
        resources[key] = clamp(round1(resources[key] + value), 0, max);
    }
}

export function canAffordCost(resources: ResourcePool, cost: Partial<ResourcePool>): boolean {
    return resourceEntries(cost).every(([key, amount]) => resources[key] >= (amount ?? 0));
}

export function spend(resources: ResourcePool, cost: Partial<ResourcePool>): void {
    applyResourceDelta(resources, Object.fromEntries(resourceEntries(cost).map(([key, amount]) => [key, -amount])));
}

export function resourceChanges(before: ResourcePool, after: ResourcePool, roverUnits = false): string {
    return resourceEntries(after).reduce<string[]>((changes, [key, amount]) => {
        const delta = round1(amount - before[key]);
        if (delta) changes.push(`${delta > 0 ? '+' : ''}${roverUnits && key === 'oxygen' ? `${delta} O₂` : formatResource(key, delta)}`);
        return changes;
    }, []).join(' · ');
}

export function appendLog(state: OutpostGameState, kind: LogEntry['kind'], text: string): void {
    state.dailyLog.push({ id: state.nextLogSeq++, sol: state.sol, kind, text });
    if (state.dailyLog.length > 80) state.dailyLog.shift();
}
