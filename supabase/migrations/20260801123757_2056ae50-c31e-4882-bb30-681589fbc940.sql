ALTER TABLE public.workspaces ADD COLUMN IF NOT EXISTS branding_mode text;
ALTER TABLE public.workspaces ADD CONSTRAINT workspaces_branding_mode_check CHECK (branding_mode IS NULL OR branding_mode IN ('hidden','compact','full'));

ALTER TABLE public.growth_engine_settings ADD COLUMN IF NOT EXISTS plan_branding_defaults jsonb NOT NULL DEFAULT '{"tejas":"hidden","garuda":"hidden","vajra":"hidden","lifetime":"hidden","shikhar":"hidden"}'::jsonb;

CREATE OR REPLACE FUNCTION public.public_workspace_branding(_workspace_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _plan text;
  _mode text;
  _defaults jsonb;
BEGIN
  _plan := coalesce(public.public_workspace_plan(_workspace_id), 'udaan');
  SELECT branding_mode INTO _mode FROM public.workspaces WHERE id = _workspace_id;
  SELECT plan_branding_defaults INTO _defaults FROM public.growth_engine_settings WHERE id = 'default';

  IF _plan IN ('udaan','free','starter','trial') THEN
    RETURN jsonb_build_object('plan', _plan, 'mode', 'full', 'locked', true);
  END IF;

  IF _mode IS NULL THEN
    _mode := coalesce(_defaults ->> _plan, 'hidden');
  END IF;

  RETURN jsonb_build_object('plan', _plan, 'mode', _mode, 'locked', false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.public_workspace_branding(uuid) TO anon, authenticated, service_role;