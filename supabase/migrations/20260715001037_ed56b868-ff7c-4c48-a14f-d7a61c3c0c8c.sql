
-- Event type enum
DO $$ BEGIN
  CREATE TYPE public.analytics_event_type AS ENUM ('page_view','link_click','qr_scan','session_end');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.analytics_device_type AS ENUM ('mobile','tablet','desktop','bot','unknown');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sessions table
CREATE TABLE IF NOT EXISTS public.analytics_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  bio_page_id UUID NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  visitor_hash TEXT NOT NULL,
  session_key TEXT NOT NULL,
  is_returning BOOLEAN NOT NULL DEFAULT false,
  device_type public.analytics_device_type NOT NULL DEFAULT 'unknown',
  browser TEXT,
  os TEXT,
  screen_size TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  timezone TEXT,
  referrer_source TEXT,
  referrer_host TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  qr_source TEXT,
  page_views INT NOT NULL DEFAULT 1,
  link_clicks INT NOT NULL DEFAULT 0,
  is_bounce BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INT NOT NULL DEFAULT 0,
  UNIQUE (bio_page_id, session_key)
);

CREATE INDEX IF NOT EXISTS analytics_sessions_page_time_idx
  ON public.analytics_sessions (bio_page_id, started_at DESC);
CREATE INDEX IF NOT EXISTS analytics_sessions_workspace_time_idx
  ON public.analytics_sessions (workspace_id, started_at DESC);
CREATE INDEX IF NOT EXISTS analytics_sessions_visitor_idx
  ON public.analytics_sessions (bio_page_id, visitor_hash);

GRANT SELECT ON public.analytics_sessions TO authenticated;
GRANT ALL ON public.analytics_sessions TO service_role;

ALTER TABLE public.analytics_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members read sessions"
  ON public.analytics_sessions FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

-- Events table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id BIGSERIAL PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  bio_page_id UUID NOT NULL REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.analytics_sessions(id) ON DELETE SET NULL,
  visitor_hash TEXT NOT NULL,
  event_type public.analytics_event_type NOT NULL,
  block_id TEXT,
  link_url TEXT,
  link_host TEXT,
  click_source TEXT,
  referrer_source TEXT,
  referrer_host TEXT,
  device_type public.analytics_device_type NOT NULL DEFAULT 'unknown',
  browser TEXT,
  os TEXT,
  country TEXT,
  region TEXT,
  city TEXT,
  timezone TEXT,
  qr_source TEXT,
  duration_ms INT,
  is_bot BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_page_time_idx
  ON public.analytics_events (bio_page_id, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_workspace_time_idx
  ON public.analytics_events (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_type_idx
  ON public.analytics_events (bio_page_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_session_idx
  ON public.analytics_events (session_id);

GRANT SELECT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members read events"
  ON public.analytics_events FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
