import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicBioPage } from "@/features/public/api";
import { PublicBioRenderer } from "@/features/public/public-bio-renderer";
import { PageLoader } from "@/shared/ui/page-loader";
import { APP_CONFIG } from "@/config/app.config";

/**
 * Reserved for multi-page bio websites (LS-08B+).
 * For now, resolves `/:slug/:page` to the sub-page slug only when a bio
 * page with that slug exists; otherwise renders a 404. This keeps the
 * URL surface stable so future phases can layer sub-pages without a
 * breaking route change.
 */
export const Route = createFileRoute("/$slug/$page")({
  ssr: false,
  head: ({ params }) => {
    const baseUrl = "https://zupix.site";
    const profileUrl = `${baseUrl}/${params.slug}/${params.page}`;
    return {
      meta: [
        { title: `@${params.slug}/${params.page} | ${APP_CONFIG.shortName}` },
        { name: "description", content: `Digital profile page for @${params.slug} powered by ${APP_CONFIG.shortName}` },
        { name: "robots", content: "index,follow" },
        { property: "og:title", content: `@${params.slug}/${params.page}` },
        { property: "og:description", content: `View this profile on ${APP_CONFIG.name}` },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: profileUrl },
        { property: "og:image", content: `${baseUrl}/og-fallback.png` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: PublicSubPage,
  notFoundComponent: SubNotFound,
});

function PublicSubPage() {
  const { page } = Route.useParams();
  const { data, isPending, isError } = useQuery({
    queryKey: ["public-bio", page],
    queryFn: () => fetchPublicBioPage(page),
    retry: 2,
    staleTime: 30_000,
  });
  if (isPending) return <PageLoader />;
  // A failed request is a network problem, not a missing page — keep showing
  // the loader instead of flashing a false 404 on flaky mobile connections.
  if (isError) return <PageLoader />;
  if (!data) throw notFound();
  return <PublicBioRenderer content={data.content} pageId={data.id} slug={page} workspaceId={data.workspaceId} />;
}

function SubNotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <h2 className="mt-4 text-lg font-semibold">Page not found</h2>
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
