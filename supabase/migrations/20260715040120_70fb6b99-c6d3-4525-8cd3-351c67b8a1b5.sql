
-- 1. Workspace type
DO $$ BEGIN
  CREATE TYPE public.workspace_type AS ENUM ('personal','business','agency','enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS workspace_type public.workspace_type NOT NULL DEFAULT 'personal';

-- 2. Per-user last active workspace timestamps map (kept on profile as jsonb)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS workspace_last_active jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 3. Workspace membership extras
ALTER TABLE public.workspace_members
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS joined_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS invited_by uuid,
  ADD COLUMN IF NOT EXISTS suspended_at timestamptz,
  ADD COLUMN IF NOT EXISTS custom_role_key text;

-- 4. Custom roles per workspace
CREATE TABLE IF NOT EXISTS public.workspace_custom_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  description text,
  base_role public.workspace_role NOT NULL DEFAULT 'member',
  permissions text[] NOT NULL DEFAULT '{}',
  is_system boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_custom_roles TO authenticated;
GRANT ALL ON public.workspace_custom_roles TO service_role;
ALTER TABLE public.workspace_custom_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view custom roles" ON public.workspace_custom_roles
  FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "admins manage custom roles" ON public.workspace_custom_roles
  FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER trg_wcr_updated_at BEFORE UPDATE ON public.workspace_custom_roles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Per-workspace role → permission overrides
CREATE TABLE IF NOT EXISTS public.workspace_role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  role_key text NOT NULL, -- either workspace_role or custom key
  permission_key text NOT NULL,
  granted boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, role_key, permission_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_role_permissions TO authenticated;
GRANT ALL ON public.workspace_role_permissions TO service_role;
ALTER TABLE public.workspace_role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view role perms" ON public.workspace_role_permissions
  FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "admins manage role perms" ON public.workspace_role_permissions
  FOR ALL USING (public.is_workspace_admin(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));

-- 6. Ownership transfers
CREATE TABLE IF NOT EXISTS public.ownership_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  from_user_id uuid NOT NULL,
  to_user_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending|accepted|canceled|expired
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  canceled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ot_workspace_pending ON public.ownership_transfers(workspace_id) WHERE status = 'pending';
GRANT SELECT, INSERT, UPDATE ON public.ownership_transfers TO authenticated;
GRANT ALL ON public.ownership_transfers TO service_role;
ALTER TABLE public.ownership_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "principals view transfers" ON public.ownership_transfers
  FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
    OR public.is_workspace_admin(auth.uid(), workspace_id)
  );
CREATE POLICY "owner creates transfer" ON public.ownership_transfers
  FOR INSERT WITH CHECK (
    auth.uid() = from_user_id
    AND public.workspace_role_of(auth.uid(), workspace_id) = 'owner'
  );
