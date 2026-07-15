import { createFileRoute } from "@tanstack/react-router";
import { LaunchCenter } from "@/features/launch";

export const Route = createFileRoute("/_authenticated/app/launch")({
  component: LaunchCenter,
  head: () => ({
    meta: [
      { title: "Launch Center — ZUPIX Link Studio v1.0" },
      { name: "description", content: "Documentation, help center, success resources and Version 1.0 certification." },
    ],
  }),
});
