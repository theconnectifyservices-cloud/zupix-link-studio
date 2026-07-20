## Custom Code Studio — Builder Block + HTML Library

Integrates as a native Builder block. Does not touch existing blocks, theme, or layouts.

### 1. New block type: `customCode`
- Extend `BlockType` in `src/features/builder/types.ts` with `"customCode"`.
- New `CustomCodeBlock` interface:
  - `html: string`, `css?: string`, `js?: string` (js disabled unless super-admin flag)
  - `title?`, `description?`
  - `containerWidth?: "full" | "narrow" | "wide"`, `shadow?`, `radius?`, `border?`
  - `sourceLibraryId?: string` (link to reusable library entry)
  - `presetKey?: string` (which ready-made template was seeded)
  - Standard `settings` (padding, margin, background, visibility, animation) — reuses existing `BlockSettings` so responsive + entrance animations work automatically.
- Register in `block-registry.ts` under category **Advanced Components** with `</>` icon (`Code2` from lucide).

### 2. Sandboxed renderer
- `CustomCodeRender` in `block-renderer.tsx`:
  - Renders an `<iframe sandbox="allow-scripts allow-popups allow-forms allow-same-origin-off">` using `srcdoc`.
  - `srcdoc` composed as: `<style>${scopedCss}</style>${sanitizedHtml}` plus `<script>${js}</script>` only when JS enabled.
  - Sanitize HTML with **DOMPurify** (`bun add dompurify @types/dompurify isomorphic-dompurify`). Allow iframes + common embed tags via a permissive allow-list for known providers (YouTube, Vimeo, Maps, Calendly, Typeform, Spotify, Tawk, Lottie, Trustpilot, etc.).
  - Auto-height via `ResizeObserver` inside the iframe posting `postMessage`; parent listens and updates iframe height. Fallback: fixed configurable `minHeight`.
  - Lazy render via `IntersectionObserver` — iframe `srcdoc` set only when in viewport.
  - CSS is auto-scoped by wrapping in `.zx-cc-scope { ... }` and prefixing selectors (simple prefixer; disabled for `@keyframes`, `@font-face`, `@media`).

### 3. Editor panel (property panel)
- New `CustomCodeEditor` in `src/features/builder/components/property-editors/`:
  - Tabs: **HTML | CSS | JS | Settings**
  - Editor: **CodeMirror 6** (`@uiw/react-codemirror`, `@codemirror/lang-html`, `@codemirror/lang-css`, `@codemirror/lang-javascript`).
  - Features: syntax highlight, line numbers, auto-indent, undo/redo (built-in), search/replace (built-in `@codemirror/search`), copy, paste, fullscreen toggle, char count.
  - **Split-screen mode** toggle: right pane runs the same sandboxed renderer against current draft (debounced 300 ms).
  - **Presets dropdown** ("Insert Embed…") with one-click templates: Google Maps, YouTube, Vimeo, Google Forms, Calendly, Typeform, Tawk.to, WhatsApp Widget, Instagram, Facebook, Twitter, Spotify, Google Reviews, Trustpilot, LottieFiles, Custom Button.
  - **Import / Export** buttons (upload `.html` file, download current block as `.html`).
  - **Save to Library** button.
  - JS tab shows a locked notice unless super-admin flag enabled.

### 4. HTML Library (CMS)
- New table `html_library` (via migration): `id`, `workspace_id`, `name`, `description`, `category`, `html`, `css`, `js`, `scope` (`global | workspace | page`), `page_id?`, `theme_key?`, `archived_at`, `created_by`, timestamps. RLS scoped to workspace members; GRANT to authenticated + service_role.
- Feature module `src/features/custom-code/`:
  - `api.ts` — list/create/update/duplicate/archive/delete server fns via `requireSupabaseAuth`.
  - `presets.ts` — the 15+ ready-made embed templates.
  - `sanitize.ts` — DOMPurify config + CSS scoper.
  - `components/library-dialog.tsx` — browse, search, insert, duplicate, rename, archive.
- "Insert from Library" button in editor + library card in Left Panel under Advanced Components.

### 5. Super-admin JS toggle
- Boolean workspace setting `allow_custom_js` on `workspaces` (nullable, default false) — migration adds column.
- Toggle rendered in **Settings → Security** for users with `admin` role via existing `RequirePermission`.
- Renderer strips `<script>` unless flag true AND block's `js` field is set.

### 6. Files touched
- **New**: `src/features/custom-code/{api.ts,presets.ts,sanitize.ts,index.ts}`, `src/features/custom-code/components/library-dialog.tsx`, `src/features/builder/components/property-editors/custom-code-editor.tsx`, migration file.
- **Edit**: `src/features/builder/types.ts` (add block type), `src/features/builder/block-registry.ts` (register), `src/features/builder/block-renderer.tsx` (add `CustomCodeRender`), `src/features/builder/components/property-panel.tsx` (dispatch to new editor), `src/features/builder/components/builder-left-panel.tsx` (Advanced category entry + library entry point), `src/routes/_authenticated.app.settings.security.tsx` (JS toggle).
- **No changes** to theme engine, existing blocks, layouts, or public renderer wiring (block renders through the same `renderBlock` switch).

### 7. Deliverable checklist
- Builder integration ✔  · CMS storage ✔  · Live split preview ✔  · Responsive via existing `settings.visibility`/`responsive` ✔  · Reusable Library ✔  · Import/Export ✔  · Presets ✔  · Sanitization + sandbox iframe ✔  · Lazy render ✔  · JS off by default ✔

Approve to build.
