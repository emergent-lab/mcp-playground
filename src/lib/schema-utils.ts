/**
 * JSON Schema utility functions
 *
 * Utilities for introspecting and working with JSON Schema definitions
 * from MCP tool parameter schemas.
 */

import type {
  JSONSchemaProperty,
  JSONSchemaType,
  ToolInputSchema,
} from "./schema-types";

// Regex patterns used in formatting
const FIRST_CHAR_PATTERN = /^./;

/**
 * Type guard: Check if schema is a string type
 */
export function isStringSchema(schema: JSONSchemaProperty): boolean {
  if (!schema.type) {
    return false;
  }

  if (Array.isArray(schema.type)) {
    return schema.type.includes("string");
  }

  return schema.type === "string";
}

/**
 * Type guard: Check if schema is a number type (number or integer)
 */
export function isNumberSchema(schema: JSONSchemaProperty): boolean {
  if (!schema.type) {
    return false;
  }

  if (Array.isArray(schema.type)) {
    return schema.type.includes("number") || schema.type.includes("integer");
  }

  return schema.type === "number" || schema.type === "integer";
}

/**
 * Type guard: Check if schema is a boolean type
 */
export function isBooleanSchema(schema: JSONSchemaProperty): boolean {
  if (!schema.type) {
    return false;
  }

  if (Array.isArray(schema.type)) {
    return schema.type.includes("boolean");
  }

  return schema.type === "boolean";
}

/**
 * Type guard: Check if schema is an enum (has enum values defined)
 */
export function isEnumSchema(schema: JSONSchemaProperty): boolean {
  return Boolean(
    schema.enum && Array.isArray(schema.enum) && schema.enum.length > 0
  );
}

/**
 * Type guard: Check if schema is an object type
 */
export function isObjectSchema(schema: JSONSchemaProperty): boolean {
  if (!schema.type) {
    return false;
  }

  if (Array.isArray(schema.type)) {
    return schema.type.includes("object");
  }

  return schema.type === "object";
}

/**
 * Type guard: Check if schema is an array type
 */
export function isArraySchema(schema: JSONSchemaProperty): boolean {
  if (!schema.type) {
    return false;
  }

  if (Array.isArray(schema.type)) {
    return schema.type.includes("array");
  }

  return schema.type === "array";
}

/**
 * Get required field names from a schema
 *
 * @param schema - The tool input schema
 * @returns Array of required field names
 */
export function getRequiredFields(schema: ToolInputSchema): string[] {
  return schema.required || [];
}

/**
 * Check if a specific field is required
 *
 * @param fieldName - The field name to check
 * @param parentSchema - The parent schema containing the field
 * @returns True if the field is required
 */
export function isFieldRequired(
  fieldName: string,
  parentSchema: ToolInputSchema
): boolean {
  const requiredFields = getRequiredFields(parentSchema);
  return requiredFields.includes(fieldName);
}

/**
 * Get the default value for a schema property
 *
 * @param schema - The schema property
 * @returns The default value, or undefined if not specified
 */
export function getDefaultValue(schema: JSONSchemaProperty): unknown {
  if (schema.default !== undefined) {
    return schema.default;
  }

  // Provide sensible defaults based on type
  if (isBooleanSchema(schema)) {
    return false;
  }

  if (isArraySchema(schema)) {
    return [];
  }

  if (isObjectSchema(schema)) {
    return {};
  }

  return;
}

/**
 * Get the primary type of a schema property
 *
 * Handles union types by returning the first non-null type.
 *
 * @param schema - The schema property
 * @returns The primary type
 */
export function getFieldType(schema: JSONSchemaProperty): JSONSchemaType {
  if (!schema.type) {
    return "string"; // Default fallback
  }

  if (Array.isArray(schema.type)) {
    // Filter out "null" and return first type
    const nonNullTypes = schema.type.filter((t) => t !== "null");
    return nonNullTypes[0] || "string";
  }

  return schema.type;
}

/**
 * Get enum values from a schema
 *
 * @param schema - The schema property
 * @returns Array of enum values, or empty array if not an enum
 */
export function getEnumValues(schema: JSONSchemaProperty): unknown[] {
  return schema.enum || [];
}

/**
 * Get the description for a schema property
 *
 * @param schema - The schema property
 * @returns The description, or undefined if not specified
 */
export function getDescription(schema: JSONSchemaProperty): string | undefined {
  return schema.description;
}

/**
 * Get the title for a schema property
 *
 * @param schema - The schema property
 * @returns The title, or undefined if not specified
 */
export function getTitle(schema: JSONSchemaProperty): string | undefined {
  return schema.title;
}

/**
 * Check if a schema property is deprecated
 *
 * @param schema - The schema property
 * @returns True if the property is marked as deprecated
 */
