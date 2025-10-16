import { getMcpManager } from "@/lib/mcp/registry";
import ServersClient from "./servers-client";

export default function ServersPage() {
  const initialServers = getMcpManager().getServerSummaries();

  return (
    <div className="px-1">
      <ServersClient initialServers={initialServers} />
    </div>
  );
}
