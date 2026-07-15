-- BUG-004 follow-up: remove anonymous table privileges from private workspace tables.
REVOKE ALL PRIVILEGES ON public.workspace_members FROM anon;
REVOKE ALL PRIVILEGES ON public.workspaces FROM anon;

-- Profiles are publicly readable by design, but anonymous users must not mutate them.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER, MAINTAIN ON public.profiles FROM anon;
GRANT SELECT ON public.profiles TO anon;

-- Reassert authenticated and service-role Data API access after revokes.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_members TO authenticated;
GRANT ALL ON public.workspace_members TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;