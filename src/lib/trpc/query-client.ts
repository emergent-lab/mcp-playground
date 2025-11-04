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
        // Only dehydrate successful queries (default React Query behavior)
        // Failed/pending queries are excluded and will retry on the client
        // This prevents "query dehydrated as pending ended up rejecting" errors
        shouldDehydrateQuery: (query) => defaultShouldDehydrateQuery(query),
      },
    },
  });
}
