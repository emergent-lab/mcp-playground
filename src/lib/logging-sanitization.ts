import { createHash } from "node:crypto";

const SENSITIVE_HEADER_KEYS = new Set([
  "authorization",
  "proxy-authorization",
  "cookie",
  "x-api-key",
  "x-auth-token",
  "x-csrf-token",
  "x-forwarded-authorization",
  "mcp-session-id",
]);

const SENSITIVE_BODY_KEY_FRAGMENTS = [
  "password",
  "secret",
  "token",
  "credential",
  "key",
] as const;

const DEFAULT_MASK = "[REDACTED]";
const VISIBLE_CHARS = 4;

const lowerCaseKeys = (record: Record<string, string>) => {
  const lowered: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    lowered[key.toLowerCase()] = value;
  }
  return lowered;
};

export const maskValue = (value: string): string => {
  if (value.length <= VISIBLE_CHARS * 2) {
    return DEFAULT_MASK;
  }
  const start = value.slice(0, VISIBLE_CHARS);
  const end = value.slice(-VISIBLE_CHARS);
  return `${start}...${end}`;
};

export const sanitizeHeaders = (
  headers: Record<string, string>
): Record<string, string> => {
  const sanitized: Record<string, string> = {};
  const normalized = lowerCaseKeys(headers);
  for (const [key, originalValue] of Object.entries(headers)) {
    const lookupKey = key.toLowerCase();
    if (SENSITIVE_HEADER_KEYS.has(lookupKey)) {
      sanitized[key] = DEFAULT_MASK;
      continue;
    }
    sanitized[key] = normalized[lookupKey] ?? originalValue;
  }
  return sanitized;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const fieldLooksSensitive = (field: string) => {
  const lc = field.toLowerCase();
  for (const fragment of SENSITIVE_BODY_KEY_FRAGMENTS) {
    if (lc.includes(fragment)) {
      return true;
    }
  }
  return false;
};

const redactValue = (value: unknown): unknown => {
  if (typeof value === "string") {
    return maskValue(value);
  }
  if (Array.isArray(value)) {
    const masked: unknown[] = [];
    for (const item of value) {
      masked.push(redactValue(item));
    }
    return masked;
  }
  if (isPlainObject(value)) {
    return sanitizeBody(value);
  }
  return DEFAULT_MASK;
};

const sanitizeValue = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value;
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    const sanitizedItems: unknown[] = [];
    for (const item of value) {
      sanitizedItems.push(sanitizeBody(item));
    }
    return sanitizedItems;
  }
  if (isPlainObject(value)) {
    return sanitizeBody(value);
  }
  return value;
};

const sanitizeFieldValue = (key: string, value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value;
  }
  if (fieldLooksSensitive(key)) {
    return redactValue(value);
  }
  return sanitizeValue(value);
};

export const sanitizeBody = <T>(body: T): T => {
  if (Array.isArray(body)) {
    const sanitizedItems: unknown[] = [];
    for (const item of body) {
      sanitizedItems.push(sanitizeBody(item));
    }
    return sanitizedItems as T;
  }

  if (!isPlainObject(body)) {
    return body;
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(body)) {
    sanitized[key] = sanitizeFieldValue(key, value);
  }
  return sanitized as T;
};

const DEFAULT_IP_SALT = "mcp-playground-ip-salt-2024";

export const hashIpAddress = (ip: string | undefined): string | undefined => {
  if (!ip) {
    return;
  }
  const normalized = ip.trim();
  if (!normalized) {
    return;
  }
  const salt = process.env.IP_HASH_SALT ?? DEFAULT_IP_SALT;
  const hashed = createHash("sha256")
    .update(`${normalized}:${salt}`)
    .digest("hex");
  return `ip_${hashed.slice(0, 32)}`;
};
