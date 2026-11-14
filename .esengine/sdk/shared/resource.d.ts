import { ESEngineModule, Vec3 } from './wasm.js';

/**
 * @file    BusEffects.ts
 * @brief   Declarative per-bus DSP inserts — the serializable effect vocabulary
 *          and its WebAudio realization. Defs are pure data (the project audio
 *          config and the editor Mixer speak the same shape); non-WebAudio
 *          backends never see them (AudioAPI gates on a live mixer).
 */
interface FilterEffectDef {
    type: 'filter';
    filter: 'lowpass' | 'highpass' | 'bandpass' | 'lowshelf' | 'highshelf' | 'peaking' | 'notch';
    frequency: number;
    /** Q factor; meaningful for all but the shelf filters. */
    q?: number;
    /** Boost/cut in dB; meaningful for shelf/peaking filters. */
    gainDb?: number;
}
interface ReverbEffectDef {
    type: 'reverb';
    /** Impulse length in seconds (tail size). */
    seconds?: number;
    /** Exponential decay rate of the impulse (higher = tighter room). */
    decay?: number;
    /** Wet mix 0..1 (dry is 1 - wet). */
    wet?: number;
}
interface CompressorEffectDef {
    type: 'compressor';
    thresholdDb?: number;
    ratio?: number;
    attack?: number;
    release?: number;
    kneeDb?: number;
}
type BusEffectDef = FilterEffectDef | ReverbEffectDef | CompressorEffectDef;
/** Normalize arbitrary JSON into a valid effect list (tolerant; drops junk). */
declare function parseBusEffects(raw: unknown): BusEffectDef[];

/**
 * @file    AudioBus.ts
 * @brief   One mixer bus: input → [effect inserts…] → duck → gain(volume) → parent.
 *
 * Sources and child buses connect to `input`; `node` is the OUTPUT gain (what
 * volume/mute act on, and what parents/analysers tap). The duck stage is a
 * separate gain so sidechain ducking never fights the user's volume setting.
 */

interface AudioBusConfig {
    name: string;
    volume?: number;
    muted?: boolean;
    parent?: string;
}
declare class AudioBus {
    private readonly name_;
    private readonly context_;
    private readonly inputNode_;
    private readonly duckNode_;
    private readonly gainNode_;
    private muted_;
    private volume_;
    private children_;
    private effectDefs_;
    private effectNodes_;
    constructor(context: AudioContext, config: AudioBusConfig);
    get name(): string;
    /** Entry node — sources and child buses connect HERE. */
    get input(): GainNode;
    /** Output gain (volume/mute stage) — parents and analyser taps connect FROM here. */
    get node(): GainNode;
    get volume(): number;
    set volume(v: number);
    get muted(): boolean;
    set muted(m: boolean);
    /** The declarative insert chain currently realized on this bus. */
    get effects(): BusEffectDef[];
    /** Idempotently replace the insert chain: input → e1 → … → duck. */
    setEffects(defs: BusEffectDef[]): void;
    /** Sidechain duck stage: ramp toward `level` with the given time constant. */
    duckTo(level: number, timeConstant: number): void;
    connect(destination: AudioBus | AudioNode): void;
    addChild(child: AudioBus): void;
}

interface AudioMixerConfig {
    masterVolume?: number;
    musicVolume?: number;
    sfxVolume?: number;
    uiVolume?: number;
    voiceVolume?: number;
}
/**
 * Sidechain ducking rule: while `trigger` carries signal, the target bus's
 * duck stage ramps to `amount`; when it falls silent, it ramps back to 1.
 */
interface BusDuckRule {
    trigger: string;
    /** Duck level 0..1 while the trigger bus is active. */
    amount: number;
    /** Ramp-down time constant in seconds (default 0.05). */
    attack?: number;
    /** Ramp-up time constant in seconds (default 0.4). */
    release?: number;
    /** RMS level (0..1) above which the trigger counts as active (default 0.003). */
    threshold?: number;
}
/**
 * The buses every mixer starts with, their parent, and what each rests at.
 *
 * Declared because a second reader needs it: an editor showing a project's
 * overrides has to know what an override is a change FROM, and a copy of these
 * numbers there would be a second author for a runtime fact.
 */
declare const BUILTIN_AUDIO_BUSES: readonly [{
    readonly name: "master";
    readonly parent: null;
    readonly volume: 1;
}, {
    readonly name: "music";
    readonly parent: "master";
    readonly volume: 0.8;
}, {
    readonly name: "sfx";
    readonly parent: "master";
    readonly volume: 1;
}, {
    readonly name: "ui";
    readonly parent: "master";
    readonly volume: 1;
}, {
    readonly name: "voice";
    readonly parent: "master";
    readonly volume: 1;
}];
/** A built-in bus's resting volume, or null when `name` is not one of them. */
declare function builtinBusVolume(name: string): number | null;
declare class AudioMixer {
    readonly master: AudioBus;
    readonly music: AudioBus;
    readonly sfx: AudioBus;
    readonly ui: AudioBus;
    readonly voice: AudioBus;
    private readonly context_;
    private readonly buses_;
    constructor(context: AudioContext, config?: AudioMixerConfig);
    getBus(name: string): AudioBus | undefined;
    /** Registered bus names, in creation order (master first). */
    busNames(): string[];
    createBus(config: AudioBusConfig): AudioBus;
    private ducks_;
    /** Install (or clear with null) the duck rule targeting `target`. */
    setDucking(target: string, rule: BusDuckRule | null): boolean;
    getDucking(target: string): BusDuckRule | null;
    /** Per-frame: measure each trigger's RMS and ramp its target's duck stage. */
    updateDucking(): void;
}

interface AudioHandle {
    readonly id: number;
    stop(): void;
    pause(): void;
    resume(): void;
    setVolume(volume: number): void;
    setPan(pan: number): void;
    setLoop(loop: boolean): void;
    setPlaybackRate(rate: number): void;
    readonly isPlaying: boolean;
    readonly currentTime: number;
    readonly duration: number;
    onEnd?: () => void;
}
/**
 * How a clip is held: `decompress` decodes it to PCM at load, `streaming` plays it from its compressed
 * file, `auto` lets its length decide (see audioStreaming.ts) — the same rule on the web and on a native
 * host, so a track that streams in the editor streams on the phone. A backend with one way of playing a
 * clip ignores it.
 */
type AudioLoadType = 'auto' | 'decompress' | 'streaming';
/**
 * What re-encoding did to a clip: `seconds` is how long it really is, `lead` the silence the encoding put in front
 * of it. A backend plays it from past the lead and ends or loops it at lead + seconds, so a clip is in a packaged
 * game what it was as a WAV: on time, and seamless where it was made to loop.
 */
interface AudioClipTrim {
    seconds: number;
    lead: number;
}
interface AudioLoadOptions {
    loadType?: AudioLoadType;
    trim?: AudioClipTrim;
}
interface AudioBufferHandle {
    readonly id: number;
    readonly duration: number;
    /**
     * Played from the compressed file, not decoded. `bytes` is then what the backend still keeps of it — nothing
     * where the host's media element reads the file (web), the file itself where the engine decodes from memory
     * (native) — and `savedBytes` is what decoding would have cost on top of that.
     */
    readonly streamed?: boolean;
    /** The PCM a streamed clip did not take, estimated from its length. */
    readonly savedBytes?: number;
    /**
     * Decoded size in bytes, for the audio residency budget. Backends that
     * hold real decoded PCM (WebAudio) report it; streaming backends (WeChat
     * InnerAudioContext plays from file) omit it — 0/undefined means
     * untracked, and untracked entries never count against the budget.
     */
    readonly bytes?: number;
}
interface PlayConfig {
    volume?: number;
    pan?: number;
    loop?: boolean;
    playbackRate?: number;
    bus?: string;
    priority?: number;
    startOffset?: number;
    /**
     * With `loop`: seconds into the clip that it comes back to when it reaches its end, in place of its start. A
     * piece with an introduction is one file, played from the top once and round from here ever after. Exact to the
     * sample where the clip is decoded; where it is played from its compressed file (a long clip on the web, a
     * mini-game) the player is sent back when it ends, which can be heard as a breath.
     */
    loopStart?: number;
    /**
     * Voices played with the same token begin on the same sample: the layers of one piece of music, which are only
     * that piece while they are in step. The token is any object, held for as long as voices are still being added
     * under it. A backend that plays each clip through a player of its own (a mini-game, a streamed clip) cannot
     * promise it and starts them one after another.
     */
    together?: object;
}
interface AudioBackendInitOptions {
    initialPoolSize?: number;
    mixerConfig?: AudioMixerConfig;
}
/**
 * What a backend needs in order to play a clip: `bytes` decodes a buffer the
 * caller fetched, `url` hands the host a source it fetches itself (a mini-game's
 * InnerAudioContext). A `url` backend given a cache KEY rather than a resolved
 * source plays a file the package does not carry.
 */
type AudioDelivery = 'bytes' | 'url';
interface PlatformAudioBackend {
    readonly name: string;
    readonly mixer: AudioMixer | null;
    readonly isReady: boolean;
    /** See {@link AudioDelivery}. */
    readonly delivery: AudioDelivery;
    initialize(options?: AudioBackendInitOptions): Promise<void>;
    ensureResumed(): Promise<void>;
    /** @param src a RESOLVED source the host can fetch — never a cache key. */
    loadBuffer(src: string, options?: AudioLoadOptions): Promise<AudioBufferHandle>;
    /** @param src as {@link loadBuffer}; `bytes` backends use `data` and ignore it. */
    loadBufferFromData(src: string, data: ArrayBuffer, options?: AudioLoadOptions): Promise<AudioBufferHandle>;
    unloadBuffer(handle: AudioBufferHandle): void;
    /** Forget source-address reuse after an authored clip changes. */
    invalidateSource?(src: string): void;
    play(buffer: AudioBufferHandle, config: PlayConfig): AudioHandle;
    suspend(): void;
    resume(): void;
    dispose(): void;
    /** Fill `out` with the master output's frequency magnitudes (0-255 per bin,
     *  low→high), returning true. Optional: backends without analysis (e.g.
     *  WeChat) omit it, and callers treat a missing method as silence. */
    getFrequencyData?(out: Uint8Array): boolean;
}

/** Buffer residency counters. See {@link AudioAPI.getBufferStats}. */
interface AudioBufferStats {
    /** Authored cache entries; aliases can share one decoded allocation. */
    bufferCount: number;
    /** Unique decoded bytes resident (held + evictable entries). */
    bufferBytes: number;
    /** The effective byte budget (0 = warm cache off). */
    bufferBudget: number;
    /** Warm-cache entries (refCount 0) awaiting revive or eviction. */
    evictableCount: number;
    /** Clips played from their compressed file instead of being decoded (unique, not per alias). */
    streamedCount: number;
    /** The PCM those clips did not take, estimated from their length: what `bufferBytes` would be if they were decoded. */
    streamedSavedBytes: number;
}
/**
 * A piece of music playing as its layers: each a clip of the same length, begun on the same sample and going round
 * together, each with a level of its own that can be brought up or down while it plays. The drums come in when the
 * fight starts and the melody goes when the player is hiding, and it is one piece of music throughout.
 */
