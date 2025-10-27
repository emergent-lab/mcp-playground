import { useEffect } from "react";

type ShortcutCallback = (event: KeyboardEvent) => void;
type ShortcutMap = Record<string, ShortcutCallback>;

type UseKeyboardShortcutsOptions = {
  shortcuts: ShortcutMap;
  enabled?: boolean;
};

/**
 * A reusable hook for handling keyboard shortcuts
 * Automatically ignores shortcuts when user is typing in inputs, textareas, or contenteditable elements
 */
export function useKeyboardShortcuts({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const callback = shortcuts[key];

      if (callback) {
        event.preventDefault();
        callback(event);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}
