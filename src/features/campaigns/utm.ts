/**
 * Pure UTM helpers — building tracking URLs, parsing, validation.
 * No side effects; safe for both client and server.
 */

export interface UtmParams {
  source: string;
  medium: string;
  campaign: string;
  term?: string;
  content?: string;
}

const KEY_MAP: Record<keyof UtmParams, string> = {
  source: "utm_source",
  medium: "utm_medium",
  campaign: "utm_campaign",
  term: "utm_term",
  content: "utm_content",
};

/** Normalize UTM values: trim, lowercase, replace whitespace with underscores. */
export function normalizeUtm(v: string | null | undefined): string {
  if (!v) return "";
  return v.trim().toLowerCase().replace(/\s+/g, "_").slice(0, 120);
}

export function buildTrackingUrl(targetUrl: string, utm: UtmParams): string {
  const cleanTarget = targetUrl.trim();
  let url: URL;
  try {
    url = new URL(cleanTarget);
  } catch {
    throw new Error("Invalid target URL");
  }
  (Object.keys(KEY_MAP) as Array<keyof UtmParams>).forEach((k) => {
    const val = normalizeUtm(utm[k]);
    if (val) url.searchParams.set(KEY_MAP[k], val);
  });
  return url.toString();
}

export function parseTrackingUrl(rawUrl: string): Partial<UtmParams> {
  try {
    const url = new URL(rawUrl);
    return {
      source: url.searchParams.get("utm_source") ?? undefined,
      medium: url.searchParams.get("utm_medium") ?? undefined,
      campaign: url.searchParams.get("utm_campaign") ?? undefined,
      term: url.searchParams.get("utm_term") ?? undefined,
      content: url.searchParams.get("utm_content") ?? undefined,
    };
  } catch {
    return {};
  }
}

export interface UtmValidationResult {
  ok: boolean;
  errors: Partial<Record<keyof UtmParams | "targetUrl", string>>;
}

/** Enforces required fields, safe characters and reasonable length. */
export function validateUtm(targetUrl: string, utm: UtmParams): UtmValidationResult {
  const errors: UtmValidationResult["errors"] = {};
  const target = targetUrl.trim();
  if (!target) errors.targetUrl = "Target URL is required";
  else {
    try {
      const u = new URL(target);
      if (!/^https?:$/.test(u.protocol)) errors.targetUrl = "URL must use http or https";
    } catch {
      errors.targetUrl = "Invalid URL";
    }
  }
  const check = (k: keyof UtmParams, required: boolean) => {
    const raw = (utm[k] ?? "").trim();
    if (!raw) {
      if (required) errors[k] = "Required";
      return;
    }
    if (raw.length > 120) errors[k] = "Max 120 characters";
    if (!/^[\w\-\.]+$/.test(normalizeUtm(raw)))
      errors[k] = "Use letters, numbers, - _ . only";
  };
  check("source", true);
  check("medium", true);
  check("campaign", true);
  check("term", false);
  check("content", false);
  return { ok: Object.keys(errors).length === 0, errors };
}

/** Compact base36 short-code, 6 chars, generated client-side. */
export function generateShortCode(): string {
  const bytes = new Uint8Array(6);
  if (typeof crypto !== "undefined" && "getRandomValues" in crypto) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => (b % 36).toString(36)).join("");
}

/** Common presets for the picker UI. */
export const UTM_SOURCE_PRESETS = [
  "google",
  "facebook",
  "instagram",
  "whatsapp",
  "telegram",
  "linkedin",
  "twitter",
  "tiktok",
  "youtube",
  "email",
  "qr",
  "direct",
] as const;

export const UTM_MEDIUM_PRESETS = [
  "cpc",
  "social",
  "email",
  "referral",
  "organic",
  "display",
  "affiliate",
  "qr",
  "push",
  "sms",
] as const;
