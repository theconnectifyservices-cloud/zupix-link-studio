import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { buildWorkspaceContext, type AiWorkspaceContext } from "../context-engine";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/shared/ui/spinner";

interface Props {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  userId: string;
}

export function ContextSummary(props: Props) {
  const [ctx, setCtx] = useState<AiWorkspaceContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    buildWorkspaceContext(props)
      .then((c) => {
        if (!cancelled) setCtx(c);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [props]);

  if (loading) return <Spinner />;
  if (!ctx) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-medium">Workspace context</h3>
        <Badge variant="secondary">Permission-aware</Badge>
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
        <Stat label="Bio pages" value={ctx.counts.bioPages} />
        <Stat label="Assets" value={ctx.counts.mediaAssets} />
        <Stat label="Campaigns" value={ctx.counts.campaigns} />
        <Stat label="Domains" value={ctx.counts.domains} />
        <Stat label="Recent pages" value={ctx.recentBioPages.length} />
      </dl>
      {ctx.recentBioPages.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Recent bio pages</p>
          <ul className="space-y-1 text-xs">
            {ctx.recentBioPages.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span className="truncate">{p.name}</span>
                <span className="text-muted-foreground">/{p.slug}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  );
}
