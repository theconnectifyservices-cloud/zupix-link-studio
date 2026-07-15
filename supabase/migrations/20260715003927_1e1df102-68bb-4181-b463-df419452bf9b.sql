
CREATE TYPE public.conversion_goal_type AS ENUM (
  'whatsapp_click','phone_call','email_click','website_click',
  'file_download','form_submit','booking_click','qr_scan','custom_url_click'
);

CREATE TABLE public.conversion_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  bio_page_id uuid REFERENCES public.bio_pages(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  goal_type public.conversion_goal_type NOT NULL,
  match_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled boolean NOT NULL DEFAULT true,
  target_value integer,
  priority integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX conversion_goals_workspace_idx ON public.conversion_goals(workspace_id, enabled);
CREATE INDEX conversion_goals_page_idx ON public.conversion_goals(bio_page_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversion_goals TO authenticated;
GRANT ALL ON public.conversion_goals TO service_role;

ALTER TABLE public.conversion_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view workspace goals"
  ON public.conversion_goals FOR SELECT
  TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members insert workspace goals"
  ON public.conversion_goals FOR INSERT
  TO authenticated
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members update workspace goals"
  ON public.conversion_goals FOR UPDATE
  TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members delete workspace goals"
  ON public.conversion_goals FOR DELETE
  TO authenticated
  USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER update_conversion_goals_updated_at
  BEFORE UPDATE ON public.conversion_goals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
