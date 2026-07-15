export type ResellerClientStatus =
  | "lead"
  | "trial"
  | "active"
  | "suspended"
  | "expired"
  | "archived"
  | "cancelled";

export type ResellerPriority = "low" | "normal" | "high" | "urgent";
export type ResellerSupportStatus = "none" | "open" | "pending" | "resolved";
export type ResellerTeamRole =
  | "owner"
  | "admin"
  | "sales"
  | "support"
  | "designer"
  | "developer"
  | "viewer";
export type ResellerNoteKind = "internal" | "support";

export interface ResellerClient {
  id: string;
  tenant_id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  status: ResellerClientStatus;
  priority: ResellerPriority;
  support_status: ResellerSupportStatus;
  plan_key: string | null;
  workspace_id: string | null;
  custom_domain: string | null;
  assigned_staff_id: string | null;
  trial_ends_at: string | null;
  subscription_expires_at: string | null;
  activated_at: string | null;
  suspended_at: string | null;
  archived_at: string | null;
  tags: string[];
  usage: {
    storage_mb?: number;
    ai_credits?: number;
    api_calls?: number;
    domains?: number;
    analytics_events?: number;
    media_count?: number;
  };
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResellerNote {
  id: string;
  tenant_id: string;
  client_id: string;
  kind: ResellerNoteKind;
  body: string;
  author_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResellerTeamMember {
  id: string;
  tenant_id: string;
  user_id: string;
  role: ResellerTeamRole;
  custom_role_key: string | null;
  created_at: string;
  updated_at: string;
}

export const CLIENT_STATUSES: ResellerClientStatus[] = [
  "lead",
  "trial",
  "active",
  "suspended",
  "expired",
  "archived",
  "cancelled",
];

export const TEAM_ROLES: ResellerTeamRole[] = [
  "owner",
  "admin",
  "sales",
  "support",
  "designer",
  "developer",
  "viewer",
];