interface MusicLayers {
    readonly names: readonly string[];
    /**
     * False where the layers could not be kept in step and the whole piece is playing in their place (a mini-game, a
     * clip played from its compressed file): {@link setLayer} then changes nothing that is heard.
     */
    readonly layered: boolean;
    /** The layers began on one sample and stay together. False where they were started one after another for want of a way to do better. */
    readonly inStep: boolean;
    /** Bring one layer to @p level, 0..1, over @p seconds (default 1; 0 is at once). */
    setLayer(name: string, level: number, seconds?: number): void;
    /** Where a layer is now, on its way or arrived. */
    layerLevel(name: string): number;
    stop(fadeOut?: number): void;
    readonly isPlaying: boolean;
}
interface MusicLayersConfig {
    /**
     * The whole piece as one clip, played where the layers cannot be kept in step. Layers that drift are worse than no
     * layers: a mini-game plays each clip through a player of its own, and so does a clip played from its compressed
     * file. Without it the layers are started one after another there, and a warning says so.
     */
    mix?: string;
    volume?: number;
    /** Where each layer starts, 0..1. A layer not named starts at 1. */
    levels?: Readonly<Record<string, number>>;
    fadeIn?: number;
    crossFade?: number;
    /** As for playBGM: seconds every layer comes back to at its end, for a piece with an introduction. */
    loopStart?: number;
}
declare class AudioAPI {
    private readonly voiceStates_;
    private readonly playbackStops_;
    private readonly backend_;
    private readonly mixer_;
    private readonly bufferCache_;
    private readonly loadingBuffers_;
    private readonly bufferSources_;
    /** refCount==0 urls in eviction order (oldest first); access re-appends. */
    private readonly evictOrder_;
    /** Urls a play is waiting on, by how many: not evictable until that play has started. */
    private readonly awaitingPlay_;
    /** Clips already reported as larger than the whole budget. */
    private readonly oversizeReported_;
    private residentBytes_;
    private bufferBudgetOverride_;
    /** Importer choices by authored path; a clip with none is `auto`. */
    private loadTypes_;
    private encoded_;
    private bgmHandle_;
    /** The music that is playing, where it is playing as layers. One or the other, never both. */
    private bgmGroup_;
    private layersWarned_;
    private bgmRequest_;
    private playbackEpoch_;
    private bgmVolume_;
    /** Volume ramps in flight, advanced by {@link updateFades} from the frame
     *  loop — NOT by requestAnimationFrame, which is a browser global a device
     *  does not have (and which would keep ramping while the game is paused). */
    private readonly fades_;
    /**
     * Bus volume / mute for a backend with no mixer GRAPH (a device, WeChat):
     * the mixer's gain nodes are one way to apply a bus, not the meaning of one,
     * so where there are no nodes the gain is folded into each voice instead —
     * at play, and again on every voice already playing when a bus changes. The
     * mixer stays authoritative wherever it exists.
     */
    private readonly softBuses_;
    /** Voices whose volume this API computes: base × bus gain × fade. */
    private softVoices_;
    /**
     * How many voices may sound at once. There has to be a ceiling for
     * `priority` to mean anything: without one nothing is ever dropped, and the
     * field only describes an ordering that never happens.
     */
    private maxVoices_;
    private voiceSeq_;
    private readonly fadingOut_;
    private disposed_;
    private suspended_;
    private deviceSuspended_;
    private assetResolver_;
    private refResolver_;
    baseUrl: string;
    constructor(backend: PlatformAudioBackend, mixer?: AudioMixer | null);
    /** What this platform's backend needs in order to play a clip — asked by the
     *  asset loader, so a `url` backend is not made to wait on a fetch whose
     *  bytes it then drops. See {@link AudioDelivery}. */
    get delivery(): AudioDelivery;
    /** The effective warm-cache byte budget: an explicit override, else the
     *  live `RuntimeConfig.audioCacheBudget` (so build-config changes apply
     *  without plumbing). 0 disables the warm cache — a buffer is freed the
     *  moment its refCount reaches 0. */
    get bufferBudget(): number;
    /** Override the warm-cache byte budget; `null` returns to RuntimeConfig. */
    setBufferBudget(bytes: number | null): void;
    /**
     * Pin a cached buffer: refCount + 1 (reviving an evictable entry back to
     * held). Returns false on a miss — the caller must load and re-acquire.
     * Every retain needs a matching {@link releaseBuffer}.
     */
    retainBuffer(url: string): boolean;
    /**
     * Unpin a buffer. At refCount 0 it becomes an evictable warm-cache entry
     * (bounded by {@link bufferBudget}) — still instantly playable and
     * revivable by {@link retainBuffer} — or is freed outright when the
     * budget is 0.
     */
    releaseBuffer(url: string): void;
    /** End cached and pending loads for changed source bytes. Playing sources
     *  keep their decoded data; later loads fetch fresh. Returns whether a load ended. */
    invalidateBuffer(url: string): boolean;
    /**
     * Free every evictable warm-cache buffer now (memory pressure). Held
     * buffers and the budget are untouched; the cache refills as buffers are
     * released afterwards. Returns the number of unique decoded buffers freed.
     */
    trimBufferCache(): number;
    /**
     * How each clip the importer was told about is held. Keyed by the clip's project-relative path, the way
     * the asset loader and `play` address it; anything absent is `auto`. A clip already loaded keeps how it
     * was loaded until it is reloaded.
     */
    setLoadTypes(types: Readonly<Record<string, AudioLoadType>> | null): void;
    /**
     * What the exporter's encoding did to each clip, keyed as {@link setLoadTypes} is. A clip named here is played
     * from past the silence encoding put before it and ended or looped at its real length. A clip already loaded
     * keeps how it was loaded.
     */
    setEncodedClips(clips: Readonly<Record<string, AudioClipTrim>> | null): void;
    private loadOptions_;
    /** Buffer residency counters — the observability side of the budget. */
    getBufferStats(): AudioBufferStats;
    /** Register a decoded buffer as an evictable warm-cache entry. The budget
     *  is enforced against the OLD warm entries before the new one joins the
     *  eviction pool — mirroring the C++ pool's add(), where a just-created
     *  resource can't be the one evicted to make room for itself (a caller
     *  about to pin or play it would find it already gone). */
    private insertEntry_;
    /**
     * A clip that is larger than the whole budget cannot be kept warm: making room for it empties the cache,
     * and the next clip to load evicts it in turn, so it is decoded again every time it is played. Nothing
     * about that is visible from the game — the sound just starts late, or not at all — so it is said once.
     */
    private reportOversize_;
    /** Cache lookup for playback: refreshes the LRU position of an evictable
     *  entry so frequently-played warm sounds aren't the first to go. */
    private lookupBuffer_;
    private freeBuffer_;
    private releaseSource_;
    /** Evict oldest warm-cache entries until resident bytes fit the budget.
     *  Held (refCount > 0) entries are never evicted. */
    private enforceBudget_;
    setAssetResolver(resolver: (url: string) => ArrayBuffer | null): void;
    /**
     * Route play refs through the realm's single asset resolver — the same
     * channel every other asset type resolves through (uuid manifest, cooked
     * logical→staged maps, project base). Takes precedence over the legacy
     * `baseUrl` prefix, so `playSFX('assets/…')` works in cooked builds whose
     * content-addressed staging renamed the physical files.
     */
    setRefResolver(resolver: ((ref: string) => string) | null): void;
    private resolveUrl_;
    /** Coalesce authored requests through their captured physical source. */
    private ensureBuffer_;
    preload(url: string): Promise<void>;
    /**
     * Load `url` for a play that is waiting on it and start that play, as one step: the clip cannot be
     * evicted between arriving and being played, which is what a load finishing beside it used to do to a
     * clip larger than the budget. Says so when the clip is not there to play after all, instead of the
     * silence that left a game with no music and nothing in its log.
     */
    private loadThenPlay_;
    preloadAll(urls: string[]): Promise<void>;
    /**
     * Cache `url`'s clip from bytes the caller already holds. `url` is the
     * AUTHORED path this API is addressed by (the key `retainBuffer` and
     * `getBufferHandle` take); the backend is handed the RESOLVED source, which
     * for a `url`-delivery backend is the only thing it plays.
     */
    preloadFromData(url: string, data: ArrayBuffer): Promise<void>;
    /**
     * Play a fully-RESOLVED clip URL on an explicit bus (created on demand
     * under master). Unlike playSFX/playBGM this applies no ref resolution —
     * the caller already holds the final URL (the video system's audio track
     * derives it from the resolved video source). Null when the clip can't
     * load; loaded buffers share the residency cache.
     */
    playTrack(url: string, config?: PlayConfig): Promise<AudioHandle | null>;
    playSFX(url: string, config?: {
        volume?: number;
        pitch?: number;
        pan?: number;
        priority?: number;
    }): AudioHandle;
    /**
     * Background music: one piece at a time, round and round. `fadeIn` brings it up over that many seconds and
     * `crossFade` brings it up as the piece before goes down. `loopStart` is for a piece with an introduction:
     * the file plays from its top once, and each time it reaches its end it comes back to that many seconds in,
     * so the introduction is heard once and what follows it goes round.
     */
    playBGM(url: string, config?: {
        volume?: number;
        fadeIn?: number;
        crossFade?: number;
        loopStart?: number;
    }): void;
    /** What was playing as music goes: at once, or down over @p fade seconds. Its layers go with it. */
    private retireMusic_;
    /**
     * Background music as layers: every clip begun on the same sample and looping together, each with a level of its
     * own. `layers` names them, `{ drums: 'a_drums.wav', melody: 'a_melody.wav' }`, and they must be as long as one
     * another, which the stems of one piece are. It takes the place of whatever music was playing, as playBGM does,
     * and stopBGM ends it.
     *
     * Layers are only music while they are in step. Where the backend decodes its clips they are, to the sample; where
     * it cannot promise it and `mix` names the whole piece as one clip, that plays instead.
     */
    playLayers(layers: Readonly<Record<string, string>>, config?: MusicLayersConfig): MusicLayers;
    /** A layer's level written to its voice: the piece's volume times the layer's own. */
    private applyLayer_;
    stopAll(): void;
    /** @internal Generation boundary for pending playback intents. */
    get playbackGeneration(): number;
    /** @internal Terminal and paused ownership comes from the global voice pool. */
    getVoiceState(handle: AudioHandle): 'playing' | 'paused' | 'ended' | 'stopped' | 'untracked';
    /** @internal Stop pending consumers after every old backend voice was stopped. */
    onPlaybackStop(callback: (generation: number) => void): () => void;
    stopBGM(fadeOut?: number): void;
    /**
     * Suspend the whole audio device (every voice, every bus) without touching
     * any volume the user set — the device-level pause a fullscreen takeover
     * (a rewarded ad, an OS interruption) wants, where per-bus volumes would
     * fight the mixer's own state. Balanced by {@link resume}.
     */
    suspend(): void;
    /** Resume the audio device after {@link suspend}. */
    resume(): void;
    private syncHostSuspension_;
    setMasterVolume(volume: number): void;
    setMusicVolume(volume: number): void;
    setSFXVolume(volume: number): void;
    setUIVolume(volume: number): void;
    /** Mixerless backends (WeChat/Null) report unity volume and unmuted —
     *  the read-side mirror of the volume setters' silent no-op there. */
    getMasterVolume(): number;
    getMusicVolume(): number;
    getSFXVolume(): number;
    getUIVolume(): number;
    /** Unity (1) for an unknown bus. */
    getBusVolume(busName: string): number;
    isBusMuted(busName: string): boolean;
    /** Record a bus change for a mixerless backend and push it to live voices —
     *  what a gain node would have done to the tracks already playing. */
    private setSoftBus_;
    /** The gain a mixerless backend folds into a voice: its bus, times master. */
    private softGain_;
    /** Push a voice's computed volume to the backend. */
    private applyVoice_;
    /** Re-apply after a bus (or master) changed, and forget voices that ended. */
    private applyBus_;
    private fadeOf_;
    /** Play through the backend as a tracked voice, so bus gain and fades have
     *  one place to act — on every platform, mixer graph or not. */
    /**
     * Play an already-resolved buffer. The one door every voice comes through —
     * a scripted `playSFX`, a `playBGM`, an `AudioSource` in the scene — so the
     * bus gain a backend without a mixer graph cannot apply, and the voice cap
     * `priority` is measured against, are decided once for all of them.
     */
    playBuffer(buffer: AudioBufferHandle, config?: PlayConfig): AudioHandle;
    /** The voice ceiling; 0 or less means no cap. @see playBuffer */
    setMaxVoices(max: number): void;
    get maxVoices(): number;
    private playVoice_;
    /**
     * Drop the least valuable voice if the pool is full, so a new one of
     * @p priority can sound. False when the new voice is the least valuable
     * itself. Ties go to the OLDER voice, which is what keeps a repeated sound
     * audible: every shot of a machine gun is worth the same.
     */
    private makeRoomForVoice_;
    muteBus(busName: string, muted: boolean): void;
    /**
     * Whether this backend has a mixer graph at all. @experimental
     *
     * The fact behind every `false` the bus calls below return, reported once so a
     * reader does not have to infer a capability from a failed write. Without one,
     * {@link applyAudioProjectConfig} applies `maxVoices` and stops before the bus
     * list — so an authored mixer is not partly applied, it is not applied.
     */
    hasMixerGraph(): boolean;
    /** Ensure a named bus exists (creating it under `parent` ?? master).
     *  False on backends without a mixer graph. */
    ensureBus(name: string, parent?: string): boolean;
    setBusVolume(busName: string, volume: number): void;
    /** Replace a bus's DSP insert chain. No-op (false) on backends without a
     *  WebAudio graph (WeChat/Null) — same degradation as the volume APIs. */
    setBusEffects(busName: string, effects: BusEffectDef[]): boolean;
    getBusEffects(busName: string): BusEffectDef[];
    /** Install (or clear with null) sidechain ducking on `target` — e.g. duck
     *  'music' to 30% while 'voice' carries signal. */
    setBusDucking(target: string, rule: BusDuckRule | null): boolean;
    getBusDucking(target: string): BusDuckRule | null;
    /** Advance duck envelopes (driven per-frame by AudioUpdateSystem). */
    updateDucking(): void;
    getBufferHandle(url: string): AudioBufferHandle | undefined;
    /** Fill `out` with the master output's frequency spectrum (0-255 per bin,
     *  low→high) for visualizers. Returns false on backends without analysis
     *  (e.g. WeChat) — callers should treat that as silence. */
    getSpectrum(out: Uint8Array): boolean;
    dispose(): void;
    /**
     * Advance every fade by `dt` seconds — called once a frame by the audio
     * system, which is what makes a fade the game's clock rather than the
     * browser's: it pauses when the game does, and it exists on a device.
     */
    updateFades(dt: number): void;
    private fadeIn_;
    /** The tracked voice for a handle, registering one if it came from outside
     *  the play path (a deferred handle resolved later). */
    private voiceOf_;
    /** Cancel every in-flight fade AND stop the tracks that were fading out — a
     *  cancelled fade would otherwise never reach their `stop()`. */
    private cancelFades_;
    private fadeOut_;
    private createDeferredHandle_;
}
/** Resource handle for the per-app audio API. */
/**
 * Playback, buses and mixing, as `Res(Audio)` hands it over.
 *
 * `@beta`: a certified run now drives a loop and reads the master bus's analyser,
 * so a break here is noticed — but the corpus reaches a handful of twenty-three
 * audio symbols, which is thin evidence for freezing the shape.
 *
 * @beta
 */
