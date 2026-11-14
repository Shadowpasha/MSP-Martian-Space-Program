import { ComponentDef, App, World } from './app.js';
import { Entity } from './wasm.js';

/**
 * @file    gripPose.ts
 * @brief   How a hand is held: a pistol grip, a hammer's handle, a cup, said once and fitting any hand.
 *
 * @details A pose stored as bone rotations belongs to the skeleton it was made on, since the bones of two rigs do not face the same way.
 *          So a GripPose says only what is true of a hand: how far each finger bends, how far it fans out, how far the thumb comes across.
 *          The axes are worked out from each rig's own hand, once, from where its joints stand: which way the palm faces, which way each
 *          finger points. What runs each frame is then a few quaternions a joint, and nothing at all once a hand has settled on a rig no clip moves.
 *
 *          It does not know what is held. Putting the hand on an object is the attachment's business; a holder can ask for the fingers
 *          to close onto the object's grip surfaces, which each finger then does joint by joint, the pose saying how far it may go.
 */

/** How one finger is held. @experimental */
interface GripFinger {
    /** How far it bends, 0 as the rig rests to 1 closed. */
    curl: number;
    /** How far its first joint bends, where that differs from the rest of it: a finger laid along a frame, or hooked. Defaults to `curl`. */
    base?: number;
    /** How far the fingers fan out from one another, -1 to 1. */
    spread?: number;
    /** Each joint's bend, knuckle first, in degrees from where the rig rests: what a hand posed joint by joint keeps. Over `curl` and `base`. */
    bend?: [number, number, number];
    /** How far this finger leans out from the middle of the hand, in degrees: the index and middle toward the thumb, the ring and little finger away. Over `spread`. */
    fan?: number;
}
/** How the thumb is held: as a reach, since where it can rest is somewhere on the other fingers. @experimental */
interface GripThumb {
    /** How far it goes from where it rests to what it reaches for, 0 to 1. */
    opposition: number;
    /** What it reaches for: the middle of the middle finger, as a fist or a handle has it, or the index finger's tip, as a pinch does. Defaults to `fingers`. */
    to?: 'fingers' | 'index';
    /** How far short of them it stops, in lengths of the index finger: what is held between, a grip or a mug. Defaults to 0. */
    gap?: number;
}
/** How a whole hand is held. Nothing in it names a bone, so it fits any rig. @experimental */
interface GripPoseDef {
    thumb: GripThumb;
    index: GripFinger;
    middle: GripFinger;
    ring: GripFinger;
    pinky: GripFinger;
    /** The index finger as `trigger` takes it to 1: pressing, where the finger above is resting. Absent, `trigger` does nothing. */
    trigger?: GripFinger;
}
/** Adds a pose of the game's own, or replaces one by name. @experimental */
declare function registerGripPose(name: string, pose: GripPoseDef): void;
/** The names a `GripPose` component can take. @experimental */
declare function gripPoseNames(): string[];
/** The pose of that name, or undefined. @experimental */
declare function gripPose(name: string): GripPoseDef | undefined;
/** The fields of the `GripPose` component. @experimental */
interface GripPoseData {
    /** The pose each hand takes; empty leaves that hand to whatever else moves it. */
    rightPose: string;
    leftPose: string;
    /** How much of it applies, over what a clip is doing with the fingers. */
    rightWeight: number;
    leftWeight: number;
    /** How far the index finger has gone from resting to pressing. */
    rightTrigger: number;
    leftTrigger: number;
    /** About how long a change of pose takes, in seconds. */
    blendSeconds: number;
    /** The hand joint, by path from this entity. Empty looks for it by name. */
    rightHand: string;
    leftHand: string;
}
/**
 * Holds a rig's hands in a named pose. Goes on the rig's root.
 *
 * @experimental
 */
declare const GripPose: ComponentDef<GripPoseData>;
/**
 * A pose with every finger said joint by joint, in degrees: what an editor starts from when a preset is to be changed one joint at a time. It holds
 * the hand exactly as the preset does.
 *
 * @experimental
 */
