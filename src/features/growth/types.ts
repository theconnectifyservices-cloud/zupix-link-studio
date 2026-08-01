/** How ZUPIX branding renders on a public bio page. */
export type BrandingMode = "hidden" | "compact" | "full";

export const BRANDING_MODES: Array<{ value: BrandingMode; label: string; hint: string }> = [
  { value: "hidden", label: "Hidden", hint: "No ZUPIX branding on your public page." },
  { value: "compact", label: "Compact Badge", hint: "Small “Built with ZUPIX” badge at the bottom." },
  { value: "full", label: "Full Branding Card", hint: "Logo, description and CTA card plus the badge." },
];

/** Admin-controlled default branding mode per paid plan code. */
export type PlanBrandingDefaults = Record<string, BrandingMode>;

export const DEFAULT_PLAN_BRANDING: PlanBrandingDefaults = {
  tejas: "hidden",
  garuda: "hidden",
  vajra: "hidden",
  lifetime: "hidden",
  shikhar: "hidden",
};

export interface WorkspaceBranding {
  plan: string;
  mode: BrandingMode;
  /** UDAAN / free plans cannot change branding. */
  locked: boolean;
}

export interface GrowthEngineSettings {
  floating_badge_enabled: boolean;
  footer_cta_enabled: boolean;
  upgrade_card_enabled: boolean;
  qr_branding_enabled: boolean;
  og_branding_enabled: boolean;
  dynamic_industry_cta_enabled: boolean;
  referral_cta_enabled: boolean;
  badge_text: string;
  badge_subtext: string;
  footer_headline: string;
  footer_subtext: string;
  footer_cta_label: string;
  referral_headline: string;
  referral_subtext: string;
  referral_cta_label: string;
  redirect_url: string;
  accent_color: string;
}

export const DEFAULT_GROWTH_SETTINGS: GrowthEngineSettings = {
  floating_badge_enabled: true,
  footer_cta_enabled: true,
  upgrade_card_enabled: true,
  qr_branding_enabled: true,
  og_branding_enabled: true,
  dynamic_industry_cta_enabled: true,
  referral_cta_enabled: true,
  badge_text: "Built with ZUPIX",
  badge_subtext: "Create Yours FREE",
  footer_headline: "This beautiful Bio Link was created using ZUPIX Link Studio.",
  footer_subtext: "Create your own professional Bio Link FREE in under 60 seconds.",
  footer_cta_label: "Create Free",
  referral_headline: "Love this Bio Link?",
  referral_subtext: "Create Yours FREE",
  referral_cta_label: "Start Building",
  redirect_url: "/pricing",
  accent_color: "#7c3aed",
};

/** Plan codes that show branding. Everything else is white-labeled. */
export const BRANDED_PLANS: ReadonlySet<string> = new Set(["udaan", "free", "starter"]);
export function isBrandedPlan(code: string | null | undefined): boolean {
  return !code || BRANDED_PLANS.has(code);
}
