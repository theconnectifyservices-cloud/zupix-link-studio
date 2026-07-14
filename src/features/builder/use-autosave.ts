import { useEffect, useRef } from "react";
import { useBuilderStore } from "./store";
import { saveBuilderContent } from "./api";
import type { BioContent } from "./types";

const DRAFT_PREFIX = "zupix:draft:";
export function draftKey(pageId: string) {
  return `${DRAFT_PREFIX}${pageId}`;
}

export interface RecoveredDraft {
  content: BioContent;
  at: number;
}

export function getRecoveredDraft(pageId: string): RecoveredDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(draftKey(pageId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RecoveredDraft;
    return parsed && parsed.content ? parsed : null;
  } catch {
    return null;
  }
}

export function clearRecoveredDraft(pageId: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(draftKey(pageId));
  } catch {
    /* ignore */
  }
}

/**
 * Debounced autosave. Watches builder store's `content` and pushes to
 * the server 800ms after the last edit. Also persists a local draft
 * for crash / offline recovery.
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

    // persist local draft immediately for crash recovery
    try {
      window.localStorage.setItem(
        draftKey(pageId),
        JSON.stringify({ content, at: Date.now() } satisfies RecoveredDraft),
      );
    } catch {
      /* ignore quota errors */
    }

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      markSaving();
      try {
        await saveBuilderContent(pageId, content);
        markSaved();
        clearRecoveredDraft(pageId);
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

