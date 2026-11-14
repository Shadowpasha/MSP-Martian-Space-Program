"""Retro UI sound effects for the flight screens, generated in code (standard library only).

Like the pixel art scripts, every sound is drawn from numbers here, so there are no
downloaded files and no licences to track. Run from the repo root:

    python -I scripts/art/sfx.py

Writes 16-bit mono WAV files to assets/audio/ui/. Existing files are overwritten, because
this script is their only source.
"""
import math
import os
import random
import struct
import wave

RATE = 22050
OUT = os.path.join('assets', 'audio', 'ui')


def square(phase):
    return 1.0 if (phase % 1.0) < 0.5 else -1.0


def triangle(phase):
    p = phase % 1.0
    return 4 * p - 1 if p < 0.5 else 3 - 4 * p


def envelope(i, n, attack=0.004, release=None):
    """Quick attack, exponential decay; `release` (s) fades the tail to silence."""
    t = i / RATE
    a = min(1.0, t / attack) if attack > 0 else 1.0
    if release is None:
        return a
    return a * max(0.0, 1.0 - max(0.0, t - (n / RATE - release)) / release)


def tone(freq_at, seconds, wave_fn=square, volume=0.4, decay=8.0, attack=0.003):
    """`freq_at(t)` gives the pitch at time t (s); the amplitude decays as exp(-decay*t)."""
    n = int(RATE * seconds)
    out, phase = [], 0.0
    for i in range(n):
        t = i / RATE
        phase += freq_at(t) / RATE
        amp = volume * math.exp(-decay * t) * min(1.0, t / attack)
        out.append(wave_fn(phase) * amp)
    fade = int(RATE * 0.006)
    for i in range(min(fade, n)):
        out[n - 1 - i] *= i / fade
    return out


def noise(seconds, volume=0.3, decay=6.0, smooth=0.0, seed=1):
    """White noise, optionally low-passed (`smooth` 0..1, higher is darker)."""
    rng = random.Random(seed)
    n = int(RATE * seconds)
    out, last = [], 0.0
    for i in range(n):
        t = i / RATE
        last = last * smooth + rng.uniform(-1, 1) * (1 - smooth)
        out.append(last * volume * math.exp(-decay * t) * min(1.0, t / 0.003))
    return out


def mix(*tracks, offsets=None):
    offsets = offsets or [0.0] * len(tracks)
    length = max(int(o * RATE) + len(tr) for tr, o in zip(tracks, offsets))
    out = [0.0] * length
    for tr, o in zip(tracks, offsets):
        start = int(o * RATE)
        for i, v in enumerate(tr):
            out[start + i] += v
    return out


def save(name, samples):
    os.makedirs(OUT, exist_ok=True)
    peak = max(1e-9, max(abs(s) for s in samples))
    scale = min(1.0, 0.95 / peak)
    path = os.path.join(OUT, f'{name}.wav')
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        w.writeframes(b''.join(struct.pack('<h', int(max(-1, min(1, s * scale)) * 32767)) for s in samples))
    print(f'wrote {path} ({len(samples) / RATE:.2f}s)')


def main():
    random.seed(7)
    # Hover: a tiny, quiet tick.
    save('tick', tone(lambda t: 2200, 0.03, square, volume=0.18, decay=90))
    # Click: a short rising square blip.
    save('blip', tone(lambda t: 620 + 900 * t / 0.07, 0.07, square, volume=0.32, decay=30))
    # Good thing happened (added to crew, packed, unlocked): two bright notes.
    save('chime', mix(tone(lambda t: 880, 0.14, triangle, 0.5, 16), tone(lambda t: 1320, 0.22, triangle, 0.5, 12), offsets=[0, 0.07]))
    # Something complete (crew ready, everything packed): an up arpeggio C-E-G-C.
    notes = [523.25, 659.25, 783.99, 1046.5]
    save('success', mix(*[tone(lambda t, f=f: f, 0.26, triangle, 0.45, 9) for f in notes], offsets=[0, 0.07, 0.14, 0.21]))
    # Not allowed: a low wobbling buzz.
    save('buzz', tone(lambda t: 120 + 14 * math.sin(t * 2 * math.pi * 28), 0.18, square, volume=0.28, decay=10))
    # Cargo lands: a dark thud.
    save('thunk', mix(tone(lambda t: 140 * math.exp(-12 * t) + 50, 0.16, triangle, 0.7, 14), noise(0.09, 0.25, 40, smooth=0.8)))
    # Popup / panel arrives: a soft filtered whoosh.
    n = noise(0.32, 0.5, 0, smooth=0.9, seed=3)
    save('whoosh', [s * math.sin(math.pi * i / len(n)) for i, s in enumerate(n)])
    # Dish on the menu: two quick radio beeps.
    save('beep', mix(tone(lambda t: 1250, 0.07, square, 0.22, 20), tone(lambda t: 1650, 0.09, square, 0.22, 18), offsets=[0, 0.11]))
    # Unlock sparkle: a scatter of high notes.
    sparks = [tone(lambda t, f=f: f, 0.18, triangle, 0.25, 22) for f in (1568, 2093, 1760, 2637, 2349)]
    save('sparkle', mix(*sparks, offsets=[0, 0.04, 0.08, 0.12, 0.16]))
    # Launch: rumble that builds, a rising engine tone, then the whoosh away.
    seconds = 1.6
    rumble = noise(seconds, 0.6, 0, smooth=0.96, seed=5)
    rumble = [s * min(1.0, (i / RATE) / 1.0) for i, s in enumerate(rumble)]
    engine = tone(lambda t: 55 + 140 * (t / seconds) ** 2, seconds, triangle, 0.35, 0)
    engine = [s * min(1.0, (i / RATE) / 0.8) for i, s in enumerate(engine)]
    launch = mix(rumble, engine)
    tail = int(RATE * 0.35)
    for i in range(tail):
        launch[len(launch) - 1 - i] *= i / tail
    save('launch', launch)
    # Launch intro: a heavy impact for things slamming in.
    save('slam', mix(tone(lambda t: 90 * math.exp(-5 * t) + 32, 0.5, triangle, 0.9, 6), noise(0.22, 0.55, 18, smooth=0.6, seed=9)))
    # Launch intro: the countdown beep (3, 2, 1).
    save('count', tone(lambda t: 880, 0.16, square, 0.35, 12))
    # Launch intro: lift-off fanfare, a bright held chord.
    chord = [tone(lambda t, f=f: f, 0.75, square, 0.16, 2.5) for f in (523.25, 659.25, 783.99, 1046.5)]
    save('go', mix(*chord, tone(lambda t: 1046.5 * 2, 0.4, triangle, 0.2, 5), offsets=[0, 0, 0, 0, 0.05]))


if __name__ == '__main__':
    main()
