"use client";

import { useTheme } from "next-themes";
import { CommandMenu } from "@/components/command-menu";
import { useAddServerDialog } from "@/contexts/add-server-dialog-context";
import { useCommandMenu } from "@/contexts/command-menu-context";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

/**
 * Handles global keyboard shortcuts for the application
 * - 'Cmd+K' or 'Ctrl+K': Open command menu
 * - 'N': Open Add Server dialog
 * - 'M': Toggle theme (dark/light mode)
 */
export function KeyboardShortcutsHandler() {
  const { theme, setTheme } = useTheme();
  const { open, setOpen } = useCommandMenu();
  const { setOpen: setAddServerDialogOpen } = useAddServerDialog();

  useKeyboardShortcuts({
    shortcuts: {
      m: () => setTheme(theme === "dark" ? "light" : "dark"),
      n: () => setAddServerDialogOpen(true),
      k: (e) => {
        if (e.metaKey || e.ctrlKey) {
          e.preventDefault();
          setOpen(true);
        }
      },
    },
  });

  return <CommandMenu onOpenChange={setOpen} open={open} />;
}
