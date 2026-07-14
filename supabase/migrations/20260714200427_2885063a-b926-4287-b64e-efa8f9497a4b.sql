
DO $$ BEGIN
  CREATE TYPE public.bio_page_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE public.bio_page_visibility AS ENUM ('public','private','unlisted');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE public.bio_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  category text,
  description text,
  status public.bio_page_status NOT NULL DEFAULT 'draft',
  visibility public.bio_page_visibility NOT NULL DEFAULT 'public',
  archived_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX bio_pages_slug_unique ON public.bio_pages (lower(slug)) WHERE deleted_at IS NULL;
CREATE INDEX bio_pages_workspace_idx ON public.bio_pages (workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX bio_pages_owner_idx ON public.bio_pages (owner_id);
CREATE INDEX bio_pages_status_idx ON public.bio_pages (status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bio_pages TO authenticated;
GRANT ALL ON public.bio_pages TO service_role;

ALTER TABLE public.bio_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view workspace bio pages"
  ON public.bio_pages FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id) AND deleted_at IS NULL);

CREATE POLICY "Members can insert workspace bio pages"
  ON public.bio_pages FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id) AND owner_id = auth.uid());

CREATE POLICY "Members can update workspace bio pages"
  ON public.bio_pages FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete workspace bio pages"
  ON public.bio_pages FOR DELETE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Slug validation function
CREATE OR REPLACE FUNCTION public.validate_bio_page_slug()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.slug := lower(NEW.slug);
  IF NEW.slug !~ '^[a-z0-9_-]{3,50}$' THEN
    RAISE EXCEPTION 'Slug must be 3-50 chars: lowercase letters, numbers, hyphen, underscore';
  END IF;
  IF public.is_reserved_username(NEW.slug) THEN
    RAISE EXCEPTION 'Slug is reserved';
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER bio_pages_validate_slug
  BEFORE INSERT OR UPDATE OF slug ON public.bio_pages
  FOR EACH ROW EXECUTE FUNCTION public.validate_bio_page_slug();

CREATE TRIGGER bio_pages_updated_at
  BEFORE UPDATE ON public.bio_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