declare function gripPoseByJoint(pose: GripPoseDef): GripPoseDef;
/** A pose read from JSON as an editor writes it, any part it leaves out taken as open. Null for text that is not one. @experimental */
declare function gripPoseFromJson(text: string): GripPoseDef | null;
/** What a rig's hand was found to have. @experimental */
interface GripHandStatus {
    /** The joint it took for the hand, or null where none could be found. */
    hand: Entity | null;
    /** How many joints a pose moves on it. */
    joints: number;
    /** The fingers it has no bones for: a pose simply does without them. */
    missing: string[];
    /** The pose it is in. */
    pose: string;
    /** How much of it applies now. */
    weight: number;
    /** The fingers whose bones touch a surface they were closed onto. */
    touching: string[];
}
/** One joint a pose bends, and the axis it bends about in its own frame: a positive bend turns it that way. @experimental */
interface GripJoint {
    finger: string;
    /** 0 the knuckle, 1 the middle joint, 2 the last. */
    joint: number;
    entity: Entity;
    axis: {
        x: number;
        y: number;
        z: number;
    };
    /** The bone it turns, to the next joint or the fingertip, in its own frame: where a handle shows which way a bend moves it. */
    bone: {
        x: number;
        y: number;
        z: number;
    };
}
/** The joints each hand of a rig bends, once the grip-pose system has seen it: what an editor puts a handle on. @experimental */
declare function gripHandJoints(app: App, rig: Entity): {
    right: GripJoint[];
    left: GripJoint[];
} | null;
/** What each hand of a rig with a `GripPose` was found to have, once the system has seen it. @experimental */
declare function gripPoseStatus(app: App, rig: Entity): {
    right: GripHandStatus;
    left: GripHandStatus;
} | null;

/**
 * @file    gripContact.ts
 * @brief   What a held object is to the fingers: simple shapes they close onto, and stop at.
 *
 * @details A mesh is too much to ask of every finger every frame, and the part of an object a hand closes around is nearly always a
 *          handle, a barrel, a ball or a block. So the object says so: a `GripSurface` on it, or on anything under it, is a cylinder,
 *          a capsule, a sphere or a box, sized in its own units as a collider is. Fingers close joint by joint until a bone meets one,
 *          and the thumb's reach is moved out of them. Nothing here needs physics: it is a distance from a point to a shape.
 */

interface Vec3 {
    x: number;
    y: number;
    z: number;
}
/** The shape a grip surface is. @experimental */
declare const GripSurfaceShape: {
    readonly Cylinder: 0;
    readonly Capsule: 1;
    readonly Sphere: 2;
    readonly Box: 3;
};
/** The fields of the `GripSurface` component. @experimental */
interface GripSurfaceData {
    shape: number;
    /** The axis a cylinder or capsule runs along, of the entity's own: 0 X, 1 Y, 2 Z. */
    direction: number;
    /** Its middle, in the entity's own units. */
    center: Vec3;
    /** A cylinder's, capsule's or sphere's radius. */
    radius: number;
    /** A cylinder's or capsule's whole length, ends included. */
    height: number;
    /** A box's size. */
    size: Vec3;
}
/**
 * A shape on a held object that fingers close onto and stop at: a handle, a barrel, a mug's body. Goes on the object or anything under it;
 * a `GripProfile` with `wrap` on closes each hand's fingers onto every one there.
 *
 * @experimental
 */
declare const GripSurface: ComponentDef<GripSurfaceData>;
/**
 * Every grip surface on `object` and under it as lines in the world, where the fingers meet them: what an editor draws. Transforms must be
 * composed.
 * @experimental
 */
declare function gripSurfaceLines(world: World, object: Entity): {
    x: number;
    y: number;
    z: number;
}[][];

/**
 * @file    gripHold.ts
 * @brief   A character holding an object: where the palms go on it, the arms that take them there, and the fingers once there.
 *
 * @details Three parts, each answering one thing. The object's `GripProfile` says where on it a palm sits, for the hand that leads and the one
 *          that supports. The arm is bent to take the palm there. The fingers are a pose blended over what the clip does.
 *
 *          The order is fixed and runs one way, so no hand can move what moves it: the clip's pose, then where the object is (on the leading hand,
 *          or where the game put it), then the supporting hand's anchor read off the object, then that arm, then the fingers of both. The
 *          object never reads the supporting hand. Everything comes from this frame's pose and the game's clock: the same inputs and steps give
 *          the same bones.
 */

