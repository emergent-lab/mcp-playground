"use client";

import { useEffect } from "react";
import { toast } from "sonner";

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: "OAuth failed: Missing authorization code",
  unauthorized: "Please sign in to continue",
  server_not_found: "Server not found",
  invalid_state: "OAuth failed: Invalid state parameter (possible CSRF attack)",
  token_exchange_failed: "Failed to exchange authorization code for tokens",
  invalid_verifier: "OAuth failed: Code verifier mismatch or expired",
  connection_failed: "Failed to connect to server",
};

export function PlaygroundNotifications() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get("success") === "connected") {
      toast.success("Successfully connected to server!");
    }

    const errorCode = params.get("error");
    if (errorCode) {
      toast.error(ERROR_MESSAGES[errorCode] || "An error occurred");
    }

    // Clean up URL after showing notifications
    if (params.get("success") || params.get("error")) {
      window.history.replaceState({}, "", "/");
    }
  }, []);

  return null;
}
