import { useState } from "react";
import { toast } from "sonner";
import { useBuilderStore } from "./store";
import { saveBuilderContent } from "./api";

/**
 * Shared save handler for the Properties panel header.
 * - `canSave` is true when there are unsaved edits.
 * - `save()` persists to server and shows a toast.
 */
export function usePropertySave() {
  const pageId = useBuilderStore((s) => s.pageId);
  const status = useBuilderStore((s) => s.saveStatus);
  const content = useBuilderStore((s) => s.content);
  const markSaving = useBuilderStore((s) => s.markSaving);
  const markSaved = useBuilderStore((s) => s.markSaved);
  const markError = useBuilderStore((s) => s.markError);
  const [saving, setSaving] = useState(false);

  const isDirty = status === "dirty" || status === "error";
  const canSave = !!pageId && isDirty && !saving;

  async function save(): Promise<boolean> {
    if (!pageId || saving) return false;
    setSaving(true);
    markSaving();
    try {
      await saveBuilderContent(pageId, content);
      markSaved();
      toast.success("Changes saved");
      return true;
    } catch {
      markError();
      toast.error("Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { canSave, save, saving: saving || status === "saving", isDirty };
}
