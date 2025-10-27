"use client";

import { useTheme } from "next-themes";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

/**
 * Handles global keyboard shortcuts for the application
 * - 'm': Toggle theme (dark/light mode)
 */
export function KeyboardShortcutsHandler() {
  const { theme, setTheme } = useTheme();

  useKeyboardShortcuts({
    shortcuts: {
      m: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
  });

  return null;
}
