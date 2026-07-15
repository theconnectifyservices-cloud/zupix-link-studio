/**
 * Tenant-scoped symmetric encryption for SMTP credentials at rest.
 * Uses WebCrypto AES-GCM with a key derived (PBKDF2) from the tenant id +
 * a static app secret. Ciphertext format: base64(iv | ciphertext).
 *
 * This keeps credentials unreadable in the database while remaining
 * client-decryptable for tenant admins. For production hardening move to
 * a server-side envelope with an app-managed KMS.
 */
const ENC = new TextEncoder();
const DEC = new TextDecoder();
const APP_SALT = "zupix-infra-smtp-v1";

async function deriveKey(tenantId: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey(
    "raw",
    ENC.encode(`${APP_SALT}:${tenantId}`),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: ENC.encode(APP_SALT), iterations: 100_000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

function toB64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}

function fromB64(str: string): Uint8Array {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptSecret(tenantId: string, plaintext: string): Promise<string> {
  const key = await deriveKey(tenantId);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, ENC.encode(plaintext));
  const packed = new Uint8Array(iv.byteLength + ct.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ct), iv.byteLength);
  return toB64(packed.buffer);
}

export async function decryptSecret(tenantId: string, blob: string): Promise<string> {
  try {
    const packed = fromB64(blob);
    const iv = packed.slice(0, 12);
    const ct = packed.slice(12);
    const key = await deriveKey(tenantId);
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return DEC.decode(pt);
  } catch {
    return "";
  }
}
