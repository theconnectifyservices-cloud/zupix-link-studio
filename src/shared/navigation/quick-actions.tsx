import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  return (
    <Button size="sm" className="gap-1" aria-label="Create new">
      <Plus className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">New</span>
    </Button>
  );
}
