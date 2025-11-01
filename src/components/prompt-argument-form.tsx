"use client";

import { Autocomplete } from "@/components/ui/autocomplete";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import { TypeBadge } from "@/components/ui/type-badge";
import { useTRPCClient } from "@/lib/trpc/client";

type PromptArgument = {
  name: string;
  description?: string;
  required?: boolean;
};

type PromptArgumentFormProps = {
  arguments?: PromptArgument[];
  onSubmit: (values: Record<string, string>) => void;
  isSubmitting?: boolean;
  serverId?: string;
  promptName?: string;
  formValues: Record<string, string>;
  onFormValuesChange: (values: Record<string, string>) => void;
  errors: Record<string, string>;
  onErrorsChange: (errors: Record<string, string>) => void;
  onReset: () => void;
};

export function PromptArgumentForm({
  arguments: promptArguments = [],
  onSubmit,
  isSubmitting = false,
  serverId,
  promptName,
  formValues,
  onFormValuesChange,
  errors,
  onErrorsChange,
  onReset,
}: PromptArgumentFormProps): React.ReactElement {
  const trpcClient = useTRPCClient();

  // Create completion loader for a specific argument
  // NOTE: Autocomplete is currently disabled (not passed to Autocomplete component)
  // to allow time for UX refinement before shipping. Logic kept for future use.
  const _createCompletionLoader = (argName: string) => {
    if (!(serverId && promptName)) {
      return;
    }

    return async (query: string): Promise<string[]> => {
      try {
        const result = await trpcClient.server.complete.query({
          serverId,
          ref: { type: "ref/prompt", name: promptName },
          argument: { name: argName, value: query },
          context: {
            arguments: Object.fromEntries(
              Object.entries(formValues).filter(([key]) => key !== argName)
            ),
          },
        });
        return result.values || [];
      } catch {
        // Silently fail - server might not support completions
        return [];
      }
    };
  };

  const handleChange = (name: string, value: string) => {
    onFormValuesChange({ ...formValues, [name]: value });
    // Clear error when user types
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      onErrorsChange(newErrors);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    const newErrors: Record<string, string> = {};
    for (const arg of promptArguments) {
      if (arg.required && !formValues[arg.name]?.trim()) {
        newErrors[arg.name] = `${arg.name} is required`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      onErrorsChange(newErrors);
      return;
    }

    onSubmit(formValues);
  };

  // Separate required and optional arguments
  const requiredArgs = promptArguments.filter((arg) => arg.required);
  const optionalArgs = promptArguments.filter((arg) => !arg.required);

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {promptArguments.length === 0 ? (
        <div className="rounded-sm border border-dashed p-8 text-center text-muted-foreground text-sm">
          This prompt does not require any arguments
        </div>
      ) : (
        <>
          {/* Required Arguments */}
          {requiredArgs.length > 0 && (
            <FieldSet>
              <FieldLegend>Required Arguments</FieldLegend>
              <FieldGroup>
                {requiredArgs.map((arg) => (
                  <Field
                    data-invalid={Boolean(errors[arg.name])}
                    key={arg.name}
                  >
                    <div className="mb-2 space-y-2">
                      <div className="flex items-center gap-2">
                        <FieldLabel
                          className="mb-0"
                          htmlFor={`arg-${arg.name}`}
                        >
                          <code className="font-medium font-mono text-sm">
                            {arg.name}
                          </code>
                        </FieldLabel>
                        <span
                          className="text-destructive text-sm"
                          title="Required"
                        >
                          *
                        </span>
                        <TypeBadge type="string" />
                      </div>

                      {arg.description && (
                        <p className="text-muted-foreground text-sm">
                          {arg.description}
                        </p>
                      )}
                    </div>

                    <Autocomplete
                      aria-invalid={Boolean(errors[arg.name])}
                      autoComplete="off"
                      id={`arg-${arg.name}`}
                      name={arg.name}
                      onChange={(value) => handleChange(arg.name, value)}
                      // onLoadCompletions={_createCompletionLoader(arg.name)} // Disabled for now
                      placeholder={`Enter ${arg.name}`}
                      value={formValues[arg.name] || ""}
                    />

                    {errors[arg.name] && (
                      <FieldError errors={[{ message: errors[arg.name] }]} />
                    )}
                  </Field>
                ))}
              </FieldGroup>
            </FieldSet>
          )}

          {/* Optional Arguments */}
          {optionalArgs.length > 0 && (
            <>
              {requiredArgs.length > 0 && <Separator />}
              <FieldSet>
                <FieldLegend>Optional Arguments</FieldLegend>
                <FieldGroup>
                  {optionalArgs.map((arg) => (
                    <Field key={arg.name}>
                      <div className="mb-2 space-y-2">
                        <div className="flex items-center gap-2">
                          <FieldLabel
                            className="mb-0"
                            htmlFor={`arg-${arg.name}`}
                          >
                            <code className="font-medium font-mono text-sm">
                              {arg.name}
                            </code>
                          </FieldLabel>
                          <TypeBadge type="string" />
                        </div>

                        {arg.description && (
                          <p className="text-muted-foreground text-sm">
                            {arg.description}
                          </p>
                        )}
                      </div>

                      <Autocomplete
                        autoComplete="off"
                        id={`arg-${arg.name}`}
                        name={arg.name}
                        onChange={(value) => handleChange(arg.name, value)}
                        // onLoadCompletions={_createCompletionLoader(arg.name)} // Disabled for now
                        placeholder={`Enter ${arg.name} (optional)`}
                        value={formValues[arg.name] || ""}
                      />
                    </Field>
                  ))}
                </FieldGroup>
              </FieldSet>
            </>
          )}
        </>
      )}

      {/* Action Buttons */}
      <ButtonGroup>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting && <Spinner />}
          Execute
        </Button>
        <Button
          disabled={isSubmitting}
          onClick={onReset}
          type="button"
          variant="outline"
        >
          Reset
        </Button>
      </ButtonGroup>
    </form>
  );
}
