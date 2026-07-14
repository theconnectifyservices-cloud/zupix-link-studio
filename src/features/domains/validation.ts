import { RESERVED_HOSTS, RESERVED_SUBDOMAINS } from "./constants";

const HOST_RE = /^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;
const SUBDOMAIN_RE = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;

export function normalizeHost(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "")
    .split("/")[0];
}

export function validateHost(input: string): { ok: true; host: string } | { ok: false; error: string } {
  const host = normalizeHost(input);
  if (!host) return { ok: false, error: "Enter a domain" };
  if (host.length > 253) return { ok: false, error: "Domain is too long" };
  if (!HOST_RE.test(host)) return { ok: false, error: "That doesn't look like a valid domain" };
  if (RESERVED_HOSTS.has(host)) return { ok: false, error: "This domain is reserved" };
  if (host.endsWith(".zupix.site") || host.endsWith(".zupix.app")) {
    return { ok: false, error: "Use the Free Subdomain section for ZUPIX domains" };
  }
  return { ok: true, host };
}

export function validateSubdomain(input: string): { ok: true; sub: string } | { ok: false; error: string } {
  const sub = input.trim().toLowerCase();
  if (!sub) return { ok: false, error: "Enter a subdomain" };
  if (!SUBDOMAIN_RE.test(sub)) {
    return { ok: false, error: "3–30 chars: lowercase letters, numbers, hyphens (no leading/trailing hyphen)" };
  }
  if (RESERVED_SUBDOMAINS.has(sub)) return { ok: false, error: "This subdomain is reserved" };
  return { ok: true, sub };
}
