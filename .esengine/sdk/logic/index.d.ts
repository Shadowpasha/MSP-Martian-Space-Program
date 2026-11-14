import { AiParamDef, AiOutputDef, Blackboard, AiRegistry, AiActionInput } from '../shared/registry.js';
import { PreparedPrefab, World, ComponentDef, Plugin, App, AnyComponentDef, ComponentData, SystemTouches, CommandsInstance, InputState } from '../shared/app.js';
import { Entity } from '../shared/wasm.js';
import { ResourceDef } from '../shared/resource.js';

/**
 * @file    types.ts
 * @brief   `.esgraph` — the authored shape of a script graph.
 *
 * A graph is nodes, wires, and declared variables. It is the RUNTIME definition:
 * nothing compiles it, so the graph the editor runs and the graph the package
 * ships are the same bytes (the `.esbt` contract).
 *
 * What a node's PORTS are is deliberately absent from the file. A port list
 * comes from the node's kind (the built-in table), from what a `call`'s name
 * declared to the registry, or from what a called GRAPH declares — one author,
 * two readers (the interpreter and the canvas). Written into the file it would
 * be a second author, and an old file would keep drawing a port its verb no
 * longer has.
 */
/** What a wire carries. `exec` is the control wire; the rest are data. */
type ScriptValueType = 'exec' | 'bool' | 'number' | 'string' | 'entity' | 'any';
/** A value flowing through a data wire, and the form a literal is stored in. */
type ScriptValue = boolean | number | string | null;
/** One port on a node. */
interface ScriptPort {
    /** Port id, unique within its node and side. Also the fallback label. */
    name: string;
    type: ScriptValueType;
    label?: string;
}
interface ScriptGraphNode {
    id: string;
    /** Built-in node kind (`flow.branch`, `event.start`, …) or `'call'`. */
    kind: string;
    /** For `kind: 'call'` — the registry name this node runs. */
    ref?: string;
    /**
     * Values for input ports nothing is wired into, plus the literals that SHAPE
     * a node (an `event.on` type, a `flow.sequence` pin count). Keyed by port id.
     */
    literals?: Record<string, ScriptValue>;
    /** Editor canvas position. The interpreter ignores it. */
    x?: number;
    y?: number;
}
interface ScriptGraphEdge {
    id: string;
    from: string;
    /** Output port id on `from`. */
    fromPort: string;
    to: string;
    /** Input port id on `to`. */
    toPort: string;
}
/**
 * One port of a callable graph — its side of the signature. The node calling it
 * reads this, which is why a graph's ports live on the graph and not on the
 * call: change the signature and every caller is redrawn from it.
 */
interface ScriptGraphPort {
    name: string;
    type: Exclude<ScriptValueType, 'exec'>;
    label?: string;
    /** What an unwired input carries into the call. */
    default?: ScriptValue;
}
/** A graph-local variable: declared by the asset, valued per entity. */
interface ScriptGraphVariable {
    name: string;
    type: Exclude<ScriptValueType, 'exec' | 'any'>;
    default?: ScriptValue;
}
interface ScriptGraph {
    version: string;
    name?: string;
    /**
     * Declaring either side makes this graph CALLABLE: a `graph.call` elsewhere
     * gets these as its pins. A graph with neither is only ever ticked by the
     * occasions its entry nodes name.
     */
    inputs?: ScriptGraphPort[];
    outputs?: ScriptGraphPort[];
    variables?: ScriptGraphVariable[];
    nodes: ScriptGraphNode[];
    edges: ScriptGraphEdge[];
}
declare const SCRIPT_GRAPH_VERSION = "1.0";
/** An empty graph, the shape "New Script Graph" writes. */
declare function emptyScriptGraph(name?: string): ScriptGraph;
/**
 * Whether a wire from `from` to `to` is legal. ONE answer, two askers: the
 * editor refuses the drag, the loader reports the file. `any` accepts and is
 * accepted; `exec` only ever meets `exec`.
 */
declare function canConnect(from: ScriptValueType, to: ScriptValueType): boolean;
/** Coerce a value to the port type reading it — the runtime half of {@link canConnect}. */
declare function coerceValue(value: ScriptValue, type: ScriptValueType): ScriptValue;
/** The value a port of `type` holds before anything writes one. */
declare function defaultForType(type: ScriptValueType): ScriptValue;

