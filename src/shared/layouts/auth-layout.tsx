import type { ReactNode } from "react";
import { APP_CONFIG } from "@/config/app.config";

/** Centered auth shell: /auth/login, /auth/signup, /auth/forgot */
export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="flex items-center justify-between px-6 py-4">
        <a href="/" className="text-sm font-semibold tracking-tight">
          {APP_CONFIG.shortName}
        </a>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
