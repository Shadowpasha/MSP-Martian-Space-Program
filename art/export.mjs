// Usage: node art/export.mjs <pngjs entrypoint> [path to MSP_All_Assets]
// The source atlas is already in this folder. Pass the source pack to regenerate it.
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { PNG } = require(path.resolve(process.argv[2]));
const art = fileURLToPath(new URL('.', import.meta.url));
const root = path.join(art, '..');
const textures = path.join(root, 'assets/textures');
const image = (width, height) => new PNG({ width, height });
const read = name => PNG.sync.read(fs.readFileSync(name));
const write = (name, data) => fs.writeFileSync(name, PNG.sync.write(data));

function put(img, x, y, rgba) {
    if (x >= 0 && x < img.width && y >= 0 && y < img.height) img.data.set(rgba, 4 * (y * img.width + x));
}

function resize(src, width, height, crop = [0, 0, src.width, src.height]) {
    const out = image(width, height);
    const [left, top, clippedWidth, clippedHeight] = crop;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const sx = left + Math.floor((x + 0.5) * clippedWidth / width);
            const sy = top + Math.floor((y + 0.5) * clippedHeight / height);
            const off = 4 * (sy * src.width + sx);
            put(out, x, y, src.data.subarray(off, off + 4));
        }
    }
    return out;
}

function blit(src, dst, x, y) {
    for (let j = 0; j < src.height; j++) {
        for (let i = 0; i < src.width; i++) {
            const offset = 4 * (j * src.width + i);
            put(dst, x + i, y + j, src.data.subarray(offset, offset + 4));
        }
    }
}

function writeMeta(file, type, importer) {
    const target = file + '.meta';
    const previous = fs.existsSync(target) ? JSON.parse(fs.readFileSync(target, 'utf8')) : {};
    const settings = { uuid: previous.uuid ?? randomUUID(), version: '2.0', type, ...(importer && { importer }) };
    fs.writeFileSync(target, JSON.stringify(settings, null, 2) + '\n');
}

function exportPng(name, data) {
    const file = path.join(textures, name);
    write(file, data);
    writeMeta(file, 'texture', {
        maxSize: 2048, filterMode: 'nearest', wrapMode: 'clamp', mipmaps: false, premultiplyAlpha: false,
        sliceBorder: { left: 0, right: 0, top: 0, bottom: 0 },
    });
}

const station = read(path.join(art, 'menu_station_source.png'));
exportPng('menu_station.png', resize(station, 640, 360));
for (const name of ['tharsis_station', 'tharsis_site']) {
    exportPng(name + '.png', resize(read(path.join(art, name + '_source.png')), 640, 360));
}
const sidebar = resize(station, 124, 252, [540, 116, 295, 600]);
for (let i = 0; i < sidebar.data.length; i += 4) {
    const y = Math.floor((i / 4) / sidebar.width);
    const amount = Math.min(0.93, (1 - y / sidebar.height) * 0.93 + 0.16);
    for (const [ch, base] of [30, 29, 48].entries()) sidebar.data[i + ch] = Math.round(sidebar.data[i + ch] * (1 - amount) + base * amount);
}
exportPng('menu_landscape.png', sidebar);

const sheet = read(path.join(art, 'crew_portraits_source.png'));
const roles = ['engineer', 'botanist', 'pilot', 'medic', 'scientist', 'captain'];
const cuts = [];
for (const [index, role] of roles.entries()) {
    const width = sheet.width / 3;
    const height = sheet.height / 2;
    const tile = resize(sheet, width, height, [(index % 3) * width, Math.floor(index / 3) * height, width, height]);
    let x0 = width, y0 = height, x1 = -1, y1 = -1;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const off = 4 * (y * width + x);
            const [r, g, b] = tile.data.subarray(off, off + 3);
            if (r > 155 && g < 115 && b > 103 && b > g * 1.45 && r > g * 1.8) {
                tile.data[off + 3] = 0;
            } else {
                x0 = Math.min(x0, x); y0 = Math.min(y0, y);
                x1 = Math.max(x1, x); y1 = Math.max(y1, y);
            }
        }
    }
    cuts.push({ role, tile, x0, y0, sw: x1 - x0 + 1, sh: y1 - y0 + 1 });
}
// One scale for all six (the largest that fits every bust in 62x76), so heads match across portraits.
const factor = Math.min(...cuts.map(({ sw, sh }) => Math.min(62 / sw, 76 / sh)));
for (const { role, tile, x0, y0, sw, sh } of cuts) {
    const dw = Math.round(sw * factor);
    const dh = Math.round(sh * factor);
    const portrait = image(64, 80);
    blit(resize(tile, dw, dh, [x0, y0, sw, sh]), portrait, Math.floor((64 - dw) / 2), 80 - dh);
    exportPng('crew_' + role + '.png', portrait);
}

