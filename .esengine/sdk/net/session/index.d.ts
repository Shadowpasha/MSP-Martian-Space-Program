import { NetTransport, IdempotencyStore, NetLimitOptions, PayloadCodec, RequestCodec, WireFormat, MessageHandler } from '../../shared/NetChannel.js';
export { IdempotencyBegin, IdempotentOutcome, MemoryIdempotencyOptions, MemoryIdempotencyStore, NET_ATTEMPT_FAILED, NET_RATE_LIMITED, NetChannel, NetChannelOptions, NetHeartbeatOptions, NetRequestError, NetRequestErrorCode, NetViolation, ReliableOrderedTransport, RequestHandler, RequestOptions } from '../../shared/NetChannel.js';
import { PlatformSocket } from '../../shared/resource.js';
export { Rng, RngSeed, createRng, hashSeed } from '../../shared/random.js';
import '../../shared/wasm.js';

/**
 * @file    protocol.ts
 * @brief   The one handshake a session runs before any game request: the client
 *          names itself, the server decides who it is and tells it the time.
 */
/** Bumped when the hello changes shape; a mismatch refuses the connection. */
declare const SESSION_PROTOCOL_VERSION = 1;
/** The request type of the handshake. Nothing else is served before it succeeds. */
declare const SESSION_HELLO = "session:hello";
/** Close codes the server uses, so a client can tell why it was let go. */
declare const SessionCloseCode: {
    /** Another connection for the same player took this one's place. */
    readonly replaced: 4001;
    /** No valid hello arrived in time. */
    readonly helloTimeout: 4002;
    /** The server is full or shutting down; try later. */
    readonly unavailable: 4003;
    /** The peer kept breaking the frame or rate limits. */
    readonly abuse: 4004;
};
interface SessionHelloRequest {
    version: number;
    /** The encoding the client wants to speak after the hello. Absent means JSON. */
    wire?: 'json' | 'pb';
    /** Whatever the game's `authenticate` understands: a token, a device id. */
    credentials: unknown;
}
type SessionHelloResponse = {
    ok: true;
    playerId: string;
    /** The server's clock at the moment it answered, in epoch milliseconds. */
    serverTimeMs: number;
    /** The encoding both ends write from now on. Absent means JSON. */
    wire?: 'json' | 'pb';
    /** Anything the game wants the client to have at once (a renewed token). */
    data?: unknown;
} | {
    ok: false;
    error: string; /** Retrying cannot help; the client stops. */
    fatal: boolean;
};

/**
 * @file    SessionHost.ts
 * @brief   The server end of a player session. It accepts connections from any
 *          transport, serves nothing but the hello until `authenticate` names the
 *          player, then serves the game's handlers with the player's context —
 *          behind frame limits, a rate limit, a heartbeat and a retry-safe
 *          request store. A host holds no game state: every handler gets the
 *          player from its context, so any number of hosts can run side by side.
 */

