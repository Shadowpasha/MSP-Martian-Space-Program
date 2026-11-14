import { SceneComponentData, AnyComponentDef, ComponentDef, World, App, Plugin } from '../../shared/app.js';
import { Entity } from '../../shared/wasm.js';
import { ReliableOrderedTransport } from '../../shared/NetChannel.js';
export { BinaryHandler, MessageHandler, NetChannel, NetChannelOptions, RequestHandler } from '../../shared/NetChannel.js';
import { SpeculationScope, ReplayReport } from '../../shared/speculation.js';
import { ResourceDef } from '../../shared/resource.js';

/**
 * @file    protocol.ts
 * @brief   The replication wire contract — one dependency-free module both
 *          endpoints import (the playProtocol pattern). The control plane
 *          rides NetChannel JSON events/RPC; the state plane rides the binary
 *          channel {@link REPLICATION_CHANNEL} (see codec.ts for the frame
 *          layout). Version or schema drift refuses the connection at
 *          handshake — never a silently mismatched simulation.
 */

/**
 * 4: a spawn stopped being a scene snapshot. It now carries protocol identity,
 * a ghost-construction key, and a baseline of DECLARED replication fields only —
 * a v3 endpoint would read the same JSON and build a different world, which is
 * exactly what a version is for.
 */
declare const REPLICATION_PROTOCOL_VERSION = 4;
/** NetChannel binary channel id the snapshot frames ride on. */
declare const REPLICATION_CHANNEL = 1;
/** Control-plane message types (NetChannel event / request names). */
declare const ReplMsg: {
    readonly hello: "repl:hello";
    readonly spawn: "repl:spawn";
    readonly despawn: "repl:despawn";
    readonly componentRemove: "repl:crm";
    readonly input: "repl:input";
    readonly ack: "repl:ack";
};
/**
 * One component's replication schema, as exchanged for handshake comparison.
 * `shapes` is parallel to `fields`: each field's wire shape as a canonical
 * signature. Names alone do not pin the byte layout — `0` against `false`
 * agrees on the name and writes 4 bytes against 1.
 */
interface ReplComponentSchema {
    name: string;
    fields: string[];
    shapes: string[];
}
interface ReplHelloRequest {
    protocolVersion: number;
    /** EHT layout hash — builtins replicate by heap layout, so both ends must
     *  run the same component ABI. */
    abiHash: string;
    /** The client's full replication table, for exact schema comparison. */
    components: ReplComponentSchema[];
}
interface ReplHelloOk {
    ok: true;
    /** Server-assigned connection id — the ownership handle (0 = the server). */
    connectionId: number;
    /** The server's current fixed tick, so the client can offset its buffers. */
    tick: number;
    /** The server's fixed timestep in seconds (0 if it hasn't ticked yet) —
     *  the dt client prediction replays unacknowledged inputs with. */
    fixedDelta: number;
}
interface ReplHelloError {
    ok: false;
    error: string;
}
type ReplHelloResponse = ReplHelloOk | ReplHelloError;
/**
 * One replicated entity's spawn, in the three contracts it is actually made of.
 * Identity is protocol, not state; construction is declared, not inferred from
 * what the authority holds; and the baseline carries replication-table
 * components with their DECLARED fields and nothing else.
 */
interface ReplSpawnEntity {
    netId: number;
    name: string;
    /** netId of the replicated parent, or 0 for a root. */
    parentNetId: number;
    /** Owning connection id. Protocol identity like `netId` — it is not a
     *  replicated field and must not become one. */
    owner: number;
    /** Which registered archetype builds this ghost; '' for a bare one. */
    archetype: string;
    /** Table components only, declared fields only; entity refs as netIds. */
    baseline: SceneComponentData[];
}
interface ReplSpawnBatch {
    tick: number;
    entities: ReplSpawnEntity[];
}
interface ReplDespawnBatch {
    tick: number;
    netIds: number[];
}
/**
 * Server → client: replicated components that LEFT an entity that lives on.
 * Field deltas cannot carry this — a removed component stops being sampled, so
 * without its own op the client keeps the last values it saw for good.
 * `componentIds` are wire table ids (codec.ts), the same ids frames carry.
 */
interface ReplComponentRemoveBatch {
    tick: number;
    entries: {
        netId: number;
        componentIds: number[];
    }[];
}
/**
 * Client → server input command. `actions` is game-defined (typically one
 * InputMap's evaluated values per fixed tick: booleans, axes, {x,y} pairs);
 * `seq` is a client-monotonic counter so stale deliveries never overwrite
 * newer state. The server keeps the latest per connection for gameplay that
 * reads `ReplicationServer.inputOf(connectionId)`, and additionally queues
 * commands for exactly-once per-tick consumption via `tickInputOf` — the
 * contract client prediction replays against.
 */
interface ReplInputMsg {
    seq: number;
    actions: Record<string, unknown>;
}
/**
 * Server → client input acknowledgement: the authoritative state at `tick`
 * incorporates this connection's inputs up to and including `seq`. Client
 * prediction drops acknowledged inputs and replays the rest on top of the
 * authoritative state. Sent only when the acknowledged seq advances.
 */
interface ReplAckMsg {
    tick: number;
    seq: number;
}

/**
 * @file    codec.ts
 * @brief   Reflection-driven binary codec for replication state frames. No
 *          hand-written per-component serializers: the field list comes from
 *          the `replicated` declaration (getReplicatedFields) and each field's
 *          wire shape derives from the component's default value — both ends
 *          derive from the same declaration, verified at handshake, so the
 *          layouts cannot drift independently.
 *
 *          Frame layout (little-endian):
 *            u32 magic 'ESRP' | u8 version | u32 tick | u16 entryCount
 *            entry: u32 netId | u16 componentId | u32 fieldMask
 *                   | field values for set mask bits, in declaration order
 *
 *          Value shapes: number → f32 (engine truth is f32), boolean → u8,
 *          string → u16 len + utf8, plain object → keys recursively in
 *          declaration order, entity-ref field → u32 netId (remapped at both
 *          ends), anything else → JSON string fallback.
 */

