// Gemini through the local playtest server (scripts/playtest.mjs): the API key stays on the
// server, the game only calls /api/gemini-plan. Used by A.R.I.E.S. (src/services/tharsisAries.ts).
// When the server is not running, A.R.I.E.S. falls back to the authored briefings.
const GEMINI_ROUTE = '/api/gemini-plan';
let geminiModel: string | null = null;

export function getGeminiStatusLabel(): string {
    return geminiModel ? 'A.R.I.E.S. connected' : 'A.R.I.E.S. unavailable';
}

export function assistantIsAvailable(): boolean { return geminiModel !== null; }

function isLocalPlaytest(): boolean {
    return typeof location !== 'undefined' && location.protocol === 'http:' &&
        (location.hostname === '127.0.0.1' || location.hostname === 'localhost');
}

export async function checkGeminiConnection(): Promise<void> {
    if (!isLocalPlaytest()) return;
    try {
        const response = await fetch(GEMINI_ROUTE, { cache: 'no-store', signal: AbortSignal.timeout(2_000) });
        if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
            const status: { model?: string | null } = await response.json();
            geminiModel = status.model ?? null;
            return;
        }
    } catch {
        // A static export can still use the local task planner.
    }
    geminiModel = null;
}

export async function requestGemini(systemInstruction: string, input: string, options: {
    kind?: 'discussion' | 'briefing';
    timeout?: number;
    signal?: AbortSignal;
} = {}): Promise<{ text: string } | { error: string }> {
    if (!geminiModel) await checkGeminiConnection();
    if (!geminiModel) return { error: 'Gemini is unavailable.' };
    try {
        const timeout = AbortSignal.timeout(options.timeout ?? 20_000);
        const response = await fetch(GEMINI_ROUTE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: options.signal ? AbortSignal.any([timeout, options.signal]) : timeout,
            body: JSON.stringify({ systemInstruction, input, ...(options.kind && { kind: options.kind }) }),
        });
        if (!response.headers.get('content-type')?.includes('application/json')) {
            geminiModel = null;
            return { error: 'Local Gemini server is unavailable.' };
        }
        const result: { text?: string; error?: string } = await response.json();
        if (!response.ok || typeof result.text !== 'string' || !result.text.trim()) {
            geminiModel = null;
            return { error: result.error || 'Gemini returned an empty response.' };
        }
        return { text: result.text };
    } catch (error) {
        if (!options.signal?.aborted) geminiModel = null;
        return { error: error instanceof Error && error.name === 'TimeoutError'
            ? 'Gemini request timed out.' : 'Could not reach the local Gemini server.' };
    }
}
