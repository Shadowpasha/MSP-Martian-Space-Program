import { ComponentDef, Plugin, App } from '../shared/app.js';
import { Vec3 } from '../shared/wasm.js';
import '../shared/resource.js';

/** An authored visual gate on a subtree. Cameras, physics and gameplay stay active. */
declare const NodeVisibility: ComponentDef<{
    visible: boolean;
}>;

/** Imported world-space particles: geometry follows Transform, lengths and forces use model units here. */
declare const ParticleModelUnits: ComponentDef<{
    startSizeMin: number;
    startSizeMax: number;
    endSizeMin: number;
    endSizeMax: number;
    speedMin: number;
    speedMax: number;
    gravity: Vec3;
}>;

declare class ImportedScenePlugin implements Plugin {
    name: string;
    private release_;
    build(app: App): void;
    cleanup(): void;
}

export { ImportedScenePlugin, NodeVisibility, ParticleModelUnits };
