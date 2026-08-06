/**
 * AI Content Studio — generator catalog (LS-13).
 * Expanded suite of AI tools for Bio Pages, Store, Bookings, and Social.
 */

export type GeneratorCategory = 
  | "bio" 
  | "cta" 
  | "section" 
  | "store" 
  | "booking" 
  | "seo" 
  | "social" 
  | "design" 
  | "image"
  | "rewrite";

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

const commonBrandSystem = (brand: string) =>
  [
    "You are ZUPIX AI Studio, an elite bio-page architect and conversion copywriter.",
    "Return only the requested content — no preamble, no markdown fences, no explanations.",
    "Match the brand voice exactly. Never invent facts about the brand.",
    "",
    brand,
  ].join("\n");

// ── BIO GENERATORS ────────────────────────────────────────────────
const BIO_TYPES = [
  { label: "Professional Bio", value: "professional" },
  { label: "Instagram Bio", value: "instagram" },
  { label: "LinkedIn Bio", value: "linkedin" },
  { label: "Company Bio", value: "company" },
  { label: "Brand Bio", value: "brand" },
  { label: "Short Bio", value: "short" },
  { label: "Long Bio", value: "long" },
];

const bioGenerator: GeneratorDef = {
  id: "bio-gen",
  category: "bio",
  name: "AI Bio Generator",
  description: "Generate professional, social, or brand-specific bios.",
  fields: [
    { id: "bioType", label: "Bio Type", kind: "select", options: BIO_TYPES },
    { id: "subject", label: "Name or brand", kind: "text", placeholder: "e.g. Aarav Mehta" },
    { id: "highlights", label: "Highlights", kind: "textarea", placeholder: "Key credentials or story hooks", optional: true },
    { id: "tone", label: "Tone", kind: "select", options: TONE_OPTIONS },
  ],
  buildSystem: commonBrandSystem,
  buildPrompt: (v) => `Write a ${v.bioType} bio for ${v.subject || "the brand"} in a ${v.tone} tone. ${v.highlights ? `Include: ${v.highlights}.` : ""} Return 1-3 variations.`
};

// ── CTA GENERATORS ────────────────────────────────────────────────
const CTA_TYPES = [
  { label: "Call To Action", value: "cta" },
  { label: "Buttons", value: "button" },
  { label: "Headlines", value: "headline" },
  { label: "Hero Titles", value: "hero" },
  { label: "Descriptions", value: "description" },
];

const ctaGenerator: GeneratorDef = {
  id: "cta-gen",
  category: "cta",
  name: "AI CTA Generator",
  description: "High-converting titles, headlines, and action buttons.",
  fields: [
    { id: "ctaType", label: "Type", kind: "select", options: CTA_TYPES },
    { id: "goal", label: "Goal / Offer", kind: "text", placeholder: "e.g. Book a free consultation" },
    { id: "tone", label: "Tone", kind: "select", options: TONE_OPTIONS },
  ],
  buildSystem: commonBrandSystem,
  buildPrompt: (v) => `Generate 5 ${v.ctaType} variations for: ${v.goal}. Tone: ${v.tone}. Return a numbered list.`
};

// ── SECTION GENERATORS ────────────────────────────────────────────
const SECTION_TYPES = [
  { label: "About Section", value: "about" },
  { label: "Services Section", value: "services" },
  { label: "Pricing Section", value: "pricing" },
  { label: "FAQ Section", value: "faq" },
  { label: "Testimonials Section", value: "testimonials" },
  { label: "Contact Section", value: "contact" },
];

const sectionGenerator: GeneratorDef = {
  id: "section-gen",
  category: "section",
  name: "AI Section Generator",
  description: "Generate complete page sections with structured content.",
  fields: [
    { id: "sectionType", label: "Section", kind: "select", options: SECTION_TYPES },
    { id: "details", label: "What should we include?", kind: "textarea", placeholder: "List your services, prices, or key info" },
    { id: "tone", label: "Tone", kind: "select", options: TONE_OPTIONS },
  ],
  buildSystem: commonBrandSystem,
  buildPrompt: (v) => `Generate a complete ${v.sectionType} section. Content details: ${v.details}. Tone: ${v.tone}. Include a Title, Description, and Bullet points where appropriate.`
};

// ── STORE ASSISTANT ───────────────────────────────────────────────
const STORE_TYPES = [
  { label: "Product Title", value: "title" },
  { label: "Product Description", value: "description" },
  { label: "Benefits & Features", value: "benefits" },
  { label: "Pricing Copy", value: "pricing" },
];

const storeAssistant: GeneratorDef = {
  id: "store-gen",
  category: "store",
  name: "AI Store Assistant",
  description: "Generate product titles, descriptions, and commerce copy.",
  fields: [
    { id: "tool", label: "I want to generate...", kind: "select", options: STORE_TYPES },
    { id: "product", label: "Product Name/Type", kind: "text" },
    { id: "features", label: "Key Features", kind: "textarea", placeholder: "What makes it special?" },
  ],
  buildSystem: commonBrandSystem,
  buildPrompt: (v) => `Generate ${v.tool} for a product named "${v.product}". Key features: ${v.features}. Focus on conversion and value.`
};

