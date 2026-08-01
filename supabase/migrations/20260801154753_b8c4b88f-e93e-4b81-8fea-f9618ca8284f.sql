DROP FUNCTION IF EXISTS public.platform_set_update_state(uuid, boolean, boolean, boolean, boolean, boolean);
REVOKE ALL ON FUNCTION public.platform_my_versions() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.platform_my_versions() TO authenticated, service_role;