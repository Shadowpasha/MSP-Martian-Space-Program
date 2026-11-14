/**
 * @file    types.ts
 * @brief   State-machine data model — the serializable shape of a `.esfsm`.
 *
 * A definition is pure data: states carry named action hooks, transitions carry
 * their enabling conditions (event trigger, named condition, and/or blackboard
 * guards). Leaf logic (the action/condition names) is resolved at runtime via
 * the AiRegistry, so the data never embeds code — matching how `.esbt` and the
 * input maps stay code-free.
 */

type CompareOp = '==' | '!=' | '<' | '<=' | '>' | '>=' | 'truthy' | 'falsy';
/** A single blackboard comparison. `value` is unused for truthy/falsy. */
interface BlackboardGuard {
    key: string;
    op: CompareOp;
    value?: number | string | boolean;
}
/**
 * A directed edge to `to`. Enabled when ALL of its specified mechanisms hold:
 * the `trigger` event is pending, the named `condition` returns true, and every
 * `guard` compares true. A transition with none of them is unconditional.
 */
interface FsmTransition {
    to: string;
    /** Event name (Unity-style trigger) that must be fired; consumed when taken. */
    trigger?: string;
    /** Named condition resolved from the registry. */
    condition?: string;
    /** Blackboard comparison(s), AND-combined. */
    guard?: BlackboardGuard | BlackboardGuard[];
}
/**
 * A hook/leaf action reference: a bare registry name, or a name plus its input.
 * The input is either the canonical string (`spriteAnim.play` with a clip ref)
 * or the action's declared parameters by name — the two are projections of each
 * other, so a ref written either way runs the same (see registry.ts).
 */
type FsmActionRef = string | {
    name: string;
    arg?: string;
    params?: Record<string, AiParamValue>;
};
/** Registry name of an action ref ('' for none). */
declare function actionRefName(ref: FsmActionRef | undefined): string;
/** Argument of an action ref, if any. */
declare function actionRefArg(ref: FsmActionRef | undefined): string | undefined;
/** Declared parameters of an action ref, if it was authored with them. */
declare function actionRefParams(ref: FsmActionRef | undefined): Record<string, AiParamValue> | undefined;
interface FsmState {
    name: string;
    /** Named action run once when the state becomes active. */
    onEnter?: FsmActionRef;
    /** Named action run every tick the state is active (and no transition fired). */
    onUpdate?: FsmActionRef;
    /** Named action run once when the state is left. */
    onExit?: FsmActionRef;
    /** Outgoing edges, evaluated in order; the first enabled one is taken. */
    transitions?: FsmTransition[];
    /** Editor-only canvas position; ignored by the interpreter. */
    x?: number;
    y?: number;
}
interface FsmDefinition {
    /** Name of the state entered on start. */
    initial: string;
    states: FsmState[];
}

/**
 * @file    Blackboard.ts
 * @brief   Per-agent key/value context + one-shot event triggers.
 *
 * The shared data plane for the AI layer: FSM guards and BT conditions read it,
 * actions write it, game code seeds it. Triggers are edge events (Unity-style):
 * fired once, consumed by the transition that takes them.
 */

declare class Blackboard {
    private data;
    private triggers;
    get<T = unknown>(key: string): T | undefined;
    set(key: string, value: unknown): void;
    has(key: string): boolean;
    delete(key: string): void;
    /** Fire a one-shot event; a transition keyed on it becomes enabled until taken. */
    fire(trigger: string): void;
    isFired(trigger: string): boolean;
    consume(trigger: string): void;
    /** Drop all pending triggers (e.g. on reset). */
    clearTriggers(): void;
}
/** Evaluate one guard against the blackboard. Missing keys compare as undefined. */
declare function evalGuard(bb: Blackboard, guard: BlackboardGuard): boolean;
/** True when every guard passes (empty set → vacuously true). */
declare function evalGuards(bb: Blackboard, guards: BlackboardGuard | BlackboardGuard[]): boolean;

/**
 * @file    status.ts
 * @brief   Shared AI task status — the return type that unifies FSM actions and
 *          behavior-tree nodes.
 *
 * A registered action may return a Status (a BT leaf that can run across frames)
 * or nothing (a one-shot FSM action). BT treats a `void` return as `Success`;
 * FSM ignores the return entirely. One registry, two consumers.
 */
declare enum Status {
    Success = "success",
    Failure = "failure",
    Running = "running"
}

