import { Entity } from './wasm.js';
import { InputState, World, CommandsInstance, AnyComponentDef, ComponentData } from './app.js';
import { Blackboard, AiRegistry, AiAction, AiActionSpec, AiCondition, AiValueSpec } from './registry.js';

interface GraphTransition {
    to: string;
}
/** A flattened transition edge, for the graph canvas. */
interface GraphEdge<T extends GraphTransition> {
    /** Stable id `from->to#index`. */
    id: string;
    from: string;
    to: string;
    /** Index of this transition within `from`'s transition list. */
    index: number;
    transition: T;
}

/**
 * @file    AiContext.ts
 * @brief   The concrete leaf context + the shared action/condition registry.
 *
 * AiContext is a BehaviorContext superset (adds the blackboard): writing an FSM
 * action, a BT leaf or a script-graph node is the same programming model as a
 * `defineBehavior.update` — same entity/world/commands/input/time access, plus
 * `blackboard` for AI data flow. This is the engine layer, so it may reference
 * World/Commands; the FSM/BT cores stay generic and wasm-free.
 *
 * `input` arrives through {@link noInput} when a caller has none — a test, or a
 * host with no devices. Nothing pressed is the truthful answer there, and it
 * keeps the context's shape from being conditional.
 */

interface AiContext {
    /** The agent entity this action/condition runs for. */
    readonly entity: Entity;
    /** Frame delta in seconds. */
    readonly dt: number;
    /** Runtime input — the same state `defineBehavior` reads. A leaf that cannot
     *  see the keyboard is a leaf no game logic can be written in. */
    readonly input: InputState;
    /** This agent's blackboard — the AI data plane. */
    readonly blackboard: Blackboard;
    /** The world, for cross-entity access. */
    readonly world: World;
    /** Deferred structural ops (spawn / despawn), safe mid-iteration. */
    readonly commands: CommandsInstance;
    /** Read another component on THIS entity. */
    get<C extends AnyComponentDef>(component: C): ComponentData<C>;
    /** Write another component on THIS entity. */
    set<C extends AnyComponentDef>(component: C, data: ComponentData<C>): void;
    /** Whether THIS entity has `component`. */
    has(component: AnyComponentDef): boolean;
}
/**
 * The process-wide AI registry. Actions/conditions are code registrations
 * (stable like component defs), so a single shared instance is correct across
 * App instances; `.esfsm`/`.esbt` data references resolve against it.
 */
declare const aiRegistry: AiRegistry<AiContext>;
/** An input state with nothing pressed — what a caller with no devices supplies. */
declare const noInput: () => InputState;
/**
 * Register a named action referenced by FSM state hooks / BT leaves / event
 * rows — as a bare function, or with declared parameters, which is what turns
 * an editor text box into typed controls.
 */
declare function registerAction(name: string, fn: AiAction<AiContext> | AiActionSpec<AiContext>): void;
/** Register a named condition referenced by FSM transitions / BT conditions. */
declare function registerCondition(name: string, fn: AiCondition<AiContext>): void;
/**
 * Register a named VALUE — a pure name that answers a question, which a script
 * graph reads by wiring its declared outputs. Same store as the actions, so it
 * shows up in the same palettes.
 */
declare function registerValue(name: string, spec: AiValueSpec<AiContext>): void;

export { aiRegistry, noInput, registerAction, registerCondition, registerValue };
export type { AiContext, GraphEdge };
