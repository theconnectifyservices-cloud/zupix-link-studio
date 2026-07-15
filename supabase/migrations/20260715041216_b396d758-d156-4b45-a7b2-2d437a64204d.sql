
-- 1. Extend workspaces with parent agency link
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS parent_agency_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_workspaces_parent_agency ON public.workspaces(parent_agency_id);

-- Helper: is user admin/owner of agency workspace
CREATE OR REPLACE FUNCTION public.is_agency_admin(_user_id uuid, _agency_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE user_id = _user_id AND workspace_id = _agency_id AND role IN ('owner','admin')
  );
$$;
REVOKE ALL ON FUNCTION public.is_agency_admin(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_agency_admin(uuid,uuid) TO authenticated, service_role;

-- 2. client_profiles
CREATE TYPE public.client_status AS ENUM ('trial','active','suspended','archived');

CREATE TABLE public.client_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  client_workspace_id uuid NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  status public.client_status NOT NULL DEFAULT 'trial',
  business_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  brand_kit jsonb NOT NULL DEFAULT '{}'::jsonb,
  domain_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  social_accounts jsonb NOT NULL DEFAULT '{}'::jsonb,
  goals jsonb NOT NULL DEFAULT '{}'::jsonb,
  onboarding_step int NOT NULL DEFAULT 0,
  onboarding_completed boolean NOT NULL DEFAULT false,
  monthly_revenue_cents bigint NOT NULL DEFAULT 0,
  last_active_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_profiles_agency ON public.client_profiles(agency_workspace_id);
CREATE INDEX idx_client_profiles_status ON public.client_profiles(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_profiles TO authenticated;
GRANT ALL ON public.client_profiles TO service_role;
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency members read clients" ON public.client_profiles FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), agency_workspace_id)
         OR public.is_workspace_member(auth.uid(), client_workspace_id));
CREATE POLICY "agency admins manage clients" ON public.client_profiles FOR ALL TO authenticated
  USING (public.is_agency_admin(auth.uid(), agency_workspace_id))
  WITH CHECK (public.is_agency_admin(auth.uid(), agency_workspace_id));

CREATE TRIGGER trg_client_profiles_updated BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. client_assignments
CREATE TYPE public.assignment_role AS ENUM ('project_manager','designer','developer','writer','seo','viewer');

CREATE TABLE public.client_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agency_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.assignment_role NOT NULL DEFAULT 'viewer',
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_workspace_id, user_id, role)
);
CREATE INDEX idx_client_assignments_client ON public.client_assignments(client_workspace_id);
CREATE INDEX idx_client_assignments_user ON public.client_assignments(user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_assignments TO authenticated;
GRANT ALL ON public.client_assignments TO service_role;
ALTER TABLE public.client_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency members read assignments" ON public.client_assignments FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), agency_workspace_id));
CREATE POLICY "agency admins manage assignments" ON public.client_assignments FOR ALL TO authenticated
  USING (public.is_agency_admin(auth.uid(), agency_workspace_id))
  WITH CHECK (public.is_agency_admin(auth.uid(), agency_workspace_id));

-- 4. client_approvals
CREATE TYPE public.approval_kind AS ENUM ('draft','content','design','publishing');
CREATE TYPE public.approval_status AS ENUM ('pending','approved','rejected','revision_requested');

CREATE TABLE public.client_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agency_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  kind public.approval_kind NOT NULL,
  title text NOT NULL,
  description text,
  entity_ref jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.approval_status NOT NULL DEFAULT 'pending',
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  decision_note text,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_approvals_client ON public.client_approvals(client_workspace_id);
CREATE INDEX idx_client_approvals_status ON public.client_approvals(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_approvals TO authenticated;
GRANT ALL ON public.client_approvals TO service_role;
ALTER TABLE public.client_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "approvals visible to both sides" ON public.client_approvals FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), agency_workspace_id)
         OR public.is_workspace_member(auth.uid(), client_workspace_id));
CREATE POLICY "agency members create approvals" ON public.client_approvals FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), agency_workspace_id));
CREATE POLICY "either side updates approvals" ON public.client_approvals FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), agency_workspace_id)
         OR public.is_workspace_member(auth.uid(), client_workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), agency_workspace_id)
              OR public.is_workspace_member(auth.uid(), client_workspace_id));
CREATE POLICY "agency admins delete approvals" ON public.client_approvals FOR DELETE TO authenticated
  USING (public.is_agency_admin(auth.uid(), agency_workspace_id));

CREATE TRIGGER trg_client_approvals_updated BEFORE UPDATE ON public.client_approvals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. client_notes (internal only)
CREATE TABLE public.client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  agency_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  pinned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_client_notes_client ON public.client_notes(client_workspace_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.client_notes TO authenticated;
GRANT ALL ON public.client_notes TO service_role;
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency members read notes" ON public.client_notes FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), agency_workspace_id));
CREATE POLICY "agency members write notes" ON public.client_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), agency_workspace_id) AND author_id = auth.uid());
CREATE POLICY "author or admin updates notes" ON public.client_notes FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.is_agency_admin(auth.uid(), agency_workspace_id))
  WITH CHECK (author_id = auth.uid() OR public.is_agency_admin(auth.uid(), agency_workspace_id));
CREATE POLICY "author or admin deletes notes" ON public.client_notes FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_agency_admin(auth.uid(), agency_workspace_id));

CREATE TRIGGER trg_client_notes_updated BEFORE UPDATE ON public.client_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. shared_resources
CREATE TYPE public.shared_resource_kind AS ENUM ('template','asset','component','prompt');

CREATE TABLE public.shared_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  kind public.shared_resource_kind NOT NULL,
  title text NOT NULL,
  description text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_shared_resources_agency ON public.shared_resources(agency_workspace_id);
CREATE INDEX idx_shared_resources_kind ON public.shared_resources(kind);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shared_resources TO authenticated;
GRANT ALL ON public.shared_resources TO service_role;
ALTER TABLE public.shared_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency members read shared" ON public.shared_resources FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), agency_workspace_id));
CREATE POLICY "agency members write shared" ON public.shared_resources FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), agency_workspace_id));
CREATE POLICY "agency admins update shared" ON public.shared_resources FOR UPDATE TO authenticated
  USING (public.is_agency_admin(auth.uid(), agency_workspace_id))
  WITH CHECK (public.is_agency_admin(auth.uid(), agency_workspace_id));
CREATE POLICY "agency admins delete shared" ON public.shared_resources FOR DELETE TO authenticated
  USING (public.is_agency_admin(auth.uid(), agency_workspace_id));

CREATE TRIGGER trg_shared_resources_updated BEFORE UPDATE ON public.shared_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