/** One accepted connection, whatever carries it (a `ws` socket, a test pipe). */
interface AcceptedConnection {
    transport: NetTransport;
    close(code?: number, reason?: string): void;
    /** Called once when the link is gone, from either side. */
    onClose(handler: () => void): () => void;
}
/** What `authenticate` returns: at least who the player is. */
interface SessionContext {
    playerId: string;
}
/** Throw from `authenticate` to refuse a player with a message the client sees. */
declare class SessionRejected extends Error {
    readonly fatal: boolean;
    constructor(message: string, fatal?: boolean);
}
interface SessionHostOptions<Ctx extends SessionContext> {
    /** Turn the hello's credentials into a player, or throw {@link SessionRejected}. */
    authenticate(credentials: unknown, connection: AcceptedConnection): Ctx | Promise<Ctx>;
    /**
     * Where retried requests are remembered. The default lives in this process;
     * give hosts that share players one shared store, or a retry that lands on
     * another host runs twice.
     */
    idempotency?: IdempotencyStore;
    /** Ping each client; `false` turns it off. Default 15 s interval, 45 s timeout. */
    heartbeat?: {
        intervalMs: number;
        timeoutMs: number;
    } | false;
    /** Default 64 KiB frames, 20 messages a second with a burst of 40. */
    limits?: Pick<NetLimitOptions, 'maxFrameBytes' | 'messagesPerSecond' | 'burst'>;
    /** Violations tolerated per minute before the connection is dropped. Default 100. */
    maxViolationsPerMinute?: number;
    /** A connection that has not said hello by now is closed. Default 5 s. */
    helloTimeoutMs?: number;
    /** Most connections at once; the next is refused. Default unlimited. */
    maxSessions?: number;
    /**
     * The encoding players speak after the hello. `'json'` (default) keeps text frames. `'pb'` gives protobuf to every
     * client that asks for it and still lets one ask for JSON, which is how a session is read in a debugger.
     * `'pb-only'` refuses a client that asks for JSON and drops JSON frames afterwards.
     */
    wire?: 'json' | 'pb' | 'pb-only';
    /** Request timeout the channels use for the host's own calls. Default 10 s. */
    requestTimeoutMs?: number;
}
type SessionHandler<Ctx extends SessionContext, Req, Res> = (payload: Req, ctx: Ctx, session: ServerSession<Ctx>) => Res | Promise<Res>;
/** An authenticated player's connection, as a handler sees it. */
interface ServerSession<Ctx extends SessionContext> {
    readonly ctx: Ctx;
    /** Fire-and-forget an event to this player. */
    push(type: string, payload: unknown, codec?: PayloadCodec<never>): void;
    close(code?: number, reason?: string): void;
}
declare class SessionHost<Ctx extends SessionContext = SessionContext> {
    private readonly options_;
    private readonly store_;
    private readonly handlers_;
    private readonly byPlayer_;
    private readonly connections_;
    private closed_;
    constructor(options: SessionHostOptions<Ctx>);
    /** Connections currently open, authenticated or not. */
    get connectionCount(): number;
    /** Players with an authenticated connection to this host. */
    get playerCount(): number;
    /**
     * Serve a request type to every authenticated player. Registered before or
     * after connections arrive; a connection sees the handlers present when its
     * hello succeeded.
     */
    handle<Req = unknown, Res = unknown>(type: string, handler: SessionHandler<Ctx, Req, Res>, codec?: RequestCodec<Req, Res>): () => void;
    /** Send an event to one player if they are connected to this host. */
    push(playerId: string, type: string, payload: unknown, codec?: PayloadCodec<never>): boolean;
    /**
     * Send an event to every authenticated player on this host. Across several
     * hosts, fan out through a shared bus and call this on each; a host does not
     * know about the others.
     */
    broadcast(type: string, payload: unknown, filter?: (ctx: Ctx) => boolean, codec?: PayloadCodec<never>): number;
    /** Take over one connection. Returns at once; everything after runs on events. */
    accept(connection: AcceptedConnection): void;
    /** Close every connection and refuse new ones. */
    close(code?: number, reason?: string): void;
    private makeChannel_;
    private admit_;
}

/**
 * @file    ClientSession.ts
 * @brief   The client end of a player session: one object a game holds for its
 *          whole run, however many times the link underneath drops. It dials,
 *          says hello, redials with backoff when the link is lost, and sends each
 *          request under a key so a retry after a lost reply never runs twice.
 *          Subscriptions made on the session survive every reconnect.
 */

