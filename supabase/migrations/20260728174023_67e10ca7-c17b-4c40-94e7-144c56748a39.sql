
-- 1) Idempotent trial activator callable by the app
CREATE OR REPLACE FUNCTION public.ensure_tejas_trial(_workspace_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  ws record;
  u  record;
  tejas_id uuid;
  udaan_id uuid;
  email_fp text;
  phone_fp text;
  existing_sub record;
  new_sub_id uuid;
BEGIN
  SELECT id, owner_id, name INTO ws FROM public.workspaces WHERE id = _workspace_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'workspace_not_found');
  END IF;

  IF auth.uid() IS NULL OR auth.uid() <> ws.owner_id THEN
    -- only the workspace owner can self-activate
    IF NOT public.has_role(auth.uid(),'admin') AND NOT public.has_role(auth.uid(),'super_admin') THEN
      RETURN jsonb_build_object('ok', false, 'reason', 'not_owner');
    END IF;
  END IF;

  SELECT id, email, phone INTO u FROM auth.users WHERE id = ws.owner_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'user_not_found');
  END IF;

  SELECT id INTO tejas_id FROM public.billing_plans WHERE code='tejas' LIMIT 1;
  SELECT id INTO udaan_id FROM public.billing_plans WHERE code='udaan' LIMIT 1;
  IF tejas_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'plan_missing');
  END IF;

  -- Existing subscription? (unique per workspace)
  SELECT id, status, plan_id, trial_end INTO existing_sub
    FROM public.billing_subscriptions
   WHERE workspace_id = _workspace_id
   LIMIT 1;

  IF FOUND AND existing_sub.status IN ('trialing','active','past_due') THEN
    RETURN jsonb_build_object('ok', true, 'already', true, 'subscription_id', existing_sub.id);
  END IF;

  email_fp := lower(coalesce(u.email,''));
  phone_fp := NULLIF(u.phone, '');

  IF (email_fp <> '' AND EXISTS (
        SELECT 1 FROM public.trial_fingerprints
         WHERE kind='email' AND fingerprint = email_fp
           AND (user_id IS DISTINCT FROM u.id)
      ))
     OR (phone_fp IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.trial_fingerprints
         WHERE kind='phone' AND fingerprint = phone_fp
           AND (user_id IS DISTINCT FROM u.id)
      )) THEN
    -- Repeat trial not allowed; leave as Udaan free
    IF NOT FOUND AND udaan_id IS NOT NULL THEN
      INSERT INTO public.billing_subscriptions
        (workspace_id, plan_id, status, cycle, currency, unit_amount_minor, quantity,
         current_period_start, current_period_end)
      VALUES
        (_workspace_id, udaan_id, 'active', 'monthly', 'INR', 0, 1, now(), now() + interval '100 years')
      ON CONFLICT (workspace_id) DO NOTHING;
    END IF;
    RETURN jsonb_build_object('ok', false, 'reason', 'repeat_trial_blocked');
  END IF;

  -- Create or replace the subscription as Tejas trialing
  IF FOUND THEN
    UPDATE public.billing_subscriptions
       SET plan_id = tejas_id,
           status = 'trialing',
           cycle = 'monthly',
           currency = 'INR',
           unit_amount_minor = 0,
           trial_start = now(),
           trial_end = now() + interval '3 days',
           current_period_start = now(),
           current_period_end = now() + interval '3 days',
           cancel_at_period_end = false,
           canceled_at = NULL,
           ended_at = NULL,
           metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('trial','tejas_3day','source','ensure_tejas_trial')
     WHERE id = existing_sub.id
     RETURNING id INTO new_sub_id;
  ELSE
    INSERT INTO public.billing_subscriptions
      (workspace_id, plan_id, status, cycle, currency, unit_amount_minor, quantity,
       trial_start, trial_end, current_period_start, current_period_end, metadata)
    VALUES
      (_workspace_id, tejas_id, 'trialing', 'monthly', 'INR', 0, 1,
       now(), now() + interval '3 days', now(), now() + interval '3 days',
       jsonb_build_object('trial','tejas_3day','source','ensure_tejas_trial'))
    RETURNING id INTO new_sub_id;
  END IF;

  -- Fingerprints
  IF email_fp <> '' THEN
    INSERT INTO public.trial_fingerprints (fingerprint, kind, user_id, workspace_id)
      VALUES (email_fp, 'email', u.id, _workspace_id)
    ON CONFLICT (kind, fingerprint) DO NOTHING;
  END IF;
  IF phone_fp IS NOT NULL THEN
    INSERT INTO public.trial_fingerprints (fingerprint, kind, user_id, workspace_id)
      VALUES (phone_fp, 'phone', u.id, _workspace_id)
    ON CONFLICT (kind, fingerprint) DO NOTHING;
  END IF;
  INSERT INTO public.trial_fingerprints (fingerprint, kind, user_id, workspace_id)
    VALUES (_workspace_id::text, 'workspace', u.id, _workspace_id)
  ON CONFLICT (kind, fingerprint) DO NOTHING;

  -- Log + notify (best-effort)
  BEGIN
    INSERT INTO public.trial_events (workspace_id, subscription_id, event_type, metadata)
      VALUES (_workspace_id, new_sub_id, 'trial_started', jsonb_build_object('plan','tejas','days',3));
  EXCEPTION WHEN OTHERS THEN NULL; END;

  BEGIN
    INSERT INTO public.notifications (user_id, workspace_id, type, title, body, action_url)
      VALUES (u.id, _workspace_id, 'billing', 'Your 3-day Tejas trial is active 🚀',
              'Enjoy every Tejas feature free for 3 days. Upgrade any time to keep them.', '/app/my-subscription');
  EXCEPTION WHEN OTHERS THEN NULL; END;

  RETURN jsonb_build_object('ok', true, 'subscription_id', new_sub_id, 'trial_end', (now() + interval '3 days'));
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_tejas_trial(uuid) TO authenticated, service_role;

