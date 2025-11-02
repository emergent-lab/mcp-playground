import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";
import {
  CallToolResultSchema,
  CompleteResultSchema,
  GetPromptResultSchema,
  ListPromptsResultSchema,
  ListResourcesResultSchema,
  ListToolsResultSchema,
  ReadResourceResultSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createMcpClient } from "@/server/services/mcp-client";
import { CredentialStorage } from "@/server/storage/credential-storage";
import { protectedProcedure, router } from "../trpc";

/**
 * Extract the base URL from request headers
 * Falls back to origin header, then constructs from host
 */
function getBaseUrlFromHeaders(headers: Headers): string | undefined {
  // Try origin header first
  const origin = headers.get("origin");
  if (origin) {
    return origin;
  }

  // Otherwise construct from host and protocol
  const host = headers.get("host");
  if (host) {
    const proto = headers.get("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }

  return;
}

export const serverRouter = router({
  /**
   * List all servers for the authenticated user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const storage = new CredentialStorage(ctx.userId, ctx.db);
    const servers = await storage.getUserServers();
    return servers;
  }),

  /**
   * Get a single server by ID
   */
  getById: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const storage = new CredentialStorage(ctx.userId, ctx.db);
      const server = await storage.getServer(input.serverId);

      if (!server) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Server not found",
        });
      }

      return server;
    }),

  /**
   * Connect to an MCP server (handles OAuth if needed)
   *
   * Flow:
   * 1. Create server entry in DB
   * 2. Try connecting without auth
   * 3. If successful → return connected status
   * 4. If 401 → Mark as requiring auth, return auth URL
   */
  connect: protectedProcedure
    .input(
      z.object({
        serverId: z.string(), // Client-generated UUID
        serverUrl: z.string().url(),
        serverName: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const storage = new CredentialStorage(ctx.userId, ctx.db);

      // Check if server already exists
      const existing = await storage.getServer(input.serverId);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Server already exists",
        });
      }

      // Create server entry
      await storage.initServer(
        input.serverId,
        input.serverUrl,
        input.serverName
      );

      // Clean up any stale OAuth state from previous failed attempts
      // This ensures a fresh start for the OAuth flow
      await storage.clearOAuthTemporaryData(input.serverId);

      try {
        // Try connecting (with OAuth provider if needed)
        // Client is returned already connected with automatic SSE fallback
        const { client } = await createMcpClient(
          ctx.userId,
          input.serverId,
          ctx.db,
          { baseUrl: getBaseUrlFromHeaders(ctx.headers) }
        );

        // Success - no auth needed
        await client.close();
        return {
          status: "connected" as const,
          serverId: input.serverId,
        };
      } catch (error) {
        // Check if it's an auth error (either UnauthorizedError or HTTP 401)
        const isAuthError =
          error instanceof UnauthorizedError ||
          (error instanceof Error && error.message.includes("HTTP 401"));

        if (isAuthError) {
          // Mark server as requiring auth
          await storage.markRequiresAuth(input.serverId, true);

          // Get the auth URL that was saved by the OAuth provider
          const authUrl = await storage.getAuthUrl(input.serverId);

          if (!authUrl) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message:
                "Failed to initiate OAuth flow - no auth URL saved. The server requires authentication but did not provide authorization details.",
            });
          }
          return {
            status: "needs_auth" as const,
            serverId: input.serverId,
            authUrl,
          };
        }

        // Other error - rethrow
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to connect to server",
        });
      }
    }),

  /**
   * Get connection status for a server
   */
  getStatus: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const storage = new CredentialStorage(ctx.userId, ctx.db);
      const server = await storage.getServer(input.serverId);

      if (!server) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Server not found",
        });
      }

      return {
        serverId: server.serverId,
        serverUrl: server.serverUrl,
        serverName: server.serverName,
        requiresAuth: server.requiresAuth,
        hasTokens: !!server.tokens,
      };
    }),

  /**
   * Delete a server
   */
  delete: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const storage = new CredentialStorage(ctx.userId, ctx.db);
      await storage.deleteServer(input.serverId);
      return { success: true };
    }),

  /**
   * List tools available on the server
   */
  listTools: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const storage = new CredentialStorage(ctx.userId, ctx.db);

      try {
        const { client } = await createMcpClient(
          ctx.userId,
          input.serverId,
          ctx.db,
          { baseUrl: getBaseUrlFromHeaders(ctx.headers) }
        );

        const result = await client.request(
          {
            method: "tools/list",
            params: input.cursor ? { cursor: input.cursor } : {},
          },
          ListToolsResultSchema
        );
        await client.close();
        return {
          tools: result.tools,
          nextCursor: result.nextCursor,
        };
      } catch (error) {
        // Check if it's an auth error
        const isAuthError =
          error instanceof UnauthorizedError ||
          (error instanceof Error && error.message.includes("HTTP 401"));

        if (isAuthError) {
          await storage.markRequiresAuth(input.serverId, true);

          // Clear stale OAuth temporary data before triggering fresh auth flow
          await storage.clearOAuthTemporaryData(input.serverId);

          // Trigger a fresh OAuth flow to generate new auth URL
          try {
            const { client: freshClient, transport: freshTransport } =
              await createMcpClient(ctx.userId, input.serverId, ctx.db, {
                baseUrl: getBaseUrlFromHeaders(ctx.headers),
              });
            await freshClient.connect(freshTransport);
            // Connection succeeded - shouldn't reach here after clearing tokens
            await freshClient.close();
          } catch {
            // Expected: fresh connection attempt should also fail with 401
            // and trigger OAuth flow, saving new authUrl
          }

          // Get the fresh auth URL generated by the OAuth flow
          const authUrl = await storage.getAuthUrl(input.serverId);
          if (authUrl) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: `Authentication required. Please authorize at: ${authUrl}`,
              cause: { authUrl },
            });
          }

          // If still no authUrl, the server may not support OAuth properly
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "Authentication required but server did not provide authorization URL",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to list tools",
        });
      }
    }),

  /**
   * List resources available on the server
   */
  listResources: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const storage = new CredentialStorage(ctx.userId, ctx.db);

      try {
        const { client } = await createMcpClient(
          ctx.userId,
          input.serverId,
          ctx.db,
          { baseUrl: getBaseUrlFromHeaders(ctx.headers) }
        );

        const result = await client.request(
          {
            method: "resources/list",
            params: input.cursor ? { cursor: input.cursor } : {},
          },
          ListResourcesResultSchema
        );
        await client.close();
        return {
          resources: result.resources,
          nextCursor: result.nextCursor,
        };
      } catch (error) {
        // Check if it's an auth error
        const isAuthError =
          error instanceof UnauthorizedError ||
          (error instanceof Error && error.message.includes("HTTP 401"));

        if (isAuthError) {
          await storage.markRequiresAuth(input.serverId, true);

          // Clear stale OAuth temporary data before triggering fresh auth flow
          await storage.clearOAuthTemporaryData(input.serverId);

          // Trigger a fresh OAuth flow to generate new auth URL
          try {
            const { client: freshClient, transport: freshTransport } =
              await createMcpClient(ctx.userId, input.serverId, ctx.db, {
                baseUrl: getBaseUrlFromHeaders(ctx.headers),
              });
            await freshClient.connect(freshTransport);
            // Connection succeeded - shouldn't reach here after clearing tokens
            await freshClient.close();
          } catch {
            // Expected: fresh connection attempt should also fail with 401
            // and trigger OAuth flow, saving new authUrl
          }

          // Get the fresh auth URL generated by the OAuth flow
          const authUrl = await storage.getAuthUrl(input.serverId);
          if (authUrl) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: `Authentication required. Please authorize at: ${authUrl}`,
              cause: { authUrl },
            });
          }

          // If still no authUrl, the server may not support OAuth properly
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "Authentication required but server did not provide authorization URL",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to list resources",
        });
      }
    }),

  /**
   * List prompts available on the server
   */
  listPrompts: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const storage = new CredentialStorage(ctx.userId, ctx.db);

      try {
        const { client } = await createMcpClient(
          ctx.userId,
          input.serverId,
          ctx.db,
          { baseUrl: getBaseUrlFromHeaders(ctx.headers) }
        );
        const result = await client.request(
          {
            method: "prompts/list",
            params: input.cursor ? { cursor: input.cursor } : {},
          },
          ListPromptsResultSchema
        );
        await client.close();
        return {
          prompts: result.prompts,
          nextCursor: result.nextCursor,
        };
      } catch (error) {
        // Check if it's an auth error
        const isAuthError =
          error instanceof UnauthorizedError ||
          (error instanceof Error && error.message.includes("HTTP 401"));

        if (isAuthError) {
          await storage.markRequiresAuth(input.serverId, true);

          // Clear stale OAuth temporary data before triggering fresh auth flow
          await storage.clearOAuthTemporaryData(input.serverId);

          // Trigger a fresh OAuth flow to generate new auth URL
          try {
            const { client: freshClient, transport: freshTransport } =
              await createMcpClient(ctx.userId, input.serverId, ctx.db, {
                baseUrl: getBaseUrlFromHeaders(ctx.headers),
              });
            await freshClient.connect(freshTransport);
            // Connection succeeded - shouldn't reach here after clearing tokens
            await freshClient.close();
          } catch {
            // Expected: fresh connection attempt should also fail with 401
            // and trigger OAuth flow, saving new authUrl
          }

          // Get the fresh auth URL generated by the OAuth flow
          const authUrl = await storage.getAuthUrl(input.serverId);
          if (authUrl) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: `Authentication required. Please authorize at: ${authUrl}`,
              cause: { authUrl },
            });
          }

          // If still no authUrl, the server may not support OAuth properly
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message:
              "Authentication required but server did not provide authorization URL",
          });
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to list prompts",
        });
      }
    }),

  /**
   * Call a tool on the server
   */
  callTool: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        toolName: z.string(),
        arguments: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { client } = await createMcpClient(
        ctx.userId,
        input.serverId,
        ctx.db,
        { baseUrl: getBaseUrlFromHeaders(ctx.headers) }
      );

      try {
        const result = await client.request(
          {
            method: "tools/call",
            params: {
              name: input.toolName,
              arguments: input.arguments || {},
            },
          },
          CallToolResultSchema
        );
        await client.close();
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to call tool",
        });
      }
    }),

  /**
   * Get a prompt from the server (with optional arguments)
   */
  getPrompt: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        promptName: z.string(),
        arguments: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { client } = await createMcpClient(
        ctx.userId,
        input.serverId,
        ctx.db,
        { baseUrl: getBaseUrlFromHeaders(ctx.headers) }
      );

      try {
        const result = await client.request(
          {
            method: "prompts/get",
            params: {
              name: input.promptName,
              arguments: input.arguments || {},
            },
          },
          GetPromptResultSchema
        );
        await client.close();
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to get prompt",
        });
      }
    }),

  /**
   * Read a resource from the server
   */
  readResource: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        uri: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { client } = await createMcpClient(
        ctx.userId,
        input.serverId,
        ctx.db,
        { baseUrl: getBaseUrlFromHeaders(ctx.headers) }
      );

      try {
        const result = await client.request(
          {
            method: "resources/read",
            params: {
              uri: input.uri,
            },
          },
          ReadResourceResultSchema
        );
        await client.close();
        return result;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to read resource",
        });
      }
    }),

  /**
   * Get completion suggestions for prompt arguments or resource URIs
   */
  complete: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        ref: z.union([
          z.object({ type: z.literal("ref/prompt"), name: z.string() }),
          z.object({ type: z.literal("ref/resource"), uri: z.string() }),
        ]),
        argument: z.object({ name: z.string(), value: z.string() }),
        context: z
          .object({ arguments: z.record(z.string(), z.string()) })
          .optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { client } = await createMcpClient(
        ctx.userId,
        input.serverId,
        ctx.db,
        { baseUrl: getBaseUrlFromHeaders(ctx.headers) }
      );

      try {
        const result = await client.request(
          {
            method: "completion/complete",
            params: {
              ref: input.ref,
              argument: input.argument,
              ...(input.context && { context: input.context }),
            },
          },
          CompleteResultSchema
        );

        await client.close();
        return result.completion;
      } catch (error) {
        // Silently fail if server doesn't support completions
        if (
          error instanceof Error &&
          (error.message.includes("Method not found") ||
            error.message.includes("-32601"))
        ) {
          return { values: [], hasMore: false };
        }

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Failed to get completions",
        });
      }
    }),
});
