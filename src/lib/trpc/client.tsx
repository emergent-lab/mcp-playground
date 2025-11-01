"use client";

import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState } from "react";
import type { AppRouter } from "@/server/api/root";
import { makeQueryClient } from "./query-client";

/**
 * Create type-safe tRPC hooks for Client Components
 */
export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();

let browserQueryClient: QueryClient;

/**
 * Get a stable QueryClient instance
 *
 * Server: Always make a new query client
 * Browser: Make a new query client if we don't already have one
 */
function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  }

  // Browser: make a new query client if we don't already have one
  // This is very important, so we don't re-make a new client if React
  // suspends during the initial render
  if (!browserQueryClient) {
    browserQueryClient = makeQueryClient();
  }

  return browserQueryClient;
}

const DEFAULT_PORT = 3000;

/**
 * Get the base URL for tRPC requests
 */
function getUrl() {
  const base = (() => {
    if (typeof window !== "undefined") {
      // Browser should use relative path
      return "";
    }

    // SSR should use absolute URL
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }

    // Dev server
    const port = process.env.PORT ?? DEFAULT_PORT;
    return `http://localhost:${port}`;
  })();

  return `${base}/api/trpc`;
}

/**
 * tRPC React Provider component
 *
 * Wraps the app with TanStack Query and tRPC client.
 * Should be mounted in the root layout.
 */
export function TRPCReactProvider(
  props: Readonly<{
    children: React.ReactNode;
  }>
) {
  // NOTE: Avoid useState when initializing the query client if you don't
  //       have a suspense boundary between this and the code that may
  //       suspend because React will throw away the client on the initial
  //       render if it suspends and there is no boundary
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: getUrl(),
          // Include credentials for auth cookies
          fetch(url, options) {
            return fetch(url, {
              ...options,
              credentials: "include",
            });
          },
        }),
      ],
    })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCProvider queryClient={queryClient} trpcClient={trpcClient}>
        {props.children}
      </TRPCProvider>
    </QueryClientProvider>
  );
}
