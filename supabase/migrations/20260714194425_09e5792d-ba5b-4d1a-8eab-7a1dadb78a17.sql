
-- ============ ENUMS ============
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.account_status AS ENUM ('active', 'suspended', 'deleted');
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE public.account_type AS ENUM ('creator', 'business', 'agency', 'personal');

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  email text NOT NULL,
  avatar_url text,
  phone text,
  country text,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  account_type public.account_type,
  status public.account_status NOT NULL DEFAULT 'active',
  subscription_tier text NOT NULL DEFAULT 'free',
  active_workspace_id uuid,
  onboarding_completed boolean NOT NULL DEFAULT false,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ============ WORKSPACES ============
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- ============ WORKSPACE MEMBERS ============
CREATE TABLE public.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.workspace_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT ALL ON public.workspace_members TO service_role;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Security-definer helper to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.workspace_members WHERE user_id = _user_id AND workspace_id = _workspace_id);
$$;

CREATE POLICY "Members can view their workspaces" ON public.workspaces
  FOR SELECT USING (public.is_workspace_member(auth.uid(), id));
CREATE POLICY "Owners can update their workspaces" ON public.workspaces
  FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can create workspaces" ON public.workspaces
  FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can delete their workspaces" ON public.workspaces
  FOR DELETE USING (auth.uid() = owner_id);

CREATE POLICY "Members can view membership rows" ON public.workspace_members
  FOR SELECT USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Users can join as themselves" ON public.workspace_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============ USER ROLES ============
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- ============ USERNAME VALIDATION ============
CREATE OR REPLACE FUNCTION public.is_reserved_username(_username text)
RETURNS boolean LANGUAGE sql IMMUTABLE AS $$
  SELECT lower(_username) = ANY(ARRAY[
    'admin','administrator','root','api','www','app','auth','login','signup','signin',
    'logout','dashboard','settings','profile','account','user','users','help','support',
    'about','contact','privacy','terms','blog','docs','pricing','zupix','link','links',
    'bio','home','explore','discover','trending','new','test','demo','null','undefined',
    'system','staff','moderator','mod','owner','me','you','it','onboarding','billing',
    'workspace','workspaces','org','organization','team','teams','invite','share'
  ]);
$$;

CREATE OR REPLACE FUNCTION public.validate_username()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.username IS NOT NULL THEN
    NEW.username := lower(NEW.username);
    IF NEW.username !~ '^[a-z0-9_]{3,30}$' THEN
      RAISE EXCEPTION 'Username must be 3-30 chars, lowercase letters, numbers, or underscores';
    END IF;
    IF public.is_reserved_username(NEW.username) THEN
      RAISE EXCEPTION 'Username is reserved';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER validate_profile_username
  BEFORE INSERT OR UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_username();

-- ============ UPDATED_AT TRIGGER ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER workspaces_updated_at BEFORE UPDATE ON public.workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ AUTO-PROVISION ON SIGNUP ============
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ws_id uuid;
  base_slug text;
  final_slug text;
  counter int := 0;
  full_name text;
BEGIN
  full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (NEW.id, NEW.email, full_name, NEW.raw_user_meta_data->>'avatar_url');

  base_slug := regexp_replace(lower(split_part(NEW.email, '@', 1)), '[^a-z0-9]', '', 'g');
  IF base_slug = '' OR length(base_slug) < 3 THEN base_slug := 'workspace'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.workspaces WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || counter::text;
  END LOOP;

  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (full_name || '''s Workspace', final_slug, NEW.id)
  RETURNING id INTO ws_id;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (ws_id, NEW.id, 'owner');

  UPDATE public.profiles SET active_workspace_id = ws_id WHERE id = NEW.id;

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');

  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
