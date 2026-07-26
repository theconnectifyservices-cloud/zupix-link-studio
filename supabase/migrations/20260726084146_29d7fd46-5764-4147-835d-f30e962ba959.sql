
-- 1. Extend payment_gateway enum used by billing_* tables to cover every provider.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE typname='payment_gateway' AND enumlabel='payu') THEN
    ALTER TYPE payment_gateway ADD VALUE 'payu';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE typname='payment_gateway' AND enumlabel='cashfree') THEN
    ALTER TYPE payment_gateway ADD VALUE 'cashfree';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid=e.enumtypid WHERE typname='payment_gateway' AND enumlabel='manual_upi') THEN
    ALTER TYPE payment_gateway ADD VALUE 'manual_upi';
  END IF;
END$$;

-- 2. Idempotency guard for webhook replay.
CREATE UNIQUE INDEX IF NOT EXISTS billing_payments_gateway_paymentid_uidx
  ON public.billing_payments (gateway, gateway_payment_id)
  WHERE gateway_payment_id IS NOT NULL;

-- 3. Platform-admin write policies (super_admin / admin) for billing surfaces.
DROP POLICY IF EXISTS "billing_events admin all" ON public.billing_events;
CREATE POLICY "billing_events admin all" ON public.billing_events
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "invoices admin all" ON public.billing_invoices;
CREATE POLICY "invoices admin all" ON public.billing_invoices
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "payments admin all" ON public.billing_payments;
CREATE POLICY "payments admin all" ON public.billing_payments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "subs admin all" ON public.billing_subscriptions;
CREATE POLICY "subs admin all" ON public.billing_subscriptions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));
