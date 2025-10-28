"use client";

import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { RequestLogs } from "@/components/request-logs";
import { Kbd } from "@/components/ui/kbd";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

type RequestLogsPanelProps = {
  serverId: string;
  defaultOpen?: boolean;
};

const PANEL_MIN_SIZE = 15; // 15% of viewport
const PANEL_DEFAULT_SIZE = 35; // 35% of viewport
const PANEL_MAX_SIZE = 80; // 80% of viewport
const COOKIE_NAME = "request_logs_panel_state";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function RequestLogsPanel({
  serverId,
  defaultOpen = true,
}: RequestLogsPanelProps) {
  const [isOpen, setIsOpenState] = useState(defaultOpen);
  const [logCount, setLogCount] = useState(0);
  const { open: sidebarOpen } = useSidebar();

  const setIsOpen = useCallback((value: boolean) => {
    setIsOpenState(value);
    // Persist to cookie
    // biome-ignore lint/suspicious/noDocumentCookie: Using same pattern as sidebar component
    document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${COOKIE_MAX_AGE}`;
  }, []);

  const togglePanel = useCallback(() => {
    setIsOpen(!isOpen);
  }, [isOpen, setIsOpen]);

  // Keyboard shortcut
  useKeyboardShortcuts({
    shortcuts: {
      l: togglePanel,
    },
  });

  // Expose toggle function globally for command menu
  useEffect(() => {
    if (typeof window !== "undefined") {
      (
        window as Window & { toggleRequestLogs?: () => void }
      ).toggleRequestLogs = togglePanel;
    }
    return () => {
      if (typeof window !== "undefined") {
        (
          window as Window & { toggleRequestLogs?: () => void }
        ).toggleRequestLogs = undefined;
      }
    };
  }, [togglePanel]);

  return (
    <>
      {/* Collapsed state toggle - Linear/Vercel style */}
      {!isOpen && (
        <div
          className={`fixed inset-x-0 bottom-0 z-30 border-border/50 border-t bg-background transition-[margin] duration-200 ease-linear ${sidebarOpen ? "ml-[var(--sidebar-width)]" : "ml-0"} md:${sidebarOpen ? "ml-[var(--sidebar-width)]" : "ml-0"}`}
        >
          <Tooltip delayDuration={1500}>
            <TooltipTrigger asChild>
              <button
                className="flex h-9 w-full cursor-pointer items-center gap-3 px-4 text-muted-foreground text-sm transition-colors hover:bg-accent/50"
                onClick={togglePanel}
                type="button"
              >
                <span className="font-medium">Request Logs</span>
                {logCount > 0 && (
                  <>
                    <span className="text-muted-foreground/70 text-xs">|</span>
                    <span className="text-muted-foreground/70 text-xs">
                      {logCount} {logCount === 1 ? "entry" : "entries"}
                    </span>
                  </>
                )}
                <span className="ml-auto">
                  <ChevronUpIcon className="size-3.5" />
                </span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <div className="flex items-center gap-2">
                <span>Toggle Request Logs</span>
                <Kbd>L</Kbd>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      {/* Panel - always mounted, just hidden when collapsed */}
      <div
        className={`pointer-events-none fixed inset-0 z-30 transition-[margin] duration-200 ease-linear ${sidebarOpen ? "ml-[var(--sidebar-width)]" : "ml-0"} md:${sidebarOpen ? "ml-[var(--sidebar-width)]" : "ml-0"} ${isOpen ? "" : "hidden"}`}
      >
        <ResizablePanelGroup
          autoSaveId="request-logs-panel"
          direction="vertical"
        >
          <ResizablePanel
            className="pointer-events-none"
            defaultSize={100 - PANEL_DEFAULT_SIZE}
            minSize={100 - PANEL_MAX_SIZE}
          />
          <ResizableHandle className="pointer-events-auto border-border border-t bg-background/95 backdrop-blur-md hover:bg-accent" />
          <ResizablePanel
            className="pointer-events-auto"
            defaultSize={PANEL_DEFAULT_SIZE}
            maxSize={PANEL_MAX_SIZE}
            minSize={PANEL_MIN_SIZE}
          >
            <div className="flex h-full flex-col border border-border bg-background/95 shadow-lg backdrop-blur-sm">
              <button
                className="flex cursor-pointer items-center gap-3 border-border border-b px-4 py-2 text-muted-foreground transition-colors hover:bg-accent/50"
                onClick={togglePanel}
                type="button"
              >
                <span className="font-medium text-sm">Request Logs</span>
                {logCount > 0 && (
                  <>
                    <span className="text-muted-foreground/70 text-xs">|</span>
                    <span className="text-muted-foreground/70 text-xs">
                      {logCount} {logCount === 1 ? "entry" : "entries"}
                    </span>
                  </>
                )}
                <span className="ml-auto">
                  <ChevronDownIcon className="size-3.5" />
                </span>
              </button>
              <div className="flex-1 overflow-hidden">
                <RequestLogs
                  onLogCountChange={setLogCount}
                  serverId={serverId}
                />
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </>
  );
}
