import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Link2, Images, BarChart3, ArrowRight, Sparkles, Clock, Rocket } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/features/auth/hooks/use-session";
import { useProfile } from "@/features/auth/hooks/use-profile";
import { useCurrentWorkspace, useBioPages, CreateProjectModal } from "@/features/bio-pages";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/navigation/page-header";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/_authenticated/app/")({
  component: Overview,
});

function Overview() {
  const session = useSession();
  const userId = session.status === "authenticated" ? session.session.user.id : undefined;
  const { data: profile } = useProfile(userId);
  const { workspace, isLoading: wsLoading } = useCurrentWorkspace();
  const { data: pages, isLoading } = useBioPages(workspace?.id);
  const [createOpen, setCreateOpen] = useState(false);

  const openCreate = () => {
    if (!userId) {
      toast.error("Please sign in again to create a bio page.");
      return;
    }
    if (wsLoading) {
      toast.message("Loading your workspace…");
      return;
    }
    if (!workspace) {
      toast.error("No workspace available. Please refresh the page.");
      console.error("[create bio page] missing workspace for user", userId);
      return;
    }
    setCreateOpen(true);
  };


  const recent = useMemo(() => (pages ?? []).slice(0, 4), [pages]);
  const stats = useMemo(() => {
    const list = pages ?? [];
    return {
      total: list.length,
      published: list.filter((p) => p.status === "published").length,
      draft: list.filter((p) => p.status === "draft").length,
    };
  }, [pages]);

  const displayName = profile?.display_name ?? profile?.username ?? "there";

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description={workspace ? `Workspace: ${workspace.name}` : "Set up your first bio page."}
        actions={
          <Button onClick={openCreate} className="gap-1">
            <Plus className="h-4 w-4" /> New bio page
          </Button>
        }
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total projects" value={stats.total} icon={Link2} loading={isLoading} />
        <StatCard label="Published" value={stats.published} icon={Rocket} loading={isLoading} />
        <StatCard label="Drafts" value={stats.draft} icon={Clock} loading={isLoading} />
      </div>

      {/* Quick actions */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Quick actions
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickTile
            icon={Plus}
            title="New bio page"
            description="Start a fresh project"
            onClick={openCreate}
          />
          <QuickTile
            icon={Link2}
            title="My projects"
            description="Manage all bio pages"
            to="/app/projects"
          />
          <QuickTile
            icon={Images}
            title="Media library"
            description="Assets & uploads"
            to="/app/media"
          />
          <QuickTile
            icon={BarChart3}
            title="Analytics"
            description="Coming soon"
            to="/app/analytics"
            soon
          />
        </div>
      </section>

      {/* Recent projects */}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Recent projects
          </h2>
          <Link
            to="/app/projects"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-8 w-8" />}
            title="No projects yet"
            description="Create your first bio page to reserve your link."
            action={
              <Button onClick={openCreate} className="gap-1">
                <Plus className="h-4 w-4" /> Create first project
              </Button>
            }
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recent.map((p) => (
              <Card key={p.id} className="transition-colors hover:bg-accent/30">
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-sm font-bold text-primary">
                    {p.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{p.name}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      zupix.link/{p.slug} · {p.status}
                    </div>
                  </div>
                  <div className="hidden text-right text-xs text-muted-foreground sm:block">
                    {formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Recent activity — placeholder empty state */}
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Recent activity
        </h2>
        <EmptyState
          icon={<Clock className="h-8 w-8" />}
          title="No activity yet"
          description="Your recent edits and events will show up here."
        />
      </section>

      {workspace && userId && (
        <CreateProjectModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          workspaceId={workspace.id}
          ownerId={userId}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  loading,
}: {
  label: string;
  value: number;
  icon: typeof Link2;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <div className="text-3xl font-semibold tracking-tight">{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickTile({
  icon: Icon,
  title,
  description,
  to,
  onClick,
  soon,
}: {
  icon: typeof Plus;
  title: string;
  description: string;
  to?: string;
  onClick?: () => void;
  soon?: boolean;
}) {
  const inner = (
    <Card className="group h-full cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-sm">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-medium">{title}</div>
            {soon && (
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase text-muted-foreground">
                Soon
              </span>
            )}
          </div>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardContent>
    </Card>
  );
  if (to) return <Link to={to}>{inner}</Link>;
  return (
    <button type="button" onClick={onClick} className="text-left">
      {inner}
    </button>
  );
}