type FieldShape = {
    kind: 'f32';
} | {
    kind: 'bool';
} | {
    kind: 'string';
} | {
    kind: 'entity';
} | {
    kind: 'object';
    keys: string[];
    shapes: FieldShape[];
} | {
    kind: 'json';
};
/**
 * Deep-clone a replicated field value (plain JSON-shaped data). Shared by the
 * server's shadow snapshots and the client's prediction authority copies —
 * both must never alias live component objects.
 */
declare function cloneValue<T>(v: T): T;
interface ReplicationTableEntry {
    /** Wire component id — the index in the name-sorted table. */
    id: number;
    name: string;
    def: AnyComponentDef;
    fields: string[];
    shapes: FieldShape[];
}
interface ReplicationTable {
    entries: ReplicationTableEntry[];
    byName: Map<string, ReplicationTableEntry>;
}
/**
 * Build the wire table from every registered component with a non-empty
 * `replicated` declaration, name-sorted so both ends derive identical ids.
 * The handshake compares the two tables field-by-field before any frame flows.
 */
declare function buildReplicationTable(): ReplicationTable;
/**
 * A field shape as one canonical string, so the handshake can compare byte
 * layouts and not just names. `entity` is its own signature rather than the
 * `f32` its default `0` would derive: the two are both four bytes and mean
 * completely different things on the wire.
 */
declare function shapeSignature(shape: FieldShape): string;
declare function tableSchemas(table: ReplicationTable): ReplComponentSchema[];
/** Exact-schema comparison for the handshake: same components, same fields,
 *  same order. Returns a human-readable mismatch, or null when compatible. */
declare function diffSchemas(mine: ReplComponentSchema[], theirs: ReplComponentSchema[]): string | null;
declare class ByteWriter {
    private buf_;
    private view_;
    private len_;
    constructor(initialCapacity?: number);
    get length(): number;
    private ensure_;
    u8(v: number): void;
    u16(v: number): void;
    u32(v: number): void;
    f32(v: number): void;
    string(s: string): void;
    /** Patch a previously written u16 (e.g. a count written before the loop). */
    patchU16(offset: number, v: number): void;
    finish(): Uint8Array;
}
declare class ByteReader {
    private readonly view_;
    private readonly bytes_;
    private pos_;
    constructor(data: Uint8Array);
    get remaining(): number;
    u8(): number;
    u16(): number;
    u32(): number;
    f32(): number;
    string(): string;
}
/** Entity-ref translation at the wire boundary: the encoder maps a live Entity
 *  to its netId, the decoder maps a netId back to the local Entity (0 when the
 *  target is unknown/not replicated). */
interface EntityRefMap {
    toWire(entity: number): number;
    fromWire(netId: number): number;
}
declare function encodeValue(w: ByteWriter, shape: FieldShape, value: unknown, refs?: EntityRefMap): void;
declare function decodeValue(r: ByteReader, shape: FieldShape, refs?: EntityRefMap): unknown;
interface StateEntry {
    netId: number;
    componentId: number;
    fieldMask: number;
    /** Decoded values for set mask bits, in field-declaration order. */
    values: unknown[];
}
interface StateFrame {
    tick: number;
    entries: StateEntry[];
}
declare class FrameWriter {
    private readonly w_;
    private readonly countOffset_;
    private count_;
    constructor(tick: number);
    get entryCount(): number;
    entry(netId: number, table: ReplicationTableEntry, fieldMask: number, data: Record<string, unknown>, refs?: EntityRefMap): void;
    finish(): Uint8Array;
}
declare function decodeStateFrame(payload: Uint8Array, table: ReplicationTable, refs?: EntityRefMap): StateFrame;

interface ReplicatedData {
    /** Stable network identity, allocated by the server (0 = unassigned). */
    netId: number;
    /** Owning connection id (0 = the server) — input/authority routing (N4). */
    owner: number;
    /**
     * Which {@link registerReplicationArchetype} builder gives this entity's
     * ghosts their shape. Empty means a bare ghost carrying only the replication
     * baseline. Never replicated as a FIELD — it rides the spawn as protocol
     * metadata, like `netId` and `owner`.
     */
    archetype: string;
}
declare const Replicated: ComponentDef<ReplicatedData>;
/** Client-side proxy of a server entity: state arrives over the wire. */
declare const NetGhost: ComponentDef<{}>;

/**
 * @file    interest.ts
 * @brief   Interest management — per-connection relevance filtering.
 *
 * A policy decides which replicated entities a connection receives. The server
 * evaluates it once per ready connection per sample tick; entities entering a
 * connection's interest are spawned to it (full current state), entities
 * leaving are despawned (the client drops the ghost), and delta frames carry
 * only entities inside it. Two invariants live in the server, not here: a
 * connection always sees the entities it owns, and with no policy installed
 * every connection sees everything (the pre-interest broadcast behavior).
 */

/** What a policy sees when the server asks it for one connection's interest. */
interface InterestView {
    /** The connection being evaluated. */
    connectionId: number;
    world: World;
    /** Every currently replicated entity — the set to filter. */
    candidates: readonly Entity[];
    /** The entities this connection owns, when the host keeps an index of them.
     *  A policy that needs its own anchors should prefer this over reading
     *  `Replicated.owner` off every candidate; absent, fall back to that. */
    owned?: readonly Entity[];
}
/**
 * Returns the entities relevant to the connection, or `'all'` for no
 * filtering. Runs on the server once per ready connection per sample tick, so
 * keep it cheap — return a subset of `candidates`, don't run queries of your
 * own.
 */
