import { afterEach, expect, test, vi } from "vitest";

const PLAINTEXT = "super-secret-token";

test("encrypt produces distinct ciphertext and decrypt restores original value", async () => {
  const module = await import("./encryption");
  const ciphertext = module.encrypt(PLAINTEXT);

  expect(ciphertext).not.toBe(PLAINTEXT);
  expect(module.isCiphertext(ciphertext)).toBe(true);
  expect(module.decrypt(ciphertext)).toBe(PLAINTEXT);
});

test("decrypt rejects tampered ciphertext", async () => {
  const module = await import("./encryption");
  const ciphertext = module.encrypt(PLAINTEXT);

  const segments = ciphertext.split(":");
  const tampered = `${segments[0]}:${segments[1]}:${segments[2]}:${segments[3]
    .split("")
    .reverse()
    .join("")}`;

  expect(() => module.decrypt(tampered)).toThrow(module.DecryptionError);
});

test("encrypt throws when encryption key is invalid", async () => {
  vi.resetModules();
  vi.doMock("@/env", () => ({
    env: {
      ENCRYPTION_KEY: "00",
    },
  }));

  const module = await import("./encryption");

  expect(() => module.encrypt(PLAINTEXT)).toThrow(module.EncryptionKeyError);
});

afterEach(() => {
  vi.resetModules();
  vi.doUnmock("@/env");
});
