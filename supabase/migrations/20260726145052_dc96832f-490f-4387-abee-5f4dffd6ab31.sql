
-- 1. trial_fingerprints: one row per (email|phone) to prevent duplicate trials
CREATE TABLE IF NOT EXISTS public.trial_fingerprints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fingerprint text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('email','phone','workspace')),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, fingerprint)
);
GRANT SELECT ON public.trial_fingerprints TO authenticated;
GRANT ALL ON public.trial_fingerprints TO service_role;
ALTER TABLE public.trial_fingerprints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tf admin read" ON public.trial_fingerprints FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));

-- 2. trial_events
CREATE TABLE IF NOT EXISTS public.trial_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.billing_subscriptions(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN
    ('trial_started','trial_ending_48h','trial_ending_24h','trial_expired','trial_converted','trial_cancelled','trial_extended')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_trial_events_ws ON public.trial_events(workspace_id, created_at DESC);
GRANT SELECT ON public.trial_events TO authenticated;
GRANT ALL ON public.trial_events TO service_role;
ALTER TABLE public.trial_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trial_events members read" ON public.trial_events FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id) OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));

-- 3. upgrade_events
CREATE TABLE IF NOT EXISTS public.upgrade_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  from_plan text,
  to_plan text NOT NULL,
  source text,
  amount_minor integer,
  coupon_code text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_upgrade_events_ws ON public.upgrade_events(workspace_id, created_at DESC);
GRANT SELECT ON public.upgrade_events TO authenticated;
GRANT ALL ON public.upgrade_events TO service_role;
ALTER TABLE public.upgrade_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "upgrade_events members read" ON public.upgrade_events FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id) OR has_role(auth.uid(),'admin') OR has_role(auth.uid(),'super_admin'));

-- 4. Coupon minimum_purchase + kind extension (free_months / free_upgrade)
ALTER TABLE public.billing_coupons
  ADD COLUMN IF NOT EXISTS minimum_purchase_minor integer,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'custom',
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 5. validate_coupon: returns discount + reason
CREATE OR REPLACE FUNCTION public.validate_coupon(
  _code text,
  _workspace_id uuid,
  _plan_code text,
  _cycle text,
  _amount_minor integer
) RETURNS TABLE(valid boolean, coupon_id uuid, discount_minor integer, reason text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.billing_coupons;
BEGIN
  SELECT * INTO c FROM public.billing_coupons WHERE lower(code) = lower(_code) LIMIT 1;
  IF NOT FOUND THEN RETURN QUERY SELECT false, NULL::uuid, 0, 'Coupon not found'; RETURN; END IF;
  IF NOT c.is_active OR c.archived_at IS NOT NULL THEN RETURN QUERY SELECT false, c.id, 0, 'Coupon inactive'; RETURN; END IF;
  IF c.starts_at IS NOT NULL AND now() < c.starts_at THEN RETURN QUERY SELECT false, c.id, 0, 'Coupon not yet active'; RETURN; END IF;
  IF c.expires_at IS NOT NULL AND now() > c.expires_at THEN RETURN QUERY SELECT false, c.id, 0, 'Coupon expired'; RETURN; END IF;
  IF c.max_redemptions IS NOT NULL AND c.redeemed_count >= c.max_redemptions THEN RETURN QUERY SELECT false, c.id, 0, 'Coupon usage limit reached'; RETURN; END IF;
  IF array_length(c.applies_to_plans,1) IS NOT NULL AND NOT (_plan_code = ANY(c.applies_to_plans)) THEN
    RETURN QUERY SELECT false, c.id, 0, 'Coupon not valid for this plan'; RETURN;
  END IF;
  IF array_length(c.applies_to_cycles,1) IS NOT NULL AND NOT (_cycle::billing_cycle = ANY(c.applies_to_cycles)) THEN
    RETURN QUERY SELECT false, c.id, 0, 'Coupon not valid for this billing cycle'; RETURN;
  END IF;
  IF c.minimum_purchase_minor IS NOT NULL AND _amount_minor < c.minimum_purchase_minor THEN
    RETURN QUERY SELECT false, c.id, 0, 'Order amount below coupon minimum'; RETURN;
  END IF;
  IF EXISTS (SELECT 1 FROM public.billing_coupon_redemptions WHERE coupon_id = c.id AND workspace_id = _workspace_id) THEN
    RETURN QUERY SELECT false, c.id, 0, 'Coupon already redeemed for this workspace'; RETURN;
  END IF;
  IF c.kind = 'percentage' THEN
    RETURN QUERY SELECT true, c.id, floor(_amount_minor * COALESCE(c.percent_off,0) / 100.0)::int, 'ok';
  ELSE
    RETURN QUERY SELECT true, c.id, LEAST(COALESCE(c.amount_off_minor,0), _amount_minor), 'ok';
  END IF;
END;$$;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text,uuid,text,text,integer) TO authenticated;

