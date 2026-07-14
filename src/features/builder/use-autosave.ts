import { useEffect, useRef } from "react";
import { useBuilderStore } from "./store";
import { saveBuilderContent } from "./api";

/**
 * Debounced autosave. Watches builder store's `content` and pushes to
 * the server 800ms after the last edit. Silent on success.
 */
export function useAutoSave(pageId: string | null) {
  const content = useBuilderStore((s) => s.content);
  const status = useBuilderStore((s) => s.saveStatus);
  const markSaving = useBuilderStore((s) => s.markSaving);
  const markSaved = useBuilderStore((s) => s.markSaved);
  const markError = useBuilderStore((s) => s.markError);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (!pageId) return;
    if (first.current) {
      first.current = false;
      return;
    }
    if (status !== "dirty") return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      markSaving();
      try {
        await saveBuilderContent(pageId, content);
        markSaved();
      } catch (e) {
        console.error("Autosave failed", e);
        markError();
      }
    }, 800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [content, status, pageId, markSaving, markSaved, markError]);

  // warn on unload if unsaved
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (status === "dirty" || status === "saving") {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [status]);
}
