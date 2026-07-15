CREATE OR REPLACE FUNCTION public.ensure_personal_workspace()
RETURNS public.workspaces
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  u_email text;
  u_meta jsonb;
  full_name text;
  ws public.workspaces;
  existing_id uuid;
  base_slug text;
  final_slug text;
  counter int := 0;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Prefer the profile's active workspace if it still exists AND user is a member.
  SELECT active_workspace_id INTO existing_id FROM public.profiles WHERE id = uid;
  IF existing_id IS NOT NULL THEN
    SELECT w.* INTO ws FROM public.workspaces w
      JOIN public.workspace_members m ON m.workspace_id = w.id AND m.user_id = uid
     WHERE w.id = existing_id LIMIT 1;
    IF FOUND THEN RETURN ws; END IF;
  END IF;

  -- 2. Any existing membership → use the first, set as active.
  SELECT w.* INTO ws FROM public.workspaces w
    JOIN public.workspace_members m ON m.workspace_id = w.id
   WHERE m.user_id = uid
   ORDER BY w.created_at ASC LIMIT 1;
  IF FOUND THEN
    UPDATE public.profiles SET active_workspace_id = ws.id WHERE id = uid;
    RETURN ws;
  END IF;

  -- 3. Provision a new personal workspace.
  SELECT email, raw_user_meta_data INTO u_email, u_meta FROM auth.users WHERE id = uid;
  full_name := COALESCE(u_meta->>'full_name', u_meta->>'name', split_part(u_email, '@', 1), 'My');

  base_slug := regexp_replace(lower(split_part(COALESCE(u_email, uid::text), '@', 1)), '[^a-z0-9]', '', 'g');
  IF base_slug = '' OR length(base_slug) < 3 THEN base_slug := 'workspace'; END IF;
  final_slug := base_slug;
  WHILE EXISTS (SELECT 1 FROM public.workspaces WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || counter::text;
  END LOOP;

  INSERT INTO public.workspaces (name, slug, owner_id)
  VALUES (full_name || '''s Workspace', final_slug, uid)
  RETURNING * INTO ws;

  INSERT INTO public.workspace_members (workspace_id, user_id, role)
  VALUES (ws.id, uid, 'owner')
  ON CONFLICT (workspace_id, user_id) DO NOTHING;

  -- Ensure a profile row exists (in case trigger missed it), then set active.
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (uid, u_email, full_name)
  ON CONFLICT (id) DO NOTHING;

  UPDATE public.profiles SET active_workspace_id = ws.id WHERE id = uid;

  RETURN ws;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_personal_workspace() TO authenticated;