import { MiniGamePlatformAdapter } from '../shared/adapter.js';
import { MiniGameProfile } from '../shared/api.js';
import '../shared/resource.js';
import '../shared/wasm.js';

/**
 * @file    profile.ts
 * @brief   Bilibili as a profile of the mini-game platform family.
 *
 * `bl` is WeChat-shaped (miniapp.bilibili.com/small-game-doc: 「bilibili 小游戏
 * runtime 与小游戏兼容」) and needs no override. Its recorder shares only through
 * a native button, which the engine does not draw, so `canShare` answers false.
 *
 * UNVERIFIED on a device: wasm on iOS (the upload list says 「wasm 仅支持
 * Android」, the config table recommends iOS high-performance mode for it), and
 * the standard `WebAssembly` loader — no page names one.
 *
 * NOT CLAIMED: `pay`. `bl.requestRecharge` takes an order your server creates.
 */

declare const bilibiliProfile: MiniGameProfile;

/**
 * @file    index.ts
 * @brief   Bilibili MiniGame platform (a profile of the mini-game family).
 *
 * Adapter, polyfills and install are the family's; Bilibili adds nothing, which is
 * the point of the family existing.
 */

declare const bilibiliAdapter: MiniGamePlatformAdapter;
/** Initialize the Bilibili platform. */
declare function initBilibiliPlatform(): void;

export { bilibiliAdapter, bilibiliProfile, initBilibiliPlatform };
