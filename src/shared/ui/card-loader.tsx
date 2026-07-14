import { Skeleton } from "@/components/ui/skeleton";

export function CardLoader() {
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}
