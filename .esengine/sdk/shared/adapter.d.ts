import { PlatformAdapter, PlatformRequestOptions, PlatformResponse, ImageLoadResult, WasmInstantiateResult, PlatformImage, PlatformRewardedAd, PlatformInterstitialAd, PlatformShareOptions, PlatformScreenRecorder, PlatformPaymentRequest, PlatformCanvas, InputEventCallbacks, PlatformAudioBackend, VideoBackendContext, PlatformVideoBackend, PlatformSocketOptions, PlatformSocket } from './resource.js';
import { MiniGameDevice, MiniGameProfile, MiniGameGlobal, MiniGameCanvas } from './api.js';

/**
 * @file    adapter.ts
 * @brief   The mini-game platform adapter family.
 *
 * ONE implementation of `PlatformAdapter` shared by every mini-game vendor. It
 * reads `profile.global` for the shared capabilities (canvas, fs, fetch, image,
 * input, storage, subpackage, memory-warning, DPR, language) and delegates the
 * genuine per-vendor divergences (WASM, audio, video, sockets) to the profile.
 *
 * Adding a vendor = one `MiniGameProfile`, not a parallel adapter.
 */

declare class MiniGamePlatformAdapter implements PlatformAdapter {
    private device_;
    device(): MiniGameDevice;
    readonly name: PlatformAdapter['name'];
    /** Every vendor built on this adapter answers `isMiniGame()` — no name list. */
    readonly family: "minigame";
    private readonly profile_;
    private readonly g_;
    private fs_;
    private inputCleanup_;
    private pixelRatio_;
    private openDataCtx_;
    private openDataResolved_;
    private recorder_;
    private cacheWriteId_;
    constructor(profile: MiniGameProfile);
    /**
     * The host global, for the few capabilities only a mini-game has — the
     * loading indicator a boot reports through, which exists because the display
     * canvas is the GL surface and nothing 2D can be drawn over it.
     *
     * @internal Read-only: the adapter stays the one caller of what it abstracts.
     */
    get host(): MiniGameGlobal;
    private fs;
    fetch(url: string, options?: PlatformRequestOptions): Promise<PlatformResponse>;
    readFile(path: string): Promise<ArrayBuffer>;
    readTextFile(path: string): Promise<string>;
    fileExists(path: string): Promise<boolean>;
    /** Hot update's content cache, flat under the host's user data directory and
     *  named as on every other platform. */
    readCacheFile(key: string): Promise<ArrayBuffer | null>;
    writeCacheFile(key: string, bytes: ArrayBuffer): Promise<void>;
    canManageCache(): boolean;
    hasCacheStorage(): boolean;
    listCacheFiles(): Promise<{
        name: string;
        size: number;
        lastAccess: number;
    }[]>;
    removeCacheFile(name: string): Promise<void>;
    loadImagePixels(path: string): Promise<ImageLoadResult>;
    /** Where hot update stored @p url's bytes, when it did: an image drawn from the
     *  CDN url instead goes blank the first launch without a network. */
    private cachedFileOf_;
    instantiateWasm(pathOrBuffer: string | ArrayBuffer, imports: WebAssembly.Imports): Promise<WasmInstantiateResult>;
    createImage(): PlatformImage;
    /** Download an on-demand subpackage so its files become readable. */
    loadSubpackage(name: string): Promise<void>;
    /** One rewarded ad over the host's RewardedVideoAd; null when this vendor
     *  has no ad API (the services layer substitutes its mock or fails loud). */
    createRewardedAd(adUnitId: string): PlatformRewardedAd | null;
    /** One interstitial over the host's InterstitialAd; null when absent. */
    createInterstitialAd(adUnitId: string): PlatformInterstitialAd | null;
    /** Open the host's share sheet. A vendor without `shareAppMessage` no-ops:
     *  every shipped mini-game host has it, and "the sheet did not open" is not
     *  a state the caller can act on (no host reports share outcomes at all). */
    share(options: PlatformShareOptions): void;
    /** The host's foreground signal. A host without `offShow` cannot unsubscribe,
     *  and the returned function then does nothing. */
    onAppShow(callback: () => void): () => void;
    onAppHide(callback: () => void): () => void;
    /** Register the passive-share card provider (the host's own share menu). */
    onShareRequest(provide: () => PlatformShareOptions): void;
    /** The host hands out one recorder, so this does too. */
    screenRecorder(): PlatformScreenRecorder | null;
    /** This one class serves every vendor, so it defines `login` regardless —
     *  the honest answer is whether the host behind it has one. */
    canSignIn(): boolean;
    /**
     * Whether a purchase may happen on THIS device.
     *
     * Paying inside a mini-game is an Android-only permission: the call exists
     * on an iPhone and the platform refuses it. That is a rule, not a fault, so
     * it belongs in the capability rather than in an error a game discovers by
     * charging someone. Devtools counts — that is where a purchase flow is
     * built, against the host's sandbox.
     */
    canPay(): boolean;
    /** Buy in-game currency. Rejects with the host's own reason: "the purchase
     *  failed" without a code cannot be told apart from the player changing
     *  their mind, and those need different UI. */
    requestPayment(request: PlatformPaymentRequest): Promise<void>;
    /** Begin a sign-in, as a promise. Rejects with the host's own words: this
     *  is a network round trip and "it failed" without why is unactionable. */
    login(): Promise<string>;
    /** Whether the last sign-in is still current. The hosts answer by which
     *  callback they call, so this is where that becomes a boolean. */
    checkSession(): Promise<boolean>;
    /**
     * The open data context, resolved once and kept.
     *
     * `getOpenDataContext()` is documented as returning the same object every
     * time, but it is not free — and this is asked on the frame a leaderboard
     * opens, not at boot, because a host whose package declares no context
     * throws rather than answering null. Caching a THROW as "absent" is the
     * point: the second ask would throw again to no one's benefit.
     */
    private openData_;
    /** Send one message into the open data context. Absent context = no-op:
     *  the caller already asked `available` if it cared. */
    openDataPostMessage(message: Record<string, unknown>): void;
    /** The shared canvas, for the main domain to sample as a texture. The same
     *  honest cast {@link createCanvas} makes, for the same reason. */
    openDataCanvas(): PlatformCanvas | null;
    /** Write this player's own rows to the host's cloud store. Whether there
     *  was a store is reported; whether the write landed is not — that failure
     *  (offline) is the one no host distinguishes for us. */
    setCloudKeyValues(entries: Readonly<Record<string, string>>): boolean;
    onMemoryWarning(callback: () => void): () => void;
    /**
     * The host's two uncaught channels, each subscribed only if this base
     * library has it.
     *
     * A script error arrives as a STRING on WeChat rather than an Error, so the
     * stack is in the text and there is nothing to take a `.stack` off — which
     * is why the diagnostics layer tolerates non-Errors instead of assuming one.
     * `onUnhandledRejection` is newer than `onError`; a base without it loses
     * only the promise half.
     */
    onUnhandledError(callback: (error: unknown) => void): () => void;
    createCanvas(width: number, height: number): PlatformCanvas;
    /**
     * The ON-SCREEN canvas, sized to the device viewport.
     *
     * Distinct from {@link createCanvas}, which makes offscreen 2D surfaces for
     * image decode and glyph rasterization: on every mini-game host the FIRST
     * `createCanvas()` of the process returns the display canvas, and the render
     * surface is the GL context taken from it. The runtime calls this once at
     * boot, before anything else touches createCanvas.
     */
    createScreenCanvas(): MiniGameCanvas;
    /** Size the display canvas to a window measurement. Left at the host's own
     *  default when the measurement is incomplete — a 0×0 surface would be worse
     *  than the host's guess. */
    private sizeScreenCanvas_;
    now(): number;
    bindInputEvents(callbacks: InputEventCallbacks, _target?: unknown): void;
    unbindInputEvents(): void;
    createAudioBackend(): PlatformAudioBackend;
    createVideoBackend(ctx: VideoBackendContext): PlatformVideoBackend;
    createSocket(options: PlatformSocketOptions): PlatformSocket;
    /** The host returns `''` for both absent keys and stored empty strings.
     *  Only that ambiguous result needs the key list; normal reads stay direct. */
    getStorageItem(key: string): string | null;
    setStorageItem(key: string, value: string): void;
    removeStorageItem(key: string): void;
    /** Read once and again after a resize: the UI, the cameras and text ask every
     *  frame, and on vivo each read is a synchronous call across its bridge. */
    devicePixelRatio(): number;
    deviceName(): string;
    deviceQualityInfo(): {
        model?: string;
        memoryGB?: number;
    };
    language(): string;
    clearStorage(prefix: string): void;
}

export { MiniGamePlatformAdapter };
