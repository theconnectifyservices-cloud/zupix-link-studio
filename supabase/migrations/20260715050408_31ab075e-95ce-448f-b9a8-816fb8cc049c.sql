
-- Extend tenant_domains
DO $$ BEGIN
  CREATE TYPE public.ssl_status AS ENUM ('pending','provisioning','active','failed','expiring','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.tenant_domains
  ADD COLUMN IF NOT EXISTS ssl_status public.ssl_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS ssl_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS ssl_issuer text,
  ADD COLUMN IF NOT EXISTS ssl_last_error text,
  ADD COLUMN IF NOT EXISTS http_redirect_ok boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS www_redirect_ok boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS propagation_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS dns_records jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS health jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_wildcard boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes text;

-- SMTP configuration per tenant
CREATE TABLE IF NOT EXISTS public.tenant_smtp_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'custom',
  host text NOT NULL,
  port integer NOT NULL DEFAULT 587,
  secure boolean NOT NULL DEFAULT true,
  username text,
  password_ciphertext text,
  sender_name text,
  sender_email text NOT NULL,
  reply_to text,
  footer_html text,
  logo_url text,
  status text NOT NULL DEFAULT 'pending',
  last_verified_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_smtp_configs TO authenticated;
GRANT ALL ON public.tenant_smtp_configs TO service_role;
ALTER TABLE public.tenant_smtp_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "smtp_members_view" ON public.tenant_smtp_configs
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "smtp_admins_manage" ON public.tenant_smtp_configs
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));

CREATE TRIGGER update_tenant_smtp_configs_updated_at
  BEFORE UPDATE ON public.tenant_smtp_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Infrastructure alerts
CREATE TABLE IF NOT EXISTS public.tenant_infra_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  domain_id uuid REFERENCES public.tenant_domains(id) ON DELETE CASCADE,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_infra_alerts_tenant_idx
  ON public.tenant_infra_alerts(tenant_id, resolved, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_infra_alerts TO authenticated;
GRANT ALL ON public.tenant_infra_alerts TO service_role;
ALTER TABLE public.tenant_infra_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "alerts_members_view" ON public.tenant_infra_alerts
  FOR SELECT TO authenticated
  USING (public.is_tenant_member(auth.uid(), tenant_id));
CREATE POLICY "alerts_admins_manage" ON public.tenant_infra_alerts
  FOR ALL TO authenticated
  USING (public.is_tenant_admin(auth.uid(), tenant_id))
  WITH CHECK (public.is_tenant_admin(auth.uid(), tenant_id));
