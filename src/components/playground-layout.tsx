"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Playground } from "@/components/playground";
import { PlaygroundNotifications } from "@/components/playground-notifications";
import { RequestLogs } from "@/components/request-logs";
import { ServerConnection } from "@/components/server-connection";
import { ServerList } from "@/components/server-list";

export function PlaygroundLayout() {
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
    <>
      <PlaygroundNotifications />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left sidebar - Server management */}
        <div className="space-y-4">
          <ServerConnection />
          <ServerList />
        </div>

        {/* Right main area - Playground and logs */}
        <div className="space-y-4 lg:col-span-2">
          <Playground
            initialServerId={selectedServerId}
            onServerChange={setSelectedServerId}
          />
          <RequestLogs serverId={selectedServerId} />
        </div>
      </div>
    </>
  );
}
