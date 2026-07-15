
-- =========================================================
-- LS-10C: Smart Asset Organization
-- =========================================================

-- Enums
DO $$ BEGIN
  CREATE TYPE public.media_collection_kind AS ENUM ('manual','smart','dynamic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- COLLECTIONS ----------
CREATE TABLE IF NOT EXISTS public.media_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  kind public.media_collection_kind NOT NULL DEFAULT 'manual',
  rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  cover_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS media_collections_workspace_idx ON public.media_collections(workspace_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_collections TO authenticated;
GRANT ALL ON public.media_collections TO service_role;
ALTER TABLE public.media_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace members read collections" ON public.media_collections
  FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "workspace members insert collections" ON public.media_collections
  FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id) AND created_by = auth.uid());
CREATE POLICY "workspace members update collections" ON public.media_collections
  FOR UPDATE TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "workspace members delete collections" ON public.media_collections
  FOR DELETE TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER trg_media_collections_updated_at BEFORE UPDATE ON public.media_collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- COLLECTION ITEMS (manual) ----------
CREATE TABLE IF NOT EXISTS public.media_collection_items (
  collection_id UUID NOT NULL REFERENCES public.media_collections(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_id, asset_id)
);
CREATE INDEX IF NOT EXISTS media_collection_items_asset_idx ON public.media_collection_items(asset_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_collection_items TO authenticated;
GRANT ALL ON public.media_collection_items TO service_role;
ALTER TABLE public.media_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members manage collection items" ON public.media_collection_items
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.media_collections c WHERE c.id = collection_id AND public.is_workspace_member(auth.uid(), c.workspace_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.media_collections c WHERE c.id = collection_id AND public.is_workspace_member(auth.uid(), c.workspace_id)));

-- ---------- TAGS CATALOG ----------
CREATE TABLE IF NOT EXISTS public.media_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'slate',
  is_auto BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, name)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_tags TO authenticated;
GRANT ALL ON public.media_tags TO service_role;
ALTER TABLE public.media_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members manage tags" ON public.media_tags
  FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER trg_media_tags_updated_at BEFORE UPDATE ON public.media_tags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- BRAND KITS ----------
CREATE TABLE IF NOT EXISTS public.brand_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  logo_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  dark_logo_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  light_logo_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  favicon_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  social_share_asset_id UUID REFERENCES public.media_assets(id) ON DELETE SET NULL,
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  typography JSONB NOT NULL DEFAULT '{}'::jsonb,
  brand_asset_ids UUID[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS brand_kits_workspace_idx ON public.brand_kits(workspace_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_kits TO authenticated;
GRANT ALL ON public.brand_kits TO service_role;
ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members read brand kits" ON public.brand_kits
  FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "members insert brand kits" ON public.brand_kits
  FOR INSERT TO authenticated WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id) AND created_by = auth.uid());
CREATE POLICY "members update brand kits" ON public.brand_kits
  FOR UPDATE TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "members delete brand kits" ON public.brand_kits
  FOR DELETE TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER trg_brand_kits_updated_at BEFORE UPDATE ON public.brand_kits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------- ASSET VERSIONS ----------
CREATE TABLE IF NOT EXISTS public.media_asset_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  bucket TEXT NOT NULL,
  path TEXT NOT NULL,
  file_name TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  sha256 TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (asset_id, version_number)
);
CREATE INDEX IF NOT EXISTS media_asset_versions_asset_idx ON public.media_asset_versions(asset_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.media_asset_versions TO authenticated;
GRANT ALL ON public.media_asset_versions TO service_role;
ALTER TABLE public.media_asset_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members manage asset versions" ON public.media_asset_versions
  FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- ---------- ASSETS: add favorite + view counters + current version ----------
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS current_version INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS media_assets_favorite_idx ON public.media_assets(workspace_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS media_assets_last_used_idx ON public.media_assets(workspace_id, last_used_at DESC NULLS LAST);
