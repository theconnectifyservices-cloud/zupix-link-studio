
-- Connected identity providers
CREATE TABLE public.connected_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  email text,
  display_name text,
  avatar_url text,
  scopes text[] DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'active',
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_account_id),
  UNIQUE (user_id, provider)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connected_accounts TO authenticated;
GRANT ALL ON public.connected_accounts TO service_role;
ALTER TABLE public.connected_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own accounts" ON public.connected_accounts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER connected_accounts_updated BEFORE UPDATE ON public.connected_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Login history
CREATE TABLE public.login_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'email',
  success boolean NOT NULL DEFAULT true,
  failure_reason text,
  ip_address inet,
  user_agent text,
  browser text,
  os text,
  device_type text,
  location jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.login_history TO authenticated;
GRANT ALL ON public.login_history TO service_role;
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read own login history" ON public.login_history FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "insert own login history" ON public.login_history FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE INDEX login_history_user_created_idx ON public.login_history (user_id, created_at DESC);

-- Connected apps (third-party apps granted access — foundation)
CREATE TABLE public.connected_apps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE,
  app_name text NOT NULL,
  app_slug text NOT NULL,
  app_icon_url text,
  permissions text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'active',
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connected_apps TO authenticated;
GRANT ALL ON public.connected_apps TO service_role;
ALTER TABLE public.connected_apps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own apps" ON public.connected_apps FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER connected_apps_updated BEFORE UPDATE ON public.connected_apps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enterprise SSO foundation
CREATE TABLE public.sso_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  protocol text NOT NULL,
  provider_name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  entity_id text,
  sso_url text,
  metadata_url text,
  x509_cert text,
  scim_enabled boolean NOT NULL DEFAULT false,
  scim_token_hash text,
  role_mappings jsonb NOT NULL DEFAULT '{}'::jsonb,
  domain_allowlist text[] DEFAULT '{}'::text[],
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sso_configurations TO authenticated;
GRANT ALL ON public.sso_configurations TO service_role;
ALTER TABLE public.sso_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workspace owners manage sso" ON public.sso_configurations FOR ALL TO authenticated
  USING (public.workspace_role_of(auth.uid(), workspace_id) IN ('owner','admin'))
  WITH CHECK (public.workspace_role_of(auth.uid(), workspace_id) IN ('owner','admin'));
CREATE TRIGGER sso_configurations_updated BEFORE UPDATE ON public.sso_configurations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security alerts
CREATE TABLE public.security_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  severity text NOT NULL DEFAULT 'info',
  category text NOT NULL,
  title text NOT NULL,
  message text,
  read_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_alerts TO authenticated;
GRANT ALL ON public.security_alerts TO service_role;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own alerts" ON public.security_alerts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Extend profiles with recovery + MFA foundation
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS recovery_email text,
  ADD COLUMN IF NOT EXISTS recovery_phone text,
  ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS security_alerts_enabled boolean NOT NULL DEFAULT true;
