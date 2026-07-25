import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/profiles")({
  beforeLoad: () => {
    throw redirect({ to: "/app/settings/profile" });
  },
});
