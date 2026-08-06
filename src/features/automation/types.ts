import { LucideIcon } from "lucide-react";

export type AutomationTrigger =
  | "form_submission"
  | "booking_created"
  | "booking_cancelled"
  | "booking_rescheduled"
  | "payment_success"
  | "payment_failed"
  | "store_order_new"
  | "store_order_digital";

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
