import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { McpOAuthProvider } from "@/lib/mcp/oauth-provider";
import { createMcpClient } from "@/server/services/mcp-client";
import { CredentialStorage } from "@/server/storage/credential-storage";

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
  try {
    const { serverId } = await params;
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
    const storage = new CredentialStorage(session.user.id, db);
    const server = await storage.getServer(serverId);

    if (!server) {
      return NextResponse.json({ error: "Server not found" }, { status: 404 });
    }

    // Create OAuth provider and transport
    const { client } = await createMcpClient(session.user.id, serverId, db);
    const oauthProvider = new McpOAuthProvider(storage, serverId);
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
