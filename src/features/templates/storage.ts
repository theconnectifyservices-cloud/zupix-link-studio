/**
 * Local persistence for user templates, favorites and recently-used
 * template ids. Everything is scoped to `localStorage` for LS-07D; a
 * later phase can promote these to a database table with the same
 * shape.
 */

import type { Template } from "./types";

const K_CUSTOM = "zupix:templates:custom";
const K_FAVES = "zupix:templates:favorites";
const K_RECENT = "zupix:templates:recent";
const RECENT_LIMIT = 12;

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota — ignore */
  }
}

// ── Custom templates ────────────────────────────────────────────────
export function loadCustomTemplates(): Template[] {
  const list = readJSON<Template[]>(K_CUSTOM, []);
  return Array.isArray(list) ? list : [];
}
export function saveCustomTemplates(list: Template[]) {
  writeJSON(K_CUSTOM, list);
}
export function upsertCustomTemplate(t: Template): Template[] {
  const list = loadCustomTemplates();
  const i = list.findIndex((x) => x.id === t.id);
  const next = i === -1 ? [t, ...list] : list.map((x) => (x.id === t.id ? t : x));
  saveCustomTemplates(next);
  return next;
}
export function deleteCustomTemplate(id: string): Template[] {
  const next = loadCustomTemplates().filter((x) => x.id !== id);
  saveCustomTemplates(next);
  return next;
}

// ── Favorites ───────────────────────────────────────────────────────
export function loadFavorites(): string[] {
  const list = readJSON<string[]>(K_FAVES, []);
  return Array.isArray(list) ? list : [];
}
export function toggleFavorite(id: string): string[] {
  const cur = loadFavorites();
  const next = cur.includes(id) ? cur.filter((x) => x !== id) : [id, ...cur];
  writeJSON(K_FAVES, next);
  return next;
}

// ── Recently used ───────────────────────────────────────────────────
export function loadRecent(): string[] {
  const list = readJSON<string[]>(K_RECENT, []);
  return Array.isArray(list) ? list : [];
}
export function pushRecent(id: string): string[] {
  const cur = loadRecent().filter((x) => x !== id);
  const next = [id, ...cur].slice(0, RECENT_LIMIT);
  writeJSON(K_RECENT, next);
  return next;
}

// ── Id generator ────────────────────────────────────────────────────
export function newTemplateId(): string {
  return `tpl_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}
