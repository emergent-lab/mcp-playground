import { ResourceViewer } from "@/components/resource-viewer";
import { DetailsPanel } from "./shared/details-panel";
import { EmptyDataState } from "./shared/empty-data-state";
import { ErrorState } from "./shared/error-state";
import { ListContainer } from "./shared/list-container";
import { ListItem } from "./shared/list-item";
import { ListPanel } from "./shared/list-panel";
import { LoadMoreButton } from "./shared/load-more-button";
import { LoadingState } from "./shared/loading-state";
import { getErrorMessage, isAuthError, isMethodNotFoundError } from "./utils";

type ResourcesTabProps = {
  resources: unknown[] | undefined;
  resourcesLoading: boolean;
  resourcesError: unknown;
  refetchResources: () => void;
  selectedResource: string | undefined;
  onResourceSelect: (uri: string) => void;
  serverId: string;
  hasNextResourcesPage: boolean | undefined;
  isFetchingNextResourcesPage: boolean;
  fetchNextResourcesPage: () => void;
};

export function ResourcesTab({
  resources,
  resourcesLoading,
  resourcesError,
  refetchResources,
  selectedResource,
  onResourceSelect,
  serverId,
  hasNextResourcesPage,
  isFetchingNextResourcesPage,
  fetchNextResourcesPage,
}: ResourcesTabProps) {
  if (resourcesLoading) {
    return <LoadingState />;
  }

  if (
    resourcesError &&
    !isMethodNotFoundError(resourcesError) &&
    !isAuthError(resourcesError)
  ) {
    return (
      <ErrorState
        message={getErrorMessage(resourcesError, "Failed to load resources")}
        onRetry={refetchResources}
        title="Failed to load resources"
      />
    );
  }

  if (!resources || resources.length === 0) {
    return (
      <EmptyDataState
        description="This server does not expose any resources"
        title="No resources available"
      />
    );
  }

  return (
    <ListContainer>
      <ListPanel>
        {resources.map((resource) => {
          const typedResource = resource as {
            uri: string;
            name: string;
            mimeType?: string;
          };
          return (
            <ListItem
              isSelected={selectedResource === typedResource.uri}
              key={typedResource.uri}
              metadata={
                <div className="truncate text-muted-foreground text-xs">
                  {typedResource.uri}
                </div>
              }
              name={typedResource.name}
              onSelect={() => onResourceSelect(typedResource.uri)}
            />
          );
        })}
        <LoadMoreButton
          hasNextPage={hasNextResourcesPage}
          isFetchingNextPage={isFetchingNextResourcesPage}
          onLoadMore={fetchNextResourcesPage}
        />
      </ListPanel>
      <DetailsPanel>
        {selectedResource ? (
          <div className="p-6">
            <ResourceViewer
              resourceMimeType={
                (
                  resources.find(
                    (r) => (r as { uri: string }).uri === selectedResource
                  ) as
                    | { uri: string; name: string; mimeType?: string }
                    | undefined
                )?.mimeType
              }
              resourceName={
                (
                  resources.find(
                    (r) => (r as { uri: string }).uri === selectedResource
                  ) as { uri: string; name: string } | undefined
                )?.name ?? ""
              }
              resourceUri={selectedResource}
              serverId={serverId}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyDataState
              description="Choose a resource from the list to view its content"
              title="Select a resource"
            />
          </div>
        )}
      </DetailsPanel>
    </ListContainer>
  );
}
