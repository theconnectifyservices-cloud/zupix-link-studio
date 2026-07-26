import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { WorkspaceIntegrationRow } from "./types";

function maskCreds(creds: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(creds ?? {})) {
    const s = typeof v === "string" ? v : "";
    if (!s) continue;
    if (s.length <= 6) out[k] = "••••";
    else out[k] = `${s.slice(0, 3)}••••${s.slice(-3)}`;
  }
  return out;
}

function redact(row: Record<string, unknown>): WorkspaceIntegrationRow {
  const creds = (row.credentials as Record<string, unknown>) ?? {};
  return {
    id: String(row.id),
    workspace_id: String(row.workspace_id),
    provider_key: String(row.provider_key),
    category: String(row.category),
    display_name: String(row.display_name ?? ""),
    enabled: Boolean(row.enabled),
    environment: (row.environment as "sandbox" | "production") ?? "production",
    config: (row.config as Record<string, unknown>) ?? {},
    has_credentials: Object.keys(creds).length > 0,
    masked_credentials: maskCreds(creds),
    health_status: (row.health_status as WorkspaceIntegrationRow["health_status"]) ?? "unknown",
    health_message: (row.health_message as string | null) ?? null,
    last_tested_at: (row.last_tested_at as string | null) ?? null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

export const listIntegrations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workspaceId: string }) => d)
  .handler(async ({ data, context }): Promise<WorkspaceIntegrationRow[]> => {
    const { data: rows, error } = await context.supabase
      .from("workspace_integrations")
      .select("*")
      .eq("workspace_id", data.workspaceId)
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => redact(r as Record<string, unknown>));
  });

export const upsertIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      workspaceId: string;
      providerKey: string;
      category: string;
      displayName: string;
      enabled: boolean;
      environment: "sandbox" | "production";
      config: Record<string, unknown>;
      /** Only present when user typed new values. Undefined = keep existing. */
      credentials?: Record<string, string>;
    }) => d,
  )
  .handler(async ({ data, context }): Promise<WorkspaceIntegrationRow> => {
    // Fetch existing to merge credentials (never overwrite unchanged secrets).
    const { data: existing } = await context.supabase
      .from("workspace_integrations")
      .select("credentials")
      .eq("workspace_id", data.workspaceId)
      .eq("provider_key", data.providerKey)
      .maybeSingle();

    const nextCreds: Record<string, string> = {
      ...((existing?.credentials as Record<string, string>) ?? {}),
    };
    if (data.credentials) {
      for (const [k, v] of Object.entries(data.credentials)) {
        if (v && v.length > 0) nextCreds[k] = v;
      }
    }

    const payload = {
      workspace_id: data.workspaceId,
      provider_key: data.providerKey,
      category: data.category,
      display_name: data.displayName,
      enabled: data.enabled,
      environment: data.environment,
      config: data.config,
      credentials: nextCreds,
      updated_at: new Date().toISOString(),
    };

    const { data: row, error } = await context.supabase
      .from("workspace_integrations")
      .upsert(payload, { onConflict: "workspace_id,provider_key" })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return redact(row as Record<string, unknown>);
  });

export const toggleIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; enabled: boolean }) => d)
  .handler(async ({ data, context }): Promise<WorkspaceIntegrationRow> => {
    const { data: row, error } = await context.supabase
      .from("workspace_integrations")
      .update({ enabled: data.enabled, updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return redact(row as Record<string, unknown>);
  });

export const deleteIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("workspace_integrations")
      .delete()
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const testIntegration = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }): Promise<{ status: "healthy" | "degraded" | "down"; message: string }> => {
    const { data: row, error } = await context.supabase
      .from("workspace_integrations")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const provider = String(row.provider_key);
    const creds = (row.credentials as Record<string, string>) ?? {};
    const config = (row.config as Record<string, string>) ?? {};

    let result: { status: "healthy" | "degraded" | "down"; message: string } = {
      status: "unknown" as never,
      message: "",
    };

    try {
      switch (provider) {
        case "slack":
        case "discord": {
          const url = creds.webhook_url;
          if (!url) throw new Error("Missing webhook URL");
          const body = provider === "slack"
            ? { text: "✅ ZUPIX Integration test — connection verified." }
            : { content: "✅ ZUPIX Integration test — connection verified." };
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          result = res.ok
            ? { status: "healthy", message: `Webhook responded ${res.status}` }
            : { status: "down", message: `Webhook returned ${res.status}` };
          break;
        }
        case "telegram_bot": {
          if (!creds.bot_token) throw new Error("Missing bot token");
          const res = await fetch(`https://api.telegram.org/bot${creds.bot_token}/getMe`);
          const j = (await res.json()) as { ok?: boolean; result?: { username?: string } };
          result = j.ok
            ? { status: "healthy", message: `Bot @${j.result?.username ?? "unknown"} reachable` }
            : { status: "down", message: "Bot token rejected" };
          break;
        }
        case "whatsapp_cloud": {
          if (!creds.access_token || !config.phone_number_id) throw new Error("Missing credentials");
          const res = await fetch(
            `https://graph.facebook.com/v20.0/${config.phone_number_id}?fields=display_phone_number`,
            { headers: { Authorization: `Bearer ${creds.access_token}` } },
          );
          const j = (await res.json()) as { display_phone_number?: string; error?: { message: string } };
          result = res.ok
            ? { status: "healthy", message: `Verified ${j.display_phone_number ?? "phone"}` }
            : { status: "down", message: j.error?.message ?? `HTTP ${res.status}` };
          break;
        }
        case "meta_pixel": {
          result = config.pixel_id
            ? { status: "healthy", message: `Pixel ${config.pixel_id} configured` }
            : { status: "down", message: "Pixel ID missing" };
          break;
        }
        case "google_analytics": {
          result = /^G-[A-Z0-9]+$/i.test(String(config.measurement_id ?? ""))
            ? { status: "healthy", message: "Measurement ID looks valid" }
            : { status: "down", message: "Measurement ID must look like G-XXXXXX" };
          break;
        }
        case "google_tag_manager": {
          result = /^GTM-[A-Z0-9]+$/i.test(String(config.container_id ?? ""))
            ? { status: "healthy", message: "GTM container ID looks valid" }
            : { status: "down", message: "Container ID must look like GTM-XXXXXX" };
          break;
        }
        case "smtp":
        case "gmail":
        case "zoho_mail":
        case "outlook": {
          const hasHost = Boolean(config.host) || provider !== "smtp";
          const hasAuth = Boolean(creds.password || creds.app_password);
          result = hasHost && hasAuth
            ? { status: "healthy", message: "Credentials present — send a test email to verify delivery." }
            : { status: "degraded", message: "Missing host or password." };
          break;
        }
        default: {
          const hasCred = Object.keys(creds).length > 0;
          const hasConf = Object.keys(config).length > 0;
          result = hasCred || hasConf
            ? { status: "healthy", message: "Configuration saved." }
            : { status: "degraded", message: "No configuration yet." };
        }
      }
    } catch (e) {
      result = { status: "down", message: e instanceof Error ? e.message : "Test failed" };
    }

    await context.supabase
      .from("workspace_integrations")
      .update({
        health_status: result.status,
        health_message: result.message,
        last_tested_at: new Date().toISOString(),
      })
      .eq("id", data.id);

    return result;
  });