/**
 * @file    registry.ts
 * @brief   AiRegistry — names → leaf action/condition functions, plus the
 *          parameters those names take.
 *
 * The binding between code-free data (`.esfsm`/`.esbt`/`EventBinding` referencing
 * names) and real gameplay logic. Generic over the context type `Ctx` so the pure
 * core stays wasm-free; the engine layer instantiates it with a concrete AiContext
 * (a BehaviorContext superset) and exposes the `registerAction`/`registerCondition`
 * free functions over a shared singleton.
 *
 * An action may DECLARE its parameters ({@link AiParamDef}), which is what lets an
 * editor render real controls instead of one free-text box. Declaring them changes
 * nothing on disk: every action keeps a canonical string form (`"tabs:settings"`),
 * and {@link invokeAction} projects between the two in both directions — so
 * authored data written before the declaration still runs, data written as
 * parameters still reaches an action that only reads `arg`, and the FSM, the
 * behaviour tree and an event wire all dispatch through one path.
 */

/** A parameter value as it is authored and serialized. */
type AiParamValue = string | number | boolean;
/** Declared parameters of one action reference, keyed by {@link AiParamDef.name}. */
type AiParams = Readonly<Record<string, AiParamValue>>;
type AiAction<Ctx> = (ctx: Ctx, bb: Blackboard, arg?: string, params?: AiParams, out?: AiOutputs) => void | Status;
type AiCondition<Ctx> = (ctx: Ctx, bb: Blackboard) => boolean;
/**
 * Values a name hands back, keyed by {@link AiOutputDef.name} — filled through
 * the `out` parameter rather than the return, which already answers the BT's
 * question. One channel with two meanings reports a leaf as Running because it
 * produced a value.
 */
type AiOutputs = Record<string, AiParamValue>;
/**
 * One declared parameter. The vocabulary is deliberately the component-field one
 * (`enum` options, numeric range, tooltip) so an editor renders action parameters
 * with the very same controls it renders component fields with — including
 * `optionsSource`, the dynamic-enum escape hatch for choices that depend on the
 * entity (a controller's name, one of its pages).
 */
interface AiParamDef {
    /** Key in the params record, and the fallback label. */
    name: string;
    /** Control kind. Asset/entity references are deliberately absent until the
     *  cook's discovery pass and the scene's entity remapper can see them. */
    type: 'string' | 'number' | 'bool' | 'enum';
    /** Human label; defaults to a prettified `name`. */
    label?: string;
    tooltip?: string;
    /** Fixed choices for `type: 'enum'`. */
    options?: readonly {
        label: string;
        value: string;
    }[];
    /** Editor-resolved choice provider (e.g. `'uiController'`, `'uiControllerPage'`). */
    optionsSource?: string;
    min?: number;
    max?: number;
    step?: number;
}
/**
 * One declared output — what a name hands back. Deliberately thinner than
 * {@link AiParamDef}: an output has no control to render, so it carries the
 * type a wire is checked against and a label, and nothing an inspector would
 * need.
 */
interface AiOutputDef {
    /** Key in the {@link AiOutputs} record, and the fallback label. */
    name: string;
    type: 'string' | 'number' | 'bool' | 'entity';
    label?: string;
    tooltip?: string;
}
/**
 * What a leaf reaches for on the world, by component name.
 *
 * The system running a graph is only as knowable as its leaves. `opaque` is a
 * leaf admitting it cannot say — different from one that never declared.
 */
interface AiTouches {
    reads?: readonly string[];
    writes?: readonly string[];
    opaque?: boolean;
}
/**
 * A leaf's reach, either fixed or derived from the input the authored data
 * carries — `property.set` writes the component its `path` names, which is
 * unknowable at registration and plain in the data.
 */
type AiTouchesSource = AiTouches | ((input: AiActionInput) => AiTouches);
/** An action registered with metadata rather than as a bare function. */
interface AiActionSpec<Ctx> {
    run: AiAction<Ctx>;
    /** Declared parameters, in canonical string order. */
    params?: readonly AiParamDef[];
    /** Declared outputs — what it writes into the `out` record it is handed. */
    outputs?: readonly AiOutputDef[];
    /**
     * True when running it changes nothing: the name answers a question. A pure
     * name may be evaluated on demand and in any order, which is what lets a
     * script graph pull a value up its data wires instead of sequencing it.
     * A leaf that mutates the world and ALSO hands back a value is not pure.
     */
    pure?: boolean;
    /** What it reaches for. Undeclared means unknown, not nothing. */
    touches?: AiTouchesSource;
    /**
     * Separator joining the parameters in the canonical string form. Default
     * `':'` — the convention authored data already uses (`"tabs:settings"`).
     * The LAST parameter absorbs any remaining separators, so a value may
     * contain one.
     */
    separator?: string;
}
/**
 * A name that answers a question instead of doing something — the registration
 * shape for a pure leaf. {@link AiActionSpec} minus the parts a question has no
 * use for: no Status (nothing runs across frames) and no canonical-string
 * projection (a value is reached by a wire, never by a hand-typed `arg`).
 */
