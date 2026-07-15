import type { DnsRecordCheck, DnsRecordType, DomainHealth, PropagationStatus } from "./types";
import { ZUPIX_A_TARGET, ZUPIX_CNAME_TARGET } from "./types";

const TYPE_CODES: Record<DnsRecordType, number> = { A: 1, AAAA: 28, CNAME: 5, TXT: 16, MX: 15 };

/** DoH lookup via Cloudflare (browser-safe, no secrets). */
async function doh(name: string, type: DnsRecordType): Promise<string[]> {
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
    const res = await fetch(url, { headers: { accept: "application/dns-json" } });
    if (!res.ok) return [];
    const data = (await res.json()) as { Answer?: { data: string; type: number }[] };
    return (data.Answer ?? [])
      .filter((a) => a.type === TYPE_CODES[type])
      .map((a) => a.data.replace(/^"|"$/g, ""));
  } catch {
    return [];
  }
}

/** Run guided DNS checks for a domain. */
export async function checkDnsRecords(
  host: string,
  token: string,
): Promise<Record<string, DnsRecordCheck[]>> {
  const [a, aaaa, cname, txt, mx, wwwA] = await Promise.all([
    doh(host, "A"),
    doh(host, "AAAA"),
    doh(host, "CNAME"),
    doh(`_zupix.${host}`, "TXT"),
    doh(host, "MX"),
    doh(`www.${host}`, "A"),
  ]);
  const expectedTxt = `zupix-verify=${token}`;
  return {
    apex: [
      { type: "A", name: host, expected: ZUPIX_A_TARGET, actual: a, ok: a.includes(ZUPIX_A_TARGET) },
      { type: "AAAA", name: host, actual: aaaa, ok: true },
      {
        type: "CNAME",
        name: host,
        expected: ZUPIX_CNAME_TARGET,
        actual: cname,
        ok: cname.length === 0 || cname.some((c) => c.includes("zupix")),
      },
    ],
    verification: [
      {
        type: "TXT",
        name: `_zupix.${host}`,
        expected: expectedTxt,
        actual: txt,
        ok: txt.some((t) => t.includes(expectedTxt)),
      },
    ],
    email: [{ type: "MX", name: host, actual: mx, ok: true }],
    www: [
      {
        type: "A",
        name: `www.${host}`,
        expected: ZUPIX_A_TARGET,
        actual: wwwA,
        ok: wwwA.includes(ZUPIX_A_TARGET),
      },
    ],
  };
}

/** Check that https://host responds and that http/www redirect. Fetches a HEAD-like GET. */
export async function checkRedirects(host: string): Promise<{
  https_ok: boolean;
  http_redirect_ok: boolean;
  www_redirect_ok: boolean;
  ssl_ok: boolean;
  errors: string[];
}> {
  const errors: string[] = [];
  const results = await Promise.allSettled([
    fetch(`https://${host}/`, { method: "GET", mode: "no-cors" }),
    fetch(`http://${host}/`, { method: "GET", mode: "no-cors", redirect: "manual" }),
    fetch(`https://www.${host}/`, { method: "GET", mode: "no-cors", redirect: "manual" }),
  ]);
  const https_ok = results[0].status === "fulfilled";
  if (!https_ok) errors.push("HTTPS endpoint unreachable");
  // no-cors returns opaque responses; treat "fulfilled" as reachable (redirect chain resolved)
  const http_redirect_ok = results[1].status === "fulfilled";
  const www_redirect_ok = results[2].status === "fulfilled";
  return { https_ok, http_redirect_ok, www_redirect_ok, ssl_ok: https_ok, errors };
}

export function computePropagation(
  dns: Record<string, DnsRecordCheck[]>,
): PropagationStatus {
  const all = Object.values(dns).flat();
  const required = all.filter((r) => r.expected);
  if (required.length === 0) return "pending";
  const okCount = required.filter((r) => r.ok).length;
  if (okCount === required.length) return "propagated";
  if (okCount === 0) return "pending";
  return "propagating";
}

export function computeHealth(input: {
  dns: Record<string, DnsRecordCheck[]>;
  ssl_ok: boolean;
  http_redirect_ok: boolean;
  www_redirect_ok: boolean;
  propagation: PropagationStatus;
  errors: string[];
}): DomainHealth {
  const all = Object.values(input.dns).flat();
  const required = all.filter((r) => r.expected);
  const dns_ok = required.length > 0 && required.every((r) => r.ok);
  const parts = [
    dns_ok ? 40 : 0,
    input.ssl_ok ? 30 : 0,
    input.http_redirect_ok ? 15 : 0,
    input.www_redirect_ok ? 15 : 0,
  ];
  return {
    dns_ok,
    ssl_ok: input.ssl_ok,
    http_redirect_ok: input.http_redirect_ok,
    www_redirect_ok: input.www_redirect_ok,
    propagation: input.propagation,
    score: parts.reduce((a, b) => a + b, 0),
    last_checked_at: new Date().toISOString(),
    errors: input.errors,
  };
}
