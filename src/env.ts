import { vercel } from "@t3-oss/env-core/presets-zod";
import { createEnv } from "@t3-oss/env-nextjs";

import { z } from "zod";

const HEX_64_REGEX = /^[0-9a-f]{64}$/i;

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    RESEND_API_KEY: z.string().min(1),
    ENCRYPTION_KEY: z
      .string()
      .regex(
        HEX_64_REGEX,
        "ENCRYPTION_KEY must be a 64-character hexadecimal string"
      ),
  },
  client: {
    NEXT_PUBLIC_BASE_URL: z.url(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  extends: [vercel()],
});
