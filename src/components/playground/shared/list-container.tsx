import type { ReactNode } from "react";

type ListContainerProps = {
  children: ReactNode;
};

/**
 * Two-column grid layout for list views
 *
 * Left column: 280px fixed width for list items
 * Right column: Flexible width for detail view
 */
export function ListContainer({ children }: ListContainerProps) {
  return (
    <div className="grid h-full min-h-0 grid-cols-[280px_minmax(0,1fr)] gap-0">
      {children}
    </div>
  );
}
