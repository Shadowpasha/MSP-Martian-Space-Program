// Sound and vibration for the flight screens.
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
const VOLUME: Record<Sfx, number> = {
    tick: 0.25, blip: 0.5, chime: 0.6, success: 0.6, buzz: 0.5, thunk: 0.7, whoosh: 0.4, beep: 0.5, sparkle: 0.55, launch: 0.8,
    slam: 0.8, count: 0.55, go: 0.6,
};
/** Minimum gap between two plays of the same sound, so fast hovering does not chatter. */
const SPACING_MS: Partial<Record<Sfx, number>> = { tick: 45, blip: 30, buzz: 150, thunk: 80 };

let audio: AudioAPI | null = null;
let soundOn = true;
let vibrationOn = true;
let humOn = false;
const lastPlayed = new Map<Sfx, number>();

/** Called once by the audio bridge system when the engine's audio is ready. */
export function connectAudio(api: AudioAPI): void {
    if (audio) return;
    audio = api;
    try {
        void api.preloadAll(['tick', 'blip', 'chime', 'success', 'buzz', 'thunk', 'whoosh', 'beep', 'sparkle', 'launch', 'slam', 'count', 'go', 'hum'].map(PATH)).catch(() => {});
    } catch { /* audio unavailable: stay silent */ }
    if (humOn) startHum();
}

export function setFeedbackPrefs(prefs: { sound: boolean; vibration: boolean }): void {
    soundOn = prefs.sound;
    vibrationOn = prefs.vibration;
    if (!soundOn) stopHum();
    else if (humOn) startHum();
}

export function play(name: Sfx, pitch = 1): void {
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

/** The menu's background hum: on while the title screen is showing. */
export function menuAmbience(on: boolean): void {
    humOn = on;
    if (on) startHum();
    else stopHum();
}

function startHum(): void {
    if (!soundOn || !audio) return;
    try {
        audio.playBGM(PATH('hum'), { volume: 0.22, fadeIn: 1.2 });
    } catch { /* ignore */ }
}

function stopHum(): void {
    if (!audio) return;
    try {
        audio.stopBGM(0.6);
    } catch { /* ignore */ }
}
