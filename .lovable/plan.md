# Plan: Universal Integration Display System Upgrade

Audit and standardize all integrations to support a consistent set of 9 display modes (Popup, Sticky, Floating, Card, etc.) across both Builder and Public renderers.

## User Review Required

> [!IMPORTANT]
> - Calendly and other embed-heavy integrations will require active internet connection on the viewer's side to render external iframes correctly.
> - Sticky and Floating modes will be managed by a global `IntegrationStack` to prevent layout clipping.

- **Check**: Are there any specific integrations beyond the ones listed (WhatsApp, Phone, SMS, Email, Calendly, Google Maps, Telegram, YouTube, Spotify, Socials) that you need prioritised?
- **Check**: The "Sticky Bottom Bar" on desktop will now be centered and contained within the profile width (max 1200px) instead of edge-to-edge.

## Proposed Changes

### 1. Unified Registry & Types
- Update `src/features/builder/integrations/registry.ts` to standardize modes for all providers.
- Add `stickyBottom` support to Phone, SMS, Email, Calendly, Telegram.
- Add `popup`, `embed`, `card` support to all applicable providers.
- Implement `build` logic for all providers to return both `href` (for links) and `embedSrc` (for iframes).

### 2. Enhanced Integration Renderer
- Refactor `src/features/builder/integrations/integration-render.tsx` to handle all modes consistently.
- Implement a robust `IntegrationModal` for the "Popup" mode.
- Update `IntegrationStack` to ensure sticky/floating elements are responsive and desktop-centered.
- Implement `safe-area-inset-bottom` for mobile sticky bars.

### 3. Calendly Production Hardening
- Implement responsive iframe handling for Calendly `embed` and `popup`.
- Add content-aware height adjustment if possible (using postMessage or standard defaults).

### 4. Builder & UX Improvements
- Update `IntegrationEditor` to only show modes supported by the specific provider.
- Ensure "Hidden" mode renders nothing publicly but shows a clear placeholder in the Builder.
- Add validation to prevent rendering integrations with missing required fields (e.g., empty phone number).

## Technical Details
- **Architecture**: Registry-driven UI where `IntegrationDef` defines capabilities.
- **Styling**: Tailwind CSS for responsive floating/sticky containers.
- **Z-Index Strategy**: `IntegrationStack` at `z-[9999]` to overlay all content blocks.
- **Performance**: Lazy loading for iframes (`loading="lazy"`) and optimized React renders using `useMemo`.

## Validation Plan
- [ ] Verify WhatsApp sticky bar remains centered on desktop and full-width (with margins) on mobile.
- [ ] Verify Calendly Popup opens a modal with a working close button.
- [ ] Verify Calendly Inline Embed is responsive and doesn't overflow horizontally.
- [ ] Verify Phone/SMS/Email sticky bars trigger native app actions.
- [ ] Verify "Hidden" mode produces zero DOM elements on public pages.
- [ ] Test on multiple viewports (Mobile 320px to Desktop 1920px).
