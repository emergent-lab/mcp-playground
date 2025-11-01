"use client";

import {
  type MCPContent,
  MCPContentRenderer,
} from "@/components/mcp-content-renderer";
import { Badge } from "@/components/ui/badge";
import {
  detectMCPResponseType,
  isPromptResponse,
  isToolResponse,
  type MCPPromptResponse,
  type MCPToolResponse,
} from "@/lib/mcp-types";

export type ResultViewerProps = {
  result: unknown;
};

// Render Tool Response
function ToolResponseViewer({ response }: { response: MCPToolResponse }) {
  const isError = response.isError === true;

  // Handle error cases
  if (isError) {
    const errorMessage =
      response.content &&
      response.content.length > 0 &&
      response.content[0] &&
      response.content[0].type === "text"
        ? response.content[0].text
        : "An error occurred";

    return (
      <div className="space-y-3">
        <Badge variant="destructive">Error</Badge>
        <div className="rounded-sm border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-destructive text-sm">{errorMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <MCPContentRenderer
      content={response.content}
      rawResponse={response}
      showRawToggle={true}
      statusBadge={<Badge variant="default">Success</Badge>}
      structuredContent={response.structuredContent}
    />
  );
}

// Render Prompt Response
function PromptResponseViewer({ response }: { response: MCPPromptResponse }) {
  // Extract content from messages for readable display
  const content = response.messages.map((message) => message.content);

  return (
    <MCPContentRenderer
      content={content}
      enableMarkdown={true}
      rawResponse={response}
      showRawToggle={true}
      statusBadge={<Badge variant="default">Success</Badge>}
    />
  );
}

export function ResultViewer({ result }: ResultViewerProps) {
  // Detect MCP response type
  const responseType = detectMCPResponseType(result);

  // Handle Tool Response
  if (responseType === "tool" && isToolResponse(result)) {
    return <ToolResponseViewer response={result} />;
  }

  // Handle Prompt Response
  if (responseType === "prompt" && isPromptResponse(result)) {
    return <PromptResponseViewer response={result} />;
  }

  // Handle Resource Response (TODO: implement later)
  if (responseType === "resource") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant="default">Resource</Badge>
          <Badge className="font-normal" variant="outline">
            Not yet implemented
          </Badge>
        </div>
        <MCPContentRenderer
          content={
            [
              { type: "text", text: JSON.stringify(result, null, 2) },
            ] as MCPContent[]
          }
          rawResponse={result}
          showRawToggle={true}
        />
      </div>
    );
  }

  // Fallback for unexpected formats
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant="default">Response</Badge>
        <Badge className="font-normal" variant="outline">
          Unexpected Format
        </Badge>
      </div>
      <MCPContentRenderer
        content={
          [
            { type: "text", text: JSON.stringify(result, null, 2) },
          ] as MCPContent[]
        }
        rawResponse={result}
        showRawToggle={true}
      />
    </div>
  );
}
