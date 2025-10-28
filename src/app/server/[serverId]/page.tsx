import { cookies } from "next/headers";
import { Playground } from "@/components/playground";
import { PlaygroundNotifications } from "@/components/playground-notifications";
import { RequestLogsPanel } from "@/components/request-logs-panel";

type ServerPageProps = {
  params: Promise<{
    serverId: string;
  }>;
};

export default async function ServerPage({ params }: ServerPageProps) {
  const { serverId } = await params;
  const cookieStore = await cookies();
  const panelState = cookieStore.get("request_logs_panel_state")?.value;
  // Default to true if cookie doesn't exist, otherwise use the stored value
  const panelOpen =
    panelState === null || panelState === undefined
      ? true
      : panelState === "true";

  return (
    <>
      <PlaygroundNotifications />
      <Playground initialServerId={serverId} />
      <RequestLogsPanel defaultOpen={panelOpen} serverId={serverId} />
    </>
  );
}
