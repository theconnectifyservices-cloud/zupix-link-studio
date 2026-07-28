# Subscription Management — Implementation Plan

Extension of the existing billing engine (`billing_plans`, `billing_subscriptions`, `billing_invoices`, `billing_payments`, `plan_features`, `plan_limits`, `trial_events`, `notifications`). No redesign of existing pages. Reuses current shadcn UI, admin layout, sidebar, and RLS helpers.

## Part 1 — Admin Panel

New route: `src/routes/_authenticated/admin/subscription-management.tsx`  
Sidebar: **Customers → Subscription Management** (added under existing Admin section in `src/shared/navigation/sidebar.tsx`).

Enterprise table (reuses existing `Table`, `Badge`, `DropdownMenu`, `Pagination` primitives):

- Customer Name, Customer ID (short hash of `profiles.id`), Email, Mobile (from `auth.users.phone`), Current Plan, Plan Status, Start, Expiry, Days Remaining (computed), Auto Renewal, Account Status, Last Updated.
- Toolbar: search (name/email), filters (plan, status), CSV + Excel export, pagination (25/50/100).
- Row actions: View, Edit, Assign Plan, Extend, Upgrade, Downgrade, Suspend, Resume, Cancel, Delete (soft).

**Assign Plan modal** (`assign-plan-dialog.tsx`):

- Plan select (from `billing_plans` + "Custom Plan" option)
- Billing cycle: monthly / quarterly / yearly / lifetime / custom (days)
- Overridable fields: price, duration, storage limit, mini-websites, custom domains, subdomain, team members, themes, premium templates, analytics, verified badge, AI, priority support, API access, custom branding — each as toggle or numeric input.
- Saves overrides to `billing_subscriptions.metadata.overrides` (JSONB) so no schema break; effective limits merge plan defaults + overrides.
- Actions: Save (draft), Assign (activate), Cancel.

Extend / Upgrade / Downgrade / Suspend / Resume / Cancel implemented via one server fn `adminUpdateSubscription` with action enum.

## Part 2 — Customer Panel

New route: `src/routes/_authenticated.app.my-subscription.tsx`  
Sidebar item **My Subscription Plan** (under existing account section).

Current Plan card + usage panel:

- Plan name, badge, price, cycle, status, start, expiry, days remaining, renewal date.
- Feature list from `plan_features` merged with subscription overrides.
- Usage bars: storage (sum of `media_assets.size_bytes`), mini-websites (`bio_pages` count), domains (`domains` count) vs limits from `plan_limits` + overrides.
- Verified badge status, support level.
- Actions: Upgrade (→ `/pricing`), Renew (→ checkout), Download Invoice (latest paid `billing_invoices`), Billing History (list).

## Part 3 — Plan Feature Engine

Central helper `src/features/subscription/entitlements.ts`:

```
getEntitlements(workspaceId) → { limits, features }
```

Merges `plan_limits` + `plan_features` + `billing_subscriptions.metadata.overrides`. Existing `useFeature` / `LockedBlock` hooks re-wired to consult this. When admin changes plan → server fn writes new sub + emits `plan_changed` event → `notifications` row + `activity_logs` entry → client `react-query` cache invalidates.

## Part 4 — Database (single migration)

Reuses existing tables. Adds only:

- `subscription_change_logs` (workspace_id, subscription_id, actor_id, action, from_plan, to_plan, from_status, to_status, metadata, created_at) + GRANTs + RLS (admin read all, workspace members read own).
- `renewal_history` view over `billing_payments` (no new table).
- `billing_subscriptions.metadata.overrides` JSON convention (no schema change).
- Small SQL fn `admin_update_subscription(...)` (SECURITY DEFINER) that validates `has_role(auth.uid(),'admin'|'super_admin')` and performs the state transition + log insert.

No destructive changes. All existing RLS untouched.

## Part 5 — Notifications

On any admin subscription action:
1. Insert `notifications` row for workspace owner.
2. Insert `activity_logs` row.
3. Insert `subscription_change_logs` row.
4. Insert `trial_events` row if trial-related.

## Part 6 — Security

- Admin route gated by existing `has_role(auth.uid(),'admin')` / `'super_admin'` check in `beforeLoad` (matches `/admin/payment-gateways` pattern).
- All admin server fns use `requireSupabaseAuth` + verify role via `context.supabase.rpc('has_role', ...)` before touching `supabaseAdmin`.
- Customer page uses authenticated fns; RLS on `billing_subscriptions` already scopes to workspace membership.
- Zod validation on every input.

## Part 7 — UI

Uses existing tokens, cards, badges, skeletons, empty-state, `SearchInput`, `Pagination`. Animated status badges via existing motion primitives. CSV export inline; Excel via `xlsx` (already fine for Worker — pure JS). Dark mode inherited.

## Part 8 — Final QA

- `tsgo` clean, `bun run build:dev` clean.
- Playwright smoke: admin sees table, opens Assign Plan, assigns to a test workspace, customer page reflects new plan and usage.
- Verify RLS with non-admin session (must 403).
- Verify mobile layout at 375px (stacked cards, horizontal scroll table with sticky first column).

## Files (new)

```
src/features/subscription/
  entitlements.ts
  admin.functions.ts              # list, get, assign, extend, upgrade, suspend, resume, cancel, delete
  customer.functions.ts           # my-subscription, usage, invoices
  hooks/use-my-subscription.ts
  hooks/use-admin-subscriptions.ts
  components/
    subscriptions-table.tsx
    assign-plan-dialog.tsx
    subscription-actions-menu.tsx
    customer-plan-card.tsx
    usage-panel.tsx
    billing-history-table.tsx
    export-menu.tsx
src/routes/_authenticated/admin/subscription-management.tsx
src/routes/_authenticated.app.my-subscription.tsx
```

## Files (edited, minimal)

- `src/shared/navigation/sidebar.tsx` — add 2 menu items.
- `src/features/subscription/index.ts` — export barrel.
- Existing `useFeature` hook — read from new `entitlements.ts` (backward compatible).

## Out of scope (unchanged)

Pricing page, checkout modal, payment gateway hub, trial engine, growth engine — all continue to work as-is and integrate through the same subscription rows.

Awaiting approval before implementation.