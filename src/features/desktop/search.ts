import { supabase } from "@/integrations/supabase/client";

export type SearchScope =
  | "bio"
  | "template"
  | "asset"
  | "analytics"
  | "user"
  | "setting"
  | "ai";

export interface SearchResult {
  id: string;
  scope: SearchScope;
  title: string;
  subtitle?: string;
  to?: string;
  params?: Record<string, string>;
}

const STATIC_INDEX: SearchResult[] = [
  { id: "nav.dashboard", scope: "setting", title: "Dashboard", to: "/app" },
  { id: "nav.projects", scope: "bio", title: "Projects", to: "/app/projects" },
  { id: "nav.templates", scope: "template", title: "Templates", to: "/app/templates" },
  { id: "nav.media", scope: "asset", title: "Media Library", to: "/app/media" },
  { id: "nav.analytics", scope: "analytics", title: "Analytics", to: "/app/analytics" },
  { id: "nav.conversions", scope: "analytics", title: "Conversions", to: "/app/conversions" },
  { id: "nav.campaigns", scope: "analytics", title: "Campaigns", to: "/app/campaigns" },
  { id: "nav.ai", scope: "ai", title: "AI Workspace", to: "/app/ai" },
  { id: "nav.settings", scope: "setting", title: "Settings", to: "/app/settings" },
  { id: "nav.team", scope: "user", title: "Team", to: "/app/team" },
  { id: "nav.billing", scope: "setting", title: "Billing", to: "/app/billing" },
  { id: "nav.domains", scope: "setting", title: "Domains", to: "/app/domains" },
];

/** Global search: static navigation + workspace-scoped bio pages. */
export async function globalSearch(
  query: string,
  workspaceId: string | null,
): Promise<SearchResult[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const local = STATIC_INDEX.filter(
    (r) => r.title.toLowerCase().includes(q) || r.scope.includes(q),
  );
  const remote: SearchResult[] = [];
  if (workspaceId) {
    const { data } = await supabase
      .from("bio_pages" as never)
      .select("id,name,slug,status")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .ilike("name", `%${q}%`)
      .limit(8);
    for (const row of (data ?? []) as Array<{
      id: string;
      name: string;
      slug: string;
      status: string;
    }>) {
      remote.push({
        id: `bio.${row.id}`,
        scope: "bio",
        title: row.name,
        subtitle: `${row.status} · /${row.slug}`,
        to: "/app/builder/$id",
        params: { id: row.id },
      });
    }
  }
  return [...remote, ...local].slice(0, 20);
}