type InterestPolicy = (view: InterestView) => ReadonlySet<Entity> | 'all';
/**
 * What a provider is given to build one snapshot from.
 *
 * `entities` is an iterable, not an array: a provider that scans the population
 * may, but installing one must not itself cost an O(population) materialization.
 *
 * @experimental
 */
interface InterestProviderPrepareView {
    readonly world: World;
    readonly entities: Iterable<Entity>;
    readonly entityCount: number;
    /**
     * Which entities entered replication since the last prepare, and which left.
     * A provider that keeps state between samples maintains it from these rather
     * than walking `entities`; absent (an older host, or a first prepare it was
     * not given), it has to seed from `entities` instead.
     *
     * @experimental
     */
    readonly entered?: readonly Entity[];
    readonly left?: readonly Entity[];
    /**
     * Entities whose replicated components changed SHAPE this sample. A provider
     * caching a per-entity fact re-reads these: an entity that lost the component
     * the fact came from is not something that component's value feed reports.
     *
     * @experimental
     */
    readonly rechecked?: readonly Entity[];
}
/** What a prepared snapshot is asked about one connection. @experimental */
interface InterestProviderQueryView {
    readonly connectionId: number;
    /** The entities this connection owns. The SERVER still forces them visible;
     *  this is here so a provider can place its view. */
    readonly owned: readonly Entity[];
}
/** One snapshot, queried by every connection evaluated against it. @experimental */
interface PreparedInterest {
    /**
     * This snapshot's identity, in the provider's own numbering. The same number
     * twice certifies the same answer to the same query inputs, so the host does
     * not ask again; absent, every connection is queried.
     *
     * @experimental
     */
    readonly generation?: number;
    query(view: InterestProviderQueryView): ReadonlySet<Entity> | 'all';
}
/**
 * Relevance as prepare-once, query-many. A {@link InterestPolicy} is handed the
 * population per connection, so what it reads it reads C times; a provider
 * prepares one snapshot and answers every connection from it.
 *
 * @experimental
 */
interface InterestProvider {
    prepare(view: InterestProviderPrepareView): PreparedInterest;
    /** Release anything held across samples. A provider that rebuilds owns
     *  nothing; one that maintains an index between samples does. */
    dispose?(): void;
}
/** Where an entity is, for the distance a policy measures. `z` is optional so a
 *  flat game's reader can keep answering in two. */
interface InterestPoint {
    x: number;
    y: number;
    z?: number;
}
interface RadiusInterestOptions {
    /**
     * How to read an entity's position. Defaults to the `Transform` component's
     * world-space `position`. Return null for "this entity has no place" — such
     * entities are always relevant (they can't be culled by distance).
     */
    position?: (world: World, entity: Entity) => InterestPoint | null;
}
/**
 * The built-in spatial policy: a connection sees the entities within `radius`
 * of any entity it owns (its pawn/s). Placeless entities (no position) are
 * always relevant. Fail-open: while a connection owns no positioned entity
 * (e.g. before gameplay provisions its pawn) it sees everything.
 */
declare function radiusInterest(radius: number, options?: RadiusInterestOptions): InterestPolicy;
/**
 * {@link radiusInterest} as a provider. With the canonical `Transform` reader the
 * grid is KEPT: membership from the server's enter/leave, movement from what the
 * composition says changed. A custom `position` rebuilds every sample, because
 * nothing can know when an arbitrary function would answer differently.
 *
 * The kept lane also publishes a {@link PreparedInterest.generation}, so a
 * sample in which nothing entered, left or MOVED is one no connection has to be
 * queried for. The rebuilt lane publishes none.
 *
 * @experimental
 * @see radiusInterest
 */
declare function radiusInterestProvider(radius: number, options?: RadiusInterestOptions): InterestProvider;

/**
 * @file    archetype.ts
 * @brief   What a ghost is built from — the construction half of a spawn.
 *
 *          A spawn answers three questions under three contracts: who this
 *          entity is on the wire, what the client is DECLARED to know about it,
 *          and what it takes for a proxy of it to exist at all. This is the
 *          third. The server sends a key, the client runs the builder
 *          registered under it, and what the authority happens to have on the
 *          entity — an AI blackboard, an unrevealed objective — is not part of
 *          the answer.
 */

/**
 * Builds the client-side shape of one replicated entity. Runs BEFORE the
 * replication baseline is applied, so anything the authority declares wins over
 * what this sets: a re-spawn after leaving and re-entering interest arrives at
 * the current state, not at a fresh default.
 *
 * @experimental
 */
type ReplicationArchetype = (world: World, entity: Entity) => void;
/**
 * Declare how a ghost of `key` is built. The server names one per replicated
 * entity through `Replicated.archetype`, and a client that cannot resolve the
 * key refuses the spawn rather than building half of it. Synchronous in this
 * first form: a key resolving to a preloaded prefab is a later question.
 *
 * @experimental
 */
declare function registerReplicationArchetype(key: string, build: ReplicationArchetype): void;

/**
 * @file    NetIds.ts
 * @brief   NetId ↔ Entity mapping. Entity handles are realm-local (packed
 *          generation|index, recycled on despawn), so the wire never carries
 *          them — a server-allocated NetId is the one cross-machine identity,
 *          and each endpoint keeps this bidirectional table.
 */

