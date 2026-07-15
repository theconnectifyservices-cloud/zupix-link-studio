export type TenantStatus = "active" | "suspended" | "archived";
export type TenantMemberRole = "owner" | "admin";
export type TenantDomainKind = "primary" | "portal" | "login" | "other";
export type TenantDomainStatus = "pending" | "verified" | "failed";

export interface Tenant {
  id: string;
  slug: string;
  company_name: string;
  owner_id: string;
  status: TenantStatus;

  logo_url: string | null;
  logo_dark_url: string | null;
  favicon_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  typography: { heading?: string; body?: string };
  loading_screen: Record<string, unknown>;
  email_signature: string | null;

  login_background_url: string | null;
  login_footer_html: string | null;
  login_headline: string | null;
  login_subheadline: string | null;
  register_enabled: boolean;
  forgot_enabled: boolean;

  email_sender_name: string | null;
  email_sender_email: string | null;
  email_reply_to: string | null;
  email_logo_url: string | null;
  email_footer_html: string | null;

  hide_powered_by: boolean;
  hide_zupix_logo: boolean;
  hide_default_branding: boolean;
  hide_developer_links: boolean;

  brand_kit: Record<string, unknown>;
  billing_settings: Record<string, unknown>;
  feature_flags: Record<string, boolean>;
  workspace_limit: number;
  ai_credit_limit: number;
  storage_limit_mb: number;

  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantDomain {
  id: string;
  tenant_id: string;
  host: string;
  kind: TenantDomainKind;
  status: TenantDomainStatus;
  verification_token: string;
  is_primary: boolean;
  custom_login_url: string | null;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: TenantMemberRole;
  created_at: string;
}
