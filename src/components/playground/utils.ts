/**
 * Check if an error is a "Method not found" error
 * JSON-RPC error code -32601 indicates the server doesn't support this capability
 */
export function isMethodNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const errorMessage = "message" in error ? String(error.message) : "";

  return (
    errorMessage.includes("-32601") || errorMessage.includes("Method not found")
  );
}

/**
 * Check if an error is an auth error (UNAUTHORIZED)
 * These errors trigger automatic OAuth redirects and shouldn't show error UI
 */
export function isAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  return (
    "data" in error &&
    typeof error.data === "object" &&
    error.data !== null &&
    "code" in error.data &&
    error.data.code === "UNAUTHORIZED"
  );
}

/**
 * Extract error message from unknown error type
 *
 * @param error - Unknown error object
 * @param fallback - Fallback message if error has no message property
 * @returns Error message string
 */
export function getErrorMessage(
  error: unknown,
  fallback = "An error occurred"
): string {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }
  return fallback;
}
