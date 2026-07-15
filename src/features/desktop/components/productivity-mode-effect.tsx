import { useEffect } from "react";
import { useWorkspaceLayout } from "../workspace-layout.store";

/**
 * Applies data attributes on <html> so CSS can react to productivity modes
 * (compact spacing, dense tables, focus chrome hiding).
 */
export function ProductivityModeEffect() {
  const mode = useWorkspaceLayout((s) => s.mode);
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.mode = mode;
    return () => {
      delete document.documentElement.dataset.mode;
    };
  }, [mode]);
  return null;
}