-- 6. Update handle_new_user to start Tejas trial + record fingerprint
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $function$
DECLARE
  ws_id uuid;
  base_slug text; final_slug text; counter int := 0;
  full_name text; tejas_id uuid;
  email_fp text; phone_fp text; is_repeat boolean := false;
BEGIN
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (NEW.id, NEW.email, full_name, NEW.raw_user_meta_data->>'avatar_url');

  base_slug := regexp_replace(lower(split_part(NEW.email, '@', 1)), '[^a-z0-9]', '', 'g');
  IF base_slug = '' OR length(base_slug) < 3 THEN base_slug := 'workspace'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.workspaces WHERE slug = final_slug) LOOP
    counter := counter + 1; final_slug := base_slug || counter::text;
  END LOOP;

  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (full_name || '''s Workspace', final_slug, NEW.id) RETURNING id INTO ws_id;
  INSERT INTO public.workspace_members (workspace_id, user_id, role) VALUES (ws_id, NEW.id, 'owner');
  UPDATE public.profiles SET active_workspace_id = ws_id WHERE id = NEW.id;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer');

  -- Fingerprint check: prevent repeat trials for same email/phone
  email_fp := lower(NEW.email);
  phone_fp := NULLIF(NEW.phone, '');
  IF EXISTS (SELECT 1 FROM public.trial_fingerprints WHERE kind='email' AND fingerprint = email_fp)
     OR (phone_fp IS NOT NULL AND EXISTS (SELECT 1 FROM public.trial_fingerprints WHERE kind='phone' AND fingerprint = phone_fp)) THEN
    is_repeat := true;
  END IF;

  IF NOT is_repeat THEN
    SELECT id INTO tejas_id FROM public.billing_plans WHERE code='tejas' LIMIT 1;
    IF tejas_id IS NOT NULL THEN
      INSERT INTO public.billing_subscriptions
        (workspace_id, plan_id, status, cycle, currency, unit_amount_minor, quantity, trial_start, trial_end, current_period_start, current_period_end, metadata)
      VALUES
        (ws_id, tejas_id, 'trialing', 'monthly', 'INR', 0, 1, now(), now() + interval '3 days', now(), now() + interval '3 days',
         jsonb_build_object('trial','tejas_3day','source','signup'))
      ON CONFLICT (workspace_id) DO NOTHING;
      INSERT INTO public.trial_fingerprints (fingerprint, kind, user_id, workspace_id)
        VALUES (email_fp, 'email', NEW.id, ws_id) ON CONFLICT DO NOTHING;
      IF phone_fp IS NOT NULL THEN
        INSERT INTO public.trial_fingerprints (fingerprint, kind, user_id, workspace_id)
          VALUES (phone_fp, 'phone', NEW.id, ws_id) ON CONFLICT DO NOTHING;
      END IF;
      INSERT INTO public.trial_fingerprints (fingerprint, kind, user_id, workspace_id)
        VALUES (ws_id::text, 'workspace', NEW.id, ws_id) ON CONFLICT DO NOTHING;
      INSERT INTO public.trial_events (workspace_id, event_type, metadata)
        VALUES (ws_id, 'trial_started', jsonb_build_object('plan','tejas','days',3));
      INSERT INTO public.notifications (user_id, workspace_id, type, title, body, action_url)
        VALUES (NEW.id, ws_id, 'system', 'Your 3-day Tejas trial has started 🚀',
                'Explore every Tejas feature free for 3 days. Upgrade any time to keep them.', '/app/billing');
    END IF;
  END IF;

  RETURN NEW;
END; $function$;

-- 7. expire_stale_trials: run periodically to lock premium and emit events/notifications
CREATE OR REPLACE FUNCTION public.expire_stale_trials()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; n int := 0; udaan_id uuid;
BEGIN
  SELECT id INTO udaan_id FROM public.billing_plans WHERE code='udaan' LIMIT 1;
  -- 48h warning
  FOR r IN SELECT s.* FROM public.billing_subscriptions s
    WHERE s.status='trialing' AND s.trial_end IS NOT NULL
      AND s.trial_end BETWEEN now() + interval '47 hours' AND now() + interval '49 hours'
      AND NOT EXISTS (SELECT 1 FROM public.trial_events e WHERE e.subscription_id = s.id AND e.event_type='trial_ending_48h')
  LOOP
    INSERT INTO public.trial_events (workspace_id, subscription_id, event_type) VALUES (r.workspace_id, r.id, 'trial_ending_48h');
    INSERT INTO public.notifications (user_id, workspace_id, type, title, body, action_url)
      SELECT owner_id, r.workspace_id, 'system', 'Trial ends in 48 hours',
             'Upgrade to keep Tejas features unlocked.', '/app/billing'
        FROM public.workspaces WHERE id = r.workspace_id;
  END LOOP;
  -- 24h warning
  FOR r IN SELECT s.* FROM public.billing_subscriptions s
    WHERE s.status='trialing' AND s.trial_end IS NOT NULL
      AND s.trial_end BETWEEN now() + interval '23 hours' AND now() + interval '25 hours'
      AND NOT EXISTS (SELECT 1 FROM public.trial_events e WHERE e.subscription_id = s.id AND e.event_type='trial_ending_24h')
  LOOP
    INSERT INTO public.trial_events (workspace_id, subscription_id, event_type) VALUES (r.workspace_id, r.id, 'trial_ending_24h');
    INSERT INTO public.notifications (user_id, workspace_id, type, title, body, action_url)
      SELECT owner_id, r.workspace_id, 'system', 'Trial ends in 24 hours ⏰',
             'Your Tejas trial ends tomorrow. Upgrade to keep unlimited access.', '/app/billing'
        FROM public.workspaces WHERE id = r.workspace_id;
  END LOOP;
  -- expiry
  FOR r IN SELECT s.* FROM public.billing_subscriptions s
    WHERE s.status='trialing' AND s.trial_end IS NOT NULL AND s.trial_end < now()
  LOOP
    UPDATE public.billing_subscriptions
      SET status='expired', ended_at=now(),
          plan_id = COALESCE(udaan_id, plan_id),
          unit_amount_minor = 0
      WHERE id = r.id;
    INSERT INTO public.trial_events (workspace_id, subscription_id, event_type) VALUES (r.workspace_id, r.id, 'trial_expired');
    INSERT INTO public.notifications (user_id, workspace_id, type, title, body, action_url)
      SELECT owner_id, r.workspace_id, 'system', 'Your trial has ended',
             'Premium features are now locked. Upgrade to Tejas to restore access — your data is safe.', '/app/billing'
        FROM public.workspaces WHERE id = r.workspace_id;
    n := n + 1;
  END LOOP;
  RETURN n;
END;$$;
GRANT EXECUTE ON FUNCTION public.expire_stale_trials() TO authenticated;

-- 8. Schedule hourly maintenance
CREATE EXTENSION IF NOT EXISTS pg_cron;
DO $$ BEGIN
  PERFORM cron.unschedule('zupix-trial-maintenance');
EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule('zupix-trial-maintenance', '0 * * * *', $$SELECT public.expire_stale_trials();$$);
