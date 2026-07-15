
-- =====================================================================
-- LS-13A: Revenue Platform, Subscriptions, Invoices, Coupons
-- =====================================================================

-- Enums
CREATE TYPE public.billing_cycle AS ENUM ('monthly','quarterly','yearly','lifetime');
CREATE TYPE public.subscription_status AS ENUM ('trialing','active','past_due','canceled','paused','expired','incomplete');
CREATE TYPE public.invoice_status AS ENUM ('draft','open','paid','void','uncollectible','refunded');
CREATE TYPE public.payment_status AS ENUM ('pending','succeeded','failed','refunded','partially_refunded');
CREATE TYPE public.coupon_kind AS ENUM ('percentage','flat');
CREATE TYPE public.coupon_duration AS ENUM ('one_time','recurring','forever');
CREATE TYPE public.payment_gateway AS ENUM ('razorpay','stripe','paypal','paddle','manual');

-- helper: workspace admin check (owner or admin role) using existing enums
CREATE OR REPLACE FUNCTION public.is_workspace_admin(_user_id uuid, _workspace_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _workspace_id
      AND role IN ('owner','admin')
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_workspace_admin(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_workspace_admin(uuid,uuid) TO authenticated, service_role;

-- =========================================
-- 1) billing_plans
-- =========================================
CREATE TABLE public.billing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tier TEXT NOT NULL,                          -- free|starter|pro|business|agency|enterprise|custom
  description TEXT,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,   -- {bio_pages, workspaces, seats, storage_mb, ...}
  price_monthly_minor INTEGER,                 -- in smallest currency unit (paise/cents)
  price_quarterly_minor INTEGER,
  price_yearly_minor INTEGER,
  price_lifetime_minor INTEGER,
  currency TEXT NOT NULL DEFAULT 'INR',
  trial_days INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.billing_plans TO anon, authenticated;
GRANT ALL ON public.billing_plans TO service_role;
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans_read_public" ON public.billing_plans FOR SELECT
  USING (is_active AND (is_public OR NOT is_custom));
CREATE POLICY "plans_admin_manage" ON public.billing_plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_plans_updated BEFORE UPDATE ON public.billing_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed base plan catalog
INSERT INTO public.billing_plans (code,name,tier,description,features,limits,price_monthly_minor,price_quarterly_minor,price_yearly_minor,currency,trial_days,sort_order) VALUES
  ('free','Free','free','Explore ZUPIX at no cost','["1 workspace","1 bio page","Basic analytics"]','{"workspaces":1,"bio_pages":1,"seats":1,"storage_mb":100}',0,0,0,'INR',0,10),
  ('starter','Starter','starter','For creators getting started','["3 bio pages","Custom themes","Basic AI"]','{"workspaces":1,"bio_pages":3,"seats":1,"storage_mb":1024}',29900,79900,299000,'INR',7,20),
  ('pro','Pro','pro','For creators & small businesses','["Unlimited bio pages","Advanced analytics","Full AI Studio","Custom domain"]','{"workspaces":2,"bio_pages":-1,"seats":3,"storage_mb":10240}',79900,214900,799000,'INR',14,30),
  ('business','Business','business','For growing teams','["Team seats","SSO","API access","Priority support"]','{"workspaces":5,"bio_pages":-1,"seats":10,"storage_mb":51200}',199900,549900,1999000,'INR',14,40),
  ('agency','Agency','agency','For agencies managing many brands','["White-glove onboarding","20 seats","Workspace roles"]','{"workspaces":20,"bio_pages":-1,"seats":20,"storage_mb":204800}',499900,1349900,4999000,'INR',14,50),
  ('enterprise','Enterprise','enterprise','Custom plan with SLA','["Custom SLA","Dedicated CSM","Custom integrations"]','{"workspaces":-1,"bio_pages":-1,"seats":-1,"storage_mb":-1}',NULL,NULL,NULL,'INR',0,60);

-- =========================================
-- 2) billing_subscriptions
-- =========================================
CREATE TABLE public.billing_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.billing_plans(id),
  status public.subscription_status NOT NULL DEFAULT 'trialing',
  cycle public.billing_cycle NOT NULL DEFAULT 'monthly',
  currency TEXT NOT NULL DEFAULT 'INR',
  unit_amount_minor INTEGER NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  gateway public.payment_gateway,
  gateway_customer_id TEXT,
  gateway_subscription_id TEXT,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  paused_at TIMESTAMPTZ,
  resumed_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  coupon_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id)
);
GRANT SELECT, INSERT, UPDATE ON public.billing_subscriptions TO authenticated;
GRANT ALL ON public.billing_subscriptions TO service_role;
ALTER TABLE public.billing_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_select_members" ON public.billing_subscriptions FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "subs_admin_write" ON public.billing_subscriptions FOR ALL TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));
CREATE INDEX idx_subs_ws ON public.billing_subscriptions(workspace_id);
CREATE INDEX idx_subs_status ON public.billing_subscriptions(status);
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.billing_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 3) billing_coupons
-- =========================================
CREATE TABLE public.billing_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT,
  kind public.coupon_kind NOT NULL,
  amount_off_minor INTEGER,                 -- for flat
  percent_off NUMERIC(5,2),                 -- for percentage
  currency TEXT DEFAULT 'INR',
  duration public.coupon_duration NOT NULL DEFAULT 'one_time',
  duration_in_months INTEGER,
  applies_to_plans TEXT[] NOT NULL DEFAULT '{}',   -- plan codes, empty = all
  applies_to_cycles public.billing_cycle[] NOT NULL DEFAULT '{}',
  max_redemptions INTEGER,
  redeemed_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT coupon_amount_ck CHECK (
    (kind='percentage' AND percent_off IS NOT NULL AND amount_off_minor IS NULL) OR
    (kind='flat' AND amount_off_minor IS NOT NULL AND percent_off IS NULL)
  )
);
GRANT SELECT ON public.billing_coupons TO authenticated;
GRANT ALL ON public.billing_coupons TO service_role;
ALTER TABLE public.billing_coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coupons_read_active" ON public.billing_coupons FOR SELECT TO authenticated
  USING (is_active);
