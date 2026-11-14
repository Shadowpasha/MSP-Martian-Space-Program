export { Animator, AnimatorController, AnimatorControllerAPI, AnimatorControllerDef, AnimatorData } from '../shared/Animator.js';
import { Plugin, App } from '../shared/app.js';
export { GripHolder, GripPose, GripProfile, GripSurface } from '../shared/gripHold.js';
import '../shared/wasm.js';
import '../shared/resource.js';
import '../shared/motion.js';

/**
 * @file    SkeletalAnimationPlugin.ts
 * @brief   The animator graph (states, blends, IK, avatars, root motion) and grip poses.
 *
 * Split from AnimationPlugin because a game with no skeleton to drive — a 2D one,
 * a UI one — carried ~65KB of it all the same: tweens and sprite clips are the
 * part every package uses, this is the part a rigged character does. It installs
 * where the content uses it (see `skeletalAnimationSupport.ts`); the full entry
 * installs it beside everything else.
 *
 * Builds right after `animation` (PLUGIN_BUILD_ORDER) because spine, 3D physics,
 * the timeline and gameplay all look for the AnimatorController resource this
 * inserts and degrade without it.
 */

declare class SkeletalAnimationPlugin implements Plugin {
    name: string;
    private readonly despawnCleanups_;
    private latestDespawnCleanup_;
    build(app: App): void;
    cleanup(app?: App): void;
}
declare const skeletalAnimationPlugin: SkeletalAnimationPlugin;

export { SkeletalAnimationPlugin, skeletalAnimationPlugin };
