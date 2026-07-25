-- Payment Gateway Hub
CREATE TYPE public.payment_provider AS ENUM ('razorpay','payu','cashfree','manual_upi');
CREATE TYPE public.payment_mode AS ENUM ('sandbox','live');
CREATE TYPE public.payment_order_status AS ENUM ('created','pending','paid','failed','refunded','cancelled','manual_review');
CREATE TYPE public.manual_upi_status AS ENUM ('pending','approved','rejected');

-- 1) payment_gateways
CREATE TABLE public.payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  provider public.payment_provider NOT NULL,
  display_name text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  mode public.payment_mode NOT NULL DEFAULT 'sandbox',
  priority int NOT NULL DEFAULT 100,
  credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
  webhook_secret text,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  health_status text NOT NULL DEFAULT 'unknown',
  health_message text,
  health_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pg_workspace ON public.payment_gateways(workspace_id, enabled, priority);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_gateways TO authenticated;
GRANT ALL ON public.payment_gateways TO service_role;
ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;
CREATE POLICY pg_admin_all ON public.payment_gateways FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY pg_ws_admin_all ON public.payment_gateways FOR ALL TO authenticated
  USING (workspace_id IS NOT NULL AND public.is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (workspace_id IS NOT NULL AND public.is_workspace_admin(auth.uid(), workspace_id));
CREATE TRIGGER trg_pg_updated BEFORE UPDATE ON public.payment_gateways FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) payment_orders
CREATE TABLE public.payment_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id uuid REFERENCES public.billing_plans(id) ON DELETE SET NULL,
  gateway_id uuid REFERENCES public.payment_gateways(id) ON DELETE SET NULL,
  provider public.payment_provider NOT NULL,
  provider_order_id text,
  amount_paise bigint NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status public.payment_order_status NOT NULL DEFAULT 'created',
  idempotency_key text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(idempotency_key)
);
CREATE INDEX idx_po_workspace ON public.payment_orders(workspace_id, created_at DESC);
CREATE INDEX idx_po_user ON public.payment_orders(user_id, created_at DESC);
CREATE INDEX idx_po_provider_order ON public.payment_orders(provider, provider_order_id);
GRANT SELECT, INSERT, UPDATE ON public.payment_orders TO authenticated;
GRANT ALL ON public.payment_orders TO service_role;
ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY po_owner_read ON public.payment_orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_workspace_admin(auth.uid(), workspace_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY po_owner_insert ON public.payment_orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY po_admin_update ON public.payment_orders FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_workspace_admin(auth.uid(), workspace_id));
CREATE TRIGGER trg_po_updated BEFORE UPDATE ON public.payment_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) payment_webhook_events (idempotency)
CREATE TABLE public.payment_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider public.payment_provider NOT NULL,
  event_id text NOT NULL,
  order_id uuid REFERENCES public.payment_orders(id) ON DELETE SET NULL,
  event_type text,
  payload jsonb NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, event_id)
);
GRANT SELECT ON public.payment_webhook_events TO authenticated;
GRANT ALL ON public.payment_webhook_events TO service_role;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY pwe_admin_read ON public.payment_webhook_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- 4) manual_upi_submissions
CREATE TABLE public.manual_upi_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.payment_orders(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  submitted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  screenshot_url text,
  txn_ref text,
  notes text,
  status public.manual_upi_status NOT NULL DEFAULT 'pending',
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_mus_workspace ON public.manual_upi_submissions(workspace_id, status);
GRANT SELECT, INSERT, UPDATE ON public.manual_upi_submissions TO authenticated;
GRANT ALL ON public.manual_upi_submissions TO service_role;
ALTER TABLE public.manual_upi_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY mus_owner_read ON public.manual_upi_submissions FOR SELECT TO authenticated
  USING (submitted_by = auth.uid() OR public.is_workspace_admin(auth.uid(), workspace_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY mus_owner_insert ON public.manual_upi_submissions FOR INSERT TO authenticated
  WITH CHECK (submitted_by = auth.uid());
CREATE POLICY mus_admin_update ON public.manual_upi_submissions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_workspace_admin(auth.uid(), workspace_id));
CREATE TRIGGER trg_mus_updated BEFORE UPDATE ON public.manual_upi_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5) Extend billing_payments with gateway link
ALTER TABLE public.billing_payments
  ADD COLUMN IF NOT EXISTS payment_gateway_id uuid REFERENCES public.payment_gateways(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS payment_order_id uuid REFERENCES public.payment_orders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS receipt_url text;
