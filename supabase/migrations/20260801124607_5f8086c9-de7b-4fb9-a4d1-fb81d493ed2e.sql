
REVOKE EXECUTE ON FUNCTION public.media_recount_assets(uuid[]) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.media_sync_page_usages(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.media_resync_workspace_usages(uuid) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.media_replace_everywhere(uuid, uuid, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.media_sync_page_usages(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.media_resync_workspace_usages(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.media_replace_everywhere(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.media_recount_assets(uuid[]) TO service_role;
