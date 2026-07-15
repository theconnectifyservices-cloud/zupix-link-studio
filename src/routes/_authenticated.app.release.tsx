import { createFileRoute } from "@tanstack/react-router";
import { ReleaseCenter } from "@/features/release";

export const Route = createFileRoute("/_authenticated/app/release")({
  component: ReleaseCenter,
});
