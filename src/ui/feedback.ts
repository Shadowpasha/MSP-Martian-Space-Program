// Sound effects and vibration for the flight screens. Music, volumes and mute belong to
// src/audio/soundManager.ts; these sounds play on the SFX bus, so its sliders apply to them.
//
// One place decides what a moment sounds and feels like, so every screen stays consistent:
//   tick   hovering a button          blip    clicking a button
//   chime  something good happened    success something is complete
//   buzz   not allowed                thunk   cargo lands in the bay
//   whoosh a panel arrives            beep    the dish on the menu
//   sparkle an upgrade unlocks        launch  lift-off
// Sounds are made by scripts/art/sfx.py. Vibration only works where the device supports it
// (Android phones and tablets); elsewhere it quietly does nothing. Both follow the player's
// Sound and Vibration settings, and nothing here can throw into the UI.
import { Device, type AudioAPI } from 'esengine';

export type Sfx = 'tick' | 'blip' | 'chime' | 'success' | 'buzz' | 'thunk' | 'whoosh' | 'beep' | 'sparkle' | 'launch'
    | 'slam' | 'count' | 'go';

const PATH = (name: string) => `assets/audio/ui/${name}.wav`;
/**
 * Per-sound volume, set so each one sits at the same loudness as the recorded effects in
 * src/audio/soundManager.ts (measured as RMS x volume; the files are all normalised to the same
 * peak by sfx.py). Big moments a little louder, the hover tick much quieter.
 */
const VOLUME: Record<Sfx, number> = {
    tick: 0.08, blip: 0.2, chime: 0.5, success: 0.76, buzz: 0.19, thunk: 0.49, whoosh: 0.41, beep: 0.22,
    sparkle: 0.48, launch: 0.56, slam: 0.9, count: 0.22, go: 0.74,
};
/** Minimum gap between two plays of the same sound, so fast hovering does not chatter. */
const SPACING_MS: Partial<Record<Sfx, number>> = { tick: 45, blip: 30, buzz: 150, thunk: 80 };

let audio: AudioAPI | null = null;
let soundOn = true;
let vibrationOn = true;
const lastPlayed = new Map<Sfx, number>();

/** Called once by the audio bridge system when the engine's audio is ready. */
export function connectAudio(api: AudioAPI): void {
    if (audio) return;
    audio = api;
    try {
        void api.preloadAll(['tick', 'blip', 'chime', 'success', 'buzz', 'thunk', 'whoosh', 'beep', 'sparkle', 'launch', 'slam', 'count', 'go'].map(PATH)).catch(() => {});
    } catch { /* audio unavailable: stay silent */ }
}

export function setFeedbackPrefs(prefs: { sound: boolean; vibration: boolean }): void {
    soundOn = prefs.sound;
    vibrationOn = prefs.vibration;
}

/** Counts every sound started, so a caller can tell whether an action made its own sound. */
let started = 0;
export function soundsStarted(): number {
    return started;
}

export function play(name: Sfx, pitch = 1): void {
    started++;
    if (!soundOn || !audio) return;
    const now = Date.now();
    const gap = SPACING_MS[name];
    if (gap && now - (lastPlayed.get(name) ?? 0) < gap) return;
    lastPlayed.set(name, now);
    try {
        audio.playSFX(PATH(name), { volume: VOLUME[name], pitch });
    } catch { /* ignore */ }
}

/** A short tap or a long rumble on devices that can vibrate. */
export function vibrate(kind: 'short' | 'long' = 'short'): void {
    if (!vibrationOn) return;
    try {
        if (!Device.capabilities().vibration) return;
        void Device.vibrate({ duration: kind }).catch(() => {});
    } catch { /* ignore */ }
}
