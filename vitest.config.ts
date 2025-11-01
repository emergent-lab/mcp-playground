import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const ROOT_DIR = fileURLToPath(new URL(".", import.meta.url));
const SRC_DIR = resolve(ROOT_DIR, "src");

const DEFAULT_TEST_KEY =
  "0123456789abcdeffedcba98765432100123456789abcdeffedcba9876543210";

export default defineConfig({
  resolve: {
    alias: {
      "@": SRC_DIR,
    },
  },
  test: {
    env: {
      DATABASE_URL: "https://example.com/postgres",
      GITHUB_CLIENT_ID: "test-client-id",
      GITHUB_CLIENT_SECRET: "test-client-secret",
      RESEND_API_KEY: "test-resend-api-key",
      NEXT_PUBLIC_BASE_URL: "https://example.com",
      ENCRYPTION_KEY: DEFAULT_TEST_KEY,
    },
    clearMocks: true,
  },
});
