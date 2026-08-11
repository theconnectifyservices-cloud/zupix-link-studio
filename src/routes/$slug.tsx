import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { fetchPublicBioPage, type PublicBioPage } from "@/features/public/api";
import { PublicBioRenderer } from "@/features/public/public-bio-renderer";
import { buildJsonLd } from "@/features/seo/jsonld";
import { APP_CONFIG } from "@/config/app.config";
import { getOgMetadata } from "@/lib/og-metadata.functions";

/** Normalize the incoming slug: URL-decode, trim, strip trailing slash, lowercase. */
function normalizeSlug(raw: string): string {
  let s = raw;
  try {
    s = decodeURIComponent(raw);
  } catch {
    /* malformed escape — use raw */
  }
  return s.trim().replace(/^\/+|\/+$/g, "").toLowerCase();
}

const bioQuery = (slug: string) =>
  queryOptions({
    queryKey: ["public-bio", normalizeSlug(slug)],
    queryFn: () => fetchPublicBioPage(normalizeSlug(slug)),
    // Always refetch so a freshly published change appears immediately on the
    // live URL — no stale window between publish and visible update.
    staleTime: 0,
    // Keep the SSR-hydrated payload around; gcTime 0 dropped it during
    // hydration and forced a cold refetch that 404'd on flaky mobile networks.
    gcTime: 5 * 60_000,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
    retry: 2,
  });

const RESERVED_SLUGS = new Set([
  "admin",
  "app",
  "auth",
  "pricing",
  "features",
  "ecosystem",
  "dashboard",
  "login",
  "signup",
  "onboarding",
  "api",
  "auth",
  "index",
  "",
]);



export const Route = createFileRoute("/$slug")({
  loader: async ({ params, context }) => {
    const slug = normalizeSlug(params.slug);
    
    // Explicitly reject reserved system paths to avoid routing hijacking
    if (RESERVED_SLUGS.has(slug)) {
      throw notFound();
    }

    const page = await context.queryClient.ensureQueryData(bioQuery(slug));
    if (!page) throw notFound();
    return { page };
  },
  head: ({ params, loaderData }) => {
    const page = loaderData?.page as PublicBioPage | undefined;
    if (!page) {
      return {
        meta: [
          { title: `@${params.slug} — not found` },
          { name: "robots", content: "noindex,nofollow" },
        ],
      };
    }

    const head = buildHead(page, params.slug);
    
    // Inject dynamic OG metadata for social crawlers (LS-OG-FIX)
    // We prioritize actual user content resolved in buildHead, 
    // but ensure absolute URLs and profile types.
    const baseUrl = "https://zupix.site"; // Hardcoded for OG stability as per request
    const profileUrl = `${baseUrl}/${params.slug}`;
    
    // Find existing OG/Twitter meta and ensure they are correct
    const meta = head.meta.map(m => {
      if (m.property === "og:url") return { property: "og:url", content: profileUrl };
      if (m.property === "og:type") return { property: "og:type", content: "profile" };
      return m;
    });

    // Ensure twitter:card is summary_large_image
    if (!meta.find(m => m.name === "twitter:card")) {
      meta.push({ name: "twitter:card", content: "summary_large_image" });
    }

    return {
      ...head,
      meta
    };
  },
  component: PublicBioPage,
  notFoundComponent: PageNotFound,
  errorComponent: PageError,
});

function PublicBioPage() {
  const { slug } = Route.useParams();
  const loaderData = Route.useLoaderData() as { page: PublicBioPage } | undefined;
  const { data } = useSuspenseQuery(bioQuery(slug));
  // Never let a client-side refetch hiccup (flaky mobile radio, expired token,
  // service-worker offline) erase a page the server already resolved.
  const page = data ?? loaderData?.page;
  if (!page) throw notFound();
  return <PublicBioRenderer content={page.content} pageId={page.id} slug={slug} workspaceId={page.workspaceId} pageName={page.name} pageDescription={page.description} />;
}

function buildHead(page: PublicBioPage, slug: string) {
  const content = page.content as any;
  const profileBlock = content?.blocks?.find((b: any) => b.type === "profile");
  
  const seo = page.seo ?? {};
  const title = seo.title || profileBlock?.displayName || page.name || `@${slug}`;
  const description =
    seo.description || profileBlock?.bio || page.description || `Digital profile powered by ${APP_CONFIG.shortName}`;
  const url = seo.canonicalUrl || `https://zupix.site/${slug}`;
  
  const ogTitle = seo.ogTitle || title;
  const ogDesc = seo.ogDescription || description;
  
  // Image priority: SEO > Avatar > Cover > Fallback
  const fallbackOg = "https://zupix.site/og-fallback.png"; // Defined fallback
  const ogImage = seo.ogImage || profileBlock?.avatarUrl || profileBlock?.coverUrl || fallbackOg;
  
  const twTitle = seo.twitterTitle || ogTitle;
  const twDesc = seo.twitterDescription || ogDesc;
  const twImage = seo.twitterImage || ogImage;
  const robots = `${seo.robotsIndex === false ? "noindex" : "index"},${
    seo.robotsFollow === false ? "nofollow" : "follow"
  }`;
  const lang = seo.language || "en";

  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { name: "robots", content: robots },
    { httpEquiv: "content-language", content: lang },
    { property: "og:title", content: ogTitle },
    { property: "og:description", content: ogDesc },
    { property: "og:type", content: seo.ogType || "profile" },
    { property: "og:url", content: seo.ogUrl || url },
    { property: "og:site_name", content: seo.ogSiteName || APP_CONFIG.shortName },
    { name: "twitter:card", content: seo.twitterCard || "summary_large_image" },
    { name: "twitter:title", content: twTitle },
    { name: "twitter:description", content: twDesc },
  ];
  if (seo.author) meta.push({ name: "author", content: seo.author });
  if (seo.keywords && seo.keywords.length)
    meta.push({ name: "keywords", content: seo.keywords.join(", ") });
  if (ogImage) meta.push({ property: "og:image", content: ogImage });
  if (twImage) meta.push({ name: "twitter:image", content: twImage });
  if (seo.twitterSite) meta.push({ name: "twitter:site", content: seo.twitterSite });
  if (seo.twitterCreator) meta.push({ name: "twitter:creator", content: seo.twitterCreator });

  const links: Array<Record<string, string>> = [{ rel: "canonical", href: url }];
  if (page.faviconUrl) links.push({ rel: "icon", href: page.faviconUrl });
  if (page.appleTouchIconUrl)
    links.push({ rel: "apple-touch-icon", href: page.appleTouchIconUrl });

  const jsonLd = buildJsonLd(seo, {
    title,
    description,
    url,
    image: ogImage,
    siteName: seo.ogSiteName || APP_CONFIG.shortName,
    pageName: page.name,
  });

  return {
    meta,
    links,
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(jsonLd),
      },
    ],
  };
}

function PageNotFound() {
  const { slug } = Route.useParams();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-lg font-semibold">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          No bio page exists at <span className="font-mono">/{slug}</span>.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}

function PageError({ error }: { error: Error }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">This page couldn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      </div>
    </div>
  );
}
