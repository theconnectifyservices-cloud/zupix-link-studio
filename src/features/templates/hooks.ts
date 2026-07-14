/**
 * Small hooks that surface local template state (custom list,
 * favorites, recent). They intentionally re-read on mount rather than
 * synchronizing across tabs — the volumes are tiny and this keeps
 * the surface simple.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  deleteCustomTemplate,
  loadCustomTemplates,
  loadFavorites,
  loadRecent,
  newTemplateId,
  pushRecent,
  saveCustomTemplates,
  toggleFavorite,
  upsertCustomTemplate,
} from "./storage";
import type { Template } from "./types";
import { BUILTIN_TEMPLATES } from "./catalog";

export function useCustomTemplates() {
  const [list, setList] = useState<Template[]>([]);
  useEffect(() => setList(loadCustomTemplates()), []);

  const create = useCallback(
    (partial: Omit<Template, "id" | "version" | "isCustom" | "createdAt" | "updatedAt">) => {
      const now = Date.now();
      const t: Template = {
        id: newTemplateId(),
        version: 1,
        isCustom: true,
        createdAt: now,
        updatedAt: now,
        ...partial,
      };
      setList(upsertCustomTemplate(t));
      return t;
    },
    [],
  );

  const update = useCallback((id: string, patch: Partial<Template>) => {
    const cur = loadCustomTemplates().find((x) => x.id === id);
    if (!cur) return;
    const next: Template = { ...cur, ...patch, id, updatedAt: Date.now() };
    setList(upsertCustomTemplate(next));
  }, []);

  const remove = useCallback((id: string) => {
    setList(deleteCustomTemplate(id));
  }, []);

  const importTemplate = useCallback((raw: unknown): Template | null => {
    const t = parseTemplate(raw);
    if (!t) return null;
    const now = Date.now();
    const dup: Template = {
      ...t,
      id: newTemplateId(),
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };
    setList(upsertCustomTemplate(dup));
    return dup;
  }, []);

  const reload = useCallback(() => setList(loadCustomTemplates()), []);
  const replaceAll = useCallback((next: Template[]) => {
    saveCustomTemplates(next);
    setList(next);
  }, []);

  return { list, create, update, remove, importTemplate, reload, replaceAll };
}

export function useFavorites() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => setIds(loadFavorites()), []);
  const toggle = useCallback((id: string) => setIds(toggleFavorite(id)), []);
  const has = useCallback((id: string) => ids.includes(id), [ids]);
  return { ids, toggle, has };
}

export function useRecent() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => setIds(loadRecent()), []);
  const record = useCallback((id: string) => setIds(pushRecent(id)), []);
  return { ids, record };
}

export function useAllTemplates() {
  const { list: custom, reload, remove, importTemplate, create, update } = useCustomTemplates();
  const all = useMemo<Template[]>(() => [...custom, ...BUILTIN_TEMPLATES], [custom]);
  return {
    all,
    custom,
    builtin: BUILTIN_TEMPLATES,
    reload,
    remove,
    importTemplate,
    create,
    update,
  };
}

/**
 * Best-effort validation of a JSON blob against the Template shape.
 * Returns `null` if the file isn't a plausible template.
 */
export function parseTemplate(raw: unknown): Template | null {
  if (!raw || typeof raw !== "object") return null;
  const t = raw as Partial<Template> & Record<string, unknown>;
  if (typeof t.name !== "string" || !t.theme || typeof t.theme !== "object") return null;
  if (t.version && t.version !== 1) return null;
  return {
    id: typeof t.id === "string" ? t.id : "",
    version: 1,
    name: t.name,
    description: typeof t.description === "string" ? t.description : undefined,
    category: (typeof t.category === "string" ? t.category : "modern") as Template["category"],
    tags: Array.isArray(t.tags)
      ? (t.tags as string[]).filter((x) => typeof x === "string")
      : undefined,
    style: (typeof t.style === "string" ? t.style : undefined) as Template["style"],
    isPremium: !!t.isPremium,
    isCustom: true,
    theme: t.theme as Template["theme"],
    blocks: Array.isArray(t.blocks) ? (t.blocks as Template["blocks"]) : undefined,
  };
}

export function exportTemplateFile(t: Template) {
  const blob = new Blob([JSON.stringify(t, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(t.name || t.id)}.zupix-template.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "template"
  );
}
