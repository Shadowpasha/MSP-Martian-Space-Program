import { DeviceBackend, PowerState, MotionOptions, DeviceResult, VibrationOptions, WasmInstantiateResult, PlatformAudioBackend, VideoBackendContext, PlatformVideoBackend, PlatformSocketOptions, PlatformSocket, PlatformPaymentRequest } from './resource.js';
import { Vec3 } from './wasm.js';

interface Callbacks {
    success?(): void;
    fail?(error: {
        errMsg?: string;
    }): void;
}
interface SensorOptions extends Callbacks {
    interval?: 'normal' | 'ui' | 'game';
}
interface MiniGameDeviceHost {
    startAccelerometer?(options: SensorOptions): void;
    stopAccelerometer?(options: Callbacks): void;
    onAccelerometerChange?(handler: (value: Vec3) => void): void;
    offAccelerometerChange?(handler: (value: Vec3) => void): void;
    startGyroscope?(options: SensorOptions): void;
    stopGyroscope?(options: Callbacks): void;
    onGyroscopeChange?(handler: (value: Vec3) => void): void;
    offGyroscopeChange?(handler: (value: Vec3) => void): void;
    vibrateShort?(options: Callbacks & {
        type: 'light' | 'medium' | 'heavy';
    }): void;
    vibrateLong?(options: Callbacks): void;
    setKeepScreenOn?(options: Callbacks & {
        keepScreenOn: boolean;
    }): void;
    /** The battery as the mini-game platform reports it: level 0 to 100. */
    getBatteryInfoSync?(): {
        level: number;
        isCharging: boolean;
    };
    onHide?(handler: () => void): void;
    offHide?(handler: () => void): void;
    onShow?(handler: () => void): void;
    offShow?(handler: () => void): void;
}
declare class MiniGameDevice implements DeviceBackend {
    private readonly host;
    private readonly now;
    private readonly events;
    private options;
    private epoch;
    private hidden;
    private disposed;
    private screenWanted;
    private screenEpoch;
    private tail;
    constructor(host: MiniGameDeviceHost, now?: () => number);
    power(): PowerState;
    capabilities(): {
        accelerometer: boolean;
        gyroscope: boolean;
        vibration: boolean;
        vibrationIntensity: boolean;
        keepScreenOn: boolean;
        orientation: boolean;
        fullscreen: boolean;
        pointerLock: boolean;
    };
    state(): {
        fullscreen: boolean;
        pointerLocked: boolean;
        screenOn: boolean;
        motionActive: boolean;
    };
    onMotion(handler: Parameters<DeviceBackend['onMotion']>[0]): () => void;
    onStateChange(handler: Parameters<DeviceBackend['onStateChange']>[0]): () => void;
    startMotion(options?: MotionOptions): Promise<DeviceResult>;
    stopMotion(): Promise<DeviceResult>;
    vibrate(options?: VibrationOptions): Promise<DeviceResult>;
    keepScreenOn(enabled: boolean): Promise<DeviceResult>;
    fullscreen(_enabled: boolean, _target?: unknown): Promise<DeviceResult>;
    pointerLock(_enabled: boolean, _target?: unknown): Promise<DeviceResult>;
    dispose(): void;
    private enqueue;
    private call;
    private stopSensors;
    private acceleration;
    private gyroscope;
    private hide;
    private show;
}

/**
 * @file    api.ts
 * @brief   Normalized mini-game host surface + per-vendor profile descriptor.
 *
 * WeChat (`wx`) and Douyin (`tt`) are two vendors of the same "mini-game
 * platform" family: their global objects expose a near-identical API. This file
 * models only the subset the engine actually uses; each vendor's global
 * satisfies `MiniGameGlobal` structurally and is bound at the profile boundary
 * (`sdk/src/platform/<vendor>/profile.ts`) with a single cast.
 *
 * The family logic (canvas / fs / fetch / image / input / storage) is written
 * ONCE against `MiniGameGlobal` in `adapter.ts`. Genuinely divergent operations
 * — WASM instantiation (WeChat's WXWebAssembly vs a standard loader), audio,
 * video, sockets — are methods on `MiniGameProfile`, not derived from the global.
 */

