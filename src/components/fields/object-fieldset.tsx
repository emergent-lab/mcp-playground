import {
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import type { FieldValue, JSONSchemaProperty } from "@/lib/schema-types";
import {
  formatFieldName,
  getDescription,
  getObjectProperties,
  getObjectRequiredFields,
} from "@/lib/schema-utils";

// Import will be added after schema-field-renderer is created
// For now, use a placeholder type
type SchemaFieldRendererProps = {
  name: string;
  schema: JSONSchemaProperty;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  onBlur: () => void;
  errors?: Array<{ message?: string }>;
  required?: boolean;
};

export type ObjectFieldsetProps = {
  name: string;
  schema: JSONSchemaProperty;
  value: Record<string, FieldValue>;
  onChange: (value: Record<string, FieldValue>) => void;
  onBlur: () => void;
  errors?: Record<string, Array<{ message?: string }>>;
  required?: boolean;
  SchemaFieldRenderer?: React.ComponentType<SchemaFieldRendererProps>;
};

export function ObjectFieldset({
  name,
  schema,
  value,
  onChange,
  onBlur,
  errors,
  required,
  SchemaFieldRenderer,
}: ObjectFieldsetProps) {
  const description = getDescription(schema);
  const displayName = schema.title || formatFieldName(name);
  const properties = getObjectProperties(schema);
  const requiredFields = getObjectRequiredFields(schema);
  const isInvalid = Boolean(errors && Object.keys(errors).length > 0);

  const handlePropertyChange = (
    propertyName: string,
    propertyValue: FieldValue
  ) => {
    onChange({
      ...value,
      [propertyName]: propertyValue,
    });
  };

  // If no SchemaFieldRenderer provided, show error message
  if (!SchemaFieldRenderer) {
    return (
      <FieldSet>
        <FieldLegend variant="label">
          {displayName}
          {required && <span className="ml-1 text-destructive">*</span>}
        </FieldLegend>
        {description && <FieldDescription>{description}</FieldDescription>}
        <FieldError>
          SchemaFieldRenderer not provided for nested object
        </FieldError>
      </FieldSet>
    );
  }

  return (
    <FieldSet>
      <FieldLegend variant="label">
        {displayName}
        {required && <span className="ml-1 text-destructive">*</span>}
      </FieldLegend>
      {description && <FieldDescription>{description}</FieldDescription>}

      <FieldGroup>
        {Object.entries(properties).map(([propertyName, propertySchema]) => {
          const isPropertyRequired = requiredFields.includes(propertyName);
          const propertyValue = value[propertyName];
          const propertyErrors = errors?.[propertyName];

          return (
            <SchemaFieldRenderer
              errors={propertyErrors}
              key={propertyName}
              name={propertyName}
              onBlur={onBlur}
              onChange={(val) => handlePropertyChange(propertyName, val)}
              required={isPropertyRequired}
              schema={propertySchema}
              value={propertyValue}
            />
          );
        })}
      </FieldGroup>

      {isInvalid && Object.keys(errors || {}).length > 0 && (
        <FieldError>Please fix errors in the fields above</FieldError>
      )}
    </FieldSet>
  );
}
