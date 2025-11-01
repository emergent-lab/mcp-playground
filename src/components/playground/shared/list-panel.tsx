import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

type ListPanelProps = {
  children: ReactNode;
};

/**
 * Left panel container for list items
 *
 * Features:
 * - Scrollable area for list items
 * - Border on the right side
 * - Consistent spacing for children
 */
export function ListPanel({ children }: ListPanelProps) {
  return (
    <div className="h-full min-h-0 border-border border-r">
      <ScrollArea className="h-full min-h-0">
        <div className="space-y-2 p-2">{children}</div>
      </ScrollArea>
    </div>
  );
}
