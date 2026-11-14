import { ESEngineModule } from './wasm.js';
import { RuntimeBuildConfig, Physics3DWorldConfig, ThemeOverrides, AudioProjectConfig, WeChatSideModuleFactories as MiniGameSideModuleFactories, DebugChannelConfig, PackagedGameConfig } from '../index.js';
import { AotManifest } from './app.js';
import { Physics3DBackend } from './resource.js';
import { Physics2DPluginConfig } from './Physics2D.js';

/**
 * @file    miniGameRuntime.ts
 * @brief   Boot for the mini-game platform family — the shipped package's entry
 *          point on WeChat, Douyin, or a vendor a game brought itself.
 *
 *          Everything here is written against the platform seam, never a vendor
 *          global: the display canvas and its size come from the family adapter
 *          (`createScreenCanvas`), the wasm binary through `instantiateWasm`
 *          (where the one genuine per-vendor divergence lives), scenes through
 *          `platformReadTextFile`. So a new vendor boots on this file unchanged
 *          — {@link initWeChatRuntime} is nothing but this function with
 *          WeChat's staged wasm name filled in.
 */

interface MiniGameRuntimeConfig {
    engineFactory: (opts: unknown) => Promise<ESEngineModule>;
    /** Package-relative path of the engine wasm binary. The exporter stages the
     *  runtime under wasm/ and knows which glue it shipped, so it passes the
     *  glue's `.wasm` twin here. */
    engineWasmPath: string;
    sceneNames: string[];
    firstScene: string;
    runtimeConfig?: RuntimeBuildConfig;
    /** The project's runtime tuning (Project Settings → Game → Runtime), applied by `initRuntime` before anything loads. */
    runtime?: RuntimeBuildConfig;
    /** Install physics even when the scene shows no bodies — a project that
     *  spawns them from script (Project Settings → Physics → Enabled). */
    physicsEnabled?: boolean;
    /** The physics world the project declared: gravity, solver, collision matrix.
     *  The FULL config, not a three-field subset: a collision matrix that reached
     *  Play and not a shipped build is a game that only collides in rehearsal. */
    physicsConfig?: Physics2DPluginConfig;
    /** The 3D physics backend the project chose; absent ⇒ Jolt. */
    physics3dBackend?: Physics3DBackend;
    /** The project's 3D world: scene units per metre and gravity (Project Settings → Physics → 3D). Absent ⇒ centimetre units, Earth gravity. */
    physics3dWorld?: Partial<Physics3DWorldConfig>;
    /** Project-declared UI theme; 'light' re-skins ThemeStyle-tagged widgets at boot. */
    uiTheme?: 'dark' | 'light';
    /** Project-declared theme token overrides (partial re-skin over the base). */
    uiThemeOverrides?: ThemeOverrides;
    /** Project-declared mixer state (routing labels only on mini-games — the host
     *  hands out finished players, not a DSP graph). */
    audioConfig?: AudioProjectConfig;
    /** Bitmask of render layers (0..31) that y-sort within the layer (Project Settings → Rendering). */
    ySortLayers?: number;
    /** Bitmask of render layers (0..31) that resolve by real depth (2.5D). */
    depthLayers?: number;
    /** Project color space — 'linear' boots the linear-light pipeline (Project Settings → Rendering). */
    colorSpace?: 'gamma' | 'linear';
    /** Project camera fit (Project Settings → Display) — letterboxes the design resolution
     *  without a UI Canvas; absent = no fit (raw orthoSize). */
    screenFit?: {
        designWidth: number;
        designHeight: number;
        scaleMode: number;
        matchWidthOrHeight: number;
    };
    /** id → emscripten factory (`require('./wasm/<file>.js')`); the generated
     *  game.js supplies exactly the modules the scene needs. Physics + spine
     *  self-gate off these via {@link createMiniGameSideModuleHost}. */
    sideModuleFactories?: MiniGameSideModuleFactories;
    /**
     * Suffix the export staged those binaries under — `.wasm.br` where the
     * vendor's loader takes one and the project asked for it. Declared rather
     * than guessed: the package carries ONE binary per module, and a loader that
     * spelled the suffix itself would name a file the package does not have.
     */
    sideModuleSuffix?: string;
    /**
     * Project-supplied modules (`.esengine/modules/<id>/`) the export staged, so
     * their ids resolve to an artifact name.
     *
     * Separate from the factories above because they answer different questions:
     * a factory is the glue `game.js` already require()'d, this is where the
     * BINARY sits — and a mini-game instantiates from a package path, so without
     * it an acquired module has a factory and nowhere to load from. Built-in ids
     * need no entry; the engine's table already has them.
     */
    sideModules?: Array<{
        id: string;
        file: string;
        globalName?: string;
    }>;
    /**
     * The compiled twins this build produced (docs/REARCH_AOT.md), as the path
     * the export staged them at. A path and never bytes: WXWebAssembly compiles
     * a package file and nothing else, which is also why the seam instantiates.
     */
    aot?: {
        module: string;
        manifest: AotManifest;
    };
    debugChannel?: DebugChannelConfig;
    /** The CDN root remote groups resolve against, and the key an applied update
     *  is stored under — the same field every packaged runtime reads. */
    hotUpdate?: PackagedGameConfig['hotUpdate'];
}
declare function initMiniGameRuntime(config: MiniGameRuntimeConfig): Promise<void>;

export { initMiniGameRuntime };
export type { MiniGameRuntimeConfig };
