import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type LoadMoreButtonProps = {
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
};

/**
 * Load more button for paginated lists
 *
 * Automatically hides when there's no next page.
 * Shows loading state while fetching.
 */
export function LoadMoreButton({
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: LoadMoreButtonProps) {
  if (!hasNextPage) {
    return null;
  }

  return (
    <Button
      className="w-full"
      disabled={isFetchingNextPage}
      onClick={onLoadMore}
      size="sm"
      variant="outline"
    >
      {isFetchingNextPage ? (
        <>
          <Spinner />
          Loading...
        </>
      ) : (
        "Load More"
      )}
    </Button>
  );
}
