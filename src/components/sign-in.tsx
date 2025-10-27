"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { MailIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { GithubDark } from "./ui/svgs/githubDark";
import { GithubLight } from "./ui/svgs/githubLight";

const formSchema = z.object({
  email: z.string().email("Must be a valid email address"),
});

export function SignIn() {
  const magicLinkMutation = useMutation({
    mutationFn: async (email: string) => {
      await authClient.signIn.magicLink({ email });
    },
    onSuccess: () => {
      toast.success("Magic link sent! Check your email.");
      form.reset();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send magic link");
    },
  });

  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: ({ value }) => {
      magicLinkMutation.mutate(value.email);
    },
  });

  return (
    <div className="space-y-4">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <form.Field name="email">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && field.state.meta.errors.length > 0;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                <InputGroup>
                  <InputGroupInput
                    aria-invalid={isInvalid}
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    value={field.state.value}
                  />
                  <InputGroupAddon>
                    <MailIcon className="size-4" />
                  </InputGroupAddon>
                </InputGroup>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        </form.Field>

        <Button
          className="w-full"
          disabled={magicLinkMutation.isPending}
          type="submit"
        >
          {magicLinkMutation.isPending && <Spinner className="size-4" />}
          Send Magic Link
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      <Button asChild className="w-full" variant="outline">
        <a href="/api/auth/signin/github">
          <GithubLight className="size-5 dark:hidden" />
          <GithubDark className="hidden size-5 dark:block" />
          Continue with GitHub
        </a>
      </Button>
    </div>
  );
}