declare const Audio: ResourceDef<AudioAPI>;

/** Spine skeleton format versions Estella ships a dedicated runtime for. */
type SpineVersion = '2.1' | '3.8' | '4.1' | '4.2' | '4.3';
/** The modules the engine itself builds and ships. */
type BuiltinSideModuleId = 'physics' | 'physics3d' | 'physics3d:physx' | 'basis' | 'videodec' | 'dragonbones' | `spine:${SpineVersion}`;
/**
 * Identifies an optional native module across every realm and transport.
 *
 * OPEN, like `ExportPlatform` and `MiniGameVendor`: the built-ins are named for
 * completion, but a project can drop its own module in `.esengine/modules/<id>/`
 * and that id flows through acquisition, the export and every transport exactly
 * like a built-in one. Nothing here branches on the value — it is identity.
 *
 * This is what lets a third-party runtime (a vector-animation player, another
 * physics engine) be a MODULE rather than something a game has to fetch and
 * instantiate for itself. Doing it by hand works on the web and falls apart
 * everywhere else: a mini-game has no `fetch` and needs its binary staged into
 * the package, and a playable needs it inlined as base64. Those are the
 * transports below, and they are the whole reason to be in this table.
 */
type SideModuleId = BuiltinSideModuleId | (string & {});
interface SideModuleDescriptor {
    /** Artifact base name: the glue is `<file>.js`, the binary `<file>.wasm`. */
    file: string;
    /**
     * Global the emscripten glue assigns its factory to (`MODULARIZE` +
     * `EXPORT_NAME`). When absent the glue is an ES6 module whose `default`
     * export IS the factory. This is the only thing that varies between the
     * physics glue (ES6 default) and the spine glue (named global) loaders.
     */
    globalName?: string;
}
declare const SIDE_MODULES: Record<BuiltinSideModuleId, SideModuleDescriptor>;
/** The 3D physics backends a project can choose (Project Settings → Physics). */
type Physics3DBackend = 'jolt' | 'physx';
/** The side module that implements the 3D world for `backend`; Jolt when unset. */
declare function physics3dModuleId(backend?: Physics3DBackend): BuiltinSideModuleId;
declare const SPINE_VERSIONS: readonly SpineVersion[];
/** The {@link SideModuleId} carrying a given spine skeleton version. */
declare function spineModuleId(version: SpineVersion): SideModuleId;
/**
 * Declare a module the engine did not build.
 *
 * Called by the runtime from the packaged game's config (which the export writes
 * from `.esengine/modules/`), so a game never registers by hand — but it is
 * public, because a host embedding the engine may know its modules some other
 * way. Registering an id the engine owns is refused: `physics` meaning two
 * different binaries depending on load order is not a capability.
 */
declare function registerSideModule(id: string, descriptor: SideModuleDescriptor): void;
/** How every transport and the exporters resolve an id. Built-ins win. */
declare function sideModuleDescriptor(id: SideModuleId): SideModuleDescriptor | undefined;
/** The ids a project declared — what an editor or a diagnostic lists. */
declare function projectSideModuleIds(): string[];
/** Drop every project-declared module. Realm teardown: a reloaded play session
 *  must not inherit the previous project's modules. */
declare function clearProjectSideModules(): void;

/** The instantiated emscripten module. Consumers cwrap their own `_*` exports. */
type SideModule = Record<string, unknown>;
/** Realm-agnostic acquirer for optional native modules. */
interface SideModuleHost {
    /** Instantiate `id` for this realm (cached); null if unavailable or it failed. */
    acquire(id: SideModuleId): Promise<SideModule | null>;
    /** The glue and binary `id` is instantiated from, for a worker to instantiate
     *  its own copy; absent where the realm has none to hand over. */
    source?(id: SideModuleId): Promise<SideModuleSource | null>;
    /**
     * Tie something to this host's life: a pool of workers that each instantiated
     * one of its modules. `release` runs once, when the host is disposed — or at
     * once, if it already has been.
     */
    onDispose?(release: () => void): void;
    /**
     * Let go of everything the host holds: the instances it cached and whatever
     * was tied to it. Whoever made the host calls this when the realm it served
     * is over; an App does it on quit for a host it created itself. Idempotent,
     * and a disposed host answers every later `acquire` with null.
     *
     * Nothing else ends these. A worker is never collected while it runs, and
     * each one holds a WebAssembly memory, so a host dropped without this leaks
     * them for as long as the page lives.
     */
    dispose?(): void;
}
interface SideModuleSource {
    readonly glueText: string;
    /** The global the glue defines its factory as. */
    readonly globalName: string;
    readonly wasmBytes: ArrayBuffer;
}
/** A factory produced by an emscripten `MODULARIZE` glue. */
type EmscriptenFactory = (opts: Record<string, unknown>) => Promise<SideModule>;

interface VideoStreamHandle {
    readonly id: number;
    /** Frame texture handle; 0 until isReady. Pathless (never evicted). */
    readonly textureHandle: number;
    readonly width: number;
    readonly height: number;
    readonly bytes?: number;
    readonly isReady: boolean;
    readonly isPlaying: boolean;
    readonly currentTime: number;
    readonly duration: number;
    play(): void;
    pause(): void;
    stop(): void;
    seek(timeSeconds: number): void;
    setVolume(volume: number): void;
    setMuted(muted: boolean): void;
    setLoop(loop: boolean): void;
    setPlaybackRate(rate: number): void;
    /** Upload the current frame if a new one arrived; called once per frame. */
    /** @param module the wasm engine module, or null on a core with no heap —
     *  the texture upload takes bytes directly there. */
    pump(module: ESEngineModule | null): void;
    onReady?: () => void;
    onEnded?: () => void;
    onError?: (error: unknown) => void;
}
interface VideoStreamOptions {
    autoplay?: boolean;
    loop?: boolean;
    muted?: boolean;
    volume?: number;
    playbackRate?: number;
    /** Resolved URL of the cook-demuxed audio-track sibling, when the realm's
     *  manifest knows one (content-addressed staging renames files, so it can't
     *  be derived from the video URL). Backends without out-of-band audio
     *  (HTMLVideoElement) ignore it. */
    audioTrackUrl?: string;
}
interface PlatformVideoBackend {
    readonly name: string;
    createStream(url: string, options: VideoStreamOptions): VideoStreamHandle;
    dispose(): void;
}
/**
 * What the app hands a platform's backend factory. Both accessors are lazy —
 * the side-module host and the audio service may attach to the app after
 * plugins build, so backends resolve them per stream, not at construction.
 */
interface VideoBackendContext {
    sideModules(): SideModuleHost | null;
    /** The app's audio service, when the audio plugin is installed. The wasm
     *  backend plays the cook-demuxed `.m4a` audio track through it and slaves
     *  the video clock to the track's playhead. */
    audio?(): AudioAPI | null;
}

type DeviceRequestStatus = 'ok' | 'unavailable' | 'denied' | 'failed';
interface DeviceResult {
    status: DeviceRequestStatus;
    reason?: string;
}
interface DeviceCapabilities {
    accelerometer: boolean;
    gyroscope: boolean;
    orientation: boolean;
    vibration: boolean;
    vibrationIntensity: boolean;
    keepScreenOn: boolean;
    fullscreen: boolean;
    pointerLock: boolean;
}
type MotionRate = 'normal' | 'ui' | 'game';
interface MotionOptions {
    accelerometer?: boolean;
    gyroscope?: boolean;
    orientation?: boolean;
    rate?: MotionRate;
}
/** SI units: acceleration/gravity in m/s², angular velocity in rad/s.
 * Orientation angles are degrees; unavailable channels are null. */
