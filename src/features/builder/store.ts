import { create } from "zustand";
import type { Block, BioContent } from "./types";
import { EMPTY_CONTENT } from "./types";
import type {
  PageTheme, ThemeBackground, ThemeButtons, ThemeCard, ThemeColors,
  ThemePresetId, ThemeProfile, ThemeSpacing, ThemeTypography,
} from "./theme";
import {
  DEFAULT_THEME, applyPresetTheme, resetColors as resetColorsFn,
  resetTypography as resetTypographyFn, resetSpacing as resetSpacingFn,
  resetCard as resetCardFn, resetButtons as resetButtonsFn,
  resetBackground as resetBackgroundFn, resetProfile as resetProfileFn,
} from "./theme";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface HistoryState {
  past: BioContent[];
  future: BioContent[];
}

export interface Version {
  id: string;
  label: string;
  at: number;
  content: BioContent;
}

interface BuilderState {
  pageId: string | null;
  pageName: string;
  content: BioContent;
  selectedId: string | null; // primary / last selected
  selectedIds: string[];
  clipboard: Block[];
  versions: Version[];
  history: HistoryState;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;

  // lifecycle
  load: (pageId: string, name: string, content: BioContent) => void;
  reset: () => void;

  // selection
  select: (id: string | null) => void;
  toggleSelect: (id: string) => void;
  selectRange: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // mutations (record history)
  addBlock: (block: Block) => void;
  insertBlock: (block: Block, index: number) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  removeMany: (ids: string[]) => void;
  duplicateBlock: (id: string) => void;
  duplicateMany: (ids: string[]) => void;
  moveBlock: (id: string, dir: -1 | 1) => void;
  toggleHidden: (id: string) => void;
  hideMany: (ids: string[], hidden: boolean) => void;
  toggleLocked: (id: string) => void;
  renameBlock: (id: string, name: string) => void;

  // clipboard
  copySelection: () => void;
  cutSelection: () => void;
  paste: () => void;

  // history (undo/redo)
  undo: () => void;
  redo: () => void;

  // version history
  snapshotVersion: (label?: string) => void;
  restoreVersion: (versionId: string) => void;
  deleteVersion: (versionId: string) => void;

  // theme
  patchTheme: (patch: Partial<PageTheme>) => void;
  patchThemeColors: (patch: Partial<ThemeColors>) => void;
  patchThemeTypography: (patch: Partial<ThemeTypography>) => void;
  patchThemeSpacing: (patch: Partial<ThemeSpacing>) => void;
  patchThemeCard: (patch: Partial<ThemeCard>) => void;
  applyThemePreset: (id: ThemePresetId) => void;
  resetThemeColors: () => void;
  resetThemeTypography: () => void;
  resetThemeSpacing: () => void;
  resetThemeCard: () => void;
  resetThemeAll: () => void;

  // save wiring
  markSaving: () => void;
  markSaved: () => void;
  markError: () => void;
}

const HISTORY_LIMIT = 50;
const VERSION_LIMIT = 20;

function newId() {
  return Math.random().toString(36).slice(2, 12);
}

function pushHistory(prev: HistoryState, snapshot: BioContent): HistoryState {
  const past = [...prev.past, snapshot];
  if (past.length > HISTORY_LIMIT) past.shift();
  return { past, future: [] };
}

