/**
 * @file    builtinShaders.ts
 * @brief   Built-in .esshader templates — the engine's stock material starting points.
 * @details Each template carries a `#pragma fragment wgsl` twin so it compiles
 *          on the WebGPU backend. Twins run under the canonical fragment-only
 *          contract: `fs_main(v : VSOut)` with v.v_color / v.v_texCoord
 *          (+ v.v_worldPos on Lit), the batch textures as t0..t7 / s0..s7,
 *          params as mc.<name>, texture params as <name> + <name>_s, and the
 *          frame clock as tc.u_time / tc.u_viewport.
 */
interface BuiltinShaderTemplate {
    id: string;
    /** Menu / picker label, e.g. "Lit". */
    label: string;
    description: string;
    source: string;
    /** Initial .esmaterial `properties` for a material born from this template — DERIVED
     *  from `source`, never written down beside it (see {@link templateDefaults}). */
    defaults: Record<string, unknown>;
}
declare const BUILTIN_SHADER_TEMPLATES: readonly BuiltinShaderTemplate[];
declare function builtinShaderTemplate(id: string): BuiltinShaderTemplate | undefined;

export { BUILTIN_SHADER_TEMPLATES, builtinShaderTemplate };
export type { BuiltinShaderTemplate };
