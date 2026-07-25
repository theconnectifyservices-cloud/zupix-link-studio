# Enterprise Payment Gateway Hub

Build a pluggable multi-gateway payment layer on top of the existing `src/features/billing/` foundation. Everything below is configurable from Super Admin — no hardcoded keys or payment links.

## Architecture

```text
src/features/payments/
  gateways/
    types.ts              // GatewayAdapter interface (createOrder, verify, refund, health)
    razorpay.adapter.ts
    payu.adapter.ts
    cashfree.adapter.ts
    manual-upi.adapter.ts
    registry.ts           // id -> adapter; loads dynamically; no hardcoded switch statements
  server/
    checkout.functions.ts // createOrder, listGateways (smart selector)
    verify.functions.ts   // signature verification per adapter
    admin.functions.ts    // super-admin CRUD, test-connection, health-check
    upi.functions.ts      // upload proof, approve/reject
  components/
    checkout-modal.tsx    // premium modal: summary, gateway picker, success/failure
    gateway-picker.tsx
    upi-qr-flow.tsx
    payment-history.tsx
    admin/
      gateway-manager.tsx
      gateway-form.tsx
      upi-verification-queue.tsx
```

New TanStack public API route: `src/routes/api/public/webhooks/{razorpay,payu,cashfree}.ts` — signature-verified, idempotent by provider event id.

## Database (single migration)

- `payment_gateways` — id, workspace-nullable (null = global default), provider (`razorpay|payu|cashfree|manual_upi`), enabled, mode (`sandbox|live`), priority, credentials JSONB (encrypted at rest via Supabase Vault-style column obfuscation; secret keys never returned to client), webhook_secret, health_status, health_checked_at, config JSONB (UPI id, QR url, instructions for manual).
- `payment_orders` — id, workspace_id, plan_id, gateway_id, provider_order_id, amount, currency, status (`created|pending|paid|failed|refunded|manual_review`), idempotency_key, meta JSONB.
- `payment_webhook_events` — provider, event_id UNIQUE, order_id, payload, processed_at (idempotency table).
- `manual_upi_submissions` — order_id, screenshot_url, txn_ref, submitted_by, reviewed_by, status, notes.
- Extend `billing_payments` with `gateway_id`, `provider_ref`, `receipt_url`.
- RLS: workspace members read own orders/submissions; only `admin` role writes to `payment_gateways`; webhook table is service-role only. All new tables get GRANT + policies.

## Super Admin — Gateway Manager

Route: `/admin/payments` (existing admin layout).
- List cards per gateway with logo, enable toggle, sandbox/live switch, priority arrows, health badge (green/amber/red), Test Connection button (calls adapter `health()`), Edit credentials (drawer).
- Manual UPI form: upload QR image (existing media bucket), UPI ID, account name, instructions, review queue with Approve / Reject / Mark Paid actions triggering plan activation.
- Credentials stored via `admin.functions.ts` using `supabaseAdmin` after role check; response omits secret fields.

## Smart Gateway Selector + Checkout

- Pricing page cards ("Start Free Trial", "Buy Now", "Upgrade", "Renew") open the shared `CheckoutModal` with the plan.
- Modal calls `listGateways({ workspaceId })` — returns only enabled gateways whose most-recent health check passed, sorted by priority.
- User picks a gateway → `createOrder` returns adapter-specific launch payload (Razorpay checkout options, PayU form fields, Cashfree session id, or UPI QR + instructions).
- Client script for each adapter is lazy-loaded only when selected.
- On failure, "Retry" re-runs order creation on the next healthy gateway.
- Success animation + failure screen + placeholders (disabled inputs) for GST and coupon fields.

## Webhooks

- Each provider route verifies HMAC signature over raw body, inserts into `payment_webhook_events` (unique on `event_id` for dedupe), then transitions the order and creates a `billing_payments` + `billing_invoices` row.
- Handles: success, failure, pending, refund, cancellation.
- Manual UPI has no webhook — admin approval triggers the same transition path.

## Emails

Reuse existing `@lovable.dev/email-js` scaffolding: on `payment.succeeded` transition, send Invoice + Receipt + Welcome (first payment only) via the send helper. React Email templates in `src/emails/payments/`.

## Payment History

`/app/billing` gains a "History" tab: table of orders with plan, amount, gateway logo, status pill, provider ref, "Download Receipt" (PDF endpoint using `@react-pdf/renderer` in a server route).

## Security

- Secret keys never leave the server; API responses redact `credentials.*_secret`.
- Signature verification is mandatory before any state change.
- Idempotency via `payment_webhook_events.event_id` unique constraint AND `payment_orders.idempotency_key`.
- All webhooks live under `/api/public/*` and verify signatures — no auth bypass abuse.
- Admin routes gated by `has_role(uid, 'admin')`.

## Secrets requested (per gateway, sandbox + live)

Only after user confirms this plan I'll request via `add_secret`:
`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `PAYU_MERCHANT_KEY`, `PAYU_MERCHANT_SALT`, `CASHFREE_APP_ID`, `CASHFREE_SECRET_KEY`, `CASHFREE_WEBHOOK_SECRET`. (Or, if you prefer, credentials are entered only through the Super Admin UI and stored per-gateway row — no env secrets. **Please confirm which model you want.**)

## Delivery order

1. Migration (tables + RLS + GRANT).
2. Adapter interface + 4 adapters (server-only).
3. Super Admin Gateway Manager UI.
4. Checkout modal + smart selector wired into pricing cards.
5. Webhook routes + idempotency + email dispatch.
6. Payment history + receipt PDF.
7. QA sweep: sandbox order per gateway, forced-failure retry, webhook replay dedupe, UPI approve/reject, offline-gateway failover.

## Open questions before I start

1. **Credentials source of truth** — Super Admin UI only (stored encrypted in DB), or also env-based secrets as fallback? I recommend UI-only for true multi-tenant configurability.
2. **Currency scope** — INR only (given UPI/Razorpay/PayU/Cashfree), or multi-currency needed now?
3. **Receipt PDF** — server-generated PDF (adds `@react-pdf/renderer`), or HTML receipt page + browser print for v1?

Reply with answers (or "go with your recommendations") and I'll ship it end-to-end in the order above.
