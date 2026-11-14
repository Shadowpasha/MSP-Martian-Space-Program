import { ResourceDef, ResourceStorage } from './resource.js';
import { World, EventRegistry, CommandsInstance } from './app.js';

/** What the body decided. `abandon` must leave nothing a reader could see. */
type SpeculationOutcome = 'commit' | 'abandon';
/** Everything the scope has to reach. Explicit rather than global: resources
 *  and the event registry belong to the app, and a kernel that guessed which
 *  one would be a second authority over both. */
interface SpeculationScope {
    world: World;
    resources: ResourceStorage;
    /** Omit when the step writes no events — then there is no watermark to take. */
    events?: EventRegistry;
}
/** Whether a step reached the same place twice, and what differed if not. */
interface ReplayReport {
    stable: boolean;
    why: string;
}
/**
 * Run the same step twice from the same state, over the three surfaces this
 * scope aligns; both runs are taken back. A predicted step already promises to
 * depend "only on world state + actions + dt" (replication/client.ts), and
 * nothing held it to that — a clock or a random source reads green until desync.
 */
declare function replay(scope: SpeculationScope, body: (commands: CommandsInstance) => SpeculationOutcome): ReplayReport;
/**
 * The scope a system was handed. `run` is one step: the body mutates, then says
 * whether it happened.
 *
 * @experimental
 */
declare class SpeculationInstance {
    private readonly world_;
    private readonly resources_;
    private readonly events_;
    constructor(world: World, resources: ResourceStorage, events: EventRegistry | null);
    run(body: (commands: CommandsInstance) => SpeculationOutcome): SpeculationOutcome;
    /** Ask whether the step is a function of the world alone. Takes both runs
     *  back, so asking costs the world nothing. */
    replay(body: (commands: CommandsInstance) => SpeculationOutcome): ReplayReport;
    private scope_;
}
/**
 * `Res(Speculation)` — the engine's existing way for a system to be handed a
 * service, which is what this is. The parameter vocabulary is a frozen public
 * type: a capability that grows it breaks that promise for every reader of
 * `SystemParam`, and a service does not need to.
 *
 * @experimental
 */
declare const Speculation: ResourceDef<SpeculationInstance>;

export { Speculation, SpeculationInstance, replay };
export type { ReplayReport, SpeculationOutcome, SpeculationScope };
