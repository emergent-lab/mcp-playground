"use client";

import { useCallback, useEffect, useState } from "react";
import { RequestLogs } from "@/components/request-logs/request-logs";
import { RequestLogsTopBar } from "@/components/request-logs/request-logs-top-bar";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useSidebar } from "@/components/ui/sidebar";
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
      {/* Collapsed state toggle*/}
      {!isOpen && (
        <div
          className={`fixed inset-x-0 bottom-0 z-30 border-border/50 border-t bg-background transition-[margin] duration-200 ease-linear ${sidebarOpen ? "ml-(--sidebar-width)" : "ml-0"} md:${sidebarOpen ? "ml-(--sidebar-width)" : "ml-0"}`}
        >
          <RequestLogsTopBar
            isOpen={isOpen}
            logCount={logCount}
            onToggle={togglePanel}
          />
        </div>
      )}

      {/* Panel - always mounted, just hidden when collapsed */}
      <div
        className={`pointer-events-none fixed inset-0 z-30 transition-[margin] duration-200 ease-linear ${sidebarOpen ? "ml-(--sidebar-width)" : "ml-0"} md:${sidebarOpen ? "ml-(--sidebar-width)" : "ml-0"} ${isOpen ? "" : "hidden"}`}
      >
        <ResizablePanelGroup
          autoSaveId="request-logs-panel"
          direction="vertical"
          id="request-logs-panel-group"
        >
          <ResizablePanel
            className="pointer-events-none"
            defaultSize={100 - PANEL_DEFAULT_SIZE}
            id="logs-panel-content"
            minSize={100 - PANEL_MAX_SIZE}
          />
          <ResizableHandle
            className="pointer-events-auto border-border border-t bg-background/95 backdrop-blur-md hover:bg-accent"
            id="logs-panel-handle"
          />
          <ResizablePanel
            className="pointer-events-auto"
            defaultSize={PANEL_DEFAULT_SIZE}
            id="logs-panel-logs"
            maxSize={PANEL_MAX_SIZE}
            minSize={PANEL_MIN_SIZE}
          >
            <div className="flex h-full flex-col bg-background/95 shadow-lg backdrop-blur-sm">
              <RequestLogsTopBar
                isOpen={isOpen}
                logCount={logCount}
                onToggle={togglePanel}
              />
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
