
-- Plan features (which features each plan unlocks)
CREATE TABLE public.plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.billing_plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, feature_key)
);
GRANT SELECT ON public.plan_features TO anon, authenticated;
GRANT ALL ON public.plan_features TO service_role;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_features readable by all" ON public.plan_features FOR SELECT USING (true);
CREATE POLICY "plan_features admin write" ON public.plan_features FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Plan limits (quotas per plan)
CREATE TABLE public.plan_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.billing_plans(id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  limit_value bigint NOT NULL DEFAULT 0,
  is_unlimited boolean NOT NULL DEFAULT false,
  soft_limit bigint,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_id, metric_key)
);
GRANT SELECT ON public.plan_limits TO anon, authenticated;
GRANT ALL ON public.plan_limits TO service_role;
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_limits readable by all" ON public.plan_limits FOR SELECT USING (true);
CREATE POLICY "plan_limits admin write" ON public.plan_limits FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Add-ons catalog
CREATE TABLE public.addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  metric_key text,
  quantity_per_unit bigint NOT NULL DEFAULT 1,
  price_minor bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  billing_cycle text NOT NULL DEFAULT 'monthly',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.addons TO anon, authenticated;
GRANT ALL ON public.addons TO service_role;
ALTER TABLE public.addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "addons readable by all" ON public.addons FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "addons admin write" ON public.addons FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Workspace add-on purchases
CREATE TABLE public.workspace_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  addon_id uuid NOT NULL REFERENCES public.addons(id) ON DELETE RESTRICT,
  quantity integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'active',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  gateway text,
  gateway_reference text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_workspace_addons_workspace ON public.workspace_addons(workspace_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_addons TO authenticated;
GRANT ALL ON public.workspace_addons TO service_role;
ALTER TABLE public.workspace_addons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace_addons member read" ON public.workspace_addons FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "workspace_addons admin write" ON public.workspace_addons FOR ALL TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

-- Credit ledger (grants + consumption)
CREATE TABLE public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  credit_type text NOT NULL,
  delta bigint NOT NULL,
  balance_after bigint NOT NULL,
  reason text NOT NULL,
  reference_type text,
  reference_id uuid,
  actor_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_credit_ledger_workspace ON public.credit_ledger(workspace_id, credit_type, created_at DESC);
GRANT SELECT ON public.credit_ledger TO authenticated;
GRANT ALL ON public.credit_ledger TO service_role;
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "credit_ledger member read" ON public.credit_ledger FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Usage counters
CREATE TABLE public.usage_counters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  metric_key text NOT NULL,
  value bigint NOT NULL DEFAULT 0,
  period_start timestamptz NOT NULL DEFAULT date_trunc('month', now()),
  period_end timestamptz NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, metric_key, period_start)
);
CREATE INDEX idx_usage_counters_workspace ON public.usage_counters(workspace_id, metric_key);
GRANT SELECT ON public.usage_counters TO authenticated;
GRANT ALL ON public.usage_counters TO service_role;
ALTER TABLE public.usage_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "usage_counters member read" ON public.usage_counters FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Billing events
CREATE TABLE public.billing_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  subscription_id uuid REFERENCES public.billing_subscriptions(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.billing_invoices(id) ON DELETE SET NULL,
  actor_id uuid,
  from_plan text,
  to_plan text,
  amount_minor bigint,
  currency text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_billing_events_workspace ON public.billing_events(workspace_id, created_at DESC);
GRANT SELECT ON public.billing_events TO authenticated;
GRANT ALL ON public.billing_events TO service_role;
ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "billing_events member read" ON public.billing_events FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Trial extensions
CREATE TABLE public.trial_extensions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.billing_subscriptions(id) ON DELETE SET NULL,
  extended_days integer NOT NULL,
  new_trial_end timestamptz NOT NULL,
  reason text,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trial_extensions TO authenticated;
GRANT ALL ON public.trial_extensions TO service_role;
ALTER TABLE public.trial_extensions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trial_extensions member read" ON public.trial_extensions FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "trial_extensions admin write" ON public.trial_extensions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated-at triggers
CREATE TRIGGER update_plan_features_updated_at BEFORE UPDATE ON public.plan_features FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_plan_limits_updated_at BEFORE UPDATE ON public.plan_limits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_addons_updated_at BEFORE UPDATE ON public.addons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_workspace_addons_updated_at BEFORE UPDATE ON public.workspace_addons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Entitlement check helper
CREATE OR REPLACE FUNCTION public.workspace_has_feature(_workspace_id uuid, _feature_key text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT pf.enabled
       FROM public.billing_subscriptions bs
       JOIN public.plan_features pf ON pf.plan_id = bs.plan_id
      WHERE bs.workspace_id = _workspace_id
        AND bs.status IN ('active','trialing')
        AND pf.feature_key = _feature_key
      LIMIT 1),
    (SELECT ff.enabled
       FROM public.feature_flags ff
      WHERE ff.key = _feature_key
      LIMIT 1),
    false
  );
$$;

-- Usage limit check helper
CREATE OR REPLACE FUNCTION public.workspace_get_limit(_workspace_id uuid, _metric_key text)
RETURNS TABLE(limit_value bigint, is_unlimited boolean)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT pl.limit_value, pl.is_unlimited
    FROM public.billing_subscriptions bs
    JOIN public.plan_limits pl ON pl.plan_id = bs.plan_id
   WHERE bs.workspace_id = _workspace_id
     AND bs.status IN ('active','trialing')
     AND pl.metric_key = _metric_key
   LIMIT 1;
$$;
