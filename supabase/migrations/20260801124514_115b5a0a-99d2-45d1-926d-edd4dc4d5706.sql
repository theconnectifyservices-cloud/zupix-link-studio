
-- Recalculate usage counters for a set of assets
CREATE OR REPLACE FUNCTION public.media_recount_assets(_ids uuid[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.media_assets a
     SET usage_count = (SELECT count(*) FROM public.media_usages u WHERE u.asset_id = a.id),
         last_used_at = CASE
           WHEN EXISTS (SELECT 1 FROM public.media_usages u WHERE u.asset_id = a.id) THEN now()
           ELSE a.last_used_at END
   WHERE a.id = ANY(coalesce(_ids, '{}'::uuid[]));
$$;

-- Rebuild the usage graph for a single bio page from its saved content
CREATE OR REPLACE FUNCTION public.media_sync_page_usages(_bio_page_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ws uuid;
  body jsonb;
  affected uuid[] := '{}';
  total int := 0;
BEGIN
  SELECT workspace_id, coalesce(content, '{}'::jsonb) INTO ws, body
    FROM public.bio_pages WHERE id = _bio_page_id AND deleted_at IS NULL;
  IF ws IS NULL THEN RETURN 0; END IF;

  IF auth.uid() IS NULL OR NOT (
       public.is_workspace_member(auth.uid(), ws)
       OR public.has_role(auth.uid(), 'super_admin')
     ) THEN
    RAISE EXCEPTION 'Not authorized for this workspace';
  END IF;

  SELECT coalesce(array_agg(DISTINCT asset_id), '{}') INTO affected
    FROM public.media_usages WHERE bio_page_id = _bio_page_id;

  DELETE FROM public.media_usages WHERE bio_page_id = _bio_page_id;

  IF jsonb_typeof(body -> 'blocks') = 'array' THEN
    INSERT INTO public.media_usages (asset_id, workspace_id, bio_page_id, block_id, context)
    SELECT DISTINCT a.id, ws, _bio_page_id, b.value ->> 'id', coalesce(b.value ->> 'type', 'section')
      FROM public.media_assets a
      CROSS JOIN LATERAL jsonb_array_elements(body -> 'blocks') b(value)
     WHERE a.workspace_id = ws
       AND a.deleted_at IS NULL
       AND position(a.path IN b.value::text) > 0;
  END IF;

  INSERT INTO public.media_usages (asset_id, workspace_id, bio_page_id, block_id, context)
  SELECT DISTINCT a.id, ws, _bio_page_id, NULL, 'page settings'
    FROM public.media_assets a
   WHERE a.workspace_id = ws
     AND a.deleted_at IS NULL
     AND position(a.path IN (body - 'blocks')::text) > 0;

  SELECT count(*) INTO total FROM public.media_usages WHERE bio_page_id = _bio_page_id;

  affected := affected || coalesce(
    (SELECT array_agg(DISTINCT asset_id) FROM public.media_usages WHERE bio_page_id = _bio_page_id),
    '{}'::uuid[]);

  PERFORM public.media_recount_assets(affected);
  RETURN total;
END;
$$;

-- Rebuild the usage graph for every page in a workspace (auto-migration)
CREATE OR REPLACE FUNCTION public.media_resync_workspace_usages(_workspace_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE p record; total int := 0;
BEGIN
  IF auth.uid() IS NULL OR NOT (
       public.is_workspace_member(auth.uid(), _workspace_id)
       OR public.has_role(auth.uid(), 'super_admin')
     ) THEN
    RAISE EXCEPTION 'Not authorized for this workspace';
  END IF;

  FOR p IN SELECT id FROM public.bio_pages
            WHERE workspace_id = _workspace_id AND deleted_at IS NULL
  LOOP
    total := total + public.media_sync_page_usages(p.id);
  END LOOP;

  PERFORM public.media_recount_assets(
    (SELECT coalesce(array_agg(id), '{}') FROM public.media_assets WHERE workspace_id = _workspace_id));
  RETURN total;
END;
$$;

-- Swap one asset for another everywhere it is referenced
CREATE OR REPLACE FUNCTION public.media_replace_everywhere(_old_asset uuid, _new_asset uuid, _new_url text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ws uuid; old_path text; new_ws uuid; pat text; p record; changed int := 0;
BEGIN
  SELECT workspace_id, path INTO ws, old_path FROM public.media_assets WHERE id = _old_asset;
  SELECT workspace_id INTO new_ws FROM public.media_assets WHERE id = _new_asset;
  IF ws IS NULL OR new_ws IS NULL OR ws <> new_ws THEN
    RAISE EXCEPTION 'Assets must belong to the same workspace';
  END IF;
  IF auth.uid() IS NULL OR NOT (
       public.is_workspace_member(auth.uid(), ws)
       OR public.has_role(auth.uid(), 'super_admin')
     ) THEN
    RAISE EXCEPTION 'Not authorized for this workspace';
  END IF;
  IF coalesce(_new_url, '') = '' THEN
    RAISE EXCEPTION 'A replacement URL is required';
  END IF;

  pat := '[^"]*' || regexp_replace(old_path, '([^a-zA-Z0-9_])', '\\\1', 'g') || '[^"]*';

  FOR p IN SELECT id, content FROM public.bio_pages
            WHERE workspace_id = ws AND deleted_at IS NULL
              AND position(old_path IN coalesce(content, '{}'::jsonb)::text) > 0
  LOOP
    UPDATE public.bio_pages
       SET content = regexp_replace(p.content::text, pat, replace(_new_url, '\', '\\'), 'g')::jsonb,
           updated_at = now()
     WHERE id = p.id;
    PERFORM public.media_sync_page_usages(p.id);
    changed := changed + 1;
  END LOOP;

  PERFORM public.media_recount_assets(ARRAY[_old_asset, _new_asset]);
  RETURN changed;
END;
$$;
