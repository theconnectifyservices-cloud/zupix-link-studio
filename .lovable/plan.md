# LS-14.0 — Enterprise Subscription & Plan Engine

Build the monetization foundation. Three plans (Udaan / Tejas / Shikhar), platform-wide feature gating, admin CMS, upgrade modal. No payment gateway yet (LS-15).

Existing project already has `billing_plans`, `billing_subscriptions`, `plan_features`, `plan_limits`, `feature_flags`, `workspace_has_feature()`, `workspace_get_limit()`, and a `MonetizationCenter` admin. This phase adopts and extends that foundation instead of rebuilding it — the new work is the **ZUPIX plan definitions, builder-level gating, hooks, waitlist, upgrade modal**, and a dedicated **Subscription Manager** super-admin surface.

## 1. Database (single migration)

**Reuse existing tables** (`billing_plans`, `plan_features`, `plan_limits`, `billing_subscriptions`). Seed with ZUPIX plans:

- `udaan` — tier `free`, price 0, `is_public=true`
- `tejas` — tier `pro`, monthly ₹299 (29900 minor), yearly ₹259900, `is_public=true`
- `shikhar` — tier `business`, monthly ₹499, yearly ₹399900, `is_public=true`, `metadata.coming_soon=true`

Seed `plan_features` for each builder block key + platform feature (`custom_domain`, `remove_branding`, `store`, `bookings`, etc.).
Seed `plan_limits` for `bio_pages` (1 / 20 / unlimited), `custom_domains` (0 / 1 / unlimited).

**New tables:**
- `plan_waitlist` — `workspace_id`, `plan_code`, `email`, `user_id`, `created_at`. RLS: authenticated insert own; admin select all.
- `subscription_history` — `workspace_id`, `from_plan`, `to_plan`, `changed_by`, `reason`, `created_at`. (billing_events already covers this — skip if redundant; use billing_events instead.)

Add `active_plan_code` view or use existing `billing_subscriptions.plan_id` join.

All new tables: GRANT + RLS + policies.

## 2. Plan registry (client)

`src/features/subscription/plans.ts` — static registry mapping each ZUPIX plan to blocks/features/limits with UI metadata (name, emoji, tagline, color, badge). Single source of truth used by builder, pricing page, upgrade modal.

Block → plan map:
- **udaan**: profile, heading, text, button, button-group, divider, spacer, social, image, gallery, video, social-feed, contact-card
- **tejas**: + testimonials, faq, countdown, map, file-download, embed, custom-code, form, remove_branding, custom_domain
- **shikhar** (coming_soon): store, bookings, digital-products, membership, subscriptions, donations, payments

## 3. Hooks (`src/features/subscription/hooks.ts`)
- `usePlan()` → current workspace plan (code, tier, meta)
- `useFeature(key)` → `{ enabled, requiredPlan, upgrade() }`
- `useSubscription()` → subscription row + status
- `usePlanLimit(metric)` → `{ used, limit, isUnlimited, remaining, exceeded }`
- `useUpgradeModal()` → open modal with prefilled context

Wraps existing `workspace_has_feature` / `workspace_get_limit` RPCs.

## 4. Builder integration
- Extend block registry entries with `requiredPlan` (already can be inferred from plans.ts).
- Component Library palette: show badge (FREE / TEJAS / COMING SOON) on each card.
- On drop of locked block: insert placeholder block rendered by `<LockedBlock />` — premium lock overlay, plan badge, upgrade CTA, feature description. Editing disabled.
- Public renderer: skip locked blocks silently.

## 5. Upgrade modal (`src/features/subscription/components/upgrade-modal.tsx`)
Glassmorphism, monthly/yearly toggle with "Save X%" badge, 3 plan cards, feature comparison table, animated CTAs. Shikhar shows "Coming Soon" + Waitlist form.

## 6. Pricing route
`src/routes/pricing.tsx` — public marketing page reusing the modal's plan cards.

## 7. Subscription Manager (super admin)
`src/routes/_authenticated/admin/subscriptions.tsx`
- Plan CRUD (name, price monthly/yearly, currency, visibility, coming_soon toggle, waitlist toggle)
- Feature toggle grid (plan × feature)
- Limit editor (plan × metric)
- Yearly discount calc helper
- Waitlist viewer with export

Guarded by `super_admin` role via existing `has_role`.

## 8. Waitlist API
`src/features/subscription/waitlist.functions.ts` — `joinWaitlist({ planCode, email })`, `listWaitlist({ planCode })` (admin).

## 9. Sidebar/nav
Add "Subscription" link under super-admin section pointing to `/admin/subscriptions`. Add "Upgrade" pill in main topbar when plan = udaan.

## Technical notes
- All new server work via `createServerFn` + `requireSupabaseAuth`. Admin ops verify `has_role(uid,'super_admin')`.
- No payment integration. Upgrade CTA on paid plans opens modal → "Payments arrive in LS-15" toast + waitlist option.
- Money in minor units (existing convention).
- All UI uses design tokens (no hardcoded colors); framer-motion for micro-interactions; existing `MediaField`, `PageHeader`, shadcn primitives.

## Deliverables
1. Migration: seed plans/features/limits + `plan_waitlist` table
2. `src/features/subscription/` — plans registry, hooks, api, components (UpgradeModal, PlanCard, LockedBlock, WaitlistForm, PlanBadge)
3. Builder registry + palette + canvas updates for locked blocks
4. `/pricing` public route
5. `/admin/subscriptions` super-admin route
6. Topbar "Upgrade" CTA + sidebar entry

Wait for approval before implementation.
