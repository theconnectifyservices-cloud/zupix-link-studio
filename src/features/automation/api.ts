import { supabase } from "@/integrations/supabase/client";
import type {
  ApiKey,
  ApiKeyStatus,
  ApiPermission,
  ApiRequestLog,
  Webhook,
  WebhookDelivery,
  WebhookEvent,
  WebhookStatus,
} from "./types";

// ---- helpers ----

function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

// ---- API KEYS ----

type ApiKeyRow = {
  id: string;
  workspace_id: string;
  created_by: string;
  name: string;
  key_prefix: string;
  permissions: ApiPermission[] | null;
  status: ApiKeyStatus;
  last_used_at: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

function toApiKey(r: ApiKeyRow): ApiKey {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    createdBy: r.created_by,
    name: r.name,
    keyPrefix: r.key_prefix,
    permissions: r.permissions ?? ["read"],
    status: r.status,
    lastUsedAt: r.last_used_at,
    expiresAt: r.expires_at,
    revokedAt: r.revoked_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const AK = "api_keys" as never;

export async function listApiKeys(workspaceId: string): Promise<ApiKey[]> {
  const { data, error } = await supabase
    .from(AK)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as unknown as ApiKeyRow[]) ?? []).map(toApiKey);
}

export interface CreatedApiKey {
  key: ApiKey;
  plaintext: string; // shown ONCE
}

export async function createApiKey(input: {
  workspaceId: string;
  userId: string;
  name: string;
  permissions: ApiPermission[];
  expiresAt?: string | null;
}): Promise<CreatedApiKey> {
  const raw = randomToken(24);
  const plaintext = `zpx_live_${raw}`;
  const keyHash = await sha256(plaintext);
  const keyPrefix = plaintext.slice(0, 12);

  const { data, error } = await supabase
    .from(AK)
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      name: input.name,
      key_prefix: keyPrefix,
      key_hash: keyHash,
      permissions: input.permissions,
      expires_at: input.expiresAt ?? null,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return { key: toApiKey(data as unknown as ApiKeyRow), plaintext };
}

export async function renameApiKey(id: string, name: string) {
  const { error } = await supabase.from(AK).update({ name } as never).eq("id", id);
  if (error) throw error;
}

export async function setApiKeyStatus(id: string, status: ApiKeyStatus) {
  const patch: Record<string, unknown> = { status };
  if (status === "revoked") patch.revoked_at = new Date().toISOString();
  const { error } = await supabase.from(AK).update(patch as never).eq("id", id);
  if (error) throw error;
}

export async function regenerateApiKey(id: string): Promise<{ plaintext: string; keyPrefix: string }> {
  const raw = randomToken(24);
  const plaintext = `zpx_live_${raw}`;
  const keyHash = await sha256(plaintext);
  const keyPrefix = plaintext.slice(0, 12);
  const { error } = await supabase
    .from(AK)
    .update({ key_hash: keyHash, key_prefix: keyPrefix, status: "active", revoked_at: null } as never)
    .eq("id", id);
  if (error) throw error;
  return { plaintext, keyPrefix };
}

export async function deleteApiKey(id: string) {
  const { error } = await supabase.from(AK).delete().eq("id", id);
  if (error) throw error;
}

// ---- WEBHOOKS ----

type WebhookRow = {
  id: string;
  workspace_id: string;
  name: string;
  url: string;
  events: WebhookEvent[] | null;
  status: WebhookStatus;
  headers: Record<string, string> | null;
  last_delivery_at: string | null;
  last_status_code: number | null;
  failure_count: number;
  created_at: string;
  updated_at: string;
};

function toWebhook(r: WebhookRow): Webhook {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    name: r.name,
    url: r.url,
    events: r.events ?? [],
    status: r.status,
    headers: r.headers ?? {},
    lastDeliveryAt: r.last_delivery_at,
    lastStatusCode: r.last_status_code,
    failureCount: r.failure_count,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const WH = "webhooks" as never;
const WD = "webhook_deliveries" as never;

export async function listWebhooks(workspaceId: string): Promise<Webhook[]> {
  const { data, error } = await supabase
    .from(WH)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data as unknown as WebhookRow[]) ?? []).map(toWebhook);
}

export async function createWebhook(input: {
  workspaceId: string;
  userId: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  headers?: Record<string, string>;
}): Promise<Webhook> {
  const secret = `whsec_${randomToken(24)}`;
  const { data, error } = await supabase
    .from(WH)
    .insert({
      workspace_id: input.workspaceId,
      created_by: input.userId,
      name: input.name,
      url: input.url,
      events: input.events,
      headers: input.headers ?? {},
      secret,
    } as never)
    .select("*")
    .single();
  if (error) throw error;
  return toWebhook(data as unknown as WebhookRow);
}