declare class NetIds {
    private readonly byNetId_;
    private readonly byEntity_;
    private nextId_;
    /** Server-side: allocate the next NetId. */
    allocate(): number;
    register(netId: number, entity: Entity): void;
    unregister(netId: number): void;
    unregisterEntity(entity: Entity): void;
    entityOf(netId: number): Entity | undefined;
    netIdOf(entity: Entity): number | undefined;
    get size(): number;
    clear(): void;
}

/**
 * @file    server.ts
 * @brief   The authoritative endpoint. Owns connections (one NetChannel per
 *          transport), answers the handshake, and each fixed tick: replicates
 *          spawns/despawns of `Replicated` entities on the JSON control plane
 *          and diffs replicated fields against a shadow copy into binary delta
 *          frames. WebSocket transports are reliable+ordered, so
 *          delta-since-last-send needs no ack protocol.
 *
 *          With an {@link InterestPolicy} installed, spawns/despawns/deltas are
 *          filtered per connection: the shadow diff still runs once, but each
 *          connection only receives the entities the policy deems relevant,
 *          entering entities arrive as full spawns and leaving ones as
 *          despawns. Without a policy every ready connection sees everything
 *          on a single broadcast frame (the fast path).
 */

declare class ReplicationServer {
    private readonly world_;
    private readonly netIds_;
    private readonly connections_;
    private nextConnectionId_;
    private table_;
    /** Last broadcast value per entity × table entry: entity → componentId → field record. */
    private readonly shadow_;
    private readonly known_;
    /**
     * Which connections can see an entity — the reverse projection of every
     * `conn.interest`, maintained from the enters and leaves the visibility pass
     * produces. Null with no interest source: broadcasting would rebuild, as a
     * Map, exactly the O(C x E) this exists to avoid.
     */
    private viewersByEntity_;
    /** known entity → netId, owned by sampling. Survives the onDespawn hook
     *  clearing netIds_, so a despawn can still broadcast its id. */
    private readonly knownNetIds_;
    /**
     * One interest slot, two shapes: a policy filters per connection, a provider
     * prepares once and answers each from it. Never both — "does the provider
     * run before the policy?" would quietly redefine what `candidates` means.
     */
    private interest_;
    /**
     * Which source the stamps in flight belong to. Bumped by every install, so
     * a new provider whose numbering happens to land on the outgoing one's
     * cannot be mistaken for it.
     */
    private interestEpoch_;
    private tick_;
    private fixedDelta_;
    /** Removal-history claims, one per replicated component. */
    private readonly observations_;
    /**
     * The floor every observation reads from, one tick BEHIND the world.
     * `worldTick` moves once per App frame while a frame may run several fixed
     * steps, and a write after a sample carries the tick it just closed — a
     * floor at the current tick drops both. The shadow filters the overlap.
     */
    private changeFloor_;
    private readonly offDespawn_;
    private disposed_;
    /**
     * The registry's own window and claim. Separate from `changeFloor_` on
     * purpose: field observation installs with the LAZY table, this one watches
     * the fixed `Replicated` marker and lives as long as the server does.
     */
    private registryFloor_;
    private readonly registryReader_;
    /**
     * Who owns what, so neither the anchor lookup nor the server's forced-owner
     * pass has to read every candidate to find out. Installed with the first
     * interest policy — a broadcast server never pays for it — and kept for the
     * server's life, since a policy can be swapped mid-session.
     */
    private ownedByConnection_;
    /** The index's own record of who owned each entity: a write says the NEW
     *  owner, and the old one is needed to take the entity off its set. */
    private readonly ownerOfEntity_;
    /** How many times a connection's owned set changed. The other half of what
     *  a spatial answer is a function of: the snapshot can stand still while
     *  the anchors a connection looks from change hands. */
    private readonly ownedEpoch_;
    private ownerFloor_;
    private ownerReader_;
    /** @internal Full-world reconciliations run — a steady-state sample must do none. */
    fullScans: number;
    /**
     * @internal Connections whose visibility was proved again — queried, copied
     * and diffed. A sample in which no relevance input moved must do none, and
     * that is the whole claim of the stamp.
     */
    visibilityRecomputes: number;
    /** @internal Entities entering and leaving views — what spawn serialization
     *  and the control plane are actually paid for. */
    entersSent: number;
    leavesSent: number;
    /** @internal Distinct entities serialized into a spawn payload this run. */
    payloadsBuilt: number;
    /**
     * @internal Milliseconds attributed to each LEAF phase of `sample`, plus
     * `total` for the whole call. Nothing nests, so `total` minus the rest is
     * exactly what the decomposition fails to explain — a budget with a large
     * remainder has not been decomposed. Off unless `profileSample` is set.
     */
    readonly samplePhases: Map<string, number>;
    /** @internal Turns the phase accounting on; it costs two clock reads a phase. */
    profileSample: boolean;
    private mark_;
    private since_;
    /**
     * How many (entity, connection) links the reverse-interest index holds.
     * A diagnostic, and the only way to see that a detached connection or a
     * failed initial send left nothing behind — routing guards against a stale
     * link, so one costs memory and bandwidth rather than correctness.
     *
     * @internal
     */
    get viewerLinks(): number;
    /** @internal Candidates read to answer "who owns this" — zero once indexed. */
    ownerScanVisits: number;
    /**
     * @internal Which projection dirty discovery took, per component per sample.
     * Both are correct, so a criterion meaning to exercise one of them has to be
     * able to say which it got.
     */
    journalReads: number;
    populationScans: number;
    /** @internal Entities dirty discovery actually examined against the shadow —
     *  the work, as against the two ways of finding it. */
    dirtyCandidates: number;
    /** @internal Delta rows that reached a connection, summed over connections:
     *  what the wire carried, against what routing considered. */
    deltaRowsSent: number;
    constructor(world: World);
    /** Lazily built so components defined after plugin install still count. */
    get table(): ReplicationTable;
    /** Track every replicated component, and claim its removal history. */
    private installObservation_;
    /**
     * Close the window this sample read, and open the next one. Retention is
     * given up only after the rows were consumed — the same order a system's
     * `Removed` reader releases in.
     */
    private advanceObservationFloor_;
    /** The registry's window, closed the same way and at the same moment. Two
     *  functions rather than one: the two lifecycles have already diverged once. */
    private advanceRegistryFloor_;
    /**
     * Give back everything this server holds outside itself: its channels, its
     * claims on removal history, and its despawn subscription. Idempotent — the
     * world would otherwise keep a dead server reachable, and its claims would
     * pin removal rows for a session nobody is running.
     */
    dispose(): void;
    get netIds(): NetIds;
    get connectionCount(): number;
    /** Ready (handshaken) connection ids. Gameplay polls this each fixed tick
     *  to provision/retire per-player entities — no callback wiring needed. */
    get clientIds(): number[];
    private get refs_();
    /**
     * Install (or replace / remove) the interest policy. With a policy, each
     * ready connection only receives the entities the policy deems relevant to
     * it; an entity entering a connection's interest arrives as a full spawn,
     * one leaving despawns its client ghost. Entities a connection owns are
     * always relevant to it regardless of the policy. Safe to change
     * mid-session: the next sample tick reconciles every connection's ghost
     * set against the new policy.
     */
    setInterestPolicy(policy: InterestPolicy | null): void;
    /**
     * Install a prepare-once/query-many provider. Shares the slot with
     * {@link setInterestPolicy}: the last non-null setter wins, and null on
     * either disables interest.
     *
     * @experimental
     */
    setInterestProvider(provider: InterestProvider | null): void;
    private setInterest_;
    /** @internal One connection now sees this entity. */
    private watch_;
    /** @internal It no longer does. */
    private unwatch_;
    /** Everything a leaving connection was watching. O(its view), and a detach
     *  is not a steady-state path — twelve enters and leaves a sample are. */
    private forgetViewer_;
    /** Claim the write journal, then seed from what is already known — in that
     *  order, so nothing written between the two is missed. */
    private installOwnerIndex_;
    /** Put `e` under its current owner, taking it off the previous one's set. */
    private indexOwner_;
    /** This connection looks from somewhere else now than it did. */
    private bumpOwned_;
    /** Drop `e` from the index entirely — it has left replication. */
    private unindexOwner_;
    /**
     * Refresh the index from the entities whose `Replicated` was written. Write
     * history SELECTS candidates; the index's own record against the current
     * world DECIDES — a write that did not move ownership costs one comparison.
     */
    private refreshOwnerIndex_;
    private advanceOwnerFloor_;
    /** Accept a transport (server-side end of one client link). */
    attachConnection(transport: ReliableOrderedTransport): number;
    /** Count a refused command, and say so the first time — a drop that only a
     *  counter knows about reads exactly like a healthy connection. */
    private refuseInput_;
    detachConnection(id: number): void;
    /** The latest input command a connection sent (null before the first).
     *  Gameplay reads this in FixedUpdate and applies it to the entities the
     *  connection owns (Replicated.owner). Latest-persists: a held command
     *  applies every tick until replaced. */
    inputOf(connectionId: number): ReplInputMsg | null;
    /**
     * The input command dequeued for THIS fixed tick — each command is
     * consumed exactly once, in order, one per tick ({@link beginTick}); when
     * the queue runs dry the last command repeats (network jitter must not
     * stall a held input). This is the accessor prediction-grade gameplay
     * applies in FixedUpdate: the server acknowledges the consumed seq, and
     * the client replays exactly the unacknowledged commands, one tick each.
     */
    tickInputOf(connectionId: number): ReplInputMsg | null;
    /**
     * Start a fixed tick: dequeue each connection's next input command (the
     * plugin calls this in FixedPreUpdate, before gameplay). `fixedDelta` is
     * remembered for the handshake so clients replay with the server's dt.
     */
    beginTick(fixedDelta: number): void;
    /** One replication tick: spawns/despawns on the control plane, dirty
     *  fields as binary delta frames (one shared broadcast without a policy,
     *  one filtered frame per connection with one). Runs in FixedPostUpdate. */
    sample(tick: number): void;
    /** Fast path (no policy): everything to every ready connection on shared
     *  payloads. Interest bookkeeping stays exact so a policy can be installed
     *  (or removed) mid-session and the next tick reconciles cleanly. */
    private sampleBroadcast_;
    /**
     * Interest path in three parts: visibility, routing, sending.
     *
     * @note Routing is separate because one of the two ways needs every
     *       connection's visibility settled first. A failed send is not rolled
     *       back — that connection is a dead participant (see sendTo_).
     */
    private sampleWithInterest_;
    /**
     * This sample's debt, merged per ENTITY. An entity with two dirty components
     * and a removal is one reverse lookup and one map probe, not three, and the
     * wire still carries removals before the delta.
     */
    private static byEntity;
    /**
     * Which rows each connection owes, by whichever projection of the same truth
     * is smaller THIS sample: pushing costs `U + F`, pulling `S`. No threshold.
     *
     * @note `U + F >= U`, so `U >= S` settles it without measuring F, which
     *       would cost push's dominant term to decide against push.
     */
    private route_;
    /**
     * One snapshot of the interest source, and a function answering per
     * connection from it. A provider prepares ONCE — that is the whole reason
     * it exists — and never sees a materialized candidate array, which is the
     * other O(population) the policy shape forces.
     *
     * `snapshot` is what the source says this snapshot IS, when it says
     * anything. Null means the answers below have to be asked for; a number
     * means a connection whose stamp already carries it holds the same answer.
     */
    private resolveVisibility_;
    /** The policy's answer for one connection, with the server's invariant
     *  applied on top: a connection always sees the entities it owns (input
     *  routing and prediction anchor on them, so a policy cannot cull them). */
    private visibleFor_;
    /**
     * The registry rebuilt against the whole world — a baseline, not a steady
     * state. A reconciliation, not a reconstruction: entities still present keep
     * the netId the clients hold. netIds are captured before unregistering so a
     * per-connection despawn can still name what vanished this tick.
     */
    private reconcileRegistryFromWorld_;
    /**
     * Which entities entered or left replication. Topology history SELECTS
     * candidates; `known × current world` DECIDES: added-and-removed before the
     * sample is one candidate that is neither known nor live, removed-and-re-added
     * is one that is both, and the clients hear about neither.
     */
    private reconcileRegistryIncremental_;
    /**
     * The registry, rebuilt from the world for a client arriving when nothing is
     * ready. `sample` returns early with no connections, so the registry stops
     * following the world — and the initial state is built FROM it. Shadows are
     * re-seeded so the frame after does not re-send what the spawn carried.
     */
    private rebaseRegistry_;
    /**
     * The identity the clients still hold, put back after a re-add blanked it:
     * `Replicated.netId` defaults to 0, and an entity that lost and regained the
     * component inside one window was never seen to leave. Only that blank
     * default is restored; a netId written deliberately is an open question.
     */
    private restoreNetId_;
    private registerEntity_;
    private seedShadow_;
    /**
     * The three contracts a spawn is made of. The baseline is built FROM the
     * table rather than filtered against it: the expensive half of a scene
     * serialization is reading every component the entity has, and none of that
     * work is wanted here.
     */
    private spawnPayload_;
    private rewriteEntityRefs_;
    /** Diff every known entity against its shadow (updating the shadow), and
     *  return this tick's dirty component entries. */
    /**
     * What to put on the wire this sample. History SELECTS candidates; shadow ×
     * current world DECIDES truth — a component removed and re-added between
     * samples is one candidate whose shadow and world both hold it, so it
     * reduces to a field diff, or to nothing if the value came back the same.
     */
    private collectDirty_;
    private sendInitialState_;
    private broadcast_;
    /**
     * Hand one frame to a connection, dropping the connection if it refuses.
     * There is ONE server-global shadow and no replay log, so a connection that
     * misses an authoritative frame can never be brought back into step — the
     * next sample diffs S1→S2 against a client still holding S0.
     */
    private sendTo_;
}

