import { formatDistanceToNow } from "date-fns";
import { Sparkles } from "lucide-react";
import { useActivity } from "../hooks";

export function ActivityList({ workspaceId }: { workspaceId: string }) {
  const { data = [], isLoading } = useActivity(workspaceId);
  if (isLoading)
    return <p className="text-sm text-muted-foreground">Loading activity…</p>;
  if (data.length === 0)
    return <p className="text-sm text-muted-foreground">No AI activity yet.</p>;
  return (
    <ul className="space-y-2">
      {data.map((a) => (
        <li key={a.id} className="flex items-start gap-3 rounded-md border bg-card p-3 text-sm">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate">{a.summary}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })} · {a.kind}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
