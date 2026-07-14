import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { PublicLayout } from "@/shared/layouts";
import { Button } from "@/components/ui/button";
import { APP_CONFIG } from "@/config/app.config";

export const Route = createFileRoute("/")({
  component: Index,
});

const highlights = [
  "Email + password and Google sign-in",
  "Automatic workspace on signup",
  "Unique @username reservations",
  "Onboarding + account settings",
  "Row-level security by default",
  "Session persistence & secure logout",
];

function Index() {
  return (
    <PublicLayout>
      <section className="mx-auto flex min-h-dvh max-w-4xl flex-col justify-center px-6 py-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Phase LS-02 · Identity & Workspace
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {APP_CONFIG.name}
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Premium bio link platform. Authentication, user identity, and workspace
          foundation are live. Create an account to try the flow.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/auth" search={{ mode: "signup" }}>
              Get started <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {highlights.map((p) => (
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
          Awaiting approval to start Phase LS-03.
        </p>
      </section>
    </PublicLayout>
  );
}
