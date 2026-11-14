import { MiniGamePlatformAdapter } from '../shared/adapter.js';
import { MiniGameProfile } from '../shared/api.js';
import '../shared/resource.js';
import '../shared/wasm.js';

/**
 * @file    profile.ts
 * @brief   Douyin as a profile of the mini-game platform family.
 *
 * Three facts and no override: fs, fetch, canvas, image, input, storage,
 * subpackages, audio, video and sockets are the family's, written once in
 * ../minigame/ against the normalized host global, and `tt` answers the same
 * shape `wx` does.
 *
 * UNVERIFIED on a device: that Douyin instantiates wasm through the standard
 * `WebAssembly.instantiate` the family falls back to, rather than a host call of
 * its own the way WeChat's WXWebAssembly does. If it does not, this profile
 * gains an `instantiateWasm` exactly as WeChat's has one. RM-032's acceptance is
 * a real device for that reason.
 *
 * NOT CLAIMED: `pay`. The family's payment is WeChat's `requestMidasPayment`
 * with WeChat's rules, and Douyin's call is its own. There is no source in this
 * checkout for its name or its fields, and a payment path invented from a guess
 * charges a player through a call that does not exist. So purchase reports
 * itself unavailable here — the profile now has the slot to fill once a vendor
 * doc or a device answers.
 */

declare const douyinProfile: MiniGameProfile;

/**
 * @file    index.ts
 * @brief   Douyin MiniGame platform (a profile of the mini-game family).
 *
 * Adapter, polyfills and install are the family's; Douyin adds nothing, which is
 * the point of the family existing.
 */

declare const douyinAdapter: MiniGamePlatformAdapter;
/** Initialize the Douyin platform. Call it at the entry point (see index.douyin.ts). */
declare function initDouyinPlatform(): void;

export { douyinAdapter, douyinProfile, initDouyinPlatform };
