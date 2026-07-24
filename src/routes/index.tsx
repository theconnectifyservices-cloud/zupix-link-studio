import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/shared/layouts";
import { LandingHero } from "@/features/landing/hero";
import { LandingShowcase } from "@/features/landing/showcase";

const TITLE = "ZUPIX Link Studio — Build Beautiful Bio Links That Actually Convert";
const DESCRIPTION =
  "Premium bio links, mini-websites, UPI payments, products, custom domains and a visual builder — one studio to run your entire digital presence.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <PublicLayout>
      <LandingHero />
      <LandingShowcase />
    </PublicLayout>
  );
}
