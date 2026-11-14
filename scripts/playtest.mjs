// The game server: serves the Estella web export and the A.R.I.E.S. Gemini route.
//
// Locally: `npm run playtest` (http://127.0.0.1:4173). On a server: the Docker image runs this same
// script. Everything is configured with environment variables (or a .env file next to package.json);
// see deploy/.env.example. Nothing about a particular deployment is written in the code.
//
//   MSP_PUBLIC_URL      Public address(es) of the game, comma-separated, e.g. https://msp.example.com.
//                       A.R.I.E.S. only answers pages opened from these or from localhost.
//   GEMINI_API_KEY      Turns A.R.I.E.S. on. Without it the game uses its authored briefings.
//   GEMINI_MODEL        Gemini model (default gemini-3-flash-preview).
//   MSP_AI_PER_MINUTE   A.R.I.E.S. requests per visitor per minute (default 6).
//   MSP_AI_PER_DAY      A.R.I.E.S. requests per day for the whole server (default 300).
//   MSP_HOST / MSP_PORT Listen address and port (default 127.0.0.1:4173).
//   MSP_BUILD_DIR       Folder with the web export (default dist/web).
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { gzipSync } from 'node:zlib';
import { ApiError, GoogleGenAI } from '@google/genai';

let localEnv = {};
try {
    localEnv = parseEnv(await readFile(new URL('../.env', import.meta.url), 'utf8'));
} catch (error) {
    if (error.code !== 'ENOENT') throw error;
}
/** A setting from the environment, or from the .env file beside package.json. */
const env = name => process.env[name]?.trim() || localEnv[name]?.trim() || '';
const count = (name, fallback) => {
    const value = Number(env(name));
    return env(name) && Number.isFinite(value) && value >= 0 ? value : fallback;
};

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const buildDir = resolve(isAbsolute(env('MSP_BUILD_DIR')) ? env('MSP_BUILD_DIR') : resolve(repoRoot, env('MSP_BUILD_DIR') || 'dist/web'));
const host = env('MSP_HOST') || '127.0.0.1';
const port = count('MSP_PORT', count('MSP_PLAYTEST_PORT', 4173));
const publicOrigins = env('MSP_PUBLIC_URL').split(',').map(url => url.trim()).filter(Boolean).map(url => {
    try { return new URL(url).origin; } catch { throw new Error(`MSP_PUBLIC_URL has an invalid address: ${url}`); }
});
const allowedOrigins = new Set([`http://127.0.0.1:${port}`, `http://localhost:${port}`, ...publicOrigins]);
const perMinute = count('MSP_AI_PER_MINUTE', 6);
const perDay = count('MSP_AI_PER_DAY', 300);

const types = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json', '.esscene': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png',
    '.ttf': 'font/ttf', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};
/**
 * Site files the Estella export does not make (it rewrites index.html on every export, so there is no
 * <link rel="icon">). Browsers ask for /favicon.ico and /apple-touch-icon.png on their own.
 */
const siteFiles = new Map(['/favicon.ico', '/apple-touch-icon.png'].map(path => [path, resolve(repoRoot, 'deploy/web' + path)]));
/**
 * Gemini failures are answered with 503, never 502 or 504: Cloudflare replaces an origin's 502/504 with
 * its own HTML error page, the game cannot read that, and the player never sees the reason.
 */
const upstreamFailed = 503;
/** Text and WebAssembly shrink a lot with gzip; images and audio are already compressed. */
const compressible = new Set(['.html', '.js', '.css', '.json', '.esscene', '.wasm', '.svg', '.ttf']);
const modelName = 'gemini-3-flash-preview';
const maxPlannerRequestBytes = 32_768;
const string = { type: 'string' };
const object = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const array = (items, minItems, maxItems) => ({ type: 'array', items, minItems, maxItems });
const optionalObject = (properties, required = []) => ({ ...object(properties), required });
const integer = { type: 'integer' };
const resourcePool = optionalObject({ energy: integer, food: integer, water: integer, oxygen: integer, res: integer });
const schemas = {
    discussion: optionalObject({
        message: string,
        draft: optionalObject({
            kind: { type: 'string', enum: ['procedure', 'custom', 'clear'] }, orderId: string, reviseId: string,
            techniques: array(string, 0, 2), leadRole: string,
            task: optionalObject({ title: string, description: string, category: string, shifts: integer, cost: resourcePool,
                output: resourcePool, exterior: { type: 'boolean' }, decommission: string },
            ['title', 'description', 'category', 'shifts', 'cost', 'output']),
        }, ['kind']),
    }, ['message']),
    briefing: object({ title: string, observation: string, system: string, choices: array(object({
        action: string, detail: string, result: string, commitment: string, cargo: string,
        effects: array(object({ id: string, severity: { type: 'integer', minimum: 1, maximum: 2 } }), 1, 2),
    }), 2, 3) }),
};

