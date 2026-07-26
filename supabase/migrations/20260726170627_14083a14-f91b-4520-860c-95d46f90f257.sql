
-- Growth engine settings (singleton row keyed by id='default')
CREATE TABLE IF NOT EXISTS public.growth_engine_settings (
  id text PRIMARY KEY DEFAULT 'default',
  floating_badge_enabled boolean NOT NULL DEFAULT true,
  footer_cta_enabled boolean NOT NULL DEFAULT true,
  upgrade_card_enabled boolean NOT NULL DEFAULT true,
  qr_branding_enabled boolean NOT NULL DEFAULT true,
  og_branding_enabled boolean NOT NULL DEFAULT true,
  dynamic_industry_cta_enabled boolean NOT NULL DEFAULT true,
  referral_cta_enabled boolean NOT NULL DEFAULT true,
  badge_text text NOT NULL DEFAULT 'Built with ZUPIX',
  badge_subtext text NOT NULL DEFAULT 'Create Yours FREE',
  footer_headline text NOT NULL DEFAULT 'This beautiful Bio Link was created using ZUPIX Link Studio.',
  footer_subtext text NOT NULL DEFAULT 'Create your own professional Bio Link FREE in under 60 seconds.',
  footer_cta_label text NOT NULL DEFAULT 'Create Free',
  referral_headline text NOT NULL DEFAULT 'Love this Bio Link?',
  referral_subtext text NOT NULL DEFAULT 'Create Yours FREE',
  referral_cta_label text NOT NULL DEFAULT 'Start Building',
  redirect_url text NOT NULL DEFAULT '/signup',
  accent_color text NOT NULL DEFAULT '#7c3aed',
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.growth_engine_settings TO anon, authenticated;
GRANT ALL ON public.growth_engine_settings TO service_role;

ALTER TABLE public.growth_engine_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "growth settings readable by everyone"
  ON public.growth_engine_settings FOR SELECT
  USING (true);

CREATE POLICY "growth settings editable by super admins"
  ON public.growth_engine_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

INSERT INTO public.growth_engine_settings (id) VALUES ('default')
  ON CONFLICT (id) DO NOTHING;

-- Public helper: resolve a workspace's active plan code without exposing billing rows.
CREATE OR REPLACE FUNCTION public.public_workspace_plan(_workspace_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(p.code, 'udaan')
  FROM public.billing_subscriptions s
  LEFT JOIN public.billing_plans p ON p.id = s.plan_id
  WHERE s.workspace_id = _workspace_id
    AND s.status IN ('active', 'trialing', 'past_due')
  ORDER BY s.created_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.public_workspace_plan(uuid) TO anon, authenticated;
