import { createFileRoute } from "@tanstack/react-router";

/**
 * Dynamic robots.txt. Blocks the app/auth surfaces from crawlers and
 * advertises the sitemap. Public bio pages honour their per-page
 * robotsIndex flag through the rendered <meta name="robots"> tag.
 */
export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const base = `${url.protocol}//${url.host}`;
        const body = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /app/",
          "Disallow: /auth/",
          "Disallow: /onboarding",
          "",
          `Sitemap: ${base}/sitemap.xml`,
          "",
        ].join("\n");
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
