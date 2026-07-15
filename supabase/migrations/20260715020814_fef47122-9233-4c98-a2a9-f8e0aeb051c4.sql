
-- LS-11A Tracking Center: workspace-level tracking settings + per-page override slot (future)
ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS tracking_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.bio_pages
  ADD COLUMN IF NOT EXISTS tracking_overrides jsonb NOT NULL DEFAULT '{}'::jsonb;

-- SECURITY DEFINER function so the public bio renderer can read tracking
-- settings for a workspace WITHOUT granting anon a broad SELECT on workspaces.
-- Only returns data when the workspace has at least one published, public bio page.
CREATE OR REPLACE FUNCTION public.get_public_tracking(_workspace_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT w.tracking_settings
  FROM public.workspaces w
  WHERE w.id = _workspace_id
    AND EXISTS (
      SELECT 1 FROM public.bio_pages bp
      WHERE bp.workspace_id = w.id
        AND bp.status = 'published'
        AND bp.visibility = 'public'
        AND bp.deleted_at IS NULL
    )
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_tracking(uuid) TO anon, authenticated;
