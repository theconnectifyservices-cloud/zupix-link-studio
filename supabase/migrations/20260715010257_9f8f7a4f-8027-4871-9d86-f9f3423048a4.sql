
-- Campaign status enum
DO $$ BEGIN
  CREATE TYPE public.campaign_status AS ENUM ('draft','active','paused','completed','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  bio_page_id UUID REFERENCES public.bio_pages(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  status public.campaign_status NOT NULL DEFAULT 'draft',
  utm_source TEXT NOT NULL,
  utm_medium TEXT NOT NULL,
  utm_campaign TEXT NOT NULL,
  utm_term TEXT,
  utm_content TEXT,
  target_url TEXT NOT NULL,
  short_code TEXT UNIQUE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view campaigns"
  ON public.campaigns FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can insert campaigns"
  ON public.campaigns FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can update campaigns"
  ON public.campaigns FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Workspace members can delete campaigns"
  ON public.campaigns FOR DELETE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE INDEX IF NOT EXISTS campaigns_ws_status_idx ON public.campaigns(workspace_id, status);
CREATE INDEX IF NOT EXISTS campaigns_ws_created_idx ON public.campaigns(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS campaigns_short_code_idx ON public.campaigns(short_code) WHERE short_code IS NOT NULL;

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Extend analytics_sessions with campaign attribution
ALTER TABLE public.analytics_sessions
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS analytics_sessions_ws_campaign_idx
  ON public.analytics_sessions(workspace_id, campaign_id) WHERE campaign_id IS NOT NULL;

-- Extend analytics_events with UTM + campaign for per-event attribution
ALTER TABLE public.analytics_events
  ADD COLUMN IF NOT EXISTS utm_source TEXT,
  ADD COLUMN IF NOT EXISTS utm_medium TEXT,
  ADD COLUMN IF NOT EXISTS utm_campaign TEXT,
  ADD COLUMN IF NOT EXISTS utm_term TEXT,
  ADD COLUMN IF NOT EXISTS utm_content TEXT,
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS analytics_events_ws_campaign_idx
  ON public.analytics_events(workspace_id, campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS analytics_events_ws_utm_source_idx
  ON public.analytics_events(workspace_id, utm_source) WHERE utm_source IS NOT NULL;
