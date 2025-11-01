import { Spinner } from "@/components/ui/spinner";

/**
 * Loading state component
 *
 * Displays a centered spinner to indicate loading state.
 * Use as an early return when data is being fetched.
 */
export function LoadingState() {
  return (
    <div className="flex justify-center py-8">
      <Spinner />
    </div>
  );
}
