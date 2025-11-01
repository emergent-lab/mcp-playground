import { PromptExecutor } from "@/components/prompt-executor";
import { DetailsPanel } from "./shared/details-panel";
import { EmptyDataState } from "./shared/empty-data-state";
import { ErrorState } from "./shared/error-state";
import { ListContainer } from "./shared/list-container";
import { ListItem } from "./shared/list-item";
import { ListPanel } from "./shared/list-panel";
import { LoadMoreButton } from "./shared/load-more-button";
import { LoadingState } from "./shared/loading-state";
import { getErrorMessage, isAuthError, isMethodNotFoundError } from "./utils";

type PromptsTabProps = {
  prompts: unknown[] | undefined;
  promptsLoading: boolean;
  promptsError: unknown;
  refetchPrompts: () => void;
  selectedPrompt: string | undefined;
  onPromptSelect: (prompt: string) => void;
  serverId: string;
  hasNextPromptsPage: boolean | undefined;
  isFetchingNextPromptsPage: boolean;
  fetchNextPromptsPage: () => void;
};

export function PromptsTab({
  prompts,
  promptsLoading,
  promptsError,
  refetchPrompts,
  selectedPrompt,
  onPromptSelect,
  serverId,
  hasNextPromptsPage,
  isFetchingNextPromptsPage,
  fetchNextPromptsPage,
}: PromptsTabProps) {
  if (promptsLoading) {
    return <LoadingState />;
  }

  if (
    promptsError &&
    !isMethodNotFoundError(promptsError) &&
    !isAuthError(promptsError)
  ) {
    return (
      <ErrorState
        message={getErrorMessage(promptsError, "Failed to load prompts")}
        onRetry={refetchPrompts}
        title="Failed to load prompts"
      />
    );
  }

  if (!prompts || prompts.length === 0) {
    return (
      <EmptyDataState
        description="This server does not expose any prompts"
        title="No prompts available"
      />
    );
  }

  return (
    <ListContainer>
      <ListPanel>
        {prompts.map((prompt) => {
          const typedPrompt = prompt as {
            name: string;
            description?: string;
          };
          return (
            <ListItem
              description={typedPrompt.description}
              isSelected={selectedPrompt === typedPrompt.name}
              key={typedPrompt.name}
              name={typedPrompt.name}
              onSelect={() => onPromptSelect(typedPrompt.name)}
            />
          );
        })}
        <LoadMoreButton
          hasNextPage={hasNextPromptsPage}
          isFetchingNextPage={isFetchingNextPromptsPage}
          onLoadMore={fetchNextPromptsPage}
        />
      </ListPanel>
      <DetailsPanel>
        {selectedPrompt ? (
          <div className="p-6">
            <PromptExecutor
              promptDescription={
                (
                  prompts.find(
                    (p) => (p as { name: string }).name === selectedPrompt
                  ) as { description?: string } | undefined
                )?.description
              }
              promptName={selectedPrompt}
              prompts={prompts as Array<{ name: string; arguments?: unknown }>}
              serverId={serverId}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center">
            <EmptyDataState
              description="Choose a prompt from the list to view details and execute"
              title="Select a prompt"
            />
          </div>
        )}
      </DetailsPanel>
    </ListContainer>
  );
}
