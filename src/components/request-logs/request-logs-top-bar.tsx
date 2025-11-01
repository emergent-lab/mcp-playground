"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type RequestLogsTopBarProps = {
  logCount: number;
  isOpen: boolean;
  onToggle: () => void;
};

export function RequestLogsTopBar({
  logCount,
  isOpen,
  onToggle,
}: RequestLogsTopBarProps) {
  return (
    <Tooltip delayDuration={1500}>
      <TooltipTrigger asChild>
        <button
          className="flex h-9 w-full cursor-pointer items-center gap-3 border-border/50 border-b px-4 py-2 text-muted-foreground text-sm transition-colors hover:bg-accent/50"
          onClick={onToggle}
          type="button"
        >
          <span className="font-medium text-sm">Request Logs</span>
          {logCount > 0 && (
            <>
              <Separator className="h-1" orientation="vertical" />
              <span className="text-muted-foreground/70 text-xs">
                {logCount} {logCount === 1 ? "entry" : "entries"}
              </span>
            </>
          )}
          <span className="ml-auto">
            {isOpen ? (
              <ChevronDownIcon className="size-3.5" />
            ) : (
              <ChevronUpIcon className="size-3.5" />
            )}
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <div className="flex items-center gap-2">
          <span>Toggle Request Logs</span>
          <Kbd className="border">L</Kbd>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
