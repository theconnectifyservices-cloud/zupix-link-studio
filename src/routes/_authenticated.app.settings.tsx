import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/app/settings/profile", label: "Profile" },
  { to: "/app/settings/identity", label: "Identity" },
  { to: "/app/settings/security", label: "Security" },
  { to: "/app/settings/password", label: "Password" },
  { to: "/app/settings/sessions", label: "Sessions" },
  { to: "/app/settings/notifications", label: "Notifications" },
  { to: "/app/settings/branding", label: "Branding" },
  { to: "/app/settings/preferences", label: "Preferences" },

] as const;

export const Route = createFileRoute("/_authenticated/app/settings")({
  component: SettingsShell,
});

function SettingsShell() {
  const { pathname } = useLocation();
  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account and preferences.</p>
      </header>
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <nav aria-label="Settings sections">
          <ul className="flex flex-row gap-1 overflow-x-auto md:flex-col">
            {tabs.map((t) => {
              const active = pathname === t.to || pathname.startsWith(t.to + "/");
              return (
                <li key={t.to}>
                  <Link
                    to={t.to}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm transition-colors",
                      active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
                    )}
                  >
                    {t.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
