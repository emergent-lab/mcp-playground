import { UnauthorizedError } from "@modelcontextprotocol/sdk/client/auth.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createMcpClient } from "@/server/services/mcp-client";
import { CredentialStorage } from "@/server/storage/credential-storage";
import { protectedProcedure, router } from "../trpc";

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

      try {
        // Try connecting without auth
        const { client } = await createMcpClient(
          ctx.userId,
          input.serverId,
          ctx.db
        );

        // Attempt connection
        await client.connect(
          new StreamableHTTPClientTransport(new URL(input.serverUrl))
        );

        // Success - no auth needed
        await client.close();
        return {
          status: "connected" as const,
          serverId: input.serverId,
        };
      } catch (error) {
        // Check if it's an auth error
        if (error instanceof UnauthorizedError) {
          // Mark server as requiring auth
          await storage.markRequiresAuth(input.serverId, true);

          // Get the auth URL that was saved by the OAuth provider
          const authUrl = await storage.getAuthUrl(input.serverId);

          if (!authUrl) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Failed to initiate OAuth flow",
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
      })
    )
    .query(async ({ ctx, input }) => {
      const { client } = await createMcpClient(
        ctx.userId,
        input.serverId,
        ctx.db
      );

      try {
        const storage = new CredentialStorage(ctx.userId, ctx.db);
        const serverData = await storage.getServer(input.serverId);

        if (!serverData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Server not found",
          });
        }

        const transport = new StreamableHTTPClientTransport(
          new URL(serverData.serverUrl)
        );
        await client.connect(transport);
        const tools = await client.listTools();
        await client.close();
        return tools;
      } catch (error) {
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
      })
    )
    .query(async ({ ctx, input }) => {
      const { client } = await createMcpClient(
        ctx.userId,
        input.serverId,
        ctx.db
      );

      try {
        const storage = new CredentialStorage(ctx.userId, ctx.db);
        const serverData = await storage.getServer(input.serverId);

        if (!serverData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Server not found",
          });
        }

        const transport = new StreamableHTTPClientTransport(
          new URL(serverData.serverUrl)
        );
        await client.connect(transport);
        const resources = await client.listResources();
        await client.close();
        return resources;
      } catch (error) {
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
      })
    )
    .query(async ({ ctx, input }) => {
      const { client } = await createMcpClient(
        ctx.userId,
        input.serverId,
        ctx.db
      );

      try {
        const storage = new CredentialStorage(ctx.userId, ctx.db);
        const serverData = await storage.getServer(input.serverId);

        if (!serverData) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Server not found",
          });
        }

        const transport = new StreamableHTTPClientTransport(
          new URL(serverData.serverUrl)
        );
        await client.connect(transport);
        const prompts = await client.listPrompts();
        await client.close();
        return prompts;
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error ? error.message : "Failed to list prompts",
        });
      }
    }),
});