interface AiValueSpec<Ctx> {
    /** Declared inputs — the same vocabulary an action's parameters use. */
    params?: readonly AiParamDef[];
    /** Declared outputs. A value with none is a name nothing can read. */
    outputs: readonly AiOutputDef[];
    /** What it reads. Undeclared means unknown, not nothing. */
    touches?: AiTouches;
    /** Fill `out` with the declared outputs. Must not change the world. */
    evaluate(ctx: Ctx, bb: Blackboard, params: AiParams, out: AiOutputs): void;
}
/** A condition registered with metadata rather than as a bare predicate. */
interface AiConditionSpec<Ctx> {
    check: AiCondition<Ctx>;
    /** What it reads. Undeclared means unknown, not nothing. */
    touches?: AiTouches;
}
declare class AiRegistry<Ctx = unknown> {
    private actions;
    private conditions;
    /**
     * Register `name`, either as a bare function (input is the raw `arg` string,
     * as it always was) or with declared parameters.
     *
     * A declared action is stored WRAPPED in the projection, so both shapes are
     * filled in no matter how it is reached — {@link invokeAction}, a direct
     * `getAction(name)(ctx, bb, "tabs:settings")`, anything. Normalizing once
     * here is what keeps the two forms from becoming two contracts.
     */
    registerAction(name: string, fn: AiAction<Ctx> | AiActionSpec<Ctx>): void;
    /**
     * Register a pure name — see {@link AiValueSpec}. It lands in the SAME store
     * actions do, so one lookup, one catalog and one extractor serve both: a
     * palette asks what names exist, not what kind of thing each one is.
     */
    registerValue(name: string, spec: AiValueSpec<Ctx>): void;
    registerCondition(name: string, fn: AiCondition<Ctx> | AiConditionSpec<Ctx>): void;
    getAction(name: string): AiAction<Ctx> | undefined;
    /**
     * What running `name` reaches for, given the input an authored reference
     * carries. `undefined` for an unregistered name or one that never declared —
     * the caller has to decide what an unknown leaf means, and treating it as
     * "touches nothing" would be the one wrong answer.
     */
    actionTouches(name: string, input?: AiActionInput): AiTouches | undefined;
    conditionTouches(name: string): AiTouches | undefined;
    /** The declared parameters of `name` (empty when it takes a bare string). */
    getActionParams(name: string): readonly AiParamDef[];
    /** The separator joining `name`'s parameters in the canonical string form. */
    getActionSeparator(name: string): string;
    /** What `name` hands back (empty when it declares nothing). */
    getActionOutputs(name: string): readonly AiOutputDef[];
    /** Whether running `name` changes nothing — see {@link AiActionSpec.pure}. */
    isActionPure(name: string): boolean;
    getCondition(name: string): AiCondition<Ctx> | undefined;
    hasAction(name: string): boolean;
    hasCondition(name: string): boolean;
    /** Registered action/condition names, for editor palettes. */
    actionNames(): string[];
    conditionNames(): string[];
    /** Drop all registrations (tests / hot-reload). */
    clear(): void;
}
/** How an authored reference carries its input: a string, named values, or both. */
interface AiActionInput {
    arg?: string;
    params?: Readonly<Record<string, AiParamValue>>;
}
/**
 * Split a canonical string into declared parameters. The last parameter absorbs
 * the remainder, so `"tabs:a:b"` against `[controller, page]` yields
 * `{controller: 'tabs', page: 'a:b'}` — the same rule `ui.setPage` hand-rolled.
 * Numbers and booleans are coerced to their declared type.
 */
declare function parseActionArg(arg: string | undefined, params: readonly AiParamDef[], separator?: string): Record<string, AiParamValue>;
/**
 * Join declared parameters back into the canonical string — so data authored as
 * parameters still reaches an action (or a tool) that only speaks `arg`.
 * Trailing empties are dropped, keeping `"tabs"` rather than `"tabs:"`.
 */
declare function formatActionArg(params: Readonly<Record<string, AiParamValue>> | undefined, defs: readonly AiParamDef[], separator?: string): string | undefined;
/**
 * The one dispatch path for a named action, shared by the FSM, the behaviour
 * tree and event wires: resolve the name and hand it whichever form the authored
 * data carries — the registration wrapper fills in the other. An unknown name is
 * a silent no-op, so each caller reports it in its own vocabulary (a BT leaf
 * fails, an event wire warns).
 */
declare function invokeAction<Ctx>(registry: AiRegistry<Ctx>, name: string, ctx: Ctx, bb: Blackboard, input?: AiActionInput, out?: AiOutputs): void | Status;

export { AiRegistry, Blackboard, Status, actionRefArg, actionRefName, actionRefParams, evalGuard, evalGuards, formatActionArg, invokeAction, parseActionArg };
export type { AiAction, AiActionInput, AiActionSpec, AiCondition, AiOutputDef, AiOutputs, AiParamDef, AiParamValue, AiParams, AiTouches, AiValueSpec, BlackboardGuard, CompareOp, FsmActionRef, FsmDefinition, FsmState, FsmTransition };
