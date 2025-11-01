"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

type CallbackResult =
  | { success: true; serverId: string }
  | { success: false; error: string; redirectError: string };

async function exchangeToken(
  serverId: string,
  code: string
): Promise<CallbackResult> {
  const response = await fetch(`/api/mcp/${serverId}/auth/finish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ error: "Unknown error" }));
    return {
      success: false,
      error: errorData.error || "Failed to exchange authorization code",
      redirectError: "oauth_failed",
    };
  }

  return { success: true, serverId };
}

function handleOAuthError(error: string): CallbackResult {
  return {
    success: false,
    error: `OAuth error: ${error}`,
    redirectError: encodeURIComponent(error),
  };
}

function handleMissingParams(): CallbackResult {
  return {
    success: false,
    error: "Missing authorization code or state",
    redirectError: "missing_parameters",
  };
}

/**
 * OAuth callback page
 *
 * This page handles the OAuth redirect from MCP servers.
 * It extracts the authorization code and triggers the token exchange.
 */
export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [errorMessage, setErrorMessage] = useState<string>();

  useEffect(() => {
    async function handleCallback() {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const oauthError = searchParams.get("error");

        let result: CallbackResult;

        if (oauthError) {
          result = handleOAuthError(oauthError);
        } else if (code && state) {
          result = await exchangeToken(state, code);
        } else {
          result = handleMissingParams();
        }

        if (result.success) {
          setStatus("success");
          router.replace(`/server/${result.serverId}`);
        } else {
          setStatus("error");
          setErrorMessage(result.error);
          router.replace(`/?error=${result.redirectError}`);
        }
      } catch (error) {
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "OAuth flow failed"
        );
        setTimeout(() => router.push("/?error=oauth_failed"), 2000);
      }
    }

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>
            {status === "processing" && "Processing Authorization..."}
            {status === "success" && "Authorization Successful!"}
            {status === "error" && "Authorization Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "processing" && (
            <>
              <Spinner />
              <p className="text-muted-foreground text-sm">
                Completing OAuth flow...
              </p>
            </>
          )}
          {status === "success" && (
            <p className="text-muted-foreground text-sm">
              Redirecting back to playground...
            </p>
          )}
          {status === "error" && (
            <p className="text-destructive text-sm">
              {errorMessage || "An error occurred during authorization"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
