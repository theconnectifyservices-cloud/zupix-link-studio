-- Extra Bio Link add-on quantity for a workspace
CREATE OR REPLACE FUNCTION public.workspace_bio_link_addons(_workspace_id uuid)
RETURNS integer
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(wa.quantity * GREATEST(a.quantity_per_unit, 1)), 0)::int
  FROM public.workspace_addons wa
  JOIN public.addons a ON a.id = wa.addon_id
  WHERE wa.workspace_id = _workspace_id
    AND wa.status = 'active'
    AND a.metric_key = 'bio_pages'
    AND (wa.ends_at IS NULL OR wa.ends_at > now());
$$;

-- Effective Bio Link limit: plan limit + purchased add-ons. -1 = unlimited.
CREATE OR REPLACE FUNCTION public.workspace_bio_link_limit(_workspace_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit bigint;
  v_unlimited boolean;
BEGIN
  SELECT pl.limit_value, pl.is_unlimited
    INTO v_limit, v_unlimited
    FROM public.billing_subscriptions bs
    JOIN public.plan_limits pl ON pl.plan_id = bs.plan_id
   WHERE bs.workspace_id = _workspace_id
     AND bs.status IN ('active','trialing','past_due')
     AND pl.metric_key = 'bio_pages'
   ORDER BY bs.created_at DESC
   LIMIT 1;

  IF COALESCE(v_unlimited, false) THEN
    RETURN -1;
  END IF;

  RETURN COALESCE(v_limit, 1)::int + public.workspace_bio_link_addons(_workspace_id);
END;
$$;

-- Enforce the effective limit on Bio Link creation
CREATE OR REPLACE FUNCTION public.enforce_bio_link_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit int;
  v_used int;
BEGIN
  v_limit := public.workspace_bio_link_limit(NEW.workspace_id);
  IF v_limit < 0 THEN
    RETURN NEW;
  END IF;
  SELECT count(*) INTO v_used
    FROM public.bio_pages
   WHERE workspace_id = NEW.workspace_id
     AND deleted_at IS NULL;
  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'BIO_LINK_LIMIT_REACHED: this workspace allows % Bio Links. Purchase additional Bio Links to continue.', v_limit
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_bio_link_limit_trg ON public.bio_pages;
CREATE TRIGGER enforce_bio_link_limit_trg
BEFORE INSERT ON public.bio_pages
FOR EACH ROW EXECUTE FUNCTION public.enforce_bio_link_limit();

-- Platform admins manage add-ons for any workspace
DROP POLICY IF EXISTS "workspace_addons platform admin" ON public.workspace_addons;
CREATE POLICY "workspace_addons platform admin"
ON public.workspace_addons
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspace_addons TO authenticated;
GRANT ALL ON public.workspace_addons TO service_role;
GRANT SELECT ON public.addons TO authenticated;
GRANT ALL ON public.addons TO service_role;