/**
 * @file    client.ts
 * @brief   The replica endpoint. Handshakes schema + ABI, spawns NetGhost
 *          proxies from server spawn batches (via loadComponent, so codecs and
 *          validation are the scene-loading ones), and queues binary delta
 *          frames to apply at the FixedPreUpdate boundary — state lands at a
 *          deterministic point in the frame, not mid-schedule on socket
 *          timing.
 *
 *          With {@link PredictionOptions} enabled, the entities this connection
 *          owns are simulated locally: `sendInput` applies the command to them
 *          immediately (zero perceived latency) and keeps it in a pending
 *          buffer; authoritative state for owned entities lands in a shadow
 *          "authority copy" instead of the live components; each fixed tick the
 *          live state is rebuilt as authority ⊕ replay of the unacknowledged
 *          commands (one server tick each — the server consumes the input
 *          queue at the same cadence, see `tickInputOf`). Mispredictions can
 *          therefore never accumulate: every field snaps back to the last
 *          authoritative value before the replay. Owned entities bypass
 *          snapshot interpolation entirely.
 */

/**
 * Client-side prediction for owned entities. `apply` is the same input-to-
 * state logic the server's gameplay runs (register one function, use it on
 * both ends — the single source of the movement rules); with it enabled,
 * `sendInput` also applies the command locally and unacknowledged commands
 * replay on top of every authoritative update.
 */
