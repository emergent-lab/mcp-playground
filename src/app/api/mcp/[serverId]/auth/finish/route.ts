import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { McpOAuthProvider } from "@/lib/mcp/oauth-provider";
import { createMcpClient } from "@/server/services/mcp-client";
import { CredentialStorage } from "@/server/storage/credential-storage";

/**
 * Extract the base URL from request headers
 */
function getBaseUrlFromHeaders(headers: Headers): string | undefined {
  const origin = headers.get("origin");
  if (origin) {
    return origin;
  }

  const host = headers.get("host");
  if (host) {
    const proto = headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }

  return;
}

/**
 * API route to finish OAuth flow
 *
 * This route:
 * 1. Receives authorization code from the callback page
 * 2. Exchanges it for tokens using MCP SDK
 * 3. Tests the connection
 * 4. Cleans up temporary OAuth data
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  const { serverId } = await params;
  let storage: CredentialStorage | null = null;

  try {
    const { code } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    // Verify user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get server details
    storage = new CredentialStorage(session.user.id, db);
    const server = await storage.getServer(serverId);

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    // Create OAuth provider and transport
    const baseUrl = getBaseUrlFromHeaders(request.headers);
    const { client } = await createMcpClient(session.user.id, serverId, db, {
      baseUrl,
    });
    const oauthProvider = new McpOAuthProvider(storage, serverId, baseUrl);
    const transport = new StreamableHTTPClientTransport(
      new URL(server.serverUrl),
      {
        authProvider: oauthProvider,
      }
    );

    // Exchange authorization code for tokens
    await transport.finishAuth(code);

    // Test that connection works with the new tokens
    await client.connect(transport);
    await client.close();

    // Clean up temporary OAuth data
    await storage.clearOAuthTemporaryData(serverId);

    return NextResponse.json({ success: true });
  } catch (error) {
    // Clean up OAuth state on error so retry is possible
    if (storage) {
      try {
        await storage.clearOAuthTemporaryData(serverId);
      } catch {
        // Ignore cleanup errors
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to complete OAuth flow",
      },
      { status: 500 }
    );
  }
}
