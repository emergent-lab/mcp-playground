import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { applyMiddlewares } from "@modelcontextprotocol/sdk/client/middleware.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { Database } from "@/db";
import { McpOAuthProvider } from "@/lib/mcp/oauth-provider";
import { createLoggingMiddleware } from "@/lib/middleware/logging";
import { LogService, type RequestLog } from "@/server/services/log-service";
import { CredentialStorage } from "@/server/storage/credential-storage";

/**
 * Union type for supported MCP transports
 * Allows backward compatibility with older SSE-based servers
 */
type McpTransport = StreamableHTTPClientTransport | SSEClientTransport;

/**
 * Determines if an error indicates a protocol compatibility issue
 * (i.e., server doesn't support StreamableHTTP and we should fallback to SSE)
 *
 * Returns true for HTTP 4xx errors except 401 (auth required)
 */
function isProtocolCompatibilityError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message;
    // Check for HTTP 4xx errors but NOT 401 (auth needed)
    return (
      (message.includes("HTTP 400") ||
        message.includes("HTTP 403") ||
        message.includes("HTTP 404") ||
        message.includes("HTTP 405") ||
        message.includes("HTTP 406")) &&
      !message.includes("HTTP 401")
    );
  }
  return false;
}

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
 * Creates and connects an MCP client with automatic transport fallback
 *
 * This factory function:
 * 1. Gets server details from database
 * 2. Sets up logging middleware
 * 3. Configures OAuth if required
 * 4. Attempts StreamableHTTP connection (modern protocol)
 * 5. Falls back to SSE on protocol errors (backward compatibility)
 * 6. Returns connected client ready for use
 *
 * @param userId - The authenticated user's ID
 * @param serverId - The server ID to connect to
 * @param db - Database instance
 * @param options - Optional configuration
 * @returns Connected MCP Client instance with successful transport
 * @throws Auth errors (401) and other connection failures (propagates to caller)
 */
export async function createMcpClient(
  userId: string,
  serverId: string,
  db: Database,
  options?: CreateMcpClientOptions
): Promise<{
  client: Client;
  transport: McpTransport;
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

  // Apply middleware to fetch and prepare transport options
  const enhancedFetch = applyMiddlewares(loggingMiddleware)(fetch);
  const transportOptions = {
    fetch: enhancedFetch,
    authProvider,
  };

  const serverUrl = new URL(server.serverUrl);
  let client: Client;
  let transport: McpTransport;

  // Try StreamableHTTP first (modern protocol)
  try {
    client = new Client({
      name: "MCP Playground",
      version: "1.0.0",
    });
    transport = new StreamableHTTPClientTransport(serverUrl, transportOptions);
    await client.connect(transport);
  } catch (error) {
    // Check if error indicates protocol incompatibility (not auth or network)
    if (isProtocolCompatibilityError(error)) {
      // Server doesn't support StreamableHTTP, fallback to SSE
      client = new Client({
        name: "MCP Playground",
        version: "1.0.0",
      });
      transport = new SSEClientTransport(serverUrl, transportOptions);
      await client.connect(transport); // Let this throw if it fails
    } else {
      // Auth errors (401) or other failures should propagate to caller
      throw error;
    }
  }

  return { client, transport, serverUrl: server.serverUrl };
}
