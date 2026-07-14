/**
 * Minimal input sanitizers for user-supplied strings that will be rendered.
 * Never trust raw HTML from users — either escape it or render as text.
 */
const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(input: string): string {
  return input.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}

export function stripTags(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

export function safeUrl(input: string): string | null {
  try {
    const u = new URL(input);
    if (!["http:", "https:", "mailto:"].includes(u.protocol)) return null;
    return u.toString();
  } catch {
    return null;
  }
}
