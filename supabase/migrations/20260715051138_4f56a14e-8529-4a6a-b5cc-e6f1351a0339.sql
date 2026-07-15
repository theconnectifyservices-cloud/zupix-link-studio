
-- ============ ENUMS ============
DO $$ BEGIN CREATE TYPE public.partner_status AS ENUM ('pending','approved','suspended','rejected'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.partner_subscription_status AS ENUM ('trialing','active','past_due','cancelled','expired'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.partner_invoice_status AS ENUM ('draft','open','paid','overdue','void','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.partner_payment_status AS ENUM ('pending','succeeded','failed','refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.commission_rule_type AS ENUM ('fixed','percentage','tiered','custom'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.commission_status AS ENUM ('pending','approved','paid','void'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.payout_status AS ENUM ('pending','processing','paid','failed','cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.marketplace_asset_kind AS ENUM ('template','theme','component','prompt_pack','brand_kit','plugin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.marketplace_asset_status AS ENUM ('draft','published','unpublished','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.promotion_discount_type AS ENUM ('percentage','fixed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.promotion_status AS ENUM ('scheduled','active','expired','disabled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ TENANTS extension ============
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS partner_status public.partner_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS default_commission_type public.commission_rule_type NOT NULL DEFAULT 'percentage',
  ADD COLUMN IF NOT EXISTS default_commission_value numeric(12,4) NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS payout_method text,
  ADD COLUMN IF NOT EXISTS payout_details jsonb NOT NULL DEFAULT '{}'::jsonb;

-- ============ PARTNER SUBSCRIPTIONS ============
CREATE TABLE IF NOT EXISTS public.partner_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_key text NOT NULL,
  status public.partner_subscription_status NOT NULL DEFAULT 'trialing',
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  billing_interval text NOT NULL DEFAULT 'month',
  started_at timestamptz NOT NULL DEFAULT now(),
  renewal_at timestamptz,
  cancelled_at timestamptz,
  outstanding_cents integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_subscriptions TO authenticated;
GRANT ALL ON public.partner_subscriptions TO service_role;
ALTER TABLE public.partner_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psub_read" ON public.partner_subscriptions FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "psub_write" ON public.partner_subscriptions FOR ALL TO authenticated USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_psub_updated BEFORE UPDATE ON public.partner_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PARTNER INVOICES ============
CREATE TABLE IF NOT EXISTS public.partner_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.partner_subscriptions(id) ON DELETE SET NULL,
  number text NOT NULL,
  amount_cents integer NOT NULL DEFAULT 0,
  tax_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status public.partner_invoice_status NOT NULL DEFAULT 'open',
  issued_at timestamptz NOT NULL DEFAULT now(),
  due_at timestamptz,
  paid_at timestamptz,
  pdf_url text,
  line_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_invoices TO authenticated;
GRANT ALL ON public.partner_invoices TO service_role;
ALTER TABLE public.partner_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pinv_read" ON public.partner_invoices FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "pinv_write" ON public.partner_invoices FOR ALL TO authenticated USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_pinv_updated BEFORE UPDATE ON public.partner_invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PARTNER PAYMENTS ============
CREATE TABLE IF NOT EXISTS public.partner_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.partner_invoices(id) ON DELETE SET NULL,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  method text,
  status public.partner_payment_status NOT NULL DEFAULT 'pending',
  reference text,
  paid_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_payments TO authenticated;
GRANT ALL ON public.partner_payments TO service_role;
ALTER TABLE public.partner_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ppay_read" ON public.partner_payments FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "ppay_write" ON public.partner_payments FOR ALL TO authenticated USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ppay_updated BEFORE UPDATE ON public.partner_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ COMMISSION RULES ============
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  rule_type public.commission_rule_type NOT NULL DEFAULT 'percentage',
  value numeric(12,4) NOT NULL DEFAULT 0,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  client_id uuid REFERENCES public.reseller_clients(id) ON DELETE CASCADE,
  priority integer NOT NULL DEFAULT 100,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commission_rules TO authenticated;
GRANT ALL ON public.commission_rules TO service_role;
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "crule_read" ON public.commission_rules FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "crule_write" ON public.commission_rules FOR ALL TO authenticated USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_crule_updated BEFORE UPDATE ON public.commission_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ COMMISSIONS ============
CREATE TABLE IF NOT EXISTS public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.reseller_clients(id) ON DELETE SET NULL,
  rule_id uuid REFERENCES public.commission_rules(id) ON DELETE SET NULL,
  invoice_ref text,
  base_amount_cents integer NOT NULL DEFAULT 0,
  commission_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status public.commission_status NOT NULL DEFAULT 'pending',
  earned_at timestamptz NOT NULL DEFAULT now(),
  payout_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.commissions TO authenticated;
GRANT ALL ON public.commissions TO service_role;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comm_read" ON public.commissions FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "comm_write" ON public.commissions FOR ALL TO authenticated USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_comm_updated BEFORE UPDATE ON public.commissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_commissions_tenant_status ON public.commissions(tenant_id, status);

-- ============ PAYOUTS ============
CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  status public.payout_status NOT NULL DEFAULT 'pending',
  method text,
  reference text,
  notes text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  paid_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payout_read" ON public.payouts FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "payout_write" ON public.payouts FOR ALL TO authenticated USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_payout_updated BEFORE UPDATE ON public.payouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ MARKETPLACE CATEGORIES ============
CREATE TABLE IF NOT EXISTS public.marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.marketplace_asset_kind NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, key)
);
GRANT SELECT ON public.marketplace_categories TO anon, authenticated;
GRANT ALL ON public.marketplace_categories TO service_role;
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mcat_read_all" ON public.marketplace_categories FOR SELECT USING (true);
CREATE POLICY "mcat_admin_write" ON public.marketplace_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_mcat_updated BEFORE UPDATE ON public.marketplace_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ MARKETPLACE ASSETS ============
CREATE TABLE IF NOT EXISTS public.marketplace_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  kind public.marketplace_asset_kind NOT NULL,
  title text NOT NULL,
  slug text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  category_key text,
  status public.marketplace_asset_status NOT NULL DEFAULT 'draft',
  featured boolean NOT NULL DEFAULT false,
  version text NOT NULL DEFAULT '1.0.0',
  thumbnail_url text,
  preview_url text,
  asset jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] NOT NULL DEFAULT ARRAY[]::text[],
  downloads integer NOT NULL DEFAULT 0,
  rating numeric(3,2) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  published_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_assets TO authenticated;
GRANT ALL ON public.marketplace_assets TO service_role;
ALTER TABLE public.marketplace_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "masset_read_published" ON public.marketplace_assets FOR SELECT TO authenticated USING (status = 'published' OR public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "masset_write" ON public.marketplace_assets FOR ALL TO authenticated USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_masset_updated BEFORE UPDATE ON public.marketplace_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_masset_kind_status ON public.marketplace_assets(kind, status);
CREATE INDEX IF NOT EXISTS idx_masset_featured ON public.marketplace_assets(featured) WHERE featured = true;

-- ============ MARKETPLACE ASSET VERSIONS ============
CREATE TABLE IF NOT EXISTS public.marketplace_asset_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.marketplace_assets(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  version text NOT NULL,
  changelog text,
  asset jsonb NOT NULL DEFAULT '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, version)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_asset_versions TO authenticated;
GRANT ALL ON public.marketplace_asset_versions TO service_role;
ALTER TABLE public.marketplace_asset_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mver_read" ON public.marketplace_asset_versions FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "mver_write" ON public.marketplace_asset_versions FOR ALL TO authenticated USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));

-- ============ MARKETPLACE REVIEWS (future) ============
CREATE TABLE IF NOT EXISTS public.marketplace_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.marketplace_assets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketplace_reviews TO authenticated;
GRANT ALL ON public.marketplace_reviews TO service_role;
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mrev_read" ON public.marketplace_reviews FOR SELECT TO authenticated USING (true);
CREATE POLICY "mrev_own_write" ON public.marketplace_reviews FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_mrev_updated BEFORE UPDATE ON public.marketplace_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PARTNER PROMOTIONS ============
CREATE TABLE IF NOT EXISTS public.partner_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  description text,
  discount_type public.promotion_discount_type NOT NULL DEFAULT 'percentage',
  discount_value numeric(12,4) NOT NULL DEFAULT 0,
  applies_to jsonb NOT NULL DEFAULT '{}'::jsonb,
  starts_at timestamptz,
  ends_at timestamptz,
  max_redemptions integer,
  redemptions integer NOT NULL DEFAULT 0,
  status public.promotion_status NOT NULL DEFAULT 'scheduled',
  campaign_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partner_promotions TO authenticated;
GRANT ALL ON public.partner_promotions TO service_role;
ALTER TABLE public.partner_promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promo_read" ON public.partner_promotions FOR SELECT TO authenticated USING (public.is_tenant_member(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "promo_write" ON public.partner_promotions FOR ALL TO authenticated USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_promo_updated BEFORE UPDATE ON public.partner_promotions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PARTNER ADMIN ACTIONS (audit) ============
CREATE TABLE IF NOT EXISTS public.partner_admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  action text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.partner_admin_actions TO authenticated;
GRANT ALL ON public.partner_admin_actions TO service_role;
ALTER TABLE public.partner_admin_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "paa_read" ON public.partner_admin_actions FOR SELECT TO authenticated USING (public.is_tenant_admin(auth.uid(), tenant_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "paa_insert_admin" ON public.partner_admin_actions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_tenant_admin(auth.uid(), tenant_id));

-- ============ Seed default marketplace categories ============
INSERT INTO public.marketplace_categories (kind, key, label, sort_order) VALUES
  ('template','business','Business',10),
  ('template','creator','Creator',20),
  ('template','ecommerce','E-Commerce',30),
  ('theme','minimal','Minimal',10),
  ('theme','bold','Bold',20),
  ('component','hero','Hero Blocks',10),
  ('component','forms','Forms',20),
  ('prompt_pack','marketing','Marketing',10),
  ('prompt_pack','social','Social',20),
  ('brand_kit','starter','Starter Kits',10)
ON CONFLICT (kind, key) DO NOTHING;
