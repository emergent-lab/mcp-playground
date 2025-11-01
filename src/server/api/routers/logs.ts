import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { log } from "@/db/schema/app";
import { LogService } from "@/server/services/log-service";
import { CredentialStorage } from "@/server/storage/credential-storage";
import { protectedProcedure, router } from "../trpc";

// Pagination constants
const MAX_LOGS_PER_PAGE = 100;
const DEFAULT_LOGS_PER_PAGE = 50;

export const logsRouter = router({
  /**
   * Get logs for a specific server with pagination
   */
  list: protectedProcedure
    .input(
      z.object({
        serverId: z.string(), // Client-generated serverId
        limit: z
          .number()
          .min(1)
          .max(MAX_LOGS_PER_PAGE)
          .default(DEFAULT_LOGS_PER_PAGE),
        offset: z.number().min(0).default(0),
        since: z.coerce.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Look up the server to get the database UUID
      const storage = new CredentialStorage(ctx.userId, ctx.db);
      const server = await storage.getServer(input.serverId);

      if (!server) {
        return []; // Return empty array if server not found
      }

      const logService = new LogService(ctx.db);
      const logs = await logService.getServerLogs(ctx.userId, server.id, {
        limit: input.limit,
        offset: input.offset,
        since: input.since,
      });
      return logs;
    }),

  /**
   * Get aggregated statistics for a server's logs
   */
  stats: protectedProcedure
    .input(
      z.object({
        serverId: z.string(), // Client-generated serverId
      })
    )
    .query(async ({ ctx, input }) => {
      // Look up the server to get the database UUID
      const storage = new CredentialStorage(ctx.userId, ctx.db);
      const server = await storage.getServer(input.serverId);

      if (!server) {
        return {
          totalRequests: 0,
          successCount: 0,
          errorCount: 0,
          averageDuration: 0,
        };
      }

      const logService = new LogService(ctx.db);
      const stats = await logService.getLogStats(ctx.userId, server.id);
      return stats;
    }),

  /**
   * Delete all logs for a server
   */
  clear: protectedProcedure
    .input(
      z.object({
        serverId: z.string(), // Client-generated serverId
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Look up the server to get the database UUID
      const storage = new CredentialStorage(ctx.userId, ctx.db);
      const server = await storage.getServer(input.serverId);

      if (!server) {
        return { success: false };
      }

      const logService = new LogService(ctx.db);
      await logService.deleteServerLogs(ctx.userId, server.id);
      return { success: true };
    }),

  /**
   * Get tool execution history for a specific tool
   */
  listToolExecutions: protectedProcedure
    .input(
      z.object({
        serverId: z.string(),
        toolName: z.string().optional(),
        limit: z.number().min(1).max(50).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const storage = new CredentialStorage(ctx.userId, ctx.db);
      const server = await storage.getServer(input.serverId);

      if (!server) {
        return [];
      }

      // Build query to get tool executions
      const conditions = [
        eq(log.serverId, server.id),
        eq(log.userId, ctx.userId),
        eq(log.mcpMethod, "tools/call"),
      ];

      // If toolName is specified, filter by tool name in requestBody.params.name
      if (input.toolName) {
        conditions.push(
          sql`${log.requestBody}->'params'->>'name' = ${input.toolName}` as never
        );
      }

      const logs = await ctx.db.query.log.findMany({
        where: and(...conditions),
        limit: input.limit,
        orderBy: [desc(log.createdAt)],
      });

      return logs;
    }),
});
