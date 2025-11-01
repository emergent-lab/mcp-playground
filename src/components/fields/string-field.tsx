import { Autocomplete } from "@/components/ui/autocomplete";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { TypeBadge } from "@/components/ui/type-badge";
import type { JSONSchemaProperty } from "@/lib/schema-types";
import { getDescription } from "@/lib/schema-utils";

export type StringFieldProps = {
  name: string;
  schema: JSONSchemaProperty;
  value: string;
  onChange: (value: string) => void;
  errors?: Array<{ message?: string }>;
  required?: boolean;
  onLoadCompletions?: (query: string) => Promise<string[]>;
};

export function StringField({
  name,
  schema,
  value,
  onChange,
  errors,
  required,
  onLoadCompletions,
}: StringFieldProps) {
  const description = getDescription(schema);
  const isInvalid = Boolean(errors && errors.length > 0);
  const fieldId = `field-${name}`;

  return (
    <Field data-invalid={isInvalid}>
      {/* Parameter header with name, type badge, and metadata */}
      <div className="mb-2 space-y-2">
        <div className="flex items-center gap-2">
          <FieldLabel className="mb-0" htmlFor={fieldId}>
            <code className="font-medium font-mono text-sm">{name}</code>
          </FieldLabel>
          {required && (
            <span className="text-destructive text-sm" title="Required">
              *
            </span>
          )}
          <TypeBadge type="string" />
        </div>

        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground text-xs">
          {schema.default !== undefined && (
            <div className="flex items-center gap-1.5">
              <span>Default:</span>
              <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono">
                {String(schema.default)}
              </code>
            </div>
          )}
          {schema.minLength !== undefined && (
            <span>Min length: {schema.minLength}</span>
          )}
          {schema.maxLength !== undefined && (
            <span>Max length: {schema.maxLength}</span>
          )}
          {schema.pattern && (
            <div className="flex items-center gap-1.5">
              <span>Pattern:</span>
              <code className="font-mono">{schema.pattern}</code>
            </div>
          )}
        </div>
      </div>

      {/* Input field with autocomplete support */}
      <Autocomplete
        aria-invalid={isInvalid}
        autoComplete="off"
        id={fieldId}
        name={name}
        onChange={onChange}
        onLoadCompletions={onLoadCompletions}
        placeholder={schema.default ? String(schema.default) : undefined}
        value={value}
      />
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
