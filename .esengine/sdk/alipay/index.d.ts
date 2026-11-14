import { MiniGamePlatformAdapter } from '../shared/adapter.js';
import { MiniGameProfile } from '../shared/api.js';
import '../shared/resource.js';
import '../shared/wasm.js';

/**
 * @file    profile.ts
 * @brief   Alipay as a profile of the mini-game family.
 *
 * `my` has the family's shape under other names (opendocs.alipay.com/mini-game),
 * so the profile hands the family a view of it in WeChat's words:
 * `createRewardedAd` for a rewarded unit, `getAuthCode` for sign-in (its
 * `authCode` is the one-time code), and share through a card the host reads off
 * the `my.onShareAppMessage` PROPERTY when `my.showSharePanel()` opens.
 * WebAssembly is `MYWebAssembly`, which takes an absolute package path.
 *
 * UNVERIFIED on a device: all of it. iOS runs MYWebAssembly only in
 * high-performance mode (「暂不支持 iOS 普通模式」), which the export turns on.
 *
 * NOT CLAIMED: `pay` — `my.requestGamePayment` sells on Android and Harmony only,
 * keyed by a `customId` the engine's request does not carry.
 */

declare const alipayProfile: MiniGameProfile;

/**
 * @file    index.ts
 * @brief   Alipay MiniGame platform (a profile of the mini-game family).
 *
 * Adapter, polyfills and install are the family's; Alipay adds only its profile, which is
 * the point of the family existing.
 */

declare const alipayAdapter: MiniGamePlatformAdapter;
/** Initialize the Alipay platform. */
declare function initAlipayPlatform(): void;

export { alipayAdapter, alipayProfile, initAlipayPlatform };
