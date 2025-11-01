"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { PromptArgumentForm } from "@/components/prompt-argument-form";
import { ResultViewer } from "@/components/result-viewer";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { useTRPC } from "@/lib/trpc/client";

type PromptExecutorProps = {
  serverId: string;
  promptName: string;
  promptDescription?: string;
  prompts?: Array<{ name: string; arguments?: unknown }>;
};

type PromptMessage = {
  role: "user" | "assistant";
  content:
    | {
        type: "text";
        text: string;
      }
    | {
        type: "image";
        data: string;
        mimeType: string;
      }
    | {
        type: "resource";
        resource: {
          uri: string;
          mimeType?: string;
          text?: string;
        };
      };
};

type PromptResult = {
  description?: string;
  messages: PromptMessage[];
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isPromptResult = (value: unknown): value is PromptResult => {
  if (!isRecord(value)) {
    return false;
  }

  const candidate = value as { messages?: unknown };
  return Array.isArray(candidate.messages);
};

const normalizePromptResult = (value: unknown): PromptResult | null => {
  if (isPromptResult(value)) {
    return value;
  }

  if (!isRecord(value)) {
    return null;
  }

  const nested = (value as { result?: unknown }).result;

  if (isPromptResult(nested)) {
    return nested;
  }

  return null;
};

export function PromptExecutor({
  serverId,
  promptName,
  promptDescription,
  prompts: promptsProp,
}: PromptExecutorProps) {
  const api = useTRPC();
  const [result, setResult] = useState<PromptResult | null>(null);
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);
  const [canCollapseDescription, setCanCollapseDescription] = useState(false);
  const descriptionRef = useRef<HTMLDivElement | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const prevPromptNameRef = useRef<string>(promptName);
  const queryClient = useQueryClient();

  // Only fetch if prompts prop not provided (fallback for standalone usage)
  const { data: promptsData } = useQuery(
    api.server.listPrompts.queryOptions({ serverId }, { enabled: !promptsProp })
  );

  const promptArguments = useMemo(
    () =>
      (promptsProp || promptsData?.prompts)?.find((p) => p.name === promptName)
        ?.arguments as
        | Array<{ name: string; description?: string; required?: boolean }>
        | undefined,
    [promptsProp, promptsData, promptName]
  );

  // Reset result and preserve matching arguments when prompt changes
  useEffect(() => {
    // Only run when prompt actually changes
    if (prevPromptNameRef.current === promptName) {
      return;
    }

    prevPromptNameRef.current = promptName;
    setResult(null);
    setErrors({});

    if (!promptArguments) {
      return;
    }

    const newFormValues: Record<string, string> = {};

    // Preserve values for arguments that exist in the new prompt
    for (const arg of promptArguments) {
      if (formValues[arg.name] !== undefined) {
        // Argument exists in both old and new prompt - preserve the value
        newFormValues[arg.name] = formValues[arg.name];
      } else {
        // New argument - initialize as empty string
        newFormValues[arg.name] = "";
      }
    }

    setFormValues(newFormValues);
  }, [promptName, promptArguments, formValues]);

  const executeMutation = useMutation(
    api.server.getPrompt.mutationOptions({
      onSuccess: (data) => {
        const normalized = normalizePromptResult(data);

        if (!normalized) {
          toast.error("Prompt did not return any messages");
          setResult(null);
          return;
        }

        setResult(normalized);
        toast.success("Prompt executed successfully");
        queryClient.invalidateQueries({ queryKey: api.logs.list.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Execution failed");
      },
    })
  );

  const handleSubmit = (values: Record<string, string>) => {
    executeMutation.mutate({
      serverId,
      promptName,
      arguments: values,
    });
  };

  const handleReset = () => {
    if (!promptArguments) {
      return;
    }

    // Reset to empty strings for all arguments
    const resetValues: Record<string, string> = {};
    for (const arg of promptArguments) {
      resetValues[arg.name] = "";
    }

    setFormValues(resetValues);
    setErrors({});
  };

  // Detect whether the prompt description overflows the collapsed container.
  useEffect(() => {
    if (!promptDescription) {
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
  }, [promptDescription, isDescriptionOpen]);

  const argumentCount = promptArguments?.length ?? 0;

  return (
    <div className="min-w-0 max-w-full space-y-6">
      {/* Prompt Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-lg">{promptName}</h3>
          {argumentCount > 0 && (
            <Badge variant="secondary">{argumentCount} arguments</Badge>
          )}
        </div>

        {/* Prompt Description */}
        {promptDescription && (
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
                <p className="whitespace-pre-wrap">{promptDescription}</p>
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

      {/* Arguments Form */}
      <PromptArgumentForm
        arguments={promptArguments}
        errors={errors}
        formValues={formValues}
        isSubmitting={executeMutation.isPending}
        onErrorsChange={setErrors}
        onFormValuesChange={setFormValues}
        onReset={handleReset}
        onSubmit={handleSubmit}
        promptName={promptName}
        serverId={serverId}
      />

      {/* Results */}
      {result !== null && (
        <>
          <Separator />
          <ResultViewer result={result} />
        </>
      )}
    </div>
  );
}
