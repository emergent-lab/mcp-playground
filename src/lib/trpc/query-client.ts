import {
  defaultShouldDehydrateQuery,
  QueryClient,
} from "@tanstack/react-query";

// Default stale time: 30 seconds
const DEFAULT_STALE_TIME_SECONDS = 30;
const SECONDS_TO_MS = 1000;

/**
 * Create a new QueryClient instance
 *
 * This factory is used to create a stable QueryClient per request on the server,
 * and a singleton QueryClient in the browser.
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we want to set some default staleTime to avoid refetching immediately on the client
        staleTime: DEFAULT_STALE_TIME_SECONDS * SECONDS_TO_MS,
        // Disable automatic refetching on window focus for better UX
        refetchOnWindowFocus: false,
        // Retry failed queries once
        retry: 1,
      },
      dehydrate: {
        // Include queries that are still pending when dehydrating
        // This allows us to prefetch in server components and consume in client components
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) ||
          query.state.status === "pending",
      },
    },
  });
}
