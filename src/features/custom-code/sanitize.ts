import DOMPurify from "dompurify";

/**
 * Sanitize user-provided HTML for a Custom Code block.
 * Runs inside a sandboxed iframe, so we can safely allow iframes, forms
 * and common embed markup — the sandbox attribute is what enforces
 * cross-origin isolation, not the sanitizer.
 * `stripScripts=true` removes <script> even when JS is otherwise enabled.
 */
export function sanitizeHtml(html: string, opts?: { stripScripts?: boolean }): string {
  if (typeof window === "undefined") return "";
  const stripScripts = opts?.stripScripts ?? true;
  return DOMPurify.sanitize(html, {
    ADD_TAGS: stripScripts
      ? ["iframe", "lottie-player", "dotlottie-player", "trustbox"]
      : ["iframe", "script", "lottie-player", "dotlottie-player", "trustbox"],
    ADD_ATTR: [
      "allow",
      "allowfullscreen",
      "frameborder",
      "scrolling",
      "referrerpolicy",
      "loading",
      "target",
      "rel",
      "data-*",
      "src",
      "type",
      "async",
      "defer",
      "background",
      "speed",
      "loop",
      "mode",
      "autoplay",
      "aria-*",
    ],
    FORBID_TAGS: stripScripts ? ["script"] : [],
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
}

/**
 * Prefix every top-level selector with a scope class so custom CSS
 * cannot leak outside the block. Keeps @keyframes / @font-face / @media
 * intact. This is a lightweight scoper — good enough for user snippets.
 */
export function scopeCss(css: string, scopeSelector = ".zx-cc-scope"): string {
  if (!css.trim()) return "";
  // Strip comments so brace tracking is reliable.
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: string[] = [];
  let i = 0;
  const len = stripped.length;
  while (i < len) {
    // Skip whitespace
    while (i < len && /\s/.test(stripped[i])) i++;
    if (i >= len) break;
    // At-rule
    if (stripped[i] === "@") {
      // find matching block or ; terminator
      let end = i;
      while (end < len && stripped[end] !== "{" && stripped[end] !== ";") end++;
      if (end >= len) {
        out.push(stripped.slice(i));
        break;
      }
      const head = stripped.slice(i, end);
      if (stripped[end] === ";") {
        out.push(head + ";");
        i = end + 1;
        continue;
      }
      // block at-rule: @media, @supports, @keyframes, etc.
      let depth = 1;
      let j = end + 1;
      while (j < len && depth > 0) {
        if (stripped[j] === "{") depth++;
        else if (stripped[j] === "}") depth--;
        j++;
      }
      const body = stripped.slice(end + 1, j - 1);
      const trimmedHead = head.trim();
      if (/^@(keyframes|font-face|charset|import|page)/i.test(trimmedHead)) {
        out.push(`${head}{${body}}`);
      } else {
        // recurse into nested body
        out.push(`${head}{${scopeCss(body, scopeSelector)}}`);
      }
      i = j;
      continue;
    }
    // Regular rule: selector { ... }
    let end = i;
    while (end < len && stripped[end] !== "{") end++;
    if (end >= len) break;
    const selectors = stripped.slice(i, end);
    let depth = 1;
    let j = end + 1;
    while (j < len && depth > 0) {
      if (stripped[j] === "{") depth++;
      else if (stripped[j] === "}") depth--;
      j++;
    }
    const body = stripped.slice(end + 1, j - 1);
    const scoped = selectors
      .split(",")
      .map((s) => {
        const t = s.trim();
        if (!t) return t;
        // Do not double-scope selectors that already reference scope,
        // or global ones like html / :root.
        if (t.startsWith(scopeSelector)) return t;
        if (/^(html|:root|body)/i.test(t)) return `${scopeSelector} ${t.replace(/^body/i, "")}`.trim();
        return `${scopeSelector} ${t}`;
      })
      .join(", ");
    out.push(`${scoped}{${body}}`);
    i = j;
  }
  return out.join("\n");
}

/** Build the srcdoc string for the sandboxed iframe. */
export function buildSrcDoc(input: {
  html: string;
  css?: string;
  js?: string;
  allowJs?: boolean;
}): string {
  const cleanHtml = sanitizeHtml(input.html, { stripScripts: !input.allowJs });
  const css = scopeCss(input.css ?? "");
  const js = input.allowJs && input.js ? input.js : "";
  return `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<base target="_blank"/>
<style>
  html,body{margin:0;padding:0;background:transparent;color:inherit;font-family:inherit}
  .zx-cc-scope{max-width:100%}
  img,video,iframe{max-width:100%}
${css}
</style></head>
<body><div class="zx-cc-scope">${cleanHtml}</div>
<script>
  (function(){
    function post(){
      try{
        var h = document.documentElement.scrollHeight;
        parent.postMessage({__zxcc:true, height:h}, '*');
      }catch(e){}
    }
    var ro = new ResizeObserver(post);
    ro.observe(document.body);
    window.addEventListener('load', post);
    setTimeout(post, 50);
  })();
${js}
</script></body></html>`;
}
