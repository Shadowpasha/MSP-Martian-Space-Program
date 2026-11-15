import type { Entity } from 'esengine';
import type { PlaytestProfile } from '../data/profile';
import { play } from './feedback';
import type { FlightUi } from './flightUi';

export type VolumeField = 'masterVolume' | 'musicVolume' | 'sfxVolume';
export type AudioSettings = Pick<PlaytestProfile, VolumeField | 'soundEnabled'>;

export function showVolumeControls(ui: FlightUi, parent: Entity, top: number, levels: AudioSettings,
    onVolume: (field: VolumeField, value: number) => void): void {
    const p = ui.palette;
    let lastSample = 0;
    const rows = [
        { field: 'masterVolume', title: 'All Audio', detail: 'Overall level for music and sound effects.', color: p.amber },
        { field: 'musicVolume', title: 'Music', detail: 'Menu and mission background music.', color: p.cyan },
        { field: 'sfxVolume', title: 'Sound Effects', detail: 'Interface, launch, and alert sounds.', color: p.good },
    ] as const;
    rows.forEach(({ field, title, detail, color }, index) => {
        const y = top + index * 88;
        ui.label(parent, [24, y, 360, 34], title, { display: true, size: 24 });
        ui.label(parent, [24, y + 34, 460, 24], detail, { color: p.secondary, size: 14 });
        const level = ui.label(parent, [896, y + 14, 72, 32], `${Math.round(levels[field] * 100)}%`, {
            display: true, size: 20, color: levels.soundEnabled ? color : p.muted, center: true,
        });
        ui.slider(parent, [520, y + 18, 360, 24], levels[field], next => {
            const rounded = Math.round(next * 20) / 20;
            ui.setText(level, `${Math.round(rounded * 100)}%`);
            onVolume(field, rounded);
            if (field === 'sfxVolume' && Date.now() - lastSample > 140) {
                lastSample = Date.now();
                play('blip');
            }
        }, { disabled: !levels.soundEnabled, fillColor: color });
    });
}
