import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { ApiError, GoogleGenAI } from '@google/genai';

const buildDir = fileURLToPath(new URL('../dist/web/', import.meta.url));
const types = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png', '.ttf': 'font/ttf',
};
const port = Number(process.env.MSP_PLAYTEST_PORT ?? 4173);
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
    console.error('Export the project as Web into dist/web in Estella Editor first.');
    process.exit(1);
}

let localEnv = {};
try {
    localEnv = parseEnv(await readFile(new URL('../.env', import.meta.url), 'utf8'));
} catch (error) {
    if (error.code !== 'ENOENT') throw error;
}
const apiKey = process.env.GEMINI_API_KEY?.trim() || localEnv.GEMINI_API_KEY?.trim()
    || process.env.VITE_GEMINI_API_KEY?.trim() || localEnv.VITE_GEMINI_API_KEY?.trim();
const model = process.env.GEMINI_MODEL?.trim() || localEnv.GEMINI_MODEL?.trim() || modelName;
const gemini = apiKey ? new GoogleGenAI({ apiKey, apiVersion: 'v1beta' }) : null;

function sendJson(response, status, data) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(data));
}

async function handlePlanner(request, response) {
    const host = request.headers.host;
    if (![`127.0.0.1:${port}`, `localhost:${port}`].includes(host) ||
        (request.headers.origin && request.headers.origin !== `http://${host}`)) {
        sendJson(response, 403, { error: 'Open the planner from the local game.' });
        return;
    }
    if (request.method === 'GET') {
        sendJson(response, 200, { model: gemini ? model : null });
        return;
    }
    if (request.method !== 'POST' || request.headers['content-type']?.split(';')[0]?.trim() !== 'application/json') {
        sendJson(response, 400, { error: 'Expected a JSON task request.' });
        return;
    }
    if (!gemini) {
        sendJson(response, 503, { error: 'Gemini key is missing from the local playtest server.' });
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
            sendJson(response, 502, { error: 'Gemini returned an empty response.' });
            return;
        }
        if (kind && !isJsonObject(output)) {
            sendJson(response, 502, { error: 'Gemini returned an incomplete gameplay response.' });
            return;
        }
        sendJson(response, 200, { text: output });
    } catch (error) {
        const status = error instanceof ApiError || typeof error?.status === 'number' ? error.status : null;
        const reason = status === 429 ? 'Gemini quota or rate limit reached.'
            : status === 401 || status === 403 ? 'Gemini rejected the local API key.'
            : status ? `Gemini request failed (HTTP ${status}).` : 'Could not reach Gemini.';
        sendJson(response, 502, { error: reason });
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
        const file = resolve(buildDir, '.' + url.pathname, url.pathname.endsWith('/') ? 'index.html' : '');
        if (!file.startsWith(resolve(buildDir) + sep)) {
            response.writeHead(404).end();
            return;
        }
        const info = await stat(file);
        if (!info.isFile()) {
            response.writeHead(404).end();
            return;
        }
        response.writeHead(200, {
            'Content-Type': types[extname(file)] ?? 'application/octet-stream',
            'Content-Length': info.size, 'Cache-Control': 'no-store',
        });
        if (request.method === 'HEAD') response.end();
        else createReadStream(file).pipe(response);
    } catch {
        response.writeHead(404).end();
    }
}).listen(port, '127.0.0.1', () => {
    console.log(`Mars Station Program · http://127.0.0.1:${port}/`);
    console.log(gemini ? `Gemini ready · ${model}` : 'Offline planner · no Gemini API key configured');
});
