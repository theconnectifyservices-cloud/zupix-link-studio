
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS health_score INTEGER;

CREATE INDEX IF NOT EXISTS media_assets_archived_at_idx ON public.media_assets(workspace_id, archived_at) WHERE archived_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS media_assets_deleted_at_idx ON public.media_assets(workspace_id, deleted_at) WHERE deleted_at IS NOT NULL;

ALTER TABLE public.workspaces
  ADD COLUMN IF NOT EXISTS trash_retention_days INTEGER NOT NULL DEFAULT 30;