/**
 * @file    nodes.ts
 * @brief   What a node's pins are — the one answer the interpreter and the
 *          canvas both read.
 *
 * Only the kinds the registry CANNOT express live here: entries (the interpreter
 * ignites them), flow (they steer the exec wire), variables and literals (they
 * read the interpreter's own state). Everything else — maths, comparisons,
 * reading a component, spawning — is an ordinary registered name, so a project
 * or a plugin extends the vocabulary exactly the way the engine does. There is
 * no built-in privilege to reach for.
 */

/**
 * The registry, narrowed to what a shape needs. An `AiRegistry` satisfies it
 * structurally; so does the editor's catalog, which knows the names the open
 * PROJECT registered — names the editor's own realm never executes and so could
 * never have in a live registry.
 */
interface ScriptVerbCatalog {
    hasAction(name: string): boolean;
    getActionParams(name: string): readonly AiParamDef[];
    getActionOutputs(name: string): readonly AiOutputDef[];
    isActionPure(name: string): boolean;
    /**
     * The signature a callable graph declares, or null where this build has no
     * such graph. A called graph's pins come from the GRAPH, so changing its
     * signature redraws every caller rather than leaving them on a stale one.
     */
    graphSignature(ref: string): ScriptGraphSignature | null;
}
/** What a callable graph takes and hands back. */
interface ScriptGraphSignature {
    inputs: readonly ScriptGraphPort[];
    outputs: readonly ScriptGraphPort[];
}
/**
 * Whether a call can ENTER this graph: it carries the node a call arrives at.
 * Declaring ports alone does not — a signature with nothing behind it is a
 * graph a caller would fall straight through.
 */
declare function isCallableGraph(graph: ScriptGraph): boolean;
/**
 * A catalog over a verb registry plus whatever graph signatures the caller
 * knows. Two sources because they have two owners: a verb is a process-wide
 * registration, a graph is an asset of the realm that loaded it.
 */
declare function scriptCatalog(verbs: Omit<ScriptVerbCatalog, 'graphSignature'>, signatures?: ReadonlyMap<string, ScriptGraphSignature>): ScriptVerbCatalog;
/** A graph's own signature, as a catalog answers it. */
declare function signatureOf(graph: ScriptGraph): ScriptGraphSignature;
/** A node's pins, plus the two facts the interpreter needs to place it. */
interface ScriptNodeShape {
    /** Whether an exec wire can arrive. Pure nodes have none. */
    execIn: boolean;
    /** Exec output pins, in display order. */
    execOut: readonly string[];
    inputs: readonly ScriptPort[];
    outputs: readonly ScriptPort[];
    /** No side effects: may be pulled on demand, in any order. */
    pure: boolean;
    /** Set on the nodes a tick ignites, saying which occasion lights them. */
    entry?: 'start' | 'update' | 'destroy' | 'event';
}
/** Default exec pin name — the single "and then" every flow-through node has. */
declare const THEN = "then";
/**
 * How many exec pins a `flow.sequence` shows. Authored, not inferred from the
 * wires: a pin the author added and has not wired yet still has to be there to
 * wire INTO, and inferring the count from edges would delete it on reload.
 */
declare function sequenceCount(node: ScriptGraphNode): number;
/**
 * The pins of one node, or null when nothing knows this kind — an unknown node
 * is reported, never treated as a no-op, because a graph missing a verb is a
 * graph that does something else.
 */
declare function describeNode(node: ScriptGraphNode, graph: ScriptGraph, catalog: ScriptVerbCatalog): ScriptNodeShape | null;
/**
 * Every built-in kind, for the editor palette. `call` is not one — it is a
 * name; nor is `graph.call`, which is a GRAPH, listed the way the verbs are.
 */
declare const BUILTIN_NODE_KINDS: readonly string[];
/** The prefab an `entity.spawn` node names, or '' — read by the compile step
 *  (to say what to prepare) and by the loader (to prepare it). One reader of
 *  the literal, so the two cannot disagree about which refs a graph needs. */
declare function spawnPrefabRef(node: ScriptGraphNode): string;
/** Every prefab a graph may spawn, deduplicated, in document order. */
declare function scriptGraphPrefabRefs(graph: ScriptGraph): string[];
/** The graph a `graph.call` node calls, or '' — the same single-reader rule
 *  {@link spawnPrefabRef} keeps, so the loader and the compile step cannot
 *  disagree about which graphs this one needs. */
