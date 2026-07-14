-- Workspace branding fields
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS subdomain TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS brand_name TEXT,
  ADD COLUMN IF NOT EXISTS favicon_url TEXT,
  ADD COLUMN IF NOT EXISTS social_image_url TEXT;

CREATE OR REPLACE FUNCTION public.validate_workspace_subdomain()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.subdomain IS NOT NULL THEN
    NEW.subdomain := lower(NEW.subdomain);
    IF NEW.subdomain !~ '^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$' THEN
      RAISE EXCEPTION 'Subdomain must be 3-30 chars: lowercase letters, numbers, hyphens (no leading/trailing hyphen)';
    END IF;
    IF public.is_reserved_username(NEW.subdomain) THEN
      RAISE EXCEPTION 'Subdomain is reserved';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_validate_workspace_subdomain ON public.workspaces;
CREATE TRIGGER trg_validate_workspace_subdomain
  BEFORE INSERT OR UPDATE OF subdomain ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.validate_workspace_subdomain();

-- Domains table
CREATE TABLE IF NOT EXISTS public.domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  host TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'custom' CHECK (kind IN ('subdomain','custom')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','failed')),
  ssl_status TEXT NOT NULL DEFAULT 'none' CHECK (ssl_status IN ('none','provisioning','active','expired','error')),
  verification_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(16),'hex'),
  verification_method TEXT NOT NULL DEFAULT 'txt' CHECK (verification_method IN ('txt','a_record')),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  target_page_id UUID REFERENCES public.bio_pages(id) ON DELETE SET NULL,
  redirect_type TEXT NOT NULL DEFAULT 'none' CHECK (redirect_type IN ('none','301','302')),
  redirect_to TEXT,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (host)
);

CREATE INDEX IF NOT EXISTS idx_domains_workspace ON public.domains(workspace_id);
CREATE INDEX IF NOT EXISTS idx_domains_status ON public.domains(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.domains TO authenticated;
GRANT ALL ON public.domains TO service_role;

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view domains" ON public.domains
  FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can insert domains" ON public.domains
  FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update domains" ON public.domains
  FOR UPDATE TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete domains" ON public.domains
  FOR DELETE TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE OR REPLACE FUNCTION public.validate_domain_host()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.host := lower(NEW.host);
  IF NEW.host !~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid domain host';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_validate_domain_host ON public.domains;
CREATE TRIGGER trg_validate_domain_host
  BEFORE INSERT OR UPDATE OF host ON public.domains
  FOR EACH ROW EXECUTE FUNCTION public.validate_domain_host();

DROP TRIGGER IF EXISTS trg_domains_updated_at ON public.domains;
CREATE TRIGGER trg_domains_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Only one primary domain per workspace
CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_one_primary
  ON public.domains(workspace_id) WHERE is_primary = true;