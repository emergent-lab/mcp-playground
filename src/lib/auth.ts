import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous, magicLink } from "better-auth/plugins";
import MagicLinkEmail from "@/../emails/magic-link";
import { db } from "@/db";
import { env } from "@/env";
import { getResend } from "@/lib/email/resend";

const MAX_AGE = 5 * 60; // 5 minutes

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  session: {
    cookieCache: {
      enabled: true,
      maxAge: MAX_AGE,
    },
  },
  socialProviders: {
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
  },
  plugins: [
    anonymous(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const resend = getResend();
        await resend.emails.send({
          from: "Magic Link <hello@auth.mcpplayground.io>",
          to: email,
          subject: "Sign in to MCP Playground",
          react: MagicLinkEmail({ url }),
        });
      },
      expiresIn: 300, // 5 minutes
      disableSignUp: false, // Allow automatic signup
    }),
  ],
});