type SessionState = 'idle' | 'connecting' | 'ready' | 'reconnecting' | 'closed';
interface SessionBackoff {
    initialMs?: number;
    maxMs?: number;
    factor?: number;
    /** Fraction of each delay randomised away, 0 to 1. Spreads a crowd's redials. */
    jitter?: number;
}
interface ClientSessionOptions {
    /** A fresh, unopened socket each call (`() => createSocket({ url })`). */
    connect: () => PlatformSocket;
    /** The encoding to ask the server for. Default JSON; the server may not grant protobuf, and the session then speaks JSON. */
    wire?: WireFormat;
    /** Sent in every hello, first dial and redial alike. */
    credentials: () => unknown | Promise<unknown>;
    /** Ping the server; `false` turns it off. Default 15 s interval, 45 s timeout. */
    heartbeat?: {
        intervalMs: number;
        timeoutMs: number;
    } | false;
    backoff?: SessionBackoff;
    /** Extra sends of a request whose outcome was unknown or refused as retryable. Default 3. */
    retries?: number;
    /** Wait before the first retry; doubles each time. Default 300 ms. */
    retryDelayMs?: number;
    /** How long a request waits for the session to be ready before it fails. Default 15 s. */
    readyTimeoutMs?: number;
    /** Per-attempt timeout for a request. Default 10 s. */
    requestTimeoutMs?: number;
    /** Largest frame this side will accept from the server. Default 1 MiB. */
    maxFrameBytes?: number;
    /** For jitter; defaults to Math.random. */
    random?: () => number;
}
interface SessionRequestOptions {
    /** Reuse a key across calls that mean the same intent; default a fresh one per call. */
    idempotencyKey?: string;
    timeoutMs?: number;
    /** Overrides the session's retry count for this call. 0 sends once. */
    retries?: number;
    /** How the payload and the reply travel on the protobuf wire. */
    codec?: RequestCodec<any, any>;
}
interface SessionWelcome {
    playerId: string;
    data?: unknown;
}
type StateHandler = (state: SessionState, reason?: string) => void;
declare class ClientSession {
    private readonly options_;
    private readonly listeners_;
    private readonly eventCodecs_;
    private readonly stateHandlers_;
    private readonly readyWaiters_;
    private state_;
    private socket_;
    private channel_;
    private attached_;
    private attempt_;
    private lastClose_;
    private redialTimer_;
    private offsetMs_;
    private welcome_;
    private firstReady_;
    private keySeq_;
    private readonly keyPrefix_;
    constructor(options: ClientSessionOptions);
    get state(): SessionState;
    /** Who the server says this is, once the first hello has succeeded. */
    get welcome(): SessionWelcome | null;
    /**
     * How the last link ended, until the next one is ready: the WebSocket close code (4003 is the
     * server saying it is full or going away). Null while connected, or when no link has dropped yet.
     */
    get lastClose(): {
        code: number;
    } | null;
    /** Dial attempts since the last time the session was ready; 0 when ready. */
    get attempts(): number;
    /** The server's clock now, in epoch ms, corrected for this device's drift and the link's delay. */
    serverNow(): number;
    /** Observe state changes. Returns an unsubscribe. */
    onState(handler: StateHandler): () => void;
    /** Subscribe to a server-pushed event. Survives reconnects. */
    on<T = unknown>(type: string, handler: MessageHandler<T>, codec?: PayloadCodec<T>): () => void;
    /**
     * Dial and say hello. Resolves with the welcome once; later drops redial by
     * themselves. Rejects if the server refuses the player for good.
     */
    start(): Promise<SessionWelcome>;
    /** Fire-and-forget to the server. Dropped while the link is down. */
    send(type: string, payload: unknown, codec?: PayloadCodec<never>): void;
    /**
     * Ask the server and wait for the answer. Waits for the session to be ready,
     * and when an attempt is lost or told to retry, sends it again under the same
     * key so the server answers once however many times it arrives.
     */
    request<Res = unknown, Req = unknown>(type: string, payload: Req, options?: SessionRequestOptions): Promise<Res>;
    /**
     * Redial now instead of waiting out the backoff, for a player who pressed "try again". Does nothing
     * while a dial is already under way, when the session is ready, or once it has closed for good.
     */
    retryNow(): void;
    /** Leave for good: no redial, requests in flight fail. */
    close(): void;
    private setState_;
    private attach_;
    private dial_;
    private hello_;
    private linkLost_;
    private scheduleRedial_;
    private whenReady_;
    private finish_;
}

/**
 * @file    acceptWebSocket.ts
 * @brief   Hand a server-side WebSocket to a {@link SessionHost}. Written against
 *          the surface of the `ws` package rather than importing it: the game's
 *          server owns its `ws` install, listener, TLS and proxy settings, and
 *          this is only the seam between that socket and a session.
 */

