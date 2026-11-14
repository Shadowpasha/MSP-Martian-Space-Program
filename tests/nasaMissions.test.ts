import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { GOAL_FLAGS } from '../src/contracts/gameContract';
import { CARGO_BY_ID } from '../src/data/cargo';
import { NASA_MISSIONS, nasaMissionOffers, nasaMissionSetup, travelSols } from '../src/data/nasaMissions';

test('NASA missions: real facts with https sources, known goals, real cargo, existing art', () => {
    assert.equal(new Set(NASA_MISSIONS.map(m => m.id)).size, NASA_MISSIONS.length);
    for (const m of NASA_MISSIONS) {
        assert.ok((GOAL_FLAGS as readonly string[]).includes(m.goalFlag), `${m.id} goal`);
        assert.ok(m.realBasis.sources.length > 0 && m.realBasis.sources.every(s => s.url.startsWith('https://')), `${m.id} sources`);
        assert.ok(m.realBasis.fact.length > 40 && m.lesson.length > 20 && m.briefing.length > 20, `${m.id} texts`);
        for (const id of Object.keys(m.requiredEquipment)) assert.ok(id in CARGO_BY_ID, `${m.id} equipment ${id}`);
        assert.ok(existsSync(m.image), `${m.id} image ${m.image}`);
    }
});

test('NASA mission setups: deadline covers travel + work, four prep requirements, reserves', () => {
    for (const m of NASA_MISSIONS) {
        const setup = nasaMissionSetup(m);
        assert.equal(setup.planet, m.planet);
        assert.ok(setup.missionGoal.deadlineSol > travelSols(m) + m.taskSols);
        assert.equal(setup.targetSol, setup.missionGoal.deadlineSol);
        assert.deepEqual(setup.missionGoal.requirements.map(r => r.kind), ['prep_sensor', 'prep_rover', 'prep_supplies', 'assign_crew']);
        assert.deepEqual(setup.missionGoal.minimumReserves, { food: 10, water: 10, oxygen: 25 });
        JSON.parse(JSON.stringify(setup)); // must survive Storage
    }
    assert.ok(nasaMissionOffers().every(o => o.briefing.source && o.description.includes("Based on NASA's")));
});
