/**
 * Built-in template catalog (LS-07D).
 *
 * Each template reuses one of the seven core theme presets from
 * `features/builder/theme` and layers on category-specific metadata.
 * Themes are cloned defensively so applying one never mutates the
 * source object.
 */

import { applyPresetTheme, type ThemePresetId } from "@/features/builder/theme";
import type { Template, TemplateCategory, TemplateCategoryId, TemplateStyle } from "./types";

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: "creator", label: "Creator" },
  { id: "business", label: "Business" },
  { id: "minimal", label: "Minimal" },
  { id: "luxury", label: "Luxury" },
  { id: "modern", label: "Modern" },
  { id: "neon", label: "Neon" },
  { id: "glass", label: "Glass" },
  { id: "musician", label: "Musician" },
  { id: "photographer", label: "Photographer" },
  { id: "fitness", label: "Fitness" },
  { id: "coach", label: "Coach" },
  { id: "restaurant", label: "Restaurant" },
  { id: "cafe", label: "Cafe" },
  { id: "fashion", label: "Fashion" },
  { id: "beauty", label: "Beauty" },
  { id: "realestate", label: "Real Estate" },
  { id: "agency", label: "Agency" },
  { id: "consultant", label: "Consultant" },
  { id: "developer", label: "Developer" },
  { id: "designer", label: "Designer" },
  { id: "writer", label: "Writer" },
  { id: "podcaster", label: "Podcaster" },
  { id: "influencer", label: "Influencer" },
  { id: "nonprofit", label: "Nonprofit" },
  { id: "event", label: "Event" },
  { id: "wedding", label: "Wedding" },
  { id: "portfolio", label: "Portfolio" },
  { id: "startup", label: "Startup" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "education", label: "Education" },
  { id: "travel", label: "Travel" },
];

interface BuiltInSpec {
  id: string;
  name: string;
  description: string;
  category: TemplateCategoryId;
  preset: ThemePresetId;
  style: TemplateStyle;
  tags?: string[];
  isPremium?: boolean;
}

