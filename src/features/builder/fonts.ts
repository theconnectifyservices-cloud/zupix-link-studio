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
import { FONT_LIBRARY, GOOGLE_FONTS, extractFontFamilies, fontMeta } from "./theme";

export interface FontOption {
  label: string;
  /** Group heading in the picker. */
  group?: string;
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
  "DM Serif Display",
  "Bodoni Moda",
  "EB Garamond",
  "Fraunces",
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

const PREMIUM_FAMILIES = new Set(FONT_LIBRARY.map((f) => f.family));

/** Premium library first (grouped), then the classic families. */
export const FONT_OPTIONS: FontOption[] = [
  ...SYSTEM_FONT_OPTIONS.map((o) => ({ ...o, group: "System" })),
  ...FONT_LIBRARY.map((f) => ({
    // Fallback faces keep the requested name visible so users find them.
    label: f.aliasFor ? `${f.aliasFor} (${f.family})` : f.family,
    group: f.category,
    value: fontStack(f.family),
    google: f.family,
  })),
  ...[...GOOGLE_FONTS]
    .filter((g) => !PREMIUM_FAMILIES.has(g))
    .sort((a, b) => a.localeCompare(b))
    .map((g) => ({ label: g, group: "Classic", value: fontStack(g), google: g })),
];

/** Ordered group names present in FONT_OPTIONS. */
export const FONT_GROUPS: string[] = FONT_OPTIONS.reduce<string[]>((acc, o) => {
  const g = o.group ?? "Classic";
  if (!acc.includes(g)) acc.push(g);
  return acc;
}, []);

/** Resolves the Google family behind a stored stack, if any. */
export function familyOf(stack: string | undefined): string | undefined {
  const opt = findFontOption(stack);
  if (opt?.google) return opt.google;
  const [first] = extractFontFamilies(stack ?? "");
  return first && fontMeta(first) ? first : first;
}

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
