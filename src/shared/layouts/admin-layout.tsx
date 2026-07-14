import type { ReactNode } from "react";
import { Sidebar } from "@/shared/navigation/sidebar";
import { Topbar } from "@/shared/navigation/topbar";

/** Admin panel shell (superuser-only routes). */
export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full bg-background">
      <Sidebar variant="admin" />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar variant="admin" />
        <main className="flex-1 overflow-auto px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
