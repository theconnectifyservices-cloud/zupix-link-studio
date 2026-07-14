
-- Extend status/visibility enums
ALTER TYPE public.bio_page_status ADD VALUE IF NOT EXISTS 'scheduled';
ALTER TYPE public.bio_page_status ADD VALUE IF NOT EXISTS 'unpublished';
ALTER TYPE public.bio_page_visibility ADD VALUE IF NOT EXISTS 'password';
