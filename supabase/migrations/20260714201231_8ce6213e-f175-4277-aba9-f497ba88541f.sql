
ALTER TABLE public.bio_pages
  ADD COLUMN IF NOT EXISTS content jsonb NOT NULL DEFAULT '{"blocks":[]}'::jsonb,
  ADD COLUMN IF NOT EXISTS last_saved_at timestamptz;