/** The part of a `ws` WebSocket this adapter uses. */
interface WebSocketLike {
    on(event: 'message', listener: (data: unknown, isBinary: boolean) => void): unknown;
    on(event: 'close', listener: () => void): unknown;
    on(event: 'error', listener: (err: unknown) => void): unknown;
    send(data: string | ArrayBufferLike | ArrayBufferView): void;
    close(code?: number, reason?: string): void;
    /** Bytes accepted by `send` but not yet written to the network. */
    readonly bufferedAmount?: number;
    terminate?(): void;
}
interface AcceptWebSocketOptions {
    /** A client this far behind on reading is dropped rather than buffered for. Default 4 MiB. */
    maxBufferedBytes?: number;
}
declare function acceptWebSocket<Ctx extends SessionContext>(host: SessionHost<Ctx>, socket: WebSocketLike, options?: AcceptWebSocketOptions): void;

/**
 * @file    schema.ts
 * @brief   Small runtime validators that also give the TypeScript type. A server
 *          never trusts what a client sent, so each request is parsed against the
 *          same definition the client's types came from — written once.
 */
/** Thrown by `parse` with the path of the first thing that was wrong. */
declare class SchemaError extends Error {
    readonly path: string;
    constructor(path: string, message: string);
}
interface Schema<T> {
    /** Returns a clean copy of `value` typed as `T`, or throws {@link SchemaError}. */
    parse(value: unknown, path?: string): T;
    /** A stable text form, so two builds can tell whether they agree on the shape. */
    describe(): string;
}
/** The TypeScript type a schema parses to. */
type Infer<S> = S extends Schema<infer T> ? T : never;
type Shape = Record<string, Schema<unknown>>;
type OptionalKeys<S extends Shape> = {
    [K in keyof S]: undefined extends Infer<S[K]> ? K : never;
}[keyof S];
type Flat<T> = {
    [K in keyof T]: T[K];
};
type ObjectOf<S extends Shape> = Flat<{
    [K in Exclude<keyof S, OptionalKeys<S>>]: Infer<S[K]>;
} & {
    [K in OptionalKeys<S>]?: Infer<S[K]>;
}>;
declare const s: {
    string(opts?: {
        min?: number;
        max?: number;
        pattern?: RegExp;
    }): Schema<string>;
    int(opts?: {
        min?: number;
        max?: number;
    }): Schema<number>;
    number(opts?: {
        min?: number;
        max?: number;
    }): Schema<number>;
    boolean(): Schema<boolean>;
    literal<const T extends string | number | boolean | null>(value: T): Schema<T>;
    /** One of a fixed list of strings. */
    enum<const T extends readonly [string, ...string[]]>(values: T): Schema<T[number]>;
    array<T>(item: Schema<T>, opts?: {
        max?: number;
    }): Schema<T[]>;
    /** An object with exactly these keys; any other key in the input is dropped. */
    object<S extends Shape>(shape: S): Schema<ObjectOf<S>>;
    /** An object used as a map from string keys to one kind of value. */
    record<T>(value: Schema<T>, opts?: {
        maxKeys?: number;
    }): Schema<Record<string, T>>;
    optional<T>(inner: Schema<T>): Schema<T | undefined>;
    nullable<T>(inner: Schema<T>): Schema<T | null>;
    /** Anything JSON can carry. Use sparingly: nothing about it is checked. */
    unknown(): Schema<unknown>;
};

/** What the generator writes for each message: a codec, plus a text naming its fields. */
interface ProtoMessage<T> extends PayloadCodec<T> {
    /** The message's fields written as text, so two builds can tell whether they agree. */
    readonly shape: string;
}
interface ProtoSchema<T> extends Schema<T> {
    readonly codec: PayloadCodec<T>;
}
/**
 * Use a generated message as a request, reply or event type. A value that reaches the contract has
 * already been read and checked by the message's own codec, so `check` is for what a `.proto` cannot say:
 * ranges, lengths, relations between fields. Throw from it to refuse.
 */
