import "server-only";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { headers } from "next/headers";
import { cache } from "react";
import { db } from "@/db";
import { auth } from "@/lib/auth";
import { appRouter } from "@/server/api/root";
import { makeQueryClient } from "./query-client";

/**
 * IMPORTANT: Create a stable getter for the query client that
 * will return the same client during the same request.
 *
 * Using React's cache() ensures we have one QueryClient per request.
 */
export const getQueryClient = cache(makeQueryClient);

/**
 * Create tRPC context for server-side calls
 *
 * This is cached per request to ensure consistency.
 */
const createContext = cache(async () => {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  return {
    db,
    session,
    userId: session?.user?.id,
    headers: requestHeaders,
  };
});

/**
 * tRPC proxy for prefetching queries in Server Components
 *
 * Usage:
 * ```tsx
 * const queryClient = getQueryClient();
 * await queryClient.prefetchQuery(trpc.server.list.queryOptions());
 * ```
 */
export const trpc = createTRPCOptionsProxy({
  ctx: createContext,
  router: appRouter,
  queryClient: getQueryClient,
});

/**
 * Server caller for direct tRPC calls in Server Components
 *
 * This is detached from the query client and does not store data in cache.
 * Use this when you need the data in a Server Component but don't need
 * to hydrate it to the client.
 *
 * Usage:
 * ```tsx
 * const servers = await caller.server.list();
 * ```
 */
export const caller = cache(async () => {
  const ctx = await createContext();
  return appRouter.createCaller(ctx);
});

/**
 * HydrateClient wrapper component
 *
 * Wraps children with HydrationBoundary to pass server-prefetched data to client.
 *
 * Usage:
 * ```tsx
 * <HydrateClient>
 *   <ClientComponent />
 * </HydrateClient>
 * ```
 */
export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}
