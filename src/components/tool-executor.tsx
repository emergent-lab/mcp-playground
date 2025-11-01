"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  CodeBlock,
  CodeBlockCopyButton,
} from "@/components/ai-elements/code-block";
import { ResultViewer } from "@/components/result-viewer";
import { ToolParameterForm } from "@/components/tool-parameter-form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import type {
  FieldValue,
  FormValues,
  ToolInputSchema,
} from "@/lib/schema-types";
import { useTRPC } from "@/lib/trpc/client";

type ToolExecutorProps = {
  serverId: string;
  toolName: string;
  toolDescription?: string;
  tools?: Array<{ name: string; inputSchema?: unknown }>;
};

export function ToolExecutor({
  serverId,
  toolName,
  toolDescription,
  tools: toolsProp,
}: ToolExecutorProps) {
  const api = useTRPC();
  const [result, setResult] = useState<unknown>(null);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [canCollapseDescription, setCanCollapseDescription] = useState(false);
  const [formValues, setFormValues] = useState<FormValues>({});
  const descriptionRef = useRef<HTMLDivElement | null>(null);
  const prevToolNameRef = useRef<string>(toolName);
  const queryClient = useQueryClient();

  // Only fetch if tools prop not provided (fallback for standalone usage)
  const { data: toolsData } = useQuery(
    api.server.listTools.queryOptions({ serverId }, { enabled: !toolsProp })
  );

  const inputSchema = useMemo(
    () =>
      (toolsProp || toolsData?.tools)?.find((t) => t.name === toolName)
        ?.inputSchema as ToolInputSchema | undefined,
    [toolsProp, toolsData, toolName]
  );

  // Reset result and preserve matching parameters when tool changes
  // Detect whether the description overflows the collapsed container.
  useEffect(() => {
    // Only run when tool actually changes
    if (prevToolNameRef.current === toolName) {
      return;
    }

    prevToolNameRef.current = toolName;
    setResult(null);

    if (!inputSchema) {
      return;
    }

    const properties = inputSchema.properties || {};
    const newFormValues: FormValues = {};

    // Preserve values for parameters that exist in the new tool
    for (const [paramName, paramSchema] of Object.entries(properties)) {
      if (formValues[paramName] !== undefined) {
        // Parameter exists in both old and new tool - preserve the value
        newFormValues[paramName] = formValues[paramName];
      } else if (paramSchema.default !== undefined) {
        // New parameter with a default value
        newFormValues[paramName] = paramSchema.default as FieldValue;
      }
      // Otherwise leave it undefined (will show as empty)
    }

    setFormValues(newFormValues);
  }, [toolName, inputSchema, formValues]);

  // Fetch tool execution history
  const { data: toolHistory } = useQuery({
    ...api.logs.listToolExecutions.queryOptions({
      serverId,
      toolName,
      limit: 10,
    }),
    enabled: !!serverId && !!toolName,
  });

  const executeMutation = useMutation(
    api.server.callTool.mutationOptions({
      onSuccess: (data) => {
        setResult(data);
        toast.success("Tool executed successfully");
        queryClient.invalidateQueries({ queryKey: api.logs.list.queryKey() });
        queryClient.invalidateQueries({
          queryKey: api.logs.listToolExecutions.queryKey({
            serverId,
            toolName,
          }),
        });
      },
      onError: (error) => {
        toast.error(error.message || "Execution failed");
        setResult({ error: error.message });
      },
    })
  );

  const handleSubmit = (values: FormValues) => {
    executeMutation.mutate({
      serverId,
      toolName,
      arguments: values,
    });
  };

  const handleReset = () => {
    if (!inputSchema) {
      return;
    }

    const properties = inputSchema.properties || {};
    const resetValues: FormValues = {};

    // Reset to schema defaults only
    for (const [paramName, paramSchema] of Object.entries(properties)) {
      if (paramSchema.default !== undefined) {
        resetValues[paramName] = paramSchema.default as FieldValue;
      }
    }

    setFormValues(resetValues);
  };

  const handleReplay = (logEntry: NonNullable<typeof toolHistory>[number]) => {
    const requestBody = logEntry.requestBody as {
      params?: { arguments?: Record<string, unknown> };
    };
    const args = requestBody.params?.arguments || {};

    // Format timestamp for toast
    const timestamp = new Date(logEntry.createdAt).toLocaleString();

    // Auto-execute with historical parameters
    toast.info(`Replaying execution from ${timestamp}`);
    executeMutation.mutate({
      serverId,
      toolName,
      arguments: args as FormValues,
    });
  };

  useEffect(() => {
    if (!toolDescription) {
      setCanCollapseDescription(false);
      return;
    }

    const element = descriptionRef.current;

    if (!element) {
      setCanCollapseDescription(false);
      return;
    }

    const clampClass = "line-clamp-3";
    const shouldTemporarilyClamp =
      isDescriptionOpen && !element.classList.contains(clampClass);

    if (shouldTemporarilyClamp) {
      element.classList.add(clampClass);
    }

    const isOverflowing = element.scrollHeight > element.clientHeight + 1;
    setCanCollapseDescription(isOverflowing);

    if (shouldTemporarilyClamp) {
      element.classList.remove(clampClass);
    }
  }, [toolDescription, isDescriptionOpen]);

  return (
    <div className="space-y-6">
      {/* Tool Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">{toolName}</h3>
          {inputSchema?.properties && (
            <Badge variant="secondary">
              {Object.keys(inputSchema.properties).length} parameters
            </Badge>
          )}
        </div>

        {/* Tool Description */}
        {toolDescription && (
          <div className="space-y-2">
            <Collapsible
              onOpenChange={setIsDescriptionOpen}
              open={isDescriptionOpen}
            >
              <div
                className={`overflow-hidden text-muted-foreground text-sm ${
                  isDescriptionOpen ? "" : "line-clamp-3"
                }`}
                ref={descriptionRef}
              >
                <p className="whitespace-pre-wrap">{toolDescription}</p>
              </div>
              {canCollapseDescription && (
                <CollapsibleTrigger className="text-primary text-sm underline-offset-4 hover:underline">
                  {isDescriptionOpen ? "Show less" : "Show more"}
                </CollapsibleTrigger>
              )}
            </Collapsible>
          </div>
        )}
      </div>

      <Separator />

      {/* Parameters Form */}
      {inputSchema ? (
        <ToolParameterForm
          formValues={formValues}
          inputSchema={inputSchema}
          isSubmitting={executeMutation.isPending}
          onFormValuesChange={setFormValues}
          onReset={handleReset}
          onSubmit={handleSubmit}
        />
      ) : (
        <div className="rounded-sm border border-dashed p-8 text-center text-muted-foreground text-sm">
          {toolName ? "Loading tool schema..." : "Select a tool to execute"}
        </div>
      )}

      {/* Results */}
      {result !== null && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Result</h4>
            <ResultViewer result={result} />
          </div>
        </>
      )}

      {/* Tool Execution History */}
      {toolHistory && toolHistory.length > 0 && (
        <>
          <Separator />
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Recent Executions</h4>
            <Accordion className="w-full" collapsible type="single">
              {toolHistory.map((log) => {
                const timestamp = new Date(log.createdAt).toLocaleString();
                const statusBadge =
                  log.status && log.status >= 200 && log.status < 300
                    ? "default"
                    : "destructive";

                return (
                  <AccordionItem key={log.id} value={log.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex w-full items-center justify-between pr-4">
                        <span className="text-sm">{timestamp}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusBadge}>{log.status}</Badge>
                          {log.duration && (
                            <span className="text-muted-foreground text-xs">
                              {log.duration}ms
                            </span>
                          )}
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        <div>
                          <h5 className="mb-2 font-medium text-sm">
                            Parameters
                          </h5>
                          <CodeBlock
                            code={JSON.stringify(
                              (
                                log.requestBody as {
                                  params?: { arguments?: unknown };
                                }
                              )?.params?.arguments || {},
                              null,
                              2
                            )}
                            language="json"
                          >
                            <CodeBlockCopyButton />
                          </CodeBlock>
                        </div>
                        <Button
                          onClick={() => handleReplay(log)}
                          size="sm"
                          variant="outline"
                        >
                          Replay with these parameters
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        </>
      )}
    </div>
  );
}
