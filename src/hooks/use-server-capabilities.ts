import { useInfiniteQueryWithAuth } from "@/hooks/use-infinite-query-with-auth";
import { useTRPC } from "@/lib/trpc/client";

export function useServerCapabilities(serverId: string | undefined) {
  const api = useTRPC();

  const {
    data: toolsData,
    isLoading: toolsLoading,
    error: toolsError,
    fetchNextPage: fetchNextToolsPage,
    hasNextPage: hasNextToolsPage,
    isFetchingNextPage: isFetchingNextToolsPage,
    refetch: refetchTools,
  } = useInfiniteQueryWithAuth(
    api.server.listTools.infiniteQueryOptions(
      { serverId: serverId || "" },
      {
        enabled: !!serverId,
        retry: false,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      }
    )
  );

  // Flatten tools pages
  const tools = toolsData?.pages.flatMap((page) => page.tools);

  const {
    data: resourcesData,
    isLoading: resourcesLoading,
    error: resourcesError,
    fetchNextPage: fetchNextResourcesPage,
    hasNextPage: hasNextResourcesPage,
    isFetchingNextPage: isFetchingNextResourcesPage,
    refetch: refetchResources,
  } = useInfiniteQueryWithAuth(
    api.server.listResources.infiniteQueryOptions(
      { serverId: serverId || "" },
      {
        enabled: !!serverId,
        retry: false,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      }
    )
  );

  // Flatten resources pages
  const resources = resourcesData?.pages.flatMap((page) => page.resources);

  const {
    data: promptsData,
    isLoading: promptsLoading,
    error: promptsError,
    fetchNextPage: fetchNextPromptsPage,
    hasNextPage: hasNextPromptsPage,
    isFetchingNextPage: isFetchingNextPromptsPage,
    refetch: refetchPrompts,
  } = useInfiniteQueryWithAuth(
    api.server.listPrompts.infiniteQueryOptions(
      { serverId: serverId || "" },
      {
        enabled: !!serverId,
        retry: false,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      }
    )
  );

  // Flatten prompts pages
  const prompts = promptsData?.pages.flatMap((page) => page.prompts);

  return {
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
  };
}