declare function graphCallRef(node: ScriptGraphNode): string;
/** Every graph this one may call, deduplicated, in document order. */
declare function scriptGraphCallRefs(graph: ScriptGraph): string[];

/**
 * @file    ScriptGraphRunner.ts
 * @brief   The script-graph interpreter — pure, generic, unit-testable.
 *
 * `compileScriptGraph` indexes a graph once per loaded asset; `stepScriptGraph`
 * advances one instance one tick. Semantics:
 *
 *   · EXEC is pushed. An occasion lights an entry node and the white wire is
 *     walked depth-first, so a `flow.sequence` finishes pin 0's whole chain
 *     before pin 1 starts — the order the picture promises.
 *   · DATA is pulled. An input's value is fetched when the node reading it runs,
 *     by evaluating backwards up the wire.
 *   · A pure node is evaluated AT MOST ONCE per activation of the node reading
 *     it, so one wire feeding two pins of the same node is one value. Across
 *     activations it re-evaluates, which is what makes a `flow.while` condition
 *     able to become false.
 *   · Every activation costs a step, and an instance has a budget per tick. A
 *     graph that loops forever stops, names the node, and stays stopped — the
 *     editor runs the play realm in its own process, so "the author will not
 *     draw that" is not a safety story.
 *   · A `graph.call` runs another graph to completion, synchronously, inside
 *     the caller's step. The callee keeps its OWN frame per call site, spends
 *     the CALLER's budget, and is bounded by a call depth — a graph reached
 *     through a cycle stops rather than taking the stack down with it.
 */

/** Node activations one instance may spend in one tick before it is stopped. */
declare const DEFAULT_STEP_BUDGET = 4096;
/** How deep `graph.call` may nest. A JS stack frame per level, so this is what
 *  stops a graph that calls itself before the engine's own stack does. */
declare const MAX_CALL_DEPTH = 16;
/** A graph indexed for ticking: pins resolved, wires turned into lookups. */
interface CompiledScriptGraph {
    graph: ScriptGraph;
    nodes: Map<string, ScriptGraphNode>;
    shapes: Map<string, ScriptNodeShape>;
    /** `${nodeId}\0${execPin}` → the node that pin runs. */
    execTargets: Map<string, string>;
    /** `${nodeId}\0${inputPort}` → the output feeding it. */
    dataSources: Map<string, {
        node: string;
        port: string;
    }>;
    /** Nodes an input wire reaches for and this build could not make. */
    starvedInputs: Map<string, string[]>;
    starts: string[];
    updates: string[];
    destroys: string[];
    /** Event type → the `event.on` nodes listening for it. */
    events: Map<string, string[]>;
    /** What the graph asked for and this build could not give it. */
    problems: string[];
    /**
     * The prefabs its `entity.spawn` nodes may spawn, by ref. Filled by whoever
     * LOADED the graph — spawning is synchronous, so the loading happened then
     * or it did not happen at all.
     */
    prefabs: Map<string, PreparedPrefab>;
    /** The node a call arrives at, when this graph is one a call can enter. */
    inputNode?: string;
    /** The node a call returns from, where the graph names one. */
    outputNode?: string;
}
declare function compileScriptGraph(graph: ScriptGraph, catalog: ScriptVerbCatalog): CompiledScriptGraph;
/**
 * One GRAPH's state inside one instance. The entity's own graph has one; so does
 * each `graph.call` site, for the graph it calls — which is what makes a called
 * graph's variables local to the call rather than shared with its caller.
 */
