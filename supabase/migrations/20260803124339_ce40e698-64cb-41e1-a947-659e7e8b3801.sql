ALTER TABLE public.bio_leads
  ADD COLUMN IF NOT EXISTS ip_address text,
  ADD COLUMN IF NOT EXISTS browser text,
  ADD COLUMN IF NOT EXISTS device_type text,
  ADD COLUMN IF NOT EXISTS page_url text,
  ADD COLUMN IF NOT EXISTS dedupe_hash text,
  ADD COLUMN IF NOT EXISTS attachments jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS bio_leads_dedupe_idx
  ON public.bio_leads (bio_page_id, dedupe_hash, created_at DESC);

CREATE OR REPLACE FUNCTION public.workspace_leads_this_month(_workspace_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
    FROM public.bio_leads
   WHERE workspace_id = _workspace_id
     AND created_at >= date_trunc('month', now());
$$;

GRANT EXECUTE ON FUNCTION public.workspace_leads_this_month(uuid) TO authenticated, service_role;