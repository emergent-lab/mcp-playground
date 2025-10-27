import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { McpOAuthProvider } from "@/lib/mcp/oauth-provider";
import { createMcpClient } from "@/server/services/mcp-client";
import { CredentialStorage } from "@/server/storage/credential-storage";

/**
 * OAuth callback handler for MCP server authorization
 *
 * This route handles the redirect from the MCP authorization server after
 * the user has approved the OAuth request.
 *
 * Flow:
 * 1. Extract authorization code and state from query params
 * 2. Verify user is authenticated
 * 3. Verify OAuth state (CSRF protection)
 * 4. Exchange authorization code for tokens using MCP SDK
 * 5. Test connection with new tokens
 * 6. Clean up temporary OAuth data
 * 7. Redirect back to home
 *
 * Error handling: All errors redirect to / with error query param
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ serverId: string }> }
) {
  try {
    const { serverId } = await params;
    // 1. Extract query parameters
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const receivedState = searchParams.get("state");

    if (!code) {
      return redirect("/?error=missing_code");
    }

    // 2. Verify user is authenticated
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return redirect("/?error=unauthorized");
    }

    // 3. Get server details and verify state
    const storage = new CredentialStorage(session.user.id, db);
    const server = await storage.getServer(serverId);

    if (!server) {
      return redirect("/?error=server_not_found");
    }

    // Verify OAuth state for CSRF protection
    const savedState = await storage.getOAuthState(serverId);
    if (!savedState || savedState !== receivedState) {
      return redirect("/?error=invalid_state");
    }

    // 4. Exchange authorization code for tokens
    const { client } = await createMcpClient(session.user.id, serverId, db);

    const oauthProvider = new McpOAuthProvider(storage, serverId);
    const transport = new StreamableHTTPClientTransport(
      new URL(server.serverUrl),
      {
        authProvider: oauthProvider,
      }
    );

    // This exchanges the code for tokens and saves them via the OAuth provider
    await transport.finishAuth(code);

    // 5. Test that connection works with the new tokens
    await client.connect(transport);
    await client.close();

    // 6. Clean up temporary OAuth data
    await storage.clearOAuthTemporaryData(serverId);

    // 7. Redirect to home with success message
    return redirect("/?success=connected");
  } catch (error) {
    // Determine error type
    let errorType = "connection_failed";
    if (error instanceof Error) {
      if (error.message.includes("token")) {
        errorType = "token_exchange_failed";
      } else if (error.message.includes("verifier")) {
        errorType = "invalid_verifier";
      }
    }

    return redirect(`/?error=${errorType}`);
  }
}
