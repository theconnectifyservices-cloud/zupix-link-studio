// Communication Center server functions. All secrets stay server-side; the
// client only sees masked values. Test/send helpers actually hit provider APIs.

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { maskSettings, mergeProviderPatch } from "./mask.server";
import {
  DEFAULT_SETTINGS,
  SECRET_SENTINEL,
  type CommunicationSettings,
  type Health,
  type HealthEntry,
  type MessageTemplate,
  type Notifications,
  type Providers,
  type EmailSubKey,
} from "./types";

// ---------- helpers ----------

async function assertWorkspaceMember(
  context: { supabase: ReturnType<typeof requireSupabaseAuth.middleware> extends unknown ? never : never; userId: string } & {
    supabase: import("@supabase/supabase-js").SupabaseClient;
    userId: string;
  },
  workspaceId: string,
) {
  const { data, error } = await context.supabase.rpc("is_workspace_member", {
    _user_id: context.userId,
    _workspace_id: workspaceId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: not a workspace member");
}

async function loadRow(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  workspaceId: string,
): Promise<CommunicationSettings> {
  const { data, error } = await supabase
    .from("workspace_communications")
    .select("providers,notifications,health")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return { ...DEFAULT_SETTINGS };
  return {
    providers: (data.providers as Providers) ?? {},
    notifications: (data.notifications as Notifications) ?? {},
    health: (data.health as Health) ?? {},
  };
}

async function upsertRow(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  workspaceId: string,
  patch: Partial<CommunicationSettings>,
) {
  const current = await loadRow(supabase, workspaceId);
  const next = {
    providers: patch.providers ?? current.providers,
    notifications: patch.notifications ?? current.notifications,
    health: patch.health ?? current.health,
  };
  const { error } = await supabase
    .from("workspace_communications")
    .upsert(
      { workspace_id: workspaceId, ...next },
      { onConflict: "workspace_id" },
    );
  if (error) throw new Error(error.message);
  return next;
}

function healthKey(provider: string, subKey?: string) {
  return subKey ? `${provider}.${subKey}` : provider;
}

// ---------- fetch ----------

export const fetchCommunicationSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) =>
    z.object({ workspaceId: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertWorkspaceMember(context, data.workspaceId);
    const row = await loadRow(context.supabase, data.workspaceId);
    return maskSettings(row);
  });

// ---------- update provider ----------

const providerKeyEnum = z.enum(["whatsapp", "telegram", "slack", "discord", "email"]);
const emailSubEnum = z.enum(["smtp", "brevo", "mailchimp", "convertkit", "resend", "ses"]);

export const updateProviderSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      workspaceId: string;
      provider: string;
      subKey?: string;
      settings: Record<string, unknown>;
    }) =>
      z
        .object({
          workspaceId: z.string().uuid(),
          provider: providerKeyEnum,
          subKey: emailSubEnum.optional(),
          settings: z.record(z.string(), z.unknown()),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertWorkspaceMember(context, data.workspaceId);
    const row = await loadRow(context.supabase, data.workspaceId);
    const providers = { ...row.providers } as Record<string, unknown>;

    if (data.provider === "email") {
      if (!data.subKey) throw new Error("subKey required for email provider");
      const email = { ...((providers.email as Record<string, unknown>) ?? {}) };
      const existing = email[data.subKey] as Record<string, unknown> | undefined;
      email[data.subKey] = mergeProviderPatch(
        `email.${data.subKey}`,
        existing,
        data.settings,
      );
      // set as active if enabled and no other active or self already active
      const isEnabled = (email[data.subKey] as { enabled?: boolean }).enabled;
      if (isEnabled && !email.active) email.active = data.subKey;
      providers.email = email;
    } else {
      const existing = providers[data.provider] as Record<string, unknown> | undefined;
      providers[data.provider] = mergeProviderPatch(
        data.provider,
        existing,
        data.settings,
      );
    }

    const next = await upsertRow(context.supabase, data.workspaceId, {
      providers: providers as Providers,
    });
    return maskSettings(next);
  });

