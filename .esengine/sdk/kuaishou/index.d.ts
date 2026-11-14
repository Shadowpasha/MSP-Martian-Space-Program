import { MiniGamePlatformAdapter } from '../shared/adapter.js';
import { MiniGameProfile } from '../shared/api.js';
import '../shared/resource.js';
import '../shared/wasm.js';

/**
 * @file    profile.ts
 * @brief   Kuaishou as a profile of the mini-game platform family.
 *
 * `ks` answers the family's shape — fs, canvas, subpackages, ads, login and a
 * WeChat-shaped recorder (open.kuaishou.com/miniGameDocs). Two facts differ:
 * a recording is 3–300 s (「录制时间太短（>=3s)」「录制时间太长(<=300s)」), and
 * the recorder publishes through its own `publishVideo`, which the family
 * recorder reads off the host.
 *
 * UNVERIFIED on a device: that `WebAssembly` is the standard global here (the
 * docs name no host loader), and that WebGL2 is available — the docs call it
 * beta, and the engine renders on nothing less.
 *
 * NOT CLAIMED: `pay`. Kuaishou's `ks.requestGamePayment` takes an order signed
 * by the game's server (`sign`, `goods_name`, `third_party_trade_no`), a shape
 * PlatformPaymentRequest does not carry, so purchase reports itself unavailable.
 */

declare const kuaishouProfile: MiniGameProfile;

/**
 * @file    index.ts
 * @brief   Kuaishou MiniGame platform (a profile of the mini-game family).
 *
 * Adapter, polyfills and install are the family's; Kuaishou adds nothing, which is
 * the point of the family existing.
 */

declare const kuaishouAdapter: MiniGamePlatformAdapter;
/** Initialize the Kuaishou platform. */
declare function initKuaishouPlatform(): void;

export { initKuaishouPlatform, kuaishouAdapter, kuaishouProfile };