const locked = image(56, 68);
for (let y = 0; y < 68; y++) {
    for (let x = 0; x < 56; x++) {
        const helmet = ((x - 28) / 17) ** 2 + ((y - 23) / 20) ** 2 <= 1;
        const shoulders = ((x - 28) / 27) ** 2 + ((y - 65) / 26) ** 2 <= 1;
        if (helmet || shoulders) put(locked, x, y, [24, 23, 37, 255]);
    }
}
exportPng('crew_locked.png', locked);

const glyphs = {
    play: ['#.......', '###.....', '#####...', '#######.', '#######.', '#####...', '###.....', '#.......'],
    crew: ['..##..##', '..##..##', '........', '.####.##', '######.#', '######.#', '######..', '........'],
    upgrade: ['...##...', '..####..', '.######.', '########', '..####..', '..####..', '..####..', '..####..'],
    quit: ['...##...', '...##...', '.# .#.#.', '#..##..#', '#......#', '#......#', '.######.', '..####..'],
    back: ['...##...', '..##....', '.##.....', '########', '########', '.##.....', '..##....', '...##...'],
    pilot: ['...##...', '...##...', '..####..', '########', '...##...', '...##...', '..####..', '........'],
    mars: ['..####..', '.######.', '########', '####.#.#', '##..####', '########', '.######.', '..####..'],
    moon: ['...####.', '..###...', '.###....', '.###....', '.####...', '.#####.#', '..#####.', '...###..'],
    rover: ['...####.', '..#####.', '..#...#.', '########', '########', '#.#..#.#', '.##..##.', '........'],
    waterCanisters: ['..###...', '..###...', '.######.', '.##..##.', '.##..##.', '.##..##.', '.######.', '.######.'],
    oxygenTanks: ['..####..', '...##...', '..####..', '.######.', '.#.##.#.', '.#.##.#.', '.######.', '..####..'],
};

function draw(mask) {
    const out = image(32, 32);
    mask.forEach((row, y) => Array.from(row).forEach((pixel, x) => {
        if (pixel !== '#') return;
        for (let j = 0; j < 3; j++) {
            for (let i = 0; i < 3; i++) put(out, 4 + x * 3 + i, 4 + y * 3 + j, [255, 255, 255, 255]);
        }
    }));
    return out;
}

const rolesDir = 'icons_tasks_roles_states/';
const resourcesDir = 'icons_resources/';
const cargoDir = 'icons_extra_resources_cargo_weather/';
const upgradesDir = 'icons_upgrades/';
const supplied = {
    settings: rolesDir + 'ui_icon_role_mechanic_24.png', lock: rolesDir + 'ui_icon_lock_24.png',
    check: rolesDir + 'ui_icon_check_24.png', engineer: rolesDir + 'ui_icon_role_engineer_24.png',
    botanist: cargoDir + 'ui_icon_food_24.png', medic: rolesDir + 'ui_icon_role_medic_24.png',
    scientist: rolesDir + 'ui_icon_role_scientist_24.png', captain: rolesDir + 'ui_icon_role_captain_24.png',
    power: resourcesDir + 'ui_icon_pwr_24.png', oxygen: upgradesDir + 'tech_oxygen_recycling_i_32.png',
    water: cargoDir + 'ui_icon_water_24.png', food: upgradesDir + 'tech_greenhouse_32.png',
    solar: upgradesDir + 'tech_dust_cleaning_panels_32.png', radiation: upgradesDir + 'tech_radiation_shelter_32.png',
    circuit: upgradesDir + 'tech_battery_bank_32.png', windSampler: cargoDir + 'item_wind_sampler_32.png',
    repairKits: cargoDir + 'item_repair_kit_32.png', batteryPacks: cargoDir + 'item_battery_pack_32.png',
    medkits: cargoDir + 'item_medkit_32.png', seedPods: cargoDir + 'item_seed_pod_32.png',
    extraRations: cargoDir + 'item_extra_rations_32.png',
};

const atlasPath = path.join(art, 'flight_icon_sources.png');
if (process.argv[3]) {
    const names = 'play crew upgrade settings quit lock check back engineer botanist pilot medic scientist captain mars moon power oxygen water food solar radiation rover circuit windSampler repairKits batteryPacks medkits seedPods extraRations waterCanisters oxygenTanks'.split(' ');
    const atlas = image(256, 128);
    for (const [index, name] of names.entries()) {
        const slot = supplied[name] ? read(path.join(process.argv[3], supplied[name])) : draw(glyphs[name]);
        const icon = image(32, 32);
        blit(slot, icon, Math.floor((32 - slot.width) / 2), Math.floor((32 - slot.height) / 2));
        blit(icon, atlas, (index % 8) * 32, Math.floor(index / 8) * 32);
    }
    write(atlasPath, atlas);
}
exportPng('flight_icons.png', read(atlasPath));

for (const font of ['pixelify_sans', 'ibm_plex_mono']) writeMeta(path.join(root, 'assets/fonts', font + '.ttf'), 'font');
