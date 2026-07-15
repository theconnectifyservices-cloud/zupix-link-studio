// Automation Platform types - API Keys, Webhooks, Deliveries, API Logs.

export type ApiKeyStatus = "active" | "disabled" | "revoked";
export type ApiPermission = "read" | "write" | "admin";

export interface ApiKey {
  id: string;
  workspaceId: string;
  createdBy: string;
  name: string;
  keyPrefix: string;
  permissions: ApiPermission[];
  status: ApiKeyStatus;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type WebhookStatus = "active" | "paused" | "disabled";

export const WEBHOOK_EVENTS = [
  "bio.published",
  "bio.updated",
  "bio.deleted",
  "project.created",
  "project.deleted",
  "qr.generated",
  "asset.uploaded",
  "template.applied",
  "goal.completed",
] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export interface Webhook {
  id: string;
  workspaceId: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  status: WebhookStatus;
  headers: Record<string, string>;
  lastDeliveryAt: string | null;
  lastStatusCode: number | null;
  failureCount: number;
  createdAt: string;
  updatedAt: string;
}

export type DeliveryStatus = "pending" | "success" | "failed" | "retrying";

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  status: DeliveryStatus;
  statusCode: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  attempt: number;
  durationMs: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ApiRequestLog {
  id: string;
  workspaceId: string;
  apiKeyId: string | null;
  requestId: string;
  method: string;
  endpoint: string;
  statusCode: number;
  durationMs: number;
  errorMessage: string | null;
  createdAt: string;
}

export const AUTOMATION_PROVIDERS = [
  { id: "zapier", name: "Zapier", status: "ready", docs: "https://zapier.com/apps" },
  { id: "make", name: "Make (Integromat)", status: "ready", docs: "https://www.make.com" },
  { id: "n8n", name: "n8n", status: "coming_soon", docs: "https://n8n.io" },
  { id: "pipedream", name: "Pipedream", status: "coming_soon", docs: "https://pipedream.com" },
] as const;