interface ScriptFrame {
    /** Graph variables, by name. */
    vars: Map<string, ScriptValue>;
    /** `flow.delay` node id → seconds still to wait. */
    timers: Map<string, number>;
    /** What an impure node last handed back, so a wire off it reads that. */
    produced: Map<string, Record<string, ScriptValue>>;
    /** `graph.call` node id → the frame of the graph that call enters. */
    calls: Map<string, ScriptFrame>;
}
/** Per-instance runtime. The component stays serializable; this lives beside it. */
interface ScriptRunState extends ScriptFrame {
    started: boolean;
    /** Set when the budget blew: the instance is done until something reloads it. */
    halted: boolean;
    /** Problems already reported, so a bad graph does not reprint every frame. */
    reported: Set<string>;
}
declare function createScriptRunState(compiled: CompiledScriptGraph): ScriptRunState;
/** Everything one tick needs that is not the graph or the instance. */
interface ScriptTickContext<Ctx> {
    ctx: Ctx;
    bb: Blackboard;
    registry: AiRegistry<Ctx>;
    dt: number;
    /** Reported once per distinct message per instance. */
    onProblem?: (message: string) => void;
    budget?: number;
    /**
     * The world `entity.spawn` spawns into. The runner is generic over its
     * context so the core stays wasm-free; whoever knows the world hands it in.
     */
    world?: World;
    /**
     * The graph a `graph.call` names, resolved when the call runs rather than
     * held on the compiled caller: a graph belongs to the realm that loaded it,
     * and reloading one must not oblige every graph calling it to rebuild.
     */
    resolveGraph?: (ref: string) => CompiledScriptGraph | undefined;
}
/**
 * Advance one instance one tick: expire delays, then light `event.update`.
 * `event.start` fires on the first tick, before update, so a graph can seed its
 * variables in the same frame it first runs.
 */
declare function stepScriptGraph<Ctx>(compiled: CompiledScriptGraph, run: ScriptRunState, tick: ScriptTickContext<Ctx>): void;
/** Run the `event.destroy` entries — the instance's last tick. */
declare function destroyScriptGraph<Ctx>(compiled: CompiledScriptGraph, run: ScriptRunState, tick: ScriptTickContext<Ctx>): void;
/**
 * Light the `event.on` nodes listening for `type`. `target` and `other` are
 * published on the entry's ports, so a wire can carry who the event came from
 * and who else it named.
 */
declare function fireScriptGraphEvent<Ctx>(compiled: CompiledScriptGraph, run: ScriptRunState, tick: ScriptTickContext<Ctx>, type: string, target: number, other?: number): void;

interface ScriptGraphAgentData {
    /** Key of the graph to run: a `registerScriptGraph` name or a `.esgraph` path. */
    graph: string;
}
declare const ScriptGraphAgent: ComponentDef<ScriptGraphAgentData>;
/**
 * Compile against the shared registry, having first put the engine's own verbs
 * in it: the compile happens at asset prepare, which can precede any plugin's
 * build. `signatures` is what the graphs THIS one calls declare — a verb is a
 * process-wide registration, a called graph an asset of the realm.
 */
declare function compileAgainstRegistry(graph: ScriptGraph, signatures?: ReadonlyMap<string, ScriptGraphSignature>): CompiledScriptGraph;
/** Register (compile) a graph under `key` — the code half of the registry. */
declare function registerScriptGraph(key: string, graph: ScriptGraph): CompiledScriptGraph;
declare function getScriptGraph(key: string): CompiledScriptGraph | undefined;
/** Every registered graph — what the schedule reads to learn this system's reach. */
declare function allScriptGraphs(): Iterable<CompiledScriptGraph>;
/** Drop all registered graphs (tests / hot-reload). */
declare function clearScriptGraphStore(): void;

/**
 * @file    worldView.ts
 * @brief   What the systems that run AUTHORED graphs actually touch.
 *
 * An FSM system's reach is not a property of the system — it is the union of the
 * leaves the loaded graphs name. That is unknowable when the system is defined
 * and perfectly knowable once the data is there, which is why the schedule reads
 * these through a function rather than a literal.
 *
 * One unknown leaf makes the whole claim opaque, and that is the point: a union
 * that quietly drops the leaf it could not read would be a claim the scheduler
 * trusts and the frame disproves.
 */

/** An authored leaf reference: the registry name plus whatever input it carries. */
interface LeafRef {
    kind: 'action' | 'condition';
    name: string;
    input?: AiActionInput;
}

/** Per-entity graph runtime: blackboard persists; run rebuilds when the key changes. */
interface AgentState {
    bb: Blackboard;
    run: ScriptRunState | null;
    graphKey: string | null;
    compiled: CompiledScriptGraph | null;
    /** Refs this agent asked for and nothing had, reported once each. */
    missing: Set<string>;
}
/** The slice of `World` the step needs — lets tests inject a fake. */
interface ScriptGraphWorldView {
    getEntitiesWithComponents(components: readonly AnyComponentDef[]): readonly Entity[];
    get<C extends AnyComponentDef>(entity: Entity, component: C): ComponentData<C>;
    set<C extends AnyComponentDef>(entity: Entity, component: C, data: ComponentData<C>): void;
    has(entity: Entity, component: AnyComponentDef): boolean;
}
/** Get (creating if needed) an agent's blackboard — lets game code seed data early. */
declare function agentGraphBlackboard(states: Map<Entity, AgentState>, entity: Entity): Blackboard;
/**
 * Advance every ScriptGraphAgent one tick, and run `event.destroy` for the ones
 * that left. Presence is diffed against the live query rather than watching for
 * removals, so a graph's teardown fires the frame its entity drops out however
 * it left — the `defineBehavior` lifecycle contract.
 */
