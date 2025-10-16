"use client";

import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

/**
 * Handles global keyboard shortcuts for the application
 * - 's': Navigate to Servers page
 * - 'p': Navigate to Playground page
 * - 'm': Toggle theme (dark/light mode)
 */
export function KeyboardShortcutsHandler() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  useKeyboardShortcuts({
    shortcuts: {
      s: () => router.push("/servers"),
      p: () => router.push("/playground"),
      m: () => setTheme(theme === "dark" ? "light" : "dark"),
    },
  });

  return null;
}