interface MiniGameCanvas {
    width: number;
    height: number;
    getContext(type: string, attributes?: unknown): unknown;
}
interface MiniGameImage {
    width: number;
    height: number;
    src: string;
    onload: (() => void) | null;
    onerror: ((err: unknown) => void) | null;
}
interface MiniGameFileSystemManager {
    readdir?(opts: {
        dirPath: string;
        success?: (res: {
            files: string[];
        }) => void;
        fail?: (err: {
            errMsg: string;
        }) => void;
    }): void;
    stat?(opts: {
        path: string;
        recursive?: boolean;
        success?: (res: {
            stats: {
                size: number;
                lastAccessedTime: number;
                isFile(): boolean;
            };
        }) => void;
        fail?: (err: {
            errMsg: string;
        }) => void;
    }): void;
    unlink?(opts: {
        filePath: string;
        success?: () => void;
        fail?: (err: {
            errMsg: string;
        }) => void;
    }): void;
    rename?(opts: {
        oldPath: string;
        newPath: string;
        success?: () => void;
        fail?: (err: {
            errMsg: string;
        }) => void;
    }): void;
    readFileSync(path: string, encoding?: string): ArrayBuffer | string;
    readFile(opts: {
        filePath: string;
        encoding?: string;
        success?: (res: {
            data: ArrayBuffer | string;
        }) => void;
        fail?: (err: {
            errMsg: string;
        }) => void;
    }): void;
    access(opts: {
        path: string;
        success?: () => void;
        fail?: (err: {
            errMsg: string;
        }) => void;
    }): void;
    accessSync(path: string): void;
    writeFile(opts: {
        filePath: string;
        data: string | ArrayBuffer;
        encoding?: string;
        success?: () => void;
        fail?: (err: {
            errMsg: string;
        }) => void;
    }): void;
}
interface MiniGameRequestOptions {
    url: string;
    method?: string;
    data?: string | ArrayBuffer;
    header?: Record<string, string>;
    responseType?: 'text' | 'arraybuffer';
    timeout?: number;
    success?: (res: {
        statusCode: number;
        header?: Record<string, string>;
        data: string | ArrayBuffer;
    }) => void;
    fail?: (err: {
        errMsg: string;
    }) => void;
}
interface MiniGameSystemInfo {
    pixelRatio?: number;
    language?: string;
    windowWidth?: number;
    windowHeight?: number;
    /** Where the host itself is running — `ios`, `android`, `devtools`, … Not
     *  cosmetic: in-game purchase is permitted on some of these and forbidden
     *  on others, so a capability has to read it. */
    platform?: string;
    model?: string;
    memorySize?: number | string;
}
interface MiniGameTouch {
    identifier: number;
    clientX: number;
    clientY: number;
}
interface MiniGameTouchEvent {
    changedTouches: MiniGameTouch[];
}
interface MiniGameKeyEvent {
    code: string;
}
interface MiniGameStorageInfo {
    keys: string[];
}
/**
 * A one-shot audio player. Every mini-game host exposes this shape under
 * `createInnerAudioContext()`; WeChat's `InnerAudioContext` is structurally
 * assignable. Modelling it here is what makes audio a FAMILY capability instead
 * of a per-vendor backend.
 */
interface MiniGameInnerAudioContext {
    src: string;
    loop: boolean;
    volume: number;
    playbackRate: number;
    startTime: number;
    obeyMuteSwitch: boolean;
    readonly paused: boolean;
    readonly currentTime: number;
    readonly duration: number;
    play(): void;
    pause(): void;
    stop(): void;
    destroy(): void;
    onEnded(cb: () => void): void;
    onError(cb: (res: {
        errMsg: string;
    }) => void): void;
}
/**
 * A rewarded video ad, as every mini-game host shapes it: WeChat's
 * `RewardedVideoAd` and Douyin's are structurally identical, which is what
 * makes ads a FAMILY capability rather than a per-vendor override. `onClose`
 * reports whether the video was watched to the end (`isEnded`); some hosts
 * omit the record entirely on older runtimes, which callers must treat as
 * "completed" — the platform granted the reward and simply didn't say so.
 */
