import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_CREW } from '../src/contracts/gameContract';
import { advanceSol, createInitialGameState, resolveDailyEventChoice } from '../src/simulation/solEngine';
import { ITEMS, getItem } from '../src/prep/data/items';
import { MISSIONS, PLAYABLE_MISSIONS } from '../src/prep/data/missions';
import { ROCKET_COLS, ROCKET_ROWS } from '../src/prep/logic/balance';
import { buildSetup } from '../src/prep/logic/buildSetup';
import { canLaunch, checklist, launchBlocker, supplyForecasts } from '../src/prep/logic/checklist';
import {
    cancelHeld, chooseFocusedMission, clickCell, confirmCrew, heldAnchor, launch, newPrepState, pickFromGrid,
    pickFromShelf, quickPack, removeHeldFromGrid, rotateHeld, toggleCrew,
} from '../src/prep/logic/flow';
import { createRng } from '../src/prep/logic/rng';
import { makeOffer, rollOffers, type MissionOffer } from '../src/prep/logic/roll';
import { RocketGrid, shapeCells } from '../src/prep/logic/rocketGrid';

test('playable missions use real items, sources, and goal flags the main loop knows', () => {
    assert.ok(PLAYABLE_MISSIONS.length >= 3);
    assert.equal(new Set(MISSIONS.map((m) => m.id)).size, MISSIONS.length);
    for (const m of PLAYABLE_MISSIONS) {
        assert.ok(m.goalFlag === 'wind_sample_collected' || m.goalFlag === 'ice_core_collected');
        assert.ok(m.hardware.length > 0, `${m.id} has hardware`);
        for (const hw of m.hardware) assert.equal(getItem(hw.itemId).category, 'mission');
        assert.ok(m.realBasis.sources.every((s) => s.url.startsWith('https://')));
        assert.ok(m.briefing.length > 20 && m.lesson.length > 20);
        for (const site of m.sites) {
            assert.ok(site.map.x >= 0 && site.map.x <= 1 && site.map.y >= 0 && site.map.y <= 1);
        }
    }
});

test('every item shape rotates without losing cells', () => {
    for (const item of ITEMS) {
        const n = shapeCells(item.shape).length;
        for (const r of [1, 2, 3] as const) assert.equal(shapeCells(item.shape, r).length, n, item.id);
    }
});

test('roll: distinct missions, completed ones skipped while others remain', () => {
    for (let seed = 1; seed < 100; seed++) {
        const offers = rollOffers(createRng(seed), { completed: ['storm_watch'] });
        assert.equal(new Set(offers.map((o) => o.mission.id)).size, offers.length);
        assert.ok(offers.every((o) => o.mission.goalFlag !== null));
        assert.ok(offers.every((o) => o.deadlineSol > o.travelSolsOneWay + o.mission.taskSols));
    }
    const offers = rollOffers(createRng(5), { completed: ['storm_watch'], count: 2 });
    assert.ok(!offers.some((o) => o.mission.id === 'storm_watch'));
});

/** Pack hardware, then supplies until every supply lasts the whole mission (or the bay is full). */
function packFor(offer: MissionOffer, crewCount: number): RocketGrid {
    const grid = new RocketGrid(ROCKET_COLS, ROCKET_ROWS);
    for (const hw of offer.mission.hardware) {
        for (let i = 0; i < hw.count; i++) {
            const spot = grid.findSpot(hw.itemId)!;
            grid.place(hw.itemId, spot.x, spot.y, spot.rotation);
        }
    }
    const crateFor = { food: 'food_crate', water: 'water_tank', oxygen: 'o2_canister' } as const;
    for (let guard = 0; guard < 60; guard++) {
        const low = supplyForecasts(offer, grid, crewCount).find((f) => f.key !== 'energy' && !f.full);
        if (!low) break;
        const id = crateFor[low.key as keyof typeof crateFor];
        const spot = grid.findSpot(id);
        if (!spot) break;
        grid.place(id, spot.x, spot.y, spot.rotation);
    }
    return grid;
}

test('every playable mission x site x crew size (2-4) can be packed to launch', () => {
    const rng = createRng(11);
    for (const m of PLAYABLE_MISSIONS) {
        for (const site of m.sites) {
            // Worst case: the longest deadline the roll can give.
            const offer = { ...makeOffer(rng, m, site) };
            offer.deadlineSol = 1 + offer.travelSolsOneWay + m.taskSols + m.slackSols[1];
            for (const n of [2, 3, 4]) {
                const crew = DEFAULT_CREW.slice(0, n);
                const grid = packFor(offer, n);
                const rows = checklist(offer, grid, crew);
                assert.ok(canLaunch(rows), `${m.id}@${site.name} crew ${n}: ${launchBlocker(rows)}`);
            }
        }
    }
});

test('crew size is a real trade-off: 4 crew cannot cover the whole trip on the longest mission', () => {
    const m = PLAYABLE_MISSIONS.find((x) => x.id === 'ice_hunter')!;
    const offer = makeOffer(createRng(1), m, m.sites[0]);
    offer.deadlineSol = 1 + offer.travelSolsOneWay + m.taskSols + m.slackSols[1];
    const grid = packFor(offer, 4);
    const fc = supplyForecasts(offer, grid, 4).filter((f) => f.key !== 'energy');
    assert.ok(fc.some((f) => !f.full), 'bay should run out before every supply covers 4 crew');
});

