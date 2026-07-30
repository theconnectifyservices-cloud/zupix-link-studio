/**
 * Per-element typography system.
 *
 * Every text-based block can override the global theme font through
 * `settings.fontFamily` (or a field-level `*FontFamily` property).
 * Resolution priority at render time:
 *
 *   element font  →  theme font  →  system default
 *
 * Values are stored as full CSS font stacks so they render even before the
 * Google font finishes loading.
 */
import { GOOGLE_FONTS, extractFontFamilies } from "./theme";

export interface FontOption {
  label: string;
  /** Full CSS font stack persisted on the block. */
  value: string;
  /** Google family name to preload, when applicable. */
  google?: string;
}

const SANS = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace';

const SERIF_FAMILIES = new Set([
  "Playfair Display",
  "Cormorant Garamond",
  "Lora",
  "Merriweather",
  "Libre Baskerville",
  "PT Serif",
  "Crimson Text",
  "Instrument Serif",
]);
const MONO_FAMILIES = new Set(["JetBrains Mono", "Fira Code"]);

/** Builds the CSS stack persisted for a Google family. */
export function fontStack(family: string): string {
  const fallback = SERIF_FAMILIES.has(family)
    ? SERIF
    : MONO_FAMILIES.has(family)
      ? MONO
      : SANS;
  return `"${family}", ${fallback}`;
}

export const SYSTEM_FONT_OPTIONS: FontOption[] = [
  { label: "System UI", value: SANS },
  { label: "Serif (Georgia)", value: SERIF },
  { label: "Monospace", value: MONO },
];

/** All selectable fonts for per-element overrides. */
export const FONT_OPTIONS: FontOption[] = [
  ...SYSTEM_FONT_OPTIONS,
  ...[...GOOGLE_FONTS]
    .sort((a, b) => a.localeCompare(b))
    .map((g) => ({ label: g, value: fontStack(g), google: g })),
];

/** Finds the option matching a stored stack (tolerates hand-written values). */
export function findFontOption(value: string | undefined): FontOption | undefined {
  if (!value) return undefined;
  const exact = FONT_OPTIONS.find((o) => o.value === value);
  if (exact) return exact;
  const [first] = extractFontFamilies(value);
  if (!first) return undefined;
  return FONT_OPTIONS.find((o) => o.google?.toLowerCase() === first.toLowerCase());
}

/**
 * Walks arbitrary block JSON and collects every font stack referenced by a
 * `fontFamily` / `*FontFamily` property, so only fonts actually used on the
 * page get preloaded.
 */
export function collectFontFamilies(value: unknown, out: Set<string> = new Set()): string[] {
  if (!value) return [...out];
  if (Array.isArray(value)) {
    for (const v of value) collectFontFamilies(v, out);
    return [...out];
  }
  if (typeof value === "object") {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (typeof v === "string" && /fontFamily$/i.test(k) && v.trim()) out.add(v);
      else if (v && typeof v === "object") collectFontFamilies(v, out);
    }
  }
  return [...out];
}
