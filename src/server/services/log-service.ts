import { and, desc, eq, gte, sql } from "drizzle-orm";
import type { Database } from "@/db";
import { log } from "@/db/schema/app";
import { sanitizeBody, sanitizeHeaders } from "@/lib/logging-sanitization";

export type RequestLog = {
  serverId: string;
  userId: string;
  method: string;
  url: string;
  mcpMethod?: string;
  status?: number;
  statusText?: string;
  duration?: number;
  requestHeaders?: Record<string, string>;
  requestBody?: unknown;
  responseHeaders?: Record<string, string>;
  responseBody?: unknown;
  error?: string;
};

export type LogStats = {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  averageDuration: number;
};

export type LogQueryOptions = {
  limit?: number;
  offset?: number;
  since?: Date;
};

export class LogService {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  /**
   * Save a request/response log entry
   */
  async saveLog(data: RequestLog): Promise<void> {
    try {
      const sanitizedRequestHeaders = data.requestHeaders
        ? sanitizeHeaders(data.requestHeaders)
        : undefined;
      const sanitizedResponseHeaders = data.responseHeaders
        ? sanitizeHeaders(data.responseHeaders)
        : undefined;
      const sanitizedRequestBody =
        data.requestBody === undefined
          ? undefined
          : sanitizeBody(data.requestBody);
      const sanitizedResponseBody =
        data.responseBody === undefined
          ? undefined
          : sanitizeBody(data.responseBody);

      await this.db.insert(log).values({
        serverId: data.serverId,
        userId: data.userId,
        method: data.method,
        url: data.url,
        mcpMethod: data.mcpMethod,
        status: data.status,
        statusText: data.statusText,
        duration: data.duration,
        requestHeaders: sanitizedRequestHeaders,
        requestBody: sanitizedRequestBody,
        responseHeaders: sanitizedResponseHeaders,
        responseBody: sanitizedResponseBody,
        error: data.error,
      });
    } catch (error) {
      // Silently ignore foreign key violations - server may have been deleted
      // while MCP client connection was still active in memory
      if (error instanceof Error && "code" in error && error.code === "23503") {
        // Foreign key constraint violation - server was deleted
        return;
      }
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get logs for a specific server with pagination
   */
  getServerLogs(
    userId: string,
    serverId: string,
    options: LogQueryOptions = {}
  ) {
    const { limit = 50, offset = 0, since } = options;

    const conditions = [eq(log.userId, userId), eq(log.serverId, serverId)];

    if (since) {
      conditions.push(gte(log.createdAt, since));
    }

    return this.db.query.log.findMany({
      where: and(...conditions),
      orderBy: [desc(log.createdAt)],
      limit,
      offset,
    });
  }

  /**
   * Get all logs for a user across all servers
   */
  getAllUserLogs(userId: string, options: LogQueryOptions = {}) {
    const { limit = 100, offset = 0, since } = options;

    const conditions = [eq(log.userId, userId)];

    if (since) {
      conditions.push(gte(log.createdAt, since));
    }

    return this.db.query.log.findMany({
      where: and(...conditions),
      orderBy: [desc(log.createdAt)],
      limit,
      offset,
    });
  }

  /**
   * Delete all logs for a specific server
   */
  async deleteServerLogs(userId: string, serverId: string): Promise<void> {
    await this.db
      .delete(log)
      .where(and(eq(log.userId, userId), eq(log.serverId, serverId)));
  }

  /**
   * Delete logs older than specified days
   */
  async deleteOldLogs(daysOld: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await this.db.delete(log).where(gte(log.createdAt, cutoffDate));
  }

  /**
   * Get statistics for a server's logs
   */
  async getLogStats(userId: string, serverId: string): Promise<LogStats> {
    const result = await this.db
      .select({
        totalRequests: sql<number>`count(*)::int`,
        successCount: sql<number>`count(case when ${log.status} >= 200 and ${log.status} < 300 then 1 end)::int`,
        errorCount: sql<number>`count(case when ${log.status} >= 400 or ${log.error} is not null then 1 end)::int`,
        averageDuration: sql<number>`coalesce(avg(${log.duration})::int, 0)`,
      })
      .from(log)
      .where(and(eq(log.userId, userId), eq(log.serverId, serverId)));

    return {
      totalRequests: result[0]?.totalRequests || 0,
      successCount: result[0]?.successCount || 0,
      errorCount: result[0]?.errorCount || 0,
      averageDuration: result[0]?.averageDuration || 0,
    };
  }
}