interface Quat {
    w: number;
    x: number;
    y: number;
    z: number;
}
/** Where a palm sits on a held object, and how its fingers are held there. @experimental */
interface GripProfileData {
    /** An entity under the object whose place and turn are the leading palm's: its origin the palm's centre, +Z the way the fingers point, +Y the way the palm faces. */
    mainAnchor: Entity;
    /** The same for the supporting hand. None holds the object in one hand. */
    supportAnchor: Entity;
    /** The fingers of each: a pose captured from a hand (registerFingerPose), or a GripPose by name. */
    mainPose: string;
    supportPose: string;
    /** The fingers of each said joint by joint, as JSON of a GripPoseDef (an editor writes it). Over the pose by name where it is set. */
    mainFingers: string;
    supportFingers: string;
    /** The hand the anchors were placed for. Held with the other hand leading, both anchors are mirrored to it. */
    hand: number;
    /** The plane of the object's own that mirrors them: the one square to its X, Y or Z. */
    mirror: number;
    /** Whether the fingers close onto the object's grip surfaces (GripSurface, on it or under it), each stopping where it meets one. */
    wrap: boolean;
}
/** The plane an object's anchors are mirrored in, by the axis square to it. @experimental */
declare const GripMirror: {
    readonly X: 0;
    readonly Y: 1;
    readonly Z: 2;
};
/**
 * How an object is held. Goes on the object; its anchors are entities under it.
 *
 * @experimental
 */
declare const GripProfile: ComponentDef<GripProfileData>;
/** Which hand leads. @experimental */
declare const GripHand: {
    readonly Right: 0;
    readonly Left: 1;
};
/** What places the held object: the leading hand as the clip moves it, or the game (aiming), with the leading arm brought to it. @experimental */
declare const GripPlacement: {
    readonly Hand: 0;
    readonly Object: 1;
};
/** The fields of the `GripHolder` component. @experimental */
interface GripHolderData {
    /** What it holds: an entity with a GripProfile. None holds nothing. */
    held: Entity;
    mainHand: number;
    placement: number;
    /** How much of the hold applies over the clip, 0 to 1; and of the supporting hand's, under that. */
    weight: number;
    supportWeight: number;
    /** About how long taking hold, letting go, or changing what is held takes, in seconds. */
    blendSeconds: number;
    /** The hand joints, by path from this entity. Empty finds them by name. */
    rightHand: string;
    leftHand: string;
}
/**
 * Holds an object in its GripProfile's grip. Goes on the rig's root.
 *
 * @experimental
 */
declare const GripHolder: ComponentDef<GripHolderData>;
/** A pose of the fingers as one rig holds them: each joint's own turn, by its name. @experimental */
interface FingerPoseDef {
    joints: Record<string, Quat>;
}
/** Keeps a finger pose by name, for a GripProfile to name. Replaces one of that name. @experimental */
declare function registerFingerPose(name: string, pose: FingerPoseDef): void;
/** The finger pose of that name, or undefined. @experimental */
declare function fingerPose(name: string): FingerPoseDef | undefined;
/** The turn of every named joint below `hand`, as it stands now: what a pose made by hand, or by a GripPose, is kept as. Plain JSON. @experimental */
declare function captureFingerPose(world: World, hand: Entity): FingerPoseDef;
/** Spherical interpolation, the shorter way: what a weight between a clip and a grip means. */
declare function slerpQuat(a: Quat, b: Quat, t: number): Quat;
/**
 * Every joint a hold turned, and every object it carried, given back as they were before it, and every holder forgotten: an editor leaving its
 * preview, where nothing moves the bones back. What something else has moved since is left as it is. @experimental
 */
declare function releaseGripHolds(app: App): void;
/** What a holder found and is doing. @experimental */
declare function gripHolderStatus(app: App, rig: Entity): {
    right: boolean;
    left: boolean;
    amount: number;
    held: Entity;
    /** How far each palm stops short of its anchor, in world units: 0 where the arm reaches it. */
    short: {
        main: number;
        support: number;
    };
    /** Whether the anchors are mirrored this frame: held by the other hand than they were placed for. */
    mirrored: boolean;
    /** How long the palm is, from the wrist to the middle knuckle, in the hand's own units: what an editor sizes an anchor's marker by. 0 with no hand found. */
    palm: number;
} | null;

export { GripHand, GripHolder, GripMirror, GripPlacement, GripPose, GripProfile, GripSurface, GripSurfaceShape, captureFingerPose, fingerPose, gripHandJoints, gripHolderStatus, gripPose, gripPoseByJoint, gripPoseFromJson, gripPoseNames, gripPoseStatus, gripSurfaceLines, registerFingerPose, registerGripPose, releaseGripHolds, slerpQuat };
export type { FingerPoseDef, GripFinger, GripHandStatus, GripHolderData, GripJoint, GripPoseData, GripPoseDef, GripProfileData, GripSurfaceData, GripThumb };
