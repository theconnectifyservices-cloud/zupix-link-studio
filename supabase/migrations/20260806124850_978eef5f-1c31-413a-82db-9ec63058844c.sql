
-- Customers Table
CREATE TABLE public.bio_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    whatsapp TEXT,
    first_interaction TIMESTAMPTZ DEFAULT now() NOT NULL,
    latest_activity TIMESTAMPTZ DEFAULT now() NOT NULL,
    total_orders INTEGER DEFAULT 0 NOT NULL,
    total_payments INTEGER DEFAULT 0 NOT NULL,
    total_bookings INTEGER DEFAULT 0 NOT NULL,
    source TEXT NOT NULL,
    status TEXT DEFAULT 'active' NOT NULL,
    tags TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Customer Timeline Table
CREATE TABLE public.bio_customer_timeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES public.bio_customers(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}'::JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bio_customers TO authenticated;
GRANT ALL ON public.bio_customers TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.bio_customer_timeline TO authenticated;
GRANT ALL ON public.bio_customer_timeline TO service_role;

-- RLS
ALTER TABLE public.bio_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bio_customer_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own workspace customers"
ON public.bio_customers
FOR ALL
TO authenticated
USING (workspace_id IN (
    SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
));

CREATE POLICY "Users can manage timeline for their workspace customers"
ON public.bio_customer_timeline
FOR ALL
TO authenticated
USING (customer_id IN (
    SELECT id FROM public.bio_customers WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
));

-- Indexes
CREATE INDEX idx_bio_customers_workspace ON public.bio_customers(workspace_id);
CREATE INDEX idx_bio_customers_email ON public.bio_customers(email);
CREATE INDEX idx_bio_customers_phone ON public.bio_customers(phone);
CREATE INDEX idx_bio_customer_timeline_customer ON public.bio_customer_timeline(customer_id);
