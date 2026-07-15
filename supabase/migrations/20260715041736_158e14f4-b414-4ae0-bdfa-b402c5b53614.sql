
-- Extend organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Link workspaces to organizations (department & org)
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS department_id uuid;
CREATE INDEX IF NOT EXISTS idx_workspaces_org ON public.workspaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_dept ON public.workspaces(department_id);

-- Helper: org admin
CREATE OR REPLACE FUNCTION public.is_org_admin(_user_id uuid, _org_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.organization_members
    WHERE user_id=_user_id AND organization_id=_org_id AND role IN ('owner','admin')
  );
$$;

-- =============== DEPARTMENTS ===============
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  head_user_id uuid,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, slug)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view departments" ON public.departments FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org admins manage departments" ON public.departments FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE TABLE IF NOT EXISTS public.department_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(department_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.department_members TO authenticated;
GRANT ALL ON public.department_members TO service_role;
ALTER TABLE public.department_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view department members" ON public.department_members FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.departments d WHERE d.id=department_id AND public.is_org_member(auth.uid(), d.organization_id)));
CREATE POLICY "Org admins manage dept members" ON public.department_members FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.departments d WHERE d.id=department_id AND public.is_org_admin(auth.uid(), d.organization_id)))
  WITH CHECK (EXISTS(SELECT 1 FROM public.departments d WHERE d.id=department_id AND public.is_org_admin(auth.uid(), d.organization_id)));

-- =============== LICENSES ===============
CREATE TABLE IF NOT EXISTS public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  tier text NOT NULL DEFAULT 'standard',
  seat_type text NOT NULL DEFAULT 'user', -- user | workspace | organization
  total_seats int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active', -- active | expired | suspended
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  auto_renew boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.licenses TO authenticated;
GRANT ALL ON public.licenses TO service_role;
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view licenses" ON public.licenses FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org admins manage licenses" ON public.licenses FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

CREATE TABLE IF NOT EXISTS public.license_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  assignee_type text NOT NULL, -- user | workspace
  user_id uuid,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid,
  UNIQUE(license_id, user_id),
  UNIQUE(license_id, workspace_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.license_seats TO authenticated;
GRANT ALL ON public.license_seats TO service_role;
ALTER TABLE public.license_seats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view seats" ON public.license_seats FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.licenses l WHERE l.id=license_id AND public.is_org_member(auth.uid(), l.organization_id)));
CREATE POLICY "Org admins manage seats" ON public.license_seats FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM public.licenses l WHERE l.id=license_id AND public.is_org_admin(auth.uid(), l.organization_id)))
  WITH CHECK (EXISTS(SELECT 1 FROM public.licenses l WHERE l.id=license_id AND public.is_org_admin(auth.uid(), l.organization_id)));

-- =============== GOVERNANCE POLICIES ===============
CREATE TABLE IF NOT EXISTS public.governance_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  password_min_length int NOT NULL DEFAULT 8,
  password_require_symbols boolean NOT NULL DEFAULT false,
  password_require_numbers boolean NOT NULL DEFAULT true,
  session_timeout_minutes int NOT NULL DEFAULT 480,
  mfa_required boolean NOT NULL DEFAULT false,
  workspace_creation_role text NOT NULL DEFAULT 'admin', -- any | admin | owner
  publishing_requires_approval boolean NOT NULL DEFAULT false,
  allowed_domains text[] NOT NULL DEFAULT '{}',
  api_access_enabled boolean NOT NULL DEFAULT true,
  api_ip_allowlist text[] NOT NULL DEFAULT '{}',
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.governance_policies TO authenticated;
GRANT ALL ON public.governance_policies TO service_role;
ALTER TABLE public.governance_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view policies" ON public.governance_policies FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org admins manage policies" ON public.governance_policies FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

-- =============== COMPLIANCE ===============
CREATE TABLE IF NOT EXISTS public.compliance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  framework text NOT NULL, -- gdpr | soc2 | iso27001 | hipaa
  status text NOT NULL DEFAULT 'not_started', -- not_started | in_progress | compliant | expired
  data_retention_days int NOT NULL DEFAULT 365,
  legal_hold boolean NOT NULL DEFAULT false,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_reviewed_at timestamptz,
  next_review_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(organization_id, framework)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.compliance_records TO authenticated;
GRANT ALL ON public.compliance_records TO service_role;
ALTER TABLE public.compliance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members view compliance" ON public.compliance_records FOR SELECT TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));
CREATE POLICY "Org admins manage compliance" ON public.compliance_records FOR ALL TO authenticated
  USING (public.is_org_admin(auth.uid(), organization_id))
  WITH CHECK (public.is_org_admin(auth.uid(), organization_id));

-- =============== ORG AUDIT (extends audit_logs; add read policy for org admins) ===============
DROP POLICY IF EXISTS "Org admins view org audit" ON public.audit_logs;
CREATE POLICY "Org admins view org audit" ON public.audit_logs FOR SELECT TO authenticated
  USING (organization_id IS NOT NULL AND public.is_org_admin(auth.uid(), organization_id));

-- updated_at triggers
CREATE TRIGGER trg_departments_updated BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_licenses_updated BEFORE UPDATE ON public.licenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_gov_updated BEFORE UPDATE ON public.governance_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_compliance_updated BEFORE UPDATE ON public.compliance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
