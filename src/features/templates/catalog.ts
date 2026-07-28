/**
 * Built-in template catalog.
 * Sourced from the pluggable definitions registry so new themes drop
 * in without editing this file.
 */

import { REGISTRY_TEMPLATES } from "./definitions";
import type { Template, TemplateCategory } from "./types";

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: "creator", label: "Creator" },
  { id: "business", label: "Business" },
  { id: "corporate", label: "Corporate" },
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
  { id: "gaming", label: "Gaming" },
  { id: "ai", label: "AI" },
  { id: "personal", label: "Personal" },
  { id: "doctor", label: "Doctor" },
];

export const BUILTIN_TEMPLATES: Template[] = REGISTRY_TEMPLATES;

export function getBuiltInTemplate(id: string): Template | undefined {
  return BUILTIN_TEMPLATES.find((t) => t.id === id);
}
