"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  CodeBlock,
  CodeBlockCopyButton,
} from "@/components/ai-elements/code-block";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTRPC } from "@/lib/trpc/client";

type RequestLogsProps = {
  serverId?: string;
  onLogCountChange?: (count: number) => void;
};

function getStatusVariant(
  status?: number
): "default" | "secondary" | "outline" | "destructive" {
  if (!status) {
    return "destructive";
  }
  if (status >= 200 && status < 300) {
    return "default";
  }
  if (status >= 300 && status < 400) {
    return "secondary";
  }
  if (status >= 400 && status < 500) {
    return "outline";
  }
  return "destructive";
}

function formatTimestamp(date: Date): string {
  const month = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const ms = String(date.getMilliseconds()).padStart(2, "0").slice(0, 2);

  return `${month} ${day} ${hours}:${minutes}:${seconds}.${ms}`;
}

type LogItemProps = {
  log: {
    id: string;
    status: number | null;
    mcpMethod: string | null;
    method: string;
    createdAt: string;
    duration: number | null;
    requestBody?: unknown;
    responseBody?: unknown;
    error: string | null;
  };
  isNew: boolean;
};

function LogItem({ log, isNew }: LogItemProps) {
  return (
    <AccordionItem
      className={
        isNew ? "fade-in slide-in-from-bottom-2 animate-in duration-200" : ""
      }
      key={log.id}
      value={log.id}
    >
      <AccordionTrigger className="cursor-pointer hover:no-underline">
        <div className="flex w-full items-center gap-2 pr-2 text-sm">
          <Badge variant={getStatusVariant(log.status ?? undefined)}>
            {log.status || "ERR"}
          </Badge>
          {log.mcpMethod ? (
            <Badge className="font-mono" variant="outline">
              {log.mcpMethod}
            </Badge>
          ) : (
            <span className="font-mono text-muted-foreground">
              {log.method}
            </span>
          )}
          <span className="font-mono text-muted-foreground text-xs">
            {formatTimestamp(new Date(log.createdAt))}
          </span>
          <span className="flex-1" />
          <span className="text-muted-foreground text-xs">
            {log.duration}ms
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4 pt-4">
          {/* Request Details */}
          <div>
            <h4 className="mb-2 font-semibold">Request</h4>
            <CodeBlock
              code={
                log.requestBody !== undefined
                  ? JSON.stringify(log.requestBody, null, 2)
                  : "{}"
              }
              language="json"
            >
              <CodeBlockCopyButton />
            </CodeBlock>
          </div>

          <Separator />

          {/* Response Details */}
          <div>
            <h4 className="mb-2 font-semibold">Response</h4>
            {log.error ? (
              <div className="text-destructive">{log.error}</div>
            ) : (
              <CodeBlock
                code={
                  log.responseBody !== undefined
                    ? JSON.stringify(log.responseBody, null, 2)
                    : "{}"
                }
                language="json"
              >
                <CodeBlockCopyButton />
              </CodeBlock>
            )}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

export function RequestLogs({ serverId, onLogCountChange }: RequestLogsProps) {
  const api = useTRPC();
  const seenLogIds = useRef(new Set<string>());

  // Clear seen logs when server changes
  useEffect(() => {
    if (serverId) {
      seenLogIds.current.clear();
    }
  }, [serverId]);

  const { data: logs } = useQuery({
    ...api.logs.list.queryOptions({
      serverId: serverId || "",
      limit: 10,
    }),
    refetchInterval: 1000,
    refetchOnWindowFocus: true,
    enabled: !!serverId,
  });

  // Notify parent of log count changes
  useEffect(() => {
    if (onLogCountChange && logs) {
      onLogCountChange(logs.length);
    }
  }, [logs, onLogCountChange]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-hidden">
        {serverId ? (
          !logs || logs.length === 0 ? (
            <Empty>
              <EmptyTitle>No logs yet</EmptyTitle>
              <EmptyDescription>
                Logs will appear here as you make requests
              </EmptyDescription>
            </Empty>
          ) : (
            <ScrollArea className="h-full px-4">
              <Accordion className="w-full" collapsible type="single">
                {logs.map((log) => {
                  const isNew = !seenLogIds.current.has(log.id);
                  if (isNew) {
                    seenLogIds.current.add(log.id);
                  }
                  return <LogItem isNew={isNew} key={log.id} log={log} />;
                })}
              </Accordion>
            </ScrollArea>
          )
        ) : (
          <Empty>
            <EmptyTitle>No server selected</EmptyTitle>
            <EmptyDescription>
              Select a server to view request logs
            </EmptyDescription>
          </Empty>
        )}
      </div>
    </div>
  );
}
