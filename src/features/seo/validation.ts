import type { SeoSettings } from "./types";

export type SeoWarningLevel = "error" | "warn" | "info";
export interface SeoWarning {
  code: string;
  level: SeoWarningLevel;
  message: string;
}

const TITLE_MIN = 15;
const TITLE_MAX = 60;
const DESC_MIN = 50;
const DESC_MAX = 160;

/**
 * Validate SEO settings for a page. Non-blocking — the UI surfaces
 * warnings so the user can improve their metadata before publishing.
 */
export function validateSeo(
  seo: SeoSettings,
  ctx: { pageName: string; description?: string | null; slugTaken?: boolean } = {
    pageName: "",
  },
): SeoWarning[] {
  const out: SeoWarning[] = [];
  const title = (seo.title ?? ctx.pageName ?? "").trim();
  const desc = (seo.description ?? ctx.description ?? "").trim();

  if (!title) out.push({ code: "title_missing", level: "error", message: "Missing SEO title" });
  else if (title.length < TITLE_MIN)
    out.push({
      code: "title_short",
      level: "warn",
      message: `Title is short (${title.length} chars) — aim for 40–60`,
    });
  else if (title.length > TITLE_MAX)
    out.push({
      code: "title_long",
      level: "warn",
      message: `Title over ${TITLE_MAX} chars — Google may truncate`,
    });

  if (!desc) out.push({ code: "desc_missing", level: "error", message: "Missing meta description" });
  else if (desc.length < DESC_MIN)
    out.push({
      code: "desc_short",
      level: "warn",
      message: `Description is short (${desc.length} chars) — aim for 120–160`,
    });
  else if (desc.length > DESC_MAX)
    out.push({
      code: "desc_long",
      level: "warn",
      message: `Description over ${DESC_MAX} chars — will be truncated`,
    });

  const ogImage = seo.ogImage ?? seo.twitterImage;
  if (!ogImage)
    out.push({
      code: "og_image_missing",
      level: "warn",
      message: "No social share image — previews will be plain text",
    });

  if (ctx.slugTaken)
    out.push({ code: "slug_duplicate", level: "error", message: "Slug already in use" });

  for (const url of [seo.canonicalUrl, seo.ogUrl, seo.ogImage, seo.twitterImage]) {
    if (url && !isValidUrl(url))
      out.push({ code: "invalid_url", level: "warn", message: `Invalid URL: ${url}` });
  }

  return out;
}

export function isValidUrl(s: string): boolean {
  try {
    new URL(s);
    return true;
  } catch {
    return false;
  }
}

/** Slug rules matching the DB validator: 3–50 chars, [a-z0-9_-] */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9_-]{3,50}$/.test(slug);
}
