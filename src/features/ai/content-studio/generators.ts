/**
 * AI Content Studio — generator catalog (LS-12B).
 * Declarative definitions used by the studio UI. Each generator
 * produces a system prompt and a user prompt from typed inputs.
 */

export type GeneratorCategory = "bio" | "cta" | "social" | "seo" | "button" | "rewrite";

export interface GeneratorField {
  id: string;
  label: string;
  kind: "text" | "textarea" | "select";
  placeholder?: string;
  options?: { label: string; value: string }[];
  optional?: boolean;
}

export interface GeneratorDef {
  id: string;
  category: GeneratorCategory;
  name: string;
  description: string;
  fields: GeneratorField[];
  buildSystem: (brandContext: string) => string;
  buildPrompt: (values: Record<string, string>) => string;
}

const TONE_OPTIONS = [
  { label: "Professional", value: "professional" },
  { label: "Friendly", value: "friendly" },
  { label: "Luxury", value: "luxury" },
  { label: "Playful", value: "playful" },
  { label: "Confident", value: "confident" },
  { label: "Empathetic", value: "empathetic" },
];

const LENGTH_OPTIONS = [
  { label: "Short", value: "short" },
  { label: "Medium", value: "medium" },
  { label: "Long", value: "long" },
];

const commonBrandSystem = (brand: string) =>
  [
    "You are ZUPIX AI Content Studio, an elite bio-page copywriter.",
    "Return only the requested content — no preamble, no markdown fences, no explanations.",
    "Match the brand voice exactly. Never invent facts about the brand.",
    "",
    brand,
  ].join("\n");

// ── BIO WRITER ─────────────────────────────────────────────────────
const BIO_TYPES = [
  { label: "Professional Bio", value: "professional" },
  { label: "Creator Bio", value: "creator" },
  { label: "Business Bio", value: "business" },
  { label: "Agency Bio", value: "agency" },
  { label: "Startup Bio", value: "startup" },
  { label: "Personal Bio", value: "personal" },
];

const bioWriter: GeneratorDef = {
  id: "bio-writer",
  category: "bio",
  name: "Bio Writer",
  description: "Generate professional, creator, business, agency, startup, or personal bios.",
  fields: [
    { id: "bioType", label: "Bio type", kind: "select", options: BIO_TYPES },
    { id: "subject", label: "Name or brand", kind: "text", placeholder: "e.g. Aarav Mehta" },
    { id: "role", label: "Role / niche", kind: "text", placeholder: "e.g. Wedding photographer" },
    {
      id: "highlights",
      label: "Highlights or achievements",
      kind: "textarea",
      placeholder: "Key wins, credentials, or story hooks",
      optional: true,
    },
    { id: "tone", label: "Tone", kind: "select", options: TONE_OPTIONS },
    { id: "length", label: "Length", kind: "select", options: LENGTH_OPTIONS },
  ],
  buildSystem: commonBrandSystem,
  buildPrompt: (v) =>
    [
      `Write a ${v.length} ${v.bioType} bio in a ${v.tone} tone.`,
      `Subject: ${v.subject || "the brand"}.`,
      v.role ? `Role: ${v.role}.` : "",
      v.highlights ? `Highlights: ${v.highlights}.` : "",
      "Constraints: no emoji spam, no clichés, first-person unless the bio type is 'business/agency/startup'. Return 1-3 short paragraphs.",
    ]
      .filter(Boolean)
      .join("\n"),
};

// ── CTA GENERATOR ──────────────────────────────────────────────────
const CTA_TYPES = [
  { label: "WhatsApp CTA", value: "whatsapp" },
  { label: "Book Now CTA", value: "book" },
  { label: "Buy Now CTA", value: "buy" },
  { label: "Contact CTA", value: "contact" },
  { label: "Portfolio CTA", value: "portfolio" },
  { label: "Subscribe CTA", value: "subscribe" },
  { label: "Donation CTA", value: "donation" },
  { label: "Custom CTA", value: "custom" },
];

const ctaWriter: GeneratorDef = {
  id: "cta-writer",
  category: "cta",
  name: "CTA Generator",
  description: "High-converting call-to-action headlines and button copy.",
  fields: [
    { id: "ctaType", label: "CTA type", kind: "select", options: CTA_TYPES },
    { id: "goal", label: "Goal or offer", kind: "text", placeholder: "e.g. Book a free 30-min call" },
    { id: "audience", label: "Target audience", kind: "text", placeholder: "e.g. small business owners", optional: true },
    { id: "tone", label: "Tone", kind: "select", options: TONE_OPTIONS },
  ],
  buildSystem: commonBrandSystem,
  buildPrompt: (v) =>
    [
      `Generate 5 ${v.ctaType} CTA variations in a ${v.tone} tone.`,
      `Goal: ${v.goal || "drive action"}.`,
      v.audience ? `Audience: ${v.audience}.` : "",
      "For each variation return: HEADLINE — SUBTEXT — BUTTON LABEL. Numbered list only.",
    ]
      .filter(Boolean)
      .join("\n"),
};

// ── SOCIAL CONTENT ────────────────────────────────────────────────
const SOCIAL_PLATFORMS = [
  { label: "Instagram Bio", value: "instagram" },
  { label: "X (Twitter) Bio", value: "twitter" },
  { label: "LinkedIn Headline", value: "linkedin" },
  { label: "Facebook About", value: "facebook" },
  { label: "YouTube Description", value: "youtube" },
  { label: "TikTok Bio", value: "tiktok" },
];

