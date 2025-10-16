import type { OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import type { ClientOptions } from "@modelcontextprotocol/sdk/client/index.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import type { SSEClientTransportOptions } from "@modelcontextprotocol/sdk/client/sse.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import type { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  getDefaultEnvironment,
  StdioClientTransport,
} from "@modelcontextprotocol/sdk/client/stdio.js";
import type {
  StreamableHTTPClientTransportOptions,
  StreamableHTTPReconnectionOptions,
} from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { RequestOptions } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { Transport } from "@modelcontextprotocol/sdk/shared/transport.js";

type ClientCapabilityOptions = NonNullable<ClientOptions["capabilities"]>;
type NotificationSchema = Parameters<Client["setNotificationHandler"]>[0];
type NotificationHandler = Parameters<Client["setNotificationHandler"]>[1];

export type McpConnectionStatus = "connected" | "connecting" | "disconnected";

export type McpServerStatusUpdate = {
  serverId: string;
  status: McpConnectionStatus;
  error?: unknown;
};

export type McpServerErrorPhase =
  | "connect"
  | "transport"
  | "runtime"
  | "request";

export type McpServerErrorDetails = {
  serverId: string;
  error: unknown;
  phase: McpServerErrorPhase;
  action?: string;
};

export type McpClientIdentity = {
  name: string;
  version: string;
};

type BaseServerConfig = {
  timeoutMs?: number;
  capabilities?: ClientCapabilityOptions;
  client?: Partial<McpClientIdentity>;
  authProvider?: OAuthClientProvider;
};

export type StdioServerConfig = BaseServerConfig & {
  transport: "stdio";
  command: string;
  args?: string[];
  env?: Record<string, string>;
  cwd?: string;
  stderr?: StdioServerParameters["stderr"];
  onStderrData?: (data: string) => void;
};

export type HttpServerConfig = BaseServerConfig & {
  transport: "http";
  url: string;
  requestInit?: StreamableHTTPClientTransportOptions["requestInit"];
  reconnectionOptions?: StreamableHTTPReconnectionOptions;
  sessionId?: string;
  fetch?: StreamableHTTPClientTransportOptions["fetch"];
  preferSse?: boolean;
  allowSseFallback?: boolean;
  sse?: Pick<SseServerConfig, "eventSourceInit" | "requestInit" | "fetch">;
};

export type SseServerConfig = BaseServerConfig & {
  transport: "sse";
  url: string;
  eventSourceInit?: SSEClientTransportOptions["eventSourceInit"];
  requestInit?: SSEClientTransportOptions["requestInit"];
  fetch?: SSEClientTransportOptions["fetch"];
};

export type McpServerConfig =
  | StdioServerConfig
  | HttpServerConfig
  | SseServerConfig;

type ManagedClientState = {
  config: McpServerConfig;
  timeoutMs: number;
  status: McpConnectionStatus;
  client?: Client;
  transport?: Transport;
  pending?: Promise<Client>;
  lastError?: string;
};

type NotificationEntry = {
  schema: NotificationSchema;
  handlers: Set<NotificationHandler>;
};

type NotificationRegistry = Map<string, NotificationEntry>;

export type McpClientManagerOptions = {
  defaultIdentity?: McpClientIdentity;
  defaultCapabilities?: ClientCapabilityOptions;
  defaultTimeoutMs?: number;
  onStatusChange?: (update: McpServerStatusUpdate) => void;
  onError?: (details: McpServerErrorDetails) => void;
};

const textDecoder = new TextDecoder();
const DEFAULT_TIMEOUT_MS = 10_000;

export class McpClientManager {
  private readonly options: McpClientManagerOptions;
  private readonly states = new Map<string, ManagedClientState>();
  private readonly notificationHandlers = new Map<
    string,
    NotificationRegistry
  >();

  constructor(
    servers: Record<string, McpServerConfig> = {},
    options: McpClientManagerOptions = {}
  ) {
    this.options = options;
    for (const [serverId, config] of Object.entries(servers)) {
      this.registerServer(serverId, config);
    }
  }

  registerServer(serverId: string, config: McpServerConfig): void {
    const timeoutMs =
      config.timeoutMs ?? this.options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    const existing = this.states.get(serverId);
    if (existing?.client) {
      this.disconnectServer(serverId).catch((error: unknown) => {
        this.emitError({
          serverId,
          error,
          phase: "runtime",
          action: "disconnect",
        });
      });
    }
    this.states.set(serverId, {
      config,
      timeoutMs,
      status: "disconnected",
      lastError: undefined,
    });
  }

  updateServer(serverId: string, config: McpServerConfig): void {
    if (!this.states.has(serverId)) {
      throw new Error(`Unknown MCP server "${serverId}".`);
    }
    this.registerServer(serverId, config);
  }

  async connectServer(serverId: string): Promise<Client> {
    const state = this.states.get(serverId);
    if (!state) {
      throw new Error(`Unknown MCP server "${serverId}".`);
    }
    if (state.client) {
      return state.client;
    }
    if (state.pending) {
      return state.pending;
    }

    const pending = this.openConnection(serverId, state);
    state.pending = pending;
    this.states.set(serverId, state);
    this.updateStatus(serverId, "connecting");

    try {
      const client = await pending;
      return client;
    } finally {
      state.pending = undefined;
    }
  }

  async disconnectServer(serverId: string): Promise<void> {
    const state = this.states.get(serverId);
    if (!state) {
      return;
    }
    const pending = state.pending;
    if (pending) {
      try {
        await pending;
      } catch {
        // Ignored: pending rejects are handled by openConnection.
      }
    }
    const { client, transport } = state;
    state.client = undefined;
    state.transport = undefined;
    state.status = "disconnected";
    state.lastError = undefined;
    this.states.set(serverId, state);
    if (client) {
      await client.close();
    }
    if (transport) {
      await this.safeCloseTransport(transport);
    }
    this.updateStatus(serverId, "disconnected");
  }

  async removeServer(serverId: string): Promise<void> {
    await this.disconnectServer(serverId);
    this.states.delete(serverId);
    this.notificationHandlers.delete(serverId);
  }

  getServerStatus(serverId: string): McpConnectionStatus {
    const state = this.states.get(serverId);
    return state?.status ?? "disconnected";
  }

  getServerConfig(serverId: string): McpServerConfig | undefined {
    return this.states.get(serverId)?.config;
  }

  listServers(): string[] {
    return [...this.states.keys()];
  }

  async reconnectServer(serverId: string): Promise<Client> {
    await this.disconnectServer(serverId);
    return await this.connectServer(serverId);
  }

  async reconnectAll(): Promise<void> {
    await Promise.all(
      this.listServers().map(async (serverId) => this.reconnectServer(serverId))
    );
  }

  async disconnectAll(): Promise<void> {
    await Promise.all(
      this.listServers().map(async (serverId) =>
        this.disconnectServer(serverId)
      )
    );
  }

  async listTools(serverId: string, options?: RequestOptions) {
    const client = await this.ensureClient(serverId);
    return await client.listTools(
      undefined,
      this.withTimeout(serverId, options)
    );
  }

  async getTools(
    serverId: string | string[] | undefined,
    options?: RequestOptions
  ) {
    let targetIds: string[];
    if (Array.isArray(serverId)) {
      targetIds = serverId;
    } else if (typeof serverId === "string") {
      targetIds = [serverId];
    } else {
      targetIds = this.listServers();
    }
    const results = await Promise.all(
      targetIds.map(async (id) => {
        const client = await this.ensureClient(id);
        return await client.listTools(undefined, this.withTimeout(id, options));
      })
    );
    return {
      tools: results.flatMap((result) => result.tools),
    };
  }

  async callTool(
    serverId: string,
    name: string,
    args: Record<string, unknown> | undefined,
    options?: RequestOptions
  ) {
    const client = await this.ensureClient(serverId);
    try {
      return await client.callTool(
        { name, arguments: args },
        undefined,
        this.withTimeout(serverId, options)
      );
    } catch (error) {
      this.emitError({
        serverId,
        error,
        phase: "request",
        action: `tools/call:${name}`,
      });
      throw error;
    }
  }

  async listResources(serverId: string, options?: RequestOptions) {
    const client = await this.ensureClient(serverId);
    return await client.listResources(
      undefined,
      this.withTimeout(serverId, options)
    );
  }

  async listResourceTemplates(serverId: string, options?: RequestOptions) {
    const client = await this.ensureClient(serverId);
    return await client.listResourceTemplates(
      undefined,
      this.withTimeout(serverId, options)
    );
  }

  async readResource(
    serverId: string,
    params: Parameters<Client["readResource"]>[0],
    options?: RequestOptions
  ) {
    const client = await this.ensureClient(serverId);
    return await client.readResource(
      params,
      this.withTimeout(serverId, options)
    );
  }

  async subscribeResource(
    serverId: string,
    params: Parameters<Client["subscribeResource"]>[0],
    options?: RequestOptions
  ) {
    const client = await this.ensureClient(serverId);
    return await client.subscribeResource(
      params,
      this.withTimeout(serverId, options)
    );
  }

  async unsubscribeResource(
    serverId: string,
    params: Parameters<Client["unsubscribeResource"]>[0],
    options?: RequestOptions
  ) {
    const client = await this.ensureClient(serverId);
    return await client.unsubscribeResource(
      params,
      this.withTimeout(serverId, options)
    );
  }

  async listPrompts(serverId: string, options?: RequestOptions) {
    const client = await this.ensureClient(serverId);
    return await client.listPrompts(
      undefined,
      this.withTimeout(serverId, options)
    );
  }

  async getPrompt(
    serverId: string,
    params: Parameters<Client["getPrompt"]>[0],
    options?: RequestOptions
  ) {
    const client = await this.ensureClient(serverId);
    return await client.getPrompt(params, this.withTimeout(serverId, options));
  }

  async ping(serverId: string, options?: RequestOptions) {
    const client = await this.ensureClient(serverId);
    try {
      await client.ping(this.withTimeout(serverId, options));
    } catch (error) {
      this.emitError({
        serverId,
        error,
        phase: "request",
        action: "ping",
      });
      throw error;
    }
  }

  getClient(serverId: string): Client | undefined {
    return this.states.get(serverId)?.client;
  }

  getServerSummaries(): McpServerSummary[] {
    return this.listServers().map((serverId) => {
      const state = this.states.get(serverId);
      if (!state) {
        throw new Error(`Unknown MCP server "${serverId}".`);
      }
      return {
        id: serverId,
        status: state.status,
        config: state.config,
        lastError: state.lastError,
      };
    });
  }

  addNotificationHandler(
    serverId: string,
    schema: NotificationSchema,
    handler: NotificationHandler
  ): void {
    const method = this.getNotificationMethod(schema);
    if (!method) {
      throw new Error("Notification schema must include a literal method.");
    }
    const registry = this.notificationHandlers.get(serverId) ?? new Map();
    const entry = registry.get(method) ?? {
      schema,
      handlers: new Set<NotificationHandler>(),
    };
    entry.handlers.add(handler);
    registry.set(method, entry);
    this.notificationHandlers.set(serverId, registry);

    const client = this.states.get(serverId)?.client;
    if (client) {
      client.setNotificationHandler(
        entry.schema,
        this.createNotificationDispatcher(serverId, method)
      );
    }
  }

  removeNotificationHandler(
    serverId: string,
    schema: NotificationSchema,
    handler: NotificationHandler
  ): void {
    const registry = this.notificationHandlers.get(serverId);
    if (!registry) {
      return;
    }
    const method = this.getNotificationMethod(schema);
    if (!method) {
      return;
    }
    const entry = registry.get(method);
    if (!entry) {
      return;
    }
    entry.handlers.delete(handler);
    if (entry.handlers.size === 0) {
      registry.delete(method);
      const client = this.states.get(serverId)?.client;
      if (client) {
        client.removeNotificationHandler(method);
      }
    }
    if (registry.size === 0) {
      this.notificationHandlers.delete(serverId);
    }
  }

  private async ensureClient(serverId: string): Promise<Client> {
    const state = this.states.get(serverId);
    if (!state) {
      throw new Error(`Unknown MCP server "${serverId}".`);
    }
    if (state.client) {
      return state.client;
    }
    return await this.connectServer(serverId);
  }

  private async openConnection(
    serverId: string,
    state: ManagedClientState
  ): Promise<Client> {
    const clientIdentity = this.resolveIdentity(serverId, state.config);
    const capabilities = this.resolveCapabilities(state.config);
    const client = new Client(clientIdentity, { capabilities });

    client.onclose = () => {
      const current = this.states.get(serverId);
      if (!current) {
        return;
      }
      current.client = undefined;
      current.transport = undefined;
      current.status = "disconnected";
      this.states.set(serverId, current);
      this.updateStatus(serverId, "disconnected");
    };

    client.onerror = (error) => {
      this.emitError({
        serverId,
        error,
        phase: "runtime",
      });
    };

    const transport = await this.createTransport(serverId, state.config);

    try {
      await client.connect(transport, { timeout: state.timeoutMs });
    } catch (error) {
      await this.safeCloseTransport(transport);
      this.emitError({
        serverId,
        error,
        phase: "connect",
      });
      throw error;
    }

    state.client = client;
    state.transport = transport;
    state.status = "connected";
    state.lastError = undefined;
    this.states.set(serverId, state);
    this.applyNotificationHandlers(serverId, client);
    this.updateStatus(serverId, "connected");
    return client;
  }

  private resolveIdentity(
    serverId: string,
    config: McpServerConfig
  ): McpClientIdentity {
    const defaults = this.options.defaultIdentity ?? {
      name: "mcp-client",
      version: "1.0.0",
    };
    return {
      name: config.client?.name ?? defaults.name ?? serverId,
      version: config.client?.version ?? defaults.version,
    };
  }

  private resolveCapabilities(
    config: McpServerConfig
  ): ClientCapabilityOptions {
    const defaults = this.options.defaultCapabilities ?? {};
    return {
      ...defaults,
      ...(config.capabilities ?? {}),
    };
  }

  private async createTransport(
    serverId: string,
    config: McpServerConfig
  ): Promise<Transport> {
    switch (config.transport) {
      case "stdio": {
        const transport = new StdioClientTransport({
          command: config.command,
          args: config.args,
          cwd: config.cwd,
          env: {
            ...getDefaultEnvironment(),
            ...(config.env ?? {}),
          },
          stderr: config.stderr ?? "pipe",
        });
        const stderrStream = transport.stderr;
        if (stderrStream && config.onStderrData) {
          stderrStream.on("data", (chunk: unknown) => {
            const value = this.decodeChunk(chunk);
            if (value) {
              config.onStderrData?.(value);
            }
          });
        }
        transport.onclose = () => {
          this.handleTransportClose(serverId);
        };
        transport.onerror = (error) => {
          this.emitError({
            serverId,
            error,
            phase: "transport",
          });
          this.handleTransportClose(serverId, error);
        };
        await transport.start();
        return transport;
      }
      case "sse": {
        const url = this.createUrl(config.url);
        const transport = new SSEClientTransport(url, {
          authProvider: config.authProvider,
          eventSourceInit: config.eventSourceInit,
          requestInit: config.requestInit,
          fetch: config.fetch,
        });
        this.attachStreamingHandlers(serverId, transport);
        return transport;
      }
      case "http": {
        const url = this.createUrl(config.url);
        if (config.preferSse) {
          return this.createSseTransport(serverId, url, config);
        }
        try {
          const transport = new StreamableHTTPClientTransport(url, {
            authProvider: config.authProvider,
            requestInit: config.requestInit,
            reconnectionOptions: config.reconnectionOptions,
            sessionId: config.sessionId,
            fetch: config.fetch,
          });
          this.attachStreamingHandlers(serverId, transport);
          return transport;
        } catch (error) {
          if (config.allowSseFallback === false) {
            throw error;
          }
          this.emitError({
            serverId,
            error,
            phase: "transport",
            action: "streamable-http",
          });
          return this.createSseTransport(serverId, url, config);
        }
      }
      default:
        throw new Error(`Unsupported transport for server "${serverId}".`);
    }
  }

  private createUrl(value: string): URL {
    try {
      return new URL(value);
    } catch (error) {
      throw new Error(`Invalid server URL: ${value}`, { cause: error });
    }
  }

  private decodeChunk(chunk: unknown): string | undefined {
    if (typeof chunk === "string") {
      return chunk;
    }
    if (chunk instanceof Uint8Array) {
      return textDecoder.decode(chunk);
    }
    if (
      chunk &&
      typeof (chunk as { toString?: () => string }).toString === "function"
    ) {
      return (chunk as { toString: () => string }).toString();
    }
    return;
  }

  private createSseTransport(
    serverId: string,
    url: URL,
    config: HttpServerConfig
  ): Transport {
    const transport = new SSEClientTransport(url, {
      authProvider: config.authProvider,
      eventSourceInit: config.sse?.eventSourceInit,
      requestInit: config.sse?.requestInit,
      fetch: config.sse?.fetch,
    });
    this.attachStreamingHandlers(serverId, transport);
    return transport;
  }

  private attachStreamingHandlers(serverId: string, transport: Transport) {
    transport.onclose = () => {
      this.handleTransportClose(serverId);
    };
    transport.onerror = (error: Error) => {
      this.emitError({
        serverId,
        error,
        phase: "transport",
      });
      this.handleTransportClose(serverId, error);
    };
  }

  private handleTransportClose(serverId: string, error?: unknown) {
    const state = this.states.get(serverId);
    if (!state) {
      return;
    }
    state.transport = undefined;
    state.client = undefined;
    state.status = "disconnected";
    if (error) {
      state.lastError = this.stringifyError(error);
    }
    this.states.set(serverId, state);
    this.updateStatus(serverId, "disconnected", error);
  }

  private applyNotificationHandlers(serverId: string, client: Client) {
    const registry = this.notificationHandlers.get(serverId);
    if (!registry) {
      return;
    }
    for (const [method, entry] of registry.entries()) {
      client.setNotificationHandler(
        entry.schema,
        this.createNotificationDispatcher(serverId, method)
      );
    }
  }

  private createNotificationDispatcher(
    serverId: string,
    method: string
  ): NotificationHandler {
    return (notification) => {
      const registry = this.notificationHandlers.get(serverId);
      const entry = registry?.get(method);
      if (!entry || entry.handlers.size === 0) {
        return;
      }
      for (const handler of entry.handlers) {
        try {
          handler(notification);
        } catch (error) {
          this.emitError({
            serverId,
            error,
            phase: "runtime",
            action: "notification",
          });
        }
      }
    };
  }

  private withTimeout(
    serverId: string,
    options?: RequestOptions
  ): RequestOptions {
    const state = this.states.get(serverId);
    const timeout =
      state?.timeoutMs ?? this.options.defaultTimeoutMs ?? DEFAULT_TIMEOUT_MS;
    if (!options) {
      return { timeout };
    }
    if (options.timeout === undefined) {
      return { ...options, timeout };
    }
    return options;
  }

  private async safeCloseTransport(transport: Transport): Promise<void> {
    try {
      await transport.close();
    } catch {
      // Intentionally ignored during shutdown.
    }
  }

  private getNotificationMethod(
    schema: NotificationSchema
  ): string | undefined {
    const shape = (schema as { shape?: Record<string, unknown> }).shape;
    if (!shape) {
      return;
    }
    const methodSchema = shape.method as
      | { _def?: { value?: unknown } }
      | undefined;
    const value = methodSchema?._def?.value;
    return typeof value === "string" ? value : undefined;
  }

  private updateStatus(
    serverId: string,
    status: McpConnectionStatus,
    error?: unknown
  ): void {
    const state = this.states.get(serverId);
    if (state) {
      state.status = status;
      if (error) {
        state.lastError = this.stringifyError(error);
      } else if (status === "connected") {
        state.lastError = undefined;
      }
      this.states.set(serverId, state);
    }
    this.options.onStatusChange?.({
      serverId,
      status,
      error,
    });
  }

  private emitError(details: McpServerErrorDetails): void {
    const state = this.states.get(details.serverId);
    if (state) {
      state.lastError = this.stringifyError(details.error);
      this.states.set(details.serverId, state);
    }
    this.options.onError?.(details);
  }

  private stringifyError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === "string") {
      return error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}

export type McpServerSummary = {
  id: string;
  status: McpConnectionStatus;
  config: McpServerConfig;
  lastError?: string;
};
