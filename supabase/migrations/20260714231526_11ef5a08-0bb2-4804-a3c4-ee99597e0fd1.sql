
-- 1. Extend bio_pages with publishing state
ALTER TABLE public.bio_pages
  ADD COLUMN IF NOT EXISTS published_content jsonb,
  ADD COLUMN IF NOT EXISTS published_at timestamptz,
  ADD COLUMN IF NOT EXISTS published_version_id uuid,
  ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamptz,
  ADD COLUMN IF NOT EXISTS scheduled_unpublish_at timestamptz,
  ADD COLUMN IF NOT EXISTS password_hash text;

-- 2. Tighten public RLS: anonymous visitors only see truly published, non-private pages
DROP POLICY IF EXISTS "Public can view public bio pages" ON public.bio_pages;
CREATE POLICY "Public can view published bio pages"
  ON public.bio_pages
  FOR SELECT
  TO anon
  USING (
    deleted_at IS NULL
    AND status = 'published'
    AND visibility IN ('public','unlisted','password')
  );

-- 3. Versions table
CREATE TABLE IF NOT EXISTS public.bio_page_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  label text NOT NULL DEFAULT 'Version',
  notes text,
  content jsonb NOT NULL,
  is_publish boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bio_page_versions_page_idx
  ON public.bio_page_versions (page_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bio_page_versions TO authenticated;
GRANT ALL ON public.bio_page_versions TO service_role;

ALTER TABLE public.bio_page_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view page versions"
  ON public.bio_page_versions FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Members can insert page versions"
  ON public.bio_page_versions FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Members can update page versions"
  ON public.bio_page_versions FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Members can delete page versions"
  ON public.bio_page_versions FOR DELETE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- 4. Publish events table (audit trail of publish lifecycle actions)
CREATE TABLE IF NOT EXISTS public.bio_page_publish_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('published','updated','restored','unpublished','archived','scheduled','scheduled_cancelled')),
  version_id uuid REFERENCES public.bio_page_versions(id) ON DELETE SET NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bio_page_publish_events_page_idx
  ON public.bio_page_publish_events (page_id, created_at DESC);

GRANT SELECT, INSERT ON public.bio_page_publish_events TO authenticated;
GRANT ALL ON public.bio_page_publish_events TO service_role;

ALTER TABLE public.bio_page_publish_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view publish events"
  ON public.bio_page_publish_events FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Members can insert publish events"
  ON public.bio_page_publish_events FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
