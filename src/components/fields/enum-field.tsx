import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TypeBadge } from "@/components/ui/type-badge";
import type { JSONSchemaProperty } from "@/lib/schema-types";
import { getDescription, getEnumValues } from "@/lib/schema-utils";

export type EnumFieldProps = {
  name: string;
  schema: JSONSchemaProperty;
  value: string;
  onChange: (value: string) => void;
  errors?: Array<{ message?: string }>;
  required?: boolean;
};

export function EnumField({
  name,
  schema,
  value,
  onChange,
  errors,
  required,
}: EnumFieldProps) {
  const description = getDescription(schema);
  const enumValues = getEnumValues(schema);
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
          <TypeBadge type="enum" />
        </div>

        {description && (
          <p className="text-muted-foreground text-sm">{description}</p>
        )}

        {/* Enum options display */}
        {enumValues.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground text-xs">Options:</span>
            {enumValues.map((enumValue) => (
              <code
                className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs"
                key={String(enumValue)}
              >
                {String(enumValue)}
              </code>
            ))}
          </div>
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

      {/* Select field */}
      <Select name={name} onValueChange={onChange} value={value}>
        <SelectTrigger aria-invalid={isInvalid} id={fieldId}>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent position="item-aligned">
          {enumValues.map((enumValue) => (
            <SelectItem key={String(enumValue)} value={String(enumValue)}>
              {String(enumValue)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
