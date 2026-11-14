/**
 * @file    IdempotencyStore.ts
 * @brief   Remembers what a request answered, so a retry of the same request
 *          returns that answer instead of running the handler a second time.
 *          A request that spends something (a purchase, a departure) must not
 *          run twice because a reply was lost on the way back.
 */
/** What a handler returned, as it went on the wire. */
interface IdempotentOutcome {
    d?: unknown;
}
type IdempotencyBegin = 
/** First sight of the key: run the handler, then call `finish` or `abandon`. */
{
    state: 'new';
}
/** Already answered: reply with this and do not run the handler. */
 | {
    state: 'done';
    outcome: IdempotentOutcome;
}
/** Another call with this key is running; resolves with its outcome. */
 | {
    state: 'busy';
    outcome: Promise<IdempotentOutcome | null>;
};
/**
 * The seam a server plugs a shared store into (Redis, a database row) when
 * retries can land on a different process than the original. The store in this
 * file keeps keys in one process's memory.
 */
interface IdempotencyStore {
    begin(key: string): IdempotencyBegin | Promise<IdempotencyBegin>;
    /** Keep the outcome for later retries. */
    finish(key: string, outcome: IdempotentOutcome): void | Promise<void>;
    /** The handler failed unexpectedly: free the key so a retry runs again. */
    abandon(key: string): void | Promise<void>;
}
interface MemoryIdempotencyOptions {
    /** How long an answer is remembered. Default 10 minutes. */
    ttlMs?: number;
    /** The most answers kept; the oldest go first. Default 100,000. */
    maxEntries?: number;
    /** Clock, for tests. */
    now?: () => number;
}
declare class MemoryIdempotencyStore implements IdempotencyStore {
    private readonly entries_;
    private readonly ttl_;
    private readonly max_;
    private readonly now_;
    constructor(options?: MemoryIdempotencyOptions);
    get size(): number;
    begin(key: string): IdempotencyBegin;
    finish(key: string, outcome: IdempotentOutcome): void;
    abandon(key: string): void;
    private evict_;
}

/** Which encoding a channel writes. It reads both. */
type WireFormat = 'json' | 'pb';
/**
 * How one message type's payload becomes bytes (protobuf wire) or JSON (the debugging wire).
 * A generated protobuf message is one, as it stands.
 */
interface PayloadCodec<T = unknown> {
    encode(value: T): Uint8Array;
    decode(bytes: Uint8Array): T;
    /** The value as JSON-safe data; the debugging wire carries this. */
    toJSON(value: T): unknown;
    /** Check JSON-safe data and rebuild the value; throws on anything that is not the message. */
    fromJSON(json: unknown): T;
}

/** The codecs of one request: how its payload and its answer travel. */
interface RequestCodec<Req = unknown, Res = unknown> {
    req: PayloadCodec<Req>;
    res: PayloadCodec<Res>;
}
/** The minimal socket surface NetChannel drives (GameSocket / WeChatSocket fit). */
interface NetTransport {
    send(data: string | ArrayBuffer): void;
    /** Subscribe to incoming frames. Returns an unsubscribe function. */
    on(event: 'message', handler: (data: string | ArrayBuffer) => void): () => void;
}
/**
 * A transport that delivers every frame, once, in send order. {@link NetChannel}
 * needs no such promise; replication does — its client applies the inbox in
 * ARRIVAL order because that IS the authority's order. Declaring the marker is
 * a claim about the link, not a feature to switch on.
 */
interface ReliableOrderedTransport extends NetTransport {
    readonly delivery: 'reliable-ordered';
}
type MessageHandler<T = unknown> = (payload: T) => void;
type RequestHandler<Req = unknown, Res = unknown> = (payload: Req) => Res | Promise<Res>;
type BinaryHandler = (payload: Uint8Array) => void;
/** What the peer answers when it refuses a message for coming too fast. */
declare const NET_RATE_LIMITED = "rate limited";
/** What the peer answers a retry whose first attempt threw: the key is free, send it again. */
declare const NET_ATTEMPT_FAILED = "the first attempt failed, retry";
/**
 * Why a request did not return a value.
 *
 * - `timeout`: no answer in time; the peer may or may not have run it.
 * - `closed`: the channel went away with the request in flight; same doubt.
 * - `rate-limited` / `retry`: the peer ran nothing and says to send it again.
 * - `remote`: the peer's handler threw, or has none; its message is in `message`.
 */