export function isDeprecated(schema: JSONSchemaProperty): boolean {
  return Boolean(schema.deprecated);
}

/**
 * Check if a schema property is read-only
 *
 * @param schema - The schema property
 * @returns True if the property is marked as read-only
 */
export function isReadOnly(schema: JSONSchemaProperty): boolean {
  return Boolean(schema.readOnly);
}

/**
 * Get validation constraints for a string schema
 *
 * @param schema - The schema property
 * @returns Object with string validation constraints
 */
export function getStringConstraints(schema: JSONSchemaProperty) {
  return {
    minLength: schema.minLength,
    maxLength: schema.maxLength,
    pattern: schema.pattern,
    format: schema.format,
  };
}

/**
 * Get validation constraints for a number schema
 *
 * @param schema - The schema property
 * @returns Object with number validation constraints
 */
export function getNumberConstraints(schema: JSONSchemaProperty) {
  return {
    minimum: schema.minimum,
    maximum: schema.maximum,
    exclusiveMinimum: schema.exclusiveMinimum,
    exclusiveMaximum: schema.exclusiveMaximum,
    multipleOf: schema.multipleOf,
  };
}

/**
 * Get validation constraints for an array schema
 *
 * @param schema - The schema property
 * @returns Object with array validation constraints
 */
export function getArrayConstraints(schema: JSONSchemaProperty) {
  return {
    minItems: schema.minItems,
    maxItems: schema.maxItems,
    uniqueItems: schema.uniqueItems,
    items: schema.items,
  };
}

/**
 * Get object property schemas
 *
 * @param schema - The schema property
 * @returns Object property definitions, or empty object if not an object schema
 */
export function getObjectProperties(
  schema: JSONSchemaProperty
): Record<string, JSONSchemaProperty> {
  return schema.properties || {};
}

/**
 * Get required properties for an object schema
 *
 * @param schema - The schema property
 * @returns Array of required property names
 */
export function getObjectRequiredFields(schema: JSONSchemaProperty): string[] {
  return schema.required || [];
}

/**
 * Format a field name for display
 *
 * Converts camelCase or snake_case to Title Case
 *
 * @param fieldName - The field name
 * @returns Formatted display name
 */
export function formatFieldName(fieldName: string): string {
  // Handle snake_case
  if (fieldName.includes("_")) {
    return fieldName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  // Handle camelCase
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(FIRST_CHAR_PATTERN, (str) => str.toUpperCase())
    .trim();
}

/**
 * Generate a unique field ID
 *
 * Creates a unique ID for form fields based on the field path.
 *
 * @param baseName - The base name or path
 * @param index - Optional index for array items
 * @returns Unique field ID
 */
export function generateFieldId(baseName: string, index?: number): string {
  const sanitized = baseName.replace(/[^a-zA-Z0-9-_]/g, "-");
  return index !== undefined ? `${sanitized}-${index}` : sanitized;
}

/**
 * Validate a value against a schema property
 *
 * Basic client-side validation (not comprehensive).
 * Full validation should use Zod or another validator.
 *
 * @param value - The value to validate
 * @param schema - The schema property
 * @returns True if the value passes basic validation
 */
export function validateSchemaValue(
  value: unknown,
  schema: JSONSchemaProperty
): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (!matchesSchemaType(value, schema)) {
    return false;
  }

  if (typeof value === "string" && !isValidString(value, schema)) {
    return false;
  }

  if (typeof value === "number" && !isValidNumber(value, schema)) {
    return false;
  }

  if (isEnumSchema(schema)) {
    return isEnumMatch(value, schema);
  }

  return true;
}

function matchesSchemaType(
  value: unknown,
  schema: JSONSchemaProperty
): boolean {
  if (isStringSchema(schema)) {
    return typeof value === "string";
  }

  if (isNumberSchema(schema)) {
    return typeof value === "number" && Number.isFinite(value);
  }

  if (isBooleanSchema(schema)) {
    return typeof value === "boolean";
  }

  if (isArraySchema(schema)) {
    return Array.isArray(value);
  }

  if (isObjectSchema(schema)) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  return true;
}

function isValidString(value: string, schema: JSONSchemaProperty): boolean {
  if (schema.minLength !== undefined && value.length < schema.minLength) {
    return false;
  }

  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    return false;
  }

  if (schema.pattern) {
    return new RegExp(schema.pattern).test(value);
  }

  return true;
}

function isValidNumber(value: number, schema: JSONSchemaProperty): boolean {
  if (schema.minimum !== undefined && value < schema.minimum) {
    return false;
  }

  if (schema.maximum !== undefined && value > schema.maximum) {
    return false;
  }

  return true;
}

function isEnumMatch(value: unknown, schema: JSONSchemaProperty): boolean {
  return schema.enum?.includes(value) ?? false;
}
