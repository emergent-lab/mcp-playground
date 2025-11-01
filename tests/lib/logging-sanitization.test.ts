import { afterEach, describe, expect, it } from "vitest";
import {
  hashIpAddress,
  maskValue,
  sanitizeBody,
  sanitizeHeaders,
} from "@/lib/logging-sanitization";

const ORIGINAL_SALT = process.env.IP_HASH_SALT;

afterEach(() => {
  if (ORIGINAL_SALT === undefined) {
    process.env.IP_HASH_SALT = undefined;
  } else {
    process.env.IP_HASH_SALT = ORIGINAL_SALT;
  }
});

describe("sanitizeHeaders", () => {
  it("redacts sensitive headers", () => {
    const headers = {
      Authorization: "Bearer secret-token",
      "Content-Type": "application/json",
      "mcp-session-id": "session-1234",
    };

    const result = sanitizeHeaders(headers);

    expect(result.Authorization).toBe("[REDACTED]");
    expect(result["Content-Type"]).toBe("application/json");
    expect(result["mcp-session-id"]).toBe("[REDACTED]");
  });
});

describe("sanitizeBody", () => {
  it("redacts nested sensitive fields", () => {
    const body = {
      token: "super-secret-token",
      data: {
        nestedSecret: "another-secret",
        list: [
          {
            refreshToken: "refresh-12345678",
          },
        ],
      },
      plain: "safe",
    };

    const result = sanitizeBody(body);

    expect(result.token).toBe(maskValue("super-secret-token"));
    expect((result.data as Record<string, unknown>).nestedSecret).toBe(
      maskValue("another-secret")
    );

    const list = (result.data as Record<string, unknown>).list as unknown[];
    expect(list).toHaveLength(1);
    const first = list[0] as Record<string, unknown>;
    expect(first.refreshToken).toBe(maskValue("refresh-12345678"));
    expect(result.plain).toBe("safe");
  });

  it("returns non-object bodies unchanged", () => {
    expect(sanitizeBody("plain-text")).toBe("plain-text");
    expect(sanitizeBody(null)).toBeNull();
  });
});

describe("maskValue", () => {
  it("masks long strings but preserves start and end", () => {
    const masked = maskValue("abcdefghijklmnop");
    expect(masked).toBe("abcd...mnop");
  });

  it("fully redacts short strings", () => {
    const masked = maskValue("short");
    expect(masked).toBe("[REDACTED]");
  });
});

describe("hashIpAddress", () => {
  it("returns deterministic hash", () => {
    process.env.IP_HASH_SALT = "unit-test-salt";
    const first = hashIpAddress("127.0.0.1");
    const second = hashIpAddress("127.0.0.1");
    expect(first).toBeDefined();
    expect(first).toEqual(second);
    expect(first?.startsWith("ip_")).toBe(true);
  });

  it("returns undefined for missing input", () => {
    expect(hashIpAddress(undefined)).toBeUndefined();
    expect(hashIpAddress("")).toBeUndefined();
  });
});
