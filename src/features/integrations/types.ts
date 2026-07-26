export type IntegrationCategory =
  | "payments"
  | "email"
  | "marketing"
  | "communication"
  | "storage"
  | "automation";

export type IntegrationFieldType =
  | "text"
  | "password"
  | "url"
  | "email"
  | "textarea"
  | "select"
  | "image";

export interface IntegrationField {
  key: string;
  label: string;
  type: IntegrationFieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  secret?: boolean;
  options?: { value: string; label: string }[];
}

export interface IntegrationDefinition {
  key: string;
  category: IntegrationCategory;
  label: string;
  description: string;
  logo: string;
  color: string; // tailwind gradient tokens
  supportsEnvironments?: boolean;
  supportsTest?: boolean;
  /** Config fields (non-secret). */
  configFields: IntegrationField[];
  /** Secret credential fields. */
  credentialFields: IntegrationField[];
  /** When true, integration is delegated to another module (e.g. payments). */
  externalRoute?: string;
  /** Docs anchor URL. */
  docsUrl?: string;
}

export interface WorkspaceIntegrationRow {
  id: string;
  workspace_id: string;
  provider_key: string;
  category: string;
  display_name: string;
  enabled: boolean;
  environment: "sandbox" | "production";
  config: Record<string, unknown>;
  /** Client-safe: booleans only. */
  has_credentials: boolean;
  masked_credentials: Record<string, string>;
  health_status: "unknown" | "healthy" | "degraded" | "down";
  health_message: string | null;
  last_tested_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IntegrationSummary {
  total: number;
  connected: number;
  active: number;
  disconnected: number;
  webhooks_ok: number;
  last_sync: string | null;
}
