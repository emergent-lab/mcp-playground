import { Empty, EmptyDescription, EmptyTitle } from "@/components/ui/empty";

type EmptyDataStateProps = {
  title: string;
  description: string;
};

/**
 * Empty data state component
 *
 * Displays a message when no data is available.
 * Use when the data array is empty or undefined.
 */
export function EmptyDataState({ title, description }: EmptyDataStateProps) {
  return (
    <Empty>
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyDescription>{description}</EmptyDescription>
    </Empty>
  );
}
