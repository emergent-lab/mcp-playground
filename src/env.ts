import { vercel } from "@t3-oss/env-core/presets-zod";
import { createEnv } from "@t3-oss/env-nextjs";

import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    GITHUB_CLIENT_ID: z.string(),
    GITHUB_CLIENT_SECRET: z.string(),
    RESEND_API_KEY: z.string().min(1),
  },
  client: {},
  experimental__runtimeEnv: {},
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  extends: [vercel()],
});