const socialWriter: GeneratorDef = {
  id: "social-writer",
  category: "social",
  name: "Social Content",
  description: "Platform-optimized bios and profile descriptions.",
  fields: [
    { id: "platform", label: "Platform", kind: "select", options: SOCIAL_PLATFORMS },
    { id: "subject", label: "Name or brand", kind: "text" },
    { id: "niche", label: "Niche or industry", kind: "text" },
    { id: "keywords", label: "Keywords / hooks", kind: "textarea", optional: true },
    { id: "tone", label: "Tone", kind: "select", options: TONE_OPTIONS },
  ],
  buildSystem: commonBrandSystem,
  buildPrompt: (v) => {
    const limits: Record<string, string> = {
      instagram: "under 150 characters, up to 3 line breaks, emoji allowed",
      twitter: "under 160 characters",
      linkedin: "under 220 characters, professional",
      facebook: "under 250 characters",
      youtube: "3 short paragraphs, keyword-rich, include a CTA",
      tiktok: "under 80 characters, punchy, emoji allowed",
    };
    return [
      `Write 3 variations of a ${v.platform} profile in a ${v.tone} tone.`,
      `Subject: ${v.subject || "the brand"}. Niche: ${v.niche || "n/a"}.`,
      v.keywords ? `Include these keywords/hooks: ${v.keywords}.` : "",
      `Constraints: ${limits[v.platform] ?? "concise and on-brand"}.`,
      "Return a numbered list, one variation per item.",
    ]
      .filter(Boolean)
      .join("\n");
  },
};

// ── SEO CONTENT ────────────────────────────────────────────────────
const seoWriter: GeneratorDef = {
  id: "seo-writer",
  category: "seo",
  name: "SEO Content",
  description: "Titles, meta descriptions, keywords and Open Graph copy.",
  fields: [
    { id: "pageTopic", label: "Page topic", kind: "text", placeholder: "e.g. Wedding photographer in Mumbai" },
    { id: "audience", label: "Audience", kind: "text", optional: true },
    { id: "keywords", label: "Seed keywords", kind: "textarea", optional: true },
  ],
  buildSystem: commonBrandSystem,
  buildPrompt: (v) =>
    [
      `Generate an SEO content pack for: ${v.pageTopic}.`,
      v.audience ? `Audience: ${v.audience}.` : "",
      v.keywords ? `Seed keywords: ${v.keywords}.` : "",
      "",
      "Return exactly these labeled sections, one per line group:",
      "SEO TITLE: (max 60 chars)",
      "META DESCRIPTION: (max 155 chars)",
      "KEYWORDS: (comma-separated, 8-12)",
      "OG TITLE: (max 60 chars)",
      "OG DESCRIPTION: (max 200 chars)",
    ]
      .filter(Boolean)
      .join("\n"),
};

// ── BUTTON TEXT ────────────────────────────────────────────────────
const buttonWriter: GeneratorDef = {
  id: "button-writer",
  category: "button",
  name: "Button Text",
  description: "Concise, high-intent button labels for any purpose.",
  fields: [
    { id: "purpose", label: "Button purpose", kind: "text", placeholder: "e.g. Book a free consultation" },
    { id: "audience", label: "Audience", kind: "text", optional: true },
    { id: "tone", label: "Tone", kind: "select", options: TONE_OPTIONS },
  ],
  buildSystem: commonBrandSystem,
  buildPrompt: (v) =>
    [
      `Generate 8 optimized button labels for: ${v.purpose}.`,
      v.audience ? `Audience: ${v.audience}.` : "",
      `Tone: ${v.tone}. Max 4 words each. Return a numbered list only.`,
    ]
      .filter(Boolean)
      .join("\n"),
};

// ── REWRITE TOOLS ─────────────────────────────────────────────────
const REWRITE_ACTIONS = [
  { label: "Rewrite", value: "rewrite" },
  { label: "Grammar Fix", value: "grammar" },
  { label: "Professional Tone", value: "professional" },
  { label: "Friendly Tone", value: "friendly" },
  { label: "Luxury Tone", value: "luxury" },
  { label: "Shorten", value: "shorten" },
  { label: "Expand", value: "expand" },
  { label: "Translate", value: "translate" },
];

const rewriteWriter: GeneratorDef = {
  id: "rewrite",
  category: "rewrite",
  name: "Rewrite Tools",
  description: "Rewrite, fix, shorten, expand, or translate any text.",
  fields: [
    { id: "action", label: "Action", kind: "select", options: REWRITE_ACTIONS },
    { id: "text", label: "Original text", kind: "textarea", placeholder: "Paste text to transform" },
    { id: "language", label: "Language (for translate)", kind: "text", optional: true, placeholder: "e.g. Spanish" },
  ],
  buildSystem: commonBrandSystem,
  buildPrompt: (v) => {
    const map: Record<string, string> = {
      rewrite: "Rewrite the following text keeping the meaning but improving clarity and flow.",
      grammar: "Fix grammar, spelling and punctuation in the following text. Keep the original voice.",
      professional: "Rewrite the following text in a professional tone.",
      friendly: "Rewrite the following text in a warm, friendly tone.",
      luxury: "Rewrite the following text in an elegant, premium luxury tone.",
      shorten: "Shorten the following text by ~40% while preserving the key message.",
      expand: "Expand the following text with more detail and vivid language, ~2x the length.",
      translate: `Translate the following text to ${v.language || "English"}. Preserve tone and formatting.`,
    };
    return [map[v.action] || map.rewrite, "", v.text || ""].join("\n");
  },
};

export const GENERATORS: GeneratorDef[] = [
  bioWriter,
  ctaWriter,
  socialWriter,
  seoWriter,
  buttonWriter,
  rewriteWriter,
];

export function getGenerator(id: string): GeneratorDef | undefined {
  return GENERATORS.find((g) => g.id === id);
}
