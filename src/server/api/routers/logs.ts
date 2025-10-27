import { z } from "zod";
import { LogService } from "@/server/services/log-service";
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
        serverId: z.string().uuid(),
        limit: z
          .number()
          .min(1)
          .max(MAX_LOGS_PER_PAGE)
          .default(DEFAULT_LOGS_PER_PAGE),
        offset: z.number().min(0).default(0),
        since: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const logService = new LogService(ctx.db);
      const logs = await logService.getServerLogs(ctx.userId, input.serverId, {
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
        serverId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const logService = new LogService(ctx.db);
      const stats = await logService.getLogStats(ctx.userId, input.serverId);
      return stats;
    }),

  /**
   * Delete all logs for a server
   */
  clear: protectedProcedure
    .input(
      z.object({
        serverId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const logService = new LogService(ctx.db);
      await logService.deleteServerLogs(ctx.userId, input.serverId);
      return { success: true };
    }),
});