// ── BOOKING ASSISTANT ─────────────────────────────────────────────
const BOOKING_TYPES = [
  { label: "Consultation Description", value: "consult" },
  { label: "Booking Instructions", value: "instructions" },
  { label: "Thank You Message", value: "thanks" },
  { label: "Confirmation Email", value: "email" },
];

const bookingAssistant: GeneratorDef = {
  id: "booking-gen",
  category: "booking",
  name: "AI Booking Assistant",
  description: "Optimized messages for appointments and consultations.",
  fields: [
    { id: "tool", label: "Message Type", kind: "select", options: BOOKING_TYPES },
    { id: "service", label: "Service Name", kind: "text" },
    { id: "tone", label: "Tone", kind: "select", options: TONE_OPTIONS },
  ],
  buildSystem: commonBrandSystem,
  buildPrompt: (v) => `Write a ${v.tool} for a "${v.service}" service. Tone: ${v.tone}. Keep it clear and helpful.`
};

// ── SEO GENERATOR ─────────────────────────────────────────────────
const seoGenerator: GeneratorDef = {
  id: "seo-gen",
  category: "seo",
  name: "AI SEO",
  description: "Titles, meta descriptions, and keywords for better ranking.",
  fields: [
    { id: "topic", label: "Page Topic", kind: "text" },
    { id: "keywords", label: "Keywords to include", kind: "textarea", optional: true },
  ],
  buildSystem: commonBrandSystem,
  buildPrompt: (v) => `Generate an SEO pack for: ${v.topic}. ${v.keywords ? `Keywords: ${v.keywords}.` : ""} Return: META TITLE (max 60), META DESCRIPTION (max 155), KEYWORDS (comma-separated), OG TITLE, OG DESCRIPTION.`
};

// ── SOCIAL CONTENT ────────────────────────────────────────────────
const SOCIAL_TYPES = [
  { label: "Instagram Caption", value: "instagram" },
  { label: "Facebook Post", value: "facebook" },
  { label: "LinkedIn Post", value: "linkedin" },
  { label: "X (Twitter) Post", value: "twitter" },
  { label: "WhatsApp Promo", value: "whatsapp" },
];

const socialGenerator: GeneratorDef = {
  id: "social-gen",
  category: "social",
  name: "AI Social Content",
  description: "Platform-optimized posts and promotional captions.",
  fields: [
    { id: "platform", label: "Platform", kind: "select", options: SOCIAL_TYPES },
    { id: "topic", label: "Post Topic", kind: "text" },
    { id: "tone", label: "Tone", kind: "select", options: TONE_OPTIONS },
  ],
  buildSystem: commonBrandSystem,
  buildPrompt: (v) => `Write a ${v.platform} post about: ${v.topic}. Tone: ${v.tone}. Include relevant hashtags.`
};

// ── THEME SUGGESTIONS ─────────────────────────────────────────────
const themeSuggestions: GeneratorDef = {
  id: "theme-gen",
  category: "design",
  name: "AI Theme Suggestions",
  description: "Recommended colors, fonts, and layouts based on industry.",
  fields: [
    { id: "industry", label: "Your Industry", kind: "text", placeholder: "e.g. Minimalist Cafe, Tech Startup" },
    { id: "vibe", label: "Brand Vibe", kind: "text", placeholder: "e.g. Modern, Vintage, Corporate" },
  ],
  buildSystem: commonBrandSystem,
  buildPrompt: (v) => `Based on the industry "${v.industry}" and vibe "${v.vibe}", recommend: 1) Primary and Secondary Colors (Hex codes), 2) Font Pairings (Heading/Body), 3) Animation Styles, 4) Recommended Layout.`
};

// ── IMAGE PROMPTS ─────────────────────────────────────────────────
const IMAGE_TYPES = [
  { label: "Logo", value: "logo" },
  { label: "Banner", value: "banner" },
  { label: "Profile Image", value: "profile" },
  { label: "Hero Background", value: "hero" },
];

const imagePrompts: GeneratorDef = {
  id: "image-gen",
  category: "image",
  name: "AI Image Prompts",
  description: "Generate high-quality prompts for AI image generation.",
  fields: [
    { id: "type", label: "Asset Type", kind: "select", options: IMAGE_TYPES },
    { id: "concept", label: "Visual Concept", kind: "textarea", placeholder: "e.g. futuristic city with neon lights" },
  ],
  buildSystem: commonBrandSystem,
  buildPrompt: (v) => `Create 3 detailed DALL-E/Midjourney prompts for a ${v.type}. Concept: ${v.concept}. Styles: realistic, artistic, and abstract.`
};

export const GENERATORS: GeneratorDef[] = [
  bioGenerator,
  ctaGenerator,
  sectionGenerator,
  storeAssistant,
  bookingAssistant,
  seoGenerator,
  socialGenerator,
  themeSuggestions,
  imagePrompts,
];

export function getGenerator(id: string): GeneratorDef | undefined {
  return GENERATORS.find((g) => g.id === id);
}
