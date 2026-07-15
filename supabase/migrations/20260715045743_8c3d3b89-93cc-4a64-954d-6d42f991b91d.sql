
-- Enums
DO $$ BEGIN
  CREATE TYPE public.reseller_client_status AS ENUM ('lead','trial','active','suspended','expired','archived','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reseller_priority AS ENUM ('low','normal','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reseller_support_status AS ENUM ('none','open','pending','resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reseller_team_role AS ENUM ('owner','admin','sales','support','designer','developer','viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reseller_note_kind AS ENUM ('internal','support');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Clients
CREATE TABLE IF NOT EXISTS public.reseller_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  contact_name text,
  contact_email text,
  contact_phone text,
  status public.reseller_client_status NOT NULL DEFAULT 'lead',
  priority public.reseller_priority NOT NULL DEFAULT 'normal',
  support_status public.reseller_support_status NOT NULL DEFAULT 'none',
  plan_key text,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  custom_domain text,
  assigned_staff_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  trial_ends_at timestamptz,
  subscription_expires_at timestamptz,
  activated_at timestamptz,
  suspended_at timestamptz,
  archived_at timestamptz,
  tags text[] NOT NULL DEFAULT '{}',
  usage jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reseller_clients_tenant ON public.reseller_clients(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reseller_clients_status ON public.reseller_clients(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_reseller_clients_search ON public.reseller_clients USING gin (to_tsvector('simple', coalesce(company_name,'') || ' ' || coalesce(contact_email,'') || ' ' || coalesce(contact_name,'')));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reseller_clients TO authenticated;
GRANT ALL ON public.reseller_clients TO service_role;
ALTER TABLE public.reseller_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reseller_clients_select" ON public.reseller_clients FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "reseller_clients_insert" ON public.reseller_clients FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "reseller_clients_update" ON public.reseller_clients FOR UPDATE TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "reseller_clients_delete" ON public.reseller_clients FOR DELETE TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_reseller_clients_updated_at
  BEFORE UPDATE ON public.reseller_clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notes
CREATE TABLE IF NOT EXISTS public.reseller_client_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.reseller_clients(id) ON DELETE CASCADE,
  kind public.reseller_note_kind NOT NULL DEFAULT 'internal',
  body text NOT NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_reseller_notes_client ON public.reseller_client_notes(client_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reseller_client_notes TO authenticated;
GRANT ALL ON public.reseller_client_notes TO service_role;
ALTER TABLE public.reseller_client_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reseller_notes_select" ON public.reseller_client_notes FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "reseller_notes_insert" ON public.reseller_client_notes FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_member(auth.uid(), tenant_id) AND author_id = auth.uid());
CREATE POLICY "reseller_notes_update" ON public.reseller_client_notes FOR UPDATE TO authenticated
  USING (author_id = auth.uid() OR public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (author_id = auth.uid() OR public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "reseller_notes_delete" ON public.reseller_client_notes FOR DELETE TO authenticated
  USING (author_id = auth.uid() OR public.is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_reseller_notes_updated_at
  BEFORE UPDATE ON public.reseller_client_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Team members (staff)
CREATE TABLE IF NOT EXISTS public.reseller_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.reseller_team_role NOT NULL DEFAULT 'viewer',
  custom_role_key text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reseller_team_tenant ON public.reseller_team_members(tenant_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reseller_team_members TO authenticated;
GRANT ALL ON public.reseller_team_members TO service_role;
ALTER TABLE public.reseller_team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reseller_team_select" ON public.reseller_team_members FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "reseller_team_insert" ON public.reseller_team_members FOR INSERT TO authenticated
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "reseller_team_update" ON public.reseller_team_members FOR UPDATE TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));
CREATE POLICY "reseller_team_delete" ON public.reseller_team_members FOR DELETE TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER trg_reseller_team_updated_at
  BEFORE UPDATE ON public.reseller_team_members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