test('buildSetup output runs in the team simulation with 2, 3 and 4 crew', () => {
    const rng = createRng(3);
    for (const m of PLAYABLE_MISSIONS) {
        const offer = makeOffer(rng, m);
        for (const n of [2, 3, 4]) {
            const crew = DEFAULT_CREW.slice(0, n);
            const setup = buildSetup(offer, crew, packFor(offer, n), ['closed_o2']);
            assert.equal(setup.planet, m.planet);
            assert.equal(setup.crew.length, n);
            assert.equal(setup.cargo.windSampler, 1);
            assert.equal(setup.missionGoal.requiredFlag, m.goalFlag);
            assert.ok(setup.startingResources.oxygen <= 100);
            assert.equal(setup.skillModifiers.oxygenConsumptionMult, 0.75);
            JSON.parse(JSON.stringify(setup)); // Storage round-trip

            const state = createInitialGameState(setup);
            for (let sol = 0; sol < 3 && state.phase !== 'ended'; sol++) {
                if (state.currentEvent) resolveDailyEventChoice(state, state.currentEvent.choices[0]!.id);
                advanceSol(state);
            }
            assert.ok(state.sol >= 2, `${m.id} crew ${n} advanced`);
        }
    }
});

test('flow: mission -> crew -> pack -> launch, with launch blocked until ready', () => {
    const s = newPrepState({ seed: 9 });
    assert.equal(s.screen, 'mission');
    chooseFocusedMission(s);
    assert.equal(s.screen, 'crew');
    confirmCrew(s);
    assert.equal(s.screen, 'crew', 'needs 2 crew');
    toggleCrew(s, DEFAULT_CREW[0]!.id);
    toggleCrew(s, DEFAULT_CREW[2]!.id);
    confirmCrew(s);
    assert.equal(s.screen, 'pack');
    assert.equal(launch(s), null);

    const offer = s.chosen!;
    const packed = packFor(offer, 2);
    for (const it of packed.items) quickPack(s, it.itemId);
    const setup = launch(s);
    assert.ok(setup, s.message);
    assert.equal(setup.crew.length, 2);
});

test('meters and checklist agree: a supply is green exactly when its checklist row is met', () => {
    const rng = createRng(8);
    for (const m of PLAYABLE_MISSIONS) {
        const offer = makeOffer(rng, m);
        for (const n of [2, 4]) {
            const grid = packFor(offer, n);
            const rows = checklist(offer, grid, DEFAULT_CREW.slice(0, n));
            for (const f of supplyForecasts(offer, grid, n)) {
                const row = rows.find((r) => r.id === `supply_${f.key}`);
                if (row) assert.equal(row.met, f.level === 'ok', `${m.id} ${f.key}`);
            }
        }
    }
});

test('flow: pick up, rotate, cancel returns item to its old slot', () => {
    const s = newPrepState({ seed: 2 });
    chooseFocusedMission(s);
    pickFromShelf(s, 'power_cell');
    clickCell(s, 0, 0);
    assert.equal(s.grid.count('power_cell'), 1);
    assert.ok(pickFromGrid(s, 1, 0));
    assert.equal(s.grid.count('power_cell'), 0);
    rotateHeld(s);
    cancelHeld(s);
    assert.equal(s.grid.count('power_cell'), 1);
    assert.equal(s.grid.at(0, 0) !== 0 && s.grid.at(1, 0) !== 0, true, 'back in its original slots');
});

test('supplies stay in hand after placing, hardware does not', () => {
    const s = newPrepState({ seed: 4 });
    chooseFocusedMission(s);
    pickFromShelf(s, 'food_crate');
    clickCell(s, 0, 0);
    assert.equal(s.held?.itemId, 'food_crate');
    pickFromShelf(s, 'medkit');
    clickCell(s, 1, 0);
    assert.equal(s.held, null);
});

test('clicking a packed item takes it out; a press that becomes a drag moves it instead', () => {
    const s = newPrepState({ seed: 6 });
    chooseFocusedMission(s);
    quickPack(s, 'repair_kit');
    assert.equal(s.grid.count('repair_kit'), 1);
    clickCell(s, 0, 0);
    assert.equal(s.grid.count('repair_kit'), 0, 'click removes');
    assert.equal(s.held, null);

    // The system's path: press picks up, release without moving removes.
    quickPack(s, 'repair_kit');
    pickFromGrid(s, 1, 0);
    removeHeldFromGrid(s);
    assert.equal(s.grid.count('repair_kit'), 0);
    assert.equal(s.held, null);
});

test('held items centre on the pointer cell and are pushed back inside the bay at the walls', () => {
    const s = newPrepState({ seed: 6 });
    chooseFocusedMission(s);
    const cols = s.grid.cols;
    const rows = s.grid.rows;
    pickFromShelf(s, 'ice_drill'); // 4 wide
    assert.deepEqual(heldAnchor(s, 3, 1), { x: 2, y: 1 }, 'centred on the pointer');
    assert.deepEqual(heldAnchor(s, cols - 1, 0), { x: cols - 4, y: 0 }, 'right wall pushes it left');
    assert.deepEqual(heldAnchor(s, 0, rows - 1), { x: 0, y: rows - 1 }, 'left wall');
    rotateHeld(s); // now 4 tall
    assert.deepEqual(heldAnchor(s, 2, rows - 1), { x: 2, y: rows - 4 }, 'bottom wall pushes it up');
    clickCell(s, cols - 1, rows - 1);
    assert.equal(s.grid.count('ice_drill'), 1, 'placed even with the pointer in the corner');
});
