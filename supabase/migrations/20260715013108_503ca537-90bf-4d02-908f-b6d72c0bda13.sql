
DO $$ BEGIN
  CREATE TYPE public.media_processing_status AS ENUM ('pending','processing','completed','failed','skipped');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS original_size_bytes  BIGINT,
  ADD COLUMN IF NOT EXISTS optimized_size_bytes BIGINT,
  ADD COLUMN IF NOT EXISTS variants             JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS video_thumbnail_path TEXT,
  ADD COLUMN IF NOT EXISTS blurhash             TEXT,
  ADD COLUMN IF NOT EXISTS processing_status    public.media_processing_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS processing_error     TEXT,
  ADD COLUMN IF NOT EXISTS processed_at         TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_media_assets_processing_status
  ON public.media_assets(processing_status)
  WHERE deleted_at IS NULL;
