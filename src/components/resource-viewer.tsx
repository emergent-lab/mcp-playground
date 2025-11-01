"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  type MCPContent,
  MCPContentRenderer,
} from "@/components/mcp-content-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { useTRPC } from "@/lib/trpc/client";

type ResourceViewerProps = {
  serverId: string;
  resourceUri: string;
  resourceName: string;
  resourceMimeType?: string;
};

type ResourceContent = {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
};

type ResourceResult = {
  contents: ResourceContent[];
};

function convertToMCPContent(content: ResourceContent): MCPContent {
  // Handle image blob
  if (content.blob && content.mimeType?.startsWith("image/")) {
    return {
      type: "image",
      data: content.blob,
      mimeType: content.mimeType,
    };
  }

  // Handle audio blob
  if (content.blob && content.mimeType?.startsWith("audio/")) {
    return {
      type: "audio",
      data: content.blob,
      mimeType: content.mimeType,
    };
  }

  // Handle text content
  if (content.text) {
    return {
      type: "text",
      text: content.text,
    };
  }

  // Handle other binary content
  if (content.blob) {
    return {
      type: "resource",
      resource: {
        uri: content.uri,
        mimeType: content.mimeType,
        blob: content.blob,
      },
    };
  }

  // Fallback to text with empty content
  return {
    type: "text",
    text: "No content available",
  };
}

export function ResourceViewer({
  serverId,
  resourceUri,
  resourceName,
  resourceMimeType,
}: ResourceViewerProps): React.ReactElement {
  const api = useTRPC();
  const [showRaw, setShowRaw] = useState(false);

  const {
    data: resourceData,
    isLoading,
    error,
  } = useQuery({
    ...api.server.readResource.queryOptions({
      serverId,
      uri: resourceUri,
    }),
    enabled: !!serverId && !!resourceUri,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-sm border border-destructive/20 bg-destructive/10 p-6 text-center">
        <Badge className="mb-3" variant="destructive">
          Error
        </Badge>
        <p className="text-destructive text-sm">
          {error.message || "Failed to load resource"}
        </p>
      </div>
    );
  }

  const result = resourceData as ResourceResult | undefined;

  if (!result?.contents || result.contents.length === 0) {
    return (
      <div className="rounded-sm border border-dashed p-8 text-center text-muted-foreground text-sm">
        No content available
      </div>
    );
  }

  const { contents } = result;
  const mcpContents = contents.map(convertToMCPContent);

  return (
    <div className="space-y-6">
      {/* Resource Header */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">{resourceName}</h3>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <span>URI:</span>
            <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono">
              {resourceUri}
            </code>
          </div>
          {resourceMimeType && (
            <Badge variant="secondary">{resourceMimeType}</Badge>
          )}
          <Button
            onClick={() => setShowRaw(!showRaw)}
            size="sm"
            variant="outline"
          >
            {showRaw ? "View Formatted" : "View Raw JSON"}
          </Button>
        </div>
      </div>

      <Separator />

      {/* Content */}
      {showRaw ? (
        <MCPContentRenderer
          content={mcpContents}
          mode="raw"
          rawResponse={result}
        />
      ) : (
        <MCPContentRenderer content={mcpContents} />
      )}
    </div>
  );
}
