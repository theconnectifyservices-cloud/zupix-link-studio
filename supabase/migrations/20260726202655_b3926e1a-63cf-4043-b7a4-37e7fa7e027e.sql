DO $$
DECLARE
  tbl record;
  has_priv boolean;
BEGIN
  FOR tbl IN
    SELECT c.relname AS table_name
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'r' AND n.nspname = 'public'
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
       WHERE grantee='authenticated' AND table_schema='public' AND table_name=tbl.table_name
         AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')
    ) INTO has_priv;
    IF NOT has_priv THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.table_name);
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.role_table_grants
       WHERE grantee='service_role' AND table_schema='public' AND table_name=tbl.table_name
         AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')
    ) INTO has_priv;
    IF NOT has_priv THEN
      EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.table_name);
    END IF;
  END LOOP;
END $$;

-- Anon read for tables with existing public/anon-visible SELECT policies
GRANT SELECT ON public.bio_pages TO anon;
GRANT SELECT ON public.bio_page_versions TO anon;
GRANT SELECT ON public.workspaces TO anon;
GRANT SELECT ON public.domains TO anon;
GRANT SELECT ON public.qr_designs TO anon;
GRANT SELECT ON public.billing_plans TO anon;
GRANT SELECT ON public.plan_features TO anon;
GRANT SELECT ON public.plan_limits TO anon;
GRANT SELECT ON public.feature_flags TO anon;
GRANT SELECT ON public.marketplace_assets TO anon;
GRANT SELECT ON public.marketplace_categories TO anon;
GRANT SELECT ON public.marketplace_reviews TO anon;

-- Sequences and functions used by the app
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;