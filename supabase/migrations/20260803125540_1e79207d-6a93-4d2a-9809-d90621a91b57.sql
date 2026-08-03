CREATE TABLE public.bio_store_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'service',
  title text NOT NULL,
  subtitle text,
  description text,
  long_description text,
  cover_image text,
  gallery jsonb NOT NULL DEFAULT '[]'::jsonb,
  price numeric(12,2),
  old_price numeric(12,2),
  currency text NOT NULL DEFAULT '₹',
  badge text NOT NULL DEFAULT 'none',
  action text NOT NULL DEFAULT 'external',
  button_label text,
  url text,
  download_url text,
  whatsapp_number text,
  whatsapp_message text,
  hidden boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bio_store_items TO authenticated;
GRANT ALL ON public.bio_store_items TO service_role;

ALTER TABLE public.bio_store_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members manage store items"
ON public.bio_store_items FOR ALL TO authenticated
USING (public.is_workspace_member(auth.uid(), workspace_id))
WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE INDEX bio_store_items_workspace_sort_idx
  ON public.bio_store_items (workspace_id, sort_order, created_at);

CREATE TRIGGER update_bio_store_items_updated_at
BEFORE UPDATE ON public.bio_store_items
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();