"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronUpIcon, PlusIcon, ServerIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useAddServerDialog } from "@/contexts/add-server-dialog-context";
import { useTRPC } from "@/lib/trpc/client";

type CommandMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandMenu({ open, onOpenChange }: CommandMenuProps) {
  const { theme, setTheme } = useTheme();
  const { setOpen: setAddServerDialogOpen } = useAddServerDialog();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const api = useTRPC();
  const { data: servers = [], isLoading } = useQuery({
    ...api.server.list.queryOptions(),
    enabled: open,
  });

  // Check if we're on a server page
  const isServerPage = pathname?.startsWith("/server/");

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleServerSelect = () => {
    // TODO: Navigate to server or trigger server action
    onOpenChange(false);
  };

  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    onOpenChange(false);
  };

  const handleAddServer = () => {
    onOpenChange(false);
    setAddServerDialogOpen(true);
  };

  const handleToggleLogs = () => {
    if (
      typeof window !== "undefined" &&
      (window as Window & { toggleRequestLogs?: () => void }).toggleRequestLogs
    ) {
      (
        window as Window & { toggleRequestLogs?: () => void }
      ).toggleRequestLogs?.();
    }
    onOpenChange(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <CommandDialog
      description="Search for servers or change settings"
      onOpenChange={onOpenChange}
      open={open}
      title="Command Menu"
    >
      <CommandInput placeholder="Search servers..." />
      <CommandList>
        <CommandEmpty>
          {isLoading ? "Loading servers..." : "No results found."}
        </CommandEmpty>

        {servers.length > 0 && (
          <>
            <CommandGroup heading="Servers">
              {servers.map((server) => (
                <CommandItem
                  key={server.id}
                  onSelect={handleServerSelect}
                  value={`${server.serverName ?? "Unnamed Server"} ${server.serverUrl}`}
                >
                  <ServerIcon />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium">
                      {server.serverName ?? "Unnamed Server"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {server.serverUrl}
                    </span>
                  </div>
                  {server.requiresAuth && (
                    <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs">
                      OAuth
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        <CommandGroup heading="Actions">
          <CommandItem onSelect={handleAddServer}>
            <PlusIcon />
            <span>Add Server</span>
            <span className="ml-auto text-muted-foreground text-xs">N</span>
          </CommandItem>
          {isServerPage && (
            <CommandItem onSelect={handleToggleLogs}>
              <ChevronUpIcon />
              <span>Toggle Request Logs</span>
              <span className="ml-auto text-muted-foreground text-xs">L</span>
            </CommandItem>
          )}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading="Settings">
          <CommandItem onSelect={handleThemeToggle}>
            <ThemeToggle className="size-4" />
            <span>Toggle Theme</span>
            <span className="ml-auto text-muted-foreground text-xs">M</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