interface MotionSample {
    timestamp: number;
    acceleration: Vec3 | null;
    accelerationIncludingGravity: Vec3 | null;
    gyroscope: Vec3 | null;
    gravity: Vec3 | null;
    orientation: Vec3 | null;
}
type VibrationIntensity = 'light' | 'medium' | 'heavy';
interface VibrationOptions {
    duration?: 'short' | 'long';
    intensity?: VibrationIntensity;
}
interface DeviceState {
    fullscreen: boolean;
    pointerLocked: boolean;
    screenOn: boolean;
    motionActive: boolean;
}
/** How much the device has left to give: the battery and how hot it runs. A null is a thing this platform does not say, which is not the same as nothing being wrong. */
interface PowerState {
    /** The battery's charge, 0 to 1. */
    level: number | null;
    charging: boolean | null;
    /** Thermal pressure on the processor, as the platform reports it. */
    thermal: 'nominal' | 'fair' | 'serious' | 'critical' | null;
}
interface DeviceBackend {
    /** The device's battery and thermal state, from what the platform has told it so far. Absent on a backend that cannot know. */
    power?(): PowerState;
    capabilities(): DeviceCapabilities;
    state(): DeviceState;
    startMotion(options?: MotionOptions): Promise<DeviceResult>;
    stopMotion(): Promise<DeviceResult>;
    onMotion(handler: (sample: MotionSample) => void): () => void;
    onStateChange(handler: (state: DeviceState) => void): () => void;
    vibrate(options?: VibrationOptions): Promise<DeviceResult>;
    keepScreenOn(enabled: boolean): Promise<DeviceResult>;
    fullscreen(enabled: boolean, target?: unknown): Promise<DeviceResult>;
    pointerLock(enabled: boolean, target?: unknown): Promise<DeviceResult>;
    dispose(): void;
}

/**
 * What a platform answers. The same shape as {@link AdProvider} and
 * {@link LeaderboardProvider}: the engine orchestrates, the provider does the
 * platform's half, and the editor installs one to rehearse without a store.
 */
interface AchievementProvider {
    /** Whether a real store is behind this, rather than a local stand-in. Decides
     *  {@link AchievementsAPI.available}. */
    readonly platformBacked: boolean;
    unlock(id: string): Promise<void>;
    unlocked(id: string): boolean;
    setStat(name: string, value: number): void;
    getStat(name: string): number;
    /** Push everything set since the last call. Stores batch; a local provider
     *  has already persisted and answers immediately. */
    store(): Promise<void>;
    /** Clear every achievement and stat. A development affordance — no shipped
     *  game calls it, and stores treat it as a test-only operation. */
    reset(): Promise<void>;
}
/**
 * The stand-in every platform without a store gets, and what Play rehearses on.
 *
 * It persists — an achievement that forgets itself on restart rehearses nothing —
 * through {@link Storage}, which on desktop is the directory a store's cloud save
 * syncs.
 */
declare function createLocalAchievements(): AchievementProvider;
declare class AchievementsAPI {
    private provider_;
    private known_;
    /** Whether a STORE is behind this. False still records unlocks — it means the
     *  platform will not draw its own notification, so a game that wants one
     *  should draw it. */
    get available(): boolean;
    /** The ids this game declares, from the project's packaging settings. Absent
     *  ⇒ nothing is checked, which is what an older project gets. */
    setKnown(ids: readonly string[] | null): void;
    /** Install (or restore the local default with null) the provider that answers
     *  for this platform. */
    setProvider(provider: AchievementProvider | null): void;
    /**
     * Unlock @p id. Idempotent: re-unlocking is what a game does every time it
     * re-checks a condition, and no store treats it as an event.
     *
     * An id outside the declared set is REFUSED, not forwarded — a store would
     * accept it and do nothing.
     */
    unlock(id: string): Promise<void>;
    /** Whether @p id is unlocked, as the platform currently reports it. */
    unlocked(id: string): boolean;
    /** Set a stat a store may track (and may unlock an achievement from). */
    setStat(name: string, value: number): void;
    getStat(name: string): number;
    /** Push what has been set. Cheap to call often; stores batch behind it. */
    store(): Promise<void>;
    /** Development only: clear everything. */
    reset(): Promise<void>;
    private check_;
}
declare const Achievements: ResourceDef<AchievementsAPI>;

/**
 * @file  power.ts
 * @brief When the device is short of power or hot, the engine draws less: a frame cap and a ceiling on the quality level, taken off again when it recovers.
 *
 * @details A long session on a phone is heat and battery, and the frame is where both are spent. The engine already has the means (a frame cap, quality
 *          levels, render-on-demand); what was missing was something that notices the device and uses them. The device backend reports a {@link PowerState}
 *          (the battery's level and whether it is charging, and the thermal pressure where the platform says it), a {@link PowerPolicy} says when that is
 *          "saving" and what saving does, and the quality system applies it. Everything is off unless the game names a policy: a game that never asks for
 *          this draws exactly as it did.
 *
 *          What a platform cannot report is null, and a null never triggers anything: a browser with no battery API saves nothing for battery and loses
 *          nothing else. Saving never raises a cap or a level, only lowers it, and takes its own lowering off when the reason is gone.
 */

/** The level names a ceiling is given in, lowest first. */
type PowerLevel = 'low' | 'medium' | 'high';
/** @experimental */
interface PowerPolicy {
    /** Saves when the battery is below this share (0 to 1) and not charging. Default 0.2; 0 never saves for the battery. */
    lowBattery?: number;
    /** Saves under thermal pressure of this level or worse: 'serious' (default), 'critical', or 'never'. */
    thermal?: 'serious' | 'critical' | 'never';
    /** The frame cap while saving, in frames a second (default 30). Never raises a cap the game already set lower. */
    fps?: number;
    /** The quality level no level may exceed while saving (default 'medium'). */
    ceiling?: PowerLevel;
    /** The thermal pressure that also holds the level at 'low' and the cap at half of `fps`, never below 15 (default 'critical'; 'never' for none). */
    severe?: 'critical' | 'never';
}
/** What saving does, as the quality system applies it. */
interface PowerDecision {
    saving: boolean;
    /** The frame cap, or 0 for none. */
    fps: number;
    /** The level ceiling, or null for none. */
    ceiling: PowerLevel | null;
    /** Why it is saving, or 'none'. */
    reason: 'none' | 'battery' | 'thermal' | 'critical';
}
/** What the policy says to do about the state the device is in. A null in the state is a reason that cannot hold. */
declare function decidePower(state: PowerState, policy: PowerPolicy): PowerDecision;

type QualityLevel = 'low' | 'medium' | 'high';
type QualityMode = 'off' | 'auto' | QualityLevel;
interface DeviceQualityInfo {
    model?: string;
    gpu?: string;
    memoryGB?: number;
    cores?: number;
}
/** The size of the set a body of water's waves are taken from (water/waves.ts: WAVE_SET_SIZE). */
declare const MOST_WATER_WAVES = 8;
interface QualityProfile {
    renderScale: number;
    minRenderScale: number;
    msaaSamples: 1 | 2 | 4 | 8;
    /**
     * How the edges of the picture are smoothed. `msaa` is the multisampling above (plus an FXAA pass where the scene has one). `temporal` draws
     * at one sample and lets the `taa` pass do it from the frames before: it costs a tenth of a millisecond at 1080p where four samples cost three
     * and two cost over one, and in return the picture is somewhat softer, a cut-out leaf has no coverage dither and a surface that moves by itself
     * without a motion vector (water) smears a little while the camera moves. The level takes the `taa` pass whether or not the scene's volume
     * lists it, and leaves `fxaa` out; it needs a post-process volume on the camera.
     */
    antialiasing: 'msaa' | 'temporal';
    shadowAtlasSize: number;
    shadowCellSize: number;
    /**
     * The cascades a perspective sun's shadow is split into, and how far (in world units, 0 for as far as the scene reaches) they reach. Both act only on
     * a sun whose `shadowExtent` is 0: one with an extent draws a single map of that size and uses neither. Each cascade draws the casters again.
     */
    shadowCascades: number;
    shadowDistance: number;
    /**
     * How much of its distances a level lets a plant keep, 0.25 to 1: a kind that changes to its cheaper mesh at 60 m and is not drawn past
     * 150 m does so at 30 m and 75 m with 0.5. The far version (a tree's cards) is the same cost at any distance, so it takes over sooner.
     */
    detailScale: number;
    particleLimit: number;
    planarReflectionScale: number;
    planarReflectionMaxSize: number;
    /** Zero means every frame; this never caps the main scene. */
    planarReflectionUpdatesPerSecond: number;
    /**
     * Whether the opaque scene is drawn twice, depth alone first, so each pixel is shaded for the surface in front of it and not for every one drawn
     * there on the way. It pays where surfaces overlap (a wood, a crowd of foliage) on a GPU that shades what it rasterises; on one that defers
     * shading to the end of a tile it is geometry paid for twice, so the weakest level leaves it off.
     */
    depthPrepass: boolean;
    postProcess: boolean;
    ssao: boolean;
    /** How many of a body of water's waves are summed, longest first: in the geometry, the shading and what the surface answers for code. 1 to the size of the water's set. */
    waterWaves: number;
    /** The most cells along a side of the ripple grid a body of water keeps; the body's own `ripples` is held to it. 0 keeps none. */
    waterRippleCells: number;
    /** Whether the waves lift the water's geometry. Off is the lite water: a flat surface whose waves are in the shading only, and which code reads as flat. */
    waterDisplacement: boolean;
    /** Whether the surface seen from below mirrors the world under it (a screen-space march per pixel). */
    waterMirror: boolean;
    /** Whether the sun's web of light is drawn on what is under the water, and through the surface as shafts. */
    waterCaustics: boolean;
    /**
     * Post-process effects this level leaves out, each named by its effect type (`ssr`, `taa`, `depthOfField`,
     * `lightShafts`, `autoExposure` …), compared without regard to case. An effect is all of its passes: a
     * multi-pass effect is skipped whole, however its passes are named. The expensive ones are the ones a weak
     * device has no use for — they are measured per effect (`fx-cost` in the editor checks) — so what a level
     * skips follows from what a frame on that device can afford.
     */
    skipEffects: readonly string[];
    /**
     * The most texels a side the 2D rain's shelter mask has: the largest a `rain2d` effect is let draw its own `maskSize` at. The mask is painted every frame, so
     * a weak device spends less on a smaller one and gets rain whose dry edges are softer.
     */
    shelterMaskSize: number;
    /**
     * How many samples across a light source a soft 2D shadow is drawn with, 1 to 32: a light's `shadowSoftness` is a source with width, and its penumbra
     * is that many silhouettes added up. Fewer is cheaper and shows the edge as bands; sixteen is where the bands stop reading as separate shadows.
     */
    shadowSoftSamples: number;
    lighting: 'full' | 'direct';
    /**
     * Whether the dynamic GI runs its cheaper way: one pixel in four asks the probes and the rest take the light of the four round them, a
     * probe traces a quarter of its rays a frame instead of half, the cards are relit over eight frames instead of four, and there are two
     * thirds of the rows of probes. On a Snapdragon 8 Elite at 2530 x 1200 the effect costs 4.5 ms this way and 7.3 the full way. What it
     * gives up: light runs a pixel or two across an edge two surfaces share, and light that changes takes about twice as long to settle.
     * It acts on a volume that lists `dynamicGI`, at a level that runs it, and never makes a volume's own settings dearer.
     */
    dynamicGIReduced: boolean;
    /**
     * The most draws a frame at this level should ask of the GPU, every pass counted (shadows, prepass, reflections and post-processing with the
     * scene). Nothing is held back to meet it: the profiler and the stats overlay show a frame over it, and the frame debugger says where the draws
     * went. Draw calls cost the CPU and the driver more than the GPU, and on a phone or in a mini game they are what a 3D scene runs out of first.
     */
    drawCallBudget: number;
    /**
     * Hold each texture only meshes draw at the size its views need (see `textureStreamingPlugin`): a texture far away takes a
     * fraction of its memory, and grows back as the camera comes close. A web build ships a small copy beside each such texture, so its
     * file is downloaded only once a view needs more than the copy holds.
     */
    textureStreaming: boolean;
    /** The megabytes the streamed textures may take together; past it they are held a level softer. 0 is no cap. */
    textureStreamingBudget: number;
}
interface DeviceQualityRule {
    level: QualityLevel;
    modelIncludes?: string;
    gpuIncludes?: string;
    maxMemoryGB?: number;
    maxCores?: number;
}
/** @experimental */
interface QualityConfig {
    mode?: QualityMode;
    targetFps?: number;
    dynamicResolution?: boolean;
    /**
     * A frame never waits for a shader the browser is still compiling: what needs it is left out until it is ready, and several compile at once. Off
     * (the default) the first draw to need a shader waits for it, which keeps every frame complete and can stop one for seconds on a first visit
     * (a heavy lit shader on a driver that compiles slowly). Turn it on for a game that would rather open fast and fill in.
     */
    asyncShaderCompile?: boolean;
    /**
     * With `asyncShaderCompile`: draw the first scene's frames out of sight, behind the loading screen, until its shaders have compiled, and show it
     * complete instead of filling in (see `warmShaders`). The wait is bounded by `prewarmTimeoutMs`.
     */
    prewarmShaders?: boolean;
    /**
     * Draw only the frames that can look different (see `RenderDemand`): a still screen costs the game's logic and nothing else. Off unless a game
     * turns it on, because what the engine cannot see change (a script setting a colour, an animation) has to be said with `request` or `hold`.
     */
    renderOnDemand?: boolean;
    /** Frames still drawn after the last reason to draw. Default 30. */
    renderOnDemandTail?: number;
    /** The longest the loading screen waits for the shaders. Default 30000. */
    prewarmTimeoutMs?: number;
    profiles?: Partial<Record<QualityLevel, Partial<QualityProfile>>>;
    deviceRules?: DeviceQualityRule[];
    /**
     * Draw less when the device is short of battery or running hot: a frame cap and a ceiling on the level while it is, both taken off when it recovers.
     * Absent, the device is not watched and nothing changes. See {@link PowerPolicy}.
     */
    power?: PowerPolicy;
}
/**
 * The level a project gets that names none. A phone or tablet takes medium: all of a level's picture at a fraction of the cost (a full-screen sea on a
 * Snapdragon 8 Elite is 25.7 ms a frame as authored and 9.0 at medium, mostly by leaving four samples behind). Elsewhere nothing is managed. Naming a
 * level, `off` among them, always wins.
 */