declare function stepScriptGraphs(world: ScriptGraphWorldView, commands: CommandsInstance, dt: number, states: Map<Entity, AgentState>, resolveGraph?: (ref: string) => CompiledScriptGraph | undefined, onProblem?: (entity: Entity, message: string) => void, input?: InputState): void;
/** Every leaf a compiled graph names — one per `call` node. */
declare function scriptGraphLeaves(compiled: CompiledScriptGraph): Iterable<LeafRef>;
/**
 * What the script-graph system reaches for: the union over the graphs THIS app
 * has. Read per app, because a schedule is per app.
 */
declare function scriptGraphTouches(app: App): SystemTouches;
/** Resource for game code to reach an agent's variables and blackboard. */
declare class ScriptGraphs {
    private states;
    constructor(states: Map<Entity, AgentState>);
    blackboard(entity: Entity): Blackboard;
    /** A graph variable's value, or null before the instance has started. */
    variable(entity: Entity, name: string): ScriptValue;
    /** Write a graph variable — how game code hands a running graph its input. */
    setVariable(entity: Entity, name: string, value: ScriptValue): void;
    /** Whether the instance spent its step budget and stopped. */
    halted(entity: Entity): boolean;
}
declare const AiScriptGraphs: ResourceDef<ScriptGraphs>;
declare class ScriptGraphPlugin implements Plugin {
    name: string;
    build(app: App): void;
}
declare const scriptGraphPlugin: ScriptGraphPlugin;

/**
 * @file    builtinNodes.ts
 * @brief   The engine's own value vocabulary — maths, comparison, logic, reading
 *          the world — registered as ordinary names.
 *
 * Deliberately not built into the interpreter: an addition node reaches the
 * graph through the same door a project's own `registerValue` does, so there is
 * no privileged set to imitate. Namespaced to stay clear of game names, and a
 * name already present is never overwritten, so game code wins whatever the
 * registration order was.
 *
 * Everything here is `pure`: it answers a question and changes nothing. That is
 * also what keeps it out of the FSM and behaviour-tree palettes, where a name
 * that changes nothing would be a hook that does nothing.
 */
/**
 * Register the engine's built-in graph vocabulary. Idempotent (and safe after an
 * `aiRegistry.clear()`): each name registers only if absent.
 */
declare function ensureBuiltinScriptNodes(): void;

/**
 * @file    graphOps.ts
 * @brief   Immutable edits on a ScriptGraph — the editor's model.
 *
 * Pure functions returning new graphs (never mutating), so the panel drives them
 * through AssetDocument.edit for free undo, mirroring fsmGraph and btGraph. The
 * wire rules live here rather than in the panel, because the loader has to apply
 * the same ones to a file somebody wrote by hand.
 */

/** Add a node of `kind` (a `call` carries the name it runs) at a canvas point. */
declare function addScriptNode(graph: ScriptGraph, kind: string, x: number, y: number, ref?: string): {
    graph: ScriptGraph;
    id: string;
};
declare function moveScriptNode(graph: ScriptGraph, id: string, x: number, y: number): ScriptGraph;
/** Remove a node and every wire that touched it — a dangling wire is not a graph. */
declare function removeScriptNode(graph: ScriptGraph, id: string): ScriptGraph;
declare function setScriptNodeLiteral(graph: ScriptGraph, id: string, port: string, value: ScriptValue): ScriptGraph;
/**
 * Whether a wire may be drawn. Both halves of the answer live here: the ports
 * must exist and their types must meet.
 */
declare function canConnectPorts(graph: ScriptGraph, catalog: ScriptVerbCatalog, from: string, fromPort: string, to: string, toPort: string): boolean;
/**
 * Draw a wire, replacing whatever occupied the pin.
 *
 * An input takes ONE value and an exec pin hands control to ONE node: both ends
 * of a replaced wire are unambiguous, and a second wire into either would make
 * the picture stop saying what happens.
 */
