import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { applyMiddlewares } from "@modelcontextprotocol/sdk/client/middleware.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Database } from "@/db";
import { McpOAuthProvider } from "@/lib/mcp/oauth-provider";
import { createLoggingMiddleware } from "@/lib/middleware/logging";
import { LogService, type RequestLog } from "@/server/services/log-service";
import { CredentialStorage } from "@/server/storage/credential-storage";

export type CreateMcpClientOptions = {
  /**
   * Optional callback for immediate log feedback (before DB write completes)
   * Useful for optimistic UI updates
   */
  onLog?: (log: RequestLog) => void;
  /**
   * Optional base URL for OAuth redirects
   * If not provided, uses NEXT_PUBLIC_BASE_URL from env
   */
  baseUrl?: string;
};

/**
 * Creates an MCP client instance with logging and optional OAuth authentication
 *
 * This factory function:
 * 1. Gets server details from database
 * 2. Sets up logging middleware
 * 3. Configures OAuth if required
 * 4. Returns configured client (NOT connected - caller must connect)
 *
 * @param userId - The authenticated user's ID
 * @param serverId - The server ID to connect to
 * @param db - Database instance
 * @param options - Optional configuration
 * @returns Configured MCP Client instance (not yet connected)
 */
export async function createMcpClient(
  userId: string,
  serverId: string,
  db: Database,
  options?: CreateMcpClientOptions
): Promise<{
  client: Client;
  transport: StreamableHTTPClientTransport;
  serverUrl: string;
}> {
  // Get server details from storage
  const storage = new CredentialStorage(userId, db);
  const server = await storage.getServer(serverId);

  if (!server) {
    throw new Error(`Server not found: ${serverId}`);
  }

  // Create logging middleware
  const logService = new LogService(db);
  const loggingMiddleware = createLoggingMiddleware(async (logData) => {
    const fullLog: RequestLog = {
      ...logData,
      userId,
      serverId: server.id, // Use DB UUID, not client-generated serverId
    };

    // Call optional callback for optimistic UI
    if (options?.onLog) {
      options.onLog(fullLog);
    }

    // Save to database
    await logService.saveLog(fullLog);
  });

  // Always create OAuth provider - we don't know if auth is required until we try
  // If the server doesn't require auth, the provider just won't be used
  const authProvider = new McpOAuthProvider(
    storage,
    serverId,
    options?.baseUrl
  );

  // Apply middleware to fetch and create HTTP transport
  const enhancedFetch = applyMiddlewares(loggingMiddleware)(fetch);
  const transport = new StreamableHTTPClientTransport(
    new URL(server.serverUrl),
    {
      fetch: enhancedFetch,
      authProvider,
    }
  );

  // Create and return client (not connected yet)
  const client = new Client({
    name: "MCP Playground",
    version: "1.0.0",
  });

  return { client, transport, serverUrl: server.serverUrl };
}
