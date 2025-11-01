/**
 * MCP Response Types based on MCP Specification
 * https://spec.modelcontextprotocol.io/
 */

import type { MCPContent } from "@/components/mcp-content-renderer";

// Tool Response (from tools/call)
export type MCPToolResponse = {
  content: MCPContent[];
  structuredContent?: unknown;
  isError?: boolean;
};

// Prompt Response (from prompts/get)
export type MCPPromptMessage = {
  role: "user" | "assistant";
  content: MCPContent;
};

export type MCPPromptResponse = {
  description?: string;
  messages: MCPPromptMessage[];
};

// Resource Response (from resources/read)
export type MCPResourceContent = {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
};

export type MCPResourceResponse = {
  contents: MCPResourceContent[];
};

// Union type for all MCP responses
export type MCPResponse =
  | MCPToolResponse
  | MCPPromptResponse
  | MCPResourceResponse;

// Type Guards
export function isToolResponse(response: unknown): response is MCPToolResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "content" in response &&
    Array.isArray((response as { content: unknown }).content)
  );
}

export function isPromptResponse(
  response: unknown
): response is MCPPromptResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "messages" in response &&
    Array.isArray((response as { messages: unknown }).messages)
  );
}

export function isResourceResponse(
  response: unknown
): response is MCPResourceResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "contents" in response &&
    Array.isArray((response as { contents: unknown }).contents)
  );
}

// Detect response type
export function detectMCPResponseType(
  response: unknown
): "tool" | "prompt" | "resource" | "unknown" {
  if (isToolResponse(response)) {
    return "tool";
  }
  if (isPromptResponse(response)) {
    return "prompt";
  }
  if (isResourceResponse(response)) {
    return "resource";
  }
  return "unknown";
}
