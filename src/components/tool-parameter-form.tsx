"use client";

import { SchemaFieldRenderer } from "@/components/schema-field-renderer";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { FieldGroup, FieldLegend, FieldSet } from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "@/components/ui/spinner";
import type {
  FieldValue,
  FormValues,
  ToolInputSchema,
} from "@/lib/schema-types";
import { getObjectProperties, getRequiredFields } from "@/lib/schema-utils";

export type ToolParameterFormProps = {
  inputSchema: ToolInputSchema;
  onSubmit: (values: FormValues) => void;
  isSubmitting?: boolean;
  formValues: FormValues;
  onFormValuesChange: (values: FormValues) => void;
  onReset: () => void;
};

/**
 * Visual parameter form builder for MCP tools
 *
 * Dynamically generates form fields from a JSON Schema input schema.
 * Separates required and optional parameters for better UX.
 * Now uses controlled state from parent for parameter persistence.
 */
export function ToolParameterForm({
  inputSchema,
  onSubmit,
  isSubmitting = false,
  formValues,
  onFormValuesChange,
  onReset,
}: ToolParameterFormProps) {
  const properties = getObjectProperties(inputSchema);
  const requiredFields = getRequiredFields(inputSchema);

  // Separate required and optional properties
  const requiredProperties = Object.entries(properties).filter(([name]) =>
    requiredFields.includes(name)
  );
  const optionalProperties = Object.entries(properties).filter(
    ([name]) => !requiredFields.includes(name)
  );

  const handleFieldChange = (name: string, value: FieldValue) => {
    onFormValuesChange({
      ...formValues,
      [name]: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formValues);
  };

  const hasParameters = Object.keys(properties).length > 0;

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      {/* No Parameters Message */}
      {!hasParameters && (
        <div className="rounded-sm border border-dashed p-8 text-center text-muted-foreground text-sm">
          This tool does not require any parameters
        </div>
      )}

      {/* Required Parameters Section */}
      {requiredProperties.length > 0 && (
        <FieldSet>
          <FieldLegend>Required Parameters</FieldLegend>
          <FieldGroup>
            {requiredProperties.map(([name, schema]) => (
              <SchemaFieldRenderer
                key={name}
                name={name}
                onBlur={() => {
                  // No-op for now
                }}
                onChange={(value) => handleFieldChange(name, value)}
                required
                schema={schema}
                value={formValues[name]}
              />
            ))}
          </FieldGroup>
        </FieldSet>
      )}

      {/* Optional Parameters Section */}
      {optionalProperties.length > 0 && (
        <>
          {requiredProperties.length > 0 && <Separator />}
          <FieldSet>
            <FieldLegend>Optional Parameters</FieldLegend>
            <FieldGroup>
              {optionalProperties.map(([name, schema]) => (
                <SchemaFieldRenderer
                  key={name}
                  name={name}
                  onBlur={() => {
                    // No-op for now
                  }}
                  onChange={(value) => handleFieldChange(name, value)}
                  required={false}
                  schema={schema}
                  value={formValues[name]}
                />
              ))}
            </FieldGroup>
          </FieldSet>
        </>
      )}

      {/* Action Buttons */}
      <ButtonGroup>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting && <Spinner className="size-4" />}
          Execute
        </Button>
        <Button onClick={onReset} type="button" variant="outline">
          Reset
        </Button>
      </ButtonGroup>
    </form>
  );
}
