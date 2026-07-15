
-- LS-12E: AI Workflow Engine tables

-- Workflow runs: single source of truth for pending/approved/executed/failed/rejected/scheduled AI actions
CREATE TABLE public.ai_workflow_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workflow_id TEXT NOT NULL,           -- registry key, e.g. "optimize_bio"
  trigger_type TEXT NOT NULL DEFAULT 'manual',   -- manual | scheduled | analytics_change | conversion_drop | bio_published | asset_uploaded | template_applied
  status TEXT NOT NULL DEFAULT 'pending',        -- pending | awaiting_approval | approved | rejected | running | completed | failed | scheduled | undone
  target JSONB NOT NULL DEFAULT '{}'::jsonb,     -- {kind:"bio_page"|"workspace"|"asset", id?}
  input JSONB NOT NULL DEFAULT '{}'::jsonb,
  preview JSONB NOT NULL DEFAULT '{}'::jsonb,    -- generated draft the user reviews
  result JSONB NOT NULL DEFAULT '{}'::jsonb,     -- applied outcome
  undo_data JSONB NOT NULL DEFAULT '{}'::jsonb,  -- snapshot to restore
  error TEXT,
  provider TEXT,                                 -- "lovable" | "openai" | ...
  model TEXT,
  latency_ms INTEGER,
  tokens_in INTEGER,
  tokens_out INTEGER,
  retries INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_workflow_runs TO authenticated;
GRANT ALL ON public.ai_workflow_runs TO service_role;
ALTER TABLE public.ai_workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_runs_select_members" ON public.ai_workflow_runs
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "workflow_runs_insert_members" ON public.ai_workflow_runs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id) AND user_id = auth.uid());
CREATE POLICY "workflow_runs_update_members" ON public.ai_workflow_runs
  FOR UPDATE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "workflow_runs_delete_members" ON public.ai_workflow_runs
  FOR DELETE TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE INDEX idx_workflow_runs_ws_status ON public.ai_workflow_runs(workspace_id, status, created_at DESC);
CREATE INDEX idx_workflow_runs_scheduled ON public.ai_workflow_runs(scheduled_at) WHERE status = 'scheduled';

CREATE TRIGGER trg_workflow_runs_updated
  BEFORE UPDATE ON public.ai_workflow_runs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Workspace-scoped AI memory (brand voice, tone, audience, prefs)
CREATE TABLE public.ai_workspace_memory (
  workspace_id UUID NOT NULL PRIMARY KEY REFERENCES public.workspaces(id) ON DELETE CASCADE,
  brand_voice TEXT,
  preferred_tone TEXT,
  target_audience TEXT,
  content_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  design_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_workspace_memory TO authenticated;
GRANT ALL ON public.ai_workspace_memory TO service_role;
ALTER TABLE public.ai_workspace_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_memory_select_members" ON public.ai_workspace_memory
  FOR SELECT TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "ai_memory_write_members" ON public.ai_workspace_memory
  FOR ALL TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER trg_ai_memory_updated
  BEFORE UPDATE ON public.ai_workspace_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
