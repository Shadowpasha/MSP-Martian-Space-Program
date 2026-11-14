import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { GOAL_FLAGS } from '../src/contracts/gameContract';
import { CARGO_BY_ID } from '../src/data/cargo';
import { NASA_MISSIONS, nasaMissionOffers } from '../src/data/nasaMissions';

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

test('NASA mission offers: the briefing popup has the NASA basis, the card has the goal only', () => {
    assert.ok(nasaMissionOffers().every(o => o.briefing.source && o.briefing.basis && !o.description.includes('NASA')));
});
