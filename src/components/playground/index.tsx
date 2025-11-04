"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useServerCapabilities } from "@/hooks/use-server-capabilities";
import { useTRPC } from "@/lib/trpc/client";
import { PromptsTab } from "./prompts-tab";
import { ResourcesTab } from "./resources-tab";
import { ToolsTab } from "./tools-tab";

type TabValue = "tools" | "resources" | "prompts";

type PlaygroundProps = {
  serverId: string;
};

export function Playground({ serverId }: PlaygroundProps) {
  const api = useTRPC();
  const router = useRouter();
  const [selectedTool, setSelectedTool] = useState<string>();
  const [selectedPrompt, setSelectedPrompt] = useState<string>();
  const [selectedResource, setSelectedResource] = useState<string>();
  const [selectedTab, setSelectedTab] = useState<TabValue>("tools");

  const {
    data: server,
    isLoading,
    error,
  } = useQuery(api.server.getById.queryOptions({ serverId }));

  // Redirect to home if server not found
  useEffect(() => {
    if (error) {
      router.replace("/");
    }
  }, [error, router]);

  const {
    tools,
    toolsLoading,
    toolsError,
    refetchTools,
    fetchNextToolsPage,
    hasNextToolsPage,
    isFetchingNextToolsPage,
    resources,
    resourcesLoading,
    resourcesError,
    refetchResources,
    fetchNextResourcesPage,
    hasNextResourcesPage,
    isFetchingNextResourcesPage,
    prompts,
    promptsLoading,
    promptsError,
    refetchPrompts,
    fetchNextPromptsPage,
    hasNextPromptsPage,
    isFetchingNextPromptsPage,
  } = useServerCapabilities(serverId);

  // Clear selections when changing tabs
  const handleTabChange = (tab: string) => {
    setSelectedTab(tab as TabValue);
    setSelectedTool(undefined);
    setSelectedPrompt(undefined);
    setSelectedResource(undefined);
  };

  if (isLoading || !server) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Server Heading */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-2xl">
            {server.serverName || new URL(server.serverUrl).hostname}
          </h2>
          {server.requiresAuth &&
            (server.tokens ? (
              <Badge variant="default">Authenticated</Badge>
            ) : (
              <Badge variant="secondary">Auth Required</Badge>
            ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs onValueChange={handleTabChange} value={selectedTab}>
        <TabsList className="w-full">
          <TabsTrigger className="flex-1" value="tools">
            Tools
            {tools && tools.length > 0 && (
              <Badge className="ml-2 border-border" variant="secondary">
                {tools.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="resources">
            Resources
            {resources && resources.length > 0 && (
              <Badge className="ml-2 border-border" variant="secondary">
                {resources.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger className="flex-1" value="prompts">
            Prompts
            {prompts && prompts.length > 0 && (
              <Badge className="ml-2 border-border" variant="secondary">
                {prompts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Two-Pane Content */}
        <div className="mt-6">
          <Card className="h-[calc(100vh-17rem)] overflow-hidden">
            <CardContent className="flex min-h-0 flex-1 flex-col p-0">
              {/* Tools Tab */}
              <TabsContent className="mt-0 h-full min-h-0" value="tools">
                <ToolsTab
                  fetchNextToolsPage={fetchNextToolsPage}
                  hasNextToolsPage={hasNextToolsPage}
                  isFetchingNextToolsPage={isFetchingNextToolsPage}
                  onToolSelect={setSelectedTool}
                  refetchTools={refetchTools}
                  selectedTool={selectedTool}
                  serverId={serverId}
                  tools={tools}
                  toolsError={toolsError}
                  toolsLoading={toolsLoading}
                />
              </TabsContent>

              {/* Resources Tab */}
              <TabsContent className="mt-0 h-full min-h-0" value="resources">
                <ResourcesTab
                  fetchNextResourcesPage={fetchNextResourcesPage}
                  hasNextResourcesPage={hasNextResourcesPage}
                  isFetchingNextResourcesPage={isFetchingNextResourcesPage}
                  onResourceSelect={setSelectedResource}
                  refetchResources={refetchResources}
                  resources={resources}
                  resourcesError={resourcesError}
                  resourcesLoading={resourcesLoading}
                  selectedResource={selectedResource}
                  serverId={serverId}
                />
              </TabsContent>

              {/* Prompts Tab */}
              <TabsContent className="mt-0 h-full min-h-0" value="prompts">
                <PromptsTab
                  fetchNextPromptsPage={fetchNextPromptsPage}
                  hasNextPromptsPage={hasNextPromptsPage}
                  isFetchingNextPromptsPage={isFetchingNextPromptsPage}
                  onPromptSelect={setSelectedPrompt}
                  prompts={prompts}
                  promptsError={promptsError}
                  promptsLoading={promptsLoading}
                  refetchPrompts={refetchPrompts}
                  selectedPrompt={selectedPrompt}
                  serverId={serverId}
                />
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  );
}
