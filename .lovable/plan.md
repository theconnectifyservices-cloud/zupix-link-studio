## LS-DEMO-01 · Phase 1 — Enterprise Demo Workspace & Showcase Profiles

Scope confirmed by you: **only** profiles, themes, content, and placeholder removal. Analytics, payments, forms, bookings, reset engine, demo login gating, landing wiring → later phases.

### 1. Demo workspace & owner
- Seed a fixed workspace `ZUPIX Showcase` (slug `zupix-showcase`, deterministic UUID) owned by `theconnectifyservices@gmail.com` (existing super-admin). No new auth user this phase — `demo@zupix.in` provisioning moves to Phase 3 with the read-only role gate.
- Apply a "Modern Glass" theme preset as the workspace default theme.

### 2. Twelve business showcase bio pages
One published `bio_pages` row per business, each with a unique slug and a distinct premium theme so the theme gallery is covered:

```text
1  Ratan Jewellers (Jaipur)          — jewellery
2  Spice Route Kitchen (Mumbai)      — restaurant
3  Brew & Bloom Café (Bengaluru)     — cafe
4  Dr. Anjali Sharma Clinic (Delhi)  — doctor
5  Ashirwad Multispeciality (Pune)   — hospital
6  Glow Studio Salon (Hyderabad)     — salon
7  IronCore Fitness (Gurugram)       — gym
8  Vidya Public School (Lucknow)     — school
9  Wanderlust Trails (Goa)           — travel
10 Casa Verde Homes (Noida)          — real estate
11 Pixel Forge Digital (Ahmedabad)   — digital agency
12 Meher & Associates (Chennai)      — law firm
```

Every page ships fully populated blocks: profile (logo + cover + owner photo + verified badge + description), contact strip (WhatsApp / call / email / address / hours), 4–6 custom CTAs, product OR service catalogue (6 items), gallery (6 images), 3 testimonials, 4 FAQs, social icons, embedded map, downloadable PDF, one HTML widget, SEO metadata (title/description/OG image), and a sample custom-domain string in metadata.

### 3. Media — Lovable Assets CDN
Curated pack, not the 300+ from the original spec (Phase 2 expands the library):
- 12 business logos, 12 cover banners, 12 owner portraits (Indian faces), 72 product/service photos, 72 gallery photos, 12 brochure PDFs, 12 branded QR PNGs → ~204 assets.
- Generated with `imagegen` (premium tier for logos/covers, fast tier for gallery/product) + `lovable-assets create` for each. Written to `src/demo/assets/<business>/…asset.json`.
- All references in seed data use the CDN `url` from the pointer JSON.

### 4. Theme presets
Register 12 premium theme JSON presets under `src/features/templates/catalog.ts` (Modern Glass, Neon Noir, Sunrise Gradient, Terracotta, Ocean Fade, Royal Emerald, Midnight Mono, Peach Soft, Editorial Serif, Studio Dark, Botanic, Aurora). Each demo bio page uses a different preset. Remaining 8 of the "20 premium themes" come in Phase 2.

### 5. Placeholder audit
Grep the app for empty-state fallbacks that render on the demo workspace surfaces (dashboard cards, template gallery, media library, bio dashboard, profile). Where the demo workspace is active and rows exist in the seed, the UI must show them; where a surface would still be empty in Phase 1 (analytics, payments, forms), leave the empty state untouched — Phase 2/3 seed fills it. No component code changes beyond wiring seed data through existing renderers.

### 6. Delivery mechanism
- One SQL migration `seed_demo_workspace_phase1.sql` inserting the workspace, membership, theme, and 12 `bio_pages` (JSONB content referencing CDN URLs). Idempotent via `ON CONFLICT (id) DO UPDATE`.
- Asset generation + upload driven from the sandbox (not shipped in code) — pointer JSONs committed under `src/demo/assets/`.
- A tiny `src/demo/manifest.ts` exports the fixed workspace + page IDs so later phases (analytics/payments seed, reset engine) can target them.

### 7. Out of scope this phase (queued for later)
Analytics events, payments/invoices, forms/bookings, downloads center, testimonials manager rows, AI Studio prompt library, landing-page rewrites to point at demo, `demo@zupix.in` read-only account, reset SQL function + admin button, 300+ media / 50+ videos expansion, remaining 8 themes.

### Technical notes
- Workspace/page UUIDs pinned as constants so Phase 2 seed can reference them.
- Migration only touches `workspaces`, `workspace_members`, `profiles.active_workspace_id` (no-op), and `bio_pages`. No schema changes.
- Image generation is the slow step (~204 calls). If a subset fails, seed still runs and re-uploads can be retried without rewriting the migration.

### Approval checkpoint
This plan is Phase 1 only. On completion I stop and wait for your go-ahead before Phase 2 (media library expansion + analytics/payments/forms seed + landing wiring) and Phase 3 (demo login + reset engine).
