import { Storage } from 'esengine';

const SCOREBOARD_KEY = 'mars-outpost:scoreboard-v1';

/**
 * Set your Firebase Project ID here (or on globalThis.MSP_FIRESTORE_PROJECT_ID) to enable
 * the shared Firestore REST scoreboard. When empty or offline, scores persist locally.
 */
export let FIRESTORE_PROJECT_ID = 'mars-station-program';

export function setFirestoreProjectId(projectId: string): void {
    FIRESTORE_PROJECT_ID = projectId.trim();
}

function activeProjectId(): string {
    const g = globalThis as { MSP_FIRESTORE_PROJECT_ID?: unknown };
    return (typeof g.MSP_FIRESTORE_PROJECT_ID === 'string' && g.MSP_FIRESTORE_PROJECT_ID.trim()) || FIRESTORE_PROJECT_ID;
}

export interface ScoreEntry {
    id: string;
    player: string;
    mission: string;
    sols: number;
    score: number;
    createdAt: string;
}

function sortScores(entries: ScoreEntry[]): ScoreEntry[] {
    return [...entries].sort((a, b) => (b.sols - a.sols) || (b.score - a.score)).slice(0, 20);
}

export function loadLocalScores(): ScoreEntry[] {
    const raw = Storage.getJSON<unknown>(SCOREBOARD_KEY);
    if (!Array.isArray(raw)) return [];
    return sortScores(raw.filter((item): item is ScoreEntry =>
        Boolean(item) && typeof item === 'object' &&
        typeof (item as ScoreEntry).player === 'string' &&
        typeof (item as ScoreEntry).sols === 'number' &&
        typeof (item as ScoreEntry).score === 'number',
    ));
}

export function saveLocalScore(entry: Omit<ScoreEntry, 'id' | 'createdAt'>): ScoreEntry[] {
    const next: ScoreEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        createdAt: new Date().toISOString(),
    };
    const merged = sortScores([...loadLocalScores(), next]);
    Storage.setJSON(SCOREBOARD_KEY, merged);
    return merged;
}

function firestoreUrl(projectId: string): string {
    return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/scores`;
}

function decodeDoc(doc: Record<string, unknown>): ScoreEntry | null {
    const fields = doc.fields as Record<string, { stringValue?: string; integerValue?: string }> | undefined;
    if (!fields) return null;
    const player = fields.player?.stringValue;
    const mission = fields.mission?.stringValue ?? 'Infinite Survival';
    const sols = Number(fields.sols?.integerValue);
    const score = Number(fields.score?.integerValue);
    const createdAt = fields.createdAt?.stringValue ?? '';
    const name = typeof doc.name === 'string' ? doc.name.split('/').pop() ?? '' : '';
    if (!player || !Number.isFinite(sols) || !Number.isFinite(score)) return null;
    return { id: name || `${createdAt}-${player}`, player, mission, sols, score, createdAt };
}

export async function fetchScoreboard(): Promise<{ entries: ScoreEntry[]; source: 'firestore' | 'local' }> {
    const local = loadLocalScores();
    const projectId = activeProjectId();
    if (!projectId || typeof fetch !== 'function') return { entries: local, source: 'local' };
    try {
        const res = await fetch(`${firestoreUrl(projectId)}?orderBy=sols%20desc&pageSize=15`);
        if (!res.ok) return { entries: local, source: 'local' };
        const json = (await res.json()) as { documents?: Record<string, unknown>[] };
        const remote = (json.documents ?? []).map(decodeDoc).filter((x): x is ScoreEntry => x !== null);
        return { entries: sortScores([...remote, ...local]), source: 'firestore' };
    } catch {
        return { entries: local, source: 'local' };
    }
}

export async function submitScoreboardEntry(
    entry: Omit<ScoreEntry, 'id' | 'createdAt'>,
): Promise<{ savedRemote: boolean; entries: ScoreEntry[] }> {
    const entries = saveLocalScore(entry);
    const projectId = activeProjectId();
    if (!projectId || typeof fetch !== 'function') return { savedRemote: false, entries };
    try {
        const res = await fetch(firestoreUrl(projectId), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fields: {
                    player: { stringValue: entry.player.slice(0, 28) },
                    mission: { stringValue: entry.mission.slice(0, 40) },
                    sols: { integerValue: String(Math.max(0, Math.round(entry.sols))) },
                    score: { integerValue: String(Math.max(0, Math.round(entry.score))) },
                    createdAt: { stringValue: new Date().toISOString() },
                },
            }),
        });
        if (!res.ok) return { savedRemote: false, entries };
        const refreshed = await fetchScoreboard();
        return { savedRemote: true, entries: refreshed.entries };
    } catch {
        return { savedRemote: false, entries };
    }
}
