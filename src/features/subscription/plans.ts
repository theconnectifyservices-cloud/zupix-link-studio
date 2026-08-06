/**
 * ZUPIX Subscription Plans — Single source of truth.
 *
 * Mirrors the seeds in `billing_plans` / `plan_features` / `plan_limits`.
 * All feature gating (builder blocks, custom domain, remove branding, etc.)
 * resolves through this registry. Database values win at runtime; this
 * registry gives static defaults and rich UI metadata (emoji, colors,
 * marketing copy) that the DB does not carry.
 */
import type { BlockType } from "@/features/builder/types";

export type PlanCode = "udaan" | "tejas" | "shikhar";

export type FeatureKey =
  // Builder blocks
  | "block.profile"
  | "block.heading"
  | "block.text"
  | "block.button"
  | "block.button_group"
  | "block.divider"
  | "block.spacer"
  | "block.social"
  | "block.image"
  | "block.gallery"
  | "block.video"
  | "block.social_feed"
  | "block.contact_card"
  | "block.testimonials"
  | "block.faq"
  | "block.countdown"
  | "block.map"
  | "block.file_download"
  | "block.embed"
  | "block.custom_code"
  | "block.form"
  | "block.store"
  | "block.bookings"
  | "block.digital_products"
  | "block.membership"
  | "block.subscriptions"
  | "block.donations"
  | "block.payments"
  // Platform features
  | "remove_branding"
  | "custom_domain";

/** Map builder BlockType → subscription feature key. */
export const BLOCK_FEATURE_KEY: Partial<Record<BlockType, FeatureKey>> = {
  profile: "block.profile",
  heading: "block.heading",
  text: "block.text",
  button: "block.button",
  buttonGroup: "block.button_group",
  divider: "block.divider",
  spacer: "block.spacer",
  social: "block.social",
  image: "block.image",
  gallery: "block.gallery",
  video: "block.video",
  socialFeed: "block.social_feed",
  contact: "block.contact_card",
  testimonials: "block.testimonials",
  faq: "block.faq",
  countdown: "block.countdown",
  map: "block.map",
  file: "block.file_download",
  embed: "block.embed",
  customCode: "block.custom_code",
  form: "block.form",
  store: "block.store",
  booking: "block.bookings",
};

export interface PlanDefinition {
  code: PlanCode;
  name: string;
  emoji: string;
  tagline: string;
  priceMonthlyMinor: number;
  priceYearlyMinor: number;
  currency: string;
  gradient: string; // css class gradient
  accent: string; // token color name
  badge?: string;
  comingSoon?: boolean;
  waitlist?: boolean;
  features: FeatureKey[];
  limits: { bio_pages: number | "unlimited"; custom_domains: number | "unlimited" };
  highlights: string[];
}

const UDAAN_FEATURES: FeatureKey[] = [
  "block.profile",
  "block.heading",
  "block.text",
  "block.button",
  "block.button_group",
  "block.divider",
  "block.spacer",
  "block.social",
  "block.image",
  "block.gallery",
  "block.video",
  "block.social_feed",
  "block.contact_card",
];

const TEJAS_ADDITIONS: FeatureKey[] = [
  "block.testimonials",
  "block.faq",
  "block.countdown",
  "block.map",
  "block.file_download",
  "block.embed",
  "block.custom_code",
  "block.form",
  "remove_branding",
  "custom_domain",
];

const SHIKHAR_ADDITIONS: FeatureKey[] = [
  "block.store",
  "block.bookings",
  "block.digital_products",
  "block.membership",
  "block.subscriptions",
  "block.donations",
  "block.payments",
];

