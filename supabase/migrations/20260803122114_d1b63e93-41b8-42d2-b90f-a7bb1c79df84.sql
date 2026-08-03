CREATE TYPE public.bio_lead_status AS ENUM ('new','read','replied','archived');
CREATE TYPE public.bio_booking_status AS ENUM ('pending','approved','rejected','rescheduled','completed','cancelled');

CREATE TABLE public.bio_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  bio_page_id uuid REFERENCES public.bio_pages(id) ON DELETE SET NULL,
  block_id text,
  form_name text NOT NULL DEFAULT 'Contact Form',
  name text,
  email text,
  phone text,
  company text,
  subject text,
  message text,
  fields jsonb NOT NULL DEFAULT '{}'::jsonb,
  status public.bio_lead_status NOT NULL DEFAULT 'new',
  source_url text,
  referrer text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bio_leads_workspace_created_idx ON public.bio_leads (workspace_id, created_at DESC);
CREATE INDEX bio_leads_page_idx ON public.bio_leads (bio_page_id);

GRANT SELECT, UPDATE, DELETE ON public.bio_leads TO authenticated;
GRANT ALL ON public.bio_leads TO service_role;
ALTER TABLE public.bio_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view leads" ON public.bio_leads
  FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update leads" ON public.bio_leads
  FOR UPDATE TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace admins can delete leads" ON public.bio_leads
  FOR DELETE TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TABLE public.bio_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  bio_page_id uuid REFERENCES public.bio_pages(id) ON DELETE SET NULL,
  block_id text,
  service_title text NOT NULL DEFAULT 'Appointment',
  booking_kind text NOT NULL DEFAULT 'appointment',
  customer_name text NOT NULL,
  email text,
  phone text,
  notes text,
  booking_date date NOT NULL,
  booking_time text NOT NULL,
  duration_min integer NOT NULL DEFAULT 30,
  timezone text,
  location_type text NOT NULL DEFAULT 'online',
  meeting_link text,
  location_address text,
  status public.bio_booking_status NOT NULL DEFAULT 'pending',
  admin_note text,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX bio_bookings_workspace_created_idx ON public.bio_bookings (workspace_id, created_at DESC);
CREATE INDEX bio_bookings_page_idx ON public.bio_bookings (bio_page_id);

GRANT SELECT, UPDATE, DELETE ON public.bio_bookings TO authenticated;
GRANT ALL ON public.bio_bookings TO service_role;
ALTER TABLE public.bio_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can view bookings" ON public.bio_bookings
  FOR SELECT TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can update bookings" ON public.bio_bookings
  FOR UPDATE TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id))
  WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Workspace members can delete bookings" ON public.bio_bookings
  FOR DELETE TO authenticated USING (public.is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER update_bio_bookings_updated_at BEFORE UPDATE ON public.bio_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();