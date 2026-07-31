import { createFileRoute } from "@tanstack/react-router";
import { AdminUsers } from "@/features/licenses";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "Users · ZUPIX Admin" },
      {
        name: "description",
        content: "Manage ZUPIX accounts: reset passwords, issue temporary credentials and force password changes.",
      },
      { property: "og:title", content: "Users · ZUPIX Admin" },
      { property: "og:description", content: "Account and password administration for ZUPIX Link Studio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-7xl p-6">
      <AdminUsers />
    </div>
  ),
});
