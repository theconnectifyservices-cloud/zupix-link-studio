import { create } from "zustand";
import type { Block, BioContent } from "./types";
import { EMPTY_CONTENT } from "./types";

export type SaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

interface HistoryState {
  past: BioContent[];
  future: BioContent[];
}

interface BuilderState {
  pageId: string | null;
  pageName: string;
  content: BioContent;
  selectedId: string | null;
  history: HistoryState;
  saveStatus: SaveStatus;
  lastSavedAt: number | null;

  // lifecycle
  load: (pageId: string, name: string, content: BioContent) => void;
  reset: () => void;

  // selection
  select: (id: string | null) => void;

  // mutations (record history)
  addBlock: (block: Block) => void;
  updateBlock: (id: string, patch: Partial<Block>) => void;
  removeBlock: (id: string) => void;
  duplicateBlock: (id: string) => void;
  moveBlock: (id: string, dir: -1 | 1) => void;
  toggleHidden: (id: string) => void;
  renameBlock: (id: string, name: string) => void;

  // history
  undo: () => void;
  redo: () => void;

  // save wiring
  markSaving: () => void;
  markSaved: () => void;
  markError: () => void;
}

const HISTORY_LIMIT = 50;

function pushHistory(prev: HistoryState, snapshot: BioContent): HistoryState {
  const past = [...prev.past, snapshot];
  if (past.length > HISTORY_LIMIT) past.shift();
  return { past, future: [] };
}

export const useBuilderStore = create<BuilderState>((set, get) => ({
  pageId: null,
  pageName: "",
  content: EMPTY_CONTENT,
  selectedId: null,
  history: { past: [], future: [] },
  saveStatus: "idle",
  lastSavedAt: null,

  load: (pageId, pageName, content) =>
    set({
      pageId,
      pageName,
      content: content ?? EMPTY_CONTENT,
      selectedId: null,
      history: { past: [], future: [] },
      saveStatus: "saved",
      lastSavedAt: Date.now(),
    }),

  reset: () =>
    set({
      pageId: null,
      pageName: "",
      content: EMPTY_CONTENT,
      selectedId: null,
      history: { past: [], future: [] },
      saveStatus: "idle",
      lastSavedAt: null,
    }),

  select: (selectedId) => set({ selectedId }),

  addBlock: (block) => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: { blocks: [...content.blocks, block] },
      selectedId: block.id,
      saveStatus: "dirty",
    });
  },

  updateBlock: (id, patch) => {
    const { content, history } = get();
    set({
      history: pushHistory(history, content),
      content: {
        blocks: content.blocks.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)),
      },
      saveStatus: "dirty",
    });
  },

  removeBlock: (id) => {
    const { content, history, selectedId } = get();
    set({
      history: pushHistory(history, content),
      content: { blocks: content.blocks.filter((b) => b.id !== id) },
      selectedId: selectedId === id ? null : selectedId,
      saveStatus: "dirty",
    });
  },

  duplicateBlock: (id) => {
    const { content, history } = get();
    const src = content.blocks.find((b) => b.id === id);
    if (!src) return;
    const copy: Block = {
      ...src,
      id: Math.random().toString(36).slice(2, 12),
    };
    const idx = content.blocks.findIndex((b) => b.id === id);
    const blocks = [...content.blocks];
    blocks.splice(idx + 1, 0, copy);
    set({
      history: pushHistory(history, content),
      content: { blocks },
      selectedId: copy.id,
      saveStatus: "dirty",
    });
  },

  moveBlock: (id, dir) => {
    const { content, history } = get();
    const idx = content.blocks.findIndex((b) => b.id === id);
    const target = idx + dir;
    if (idx < 0 || target < 0 || target >= content.blocks.length) return;
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

  markSaving: () => set({ saveStatus: "saving" }),
  markSaved: () => set({ saveStatus: "saved", lastSavedAt: Date.now() }),
  markError: () => set({ saveStatus: "error" }),
}));

export function selectedBlock(state: BuilderState): Block | null {
  if (!state.selectedId) return null;
  return state.content.blocks.find((b) => b.id === state.selectedId) ?? null;
}
