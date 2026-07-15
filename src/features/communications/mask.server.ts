// Server-side masking + merge helpers for communication provider settings.
// Keeps raw secrets on the server; client only ever sees the SECRET_SENTINEL.

import {
  SECRET_SENTINEL,
  type CommunicationSettings,
  type Providers,
  type EmailProviders,
} from "./types";

const SECRET_FIELDS: Record<string, string[]> = {
  whatsapp: ["accessToken"],
  telegram: ["botToken"],
  slack: ["webhookUrl"],
  discord: ["webhookUrl"],
  "email.smtp": ["password"],
  "email.brevo": ["apiKey"],
  "email.mailchimp": ["apiKey"],
  "email.convertkit": ["apiSecret"],
  "email.resend": ["apiKey"],
  "email.ses": ["accessKeyId", "secretAccessKey"],
};

function maskObject<T extends Record<string, unknown> | undefined>(
  obj: T,
  path: string,
): T {
  if (!obj) return obj;
  const fields = SECRET_FIELDS[path] ?? [];
  const out: Record<string, unknown> = { ...obj };
  for (const f of fields) {
    if (typeof out[f] === "string" && (out[f] as string).length > 0) {
      out[f] = SECRET_SENTINEL;
    } else {
      out[f] = "";
    }
  }
  return out as T;
}

export function maskSettings(settings: CommunicationSettings): CommunicationSettings {
  const p: Providers = { ...settings.providers };
  if (p.whatsapp) p.whatsapp = maskObject(p.whatsapp, "whatsapp");
  if (p.telegram) p.telegram = maskObject(p.telegram, "telegram");
  if (p.slack) p.slack = maskObject(p.slack, "slack");
  if (p.discord) p.discord = maskObject(p.discord, "discord");
  if (p.email) {
    const email: EmailProviders = { ...p.email };
    email.smtp = maskObject(email.smtp, "email.smtp");
    email.brevo = maskObject(email.brevo, "email.brevo");
    email.mailchimp = maskObject(email.mailchimp, "email.mailchimp");
    email.convertkit = maskObject(email.convertkit, "email.convertkit");
    email.resend = maskObject(email.resend, "email.resend");
    email.ses = maskObject(email.ses, "email.ses");
    p.email = email;
  }
  return {
    providers: p,
    notifications: settings.notifications,
    health: settings.health,
  };
}

/**
 * Merge an incoming (client) provider patch with the currently stored value,
 * preserving any secret field whose incoming value is the SECRET_SENTINEL.
 */
export function mergeProviderPatch(
  path: string,
  stored: Record<string, unknown> | undefined,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const secretFields = SECRET_FIELDS[path] ?? [];
  const merged: Record<string, unknown> = { ...(stored ?? {}), ...patch };
  for (const f of secretFields) {
    if (merged[f] === SECRET_SENTINEL) {
      merged[f] = (stored?.[f] as string | undefined) ?? "";
    }
  }
  return merged;
}
