import { createFileRoute } from "@tanstack/react-router";
import { OperationsCenter } from "@/features/operations";

export const Route = createFileRoute("/_authenticated/app/operations")({
  component: OperationsCenter,
});
