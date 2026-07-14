import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicBioPage } from "@/features/public/api";
import { PublicBioRenderer } from "@/features/public/public-bio-renderer";
import { PageLoader } from "@/shared/ui/page-loader";

/**
 * Reserved for multi-page bio websites (LS-08B+).
 * For now, resolves `/:slug/:page` to the sub-page slug only when a bio
 * page with that slug exists; otherwise renders a 404. This keeps the
 * URL surface stable so future phases can layer sub-pages without a
 * breaking route change.
 */
export const Route = createFileRoute("/$slug/$page")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `@${params.slug}/${params.page}` },
      { name: "robots", content: "index,follow" },
    ],
  }),
  component: PublicSubPage,
  notFoundComponent: SubNotFound,
});

function PublicSubPage() {
  const { page } = Route.useParams();
  const { data, isLoading } = useQuery({
    queryKey: ["public-bio", page],
    queryFn: () => fetchPublicBioPage(page),
    retry: 1,
    staleTime: 30_000,
  });
  if (isLoading) return <PageLoader />;
  if (!data) throw notFound();
  return <PublicBioRenderer content={data.content} />;
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
