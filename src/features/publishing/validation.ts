import type { BioContent, Block } from "@/features/builder/types";

export type ValidationSeverity = "error" | "warning";

export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  blockId?: string;
  blockType?: Block["type"];
}

export interface ValidationResult {
  ok: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

/** Blocks that ship with the builder and are safe to render publicly. */
const SUPPORTED_TYPES: Block["type"][] = [
  "profile",
  "heading",
  "text",
  "button",
  "image",
  "divider",
  "spacer",
  "social",
  "video",
  "gallery",
  "socialFeed",
  "testimonials",
  "faq",
  "countdown",
  "map",
  "file",
  "contact",
  "integration",
  "highlightCards",
  "buttonGroup",
  "embed",
  "customCode",
];

const URL_LIKE =
  /^(https?:\/\/|mailto:|tel:|sms:|whatsapp:|https?:\/\/wa\.me\/|#|\/)/i;

function isValidUrl(url: string | undefined): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (URL_LIKE.test(trimmed)) {
    // extra parse check for http(s)
    if (/^https?:\/\//i.test(trimmed)) {
      try {
        new URL(trimmed);
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }
  return false;
}

/**
 * Runs pre-publish checks on a bio page. Errors block publish, warnings
 * do not. Keep the ruleset small and predictable so creators can trust it.
 */
export function validateForPublish(content: BioContent): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const blocks = content?.blocks ?? [];

  const visible = blocks.filter((b) => !b.hidden);
  if (visible.length === 0) {
    errors.push({
      severity: "error",
      code: "empty-page",
      message: "Add at least one visible block before publishing.",
    });
  }

  const profile = blocks.find((b) => b.type === "profile") as
    | (Block & { displayName?: string })
    | undefined;
  if (!profile) {
    warnings.push({
      severity: "warning",
      code: "missing-profile",
      message: "No Profile block found. Visitors won't see your name or avatar.",
    });
  } else if (!profile.displayName || !String(profile.displayName).trim()) {
    errors.push({
      severity: "error",
      code: "profile-name-missing",
      message: "Profile is missing a display name.",
      blockId: profile.id,
      blockType: "profile",
    });
  }

  for (const b of blocks) {
    if (!SUPPORTED_TYPES.includes(b.type)) {
      errors.push({
        severity: "error",
        code: "unsupported-block",
        message: `Block "${b.type}" isn't supported by the public renderer yet.`,
        blockId: b.id,
        blockType: b.type,
      });
      continue;
    }
    if (b.hidden) continue;

    switch (b.type) {
      case "button": {
        const btn = b as Block & { label?: string; url?: string };
        if (!btn.label?.trim())
          errors.push({
            severity: "error",
            code: "button-label",
            message: "Button is missing a label.",
            blockId: b.id,
            blockType: b.type,
          });
        if (!isValidUrl(btn.url))
          errors.push({
            severity: "error",
            code: "button-url",
            message: "Button has a missing or invalid URL.",
            blockId: b.id,
            blockType: b.type,
          });
        break;
      }
      case "buttonGroup": {
        const bg = b as Block & { buttons?: { label?: string; url?: string }[] };
        const list = bg.buttons ?? [];
        if (list.length === 0) {
          warnings.push({
            severity: "warning",
            code: "button-group-empty",
            message: "Button Group has no buttons.",
            blockId: b.id,
            blockType: b.type,
          });
        } else {
          list.forEach((item, i) => {
            if (!item.label?.trim() || !isValidUrl(item.url)) {
              errors.push({
                severity: "error",
                code: "button-group-item",
                message: `Button #${i + 1} in a Button Group is missing a label or valid URL.`,
                blockId: b.id,
                blockType: b.type,
              });
            }
          });
        }
        break;
      }
      case "image": {
        const img = b as Block & { url?: string; alt?: string };
        if (!isValidUrl(img.url))
          errors.push({
            severity: "error",
            code: "image-url",
            message: "Image is missing a source URL.",
            blockId: b.id,
            blockType: b.type,
          });
        if (!img.alt?.trim())
          warnings.push({
            severity: "warning",
            code: "image-alt",
            message: "Image has no alt text (accessibility).",
            blockId: b.id,
            blockType: b.type,
          });
        break;
      }
      case "video":
      case "embed":
      case "map":
      case "file": {
        const anyB = b as Block & { url?: string; mapUrl?: string; fileUrl?: string };
        const url = anyB.url ?? anyB.mapUrl ?? anyB.fileUrl;
        if (!isValidUrl(url))
          errors.push({
            severity: "error",
            code: `${b.type}-url`,
            message: `${b.type} block has a missing or invalid URL.`,
            blockId: b.id,
            blockType: b.type,
          });
        break;
      }
      case "social": {
        const s = b as Block & { links?: { url?: string; platform?: string }[] };
        (s.links ?? []).forEach((l, i) => {
          if (!isValidUrl(l.url))
            errors.push({
              severity: "error",
              code: "social-url",
              message: `Social link #${i + 1} (${l.platform ?? "?"}) has a broken URL.`,
              blockId: b.id,
              blockType: b.type,
            });
        });
        break;
      }
      case "heading":
      case "text": {
        const t = b as Block & { text?: string };
        if (!t.text?.trim())
          warnings.push({
            severity: "warning",
            code: "text-empty",
            message: `${b.type === "heading" ? "Heading" : "Text"} block is empty.`,
            blockId: b.id,
            blockType: b.type,
          });
        break;
      }
      case "countdown": {
        const c = b as Block & { target?: string };
        if (!c.target || Number.isNaN(new Date(c.target).getTime()))
          errors.push({
            severity: "error",
            code: "countdown-target",
            message: "Countdown has an invalid target date.",
            blockId: b.id,
            blockType: b.type,
          });
        break;
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}