declare function defaultQualityMode(handheld: boolean): QualityMode;
/** @experimental */
declare function parseQualityConfig(value: unknown): QualityConfig;
/** A level's profile as the engine will use it: the level's own defaults with a project's overrides on top. */
declare function resolveQualityProfile(level: QualityLevel, overrides?: Partial<QualityProfile>): QualityProfile;
/** What a level is before a project says anything about it. */
declare function defaultQualityProfile(level: QualityLevel): QualityProfile;
interface QualityReport {
    mode: QualityMode;
    level: QualityLevel;
    renderScale: number;
    targetFps: number;
    /** Smoothed frame interval. */
    frameMs: number;
    /** Smoothed time the frame's own run took, and the GPU's time for it; -1 where the host does not say. */
    busyMs: number;
    gpuMs: number;
    reason: string;
    limitations: string[];
    /** The level's draw call budget (see `QualityProfile.drawCallBudget`). */
    drawCallBudget: number;
}
/**
 * @experimental One frame's clock readings, as dynamic resolution takes them. `frameMs` is the interval since the last
 * frame; `busyMs` how long the frame's own run took (`FrameTiming.busyMs`); `gpuMs` the GPU's time for the frame. The
 * last two are optional, and a value that is not a positive number counts as not given.
 */
interface QualitySample {
    frameMs: number;
    busyMs?: number;
    gpuMs?: number;
}
/** @experimental What a stretch of frames says about the render resolution. */
type FrameVerdict = 'gpu-pressure' | 'frame-pressure' | 'headroom' | 'steady';
/**
 * @experimental Whether resolution should go down, may come back up, or stay, from smoothed readings (-1 = not known)
 * and the frame budget. Pure.
 *
 * A GPU reading over the budget is pressure on its own word. A small one is not headroom on its own word: a timer
 * can cover less than the frame (a tile renderer has not drawn when the pass is stamped), so what a low reading may
 * do is decided with the frame itself. A frame that came late although its own run fitted the budget waited on the
 * GPU or the display, and resolution is the lever for that; one whose run did not fit is the CPU's, and resolution
 * would buy nothing.
 */
declare function judgeFrames(avg: Readonly<Required<QualitySample>>, budgetMs: number): FrameVerdict;
/** @experimental Per-app policy; authored scene components remain unchanged. */
declare class QualityController {
    private readonly device_;
    private config_;
    private level_;
    /** The level the mode asks for, before a ceiling lowers it. */
    private modeLevel_;
    private ceiling_;
    private profile_;
    private scale_;
    private average_;
    private pressureMs_;
    private recoveryMs_;
    /** Sampled time, the clock the two below are read on. */
    private clockMs_;
    private raisedAt_;
    /** How long headroom must last before a step up; grows while steps up keep being taken back. */
    private recoverAfterMs_;
    private reason_;
    private modeReason_;
    private limitations_;
    constructor(config: QualityConfig, device_?: DeviceQualityInfo);
    get enabled(): boolean;
    get profile(): Readonly<QualityProfile>;
    get renderScale(): number;
    setMode(mode: QualityMode): void;
    private ceilingOf_;
    /**
     * No level above `level` while it is set; null takes it off. Only lowers: a mode already at or under the ceiling is left as it is. Used by the power
     * policy, which holds the level down while the device is short of battery or hot.
     */
    setCeiling(level: QualityLevel | null): void;
    setLimitation(reason: string, active: boolean): void;
    /** Forget the running averages; `all` also forgets what was learned about stepping back up. */
    private resetSampling_;
    /**
     * Take one frame's readings. Sustained pressure lowers the render scale a step towards the level's floor;
     * sustained headroom raises it back a step. See {@link judgeFrames} for what counts as which.
     */
    sample(sample: Readonly<QualitySample>): void;
    report(): QualityReport;
}

interface PlatformResponse {
    ok: boolean;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    json<T = unknown>(): Promise<T>;
    text(): Promise<string>;
    arrayBuffer(): Promise<ArrayBuffer>;
}
interface PlatformRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS';
    headers?: Record<string, string>;
    body?: string | ArrayBuffer;
    responseType?: 'text' | 'arraybuffer' | 'json';
    timeout?: number;
}
interface WasmInstantiateResult {
    instance: WebAssembly.Instance;
    /** Some file-based mini-game loaders (OpenPaaS on iOS) return only an instance. */
    module?: WebAssembly.Module;
}
interface InputEventCallbacks {
    /** Return true to cancel the host default (e.g. browser Tab traversal). */
    onKeyDown(code: string): boolean | void;
    onKeyUp(code: string): void;
    /** `dx` and `dy` are how far the pointer moved since the last event, where the host says (a locked pointer has no position to move, only this). */
    onPointerMove(x: number, y: number, dx?: number, dy?: number): void;
    onPointerDown(button: number, x: number, y: number): void;
    onPointerUp(button: number): void;
    onWheel(deltaX: number, deltaY: number): void;
    onTouchStart?(id: number, x: number, y: number): void;
    onTouchMove?(id: number, x: number, y: number): void;
    onTouchEnd?(id: number): void;
    /** Primary identifies the synthesized mouse without cancelling another finger. */
    onTouchCancel?(id: number, primary?: boolean): void;
    /** Cancel held input and pending edges when the host loses focus or unbinds. */
    onInputCancel?(): void;
}
/**
 * A per-frame snapshot of one gamepad. With `mapping === 'standard'` the button
 * and axis indices follow the W3C "standard gamepad" layout (see GamepadButton /
 * GamepadAxis in input.ts). `buttons[i]` is analog in [0,1] (1 = fully pressed);
 * `axes[i]` is signed in [-1,1]. Gamepads are POLLED (no DOM events), so the
 * platform produces these each frame rather than via InputEventCallbacks.
 */
interface GamepadSnapshot {
    index: number;
    connected: boolean;
    buttons: number[];
    axes: number[];
    mapping: string;
}
interface ImageLoadResult {
    width: number;
    height: number;
    pixels: Uint8Array;
}
type PlatformSocketReadyState = 'connecting' | 'open' | 'closing' | 'closed';
interface PlatformSocketOptions {
    url: string;
    protocols?: string | string[];
}
/** Event payloads for {@link PlatformSocket.on}. */
interface PlatformSocketEvents {
    open: [];
    message: [data: string | ArrayBuffer];
    close: [code: number, reason: string];
    error: [error: unknown];
}
/**
 * The platform-neutral socket surface (GameSocket / WeChatSocket / a Node ws
 * wrapper all fit): multicast `on(event, fn)` → unsubscribe, queues sends
 * until open, moves string|ArrayBuffer frames.
 */
interface PlatformSocket {
    /** Every platform socket is a WebSocket (browser, `wx.connectSocket`, Node
     *  `ws`), so every one of them delivers in order and loses nothing — which
     *  is what lets a socket be handed straight to replication. */
    readonly delivery: 'reliable-ordered';
    readyState: PlatformSocketReadyState;
    on<K extends keyof PlatformSocketEvents>(event: K, handler: (...args: PlatformSocketEvents[K]) => void): () => void;
    connect(): void;
    send(data: string | ArrayBuffer): void;
    close(code?: number, reason?: string): void;
}
/** RGBA readback from getImageData. The DOM `ImageData` is assignable (its extra
 *  members are ignored structurally). */
interface PlatformImageData {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
}
/** The subset of `TextMetrics` the glyph rasterizer reads. `TextMetrics` is
 *  assignable. */
interface PlatformTextMetrics {
    readonly width: number;
    readonly actualBoundingBoxLeft?: number;
    readonly actualBoundingBoxRight?: number;
    readonly actualBoundingBoxAscent?: number;
    readonly actualBoundingBoxDescent?: number;
}
/**
 * What an editing surface holds while a field has focus. Selection indices are
 * UTF-16 code units, as every platform's text field counts them.
 */
