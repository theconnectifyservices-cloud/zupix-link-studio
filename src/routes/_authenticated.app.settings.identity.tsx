import { createFileRoute } from "@tanstack/react-router";
import { IdentityCenter } from "@/features/identity";

export const Route = createFileRoute("/_authenticated/app/settings/identity")({
  component: IdentityCenter,
});
