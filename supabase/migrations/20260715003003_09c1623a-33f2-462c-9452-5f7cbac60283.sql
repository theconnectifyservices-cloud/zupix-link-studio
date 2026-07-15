
ALTER TABLE public.analytics_sessions
  ADD COLUMN IF NOT EXISTS max_scroll_pct smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS entry_url text,
  ADD COLUMN IF NOT EXISTS exit_url text,
  ADD COLUMN IF NOT EXISTS engagement_score smallint NOT NULL DEFAULT 0;

ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS block_type text,
  ADD COLUMN IF NOT EXISTS scroll_pct smallint;

CREATE INDEX IF NOT EXISTS analytics_events_block_type_idx
  ON public.analytics_events(workspace_id, block_type)
  WHERE block_type IS NOT NULL;
