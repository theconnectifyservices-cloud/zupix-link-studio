-- ============ ENUMS ============
CREATE TYPE public.comm_notification_type AS ENUM ('information','update','success','warning','offer','maintenance');
CREATE TYPE public.comm_priority AS ENUM ('low','normal','high','important');
CREATE TYPE public.comm_audience AS ENUM ('all','trial','udaan','tejas','garuda','vajra','lifetime','selected');
CREATE TYPE public.comm_status AS ENUM ('draft','published','archived');
CREATE TYPE public.comm_bar_mode AS ENUM ('static','marquee');

-- ============ NOTIFICATIONS ============
CREATE TABLE public.comm_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  type public.comm_notification_type NOT NULL DEFAULT 'information',
  banner_image_url text,
  button_text text,
  button_url text,
  priority public.comm_priority NOT NULL DEFAULT 'normal',
  audience public.comm_audience NOT NULL DEFAULT 'all',
  target_user_ids uuid[] NOT NULL DEFAULT '{}',
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  status public.comm_status NOT NULL DEFAULT 'draft',
  -- reserved for future channels (email/push/whatsapp) without schema changes
  channels jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comm_notifications_live_idx ON public.comm_notifications (status, starts_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.comm_notifications TO authenticated;
GRANT ALL ON public.comm_notifications TO service_role;
ALTER TABLE public.comm_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage notifications" ON public.comm_notifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============ PER-USER RECEIPTS ============
CREATE TABLE public.comm_notification_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.comm_notifications(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  read_at timestamptz,
  popup_seen_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (notification_id, user_id)
);
CREATE INDEX comm_receipts_user_idx ON public.comm_notification_receipts (user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.comm_notification_receipts TO authenticated;
GRANT ALL ON public.comm_notification_receipts TO service_role;
ALTER TABLE public.comm_notification_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own receipts" ON public.comm_notification_receipts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============ ANNOUNCEMENT BAR ============
CREATE TABLE public.comm_announcement_bars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  mode public.comm_bar_mode NOT NULL DEFAULT 'static',
  button_text text,
  button_url text,
  background_color text NOT NULL DEFAULT '#111827',
  text_color text NOT NULL DEFAULT '#FFFFFF',
  is_enabled boolean NOT NULL DEFAULT false,
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
-- Only one announcement can be enabled at a time.
CREATE UNIQUE INDEX comm_announcement_single_enabled ON public.comm_announcement_bars ((is_enabled)) WHERE is_enabled;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.comm_announcement_bars TO authenticated;
GRANT SELECT ON public.comm_announcement_bars TO anon;
GRANT ALL ON public.comm_announcement_bars TO service_role;
ALTER TABLE public.comm_announcement_bars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read the live announcement" ON public.comm_announcement_bars
  FOR SELECT TO anon, authenticated
  USING (is_enabled AND starts_at <= now() AND (ends_at IS NULL OR ends_at > now()));

CREATE POLICY "Admins read all announcements" ON public.comm_announcement_bars
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Admins write announcements" ON public.comm_announcement_bars
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============ RELEASE NOTES ============
CREATE TABLE public.comm_release_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  release_date date NOT NULL DEFAULT current_date,
  status public.comm_status NOT NULL DEFAULT 'published',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX comm_release_notes_date_idx ON public.comm_release_notes (release_date DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.comm_release_notes TO authenticated;
GRANT SELECT ON public.comm_release_notes TO anon;
GRANT ALL ON public.comm_release_notes TO service_role;
ALTER TABLE public.comm_release_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read published release notes" ON public.comm_release_notes
  FOR SELECT TO anon, authenticated
  USING (status = 'published');

CREATE POLICY "Admins read all release notes" ON public.comm_release_notes
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Admins write release notes" ON public.comm_release_notes
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============ TIMESTAMP TRIGGERS ============
CREATE TRIGGER comm_notifications_updated_at BEFORE UPDATE ON public.comm_notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER comm_receipts_updated_at BEFORE UPDATE ON public.comm_notification_receipts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER comm_announcement_bars_updated_at BEFORE UPDATE ON public.comm_announcement_bars
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER comm_release_notes_updated_at BEFORE UPDATE ON public.comm_release_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AUDIENCE RESOLUTION ============
-- Returns the audience buckets the given user belongs to.
CREATE OR REPLACE FUNCTION public.comm_user_audiences(_user_id uuid)
RETURNS text[]
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  buckets text[] := ARRAY['all'];
  ws uuid;
  sub record;
  plan_code text;
BEGIN
  IF _user_id IS NULL THEN RETURN buckets; END IF;

  SELECT active_workspace_id INTO ws FROM public.profiles WHERE id = _user_id;
  IF ws IS NULL THEN
    SELECT workspace_id INTO ws FROM public.workspace_members
     WHERE user_id = _user_id ORDER BY created_at ASC LIMIT 1;
  END IF;
  IF ws IS NULL THEN RETURN buckets; END IF;

  SELECT s.status::text AS status, p.code AS code
    INTO sub
    FROM public.billing_subscriptions s
    LEFT JOIN public.billing_plans p ON p.id = s.plan_id
   WHERE s.workspace_id = ws
   ORDER BY s.created_at DESC
   LIMIT 1;

  IF NOT FOUND THEN RETURN buckets; END IF;

  IF sub.status = 'trialing' THEN
    buckets := buckets || 'trial';
  END IF;

  plan_code := lower(coalesce(sub.code, ''));
  IF plan_code <> '' AND plan_code = ANY (ARRAY['udaan','tejas','garuda','vajra','lifetime']) THEN
    buckets := buckets || plan_code;
  END IF;

  -- Lifetime cycle counts as the lifetime audience regardless of plan code.
  IF EXISTS (
    SELECT 1 FROM public.billing_subscriptions s
     WHERE s.workspace_id = ws AND s.cycle = 'lifetime'
       AND s.status IN ('active','trialing','past_due')
  ) AND NOT ('lifetime' = ANY (buckets)) THEN
    buckets := buckets || 'lifetime';
  END IF;

  RETURN buckets;
END;
$$;

-- Notification feed for the calling user, with their own read/deleted state.
CREATE OR REPLACE FUNCTION public.comm_my_notifications()
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  type public.comm_notification_type,
  banner_image_url text,
  button_text text,
  button_url text,
  priority public.comm_priority,
  starts_at timestamptz,
  created_at timestamptz,
  read_at timestamptz,
  popup_seen_at timestamptz
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT n.id, n.title, n.description, n.type, n.banner_image_url, n.button_text,
         n.button_url, n.priority, n.starts_at, n.created_at, r.read_at, r.popup_seen_at
    FROM public.comm_notifications n
    LEFT JOIN public.comm_notification_receipts r
      ON r.notification_id = n.id AND r.user_id = auth.uid()
   WHERE auth.uid() IS NOT NULL
     AND n.status = 'published'
     AND n.starts_at <= now()
     AND (n.ends_at IS NULL OR n.ends_at > now())
     AND r.deleted_at IS NULL
     AND (
       (n.audience = 'selected' AND auth.uid() = ANY (n.target_user_ids))
       OR (n.audience <> 'selected'
           AND n.audience::text = ANY (public.comm_user_audiences(auth.uid())))
     )
   ORDER BY
     CASE n.priority WHEN 'important' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
     n.starts_at DESC;
$$;

REVOKE ALL ON FUNCTION public.comm_user_audiences(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.comm_user_audiences(uuid) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.comm_my_notifications() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.comm_my_notifications() TO authenticated, service_role;

-- Upsert helper so users can mark read / dismiss popup / delete their copy.
CREATE OR REPLACE FUNCTION public.comm_set_notification_state(
  _notification_id uuid,
  _read boolean DEFAULT NULL,
  _popup_seen boolean DEFAULT NULL,
  _deleted boolean DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  INSERT INTO public.comm_notification_receipts (notification_id, user_id, read_at, popup_seen_at, deleted_at)
  VALUES (
    _notification_id,
    auth.uid(),
    CASE WHEN _read THEN now() ELSE NULL END,
    CASE WHEN _popup_seen THEN now() ELSE NULL END,
    CASE WHEN _deleted THEN now() ELSE NULL END
  )
  ON CONFLICT (notification_id, user_id) DO UPDATE
    SET read_at = CASE WHEN _read IS NULL THEN public.comm_notification_receipts.read_at
                       WHEN _read THEN coalesce(public.comm_notification_receipts.read_at, now())
                       ELSE NULL END,
        popup_seen_at = CASE WHEN _popup_seen IS NULL THEN public.comm_notification_receipts.popup_seen_at
                             WHEN _popup_seen THEN coalesce(public.comm_notification_receipts.popup_seen_at, now())
                             ELSE NULL END,
        deleted_at = CASE WHEN _deleted IS NULL THEN public.comm_notification_receipts.deleted_at
                          WHEN _deleted THEN now() ELSE NULL END,
        updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.comm_set_notification_state(uuid, boolean, boolean, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.comm_set_notification_state(uuid, boolean, boolean, boolean) TO authenticated, service_role;

-- Mark every currently visible notification as read for the caller.
CREATE OR REPLACE FUNCTION public.comm_mark_all_read()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n int := 0;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.comm_notification_receipts (notification_id, user_id, read_at)
  SELECT f.id, auth.uid(), now() FROM public.comm_my_notifications() f WHERE f.read_at IS NULL
  ON CONFLICT (notification_id, user_id) DO UPDATE
    SET read_at = coalesce(public.comm_notification_receipts.read_at, now()), updated_at = now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.comm_mark_all_read() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.comm_mark_all_read() TO authenticated, service_role;