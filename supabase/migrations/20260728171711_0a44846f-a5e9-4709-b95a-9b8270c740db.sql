CREATE TABLE IF NOT EXISTS public.subscription_change_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.billing_subscriptions(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  from_plan_code text,
  to_plan_code text,
  from_status text,
  to_status text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscription_change_logs_workspace_idx
  ON public.subscription_change_logs (workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subscription_change_logs_subscription_idx
  ON public.subscription_change_logs (subscription_id, created_at DESC);

GRANT SELECT, INSERT ON public.subscription_change_logs TO authenticated;
GRANT ALL ON public.subscription_change_logs TO service_role;

ALTER TABLE public.subscription_change_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view all subscription change logs"
  ON public.subscription_change_logs
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
    OR public.is_workspace_member(auth.uid(), workspace_id)
  );

CREATE POLICY "Admins insert subscription change logs"
  ON public.subscription_change_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'super_admin')
  );