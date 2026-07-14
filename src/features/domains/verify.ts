import { ZUPIX_A_RECORD } from "./types";

/**
 * DNS-over-HTTPS lookup via Cloudflare's public resolver.
 * No secrets, browser-safe. Types: A=1, TXT=16, CNAME=5, AAAA=28.
 */
async function doh(name: string, type: "A" | "TXT" | "CNAME" | "AAAA") {
  const url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`;
  const res = await fetch(url, { headers: { accept: "application/dns-json" } });
  if (!res.ok) throw new Error(`DNS lookup failed (${res.status})`);
  const data = (await res.json()) as { Answer?: { data: string; type: number }[] };
  return data.Answer ?? [];
}

export interface VerifyResult {
  aRecordOk: boolean;
  txtRecordOk: boolean;
  aRecords: string[];
  txtRecords: string[];
  verified: boolean;
}

/** Verify a domain against expected A record and TXT verification token. */
export async function verifyDomain(host: string, token: string): Promise<VerifyResult> {
  const [aAnswers, txtAnswers] = await Promise.all([
    doh(host, "A").catch(() => []),
    doh(`_zupix.${host}`, "TXT").catch(() => []),
  ]);
  const aRecords = aAnswers.map((a) => a.data);
  const txtRecords = txtAnswers.map((a) => a.data.replace(/^"|"$/g, ""));
  const aRecordOk = aRecords.includes(ZUPIX_A_RECORD);
  const expectedTxt = `zupix-verify=${token}`;
  const txtRecordOk = txtRecords.some((v) => v.includes(expectedTxt));
  return {
    aRecordOk,
    txtRecordOk,
    aRecords,
    txtRecords,
    verified: aRecordOk && txtRecordOk,
  };
}
