
-- FOLDERS
CREATE TABLE public.media_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.media_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  path text NOT NULL DEFAULT '/',
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_media_folders_workspace ON public.media_folders(workspace_id);
CREATE INDEX idx_media_folders_parent ON public.media_folders(parent_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_folders TO authenticated;
GRANT ALL ON public.media_folders TO service_role;
ALTER TABLE public.media_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members view folders" ON public.media_folders FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "workspace members create folders" ON public.media_folders FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id) AND auth.uid() = created_by);
CREATE POLICY "owner or admin update folders" ON public.media_folders FOR UPDATE
  USING (auth.uid() = created_by OR public.workspace_role_of(auth.uid(), workspace_id) = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]));
CREATE POLICY "owner or admin delete folders" ON public.media_folders FOR DELETE
  USING (auth.uid() = created_by OR public.workspace_role_of(auth.uid(), workspace_id) = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role]));

CREATE TRIGGER trg_media_folders_updated BEFORE UPDATE ON public.media_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- EXTEND media_assets
ALTER TABLE public.media_assets
  ADD COLUMN folder_id uuid REFERENCES public.media_folders(id) ON DELETE SET NULL,
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN alt_text text,
  ADD COLUMN sha256 text,
  ADD COLUMN thumbnail_path text,
  ADD COLUMN usage_count integer NOT NULL DEFAULT 0,
  ADD COLUMN last_used_at timestamptz;

CREATE INDEX idx_media_folder ON public.media_assets(folder_id);
CREATE INDEX idx_media_sha256 ON public.media_assets(workspace_id, sha256);
CREATE INDEX idx_media_tags ON public.media_assets USING gin(tags);
CREATE INDEX idx_media_kind ON public.media_assets(workspace_id, kind);
CREATE INDEX idx_media_created ON public.media_assets(workspace_id, created_at DESC);

-- USAGE TRACKING
CREATE TABLE public.media_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  bio_page_id uuid REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  block_id text,
  context text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, bio_page_id, block_id)
);
CREATE INDEX idx_media_usages_asset ON public.media_usages(asset_id);
CREATE INDEX idx_media_usages_page ON public.media_usages(bio_page_id);
CREATE INDEX idx_media_usages_ws ON public.media_usages(workspace_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_usages TO authenticated;
GRANT ALL ON public.media_usages TO service_role;
ALTER TABLE public.media_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members view usages" ON public.media_usages FOR SELECT
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "members insert usages" ON public.media_usages FOR INSERT
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "members delete usages" ON public.media_usages FOR DELETE
  USING (public.is_workspace_member(auth.uid(), workspace_id));
