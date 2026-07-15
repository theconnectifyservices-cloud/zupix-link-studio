// Communication Center — provider settings, notifications, templates.
// Secrets live server-side only. `fetchCommunicationSettings` returns
// masked values (`"__has_value__"` sentinel) so the UI can show status
// without exposing tokens.

export type ProviderKey =
  | "whatsapp"
  | "telegram"
  | "slack"
  | "discord"
  | "email";

export type EmailSubKey =
  | "smtp"
  | "brevo"
  | "mailchimp"
  | "convertkit"
  | "resend"
  | "ses";

export type ChannelKey =
  | "email"
  | "whatsapp"
  | "telegram"
  | "slack"
  | "discord";

export const SECRET_SENTINEL = "__has_value__";

export interface WhatsAppSettings {
  enabled: boolean;
  phoneNumberId: string;
  businessAccountId: string;
  accessToken: string; // masked in client reads
}

export interface TelegramSettings {
  enabled: boolean;
  botToken: string; // masked
  defaultChatId: string;
}

export interface SlackSettings {
  enabled: boolean;
  webhookUrl: string; // masked
}

export interface DiscordSettings {
  enabled: boolean;
  webhookUrl: string; // masked
}

export interface SmtpSettings {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string; // masked
  fromEmail: string;
  fromName: string;
  secure: boolean;
}

export interface BrevoSettings {
  enabled: boolean;
  apiKey: string; // masked
  fromEmail: string;
  fromName: string;
}

export interface MailchimpSettings {
  enabled: boolean;
  apiKey: string; // masked
  serverPrefix: string; // e.g. us21
  fromEmail: string;
}

export interface ConvertKitSettings {
  enabled: boolean;
  apiSecret: string; // masked
  fromEmail: string;
}

export interface ResendSettings {
  enabled: boolean;
  apiKey: string; // masked, optional (falls back to gateway)
  fromEmail: string;
  fromName: string;
}

export interface SesSettings {
  enabled: boolean;
  accessKeyId: string; // masked, future
  secretAccessKey: string; // masked
  region: string;
  fromEmail: string;
}

export interface EmailProviders {
  active?: EmailSubKey;
  smtp?: SmtpSettings;
  brevo?: BrevoSettings;
  mailchimp?: MailchimpSettings;
  convertkit?: ConvertKitSettings;
  resend?: ResendSettings;
  ses?: SesSettings;
}

export interface Providers {
  whatsapp?: WhatsAppSettings;
  telegram?: TelegramSettings;
  slack?: SlackSettings;
  discord?: DiscordSettings;
  email?: EmailProviders;
}

export type NotificationEvent =
  | "lead_received"
  | "contact_request"
  | "publish_success"
  | "welcome";

export interface NotificationRoute {
  channels: ChannelKey[]; // enabled channels for the event
  templateKey?: string;
}

export type Notifications = Partial<Record<NotificationEvent, NotificationRoute>>;

export type HealthStatus = "connected" | "disconnected" | "invalid" | "warning";

export interface HealthEntry {
  status: HealthStatus;
  lastCheckedAt?: string;
  message?: string;
  version?: string;
}

export type Health = Partial<Record<string, HealthEntry>>; // key: "whatsapp" or "email.brevo"

export interface CommunicationSettings {
  providers: Providers;
  notifications: Notifications;
  health: Health;
}

export interface MessageTemplate {
  id: string;
  workspaceId: string;
  key: string;
  name: string;
  channel: ChannelKey;
  subject: string | null;
  body: string;
  variables: string[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export const SYSTEM_TEMPLATE_KEYS = [
  "welcome",
  "lead_received",
  "contact_request",
  "publish_success",
] as const;

export const DEFAULT_SETTINGS: CommunicationSettings = {
  providers: {},
  notifications: {},
  health: {},
};

export const CHANNELS: ChannelKey[] = [
  "email",
  "whatsapp",
  "telegram",
  "slack",
  "discord",
];

export const NOTIFICATION_EVENTS: {
  key: NotificationEvent;
  label: string;
  description: string;
}[] = [
  { key: "lead_received", label: "Lead Received", description: "Someone submits a lead form on a bio page." },
  { key: "contact_request", label: "Contact Request", description: "A visitor uses the contact block." },
  { key: "publish_success", label: "Publish Success", description: "A bio page is published or scheduled." },
  { key: "welcome", label: "Welcome", description: "New user or workspace member onboarding." },
];
