import { Plus } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const navigate = useNavigate();
  return (
    <Button
      size="sm"
      className="gap-1"
      aria-label="Create new bio page"
      onClick={() => navigate({ to: "/app/projects", search: { new: "1" } as never })}
    >
      <Plus className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">New</span>
    </Button>
  );
}
