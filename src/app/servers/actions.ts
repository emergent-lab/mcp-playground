"use server";

import { z } from "zod";

import type { McpServerConfig, McpServerSummary } from "@/lib/mcp/manager";
import { getMcpManager } from "@/lib/mcp/registry";

export type ActionResponse<T> =
  | {
      success: true;
      data: T;
      message?: string;
    }
  | {
      success: false;
      error: string;
    };

export type ServerDetailsSnapshot = {
  summary: McpServerSummary;
  tools: Array<{
    name: string;
    description?: string;
    schema?: unknown;
  }>;
  resources: Array<{
    uri: string;
    name?: string;
    description?: string;
  }>;
  resourceTemplates: Array<{
    name: string;
    description?: string;
  }>;
};

const httpServerSchema = z.object({
  id: z.string().min(1),
  transport: z.literal("http"),
  url: z.string().url(),
  timeoutMs: z.number().int().positive().optional(),
  preferSse: z.boolean().optional(),
  allowSseFallback: z.boolean().optional(),
  autoConnect: z.boolean().optional(),
});

const sseServerSchema = z.object({
  id: z.string().min(1),
  transport: z.literal("sse"),
  url: z.string().url(),
  timeoutMs: z.number().int().positive().optional(),
  autoConnect: z.boolean().optional(),
});

const stdioServerSchema = z.object({
  id: z.string().min(1),
  transport: z.literal("stdio"),
  command: z.string().min(1),
  args: z.array(z.string().min(1)).optional(),
  cwd: z.string().min(1).optional(),
  timeoutMs: z.number().int().positive().optional(),
  autoConnect: z.boolean().optional(),
});

const addServerSchema = z.discriminatedUnion("transport", [
  httpServerSchema,
  sseServerSchema,
  stdioServerSchema,
]);

export type AddServerPayload = z.infer<typeof addServerSchema>;

export async function fetchServerSummariesAction(): Promise<
  McpServerSummary[]
> {
  return await Promise.resolve(getMcpManager().getServerSummaries());
}

export async function fetchServerDetailsAction(
  serverId: string
): Promise<ActionResponse<ServerDetailsSnapshot>> {
  const manager = getMcpManager();
  try {
    const summary = manager
      .getServerSummaries()
      .find((entry) => entry.id === serverId);
    if (!summary) {
      return {
        success: false,
        error: `Server "${serverId}" not found.`,
      };
    }
    const [toolsResult, resourcesResult, templatesResult] = await Promise.all([
      safeRequest(() => manager.listTools(serverId), { tools: [] }),
      safeRequest(() => manager.listResources(serverId), { resources: [] }),
      safeRequest(() => manager.listResourceTemplates(serverId), {
        resourceTemplates: [],
      }),
    ]);
    return {
      success: true,
      data: {
        summary,
        tools: (toolsResult.tools ?? []).map((tool) => ({
          name: tool.name,
          description: tool.description ?? undefined,
          schema: tool.inputSchema ?? undefined,
        })),
        resources: (resourcesResult.resources ?? []).map((resource) => ({
          uri: resource.uri,
          name: resource.name ?? undefined,
          description: resource.description ?? undefined,
        })),
        resourceTemplates: (templatesResult.resourceTemplates ?? []).map(
          (template) => ({
            name: template.name,
            description: template.description ?? undefined,
          })
        ),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
}

export async function addServerAction(
  payload: unknown
): Promise<ActionResponse<McpServerSummary[]>> {
  const parsedResult = addServerSchema.safeParse(payload);
  if (!parsedResult.success) {
    return {
      success: false,
      error: "Invalid server configuration.",
    };
  }

  const manager = getMcpManager();
  const serverConfig = buildServerConfig(parsedResult.data);
  manager.registerServer(parsedResult.data.id, serverConfig);

  if (parsedResult.data.autoConnect) {
    try {
      await manager.connectServer(parsedResult.data.id);
    } catch (error) {
      return {
        success: false,
        error: formatError(error),
      };
    }
  }

  return {
    success: true,
    data: manager.getServerSummaries(),
    message: parsedResult.data.autoConnect
      ? "Server added and connection attempted."
      : "Server added.",
  };
}

export async function connectServerAction(
  serverId: string
): Promise<ActionResponse<McpServerSummary[]>> {
  const manager = getMcpManager();
  try {
    await manager.connectServer(serverId);
    return {
      success: true,
      data: manager.getServerSummaries(),
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
}

export async function disconnectServerAction(
  serverId: string
): Promise<ActionResponse<McpServerSummary[]>> {
  const manager = getMcpManager();
  try {
    await manager.disconnectServer(serverId);
    return {
      success: true,
      data: manager.getServerSummaries(),
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
}

export async function removeServerAction(
  serverId: string
): Promise<ActionResponse<McpServerSummary[]>> {
  const manager = getMcpManager();
  try {
    await manager.removeServer(serverId);
    return {
      success: true,
      data: manager.getServerSummaries(),
      message: "Server removed.",
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
}

export async function refreshServersAction(): Promise<
  ActionResponse<McpServerSummary[]>
> {
  try {
    const data = await Promise.resolve(getMcpManager().getServerSummaries());
    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: formatError(error),
    };
  }
}

function buildServerConfig(descriptor: AddServerPayload): McpServerConfig {
  if (descriptor.transport === "http") {
    return {
      transport: "http",
      url: descriptor.url,
      timeoutMs: descriptor.timeoutMs,
      preferSse: descriptor.preferSse,
      allowSseFallback: descriptor.allowSseFallback ?? true,
    };
  }
  if (descriptor.transport === "sse") {
    return {
      transport: "sse",
      url: descriptor.url,
      timeoutMs: descriptor.timeoutMs,
    };
  }
  const args = descriptor.args?.filter((item) => item.trim().length > 0);
  return {
    transport: "stdio",
    command: descriptor.command,
    args,
    cwd: descriptor.cwd,
    timeoutMs: descriptor.timeoutMs,
  };
}

function formatError(error: unknown): string {
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

async function safeRequest<T>(
  request: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await request();
  } catch (error) {
    if (isMethodNotFoundError(error)) {
      return fallback;
    }
    throw error;
  }
}

function isMethodNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  const message = error.message.toLowerCase();
  return message.includes("method not found") || message.includes("-32601");
}