interface MiniGameRewardedVideoAd {
    load(): Promise<void>;
    show(): Promise<void>;
    onLoad(cb: () => void): void;
    offLoad(cb: () => void): void;
    onError(cb: (err: {
        errMsg: string;
        errCode?: number;
    }) => void): void;
    offError(cb: (err: {
        errMsg: string;
        errCode?: number;
    }) => void): void;
    onClose(cb: (res?: {
        isEnded: boolean;
    }) => void): void;
    offClose(cb: (res?: {
        isEnded: boolean;
    }) => void): void;
}
/** An interstitial ad. Same family shape as rewarded, plus `destroy` (the
 *  hosts document interstitials as destroyable; rewarded ads are singletons). */
interface MiniGameInterstitialAd {
    load(): Promise<void>;
    show(): Promise<void>;
    destroy(): void;
    onLoad(cb: () => void): void;
    offLoad(cb: () => void): void;
    onError(cb: (err: {
        errMsg: string;
        errCode?: number;
    }) => void): void;
    offError(cb: (err: {
        errMsg: string;
        errCode?: number;
    }) => void): void;
    onClose(cb: () => void): void;
    offClose(cb: () => void): void;
}
/** WeChat's GameRecorder. Control calls return promises; outcomes arrive as
 *  events — `stop` carries `{ duration }` in ms and no file, because WeChat
 *  keeps the video. */
interface MiniGameWxRecorder {
    start(opts: {
        duration?: number;
    }): void;
    pause(): Promise<unknown>;
    resume(): Promise<unknown>;
    stop(): Promise<unknown>;
    abort(): Promise<unknown>;
    isFrameSupported?(): boolean;
    /** Kuaishou's share for the last recording; the callback gets an error only on failure. */
    publishVideo?(opts: {
        query?: string;
        callback?: (error?: unknown) => void;
    }): void;
    on(event: 'start' | 'stop' | 'pause' | 'resume' | 'abort' | 'error', cb: (res?: unknown) => void): void;
    off(event: 'start' | 'stop' | 'pause' | 'resume' | 'abort' | 'error', cb: (res?: unknown) => void): void;
}
/** Douyin's GameRecorderManager. Calls are synchronous; each outcome has its own
 *  listener, and `onStop` hands over the temp file. */
interface MiniGameTtRecorder {
    start(opts: {
        duration?: number;
    }): void;
    pause(): void;
    resume(): void;
    stop(): void;
    recordClip(opts: {
        timeRange: [number, number];
        success?: (res: {
            index: number;
        }) => void;
        fail?: (err: {
            errMsg?: string;
        }) => void;
    }): void;
    clipVideo(opts: {
        path: string;
        success?: (res: {
            videoPath: string;
        }) => void;
        fail?: (err: {
            errMsg?: string;
        }) => void;
    }): void;
    onStart(cb: () => void): void;
    onPause(cb: () => void): void;
    onResume(cb: () => void): void;
    onStop(cb: (res: {
        videoPath: string;
    }) => void): void;
    onError(cb: (res: {
        errMsg?: string;
    }) => void): void;
    /** Base library 1.6.1+. */
    onInterruptionBegin?(cb: () => void): void;
    onInterruptionEnd?(cb: () => void): void;
}
/** The share card a host shows for an active or passive share. */
interface MiniGameShareOptions {
    title?: string;
    imageUrl?: string;
    query?: string;
}
/**
 * The open data context, seen from the MAIN domain.
 *
 * It is a second JS runtime with no WebGL, no wasm and almost none of the host
 * API — and the only place a player's FRIENDS can be read at all. It draws on
 * `canvas`, which the main domain samples as a texture; `postMessage` is how it
 * is told what to draw. There is no channel back: no host offers sub→main
 * messaging, which is why nothing in this engine's leaderboard asks the context
 * a question.
 */
