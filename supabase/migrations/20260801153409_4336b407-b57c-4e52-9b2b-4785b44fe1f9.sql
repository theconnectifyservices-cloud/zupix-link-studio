-- ============================================================
-- ZUPIX APP UPDATE CENTER — version management foundation
-- ============================================================

CREATE TYPE public.platform_release_type AS ENUM (
  'major_update','feature_update','bug_fix','security_update','hotfix'
);

CREATE TYPE public.platform_update_priority AS ENUM ('low','normal','high','critical');

CREATE TYPE public.platform_update_visibility AS ENUM ('everyone','plan','users','beta');

CREATE TYPE public.platform_update_status AS ENUM ('draft','scheduled','published','archived');

-- ------------------------------------------------------------
-- 1. Versions
-- ------------------------------------------------------------
CREATE TABLE public.platform_versions (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version                   text NOT NULL,
  -- numeric ordering key derived from semver, maintained by trigger
  version_sort              bigint NOT NULL DEFAULT 0,
  title                     text NOT NULL,
  description               text NOT NULL DEFAULT '',
  whats_new                 text[] NOT NULL DEFAULT '{}',
  bug_fixes                 text[] NOT NULL DEFAULT '{}',
  performance_improvements  text[] NOT NULL DEFAULT '{}',
  security_updates          text[] NOT NULL DEFAULT '{}',
  release_date              date NOT NULL DEFAULT current_date,
  release_type              public.platform_release_type NOT NULL DEFAULT 'feature_update',
  priority                  public.platform_update_priority NOT NULL DEFAULT 'normal',
  visibility                public.platform_update_visibility NOT NULL DEFAULT 'everyone',
  target_plans              text[] NOT NULL DEFAULT '{}',
  target_user_ids           uuid[] NOT NULL DEFAULT '{}',
  banner_image_url          text,
  video_url                 text,
  docs_url                  text,
  status                    public.platform_update_status NOT NULL DEFAULT 'draft',
  publish_at                timestamptz,
  published_at              timestamptz,
  is_forced                 boolean NOT NULL DEFAULT false,
  is_important              boolean NOT NULL DEFAULT false,
  is_pinned                 boolean NOT NULL DEFAULT false,
  -- FUTURE-READY (not implemented yet): delivery channels, translations, AI authoring
  channels                  jsonb NOT NULL DEFAULT '{"in_app": true}'::jsonb,
  translations              jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata                  jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by                uuid,
  created_at                timestamptz NOT NULL DEFAULT now(),
  updated_at                timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX platform_versions_version_key ON public.platform_versions (lower(version));
CREATE INDEX platform_versions_live_idx ON public.platform_versions (status, version_sort DESC);
CREATE INDEX platform_versions_date_idx ON public.platform_versions (release_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_versions TO authenticated;
GRANT ALL ON public.platform_versions TO service_role;

ALTER TABLE public.platform_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in users read live versions"
  ON public.platform_versions FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR (
      status = 'published'
      OR (status = 'scheduled' AND publish_at IS NOT NULL AND publish_at <= now())
    )
  );

CREATE POLICY "Admins insert versions"
  ON public.platform_versions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Admins update versions"
  ON public.platform_versions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Admins delete versions"
  ON public.platform_versions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- semver -> sortable integer, so "latest" never depends on text ordering
CREATE OR REPLACE FUNCTION public.platform_version_sort_key(_version text)
RETURNS bigint LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT COALESCE(
    (split_part(v, '.', 1))::bigint * 1000000
      + COALESCE(NULLIF(split_part(v, '.', 2), ''), '0')::bigint * 1000
      + COALESCE(NULLIF(regexp_replace(split_part(v, '.', 3), '[^0-9].*$', ''), ''), '0')::bigint,
    0)
  FROM (SELECT regexp_replace(lower(trim(coalesce(_version,'0'))), '^v', '') AS v) s;
$$;

CREATE OR REPLACE FUNCTION public.platform_versions_before_write()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.version := regexp_replace(lower(trim(NEW.version)), '^v', '');
  IF NEW.version !~ '^[0-9]+(\.[0-9]+){0,3}([-.][a-z0-9]+)*$' THEN
    RAISE EXCEPTION 'Version must look like 1.0.0 (optionally v-prefixed)';
  END IF;
  NEW.version_sort := public.platform_version_sort_key(NEW.version);
  NEW.updated_at := now();
  IF NEW.status = 'published' AND NEW.published_at IS NULL THEN
    NEW.published_at := now();
  END IF;
  IF NEW.status <> 'published' AND TG_OP = 'UPDATE' AND OLD.status = 'published' THEN
    NEW.published_at := NULL;   -- unpublish
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER platform_versions_before_write
  BEFORE INSERT OR UPDATE ON public.platform_versions
  FOR EACH ROW EXECUTE FUNCTION public.platform_versions_before_write();

-- ------------------------------------------------------------
-- 2. Per-user receipts (last seen / read / dismissed / updated)
-- ------------------------------------------------------------
CREATE TABLE public.platform_update_receipts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id    uuid NOT NULL REFERENCES public.platform_versions(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL,
  seen_at       timestamptz,
  read_at       timestamptz,
  dismissed_at  timestamptz,
  never_show_at timestamptz,
  updated_at_action timestamptz,
  channel       text NOT NULL DEFAULT 'in_app',
  metadata      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (version_id, user_id)
);

CREATE INDEX platform_update_receipts_user_idx ON public.platform_update_receipts (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_update_receipts TO authenticated;
GRANT ALL ON public.platform_update_receipts TO service_role;

ALTER TABLE public.platform_update_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own receipts"
  ON public.platform_update_receipts FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin')
  );

CREATE POLICY "Users write own receipts"
  ON public.platform_update_receipts FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own receipts"
  ON public.platform_update_receipts FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TRIGGER platform_update_receipts_touch
  BEFORE UPDATE ON public.platform_update_receipts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ------------------------------------------------------------
-- 3. Immutable interaction history (never lost)
-- ------------------------------------------------------------
CREATE TABLE public.platform_update_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id  uuid REFERENCES public.platform_versions(id) ON DELETE SET NULL,
  version     text,
  user_id     uuid,
  event_type  text NOT NULL,
  channel     text NOT NULL DEFAULT 'in_app',
  metadata    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX platform_update_events_version_idx ON public.platform_update_events (version_id, created_at DESC);
CREATE INDEX platform_update_events_user_idx ON public.platform_update_events (user_id, created_at DESC);

GRANT SELECT ON public.platform_update_events TO authenticated;
GRANT ALL ON public.platform_update_events TO service_role;

ALTER TABLE public.platform_update_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own update history"
  ON public.platform_update_events FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.has_role(auth.uid(),'super_admin')
  );

