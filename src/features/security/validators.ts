import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email({ message: "Invalid email address" })
  .max(255);

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password too long")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[0-9]/, "Include a number");

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_]{3,30}$/, "3-30 chars: lowercase letters, numbers, underscore");

export const urlSchema = z
  .string()
  .trim()
  .url({ message: "Invalid URL" })
  .max(2048)
  .refine((u) => /^https?:\/\//i.test(u), "URL must start with http(s)://");

export const domainSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(
    /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/,
    "Enter a valid domain (example.com)",
  )
  .max(253);

export const searchQuerySchema = z.string().trim().max(200);

export const ALLOWED_UPLOAD_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "video/mp4",
  "audio/mpeg",
  "application/pdf",
]);

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

export function validateUpload(file: File): { ok: true } | { ok: false; error: string } {
  if (!ALLOWED_UPLOAD_MIME.has(file.type)) {
    return { ok: false, error: `File type not allowed: ${file.type || "unknown"}` };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: `File exceeds ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB` };
  }
  // Basic extension guard against MIME spoofing on double extensions
  if (/\.(exe|bat|cmd|sh|js|mjs|html|htm|jar|msi|com|scr|vbs)$/i.test(file.name)) {
    return { ok: false, error: "Executable file types are not allowed" };
  }
  return { ok: true };
}

/** Guard against open-redirect: only allow same-origin or explicit safelist. */
export function isSafeRedirect(target: string, allowedHosts: string[] = []): boolean {
  try {
    if (target.startsWith("/") && !target.startsWith("//")) return true;
    const url = new URL(target, typeof window !== "undefined" ? window.location.origin : "https://x");
    if (typeof window !== "undefined" && url.origin === window.location.origin) return true;
    return allowedHosts.includes(url.host);
  } catch {
    return false;
  }
}