CREATE POLICY "principals update transfer" ON public.ownership_transfers
  FOR UPDATE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id)
  WITH CHECK (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- 7. Fill RLS gaps on workspace_members
DO $$ BEGIN
  CREATE POLICY "admins update members" ON public.workspace_members
    FOR UPDATE USING (public.is_workspace_admin(auth.uid(), workspace_id))
    WITH CHECK (public.is_workspace_admin(auth.uid(), workspace_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "admins remove members" ON public.workspace_members
    FOR DELETE USING (
      public.is_workspace_admin(auth.uid(), workspace_id)
      OR auth.uid() = user_id
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 8. Extra activity_type values
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'workspace.role_change';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'workspace.transfer';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'workspace.member_suspend';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'workspace.member_reinstate';
ALTER TYPE public.activity_type ADD VALUE IF NOT EXISTS 'workspace.type_change';

-- 9. Seed platform permission catalog
INSERT INTO public.permissions (key, category, description) VALUES
  ('dashboard.view','Dashboard','View dashboard'),
  ('builder.view','Builder','View bio pages'),
  ('builder.edit','Builder','Create and edit bio pages'),
  ('builder.delete','Builder','Delete bio pages'),
  ('publishing.publish','Publishing','Publish or unpublish bio pages'),
  ('analytics.view','Analytics','View analytics dashboards'),
  ('analytics.export','Analytics','Export analytics data'),
  ('media.view','Media Library','View media library'),
  ('media.upload','Media Library','Upload media'),
  ('media.delete','Media Library','Delete media'),
  ('ai.use','AI','Use AI tools and generators'),
  ('ai.manage','AI','Manage AI workflows and memory'),
  ('billing.view','Billing','View billing and invoices'),
  ('billing.manage','Billing','Manage plans, payments and taxes'),
  ('integrations.view','Integrations','View integrations'),
  ('integrations.manage','Integrations','Manage integrations and API keys'),
  ('domains.view','Domains','View domains'),
  ('domains.manage','Domains','Add or remove domains'),
  ('templates.view','Templates','Browse templates'),
  ('templates.manage','Templates','Create and manage templates'),
  ('settings.view','Settings','View workspace settings'),
  ('settings.manage','Settings','Update workspace settings'),
  ('users.view','Users','View members'),
  ('users.manage','Users','Invite, remove and change roles')
ON CONFLICT (key) DO UPDATE SET
  category = EXCLUDED.category,
  description = EXCLUDED.description;

-- 10. Seed global default role_permissions (workspace_role enum)
DELETE FROM public.role_permissions WHERE role IN ('owner','admin','member');
INSERT INTO public.role_permissions (role, permission_key)
SELECT 'owner'::public.workspace_role, key FROM public.permissions;

INSERT INTO public.role_permissions (role, permission_key)
SELECT 'admin'::public.workspace_role, key FROM public.permissions
WHERE key NOT IN ('billing.manage');

INSERT INTO public.role_permissions (role, permission_key) VALUES
  ('member','dashboard.view'),
  ('member','builder.view'),
  ('member','builder.edit'),
  ('member','media.view'),
  ('member','media.upload'),
  ('member','analytics.view'),
  ('member','ai.use'),
  ('member','templates.view'),
  ('member','settings.view'),
  ('member','users.view');

-- 11. Effective permission resolver
CREATE OR REPLACE FUNCTION public.workspace_permissions_of(_user_id uuid, _workspace_id uuid)
RETURNS SETOF text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH m AS (
    SELECT role::text AS base_role, custom_role_key, status
      FROM public.workspace_members
     WHERE user_id = _user_id AND workspace_id = _workspace_id
     LIMIT 1
  ),
  perms AS (
    -- 1) Custom role permissions from workspace_custom_roles.permissions[]
    SELECT unnest(wcr.permissions) AS permission_key
      FROM m JOIN public.workspace_custom_roles wcr
        ON wcr.workspace_id = _workspace_id
       AND wcr.key = m.custom_role_key
     WHERE m.status = 'active'
    UNION
    -- 2) Base role global defaults
    SELECT rp.permission_key
      FROM m JOIN public.role_permissions rp
        ON rp.role::text = m.base_role
     WHERE m.status = 'active'
    UNION
    -- 3) Workspace-level overrides (granted=true)
    SELECT wrp.permission_key
      FROM m JOIN public.workspace_role_permissions wrp
        ON wrp.workspace_id = _workspace_id
       AND wrp.role_key = COALESCE(m.custom_role_key, m.base_role)
       AND wrp.granted = true
     WHERE m.status = 'active'
  )
  SELECT DISTINCT permission_key FROM perms
  EXCEPT
  -- 4) Workspace-level overrides (granted=false)
  SELECT wrp.permission_key
    FROM m JOIN public.workspace_role_permissions wrp
      ON wrp.workspace_id = _workspace_id
     AND wrp.role_key = COALESCE(m.custom_role_key, m.base_role)
     AND wrp.granted = false
   WHERE m.status = 'active';
$$;

CREATE OR REPLACE FUNCTION public.has_workspace_permission(_user_id uuid, _workspace_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_permissions_of(_user_id, _workspace_id) p
    WHERE p = _permission
  );
$$;
