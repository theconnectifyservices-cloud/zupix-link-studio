import type { ReactNode } from "react";
import { Sidebar } from "@/shared/navigation/sidebar";
import { Topbar } from "@/shared/navigation/topbar";

/** Authenticated app shell for the workspace dashboard. */
export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
