import type { ReactNode } from "react";

type ListItemProps = {
  name: string;
  description?: string;
  metadata?: ReactNode;
  isSelected: boolean;
  onSelect: () => void;
};

/**
 * Reusable list item component
 *
 * Features:
 * - Hover and selected states
 * - Selected indicator (left border)
 * - Truncated name and description
 * - Optional metadata slot for custom content
 *
 * @example
 * <ListItem
 *   name="Tool Name"
 *   description="Tool description"
 *   isSelected={selected}
 *   onSelect={() => handleSelect()}
 * />
 */
export function ListItem({
  name,
  description,
  metadata,
  isSelected,
  onSelect,
}: ListItemProps) {
  return (
    <button
      className={`group relative w-full rounded-sm px-3 py-2 text-left transition-colors hover:bg-accent/50 ${
        isSelected ? "bg-accent" : ""
      }`}
      onClick={onSelect}
      type="button"
    >
      {isSelected && (
        <div className="absolute inset-y-0 left-0 w-0.5 bg-primary" />
      )}
      <div className="min-w-0">
        <div className="truncate font-medium text-sm">{name}</div>
        {description && (
          <div className="line-clamp-2 text-muted-foreground text-xs">
            {description}
          </div>
        )}
        {metadata}
      </div>
    </button>
  );
}