type NetRequestErrorCode = 'timeout' | 'closed' | 'rate-limited' | 'retry' | 'remote';
declare class NetRequestError extends Error {
    readonly code: NetRequestErrorCode;
    constructor(message: string, code: NetRequestErrorCode);
    /** True when sending the same request again, with the same key, is safe. */
    get retryable(): boolean;
}
/** Why a channel dropped or refused something the peer sent. */
type NetViolation = 'frame-size' | 'rate' | 'wire';
interface NetHeartbeatOptions {
    /** How often to ping the peer. */
    intervalMs: number;
    /** Silence longer than this (no frame of any kind) means the peer is gone. */
    timeoutMs: number;
    /** Called once, when the peer has been silent for `timeoutMs`. */
    onDead: () => void;
}
interface NetLimitOptions {
    /** Larger frames are dropped before they are parsed. Binary frames count too. */
    maxFrameBytes?: number;
    /** Sustained control messages (events and requests) per second. Binary frames are not limited. */
    messagesPerSecond?: number;
    /** Messages allowed at once before the sustained rate applies. Default: one second's worth. */
    burst?: number;
    /** Called for every dropped frame or refused message. */
    onViolation?: (kind: NetViolation) => void;
}
interface NetChannelOptions {
    /** Default RPC timeout in ms (0 disables). Default 10000. */
    requestTimeoutMs?: number;
    /**
     * Answer a retried request from memory. Only requests that carry a key
     * (`idempotencyKey` on the sender) are looked up; the rest run as before.
     */
    idempotency?: IdempotencyStore;
    /** Prefixes every key so two players cannot collide on one. Usually the player id. */
    idempotencyScope?: string;
    /** Ping the peer and report when it goes silent. */
    heartbeat?: NetHeartbeatOptions;
    limits?: NetLimitOptions;
}
interface RequestOptions {
    /** RPC timeout in ms (0 disables). */
    timeoutMs?: number;
    /**
     * Names this intent. A retry with the same key gets the first attempt's
     * answer instead of running the handler again. One key per intent (one
     * click), not per attempt.
     */
    idempotencyKey?: string;
    /** How the payload and the answer travel on the protobuf wire; the JSON wire carries their JSON form. */
    codec?: RequestCodec<any, any>;
}
/**
 * Typed messaging over a {@link NetTransport}. Subscribes to the transport's
 * `message` events (it is the message router). Events are fire-and-forget;
 * requests await a matching response by id (or reject on timeout / remote
 * error).
 *
 * Two planes share the one transport: string frames carry the JSON control
 * envelope; binary frames carry a 1-byte channel id + payload for high-rate
 * data (replication snapshots claim channel 1). A binary frame with no
 * registered channel handler is dropped.
 */
declare class NetChannel {
    private readonly transport;
    private readonly handlers;
    private readonly requestHandlers;
    private readonly eventCodecs;
    private wire_;
    private jsonAllowed_;
    private readonly binaryHandlers;
    private readonly pending;
    private readonly defaultTimeout;
    private readonly offMessage_;
    private readonly idempotency_;
    private scope_;
    private readonly limits_;
    private readonly bucketCapacity_;
    private heartbeatTimer_;
    private bucket_;
    private bucketAt_;
    private lastHeard_;
    private nextId;
    private nextPing_;
    constructor(transport: NetTransport, opts?: NetChannelOptions);
    /** Subscribe to a typed event. Returns an unsubscribe function. */
    on<T = unknown>(type: string, handler: MessageHandler<T>, codec?: PayloadCodec<T>): () => void;
    /** Fire-and-forget a typed event to the peer. */
    send<T = unknown>(type: string, payload: T, codec?: PayloadCodec<T>): void;
    /** The encoding this channel writes. It reads both. */
    get wire(): WireFormat;
    /**
     * Choose what this channel writes from now on. `acceptJson: false` makes it refuse JSON frames
     * from the peer (counted as a `wire` violation), for a server that has agreed on protobuf.
     */
    setWire(format: WireFormat, options?: {
        acceptJson?: boolean;
    }): void;
    /** Register the single handler that answers `request(type, …)` from the peer.
     *  Returns an unregister function. */
    handle<Req = unknown, Res = unknown>(type: string, handler: RequestHandler<Req, Res>, codec?: RequestCodec<Req, Res>): () => void;
    /**
     * Send a request and await the peer's response (rejects on timeout / remote
     * error). A number is the timeout in ms; an options object adds an
     * idempotency key.
     */
    request<Res = unknown, Req = unknown>(type: string, payload: Req, options?: number | RequestOptions): Promise<Res>;
    /** Register the single handler for a binary channel id (0-254; 255 carries control messages on the protobuf wire). Returns an
     *  unregister function. */
    onBinary(channel: number, handler: BinaryHandler): () => void;
    /** Fire-and-forget a binary payload on a channel id (0-254; 255 carries control messages on the protobuf wire). */
    sendBinary(channel: number, payload: Uint8Array): void;
    /**
     * Scope later idempotency keys to this owner. A server knows the player only
     * after the hello, so the scope is set once the connection has authenticated.
     */
    setIdempotencyScope(scope: string): void;
    /** Reject all in-flight requests and drop handlers (call on disconnect). */
    dispose(reason?: string): void;
    /** Write one control message in this channel's wire; `codec` is how its payload travels. */
    private send_;
    private startHeartbeat_;
    /** Spend one message from the bucket; false when the peer is over its rate. */
    private admit_;
    private handleIncoming_;
    private dispatchEvent_;
    private handleRequest_;
    /**
     * Run a keyed request at most once to completion. A handler that returns has
     * its answer kept, so a retry replays it; one that throws frees the key and
     * the retry runs again — a business refusal belongs in the return value.
     * The answer is kept in its JSON form, which any store can hold and either wire can rebuild.
     */
    private handleIdempotent_;
    private resolvePending_;
}

export { MemoryIdempotencyStore, NET_ATTEMPT_FAILED, NET_RATE_LIMITED, NetChannel, NetRequestError };
export type { BinaryHandler, IdempotencyBegin, IdempotencyStore, IdempotentOutcome, MemoryIdempotencyOptions, MessageHandler, NetChannelOptions, NetHeartbeatOptions, NetLimitOptions, NetRequestErrorCode, NetTransport, NetViolation, PayloadCodec, ReliableOrderedTransport, RequestCodec, RequestHandler, RequestOptions, WireFormat };