declare function connectScriptNodes(graph: ScriptGraph, catalog: ScriptVerbCatalog, from: string, fromPort: string, to: string, toPort: string): ScriptGraph;
/** Cut the wire arriving at one input port. */
declare function disconnectScriptInput(graph: ScriptGraph, to: string, toPort: string): ScriptGraph;
/** Cut the wire leaving one exec pin. */
declare function disconnectScriptExec(graph: ScriptGraph, from: string, fromPort: string): ScriptGraph;
declare function removeScriptEdge(graph: ScriptGraph, id: string): ScriptGraph;
/** Every wire, as the canvas wants them — exec wires land on the `''` input pin. */
declare function scriptGraphEdges(graph: ScriptGraph): readonly ScriptGraphEdge[];
declare function addScriptVariable(graph: ScriptGraph, variable: ScriptGraphVariable): ScriptGraph;
/**
 * Drop a variable. The nodes naming it stay, and `describeNode` types their pin
 * `any` — a delete that silently removed the nodes reading it would lose work
 * the author can still see is wrong.
 */
declare function removeScriptVariable(graph: ScriptGraph, name: string): ScriptGraph;
/**
 * Declare a port on this graph's signature — what a `graph.call` elsewhere will
 * show. The side is the author's choice, not a guess from the wires: a port with
 * nothing wired to it yet still has to exist to wire INTO.
 */
declare function addScriptGraphPort(graph: ScriptGraph, side: 'inputs' | 'outputs', port: ScriptGraphPort): ScriptGraph;
/**
 * Drop a port. Wires that landed on it go with it — unlike a variable, whose
 * nodes stay readable, a pin that no longer exists has nowhere to draw an edge.
 */
declare function removeScriptGraphPort(graph: ScriptGraph, side: 'inputs' | 'outputs', name: string): ScriptGraph;
/** Rename a port, carrying the wires on it along. */
declare function renameScriptGraphPort(graph: ScriptGraph, side: 'inputs' | 'outputs', from: string, to: string): ScriptGraph;
/** Retype a port, dropping wires the new type cannot carry. */
declare function retypeScriptGraphPort(graph: ScriptGraph, side: 'inputs' | 'outputs', name: string, type: ScriptGraphPort['type']): ScriptGraph;
/** Rename a variable, carrying every node that names it along with it. */
declare function renameScriptVariable(graph: ScriptGraph, from: string, to: string): ScriptGraph;

export { AiScriptGraphs, BUILTIN_NODE_KINDS, DEFAULT_STEP_BUDGET, MAX_CALL_DEPTH, SCRIPT_GRAPH_VERSION, ScriptGraphAgent, ScriptGraphPlugin, ScriptGraphs, THEN, addScriptGraphPort, addScriptNode, addScriptVariable, agentGraphBlackboard, allScriptGraphs, canConnect, canConnectPorts, clearScriptGraphStore, coerceValue, compileAgainstRegistry, compileScriptGraph, connectScriptNodes, createScriptRunState, defaultForType, describeNode, destroyScriptGraph, disconnectScriptExec, disconnectScriptInput, emptyScriptGraph, ensureBuiltinScriptNodes, fireScriptGraphEvent, getScriptGraph, graphCallRef, isCallableGraph, moveScriptNode, registerScriptGraph, removeScriptEdge, removeScriptGraphPort, removeScriptNode, removeScriptVariable, renameScriptGraphPort, renameScriptVariable, retypeScriptGraphPort, scriptCatalog, scriptGraphCallRefs, scriptGraphEdges, scriptGraphLeaves, scriptGraphPlugin, scriptGraphPrefabRefs, scriptGraphTouches, sequenceCount, setScriptNodeLiteral, signatureOf, spawnPrefabRef, stepScriptGraph, stepScriptGraphs };
export type { CompiledScriptGraph, ScriptFrame, ScriptGraph, ScriptGraphAgentData, ScriptGraphEdge, ScriptGraphNode, ScriptGraphPort, ScriptGraphSignature, ScriptGraphVariable, ScriptGraphWorldView, ScriptNodeShape, ScriptPort, ScriptRunState, ScriptTickContext, ScriptValue, ScriptValueType, ScriptVerbCatalog };
