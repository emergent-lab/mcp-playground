import { TypeBadge } from "@/components/ui/type-badge";
import type { JSONSchemaProperty } from "@/lib/schema-types";
import {
  formatFieldName,
  getDefaultValue,
  getDescription,
  getEnumValues,
  getFieldType,
  isEnumSchema,
} from "@/lib/schema-utils";
import { cn } from "@/lib/utils";

export type SchemaPropertyRowProps = {
  name: string;
  schema: JSONSchemaProperty;
  required: boolean;
  level?: number;
};

export function SchemaPropertyRow({
  name,
  schema,
  required,
  level = 0,
}: SchemaPropertyRowProps) {
  const fieldType = isEnumSchema(schema) ? "enum" : getFieldType(schema);
  const description = getDescription(schema);
  const defaultValue = getDefaultValue(schema);
  const _displayName = schema.title || formatFieldName(name);
  const enumValues = isEnumSchema(schema) ? getEnumValues(schema) : null;

  // Indentation for nested properties
  const indent = level * 16; // 16px per level

  return (
    <div
      className={cn("space-y-1.5 border-transparent border-l-2 py-2")}
      style={{ paddingLeft: `${indent}px` }}
    >
      <div className="flex items-center gap-2">
        <code className="font-medium font-mono text-foreground text-sm">
          {name}
        </code>
        {required && (
          <span className="text-destructive text-sm" title="required">
            *
          </span>
        )}
        <TypeBadge type={fieldType} />
        {schema.deprecated && (
          <span className="text-muted-foreground text-xs">(deprecated)</span>
        )}
      </div>

      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}

      {enumValues && enumValues.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-muted-foreground text-xs">Options:</span>
          {enumValues.map((value) => (
            <code
              className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs"
              key={String(value)}
            >
              {String(value)}
            </code>
          ))}
        </div>
      )}

      {defaultValue !== undefined && (
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground text-xs">Default:</span>
          <code className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs">
            {typeof defaultValue === "object"
              ? JSON.stringify(defaultValue)
              : String(defaultValue)}
          </code>
        </div>
      )}

      {schema.minimum !== undefined && (
        <div className="text-muted-foreground text-xs">
          Min: {schema.minimum}
        </div>
      )}

      {schema.maximum !== undefined && (
        <div className="text-muted-foreground text-xs">
          Max: {schema.maximum}
        </div>
      )}

      {schema.minLength !== undefined && (
        <div className="text-muted-foreground text-xs">
          Min length: {schema.minLength}
        </div>
      )}

      {schema.maxLength !== undefined && (
        <div className="text-muted-foreground text-xs">
          Max length: {schema.maxLength}
        </div>
      )}

      {schema.pattern && (
        <div className="text-muted-foreground text-xs">
          Pattern: <code className="font-mono">{schema.pattern}</code>
        </div>
      )}
    </div>
  );
}
