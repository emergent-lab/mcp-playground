import { logsRouter } from "./routers/logs";
import { serverRouter } from "./routers/server";
import { router } from "./trpc";

/**
 * Root tRPC router
 *
 * Combines all sub-routers into a single API
 */
export const appRouter = router({
  server: serverRouter,
  logs: logsRouter,
});

/**
 * Type definition for the app router
 * Used by tRPC client for type-safe calls
 */
export type AppRouter = typeof appRouter;
