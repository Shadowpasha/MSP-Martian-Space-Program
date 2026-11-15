import type { AudioAPI, AudioHandle } from 'esengine';
import { MISSION_SOUNDTRACK } from './missionSoundtrack';

export type MusicTrack = 'menu' | 'game';
export type SfxKind =
    | 'click'
    | 'select'
    | 'confirm'
    | 'open'
    | 'close'
    | 'drop'
    | 'alert'
    | 'error'
    | 'success';

const MUSIC_PATHS: Record<MusicTrack, { url: string; volume: number }> = {
    menu: { url: 'assets/audio/bgm_menu.ogg', volume: 0.34 },
    game: { url: 'assets/audio/bgm_game.ogg', volume: 0.30 },
};

const SFX_PATHS: Record<SfxKind, { url: string; volume: number }> = {
    click: { url: 'assets/audio/sfx_click.ogg', volume: 0.55 },
    select: { url: 'assets/audio/sfx_select.ogg', volume: 0.55 },
    confirm: { url: 'assets/audio/sfx_confirm.ogg', volume: 0.65 },
    open: { url: 'assets/audio/sfx_open.ogg', volume: 0.50 },
    close: { url: 'assets/audio/sfx_close.ogg', volume: 0.45 },
    drop: { url: 'assets/audio/sfx_drop.ogg', volume: 0.60 },
    alert: { url: 'assets/audio/sfx_alert.ogg', volume: 0.65 },
    error: { url: 'assets/audio/sfx_error.ogg', volume: 0.60 },
    success: { url: 'assets/audio/sfx_success.ogg', volume: 0.70 },
};

let boundAudio: AudioAPI | null = null;
let currentTrack: MusicTrack | null = null;
let desiredTrack: MusicTrack | null = null;
let soundEnabled = true;
let masterVol = 0.53;
let musicVol = 0.18;
let sfxVol = 0.34;
let audioUnlocked = false;
let preloaded = false;
let missionQueue: Array<typeof MISSION_SOUNDTRACK[number]> = [];
let previousMissionUrl: string | null = null;
let missionVoice: { audio: AudioAPI; handle: AudioHandle; url: string } | null = null;
let missionTitle: string | null = null;
let missionPlayback = 0;

export function bindAudio(audio: AudioAPI | null): void {
    boundAudio = audio;
    if (!audio) return;
    applyMuteState();
    if (!preloaded) {
        preloaded = true;
        const urls = [
            ...Object.values(MUSIC_PATHS).map((m) => m.url),
            ...Object.values(SFX_PATHS).map((s) => s.url),
        ];
        try {
            for (const url of urls) {
                void audio.preload(url).catch(() => {});
            }
        } catch {
            // Headless environments without WebAudio safely ignore preloads.
        }
    }
}

function applyMuteState(): void {
    if (!boundAudio) return;
    try {
        boundAudio.muteBus('master', !soundEnabled);
        boundAudio.setMasterVolume(soundEnabled ? masterVol : 0);
        boundAudio.setMusicVolume(musicVol);
        boundAudio.setSFXVolume(sfxVol);
        boundAudio.setUIVolume(sfxVol);
    } catch {
        // Ignore on mixerless backends.
    }
}

export function setVolumes(master: number, music: number, sfx: number): void {
    masterVol = Math.max(0, Math.min(1, master));
    musicVol = Math.max(0, Math.min(1, music));
    sfxVol = Math.max(0, Math.min(1, sfx));
    applyMuteState();
}

export function setSoundEnabled(enabled: boolean): void {
    soundEnabled = enabled;
    applyMuteState();
    if (enabled && desiredTrack && currentTrack !== desiredTrack) {
        playMusic(desiredTrack);
    }
}

export function isSoundEnabled(): boolean {
    return soundEnabled;
}

export function unlockAudio(): void {
    if (!boundAudio) return;
    try {
        boundAudio.resume();
    } catch {
        // Ignore on backends without suspend/resume.
    }
    if (!audioUnlocked) {
        audioUnlocked = true;
        if (desiredTrack && soundEnabled) {
            const target = desiredTrack;
            currentTrack = null;
            playMusic(target);
        }
    }
}

