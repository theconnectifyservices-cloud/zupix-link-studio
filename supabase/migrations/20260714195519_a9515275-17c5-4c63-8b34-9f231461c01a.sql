
-- =========================================================
-- LS-03: Multi-tenant Database Architecture
-- =========================================================

-- ---------- ENUMS ----------
DO $$ BEGIN
  CREATE TYPE public.org_role AS ENUM ('owner','admin','manager','member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.org_plan AS ENUM ('free','pro','business','enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.activity_type AS ENUM (
    'auth.login','auth.logout','auth.signup','auth.password_reset',
    'profile.update','workspace.create','workspace.update','workspace.delete',
    'workspace.member_add','workspace.member_remove',
    'organization.create','organization.update',
    'biopage.create','biopage.update','biopage.publish','biopage.delete',
    'theme.change','builder.action','media.upload','media.delete',
    'invitation.send','invitation.accept','settings.update'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_type AS ENUM ('system','security','activity','marketing','billing','collaboration');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.notification_channel AS ENUM ('in_app','email','push','sms');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.invitation_status AS ENUM ('pending','accepted','revoked','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.media_kind AS ENUM ('image','video','audio','document','other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- shared trigger ----------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- ---------- ORGANIZATIONS ----------
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan public.org_plan NOT NULL DEFAULT 'free',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO service_role;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.org_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members TO authenticated;
GRANT ALL ON public.organization_members TO service_role;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.organization_members WHERE user_id = _user_id AND organization_id = _org_id);
$$;

CREATE OR REPLACE FUNCTION public.org_role_of(_user_id UUID, _org_id UUID)
RETURNS public.org_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.organization_members WHERE user_id = _user_id AND organization_id = _org_id LIMIT 1;
$$;

CREATE POLICY "org members can view org" ON public.organizations FOR SELECT USING (public.is_org_member(auth.uid(), id));
CREATE POLICY "users can create org" ON public.organizations FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "owner/admin can update org" ON public.organizations FOR UPDATE
  USING (public.org_role_of(auth.uid(), id) IN ('owner','admin'))
  WITH CHECK (public.org_role_of(auth.uid(), id) IN ('owner','admin'));
CREATE POLICY "owner can delete org" ON public.organizations FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "members can view org members" ON public.organization_members FOR SELECT USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "user can join as self" ON public.organization_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner/admin manage org members" ON public.organization_members FOR UPDATE
  USING (public.org_role_of(auth.uid(), organization_id) IN ('owner','admin'));
CREATE POLICY "owner/admin remove org members" ON public.organization_members FOR DELETE
  USING (public.org_role_of(auth.uid(), organization_id) IN ('owner','admin') OR auth.uid() = user_id);

CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_organizations_owner ON public.organizations(owner_id);
CREATE INDEX idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX idx_org_members_org ON public.organization_members(organization_id);

-- ---------- WORKSPACES: extend ----------
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_workspaces_org ON public.workspaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_owner ON public.workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_ws ON public.workspace_members(workspace_id);

-- helper: workspace role
CREATE OR REPLACE FUNCTION public.workspace_role_of(_user_id UUID, _workspace_id UUID)
RETURNS public.workspace_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.workspace_members WHERE user_id = _user_id AND workspace_id = _workspace_id LIMIT 1;
$$;

-- ---------- USER PREFERENCES ----------
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'system',
  language TEXT NOT NULL DEFAULT 'en',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  date_format TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
  time_format TEXT NOT NULL DEFAULT '24h',
  notification_preferences JSONB NOT NULL DEFAULT '{"email":true,"push":true,"in_app":true}'::jsonb,
  privacy_preferences JSONB NOT NULL DEFAULT '{"show_email":false,"searchable":true}'::jsonb,
  marketing_emails BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_preferences TO authenticated;
GRANT ALL ON public.user_preferences TO service_role;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own preferences" ON public.user_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_user_preferences_updated BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- PERMISSIONS CATALOG ----------
CREATE TABLE public.permissions (
  key TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.permissions TO authenticated;
GRANT ALL ON public.permissions TO service_role;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read permissions" ON public.permissions FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.workspace_role NOT NULL,
  permission_key TEXT NOT NULL REFERENCES public.permissions(key) ON DELETE CASCADE,
  UNIQUE (role, permission_key)
);
GRANT SELECT ON public.role_permissions TO authenticated;
GRANT ALL ON public.role_permissions TO service_role;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read role permissions" ON public.role_permissions FOR SELECT USING (auth.uid() IS NOT NULL);

-- seed core permissions
INSERT INTO public.permissions (key, category, description) VALUES
  ('workspace.view','workspace','View workspace'),
  ('workspace.update','workspace','Update workspace settings'),
  ('workspace.delete','workspace','Delete workspace'),
  ('workspace.invite','workspace','Invite members'),
  ('workspace.remove_member','workspace','Remove members'),
  ('biopage.create','biopage','Create bio pages'),
  ('biopage.update','biopage','Edit bio pages'),
  ('biopage.publish','biopage','Publish bio pages'),
  ('biopage.delete','biopage','Delete bio pages'),
  ('media.upload','media','Upload media'),
  ('media.delete','media','Delete media'),
  ('analytics.view','analytics','View analytics'),
  ('billing.manage','billing','Manage billing')
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_key)
SELECT 'owner'::public.workspace_role, key FROM public.permissions ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'admin'::public.workspace_role, key FROM public.permissions
WHERE key NOT IN ('workspace.delete','billing.manage') ON CONFLICT DO NOTHING;
INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('member','workspace.view'),('member','biopage.create'),('member','biopage.update'),
  ('member','media.upload'),('member','analytics.view')
ON CONFLICT DO NOTHING;

-- ---------- SESSIONS ----------
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id UUID,
  ip_address INET,
  user_agent TEXT,
  location JSONB,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_sessions TO authenticated;
GRANT ALL ON public.user_sessions TO service_role;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sessions" ON public.user_sessions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(user_id) WHERE revoked_at IS NULL;

-- ---------- DEVICES ----------
CREATE TABLE public.user_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  push_token TEXT,
  trusted BOOLEAN NOT NULL DEFAULT false,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_devices TO authenticated;
GRANT ALL ON public.user_devices TO service_role;
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own devices" ON public.user_devices FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_user_devices_user ON public.user_devices(user_id);

-- ---------- ACTIVITY LOGS ----------
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  action public.activity_type NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view own activity" ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id)));
CREATE POLICY "insert own activity" ON public.activity_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_activity_user_time ON public.activity_logs(user_id, created_at DESC);
CREATE INDEX idx_activity_ws_time ON public.activity_logs(workspace_id, created_at DESC);
CREATE INDEX idx_activity_action ON public.activity_logs(action);

-- ---------- AUDIT LOGS (append-only) ----------
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  action TEXT NOT NULL,
  before JSONB,
  after JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace owner reads audit" ON public.audit_logs FOR SELECT
  USING (workspace_id IS NOT NULL AND public.workspace_role_of(auth.uid(), workspace_id) = 'owner');
CREATE INDEX idx_audit_ws_time ON public.audit_logs(workspace_id, created_at DESC);
CREATE INDEX idx_audit_entity ON public.audit_logs(entity_type, entity_id);

-- ---------- NOTIFICATIONS ----------
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  type public.notification_type NOT NULL DEFAULT 'system',
  channel public.notification_channel NOT NULL DEFAULT 'in_app',
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notifications" ON public.notifications FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;

CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category public.notification_type NOT NULL,
  channel public.notification_channel NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (user_id, category, channel)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notif prefs" ON public.notification_preferences FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ---------- FEATURE FLAGS ----------
CREATE TABLE public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (key, workspace_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_flags TO authenticated;
GRANT ALL ON public.feature_flags TO service_role;
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read global or member flags" ON public.feature_flags FOR SELECT
  USING (workspace_id IS NULL OR public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "admins manage flags" ON public.feature_flags FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_feature_flags_updated BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- MEDIA ASSETS ----------
CREATE TABLE public.media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind public.media_kind NOT NULL DEFAULT 'image',
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  width INT,
  height INT,
  duration_seconds INT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "view workspace media" ON public.media_assets FOR SELECT
  USING (auth.uid() = owner_id OR (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id)));
CREATE POLICY "upload as self" ON public.media_assets FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "update own media" ON public.media_assets FOR UPDATE
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "delete own or admin media" ON public.media_assets FOR DELETE
  USING (auth.uid() = owner_id OR (workspace_id IS NOT NULL AND public.workspace_role_of(auth.uid(), workspace_id) IN ('owner','admin')));
CREATE INDEX idx_media_workspace ON public.media_assets(workspace_id);
CREATE INDEX idx_media_owner ON public.media_assets(owner_id);
CREATE TRIGGER trg_media_updated BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- INVITATIONS ----------
CREATE TABLE public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.invitation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invitations TO authenticated;
GRANT ALL ON public.invitations TO service_role;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace members view invites" ON public.invitations FOR SELECT
  USING (
    (workspace_id IS NOT NULL AND public.is_workspace_member(auth.uid(), workspace_id))
    OR (organization_id IS NOT NULL AND public.is_org_member(auth.uid(), organization_id))
    OR auth.uid() = invited_by
  );
CREATE POLICY "admins create invites" ON public.invitations FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by AND (
      (workspace_id IS NOT NULL AND public.workspace_role_of(auth.uid(), workspace_id) IN ('owner','admin'))
      OR (organization_id IS NOT NULL AND public.org_role_of(auth.uid(), organization_id) IN ('owner','admin'))
    )
  );
CREATE POLICY "admins update invites" ON public.invitations FOR UPDATE
  USING (
    (workspace_id IS NOT NULL AND public.workspace_role_of(auth.uid(), workspace_id) IN ('owner','admin'))
    OR (organization_id IS NOT NULL AND public.org_role_of(auth.uid(), organization_id) IN ('owner','admin'))
  );
CREATE POLICY "admins delete invites" ON public.invitations FOR DELETE
  USING (
    (workspace_id IS NOT NULL AND public.workspace_role_of(auth.uid(), workspace_id) IN ('owner','admin'))
    OR (organization_id IS NOT NULL AND public.org_role_of(auth.uid(), organization_id) IN ('owner','admin'))
  );
CREATE INDEX idx_invitations_email ON public.invitations(email);
CREATE INDEX idx_invitations_workspace ON public.invitations(workspace_id);

-- ---------- extend profiles: soft delete ----------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
