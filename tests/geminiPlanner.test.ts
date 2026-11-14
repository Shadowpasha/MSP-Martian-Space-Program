import assert from 'node:assert/strict';
import test from 'node:test';
import { getGeminiStatusLabel, generateTaskWithGemini } from '../src/services/geminiPlanner';
import { createInitialGameState } from '../src/simulation/solEngine';

test('typed plans use the local Gemini endpoint and fall back when a proposal is invalid', async (t) => {
    const originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
    Object.defineProperty(globalThis, 'location', { configurable: true, value: new URL('http://127.0.0.1:4173/') });
    t.after(() => {
        if (originalLocation) Object.defineProperty(globalThis, 'location', originalLocation);
        else Reflect.deleteProperty(globalThis, 'location');
    });
    const state = createInitialGameState(undefined, ['ai_logistics']);
    const prompt = 'Build a heat exchanger from a spare radiator.';
    let plannerText = JSON.stringify({
        replyText: 'Use the radiator to recover waste heat.',
        task: {
            title: 'Radiator Heat Recovery',
            category: 'ENG',
            durationSols: 2,
            dailyCost: { energy: 5 },
            recommendedRole: 'engineer',
        },
    });
    const requests: Array<{ url: string; method: string }> = [];
    const doFetch: typeof fetch = async (url, options) => {
        requests.push({ url: String(url), method: options?.method ?? 'GET' });
        if (!options?.method) return Response.json({ model: 'gemini-3-flash-preview' });
        const body = JSON.parse(String(options.body));
        assert.equal(body.input, `Player Action Plan: ${JSON.stringify(prompt)}`);
        assert.match(body.systemInstruction, /Planet: MARS/);
        assert.deepEqual(Object.keys(body).sort(), ['input', 'systemInstruction']);
        return Response.json({ text: plannerText });
    };
    t.mock.method(globalThis, 'fetch', doFetch);

    const live = await generateTaskWithGemini(prompt, state);
    assert.equal(live.source, 'gemini');
    assert.equal(live.task.title, 'Radiator Heat Recovery');
    assert.equal(live.task.dailyCost.energy, 4);
    assert.equal(getGeminiStatusLabel(), 'A.R.I.E.S. connected');
    assert.deepEqual(requests, [
        { url: '/api/gemini-plan', method: 'GET' },
        { url: '/api/gemini-plan', method: 'POST' },
    ]);

    plannerText = '{"replyText":"A task is ready."}';
    const fallback = await generateTaskWithGemini(prompt, state);
    assert.equal(fallback.source, 'offline-fallback');
    assert.match(fallback.fallbackReason ?? '', /invalid task proposal/);
    assert.equal(requests.length, 3);
});
