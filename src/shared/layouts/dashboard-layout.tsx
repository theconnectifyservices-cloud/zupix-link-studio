import type { ReactNode } from "react";
import { Sidebar } from "@/shared/navigation/sidebar";
import { Topbar } from "@/shared/navigation/topbar";
import { BottomNav } from "@/features/mobile";
import { DesktopShortcutsHost } from "@/features/desktop";
import { useWorkspaceLayout } from "@/features/desktop";

/** Authenticated app shell for the workspace dashboard. */
export function DashboardLayout({ children }: { children: ReactNode }) {
  const mode = useWorkspaceLayout((s) => s.mode);
  const focus = mode === "focus";
  const compact = mode === "compact" || mode === "dense";
  return (
    <div className="flex min-h-dvh w-full bg-background pt-[env(safe-area-inset-top)]">
      <DesktopShortcutsHost />
      {!focus && <Sidebar />}
      <div className="flex min-w-0 flex-1 flex-col">
        {!focus && <Topbar />}
        <main
          className={
            compact
              ? "min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-3 pb-[calc(5rem+env(safe-area-inset-bottom))] sm:px-4 lg:px-5 lg:pb-3"
              : "min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-6"
          }
        >
          {children}
        </main>
      </div>
      {!focus && <BottomNav />}
    </div>
  );
}