CREATE POLICY "coupons_admin_manage" ON public.billing_coupons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_coupons_updated BEFORE UPDATE ON public.billing_coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 4) billing_coupon_redemptions
-- =========================================
CREATE TABLE public.billing_coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.billing_coupons(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.billing_subscriptions(id) ON DELETE SET NULL,
  invoice_id UUID,
  amount_discounted_minor INTEGER NOT NULL DEFAULT 0,
  currency TEXT,
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.billing_coupon_redemptions TO authenticated;
GRANT ALL ON public.billing_coupon_redemptions TO service_role;
ALTER TABLE public.billing_coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "coup_red_select_members" ON public.billing_coupon_redemptions FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE TRIGGER trg_coup_red_updated BEFORE UPDATE ON public.billing_coupon_redemptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 5) billing_invoices
-- =========================================
CREATE TABLE public.billing_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.billing_subscriptions(id) ON DELETE SET NULL,
  invoice_number TEXT UNIQUE,               -- e.g. INV-2026-000123
  status public.invoice_status NOT NULL DEFAULT 'draft',
  currency TEXT NOT NULL DEFAULT 'INR',
  subtotal_minor INTEGER NOT NULL DEFAULT 0,
  discount_minor INTEGER NOT NULL DEFAULT 0,
  tax_minor INTEGER NOT NULL DEFAULT 0,
  total_minor INTEGER NOT NULL DEFAULT 0,
  amount_paid_minor INTEGER NOT NULL DEFAULT 0,
  amount_due_minor INTEGER NOT NULL DEFAULT 0,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{description, qty, unit_amount, amount, tax_rate, hsn_sac}]
  tax_details JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {type:"GST", rate, cgst, sgst, igst, inclusive}
  billing_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  customer_gstin TEXT,
  seller_gstin TEXT,
  hsn_sac TEXT,
  place_of_supply TEXT,
  issued_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ,
  pdf_url TEXT,
  gateway public.payment_gateway,
  gateway_invoice_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.billing_invoices TO authenticated;
GRANT ALL ON public.billing_invoices TO service_role;
ALTER TABLE public.billing_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invoices_select_members" ON public.billing_invoices FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE INDEX idx_invoices_ws ON public.billing_invoices(workspace_id, issued_at DESC);
CREATE INDEX idx_invoices_status ON public.billing_invoices(status);
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.billing_invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Invoice number sequence
CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1000;
CREATE OR REPLACE FUNCTION public.next_invoice_number()
RETURNS TEXT LANGUAGE sql VOLATILE AS $$
  SELECT 'INV-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');
$$;
GRANT EXECUTE ON FUNCTION public.next_invoice_number() TO authenticated, service_role;

-- =========================================
-- 6) billing_payments
-- =========================================
CREATE TABLE public.billing_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.billing_subscriptions(id) ON DELETE SET NULL,
  invoice_id UUID REFERENCES public.billing_invoices(id) ON DELETE SET NULL,
  gateway public.payment_gateway NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pending',
  amount_minor INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  refund_amount_minor INTEGER NOT NULL DEFAULT 0,
  method TEXT,                                 -- card|upi|netbanking|wallet|...
  gateway_payment_id TEXT,
  gateway_order_id TEXT,
  gateway_signature TEXT,
  failure_reason TEXT,
  captured_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.billing_payments TO authenticated;
GRANT ALL ON public.billing_payments TO service_role;
ALTER TABLE public.billing_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payments_select_members" ON public.billing_payments FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE INDEX idx_payments_ws ON public.billing_payments(workspace_id, created_at DESC);
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON public.billing_payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 7) billing_tax_settings
-- =========================================
CREATE TABLE public.billing_tax_settings (
  workspace_id UUID PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  tax_type TEXT NOT NULL DEFAULT 'GST',          -- GST | VAT | NONE
  gstin TEXT,
  legal_name TEXT,
  country TEXT DEFAULT 'IN',
  state TEXT,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 18.00,
  prices_include_tax BOOLEAN NOT NULL DEFAULT false,
  billing_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.billing_tax_settings TO authenticated;
GRANT ALL ON public.billing_tax_settings TO service_role;
ALTER TABLE public.billing_tax_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tax_select_members" ON public.billing_tax_settings FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "tax_admin_write" ON public.billing_tax_settings FOR ALL TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));
CREATE TRIGGER trg_tax_updated BEFORE UPDATE ON public.billing_tax_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
