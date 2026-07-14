import type { ReactNode } from "react";

/** Marketing / public-facing layout. */
export function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-dvh bg-background text-foreground">{children}</div>;
}
