export type SslStatusValue =
  | "pending"
  | "provisioning"
  | "active"
  | "failed"
  | "expiring"
  | "expired";

export type PropagationStatus = "pending" | "propagating" | "propagated" | "failed";

export type DnsRecordType = "A" | "AAAA" | "CNAME" | "TXT" | "MX";

export interface DnsRecordCheck {
  type: DnsRecordType;
  name: string;
  expected?: string;
  actual: string[];
  ok: boolean;
}

export interface DomainHealth {
  dns_ok: boolean;
  ssl_ok: boolean;
  http_redirect_ok: boolean;
  www_redirect_ok: boolean;
  propagation: PropagationStatus;
  score: number; // 0-100
  last_checked_at: string;
  errors: string[];
}

export interface TenantDomainExtended {
  id: string;
  tenant_id: string;
  host: string;
  kind: "primary" | "portal" | "login" | "other";
  status: "pending" | "verified" | "failed";
  verification_token: string;
  is_primary: boolean;
  custom_login_url: string | null;
  is_wildcard: boolean;
  ssl_status: SslStatusValue;
  ssl_expires_at: string | null;
  ssl_issuer: string | null;
  ssl_last_error: string | null;
  http_redirect_ok: boolean;
  www_redirect_ok: boolean;
  propagation_status: PropagationStatus;
  dns_records: Record<string, DnsRecordCheck[]>;
  health: Partial<DomainHealth>;
  notes: string | null;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SmtpStatus = "pending" | "verified" | "failed";

export interface TenantSmtpConfig {
  id: string;
  tenant_id: string;
  provider: string;
  host: string;
  port: number;
  secure: boolean;
  username: string | null;
  password_ciphertext: string | null;
  sender_name: string | null;
  sender_email: string;
  reply_to: string | null;
  footer_html: string | null;
  logo_url: string | null;
  status: SmtpStatus;
  last_verified_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertCategory =
  | "dns"
  | "ssl"
  | "redirect"
  | "smtp"
  | "verification"
  | "propagation";

export interface TenantInfraAlert {
  id: string;
  tenant_id: string;
  domain_id: string | null;
  category: AlertCategory;
  severity: AlertSeverity;
  message: string;
  details: Record<string, unknown>;
  resolved: boolean;
  resolved_at: string | null;
  created_at: string;
}

export const ZUPIX_A_TARGET = "185.158.133.1";
export const ZUPIX_CNAME_TARGET = "edge.zupix.app";
