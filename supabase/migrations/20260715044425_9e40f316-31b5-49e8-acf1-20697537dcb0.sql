
-- =====================
-- WHITE LABEL FOUNDATION
-- =====================

CREATE TYPE public.tenant_status AS ENUM ('active','suspended','archived');
CREATE TYPE public.tenant_member_role AS ENUM ('owner','admin');
CREATE TYPE public.tenant_domain_kind AS ENUM ('primary','portal','login','other');
CREATE TYPE public.tenant_domain_status AS ENUM ('pending','verified','failed');

-- Tenants
CREATE TABLE public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  company_name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.tenant_status NOT NULL DEFAULT 'active',

  -- Branding
  logo_url text,
  logo_dark_url text,
  favicon_url text,
  primary_color text DEFAULT '#6366F1',
  secondary_color text DEFAULT '#0EA5E9',
  typography jsonb NOT NULL DEFAULT '{"heading":"Inter","body":"Inter"}'::jsonb,
  loading_screen jsonb NOT NULL DEFAULT '{}'::jsonb,
  email_signature text,

  -- Custom login experience
  login_background_url text,
  login_footer_html text,
  login_headline text,
  login_subheadline text,
  register_enabled boolean NOT NULL DEFAULT true,
  forgot_enabled boolean NOT NULL DEFAULT true,

  -- Email branding
  email_sender_name text,
  email_sender_email text,
  email_reply_to text,
  email_logo_url text,
  email_footer_html text,

  -- White-label toggles
  hide_powered_by boolean NOT NULL DEFAULT false,
  hide_zupix_logo boolean NOT NULL DEFAULT false,
  hide_default_branding boolean NOT NULL DEFAULT false,
  hide_developer_links boolean NOT NULL DEFAULT false,

  -- Configuration
  brand_kit jsonb NOT NULL DEFAULT '{}'::jsonb,
  billing_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  feature_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  workspace_limit int NOT NULL DEFAULT 10,
  ai_credit_limit int NOT NULL DEFAULT 1000,
  storage_limit_mb int NOT NULL DEFAULT 5000,

  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenants TO authenticated;
GRANT ALL ON public.tenants TO service_role;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

-- Members
CREATE TABLE public.tenant_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.tenant_member_role NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_members TO authenticated;
GRANT ALL ON public.tenant_members TO service_role;
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;

-- Domains
CREATE TABLE public.tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  host text NOT NULL UNIQUE,
  kind public.tenant_domain_kind NOT NULL DEFAULT 'primary',
  status public.tenant_domain_status NOT NULL DEFAULT 'pending',
  verification_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_primary boolean NOT NULL DEFAULT false,
  custom_login_url text,
  last_checked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_domains TO authenticated;
GRANT ALL ON public.tenant_domains TO service_role;
ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER to avoid recursive RLS)
CREATE OR REPLACE FUNCTION public.is_tenant_member(_user_id uuid, _tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants t WHERE t.id = _tenant_id AND t.owner_id = _user_id
    UNION
    SELECT 1 FROM public.tenant_members m WHERE m.tenant_id = _tenant_id AND m.user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_tenant_admin(_user_id uuid, _tenant_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenants t WHERE t.id = _tenant_id AND t.owner_id = _user_id
    UNION
    SELECT 1 FROM public.tenant_members m
     WHERE m.tenant_id = _tenant_id AND m.user_id = _user_id AND m.role IN ('owner','admin')
  );
$$;

-- Policies: tenants
CREATE POLICY "Tenant members can view tenant" ON public.tenants
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_tenant_member(auth.uid(), id));

CREATE POLICY "Users can create tenants they own" ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Tenant admins can update" ON public.tenants
  FOR UPDATE TO authenticated
  USING (public.is_tenant_admin(auth.uid(), id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), id));

CREATE POLICY "Tenant owner can delete" ON public.tenants
  FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

-- Policies: tenant_members
CREATE POLICY "Members can view roster" ON public.tenant_members
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins manage members" ON public.tenant_members
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

-- Policies: tenant_domains
CREATE POLICY "Members view domains" ON public.tenant_domains
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));

CREATE POLICY "Admins manage domains" ON public.tenant_domains
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

-- Triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tenant_domains_updated_at BEFORE UPDATE ON public.tenant_domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-add owner as member
CREATE OR REPLACE FUNCTION public.handle_new_tenant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.tenant_members (tenant_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner')
  ON CONFLICT (tenant_id, user_id) DO NOTHING;
  RETURN NEW;
END;$$;

CREATE TRIGGER on_tenant_created
  AFTER INSERT ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_tenant();

-- Slug validation
CREATE OR REPLACE FUNCTION public.validate_tenant_slug()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.slug := lower(NEW.slug);
  IF NEW.slug !~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$' THEN
    RAISE EXCEPTION 'Slug must be 3-50 chars: lowercase letters, numbers, hyphens';
  END IF;
  IF public.is_reserved_username(NEW.slug) THEN
    RAISE EXCEPTION 'Slug is reserved';
  END IF;
  RETURN NEW;
END;$$;

CREATE TRIGGER validate_tenant_slug_trigger BEFORE INSERT OR UPDATE OF slug ON public.tenants
  FOR EACH ROW EXECUTE FUNCTION public.validate_tenant_slug();

-- Host validation reuse
CREATE TRIGGER validate_tenant_domain_host BEFORE INSERT OR UPDATE OF host ON public.tenant_domains
  FOR EACH ROW EXECUTE FUNCTION public.validate_domain_host();
