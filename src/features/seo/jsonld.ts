import type { SeoSettings } from "./types";

export interface JsonLdCtx {
  pageName?: string;
  title?: string;
  description?: string;
  url: string;
  image?: string;
  siteName?: string;
}

/**
 * Build Schema.org JSON-LD for the page based on the selected schema type.
 * Returned object is serialised into a `<script type="application/ld+json">`.
 */
export function buildJsonLd(seo: SeoSettings, ctx: JsonLdCtx): Record<string, unknown> {
  const base = {
    "@context": "https://schema.org",
    name: seo.title || ctx.title || ctx.pageName,
    description: seo.description || ctx.description,
    url: seo.canonicalUrl || ctx.url,
    image: seo.ogImage || ctx.image,
  };
  switch (seo.schemaType ?? "ProfilePage") {
    case "Person":
      return {
        ...base,
        "@type": "Person",
        jobTitle: seo.schemaJobTitle,
        worksFor: seo.schemaOrganization
          ? { "@type": "Organization", name: seo.schemaOrganization }
          : undefined,
      };
    case "Organization":
      return {
        ...base,
        "@type": "Organization",
        telephone: seo.schemaPhone,
        address: seo.schemaAddress,
      };
    case "LocalBusiness":
      return {
        ...base,
        "@type": "LocalBusiness",
        telephone: seo.schemaPhone,
        address: seo.schemaAddress,
      };
    case "WebSite":
      return { ...base, "@type": "WebSite" };
    case "ProfilePage":
    default:
      return {
        ...base,
        "@type": "ProfilePage",
        mainEntity: {
          "@type": "Person",
          name: seo.author || ctx.pageName,
          url: ctx.url,
          image: seo.ogImage || ctx.image,
        },
      };
  }
}
