import { McpClientManager } from "./manager";

export function getMcpManager(): McpClientManager {
  const scope = globalThis as {
    __MCP_CLIENT_MANAGER__?: McpClientManager;
  };
  if (!scope.__MCP_CLIENT_MANAGER__) {
    scope.__MCP_CLIENT_MANAGER__ = new McpClientManager(undefined, {
      defaultIdentity: {
        name: "mcpplayground",
        version: "0.1.0",
      },
    });
  }
  return scope.__MCP_CLIENT_MANAGER__;
}
