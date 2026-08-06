import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/index")({
  beforeLoad: () => {
    // Landing on /admin directly redirects to the dashboard
    throw redirect({ to: "/admin/dashboard" });
  },
});

function redirect(opts: { to: string }) {
  // TanStack redirect helper
  return { ...opts, isRedirect: true };
}