interface PredictionOptions {
    /** Advance one owned entity by one fixed tick of `actions`. Must depend
     *  only on world state + actions + dt (it re-runs during reconciliation). */
    apply: (world: World, entity: Entity, actions: Record<string, unknown>, dt: number) => void;
    /** Cap on unacknowledged commands kept for replay (default 120). */
    maxPendingInputs?: number;
    /**
     * Ease reconciliation corrections out instead of hard-snapping: the
     * numeric fields of owned entities keep a decaying visual error toward
     * their pre-correction value. Purely presentational — the simulation
     * rebuilds from the authority copy every tick regardless, so the error can
     * never accumulate. Off by default (corrections snap).
     */
    smoothing?: PredictionSmoothing;
}
/**
 * Ask whether an `apply` is what reconciliation needs it to be.
 *
 * The promise above is the one the rebuild rests on, and until now only a
 * desync could report it broken. Runs the step twice from the same state and
 * takes both back, so a game can ask in a test without paying for it in play.
 *
 * @experimental
 */
declare function predictionReplays(scope: SpeculationScope, prediction: PredictionOptions, entity: Entity, actions: Record<string, unknown>, dt: number): ReplayReport;
interface PredictionSmoothing {
    /** Seconds for the visual error to halve (typical: 0.05–0.15). */
    halfLife: number;
    /**
     * Corrections larger than this (per numeric component) snap immediately —
     * a teleport must look like a teleport. Default: no limit.
     */
    maxError?: number;
}
interface ReplicationClientOptions {
    /**
     * How many server ticks the presented state trails the newest received
     * data. Two ticks absorbs one lost/late delivery without a visible hitch;
     * 0 disables buffering (state applies the moment it drains).
     */
    interpolationDelayTicks?: number;
    /** Enable client-side prediction for the entities this connection owns. */
    prediction?: PredictionOptions;
}
declare class ReplicationClient {
    private readonly world_;
    private readonly netIds_;
    private offDespawn_;
    private channel_;
    private table_;
    private connectionId_;
    private serverTick_;
    /** Everything received since the last fixed step, in ARRIVAL order — one
     *  queue, not one per kind. Sorting by kind reorders across ticks: a leave
     *  at tick N and a re-enter at N+1 arriving together replay as
     *  re-enter-then-leave, and the entity is gone on the client for good. */
    private readonly inbox_;
    private readonly interp_;
    private inputSeq_;
    private prediction_;
    /** Sent-but-unacknowledged input commands, oldest first (replay order). */
    private readonly pendingInputs_;
    private ackedSeq_;
    /** Last authoritative value of every replicated field of every OWNED
     *  entity: netId → componentId → field record. Deltas land here (never in
     *  the live components); reconciliation rebuilds live = this ⊕ replay. */
    private readonly authority_;
    private fixedDelta_;
    constructor(world: World, options?: ReplicationClientOptions);
    get table(): ReplicationTable;
    get netIds(): NetIds;
    get connected(): boolean;
    get connectionId(): number;
    /** The tick stamped on the newest applied state (server time axis). */
    get serverTick(): number;
    private get refs_();
    /** Handshake over the transport; rejects (and detaches) on any mismatch. */
    connect(transport: ReliableOrderedTransport): Promise<void>;
    /** @internal Keep the replay dt in lockstep with the app (plugin-fed). */
    setFixedDelta(dt: number): void;
    get predictionEnabled(): boolean;
    /**
     * Enable (or reconfigure) prediction after construction — the path for
     * game code whose connection a HOST made (the editor's multiplayer
     * preview connects the client realm itself, options-free): call from a
     * fixed-tick system once the session is a client. Owned entities that
     * already spawned get their authority copies seeded from current state.
     */
    enablePrediction(options: PredictionOptions): void;
    disconnect(): void;
    /** Send an input command (typically the InputMap's evaluated action values,
     *  once per fixed tick — with prediction enabled that cadence is the
     *  contract, since the server consumes one command per tick). The seq
     *  stamp makes stale deliveries harmless. With prediction the command also
     *  applies to the owned entities immediately. */
    sendInput(actions: Record<string, unknown>): void;
    /** True when this client's connection owns the entity (Replicated.owner). */
    ownsEntity(entity: Entity): boolean;
    /** Apply everything received since the last fixed step, in the order it
     *  arrived — which is the order the authority sent it. Within one server
     *  tick that is already spawn → remove → despawn → state, so a frame never
     *  precedes the spawn it references and nothing has to be re-sorted here.
     *  With prediction enabled, ends by reconciling every owned entity:
     *  live state ← authority copy ⊕ replay of unacknowledged inputs. */
    applyPending(): void;
    /** Rebuild every owned entity's live state as authority ⊕ pending replay
     *  (⊕ a decaying visual error when smoothing is on). Idempotent modulo the
     *  error decay — it runs unconditionally each fixed step. */
    private reconcilePredicted_;
    private ownedEntities_;
    /** Whether this netId's state is under local prediction (owned + enabled). */
    private isPredicted_;
    /**
     * Three phases, because a payload may name an entity that appears LATER in
     * the same batch — or itself. Register every netId before reading any
     * component data and every reference resolves; hydrating as it goes writes
     * 0 for a forward reference and never revisits it.
     */
    private applySpawnBatch_;
    /** Seed the authority copy for a freshly spawned OWNED entity from its
     *  just-loaded state (the spawn payload IS the authoritative baseline). */
    private seedAuthority_;
    private remapEntityRefs_;
    /** A replicated component left an entity that lives on. The ghost keeps
     *  existing; the component, its interpolation buffer and its authority
     *  snapshot all go. */
    private applyComponentRemoveBatch_;
    private applyDespawnBatch_;
    private applyStateFrame_;
    private updateAuthority_;
    private applyEntryNow_;
    /** Present the buffered state at the trailing render clock. Runs each
     *  render frame (PostUpdate); `deltaTicks` = render delta in tick units. */
    sampleInterpolation(deltaTicks: number): void;
}

