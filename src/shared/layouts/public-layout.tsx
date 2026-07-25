import type { ReactNode } from "react";
import { LandingHeader } from "@/shared/navigation/landing-header";

/** Marketing / public-facing layout. */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <LandingHeader />
      {children}
    </div>
  );
}
