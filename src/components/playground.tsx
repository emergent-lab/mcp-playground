"use client";

import { useQuery } from "@tanstack/react-query";
import { Fragment, useEffect, useState } from "react";
import { toast } from "sonner";
import { ToolExecutor } from "@/components/tool-executor";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@/components/ui/item";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTRPC } from "@/lib/trpc/client";

type TabValue = "tools" | "resources" | "prompts";

type PlaygroundProps = {
  initialServerId?: string;
  onServerChange?: (serverId: string | undefined) => void;
};

type ToolsListProps = {
  tools: unknown[] | undefined;
  toolsLoading: boolean;
  selectedTool: string | undefined;
  onToolSelect: (toolName: string) => void;
};

function ToolsList({
  tools,
  toolsLoading,
  selectedTool,
  onToolSelect,
}: ToolsListProps) {
  if (toolsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!tools || tools.length === 0) {
    return (
      <Empty>
        <EmptyTitle>No tools available</EmptyTitle>
        <EmptyDescription>
          This server does not expose any tools
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <ItemGroup>
        {tools.map((tool, index: number) => {
          const typedTool = tool as {
            name: string;
            description?: string;
          };
          return (
            <Fragment key={typedTool.name}>
              <Item
                className={
                  selectedTool === typedTool.name
                    ? "fade-in slide-in-from-bottom-2 animate-in cursor-pointer bg-accent"
                    : "fade-in slide-in-from-bottom-2 animate-in cursor-pointer"
                }
                onClick={() => onToolSelect(typedTool.name)}
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <ItemContent>
                  <ItemTitle>{typedTool.name}</ItemTitle>
                  <ItemDescription>
                    {String(typedTool.description || "")}
                  </ItemDescription>
                </ItemContent>
              </Item>
              {index !== tools.length - 1 && <ItemSeparator />}
            </Fragment>
          );
        })}
      </ItemGroup>
    </ScrollArea>
  );
}

function handleUnauthorizedError(
  error: unknown,
  redirectToAuth: (url: string) => void
) {
  if (error && typeof error === "object" && "data" in error) {
    const trpcError = error.data as { code?: string };
    if (trpcError.code === "UNAUTHORIZED") {
      try {
        const errorObj = error as { message?: string };
        const errorMessage = errorObj.message || "";
        const authData = JSON.parse(errorMessage);
        if (authData.authUrl) {
          toast.info("Redirecting to authorization...");
          redirectToAuth(authData.authUrl);
        }
      } catch {
        // Ignore parse errors - auth URL not available in expected format
      }
    }
  }
}

type ResourcesListProps = {
  resources: unknown[] | undefined;
  resourcesLoading: boolean;
};

function ResourcesList({ resources, resourcesLoading }: ResourcesListProps) {
  if (resourcesLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <Empty>
        <EmptyTitle>No resources available</EmptyTitle>
        <EmptyDescription>
          This server does not expose any resources
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <ItemGroup>
        {resources.map((resource, index: number) => {
          const typedResource = resource as { uri: string; name: string };
          return (
            <Fragment key={typedResource.uri}>
              <Item
                className="fade-in slide-in-from-bottom-2 animate-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <ItemContent>
                  <ItemTitle>{typedResource.name}</ItemTitle>
                  <ItemDescription className="truncate">
                    {typedResource.uri}
                  </ItemDescription>
                </ItemContent>
              </Item>
              {index !== resources.length - 1 && <ItemSeparator />}
            </Fragment>
          );
        })}
      </ItemGroup>
    </ScrollArea>
  );
}

type PromptsListProps = {
  prompts: unknown[] | undefined;
  promptsLoading: boolean;
};

function PromptsList({ prompts, promptsLoading }: PromptsListProps) {
  if (promptsLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner />
      </div>
    );
  }

  if (!prompts || prompts.length === 0) {
    return (
      <Empty>
        <EmptyTitle>No prompts available</EmptyTitle>
        <EmptyDescription>
          This server does not expose any prompts
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <ScrollArea className="h-[400px]">
      <ItemGroup>
        {prompts.map((prompt, index: number) => {
          const typedPrompt = prompt as {
            name: string;
            description?: string;
          };
          return (
            <Fragment key={typedPrompt.name}>
              <Item
                className="fade-in slide-in-from-bottom-2 animate-in"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <ItemContent>
                  <ItemTitle>{typedPrompt.name}</ItemTitle>
                  <ItemDescription>
                    {String(typedPrompt.description || "")}
                  </ItemDescription>
                </ItemContent>
              </Item>
              {index !== prompts.length - 1 && <ItemSeparator />}
            </Fragment>
          );
        })}
      </ItemGroup>
    </ScrollArea>
  );
}

function useServerCapabilities(serverId: string | undefined) {
  const api = useTRPC();

  // Fetch only tools initially - if it fails with UNAUTHORIZED, we'll redirect to OAuth
  const {
    data: tools,
    isLoading: toolsLoading,
    error: toolsError,
  } = useQuery({
    ...api.server.listTools.queryOptions({ serverId: serverId || "" }),
    enabled: !!serverId,
    retry: false,
  });

  // Only fetch resources/prompts if tools query succeeded
  const toolsSucceeded = tools !== undefined && !toolsError;

  const {
    data: resources,
    isLoading: resourcesLoading,
    error: resourcesError,
  } = useQuery({
    ...api.server.listResources.queryOptions({
      serverId: serverId || "",
    }),
    enabled: !!serverId && toolsSucceeded,
    retry: false,
  });

  const {
    data: prompts,
    isLoading: promptsLoading,
    error: promptsError,
  } = useQuery({
    ...api.server.listPrompts.queryOptions({ serverId: serverId || "" }),
    enabled: !!serverId && toolsSucceeded,
    retry: false,
  });

  return {
    tools,
    toolsLoading,
    toolsError,
    resources,
    resourcesLoading,
    resourcesError,
    prompts,
    promptsLoading,
    promptsError,
  };
}

export function Playground({
  initialServerId,
  onServerChange,
}: PlaygroundProps = {}) {
  const api = useTRPC();
  const [selectedServer, setSelectedServer] = useState<string | undefined>(
    initialServerId
  );
  const [selectedTool, setSelectedTool] = useState<string>();
  const [selectedTab, setSelectedTab] = useState<TabValue>("tools");

  // Update selected server when initialServerId changes
  useEffect(() => {
    if (initialServerId && initialServerId !== selectedServer) {
      setSelectedServer(initialServerId);
      onServerChange?.(initialServerId);
    }
  }, [initialServerId, selectedServer, onServerChange]);

  const { data: servers } = useQuery(api.server.list.queryOptions());

  const {
    tools,
    toolsLoading,
    toolsError,
    resources,
    resourcesLoading,
    resourcesError,
    prompts,
    promptsLoading,
    promptsError,
  } = useServerCapabilities(selectedServer);

  // Handle UNAUTHORIZED errors from capability queries
  useEffect(() => {
    const error = toolsError || resourcesError || promptsError;
    handleUnauthorizedError(error, (url) => {
      window.location.href = url;
    });
  }, [toolsError, resourcesError, promptsError]);

  // Clear selections when changing servers
  const _handleServerChange = (serverId: string) => {
    setSelectedServer(serverId);
    setSelectedTool(undefined);
    onServerChange?.(serverId);
  };

  // Clear tool selection when changing tabs
  const handleTabChange = (tab: string) => {
    setSelectedTab(tab as TabValue);
    setSelectedTool(undefined);
  };

  const currentServer = servers?.find((s) => s.serverId === selectedServer);
  const serverTitle =
    currentServer?.serverName || currentServer?.serverUrl || "Server";

  return (
    <div className="space-y-6">
      {/* Server Title */}
      {selectedServer && (
        <div>
          <h1 className="font-semibold text-2xl tracking-tight">
            {serverTitle}
          </h1>
          {currentServer?.serverName && (
            <p className="mt-1 text-muted-foreground text-sm">
              {currentServer.serverUrl}
            </p>
          )}
        </div>
      )}

      {selectedServer && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left: Tools/Resources/Prompts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-medium text-muted-foreground text-sm">
                Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs onValueChange={handleTabChange} value={selectedTab}>
                <TabsList className="w-full">
                  <TabsTrigger className="flex-1" value="tools">
                    Tools
                    {tools && tools.length > 0 && (
                      <Badge className="ml-2" variant="secondary">
                        {tools.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger className="flex-1" value="resources">
                    Resources
                    {resources && resources.length > 0 && (
                      <Badge className="ml-2" variant="secondary">
                        {resources.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger className="flex-1" value="prompts">
                    Prompts
                    {prompts && prompts.length > 0 && (
                      <Badge className="ml-2" variant="secondary">
                        {prompts.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Tools Tab */}
                <TabsContent value="tools">
                  <ToolsList
                    onToolSelect={setSelectedTool}
                    selectedTool={selectedTool}
                    tools={tools}
                    toolsLoading={toolsLoading}
                  />
                </TabsContent>

                {/* Resources Tab */}
                <TabsContent value="resources">
                  <ResourcesList
                    resources={resources}
                    resourcesLoading={resourcesLoading}
                  />
                </TabsContent>

                {/* Prompts Tab */}
                <TabsContent value="prompts">
                  <PromptsList
                    prompts={prompts}
                    promptsLoading={promptsLoading}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Right: Executor */}
          <div>
            {selectedTab === "tools" && selectedTool ? (
              <ToolExecutor serverId={selectedServer} toolName={selectedTool} />
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <Empty>
                    <EmptyTitle>No tool selected</EmptyTitle>
                    <EmptyDescription>
                      Select a tool from the list to execute it
                    </EmptyDescription>
                  </Empty>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
