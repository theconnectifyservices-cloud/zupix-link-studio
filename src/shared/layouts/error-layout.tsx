import type { ReactNode } from "react";

export function ErrorLayout({
  code = "500",
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  actions,
}: {
  code?: string;
  title?: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="text-6xl font-bold text-foreground">{code}</p>
        <h1 className="mt-4 text-xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {actions && <div className="mt-6 flex justify-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
