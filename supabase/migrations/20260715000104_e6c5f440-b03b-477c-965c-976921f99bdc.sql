
ALTER TABLE public.bio_pages
  ADD COLUMN IF NOT EXISTS share_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS qr_settings jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.qr_designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id uuid NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_favorite boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_qr_designs_page ON public.qr_designs(page_id);
CREATE INDEX IF NOT EXISTS idx_qr_designs_workspace ON public.qr_designs(workspace_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_designs TO authenticated;
GRANT ALL ON public.qr_designs TO service_role;

ALTER TABLE public.qr_designs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view qr designs"
  ON public.qr_designs FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can insert qr designs"
  ON public.qr_designs FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can update qr designs"
  ON public.qr_designs FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can delete qr designs"
  ON public.qr_designs FOR DELETE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER update_qr_designs_updated_at
  BEFORE UPDATE ON public.qr_designs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
