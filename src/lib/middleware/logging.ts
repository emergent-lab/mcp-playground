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
 * Tries to parse text as JSON, falls back to returning raw text
 */
function parseJsonOrText(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Safely parses request body (handles JSON strings and raw data)
 */
function parseRequestBody(body: unknown): unknown {
  if (typeof body === "string") {
    return parseJsonOrText(body);
  }
  return body;
}

/**
 * Extracts MCP method from request body
 */
function extractMcpMethod(body: unknown): string | undefined {
  if (body && typeof body === "object" && "method" in body) {
    return String(body.method);
  }
  return;
}

/**
 * Determines if a request should be logged
 * Filters out noise like aborted connections and SSE keep-alives
 */
function shouldLogRequest(
  method: string,
  status: number | undefined,
  error: string | undefined
): boolean {
  // Skip aborted requests
  if (error?.includes("aborted")) {
    return false;
  }

  // Skip failed SSE connection attempts (405 Method Not Allowed on GET)
  if (method === "GET" && status === 405) {
    return false;
  }

  return true;
}

// Regex to extract data field from SSE events
const SSE_DATA_PATTERN = /^data: (.+)$/m;

/**
 * Parses Server-Sent Events (SSE) response body
 * Extracts JSON data from SSE format: "event: message\ndata: {...}\n\n"
 */
function parseSseResponse(text: string): unknown {
  // Split by double newline to get individual events
  const events = text.split("\n\n").filter(Boolean);

  const parsedEvents = events.map((event) => {
    // Extract data field from event
    const dataMatch = SSE_DATA_PATTERN.exec(event);
    if (!dataMatch) {
      return event; // Return raw event if no data field found
    }

    const dataText = dataMatch[1];
    return parseJsonOrText(dataText);
  });

  // If only one event, return it directly instead of array
  return parsedEvents.length === 1 ? parsedEvents[0] : parsedEvents;
}

/**
 * Safely parses response body from cloned response
 * Returns parsed JSON if possible, otherwise returns raw text
 * Handles SSE (Server-Sent Events) responses specially
 */
async function parseResponseBody(response: Response): Promise<unknown> {
  try {
    const text = await response.clone().text();
    if (!text) {
      return;
    }

    // Check if response is SSE format
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("text/event-stream")) {
      return parseSseResponse(text);
    }

    return parseJsonOrText(text);
  } catch {
    return;
  }
}

/**
 * Calculates duration in milliseconds from start time
 */
function calculateDuration(startTime: number): number {
  return Math.round(performance.now() - startTime);
}

type RequestContext = {
  method: string;
  url: string;
  mcpMethod: string | undefined;
  requestHeaders: Record<string, string>;
  requestBody: unknown;
  startTime: number;
  onLog: LogCallback;
};

async function logSuccessfulRequest(
  response: Response,
  context: RequestContext
): Promise<Response> {
  const duration = calculateDuration(context.startTime);
  const responseHeaders = extractHeaders(response.headers);
  const responseBody = await parseResponseBody(response.clone());

  if (shouldLogRequest(context.method, response.status, undefined)) {
    context.onLog({
      method: context.method,
      url: context.url,
      mcpMethod: context.mcpMethod,
      status: response.status,
      statusText: response.statusText,
      duration,
      requestHeaders: context.requestHeaders,
      requestBody: context.requestBody,
      responseHeaders,
      responseBody,
    });
  }

  return response;
}

function logFailedRequest(error: unknown, context: RequestContext): void {
  const duration = calculateDuration(context.startTime);
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (shouldLogRequest(context.method, undefined, errorMessage)) {
    context.onLog({
      method: context.method,
      url: context.url,
      mcpMethod: context.mcpMethod,
      duration,
      requestHeaders: context.requestHeaders,
      requestBody: context.requestBody,
      error: errorMessage,
    });
  }
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
    const mcpMethod = extractMcpMethod(requestBody);

    const context: RequestContext = {
      method,
      url,
      mcpMethod,
      requestHeaders,
      requestBody,
      startTime,
      onLog,
    };

    try {
      const response = await next(input, init);
      return await logSuccessfulRequest(response, context);
    } catch (error) {
      logFailedRequest(error, context);
      throw error;
    }
  });
}
