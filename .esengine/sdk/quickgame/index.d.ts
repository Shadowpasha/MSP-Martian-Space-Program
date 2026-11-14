import { MiniGamePlatformAdapter } from '../shared/adapter.js';
import { MiniGameProfile } from '../shared/api.js';
import '../shared/resource.js';
import '../shared/wasm.js';

/**
 * @file    profile.ts
 * @brief   The 快游戏联盟 hosts (vivo, OPPO, Xiaomi, Honor) as a profile of the
 *          mini-game family.
 *
 * `qg` is WeChat-shaped for what the family reads. What differs, each measured on
 * vivo's engine (1203) in an emulator:
 *
 * - `windowWidth`/`windowHeight` are physical pixels (2340 beside a pixelRatio of
 *   2.75), so the screen is sized without multiplying again.
 * - `WebAssembly` is exposed by `qg.setWasmTaskCompile(true)` (OPPO documents
 *   it: 「开启 wasm 开关,会全局暴露`WebAssembly`变量」); it is called before the
 *   engine instantiates.
 *
 * The engine binary itself differs too (no SIMD, no BigInt i64 — V8 8.3); that is
 * the export's `quickgame` build, not something a profile can choose.
 *
 * UNVERIFIED: OPPO, Xiaomi and Honor on a device. OPPO grants WebGL2 only to a
 * game that applied for it.
 */

declare const quickgameProfile: MiniGameProfile;

/**
 * @file    index.ts
 * @brief   快游戏联盟 MiniGame platform (a profile of the mini-game family).
 *
 * Adapter, polyfills and install are the family's; the quick-game hosts add nothing, which is
 * the point of the family existing.
 */

declare const quickgameAdapter: MiniGamePlatformAdapter;
/** Initialize the quick-game platform. */
declare function initQuickGamePlatform(): void;

export { initQuickGamePlatform, quickgameAdapter, quickgameProfile };
