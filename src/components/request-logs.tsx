"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useTRPC } from "@/lib/trpc/client";

type RequestLogsProps = {
  serverId?: string;
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

export function RequestLogs({ serverId }: RequestLogsProps) {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const [showConnectionSetup, setShowConnectionSetup] = useState(false);
  const [serverSelectedAt, setServerSelectedAt] = useState<Date | null>(null);

  // Update timestamp when server changes
  useEffect(() => {
    if (serverId) {
      setServerSelectedAt(new Date());
    }
  }, [serverId]);

  const { data: allLogs } = useQuery({
    ...api.logs.list.queryOptions({
      serverId: serverId || "",
      limit: 50,
      since: serverSelectedAt?.toISOString(),
    }),
    refetchInterval: 1000,
    refetchOnWindowFocus: true,
    enabled: !!serverId,
  });

  // Filter out connection setup logs unless user wants to see them
  const logs = showConnectionSetup
    ? allLogs
    : allLogs?.filter(
        (log) =>
          log.mcpMethod !== "initialize" &&
          log.mcpMethod !== "notifications/initialized"
      );

  const clearMutation = useMutation(
    api.logs.clear.mutationOptions({
      onSuccess: () => {
        toast.success("Logs cleared");
        queryClient.invalidateQueries({ queryKey: api.logs.list.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Failed to clear logs");
      },
    })
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Request Logs</CardTitle>
          <CardAction>
            <ButtonGroup>
              <Button
                onClick={() => setShowConnectionSetup(!showConnectionSetup)}
                size="sm"
                variant="outline"
              >
                {showConnectionSetup ? "Hide" : "Show"} Initialization
              </Button>
              <Button
                disabled={!(logs?.length && serverId)}
                onClick={() => {
                  if (serverId) {
                    clearMutation.mutate({ serverId });
                  }
                }}
                size="sm"
                variant="outline"
              >
                Clear Logs
              </Button>
            </ButtonGroup>
          </CardAction>
        </div>
      </CardHeader>
      <CardContent>
        {serverId ? (
          !logs || logs.length === 0 ? (
            <Empty>
              <EmptyTitle>No logs yet</EmptyTitle>
              <EmptyDescription>
                Logs will appear here as you make requests
              </EmptyDescription>
            </Empty>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <Accordion className="w-full" collapsible type="single">
                {logs.map((log) => (
                  <AccordionItem key={log.id} value={log.id}>
                    <AccordionTrigger className="cursor-pointer hover:no-underline">
                      <div className="flex w-full items-center gap-2 pr-2 text-sm">
                        <Badge
                          variant={getStatusVariant(log.status ?? undefined)}
                        >
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
                          <pre className="wrap-break-word whitespace-pre-wrap rounded-sm bg-muted p-4 font-mono text-xs">
                            {JSON.stringify(log.requestBody, null, 2)}
                          </pre>
                        </div>

                        <Separator />

                        {/* Response Details */}
                        <div>
                          <h4 className="mb-2 font-semibold">Response</h4>
                          {log.error ? (
                            <div className="text-destructive">{log.error}</div>
                          ) : (
                            <pre className="wrap-break-word whitespace-pre-wrap rounded-sm bg-muted p-4 font-mono text-xs">
                              {JSON.stringify(log.responseBody, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
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
      </CardContent>
    </Card>
  );
}
