REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_tracking(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.public_workspace_plan(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.is_reserved_username(text) TO anon;