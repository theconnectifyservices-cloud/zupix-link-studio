import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { PublicLayout } from "@/shared/layouts";
import { APP_CONFIG } from "@/config/app.config";

export const Route = createFileRoute("/")({
  component: Index,
});

const pillars = [
  "Feature-based architecture",
  "Design system + tokens",
  "Reusable component library",
  "Global layouts & navigation",
  "Centralized state (Zustand)",
  "Error & loading system",
  "Performance foundation",
  "Security foundation",
  "Responsive 320 → 1920",
  "Accessibility ready",
];

function Index() {
  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-dvh max-w-4xl flex-col justify-center px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Phase LS-01 · Foundation
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {APP_CONFIG.name}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {APP_CONFIG.description} The foundation layer is ready. Business features
          (auth, dashboard, bio builder, analytics, payments) will land in the
          next phases.
        </p>

        <ul className="mt-10 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {pillars.map((p) => (
            <li
              key={p}
              className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm text-foreground"
            >
              <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden />
              {p}
            </li>
          ))}
        </ul>

        <p className="mt-10 text-xs text-muted-foreground">
          Awaiting approval to start Phase LS-02.
        </p>
      </section>
    </PublicLayout>
  );
}