/**
 * @file    interpolation.ts
 * @brief   Snapshot interpolation for NetGhost state. Delta frames land as
 *          per-field time series (sparse deltas need no full-snapshot
 *          reconstruction — a field simply has samples at the ticks it
 *          changed); the render clock trails the newest server tick by a
 *          fixed delay and samples each series there, so motion stays smooth
 *          across frame-rate mismatch and delivery jitter. Continuous values
 *          lerp (f32 scalars, f32 leaves of vectors, quats via nlerp);
 *          discrete values hold until their sample time passes.
 */

interface Sample {
    tick: number;
    value: unknown;
}
/** Interpolate between two decoded values of one shape at t ∈ [0,1].
 *  Non-continuous values hold the older sample. */
declare function lerpValue(shape: FieldShape, a: unknown, b: unknown, t: number): unknown;
/** One field's sample series (ticks strictly increasing). */
declare class FieldSeries {
    readonly samples: Sample[];
    push(tick: number, value: unknown): void;
    /** Drop samples that can no longer bracket any time ≥ `beforeTick`
     *  (keep one sample at/below it as the hold/lerp base). */
    trim(beforeTick: number): void;
    /** Sample at time t (in ticks). Returns undefined before the first sample. */
    sample(shape: FieldShape, t: number): unknown;
}
/** All buffered series for one ghost component: fieldIndex → series. */
declare class ComponentBuffer {
    readonly byField: Map<number, FieldSeries>;
    push(fieldIndex: number, tick: number, value: unknown): void;
}
/**
 * The client-side buffer of everything received but not yet (fully) shown.
 * The render clock trails `newestTick` by `delayTicks`, advancing on render
 * time with a soft correction toward the target so delivery jitter bends the
 * clock instead of snapping the world.
 */
