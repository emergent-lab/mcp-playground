import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

type DetailsPanelProps = {
  children: ReactNode;
};

/**
 * Right panel container for detail views
 *
 * Provides a scrollable area for displaying detailed content
 * of the selected item from the list.
 */
export function DetailsPanel({ children }: DetailsPanelProps) {
  return <ScrollArea className="h-full min-h-0 min-w-0">{children}</ScrollArea>;
}