function releaseMissionVoice(): void {
    const voice = missionVoice;
    if (!voice) return;
    missionVoice = null;
    voice.handle.onEnd = undefined;
    voice.handle.stop();
    voice.audio.releaseBuffer(voice.url);
}

function nextFromShuffle() {
    if (!missionQueue.length) {
        missionQueue = [...MISSION_SOUNDTRACK];
        for (let index = missionQueue.length - 1; index > 0; index--) {
            const other = Math.floor(Math.random() * (index + 1));
            [missionQueue[index], missionQueue[other]] = [missionQueue[other]!, missionQueue[index]!];
        }
        if (missionQueue[0]?.url === previousMissionUrl) {
            [missionQueue[0], missionQueue[1]] = [missionQueue[1]!, missionQueue[0]!];
        }
    }
    return missionQueue.shift()!;
}

export function currentMissionMusic(): string | null {
    return missionTitle;
}

export async function nextMissionMusic(): Promise<void> {
    const audio = boundAudio;
    if (!audio || desiredTrack !== 'game') return;
    const playback = ++missionPlayback;
    releaseMissionVoice();
    missionTitle = null;
    for (let attempt = 0; attempt < MISSION_SOUNDTRACK.length; attempt++) {
        const track = nextFromShuffle();
        let pinned = false;
        try {
            await audio.preload(track.url);
            if (playback !== missionPlayback || audio !== boundAudio) return;
            const buffer = audio.getBufferHandle(track.url);
            if (!buffer || !audio.retainBuffer(track.url)) continue;
            pinned = true;
            audio.stopBGM(0.15);
            const handle = audio.playBuffer(buffer, { bus: 'music', loop: false, volume: 0.30, priority: 10 });
            missionVoice = { audio, handle, url: track.url };
            previousMissionUrl = track.url;
            missionTitle = track.title;
            handle.onEnd = () => {
                if (playback === missionPlayback) void nextMissionMusic();
            };
            return;
        } catch {
            if (pinned) audio.releaseBuffer(track.url);
            if (playback !== missionPlayback) return;
        }
    }
    missionTitle = 'Crimson Space Station';
    try {
        audio.playBGM(MUSIC_PATHS.game.url, { volume: MUSIC_PATHS.game.volume, fadeIn: 0.85 });
    } catch {
        missionTitle = null;
    }
}

export function playMusic(track: MusicTrack): void {
    desiredTrack = track;
    if (track === 'menu' && currentTrack === 'game') {
        missionPlayback++;
        releaseMissionVoice();
        missionTitle = null;
    }
    if (!boundAudio || !soundEnabled || !audioUnlocked) return;
    if (currentTrack === track) return;
    currentTrack = track;
    missionPlayback++;
    releaseMissionVoice();
    missionTitle = null;
    if (track === 'game') {
        missionQueue = [];
        boundAudio.stopBGM(0.6);
        void nextMissionMusic();
        return;
    }
    const spec = MUSIC_PATHS[track];
    try {
        boundAudio.playBGM(spec.url, {
            volume: spec.volume,
            fadeIn: 0.85,
            crossFade: 0.85,
        });
    } catch {
        // Ignore playback errors when audio device is unavailable.
    }
}

export function stopMusic(): void {
    desiredTrack = null;
    currentTrack = null;
    missionPlayback++;
    missionTitle = null;
    releaseMissionVoice();
    if (!boundAudio) return;
    try {
        boundAudio.stopBGM(0.4);
    } catch {
        // Ignore.
    }
}

export function playSfx(kind: SfxKind, opts?: { volume?: number; pitch?: number }): void {
    if (!boundAudio || !soundEnabled) return;
    unlockAudio();
    const spec = SFX_PATHS[kind];
    try {
        boundAudio.playSFX(spec.url, {
            volume: opts?.volume ?? spec.volume,
            pitch: opts?.pitch,
        });
    } catch {
        // Ignore playback errors in headless runs.
    }
}
