import type { ReactNode } from "react";
import { Wrench } from "lucide-react";
import { APP_CONFIG } from "@/config/app.config";

export function MaintenanceLayout({
  title = "We'll be right back",
  description = "We're performing scheduled maintenance. Thanks for your patience.",
  children,
}: {
  title?: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Wrench className="h-6 w-6 text-muted-foreground" aria-hidden />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {children && <div className="mt-6">{children}</div>}
        <p className="mt-8 text-xs text-muted-foreground">{APP_CONFIG.name}</p>
      </div>
    </div>
  );
}
