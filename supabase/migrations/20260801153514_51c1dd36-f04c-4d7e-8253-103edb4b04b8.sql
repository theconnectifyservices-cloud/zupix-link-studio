REVOKE EXECUTE ON FUNCTION public.platform_user_plan(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.platform_user_targeted(uuid, public.platform_update_visibility, text[], uuid[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.platform_my_versions() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.platform_set_update_state(uuid, boolean, boolean, boolean, boolean, boolean) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.platform_update_analytics(uuid) FROM anon, public;

GRANT EXECUTE ON FUNCTION public.platform_user_plan(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.platform_user_targeted(uuid, public.platform_update_visibility, text[], uuid[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.platform_my_versions() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.platform_set_update_state(uuid, boolean, boolean, boolean, boolean, boolean) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.platform_update_analytics(uuid) TO authenticated, service_role;