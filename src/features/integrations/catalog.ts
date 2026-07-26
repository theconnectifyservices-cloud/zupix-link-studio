import type { IntegrationDefinition } from "./types";

/**
 * Enterprise Integrations catalog — the single source of truth for every
 * supported provider surfaced in the Integration Center.
 */
export const INTEGRATIONS: IntegrationDefinition[] = [
  // ────── PAYMENTS (managed by Payment Gateway Hub) ──────
  {
    key: "razorpay",
    category: "payments",
    label: "Razorpay",
    description: "Cards, UPI, Net Banking, Wallets, EMI — India's leading gateway.",
    logo: "https://razorpay.com/favicon.png",
    color: "from-blue-500 to-indigo-600",
    supportsEnvironments: true,
    supportsTest: true,
    externalRoute: "/admin/payment-gateways",
    configFields: [],
    credentialFields: [
      { key: "key_id", label: "Key ID", type: "text", required: true, placeholder: "rzp_live_..." },
      { key: "key_secret", label: "Key Secret", type: "password", required: true, secret: true },
      { key: "webhook_secret", label: "Webhook Secret", type: "password", secret: true },
    ],
    docsUrl: "https://razorpay.com/docs/",
  },
  {
    key: "payu",
    category: "payments",
    label: "PayU",
    description: "Cards, UPI, Net Banking, Wallets across India & LATAM.",
    logo: "https://payu.in/favicon.ico",
    color: "from-emerald-500 to-teal-600",
    supportsEnvironments: true,
    supportsTest: true,
    externalRoute: "/admin/payment-gateways",
    configFields: [],
    credentialFields: [
      { key: "merchant_key", label: "Merchant Key", type: "text", required: true },
      { key: "merchant_salt", label: "Merchant Salt", type: "password", required: true, secret: true },
    ],
  },
  {
    key: "cashfree",
    category: "payments",
    label: "Cashfree",
    description: "Payments, payouts, subscriptions & refunds.",
    logo: "https://www.cashfree.com/favicon.ico",
    color: "from-cyan-500 to-sky-600",
    supportsEnvironments: true,
    supportsTest: true,
    externalRoute: "/admin/payment-gateways",
    configFields: [],
    credentialFields: [
      { key: "app_id", label: "App ID", type: "text", required: true },
      { key: "secret_key", label: "Secret Key", type: "password", required: true, secret: true },
    ],
  },
  {
    key: "manual_upi",
    category: "payments",
    label: "Manual UPI QR",
    description: "Show a QR + UPI ID and verify UTR manually. Zero fees.",
    logo: "https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg",
    color: "from-orange-500 to-rose-600",
    externalRoute: "/admin/payment-gateways",
    configFields: [
      { key: "upi_id", label: "UPI ID", type: "text", required: true, placeholder: "business@upi" },
      { key: "account_name", label: "Merchant / Account Name", type: "text", required: true },
      { key: "qr_image_url", label: "QR Image URL", type: "image", placeholder: "https://…" },
      { key: "instructions", label: "Payment Instructions", type: "textarea" },
    ],
    credentialFields: [],
  },

  // ────── EMAIL ──────
  {
    key: "smtp",
    category: "email",
    label: "Custom SMTP",
    description: "Send transactional email via any SMTP server (SendGrid, Mailgun, Postmark…).",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/maildotru.svg",
    color: "from-slate-500 to-slate-700",
    supportsTest: true,
    configFields: [
      { key: "from_name", label: "From Name", type: "text", required: true, placeholder: "ZUPIX" },
      { key: "from_email", label: "From Email", type: "email", required: true, placeholder: "hello@yourbrand.com" },
      { key: "host", label: "SMTP Host", type: "text", required: true, placeholder: "smtp.yourhost.com" },
      { key: "port", label: "SMTP Port", type: "text", required: true, placeholder: "587" },
      {
        key: "secure",
        label: "Encryption",
        type: "select",
        options: [
          { value: "tls", label: "TLS (587)" },
          { value: "ssl", label: "SSL (465)" },
          { value: "none", label: "None (25)" },
        ],
      },
    ],
    credentialFields: [
      { key: "username", label: "SMTP Username", type: "text", required: true },
      { key: "password", label: "SMTP Password", type: "password", required: true, secret: true },
    ],
  },
  {
    key: "gmail",
    category: "email",
    label: "Gmail",
    description: "Send via Google Workspace / Gmail SMTP with App Password.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/gmail.svg",
    color: "from-red-500 to-orange-500",
    supportsTest: true,
    configFields: [
      { key: "from_name", label: "From Name", type: "text", required: true },
    ],
    credentialFields: [
      { key: "email", label: "Gmail Address", type: "email", required: true },
      { key: "app_password", label: "App Password", type: "password", required: true, secret: true, helpText: "Create at myaccount.google.com/apppasswords" },
    ],
  },
  {
    key: "zoho_mail",
    category: "email",
    label: "Zoho Mail",
    description: "Send from your Zoho Mail account via SMTP.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/zoho.svg",
    color: "from-red-600 to-rose-700",
    supportsTest: true,
    configFields: [
      { key: "region", label: "Region", type: "select", options: [
        { value: "in", label: "India (zoho.in)" },
        { value: "com", label: "Global (zoho.com)" },
        { value: "eu", label: "Europe (zoho.eu)" },
      ] },
    ],
    credentialFields: [
      { key: "email", label: "Zoho Email", type: "email", required: true },
      { key: "password", label: "Password / App Password", type: "password", required: true, secret: true },
    ],
  },
  {
    key: "outlook",
    category: "email",
    label: "Outlook / Office 365",
    description: "Send email via Microsoft SMTP (smtp.office365.com).",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/microsoftoutlook.svg",
    color: "from-blue-600 to-sky-700",
    supportsTest: true,
    configFields: [
      { key: "from_name", label: "From Name", type: "text" },
    ],
    credentialFields: [
      { key: "email", label: "Outlook Email", type: "email", required: true },
      { key: "password", label: "Password / App Password", type: "password", required: true, secret: true },
    ],
  },

  // ────── MARKETING ──────
  {
    key: "google_analytics",
    category: "marketing",
    label: "Google Analytics 4",
    description: "Send page views, events, and conversions to GA4.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/googleanalytics.svg",
    color: "from-amber-500 to-orange-600",
    configFields: [
      { key: "measurement_id", label: "Measurement ID", type: "text", required: true, placeholder: "G-XXXXXXXXXX" },
    ],
    credentialFields: [],
  },
  {
    key: "google_tag_manager",
    category: "marketing",
    label: "Google Tag Manager",
    description: "Manage every marketing tag from one container.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/googletagmanager.svg",
    color: "from-blue-500 to-cyan-600",
    configFields: [
      { key: "container_id", label: "Container ID", type: "text", required: true, placeholder: "GTM-XXXXXX" },
    ],
    credentialFields: [],
  },
  {
    key: "meta_pixel",
    category: "marketing",
    label: "Meta Pixel",
    description: "Track conversions for Facebook & Instagram Ads.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/meta.svg",
    color: "from-blue-600 to-indigo-700",
    configFields: [
      { key: "pixel_id", label: "Pixel ID", type: "text", required: true, placeholder: "123456789012345" },
    ],
    credentialFields: [
      { key: "access_token", label: "Conversions API Token", type: "password", secret: true, helpText: "Optional — enables server-side events." },
    ],
  },
  {
    key: "google_search_console",
    category: "marketing",
    label: "Google Search Console",
    description: "Verify ownership and monitor search performance.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/googlesearchconsole.svg",
    color: "from-green-500 to-emerald-600",
    configFields: [
      { key: "verification_code", label: "Verification Meta Tag", type: "textarea", required: true, placeholder: "<meta name=\"google-site-verification\" content=\"…\" />" },
    ],
    credentialFields: [],
  },

  // ────── COMMUNICATION ──────
  {
    key: "whatsapp_cloud",
    category: "communication",
    label: "WhatsApp Cloud API",
    description: "Send template messages via Meta's WhatsApp Business API.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/whatsapp.svg",
    color: "from-emerald-500 to-green-600",
    supportsTest: true,
    configFields: [
      { key: "phone_number_id", label: "Phone Number ID", type: "text", required: true },
      { key: "business_account_id", label: "WABA ID", type: "text", required: true },
    ],
    credentialFields: [
      { key: "access_token", label: "Permanent Access Token", type: "password", required: true, secret: true },
    ],
  },
  {
    key: "telegram_bot",
    category: "communication",
    label: "Telegram Bot",
    description: "Send notifications through a Telegram bot chat.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/telegram.svg",
    color: "from-sky-500 to-blue-600",
    supportsTest: true,
    configFields: [
      { key: "chat_id", label: "Default Chat ID", type: "text", required: true, placeholder: "-100…" },
    ],
    credentialFields: [
      { key: "bot_token", label: "Bot Token", type: "password", required: true, secret: true, placeholder: "123456:ABC-…" },
    ],
  },
  {
    key: "slack",
    category: "communication",
    label: "Slack",
    description: "Post alerts to a Slack channel via Incoming Webhook.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/slack.svg",
    color: "from-purple-500 to-fuchsia-600",
    supportsTest: true,
    configFields: [
      { key: "channel", label: "Channel", type: "text", placeholder: "#alerts" },
    ],
    credentialFields: [
      { key: "webhook_url", label: "Incoming Webhook URL", type: "password", required: true, secret: true, placeholder: "https://hooks.slack.com/…" },
    ],
  },
  {
    key: "discord",
    category: "communication",
    label: "Discord Webhook",
    description: "Post messages to a Discord channel via webhook.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/discord.svg",
    color: "from-indigo-500 to-violet-600",
    supportsTest: true,
    configFields: [
      { key: "username", label: "Display Username", type: "text", placeholder: "ZUPIX" },
    ],
    credentialFields: [
      { key: "webhook_url", label: "Webhook URL", type: "password", required: true, secret: true, placeholder: "https://discord.com/api/webhooks/…" },
    ],
  },

  // ────── STORAGE ──────
  {
    key: "supabase_storage",
    category: "storage",
    label: "Lovable Cloud Storage",
    description: "Built-in encrypted object storage — always on.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/supabase.svg",
    color: "from-emerald-500 to-green-700",
    configFields: [
      { key: "default_bucket", label: "Default Bucket", type: "text", placeholder: "media" },
    ],
    credentialFields: [],
  },
  {
    key: "cloudinary",
    category: "storage",
    label: "Cloudinary",
    description: "Image & video CDN with on-the-fly transformations.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/cloudinary.svg",
    color: "from-blue-500 to-indigo-600",
    supportsTest: true,
    configFields: [
      { key: "cloud_name", label: "Cloud Name", type: "text", required: true },
    ],
    credentialFields: [
      { key: "api_key", label: "API Key", type: "text", required: true },
      { key: "api_secret", label: "API Secret", type: "password", required: true, secret: true },
    ],
  },
  {
    key: "aws_s3",
    category: "storage",
    label: "AWS S3",
    description: "Enterprise object storage on Amazon Web Services.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/amazons3.svg",
    color: "from-orange-500 to-amber-600",
    configFields: [
      { key: "bucket", label: "Bucket Name", type: "text", required: true },
      { key: "region", label: "Region", type: "text", required: true, placeholder: "ap-south-1" },
    ],
    credentialFields: [
      { key: "access_key_id", label: "Access Key ID", type: "text", required: true },
      { key: "secret_access_key", label: "Secret Access Key", type: "password", required: true, secret: true },
    ],
  },

  // ────── AUTOMATION ──────
  {
    key: "webhook_manager",
    category: "automation",
    label: "Webhook Manager",
    description: "Broadcast platform events to any HTTPS endpoint.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/webhook.svg",
    color: "from-purple-500 to-pink-600",
    configFields: [
      { key: "default_target", label: "Default Target URL", type: "url", placeholder: "https://your-app.com/hooks" },
      { key: "events", label: "Subscribed Events (CSV)", type: "text", placeholder: "page.published,link.clicked" },
    ],
    credentialFields: [
      { key: "signing_secret", label: "Signing Secret", type: "password", required: true, secret: true },
    ],
  },
  {
    key: "rest_api",
    category: "automation",
    label: "REST API Access",
    description: "Enable programmatic access to your workspace resources.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/openapiinitiative.svg",
    color: "from-slate-600 to-zinc-800",
    configFields: [
      { key: "rate_limit", label: "Rate Limit (req/min)", type: "text", placeholder: "120" },
      { key: "allowed_origins", label: "Allowed Origins (CSV)", type: "text", placeholder: "https://app.example.com" },
    ],
    credentialFields: [],
  },
  {
    key: "api_keys",
    category: "automation",
    label: "API Keys",
    description: "Generate scoped API keys for external integrations.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/keycdn.svg",
    color: "from-yellow-500 to-amber-600",
    configFields: [
      { key: "default_scope", label: "Default Scope", type: "select", options: [
        { value: "read", label: "Read only" },
        { value: "write", label: "Read & Write" },
        { value: "admin", label: "Admin" },
      ] },
    ],
    credentialFields: [],
  },
  {
    key: "platform_events",
    category: "automation",
    label: "Platform Events",
    description: "Real-time event stream — clicks, publishes, conversions.",
    logo: "https://cdn.jsdelivr.net/npm/simple-icons@v11/icons/apachekafka.svg",
    color: "from-fuchsia-500 to-pink-600",
    configFields: [
      { key: "retention_days", label: "Retention (days)", type: "text", placeholder: "30" },
    ],
    credentialFields: [],
  },
];

export const CATEGORY_META: Record<
  string,
  { label: string; description: string; color: string }
> = {
  payments: {
    label: "Payments",
    description: "Accept payments online — cards, UPI, wallets.",
    color: "from-blue-500/20 to-indigo-500/20",
  },
  email: {
    label: "Email",
    description: "Send transactional & marketing email at scale.",
    color: "from-red-500/20 to-orange-500/20",
  },
  marketing: {
    label: "Marketing",
    description: "Analytics, pixels & tag managers.",
    color: "from-amber-500/20 to-yellow-500/20",
  },
  communication: {
    label: "Communication",
    description: "WhatsApp, Telegram, Slack & Discord.",
    color: "from-emerald-500/20 to-teal-500/20",
  },
  storage: {
    label: "Storage",
    description: "Object storage & media CDN.",
    color: "from-green-500/20 to-cyan-500/20",
  },
  automation: {
    label: "Automation",
    description: "Webhooks, REST API & platform events.",
    color: "from-purple-500/20 to-pink-500/20",
  },
};

export function getIntegration(key: string): IntegrationDefinition | undefined {
  return INTEGRATIONS.find((i) => i.key === key);
}
