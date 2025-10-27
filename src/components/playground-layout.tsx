"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Playground } from "@/components/playground";
import { PlaygroundNotifications } from "@/components/playground-notifications";
import { RequestLogs } from "@/components/request-logs";
import { ServerConnection } from "@/components/server-connection";
import { ServerList } from "@/components/server-list";
import { SignInDialog } from "@/components/sign-in-dialog";
import { SiteHeader } from "@/components/site-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { auth } from "@/lib/auth";

type PlaygroundLayoutProps = {
  session: Awaited<ReturnType<typeof auth.api.getSession>> | null;
};

export function PlaygroundLayout({ session }: PlaygroundLayoutProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedServerId, setSelectedServerId] = useState<string>();

  // Auto-select server from query params (OAuth callback or new connection)
  useEffect(() => {
    const serverIdFromUrl = searchParams.get("serverId");

    if (serverIdFromUrl) {
      setSelectedServerId(serverIdFromUrl);

      // Clear query params from URL after processing
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="container mx-auto space-y-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <SiteHeader />

          <div className="flex items-center gap-4">
            <ThemeToggle className="size-5" />
            {session && !session.user.isAnonymous ? (
              <>
                <span className="text-muted-foreground text-sm">
                  {session.user.email}
                </span>
                <Button asChild size="sm" variant="outline">
                  <a href="/api/auth/signout">Sign Out</a>
                </Button>
              </>
            ) : (
              <SignInDialog />
            )}
          </div>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left sidebar - Server management */}
          <div className="space-y-6">
            <ServerConnection />
            <ServerList />
          </div>

          {/* Right main area - Playground and logs */}
          <div className="space-y-6 lg:col-span-2">
            <PlaygroundNotifications />
            <Playground
              initialServerId={selectedServerId}
              onServerChange={setSelectedServerId}
            />
            <RequestLogs serverId={selectedServerId} />
          </div>
        </div>
      </div>
    </div>
  );
}
