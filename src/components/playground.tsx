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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
                    ? "cursor-pointer bg-accent"
                    : "cursor-pointer"
                }
                onClick={() => onToolSelect(typedTool.name)}
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
  const handleServerChange = (serverId: string) => {
    setSelectedServer(serverId);
    setSelectedTool(undefined);
    onServerChange?.(serverId);
  };

  // Clear tool selection when changing tabs
  const handleTabChange = (tab: string) => {
    setSelectedTab(tab as TabValue);
    setSelectedTool(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Server Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Server</CardTitle>
        </CardHeader>
        <CardContent>
          <Select onValueChange={handleServerChange} value={selectedServer}>
            <SelectTrigger>
              <SelectValue placeholder="Select a server" />
            </SelectTrigger>
            <SelectContent>
              {servers?.map((server) => (
                <SelectItem key={server.serverId} value={server.serverId}>
                  {server.serverName || server.serverUrl}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedServer && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left: Tools/Resources/Prompts */}
          <Card>
            <CardHeader>
              <CardTitle>Capabilities</CardTitle>
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
                  {resourcesLoading && (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  )}
                  {!resourcesLoading &&
                    (!resources || resources.length === 0) && (
                      <Empty>
                        <EmptyTitle>No resources available</EmptyTitle>
                        <EmptyDescription>
                          This server does not expose any resources
                        </EmptyDescription>
                      </Empty>
                    )}
                  {!resourcesLoading && resources && resources.length > 0 && (
                    <ScrollArea className="h-[400px]">
                      <ItemGroup>
                        {resources?.map((resource, index: number) => (
                          <Fragment key={resource.uri}>
                            <Item>
                              <ItemContent>
                                <ItemTitle>{resource.name}</ItemTitle>
                                <ItemDescription className="truncate">
                                  {resource.uri}
                                </ItemDescription>
                              </ItemContent>
                            </Item>
                            {index !== resources.length - 1 && (
                              <ItemSeparator />
                            )}
                          </Fragment>
                        ))}
                      </ItemGroup>
                    </ScrollArea>
                  )}
                </TabsContent>

                {/* Prompts Tab */}
                <TabsContent value="prompts">
                  {promptsLoading && (
                    <div className="flex justify-center py-8">
                      <Spinner />
                    </div>
                  )}
                  {!promptsLoading && (!prompts || prompts.length === 0) && (
                    <Empty>
                      <EmptyTitle>No prompts available</EmptyTitle>
                      <EmptyDescription>
                        This server does not expose any prompts
                      </EmptyDescription>
                    </Empty>
                  )}
                  {!promptsLoading && prompts && prompts.length > 0 && (
                    <ScrollArea className="h-[400px]">
                      <ItemGroup>
                        {prompts?.map((prompt, index: number) => (
                          <Fragment key={prompt.name}>
                            <Item>
                              <ItemContent>
                                <ItemTitle>{prompt.name}</ItemTitle>
                                <ItemDescription>
                                  {String(prompt.description || "")}
                                </ItemDescription>
                              </ItemContent>
                            </Item>
                            {index !== prompts.length - 1 && <ItemSeparator />}
                          </Fragment>
                        ))}
                      </ItemGroup>
                    </ScrollArea>
                  )}
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
