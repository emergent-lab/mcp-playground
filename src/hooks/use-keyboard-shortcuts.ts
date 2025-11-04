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
      // Guard against undefined/null key (can occur in some browsers or synthetic events)
      if (!event.key) {
        return;
      }

      const key = event.key.toLowerCase();
      const callback = shortcuts[key];

      if (!callback) {
        return;
      }

      // For Cmd+K or Ctrl+K, always handle it (even in input fields)
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        callback(event);
        return;
      }

      // For other shortcuts, ignore if user is typing in an input field
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      event.preventDefault();
      callback(event);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}
