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
  "form_submission",
  "booking_created",
  "booking_cancelled",
  "booking_rescheduled",
  "payment_success",
  "payment_failed",
  "store_order_new",
  "store_order_digital",
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

export type AutomationTrigger = WebhookEvent;

export type AutomationAction =
  | "send_email"
  | "send_whatsapp"
  | "dashboard_notification"
  | "activity_log"
  | "redirect_customer";

export interface AutomationRule {
  id: string;
  workspace_id: string;
  name: string;
  trigger: AutomationTrigger;
  action: AutomationAction;
  config: Record<string, any>;
  is_active: boolean;
  created_at: string;
}

export type NotificationType = "form" | "order" | "booking" | "payment" | "update";

export interface DashboardNotification {
  id: string;
  workspace_id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ActivityLogEntry {
  id: string;
  workspace_id: string;
  type: string;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface UserAutomationSettings {
  email_enabled: boolean;
  whatsapp_enabled: boolean;
  dashboard_enabled: boolean;
}

