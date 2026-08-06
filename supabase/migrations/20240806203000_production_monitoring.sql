-- Enum for system health status
CREATE TYPE public.service_status AS ENUM ('healthy', 'warning', 'offline');

-- System health table
CREATE TABLE public.system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_name TEXT NOT NULL UNIQUE,
    status public.service_status NOT NULL DEFAULT 'healthy',
    last_check_at TIMESTAMPTZ DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Error logs table
CREATE TABLE public.error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id),
    workspace_id UUID,
    page_url TEXT,
    browser TEXT,
    device TEXT,
    message TEXT NOT NULL,
    stack_trace TEXT,
    severity TEXT DEFAULT 'error',
    status TEXT DEFAULT 'open',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Backup history table
CREATE TABLE public.backup_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    size_bytes BIGINT,
    status TEXT DEFAULT 'completed',
    download_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Security events table
CREATE TABLE public.security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    event_type TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_suspicious BOOLEAN DEFAULT false
);

-- Admin notifications table
CREATE TABLE public.admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    severity TEXT DEFAULT 'info',
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON public.system_health TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.error_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.backup_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_notifications TO authenticated;

GRANT ALL ON public.system_health TO service_role;
GRANT ALL ON public.error_logs TO service_role;
GRANT ALL ON public.backup_history TO service_role;
GRANT ALL ON public.security_events TO service_role;
GRANT ALL ON public.admin_notifications TO service_role;

-- RLS
ALTER TABLE public.system_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Policies (Super Admin only - using the existing has_role function)
CREATE POLICY "Super admins can manage health" ON public.system_health FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins can manage error logs" ON public.error_logs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins can manage backups" ON public.backup_history FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins can manage security events" ON public.security_events FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Super admins can manage notifications" ON public.admin_notifications FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Seed default health services
INSERT INTO public.system_health (service_name, status) VALUES 
('System', 'healthy'),
('Database', 'healthy'),
('Storage', 'healthy'),
('Authentication', 'healthy'),
('Email', 'healthy'),
('Payment Gateway', 'healthy'),
('Domain Service', 'healthy'),
('Core API', 'healthy');
