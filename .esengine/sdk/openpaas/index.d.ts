import { MiniGameGlobal, MiniGameProfile } from '../shared/api.js';
import { WasmInstantiateResult } from '../shared/resource.js';
import '../shared/wasm.js';

/** The documented sud surface, before bridging standard Web APIs into the family. */
type OpenPaaSHost = Pick<MiniGameGlobal, 'createCanvas' | 'createImage' | 'getFileSystemManager' | 'createInnerAudioContext' | 'getSystemInfoSync' | 'onTouchStart' | 'onTouchMove' | 'onTouchEnd' | 'offTouchStart' | 'offTouchMove' | 'offTouchEnd'> & Partial<Pick<MiniGameGlobal, 'env' | 'onTouchCancel' | 'offTouchCancel' | 'onShow' | 'offShow' | 'onHide' | 'offHide' | 'onError' | 'offError' | 'onWindowResize' | 'showLoading' | 'hideLoading'>>;
/** Injectable host dependencies; importing the SDK does not touch native globals. */
interface OpenPaaSEnvironment {
    sud: OpenPaaSHost;
    localStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'key' | 'length'>;
    XMLHttpRequest: typeof XMLHttpRequest;
    WebSocket: typeof WebSocket;
    WebAssembly: {
        instantiateFromFile?(path: string, imports: WebAssembly.Imports): Promise<WasmInstantiateResult>;
    };
}
/** Create a SUD OpenPaaS profile over native APIs or a headless contract fixture. */
declare function createOpenPaaSProfile(environment: OpenPaaSEnvironment): MiniGameProfile;
/** Lazy: safe to bundle on a desktop where `sud` is absent. */
declare const openpaasProfile: MiniGameProfile;

export { createOpenPaaSProfile, openpaasProfile };
export type { OpenPaaSEnvironment, OpenPaaSHost };
