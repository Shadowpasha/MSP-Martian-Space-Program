import { MiniGamePlatformAdapter } from '../shared/adapter.js';
import { MiniGameProfile } from '../shared/api.js';
import '../shared/resource.js';
import '../shared/wasm.js';

/**
 * @file    profile.ts
 * @brief   Huawei's quick games as a profile of the mini-game family.
 *
 * Huawei is not in the 快游戏联盟, but its `qg` reads as the family does: the
 * window in logical pixels (「"pixelRatio":3,"screenWidth":360」), a global
 * `WebAssembly` (the IDE's own runtime shim wraps it), and a `require` that gives
 * a file no CommonJS wrapper, which the export's entry handles.
 *
 * UNVERIFIED on a device: all of it. Huawei's loader asks Huawei's servers about
 * a package before it runs one, so nothing has run without a registered app.
 *
 * NOT CLAIMED: sign-in and purchase — `qg.gameLoginWithReal` and
 * `qg.createPurchaseIntent` go through HMS Core with shapes of their own.
 */

declare const huaweiProfile: MiniGameProfile;

/**
 * @file    index.ts
 * @brief   Huawei quick-game platform (a profile of the mini-game family).
 *
 * Adapter, polyfills and install are the family's; Huawei adds nothing, which is
 * the point of the family existing.
 */

declare const huaweiAdapter: MiniGamePlatformAdapter;
/** Initialize the Huawei quick-game platform. */
declare function initHuaweiPlatform(): void;

export { huaweiAdapter, huaweiProfile, initHuaweiPlatform };
