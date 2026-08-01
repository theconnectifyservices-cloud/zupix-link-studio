import { createFileRoute } from "@tanstack/react-router";
import { BrandingSettings } from "@/features/growth";

export const Route = createFileRoute("/_authenticated/app/settings/branding")({
  head: () => ({
    meta: [
      { title: "Branding Settings · ZUPIX Link Studio" },
      {
        name: "description",
        content: "Choose how the Built with ZUPIX badge appears on your public bio pages.",
      },
      { property: "og:title", content: "Branding Settings · ZUPIX Link Studio" },
      {
        property: "og:description",
        content: "Hide, compact or full ZUPIX branding on your published bio pages.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <BrandingSettings />,
});