export const setActiveEmailProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; active: EmailSubKey | "" }) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        active: z.union([emailSubEnum, z.literal("")]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertWorkspaceMember(context, data.workspaceId);
    const row = await loadRow(context.supabase, data.workspaceId);
    const email = { ...((row.providers.email as Record<string, unknown>) ?? {}) };
    if (data.active === "") delete email.active;
    else email.active = data.active;
    const providers = { ...row.providers, email } as Providers;
    const next = await upsertRow(context.supabase, data.workspaceId, { providers });
    return maskSettings(next);
  });

// ---------- notifications ----------

export const updateNotifications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; notifications: Notifications }) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        notifications: z.record(z.string(), z.unknown()) as z.ZodType<Notifications>,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertWorkspaceMember(context, data.workspaceId);
    const next = await upsertRow(context.supabase, data.workspaceId, {
      notifications: data.notifications,
    });
    return maskSettings(next);
  });

// ---------- connection tests / send ----------

type TestResult = HealthEntry & { ok: boolean };

async function testWhatsApp(s: Record<string, unknown>): Promise<TestResult> {
  const token = s.accessToken as string;
  const phoneId = s.phoneNumberId as string;
  if (!token || !phoneId) return { ok: false, status: "invalid", message: "Missing phone number ID or access token" };
  try {
    const r = await fetch(`https://graph.facebook.com/v20.0/${phoneId}?fields=verified_name,display_phone_number`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, status: "invalid", message: (body as { error?: { message?: string } })?.error?.message ?? `HTTP ${r.status}` };
    return { ok: true, status: "connected", version: "v20.0", message: (body as { verified_name?: string }).verified_name };
  } catch (e) {
    return { ok: false, status: "disconnected", message: (e as Error).message };
  }
}

async function testTelegram(s: Record<string, unknown>): Promise<TestResult> {
  const token = s.botToken as string;
  if (!token) return { ok: false, status: "invalid", message: "Missing bot token" };
  try {
    const r = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/getMe`);
    const body = (await r.json()) as { ok?: boolean; result?: { username?: string }; description?: string };
    if (!body.ok) return { ok: false, status: "invalid", message: body.description ?? "Telegram rejected the token" };
    return { ok: true, status: "connected", message: `@${body.result?.username ?? "bot"}` };
  } catch (e) {
    return { ok: false, status: "disconnected", message: (e as Error).message };
  }
}

async function testWebhook(url: string, provider: "slack" | "discord"): Promise<TestResult> {
  if (!url || !/^https:\/\//.test(url)) return { ok: false, status: "invalid", message: "Webhook URL must be HTTPS" };
  const host = provider === "slack" ? "hooks.slack.com" : "discord.com";
  if (!url.includes(host)) return { ok: false, status: "warning", message: `URL does not look like a ${provider} webhook` };
  return { ok: true, status: "connected" };
}

async function sendSlackTest(url: string, text: string): Promise<TestResult> {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!r.ok) return { ok: false, status: "invalid", message: `HTTP ${r.status}` };
    return { ok: true, status: "connected" };
  } catch (e) {
    return { ok: false, status: "disconnected", message: (e as Error).message };
  }
}

async function sendDiscordTest(url: string, content: string): Promise<TestResult> {
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!r.ok && r.status !== 204) return { ok: false, status: "invalid", message: `HTTP ${r.status}` };
    return { ok: true, status: "connected" };
  } catch (e) {
    return { ok: false, status: "disconnected", message: (e as Error).message };
  }
}

async function testBrevo(s: Record<string, unknown>): Promise<TestResult> {
  const apiKey = s.apiKey as string;
  if (!apiKey) return { ok: false, status: "invalid", message: "Missing API key" };
  try {
    const r = await fetch("https://api.brevo.com/v3/account", { headers: { "api-key": apiKey, accept: "application/json" } });
    if (!r.ok) return { ok: false, status: "invalid", message: `HTTP ${r.status}` };
    const b = (await r.json()) as { email?: string };
    return { ok: true, status: "connected", message: b.email };
  } catch (e) {
    return { ok: false, status: "disconnected", message: (e as Error).message };
  }
}

async function testMailchimp(s: Record<string, unknown>): Promise<TestResult> {
  const apiKey = s.apiKey as string;
  const dc = s.serverPrefix as string;
  if (!apiKey || !dc) return { ok: false, status: "invalid", message: "Missing API key or server prefix (e.g. us21)" };
  try {
    const auth = "Basic " + btoa(`anystring:${apiKey}`);
    const r = await fetch(`https://${dc}.api.mailchimp.com/3.0/ping`, { headers: { Authorization: auth } });
    if (!r.ok) return { ok: false, status: "invalid", message: `HTTP ${r.status}` };
    return { ok: true, status: "connected" };
  } catch (e) {
    return { ok: false, status: "disconnected", message: (e as Error).message };
  }
}