interface MiniGameOpenDataContext {
    postMessage(message: Record<string, unknown>): void;
    /** The shared canvas. The context draws here; the main domain samples it. */
    readonly canvas: MiniGameCanvas;
}
/** One entry of the host's per-player cloud store — the rows a leaderboard is
 *  assembled from. Writable only for the player themselves. */
interface MiniGameKVData {
    key: string;
    value: string;
}
/** The socket task `connectSocket()` returns. WeChat's `SocketTask` fits. */
interface MiniGameSocketTask {
    send(opts: {
        data: string | ArrayBuffer;
    }): void;
    close(opts: {
        code?: number;
        reason?: string;
    }): void;
    onOpen(cb: (res?: unknown) => void): void;
    onMessage(cb: (res: {
        data: string | ArrayBuffer;
    }) => void): void;
    onClose(cb: (res: {
        code: number;
        reason: string;
    }) => void): void;
    onError(cb: (err: unknown) => void): void;
}
/**
 * The subset of the mini-game host global (`wx` / `tt`) the engine consumes.
 * Optional members are capabilities a vendor may lack (keyboard, subpackages,
 * memory-pressure signal, app show/hide). The adapter probes for them at use
 * time, so a vendor missing one degrades gracefully rather than throwing.
 */
interface MiniGameGlobal extends MiniGameDeviceHost {
    /** The writable directory a game may keep files in (`wx.env.USER_DATA_PATH`). */
    env?: {
        USER_DATA_PATH?: string;
    };
    createCanvas(): MiniGameCanvas;
    createImage(): MiniGameImage;
    getFileSystemManager(): MiniGameFileSystemManager;
    request(opts: MiniGameRequestOptions): void;
    createInnerAudioContext(): MiniGameInnerAudioContext;
    connectSocket(opts: {
        url: string;
        protocols?: string[];
    }): MiniGameSocketTask;
    getSystemInfoSync(): MiniGameSystemInfo;
    getDeviceInfo?(): MiniGameSystemInfo;
    onTouchStart(cb: (res: MiniGameTouchEvent) => void): void;
    onTouchMove(cb: (res: MiniGameTouchEvent) => void): void;
    onTouchEnd(cb: (res: MiniGameTouchEvent) => void): void;
    offTouchStart(cb: (res: MiniGameTouchEvent) => void): void;
    offTouchMove(cb: (res: MiniGameTouchEvent) => void): void;
    offTouchEnd(cb: (res: MiniGameTouchEvent) => void): void;
    onTouchCancel?(cb: (res: MiniGameTouchEvent) => void): void;
    offTouchCancel?(cb: (res: MiniGameTouchEvent) => void): void;
    onKeyDown?(cb: (res: MiniGameKeyEvent) => void): void;
    onKeyUp?(cb: (res: MiniGameKeyEvent) => void): void;
    offKeyDown?(cb: (res: MiniGameKeyEvent) => void): void;
    offKeyUp?(cb: (res: MiniGameKeyEvent) => void): void;
    showLoading?(opts: {
        title: string;
        mask?: boolean;
    }): void;
    hideLoading?(): void;
    loadSubpackage?(opts: {
        name: string;
        success?: () => void;
        fail?: (err: unknown) => void;
        complete?: () => void;
    }): void;
    onMemoryWarning?(cb: () => void): void;
    offMemoryWarning?(cb: () => void): void;
    /** Errors that reached the host uncaught. WeChat reports the script error as
     *  a string (plus a structured second argument on newer bases, which this
     *  does not rely on); an unhandled rejection arrives separately, and only on
     *  bases new enough to have it — hence both optional. */
    onError?(cb: (error: string | {
        message?: string;
        stack?: string;
    }) => void): void;
    offError?(cb: (error: string | {
        message?: string;
        stack?: string;
    }) => void): void;
    onUnhandledRejection?(cb: (res: {
        reason?: unknown;
    }) => void): void;
    offUnhandledRejection?(cb: (res: {
        reason?: unknown;
    }) => void): void;
    onShow?(cb: () => void): void;
    onHide?(cb: () => void): void;
    offShow?(cb: () => void): void;
    offHide?(cb: () => void): void;
    /** The window changed size — a rotation, a foldable, split screen. Carries
     *  the new size, which is authoritative: a `getSystemInfoSync` beside it can
     *  still answer with the old one. */
    onWindowResize?(cb: (res: {
        windowWidth: number;
        windowHeight: number;
    }) => void): void;
    /** Monetization + share — optional like every capability a vendor may lack
     *  (or a game may not have configured): the adapter probes at use time. */
    createRewardedVideoAd?(opts: {
        adUnitId: string;
    }): MiniGameRewardedVideoAd;
    createInterstitialAd?(opts: {
        adUnitId: string;
    }): MiniGameInterstitialAd;
    shareAppMessage?(opts: MiniGameShareOptions & {
        channel?: 'video';
        desc?: string;
        extra?: {
            videoPath: string;
        };
        success?: () => void;
        fail?: (err: {
            errMsg?: string;
        }) => void;
    }): void;
    /** Passive share: what the card says when the player shares from the host's
     *  own menu. The host calls `cb` at share time, not at registration. */
    onShareAppMessage?(cb: () => MiniGameShareOptions): void;
    /** WeChat's recorder (base 2.8.0), a singleton. Kuaishou copies the shape. */
    getGameRecorder?(): MiniGameWxRecorder;
    /** Shares WeChat's last recording; must run inside a tap (base 2.26.1). */
    operateGameRecorderVideo?(opts: {
        title?: string;
        desc?: string;
        query?: string;
        timeRange?: number[][];
        success?: () => void;
        fail?: (err: {
            errMsg?: string;
            errCode?: number;
        }) => void;
    }): void;
    /** Douyin's recorder (base 1.6.1), a singleton. */
    getGameRecorderManager?(): MiniGameTtRecorder;
    /** Begin a sign-in. The result is a one-time code the game's own server
     *  exchanges — see the note on `PlatformAdapter.login`. */
    login?(opts: {
        success?: (res: {
            code: string;
        }) => void;
        fail?: (err: unknown) => void;
        timeout?: number;
    }): void;
    /** Whether the host still regards the last sign-in as current. Reports the
     *  answer by WHICH callback it calls, not by a value. */
    checkSession?(opts: {
        success?: () => void;
        fail?: (err: unknown) => void;
    }): void;
    /** In-game purchase of the host's currency. Present on the global whatever
     *  device it is running on — whether it may actually be CALLED is a
     *  platform rule, not an API-shape question. See `MiniGamePlatformAdapter.canPay`. */
    requestMidasPayment?(opts: {
        mode: string;
        offerId: string;
        buyQuantity: number;
        zoneId?: string;
        currencyType?: string;
        platform?: string;
        env?: number;
        success?: () => void;
        fail?: (err: {
            errMsg?: string;
            errCode?: number;
        }) => void;
    }): void;
    /** The open data context, if this host has one. Absent on a host without
     *  friend data, and on a game whose package declares no context directory. */
    getOpenDataContext?(): MiniGameOpenDataContext;
    /** Write THIS player's rows into the host's cloud store. Writing is the main
     *  domain's half of a leaderboard; reading — anyone's, including the
     *  player's own — belongs to the open data context alone. */
    setUserCloudStorage?(opts: {
        KVDataList: MiniGameKVData[];
        success?: () => void;
        fail?: (err: unknown) => void;
        complete?: () => void;
    }): void;
    getStorageSync(key: string): unknown;
    setStorageSync(key: string, value: string): void;
    removeStorageSync(key: string): void;
    getStorageInfoSync(): MiniGameStorageInfo;
}
/**
 * A mini-game vendor's id. The vendors the engine ships are named for
 * completion, but the type is OPEN: a game can describe a host the engine has
 * never heard of and get the whole family for it. Nothing in the SDK branches on
 * this value — it is identity (adapter name, diagnostics, logs), not behavior.
 */
