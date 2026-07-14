import { useEffect } from "react";
import { useBuilderStore } from "./store";

/**
 * Global keyboard shortcuts for the builder editor.
 * Bindings:
 *  - mod+z / mod+shift+z : undo / redo
 *  - mod+c / mod+x / mod+v : copy / cut / paste
 *  - mod+d : duplicate selection
 *  - mod+a : select all blocks
 *  - Delete / Backspace : remove selection
 *  - ArrowUp / ArrowDown (alt) : move primary block
 *  - Escape : clear selection
 */
export function useBuilderShortcuts(enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target) {
        const tag = target.tagName;
        if (
          target.isContentEditable ||
          tag === "INPUT" ||
          tag === "TEXTAREA" ||
          tag === "SELECT"
        ) {
          // still allow undo/redo/save globally
          const mod = e.metaKey || e.ctrlKey;
          const isUndo = mod && !e.shiftKey && e.key.toLowerCase() === "z";
          const isRedo =
            mod &&
            ((e.shiftKey && e.key.toLowerCase() === "z") || e.key.toLowerCase() === "y");
          if (!isUndo && !isRedo) return;
        }
      }
      const mod = e.metaKey || e.ctrlKey;
      const state = useBuilderStore.getState();
      const key = e.key.toLowerCase();

      // undo / redo
      if (mod && !e.shiftKey && key === "z") {
        e.preventDefault();
        state.undo();
        return;
      }
      if (mod && ((e.shiftKey && key === "z") || key === "y")) {
        e.preventDefault();
        state.redo();
        return;
      }

      // clipboard
      if (mod && key === "c") {
        if (state.selectedIds.length === 0) return;
        e.preventDefault();
        state.copySelection();
        return;
      }
      if (mod && key === "x") {
        if (state.selectedIds.length === 0) return;
        e.preventDefault();
        state.cutSelection();
        return;
      }
      if (mod && key === "v") {
        if (state.clipboard.length === 0) return;
        e.preventDefault();
        state.paste();
        return;
      }
      if (mod && key === "d") {
        if (state.selectedIds.length === 0) return;
        e.preventDefault();
        state.duplicateMany(state.selectedIds);
        return;
      }
      if (mod && key === "a") {
        if (state.content.blocks.length === 0) return;
        e.preventDefault();
        state.selectAll();
        return;
      }

      // delete
      if (!mod && (key === "delete" || key === "backspace")) {
        if (state.selectedIds.length === 0) return;
        e.preventDefault();
        state.removeMany(state.selectedIds);
        return;
      }

      // move
      if (e.altKey && (key === "arrowup" || key === "arrowdown")) {
        if (!state.selectedId) return;
        e.preventDefault();
        state.moveBlock(state.selectedId, key === "arrowup" ? -1 : 1);
        return;
      }

      // escape
      if (key === "escape") {
        if (state.selectedIds.length === 0) return;
        state.clearSelection();
        return;
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
