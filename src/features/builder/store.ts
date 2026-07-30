import { create } from "zustand";
import type { Block, BioContent } from "./types";
import { createEmptyBioContent, normalizeBioContent } from "./content-normalizer";
import type {
  PageTheme,
  ThemeBackground,
  ThemeButtons,
  ThemeCard,
  ThemeColors,
  ThemeMotion,
  ThemePresetId,
  ThemeProfile,
  ThemeSpacing,
  ThemeTypography,
} from "./theme";
import {
  DEFAULT_THEME,
  DEFAULT_BUTTONS,
  DEFAULT_BACKGROUND,
  DEFAULT_PROFILE,
  DEFAULT_MOTION,
  applyPresetTheme,
  normalizeTheme,
  ensureGoogleFont,
  resetColors as resetColorsFn,
  resetTypography as resetTypographyFn,
  resetSpacing as resetSpacingFn,
  resetCard as resetCardFn,
  resetButtons as resetButtonsFn,
  resetBackground as resetBackgroundFn,
  resetProfile as resetProfileFn,
  resetMotion as resetMotionFn,
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
  pageSlug: string;
  content: BioContent;
  selectedId: string | null; // primary / last selected
  selectedIds: string[];
  clipboard: Block[];
  versions: Version[];
  history: HistoryState;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;

  // lifecycle
  load: (pageId: string, name: string, content: BioContent, slug?: string) => void;
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
  patchThemeButtons: (patch: Partial<ThemeButtons>) => void;
  patchThemeBackground: (patch: Partial<ThemeBackground>) => void;
  patchThemeProfile: (patch: Partial<ThemeProfile>) => void;
  patchThemeMotion: (patch: Partial<ThemeMotion>) => void;
  addBrandColor: (hex: string) => void;
  removeBrandColor: (hex: string) => void;
  applyThemePreset: (id: ThemePresetId) => void;
  resetThemeColors: () => void;
  resetThemeTypography: () => void;
  resetThemeSpacing: () => void;
  resetThemeCard: () => void;
  resetThemeButtons: () => void;
  resetThemeBackground: () => void;
  resetThemeProfile: () => void;
  resetThemeMotion: () => void;
  resetThemeAll: () => void;
  /** Replace the theme (and optionally blocks) with a template's design. */
  applyTemplate: (theme: PageTheme, opts?: { blocks?: Block[]; replaceContent?: boolean }) => void;

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
  pageSlug: "",
  content: createEmptyBioContent(),
  selectedId: null,
  selectedIds: [],
  clipboard: [],
  versions: [],
  history: { past: [], future: [] },
  saveStatus: "idle",
  lastSavedAt: null,

  load: (pageId, pageName, content, slug) =>
    set({
      pageId,
      pageName,
      pageSlug: slug ?? "",
      content: normalizeBioContent(content),
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
      pageSlug: "",
      content: createEmptyBioContent(),
      selectedId: null,
      selectedIds: [],
      clipboard: [],
      versions: [],
      history: { past: [], future: [] },
      saveStatus: "idle",
      lastSavedAt: null,
    }),

  select: (selectedId) => set({ selectedId, selectedIds: selectedId ? [selectedId] : [] }),

  toggleSelect: (id) => {
    const { selectedIds } = get();
    const exists = selectedIds.includes(id);
    const next = exists ? selectedIds.filter((x) => x !== id) : [...selectedIds, id];
    set({ selectedIds: next, selectedId: next[next.length - 1] ?? null });
  },

  selectRange: (id) => {
    const { content, selectedId, selectedIds } = get();
    const anchor = selectedId ?? id;
    const blocks = content.blocks ?? [];
    const a = blocks.findIndex((b) => b.id === anchor);
    const b = blocks.findIndex((x) => x.id === id);
    if (a === -1 || b === -1) return;
    const [lo, hi] = a < b ? [a, b] : [b, a];
    const range = blocks.slice(lo, hi + 1).map((x) => x.id);
    const merged = Array.from(new Set([...selectedIds, ...range]));
    set({ selectedIds: merged, selectedId: id });
  },

  selectAll: () => {
    const ids = (get().content.blocks ?? []).map((b) => b.id);
    set({ selectedIds: ids, selectedId: ids[ids.length - 1] ?? null });
  },

  clearSelection: () => set({ selectedId: null, selectedIds: [] }),

  addBlock: (block) => {
    const { content, history } = get();
    const blocks = content.blocks ?? [];
    set({
      history: pushHistory(history, content),
      content: { ...content, blocks: [...blocks, block] },
      selectedId: block.id,
      selectedIds: [block.id],
      saveStatus: "dirty",
    });
  },

  insertBlock: (block, index) => {
    const { content, history } = get();
    const blocks = [...(content.blocks ?? [])];
    const i = Math.max(0, Math.min(index, blocks.length));
    blocks.splice(i, 0, block);
    set({
      history: pushHistory(history, content),
      content: { ...content, blocks },
      selectedId: block.id,
      selectedIds: [block.id],
      saveStatus: "dirty",
    });
  },

  reorderBlocks: (fromIndex, toIndex) => {
    const { content, history } = get();
    if (fromIndex === toIndex) return;
    const currentBlocks = content.blocks ?? [];
    if (fromIndex < 0 || fromIndex >= currentBlocks.length) return;
    const src = currentBlocks[fromIndex];
    if (src.locked) return;
    const blocks = [...currentBlocks];
    const [item] = blocks.splice(fromIndex, 1);
    const target = Math.max(0, Math.min(toIndex, blocks.length));
    blocks.splice(target, 0, item);
    set({
      history: pushHistory(history, content),
      content: { ...content, blocks },
      saveStatus: "dirty",
    });
  },

  updateBlock: (id, patch) => {
    const { content, history } = get();
    const blocks = content.blocks ?? [];
    const target = blocks.find((b) => b.id === id);
    if (!target || (target.locked && !("locked" in patch))) return;
    set({
      history: pushHistory(history, content),
      content: {
        ...content,
        blocks: blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)),
      },
      saveStatus: "dirty",
    });
  },

  removeBlock: (id) => {
    const { content, history, selectedIds } = get();
    const blocks = content.blocks ?? [];
    const target = blocks.find((b) => b.id === id);
    if (!target || target.locked) return;
    const nextIds = selectedIds.filter((x) => x !== id);
    set({
      history: pushHistory(history, content),
      content: { ...content, blocks: blocks.filter((b) => b.id !== id) },
      selectedId: nextIds[nextIds.length - 1] ?? null,
      selectedIds: nextIds,
      saveStatus: "dirty",
    });
  },

  removeMany: (ids) => {
    const { content, history } = get();
    const removable = new Set(
      (content.blocks ?? []).filter((b) => ids.includes(b.id) && !b.locked).map((b) => b.id),
    );
    if (removable.size === 0) return;
    set({
      history: pushHistory(history, content),
      content: { ...content, blocks: (content.blocks ?? []).filter((b) => !removable.has(b.id)) },
      selectedId: null,
      selectedIds: [],
      saveStatus: "dirty",
    });
  },

  duplicateBlock: (id) => {
    const { content, history } = get();
    const blocks = content.blocks ?? [];
    const src = blocks.find((b) => b.id === id);
    if (!src) return;
    const copy = cloneBlock(src);
    const idx = blocks.findIndex((b) => b.id === id);
    const nextBlocks = [...blocks];
    nextBlocks.splice(idx + 1, 0, copy);
    set({
      history: pushHistory(history, content),
      content: { ...content, blocks: nextBlocks },
      selectedId: copy.id,
      selectedIds: [copy.id],
      saveStatus: "dirty",
    });
  },

  duplicateMany: (ids) => {
    const { content, history } = get();
    if (ids.length === 0) return;
    const blocks = content.blocks ?? [];
    const orderedIds = blocks.filter((b) => ids.includes(b.id)).map((b) => b.id);
    if (orderedIds.length === 0) return;
    const lastIdx = blocks.findIndex((b) => b.id === orderedIds[orderedIds.length - 1]);
    const copies = orderedIds.map((id) => {
      const src = blocks.find((b) => b.id === id);
      return src ? cloneBlock(src) : null;
    }).filter((copy): copy is Block => Boolean(copy));
    const nextBlocks = [...blocks];
    nextBlocks.splice(lastIdx + 1, 0, ...copies);
    const newIds = copies.map((c) => c.id);
    set({
      history: pushHistory(history, content),
      content: { ...content, blocks: nextBlocks },
      selectedIds: newIds,
      selectedId: newIds[newIds.length - 1] ?? null,
      saveStatus: "dirty",
    });
  },

  moveBlock: (id, dir) => {
    const { content, history } = get();
    const blocks = content.blocks ?? [];
    const idx = blocks.findIndex((b) => b.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= blocks.length) return;
    const current = blocks[idx];
    if (!current || current.locked) return;
    const nextBlocks = [...blocks];
    const [item] = nextBlocks.splice(idx, 1);
    if (!item) return;
    nextBlocks.splice(target, 0, item);
    set({
      history: pushHistory(history, content),
      content: { ...content, blocks: nextBlocks },
      saveStatus: "dirty",
    });
  },

  toggleHidden: (id) => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: {
        ...content,
        blocks: (content.blocks ?? []).map((b) =>
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
        ...content,
        blocks: (content.blocks ?? []).map((b) => (ids.includes(b.id) ? ({ ...b, hidden } as Block) : b)),
      },
      saveStatus: "dirty",
    });
  },

  toggleLocked: (id) => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: {
        ...content,
        blocks: (content.blocks ?? []).map((b) =>
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
        ...content,
        blocks: (content.blocks ?? []).map((b) =>
          b.id === id ? ({ ...b, name: name.trim() || undefined } as Block) : b,
        ),
      },
      saveStatus: "dirty",
    });
  },

  copySelection: () => {
    const { content, selectedIds } = get();
    if (selectedIds.length === 0) return;
    const items = (content.blocks ?? []).filter((b) => selectedIds.includes(b.id));
    set({ clipboard: items.map((b) => structuredClone(b)) });
  },

  cutSelection: () => {
    const { content, selectedIds, history } = get();
    if (selectedIds.length === 0) return;
    const cuts = (content.blocks ?? []).filter((b) => selectedIds.includes(b.id) && !b.locked);
    if (cuts.length === 0) return;
    const cutIds = new Set(cuts.map((b) => b.id));
    set({
      clipboard: cuts.map((b) => structuredClone(b)),
      history: pushHistory(history, content),
      content: { ...content, blocks: (content.blocks ?? []).filter((b) => !cutIds.has(b.id)) },
      selectedId: null,
      selectedIds: [],
      saveStatus: "dirty",
    });
  },

  paste: () => {
    const { content, clipboard, history, selectedId } = get();
    if (clipboard.length === 0) return;
    const copies = clipboard.map((b) => cloneBlock(b));
    const blocks = content.blocks ?? [];
    const anchorIdx = selectedId
      ? blocks.findIndex((b) => b.id === selectedId)
      : blocks.length - 1;
    const insertAt = anchorIdx === -1 ? blocks.length : anchorIdx + 1;
    const nextBlocks = [...blocks];
    nextBlocks.splice(insertAt, 0, ...copies);
    const newIds = copies.map((c) => c.id);
    set({
      history: pushHistory(history, content),
      content: { ...content, blocks: nextBlocks },
      selectedIds: newIds,
      selectedId: newIds[newIds.length - 1] ?? null,
      saveStatus: "dirty",
    });
  },

  undo: () => {
    const { history, content } = get();
    if (history.past.length === 0) return;
    const past = [...history.past];
    const prev = past.pop();
    if (!prev) return;
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

  patchContactWidget: (patch) => {
    const { content, history } = get();
    const current = normalizeContactWidget(content.contactWidget);
    set({
      history: pushHistory(history, content),
      content: { ...content, contactWidget: { ...current, ...patch } },
      saveStatus: "dirty",
    });
  },
  patchContactAction: (id, patch) => {
    const { content, history } = get();
    const current = normalizeContactWidget(content.contactWidget);
    set({
      history: pushHistory(history, content),
      content: {
        ...content,
        contactWidget: {
          ...current,
          actions: current.actions.map((a) => (a.id === id ? { ...a, ...patch } : a)),
        },
      },
      saveStatus: "dirty",
    });
  },

  patchTheme: (patch) => {
    const { content, history } = get();
    const current = normalizeTheme(content.theme);
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: { ...current, ...patch } },
      saveStatus: "dirty",
    });
  },

  patchThemeColors: (patch) => {
    const { content, history } = get();
    const current = normalizeTheme(content.theme);
    set({
      history: pushHistory(history, content),
      content: {
        ...content,
        theme: { ...current, colors: { ...current.colors, ...patch }, preset: "custom" },
      },
      saveStatus: "dirty",
    });
  },
  patchThemeTypography: (patch) => {
    const { content, history } = get();
    const current = normalizeTheme(content.theme);
    set({
      history: pushHistory(history, content),
      content: {
        ...content,
        theme: { ...current, typography: { ...current.typography, ...patch }, preset: "custom" },
      },
      saveStatus: "dirty",
    });
  },
  patchThemeSpacing: (patch) => {
    const { content, history } = get();
    const current = normalizeTheme(content.theme);
    set({
      history: pushHistory(history, content),
      content: {
        ...content,
        theme: { ...current, spacing: { ...current.spacing, ...patch }, preset: "custom" },
      },
      saveStatus: "dirty",
    });
  },
  patchThemeCard: (patch) => {
    const { content, history } = get();
    const current = normalizeTheme(content.theme);
    set({
      history: pushHistory(history, content),
      content: {
        ...content,
        theme: { ...current, card: { ...current.card, ...patch }, preset: "custom" },
      },
      saveStatus: "dirty",
    });
  },
  patchThemeButtons: (patch) => {
    const { content, history } = get();
    const current = normalizeTheme(content.theme);
    const base = current.buttons ?? DEFAULT_BUTTONS;
    set({
      history: pushHistory(history, content),
      content: {
        ...content,
        theme: { ...current, buttons: { ...base, ...patch }, preset: "custom" },
      },
      saveStatus: "dirty",
    });
  },
  patchThemeBackground: (patch) => {
    const { content, history } = get();
    const current = normalizeTheme(content.theme);
    const base = current.background ?? DEFAULT_BACKGROUND;
    set({
      history: pushHistory(history, content),
      content: {
        ...content,
        theme: { ...current, background: { ...base, ...patch }, preset: "custom" },
      },
      saveStatus: "dirty",
    });
  },
  patchThemeProfile: (patch) => {
    const { content, history } = get();
    const current = normalizeTheme(content.theme);
    const base = current.profile ?? DEFAULT_PROFILE;
    set({
      history: pushHistory(history, content),
      content: {
        ...content,
        theme: { ...current, profile: { ...base, ...patch }, preset: "custom" },
      },
      saveStatus: "dirty",
    });
  },
  patchThemeMotion: (patch) => {
    const { content, history } = get();
    const current = normalizeTheme(content.theme);
    const base = current.motion ?? DEFAULT_MOTION;
    set({
      history: pushHistory(history, content),
      content: {
        ...content,
        theme: { ...current, motion: { ...base, ...patch }, preset: "custom" },
      },
      saveStatus: "dirty",
    });
  },
  addBrandColor: (hex) => {
    const { content } = get();
    const current = normalizeTheme(content.theme);
    const list = current.brandColors ?? [];
    if (list.includes(hex)) return;
    set({
      content: { ...content, theme: { ...current, brandColors: [...list, hex] } },
      saveStatus: "dirty",
    });
  },
  removeBrandColor: (hex) => {
    const { content } = get();
    const current = content.theme ?? DEFAULT_THEME;
    const list = (current.brandColors ?? []).filter((c) => c !== hex);
    set({
      content: { ...content, theme: { ...current, brandColors: list } },
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
      content: { ...content, theme: resetColorsFn(normalizeTheme(content.theme)) },
      saveStatus: "dirty",
    });
  },
  resetThemeTypography: () => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: resetTypographyFn(normalizeTheme(content.theme)) },
      saveStatus: "dirty",
    });
  },
  resetThemeSpacing: () => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: resetSpacingFn(normalizeTheme(content.theme)) },
      saveStatus: "dirty",
    });
  },
  resetThemeCard: () => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: resetCardFn(normalizeTheme(content.theme)) },
      saveStatus: "dirty",
    });
  },
  resetThemeButtons: () => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: resetButtonsFn(normalizeTheme(content.theme)) },
      saveStatus: "dirty",
    });
  },
  resetThemeBackground: () => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: resetBackgroundFn(normalizeTheme(content.theme)) },
      saveStatus: "dirty",
    });
  },
  resetThemeProfile: () => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: resetProfileFn(normalizeTheme(content.theme)) },
      saveStatus: "dirty",
    });
  },
  resetThemeMotion: () => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: resetMotionFn(normalizeTheme(content.theme)) },
      saveStatus: "dirty",
    });
  },
  resetThemeAll: () => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { ...content, theme: normalizeTheme(DEFAULT_THEME) },
      saveStatus: "dirty",
    });
  },
  applyTemplate: (theme, opts) => {
    const { content, history } = get();
    // Fully hydrate the incoming template theme so every token
    // (colors, typography, buttons, background, motion, profile…)
    // is present before we hand it to the renderer. Guarantees the
    // card-apply and preview-apply paths produce identical results.
    const nextTheme = normalizeTheme(theme);
    // Preload any Google Fonts declared by the template so the
    // typography renders immediately without a black/white flash.
    if (typeof window !== "undefined") {
      for (const family of nextTheme.googleFonts ?? []) ensureGoogleFont(family);
    }
    const blocks = opts?.replaceContent
      ? (opts.blocks ?? []).map((b) => structuredClone(b))
      : (content.blocks ?? []);
    set({
      history: pushHistory(history, content),
      content: normalizeBioContent({ ...content, blocks, theme: nextTheme }),
      selectedId: null,
      selectedIds: [],
      saveStatus: "dirty",
    });
  },

  markSaving: () => set({ saveStatus: "saving" }),
  markSaved: () => set({ saveStatus: "saved", lastSavedAt: Date.now() }),
  markError: () => set({ saveStatus: "error" }),
}));

export function selectedBlock(state: BuilderState): Block | null {
  if (!state.selectedId) return null;
  return (state.content.blocks ?? []).find((b) => b.id === state.selectedId) ?? null;
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
