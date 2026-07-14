import { FileText, Lock } from "lucide-react";
import { EmptyState } from "@/shared/ui/empty-state";

/** Placeholder — multi-page bio pages arrive in a later phase. */
export function PagesPanel() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 rounded-md border bg-card p-3">
        <FileText className="h-4 w-4 text-primary" />
        <div className="flex-1 text-sm font-medium">Home</div>
        <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] text-primary">Current</span>
      </div>
      <EmptyState
        icon={<Lock className="h-6 w-6" />}
        title="Multi-page support"
        description="Add multiple linked pages in an upcoming release."
      />
    </div>
  );
}
