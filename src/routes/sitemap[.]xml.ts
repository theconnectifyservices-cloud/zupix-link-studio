import { createFileRoute } from "@tanstack/react-router";
import { listIndexableSlugs } from "@/features/public/api";

/**
 * Dynamic XML sitemap. Includes only public + indexable published pages.
 * Base URL is derived from the request host, so this works on preview,
 * production, and custom domains without hard-coding.
 */
export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const base = `${url.protocol}//${url.host}`;

        let entries: { slug: string; updated_at: string; published_at: string | null }[] = [];
        try {
          entries = await listIndexableSlugs();
        } catch {
          entries = [];
        }

        const urls = [
          `  <url><loc>${base}/</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
          ...entries.map((e) => {
            const lastmod = (e.updated_at || e.published_at || "").split("T")[0];
            return [
              `  <url>`,
              `    <loc>${base}/${e.slug}</loc>`,
              lastmod ? `    <lastmod>${lastmod}</lastmod>` : "",
              `    <changefreq>weekly</changefreq>`,
              `    <priority>0.8</priority>`,
              `  </url>`,
            ]
              .filter(Boolean)
              .join("\n");
          }),
        ];

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
