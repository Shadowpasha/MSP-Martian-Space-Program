// Hands the engine's Audio resource to the feedback module once it exists. This is its own
// system so that a build without audio only loses sound: the flight screens never depend on it.
import { Audio, defineSystem, Res } from 'esengine';
import { connectAudio } from '../ui/feedback';

export const audioBridgeSystem = defineSystem(
    [Res(Audio)],
    (audio) => {
        connectAudio(audio);
    },
    { name: 'AudioBridgeSystem' },
);
