
-- Enterprise Custom Code Studio: reusable HTML Library + workspace JS toggle

ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS allow_custom_js BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE public.html_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  scope TEXT NOT NULL DEFAULT 'workspace' CHECK (scope IN ('global','workspace','page','theme')),
  page_id UUID,
  theme_key TEXT,
  html TEXT NOT NULL DEFAULT '',
  css TEXT NOT NULL DEFAULT '',
  js TEXT NOT NULL DEFAULT '',
  preset_key TEXT,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX html_library_workspace_idx ON public.html_library(workspace_id);
CREATE INDEX html_library_scope_idx ON public.html_library(scope);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.html_library TO authenticated;
GRANT ALL ON public.html_library TO service_role;

ALTER TABLE public.html_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read library"
  ON public.html_library FOR SELECT TO authenticated
  USING (
    scope = 'global'
    OR public.is_workspace_member(auth.uid(), workspace_id)
  );

CREATE POLICY "Members can insert"
  ON public.html_library FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND public.is_workspace_member(auth.uid(), workspace_id)
  );

CREATE POLICY "Members can update"
  ON public.html_library FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete"
  ON public.html_library FOR DELETE TO authenticated
  USING (public.is_workspace_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_html_library_updated_at
  BEFORE UPDATE ON public.html_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
