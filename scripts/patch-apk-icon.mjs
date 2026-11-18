// Patch the exported Android APK with deploy/android/ic_launcher.png and re-sign it (v2/v3).
// Usage: npm.cmd run apk:icon
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const apkPath = resolve(root, 'dist-android/marsstationprogram.apk');
const iconPath = resolve(root, 'deploy/android/ic_launcher.png');
const unsignedApk = resolve(root, 'dist-android/marsstationprogram-unsigned.apk');
const signedDir = resolve(root, 'dist-android/signed');
const signerJar = join(tmpdir(), 'uber-apk-signer-1.3.0.jar');
const signerUrl = 'https://github.com/patrickfav/uber-apk-signer/releases/download/v1.3.0/uber-apk-signer-1.3.0.jar';

if (!existsSync(apkPath)) {
    console.error(`Missing APK: ${apkPath}. Export it from Estella first.`);
    process.exit(1);
}
if (!existsSync(iconPath)) {
    console.error(`Missing icon: ${iconPath}`);
    process.exit(1);
}

console.log('1/3 Patching res/mipmap-xxxhdpi/ic_launcher.png...');
const pyScript = `
import zipfile
with zipfile.ZipFile(r"${apkPath}", "r") as zin, zipfile.ZipFile(r"${unsignedApk}", "w") as zout:
    icon_bytes = open(r"${iconPath}", "rb").read()
    for info in zin.infolist():
        if info.filename.startswith("META-INF/"):
            continue
        data = icon_bytes if info.filename == "res/mipmap-xxxhdpi/ic_launcher.png" else zin.read(info.filename)
        zout.writestr(info, data, compress_type=info.compress_type)
`;
execFileSync('python', ['-c', pyScript], { stdio: 'inherit' });

if (!existsSync(signerJar) || statSync(signerJar).size < 1_000_000) {
    console.log('2/3 Downloading uber-apk-signer-1.3.0.jar to temp folder...');
    execFileSync('powershell', [
        '-NoProfile', '-Command',
        `Invoke-WebRequest -Uri '${signerUrl}' -OutFile '${signerJar}'`,
    ], { stdio: 'inherit' });
} else {
    console.log('2/3 Using cached uber-apk-signer-1.3.0.jar...');
}

console.log('3/3 Zipaligning and signing APK...');
rmSync(signedDir, { recursive: true, force: true });
mkdirSync(signedDir, { recursive: true });
execFileSync('java', ['-jar', signerJar, '--apks', unsignedApk, '--out', signedDir], { stdio: 'inherit' });
rmSync(unsignedApk, { force: true });

console.log(`Done! Signed APK ready at: ${join(signedDir, 'marsstationprogram-aligned-debugSigned.apk')}`);
