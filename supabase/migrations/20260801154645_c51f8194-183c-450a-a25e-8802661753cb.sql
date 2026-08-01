-- 1. receipt columns
ALTER TABLE public.platform_update_receipts
  ADD COLUMN IF NOT EXISTS skipped_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_prompt_at timestamptz;

-- 2. installed version on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS installed_app_version text,
  ADD COLUMN IF NOT EXISTS installed_app_version_at timestamptz;

-- 3. user feed now exposes skip state + prompt date
DROP FUNCTION IF EXISTS public.platform_my_versions();
CREATE OR REPLACE FUNCTION public.platform_my_versions()
RETURNS TABLE(id uuid, version text, title text, description text, whats_new text[], bug_fixes text[], performance_improvements text[], security_updates text[], release_date date, release_type platform_release_type, priority platform_update_priority, banner_image_url text, video_url text, docs_url text, is_forced boolean, is_important boolean, is_pinned boolean, published_at timestamptz, version_sort bigint, seen_at timestamptz, read_at timestamptz, dismissed_at timestamptz, never_show_at timestamptz, updated_at_action timestamptz, skipped_at timestamptz, last_prompt_at timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT v.id, v.version, v.title, v.description,
         v.whats_new, v.bug_fixes, v.performance_improvements, v.security_updates,
         v.release_date, v.release_type, v.priority,
         v.banner_image_url, v.video_url, v.docs_url,
         v.is_forced, v.is_important, v.is_pinned,
         v.published_at, v.version_sort,
         r.seen_at, r.read_at, r.dismissed_at, r.never_show_at, r.updated_at_action,
         r.skipped_at, r.last_prompt_at
    FROM public.platform_versions v
    LEFT JOIN public.platform_update_receipts r
      ON r.version_id = v.id AND r.user_id = auth.uid()
   WHERE auth.uid() IS NOT NULL
     AND (
       v.status = 'published'
       OR (v.status = 'scheduled' AND v.publish_at IS NOT NULL AND v.publish_at <= now())
     )
     AND public.platform_user_targeted(auth.uid(), v.visibility, v.target_plans, v.target_user_ids)
   ORDER BY v.is_pinned DESC, v.version_sort DESC, v.release_date DESC;
$function$;

-- 4. state setter learns _skipped (skip / restore) and stamps prompt date
CREATE OR REPLACE FUNCTION public.platform_set_update_state(_version_id uuid, _seen boolean DEFAULT NULL::boolean, _read boolean DEFAULT NULL::boolean, _dismissed boolean DEFAULT NULL::boolean, _never_show boolean DEFAULT NULL::boolean, _updated boolean DEFAULT NULL::boolean, _skipped boolean DEFAULT NULL::boolean)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE uid uuid := auth.uid(); v public.platform_versions;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v FROM public.platform_versions WHERE id = _version_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Unknown version'; END IF;

  -- critical / required releases can never be permanently skipped
  IF _skipped AND (v.is_forced OR v.priority = 'critical') THEN
    RAISE EXCEPTION 'Critical updates cannot be skipped';
  END IF;

  INSERT INTO public.platform_update_receipts
    (version_id, user_id, seen_at, read_at, dismissed_at, never_show_at, updated_at_action, skipped_at, last_prompt_at)
  VALUES (
    _version_id, uid,
    CASE WHEN _seen THEN now() END,
    CASE WHEN _read THEN now() END,
    CASE WHEN _dismissed THEN now() END,
    CASE WHEN _never_show THEN now() END,
    CASE WHEN _updated THEN now() END,
    CASE WHEN _skipped THEN now() END,
    CASE WHEN _seen THEN now() END
  )
  ON CONFLICT (version_id, user_id) DO UPDATE SET
    seen_at = CASE WHEN _seen IS NULL THEN public.platform_update_receipts.seen_at
                   WHEN _seen THEN coalesce(public.platform_update_receipts.seen_at, now()) END,
    read_at = CASE WHEN _read IS NULL THEN public.platform_update_receipts.read_at
                   WHEN _read THEN coalesce(public.platform_update_receipts.read_at, now()) END,
    dismissed_at = CASE WHEN _dismissed IS NULL THEN public.platform_update_receipts.dismissed_at
                        WHEN _dismissed THEN now() ELSE NULL END,
    never_show_at = CASE WHEN _never_show IS NULL THEN public.platform_update_receipts.never_show_at
                         WHEN _never_show THEN now() ELSE NULL END,
    updated_at_action = CASE WHEN _updated IS NULL THEN public.platform_update_receipts.updated_at_action
                             WHEN _updated THEN coalesce(public.platform_update_receipts.updated_at_action, now()) END,
    skipped_at = CASE WHEN _skipped IS NULL THEN public.platform_update_receipts.skipped_at
                      WHEN _skipped THEN now() ELSE NULL END,
    last_prompt_at = CASE WHEN _seen THEN now() ELSE public.platform_update_receipts.last_prompt_at END,
    updated_at = now();

  -- permanent, append-only history
  IF _seen       THEN INSERT INTO public.platform_update_events (version_id, version, user_id, event_type) VALUES (_version_id, v.version, uid, 'viewed'); END IF;
  IF _read       THEN INSERT INTO public.platform_update_events (version_id, version, user_id, event_type) VALUES (_version_id, v.version, uid, 'read'); END IF;
  IF _dismissed  THEN INSERT INTO public.platform_update_events (version_id, version, user_id, event_type) VALUES (_version_id, v.version, uid, 'dismissed'); END IF;
  IF _never_show THEN INSERT INTO public.platform_update_events (version_id, version, user_id, event_type) VALUES (_version_id, v.version, uid, 'never_show'); END IF;
  IF _updated    THEN INSERT INTO public.platform_update_events (version_id, version, user_id, event_type) VALUES (_version_id, v.version, uid, 'updated'); END IF;
  IF _skipped IS NOT NULL THEN
    INSERT INTO public.platform_update_events (version_id, version, user_id, event_type)
    VALUES (_version_id, v.version, uid, CASE WHEN _skipped THEN 'skipped' ELSE 'skip_restored' END);
  END IF;

  IF _seen OR _read OR _updated THEN
    UPDATE public.profiles
       SET last_seen_app_version = v.version, last_seen_app_version_at = now()
     WHERE id = uid
       AND coalesce(public.platform_version_sort_key(last_seen_app_version), -1)
           <= public.platform_version_sort_key(v.version);
  END IF;

  IF _updated THEN
    UPDATE public.profiles
       SET installed_app_version = v.version, installed_app_version_at = now()
     WHERE id = uid
       AND coalesce(public.platform_version_sort_key(installed_app_version), -1)
           <= public.platform_version_sort_key(v.version);
  END IF;
END; $function$;

-- 5. analytics gains skip metrics
CREATE OR REPLACE FUNCTION public.platform_update_analytics(_version_id uuid)
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v public.platform_versions;
  eligible int := 0; seen int; read_n int; updated_n int; dismissed_n int; skipped_n int;
  avg_skip numeric;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v FROM public.platform_versions WHERE id = _version_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('eligible',0); END IF;

  IF v.visibility = 'users' THEN
    eligible := coalesce(array_length(v.target_user_ids, 1), 0);
  ELSE
    SELECT count(*) INTO eligible
      FROM public.profiles p
     WHERE p.deleted_at IS NULL
       AND public.platform_user_targeted(p.id, v.visibility, v.target_plans, v.target_user_ids);
  END IF;

  SELECT count(*) FILTER (WHERE seen_at IS NOT NULL),
         count(*) FILTER (WHERE read_at IS NOT NULL),
         count(*) FILTER (WHERE updated_at_action IS NOT NULL),
         count(*) FILTER (WHERE dismissed_at IS NOT NULL OR never_show_at IS NOT NULL),
         count(*) FILTER (WHERE skipped_at IS NOT NULL),
         avg(EXTRACT(EPOCH FROM (skipped_at - coalesce(seen_at, created_at))))
           FILTER (WHERE skipped_at IS NOT NULL)
    INTO seen, read_n, updated_n, dismissed_n, skipped_n, avg_skip
    FROM public.platform_update_receipts WHERE version_id = _version_id;

  RETURN jsonb_build_object(
    'eligible', eligible,
    'seen', coalesce(seen,0),
    'updated', coalesce(updated_n,0),
    'read', coalesce(read_n,0),
    'ignored', coalesce(dismissed_n,0),
    'skipped', coalesce(skipped_n,0),
    'pending', GREATEST(eligible - coalesce(seen,0), 0),
    'skip_rate', CASE WHEN coalesce(seen,0) = 0 THEN 0
                      ELSE round((coalesce(skipped_n,0)::numeric / seen) * 100, 1) END,
    'avg_seconds_before_skip', CASE WHEN avg_skip IS NULL THEN NULL ELSE round(avg_skip) END,
    'dismiss_rate', CASE WHEN coalesce(seen,0) = 0 THEN 0
                         ELSE round((coalesce(dismissed_n,0)::numeric / seen) * 100, 1) END
  );
END; $function$;

-- 6. platform-wide skip overview for the admin dashboard
CREATE OR REPLACE FUNCTION public.platform_skip_overview()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE total_skips int; total_seen int; avg_skip numeric; top jsonb;
BEGIN
  IF NOT (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin')) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT count(*) FILTER (WHERE skipped_at IS NOT NULL),
         count(*) FILTER (WHERE seen_at IS NOT NULL),
         avg(EXTRACT(EPOCH FROM (skipped_at - coalesce(seen_at, created_at))))
           FILTER (WHERE skipped_at IS NOT NULL)
    INTO total_skips, total_seen, avg_skip
    FROM public.platform_update_receipts;

  SELECT coalesce(jsonb_agg(x), '[]'::jsonb) INTO top FROM (
    SELECT v.version, v.title, count(*)::int AS skips
      FROM public.platform_update_receipts r
      JOIN public.platform_versions v ON v.id = r.version_id
     WHERE r.skipped_at IS NOT NULL
     GROUP BY v.version, v.title
     ORDER BY skips DESC
     LIMIT 5
  ) x;

  RETURN jsonb_build_object(
    'total_skips', coalesce(total_skips,0),
    'skip_rate', CASE WHEN coalesce(total_seen,0)=0 THEN 0
                      ELSE round((coalesce(total_skips,0)::numeric / total_seen) * 100, 1) END,
    'avg_seconds_before_skip', CASE WHEN avg_skip IS NULL THEN NULL ELSE round(avg_skip) END,
    'top_skipped', top
  );
END; $function$;

REVOKE ALL ON FUNCTION public.platform_skip_overview() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.platform_skip_overview() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.platform_set_update_state(uuid, boolean, boolean, boolean, boolean, boolean, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.platform_set_update_state(uuid, boolean, boolean, boolean, boolean, boolean, boolean) TO authenticated, service_role;