-- 2) Harden handle_new_user so trial provisioning failures never break signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ws_id uuid;
  base_slug text; final_slug text; counter int := 0;
  full_name text; tejas_id uuid;
  email_fp text; phone_fp text; is_repeat boolean := false;
BEGIN
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (NEW.id, NEW.email, full_name, NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  base_slug := regexp_replace(lower(split_part(NEW.email, '@', 1)), '[^a-z0-9]', '', 'g');
  IF base_slug = '' OR length(base_slug) < 3 THEN base_slug := 'workspace'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.workspaces WHERE slug = final_slug) LOOP
    counter := counter + 1; final_slug := base_slug || counter::text;
  END LOOP;

  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (full_name || '''s Workspace', final_slug, NEW.id) RETURNING id INTO ws_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (ws_id, NEW.id, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  UPDATE public.profiles SET active_workspace_id = ws_id WHERE id = NEW.id;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;

  -- Best-effort Tejas trial provisioning (never abort signup)
  BEGIN
    email_fp := lower(coalesce(NEW.email,''));
    phone_fp := NULLIF(NEW.phone, '');
    IF email_fp <> '' AND EXISTS (SELECT 1 FROM public.trial_fingerprints WHERE kind='email' AND fingerprint = email_fp)
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

        IF email_fp <> '' THEN
          INSERT INTO public.trial_fingerprints (fingerprint, kind, user_id, workspace_id)
            VALUES (email_fp, 'email', NEW.id, ws_id)
          ON CONFLICT (kind, fingerprint) DO NOTHING;
        END IF;
        IF phone_fp IS NOT NULL THEN
          INSERT INTO public.trial_fingerprints (fingerprint, kind, user_id, workspace_id)
            VALUES (phone_fp, 'phone', NEW.id, ws_id)
          ON CONFLICT (kind, fingerprint) DO NOTHING;
        END IF;
        INSERT INTO public.trial_fingerprints (fingerprint, kind, user_id, workspace_id)
          VALUES (ws_id::text, 'workspace', NEW.id, ws_id)
        ON CONFLICT (kind, fingerprint) DO NOTHING;

        INSERT INTO public.trial_events (workspace_id, event_type, metadata)
          VALUES (ws_id, 'trial_started', jsonb_build_object('plan','tejas','days',3));

        INSERT INTO public.notifications (user_id, workspace_id, type, title, body, action_url)
          VALUES (NEW.id, ws_id, 'billing', 'Your 3-day Tejas trial is active 🚀',
                  'Enjoy every Tejas feature free for 3 days. Upgrade any time to keep them.', '/app/my-subscription');
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Swallow trial errors; signup must always succeed
    NULL;
  END;

  RETURN NEW;
END;
$$;

-- 3) Backfill: give existing owners a trial if they don't have any subscription
DO $$
DECLARE
  r record;
  tejas_id uuid;
  fp_hit boolean;
  owner_email text;
  owner_phone text;
BEGIN
  SELECT id INTO tejas_id FROM public.billing_plans WHERE code='tejas' LIMIT 1;
  IF tejas_id IS NULL THEN RETURN; END IF;

  FOR r IN
    SELECT w.id AS ws_id, w.owner_id
      FROM public.workspaces w
      LEFT JOIN public.billing_subscriptions bs ON bs.workspace_id = w.id
     WHERE bs.id IS NULL
       AND w.owner_id IS NOT NULL
  LOOP
    SELECT email, phone INTO owner_email, owner_phone FROM auth.users WHERE id = r.owner_id;
    IF owner_email IS NULL THEN CONTINUE; END IF;

    SELECT EXISTS(
      SELECT 1 FROM public.trial_fingerprints
       WHERE (kind='email' AND fingerprint = lower(owner_email))
          OR (kind='phone' AND owner_phone IS NOT NULL AND fingerprint = owner_phone)
    ) INTO fp_hit;

    IF fp_hit THEN CONTINUE; END IF;

    INSERT INTO public.billing_subscriptions
      (workspace_id, plan_id, status, cycle, currency, unit_amount_minor, quantity,
       trial_start, trial_end, current_period_start, current_period_end, metadata)
    VALUES
      (r.ws_id, tejas_id, 'trialing', 'monthly', 'INR', 0, 1,
       now(), now() + interval '3 days', now(), now() + interval '3 days',
       jsonb_build_object('trial','tejas_3day','source','backfill'))
    ON CONFLICT (workspace_id) DO NOTHING;

    INSERT INTO public.trial_fingerprints (fingerprint, kind, user_id, workspace_id)
      VALUES (lower(owner_email), 'email', r.owner_id, r.ws_id)
    ON CONFLICT (kind, fingerprint) DO NOTHING;

    IF owner_phone IS NOT NULL THEN
      INSERT INTO public.trial_fingerprints (fingerprint, kind, user_id, workspace_id)
        VALUES (owner_phone, 'phone', r.owner_id, r.ws_id)
      ON CONFLICT (kind, fingerprint) DO NOTHING;
    END IF;

    BEGIN
      INSERT INTO public.trial_events (workspace_id, event_type, metadata)
        VALUES (r.ws_id, 'trial_started', jsonb_build_object('plan','tejas','days',3,'source','backfill'));
    EXCEPTION WHEN OTHERS THEN NULL; END;
  END LOOP;
END $$;
