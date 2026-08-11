# Plan: Social Media Embed Block Implementation

Implement a premium "Social Media Embed" block for Facebook and Instagram content, ensuring responsive, content-aware rendering without empty space.

## User Review Required

> [!IMPORTANT]
> - Facebook/Instagram embeds require the parent page to load their respective SDKs (`xfbml.js` for FB, `embeds.js` for IG). I will add these to the root route to ensure embeds initialize correctly.
> - The feature will be locked for users on the "Free" (UDAAN) plan, requiring an upgrade to "Starter" (TEJAS) or higher.

## Proposed Changes

### Database & Types
- Add `socialEmbed` to `BlockType` in `src/features/builder/types.ts`.
- Define `SocialEmbedBlock` interface with fields for platform, URLs, content type, and visual settings.

### Builder Integration
- Register the new block in `src/features/builder/block-registry.ts` with a "Premium" badge for free users.
- Create `src/features/builder/components/property-editors/social-embed-editor.tsx` for the premium UI.
- Update `src/features/builder/components/property-panel.tsx` to include the new editor.

### Rendering Engine
- Create `src/features/builder/components/social-embed-render.tsx` for both builder preview and public rendering.
- Implement the "Content-Aware Height" logic using `ResizeObserver` or official postMessage events (similar to the Custom HTML fix).
- Update `src/features/builder/block-renderer.tsx` to handle the `socialEmbed` type.

### SEO & SDKs
- Inject Meta/Facebook and Instagram embed scripts in `src/routes/__root.tsx`.

### Technical Details

- **Validation:** Regex-based detection for `facebook.com`, `fb.watch`, `instagram.com/p/`, `instagram.com/reel/`.
- **Normalization:** Strip tracking parameters and ensure canonical embed URLs.
- **Entitlement:** Check user's current plan tier via `resolveUserSubscription` or existing local state.
- **Responsiveness:** Use `aspect-ratio` where content type is known or dynamic height adjustments for arbitrary posts.

## Verification Plan

- [ ] **Unit Test:** URL parser/normalizer for various FB/IG formats.
- [ ] **UI Test:** Builder editor interaction, preview button, platform detection.
- [ ] **Rendering Test:** Mobile vs Desktop layout in builder preview.
- [ ] **Public Test:** Verify SDK initialization and zero-extra-space rendering on a published slug.
- [ ] **Access Test:** Verify "Premium" lock for free accounts.
