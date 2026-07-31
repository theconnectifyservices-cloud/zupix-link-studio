-- ============ ENUMS ============
DO $$ BEGIN
  CREATE TYPE public.product_license_plan AS ENUM ('trial_3day','monthly','yearly','lifetime','reseller','enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.product_license_status AS ENUM ('unused','active','suspended','revoked','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ LICENSES ============
CREATE TABLE IF NOT EXISTS public.product_licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key text NOT NULL UNIQUE,
  customer_name text,
  email text,
  phone text,
  plan public.product_license_plan NOT NULL DEFAULT 'monthly',
  status public.product_license_status NOT NULL DEFAULT 'unused',
  expires_at timestamptz,
  activated_at timestamptz,
  last_login_at timestamptz,
  max_devices integer NOT NULL DEFAULT 1, -- -1 = unlimited
  notes text,
  user_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_licenses_user_idx ON public.product_licenses(user_id);
CREATE INDEX IF NOT EXISTS product_licenses_email_idx ON public.product_licenses(lower(email));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_licenses TO authenticated;
GRANT ALL ON public.product_licenses TO service_role;
ALTER TABLE public.product_licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage licenses" ON public.product_licenses
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Users view own license" ON public.product_licenses
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE TRIGGER product_licenses_updated_at
  BEFORE UPDATE ON public.product_licenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ ACTIVATIONS ============
CREATE TABLE IF NOT EXISTS public.license_activations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id uuid NOT NULL REFERENCES public.product_licenses(id) ON DELETE CASCADE,
  user_id uuid,
  device_id text NOT NULL,
  device_label text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS license_activations_unique_device
  ON public.license_activations(license_id, device_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.license_activations TO authenticated;
GRANT ALL ON public.license_activations TO service_role;
ALTER TABLE public.license_activations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage activations" ON public.license_activations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

CREATE POLICY "Users view own activations" ON public.license_activations
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- ============ LOGIN ATTEMPTS (rate limiting) ============
CREATE TABLE IF NOT EXISTS public.auth_login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_login_attempts_idx ON public.auth_login_attempts(identifier, created_at DESC);

GRANT SELECT ON public.auth_login_attempts TO authenticated;
GRANT ALL ON public.auth_login_attempts TO service_role;
ALTER TABLE public.auth_login_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read login attempts" ON public.auth_login_attempts
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'super_admin'));

-- ============ PROFILE ADDITIONS ============
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS license_id uuid,
  ADD COLUMN IF NOT EXISTS force_password_change boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS temp_password_expires_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_unique_email
  ON public.profiles (lower(email)) WHERE email IS NOT NULL AND deleted_at IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_unique_phone
  ON public.profiles (phone) WHERE phone IS NOT NULL AND deleted_at IS NULL;

-- ============ FUNCTIONS ============
CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS text LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  seg text; out_key text; i int; j int;
BEGIN
  LOOP
    out_key := 'ZPX';
    FOR i IN 1..3 LOOP
      seg := '';
      FOR j IN 1..4 LOOP
        seg := seg || substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1);
      END LOOP;
      out_key := out_key || '-' || seg;
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.product_licenses WHERE license_key = out_key);
  END LOOP;
  RETURN out_key;
END; $$;

CREATE OR REPLACE FUNCTION public.check_signup_availability(_email text, _phone text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT jsonb_build_object(
    'email_taken', EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.deleted_at IS NULL AND lower(p.email) = lower(coalesce(_email,''))
      UNION SELECT 1 FROM auth.users u WHERE lower(u.email) = lower(coalesce(_email,''))
    ),
    'phone_taken', EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.deleted_at IS NULL AND p.phone IS NOT NULL AND p.phone = NULLIF(_phone,'')
      UNION SELECT 1 FROM auth.users u WHERE u.phone IS NOT NULL AND u.phone = NULLIF(regexp_replace(coalesce(_phone,''), '^\+', ''), '')
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.validate_license_key(_key text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE l public.product_licenses; used int;
BEGIN
  SELECT * INTO l FROM public.product_licenses WHERE upper(license_key) = upper(trim(coalesce(_key,''))) LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'invalid');
  END IF;
  IF l.status IN ('revoked','suspended','expired') THEN
    RETURN jsonb_build_object('valid', false, 'reason', l.status::text);
  END IF;
  IF l.expires_at IS NOT NULL AND l.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'expired');
  END IF;
  SELECT count(*) INTO used FROM public.license_activations
    WHERE license_id = l.id AND revoked_at IS NULL;
  IF l.max_devices >= 0 AND used >= l.max_devices THEN
    RETURN jsonb_build_object('valid', false, 'reason', 'device_limit', 'max_devices', l.max_devices);
  END IF;
  RETURN jsonb_build_object(
    'valid', true, 'reason', 'ok', 'plan', l.plan::text,
    'expires_at', l.expires_at, 'max_devices', l.max_devices, 'used_devices', used
  );
END; $$;

CREATE OR REPLACE FUNCTION public.redeem_license(_key text, _device_id text, _device_label text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  l public.product_licenses;
  used int;
  v jsonb;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok', false, 'reason', 'unauthenticated'); END IF;

  SELECT * INTO l FROM public.product_licenses
   WHERE upper(license_key) = upper(trim(coalesce(_key,''))) FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok', false, 'reason', 'invalid'); END IF;

  IF l.user_id IS NOT NULL AND l.user_id <> uid THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_used');
  END IF;

  v := public.validate_license_key(_key);
  IF NOT (v->>'valid')::boolean AND NOT EXISTS (
      SELECT 1 FROM public.license_activations
       WHERE license_id = l.id AND device_id = coalesce(_device_id,'') AND revoked_at IS NULL
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', v->>'reason', 'max_devices', l.max_devices);
  END IF;

  INSERT INTO public.license_activations (license_id, user_id, device_id, device_label)
  VALUES (l.id, uid, coalesce(NULLIF(_device_id,''), gen_random_uuid()::text), _device_label)
  ON CONFLICT (license_id, device_id)
  DO UPDATE SET last_seen_at = now(), revoked_at = NULL, user_id = uid;

  SELECT count(*) INTO used FROM public.license_activations
   WHERE license_id = l.id AND revoked_at IS NULL;

  UPDATE public.product_licenses
     SET user_id = uid,
         status = 'active',
         activated_at = COALESCE(activated_at, now()),
         last_login_at = now()
   WHERE id = l.id;

  UPDATE public.profiles SET license_id = l.id WHERE id = uid;

  RETURN jsonb_build_object('ok', true, 'license_id', l.id, 'plan', l.plan::text,
                            'expires_at', l.expires_at, 'used_devices', used);
END; $$;

CREATE OR REPLACE FUNCTION public.touch_license_login(_device_id text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  UPDATE public.product_licenses SET last_login_at = now() WHERE user_id = uid;
  IF _device_id IS NOT NULL THEN
    UPDATE public.license_activations SET last_seen_at = now()
     WHERE user_id = uid AND device_id = _device_id;
  END IF;
  UPDATE public.product_licenses
     SET status = 'expired'
   WHERE user_id = uid AND status = 'active'
     AND expires_at IS NOT NULL AND expires_at < now();
END; $$;

REVOKE ALL ON FUNCTION public.check_signup_availability(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.check_signup_availability(text, text) TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.validate_license_key(text) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_license_key(text) TO anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.redeem_license(text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.redeem_license(text, text, text) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.touch_license_login(text) FROM public;
GRANT EXECUTE ON FUNCTION public.touch_license_login(text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.generate_license_key() TO authenticated, service_role;