ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ws_id uuid;
  base_slug text; final_slug text; counter int := 0;
  full_name text; tejas_id uuid;
  email_fp text; phone_fp text; is_repeat boolean := false;
BEGIN
  full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
    NULLIF(NEW.phone, ''),
    'New user'
  );

  INSERT INTO public.profiles (id, email, phone, display_name, avatar_url)
  VALUES (NEW.id, NEW.email, NULLIF(NEW.phone, ''), full_name, NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  base_slug := regexp_replace(
    lower(COALESCE(NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''), NULLIF(NEW.phone, ''), '')),
    '[^a-z0-9]', '', 'g'
  );
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
    NULL;
  END;

  RETURN NEW;
END;
$function$;