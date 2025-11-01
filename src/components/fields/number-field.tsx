import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { TypeBadge } from "@/components/ui/type-badge";
import type { JSONSchemaProperty } from "@/lib/schema-types";
import { getDescription } from "@/lib/schema-utils";

export type NumberFieldProps = {
  name: string;
  schema: JSONSchemaProperty;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur: () => void;
  errors?: Array<{ message?: string }>;
  required?: boolean;
};

export function NumberField({
  name,
  schema,
  value,
  onChange,
  onBlur,
  errors,
  required,
}: NumberFieldProps) {
  const description = getDescription(schema);
  const isInvalid = Boolean(errors && errors.length > 0);
  const fieldId = `field-${name}`;
  const fieldType = schema.type === "integer" ? "integer" : "number";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      onChange(undefined);
    } else {
      const num = Number(val);
      if (!Number.isNaN(num)) {
        onChange(num);
      }
    }
  };

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
          <TypeBadge type={fieldType} />
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
          {schema.minimum !== undefined && <span>Min: {schema.minimum}</span>}
          {schema.maximum !== undefined && <span>Max: {schema.maximum}</span>}
          {schema.multipleOf !== undefined && (
            <span>Multiple of: {schema.multipleOf}</span>
          )}
        </div>
      </div>

      {/* Input field */}
      <Input
        aria-invalid={isInvalid}
        autoComplete="off"
        id={fieldId}
        max={schema.maximum}
        min={schema.minimum}
        name={name}
        onBlur={onBlur}
        onChange={handleChange}
        placeholder={schema.default ? String(schema.default) : undefined}
        step={schema.multipleOf || (schema.type === "integer" ? 1 : "any")}
        type="number"
        value={value !== undefined ? value : ""}
      />
      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
