import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const estellaModules = process.env.ESTELLA_MODULES
    ?? path.join(process.env.LOCALAPPDATA ?? '', 'Programs/estella-editor/resources/app.asar.unpacked/node_modules');

function resolveModule(id) {
    try {
        return require.resolve(id, { paths: [root, estellaModules] });
    } catch {
        const direct = path.join(estellaModules, id);
        if (existsSync(direct)) return direct;
        throw new Error(`Could not resolve module "${id}". Run "npm install" or set ESTELLA_MODULES.`);
    }
}

const { build } = require(resolveModule('esbuild'));
const tscBin = resolveModule('typescript/bin/tsc');

const check = spawnSync(process.execPath, [tscBin, '--noEmit', '-p', 'tsconfig.json'], {
    cwd: root,
    stdio: 'inherit',
});
if (check.status !== 0) process.exit(check.status ?? 1);

const tests = (await readdir(new URL('../tests/', import.meta.url))).filter(name => name.endsWith('.test.ts'));
await build({
    absWorkingDir: root,
    entryPoints: tests.map(name => 'tests/' + name),
    outdir: 'dist/tests',
    outExtension: { '.js': '.mjs' },
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
});
const result = spawnSync(process.execPath, ['--test', ...tests.map(name => 'dist/tests/' + name.replace(/\.ts$/, '.mjs'))], {
    cwd: root,
    stdio: 'inherit',
});
process.exit(result.status ?? 1);
