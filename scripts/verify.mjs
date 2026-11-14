import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL('../', import.meta.url));
const check = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '--noEmit', '-p', 'tsconfig.json'], {
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