interface TextEditorState {
    value: string;
    selectionStart: number;
    selectionEnd: number;
    /** The caret sits at `selectionStart` — a shift-left / shift-up selection. */
    backward: boolean;
}
/** What the surface needs to know about the field it is editing. */
interface TextEditorOptions {
    /** Enter inserts a newline instead of submitting. */
    multiline: boolean;
    /** 0 = unlimited. The plugin enforces it too; a surface that can, should. */
    maxLength: number;
    /** The field renders its own bullets — this is for the keyboard's benefit
     *  (no autocorrect / suggestion strip over a password). */
    password: boolean;
}
type TextEditorEvent = 
/** The surface's value or selection changed — typing, paste, caret motion. */
{
    kind: 'change';
}
/** An IME composition began or ended; the preedit sits in `read().value`. */
 | {
    kind: 'composition';
    composing: boolean;
}
/** Enter on a single-line field, or the keyboard's done/go key. */
 | {
    kind: 'submit';
}
/** Escape, or the keyboard was dismissed without committing. */
 | {
    kind: 'cancel';
}
/** The surface gave up focus on its own. */
 | {
    kind: 'blur';
};
/**
 * The OS text-editing surface behind an editable field: a hidden textarea on the
 * web, the soft keyboard and its IME on a device. It OWNS the value and the
 * selection while focused — caret motion, native shift/Ctrl-A selection and the
 * live IME preedit all land there — so the field renders what {@link read}
 * answers and pushes its own edits back through {@link write}.
 *
 * One contract for every platform, so the text-input plugin is the same code
 * everywhere; a host with no surface simply has none, and its fields render but
 * do not type.
 */
interface PlatformTextEditor {
    /** Take focus with this state. On a device this opens the soft keyboard. */
    focus(state: TextEditorState, options: TextEditorOptions): void;
    /** Give up focus (and close the keyboard). */
    blur(): void;
    /** The surface's live state. */
    read(): TextEditorState;
    /** Push a state the app decided: a programmatic setValue, click-to-caret, a
     *  maxLength truncation. */
    write(state: TextEditorState): void;
    /**
     * Put the caret at this point in CSS px (y down from the top-left of the
     * drawing surface), so an IME pops its candidate window there instead of in
     * a screen corner. Optional — a platform whose IME is a fixed system panel
     * has nowhere to put it.
     */
    setCaretAnchor?(left: number, top: number): void;
    /** Listen for what the surface did. Returns an unsubscribe. */
    subscribe(handler: (event: TextEditorEvent) => void): () => void;
    dispose(): void;
}
/** The `getContext('2d', …)` options actually used. */
interface PlatformCanvasContextAttributes {
    willReadFrequently?: boolean;
    alpha?: boolean;
}
/**
 * A drawable source for `ctx.drawImage`. Typed `object` deliberately: it is the
 * only DOM-free SUPERTYPE of lib.dom's `CanvasImageSource` union (its
 * `SVGImageElement`/`VideoFrame` branches share no structural `{width;height}`),
 * so the real `CanvasRenderingContext2D.drawImage(CanvasImageSource)` stays
 * assignable to this neutral method while callers pass an `ImageBitmap` OR a
 * `PlatformImage` with no `as unknown` cast.
 */
type PlatformImageSource = object;
/** Paint value for `fillStyle`. `string | object` is the DOM-free supertype of the
 *  real `string | CanvasGradient | CanvasPattern` (callers only ever assign a color
 *  string; the supertype is what keeps the real 2D context assignable). */
type PlatformCanvasPaint = string | object;
/**
 * The offscreen 2D context the engine uses: image decode (`drawImage`/
 * `getImageData`/`clearRect`) and dynamic glyph rasterization (`font`/`measureText`/
 * `fillText`/…). Every member is present on BOTH `CanvasRenderingContext2D` and
 * `OffscreenCanvasRenderingContext2D` with covariance-compatible types, so both are
 * assignable here.
 */
interface PlatformCanvas2DContext {
    drawImage(image: PlatformImageSource, dx: number, dy: number): void;
    drawImage(image: PlatformImageSource, dx: number, dy: number, dw: number, dh: number): void;
    getImageData(sx: number, sy: number, sw: number, sh: number): PlatformImageData;
    clearRect(x: number, y: number, w: number, h: number): void;
    font: string;
    textBaseline: string;
    textAlign: string;
    fillStyle: PlatformCanvasPaint;
    measureText(text: string): PlatformTextMetrics;
    fillText(text: string, x: number, y: number): void;
}
/**
 * The offscreen 2D canvas surface. `HTMLCanvasElement` and `OffscreenCanvas` are
 * structurally assignable: their overloaded `getContext` matches this `'2d'`
 * overload, whose real return is assignable to {@link PlatformCanvas2DContext}.
 */
interface PlatformCanvas {
    width: number;
    height: number;
    getContext(contextId: '2d', options?: PlatformCanvasContextAttributes): PlatformCanvas2DContext | null;
}
/**
 * A glyph to rasterize, for a platform whose text comes from the OS rather than a
 * 2D canvas. `style` carries the atlas' bold/italic bits (1 | 2), and `sdf` +
 * `padding` say which encoding the atlas wants — the same two the Canvas2D
 * rasterizer implements, so both backends fill the same atlas.
 */
interface PlatformGlyphRequest {
    codepoint: number;
    fontFamily: string;
    style: number;
    /** Em size to rasterize at, in px. */
    pixelSize: number;
    /** Signed distance field (128 = edge, `padding` px per half byte-range) vs
     *  plain antialiased coverage. */
    sdf: boolean;
    /** Padding around the ink — the SDF spread — in px. */
    padding: number;
}
/**
 * A rasterized glyph: an upload-ready RGBA8 tile (RGB = 255, A = coverage or SDF)
 * plus its metrics in `pixelSize` units. Structurally the atlas' `RasterGlyph`;
 * declared here so the platform layer stays independent of ui/text.
 */
interface PlatformGlyph {
    pixels: Uint8Array;
    width: number;
    height: number;
    advance: number;
    bearingX: number;
    bearingY: number;
}
/**
 * A load/error callback SINK: callers only ever ASSIGN one (`img.onload = …`); the
 * host image invokes it. The parameter is the bottom type `never` so, by
 * contravariance, EVERY real handler shape is assignable to it — the DOM
 * `(ev: Event) => any`, the mini-game `() => void`, and the SDK's own
 * `() => resolve()` — without this "neutral" type naming any DOM type (`Event`).
 */
type PlatformImageEventHandler = ((ev: never) => void) | null;
/**
 * A decodable image (the offscreen `<img>` on DOM hosts). `HTMLImageElement` and a
 * mini-game image are both structurally assignable. Native never creates one
 * (createImage throws), so the DOM-shaped members impose nothing on native.
 * `crossOrigin` is optional so a mini-game image (which lacks it) fits too.
 */
interface PlatformImage {
    width: number;
    height: number;
    src: string;
    crossOrigin?: string | null;
    onload: PlatformImageEventHandler;
    onerror: PlatformImageEventHandler;
}
/**
 * A platform's identity. The engine's own platforms are named here for
 * completion; the type stays OPEN so a game can ship an adapter for a host the
 * engine does not know about (a mini-game vendor of its own, an embedded
 * runtime) without editing this file. Capability checks read {@link
 * PlatformAdapter.family}, never the name, so an unknown name is never a
 * degraded platform — only an unfamiliar one.
 */
type PlatformName = 'web' | 'wechat' | 'douyin' | 'node' | 'native' | (string & {});
/**
 * A capability family several platforms belong to. Engine code that means "no
 * DOM, packaged filesystem, subpackages" asks for the FAMILY (`isMiniGame()`),
 * not a vendor name — so a third-party mini-game host gets the same behavior as
 * WeChat by declaring itself here rather than by being enumerated in the SDK.
 */