function cloneBlock(b: Block): Block {
  return { ...structuredClone(b), id: newId() } as Block;
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  pageId: null,
  pageName: "",
  content: EMPTY_CONTENT,
  selectedId: null,
  selectedIds: [],
  clipboard: [],
  versions: [],
  history: { past: [], future: [] },
  saveStatus: "idle",
  lastSavedAt: null,

  load: (pageId, pageName, content) =>
    set({
      pageId,
      pageName,
      content: content ?? EMPTY_CONTENT,
      selectedId: null,
      selectedIds: [],
      history: { past: [], future: [] },
      versions: loadVersionsFromStorage(pageId),
      saveStatus: "saved",
      lastSavedAt: Date.now(),
    }),

  reset: () =>
    set({
      pageId: null,
      pageName: "",
      content: EMPTY_CONTENT,
      selectedId: null,
      selectedIds: [],
      clipboard: [],
      versions: [],
      history: { past: [], future: [] },
      saveStatus: "idle",
      lastSavedAt: null,
    }),

  select: (selectedId) =>
    set({ selectedId, selectedIds: selectedId ? [selectedId] : [] }),

  toggleSelect: (id) => {
    const { selectedIds } = get();
    const exists = selectedIds.includes(id);
    const next = exists ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    set({ selectedIds: next, selectedId: next[next.length - 1] ?? null });
  },

  selectRange: (id) => {
    const { content, selectedId, selectedIds } = get();
    const anchor = selectedId ?? id;
    const a = content.blocks.findIndex((b) => b.id === anchor);
    const b = content.blocks.findIndex((x) => x.id === id);
    if (a === -1 || b === -1) return;
    const [lo, hi] = a < b ? [a, b] : [b, a];
    const range = content.blocks.slice(lo, hi + 1).map((x) => x.id);
    const merged = Array.from(new Set([...selectedIds, ...range]));
    set({ selectedIds: merged, selectedId: id });
  },

  selectAll: () => {
    const ids = get().content.blocks.map((b) => b.id);
    set({ selectedIds: ids, selectedId: ids[ids.length - 1] ?? null });
  },

  clearSelection: () => set({ selectedId: null, selectedIds: [] }),

  addBlock: (block) => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { blocks: [...content.blocks, block] },
      selectedId: block.id,
      selectedIds: [block.id],
      saveStatus: "dirty",
    });
  },

  insertBlock: (block, index) => {
    const { content, history } = get();
    const blocks = [...content.blocks];
    const i = Math.max(0, Math.min(index, blocks.length));
    blocks.splice(i, 0, block);
    set({
      history: pushHistory(history, content),
      content: { blocks },
      selectedId: block.id,
      selectedIds: [block.id],
      saveStatus: "dirty",
    });
  },

  reorderBlocks: (fromIndex, toIndex) => {
    const { content, history } = get();
    if (fromIndex === toIndex) return;
    if (fromIndex < 0 || fromIndex >= content.blocks.length) return;
    const src = content.blocks[fromIndex];
    if (src.locked) return;
    const blocks = [...content.blocks];
    const [item] = blocks.splice(fromIndex, 1);
    const target = Math.max(0, Math.min(toIndex, blocks.length));
    blocks.splice(target, 0, item);
    set({
      history: pushHistory(history, content),
      content: { blocks },
      saveStatus: "dirty",
    });
  },

  updateBlock: (id, patch) => {
    const { content, history } = get();
    const target = content.blocks.find((b) => b.id === id);
    if (!target || (target.locked && !("locked" in patch))) return;
    set({
      history: pushHistory(history, content),
      content: {
        blocks: content.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)),
      },
      saveStatus: "dirty",
    });
  },

  removeBlock: (id) => {
    const { content, history, selectedIds } = get();
    const target = content.blocks.find((b) => b.id === id);
    if (!target || target.locked) return;
    const nextIds = selectedIds.filter((x) => x !== id);
    set({
      history: pushHistory(history, content),
      content: { blocks: content.blocks.filter((b) => b.id !== id) },
      selectedId: nextIds[nextIds.length - 1] ?? null,
      selectedIds: nextIds,
      saveStatus: "dirty",
    });
  },

  removeMany: (ids) => {
    const { content, history } = get();
    const removable = new Set(
      content.blocks.filter((b) => ids.includes(b.id) && !b.locked).map((b) => b.id),
    );
    if (removable.size === 0) return;
    set({
      history: pushHistory(history, content),
      content: { blocks: content.blocks.filter((b) => !removable.has(b.id)) },
      selectedId: null,
      selectedIds: [],
      saveStatus: "dirty",
    });
  },

  duplicateBlock: (id) => {
    const { content, history } = get();
    const src = content.blocks.find((b) => b.id === id);
    if (!src) return;
    const copy = cloneBlock(src);
    const idx = content.blocks.findIndex((b) => b.id === id);
    const blocks = [...content.blocks];
    blocks.splice(idx + 1, 0, copy);
    set({
      history: pushHistory(history, content),
      content: { blocks },
      selectedId: copy.id,
      selectedIds: [copy.id],
      saveStatus: "dirty",
    });
  },

  duplicateMany: (ids) => {
    const { content, history } = get();
    if (ids.length === 0) return;
    const orderedIds = content.blocks.filter((b) => ids.includes(b.id)).map((b) => b.id);
    if (orderedIds.length === 0) return;
    const lastIdx = content.blocks.findIndex((b) => b.id === orderedIds[orderedIds.length - 1]);
    const copies = orderedIds.map((id) => {
      const src = content.blocks.find((b) => b.id === id)!;
      return cloneBlock(src);
    });
    const blocks = [...content.blocks];
    blocks.splice(lastIdx + 1, 0, ...copies);
    const newIds = copies.map((c) => c.id);
    set({
      history: pushHistory(history, content),
      content: { blocks },
      selectedIds: newIds,
      selectedId: newIds[newIds.length - 1] ?? null,
      saveStatus: "dirty",
    });
  },

  moveBlock: (id, dir) => {
    const { content, history } = get();
    const idx = content.blocks.findIndex((b) => b.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= content.blocks.length) return;
    if (content.blocks[idx].locked) return;
    const blocks = [...content.blocks];
    const [item] = blocks.splice(idx, 1);
    blocks.splice(target, 0, item);
    set({
      history: pushHistory(history, content),
      content: { blocks },
      saveStatus: "dirty",
    });
  },

  toggleHidden: (id) => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: {
        blocks: content.blocks.map((b) =>
          b.id === id ? ({ ...b, hidden: !b.hidden } as Block) : b,
        ),
      },
      saveStatus: "dirty",
    });
  },

  hideMany: (ids, hidden) => {
    const { content, history } = get();
    if (ids.length === 0) return;
    set({
      history: pushHistory(history, content),
      content: {
        blocks: content.blocks.map((b) =>
          ids.includes(b.id) ? ({ ...b, hidden } as Block) : b,
        ),
      },
      saveStatus: "dirty",
    });
  },

  toggleLocked: (id) => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: {
        blocks: content.blocks.map((b) =>
          b.id === id ? ({ ...b, locked: !b.locked } as Block) : b,
        ),
      },
      saveStatus: "dirty",
    });
  },

  renameBlock: (id, name) => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: {
        blocks: content.blocks.map((b) =>
          b.id === id ? ({ ...b, name: name.trim() || undefined } as Block) : b,
        ),
      },
      saveStatus: "dirty",
    });
  },

  copySelection: () => {
    const { content, selectedIds } = get();
    if (selectedIds.length === 0) return;
    const items = content.blocks.filter((b) => selectedIds.includes(b.id));
    set({ clipboard: items.map((b) => structuredClone(b)) });
  },

  cutSelection: () => {
    const { content, selectedIds, history } = get();
    if (selectedIds.length === 0) return;
    const cuts = content.blocks.filter((b) => selectedIds.includes(b.id) && !b.locked);
    if (cuts.length === 0) return;
    const cutIds = new Set(cuts.map((b) => b.id));
    set({
      clipboard: cuts.map((b) => structuredClone(b)),
      history: pushHistory(history, content),
      content: { blocks: content.blocks.filter((b) => !cutIds.has(b.id)) },
      selectedId: null,
      selectedIds: [],
      saveStatus: "dirty",
    });
  },

  paste: () => {
    const { content, clipboard, history, selectedId } = get();
    if (clipboard.length === 0) return;
    const copies = clipboard.map((b) => cloneBlock(b));
    const anchorIdx = selectedId
      ? content.blocks.findIndex((b) => b.id === selectedId)
      : content.blocks.length - 1;
    const insertAt = anchorIdx === -1 ? content.blocks.length : anchorIdx + 1;
    const blocks = [...content.blocks];
    blocks.splice(insertAt, 0, ...copies);
    const newIds = copies.map((c) => c.id);
    set({
      history: pushHistory(history, content),
      content: { blocks },
      selectedIds: newIds,
      selectedId: newIds[newIds.length - 1] ?? null,
      saveStatus: "dirty",
    });
  },

  undo: () => {
    const { history, content } = get();
    if (history.past.length === 0) return;
    const past = [...history.past];
    const prev = past.pop()!;
    set({
      content: prev,
      history: { past, future: [content, ...history.future] },
      saveStatus: "dirty",
    });
  },

  redo: () => {
    const { history, content } = get();
    if (history.future.length === 0) return;
    const [next, ...rest] = history.future;
    set({
      content: next,
      history: { past: [...history.past, content], future: rest },
      saveStatus: "dirty",
    });
  },

  snapshotVersion: (label) => {
    const { versions, content, pageId } = get();
    const v: Version = {
      id: newId(),
      label: label?.trim() || `Version ${versions.length + 1}`,
      at: Date.now(),
      content: structuredClone(content),
    };
    const next = [v, ...versions].slice(0, VERSION_LIMIT);
    set({ versions: next });
    if (pageId) saveVersionsToStorage(pageId, next);
  },

  restoreVersion: (versionId) => {
    const { versions, content, history } = get();
    const v = versions.find((x) => x.id === versionId);
    if (!v) return;
    set({
      history: pushHistory(history, content),
      content: structuredClone(v.content),
      selectedId: null,
      selectedIds: [],
      saveStatus: "dirty",
    });
  },

  deleteVersion: (versionId) => {
    const { versions, pageId } = get();
    const next = versions.filter((v) => v.id !== versionId);
    set({ versions: next });
    if (pageId) saveVersionsToStorage(pageId, next);
  },

  patchTheme: (patch) => {
    const { content, history } = get();
    const current = content.theme ?? DEFAULT_THEME;
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: { ...current, ...patch } },
      saveStatus: "dirty",
    });
  },
  patchThemeColors: (patch) => {
    const { content, history } = get();
    const current = content.theme ?? DEFAULT_THEME;
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: { ...current, colors: { ...current.colors, ...patch }, preset: "custom" } },
      saveStatus: "dirty",
    });
  },
  patchThemeTypography: (patch) => {
    const { content, history } = get();
    const current = content.theme ?? DEFAULT_THEME;
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: { ...current, typography: { ...current.typography, ...patch }, preset: "custom" } },
      saveStatus: "dirty",
    });
  },
  patchThemeSpacing: (patch) => {
    const { content, history } = get();
    const current = content.theme ?? DEFAULT_THEME;
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: { ...current, spacing: { ...current.spacing, ...patch }, preset: "custom" } },
      saveStatus: "dirty",
    });
  },
  patchThemeCard: (patch) => {
    const { content, history } = get();
    const current = content.theme ?? DEFAULT_THEME;
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: { ...current, card: { ...current.card, ...patch }, preset: "custom" } },
      saveStatus: "dirty",
    });
  },
  applyThemePreset: (id) => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: applyPresetTheme(id) },
      saveStatus: "dirty",
    });
  },
  resetThemeColors: () => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: resetColorsFn(content.theme ?? DEFAULT_THEME) },
      saveStatus: "dirty",
    });
  },
  resetThemeTypography: () => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: resetTypographyFn(content.theme ?? DEFAULT_THEME) },
      saveStatus: "dirty",
    });
  },
  resetThemeSpacing: () => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: resetSpacingFn(content.theme ?? DEFAULT_THEME) },
      saveStatus: "dirty",
    });
  },
  resetThemeCard: () => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: resetCardFn(content.theme ?? DEFAULT_THEME) },
      saveStatus: "dirty",
    });
  },
  resetThemeAll: () => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: { ...DEFAULT_THEME } },
      saveStatus: "dirty",
    });
  },

  markSaving: () => set({ saveStatus: "saving" }),
  markSaved: () => set({ saveStatus: "saved", lastSavedAt: Date.now() }),
  markError: () => set({ saveStatus: "error" }),
}));

export function selectedBlock(state: BuilderState): Block | null {
  if (!state.selectedId) return null;
  return state.content.blocks.find((b) => b.id === state.selectedId) ?? null;
}

// ---- version persistence ----
function versionsKey(pageId: string) {
  return `zupix:versions:${pageId}`;
}

function loadVersionsFromStorage(pageId: string): Version[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(versionsKey(pageId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Version[];
    return Array.isArray(parsed) ? parsed.slice(0, VERSION_LIMIT) : [];
  } catch {
    return [];
  }
}

function saveVersionsToStorage(pageId: string, versions: Version[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(versionsKey(pageId), JSON.stringify(versions));
  } catch {
    /* ignore quota errors */
  }
}
