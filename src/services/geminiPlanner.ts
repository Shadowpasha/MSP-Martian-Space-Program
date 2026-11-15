// Gemini through the game's own server (scripts/playtest.mjs, locally or in Docker): the API key
// stays on the server, the game only calls /api/gemini-plan on the address it was opened from. Used by A.R.I.E.S. (src/services/tharsisAries.ts).
// When the server is not running, A.R.I.E.S. falls back to the authored briefings.
const GEMINI_ROUTE = '/api/gemini-plan';
const LOCAL_GEMINI_ROUTE = 'http://127.0.0.1:4173/api/gemini-plan';
let geminiModel: string | null = null;
let activeRoute: string | null = null;

/**
 * A page served over the web (local playtest or a deployed site), or a local preview (e.g. Estella Editor)
 * talking to the local playtest server on 127.0.0.1:4173.
 */
function candidateRoutes(): string[] {
    const served = typeof location !== 'undefined' && (location.protocol === 'http:' || location.protocol === 'https:');
    if (!served) return [LOCAL_GEMINI_ROUTE];
    return location.origin === 'http://127.0.0.1:4173' ? [GEMINI_ROUTE] : [GEMINI_ROUTE, LOCAL_GEMINI_ROUTE];
}

export async function checkGeminiConnection(signal?: AbortSignal): Promise<boolean> {
    if (signal?.aborted) return false;
    let model: string | null = null;
    let matchedRoute: string | null = null;
    for (const route of candidateRoutes()) {
        if (signal?.aborted) return false;
        try {
            const timeout = AbortSignal.timeout(2_000);
            const response = await fetch(route, { cache: 'no-store', signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
            if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
                const status: { model?: unknown } | null = await response.json();
                if (typeof status?.model === 'string' && status.model.trim()) {
                    model = status.model;
                    matchedRoute = route;
                    break;
                }
            }
        } catch {
            // Try next candidate route or fall back to authored briefings.
        }
    }
    if (!signal?.aborted) {
        geminiModel = model;
        activeRoute = matchedRoute;
    }
    return Boolean(model) && !signal?.aborted;
}

export async function requestGemini(systemInstruction: string, input: string, options: {
    kind?: 'discussion' | 'briefing';
    timeout?: number;
    signal?: AbortSignal;
} = {}): Promise<{ text: string } | { error: string }> {
    if (options.signal?.aborted) return { error: 'Request canceled.' };
    if (!geminiModel) await checkGeminiConnection(options.signal);
    if (options.signal?.aborted) return { error: 'Request canceled.' };
    if (!geminiModel) return { error: 'Gemini is unavailable.' };
    try {
        const timeout = AbortSignal.timeout(options.timeout ?? 20_000);
        const response = await fetch(activeRoute ?? GEMINI_ROUTE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: options.signal ? AbortSignal.any([timeout, options.signal]) : timeout,
            body: JSON.stringify({ systemInstruction, input, ...(options.kind && { kind: options.kind }) }),
        });
        if (options.signal?.aborted) return { error: 'Request canceled.' };
        if (!response.headers.get('content-type')?.includes('application/json')) {
            geminiModel = null;
            return { error: 'Local Gemini server is unavailable.' };
        }
        const result: { text?: string; error?: string } = await response.json();
        if (options.signal?.aborted) return { error: 'Request canceled.' };
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
