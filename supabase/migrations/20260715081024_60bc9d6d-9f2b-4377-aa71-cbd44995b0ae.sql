-- BUG-004 security cleanup: helper functions are for authenticated RLS checks only.
REVOKE ALL ON FUNCTION public.user_owns_workspace(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.user_owns_workspace(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.user_owns_workspace(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owns_workspace(uuid, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.has_pending_workspace_invitation(uuid, uuid, public.workspace_role, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_pending_workspace_invitation(uuid, uuid, public.workspace_role, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_pending_workspace_invitation(uuid, uuid, public.workspace_role, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_pending_workspace_invitation(uuid, uuid, public.workspace_role, text) TO service_role;