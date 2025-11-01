import type { UseInfiniteQueryOptions } from "@tanstack/react-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";

/**
 * Error shape from tRPC UNAUTHORIZED errors
 */
type TRPCAuthError = {
  data?: {
    code?: string;
    cause?: {
      authUrl?: string;
    };
  };
  message?: string;
};

/**
 * Wrapper around useInfiniteQuery that automatically handles OAuth redirects
 * when the server returns UNAUTHORIZED errors with an authUrl.
 *
 * Usage:
 * ```tsx
 * const query = useInfiniteQueryWithAuth(
 *   api.server.listTools.infiniteQueryOptions({ serverId })
 * );
 * ```
 */
export function useInfiniteQueryWithAuth<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends readonly unknown[] = readonly unknown[],
  TPageParam = unknown,
>(
  options: UseInfiniteQueryOptions<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >
) {
  const query = useInfiniteQuery<
    TQueryFnData,
    TError,
    TData,
    TQueryKey,
    TPageParam
  >(options);

  // Auto-redirect on UNAUTHORIZED errors, show toast for other errors
  useEffect(() => {
    if (!query.error) {
      return;
    }

    const error = query.error as unknown as TRPCAuthError;

    // Check if it's an UNAUTHORIZED error
    if (error.data?.code === "UNAUTHORIZED") {
      // Extract authUrl from error cause (serialized by error formatter)
      const authUrl = error.data.cause?.authUrl;

      if (authUrl) {
        window.location.replace(authUrl);
        return;
      }
      // If no authUrl, still return to prevent showing error toast
      return;
    }

    // Check if it's a "Method not found" error (server doesn't support this capability)
    // JSON-RPC error code -32601 means the method is not implemented
    const errorMessage = error.message || "";
    if (
      errorMessage.includes("-32601") ||
      errorMessage.includes("Method not found")
    ) {
      // This is expected behavior - server simply doesn't support this feature
      // Don't show a toast or error UI
      return;
    }

    // Handle other non-auth errors with toast notification
    toast.error(errorMessage || "Failed to load data", {
      action: {
        label: "Retry",
        onClick: () => query.refetch(),
      },
    });
  }, [query.error, query.refetch]);

  return query;
}
