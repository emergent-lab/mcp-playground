/**
 * TypeScript types for JSON Schema
 *
 * These types represent the JSON Schema structure used by MCP tools
 * for defining parameter inputs and outputs.
 */

export type JSONSchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "null";

/**
 * JSON Schema property definition
 *
 * Represents a single property in a JSON Schema object.
 * Supports all common JSON Schema keywords for validation.
 */
export type JSONSchemaProperty = {
  /** The type of the property */
  type?: JSONSchemaType | JSONSchemaType[];

  /** Human-readable description of the property */
  description?: string;

  /** Default value for the property */
  default?: unknown;

  /** Allowed values (for enum types) */
  enum?: unknown[];

  // Number/Integer constraints
  /** Minimum value (inclusive) */
  minimum?: number;

  /** Maximum value (inclusive) */
  maximum?: number;

  /** Exclusive minimum value */
  exclusiveMinimum?: number;

  /** Exclusive maximum value */
  exclusiveMaximum?: number;

  /** Number must be multiple of this value */
  multipleOf?: number;

  // String constraints
  /** Minimum string length */
  minLength?: number;

  /** Maximum string length */
  maxLength?: number;

  /** Pattern (regex) the string must match */
  pattern?: string;

  /** String format (e.g., "email", "uri", "date-time") */
  format?: string;

  // Array constraints
  /** Schema for array items */
  items?: JSONSchemaProperty;

  /** Minimum number of items in array */
  minItems?: number;

  /** Maximum number of items in array */
  maxItems?: number;

  /** Whether array items must be unique */
  uniqueItems?: boolean;

  // Object constraints
  /** Object property definitions */
  properties?: Record<string, JSONSchemaProperty>;

  /** Required property names */
  required?: string[];

  /** Additional properties allowed */
  additionalProperties?: boolean | JSONSchemaProperty;

  /** Minimum number of properties */
  minProperties?: number;

  /** Maximum number of properties */
  maxProperties?: number;

  // Composition
  /** Schema must match all of these */
  allOf?: JSONSchemaProperty[];

  /** Schema must match at least one of these */
  anyOf?: JSONSchemaProperty[];

  /** Schema must match exactly one of these */
  oneOf?: JSONSchemaProperty[];

  /** Schema must not match this */
  not?: JSONSchemaProperty;

  // Metadata
  /** Title of the property */
  title?: string;

  /** Examples of valid values */
  examples?: unknown[];

  /** Whether the property is deprecated */
  deprecated?: boolean;

  /** Whether the property is read-only */
  readOnly?: boolean;

  /** Whether the property is write-only */
  writeOnly?: boolean;
};

/**
 * Tool input schema
 *
 * Represents the complete input parameter schema for a tool.
 * Must be an object type with optional properties and required fields.
 */
export type ToolInputSchema = {
  /** Must be "object" for tool inputs */
  type: "object";

  /** Property definitions for the tool parameters */
  properties?: Record<string, JSONSchemaProperty>;

  /** Required parameter names */
  required?: string[];

  /** Additional properties allowed */
  additionalProperties?: boolean | JSONSchemaProperty;

  /** Description of the input schema */
  description?: string;

  /** Title of the input schema */
  title?: string;
};

/**
 * Tool output schema
 *
 * Represents the output schema for a tool result.
 * Similar to input schema but describes the tool's return value.
 */
export type ToolOutputSchema = ToolInputSchema;

/**
 * Field value type
 *
 * Represents the possible values for form fields based on schema type.
 */
export type FieldValue =
  | string
  | number
  | boolean
  | null
  | FieldValue[]
  | { [key: string]: FieldValue };

/**
 * Form values
 *
 * Represents the complete form state for tool parameters.
 */
export type FormValues = Record<string, FieldValue>;
