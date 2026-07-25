
# Demo Content Population Engine

Every visible "empty" container on the landing is a CSS gradient block (`bg-gradient-to-*`) used as a placeholder for cover, product, or gallery imagery. Hero and Conversion sections already consume real photography via `src/features/landing/demo-media.ts`; Showcase (20 themes × ~7 tiles = ~140 gradient blocks), Experience (8 live profiles), and Ecosystem (learning + card thumbnails) still render gradients. This work eliminates them via one shared manifest.

## What ships

**1. `src/features/landing/demo-businesses.ts` — the engine**
A single, exported catalog of 30 Indian businesses. Each entry:
```
id, category, name, handle, tagline, location, palette
owner: { name, photo }                     // portrait from PORTRAITS
cover: string                              // Unsplash cover URL, category-matched
verified: boolean, rating: number, reviewCount: number
products: [{ name, price, image, badge?, discount? }] × 3–4
services: [{ name, price }] × 2–3
gallery: [string] × 6                      // real category photography
buttons: [string] × 3                      // action rail labels
offers: [string]                           // e.g. "Diwali 30% off"
```
Categories covered (one each, no duplicates): Jewellery, Restaurant, Cafe, Doctor, Hospital, School, Salon, Spa, Gym, Fitness Studio, Hotel, Resort, Travel, NGO, Real Estate, Interior, Architect, Law Firm, CA, Photographer, Creator, Influencer, Electronics, Furniture, Fashion, Boutique, Temple Trust, Coaching, Digital Agency, Software Company.

**2. Showcase (`src/features/landing/showcase.tsx`)**
Replace THEMES gradient fields with references into `DEMO_BUSINESSES`. Update the `BioPreview`, `<ThemeCard>` cover, product tiles and gallery cells to render `<img src>` with `object-cover`. Palette stays; only imagery becomes real.

**3. Experience (`src/features/landing/experience.tsx`)**
`BUSINESSES` array is derived from `DEMO_BUSINESSES` (first 10). Live profile switcher, product grid, and gallery in the phone mock consume real photos.

**4. Ecosystem (`src/features/landing/ecosystem.tsx`)**
Learning-center carousel thumbnails, ecosystem cards, and any remaining decorative tiles get category-matched imagery from the manifest.

**5. Hero (`src/features/landing/hero.tsx`)**
Existing 16-business dataset is refactored to import from the engine; no visual change (it's already populated), just deduplication.

**6. Global reuse hook**
Export `useDemoBusinesses()` and `getDemoBusiness(id)` so future modules (builder gallery previews, template picker) pull from the same source.

## Render rules for every tile
- No `bg-gradient-to-*` used as final visual — allowed only as `<img>` load fallback under the image.
- Every image tag gets: fixed aspect ratio (`aspect-square` / `aspect-video` / `aspect-[9/13]`), `object-cover`, real `alt` text, `loading="lazy"` below the fold, `decoding="async"`.
- Product cards render: image, name, price, rating stars, optional discount badge.

## Out of scope (called out explicitly)
- Builder canvas, admin dashboards, Media Studio uploader: these are user-content surfaces, not marketing demos. They correctly show empty states with CTAs; they are not "placeholders" to populate.
- Conversion section: already populated in the earlier sprint; no changes.
- Any change to palette, motion, layout, spacing, or copy tone.

## Final report format (posted after implementation)
Total demo profiles · Total portraits used · Total covers · Total product images · Total gallery images · Total populated cards · Files touched · Bundle delta · Confirmation of zero remaining `bg-gradient-to-*` placeholder tiles in Showcase / Experience / Ecosystem.

## Technical notes
- All imagery via Unsplash's `images.unsplash.com/photo-...?w=X&h=Y&fit=crop&auto=format&q=80` — same pattern already in `demo-media.ts`, hotlink-friendly, CDN-cached, zero repo weight.
- Portraits via `randomuser.me/api/portraits/...` — same pattern as `demo-media.ts`.
- Deterministic per-business seeds keep SSR/CSR output identical (no hydration risk).
- No new npm dependencies. No schema/RLS changes. No route changes.
- Estimated diff: +1 new file (~650 lines), edits across `showcase.tsx` / `experience.tsx` / `ecosystem.tsx` / `hero.tsx` totalling ~800 changed lines. TypeScript strict; build verified before completion.

Approve to begin. I'll ship the engine + the four wired sections in one pass, then post the final population report.