const SPECS: BuiltInSpec[] = [
  { id: "aurora-minimal", name: "Aurora Minimal", description: "Editorial, monochrome, calm.", category: "minimal", preset: "minimal", style: "light", tags: ["clean", "editorial"] },
  { id: "boutique-luxe", name: "Boutique Luxe", description: "Deep black with gold typography.", category: "luxury", preset: "luxury", style: "dark", tags: ["premium", "elegant"], isPremium: true },
  { id: "nova-modern", name: "Nova Modern", description: "Bold indigo on cool white.", category: "modern", preset: "modern", style: "light", tags: ["bold", "startup"] },
  { id: "sunset-creator", name: "Sunset Creator", description: "Warm gradient background for creators.", category: "creator", preset: "creator", style: "gradient", tags: ["warm", "gradient"] },
  { id: "corporate-navy", name: "Corporate Navy", description: "Corporate, structured, trustworthy.", category: "business", preset: "business", style: "light", tags: ["corporate", "b2b"] },
  { id: "cyber-neon", name: "Cyber Neon", description: "Cyberpunk pinks and cyans that glow.", category: "neon", preset: "neon", style: "neon", tags: ["gaming", "vibrant"], isPremium: true },
  { id: "frosted-glass", name: "Frosted Glass", description: "Soft gradient with frosted cards.", category: "glass", preset: "glass", style: "glass", tags: ["airy", "modern"] },

  { id: "vinyl-musician", name: "Vinyl", description: "Moody dark stage for musicians.", category: "musician", preset: "neon", style: "dark", tags: ["music", "gig"] },
  { id: "gallery-photographer", name: "Gallery", description: "Minimal frame for photographers.", category: "photographer", preset: "minimal", style: "light", tags: ["portfolio"] },
  { id: "iron-fitness", name: "Iron", description: "High-contrast for fitness coaches.", category: "fitness", preset: "modern", style: "light", tags: ["gym", "trainer"] },
  { id: "mentor-coach", name: "Mentor", description: "Warm, approachable palette for coaches.", category: "coach", preset: "creator", style: "gradient", tags: ["mentor"] },
  { id: "trattoria", name: "Trattoria", description: "Editorial menu-style for restaurants.", category: "restaurant", preset: "luxury", style: "dark", tags: ["menu", "food"], isPremium: true },
  { id: "roastery", name: "Roastery", description: "Cozy palette for cafes.", category: "cafe", preset: "creator", style: "gradient", tags: ["coffee", "menu"] },
  { id: "runway", name: "Runway", description: "High-fashion editorial spread.", category: "fashion", preset: "luxury", style: "dark", tags: ["fashion"], isPremium: true },
  { id: "aura-beauty", name: "Aura", description: "Soft glass palette for beauty brands.", category: "beauty", preset: "glass", style: "glass", tags: ["beauty", "salon"] },
  { id: "keystone-realestate", name: "Keystone", description: "Trusted corporate look for realtors.", category: "realestate", preset: "business", style: "light", tags: ["listings"] },
  { id: "studio-agency", name: "Studio", description: "Confident modern palette for agencies.", category: "agency", preset: "modern", style: "light", tags: ["agency"] },
  { id: "advisor-consultant", name: "Advisor", description: "Structured business look for consultants.", category: "consultant", preset: "business", style: "light", tags: ["b2b"] },
  { id: "terminal-dev", name: "Terminal", description: "Neon accents for developers.", category: "developer", preset: "neon", style: "neon", tags: ["dev", "portfolio"] },
  { id: "canvas-designer", name: "Canvas", description: "Soft glass for designers.", category: "designer", preset: "glass", style: "glass", tags: ["design", "portfolio"] },
  { id: "quill-writer", name: "Quill", description: "Editorial serif for writers.", category: "writer", preset: "luxury", style: "dark", tags: ["blog", "editorial"], isPremium: true },
  { id: "waveform-podcaster", name: "Waveform", description: "Bold modern look for podcasters.", category: "podcaster", preset: "modern", style: "light", tags: ["podcast"] },
  { id: "spotlight-influencer", name: "Spotlight", description: "Warm gradient made for influencers.", category: "influencer", preset: "creator", style: "gradient", tags: ["creator"] },
  { id: "cause-nonprofit", name: "Cause", description: "Clean minimal for nonprofits.", category: "nonprofit", preset: "minimal", style: "light", tags: ["nonprofit"] },
  { id: "encore-event", name: "Encore", description: "Neon promo for events.", category: "event", preset: "neon", style: "neon", tags: ["event", "party"] },
  { id: "vows-wedding", name: "Vows", description: "Elegant glass for weddings.", category: "wedding", preset: "glass", style: "glass", tags: ["wedding"], isPremium: true },
  { id: "folio-portfolio", name: "Folio", description: "Minimal editorial portfolio.", category: "portfolio", preset: "minimal", style: "light", tags: ["portfolio"] },
  { id: "launch-startup", name: "Launch", description: "Bold modern palette for startups.", category: "startup", preset: "modern", style: "light", tags: ["startup"] },
  { id: "shopfront-ecom", name: "Shopfront", description: "Business palette for e-commerce.", category: "ecommerce", preset: "business", style: "light", tags: ["shop"] },
  { id: "campus-education", name: "Campus", description: "Trusted look for educators.", category: "education", preset: "business", style: "light", tags: ["education"] },
  { id: "wander-travel", name: "Wander", description: "Warm gradient for travel creators.", category: "travel", preset: "creator", style: "gradient", tags: ["travel"] },
];

export const BUILTIN_TEMPLATES: Template[] = SPECS.map((s) => ({
  id: s.id,
  version: 1,
  name: s.name,
  description: s.description,
  category: s.category,
  tags: s.tags,
  style: s.style,
  isPremium: s.isPremium,
  isCustom: false,
  theme: applyPresetTheme(s.preset),
}));

export function getBuiltInTemplate(id: string): Template | undefined {
  return BUILTIN_TEMPLATES.find((t) => t.id === id);
}
