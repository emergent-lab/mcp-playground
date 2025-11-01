import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";

type ErrorStateProps = {
  title: string;
  message: string;
  onRetry: () => void;
};

/**
 * Error state component
 *
 * Displays an error message with a retry button.
 * Use when data fetching fails.
 */
export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  return (
    <Empty>
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyDescription>{message}</EmptyDescription>
      <Button className="mt-4" onClick={onRetry} variant="outline">
        Retry
      </Button>
    </Empty>
  );
}
