import { initTRPC, TRPCError } from "@trpc/server";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { db } from "@/db";
import { auth } from "@/lib/auth";

/**
 * Create tRPC context from Next.js request
 *
 * Extracts:
 * - User session from Better Auth
 * - Database instance
 */
export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({
    headers: opts.req.headers,
  });

  return {
    db,
    session,
    userId: session?.user?.id,
    headers: opts.req.headers,
  };
}

type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * Initialize tRPC with context and error formatter
 *
 * The error formatter serializes the cause field to the client
 * so we can pass OAuth URLs in UNAUTHORIZED errors
 */
const t = initTRPC.context<Context>().create({
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        // Serialize cause to client if it contains authUrl
        cause:
          error.cause &&
          typeof error.cause === "object" &&
          "authUrl" in error.cause
            ? error.cause
            : undefined,
      },
    };
  },
});

/**
 * Public procedure - no authentication required
 */
export const publicProcedure = t.procedure;

/**
 * Protected procedure - requires authentication
 *
 * Throws UNAUTHORIZED error if user is not logged in
 */
export const protectedProcedure = t.procedure.use((opts) => {
  if (!opts.ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  return opts.next({
    ctx: {
      ...opts.ctx,
      // Narrow the type - we know userId is defined here
      userId: opts.ctx.userId,
    },
  });
});

/**
 * Create router
 */
export const router = t.router;

/**
 * Create caller - for server-side calls
 */
export const createCallerFactory = t.createCallerFactory;
