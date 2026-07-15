/**
 * Industry prompt templates for the AI Content Studio (LS-12B).
 * Ready-made starting points that pre-fill generator inputs.
 */
import type { GeneratorCategory } from "./generators";

export interface IndustryTemplate {
  id: string;
  industry: string;
  label: string;
  description: string;
  generatorId: string;
  category: GeneratorCategory;
  values: Record<string, string>;
}

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  {
    id: "creator-bio",
    industry: "Creators",
    label: "Creator personal bio",
    description: "Short punchy bio for creators, influencers, and artists.",
    generatorId: "bio-writer",
    category: "bio",
    values: { bioType: "creator", tone: "playful", length: "short" },
  },
  {
    id: "creator-ig",
    industry: "Creators",
    label: "Instagram bio for creators",
    description: "Optimized IG bio with hooks and CTA.",
    generatorId: "social-writer",
    category: "social",
    values: { platform: "instagram", tone: "playful" },
  },
  {
    id: "business-about",
    industry: "Businesses",
    label: "Business about section",
    description: "Trust-building business bio.",
    generatorId: "bio-writer",
    category: "bio",
    values: { bioType: "business", tone: "professional", length: "medium" },
  },
  {
    id: "business-cta",
    industry: "Businesses",
    label: "Book Now CTA",
    description: "Direct booking CTA copy.",
    generatorId: "cta-writer",
    category: "cta",
    values: { ctaType: "book", tone: "confident" },
  },
  {
    id: "doctor-bio",
    industry: "Doctors",
    label: "Doctor / clinician bio",
    description: "Credible medical bio focused on expertise and care.",
    generatorId: "bio-writer",
    category: "bio",
    values: { bioType: "professional", tone: "empathetic", length: "medium" },
  },
  {
    id: "doctor-cta",
    industry: "Doctors",
    label: "Appointment WhatsApp CTA",
    description: "Warm WhatsApp CTA for appointment requests.",
    generatorId: "cta-writer",
    category: "cta",
    values: { ctaType: "whatsapp", tone: "empathetic" },
  },
  {
    id: "lawyer-bio",
    industry: "Lawyers",
    label: "Legal professional bio",
    description: "Authoritative legal bio.",
    generatorId: "bio-writer",
    category: "bio",
    values: { bioType: "professional", tone: "professional", length: "medium" },
  },
  {
    id: "lawyer-seo",
    industry: "Lawyers",
    label: "Legal practice SEO pack",
    description: "SEO title, meta, and OG for a legal landing page.",
    generatorId: "seo-writer",
    category: "seo",
    values: {},
  },
  {
    id: "restaurant-bio",
    industry: "Restaurants",
    label: "Restaurant business bio",
    description: "Appetizing restaurant description.",
    generatorId: "bio-writer",
    category: "bio",
    values: { bioType: "business", tone: "friendly", length: "short" },
  },
  {
    id: "restaurant-cta",
    industry: "Restaurants",
    label: "Reserve a table CTA",
    description: "Reservation-oriented CTA.",
    generatorId: "cta-writer",
    category: "cta",
    values: { ctaType: "book", tone: "friendly" },
  },
  {
    id: "coach-bio",
    industry: "Coaches",
    label: "Coach / mentor bio",
    description: "Personal, aspirational coach bio.",
    generatorId: "bio-writer",
    category: "bio",
    values: { bioType: "personal", tone: "empathetic", length: "medium" },
  },
  {
    id: "coach-cta",
    industry: "Coaches",
    label: "Book discovery call CTA",
    description: "Discovery call CTA copy.",
    generatorId: "cta-writer",
    category: "cta",
    values: { ctaType: "book", tone: "empathetic" },
  },
  {
    id: "freelancer-bio",
    industry: "Freelancers",
    label: "Freelancer portfolio bio",
    description: "Portfolio-forward freelancer bio.",
    generatorId: "bio-writer",
    category: "bio",
    values: { bioType: "personal", tone: "confident", length: "short" },
  },
  {
    id: "freelancer-cta",
    industry: "Freelancers",
    label: "Get a quote CTA",
    description: "Quote-request CTA.",
    generatorId: "cta-writer",
    category: "cta",
    values: { ctaType: "contact", tone: "confident" },
  },
  {
    id: "agency-bio",
    industry: "Agencies",
    label: "Agency capabilities bio",
    description: "Punchy agency overview.",
    generatorId: "bio-writer",
    category: "bio",
    values: { bioType: "agency", tone: "confident", length: "medium" },
  },
  {
    id: "agency-cta",
    industry: "Agencies",
    label: "Book a strategy call CTA",
    description: "Strategy-call CTA.",
    generatorId: "cta-writer",
    category: "cta",
    values: { ctaType: "book", tone: "professional" },
  },
  {
    id: "startup-bio",
    industry: "Startups",
    label: "Startup story bio",
    description: "Founder-driven startup bio.",
    generatorId: "bio-writer",
    category: "bio",
    values: { bioType: "startup", tone: "confident", length: "medium" },
  },
  {
    id: "startup-cta",
    industry: "Startups",
    label: "Join waitlist CTA",
    description: "Waitlist / early-access CTA.",
    generatorId: "cta-writer",
    category: "cta",
    values: { ctaType: "subscribe", tone: "playful" },
  },
];

export function templatesByIndustry(): Record<string, IndustryTemplate[]> {
  return INDUSTRY_TEMPLATES.reduce<Record<string, IndustryTemplate[]>>((acc, t) => {
    (acc[t.industry] ||= []).push(t);
    return acc;
  }, {});
}
