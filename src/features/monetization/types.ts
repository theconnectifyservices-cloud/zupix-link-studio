/**
 * LS-13E — Monetization domain types.
 */

export type MetricKey =
  | "bio_pages"
  | "projects"
  | "custom_domains"
  | "storage_bytes"
  | "media_uploads"
  | "ai_credits"
  | "analytics_history_days"
  | "api_calls"
  | "team_members"
  | "workspaces"
  | "templates"
  | "qr_codes";

export type CreditType = "ai" | "storage" | "api";

export type BillingEventType =
  | "plan_upgrade"
  | "plan_downgrade"
  | "renewal"
  | "cancellation"
  | "payment_failure"
  | "trial_expiry"
  | "trial_extended"
  | "addon_purchase"
  | "addon_canceled";

export interface PlanFeature {
  id: string;
  plan_id: string;
  feature_key: string;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface PlanLimit {
  id: string;
  plan_id: string;
  metric_key: string;
  limit_value: number;
  is_unlimited: boolean;
  soft_limit: number | null;
}

export interface Addon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  metric_key: string | null;
  quantity_per_unit: number;
  price_minor: number;
  currency: string;
  billing_cycle: string;
  is_active: boolean;
  sort_order: number;
  metadata: Record<string, unknown>;
}

export interface WorkspaceAddon {
  id: string;
  workspace_id: string;
  addon_id: string;
  quantity: number;
  status: string;
  starts_at: string;
  ends_at: string | null;
  gateway: string | null;
  gateway_reference: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CreditLedgerEntry {
  id: string;
  workspace_id: string;
  credit_type: CreditType | string;
  delta: number;
  balance_after: number;
  reason: string;
  reference_type: string | null;
  reference_id: string | null;
  actor_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface UsageCounter {
  id: string;
  workspace_id: string;
  metric_key: string;
  value: number;
  period_start: string;
  period_end: string;
  updated_at: string;
}

export interface BillingEvent {
  id: string;
  workspace_id: string;
  event_type: BillingEventType | string;
  subscription_id: string | null;
  invoice_id: string | null;
  actor_id: string | null;
  from_plan: string | null;
  to_plan: string | null;
  amount_minor: number | null;
  currency: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface TrialExtension {
  id: string;
  workspace_id: string;
  subscription_id: string | null;
  extended_days: number;
  new_trial_end: string;
  reason: string | null;
  granted_by: string | null;
  created_at: string;
}

/** Static registry of features for the Monetization Admin UI. */
export const FEATURE_CATALOG: Array<{
  key: string;
  name: string;
  group: "core" | "advanced" | "enterprise" | "beta";
}> = [
  { key: "custom_domains", name: "Custom Domains", group: "advanced" },
  { key: "advanced_analytics", name: "Advanced Analytics", group: "advanced" },
  { key: "ai_studio", name: "AI Content Studio", group: "advanced" },
  { key: "ai_design", name: "AI Design Studio", group: "advanced" },
  { key: "ai_growth", name: "AI Growth Coach", group: "advanced" },
  { key: "ai_workflows", name: "AI Workflows", group: "advanced" },
  { key: "team_workspace", name: "Team Workspace", group: "core" },
  { key: "agency_platform", name: "Agency Operating System", group: "enterprise" },
  { key: "enterprise_governance", name: "Enterprise Governance", group: "enterprise" },
  { key: "sso_saml", name: "SSO / SAML", group: "enterprise" },
  { key: "white_label", name: "White Label", group: "enterprise" },
  { key: "priority_support", name: "Priority Support", group: "advanced" },
  { key: "webhooks", name: "Webhooks & API", group: "advanced" },
  { key: "premium_templates", name: "Premium Templates", group: "advanced" },
  { key: "campaigns", name: "Campaign Attribution", group: "advanced" },
  { key: "beta_experiments", name: "Beta Experiments", group: "beta" },
];

export const METRIC_CATALOG: Array<{ key: MetricKey; name: string; unit: string }> = [
  { key: "bio_pages", name: "Bio Pages", unit: "pages" },
  { key: "projects", name: "Projects", unit: "projects" },
  { key: "custom_domains", name: "Custom Domains", unit: "domains" },
  { key: "storage_bytes", name: "Storage", unit: "bytes" },
  { key: "media_uploads", name: "Media Uploads", unit: "uploads" },
  { key: "ai_credits", name: "AI Credits", unit: "credits" },
  { key: "analytics_history_days", name: "Analytics History", unit: "days" },
  { key: "api_calls", name: "API Calls", unit: "calls" },
  { key: "team_members", name: "Team Members", unit: "seats" },
  { key: "workspaces", name: "Workspaces", unit: "workspaces" },
  { key: "templates", name: "Templates", unit: "templates" },
  { key: "qr_codes", name: "QR Codes", unit: "codes" },
];
