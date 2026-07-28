# Premium Theme Library Upgrade

Transform the current template library into a marketplace-grade collection with 70 uniquely designed themes, plan-based access control, and an admin CMS — without touching existing builder/branding architecture.

## 1. Theme Architecture (future-ready)

Introduce a pluggable theme registry so themes are pure data + a renderer id, and new themes drop in without code churn.

```text
src/features/themes/
  registry.ts              # central registry, auto-loads all definitions
  types.ts                 # ThemeDefinition, ThemeTier, ThemeCategory, LayoutId
  layouts/                 # 15+ unique layout renderers (Hero, Profile, Buttons, Cards)
    glass.tsx, neumorph.tsx, apple.tsx, notion.tsx, linear.tsx,
    stripe.tsx, framer.tsx, portfolio.tsx, luxury-gold.tsx,
    black-premium.tsx, creator.tsx, neon-cyber.tsx, minimal-white.tsx,
    dark-elegant.tsx, magazine.tsx, bento.tsx, split-hero.tsx,
    story-card.tsx, terminal.tsx, editorial.tsx
  definitions/
    free/  (20 files)
    premium/  (50 files)
  applyTheme.ts            # merges ThemeDefinition into bio content model
```

Each `ThemeDefinition` specifies: `id`, `name`, `category`, `tier` (free/premium/enterprise), `layoutId`, `tokens` (colors, gradients, radii, shadows), `typography` (font pair + scale), `spacing`, `buttonStyle`, `cardStyle`, `hoverEffect`, `backgroundStyle`, `animationPreset`, `flags` (new/trending/featured), `preview` (image path).

15–20 distinct **layout renderers** guarantee real design variety (not recolored clones). Each theme picks a layout + token set; multiple themes may share a layout but must differ in typography, spacing, buttons, and background.

## 2. Theme Collection

- **20 Free** — Minimal White, Notion-style, Clean Portfolio, Basic Dark, Soft Pastel, Creator Starter, etc.
- **50 Premium** — Apple, Stripe, Linear, Framer, Luxury Gold, Black Premium, Neon Cyber, Gaming, Music Artist, Fashion, Photographer, Restaurant, Gym, Real Estate, Doctor, Wedding, Personal Brand, Corporate, E-commerce, AI, Agency, Startup, Influencer, plus category-specific and seasonal editions.
- Enterprise-only slot reserved (Shikhar) with 3 seed themes + auto-inclusion for future ones tagged `enterprise`.

## 3. Access Control

Reuse existing `usePlan()` / entitlement engine:
- `udaan` → free tier only, premium visible but locked.
- `tejas` → free + premium.
- `shikhar` → free + premium + enterprise + white-label flag.

Enforcement in two places: (a) `TemplateCard` renders lock overlay + badge; (b) `applyTheme()` server function re-checks entitlement (defense in depth) and rejects with a clear error.

## 4. Template Library UI

Rebuild `src/routes/_authenticated/app/templates.tsx` (and builder theme panel):

- Sticky filter bar: category chips, tier filter, search, sort (Popular / New / Trending).
- Responsive grid (`grid-cols-1 sm:2 lg:3 xl:4`), virtualized via `IntersectionObserver` mount gate + `content-visibility: auto`.
- **TemplateCard**: preview image (lazy `loading="lazy"` + blur-up), name, category chip, badges (Free/Premium/New/Trending/Featured/Enterprise), popularity meter, Apply button, locked overlay with blur+lock icon for gated themes.

## 5. Lock Experience

Shared `PremiumLockModal`: animated lock, headline "This theme is available in the Tejas Plan.", three actions — **Upgrade to Tejas** (→ checkout), **Compare Plans** (→ /pricing), **Cancel**. Enterprise variant swaps copy to Shikhar.

## 6. Performance

- Preview images: WebP, `loading="lazy"`, `decoding="async"`, fixed aspect ratio to prevent CLS.
- Card list uses `IntersectionObserver` (reuse `lazy-section.tsx` pattern) — only visible + next-viewport cards render heavy previews.
- Theme definitions tree-shaken via barrel that imports metadata eagerly and layout renderers via `React.lazy`.
- No global re-renders on filter change (local state + `useMemo`).

## 7. Admin CMS

New route `src/routes/_authenticated/admin/themes.tsx` (super_admin only):
- Table view with search/filter.
- Create/Edit drawer: name, category, tier, layout picker, tokens, typography, badges (new/trending/featured/enterprise), preview upload via existing `MediaField`.
- Delete with confirm; toggle publish.
- Backed by new `theme_definitions` table (see technical section) so custom themes coexist with code-defined ones (code themes are read-only in admin, marked "System").

## Technical Details

**DB migration** (single):
```sql
CREATE TABLE public.theme_definitions (
  id uuid PK default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  category text not null,
  tier text not null check (tier in ('free','premium','enterprise')),
  layout_id text not null,
  tokens jsonb not null default '{}',
  typography jsonb not null default '{}',
  spacing jsonb not null default '{}',
  button_style jsonb not null default '{}',
  card_style jsonb not null default '{}',
  hover_effect text,
  background_style jsonb not null default '{}',
  animation_preset text,
  flags jsonb not null default '{}',   -- {new, trending, featured}
  preview_url text,
  popularity int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- GRANTs (SELECT to anon+authenticated; ALL to service_role)
-- RLS: public read of is_published=true; write only to super_admin via has_role
-- updated_at trigger
```

**Server fns** (`src/features/themes/*.functions.ts`):
- `listPublishedThemes()` — public read, combined with code registry.
- `applyThemeToBioPage({ bioPageId, themeId })` — `requireSupabaseAuth`, verifies workspace ownership + entitlement, merges tokens via `applyTheme()` into `bio_pages.content`.
- Admin CRUD fns gated by `has_role('super_admin')`.

**Preview assets**: 70 curated preview images generated with `imagegen` (fast tier) into `src/assets/themes/`, one per theme, 640×960 WebP.

**No breaking changes** to existing `bio_pages.content` schema — theme application only writes into the existing `theme`/`design` sub-objects normalized by `content-normalizer.ts`.

## Out of Scope

- Not touching the builder canvas, blocks, publishing pipeline, or public renderer beyond consuming the new tokens.
- No pricing/plan changes; reuses existing Tejas/Shikhar entitlements.
- No marketplace reviews/ratings (popularity is admin-managed only for now).

## Rollout Order

1. Registry + types + 3 layout renderers + 5 seed themes → verify apply flow.
2. Remaining layouts + all 70 theme definitions + preview images.
3. Redesigned Library UI + lock modal.
4. DB migration + admin CMS.
5. Perf pass + QA across 320–1440px.

Approve and I'll build it in that order.
