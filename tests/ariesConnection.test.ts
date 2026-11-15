import assert from 'node:assert/strict';
import test from 'node:test';
import { TRAINING_RUN, WEATHER_SURVEY } from '../src/data/missions';
import { checkGeminiConnection, requestGemini } from '../src/services/geminiPlanner';
import { discussWork, draftSurveyBriefing } from '../src/services/tharsisAries';
import { createInitialGameState, isTharsis } from '../src/simulation/solEngine';

test('A.R.I.E.S. can detect local fallback, ignore canceled results, and reconnect', async t => {
    Object.defineProperty(globalThis, 'location', { value: { protocol: 'https:' }, configurable: true });
    t.after(() => { Reflect.deleteProperty(globalThis, 'location'); });
    let configured = false;
    let mode: 'invalid' | 'live' | 'offline' | 'cancel' = 'invalid';
    let calls = 0;
    let operation: AbortController | undefined;
    t.mock.method(globalThis, 'fetch', async (_url, options) => {
        calls++;
        if (!options?.method) return Response.json({ model: configured ? 'test-model' : null });
        if (mode === 'offline') return Response.json({ error: 'API temporarily unavailable.' }, { status: 502 });
        if (mode === 'invalid') return Response.json({ text: '{}' });
        if (mode === 'cancel') operation!.abort();
        return Response.json({ text: 'Live response' });
    });
    assert.equal(await checkGeminiConnection(), false);
    const training = createInitialGameState(TRAINING_RUN);
    assert.ok(isTharsis(training));
    const beforeTraining = calls;
    assert.equal(await draftSurveyBriefing(training), null);
    assert.equal(calls, beforeTraining);

    configured = true;
    assert.equal(await checkGeminiConnection(), true);
    const mission = createInitialGameState(WEATHER_SURVEY);
    assert.ok(isTharsis(mission));
    assert.equal(await draftSurveyBriefing(mission), null);
    assert.notEqual(mission.tharsis.briefing.source, 'Gemini');

    mode = 'offline';
    assert.deepEqual(await requestGemini('Instruction', 'Request'), { error: 'API temporarily unavailable.' });
    mode = 'live';
    assert.deepEqual(await requestGemini('Instruction', 'Request'), { text: 'Live response' });
    mode = 'cancel';
    operation = new AbortController();
    assert.deepEqual(await requestGemini('Instruction', 'Request', { signal: operation.signal }), { error: 'Request canceled.' });
    mode = 'live';
    const beforeReconnect = calls;
    assert.deepEqual(await requestGemini('Instruction', 'Request'), { text: 'Live response' });
    assert.equal(calls, beforeReconnect + 1, 'a canceled request preserves the connection');
});

test('training can receive live guidance while briefings and work orders stay authored', async t => {
    Object.defineProperty(globalThis, 'location', { value: { protocol: 'http:' }, configurable: true });
    t.after(() => { Reflect.deleteProperty(globalThis, 'location'); });
    let liveRequests = 0;
    t.mock.method(globalThis, 'fetch', async (_url, options) => {
        if (options?.method !== 'POST') return Response.json({ model: 'test-model' });
        liveRequests++;
        const request = JSON.parse(options.body);
        assert.equal(request.kind, 'discussion');
        assert.equal(JSON.parse(request.input).mission, TRAINING_RUN.missionGoal.title);
        return Response.json({ text: JSON.stringify({
            message: 'Inspect the drivetrain with Eileen.',
            draft: { kind: 'procedure', orderId: 'drive-check', techniques: [] },
        }) });
    });
    const training = createInitialGameState(TRAINING_RUN);
    assert.ok(isTharsis(training));
    assert.equal(await checkGeminiConnection(), true);
    assert.deepEqual(await discussWork(training, null, [{ speaker: 'crew', text: 'What should I do first?' }], null), {
        message: 'Inspect the drivetrain with Eileen.',
    });
    assert.equal(await draftSurveyBriefing(training), null);
    assert.equal(liveRequests, 1);
    assert.deepEqual(training.tharsis.work, []);
    assert.equal(training.tharsis.briefing.source, 'Mission control');
});
