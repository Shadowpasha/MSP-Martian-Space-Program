import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const ESTELLA_MODULES = 'C:/Users/amera/AppData/Local/Programs/estella-editor/resources/app.asar.unpacked/node_modules';
const ts = require(path.join(ESTELLA_MODULES, 'typescript'));
const esbuild = require(path.join(ESTELLA_MODULES, 'esbuild'));

// 1. Typecheck entire Estella project against staged SDK + Estella typescript-lib
const libDir = 'C:/Users/amera/AppData/Local/Programs/estella-editor/resources/typescript-lib';
const cfgPath = ts.findConfigFile(process.cwd(), ts.sys.fileExists, 'tsconfig.json');
const cfgJson = ts.readConfigFile(cfgPath, ts.sys.readFile).config;
const parsed = ts.parseJsonConfigFileContent(cfgJson, ts.sys, process.cwd());
const host = ts.createCompilerHost(parsed.options);
const origGetSourceFile = host.getSourceFile.bind(host);
host.getSourceFile = (fileName, lang, onError, shouldCreate) => {
    const base = path.basename(fileName);
    const alt = path.join(libDir, base);
    if (base.startsWith('lib.') && base.endsWith('.d.ts') && fs.existsSync(alt)) {
        return origGetSourceFile(alt, lang, onError, shouldCreate);
    }
    return origGetSourceFile(fileName, lang, onError, shouldCreate);
};
const prog = ts.createProgram(parsed.fileNames, parsed.options, host);
const diags = ts.getPreEmitDiagnostics(prog);
if (diags.length > 0) {
    for (const d of diags) {
        const loc = d.file ? `${d.file.fileName}:${d.file.getLineAndCharacterOfPosition(d.start).line + 1}` : '';
        console.error(`${loc} TS${d.code}: ${ts.flattenDiagnosticMessageText(d.messageText, '\n')}`);
    }
    process.exit(1);
}
console.log('[typecheck] PASSED (0 errors)');

// 2. Bundle and run simulation + planner unit tests with esbuild + node --test
const outBundle = path.join(process.cwd(), 'dist', 'solEngine.test.mjs');
fs.mkdirSync(path.dirname(outBundle), { recursive: true });
await esbuild.build({
    entryPoints: ['tests/solEngine.test.ts'],
    bundle: true,
    platform: 'node',
    format: 'esm',
    packages: 'external',
    outfile: outBundle,
});
const res = spawnSync(process.execPath, ['--test', outBundle], { stdio: 'inherit' });
process.exit(res.status ?? 1);
