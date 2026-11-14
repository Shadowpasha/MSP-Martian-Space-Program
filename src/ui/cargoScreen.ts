import type { Color, InputState } from 'esengine';
import {
    CARGO_BY_ID, CARGO_COLUMNS, CARGO_ITEMS, CARGO_ROWS, occupiedCells, packedInventory, placementProblem, rotatedCells,
    type CargoPlacement, type Rotation,
} from '../data/cargo';
import type { CargoItemId } from '../contracts/gameContract';
import { type FlightUi } from './flightUi';

const CARGO_COLORS: Record<CargoItemId, number> = {
    windSampler: 0xd39e55, repairKits: 0xcc745e, batteryPacks: 0xe1bd65, medkits: 0xcf7c8c,
    seedPods: 0x8db079, extraRations: 0xba9a6e, waterCanisters: 0x75a7c7, oxygenTanks: 0x69bbb5,
};

function cargoColor(item: CargoItemId, strength: number): Color {
    const shade = CARGO_COLORS[item];
    return { r: ((shade >> 16) & 255) / 255 * strength, g: ((shade >> 8) & 255) / 255 * strength, b: (shade & 255) / 255 * strength, a: 1 };
}

export function showCargo(
    ui: FlightUi, draft: CargoPlacement[], onChange: (placements: CargoPlacement[]) => void,
    launchProblem: (placements: CargoPlacement[]) => string | null, onLaunch: () => void,
): (input: InputState) => void {
    const { root, palette: p } = ui;
    const bay = ui.frame(root, [248, 108, 576, 596]);
    const inventory = ui.frame(root, [840, 108, 424, 596]);
    ui.label(bay, [20, 12, 332, 40], 'Cargo Bay', { display: true, size: 28 });
    const usage = ui.label(bay, [340, 12, 196, 40], '', { size: 15, color: p.amber, center: true });
    ui.label(bay, [20, 56, 524, 32], 'Choose a supply, then choose its starting cell.', { size: 14, color: p.secondary });
    const grid = ui.frame(bay, [20, 92, 528, 348], p.ink);
    const pieceSize = 76;
    const step = 84;
    const inventoryListTop = 56;
    let placements = draft;
    let nextId = Math.max(0, ...draft.map(item => item.id)) + 1;
    let selectedItem: CargoItemId = 'windSampler';
    let selectedPlacement: number | null = null;
    let rotation: Rotation = 0;
    let moving = false;
    let feedback = '';
    let error = false;
    // Entering an empty cell with a selected tile previews its full footprint.
    const cells = Array.from({ length: CARGO_COLUMNS * CARGO_ROWS }, (_, index) => {
        const x = index % CARGO_COLUMNS;
        const y = Math.floor(index / CARGO_COLUMNS);
        const button = ui.button(grid, [12 + x * step, 8 + y * step, pieceSize, pieceSize], () => chooseCell(x, y), { tone: 'tile' });
        return { button, x, y };
    });
    const status = ui.label(bay, [20, 448, 528, 40], '', { size: 14, wrap: true });
    const rotate = ui.button(bay, [20, 500, 164, 44], rotatePiece, { label: 'Rotate [R]' });
    const move = ui.button(bay, [196, 500, 164, 44], toggleMove, { label: 'Move [M]' });
    const remove = ui.button(bay, [372, 500, 176, 44], removePiece, { label: 'Remove [Del]' });
    ui.label(bay, [20, 548, 528, 28], 'Tab or arrows to focus · Enter to choose', { size: 13, color: p.muted });

    ui.label(inventory, [16, 12, 384, 36], 'Supply Inventory', { display: true, size: 28 });
    const items = CARGO_ITEMS.map((item, index) => {
        const button = ui.button(inventory, [16, inventoryListTop + index * 48, 384, 44], () => {
            selectedItem = item.id;
            selectedPlacement = null;
            rotation = 0;
            moving = false;
            feedback = '';
            error = false;
            refresh();
        });
        ui.icon(button.entity, 10, 10, 24, item.id, p.amber);
        ui.label(button.entity, [48, 2, 256, 22], item.name, { display: true, size: 18 });
        ui.label(button.entity, [48, 22, 304, 18], item.effect, { size: 12, color: p.secondary });
        const stock = ui.label(button.entity, [320, 2, 56, 22], '', { size: 14, color: p.amber, center: true });
        return { item, button, stock };
    });
    const shape = ui.label(inventory, [16, 444, 384, 34], '', { size: 13, color: p.secondary });
    const preview = Array.from({ length: 9 }, (_, index) =>
        ui.box(inventory, [350 + (index % 3) * 12, 442 + Math.floor(index / 3) * 12, 10, 10], p.amber),
    );
    const validation = ui.label(inventory, [16, 478, 384, 40], '', { size: 14, wrap: true });
    const launch = ui.button(inventory, [16, 528, 384, 48], onLaunch, { label: 'Launch Mission', tone: 'primary' });
    const piecesLayer = ui.box(grid, [0, 0, 520, 340]);
    let pieces = ui.box(piecesLayer, [0, 0, 520, 340]);
    const guides = ui.box(grid, [0, 0, 520, 340]);
    const markers = cells.map(cell => ({
        ...cell,
        ghost: ui.box(guides, [20 + cell.x * step, 16 + cell.y * step, 60, 60], p.transparent),
        focus: ui.box(guides, [72 + cell.x * step, 16 + cell.y * step, 8, 8], p.transparent),
    }));

    function previewAt(x: number, y: number): void {
        const piece = { id: moving && selectedPlacement !== null ? selectedPlacement : nextId, item: selectedItem, x, y, rotation };
        const problem = placementProblem(placements, piece);
        const footprint = occupiedCells(piece);
        for (const cell of markers) {
            const filled = footprint.some(([px, py]) => px === cell.x && py === cell.y);
            ui.fill(cell.ghost, filled ? { ...(problem ? p.bad : p.cyan), a: 0.22 } : p.transparent);
        }
    }

    for (const cell of markers) {
        ui.on(cell.button.entity, 'hover_enter', () => previewAt(cell.x, cell.y));
        ui.on(cell.button.entity, 'hover_exit', clearPreview);
        ui.on(cell.button.entity, 'focus', () => {
            if (ui.hasKeyboardFocus(cell.button.entity)) {
                ui.fill(cell.focus, p.white);
                previewAt(cell.x, cell.y);
            }
        });
        ui.on(cell.button.entity, 'blur', () => { ui.fill(cell.focus, p.transparent); clearPreview(); });
    }

    function clearPreview(): void {
        for (const cell of markers) ui.fill(cell.ghost, p.transparent);
    }

    function commit(next: CargoPlacement[]): void {
        placements = next;
        onChange(placements);
    }

    function chooseCell(x: number, y: number): void {
        const hit = placements.find(piece => occupiedCells(piece).some(([px, py]) => px === x && py === y));
        if (hit && !moving) {
            selectedItem = hit.item;
            selectedPlacement = hit.id;
            rotation = hit.rotation;
            feedback = `${CARGO_BY_ID[hit.item].name} selected. Choose Move to reposition it.`;
            error = false;
            refresh();
            return;
        }
        const id = moving && selectedPlacement !== null ? selectedPlacement : nextId;
        const next = { id, item: selectedItem, x, y, rotation };
        const problem = placementProblem(placements, next);
        if (problem) {
            feedback = problem;
            error = true;
        } else {
            const moved = placements.some(piece => piece.id === id);
            commit(moved ? placements.map(piece => piece.id === id ? next : piece) : [...placements, next]);
            if (!moved) nextId++;
            selectedPlacement = id;
            moving = false;
            feedback = `${CARGO_BY_ID[selectedItem].name} ${moved ? 'moved' : 'packed'}.`;
            error = false;
        }
        refresh();
    }

    function rotatePiece(): void {
        const nextRotation = ((rotation + 1) % 4) as Rotation;
        const current = placements.find(piece => piece.id === selectedPlacement);
        if (current && !moving) {
            const next = { ...current, rotation: nextRotation };
            const problem = placementProblem(placements, next);
            if (problem) {
                error = true;
                feedback = problem;
                refresh();
                return;
            }
            commit(placements.map(piece => piece.id === current.id ? next : piece));
        }
        rotation = nextRotation;
        feedback = `Rotated to ${rotation * 90}°.`;
        error = false;
        refresh();
    }

    function toggleMove(): void {
        if (selectedPlacement === null) return;
        moving = !moving;
        const current = placements.find(piece => piece.id === selectedPlacement);
        if (!moving && current) rotation = current.rotation;
        feedback = moving ? 'Choose the new starting cell.' : 'Move cancelled.';
        error = false;
        refresh();
    }

    function removePiece(): void {
        if (selectedPlacement === null) return;
        commit(placements.filter(piece => piece.id !== selectedPlacement));
        selectedPlacement = null;
        moving = false;
        feedback = `${CARGO_BY_ID[selectedItem].name} returned to inventory.`;
        error = false;
        refresh();
    }

    function refresh(): void {
        clearPreview();
        ui.world.despawn(pieces);
        pieces = ui.box(piecesLayer, [0, 0, 520, 340]);
        let occupied = 0;
        for (const piece of placements) {
            const footprint = occupiedCells(piece);
            occupied += footprint.length;
            const selected = piece.id === selectedPlacement;
            const base = cargoColor(piece.item, selected ? 0.66 : 0.44);
            const outline = selected ? p.hover : cargoColor(piece.item, 0.91);
            const detail = cargoColor(piece.item, selected ? 0.75 : 0.55);
            const contains = (x: number, y: number) => footprint.some(([cx, cy]) => cx === x && cy === y);
            for (const [x, y] of footprint) {
                const left = 12 + x * step;
                const top = 8 + y * step;
                const right = contains(x + 1, y);
                const down = contains(x, y + 1);
                ui.box(pieces, [left, top, pieceSize + (right ? 8 : 0), pieceSize + (down ? 8 : 0)], base);
                if (right && down && contains(x + 1, y + 1)) ui.box(pieces, [left + pieceSize, top + pieceSize, 8, 8], base);
                if (!contains(x - 1, y)) ui.box(pieces, [left, top, 4, pieceSize + (down ? 8 : 0)], outline);
                if (!contains(x, y - 1)) ui.box(pieces, [left, top, pieceSize + (right ? 8 : 0), 4], outline);
                if (!right) ui.box(pieces, [left + pieceSize - 4, top, 4, pieceSize + (down ? 8 : 0)], outline);
                if (!down) ui.box(pieces, [left, top + pieceSize - 4, pieceSize + (right ? 8 : 0), 4], outline);
                if (right && down && !contains(x + 1, y + 1)) {
                    ui.box(pieces, [left + pieceSize, top + pieceSize - 4, 8, 4], outline);
                    ui.box(pieces, [left + pieceSize - 4, top + pieceSize, 4, 8], outline);
                }
                ui.box(pieces, [left + 12, top + 12, 4, 4], detail);
                ui.box(pieces, [left + 60, top + 60, 4, 4], detail);
            }
            const [labelX, labelY] = footprint.reduce((a, b) => b[1] < a[1] || (b[1] === a[1] && b[0] < a[0]) ? b : a);
            let labelWidth = pieceSize;
            while (contains(labelX + Math.round(labelWidth / step), labelY) && labelWidth < pieceSize + 2 * step) labelWidth += step;
            ui.label(pieces, [12 + labelX * step + 4, 8 + labelY * step + 20, labelWidth - 8, 36], CARGO_BY_ID[piece.item].shortName, {
                display: true, size: 16, center: true, color: p.white,
            });
        }
        const counts = packedInventory(placements);
        for (const { item, button, stock } of items) {
            ui.setText(stock, `×${item.stock - counts[item.id]}`);
            ui.fill(button.surface, item.id === selectedItem ? p.teal : p.raised);
        }
        const footprint = rotatedCells(selectedItem, rotation);
        preview.forEach((cell, index) => ui.show(cell, footprint.some(([x, y]) => index === y * 3 + x)));
        ui.setText(shape, `${CARGO_BY_ID[selectedItem].name} · ${rotation * 90}°`);
        ui.setText(usage, `${occupied} / ${CARGO_COLUMNS * CARGO_ROWS} cells used`);
        ui.setText(status, feedback || 'Rotate supplies to make room for the gear you need.');
        ui.textColor(status, error ? p.bad : p.secondary);
        const problem = launchProblem(placements);
        ui.setText(validation, problem ?? 'Crew and equipment ready.');
        ui.textColor(validation, problem ? p.bad : p.good);
        ui.fill(launch.surface, problem ? p.well : p.amber);
        ui.textColor(launch.text, problem ? p.secondary : p.ink);
        launch.setDisabled(Boolean(problem));
        rotate.setDisabled(false);
        move.setDisabled(selectedPlacement === null);
        ui.setText(move.text, moving ? 'Cancel Move [M]' : 'Move [M]');
        remove.setDisabled(selectedPlacement === null);
    }
    refresh();
    return input => {
        if (input.isKeyPressed('KeyR')) rotatePiece();
        if (input.isKeyPressed('KeyM')) toggleMove();
        if (input.isKeyPressed('Delete')) removePiece();
    };
}
