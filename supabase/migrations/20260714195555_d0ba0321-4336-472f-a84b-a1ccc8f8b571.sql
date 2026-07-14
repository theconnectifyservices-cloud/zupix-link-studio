
REVOKE EXECUTE ON FUNCTION public.is_org_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.org_role_of(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.workspace_role_of(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_workspace_member(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_reserved_username(text) FROM PUBLIC, anon, authenticated;

-- ensure search_path set on is_reserved_username (immutable func flagged)
CREATE OR REPLACE FUNCTION public.is_reserved_username(_username text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT lower(_username) = ANY(ARRAY[
    'admin','administrator','root','api','www','app','auth','login','signup','signin',
    'logout','dashboard','settings','profile','account','user','users','help','support',
    'about','contact','privacy','terms','blog','docs','pricing','zupix','link','links',
    'bio','home','explore','discover','trending','new','test','demo','null','undefined',
    'system','staff','moderator','mod','owner','me','you','it','onboarding','billing',
    'workspace','workspaces','org','organization','team','teams','invite','share'
  ]);
$$;
REVOKE EXECUTE ON FUNCTION public.is_reserved_username(text) FROM PUBLIC, anon, authenticated;