type PlatformFamily = 'minigame';
interface PlatformAdapter {
    /** Lazy device services, so unused games bind no sensor/lifecycle listeners. */
    device?(): DeviceBackend;
    deviceQualityInfo?(): DeviceQualityInfo;
    readonly name: PlatformName;
    /**
     * The capability family this platform belongs to, if any. Absent means the
     * platform stands alone (web, node, native). Set by the mini-game family
     * adapter — the single reason `isMiniGame()` needs no vendor list.
     */
    readonly family?: PlatformFamily;
    fetch(url: string, options?: PlatformRequestOptions): Promise<PlatformResponse>;
    readFile(path: string): Promise<ArrayBuffer>;
    readTextFile(path: string): Promise<string>;
    fileExists(path: string): Promise<boolean>;
    loadImagePixels(path: string): Promise<ImageLoadResult>;
    instantiateWasm(pathOrBuffer: string | ArrayBuffer, imports: WebAssembly.Imports): Promise<WasmInstantiateResult>;
    createCanvas(width: number, height: number): PlatformCanvas;
    /**
     * Rasterize one glyph through the OS text stack, for a platform with no 2D
     * canvas to draw it on. Synchronous: the dynamic glyph atlas fills cells
     * during the frame it needs them.
     *
     * Optional — a platform that has {@link createCanvas} omits it and the atlas
     * uses the Canvas2D rasterizer (web, WeChat). Native implements it (the
     * embedded-Dawn host has no DOM), and `null` means the font or the glyph was
     * unavailable, which the atlas treats as "no cell" exactly as it does a
     * canvas miss.
     */
    rasterizeGlyph?(request: PlatformGlyphRequest): PlatformGlyph | null;
    /**
     * Make a font file the app SHIPS usable under `family`, so `Text` can name
     * it the same way it names a system font. Every platform resolves a family
     * through its own text stack — Canvas2D on the web, the OS matcher on native
     * — and none of them can see a file inside the project, so a shipped font
     * has to be handed to that stack explicitly. This is that hand-off; the font
     * asset loader calls it once per font.
     *
     * Optional: a host without it simply has no project fonts, and `Text` falls
     * back to `fontFamily` (documented behaviour, not a silent failure).
     * Resolves when the family is ready to rasterize with.
     */
    registerFont?(family: string, bytes: ArrayBuffer): Promise<void>;
    /**
     * The OS text-editing surface for editable fields (see
     * {@link PlatformTextEditor}). Optional — a host without one (a headless
     * realm, the editor's edit mode) renders fields but cannot type into them.
     */
    createTextEditor?(): PlatformTextEditor | null;
    now(): number;
    createImage(): PlatformImage;
    bindInputEvents(callbacks: InputEventCallbacks, target?: unknown): void;
    /**
     * Whether this device can be touched at all. A game that only shows its
     * on-screen controls after the first touch asks its player to touch the
     * screen twice, the first time at nothing — so the question has to be
     * answerable before anyone has touched anything. Absent means no.
     */
    hasTouch?(): boolean;
    /** Tear down the listeners {@link bindInputEvents} registered. Optional — a
     *  headless host that never binds input (node) omits it. */
    unbindInputEvents?(): void;
    /** Poll connected gamepads for this frame. Optional — platforms without
     *  gamepad support (WeChat, headless) omit it and the input plugin skips
     *  gamepad polling entirely. */
    pollGamepads?(): GamepadSnapshot[];
    /**
     * Bring a store's achievement service up for @p appId, or null.
     *
     * A platform with no store omits it; a desktop build with no client running
     * answers null. The service then keeps its local provider, so a game's code
     * never branches on any of this.
     */
    steamAchievements?(appId: number): AchievementProvider | null;
    /** The signed-in store account, or null. `id` is a STRING — 64 bits of
     *  account id do not survive a double. */
    steamIdentity?(): {
        id: string;
        name: string;
    } | null;
    /**
     * Ask for a window this big, in design pixels.
     *
     * Only a platform that OWNS a window has one to size — a phone is given a
     * screen and a browser a canvas. Best-effort: the host clamps it to the
     * display, and only the first ask counts.
     */
    setWindowSize?(width: number, height: number): void;
    /**
     * Tell me when the store's overlay covers the game, and when it stops.
     *
     * A takeover the game did not ask for: the player pressed Shift+Tab and can
     * no longer act, so it pauses exactly as a fullscreen ad does. Returns an
     * unsubscribe. Absent where no overlay exists, and nothing is missed there.
     */
    onStoreOverlay?(listener: (covered: boolean) => void): () => void;
    /** Create the platform audio backend (WebAudio on web, the mini-game audio API
     *  on WeChat). Optional — a host with no audio device (headless node, the
     *  unshipped native shell) omits it and the audio system falls back to the
     *  silent Null backend, exactly like {@link createVideoBackend}. */
    createAudioBackend?(): PlatformAudioBackend;
    /** Create the platform video backend: HTMLVideoElement on web, the wasm
     *  software decoder (videodec side module) on WeChat. The choice is a static
     *  per-platform matrix — no runtime fallback chain. Optional — a platform
     *  without video (headless server) omits it and the video system uses the
     *  silent Null backend. */
    createVideoBackend?(ctx: VideoBackendContext): PlatformVideoBackend;
    /** Download an on-demand asset subpackage by name and resolve when its files
     *  are available. WeChat → wx.loadSubpackage; platforms with no subpackage
     *  concept (web) omit it and lazy groups load directly from their URLs. */
    loadSubpackage?(name: string): Promise<void>;
    /**
     * Persistent content-addressed byte cache — the offline/disk primitive behind
     * hot-update. `key` is an immutable content-addressed url (the asset's `<hash>.<ext>`
     * CDN url), so an entry NEVER goes stale and needs no invalidation. Hot-update
     * writes each verified downloaded asset here; the http backend reads it first so
     * updated assets stay available offline and skip the CDN roundtrip.
     *
     * Optional — a platform with no local storage (web relies on the browser HTTP
     * cache) omits BOTH; then `platformReadCacheFile` returns null (a miss → normal
     * fetch) and `platformWriteCacheFile` is a no-op. Node (fs) and native (the shell's
     * on-disk store) implement them; WeChat may later back them with `wx` user storage.
     */
    readCacheFile?(key: string): Promise<ArrayBuffer | null>;
    writeCacheFile?(key: string, bytes: ArrayBuffer): Promise<void>;
    /** Cache management is separate from byte storage. Entries are opaque safe
     * names, never arbitrary paths; hosts must exclude application saves. */
    canManageCache?(): boolean;
    hasCacheStorage?(): boolean;
    listCacheFiles?(): Promise<{
        name: string;
        size: number;
        lastAccess: number;
    }[]>;
    removeCacheFile?(name: string): Promise<void>;
    /** Open a socket connection. Web → WebSocket, WeChat → wx.connectSocket,
     *  Node → a ws wrapper. Optional — platforms without networking (playable
     *  ads) omit it and `createSocket()` fails loud. */
    createSocket?(options: PlatformSocketOptions): PlatformSocket;
    /** Subscribe to OS memory-pressure warnings; returns an unsubscribe.
     *  WeChat → wx.onMemoryWarning; platforms without a pressure signal (web)
     *  omit it. Residency caches subscribe to drop their evictable entries. */
    onMemoryWarning?(callback: () => void): () => void;
    /**
     * Subscribe to errors that reached the host with nobody catching them —
     * `window.onerror` + `unhandledrejection` on the web, `wx.onError` +
     * `wx.onUnhandledRejection` on a mini-game. Returns an unsubscribe.
     *
     * This is the only channel for the failures that happen OUTSIDE a system:
     * a throw in a `setTimeout`, a promise nobody awaited, a callback from the
     * host. The engine's own errors go through the logger and need no platform.
     * Optional — a platform without the signal simply never fires, and the
     * diagnostics plugin still collects everything else.
     */
    onUnhandledError?(callback: (error: unknown) => void): () => void;
    /**
     * Subscribe to the GPU taking the rendering context away — backgrounding,
     * a driver reset, too many live contexts on the page. Returns an
     * unsubscribe.
     *
     * Worth its own channel because it is invisible from everywhere else: no
     * error is thrown and no log is written, the frames simply stop containing
     * anything. A game whose players report "it went black" has no other way to
     * find out that this is what happened.
     *
     * Who can answer this, and who cannot:
     *
     *   web — yes. `webglcontextlost` does not bubble, but a non-bubbling event
     *   still travels the capture phase, so one window-level listener sees every
     *   canvas.
     *
     *   native — yes, IF the shell wired it (`NativeBridge.onContextLost`). The
     *   surface belongs to the host binary and is not visible from JS at all, so
     *   it has to be pushed in, like memory pressure and foreground/background.
     *
     *   mini-game — NO, and this is a platform limit rather than a gap here. A
     *   mini-game canvas is not a DOM element: `MiniGameCanvas` is width, height
     *   and getContext, with no listener registration and no vendor API for
     *   context loss. Nothing to duck-type for. Left unimplemented rather than
     *   approximated, because a hook that silently never fires reads as "this
     *   never happens" — which on a phone is the opposite of true.
     */
    onContextLost?(callback: () => void): () => void;
    /** App foreground/background signals, for platforms with no DOM visibility
     *  event. The native shell pushes them through its bridge; the Lifecycle
     *  plugin subscribes and auto-pauses on hide. Web/WeChat read visibility from
     *  their own globals (document/wx) and omit these. Each returns an unsubscribe. */
    onAppShow?(callback: () => void): () => void;
    onAppHide?(callback: () => void): () => void;
    /** The host's UI language tag ('zh-CN', 'en-US', …). WeChat reports
     *  'zh_CN'-style tags — `platformLanguage()` normalizes underscores.
     *  Optional; web falls through to navigator.language. */
    language?(): string;
    /** What a person would call this device when picking it from a list: a
     *  phone's model, or a browser and its system. Optional. */
    deviceName?(): string;
    /** Whether this is a phone or a tablet: a small GPU, on a battery, behind a very dense screen. Optional; absent is no. A mini-game host does not
     *  answer: it already draws within its own defaults (see `waterQualityOf`). */
    isHandheld?(): boolean;
    /** One rewarded ad unit. Mini-game hosts implement it over their
     *  RewardedVideoAd; platforms without an ad system (web, a native app whose own
     *  code answers for none, playable — networks forbid nested ads) omit the
     *  method, and a family adapter whose PARTICULAR host lacks the capability
     *  returns null. Both answers mean the same thing to the services layer:
     *  substitute the mock provider or fail loud with the reason. */
    createRewardedAd?(adUnitId: string): PlatformRewardedAd | null;
    /** One interstitial ad unit — same availability story as rewarded. */
    createInterstitialAd?(adUnitId: string): PlatformInterstitialAd | null;
    /**
     * The app's own native code, reached by method name: the Java or Objective-C
     * a packaged game links beside the engine (an ad SDK, a store, a sign-in).
     * Present only on a native host; null there when the host binary predates
     * the channel. The web and mini-games omit it: a page has no native code,
     * and a mini-game's host API is the vendor's, not the project's.
     */
    nativeChannel?(): PlatformNativeChannel | null;
    /** Actively open the host's share sheet. Fire-and-forget: since 2021 no
     *  mini-game host reports whether the player actually shared. */
    share?(options: PlatformShareOptions): void;
    /** Provide the card for PASSIVE shares (the host's own share menu). The
     *  host asks at share time, so the provider can answer with live state. */
    onShareRequest?(provide: () => PlatformShareOptions): void;
    /** The host's screen recorder, or null where this particular host has none.
     *  Absent on platforms that cannot record at all (native, playable). */
    screenRecorder?(): PlatformScreenRecorder | null;
    /** Send a message into the open data context — the second JS runtime that
     *  is the only place friend data can be read. ONE WAY by nature: no host
     *  offers a channel back, so this returns nothing and nothing awaits it. */
    openDataPostMessage?(message: Record<string, unknown>): void;
    /** The canvas the open data context draws on, for the main domain to sample
     *  as a texture. Null when the host has the capability but this game's
     *  package declares no context to draw with. */
    openDataCanvas?(): PlatformCanvas | null;
    /**
     * Begin a host sign-in. Resolves with the one-time CODE, never a session:
     * turning a code into an identity needs the app secret, which must not be
     * in anything a player can open, so the exchange is the game's own server's
     * to make. A platform with no sign-in omits this.
     */
    login?(): Promise<string>;
    /**
     * Whether {@link login} would reach a real sign-in.
     *
     * Method presence is not a capability probe for a FAMILY adapter — one
     * class serves every mini-game vendor, so it defines `login` whether or not
     * the host behind it has one. An adapter that is one platform can omit this
     * and presence stands; a family answers for the host it actually wraps.
     */
    canSignIn?(): boolean;
    /**
     * Whether in-game purchase is permitted HERE.
     *
     * A separate question from whether the host exposes the call, and the
     * reason this is a capability rather than a try-and-see: on WeChat, paying
     * inside a mini-game is an Android-only permission — the API is present on
     * an iPhone and refusing it is the platform's rule, not a fault. A game has
     * to be able to ask before it shows a shop.
     */
    canPay?(): boolean;
    /** Buy `quantity` units of the host's in-game currency. Resolves when the
     *  host reports the purchase done; rejects with the host's own reason. */
    requestPayment?(request: PlatformPaymentRequest): Promise<void>;
    /** Whether the host still regards the last sign-in as current, so a game
     *  can skip re-exchanging a code it does not need. */
    checkSession?(): Promise<boolean>;
    /** Write this player's own rows to the host's per-player cloud store — the
     *  writable half of a leaderboard. Reading is the open data context's
     *  alone, which is the whole reason that context exists. Returns whether
     *  there was a store to write to; the write itself is fire-and-forget. */
    setCloudKeyValues?(entries: Readonly<Record<string, string>>): boolean;
    devicePixelRatio(): number;
    /** Live native content insets in framebuffer pixels, independent of DPR.
     *  Absent on hosts without a safe-area source. */
    safeAreaInsets?(): {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
    /** Host audio policy; game volume/resume controls cannot override it. */
    onAudioMute?(handler: (muted: boolean) => void): () => void;
    /** Send one score to the host. Completion does not certify ranking acceptance. */
    submitScore?(score: number): Promise<void>;
    getStorageItem(key: string): string | null;
    setStorageItem(key: string, value: string): void;
    removeStorageItem(key: string): void;
    clearStorage(prefix: string): void;
    /** Await pending asynchronous storage writes. Absence implies synchronous storage only. */
    flushStorage?(): Promise<void>;
}
/**
 * The app's own native code, by name. Values cross as JSON, so anything JSON
 * carries is an argument, a result or an event's data.
 */
interface PlatformNativeChannel {
    /** Whether anything answers to `method`. Synchronous: it is asked while a
     *  menu decides what to offer. */
    has(method: string): boolean;
    /** Call `method`. Rejects when nothing answers to the name, or with the
     *  reason the native side gave. */
    call(method: string, args?: unknown): Promise<unknown>;
    /** Hear every `event` the native side raises. Returns the unsubscribe. */
    on(event: string, handler: (data: unknown) => void): () => void;
}
/** How a rewarded ad ended: `completed` is whether the reward was earned. */
interface PlatformRewardedAdResult {
    completed: boolean;
}
/**
 * One rewarded ad unit. `show()` resolves when the ad CLOSED (however that
 * went), never while it is covering the game — the services layer wraps the
 * whole span in pause/resume. Implementations own the host's load/show dance
 * (load on demand, one reload retry on a stale instance).
 */
interface PlatformRewardedAd {
    preload(): Promise<void>;
    show(): Promise<PlatformRewardedAdResult>;
    destroy(): void;
}
/** One interstitial ad unit. Same contract as rewarded, minus the reward. */
interface PlatformInterstitialAd {
    preload(): Promise<void>;
    show(): Promise<void>;
    destroy(): void;
}
/** One in-game purchase, in the vocabulary every mini-game host shares. */
interface PlatformPaymentRequest {
    /** The offer this game sells under, from the host's developer console. */
    offerId: string;
    /** How many units of the host's in-game currency to buy. */
    quantity: number;
    /** Which of the game's zones/servers the currency lands in. Hosts default
     *  it to the first one; a single-zone game can leave it out. */
    zoneId?: string;
    /** Use the host's sandbox rather than charging real money. */
    sandbox?: boolean;
}
/** The share card for an active or passive share. `query` rides the launch
 *  options of whoever opens the shared card (invite links, room codes). */
interface PlatformShareOptions {
    title?: string;
    imageUrl?: string;
    query?: string;
}
/** A finished recording. What it carries depends on who keeps the video: WeChat
 *  keeps it to itself and shares it on the game's behalf, Douyin hands over a
 *  temp file, a browser hands over the encoded bytes. */
interface PlatformRecording {
    readonly durationMs: number;
    /** The host's temp file for the video (Douyin). */
    readonly path?: string;
    /** The encoded video (web) — a debug preview, not something a host can share. */
    readonly blob?: Blob;
    /** Highlight ranges in ms from the start of the recording, merged and in order. */
    readonly highlights: readonly (readonly [number, number])[];
}
/** What a shared clip says when it is opened. `query` rides the launch options
 *  of whoever opens it, as a share card's does. */
interface PlatformRecordingShareOptions {
    title?: string;
    desc?: string;
    query?: string;
}
/**
 * The host's game-screen recorder, one per host (both vendors hand out a
 * singleton). Every call resolves when the host says the thing happened, not
 * when it was asked: otherwise a refused start shows "recording" over nothing.
 */
interface PlatformScreenRecorder {
    /** The recording length the host accepts, in seconds. */
    readonly limits: {
        readonly minSeconds: number;
        readonly maxSeconds: number;
    };
    /** Whether a finished recording can be shared from here at all. */
    readonly canShare: boolean;
    /** `onFailure` hears a failure after the start was accepted — the recording
     *  is gone when it is called. */
    start(maxSeconds: number, onFailure: (error: Error) => void): Promise<void>;
    pause(): Promise<void>;
    resume(): Promise<void>;
    stop(): Promise<PlatformRecording>;
    abort(): Promise<void>;
    /** Keep `beforeSeconds` before now and `afterSeconds` after it for sharing. */
    highlight(beforeSeconds: number, afterSeconds: number): void;
    /** Both hosts refuse unless this runs inside the player's tap. */
    share(recording: PlatformRecording, options: PlatformRecordingShareOptions): Promise<void>;
}
/**
 * @deprecated Use {@link PlatformName}. Kept as an alias so existing imports
 * keep compiling; it named a closed set that a third-party host could not join.
 */
type PlatformType = PlatformName;

/**
 * @file    resource.ts
 * @brief   Resource system for global singleton data
 */
/**
 * A resource type, as {@link defineResource} returns it: the world holds one
 * value per definition. Opaque — pass it to `Res`/`ResMut`, `insertResource` or
 * `getResource` rather than reading it.
 *
 * @public
 */
interface ResourceDef<T> {
    /** @internal */
    readonly _id: symbol;
    /** @internal */
    readonly _name: string;
    /** @internal */
    readonly _default: T;
}
/**
 * Declare a resource: one value the whole world shares. A NAMED one is addressed
 * by its name, so two declarations of one name are one resource; an unnamed one
 * is addressed by the definition, and two calls answer two.
 *
 * An empty slot materialises the LATEST declaration's `defaultValue`.
 *
 * @public
 */
declare function defineResource<T>(defaultValue: T, name?: string): ResourceDef<T>;
/**
 * A request for read access to a resource, as {@link Res} returns it. Opaque —
 * the system body receives the resource value itself.
 *
 * @public
 */
interface ResDescriptor<T> {
    /** @internal */
    readonly _type: 'res';
    /** @internal */
    readonly _resource: ResourceDef<T>;
}
/**
 * A request for write access to a resource, as {@link ResMut} returns it.
 * Opaque — the body receives a `ResMutInstance`, whose `set`/`modify` are what
 * store the value back.
 *
 * @public
 */
interface ResMutDescriptor<T> {
    /** @internal */
    readonly _type: 'res_mut';
    /** @internal */
    readonly _resource: ResourceDef<T>;
}
/**
 * Ask a system for read access to a resource: the world's single instance of
 * `resource`, passed to the system body as the stored value itself.
 *
 * Not a copy — an object resource's fields are reachable through it. Replacing
 * the value, and the change tick recording it, is what {@link ResMut} is for.
 *
 * @public
 */
declare function Res<T>(resource: ResourceDef<T>): ResDescriptor<T>;
/**
 * Ask a system for write access to a resource. The body receives a
 * {@link ResMutInstance}, not the value: `set` or `modify` is what stores it back
 * and stamps the change tick a `Changed` filter reads.
 *
 * @public
 */
declare function ResMut<T>(resource: ResourceDef<T>): ResMutDescriptor<T>;
/**
 * Write access to a resource, as {@link ResMut} asked for. `get` reads,
 * `set` replaces, `modify` edits in place — and both writers store the value
 * back and bump the change tick, which is the part `Res` cannot do.
 *
 * @public
 */
declare class ResMutInstance<T> {
    private value_;
    private readonly setter_;
    constructor(value: T, setter: (v: T) => void);
    get(): T;
    set(value: T): void;
    modify(fn: (value: T) => void): void;
    /** @internal */
    updateValue(value: T): void;
}
declare class ResourceStorage {
    private resources_;
    private resMutPool_;
    private ticks_;
    private globalTick_;
    private nameRegistry_;
    /**
     * Slots holding a materialised default rather than a value somebody put
     * there. `has` is what every self-gating subsystem asks before installing
     * itself, so a read must not answer it: a resource defaulting to `null`
     * would report present the moment any system took it as a parameter.
     */
    private defaulted_;
    /** What each slot is called, so nobody has to reconstruct it from a symbol. */
    private names_;
    /** Record what a slot is called, whichever door reached it. */
    private note_;
    insert<T>(resource: ResourceDef<T>, value: T): void;
    get<T>(resource: ResourceDef<T>): T;
    set<T>(resource: ResourceDef<T>, value: T): void;
    has<T>(resource: ResourceDef<T>): boolean;
    remove<T>(resource: ResourceDef<T>): void;
    /**
     * Every slot this storage holds, as `[name, value]` — including one only a
     * read has materialised, which is most of them in a running game.
     *
     * The name is the declaration's. Reconstructing it from the id's
     * description is a second author of what a resource is called.
     */
    entries(): Array<[string, unknown]>;
    getChangeTick(resource: ResourceDef<unknown>): number;
    getByName(name: string): ResourceDef<unknown> | undefined;
    getRegisteredNames(): string[];
    getResMut<T>(resource: ResourceDef<T>): ResMutInstance<T>;
}
/**
 * The frame's clock, as {@link Time} carries it. `delta` is what almost
 * everything integrates by — it is already multiplied by `scale`, so honouring a
 * pause costs a system nothing.
 *
 * @public
 */
interface TimeData {
    /** Seconds since the previous frame, scaled by `scale`. */
    delta: number;
    /** Accumulated scaled game seconds; frozen while paused except for explicit frame steps. */
    elapsed: number;
    /** Render frames completed — machine-dependent; see `fixedTick`. */
    frameCount: number;
    /** Fixed-update timestep in seconds — the FixedUpdate / physics cadence. */
    fixedDelta: number;
    /**
     * Interpolation factor in [0, 1) into the current fixed step
     * (fixedAccumulator / fixedDelta), set after the fixed-update loop each
     * frame. Render-time systems lerp prev→current state by this to smooth
     * fixed-step simulation (e.g. physics) onto the variable render rate.
     */
    fixedAlpha: number;
    /**
     * Monotonic count of completed FixedUpdate steps — the simulation's own
     * time axis (frameCount counts render frames, which vary per machine).
     * Netcode stamps snapshots and input commands with this.
     */
    fixedTick: number;
    /**
     * Multiplier on `delta` and on the fixed-step accumulation; negatives clamp
     * to 0. At 0 the frame still runs — systems tick and a menu draws — while
     * everything advancing by `delta` (movement, navigation, behaviour trees,
     * the physics step) advances by nothing.
     *
     * Read once at the top of the frame, before any system runs, so a write
     * takes effect from the next frame: a game that pauses in `Update`
     * integrates that frame in full and freezes from the one after.
     */
    scale: number;
    /** Real frame time, unaffected by `scale`, for whatever must keep moving. */
    unscaledDelta: number;
}
/**
 * The frame clock, as `Res(Time)`. The engine writes it once per frame before
 * any system runs; `scale` is the one field a project sets.
 *
 * @public
 */
declare const Time: ResourceDef<TimeData>;

export { Achievements, AchievementsAPI, Audio, AudioAPI, AudioBus, AudioMixer, BUILTIN_AUDIO_BUSES, MOST_WATER_WAVES, QualityController, Res, ResMut, ResMutInstance, ResourceStorage, SIDE_MODULES, SPINE_VERSIONS, Time, builtinBusVolume, clearProjectSideModules, createLocalAchievements, decidePower, defaultQualityMode, defaultQualityProfile, defineResource, judgeFrames, parseBusEffects, parseQualityConfig, physics3dModuleId, projectSideModuleIds, registerSideModule, resolveQualityProfile, sideModuleDescriptor, spineModuleId };
export type { AchievementProvider, AudioBackendInitOptions, AudioBufferHandle, AudioBufferStats, AudioBusConfig, AudioDelivery, AudioHandle, AudioLoadOptions, AudioLoadType, AudioMixerConfig, BuiltinSideModuleId, BusDuckRule, BusEffectDef, CompressorEffectDef, DeviceBackend, DeviceCapabilities, DeviceQualityInfo, DeviceQualityRule, DeviceRequestStatus, DeviceResult, DeviceState, EmscriptenFactory, FilterEffectDef, FrameVerdict, GamepadSnapshot, ImageLoadResult, InputEventCallbacks, MotionOptions, MotionRate, MotionSample, Physics3DBackend, PlatformAdapter, PlatformAudioBackend, PlatformCanvas, PlatformCanvas2DContext, PlatformGlyph, PlatformGlyphRequest, PlatformImage, PlatformInterstitialAd, PlatformNativeChannel, PlatformPaymentRequest, PlatformRecording, PlatformRecordingShareOptions, PlatformRequestOptions, PlatformResponse, PlatformRewardedAd, PlatformRewardedAdResult, PlatformScreenRecorder, PlatformShareOptions, PlatformSocket, PlatformSocketEvents, PlatformSocketOptions, PlatformSocketReadyState, PlatformTextEditor, PlatformType, PlatformVideoBackend, PlayConfig, PowerDecision, PowerLevel, PowerPolicy, PowerState, QualityConfig, QualityLevel, QualityMode, QualityProfile, QualityReport, QualitySample, ResDescriptor, ResMutDescriptor, ResourceDef, ReverbEffectDef, SideModuleDescriptor, SideModuleHost, SideModuleId, SpineVersion, TimeData, VibrationIntensity, VibrationOptions, VideoBackendContext, VideoStreamHandle, VideoStreamOptions, WasmInstantiateResult };
