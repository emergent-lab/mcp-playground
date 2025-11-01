import { ArrayField } from "@/components/fields/array-field";
import { BooleanField } from "@/components/fields/boolean-field";
import { EnumField } from "@/components/fields/enum-field";
import { NumberField } from "@/components/fields/number-field";
import { ObjectFieldset } from "@/components/fields/object-fieldset";
import { StringField } from "@/components/fields/string-field";
import type { FieldValue, JSONSchemaProperty } from "@/lib/schema-types";
import {
  getDefaultValue,
  isArraySchema,
  isBooleanSchema,
  isEnumSchema,
  isNumberSchema,
  isObjectSchema,
} from "@/lib/schema-utils";

export type SchemaFieldRendererProps = {
  name: string;
  schema: JSONSchemaProperty;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  onBlur: () => void;
  errors?: Array<{ message?: string }>;
  required?: boolean;
  onLoadCompletions?: (query: string) => Promise<string[]>;
};

/**
 * Recursive field renderer that maps JSON Schema types to appropriate field components
 *
 * Decision tree:
 * 1. If has enum values → EnumField
 * 2. Else if type is string → StringField
 * 3. Else if type is number/integer → NumberField
 * 4. Else if type is boolean → BooleanField
 * 5. Else if type is object → ObjectFieldset (recursive)
 * 6. Else if type is array → ArrayField
 * 7. Else → StringField (fallback)
 */
export function SchemaFieldRenderer({
  name,
  schema,
  value,
  onChange,
  onBlur,
  errors,
  required,
  onLoadCompletions,
}: SchemaFieldRendererProps) {
  const defaultValue = getDefaultValue(schema);
  const currentValue = (value ?? defaultValue) as FieldValue;

  const renderers: Array<{
    predicate: (candidate: JSONSchemaProperty) => boolean;
    render: () => React.ReactElement;
  }> = [
    {
      predicate: isEnumSchema,
      render: () => (
        <EnumField
          errors={errors}
          name={name}
          onChange={onChange}
          required={required}
          schema={schema}
          value={String(currentValue ?? "")}
        />
      ),
    },
    {
      predicate: isBooleanSchema,
      render: () => (
        <BooleanField
          errors={errors}
          name={name}
          onChange={onChange}
          required={required}
          schema={schema}
          value={Boolean(currentValue)}
        />
      ),
    },
    {
      predicate: isNumberSchema,
      render: () => (
        <NumberField
          errors={errors}
          name={name}
          onBlur={onBlur}
          onChange={(val) => onChange(val === undefined ? null : val)}
          required={required}
          schema={schema}
          value={
            currentValue !== undefined && currentValue !== ""
              ? Number(currentValue)
              : undefined
          }
        />
      ),
    },
    {
      predicate: isArraySchema,
      render: () => (
        <ArrayField
          errors={errors}
          name={name}
          onChange={onChange}
          required={required}
          schema={schema}
          value={Array.isArray(currentValue) ? currentValue : []}
        />
      ),
    },
    {
      predicate: isObjectSchema,
      render: () => (
        <ObjectFieldset
          errors={extractObjectErrors(errors)}
          name={name}
          onBlur={onBlur}
          onChange={onChange}
          required={required}
          SchemaFieldRenderer={SchemaFieldRenderer}
          schema={schema}
          value={normalizeObjectValue(currentValue)}
        />
      ),
    },
  ];

  for (const candidate of renderers) {
    if (candidate.predicate(schema)) {
      return candidate.render();
    }
  }

  return (
    <StringField
      errors={errors}
      name={name}
      onChange={onChange}
      onLoadCompletions={onLoadCompletions}
      required={required}
      schema={schema}
      value={String(currentValue ?? "")}
    />
  );
}

function extractObjectErrors(
  errors: SchemaFieldRendererProps["errors"]
): Record<string, Array<{ message?: string }>> | undefined {
  if (!errors || Array.isArray(errors) || typeof errors !== "object") {
    return;
  }

  return errors as Record<string, Array<{ message?: string }>>;
}

function normalizeObjectValue(value: FieldValue): Record<string, FieldValue> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, FieldValue>;
  }

  return {};
}