type MiniGameVendor = 'wechat' | 'douyin' | 'kuaishou' | 'bilibili' | 'quickgame' | 'alipay' | 'huawei' | 'openpaas' | (string & {});
/**
 * A vendor described as DATA — three facts and, at most, one method.
 *
 * The family adapter reads `global` for every capability the hosts share, and
 * that is nearly all of them: audio (`createInnerAudioContext`), sockets
 * (`connectSocket`), video (the engine's own wasm decoder) and the whole
 * fs/fetch/canvas/input/storage surface all come from the normalized global. So
 * the overrides below are OPTIONAL — a vendor supplies one only where it truly
 * differs from the family. WeChat overrides exactly one (`instantiateWasm`, for
 * WXWebAssembly); a host with standard `WebAssembly` overrides none.
 */
interface MiniGameProfile {
    /** Vendor identity — used for the adapter `name`, diagnostics, and logs. */
    readonly id: MiniGameVendor;
    /** Human label woven into filesystem error guidance ("WeChat" / "抖音"). */
    readonly hostLabel: string;
    /** The host global (`wx` / `tt`), bound with a cast at the profile boundary. */
    readonly global: MiniGameGlobal;
    /** WASM instantiation, when the host does not use the standard
     *  `WebAssembly.instantiate` (WeChat routes it through WXWebAssembly, which
     *  takes a package path and is not a member of the host global). Omit and
     *  the family reads the file through the adapter and instantiates it. */
    instantiateWasm?(pathOrBuffer: string | ArrayBuffer, imports: WebAssembly.Imports): Promise<WasmInstantiateResult>;
    /** Omit for the family backend over `global.createInnerAudioContext()`. */
    createAudioBackend?(): PlatformAudioBackend;
    /** Omit for the engine's own wasm video decoder (portable to every vendor). */
    createVideoBackend?(ctx: VideoBackendContext): PlatformVideoBackend;
    /** Omit for the family socket over `global.connectSocket()`. */
    createSocket?(options: PlatformSocketOptions): PlatformSocket;
    /**
     * Buying in-game currency, when the vendor's call is not WeChat's
     * `requestMidasPayment`. That one carries WeChat's own rules (Android only,
     * Midas field names), and applying them everywhere makes the engine say
     * "this host sells nothing" about a host that sells things.
     */
    pay?: {
        /** Asked before a game offers a purchase at all. */
        can(): boolean;
        request(request: PlatformPaymentRequest): Promise<void>;
    };
    /** The host reports `windowWidth`/`windowHeight` and touch positions in physical
     *  pixels rather than WeChat's logical ones (vivo: 2340 wide beside a pixelRatio
     *  of 2.75), so multiplying by pixelRatio again would size the screen past the
     *  GPU's limit and put every tap off it. */
    windowInPhysicalPixels?: boolean;
    /** The recording length this vendor accepts, when its recorder's shape is
     *  another vendor's but its limits are not. */
    recordingLimits?: {
        readonly minSeconds: number;
        readonly maxSeconds: number;
    };
}

export { MiniGameDevice };
export type { MiniGameCanvas, MiniGameFileSystemManager, MiniGameGlobal, MiniGameImage, MiniGameInnerAudioContext, MiniGameKeyEvent, MiniGameProfile, MiniGameRequestOptions, MiniGameSocketTask, MiniGameStorageInfo, MiniGameSystemInfo, MiniGameTouch, MiniGameTouchEvent, MiniGameVendor };
