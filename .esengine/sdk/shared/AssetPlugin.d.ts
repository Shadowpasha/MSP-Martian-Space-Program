import { Plugin, App, Assets as Assets$1 } from './app.js';
import { ResourceDef } from './resource.js';

/**
 * The asset loader a system receives from `Res(Assets)`.
 *
 * `@beta`, and the evidence says so: of its members the certified corpus calls
 * four, and a third of the rest is the host wiring a runtime in — resolvers,
 * registries, the manifest, device-loss recovery — which is the embedding contract
 * rather than anything a game writes.
 *
 * @beta
 */
type AssetsData = Assets$1;
/**
 * The asset loader, as a resource. Rarely the door a game uses: scenes preload
 * what they reference and components resolve their own assets, so this is for the
 * cases that outlive a scene — hot updates, groups loaded on demand.
 *
 * @beta
 */
declare const Assets: ResourceDef<Assets$1>;
declare class AssetPlugin implements Plugin {
    name: string;
    private readonly states_;
    private latestState_;
    build(app: App): void;
    /** Release both the default loader and any runtime replacement owned by this App. */
    cleanup(app?: App): void;
    /**
     * Recovers the renderer after a device loss, which nothing did: the path
     * existed end to end with no caller but a test probe, so a shipped game that
     * lost its GPU stayed lost. Timed off UNSCALED delta — a paused game still
     * has to come back — and backed off, since each attempt re-fetches content.
     */
    private driveDeviceRecovery_;
}
declare const assetPlugin: AssetPlugin;

export { AssetPlugin, Assets, assetPlugin };
export type { AssetsData };
