import type { ReactNode } from "react";
import { Sidebar } from "@/shared/navigation/sidebar";
import { Topbar } from "@/shared/navigation/topbar";
import { BottomNav } from "@/features/mobile";

/** Authenticated app shell for the workspace dashboard. */
export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-background pt-[env(safe-area-inset-top)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto px-4 py-6 pb-24 sm:px-6 lg:px-8 lg:pb-6">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
