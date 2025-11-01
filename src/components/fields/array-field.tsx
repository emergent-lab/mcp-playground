import { PlusIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import type { FieldValue, JSONSchemaProperty } from "@/lib/schema-types";
import {
  formatFieldName,
  getDescription,
  isStringSchema,
} from "@/lib/schema-utils";

export type ArrayFieldProps = {
  name: string;
  schema: JSONSchemaProperty;
  value: FieldValue[];
  onChange: (value: FieldValue[]) => void;
  errors?: Array<{ message?: string }>;
  required?: boolean;
};

export function ArrayField({
  name,
  schema,
  value,
  onChange,
  errors,
  required,
}: ArrayFieldProps) {
  const description = getDescription(schema);
  const displayName = schema.title || formatFieldName(name);
  const isInvalid = Boolean(errors && errors.length > 0);
  const items = value || [];

  // For now, support only string arrays (most common case)
  // TODO: Support complex item schemas in Phase 4
  const isStringArray = schema.items && isStringSchema(schema.items);

  const handleAdd = () => {
    onChange([...items, ""]);
  };

  const handleRemove = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onChange(newItems);
  };

  const handleItemChange = (index: number, newValue: string) => {
    const newItems = [...items];
    newItems[index] = newValue;
    onChange(newItems);
  };

  const canAddMore = !schema.maxItems || items.length < schema.maxItems;
  const canRemove = !schema.minItems || items.length > schema.minItems;

  if (!isStringArray) {
    // Fallback for complex arrays - show JSON textarea
    return (
      <Field data-invalid={isInvalid}>
        <FieldLabel>
          {displayName}
          {required && <span className="ml-1 text-destructive">*</span>}
        </FieldLabel>
        <FieldDescription>
          Complex array type - use JSON format
        </FieldDescription>
        <textarea
          className="min-h-[80px] w-full rounded-sm border border-input bg-background px-3 py-2 font-mono text-sm"
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              onChange(parsed);
            } catch {
              // Invalid JSON - don't update
            }
          }}
          value={JSON.stringify(value, null, 2)}
        />
        {isInvalid && <FieldError errors={errors} />}
      </Field>
    );
  }

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel>
        {displayName}
        {required && <span className="ml-1 text-destructive">*</span>}
      </FieldLabel>
      {description && <FieldDescription>{description}</FieldDescription>}

      <FieldGroup>
        {items.map((item, index) => (
          <Field key={`${String(item)}-${index}`} orientation="horizontal">
            <InputGroup>
              <InputGroupInput
                aria-label={`${displayName} item ${index + 1}`}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={`Item ${index + 1}`}
                value={String(item)}
              />
              {(canRemove || items.length > 1) && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    aria-label={`Remove item ${index + 1}`}
                    onClick={() => handleRemove(index)}
                    size="icon-xs"
                    type="button"
                    variant="ghost"
                  >
                    <XIcon className="h-3 w-3" />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
          </Field>
        ))}
      </FieldGroup>

      <Button
        className="mt-2"
        disabled={!canAddMore}
        onClick={handleAdd}
        size="sm"
        type="button"
        variant="outline"
      >
        <PlusIcon className="mr-2 h-4 w-4" />
        Add Item
      </Button>

      {schema.minItems !== undefined && schema.maxItems !== undefined && (
        <FieldDescription>
          {schema.minItems} to {schema.maxItems} items allowed
        </FieldDescription>
      )}

      {isInvalid && <FieldError errors={errors} />}
    </Field>
  );
}
