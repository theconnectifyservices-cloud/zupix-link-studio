
-- === ZUPIX Plan seeds ============================================
-- Reuse existing billing_plans / plan_features / plan_limits.

INSERT INTO public.billing_plans
  (code, name, tier, description, features, limits, price_monthly_minor, price_quarterly_minor, price_yearly_minor, price_lifetime_minor, currency, trial_days, is_public, is_custom, is_active, sort_order)
VALUES
  ('udaan',   '🌱 Udaan',   'free',     'Perfect for individuals starting their digital identity.', '[]'::jsonb, '{}'::jsonb, 0,      NULL, 0,      NULL, 'INR', 0, true, false, true, 10),
  ('tejas',   '🚀 Tejas',   'pro',      'Professional toolkit for growing businesses.',             '[]'::jsonb, '{}'::jsonb, 29900,  NULL, 259900, NULL, 'INR', 0, true, false, true, 20),
  ('shikhar', '👑 Shikhar', 'business', 'Commerce, memberships, bookings and beyond.',              '[]'::jsonb, '{"coming_soon": true, "waitlist": true, "badge": "Launching Soon"}'::jsonb, 49900, NULL, 399900, NULL, 'INR', 0, true, false, true, 30)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tier = EXCLUDED.tier,
  description = EXCLUDED.description,
  price_monthly_minor = EXCLUDED.price_monthly_minor,
  price_yearly_minor  = EXCLUDED.price_yearly_minor,
  currency = EXCLUDED.currency,
  is_public = EXCLUDED.is_public,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  limits = COALESCE(public.billing_plans.limits, '{}'::jsonb) || EXCLUDED.limits;

-- Update shikhar metadata via a separate UPDATE (billing_plans has no metadata column by default; store in limits jsonb only if needed)
-- If billing_plans has a metadata column, set coming_soon there:
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='billing_plans' AND column_name='metadata') THEN
    UPDATE public.billing_plans SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"coming_soon": true, "waitlist": true, "badge": "Launching Soon"}'::jsonb WHERE code = 'shikhar';
  END IF;
END $$;

-- === Feature matrix ==============================================
-- Feature keys are block ids + platform features. plan_features has (plan_id, feature_key, enabled).

WITH plans AS (
  SELECT id, code FROM public.billing_plans WHERE code IN ('udaan','tejas','shikhar')
),
feats(feature_key) AS (
  VALUES
    ('block.profile'),('block.heading'),('block.text'),('block.button'),('block.button_group'),
    ('block.divider'),('block.spacer'),('block.social'),('block.image'),('block.gallery'),
    ('block.video'),('block.social_feed'),('block.contact_card'),
    ('block.testimonials'),('block.faq'),('block.countdown'),('block.map'),('block.file_download'),
    ('block.embed'),('block.custom_code'),('block.form'),
    ('block.store'),('block.bookings'),('block.digital_products'),('block.membership'),
    ('block.subscriptions'),('block.donations'),('block.payments'),
    ('remove_branding'),('custom_domain')
),
-- Udaan free features
udaan_keys AS (
  SELECT unnest(ARRAY[
    'block.profile','block.heading','block.text','block.button','block.button_group',
    'block.divider','block.spacer','block.social','block.image','block.gallery',
    'block.video','block.social_feed','block.contact_card'
  ]) AS feature_key
),
tejas_keys AS (
  SELECT unnest(ARRAY[
    'block.profile','block.heading','block.text','block.button','block.button_group',
    'block.divider','block.spacer','block.social','block.image','block.gallery',
    'block.video','block.social_feed','block.contact_card',
    'block.testimonials','block.faq','block.countdown','block.map','block.file_download',
    'block.embed','block.custom_code','block.form',
    'remove_branding','custom_domain'
  ]) AS feature_key
),
shikhar_keys AS (
  SELECT unnest(ARRAY[
    'block.profile','block.heading','block.text','block.button','block.button_group',
    'block.divider','block.spacer','block.social','block.image','block.gallery',
    'block.video','block.social_feed','block.contact_card',
    'block.testimonials','block.faq','block.countdown','block.map','block.file_download',
    'block.embed','block.custom_code','block.form',
    'remove_branding','custom_domain',
    'block.store','block.bookings','block.digital_products','block.membership',
    'block.subscriptions','block.donations','block.payments'
  ]) AS feature_key
)
INSERT INTO public.plan_features (plan_id, feature_key, enabled, config)
SELECT p.id, f.feature_key, true, '{}'::jsonb
FROM plans p
JOIN feats f ON true
JOIN LATERAL (
  SELECT feature_key FROM udaan_keys   WHERE p.code='udaan'   AND udaan_keys.feature_key   = f.feature_key
  UNION ALL
  SELECT feature_key FROM tejas_keys   WHERE p.code='tejas'   AND tejas_keys.feature_key   = f.feature_key
  UNION ALL
  SELECT feature_key FROM shikhar_keys WHERE p.code='shikhar' AND shikhar_keys.feature_key = f.feature_key
) match ON true
ON CONFLICT (plan_id, feature_key) DO UPDATE SET enabled = EXCLUDED.enabled;

-- === Limits ======================================================
WITH plans AS (SELECT id, code FROM public.billing_plans WHERE code IN ('udaan','tejas','shikhar'))
INSERT INTO public.plan_limits (plan_id, metric_key, limit_value, is_unlimited, soft_limit)
SELECT p.id, m.metric_key, m.limit_value, m.is_unlimited, NULL
FROM plans p
JOIN (VALUES
  ('udaan',   'bio_pages',       1,          false),
  ('udaan',   'custom_domains',  0,          false),
  ('tejas',   'bio_pages',       20,         false),
  ('tejas',   'custom_domains',  1,          false),
  ('shikhar', 'bio_pages',       0,          true),
  ('shikhar', 'custom_domains',  0,          true)
) AS m(code, metric_key, limit_value, is_unlimited) ON m.code = p.code
ON CONFLICT (plan_id, metric_key) DO UPDATE
  SET limit_value = EXCLUDED.limit_value, is_unlimited = EXCLUDED.is_unlimited;

-- === Waitlist ====================================================
CREATE TABLE IF NOT EXISTS public.plan_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  plan_code TEXT NOT NULL,
  email TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plan_waitlist_plan_idx ON public.plan_waitlist (plan_code);
CREATE UNIQUE INDEX IF NOT EXISTS plan_waitlist_unique_email ON public.plan_waitlist (plan_code, lower(email));

GRANT SELECT, INSERT ON public.plan_waitlist TO authenticated;
GRANT ALL ON public.plan_waitlist TO service_role;

ALTER TABLE public.plan_waitlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS waitlist_insert_own ON public.plan_waitlist;
CREATE POLICY waitlist_insert_own ON public.plan_waitlist
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS waitlist_select_own ON public.plan_waitlist;
CREATE POLICY waitlist_select_own ON public.plan_waitlist
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS waitlist_admin_select ON public.plan_waitlist;
CREATE POLICY waitlist_admin_select ON public.plan_waitlist
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS waitlist_admin_delete ON public.plan_waitlist;
CREATE POLICY waitlist_admin_delete ON public.plan_waitlist
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
