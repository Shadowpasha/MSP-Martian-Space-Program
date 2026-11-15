import assert from 'node:assert/strict';
import { open } from 'node:fs/promises';
import test from 'node:test';
import type { AudioAPI } from 'esengine';
import { MISSION_SOUNDTRACK } from '../src/audio/missionSoundtrack';
import { bindAudio, currentMissionMusic, nextMissionMusic, playMusic, setVolumes, stopMusic, unlockAudio } from '../src/audio/soundManager';

test('the mission playlist ships eight tracks and shuffles one cycle at a time on the music bus', async () => {
    assert.equal(MISSION_SOUNDTRACK.length, 8);
    assert.ok(MISSION_SOUNDTRACK.every(track => !/industrial/i.test(track.url)));
    for (const { url } of MISSION_SOUNDTRACK) {
        const handle = await open(url);
        try {
            const header = Buffer.alloc(4);
            await handle.read(header);
            assert.equal(header.toString(), 'OggS');
        } finally {
            await handle.close();
        }
    }
    let voice: { onEnd?: () => void; stop: () => void } | undefined;
    const played: string[] = [];
    const levels = { master: 0, music: 0, sfx: 0, ui: 0 };
    const audio = {
        muteBus() {},
        resume() {},
        stopBGM() {},
        playBGM() {},
        preload: async () => {},
        getBufferHandle: (url: string) => ({ url }),
        retainBuffer: () => true,
        releaseBuffer() {},
        setMasterVolume: (value: number) => { levels.master = value; },
        setMusicVolume: (value: number) => { levels.music = value; },
        setSFXVolume: (value: number) => { levels.sfx = value; },
        setUIVolume: (value: number) => { levels.ui = value; },
        playBuffer: ({ url }: { url: string }, config: { bus: string; loop: boolean }) => {
            assert.equal(config.bus, 'music');
            assert.equal(config.loop, false);
            played.push(url);
            voice = { stop() {} };
            return voice;
        },
    } as unknown as AudioAPI;
    bindAudio(audio);
    setVolumes(0.75, 0.3, 0.15);
    assert.deepEqual(levels, { master: 0.75, music: 0.3, sfx: 0.15, ui: 0.15 });
    unlockAudio();
    playMusic('game');
    await Promise.resolve();
    assert.ok(currentMissionMusic());
    voice!.onEnd!();
    await Promise.resolve();
    for (let i = 2; i < 8; i++) await nextMissionMusic();
    assert.deepEqual(new Set(played), new Set(MISSION_SOUNDTRACK.map(track => track.url)));
    await nextMissionMusic();
    assert.notEqual(played[7], played[8]);
    const finish = voice!.onEnd!;
    stopMusic();
    finish();
    await Promise.resolve();
    assert.equal(played.length, 9);
    assert.equal(currentMissionMusic(), null);
});
