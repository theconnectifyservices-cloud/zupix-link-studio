import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { fetchPublicBioPage } from "@/features/public/api";
import { PublicBioRenderer } from "@/features/public/public-bio-renderer";
import { PageLoader } from "@/shared/ui/page-loader";

export const Route = createFileRoute("/$slug")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `@${params.slug}` },
      { name: "robots", content: "index,follow" },
      { property: "og:title", content: `@${params.slug}` },
      { property: "og:type", content: "profile" },
    ],
  }),
  component: PublicBioPage,
  notFoundComponent: PageNotFound,
  errorComponent: PageError,
});

function PublicBioPage() {
  const { slug } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["public-bio", slug],
    queryFn: () => fetchPublicBioPage(slug),
    retry: 1,
    staleTime: 30_000,
  });

  if (isLoading) return <PageLoader />;
  if (error) throw error;
  if (!data) throw notFound();

  return <PublicBioRenderer content={data.content} />;
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
