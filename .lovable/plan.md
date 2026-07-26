# LS-15.0 — Enterprise Billing & Subscription Lifecycle Engine

## Current state

Two parallel systems exist and need to be joined:

- `src/features/billing/*` — subscription/invoice/coupon/tax logic wired to a single Razorpay checkout.
- `src/features/payments/*` — multi-gateway (Razorpay, PayU, Cashfree, Manual UPI) order engine with adapters, webhooks, admin manager.
- `src/features/subscription/*` — Udaan/Tejas/Shikhar plan registry + gating hooks + upgrade modal (LS-14.0).

DB tables already cover the surface: `billing_plans`, `billing_subscriptions`, `billing_invoices`, `billing_payments`, `billing_events`, `payment_orders`, `payment_gateways`, `payment_webhook_events`, `manual_upi_submissions`, `billing_coupons`, `billing_tax_settings`.

Gap: no shared lifecycle glue. Payments engine creates `payment_orders` but never activates a subscription, creates an invoice, or emits an event.

## What this phase builds

Backend + admin + user-facing subscription management. No pricing-page redesign, no new gateway code.

### 1. Lifecycle orchestrator (`src/features/billing/lifecycle.server.ts`)
Single server-only module used by both webhook routes and manual-approval flows:
- `activateSubscription({ workspaceId, planCode, cycle, gateway, paymentOrderId })`
  - Upserts `billing_subscriptions` (workspace_id UNIQUE) with `current_period_start/end` from cycle.
  - Recomputes plan features/limits via existing `has_role` / `workspace_has_feature`.
  - Emits `billing_events` (`subscription.activated`, `subscription.upgraded`, `subscription.downgraded`, `subscription.renewed`).
  - Sends notification via existing `notifications` insert.
- `cancelSubscription(subId, atPeriodEnd)`, `reactivateSubscription(subId)`, `expireSubscription(subId)`.
- `generateInvoice({ workspaceId, subscriptionId, paymentId, planCode, cycle, taxSettings })` — uses `next_invoice_number()`, computes GST split (CGST/SGST vs IGST from place_of_supply), inserts `billing_invoices` + line items, marks paid.
- Idempotent: guarded by `payment_orders.id` + `billing_payments.gateway_payment_id` uniqueness check before write.

### 2. Wire webhooks → lifecycle
Update the three existing routes (`src/routes/api/public/webhooks/{razorpay,payu,cashfree}.ts`) to, on verified success, call `lifecycle.activateSubscription` + `lifecycle.generateInvoice` and record `billing_payments`. Update `src/features/payments/upi.functions.ts` admin-approval path to do the same. Prevent duplicates by checking existing `billing_payments.gateway_payment_id`.

### 3. Multi-gateway checkout on user side
- New `src/features/billing/subscription-checkout.functions.ts`:
  - `startSubscriptionCheckout({ workspaceId, planCode, cycle, gatewayId })` — resolves plan price from `billing_plans`, calls existing `createCheckoutOrder` (payments), returns launch payload.
- New `src/features/billing/components/checkout-drawer.tsx` — gateway picker (from `listAvailableGateways`) + launches provider using existing `CheckoutModal` from `src/features/payments/components/checkout-modal.tsx`.
- Update `UpgradeModal` "Upgrade" CTA to open this drawer (previously stub).

### 4. My Subscription (user)
Extend `BillingDashboard` (no redesign — same layout/tabs):
- Replace single-gateway checkout with the new drawer.
- Add "Change plan" (upgrade/downgrade → same drawer, prorated note shown, actual proration deferred to gateway).
- Add "Renew now" button when `current_period_end < 14 days` or `status = past_due`.
- Add "Reactivate" when `cancel_at_period_end = true`.
- Invoice list: add "Download PDF" button — server fn that renders HTML → returns printable invoice HTML (browser prints to PDF). Fully client-driven PDF via `window.print()` on a dedicated route `/app/billing/invoices/$id/print`.

### 5. Admin Subscription Manager
Extend existing `/admin/subscriptions`:
- Tabs: Overview (MRR/ARR/active/trial/expired counts + gateway usage), Subscribers, Invoices, Payments, Manual UPI queue, Failed payments.
- Actions: Manual activate, manual cancel, retry failed payment, mark invoice paid, refund flag.
- All queries use existing tables via authenticated Supabase (RLS uses `has_role`).

### 6. Notifications
Emit rows into existing `notifications` table on: activated, payment success/failed, renewal reminder (via a `pg_cron`-free server-fn stub `sendRenewalReminders` that admin can trigger; scheduled runs are out of scope), plan expiring, expired, invoice generated. UI already surfaces `notifications` in the topbar.

### 7. React hooks
- `useBilling(workspaceId)` — subscription + plan + limits.
- `usePayments(workspaceId)` — history.
- `useInvoices(workspaceId)` — list + get.
- `useSubscriptionLifecycle(workspaceId)` — mutations: startCheckout, changePlan, cancel, reactivate, renew.

All in `src/features/billing/hooks.ts`, thin wrappers over server fns + `useQuery`/`useMutation`.

## Database migration

Small additive changes only:
- Add missing columns if absent: `billing_subscriptions.previous_plan_id uuid`, `billing_events.actor_user_id uuid`.
- Unique index `billing_payments (gateway, gateway_payment_id) WHERE gateway_payment_id IS NOT NULL` for dedupe.
- Unique index `billing_invoices (subscription_id, issued_at)` NOT added — invoice_number is already unique.
- Ensure `pg_admin_all` policies allow `super_admin` on `billing_invoices`, `billing_payments`, `billing_events` (audit + patch if missing).

## Files to add
- `src/features/billing/lifecycle.server.ts`
- `src/features/billing/subscription-checkout.functions.ts`
- `src/features/billing/invoices.functions.ts` (list/get/generate PDF-print)
- `src/features/billing/hooks.ts`
- `src/features/billing/components/checkout-drawer.tsx`
- `src/features/billing/components/invoice-print.tsx`
- `src/routes/_authenticated.app.billing.invoices.$id.print.tsx`

## Files to modify
- `src/routes/api/public/webhooks/{razorpay,payu,cashfree}.ts` — call lifecycle on success.
- `src/features/payments/upi.functions.ts` — call lifecycle on admin-approve.
- `src/features/billing/billing-dashboard.tsx` — swap checkout to drawer, add lifecycle actions.
- `src/features/subscription/components/upgrade-modal.tsx` — open checkout drawer.
- `src/routes/_authenticated/admin/subscriptions.tsx` — add Overview/Failed/Manual UPI tabs and actions.

## Out of scope (explicit)
- Pricing page redesign.
- New payment gateways.
- Cron/scheduler for renewal reminders (function shipped, scheduling deferred).
- Actual PDF byte generation server-side (uses print-to-PDF).
- Real proration math (upgrade credit) — displayed as "will be prorated by gateway".

## Verification
`tsgo` typecheck, manual walk-through: pick plan → gateway drawer → mock verify (existing demo path) → subscription active + invoice generated + notification created + admin sees row.
