REVOKE ALL ON FUNCTION public.validate_workspace_subdomain() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_domain_host() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_username() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_bio_page_slug() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;