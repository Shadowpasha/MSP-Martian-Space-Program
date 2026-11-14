import { Entity } from './wasm.js';
import { ComponentDef, Plugin, App } from './app.js';

/** A bone: an entity whose Transform is its joint, reaching `length` along its own +x. @experimental */
interface Bone2DData {
    length: number;
}
/** @experimental */
declare const Bone2D: ComponentDef<Bone2DData>;
/** @experimental */
interface IK2DData {
    /** What the end of this bone reaches for. */
    target: Entity;
    /** Bones bent, this one and those above it. */
    chainLength: number;
    /** Two bones: which way the middle joint bends, 1 counter-clockwise or -1. */
    bend: number;
    /** 0 leaves the animation alone, 1 reaches the target. */
    weight: number;
    /** Also turn this bone to the target's rotation: a foot flat on a slope, a hand holding what it holds. */
    matchTargetRotation: boolean;
    enabled: boolean;
}
/** @experimental */
declare const IK2D: ComponentDef<IK2DData>;
/** What a {@link BoneConstraint2D} does. @experimental */
declare const BoneConstraintKind: {
    /** Keep the bone's local rotation between `min` and `max`. An IK chain through this bone keeps to them too. */
    readonly LimitRotation: 0;
    /** Take `source`'s world rotation, plus `offset`. */
    readonly CopyRotation: 1;
    /** Stand on `source`'s world position. */
    readonly CopyPosition: 2;
    /** Point +x at `source`, plus `offset`. */
    readonly LookAt: 3;
};
/** @experimental */
interface BoneConstraint2DData {
    kind: number;
    source: Entity;
    /** LimitRotation: degrees of local rotation. */
    min: number;
    max: number;
    /** CopyRotation and LookAt: degrees added on top. */
    offset: number;
    weight: number;
    enabled: boolean;
}
/** @experimental */
declare const BoneConstraint2D: ComponentDef<BoneConstraint2DData>;
/** Runs {@link IK2D} and {@link BoneConstraint2D} on a running game. @experimental */
declare class Rig2DPlugin implements Plugin {
    name: string;
    readonly activeWhen: (ComponentDef<IK2DData> | ComponentDef<BoneConstraint2DData>)[];
    build(app: App): void;
}

export { Bone2D, BoneConstraint2D, BoneConstraintKind, IK2D, Rig2DPlugin };
export type { Bone2DData, BoneConstraint2DData, IK2DData };