try {
    await stat(resolve(buildDir, 'index.html'));
} catch {
    console.error(`No web export in ${buildDir}. Export the project as Web into dist/web in Estella Editor first.`);
    process.exit(1);
}

const apiKey = env('GEMINI_API_KEY') || env('VITE_GEMINI_API_KEY');
const model = env('GEMINI_MODEL') || modelName;
const gemini = apiKey ? new GoogleGenAI({ apiKey, apiVersion: 'v1beta' }) : null;

function sendJson(response, status, data) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(data));
}

/** The visitor's address: Cloudflare and other proxies pass it on in a header. */
function visitor(request) {
    const forwarded = request.headers['cf-connecting-ip'] ?? request.headers['x-forwarded-for']?.split(',')[0];
    return (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.trim() || request.socket.remoteAddress || 'unknown';
}

const recent = new Map();
let today = new Date().toISOString().slice(0, 10);
let usedToday = 0;

/** A reason to refuse this request, or null. Counts it when it is allowed. */
function rateLimit(request) {
    const now = Date.now();
    const day = new Date(now).toISOString().slice(0, 10);
    if (day !== today) { today = day; usedToday = 0; recent.clear(); }
    if (usedToday >= perDay) return 'A.R.I.E.S. reached today’s limit. The briefings continue without it.';
    const id = visitor(request);
    const times = (recent.get(id) ?? []).filter(time => now - time < 60_000);
    if (times.length >= perMinute) return 'A.R.I.E.S. is busy. Try again in a minute.';
    times.push(now);
    recent.set(id, times);
    usedToday++;
    return null;
}

async function handlePlanner(request, response) {
    if (request.method === 'GET') {
        sendJson(response, 200, { model: gemini && perDay > 0 ? model : null });
        return;
    }
    // Only pages of this game may use the key: browsers always send Origin with a POST.
    if (!allowedOrigins.has(request.headers.origin ?? '')) {
        sendJson(response, 403, { error: 'Open A.R.I.E.S. from the game. (Is MSP_PUBLIC_URL set to this site?)' });
        return;
    }
    if (request.method !== 'POST' || request.headers['content-type']?.split(';')[0]?.trim() !== 'application/json') {
        sendJson(response, 400, { error: 'Expected a JSON task request.' });
        return;
    }
    if (!gemini) {
        sendJson(response, 503, { error: 'No Gemini API key is set on this server.' });
        return;
    }
    const limited = rateLimit(request);
    if (limited) {
        sendJson(response, 429, { error: limited });
        return;
    }

    const chunks = [];
    let bytes = 0;
    for await (const chunk of request.iterator({ destroyOnReturn: false })) {
        bytes += chunk.length;
        if (bytes > maxPlannerRequestBytes) {
            request.resume();
            sendJson(response, 413, { error: 'Task request is too large.' });
            return;
        }
        chunks.push(chunk);
    }
    let plan;
    try {
        plan = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
        sendJson(response, 400, { error: 'Invalid task request JSON.' });
        return;
    }
    const { systemInstruction, input, kind } = plan ?? {};
    if (typeof systemInstruction !== 'string' || !systemInstruction.trim() || typeof input !== 'string' || !input.trim()) {
        sendJson(response, 400, { error: 'The task request needs an instruction and a prompt.' });
        return;
    }
    if (kind !== undefined && kind !== 'discussion' && kind !== 'briefing') {
        sendJson(response, 400, { error: 'Unknown gameplay request type.' });
        return;
    }

    try {
        const result = await gemini.interactions.create({
            model,
            system_instruction: systemInstruction,
            input,
            store: false,
            generation_config: {
                temperature: 0.4,
                ...(kind && { max_output_tokens: 3200 }),
                ...(kind && /^gemini-3(?:\.\d+)?-flash/.test(model) && { thinking_level: 'minimal' }),
            },
            ...(kind && { response_format: { type: 'text', mime_type: 'application/json', schema: schemas[kind] } }),
        }, { retries: { strategy: 'none' }, timeout_ms: 18_000 });
        const output = result.output_text?.trim() || result.outputs?.map(part => part.text ?? '').join('').trim();
        if (!output) {
            console.warn(`A.R.I.E.S. ${kind ?? 'plan'} · Gemini returned an empty response (${result.status ?? 'no status'})`);
            sendJson(response, upstreamFailed, { error: 'Gemini returned an empty response.' });
            return;
        }
        if (kind && !isJsonObject(output)) {
            console.warn(`A.R.I.E.S. ${kind} · Gemini returned incomplete JSON (${output.length} chars)`);
            sendJson(response, upstreamFailed, { error: 'Gemini returned an incomplete gameplay response.' });
            return;
        }
        sendJson(response, 200, { text: output });
    } catch (error) {
        const status = error instanceof ApiError || typeof error?.status === 'number' ? error.status : null;
        const reason = status === 429 ? 'Gemini quota or rate limit reached.'
            : status === 401 || status === 403 ? 'Gemini rejected the server’s API key.'
            : status === 503 ? 'Gemini is overloaded. Try again shortly.'
            : status ? `Gemini request failed (HTTP ${status}).` : 'Could not reach Gemini.';
        console.warn(`A.R.I.E.S. ${kind ?? 'plan'} · ${reason} ${String(error?.message ?? error).slice(0, 300)}`);
        sendJson(response, upstreamFailed, { error: reason });
    }
}

function isJsonObject(text) {
    try {
        const value = JSON.parse(text);
        return value !== null && typeof value === 'object' && !Array.isArray(value);
    } catch {
        return false;
    }
}

/** Gzipped files, made once per file version and kept in memory (the whole export is a few MB). */
const zipped = new Map();
async function gzipped(file, version) {
    const cached = zipped.get(file);
    if (cached?.version === version) return cached.body;
    const body = gzipSync(await readFile(file), { level: 9 });
    zipped.set(file, { version, body });
    return body;
}

createServer(async (request, response) => {
    try {
        const url = new URL(request.url, 'http://localhost');
        if (url.pathname === '/api/gemini-plan') {
            await handlePlanner(request, response);
            return;
        }
        const parts = decodeURIComponent(url.pathname).split('/');
        if (parts.some(part => part.startsWith('.') || part.includes('\\'))) {
            response.writeHead(404).end();
            return;
        }
        const siteFile = siteFiles.get(url.pathname);
        const file = siteFile ?? resolve(buildDir, '.' + url.pathname, url.pathname.endsWith('/') ? 'index.html' : '');
        if (!siteFile && !file.startsWith(resolve(buildDir) + sep)) {
            response.writeHead(404).end();
            return;
        }
        const info = await stat(file);
        if (!info.isFile()) {
            response.writeHead(404).end();
            return;
        }
        const type = extname(file);
        // The export names assets/ and chunks/ files by their content, so they can be cached for good
        // (Cloudflare then serves them); everything else is revalidated so a new release shows at once.
        const cache = /^\/(assets|chunks)\//.test(url.pathname) ? 'public, max-age=31536000, immutable' : 'no-cache';
        const headers = { 'Content-Type': types[type] ?? 'application/octet-stream', 'Cache-Control': cache, Vary: 'Accept-Encoding' };
        if (compressible.has(type) && /\bgzip\b/.test(request.headers['accept-encoding'] ?? '')) {
            const body = await gzipped(file, info.mtimeMs);
            response.writeHead(200, { ...headers, 'Content-Encoding': 'gzip', 'Content-Length': body.length });
            response.end(request.method === 'HEAD' ? undefined : body);
            return;
        }
        response.writeHead(200, { ...headers, 'Content-Length': info.size });
        if (request.method === 'HEAD') response.end();
        else createReadStream(file).pipe(response);
    } catch {
        response.writeHead(404).end();
    }
}).listen(port, host, () => {
    console.log(`Mars Station Program · http://${host === '0.0.0.0' ? '127.0.0.1' : host}:${port}/`);
    for (const origin of publicOrigins) console.log(`Public address · ${origin}`);
    console.log(!gemini ? 'A.R.I.E.S. off · no GEMINI_API_KEY (the game uses its authored briefings)'
        : perDay === 0 ? 'A.R.I.E.S. off · MSP_AI_PER_DAY is 0'
        : `A.R.I.E.S. ready · ${model} · ${perMinute}/min per visitor · ${perDay}/day`);
});
