"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/lib/trpc/client";

type ToolExecutorProps = {
  serverId: string;
  toolName: string;
};

const formSchema = z.object({
  arguments: z.string().refine(
    (val) => {
      try {
        JSON.parse(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: "Must be valid JSON" }
  ),
});

export function ToolExecutor({ serverId, toolName }: ToolExecutorProps) {
  const api = useTRPC();
  const [result, setResult] = useState<unknown>(null);
  const queryClient = useQueryClient();

  const { data: tools } = useQuery({
    ...api.server.listTools.queryOptions({ serverId }),
    enabled: !!serverId,
  });

  const toolSchema = tools?.find((t) => t.name === toolName)?.inputSchema;

  const executeMutation = useMutation(
    api.server.callTool.mutationOptions({
      onSuccess: (data) => {
        setResult(data);
        toast.success("Tool executed successfully");
        queryClient.invalidateQueries({ queryKey: api.logs.list.queryKey() });
      },
      onError: (error) => {
        toast.error(error.message || "Execution failed");
        setResult({ error: error.message });
      },
    })
  );

  const form = useForm({
    defaultValues: {
      arguments: "{}",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({ value }) => {
      const args = JSON.parse(value.arguments);
      executeMutation.mutate({
        serverId,
        toolName,
        arguments: args,
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execute Tool</CardTitle>
        <CardDescription>
          {toolName ? (
            <div className="mt-2 flex items-center gap-2">
              <Badge variant="outline">{toolName}</Badge>
              {toolSchema && (
                <span className="text-muted-foreground text-xs">
                  {
                    Object.keys(
                      (toolSchema as { properties?: object }).properties || {}
                    ).length
                  }{" "}
                  parameters
                </span>
              )}
            </div>
          ) : (
            "Select a tool to execute"
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name="arguments">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched &&
                field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Arguments (JSON)</FieldLabel>
                  <FieldDescription>
                    Enter tool arguments as valid JSON
                  </FieldDescription>
                  <Textarea
                    aria-invalid={isInvalid}
                    className="font-mono text-sm"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    rows={8}
                    value={field.state.value}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <ButtonGroup>
            <Button disabled={executeMutation.isPending} type="submit">
              {executeMutation.isPending && <Spinner className="size-4" />}
              Execute
            </Button>
            <Button
              onClick={() => form.reset()}
              type="button"
              variant="outline"
            >
              Reset
            </Button>
          </ButtonGroup>

          {result !== null && (
            <div className="mt-4">
              <h4 className="mb-2 font-semibold">Result</h4>
              <ScrollArea className="h-[300px]">
                <pre className="rounded-sm bg-muted p-4 text-xs">
                  {typeof result === "string"
                    ? result
                    : JSON.stringify(
                        result as Record<string, unknown>,
                        null,
                        2
                      )}
                </pre>
              </ScrollArea>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