export const PLANS: Record<PlanCode, PlanDefinition> = {
  udaan: {
    code: "udaan",
    name: "Udaan",
    emoji: "🌱",
    tagline: "Perfect for individuals starting their digital identity.",
    priceMonthlyMinor: 0,
    priceYearlyMinor: 0,
    currency: "INR",
    gradient: "from-emerald-500/80 to-teal-500/80",
    accent: "emerald",
    features: UDAAN_FEATURES,
    limits: { bio_pages: 1, custom_domains: 0 },
    highlights: [
      "1 Bio Link",
      "13 Essential Blocks",
      "ZUPIX Subdomain",
      "Basic Analytics",
      "Community Support",
      "Standard Themes",
      "Basic SEO",
      "QR Code",
      "Social Links",
      "Contact Buttons",
    ],
  },
  tejas: {
    code: "tejas",
    name: "Tejas",
    emoji: "🚀",
    tagline: "Perfect for creators, freelancers, businesses and growing brands.",
    priceMonthlyMinor: 29900,
    priceYearlyMinor: 259900,
    currency: "INR",
    gradient: "from-primary to-purple-600",
    accent: "primary",
    badge: "Most Popular",
    features: [...UDAAN_FEATURES, ...TEJAS_ADDITIONS],
    limits: { bio_pages: 3, custom_domains: 1 },
    highlights: [
      "3 Bio Links",
      "All Blocks Unlocked",
      "50+ Premium Themes",
      "Custom Domain",
      "Remove ZUPIX Branding",
      "Advanced Analytics Dashboard",
      "Priority Support",
      "3-Day Free Trial",
      "Multiple Link Collections",
      "Custom Buttons",
      "Premium Icons",
      "AI Content Assistance",
      "Forms & Lead Collection",
      "WhatsApp Integration",
      "Google Analytics Integration",
      "Facebook Pixel Support",
      "Meta Verification Ready",
      "Password Protected Pages",
      "Scheduling Links",
      "File Download Links",
      "Image & Video Gallery",
      "Custom CSS",
      "QR Code Customization",
      "Priority Theme Updates",
      "Early Access to New Features",
    ],
  },
  shikhar: {
    code: "shikhar",
    name: "Shikhar",
    emoji: "👑",
    tagline: "Commerce, memberships, bookings and beyond.",
    priceMonthlyMinor: 49900,
    priceYearlyMinor: 459900,
    currency: "INR",
    gradient: "from-amber-500 via-orange-500 to-pink-600",
    accent: "amber",
    badge: "Enterprise",
    comingSoon: false,
    waitlist: false,
    features: [...UDAAN_FEATURES, ...TEJAS_ADDITIONS, ...SHIKHAR_ADDITIONS],
    limits: { bio_pages: "unlimited", custom_domains: "unlimited" },
    highlights: [
      "Everything in Tejas +",
      "Unlimited Bio Links",
      "Store & Digital Products",
      "Booking System",
      "Membership System",
      "Donations",
      "Payment Collection",
      "White Label",
      "Team Members",
      "Advanced Automation",
      "API Access",
      "Dedicated Success Manager",
      "Enterprise Features",
      "Future Commerce Modules",
    ],
  },
};

export const PLAN_ORDER: PlanCode[] = ["udaan", "tejas", "shikhar"];

/** Price of one additional Bio Link add-on (in paise). */
export const BIO_LINK_ADDON_PRICE_MINOR = 7900;
/** Catalog code of the additional Bio Link add-on (`public.addons.code`). */
export const BIO_LINK_ADDON_CODE = "extra_bio_link";
/** Customer-facing add-on note shown on pricing cards and plan details. */
export const BIO_LINK_ADDON_NOTE =
  "Need more Bio Links? Purchase additional Bio Links anytime for just \u20b979 per Bio Link.";

/** Returns the smallest plan that unlocks the given feature. */
export function requiredPlanFor(feature: FeatureKey): PlanCode {
  for (const code of PLAN_ORDER) {
    if (PLANS[code].features.includes(feature)) return code;
  }
  return "shikhar";
}

/** Convenience: plan required for a builder block. */
export function requiredPlanForBlock(type: BlockType): PlanCode | null {
  const key = BLOCK_FEATURE_KEY[type];
  if (!key) return null;
  return requiredPlanFor(key);
}

export function planRank(code: PlanCode): number {
  return PLAN_ORDER.indexOf(code);
}

/** True when `have` includes access equal to or above `need`. */
export function planCovers(have: PlanCode, need: PlanCode): boolean {
  return planRank(have) >= planRank(need);
}

export function formatPlanPrice(minor: number, currency = "INR"): string {
  if (minor === 0) return "Free";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(minor / 100);
  } catch {
    return `₹${(minor / 100).toFixed(0)}`;
  }
}

/** Yearly savings vs 12x monthly, as a percentage integer. */
export function yearlySavingsPct(plan: PlanDefinition): number {
  if (plan.priceMonthlyMinor <= 0 || plan.priceYearlyMinor <= 0) return 0;
  const annual = plan.priceMonthlyMinor * 12;
  return Math.round(((annual - plan.priceYearlyMinor) / annual) * 100);
}
