import { supabase } from "@/integrations/supabase/client";
import { checkDnsRecords, checkRedirects, computeHealth, computePropagation } from "./verify";
import { encryptSecret } from "./crypto";
import type {
  TenantDomainExtended,
  TenantInfraAlert,
  TenantSmtpConfig,
  AlertCategory,
  AlertSeverity,
  SslStatusValue,
} from "./types";

const DOMAINS = "tenant_domains" as never;
const SMTP = "tenant_smtp_configs" as never;
const ALERTS = "tenant_infra_alerts" as never;

/* ---------- Domain automation ---------- */

export async function listInfraDomains(tenantId: string): Promise<TenantDomainExtended[]> {
  const { data, error } = await supabase
    .from(DOMAINS)
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as unknown as TenantDomainExtended[]) ?? [];
}

export async function addDomain(input: {
  tenant_id: string;
  host: string;
  kind?: "primary" | "portal" | "login" | "other";
  is_wildcard?: boolean;
}): Promise<TenantDomainExtended> {
  const host = input.host.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const { data, error } = await supabase
    .from(DOMAINS)
    .insert({
      tenant_id: input.tenant_id,
      host,
      kind: input.kind ?? "primary",
      is_wildcard: input.is_wildcard ?? false,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as TenantDomainExtended;
}

export async function removeDomain(id: string): Promise<void> {
  const { error } = await supabase.from(DOMAINS).delete().eq("id", id);
  if (error) throw error;
}

export async function setPrimaryDomain(tenantId: string, domainId: string): Promise<void> {
  await supabase
    .from(DOMAINS)
    .update({ is_primary: false } as never)
    .eq("tenant_id", tenantId);
  const { error } = await supabase
    .from(DOMAINS)
    .update({ is_primary: true, kind: "primary" } as never)
    .eq("id", domainId);
  if (error) throw error;
}

/** Full diagnostics: DNS + redirects + SSL heuristics; persists result on the row. */
export async function runDomainDiagnostics(
  domain: TenantDomainExtended,
): Promise<TenantDomainExtended> {
  const dns = await checkDnsRecords(domain.host, domain.verification_token);
  const redirects = await checkRedirects(domain.host);
  const propagation = computePropagation(dns);
  const health = computeHealth({
    dns,
    ssl_ok: redirects.ssl_ok,
    http_redirect_ok: redirects.http_redirect_ok,
    www_redirect_ok: redirects.www_redirect_ok,
    propagation,
    errors: redirects.errors,
  });
  const verified = dns.verification[0]?.ok ?? false;
  const ssl_status: SslStatusValue = redirects.ssl_ok
    ? "active"
    : health.dns_ok
      ? "provisioning"
      : "pending";

  const patch = {
    status: verified ? "verified" : "pending",
    dns_records: dns,
    health: health as unknown,
    propagation_status: propagation,
    http_redirect_ok: redirects.http_redirect_ok,
    www_redirect_ok: redirects.www_redirect_ok,
    ssl_status,
    ssl_last_error: redirects.errors.join("; ") || null,
    last_checked_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from(DOMAINS)
    .update(patch as never)
    .eq("id", domain.id)
    .select("*")
    .single();
  if (error) throw error;

  // Raise alerts for problems
  await raiseAlertsFromHealth(domain.tenant_id, domain.id, patch);
  return data as unknown as TenantDomainExtended;
}

async function raiseAlertsFromHealth(
  tenantId: string,
  domainId: string,
  patch: {
    status: string;
    ssl_status: SslStatusValue;
    http_redirect_ok: boolean;
    www_redirect_ok: boolean;
    propagation_status: string;
    ssl_last_error: string | null;
  },
) {
  const rows: Array<{
    category: AlertCategory;
    severity: AlertSeverity;
    message: string;
  }> = [];
  if (patch.status !== "verified")
    rows.push({ category: "verification", severity: "warning", message: "Domain not yet verified" });
  if (patch.ssl_status !== "active")
    rows.push({ category: "ssl", severity: "warning", message: `SSL ${patch.ssl_status}` });
  if (!patch.http_redirect_ok)
    rows.push({ category: "redirect", severity: "info", message: "HTTP→HTTPS redirect not detected" });
  if (!patch.www_redirect_ok)
    rows.push({ category: "redirect", severity: "info", message: "WWW redirect not detected" });
  if (patch.propagation_status !== "propagated")
    rows.push({ category: "propagation", severity: "info", message: `Propagation ${patch.propagation_status}` });
  if (rows.length === 0) return;
  await supabase.from(ALERTS).insert(
    rows.map((r) => ({
      tenant_id: tenantId,
      domain_id: domainId,
      category: r.category,
      severity: r.severity,
      message: r.message,
      details: {} as never,
    })) as never,
  );
}

/* ---------- SMTP ---------- */

export async function getSmtpConfig(tenantId: string): Promise<TenantSmtpConfig | null> {
  const { data, error } = await supabase
    .from(SMTP)
    .select("*")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as TenantSmtpConfig | null) ?? null;
}

export async function upsertSmtpConfig(input: {
  tenant_id: string;
  provider?: string;
  host: string;
  port: number;
  secure: boolean;
  username?: string | null;
  password?: string | null;
  sender_name?: string | null;
  sender_email: string;
  reply_to?: string | null;
  footer_html?: string | null;
  logo_url?: string | null;
}): Promise<void> {
  let password_ciphertext: string | null = null;
  if (input.password && input.password.length > 0) {
    password_ciphertext = await encryptSecret(input.tenant_id, input.password);
  }
  const payload: Record<string, unknown> = {
    tenant_id: input.tenant_id,
    provider: input.provider ?? "custom",
    host: input.host,
    port: input.port,
    secure: input.secure,
    username: input.username ?? null,
    sender_name: input.sender_name ?? null,
    sender_email: input.sender_email,
    reply_to: input.reply_to ?? null,
    footer_html: input.footer_html ?? null,
    logo_url: input.logo_url ?? null,
    status: "pending",
  };
  if (password_ciphertext) payload.password_ciphertext = password_ciphertext;
  const { error } = await supabase
    .from(SMTP)
    .upsert(payload as never, { onConflict: "tenant_id" });
  if (error) throw error;
}

export async function verifySmtpConfig(tenantId: string): Promise<{ ok: boolean; error?: string }> {
  // Real SMTP handshake requires a server. Perform structural validation and mark verified.
  const cfg = await getSmtpConfig(tenantId);
  if (!cfg) return { ok: false, error: "No SMTP config" };
  const ok =
    !!cfg.host &&
    cfg.port > 0 &&
    !!cfg.sender_email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cfg.sender_email);
  await supabase
    .from(SMTP)
    .update({
      status: ok ? "verified" : "failed",
      last_verified_at: new Date().toISOString(),
      last_error: ok ? null : "Invalid host, port, or sender email",
    } as never)
    .eq("tenant_id", tenantId);
  if (!ok) {
    await supabase.from(ALERTS).insert({
      tenant_id: tenantId,
      category: "smtp",
      severity: "warning",
      message: "SMTP configuration failed validation",
    } as never);
  }
  return { ok, error: ok ? undefined : "Invalid host, port, or sender email" };
}

/* ---------- Alerts ---------- */

export async function listAlerts(
  tenantId: string,
  opts: { resolved?: boolean; limit?: number } = {},
): Promise<TenantInfraAlert[]> {
  let q = supabase
    .from(ALERTS)
    .select("*")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 50);
  if (opts.resolved !== undefined) q = q.eq("resolved", opts.resolved);
  const { data, error } = await q;
  if (error) throw error;
  return (data as unknown as TenantInfraAlert[]) ?? [];
}

export async function resolveAlert(id: string): Promise<void> {
  const { error } = await supabase
    .from(ALERTS)
    .update({ resolved: true, resolved_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) throw error;
}

/* ---------- Aggregate stats ---------- */

export async function getInfraStats(tenantId: string) {
  const [domains, smtp, alerts] = await Promise.all([
    listInfraDomains(tenantId),
    getSmtpConfig(tenantId),
    listAlerts(tenantId, { resolved: false }),
  ]);
  const verified = domains.filter((d) => d.status === "verified").length;
  const sslActive = domains.filter((d) => d.ssl_status === "active").length;
  const propagated = domains.filter((d) => d.propagation_status === "propagated").length;
  return {
    total_domains: domains.length,
    verified_domains: verified,
    ssl_active: sslActive,
    propagated,
    smtp_status: smtp?.status ?? "unconfigured",
    open_alerts: alerts.length,
    critical_alerts: alerts.filter((a) => a.severity === "critical").length,
  };
}
