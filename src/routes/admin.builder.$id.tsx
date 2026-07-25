import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/builder/$id")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/builder/$id", params: { id: params.id } });
  },
});