async function testConvertKit(s: Record<string, unknown>): Promise<TestResult> {
  const apiSecret = s.apiSecret as string;
  if (!apiSecret) return { ok: false, status: "invalid", message: "Missing API secret" };
  try {
    const r = await fetch(`https://api.convertkit.com/v3/account?api_secret=${encodeURIComponent(apiSecret)}`);
    if (!r.ok) return { ok: false, status: "invalid", message: `HTTP ${r.status}` };
    return { ok: true, status: "connected" };
  } catch (e) {
    return { ok: false, status: "disconnected", message: (e as Error).message };
  }
}

async function testResend(s: Record<string, unknown>): Promise<TestResult> {
  const apiKey = s.apiKey as string;
  if (!apiKey) return { ok: false, status: "invalid", message: "Missing API key" };
  try {
    const r = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${apiKey}` } });
    if (!r.ok) return { ok: false, status: "invalid", message: `HTTP ${r.status}` };
    return { ok: true, status: "connected" };
  } catch (e) {
    return { ok: false, status: "disconnected", message: (e as Error).message };
  }
}

async function sendWhatsAppTest(s: Record<string, unknown>, to: string, text: string): Promise<TestResult> {
  const token = s.accessToken as string;
  const phoneId = s.phoneNumberId as string;
  const r = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { body: text } }),
  });
  const body = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, status: "invalid", message: (body as { error?: { message?: string } })?.error?.message ?? `HTTP ${r.status}` };
  return { ok: true, status: "connected" };
}

async function sendTelegramTest(s: Record<string, unknown>, chatId: string, text: string): Promise<TestResult> {
  const token = s.botToken as string;
  const r = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  const body = (await r.json()) as { ok?: boolean; description?: string };
  if (!body.ok) return { ok: false, status: "invalid", message: body.description ?? "Telegram rejected the message" };
  return { ok: true, status: "connected" };
}

async function sendBrevoEmail(s: Record<string, unknown>, to: string, subject: string, html: string): Promise<TestResult> {
  const apiKey = s.apiKey as string;
  const from = s.fromEmail as string;
  const fromName = (s.fromName as string) || "ZUPIX";
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ sender: { email: from, name: fromName }, to: [{ email: to }], subject, htmlContent: html }),
  });
  if (!r.ok) {
    const body = await r.text();
    return { ok: false, status: "invalid", message: body.slice(0, 200) };
  }
  return { ok: true, status: "connected" };
}

async function sendResendEmail(s: Record<string, unknown>, to: string, subject: string, html: string): Promise<TestResult> {
  const apiKey = s.apiKey as string;
  const from = `${(s.fromName as string) || "ZUPIX"} <${s.fromEmail as string}>`;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!r.ok) {
    const body = await r.text();
    return { ok: false, status: "invalid", message: body.slice(0, 200) };
  }
  return { ok: true, status: "connected" };
}

// ---------- public: test connection ----------

export const testConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; provider: string; subKey?: string }) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        provider: providerKeyEnum,
        subKey: emailSubEnum.optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertWorkspaceMember(context, data.workspaceId);
    const row = await loadRow(context.supabase, data.workspaceId);

    let result: TestResult = { ok: false, status: "disconnected", message: "Not configured" };
    const p = row.providers;

    if (data.provider === "whatsapp" && p.whatsapp) result = await testWhatsApp(p.whatsapp as unknown as Record<string, unknown>);
    else if (data.provider === "telegram" && p.telegram) result = await testTelegram(p.telegram as unknown as Record<string, unknown>);
    else if (data.provider === "slack" && p.slack) result = await testWebhook(p.slack.webhookUrl, "slack");
    else if (data.provider === "discord" && p.discord) result = await testWebhook(p.discord.webhookUrl, "discord");
    else if (data.provider === "email" && data.subKey && p.email) {
      const sub = (p.email as unknown as Record<string, Record<string, unknown>>)[data.subKey];
      if (!sub) result = { ok: false, status: "disconnected", message: "Provider not configured" };
      else if (data.subKey === "brevo") result = await testBrevo(sub);
      else if (data.subKey === "mailchimp") result = await testMailchimp(sub);
      else if (data.subKey === "convertkit") result = await testConvertKit(sub);
      else if (data.subKey === "resend") result = await testResend(sub);
      else if (data.subKey === "smtp") result = { ok: !!sub.host, status: sub.host ? "warning" : "invalid", message: "SMTP validated by config only; live send unsupported on this runtime." };
      else if (data.subKey === "ses") result = { ok: !!sub.accessKeyId, status: "warning", message: "Amazon SES architecture is ready but sending is not enabled yet." };
    }

    const key = healthKey(data.provider, data.subKey);
    const health: Health = {
      ...row.health,
      [key]: {
        status: result.status ?? (result.ok ? "connected" : "disconnected"),
        lastCheckedAt: new Date().toISOString(),
        message: result.message,
        version: result.version,
      },
    };
    await upsertRow(context.supabase, data.workspaceId, { health });
    return result;
  });

// ---------- send test message ----------

export const sendTestMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      workspaceId: string;
      provider: string;
      subKey?: string;
      recipient: string;
      subject?: string;
      message: string;
    }) =>
      z
        .object({
          workspaceId: z.string().uuid(),
          provider: providerKeyEnum,
          subKey: emailSubEnum.optional(),
          recipient: z.string().trim().min(1).max(320),
          subject: z.string().trim().max(200).optional(),
          message: z.string().trim().min(1).max(4000),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertWorkspaceMember(context, data.workspaceId);
    const row = await loadRow(context.supabase, data.workspaceId);
    const p = row.providers;

    if (data.provider === "whatsapp" && p.whatsapp)
      return sendWhatsAppTest(p.whatsapp as unknown as Record<string, unknown>, data.recipient, data.message);
    if (data.provider === "telegram" && p.telegram)
      return sendTelegramTest(p.telegram as unknown as Record<string, unknown>, data.recipient || p.telegram.defaultChatId, data.message);
    if (data.provider === "slack" && p.slack?.webhookUrl)
      return sendSlackTest(p.slack.webhookUrl, data.message);
    if (data.provider === "discord" && p.discord?.webhookUrl)
      return sendDiscordTest(p.discord.webhookUrl, data.message);
    if (data.provider === "email" && data.subKey && p.email) {
      const sub = (p.email as unknown as Record<string, Record<string, unknown>>)[data.subKey];
      if (!sub) throw new Error("Email provider not configured");
      const subject = data.subject || "ZUPIX Test Email";
      const html = `<p>${data.message.replace(/</g, "&lt;")}</p>`;
      if (data.subKey === "brevo") return sendBrevoEmail(sub, data.recipient, subject, html);
      if (data.subKey === "resend") return sendResendEmail(sub, data.recipient, subject, html);
      throw new Error(`Test send is not implemented for the ${data.subKey} provider on this runtime.`);
    }
    throw new Error("Provider not configured");
  });

// ---------- templates ----------

const channelEnum = z.enum(["email", "whatsapp", "telegram", "slack", "discord"]);

function mapTemplate(r: Record<string, unknown>): MessageTemplate {
  return {
    id: r.id as string,
    workspaceId: r.workspace_id as string,
    key: r.key as string,
    name: r.name as string,
    channel: r.channel as MessageTemplate["channel"],
    subject: (r.subject as string | null) ?? null,
    body: r.body as string,
    variables: (r.variables as string[]) ?? [],
    isSystem: (r.is_system as boolean) ?? false,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

export const listMessageTemplates = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) => z.object({ workspaceId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertWorkspaceMember(context, data.workspaceId);
    const { data: rows, error } = await context.supabase
      .from("message_templates")
      .select("*")
      .eq("workspace_id", data.workspaceId)
      .order("is_system", { ascending: false })
      .order("name", { ascending: true });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => mapTemplate(r as Record<string, unknown>));
  });

export const upsertMessageTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      workspaceId: string;
      id?: string;
      key: string;
      name: string;
      channel: string;
      subject?: string;
      body: string;
      variables?: string[];
    }) =>
      z
        .object({
          workspaceId: z.string().uuid(),
          id: z.string().uuid().optional(),
          key: z.string().trim().regex(/^[a-z0-9_-]{2,50}$/, "Key must be 2-50 chars: a-z 0-9 _ -"),
          name: z.string().trim().min(1).max(120),
          channel: channelEnum,
          subject: z.string().trim().max(200).optional(),
          body: z.string().trim().min(1).max(8000),
          variables: z.array(z.string().trim()).max(50).optional(),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertWorkspaceMember(context, data.workspaceId);
    const payload = {
      workspace_id: data.workspaceId,
      key: data.key,
      name: data.name,
      channel: data.channel,
      subject: data.subject ?? null,
      body: data.body,
      variables: data.variables ?? [],
      is_system: false,
    };
    const q = data.id
      ? context.supabase.from("message_templates").update(payload).eq("id", data.id).select().single()
      : context.supabase.from("message_templates").insert(payload).select().single();
    const { data: row, error } = await q;
    if (error) throw new Error(error.message);
    return mapTemplate(row as Record<string, unknown>);
  });

export const deleteMessageTemplate = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string; id: string }) =>
    z.object({ workspaceId: z.string().uuid(), id: z.string().uuid() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertWorkspaceMember(context, data.workspaceId);
    const { error } = await context.supabase
      .from("message_templates")
      .delete()
      .eq("id", data.id)
      .eq("workspace_id", data.workspaceId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const seedSystemTemplates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) => z.object({ workspaceId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertWorkspaceMember(context, data.workspaceId);
    const seeds: Array<{ key: string; name: string; channel: string; subject: string | null; body: string; variables: string[] }> = [
      { key: "welcome", name: "Welcome", channel: "email", subject: "Welcome to {{workspace_name}}", body: "Hi {{name}},\n\nThanks for joining {{workspace_name}}!", variables: ["name", "workspace_name"] },
      { key: "lead_received", name: "Lead Received", channel: "email", subject: "New lead from {{page_name}}", body: "You just received a new lead on {{page_name}}.\n\nName: {{name}}\nEmail: {{email}}\nMessage: {{message}}", variables: ["page_name", "name", "email", "message"] },
      { key: "contact_request", name: "Contact Request", channel: "email", subject: "New contact request", body: "{{name}} <{{email}}> sent you a contact request:\n\n{{message}}", variables: ["name", "email", "message"] },
      { key: "publish_success", name: "Publish Success", channel: "email", subject: "Your page {{page_name}} is live", body: "Your page {{page_name}} was published successfully. View it at {{url}}.", variables: ["page_name", "url"] },
    ];
    const rows = seeds.map((s) => ({ workspace_id: data.workspaceId, ...s, is_system: true }));
    const { error } = await context.supabase
      .from("message_templates")
      .upsert(rows, { onConflict: "workspace_id,key,channel", ignoreDuplicates: true });
    if (error) throw new Error(error.message);
    return { seeded: rows.length };
  });

export { SECRET_SENTINEL };
