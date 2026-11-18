// The game server: serves the Estella web export.
//
// Locally: `npm run playtest` (http://127.0.0.1:4173).
//   MSP_HOST / MSP_PORT Listen address and port (default 127.0.0.1:4173).
//   MSP_BUILD_DIR       Folder with the web export (default dist/web).
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, isAbsolute, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';
import { gzipSync } from 'node:zlib';

let localEnv = {};
try {
    localEnv = parseEnv(await readFile(new URL('../.env', import.meta.url), 'utf8'));
} catch (error) {
    if (error.code !== 'ENOENT') throw error;
}
const env = name => process.env[name]?.trim() || localEnv[name]?.trim() || '';
const count = (name, fallback) => {
    const value = Number(env(name));
    return env(name) && Number.isFinite(value) && value >= 0 ? value : fallback;
};

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const buildDir = resolve(isAbsolute(env('MSP_BUILD_DIR')) ? env('MSP_BUILD_DIR') : resolve(repoRoot, env('MSP_BUILD_DIR') || 'dist/web'));
const host = env('MSP_HOST') || '127.0.0.1';
const port = count('MSP_PORT', count('MSP_PLAYTEST_PORT', 4173));

const types = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json', '.esscene': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png',
    '.ttf': 'font/ttf', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
};
const siteFiles = new Map(['/favicon.ico', '/apple-touch-icon.png'].map(path => [path, resolve(repoRoot, 'deploy/web' + path)]));
const compressible = new Set(['.html', '.js', '.css', '.json', '.esscene', '.wasm', '.svg', '.ttf']);

let hasWebExport = true;
try {
    await stat(resolve(buildDir, 'index.html'));
} catch {
    hasWebExport = false;
    console.log(`No web export in ${buildDir} (nothing to serve yet; build dist/web in Estella).`);
}

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
        const parts = decodeURIComponent(url.pathname).split('/');
        if (parts.some(part => part.startsWith('.') || part.includes('\\'))) {
            response.writeHead(404).end();
            return;
        }
        const siteFile = siteFiles.get(url.pathname);
        if (!siteFile && !hasWebExport) {
            response.writeHead(404).end();
            return;
        }
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
    console.log('Offline-first build · A.R.I.E.S. runs locally with zero external API dependencies.');
});
