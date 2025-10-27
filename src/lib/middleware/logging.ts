import { createMiddleware } from "@modelcontextprotocol/sdk/client/middleware.js";
import type { RequestLog } from "@/server/services/log-service";

export type LogCallback = (
  log: Omit<RequestLog, "userId" | "serverId">
) => void;

/**
 * Converts Headers object to plain record
 */
function extractHeaders(headers: Headers): Record<string, string> {
  const record: Record<string, string> = {};
  for (const [key, value] of headers.entries()) {
    record[key] = value;
  }
  return record;
}

/**
 * Safely parses request body (handles JSON strings and raw data)
 */
function parseRequestBody(body: unknown): unknown {
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  }
  return body;
}

/**
 * Safely parses response body from cloned response
 */
async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

/**
 * Calculates duration in milliseconds from start time
 */
function calculateDuration(startTime: number): number {
  return Math.round(performance.now() - startTime);
}

/**
 * Creates middleware that logs all HTTP requests/responses from MCP client
 *
 * @param onLog - Callback to handle log data (typically saves to database)
 * @returns Middleware function for MCP SDK
 */
export function createLoggingMiddleware(onLog: LogCallback) {
  return createMiddleware(async (next, input, init) => {
    const startTime = performance.now();
    const url = input instanceof Request ? input.url : String(input);
    const method = init?.method || "GET";

    const requestHeaders = init?.headers
      ? extractHeaders(new Headers(init.headers))
      : {};
    const requestBody = init?.body ? parseRequestBody(init.body) : undefined;

    try {
      const response = await next(input, init);
      const duration = calculateDuration(startTime);
      const responseHeaders = extractHeaders(response.headers);
      const responseBody = await parseResponseBody(response.clone());

      onLog({
        method,
        url,
        status: response.status,
        statusText: response.statusText,
        duration,
        requestHeaders,
        requestBody,
        responseHeaders,
        responseBody,
      });

      return response;
    } catch (error) {
      const duration = calculateDuration(startTime);

      onLog({
        method,
        url,
        duration,
        requestHeaders,
        requestBody,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  });
}
