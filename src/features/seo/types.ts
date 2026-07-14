/**
 * Per-page SEO settings persisted as a single JSONB column on `bio_pages`.
 * Everything is optional — the render layer falls back to sensible defaults
 * (page name, description, workspace) when a field is unset.
 */
export type OgType = "website" | "profile" | "article" | "product";
export type TwitterCard = "summary" | "summary_large_image";
export type SchemaType = "Person" | "Organization" | "LocalBusiness" | "WebSite" | "ProfilePage";

export interface SeoSettings {
  /** Search — <title> and description */
  title?: string;
  description?: string;
  keywords?: string[];
  canonicalUrl?: string;
  author?: string;
  language?: string; // BCP-47, e.g. "en", "en-US"
  robotsIndex?: boolean; // default true
  robotsFollow?: boolean; // default true

  /** Open Graph */
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  ogType?: OgType;
  ogSiteName?: string;

  /** Twitter / X */
  twitterCard?: TwitterCard;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string; // @handle
  twitterCreator?: string;

  /** Structured data */
  schemaType?: SchemaType;
  schemaJobTitle?: string;
  schemaOrganization?: string;
  schemaAddress?: string;
  schemaPhone?: string;
}

export const DEFAULT_SEO: SeoSettings = {
  language: "en",
  robotsIndex: true,
  robotsFollow: true,
  ogType: "website",
  twitterCard: "summary_large_image",
  schemaType: "ProfilePage",
};
