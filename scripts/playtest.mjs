import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const buildDir = fileURLToPath(new URL('../dist/web/', import.meta.url));
const types = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json', '.wasm': 'application/wasm', '.png': 'image/png', '.ttf': 'font/ttf',
};
const port = Number(process.env.MSP_PLAYTEST_PORT ?? 4173);

try {
    await stat(resolve(buildDir, 'index.html'));
} catch {
    console.error('Export the project as Web into dist/web in Estella Editor first.');
    process.exit(1);
}

createServer(async (request, response) => {
    try {
        const url = new URL(request.url, 'http://localhost');
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
});
