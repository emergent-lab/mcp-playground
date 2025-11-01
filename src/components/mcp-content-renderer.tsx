"use client";

import Image from "next/image";
import { useState } from "react";
import type { BundledLanguage } from "shiki";
import {
  CodeBlock,
  CodeBlockCopyButton,
} from "@/components/ai-elements/code-block";
import { Response } from "@/components/ai-elements/response";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const FALLBACK_IMAGE_WIDTH = 1024;
const FALLBACK_IMAGE_HEIGHT = 768;

// MCP Content Type Definitions
export type MCPTextContent = {
  type: "text";
  text: string;
};

export type MCPImageContent = {
  type: "image";
  data: string;
  mimeType: string;
};

export type MCPAudioContent = {
  type: "audio";
  data: string;
  mimeType: string;
};

export type MCPResourceContent = {
  type: "resource";
  resource: {
    uri: string;
    name?: string;
    title?: string;
    mimeType?: string;
    text?: string;
    blob?: string;
  };
};

export type MCPResourceLinkContent = {
  type: "resource_link";
  uri: string;
  name?: string;
  title?: string;
  description?: string;
  mimeType?: string;
};

export type MCPContent =
  | MCPTextContent
  | MCPImageContent
  | MCPAudioContent
  | MCPResourceContent
  | MCPResourceLinkContent;

export type MCPContentRendererProps = {
  content: MCPContent | MCPContent[];
  mode?: "formatted" | "raw";
  enableMarkdown?: boolean;
  showRawToggle?: boolean;
  structuredContent?: unknown;
  rawResponse?: unknown;
  className?: string;
  statusBadge?: React.ReactNode;
};

