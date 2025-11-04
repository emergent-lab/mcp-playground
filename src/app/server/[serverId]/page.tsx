import { cookies } from "next/headers";
import { Playground } from "@/components/playground";
import { PlaygroundNotifications } from "@/components/playground-notifications";
import { RequestLogsPanel } from "@/components/request-logs/request-logs-panel";
import { getQueryClient, HydrateClient, trpc } from "@/lib/trpc/server";

type ServerPageProps = {
  params: Promise<{
    serverId: string;
  }>;
};

export default async function ServerPage({ params }: ServerPageProps) {
  const { serverId } = await params;
  const queryClient = getQueryClient();

  // Prefetch server data - don't await to enable streaming
  // Catch promise rejection to prevent unhandled promise rejections
  // Failed queries are excluded from dehydration and will retry on the client
  void queryClient
    .prefetchQuery(trpc.server.getById.queryOptions({ serverId }))
    .catch(() => {
      // Swallow error - failed queries won't be dehydrated, client will retry
    });

  const cookieStore = await cookies();
  const panelState = cookieStore.get("request_logs_panel_state")?.value;
  // Default to true if cookie doesn't exist, otherwise use the stored value
  const panelOpen =
    panelState === null || panelState === undefined
      ? true
      : panelState === "true";

  return (
    <HydrateClient>
      <PlaygroundNotifications />
      <Playground serverId={serverId} />
      <RequestLogsPanel defaultOpen={panelOpen} serverId={serverId} />
    </HydrateClient>
  );
}
