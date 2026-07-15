/**
 * LS-11A validators for tracking IDs and custom scripts.
 * All patterns are conservative — the goal is to catch obvious mistakes
 * (typos, wrong prefix, wrong length), NOT to guarantee a live account.
 */

const DANGEROUS_PATTERNS: Array<{ re: RegExp; label: string }> = [
  { re: /document\.cookie\s*=/i, label: "writes cookies directly" },
  { re: /eval\s*\(/i, label: "uses eval()" },
  { re: /Function\s*\(\s*['"`]/i, label: "uses new Function()" },
  { re: /window\.location\s*=/i, label: "hijacks window.location" },
  { re: /<script[^>]*src=["']http:/i, label: "loads a script over insecure http://" },
  { re: /localStorage\.clear\s*\(/i, label: "wipes localStorage" },
  { re: /sessionStorage\.clear\s*\(/i, label: "wipes sessionStorage" },
];

export interface ValidationResult {
  ok: boolean;
  message?: string;
  warning?: string;
}

export const validators = {
  ga4(id: string): ValidationResult {
    if (!id) return { ok: false, message: "Measurement ID is required" };
    return /^G-[A-Z0-9]{4,15}$/.test(id.trim())
      ? { ok: true }
      : { ok: false, message: "Expected format: G-XXXXXXXXXX" };
  },
  gtm(id: string): ValidationResult {
    if (!id) return { ok: false, message: "Container ID is required" };
    return /^GTM-[A-Z0-9]{4,10}$/.test(id.trim())
      ? { ok: true }
      : { ok: false, message: "Expected format: GTM-XXXXXX" };
  },
  metaPixel(id: string): ValidationResult {
    if (!id) return { ok: false, message: "Pixel ID is required" };
    return /^\d{13,17}$/.test(id.trim())
      ? { ok: true }
      : { ok: false, message: "Meta Pixel IDs are 13–17 digits" };
  },
  clarity(id: string): ValidationResult {
    if (!id) return { ok: false, message: "Project ID is required" };
    return /^[a-z0-9]{6,12}$/i.test(id.trim())
      ? { ok: true }
      : { ok: false, message: "Clarity IDs are 6–12 alphanumeric characters" };
  },
  linkedIn(id: string): ValidationResult {
    if (!id) return { ok: false, message: "Partner ID is required" };
    return /^\d{4,12}$/.test(id.trim())
      ? { ok: true }
      : { ok: false, message: "LinkedIn Partner IDs are 4–12 digits" };
  },
  tiktok(id: string): ValidationResult {
    if (!id) return { ok: false, message: "Pixel ID is required" };
    return /^[A-Z0-9]{18,24}$/i.test(id.trim())
      ? { ok: true }
      : { ok: false, message: "TikTok Pixel IDs are 18–24 alphanumeric characters" };
  },
  customScript(code: string): ValidationResult {
    if (!code || !code.trim()) return { ok: false, message: "Code cannot be empty" };
    if (code.length > 50_000)
      return { ok: false, message: "Script is too large (50KB max)" };
    for (const { re, label } of DANGEROUS_PATTERNS) {
      if (re.test(code)) return { ok: false, message: `Blocked: ${label}` };
    }
    // warn on missing <script> tag when placement is head/body/footer HTML
    const looksLikeHtml = /<[a-z][^>]*>/i.test(code);
    const hasScript = /<script[\s>]/i.test(code);
    if (looksLikeHtml && !hasScript) {
      return {
        ok: true,
        warning: "HTML detected but no <script> tag — the code may not execute.",
      };
    }
    return { ok: true };
  },
};

export function detectDuplicateScripts(scripts: { code: string }[]): number[] {
  const seen = new Map<string, number>();
  const dupes: number[] = [];
  scripts.forEach((s, i) => {
    const key = s.code.replace(/\s+/g, " ").trim();
    if (seen.has(key)) dupes.push(i);
    else seen.set(key, i);
  });
  return dupes;
}
