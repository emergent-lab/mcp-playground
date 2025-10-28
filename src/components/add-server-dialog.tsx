"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GlobeIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc/client";

const formSchema = z.object({
  serverUrl: z.string().url("Must be a valid URL"),
  serverName: z.string(),
});

type AddServerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddServerDialog({ open, onOpenChange }: AddServerDialogProps) {
  const api = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const connectMutation = useMutation(
    api.server.connect.mutationOptions({
      onSuccess: (data) => {
        if (data.status === "needs_auth") {
          toast.info("Redirecting to authorization...");
          window.location.href = data.authUrl;
        } else {
          toast.success("Connected successfully!");
          form.reset();
          queryClient.invalidateQueries({
            queryKey: api.server.list.queryKey(),
          });
          onOpenChange(false);
          // Navigate to the newly connected server
          router.push(`/server/${data.serverId}`);
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to connect");
      },
    })
  );

  const form = useForm({
    defaultValues: {
      serverUrl: "",
      serverName: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async ({ value }) => {
      // Check if user has a session, if not create anonymous session
      const { data: session } = await authClient.getSession();

      if (!session) {
        // Silently create anonymous session
        await authClient.signIn.anonymous();
      }

      // Now proceed with server connection
      const serverId = crypto.randomUUID();
      connectMutation.mutate({
        serverId,
        serverUrl: value.serverUrl,
        serverName: value.serverName || undefined,
      });
    },
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogHeader className="sr-only">
        <DialogTitle>Add Server</DialogTitle>
        <DialogDescription>Connect to an MCP server via HTTP</DialogDescription>
      </DialogHeader>
      <DialogContent>
        <div className="mb-6">
          <h2 className="mb-1 font-semibold text-lg">Add Server</h2>
          <p className="text-muted-foreground text-sm">
            Connect to an MCP server via HTTP
          </p>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <form.Field name="serverUrl">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched &&
                field.state.meta.errors.length > 0;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Server URL</FieldLabel>
                  <InputGroup>
                    <InputGroupInput
                      aria-invalid={isInvalid}
                      id={field.name}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="https://mcp-server.example.com"
                      value={field.state.value}
                    />
                    <InputGroupAddon>
                      <GlobeIcon className="size-4" />
                    </InputGroupAddon>
                  </InputGroup>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <form.Field name="serverName">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>
                  Server Name (Optional)
                </FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="My MCP Server"
                    value={field.state.value}
                  />
                </InputGroup>
              </Field>
            )}
          </form.Field>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              disabled={connectMutation.isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={connectMutation.isPending} type="submit">
              {connectMutation.isPending && <Spinner className="size-4" />}
              Connect Server
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
