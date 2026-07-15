import { createFileRoute } from "@tanstack/react-router";
import { SecurityDashboard } from "@/features/security/components/security-dashboard";

export const Route = createFileRoute("/_authenticated/app/security")({
  head: () => ({
    meta: [
      { title: "Security · ZUPIX" },
      { name: "description", content: "Enterprise security hardening, findings and audit log." },
    ],
  }),
  component: SecurityPage,
});

function SecurityPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 md:py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Security Center</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          HTTP headers, auth, RBAC, input validation, uploads, API, secrets and audit review.
        </p>
      </div>
      <SecurityDashboard />
    </div>
  );
}
