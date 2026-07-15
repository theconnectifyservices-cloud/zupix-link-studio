import { WifiOff } from "lucide-react";
import { useOnline } from "../hooks";

export function OfflineIndicator() {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-xs font-medium text-amber-950">
      <WifiOff className="h-3.5 w-3.5" />
      You&apos;re offline — showing cached data
    </div>
  );
}