// Text Detection Utilities
function isValidJSON(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

function formatTextContent(text: string): {
  formatted: string;
  language: BundledLanguage;
} {
  // Try to parse as JSON first
  if (isValidJSON(text)) {
    try {
      const parsed = JSON.parse(text);
      return {
        formatted: JSON.stringify(parsed, null, 2),
        language: "json",
      };
    } catch {
      // Fall through to plain text
    }
  }

  // Detect code patterns
  if (
    text.includes("function ") ||
    text.includes("const ") ||
    text.includes("=>")
  ) {
    return { formatted: text, language: "typescript" };
  }

  if (text.includes("def ") || text.includes("import ")) {
    return { formatted: text, language: "python" };
  }

  // Plain text with preserved formatting
  return { formatted: text, language: "markdown" };
}

// Content Label Component
function ContentLabel({ label }: { label: string }) {
  return (
    <Badge className="font-normal" variant="outline">
      {label}
    </Badge>
  );
}

// Render Text Content
function renderTextContent(
  content: MCPTextContent,
  enableMarkdown: boolean,
  contentLabel: string | null
) {
  if (enableMarkdown) {
    return (
      <div className="space-y-3">
        {contentLabel && <ContentLabel label={`${contentLabel} - Text`} />}
        <div className="max-w-none overflow-auto rounded-sm border p-6 [&_a]:text-primary [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-muted-foreground [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-sm [&_code]:before:content-[''] [&_code]:after:content-[''] [&_h1]:mb-3 [&_h1]:font-bold [&_h1]:text-2xl [&_h2]:mb-2.5 [&_h2]:font-semibold [&_h2]:text-xl [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-lg [&_li]:my-1.5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:mb-3 [&_p]:leading-7 [&_pre]:my-3 [&_pre]:rounded [&_pre]:border [&_strong]:font-semibold [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-4">
          <Response>{content.text}</Response>
        </div>
      </div>
    );
  }

  const { formatted, language } = formatTextContent(content.text);

  return (
    <div className="space-y-3">
      {contentLabel && (
        <div className="flex items-center gap-2">
          <ContentLabel label={contentLabel} />
          <Badge className="font-normal" variant="secondary">
            {language === "json" ? "JSON" : "Text"}
          </Badge>
        </div>
      )}
      <CodeBlock code={formatted} language={language}>
        <CodeBlockCopyButton />
      </CodeBlock>
    </div>
  );
}

// Render Image Content
function renderImageContent(
  content: MCPImageContent,
  contentLabel: string | null
) {
  return (
    <div className="space-y-3">
      {contentLabel && (
        <div className="flex items-center gap-2">
          <ContentLabel label={contentLabel} />
          <Badge className="font-normal" variant="secondary">
            Image
          </Badge>
          <Badge className="font-normal text-xs" variant="secondary">
            {content.mimeType}
          </Badge>
        </div>
      )}
      <div className="overflow-hidden rounded-sm border bg-muted/50 p-4">
        <Image
          alt="Content image"
          className="h-auto max-w-full rounded-sm"
          height={FALLBACK_IMAGE_HEIGHT}
          src={`data:${content.mimeType};base64,${content.data}`}
          style={{ height: "auto", width: "100%" }}
          unoptimized
          width={FALLBACK_IMAGE_WIDTH}
        />
      </div>
    </div>
  );
}

// Render Audio Content
function renderAudioContent(
  content: MCPAudioContent,
  contentLabel: string | null
) {
  return (
    <div className="space-y-3">
      {contentLabel && (
        <div className="flex items-center gap-2">
          <ContentLabel label={contentLabel} />
          <Badge className="font-normal" variant="secondary">
            Audio
          </Badge>
          <Badge className="font-normal text-xs" variant="secondary">
            {content.mimeType}
          </Badge>
        </div>
      )}
      <div className="overflow-hidden rounded-sm border bg-muted/50 p-4">
        {/* biome-ignore lint/a11y/useMediaCaption: MCP audio content may not have captions */}
        <audio
          className="w-full"
          controls
          src={`data:${content.mimeType};base64,${content.data}`}
        >
          Your browser does not support audio playback.
        </audio>
      </div>
    </div>
  );
}

// Render Resource Content
function renderResourceContent(
  content: MCPResourceContent,
  contentLabel: string | null
) {
  const { resource } = content;

  return (
    <div className="space-y-3">
      {contentLabel && <ContentLabel label={contentLabel} />}
      <div className="flex items-center gap-2">
        <Badge className="font-normal" variant="secondary">
          Embedded Resource
        </Badge>
        {resource.mimeType && (
          <Badge className="font-normal text-xs" variant="secondary">
            {resource.mimeType}
          </Badge>
        )}
      </div>
      <div className="rounded-sm border bg-muted/50 p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-muted-foreground text-xs">URI:</span>
          <code className="font-mono text-xs">{resource.uri}</code>
        </div>
        {resource.title && (
          <div className="mb-2 font-medium text-sm">{resource.title}</div>
        )}
      </div>
      {resource.text && (
        <CodeBlock code={resource.text} language="markdown">
          <CodeBlockCopyButton />
        </CodeBlock>
      )}
      {resource.blob && (
        <div className="rounded-sm border bg-muted/50 p-4 text-center text-muted-foreground text-sm">
          Binary content available
        </div>
      )}
    </div>
  );
}

// Render Resource Link Content
function renderResourceLinkContent(
  content: MCPResourceLinkContent,
  contentLabel: string | null
) {
  return (
    <div className="space-y-3">
      {contentLabel && <ContentLabel label={contentLabel} />}
      <div className="flex items-center gap-2">
        <Badge className="font-normal" variant="secondary">
          Resource Link
        </Badge>
        {content.mimeType && (
          <Badge className="font-normal text-xs" variant="secondary">
            {content.mimeType}
          </Badge>
        )}
      </div>
      <div className="rounded-sm border bg-muted/50 p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-muted-foreground text-xs">URI:</span>
          <code className="font-mono text-xs">{content.uri}</code>
        </div>
        {content.title && (
          <div className="mb-2 font-medium text-sm">{content.title}</div>
        )}
        {content.description && (
          <div className="text-muted-foreground text-sm">
            {content.description}
          </div>
        )}
      </div>
    </div>
  );
}

// Single Content Item Renderer
function SingleContentRenderer({
  content,
  enableMarkdown = false,
  index,
}: {
  content: MCPContent;
  enableMarkdown?: boolean;
  index?: number;
}) {
  const contentLabel = index !== undefined ? `Content ${index + 1}` : null;

  if (content.type === "text") {
    return renderTextContent(content, enableMarkdown, contentLabel);
  }

  if (content.type === "image") {
    return renderImageContent(content, contentLabel);
  }

  if (content.type === "audio") {
    return renderAudioContent(content, contentLabel);
  }

  if (content.type === "resource") {
    return renderResourceContent(content, contentLabel);
  }

  if (content.type === "resource_link") {
    return renderResourceLinkContent(content, contentLabel);
  }

  return (
    <div className="text-muted-foreground text-sm">Unknown content type</div>
  );
}

export function MCPContentRenderer({
  content,
  mode = "formatted",
  enableMarkdown = false,
  showRawToggle = false,
  structuredContent,
  rawResponse,
  className,
  statusBadge,
}: MCPContentRendererProps) {
  const [currentMode, setCurrentMode] = useState<"formatted" | "raw">(mode);
  const contentArray = Array.isArray(content) ? content : [content];
  const hasMultipleItems = contentArray.length > 1;

  // Determine if we should show tabs (structured + content + raw)
  const showTabs =
    showRawToggle && structuredContent && contentArray.length > 0;

  // Tabs view for structured content
  if (showTabs) {
    return (
      <div className={cn("space-y-3", className)}>
        <Tabs defaultValue="structured">
          <TabsList>
            <TabsTrigger value="structured">Structured</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="raw">Raw</TabsTrigger>
          </TabsList>
          <TabsContent className="space-y-3" value="structured">
            <Badge className="font-normal" variant="secondary">
              Structured JSON
            </Badge>
            <CodeBlock
              code={JSON.stringify(structuredContent, null, 2)}
              language="json"
            >
              <CodeBlockCopyButton />
            </CodeBlock>
          </TabsContent>
          <TabsContent className="space-y-4" value="content">
            {contentArray.map((item, index) => (
              <SingleContentRenderer
                content={item}
                enableMarkdown={enableMarkdown}
                index={hasMultipleItems ? index : undefined}
                key={`${item.type}-${index}`}
              />
            ))}
          </TabsContent>
          <TabsContent className="space-y-3" value="raw">
            <Badge className="font-normal" variant="outline">
              Complete Response
            </Badge>
            <CodeBlock
              code={JSON.stringify(
                rawResponse || {
                  content: contentArray,
                  structuredContent,
                },
                null,
                2
              )}
              language="json"
            >
              <CodeBlockCopyButton />
            </CodeBlock>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Standard view with toggle
  const rawData = rawResponse || { content: contentArray };

  return (
    <div className={cn("space-y-3", className)}>
      {(showRawToggle || statusBadge) && (
        <div className="flex items-center justify-between">
          {statusBadge}
          {showRawToggle && (
            <ToggleGroup
              onValueChange={(value) => {
                if (value) {
                  setCurrentMode(value as "formatted" | "raw");
                }
              }}
              size="sm"
              type="single"
              value={currentMode}
              variant="outline"
            >
              <ToggleGroupItem
                aria-label="View formatted content"
                value="formatted"
              >
                Formatted
              </ToggleGroupItem>
              <ToggleGroupItem aria-label="View raw JSON" value="raw">
                Raw JSON
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
      )}

      {currentMode === "raw" ? (
        <CodeBlock code={JSON.stringify(rawData, null, 2)} language="json">
          <CodeBlockCopyButton />
        </CodeBlock>
      ) : (
        <div className="space-y-4">
          {contentArray.map((item, index) => (
            <SingleContentRenderer
              content={item}
              enableMarkdown={enableMarkdown}
              index={hasMultipleItems ? index : undefined}
              key={`${item.type}-${index}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
