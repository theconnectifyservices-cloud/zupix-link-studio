export type DomainStatus = "pending" | "verified" | "failed";
export type SslStatus = "none" | "provisioning" | "active" | "expired" | "error";
export type DomainKind = "subdomain" | "custom";
export type VerificationMethod = "txt" | "a_record";
export type RedirectType = "none" | "301" | "302";

export interface DomainRow {
  id: string;
  workspace_id: string;
  host: string;
  kind: DomainKind;
  status: DomainStatus;
  ssl_status: SslStatus;
  verification_token: string;
  verification_method: VerificationMethod;
  is_primary: boolean;
  target_page_id: string | null;
  redirect_type: RedirectType;
  redirect_to: string | null;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceBranding {
  brand_name: string | null;
  favicon_url: string | null;
  social_image_url: string | null;
  logo_url: string | null;
  subdomain: string | null;
}

/** Target A record IP shown in DNS wizard (documentation only). */
export const ZUPIX_A_RECORD = "185.158.133.1";
/** CNAME target when the user prefers CNAME setup. */
export const ZUPIX_CNAME_TARGET = "edge.zupix.app";
/** Public subdomain suffix. */
export const ZUPIX_SUBDOMAIN_SUFFIX = "zupix.site";
