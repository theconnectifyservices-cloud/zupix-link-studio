import type { ReactNode } from "react";
import { Topbar } from "@/shared/navigation/topbar";

/** Editor shell — content-heavy, split canvas. */
export function EditorLayout({
  sidebar,
  preview,
  children,
}: {
  sidebar?: ReactNode;
  preview?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Topbar />
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[280px_1fr_380px]">
        <aside className="border-r bg-muted/20 p-4 lg:block">{sidebar}</aside>
        <section className="min-w-0 overflow-auto p-4">{children}</section>
        <aside className="hidden border-l bg-muted/20 p-4 lg:block">{preview}</aside>
      </div>
    </div>
  );
}