export async function updateWebhook(
  id: string,
  patch: Partial<Pick<Webhook, "name" | "url" | "events" | "headers" | "status">>,
) {
  const dbPatch: Record<string, unknown> = { ...patch };
  const { error } = await supabase.from(WH).update(dbPatch as never).eq("id", id);
  if (error) throw error;
}

export async function deleteWebhook(id: string) {
  const { error } = await supabase.from(WH).delete().eq("id", id);
  if (error) throw error;
}

export async function pauseWebhook(id: string, paused: boolean) {
  await updateWebhook(id, { status: paused ? "paused" : "active" });
}

// Get secret (only for owner display / test signing preview)
export async function getWebhookSecret(id: string): Promise<string> {
  const { data, error } = await supabase.from(WH).select("secret").eq("id", id).single();
  if (error) throw error;
  return (data as { secret: string }).secret;
}

// ---- DELIVERIES ----

type DeliveryRow = {
  id: string;
  webhook_id: string;
  event: string;
  status: "pending" | "success" | "failed" | "retrying";
  status_code: number | null;
  response_body: string | null;
  error_message: string | null;
  attempt: number;
  duration_ms: number | null;
  created_at: string;
  completed_at: string | null;
};

export async function listDeliveries(
  workspaceId: string,
  webhookId?: string,
  limit = 50,
): Promise<WebhookDelivery[]> {
  let q = supabase
    .from(WD)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (webhookId) q = q.eq("webhook_id", webhookId);
  const { data, error } = await q;
  if (error) throw error;
  return ((data as unknown as DeliveryRow[]) ?? []).map((r) => ({
    id: r.id,
    webhookId: r.webhook_id,
    event: r.event,
    status: r.status,
    statusCode: r.status_code,
    responseBody: r.response_body,
    errorMessage: r.error_message,
    attempt: r.attempt,
    durationMs: r.duration_ms,
    createdAt: r.created_at,
    completedAt: r.completed_at,
  }));
}

// HMAC signing for outbound webhooks
async function hmacSha256Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Fire a delivery from the client (best-effort). Logs the attempt. */
export async function testWebhook(webhook: Webhook, event: WebhookEvent = "bio.published") {
  const secret = await getWebhookSecret(webhook.id);
  const payload = {
    event,
    delivery_id: crypto.randomUUID(),
    workspace_id: webhook.workspaceId,
    created_at: new Date().toISOString(),
    data: { test: true, message: "Test delivery from ZUPIX Link Studio" },
  };
  const body = JSON.stringify(payload);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = await hmacSha256Hex(secret, `${timestamp}.${body}`);

  const started = performance.now();
  let statusCode: number | null = null;
  let responseBody: string | null = null;
  let errorMessage: string | null = null;
  let status: "success" | "failed" = "failed";
  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-zupix-event": event,
        "x-zupix-timestamp": timestamp,
        "x-zupix-signature": `sha256=${signature}`,
        ...webhook.headers,
      },
      body,
    });
    statusCode = res.status;
    responseBody = (await res.text()).slice(0, 4000);
    status = res.ok ? "success" : "failed";
  } catch (e) {
    errorMessage = e instanceof Error ? e.message : "Network error";
  }
  const duration = Math.round(performance.now() - started);

  await supabase.from(WD).insert({
    webhook_id: webhook.id,
    workspace_id: webhook.workspaceId,
    event,
    payload,
    status,
    status_code: statusCode,
    response_body: responseBody,
    error_message: errorMessage,
    duration_ms: duration,
    completed_at: new Date().toISOString(),
  } as never);

  await supabase
    .from(WH)
    .update({
      last_delivery_at: new Date().toISOString(),
      last_status_code: statusCode,
      failure_count: status === "failed" ? webhook.failureCount + 1 : 0,
    } as never)
    .eq("id", webhook.id);

  return { status, statusCode, durationMs: duration, errorMessage };
}

export async function retryDelivery(delivery: WebhookDelivery) {
  const { data: wh, error } = await supabase.from(WH).select("*").eq("id", delivery.webhookId).single();
  if (error) throw error;
  return testWebhook(toWebhook(wh as unknown as WebhookRow), delivery.event as WebhookEvent);
}

// ---- API LOGS ----

type ApiLogRow = {
  id: string;
  workspace_id: string;
  api_key_id: string | null;
  request_id: string;
  method: string;
  endpoint: string;
  status_code: number;
  duration_ms: number;
  error_message: string | null;
  created_at: string;
};

export async function listApiLogs(workspaceId: string, limit = 100): Promise<ApiRequestLog[]> {
  const { data, error } = await supabase
    .from("api_request_logs" as never)
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data as unknown as ApiLogRow[]) ?? []).map((r) => ({
    id: r.id,
    workspaceId: r.workspace_id,
    apiKeyId: r.api_key_id,
    requestId: r.request_id,
    method: r.method,
    endpoint: r.endpoint,
    statusCode: r.status_code,
    durationMs: r.duration_ms,
    errorMessage: r.error_message,
    createdAt: r.created_at,
  }));
}
