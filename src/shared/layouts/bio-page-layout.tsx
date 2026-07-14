import type { ReactNode } from "react";

/** Public bio page (/:username) — edge-to-edge canvas, no chrome. */
export function BioPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-8">{children}</main>
    </div>
  );
}
