/**
 * AI Studio — industry-specific starter kits.
 */
import { type GeneratorCategory } from "./generators";

export interface PromptTemplate {
  id: string;
  category: GeneratorCategory;
  generatorId: string;
  label: string;
  description: string;
  values: Record<string, string>;
  industry: string;
}

export const INDUSTRY_TEMPLATES: PromptTemplate[] = [
  {
    id: "real-estate-bio",
    industry: "Real Estate",
    category: "bio",
    generatorId: "bio-gen",
    label: "Property Expert Bio",
    description: "Authority-driven bio for agents.",
    values: {
      bioType: "professional",
      subject: "Luxe Realty",
      highlights: "10+ years in Mumbai luxury market, 500+ successful closures.",
      tone: "professional",
    },
  },
  {
    id: "rest-cta",
    industry: "Restaurant",
    category: "cta",
    generatorId: "cta-gen",
    label: "Dining Reservations",
    description: "High-conversion table booking CTAs.",
    values: {
      ctaType: "cta",
      goal: "Reserve a table for weekend brunch",
      tone: "friendly",
    },
  },
  {
    id: "tech-seo",
    industry: "Technology",
    category: "seo",
    generatorId: "seo-gen",
    label: "SaaS SEO Pack",
    description: "Optimized meta tags for software products.",
    values: {
      topic: "Cloud-based project management for remote teams",
      keywords: "productivity, collaboration, kanban, remote work",
    },
  },
];

export function templatesByIndustry(): Record<string, PromptTemplate[]> {
  const industries: Record<string, PromptTemplate[]> = {};
  for (const t of INDUSTRY_TEMPLATES) {
    if (!industries[t.industry]) industries[t.industry] = [];
    industries[t.industry].push(t);
  }
  return industries;
}
