
REVOKE EXECUTE ON FUNCTION public.workspace_permissions_of(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_workspace_permission(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.workspace_permissions_of(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_workspace_permission(uuid, uuid, text) TO service_role;
