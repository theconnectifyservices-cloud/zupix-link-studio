import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { Plus, LayoutGrid, List, Search as SearchIcon, Sparkles } from "lucide-react";
import {
  useCurrentWorkspace,
  useBioPages,
  CreateProjectModal,
  ProjectCard,
  type BioPageRow,
  type BioPageStatus,
} from "@/features/bio-pages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/shared/ui/empty-state";
import { PageHeader } from "@/shared/navigation/page-header";
import { useDebounce } from "@/hooks/use-debounce";

const searchSchema = z.object({
  new: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/app/projects")({
  validateSearch: zodValidator(searchSchema),
  component: ProjectsPage,
});

type SortKey = "updated" | "created" | "oldest" | "alpha";
type StatusFilter = "all" | BioPageStatus;

function ProjectsPage() {
  const { workspace, userId } = useCurrentWorkspace();
  const { data, isLoading } = useBioPages(workspace?.id);
  const navigate = useNavigate();
  const search = Route.useSearch();

  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("updated");
  const [status, setStatus] = useState<StatusFilter>("all");
  const debounced = useDebounce(query, 250);

  // Auto-open modal via ?new=1
  useEffect(() => {
    if (search.new) {
      setCreateOpen(true);
      navigate({ to: "/app/projects", search: {}, replace: true });
    }
  }, [search.new, navigate]);

  const filtered = useMemo(() => {
    let list: BioPageRow[] = data ?? [];
    if (status !== "all") list = list.filter((p) => p.status === status);
    if (debounced.trim()) {
      const q = debounced.trim().toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    switch (sort) {
      case "updated":
        sorted.sort((a, b) => b.updated_at.localeCompare(a.updated_at));
        break;
      case "created":
        sorted.sort((a, b) => b.created_at.localeCompare(a.created_at));
        break;
      case "oldest":
        sorted.sort((a, b) => a.created_at.localeCompare(b.created_at));
        break;
      case "alpha":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }
    return sorted;
  }, [data, status, debounced, sort]);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="My Bio Pages"
        description="Create, edit, and organize your bio pages."
        breadcrumbs={[{ label: "Dashboard", href: "/app" }, { label: "My Bio Pages" }]}
        actions={
          <Button onClick={() => setCreateOpen(true)} className="gap-1">
            <Plus className="h-4 w-4" /> New project
          </Button>
        }
      />

      {/* Toolbar */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects…"
            aria-label="Search projects"
            className="pl-9"
          />
        </div>
        <Tabs value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-[160px]" aria-label="Sort">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Last updated</SelectItem>
            <SelectItem value="created">Newest</SelectItem>
            <SelectItem value="oldest">Oldest</SelectItem>
            <SelectItem value="alpha">Alphabetical</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center rounded-md border p-0.5">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView("grid")}
            aria-label="Grid view"
            aria-pressed={view === "grid"}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setView("list")}
            aria-label="List view"
            aria-pressed={view === "list"}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className={view === "grid" ? "h-56 rounded-lg" : "h-16 rounded-lg"} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        (data?.length ?? 0) === 0 ? (
          <EmptyState
            icon={<Sparkles className="h-8 w-8" />}
            title="No bio pages yet"
            description="Create your first bio page and reserve your unique link."
            action={
              <Button onClick={() => setCreateOpen(true)} className="gap-1">
                <Plus className="h-4 w-4" /> Create your first project
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<SearchIcon className="h-8 w-8" />}
            title="No results"
            description="Try adjusting your search or filters."
          />
        )
      ) : (
        <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "space-y-2"}>
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} view={view} />
          ))}
        </div>
      )}

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