declare class InterpolationState {
    delayTicks: number;
    /** netId → componentId → buffer. */
    readonly buffers: Map<number, Map<number, ComponentBuffer>>;
    newestTick: number;
    private renderTime_;
    constructor(delayTicks: number);
    push(netId: number, componentId: number, fieldIndex: number, tick: number, value: unknown): void;
    /** Forget one component's history on one entity — the component left, but
     *  the entity did not. */
    dropComponent(netId: number, componentId: number): void;
    drop(netId: number): void;
    /** Advance the render clock by `deltaTicks` of render time; returns the
     *  time (in server ticks) to sample the series at. */
    advance(deltaTicks: number): number;
}

type NetRoleKind = 'offline' | 'server' | 'client';
declare class NetSession {
    private readonly app_;
    private role_;
    private server_;
    private client_;
    constructor(app_: App);
    get role(): NetRoleKind;
    get server(): ReplicationServer | null;
    get client(): ReplicationClient | null;
    /** Become the authority. Attach one transport per accepted client. */
    startServer(): ReplicationServer;
    /** Become a replica: handshake over the given transport. The role commits
     *  SYNCHRONOUSLY — from this call on, the session never simulates as the
     *  authority, even while the handshake is still in flight. (A role that
     *  only flipped on completion let authority-gated systems run for the
     *  first few ticks of a client realm and spawn local state that then
     *  lingered beside the replicated ghosts.) A failed handshake reverts to
     *  offline. */
    connect(transport: ReliableOrderedTransport, options?: ReplicationClientOptions): Promise<ReplicationClient>;
    stop(): void;
}
declare const Net: ResourceDef<NetSession>;
declare class ReplicationPlugin implements Plugin {
    name: string;
    build(app: App): void;
}
declare const replicationPlugin: ReplicationPlugin;

interface MemoryTransportOptions {
    /** Queue outgoing frames until flush() instead of delivering synchronously. */
    manualFlush?: boolean;
}
declare class MemoryTransport implements ReliableOrderedTransport {
    /** In-process: `flush` delivers the queue in send order, so it models the
     *  real thing rather than being merely convenient. */
    readonly delivery: "reliable-ordered";
    private events_;
    private peer_;
    private readonly manualFlush_;
    private outbox_;
    constructor(options?: MemoryTransportOptions);
    /** Frames sent but not yet delivered (manualFlush mode). */
    get pendingCount(): number;
    on(event: 'message', handler: (data: string | ArrayBuffer) => void): () => void;
    send(data: string | ArrayBuffer): void;
    /** Deliver up to `limit` queued frames to the peer, in send order. */
    flush(limit?: number): void;
    /** Drop queued frames without delivering (packet loss simulation). */
    dropPending(): void;
    static pair(options?: MemoryTransportOptions): [MemoryTransport, MemoryTransport];
}
declare function createMemoryTransportPair(options?: MemoryTransportOptions): [MemoryTransport, MemoryTransport];

/** The minimal MessagePort surface (structural — works for window and worker
 *  ports). A real DOM MessagePort types its `onmessage` against the full
 *  MessageEvent, which mutable-property variance rejects against this shape,
 *  so the constructor also accepts MessagePort directly. */
interface MessagePortLike {
    postMessage(data: unknown): void;
    onmessage: ((event: {
        data: unknown;
    }) => void) | null;
    close?(): void;
}
declare class MessagePortTransport implements ReliableOrderedTransport {
    /** A MessagePort is a FIFO between two realms on one machine. */
    readonly delivery: "reliable-ordered";
    private events_;
    private readonly port_;
    constructor(port: MessagePortLike | MessagePort);
    on(event: 'message', handler: (data: string | ArrayBuffer) => void): () => void;
    send(data: string | ArrayBuffer): void;
    close(): void;
}

export { ByteReader, ByteWriter, ComponentBuffer, FrameWriter, InterpolationState, MemoryTransport, MessagePortTransport, Net, NetGhost, NetIds, NetSession, REPLICATION_CHANNEL, REPLICATION_PROTOCOL_VERSION, ReplMsg, Replicated, ReplicationClient, ReplicationPlugin, ReplicationServer, buildReplicationTable, cloneValue, createMemoryTransportPair, decodeStateFrame, decodeValue, diffSchemas, encodeValue, lerpValue, predictionReplays, radiusInterest, radiusInterestProvider, registerReplicationArchetype, replicationPlugin, shapeSignature, tableSchemas };
export type { EntityRefMap, FieldShape, InterestPoint, InterestPolicy, InterestProvider, InterestProviderPrepareView, InterestProviderQueryView, InterestView, MessagePortLike, NetRoleKind, PredictionOptions, PredictionSmoothing, PreparedInterest, RadiusInterestOptions, ReplAckMsg, ReplComponentRemoveBatch, ReplComponentSchema, ReplDespawnBatch, ReplHelloRequest, ReplHelloResponse, ReplInputMsg, ReplSpawnBatch, ReplSpawnEntity, ReplicatedData, ReplicationArchetype, ReplicationClientOptions, ReplicationTable, ReplicationTableEntry, StateEntry, StateFrame };