declare function proto<T>(message: ProtoMessage<T>, check?: (value: T) => void): ProtoSchema<T>;
/**
 * Use a generated message as the wire form of a type the game already has. `view.to` turns the game's value into
 * the message to send, `view.from` the message that arrived into the game's value, so game code keeps its own types
 * (string unions, records) and only the contract knows the message. `check` runs on the game's value.
 */
declare function protoAs<T, W>(message: ProtoMessage<W>, view: {
    to(value: T): W;
    from(wire: W): T;
}, check?: (value: T) => void): ProtoSchema<T>;
/** Plain JSON in both directions: stands in for the side of a request that is not a `proto`. */
declare const jsonCodec: PayloadCodec;

/**
 * @file    contract.ts
 * @brief   One definition of every request and event a game's client and server
 *          exchange. The server's handlers and the client's calls are typed from
 *          it, requests are checked on arrival, and replies are checked on
 *          receipt — so a client built before a change cannot half-understand a
 *          server built after it.
 */

interface RequestDef<Req = unknown, Res = unknown> {
    req: Schema<Req>;
    res: Schema<Res>;
}
type RequestDefs = Record<string, RequestDef<any, any>>;
type EventDefs = Record<string, Schema<any>>;
type ReqOf<D> = D extends RequestDef<infer Q, unknown> ? Q : never;
type ResOf<D> = D extends RequestDef<unknown, infer R> ? R : never;
/** What the server writes for each request: the parsed payload in, the reply out. */
type ContractImpl<R extends RequestDefs, Ctx extends SessionContext> = {
    [K in keyof R]: (payload: ReqOf<R[K]>, ctx: Ctx, session: ServerSession<Ctx>) => ResOf<R[K]> | Promise<ResOf<R[K]>>;
};
/** What the client calls for each request. */
type ContractClient<R extends RequestDefs> = {
    [K in keyof R]: (payload: ReqOf<R[K]>, options?: SessionRequestOptions) => Promise<ResOf<R[K]>>;
};
interface Contract<R extends RequestDefs, E extends EventDefs> {
    /**
     * A short stable text for the whole definition. Send it in the hello's
     * credentials and compare on the server to turn away a client built against
     * a different contract, instead of failing on its first odd request.
     */
    readonly fingerprint: string;
    /** Register every request on the host, each checked against its schema. */
    serve<Ctx extends SessionContext>(host: SessionHost<Ctx>, impl: ContractImpl<R, Ctx>): () => void;
    /** Typed calls over a session; replies are checked before they are returned. */
    client(session: ClientSession): ContractClient<R>;
    /** Send a typed event to one player. */
    push<K extends keyof E & string>(host: SessionHost<never>, playerId: string, type: K, payload: Infer<E[K]>): boolean;
    /** Send a typed event to every player on the host. */
    broadcast<K extends keyof E & string, Ctx extends SessionContext>(host: SessionHost<Ctx>, type: K, payload: Infer<E[K]>, filter?: (ctx: Ctx) => boolean): number;
    /** Subscribe to a typed event on the client; payloads are checked before the handler sees them. */
    on<K extends keyof E & string>(session: ClientSession, type: K, handler: MessageHandler<Infer<E[K]>>): () => void;
}
declare function defineContract<R extends RequestDefs, E extends EventDefs = Record<never, never>>(def: {
    requests: R;
    events?: E;
}): Contract<R, E>;

export { ClientSession, IdempotencyStore, MessageHandler, NetLimitOptions, NetTransport, PayloadCodec, RequestCodec, SESSION_HELLO, SESSION_PROTOCOL_VERSION, SchemaError, SessionCloseCode, SessionHost, SessionRejected, WireFormat, acceptWebSocket, defineContract, jsonCodec, proto, protoAs, s };
export type { AcceptWebSocketOptions, AcceptedConnection, ClientSessionOptions, Contract, ContractClient, ContractImpl, Infer, ProtoMessage, ProtoSchema, RequestDef, Schema, ServerSession, SessionBackoff, SessionContext, SessionHandler, SessionHelloRequest, SessionHelloResponse, SessionHostOptions, SessionRequestOptions, SessionState, SessionWelcome, WebSocketLike };
