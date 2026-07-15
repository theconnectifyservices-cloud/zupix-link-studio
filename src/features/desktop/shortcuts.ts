import { useEffect } from "react";

export interface ShortcutDef {
  id: string;
  keys: string; // e.g. "mod+k", "mod+shift+p"
  label: string;
  group: string;
  when?: () => boolean;
}

/** Canonical shortcut list. Rendered in the shortcuts reference dialog. */
export const SHORTCUTS: ShortcutDef[] = [
  { id: "cmd.palette", keys: "mod+k", label: "Open command palette", group: "General" },
  { id: "cmd.search", keys: "mod+/", label: "Focus global search", group: "General" },
  { id: "cmd.new", keys: "mod+shift+n", label: "New bio page", group: "Create" },
  { id: "cmd.save", keys: "mod+s", label: "Save", group: "Editing" },
  { id: "cmd.publish", keys: "mod+shift+p", label: "Publish", group: "Editing" },
  { id: "cmd.duplicate", keys: "mod+d", label: "Duplicate selection", group: "Editing" },
  { id: "cmd.delete", keys: "delete", label: "Delete selection", group: "Editing" },
  { id: "cmd.undo", keys: "mod+z", label: "Undo", group: "Editing" },
  { id: "cmd.redo", keys: "mod+shift+z", label: "Redo", group: "Editing" },
  { id: "cmd.focus", keys: "mod+.", label: "Toggle focus mode", group: "Workspace" },
  { id: "cmd.fullscreen", keys: "f11", label: "Toggle full screen", group: "Workspace" },
  { id: "cmd.settings", keys: "mod+,", label: "Open settings", group: "Navigation" },
  { id: "cmd.help", keys: "shift+?", label: "Show keyboard shortcuts", group: "General" },
];

function normalizeCombo(combo: string): {
  key: string;
  mod: boolean;
  shift: boolean;
  alt: boolean;
} {
  const parts = combo.toLowerCase().split("+");
  const key = parts.pop()!;
  return {
    key,
    mod: parts.includes("mod"),
    shift: parts.includes("shift"),
    alt: parts.includes("alt"),
  };
}

/**
 * Global shortcut binder. Skips key events fired inside editable elements
 * unless the combo uses a modifier — matching typical editor UX.
 */
export function useShortcut(combo: string, handler: (e: KeyboardEvent) => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const { key, mod, shift, alt } = normalizeCombo(combo);
    const listener = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inEditor =
        !!target &&
        (target.isContentEditable ||
          ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));
      const usesMod = mod || alt;
      if (inEditor && !usesMod && key !== "escape") return;
      const hasMod = e.metaKey || e.ctrlKey;
      if (e.key.toLowerCase() !== key) return;
      if (mod !== hasMod) return;
      if (shift !== e.shiftKey) return;
      if (alt !== e.altKey) return;
      handler(e);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [combo, handler, enabled]);
}

/** Human-friendly rendering of a combo, e.g. "mod+shift+z" -> "⌘⇧Z". */
export function formatShortcut(combo: string): string {
  const isMac =
    typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  const parts = combo.toLowerCase().split("+");
  const modMap: Record<string, string> = isMac
    ? { mod: "⌘", shift: "⇧", alt: "⌥" }
    : { mod: "Ctrl", shift: "Shift", alt: "Alt" };
  const keyMap: Record<string, string> = {
    arrowup: "↑",
    arrowdown: "↓",
    arrowleft: "←",
    arrowright: "→",
    escape: "Esc",
    enter: "↵",
    delete: "Del",
    backspace: "⌫",
  };
  return parts
    .map((p) => modMap[p] ?? keyMap[p] ?? p.toUpperCase())
    .join(isMac ? "" : "+");
}
