// Mission Prep tests: bundles tests/prep.test.ts with the Estella editor's esbuild
// (same approach as scripts/verify.mjs) and runs it with node --test.
// Typechecking of src/prep/** is covered by `node scripts/verify.mjs`.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const ESTELLA_MODULES = process.env.ESTELLA_MODULES
    ?? path.join(process.env.LOCALAPPDATA ?? '', 'Programs/estella-editor/resources/app.asar.unpacked/node_modules');
const esbuild = require(path.join(ESTELLA_MODULES, 'esbuild'));

const outBundle = path.join(process.cwd(), 'dist', 'prep.test.mjs');
fs.mkdirSync(path.dirname(outBundle), { recursive: true });
await esbuild.build({
    entryPoints: ['tests/prep.test.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    outfile: outBundle,
    logLevel: 'warning',
});
const res = spawnSync(process.execPath, ['--test', outBundle], { stdio: 'inherit' });
process.exit(res.status ?? 1);
