import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { TypeBadge } from "@/components/ui/type-badge";
import type { JSONSchemaProperty } from "@/lib/schema-types";
import { getDescription } from "@/lib/schema-utils";

export type BooleanFieldProps = {
  name: string;
  schema: JSONSchemaProperty;
  value: boolean;
  onChange: (value: boolean) => void;
  errors?: Array<{ message?: string }>;
  required?: boolean;
};

export function BooleanField({
  name,
  schema,
  value,
  onChange,
  errors,
  required,
}: BooleanFieldProps) {
  const description = getDescription(schema);
  const isInvalid = Boolean(errors && errors.length > 0);
  const fieldId = `field-${name}`;

  return (
    <Field data-invalid={isInvalid} orientation="horizontal">
      <FieldContent>
        {/* Parameter header */}
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
            <TypeBadge type="boolean" />
          </div>

          {description && (
            <p className="text-muted-foreground text-sm">{description}</p>
          )}

          {/* Default value if present */}
          {schema.default !== undefined && (
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
              <span>Default:</span>
              <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono">
                {String(schema.default)}
              </code>
            </div>
          )}
        </div>
        {isInvalid && <FieldError errors={errors} />}
      </FieldContent>
      <Switch
        aria-invalid={isInvalid}
        checked={value}
        id={fieldId}
        name={name}
        onCheckedChange={onChange}
      />
    </Field>
  );
}
