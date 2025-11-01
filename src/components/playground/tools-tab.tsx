import { ToolExecutor } from "@/components/tool-executor";
import { DetailsPanel } from "./shared/details-panel";
import { EmptyDataState } from "./shared/empty-data-state";
import { ErrorState } from "./shared/error-state";
import { ListContainer } from "./shared/list-container";
import { ListItem } from "./shared/list-item";
import { ListPanel } from "./shared/list-panel";
import { LoadMoreButton } from "./shared/load-more-button";
import { LoadingState } from "./shared/loading-state";
import { getErrorMessage, isAuthError, isMethodNotFoundError } from "./utils";

type ToolsTabProps = {
  tools: unknown[] | undefined;
  toolsLoading: boolean;
  toolsError: unknown;
  refetchTools: () => void;
  selectedTool: string | undefined;
  onToolSelect: (tool: string) => void;
  serverId: string;
  hasNextToolsPage: boolean | undefined;
  isFetchingNextToolsPage: boolean;
  fetchNextToolsPage: () => void;
};

export function ToolsTab({
  tools,
  toolsLoading,
  toolsError,
  refetchTools,
  selectedTool,
  onToolSelect,
  serverId,
  hasNextToolsPage,
  isFetchingNextToolsPage,
  fetchNextToolsPage,
}: ToolsTabProps) {
  if (toolsLoading) {
    return <LoadingState />;
  }

  if (
    toolsError &&
    !isMethodNotFoundError(toolsError) &&
    !isAuthError(toolsError)
  ) {
    return (
      <ErrorState
        message={getErrorMessage(toolsError, "Failed to load tools")}
        onRetry={refetchTools}
        title="Failed to load tools"
      />
    );
  }

  if (!tools || tools.length === 0) {
    return (
      <EmptyDataState
        description="This server does not expose any tools"
        title="No tools available"
      />
    );
  }

  return (
    <ListContainer>
      <ListPanel>
        {tools.map((tool) => {
          const typedTool = tool as {
            name: string;
            description?: string;
          };
          return (
            <ListItem
              description={typedTool.description}
              isSelected={selectedTool === typedTool.name}
              key={typedTool.name}
              name={typedTool.name}
              onSelect={() => onToolSelect(typedTool.name)}
            />
          );
        })}
        <LoadMoreButton
          hasNextPage={hasNextToolsPage}
          isFetchingNextPage={isFetchingNextToolsPage}
          onLoadMore={fetchNextToolsPage}
        />
      </ListPanel>
      <DetailsPanel>
        {selectedTool ? (
          <div className="p-6">
            <ToolExecutor
              serverId={serverId}
              toolDescription={
                (
                  tools.find(
                    (t) => (t as { name: string }).name === selectedTool
                  ) as { description?: string } | undefined
                )?.description
              }
              toolName={selectedTool}
              tools={tools as Array<{ name: string; inputSchema?: unknown }>}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyDataState
              description="Choose a tool from the list to view details and execute"
              title="Select a tool"
            />
          </div>
        )}
      </DetailsPanel>
    </ListContainer>
  );
}
