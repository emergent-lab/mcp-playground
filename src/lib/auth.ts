import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { anonymous, magicLink } from "better-auth/plugins";
import { eq } from "drizzle-orm";
import MagicLinkEmail from "@/../emails/magic-link";
import { db } from "@/db";
import { log, server } from "@/db/schema/app";
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
    anonymous({
      onLinkAccount: async ({ anonymousUser, newUser }) => {
        // Migrate all MCP servers from anonymous user to authenticated user
        await db
          .update(server)
          .set({ userId: newUser.user.id })
          .where(eq(server.userId, anonymousUser.user.id));

        // Migrate all request logs from anonymous user to authenticated user
        await db
          .update(log)
          .set({ userId: newUser.user.id })
          .where(eq(log.userId, anonymousUser.user.id));
      },
    }),
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