-- ------------------------------------------------------------
-- 4. Profile tracking columns
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_app_version text,
  ADD COLUMN IF NOT EXISTS last_seen_app_version_at timestamptz,
  ADD COLUMN IF NOT EXISTS is_beta_tester boolean NOT NULL DEFAULT false;

-- ------------------------------------------------------------
-- 5. Targeting + delivery helpers
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.platform_user_plan(_user_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE ws uuid; plan text;
BEGIN
  SELECT active_workspace_id INTO ws FROM public.profiles WHERE id = _user_id;
  IF ws IS NULL THEN
    SELECT workspace_id INTO ws FROM public.workspace_members
     WHERE user_id = _user_id ORDER BY created_at ASC LIMIT 1;
  END IF;
  IF ws IS NULL THEN RETURN 'udaan'; END IF;
  plan := public.public_workspace_plan(ws);
  RETURN lower(coalesce(plan, 'udaan'));
END; $$;

CREATE OR REPLACE FUNCTION public.platform_user_targeted(
  _user_id uuid,
  _visibility public.platform_update_visibility,
  _target_plans text[],
  _target_user_ids uuid[]
) RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF _user_id IS NULL THEN RETURN false; END IF;
  CASE _visibility
    WHEN 'everyone' THEN RETURN true;
    WHEN 'users'    THEN RETURN _user_id = ANY (coalesce(_target_user_ids, '{}'::uuid[]));
    WHEN 'beta'     THEN RETURN coalesce((SELECT is_beta_tester FROM public.profiles WHERE id = _user_id), false);
    WHEN 'plan'     THEN RETURN public.platform_user_plan(_user_id) = ANY (
                              SELECT lower(p) FROM unnest(coalesce(_target_plans,'{}'::text[])) p);
  END CASE;
  RETURN false;
END; $$;

-- Every live version this user may see, with their own state attached.
CREATE OR REPLACE FUNCTION public.platform_my_versions()
RETURNS TABLE(
  id uuid, version text, title text, description text,
  whats_new text[], bug_fixes text[], performance_improvements text[], security_updates text[],
  release_date date, release_type public.platform_release_type,
  priority public.platform_update_priority,
  banner_image_url text, video_url text, docs_url text,
  is_forced boolean, is_important boolean, is_pinned boolean,
  published_at timestamptz, version_sort bigint,
  seen_at timestamptz, read_at timestamptz, dismissed_at timestamptz, never_show_at timestamptz,
  updated_at_action timestamptz
) LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT v.id, v.version, v.title, v.description,
         v.whats_new, v.bug_fixes, v.performance_improvements, v.security_updates,
         v.release_date, v.release_type, v.priority,
         v.banner_image_url, v.video_url, v.docs_url,
         v.is_forced, v.is_important, v.is_pinned,
         v.published_at, v.version_sort,
         r.seen_at, r.read_at, r.dismissed_at, r.never_show_at, r.updated_at_action
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
$$;

-- Record what the user did with an update; also keeps permanent history.
CREATE OR REPLACE FUNCTION public.platform_set_update_state(
  _version_id uuid,
  _seen boolean DEFAULT NULL,
  _read boolean DEFAULT NULL,
  _dismissed boolean DEFAULT NULL,
  _never_show boolean DEFAULT NULL,
  _updated boolean DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); v text;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT version INTO v FROM public.platform_versions WHERE id = _version_id;
  IF v IS NULL THEN RAISE EXCEPTION 'Unknown version'; END IF;

  INSERT INTO public.platform_update_receipts
    (version_id, user_id, seen_at, read_at, dismissed_at, never_show_at, updated_at_action)
  VALUES (
    _version_id, uid,
    CASE WHEN _seen THEN now() END,
    CASE WHEN _read THEN now() END,
    CASE WHEN _dismissed THEN now() END,
    CASE WHEN _never_show THEN now() END,
    CASE WHEN _updated THEN now() END
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
    updated_at = now();

  -- permanent, append-only history
  IF _seen       THEN INSERT INTO public.platform_update_events (version_id, version, user_id, event_type) VALUES (_version_id, v, uid, 'viewed'); END IF;
  IF _read       THEN INSERT INTO public.platform_update_events (version_id, version, user_id, event_type) VALUES (_version_id, v, uid, 'read'); END IF;
  IF _dismissed  THEN INSERT INTO public.platform_update_events (version_id, version, user_id, event_type) VALUES (_version_id, v, uid, 'dismissed'); END IF;
  IF _never_show THEN INSERT INTO public.platform_update_events (version_id, version, user_id, event_type) VALUES (_version_id, v, uid, 'never_show'); END IF;
  IF _updated    THEN INSERT INTO public.platform_update_events (version_id, version, user_id, event_type) VALUES (_version_id, v, uid, 'updated'); END IF;

  IF _seen OR _read OR _updated THEN
    UPDATE public.profiles
       SET last_seen_app_version = v, last_seen_app_version_at = now()
     WHERE id = uid
       AND coalesce(public.platform_version_sort_key(last_seen_app_version), -1)
           <= public.platform_version_sort_key(v);
  END IF;
END; $$;

-- Admin analytics for one version.
CREATE OR REPLACE FUNCTION public.platform_update_analytics(_version_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v public.platform_versions;
  eligible int := 0; seen int; read_n int; updated_n int; dismissed_n int;
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
         count(*) FILTER (WHERE dismissed_at IS NOT NULL OR never_show_at IS NOT NULL)
    INTO seen, read_n, updated_n, dismissed_n
    FROM public.platform_update_receipts WHERE version_id = _version_id;

  RETURN jsonb_build_object(
    'eligible', eligible,
    'seen', coalesce(seen,0),
    'updated', coalesce(updated_n,0),
    'read', coalesce(read_n,0),
    'ignored', coalesce(dismissed_n,0),
    'pending', GREATEST(eligible - coalesce(seen,0), 0),
    'dismiss_rate', CASE WHEN coalesce(seen,0) = 0 THEN 0
                         ELSE round((coalesce(dismissed_n,0)::numeric / seen) * 100, 1) END
  );
END; $$;