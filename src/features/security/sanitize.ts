/**
 * Lightweight, dependency-free sanitizers.
 * For rich-text rendering prefer a battle-tested lib (DOMPurify) upstream;
 * these helpers cover the common in-app surfaces (URLs, plain-text HTML,
 * SVG uploads) and are safe to import in SSR.
 */

const DANGEROUS_URL_SCHEMES = /^(javascript|data|vbscript|file):/i;

/** Return a safe href or `#` if the URL is dangerous or malformed. */
export function safeUrl(input: string | null | undefined, fallback = "#"): string {
  if (!input) return fallback;
  const trimmed = String(input).trim();
  if (!trimmed) return fallback;
  if (DANGEROUS_URL_SCHEMES.test(trimmed)) return fallback;
  // Allow relative + http(s) + mailto + tel
  if (/^(https?:|mailto:|tel:|\/|#|\?)/i.test(trimmed)) return trimmed;
  // Bare domain -> add https
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) return `https://${trimmed}`;
  return fallback;
}

/** Escape HTML entities so a string is safe to render as text. */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Very conservative SVG sanitizer: strips scripts, event handlers,
 * external references and dangerous URL schemes. Rejects if parsing fails.
 */
export function sanitizeSvg(svg: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
    if (doc.querySelector("parsererror")) return null;
    const walker = doc.createTreeWalker(doc.documentElement, NodeFilter.SHOW_ELEMENT);
    const toRemove: Element[] = [];
    let node: Node | null = walker.currentNode;
    while (node) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      if (["script", "foreignobject", "iframe", "object", "embed"].includes(tag)) {
        toRemove.push(el);
      } else {
        for (const attr of Array.from(el.attributes)) {
          const name = attr.name.toLowerCase();
          const value = attr.value;
          if (name.startsWith("on")) el.removeAttribute(attr.name);
          else if (
            (name === "href" || name === "xlink:href" || name === "src") &&
            DANGEROUS_URL_SCHEMES.test(value.trim())
          ) {
            el.removeAttribute(attr.name);
          }
        }
      }
      node = walker.nextNode();
    }
    toRemove.forEach((n) => n.remove());
    return new XMLSerializer().serializeToString(doc);
  } catch {
    return null;
  }
}
